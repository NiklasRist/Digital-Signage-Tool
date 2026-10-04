// Verhaltenstests zu #203 - die Auswahlanzeige (aktions-auswahl.tsx, jsdom).
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Project, Listenelement } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { FixWirkung } from '../../src/renderer/composer/reparatur-optionen'
// @ts-expect-error - aktions-auswahl.tsx statt des `.ts`-Zwillings
import { AktionsAuswahl } from '../../src/renderer/app-shell/aktions-auswahl.tsx'

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Quelldatei-Verbote (Grep) ----------------

const QUELLE_TSX = readFileSync(
  join(process.cwd(), 'src/renderer/app-shell/aktions-auswahl.tsx'),
  'utf8',
)

describe('aktions-auswahl.tsx – Verbote (Grep)', () => {
  it('ruft KEINEN Kanal: kein rufeAuf, kein KANAELE, kein abonniere, kein window.api', () => {
    for (const verbot of ['rufeAuf', 'KANAELE', 'abonniere', 'window.api']) {
      expect(QUELLE_TSX).not.toContain(verbot)
    }
  })

  it('bildet KEIN Einblendung-Objekt selbst (bandVorlageId/abschnitte: als Zuweisung verboten)', () => {
    expect(QUELLE_TSX).not.toContain('bandVorlageId:')
    expect(QUELLE_TSX).not.toContain('abschnitte:')
  })

  it('importiert nichts aus src/main/', () => {
    expect(QUELLE_TSX).not.toContain('src/main')
    expect(QUELLE_TSX).not.toContain('../../main')
  })
})

// ---------------- Bausteine ----------------

