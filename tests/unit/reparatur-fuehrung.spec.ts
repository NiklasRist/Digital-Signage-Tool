// Verhaltenstests zu #132 - die geführte Reparatur im composer.
//
// Der Prüfumfang ist die Fehlerpfad-Tabelle des Issues plus die vier Zusagen aus
// TK 9.7.5/9.14.2, die man nicht sieht, wenn man nur den Normalfall prüft:
//
//  1. Ein Fix an EINER Aktion senkt „X von N" um MEHR ALS EINS - Aktionen sind
//     referenzierbar, und ein Segment wie ein Band-Abschnitt hängt daran.
//  2. `gesamt` wächst, schrumpft nie - sonst läuft der Fortschritt rückwärts.
//  3. Der Zeiger bleibt STEHEN; dadurch rutscht die nächste offene Stelle von
//     selbst unter ihn. Ein Aufbau mit nur einer kaputten Stelle könnte ein
//     Zurücksetzen auf 0 nicht von der Wahrheit unterscheiden - deshalb steht der
//     Zeiger in diesen Tests auf Position 1, nicht auf 0.
//  4. Die Freigabe kommt aus dem PROJEKT, nicht aus dem Stand - ein beendeter
//     oder veralteter Stand darf den Render nicht freigeben.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { findeKaputteStellen, stellenZuAktion } from '../../src/renderer/composer/kaputt-erkennung'
import {
  aktualisiereReparatur,
  beendeReparatur,
  istRenderFreigegeben,
  springeZu,
  starteReparatur,
} from '../../src/renderer/composer/reparatur-fuehrung'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Einblendung, Listenelement, Project } from '../../src/shared/contracts/project'

// ---------------------------------------------------------------------------
// Bausteine - dieselben wie in kaputt-erkennung.spec.ts, damit beide Dateien
// denselben Datenbestand beschreiben.
// ---------------------------------------------------------------------------

