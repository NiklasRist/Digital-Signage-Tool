// [produktsuche] Treffer aus einer Suchseite lesen (#472, FA-30 / TK 9.20.2)
//
// REIN: HTML-Text und Seitenadresse hinein, Treffer heraus. Jede Regel ist einzeln
// geprueft, weil eine fremde Suchseite genau die Faelle liefert, die man nicht erwartet.
import { describe, expect, it } from 'vitest'

import { findeTreffer } from '../../src/main/produktsuche/treffer-lesen'
import { baueSuchadresse } from '../../src/main/produktsuche/suchseite'

const SEITE = 'https://shop.example/suche?q=riegel'

describe('baueSuchadresse (9.20.3)', () => {
  it('setzt das Stichwort KODIERT ein - das Stichwort baut die Adresse nicht um', () => {
    expect(baueSuchadresse('https://shop.example/suche?q={q}', 'Protein & Riegel')).toBe(
      'https://shop.example/suche?q=Protein%20%26%20Riegel',
    )
    expect(baueSuchadresse('https://shop.example/s/{q}/liste', 'a/b')).toBe(
      'https://shop.example/s/a%2Fb/liste',
    )
  })

  it('weist ein Muster ohne genau ein {q} und leere Stichworte ab', () => {
    expect(baueSuchadresse('https://shop.example/suche', 'x')).toBeNull()
    expect(baueSuchadresse('https://shop.example/?a={q}&b={q}', 'x')).toBeNull()
    expect(baueSuchadresse('https://shop.example/?q={q}', '   ')).toBeNull()
    expect(baueSuchadresse('keine adresse {q}', 'x')).toBeNull()
  })
})

describe('findeTreffer (9.20.2)', () => {
  it('liest absolute UND relative Anker in Dokumentreihenfolge', () => {
    const treffer = findeTreffer(
      `<a href="https://shop.example/produkt/1">Riegel A</a>
       <a href="/produkt/2">Riegel B</a>`,
      SEITE,
    )
    expect(treffer).toEqual([
      { url: 'https://shop.example/produkt/1', titel: 'Riegel A', host: 'shop.example' },
      { url: 'https://shop.example/produkt/2', titel: 'Riegel B', host: 'shop.example' },
    ])
  })

  it('entfernt Duplikate ueber die normalisierte Adresse', () => {
    const treffer = findeTreffer(
      `<a href="/produkt/1">Eins</a>
       <a href="https://shop.example/produkt/1#bewertungen">Eins nochmal</a>
       <a href="https://SHOP.example/produkt/1">Eins in Gross</a>`,
      SEITE,
    )
    expect(treffer.map((eintrag) => eintrag.url)).toEqual(['https://shop.example/produkt/1'])
  })

  it('laesst die Startseite, die Suchseite selbst und Nicht-http-Ziele weg', () => {
    const treffer = findeTreffer(
      `<a href="/">Startseite</a>
       <a href="${SEITE}">Diese Suche</a>
       <a href="#treffer">Sprungmarke</a>
       <a href="javascript:void(0)">Nichts</a>
       <a href="mailto:shop@example.org">Mail</a>
       <a href="/produkt/7">Treffer</a>`,
      SEITE,
    )
    expect(treffer.map((eintrag) => eintrag.url)).toEqual(['https://shop.example/produkt/7'])
  })

  it('nimmt den Linktext, sonst das title-Attribut, sonst den letzten Pfadteil', () => {
    const treffer = findeTreffer(
      `<a href="/produkt/a"><img src="/a.jpg" alt=""></a>
       <a href="/produkt/b" title="Aus dem Attribut"><span></span></a>
       <a href="/produkt/schoko-riegel-500g"></a>`,
      SEITE,
    )
    expect(treffer.map((eintrag) => eintrag.titel)).toEqual([
      'a',
      'Aus dem Attribut',
      'schoko-riegel-500g',
    ])
  })

  it('entschluesselt Entities und kuerzt lange Beschriftungen', () => {
    const lang = 'x'.repeat(300)
    const treffer = findeTreffer(
      `<a href="/produkt/1">Protein &amp; Riegel&nbsp;500g</a>
       <a href="/produkt/2">${lang}</a>`,
      SEITE,
    )
    expect(treffer[0]?.titel).toBe('Protein & Riegel 500g')
    expect(treffer[1]?.titel.length).toBeLessThanOrEqual(120)
    expect(treffer[1]?.titel.endsWith('…')).toBe(true)
  })

  it('liefert bei einer Seite ohne Anker eine leere Liste', () => {
    expect(findeTreffer('<html><body>Nichts</body></html>', SEITE)).toEqual([])
  })
})
