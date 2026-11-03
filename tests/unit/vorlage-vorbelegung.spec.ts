// Entscheidung 03.11.2026: Eine neue Aktion beginnt mit der ZULETZT BENUTZTEN
// Vorlage; ohne gemerkte gilt die erste waehlbare (das Verhalten bis 03.11.2026).
//
// Der Speicher ist Sitzungsspeicher - er liegt in der Datei selbst und wird von
// `merkeLetzteVorlage` gefuellt (Aktions-Editor und Composer-Formular).
import { beforeEach, describe, expect, it } from 'vitest'

import {
  merkeLetzteVorlage,
  vorlageFuerNeueAktion,
} from '../../src/renderer/gemeinsam/vorlage-vorbelegung'

const VORLAGEN = [{ id: 'ganz' }, { id: 'band' }]

beforeEach(() => {
  merkeLetzteVorlage(null)
})

describe('vorlageFuerNeueAktion', () => {
  it('ohne gemerkte Vorlage: die erste waehlbare', () => {
    expect(vorlageFuerNeueAktion(VORLAGEN)).toBe('ganz')
  })

  it('die zuletzt benutzte Vorlage gewinnt', () => {
    merkeLetzteVorlage('band')
    expect(vorlageFuerNeueAktion(VORLAGEN)).toBe('band')
  })

  it('eine gemerkte, aber nicht mehr waehlbare Vorlage faellt auf die erste zurueck', () => {
    // Eine geloeschte Vorlage darf nicht durch die Hintertuer zurueckkommen.
    merkeLetzteVorlage('geloescht')
    expect(vorlageFuerNeueAktion(VORLAGEN)).toBe('ganz')
  })

  it('ohne jede waehlbare Vorlage: die eingebaute Ganzflaeche', () => {
    expect(vorlageFuerNeueAktion([])).toBe('vollbild')
  })

  it('eine leere Kennung wird NICHT gemerkt - sie waere ein fehlender Wert', () => {
    merkeLetzteVorlage('band')
    merkeLetzteVorlage('')
    expect(vorlageFuerNeueAktion(VORLAGEN)).toBe('band')
  })

  it('null vergisst die gemerkte Vorlage', () => {
    merkeLetzteVorlage('band')
    merkeLetzteVorlage(null)
    expect(vorlageFuerNeueAktion(VORLAGEN)).toBe('ganz')
  })
})
