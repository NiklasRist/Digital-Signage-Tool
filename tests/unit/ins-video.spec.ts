// Tests zu „Ins Video" (02.11.2026) - ins-video.ts, die REINE Fachlichkeit des Klicks.
//
// Festgenagelt wird die Entscheidung, die der Knopf trifft:
//  1. Die FORM der Aktion entscheidet den Weg: Vorlage MIT Hoehe -> Band,
//     Vorlage OHNE Hoehe (und UNBEKANNTE Vorlage) -> Unterbrechung.
//  2. Ein bestehendes Band behaelt seine Vorlage (TK 9.2.8: eine pro Einblendung).
//     Ohne Band entscheidet `band-standard`, sonst die erste waehlbare - nie eine
//     Arbeitskopie, nie eine erfundene Kennung.
//  3. Die Abspielmarke (projektweite Frames) wird zur Videozeit: Block finden,
//     Unterbrechungen herausrechnen, in das offene Intervall klemmen. Steht die
//     Marke nicht in einem Video, kommt `null` - es wird nichts erfunden.
import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Listenelement } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import {
  STANDARD_BAND_VORLAGE_ID,
  entwurfMitNeuerAktion,
  istBandAktion,
  videostelleAusAbspielmarke,
  waehleBandVorlageId,
} from '../../src/renderer/composer/ins-video'

const FPS = RENDER_PROFILE.fps
const EIN_FRAME = 1 / FPS

function vorlage(id: string, hoehe: number | null, ueber: Partial<Vorlage> = {}): Vorlage {
  return { id, name: id, höhe: hoehe, parent: null, eingebaut: false, zonen: [], ...ueber }
}

function video(
  id: string,
  trimStart: number,
  trimEnde: number,
  ueber: Partial<Listenelement> = {},
): Listenelement {
  return {
    id,
    art: 'video',
    ref: 'asset-1',
    dauer: null,
    trimStart,
    trimEnde,
    einblendung: null,
    unterbrechungen: [],
    ...ueber,
  }
}

function segment(id: string, dauer: number): Listenelement {
  return {
    id,
    art: 'segment',
    ref: 'akt-0',
    dauer,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
    unterbrechungen: [],
  }
}

function aktion(vorlagenId: string): Aktion {
  return {
    id: 'akt-1',
    titel: 'Aktion',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: 5,
    markeId: 'm1',
    vorlagenId,
    akzentfarbe: null,
  }
}

describe('istBandAktion', () => {
  it('eine Vorlage MIT Hoehe ist ein Band', () => {
    expect(istBandAktion(aktion('band-standard'), [vorlage('band-standard', 162)])).toBe(true)
  })

  it('eine Vorlage OHNE Hoehe ist ein Ganzbild - also keine Band-Aktion', () => {
    expect(istBandAktion(aktion('vollbild'), [vorlage('vollbild', null)])).toBe(false)
  })

  it('eine UNBEKANNTE Vorlage gilt als Ganzbild (kein erfundener Bandabschnitt)', () => {
    expect(istBandAktion(aktion('geloescht'), [vorlage('vollbild', null)])).toBe(false)
    expect(istBandAktion(aktion('geloescht'), [])).toBe(false)
  })
})

describe('waehleBandVorlageId', () => {
  it('ein BESTEHENDES Band behaelt seine Vorlage - auch wenn sie nicht mehr in der Liste steht', () => {
    const element = video('video-1', 0, 10, {
      einblendung: { bandVorlageId: 'eigene-1', abschnitte: [{ aktionRef: 'akt-9', dauer: 2 }] },
    })
    expect(waehleBandVorlageId(element, [vorlage('band-standard', 162)])).toBe('eigene-1')
  })

  it('ohne Band gewinnt die eingebaute band-standard', () => {
    const element = video('video-1', 0, 10)
    expect(
      waehleBandVorlageId(element, [vorlage('eigene-2', 120), vorlage('band-standard', 162)]),
    ).toBe(STANDARD_BAND_VORLAGE_ID)
  })

  it('ohne band-standard die ERSTE waehlbare - Reihenfolge wird nicht umsortiert', () => {
    const element = video('video-1', 0, 10)
    expect(waehleBandVorlageId(element, [vorlage('b', 120), vorlage('a', 162)])).toBe('b')
  })

  it('Arbeitskopien (parent != null) und Ganzbilder sind keine Band-Vorlage', () => {
    const element = video('video-1', 0, 10)
    expect(
      waehleBandVorlageId(element, [
        vorlage('kopie', 162, { parent: 'band-standard' }),
        vorlage('vollbild', null),
      ]),
    ).toBeNull()
    expect(waehleBandVorlageId(element, [])).toBeNull()
  })
})

