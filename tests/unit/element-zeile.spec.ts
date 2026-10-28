// Tests zu #249 (M7-56) - die reine Logik (element-zeile.ts) ohne Browser.
// `begrenze` (#125) wird NICHT ersetzt, sondern echt benutzt - der Kernnachweis
// ist, dass `ziehe` exakt dieselbe Klemmung liefert und es keine zweite gibt.
// Die Anzeige (element-zeile.tsx) folgt als jsdom-Test in einer eigenen Datei.

import { describe, expect, it } from 'vitest'

import {
  anteil,
  baueBandStatus,
  beendeZiehen,
  formatiereReglerDauer,
  istVeraendert,
  ruheLage,
  wertAusAnteil,
  ziehe,
  type ReglerLage,
} from '../../src/renderer/composer/element-zeile'
import { begrenze, type ReglerModell } from '../../src/renderer/composer/dauer-regler'

// ---------------- Bausteine ----------------

function modell(ueber: Partial<ReglerModell> = {}): ReglerModell {
  const basis: ReglerModell = {
    elementId: 'e-1',
    griffe: 2,
    untergrenze: 0,
    obergrenze: 30.7, // krumme Quelllänge (kein Glattaufgang)
    anfang: 2.5,
    ende: 12.5,
    effektiveDauer: 10,
  }
  return { ...basis, ...ueber }
}

// ---------------- ruheLage / ziehe / beendeZiehen / istVeraendert ----------------

describe('ruheLage (#249)', () => {
  it('liefert { zieht: false, anfang: modell.anfang, ende: modell.ende }', () => {
    const m = modell()
    expect(ruheLage(m)).toEqual({ zieht: false, anfang: m.anfang, ende: m.ende })
  })
})

describe('ziehe (#249) – die Klemmung ist exakt die von begrenze (#125)', () => {
  const probe = [1.5, -2, 30.7, 31.9, 12.5, 0, 2.5, 5.05, 22.123, 40]

  it('zehn Stichproben: deep-gleich zu begrenze(modell, wauch, wende) - keine zweite Klemmregel', () => {
    const m = modell()
    for (const wert of probe) {
      const lage: ReglerLage = { zieht: true, anfang: 2.5, ende: 3.5 }
      const zieheLage = ziehe(m, lage, 'anfang', wert)
      const erwartet = begrenze(m, wert, 3.5)
      expect(zieheLage).toEqual({ zieht: true, anfang: erwartet.anfang, ende: erwartet.ende })

      const lage2: ReglerLage = { zieht: true, anfang: 2.5, ende: 3.5 }
      const zieheLageEnde = ziehe(m, lage2, 'ende', wert)
      const erwartetEnde = begrenze(m, 2.5, wert)
      expect(zieheLageEnde).toEqual({ zieht: true, anfang: erwartetEnde.anfang, ende: erwartetEnde.ende })
    }
  })

  it('gekreuztes Paar: ziehe klemmt exakt wie begrenze', () => {
    const m = modell()
    // anfang über das aktuelle ende hinaus ziehen.
    const lage: ReglerLage = { zieht: true, anfang: 2.5, ende: 3.5 }
    const ziel = ziehe(m, lage, 'anfang', 3.4)
    const erwartet = begrenze(m, 3.4, 3.5)
    expect(ziel).toEqual({ zieht: true, anfang: erwartet.anfang, ende: erwartet.ende })
  })

  it('griffe: 1 und griff anfang -> UNVERÄNDERTE Lage (toBe) - ENTSCHIEDEN 2', () => {
    const m = modell({ griffe: 1, untergrenze: 10, obergrenze: 45, anfang: 10, ende: 14.3 })
    const lage: ReglerLage = { zieht: false, anfang: 10, ende: 14.3 }
    expect(ziehe(m, lage, 'anfang', 20)).toBe(lage)
    // Das Ende bleibt beweglich.
    expect(ziehe(m, lage, 'ende', 20).ende).not.toBe(14.3)
  })

  it('NaN/Infinity -> UNVERÄNDERTE Lage (dieselbe Referenz), kein Wurf', () => {
    const m = modell()
    // Die Lage ist BEWEGT (ende 7.7, Modell 12.5) - sonst saehe der Rueckfall von
    // `begrenze` wie die gezogene Lage aus und die Wache waere unsichtbar.
    const lage: ReglerLage = { zieht: true, anfang: 2.5, ende: 7.7 }
    expect(ziehe(m, lage, 'ende', Number.NaN)).toBe(lage)
    expect(ziehe(m, lage, 'ende', Number.POSITIVE_INFINITY)).toBe(lage)
  })

  it('ziehe und beendeZiehen liefern NEUE Objekte; die übergebene Lage bleibt unverändert (Object.freeze)', () => {
    const m = modell({ untergrenze: 0, obergrenze: 4 }) // 4 ist als Grenzwert erlaubt (kein Sekundenliteral in der DATEI - der Test darf)
    const lage: ReglerLage = Object.freeze({ zieht: false, anfang: 1, ende: 3 })
    expect(() => ziehe(m, lage, 'ende', 2.5)).not.toThrow()
    const ruhig = beendeZiehen(lage)
    expect(ruhig).not.toBe(lage)
    expect(ruhig.zieht).toBe(false)
    expect(lage.anfang).toBe(1)
    expect(lage.ende).toBe(3)
  })

  it('beendeZiehen lässt anfang/ende UNVERÄNDERT', () => {
    const lage: ReglerLage = { zieht: true, anfang: 2.5, ende: 7.7 }
    const ruhig = beendeZiehen(lage)
    expect(ruhig).toEqual({ zieht: false, anfang: 2.5, ende: 7.7 })
  })
})

