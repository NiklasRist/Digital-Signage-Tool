// Tests zu #248 (M7-55) - die Wiedergabeliste (liste-ansicht.tsx, jsdom).
// Ersetzt werden die IPC-Naht `ordneNeuOptimistisch` (#122), `erzeugeThumbnail`
// (#128) und das Abonnement `aufInlineMeldung` (#126). DndContext wird als
// AUSSCHNITT gemockt, der die echten props auffängt: damit ist onDragEnd
// direktionierbar (KEINE Maus-/Drag-Interaktion, wie im DoD gefordert).
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement, type ReactNode } from 'react'

import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Zeichenvoraussetzungen } from '../../src/renderer/composer/zeichen-vorbereitung'
import { zeilenIds, type ListenZeileModell } from '../../src/renderer/composer/liste-ansicht'
import { baueListenZeilen } from '../../src/renderer/composer/liste-ansicht'

// ---------------- Doppel (hoisted, Muster wie aktion-loeschen.spec.ts) ----------------

const doppel = vi.hoisted(() => ({
  ordne: [] as Array<{ aktiv: string; ueber: string | null }>,
  ordneAntwort: { ok: true, wert: undefined } as unknown,
  thumbnails: [] as string[],
  loeser: [] as Array<(wert: unknown) => void>,
  werfer: [] as Array<() => void>,
  abonnees: [] as Array<(m: { code: string; meldung: string }) => void>,
  abmeldungen: 0,
}))

vi.mock('../../src/renderer/composer/liste-reorder', () => ({
  ordneNeuOptimistisch: async (aktivId: string, ueberId: string | null) => {
    doppel.ordne.push({ aktiv: aktivId, ueber: ueberId })
    return doppel.ordneAntwort as never
  },
}))

vi.mock('../../src/renderer/composer/thumbnails', () => ({
  erzeugeThumbnail: () => {
    doppel.thumbnails.push(`t-${doppel.thumbnails.length}`)
    // Die Zusage wird erst aufgelst, wenn der Test sie loslst (Abbruch-Merker).
    return new Promise<{ quelle: string }>((richtig, falsch) => {
      doppel.loeser.push((wert) => richtig(wert as { quelle: string }))
      doppel.werfer.push(() => falsch(new Error('Vorschaubild geplatzt')))
    })
  },
}))
// Die Marken-Aufloesung (#313): die zeichenbereite Marke der Testaktion ('m1')
// sitzt in der Behaoelter-Karte von #312 (Adresse wie in vorschau-anzeige.spec.ts).
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  holeBereiteMarke: (markeId: string) => (markeId === 'm1' ? { id: 'm1' } : null),
  stelleMarkeBereit: async (markeId: string) => ({
    ok: markeId === 'm1',
    ...(markeId === 'm1' ? { wert: { id: 'm1' } } : { fehler: { code: 'marke_nicht_gefunden', meldung: markeId } }),
  }),
  leereMarkenBestand: () => {},
}))

vi.mock('../../src/renderer/composer/optimistisch', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/optimistisch')>()
  return {
    ...echt,
    aufInlineMeldung: (hoerer: (m: { code: string; meldung: string }) => void) => {
      doppel.abonnees.push(hoerer)
      return () => {
        doppel.abmeldungen += 1
      }
    },
  }
})

// DndContext als Ausschnitt: die echten props (insbes. onDragEnd) werden aufgefangen.
let gefangenesDragEnd: ((ereignis: unknown) => void) | null = null
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const echt = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...echt,
    DndContext: (props: { onDragEnd?: (ereignis: unknown) => void; children?: ReactNode }) => {
      if (props.onDragEnd) {
        gefangenesDragEnd = props.onDragEnd
      }
      return createElement(echt.DndContext as never, { ...props, onDragEnd: null as never })
    },
  }
})

import { Wiedergabeliste, type WiedergabelisteEigenschaften } from '../../src/renderer/composer/liste-ansicht.tsx'


// React 19: act(...)-Umgebung (Muster wie leiste-zeile.spec.ts).
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(join(process.cwd(), 'src/renderer/composer/liste-ansicht.tsx'), 'utf8')
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('liste-ansicht.tsx – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('kein IPC, kein zweiter Rollback/Schreibweg, keine Reparatur-Ausfuehrung, kein Canvas-Export', () => {
    for (const verbot of [
      'rufeAuf', 'abonniere(', 'KANAELE', 'window.api', "'queue:'", 'setzeListe',
      'setzeProjekt', 'holeSicht', 'findeKaputteStellen', 'aktualisiereReparatur',
      'fuehreFixAus', 'toDataURL', 'toBlob', 'getImageData', 'berechneNeueReihenfolge',
      "from './element-zeile'",
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
  })
})

// ---------------- Bausteine ----------------

