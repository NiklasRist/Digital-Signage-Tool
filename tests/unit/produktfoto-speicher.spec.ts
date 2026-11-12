// Kandidaten im Speicher des Main (FA-27 / TK 9.19.2).
import { afterEach, describe, expect, it } from 'vitest'

import {
  anzahlAbrufe,
  holeAbruf,
  legeAbrufAb,
  leereAbrufe,
  verwirfAbruf,
} from '../../src/main/produktfoto/kandidaten-speicher'
import { PRODUKTFOTO_GRENZEN } from '../../src/shared/contracts/produktabruf'

function abruf() {
  return {
    projektId: 'p-1',
    aktionId: 'a-1',
    abgerufenAm: '2026-11-12T10:00:00.000Z',
    kandidaten: [
      { url: 'https://cdn.example/a.jpg', typ: 'image/jpeg', bytes: Buffer.from('aaa') },
    ],
  }
}

afterEach(() => {
  leereAbrufe()
})

describe('kandidaten-speicher (FA-27)', () => {
  it('legt einen Abruf ab und gibt ihn unveraendert zurueck', () => {
    const id = legeAbrufAb(abruf(), 1000)

    const gefunden = holeAbruf(id, 2000)

    expect(gefunden).not.toBeNull()
    expect(gefunden?.projektId).toBe('p-1')
    expect(gefunden?.kandidaten[0]?.url).toBe('https://cdn.example/a.jpg')
    expect(gefunden?.abgerufenAm).toBe('2026-11-12T10:00:00.000Z')
  })

  it('unbekannte Kennung -> null (kein Fehler, kein Wurf)', () => {
    expect(holeAbruf('gibt-es-nicht', 1000)).toBeNull()
  })

  it('verfaellt nach 10 Minuten und wird dabei entfernt', () => {
    const id = legeAbrufAb(abruf(), 1000)

    expect(holeAbruf(id, 1000 + PRODUKTFOTO_GRENZEN.verfallMs - 1)).not.toBeNull()
    expect(holeAbruf(id, 1000 + PRODUKTFOTO_GRENZEN.verfallMs)).toBeNull()
    expect(anzahlAbrufe()).toBe(0)
  })

  it('verwirft genau einen Abruf, ein zweites Verwerfen ist kein Fehler', () => {
    const eins = legeAbrufAb(abruf(), 1000)
    const zwei = legeAbrufAb(abruf(), 1000)

    verwirfAbruf(eins)
    verwirfAbruf(eins)

    expect(holeAbruf(eins, 1000)).toBeNull()
    expect(holeAbruf(zwei, 1000)).not.toBeNull()
  })

  it('leert beim Schliessen des Fensters ALLE Abrufe', () => {
    legeAbrufAb(abruf(), 1000)
    legeAbrufAb(abruf(), 1000)

    leereAbrufe()

    expect(anzahlAbrufe()).toBe(0)
  })
})