describe('istVeraendert (#249)', () => {
  it('false für ruheLage(modell), true sobald ein Griff bewegt wurde', () => {
    const m = modell()
    expect(istVeraendert(m, ruheLage(m))).toBe(false)
    const bewegt = { ...ruheLage(m), ende: m.ende + 0.5 }
    expect(istVeraendert(m, bewegt)).toBe(true)
    const bewegtAnfang = { ...ruheLage(m), anfang: m.anfang + 0.5 }
    expect(istVeraendert(m, bewegtAnfang)).toBe(true)
  })
})

// ---------------- anteil / wertAusAnteil ----------------

describe('anteil/wertAusAnteil (#249)', () => {
  it('anteil(untergrenze) === 0 und anteil(obergrenze) === 1', () => {
    const m = modell()
    expect(anteil(m, m.untergrenze)).toBe(0)
    expect(anteil(m, m.obergrenze)).toBe(1)
  })

  it('Hin- und Rückweg trifft x mit toBeCloseTo(x, 6) für fünf Werte', () => {
    const m = modell()
    for (const x of [3.33333, 10, 17.7777, 25.5, 29.9999]) {
      expect(wertAusAnteil(m, anteil(m, x))).toBeCloseTo(x, 6)
    }
  })

  it('entartete Spanne (obergrenze === untergrenze): anteil liefert 0, NIE NaN - ENTSCHIEDEN 11', () => {
    const m = modell({ untergrenze: 5, obergrenze: 5 })
    expect(anteil(m, 5)).toBe(0)
    expect(anteil(m, 20)).toBe(0)
    expect(Number.isNaN(anteil(m, 20))).toBe(false)
    // Auch eine NICHT ENDLICHE Spanne (defektes Modell) ist entartet: 0, nicht NaN.
    // `=== 0` deckte nur den Gleichstand ab; NaN fiele durch die Wache.
    const nan = modell({ obergrenze: Number.NaN })
    expect(anteil(nan, 10)).toBe(0)
  })

  it('wertAusAnteil klemmt Eingaben außerhalb [0, 1] auf die Modellgrenzen', () => {
    const m = modell()
    expect(wertAusAnteil(m, -0.5)).toBe(m.untergrenze)
    expect(wertAusAnteil(m, 1.5)).toBe(m.obergrenze)
  })
})

