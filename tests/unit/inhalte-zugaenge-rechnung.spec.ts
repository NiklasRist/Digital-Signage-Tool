// Tests zu #244 - inhalte-zugaenge.ts (die reine Verteilung, ohne Browser).
//
// Was hier Entscheidend passt: GENAU EIN Umhüller und GENAU EIN Ent-Hüller,
// die Frage „welcher Zugang gilt hier?“ wird an GENAU EINER Stelle beantwortet
// (ENTSCHIEDEN 3). Ersetzt wird #243 durch Doppel - reine Signartests.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  umhuelleAufrufe: 0,
  ohneAufrufe: 0,
  umhuellte: null as unknown,
}))

vi.mock('../../src/renderer/app-shell/undo-aufzeichnung', () => ({
  umhuelleFuerBearbeitung: (zugang: unknown) => {
    doppel.umhuelleAufrufe += 1
    return doppel.umhuellte ?? { umhuellt: true, roh: zugang }
  },
  ohneAufzeichnung: (zugang: unknown) => {
    doppel.ohneAufrufe += 1
    // wie der echte Vertrag: ein roher Zugang wird UNVERAENDert selbst geliefert
    return zugang
  },
}))

import {
  verteileZugaenge,
  type Reiterzugaenge,
} from '../../src/renderer/app-shell/inhalte-zugaenge'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang, Sichten, MarkenZugang } from '../../src/renderer/app-shell/sichten'

function baueSichten(): Sichten {
  const zugang: ProjektZugang = {
    lade: (async () => {
      throw new Error('nicht relevant')
    }),
    hole: () => ({ projekt: null, ladefehler: null }),
    setzeProjekt: () => {},
    setzeListe: () => {},
    gleicheElementAb: () => {},
    leere: () => {},
    aufGeaendert: () => () => {},
  }
  const vorlagen: VorlagenZugang = {
    lade: (async () => {
      throw new Error('nicht relevant')
    }),
    hole: () => null,
    aufGeaendert: () => () => {},
  }
  const zeichnen: ZeichenZugang = {
    bereiteVor: (async () => {
      throw new Error('nicht relevant')
    }),
    hole: () => null,
    verwirfMotivBestand: () => {},
  }
  const marken: MarkenZugang = {
    lade: (async () => {
      throw new Error('nicht relevant')
    }),
    hole: () => null,
    aufGeaendert: () => () => {},
  }
  return { projekt: zugang, vorlagen, zeichnen, marken }
}

beforeEach(() => {
  doppel.umhuelleAufrufe = 0
  doppel.ohneAufrufe = 0
  doppel.umhuellte = null
})

describe('verteileZugaenge (ENTSCHIEDEN 3 - die kritische Aussagestelle)', () => {
  it('projektRoh ist UNVERAENDERT sichten.projekt (ohneAufzeichnung liefert rohen Zugang selbst)', () => {
    const sichten = baueSichten()
    const verteilt = verteileZugaenge(sichten)
    expect(verteilt.projektRoh).toBe(sichten.projekt)
  })

  it('projektBearbeitung ist NICHT sichten.projekt und GENAU das Ergebnis des Umhüller-Doppels', () => {
    const sichten = baueSichten()
    const umhuellt = { umhuellt: true } as unknown as ProjektZugang
    doppel.umhuellte = umhuellt
    const verteilt: Reiterzugaenge = verteileZugaenge(sichten)
    expect(verteilt.projektBearbeitung).not.toBe(sichten.projekt)
    expect(verteilt.projektBearbeitung).toBe(umhuellt)
  })

  it('ruft umhuelleFuerBearbeitung GENAU einmal und ohneAufzeichnung GENAU einmal (Spione)', () => {
    const sichten = baueSichten()
    verteileZugaenge(sichten)
    expect(doppel.umhuelleAufrufe).toBe(1)
    expect(doppel.ohneAufrufe).toBe(1)
  })

  it('vorlagen, zeichnen und marken sind UNVERAENDERT (drei benannte Pruefungen)', () => {
    const sichten = baueSichten()
    const verteilt = verteileZugaenge(sichten)
    expect(verteilt.vorlagen).toBe(sichten.vorlagen)
    expect(verteilt.zeichnen).toBe(sichten.zeichnen)
    expect(verteilt.marken).toBe(sichten.marken)
  })

  it('die Eingabe wird NICHT veraendert (Object.freeze, Lauf ohne Wurf)', () => {
    const sichten = baueSichten()
    Object.freeze(sichten)
    expect(() => verteileZugaenge(sichten)).not.toThrow()
  })
})
