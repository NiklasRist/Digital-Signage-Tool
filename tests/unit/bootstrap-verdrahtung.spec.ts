// Verhaltenstests zum Main-Bootstrap src/main/index.ts, soweit die bisher verdrahteten
// Glieder der Kette ihn betreffen: die Anmeldungen MIT Fenster aus M2 (#269, #71) und M6
// (#191), die Anmeldungen OHNE Fenster aus M1 (#76, #77), M3 (#270), M5 (#153) und M6
// (#189, #190), das Aufraeumen aus M6 (#172) sowie der Beenden-Ablauf mit den beiden
// Flushs (#47, #98).
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

  type FlushErgebnis = { ok: true; wert: undefined } | { ok: false; fehler: { code: string; meldung: string } };
  const gelungen: FlushErgebnis = { ok: true, wert: undefined };

  return {
    protokoll,
    fenster,
    binaries: { ffmpeg: true, ffprobe: true },
    // Antworten der beiden Flushs, je Aufruf abgearbeitet; laeuft die Liste leer,
    // gelingt der Flush. So laesst sich "erst Fehlschlag, dann Erfolg" fuer die
    // Wiederholung stellen, ohne die Reihenfolge zu erraten.
    flushAntworten: { projekt: [] as FlushErgebnis[], vorlagen: [] as FlushErgebnis[] },
    gelungen,
    hoerer: {} as Record<string, ((ereignis: { preventDefault: () => void }) => void) | undefined>,
    dialogAntwort: 0,
    dialogAufrufe: [] as { buttons: string[]; defaultId?: number; cancelId?: number; detail?: string }[],

    verdrahteProjectStoreIPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreIPC");
    }),
    verdrahteProjectStoreNachtragIPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreNachtragIPC");
    }),
    meldeRenderHandlerAn: vi.fn(() => {
      protokoll.push("meldeRenderHandlerAn");
    }),
    verdrahteConfigStoreIPC: vi.fn(() => {
      protokoll.push("verdrahteConfigStoreIPC");
    }),
    verdrahteMedienIPC: vi.fn(() => {
      protokoll.push("verdrahteMedienIPC");
    }),
    registriereMedienHandler: vi.fn(() => {
      protokoll.push("registriereMedienHandler");
    }),
    meldeExportHandlerAn: vi.fn(() => {
      protokoll.push("meldeExportHandlerAn");
    }),
    verdrahteQueueIPC: vi.fn((uebergebenesFenster: object) => {
      protokoll.push("verdrahteQueueIPC");
      // Festhalten, WAS uebergeben wurde - nicht nur, DASS gerufen wurde.
      void uebergebenesFenster;
    }),
    verdrahteExportUndFortschrittIPC: vi.fn((uebergebenesFenster: object) => {
      protokoll.push("verdrahteExportUndFortschrittIPC");
      void uebergebenesFenster;
    }),

    // Das Aufraeumen liefert absichtlich KEIN echtes Promise, sondern ein Thenable mit
    // ausgespaehtem `then`. Damit wird "wird nicht abgewartet" GEMESSEN statt behauptet:
    // `void x()` fasst `then` nie an, `await x()` ruft es.
    thenSpion: vi.fn(),
    raeumeVerwaisteArbeitsbereiche: vi.fn(() => {
      protokoll.push("raeumeVerwaisteArbeitsbereiche");
      return { then: h.thenSpion } as unknown as Promise<number>;
    }),

    flushBeimBeenden: vi.fn(async (): Promise<FlushErgebnis> => {
      // Ein echter Mikrotask-Sprung, damit "abgewartet" ueberhaupt messbar ist: Ohne
      // ihn liefe die Fortsetzung synchron und der Test koennte await nicht von
      // "nicht await" unterscheiden.
      await Promise.resolve();
      protokoll.push("flushBeimBeenden");
      return h.flushAntworten.projekt.shift() ?? h.gelungen;
    }),
    flushBestand: vi.fn(async (): Promise<FlushErgebnis> => {
      await new Promise((weiter) => setTimeout(weiter, 0));
      protokoll.push("flushBestand");
      return h.flushAntworten.vorlagen.shift() ?? h.gelungen;
    }),

    zeigeFehler: vi.fn(),
    beende: vi.fn(),
    quit: vi.fn(() => {
      protokoll.push("quit");
    }),
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
      // Die Hoerer werden festgehalten, damit der Beenden-Ablauf ausgeloest werden
      // kann - `before-quit` gibt es im Test sonst nicht.
      on: vi.fn((ereignis: string, hoerer: (e: { preventDefault: () => void }) => void) => {
        h.hoerer[ereignis] = hoerer;
      }),
      quit: h.quit,
      exit: h.beende,
    },
    BrowserWindow: FensterDoppel,
    dialog: {
      showErrorBox: h.zeigeFehler,
      showMessageBoxSync: vi.fn((optionen: { buttons: string[] }) => {
        h.protokoll.push("dialog");
        h.dialogAufrufe.push(optionen);
        return h.dialogAntwort;
      }),
    },
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

