// Verhaltenstests zu #118 - alsPng.ts (je Pattern aus #118 DoD).
import { describe, expect, it, vi } from 'vitest'

import { alsPng } from '../../src/renderer/template-canvas/als-png'
import type { SegmentBild } from '../../src/renderer/template-canvas/zeichne-segment'

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

  it('NUR die Breite weicht ab -> png_export_fehler, kein toBlob (beide Masse zaehlen einzeln)', async () => {
    const b = bild()
    ;(b.canvas as unknown as { width: number }).width = 3 // bild.breite ist 2
    const antwort = await alsPng(b)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) expect(antwort.fehler.code).toBe('png_export_fehler')
    expect(b.toBlob).not.toHaveBeenCalled()
  })

  it('nicht-quadratisch mit passenden Massen -> ok (Breite und Hoehe werden NICHT vertauscht)', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71])
    const toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob([bytes], { type: 'image/png' }))
    })
    const canvas = { width: 4, height: 2, toBlob } as unknown as HTMLCanvasElement
    const b = { canvas, breite: 4, höhe: 2 } as unknown as SegmentBild
    const antwort = await alsPng(b)
    expect(antwort.ok).toBe(true)
    expect(toBlob).toHaveBeenCalledTimes(1)
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
