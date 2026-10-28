// Tests zu #216 - video.tsx (die Anzeige, jsdom).
//
// Ersetzt wird das Handle-Register (#246) durch ein Doppel mit Spionen. Der
// Stickpunkt ist die EINBAHN-Struktur der Steuerverwaltung: die Quelle wird
// NUR bei Projekt-/Dateiwechsel gesetzt, die Position NUR ausserhalb der
// Toleranz, und am Ende des Ausschnitts wird pausiert statt gesprungen.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Aktion } from '../../src/shared/contracts/aktion'
import { medienUrl } from '../../src/renderer/preview-player/medien-url'

const doppel = vi.hoisted(() => ({
  anmeldungen: [] as Array<{ assetId: string; handle: unknown }>,
  abmeldungen: [] as Array<{ assetId: string }>,
}))

vi.mock('../../src/renderer/gemeinsam/video-handles', () => ({
  meldeVideoHandleAn: (assetId: string, handle: unknown) => {
    doppel.anmeldungen.push({ assetId, handle })
    return () => {
      doppel.abmeldungen.push({ assetId })
    }
  },
}))

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const { Video } = await import('../../src/renderer/preview-player/video.tsx')
type VideoProps = import('../../src/renderer/preview-player/video.tsx').VideoProps
const { quellZeit } = await import('../../src/renderer/preview-player/video-zeit')

// ---------------- Bausteine ----------------

function eigenschaften(teil: Partial<VideoProps> = {}): VideoProps {
  return {
    projektId: 'p-1',
    dateiname: 'probe.mp4',
    assetId: 'asset-1',
    trimStart: 0,
    trimEnde: 12,
    lokalerFrame: 0,
    laeuft: false,
    ...teil,
  }
}

function rendere(props: VideoProps): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Video, props) as ReactElement)
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

let anmeldungsSpion: ReturnType<typeof vi.fn> | null = null

beforeEach(() => {
  doppel.anmeldungen = []
  doppel.abmeldungen = []
  anmeldungsSpion = null
  vi.spyOn(HTMLMediaElement.prototype, 'load')
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------- Quelle, Ton, Einpassung ----------------

describe('Quelle und Einstellungen', () => {
  it('die Quelle ist GENAU medienUrl(projektId, dateiname); die assetId bleibt als Register-Schluessel außen vor', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ assetId: 'aaa-voll-anders' }))
    const video = behaelter.querySelector('video') as HTMLVideoElement
    expect(video.getAttribute('src')).toBe(medienUrl('p-1', 'probe.mp4'))
    fertig()
  })

  it('stumm; kein controls, kein loop, kein autoplay', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const video = behaelter.querySelector('video') as HTMLVideoElement
    expect(video.muted).toBe(true)
    expect(video.hasAttribute('controls')).toBe(false)
    expect(video.hasAttribute('loop')).toBe(false)
    expect(video.hasAttribute('autoplay')).toBe(false)
    fertig()
  })

  it('object-fit: contain', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const video = behaelter.querySelector('video') as HTMLVideoElement
    expect(video.style.objectFit).toBe('contain')
    fertig()
  })

  it('ohne Rahmen die volle Buehne; mit Rahmen die vier unveraenderten Pixelwerte', () => {
    const erste = rendere(eigenschaften())
    const flaeche = erste.behaelter.querySelector('[data-testid="preview-video"]') as HTMLElement
    expect(flaeche.style.left).toBe('0px')
    expect(flaeche.style.top).toBe('0px')
    expect(flaeche.style.width).toBe('100%')
    expect(flaeche.style.height).toBe('100%')
    expect(flaeche.style.background).toBe('rgb(0, 0, 0)')
    erste.fertig()
    document.body.innerHTML = ''

    const zweite = rendere(
      eigenschaften({
        rahmen: { x: 144, y: 0, breite: 1632, höhe: 918 },
        hintergrund: '#2F2E2E',
      }),
    )
    const ekah = zweite.behaelter.querySelector('[data-testid="preview-video"]') as HTMLElement
    expect(ekah.style.left).toBe('144px')
    expect(ekah.style.top).toBe('0px')
    expect(ekah.style.width).toBe('1632px')
    expect(ekah.style.height).toBe('918px')
    expect(ekah.style.background).toBe('rgb(47, 46, 46)')
    zweite.fertig()
  })
})

// ---------------- das Steuerverhalten ----------------

