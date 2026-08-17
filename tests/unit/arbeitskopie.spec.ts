// Verhaltenstests zu #143 - auf einer Arbeitskopie arbeiten und den Parent anzeigen
// (TK 9.12.2, TK 9.12.1, TK 9.1.1).
//
// `rufeAuf` (#24) wird ersetzt, weil es an `window.api` haengt - die Bruecke gibt es im
// Testlauf nicht. Der Ersatz ist zugleich der Beweis: Der einzige Weg in den Main fuehrt
// ueber diesen Kanal, und die Zaehl-/Spy-Tests pruefen die Aufrufreihenfolge und -grenzen.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Vorlage, Zone } from "../../src/shared/contracts/vorlage";
import { KANAELE } from "../../src/shared/contracts/kanaele";

const attrappen = vi.hoisted(() => ({ rufeAuf: vi.fn() }));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

import {
  GRUND_PARENT_EINGEBAUT,
  sichereStand,
  starteBearbeitung,
  type EditorSitzung,
} from "../../src/renderer/vorlagen-editor/arbeitskopie";

function zone(teil: Partial<Zone>): Zone {
  return {
    id: "festeZone",
    rolle: "fest",
    bindung: null,
    rahmen: { x: 0, y: 0, breite: 100, höhe: 100 },
    ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
    wennLeer: "leer",
    ...teil,
  };
}

function vorlage(teil: Partial<Vorlage>): Vorlage {
  return {
    id: "v-1",
    name: "Vorlage",
    art: "vollflaeche",
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [],
    ...teil,
  };
}

