// Tests zu #455 - rollen-texte.ts: die Erklaerungsschicht des Marken-Editors.
//
// Die Zusagen:
//   1. Jede der 13 Farb- und 4 Schrift-Rollen hat einen Namen UND einen Satz.
//   2. Kein Name ist doppelt - zwei Rollen mit demselben Namen waeren nicht unterscheidbar.
//   3. Der Satz sagt die WAHRHEIT ueber die eingebauten Vorlagen: eine Rolle, die eine
//      eingebaute Vorlage benutzt, behauptet NICHT, unbenutzt zu sein - und umgekehrt.
//      Das ist die Zusage, die beim naechsten Vorlagen-Umbau bricht, wenn niemand nachzieht.
//   4. Unbekannte Rollen zeigen ihren Rohwert statt zu werfen.
import { describe, expect, it } from 'vitest'

import { farbRollenText, schriftRollenText } from '../../src/renderer/marken-editor/rollen-texte'
import { eingebauteVorlagen } from '../../src/main/vorlagen-store/eingebaute-vorlagen'
import type { FarbRolle, SchriftRolle } from '../../src/shared/contracts/marke'

const ALLE_FARBROLLEN: readonly FarbRolle[] = [
  'akzent', 'akzentKraeftig', 'akzentTief',
  'flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell', 'flaecheAkzentZart',
  'textAufDunkel', 'textAufHell', 'textSekundaer',
  'linie', 'scrimStart', 'scrimEnde',
]

const ALLE_SCHRIFTROLLEN: readonly SchriftRolle[] = [
  'headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett',
]

/** Die Rollen, die die drei eingebauten Vorlagen tatsaechlich referenzieren. */
function benutzteRollen(): { farben: Set<string>; schriften: Set<string> } {
  const farben = new Set<string>()
  const schriften = new Set<string>()
  for (const vorlage of eingebauteVorlagen()) {
    for (const zone of vorlage.zonen) {
      if (zone.text !== undefined) {
        farben.add(zone.text.farbRolle)
        schriften.add(zone.text.schriftRolle)
      }
      if (zone.deko?.füllungFarbRolle !== undefined) farben.add(zone.deko.füllungFarbRolle)
      if (zone.deko?.verlauf !== undefined) {
        farben.add(zone.deko.verlauf.vonFarbRolle)
        farben.add(zone.deko.verlauf.bisFarbRolle)
      }
    }
  }
  return { farben, schriften }
}

const UNBENUTZT = 'nicht benutzt'

describe('rollen-texte (#455)', () => {
  it('jede Farb-Rolle hat einen Namen und einen Satz', () => {
    for (const rolle of ALLE_FARBROLLEN) {
      const text = farbRollenText(rolle)
      expect(text.name, `${rolle}: Name ist der Rohwert`).not.toBe(rolle)
      expect(text.name.length, `${rolle}: Name leer`).toBeGreaterThan(0)
      expect(text.zweck.length, `${rolle}: Satz leer`).toBeGreaterThan(0)
    }
  })

  it('jede Schrift-Rolle hat einen Namen und einen Satz', () => {
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      const text = schriftRollenText(rolle)
      expect(text.name, `${rolle}: Name ist der Rohwert`).not.toBe(rolle)
      expect(text.zweck.length, `${rolle}: Satz leer`).toBeGreaterThan(0)
    }
  })

  it('kein Anzeigename ist doppelt', () => {
    const farbNamen = ALLE_FARBROLLEN.map((rolle) => farbRollenText(rolle).name)
    const schriftNamen = ALLE_SCHRIFTROLLEN.map((rolle) => schriftRollenText(rolle).name)
    expect(new Set(farbNamen).size).toBe(farbNamen.length)
    expect(new Set(schriftNamen).size).toBe(schriftNamen.length)
    // Farb- und Schrift-Namen duerfen sich ebenfalls nicht decken - sie stehen im selben Inspector.
    const alle = [...farbNamen, ...schriftNamen]
    expect(new Set(alle).size).toBe(alle.length)
  })

  it('der Satz sagt die Wahrheit ueber die eingebauten Vorlagen - Farben', () => {
    const { farben } = benutzteRollen()
    for (const rolle of ALLE_FARBROLLEN) {
      const { zweck } = farbRollenText(rolle)
      if (farben.has(rolle)) {
        expect(zweck, `${rolle} wird benutzt, behauptet aber das Gegenteil`).not.toContain(UNBENUTZT)
      } else {
        expect(zweck, `${rolle} wird NICHT benutzt, sagt es aber nicht`).toContain(UNBENUTZT)
      }
    }
  })

  it('der Satz sagt die Wahrheit ueber die eingebauten Vorlagen - Schriften', () => {
    const { schriften } = benutzteRollen()
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      const { zweck } = schriftRollenText(rolle)
      if (schriften.has(rolle)) {
        expect(zweck, `${rolle} wird benutzt, behauptet aber das Gegenteil`).not.toContain(UNBENUTZT)
      } else {
        expect(zweck, `${rolle} wird NICHT benutzt, sagt es aber nicht`).toContain(UNBENUTZT)
      }
    }
  })

  it('unbekannte Rolle: Rohwert, leerer Satz, kein Wurf', () => {
    // Der Cast ist Absicht: der Fall entsteht durch Bestandsdaten, nicht durch Typen.
    const fremd = 'gibtEsNicht' as unknown as FarbRolle
    expect(farbRollenText(fremd)).toEqual({ name: 'gibtEsNicht', zweck: '' })
    const proto = '__proto__' as unknown as SchriftRolle
    expect(schriftRollenText(proto)).toEqual({ name: '__proto__', zweck: '' })
  })
})
