// Verhaltenstests zu #139 in der von #318 umgestellten Form (FA-24, freie Hex-Farbe).
//
// Die alte Fassung (akzentAuswahl, istAkzentRolle, AKZENT_STANDARD = 'akzent') ist
// ERSATZLOS gestrichen - der Test belegt auch das: Die Bezeichner duerfen nicht mehr
// vorkommen, und es gibt keinen Alias und keinen Re-Export.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SICHERHEITSABSTAND_PX } from '../../src/shared/contracts/konstanten'

import type { FarbRolle, Marke } from '../../src/shared/contracts/marke'
import type { Aktion } from '../../src/shared/contracts/aktion'

// ---------------- Quelldatei-Verbote (Grep, NUR auf diese eine Datei) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/action-editor/akzentfarbe.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('akzentfarbe – Verbote in der Quelldatei (Grep)', () => {
  it('enthaelt die gestrichenen Bezeichner nicht mehr - kein Alias, kein Re-Export', () => {
    expect(CODEZEILEN).not.toContain('akzentAuswahl')
    expect(CODEZEILEN).not.toContain('istAkzentRolle')
  })

  it('enthaelt kein Zeichen # in einem String-Literal und keinen loeseFarbe-Aufruf', () => {
    expect(CODEZEILEN).not.toMatch(/['"`]#[^'"`]*['"`]/)
    expect(CODEZEILEN).not.toContain('loeseFarbe')
  })

  it('importiert keine Kontrast-Rechnung', () => {
    expect(QUELLE).not.toContain('kontrast')
  })

  it('schreibt die akzentfarbe ausschliesslich ueber speichereAktion (kein Kanal-Literal, kein window.api)', () => {
    expect(CODEZEILEN).not.toContain('project:')
    expect(CODEZEILEN).not.toContain('window.api')
  })
})

// ---------------- Typ-Pruefung: AKZENT_ROLLEN ist Teilmenge von FarbRolle ----------------

describe('AKZENT_ROLLEN (#318)', () => {
  it('die Liste enthaelt nicht flaecheAkzentZart', () => {
    expect(AKZENT_ROLLEN).not.toContain('flaecheAkzentZart')
  })

  it('ist mit @ts-expect-error gegen erfundene Namen abgedichtet (typseitig FarbRolle)', () => {
    // @ts-expect-error "erfundeneRolle" ist kein FarbRolle und darf nicht
    // hinzugefuegt werden koennen - die Zeile beweist das, und die Direktive
    // meldet sich (TS2578), wenn der Schutz wegfaellt.
    const erfunden: readonly FarbRolle[] = [...AKZENT_ROLLEN, 'erfundeneRolle'];
    expect(erfunden.length).toBe(4)
  })
})

// ---------------- speichereAktion-Doppel ----------------

const speicherDoppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ id: string; aenderungen: unknown }>,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/action-editor/aktion-bearbeiten', () => ({
  speichereAktion: async (id: string, aenderungen: unknown) => {
    speicherDoppel.aufrufe.push({ id, aenderungen })
    return speicherDoppel.antwort
  },
}))

import {
  AKZENT_ROLLEN,
  AKZENT_STANDARD,
  akzentVorschlaege,
  istAkzentfarbe,
  setzeAkzentfarbe,
} from '../../src/renderer/action-editor/akzentfarbe'

// ---------------- Bausteine ----------------

const FARBEN: Record<FarbRolle, string> = {
  akzent: '#FF4040',
  akzentKraeftig: '#DF3131',
  akzentTief: '#971316',
  flaecheDunkel: '#2F2E2E',
  flaecheSehrDunkel: '#4B090B',
  flaecheHell: '#FFFFFF',
  flaecheAkzentZart: '#F5AEAF',
  textAufDunkel: '#FFFFFF',
  textAufHell: '#202020',
  textSekundaer: '#8F8F8F',
  linie: '#CCCCCC',
  scrimStart: '#00000000',
  scrimEnde: '#000000B3',
}

function marke(abweichung: Partial<Record<FarbRolle, string>> = {}): Marke {
  return {
    farben: { ...FARBEN, ...abweichung },
    schriften: {
      headlineElegant: { familie: 'Playfair Display', gewicht: 700, datei: 'P.woff2' },
      headlinePlakativ: { familie: 'Archivo Black', gewicht: 900, datei: 'A.woff2' },
      fliesstext: { familie: 'Arimo', gewicht: 400, datei: 'R.woff2' },
      fliesstextFett: { familie: 'Arimo', gewicht: 700, datei: 'B.woff2' },
    },
    logo: { datei: 'logo.png', seitenverhaeltnis: 3.5 },
    sicherheit: SICHERHEITSABSTAND_PX,
    radien: { pille: 40, karte: 10, klein: 2 },
    schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#00000040' },
    slogan: { text: '', aktiv: false },
  }
}

const AKTION_OK: Aktion = {
  id: 'a1',
  titel: 'Sommeraktion',
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: 'vollbild',
  akzentfarbe: null,
}

beforeEach(() => {
  speicherDoppel.aufrufe.splice(0)
  speicherDoppel.antwort = { ok: true, wert: AKTION_OK }
})

// ---------------- Tests ----------------

describe('akzentVorschlaege (#318)', () => {
  it('liefert GENAU drei Eintraege in der Reihenfolge von AKZENT_ROLLEN, je mit dem Markenwert', () => {
    expect(akzentVorschlaege(marke())).toEqual([
      { rolle: 'akzent', hex: '#FF4040' },
      { rolle: 'akzentKraeftig', hex: '#DF3131' },
      { rolle: 'akzentTief', hex: '#971316' },
    ])
  })

  it('eine veraenderte Marke aendert das Ergebnis mit (die Werte kommen zur Laufzeit aus marke.farben)', () => {
    expect(akzentVorschlaege(marke({ akzent: '#00AAFF' }))).toEqual([
      { rolle: 'akzent', hex: '#00AAFF' },
      { rolle: 'akzentKraeftig', hex: '#DF3131' },
      { rolle: 'akzentTief', hex: '#971316' },
    ])
  })
})

describe('istAkzentfarbe (#318) – genau # + SECHS Hex-Ziffern', () => {
  it.each(['#FF4040', '#ff4040', '#000000'])('nimmt %s an', (wert) => {
    expect(istAkzentfarbe(wert)).toBe(true)
  })

  it.each([
    '#FF404080', // achtstellig - hier NICHT speicherbar
    '#FFF',
    'FF4040',
    'akzent',
    'akzentTief',
    'rot',
    'rgb(255,64,64)',
    '',
  ])('lehnt %s ab', (wert) => {
    expect(istAkzentfarbe(wert)).toBe(false)
  })
})

describe('AKZENT_STANDARD (#318)', () => {
  it('ist null - der Markenwert gilt fuer neue Aktionen', () => {
    expect(AKZENT_STANDARD).toBeNull()
  })
})

describe('setzeAkzentfarbe (#318)', () => {
  it('setzeAkzentfarbe("a1", "#00AAFF") ruft speichereAktion("a1", { akzentfarbe: "#00AAFF" }) - kein weiteres Feld', async () => {
    await setzeAkzentfarbe('a1', '#00AAFF')
    expect(speicherDoppel.aufrufe).toEqual([
      { id: 'a1', aenderungen: { akzentfarbe: '#00AAFF' } },
    ])
  })

  it('null wird GESSENDET, nicht ausgelassen und nicht ersetzt', async () => {
    await setzeAkzentfarbe('a1', null)
    expect(speicherDoppel.aufrufe).toEqual([
      { id: 'a1', aenderungen: { akzentfarbe: null } },
    ])
  })

  it('setzeAkzentfarbe("a1", "akzent") und ("a1", "#FFF") -> kein IPC-Aufruf, ungueltige_eingabe', async () => {
    for (const wert of ['akzent', '#FFF']) {
      const antwort = await setzeAkzentfarbe('a1', wert)
      expect(antwort.ok).toBe(false)
      if (!antwort.ok) {
        expect(antwort.fehler.code).toBe('ungueltige_eingabe')
        expect(antwort.fehler.meldung).toContain(wert)
      }
    }
    expect(speicherDoppel.aufrufe).toHaveLength(0)
  })

  it('kein stiller Rueckfall auf eine Standardfarbe', async () => {
    const antwort = await setzeAkzentfarbe('a1', 'rot')
    expect(antwort.ok).toBe(false)
    expect(speicherDoppel.aufrufe).toHaveLength(0)
  })
})
