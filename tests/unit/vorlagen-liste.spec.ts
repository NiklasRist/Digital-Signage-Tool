import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #99, gegen den ECHTEN Lader aus #98 in einem eigenen Temp-Ordner.
//
// Gemockt ist nur der Datenort (#5): ermittleDatenOrt() liefert im Entwicklungslauf
// process.cwd(), der Test wuerde also die echte vorlagen.json im Projektverzeichnis
// ueberschreiben - und der Mock haelt die Funktion zugleich von `electron` fern, das es im
// Testlauf gar nicht gibt.
//
// ladeBestand wird BEWUSST NICHT durch eine Attrappe ersetzt: Zwei der DoD-Punkte (die drei
// eingebauten Vorlagen bei frischer Datei, der durchgereichte speicher_fehler) sind Aussagen
// ueber das Zusammenspiel mit #98 und waeren gegen eine Attrappe wertlos.
const zustand = { ordner: '' }

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.ordner,
}))

type ListeModul = typeof import('../../src/main/vorlagen-store/liste')

// Frisches Modul je Test: Der Bestand aus #98 lebt im Modulbereich und truege sonst von
// einem Test in den naechsten.
let liste: ListeModul

const EINGEBAUTE = ['vollbild', 'split', 'band-standard']

function vorlage(id: string, parent: string | null): Vorlage {
  return {
    id,
    name: id,
    art: 'vollflaeche',
    höhe: null,
    parent,
    eingebaut: false,
    zonen: [
      {
        id: `${id}-zone`,
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
      },
    ],
  }
}

async function schreibeBestand(vorlagen: Vorlage[]): Promise<void> {
  await fs.writeFile(
    path.join(zustand.ordner, 'vorlagen.json'),
    JSON.stringify({ schemaVersion: 1, vorlagen }, null, 2),
    'utf8',
  )
}

async function schreibeRoh(inhalt: string): Promise<void> {
  await fs.writeFile(path.join(zustand.ordner, 'vorlagen.json'), inhalt, 'utf8')
}

function ids(ergebnis: Awaited<ReturnType<ListeModul['listeVorlagen']>>): string[] {
  if (!ergebnis.ok) {
    throw new Error(`unerwarteter Fehler: ${ergebnis.fehler.code}`)
  }
  return ergebnis.wert.map((v) => v.id)
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), 'signage-vorlagen-liste-'))
  vi.resetModules()
  liste = await import('../../src/main/vorlagen-store/liste')
})

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true })
})

describe('listeVorlagen', () => {
  it('liefert bei frisch angelegter vorlagen.json genau die drei eingebauten in ihrer Reihenfolge', async () => {
    expect(ids(await liste.listeVorlagen())).toEqual(EINGEBAUTE)
  })

  it('sortiert nicht, sondern behaelt die Reihenfolge des Bestands', async () => {
    await schreibeBestand([vorlage('zulu', null), vorlage('alpha', null), vorlage('mike', null)])

    expect(ids(await liste.listeVorlagen())).toEqual(['zulu', 'alpha', 'mike', ...EINGEBAUTE])
  })

  it('laesst Arbeitskopien aus', async () => {
    await schreibeBestand([vorlage('eigen', null), vorlage('kopie', 'eigen')])

    expect(ids(await liste.listeVorlagen())).not.toContain('kopie')
  })

  it('liefert eine Kopie - eine Aenderung am Ergebnis erreicht den Bestand nicht', async () => {
    const erst = await liste.listeVorlagen()
    if (!erst.ok) {
      throw new Error(erst.fehler.code)
    }
    const erste = erst.wert[0]
    const ersteZone = erste?.zonen[0]
    if (erste === undefined || ersteZone === undefined) {
      throw new Error('Testvoraussetzung: die erste eingebaute Vorlage hat mindestens eine Zone')
    }
    erste.name = 'ueberschrieben'
    ersteZone.rahmen.x = -999

    const zweit = await liste.listeVorlagen()
    if (!zweit.ok) {
      throw new Error(zweit.fehler.code)
    }
    expect(zweit.wert[0]?.name).not.toBe('ueberschrieben')
    expect(zweit.wert[0]?.zonen[0]?.rahmen.x).not.toBe(-999)
  })
})

describe('listeArbeitskopien', () => {
  it('liefert bei frisch angelegter vorlagen.json eine leere Liste ohne Fehler', async () => {
    expect(await liste.listeArbeitskopien()).toEqual({ ok: true, wert: [] })
  })

  it('liefert genau die Eintraege mit parent !== null', async () => {
    await schreibeBestand([vorlage('eigen', null), vorlage('kopie', 'eigen')])

    expect(ids(await liste.listeArbeitskopien())).toEqual(['kopie'])
  })
})

describe('beide Listen zusammen', () => {
  it('decken den Bestand lueckenlos und ueberschneidungsfrei ab', async () => {
    const bestand = [
      vorlage('eigen-a', null),
      vorlage('kopie-a', 'eigen-a'),
      vorlage('eigen-b', null),
      vorlage('kopie-vollbild', 'vollbild'),
    ]
    await schreibeBestand(bestand)

    const nutzbar = ids(await liste.listeVorlagen())
    const kopien = ids(await liste.listeArbeitskopien())

    expect(nutzbar).toEqual(['eigen-a', 'eigen-b', ...EINGEBAUTE])
    expect(kopien).toEqual(['kopie-a', 'kopie-vollbild'])
    expect([...nutzbar, ...kopien]).toHaveLength(bestand.length + EINGEBAUTE.length)
    expect(nutzbar.filter((id) => kopien.includes(id))).toEqual([])
  })

  it('reichen speicher_fehler durch, statt eine leere Liste zu liefern', async () => {
    await schreibeRoh('{ das ist kein JSON')

    for (const ergebnis of [await liste.listeVorlagen(), await liste.listeArbeitskopien()]) {
      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe('speicher_fehler')
      }
    }
  })

  it('melden einen kaputten Eintrag als unbekannter_fehler statt zu werfen', async () => {
    await schreibeRoh(JSON.stringify({ schemaVersion: 1, vorlagen: [null] }))

    for (const ergebnis of [await liste.listeVorlagen(), await liste.listeArbeitskopien()]) {
      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
      }
    }
  })
})
