// Verhaltenstests zu #291 - `stelleMarkenSchriftenBereit`, `sindMarkenSchriftenBereit`
// und `leereMarkenSchriftBestand` in src/renderer/template-canvas/marken-schriften.ts.
//
// Ohne Browser pruefbar (laut Definition of Done): Idempotenz je markeId, das
// Fehlschlag-Verhalten und die URL-Bildung. FontFace und document.fonts werden
// durch Aufzeichnungs-Doppel ersetzt; der Test baut sie selbst, damit er nicht an
// einer Browser-Umgebung haengt. Der echte Nachweis in einem echten Chromium
// gehoert in die Integration (dieselbe Einordnung wie marken-schriften.spec.ts
// zu #8 in tests/integration/).
//
// `schriftKurzform` (#110) wird gemockt - exakt nach dem dort verbindlich
// dokumentierten Format `${gewicht} ${groessePx}px "${familie}"`. Die Datei darf
// keine eigene Kurzform-Bildung haben; der Mock stellt nur den Fremdvertrag bereit,
// dessen echte Umsetzung zu #110 gehoert und hier nicht nachgebaut wird.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Marke, Schrift } from '../../src/shared/contracts/marke'

const kurzformAufrufe: string[] = []

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  schriftKurzform: (schrift: Schrift, groessePx: number): string => {
    const wert = `${schrift.gewicht} ${groessePx}px "${schrift.familie}"`
    kurzformAufrufe.push(wert)
    return wert
  },
}))

import {
  leereMarkenSchriftBestand,
  sindMarkenSchriftenBereit,
  stelleMarkenSchriftenBereit,
} from '../../src/renderer/template-canvas/marken-schriften'

// ---------------------------------------------------------------------------
// Doppel fuer FontFace und document.fonts
// ---------------------------------------------------------------------------

interface GesichtAufzeichnung {
  familie: string
  quelle: string
  gewicht: string
}

/** Alles, was die Produktivdatei je konstruiert hat - seit Testbeginn. */
let konstruiert: GesichtAufzeichnung[] = []
/** Steuert, ob das naechste load() aufloest oder ablehnt (je Familie/Gewicht). */
let ladeErfolg: boolean = true

class FontFaceDoppel {
  readonly family: string
  readonly source: string
  readonly weight: string
  status: 'unloaded' | 'loading' | 'loaded' | 'error' = 'unloaded'

  constructor(familie: string, quelle: string, optionen?: { weight?: string }) {
    this.family = familie
    this.source = quelle
    this.weight = optionen?.weight ?? 'normal'
    konstruiert.push({ familie, quelle, gewicht: this.weight })
  }

  load(): Promise<FontFaceDoppel> {
    this.status = 'loading'
    if (ladeErfolg) {
      this.status = 'loaded'
      return Promise.resolve(this)
    }
    return Promise.reject(new Error('Laden fehlgeschlagen'))
  }
}

/**
 * document.fonts-Doppel: add() merkt Faces, check() beantwortet die Frage nach
 * "gewicht groessePx \"familie\"" NUR aus den registrierten Faces - genau die
 * Semantik, von der der Nachweis im Issue abhaengt.
 */
const registriert = new Map<string, FontFaceDoppel>()

const fontSetzungDoppel = {
  add(gesicht: FontFaceDoppel): void {
    registriert.set(`${gesicht.family}|${gesicht.weight}`, gesicht)
  },
  check(kurzform: string): boolean {
    const treffer = /^(\S+) \d+px "(.+)"$/.exec(kurzform)
    if (!treffer) return false
    return registriert.get(`${treffer[2]}|${treffer[1]}`)?.status === 'loaded'
  },
}

beforeEach(() => {
  konstruiert = []
  ladeErfolg = true
  registriert.clear()
  kurzformAufrufe.length = 0
  leereMarkenSchriftBestand()
  vi.stubGlobal('FontFace', FontFaceDoppel)
  vi.stubGlobal('document', { fonts: fontSetzungDoppel })
})

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function importierte(datei: string, familie: string, gewicht: number): Schrift {
  return { familie, gewicht, datei, herkunft: 'importiert' }
}

function gebuendelte(familie: string, gewicht: number): Schrift {
  return { familie, gewicht, datei: `${familie}-${gewicht}.woff2`, herkunft: 'gebuendelt' }
}

