// Unit-Test zu #292 – die geteilte WCAG-Kontrast-Rechnung.
//
// Die Datei ist eine reine Rechenfunktion (keine IPC-Grenze, kein Ergebnis<T>,
// kein Browser, kein Vertragsimport). Deshalb laesst sich ein Teil der DoD direkt
// als Grep-Probe auf den Code abziehen – auf den Rumpf, nicht auf Kommentare.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  erreichtKontrastSchwelle,
  kontrastVerhaeltnis,
  waehleBesserenKontrast,
} from "../../src/renderer/gemeinsam/kontrast";

const QUELLE = readFileSync(
  new URL("../../src/renderer/gemeinsam/kontrast.ts", import.meta.url),
  "utf8",
);

// Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split("\n").filter((z) => {
  const t = z.trim();
  return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
}).join("\n");

describe("kontrastVerhaeltnis – WCAG-Rechenkern", () => {
  it("liefert fuer Schwarz auf Weiss den Maximalwert 21 (DoD)", () => {
    expect(kontrastVerhaeltnis("#FFFFFF", "#000000")).toBe(21);
  });

  it("liefert fuer zweimal dieselbe Farbe 1 (DoD)", () => {
    expect(kontrastVerhaeltnis("#777777", "#777777")).toBe(1);
  });

  it("ist symmetrisch – vertauschte Farben liefern dasselbe Verhaeltnis (DoD)", () => {
    const paare: Array<[string, string]> = [
      ["#FF4040", "#FFFFFF"],
      ["#FF4040", "#202020"],
      ["#971316", "#2F2E2E"],
      ["#FFFFFFAA", "#000000B3"],
    ];
    for (const [a, b] of paare) {
      expect(kontrastVerhaeltnis(a, b)).toBe(kontrastVerhaeltnis(b, a));
    }
  });

  it("nimmt Kleinschreibung an", () => {
    expect(kontrastVerhaeltnis("#ffffff", "#000000")).toBe(21);
    expect(kontrastVerhaeltnis("#ff4040", "#202020")).toBe(
      kontrastVerhaeltnis("#FF4040", "#202020"),
    );
  });

  it.each([
    ["#FF4040", "#FFFFFF", 3.4656945736142615],
    ["#FF4040", "#202020", 4.701295804493134],
  ])("rechnet %s gegen %s nach WCAG", (a, b, erwartet) => {
    expect(kontrastVerhaeltnis(a, b)).toBeCloseTo(erwartet, 10);
  });
});

describe("kontrastVerhaeltnis – 8-stelliges Hex (Alpha ignoriert)", () => {
  it.each([
    ["#FFFFFFAA", "#000000", "#FFFFFF", "#000000"],
    ["#000000B3", "#FF4040", "#000000", "#FF4040"],
  ])("ignoriert den Alphakanal von %s (Kein Wurf, kein Vormischen)", (mitAlphaA, mitAlphaB, ohneAlphaA, ohneAlphaB) => {
    expect(kontrastVerhaeltnis(mitAlphaA, mitAlphaB)).toBe(
      kontrastVerhaeltnis(ohneAlphaA, ohneAlphaB),
    );
  });

  it("liefert fuer #FFFFFFAA gegen #000000 denselben Wert 21 wie sechsstellig (DoD)", () => {
    expect(kontrastVerhaeltnis("#FFFFFFAA", "#000000")).toBe(21);
  });
});

