// Verhaltenstest zu #210 - [queue-panel] Wiederholen (TK 9.3.3, 9.3.4, 9.3.5, FA-17).
//
// Die Attrappe ersetzt rufeAuf (#24): Der entnommene Kanal-Name und die Nutzlast von
// `queue:wiederhole` sind genau die Punkte dieser Datei, die hier bewiesen werden.
// Ein Lauf gegen die echte Bruecke pruefte nur die Durchreiche, nicht, DASS an der
// richtigen Stelle gerufen wird.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragArt, AuftragStatus } from "../../src/shared/contracts/auftrag";
import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";
import {
  WIEDERHOLEN_BESCHRIFTUNG,
  darfWiederholen,
  wiederholeAuftrag,
  wiederholenHinweis,
} from "../../src/renderer/queue-panel/wiederholen";

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

const ERSTELLT_AM = "2026-08-16T10:00:00.000Z";

const ARTE: AuftragArt[] = ["import", "loeschen", "render", "export"];
const STATI: AuftragStatus[] = ["anstehend", "laeuft", "erfolg", "fehlgeschlagen", "abgebrochen"];

function auftrag(art: AuftragArt, status: AuftragStatus, versuche = 0): Auftrag {
  const basis = {
    auftragId: `a-${art}`,
    status,
    label: `Test ${art}`,
    fortschritt: null,
    versuche,
    fehler:
      status === "fehlgeschlagen"
        ? { code: "kein_platz", meldung: "Der USB-Stick ist voll." }
        : null,
    ergebnis: null,
    erstelltAm: ERSTELLT_AM,
  };
  switch (art) {
    case "import":
      return { ...basis, art, payload: { projektId: "p1", quellPfad: "C:/quelle.mp4" } };
    case "loeschen":
      return { ...basis, art, payload: { projektId: "p1", assetId: "m1" } };
    case "render":
      return {
        ...basis,
        art,
        payload: {
          renderId: "r-1",
          projektId: "p1",
          elemente: [],
          profil: RENDER_PROFILE,
          ausgabeName: "sommer",
        },
      };
    case "export":
      return {
        ...basis,
        art,
        payload: { projektId: "p1", dateiname: "sommer.mp4", zielPfad: "E:/" },
      };
  }
}

describe("darfWiederholen (#210)", () => {
  // Tabellen-Test (DoD): alle fuenf Status x alle vier Arten - nur `fehlgeschlagen`
  // zeigt den Schalter, und das in JEDER Art (ENTSCHIEDEN 1 im Issue).
  it.each(ARTE.flatMap((art) => STATI.map((status) => [art, status] as const)))(
    "ist genau bei fehlgeschlagen true - %s/%s",
    (art, status) => {
      expect(darfWiederholen(auftrag(art, status))).toBe(status === "fehlgeschlagen");
    },
  );

  it("verbirgt den Schalter bei 'abgebrochen' in allen vier Arten (TK 9.3.3)", () => {
    for (const art of ARTE) {
      expect(darfWiederholen(auftrag(art, "abgebrochen"))).toBe(false);
    }
  });

  it("weist einen unbekannten status-Wert ab, ohne eine Ausnahme zu werfen", () => {
    const kaputter = {
      ...auftrag("import", "fehlgeschlagen"),
      status: "kaputt",
    } as unknown as Auftrag;

    expect(() => darfWiederholen(kaputter)).not.toThrow();
    expect(darfWiederholen(kaputter)).toBe(false);
  });
});

describe("wiederholenHinweis (#210)", () => {
  it("nennt ausdruecklich das Ende der Warteschlange (FA-17)", () => {
    const hinweis = wiederholenHinweis(auftrag("export", "fehlgeschlagen", 0));

    expect(hinweis).toContain("ans Ende der Warteschlange");
    expect(hinweis).toContain("startet, sobald er an der Reihe ist");
  });

  it("stellt bei versuche 0 keinen Versuchs-Vorspann voran", () => {
    expect(wiederholenHinweis(auftrag("render", "fehlgeschlagen", 0))).toBe(
      "Der Auftrag wird ans Ende der Warteschlange gestellt und startet, sobald er an der Reihe ist.",
    );
  });

  it("stellt bei versuche 2 genau '2. Versuch bisher. ' voran und zaehlt nicht hoch", () => {
    const einmal = wiederholenHinweis(auftrag("render", "fehlgeschlagen", 2));
    const nochmal = wiederholenHinweis(auftrag("render", "fehlgeschlagen", 2));
    const erwartet =
      "2. Versuch bisher. Der Auftrag wird ans Ende der Warteschlange gestellt und startet, sobald er an der Reihe ist.";

    expect(einmal).toBe(erwartet);
    expect(einmal.startsWith("2. Versuch bisher. ")).toBe(true);
    expect(nochmal).toBe(erwartet);
    expect(nochmal).not.toContain("3. Versuch");
  });

  it("liefert die verbindliche Beschriftung des Schalters", () => {
    expect(WIEDERHOLEN_BESCHRIFTUNG).toBe("Erneut versuchen");
  });
});

describe("wiederholeAuftrag (#210)", () => {
  beforeEach(() => {
    attrappen.rufeAuf.mockReset();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined });
  });

  it("ruft genau einmal, mit dem registrierten Kanal und der Nutzlast { auftragId }", async () => {
    const ergebnis = await wiederholeAuftrag("a-42");

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.queue.wiederhole, {
      auftragId: "a-42",
    });
    expect(ergebnis).toEqual({ ok: true, wert: undefined });
  });

  it("reicht nicht_gefunden unveraendert durch und loest keinen zweiten Aufruf aus", async () => {
    const antwort: Ergebnis<void> = {
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "Der Eintrag ist schon weg." },
    };
    attrappen.rufeAuf.mockResolvedValue(antwort);

    const ergebnis = await wiederholeAuftrag("a-7");

    expect(ergebnis).toBe(antwort);
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("lehnt eine leere auftragId ohne Aufruf mit ungueltige_eingabe ab", async () => {
    const ergebnis = await wiederholeAuftrag("");

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("faengt eine werfende Attrappe als unbekannter_fehler, ohne zu werfen", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));

    await expect(wiederholeAuftrag("a-1")).resolves.toEqual({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "window.api fehlt" },
    });
  });
});