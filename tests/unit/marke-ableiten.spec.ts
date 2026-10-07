// Verhaltenstest zu #300 - Marke ableiten: Basis-Filter (eine Stufe) und "anlegen + oeffnen".
// rufeAuf und oeffneMarke sind Doppeln; gemessen werden die Nutzlast { name, parentId },
// das Ableiten uber die NEU angelegte id und die Fehlerdurchreichung.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  oeffne: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  oeffneMarke: h.oeffne,
}));

const { ableitbareBasen, leiteMarkeAb, HINWEIS_NUR_EIGENSTAENDIGE_BASIS } = await import(
  "../../src/renderer/marken-editor/marke-ableiten"
);

const DIE_ID = "11111111-1111-4111-8111-111111111111";
const BASIS_ID = "22222222-2222-4222-8222-222222222222";
const NEUE_ID = "33333333-3333-4333-8333-333333333333";

function marke(id: string, parent: string | null, eingebaut = false): Marke {
  return { id, name: "M-" + id, parent, eingebaut } as unknown as Marke;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks): kein Spion aus einem frueheren Test
  // laeuft in den naechsten - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
  h.oeffne.mockResolvedValue({ ok: false, fehler: { code: "marke_nicht_gefunden", meldung: "x" } });
});

describe("ableitbareBasen (#300)", () => {
  it("liefert aus einer gemischten Übersicht NUR parent === null (eingebaut UND eigen), in Eingabereihenfolge", () => {
    const eingebaut = marke("aaaa", null, true);
    const eigenstaendig = marke(BASIS_ID, null);
    const abgeleitet = marke("bbbb", BASIS_ID);
    const zweiteAbgeleitet = marke("cccc", BASIS_ID);
    const nochEine = marke("dddd", null);

    const basen = ableitbareBasen({ marken: [abgeleitet, eingebaut, zweiteAbgeleitet, nochEine, eigenstaendig] });

    expect(basen).toEqual([eingebaut, nochEine, eigenstaendig]);
    expect(basen.includes(abgeleitet)).toBe(false);
    expect(basen.includes(zweiteAbgeleitet)).toBe(false);
  });

  it("leere Übersicht -> leere Liste (reine Funktion, kein IPC)", () => {
    expect(ableitbareBasen({ marken: [] })).toEqual([]);
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("leiteMarkeAb (#300)", () => {
  it("sendet { name, parentId } GENAU SO an marken:erstelleMarke; oeffnt DANACH die neue id und gibt IHR Ergebnis weiter", async () => {
    const neue = marke(NEUE_ID, BASIS_ID);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: neue });
    const geoeffnet = marke(NEUE_ID, BASIS_ID);
    h.oeffne.mockResolvedValueOnce({ ok: true, wert: geoeffnet });

    const antwort = (await leiteMarkeAb("Saison-Look", BASIS_ID)) as { wert: Marke };

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:erstelleMarke", {
      name: "Saison-Look",
      parentId: BASIS_ID,
    });
    expect(h.oeffne).toHaveBeenCalledTimes(1);
    expect(h.oeffne).toHaveBeenCalledWith(NEUE_ID);
    expect(antwort.wert).toBe(geoeffnet); // aus oeffneMarke, NICHT die create-Rückgabe
  });

  it("scheitert erstellen -> oeffneMarke wird NICHT gerufen; der Code reist unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "Basis ist selbst abgeleitet" },
    });

    const antwort = (await leiteMarkeAb("X", BASIS_ID)) as {
      fehler: { code: string; meldung: string };
    };

    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(antwort.fehler.meldung).toBe("Basis ist selbst abgeleitet");
    expect(h.oeffne).not.toHaveBeenCalled();
  });

  it("scheitert NOFFNE nach erfolgreichem Anlegen -> dessen Code reist; die Marke bleibt bestehen (KEIN Aufräum-Ruf)", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke(NEUE_ID, BASIS_ID) });
    h.oeffne.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "lesen fehlgeschlagen" },
    });

    const antwort = (await leiteMarkeAb("X", BASIS_ID)) as {
      fehler: { code: string; meldung: string };
    };

    expect(antwort.fehler.code).toBe("speicher_fehler");
    expect(h.rufeAuf).toHaveBeenCalledTimes(1); // kein zusaetzlicher (Aufraeum-)Aufruf
  });

  it("leerer name oder leere parentId: ungueltige_eingabe OHNE IPC und ohne oeffneMarke", async () => {
    for (const [name, parentId] of [["", BASIS_ID], ["   ", BASIS_ID], ["X", ""], ["X", "  "]] as const) {
      const antwort = (await leiteMarkeAb(name, parentId)) as { fehler: { code: string } };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.oeffne).not.toHaveBeenCalled();
  });
});

describe("DoD-Grep-Proben (#300)", () => {
  it("keine zweite Ladepfad-Instanz, keine Ein-Stufen-Pruefung, HINWEIS je GENAU EINMAL", async () => {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile("src/renderer/marken-editor/marke-ableiten.ts", "utf8");
    expect(text).not.toMatch(/ladeUebersicht|holeUebersicht|uebernimmAktualisierteMarke/);
    expect(text).not.toMatch(/\.eingebaut/); // Filter ist NUR parent === null
    expect((text.match(/Ketten sind auf eine Stufe begrenzt\)/g) ?? []).length).toBe(1);
    expect(text).not.toMatch(/^\s*import .*loescheMarke/m); // kein Import - kein Aufräum-Ruf
    expect(HINWEIS_NUR_EIGENSTAENDIGE_BASIS.length).toBeGreaterThan(40);
  });
});
