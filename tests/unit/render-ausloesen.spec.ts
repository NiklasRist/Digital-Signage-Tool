// Verhaltenstests zu #134 - render-ausloesen.ts.
// Die vier anderen Bausteine (kaputt-erkennung #131, render-dialog #231, zeichneSegment #117,
// alsPng #118) werden gemockt - der Fokus ist die ITEM-Bildung, die Namen-NVP, einreihen.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { Project } from '../../src/shared/contracts/project'
import type { Marke } from '../../src/shared/contracts/marke'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
}))

const markenDoppel = vi.hoisted(() => ({
  aufrufe: [] as string[],
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))
vi.mock('../../src/renderer/composer/kaputt-erkennung', () => ({
  findeKaputteStellen: vi.fn(() => []),
}))
vi.mock('../../src/renderer/composer/render-dialog', () => ({
  pruefeAusgabeName: vi.fn(() => 'ok'),
}))
vi.mock('../../src/renderer/template-canvas/zeichne-segment', () => ({
  zeichneSegment: vi.fn(() => ({ canvas: { width: 1920, height: 1080 }, breite: 1920, höhe: 1080 })),
}))
vi.mock('../../src/renderer/template-canvas/als-png', () => ({
  alsPng: vi.fn(async () => ({ ok: true, wert: new Uint8Array([137, 80]) })),
}))
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  stelleMarkeBereit: async (markeId: string) => {
    markenDoppel.aufrufe.push(markeId)
    return markenDoppel.antwort
  },
}))

import { findeKaputteStellen } from '../../src/renderer/composer/kaputt-erkennung'
import { pruefeAusgabeName } from '../../src/renderer/composer/render-dialog'
import { alsPng } from '../../src/renderer/template-canvas/als-png'
import { zeichneSegment } from '../../src/renderer/template-canvas/zeichne-segment'
import { loeseExportAus, loeseRenderAus } from '../../src/renderer/composer/render-ausloesen'

import type { AusloeseFehlercode } from '../../src/renderer/composer/render-ausloesen'
import type { Behaupte, Gleich } from '../typ-gleich'

// #316 hielt die Signatur bei vier Parametern. #338 (27.10.2026) erweitert sie um den
// Marken-Bestand - die Kaputt-Erkennung muss die Marken-Referenzen mitpruefen. Der
// Vertrag ist damit FUENF Parameter; die Probe haelt die Zahl fest, nicht die Namen.
type SignaturProbe = Behaupte<Gleich<Parameters<typeof loeseRenderAus>['length'], 5>>;
type CodeProbe = Behaupte<
  Gleich<AusloeseFehlercode, 'kaputte_elemente' | 'png_export_fehler' | 'marke_nicht_ladbar'>
>;
export type { SignaturProbe, CodeProbe };

const marke = (): Marke => ({
  farben: {} as never,
  schriften: null as never,
  logo: null as never,
  sicherheit: null as never,
  radien: null as never,
  schatten: null as never,
  slogan: null as never,
  id: 'm1',
  name: 'Probe',
  parent: null,
  eingebaut: false,
  herkunftJeFeld: null as never,
})

/** Eine Marke mit EINEM unterscheidbaren Farbwert der Rolle `flaecheDunkel`. */
function markeMit(farbe: string): Marke {
  return { ...marke(), farben: { flaecheDunkel: farbe } as never }
}

