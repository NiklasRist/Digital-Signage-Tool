// #364 - der FILMSTREIFEN bindet seine Quelle als Blob-URL, die Buehne nicht.
//
// Die DoD-Punkte woertlich:
//  - "filmstreifen.tsx bindet das geteilte Video ueber mediaBlobUrl; Freigabe bei
//    Element-/Quellwechsel (kein Leck ueber Projektwechsel hinweg)"
//  - "Die Buehne (video.tsx) nutzt WEITERHIN direkte media://-URL (Grep-Gegenprobe:
//    kein mediaBlobUrl-Aufruf dort)."
//
// Bild-INHALTE sind in jsdom nicht pruefbar (kein Decoder); die Pixel-Probe am
// echten Fenster ist offen und im Issue benannt. Was hier belegt wird, ist der
// BINDUNGSWEG: welche Quelle das <video> bekommt und dass die Objekt-URL wieder
// freigegeben wird.
// @vitest-environment jsdom
import { act } from 'react'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

import type { Listenelement, Project } from '../../src/shared/contracts/project'

const doppel = vi.hoisted(() => ({
  mediaBlobUrl: vi.fn(async () => 'blob:testquelle'),
  freigeben: vi.fn(),
  fangeBild: vi.fn(() => null as HTMLCanvasElement | null),
}))

vi.mock('../../src/renderer/gemeinsam/media-blob-url', () => ({
  mediaBlobUrl: doppel.mediaBlobUrl,
  gibMediaBlobUrlFrei: doppel.freigeben,
}))

// Kein Decoder in jsdom: Metadaten "gelingen", das Bild bleibt null - der Weg
// laeuft trotzdem vollstaendig durch (inkl. Freigabe im finally).
vi.mock('../../src/renderer/composer/thumbnails', () => ({
  warteAufMetadaten: async () => undefined,
  fangeBild: doppel.fangeBild,
}))

import { VideoFilmstreifen } from '../../src/renderer/composer/video-filmstreifen'

function projekt(): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-28T00:00:00Z',
    geaendertAm: '2026-10-28T00:00:00Z',
    schemaVersion: 1,
    assets: [
      {
        id: 'asset-1', typ: 'video', dateiname: 'a.mp4', originalname: 'a.mp4',
        maße: { breite: 1920, höhe: 1080 }, dauer: 10, importdatum: '', zustand: 'ok',
      },
    ],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  } as Project
}

function videoElement(): Listenelement {
  return { id: 'el-1', art: 'video', ref: 'asset-1', dauer: 10, trimStart: 0, trimEnde: 10, einblendung: null }
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

afterEach(() => {
  if (wurzel !== null) act(() => wurzel?.unmount())
  behaelter?.remove()
  behaelter = null
  wurzel = null
  doppel.mediaBlobUrl.mockClear()
  doppel.freigeben.mockClear()
  doppel.fangeBild.mockReset()
  doppel.fangeBild.mockReturnValue(null)
  vi.useRealTimers()
})

async function montiere(): Promise<void> {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  await act(async () => {
    wurzel?.render(
      createElement(VideoFilmstreifen, {
        projekt: projekt(),
        element: videoElement(),
        // 40 px = genau EIN Bild: der Suchlauf laeuft einmal, danach ist Schluss.
        breitePx: 40,
        hoehePx: 64,
      }),
    )
  })
  await act(async () => {})
}

describe('Filmstreifen bindet media:// als Blob-URL (#364)', () => {
  it('holt die Bytes entprellt ueber mediaBlobUrl und gibt die Objekt-URL danach frei', async () => {
    vi.useFakeTimers()
    await montiere()

    // Seit dem Ladezeit-Umbau (29.10.2026) wartet der Streifen 120 ms: schnelles
    // Zoomen loest nicht fuer jede Zwischenbreite einen eigenen Lauf aus.
    expect(doppel.mediaBlobUrl).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(130)
    })
    await act(async () => {})
    expect(doppel.mediaBlobUrl).toHaveBeenCalledWith('p1', 'a.mp4')

    // Der Suchlauf wartet auf `seeked` oder die Zeitgrenze (3000 ms) - danach
    // ist das letzte Bild durch und der finally-Zweig gibt frei.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })
    await act(async () => {})

    expect(doppel.freigeben).toHaveBeenCalledWith('blob:testquelle')
  })

  it('ohne brauchbares Asset wird gar keine Byte-Kopie angefordert', async () => {
    const ohneAsset = projekt()
    ohneAsset.assets = []
    behaelter = document.createElement('div')
    document.body.appendChild(behaelter)
    wurzel = createRoot(behaelter)
    await act(async () => {
      wurzel?.render(
        createElement(VideoFilmstreifen, {
          projekt: ohneAsset,
          element: videoElement(),
          breitePx: 200,
          hoehePx: 64,
        }),
      )
    })
    await act(async () => {})

    expect(doppel.mediaBlobUrl).not.toHaveBeenCalled()
  })
})
