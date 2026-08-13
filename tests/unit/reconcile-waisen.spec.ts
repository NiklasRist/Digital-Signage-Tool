import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Dirent } from 'node:fs'

// Verhaltenstest zu entferneWaisen (#88).
//
// ECHTE DATEIEN IN EINEM TEMP-ORDNER, und zwar nicht aus Bequemlichkeit: Diese Funktion LOESCHT.
// Eine durchgehende Attrappe koennte am Ende nur zeigen, welche Aufrufe abgesetzt wurden - nicht,
// welche Dateien noch da sind. Genau das ist aber die Aussage, auf die es ankommt, deshalb legt
// jeder Fall ausdruecklich auch Dateien an, die UEBERLEBEN muessen.
//
// Gemockt sind nur zwei Dinge: `pfade` (#49), weil die echte Fassung ueber `datenort` an Electron
// haengt - die Attrappe zeigt auf den Temp-Ordner -, und zwei Funktionen aus `node:fs/promises`.
// Die bleiben im Normalfall ECHT und reichen durch; der Test kann fuer EINEN Pfad einen Fehler
// hinterlegen (fuer ein Rechteproblem gibt es unter Windows keinen echten Weg) und zaehlt
// nebenbei mit, welche Pfade ueberhaupt angefasst wurden.
const zustand = vi.hoisted(() => ({
  /** Was `medienOrdner(projektId)` liefern soll. */
  ordner: '',
  /** Pfad -> Fehler, den `unlink` stattdessen werfen soll. */
  unlinkFehler: new Map<string, NodeJS.ErrnoException>(),
  /** Jeder Pfad, den `unlink` zu sehen bekam - der Zeuge fuer "nichts angefasst". */
  unlinkAufrufe: [] as string[],
  /** Pfad -> Fehler, den `readdir` stattdessen werfen soll. */
  readdirFehler: new Map<string, NodeJS.ErrnoException>(),
  /** Jeder Pfad, den `readdir` zu sehen bekam. */
  readdirAufrufe: [] as string[],
}))

vi.mock('../../src/main/project-store/pfade', () => ({
  medienOrdner: () => zustand.ordner,
}))

vi.mock('node:fs/promises', async (originalImportieren) => {
  const echt = await originalImportieren<typeof import('node:fs/promises')>()
  // Nur die Formen, die die geprueefte Datei tatsaechlich aufruft. Die vollen Ueberladungen
  // nachzubilden brauchte eine Typbehauptung und bildete einen Aufruf, den es nicht gibt,
  // ohnehin nicht besser ab.
  const unlink = async (ziel: string) => {
    zustand.unlinkAufrufe.push(ziel)
    const hinterlegt = zustand.unlinkFehler.get(ziel)
    if (hinterlegt !== undefined) {
      throw hinterlegt
    }
    return echt.unlink(ziel)
  }
  const readdir = async (
    ziel: string,
    optionen: { withFileTypes: true },
  ): Promise<Dirent[]> => {
    zustand.readdirAufrufe.push(ziel)
    const hinterlegt = zustand.readdirFehler.get(ziel)
    if (hinterlegt !== undefined) {
      throw hinterlegt
    }
    return echt.readdir(ziel, optionen)
  }
  return { ...echt, unlink, readdir, default: { ...echt, unlink, readdir } }
})

const { entferneWaisen } = await import('../../src/main/media-service/reconcile-waisen')
// Der Staging-Ordnername wird auch im Test nicht abgeschrieben - liefe er auseinander, pruefte
// der Test einen Ordner, den es gar nicht gibt, und bliebe dabei gruen.
const { STAGING_ORDNER } = await import('../../src/main/media-service/import-datei')

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'

function pfad(...teile: string[]): string {
  return path.join(zustand.ordner, ...teile)
}

function legeDateiAn(...teile: string[]): string {
  const ziel = pfad(...teile)
  writeFileSync(ziel, 'inhalt')
  return ziel
}

function legeOrdnerAn(...teile: string[]): string {
  const ziel = pfad(...teile)
  mkdirSync(ziel, { recursive: true })
  return ziel
}

function fehlerMit(code: string): NodeJS.ErrnoException {
  const ursache: NodeJS.ErrnoException = new Error(`vorgetaeuschter ${code}`)
  ursache.code = code
  return ursache
}

beforeEach(() => {
  zustand.ordner = mkdtempSync(path.join(os.tmpdir(), 'reconcile-waisen-'))
  zustand.unlinkFehler = new Map()
  zustand.unlinkAufrufe = []
  zustand.readdirFehler = new Map()
  zustand.readdirAufrufe = []
  // Die uebersprungene Waise wird "intern vermerkt" (console.error im Hauptprozess). Der Test
  // haelt den Lauf still und belegt in einem Fall ausdruecklich, DASS vermerkt wird.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(zustand.ordner, { recursive: true, force: true })
})

