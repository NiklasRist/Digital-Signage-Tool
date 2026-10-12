// #352 - die Formular-Befunde in Bediener-Sprache (E13).
//
// `EntwurfBefund` (#136/#318/#319) ist ein CODE-Paar (feld/grund); der Renderer
// schreibt es nicht aufs Feld - „standardDauer: ausserhalb_bereich" ist
// Entwicklerschmarrn. Dafür gibt es diese Datei mit den Sätzen.
//
// Regeln:
// - Der Satz nennt, WAS falsch ist und WAS der Nutzer tun kann - ohne Code, ohne
//   Techniker-Jargon.
// - Jede feld/grund-Kombination der Union hat GENAU EINEN Satz; der switch zwingt
//   den Compiler, eine neue Kombination hier zu melden, bevor sie wieder roh auf
//   das Feld kann.
// - Reine Funktion: Eingang ist der Befund, Ausgang ist EIN Satz. Kein Zustand,
//   kein React-State, kein IPC.
//
// Die Bereichsgrenzen kommen programmatish aus DAUER_BEREICH (#21), nicht
// abgeschrieben: Aendert sich der Bereich, haelt der Satz mit.

import { DAUER_BEREICH } from '../../shared/contracts/konstanten'

import type { EntwurfBefund } from './aktion-bearbeiten'
import type { JSX } from 'react'

const TEXTE_TITEL: Record<Extract<EntwurfBefund, { feld: 'titel' }>['grund'], string> = {
  leer: 'Der Titel fehlt - gib der Aktion einen Namen.',
}

const TEXTE_VORLAGE: Record<Extract<EntwurfBefund, { feld: 'vorlagenId' }>['grund'], string> = {
  leer: 'Es ist keine Vorlage gewaehlt - waehle eine Vorlage fuer die Aktion.',
}

const TEXTE_MARKE: Record<Extract<EntwurfBefund, { feld: 'markeId' }>['grund'], string> = {
  leer: 'Es ist keine Marke gewaehlt - waehle eine Marke fuer die Aktion.',
}

const TEXTE_DAUER: Record<Extract<EntwurfBefund, { feld: 'standardDauer' }>['grund'], string> = {
  ausserhalb_bereich:
    `Die Standarddauer liegt ausserhalb des zulaessigen Bereichs ` +
    `(${DAUER_BEREICH.min} bis ${DAUER_BEREICH.max} Sekunden).`,
}

const TEXTE_FARBE: Record<Extract<EntwurfBefund, { feld: 'akzentfarbe' }>['grund'], string> = {
  kein_hex:
    'Die Akzentfarbe muss ein sechsstelliger Hex-Wert mit # sein (z. B. #FF4040).',
}

/** Ein Befund, ein Satz fuer den Nutzer - Codes stehen auf dem Feld nie. */
export function bedienerBefundText(befund: EntwurfBefund): string {
  switch (befund.feld) {
    case 'titel':
      return TEXTE_TITEL[befund.grund]
    case 'vorlagenId':
      return TEXTE_VORLAGE[befund.grund]
    case 'markeId':
      return TEXTE_MARKE[befund.grund]
    case 'standardDauer':
      return TEXTE_DAUER[befund.grund]
    case 'akzentfarbe':
      return TEXTE_FARBE[befund.grund]
  }
}

/** Die Anzeige selbst - ein Paragraph in der Fehlerfarbe. */
export function BefundAnzeige({ befund }: { befund: EntwurfBefund }): JSX.Element {
  return (
    <p data-testid="aktion-befund" style={{ color: '#e5634d' }}>
      {bedienerBefundText(befund)}
    </p>
  )
}
