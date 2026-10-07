// Verhaltenstest zu #299 - Herkunft je Feld anzeigen und ein Feld auf "geerbt" zuruecksetzen.
// rufeAuf und uebernimmAktualisierteMarke sind Doppeln; gemessen werden die Nutzlasten der
// Abbildungstabelle (Sieben Formen), die Übernahme-Reihenfolge und die drei festen Texte.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarkenHerkunftJeFeld, Marke } from "../../src/shared/contracts/marke";
import type { HerkunftPfad } from "../../src/renderer/marken-editor/herkunft-anzeigen";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  uebernimme: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  uebernimmAktualisierteMarke: h.uebernimme,
}));

const {
  setzeFeldAufGeerbt,
  leseHerkunft,
  baueHerkunftText,
} = await import("../../src/renderer/marken-editor/herkunft-anzeigen");

const DIE_ID = "11111111-1111-4111-8111-111111111111";
const GEERBT = { geerbt: true } as const;

function attrappeMarke(): Marke {
  return { id: DIE_ID, name: "M" } as unknown as Marke;
}

function stempel(logo: "eigen" | "geerbt" | "keins" = "geerbt"): MarkenHerkunftJeFeld {
  const alleEigen: Record<string, "eigen" | "geerbt"> = {
    akzent: "geerbt", akzentKraeftig: "eigen", akzentTief: "geerbt",
    flaecheDunkel: "eigen", flaecheSehrDunkel: "geerbt", flaecheHell: "eigen", flaecheAkzentZart: "geerbt",
    textAufDunkel: "eigen", textAufHell: "geerbt", textSekundaer: "eigen",
    linie: "geerbt", scrimStart: "eigen", scrimEnde: "geerbt",
    headlineElegant: "geerbt", headlinePlakativ: "eigen", fliesstext: "geerbt", fliesstextFett: "eigen",
  };
  return {
    farben: alleEigen, schriften: alleEigen, logo,
    sicherheit: "geerbt", radien: "eigen", schatten: "geerbt", slogan: "eigen",
  } as unknown as MarkenHerkunftJeFeld;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks): kein Spion-Aufzeichner aus einem
  // frueheren Test laeuft in den naechsten - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.uebernimme.mockImplementation(() => undefined);
  h.rufeAuf.mockResolvedValue({ ok: true, wert: attrappeMarke() });
});

describe("setzeFeldAufGeerbt (#299): die Sieben Formen der Abbildungstabelle", () => {
  const formen: readonly [string, HerkunftPfad, Record<string, unknown>][] = [
    ["farbe", { art: "farbe", rolle: "akzent" }, { farben: { akzent: GEERBT } }],
    ["schrift", { art: "schrift", rolle: "fliesstext" }, { schriften: { fliesstext: GEERBT } }],
    ["logo", { art: "logo" }, { logo: GEERBT }],
    ["sicherheit", { art: "sicherheit" }, { sicherheit: GEERBT }],
    ["radien", { art: "radien" }, { radien: GEERBT }],
    ["schatten", { art: "schatten" }, { schatten: GEERBT }],
    ["slogan", { art: "slogan" }, { slogan: GEERBT }],
  ];

  it.each(formen)("%s -> GENAU das teilwerte-Objekt der Tabelle", async (_t, pfad, teilwerte) => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: attrappeMarke() });

    await setzeFeldAufGeerbt(DIE_ID, pfad);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:bearbeiteMarke", {
      markeId: DIE_ID,
      teilwerte,
    });
  });

  it("EXAKT EIN Feld je Aufruf: die Nutzlast kennt nur einen Schlüssel", async () => {
    const antwort = (await setzeFeldAufGeerbt(DIE_ID, { art: "radien" })) as unknown as {
      ok: true;
    };
    expect(antwort.ok).toBe(true);
    const nutzlast = h.rufeAuf.mock.calls[0]![1] as { teilwerte: Record<string, unknown> };
    expect(Object.keys(nutzlast.teilwerte)).toHaveLength(1);
  });
});

describe("setzeFeldAufGeerbt (#299): Erfolg, Fehler, Übernahme-Reihenfolge", () => {
  it("uebernimmAktualisierteMarke laeuft VOR der Rueckkehr; Ergebnis UNVERAENDERT", async () => {
    const marke = attrappeMarke();
    const folge: string[] = [];
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      folge.push(kanal);
      return { ok: true as const, wert: marke };
    });
    h.uebernimme.mockImplementation(() => folge.push("uebernimm"));

    const antwort = (await setzeFeldAufGeerbt(DIE_ID, { art: "logo" })) as { wert: Marke };

    expect(antwort.wert).toBe(marke);
    expect(folge).toEqual(["marken:bearbeiteMarke", "uebernimm"]);
  });

  it("Store-Fehler reisen UNVERAENDERT (auch Simulierung eigenstaendige Marke: ungueltige_eingabe); KEINE Übernahme", async () => {
    for (const code of ["ungueltige_eingabe", "marke_nicht_gefunden", "speicher_fehler"]) {
      h.rufeAuf.mockResolvedValueOnce({
        ok: false,
        fehler: { code, meldung: "vom Store" },
      });
      const antwort = (await setzeFeldAufGeerbt(DIE_ID, { art: "slogan" })) as {
        fehler: { code: string; meldung: string };
      };
      expect(antwort.fehler.code).toBe(code);
      expect(antwort.fehler.meldung).toBe("vom Store");
    }
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("leere/Whitespace markeId loest KEINEN IPC-Ruf aus", async () => {
    for (const leer of ["", "   "]) {
      const antwort = (await setzeFeldAufGeerbt(leer, { art: "logo" })) as {
        fehler: { code: string };
      };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });
});

describe("leseHerkunft (#299): alle Sieben Formen ablesen, NUR aus dem Stempel", () => {
  it("liest je Form aus herkunftJeFeld - farbe/schriften feldweise, logo mit 'keins'", () => {
    const herkunft = stempel("keins");
    expect(leseHerkunft(herkunft, { art: "farbe", rolle: "akzent" })).toBe("geerbt");
    expect(leseHerkunft(herkunft, { art: "farbe", rolle: "akzentKraeftig" })).toBe("eigen");
    expect(leseHerkunft(herkunft, { art: "schrift", rolle: "fliesstext" })).toBe("geerbt");
    expect(leseHerkunft(herkunft, { art: "schrift", rolle: "headlinePlakativ" })).toBe("eigen");
    expect(leseHerkunft(herkunft, { art: "logo" })).toBe("keins");
    expect(leseHerkunft(herkunft, { art: "sicherheit" })).toBe("geerbt");
    expect(leseHerkunft(herkunft, { art: "radien" })).toBe("eigen");
    expect(leseHerkunft(herkunft, { art: "schatten" })).toBe("geerbt");
    expect(leseHerkunft(herkunft, { art: "slogan" })).toBe("eigen");
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("baueHerkunftText (#299): die DREI festen Texte (String-Gleichheit)", () => {
  it("eigen / geerbt / keins - exakt die Tabelle, mit geradem Schluss-Anfuehrungszeichen", () => {
    expect(baueHerkunftText("eigen", "x")).toBe("Eigener Wert dieser Marke.");
    expect(baueHerkunftText("geerbt", "Fitnessworld24")).toBe(
      "Geerbt von \u201EFitnessworld24\". \u00C4ndert sich automatisch, wenn dort ge\u00E4ndert wird.",
    );
    expect(baueHerkunftText("keins", "egal")).toBe(
      "Kein eigenes Logo \u2013 der Ersatz mit Markennamen wird angezeigt.",
    );
  });
});
