// Tests zu #242 - vorschau-auswahl.ts (die reine Auswahl, ohne Browser).
//
// Ersetzt werden die beiden untergelagerten Auskunftsdienste (Segmentquelle
// #217, Bandtakt #220) durch kontrollierte Doppel; Prüfobjekt ist die
// ABLAUFSORDNUNG der Auswahl selbst. taktDelta/taktSollLaufen (ENTSCHIEDEN 7)
// sind ebenfalls Faelle der reinen Datei.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  segmentquelle: null as unknown as import('../../src/renderer/preview-player/segment-quelle').Segmentquelle,
  segmentquellen: [] as Array<{ aktionId: string; schriftenBereit: boolean }>,
  takt: null as import('../../src/renderer/preview-player/band-takt').Bandtakt | null,
  bandtaktAufrufe: [] as Array<unknown>,
  bandabschnitt: null as import('../../src/renderer/preview-player/band-takt').Bandabschnitt | null,
  abschnittAufrufe: [] as Array<{ lokalerFrame: number; elementFrames: number }>,
}))

vi.mock('../../src/renderer/preview-player/segment-quelle', () => ({
  findeSegmentquelle: (aktionId: string, _aktionen: unknown, _vorlagen: unknown, schriftenBereit: boolean) => {
    doppel.segmentquellen.push({ aktionId, schriftenBereit })
    return doppel.segmentquelle
  },
}))

vi.mock('../../src/renderer/preview-player/band-takt', () => ({
  baueBandtakt: (einblendung: unknown) => {
    doppel.bandtaktAufrufe.push(einblendung)
    return doppel.takt
  },
  waehleAbschnitt: (_takt: unknown, lokalerFrame: number, elementFrames: number) => {
    doppel.abschnittAufrufe.push({ lokalerFrame, elementFrames })
    return doppel.bandabschnitt
  },
}))

import {
  taktDelta,
  taktSollLaufen,
  waehleVorschaubild,
  type Vorschaubild,
} from '../../src/renderer/preview-player/vorschau-auswahl'
import type { Project, Listenelement, Einblendung } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import type { Achsenabschnitt } from '../../src/renderer/preview-player/zeitachse'

// ---------------- Bausteine ----------------

function baueAsset(teil: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-1', typ: 'video', dateiname: 'medien-1.mp4', originalname: 'Sommer.mp4',
    maße: { breite: 1920, höhe: 1080 }, dauer: 60, importdatum: '2026-10-06T00:00:00Z',
    zustand: 'ok',
    ...teil,
  }
}

function baueAktion(teil: Partial<Aktion> = {}): Aktion {
  return {
    id: 'a-1', titel: 'Sommeraktion', beschreibung: null, preis: null,
    bildRef: null, cta: null, standardDauer: null, vorlagenId: 'v-1',
    markeId: 'm1', akzentfarbe: null,
    ...teil,
  }
}

function baueElement(teil: Partial<Listenelement> = {}): Listenelement {
  return {
    id: 'e-1', art: 'video', ref: 'asset-1', dauer: null,
    trimStart: 2, trimEnde: 12, einblendung: null,
    ...teil,
  }
}

const EINBLENDUNG: Einblendung = { bandVorlageId: 'bv-1', abschnitte: [] }

function baueVorlage(teil: Partial<Vorlage> = {}): Vorlage {
  return {
    id: 'v-1', name: 'Vollbild', art: 'vollflaeche', höhe: null,
    parent: null, eingebaut: true, zonen: [],
    ...teil,
  }
}

function baueProjekt(teil: Partial<Project> = {}): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-10-06T00:00:00Z', geaendertAm: '2026-10-06T00:00:00Z',
    schemaVersion: 1,
    assets: [], aktionen: [], liste: [],
    letzterAusgabeName: null, standardSegmentdauer: 10, standardMarkeId: 'm1',
    ...teil,
  }
}

const ABSCHNITT: Achsenabschnitt = { elementId: 'e-1', index: 0, startFrame: 0, endeFrame: 300, frames: 300 }

beforeEach(() => {
  doppel.segmentquellen = []
  doppel.bandtaktAufrufe = []
  doppel.abschnittAufrufe = []
  doppel.takt = { abschnitte: [], rundeFrames: 0 }
  doppel.bandabschnitt = null
  doppel.segmentquelle = { zustand: 'schriften_fehlen' }
})

// ---------------- Schritt 1/2: leer ----------------

