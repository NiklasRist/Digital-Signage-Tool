import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { Vorlage, Zone, ZonenRolle } from '../../src/shared/contracts/vorlage'
import { baueZonenListe, ordneZonenNeu } from '../../src/renderer/vorlagen-editor/zonen-liste'

// Verhaltenstests zu #146 - die Zonen-Liste als Zeichenreihenfolge.
//
// ZWEI FUNKTIONEN, ZWEI VERSPRECHEN:
//   baueZonenListe ist eine 1:1-Abbildung von vorlage.zonen OHNE jede Sortierung -
//   die Reihenfolge der Liste IST die Zeichenreihenfolge. `ebene` ist reiner
//   Anzeigetext (index + 1), `beweglich` ist genau dort wahr, wo der Nutzer
//   ziehen darf.
//   ordneZonenNeu verschiebt einen Eintrag mit Splice-Semantik (Zielposition NACH
//   dem Entfernen, so wie dnd-kit die Indizes meldet), ohne das Eingangsarray
//   anzufassen und ohne die relative Reihenfolge der festen Zonen anzutasten.

function zone(id: string, rolle: ZonenRolle = 'frei'): Zone {
  return {
    id,
    rolle,
    bindung: null,
    rahmen: { x: 0, y: 0, breite: 100, höhe: 100 },
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
  }
}