describe('entferneWaisen (#88) - was verschwindet und was bleibt', () => {
  it('entfernt die Datei ohne D1-Eintrag und laesst die bekannte unangetastet', async () => {
    legeDateiAn('waise.mp4')
    legeDateiAn('bekannt.mp4')

    const ergebnis = await entferneWaisen(PROJEKT, new Set(['bekannt.mp4']))

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 1 } })
    expect(existsSync(pfad('waise.mp4'))).toBe(false)
    expect(existsSync(pfad('bekannt.mp4'))).toBe(true)
    // Ein fehlender Staging-Ordner ist kein Fehler - und wird auch nicht angelegt.
    expect(existsSync(pfad(STAGING_ORDNER))).toBe(false)
  })

  it.each([
    ['A1B2.MP4', 'a1b2.mp4'],
    ['a1b2.mp4', 'A1B2.MP4'],
  ])(
    'laesst %s stehen, wenn der Eintrag %s nur anders geschrieben ist',
    async (aufDerPlatte, imEintrag) => {
      // Windows und macOS unterscheiden im Regelfall nicht. Bei exaktem Vergleich waere genau
      // die Datei weg, auf die der D1-Eintrag zeigt - der teuerste aller denkbaren Fehler hier.
      legeDateiAn(aufDerPlatte)

      const ergebnis = await entferneWaisen(PROJEKT, new Set([imEintrag]))

      expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 0 } })
      expect(existsSync(pfad(aufDerPlatte))).toBe(true)
      expect(zustand.unlinkAufrufe).toEqual([])
    },
  )

  it('leert den Staging-Ordner vollstaendig, laesst ihn selbst aber stehen', async () => {
    legeOrdnerAn(STAGING_ORDNER)
    legeDateiAn(STAGING_ORDNER, 'abgestuerzt.mp4.part')
    // Kein Filter auf die Endung: Ein Rest unter anderem Namen ist genauso ein Importrest.
    legeDateiAn(STAGING_ORDNER, 'rest-ohne-endung')
    legeDateiAn('bekannt.mp4')

    const ergebnis = await entferneWaisen(PROJEKT, new Set(['bekannt.mp4']))

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 2 } })
    expect(existsSync(pfad(STAGING_ORDNER))).toBe(true)
    expect(readdirSync(pfad(STAGING_ORDNER))).toEqual([])
    expect(existsSync(pfad('bekannt.mp4'))).toBe(true)
  })

  it('betritt einen unbekannten Unterordner nicht und loescht ihn nicht', async () => {
    // Ein rekursives Loeschen unbekannter Verzeichnisse ist die gefaehrlichste Auslegung von
    // "Datei in media/" - der Ordner und sein Inhalt muessen den Lauf ueberstehen.
    legeOrdnerAn('fremder-ordner')
    legeDateiAn('fremder-ordner', 'darin.mp4')
    legeDateiAn('waise.mp4')

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 1 } })
    expect(existsSync(pfad('fremder-ordner', 'darin.mp4'))).toBe(true)
    expect(zustand.readdirAufrufe).not.toContain(pfad('fremder-ordner'))
    expect(zustand.unlinkAufrufe).toEqual([pfad('waise.mp4')])
  })

  it('raeumt bei leerer Menge alle Dateien ab, aber keinen Ordner', async () => {
    legeDateiAn('eins.mp4')
    legeDateiAn('zwei.png')
    legeOrdnerAn('bleibt')

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 2 } })
    expect(readdirSync(zustand.ordner)).toEqual(['bleibt'])
  })

  it('meldet entfernt 0 fuer einen Medienordner, den es nicht gibt, und legt ihn nicht an', async () => {
    const nieBenutzt = pfad('gibt-es-nicht')
    zustand.ordner = nieBenutzt

    const ergebnis = await entferneWaisen(PROJEKT, new Set(['bekannt.mp4']))

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 0 } })
    expect(existsSync(nieBenutzt)).toBe(false)
  })
})

