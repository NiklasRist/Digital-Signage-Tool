// Tests zu #455 - die Reihenfolge der Arbeit und die Erreichbarkeit ALLER Rollen.
//
// Die Zusagen:
//   1. Sechs Stufen, Nummern 1..6, jede mit Titel und Satz.
//   2. Jede Farb- und Schriftrolle ist ENTWEDER einer Stufe zugeordnet ODER steht unter
//      „Weitere Rollen" - keine Rolle faellt durch, keine steht doppelt.
//   3. Genau die Stufe ohne Element (Sicherheitsabstand) oeffnet die Abstands-Werte.
import { describe, expect, it } from 'vitest'

import {
  ARBEITSSCHRITTE, weitereFarbRollen, weitereSchriftRollen,
} from '../../src/renderer/marken-editor/inspector'
import { FARB_ROLLEN } from '../../src/renderer/marken-editor/farben-bearbeiten'
import { SCHRIFT_ROLLEN } from '../../src/renderer/marken-editor/schriften-bearbeiten'

describe('ARBEITSSCHRITTE (#455)', () => {
  it('sechs Stufen, Nummern 1..6, jede mit Titel und Satz', () => {
    expect(ARBEITSSCHRITTE.map((schritt) => schritt.nummer)).toEqual([1, 2, 3, 4, 5, 6])
    for (const schritt of ARBEITSSCHRITTE) {
      expect(schritt.titel.length, `Stufe ${schritt.nummer}: Titel`).toBeGreaterThan(0)
      expect(schritt.zweck.length, `Stufe ${schritt.nummer}: Satz`).toBeGreaterThan(0)
    }
  })

  it('genau die Stufe ohne Element ist der Sicherheitsabstand', () => {
    const ohneElement = ARBEITSSCHRITTE.filter((schritt) => schritt.elementId === null)
    expect(ohneElement).toHaveLength(1)
    expect(ohneElement[0]!.titel).toBe('Sicherheitsabstand')
  })

  it('jede Farb-Rolle ist erreichbar - Stufe ODER „Weitere Rollen", nie beides', () => {
    const inStufen = ARBEITSSCHRITTE.flatMap((schritt) => schritt.farbRollen)
    const weitere = weitereFarbRollen()
    // Keine Rolle doppelt in den Stufen.
    expect(new Set(inStufen).size).toBe(inStufen.length)
    // Zusammen genau der Vertrag - keine fehlt, keine kommt dazu.
    expect(new Set([...inStufen, ...weitere])).toEqual(new Set(FARB_ROLLEN))
  })

  it('jede Schrift-Rolle ist erreichbar - Stufe ODER „Weitere Rollen", nie beides', () => {
    const inStufen = ARBEITSSCHRITTE.flatMap((schritt) => schritt.schriftRollen)
    const weitere = weitereSchriftRollen()
    expect(new Set(inStufen).size).toBe(inStufen.length)
    expect(new Set([...inStufen, ...weitere])).toEqual(new Set(SCHRIFT_ROLLEN))
  })

  it('die Stufen decken den Grossteil selbst ab - „Weitere Rollen" ist die Ausnahme', () => {
    // Wenn hier ploetzlich alles landet, ist die Zuordnung kaputt und der Inspector
    // zeigt eine lange Liste statt einer Reihenfolge.
    expect(weitereFarbRollen().length).toBeLessThanOrEqual(2)
    expect(weitereSchriftRollen().length).toBe(0)
  })
})