function vorlage(...zonen: Zone[]): Vorlage {
  return {
    id: 'v1',
    name: 'Testvorlage',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

const ids = (liste: Array<{ id: string }>): string[] => liste.map((eintrag) => eintrag.id)

// Quelltext der zu pruefenden Datei, einmal gelesen fuer beide Grep-Bloecke.
// Kommentare entfernen - die Regeln gelten dem CODE. Der Dateikopf und die
// Erklaerungen zitieren den Vertrag („Zeichenreihenfolge", „#146") zu Recht.
// REIHENFOLGE BEACHTEN: erst die Zeilen-, dann die Blockkommentare. Und erst
// \r\n normalisieren, damit die Filter auf jeder Plattform gleich treffen.
const zeilenDurchgehend = readFileSync(
  fileURLToPath(new URL('../../src/renderer/vorlagen-editor/zonen-liste.ts', import.meta.url)),
  'utf8',
).replace(/\r\n/g, '\n')
const code = zeilenDurchgehend.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

describe('baueZonenListe (#146)', () => {
  it('bildet je Zone einen Eintrag in IDENTISCHER Reihenfolge - 1:1, nichts sortiert', () => {
    const eintraege = baueZonenListe(
      vorlage(zone('hintergrund', 'fest'), zone('motiv', 'fest'), zone('preis'), zone('logo')),
    )

    expect(ids(eintraege.map((e) => e.zone))).toEqual(['hintergrund', 'motiv', 'preis', 'logo'])
  })

  it('fuehrt index gleich der Array-Position und ebene gleich index + 1', () => {
    const eintraege = baueZonenListe(vorlage(zone('a'), zone('b'), zone('c'), zone('d')))

    expect(eintraege.map((e) => e.index)).toEqual([0, 1, 2, 3])
    expect(eintraege.map((e) => e.ebene)).toEqual([1, 2, 3, 4])
  })

  it('setzt beweglich GENAU bei rolle frei - feste Zonen sind gesperrt', () => {
    const eintraege = baueZonenListe(
      vorlage(zone('hintergrund', 'fest'), zone('preis'), zone('logo', 'fest')),
    )

    expect(eintraege.map((e) => e.beweglich)).toEqual([false, true, false])
  })

  it('uebernimmt die Zone als Referenz, nicht als Kopie', () => {
    const hintergrund = zone('hintergrund', 'fest')
    const zonen = [hintergrund, zone('preis')]
    const eintraege = baueZonenListe(vorlage(...zonen))

    // toBe, nicht toEqual: Diese Datei darf keine Zone verdoppeln - ein naechster
    // Schritt, der den Stand ueberschreibt, wuerde sonst den Zwilling treffen.
    expect(eintraege[0]?.zone).toBe(hintergrund)
    expect(eintraege[1]?.zone).toBe(zonen[1])
  })

  it('liefert fuer eine Vorlage ohne Zonen eine leere Liste', () => {
    expect(baueZonenListe(vorlage())).toEqual([])
  })
})

describe('ordneZonenNeu (#146) - Splice-Semantik', () => {
  it('verschiebt [A,B,C] von 0 nach 2 zu [B,C,A] (DoD: Splice-Semantik)', () => {
    const zonen = [zone('A'), zone('B'), zone('C')]

    const ergebnis = ordneZonenNeu(zonen, 0, 2)

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.ok === true && ids(ergebnis.wert)).toEqual(['B', 'C', 'A'])
  })

  it('bezieht die Zielposition auf das Array NACH dem Entfernen', () => {
    const zonen = [zone('A'), zone('B'), zone('C')]

    const ergebnis = ordneZonenNeu(zonen, 1, 2)

    expect(ergebnis.ok === true && ids(ergebnis.wert)).toEqual(['A', 'C', 'B'])
  })

  it('laesst die feste Zone unangetastet und haengt die freie dahinter ein', () => {
    const zonen = [zone('hintergrund', 'fest'), zone('A'), zone('B')]

    const ergebnis = ordneZonenNeu(zonen, 2, 1)

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.ok === true && ids(ergebnis.wert)).toEqual(['hintergrund', 'B', 'A'])
  })

  it('laesst bei einem Zug ueber feste Zonen hinweg deren relative Reihenfolge unveraendert', () => {
    const zonen = [zone('logo', 'fest'), zone('A'), zone('beschreibung', 'fest'), zone('B')]

    const ergebnis = ordneZonenNeu(zonen, 3, 0)

    expect(ergebnis.ok === true && ids(ergebnis.wert)).toEqual(['B', 'logo', 'A', 'beschreibung'])
    expect(ergebnis.ok === true && ids(ergebnis.wert.filter((z) => z.rolle === 'fest'))).toEqual([
      'logo',
      'beschreibung',
    ])
  })

  it('liefert ein NEUES Array und laesst das uebergebene unveraendert', () => {
    const zonen = [zone('A'), zone('B'), zone('C')]
    const vorher = zonen.map((z) => z)

    const ergebnis = ordneZonenNeu(zonen, 0, 2)

    expect(ergebnis.ok === true && ergebnis.wert).not.toBe(zonen)
    expect(zonen).toEqual(vorher)
    expect(ids(zonen)).toEqual(['A', 'B', 'C'])
  })

  it('haengt DIESELBEN Zonen-Objekte um, statt sie zu kopieren (wie der store es erwartet)', () => {
    const zonen = [zone('A'), zone('B'), zone('C')]
    const [a, b, c] = zonen

    const ergebnis = ordneZonenNeu(zonen, 0, 2)

    expect(ergebnis.ok === true && ergebnis.wert[1]).toBe(c)
    expect(ergebnis.ok === true && ergebnis.wert[0]).toBe(b)
    expect(ergebnis.ok === true && ergebnis.wert[2]).toBe(a)
  })
})

describe('ordneZonenNeu (#146) - Ziehen am selben Ort', () => {
  it('liefert fuer vonIndex === nachIndex ok:true mit einem neuen, gleichwertigen Array', () => {
    const zonen = [zone('A'), zone('B')]

    const ergebnis = ordneZonenNeu(zonen, 0, 0)

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.ok === true && ergebnis.wert).toEqual(zonen)
    expect(ergebnis.ok === true && ergebnis.wert).not.toBe(zonen)
  })

  it('behandelt dieselbe Handlung auch fuer eine FESTE Zone als geltlos (Pruefung vor der Sperre)', () => {
    // Ablauf laut Issue: erst 'ganze Zahl im Bereich', dann 'vonIndex === nachIndex',
    // dann 'rolle fest'. Ein Ziehen, das dort endet, wo es begann, ist eine gueltige
    // Handlung ohne Ergebnis - auch die gesperrte Zeile.
    const zonen = [zone('hintergrund', 'fest'), zone('A')]

    const ergebnis = ordneZonenNeu(zonen, 0, 0)

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.ok === true && ids(ergebnis.wert)).toEqual(['hintergrund', 'A'])
  })
})

