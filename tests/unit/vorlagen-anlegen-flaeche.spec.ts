// #100/#155, M9 (#451/#453): „Neu anlegen" kennt zwei FLAECHEN, keine Vorlagenart.
//
// Die Flaeche IST die Art (TK 9.11.1 Punkt 0, v3.31): `höhe === null` = Ganzbild
// (1920 x 1080), 162 = Band (1920 x 162). Geprueft wird der WEG der Oberflaeche,
// nicht die Konstante: `legeVorlageAn` muss die gewaehlte Flaeche an den Main geben
// und die neue Vorlage sofort zur Bearbeitung oeffnen. Die Gegenprobe ist genauso
// wichtig - eine Hoehe, die der Store nicht anlegt, darf gar keinen IPC-Aufruf
// ausloesen (kein "der Main wird es schon ablehnen").
import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as { kanal: string; nutzlast: unknown }[],
  bearbeitet: [] as string[],
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/vorlagen-editor/arbeitskopie', () => ({
  starteBearbeitung: async (id: string) => {
    doppel.bearbeitet.push(id)
    return { ok: true, wert: { vorlagenId: id } }
  },
}))

const { ANLEGBARE_FLAECHEN, istAnlegbareFlaeche, legeVorlageAn } = await import(
  '../../src/renderer/vorlagen-editor/vorlagen-uebersicht'
)

const NEUE_VORLAGE = {
  id: 'neu-1',
  name: 'Mein Band',
  höhe: 162,
  parent: null,
  eingebaut: false,
  zonen: [],
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.bearbeitet = []
  doppel.antwort = { ok: true, wert: NEUE_VORLAGE }
})

describe('ANLEGBARE_FLAECHEN', () => {
  it('bietet genau zwei Flaechen: Ganzbild (null) und Band (162)', () => {
    expect(ANLEGBARE_FLAECHEN.map((flaeche) => flaeche.höhe)).toEqual([null, 162])
  })

  it('hat keine zweite Bandhoehe - die Oberflaeche hat kein Hoehenfeld (TK 9.11.1)', () => {
    expect(ANLEGBARE_FLAECHEN.filter((flaeche) => flaeche.höhe !== null)).toHaveLength(1)
  })

  it('istAnlegbareFlaeche: wahr fuer null und 162, falsch fuer alles andere', () => {
    expect(istAnlegbareFlaeche(null)).toBe(true)
    expect(istAnlegbareFlaeche(162)).toBe(true)
    expect(istAnlegbareFlaeche(120)).toBe(false)
    expect(istAnlegbareFlaeche(1080)).toBe(false)
  })
})

describe('legeVorlageAn', () => {
  it('schickt das Band an den Main und oeffnet es zur Bearbeitung', async () => {
    const antwort = await legeVorlageAn(162, '  Mein Band  ')

    expect(antwort.ok).toBe(true)
    expect(doppel.aufrufe).toEqual([
      {
        kanal: 'vorlagen:erstelleVorlage',
        nutzlast: { höhe: 162, name: 'Mein Band' },
      },
    ])
    expect(doppel.bearbeitet).toEqual(['neu-1'])
  })

  it('schickt ein Ganzbild mit höhe null - das Feld fehlt NICHT stillschweigend', async () => {
    doppel.antwort = { ok: true, wert: { ...NEUE_VORLAGE, höhe: null } }

    const antwort = await legeVorlageAn(null, 'Mein Ganzbild')

    expect(antwort.ok).toBe(true)
    expect(doppel.aufrufe).toEqual([
      {
        kanal: 'vorlagen:erstelleVorlage',
        nutzlast: { höhe: null, name: 'Mein Ganzbild' },
      },
    ])
  })

  it('weist eine nicht anlegbare Bandhoehe OHNE IPC-Aufruf ab', async () => {
    const antwort = await legeVorlageAn(120, 'Schmal')

    expect(antwort).toEqual({
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Nicht anlegbare Fläche: höhe=120',
      },
    })
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.bearbeitet).toEqual([])
  })

  it('weist einen leeren Namen OHNE IPC-Aufruf ab', async () => {
    const antwort = await legeVorlageAn(162, '   ')

    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.bearbeitet).toEqual([])
  })
})