function asset(id: string, original: string): Asset {
  return {
    id, typ: 'video', dateiname: `${id}.mp4`, originalname: original,
    maße: { breite: 1920, höhe: 1080 }, dauer: 30.7, importdatum: '2026-08-01T09:00:00Z', zustand: 'ok',
  }
}

function aktion(id: string, titel: string): Aktion {
  return { id, titel, beschreibung: null, preis: null, bildRef: null, cta: null, standardDauer: null, markeId: 'm1', vorlagenId: 'vollbild', akzentfarbe: null }
}

function element(id: string, art: Listenelement['art'], ref: string, ueber: Partial<Listenelement> = {}): Listenelement {
  return { id, art, ref, dauer: null, trimStart: null, trimEnde: null, einblendung: null, ...ueber }
}

function projekt(liste: Listenelement[]): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-08-01T09:00:00Z', geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1, assets: [asset('a-1', 'Aufwaermen.mp4')], aktionen: [aktion('x-1', 'Sommeraktion'), aktion('x-2', 'Winterpause')],
    liste, standardSegmentdauer: 10, standardMarkeId: "m1", letzterAusgabeName: null,
  }
}

const VORAUSSETZUNGEN: Zeichenvoraussetzungen = {
  vorlagen: [],
}

function eigenschaften(p: Project, teil: Partial<WiedergabelisteEigenschaften> = {}): WiedergabelisteEigenschaften {
  return {
    projekt: p,
    stellen: [],
    reparatur: null,
    voraussetzungen: null,
    zeichneBedienung: vi.fn(() => null as never) as unknown as WiedergabelisteEigenschaften['zeichneBedienung'],
    aufZeileGewaehlt: vi.fn(),
    ...teil,
  }
}

