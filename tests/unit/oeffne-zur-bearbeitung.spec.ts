import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #101, gegen den ECHTEN Lader/Schreiber aus #98 in einem eigenen
// Temp-Ordner.
//
// Gemockt ist nur der Datenort (#5): ermittleDatenOrt() liefert im Entwicklungslauf
// process.cwd(), der Test wuerde also die echte vorlagen.json im Projektverzeichnis
// ueberschreiben - und der Mock haelt die Funktion zugleich von `electron` fern, das es
// im Testlauf gar nicht gibt.
//
// ladeBestand/aendereBestand werden BEWUSST NICHT durch Attrappen ersetzt: Der Ablauf
// von #101 ist eine EINZIGE `aendereBestand`-Einheit, und die DoD-Punkte (Fortsetzen
// liefert genau eine Arbeitskopie, Parent byte-identisch, speicher_fehler durchgereicht)
// sind Aussagen ueber das Zusammenspiel mit #98 - gegen eine Attrappe waeren sie wertlos.
const zustand = { ordner: '' }

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.ordner,
}))

type Modul = typeof import('../../src/main/vorlagen-store/oeffne-zur-bearbeitung')
type SchreibeModul = typeof import('../../src/main/vorlagen-store/schreibe-vorlagen')
type ListeModul = typeof import('../../src/main/vorlagen-store/liste')

// Frisches Modul je Test: Der Bestand aus #98 lebt im Modulbereich und truege sonst von
// einem Test in den naechsten. `modul`, `schreibe` und `liste` gehoeren im selben
// Testlauf zur SELBEN frischen Modul-Instanz, weil oeffne-zur-bearbeitung und liste
// intern genau die schreibe-vorlagen-Instanz importieren, die hier direkt importiert
// wird.
let modul: Modul
let schreibe: SchreibeModul
let liste: ListeModul

function eigene(id: string): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    art: 'vollflaeche',
    höhe: null,
    parent: null,
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

function pfad(name: string): string {
  return path.join(zustand.ordner, name)
}

async function liesDatei(): Promise<{ schemaVersion: number; vorlagen: Vorlage[] }> {
  return JSON.parse(await fs.readFile(pfad('vorlagen.json'), 'utf8')) as {
    schemaVersion: number
    vorlagen: Vorlage[]
  }
}

async function schreibeBestand(vorlagen: Vorlage[]): Promise<void> {
  await fs.writeFile(
    pfad('vorlagen.json'),
    JSON.stringify({ schemaVersion: 1, vorlagen }, null, 2),
    'utf8',
  )
}

async function bestehendeKopien(parentId: string): Promise<Vorlage[]> {
  const bestand = await schreibe.ladeBestand()
  if (!bestand.ok) {
    throw new Error(`unerwarteter Fehler: ${bestand.fehler.code}`)
  }
  return bestand.wert.filter((v) => v.parent === parentId)
}

async function finde(id: string): Promise<Vorlage | undefined> {
  const bestand = await schreibe.ladeBestand()
  if (!bestand.ok) {
    throw new Error(`unerwarteter Fehler: ${bestand.fehler.code}`)
  }
  return bestand.wert.find((v) => v.id === id)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), 'signage-oeffne-bearbeitung-'))
  vi.resetModules()
  modul = await import('../../src/main/vorlagen-store/oeffne-zur-bearbeitung')
  schreibe = await import('../../src/main/vorlagen-store/schreibe-vorlagen')
  liste = await import('../../src/main/vorlagen-store/liste')
})

afterEach(async () => {
  vi.useRealTimers()
  await fs.rm(zustand.ordner, { recursive: true, force: true })
})

