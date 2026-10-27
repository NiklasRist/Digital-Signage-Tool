// Naht-Agent nach #313 (DoD-Proben): ActionEditorWurzelProps/VorlagenEditorWurzelProps
// tragen `marken: MarkenZugang`; ComposerWurzelProps traegt KEINEN Marken-Feld.
import { expect, it } from 'vitest'

import type {
  ComposerWurzelProps,
  ActionEditorWurzelProps,
  VorlagenEditorWurzelProps,
} from '../../src/renderer/app-shell/inhalte'
import type { MarkenZugang } from '../../src/renderer/app-shell/sichten'

const zugang: MarkenZugang = { lade: async () => ({ ok: true, wert: { marken: [] } }), hole: () => null, aufGeaendert: () => () => {} }
const projektzugang = { hole: () => ({ projekt: null, ladefehler: null }) } as unknown as ComposerWurzelProps['projekt']
const zeichenzugang = {} as ComposerWurzelProps['zeichnen']
const vorlagenzugang = {} as ComposerWurzelProps['vorlagen']

// #338 (27.10.2026) HEBT DIE FRUEHERE PROBE AUF: Bis hierher galt "der composer traegt
// KEIN marken-Feld" (#313, ENTSCHIEDEN 2 - das Feld gehoert an den action-editor, damit
// der composer die Marke nicht zum ZEICHNEN nimmt). #338 braucht den Bestand an einer
// zweiten Stelle: Die Kaputt-Erkennung muss wissen, ob `aktion.markeId` noch existiert.
// Das Feld reist als LISTE herein und wird ausschliesslich dafuer gelesen - gezeichnet
// wird weiter ueber holeBereiteMarke. Ein versehentliches Zuruecknehmen faellt jetzt hier auf.
it('der composer traegt seit #338 den Marken-Zugang fuer die Kaputt-Erkennung', () => {
  const basis: Omit<ComposerWurzelProps, 'verdrahtung'> = {
    sichtbar: true,
    projekt: projektzugang,
    zeichnen: zeichenzugang,
    vorlagen: vorlagenzugang,
    marken: zugang,
  }
  expect(basis.sichtbar).toBe(true)
  type Fehlerprobe = ComposerWurzelProps extends { marken: unknown } ? true : never
  const probe: Fehlerprobe = true
  expect(probe).toBe(true)
  expect(zugang.hole()).toBeNull()
})

it('der action-editor VERLANGT marken (ohne ist ein Typfehler); mit ist die Belegung durchgereicht', () => {
  type OhneMarken = Omit<ActionEditorWurzelProps, 'marken' | 'hervorgehobeneAktionId'>
  const basis: OhneMarken = { sichtbar: true, projekt: projektzugang, zeichnen: zeichenzugang, vorlagen: vorlagenzugang }
  // @ts-expect-error - `marken` ist ein Pflicht-Feld (DoD-Probe).
  const ohne: ActionEditorWurzelProps = basis
  expect(ohne === undefined || ohne !== null).toBe(true)
  const mit: ActionEditorWurzelProps = { ...basis, marken: zugang, hervorgehobeneAktionId: null }
  expect(mit.marken).toBe(zugang)
})

it('der vorlagen-editor VERLANGT marken ebenso (Nachtrag 08.10.2026)', () => {
  type OhneMarken = Omit<VorlagenEditorWurzelProps, 'marken' | 'sitzung'>
  const basis: OhneMarken = { sichtbar: true, vorlagen: vorlagenzugang, zeichnen: zeichenzugang }
  // @ts-expect-error - `marken` ist auch hier ein Pflicht-Feld.
  const ohne: VorlagenEditorWurzelProps = basis
  expect(ohne === undefined || ohne !== null).toBe(true)
  const mit: VorlagenEditorWurzelProps = { ...basis, marken: zugang, sitzung: {} as VorlagenEditorWurzelProps['sitzung'] }
  expect(mit.marken).toBe(zugang)
})
