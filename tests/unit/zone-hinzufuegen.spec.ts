// Unit-Tests zu #147 – Eine Zone hinzufügen: gebundener Text, Bild oder Dekoration.
//
// Die Datei ist reine Datenlogik ohne Prozessgrenze: keine IPC-, keine Ergebnis-Huelle
// ueber die Grenze - Ergebnis<Vorlage> ist der Rueckgabetyp dieser einen Funktion.
// Geometrie kommt aus #144 (flaecheDerVorlage, begrenzeAufFlaeche), Farb-/Schriftrollen
// aus #52 - beides ist hier ueber die echten Importe verdrahtet, nicht neu gebaut.
//
// Ein Teil der DoD laesst sich direkt als Grep-Probe auf den Code abziehen (Hex-Werte,
// Schriftnamen, Abschaltzeile, Pruefsumme) - auf den Rumpf, nicht auf Kommentare.
// Verhaltens-Proben (die uebrigen DoD-Punkte) pruefen die Funktion ueber ihre
// Schnittstelle mit Werten, die nicht von selber glatt aufgehen.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { Rahmen, Vorlage, Zone } from '../../src/shared/contracts/vorlage'
import {
  fuegeZoneHinzu,
  type ZonenWunsch,
} from '../../src/renderer/vorlagen-editor/zone-hinzufuegen'
import { MINDEST_ZONEN_KANTE_PX } from '../../src/renderer/vorlagen-editor/zonen-canvas'

const QUELLE = readFileSync(
  fileURLToPath(new URL('../../src/renderer/vorlagen-editor/zone-hinzufuegen.ts', import.meta.url)),
  'utf8',
)
// Nur der Code, ohne Kommentarzeilen - die Grep-Proben der DoD pruefen den Rumpf.
// Erst \r\n normalisieren, damit die Filter auf jeder Plattform gleich treffen.
const CODEZEILEN = QUELLE.replace(/\r\n/g, '\n')
  .replace(/\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')

function zone(id: string): Zone {
  return {
    id,
    rolle: 'frei',
    bindung: null,
    rahmen: { x: 0, y: 0, breite: 100, höhe: 100 },
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
  }
}

function vorlage(art: Vorlage['art'], höhe: number | null, ...zonen: Zone[]): Vorlage {
  return {
    id: 'vorlage-1',
    name: 'Testvorlage',
    art,
    höhe,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

function neu(ergebnis: { ok: boolean; wert?: Vorlage }): Zone {
  expect(ergebnis.ok).toBe(true)
  const zonen = ergebnis.wert?.zonen
  expect(zonen).toBeDefined()
  return zonen![zonen!.length - 1]!
}

function pruefeRahmenInFlaeche(rahmen: Rahmen, breite: number, höhe: number) {
  expect(rahmen.x).toBeGreaterThanOrEqual(0)
  expect(rahmen.y).toBeGreaterThanOrEqual(0)
  expect(rahmen.breite).toBeGreaterThan(0)
  expect(rahmen.höhe).toBeGreaterThan(0)
  expect(rahmen.x + rahmen.breite).toBeLessThanOrEqual(breite)
  expect(rahmen.y + rahmen.höhe).toBeLessThanOrEqual(höhe)
}

describe('fuegeZoneHinzu (#147) – Sorten auf vollflaeche', () => {
  it('legt eine gebundene Textzone mit vollstaendigen Text-Parametern an (DoD a, 1, 2)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'text', bindung: 'titel' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.rolle).toBe('frei')
    expect(z.bindung).toBe('titel')
    expect(z.wennLeer).toBe('leer')
    expect(z.ausrichtung).toEqual({ horizontal: 'links', vertikal: 'mitte' })
    expect(z.text).toEqual({
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 96,
      größeMin: 56,
      maxZeilen: 2,
    })
    expect(z.text && z.text.größeMin).toBeGreaterThan(0)
    expect(z.text && z.text.größeMin).toBeLessThanOrEqual(z.text.größeMax)
    expect(z.text && Number.isInteger(z.text.maxZeilen)).toBe(true)
    expect(z.text && z.text.maxZeilen).toBeGreaterThanOrEqual(1)
    expect('bild' in z).toBe(false)
    expect('deko' in z).toBe(false)
  })

  it('legt eine Bildzone mit einpassung contain an, ohne text (DoD a, 3)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'bild', bindung: 'logo' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.bindung).toBe('logo')
    expect(z.bild).toEqual({ einpassung: 'contain' })
    expect(z.ausrichtung).toEqual({ horizontal: 'mitte', vertikal: 'mitte' })
    expect('text' in z).toBe(false)
    expect('deko' in z).toBe(false)
  })

  it('legt eine dekorative Zone ohne statischen Text an - bindung null, kein text (DoD a, 4)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'deko' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.bindung).toBeNull()
    expect(z.deko).toEqual({ füllungFarbRolle: 'akzent' })
    expect('statischerText' in (z.deko ?? {})).toBe(false)
    expect('text' in z).toBe(false)
  })
})

