// [shared] ProduktQuellen normalisieren (#472, FA-30 / TK 9.20.3)
//
// Die Regeln stehen in 9.20.3 und sind hier EINZELN geprueft - dieselbe Haltung wie bei
// `normalisiereProduktUrl` (9.19.7): unbrauchbare Eintraege fallen beim LESEN weg, kein
// Absturz, und der Standard ohne Feld ist `{ shops: [], webSuche: null }`.
import { describe, expect, it } from 'vitest'

import {
  normalisiereProduktQuellen,
  normalisiereSuchMuster,
} from '../../src/shared/produkt-quellen'

const SHOP = { host: 'best-body-shop.de', suchMuster: 'https://best-body-shop.de/suche?q={q}' }

describe('normalisiereSuchMuster (9.20.3)', () => {
  it('nimmt eine absolute http(s)-Adresse mit genau einem {q}', () => {
    expect(normalisiereSuchMuster(SHOP.suchMuster)).toBe(SHOP.suchMuster)
    expect(normalisiereSuchMuster(' http://example.org/?s={q} ')).toBe('http://example.org/?s={q}')
    // `{q}` darf auch im Pfad stehen - 9.20.3 legt keinen Ort fest.
    expect(normalisiereSuchMuster('https://example.org/s/{q}/liste')).toBe(
      'https://example.org/s/{q}/liste',
    )
  })

  it('weist Muster ohne {q}, mit zwei {q} und ohne http(s) ab', () => {
    expect(normalisiereSuchMuster('https://example.org/suche')).toBeNull()
    expect(normalisiereSuchMuster('https://example.org/?a={q}&b={q}')).toBeNull()
    expect(normalisiereSuchMuster('ftp://example.org/?q={q}')).toBeNull()
    expect(normalisiereSuchMuster('mailto:x@example.org?q={q}')).toBeNull()
    expect(normalisiereSuchMuster('/suche?q={q}')).toBeNull()
    expect(normalisiereSuchMuster('   ')).toBeNull()
    expect(normalisiereSuchMuster(42)).toBeNull()
  })
})

describe('normalisiereProduktQuellen (9.20.3)', () => {
  it('liefert ohne Feld den Standard - keine Config-Migration', () => {
    expect(normalisiereProduktQuellen(undefined)).toEqual({ shops: [], webSuche: null })
    expect(normalisiereProduktQuellen(null)).toEqual({ shops: [], webSuche: null })
    expect(normalisiereProduktQuellen('kaputt')).toEqual({ shops: [], webSuche: null })
    expect(normalisiereProduktQuellen([SHOP])).toEqual({ shops: [], webSuche: null })
  })

  it('nimmt einen brauchbaren Shop und normalisiert den Anzeige-Host', () => {
    expect(
      normalisiereProduktQuellen({
        shops: [{ host: 'HTTPS://Best-Body-Shop.de/pfad', suchMuster: SHOP.suchMuster }],
        webSuche: null,
      }),
    ).toEqual({ shops: [SHOP], webSuche: null })
    // Ein Port in der Anzeige ist erlaubt und faellt fuer den Vergleich weg.
    expect(
      normalisiereProduktQuellen({
        shops: [{ host: 'shop.example:8443', suchMuster: 'https://shop.example:8443/s?q={q}' }],
      }).shops,
    ).toEqual([{ host: 'shop.example', suchMuster: 'https://shop.example:8443/s?q={q}' }])
  })

  it('wirft Eintraege weg, deren Host nicht zum Muster passt', () => {
    // 9.20.3 nennt `host` einen Pruefwert: Zeigte die Anzeige woandershin als die Suche,
    // waere sie eine Luege ueber das Ziel.
    const quellen = normalisiereProduktQuellen({
      shops: [{ host: 'anderer-shop.de', suchMuster: SHOP.suchMuster }],
    })
    expect(quellen.shops).toEqual([])
  })

  it('wirft unbrauchbare Muster weg, ohne die uebrigen zu verlieren', () => {
    const quellen = normalisiereProduktQuellen({
      shops: [
        { host: 'a.de', suchMuster: 'https://a.de/suche' }, // kein {q}
        { host: 'b.de', suchMuster: 'ftp://b.de/?q={q}' }, // kein http(s)
        { host: 'c.de', suchMuster: 'https://c.de/?q={q}' }, // brauchbar
        'kein objekt',
        { host: '', suchMuster: 'https://d.de/?q={q}' }, // ohne Host
      ],
      webSuche: 'https://suche.example/?q={q}',
    })
    expect(quellen).toEqual({
      shops: [{ host: 'c.de', suchMuster: 'https://c.de/?q={q}' }],
      webSuche: 'https://suche.example/?q={q}',
    })
  })

  it('begrenzt die Shops auf acht - der Rest ist Vorrat, nicht Bestand', () => {
    const viele = Array.from({ length: 12 }, (_, nummer) => ({
      host: `shop${String(nummer)}.de`,
      suchMuster: `https://shop${String(nummer)}.de/?q={q}`,
    }))
    const quellen = normalisiereProduktQuellen({ shops: viele })
    expect(quellen.shops).toHaveLength(8)
    // Die REIHENFOLGE bleibt: Die ersten drei werden befragt (9.20.4).
    expect(quellen.shops.map((shop) => shop.host)[0]).toBe('shop0.de')
  })

  it('laesst einen unbrauchbaren Notweg weg statt zu werfen', () => {
    expect(normalisiereProduktQuellen({ shops: [SHOP], webSuche: 'nicht mal eine adresse' })).toEqual({
      shops: [SHOP],
      webSuche: null,
    })
  })
})