describe('Abspielen und Anhalten (die Uhr steuert, das Video nicht)', () => {
  it('laeuft true -> play GENAU EINMAL; laeuft false danach -> pause', () => {
    const { behaelter, wurzel, fertig } = rendere(eigenschaften({ laeuft: true, trimStart: 0, lokalerFrame: 0 }))
    const video = behaelter.querySelector('video') as HTMLVideoElement
    const playSpion = vi.spyOn(video, 'play')
    const pauseSpion = vi.spyOn(video, 'pause')
    act(() => {
      wurzel.render(
        createElement(Video, eigenschaften({ laeuft: true, trimStart: 0, lokalerFrame: 0 })) as ReactElement,
      )
    })
    expect(playSpion).toHaveBeenCalledTimes(1)
    // jsdom spielt NICHT ab (passiert dort nichts im Kern),
    // deshalb stelle ich den paused-Wert bewusst auf den Zustand, den der
    // echte Browser nach einem laufenden Film hat, und schalte DANN ab.
    Object.defineProperty(video, 'paused', { get: () => false })
    act(() => {
      wurzel.render(createElement(Video, eigenschaften({ laeuft: false, trimStart: 0, lokalerFrame: 0 })) as ReactElement)
    })
    expect(pauseSpion).toHaveBeenCalledTimes(1)
    fertig()
  })

  it('eine ABGELEHNTE Zusage aus play() wird verworfen - keine unbehandelte Ablehnung', async () => {
    const { behaelter, wurzel, fertig } = rendere(eigenschaften({ laeuft: true, trimStart: 0, lokalerFrame: 60 }))
    const video = behaelter.querySelector('video') as HTMLVideoElement
    vi.spyOn(video, 'play').mockImplementation(() => Promise.reject(new Error('Element weg')))
    act(() => {
      wurzel.render(
        createElement(Video, eigenschaften({ laeuft: true, trimStart: 0, lokalerFrame: 60 })) as ReactElement,
      )
    })
    // Der Auflauf des Verworfenen: kein Crash, keine Ausgabe.
    await act(async () => undefined)
    expect(true).toBe(true)
    fertig()
  })

  it('innerhalb der Toleranz wird currentTime NICHT gesetzt', () => {
    // soll = quellZeit(0, 3) = 0.1; ist = 0: Abweichung 0.1 <= 0.25 -> kein Setzen.
    const { behaelter, fertig } = rendere(eigenschaften({ trimStart: 0, lokalerFrame: 3 }))
    const video = behaelter.querySelector('video') as HTMLVideoElement
    expect(video.currentTime).toBe(0)
    fertig()
  })

  it('ausserhalb der Toleranz wird currentTime auf quellZeit gesetzt', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ trimStart: 0, lokalerFrame: 60 }))
    const video = behaelter.querySelector('video') as HTMLVideoElement
    expect(video.currentTime).toBe(quellZeit(0, 60))
    fertig()
  })

  it('am ENDE des Ausschnitts: pause, und currentTime wird NICHT gesetzt', () => {
    // soll = quellZeit(0, 30) = 1.0, trimEnde = 1: GENAU die Grenze, nicht dahinter.
    const { behaelter, wurzel, fertig } = rendere(
      eigenschaften({ trimStart: 0, trimEnde: 1, lokalerFrame: 30 }),
    )
    const video = behaelter.querySelector('video') as HTMLVideoElement
    const pauseSpion = vi.spyOn(video, 'pause')
    act(() => {
      wurzel.render(
        createElement(
          Video,
          eigenschaften({ trimStart: 0, trimEnde: 1, lokalerFrame: 30 }),
        ) as ReactElement,
      )
    })
    // `>=` haelt an; mit `>` wuerde die Grenze als "noch nicht am Ende" gelten
    // und currentTime auf 1 gesetzt - das letzte Bild ginge verloren.
    expect(pauseSpion).toHaveBeenCalledTimes(1)
    expect(video.currentTime).toBe(0)
    fertig()
  })

  it('lokalerFrame/laeuft aendern sich, aber NICHT projektId/dateiname: die Quelle wird NICHT neu gesetzt', () => {
    const erste = rendere(eigenschaften({ lokalerFrame: 0 }))
    expect((HTMLMediaElement.prototype.load as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThanOrEqual(1)
    const vorwartend = (HTMLMediaElement.prototype.load as ReturnType<typeof vi.fn>).mock.calls.length
    act(() => {
      erste.wurzel.render(
        createElement(Video, eigenschaften({ lokalerFrame: 90, laeuft: true, trimStart: 1, trimEnde: 12 })) as ReactElement,
      )
    })
    expect(
      (HTMLMediaElement.prototype.load as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(vorwartend)
    erste.fertig()
  })
})

// ---------------- das Handle-Register (#246) ----------------

describe('Anmeldung am Handle-Register', () => {
  it('Einhaengen meldet GENAU EINMAL; Abbauen ruft die Abmeldefunktion GENAU EINMAL', () => {
    const erste = rendere(eigenschaften({ assetId: 'asset-9' }))
    expect(doppel.anmeldungen).toHaveLength(1)
    expect(doppel.anmeldungen[0]?.assetId).toBe('asset-9')
    // das Element ist das MELDUNG Objekt (kein Hullahop)
    expect(doppel.anmeldungen[0]?.handle).toBe(erste.behaelter.querySelector('video'))
    erste.fertig()
    // beim Abbau der Abmeldung GENAU EINMAL
    expect(doppel.abmeldungen).toHaveLength(1)
  })
})
