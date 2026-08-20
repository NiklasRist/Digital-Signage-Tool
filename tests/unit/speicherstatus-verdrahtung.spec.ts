// Verhaltenstests zu #238 - die beiden Auto-Speichern-Ereignisse werden an das eine
// Fenster weitergegeben.
//
// GEMOCKT sind die beiden main-internen Anmelde-Funktionen `aufAutoSpeichernEreignis`
// (#47) und `aufVorlagenSpeichernEreignis` (#98). Jede registriert ihre Hoerer in
// einer Liste, damit der Test die Anmeldezaehler pruefen (DoD: genau einmal) und
// Meldungen erzeugen kann. Electron wird nicht gestartet; das Fenster ist ein Doppel.
//
// DASS DIE MOCK-SIGNATUREN ZU DEN GEBAUTEN DATEIEN PASSEN, prueft nicht dieser Test,
// sondern `npm run typecheck`: speicherstatus-verdrahtung.ts importiert die ECHTEN
// Module, ein abweichender Hoerer-Typ oder Rueckgabewert waere dort ein
// Uebersetzungsfehler.
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowserWindow } from "electron";

import { KANAELE } from "../../src/shared/contracts/kanaele";
import type { AutoSpeichernEreignis } from "../../src/main/project-store/auto-speichern";
import type { VorlagenSpeichernEreignis } from "../../src/main/vorlagen-store/schreibe-vorlagen";

const projectHoerer: Array<(ereignis: AutoSpeichernEreignis) => void> = [];
const vorlagenHoerer: Array<(ereignis: VorlagenSpeichernEreignis) => void> = [];

const spione = vi.hoisted(() => ({
  aufAutoSpeichernEreignis: vi.fn(),
  aufVorlagenSpeichernEreignis: vi.fn(),
  projectAbmelden: vi.fn(),
  vorlagenAbmelden: vi.fn(),
}));

spione.aufAutoSpeichernEreignis.mockImplementation(
  (hoerer: (ereignis: AutoSpeichernEreignis) => void) => {
    projectHoerer.push(hoerer);
    return spione.projectAbmelden;
  },
);

spione.aufVorlagenSpeichernEreignis.mockImplementation(
  (hoerer: (ereignis: VorlagenSpeichernEreignis) => void) => {
    vorlagenHoerer.push(hoerer);
    return spione.vorlagenAbmelden;
  },
);

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  aufAutoSpeichernEreignis: spione.aufAutoSpeichernEreignis,
}));

vi.mock("../../src/main/vorlagen-store/schreibe-vorlagen", () => ({
  aufVorlagenSpeichernEreignis: spione.aufVorlagenSpeichernEreignis,
}));

const { verdrahteSpeicherstatusIPC } = await import(
  "../../src/main/ipc-gateway/speicherstatus-verdrahtung"
);

type FensterDoppel = {
  webContents: { send: ReturnType<typeof vi.fn> };
  zerstoere: () => void;
  belebe: () => void;
  schliesse: () => void;
};

function baueFenster(): FensterDoppel & BrowserWindow {
  const beimSchliessen: Array<() => void> = [];
  let zerstoert = false;
  const doppel = {
    webContents: { send: vi.fn() },
    isDestroyed: () => zerstoert,
    once(ereignis: string, hoerer: () => void) {
      if (ereignis === "closed") beimSchliessen.push(hoerer);
      return doppel;
    },
    zerstoere: () => {
      zerstoert = true;
    },
    belebe: () => {
      zerstoert = false;
    },
    schliesse: () => {
      zerstoert = true;
      for (const hoerer of beimSchliessen) hoerer();
    },
  };
  return doppel as unknown as FensterDoppel & BrowserWindow;
}

// Der blosse Import darf nichts getan haben - festgehalten VOR dem ersten Aufruf.
const projectAnmeldungenVorAufruf = spione.aufAutoSpeichernEreignis.mock.calls.length;
const vorlagenAnmeldungenVorAufruf = spione.aufVorlagenSpeichernEreignis.mock.calls.length;

