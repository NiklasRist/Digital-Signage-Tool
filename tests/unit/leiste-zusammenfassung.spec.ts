// Verhaltenstest zu #206 - die Zusammenfassung der eingeklappten Warteschlangen-Zeile
// (TK 9.14.1, TK 9.14.2, TK 9.3.1, TK 9.3.5).
//
// REINE Logik, kein React, kein Browser: `fasseZusammen` bekommt eine `AuftragsSicht`
// (#205) und liefert die eine Zeile. Gemessen wird die verbindliche Text-Kaskade des
// Issues - und dass `unbekannt` eine EIGENE Zeile bekommt, nie „Warteschlange leer"
// (Invariante 1 des Meilensteins).
import { describe, expect, it } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { AuftragsSicht } from '../../src/renderer/queue-panel/auftrags-sicht'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { fasseZusammen } from '../../src/renderer/queue-panel/leiste-zusammenfassung'

/** Ein Auftrag mit vernuenftigen Vorbelegungen; je Test ueberschreibbar. */
function auftrag(ueber: Partial<Auftrag> = {}): Auftrag {
  const basis = {
    auftragId: 'a-1',
    art: 'import',
    status: 'anstehend',
    label: 'Import a-1',
    payload: { projektId: 'p1', quellPfad: 'C:/x.mp4' },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
  return { ...basis, ...ueber } as Auftrag
}

/** Ein laufender Render-Auftrag mit der vollen gueltigen Nutzlast (TK 9.2.1). */
function laufenderRender(
  auftragId: string,
  label: string,
  fortschritt: number | null,
): Auftrag {
  return auftrag({
    auftragId,
    art: 'render',
    status: 'laeuft',
    label,
    fortschritt,
    payload: {
      renderId: auftragId,
      projektId: 'p1',
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: 'sommer-aktion',
    },
  })
}

describe('fasseZusammen (#206)', () => {
  it('behandelt alle drei Varianten von AuftragsSicht - text ist in keinem Fall leer', () => {
    const sichten: AuftragsSicht[] = [
      { zustand: 'unbekannt' },
      { zustand: 'fehler', code: 'x', meldung: 'nicht lesbar' },
      { zustand: 'geladen', auftraege: [] },
      {
        zustand: 'geladen',
        auftraege: [laufenderRender('l-1', 'Render: sommer-aktion.mp4', 40)],
      },
      {
        zustand: 'geladen',
        auftraege: [auftrag({ auftragId: 'w-1', status: 'anstehend' })],
      },
      {
        zustand: 'geladen',
        auftraege: [auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' })],
      },
      {
        zustand: 'geladen',
        auftraege: [auftrag({ auftragId: 'e-1', status: 'erfolg' })],
      },
      {
        zustand: 'geladen',
        auftraege: [auftrag({ auftragId: 'g-1', status: 'abgebrochen' })],
      },
      {
        zustand: 'geladen',
        auftraege: [
          laufenderRender('l-1', 'Render: sommer-aktion.mp4', 40),
          auftrag({ auftragId: 'w-1', status: 'anstehend' }),
          auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' }),
        ],
      },
    ]

    for (const sicht of sichten) {
      const zusammenfassung = fasseZusammen(sicht)
      expect(zusammenfassung.text, JSON.stringify(sicht)).not.toBe('')
    }
  })

  it('macht aus `unbekannt` eine ANDERE Zeile als aus einer leeren Liste', () => {
    const unbekannt = fasseZusammen({ zustand: 'unbekannt' })
    const leer = fasseZusammen({ zustand: 'geladen', auftraege: [] })

    expect(unbekannt.text).toBe('Warteschlange wird geladen …')
    expect(unbekannt.ton).toBe('unbekannt')
    expect(leer.text).toBe('Warteschlange leer')
    expect(leer.ton).toBe('ruhig')

    expect(unbekannt.text).not.toBe(leer.text)
    expect(unbekannt.ton).not.toBe(leer.ton)
    // Invariante 1: `unbekannt` wird NIE auf „leer" abgebildet.
    expect(unbekannt.text).not.toContain('leer')
  })

  it('zeigt bei `fehler` die feste Zeile ohne die technische Meldung', () => {
    const zusammenfassung = fasseZusammen({
      zustand: 'fehler',
      code: 'speicher_fehler',
      meldung: 'Q1 nicht lesbar - Platte voll',
    })

    expect(zusammenfassung.text).toBe('Warteschlange nicht lesbar')
    expect(zusammenfassung.ton).toBe('hervorgehoben')
    // Die Meldung gehoert in die aufgeklappte Liste (#207/#211), nicht in die eine Zeile.
    expect(zusammenfassung.text).not.toContain('Platte voll')
  })

  it('baut aus laufendem Render (40 %), drei anstehend und null Fehlschlaegen genau die DoD-Zeile', () => {
    const sicht: AuftragsSicht = {
      zustand: 'geladen',
      auftraege: [
        laufenderRender('l-1', 'Render: sommer-aktion.mp4', 40),
        auftrag({ auftragId: 'w-1', status: 'anstehend' }),
        auftrag({ auftragId: 'w-2', status: 'anstehend' }),
        auftrag({ auftragId: 'w-3', status: 'anstehend' }),
      ],
    }

    const zusammenfassung = fasseZusammen(sicht)

    expect(zusammenfassung.text).toBe(
      'Render: sommer-aktion.mp4 · 40 % · 3 in der Warteschlange',
    )
    expect(zusammenfassung.ton).toBe('aktiv')
    expect(zusammenfassung.fortschritt).toBe(40)
    expect(zusammenfassung.anstehend).toBe(3)
    expect(zusammenfassung.fehlgeschlagen).toBe(0)
  })

  it('erzeugt bei `fortschritt: null` KEINEN Prozentteil - weder im Text noch als 0', () => {
    const sicht: AuftragsSicht = {
      zustand: 'geladen',
      auftraege: [laufenderRender('l-1', 'Render: sommer-aktion.mp4', null)],
    }

    const zusammenfassung = fasseZusammen(sicht)

    // Grep auf `%` im Ergebnis schlaegt fehl (DoD).
    expect(zusammenfassung.text).not.toMatch(/%/)
    expect(zusammenfassung.text).toBe('Render: sommer-aktion.mp4')
    expect(zusammenfassung.fortschritt).toBeNull()
  })

  it('ist `hervorgehoben`, sobald mindestens ein Auftrag fehlgeschlagen ist - in JEDER Zeile der Kaskade', () => {
    // Kaskaden-Zeile 1: laeuft + anstehend + fehlgeschlagen.
    const mitLaeufendem = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        laufenderRender('l-1', 'Render: sommer-aktion.mp4', null),
        auftrag({ auftragId: 'w-1', status: 'anstehend' }),
        auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' }),
        auftrag({ auftragId: 'f-2', status: 'fehlgeschlagen' }),
      ],
    })
    expect(mitLaeufendem.text).toBe(
      'Render: sommer-aktion.mp4 · 1 in der Warteschlange · 2 fehlgeschlagen',
    )
    expect(mitLaeufendem.ton).toBe('hervorgehoben')

    // Kaskaden-Zeile 1b: laeuft + fehlgeschlagen, ohne anstehend.
    const laeuftMitFehlern = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        laufenderRender('l-1', 'Render: sommer-aktion.mp4', 100),
        auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' }),
      ],
    })
    expect(laeuftMitFehlern.text).toBe(
      'Render: sommer-aktion.mp4 · 100 % · 1 fehlgeschlagen',
    )
    expect(laeuftMitFehlern.ton).toBe('hervorgehoben')

    // Kaskaden-Zeile 2: keiner laeuft, anstehend > 0, fehlgeschlagen > 0.
    const ohneLaeufenden = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        auftrag({ auftragId: 'w-1', status: 'anstehend' }),
        auftrag({ auftragId: 'w-2', status: 'anstehend' }),
        auftrag({ auftragId: 'w-3', status: 'anstehend' }),
        auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' }),
        auftrag({ auftragId: 'f-2', status: 'fehlgeschlagen' }),
      ],
    })
    expect(ohneLaeufenden.text).toBe('3 in der Warteschlange · 2 fehlgeschlagen')
    expect(ohneLaeufenden.ton).toBe('hervorgehoben')

    // Kaskaden-Zeile 3: keiner laeuft, nichts anstehend, nur Fehlschlaege.
    const nurFehlschlaege = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        auftrag({ auftragId: 'f-1', status: 'fehlgeschlagen' }),
        auftrag({ auftragId: 'f-2', status: 'fehlgeschlagen' }),
      ],
    })
    expect(nurFehlschlaege.text).toBe('2 fehlgeschlagen')
    expect(nurFehlschlaege.ton).toBe('hervorgehoben')
  })

  it('zaehlt `erfolg` und `abgebrochen` NICHT und laesst sie aus dem Text', () => {
    const nurErledigte = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        auftrag({ auftragId: 'e-1', status: 'erfolg' }),
        auftrag({ auftragId: 'g-1', status: 'abgebrochen' }),
        auftrag({ auftragId: 'e-2', status: 'erfolg' }),
      ],
    })
    expect(nurErledigte.text).toBe('Warteschlange leer')
    expect(nurErledigte.ton).toBe('ruhig')
    expect(nurErledigte.anstehend).toBe(0)
    expect(nurErledigte.fehlgeschlagen).toBe(0)
    expect(nurErledigte.laufender).toBeNull()

    // Auch neben einem laufenden bleiben sie unsichtbar.
    const mitLaeufendem = fasseZusammen({
      zustand: 'geladen',
      auftraege: [
        laufenderRender('l-1', 'Render: sommer-aktion.mp4', 50),
        auftrag({ auftragId: 'e-1', status: 'erfolg' }),
        auftrag({ auftragId: 'g-1', status: 'abgebrochen' }),
      ],
    })
    expect(mitLaeufendem.text).toBe('Render: sommer-aktion.mp4 · 50 %')
    expect(mitLaeufendem.anstehend).toBe(0)
    expect(mitLaeufendem.fehlgeschlagen).toBe(0)
  })

  it('laesst bei zwei `laeuft`-Auftraegen den ERSTEN gewinnen - ohne Ausnahme', () => {
    const erster = laufenderRender('l-1', 'Render: erster.mp4', 20)
    const zweiter = laufenderRender('l-2', 'Render: zweiter.mp4', 60)
    const sicht: AuftragsSicht = {
      zustand: 'geladen',
      auftraege: [erster, zweiter],
    }

    expect(() => fasseZusammen(sicht)).not.toThrow()
    const zusammenfassung = fasseZusammen(sicht)

    // toBe statt toEqual: es ist DERSELBE Auftrag wie in der Sicht, keine Kopie.
    expect(zusammenfassung.laufender).toBe(erster)
    expect(zusammenfassung.fortschritt).toBe(20)
    expect(zusammenfassung.text).toBe('Render: erster.mp4 · 20 %')
  })

  it('klemmt `fortschritt` ausserhalb 0-100 auf die Grenzen - ohne Fehler und ohne Meldung', () => {
    const zuNiedrig = fasseZusammen({
      zustand: 'geladen',
      auftraege: [laufenderRender('l-1', 'Render: minus.mp4', -5)],
    })
    expect(zuNiedrig.fortschritt).toBe(0)
    expect(zuNiedrig.text).toBe('Render: minus.mp4 · 0 %')

    const zuHoch = fasseZusammen({
      zustand: 'geladen',
      auftraege: [laufenderRender('l-1', 'Render: plus.mp4', 130)],
    })
    expect(zuHoch.fortschritt).toBe(100)
    expect(zuHoch.text).toBe('Render: plus.mp4 · 100 %')
  })

  it('zur Laufzeit unbekannter `status` zaehlt nirgends mit und wirft nicht', () => {
    // `AuftragStatus` laesst den Wert nur als Union zu; zur Laufzeit kann er von
    // aussen anders ankommen (Nutzlast der Gegenseite). Deshalb der Cast - geprueft
    // wird das Laufzeitverhalten, nicht der Typ.
    const fremd = auftrag({
      auftragId: 'x-1',
      status: 'sonderfall',
    } as unknown as Partial<Auftrag>) as unknown as Auftrag
    const sicht: AuftragsSicht = {
      zustand: 'geladen',
      auftraege: [fremd, auftrag({ auftragId: 'w-1', status: 'anstehend' })],
    }

    expect(() => fasseZusammen(sicht)).not.toThrow()
    const zusammenfassung = fasseZusammen(sicht)

    expect(zusammenfassung.anstehend).toBe(1)
    expect(zusammenfassung.fehlgeschlagen).toBe(0)
    expect(zusammenfassung.laufender).toBeNull()
    expect(zusammenfassung.text).toBe('1 in der Warteschlange')
  })
})