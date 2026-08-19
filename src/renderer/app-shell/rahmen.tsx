// GENERIERT aus dem Signaturblock von Issue #195.
// [app-shell] Der Rahmen mit Reiterleiste oben und Warteschlangen-Leiste unten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 916ebf036d8926c8
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

import { createElement, useEffect, useReducer, type JSX } from 'react'
import type { ReiterId } from './reiter'
import {
  REITER_REIHENFOLGE,
  aufReiterGeaendert,
  holeReiter,
  wechsleReiter,
} from './reiter'
import { ergaenzeBesuchte, istMontiert } from './rahmen-montage'

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

/** Die vier Reiterbeschriftungen (TK 9.14.1) – der einzige eigene Text des Rahmens. */
const REITER_BESCHRIFTUNG: Record<ReiterId, string> = {
  zusammenstellen: 'Zusammenstellen',
  aktionen: 'Aktionen',
  vorlagen: 'Vorlagen',
  projekte: 'Projekte',
}

/**
 * Der Anzeigezustand des Rahmens: der aktive Reiter (gespiegelt aus #194 über das
 * eine Abo auf `aufReiterGeaendert`) und die besuchten Reiter. Die besuchten sind
 * reiner lokaler Anzeigezustand des Rahmens (ENTSCHIEDEN 5): sie überleben bewusst
 * keinen Neustart und gehören in keine Konfiguration. Die Reiter selbst hält der
 * Rahmen NICHT – er liest sie über `holeReiter()` und hört auf `aufReiterGeaendert`
 * (ENTSCHIEDEN 4), die Knöpfe rufen `wechsleReiter` (#194).
 */
interface RahmenZustand {
  aktiv: ReiterId
  besuchte: ReiterId[]
}

type RahmenAktion = { art: 'reiter-gewechselt'; reiter: ReiterId }

/** Ein Reiterwechsel ergänzt die Besuchten um den Zielreiter (rahmen-montage.ts). */
function rahmenReducer(zustand: RahmenZustand, aktion: RahmenAktion): RahmenZustand {
  if (aktion.art === 'reiter-gewechselt' && aktion.reiter !== zustand.aktiv) {
    return {
      aktiv: aktion.reiter,
      besuchte: ergaenzeBesuchte(zustand.besuchte, aktion.reiter),
    }
  }
  return zustand
}

export function Rahmen(eigenschaften: RahmenEigenschaften): JSX.Element {
  const [zustand, sende] = useReducer(rahmenReducer, undefined, () => {
    const start = holeReiter()
    return { aktiv: start, besuchte: ergaenzeBesuchte([], start) }
  })

  // Genau EIN Abo (ENTSCHIEDEN 4), angemeldet beim Aufbau, abgemeldet beim Abbau.
  // Der Rückgabewert von `aufReiterGeaendert` ist die Abmelde-Funktion – React ruft
  // sie beim Abbau des Rahmens und beendet damit das Abo.
  useEffect(() => {
    return aufReiterGeaendert((reiter) => {
      sende({ art: 'reiter-gewechselt', reiter })
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav role="tablist" style={{ flex: '0 0 auto', display: 'flex', gap: 4 }}>
        {REITER_REIHENFOLGE.map((reiter) => (
          <button
            key={reiter}
            type="button"
            role="tab"
            aria-selected={reiter === zustand.aktiv}
            data-testid={`reiter-${reiter}`}
            onClick={() => wechsleReiter(reiter)}
          >
            {REITER_BESCHRIFTUNG[reiter]}
          </button>
        ))}
        {eigenschaften.speicherHinweis ? eigenschaften.speicherHinweis() : null}
      </nav>

      {eigenschaften.meldungsFlaeche ? eigenschaften.meldungsFlaeche() : null}

      <div
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
        data-testid="rahmen-inhalt-bereich"
      >
        {REITER_REIHENFOLGE.map((reiter) =>
          istMontiert(zustand.besuchte, reiter) ? (
            <div
              key={reiter}
              hidden={reiter !== zustand.aktiv}
              data-testid={`rahmen-inhalt-${reiter}`}
            >
              {createElement(eigenschaften.inhalte[reiter], {
                sichtbar: reiter === zustand.aktiv,
              })}
            </div>
          ) : null,
        )}
      </div>

      {eigenschaften.warteschlangenLeiste()}
    </div>
  )
}