const fenster = baueFenster();
verdrahteSpeicherstatusIPC(fenster);

// Festgehalten VOR den Tests: Die Tests weiter unten verdrahten eigene Fenster und
// melden dabei erneut an. Diese Aufnahmen beschreiben deshalb den EINEN Aufruf oben.
const projectAnmeldungenNachAufruf = spione.aufAutoSpeichernEreignis.mock.calls.length;
const vorlagenAnmeldungenNachAufruf = spione.aufVorlagenSpeichernEreignis.mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
});

function frischVerdrahtet(): {
  fenster: FensterDoppel & BrowserWindow;
  projectMeldung: (ereignis: AutoSpeichernEreignis) => void;
  vorlagenMeldung: (ereignis: VorlagenSpeichernEreignis) => void;
} {
  const eigenes = baueFenster();
  const projektVorher = projectHoerer.length;
  const vorlagenVorher = vorlagenHoerer.length;
  verdrahteSpeicherstatusIPC(eigenes);
  const p = projectHoerer[projektVorher];
  const v = vorlagenHoerer[vorlagenVorher];
  if (p === undefined || v === undefined)
    throw new Error("Nicht beide Hoerer angemeldet.");
  return { fenster: eigenes, projectMeldung: p, vorlagenMeldung: v };
}

describe("verdrahteSpeicherstatusIPC (#238) - die Anmeldungen", () => {
  it("meldet sich ueber aufAutoSpeichernEreignis GENAU EINMAL an (DoD)", () => {
    expect(projectAnmeldungenNachAufruf - projectAnmeldungenVorAufruf).toBe(1);
  });

  it("meldet sich ueber aufVorlagenSpeichernEreignis GENAU EINMAL an (DoD)", () => {
    expect(vorlagenAnmeldungenNachAufruf - vorlagenAnmeldungenVorAufruf).toBe(1);
  });

  it("hat beim blossen Import nichts angemeldet", () => {
    expect(projectAnmeldungenVorAufruf).toBe(0);
    expect(vorlagenAnmeldungenVorAufruf).toBe(0);
  });
});

describe("verdrahteSpeicherstatusIPC (#238) - der project-Zweig", () => {
  it("sendet eine 'gespeichert'-Meldung UNVERAENDERT auf project:autoSpeichernStatus", () => {
    const { fenster: eigenes, projectMeldung } = frischVerdrahtet();
    const meldung: AutoSpeichernEreignis = { typ: "gespeichert" };

    projectMeldung(meldung);

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
    expect(eigenes.webContents.send).toHaveBeenCalledWith(
      KANAELE.project.autoSpeichernStatus,
      meldung,
    );
    // Das GLEICHE Objekt, nicht ein gleich aussehendes: keine Kopie, keine Huelle,
    // kein Umbau. `toHaveBeenCalledWith` allein prueft nur strukturelle Gleichheit.
    expect(eigenes.webContents.send.mock.calls[0]?.[1]).toBe(meldung);
  });

  it("sendet eine 'fehler'-Meldung unveraendert weiter - sie wird nicht gefiltert (DoD)", () => {
    const { fenster: eigenes, projectMeldung } = frischVerdrahtet();
    const meldung: AutoSpeichernEreignis = { typ: "fehler", code: "unbekannter_fehler" };

    projectMeldung(meldung);

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
    expect(eigenes.webContents.send).toHaveBeenCalledWith(
      KANAELE.project.autoSpeichernStatus,
      meldung,
    );
    expect(eigenes.webContents.send.mock.calls[0]?.[1]).toBe(meldung);
  });

  it("verpackt NICHT in die Ergebnis-Huelle und ergaenzt kein Feld", () => {
    const { fenster: eigenes, projectMeldung } = frischVerdrahtet();
    const meldung: AutoSpeichernEreignis = { typ: "gespeichert" };

    projectMeldung(meldung);

    const gesendet = eigenes.webContents.send.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(gesendet).not.toHaveProperty("ok");
    expect(gesendet).not.toHaveProperty("wert");
    expect(Object.keys(gesendet).sort()).toEqual(["typ"]);
  });

  it("sendet bei zerstoertem Fenster NICHT und wirft NICHT - der Hoerer bleibt angemeldet", () => {
    const { fenster: eigenes, projectMeldung } = frischVerdrahtet();

    eigenes.zerstoere();
    expect(() => {
      projectMeldung({ typ: "gespeichert" });
    }).not.toThrow();
    expect(eigenes.webContents.send).not.toHaveBeenCalled();

    // Und die NAECHSTE Meldung wird wieder normal verarbeitet: Der Hoerer wurde nicht
    // abgemeldet und hat sich nichts gemerkt.
    eigenes.belebe();
    projectMeldung({ typ: "gespeichert" });
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
  });

  it("wirft nicht, wenn webContents.send wirft - und der Hoerer bleibt funktionsfaehig", () => {
    const { fenster: eigenes, projectMeldung } = frischVerdrahtet();
    eigenes.webContents.send.mockImplementationOnce(() => {
      throw new Error("Renderer-Prozess weg");
    });
    const stumm = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => {
      projectMeldung({ typ: "gespeichert" });
    }).not.toThrow();
    expect(stumm).toHaveBeenCalledTimes(1);

    projectMeldung({ typ: "gespeichert" });
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(2);

    stumm.mockRestore();
  });
});