// ---------------- formatiereReglerDauer ----------------

describe('formatiereReglerDauer (#249)', () => {
  it('12.5 -> eine Nachkommastelle und die Einheit ("12,5 s")', () => {
    const text = formatiereReglerDauer(12.5)
    expect(text).toContain('12,5')
    expect(text).toContain('s')
  })

  it('10 -> ebenfalls mit Nachkommastelle (keine wechselnde Stellenzahl)', () => {
    expect(formatiereReglerDauer(10)).toBe('10,0 s')
    expect(formatiereReglerDauer(10.25)).toBe('10,3 s')
  })
})

// ---------------- baueBandStatus ----------------

describe('baueBandStatus (#249)', () => {
  function element(ueber: Partial<Parameters<typeof baueBandStatus>[0]>): Parameters<typeof baueBandStatus>[0] {
    const basis = {
      id: 'e-1',
      art: 'video' as const,
      ref: 'a-1',
      dauer: null,
      trimStart: null,
      trimEnde: null,
      einblendung: null,
    }
    return { ...basis, ...ueber } as Parameters<typeof baueBandStatus>[0]
  }

  const vorlagen = [{ id: 'band-1', name: 'Standard', art: 'einblendung' as const, höhe: 162, parent: null, eingebaut: false, zonen: [] }]

  it('art: segment ohne Einblendung liefert vorhanden: false, bedienbar: false (AD/TK v3.16: die Art bild ist gestrichen)', () => {
    const e = element({ art: 'segment' })
    expect(baueBandStatus(e, vorlagen)).toEqual({
      vorhanden: false,
      abschnitte: 0,
      vorlagenName: null,
      text: expect.any(String),
      bedienbar: false,
    })
  })

  it('art: segment IGNORIERT eine wider Erwarten gesetzte einblendung (objektgleich zu bild)', () => {
    const e = element({
      art: 'segment',
      einblendung: { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 3.1 }] },
    })
    const status = baueBandStatus(e, vorlagen)
    expect(status.vorhanden).toBe(false)
    expect(status.abschnitte).toBe(0)
    expect(status.bedienbar).toBe(false)
  })

  it('Video OHNE Einblendung: vorhanden false, bedienbar true (Zugang zum Anlegen)', () => {
    const status = baueBandStatus(element({}), vorlagen)
    expect(status.vorhanden).toBe(false)
    expect(status.bedienbar).toBe(true)
  })

  it('zählt die Abschnitte EXAKT und nennt den Vorlagennamen', () => {
    const e = element({
      einblendung: {
        bandVorlageId: 'band-1',
        // Krumme Dauern (CLAUDE.md: ein Testwert, der zufällig glatt aufgeht, belegt nichts).
        abschnitte: [
          { aktionRef: 'a-1', dauer: 3.13 },
          { aktionRef: 'a-2', dauer: 7.17 },
        ],
      },
    })
    const status = baueBandStatus(e, vorlagen)
    expect(status.abschnitte).toBe(2)
    expect(status.vorlagenName).toBe('Standard')
    expect(status.text).toContain('Standard')
    expect(status.text).toContain('2')
  })

  it('fehlt die Vorlage im Bestand: vorlagenName null, der Text nennt KEINEN Namen', () => {
    const e = element({
      einblendung: { bandVorlageId: 'fehlt', abschnitte: [{ aktionRef: 'a-1', dauer: 3.13 }] },
    })
    const status = baueBandStatus(e, vorlagen)
    expect(status.vorlagenName).toBeNull()
    expect(status.text).not.toContain('Standard')
    expect(status.text).toContain('1')
  })
})