describe('entferneWaisen (#88) - ein Fehlschlag bricht den Lauf nicht ab', () => {
  it('ueberspringt die eine gesperrte Waise, entfernt die beiden anderen und bleibt ok', async () => {
    legeDateiAn('eins.mp4')
    const belegt = legeDateiAn('zwei.mp4')
    legeDateiAn('drei.mp4')
    zustand.unlinkFehler.set(belegt, fehlerMit('EBUSY'))

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 2 } })
    expect(existsSync(belegt)).toBe(true)
    expect(existsSync(pfad('eins.mp4'))).toBe(false)
    expect(existsSync(pfad('drei.mp4'))).toBe(false)
    // "Intern vermerkt" - ohne zusaetzliches Feld im Rueckgabewert, ohne Weg in die Oberflaeche.
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('zaehlt eine Datei nicht mit, die zwischen Auflisten und Loeschen schon weg war', async () => {
    // `entfernt` reist bis in die Oberflaeche und behauptet zurueckgewonnenen Speicher. Was
    // dieser Lauf nicht entfernt hat, darf er nicht melden.
    const verschwunden = legeDateiAn('weg.mp4')
    legeDateiAn('echt.mp4')
    zustand.unlinkFehler.set(verschwunden, fehlerMit('ENOENT'))

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 1 } })
    expect(console.error).not.toHaveBeenCalled()
  })

  it('bleibt ok, wenn sich der Staging-Ordner nicht lesen laesst', async () => {
    // `datei_fehler` gilt dem Medienordner SELBST. Ein Fehler hier wuerde ein voellig gesundes
    // Projekt als kaputt melden - und nach #94 nicht mehr normal geoeffnet.
    legeOrdnerAn(STAGING_ORDNER)
    legeDateiAn('waise.mp4')
    zustand.readdirFehler.set(pfad(STAGING_ORDNER), fehlerMit('EACCES'))

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis).toEqual({ ok: true, wert: { entfernt: 1 } })
  })
})

describe('entferneWaisen (#88) - Fehlerpfade', () => {
  it.each([
    ['', 'leer'],
    ['../x', 'Aufstieg'],
    ['a/b', 'Schraegstrich'],
    ['a\\b', 'Rueckwaerts-Schraegstrich'],
  ])('weist die Projekt-ID %s (%s) ab, ohne eine Datei anzufassen', async (id) => {
    legeDateiAn('waise.mp4')

    const ergebnis = await entferneWaisen(id, new Set())

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.unlinkAufrufe).toEqual([])
    expect(zustand.readdirAufrufe).toEqual([])
    expect(existsSync(pfad('waise.mp4'))).toBe(true)
  })

  it('weist eine Zeichenkette statt einer Menge ab, statt den ganzen Bestand zu loeschen', async () => {
    // `for...of` liefe ueber die BUCHSTABEN: keine einzige Datei gaelte als bekannt, und dieser
    // Lauf raeumte den kompletten Medienordner ab.
    legeDateiAn('bekannt.mp4')

    const ergebnis = await entferneWaisen(PROJEKT, 'bekannt.mp4' as unknown as Set<string>)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(existsSync(pfad('bekannt.mp4'))).toBe(true)
    expect(zustand.unlinkAufrufe).toEqual([])
  })

  it('meldet einen nicht lesbaren Medienordner als datei_fehler mit dem OS-Code in der Meldung', async () => {
    legeDateiAn('waise.mp4')
    zustand.readdirFehler.set(zustand.ordner, fehlerMit('EACCES'))

    const ergebnis = await entferneWaisen(PROJEKT, new Set())

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    // NICHT unbekannter_fehler: Der Code ist der einzige Hinweis, dass das Dateisystem und nicht
    // die Programmlogik das Problem ist.
    expect(ergebnis.fehler.code).toBe('datei_fehler')
    expect(ergebnis.fehler.meldung).toContain('EACCES')
    // Der absolute Pfad reist nicht mit (TK 9.5.7).
    expect(ergebnis.fehler.meldung).not.toContain(zustand.ordner)
    expect(zustand.unlinkAufrufe).toEqual([])
    expect(existsSync(pfad('waise.mp4'))).toBe(true)
  })

  it('meldet unbekannter_fehler statt zu werfen, wenn die Menge beim Lesen ausfaellt', async () => {
    // Der Reconcile laeuft beim Projektoeffnen: Eine durchgereichte Ausnahme wuerde dort das
    // Oeffnen abbrechen, statt einen Befund zu melden.
    class Kaputt extends Set<string> {
      override [Symbol.iterator](): never {
        throw new Error('Menge nicht lesbar')
      }
    }
    legeDateiAn('waise.mp4')

    const ergebnis = await entferneWaisen(PROJEKT, new Kaputt())

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    // Und nichts wurde angefasst: Die Menge wird VOR dem ersten Verzeichniszugriff gelesen.
    expect(zustand.readdirAufrufe).toEqual([])
    expect(existsSync(pfad('waise.mp4'))).toBe(true)
  })
})