describe('fuegeZoneHinzu (#147) – Sorten auf dem 162-px-Band', () => {
  it('text nutzt die Band-Vorgaben 64/44/1 (DoD a)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('einblendung', 162), { sorte: 'text', bindung: 'preis' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.text).toEqual({
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 64,
      größeMin: 44,
      maxZeilen: 1,
    })
    expect(z.ausrichtung).toEqual({ horizontal: 'links', vertikal: 'mitte' })
  })

  it('bild nutzt dieselben Regeln wie auf vollflaeche (DoD a)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('split', 162), { sorte: 'bild', bindung: 'bild' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.bindung).toBe('bild')
    expect(z.bild).toEqual({ einpassung: 'contain' })
    expect('text' in z).toBe(false)
  })

  it('deko bleibt bindung null (DoD a)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('einblendung', 162), { sorte: 'deko' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.bindung).toBeNull()
    expect(z.deko).toEqual({ füllungFarbRolle: 'akzent' })
  })
})

describe('fuegeZoneHinzu (#147) – id-Vergabe', () => {
  it('vergibt beim zweiten titel titel-2 (DoD b)', () => {
    const erste = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'text', bindung: 'titel' })
    expect(erste.ok).toBe(true)
    const zweite = fuegeZoneHinzu(erste.wert!, { sorte: 'text', bindung: 'titel' })

    expect(zweite.ok).toBe(true)
    const zonen = zweite.wert!.zonen
    expect(zonen.map((z) => z.id)).toEqual(['titel', 'titel-2'])
  })

  it('legt drei gleichartige Zonen als titel, titel-2, titel-3 an', () => {
    let vorlageJetzt = vorlage('vollflaeche', null)
    for (const erwartet of ['titel', 'titel-2', 'titel-3']) {
      const ergebnis = fuegeZoneHinzu(vorlageJetzt, { sorte: 'text', bindung: 'titel' })
      expect(ergebnis.ok).toBe(true)
      vorlageJetzt = ergebnis.wert!
      expect(vorlageJetzt.zonen[vorlageJetzt.zonen.length - 1]!.id).toBe(erwartet)
    }
  })

  it('deko zweimal ergibt deko und deko-2', () => {
    const erste = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'deko' })
    expect(erste.ok).toBe(true)
    const zweite = fuegeZoneHinzu(erste.wert!, { sorte: 'deko' })

    expect(zweite.ok).toBe(true)
    expect(zweite.wert!.zonen.map((z) => z.id)).toEqual(['deko', 'deko-2'])
  })

  it('weicht einer bereits belegten Bildbindung mit -2 aus', () => {
    const besetzt = vorlage('vollflaeche', null, zone('bild'))
    const ergebnis = fuegeZoneHinzu(besetzt, { sorte: 'bild', bindung: 'bild' })

    expect(ergebnis.ok).toBe(true)
    expect(neu(ergebnis).id).toBe('bild-2')
  })
})

