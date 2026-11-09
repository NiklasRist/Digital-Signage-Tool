import { describe, expect, it } from "vitest";

import { zaehlePreis } from "../../src/renderer/template-canvas/zeichne-segment";

// Der hochzaehlende Preis (09.11.2026, TK 9.16.2). Die Rechnung selbst (`zaehlAnteil`)
// steht in `effekte.spec.ts`; hier geht es um den TEXT, der dabei entsteht:
// Nachkommastellen bleiben, am Ende steht exakt die Eingabe.

describe("zaehlePreis", () => {
  it("gibt am Ende EXAKT die Eingabe zurueck", () => {
    expect(zaehlePreis("49,90 €", 1)).toBe("49,90 €");
    expect(zaehlePreis("49 €", 1)).toBe("49 €");
    expect(zaehlePreis(" 2 für 1", 1)).toBe(" 2 für 1");
  });

  it("behaelt die Nachkommastellen und das Waehrungszeichen", () => {
    expect(zaehlePreis("49,90 €", 0.8)).toBe("39,92 €");
    expect(zaehlePreis("100,00 € / Monat", 0.8)).toBe("80,00 € / Monat");
  });

  it("rundet ohne Nachkommastellen auf ganze Euro", () => {
    expect(zaehlePreis("49 €", 0.8)).toBe("39 €");
    expect(zaehlePreis("10 Euro", 0.81)).toBe("8 Euro");
  });

  it("laesst einen Preis ohne fuehrende Zahl unveraendert", () => {
    expect(zaehlePreis("gratis", 0.8)).toBe("gratis");
    expect(zaehlePreis("", 0.5)).toBe("");
  });
});
