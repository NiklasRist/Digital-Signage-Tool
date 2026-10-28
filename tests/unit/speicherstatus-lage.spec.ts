// Reine Tests zu #200 - der Zustandsautomat (speicherstatus-lage.ts).
// Die Datei ist bereits gebaut (DoD-Kontrollenz); der Test gilt die DoD-Punkte nach.

import { describe, expect, it } from 'vitest'

import {
  ANFANGSLAGE,
  betroffeneQuellen,
  zeigtHinweis,
  verarbeiteSpeicherEreignis,
} from '../../src/renderer/app-shell/speicherstatus-lage'

describe('ANFANGSLAGE (#200)', () => {
  it('beide Quellen unbekannt, beide Codes null', () => {
    expect(ANFANGSLAGE).toEqual({
      projekt: { zustand: 'unbekannt', letzterFehlercode: null },
      vorlagen: { zustand: 'unbekannt', letzterFehlercode: null },
    })
    expect(zeigtHinweis(ANFANGSLAGE)).toBe(false)
  })
})

describe('verarbeiteSpeicherEreignis (#200)', () => {
  it('Fehler von projekt -> projekt nicht_gespeichert mit Code; vorlagen BLEIBT unbekannt', () => {
    const neu = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', { typ: 'fehler', code: 'speicher_fehler' })
    expect(neu.projekt.zustand).toBe('nicht_gespeichert')
    expect(neu.projekt.letzterFehlercode).toBe('speicher_fehler')
    expect(neu.vorlagen).toEqual(ANFANGSLAGE.vorlagen)
  })

  it('zwei Fehler hintereinander -> letzter Code gewinnt; Zustand bleibt nicht_gespeichert', () => {
    const erst = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', { typ: 'fehler', code: 'eins' })
    const zweit = verarbeiteSpeicherEreignis(erst, 'projekt', { typ: 'fehler', code: 'zwei' })
    expect(zweit.projekt.zustand).toBe('nicht_gespeichert')
    expect(zweit.projekt.letzterFehlercode).toBe('zwei')
  })

  it('Fehler von vorlagen -> vorlagen wechselt, projekt bleibt unberührt', () => {
    const neu = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'vorlagen', { typ: 'fehler', code: 'vorlagen_fehler' })
    expect(neu.vorlagen.zustand).toBe('nicht_gespeichert')
    expect(neu.vorlagen.letzterFehlercode).toBe('vorlagen_fehler')
    expect(neu.projekt).toEqual(ANFANGSLAGE.projekt)
  })

  it('gespeichert derselben Quelle -> gespeichert + Code null', () => {
    const kaputt = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', { typ: 'fehler', code: 'x' })
    const heil = verarbeiteSpeicherEreignis(kaputt, 'projekt', { typ: 'gespeichert' })
    expect(heil.projekt.zustand).toBe('gespeichert')
    expect(heil.projekt.letzterFehlercode).toBeNull()
  })

  it('verändert die ÜBERGEBENE Lage nie (immer ein neues Objekt)', () => {
    const vor = JSON.parse(JSON.stringify(ANFANGSLAGE)) as typeof ANFANGSLAGE
    verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', { typ: 'fehler', code: 'x' })
    expect(ANFANGSLAGE).toEqual(vor)
  })

  it("vorlagen nicht_gespeichert + projekt gespeichert -> Hinweis bleibt, betroffeneQuellen ['vorlagen']", () => {
    const vorlagenKaputt = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'vorlagen', { typ: 'fehler', code: 'x' })
    const gemischt = verarbeiteSpeicherEreignis(vorlagenKaputt, 'projekt', { typ: 'gespeichert' })
    expect(zeigtHinweis(gemischt)).toBe(true)
    expect(betroffeneQuellen(gemischt)).toEqual(['vorlagen'])
  })

  it("beide Quellen nicht_gespeichert -> feste Reihenfolge ['projekt', 'vorlagen']", () => {
    // Die Reihenfolge ist zugesagt (projekt, vorlagen) und wird in der Oberflaeche
    // als Aufzaehlung gelesen - sie darf nicht von der Melde-Reihenfolge abhaengen.
    const beide = verarbeiteSpeicherEreignis(
      verarbeiteSpeicherEreignis(ANFANGSLAGE, 'vorlagen', { typ: 'fehler', code: 'v' }),
      'projekt',
      { typ: 'fehler', code: 'p' },
    )
    expect(zeigtHinweis(beide)).toBe(true)
    expect(betroffeneQuellen(beide)).toEqual(['projekt', 'vorlagen'])
  })
})
