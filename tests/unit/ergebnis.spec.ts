import { describe, expect, it } from "vitest";

import type {
  Ergebnis,
  GenerischerFehlercode,
} from "../../src/shared/contracts/ergebnis";

// Prueft die Erweiterung aus #22: Ergebnis<T, F> haengt eine fachliche
// Fehlercode-Union ein, ohne die generischen Codes zu verlieren.
//
// ABWEICHUNG VON DER DoD, bewusst und gemeldet: Dort steht der Ausdruck
// `Ergebnis<string, TestFehlercode>['fehler']['code']`. Der ist nicht uebersetzbar -
// `Ergebnis` ist eine Union, und ihr `ok: true`-Zweig hat gar kein `fehler`. Ein
// Indexzugriff auf eine Union verlangt das Feld in JEDEM Zweig. Geprueft wird deshalb
// derselbe Typ ueber `Extract<..., { ok: false }>`; die inhaltliche Aussage der DoD -
// welche Codes zulaessig sind und welche nicht - ist unveraendert.

type TestFehlercode = "x" | "y";

type FehlerZweig = Extract<Ergebnis<string, TestFehlercode>, { ok: false }>;
type Code = FehlerZweig["fehler"]["code"];

/**
 * Typgleichheit, nicht blosse Zuweisbarkeit.
 *
 * Warum nicht einfach `Code extends Erwartet ? true : false`: Zuweisbarkeit ist
 * einseitig. Waere `Code` versehentlich `string`, ginge jede Pruefung "sind 'x' und
 * die generischen Codes erlaubt?" durch - und genau die Zusage "und nichts anderes"
 * waere still verloren. Diese Konstruktion vergleicht in BEIDE Richtungen.
 */
type Gleich<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// 1. Der Fehlercode ist EXAKT die fachliche Union plus die drei generischen.
//    Diese Zeile uebersetzt nur, wenn beide Seiten deckungsgleich sind - sie ist der
//    eigentliche Beweis fuer "und nichts anderes".
const codeIstExakt: Gleich<Code, TestFehlercode | GenerischerFehlercode> = true;

// 2. Die fachlichen Codes sind zulaessig.
const fachlich: Code[] = ["x", "y"];

// 3. Die generischen Codes sind es weiterhin.
const generisch: Code[] = [
  "ungueltige_eingabe",
  "nicht_gefunden",
  "unbekannter_fehler",
];

// 4. Rueckwaertskompatibilitaet: Die einparametrige Form aus #12 bleibt gueltig.
//    Ohne den Vorgabewert von F waere diese Zeile ein Uebersetzungsfehler - und mit
//    ihr jede Signatur, die M0 und M1 bereits geschrieben haben.
const einparametrig: Ergebnis<number> = { ok: true, wert: 42 };

// 5. Das optionale `daten` ist erhalten. Ginge es beim Umbau verloren, naehme das
//    `asset_referenziert` die Liste der betroffenen Listenelemente weg und machte den
//    gefuehrten Reparatur-Modus (FA-19) unbedienbar.
const mitDaten: Ergebnis<void, TestFehlercode> = {
  ok: false,
  fehler: {
    code: "x",
    meldung: "Beispiel",
    daten: { referenzenIds: ["a", "b"] },
  },
};

describe("Ergebnis<T, F> (#22)", () => {
  it("traegt fachliche und generische Fehlercodes", () => {
    expect(codeIstExakt).toBe(true);
    expect(fachlich).toHaveLength(2);
    expect(generisch).toHaveLength(3);
  });

  it("bleibt einparametrig nutzbar und behaelt daten", () => {
    expect(einparametrig.ok).toBe(true);
    expect(mitDaten.ok).toBe(false);
    if (!mitDaten.ok) {
      expect(mitDaten.fehler.daten).toEqual({ referenzenIds: ["a", "b"] });
    }
  });
});
