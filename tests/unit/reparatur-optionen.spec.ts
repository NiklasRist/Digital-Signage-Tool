// Verhaltenstests zu #133 - die Fix-Optionen je kaputter Stelle im composer.
//
// Der gefährlichste Fehler dieser Datei ist kein Absturz, sondern ein Griff auf die
// falsche EBENE: ein kaputter Band-Abschnitt, der wie ein kaputtes Listenelement
// behandelt wird. Deshalb prüfen die Tests durchgehend auch, was NICHT geschieht -
// welcher Kanal nicht gerufen wird, wann `gleicheElementAb` ausbleibt und dass der
// übergebene Projektstand unverändert zurückbleibt.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Einblendung, Listenelement, Project } from '../../src/shared/contracts/project'
import { KANAELE } from '../../src/shared/contracts/kanaele'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  entfernAufrufe: [] as string[],
  entfernAntwort: null as unknown,
  abgeglichen: [] as Listenelement[],
  sicht: null as import('../../src/shared/contracts/project').Project | null,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/composer/element-entfernen', () => ({
  entferneElementAusListe: async (elementId: string) => {
    doppel.entfernAufrufe.push(elementId)
    return doppel.entfernAntwort
  },
}))

// #421: Die Reparatur-Kette schreibt die Sicht jetzt ueber den sichtSchreiber (holeSicht +
// Wrapped-setzeListe), NICHT mehr ueber gleicheElementAb. Das Doppel liefert die Sicht und
// der Test reicht einen Schreiber hinein, der die geschriebenen Elemente mitschreibt.
vi.mock('../../src/renderer/composer/projektzustand', () => ({
  holeSicht: () => ({ projekt: doppel.sicht, ladefehler: null }),
}))

import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import {
  fuehreFixAus,
  optionenFuer,
  schliesseAbschnittsFixAb,
  schliesseAktionsFixAb,
  schliesseMediumFixAb,
} from '../../src/renderer/composer/reparatur-optionen'

/** #421: Der Pflicht-Schreiber. Er schreibt die uebergebene Liste mit; `abgeglichen`
 *  sammelt die Elemente - so bleiben die Zusicherungen „[ANTWORT_ELEMENT]" gueltig. */
const schreibe = (liste: Listenelement[]): void => {
  for (const element of liste) doppel.abgeglichen.push(element)
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

const BAND: Einblendung = {
  bandVorlageId: 'vorlage-band',
  abschnitte: [
    { aktionRef: 'aktion-a', dauer: 10 },
    { aktionRef: 'aktion-b', dauer: 15 },
    { aktionRef: 'aktion-c', dauer: 20 },
  ],
}

function video(id: string, einblendung: Einblendung | null): Listenelement {
  return { id, art: 'video', ref: 'asset-video', dauer: null, trimStart: 2, trimEnde: 8, einblendung }
}

function projektMit(...elemente: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Projekt',
    erstelltAm: '2026-08-15T00:00:00.000Z',
    geaendertAm: '2026-08-15T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: elemente,
    letzterAusgabeName: null,
    standardMarkeId: "marke-test",
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }
}

const STELLE_ASSET: KaputteStelle = {
  art: 'element_asset',
  elementId: 'el-1',
  assetId: 'asset-weg',
  grund: 'asset_fehlt',
}

const STELLE_AKTION: KaputteStelle = {
  art: 'element_aktion',
  elementId: 'el-2',
  aktionId: 'aktion-x',
  assetId: 'asset-weg',
  grund: 'asset_fehlt',
}

const STELLE_ABSCHNITT: KaputteStelle = {
  art: 'band_abschnitt',
  elementId: 'el-3',
  abschnittIndex: 1,
  aktionId: 'aktion-b',
  assetId: 'asset-weg',
  grund: 'asset_fehlt',
}

/** Ein `Listenelement`, wie es der Main nach einer Mutation zurückgibt. */
const ANTWORT_ELEMENT: Listenelement = video('el-3', {
  bandVorlageId: 'vorlage-band',
  abschnitte: [{ aktionRef: 'aktion-neu', dauer: 15 }],
})

