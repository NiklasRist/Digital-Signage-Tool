// Verhaltenstests zu #131 - `findeKaputteStellen` und `stellenZuAktion` im composer.
//
// Der Prüfumfang ist die Tabelle der VIER kaputten Stellen aus TK 9.7.5 (Fall 4
// seit v3.27: Unterbrechung eines einwandfreien Videos). Fall 3
// (Band-Abschnitt eines EINWANDFREIEN Videos) ist der teure: Er ist der einzige,
// bei dem das Listenelement selbst heil aussieht. Fällt er weg, gilt das Projekt
// als heil, `template-canvas` zeichnet einen Platzhalter, und der landet in der
// fertigen MP4 auf dem Fernseher (TK 9.10.7). Deshalb steht er hier mehrfach und
// in Kombinationen, nicht nur einmal.
//
// Die zweite Falle liegt im ZÄHLEN: Ein Aufbau mit je einem Defekt bewiese nichts
// über Duplikate, Abbruch nach dem ersten Defekt oder eine versteckte Sortierung.
// Deshalb steht neben jedem Positivfall ein Aufbau, der genau die naheliegende
// Abkürzung auffliegen lässt.
import { describe, expect, it } from 'vitest'

import {
  findeKaputteStellen,
  haengtAmElement,
  stellenZuAktion,
} from '../../src/renderer/composer/kaputt-erkennung'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Einblendung, Listenelement, Project } from '../../src/shared/contracts/project'

// ---------------------------------------------------------------------------
// Bausteine. Bewusst knapp: Nur `zustand`, `bildRef`, `art` und `ref` tragen hier
// eine Aussage; alles andere ist Beiwerk, das der Vertrag verlangt.
// ---------------------------------------------------------------------------

