/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #195.
// [app-shell] Der Rahmen mit Reiterleiste oben und Warteschlangen-Leiste unten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { JSX } from 'react'
import type { ReiterId } from './reiter'

/** Ein Reiterinhalt. Er bekommt gesagt, ob er gerade sichtbar ist – abgebaut wird er NICHT. */
export type ReiterInhalt = (eigenschaften: { sichtbar: boolean }) => JSX.Element

export interface RahmenEigenschaften {
  /** Genau ein Eintrag je ReiterId. Das `Record` erzwingt Vollständigkeit. */
  inhalte: Record<ReiterId, ReiterInhalt>
  /** Die EINE Warteschlangen-Leiste. Wird genau einmal gerendert, außerhalb der Reiterinhalte. */
  warteschlangenLeiste: () => JSX.Element
  /** Der „nicht gespeichert"-Hinweis (#200). Sitzt in der Reiterleiste, damit er den
   *  Reiterwechsel überlebt. Fehlt er, bleibt der Platz leer – es wird NICHTS ersatzweise gezeigt. */
  speicherHinweis?: () => JSX.Element
  /** Die ANWENDUNGSWEITE Meldungsfläche, unmittelbar unter der Reiterleiste. Sie zeigt, was zu
   *  KEINEM Reiter gehört: die Fehler aus `meldeFehler` (#199) und den `StartHinweis` (#196).
   *  Wird genau einmal gerendert, außerhalb aller Reiterinhalte, und überlebt den Reiterwechsel.
   *  Fehlt sie, bleibt der Platz leer – es wird NICHTS ersatzweise gezeigt. */
  meldungsFlaeche?: () => JSX.Element
}

export function Rahmen(eigenschaften: RahmenEigenschaften): JSX.Element {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #195."
  );
}
