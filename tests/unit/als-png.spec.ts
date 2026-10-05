// Verhaltenstests zu #118 - alsPng.ts (je Pattern aus #118 DoD).
import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { alsPng } from '../../src/renderer/template-canvas/als-png'
import type { SegmentBild } from '../../src/renderer/template-canvas/zeichne-segment'

const QUELLE_HTML = readFileSync(
  new URL('../../src/renderer/template-canvas/als-png.ts', import.meta.url).pathname,
  'utf8',
)

const QUELLE = QUELLE_HTML.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('als-png – Quelldatei-Verbote (Grep)', () => {
  it('kein toDataURL, kein GET_CONTEXT, kein zweiter Zeichenpfad, kein Dateizugriff, kein Farbprofil', () => {
    for (const verbot of ['toDataURL', 'getContext', 'node:fs', 'colorSpace', 'Display-P3', 'srgbExaktkolorSpace']) {
      expect(QUELLE).not.toContain(verbot)
    }
    expect(QUELLE).not.toContain('zeichneSegment(')  // ein zweiter Aufruf wäre zweiter Zeichenpfad
    expect(QUELLE).toContain("'image/png'")  // der MIME-Typ steht ausdrücklich
  })
})

// Doppel: toBlob am Canvas, plus ein zu große Bildkoordinaten.
function bild(aufrufEinstellung: { nullRufen?: boolean; falscheMaße?: boolean; wirft?: Error } = {}): SegmentBild & { toBlob: ReturnType<typeof vi.fn> } {
  // Die Canvas-Größe weicht BEWUSST von den SegmentMaßen ab (1×1 vs 2×2):
  // Das ist der alleinige Fall der Maß-Prüfung.
  const breite = aufrufEinstellung.falscheMaße === true ? 1 : 2
  const hoehe = aufrufEinstellung.falscheMaße === true ? 1 : 2
  const segBreite = aufrufEinstellung.falscheMaße === true ? 2 : breite
  const segHoehe = aufrufEinstellung.falscheMaße === true ? 2 : hoehe
  const toBlob = vi.fn<(callback: (blob: Blob | null) => void, mime: string) => void>(
    (callback: (blob: Blob | null) => void) => {
      if (aufrufEinstellung.wirft !== undefined) {
        throw aufrufEinstellung.wirft
      }
      if (aufrufEinstellung.nullRufen === true) {
        callback(null)
        return
      }
      const bytes = new Uint8Array([137, 80, 78, 71])
      callback(new Blob([bytes], { type: 'image/png' }))
    },
  )
  const canvas = { width: breite, height: hoehe, toBlob } as unknown as HTMLCanvasElement
  return { canvas, breite: segBreite, höhe: segHoehe, toBlob } as never as SegmentBild & { toBlob: ReturnType<typeof vi.fn> }
}

const PNG_MAGIC = new Uint8Array([137, 80, 78, 71])

describe('alsPng (#118)', () => {
  it('liefert die PNG-Bytes als Uint8Array (kein Base64)', async () => {
    const b = bild()
    const antwort = await alsPng(b)
    expect(antwort.ok).toBe(true)
    if (antwort.ok) {
      expect(Array.from(antwort.wert)).toEqual(Array.from(PNG_MAGIC))
    }
  })

  it("ruft toBlob mit dem MIME-Typ 'image/png' UND ohne Qualitätsargument auf", async () => {
    const b = bild()
    await alsPng(b)
    expect(b.toBlob.mock.calls[0]?.[1]).toBe('image/png')
    expect(b.toBlob.mock.calls[0]).toHaveLength(2)
  })

  it('Maße diskrepant -> png_export_fehler, messung nennt die Maße, kein toBlob', async () => {
    const b = bild({ falscheMaße: true })
    const antwort = await alsPng(b)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('png_export_fehler')
      expect(antwort.fehler.meldung).toContain('1×1')
      expect(antwort.fehler.meldung).toContain('2×2')
    }
    expect(b.toBlob).not.toHaveBeenCalled()
  })

  it("toBlob ruft mit null zurück -> png_export_fehler, keine Wirkung am Puffer", async () => {
    const antwort = await alsPng(bild({ nullRufen: true }))
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('png_export_fehler')
      expect(antwort.fehler.meldung).toContain('null')
    }
  })

  it('leerer Puffer -> png_export_fehler', async () => {
    const leer = new Blob([new Uint8Array(0)], { type: 'image/png' })
    const b = bild()
    b.toBlob.mockImplementation((callback) => callback(leer))
    const antwort = await alsPng(b)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.meldung).toContain('leer')
    }
  })

  it('toBlob wirft (SecurityError) -> gefangen, Original-Meldung im Fehler, kein Wurf nach außen', async () => {
    const wirft = new Error('SecurityError: tainted canvas')
    const antwort = await alsPng(bild({ wirft }))
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('png_export_fehler')
      expect(antwort.fehler.meldung).toBe('SecurityError: tainted canvas')
    }
  })
})