describe("kontrastVerhaeltnis – Fehlerpfade", () => {
  it.each(["FF4040", "#FFF", "#FF404", "#FF40401", "#GGGGGG", "rot", ""])(
    "wirft beim ungueltigen Hex-Wert %j",
    (wert) => {
      expect(() => kontrastVerhaeltnis(wert, "#FFFFFF")).toThrow();
    },
  );

  it.each(["FF4040", "#FFF", "#FF404", "#FF40401", "#GGGGGG", "rot", ""])(
    "wirft auch als zweites Argument beim ungueltigen Wert %j",
    (wert) => {
      expect(() => kontrastVerhaeltnis("#FFFFFF", wert)).toThrow();
    },
  );

  it("nennt beim Wurf den ungueltigen Wert (Fehlerpfad)", () => {
    expect(() => kontrastVerhaeltnis("#FFF", "#000000")).toThrow(/#FFF/);
  });

  it("wirft NICHT fuer achtstellige Werte", () => {
    expect(() => kontrastVerhaeltnis("#FFFFFFAA", "#000000B3")).not.toThrow();
  });
});

describe("waehleBesserenKontrast", () => {
  it("waehlt den Kandidaten mit hoeherem Kontrast (DoD)", () => {
    const ergebnis = waehleBesserenKontrast("#FF4040", "#FFFFFF", "#202020");
    const kontrastWeiss = kontrastVerhaeltnis("#FF4040", "#FFFFFF");
    const kontrastDunkel = kontrastVerhaeltnis("#FF4040", "#202020");
    // Beide Verhaeltnisse separat nachrechnen und vergleichen (DoD).
    expect(kontrastDunkel).toBeGreaterThan(kontrastWeiss);
    expect(ergebnis).toBe("#202020");
    expect(ergebnis).toBe(kontrastDunkel > kontrastWeiss ? "#202020" : "#FFFFFF");
  });

  it("waehlt auch bei symmetrisch entfernten Grauwerten den hoeheren Kontrast", () => {
    // #404040 und #BFBFBF liegen wertmassig symmetrisch um #808080 – das
    // gehoert zur tieferen Farbe (Luminanz ist nichtlinear), nicht zum hellen.
    const ergebnis = waehleBesserenKontrast("#808080", "#404040", "#BFBFBF");
    expect(ergebnis).toBe("#404040");
    expect(kontrastVerhaeltnis("#808080", "#404040")).toBeGreaterThan(
      kontrastVerhaeltnis("#808080", "#BFBFBF"),
    );
  });

  it("gibt bei exakt gleichem Kontrast kandidatA zurueck (DoD)", () => {
    // Rechnerisch exakter Gleichstand ist bei zwei GRAUwerten um denselben
    // Hintergrund nicht konstruierbar (exhaustiv geprueft: keine zwei der 256
    // Graustufen liefern fliesskommaexakt dasselbe Verhaeltnis zu einem dritten).
    // Exakt gleich ist dagegen dasselbe RGB-Paar in 6- und 8-Schreibform: der
    // Alphakanal wird ignoriert, beide Argumente rechnen auf DENSELBEN RGB-Anteilen.
    // Eben das ist der Fall, den die Tie-Break-Regel des Issues verlangt: Bei
    // Gleichheit gewinnt kandidatA.
    const kandidatA = "#404040";
    const kandidatB = "#404040FF";
    expect(kontrastVerhaeltnis("#808080", kandidatA)).toBe(
      kontrastVerhaeltnis("#808080", kandidatB),
    );
    expect(waehleBesserenKontrast("#808080", kandidatA, kandidatB)).toBe(kandidatA);
  });

  it("liefert einen achtstelligen Kandidaten unveraendert zurueck (DoD)", () => {
    // "#202020FF" hat gegen #FF4040 den hoeheren Kontrast als Weiss und wird
    // gewaehlt – es bleibt die UEBERGENE Zeichenkette, kein Kuerzen auf 6 Stellen.
    const ergebnis = waehleBesserenKontrast("#FF4040", "#FFFFFF", "#202020FF");
    expect(ergebnis).toBe("#202020FF");
  });

  it("rechnet auch auf der Hintergrund-Seite mit achtstelligem Wert", () => {
    const ohneAlpha = waehleBesserenKontrast("#2F2E2E", "#FFFFFF", "#202020");
    const mitAlpha = waehleBesserenKontrast("#2F2E2EFF", "#FFFFFF", "#202020");
    expect(mitAlpha).toBe(ohneAlpha);
  });
});

describe("erreichtKontrastSchwelle", () => {
  it("prueft gegen den uebergebenen Schwellenwert (DoD)", () => {
    expect(erreichtKontrastSchwelle("#FFFFFF", "#000000", 21)).toBe(true);
    expect(erreichtKontrastSchwelle("#FFFFFF", "#000000", 21.01)).toBe(false);
  });

  it("bestand auch an der eigentlichen WCAG-AA-Schwelle 4,5:1 (TK v3.10)", () => {
    // Der Wert 4,5 steht seit TK v3.10 als KONTRAST_SCHWELLE in
    // src/shared/contracts/konstanten.ts (#320) und wird von hier NICHT gelesen –
    // er ist nur ein Aufrufwert, mit dem der Editor (bzw. seine Wurzel #330) rechnet.
    expect(erreichtKontrastSchwelle("#FF4040", "#202020", 4.5)).toBe(true);
    expect(erreichtKontrastSchwelle("#FF4040", "#FFFFFF", 4.5)).toBe(false);
  });

  it("nimmt achtstellige Argumente ohne zu werfen", () => {
    expect(erreichtKontrastSchwelle("#FFFFFFAA", "#000000", 21)).toBe(true);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "wirft beim ungueltigen Schwellenwert %d",
    (schwellenwert) => {
      expect(() => erreichtKontrastSchwelle("#FFFFFF", "#000000", schwellenwert)).toThrow();
    },
  );

  it("wirft bei gleichem Schwellenwert auch bei ungueltigen Farben zuerst wegen der Farbe", () => {
    expect(() => erreichtKontrastSchwelle("#FFF", "#000000", 4.5)).toThrow();
  });
});

describe("Bauvorschriften dieser Datei (DoD-Grep-Proben)", () => {
  it("nennt im Kommentar von kontrastVerhaeltnis, dass der Alphakanal ignoriert wird, und die Begruendung", () => {
    const kommentar = QUELLE.slice(0, QUELLE.indexOf("export function kontrastVerhaeltnis"));
    expect(kommentar).toMatch(/Alphakanal/);
    expect(kommentar).toMatch(/[Ii]gnor/);
    expect(kommentar).toMatch(/deckend/);
    expect(kommentar).toMatch(/scrimStart/);
    expect(kommentar).toMatch(/scrimEnde/);
  });

  it("importiert weder Typen aus Marke/Aktion/Vorlage noch aus src/shared/contracts (Grep-Probe)", () => {
    expect(CODEZEILEN).not.toMatch(/\bimport\b/);
    expect(CODEZEILEN).not.toMatch(/contracts/);
    expect(CODEZEILEN).not.toMatch(/KONTRAST_SCHWELLE/);
  });

  it("greift auf keinen Canvas-Zugriff zu (Grep-Probe)", () => {
    expect(CODEZEILEN).not.toMatch(/canvas|getContext|fillStyle|ctx\b/i);
  });

  it("fuehrt keine zweite Schwellenwert-Quelle (kein eigenstaendiges 4.5/3.0/7.0-Literal)", () => {
    // Die Zahl 4,5 steht seit TK v3.10 als KONTRAST_SCHWELLE in konstanten.ts
    // (#320) und hoechstens in Tests – die DoD-Grep-Probe laeuft ueber die Datei,
    // ohne Kommentare, und darf nichts finden.
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])4\.5([^0-9]|$)/);
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])3\.0([^0-9]|$)/);
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])7\.0([^0-9]|$)/);
  });

  it("exportiert keine eigene Schwellenwert-Konstante", () => {
    expect(CODEZEILEN).not.toMatch(/export const (KONTRAST|SCHWELLENWERT)/);
  });
});