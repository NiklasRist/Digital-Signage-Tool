// Tests zu #217 - segment-quelle.ts (REINE Auswahl, ohne Browser).
//
// Kern-Nachweise: die PRUEFREIHENFOLGE (ENTSCHIEDEN 2 - aktion_unbekannt und
// vorlage_unbekannt schlagen die Schriften-Pruefung), die IDENTITAET der
// Treffer (genau die Objekte aus den Listen) und die Unveraenderlichkeit der
// uebergebenen Listen (Object.freeze).
import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { findeSegmentquelle } from '../../src/renderer/preview-player/segment-quelle'

function aktion(id: string, vorlagenId: string): Aktion {
  return {
    id, titel: `Aktion ${id}`, beschreibung: null, preis: null, bildRef: null,
    cta: null, standardDauer: null, vorlagenId, markeId: 'm1', akzentfarbe: null,
  }
}

function vorlage(id: string, art: Vorlage['art'], hoehe: number | null): Vorlage {
  return { id, name: id, art, höhe: hoehe, parent: null, eingebaut: false, zonen: [] }
}

describe('findeSegmentquelle – die PRUEFREIHENFOLGE (ENTSCHIEDEN 2)', () => {
  it('bereit: genau die Treffer-Objekte aus den Listen (Identitaet, nicht Kopie)', () => {
    const dieAktion = aktion('a-1', 'v-1')
    const dieVorlage = vorlage('v-1', 'vollflaeche', null)
    const quelle = findeSegmentquelle('a-1', [dieAktion], [dieVorlage], true)
    expect(quelle.zustand).toBe('bereit')
    expect((quelle as { aktion: Aktion }).aktion).toBe(dieAktion)
    expect((quelle as { vorlage: Vorlage }).vorlage).toBe(dieVorlage)
  })

  it('aktion_unbekannt schlagt die Schriften-Pruefung (selbst bei schriftenBereit: false)', () => {
    const quelle = findeSegmentquelle('fehlt', [aktion('a-1', 'v-1')], [], false)
    expect(quelle).toEqual({ zustand: 'aktion_unbekannt', aktionId: 'fehlt' })
  })

  it('vorlage_unbekannt schlagt die Schriften-Pruefung ebenso', () => {
    const quelle = findeSegmentquelle('a-1', [aktion('a-1', 'fehlt')], [vorlage('v-1', 'split', 210)], false)
    expect(quelle).toEqual({ zustand: 'vorlage_unbekannt', vorlagenId: 'fehlt' })
  })

  it('schriften_fehlen: erst, wenn Aktion und Vorlage beide gefunden sind', () => {
    const quelle = findeSegmentquelle(
      'a-1',
      [aktion('a-1', 'v-1')],
      [vorlage('v-1', 'vollflaeche', null)],
      false,
    )
    expect(quelle).toEqual({ zustand: 'schriften_fehlen' })
  })

  it('leere Listen: aktion_unbekannt, ohne Wurf', () => {
    expect(findeSegmentquelle('a-1', [], [], false).zustand).toBe('aktion_unbekannt')
  })
})

describe('rein und total', () => {
  it('die uebergebenen Listen bleiben unverendert (Object.freeze, kein Wurf)', () => {
    const aktionenFest = Object.freeze([aktion('a-1', 'v-1')])
    const vorlagenFest = Object.freeze([vorlage('v-1', 'vollflaeche', null)])
    const vorher = JSON.stringify(aktionenFest) + JSON.stringify(vorlagenFest)
    expect(() => findeSegmentquelle('a-1', aktionenFest, vorlagenFest, true)).not.toThrow()
    const nachher = JSON.stringify(aktionenFest) + JSON.stringify(vorlagenFest)
    expect(nachher).toBe(vorher)
  })
})