describe('Schritt 1/2: die Leerfaelle schlagen alles', () => {
  it('abschnitt === null -> leer; findeSegmentquelle und baueBandtakt werden NICHT gerufen', () => {
    const projekt = baueProjekt({ liste: [baueElement()] })
    expect(waehleVorschaubild(projekt, null, 0, [], [], true)).toEqual({ art: 'leer' })
    expect(doppel.segmentquellen).toHaveLength(0)
    expect(doppel.bandtaktAufrufe).toHaveLength(0)
  })

  it('passt die elementId nicht zum Element am Index, entsteht eine LEERE Flaeche - die Vorschau luegt nicht (ENTSCHIEDEN 8)', () => {
    const projekt = baueProjekt({ liste: [baueElement()] })
    const fremd: Achsenabschnitt = { ...ABSCHNITT, elementId: 'e-FREMD' }
    expect(waehleVorschaubild(projekt, fremd, 0, [], [], true)).toEqual({ art: 'leer' })
  })

  it('fehlt das Element am Index, bleibt es ebenfalls leer', () => {
    const projekt = baueProjekt()
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], [], true)).toEqual({ art: 'leer' })
  })
})

// ---------------- Schritt 3/4: die kaputten Stellen ----------------

describe('Schritt 3/4: die Tabelle aus #221 - Zeichen fuer Zeichen', () => {
  it('element_asset -> Platzhalter mit seinem Grund und dem ORIGINALNAMEN des Assets als titel', () => {
    const projekt = baueProjekt({ liste: [baueElement()], assets: [baueAsset()] })
    const stellen: KaputteStelle[] = [
      { art: 'element_asset', elementId: 'e-1', assetId: 'asset-1', grund: 'asset_fehlt' },
    ]
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], stellen, true)).toEqual({
      art: 'platzhalter', grund: 'asset_fehlt', titel: 'Sommer.mp4',
    })
  })

  it('element_aktion mit grund aktion_unbekannt -> Platzhalter mit dem Titel der Aktion; findet sie dies nicht, fehlt titel', () => {
    const mitAktion = baueProjekt({ liste: [baueElement({ art: 'segment', ref: 'a-x' })], aktionen: [baueAktion()] })
    const stellen: KaputteStelle[] = [
      { art: 'element_aktion', elementId: 'e-1', aktionId: 'a-1', assetId: null, grund: 'aktion_unbekannt' },
    ]
    expect(waehleVorschaubild(mitAktion, ABSCHNITT, 0, [], stellen, true)).toEqual({
      art: 'platzhalter', grund: 'aktion_unbekannt', titel: 'Sommeraktion',
    })
    const ohneAktion = baueProjekt({ liste: [baueElement({ art: 'segment', ref: 'a-x' })] })
    expect(waehleVorschaubild(ohneAktion, ABSCHNITT, 0, [], stellen, true)).toEqual({
      art: 'platzhalter', grund: 'aktion_unbekannt',
    })
  })

  it('element_aktion mit grund asset_fehlt -> KEIN Platzhalter; das Segment wird normal gezeichnet', () => {
    const aktion = baueAktion()
    const vorlage = baueVorlage()
    doppel.segmentquelle = { zustand: 'bereit', aktion, vorlage }
    const stellen: KaputteStelle[] = [
      { art: 'element_aktion', elementId: 'e-1', aktionId: 'a-1', assetId: 'asset-1', grund: 'asset_fehlt' },
    ]
    const projekt = baueProjekt({ liste: [baueElement({ art: 'segment', ref: 'a-1' })] })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [vorlage], stellen, true)).toEqual({
      art: 'segment', aktion, vorlage,
    })
  })

  it('band_abschnitt -> KEIN Platzhalter; das normale Video-Bild bleibt', () => {
    const projekt = baueProjekt({ liste: [baueElement()], assets: [baueAsset()] })
    const stellen: KaputteStelle[] = [
      { art: 'band_abschnitt', elementId: 'e-1', abschnittIndex: 0, aktionId: 'a-1', assetId: null, grund: 'aktion_unbekannt' },
    ]
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], stellen, true)).toEqual({
      art: 'video', assetId: 'asset-1', dateiname: 'medien-1.mp4', trimStart: 2, trimEnde: 12,
    })
  })
})

// ---------------- Schritt 5: video ----------------

