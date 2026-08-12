// Vertragstest zu #14 - Typ `Aktion`.
//
// Geprueft werden die DoD-Punkte 2 und 3, und beide sind Aussagen ueber die
// UNTERSCHEIDUNG von drei Schreibweisen, die im Editor fast gleich aussehen:
//
//   akzentfarbe: string          - kein "keine Farbe gewaehlt" moeglich
//   akzentfarbe: string | null   - VERTRAG: null = es gilt der Markenwert
//   akzentfarbe?: string | null  - VERBOTEN: derselbe Zustand ein zweites Mal
//
// WARUM DAS ZAEHLT: Waere das Feld optional, gaebe es zwei Schreibweisen fuer
// denselben Sachverhalt (`undefined` und `null`). Der Aktions-Editor schriebe das
// eine, template-canvas pruefte auf das andere - und die Aktion bekaeme still die
// falsche Farbe, ohne dass irgendwo ein Fehler entsteht (TK 9.8.2 / 9.10.9).
import { describe, expect, it } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 2: `titel` ist Pflicht und nicht nullbar -----------------------------
type T1 = Behaupte<Gleich<Aktion["titel"], string>>;
type T2 = Behaupte<Gleich<Gleich<Aktion["titel"], string | null>, false>>;

// --- DoD 3: `akzentfarbe` ist `string | null` --------------------------------
type T3 = Behaupte<Gleich<Aktion["akzentfarbe"], string | null>>;

// Und sie ist NICHT optional. Bei einem optionalen Feld enthielte der Typ
// zusaetzlich `undefined`; `Gleich` haelt das - anders als ein Zuweisbarkeitstest -
// auseinander.
type T4 = Behaupte<Gleich<Gleich<Aktion["akzentfarbe"], string | null | undefined>, false>>;

// Der scharfe Nachweis: Ein Objekt, das `akzentfarbe` WEGLAESST, wird abgelehnt.
// Waere das Feld optional (`akzentfarbe?:`), kompilierte die Zeile - und die
// Direktive darunter meldete sich ihrerseits als unbenutzt. Der Test kippt also in
// beide Richtungen und kann nicht stillschweigend gruen bleiben.
//
// NEBENBEI GELERNT: Hier stand die Erklaerung zuerst so, dass eine Kommentarzeile
// mit der Zeichenfolge "at-ts-expect-error" BEGANN. TypeScript wertet jeden solchen
// Kommentar als echte Anweisung - die Prosa wurde zur Direktive, zeigte auf die
// naechste Kommentarzeile, fand dort nichts und brach den Typecheck mit TS2578 ab.
// In Erklaerungen deshalb nie mit dem Direktiven-Wort beginnen.
// @ts-expect-error `akzentfarbe` fehlt - Pflichtfeld, kein optionales.
const ohneAkzentfarbe: Aktion = {
  id: "a1",
  titel: "Sommeraktion",
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: "vollbild",
};

const vollstaendig: Aktion = { ...ohneAkzentfarbe, akzentfarbe: null };

// @ts-expect-error `titel` ist Pflicht und nicht nullbar.
const ohneTitel: Aktion = { ...vollstaendig, titel: null };

export type { T1, T2, T3, T4 };
void ohneTitel;

describe("Aktion (#14)", () => {
  it("traegt `null` als gueltigen Wert fuer akzentfarbe", () => {
    // `null` heisst NICHT "fehlt", sondern "keine eigene Farbe - nimm die Marke".
    expect(vollstaendig.akzentfarbe).toBeNull();
    expect("akzentfarbe" in vollstaendig).toBe(true);
  });

  it("haelt bildRef als Referenz, nicht als eingebettetes Bild", () => {
    // TK 9.8: die Aktion verweist auf eine Asset-ID, sie enthaelt keine Bilddaten.
    expect(vollstaendig.bildRef).toBeNull();
  });
});
