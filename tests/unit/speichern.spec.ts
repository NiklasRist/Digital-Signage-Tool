// Verhaltenstests zu #149 - Speichern: ueberarbeiten, als neue Vorlage, verwerfen
// (TK 9.12.2, 9.12.1, 9.1.1, Anforderungsdokument 4.6).
//
// Gegenstand ist ausschliesslich VERHALTEN: Aufrufreihenfolge, Abbruch-Pfade, das Neuladen
// der Sicht. `rufeAuf`, `sichereStand`, `pruefeVorlage` und `istSpeicherbar` werden als
// Doppel ersetzt; die Spione belegen zugleich, dass diese Datei den Main nur ueber den
// einen Kanal erreicht und die Sicht nur ueber den Parameter anstoesst.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Vorlage } from "../../src/shared/contracts/vorlage";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import type { EditorSitzung } from "../../src/renderer/vorlagen-editor/arbeitskopie";
import { GRUND_PARENT_EINGEBAUT } from "../../src/renderer/vorlagen-editor/arbeitskopie";

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  sichereStand: vi.fn(),
  pruefeVorlage: vi.fn(),
  istSpeicherbar: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

vi.mock("../../src/renderer/vorlagen-editor/arbeitskopie", () => ({
  GRUND_PARENT_EINGEBAUT:
    "Diese Vorlage ist mitgeliefert und bleibt unveraendert. Speichern ist nur als neue eigenstaendige Vorlage moeglich.",
  sichereStand: attrappen.sichereStand,
}));

vi.mock("../../src/renderer/vorlagen-editor/pruefungen", () => ({
  pruefeVorlage: attrappen.pruefeVorlage,
  istSpeicherbar: attrappen.istSpeicherbar,
}));

import {
  alsNeueVorlage,
  ueberarbeiteVorlage,
  verwerfeBearbeitung,
} from "../../src/renderer/vorlagen-editor/speichern";

function vorlage(id: string, parent: string | null = null): Vorlage {
  return {
    id,
    name: "Vorlage",
    art: "vollflaeche",
    höhe: null,
    parent,
    eingebaut: false,
    zonen: [],
  };
}

function sitzung(teil: Partial<EditorSitzung> = {}): EditorSitzung {
  return {
    arbeitsId: "ak-1",
    arbeitskopie: vorlage("ak-1", "v-1"),
    parentId: "v-1",
    parentName: "Vorlage",
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: [],
    ...teil,
  };
}

