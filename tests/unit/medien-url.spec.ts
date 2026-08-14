// Verhaltenstests zu #258 - `medienUrl` im geteilten Bereich.
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Fuer JEDEN heute vorkommenden
// Wert - projektId ist eine UUID, Asset.dateiname ist "<uuid>.<endung>" (#13) -
// liefert die kodierende Fassung ZEICHENGLEICH dasselbe wie die nicht kodierende.
// Ein Testsatz, der nur mit solchen Werten arbeitet, kann die beiden Fassungen also
// gar nicht auseinanderhalten - genau deshalb konnten #215 ("mit Kodierung") und
// #227 ("ohne Kodierungsumbau") jahrelang nebeneinander stehen, ohne dass etwas
// fehlschlug. Die Aussage dieses Satzes steht deshalb in den Werten, die heute nur
// ZUFAELLIG nicht vorkommen: Leerzeichen, '#', '?', '%', '/', Umlaute, Emojis.
//
// Die Erwartungswerte sind von Hand geschrieben, nicht aus der Umsetzung
// abgeschrieben.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { MEDIEN_SCHEMA, medienUrl } from '../../src/shared/medien-url'

const QUELLE = readFileSync(new URL('../../src/shared/medien-url.ts', import.meta.url), 'utf8')

/** Die Fassung, die #227 heute abnimmt ("ohne Kodierungsumbau") - NUR als Gegenprobe. */
const ohneKodierung = (projektId: string, dateiname: string): string =>
  `media://${projektId}/${dateiname}`

describe('die Adressform (TK 9.5.7)', () => {
  it('liefert fuer harmlose Werte exakt media://p1/a-b-c.png - kein Zeichen veraendert', () => {
    expect(medienUrl('p1', 'a-b-c.png')).toBe('media://p1/a-b-c.png')
  })

  it('ist fuer eine UUID-Paarung nach #13 zeichengleich mit der blossen Verkettung', () => {
    const projektId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    const dateiname = '9c858901-8a57-4791-81fe-4c455b099bc9.mp4'
    expect(medienUrl(projektId, dateiname)).toBe(`media://${projektId}/${dateiname}`)
  })

  it('setzt genau zwei Schraegstriche nach dem Doppelpunkt - kein leerer Host', () => {
    // media:///... schoebe die projektId in den Pfad; der Handler faende nichts.
    expect(medienUrl('p1', 'a.png').startsWith('media://p1/')).toBe(true)
    expect(medienUrl('p1', 'a.png')).not.toContain('media:///')
  })

  it('baut die Adresse aus MEDIEN_SCHEMA, und das ist media', () => {
    expect(MEDIEN_SCHEMA).toBe('media')
    expect(medienUrl('p1', 'a.png').startsWith(`${MEDIEN_SCHEMA}://`)).toBe(true)
  })
})

describe('die gefaehrlichen Zeichen - der Kernnachweis dieses Issues', () => {
  it('schuetzt Leerzeichen und # im Dateinamen', () => {
    const url = medienUrl('p1', 'Sommer Aktion #2.png')
    expect(url).toBe('media://p1/Sommer%20Aktion%20%232.png')
    expect(url).not.toContain(' ')
    expect(url).not.toContain('#')
    expect(url).toContain('%23')
  })

  it('schuetzt das ?, das sonst den Rest zur Abfrage machte', () => {
    expect(medienUrl('p1', 'a?b.png')).toBe('media://p1/a%3Fb.png')
  })

  it('schuetzt auch den ERSTEN Bestandteil, nicht nur den Dateinamen', () => {
    expect(medienUrl('p 1', 'a.png')).toBe('media://p%201/a.png')
  })

  it('kodiert einen Schraegstrich IM Dateinamen - es bleibt bei genau einem Trenner', () => {
    // ENTSCHIEDEN 3: Asset.dateiname ist "OHNE Verzeichnisanteil" (#13); ein
    // Schraegstrich darin ist kein Verzeichnis, sondern ein Ausbruchsversuch.
    const url = medienUrl('p1', 'a/b.png')
    expect(url).toBe('media://p1/a%2Fb.png')
    expect(url).toContain('%2F')
    // Die zwei Schraegstriche des Schemas plus GENAU EINEN Trenner.
    expect(url.split('/').length - 1).toBe(3)
  })

  it('kodiert auch den Rueckwaerts-Schraegstrich', () => {
    expect(medienUrl('p1', 'a\\b.png')).toBe('media://p1/a%5Cb.png')
  })

  it('kodiert ein bereits kodiertes % ERNEUT - keine Doppelkodierungs-Heuristik', () => {
    expect(medienUrl('p1', 'a%20b.png')).toBe('media://p1/a%2520b.png')
    expect(medienUrl('p1', 'a%20b.png')).toContain('%2520')
  })

  it('reicht .. unveraendert durch - der Ausbruchsschutz sitzt im Main (TK 9.5.7)', () => {
    expect(medienUrl('p1', '..')).toBe('media://p1/..')
  })
})

