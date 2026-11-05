// 05.11.2026: Der Beispielinhalt der Aktions-Vorschau.
//
// Die Zusage: Leere Felder werden fuer die VORSCHAU gefuellt, der Entwurf bleibt
// unberuehrt. Wer hier versehentlich schreibt statt kopiert, speichert Beispieltext in
// einer echten Aktion - genau der Fehler, den diese Datei ausschliesst.

import { describe, expect, it } from 'vitest'

import type { AktionsInhalt } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import {
  BEISPIEL_INHALT,
  erstesBild,
  mitBeispielinhalt,
} from '../../src/renderer/action-editor/beispiel-inhalt'

function leer(): AktionsInhalt {
  return {
    titel: '',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: 10,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  }
}

function asset(id: string, typ: Asset['typ'], zustand: Asset['zustand']): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.bin`,
    originalname: id,
    maße: { breite: 100, höhe: 100 },
    dauer: null,
    importdatum: '2026-11-05T00:00:00.000Z',
    zustand,
  }
}

describe('mitBeispielinhalt', () => {
  it('fuellt ALLE leeren Textfelder und setzt istBeispiel', () => {
    const entwurf = leer()
    const vorschau = mitBeispielinhalt(entwurf, null)

    expect(vorschau.inhalt.titel).toBe(BEISPIEL_INHALT.titel)
    expect(vorschau.inhalt.beschreibung).toBe(BEISPIEL_INHALT.beschreibung)
    expect(vorschau.inhalt.preis).toBe(BEISPIEL_INHALT.preis)
    expect(vorschau.inhalt.cta).toBe(BEISPIEL_INHALT.cta)
    expect(vorschau.istBeispiel).toBe(true)
    // Der ENTWURF bleibt leer - keine gemeinsame Referenz, keine veraenderte Quelle.
    expect(entwurf.titel).toBe('')
    expect(entwurf.beschreibung).toBeNull()
  })

  it('laesst eigenen Inhalt stehen und mischt nur die leeren Felder', () => {
    const entwurf = { ...leer(), titel: 'Eigener Titel', preis: '5 €' }
    const vorschau = mitBeispielinhalt(entwurf, null)

    expect(vorschau.inhalt.titel).toBe('Eigener Titel')
    expect(vorschau.inhalt.preis).toBe('5 €')
    expect(vorschau.inhalt.beschreibung).toBe(BEISPIEL_INHALT.beschreibung)
    expect(vorschau.istBeispiel).toBe(true)
  })

  it('nimmt das Beispielbild NUR, wenn der Entwurf keines hat', () => {
    const ohneBild = mitBeispielinhalt(leer(), 'bild-1')
    expect(ohneBild.inhalt.bildRef).toBe('bild-1')
    expect(ohneBild.istBeispiel).toBe(true)

    const mitBild = mitBeispielinhalt({ ...leer(), bildRef: 'bild-2' }, 'bild-1')
    expect(mitBild.inhalt.bildRef).toBe('bild-2')
  })

  it('ist kein Beispiel, wenn alles gefuellt ist', () => {
    const voll = {
      ...leer(),
      titel: 'T',
      beschreibung: 'B',
      preis: 'P',
      cta: 'C',
      bildRef: 'bild-1',
    }
    const vorschau = mitBeispielinhalt(voll, 'bild-2')
    expect(vorschau.istBeispiel).toBe(false)
    expect(vorschau.inhalt).toEqual(voll)
  })
})

describe('erstesBild', () => {
  it('nimmt das erste nutzbare Bild, nicht Video oder fehlendes Asset', () => {
    const assets = [
      asset('video-1', 'video', 'ok'),
      asset('fehlt-1', 'bild', 'fehlt'),
      asset('bild-1', 'bild', 'ok'),
      asset('bild-2', 'bild', 'ok'),
    ]
    expect(erstesBild(assets)?.id).toBe('bild-1')
  })

  it('liefert null ohne nutzbares Bild', () => {
    expect(erstesBild([asset('video-1', 'video', 'ok')])).toBeNull()
  })
})
