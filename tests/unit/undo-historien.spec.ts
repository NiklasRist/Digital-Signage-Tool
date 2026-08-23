import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
    art: 'vollflaeche',
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

describe('undo-historien.ts (#234) – Grep-Proben der DoD', () => {
  const quelle = readFileSync(
    fileURLToPath(new URL('../../src/renderer/app-shell/undo-historien.ts', import.meta.url)),
    'utf8',
  )
  const code = quelle.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('enthält kein JSX, keinen react-Import und keinen IPC-Kanal', () => {
    expect(code).not.toMatch(/react/)
    expect(code).not.toMatch(/rufeAuf|abonniere/)
    expect(code).not.toMatch(/KANAELE/)
    expect(code).not.toMatch(/window\./)
  })

  it('ruft weder holeReiter noch aufReiterGeaendert', () => {
    expect(code).not.toMatch(/holeReiter/)
    expect(code).not.toMatch(/aufReiterGeaendert/)
  })

  it('persistiert nichts und kennt keinen queue-Kanal', () => {
    expect(code).not.toMatch(/localStorage|sessionStorage/)
    expect(code).not.toMatch(/'queue:'/)
  })

  it('importiert aus ./reiter ausschliesslich per import type', () => {
    const reiterImport = quelle.match(/import[^;]*from\s+'\.\/reiter'/)
    expect(reiterImport).not.toBeNull()
    expect(reiterImport![0]).toContain('import type')
  })
})