describe("verdrahteSpeicherstatusIPC (#238) - der vorlagen-Zweig", () => {
  it("sendet eine 'gespeichert'-Meldung UNVERAENDERT auf vorlagen:autoSpeichernStatus", () => {
    const { fenster: eigenes, vorlagenMeldung } = frischVerdrahtet();
    const meldung: VorlagenSpeichernEreignis = { typ: "gespeichert" };

    vorlagenMeldung(meldung);

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
    expect(eigenes.webContents.send).toHaveBeenCalledWith(
      KANAELE.vorlagen.autoSpeichernStatus,
      meldung,
    );
    expect(eigenes.webContents.send.mock.calls[0]?.[1]).toBe(meldung);
  });

  it("sendet eine 'fehler'-Meldung unveraendert weiter (DoD)", () => {
    const { fenster: eigenes, vorlagenMeldung } = frischVerdrahtet();
    const meldung: VorlagenSpeichernEreignis = {
      typ: "fehler",
      code: "vorlage_referenziert",
    };

    vorlagenMeldung(meldung);

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
    expect(eigenes.webContents.send).toHaveBeenCalledWith(
      KANAELE.vorlagen.autoSpeichernStatus,
      meldung,
    );
    expect(eigenes.webContents.send.mock.calls[0]?.[1]).toBe(meldung);
  });

  it("nutzt NICHT den project-Kanal (ENTSCHIEDEN 1)", () => {
    const { fenster: eigenes, vorlagenMeldung } = frischVerdrahtet();

    vorlagenMeldung({ typ: "gespeichert" });

    expect(eigenes.webContents.send).toHaveBeenCalledWith(
      KANAELE.vorlagen.autoSpeichernStatus,
      expect.anything(),
    );
    expect(eigenes.webContents.send).not.toHaveBeenCalledWith(
      KANAELE.project.autoSpeichernStatus,
      expect.anything(),
    );
  });

  it("sendet bei zerstoertem Fenster NICHT und wirft NICHT", () => {
    const { fenster: eigenes, vorlagenMeldung } = frischVerdrahtet();

    eigenes.zerstoere();
    expect(() => {
      vorlagenMeldung({ typ: "gespeichert" });
    }).not.toThrow();
    expect(eigenes.webContents.send).not.toHaveBeenCalled();

    eigenes.belebe();
    vorlagenMeldung({ typ: "gespeichert" });
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
  });

  it("wirft nicht, wenn webContents.send wirft - und der Hoerer bleibt funktionsfaehig", () => {
    const { fenster: eigenes, vorlagenMeldung } = frischVerdrahtet();
    eigenes.webContents.send.mockImplementationOnce(() => {
      throw new Error("Renderer-Prozess weg");
    });
    const stumm = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => {
      vorlagenMeldung({ typ: "gespeichert" });
    }).not.toThrow();
    expect(stumm).toHaveBeenCalledTimes(1);

    vorlagenMeldung({ typ: "gespeichert" });
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(2);

    stumm.mockRestore();
  });
});

