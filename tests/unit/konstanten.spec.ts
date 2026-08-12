// Vertragstest zu #21 - die projektweiten Konstanten.
//
// DoD 1 verlangt ausdruecklich, dass `FORMAT_WHITELIST` ein RE-EXPORT aus #13 ist und
// NICHT dupliziert wird. Das laesst sich scharf pruefen: Re-Export heisst, beide
// Namen zeigen auf DASSELBE Objekt. Eine Kopie waere inhaltlich gleich, aber eine
// andere Identitaet - und `toBe` (Identitaet) unterscheidet das, `toEqual` (Inhalt)
// nicht.
//
// WARUM DAS ZAEHLT: Zwei Listen erlaubter Endungen laufen beim ersten Zusatzformat
// auseinander. Der Import akzeptierte dann eine Datei, die die Oberflaeche fuer
// unzulaessig haelt - oder umgekehrt.
import { describe, expect, it } from "vitest";

import { FORMAT_WHITELIST as AusAsset } from "../../src/shared/contracts/asset";
import {
  AKTUELLE_SCHEMA_VERSION,
  DAUER_BEREICH,
  FORMAT_WHITELIST,
  SICHERHEITSABSTAND_PX,
  STANDARD_ANZEIGEDAUER_SEKUNDEN,
} from "../../src/shared/contracts/konstanten";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- Die Bereiche sind Literale, nicht `number` ------------------------------
type T1 = Behaupte<Gleich<typeof DAUER_BEREICH, { readonly min: 10; readonly max: 45 }>>;
type T2 = Behaupte<
  Gleich<typeof SICHERHEITSABSTAND_PX, { readonly horizontal: 96; readonly vertikal: 54 }>
>;

export type { T1, T2 };

describe("Projektweite Konstanten (#21)", () => {
  it("re-exportiert FORMAT_WHITELIST aus #13 statt es zu duplizieren", () => {
    // Identitaet, nicht Gleichheit: Eine Kopie bestuende `toEqual`, aber nicht `toBe`.
    expect(FORMAT_WHITELIST).toBe(AusAsset);
  });

  it("traegt die Werte aus dem Anforderungsdokument", () => {
    expect(STANDARD_ANZEIGEDAUER_SEKUNDEN).toBe(10);
    expect(DAUER_BEREICH).toEqual({ min: 10, max: 45 });
    expect(AKTUELLE_SCHEMA_VERSION).toBe(1);
  });

  it("legt die Standarddauer in den erlaubten Bereich", () => {
    // Ein Standardwert ausserhalb der eigenen Grenzen waere von Anfang an ungueltig -
    // der Regler koennte ihn nicht darstellen (AD 4.4, einheitlicher Dauerregler).
    expect(STANDARD_ANZEIGEDAUER_SEKUNDEN).toBeGreaterThanOrEqual(DAUER_BEREICH.min);
    expect(STANDARD_ANZEIGEDAUER_SEKUNDEN).toBeLessThanOrEqual(DAUER_BEREICH.max);
  });

  it("haelt den Sicherheitsabstand bei 5 Prozent des 1920x1080-Rahmens", () => {
    // TK 9.10: 5 % Rand, damit nichts in den Overscan-Bereich des Fernsehers faellt.
    expect(SICHERHEITSABSTAND_PX.horizontal).toBe(Math.round(1920 * 0.05));
    expect(SICHERHEITSABSTAND_PX.vertikal).toBe(Math.round(1080 * 0.05));
  });
});