describe('fuegeZoneHinzu (#147) – Rahmen liegt in der Flaeche', () => {
  it('startet auf vollflaeche bei {96, 540, 400, 120} innerhalb von 1920x1080 (DoD 5)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), { sorte: 'text', bindung: 'slogan' })

    expect(ergebnis.ok).toBe(true)
    const rahmen = neu(ergebnis).rahmen
    expect(rahmen).toEqual({ x: 96, y: 540, breite: 400, höhe: 120 })
    pruefeRahmenInFlaeche(rahmen, 1920, 1080)
  })

  it('startet auf dem 162-px-Band bei {96, 16, 400, 72} innerhalb von 1920x162 (DoD 5)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('einblendung', 162), { sorte: 'bild', bindung: 'logo' })

    expect(ergebnis.ok).toBe(true)
    const rahmen = neu(ergebnis).rahmen
    expect(rahmen).toEqual({ x: 96, y: 16, breite: 400, höhe: 72 })
    pruefeRahmenInFlaeche(rahmen, 1920, 162)
  })

  it('schrumpft die Hoehe auf das 40-px-Band und verschiebt die Zone hinein (DoD c, 5)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('split', 40), { sorte: 'text', bindung: 'cta' })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.rahmen).toEqual({ x: 96, y: 0, breite: 400, höhe: 40 })
    pruefeRahmenInFlaeche(z.rahmen, 1920, 40)
    expect(z.rahmen.höhe).toBeGreaterThanOrEqual(MINDEST_ZONEN_KANTE_PX)
  })

  it('laesst die uebergebene Vorlage unveraendert und haengt ans Ende an (DoD 6)', () => {
    const eingang = vorlage('vollflaeche', null, zone('hintergrund'), zone('motiv'))
    const vorher = eingang.zonen.map((z) => z)

    const ergebnis = fuegeZoneHinzu(eingang, { sorte: 'text', bindung: 'titel' })

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.wert).not.toBe(eingang)
    expect(ergebnis.wert!.zonen).not.toBe(eingang.zonen)
    expect(eingang.zonen).toEqual(vorher)
    expect(eingang.zonen.map((z) => z.id)).toEqual(['hintergrund', 'motiv'])
    expect(ergebnis.wert!.zonen.map((z) => z.id)).toEqual(['hintergrund', 'motiv', 'titel'])
    // Die BESTEHENDEN Zonen-Objekte bleiben identisch - nur angehaengt, nichts kopiert.
    expect(ergebnis.wert!.zonen[0]).toBe(vorher[0])
    expect(ergebnis.wert!.zonen[1]).toBe(vorher[1])
  })
})

describe('fuegeZoneHinzu (#147) – dekorative Zone mit statischem Text (DoD d)', () => {
  it('setzt deko.statischerText und den dazu noetigen text-Block', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'deko',
      statischerText: 'Trainiere mit System',
    })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.deko).toEqual({
      füllungFarbRolle: 'akzent',
      statischerText: 'Trainiere mit System',
    })
    expect(z.text).toEqual({
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 96,
      größeMin: 56,
      maxZeilen: 2,
    })
    expect(z.text && z.text.größeMin).toBeLessThanOrEqual(z.text.größeMax)
  })

  it('nutzt auf dem Band denselben text-Block wie eine Textzone (64/44/1)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('einblendung', 162), {
      sorte: 'deko',
      statischerText: 'Band',
    })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.deko?.statischerText).toBe('Band')
    expect(z.text).toEqual({
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 64,
      größeMin: 44,
      maxZeilen: 1,
    })
  })

  it('trimmt den statischen Text beim Speichern', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'deko',
      statischerText: '  Abstand   ',
    })

    expect(ergebnis.ok).toBe(true)
    expect(neu(ergebnis).deko?.statischerText).toBe('Abstand')
  })

  it('behandelt reinen Leerraum als nicht gesetzt - ok, ohne statischerText und ohne text', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'deko',
      statischerText: '   ',
    })

    expect(ergebnis.ok).toBe(true)
    const z = neu(ergebnis)
    expect(z.deko).toEqual({ füllungFarbRolle: 'akzent' })
    expect('statischerText' in (z.deko ?? {})).toBe(false)
    expect('text' in z).toBe(false)
  })
})

