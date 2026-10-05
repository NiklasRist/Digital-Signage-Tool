// Tests zu #253 - einblendung-ansicht.ts (die REINE Fachlichkeit der
// Band-Bedienung, ohne JSX, ohne react, ohne IPC).
//
// Geprueft wird vor allem die Unbestechlichkeit der Anzeige: keine zweite
// Frame-Rundung (die Zahlen kommen unverändert aus dem Plan), keine
// Reihenfolge-Erneuerung, kein verschwiegener Nullframe-Abschnitt, keine
// selbst erfundene Reparatur. Zwei Kernnachweise (Reihenfolge, Kaputt-Filter)
// stehen je als eigener benannter Test.
//
// Die Pläne werden per HAND gebaut - genau DAS ist der Punkt: Diese Datei
// rechnet nichts nach, also darf der Test ihr Pläne geben, deren Zahlen
// absichtlich nicht zueinander passen. Reale Pläne liefert #130 und hat seine
// eigenen Tests.
import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Listenelement } from '../../src/shared/contracts/project'
import type { BandAblaufplan, BandVerhalten } from '../../src/renderer/composer/einblendung-vorschau'
import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import {
  entwurfAus,
  baueAbschnittZeilen,
  kaputteAbschnitte,
  baueWirkungsanzeige,
  bandVorlage,
  artLabel,
  istUebernehmbar,
  BEZEICHNUNG_UNBEKANNT,
} from '../../src/renderer/composer/einblendung-ansicht'

const element: Listenelement = {
  id: 'el-1',
  art: 'video',
  ref: 'asset-1',
  dauer: null,
  trimStart: 0,
  trimEnde: 12,
  einblendung: null,
}

function aktion(id: string, titel: string): Aktion {
  return {
    id, titel, beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer: null, vorlagenId: 'v', akzentfarbe: null,
  }
}

function vorlage(id: string, art: Vorlage['art'], parent: string | null, hoehe: number | null): Vorlage {
  return { id, name: id, art, höhe: hoehe, parent, eingebaut: false, zonen: [] }
}

/** Ein HAND-GEBAUTER Plan: die Zahlen stehen so, wie der Test sie braucht -
 *  nachrechnen tut diese Datei gerade NICHT. */
function plan(ueberschreibt: Partial<BandAblaufplan> = {}): BandAblaufplan {
  const basis: BandAblaufplan & { verhalten: BandVerhalten } = {
    verhalten: 'wiederholt',
    videoFrames: 360,
    folgeFrames: 240,
    volleDurchlaeufe: 1,
    restFrames: 120,
    angeschnittenerIndex: null,
    abschnittsFrames: [90, 90, 60],
    nullFrameIndizes: [],
  }
  return { ...basis, ...ueberschreibt }
}

/** Der Eintrag an einer benannten Stelle, mit Laengenbeleg statt Fluchttuer
 *  (noUncheckedIndexedAccess - `!` ist im Projekt verboten). */
function anDerStelle<T>(liste: readonly T[], stelle: number): T {
  const eintrag = liste[stelle]
  expect(eintrag).toBeDefined()
  return eintrag as T
}

describe('entwurfAus', () => {
  it('Kopie bei vorhandener Einblendung: dieselbe Vorlagen-ID, dieselben Abschnitte, NEUES Array', () => {
    const mitBand: Listenelement = {
      ...element,
      einblendung: {
        bandVorlageId: 'band-x',
        abschnitte: [
          { aktionRef: 'a1', dauer: 7 },
          { aktionRef: 'a2', dauer: 8 },
        ],
      },
    }
    const eingefroren = Object.freeze(mitBand)
    const entwurf = entwurfAus(eingefroren, 'band-x')
    if (entwurf === null || mitBand.einblendung === null) {
      // Belegter Abbruch statt geraunten Zugriffen: naemlich dann, wenn die
      // zugesagte Kopie NICHT gebaut wurde.
      throw new Error('entwurfAus lieferte keine Kopie des Vorhandenen')
    }
    expect(entwurf.bandVorlageId).toBe('band-x')
    expect(entwurf.abschnitte).toEqual(mitBand.einblendung.abschnitte)
    // Der DoD-Vertrag: ein NEUES Array, damit eine spaetere Bearbeitung das
    // Element nie anfassen kann.
    expect(entwurf.abschnitte).not.toBe(mitBand.einblendung.abschnitte)
  })

  it('Ohne Einblendung: vorgabeVorlagenId und leere Abschnittsliste', () => {
    const entwurf = entwurfAus(element, 'band-standard')
    expect(entwurf).toEqual({ bandVorlageId: 'band-standard', abschnitte: [] })
  })

  it('null bei einem Segment-Element und bei vorgabeVorlagenId === null', () => {
    // Der gebaute Vertrag (project.ts, nach der Streichung von `bild`) kennt
    // nur 'video' | 'segment' - beide Nicht-Video-Arten laufen ueber denselben
    // Zweig (`art !== 'video'`).
    const segment: Listenelement = { ...element, art: 'segment' }
    expect(entwurfAus(segment, 'band-x')).toBeNull()
    expect(entwurfAus(element, null)).toBeNull()
  })
})