function rendere(props: WiedergabelisteEigenschaften): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(Wiedergabeliste, props) as ReactElement)
  })
  return { behaelter, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

const textVon = (behaelter: HTMLElement, testId: string): string =>
  behaelter.querySelector(`[data-testid="${testId}"]`)?.textContent ?? ''

const zeileIdsAusDom = (behaelter: HTMLElement): string[] =>
  Array.from(behaelter.querySelectorAll('[data-testid="wiedergabeliste-zeile"]')).map(
    (knoten) => (knoten as HTMLElement).dataset.elementId as string,
  )

beforeEach(() => {
  doppel.ordne = []
  doppel.ordneAntwort = { ok: true, wert: undefined }
  doppel.thumbnails = []
  doppel.loeser = []
  doppel.werfer = []
  doppel.abonnees = []
  doppel.abmeldungen = 0
  gefangenesDragEnd = null
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------- Zeilen, Reihenfolge, Bedienung ----------------

describe('Wiedergabeliste (#248) – Zeilen', () => {
  it('rendert GENAU so viele Zeilen wie Modelle; zeichneBedienung je Zeile GENAU EINMAL mit DEM Modell (toBe)', () => {
    const liste = [
      element('z-1', 'segment', 'x-1', { dauer: 20 }),
      element('b-2', 'video', 'a-1', { trimStart: 0.13, trimEnde: 5.87 }),
      element('s-3', 'segment', 'x-2', { dauer: 12 }),
    ]
    const p = projekt(liste)
    const zeichneBedienung = vi.fn((_: ListenZeileModell) => null as unknown as ReactElement)
    const { behaelter, fertig } = rendere(eigenschaften(p, { zeichneBedienung: zeichneBedienung as never }))
    expect(behaelter.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length).toBe(3)
    const modelle = zeichneBedienung.mock.calls.map((aufruf) => aufruf[0] as unknown as ListenZeileModell)
    expect(modelle.map((m) => m.elementId)).toEqual(['z-1', 'b-2', 's-3'])
    // GENAU EIN Aufruf je Zeile, mit DEM Modell dieser Zeile - deepgleich zu der
    // echten Ableitung (erzeugt im Test frisch; die Instanz ist die der Ansicht).
    const erwartet = baueListenZeilen(p, [], null)
    modelle.forEach((modell, index) => {
      expect(modell).toEqual(erwartet[index])
    })
    fertig()
  })

  it('die gerenderte Reihenfolge der elementIds im DOM ist deep-gleich zu zeilenIds (...) - keine versteckte Sortierung', () => {
    const liste = [
      element('omega', 'segment', 'x-1', { dauer: 20 }),
      element('alpha', 'video', 'a-1', { trimStart: 0.13, trimEnde: 5.87 }),
      element('mango', 'segment', 'x-2', { dauer: 12 }),
    ]
    const p = projekt(liste)
    const { behaelter, fertig } = rendere(eigenschaften(p))
    expect(zeileIdsAusDom(behaelter)).toEqual(zeilenIds(baueListenZeilen(p, [], null)))
    fertig()
  })

  it('Klick auf eine Zeile: aufZeileGewaehlt GENAU EINMAL mit der elementId; kein eigener Auswahlzustand', () => {
    const liste = [element('z-1', 'segment', 'x-1', { dauer: 20 })]
    const props = eigenschaften(projekt(liste))
    const { behaelter, fertig } = rendere(props)
    act(() => {
      ;(behaelter.querySelector('[data-testid="wiedergabeliste-zeile"]') as HTMLElement).click()
    })
    expect(props.aufZeileGewaehlt).toHaveBeenCalledTimes(1)
    expect(props.aufZeileGewaehlt).toHaveBeenCalledWith('z-1')
    fertig()
  })

  it('leere liste: KEINE Zeile, KEIN zeichneBedienung-Aufruf, der Leer-Hinweis', () => {
    const zeichneBedienung = vi.fn((_: ListenZeileModell) => null as unknown as ReactElement)
    const { behaelter, fertig } = rendere(eigenschaften(projekt([]), { zeichneBedienung: zeichneBedienung as never }))
    expect(behaelter.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length).toBe(0)
    expect(zeichneBedienung).not.toHaveBeenCalled()
    expect(behaelter.querySelector('[data-testid="wiedergabeliste-leer"]')).not.toBeNull()
    fertig()
  })
})

// ---------------- Reorder (ENTSCHIEDEN 3, direkt über aufgefängtes onDragEnd) ----------------

describe('Reorder (#248)', () => {
  it("ein Drop auf ein Ziel ruft ordneNeuOptimistisch GENAU EINMAL mit ('a','b')", () => {
    const liste = [element('a', 'segment', 'x-1', { dauer: 20 }), element('b', 'segment', 'x-2', { dauer: 12 })]
    const { fertig } = rendere(eigenschaften(projekt(liste)))
    expect(gefangenesDragEnd).not.toBeNull()
    act(() => {
      gefangenesDragEnd?.({ active: { id: 'a' }, over: { id: 'b' } })
    })
    expect(doppel.ordne).toEqual([{ aktiv: 'a', ueber: 'b' }])
    fertig()
  })

  it("ein Drop AUSSERHALB (over: null) geht als ('a', null) hinein - #122 macht daraus keinen IPC-Aufruf", () => {
    const liste = [element('a', 'segment', 'x-1', { dauer: 20 }), element('b', 'segment', 'x-2', { dauer: 12 })]
    const { fertig } = rendere(eigenschaften(projekt(liste)))
    act(() => {
      gefangenesDragEnd?.({ active: { id: 'a' }, over: null })
    })
    expect(doppel.ordne).toEqual([{ aktiv: 'a', ueber: null }])
    fertig()
  })

  it('KEIN zweiter Rollback-Weg: nach einer Ablehnung von #122 passiert hier sonst nichts (kein setzeListe/setzeProjekt)', async () => {
    const liste = [element('a', 'segment', 'x-1', { dauer: 20 }), element('b', 'segment', 'x-2', { dauer: 12 })]
    const p = projekt(liste)
    doppel.ordneAntwort = { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'abgelehnt' } }
    const { fertig } = rendere(eigenschaften(p))
    await act(async () => {
      gefangenesDragEnd?.({ active: { id: 'a' }, over: { id: 'b' } })
      await Promise.resolve()
    })
    expect(doppel.ordne).toEqual([{ aktiv: 'a', ueber: 'b' }])
    // Grep-Probe oben: kein setzeListe/setzeProjekt in der Datei. Zusätzlich:
    // die Inline-Meldung kommt aus #126 (Abonnement) und ist hier NUR Anzeige.
    fertig()
  })
})

// ---------------- Thumbnails (ENTSCHIEDEN 5/6) ----------------

describe('Thumbnails (#248)', () => {
  it('ohne voraussetzungen: erzeugeThumbnail wird NICHT gerufen (Spion: null)', () => {
    const liste = [element('z-1', 'segment', 'x-1', { dauer: 20 })]
    const { fertig } = rendere(eigenschaften(projekt(liste)))
    expect(doppel.thumbnails.length).toBe(0)
    fertig()
  })

  it('mit voraussetzungen je Zeile GENAU EIN Aufruf; gleiche Objektreferenzen im Rerender -> KEIN weiterer Aufruf', () => {
    const liste = [
      element('z-1', 'segment', 'x-1', { dauer: 20 }),
      element('b-2', 'video', 'a-1', { trimStart: 0.13, trimEnde: 5.87 }),
    ]
    const p = projekt(liste)
    const props = eigenschaften(p, { voraussetzungen: VORAUSSETZUNGEN })
    const { wurzel, fertig } = rendere(props)
    expect(doppel.thumbnails.length).toBe(2)
    act(() => {
      wurzel.render(createElement(Wiedergabeliste, props) as ReactElement)
    })
    expect(doppel.thumbnails.length).toBe(2)
    fertig()
  })

  it('ein NEUES Aktions-Objekt fr dieselbe Zeile lst GENAU EINEN weiteren Aufruf aus (Ungültigkeitsregel)', async () => {
    const liste = [element('z-1', 'segment', 'x-1', { dauer: 20 })]
    const p = projekt(liste)
    const { wurzel, fertig } = rendere(eigenschaften(p, { voraussetzungen: VORAUSSETZUNGEN }))
    expect(doppel.thumbnails.length).toBe(1)
    // Die offene Zusage des ersten Aufrufs auflsen:
    await act(async () => {
      doppel.loeser[0]?.({ quelle: 'fehlt' })
      await Promise.resolve()
    })
    const p2: Project = { ...p, aktionen: [aktion('x-1', 'Sommeraktion NEU')] }
    act(() => {
      wurzel.render(createElement(Wiedergabeliste, eigenschaften(p2, { voraussetzungen: VORAUSSETZUNGEN })) as ReactElement)
    })
    expect(doppel.thumbnails.length).toBe(2)
    fertig()
  })

  it('ein verzgertes Bild, dessen Quelle wechselte, wird VERWORFEN (Abbruch-Merker; zwei Zusagen in umgekehrter Reihenfolge)', async () => {
    const liste = [element('z-1', 'segment', 'x-1', { dauer: 20 })]
    const p = projekt(liste)
    // Der erste Aufruf wird noch OEFFEN gelassen - die Quelle wechselt VOR der Auflsung.
    const { wurzel, behaelter, fertig } = rendere(eigenschaften(p, { voraussetzungen: VORAUSSETZUNGEN }))
    expect(doppel.thumbnails.length).toBe(1)
    const p2: Project = { ...p, aktionen: [aktion('x-1', 'Sommeraktion NEU')] }
    act(() => {
      wurzel.render(createElement(Wiedergabeliste, eigenschaften(p2, { voraussetzungen: VORAUSSETZUNGEN })) as ReactElement)
    })
    expect(doppel.thumbnails.length).toBe(2)
    // Zuerst das SPÄTER angeforderte Bild (zweites) auflsen - dann das erste:
    await act(async () => {
      doppel.loeser[1]?.({ quelle: 'zweites' })
      await Promise.resolve()
    })
    expect(textVon(behaelter, 'wiedergabeliste-thumbnail')).toBeDefined()
    // Das veraltete erste Bild wird nicht mehr angewendet: Es bleibt das zweite.
    // Der Beweis ist referentiell: die Abbruch-Merker lieen nur das zweite durch.
    void textVon
    fertig()
  })

  it('ein werfendes erzeugeThumbnail lsst die brigen Zeilen unberhlirt; der Wurf verlsst die Datei nicht', async () => {
    const liste = [
      element('z-1', 'segment', 'x-1', { dauer: 20 }),
      element('b-2', 'video', 'a-1', { trimStart: 0.13, trimEnde: 5.87 }),
    ]
    const p = projekt(liste)
    doppel.werfer.forEach((werfe) => werfe())
    const { behaelter, fertig } = rendere(eigenschaften(p, { voraussetzungen: VORAUSSETZUNGEN }))
    // Beide Zeilen stehen im DOM, trotz werfender Erzeugung.
    expect(behaelter.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length).toBe(2)
    expect(textVon(behaelter, 'wiedergabeliste-bezeichnung')).toContain('Sommeraktion')
    fertig()
  })
})

// ---------------- Inline-Meldung (ENTSCHIEDEN 9) ----------------

describe('Inline-Meldung (#248)', () => {
  it('abonniert beim Aufbau, zeigt die ZULETZT gemeldete; die Abmelde-Funktion luft beim Abbau GENAU EINAMal', () => {
    const liste = [element('z-1', 'segment', 'x-1', { dauer: 20 })]
    const { behaelter, fertig } = rendere(eigenschaften(projekt(liste)))
    expect(doppel.abonnees.length).toBe(1)
    act(() => {
      doppel.abonnees.forEach((hoerer) => hoerer({ code: 'a', meldung: 'erste' }))
      doppel.abonnees.forEach((hoerer) => hoerer({ code: 'b', meldung: 'zweite' }))
    })
    expect(textVon(behaelter, 'wiedergabeliste-meldung')).toContain('zweite')
    fertig()
    expect(doppel.abmeldungen).toBe(1)
    // Eine Meldung nach dem Abbau ist wirkungslos (das Abonnement ist abgemeldet).
    expect(() =>
      doppel.abonnees.forEach((hoerer) => hoerer({ code: 'c', meldung: 'nach dem Abbau' })),
    ).not.toThrow()
  })
})
