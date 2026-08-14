import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #188 - dem Handler des `export`-Auftrags.
//
// ALLES IST ATTRAPPE, und das ist hier die richtige Wahl: Diese Datei baut nichts
// selbst, sie SETZT ZUSAMMEN. Geprueft wird deshalb genau das - Reihenfolge, Argumente,
// Abbruch nach dem ersten Fehler und der eine terminale Ausgang. Ob kopiert, verifiziert
// oder ersetzt wird, belegen die Tests der fuenf Bausteine (#184-#187) an echten Dateien;
// das hier noch einmal zu tun, pruefte fremde Zusagen doppelt und diese Datei gar nicht.
//
// DAS PROTOKOLL (`ruf`) IST DAS EIGENTLICHE PRUEFMITTEL. Jede Attrappe traegt sich ein,
// bevor sie antwortet. Die Reihenfolge ist Teil des Vertrags (TK 9.6.2) und laesst sich
// nur so festhalten; ein Test, der bloss `toHaveBeenCalled` fragt, ginge gruen durch,
// waehrend das Ersetzen vor der Verifikation liefe.
const attrappe = vi.hoisted(() => ({
  ruf: [] as string[],
  imLock: false,
  // Wo die Attrappe war, als sie gerufen wurde - so zeigt sich, dass Abruf UND Flush im
  // SELBEN Lock-Abschnitt liegen und nicht bloss beide irgendwann.
  lockStand: {} as Record<string, boolean>,
  lockRufe: 0,
  projekt: null as unknown,
  flush: { ok: true } as unknown,
  quelle: {} as unknown,
  ziel: { ok: true } as unknown,
  kopie: { ok: true } as unknown,
  ersetzen: { ok: true } as unknown,
  exportZiel: { ok: true } as unknown,
  unlinkWirft: false,
  unlinkPfade: [] as string[],
}));

function halteFest(name: string): void {
  attrappe.ruf.push(name);
  attrappe.lockStand[name] = attrappe.imLock;
}

vi.mock("../../src/main/project-store/d1-lock", () => ({
  mitD1Lock: vi.fn(async (aktion: () => Promise<unknown>) => {
    attrappe.lockRufe += 1;
    attrappe.imLock = true;
    try {
      return await aktion();
    } finally {
      attrappe.imLock = false;
    }
  }),
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: vi.fn(() => {
    halteFest("holeAktivesProjekt");
    return attrappe.projekt;
  }),
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  sofortFlush: vi.fn(async () => {
    halteFest("sofortFlush");
    return attrappe.flush;
  }),
}));

vi.mock("../../src/main/export-service/quelle", () => ({
  loeseExportQuelle: vi.fn(async () => {
    halteFest("loeseExportQuelle");
    return attrappe.quelle;
  }),
}));

vi.mock("../../src/main/export-service/ziel-pruefung", () => ({
  pruefeExportZiel: vi.fn(async () => {
    halteFest("pruefeExportZiel");
    return attrappe.ziel;
  }),
}));

vi.mock("../../src/main/export-service/kopieren", () => ({
  kopiereNachPart: vi.fn(async () => {
    halteFest("kopiereNachPart");
    return attrappe.kopie;
  }),
}));

vi.mock("../../src/main/export-service/ersetzen", () => ({
  ersetzeAtomar: vi.fn(async () => {
    halteFest("ersetzeAtomar");
    return attrappe.ersetzen;
  }),
}));

vi.mock("../../src/main/config-store/setze-export-ziel", () => ({
  setzeExportZiel: vi.fn(async () => {
    halteFest("setzeExportZiel");
    return attrappe.exportZiel;
  }),
}));

vi.mock("node:fs/promises", () => ({
  unlink: vi.fn(async (pfad: string) => {
    halteFest("unlink");
    attrappe.unlinkPfade.push(pfad);
    if (attrappe.unlinkWirft) throw new Error("EPERM: unlink nicht erlaubt");
  }),
}));

const { holeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { sofortFlush } = await import("../../src/main/project-store/auto-speichern");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");
const { loeseExportQuelle } = await import("../../src/main/export-service/quelle");
const { pruefeExportZiel } = await import("../../src/main/export-service/ziel-pruefung");
const { kopiereNachPart } = await import("../../src/main/export-service/kopieren");
const { ersetzeAtomar } = await import("../../src/main/export-service/ersetzen");
const { setzeExportZiel } = await import("../../src/main/config-store/setze-export-ziel");
const { exportiereAusgabe } = await import("../../src/main/export-service/export");

const ZIEL_ORDNER = path.join("E:", "usb");
const DATEINAME = "sommeraktion.mp4";
const QUELL_PFAD = path.join("C:", "daten", "projects", "p-1", "output", DATEINAME);
const GROESSE = 2_500_000_000;
const ZIEL_DATEI = path.join(ZIEL_ORDNER, DATEINAME);
const PART = ZIEL_DATEI + ".part";

const ALLE_BAUSTEINE = [
  sofortFlush,
  loeseExportQuelle,
  pruefeExportZiel,
  kopiereNachPart,
  ersetzeAtomar,
  setzeExportZiel,
];

const meldeFortschritt = vi.fn();

function auftrag(payload: unknown = { projektId: "p-1", dateiname: DATEINAME, zielPfad: ZIEL_ORDNER }) {
  return {
    auftragId: "a-1",
    art: "export",
    status: "laeuft",
    label: "Export",
    payload,
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-14T00:00:00.000Z",
  } as Parameters<typeof exportiereAusgabe>[0];
}

const kontext = { auftragId: "a-1", meldeFortschritt };

function lauf(payload?: unknown) {
  return exportiereAusgabe(payload === undefined ? auftrag() : auftrag(payload), kontext);
}

beforeEach(() => {
  vi.clearAllMocks();
  attrappe.ruf = [];
  attrappe.lockStand = {};
  attrappe.lockRufe = 0;
  attrappe.imLock = false;
  attrappe.projekt = { id: "p-1", name: "Sommer", liste: [] };
  attrappe.flush = { ok: true, wert: undefined };
  attrappe.quelle = { ok: true, wert: { quellPfad: QUELL_PFAD, dateigroesse: GROESSE } };
  attrappe.ziel = { ok: true, wert: undefined };
  attrappe.kopie = { ok: true, wert: undefined };
  attrappe.ersetzen = { ok: true, wert: undefined };
  attrappe.exportZiel = { ok: true, wert: undefined };
  attrappe.unlinkWirft = false;
  attrappe.unlinkPfade = [];
});

describe("exportiereAusgabe - der Erfolgspfad", () => {
  it("laeuft durch und meldet den VOLLSTAENDIGEN Dateipfad, nicht den Ordner", async () => {
    const ergebnis = await lauf();

    expect(ergebnis).toEqual({
      status: "erfolg",
      ergebnis: { zielPfad: ZIEL_DATEI, dateigroesse: GROESSE },
    });
    // Die wahrscheinlichste Verwechslung dieser Datei: `zielPfad` heisst im Eingang der
    // ORDNER und im Ausgang die DATEI. Beide Felder heissen gleich.
    expect((ergebnis as { ergebnis: { zielPfad: string } }).ergebnis.zielPfad).not.toBe(ZIEL_ORDNER);
  });

  it("ruft die sechs Bausteine in genau der Reihenfolge aus TK 9.6.2", async () => {
    await lauf();

    expect(attrappe.ruf).toEqual([
      "holeAktivesProjekt",
      "sofortFlush",
      "loeseExportQuelle",
      "pruefeExportZiel",
      "kopiereNachPart",
      "ersetzeAtomar",
      "setzeExportZiel",
    ]);
    expect(sofortFlush).toHaveBeenCalledTimes(1);
  });

  it("haelt Abruf und Flush in EINEM einzigen Lock-Abschnitt - und sonst nichts", async () => {
    await lauf();

    expect(mitD1Lock).toHaveBeenCalledTimes(1);
    expect(attrappe.lockStand.holeAktivesProjekt).toBe(true);
    expect(attrappe.lockStand.sofortFlush).toBe(true);
    // Der kritische Abschnitt haelt ALLE D1-Schreibvorgaenge der Anwendung an; das
    // Kopieren von 2,5 GB gehoert nicht hinein.
    for (const name of ["loeseExportQuelle", "pruefeExportZiel", "kopiereNachPart", "ersetzeAtomar", "setzeExportZiel"]) {
      expect(attrappe.lockStand[name]).toBe(false);
    }
  });

  it("gibt dem Flush GENAU das Objekt weiter, das der Abruf geliefert hat, und laesst es unveraendert", async () => {
    const vorher = { ...(attrappe.projekt as Record<string, unknown>) };

    await lauf();

    // Identitaet, nicht Feldgleichheit: `holeAktivesProjekt` liefert den LEBENDEN Stand.
    // Eine Kopie zu flushen schriebe moeglicherweise einen veralteten Stand, waehrend der
    // Timer zugleich abgebrochen wird - der Datenverlust waere lautlos.
    expect(vi.mocked(sofortFlush).mock.calls[0]?.[0]).toBe(attrappe.projekt);
    expect(attrappe.projekt).toEqual(vorher);
  });

  it("uebergibt `.part` und Zieldatei an die richtigen Bausteine", async () => {
    await lauf();

    expect(kopiereNachPart).toHaveBeenCalledWith(QUELL_PFAD, PART, GROESSE);
    expect(ersetzeAtomar).toHaveBeenCalledWith(PART, ZIEL_DATEI);
    // Angehaengt, nicht ersetzt: `sommeraktion.mp4.part`, nicht `sommeraktion.part`.
    expect(PART.endsWith(".mp4.part")).toBe(true);
    // Die Vorabpruefung bekommt den ORDNER und die QUELLGROESSE - sie kennt den Dateinamen nicht.
    expect(pruefeExportZiel).toHaveBeenCalledWith(ZIEL_ORDNER, GROESSE);
  });

  it("merkt sich den ORDNER, nicht den Dateipfad", async () => {
    await lauf();

    expect(setzeExportZiel).toHaveBeenCalledWith(ZIEL_ORDNER);
  });

  it("ruft `meldeFortschritt` nie", async () => {
    await lauf();

    expect(meldeFortschritt).not.toHaveBeenCalled();
  });
});

describe("exportiereAusgabe - Schritt 0, der Sofort-Flush", () => {
  it("ueberspringt den Flush ohne Fehler, wenn kein Projekt geoeffnet ist", async () => {
    attrappe.projekt = null;
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => {});

    const ergebnis = await lauf();

    expect(sofortFlush).not.toHaveBeenCalled();
    expect(ergebnis).toEqual({
      status: "erfolg",
      ergebnis: { zielPfad: ZIEL_DATEI, dateigroesse: GROESSE },
    });
    expect(warnung).toHaveBeenCalled();
    warnung.mockRestore();
  });

  it("bricht mit `speicher_fehler` ab und ruft KEINEN weiteren Baustein", async () => {
    attrappe.flush = { ok: false, fehler: { code: "speicher_fehler", meldung: "Platte voll" } };

    const ergebnis = await lauf();

    expect(ergebnis).toMatchObject({ status: "fehlgeschlagen", fehler: { code: "speicher_fehler" } });
    for (const baustein of [loeseExportQuelle, pruefeExportZiel, kopiereNachPart, ersetzeAtomar, setzeExportZiel]) {
      expect(baustein).not.toHaveBeenCalled();
    }
  });
});