function klarerPfad() {
  attrappen.pruefeVorlage.mockReturnValue([]);
  attrappen.istSpeicherbar.mockReturnValue(true);
  attrappen.sichereStand.mockResolvedValue({
    ok: true,
    wert: { ...sitzung(), arbeitskopie: vorlage("ak-1", "v-1") },
  });
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
  attrappen.sichereStand.mockReset();
  attrappen.pruefeVorlage.mockReset();
  attrappen.istSpeicherbar.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ueberarbeiteVorlage", () => {
  it("bricht bei eingebautem Parent mit parent_eingebaut ab, OHNE rufeAuf", async () => {
    const s = sitzung({ ueberarbeitenErlaubt: false, ueberarbeitenGrund: null });
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "parent_eingebaut", meldung: GRUND_PARENT_EINGEBAUT },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("nimmt einen gesetzten ueberarbeitenGrund aus der Sitzung", async () => {
    const grund = "Eigener Grund";
    const s = sitzung({ ueberarbeitenErlaubt: false, ueberarbeitenGrund: grund });
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "parent_eingebaut", meldung: grund },
    });
  });

  it("bricht bei einer Sperre mit ungueltige_eingabe und daten.befunde ab, OHNE rufeAuf", async () => {
    attrappen.pruefeVorlage.mockReturnValue([
      { schwere: "sperre", code: "zone_ausserhalb", zonenId: "x", meldung: "m" },
    ]);
    attrappen.istSpeicherbar.mockReturnValue(false);
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.daten).toEqual({
        befunde: [{ schwere: "sperre", code: "zone_ausserhalb", zonenId: "x", meldung: "m" }],
      });
    }
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("reicht sitzung.festeZonenSoll an pruefeVorlage weiter", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const s = sitzung({ festeZonenSoll: [] as never });
    await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(attrappen.pruefeVorlage).toHaveBeenCalledWith(s.arbeitskopie, s.festeZonenSoll);
  });

  it("laesst eine reine Warnung passieren und ruft den Kanal", async () => {
    attrappen.pruefeVorlage.mockReturnValue([
      { schwere: "warnung", code: "sicherheitsabstand", zonenId: "x", meldung: "m" },
    ]);
    attrappen.istSpeicherbar.mockReturnValue(true);
    attrappen.sichereStand.mockResolvedValue({ ok: true, wert: sitzung() });
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis).toEqual({ ok: true, wert: vorlage("v-1") });
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.uebernehmeInParent, {
      arbeitsId: "ak-1",
    });
  });

  it("fuehrt sichereStand VOR uebernehmeInParent aus (Reihenfolge belegt)", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const s = sitzung();
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    const sicherStandRuf = attrappen.sichereStand.mock.invocationCallOrder[0]!;
    const kanalRuf = attrappen.rufeAuf.mock.invocationCallOrder[0]!;
    expect(sicherStandRuf).toBeLessThan(kanalRuf);
  });

  it("verhindert den Merge, wenn sichereStand fehlschlaegt", async () => {
    attrappen.pruefeVorlage.mockReturnValue([]);
    attrappen.istSpeicherbar.mockReturnValue(true);
    attrappen.sichereStand.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("ruft sichtNeuLaden genau einmal und NACH dem Kanalaufruf bei Erfolg", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const s = sitzung();
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(sichtNeuLaden).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf.mock.invocationCallOrder[0]!).toBeLessThan(
      sichtNeuLaden.mock.invocationCallOrder[0]!,
    );
  });

  it("ruft sichtNeuLaden auf keinem Fehlerpfad (parent_eingebaut)", async () => {
    const s = sitzung({ ueberarbeitenErlaubt: false });
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(sichtNeuLaden).not.toHaveBeenCalled();
  });

  it("ruft sichtNeuLaden auf keinem Fehlerpfad (Sperre)", async () => {
    attrappen.pruefeVorlage.mockReturnValue([
      { schwere: "sperre", code: "zone_ausserhalb", zonenId: "x", meldung: "m" },
    ]);
    attrappen.istSpeicherbar.mockReturnValue(false);
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    const s = sitzung();
    await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(sichtNeuLaden).not.toHaveBeenCalled();
  });

  it("ruft sichtNeuLaden auf keinem Fehlerpfad (gescheitertes sichereStand)", async () => {
    attrappen.pruefeVorlage.mockReturnValue([]);
    attrappen.istSpeicherbar.mockReturnValue(true);
    attrappen.sichereStand.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    const s = sitzung();
    await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(sichtNeuLaden).not.toHaveBeenCalled();
  });

  it("ruft sichtNeuLaden auf keinem Fehlerpfad (ok: false des Kanals)", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    expect(sichtNeuLaden).not.toHaveBeenCalled();
  });

  it("behaelt den Erfolg, wenn sichtNeuLaden einen Fehler zurueckgibt", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const sichtNeuLaden = vi.fn().mockResolvedValue(new Error("Sicht kaputt"));
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(ergebnis).toEqual({ ok: true, wert: vorlage("v-1") });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("behaelt den Erfolg, wenn sichtNeuLaden wirft, und wiederholt nichts", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const sichtNeuLaden = vi.fn().mockRejectedValue(new Error("Kaputt"));
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, sichtNeuLaden);
    expect(ergebnis).toEqual({ ok: true, wert: vorlage("v-1") });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("reicht einen Store-Fehler mit unveraendertem daten-Feld durch", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "voll", daten: { belegt: true } },
    });
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "voll", daten: { belegt: true } },
    });
  });

  it("faengt eine werfende rufeAuf-Attrappe als unbekannter_fehler, ohne Ausnahme", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));
    const s = sitzung();
    const ergebnis = await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });

  it("ruft nach dem Abschluss von sich aus nichts weiter (Sitzung verbraucht)", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("v-1") });
    const s = sitzung();
    await ueberarbeiteVorlage(s, s.arbeitskopie, vi.fn());
    expect(attrappen.sichereStand).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(
      KANAELE.vorlagen.oeffneZurBearbeitung,
      expect.anything(),
    );
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(
      KANAELE.vorlagen.speichereArbeitskopie,
      expect.anything(),
    );
  });
});

