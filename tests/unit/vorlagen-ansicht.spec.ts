// Der Speicher der Vorlagen-Ansicht (03.11.2026)
//
// Er traegt NUR „offen oder zu" - welche Vorlage bearbeitet wird, steht im
// Sitzungshalter des Vorlagen-Editors. Geprueft wird genau das: oeffnen, schliessen,
// keine Meldung ohne echte Aenderung, Abmelden wirkt.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  aufVorlagenAnsichtGeaendert,
  istVorlagenAnsichtOffen,
  oeffneVorlagenAnsicht,
  schliesseVorlagenAnsicht,
} from '../../src/renderer/gemeinsam/vorlagen-ansicht'

beforeEach(() => {
  schliesseVorlagenAnsicht()
})

describe('vorlagen-ansicht', () => {
  it('oeffnet und schliesst - der Zustand ist ablesbar', () => {
    expect(istVorlagenAnsichtOffen()).toBe(false)
    oeffneVorlagenAnsicht()
    expect(istVorlagenAnsichtOffen()).toBe(true)
    schliesseVorlagenAnsicht()
    expect(istVorlagenAnsichtOffen()).toBe(false)
  })

  it('meldet nur bei einer ECHTEN Aenderung', () => {
    const hoerer = vi.fn()
    const abmelden = aufVorlagenAnsichtGeaendert(hoerer)
    oeffneVorlagenAnsicht()
    expect(hoerer).toHaveBeenCalledTimes(1)
    // Zweites Oeffnen ist keine Aenderung - kein zweiter Ruf.
    oeffneVorlagenAnsicht()
    expect(hoerer).toHaveBeenCalledTimes(1)
    schliesseVorlagenAnsicht()
    expect(hoerer).toHaveBeenCalledTimes(2)
    // Schliessen, wenn schon zu: nichts.
    schliesseVorlagenAnsicht()
    expect(hoerer).toHaveBeenCalledTimes(2)
    abmelden()
  })

  it('nach dem Abmelden kommt keine Meldung mehr', () => {
    const hoerer = vi.fn()
    aufVorlagenAnsichtGeaendert(hoerer)()
    oeffneVorlagenAnsicht()
    expect(hoerer).not.toHaveBeenCalled()
  })
})
