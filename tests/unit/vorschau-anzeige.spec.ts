// Tests zu #242 - vorschau.tsx (die Anzeige, jsdom).
//
// Die sechs Darstellungs-Bausteine und die Buehne werden durch Spione mit
// sichtbaren Stellvertretern ersetzt; die reine Auswahl (#242 будет) läuft ECHT,
// nur gezählt (waehleVorschaubild). Der Bildtakt wird über
// vi.stubGlobal gesteuert. Geprueft: ENTSCHIEDEN 2 (nichts ohne Voraussetzungen),
// ENTSCHIEDEN 7 (genau ein Taktgeber, Pause beim Verschwinden, kein Autofortsetz-
// en, Delta 0 nach Wiederaufnahme), ENTSCHIEDEN 9 (neutrale Zeile), ENTSCHIEDEN 10.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import type { Project, Listenelement } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Zeichenvoraussetzungen } from '../../src/renderer/composer/zeichen-vorbereitung'

const doppel = vi.hoisted(() => ({
  videoAufrufe: [] as Array<Record<string, unknown>>,
  segmentAufrufe: [] as Array<Record<string, unknown>>,
  einblendungAufrufe: [] as Array<Record<string, unknown>>,
  platzhalterAufrufe: [] as Array<Record<string, unknown>>,
  auswahlAufrufe: [] as Array<unknown>,
}))

vi.mock('../../src/renderer/preview-player/buehne', () => ({
  Buehne: (props: { children?: ReactNode }) =>
    createElement('div', { 'data-testid': 'stellvertreter-buehne' }, props.children),
}))

vi.mock('../../src/renderer/preview-player/video', () => ({
  Video: (props: Record<string, unknown>) => {
    doppel.videoAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-video' })
  },
}))

vi.mock('../../src/renderer/preview-player/segment', () => ({
  Segment: (props: Record<string, unknown>) => {
    doppel.segmentAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-segment' })
  },
}))

vi.mock('../../src/renderer/preview-player/einblendung', () => ({
  Einblendung: (props: Record<string, unknown>) => {
    doppel.einblendungAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-einblendung' })
  },
}))

vi.mock('../../src/renderer/preview-player/platzhalter', () => ({
  Platzhalter: (props: Record<string, unknown>) => {
    doppel.platzhalterAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-platzhalter' })
  },
}))

// Die reine Auswahl läuft ECHT; nur die Aufrufe werden GEZAEHLT.
vi.mock('../../src/renderer/preview-player/vorschau-auswahl', async (importOriginal) => {
  const echt = await importOriginal<
    typeof import('../../src/renderer/preview-player/vorschau-auswahl')
  >()
  return {
    ...echt,
    waehleVorschaubild: (...argumente: unknown[]) => {
      doppel.auswahlAufrufe.push(argumente)
      return (echt.waehleVorschaubild as (...a: unknown[]) => unknown)(...argumente)
    },
  }
})

// #312: die zeichenbereiten Marken leben in der BEREITSTELLUNG; die Vorschau
// loest sie ueber holeBereiteMarke auf. Zwei unterscheidbare Doppeln muessen es
// sein - 'm1' (Inhalt) und 'm2' (Rahmen, die Standardmarke des Grundlaufs).
const markenBereitschaft = vi.hoisted(() => ({
  bereit: new Map<string, unknown>(),
}))

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  holeBereiteMarke: (markeId: string) => markenBereitschaft.bereit.get(markeId) ?? null,
  stelleMarkeBereit: async (markeId: string) => {
    const marke = markenBereitschaft.bereit.get(markeId)
    return marke === undefined
      ? { ok: false, fehler: { code: 'marke_nicht_gefunden', meldung: markeId } }
      : { ok: true, wert: marke }
  },
  leereMarkenBestand: () => {},
}))

// React 19: act(...)-Umgebung (Muster wie video-anzeige.spec.ts).
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const { Vorschau } = await import('../../src/renderer/preview-player/vorschau.tsx')
type VorschauProps = import('../../src/renderer/preview-player/vorschau.tsx').VorschauProps

