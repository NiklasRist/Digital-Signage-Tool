// Unit-Tests zu #145 – Der Zahlen-Inspektor für exakte Rahmenwerte.
//
// Die Datei ist reine Umrechnung ohne Prozessgrenze (P7, kein Speicher). Die DoD
// verlangt ausdruecklich, dass der Inspektor NICHT einrastet (sonst wae re 1056
// unerreichbar), dass er nur ganze Zahlen annimmt und dass ausserhalb liegende Werte
// begrenzt statt abgewiesen werden. Ein Teil der DoD ist deshalb eine Grep-Probe auf
// den Code (nur Rumpf, ohne Kommentare), nicht nur auf das Verhalten.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { setzeRahmenWert, type RahmenFeld } from '../../src/renderer/vorlagen-editor/inspektor'
import { MINDEST_ZONEN_KANTE_PX, type Flaeche } from '../../src/renderer/vorlagen-editor/zonen-canvas'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import type { Zone } from '../../src/shared/contracts/vorlage'

const QUELLE = readFileSync(
  new URL('../../src/renderer/vorlagen-editor/inspektor.ts', import.meta.url),
  'utf8',
)

// Nur der Code, ohne Kommentarzeilen - die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

function zone(
  id: string,
  rolle: 'fest' | 'frei',
  x: number,
  y: number,
  breite: number,
  höhe: number,
): Zone {
  return {
    id,
    rolle,
    bindung: null,
    rahmen: { x, y, breite, höhe },
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
  }
}

const FREI = zone('frei', 'frei', 100, 100, 200, 100)
const FEST = zone('logo', 'fest', 100, 100, 200, 100)
const FLASCHE: Flaeche = { breite: RENDER_PROFILE.breite, höhe: RENDER_PROFILE.hoehe }

describe('setzeRahmenWert – exakte Werte ohne Einrasten (DoD)', () => {
  it("nimmt 1056 und 1050 fuer x exakt an - kein Einrasten", () => {
    const a = setzeRahmenWert(FREI, 'x', '1056', FLASCHE)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    expect(a.wert.rahmen.x).toBe(1056)
    expect(a.wert.rahmen.breite).toBe(FREI.rahmen.breite)

    const b = setzeRahmenWert(FREI, 'x', '1050', FLASCHE)
    expect(b.ok).toBe(true)
    if (!b.ok) return
    expect(b.wert.rahmen.x).toBe(1050)
  })

  it('aendert mit einem Aufruf genau ein Feld - kein Sammel-Setter', () => {
    const x = setzeRahmenWert(FREI, 'x', '500', FLASCHE)
    expect(x.ok).toBe(true)
    if (!x.ok) return
    expect(x.wert.rahmen.x).toBe(500)
    expect(x.wert.rahmen.y).toBe(FREI.rahmen.y)
    expect(x.wert.rahmen.breite).toBe(FREI.rahmen.breite)
    expect(x.wert.rahmen.höhe).toBe(FREI.rahmen.höhe)

    const y = setzeRahmenWert(FREI, 'y', '300', FLASCHE)
    expect(y.ok).toBe(true)
    if (!y.ok) return
    expect(y.wert.rahmen.y).toBe(300)
    expect(y.wert.rahmen.x).toBe(FREI.rahmen.x)
    expect(y.wert.rahmen.breite).toBe(FREI.rahmen.breite)
    expect(y.wert.rahmen.höhe).toBe(FREI.rahmen.höhe)

    const b = setzeRahmenWert(FREI, 'breite', '400', FLASCHE)
    expect(b.ok).toBe(true)
    if (!b.ok) return
    expect(b.wert.rahmen.breite).toBe(400)
    expect(b.wert.rahmen.x).toBe(FREI.rahmen.x)
    expect(b.wert.rahmen.y).toBe(FREI.rahmen.y)
    expect(b.wert.rahmen.höhe).toBe(FREI.rahmen.höhe)

    const h = setzeRahmenWert(FREI, 'höhe', '50', FLASCHE)
    expect(h.ok).toBe(true)
    if (!h.ok) return
    expect(h.wert.rahmen.höhe).toBe(50)
    expect(h.wert.rahmen.x).toBe(FREI.rahmen.x)
    expect(h.wert.rahmen.y).toBe(FREI.rahmen.y)
    expect(h.wert.rahmen.breite).toBe(FREI.rahmen.breite)
  })
})