describe('entwurfMitNeuerAktion', () => {
  it('haengt den Abschnitt ans ENDE der Folge (Reihenfolge = Abspielreihenfolge)', () => {
    const element = video('video-1', 0, 10, {
      einblendung: {
        bandVorlageId: 'band-standard',
        abschnitte: [{ aktionRef: 'akt-1', dauer: 2 }],
      },
    })
    const entwurf = entwurfMitNeuerAktion(element, 'egal', 'akt-2', 3)
    expect(entwurf.bandVorlageId).toBe('band-standard')
    expect(entwurf.abschnitte).toEqual([
      { aktionRef: 'akt-1', dauer: 2 },
      { aktionRef: 'akt-2', dauer: 3 },
    ])
  })

  it('ohne bestehendes Band entsteht der erste Abschnitt mit der gewaehlten Vorlage', () => {
    const entwurf = entwurfMitNeuerAktion(video('video-1', 0, 10), 'band-standard', 'akt-1', 5)
    expect(entwurf).toEqual({
      bandVorlageId: 'band-standard',
      abschnitte: [{ aktionRef: 'akt-1', dauer: 5 }],
    })
  })

  it('laesst den Vorzustand unberuehrt (Undo braucht ihn unveraendert)', () => {
    const abschnitte = [{ aktionRef: 'akt-1', dauer: 2 }]
    const element = video('video-1', 0, 10, {
      einblendung: { bandVorlageId: 'band-standard', abschnitte },
    })
    entwurfMitNeuerAktion(element, 'band-standard', 'akt-2', 3)
    expect(abschnitte).toEqual([{ aktionRef: 'akt-1', dauer: 2 }])
    expect(element.einblendung?.abschnitte).toBe(abschnitte)
  })
})

describe('videostelleAusAbspielmarke', () => {
  it('Frame 0 wird auf das ERSTE Bild geklemmt - 0 liegt nicht im offenen Intervall', () => {
    const stelle = videostelleAusAbspielmarke([video('video-1', 0, 10)], 0)
    expect(stelle?.elementId).toBe('video-1')
    expect(stelle?.zeitSekunden).toBeCloseTo(EIN_FRAME, 10)
  })

  it('die Marke wird zur gleichen Sekunde im Video', () => {
    const stelle = videostelleAusAbspielmarke([video('video-1', 0, 10)], 3 * FPS)
    expect(stelle?.zeitSekunden).toBeCloseTo(3, 10)
  })

  it('ein Element VOR dem Video verschiebt die Rechnung (Kante zaehlt mit)', () => {
    const liste = [segment('seg-1', 3), video('video-1', 0, 10)]
    // 4 s im Projekt = 1 s in den Video-Block.
    const stelle = videostelleAusAbspielmarke(liste, 4 * FPS)
    expect(stelle?.elementId).toBe('video-1')
    expect(stelle?.zeitSekunden).toBeCloseTo(1, 10)
  })

  it('IN einer Unterbrechung steht das Video still - die Zeitstelle der Unterbrechung kommt zurueck', () => {
    const liste = [
      video('video-1', 0, 10, {
        unterbrechungen: [{ zeitstelle: 4, aktionRef: 'akt-2', dauer: 2 }],
      }),
    ]
    // 5 s im Block liegen in der Unterbrechung [4 s, 6 s).
    expect(videostelleAusAbspielmarke(liste, 5 * FPS)?.zeitSekunden).toBeCloseTo(4, 10)
  })

  it('NACH einer Unterbrechung wird ihre Dauer herausgerechnet', () => {
    const liste = [
      video('video-1', 0, 10, {
        unterbrechungen: [{ zeitstelle: 4, aktionRef: 'akt-2', dauer: 2 }],
      }),
    ]
    // 7 s im Block = 4 s Video + 2 s Einschub + 1 s Video.
    expect(videostelleAusAbspielmarke(liste, 7 * FPS)?.zeitSekunden).toBeCloseTo(5, 10)
  })

  it('steht die Marke in einem eigenstaendigen Aktions-Block, kommt null', () => {
    const liste = [segment('seg-1', 3), video('video-1', 0, 10)]
    expect(videostelleAusAbspielmarke(liste, 1 * FPS)).toBeNull()
  })

  it('auch ein Segment, das von Hand Trim-Werte traegt, ist kein Video', () => {
    // Der Vertrag gibt einem Segment `trimStart/trimEnde = null` (TK 9.11.3). Eine von
    // Hand veraenderte project.json kann trotzdem Zahlen tragen - dann liefert
    // `videoSekunden` eine brauchbare Dauer, und NUR die Art entscheidet noch. Ohne
    // diesen Fall war die Pruefung `art !== 'video'` durch die Fixture verdeckt.
    const liste: Listenelement[] = [
      { ...segment('seg-1', 3), trimStart: 0, trimEnde: 10 },
      video('video-1', 0, 10),
    ]
    expect(videostelleAusAbspielmarke(liste, 1 * FPS)).toBeNull()
  })

  it('das Listenende gehoert zum LETZTEN Block (kein Ueberlauf)', () => {
    const stelle = videostelleAusAbspielmarke([video('video-1', 0, 10)], 10_000)
    expect(stelle?.zeitSekunden).toBeCloseTo(10 - EIN_FRAME, 10)
  })

  it('unbrauchbare Marken liefern null', () => {
    const liste = [video('video-1', 0, 10)]
    expect(videostelleAusAbspielmarke(liste, -1)).toBeNull()
    expect(videostelleAusAbspielmarke(liste, 1.5)).toBeNull()
    expect(videostelleAusAbspielmarke(liste, Number.NaN)).toBeNull()
    expect(videostelleAusAbspielmarke([], 0)).toBeNull()
  })

  it('ein kaputtes Element macht die Rechnung unbrauchbar - keine "ungefaehre" Stelle', () => {
    const liste = [video('video-1', 0, 10), segment('seg-1', 0)]
    expect(videostelleAusAbspielmarke(liste, 1 * FPS)).toBeNull()
  })

  it('ein Video mit unbrauchbaren Trim-Grenzen liefert null', () => {
    const liste = [video('video-1', 5, 5)]
    expect(videostelleAusAbspielmarke(liste, 1 * FPS)).toBeNull()
  })
})