describe("exportiereAusgabe - Fehler der Bausteine wandern unveraendert weiter", () => {
  // Der Code steht danach UNKORRIGIERBAR in Q3 und bestimmt, welchen Hinweis die
  // Oberflaeche zeigt (exFAT-Empfehlung, "Stick anschliessen"). Wird er hier umgedeutet,
  // degradiert alles zu "irgendwas ist schiefgelaufen".
  const faelle = [
    { name: "#185 Quelle", schalter: "quelle", code: "keine_ausgabe", danach: [pruefeExportZiel, kopiereNachPart, ersetzeAtomar, setzeExportZiel] },
    { name: "#184 Zielpruefung", schalter: "ziel", code: "datei_zu_gross_fat32", danach: [kopiereNachPart, ersetzeAtomar, setzeExportZiel] },
    { name: "#186 Kopieren", schalter: "kopie", code: "kein_platz", danach: [ersetzeAtomar, setzeExportZiel] },
    { name: "#187 Ersetzen", schalter: "ersetzen", code: "ziel_gesperrt", danach: [setzeExportZiel] },
  ] as const;

  for (const fall of faelle) {
    it(`${fall.name}: Code zeichengleich, kein nachfolgender Baustein`, async () => {
      (attrappe as Record<string, unknown>)[fall.schalter] = {
        ok: false,
        fehler: { code: fall.code, meldung: "Meldung des Bausteins", daten: { hinweis: 42 } },
      };

      const ergebnis = await lauf();

      expect(ergebnis).toEqual({
        status: "fehlgeschlagen",
        fehler: { code: fall.code, meldung: "Meldung des Bausteins", daten: { hinweis: 42 } },
      });
      for (const baustein of fall.danach) expect(baustein).not.toHaveBeenCalled();
    });
  }

  it("haengt kein leeres `daten` an, wenn der Baustein keines mitgibt", async () => {
    attrappe.ziel = { ok: false, fehler: { code: "ziel_nicht_verfügbar", meldung: "Stick weg" } };

    const ergebnis = await lauf();

    expect(ergebnis).toEqual({
      status: "fehlgeschlagen",
      fehler: { code: "ziel_nicht_verfügbar", meldung: "Stick weg" },
    });
    expect("daten" in (ergebnis as { fehler: object }).fehler).toBe(false);
  });
});