describe('total - die Funktion wirft nicht und ersetzt nichts', () => {
  it('baut auch aus zwei leeren Zeichenketten eine Adresse: media:///', () => {
    expect(medienUrl('', '')).toBe('media:///')
  })

  it('haelt fuer eine Auswahl ungewoehnlicher Namen durch', () => {
    const auswahl = [
      'Grüße ä ö ü ß.png',
      '🎉 Neujahr 🎉.mp4',
      'ÄÖÜ GROSS.PNG',
      "a-_.!~*'()b.png",
      'a\tb\nc.png',
      'x'.repeat(4096) + '.png',
      '%',
      '#?&=+',
      '日本語のファイル名.png',
    ]
    for (const dateiname of auswahl) {
      expect(() => medienUrl('p1', dateiname)).not.toThrow()
      expect(medienUrl('p1', dateiname).startsWith('media://p1/')).toBe(true)
    }
  })
})

describe('die Gegenstelle im Main (src/main/project-store/media-protokoll.ts, #50)', () => {
  // Der gebaute Handler zerlegt mit dem URL-Parser, verlangt GENAU zwei Pfadstuecke,
  // weist alles mit Query oder Fragment ab und dekodiert dann GENAU EINMAL. Diese
  // Tests pruefen, dass die hier gebildete Adresse genau das ueberlebt.
  const paare: readonly (readonly [string, string])[] = [
    ['3f2504e0-4f89-41d3-9a0c-0305e82c3301', 'a-b-c.png'],
    ['p 1', 'a.png'],
    ['p1', 'Sommer Aktion #2.png'],
    ['p1', 'a/b.png'],
    ['p1', 'a%20b.png'],
    ['p1', 'Grüße ä.png'],
    ['p1', '🎉.png'],
    ['P1-GROSS-UND-klein', 'a?b.png'],
  ]

  for (const [projektId, dateiname] of paare) {
    it(`kommt fuer ${JSON.stringify(dateiname)} unveraendert wieder heraus`, () => {
      const adresse = new URL(medienUrl(projektId, dateiname))
      const stuecke = adresse.pathname.split('/')
      // Genau EINE Pfadebene - sonst wiese der Handler ab, noch bevor er aufloest.
      expect(stuecke.length).toBe(2)
      expect(adresse.search).toBe('')
      expect(adresse.hash).toBe('')
      expect(decodeURIComponent(adresse.hostname)).toBe(projektId)
      expect(decodeURIComponent(stuecke[1] ?? '')).toBe(dateiname)
    })
  }
})

describe('Gegenprobe - die Fassung ohne Kodierung faellt durch', () => {
  it('ist fuer heutige UUID-Werte NICHT unterscheidbar - deshalb blieb der Widerspruch unsichtbar', () => {
    const projektId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    const dateiname = '9c858901-8a57-4791-81fe-4c455b099bc9.mp4'
    expect(ohneKodierung(projektId, dateiname)).toBe(medienUrl(projektId, dateiname))
  })

  it('weicht bei Leerzeichen und # ab - und verliert dabei den halben Dateinamen', () => {
    const dateiname = 'Sommer Aktion #2.png'
    expect(ohneKodierung('p1', dateiname)).not.toBe(medienUrl('p1', dateiname))
    // Der Beleg, warum das schaedlich ist: alles ab '#' waere Fragment und erreichte
    // den Handler nie - der Handler weist eine Adresse mit Fragment ausdruecklich ab.
    expect(new URL(ohneKodierung('p1', dateiname)).hash).toBe('#2.png')
    expect(new URL(medienUrl('p1', dateiname)).hash).toBe('')
  })

  it('erzeugt bei a/b.png eine zweite Pfadebene, die der Handler abweist', () => {
    expect(new URL(ohneKodierung('p1', 'a/b.png')).pathname.split('/').length).toBe(3)
    expect(new URL(medienUrl('p1', 'a/b.png')).pathname.split('/').length).toBe(2)
  })
})

describe('Grep-Proben auf die Quelldatei (Definition of Done)', () => {
  const zaehle = (muster: RegExp): number => QUELLE.match(muster)?.length ?? 0

  it("enthaelt die Zeichenkette 'media' genau einmal - die Konstante", () => {
    expect(zaehle(/'media'/g)).toBe(1)
  })

  it('ruft encodeURIComponent genau zweimal auf - einmal je Bestandteil', () => {
    expect(zaehle(/encodeURIComponent\(/g)).toBe(2)
  })

  it('enthaelt keinen der verbotenen Bausteine', () => {
    for (const verboten of [
      /\bencodeURI\(/,
      /\bescape\(/,
      /new URL/,
      /\bpath\./,
      /\bjoin\(/,
      /file:\/\//,
      /\bthrow\b/,
      /\bErgebnis\b/,
      /^\s*import\b/m,
      /\brequire\(/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\bprocess\b/,
      // Kein JSX und kein React: In einer .ts-Datei (nicht .tsx) uebersetzt JSX
      // ohnehin nicht; was bliebe, waere ein React-Import - und den gibt es nicht.
      /\breact\b/i,
    ]) {
      expect(QUELLE).not.toMatch(verboten)
    }
  })
})
