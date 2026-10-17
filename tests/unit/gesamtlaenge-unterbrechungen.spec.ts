import { describe, expect, it } from 'vitest'

import { frameDauer } from '../../src/renderer/composer/gesamtlaenge'
import { zerlegeVideo } from '../../src/renderer/composer/unterbrechungs-zerlegung'
import { gesamtFrames } from '../../src/main/render-service/frames'
import type { Listenelement } from '../../src/shared/contracts/project'
import type { RenderItem } from '../../src/shared/contracts/render-request'

// #435: die Unterbrechungen verlaengern die Elementdauer. UND die Gegenprobe zur Zusage
// "EINE Regel, zwei Orte" (TK 9.2.6): die Liste (`composer/gesamtlaenge.ts`) und der
// render-service (Summe ueber die zerlegten Items, `frames.ts`) muessen DIESELBE Frame-Zahl
// liefern. Die Teleskop-Summe der Teil-Clips macht das strukturell wahr.

function video(trimStart: number, trimEnde: number, unterbrechungen: Listenelement['unterbrechungen']): Listenelement {
  return {
    id: 'e-video',
    art: 'video',
    ref: 'a-video',
    dauer: null,
    trimStart,
    trimEnde,
    einblendung: null,
    unterbrechungen,
  }
}

/** Die Items, die `render-ausloesen.ts` aus dem zerlegten Video baut - ohne PNGs, die zaehlen nicht. */
function itemsAus(trimStart: number, trimEnde: number, unterbrechungen: NonNullable<Listenelement['unterbrechungen']>): RenderItem[] {
  return zerlegeVideo(trimStart, trimEnde, unterbrechungen).map((stueck) =>
    stueck.art === 'video'
      ? { id: 'e-video', art: 'video' as const, medienRef: 'm.mp4', trimStart: stueck.trimStart, trimEnde: stueck.trimEnde, einblendung: null }
      : { id: 'e-video', art: 'segment' as const, png: new Uint8Array(), dauer: stueck.dauer },
  )
}

describe('Elementdauer mit Unterbrechungen (#435)', () => {
  it('ohne Unterbrechungen: nur der Trim (10 s = 300 Frames)', () => {
    const ergebnis = frameDauer(video(2, 12, []))
    expect(ergebnis.ok && ergebnis.wert).toBe(300)
  })

  it('mit Unterbrechungen: Video-Frames + Einschub-Frames', () => {
    const element = video(2, 12, [
      { zeitstelle: 3, aktionRef: 'a', dauer: 5 },
      { zeitstelle: 7, aktionRef: 'b', dauer: 4 },
    ])
    const ergebnis = frameDauer(element)
    // 300 (Video) + 150 + 120 = 570
    expect(ergebnis.ok && ergebnis.wert).toBe(570)
  })

  it('"EINE Regel, zwei Orte": Liste und render-service stimmen ueberein', () => {
    const unterbrechungen = [
      { zeitstelle: 3, aktionRef: 'a', dauer: 5 },
      { zeitstelle: 7, aktionRef: 'b', dauer: 4 },
    ]
    const listeFrames = frameDauer(video(2, 12, unterbrechungen))
    const renderFrames = gesamtFrames(itemsAus(2, 12, unterbrechungen))

    expect(listeFrames.ok).toBe(true)
    expect(renderFrames.ok).toBe(true)
    expect(listeFrames.ok && listeFrames.wert).toBe(renderFrames.ok && renderFrames.wert)
  })

  it('eine unbrauchbare Einschub-Dauer ist ein kaputtes Element', () => {
    const element = video(2, 12, [{ zeitstelle: 3, aktionRef: 'a', dauer: 0 }])
    const ergebnis = frameDauer(element)
    expect(ergebnis.ok).toBe(false)
  })
})
