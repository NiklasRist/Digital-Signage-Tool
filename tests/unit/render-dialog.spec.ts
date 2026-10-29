// Verhaltenstests zu #231 (M7-38) - render-dialog.ts (die reine Seite).
// render-dialog.tsx (die Anzeige) folgt als jsdom-Test in einer eigenen Datei.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loeseRenderMitNamenAus,
  pruefeAusgabeName,
  pruefeUeberschreiben,
  vorbelegterName,
} from '../../src/renderer/composer/render-dialog'

import type { Project } from '../../src/shared/contracts/project'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { AusgabeDatei } from '../../src/renderer/composer/ausgabe-liste'

// ---------------- Bausteine ----------------

function projekt(letzterAusgabeName: string | null): Project {
  return {
    id: 'p-1',
    name: 'Probe-Projekt',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

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

describe.each`
  eingabe        | erwartet                      | fall
  ${'sommeraktion'} | ${'ok'}                  | ${'normaler Name'}
  ${'Sommer 2026'}  | ${'ok'}                  | ${'Leerzeichen'}
  ${'aktion-1'}     | ${'ok'}                  | ${'Bindestrich'}
  ${''}             | ${'leer'}                | ${'leer'}
  ${'   '}          | ${'leer'}                | ${'nur Leerzeichen'}
  ${'a/b'}          | ${'pfadtrenner'}         | ${'Schrägstrich'}
  ${'a\\b'}         | ${'pfadtrenner'}         | ${'Backslash'}
  ${'../../config'} | ${'punkt_punkt'}         | ${'Ausbruch'}
  ${'a<b'}          | ${'unzulaessiges_zeichen'}| ${'kleiner'}
  ${'a:b'}          | ${'unzulaessiges_zeichen'}| ${'Doppelpunkt'}
  ${'a|b'}          | ${'unzulaessiges_zeichen'}| ${'Verkettung'}
  ${'a?b'}          | ${'unzulaessiges_zeichen'}| ${'Fragezeichen'}
  ${'a*b'}          | ${'unzulaessiges_zeichen'}| ${'Stern'}
  ${'a"b'}          | ${'unzulaessiges_zeichen'}| ${'Anführungszeichen'}
  ${'a\x01b'}       | ${'unzulaessiges_zeichen'}| ${'Steuerzeichen'}
  ${'a\x7fb'}       | ${'unzulaessiges_zeichen'}| ${'DEL (U+007F)'}
  ${'CON'}          | ${'reservierter_name'}   | ${'CON'}
  ${'con'}          | ${'reservierter_name'}   | ${'con (Kleinschreibung)'}
  ${'COM1'}         | ${'reservierter_name'}   | ${'COM1'}
  ${'LPT9'}         | ${'reservierter_name'}   | ${'LPT9'}
  ${'NUL'}          | ${'reservierter_name'}   | ${'NUL'}
  ${'sommer.mp4'}   | ${'endung_angegeben'}    | ${'Endung'}
  ${'sommer.MP4'}   | ${'endung_angegeben'}    | ${'Endung (Groß)'}
`('pruefeAusgabeName (#231): $fall -> $erwartet', ({ eingabe, erwartet }: { eingabe: string; erwartet: string }) => {
  it('pruefeAusgabeName', () => {
    expect(pruefeAusgabeName(eingabe)).toBe(erwartet)
  })
})

describe('vorbelegterName (#231)', () => {
  it('liefert letztenAusgabeName UNVERAENDERT', () => {
    expect(vorbelegterName(projekt('sommer'))).toBe('sommer')
  })

  it('liefert null, wenn es null ist - NIE einen erfundenen Namen', () => {
    expect(vorbelegterName(projekt(null))).toBeNull()
  })
})

describe('pruefeUeberschreiben (#231)', () => {
  const bestand: AusgabeDatei[] = [
    { dateiname: 'sommer.mp4', dateigroesse: 12345678, geaendertAm: '2026-08-04T14:12:00Z' },
  ]

  it('passt -> ersetzt true, die vorhandene Datei, Hinweis enthält das Datum der Fassung', () => {
    const lage = pruefeUeberschreiben('sommer', bestand)
    expect(lage.ersetzt).toBe(true)
    expect(lage.vorhandene).toBe(bestand[0])
    // Format: "Ersetzt die Fassung vom <Datum der lokalen Zeitzone>." - je nach
    // Wirtslokale unterschiedlich geschrieben; geprueft wird der Satz und ein Datum.
    expect(lage.hinweis).toContain('Ersetzt die Fassung vom')
    expect(lage.hinweis).toMatch(/\d/)
  })

  it('kleingeschrieben passt NICHT (buchstabengleicher Vergleich)', () => {
    expect(pruefeUeberschreiben('sommer', [{ dateiname: 'Sommer.mp4', dateigroesse: 1, geaendertAm: '2026-08-04T14:12:00Z' }]).ersetzt).toBe(false)
  })

  it('der Hinweis ist KEINE Frage und keine Aufforderung', () => {
    const lage = pruefeUeberschreiben('sommer', bestand)
    expect(lage.hinweis).not.toContain('?')
    expect(lage.hinweis.toLowerCase()).not.toContain('wirklich')
    expect(lage.hinweis.toLowerCase()).not.toContain('möchtest')
  })

  it('bei ersetzt: false ist der Hinweis leer', () => {
    const lage = pruefeUeberschreiben('andere', bestand)
    expect(lage.ersetzt).toBe(false)
    expect(lage.hinweis).toBe('')
    expect(lage.vorhandene).toBeNull()
  })

  it('unbrauchbares geaendertAm -> ersetzt bleibt true, das Datum fällt als Streich aus', () => {
    const lage = pruefeUeberschreiben(
      'sommer',
      [{ dateiname: 'sommer.mp4', dateigroesse: 1, geaendertAm: 'unbrauchbar' }],
    )
    expect(lage.ersetzt).toBe(true)
    expect(lage.hinweis).toContain('Ersetzt die Fassung vom')
    expect(lage.hinweis).toContain('—')
  })
})

// ---------------- Doppel für den Auslöse-Ablauf ----------------

function baueWirkungen(
  antwort: unknown,
  starte: ReturnType<typeof vi.fn<() => void>>,
  melde: ReturnType<typeof vi.fn<(code: string, meldung: string) => void>>,
): unknown {
  return {
    loeseRenderAus: vi.fn(async () => antwort),
    starteReparaturModus: starte,
    meldeFehler: melde,
  }
}

const VORLAGEN = [] as unknown as readonly Vorlage[]
const M = marke() as Marke

describe('loeseRenderMitNamenAus (#231)', () => {
  let starte: ReturnType<typeof vi.fn<() => void>>
  let melde: ReturnType<typeof vi.fn<(code: string, meldung: string) => void>>

  beforeEach(() => {
    starte = vi.fn<() => void>()
    melde = vi.fn<(code: string, meldung: string) => void>()
  })

  async function laufe(mitAntwort: unknown): Promise<ReturnType<typeof loeseRenderMitNamenAus>> {
    const p = projekt('x')
    const wirk = baueWirkungen(mitAntwort, starte, melde)
    return loeseRenderMitNamenAus(p, 'sommer', M, VORLAGEN, wirk as never)
  }

  it('reicht projekt, ausgabeName, marke, vorlagen UNVERAENDERT an loeseRenderAus', async () => {
    const p = projekt('x')
    const wirk = baueWirkungen({ ok: true, wert: { auftragId: 'q-1' } }, starte, melde) as { loeseRenderAus: { mock: { calls: unknown[][] } } }
    await loeseRenderMitNamenAus(p, 'sommer', M, VORLAGEN, wirk as never)
    const ruf = wirk.loeseRenderAus.mock.calls[0]
    expect(ruf?.[0]).toBe(p)
    expect(ruf?.[1]).toBe('sommer')
    expect(ruf?.[2]).toBe(M)
    expect(ruf?.[3]).toBe(VORLAGEN)
  })

  it('ok: true -> { art: eingereiht, auftragId } - und NICHTS folgt (kein Warten, kein Auffrischen)', async () => {
    const ergebnis = await laufe({ ok: true, wert: { auftragId: 'q-9' } })
    expect(ergebnis).toEqual({ art: 'eingereiht', auftragId: 'q-9' })
    expect(starte).not.toHaveBeenCalled()
    expect(melde).not.toHaveBeenCalled()
  })

  it("kaputte_elemente -> starteReparaturModus GENAU EINMAL, kein meldeFehler, { art: 'reparatur' }", async () => {
    const ergebnis = await laufe({
      ok: false,
      fehler: { code: 'kaputte_elemente', meldung: '3 kaputte Stellen', daten: { stellen: [] } },
    })
    expect(ergebnis).toEqual({ art: 'reparatur' })
    expect(starte).toHaveBeenCalledTimes(1)
    expect(melde).not.toHaveBeenCalled()
  })

  it('png_export_fehler -> meldeFehler mit UNVERAENDERTEN Code, kein starteReparaturModus', async () => {
    const ergebnis = await laufe({
      ok: false,
      fehler: { code: 'png_export_fehler', meldung: 'engine kaputt', daten: undefined },
    })
    expect(ergebnis).toEqual({ art: 'abgelehnt', code: 'png_export_fehler' })
    expect(melde).toHaveBeenCalledWith('png_export_fehler', 'engine kaputt')
    expect(starte).not.toHaveBeenCalled()
  })

  it('ein anderer Main-Code -> UNVERAENDERT abgelehnt', async () => {
    const ergebnis = await laufe({
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'vom Main', daten: undefined },
    })
    expect(ergebnis).toEqual({ art: 'abgelehnt', code: 'ungueltige_eingabe' })
    expect(melde).toHaveBeenCalledWith('ungueltige_eingabe', 'vom Main')
  })

  it('wirft loeseRenderAus -> gefangen, meldeFehler(unbekannter_fehler), { art: abgelehnt }', async () => {
    const p = projekt('x')
    const wirk: { loeseRenderAus: unknown; starteReparaturModus: unknown; meldeFehler: unknown } = {
      loeseRenderAus: async () => {
        throw new Error('PNG geplatzt')
      },
      starteReparaturModus: starte,
      meldeFehler: melde,
    }
    const ergebnis = await loeseRenderMitNamenAus(p, 'sommer', M, VORLAGEN, wirk as never)
    expect(ergebnis).toEqual({ art: 'abgelehnt', code: 'unbekannter_fehler' })
    expect(melde).toHaveBeenCalledWith('unbekannter_fehler', 'PNG geplatzt')
  })

  it('wirft starteReparaturModus -> gefangen + gemeldet, Rueckgabe trotzdem reparatur', async () => {
    const p = projekt('x')
    const wirk: { loeseRenderAus: unknown; starteReparaturModus: unknown; meldeFehler: unknown } = {
      loeseRenderAus: async () => ({
        ok: false,
        fehler: { code: 'kaputte_elemente', meldung: 'x', daten: { stellen: [] } },
      }),
      starteReparaturModus: () => {
        throw new Error('Reparatur-Fuhrung weg')
      },
      meldeFehler: melde,
    }
    const ergebnis = await loeseRenderMitNamenAus(p, 'sommer', M, VORLAGEN, wirk as never)
    expect(ergebnis).toEqual({ art: 'reparatur' })
    expect(melde).toHaveBeenCalledWith('unbekannter_fehler', 'Reparatur-Fuhrung weg')
  })
})