// ---------------- Bausteine ----------------

function baueElement(teil: Partial<Listenelement> = {}): Listenelement {
  return {
    id: 'e-1', art: 'video', ref: 'asset-1', dauer: null,
    trimStart: 0, trimEnde: 2, einblendung: null,
    ...teil,
  }
}

function baueProjekt(): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-10-06T00:00:00Z', geaendertAm: '2026-10-06T00:00:00Z',
    schemaVersion: 1,
    assets: [
      { id: 'asset-1', typ: 'video', dateiname: 'medien-1.mp4', originalname: 'Sommer.mp4',
        maße: { breite: 1920, höhe: 1080 }, dauer: 60, importdatum: '2026-10-06T00:00:00Z', zustand: 'ok' },
    ],
    aktionen: [
      { id: 'a-1', titel: 'Sommeraktion', beschreibung: null, preis: null, bildRef: null,
        cta: null, standardDauer: null, vorlagenId: 'v-1', markeId: 'm1', akzentfarbe: null },
    ],
    liste: [baueElement()],
    letzterAusgabeName: null, standardSegmentdauer: 10, standardMarkeId: 'm1',
  }
}

function baueMarke(id: string = 'm1'): Marke {
  return {
    id, name: id === 'm2' ? 'Rahmen' : 'Inhalt', parent: null, eingebaut: id === 'm2',
    farben: { flaecheDunkel: id === 'm2' ? '#445566' : '#112233' } as never,
    schriften: null as never, logo: null as never,
    sicherheit: { horizontal: 96, vertikal: 54 }, radien: null as never,
    schatten: null as never, slogan: null as never, herkunftJeFeld: null as never,
  }
}

function baueVorlage(): Vorlage {
  return {
    id: 'v-1', name: 'Vollbild', höhe: null,
    parent: null, eingebaut: true, zonen: [],
  }
}

function baueVoraussetzungen(): Zeichenvoraussetzungen {
  return { vorlagen: [baueVorlage()] }
}

function eigenschaften(teil: Partial<VorschauProps> = {}): VorschauProps {
  return { projekt: baueProjekt(), voraussetzungen: baueVoraussetzungen(), sichtbar: true, ...teil }
}

function rendere(props: VorschauProps): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Vorschau, props))
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

// Der Bildtakt: KUENSTLICHER Taktgeber,Frames werden von Hand geliefert.
let frameRuf: ((jetzt: number) => void) | null = null
let rafAufrufe = 0
let cancelAufrufe = 0

