// #100/#155: "Neu: einblendung" ist anlegbar (Entscheidung 23.10.2026, AD v1.9 / TK 9.11.1).
//
// Geprueft wird der WEG der Oberflaeche, nicht die Konstante: `legeVorlageAn` muss die
// Einblendung mit 162 px an den Main geben und die neue Vorlage sofort zur Bearbeitung
// oeffnen. Die Gegenprobe ist genauso wichtig - eine Hoehe, die der Store nicht anlegt,
// darf gar keinen IPC-Aufruf ausloesen (kein "der Main wird es schon ablehnen").
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

const { ANLEGBARE_ARTEN, legeVorlageAn } = await import(
  '../../src/renderer/vorlagen-editor/vorlagen-uebersicht'
)

const NEUE_VORLAGE = {
  id: 'neu-1',
  name: 'Meine Einblendung',
  art: 'einblendung',
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

describe('legeVorlageAn – Einblendung', () => {
  it('bietet die Einblendung mit fester Bandhoehe 162 an', () => {
    expect(ANLEGBARE_ARTEN).toContainEqual({ art: 'einblendung', höhe: 162 })
    // Keine zweite Bandhoehe: die Oberflaeche hat kein Hoehenfeld (TK 9.11.1).
    expect(ANLEGBARE_ARTEN.filter((eintrag) => eintrag.art === 'einblendung')).toEqual([
      { art: 'einblendung', höhe: 162 },
    ])
  })

  it('schickt die Einblendung an den Main und oeffnet sie zur Bearbeitung', async () => {
    const antwort = await legeVorlageAn('einblendung', 162, '  Meine Einblendung  ')

    expect(antwort.ok).toBe(true)
    expect(doppel.aufrufe).toEqual([
      {
        kanal: 'vorlagen:erstelleVorlage',
        nutzlast: { art: 'einblendung', höhe: 162, name: 'Meine Einblendung' },
      },
    ])
    expect(doppel.bearbeitet).toEqual(['neu-1'])
  })

  it('weist eine nicht anlegbare Bandhoehe OHNE IPC-Aufruf ab', async () => {
    const antwort = await legeVorlageAn('einblendung', 120, 'Schmal')

    expect(antwort).toEqual({
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Nicht anlegbare Kombination: art=einblendung, höhe=120',
      },
    })
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.bearbeitet).toEqual([])
  })

  it('weist einen leeren Namen OHNE IPC-Aufruf ab', async () => {
    const antwort = await legeVorlageAn('einblendung', 162, '   ')

    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.bearbeitet).toEqual([])
  })
})