describe("exportiereAusgabe - die `.part`-Leiche nach gescheitertem Ersetzen", () => {
  beforeEach(() => {
    attrappe.ersetzen = { ok: false, fehler: { code: "ziel_gesperrt", meldung: "EBUSY" } };
  });

  it("versucht ein `unlink` auf genau den `.part`-Pfad", async () => {
    const ergebnis = await lauf();

    expect(attrappe.unlinkPfade).toEqual([PART]);
    expect(ergebnis).toMatchObject({ status: "fehlgeschlagen", fehler: { code: "ziel_gesperrt" } });
  });

  it("laesst das gemeldete Ergebnis unveraendert, wenn das `unlink` selbst wirft", async () => {
    attrappe.unlinkWirft = true;
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const ergebnis = await lauf();

    // Der urspruengliche Fehler ist die Information, die der Nutzer braucht - ein
    // Aufraeumfehler darf ihn nicht verdecken.
    expect(ergebnis).toEqual({
      status: "fehlgeschlagen",
      fehler: { code: "ziel_gesperrt", meldung: "EBUSY" },
    });
    fehlerLog.mockRestore();
  });
});

describe("exportiereAusgabe - das Merken des Ziels darf den Erfolg nicht kippen", () => {
  it("bleibt erfolgreich, wenn `setzeExportZiel` `ok:false` meldet", async () => {
    attrappe.exportZiel = { ok: false, fehler: { code: "speicher_fehler", meldung: "Konfig kaputt" } };
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const ergebnis = await lauf();

    expect(ergebnis).toEqual({
      status: "erfolg",
      ergebnis: { zielPfad: ZIEL_DATEI, dateigroesse: GROESSE },
    });
    expect(fehlerLog).toHaveBeenCalled();
    fehlerLog.mockRestore();
  });

  it("bleibt erfolgreich, wenn `setzeExportZiel` wirft", async () => {
    vi.mocked(setzeExportZiel).mockRejectedValueOnce(new Error("kaputt"));
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const ergebnis = await lauf();

    // Die Datei liegt vollstaendig, verifiziert und gesynct auf dem Stick. Ein Fehlschlag
    // hier schickte den Auftrag in Q2 und liesse den Nutzer 2,5 GB erneut kopieren, weil
    // eine Bequemlichkeits-Einstellung nicht gespeichert werden konnte.
    expect(ergebnis).toEqual({
      status: "erfolg",
      ergebnis: { zielPfad: ZIEL_DATEI, dateigroesse: GROESSE },
    });
    fehlerLog.mockRestore();
  });
});

describe("exportiereAusgabe - die Nutzlast wird geprueft", () => {
  // Ein wiederholter Auftrag kommt aus Q2, also aus einer JSON-Datei - dort steht nicht
  // zwangslaeufig, was der Typ verspricht.
  const kaputt: Array<[string, unknown]> = [
    ["gar keine Nutzlast", null],
    ["ohne projektId", { dateiname: DATEINAME, zielPfad: ZIEL_ORDNER }],
    ["leerer dateiname", { projektId: "p-1", dateiname: "", zielPfad: ZIEL_ORDNER }],
    ["zielPfad keine Zeichenkette", { projektId: "p-1", dateiname: DATEINAME, zielPfad: 7 }],
  ];

  for (const [name, payload] of kaputt) {
    it(`${name} -> ungueltige_eingabe, ohne jede Wirkung`, async () => {
      const ergebnis = await lauf(payload);

      expect(ergebnis).toMatchObject({ status: "fehlgeschlagen", fehler: { code: "ungueltige_eingabe" } });
      for (const baustein of [loeseExportQuelle, pruefeExportZiel, kopiereNachPart, ersetzeAtomar, setzeExportZiel]) {
        expect(baustein).not.toHaveBeenCalled();
      }
    });
  }
});

