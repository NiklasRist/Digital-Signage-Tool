import { beforeEach, describe, expect, it } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'
import {
  bereichFuerReiter,
  leereProjektHistorie,
  leereVorlagenHistorie,
  projektHistorie,
  setzeHistorienZurueck,
  vorlagenHistorie,
  type ProjektStand,
} from '../../src/renderer/app-shell/undo-historien'

// Verhaltenstest zu #234 (undo-historien.ts): genau zwei getrennte Historien, ein
// Reiterwechsel vermischt sie nicht. Reine Laufzeit (Kategorie D), kein IPC, kein Abo.
//
// `setzeHistorienZurueck` in beforeEach ersetzt die produktiven Instanzen, damit kein
// Test den naechsten verunreinigt - dafuer IST die Funktion laut Issue da (NUR fuer Tests).

function stand(projektId: string): ProjektStand {
  return { projektId, stand: { aktionen: [], liste: [], standardSegmentdauer: 10 } }
}

function vorlage(id: string): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [],
  }
}

beforeEach(() => {
  setzeHistorienZurueck()
})

describe('bereichFuerReiter (#234) – die Zuordnung', () => {
  it("liefert 'projekt-bearbeitung' fuer 'zusammenstellen'", () => {
    expect(bereichFuerReiter('zusammenstellen')).toBe('projekt-bearbeitung')
  })

  it("liefert 'projekt-bearbeitung' fuer 'aktionen'", () => {
    expect(bereichFuerReiter('aktionen')).toBe('projekt-bearbeitung')
  })

  it("liefert 'vorlagen-editor' fuer 'vorlagen'", () => {
    expect(bereichFuerReiter('vorlagen')).toBe('vorlagen-editor')
  })

  it("liefert null fuer 'projekte'", () => {
    expect(bereichFuerReiter('projekte')).toBeNull()
  })

  it("liefert NULL fuer 'marken' - TK 9.14.2: der Reiter Marken hat in v1 KEINE Historie, die Undo/Redo-Bedienelemente sind abgeschaltet (#314, benannter Test)", () => {
    expect(bereichFuerReiter('marken')).toBeNull()
  })

  it('liefert null fuer einen unbekannten Wert und wirft nicht', () => {
    const fremd = 'unbekannt' as 'zusammenstellen'
    expect(bereichFuerReiter(fremd)).toBeNull()
  })
})

describe('projektHistorie/vorlagenHistorie (#234) – genau zwei Instanzen', () => {
  it('projektHistorie() liefert bei zwei Aufrufen dasselbe Objekt', () => {
    expect(projektHistorie()).toBe(projektHistorie())
  })

  it('vorlagenHistorie() liefert bei zwei Aufrufen dasselbe Objekt', () => {
    expect(vorlagenHistorie()).toBe(vorlagenHistorie())
  })

  it('projektHistorie() und vorlagenHistorie() sind verschiedene Objekte', () => {
    expect(projektHistorie()).not.toBe(vorlagenHistorie())
  })

  it('beide Historien sind frisch leer', () => {
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
  })

  it('die Projekt-Historie hat die Tiefe aus #233: nach 51 ablegen ist zurueck 50', () => {
    for (let i = 0; i < 51; i += 1) {
      projektHistorie().ablegen(stand(`projekt-${i}`))
    }
    expect(projektHistorie().stand().zurueck).toBe(50)
  })

  it('die Vorlagen-Historie hat die Tiefe aus #233: nach 51 ablegen ist zurueck 50', () => {
    for (let i = 0; i < 51; i += 1) {
      vorlagenHistorie().ablegen(vorlage(`vorlage-${i}`))
    }
    expect(vorlagenHistorie().stand().zurueck).toBe(50)
  })
})

describe('leereProjektHistorie (#234) – leert nur die Projekt-Historie', () => {
  it('setzt projektHistorie().stand() auf { 0, 0 } und laesst die Vorlagen-Historie unveraendert', () => {
    projektHistorie().ablegen(stand('p-1'))
    vorlagenHistorie().ablegen(vorlage('v-1'))

    leereProjektHistorie()

    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 1, vor: 0 })
  })

  it('laesst die Instanz bestehen: eine vorher geholte Referenz ist danach toBe-gleich', () => {
    const referenz = projektHistorie()
    projektHistorie().ablegen(stand('p-1'))

    leereProjektHistorie()

    expect(projektHistorie()).toBe(referenz)
    expect(referenz.stand()).toEqual({ zurueck: 0, vor: 0 })
  })
})

describe('leereVorlagenHistorie (#234) – leert nur die Vorlagen-Historie', () => {
  it('setzt vorlagenHistorie().stand() auf { 0, 0 } und laesst die Projekt-Historie unveraendert', () => {
    projektHistorie().ablegen(stand('p-1'))
    vorlagenHistorie().ablegen(vorlage('v-1'))

    leereVorlagenHistorie()

    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
    expect(projektHistorie().stand()).toEqual({ zurueck: 1, vor: 0 })
  })

  it('laesst die Instanz bestehen', () => {
    const referenz = vorlagenHistorie()
    vorlagenHistorie().ablegen(vorlage('v-1'))

    leereVorlagenHistorie()

    expect(vorlagenHistorie()).toBe(referenz)
  })
})

describe('setzeHistorienZurueck (#234) – neue Instanzen', () => {
  it('liefert neue Instanzen: eine vorher geholte Referenz ist danach NICHT mehr toBe-gleich', () => {
    const alteProjekt = projektHistorie()
    const alteVorlage = vorlagenHistorie()

    setzeHistorienZurueck()

    expect(projektHistorie()).not.toBe(alteProjekt)
    expect(vorlagenHistorie()).not.toBe(alteVorlage)
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
  })
})

describe('ProjektStand (#234) – Referenz, nicht Kopie', () => {
  it('lässt sich ablegen und unveraendert (toBe) aus vorschauZurueck() zurueckholen', () => {
    const snappschuss = stand('projekt-1')
    projektHistorie().ablegen(snappschuss)

    expect(projektHistorie().vorschauZurueck()).toBe(snappschuss)
  })
})
