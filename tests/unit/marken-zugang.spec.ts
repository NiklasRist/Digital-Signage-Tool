// Verhaltenstest zu #305 - der Zugang zur gemeinsamen Marken-Sicht.
//
// Der marken-editor wird MOCKT (fremdes Modul, bereits gebaut); gemessen wird allein,
// dass diese Datei die drei Funktionen UNVERAENDERT durchreicht und beim ersten
// Fehler keinen Zugang baut.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  ladeUebersicht: vi.fn(),
  holeUebersicht: vi.fn((): unknown => null),
  aufUebersichtGeaendert: vi.fn(() => () => undefined),
}));

vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  ladeUebersicht: h.ladeUebersicht,
  holeUebersicht: h.holeUebersicht,
  aufUebersichtGeaendert: h.aufUebersichtGeaendert,
}));

const hier: { ladeUebersicht: unknown; holeUebersicht: unknown; aufUebersichtGeaendert: unknown } = {
  ladeUebersicht: h.ladeUebersicht,
  holeUebersicht: h.holeUebersicht,
  aufUebersichtGeaendert: h.aufUebersichtGeaendert,
};

const { baueMarkenZugang } = await import("../../src/renderer/app-shell/marken-zugang");

function attrappeMarke(id: string): Marke {
  return { id, name: "M-" + id } as unknown as Marke;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.holeUebersicht.mockImplementation(() => null);
});

describe("baueMarkenZugang (#305)", () => {
  it("ruft ladeUebersicht genau einmal und liefert einen Zugang, dessen hole() DIE GELADENE Sicht haelt", async () => {
    const geladen = { marken: [attrappeMarke("A")] };
    h.holeUebersicht.mockImplementation(() => geladen); // nach dem Setzen
    h.ladeUebersicht.mockResolvedValueOnce({ ok: true, wert: geladen as never });

    const antwort = (await baueMarkenZugang()) as {
      ok: boolean;
      wert?: { hole: () => { marken: readonly Marke[] } };
    };

    expect(h.ladeUebersicht).toHaveBeenCalledTimes(1);
    expect(antwort.ok).toBe(true);
    // hole() SOFORT gefuellt - kein weiterer Aufruf noetig.
    expect(antwort.wert?.hole().marken.map((m) => m.id)).toEqual(["A"]);
  });

  it("die drei Funktionen sind toBe-gleich zu marken-uebersicht - kein Wrapper, kein Zusatzverhalten", async () => {
    h.ladeUebersicht.mockResolvedValueOnce({ ok: true, wert: { marken: [] } as never });

    const antwort = (await baueMarkenZugang()) as {
      ok: boolean;
      wert?: { lade: unknown; hole: unknown; aufGeaendert: unknown };
    };

    expect(antwort.wert?.lade).toBe(hier.ladeUebersicht);
    expect(antwort.wert?.hole).toBe(hier.holeUebersicht);
    expect(antwort.wert?.aufGeaendert).toBe(hier.aufUebersichtGeaendert);
  });

  it("scheitert das Erstladen: derselbe Code unveraendert und KEIN Zugang", async () => {
    h.ladeUebersicht.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "marken.json unlesbar" },
    });

    const antwort = (await baueMarkenZugang()) as { ok: boolean; fehler?: { code: string } };

    expect(antwort.ok).toBe(false);
    expect(antwort.fehler?.code).toBe("speicher_fehler");
    expect((antwort as { wert?: object }).wert).toBeUndefined();
  });

  it("ein zweiter Aufruf laedt ERNEUT - kein Einmal-Schutz", async () => {
    h.ladeUebersicht.mockResolvedValue({ ok: true, wert: { marken: [] } as never });

    await baueMarkenZugang();
    await baueMarkenZugang();

    expect(h.ladeUebersicht).toHaveBeenCalledTimes(2);
  });
});

describe("Grep-Probe auf marken-zugang.ts (#305)", () => {
  it("kein Direktimport aus sichten/reiter/rahmen, kein Kanal-String, kein rufeAuf, keine editor-internen Namen", async () => {
    const { readFileSync } = await import("node:fs");
    const text = readFileSync("src/renderer/app-shell/marken-zugang.ts", "utf8");
    const ohneKommentare = text
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");

    // Schutz gegen zu gieriges Abstreifen: Die drei Durchreichungen stehen IMMER noch drin.
    expect(ohneKommentare).toContain("lade: ladeUebersicht");
    expect(ohneKommentare).toContain("aufGeaendert: aufUebersichtGeaendert");

    for (const verboten of [
      "sichten",
      "reiter",
      "rahmen",
      "KANAELE",
      "rufeAuf",
      "oeffneMarke",
      "holeGeoeffneteMarke",
      "uebernimmAktualisierteMarke",
      "erstelleEigenstaendigeMarke",
      "'marken:",
    ]) {
      expect(ohneKommentare.includes(verboten)).toBe(false);
    }
  });
});