describe("exportiereAusgabe - der terminale Ausgang", () => {
  it("faengt eine geworfene Ausnahme ab und meldet `unbekannter_fehler` ohne Stacktrace", async () => {
    vi.mocked(kopiereNachPart).mockRejectedValueOnce(new Error("Attrappe bricht den Vertrag"));
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const ergebnis = await lauf();

    expect(ergebnis).toMatchObject({ status: "fehlgeschlagen", fehler: { code: "unbekannter_fehler" } });
    const meldung = (ergebnis as { fehler: { meldung: string } }).fehler.meldung;
    expect(meldung).not.toContain("at ");
    expect(meldung).not.toContain("Attrappe bricht den Vertrag");
    // Die rohe Ursache gehoert ins Protokoll des Hauptprozesses, nicht in den Rueckgabewert.
    expect(fehlerLog).toHaveBeenCalled();
    fehlerLog.mockRestore();
  });

  it("liefert in keinem der Faelle `abgebrochen`", async () => {
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ausgaenge: string[] = [];

    // Erfolg
    ausgaenge.push((await lauf()).status);
    // jeder Baustein-Fehlschlag
    for (const schalter of ["flush", "quelle", "ziel", "kopie", "ersetzen"] as const) {
      vi.clearAllMocks();
      attrappe.flush = { ok: true, wert: undefined };
      attrappe.quelle = { ok: true, wert: { quellPfad: QUELL_PFAD, dateigroesse: GROESSE } };
      attrappe.ziel = { ok: true, wert: undefined };
      attrappe.kopie = { ok: true, wert: undefined };
      attrappe.ersetzen = { ok: true, wert: undefined };
      (attrappe as Record<string, unknown>)[schalter] = {
        ok: false,
        fehler: { code: "schreib_fehler", meldung: "x" },
      };
      ausgaenge.push((await lauf()).status);
    }
    // geworfene Ausnahme
    vi.mocked(loeseExportQuelle).mockRejectedValueOnce(new Error("bumm"));
    ausgaenge.push((await lauf()).status);
    // kaputte Nutzlast
    ausgaenge.push((await lauf({})).status);

    expect(ausgaenge).not.toContain("abgebrochen");
    expect(new Set(ausgaenge)).toEqual(new Set(["erfolg", "fehlgeschlagen"]));
    fehlerLog.mockRestore();
    warnung.mockRestore();
  });

  it("laesst ALLE Bausteine unberuehrt, sobald einer wirft - der Handler wirft selbst nicht", async () => {
    vi.mocked(mitD1Lock).mockRejectedValueOnce(new Error("Lock kaputt"));
    const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(lauf()).resolves.toMatchObject({
      status: "fehlgeschlagen",
      fehler: { code: "unbekannter_fehler" },
    });
    for (const baustein of ALLE_BAUSTEINE) expect(baustein).not.toHaveBeenCalled();
    fehlerLog.mockRestore();
  });
});

describe("exportiereAusgabe - `holeAktivesProjekt` wird nur durchgereicht", () => {
  it("liest kein Feld des Projekts und setzt keines", async () => {
    // Ein Zugriffszaehler auf den Feldern, die zu setzen am naechsten laege.
    let gelesen = 0;
    const projekt: Record<string, unknown> = { id: "p-1" };
    for (const feld of ["letzterAusgabeName", "geaendertAm", "liste", "assets"]) {
      Object.defineProperty(projekt, feld, {
        get() {
          gelesen += 1;
          return null;
        },
        set() {
          throw new Error(`Verbot verletzt: ${feld} wurde gesetzt`);
        },
        enumerable: true,
        configurable: true,
      });
    }
    attrappe.projekt = projekt;

    const ergebnis = await lauf();

    expect(ergebnis).toMatchObject({ status: "erfolg" });
    expect(gelesen).toBe(0);
  });
});