function sitzung(teil: Partial<EditorSitzung> = {}): EditorSitzung {
  const arbeitskopie = vorlage({ id: "ak-1", parent: "v-1" });
  return {
    arbeitsId: "ak-1",
    arbeitskopie,
    parentId: "v-1",
    parentName: "Vorlage",
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: [],
    ...teil,
  };
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("starteBearbeitung", () => {
  it("ruft listeVorlagen VOR oeffneZurBearbeitung und bricht bei unbekannter ID ab", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: [vorlage({ id: "v-1" }), vorlage({ id: "v-2" })],
    });
    const ergebnis = await starteBearbeitung("v-99");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: {
        code: "nicht_gefunden",
        meldung: expect.stringContaining("v-99"),
      },
    });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.listeVorlagen);
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(KANAELE.vorlagen.oeffneZurBearbeitung, expect.anything());
  });

  it("lehnt eine leere vorlagenId ohne jeden IPC-Aufruf ab", async () => {
    const ergebnis = await starteBearbeitung("");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("reicht einen Fehler von listeVorlagen unveraendert durch, ohne oeffneZurBearbeitung", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("reicht einen Fehler von oeffneZurBearbeitung unveraendert durch", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: [vorlage({ id: "v-1" })] })
      .mockResolvedValueOnce({
        ok: false,
        fehler: { code: "speicher_fehler", meldung: "Platte voll" },
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
  });

  it("nimmt parentName und parentEingebaut aus dem PARENT-Eintrag, nicht aus der Arbeitskopie", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({
        ok: true,
        wert: [vorlage({ id: "v-1", name: "Mitgeliefert", eingebaut: true })],
      })
      .mockResolvedValueOnce({
        ok: true,
        wert: vorlage({ id: "ak-1", parent: "v-1", eingebaut: false, name: "Mitgeliefert" }),
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.parentName).toBe("Mitgeliefert");
      expect(ergebnis.wert.parentEingebaut).toBe(true);
    }
  });

  it("setzt ueberarbeitenErlaubt=false mit GRUND_PARENT_EINGEBAUT genau bei eingebautem Parent", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: [vorlage({ id: "v-1", eingebaut: true })] })
      .mockResolvedValueOnce({
        ok: true,
        wert: vorlage({ id: "ak-1", parent: "v-1", eingebaut: false }),
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.ueberarbeitenErlaubt).toBe(false);
      expect(ergebnis.wert.ueberarbeitenGrund).toBe(GRUND_PARENT_EINGEBAUT);
    }
  });

  it("setzt ueberarbeitenErlaubt=true und ueberarbeitenGrund=null bei eigenem Parent", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: [vorlage({ id: "v-1", eingebaut: false })] })
      .mockResolvedValueOnce({
        ok: true,
        wert: vorlage({ id: "ak-1", parent: "v-1", eingebaut: false }),
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.ueberarbeitenErlaubt).toBe(true);
      expect(ergebnis.wert.ueberarbeitenGrund).toBeNull();
    }
  });

  it("bricht mit unbekannter_fehler ab, wenn arbeitskopie.parent von vorlagenId abweicht", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: [vorlage({ id: "v-1" })] })
      .mockResolvedValueOnce({
        ok: true,
        wert: vorlage({ id: "ak-1", parent: "fremd" }),
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: {
        code: "unbekannter_fehler",
        meldung: expect.stringContaining("v-1"),
      },
    });
  });

  it("friert festeZonenSoll beim Oeffnen aus den festen Zonen der Arbeitskopie ein", async () => {
    const feste = [zone({ id: "rahmen" }), zone({ id: "logo" })];
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: [vorlage({ id: "v-1" })] })
      .mockResolvedValueOnce({
        ok: true,
        wert: vorlage({ id: "ak-1", parent: "v-1", zonen: [zone({ rolle: "frei" }), ...feste] }),
      });
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.festeZonenSoll).toEqual(feste);
    }
  });

  it("faengt eine werfende rufeAuf-Attrappe als unbekannter_fehler, ohne Ausnahme", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));
    const ergebnis = await starteBearbeitung("v-1");
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("sichereStand", () => {
  it("schickt arbeitsId und uebernimmt den zurueckgegebenen Stand in eine NEUE Sitzung", async () => {
    const s = sitzung();
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: vorlage({ id: "ak-1", parent: "v-1", name: "Getrimmt" }),
    });
    const ergebnis = await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.speichereArbeitskopie, {
      arbeitsId: "ak-1",
      vorlage: vorlage({ id: "ak-1", parent: "v-1" }),
    });
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert).not.toBe(s);
      expect(ergebnis.wert.arbeitskopie.name).toBe("Getrimmt");
      expect(ergebnis.wert.arbeitskopie).not.toBe(s.arbeitskopie);
    }
  });

  it("laesst die uebergebene sitzung unveraendert", async () => {
    const s = sitzung();
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: vorlage({ id: "ak-1", parent: "v-1", name: "Getrimmt" }),
    });
    await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(s.arbeitskopie.name).toBe("Vorlage");
  });

  it("behaelt festeZonenSoll nach sichereStand unveraendert, auch bei anderem Stand", async () => {
    const feste = [zone({ id: "rahmen" })];
    const s = sitzung({ festeZonenSoll: feste });
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: vorlage({
        id: "ak-1",
        parent: "v-1",
        zonen: [zone({ id: "rahmen", rolle: "frei" }), zone({ id: "neu", rolle: "frei" })],
      }),
    });
    const ergebnis = await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.festeZonenSoll).toEqual(feste);
    }
  });

  it("lehnt eine fremde stand.id ohne IPC-Aufruf ab", async () => {
    const s = sitzung();
    const ergebnis = await sichereStand(s, vorlage({ id: "fremd", parent: "v-1" }));
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("reicht einen Store-Fehler unveraendert durch und verlaesst die Sitzung", async () => {
    const s = sitzung();
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    const ergebnis = await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
  });

  it("reicht eine verbrauchte Sitzung (nicht_gefunden) unveraendert durch, OHNE neue Arbeitskopie", async () => {
    const s = sitzung();
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    const ergebnis = await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(KANAELE.vorlagen.oeffneZurBearbeitung, expect.anything());
  });

  it("reicht eine verbrauchte Sitzung (ungueltige_eingabe nach alsEigenstaendige) unveraendert durch", async () => {
    const s = sitzung();
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "ist eine genutzte Vorlage" },
    });
    const ergebnis = await sichereStand(s, vorlage({ id: "ak-1", parent: "v-1" }));
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "ist eine genutzte Vorlage" },
    });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(KANAELE.vorlagen.oeffneZurBearbeitung, expect.anything());
  });

  it("faengt eine werfende rufeAuf-Attrappe als unbekannter_fehler, ohne Ausnahme", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));
    const ergebnis = await sichereStand(sitzung(), vorlage({ id: "ak-1", parent: "v-1" }));
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const CODE = readFileSync("src/renderer/vorlagen-editor/arbeitskopie.ts", "utf-8");

  it("enthaelt keinen Timer, kein setTimeout, keine Historie, keinen Modul-Zustand", () => {
    expect(CODE).not.toMatch(/setTimeout/);
    expect(CODE).not.toMatch(/setInterval/);
    expect(CODE).not.toMatch(/^let /m);
  });

  it("enthaelt kein vorlagen:geaendert und kein Abonnement", () => {
    expect(CODE).not.toContain("vorlagen:geaendert");
    expect(CODE).not.toMatch(/abonniere|\.on\(/);
  });

  it("importiert nichts aus vorlagen-uebersicht.ts (#155)", () => {
    expect(CODE).not.toContain("vorlagen-uebersicht");
  });

  it("enthaelt kein Kanal-Literal 'vorlagen:'", () => {
    expect(CODE).not.toContain("'vorlagen:");
  });

  it("enthaelt weder window.api noch fs noch ipcRenderer", () => {
    expect(CODE).not.toMatch(/window\.api/);
    expect(CODE).not.toMatch(/\bfs\b/);
    expect(CODE).not.toContain("ipcRenderer");
  });
});
