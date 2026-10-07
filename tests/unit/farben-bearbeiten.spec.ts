// Verhaltenstest zu #296 - die Farb-Rollen-Bearbeitung des marken-editors.
// rufeAuf und uebernimmAktualisierteMarke sind Doppeln; gemessen wird die
// EIN-ROLLE-Nutzlast, die Übernahme-Reihenfolge und die fehlerfrei durchgereichten Codes.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  uebernimme: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  uebernimmAktualisierteMarke: h.uebernimme,
}));

const { setzeFarbe, FARB_ROLLEN } = await import(
  "../../src/renderer/marken-editor/farben-bearbeiten"
);

const DIE_ID = "11111111-1111-4111-8111-111111111111";

function attrappeMarke(id: string): Marke {
  return { id, name: "M-" + id } as unknown as Marke;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks): Der Spion-Aufzeichner aus einem frueheren Test
  // DUERFTE NICHT in den naechsten laufen - oder werden mockImplementation acrylicasks getestet.
  vi.resetAllMocks();
  h.uebernimme.mockImplementation(() => undefined);
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
});

describe("FARB_ROLLEN (#296)", () => {
  it("enthaelt GENAU die dreizehn Rollen in TK 9.11.2 Tabellenreihenfolge", () => {
    expect(FARB_ROLLEN).toEqual([
      "akzent", "akzentKraeftig", "akzentTief",
      "flaecheDunkel", "flaecheSehrDunkel", "flaecheHell", "flaecheAkzentZart",
      "textAufDunkel", "textAufHell", "textSekundaer",
      "linie", "scrimStart", "scrimEnde",
    ]);
  });
});

describe("setzeFarbe (#296)", () => {
  it("sendet teilwerte.farben mit GENAU EINEM Schluessel - der geaenderten Rolle", async () => {
    const marke = attrappeMarke(DIE_ID);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    await setzeFarbe(DIE_ID, "akzent", "#123456");

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:bearbeiteMarke", {
      markeId: DIE_ID,
      teilwerte: { farben: { akzent: "#123456" } },
    });
    const nutzlast = h.rufeAuf.mock.calls[0]![1] as { teilwerte: { farben: object } };
    expect(Object.keys(nutzlast.teilwerte.farben)).toEqual(["akzent"]);
  });

  it("uebernimmAktualisierteMarke laeuft mit der Rueckgabe VOR der Rueckkehr; das Ergebnis bleibt identisch", async () => {
    const marke = attrappeMarke(DIE_ID);
    const folge: string[] = [];
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      folge.push(kanal);
      return { ok: true as const, wert: marke };
    });
    h.uebernimme.mockImplementation((m: Marke) => {
      folge.push("uebernimm");
      expect(m).toBe(marke);
    });

    const antwort = (await setzeFarbe(DIE_ID, "linie", "#ABCDEF")) as { wert: Marke };

    expect(antwort.wert).toBe(marke); // UNVERAENDERT durchgereicht
    expect(folge).toEqual(["marken:bearbeiteMarke", "uebernimm"]);
  });

  it("bei Fehler wird uebernimmAktualisierteMarke NICHT gerufen; der Code reist unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "hex 6- oder 8-stellig" },
    });

    const antwort = (await setzeFarbe(DIE_ID, "akzent", "fff")) as { fehler: { code: string; meldung: string } };

    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(antwort.fehler.meldung).toBe("hex 6- oder 8-stellig"); // Meldung unverändert
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("leere markeId: ungueltige_eingabe OHNE IPC", async () => {
    const leer = (await setzeFarbe("", "akzent", "#111111")) as { fehler: { code: string } };
    expect(leer.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("der Hex-Wert wird UNVERAENDERT gesendet - kein Override der Schreibweise, kein Praefix", async () => {
    h.rufeAuf.mockImplementationOnce(async () => ({ ok: true as const, wert: attrappeMarke(DIE_ID) }));
    await setzeFarbe(DIE_ID, "akzentTief", "  #AbCdEf "); // absichtlich unnormalisiert
    const nutzlast = h.rufeAuf.mock.calls[0]![1] as { teilwerte: { farben: Record<string, string> } };
    expect(nutzlast.teilwerte.farben["akzentTief"]).toBe("  #AbCdEf " as never);
  });
});