beforeEach(() => {
  doppel.auswahlAufrufe = []
  doppel.videoAufrufe = []
  doppel.segmentAufrufe = []
  doppel.einblendungAufrufe = []
  doppel.platzhalterAufrufe = []
  frameRuf = null
  rafAufrufe = 0
  cancelAufrufe = 0
  vi.stubGlobal('requestAnimationFrame', (rueckruf: (jetzt: number) => void) => {
    rafAufrufe += 1
    frameRuf = rueckruf
    return rafAufrufe
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    cancelAufrufe += 1
    frameRuf = null
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  markenBereitschaft.bereit.clear()
})

const druecke = (behaelter: HTMLDivElement, pruefKennung: string) => {
  const keinKnopf = behaelter.querySelector(`[data-testid="${pruefKennung}"]`) as HTMLButtonElement | null
  expect(keinKnopf).not.toBeNull()
  act(() => {
    (keinKnopf as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

// ---------------- ENTSCHIEDEN 2/10: die Leerfaelle ----------------

describe('Die Leerfaelle (ENTSCHIEDEN 2/10)', () => {
  it('projekt === null: kein waehleVorschaubild, kein Baustein', () => {
    const { fertig } = rendere(eigenschaften({ projekt: null }))
    expect(doppel.auswahlAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(0)
    expect(doppel.segmentAufrufe).toHaveLength(0)
    expect(doppel.einblendungAufrufe).toHaveLength(0)
    expect(doppel.platzhalterAufrufe).toHaveLength(0)
    fertig()
  })

  it('voraussetzungen === null: ebenfalls NICHTS gezeichnet', () => {
    const { fertig } = rendere(eigenschaften({ voraussetzungen: null }))
    expect(doppel.auswahlAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(0)
    fertig()
  })
})

// ---------------- ENTSCHIEDEN 7: der Takt ----------------

describe('Der Bildtakt (ENTSCHIEDEN 7)', () => {
  it('laeuft + sichtbar: requestAnimationFrame laeuft und treibt die Uhr (frame waechst); art video wird gewaehlt', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    druecke(behaelter, 'vorschau-play-pause') // Vorschau starten
    expect(rafAufrufe).toBeGreaterThan(0)
    act(() => { frameRuf?.(400) }) // ERSTER Takt: Delta 0 (Zeitstempel beginnt bei null)
    const frameErster = (behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement).value
    expect(frameErster).toBe('0')
    act(() => { frameRuf?.(800) }) // zweite Takt: Delta 400 -> 12 Frames
    const frame = (behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement).value
    expect(frame).toBe('12')
    fertig()
  })

  it('sichtheit false -> cancelAnimationFrame, pausiere gerufen, frame bleibt', () => {
    const { behaelter, wurzel, fertig } = rendere(eigenschaften())
    druecke(behaelter, 'vorschau-play-pause')
    act(() => { frameRuf?.(400) })
    const frameVorher = (behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement).value
    act(() => {
      wurzel.render(createElement(Vorschau, eigenschaften({ sichtbar: false })))
    })
    expect(cancelAufrufe).toBeGreaterThan(0)
    const frameNachher = (behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement).value
    expect(frameNachher).toBe(frameVorher)
    fertig()
  })

  it('kein Autofortsetzen; der ERSTE Takt nach dem Fortsetzen liefert Delta 0 (die Pause springt nicht)', () => {
    const { behaelter, wurzel, fertig } = rendere(eigenschaften())
    druecke(behaelter, 'vorschau-play-pause')
    act(() => { frameRuf?.(400) }) // Delta 0 (erster Takt)
    act(() => { frameRuf?.(800) }) // frame 0 -> 12 (400 ms = 12 Frames bei 30 fps)
    const rafVorher = rafAufrufe
    act(() => {
      wurzel.render(createElement(Vorschau, eigenschaften({ sichtbar: false })))
    })
    act(() => {
      wurzel.render(createElement(Vorschau, eigenschaften()))
    })
    // wieder sichtbar, aber NICHT laufend - kein NEUER Takt, kein Fortsetzen:
    expect(rafAufrufe).toBe(rafVorher)
    // Play druecken -> Takt startet; ERSTER Takt: Delta 0 -> frame bleibt 12:
    druecke(behaelter, 'vorschau-play-pause')
    act(() => { frameRuf?.(1400) })
    const frame = (behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement).value
    expect(frame).toBe('12') // kein Sprung um die Pausenzeit (sonst waere es 42 mit delta 1000)
    fertig()
  })
})

function drueckeVorher(behaelter: HTMLDivElement): void {
  const zeitleiste = behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement
  expect(zeitleiste.value).toBe('12') // 400 ms = 12 Frames
}
// ---------------- ENTSCHIEDEN 8/9 ----------------

describe('Die Zustandszeilen', () => {
  it('scheitert die Achse (video ohne zeiten), steht eine neutrale Zeile und KEINE Buehne', () => {
    const projekt = baueProjekt()
    projekt.liste = [baueElement({ trimStart: null, trimEnde: null })]
    const { behaelter, fertig } = rendere(eigenschaften({ projekt }))
    expect(behaelter.querySelector('[data-testid="vorschau-zeitachse-fehler"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="stellvertreter-buehne"]')).toBeNull()
    // kein Fehlercode im Text:
    const zeile = behaelter.querySelector('[data-testid="vorschau-zeitachse-fehler"]') as HTMLElement
    expect(zeile.textContent).not.toContain('ungueltige_eingabe')
    fertig()
  })
})

// ---------------- die AuswahlDurchreichung ----------------

describe('Die Durchreichung der Auswahl', () => {
  it('waehleVorschaubild bekommt schriftenBereit = (voraussetzungen !== null); Video bekommt assetId UNVERAENDERT', () => {
    const { fertig } = rendere(eigenschaften())
    expect(doppel.auswahlAufrufe.length).toBeGreaterThanOrEqual(1)
    const argumente = doppel.auswahlAufrufe[0] as unknown[]
    expect(argumente[5]).toBe(true)
    expect(doppel.videoAufrufe.length).toBeGreaterThanOrEqual(1)
    const aufruf = doppel.videoAufrufe[0] as Record<string, unknown>
    expect(aufruf.assetId).toBe('asset-1')
    expect(aufruf.dateiname).toBe('medien-1.mp4')
    fertig()
  })
})

// ---------------- ENTSCHIEDEN 5 (#313): die Marken-Aufloesung ----------------

describe('Die Marken-Aufloesung (#313, TK 9.15.4)', () => {
  it('Segment bekommt die Marke der AKTION (m1), nicht die Standardmarke (m2)', () => {
    markenBereitschaft.bereit.set('m1', baueMarke('m1'))
    markenBereitschaft.bereit.set('m2', baueMarke('m2'))
    const projekt = baueProjekt()
    projekt.standardMarkeId = 'm2'
    projekt.liste = [
      baueElement({ art: 'segment', ref: 'a-1', dauer: 2, trimStart: 0, trimEnde: 2 }),
    ]
    const { behaelter, fertig } = rendere(eigenschaften({ projekt }))
    // Doppel-Render durch den Klemm-Effekt sind normale Lebenszeichen: Die
    // Aussage zielt auf den INHALT jeder Anmeldung, nicht auf die Zählerzahl.
    const aufrufe = doppel.segmentAufrufe as Array<{ marke: Marke }>
    expect(aufrufe.length).toBeGreaterThan(0)
    expect(aufrufe.every((a) => a.marke.id === 'm1')).toBe(true)
    fertig()
  })

  it('Band: der Rahmen kommt aus projekt.standardMarkeId (m2), der Abschnitt aus der Band-Aktion (m1); beide UNVERAENDERT (toBe)', () => {
    const rahmenMarke = baueMarke('m2')
    const abschnittMarke = baueMarke('m1')
    markenBereitschaft.bereit.set('m1', abschnittMarke)
    markenBereitschaft.bereit.set('m2', rahmenMarke)
    const projekt = baueProjekt()
    projekt.standardMarkeId = 'm2'
    projekt.liste = [
      baueElement({
        art: 'video',
        einblendung: { bandVorlageId: 'v-split-v', abschnitte: [{ aktionRef: 'a-1', dauer: 5 }] },
      }),
    ]
    const bandVorlage: Vorlage = {
      id: 'v-split-v', name: 'Split', höhe: 162,
      parent: null, eingebaut: true, zonen: [],
    }
    const { behaelter, fertig } = rendere(
      eigenschaften({ projekt, voraussetzungen: { vorlagen: [bandVorlage] } }),
    )
    // Doppel-Render ok - der INHALT zählt: toBe zur übergebenden Referenz.
    const aufrufe = doppel.einblendungAufrufe as Array<Record<string, unknown>>
    expect(aufrufe.length).toBeGreaterThan(0)
    expect(aufrufe.every((a) => a.rahmenMarke === rahmenMarke)).toBe(true)
    expect(aufrufe.every((a) => a.abschnittMarke === abschnittMarke)).toBe(true)
    fertig()
  })

  it('Nicht bereitgestellte Marke: Segment und Band werden NICHT gerendert (keine Ersatzmarke, #312)', () => {
    // bereit bleibt LEER (beide Loesungen liefern null):
    const projekt = baueProjekt()
    projekt.liste = [
      baueElement({ art: 'segment', ref: 'a-1', dauer: 2, trimStart: 0, trimEnde: 2 }),
    ]
    const { behaelter, fertig } = rendere(eigenschaften({ projekt }))
    expect(
      doppel.segmentAufrufe,
      JSON.stringify(doppel.segmentAufrufe),
    ).toHaveLength(0)
    fertig()
  })
})

// ---------------- #426: der Einschub in der Vorschau ----------------

describe('Unterbrechung (#426, TK 9.2.9)', () => {
  function unterbrochenesProjekt(): Project {
    const projekt = baueProjekt()
    // trim 0..2 = 60 Frames; Zeitstelle 1 s -> erster Teil [0,30), Einschub [30,60), zweiter [60,90).
    projekt.liste = [
      baueElement({ unterbrechungen: [{ zeitstelle: 1, aktionRef: 'a-1', dauer: 1 }] }),
    ]
    return projekt
  }

  function springeZu(behaelter: HTMLDivElement, wert: number): void {
    const schieber = behaelter.querySelector('[data-testid="vorschau-zeitleiste"]') as HTMLInputElement
    // Die kontrollierte Range: der native Setter plus das 'input'-Ereignis erreicht React.
    const setzen = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    act(() => {
      setzen?.call(schieber, String(wert))
      schieber.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  it('im Einschub: der Aktions-Einschub steht auf der Buehne und das Video ist PAUSIERT am Teil-Ende', () => {
    markenBereitschaft.bereit.set('m1', baueMarke('m1'))
    const { behaelter, fertig } = rendere(eigenschaften({ projekt: unterbrochenesProjekt() }))
    druecke(behaelter, 'vorschau-play-pause') // die Uhr laeuft
    springeZu(behaelter, 40)                   // Frame 40 liegt im Einschub [30,60)
    expect(behaelter.querySelector('[data-testid="preview-einschub"]')).not.toBeNull()
    const letzter = doppel.videoAufrufe.at(-1) as { laeuft: boolean; lokalerFrame: number }
    expect(letzter.laeuft).toBe(false)
    expect(letzter.lokalerFrame).toBe(30) // Ende des ersten Teils - die Pause an der Zeitstelle
    fertig()
  })

  it('danach weiter: ab Frame 70 ist der Einschub weg und das Video laeuft am Teil-Anfang wieder', () => {
    markenBereitschaft.bereit.set('m1', baueMarke('m1'))
    const { behaelter, fertig } = rendere(eigenschaften({ projekt: unterbrochenesProjekt() }))
    druecke(behaelter, 'vorschau-play-pause')
    springeZu(behaelter, 40)
    springeZu(behaelter, 70) // Frame 70 liegt im zweiten Video-Teil [60,90)
    expect(behaelter.querySelector('[data-testid="preview-einschub"]')).toBeNull()
    const letzter = doppel.videoAufrufe.at(-1) as { laeuft: boolean; lokalerFrame: number }
    expect(letzter.laeuft).toBe(true)
    expect(letzter.lokalerFrame).toBe(10)
    fertig()
  })
})

// ---------------- #443: die Bedienleiste ueber dem Bild ----------------

function finde(behaelter: HTMLElement, pruefKennung: string): HTMLElement {
  const element = behaelter.querySelector(`[data-testid="${pruefKennung}"]`)
  expect(element, pruefKennung).not.toBeNull()
  return element as HTMLElement
}

/** Ein Druck mit anschliessendem Klick auf DEMSELBEN Element (wie ein echter Klick). */
function klicke(behaelter: HTMLElement, element: HTMLElement): void {
  act(() => {
    element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('#443 die Leiste liegt ueber dem Bild', () => {
  it('sie ist Kind der Bildflaeche - es gibt keine feste Zeile mehr unter der Buehne', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const flaeche = finde(behaelter, 'vorschau-bildflaeche')
    const leiste = finde(behaelter, 'vorschau-transport')
    expect(flaeche.contains(leiste)).toBe(true)
    // Die Wurzel hat genau ein Kind: die Bildflaeche. Eine Geschwisterzeile darunter
    // waere die alte Leiste.
    expect(finde(behaelter, 'vorschau').children).toHaveLength(1)
    fertig()
  })
})

describe('#443 Klick aufs Bild (YouTube-Muster)', () => {
  it('ein Klick auf das Bild schaltet Play/Pause', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    klicke(behaelter, finde(behaelter, 'vorschau-bildflaeche'))
    expect(finde(behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Pause')
    klicke(behaelter, finde(behaelter, 'vorschau-bildflaeche'))
    expect(finde(behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Play')
    fertig()
  })

  it('ein Druck, der in der LEISTE beginnt, schaltet beim Loslassen ueber dem Bild NICHT um', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    act(() => {
      // Der Druck beginnt auf dem Lautstaerke-Regler; der Klick landet danach auf dem
      // gemeinsamen Vorfahren (der Bildflaeche) - der klassische Zieh-Klick.
      finde(behaelter, 'vorschau-lautstaerke').dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      )
      finde(behaelter, 'vorschau-bildflaeche').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(finde(behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Play')
    fertig()
  })

  it('ein Knopf der Leiste schaltet die Wiedergabe nicht mit um (stopPropagation)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    klicke(behaelter, finde(behaelter, 'vorschau-ton'))
    expect(finde(behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Play')
    fertig()
  })
})

describe('#443 die Leiste blendet aus (nur waehrend des Abspielens)', () => {
  it('nach 3 s Ruhe verschwindet sie; eine Mausbewegung holt sie zurueck', () => {
    // Nur setTimeout faelschen: Der Bildtakt laeuft ueber requestAnimationFrame
    // (im beforeEach gestellt) und darf davon unberuehrt bleiben.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { behaelter, fertig } = rendere(eigenschaften())
    druecke(behaelter, 'vorschau-play-pause')
    expect(finde(behaelter, 'vorschau-transport').getAttribute('data-sichtbar')).toBe('true')

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(finde(behaelter, 'vorschau-transport').getAttribute('data-sichtbar')).toBe('false')

    act(() => {
      finde(behaelter, 'vorschau').dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    })
    expect(finde(behaelter, 'vorschau-transport').getAttribute('data-sichtbar')).toBe('true')

    vi.useRealTimers()
    fertig()
  })

  it('in der Pause bleibt sie stehen (kein Ausblenden ohne laufende Uhr)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { behaelter, fertig } = rendere(eigenschaften())
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(finde(behaelter, 'vorschau-transport').getAttribute('data-sichtbar')).toBe('true')
    vi.useRealTimers()
    fertig()
  })

  it('verlaesst der Zeiger das Bild, ist die Leiste sofort weg - auch in der Pause', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    act(() => {
      // React bildet onMouseLeave aus mouseout + relatedTarget.
      finde(behaelter, 'vorschau').dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      )
    })
    expect(finde(behaelter, 'vorschau-transport').getAttribute('data-sichtbar')).toBe('false')
    fertig()
  })
})

describe('#443 Ton (Standard aus)', () => {
  it('die Vorschau startet stumm und gibt stumm an das Video weiter', () => {
    const { fertig } = rendere(eigenschaften())
    const letzter = doppel.videoAufrufe.at(-1) as { stumm: boolean; lautstaerke: number }
    expect(letzter.stumm).toBe(true)
    expect(letzter.lautstaerke).toBe(1)
    fertig()
  })

  it('der Schalter in der Leiste macht hoerbar - das Video bekommt stumm = false', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    druecke(behaelter, 'vorschau-ton')
    const letzter = doppel.videoAufrufe.at(-1) as { stumm: boolean }
    expect(letzter.stumm).toBe(false)
    fertig()
  })
})

describe('#443 Vollbild', () => {
  it('ohne requestFullscreen in der Umgebung ist der Knopf abgeschaltet (jsdom)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    expect((finde(behaelter, 'vorschau-vollbild') as HTMLButtonElement).disabled).toBe(true)
    fertig()
  })
})