describe('oeffneZurBearbeitung (#101) – neue Arbeitskopie', () => {
  it('liefert fuer eine nutzbare Vorlage eine Arbeitskopie mit parent === id, neuer UUID, eingebaut false und denselben name/art/höhe', async () => {
    // band-standard ist der haertere Fall fuer die Feld-Uebernahme: eingebaut UND mit
    // `höhe` und `art` belegt (anders als vollbild mit höhe null).
    const ergebnis = await modul.oeffneZurBearbeitung('band-standard')

    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    const kopie = ergebnis.wert
    expect(kopie.parent).toBe('band-standard')
    expect(kopie.id).not.toBe('band-standard')
    expect(kopie.id).toMatch(UUID)
    expect(kopie.eingebaut).toBe(false)
    expect(kopie.name).toBe('Band-Standard')
    expect(kopie.art).toBe('split')
    expect(kopie.höhe).toBe(162)
  })

  it('haengt die Arbeitskopie HINTEN an den Bestand an', async () => {
    await schreibeBestand([eigene('eigen')])
    await modul.oeffneZurBearbeitung('eigen')

    const datei = await liesDatei()
    const letzte = datei.vorlagen[datei.vorlagen.length - 1]
    expect(letzte?.parent).toBe('eigen')
  })

  it('kopiert die Zonen inhaltsgleich, aber als TIEFE Kopie - eine Aenderung an der Kopie trifft den Parent nicht', async () => {
    const parent = await finde('vollbild')
    expect(parent).toBeDefined()
    if (parent === undefined) return

    const ergebnis = await modul.oeffneZurBearbeitung('vollbild')
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    // Inhaltsgleichheit - und die Zonen sind ein EIGENES Array, nicht der Parent-Spread.
    expect(ergebnis.wert.zonen).toEqual(parent.zonen)
    expect(ergebnis.wert.zonen).not.toBe(parent.zonen)

    // TIEF: Eine Aenderung an einem verschachtelten Objekt der Kopie darf den Parent im
    // Bestand nicht veraendern. Erst die Zonen-Aenderung, DANN den Bestand neu laden.
    const ersteZone = ergebnis.wert.zonen[0]
    expect(ersteZone).toBeDefined()
    if (ersteZone === undefined) return
    ersteZone.rahmen.x = -999

    const erneut = await finde('vollbild')
    expect(erneut?.zonen[0]?.rahmen.x).not.toBe(-999)
  })
})

describe('oeffneZurBearbeitung (#101) – Fortsetzen', () => {
  it('liefert beim zweiten Aufruf GENAU DIESELBE Arbeitskopie - und der Bestand enthaelt danach genau eine mit parent === id', async () => {
    const erst = await modul.oeffneZurBearbeitung('vollbild')
    const zweit = await modul.oeffneZurBearbeitung('vollbild')

    expect(erst.ok && zweit.ok).toBe(true)
    if (!erst.ok || !zweit.ok) return
    expect(zweit.wert.id).toBe(erst.wert.id)

    const kopien = await bestehendeKopien('vollbild')
    expect(kopien).toHaveLength(1)
    expect(kopien[0]?.id).toBe(erst.wert.id)
  })

  it('laesst den Parent byte-identisch wie vor dem Oeffnen', async () => {
    await schreibe.ladeBestand()
    const parentVorher = JSON.stringify((await finde('vollbild')) ?? null)

    await modul.oeffneZurBearbeitung('vollbild')

    const parentNachher = JSON.stringify((await finde('vollbild')) ?? null)
    expect(parentNachher).toBe(parentVorher)
  })
})