/** Marke mit vier Rollen; `importierteSchriften` landen in den Rollen der Reihe nach. */
function marke(id: string, schriften: Schrift[]): Marke {
  const rollen = ['headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett'] as const
  if (schriften.length > rollen.length) throw new Error('Test baut zu viele Schriften')
  const gefuellt = rollen.map((rolle, i) => [
    rolle,
    schriften[i] ?? gebuendelte(`Ersatz-${i}`, 400),
  ])
  return {
    id,
    name: `Marke ${id}`,
    schriften: Object.fromEntries(gefuellt) as Marke['schriften'],
    logo: null,
    farben: { primaer: '#000000', sekundaer: '#ffffff', akzent: '#ff0000' },
    herkunftJeFeld: {
      name: 'eigen',
      farben: { primaer: 'eigen', sekundaer: 'eigen', akzent: 'eigen' },
      schriften: {
        headlineElegant: 'eigen',
        headlinePlakativ: 'eigen',
        fliesstext: 'eigen',
        fliesstextFett: 'eigen',
      },
    },
  } as unknown as Marke
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('stelleMarkenSchriftenBereit (#291)', () => {
  it('baut fuer jede importierte Schrift ein FontFace mit marken://-URL und Gewicht als Text', async () => {
    const m = marke('m1', [importierte('Kopf.woff2', 'MarkenKopf', 700)])
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert).toEqual([
      { familie: 'MarkenKopf', quelle: 'url(marken://m1/Kopf.woff2)', gewicht: '700' },
    ])
  })

  it('ein GEERBTES importiertes Feld laedt aus dem Ordner des Parents (KindId sonst 404)', async () => {
    const m = marke('kind1', [importierte('Kopf.woff2', 'MarkenKopf', 700)])
    m.parent = 'parent1'
    // `marke()` legt die erste importierte Schrift in die erste Rolle.
    m.herkunftJeFeld.schriften.headlineElegant = 'geerbt'
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert).toEqual([
      { familie: 'MarkenKopf', quelle: 'url(marken://parent1/Kopf.woff2)', gewicht: '700' },
    ])
  })

  it('ein EIGENES importiertes Feld laedt weiter aus dem eigenen Ordner', async () => {
    const m = marke('kind2', [importierte('Kopf.woff2', 'MarkenKopf', 700)])
    m.parent = 'parent2'
    m.herkunftJeFeld.schriften.headlineElegant = 'eigen'
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert[0]?.quelle).toBe('url(marken://kind2/Kopf.woff2)')
  })

  it('laesst gebuendelte Schriften unberuehrt - sie gehoeren zu #8/M4-16', async () => {
    const m = marke('m2', [gebuendelte('NurGebuendelt', 400)])
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert).toEqual([])
    expect(registriert.size).toBe(0)
  })

  it('loest bei einer Marke ohne importierte Schrift sofort auf, ohne FontFace-Konstruktion', async () => {
    const m = marke('m3', [])
    await expect(stelleMarkenSchriftenBereit(m)).resolves.toBeUndefined()
    expect(konstruiert).toEqual([])
  })

  it('ist idempotent je markeId: zehn parallele Aufrufe laden jede Schrift genau einmal', async () => {
    const m = marke('m4', [
      importierte('A.woff2', 'FamilieA', 400),
      importierte('B.woff2', 'FamilieB', 700),
    ])
    await Promise.all(Array.from({ length: 10 }, () => stelleMarkenSchriftenBereit(m)))
    expect(konstruiert).toHaveLength(2)
    expect(konstruiert.filter((k) => k.familie === 'FamilieA')).toHaveLength(1)
    expect(konstruiert.filter((k) => k.familie === 'FamilieB')).toHaveLength(1)
  })

  it('unterscheidet Marken: zwei markeIds laden jeweils eigene Schriften', async () => {
    await stelleMarkenSchriftenBereit(marke('m5a', [importierte('X.woff2', 'FX', 400)]))
    await stelleMarkenSchriftenBereit(marke('m5b', [importierte('Y.woff2', 'FY', 400)]))
    expect(konstruiert.map((k) => k.familie)).toEqual(['FX', 'FY'])
  })

  it('reicht die Ausnahme beim Fehlschlag unverändert weiter', async () => {
    ladeErfolg = false
    const m = marke('m6', [importierte('Fehlt.woff2', 'FFehlt', 400)])
    await expect(stelleMarkenSchriftenBereit(m)).rejects.toThrow('Laden fehlgeschlagen')
  })

  it('versucht es nach einem abgelehnten Ladevorgang beim nächsten Aufruf erneut', async () => {
    ladeErfolg = false
    const m = marke('m7', [importierte('Erneut.woff2', 'FErneut', 400)])
    await expect(stelleMarkenSchriftenBereit(m)).rejects.toThrow()
    ladeErfolg = true
    await expect(stelleMarkenSchriftenBereit(m)).resolves.toBeUndefined()
    expect(konstruiert).toHaveLength(2)
  })
})

