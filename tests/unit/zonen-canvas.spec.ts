// Unit-Tests zu #144 – Zonen auf dem Canvas ziehen, bemaßen und einrasten.
//
// Die Datei ist reine Geometrie ohne Prozessgrenze: keine IPC-, keine Ergebnis<T>-,
// keine DOM-Abhaengigkeit. Ein Teil der DoD laesst sich deshalb direkt als
// Grep-Probe auf den Code abziehen (Literale 1920/1080/96/54, nicht exportiertes
// `raste`) - auf den Rumpf, nicht auf Kommentare.
//
// Die Zahlen sind von Hand nachgerechnet; die eingebaute Band-Hoehe 162 ist eine
// der wenigen "glatten" Werte und steht deshalb nur DOPPELT im Test (DoD (f)),
// die Einrast-Faelle benutzen krumme Bewegungen, die nicht von selber aufgehen.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  EINRAST_RASTER_PX,
  MINDEST_ZONEN_KANTE_PX,
  begrenzeAufFlaeche,
  bemasseZone,
  flaecheDerVorlage,
  sammleEinrastlinien,
  sicherheitsBox,
  verschiebeZone,
} from '../../src/renderer/vorlagen-editor/zonen-canvas'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { SICHERHEITSABSTAND_PX } from '../../src/shared/contracts/konstanten'
import type { Vorlage, Zone } from '../../src/shared/contracts/vorlage'

const QUELLE = readFileSync(
  new URL('../../src/renderer/vorlagen-editor/zonen-canvas.ts', import.meta.url),
  'utf8',
)

// Nur der Code, ohne Kommentarzeilen - die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

function zone(
  id: string,
  rolle: 'fest' | 'frei',
  x: number,
  y: number,
  breite: number,
  höhe: number,
): Zone {
  return {
    id,
    rolle,
    bindung: null,
    rahmen: { x, y, breite, höhe },
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
  }
}

function vollflaeche(zonen: Zone[]): Vorlage {
  return {
    id: 'v',
    name: 'Test-Vorlage',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

function band(höheBand: number | null, zonen: Zone[]): Vorlage {
  return {
    id: 'b',
    name: 'Band',
    art: 'einblendung',
    höhe: höheBand,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

const FREI = zone('frei', 'frei', 100, 100, 200, 100)
const FLASCHE = flaecheDerVorlage(vollflaeche([FREI]))
const LINIEN = sammleEinrastlinien(vollflaeche([FREI]), 'frei')

describe('flaecheDerVorlage', () => {
  it('liefert bei vollflaeche die Render-Profil-Flaeche (DoD)', () => {
    expect(flaecheDerVorlage(vollflaeche([FREI]))).toEqual({
      breite: RENDER_PROFILE.breite,
      höhe: RENDER_PROFILE.hoehe,
    })
  })

  it('liefert bei split/einblendung 1920 x Bandhoehe - nicht 1920 x 1080 (DoD)', () => {
    expect(flaecheDerVorlage(band(162, []))).toEqual({
      breite: RENDER_PROFILE.breite,
      höhe: 162,
    })
    const split: Vorlage = { ...band(200, []), art: 'split' }
    expect(flaecheDerVorlage(split)).toEqual({ breite: RENDER_PROFILE.breite, höhe: 200 })
  })

  it('liefert bei ungueltiger Bandhoehe Hoehe 0 und keine geratene Ersatzhoehe', () => {
    for (const ungueltig of [null, -10, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(flaecheDerVorlage(band(ungueltig, []))).toEqual({
        breite: RENDER_PROFILE.breite,
        höhe: 0,
      })
    }
  })

  it('liest die Zahlen aus RENDER_PROFILE statt aus Literalen (Grep-Probe)', () => {
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])1920([^0-9]|$)/)
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])1080([^0-9]|$)/)
  })
})

