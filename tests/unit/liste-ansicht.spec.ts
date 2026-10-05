// Tests zu #248 (M7-55) - die reine Ableitung (liste-ansicht.ts, ohne Browser).
// `frameDauer`/`berechneGesamtlaenge` (#127) und `formatiereReglerDauer` (#249)
// werden NICHT ersetzt, sondern echt benutzt. Die Anzeige folgt als jsdom-Test.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { KaputteStelle, KaputtGrund } from '../../src/renderer/composer/kaputt-erkennung'
import type { ReparaturStand } from '../../src/renderer/composer/reparatur-fuehrung'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { WARNSCHWELLE_SEKUNDEN } from '../../src/renderer/composer/gesamtlaenge'
import {
  baueLaengenAnzeige,
  baueListenZeilen,
  baueReparaturAnzeige,
  BEZEICHNUNG_UNBEKANNT,
  DAUER_UNBEKANNT,
  findeThumbnailquelle,
  LEERE_MELDUNGSLAGE,
  nimmMeldungAuf,
  verwirfMeldung,
  zeilenIds,
} from '../../src/renderer/composer/liste-ansicht'
import { formatiereReglerDauer } from '../../src/renderer/composer/element-zeile'

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/composer/liste-ansicht.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('liste-ansicht.ts – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('kein JSX, kein react, kein dnd-kit, kein IPC, keine eigene Rundung/Schwelle', () => {
    for (const verbot of [
      'react', '@dnd-kit', 'rufeAuf', 'abonniere', 'KANAELE', 'window.', '1800',
      'Math.round', 'setTimeout',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
    // JSX-Muster: ein Tag in einer Codezeile (Generika wie Set<string> sind erlaubt).
    expect(CODEZEILEN).not.toMatch(/<(div|span|ul|li|p|img|canvas|button)\b/)
  })

  it('EIN Format je Zeile: formatiereLaenge wird NUR in baueLaengenAnzeige GERUFEN, formatiereReglerDauer nur in baueListenZeilen', () => {
    const aufrufe = QUELLE.split('\n').map((zeile, index) => ({ zeile, index })).filter(({ zeile }) => {
      const t = zeile.trim()
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false
      return /formatiere(Laenge|ReglerDauer)\(/.test(zeile)
    })
    expect(aufrufe.length).toBeGreaterThan(0)
    const definitionen = QUELLE.split('\n').filter((z) => z.startsWith('export function '))
    const letzteFunktionVor = (index: number): string => {
      const zeilen = QUELLE.split('\n')
      let letzte = ''
      for (let i = 0; i < index; i += 1) {
        if (zeilen[i]?.startsWith('export function ')) letzte = (zeilen[i] as string).replace(/\(.*/, '')
      }
      return letzte
    }
    for (const { zeile, index } of aufrufe) {
      const istLaengeAufruf = zeile.includes('formatiereLaenge(')
      const funktion = letzteFunktionVor(index)
      if (istLaengeAufruf) {
        expect(funktion).toBe('export function baueLaengenAnzeige')
      } else {
        expect(funktion).toBe('export function baueListenZeilen')
      }
    }
  })
})

// ---------------- Bausteine ----------------

function asset(id: string, original: string): Asset {
  return {
    id,
    typ: 'video',
    dateiname: `${id}-datei.mp4`,
    originalname: original,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 30.7,
    importdatum: '2026-08-01T09:00:00Z',
    zustand: 'ok',
  }
}

function aktion(id: string, titel: string): Aktion {
  return {
    id, titel, beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer: null, vorlagenId: 'vollbild', akzentfarbe: null,
  }
}

function element(id: string, art: Listenelement['art'], ref: string, ueber: Partial<Listenelement> = {}): Listenelement {
  return {
    id,
    art,
    ref,
    dauer: null,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
    ...ueber,
  }
}

function projekt(liste: Listenelement[], assets: Asset[] = [], aktionen: Aktion[] = []): Project {
  return {
    id: 'p-1',
    name: 'Probe',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets,
    aktionen,
    liste,
    standardSegmentdauer: 10,
    letzterAusgabeName: null,
  }
}

// ---------------- baueListenZeilen ----------------

describe('baueListenZeilen (#248)', () => {
  const assets = [asset('a-1', 'Aufwaermen.mp4'), asset('a-2', 'Abplan.mp4')]
  const aktionen = [aktion('x-1', 'Sommeraktion'), aktion('x-2', 'Winterpause')]

  it('liefert GENAU so viele Zeilen wie listen-Einträge, in derselben Reihenfolge, position 1 aufsteigend lückenlos (IDs absichtlich unsortiert)', () => {
    const liste = [
      element('z-9', 'segment', 'x-1', { dauer: 20 }),
      element('b-3', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('a-1', 'segment', 'x-2', { dauer: 12 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen.length).toBe(3)
    expect(zeilen.map((z) => z.elementId)).toEqual(['z-9', 'b-3', 'a-1'])
    expect(zeilen.map((z) => z.position)).toEqual([1, 2, 3])
  })

  it('KEINE versteckte Sortierung: eine alphabetisch NICHT sortierte Liste kommt unverändert zurück (Kernnachweis)', () => {
    const liste = [
      element('omega', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('alpha', 'video', 'a-2', { trimStart: 0.1, trimEnde: 5.87 }),
      element('mango', 'segment', 'x-1', { dauer: 20 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilenIds(zeilen)).toEqual(['omega', 'alpha', 'mango'])
  })

  it('bezeichnung: originalname des Assets (NIE dateiname) bzw. titel der Aktion', () => {
    const liste = [
      element('b-3', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('z-9', 'segment', 'x-1', { dauer: 20 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen[0]?.bezeichnung).toBe('Aufwaermen.mp4')
    expect(zeilen[0]?.bezeichnung).not.toBe('a-1-datei.mp4')
    expect(zeilen[1]?.bezeichnung).toBe('Sommeraktion')
  })

  it('ins Leere zeigende ref -> BEZEICHNUNG_UNBEKANNT; die Zeile bleibt an ihrer Position', () => {
    const liste = [
      element('b-3', 'video', 'fehlt', { trimStart: 0.1, trimEnde: 5.87 }),
      element('z-9', 'segment', 'auch-fehlt', { dauer: 20 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen[0]?.bezeichnung).toBe(BEZEICHNUNG_UNBEKANNT)
    expect(zeilen[0]?.position).toBe(1)
    expect(zeilen[1]?.bezeichnung).toBe(BEZEICHNUNG_UNBEKANNT)
    expect(zeilen[1]?.position).toBe(2)
  })

  it('artLabel: Video / Aktion - drei benannte Prüfungen (bild ist mit TK v3.16 gestrichen, bleibt im Label erhalten)', () => {
    const liste = [
      element('v', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('s', 'segment', 'x-1', { dauer: 20 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen[0]?.artLabel).toBe('Video')
    expect(zeilen[1]?.artLabel).toBe('Aktion')
    // Kein dritter art-Kandidat produziert 'Aktion' falsch: fehlender Eintrag bleibt ''.
    expect(baueListenZeilen(projekt([element('x', 'video', 'fehlt', { trimStart: 0.1, trimEnde: 5.87 })], assets), [], null)[0]?.artLabel).toBe('Video')
  })

  it('dauerFrames/dauerText: exakt frameDauer; dauerText = formatiereReglerDauer(frames / fps)', () => {
    // Krumme Trimmwerte (CLAUDE.md: ein Testwert, der zufällig glatt aufgeht, belegt nichts).
    const liste = [element('b-3', 'video', 'a-1', { trimStart: 0.13, trimEnde: 5.87 })]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    const dauerSekunden = 5.87 - 0.13
    const erwartetFrames = Math.round(dauerSekunden * RENDER_PROFILE.fps)
    expect(zeilen[0]?.dauerFrames).toBe(erwartetFrames)
    expect(zeilen[0]?.dauerText).toBe(formatiereReglerDauer(erwartetFrames / RENDER_PROFILE.fps))
    // 4.62 abzüglich 0.13 -> 5.74 * 30 = 172,2 -> 172 frames -> 5,733.. -> "5,7 s"
  })

  it('EIN Format je Zeile: ein Element von 12,5 s zeigt "12,5 s", NICHT "0:12"', () => {
    const liste = [element('b-3', 'video', 'a-1', { trimStart: 0, trimEnde: 12.5 })]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen[0]?.dauerText).toContain('12,5')
    expect(zeilen[0]?.dauerText).not.toBe('0:12')
  })

  it('frameDauer lehnt ab: dauerFrames 0 und DAUER_UNBEKANNT, ohne Wurf und ohne Auslassen der Zeile', () => {
    // Segment ohne dauer -> frameDauer kann nicht bilden.
    const liste = [element('z-9', 'segment', 'x-1', { dauer: null })]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [], null)
    expect(zeilen.length).toBe(1)
    expect(zeilen[0]?.dauerFrames).toBe(0)
    expect(zeilen[0]?.dauerText).toBe(DAUER_UNBEKANNT)
  })

  it('kaputt NUR bei element_asset/element_aktion; reiner band_abschnitt setzt kaputt NICHT und füllt kaputteBandAbschnitte (Fall 3)', () => {
    const grund: KaputtGrund = 'asset_fehlt'
    const stellen: KaputteStelle[] = [
      { art: 'element_asset', elementId: 'v-1', assetId: 'a-9', grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'v-2', abschnittIndex: 2, aktionId: 'x-2', assetId: null, grund },
      { art: 'band_abschnitt', elementId: 'v-2', abschnittIndex: 0, aktionId: 'x-1', assetId: null, grund },
      { art: 'element_aktion', elementId: 's-1', aktionId: 'x-1', assetId: 'a-9', grund: 'aktion_unbekannt' },
    ]
    const liste = [
      element('v-1', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('v-2', 'video', 'a-2', { trimStart: 0.1, trimEnde: 5.87, einblendung: { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'x-1', dauer: 3.13 }, { aktionRef: 'x-2', dauer: 7.17 }, { aktionRef: 'x-3', dauer: 3.19 }] } }),
      element('s-1', 'segment', 'x-1', { dauer: 20 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), stellen, null)
    expect(zeilen[0]?.kaputt).toBe(true)
    expect(zeilen[1]?.kaputt).toBe(false)
    expect(zeilen[1]?.kaputteBandAbschnitte).toEqual([0, 2]) // aufsteigend, ohne Dubletten
    expect(zeilen[2]?.kaputt).toBe(true)
  })

  it('kaputteBandAbschnitte: Dubletten werden entfernt, Sortierung bleibt aufsteigend', () => {
    const stellen: KaputteStelle[] = [
      { art: 'band_abschnitt', elementId: 'v-2', abschnittIndex: 3, aktionId: 'x', assetId: null, grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'v-2', abschnittIndex: 1, aktionId: 'x', assetId: null, grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'v-2', abschnittIndex: 3, aktionId: 'x', assetId: null, grund: 'asset_fehlt' },
    ]
    const liste = [element('v-2', 'video', 'a-2', { trimStart: 0.1, trimEnde: 5.87 })]
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), stellen, null)
    expect(zeilen[0]?.kaputteBandAbschnitte).toEqual([1, 3])
  })

  it('hervorgehoben bei GENAU EINER Zeile (aktuelle Stell - sonst bei keiner)', () => {
    const liste = [
      element('v-1', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
      element('s-1', 'segment', 'x-1', { dauer: 20 }),
    ]
    const aktuelle: KaputteStelle = { art: 'element_aktion', elementId: 's-1', aktionId: 'x-1', assetId: null, grund: 'aktion_unbekannt' }
    const zeilen = baueListenZeilen(projekt(liste, assets, aktionen), [aktuelle], aktuelle)
    expect(zeilen.filter((z) => z.hervorgehoben).length).toBe(1)
    expect(zeilen[1]?.hervorgehoben).toBe(true)

    const ohne = baueListenZeilen(projekt(liste, assets, aktionen), [aktuelle], null)
    expect(ohne.some((z) => z.hervorgehoben)).toBe(false)

    const auswaerts: KaputteStelle = { art: 'element_asset', elementId: 'nicht-in-der-liste', assetId: 'a', grund: 'asset_fehlt' }
    const ausserhalb = baueListenZeilen(projekt(liste, assets, aktionen), [aktuelle], auswaerts)
    expect(ausserhalb.some((z) => z.hervorgehoben)).toBe(false)
  })

  it('verändert die Eingaben NICHT (Object.freeze über projekt, stellen, aktuelle Stelle)', () => {
    const liste = [element('v-1', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }), element('s-1', 'segment', 'x-1', { dauer: 20 })]
    const p = projekt(liste, assets, aktionen)
    const stellen: KaputteStelle[] = [{ art: 'element_asset', elementId: 'v-1', assetId: 'a-9', grund: 'asset_fehlt' }]
    const aktuell: KaputteStelle = { art: 'element_asset', elementId: 'v-1', assetId: 'a-9', grund: 'asset_fehlt' }
    expect(() =>
      baueListenZeilen(
        Object.freeze(p) as Project,
        Object.freeze(stellen) as readonly KaputteStelle[],
        Object.freeze(aktuell) as unknown as KaputteStelle,
      ),
    ).not.toThrow()
  })
})

// ---------------- zeilenIds ----------------

describe('zeilenIds (#248)', () => {
  it('liefert die elementIds in Zeilenreihenfolge (deep-gleich zur Liste)', () => {
    const liste = [
      element('z-9', 'segment', 'x-1', { dauer: 20 }),
      element('b-3', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }),
    ]
    const zeilen = baueListenZeilen(projekt(liste, [asset('a-1', 'x.mp4')], [aktion('x-1', 'A')]), [], null)
    expect(zeilenIds(zeilen)).toEqual(liste.map((e) => e.id))
  })
})

// ---------------- findeThumbnailquelle ----------------

describe('findeThumbnailquelle (#248)', () => {
  const assets = [asset('a-1', 'Aufwaermen.mp4')]
  const aktionen = [aktion('x-1', 'Sommeraktion')]
  const p = projekt(
    [element('v', 'video', 'a-1', { trimStart: 0.1, trimEnde: 5.87 }), element('s', 'segment', 'x-1', { dauer: 20 })],
    assets,
    aktionen,
  )

  it('liefert die toBe-gleiche Objektreferenz aus projekt.assets bzw. projekt.aktionen - KEIN Klon', () => {
    const quelle = findeThumbnailquelle(p.liste[0] as Listenelement, p)
    expect(quelle.art).toBe('asset')
    if (quelle.art === 'asset') expect(quelle.asset).toBe(assets[0])
    const quelleAktion = findeThumbnailquelle(p.liste[1] as Listenelement, p)
    expect(quelleAktion.art).toBe('aktion')
    if (quelleAktion.art === 'aktion') expect(quelleAktion.aktion).toBe(aktionen[0])
  })

  it('unbekannte Referenz -> fehlt; AUCH wenn derselbe ID-Wrt im ANDEREN Bestand steht', () => {
    // Video mit ref='x-1' (eine Aktions-ID): die Aktions-Suche hilft NICHT.
    const verwandt = projekt([element('v', 'video', 'x-1', { trimStart: 0.1, trimEnde: 5.87 }), element('s', 'segment', 'a-1', { dauer: 20 })], assets, aktionen)
    expect(findeThumbnailquelle(verwandt.liste[0] as Listenelement, verwandt)).toEqual({ art: 'fehlt' })
    expect(findeThumbnailquelle(verwandt.liste[1] as Listenelement, verwandt)).toEqual({ art: 'fehlt' })
  })
})

// ---------------- baueLaengenAnzeige ----------------

describe('baueLaengenAnzeige (#248)', () => {
  it('leere Liste: text für 0 Sekunden, warnung false, unvollstaendig false', () => {
    const zeige = baueLaengenAnzeige([])
    expect(zeige.warnung).toBe(false)
    expect(zeige.warntext).toBeNull()
    expect(zeige.unvollstaendig).toBe(false)
    expect(zeige.text).toBe('0:00')
  })

  it('warnung kommt EXAKT aus Gesamtlaenge.warnung (#127), nicht selbst abgeleitet', () => {
    // Eine Liste genau KNBIG WARNSCHWELLE_SEKUNDEN.
    const eineSekunde = [{ ...element('a', 'segment', 'x', { dauer: WARNSCHWELLE_SEKUNDEN - 4.87 }) }]
    const unter = baueLaengenAnzeige(eineSekunde)
    expect(unter.warnung).toBe(false)
    expect(unter.warntext).toBeNull()
    const ueber = baueLaengenAnzeige([{ ...element('a', 'segment', 'x', { dauer: WARNSCHWELLE_SEKUNDEN + 4.87 }) }])
    expect(ueber.warnung).toBe(true)
    expect(ueber.warntext).not.toBeNull()
  })

  it('leanht berechneGesamtlaenge: unvollstaendig true, DAUER_UNBEKANNT, warnung false - KEINE Teilsumme', () => {
    // Ein Video mit fehlendem Asset (dauer null) und ein Segment ohne dauer:
    // berechneGesamtlaenge kann nicht bilden.
    const liste = [element('v', 'video', 'fehlt', {}), element('s', 'segment', 'x', { dauer: null })]
    const zeige = baueLaengenAnzeige(liste)
    expect(zeige.unvollstaendig).toBe(true)
    expect(zeige.text).toBe(DAUER_UNBEKANNT)
    expect(zeige.warnung).toBe(false)
  })
})

// ---------------- baueReparaturAnzeige ----------------

describe('baueReparaturAnzeige (#248)', () => {
  it('null -> { sichtbar: false, behoben: 0, gesamt: 0, text: "" }', () => {
    expect(baueReparaturAnzeige(null)).toEqual({ sichtbar: false, behoben: 0, gesamt: 0, text: '' })
  })

  it('inaktiv -> sichtbar false', () => {
    const stand: ReparaturStand = { aktiv: false, offen: [], gesamt: 0, behoben: 0, zeigerIndex: 0, aktuelle: null }
    expect(baueReparaturAnzeige(stand).sichtbar).toBe(false)
  })

  it('bernimmt behoben/gesamt UNVERÄNDERT (nicht nachgerechnet) und formuliert den Text', () => {
    // Krumme Zahlen (CLAUDE.md): belegt, dass NICHT offen.length gerechnet wurde.
    const stand: ReparaturStand = {
      aktiv: true,
      offen: [] as KaputteStelle[],
      gesamt: 7,
      behoben: 3,
      zeigerIndex: 0,
      aktuelle: null,
    }
    const zeige = baueReparaturAnzeige(stand)
    expect(zeige.behoben).toBe(3)
    expect(zeige.gesamt).toBe(7)
    expect(zeige.text).toBe('3 von 7 behoben')
    expect(zeige.sichtbar).toBe(true)
  })
})

// ---------------- Meldungs-Lage ----------------

describe('Meldungen (#248)', () => {
  it('nimmMeldungAuf liefert eine NEUE Lage mit der toBe-gleichen Meldung', () => {
    const meldung = { code: 'ungueltige_eingabe', meldung: 'knack' }
    const lage = nimmMeldungAuf(LEERE_MELDUNGSLAGE, meldung)
    expect(lage).not.toBe(LEERE_MELDUNGSLAGE)
    expect(lage.meldung).toBe(meldung)
  })

  it('verwirfMeldung liefert eine Lage mit meldung: null (LEERE_MELDUNGSLAGE bleibt unverndert, eingefroren)', () => {
    const eingefroren = Object.freeze(LEERE_MELDUNGSLAGE)
    expect(() => verwirfMeldung(eingefroren)).not.toThrow()
    expect(verwirfMeldung(eingefroren).meldung).toBeNull()
    expect(eingefroren.meldung).toBeNull()
  })

  it('genau EINE Meldung: eine neue Meldung ersetzt die alte (kein Stapel)', () => {
    let lage = LEERE_MELDUNGSLAGE
    lage = nimmMeldungAuf(lage, { code: 'a', meldung: 'erste' })
    lage = nimmMeldungAuf(lage, { code: 'b', meldung: 'zweite' })
    expect(lage.meldung?.code).toBe('b')
    expect(lage.meldung?.meldung).toBe('zweite')
  })
})