function projekt(liste: Project['liste'], aktionen: Project['aktionen'] = [], assets: Project['assets'] = []): Project {
  return {
    id: 'p-1',
    name: 'Probe',
    erstelltAm: 'x',
    geaendertAm: 'x',
    schemaVersion: 1,
    assets,
    aktionen,
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

function segment(id: string, ref: string, dauer: number | null): Project['liste'][number] {
  return { id, art: 'segment', ref, dauer, trimStart: null, trimEnde: null, einblendung: null }
}

function video(id: string, ref: string, einblendung: Project['liste'][number]['einblendung'], trimStart: number | null = null, trimEnde: number | null = null): Project['liste'][number] {
  return { id, art: 'video', ref, dauer: null, trimStart, trimEnde, einblendung }
}

const AKTION_OK = {
  id: 'a-1',
  titel: 'Probe',
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: 'vollbild',
  markeId: 'm1',
  akzentfarbe: null,
}

const VORLAGEN_OK = [{ id: 'vollbild', name: 'Vollbild', art: 'vollflaeche' as const, höhe: null, parent: null, eingebaut: true, zonen: [] }]

let standardMarke: Marke

beforeEach(() => {
  doppel.aufrufe.splice(0)
  doppel.antwort = { ok: true, wert: { auftragId: 'q-1' } }
  standardMarke = { ...marke(), id: 'standard' }
  markenDoppel.aufrufe.splice(0)
  markenDoppel.antwort = { ok: true, wert: standardMarke }
  vi.mocked(pruefeAusgabeName).mockReturnValue('ok' as never)
  vi.mocked(findeKaputteStellen).mockReturnValue([] as never)
  vi.mocked(zeichneSegment).mockClear()
  vi.mocked(alsPng).mockClear()
})

describe('loeseRenderAus (#134) - Sperre und NamensvP', () => {
  it("kaputte Stellen -> kaputte_code mit daten.stellen; nichts eingereiht", async () => {
    vi.mocked(findeKaputteStellen).mockReturnValue([{ art: 'asset_fehlt', kreis: null } as never])
    const antwort = await loeseRenderAus(projekt([]), 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('kaputte_elemente')
      expect((antwort.fehler.daten as never as { stellen: never }).stellen).toHaveLength(1)
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it("NamensvP verhindert -> ungueltige_eingabe, kein Einreihen", async () => {
    vi.mocked(pruefeAusgabeName).mockReturnValue('punkt_punkt' as never)
    const antwort = await loeseRenderAus(projekt([]), '../../config', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) expect(antwort.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('die SPERRE gewinnt gegen die Namens-VP: kaputte Stellen auch bei ungueltigem Namen', async () => {
    // Schritt 1 vor Schritt 2 (Issue-Ablauf). Beide Bedingungen zugleich: nur die
    // Reihenfolge entscheidet, welcher Code zurueckkommt.
    vi.mocked(findeKaputteStellen).mockReturnValue([{ art: 'asset_fehlt', kreis: null } as never])
    vi.mocked(pruefeAusgabeName).mockReturnValue('leer' as never)
    const antwort = await loeseRenderAus(projekt([]), '   ', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) expect(antwort.fehler.code).toBe('kaputte_elemente')
    expect(doppel.aufrufe).toHaveLength(0)
  })
})

describe('loeseRenderAus (#134) - die Items', () => {
  it("segment -> RenderItemSegment mit PNG, dauer aus dem Element; die VORLAGE über aktion.vorlagenId", async () => {
    const p = projekt([segment('e1', 'a-1', 10)], [AKTION_OK], [])
    const antwort = await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(true)
    const ruf = doppel.aufrufe[0]
    expect(ruf?.kanal).toBe(KANAELE.queue.reiheEin)
    const nutzlast = ruf?.nutzlast as { art: string; payload: { elemente: NonNullable<typeof ruf> extends never ? never : Array<never>; ausgabeName: string; profil: typeof RENDER_PROFILE; renderId: string; projektId: string } }
    expect(nutzlast.art).toBe('render')
    expect(nutzlast.payload.ausgabeName).toBe('sommer')
    expect(nutzlast.payload.profil).toBe(RENDER_PROFILE)
    expect(Array.from((nutzlast.payload.elemente as unknown as Array<{ png: Uint8Array; dauer: number; art: string; id: string }>)).length).toBe(1)
  })

  it("video ohne einblendung -> RenderItemVideo mit einblendung null; trimStart aus null -> 0; trimEnde aus null / asset.dauer", async () => {
    const asset = { id: 'v1', typ: 'video', dateiname: 'aa.mp4', originalname: 'aa', maße: { breite: 10, höhe: 10 }, dauer: 12.5, importdatum: 'x', zustand: 'ok' } as never as Project['assets'][number]
    const p = projekt([video('e1', 'v1', null)], [], [asset])
    await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { payload: { elemente: Array<{ art: string; medienRef: string; trimStart: number; trimEnde: number; einblendung: unknown }> } }
    const item = nutzlast.payload.elemente[0]
    expect(item).toBeDefined()
    if (item === undefined) return
    expect(item.medienRef).toBe('aa.mp4')
    expect(item.trimStart).toBe(0)
    expect(item.trimEnde).toBe(12.5)
    expect(item.einblendung).toBeNull()
  })

  it("video mit einblendung -> art und Höhe aus der SELBEN Band-Vorlage; je Abschnitt ein Band-PNG", async () => {
    const band = { id: 'band-1', name: 'band', art: 'split' as const, höhe: 162, parent: null, eingebaut: true, zonen: [] }
    const bild = { id: 'bild-1', typ: 'bild' as const, dateiname: 'aa.png', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' as const }
    // Das EINBLENDUNG: der Video-Element nutzt die bild-Asset-ID; die Elemente
    // haben kein Dauer (Bild hat keine) aber trimmed Start/Ende CLOCK: 0 - 10
    const p = projekt(
      [video('e1', 'bild-1', { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 7.13 }] }, 0, 10)],
      [AKTION_OK],
      [bild],
    )
    const antwortProbe = await loeseRenderAus(p, 'sommer', marke(), [...VORLAGEN_OK, band], null)
    if (!antwortProbe.ok) {
      throw new Error(`Probe fehlgeschlagen: ${antwortProbe.fehler.code} – ${antwortProbe.fehler.meldung}`)
    }
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { payload: { elemente: Array<{ einblendung: { art: string; höhe: number; bandVorlageId: string; abschnitte: Array<{ png: Uint8Array; dauer: number }> } | null }> } }
    expect(nutzlast.payload.elemente[0]?.einblendung?.art).toBe('split')
    expect(nutzlast.payload.elemente[0]?.einblendung?.höhe).toBe(162)
    expect(nutzlast.payload.elemente[0]?.einblendung?.abschnitte).toHaveLength(1)
  })

  it("die Hoehe kommt aus der SELBEN Band-Vorlage (120), nicht aus einer festen Zahl", async () => {
    const flach = { id: 'band-2', name: 'flach', art: 'einblendung' as const, höhe: 120, parent: null, eingebaut: false, zonen: [] }
    const videoAsset = { id: 'v1', typ: 'video' as const, dateiname: 'aa.mp4', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: 9, importdatum: 'x', zustand: 'ok' as const }
    const p = projekt(
      [video('e1', 'v1', { bandVorlageId: 'band-2', abschnitte: [{ aktionRef: 'a-1', dauer: 2 }] }, 0, 10)],
      [AKTION_OK],
      [videoAsset],
    )
    const antwort = await loeseRenderAus(p, 'sommer', marke(), [...VORLAGEN_OK, flach], null)
    expect(antwort.ok).toBe(true)
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { payload: { elemente: Array<{ einblendung: { art: string; höhe: number } | null }> } }
    expect(nutzlast.payload.elemente[0]?.einblendung?.höhe).toBe(120)
    expect(nutzlast.payload.elemente[0]?.einblendung?.art).toBe('einblendung')
  })

  it("der Auftrag traegt die PROJEKT-Kennung (nicht die Testkonstante p-1)", async () => {
    const p = { ...projekt([segment('e1', 'a-1', 10)], [AKTION_OK], []), id: 'p-9' }
    await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { payload: { projektId: string } }
    expect(nutzlast.payload.projektId).toBe('p-9')
  })

  it("Band-Vorlage ohne Höhe (vollflaeche) -> ungueltige_eingabe, kein Einreihen", async () => {
    const bild = { id: 'bild-1', typ: 'bild' as const, dateiname: 'aa.png', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' as const }
    const p = projekt(
      [video('e1', 'bild-1', { bandVorlageId: 'vollbild', abschnitte: [{ aktionRef: 'a-1', dauer: 3 }] }, 0, 10)],
      [AKTION_OK],
      [bild],
    )
    const antwort = await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('ungueltige_eingabe')
      expect(antwort.fehler.meldung).toContain('e1')
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('alsPng ok:false -> png_export_fehler, ohne einzureihen (kein halbestücktes Array)', async () => {
    vi.mocked(alsPng).mockResolvedValueOnce({ ok: false, fehler: { code: 'png_export_fehler', meldung: 'leer', daten: undefined } } as never)
    const p = projekt([segment('e1', 'a-1', 10)], [AKTION_OK], [])
    const antwort = await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) expect(antwort.fehler.code).toBe('png_export_fehler')
    expect(doppel.aufrufe).toHaveLength(0)
  })
})

describe('loeseRenderAus (#310) - Rahmen-Marke', () => {
  const bandVorlage = { id: 'band-1', name: 'band', art: 'split' as const, höhe: 162, parent: null, eingebaut: true, zonen: [] }
  const bildAsset = { id: 'bild-1', typ: 'bild' as const, dateiname: 'aa.png', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' as const }
  const band = (id: string) => video(id, 'bild-1', { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 5 }] }, 0, 10)

  it('Band: stelleMarkeBereit genau einmal mit standardMarkeId; 4. Argument ist die Standardmarke, nicht die Inhaltsmarke', async () => {
    const inhalt = marke()
    const antwort = await loeseRenderAus(projekt([band('e1')], [AKTION_OK], [bildAsset]), 'sommer', inhalt, [...VORLAGEN_OK, bandVorlage], null)
    expect(antwort.ok).toBe(true)
    expect(markenDoppel.aufrufe).toEqual(['m1'])
    const calls = vi.mocked(zeichneSegment).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0]?.[2]).toBe(inhalt)
    expect(calls[0]?.[3]).toBe(standardMarke)
  })

  it('ohne Band: stelleMarkeBereit null Mal', async () => {
    await loeseRenderAus(projekt([segment('e1', 'a-1', 10)], [AKTION_OK], []), 'sommer', marke(), VORLAGEN_OK, null)
    expect(markenDoppel.aufrufe).toEqual([])
  })

  it('Video OHNE Einblendung: stelleMarkeBereit null Mal (nur ein gezeichnetes Band braucht sie)', async () => {
    const videoAsset = { id: 'v1', typ: 'video' as const, dateiname: 'aa.mp4', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: 9, importdatum: 'x', zustand: 'ok' as const }
    const antwort = await loeseRenderAus(projekt([video('e1', 'v1', null)], [], [videoAsset]), 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(true)
    expect(markenDoppel.aufrufe).toEqual([])
  })

  it('drei Baender: EIN Aufruf, alle Abschnitte bekommen dieselbe Standardmarke', async () => {
    const antwort = await loeseRenderAus(projekt([band('e1'), band('e2'), band('e3')], [AKTION_OK], [bildAsset]), 'sommer', marke(), [...VORLAGEN_OK, bandVorlage], null)
    expect(antwort.ok).toBe(true)
    expect(markenDoppel.aufrufe).toEqual(['m1'])
    const calls = vi.mocked(zeichneSegment).mock.calls
    expect(calls).toHaveLength(3)
    for (const call of calls) expect(call[3]).toBe(standardMarke)
  })

  it('stelleMarkeBereit scheitert -> marke_nicht_ladbar, kein PNG, kein Einreihen', async () => {
    markenDoppel.antwort = { ok: false, fehler: { code: 'marke_nicht_gefunden', meldung: 'fehlt' } }
    const antwort = await loeseRenderAus(projekt([band('e1')], [AKTION_OK], [bildAsset]), 'sommer', marke(), [...VORLAGEN_OK, bandVorlage], null)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) expect(antwort.fehler.code).toBe('marke_nicht_ladbar')
    expect(vi.mocked(alsPng)).not.toHaveBeenCalled()
    expect(doppel.aufrufe).toHaveLength(0)
  })
})

describe('loeseRenderAus (#316) - die Farbe reist eingefroren im Auftrag', () => {
  const bandVorlage = { id: 'band-1', name: 'band', art: 'split' as const, höhe: 162, parent: null, eingebaut: true, zonen: [] }
  const bildAsset = { id: 'bild-1', typ: 'bild' as const, dateiname: 'aa.png', originalname: 'aa', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' as const }
  const band = (id: string) => video(id, 'bild-1', { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 5 }] }, 0, 10)

  /** Die `einblendung`-Objekte des EINGEREIHTEN Auftrags - ohne `null`-Elemente. */
  function bandFarben(): Array<{ flaecheDunkel?: string }> {
    const nutzlast = doppel.aufrufe[0]?.nutzlast as {
      payload: { elemente: Array<{ einblendung: { flaecheDunkel?: string } | null }> }
    }
    return nutzlast.payload.elemente.flatMap((element) => (element.einblendung === null ? [] : [element.einblendung]))
  }

  it('nimmt die Farbe der PROJEKT-Standardmarke - NICHT die der Inhaltsmarke', async () => {
    markenDoppel.antwort = { ok: true, wert: markeMit('#010203') }
    const antwort = await loeseRenderAus(
      projekt([band('e1')], [AKTION_OK], [bildAsset]),
      'sommer',
      markeMit('#0A0B0C'),
      [...VORLAGEN_OK, bandVorlage],
    null)
    expect(antwort.ok).toBe(true)
    // Zwei unterscheidbare Werte: Der Rahmen gewinnt (TK 9.15.4). Der Parameter
    // `marke` traegt den INHALT und wechselt mit jeder rotierenden Aktion -
    // ihn zu nehmen waere der stille Fehler, den der Typecheck nicht sieht.
    expect(bandFarben()[0]?.flaecheDunkel).toBe('#010203')
    expect(bandFarben()[0]?.flaecheDunkel).not.toBe('#0A0B0C')
  })

  it('drei Band-Elemente tragen DENSELBEN Wert; stelleMarkeBereit bleibt bei EINEM Aufruf', async () => {
    markenDoppel.antwort = { ok: true, wert: markeMit('#112233') }
    await loeseRenderAus(
      projekt([band('e1'), band('e2'), band('e3')], [AKTION_OK], [bildAsset]),
      'sommer',
      markeMit('#445566'),
      [...VORLAGEN_OK, bandVorlage],
    null)
    expect(markenDoppel.aufrufe).toEqual(['m1'])
    expect(bandFarben().map((e) => e.flaecheDunkel)).toEqual(['#112233', '#112233', '#112233'])
  })

  it('reicht den Wert ZEICHENGLEICH durch - kein Grossschreiben, kein Kuerzen, kein 0x', async () => {
    markenDoppel.antwort = { ok: true, wert: markeMit('#2f2e2eAA') }
    await loeseRenderAus(projekt([band('e1')], [AKTION_OK], [bildAsset]), 'sommer', marke(), [...VORLAGEN_OK, bandVorlage], null)
    // Die Umrechnung nach `0xRRGGBB` macht `markenFarbeZuFfmpeg` - die EINZIGE
    // Umrechnung im Projekt. Hier wird nur durchgereicht (TK 9.2.8).
    expect(bandFarben()[0]?.flaecheDunkel).toBe('#2f2e2eAA')
  })
})

describe('loeseRenderAus (#435) - unterbrochenes Video', () => {
  const videoAsset = {
    id: 'v1', typ: 'video' as const, dateiname: 'aa.mp4', originalname: 'aa',
    maße: { breite: 10, höhe: 10 }, dauer: 12, importdatum: 'x', zustand: 'ok' as const,
  } as never as Project['assets'][number]
  const bandVorlage = { id: 'band-1', name: 'band', art: 'split' as const, höhe: 162, parent: null, eingebaut: true, zonen: [] }

  function unterbrochen(unterbrechungen: Project['liste'][number]['unterbrechungen'], einblendung: Project['liste'][number]['einblendung'] = null) {
    return { ...video('e1', 'v1', einblendung, 2, 12), unterbrechungen }
  }

  function items(): Array<{ art: string; trimStart?: number; trimEnde?: number; dauer?: number; einblendung?: { abschnitte: Array<{ dauer: number }>; flaecheDunkel?: string } | null }> {
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { payload: { elemente: never } }
    return nutzlast.payload.elemente as never
  }

  it('ohne Unterbrechungen bleibt EIN Video-Item', async () => {
    await loeseRenderAus(projekt([unterbrochen([])], [AKTION_OK], [videoAsset]), 'sommer', marke(), VORLAGEN_OK, null)
    expect(items().map((i) => i.art)).toEqual(['video'])
  })

  it('zerlegt in Video-Teil · Aktion · Video-Teil an der Zeitstelle', async () => {
    const p = projekt([unterbrochen([{ zeitstelle: 3, aktionRef: 'a-1', dauer: 5 }])], [AKTION_OK], [videoAsset])
    const antwort = await loeseRenderAus(p, 'sommer', marke(), VORLAGEN_OK, null)
    expect(antwort.ok).toBe(true)
    const elemente = items()
    expect(elemente.map((i) => i.art)).toEqual(['video', 'segment', 'video'])
    expect(elemente[0]).toMatchObject({ trimStart: 2, trimEnde: 5 })
    expect(elemente[1]).toMatchObject({ dauer: 5 })
    expect(elemente[2]).toMatchObject({ trimStart: 5, trimEnde: 12 })
  })

  it('jeder Video-Teil traegt das Band in der zum Zeitpunkt gedrehten Phase', async () => {
    const einblendung = { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 4 }] }
    const p = projekt([unterbrochen([{ zeitstelle: 3, aktionRef: 'a-1', dauer: 5 }], einblendung)], [AKTION_OK], [videoAsset])
    const antwort = await loeseRenderAus(p, 'sommer', marke(), [...VORLAGEN_OK, bandVorlage], null)
    expect(antwort.ok).toBe(true)
    const elemente = items()
    // Teil 1 beginnt bei Phase 0 -> [4]; Teil 2 beginnt 3 s spaeter -> [1,3].
    expect(elemente[0]?.einblendung?.abschnitte.map((a) => a.dauer)).toEqual([4])
    expect(elemente[2]?.einblendung?.abschnitte.map((a) => a.dauer)).toEqual([1, 3])
  })

  it('jedes Video-Teilstueck traegt DENSELBEN eingefrorenen flaecheDunkel-Wert (#316)', async () => {
    // Das Band wird EINMAL gebaut (`baueBand`) und per Spread auf die Teilstuecke
    // verteilt. Der Wert muss deshalb an JEDEM Teil stehen - und der der
    // Projekt-Standardmarke sein, nicht der der Inhaltsmarke (TK 9.15.4).
    markenDoppel.antwort = { ok: true, wert: markeMit('#0f1e2d') }
    const einblendung = { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 4 }] }
    const p = projekt([unterbrochen([{ zeitstelle: 3, aktionRef: 'a-1', dauer: 5 }], einblendung)], [AKTION_OK], [videoAsset])
    const antwort = await loeseRenderAus(p, 'sommer', markeMit('#778899'), [...VORLAGEN_OK, bandVorlage], null)
    expect(antwort.ok).toBe(true)

    const elemente = items()
    expect(elemente.map((i) => i.art)).toEqual(['video', 'segment', 'video'])
    expect(elemente[0]?.einblendung?.flaecheDunkel).toBe('#0f1e2d')
    expect(elemente[2]?.einblendung?.flaecheDunkel).toBe('#0f1e2d')
    // Das Segment-Teilstueck (Einschub) traegt kein Band.
    expect(elemente[1]?.einblendung ?? null).toBeNull()
  })
})

describe('loeseExportAus (#134)', () => {
  it('reichtig e über queue:reiheEin, payload mit projektId/dateiname/zielPfad; kein Dialog', async () => {
    const antwort = await loeseExportAus('p-1', 'sommer.mp4', 'E:\\Stick')
    expect(antwort.ok).toBe(true)
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.queue.reiheEin,
        nutzlast: { art: 'export', payload: { projektId: 'p-1', dateiname: 'sommer.mp4', zielPfad: 'E:\\Stick' } },
      },
    ])
  })
})
