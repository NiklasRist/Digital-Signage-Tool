// 05.11.2026: Die letzten 20 Farben - reine Regeln und der config-Weg.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'
import type { AppKonfig } from '../../src/shared/contracts/app-konfig'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: { ok: true, wert: null } as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

import {
  LETZTE_FARBEN_MAX,
  LETZTE_FARBEN_SCHLUESSEL,
  ladeLetzteFarben,
  leseLetzteFarben,
  mitFarbe,
  speichereLetzteFarben,
} from '../../src/renderer/action-editor/letzte-farben'

beforeEach(() => {
  doppel.aufrufe.length = 0
  doppel.antwort = { ok: true, wert: null }
})

describe('leseLetzteFarben', () => {
  it('verwirft Ungueltiges, Doppel und kappt bei 20', () => {
    const viele = Array.from({ length: 30 }, (_, i) => `#${String(i).padStart(2, '0')}AAFF`)
    const gelesen = leseLetzteFarben([
      '#112233',
      '#112233', // Doppel (gleiche Schreibweise)
      '#11223 3',
      'rot',
      42,
      null,
      '#aabbcc',
      '#AABBCC', // Doppel (andere Schreibweise)
      ...viele,
    ])
    expect(gelesen[0]).toBe('#112233')
    expect(gelesen[1]).toBe('#aabbcc')
    expect(gelesen).toHaveLength(LETZTE_FARBEN_MAX)
  })

  it('liefert [] fuer alles, was keine Liste ist', () => {
    expect(leseLetzteFarben(null)).toEqual([])
    expect(leseLetzteFarben('#112233')).toEqual([])
    expect(leseLetzteFarben({})).toEqual([])
  })
})

describe('mitFarbe', () => {
  it('setzt die neue Farbe nach vorn und entfernt das alte Doppel', () => {
    expect(mitFarbe(['#111111', '#222222'], '#222222')).toEqual(['#222222', '#111111'])
  })

  it('ignoriert ungueltige Werte und kappt bei 20', () => {
    const bisher = Array.from({ length: 20 }, (_, i) => `#${String(i).padStart(2, '0')}0000`)
    expect(mitFarbe(bisher, 'rot')).toEqual(bisher)
    const neu = mitFarbe(bisher, '#123456')
    expect(neu).toHaveLength(20)
    expect(neu[0]).toBe('#123456')
    expect(neu).not.toContain(bisher[19])
  })
})

describe('config-Weg', () => {
  it('liest die Historie aus uiVoreinstellungen', async () => {
    const konfig: AppKonfig = {
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: { [LETZTE_FARBEN_SCHLUESSEL]: ['#112233', '#aabbcc'] },
    }
    doppel.antwort = { ok: true, wert: konfig }
    await expect(ladeLetzteFarben()).resolves.toEqual(['#112233', '#aabbcc'])
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.config.leseKonfig)
  })

  it('ein Lesefehler ergibt eine leere Liste - kein Wurf', async () => {
    doppel.antwort = { ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } }
    await expect(ladeLetzteFarben()).resolves.toEqual([])
  })

  it('speichert die validierte Liste unter dem Schluessel', async () => {
    await speichereLetzteFarben(['#112233', '#112233', 'rot', '#AABBCC'])
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.config.setzeUIVoreinstellung)
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({
      schlüssel: LETZTE_FARBEN_SCHLUESSEL,
      wert: ['#112233', '#AABBCC'],
    })
  })
})