describe('ordneZonenNeu (#146) - Fehlerpfade', () => {
  it('weist das Ziehen einer FESTEN Zone mit ungueltige_eingabe ab, ohne Wirkung', () => {
    const zonen = [zone('hintergrund', 'fest'), zone('motiv', 'fest'), zone('A')]
    const vorher = zonen.map((z) => z)

    const ergebnis = ordneZonenNeu(zonen, 0, 2)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ergebnis.ok === false && ergebnis.fehler.meldung).toContain('Markenrahmen')
    expect(ergebnis.ok === false && ergebnis.fehler.daten).toBeUndefined()
    expect(ids(zonen)).toEqual(['hintergrund', 'motiv', 'A'])
    expect(zonen).toEqual(vorher)
  })

  it('nennt die verbindliche Meldung aus dem Issue woertlich', () => {
    const ergebnis = ordneZonenNeu([zone('hintergrund', 'fest'), zone('A')], 0, 1)

    expect(ergebnis.ok === false && ergebnis.fehler.meldung).toBe(
      'Feste Zonen gehören zum Markenrahmen und behalten ihren Platz in der Zeichenreihenfolge.',
    )
  })

  it.each([
    ['negativ', -1],
    ['gleich Laenge', 2],
    ['Gleitkommazahl', 1.5],
    ['NaN', Number.NaN],
  ])('weist vonIndex=%s mit ungueltige_eingabe ab, ohne Wirkung', (_bezeichnung, vonIndex) => {
    const zonen = [zone('A'), zone('B')]

    const ergebnis = ordneZonenNeu(zonen, vonIndex as number, 0)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ids(zonen)).toEqual(['A', 'B'])
  })

  it.each([
    ['negativ', -1],
    ['gleich Laenge', 3],
    ['Gleitkommazahl', 0.5],
    ['NaN', Number.NaN],
  ])('weist nachIndex=%s mit ungueltige_eingabe ab, ohne Wirkung', (_bezeichnung, nachIndex) => {
    const zonen = [zone('A'), zone('B'), zone('C')]

    const ergebnis = ordneZonenNeu(zonen, 0, nachIndex as number)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ids(zonen)).toEqual(['A', 'B', 'C'])
  })

  it('weist bei leerer Zonenliste jeden Index ab - keine Wirkung', () => {
    const zonen: Zone[] = []

    const ergebnis = ordneZonenNeu(zonen, 0, 0)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ergebnis.ok === false && ergebnis.fehler.daten).toBeUndefined()
    expect(zonen).toEqual([])
  })

  it('liest die FESTE-Zonen-Reihenfolge des Ergebnisses gegen das Eingangsarray (wenn sie abwiche, wuerde verworfen)', () => {
    // Der zeichenbare Weg, die Regel von #102 zu verletzen, ist hier bereits durch die
    // Sperre auf Schritt 3 versperrt. Der Test belegt aber, dass die Schutzschicht
    // steht: ein Ergebnis, dessen feste ids von der Eingabe abweichen, darf nicht
    // zurueckkommen.
    const zonen = [zone('logo', 'fest'), zone('A'), zone('beschreibung', 'fest'), zone('B')]
    const festeIdsVorher = zonen.filter((z) => z.rolle === 'fest').map((z) => z.id)

    const ergebnis = ordneZonenNeu(zonen, 3, 0)

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.ok === true && ergebnis.wert).toHaveLength(zonen.length)
    expect(
      ergebnis.ok === true && ids(ergebnis.wert.filter((z) => z.rolle === 'fest')),
    ).toEqual(festeIdsVorher)
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  it('die Abschaltzeile aus Zeile 1 ist entfernt', () => {
    expect(zeilenDurchgehend.startsWith('/* eslint-disable')).toBe(false)
    expect(zeilenDurchgehend.startsWith('// GENERIERT aus dem Signaturblock von Issue #146.')).toBe(
      true,
    )
  })

  it('die Signaturen sind woertlich unveraendert geblieben', () => {
    expect(zeilenDurchgehend).toContain('export interface ZonenListenEintrag {')
    expect(zeilenDurchgehend).toContain('export function baueZonenListe(vorlage: Vorlage):')
    expect(zeilenDurchgehend).toContain('export function ordneZonenNeu(')
    expect(zeilenDurchgehend).toContain('): Ergebnis<Zone[]> {')
  })

  it('enthält keinen sort, kein reverse und kein z-index im Code', () => {
    expect(code).not.toMatch(/\.sort\(/)
    expect(code).not.toMatch(/\.reverse\(/)
    expect(code).not.toMatch(/z-index/)
    expect(code).not.toMatch(/zIndex/)
  })

  it('schreibt kein Ebenen-Feld in die Zone - die Reihenfolge lebt allein im Array', () => {
    // `ebene` steht verbindlich in ZonenListenEintrag (Anzeigetext) und wird dort aus
    // `index` berechnet - als Eigenschaft an der Zone oder als z-index gaebe es eine
    // zweite Quelle fuer dieselbe Information (TK 9.11.3).
    expect(code).toContain('ebene: number')
    expect(code).toContain('ebene: index + 1')
    expect(code).not.toMatch(/zone\.ebene/)
    expect(code).not.toMatch(/\.sort\([^)]*\bebene\b/)
  })
})

describe('Gegenproben - die Grep-Proben greifen wirklich', () => {
  // Eine Probe ohne Beleg ist keine Probe: Diese Faelschungen muessen DURCHFALLEN.
  // Wuerde eine davon gruen, triefe der Filter ins Leere.
  it('eine eingeschmuggelte Sortierung wird gefunden', () => {
    const gefaelscht = 'const neu = zonen.sort((a, b) => a.id.localeCompare(b.id))'
    expect(gefaelscht).toMatch(/\.sort\(/)
  })

  it('eine eingeschmuggelte Umkehrung wird gefunden', () => {
    const gefaelscht = 'const neu = [...zonen].reverse()'
    expect(gefaelscht).toMatch(/\.reverse\(/)
  })

  it('ein eingeschmuggeltes z-index wird gefunden', () => {
    const gefaelscht = "zone.style = 'z-index: 99'"
    expect(gefaelscht).toMatch(/z-index/)
  })

  it('ein eingeschmuggeltes Ebenen-Feld an der Zone wird gefunden', () => {
    const gefaelscht = 'wirdGespeichert(zone.ebene)'
    expect(gefaelscht).toMatch(/zone\.ebene/)
  })

  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    const gefaelscht = '/* eslint-disable @typescript-eslint/no-unused-vars */\n// x'
    expect(gefaelscht.startsWith('/* eslint-disable')).toBe(true)
  })

  it('der Kommentar-Filter entfernt wirklich Kommentare', () => {
    // Belegt, dass die Grep-Proben oben nicht gegen den Prosa-Kopf pruefen: Das
    // Geruest kommentiert „Reine Abbildung 1:1 ... ohne jede Sortierung" - wuerde der
    // Filter nicht beiessen, schluege dort sort/reverse an.
    expect(zeilenDurchgehend.match(/\/\//g)?.length).toBeGreaterThan(0)
    expect(code).not.toContain('//')
  })
})