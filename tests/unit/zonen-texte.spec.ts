// Tests zu #454 - zonen-texte.ts: EINE Quelle fuer die Zonen-Namen beider Editoren.
//
// Die Zusagen:
//   1. Jede Kennung der drei eingebauten Vorlagen hat einen Namen UND einen Satz.
//   2. `ueberschrift` und `titel` meinen dieselbe Sache.
//   3. Unbekannte Kennungen zeigen ihren Rohwert statt zu werfen.
//   4. Marken-Editor und Vorlagen-Editor zeigen fuer dieselbe Kennung DENSELBEN Namen.
import { describe, expect, it } from 'vitest'

import { zonenText } from '../../src/renderer/gemeinsam/zonen-texte'
import { baueMarkenElemente } from '../../src/renderer/marken-editor/marken-elemente'
import { eingebauteVorlagen } from '../../src/main/vorlagen-store/eingebaute-vorlagen'

describe('zonenText (#454)', () => {
  it('nennt die Kennungen mit dem bestaetigten Namen', () => {
    const erwartet: Array<[string, string]> = [
      ['hintergrund', 'Hintergrund'],
      ['motiv', 'Bild der Aktion'],
      ['scrim', 'Abdunkelung'],
      ['logo', 'Logo'],
      ['ueberschrift', 'Überschrift'],
      ['titel', 'Überschrift'],
      ['beschreibung', 'Beschreibung'],
      ['preis', 'Preis'],
      ['cta', 'Knopf'],
    ]
    expect(erwartet.map(([id]) => zonenText(id).name)).toEqual(erwartet.map(([, name]) => name))
  })

  it('ueberschrift und titel sind zwei Kennungen fuer dieselbe Sache', () => {
    expect(zonenText('titel')).toEqual(zonenText('ueberschrift'))
  })

  it('unbekannte Kennung: Rohwert, leerer Zweck, kein Wurf', () => {
    expect(zonenText('slogan')).toEqual({ name: 'slogan', zweck: '' })
    expect(zonenText('')).toEqual({ name: '', zweck: '' })
    // `__proto__` ist der Fall, den ein einfacher Objekt-Zugriff falsch beantwortet.
    expect(zonenText('__proto__')).toEqual({ name: '__proto__', zweck: '' })
  })

  it('deckt ALLE Kennungen der drei eingebauten Vorlagen ab - Name und Satz', () => {
    for (const vorlage of eingebauteVorlagen()) {
      for (const zone of vorlage.zonen) {
        const text = zonenText(zone.id)
        expect(text.name, `${vorlage.id}/${zone.id}: Name`).not.toBe(zone.id)
        expect(text.zweck.length, `${vorlage.id}/${zone.id}: Zweck`).toBeGreaterThan(0)
      }
    }
  })

  it('BEIDE Editoren zeigen fuer dieselbe Kennung denselben Namen', () => {
    for (const vorlage of eingebauteVorlagen()) {
      for (const element of baueMarkenElemente(vorlage)) {
        expect(element.titel, `${vorlage.id}/${element.id}`).toBe(zonenText(element.id).name)
      }
    }
  })
})
