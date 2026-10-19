// Verhaltenstests zum Main-Bootstrap src/main/index.ts, soweit die bisher verdrahteten
// Glieder der Kette ihn betreffen: die Anmeldungen MIT Fenster aus M2 (#269, #71) und M6
// (#191), die Anmeldungen OHNE Fenster aus M1 (#76, #77), M3 (#270), M4 (#271), M5 (#153)
// und M6 (#189, #190), das Aufraeumen aus M6 (#172) sowie der Beenden-Ablauf mit den
// beiden Flushs (#47, #98).
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
  type FensterDoppel = { [schluessel: string]: unknown };

  return {
    protokoll,
    fenster,
    binaries: { ffmpeg: true, ffprobe: true },
    // Antworten der beiden Flushs, je Aufruf abgearbeitet; laeuft die Liste leer,
    // gelingt der Flush. So laesst sich "erst Fehlschlag, dann Erfolg" fuer die
    // Wiederholung stellen, ohne die Reihenfolge zu erraten.
    flushAntworten: { projekt: [] as FlushErgebnis[], vorlagen: [] as FlushErgebnis[], marken: [] as FlushErgebnis[] },
    gelungen,
    hoerer: {} as Record<string, ((ereignis: { preventDefault: () => void }) => void) | undefined>,
    ententscheidungHoerer: null as unknown as (ereignis: unknown, nutzlast: { entscheidung: 'wiederholen' | 'verwerfen' }) => void,
    dialogAntwort: 0 as 0 | 1,
    webContentsSende: [] as unknown[],

    verdrahteProjectStoreIPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreIPC");
    }),
    verdrahteProjectStoreNachtragIPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreNachtragIPC");
    }),
    verdrahteProjectStoreNachtrag2IPC: vi.fn((): void => {
      protokoll.push("verdrahteProjectStoreNachtrag2IPC");
    }),
    verdrahteVorlagenNachtragIPC: vi.fn((): void => {
      protokoll.push("verdrahteVorlagenNachtragIPC");
    }),
    verdrahteSpeicherstatusIPC: vi.fn((_: object): void => {
      protokoll.push("verdrahteSpeicherstatusIPC");
    }),
    verdrahteProjectStoreNachtrag4IPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreNachtrag4IPC");
    }),
    verdrahteProjectStoreNachtrag3IPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreNachtrag3IPC");
    }),
    verdrahteProjectStoreNachtrag5IPC: vi.fn(() => {
      protokoll.push("verdrahteProjectStoreNachtrag5IPC");
    }),
    verdrahteMarkenIPC: vi.fn(() => {
      protokoll.push("verdrahteMarkenIPC");
    }),
    verdrahteMarkenSpeicherstatusIPC: vi.fn((_: object): void => {
      protokoll.push("verdrahteMarkenSpeicherstatusIPC");
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
    verdrahteVorlagenIPC: vi.fn(() => {
      protokoll.push("verdrahteVorlagenIPC");
    }),
    verdrahteQueueIPC: vi.fn((uebergebenesFenster: FensterDoppel) => {
      protokoll.push("verdrahteQueueIPC");
      // Festhalten, WAS uebergeben wurde - nicht nur, DASS gerufen wurde.
      void uebergebenesFenster;
    }),
    verdrahteExportUndFortschrittIPC: vi.fn((uebergebenesFenster: FensterDoppel) => {
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
    flushMarkenBestand: vi.fn(async (): Promise<FlushErgebnis> => {
      await new Promise((weiter) => setTimeout(weiter, 0));
      protokoll.push("flushMarkenBestand");
      return h.flushAntworten.marken.shift() ?? h.gelungen;
    }),
    // Die Aufnahmen: registerSchemesAsPrivileged (#309) wird GENAU EINMAL gerufen;
    // hier steht je Aufruf das uebergebene Array.
    schemataAnmeldungen: [] as unknown[][],

    zeigeFehler: vi.fn(),
    beende: vi.fn(),
    quit: vi.fn(() => {
      protokoll.push("quit");
    }),
  };
});

vi.mock("electron", () => {
  class FensterDoppel {
    webContents = { send: vi.fn((kanal: string, nutzlast: unknown) => {
      h.protokoll.push('send');
      h.webContentsSende.push({ kanal, nutzlast });
    }) };
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
    ipcMain: {
      // #336: der Rueckkanal beenden:entscheidung - der Test ist die Renderer-Seite.
      handleOnce: vi.fn((_kanal: string, hoerer: (ereignis: unknown, nutzlast: { entscheidung: string }) => void) => {
        h.protokoll.push("regBeendenEntscheidung");
        h.ententscheidungHoerer = hoerer;
      }),
    },
    protocol: {
      registerSchemesAsPrivileged: vi.fn((schemata: unknown[]) => {
        h.schemataAnmeldungen.push(schemata);
      }),
    },
    BrowserWindow: FensterDoppel,
    dialog: {
      showErrorBox: h.zeigeFehler,
    },
    // #431: der Bootstrap setzt ein eigenes Anwendungsmenue. Der Doppel stellt die
    // beiden Aufrufe - sonst wuerfe `Menu.setApplicationMenu` und der Startablauf
    // braeche mitten in der Kette ab.
    Menu: {
      buildFromTemplate: vi.fn((vorlage: unknown) => ({ vorlage })),
      setApplicationMenu: vi.fn(),
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
  // MEDIA_SCHEMA ist seit #321 DATEN; der Bootstrap (#309) durchreicht das Objekt
  // unverändert. Der Inhalt selbst prueft media-protokoll-schema.spec.ts (#321).
  MEDIA_SCHEMA: { scheme: "media", privileges: { secure: true, supportFetchAPI: true, stream: true, standard: true } },
  registriereMediaProtokollHandler: vi.fn(),
}));

vi.mock("../../src/main/project-store/einzel-instanz", () => ({
  erzwingeEinzelInstanz: vi.fn(() => "frei" as const),
}));
vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: vi.fn(() => "/tmp/datenort-test"),
}));
vi.mock("../../src/main/marken-store/marken-protokoll", () => ({
  MARKEN_SCHEMA: { scheme: "marken" },
  registriereMarkenProtokollHandler: vi.fn(),
}));