describe('sicherheitsBox', () => {
  it('liefert bei vollflaeche {96, 54, 1728, 972} (DoD)', () => {
    expect(sicherheitsBox(vollflaeche([]))).toEqual({
      x: SICHERHEITSABSTAND_PX.horizontal,
      y: SICHERHEITSABSTAND_PX.vertikal,
      breite: RENDER_PROFILE.breite - 2 * SICHERHEITSABSTAND_PX.horizontal,
      höhe: RENDER_PROFILE.hoehe - 2 * SICHERHEITSABSTAND_PX.vertikal,
    })
  })

  it('liefert bei Band hoehe 162 {96, 0, 1728, 108} - die "oberen 108 px" (DoD)', () => {
    expect(sicherheitsBox(band(162, []))).toEqual({
      x: 96,
      y: 0,
      breite: 1728,
      höhe: 108,
    })
  })

  it('liefert bei H <= 54 hoehe 0 - im Band ist nichts sicher', () => {
    expect(sicherheitsBox(band(54, []))).toEqual({ x: 96, y: 0, breite: 1728, höhe: 0 })
  })

  it('liest 96/54 aus SICHERHEITSABSTAND_PX statt aus Literalen (Grep-Probe)', () => {
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])96([^0-9]|$)/)
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])54([^0-9]|$)/)
  })
})

describe('begrenzeAufFlaeche', () => {
  it('verschiebt eine hinausragende Zone ohne Verkleinern wieder hinein', () => {
    expect(begrenzeAufFlaeche({ x: -50, y: -30, breite: 100, höhe: 50 }, FLASCHE)).toEqual({
      x: 0,
      y: 0,
      breite: 100,
      höhe: 50,
    })
    expect(begrenzeAufFlaeche({ x: 1900, y: 1100, breite: 100, höhe: 50 }, FLASCHE)).toEqual({
      x: 1820,
      y: 1030,
      breite: 100,
      höhe: 50,
    })
  })

  it('verkleinert eine grossere Zone NICHT und setzt sie auf 0 (Sperre meldet #148)', () => {
    expect(begrenzeAufFlaeche({ x: 300, y: 200, breite: 2000, höhe: 1200 }, FLASCHE)).toEqual({
      x: 0,
      y: 0,
      breite: 2000,
      höhe: 1200,
    })
  })
})

describe('sammleEinrastlinien', () => {
  it('laesst die eigene Zone weg, behaelt fremde (auch feste) Kanten, sortiert und entdoppelt', () => {
    const logo = zone('logo', 'fest', 100, 100, 200, 50)
    const text = zone('text', 'frei', 400, 300, 300, 100)
    const ergebnis = sammleEinrastlinien(vollflaeche([logo, text]), 'text')

    expect(ergebnis).toEqual({
      x: [0, 96, 100, 300, 1824, 1920],
      y: [0, 54, 100, 150, 1026, 1080],
    })

    // Die eigene Zone ('text': 400/700 bzw. 300/400) darf NICHT vorkommen.
    expect(ergebnis.x).not.toContain(400)
    expect(ergebnis.x).not.toContain(700)
    expect(ergebnis.y).not.toContain(300)
    expect(ergebnis.y).not.toContain(400)

    // Aufsteigend sortiert und dublettenfrei.
    for (let i = 1; i < ergebnis.x.length; i += 1) {
      expect(ergebnis.x[i]!).toBeGreaterThan(ergebnis.x[i - 1]!)
    }
    expect(new Set(ergebnis.x).size).toBe(ergebnis.x.length)
  })

  it('entdoppelt eine fremde Kante, die auf einer Sicherheitslinie liegt', () => {
    // Festzone bei x=96/y=54 (deckungsgleich mit der Sicherheitsbox): 96 haette
    // zwei Quellen, muss aber nur einmal auftauchen.
    const deckend = zone('deckend', 'fest', 96, 54, 50, 50)
    const text = zone('text', 'frei', 400, 300, 300, 100)
    const ergebnis = sammleEinrastlinien(vollflaeche([deckend, text]), 'text')
    expect(ergebnis.x.filter((w) => w === 96)).toHaveLength(1)
    expect(ergebnis.y.filter((w) => w === 54)).toHaveLength(1)
  })

  it('liefert beim Band hoehe 162 die Sicherheitslinie bei y = 108 (DoD)', () => {
    const bandZone = zone('inhalte', 'frei', 100, 0, 400, 80)
    const ergebnis = sammleEinrastlinien(band(162, [bandZone]), 'inhalte')
    expect(ergebnis.y).toContain(108)
    expect(ergebnis.y).not.toContain(1026)
  })
})