describe('sindMarkenSchriftenBereit (#291)', () => {
  it('liefert true für eine Marke ohne importierte Schrift - auch ohne vorherigen Aufruf', () => {
    expect(sindMarkenSchriftenBereit(marke('m8', []))).toBe(true)
  })

  it('liefert false, bevor stelleMarkenSchriftenBereit gerufen wurde', () => {
    expect(sindMarkenSchriftenBereit(marke('m9', [importierte('N.woff2', 'FN', 400)]))).toBe(false)
  })

  it('liefert erst true, wenn check() für ALLE importierten Schriften true liefert', async () => {
    const m = marke('m10', [
      importierte('P.woff2', 'FP', 400),
      importierte('Q.woff2', 'FQ', 700),
    ])
    expect(sindMarkenSchriftenBereit(m)).toBe(false)
    await stelleMarkenSchriftenBereit(m)
    expect(sindMarkenSchriftenBereit(m)).toBe(true)

    // Gegenprobe: Fehlt EINE der beiden (Face wieder entfernt), muss die Abfrage
    // wieder false liefern - der Nachweis gilt fuer alle importierten Schriften mit.
    registriert.delete('FQ|700')
    expect(sindMarkenSchriftenBereit(m)).toBe(false)

    // Ein ERFOLGREICHER Ladevorgang bleibt zu Recht gemerkt (Idempotenz) - erneutes
    // stelleMarkenSchriftenBereit laedt nicht nach. Der vorgesehene Ungueltigkeitsweg
    // ist leereMarkenSchriftBestand(); erst danach wird erneut geladen.
    await stelleMarkenSchriftenBereit(m)
    expect(sindMarkenSchriftenBereit(m)).toBe(false)
    expect(konstruiert).toHaveLength(2)

    leereMarkenSchriftBestand()
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert).toHaveLength(4)
    expect(sindMarkenSchriftenBereit(m)).toBe(true)
  })

  it('bildet die geprüfte Zeichenkette ausschließlich über schriftKurzform', async () => {
    const m = marke('m11', [importierte('K.woff2', 'FKurz', 400)])
    await stelleMarkenSchriftenBereit(m)
    sindMarkenSchriftenBereit(m)
    expect(kurzformAufrufe).toContain('400 16px "FKurz"')
  })

  it('bleibt false nach gescheitertem Laden (kein stiller Ersatz)', async () => {
    ladeErfolg = false
    const m = marke('m12', [importierte('W.woff2', 'FW', 400)])
    await expect(stelleMarkenSchriftenBereit(m)).rejects.toThrow()
    expect(sindMarkenSchriftenBereit(m)).toBe(false)
  })
})

describe('leereMarkenSchriftBestand (#291)', () => {
  it('setzt den Bestand zurück: der nächste Aufruf lädt erneut', async () => {
    const m = marke('m13', [importierte('R.woff2', 'FR', 400)])
    await stelleMarkenSchriftenBereit(m)
    expect(sindMarkenSchriftenBereit(m)).toBe(true)
    leereMarkenSchriftBestand()
    expect(sindMarkenSchriftenBereit(m)).toBe(false)
    await stelleMarkenSchriftenBereit(m)
    expect(konstruiert).toHaveLength(2)
    expect(sindMarkenSchriftenBereit(m)).toBe(true)
  })

  it('wirft nichts, wenn der Bestand schon leer ist', () => {
    leereMarkenSchriftBestand()
    leereMarkenSchriftBestand()
  })
})
