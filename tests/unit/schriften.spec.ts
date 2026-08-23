// Verhaltenstests zu #110 - stelleSchriftenBereit, sindSchriftenBereit, schriftKurzform.
//
// Ohne Browser pruefbar (DoD): #8 (ladeMarkenSchriften) wird als Modul gemockt und mit
// Aufrufzaehler versehen - Idempotenz und Fehlschlag-Verhalten sind darueber belegt.
// Die Kurzform ist eine reine Zeichenkette. DASS die echten Schriften im Renderer
// einsatzbereit sind, ist DoD von #8 und hier nicht erneut gefordert.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Schrift } from '../../src/shared/contracts/marke'

let ladeAufrufe = 0
/** Steuert das Verhalten des NAECHSTEN ladeMarkenSchriften-Aufrufs. */
let ladeVerhalten: 'ok' | 'ablehnen' = 'ok'
let aufgeloest = false

vi.mock('../../src/renderer/styles/schriften', () => ({
  ladeMarkenSchriften: async (): Promise<void> => {
    ladeAufrufe += 1
    if (ladeVerhalten === 'ablehnen') throw new Error('Font-Datei fehlt im Bundle')
    aufgeloest = true
  },
}))

async function frischesModul() {
  vi.resetModules()
  return import('../../src/renderer/template-canvas/schriften')
}

describe('stelleSchriftenBereit / sindSchriftenBereit (#110)', () => {
  beforeEach(() => {
    ladeAufrufe = 0
    ladeVerhalten = 'ok'
    aufgeloest = false
  })

  it('zehn parallele UND zehn nacheinander abgesetzte Aufrufe: genau EIN Ladevorgang', async () => {
    const modul = await frischesModul()
    await Promise.all(Array.from({ length: 10 }, () => modul.stelleSchriftenBereit()))
    for (let i = 0; i < 10; i++) {
      await modul.stelleSchriftenBereit()
    }
    expect(ladeAufrufe).toBe(1)
    expect(modul.sindSchriftenBereit()).toBe(true)
  })

  it('nach einem abgelehnten Ladeversuch versucht der nächste Aufruf es ERNEUT', async () => {
    const modul = await frischesModul()
    ladeVerhalten = 'ablehnen'
    await expect(modul.stelleSchriftenBereit()).rejects.toThrow('Font-Datei fehlt im Bundle')
    expect(modul.sindSchriftenBereit()).toBe(false)

    ladeVerhalten = 'ok'
    await expect(modul.stelleSchriftenBereit()).resolves.toBeUndefined()
    expect(ladeAufrufe).toBe(2) // zweiter Versuch, nicht gemerkt
    expect(modul.sindSchriftenBereit()).toBe(true)
  })

  it('sindSchriftenBereit startet selbst nie einen Ladevorgang', async () => {
    const modul = await frischesModul()
    expect(modul.sindSchriftenBereit()).toBe(false)
    expect(ladeAufrufe).toBe(0)

    await modul.stelleSchriftenBereit()
    expect(aufgeloest).toBe(true)
    expect(ladeAufrufe).toBe(1)
  })

  it('reicht die Ausnahme von #8 unverändert weiter (keine Hülle, kein Ersatz)', async () => {
    const modul = await frischesModul()
    ladeVerhalten = 'ablehnen'
    await expect(modul.stelleSchriftenBereit()).rejects.toThrow(
      /^Font-Datei fehlt im Bundle$/,
    )
  })
})

describe('schriftKurzform (#110)', () => {
  const modul = frischesModul

  it('liefert exakt "700 96px \\"Playfair Display\\"" - Zeichen für Zeichen', async () => {
    const m = await frischesModul()
    const schrift: Schrift = {
      familie: 'Playfair Display',
      gewicht: 700,
      datei: 'PlayfairDisplay-Bold.woff2',
      herkunft: 'gebuendelt',
    }
    expect(m.schriftKurzform(schrift, 96)).toBe('700 96px "Playfair Display"')
  })

  it('setzt den Familiennamen IMMER in doppelte Anführungszeichen - auch ohne Leerzeichen', async () => {
    const m = await frischesModul()
    const wert = m.schriftKurzform(
      { familie: 'Arimo', gewicht: 400, datei: '', herkunft: 'gebuendelt' },
      32,
    )
    expect(wert).toBe('400 32px "Arimo"')
  })

  it('enthält keine Fallback-Familie und keine weiteren font-Bestandteile', async () => {
    const m = await frischesModul()
    const wert = m.schriftKurzform(
      { familie: 'Archivo Black', gewicht: 900, datei: '', herkunft: 'gebuendelt' },
      48,
    )
    expect(wert).toBe('900 48px "Archivo Black"') // genau drei Bestandteile, Familie mit Leerzeichen ganz
    expect(wert).not.toContain(',') // keine Fallback-Familie
  })

  it.each([0, -1, 12.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'wirft bei ungültiger Größe %p',
    async (größePx) => {
      const m = await frischesModul()
      expect(() =>
        m.schriftKurzform(
          { familie: 'Arimo', gewicht: 400, datei: '', herkunft: 'gebuendelt' },
          größePx as number,
        ),
      ).toThrow(/größePx/)
    },
  )

  it('wirft bei leerer Familie oder Gewicht <= 0 (Programmierfehler)', async () => {
    const m = await frischesModul()
    expect(() =>
      m.schriftKurzform(
        { familie: '  ', gewicht: 400, datei: '', herkunft: 'gebuendelt' },
        16,
      ),
    ).toThrow(/familie/)
    expect(() =>
      m.schriftKurzform({ familie: 'Arimo', gewicht: 0, datei: '', herkunft: 'gebuendelt' }, 16),
    ).toThrow(/gewicht/)
  })

  it('gleiche Eingabe liefert zeichengleich denselben Wert (Determinismus, TK 9.10.3 Punkt 5)', async () => {
    const m = await frischesModul()
    const s: Schrift = {
      familie: 'Arimo',
      gewicht: 700,
      datei: '',
      herkunft: 'gebuendelt',
    }
    expect(m.schriftKurzform(s, 24)).toBe(m.schriftKurzform(s, 24))
  })
})