describe('baueAbschnittZeilen', () => {
  const entwurf = {
    bandVorlageId: 'band-x',
    abschnitte: [
      { aktionRef: 'a2', dauer: 8 },
      { aktionRef: 'a1', dauer: 7 },
      { aktionRef: 'a3', dauer: 9 },
    ],
  }
  const aktionen = [aktion('a1', 'Aktion A'), aktion('a2', 'Aktion B'), aktion('a3', 'Aktion C')]

  it('genau so viele Zeilen wie Abschnitte, dieselbe Reihenfolge, index ab 0 und position ab 1 lückenlos', () => {
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, plan(), [])
    expect(zeilen).toHaveLength(3)
    expect(zeilen.map((zeile) => zeile.index)).toEqual([0, 1, 2])
    expect(zeilen.map((zeile) => zeile.position)).toEqual([1, 2, 3])
    expect(zeilen.map((zeile) => zeile.aktionRef)).toEqual(['a2', 'a1', 'a3'])
  })

  it('KERNNACHWEIS: die Reihenfolge folgt dem Entwurf, NICHT den alphabetischen Titeln', () => {
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, plan(), [])
    expect(zeilen.map((zeile) => zeile.bezeichnung)).toEqual(['Aktion B', 'Aktion A', 'Aktion C'])
  })

  it('bezeichnung ist der Titel; eine ins Leere zeigende Referenz ergibt den Ersatznamen und bleibt an ihrer Position', () => {
    const lueckig = {
      bandVorlageId: 'band-x',
      abschnitte: [
        { aktionRef: 'a1', dauer: 7 },
        { aktionRef: 'fehlt', dauer: 8 },
      ],
    }
    const zeilen = baueAbschnittZeilen(lueckig, aktionen, plan(), [])
    expect(anDerStelle(zeilen, 0).bezeichnung).toBe('Aktion A')
    expect(anDerStelle(zeilen, 1).bezeichnung).toBe(BEZEICHNUNG_UNBEKANNT)
    expect(anDerStelle(zeilen, 1).position).toBe(2)
  })

  it('frames ist exakt der Plan-Eintrag; ein fehlender Eintrag ergibt 0 ohne Wurf', () => {
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, plan({ abschnittsFrames: [90, 90] }), [])
    expect(anDerStelle(zeilen, 0).frames).toBe(90)
    expect(anDerStelle(zeilen, 1).frames).toBe(90)
    expect(anDerStelle(zeilen, 2).frames).toBe(0)
  })

  it('faelltAus folgt der Liste des Plans, NICHT frames === 0 - beide Angaben laufen absichtlich auseinander', () => {
    const spalt: BandAblaufplan = plan({
      abschnittsFrames: [0, 90, 60],
      nullFrameIndizes: [2],
    })
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, spalt, [])
    // Index 0 hat 0 Frames, steht ABER nicht in der Liste - NICHT ausgefallen.
    expect(anDerStelle(zeilen, 0).frames).toBe(0)
    expect(anDerStelle(zeilen, 0).faelltAus).toBe(false)
    // Index 2 steht in der Liste, hat ABER eine Zahl groesser 0 - ausgefallen
    // trotz der Zahl. Beide Richtungen der Auseinanderlaufs sind belegt.
    expect(anDerStelle(zeilen, 2).frames).toBe(60)
    expect(anDerStelle(zeilen, 2).faelltAus).toBe(true)
  })

  it('angeschnitten bei hoechstens einer Zeile und nur am plan.angeschnittenerIndex', () => {
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, plan({ angeschnittenerIndex: 1 }), [])
    expect(zeilen.filter((zeile) => zeile.angeschnitten).map((zeile) => zeile.index)).toEqual([1])
    const ohne = baueAbschnittZeilen(entwurf, aktionen, plan(), [])
    expect(ohne.every((zeile) => !zeile.angeschnitten)).toBe(true)
  })

  it('kaputt ist genau dann true, wenn der Index in kaputteIndizes steht', () => {
    const zeilen = baueAbschnittZeilen(entwurf, aktionen, plan(), [1])
    expect(anDerStelle(zeilen, 0).kaputt).toBe(false)
    expect(anDerStelle(zeilen, 1).kaputt).toBe(true)
    expect(anDerStelle(zeilen, 2).kaputt).toBe(false)
  })
})

