// #364 - der Blob-URL-Weg fuer `media://`-Bytes (Muster #315/Nachtrag II).
//
// Geprueft wird die geteilte Hilfsfunktion: Bytes holen, als Objekt-URL binden,
// Fehler NIE werfen (leere Zeichenkette + console.warn mit Ursache), Freigabe total.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mediaBlobUrl, gibMediaBlobUrlFrei } from '../../src/renderer/gemeinsam/media-blob-url'

const original = {
  create: URL.createObjectURL,
  revoke: URL.revokeObjectURL,
}

let erzeugt: Blob[] = []
let freigegeben: string[] = []
let warnung: ReturnType<typeof vi.spyOn>
let revokeWirft = false

beforeEach(() => {
  erzeugt = []
  freigegeben = []
  revokeWirft = false
  // jsdom kennt keine Objekt-URLs fuer Blobs - hier ist der Zaehler, was zaehlt.
  ;(URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (bytes: Blob) => {
    erzeugt.push(bytes)
    return `blob:test-${erzeugt.length}`
  }
  ;(URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = (url: string) => {
    if (revokeWirft) throw new Error('revoke kaputt')
    freigegeben.push(url)
  }
  warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  ;(URL as unknown as { createObjectURL: typeof original.create }).createObjectURL = original.create
  ;(URL as unknown as { revokeObjectURL: typeof original.revoke }).revokeObjectURL = original.revoke
  warnung.mockRestore()
  vi.unstubAllGlobals()
})

describe('mediaBlobUrl (#364)', () => {
  it('holt media:// als Blob und gibt eine Objekt-URL zurueck', async () => {
    const bytes = new Blob(['video-bytes'])
    const abruf = vi.fn(async () => ({ ok: true, status: 200, blob: async () => bytes }))
    vi.stubGlobal('fetch', abruf)

    const url = await mediaBlobUrl('p1', 'a.mp4')

    expect(abruf).toHaveBeenCalledWith('media://p1/a.mp4')
    expect(url).toBe('blob:test-1')
    expect(erzeugt).toEqual([bytes])
  })

  it('eine Fehlerantwort ergibt "" und eine Warnung mit Ursache - kein Wurf', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, blob: async () => new Blob() })))

    await expect(mediaBlobUrl('p1', 'fehlt.mp4')).resolves.toBe('')
    expect(erzeugt).toHaveLength(0)
    expect(warnung).toHaveBeenCalledTimes(1)
    expect(String(warnung.mock.calls[0]?.[0])).toContain('404')
  })

  it('ein abgelehnter fetch ergibt "" und eine Warnung - kein Wurf', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('kein Handler'))))

    await expect(mediaBlobUrl('p1', 'a.mp4')).resolves.toBe('')
    expect(erzeugt).toHaveLength(0)
    expect(warnung).toHaveBeenCalledTimes(1)
    expect(String(warnung.mock.calls[0]?.[0])).toContain('media://p1/a.mp4')
  })
})

describe('gibMediaBlobUrlFrei (#364)', () => {
  it('gibt eine Objekt-URL frei, eine leere Zeichenkette ist ein No-op', () => {
    gibMediaBlobUrlFrei('')
    expect(freigegeben).toEqual([])

    gibMediaBlobUrlFrei('blob:test-1')
    expect(freigegeben).toEqual(['blob:test-1'])
  })

  it('wirft nie, auch wenn das Freigeben scheitert', () => {
    revokeWirft = true
    expect(() => gibMediaBlobUrlFrei('blob:test-1')).not.toThrow()
  })
})
