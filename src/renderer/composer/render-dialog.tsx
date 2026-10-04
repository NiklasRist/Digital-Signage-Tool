// Die Eingabeanzeige des Render-Dialogs (#231 / M7-38).
//
// Die Anzeige prueft NICHT selbst: befund und lage kommen als Werte herein,
// berechnet von render-dialog.ts; der Fehlercode der Ausloesung reist als string
// (keine Union der Main-Module, keine zweite Deklaration).
//
// Der Knopf-Status: bei befund !== 'ok' oder laeuft === true ist der Ausloeser
// nicht betaetigbar; bei befund !== 'ok' nennt die Anzeige den Befund im Klartext
// und haelt den NAMEN zur Korrektur (kein Leeren).
//
// Kein Bestaetigungsdialog beim UEberschreiben - der Hinweis ist die getroffene
// Entscheidung (ENTSCHIEDEN 1, Feststellung mit Datum).

import type { JSX } from 'react'
import type { NamensBefund, Ueberschreiblage } from './render-dialog'

export interface RenderDialogEigenschaften {
  /** Der aktuelle Feldinhalt und sein Befund – die Anzeige prüft NICHT selbst. */
  eingabe: string
  befund: NamensBefund
  /** Das UEberschreib-Lage (von render-dialog.ts gerechnet) – die Anzeige rechnet NICHT selbst. */
  lage: Ueberschreiblage
  /** true, solange das Auslösen läuft – der Knopf ist dann gesperrt. */
  laeuft: boolean
  aufEingabe: (wert: string) => void
  /** Auslösen. Nur erreichbar, wenn `befund === 'ok'` und `laeuft === false`. */
  aufAusloesen: () => void
  aufAbbrechen: () => void
}

const FEHLERFARBE = '#e5634d'

const BEFUNDTEXT: Record<Exclude<NamensBefund, 'ok'>, string> = {
  leer: 'Der Name ist leer.',
  pfadtrenner: 'Der Name darf keine Pfadtrenner (/ oder \\) enthalten.',
  punkt_punkt: 'Der Name darf keine Ellipse (..) enthalten.',
  unzulaessiges_zeichen:
    'Der Name enthält unzulässige Zeichen (< > : " | ? * oder ein Steuerzeichen).',
  reservierter_name: 'Der Name ist ein von Windows reservierter Name (CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9).',
  endung_angegeben: 'Der Name geht OHNE Endung in den Auftrag - gib "sommer" statt "sommer.mp4" ein.',
}

export function RenderDialogAnzeige(p: RenderDialogEigenschaften): JSX.Element {
  const gesperrt = p.befund !== 'ok' || p.laeuft

  return (
    <div data-testid="render-dialog">
      <h2>Video erzeugen</h2>
      <p>Dateiname ohne Endung (die Ausgabe heißt name.mp4):</p>
      <label>
        <input
          type="text"
          value={p.eingabe}
          data-testid="render-dialog-name"
          onChange={(ereignis) => p.aufEingabe(ereignis.target.value)}
        />
      </label>
      {p.befund !== 'ok' && (
        <p data-testid="render-dialog-befund" style={{ color: FEHLERFARBE, fontSize: 12 }}>
          {BEFUNDTEXT[p.befund]}
        </p>
      )}
      {p.lage.ersetzt && (
        <p data-testid="render-dialog-hinweis" style={{ fontSize: 12 }}>
          {p.lage.hinweis}
        </p>
      )}
      <button
        type="button"
        data-testid="render-dialog-ausloeser"
        disabled={gesperrt}
        onClick={p.aufAusloesen}
      >
        Video erzeugen
      </button>
      <button type="button" onClick={p.aufAbbrechen}>
        Abbrechen
      </button>
    </div>
  )
}