describe('Schritt 5: video - die drei Varianten', () => {
  const ASSET = baueAsset({ id: 'identifikator', dateiname: 'medien-x.mp4' })
  const ELEMENT = baueElement({ ref: 'identifikator' })
  const FLACH = {
    art: 'video', assetId: 'identifikator', dateiname: 'medien-x.mp4', trimStart: 2, trimEnde: 12,
  } as const

  it('ohne Einblendung: ein flaches Video; assetId === asset.id und NIE der dateiname (die unterscheiden sich hier)', () => {
    const projekt = baueProjekt({ liste: [ELEMENT], assets: [ASSET] })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [], [], true)).toEqual(FLACH)
  })

  it('Band-Vorlage unbekannt / art vollflaeche / hoehe null -> jeweils ein FLACHES Video (drei benannte Faelle)', () => {
    const projekt = baueProjekt({ liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })], assets: [ASSET] })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [baueVorlage({ id: 'anders' })], [], true)).toEqual(FLACH)
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [baueVorlage({ id: 'bv-1', art: 'vollflaeche' })], [], true)).toEqual(FLACH)
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [baueVorlage({ id: 'bv-1', art: 'split', höhe: null })], [], true)).toEqual(FLACH)
  })

  it('split/einblendung: die art der Band-Vorlage entscheidet - zwei benannte Tests, die sich NUR in der art unterscheiden', () => {
    const projekt = baueProjekt({ liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })], assets: [ASSET] })
    const split = baueVorlage({ id: 'bv-1', art: 'split', höhe: 162 })
    const einbl = baueVorlage({ id: 'bv-1', art: 'einblendung', höhe: 162 })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [split], [], true)).toEqual({
      art: 'split', assetId: 'identifikator', dateiname: 'medien-x.mp4',
      trimStart: 2, trimEnde: 12, bandVorlage: split, bandAktion: null,
    })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 5, [einbl], [], true)).toEqual({
      art: 'einblendung', assetId: 'identifikator', dateiname: 'medien-x.mp4',
      trimStart: 2, trimEnde: 12, bandVorlage: einbl, bandAktion: null,
    })
  })

  it('waehleAbschnitt bekommt GENAU abschnitt.frames und den UNVERAENDERTEN lokalerFrame (Spion)', () => {
    const projekt = baueProjekt({ liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })], assets: [ASSET] })
    waehleVorschaubild(projekt, ABSCHNITT, 44, [baueVorlage({ id: 'bv-1', art: 'split', höhe: 162 })], [], true)
    expect(doppel.abschnittAufrufe).toEqual([{ lokalerFrame: 44, elementFrames: 300 }])
  })

  it('waehleAbschnitt null -> bandAktion null; die Aktion des Abschnitts fehlt -> ebenfalls null', () => {
    const vorlage = baueVorlage({ id: 'bv-1', art: 'split', höhe: 162 })
    doppel.bandabschnitt = { aktionRef: 'a-1', index: 0, startFrame: 0, endeFrame: 90, frames: 90 }
    doppel.takt = { abschnitte: [doppel.bandabschnitt], rundeFrames: 90 }
    const ohneAktion = baueProjekt({ liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })], assets: [ASSET] })
    const bild: Vorschaubild = waehleVorschaubild(ohneAktion, ABSCHNITT, 5, [vorlage], [], true)
    expect((bild as Extract<Vorschaubild, { art: 'split' }>).bandAktion).toBeNull()
    const mitAktion = baueProjekt({
      liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })], assets: [ASSET], aktionen: [baueAktion()],
    })
    const bildMit: Vorschaubild = waehleVorschaubild(mitAktion, ABSCHNITT, 5, [vorlage], [], true)
    expect((bildMit as Extract<Vorschaubild, { art: 'split' }>).bandAktion).toEqual(baueAktion())
  })

  it('ein video-Element ohne zeiten (null) bleibt mit 0 belegt', () => {
    const projekt = baueProjekt({ liste: [baueElement({ ref: 'identifikator', trimStart: null, trimEnde: null })], assets: [ASSET] })
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], [], true)).toEqual({
      art: 'video', assetId: 'identifikator', dateiname: 'medien-x.mp4', trimStart: 0, trimEnde: 0,
    })
  })
})

// ---------------- Schritt 5: segment ----------------