// Alle Verdrahtungen werden gestellt, weil ihre echten Fassungen beim Import bzw. beim
// Aufruf die IPC-Registry (#23/#25) und den Auftrags-Dispatcher (#60) beschreiben - das
// misst dann nicht mehr den Bootstrap, sondern deren Zustand ueber Testgrenzen hinweg.
vi.mock("../../src/main/ipc-gateway/project-store-verdrahtung", () => ({
  verdrahteProjectStoreIPC: h.verdrahteProjectStoreIPC,
}));

vi.mock("../../src/main/ipc-gateway/project-store-nachtrag", () => ({
  verdrahteProjectStoreNachtragIPC: h.verdrahteProjectStoreNachtragIPC,
}));

vi.mock("../../src/main/render-service/handler-anmeldung", () => ({
  meldeRenderHandlerAn: h.meldeRenderHandlerAn,
}));

vi.mock("../../src/main/ipc-gateway/config-store-verdrahtung", () => ({
  verdrahteConfigStoreIPC: h.verdrahteConfigStoreIPC,
}));

vi.mock("../../src/main/media-service/ipc-verdrahtung", () => ({
  verdrahteMedienIPC: h.verdrahteMedienIPC,
}));

vi.mock("../../src/main/media-service/handler-registrierung", () => ({
  registriereMedienHandler: h.registriereMedienHandler,
}));

vi.mock("../../src/main/export-service/handler-anmeldung", () => ({
  meldeExportHandlerAn: h.meldeExportHandlerAn,
}));

vi.mock("../../src/main/ipc-gateway/export-verdrahtung", () => ({
  verdrahteExportUndFortschrittIPC: h.verdrahteExportUndFortschrittIPC,
}));

vi.mock("../../src/main/render-service/arbeitsbereich", () => ({
  raeumeVerwaisteArbeitsbereiche: h.raeumeVerwaisteArbeitsbereiche,
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  flushBeimBeenden: h.flushBeimBeenden,
}));