describe('verschiebeZone - Einrasten', () => {
  it('zieht eine Zone, deren rechte Kante 3 px neben 1824 steht, exakt auf 1824 (DoD)', () => {
    // xRoh = 1604 (100 + 1504): fuehrende Kante raest 1608 (Raster, Abstand 4),
    // nachlaufende Kante laendet auf 1824 - 217 = 1607 (Abstand 3) -> gewinnt.
    const verscho = verschiebeZone(zone('a', 'frei', 100, 100, 217, 100), 1504, 0, FLASCHE, LINIEN)
    expect(verscho.rahmen.x).toBe(1607)
    expect(verscho.rahmen.breite).toBe(217)
    expect(verscho.rahmen.x + verscho.rahmen.breite).toBe(1824)
  })

  it('rastet die obere Kante auf die Linie 54 ein, die kein Rastervielfaches ist (DoD)', () => {
    // yRoh = 55: fuehrende Kante 54 (Abstand 1), nachlaufende raeste auf 152-100=52
    // (Abstand 3) -> die Kante landet exakt auf der Sicherheitslinie 54.
    const verscho = verschiebeZone(zone('a', 'frei', 800, 400, 200, 100), 0, -345, FLASCHE, LINIEN)
    expect(verscho.rahmen.y).toBe(54)
  })

  it('rastet die untere Kante auf die Linie 1026 ein, die kein Rastervielfaches ist (DoD)', () => {
    // yRoh = 924: nachlaufende Kante 924+100=1024 raest auf die Linie 1026 -> 926
    // (Abstand 2) und schlaegt die fuehrende (Raster 928, Abstand 4).
    const verscho = verschiebeZone(zone('a', 'frei', 800, 300, 200, 100), 0, 624, FLASCHE, LINIEN)
    expect(verscho.rahmen.y).toBe(926)
    expect(verscho.rahmen.y + verscho.rahmen.höhe).toBe(1026)
  })

  it('landet ohne Linie in Reichweite auf einem Vielfachen von 8 (DoD)', () => {
    // xRoh = 301, yRoh = 303: keine Linie innerhalb der Toleranz -> Raster 304.
    const verscho = verschiebeZone(FREI, 201, 203, FLASCHE, LINIEN)
    expect(verscho.rahmen.x).toBe(304)
    expect(verscho.rahmen.y).toBe(304)
    expect(verscho.rahmen.x % EINRAST_RASTER_PX).toBe(0)
    expect(verscho.rahmen.y % EINRAST_RASTER_PX).toBe(0)
  })

  it('begrenzt das Ergebnis auf die Flaeche, ohne die Groesse zu aendern', () => {
    const rand = verschiebeZone(zone('a', 'frei', 1800, 1000, 200, 100), 1000, 1000, FLASCHE, LINIEN)
    expect(rand.rahmen.x + rand.rahmen.breite).toBeLessThanOrEqual(FLASCHE.breite)
    expect(rand.rahmen.y + rand.rahmen.höhe).toBeLessThanOrEqual(FLASCHE.höhe)
    expect(rand.rahmen.breite).toBe(200)
    expect(rand.rahmen.höhe).toBe(100)
  })
})

describe('verschiebeZone und bemasseZone - Sperre und Fehlerpfade', () => {
  it('geben bei rolle fest die identische Zone zurueck - Verschieben UND Bemaßen (DoD)', () => {
    const fest = zone('logo', 'fest', 100, 100, 200, 100)
    expect(verschiebeZone(fest, 500, 500, FLASCHE, LINIEN)).toBe(fest)
    expect(bemasseZone(fest, 'se', 500, 500, FLASCHE, LINIEN)).toBe(fest)
  })

  it('aendern bei dx = NaN oder dy = Infinity nichts (DoD)', () => {
    expect(verschiebeZone(FREI, Number.NaN, 10, FLASCHE, LINIEN)).toBe(FREI)
    expect(verschiebeZone(FREI, 10, Number.NEGATIVE_INFINITY, FLASCHE, LINIEN)).toBe(FREI)
    for (const griff of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const) {
      expect(bemasseZone(FREI, griff, Number.NaN, 0, FLASCHE, LINIEN)).toBe(FREI)
      expect(bemasseZone(FREI, griff, 0, Number.POSITIVE_INFINITY, FLASCHE, LINIEN)).toBe(FREI)
    }
  })

  it('gibt ein neues Objekt zurueck und ueberlaesst die uebrigen Felder unveraendert', () => {
    const verscho = verschiebeZone(FREI, 201, 203, FLASCHE, LINIEN)
    expect(verscho).not.toBe(FREI)
    expect(verscho.id).toBe(FREI.id)
    expect(verscho.rolle).toBe(FREI.rolle)
    expect(verscho.bindung).toBe(FREI.bindung)
    expect(verscho.ausrichtung).toEqual(FREI.ausrichtung)
  })
})

