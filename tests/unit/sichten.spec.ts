// Tests zu #311 - sichten.ts wird vom Marken-Zugang (#305) gespeist:
// Schritt 1 = baueMarkenZugang() (genau einmal, ZUERST), Schritt 2 = ladeUebersicht()
// (genau einmal). Die früheren rufeAuf-Aufrufe (config:leseMarke) sind ENTFALLEN.
// Grep-Proben pruefen die Quelldateien ohne Kommentarfasern.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  spur: [] as string[],
  markenZugangAufrufe: 0,
  markenZugangAntwort: null as unknown,
  ladeUebersichtAufrufe: 0,
  ladeUebersichtAntwort: null as unknown,
}))

vi.mock('../../src/renderer/app-shell/marken-zugang', () => ({
  baueMarkenZugang: async () => {
    doppel.spur.push('baueMarkenZugang')
    doppel.markenZugangAufrufe += 1
    return doppel.markenZugangAntwort as never
  },
}))

vi.mock('../../src/renderer/vorlagen-editor/vorlagen-uebersicht', () => ({
  ladeUebersicht: async () => {
    doppel.spur.push('ladeUebersicht')
    doppel.ladeUebersichtAufrufe += 1
    return doppel.ladeUebersichtAntwort as never
  },
  holeUebersicht: () => null,
  aufUebersichtGeaendert: () => () => {},
}))

import { baueSichten, holeSichten, type Sichten, type MarkenZugang } from '../../src/renderer/app-shell/sichten'
import { verteileZugaenge } from '../../src/renderer/app-shell/inhalte-zugaenge'

function baueZugangAttrappe(): MarkenZugang {
  return {
    lade: async () => ({ ok: true, wert: { marken: [] } }) as never,
    hole: () => ({ marken: [] }) as never,
    aufGeaendert: () => () => {},
  }
}

function stelleErfolgEin(): MarkenZugang {
  const zugang = baueZugangAttrappe()
  doppel.markenZugangAntwort = { ok: true, wert: zugang }
  doppel.ladeUebersichtAntwort = { ok: true, wert: { eintraege: [] } } as never
  return zugang
}

beforeEach(() => {
  doppel.spur = []
  doppel.markenZugangAufrufe = 0
  doppel.markenZugangAntwort = null
  doppel.ladeUebersichtAufrufe = 0
  doppel.ladeUebersichtAntwort = null
})

// ---------------- Die Reihenfolge und das Aufrufverhalten ----------------

describe('baueSichten (#311)', () => {
  it('ruft baueMarkenZugang GENAU einmal und ladeUebersicht GENAU einmal, in dieser Reihenfolge (Spione)', async () => {
    stelleErfolgEin()
    const ergebnis = await baueSichten()
    expect(ergebnis.ok).toBe(true)
    expect(doppel.markenZugangAufrufe).toBe(1)
    expect(doppel.ladeUebersichtAufrufe).toBe(1)
    expect(doppel.spur).toEqual(['baueMarkenZugang', 'ladeUebersicht'])
  })

  it('scheitert baueMarkenZugang, wird ladeUebersicht NICHT gerufen; Code UNVERAENDERT; holeSichten bleibt auf dem VORHERIGEN Stand', async () => {
    stelleErfolgEin()
    const erster = await baueSichten()
    expect(erster.ok).toBe(true)
    doppel.ladeUebersichtAufrufe = 0
    doppel.spur = []
    doppel.markenZugangAntwort = {
      ok: false, fehler: { code: 'marken_liegt_nicht_vor', meldung: 'Bestand unlesbar.' } as never,
    } as never
    const zweiter = await baueSichten()
    expect(zweiter.ok).toBe(false)
    if (!zweiter.ok) expect(zweiter.fehler.code).toBe('marken_liegt_nicht_vor')
    expect(doppel.ladeUebersichtAufrufe).toBe(0)
    // holeSichten liefert den ERSTEN (erfolgreichen) Stand weiter:
    expect(holeSichten()).toBe((erster as { ok: true; wert: Sichten }).wert)
  })

  it('der Erfolg: alle vier Felder belegt; marken ist toBe-gleich zum Zugang der Attrappe und hole() liefert sofort eine Uebersicht', async () => {
    const zugang = stelleErfolgEin()
    const ergebnis = await baueSichten()
    expect(ergebnis.ok).toBe(true)
    const sichten = (ergebnis as { ok: true; wert: Sichten }).wert
    expect(sichten.projekt).toBeDefined()
    expect(sichten.vorlagen).toBeDefined()
    expect(sichten.zeichnen).toBeDefined()
    expect(sichten.marken).toBeDefined()
    expect(sichten.marken).toBe(zugang)
    expect(sichten.marken.hole()).not.toBeNull()
  })

  it('ein zweiter Aufruf ruft baueMarkenZugang ERNEUT auf (kein Einmal-Schutz, #197 ENTSCHIEDEN 7)', async () => {
    stelleErfolgEin()
    await baueSichten()
    await baueSichten()
    expect(doppel.markenZugangAufrufe).toBe(2)
  })

  it('verteileZugaenge(sichten).marken ist toBe-gleich zu sichten.marken (keine Umhuellung)', async () => {
    stelleErfolgEin()
    const ergebnis = await baueSichten()
    const sichten = (ergebnis as { ok: true; wert: Sichten }).wert
    const verteilt = verteileZugaenge(sichten)
    expect(verteilt.marken).toBe(sichten.marken)
  })
})

// ---------------- Grep-Proben (ohne Kommentarfasern) ----------------

describe('Quelldatei-Verbote (Grep-Proben, ohne Kommentare): #311', () => {
  function ladeOhneKommentare(pfad: string): string {
    return readFileSync(new URL(pfad, import.meta.url), 'utf8')
      .split('\n')
      .map((z) => z.trim())
      .filter((z) => !z.startsWith('//') && !z.startsWith('*') && !z.startsWith('/*'))
      .join('\n')
  }

  it('sichten.ts: kein rufeAuf, kein String-Literal config:, kein KANAELE, kein Marke-Import', () => {
    const code = ladeOhneKommentare('../../src/renderer/app-shell/sichten.ts')
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toContain("'config:")
    expect(code).not.toContain('KANAELE')
    expect(code).not.toContain("from '../../shared/contracts/marke'")
    const einzelMarke = code.match(/\.marke\b(?!n)/)
    expect(einzelMarke).toBeNull()
  })

  it('inhalte-zugaenge.ts: kein .marke (Einzahl), kein KANAELE.config.leseMarke, kein Marke-Import', () => {
    const code = ladeOhneKommentare('../../src/renderer/app-shell/inhalte-zugaenge.ts')
    expect(code).not.toContain('KANAELE')
    expect(code).not.toContain("from '../../shared/contracts/marke'")
    expect(code).not.toMatch(/\.marke\b(?!n)/)
  })

  it('bootstrap.ts: keine marke-Treffer im Code (der Datei ist heute NICHTS zu aendern)', () => {
    const quelle = readFileSync(new URL('../../src/renderer/app-shell/bootstrap.ts', import.meta.url), 'utf8')
    expect(quelle).not.toMatch(/marke|Marke/)
  })
})