vi.mock("../../src/main/vorlagen-store/schreibe-vorlagen", () => ({
  flushBestand: h.flushBestand,
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

/**
 * Loest `before-quit` aus und wartet den (asynchronen) Beenden-Ablauf ab.
 * Liefert, ob der Handler das Beenden aufgehalten hat.
 */
async function loeseBeendenAus(): Promise<boolean> {
  let aufgehalten = false;
  const hoerer = h.hoerer["before-quit"];
  if (hoerer === undefined) throw new Error("kein before-quit-Hoerer angemeldet");
  hoerer({
    preventDefault: () => {
      aufgehalten = true;
    },
  });
  // Zwei Zeitgeber-Durchlaeufe: Der zweite Flush haengt selbst an einem setTimeout,
  // der Dialog-Zweig kann eine weitere Runde brauchen.
  await new Promise((weiter) => setTimeout(weiter, 0));
  await new Promise((weiter) => setTimeout(weiter, 0));
  await new Promise((weiter) => setTimeout(weiter, 0));
  return aufgehalten;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.protokoll.length = 0;
  h.fenster.length = 0;
  h.binaries.ffmpeg = true;
  h.binaries.ffprobe = true;
  h.flushAntworten.projekt.length = 0;
  h.flushAntworten.vorlagen.length = 0;
  h.hoerer = {};
  h.dialogAntwort = 0;
  h.dialogAufrufe.length = 0;
});

describe("Main-Bootstrap - Startablauf: Reihenfolge der Schritte 5 bis 8", () => {
  it("laeuft in genau der Reihenfolge, die #3 festlegt", async () => {
    await starteBootstrap();

    // Die vollstaendige Kette der heute verdrahteten Stellen: Schritt 5 (Positionen 1,
    // 2, 4, 5, 6, 9, 10) VOR dem Fenster, Schritt 7 (Positionen 1, 2) danach, Schritt 8
    // zum Schluss. Die Luecken (5.3, 5.7, 5.8, 7.3) stehen bewusst nicht drin - ihre
    // Funktionen tragen noch den werfenden Geruest-Rumpf.
    expect(h.protokoll).toEqual([
      "verdrahteProjectStoreIPC",
      "verdrahteProjectStoreNachtragIPC",
      "verdrahteConfigStoreIPC",
      "verdrahteMedienIPC",
      "registriereMedienHandler",
      "meldeRenderHandlerAn",
      "meldeExportHandlerAn",
      "erstelleHauptfenster",
      "verdrahteQueueIPC",
      "verdrahteExportUndFortschrittIPC",
      "raeumeVerwaisteArbeitsbereiche",
    ]);
  });

  it("ruft jede verdrahtete Anmeldung genau einmal", async () => {
    await starteBootstrap();

    // Genau einmal, weil eine zweite Anmeldung desselben Kanals wirft (#23) bzw. die
    // erste Auftragsart-Anmeldung ersetzt (#60).
    for (const anmeldung of [
      h.verdrahteProjectStoreIPC,
      h.verdrahteProjectStoreNachtragIPC,
      h.verdrahteConfigStoreIPC,
      h.verdrahteMedienIPC,
      h.registriereMedienHandler,
      h.meldeRenderHandlerAn,
      h.meldeExportHandlerAn,
      h.verdrahteQueueIPC,
      h.verdrahteExportUndFortschrittIPC,
      h.raeumeVerwaisteArbeitsbereiche,
    ]) {
      expect(anmeldung).toHaveBeenCalledTimes(1);
    }
  });

  it("meldet nichts an, wenn der Binaerien-Selbsttest den Start abbricht", async () => {
    // Ohne ffmpeg startet die App nicht (#6, Schritt 3a). Dann darf auch kein Kanal
    // angemeldet werden - eine Verdrahtung auf ein Fenster, das es nicht gibt, waere
    // der erste Folgefehler.
    h.binaries.ffmpeg = false;

    await starteBootstrap();

    expect(h.zeigeFehler).toHaveBeenCalledTimes(1);
    expect(h.beende).toHaveBeenCalledWith(1);
    expect(h.fenster).toHaveLength(0);
    expect(h.protokoll).toEqual([]);
  });
});

describe("Main-Bootstrap - Schritt 5: die Anmeldungen OHNE Fenster (#76, #153, #77, #93, #92, #189, #190)", () => {
  it("ruft alle sieben ohne Argument", async () => {
    await starteBootstrap();

    // Keine von ihnen braucht ein Fenster - genau deshalb stehen sie in Schritt 5. Ein
    // durchgereichtes Argument waere das erste Anzeichen, dass jemand sie fuer eine
    // Anmeldung MIT Fenster gehalten hat.
    expect(h.verdrahteProjectStoreIPC).toHaveBeenCalledWith();
    expect(h.verdrahteProjectStoreNachtragIPC).toHaveBeenCalledWith();
    expect(h.verdrahteConfigStoreIPC).toHaveBeenCalledWith();
    expect(h.verdrahteMedienIPC).toHaveBeenCalledWith();
    expect(h.registriereMedienHandler).toHaveBeenCalledWith();
    expect(h.meldeRenderHandlerAn).toHaveBeenCalledWith();
    expect(h.meldeExportHandlerAn).toHaveBeenCalledWith();
  });

  it("meldet den project-Nachtrag UNMITTELBAR nach dem project-store", async () => {
    await starteBootstrap();

    // Position 2 direkt hinter Position 1 ist Vertrag aus #3: Beide bedienen denselben
    // Kanal-Namensraum `project:`, und nur wenn sie nebeneinander stehen, faellt eine
    // doppelte Registrierung sofort auf. "Irgendwann spaeter" genuegt hier nicht -
    // gemessen wird der unmittelbare Nachbar, nicht bloss die Reihenfolge.
    const eins = h.protokoll.indexOf("verdrahteProjectStoreIPC");
    expect(h.protokoll[eins + 1]).toBe("verdrahteProjectStoreNachtragIPC");
  });

  it("meldet den Render-Handler vor dem Export-Handler und beide vor dem Fenster", async () => {
    await starteBootstrap();

    // Positionen 9 und 10: die beiden Auftragsart-Handler. Ohne sie wird ein Auftrag
    // eingereiht und findet keinen Handler; ihre Reihenfolge untereinander ist die aus
    // #3, und keiner von beiden braucht ein Fenster.
    expect(h.protokoll.indexOf("meldeRenderHandlerAn")).toBeLessThan(
      h.protokoll.indexOf("meldeExportHandlerAn"),
    );
    expect(h.protokoll.indexOf("meldeExportHandlerAn")).toBeLessThan(
      h.protokoll.indexOf("erstelleHauptfenster"),
    );
  });

  it("meldet den project-store vor dem config-store und beides vor dem Fenster", async () => {
    await starteBootstrap();

    // Position 1 vor Position 4 - die Nummerierung aus #3 ist Vertrag, auch wo
    // Position 3 noch eine Luecke ist.
    expect(h.protokoll.indexOf("verdrahteProjectStoreIPC")).toBeLessThan(
      h.protokoll.indexOf("verdrahteConfigStoreIPC"),
    );
    expect(h.protokoll.indexOf("verdrahteConfigStoreIPC")).toBeLessThan(
      h.protokoll.indexOf("erstelleHauptfenster"),
    );
  });
});

describe("Main-Bootstrap - Schritt 7: die Anmeldungen MIT Fenster (#71, #191)", () => {
  it("uebergibt BEIDEN dasselbe Fenster aus erstelleHauptfenster", async () => {
    await starteBootstrap();

    // TK 9.1.1 Punkt 10: keine sucht sich ein Fenster selbst, und es gibt genau eines.
    expect(h.fenster).toHaveLength(1);
    expect(h.verdrahteQueueIPC).toHaveBeenCalledWith(h.fenster[0]);
    expect(h.verdrahteExportUndFortschrittIPC).toHaveBeenCalledWith(h.fenster[0]);
  });

  it("verdrahtet beide erst NACH der Fenstererzeugung", async () => {
    await starteBootstrap();

    expect(h.protokoll.indexOf("erstelleHauptfenster")).toBeLessThan(
      h.protokoll.indexOf("verdrahteQueueIPC"),
    );
    expect(h.protokoll.indexOf("verdrahteQueueIPC")).toBeLessThan(
      h.protokoll.indexOf("verdrahteExportUndFortschrittIPC"),
    );
  });
});

describe("Main-Bootstrap - Schritt 8: raeumeVerwaisteArbeitsbereiche (#172)", () => {
  it("wartet das Aufraeumen NICHT ab", async () => {
    await starteBootstrap();

    // Gemessen, nicht behauptet: Der Rueckgabewert ist ein Thenable. `void x()` fasst
    // sein `then` nie an, `await x()` ruft es sofort. Ein spaeter eingefuegtes await
    // faellt hier auf - und mit ihm die Zusage aus #3, dass ein hakendes oder
    // gesperrtes Temp-Verzeichnis den Start nicht aufhaelt.
    expect(h.raeumeVerwaisteArbeitsbereiche).toHaveBeenCalledTimes(1);
    expect(h.thenSpion).not.toHaveBeenCalled();
  });

  it("raeumt zuletzt auf, nach allen Anmeldungen", async () => {
    await starteBootstrap();

    expect(h.protokoll[h.protokoll.length - 1]).toBe("raeumeVerwaisteArbeitsbereiche");
  });
});

describe("Main-Bootstrap - Beenden-Ablauf (#47, #98)", () => {
  it("haelt das erste Beenden auf und stoesst es nach BEIDEN Flushs genau einmal erneut an", async () => {
    await starteBootstrap();
    h.protokoll.length = 0;

    const aufgehalten = await loeseBeendenAus();

    expect(aufgehalten).toBe(true);
    // Die Reihenfolge misst zugleich, dass beide EINZELN abgewartet werden: Beide
    // Flushs melden sich erst nach einem Mikrotask bzw. einem Zeitgeber-Durchlauf, das
    // Beenden steht dahinter. "Beim Beenden blockiert die App, bis der Schreibvorgang
    // abgeschlossen ist" (TK 9.5.4).
    expect(h.protokoll).toEqual(["flushBeimBeenden", "flushBestand", "quit"]);
    expect(h.quit).toHaveBeenCalledTimes(1);
  });

  it("laeuft beim zweiten before-quit nicht noch einmal an", async () => {
    await starteBootstrap();
    await loeseBeendenAus();
    h.protokoll.length = 0;

    // Electron schickt das Ereignis beim tatsaechlichen Herunterfahren erneut. Ohne die
    // Merkflagge liefe der ganze Ablauf wieder an - beim ersten Mal gemessen: 513 Mal.
    const nochmalAufgehalten = await loeseBeendenAus();

    expect(nochmalAufgehalten).toBe(false);
    expect(h.protokoll).toEqual([]);
  });

  it("zeigt bei einem Fehlschlag den Dialog und beendet NICHT von sich aus", async () => {
    // "Scheitert der Sofort-Flush beim BEENDEN, schliesst die App NICHT (bindend)."
    // (TK 9.5.4)
    h.flushAntworten.projekt.push({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "ENOSPC: no space left on device" },
    });
    // Der Dialog bleibt unbeantwortet stehen? Nein - er ist synchron. Hier wird
    // "Erneut versuchen" gewaehlt, und der zweite Versuch gelingt.
    h.dialogAntwort = 0;

    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    // Der Dialog kam NACH den beiden Flushs und VOR dem Beenden, und die Flushs liefen
    // danach ein zweites Mal - "Erneut versuchen fuehrt den Flush tatsaechlich erneut
    // aus" (DoD #3), nicht nur eine Meldung.
    expect(h.protokoll).toEqual([
      "flushBeimBeenden",
      "flushBestand",
      "dialog",
      "flushBeimBeenden",
      "flushBestand",
      "quit",
    ]);
  });

  it("bietet den Verwerfen-Knopf an, waehlt ihn aber nie vor", async () => {
    h.flushAntworten.vorlagen.push({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "EACCES: permission denied" },
    });
    // Diesmal die zweite Schaltflaeche: trotzdem schliessen.
    h.dialogAntwort = 1;

    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    expect(h.dialogAufrufe).toHaveLength(1);
    const optionen = h.dialogAufrufe[0]!;
    expect(optionen.buttons[0]).toBe("Erneut versuchen");
    expect(optionen.buttons[1]).toContain("verwerfen");
    // Weder Vorauswahl noch Escape-Ziel darf auf dem Verlust-Knopf liegen.
    expect(optionen.defaultId).toBe(0);
    expect(optionen.cancelId).toBe(0);
    // Die Ursache steht im Dialog, nicht nur im Protokoll.
    expect(optionen.detail).toContain("EACCES");
    // Und erst jetzt, auf ausdrueckliche Ansage, wird beendet.
    expect(h.protokoll).toEqual(["flushBeimBeenden", "flushBestand", "dialog", "quit"]);
  });

  it("fuehrt den zweiten Flush auch dann aus, wenn der erste scheitert", async () => {
    // Beide haengen nicht voneinander ab; ein Abbruch nach dem ersten Fehlschlag
    // verloere den Vorlagenbestand zusaetzlich, ohne etwas zu retten.
    h.flushAntworten.projekt.push({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Datenort nicht nutzbar" },
    });
    h.dialogAntwort = 1;

    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    expect(h.flushBestand).toHaveBeenCalledTimes(1);
    expect(h.dialogAufrufe[0]!.detail).toContain("project.json");
    expect(h.dialogAufrufe[0]!.detail).not.toContain("vorlagen.json");
  });
});