describe('setzeRahmenWert – Eingabe: nur ganze Zahlen (DoD)', () => {
  it("lehnt '12.5', '12,5', '12px', '', '1e3' und '  ' als ungueltige_eingabe ab", () => {
    for (const eingabe of ['12.5', '12,5', '12px', '', '1e3', '  ']) {
      const ergebnis = setzeRahmenWert(FREI, 'breite', eingabe, FLASCHE)
      expect(ergebnis.ok).toBe(false)
      if (ergebnis.ok) continue
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
      expect(ergebnis.fehler.meldung).toContain('ganze Zahl')
      expect('daten' in ergebnis.fehler).toBe(false)
    }
  })

  it('lehnt weitere Nicht-Zahlen und Dezimaltrennzeichen ab', () => {
    for (const eingabe of [
      '12.0', '0,5', '120 px', '+5', 'NaN', 'Infinity', '1 000', '5e2', '--5', '-', '0x10',
    ]) {
      const ergebnis = setzeRahmenWert(FREI, 'x', eingabe, FLASCHE)
      expect(ergebnis.ok).toBe(false)
      if (ergebnis.ok) continue
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
  })

  it('erlaubt fuehrendes Minus und aussenstehende Leerzeichen nach trim()', () => {
    const a = setzeRahmenWert(FREI, 'x', '-40', FLASCHE)
    expect(a.ok).toBe(true)
    const b = setzeRahmenWert(FREI, 'x', ' 1056 ', FLASCHE)
    expect(b.ok).toBe(true)
    if (!b.ok) return
    expect(b.wert.rahmen.x).toBe(1056)
  })
})

describe('setzeRahmenWert – Begrenzung statt Abweisung (DoD)', () => {
  it('begrenzt -40 fuer x auf 0 und uebernimmt mit ok: true', () => {
    const ergebnis = setzeRahmenWert(FREI, 'x', '-40', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.rahmen.x).toBe(0)
    expect(ergebnis.wert.rahmen.breite).toBe(FREI.rahmen.breite)
  })

  it('begrenzt x ueber die Flaeche hinaus auf flaeche.breite - breite', () => {
    const ergebnis = setzeRahmenWert(FREI, 'x', '9999', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.rahmen.x).toBe(FLASCHE.breite - FREI.rahmen.breite)
    expect(ergebnis.wert.rahmen.x + ergebnis.wert.rahmen.breite).toBe(FLASCHE.breite)
  })

  it('begrenzt breite ueber die Flaeche auf flaeche.breite - x, x bleibt unveraendert (DoD)', () => {
    const ergebnis = setzeRahmenWert(FREI, 'breite', '5000', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.rahmen.breite).toBe(FLASCHE.breite - FREI.rahmen.x)
    expect(ergebnis.wert.rahmen.x).toBe(FREI.rahmen.x)
  })

  it('begrenzt hoehe ueber die Flaeche auf flaeche.hoehe - y, y bleibt unveraendert', () => {
    const ergebnis = setzeRahmenWert(FREI, 'höhe', '5000', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.rahmen.höhe).toBe(FLASCHE.höhe - FREI.rahmen.y)
    expect(ergebnis.wert.rahmen.y).toBe(FREI.rahmen.y)
  })

  it('hebt breite und hoehe unter der Mindestkante auf MINDEST_ZONEN_KANTE_PX (DoD)', () => {
    const b = setzeRahmenWert(FREI, 'breite', '3', FLASCHE)
    expect(b.ok).toBe(true)
    if (!b.ok) return
    expect(b.wert.rahmen.breite).toBe(MINDEST_ZONEN_KANTE_PX)

    const h = setzeRahmenWert(FREI, 'höhe', '0', FLASCHE)
    expect(h.ok).toBe(true)
    if (!h.ok) return
    expect(h.wert.rahmen.höhe).toBe(MINDEST_ZONEN_KANTE_PX)
  })

  it('laesst die Untergrenze gewinnen, wenn die Zone gar nicht in die Flaeche passt', () => {
    // x=95, breite=100 -> flaeche.breite - x = 5 < 8: die Untergrenze 8 gewinnt,
    // die Sperre meldet danach #148.
    const klein: Flaeche = { breite: 100, höhe: 100 }
    const rand = zone('rand', 'frei', 95, 95, 100, 100)
    const ergebnis = setzeRahmenWert(rand, 'breite', '50', klein)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.rahmen.breite).toBe(MINDEST_ZONEN_KANTE_PX)
  })
})