describe('Schritt 5: segment', () => {
  it('bereit -> art segment mit GENAU der gelieferten aktion und vorlage (toBe)', () => {
    const aktion = baueAktion()
    const vorlage = baueVorlage()
    doppel.segmentquelle = { zustand: 'bereit', aktion, vorlage }
    const projekt = baueProjekt({ liste: [baueElement({ art: 'segment', ref: 'a-1' })] })
    const bild: Vorschaubild = waehleVorschaubild(projekt, ABSCHNITT, 0, [vorlage], [], true)
    const alsSegment = bild as Extract<Vorschaubild, { art: 'segment' }>
    expect(alsSegment.aktion).toBe(aktion)
    expect(alsSegment.vorlage).toBe(vorlage)
  })

  it('aktion_unbekannt -> Platzhalter; vorlage_unbekannt und schriften_fehlen -> LEERE Flaeche (drei tests)', () => {
    const projekt = baueProjekt({ liste: [baueElement({ art: 'segment', ref: 'a-1' })] })
    doppel.segmentquelle = { zustand: 'aktion_unbekannt', aktionId: 'a-1' }
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], [], true)).toEqual({ art: 'platzhalter', grund: 'aktion_unbekannt' })
    doppel.segmentquelle = { zustand: 'vorlage_unbekannt', vorlagenId: 'v-1' }
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], [], true)).toEqual({ art: 'leer' })
    doppel.segmentquelle = { zustand: 'schriften_fehlen' }
    expect(waehleVorschaubild(projekt, ABSCHNITT, 0, [], [], true)).toEqual({ art: 'leer' })
  })
})

// ---------------- Reinheit ----------------

describe('Reinheit: die Eingaben werden NICHT veraendert', () => {
  it('Object.freeze auf projekt, vorlagen und kaputteStellen; der Lauf bleibt ohne Wurf', () => {
    const aktion = baueAktion()
    const vorlage = baueVorlage({ id: 'bv-1', art: 'split', höhe: 162 })
    doppel.segmentquelle = { zustand: 'bereit', aktion, vorlage: baueVorlage() }
    doppel.bandabschnitt = { aktionRef: 'a-1', index: 0, startFrame: 0, endeFrame: 90, frames: 90 }
    doppel.takt = { abschnitte: [doppel.bandabschnitt], rundeFrames: 90 }
    const projekt: Project = Object.freeze(
      baueProjekt({
        liste: [baueElement({ ref: 'identifikator', einblendung: EINBLENDUNG })],
        assets: [baueAsset()], aktionen: [baueAktion()],
      }),
    )
    Object.freeze(projekt.liste)
    Object.freeze(projekt.assets)
    Object.freeze(projekt.aktionen)
    const stellen: readonly KaputteStelle[] = Object.freeze([
      Object.freeze({
        art: 'band_abschnitt', elementId: 'e-1', abschnittIndex: 0, aktionId: 'a-1',
        assetId: null, grund: 'aktion_unbekannt',
      } as KaputteStelle),
    ])
    expect(() =>
      waehleVorschaubild(projekt, ABSCHNITT, 5, [Object.freeze(vorlage)], stellen, true),
    ).not.toThrow()
  })
})

// ---------------- Takt (ENTSCHIEDEN 7) ----------------

describe('taktDelta und taktSollLaufen', () => {
  it('taktDelta(x, null) === 0 fuer beliebige x; taktDelta(1000, 400) === 600', () => {
    expect(taktDelta(0, null)).toBe(0)
    expect(taktDelta(1234.5, null)).toBe(0)
    expect(taktDelta(1000, 400)).toBe(600)
  })

  it('taktSollLaufen: true NUR fuer (true, true) - vier benannte Faelle', () => {
    expect(taktSollLaufen(true, true)).toBe(true)
    expect(taktSollLaufen(true, false)).toBe(false)
    expect(taktSollLaufen(false, true)).toBe(false)
    expect(taktSollLaufen(false, false)).toBe(false)
  })
})

// ---------------- Grep-Probe ----------------

describe('Quelldatei-Verbote (Grep-Probe, code ohne Kommentare)', () => {
  const quelle = readFileSync(
    new URL('../../src/renderer/preview-player/vorschau-auswahl.ts', import.meta.url),
    'utf8',
  )
  const code = quelle
    .split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('kein JSX, kein react, kein Math., kein RENDER_PROFILE, kein Rueckkanal, kein media://, kein app-shell/template-canvas/main', () => {
    expect(code).not.toContain('react')
    expect(code).not.toContain('<')
    expect(code).not.toContain('Math.')
    expect(code).not.toContain('RENDER_PROFILE')
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toContain('abonniere')
    expect(code).not.toContain('window.')
    expect(code).not.toContain('media://')
    expect(code).not.toContain('app-shell/')
    expect(code).not.toContain('template-canvas/')
    expect(code).not.toContain('src/main/')
  })
})