vi.mock("../../src/main/ipc-gateway/marken-verdrahtung", () => ({
  verdrahteMarkenIPC: h.verdrahteMarkenIPC,
}));

vi.mock("../../src/main/ipc-gateway/marken-speicherstatus-verdrahtung", () => ({
  verdrahteMarkenSpeicherstatusIPC: h.verdrahteMarkenSpeicherstatusIPC,
}));

vi.mock("../../src/main/marken-store/schreibe-marken", () => ({
  flushBestand: h.flushMarkenBestand,
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

// Q3/B (19.10.2026): Die fuenf Nachträge liegen in EINER Datei; die fuenf
// Einstiegspunkte bleiben, weil die Positionen 1-14 in src/main/index.ts Vertrag aus #3 sind.
vi.mock("../../src/main/ipc-gateway/project-store-nachtrag", () => ({
  verdrahteProjectStoreNachtragIPC: h.verdrahteProjectStoreNachtragIPC,
  verdrahteProjectStoreNachtrag2IPC: h.verdrahteProjectStoreNachtrag2IPC,
  verdrahteProjectStoreNachtrag3IPC: h.verdrahteProjectStoreNachtrag3IPC,
  verdrahteProjectStoreNachtrag4IPC: h.verdrahteProjectStoreNachtrag4IPC,
  verdrahteProjectStoreNachtrag5IPC: h.verdrahteProjectStoreNachtrag5IPC,
}));

vi.mock("../../src/main/ipc-gateway/speicherstatus-verdrahtung", () => ({
  verdrahteSpeicherstatusIPC: h.verdrahteSpeicherstatusIPC,
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

// Q3/B (19.10.2026): Der nachgetragene vorlagen-Kanal liegt in derselben Datei;
// der getrennte Einstiegspunkt bleibt wegen der Positionen 1-14 (Vertrag aus #3).
vi.mock("../../src/main/vorlagen-store/ipc-verdrahtung", () => ({
  verdrahteVorlagenIPC: h.verdrahteVorlagenIPC,
  verdrahteVorlagenNachtragIPC: h.verdrahteVorlagenNachtragIPC,
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
  // Der zweite und dritte Flush haengen je an einem Zeitgeber-Durchlauf; der neue
  // Ablauf (#336) haengt zusaetzlich am RUECKKANAL beenden:entscheidung.
  await new Promise((weiter) => setTimeout(weiter, 0));
  await new Promise((weiter) => setTimeout(weiter, 0));
  await new Promise((weiter) => setTimeout(weiter, 0));
  // Der Renderer antwortet entsprechend h.dialogAntwort (0 = wiederholen, 1 = verwerfen).
  if (h.ententscheidungHoerer !== null) {
    h.protokoll.push("entscheidung");
    h.ententscheidungHoerer(
      {},
      { entscheidung: h.dialogAntwort === 0 ? 'wiederholen' : 'verwerfen' },
    );
  }
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
  h.flushAntworten.marken.length = 0;
  h.schemataAnmeldungen.length = 0;
  h.hoerer = {};
  h.dialogAntwort = 0;
  h.ententscheidungHoerer = null as unknown as typeof h.ententscheidungHoerer;
  h.webContentsSende.length = 0;
});

describe("Main-Bootstrap - Startablauf: Reihenfolge der Schritte 5 bis 8", () => {
  it("laeuft in genau der Reihenfolge, die #3 festlegt", async () => {
    await starteBootstrap();

    // Die vollstaendige Kette der heute verdrahteten Stellen: Schritt 5 (Positionen 1
    // bis 14 mit #274/#304/#323/#426 geschlossen) VOR dem Fenster, Schritt 7 (Positionen 1
    // bis 4, mit #274/#304) danach, Schritt 8 zum Schluss; die Lueckenlosigkeit
    // stellt #331 fest (hinter #323, s. dessen index.ts-Verdrahtung).
    expect(h.protokoll).toEqual([
      "verdrahteProjectStoreIPC",
      "verdrahteProjectStoreNachtragIPC",
      "verdrahteProjectStoreNachtrag2IPC",
      "verdrahteConfigStoreIPC",
      "verdrahteMedienIPC",
      "registriereMedienHandler",
      "verdrahteVorlagenIPC",
      "verdrahteVorlagenNachtragIPC",
      "meldeRenderHandlerAn",
      "meldeExportHandlerAn",
      "verdrahteProjectStoreNachtrag4IPC",
      "verdrahteMarkenIPC",
      "verdrahteProjectStoreNachtrag3IPC",
      "verdrahteProjectStoreNachtrag5IPC",
      "erstelleHauptfenster",
      "verdrahteQueueIPC",
      "verdrahteExportUndFortschrittIPC",
      "verdrahteSpeicherstatusIPC",
      "verdrahteMarkenSpeicherstatusIPC",
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
      h.verdrahteProjectStoreNachtrag2IPC,
      h.verdrahteConfigStoreIPC,
      h.verdrahteMedienIPC,
      h.registriereMedienHandler,
      h.verdrahteVorlagenIPC,
      h.verdrahteVorlagenNachtragIPC,
      h.meldeRenderHandlerAn,
      h.meldeExportHandlerAn,
      h.verdrahteProjectStoreNachtrag4IPC,
      h.verdrahteMarkenIPC,
      h.verdrahteProjectStoreNachtrag3IPC,
      h.verdrahteProjectStoreNachtrag5IPC,
      h.verdrahteQueueIPC,
      h.verdrahteExportUndFortschrittIPC,
      h.verdrahteMarkenSpeicherstatusIPC,
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

describe("Main-Bootstrap - Schritt 5: die Anmeldungen OHNE Fenster (#76, #153, #77, #93, #92, #109, #189, #190)", () => {
  it("ruft alle acht ohne Argument", async () => {
    await starteBootstrap();

    // Keine von ihnen braucht ein Fenster - genau deshalb stehen sie in Schritt 5. Ein
    // durchgereichtes Argument waere das erste Anzeichen, dass jemand sie fuer eine
    // Anmeldung MIT Fenster gehalten hat.
    expect(h.verdrahteProjectStoreIPC).toHaveBeenCalledWith();
    expect(h.verdrahteProjectStoreNachtragIPC).toHaveBeenCalledWith();
    expect(h.verdrahteConfigStoreIPC).toHaveBeenCalledWith();
    expect(h.verdrahteMedienIPC).toHaveBeenCalledWith();
    expect(h.registriereMedienHandler).toHaveBeenCalledWith();
    expect(h.verdrahteVorlagenIPC).toHaveBeenCalledWith();
    expect(h.meldeRenderHandlerAn).toHaveBeenCalledWith();
    expect(h.meldeExportHandlerAn).toHaveBeenCalledWith();
    expect(h.verdrahteMarkenIPC).toHaveBeenCalledWith();
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

  it("meldet den vorlagen-store an Position 7, unmittelbar nach 6 und vor 8 (#271)", async () => {
    await starteBootstrap();

    // Position 7 ist Vertrag aus #3 (die Nummerierung bleibt auch mit Luecken). Position
    // 8 (#255) ist noch eine Luecke; gemessen wird der unmittelbare Nachbar links (6,
    // registriereMedienHandler) und dass 7 vor den uebrigen und vor dem Fenster liegt.
    const sechs = h.protokoll.indexOf("registriereMedienHandler");
    const sieben = h.protokoll.indexOf("verdrahteVorlagenIPC");
    expect(sechs).not.toBe(-1);
    expect(sieben).not.toBe(-1);
    expect(sieben).toBe(sechs + 1);
    expect(sieben).toBeLessThan(h.protokoll.indexOf("meldeRenderHandlerAn"));
    expect(sieben).toBeLessThan(h.protokoll.indexOf("erstelleHauptfenster"));
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
    expect(h.verdrahteMarkenSpeicherstatusIPC).toHaveBeenCalledWith(h.fenster[0]);
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

describe("Main-Bootstrap - Beenden-Ablauf (#47, #98, #277)", () => {
  it("haelt das erste Beenden auf und stoesst es nach ALLEN DREI Flushs genau einmal erneut an", async () => {
    await starteBootstrap();
    h.protokoll.length = 0;

    const aufgehalten = await loeseBeendenAus();

    expect(aufgehalten).toBe(true);
    // Die Reihenfolge misst zugleich, dass alle drei EINZELN abgewartet werden: Die
    // Flushs melden sich erst nach einem Mikrotask bzw. einem Zeitgeber-Durchlauf, das
    // Beenden steht dahinter. "Beim Beenden blockiert die App, bis der Schreibvorgang
    // abgeschlossen ist" (TK 9.5.4).
    expect(h.protokoll).toEqual(["flushBeimBeenden", "flushBestand", "flushMarkenBestand", "quit"]);
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

  it("schickt den Renderer-Dialog (beenden:status) und fuehrt nach 'wiederholen' die Flushs erneut aus", async () => {
    h.flushAntworten.projekt.push({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "ENOSPC: no space left on device" },
    });
    h.dialogAntwort = 0;

    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    // Der STORE-eigene Query: das Ereignis kam NACH den Flushs und VOR der Entscheidung.
    expect(h.protokoll).toEqual([
      "flushBeimBeenden",
      "flushBestand",
      "flushMarkenBestand",
      "send",
      "regBeendenEntscheidung",
      "entscheidung",
      // "Erneut versuchen" wiederholt NUR die GESCHEITERTEN (DoD #336) - project je allein.
      "flushBeimBeenden",
      "quit",
    ]);
    // DoD #336: das Ereignis traegt GENAU den betroffenen Speicher, Code UND Meldung.
    const [weitergabe] = h.webContentsSende as unknown as [
      { kanal: string; nutzlast: { berichte: unknown[]; empfehlung: string } },
    ];
    expect(weitergabe.kanal).toBe("beenden:status");
    expect(weitergabe.nutzlast.berichte).toHaveLength(1);
    expect(weitergabe.nutzlast.berichte[0]).toMatchObject({
      speicher: "project",
      code: "speicher_fehler",
      meldung: "ENOSPC: no space left on device",
    });
    expect(weitergabe.nutzlast.empfehlung).toContain("Platte");
  });

  it("offert 'verwerfen' an der apekt-entry - als benannter Verlust, nie vorausgewaehlt", async () => {
    h.flushAntworten.vorlagen.push({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "EACCES: permission denied" },
    });
    h.dialogAntwort = 1;

    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    // verwerfen: EINE Flush-Runde, direkt quit - klauselendig (TK 9.5.4 Punkt 4).
    expect(h.protokoll).toEqual([
      "flushBeimBeenden",
      "flushBestand",
      "flushMarkenBestand",
      "send",
      "regBeendenEntscheidung",
      "entscheidung",
      "quit",
    ]);
    const [weitergabe] = h.webContentsSende as unknown as [
      { kanal: string; nutzlast: { berichte: unknown[] } },
    ];
    expect(weitergabe.nutzlast.berichte).toHaveLength(1);
    expect(weitergabe.nutzlast.berichte[0]).toMatchObject({ speicher: "vorlagen" });
  });

  it("fuehrt den zweiten und dritten Flush auch dann aus, wenn der erste scheitert",
    // Alle drei haengen nicht voneinander ab; ein Abbruch nach dem ersten Fehlschlag
    // verloere den Vorlagen- bzw. den Markenbestand zusaetzlich, ohne etwas zu retten.
    async () => {
      h.flushAntworten.projekt.push({
        ok: false,
        fehler: { code: "speicher_fehler", meldung: "Datenort nicht nutzbar" },
      });
      h.dialogAntwort = 1;

      await starteBootstrap();
      h.protokoll.length = 0;

      await loeseBeendenAus();

      expect(h.flushBestand).toHaveBeenCalledTimes(1);
      expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
      const [weitergabe] = h.webContentsSende as unknown as [
        { nutzlast: { berichte: unknown[] } },
      ];
      const betroffene = (weitergabe.nutzlast.berichte as { speicher: string }[]).map(
        (bericht) => bericht.speicher,
      );
      expect(betroffene).toEqual(["project"]);
    });
});

describe("Main-Bootstrap - #309: der EINE Schema-Registrier-Aufruf (Schritt 1)", () => {
  it("ruft registerSchemesAsPrivileged GENAU EINMAL mit [MEDIA_SCHEMA, MARKEN_SCHEMA]", async () => {
    await starteBootstrap();

    // Electron erlaeutert in 43.2.0 wörtlich: "... can be called only once." Ein
    // zweiter Aufruf haette BEIDE Protokolle still gemacht - nicht nur marken://.
    expect(h.schemataAnmeldungen).toHaveLength(1);
    const schemata = h.schemataAnmeldungen[0] as unknown[];
    expect(schemata).toHaveLength(2);
    // UNVERAENDERT durchgereicht: Referenzvergleich gegen DIESELBEN Objekte, kein
    // neu zusammengesetztes Objekt und kein ergaenztes Feld.
    const [{ MEDIA_SCHEMA }, { MARKEN_SCHEMA }] = [
      await import("../../src/main/media-protokoll"),
      await import("../../src/main/marken-store/marken-protokoll"),
    ];
    expect(schemata[0]).toBe(MEDIA_SCHEMA);
    expect(schemata[1]).toBe(MARKEN_SCHEMA);
  });
});

describe("Main-Bootstrap - #309: der Marken-Flush im Beenden-Ablauf (#277)", () => {
  it("beendet die App erst NACH dem abwartenden Marken-Flush", async () => {
    // Gemessen, nicht behauptet: flushMarkenBestand haengt an einem echten Zeitgeber
    // (siehe Mock oben), quit steht ALSO im Protokoll dahinter - genau der Fall, gegen
    // den der Eintrag existiert: Ohne ihn beendete sich das Programm waehrend des
    // Schreibvorgangs ("Sofort-Flush ... beim Beenden", TK 9.5.4 Fall 3).
    await starteBootstrap();
    h.protokoll.length = 0;

    await loeseBeendenAus();

    expect(h.protokoll.indexOf("flushMarkenBestand")).toBeLessThan(h.protokoll.indexOf("quit"));
    expect(h.quit).toHaveBeenCalledTimes(1);
  });

  it("importiert den Marken-Flush unter ALIAS - kein Falscher-Bestand-Import moeglich", async () => {
    await starteBootstrap();
    h.protokoll.length = 0;
    await loeseBeendenAus();

    // flushBestand heisst auch die Vorlagen-Funktion (#98); beide laufen im selben Rumpf.
    expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
    expect(h.flushBestand).toHaveBeenCalledTimes(1);
  });
});
