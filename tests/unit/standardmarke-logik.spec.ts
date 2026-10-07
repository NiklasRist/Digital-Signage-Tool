// Verhaltenstest zu #324 - Standardmarke: Lage, ohne Notfall, Wechsel; Anzeige jsdom.
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";
import type { ProjektMeta } from "../../src/shared/contracts/projekt-meta";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));

const { baueStandardmarkenLage, istWechselNoetig, wechsleStandardMarke } =
  await import("../../src/renderer/projekt-verwaltung/standardmarke");

const P_ID = "11111111-1111-4111-8111-111111111111";
const M_EINGEBAUT = "22222222-2222-4222-8222-222222222222";
const M_LIMA = "33333333-3333-4333-8333-333333333333";

function meta(beschaedigt = false): ProjektMeta {
  return {
    id: P_ID, name: "P", erstelltAm: "", geaendertAm: "", ordner: P_ID,
    beschaedigt, anzahlMedien: 0, anzahlAusgaben: 0, standardMarkeId: null,
  } as unknown as ProjektMeta;
}

function marke(id: string, name: string, eingebaut = false): Marke {
  return { id, name, parent: null, eingebaut } as unknown as Marke;
}

const BESTAND = [marke(M_EINGEBAUT, "Fitnessworld24", true), marke(M_LIMA, "Saison-Look")];

beforeEach(() => {
  vi.resetAllMocks();
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "unbekannter_fehler", meldung: "x" } });
});

