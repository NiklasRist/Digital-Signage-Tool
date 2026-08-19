// GENERIERT aus dem Signaturblock von Issue #198.
// [app-shell] Leerzustände ohne offenes Projekt
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
// GERUEST-PRUEFSUMME: 0bc9fe32bd0f8a43
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
// Verbindlicher Signaturimport von #198. ENTSCHIEDEN 1 verengt `reiter` auf zwei Werte,
// deshalb wird `ReiterId` im Code nie benoetigt - der Import bleibt dennoch Teil des
// Vertrags und wird nicht entfernt (siehe GERUEST-Kopf, "die Importe ... SIND der Vertrag").
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ReiterId } from './reiter'

export interface LeerzustandEigenschaften {
  /** Für welchen Reiter der Hinweis gezeigt wird. Bestimmt nur den Text. */
  reiter: 'zusammenstellen' | 'aktionen'
  /** Der Weg zum Reiter Projekte. Wird vom Aufrufer als wechsleReiter('projekte') gebildet. */
  aufProjekteWechseln: () => void
}

const TEXTE: Record<LeerzustandEigenschaften['reiter'], { ueberschrift: string; satz: string }> = {
  zusammenstellen: {
    ueberschrift: 'Zusammenstellen',
    satz: 'Hier entsteht die Wiedergabeliste. Öffnen Sie ein Projekt im Reiter Projekte, um mit dem Zusammenstellen zu beginnen.',
  },
  aktionen: {
    ueberschrift: 'Aktionen',
    satz: 'Hier werden die Aktionen eines Projekts angelegt und bearbeitet. Öffnen Sie ein Projekt im Reiter Projekte, um loszulegen.',
  },
}

export function Leerzustand(eigenschaften: LeerzustandEigenschaften): JSX.Element {
  const texte = TEXTE[eigenschaften.reiter]
  return (
    <div
      role="status"
      style={{
        padding: '32px',
        maxWidth: '560px',
      }}
    >
      <h2>{texte.ueberschrift}</h2>
      <p>{texte.satz}</p>
      <button type="button" onClick={eigenschaften.aufProjekteWechseln}>
        Zum Reiter Projekte
      </button>
    </div>
  )
}