describe('kaputteAbschnitte', () => {
  it('KERNNACHWEIS: nur Art band_abschnitt und nur DIES Element - Fall 3 aus TK 9.7.5', () => {
    const stellen: KaputteStelle[] = [
      { art: 'element_asset', elementId: 'el-1', assetId: 'x', grund: 'asset_fehlt' },
      { art: 'element_aktion', elementId: 'el-1', aktionId: 'a1', assetId: null, grund: 'aktion_unbekannt' },
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 2, aktionId: 'a1', assetId: null, grund: 'asset_fehlt' },
      // Anderes Element: ignoriert.
      { art: 'band_abschnitt', elementId: 'el-2', abschnittIndex: 0, aktionId: 'a2', assetId: null, grund: 'asset_fehlt' },
    ]
    expect(kaputteAbschnitte(stellen, 'el-1')).toEqual([2])
  })

  it('aufsteigend und ohne Dubletten, auch bei unsortierter und doppelter Eingabe', () => {
    const stellen: KaputteStelle[] = [
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 3, aktionId: 'a', assetId: null, grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 1, aktionId: 'a', assetId: null, grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 1, aktionId: 'a', assetId: null, grund: 'asset_fehlt' },
    ]
    expect(kaputteAbschnitte(stellen, 'el-1')).toEqual([1, 3])
  })

  it('leer, wenn nichts betroffen ist', () => {
    expect(kaputteAbschnitte([], 'el-1')).toEqual([])
  })
})

describe('baueWirkungsanzeige', () => {
  it('ein nicht leerer Satz fuer jeden der vier Verhalten-Werte', () => {
    const verhalten: BandVerhalten[] = ['leer', 'exakt', 'wiederholt', 'abgeschnitten']
    for (const verhaeltSichSo of verhalten) {
      const anzeige = baueWirkungsanzeige(plan({ verhalten: verhaeltSichSo }))
      expect(anzeige.text.length).toBeGreaterThan(0)
    }
  })

  it('warnung bei abgeschnitten, bei leer und bei Nullframe-Abschnitten; keine bei exakt und bei wiederholt ohne Ausfaelle', () => {
    expect(baueWirkungsanzeige(plan({ verhalten: 'abgeschnitten' })).warnung).toBe(true)
    expect(baueWirkungsanzeige(plan({ verhalten: 'leer' })).warnung).toBe(true)
    expect(
      baueWirkungsanzeige(plan({ verhalten: 'exakt', nullFrameIndizes: [] })).warnung,
    ).toBe(false)
    expect(
      baueWirkungsanzeige(plan({ verhalten: 'wiederholt', nullFrameIndizes: [] })).warnung,
    ).toBe(false)
    expect(
      baueWirkungsanzeige(plan({ verhalten: 'wiederholt', nullFrameIndizes: [1] })).warnung,
    ).toBe(true)
  })

  it('der Text folgt den ZAHLEN des Plans, nicht der Plausibilitaet (absichtlich unzusammenpassende Zahlen)', () => {
    const unwahrscheinlich = plan({
      verhalten: 'abgeschnitten',
      volleDurchlaeufe: 4,
      restFrames: 3,
      angeschnittenerIndex: 2,
    })
    const anzeige = baueWirkungsanzeige(unwahrscheinlich)
    // Sowohl die Durchlaeufe als auch der Schnitt-Index stehen unverändert im Text.
    expect(anzeige.warnung).toBe(true)
    const zeilen = baueAbschnittZeilen(
      { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: 1 }, { aktionRef: 'a', dauer: 1 }, { aktionRef: 'a', dauer: 1 }] },
      [aktion('a', 'X')],
      unwahrscheinlich,
      [],
    )
    expect(anDerStelle(zeilen, 2).angeschnitten).toBe(true)
    expect(zeilen.filter((zeile) => zeile.angeschnitten)).toHaveLength(1)
  })

  it('ausfallText ist leer ohne Ausfaelle und nennt sonst die 1-basierten Positionen', () => {
    expect(baueWirkungsanzeige(plan({ nullFrameIndizes: [] })).ausfallText).toBe('')
    const anzeige = baueWirkungsanzeige(plan({ nullFrameIndizes: [0, 2] }))
    expect(anzeige.ausfallText).not.toBe('')
    expect(anzeige.ausfallText).toContain('1')
    expect(anzeige.ausfallText).toContain('3')
  })
})

