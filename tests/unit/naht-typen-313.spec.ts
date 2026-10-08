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

it('der composer traegt KEIN marken-Feld (Expect-Error wird akzeptiert)', () => {
  const basis: Omit<ComposerWurzelProps, 'verdrahtung'> = {
    sichtbar: true,
    projekt: projektzugang,
    zeichnen: zeichenzugang,
    vorlagen: vorlagenzugang,
  }
  expect(basis.sichtbar).toBe(true)
  type Fehlerprobe = ComposerWurzelProps extends { marken: unknown } ? never : true
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
