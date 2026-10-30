// Tests zu #219 / M9-3 (#452) - einblendung-stile.ts: die Bandlage ueber dem Vollbild.
//
// Seit TK v3.31 gibt es keine geteilte Bandgeometrie mehr: Das Video bleibt
// vollflaechig 1920 x 1080, das Band (1920 x H) liegt DECKEND am unteren Rand. Die
// einzige Rechnung ist y = 1080 - H; sie wird hier gegen RENDER_PROFILE geprueft,
// nicht gegen eine abgeschriebene 1080.
import { describe, expect, it } from 'vitest'

import { baueEinblendungStile } from '../../src/renderer/preview-player/einblendung-stile'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

describe('baueEinblendungStile (#219, v3.31)', () => {
  it('setzt die Bandkante auf 1080 − H, die Hoehe auf H und die Breite auf das Profil', () => {
    expect(baueEinblendungStile(162)).toEqual({
      bandY: RENDER_PROFILE.hoehe - 162,
      bandHöhe: 162,
      bandBreite: RENDER_PROFILE.breite,
    })
  })

  it('gilt fuer JEDE Hoehe - auch fuer eine, die frueher nicht glatt aufging', () => {
    // 204 x 16/9 geht nicht glatt auf; das war nur fuer die gestrichene Split-Geometrie
    // von Bedeutung. Fuer die Bandkante zaehlt allein die Subtraktion.
    expect(baueEinblendungStile(204).bandY).toBe(RENDER_PROFILE.hoehe - 204)
    expect(baueEinblendungStile(204).bandHöhe).toBe(204)
  })

  it('ist total: wirft auch bei 0 oder negativen Werten nicht', () => {
    expect(() => baueEinblendungStile(0)).not.toThrow()
    expect(() => baueEinblendungStile(-10)).not.toThrow()
  })
})