function asset(id: string, zustand: Asset['zustand'], typ: Asset['typ'] = 'video'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === 'video' ? 'mp4' : 'png'}`,
    originalname: `${id}-original`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12 : null,
    importdatum: '2026-08-13T00:00:00.000Z',
    zustand,
  }
}

function aktion(id: string, bildRef: string | null, markeId = 'marke-test'): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId,
    akzentfarbe: null,
  }
}

/**
 * Ein Marken-Bestand fuer die Referenzpruefung (#338).
 *
 * SAFETY: Die Kaputt-Erkennung liest ausschliesslich `id` - der Cast benennt nur die
 * Form, die sie braucht. Ein vollstaendiges `Marke`-Objekt (dreizehn Farbrollen, Logo,
 * Herkunft je Feld) waere hier Beiwerk, das keine Aussage traegt.
 */
function marken(...ids: string[]): Marke[] {
  return ids.map((id) => ({ id }) as unknown as Marke)
}

function band(...aktionRefs: string[]): Einblendung {
  return {
    bandVorlageId: 'band-standard',
    abschnitte: aktionRefs.map((aktionRef) => ({ aktionRef, dauer: 10 })),
  }
}

function element(
  id: string,
  art: Listenelement['art'],
  ref: string,
  einblendung: Einblendung | null = null,
  unterbrechungen?: Array<{ zeitstelle: number; aktionRef: string; dauer: number }>,
): Listenelement {
  return { id, art, ref, dauer: null, trimStart: null, trimEnde: null, einblendung, unterbrechungen }
}

function einschub(...aktionRefs: string[]): Array<{ zeitstelle: number; aktionRef: string; dauer: number }> {
  // Krumme Zeitstellen, damit eine fest verdrahtete 0 nicht zufaellig stimmt.
  return aktionRefs.map((aktionRef, index) => ({ zeitstelle: 1.5 + index * 2, aktionRef, dauer: 3 }))
}

function projekt(teile: Partial<Pick<Project, 'assets' | 'aktionen' | 'liste'>>): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-08-13T00:00:00.000Z',
    geaendertAm: '2026-08-13T00:00:00.000Z',
    schemaVersion: 1,
    assets: teile.assets ?? [],
    aktionen: teile.aktionen ?? [],
    liste: teile.liste ?? [],
    letzterAusgabeName: null,
    standardMarkeId: "marke-test",
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }
}

// ---------------------------------------------------------------------------

describe('Fall 3 - Band-Abschnitt eines einwandfreien Videos (TK 9.7.5)', () => {
  it('meldet genau EINE Stelle, obwohl das Video selbst tadellos ist', () => {
    // Das Video liegt vor, das Element ist heil - nur der eine Bandabschnitt
    // zeigt auf eine Aktion, deren Bild fehlt.
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('bild-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'bild-weg')],
      liste: [element('e1', 'video', 'v1', band('a1'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'band_abschnitt',
        elementId: 'e1',
        abschnittIndex: 0,
        aktionId: 'a1',
        assetId: 'bild-weg',
        grund: 'asset_fehlt',
      },
    ])
  })

  it('meldet KEINE element_asset-Stelle dazu - das Video ist nicht der Defekt', () => {
    // Gegenprobe zur Abkürzung „ein defektes Band macht das ganze Element kaputt".
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('bild-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'bild-weg')],
      liste: [element('e1', 'video', 'v1', band('a1'))],
    })

    expect(findeKaputteStellen(p, null).map((s) => s.art)).toEqual(['band_abschnitt'])
  })

  it('trifft den richtigen Abschnitt, wenn nur der mittlere von dreien kaputt ist', () => {
    // `abschnittIndex` ist die EINZIGE Information, mit der der Abschnitt später
    // wiedergefunden wird (#132/#133). Ein Aufbau mit nur einem Abschnitt könnte
    // eine fest verdrahtete 0 nicht von der Wahrheit unterscheiden.
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-ok', 'ok', 'bild'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a-heil', 'b-ok'), aktion('a-kaputt', 'b-weg')],
      liste: [element('e1', 'video', 'v1', band('a-heil', 'a-kaputt', 'a-heil'))],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen).toHaveLength(1)
    expect(stellen[0]).toEqual({
      art: 'band_abschnitt',
      elementId: 'e1',
      abschnittIndex: 1,
      aktionId: 'a-kaputt',
      assetId: 'b-weg',
      grund: 'asset_fehlt',
    })
  })

  it('zählt jeden kaputten Abschnitt einzeln, auch bei derselben Aktion', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v1', band('a1', 'a1', 'a1'))],
    })

    expect(findeKaputteStellen(p, null).map((s) => (s.art === 'band_abschnitt' ? s.abschnittIndex : -1)))
      .toEqual([0, 1, 2])
  })
})

describe('alle drei Arten in EINEM Projekt (Prüfumfang TK 9.7.5)', () => {
  const p = projekt({
    assets: [
      asset('v-weg', 'fehlt'),
      asset('v-ok', 'ok'),
      asset('b-weg', 'fehlt', 'bild'),
    ],
    aktionen: [aktion('a-kaputt', 'b-weg')],
    liste: [
      element('e1', 'video', 'v-weg'), // Fall 1
      element('e2', 'segment', 'a-kaputt'), // Fall 2
      element('e3', 'video', 'v-ok', band('a-kaputt')), // Fall 3
    ],
  })

  it('findet alle drei, jede mit ihrer eigenen Art', () => {
    expect(findeKaputteStellen(p, null)).toEqual([
      { art: 'element_asset', elementId: 'e1', assetId: 'v-weg', grund: 'asset_fehlt' },
      {
        art: 'element_aktion',
        elementId: 'e2',
        aktionId: 'a-kaputt',
        assetId: 'b-weg',
        grund: 'asset_fehlt',
      },
      {
        art: 'band_abschnitt',
        elementId: 'e3',
        abschnittIndex: 0,
        aktionId: 'a-kaputt',
        assetId: 'b-weg',
        grund: 'asset_fehlt',
      },
    ])
  })
})

describe('Fall 4 - Unterbrechung eines einwandfreien Videos (TK 9.7.5 v3.27)', () => {
  it('meldet genau EINE Stelle, obwohl das Video selbst tadellos ist', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('bild-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'bild-weg')],
      liste: [element('e1', 'video', 'v1', null, einschub('a1'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'unterbrechung',
        elementId: 'e1',
        unterbrechungIndex: 0,
        aktionId: 'a1',
        assetId: 'bild-weg',
        grund: 'asset_fehlt',
      },
    ])
  })

  it('meldet KEINE element_asset-Stelle dazu - das Video ist nicht der Defekt', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('bild-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'bild-weg')],
      liste: [element('e1', 'video', 'v1', null, einschub('a1'))],
    })

    expect(findeKaputteStellen(p, null).map((s) => s.art)).toEqual(['unterbrechung'])
  })

  it('trifft den richtigen Einschub, wenn nur der mittlere von dreien kaputt ist', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-ok', 'ok', 'bild'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a-heil', 'b-ok'), aktion('a-kaputt', 'b-weg')],
      liste: [element('e1', 'video', 'v1', null, einschub('a-heil', 'a-kaputt', 'a-heil'))],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen).toHaveLength(1)
    expect(stellen[0]).toEqual({
      art: 'unterbrechung',
      elementId: 'e1',
      unterbrechungIndex: 1,
      aktionId: 'a-kaputt',
      assetId: 'b-weg',
      grund: 'asset_fehlt',
    })
  })

  it('zählt jeden kaputten Einschub einzeln, in Array-Reihenfolge', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v1', null, einschub('a1', 'a1', 'a1'))],
    })

    expect(
      findeKaputteStellen(p, null).map((s) => (s.art === 'unterbrechung' ? s.unterbrechungIndex : -1)),
    ).toEqual([0, 1, 2])
  })

  it('unterbrechungen ohne Defekt (Aktion ohne Bild) erzeugen keine Stelle', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a-ohne-bild', null)],
      liste: [element('e1', 'video', 'v1', null, einschub('a-ohne-bild'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('unbekannte Aktions-ID im Einschub -> aktion_unbekannt, assetId null', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [],
      liste: [element('e1', 'video', 'v1', null, einschub('a-weg'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'unterbrechung',
        elementId: 'e1',
        unterbrechungIndex: 0,
        aktionId: 'a-weg',
        assetId: null,
        grund: 'aktion_unbekannt',
      },
    ])
  })

  it('fehlendes unterbrechungen-Feld (undefined) liefert keine Stelle', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', 'bild-weg')],
      liste: [element('e1', 'video', 'v1')],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('stellenZuAktion behebt den Einschub mit (ein Fix an der Aktion heilt alle Verwendungen)', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a-kaputt', 'b-weg')],
      liste: [
        element('e1', 'segment', 'a-kaputt'),
        element('e2', 'video', 'v1', band('a-kaputt')),
        element('e3', 'video', 'v1', null, einschub('a-kaputt')),
      ],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen.map((s) => s.art)).toEqual(['element_aktion', 'band_abschnitt', 'unterbrechung'])
    expect(stellenZuAktion(stellen, 'a-kaputt').map((s) => s.art)).toEqual([
      'element_aktion',
      'band_abschnitt',
      'unterbrechung',
    ])
  })
})

describe('ein Element kann MEHRERE Stellen liefern', () => {
  it('Video mit fehlendem Asset UND kaputtem Einschub gibt zwei Stellen', () => {
    // Dieselbe Regel wie Fall 3: Bei Abbruch nach dem ersten Defekt verschwände
    // die zweite Stelle aus der Zählung und "X von N" liefe rückwärts.
    const p = projekt({
      assets: [asset('v-weg', 'fehlt'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-weg', null, einschub('a1'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      { art: 'element_asset', elementId: 'e1', assetId: 'v-weg', grund: 'asset_fehlt' },
      {
        art: 'unterbrechung',
        elementId: 'e1',
        unterbrechungIndex: 0,
        aktionId: 'a1',
        assetId: 'b-weg',
        grund: 'asset_fehlt',
      },
    ])
  })

  it('Band-Abschnitt kommt VOR der Unterbrechung (stabile Reihenfolge)', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v1', band('a1'), einschub('a1'))],
    })

    expect(findeKaputteStellen(p, null).map((s) => s.art)).toEqual([
      'band_abschnitt',
      'unterbrechung',
    ])
  })


  it('Video mit fehlendem Asset UND kaputtem Bandabschnitt gibt zwei Stellen', () => {
    // Der Abbruch nach dem ersten Defekt wäre still: Die zweite Stelle
    // verschwände aus der Zählung und tauchte nach der ersten Reparatur wieder
    // auf - „X von N" liefe rückwärts (TK 9.7.5).
    const p = projekt({
      assets: [asset('v-weg', 'fehlt'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-weg', band('a1'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      { art: 'element_asset', elementId: 'e1', assetId: 'v-weg', grund: 'asset_fehlt' },
      {
        art: 'band_abschnitt',
        elementId: 'e1',
        abschnittIndex: 0,
        aktionId: 'a1',
        assetId: 'b-weg',
        grund: 'asset_fehlt',
      },
    ])
  })

  it('Reparatur des Videos allein macht das Element nicht frei', () => {
    // Dieselbe Lage, nur das Video zurückkopiert: Die Bandstelle bleibt stehen.
    // Genau das ist der Grund, warum beide Stellen von Anfang an zählen müssen.
    const p = projekt({
      assets: [asset('v-weg', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-weg', band('a1'))],
    })

    expect(findeKaputteStellen(p, null).map((s) => s.art)).toEqual(['band_abschnitt'])
  })
})

describe('Reihenfolge - Listenreihenfolge, Element vor seinen Band-Abschnitten', () => {
  it('folgt der Array-Reihenfolge und sortiert nicht nach Art oder Aktion', () => {
    // Nach Art sortiert stünde element_asset ganz vorn, nach Aktion gruppiert
    // stünden die a1-Stellen zusammen. Beides bricht „Angezeigte Reihenfolge =
    // gerenderte Reihenfolge - keine versteckte Sortierung." (TK 9.7.4).
    const p = projekt({
      assets: [asset('v-ok', 'ok'), asset('v-weg', 'fehlt'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg'), aktion('a2', 'b-weg')],
      liste: [
        element('e1', 'video', 'v-ok', band('a1', 'a2')),
        element('e2', 'segment', 'a1'),
        element('e3', 'video', 'v-weg', band('a2')),
      ],
    })

    expect(
      findeKaputteStellen(p, null).map((s) =>
        !haengtAmElement(s) ? s.art
          : s.art === 'band_abschnitt' ? `${s.elementId}#${String(s.abschnittIndex)}` : `${s.elementId}/${s.art}`,
      ),
    ).toEqual(['e1#0', 'e1#1', 'e2/element_aktion', 'e3/element_asset', 'e3#0'])
  })
})