function asset(id: string, zustand: Asset['zustand'], typ: Asset['typ'] = 'video'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === 'video' ? 'mp4' : 'png'}`,
    originalname: `${id}-original`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12 : null,
    importdatum: '2026-08-14T00:00:00.000Z',
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
): Listenelement {
  return { id, art, ref, dauer: null, trimStart: null, trimEnde: null, einblendung }
}

function projekt(teile: Partial<Pick<Project, 'assets' | 'aktionen' | 'liste'>>): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-08-14T00:00:00.000Z',
    geaendertAm: '2026-08-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: teile.assets ?? [],
    aktionen: teile.aktionen ?? [],
    liste: teile.liste ?? [],
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }
}

/** Der Fix: Die Datei ist wieder da, der Reconcile setzt `zustand` auf 'ok' (TK 9.4.7). */
function repariere(p: Project, assetId: string): void {
  const gefunden = p.assets.find((a) => a.id === assetId)
  if (gefunden === undefined) throw new Error(`Testaufbau kaputt: Asset ${assetId} gibt es nicht`)
  gefunden.zustand = 'ok'
}

/** Drei Stellen an EINER Aktion (zwei Segmente + ein Band-Abschnitt) und eine
 *  unabhängige vierte Stelle, die davon nicht berührt wird. */
function projektMitDreifachVerwendeterAktion(): Project {
  return projekt({
    assets: [asset('v-ok', 'ok'), asset('v-weg', 'fehlt'), asset('b-weg', 'fehlt', 'bild')],
    aktionen: [aktion('a1', 'b-weg')],
    liste: [
      element('e1', 'segment', 'a1'),
      element('e2', 'segment', 'a1'),
      element('e3', 'video', 'v-ok', band('a1')),
      element('e4', 'video', 'v-weg'),
    ],
  })
}

/** Drei voneinander unabhängige kaputte Stellen - je ein fehlendes Video. */
function projektMitDreiUnabhaengigenStellen(): Project {
  return projekt({
    assets: [asset('v1', 'fehlt'), asset('v2', 'fehlt'), asset('v3', 'fehlt')],
    liste: [
      element('e1', 'video', 'v1'),
      element('e2', 'video', 'v2'),
      element('e3', 'video', 'v3'),
    ],
  })
}

// ---------------------------------------------------------------------------

describe('starteReparatur', () => {
  it('liefert bei heilem Projekt aktiv: false und eine leere offen-Liste', () => {
    const p = projekt({ assets: [asset('v1', 'ok')], liste: [element('e1', 'video', 'v1')] })

    expect(starteReparatur(p)).toEqual({
      aktiv: false,
      offen: [],
      gesamt: 0,
      behoben: 0,
      zeigerIndex: 0,
      aktuelle: null,
    })
  })

  it('hebt bei kaputtem Projekt die ERSTE Stelle in Listenreihenfolge hervor', () => {
    // „Das erste kaputte Element wird hervorgehoben" (TK 9.7.5). Die Reihenfolge
    // ist die aus findeKaputteStellen - keine eigene Sortierung.
    const p = projektMitDreifachVerwendeterAktion()
    const stellen = findeKaputteStellen(p)

    const stand = starteReparatur(p)

    expect(stand.aktiv).toBe(true)
    expect(stand.offen).toEqual(stellen)
    expect(stand.gesamt).toBe(4)
    expect(stand.behoben).toBe(0)
    expect(stand.zeigerIndex).toBe(0)
    expect(stand.aktuelle).toEqual(stellen[0])
  })

  it('zählt alle DREI Arten kaputter Stellen mit, auch den Band-Abschnitt', () => {
    // Fall 3 ist der leicht zu übersehende: Das Video ist einwandfrei, nur ein
    // Abschnitt seines Bandes zeigt auf eine Aktion mit fehlendem Bild (TK 9.7.5).
    const stand = starteReparatur(projektMitDreifachVerwendeterAktion())

    expect(stand.offen.map((s) => s.art)).toEqual([
      'element_aktion',
      'element_aktion',
      'band_abschnitt',
      'element_asset',
    ])
  })
})

describe('ein Fix an EINER Aktion senkt „X von N" um MEHR als eins (TK 9.7.5)', () => {
  it('behoben steigt um 3, offen schrumpft um 3, gesamt bleibt', () => {
    // Das ist die Zusage, um die es geht: „Da Aktionen referenzierbar sind, behebt
    // EIN Fix an der Aktion ALLE Stellen, die sie verwenden - Listenelemente UND
    // Band-Abschnitte. Der Fortschritt „X von N" kann dadurch um mehr als eins
    // sinken." (TK 9.7.5)
    const p = projektMitDreifachVerwendeterAktion()
    const stand = starteReparatur(p)

    // Die drei Stellen hängen nachweislich an derselben Aktion - genau die, die
    // ein einziger Fix im action-editor mitnimmt.
    expect(stellenZuAktion(stand.offen, 'a1')).toHaveLength(3)
    expect(stand.behoben).toBe(0)

    // EIN Fix: das Bild der Aktion ist wieder da.
    repariere(p, 'b-weg')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.behoben).toBe(3)
    expect(nachher.behoben - stand.behoben).toBe(3)
    expect(nachher.offen).toHaveLength(1)
    expect(stand.offen.length - nachher.offen.length).toBe(3)
    expect(nachher.gesamt).toBe(4)
    expect(nachher.aktiv).toBe(true) // die vierte Stelle ist noch offen
  })

  it('der Zeiger steht danach auf der übrig gebliebenen, unabhängigen Stelle', () => {
    const p = projektMitDreifachVerwendeterAktion()
    const stand = starteReparatur(p)

    repariere(p, 'b-weg')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.aktuelle).toEqual({
      art: 'element_asset',
      elementId: 'e4',
      assetId: 'v-weg',
      grund: 'asset_fehlt',
    })
  })

  it('ein Fix an der Aktion räumt auch den Band-Abschnitt weg, nicht nur die Segmente', () => {
    // Gegenprobe zur Abkürzung „Aktions-Fix behebt die Listenelemente" - Fall 3
    // steht in derselben Aktion und muss mit verschwinden.
    const p = projekt({
      assets: [asset('v-ok', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-ok', band('a1', 'a1'))],
    })
    const stand = starteReparatur(p)
    expect(stand.offen.map((s) => s.art)).toEqual(['band_abschnitt', 'band_abschnitt'])

    repariere(p, 'b-weg')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.offen).toEqual([])
    expect(nachher.behoben).toBe(2)
    expect(nachher.gesamt).toBe(2)
  })

  it('letzte Stelle behoben: aktiv false, aktuelle null, behoben === gesamt', () => {
    const p = projektMitDreifachVerwendeterAktion()
    const stand = starteReparatur(p)

    repariere(p, 'b-weg')
    repariere(p, 'v-weg')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.aktiv).toBe(false)
    expect(nachher.aktuelle).toBeNull()
    expect(nachher.zeigerIndex).toBe(0)
    expect(nachher.offen).toEqual([])
    expect(nachher.behoben).toBe(nachher.gesamt)
    expect(nachher.behoben).toBe(4)
    // Und das ist der Moment der Freigabe.
    expect(istRenderFreigegeben(p)).toBe(true)
  })
})

describe('gesamt wächst, schrumpft nie - „X von N" läuft nicht rückwärts', () => {
  it('eine neu hinzukommende kaputte Stelle hebt gesamt, ohne behoben zu senken', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = starteReparatur(p)
    expect(stand.gesamt).toBe(3)
    expect(stand.behoben).toBe(0)

    // Eine Stelle behoben: 1 von 3.
    repariere(p, 'v2')
    const nachFix = aktualisiereReparatur(stand, p)
    expect(nachFix.gesamt).toBe(3)
    expect(nachFix.behoben).toBe(1)

    // Jetzt fügt der Nutzer ein weiteres, ebenfalls kaputtes Element hinzu.
    p.liste.push(element('e4', 'video', 'gibt-es-nicht'))
    const nachZugang = aktualisiereReparatur(nachFix, p)

    expect(nachZugang.offen).toHaveLength(3)
    expect(nachZugang.gesamt).toBe(4) // gestiegen
    expect(nachZugang.gesamt).toBeGreaterThan(nachFix.gesamt)
    expect(nachZugang.behoben).toBe(1) // NICHT gesunken
    expect(nachZugang.behoben).toBe(nachFix.behoben)
  })

  it('gesamt bleibt auch dann stehen, wenn der Nutzer kaputte Elemente einfach entfernt', () => {
    // Entfernen ist eine der Fix-Optionen (TK 9.7.5). Es ist ein Fix, kein
    // Schrumpfen von N.
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = starteReparatur(p)

    p.liste.splice(0, 2)
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.gesamt).toBe(3)
    expect(nachher.behoben).toBe(2)
    expect(nachher.offen).toHaveLength(1)
  })

  it('Fix und Zugang im SELBEN Schritt: behoben bleibt stehen, gesamt steigt', () => {
    // Der Fall, in dem die beiden Summanden von `gesamt` gegeneinander laufen -
    // die einzige Kombination, die die verbindliche Formel aus Ablauf 3 wirklich
    // ausreizt: `gesamt = max(stand.gesamt, neuOffen.length + bisher behoben)`.
    const p = projektMitDreiUnabhaengigenStellen()
    let stand = starteReparatur(p)

    repariere(p, 'v1')
    repariere(p, 'v2')
    stand = aktualisiereReparatur(stand, p)
    expect([stand.gesamt, stand.behoben, stand.offen.length]).toEqual([3, 2, 1])

    // Ein Zug: die letzte alte Stelle wird behoben, zwei neue kommen hinzu.
    repariere(p, 'v3')
    p.liste.push(element('e4', 'video', 'neu-1'), element('e5', 'segment', 'neu-2'))
    const nachher = aktualisiereReparatur(stand, p)

    // gesamt = max(3, 2 + 2) = 4, behoben = 4 - 2 = 2. Der im selben Zug
    // erledigte Fix schlägt sich NICHT als eigener Zähl-Schritt nieder: Die
    // Formel kennt nur „offen jetzt" und „bisher behoben", nicht die Reihenfolge
    // der Ereignisse dazwischen. Das ist der bewusst gewählte Preis dafür, dass
    // der Fortschritt nie rückwärts läuft (Ablauf 3) - und er kostet nichts,
    // weil am Ende trotzdem behoben === gesamt gilt (s. letzter Test hier).
    expect(nachher.offen).toHaveLength(2)
    expect(nachher.gesamt).toBe(4)
    expect(nachher.behoben).toBe(2)
    // Das ist die Zusage, auf die es ankommt: KEIN Rücklauf in beiden Zahlen.
    expect(nachher.behoben).toBeGreaterThanOrEqual(stand.behoben)
    expect(nachher.gesamt).toBeGreaterThanOrEqual(stand.gesamt)
    // Und die Freigabe folgt dem Projekt, nicht dem Fortschritt.
    expect(istRenderFreigegeben(p)).toBe(false)
  })

  it('über eine ganze Folge von Schritten sinkt behoben nie und gesamt nie', () => {
    // Die Invariante gesamt >= offen.length ist es, die behoben >= 0 garantiert.
    // Sie wird hier über eine gemischte Folge aus Fixes und Zugängen mitgeführt.
    const p = projektMitDreiUnabhaengigenStellen()
    let stand = starteReparatur(p)
    const verlauf = [stand]

    repariere(p, 'v1')
    stand = aktualisiereReparatur(stand, p)
    verlauf.push(stand)

    p.liste.push(element('e4', 'video', 'unbekannt-1'), element('e5', 'segment', 'unbekannt-2'))
    stand = aktualisiereReparatur(stand, p)
    verlauf.push(stand)

    repariere(p, 'v2')
    repariere(p, 'v3')
    stand = aktualisiereReparatur(stand, p)
    verlauf.push(stand)

    p.liste.length = 0
    stand = aktualisiereReparatur(stand, p)
    verlauf.push(stand)

    for (const [i, s] of verlauf.entries()) {
      expect(s.gesamt).toBeGreaterThanOrEqual(s.offen.length)
      expect(s.behoben).toBeGreaterThanOrEqual(0)
      expect(s.behoben).toBe(s.gesamt - s.offen.length)
      const vorher = verlauf[i - 1]
      if (vorher !== undefined) {
        expect(s.gesamt).toBeGreaterThanOrEqual(vorher.gesamt)
        expect(s.behoben).toBeGreaterThanOrEqual(vorher.behoben)
      }
    }

    expect(stand.behoben).toBe(stand.gesamt)
    expect(stand.aktiv).toBe(false)
  })
})

describe('der Zeiger bleibt stehen - dadurch springt die UI automatisch weiter', () => {
  it('nach dem Beheben der Stelle an Position i zeigt aktuelle auf die nächste offene', () => {
    // Der Zeiger steht auf 1, NICHT auf 0: Ein Aufbau mit Zeiger 0 könnte ein
    // Zurücksetzen auf 0 nicht von der Wahrheit unterscheiden.
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = springeZu(starteReparatur(p), 1)
    expect(stand.aktuelle).toEqual({
      art: 'element_asset',
      elementId: 'e2',
      assetId: 'v2',
      grund: 'asset_fehlt',
    })

    // Genau die Stelle unter dem Zeiger wird behoben.
    repariere(p, 'v2')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.zeigerIndex).toBe(1)
    expect(nachher.aktuelle).toEqual({
      art: 'element_asset',
      elementId: 'e3',
      assetId: 'v3',
      grund: 'asset_fehlt',
    })
  })

  it('wird die LETZTE Stelle behoben, klemmt der Zeiger auf die verbliebene', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = springeZu(starteReparatur(p), 2)

    repariere(p, 'v2')
    repariere(p, 'v3')
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.offen).toHaveLength(1)
    expect(nachher.zeigerIndex).toBe(0)
    expect(nachher.aktuelle).toEqual({
      art: 'element_asset',
      elementId: 'e1',
      assetId: 'v1',
      grund: 'asset_fehlt',
    })
  })

  it('aktualisiereReparatur bei leerer Liste: zeigerIndex 0, aktuelle null', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = springeZu(starteReparatur(p), 2)

    p.liste.length = 0
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.zeigerIndex).toBe(0)
    expect(nachher.aktuelle).toBeNull()
  })

  it('aktuelle ist immer offen[zeigerIndex] - kein zweiter Zeiger', () => {
    const p = projektMitDreifachVerwendeterAktion()
    const staende = [
      starteReparatur(p),
      springeZu(starteReparatur(p), 2),
      beendeReparatur(springeZu(starteReparatur(p), 3)),
      aktualisiereReparatur(springeZu(starteReparatur(p), 1), p),
    ]

    for (const s of staende) {
      expect(s.aktuelle).toBe(s.offen[s.zeigerIndex] ?? null)
    }
  })
})

describe('springeZu - überspringen ist erlaubt, freigeben nicht', () => {
  it('klemmt einen zu grossen und einen negativen Index, ohne zu werfen', () => {
    const stand = starteReparatur(projektMitDreiUnabhaengigenStellen())

    expect(springeZu(stand, 99).zeigerIndex).toBe(2)
    expect(springeZu(stand, -5).zeigerIndex).toBe(0)
    expect(springeZu(stand, 2).zeigerIndex).toBe(2)
  })

  it('klemmt auch NaN, Infinity und Bruchzahlen auf einen benutzbaren Zeiger', () => {
    // offen[NaN] und offen[1.5] sind beide undefined - ungeklemmt stünde
    // `aktuelle: null` bei NICHT leerer Liste, und die Führung bliebe still
    // stehen, obwohl der Fortschritt offene Stellen zeigt.
    const stand = starteReparatur(projektMitDreiUnabhaengigenStellen())

    for (const index of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5]) {
      const gesprungen = springeZu(stand, index)
      expect(gesprungen.aktuelle).not.toBeNull()
      expect(gesprungen.aktuelle).toBe(gesprungen.offen[gesprungen.zeigerIndex])
    }

    expect(springeZu(stand, 1.5).zeigerIndex).toBe(1)
    // „Geklemmt auf [0, offen.length - 1]": die nächstgelegene gültige Position
    // zu +Infinity ist das ENDE der Liste, zu -Infinity ihr Anfang. Nur NaN hat
    // keine Richtung und fällt auf 0 zurück.
    expect(springeZu(stand, Number.POSITIVE_INFINITY).zeigerIndex).toBe(2)
    expect(springeZu(stand, Number.NEGATIVE_INFINITY).zeigerIndex).toBe(0)
    expect(springeZu(stand, Number.NaN).zeigerIndex).toBe(0)
  })

  it('bei leerer Liste: zeigerIndex 0, aktuelle null', () => {
    const stand = starteReparatur(projekt({}))

    expect(springeZu(stand, 7)).toEqual({
      aktiv: false,
      offen: [],
      gesamt: 0,
      behoben: 0,
      zeigerIndex: 0,
      aktuelle: null,
    })
  })

  it('ändert an gesamt, behoben und aktiv nichts - die Sperre bleibt', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = starteReparatur(p)
    repariere(p, 'v1')
    const nachFix = aktualisiereReparatur(stand, p)

    const gesprungen = springeZu(nachFix, 1)

    expect(gesprungen.gesamt).toBe(nachFix.gesamt)
    expect(gesprungen.behoben).toBe(nachFix.behoben)
    expect(gesprungen.aktiv).toBe(nachFix.aktiv)
    expect(gesprungen.offen).toEqual(nachFix.offen)
    expect(istRenderFreigegeben(p)).toBe(false)
  })
})

describe('beendeReparatur - der Modus endet, die Sperre nicht', () => {
  it('setzt aktiv false und lässt offen, gesamt, behoben und den Zeiger unangetastet', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = springeZu(starteReparatur(p), 1)

    const beendet = beendeReparatur(stand)

    expect(beendet.aktiv).toBe(false)
    expect(beendet.offen).toEqual(stand.offen)
    expect(beendet.offen).toHaveLength(3)
    expect(beendet.gesamt).toBe(stand.gesamt)
    expect(beendet.behoben).toBe(stand.behoben)
    expect(beendet.zeigerIndex).toBe(1)
    expect(beendet.aktuelle).toBe(stand.aktuelle)
    // Der Render bleibt gesperrt - die Auskunft kommt aus dem Projekt.
    expect(istRenderFreigegeben(p)).toBe(false)
  })

  it('auf einem bereits beendeten Stand ist es folgenlos', () => {
    const stand = beendeReparatur(starteReparatur(projektMitDreiUnabhaengigenStellen()))

    expect(beendeReparatur(stand)).toEqual(stand)
  })
})

describe('aktiv wird nie eingeschaltet - nur starteReparatur schaltet ein', () => {
  it('nach beendeReparatur bleibt aktiv false, auch wenn eine WEITERE Stelle hinzukommt', () => {
    // Sonst risse die nächste beliebige Änderung den Nutzer in den Modus zurück,
    // den er gerade verlassen hat - bei jeder Änderung aufs Neue.
    const p = projektMitDreiUnabhaengigenStellen()
    const beendet = beendeReparatur(starteReparatur(p))
    expect(beendet.aktiv).toBe(false)

    p.liste.push(element('e4', 'video', 'noch-eine-kaputte'))
    const nachher = aktualisiereReparatur(beendet, p)

    expect(nachher.aktiv).toBe(false)
    expect(nachher.offen).toHaveLength(4)
    expect(nachher.gesamt).toBe(4)
  })

  it('auch ein heiles Projekt, das wieder kaputt wird, schaltet nicht ein', () => {
    const p = projekt({ assets: [asset('v1', 'ok')], liste: [element('e1', 'video', 'v1')] })
    const stand = starteReparatur(p) // aktiv: false, weil nichts kaputt war
    expect(stand.aktiv).toBe(false)

    const gefunden = p.assets.find((a) => a.id === 'v1')
    if (gefunden === undefined) throw new Error('Testaufbau kaputt')
    gefunden.zustand = 'fehlt'
    const nachher = aktualisiereReparatur(stand, p)

    expect(nachher.aktiv).toBe(false)
    expect(nachher.offen).toHaveLength(1)
    // Wer den Modus wieder betreten will, ruft starteReparatur.
    expect(starteReparatur(p).aktiv).toBe(true)
  })

  it('während der Modus läuft, bleibt aktiv true, bis nichts mehr offen ist', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    let stand = starteReparatur(p)
    expect(stand.aktiv).toBe(true)

    repariere(p, 'v1')
    stand = aktualisiereReparatur(stand, p)
    expect(stand.aktiv).toBe(true)

    repariere(p, 'v2')
    repariere(p, 'v3')
    stand = aktualisiereReparatur(stand, p)
    expect(stand.aktiv).toBe(false)
  })
})

describe('istRenderFreigegeben - die einzige Freigabe-Auskunft, aus dem Projekt', () => {
  it('ist genau dann true, wenn findeKaputteStellen leer ist', () => {
    const heil = projekt({ assets: [asset('v1', 'ok')], liste: [element('e1', 'video', 'v1')] })
    const kaputt = projektMitDreifachVerwendeterAktion()

    expect(findeKaputteStellen(heil)).toEqual([])
    expect(istRenderFreigegeben(heil)).toBe(true)

    expect(findeKaputteStellen(kaputt).length).toBeGreaterThan(0)
    expect(istRenderFreigegeben(kaputt)).toBe(false)
  })

  it('bleibt false nach beendeReparatur mit noch offenen Stellen', () => {
    // Der Weg, auf dem eine aus dem Stand abgeleitete Freigabe kippen würde.
    const p = projektMitDreiUnabhaengigenStellen()
    beendeReparatur(starteReparatur(p))

    expect(istRenderFreigegeben(p)).toBe(false)
  })

  it('folgt dem Projekt, nicht einem veralteten Stand - in beide Richtungen', () => {
    const p = projektMitDreiUnabhaengigenStellen()
    const veraltet = starteReparatur(p)

    repariere(p, 'v1')
    repariere(p, 'v2')
    repariere(p, 'v3')
    expect(veraltet.offen).toHaveLength(3) // der Stand weiss nichts davon
    expect(istRenderFreigegeben(p)).toBe(true)

    // ... und wieder zurück (TK 9.4.7 kennt beide Richtungen).
    const gefunden = p.assets.find((a) => a.id === 'v2')
    if (gefunden === undefined) throw new Error('Testaufbau kaputt')
    gefunden.zustand = 'fehlt'
    expect(istRenderFreigegeben(p)).toBe(false)
  })

  it('ein leeres Projekt ist freigegeben', () => {
    expect(istRenderFreigegeben(projekt({}))).toBe(true)
  })

  it('auch ein einzelner kaputter Band-Abschnitt sperrt - Fall 3 zählt mit', () => {
    // Ohne Fall 3 gälte das Projekt als heil, template-canvas zeichnete einen
    // Platzhalter, und der landete in der fertigen MP4 (TK 9.10.7).
    const p = projekt({
      assets: [asset('v-ok', 'ok'), asset('b-weg', 'fehlt', 'bild')],
      aktionen: [aktion('a1', 'b-weg')],
      liste: [element('e1', 'video', 'v-ok', band('a1'))],
    })

    expect(istRenderFreigegeben(p)).toBe(false)
  })
})

describe('reine Werte - keine Funktion mutiert Eingabe oder Projekt', () => {
  it('keine der vier Funktionen verändert den übergebenen Stand', () => {
    const p = projektMitDreifachVerwendeterAktion()
    const stand = starteReparatur(p)
    const vorher = structuredClone(stand)

    const ergebnisse = [
      aktualisiereReparatur(stand, p),
      springeZu(stand, 2),
      springeZu(stand, -1),
      beendeReparatur(stand),
    ]

    expect(stand).toEqual(vorher)
    for (const e of ergebnisse) {
      expect(e).not.toBe(stand) // jedes Mal eine NEUE Instanz
      expect(e.offen).not.toBe(stand.offen) // und ein eigenes Array
    }
  })

  it('keine der Funktionen verändert das übergebene Projekt', () => {
    const p = projektMitDreifachVerwendeterAktion()
    const vorher = structuredClone(p)

    const stand = starteReparatur(p)
    aktualisiereReparatur(stand, p)
    istRenderFreigegeben(p)

    expect(p).toEqual(vorher)
  })

  it('ein weitergereichter Stand bleibt unberührt, wenn der Empfänger sein Array umsortiert', () => {
    // Der Stand reist über den Reiterwechsel (TK 9.14.2) und wird von der
    // app-shell gehalten; `offen` ist ein schreibbares Array. Teilten sich zwei
    // Stände eines, änderte ein Sortieren rückwirkend den alten mit.
    const p = projektMitDreiUnabhaengigenStellen()
    const stand = starteReparatur(p)
    const kopie = beendeReparatur(stand)

    kopie.offen.reverse()

    expect(stand.offen.map((s) => (s.art === 'element_asset' ? s.elementId : ''))).toEqual([
      'e1',
      'e2',
      'e3',
    ])
  })

  it('zwei Läufe mit gleicher Eingabe liefern gleiche Stände', () => {
    const p = projektMitDreifachVerwendeterAktion()

    expect(starteReparatur(p)).toEqual(starteReparatur(p))
    expect(starteReparatur(p)).not.toBe(starteReparatur(p))
  })
})

describe('Modulgrenze - reine Zustandsführung, kein Zustand im Modul', () => {
  const QUELLE = readFileSync(
    new URL('../../src/renderer/composer/reparatur-fuehrung.ts', import.meta.url),
    'utf8',
  ).replace(/\r\n/g, '\n')
  // Die Kommentare nennen „IPC", „Reiter" und „app-shell" in der Begründung.
  // Geprüft werden deshalb nur echte Code-Zeilen, sonst schlüge die Regel an
  // ihrer eigenen Erklärung an.
  const CODEZEILEN = QUELLE.split('\n').filter(
    (z) => !z.trimStart().startsWith('//') && !z.trimStart().startsWith('*'),
  )

  it('hält keine Modulvariable - es gibt keine Deklaration auf Modulebene', () => {
    // Der Stand darf nicht an der Lebensdauer dieses Moduls hängen (TK 9.14.2).
    expect(CODEZEILEN.filter((z) => /^(?:export\s+)?(?:const|let|var)\s/.test(z))).toEqual([])
  })

  it('importiert weder React noch fs/path/electron', () => {
    for (const verboten of ['react', 'react-dom', 'fs', 'node:fs', 'path', 'node:path', 'electron']) {
      expect(CODEZEILEN.filter((z) => new RegExp(`from ['"]${verboten}['"]`).test(z))).toEqual([])
    }
  })

  it('ruft keinen ipc-client auf und rührt window.api nicht an', () => {
    expect(CODEZEILEN.filter((z) => /ipc-client|window\.api|rufeAuf|abonniere/.test(z))).toEqual([])
  })

  it('importiert nur den Projekt-Vertrag und die Erkennung aus #131', () => {
    expect(CODEZEILEN.filter((z) => z.startsWith('import'))).toEqual([
      "import type { Project } from '../../shared/contracts/project'",
      "import { findeKaputteStellen } from './kaputt-erkennung'",
      "import type { KaputteStelle } from './kaputt-erkennung'",
    ])
  })

  it('enthält kein async, keine Ergebnis-Hülle und keinen Timer', () => {
    expect(CODEZEILEN.filter((z) => /\basync\b|Ergebnis<|setTimeout|setInterval/.test(z))).toEqual(
      [],
    )
  })
})
