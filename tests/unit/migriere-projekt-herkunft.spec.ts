// Verhaltenstest zur ERSTEN echten Formatmigration des Projekts (12.11.2026, FA-27 / TK 9.19.6):
// AKTUELLE_SCHEMA_VERSION 1 -> 2. Jedes Asset bekommt ein PFLICHTFELD `herkunft`; bestehende
// Dateien ohne das Feld werden beim Laden ergaenzt, alle uebrigen Werte bleiben unangetastet.
//
// Diese Datei mockt die Zielversion NICHT (anders als `migriere-projekt.spec.ts`, das die
// Kettenmechanik mit kuenstlichen Versionen prueft): Hier laeuft der ECHTE Weg 1 -> 2.
import { describe, expect, it } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'

import { AKTUELLE_SCHEMA_VERSION } from '../../src/shared/contracts/konstanten'
import { migriereProjekt } from '../../src/main/project-store/migriere-projekt'

function projekt(
  assets: Array<Record<string, unknown>>,
): Record<string, unknown> & { assets: Array<Record<string, unknown>>; schemaVersion: number } {
  return {
    id: 'p-1',
    name: 'Studio Nord',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-02T00:00:00.000Z',
    assets,
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-1',
    standardSegmentdauer: 10,
    schemaVersion: 1,
  }
}

function wert(ergebnis: ReturnType<typeof migriereProjekt>): Project {
  if (!ergebnis.ok) throw new Error(`unerwarteter Fehler: ${ergebnis.fehler.meldung}`)
  return ergebnis.wert
}

/** Ein Asset in der ALTEN Fassung (ohne `herkunft`). */
function altesAsset(id: string): Record<string, unknown> {
  return {
    id,
    typ: 'bild',
    dateiname: `${id}.png`,
    originalname: 'Produktfoto.png',
    maße: { breite: 1200, höhe: 800 },
    dauer: null,
    importdatum: '2026-01-01T00:00:00.000Z',
    zustand: 'ok',
  }
}

describe('Migration 1 -> 2: Asset.herkunft (FA-27)', () => {
  it('setzt die Zielversion auf 2', () => {
    expect(AKTUELLE_SCHEMA_VERSION).toBe(2)
  })

  it('ergaenzt bei einem Asset ohne Feld { art: "manuell" } und laesst alle anderen Felder gleich', () => {
    const alt = altesAsset('a-1')

    const ergebnis = migriereProjekt(projekt([alt]))

    const migriert = wert(ergebnis)
    expect(migriert.schemaVersion).toBe(2)
    expect(migriert.assets).toHaveLength(1)
    // Das Ergebnis ist das alte Objekt PLUS genau ein Feld - nichts umgeschrieben, nichts verloren.
    expect(migriert.assets[0]).toEqual({ ...alt, herkunft: { art: 'manuell' } })
  })

  it('laesst eine bereits gesetzte Herkunft unveraendert (kein Ueberschreiben)', () => {
    const abruf = {
      ...altesAsset('a-2'),
      herkunft: { art: 'abruf', url: 'https://shop.example/produkt', abgerufenAm: '2026-02-02T00:00:00.000Z' },
    }

    const ergebnis = migriereProjekt(projekt([abruf]))

    expect(wert(ergebnis).assets[0]?.herkunft).toEqual(abruf.herkunft)
  })

  it('ergaenzt jedes Asset einzeln, auch bei gemischtem Bestand', () => {
    const mitHerkunft = {
      ...altesAsset('a-3'),
      herkunft: { art: 'abruf', url: 'https://shop.example/x', abgerufenAm: '2026-02-02T00:00:00.000Z' },
    }

    const ergebnis = migriereProjekt(projekt([altesAsset('a-1'), mitHerkunft]))

    const assets = wert(ergebnis).assets as unknown as Array<Record<string, unknown>>
    expect(assets[0]?.herkunft).toEqual({ art: 'manuell' })
    expect(assets[1]?.herkunft).toEqual(mitHerkunft.herkunft)
  })

  it('laesst das uebergebene Objekt unberuehrt (kein In-place-Schreiben)', () => {
    const rohdaten = projekt([altesAsset('a-1')])

    migriereProjekt(rohdaten)

    // Die Eingabe ist die Datei des Aufrufers. Der Schritt baut neue Objekte, das alte
    // Asset-Objekt darf danach kein `herkunft` tragen.
    expect(rohdaten.assets[0]?.['herkunft']).toBeUndefined()
    expect(rohdaten.schemaVersion).toBe(1)
  })

  it('weist eine Datei mit kaputtem assets-Feld weiterhin ab (Klartext, kein stilles Durchwinken)', () => {
    const kaputt = projekt([])
    ;(kaputt as Record<string, unknown>)['assets'] = 'keine Liste'

    const ergebnis = migriereProjekt(kaputt)

    expect(ergebnis.ok).toBe(false)
    // Der Migrationsschritt laesst das Feld stehen; die Formpruefung nennt es beim Namen.
    expect(ergebnis.ok ? '' : ergebnis.fehler.meldung).toContain('assets')
  })
})