describe('nicht kaputt - was NICHT gezählt werden darf', () => {
  it('Aktion ohne Bild (bildRef === null) erzeugt keine Stelle - weder als Segment noch im Band', () => {
    // „eine Aktion ohne Bild ist gültig - Bild ist optional, Titel Pflicht"
    // (TK 9.8.5). Wer sie mitzählt, sperrt den Render dauerhaft, ohne dass es
    // etwas zu reparieren gäbe.
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a-ohne-bild', null)],
      liste: [
        element('e1', 'segment', 'a-ohne-bild'),
        element('e2', 'video', 'v1', band('a-ohne-bild')),
      ],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('Asset mit zustand ok erzeugt keine Stelle', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b1', 'ok', 'bild')],
      aktionen: [aktion('a1', 'b1')],
      liste: [element('e1', 'video', 'v1', band('a1')), element('e2', 'segment', 'a1')],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('einblendung an einem segment-Element wird ignoriert, nicht gemeldet', () => {
    // „Parallele Bänder gibt es nur bei `\"video\"`-Items" (TK 9.2.8) - ein
    // solcher Datensatz ist ein Fehler des schreibenden Moduls, keine kaputte
    // Stelle im Sinne des Reparatur-Modus.
    const p = projekt({
      assets: [asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a-kaputt', 'b-weg'), aktion('a-heil', null)],
      liste: [element('e1', 'segment', 'a-heil', band('a-kaputt'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('Video ohne einblendung liefert keine Band-Stellen', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [],
      liste: [element('e1', 'video', 'v1', null)],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('leeres abschnitte-Array liefert keine Band-Stellen', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [],
      liste: [element('e1', 'video', 'v1', band())],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('leere Liste liefert eine leere Ergebnisliste - die Freigabe für den Render', () => {
    expect(findeKaputteStellen(projekt({}), null)).toEqual([])
  })
})

describe('die drei Gründe (Fehlerpfad-Tabelle des Issues)', () => {
  it('video mit unbekannter Asset-ID -> asset_unbekannt', () => {
    const p = projekt({
      assets: [],
      liste: [element('e1', 'video', 'gibt-es-nicht'), element('e2', 'video', 'auch-nicht')],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      { art: 'element_asset', elementId: 'e1', assetId: 'gibt-es-nicht', grund: 'asset_unbekannt' },
      { art: 'element_asset', elementId: 'e2', assetId: 'auch-nicht', grund: 'asset_unbekannt' },
    ])
  })

  it('segment mit unbekannter Aktions-ID -> aktion_unbekannt, assetId null', () => {
    const p = projekt({ aktionen: [], liste: [element('e1', 'segment', 'a-weg')] })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'element_aktion',
        elementId: 'e1',
        aktionId: 'a-weg',
        assetId: null,
        grund: 'aktion_unbekannt',
      },
    ])
  })

  it('Band-Abschnitt mit unbekannter Aktions-ID -> aktion_unbekannt, assetId null', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [],
      liste: [element('e1', 'video', 'v1', band('a-weg'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'band_abschnitt',
        elementId: 'e1',
        abschnittIndex: 0,
        aktionId: 'a-weg',
        assetId: null,
        grund: 'aktion_unbekannt',
      },
    ])
  })

  it('bildRef zeigt auf ein Asset, das es nicht gibt -> asset_unbekannt mit der bildRef als assetId', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', 'bild-existiert-nicht')],
      liste: [element('e1', 'segment', 'a1'), element('e2', 'video', 'v1', band('a1'))],
    })

    expect(findeKaputteStellen(p, null)).toEqual([
      {
        art: 'element_aktion',
        elementId: 'e1',
        aktionId: 'a1',
        assetId: 'bild-existiert-nicht',
        grund: 'asset_unbekannt',
      },
      {
        art: 'band_abschnitt',
        elementId: 'e2',
        abschnittIndex: 0,
        aktionId: 'a1',
        assetId: 'bild-existiert-nicht',
        grund: 'asset_unbekannt',
      },
    ])
  })

  it('leere assets/aktionen bei nicht leerer Liste - jede Referenz ist *_unbekannt', () => {
    const p = projekt({
      liste: [
        element('e1', 'video', 'v1'),
        element('e2', 'video', 'v2'),
        element('e3', 'segment', 'a1'),
      ],
    })

    expect(findeKaputteStellen(p, null).map((s) => ('grund' in s ? s.grund : s.markeId))).toEqual([
      'asset_unbekannt',
      'asset_unbekannt',
      'aktion_unbekannt',
    ])
  })
})

describe('kein Gedächtnis - die Rückrichtung aus TK 9.4.7', () => {
  it('dasselbe Projekt liefert mit fehlt eine Stelle und mit ok keine, in beiden Richtungen', () => {
    // „Ist die Datei wieder da (der Nutzer hat sie zurückkopiert, ein
    // Netzlaufwerk war offline), wird `zustand` auf `\"ok\"` zurückgesetzt."
    // (TK 9.4.7) - ein gemerktes Ergebnis zeigte den Defekt für immer weiter.
    const p = projekt({
      assets: [asset('v1', 'ok')],
      liste: [element('e1', 'video', 'v1')],
    })

    expect(findeKaputteStellen(p, null)).toEqual([])

    // Dasselbe Objekt, nur der Zustand kippt - wie nach einem Reconcile.
    const gefunden = p.assets[0]
    expect(gefunden).toBeDefined()
    if (gefunden === undefined) throw new Error('Testaufbau kaputt')
    gefunden.zustand = 'fehlt'
    expect(findeKaputteStellen(p, null)).toEqual([
      { art: 'element_asset', elementId: 'e1', assetId: 'v1', grund: 'asset_fehlt' },
    ])

    // ... und zurück. Ein Zwischenspeicher fiele spätestens hier auf.
    gefunden.zustand = 'ok'
    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('gleiche Eingabe, gleiche Ausgabe - zwei Läufe hintereinander sind deckungsgleich', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v1', band('a1')), element('e2', 'segment', 'a1')],
    })

    expect(findeKaputteStellen(p, null)).toEqual(findeKaputteStellen(p, null))
    // ... und es ist jedes Mal ein NEUES Array, kein wiederverwendetes.
    expect(findeKaputteStellen(p, null)).not.toBe(findeKaputteStellen(p, null))
  })
})

describe('ohne Seiteneffekt - das Projekt bleibt unangetastet', () => {
  it('verändert das übergebene Projekt nicht (Tiefenvergleich vor/nach)', () => {
    const p = projekt({
      assets: [asset('v-weg', 'fehlt'), asset('v-ok', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg'), aktion('a2', null)],
      liste: [
        element('e1', 'video', 'v-weg', band('a1', 'a2')),
        element('e2', 'segment', 'a1'),
        element('e3', 'video', 'v-ok', band('a1')),
      ],
    })
    const vorher = structuredClone(p)

    const stellen = findeKaputteStellen(p, null)
    expect(stellen.length).toBeGreaterThan(0) // sonst prüfte der Vergleich nichts

    expect(p).toEqual(vorher)
  })

  it('gibt keine Kopie des Projekts zurück - die Stellen tragen nur IDs', () => {
    const p = projekt({
      assets: [asset('v-weg', 'fehlt')],
      liste: [element('e1', 'video', 'v-weg')],
    })

    const stelle = findeKaputteStellen(p, null)[0]
    expect(stelle).toEqual({
      art: 'element_asset',
      elementId: 'e1',
      assetId: 'v-weg',
      grund: 'asset_fehlt',
    })
  })
})

describe('stellenZuAktion - ein Fix an der Aktion behebt alle Verwendungen', () => {
  it('drei Listenelemente auf derselben kaputten Aktion sind DREI Stellen', () => {
    // Keine Entduplizierung: Jede Verwendung ist eine eigene Position, die der
    // Nutzer sieht. Eine entduplizierte Liste könnte den Fortschritt nie um mehr
    // als eins fallen lassen - genau das verlangt TK 9.7.5 aber.
    const p = projekt({
      assets: [asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [
        element('e1', 'segment', 'a1'),
        element('e2', 'segment', 'a1'),
        element('e3', 'segment', 'a1'),
      ],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen).toHaveLength(3)
    expect(stellen.flatMap((s) => (haengtAmElement(s) ? [s.elementId] : []))).toEqual(['e1', 'e2', 'e3'])
    expect(stellenZuAktion(stellen, 'a1')).toEqual(stellen)
  })

  it('sammelt Listenelemente UND Band-Abschnitte derselben Aktion ein', () => {
    // Der Satz, um den es geht: „behebt EIN Fix an der Aktion ALLE Stellen, die
    // sie verwenden - Listenelemente UND Band-Abschnitte." (TK 9.7.5)
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [
        element('e1', 'segment', 'a1'),
        element('e2', 'video', 'v1', band('a1', 'a1')),
      ],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen).toHaveLength(3)

    const betroffen = stellenZuAktion(stellen, 'a1')
    expect(betroffen).toHaveLength(3)
    expect(betroffen.map((s) => s.art)).toEqual([
      'element_aktion',
      'band_abschnitt',
      'band_abschnitt',
    ])
    // „X von N" sinkt hier um drei auf einen Schlag.
    expect(stellen.length - betroffen.length).toBe(0)
  })

  it('lässt element_asset-Stellen aussen vor - die hängen an keiner Aktion', () => {
    const p = projekt({
      assets: [asset('v-weg', 'fehlt'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-weg', band('a1')), element('e2', 'segment', 'a1')],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellen).toHaveLength(3)
    expect(stellenZuAktion(stellen, 'a1').map((s) => s.art)).toEqual([
      'band_abschnitt',
      'element_aktion',
    ])
  })

  it('trennt Aktionen sauber - eine fremde Aktion nimmt nichts mit', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg'), aktion('a2', 'b-weg')],
      liste: [element('e1', 'segment', 'a1'), element('e2', 'video', 'v1', band('a2'))],
    })

    const stellen = findeKaputteStellen(p, null)
    expect(stellenZuAktion(stellen, 'a1').flatMap((s) => (haengtAmElement(s) ? [s.elementId] : []))).toEqual(['e1'])
    expect(stellenZuAktion(stellen, 'a2').flatMap((s) => (haengtAmElement(s) ? [s.elementId] : []))).toEqual(['e2'])
    expect(stellenZuAktion(stellen, 'a3')).toEqual([])
  })

  it('behält die Reihenfolge der Eingabe und verändert sie nicht', () => {
    const p = projekt({
      assets: [asset('v1', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v1', band('a1', 'a1', 'a1'))],
    })

    const stellen = findeKaputteStellen(p, null)
    const vorher = structuredClone(stellen)

    const betroffen = stellenZuAktion(stellen, 'a1')
    expect(betroffen).not.toBe(stellen)
    expect(stellen).toEqual(vorher)
    expect(betroffen.map((s) => (s.art === 'band_abschnitt' ? s.abschnittIndex : -1))).toEqual([
      0, 1, 2,
    ])
  })

  it('leere Eingabe liefert eine leere Ausgabe', () => {
    expect(stellenZuAktion([], 'a1')).toEqual([])
  })
})

describe('#338 - die Marken-Referenz einer Aktion', () => {
  it('existiert die Marke, entsteht KEIN Befund', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', null), aktion('a2', null)],
      liste: [element('e1', 'segment', 'a1'), element('e2', 'segment', 'a2')],
    })
    expect(findeKaputteStellen(p, marken('marke-test'))).toEqual([])
  })

  it('eine ins Leere zeigende markeId trifft GENAU diese Aktion - die anderen bleiben heil', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', null, 'geloeschte-marke'), aktion('a2', null)],
      liste: [element('e1', 'segment', 'a1'), element('e2', 'segment', 'a2')],
    })
    const stellen = findeKaputteStellen(p, marken('marke-test'))
    expect(stellen).toEqual([{ art: 'aktion_marke', aktionId: 'a1', markeId: 'geloeschte-marke' }])
    // Die Stelle haengt an der AKTION, nicht an der Zeile - deshalb KEIN `elementId`.
    expect(haengtAmElement(stellen[0] as (typeof stellen)[number])).toBe(false)
  })

  it('JE AKTION genau EINE Stelle - auch wenn sie in drei Elementen steckt', () => {
    // Die Entdopplungs-Regel der Element-Faelle gilt hier ausdruecklich NICHT (#338).
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', null, 'weg')],
      liste: [
        element('e1', 'segment', 'a1'),
        element('e2', 'segment', 'a1'),
        element('e3', 'video', 'v1', band('a1')),
      ],
    })
    const markenStellen = findeKaputteStellen(p, marken('marke-test')).filter(
      (stelle) => stelle.art === 'aktion_marke',
    )
    expect(markenStellen).toEqual([{ art: 'aktion_marke', aktionId: 'a1', markeId: 'weg' }])
  })

  it('eine leere/fehlende markeId wird gleich behandelt', () => {
    // `Aktion.markeId` ist laut Vertrag Pflicht und nie leer - kommt der Wert trotzdem
    // an (von Hand bearbeitete Datei, alter Schnappschuss), ist er eine kaputte Stelle.
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', null, '')],
      liste: [element('e1', 'segment', 'a1')],
    })
    expect(findeKaputteStellen(p, marken('marke-test'))).toEqual([
      { art: 'aktion_marke', aktionId: 'a1', markeId: '' },
    ])
    const ohneFeld = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [{ ...aktion('a1', null), markeId: undefined as unknown as string }],
      liste: [element('e1', 'segment', 'a1')],
    })
    expect(findeKaputteStellen(ohneFeld, marken('marke-test'))).toEqual([
      { art: 'aktion_marke', aktionId: 'a1', markeId: undefined },
    ])
  })

  it('OHNE geladenen Bestand (null) prueft sie die Marken NICHT - ein fehlender Bestand ist kein Defekt', () => {
    const p = projekt({
      assets: [asset('v1', 'ok')],
      aktionen: [aktion('a1', null, 'irgendwas')],
      liste: [element('e1', 'segment', 'a1')],
    })
    expect(findeKaputteStellen(p, null)).toEqual([])
  })

  it('die Reihenfolge der bestehenden Arten bleibt - die Marken-Stellen kommen HINTEN', () => {
    const p = projekt({
      assets: [asset('v1', 'fehlt')],
      aktionen: [aktion('a1', null, 'weg')],
      liste: [element('e1', 'video', 'v1')],
    })
    expect(findeKaputteStellen(p, marken()).map((stelle) => stelle.art)).toEqual([
      'element_asset',
      'aktion_marke',
    ])
  })
})