describe('setzeRahmenWert – feste Zonen (DoD)', () => {
  it('liefert ungueltige_eingabe mit Meldung zum Markenrahmen', () => {
    const ergebnis = setzeRahmenWert(FEST, 'x', '500', FLASCHE)
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(ergebnis.fehler.meldung).toContain('Markenrahmen')
    expect(ergebnis.fehler.meldung).toContain('gesperrt')
  })

  it('laesst die feste Zone unveraendert', () => {
    const vorher = FEST.rahmen
    const ergebnis = setzeRahmenWert(FEST, 'breite', '9999', FLASCHE)
    expect(ergebnis.ok).toBe(false)
    expect(FEST.rahmen).toEqual(vorher)
  })

  it('prueft die Sperre VOR der Eingabe', () => {
    const ergebnis = setzeRahmenWert(FEST, 'x', '12.5', FLASCHE)
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.meldung).toContain('Markenrahmen')
  })
})

describe('setzeRahmenWert – neue Zone, uebrige Felder unangetastet (DoD)', () => {
  it('gibt ein neues Objekt zurueck; die uebergebene Zone bleibt unveraendert (beide Rahmen)', () => {
    const vorher = JSON.parse(JSON.stringify(FREI)) as Zone
    const ergebnis = setzeRahmenWert(FREI, 'x', '700', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert).not.toBe(FREI)
    expect(ergebnis.wert.rahmen).not.toBe(FREI.rahmen)
    expect(ergebnis.wert.rahmen.x).toBe(700)
    expect(FREI.rahmen).toEqual(vorher.rahmen)
    expect(FREI).toEqual(vorher)
  })

  it('uebernimmt id, bindung, wennLeer, text, deko und ausrichtung unveraendert', () => {
    const mitText: Zone = {
      ...FREI,
      text: { schriftRolle: 'fliesstext', farbRolle: 'textAufDunkel', größeMax: 32, größeMin: 16, maxZeilen: 2 },
    }
    const ergebnis = setzeRahmenWert(mitText, 'breite', '300', FLASCHE)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.id).toBe(mitText.id)
    expect(ergebnis.wert.rolle).toBe('frei')
    expect(ergebnis.wert.bindung).toEqual(mitText.bindung)
    expect(ergebnis.wert.wennLeer).toEqual(mitText.wennLeer)
    expect(ergebnis.wert.text).toEqual(mitText.text)
    expect(ergebnis.wert.ausrichtung).toEqual(mitText.ausrichtung)
  })
})

describe('setzeRahmenWert – keine Exceptions (DoD)', () => {
  it('wirft auf keinem Fehlerpfad - jeder liefert den Code ungueltige_eingabe', () => {
    const faelle: Array<[Zone, RahmenFeld, string]> = [
      [FEST, 'x', '500'],
      [FREI, 'breite', '12.5'],
      [FREI, 'breite', ''],
      [FREI, 'x', 'abc'],
    ]
    for (const [zelle, feld, eingabe] of faelle) {
      expect(() => setzeRahmenWert(zelle, feld, eingabe, FLASCHE)).not.toThrow()
      const ergebnis = setzeRahmenWert(zelle, feld, eingabe, FLASCHE)
      expect(ergebnis.ok).toBe(false)
      if (ergebnis.ok) continue
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
  })
})

describe('Bauvorschriften dieser Datei (DoD-Grep-Proben)', () => {
  it('traegt die Abschaltzeile nicht mehr und beginnt weiter mit dem Geruest-Kopf', () => {
    expect(QUELLE.split('\n')[0]!.startsWith('// GENERIERT aus dem Signaturblock')).toBe(true)
    expect(QUELLE.split('\n')[0]).not.toContain('eslint-disable')
  })

  it('laesst die GERUEST-PRUEFSUMME-Zeile unangetastet', () => {
    expect(QUELLE).toContain('// GERUEST-PRUEFSUMME: 7704e5c7db0021c8')
  })

  it('ruft keine Einrast-Funktion aus #144 auf - der Inspektor rastet nicht ein', () => {
    expect(CODEZEILEN).not.toMatch(/raste/)
    expect(CODEZEILEN).not.toMatch(/EINRAST/)
    expect(CODEZEILEN).not.toMatch(/sammleEinrastlinien/)
    expect(CODEZEILEN).not.toMatch(/verschiebeZone/)
    expect(CODEZEILEN).not.toMatch(/bemasseZone/)
  })

  it('uebernimmt die Geometrie aus #144 statt sie neu zu erfinden', () => {
    expect(CODEZEILEN).not.toMatch(/function begrenzeAufFlaeche/)
    expect(CODEZEILEN).not.toMatch(/const MINDEST_ZONEN_KANTE_PX/)
    expect(CODEZEILEN).toMatch(/begrenzeAufFlaeche\(/)
    expect(CODEZEILEN).toMatch(/MINDEST_ZONEN_KANTE_PX/)
  })

  it('setzt fehler.daten nie - der Ausgang ist ok mit Zone oder ungueltige_eingabe', () => {
    expect(CODEZEILEN).not.toMatch(/daten:/)
  })
})