describe('fuegeZoneHinzu (#147) – Fehlerpfade (DoD e, 8)', () => {
  it('weist eine Vorlage mit hoehe null auf split als ungueltige_eingabe ab', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('split', null), { sorte: 'text', bindung: 'titel' })

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ergebnis.ok === false && ergebnis.fehler.meldung).toContain('vorlage-1')
    expect(ergebnis.ok === false && ergebnis.fehler.daten).toBeUndefined()
  })

  it('weist jede Flaeche unter MINDEST_ZONEN_KANTE_PX ab - auch hoehe 5', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('einblendung', 5), { sorte: 'deko' })

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('weist einen statischen Text ueber 200 Zeichen ab', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'deko',
      statischerText: 'x'.repeat(201),
    })

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('erlaubt einen statischen Text von genau 200 Zeichen', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'deko',
      statischerText: 'x'.repeat(200),
    })

    expect(ergebnis.ok).toBe(true)
    expect(neu(ergebnis).deko?.statischerText).toHaveLength(200)
  })

  it('weist einen Wunsch ab, der keiner Sorte entspricht (untypisierter Aufruf)', () => {
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null), {
      sorte: 'kaputt',
    } as unknown as ZonenWunsch)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('weist einen belegten Grundnamen samt aller Suffixe bis -99 ab und nennt ihn', () => {
    const zonen: Zone[] = [zone('deko')]
    for (let suffix = 2; suffix <= 99; suffix += 1) {
      zonen.push(zone(`deko-${suffix}`))
    }
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null, ...zonen), { sorte: 'deko' })

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ergebnis.ok === false && ergebnis.fehler.meldung).toContain('deko')
  })

  it('greift bei -99 noch die letzte freie Nummer', () => {
    const zonen: Zone[] = [zone('deko')]
    for (let suffix = 2; suffix <= 98; suffix += 1) {
      zonen.push(zone(`deko-${suffix}`))
    }
    const ergebnis = fuegeZoneHinzu(vorlage('vollflaeche', null, ...zonen), { sorte: 'deko' })

    expect(ergebnis.ok).toBe(true)
    expect(neu(ergebnis).id).toBe('deko-99')
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  it('die Abschaltzeile aus Zeile 1 ist entfernt, der Geruest-Kopf beginnt die Datei', () => {
    expect(QUELLE.split('\n')[0]!.startsWith('// GENERIERT aus dem Signaturblock von Issue #147.')).toBe(
      true,
    )
    expect(QUELLE.split('\n')[0]).not.toContain('eslint-disable')
  })

  it('laesst die GERUEST-PRUEFSUMME-Zeile unangetastet', () => {
    expect(QUELLE).toContain('// GERUEST-PRUEFSUMME: 7abaf8996202b225')
  })

  it('haelt die verbindlichen Signaturen woertlich', () => {
    expect(QUELLE).toContain('export type ZonenSorte = \'text\' | \'bild\' | \'deko\'')
    expect(QUELLE).toContain(
      'export type TextBindung = \'titel\' | \'beschreibung\' | \'preis\' | \'cta\' | \'slogan\'',
    )
    expect(QUELLE).toContain('export type BildBindung = \'bild\' | \'logo\'')
    expect(QUELLE).toContain('| { sorte: \'deko\'; statischerText?: string }')
    expect(QUELLE).toContain('export function fuegeZoneHinzu(vorlage: Vorlage, wunsch: ZonenWunsch): Ergebnis<Vorlage>')
  })

  it('schreibt keinen Hex-Wert in den Code (DoD 7)', () => {
    expect(CODEZEILEN).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('schreibt keinen Schriftnamen in den Code (DoD 7)', () => {
    expect(CODEZEILEN).not.toMatch(/Playfair|Arial|Archivo|Arimo|Helvetica|Roboto|Open ?Sans/i)
  })
})

describe('Gegenproben – die Grep-Proben greifen wirklich', () => {
  it('ein eingeschmuggelter Hex-Wert wird gefunden', () => {
    expect('const hex = \'#FF4040\'').toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('ein eingeschmuggelter Schriftname wird gefunden', () => {
    expect('const schrift = \'Playfair Display\'').toMatch(/Playfair/i)
  })

  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    expect('/* eslint-disable @typescript-eslint/no-unused-vars */\n// x').toContain(
      'eslint-disable',
    )
  })

  it('der Kommentar-Filter entfernt wirklich Kommentare', () => {
    // Belegt, dass die Grep-Proben oben nicht gegen den Prosa-Kopf pruefen: Das
    // Geruest kommentiert „Keine Hex-Werte, keine Schriftnamen" ueber die Rollen-Regel.
    expect(QUELLE.match(/\/\//g)?.length).toBeGreaterThan(0)
    expect(CODEZEILEN).not.toContain('//')
  })
})