function asset(id: string, zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ: 'bild',
    dateiname: `${id}.png`,
    originalname: `bild-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

function aktion(id: string, bildRef: string | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    akzentfarbe: null,
  }
}

function projekt(liste: Listenelement[], aktionenListe: Aktion[], assetsListe: Asset[]): Project {
  return {
    id: 'p-1',
    name: 'Probe-Projekt',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: assetsListe,
    aktionen: aktionenListe,
    liste,
    letzterAusgabeName: null,
    standardSegmentdauer: 10,
  }
}

const segment: Listenelement = {
  id: 'e-segment',
  art: 'segment',
  ref: 'a-kaputt',
  dauer: 10,
  trimStart: null,
  trimEnde: null,
  einblendung: null,
}

const video: Listenelement = {
  id: 'e-video',
  art: 'video',
  ref: 'asset-video',
  dauer: null,
  trimStart: null,
  trimEnde: null,
  einblendung: {
    bandVorlageId: 'band-standard',
    abschnitte: [
      { aktionRef: 'a-kaputt', dauer: 7.13 },
      { aktionRef: 'a-ok', dauer: 9.31 },
    ],
  },
}

type Steuer = {
  aufAbgeschlossen: Mock<(wirkung: FixWirkung) => void>
  aufAbgebrochen: Mock<() => void>
  aufFehler: Mock<(code: string, meldung: string) => void>
  rueckSeg: Mock<(elementId: string, neueAktionId: string) => Promise<Ergebnis<FixWirkung>>>
  rueckBand: Mock<
    (
      elementId: string,
      abschnittIndex: number,
      neueAktionId: string,
      projekt: Project,
    ) => Promise<Ergebnis<FixWirkung>>
  >
}

const steuer: Steuer = {
  aufAbgeschlossen: vi.fn<(wirkung: FixWirkung) => void>(),
  aufAbgebrochen: vi.fn<() => void>(),
  aufFehler: vi.fn<(code: string, meldung: string) => void>(),
  rueckSeg: vi.fn<
    (elementId: string, neueAktionId: string) => Promise<Ergebnis<FixWirkung>>
  >(),
  rueckBand: vi.fn<
    (
      elementId: string,
      abschnittIndex: number,
      neueAktionId: string,
      projekt: Project,
    ) => Promise<Ergebnis<FixWirkung>>
  >(),
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

const AKTIONEN_PROBE = [aktion('a-kaputt', 'bild-fehlt'), aktion('a-leer', null), aktion('a-ok', 'bild-ok')]
const ASSETS_PROBE = [asset('bild-fehlt', 'fehlt'), asset('bild-ok')]

function zeige(
  eigenschaften: Partial<Parameters<typeof AktionsAuswahl>[0]> = {},
  liste: Listenelement[] = [segment, video],
  aktionenListe: Aktion[] = AKTIONEN_PROBE,
  assetsListe: Asset[] = ASSETS_PROBE,
): void {
  const voll: Parameters<typeof AktionsAuswahl>[0] = {
    elementId: 'e-segment',
    abschnittIndex: null,
    projekt: projekt(liste, aktionenListe, assetsListe),
    schliesseAktionsFixAb: steuer.rueckSeg,
    schliesseAbschnittsFixAb: steuer.rueckBand,
    aufAbgeschlossen: steuer.aufAbgeschlossen,
    aufAbgebrochen: steuer.aufAbgebrochen,
    aufFehler: steuer.aufFehler,
    ...eigenschaften,
  }
  const element = createElement(AktionsAuswahl, voll)
  act(() => {
    wurzel?.render(element as ReactElement)
  })
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  steuer.aufAbgeschlossen.mockClear()
  steuer.aufAbgebrochen.mockClear()
  steuer.aufFehler.mockClear()
  steuer.rueckSeg.mockClear()
  steuer.rueckBand.mockClear()
  steuer.rueckSeg.mockResolvedValue({ ok: true, wert: { art: 'erledigt' } })
  steuer.rueckBand.mockResolvedValue({ ok: true, wert: { art: 'erledigt' } })
})

afterEach(() => {
  act(() => {
    wurzel?.unmount()
  })
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

function radios(): HTMLInputElement[] {
  return Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
}

async function waehleUndUebernimm(stelle: number): Promise<void> {
  await act(async () => {
    radios()[stelle]?.click()
  })
  const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
  const knopf = knoepfe.find((k) => k.textContent === 'Übernehmen') as HTMLButtonElement
  await act(async () => {
    knopf.click()
  })
}

// ---------------- Tests ----------------

describe('AktionsAuswahl (#203) - Fall 2 (Segment, abschnittIndex null)', () => {
  it('die aktuell referenzierte Aktion steht NICHT in der Liste (a-kaputt ausgeschlossen)', () => {
    zeige()
    expect(radios()).toHaveLength(2) // a-leer und a-ok; a-kaputt und a-unbekannt[out] nicht
    expect(QUELLE_TSX).not.toContain('a-kaputt')
  })

  it('Klick ruft NUR schliesseAktionsFixAb(elementId, aktionId)', async () => {
    zeige()
    await waehleUndUebernimm(0)
    expect(steuer.rueckSeg).toHaveBeenCalledTimes(1)
    expect(steuer.rueckSeg).toHaveBeenCalledWith('e-segment', 'a-leer')
    expect(steuer.rueckBand).not.toHaveBeenCalled()
    expect(steuer.aufAbgeschlossen).toHaveBeenCalledWith({ art: 'erledigt' })
  })

  it('Element mit art video und abschnittIndex null -> aufFehler(ungueltige_eingabe), kein Rückweg', () => {
    zeige({ elementId: 'e-video' })
    expect(steuer.aufFehler).toHaveBeenCalledWith('ungueltige_eingabe', expect.any(String))
    expect(steuer.rueckSeg).not.toHaveBeenCalled()
    expect(steuer.rueckBand).not.toHaveBeenCalled()
  })
})

describe('AktionsAuswahl (#203) - Fall 3 (Band-Abschnitt, abschnittIndex Zahl)', () => {
  it('die aktuell referenzierte Aktion des ABSCHNITTS wird ausgeschlossen', () => {
    zeige({ elementId: 'e-video', abschnittIndex: 1 })
    // aktuell = a-ok (Abschnitt 1); angeboten: nur a-leer (a-kaputt unbrauchbar + nicht der aktuelle)
    expect(radios()).toHaveLength(1)
    expect(behaelter?.textContent).toContain('Aktion a-leer')
  })

  it('Klick ruft NUR schliesseAbschnittsFixAb(elementId, 1, aktionId, projekt) - projekt toBe-gleich', async () => {
    const eigenesProjekt = projekt([video], AKTIONEN_PROBE, ASSETS_PROBE)
    zeige({ elementId: 'e-video', abschnittIndex: 1, projekt: eigenesProjekt })
    await waehleUndUebernimm(0)
    expect(steuer.rueckBand).toHaveBeenCalledTimes(1)
    expect(steuer.rueckBand).toHaveBeenCalledWith('e-video', 1, 'a-leer', eigenesProjekt)
    expect(steuer.rueckSeg).not.toHaveBeenCalled()
    expect(steuer.aufAbgeschlossen).toHaveBeenCalledWith({ art: 'erledigt' })
  })

  it('index ausserhalb von abschnitte -> aufFehler(nicht_gefunden), kein Rückweg', () => {
    zeige({ elementId: 'e-video', abschnittIndex: 9 })
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.any(String))
    expect(steuer.rueckBand).not.toHaveBeenCalled()
  })

  it('video ohne einblendung -> aufFehler(nicht_gefunden)', () => {
    const ohneBand: Listenelement = { ...video, einblendung: null }
    zeige({ elementId: 'e-video', abschnittIndex: 0 }, [ohneBand])
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.any(String))
    expect(steuer.rueckBand).not.toHaveBeenCalled()
  })
})

describe('AktionsAuswahl (#203) - gemeinsame Verhalten', () => {
  it('unbekannte elementId -> aufFehler(nicht_gefunden)', () => {
    zeige({ elementId: 'gibts-nicht' })
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.any(String))
  })

  it('zweiter Klick vor der Antwort -> kein zweiter Rückweg-Aufruf', async () => {
    let loeseAuf: (wert: Ergebnis<FixWirkung>) => void = () => undefined
    steuer.rueckSeg.mockImplementation(
      () =>
        new Promise<Ergebnis<FixWirkung>>((auf) => {
          loeseAuf = auf
        }),
    )
    zeige()
    await act(async () => {
      radios()[0]?.click()
    })
    const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
    const knopf = knoepfe.find((k) => k.textContent === 'Übernehmen') as HTMLButtonElement
    await act(async () => {
      knopf.click()
      knopf.click()
    })
    expect(steuer.rueckSeg).toHaveBeenCalledTimes(1)
    await act(async () => {
      loeseAuf({ ok: true, wert: { art: 'erledigt' } as FixWirkung })
    })
    expect(steuer.rueckSeg).toHaveBeenCalledTimes(1)
  })

  it('ok:false -> aufFehler mit UNVERAENDERTEN Code, kein aufAbgeschlossen; Auswahl offen', async () => {
    steuer.rueckSeg.mockResolvedValue({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'vom Main', daten: undefined },
    })
    zeige()
    await waehleUndUebernimm(0)
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', 'vom Main')
    expect(steuer.aufAbgeschlossen).not.toHaveBeenCalled()
    expect(radios()).toHaveLength(2)
  })

  it('wirft der Rückweg -> aufFehler(unbekannter_fehler), Wurr verlaesst die Komponente nicht', async () => {
    steuer.rueckSeg.mockRejectedValue(new Error('wahnsinn'))
    zeige()
    await waehleUndUebernimm(0)
    expect(steuer.aufFehler).toHaveBeenCalledWith('unbekannter_fehler', expect.any(String))
    expect(steuer.aufAbgeschlossen).not.toHaveBeenCalled()
  })

  it('Abbruch -> aufAbgebrochen, nichts geschrieben', () => {
    zeige()
    const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
    const abbruch = knoepfe.find((k) => k.textContent === 'Abbrechen') as HTMLButtonElement
    act(() => {
      abbruch.click()
    })
    expect(steuer.aufAbgebrochen).toHaveBeenCalledTimes(1)
    expect(steuer.rueckSeg).not.toHaveBeenCalled()
    expect(steuer.rueckBand).not.toHaveBeenCalled()
  })

  it('keine brauchbare Aktion -> leere Auswahl mit Hinweis, KEIN Fehler', () => {
    const nurKaputt = [aktion('a-kaputt', 'bild-fehlt')]
    zeige({}, [segment], nurKaputt)
    expect(steuer.aufFehler).not.toHaveBeenCalled()
    expect(behaelter?.querySelectorAll('input[type=radio]')).toHaveLength(0)
    expect(behaelter?.textContent).toContain('Repariere zuerst')
  })

  it('Vorschau-URL beginnt mit media:// und enthaelt NIE absolute Pfade', () => {
    zeige()
    const quellen = Array.from(behaelter?.querySelectorAll('img[src]') ?? []).map((e) =>
      e.getAttribute('src'),
    )
    expect(quellen.length).toBeGreaterThan(0)
    for (const quelle of quellen) {
      expect(quelle).toMatch(/^media:\/\//)
      expect(quelle).not.toMatch(/^[A-Za-z]:\\|^\/(Users|home|mnt)\b/)
    }
  })
})