function erfolg(): void {
  doppel.antwort = { ok: true, wert: ANTWORT_ELEMENT }
}

function ablehnung(code: string): void {
  doppel.antwort = { ok: false, fehler: { code, meldung: 'abgelehnt', daten: { x: 1 } } }
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = { ok: true, wert: ANTWORT_ELEMENT }
  doppel.entfernAufrufe = []
  doppel.entfernAntwort = { ok: true, wert: undefined }
  doppel.abgeglichen = []
  // #421: Die Sicht traegt das Element schon (sendeUndGleicheAb ERSETZT es nur - nichts
  // wird angehaengt). el-3 trifft die id von ANTWORT_ELEMENT.
  doppel.sicht = projektMit(video('el-3', BAND))
})

// ---------------------------------------------------------------------------
// optionenFuer
// ---------------------------------------------------------------------------

describe('optionenFuer', () => {
  it('liefert je Stellen-Art exakt die Tabelle aus TK 9.7.5, in Anzeigereihenfolge', () => {
    expect(optionenFuer(STELLE_ASSET)).toEqual([
      'medium_neu_verknuepfen',
      'medium_ersetzen',
      'element_entfernen',
    ])
    expect(optionenFuer(STELLE_AKTION)).toEqual([
      'aktionsbild_reparieren',
      'aktion_ersetzen',
      'element_entfernen',
    ])
    expect(optionenFuer(STELLE_ABSCHNITT)).toEqual([
      'aktionsbild_reparieren',
      'abschnitt_ersetzen',
      'abschnitt_entfernen',
    ])
  })

  it('bietet bei einem Band-Abschnitt NIE element_entfernen an - das Video ist einwandfrei', () => {
    expect(optionenFuer(STELLE_ABSCHNITT)).not.toContain('element_entfernen')
  })

  it('stellt aktionsbild_reparieren voran, weil nur es alle Verwendungen auf einmal behebt', () => {
    expect(optionenFuer(STELLE_AKTION)[0]).toBe('aktionsbild_reparieren')
    expect(optionenFuer(STELLE_ABSCHNITT)[0]).toBe('aktionsbild_reparieren')
  })

  it('liefert bei unbekannter Stellen-Art eine leere Liste', () => {
    const fremd = { art: 'kuenftig', elementId: 'el-9' } as unknown as KaputteStelle
    expect(optionenFuer(fremd)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// fuehreFixAus - die fünf Übergaben
// ---------------------------------------------------------------------------

describe('fuehreFixAus - Übergaben', () => {
  it('medium_neu_verknuepfen trägt die elementId der kaputten Stelle mit', async () => {
    const ergebnis = await fuehreFixAus(STELLE_ASSET, 'medium_neu_verknuepfen', projektMit(), schreibe)
    expect(ergebnis).toEqual({
      ok: true,
      wert: { art: 'uebergabe', an: { ziel: 'medien-import', elementId: 'el-1' } },
    })
  })

  it('medium_ersetzen übergibt an die Asset-Auswahl', async () => {
    const ergebnis = await fuehreFixAus(STELLE_ASSET, 'medium_ersetzen', projektMit(), schreibe)
    expect(ergebnis).toEqual({
      ok: true,
      wert: { art: 'uebergabe', an: { ziel: 'asset-auswahl', elementId: 'el-1' } },
    })
  })

  it('aktionsbild_reparieren übergibt bei beiden Aktions-Fällen an den action-editor', async () => {
    expect(await fuehreFixAus(STELLE_AKTION, 'aktionsbild_reparieren', projektMit(), schreibe)).toEqual({
      ok: true,
      wert: { art: 'uebergabe', an: { ziel: 'action-editor', aktionId: 'aktion-x' } },
    })
    expect(await fuehreFixAus(STELLE_ABSCHNITT, 'aktionsbild_reparieren', projektMit(), schreibe)).toEqual({
      ok: true,
      wert: { art: 'uebergabe', an: { ziel: 'action-editor', aktionId: 'aktion-b' } },
    })
  })

  it('aktion_ersetzen meldet die Listenelement-Ebene über abschnittIndex null', async () => {
    expect(await fuehreFixAus(STELLE_AKTION, 'aktion_ersetzen', projektMit(), schreibe)).toEqual({
      ok: true,
      wert: {
        art: 'uebergabe',
        an: { ziel: 'aktions-auswahl', elementId: 'el-2', abschnittIndex: null },
      },
    })
  })

  it('abschnitt_ersetzen meldet die Band-Ebene über den Index', async () => {
    expect(await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_ersetzen', projektMit(), schreibe)).toEqual({
      ok: true,
      wert: {
        art: 'uebergabe',
        an: { ziel: 'aktions-auswahl', elementId: 'el-3', abschnittIndex: 1 },
      },
    })
  })

  it('löst bei keiner der fünf Übergaben IPC aus und entfernt nichts', async () => {
    const projekt = projektMit(video('el-3', BAND))
    await fuehreFixAus(STELLE_ASSET, 'medium_neu_verknuepfen', projekt, schreibe)
    await fuehreFixAus(STELLE_ASSET, 'medium_ersetzen', projekt, schreibe)
    await fuehreFixAus(STELLE_AKTION, 'aktionsbild_reparieren', projekt, schreibe)
    await fuehreFixAus(STELLE_AKTION, 'aktion_ersetzen', projekt, schreibe)
    await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_ersetzen', projekt, schreibe)

    expect(doppel.aufrufe).toEqual([])
    expect(doppel.entfernAufrufe).toEqual([])
    expect(doppel.abgeglichen).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// fuehreFixAus - element_entfernen
// ---------------------------------------------------------------------------

describe('fuehreFixAus - element_entfernen', () => {
  it('läuft ausschließlich über #124 und ruft KEINEN Kanal direkt', async () => {
    const ergebnis = await fuehreFixAus(STELLE_ASSET, 'element_entfernen', projektMit(), schreibe)
    expect(ergebnis).toEqual({ ok: true, wert: { art: 'erledigt' } })
    expect(doppel.entfernAufrufe).toEqual(['el-1'])
    expect(doppel.aufrufe).toEqual([])
  })

  it('reicht den Fehler von #124/#42 unverändert durch', async () => {
    doppel.entfernAntwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'weg' } }
    const ergebnis = await fuehreFixAus(STELLE_AKTION, 'element_entfernen', projektMit(), schreibe)
    expect(ergebnis).toEqual({ ok: false, fehler: { code: 'nicht_gefunden', meldung: 'weg' } })
  })
})

// ---------------------------------------------------------------------------
// fuehreFixAus - abschnitt_entfernen
// ---------------------------------------------------------------------------

describe('fuehreFixAus - abschnitt_entfernen', () => {
  it('sendet ein um genau einen Eintrag kürzeres Band mit unveränderter bandVorlageId', async () => {
    const projekt = projektMit(video('el-3', BAND))
    const ergebnis = await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', projekt, schreibe)

    expect(ergebnis).toEqual({ ok: true, wert: { art: 'erledigt' } })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeEinblendung,
        nutzlast: {
          elementId: 'el-3',
          einblendung: {
            bandVorlageId: 'vorlage-band',
            abschnitte: [
              { aktionRef: 'aktion-a', dauer: 10 },
              { aktionRef: 'aktion-c', dauer: 20 },
            ],
          },
        },
      },
    ])
    expect(doppel.abgeglichen).toEqual([ANTWORT_ELEMENT])
  })

  it('sendet beim letzten Abschnitt null - das Videoelement bleibt (TK 9.5.3)', async () => {
    const einzeln: Einblendung = { bandVorlageId: 'v1', abschnitte: [{ aktionRef: 'a', dauer: 9 }] }
    const stelle: KaputteStelle = { ...STELLE_ABSCHNITT, abschnittIndex: 0 }
    await fuehreFixAus(stelle, 'abschnitt_entfernen', projektMit(video('el-3', einzeln)), schreibe)

    expect(doppel.aufrufe).toEqual([
      { kanal: KANAELE.project.setzeEinblendung, nutzlast: { elementId: 'el-3', einblendung: null } },
    ])
  })

  it('verändert weder das Projekt noch das ursprüngliche Abschnitts-Array', async () => {
    const band: Einblendung = { bandVorlageId: 'v1', abschnitte: [...BAND.abschnitte] }
    const projekt = projektMit(video('el-3', band))
    const vorher = JSON.stringify(projekt)

    await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', projekt, schreibe)

    expect(JSON.stringify(projekt)).toBe(vorher)
    expect(band.abschnitte).toHaveLength(3)
  })

  it('meldet nicht_gefunden bei unbekanntem Element, fehlender Einblendung und Index außerhalb', async () => {
    const ohneElement = projektMit()
    expect(await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', ohneElement, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })

    const ohneBand = projektMit(video('el-3', null))
    expect(await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', ohneBand, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })

    const kurz = projektMit(video('el-3', { bandVorlageId: 'v1', abschnitte: [{ aktionRef: 'a', dauer: 5 }] }))
    expect(await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', kurz, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })

    expect(doppel.aufrufe).toEqual([])
  })

  it('reicht die Ablehnung von #120 unverändert durch, ohne die Sicht anzufassen', async () => {
    ablehnung('speicher_fehler')
    const ergebnis = await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', projektMit(video('el-3', BAND)), schreibe)
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'abgelehnt', daten: { x: 1 } },
    })
    expect(doppel.abgeglichen).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Unpassende Kombinationen
// ---------------------------------------------------------------------------

describe('fuehreFixAus - Option passt nicht zur Stelle', () => {
  it('lehnt abschnitt_entfernen auf einer element_asset-Stelle ohne jede Wirkung ab', async () => {
    const ergebnis = await fuehreFixAus(STELLE_ASSET, 'abschnitt_entfernen', projektMit(video('el-1', BAND)), schreibe)
    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: 'ungueltige_eingabe' } })
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.entfernAufrufe).toEqual([])
  })

  it('lehnt element_entfernen auf einem Band-Abschnitt ab - das Video wird nie entfernt', async () => {
    const ergebnis = await fuehreFixAus(STELLE_ABSCHNITT, 'element_entfernen', projektMit(video('el-3', BAND)), schreibe)
    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: 'ungueltige_eingabe' } })
    expect(doppel.entfernAufrufe).toEqual([])
  })

  it('lehnt bei unbekannter Stellen-Art jede Option ab', async () => {
    const fremd = { art: 'kuenftig', elementId: 'el-9' } as unknown as KaputteStelle
    expect(await fuehreFixAus(fremd, 'medium_ersetzen', projektMit(), schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
  })
})

// ---------------------------------------------------------------------------
// schliesseMediumFixAb / schliesseAktionsFixAb
// ---------------------------------------------------------------------------

describe('schliesseMediumFixAb', () => {
  it('ruft setzeElementReferenz genau einmal mit { elementId, referenz } und gleicht ab', async () => {
    const ergebnis = await schliesseMediumFixAb('el-1', 'asset-neu', schreibe)
    expect(ergebnis).toEqual({ ok: true, wert: { art: 'erledigt' } })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeElementReferenz,
        nutzlast: { elementId: 'el-1', referenz: 'asset-neu' },
      },
    ])
    expect(doppel.abgeglichen).toEqual([ANTWORT_ELEMENT])
  })

  it('gleicht bei ok: false NICHT ab und reicht den Code unverändert durch', async () => {
    ablehnung('nicht_gefunden')
    const ergebnis = await schliesseMediumFixAb('el-1', 'asset-neu', schreibe)
    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: 'nicht_gefunden', daten: { x: 1 } } })
    expect(doppel.abgeglichen).toEqual([])
  })

  it('lehnt leere Kennungen ohne IPC-Aufruf ab', async () => {
    for (const [a, b] of [['', 'asset'], ['el', ''], ['  ', 'asset']] as const) {
      expect(await schliesseMediumFixAb(a, b, schreibe)).toMatchObject({
        ok: false,
        fehler: { code: 'ungueltige_eingabe' },
      })
    }
    expect(doppel.aufrufe).toEqual([])
  })
})