describe("verdrahteSpeicherstatusIPC (#238) - Abmelden beim Schliessen", () => {
  it("meldet beide Hoerer ab, wenn das Fenster geschlossen wird", () => {
    const { fenster: eigenes } = frischVerdrahtet();

    expect(spione.projectAbmelden).not.toHaveBeenCalled();
    expect(spione.vorlagenAbmelden).not.toHaveBeenCalled();
    eigenes.schliesse();
    expect(spione.projectAbmelden).toHaveBeenCalledTimes(1);
    expect(spione.vorlagenAbmelden).toHaveBeenCalledTimes(1);
  });
});

describe("Kanal-Registry (#25) nach der Ergaenzung durch #238", () => {
  it("traegt die zwei neuen Namen zeichengleich", () => {
    expect(KANAELE.project.autoSpeichernStatus).toBe("project:autoSpeichernStatus");
    expect(KANAELE.vorlagen.autoSpeichernStatus).toBe("vorlagen:autoSpeichernStatus");
  });

  it("laesst die vorhandenen Bloecke unveraendert (Diff-Probe: zwei Zeilen, null geaendert)", () => {
    const quelle = readFileSync("src/shared/contracts/kanaele.ts", "utf8");
    // Die zwei neuen Eintraege sind die EINZIGEN Auto-Speichern-Kanaele.
    const treffer = quelle.match(/autoSpeichernStatus:/g) ?? [];
    expect(treffer).toHaveLength(2);
    expect(quelle).toContain("autoSpeichernStatus: 'project:autoSpeichernStatus',");
    expect(quelle).toContain("autoSpeichernStatus: 'vorlagen:autoSpeichernStatus',");
  });

  it("haelt die Regel <modul>:<ereignis> auch fuer die zwei neuen Eintraege ein", () => {
    expect(KANAELE.project.autoSpeichernStatus).toBe("project:autoSpeichernStatus");
    expect(KANAELE.vorlagen.autoSpeichernStatus).toBe("vorlagen:autoSpeichernStatus");
  });
});

describe("speicherstatus-verdrahtung.ts - Codeinspektion (DoD-Grep-Proben)", () => {
  it("enthaelt keine verbotenen Muster und keinen Kanalnamen als String-Literal", () => {
    const quelle = readFileSync("src/main/ipc-gateway/speicherstatus-verdrahtung.ts", "utf8");
    const ohneKommentare = quelle
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");

    // Schutz gegen ein zu gieriges Abstreifen: Bleibt der Registry-Zugriff stehen,
    // hat der Filter den Code nicht mitgeloescht.
    expect(ohneKommentare).toContain("KANAELE.project.autoSpeichernStatus");
    expect(ohneKommentare).toContain("KANAELE.vorlagen.autoSpeichernStatus");

    for (const verboten of [
      "getAllWindows",
      "getFocusedWindow",
      "registriereHandler",
      "ipcMain.handle",
      "setTimeout",
      "setInterval",
    ]) {
      expect(ohneKommentare, verboten).not.toContain(verboten);
    }

    // Kein Kanalname als String-Literal: kein String, der mit `project:` oder
    // `vorlagen:` beginnt (die Namen kommen aus KANAELE).
    expect(ohneKommentare).not.toMatch(/['"`]project:/);
    expect(ohneKommentare).not.toMatch(/['"`]vorlagen:/);
  });
});