describe('oeffneZurBearbeitung (#101) – Fehlerpfade', () => {
  it("gelingt fuer eine EINGEBAUTE Vorlage ('vollbild') und liefert nie parent_eingebaut", async () => {
    const ergebnis = await modul.oeffneZurBearbeitung('vollbild')

    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.parent).toBe('vollbild')
    expect(ergebnis.wert.eingebaut).toBe(false)
    expect(ergebnis.wert.id).not.toBe('vollbild')
  })

  it('ergibt fuer die id einer Arbeitskopie ungueltige_eingabe und legt nichts an', async () => {
    const erst = await modul.oeffneZurBearbeitung('vollbild')
    if (!erst.ok) throw new Error(erst.fehler.code)

    const ergebnis = await modul.oeffneZurBearbeitung(erst.wert.id)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')

    // Kein zweiter Eintrag entstanden.
    expect(await bestehendeKopien('vollbild')).toHaveLength(1)
  })

  it("ergibt fuer eine unbekannte id nicht_gefunden und legt nichts an", async () => {
    const ergebnis = await modul.oeffneZurBearbeitung('gibt-es-nicht')

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('nicht_gefunden')
    expect(await bestehendeKopien('gibt-es-nicht')).toHaveLength(0)
    expect(await bestehendeKopien('vollbild')).toHaveLength(0)
  })

  it("ergibt fuer die leere id ungueltige_eingabe - ohne jeden Bestandszugriff", async () => {
    const ergebnis = await modul.oeffneZurBearbeitung('')

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')

    // "keine Wirkung": Die Datei bleibt unberuehrt - es wird nicht einmal angelegt.
    await expect(fs.access(pfad('vorlagen.json'))).rejects.toThrow()
  })

  it('reicht speicher_fehler von aendereBestand durch; auf der Platte entsteht keine Arbeitskopie', async () => {
    await schreibe.ladeBestand()
    // Ein ORDNER an der Stelle der .tmp: Das Oeffnen mit 'w' scheitert, das Rename findet
    // nie statt - aendereBestand meldet speicher_fehler.
    await fs.mkdir(pfad('vorlagen.json.tmp'))

    const ergebnis = await modul.oeffneZurBearbeitung('vollbild')

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('speicher_fehler')

    // Ablesbar ist hier nur die PERSISTIERTE Seite: Der fehlgeschlagene Schreibvorgang hat
    // die vorlagen.json nicht angefasst, die Arbeitskopie steht nicht darin (TK 9.5.4
    // behaelt den Bestand im Speicher, das ist die Kehrseite von "kein Rollback" - s.
    // Bericht). Bloesser Speicher-Zaehler: an der Datei nachgezahlt.
    const datei = await liesDatei()
    expect(datei.vorlagen.filter((v) => v.parent !== null)).toHaveLength(0)

    // Aufraeumen: Den Schreibblocker entfernen und flushBestand den ausstehenden Stand
    // (und den Wiederholungs-Timer aus #98) beenden lassen.
    await fs.rm(pfad('vorlagen.json.tmp'), { recursive: true })
    await schreibe.flushBestand()
  })

  it('faengt einen kaputten Bestands-Eintrag als unbekannter_fehler ab, ohne etwas zu schreiben', async () => {
    // Ein `null`-Eintrag ist das, was eine von Hand editierte vorlagen.json hergibt
    // (#98 prueft den Inhalt ausdruecklich nicht): Der Zugriff auf `.id` im Suchen
    // wirft, `aendereBestand` faengt das als unbekannter_fehler.
    await schreibeRoh(JSON.stringify({ schemaVersion: 1, vorlagen: [null] }))
    // Das Laden erweitert den Anfangsbestand um die drei eingebauten; `vorher` muss darum
    // NACH dem Laden festgehalten werden, nicht davor.
    const geladen = await schreibe.ladeBestand()
    expect(geladen.ok).toBe(true)
    const vorher = await fs.readFile(pfad('vorlagen.json'), 'utf8')

    const ergebnis = await modul.oeffneZurBearbeitung('vollbild')

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(await fs.readFile(pfad('vorlagen.json'), 'utf8')).toBe(vorher)
  })
})

describe('oeffneZurBearbeitung (#101) – Sichtbarkeit ueber #99', () => {
  it('erscheint die neue Arbeitskopie in listeArbeitskopien und nicht in listeVorlagen', async () => {
    await modul.oeffneZurBearbeitung('vollbild')

    const arbeitskopien = await liste.listeArbeitskopien()
    expect(arbeitskopien.ok).toBe(true)
    if (!arbeitskopien.ok) return
    expect(arbeitskopien.wert).toHaveLength(1)
    expect(arbeitskopien.wert[0]?.parent).toBe('vollbild')

    const vorlagen = await liste.listeVorlagen()
    expect(vorlagen.ok).toBe(true)
    if (!vorlagen.ok) return
    expect(vorlagen.wert.find((v) => v.parent !== null)).toBeUndefined()
    expect(vorlagen.wert.map((v) => v.id)).not.toContain(arbeitskopien.wert[0]?.id)
  })
})

function schreibeRoh(inhalt: string): Promise<void> {
  return fs.writeFile(pfad('vorlagen.json'), inhalt, 'utf8')
}