describe("alsNeueVorlage", () => {
  it("uebergibt den getrimmten Namen an den Kanal", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("ak-1", null) });
    const s = sitzung();
    const ergebnis = await alsNeueVorlage(s, s.arbeitskopie, "  Neu Name  ", vi.fn());
    expect(ergebnis).toEqual({ ok: true, wert: vorlage("ak-1", null) });
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.alsEigenstaendige, {
      arbeitsId: "ak-1",
      name: "Neu Name",
    });
  });

  it("lehnt einen leeren Namen ohne IPC-Aufruf ab", async () => {
    const s = sitzung();
    const ergebnis = await alsNeueVorlage(s, s.arbeitskopie, "   ", vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
    expect(attrappen.sichereStand).not.toHaveBeenCalled();
  });

  it("lehnt einen Namen ueber 80 Zeichen ohne IPC-Aufruf ab", async () => {
    const s = sitzung();
    const ergebnis = await alsNeueVorlage(s, s.arbeitskopie, "x".repeat(81), vi.fn());
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("funktioniert auch bei eingebautem Parent (kein ueberarbeitenErlaubt-Test)", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("ak-1", null) });
    const s = sitzung({ parentEingebaut: true, ueberarbeitenErlaubt: false });
    const ergebnis = await alsNeueVorlage(s, s.arbeitskopie, "Neu", vi.fn());
    expect(ergebnis).toEqual({ ok: true, wert: vorlage("ak-1", null) });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("bricht bei einer Sperre mit ungueltige_eingabe und daten.befunde ab, OHNE rufeAuf", async () => {
    attrappen.pruefeVorlage.mockReturnValue([
      { schwere: "sperre", code: "feste_zone_veraendert", zonenId: "logo", meldung: "m" },
    ]);
    attrappen.istSpeicherbar.mockReturnValue(false);
    const s = sitzung();
    const ergebnis = await alsNeueVorlage(s, s.arbeitskopie, "Neu", vi.fn());
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.daten).toEqual({
        befunde: [{ schwere: "sperre", code: "feste_zone_veraendert", zonenId: "logo", meldung: "m" }],
      });
    }
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("reicht sitzung.festeZonenSoll an pruefeVorlage weiter", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("ak-1", null) });
    const s = sitzung({ festeZonenSoll: [] as never });
    await alsNeueVorlage(s, s.arbeitskopie, "Neu", vi.fn());
    expect(attrappen.pruefeVorlage).toHaveBeenCalledWith(s.arbeitskopie, s.festeZonenSoll);
  });

  it("fuehrt sichereStand VOR alsEigenstaendige aus", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("ak-1", null) });
    const s = sitzung();
    await alsNeueVorlage(s, s.arbeitskopie, "Neu", vi.fn());
    expect(attrappen.sichereStand.mock.invocationCallOrder[0]!).toBeLessThan(
      attrappen.rufeAuf.mock.invocationCallOrder[0]!,
    );
  });

  it("ruft sichtNeuLaden genau einmal und NACH dem Kanalaufruf bei Erfolg", async () => {
    klarerPfad();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: vorlage("ak-1", null) });
    const s = sitzung();
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    await alsNeueVorlage(s, s.arbeitskopie, "Neu", sichtNeuLaden);
    expect(sichtNeuLaden).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf.mock.invocationCallOrder[0]!).toBeLessThan(
      sichtNeuLaden.mock.invocationCallOrder[0]!,
    );
  });
});

describe("verwerfeBearbeitung", () => {
  it("ruft GENAU einen Kanal auf und laedt die Sicht", async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined });
    const s = sitzung();
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    const ergebnis = await verwerfeBearbeitung(s, sichtNeuLaden);
    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.verwerfeArbeitskopie, {
      arbeitsId: "ak-1",
    });
    expect(sichtNeuLaden).toHaveBeenCalledTimes(1);
  });

  it("ruft weder sichereStand noch pruefeVorlage", async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined });
    const s = sitzung();
    await verwerfeBearbeitung(s, vi.fn());
    expect(attrappen.sichereStand).not.toHaveBeenCalled();
    expect(attrappen.pruefeVorlage).not.toHaveBeenCalled();
  });

  it("ruft sichtNeuLaden bei ok: false des Kanals NICHT", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    const sichtNeuLaden = vi.fn().mockResolvedValue(undefined);
    const s = sitzung();
    const ergebnis = await verwerfeBearbeitung(s, sichtNeuLaden);
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    expect(sichtNeuLaden).not.toHaveBeenCalled();
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const CODE = readFileSync("src/renderer/vorlagen-editor/speichern.ts", "utf-8");

  it("enthaelt kein zweites Text-Literal der eingebaut-Sperre (mitgeliefert)", () => {
    expect(CODE).not.toContain("mitgeliefert");
  });

  it("enthaelt keine Nutzungsanzeige und keinen Kanal dafuer", () => {
    expect(CODE).not.toContain("pruefeVorlagenReferenzen");
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