// Verhaltenstest zu #302 - Loeschen mit Vorwarnung: eingebaut ohne Pruefung, drei Listen,
// Standardmarken-Ausweg, bestaetigeLoeschen delegiert (kein TOCTOU-Nachprüfen).
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke, Markennutzung } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));

const {
  ermittleLoeschvorschau,
  brauchtStandardmarkenAusweg,
  bestaetigeLoeschen,
} = await import("../../src/renderer/marken-editor/loeschen-vorwarnung");
import type { Loeschvorschau } from "../../src/renderer/marken-editor/loeschen-vorwarnung";

const DIE_ID = "11111111-1111-4111-8111-111111111111";

function marke(eingebaut: boolean): Marke {
  return { id: DIE_ID, name: "M", eingebaut } as unknown as Marke;
}

function nutzung(
  aktionen: unknown[] = [],
  abgeleitete: unknown[] = [],
  standard: unknown[] = [],
): Markennutzung {
  return { aktionen, abgeleiteteMarken: abgeleitete, standardInProjekten: standard } as unknown as Markennutzung;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks) - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
});

describe("ermittleLoeschvorschau (#302)", () => {
  it("eingebaute Marke: NULL IPC-Aufrufe, nutzung null, KEIN Loeschen", async () => {
    const vorschau = (await ermittleLoeschvorschau(marke(true))) as { wert: Loeschvorschau };
    expect(vorschau.wert).toEqual({ darfLoeschen: false, eingebaut: true, nutzung: null });
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(brauchtStandardmarkenAusweg(vorschau.wert)).toBe(false);
  });

  it("nicht eingebaut: GENAU EIN Aufruf von marken:pruefeMarkenReferenzen mit { markeId }", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: nutzung() });

    const vorschau = (await ermittleLoeschvorschau(marke(false))) as { wert: Loeschvorschau };

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:pruefeMarkenReferenzen", { markeId: DIE_ID });
    expect(vorschau.wert.darfLoeschen).toBe(true);
    expect(vorschau.wert.eingebaut).toBe(false);
  });

  it.each([
    ["nur aktionen", [[{ projektId: "p", projektName: "Studio", aktionId: "a" }]], [], []],
    ["nur abgeleitete", [], [{ markeId: "m", markeName: "Look" }], []],
    ["nur standardInProjekten - der Kern der Änderung v3.12", [], [], [{ projektId: "p", projektName: "Studio" }]],
  ])("Treffer nur in %s: darfLoeschen false", async (_t, a, d, s) => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: nutzung(a, d, s) });

    const vorschau = (await ermittleLoeschvorschau(marke(false))) as { wert: Loeschvorschau };

    expect(vorschau.wert.darfLoeschen).toBe(false);
    expect(vorschau.wert.nutzung).toEqual(nutzung(a, d, s)); // deep-gleich, alle drei Listen
  });

  it("standardInProjekten reist UNGEKURZT und anderer Herkunft (Namen, nicht Anzahl)", async () => {
    const referenzen = [
      { projektId: "p1", projektName: "Studio Lima" },
      { projektId: "p2", projektName: "Studio Ost" },
    ];
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: nutzung([], [], referenzen) });

    const vorschau = (await ermittleLoeschvorschau(marke(false))) as { wert: Loeschvorschau };

    expect(vorschau.wert.nutzung).toEqual(nutzung([], [], referenzen)); // deep-gleich
    expect(vorschau.wert.nutzung!.standardInProjekten).toHaveLength(2);
    expect(brauchtStandardmarkenAusweg(vorschau.wert)).toBe(true);
  });

  it("Fehler der Pruefung reisen UNVERAENDERT (Pruefung ist NICHT abgeschlossen, nie 'keine Treffer')", async () => {
    for (const code of ["marke_nicht_gefunden", "speicher_fehler"]) {
      h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code, meldung: "vom Store" } });
      const antwort = (await ermittleLoeschvorschau(marke(false))) as {
        fehler: { code: string; meldung: string };
      };
      expect(antwort.fehler.code).toBe(code);
      expect(antwort.fehler.meldung).toBe("vom Store");
    }
  });
});

describe("brauchtStandardmarkenAusweg (#302)", () => {
  it("drei Faelle: nicht leer true, leer false, nutzung null false", () => {
    const vollstaendig = nutzung([], [], [{ projektId: "p", projektName: "N" }]);
    expect(brauchtStandardmarkenAusweg({ darfLoeschen: false, eingebaut: false, nutzung: vollstaendig })).toBe(true);
    expect(brauchtStandardmarkenAusweg({ darfLoeschen: true, eingebaut: false, nutzung: nutzung() })).toBe(false);
    expect(brauchtStandardmarkenAusweg({ darfLoeschen: false, eingebaut: true, nutzung: null })).toBe(false);
  });
});

describe("bestaetigeLoeschen (#302)", () => {
  it("ruft marken:loescheMarke mit { markeId } GENAU EINMAL und gibt das Ergebnis UNVERAENDERT zurück", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: undefined });

    const antwort = (await bestaetigeLoeschen(DIE_ID)) as unknown;

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:loescheMarke", { markeId: DIE_ID });
    expect(antwort).toEqual({ ok: true, wert: undefined });
  });

  it("marke_referenziert MIT fehler.daten Markennutzung kommt DEEP-gleich zurück", async () => {
    const daten = nutzung(
      [{ projektId: "p", aktionId: "a", projektName: "Studio" }],
      [{ markeId: "m", markeName: "Look" }],
      [{ projektId: "p", projektName: "Studio" }],
    );
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "marke_referenziert", meldung: "referenziert", daten },
    });

    const antwort = (await bestaetigeLoeschen(DIE_ID)) as {
      fehler: { code: string; daten: Markennutzung };
    };

    expect(antwort.fehler.code).toBe("marke_referenziert");
    expect(antwort.fehler.daten).toEqual(daten);
  });
});

describe("DoD-Grep-Proben (#302)", () => {
  it("kein Standardmarkenwechsel, projekt-verwaltung wird importiert, keine MarkenFehlercode-Union", async () => {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile("src/renderer/marken-editor/loeschen-vorwarnung.ts", "utf8");
    expect(text).not.toMatch(/setzeStandardMarke|wechsleStandardMarke|project:setzeStandardMarke/);
    expect(text).not.toMatch(/projekt-verwaltung/);
    expect(text).not.toMatch(/MarkenFehlercode/);
  });
});
