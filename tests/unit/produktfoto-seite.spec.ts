// Produktseite lesen (FA-27 / TK 9.19.3) - rein, ohne Netz.
import { describe, expect, it } from 'vitest'

import { findeBildAdressen, normalisiereBildAdresse } from '../../src/main/produktfoto/seite-lesen'

const SEITE = 'https://shop.example/produkt/42'

describe('findeBildAdressen (FA-27)', () => {
  it('liest Product.image als String', () => {
    const html = `<script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Product","name":"Hantel",
       "image":"https://cdn.example/hantel.jpg"}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://cdn.example/hantel.jpg'])
  })

  it('liest ein Array, behaelt die Reihenfolge und entfernt Duplikate', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","image":[
        "https://cdn.example/a.jpg",
        "https://cdn.example/b.jpg",
        "https://cdn.example/a.jpg"
      ]}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual([
      'https://cdn.example/a.jpg',
      'https://cdn.example/b.jpg',
    ])
  })

  it('liest ImageObject ueber url und contentUrl', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","image":[
        {"@type":"ImageObject","url":"https://cdn.example/eins.png"},
        {"@type":"ImageObject","contentUrl":"https://cdn.example/zwei.png"}
      ]}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual([
      'https://cdn.example/eins.png',
      'https://cdn.example/zwei.png',
    ])
  })

  it('findet ein Product innerhalb eines @graph', () => {
    const html = `<script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebSite","url":"https://shop.example"},
        {"@type":"Product","image":"https://cdn.example/graph.webp"}
      ]}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://cdn.example/graph.webp'])
  })

  it('loest relative Adressen gegen die Seitenadresse auf', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","image":"/media/hantel.jpg"}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://shop.example/media/hantel.jpg'])
  })

  it('verwirft data:, blob: und file: (keine zweite Bildquelle)', () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","image":[
        "data:image/png;base64,AAAA",
        "blob:https://shop.example/xyz",
        "file:///etc/passwd",
        "https://cdn.example/echt.jpg"
      ]}
    </script>`

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://cdn.example/echt.jpg'])
  })

  it('nimmt og:image NUR, wenn keine strukturierten Daten da sind', () => {
    const html = `
      <meta property="og:image" content="https://cdn.example/og.jpg">
      <script type="application/ld+json">{"@type":"Product","image":"https://cdn.example/ld.jpg"}</script>
    `

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://cdn.example/ld.jpg'])
  })

  it('faellt auf og:image zurueck und bevorzugt og:image:secure_url', () => {
    const html = `
      <meta property="og:image" content="http://cdn.example/og.jpg">
      <meta property="og:image:secure_url" content="https://cdn.example/secure.jpg">
    `

    expect(findeBildAdressen(html, SEITE)).toEqual([
      'https://cdn.example/secure.jpg',
      'http://cdn.example/og.jpg',
    ])
  })

  it('dekodiert &amp; in der Adresse', () => {
    const html = `<meta property="og:image" content="https://cdn.example/bild.jpg?w=1200&amp;h=800">`

    expect(findeBildAdressen(html, SEITE)).toEqual([
      'https://cdn.example/bild.jpg?w=1200&h=800',
    ])
  })

  it('ueberspringt kaputtes JSON-LD, ohne den zweiten Block zu verlieren', () => {
    const html = `
      <script type="application/ld+json">{ kaputt</script>
      <script type="application/ld+json">{"@type":"Product","image":"https://cdn.example/heil.jpg"}</script>
    `

    expect(findeBildAdressen(html, SEITE)).toEqual(['https://cdn.example/heil.jpg'])
  })

  it('liefert eine leere Liste, wenn die Seite nichts hergibt', () => {
    expect(findeBildAdressen('<html><body>Nichts</body></html>', SEITE)).toEqual([])
  })
})

describe('normalisiereBildAdresse (FA-27)', () => {
  it('entfernt das Fragment und laesst Query-Parameter stehen', () => {
    expect(normalisiereBildAdresse('https://cdn.example/a.jpg?x=1#teil', SEITE)).toBe(
      'https://cdn.example/a.jpg?x=1',
    )
  })

  it('lehnt fremde Schemata ab', () => {
    expect(normalisiereBildAdresse('ftp://cdn.example/a.jpg', SEITE)).toBeNull()
    expect(normalisiereBildAdresse('javascript:alert(1)', SEITE)).toBeNull()
  })
})
