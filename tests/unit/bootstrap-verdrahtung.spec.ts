// Verhaltenstests zum Main-Bootstrap src/main/index.ts, soweit die bisher verdrahteten
// Glieder der Kette ihn betreffen: die eine Anmeldung MIT Fenster aus M2 (#269) und die
// beiden Anmeldungen OHNE Fenster aus M3 (#270).
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
    verdrahteMedienIPC: vi.fn(() => {
      protokoll.push("verdrahteMedienIPC");
    }),
    registriereMedienHandler: vi.fn(() => {
      protokoll.push("registriereMedienHandler");
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

// Die beiden M3-Anmeldungen werden gestellt, weil ihre echten Fassungen beim Import
// die IPC-Registry (#23/#25) und den Auftrags-Dispatcher (#60) beschreiben - das
// misst dann nicht mehr den Bootstrap, sondern deren Zustand ueber Testgrenzen hinweg.
vi.mock("../../src/main/media-service/ipc-verdrahtung", () => ({
  verdrahteMedienIPC: h.verdrahteMedienIPC,
}));

vi.mock("../../src/main/media-service/handler-registrierung", () => ({
  registriereMedienHandler: h.registriereMedienHandler,
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

    // Die vollstaendige Kette bis heute: erst die beiden Anmeldungen OHNE Fenster
    // (Schritt 5), dann das Fenster (Schritt 6), dann die mit Fenster (Schritt 7).
    expect(h.protokoll).toEqual([
      "verdrahteMedienIPC",
      "registriereMedienHandler",
      "erstelleHauptfenster",
      "verdrahteQueueIPC",
    ]);
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

describe("Main-Bootstrap (#270) - Schritt 5, Positionen 5 und 6: M3 (#93, #92)", () => {
  it("ruft beide Anmeldungen genau einmal", async () => {
    await starteBootstrap();

    // Genau einmal, weil eine zweite Anmeldung desselben Kanals bzw. derselben
    // Auftragsart wirft (#23) bzw. die erste ersetzt (#60).
    expect(h.verdrahteMedienIPC).toHaveBeenCalledTimes(1);
    expect(h.registriereMedienHandler).toHaveBeenCalledTimes(1);
  });

  it("ruft beide ohne Argument", async () => {
    await starteBootstrap();

    // Beide brauchen kein Fenster - genau deshalb stehen sie in Schritt 5. Ein
    // durchgereichtes Argument waere das erste Anzeichen, dass jemand sie fuer eine
    // Anmeldung MIT Fenster gehalten hat.
    expect(h.verdrahteMedienIPC).toHaveBeenCalledWith();
    expect(h.registriereMedienHandler).toHaveBeenCalledWith();
  });

  it("meldet den Handler unmittelbar nach der IPC-Verdrahtung und beides VOR dem Fenster", async () => {
    await starteBootstrap();

    expect(h.protokoll.slice(0, 3)).toEqual([
      "verdrahteMedienIPC",
      "registriereMedienHandler",
      "erstelleHauptfenster",
    ]);
  });

  it("meldet nichts an, wenn der Binaerien-Selbsttest den Start abbricht", async () => {
    // Ohne ffprobe scheitert jeder Import (#6, Schritt 3a). Dann darf auch der
    // Import-Handler nicht angemeldet werden - sonst nimmt eine App, die gleich
    // beendet wird, noch Auftraege entgegen.
    h.binaries.ffprobe = false;

    await starteBootstrap();

    expect(h.verdrahteMedienIPC).not.toHaveBeenCalled();
    expect(h.registriereMedienHandler).not.toHaveBeenCalled();
  });
});