describe("baueStandardmarkenLage (#324)", () => {
  it("beschaedigt: IMMER gesperrt/beschaedigt - auch mit Bestand und Kennung", () => {
    const lage = baueStandardmarkenLage(meta(true), M_LIMA, BESTAND);
    expect(lage).toEqual({ art: "gesperrt", grund: "beschaedigt" });
  });

  it("kein Bestand (null UND leeres Array): gesperrt/kein_bestand (zwei Prüfungen)", () => {
    for (const bestand of [null, []]) {
      const lage = baueStandardmarkenLage(meta(false), M_LIMA, bestand as readonly Marke[] | null);
      expect(lage).toEqual({ art: "gesperrt", grund: "kein_bestand" });
    }
  });

  it("bereit: aktuelle toBe-gleich aus dem BESTAND; wahl in Bestandsreihenfolge; GENAU einer aktuell", () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND) as {
      art: string;
      aktuelle: Marke;
      wahl: readonly { aktuell: boolean }[];
    };
    expect(lage.art).toBe("bereit");
    expect(lage.aktuelle).toBe(BESTAND[1]); // ToBe auf das Original
    expect(lage.wahl.map((w) => (w as unknown as { id: string }).id)).toEqual([M_EINGEBAUT, M_LIMA]);
    expect(lage.wahl.filter((w) => (w as { aktuell: boolean }).aktuell)).toHaveLength(1);
    expect(lage.wahl[1]).toHaveProperty("aktuell", true);
  });

  it("unbekannte Kennung: unverändert übernommen, KEIN Eintrag aktuell", () => {
    const lage = baueStandardmarkenLage(meta(false), "keins", BESTAND) as {
      art: string; markeId: string; wahl: readonly { aktuell: boolean }[];
    };
    expect(lage.art).toBe("unbekannte_marke");
    expect(lage.markeId).toBe("keins");
    expect(lage.wahl.every((w) => !(w as { aktuell: boolean }).aktuell)).toBe(true);
  });

  it("null-Kennung + kein Bestand: gesperrt/kein_bestand; null-Kennung MIT Bestand: unbekannte_marke mit ''", () => {
    expect(baueStandardmarkenLage(meta(false), null, null)).toEqual({ art: "gesperrt", grund: "kein_bestand" });
    const lage = baueStandardmarkenLage(meta(false), null, BESTAND) as { art: string; markeId: string };
    expect(lage.art).toBe("unbekannte_marke");
    expect(lage.markeId).toBe("");
  });

  it("REIN: friert Eingaben ein (kein Wurf), ruft NICHTS", () => {
    Object.freeze(BESTAND);
    const eingabe = Object.freeze(meta(false));
    expect(() => baueStandardmarkenLage(eingabe, M_LIMA, BESTAND)).not.toThrow();
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("istWechselNoetig (#324) - drei benannte Faelle", () => {
  it("(null, 'm1') true; ('m1','m1') false; ('m1','') false", () => {
    expect(istWechselNoetig(null, "m1")).toBe(true);
    expect(istWechselNoetig("m1", "m1")).toBe(false);
    expect(istWechselNoetig("m1", "")).toBe(false);
  });
});

function wirkungen(ueber: { aktiv?: Project; uebernimmt: (projekt: Project) => void; liste: () => Promise<unknown>; melde: (a: string, m: string) => void }): StandardmarkenWirkungen {
  return {
    holeProjekt: vi.fn(() => ueber.aktiv ?? null),
    uebernimmProjekt: vi.fn(ueber.uebernimmt),
    aktualisiereProjektliste: ueber.liste,
    meldeFehler: vi.fn(ueber.melde),
  };
}

describe("wechsleStandardMarke (#324)", () => {
  it("GENAU EIN Ruf, Nutzlast EXAKT { projektId, markeId }; Projekt toBe-gleich zurück; beide Wirkungen", async () => {
    const projekt = { id: P_ID, standardMarkeId: M_LIMA } as unknown as Project;
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt });
    const uebernimmt = vi.fn();
    const liste = vi.fn().mockResolvedValue(undefined);
    const melde = vi.fn();
    const antwort = (await wechsleStandardMarke(P_ID, M_LIMA, {
      holeProjekt: vi.fn(() => projekt),
      uebernimmProjekt: uebernimmt,
      aktualisiereProjektliste: liste,
      meldeFehler: melde,
    })) as {
      ok: boolean;
      wert: Project;
    };

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("project:setzeStandardMarke", {
      projektId: P_ID, markeId: M_LIMA,
    });
    expect(antwort.wert).toBe(projekt);
    expect(uebernimmt).toHaveBeenCalledTimes(1);
    expect(uebernimmt).toHaveBeenCalledWith(projekt);
    expect(liste).toHaveBeenCalledTimes(1);
    expect(melde).not.toHaveBeenCalled();
  });

  it("fremde id (holeProjekt traegt ANDEREN Zustand): uebernimmProjekt 0 Mal; liste trotzdem 1 Mal", async () => {
    const uebernimmt = vi.fn();
    const liste = vi.fn().mockResolvedValue(undefined);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: P_ID } as unknown as Project });

    await wechsleStandardMarke(P_ID, M_LIMA, {
      holeProjekt: () => ({ id: "AnderesGeladenes" } as unknown as Project),
      uebernimmProjekt: uebernimmt,
      aktualisiereProjektliste: liste,
      meldeFehler: vi.fn(),
    });

    expect(uebernimmt).not.toHaveBeenCalled();
    expect(liste).toHaveBeenCalledTimes(1);
  });

  it("null-holeProjekt: uebernimm 0 Mal; liste trotzdem 1 Mal", async () => {
    const uebernimmt = vi.fn();
    const liste = vi.fn().mockResolvedValue(undefined);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: "anderes" } as unknown as Project });

    await wechsleStandardMarke(P_ID, M_LIMA, {
      holeProjekt: () => null,
      uebernimmProjekt: uebernimmt,
      aktualisiereProjektliste: liste,
      meldeFehler: vi.fn(),
    });

    expect(uebernimmt).not.toHaveBeenCalled();
    expect(liste).toHaveBeenCalledTimes(1);
  });

  it("Fehler (marke_nicht_gefunden UND erfundener Code): meldeFehler mit UNVERAENDERTEN Werten; sonst nichts", async () => {
    for (const [code, meldung] of [["marke_nicht_gefunden", "unbekannt im Bestand"], ["unbekannter_code_fremd", "unverändert"]]) {
      const uebernimmt = vi.fn();
      const liste = vi.fn();
      const melde = vi.fn();
      h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code, meldung } });

      const antwort = (await wechsleStandardMarke(P_ID, M_LIMA, {
        holeProjekt: () => null,
        uebernimmProjekt: uebernimmt,
        aktualisiereProjektliste: liste,
        meldeFehler: melde,
      })) as { fehler: { code: string } };

      expect(antwort.fehler.code).toBe(code);
      expect(melde).toHaveBeenCalledTimes(1);
      expect(melde).toHaveBeenCalledWith(code, meldung);
      expect(uebernimmt).not.toHaveBeenCalled();
      expect(liste).not.toHaveBeenCalled();
    }
  });

  it("aktualisiereProjektliste scheitert: Ergebnis bleibt ok: true, keine Meldung", async () => {
    const melde = vi.fn();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: P_ID } as unknown as Project });
    const liste = vi.fn().mockRejectedValue(new Error("Laden scheiterte"));

    const antwort = (await wechsleStandardMarke(P_ID, M_LIMA, {
      holeProjekt: () => ({ id: P_ID } as unknown as Project),
      uebernimmProjekt: vi.fn(),
      aktualisiereProjektliste: liste,
      meldeFehler: melde,
    })) as { ok: boolean };

    expect(antwort.ok).toBe(true);
    expect(melde).not.toHaveBeenCalled();
  });
});

import type { Project } from "../../src/shared/contracts/project";
import type { StandardmarkenWirkungen } from "../../src/renderer/projekt-verwaltung/standardmarke";