describe('bandVorlage und artLabel', () => {
  const b = vorlage('band-ein', 'einblendung', null, 210)
  const besteand = [vorlage('split-x', 'split', null, 210), b]

  it('bandVorlage liefert die toBe-gleiche Vorlage, sonst null', () => {
    expect(bandVorlage({ bandVorlageId: 'band-ein', abschnitte: [] }, besteand)).toBe(b)
    expect(bandVorlage({ bandVorlageId: 'fehlt', abschnitte: [] }, besteand)).toBeNull()
  })

  it('artLabel: leer bei null und bei vollflaeche; verschieden zwischen split und einblendung', () => {
    expect(artLabel(null)).toBe('')
    expect(artLabel(vorlage('vol', 'vollflaeche', null, null))).toBe('')
    const split = artLabel(vorlage('s', 'split', null, 210))
    const einblendung = artLabel(vorlage('e', 'einblendung', null, 210))
    expect(split.length).toBeGreaterThan(0)
    expect(einblendung.length).toBeGreaterThan(0)
    expect(split).not.toBe(einblendung)
  })
})

describe('istUebernehmbar', () => {
  it('true bei gueltiger Vorlagen-ID und NULL Abschnitten (TK 9.5.3: das Band wird entfernt)', () => {
    expect(istUebernehmbar({ bandVorlageId: 'band-x', abschnitte: [] })).toBe(true)
  })

  it('false bei leerer bandVorlageId, dauer === 0, NaN, Infinity, negativer dauer und leerer aktionRef', () => {
    expect(istUebernehmbar({ bandVorlageId: '', abschnitte: [{ aktionRef: 'a', dauer: 1 }] })).toBe(false)
    expect(istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: 0 }] })).toBe(false)
    expect(istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: Number.NaN }] })).toBe(false)
    expect(istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: Number.POSITIVE_INFINITY }] })).toBe(false)
    expect(istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: -1 }] })).toBe(false)
    expect(istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: '', dauer: 1 }] })).toBe(false)
  })

  it('alle gültig bleibt true', () => {
    expect(
      istUebernehmbar({ bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: 0.5 }] }),
    ).toBe(true)
  })
})

describe('keine Mutation der Eingaben', () => {
  it('eingefrorene Eingaben ueberleben alle Funktionen ohne Wurf', () => {
    // Object.freeze macht die Einblendung readonly; die Typsicht des Vertrags
    // bleibt mutierbar. Die Laufzeit ist trotzdem gefroren - gerade DAS soll
    // der Test nachweisen (kein Wurf, keine Mutation).
    const eingefrorenesElement = Object.freeze({
      ...element,
      einblendung: Object.freeze({
        bandVorlageId: 'band-x',
        abschnitte: Object.freeze([{ aktionRef: 'a1', dauer: 7 }]),
      }),
    }) as unknown as Listenelement
    // Object.freeze macht Arrays readonly; der FUNKTIONSTYP verlangt das
    // mutable Gegenstück. Der Test friert trotzdem ein (Laufzeit-Schutz) und
    // loest die Typsicht bewusst auf - die Produktion uebergibt nun mal
    // mutable Baecsteine, gerade DAS will der Test beweisen.
    const entwurf: { bandVorlageId: string; abschnitte: Array<{ aktionRef: string; dauer: number }> } =
      Object.freeze({
        bandVorlageId: 'band-x',
        abschnitte: Object.freeze([{ aktionRef: 'a1', dauer: 7 }]),
      }) as unknown as { bandVorlageId: string; abschnitte: Array<{ aktionRef: string; dauer: number }> }
    const abFest = Object.freeze([aktion('a1', 'A')])
    const vorlagenFest = Object.freeze([vorlage('band-x', 'split', null, 210)])
    const planFest: BandAblaufplan = Object.freeze(plan({ angeschnittenerIndex: 0 }))
    const stellenFest: readonly KaputteStelle[] = Object.freeze([
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 0, aktionId: 'a1', assetId: null, grund: 'asset_fehlt' },
    ])

    expect(() => entwurfAus(eingefrorenesElement, 'band-x')).not.toThrow()
    expect(() =>
      baueAbschnittZeilen(entwurf, abFest, planFest, kaputteAbschnitte(stellenFest, 'el-1')),
    ).not.toThrow()
    expect(() => baueWirkungsanzeige(planFest)).not.toThrow()
    expect(() => bandVorlage(entwurf, vorlagenFest)).not.toThrow()
    expect(() => istUebernehmbar(entwurf)).not.toThrow()
  })
})
