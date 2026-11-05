// Der Entwurf als einzige Wahrheit (04.11.2026) - die zwei Entscheidungen, die man
// ohne Pruefung falsch macht: WAS hat sich geaendert, und ob ein neuer Entwurf
// ueberhaupt etwas ist. Ohne React, ohne IPC.

import { describe, expect, it } from 'vitest'

import type { Aktion, AktionsInhalt } from '../../src/shared/contracts/aktion'
import {
  istNeuerEntwurfLeer,
  istUnveraendert,
  unterschiede,
} from '../../src/renderer/action-editor/aktions-entwurf'

function aktion(teil: Partial<Aktion> = {}): Aktion {
  return {
    id: 'a1',
    titel: 'Sommeraktion',
    beschreibung: 'Drei Monate',
    preis: '29 €',
    bildRef: 'bild-1',
    cta: 'Jetzt',
    standardDauer: 10,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
    ...teil,
  }
}

/** Der Entwurf ist der Aktionsinhalt ohne Kennung. */
function entwurfAus(quelle: Aktion): AktionsInhalt {
  const { id: _kennung, ...inhalt } = quelle
  return inhalt
}

describe('unterschiede', () => {
  it('nichts geaendert -> LEERES Objekt (kein Schreibvorgang fuer nichts)', () => {
    const gespeichert = aktion()
    expect(unterschiede(entwurfAus(gespeichert), gespeichert)).toEqual({})
    expect(istUnveraendert(entwurfAus(gespeichert), gespeichert)).toBe(true)
  })

  it('nur das geaenderte Feld steht im Ergebnis - kein vollstaendiger Satz', () => {
    const gespeichert = aktion()
    const geaendert = { ...entwurfAus(gespeichert), titel: 'Winteraktion' }
    expect(unterschiede(geaendert, gespeichert)).toEqual({ titel: 'Winteraktion' })
  })

  it('`null` gegen einen Wert ist eine Aenderung - auch andersherum', () => {
    const gespeichert = aktion({ preis: null })
    expect(unterschiede({ ...entwurfAus(gespeichert), preis: '19 €' }, gespeichert)).toEqual({
      preis: '19 €',
    })
    const mitPreis = aktion({ preis: '19 €' })
    expect(unterschiede({ ...entwurfAus(mitPreis), preis: null }, mitPreis)).toEqual({ preis: null })
  })

  it('mehrere Felder: jedes einzeln, in der Reihenfolge der Pruefung', () => {
    const gespeichert = aktion()
    const geaendert = {
      ...entwurfAus(gespeichert),
      titel: 'Neu',
      akzentfarbe: '#112233',
      bildRef: null,
    }
    expect(unterschiede(geaendert, gespeichert)).toEqual({
      titel: 'Neu',
      bildRef: null,
      akzentfarbe: '#112233',
    })
  })

  it('die Kennung der gespeicherten Aktion ist NIE Teil der Aenderungen', () => {
    const gespeichert = aktion()
    const geaendert = { ...entwurfAus(gespeichert), standardDauer: 20 }
    expect(Object.keys(unterschiede(geaendert, gespeichert))).toEqual(['standardDauer'])
  })
})

describe('istNeuerEntwurfLeer', () => {
  it('ohne Titel ist der Entwurf leer - auch bei Leerzeichen', () => {
    expect(istNeuerEntwurfLeer({ ...entwurfAus(aktion()), titel: '' })).toBe(true)
    expect(istNeuerEntwurfLeer({ ...entwurfAus(aktion()), titel: '   ' })).toBe(true)
  })

  it('ein getippter Titel macht ihn zu etwas, das angelegt werden muesste', () => {
    expect(istNeuerEntwurfLeer({ ...entwurfAus(aktion()), titel: 'Ab' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SEIT 05.11.2026 (TK 9.8.8): `zonenGestaltung` und `bildAusschnitt` sind VERSCACHTELT.
// Ein `!==` waere hier immer wahr (neue Referenz nach jedem Rendern) und jedes „Fertig"
// schriebe samt Undo-Schritt, obwohl niemand etwas geaendert hat.
// ---------------------------------------------------------------------------

describe('unterschiede - Gestaltung je Zone und Bildausschnitt', () => {
  it('gleicher Inhalt, neue Referenz -> KEINE Aenderung', () => {
    const gespeichert = aktion({
      zonenGestaltung: { preis: { flaechefarbe: '#FF4040' } },
      bildAusschnitt: { zoom: 150, versatzX: 10, versatzY: 0 },
    })
    const entwurf: AktionsInhalt = {
      ...entwurfAus(gespeichert),
      zonenGestaltung: { preis: { flaechefarbe: '#FF4040' } },
      bildAusschnitt: { zoom: 150, versatzX: 10, versatzY: 0 },
    }
    expect(unterschiede(entwurf, gespeichert)).toEqual({})
  })

  it('eine geaenderte Zonenfarbe steht im Ergebnis - und nur sie', () => {
    const gespeichert = aktion({ zonenGestaltung: { preis: { flaechefarbe: '#FF4040' } } })
    const entwurf: AktionsInhalt = {
      ...entwurfAus(gespeichert),
      zonenGestaltung: { preis: { flaechefarbe: '#00FF00' } },
    }
    expect(unterschiede(entwurf, gespeichert)).toEqual({
      zonenGestaltung: { preis: { flaechefarbe: '#00FF00' } },
    })
  })

  it('zurueckgesetzt (leerer Record) gegen einen gesetzten Wert ist eine Aenderung', () => {
    const gespeichert = aktion({ zonenGestaltung: { preis: { textfarbe: '#FFFFFF' } } })
    const entwurf: AktionsInhalt = { ...entwurfAus(gespeichert), zonenGestaltung: {} }
    expect(unterschiede(entwurf, gespeichert)).toEqual({ zonenGestaltung: {} })
  })

  it('ein altes Projekt OHNE die Felder meldet keine Aenderung', () => {
    // Genau dieser Fall entstuende beim ersten Oeffnen einer Aktion aus der Zeit vor
    // dieser Fassung: Der Entwurf traegt die Felder nicht, gespeichert sind sie auch nicht.
    const gespeichert = aktion()
    const entwurf: AktionsInhalt = { ...entwurfAus(gespeichert), zonenGestaltung: {} }
    expect(unterschiede(entwurf, gespeichert)).toEqual({})
  })

  it('ein neuer Bildausschnitt wird gemeldet, ein gleich gebliebener nicht', () => {
    const gespeichert = aktion({ bildAusschnitt: null })
    expect(unterschiede({ ...entwurfAus(gespeichert), bildAusschnitt: { zoom: 200 } }, gespeichert)).toEqual({
      bildAusschnitt: { zoom: 200 },
    })
    expect(unterschiede({ ...entwurfAus(gespeichert), bildAusschnitt: null }, gespeichert)).toEqual({})
  })
})
