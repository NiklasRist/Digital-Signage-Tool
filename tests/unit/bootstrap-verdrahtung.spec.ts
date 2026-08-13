// Verhaltenstests zum Main-Bootstrap src/main/index.ts, soweit #269 ihn betrifft:
// die eine Anmeldung MIT Fenster, die M2 hinterlassen hat.
//
// Electron wird gestellt (der echte Start braeuchte einen Fensterserver), ebenso die
// beiden Binary-Pruefungen (#6, sonst wuerden echte Prozesse gestartet) und die
// Protokoll-Registrierung (#9). NICHT gestellt ist die Reihenfolge selbst: Fenster-
// erzeugung und Verdrahtung schreiben in DASSELBE Protokoll, damit "danach" gemessen
// und nicht behauptet wird.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const protokoll: string[] = [];
  const fenster: object[] = [];
  return {
    protokoll,
    fenster,
    binaries: { ffmpeg: true, ffprobe: true },
    verdrahteQueueIPC: vi.fn((uebergebenesFenster: object) => {
      protokoll.push("verdrahteQueueIPC");
      // Festhalten, WAS uebergeben wurde - nicht nur, DASS gerufen wurde.
      void uebergebenesFenster;
    }),
    zeigeFehler: vi.fn(),
    beende: vi.fn(),
  };
});

vi.mock("electron", () => {
  class FensterDoppel {
    webContents = { send: vi.fn() };
    loadURL = vi.fn();
    loadFile = vi.fn();
    once = vi.fn();
    isDestroyed = () => false;
    constructor() {
      h.protokoll.push("erstelleHauptfenster");
      h.fenster.push(this);
    }
  }
  return {
    app: {
      whenReady: () => Promise.resolve(),
      on: vi.fn(),
      quit: vi.fn(),
      exit: h.beende,
    },
    BrowserWindow: FensterDoppel,
    dialog: { showErrorBox: h.zeigeFehler },
    session: { defaultSession: { webRequest: { onHeadersReceived: vi.fn() } } },
  };
});

vi.mock("../../src/main/ffmpeg-pfad", () => ({
  ermittleFfmpegPfad: () => "/pfad/ffmpeg",
  ermittleFfprobePfad: () => "/pfad/ffprobe",
  pruefeFfmpegVerfuegbar: () => Promise.resolve(h.binaries.ffmpeg),
  pruefeFfprobeVerfuegbar: () => Promise.resolve(h.binaries.ffprobe),
}));

vi.mock("../../src/main/media-protokoll", () => ({
  registriereMediaProtokollSchema: vi.fn(),
  registriereMediaProtokollHandlerStub: vi.fn(),
}));

vi.mock("../../src/main/auftrags-manager/ipc-verdrahtung", () => ({
  verdrahteQueueIPC: h.verdrahteQueueIPC,
}));

/**
 * Laedt den Bootstrap neu und wartet, bis der an app.whenReady() haengende Ablauf
 * durch ist.
 *
 * `resetModules` ist tragend: Der Startablauf ist ein Seiteneffekt des Imports, ein
 * zweiter Import ohne Zuruecksetzen bekaeme nur den zwischengespeicherten Modul-Stand
 * und liefe gar nicht mehr an.
 */
async function starteBootstrap(): Promise<void> {
  vi.resetModules();
  await import("../../src/main/index");
  // Ein Zeitgeber-Durchlauf liegt hinter ALLEN offenen Mikrotasks - das deckt die
  // await-Kette in whenReady().then(...) ab, ohne Ticks zu zaehlen.
  await new Promise((weiter) => setTimeout(weiter, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
  h.protokoll.length = 0;
  h.fenster.length = 0;
  h.binaries.ffmpeg = true;
  h.binaries.ffprobe = true;
});

describe("Main-Bootstrap (#269) - Schritt 7, Position 1: verdrahteQueueIPC (#71)", () => {
  it("ruft die Verdrahtung genau einmal", async () => {
    await starteBootstrap();

    expect(h.verdrahteQueueIPC).toHaveBeenCalledTimes(1);
  });

  it("uebergibt DAS Fenster aus erstelleHauptfenster als Parameter", async () => {
    await starteBootstrap();

    expect(h.fenster).toHaveLength(1);
    expect(h.verdrahteQueueIPC).toHaveBeenCalledWith(h.fenster[0]);
  });

  it("verdrahtet erst NACH der Fenstererzeugung", async () => {
    await starteBootstrap();

    expect(h.protokoll).toEqual(["erstelleHauptfenster", "verdrahteQueueIPC"]);
  });

  it("verdrahtet gar nicht, wenn der Binaerien-Selbsttest den Start abbricht", async () => {
    // Ohne ffmpeg startet die App nicht (#6, Schritt 3a). Dann darf auch kein Kanal
    // angemeldet werden - eine Verdrahtung auf ein Fenster, das es nicht gibt, waere
    // der erste Folgefehler.
    h.binaries.ffmpeg = false;

    await starteBootstrap();

    expect(h.zeigeFehler).toHaveBeenCalledTimes(1);
    expect(h.beende).toHaveBeenCalledWith(1);
    expect(h.fenster).toHaveLength(0);
    expect(h.verdrahteQueueIPC).not.toHaveBeenCalled();
  });
});