describe('bemasseZone', () => {
  it('laesst bei Griff w die rechte Kante unveraendert (DoD)', () => {
    const bemasst = bemasseZone(zone('a', 'frei', 500, 500, 200, 100), 'w', 30, 0, FLASCHE, LINIEN)
    expect(bemasst.rahmen.x).toBe(528)
    expect(bemasst.rahmen.x + bemasst.rahmen.breite).toBe(700)
    expect(bemasst.rahmen.breite).toBe(172)
  })

  it('begrenzt ein Bemaßen ueber die Mindestkante hinaus auf 8 (DoD)', () => {
    // Griff e, dx = -300: rechts wandert nach 400, linke Kante bleibt bei 500 ->
    // Breite -100; die BEWEGTE rechte Kante rueckt auf 508, Breite exakt 8.
    const bemasst = bemasseZone(zone('a', 'frei', 500, 500, 200, 100), 'e', -300, 0, FLASCHE, LINIEN)
    expect(bemasst.rahmen.x).toBe(500)
    expect(bemasst.rahmen.breite).toBe(MINDEST_ZONEN_KANTE_PX)

    // Vertikal analog: Griff s, dy = -250 -> Hoehe geklemmt auf 8, obere Kante fest.
    const s = bemasseZone(zone('a', 'frei', 500, 500, 200, 100), 's', 0, -250, FLASCHE, LINIEN)
    expect(s.rahmen.y).toBe(500)
    expect(s.rahmen.höhe).toBe(MINDEST_ZONEN_KANTE_PX)
  })

  it('produziert fuer alle Griffformen einen ganzzahligen, flaechenkonformen Rahmen (DoD)', () => {
    for (const griff of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const) {
      for (const [dx, dy] of [
        [1000, 1000],
        [-1000, -1000],
        [40, -60],
        [3, 5],
      ] as const) {
        const r = bemasseZone(zone('a', 'frei', 500, 500, 200, 100), griff, dx, dy, FLASCHE, LINIEN)
        const rahmen = r.rahmen
        expect(Number.isInteger(rahmen.x)).toBe(true)
        expect(Number.isInteger(rahmen.y)).toBe(true)
        expect(Number.isInteger(rahmen.breite)).toBe(true)
        expect(Number.isInteger(rahmen.höhe)).toBe(true)
        expect(rahmen.breite).toBeGreaterThanOrEqual(MINDEST_ZONEN_KANTE_PX)
        expect(rahmen.höhe).toBeGreaterThanOrEqual(MINDEST_ZONEN_KANTE_PX)
        expect(rahmen.x).toBeGreaterThanOrEqual(0)
        expect(rahmen.y).toBeGreaterThanOrEqual(0)
        expect(rahmen.x + rahmen.breite).toBeLessThanOrEqual(FLASCHE.breite)
        expect(rahmen.y + rahmen.höhe).toBeLessThanOrEqual(FLASCHE.höhe)
      }
    }
  })
})

describe('Bauvorschriften dieser Datei (DoD-Grep-Proben)', () => {
  it('traegt die Abschaltzeile nicht mehr und beginnt weiter mit dem Geruest-Kopf', () => {
    expect(QUELLE.split('\n')[0]!.startsWith('// GENERIERT aus dem Signaturblock')).toBe(true)
    expect(QUELLE.split('\n')[0]).not.toContain('eslint-disable')
  })

  it('laesst die GERUEST-PRUEFSUMME-Zeile unangetastet', () => {
    expect(QUELLE).toContain('// GERUEST-PRUEFSUMME: d48a0028d5c7bc7a')
  })

  it('exportiert raste NICHT - geprueft wird ueber die exportierten Funktionen (DoD)', () => {
    expect(CODEZEILEN).toMatch(/function raste\(/)
    expect(CODEZEILEN).not.toMatch(/export function raste\b/)
  })

  it('schreibt die Zahlen 1920, 1080, 96 und 54 nirgends als Literale', () => {
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])1920([^0-9]|$)/)
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])1080([^0-9]|$)/)
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])96([^0-9]|$)/)
    expect(CODEZEILEN).not.toMatch(/(^|[^0-9])54([^0-9]|$)/)
  })
})