describe('schliesseAktionsFixAb', () => {
  it('ruft denselben Kanal mit der AKTIONS-ID als referenz', async () => {
    const ergebnis = await schliesseAktionsFixAb('el-2', 'aktion-neu', schreibe)
    expect(ergebnis).toEqual({ ok: true, wert: { art: 'erledigt' } })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeElementReferenz,
        nutzlast: { elementId: 'el-2', referenz: 'aktion-neu' },
      },
    ])
    expect(doppel.abgeglichen).toEqual([ANTWORT_ELEMENT])
  })

  it('gleicht bei ok: false NICHT ab', async () => {
    ablehnung('nicht_gefunden')
    expect(await schliesseAktionsFixAb('el-2', 'aktion-neu', schreibe)).toMatchObject({ ok: false })
    expect(doppel.abgeglichen).toEqual([])
  })

  it('lehnt leere Kennungen ohne IPC-Aufruf ab', async () => {
    expect(await schliesseAktionsFixAb('', 'aktion', schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(await schliesseAktionsFixAb('el-2', '', schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(doppel.aufrufe).toEqual([])
  })

  it('ist zusammen mit aktion_ersetzen keine Sackgasse mehr', async () => {
    const uebergabe = await fuehreFixAus(STELLE_AKTION, 'aktion_ersetzen', projektMit(), schreibe)
    expect(uebergabe).toMatchObject({
      ok: true,
      wert: { an: { ziel: 'aktions-auswahl', elementId: 'el-2', abschnittIndex: null } },
    })
    erfolg()
    expect(await schliesseAktionsFixAb('el-2', 'aktion-neu', schreibe)).toEqual({
      ok: true,
      wert: { art: 'erledigt' },
    })
  })
})

// ---------------------------------------------------------------------------
// schliesseAbschnittsFixAb
// ---------------------------------------------------------------------------

describe('schliesseAbschnittsFixAb', () => {
  it('tauscht genau einen Eintrag aus - gleiche Länge, gleiche dauer, gleiche bandVorlageId', async () => {
    const projekt = projektMit(video('el-3', BAND))
    const ergebnis = await schliesseAbschnittsFixAb('el-3', 1, 'aktion-neu', projekt, schreibe)

    expect(ergebnis).toEqual({ ok: true, wert: { art: 'erledigt' } })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeEinblendung,
        nutzlast: {
          elementId: 'el-3',
          einblendung: {
            bandVorlageId: 'vorlage-band',
            abschnitte: [
              { aktionRef: 'aktion-a', dauer: 10 },
              { aktionRef: 'aktion-neu', dauer: 15 },
              { aktionRef: 'aktion-c', dauer: 20 },
            ],
          },
        },
      },
    ])
    expect(doppel.abgeglichen).toEqual([ANTWORT_ELEMENT])
  })

  it('sendet nie einblendung null - auch nicht bei einem Band mit nur einem Abschnitt', async () => {
    const einzeln: Einblendung = { bandVorlageId: 'v1', abschnitte: [{ aktionRef: 'a', dauer: 9 }] }
    await schliesseAbschnittsFixAb('el-3', 0, 'aktion-neu', projektMit(video('el-3', einzeln)), schreibe)

    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeEinblendung,
        nutzlast: {
          elementId: 'el-3',
          einblendung: { bandVorlageId: 'v1', abschnitte: [{ aktionRef: 'aktion-neu', dauer: 9 }] },
        },
      },
    ])
  })

  it('verändert weder das Projekt noch das ursprüngliche Abschnitts-Array', async () => {
    const band: Einblendung = { bandVorlageId: 'v1', abschnitte: [...BAND.abschnitte] }
    const projekt = projektMit(video('el-3', band))
    const vorher = JSON.stringify(projekt)

    await schliesseAbschnittsFixAb('el-3', 1, 'aktion-neu', projekt, schreibe)

    expect(JSON.stringify(projekt)).toBe(vorher)
    expect(band.abschnitte[1]).toEqual({ aktionRef: 'aktion-b', dauer: 15 })
  })

  it('lehnt leere Kennungen und einen ungültigen Index ohne IPC-Aufruf ab', async () => {
    const projekt = projektMit(video('el-3', BAND))
    expect(await schliesseAbschnittsFixAb('', 1, 'a', projekt, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(await schliesseAbschnittsFixAb('el-3', 1, '', projekt, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(await schliesseAbschnittsFixAb('el-3', -1, 'a', projekt, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(await schliesseAbschnittsFixAb('el-3', 1.5, 'a', projekt, schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'ungueltige_eingabe' },
    })
    expect(doppel.aufrufe).toEqual([])
  })

  it('meldet nicht_gefunden bei unbekanntem Element, fehlender Einblendung und Index außerhalb', async () => {
    expect(await schliesseAbschnittsFixAb('el-x', 0, 'a', projektMit(), schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })
    expect(await schliesseAbschnittsFixAb('el-3', 0, 'a', projektMit(video('el-3', null)), schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })
    expect(await schliesseAbschnittsFixAb('el-3', 3, 'a', projektMit(video('el-3', BAND)), schreibe)).toMatchObject({
      ok: false,
      fehler: { code: 'nicht_gefunden' },
    })
    expect(doppel.aufrufe).toEqual([])
  })

  it('reicht die Ablehnung von #120 unverändert durch, ohne abzugleichen', async () => {
    ablehnung('speicher_fehler')
    const ergebnis = await schliesseAbschnittsFixAb('el-3', 1, 'a', projektMit(video('el-3', BAND)), schreibe)
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'abgelehnt', daten: { x: 1 } },
    })
    expect(doppel.abgeglichen).toEqual([])
  })

  it('ist zusammen mit abschnitt_ersetzen keine Sackgasse mehr', async () => {
    const projekt = projektMit(video('el-3', BAND))
    const uebergabe = await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_ersetzen', projekt, schreibe)
    expect(uebergabe).toMatchObject({
      ok: true,
      wert: { an: { ziel: 'aktions-auswahl', elementId: 'el-3', abschnittIndex: 1 } },
    })
    erfolg()
    expect(await schliesseAbschnittsFixAb('el-3', 1, 'aktion-neu', projekt, schreibe)).toEqual({
      ok: true,
      wert: { art: 'erledigt' },
    })
  })
})

// ---------------------------------------------------------------------------
// Die Ebenen-Grenze: der Band-Abschnitt fasst setzeElementReferenz NIE an
// ---------------------------------------------------------------------------

describe('Ebenen-Grenze Fall 3', () => {
  it('ruft bei abschnitt_ersetzen, abschnitt_entfernen und schliesseAbschnittsFixAb nie setzeElementReferenz', async () => {
    const projekt = projektMit(video('el-3', BAND))
    await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_ersetzen', projekt, schreibe)
    await fuehreFixAus(STELLE_ABSCHNITT, 'abschnitt_entfernen', projekt, schreibe)
    await schliesseAbschnittsFixAb('el-3', 1, 'aktion-neu', projekt, schreibe)

    const referenzAufrufe = doppel.aufrufe.filter(
      (aufruf) => aufruf.kanal === KANAELE.project.setzeElementReferenz,
    )
    expect(referenzAufrufe).toEqual([])
    expect(doppel.aufrufe.every((aufruf) => aufruf.kanal === KANAELE.project.setzeEinblendung)).toBe(true)
  })
})
