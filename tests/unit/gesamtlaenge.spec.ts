// Verhaltenstests zu #127 - Gesamtlaenge der Wiedergabeliste und die 30-Minuten-Warnung.
//
// Hier zaehlen ZAHLEN. Jeder Erwartungswert unten ist von Hand nachgerechnet und aus
// `RENDER_PROFILE.fps` gebildet, nicht aus der Umsetzung abgeschrieben und nicht mit
// einer 30 im Testcode:
//   frameDauer(video)   = round(trimEnde * fps) - round(trimStart * fps)   EINZELN
//   frameDauer(bild)    = round(dauer * fps)
//   gesamtlaenge        = Summe der Frames, Sekunden = Summe / fps
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Testwerte, die auf dem Frame-Raster
// glatt aufgehen, beweisen NICHTS. `dauer: 0.7` sind exakt 21 Frames - eine falsche
// Rundung faellt daran nie auf. Alle Werte hier sind bewusst KRUMM gewaehlt
// (4.71 -> 141,3 Frames; 1.02 -> 30,6; 10.49 -> 314,7), damit die Rundung ueberhaupt
// etwas zu tun hat und die Einzelrundung sich von der gemeinsamen unterscheidet.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { frameDauer as frameDauerRender } from '../../src/main/render-service/frames'
import {
  WARNSCHWELLE_SEKUNDEN,
  berechneGesamtlaenge,
  formatiereLaenge,
  frameDauer,
} from '../../src/renderer/composer/gesamtlaenge'
import type { Listenelement } from '../../src/shared/contracts/project'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import type { RenderItem } from '../../src/shared/contracts/render-request'

const fps = RENDER_PROFILE.fps

function video(trimStart: number | null, trimEnde: number | null, id = 'v1'): Listenelement {
  return { id, art: 'video', ref: 'asset-v', dauer: null, trimStart, trimEnde, einblendung: null }
}
function bild(dauer: number | null, id = 'b1'): Listenelement {
  return { id, art: 'bild', ref: 'asset-b', dauer, trimStart: null, trimEnde: null, einblendung: null }
}
function segment(dauer: number | null, id = 's1'): Listenelement {
  return { id, art: 'segment', ref: 'aktion-s', dauer, trimStart: null, trimEnde: null, einblendung: null }
}

/** Der Wert eines gelungenen Ergebnisses - schlaegt fehl, statt still `undefined` zu liefern. */
function wert<T>(ergebnis: { ok: true; wert: T } | { ok: false; fehler: unknown }): T {
  if (!ergebnis.ok) throw new Error(`Erwartet war Erfolg, bekommen: ${JSON.stringify(ergebnis)}`)
  return ergebnis.wert
}
/** Der Fehler eines fehlgeschlagenen Ergebnisses. */
function fehler(
  ergebnis:
    | { ok: true; wert: unknown }
    | { ok: false; fehler: { code: string; meldung: string; daten?: unknown } },
): { code: string; meldung: string } {
  if (ergebnis.ok) throw new Error(`Erwartet war ein Fehler, bekommen: ${JSON.stringify(ergebnis)}`)
  return ergebnis.fehler
}

describe('frameDauer - video', () => {
  it('rundet BEIDE Trim-Grenzen einzeln und bildet erst dann die Differenz', () => {
    // 1.02 * fps = 30,6 -> 31 Frames; 3.04 * fps = 91,2 -> 91 Frames; 91 - 31 = 60.
    const erwartet = Math.round(3.04 * fps) - Math.round(1.02 * fps)
    expect(erwartet).toBe(60)
    expect(wert(frameDauer(video(1.02, 3.04)))).toBe(erwartet)
  })

  it('unterscheidet sich nachweislich von der gemeinsamen Rundung der Sekundendifferenz', () => {
    // Der verbotene Weg: round((3.04 - 1.02) * fps). Die Subtraktion liefert
    // 2.0200000000000005, mal fps 60,60000000000002 -> 61 statt 60. Ein Frame je
    // Element - unsichtbar bei einem, mehrere Sekunden bei hundert.
    const gemeinsam = Math.round((3.04 - 1.02) * fps)
    expect(gemeinsam).toBe(61)
    expect(wert(frameDauer(video(1.02, 3.04)))).toBe(60)
    expect(wert(frameDauer(video(1.02, 3.04)))).not.toBe(gemeinsam)

    // Zweites Paar, andere Richtung des Unterschieds: 2.51 -> 75,3 -> 75;
    // 10.49 -> 314,7 -> 315; einzeln 240, gemeinsam round(239,4) = 239.
    expect(Math.round((10.49 - 2.51) * fps)).toBe(239)
    expect(wert(frameDauer(video(2.51, 10.49)))).toBe(240)
  })

  it('liefert ueber einen ganzen Bereich krummer Grenzen die Einzelrundung', () => {
    for (let i = 1; i <= 60; i++) {
      const start = i * 0.037
      const ende = start + i * 0.113
      const erwartet = Math.round(ende * fps) - Math.round(start * fps)
      expect(wert(frameDauer(video(start, ende)))).toBe(erwartet)
    }
  })
})

describe('frameDauer - bild und segment', () => {
  it('rundet die Dauer eines Bildes und eines Segments gleich', () => {
    // 10.5 * fps = 315 - hier absichtlich der Wert aus der DoD.
    const erwartet = Math.round(10.5 * fps)
    expect(erwartet).toBe(315)
    expect(wert(frameDauer(bild(10.5)))).toBe(erwartet)
    expect(wert(frameDauer(segment(10.5)))).toBe(erwartet)
  })

  it('rundet auch krumme Dauern, bei denen die Rundung etwas zu tun hat', () => {
    // 4.71 * fps = 141,3 -> 141 Frames (abwaerts).
    expect(wert(frameDauer(bild(4.71)))).toBe(Math.round(4.71 * fps))
    expect(wert(frameDauer(bild(4.71)))).toBe(141)
    // 4.72 * fps = 141,6 -> 142 Frames (aufwaerts) - dasselbe Element, ein Frame mehr.
    expect(wert(frameDauer(segment(4.72)))).toBe(142)
    // Kein `floor`: 4.72 abgeschnitten waere 141.
    expect(Math.floor(4.72 * fps)).toBe(141)
  })

  it('liest bei bild/segment NIE die Trim-Felder', () => {
    const mitTrimMuell: Listenelement = {
      id: 'b-trim',
      art: 'bild',
      ref: 'asset-b',
      dauer: 4.71,
      trimStart: 999,
      trimEnde: 12345,
      einblendung: null,
    }
    expect(wert(frameDauer(mitTrimMuell))).toBe(Math.round(4.71 * fps))
  })
})

describe('das Werbeband zaehlt nie mit', () => {
  it('liefert mit Einblendung dieselbe Frame-Zahl wie ohne', () => {
    const ohne = video(2.51, 10.49, 'v-ohne')
    const mit: Listenelement = {
      ...video(2.51, 10.49, 'v-mit'),
      einblendung: {
        bandVorlageId: 'band-1',
        abschnitte: [
          { aktionRef: 'a1', dauer: 3.33 },
          { aktionRef: 'a2', dauer: 4.71 },
          { aktionRef: 'a3', dauer: 120 },
        ],
      },
    }
    expect(wert(frameDauer(mit))).toBe(wert(frameDauer(ohne)))
    expect(wert(frameDauer(mit))).toBe(240)

    // Und auch in der Summe nicht: die Bandzeiten sind zusammen 128,04 s - waeren
    // sie mitgezaehlt, laege die Liste weit ueber 240 Frames.
    expect(wert(berechneGesamtlaenge([mit])).frames).toBe(240)
  })
})

describe('berechneGesamtlaenge', () => {
  it('ist die Summe der Einzelwerte aus frameDauer (gemischte Liste)', () => {
    const liste = [video(1.02, 3.04, 'v'), bild(4.71, 'b'), segment(10.5, 's')]
    const einzeln = liste.map((e) => wert(frameDauer(e)))
    expect(einzeln).toEqual([60, 141, 315])

    const gesamt = wert(berechneGesamtlaenge(liste))
    expect(gesamt.frames).toBe(einzeln.reduce((a, b) => a + b, 0))
    expect(gesamt.frames).toBe(516)
    expect(gesamt.sekunden).toBe(516 / fps)
    expect(gesamt.warnung).toBe(false)
  })

  it('liefert sekunden immer als exaktes Vielfaches von 1/fps', () => {
    // ACHTUNG, hier steckt eine echte Gleitkomma-Falle: `frames / fps * fps === frames`
    // gilt NICHT durchgaengig (erstmals falsch bei 31 Frames). Die tragfaehige
    // Formulierung ist deshalb: die Sekunden lassen sich verlustfrei auf dieselbe
    // Frame-Zahl zurueckrechnen.
    expect((31 / fps) * fps === 31).toBe(false)

    for (let n = 1; n <= 400; n++) {
      const gesamt = wert(berechneGesamtlaenge([bild(n * 0.271)]))
      expect(Math.round(gesamt.sekunden * fps)).toBe(gesamt.frames)
      expect(gesamt.sekunden).toBe(gesamt.frames / fps)
    }
  })

  it('teilt GENAU EINMAL, ganz am Schluss - nicht je Element', () => {
    // Der Unterschied ist messbar und nicht bloss Theorie: 1.02 s sind 30,6 -> 31
    // Frames. Drei solche Elemente ergeben 93 Frames.
    //   richtig:  93 / fps                       = 3.1
    //   falsch:   31/fps + 31/fps + 31/fps       = 3.1000000000000005
    // Die zweite Zahl ist kein Vielfaches von 1/fps mehr, und mit jedem weiteren
    // Element waechst der Abstand - genau der Drift, den TK 9.2.6 verbietet.
    const summeJeElement = 31 / fps + 31 / fps + 31 / fps
    expect(summeJeElement).not.toBe(93 / fps)

    const gesamt = wert(berechneGesamtlaenge([bild(1.02, 'a'), bild(1.02, 'b'), bild(1.02, 'c')]))
    expect(gesamt.frames).toBe(93)
    expect(gesamt.sekunden).toBe(93 / fps)
    expect(gesamt.sekunden).not.toBe(summeJeElement)
  })

  it('liefert bei leerer Liste 0 und KEINEN Fehler', () => {
    const ergebnis = berechneGesamtlaenge([])
    expect(ergebnis.ok).toBe(true)
    expect(wert(ergebnis)).toEqual({ frames: 0, sekunden: 0, warnung: false })
  })

  it('liefert bei genau einem Element genau dessen Frames', () => {
    const gesamt = wert(berechneGesamtlaenge([video(2.51, 10.49)]))
    expect(gesamt).toEqual({ frames: 240, sekunden: 240 / fps, warnung: false })
  })
})

describe('die 30-Minuten-Warnung', () => {
  it('warnt bei GENAU der Schwelle nicht und bei einem Frame mehr schon', () => {
    const schwelleFrames = WARNSCHWELLE_SEKUNDEN * fps
    expect(schwelleFrames).toBe(54000)

    const genau = wert(berechneGesamtlaenge([bild(WARNSCHWELLE_SEKUNDEN)]))
    expect(genau.frames).toBe(schwelleFrames)
    expect(genau.sekunden).toBe(WARNSCHWELLE_SEKUNDEN)
    expect(genau.warnung).toBe(false)

    const einFrameMehr = wert(
      berechneGesamtlaenge([bild(WARNSCHWELLE_SEKUNDEN), bild(1 / fps, 'b2')]),
    )
    expect(einFrameMehr.frames).toBe(schwelleFrames + 1)
    expect(einFrameMehr.sekunden).toBeGreaterThan(WARNSCHWELLE_SEKUNDEN)
    expect(einFrameMehr.warnung).toBe(true)

    // Ein Frame WENIGER warnt ebenfalls nicht (Grenze in beide Richtungen).
    const einFrameWeniger = wert(
      berechneGesamtlaenge([bild(WARNSCHWELLE_SEKUNDEN - 1 / fps)]),
    )
    expect(einFrameWeniger.frames).toBe(schwelleFrames - 1)
    expect(einFrameWeniger.warnung).toBe(false)
  })

  it('blockiert nichts - die Rechnung gelingt auch weit ueber der Schwelle', () => {
    const gesamt = wert(berechneGesamtlaenge([bild(WARNSCHWELLE_SEKUNDEN * 3)]))
    expect(gesamt.warnung).toBe(true)
    expect(gesamt.frames).toBe(WARNSCHWELLE_SEKUNDEN * 3 * fps)
  })
})

describe('Fehlerpfade - jeder liefert ungueltige_eingabe und nennt die id', () => {
  const faelle: Array<[string, Listenelement]> = [
    ['video ohne trimStart', video(null, 3.04, 'id-a')],
    ['video ohne trimEnde', video(1.02, null, 'id-b')],
    ['video mit NaN-Grenze', video(Number.NaN, 3.04, 'id-c')],
    ['video mit unendlicher Grenze', video(1.02, Number.POSITIVE_INFINITY, 'id-d')],
    ['video mit trimEnde gleich trimStart', video(4.71, 4.71, 'id-e')],
    ['video mit trimEnde vor trimStart', video(10.49, 2.51, 'id-f')],
    ['bild ohne dauer', bild(null, 'id-g')],
    ['segment ohne dauer', segment(null, 'id-h')],
    ['bild mit dauer 0', bild(0, 'id-i')],
    ['bild mit negativer dauer', bild(-4.71, 'id-j')],
    ['segment mit unendlicher dauer', segment(Number.POSITIVE_INFINITY, 'id-k')],
    // 0.01 * fps = 0,3 -> 0 Frames. Ein Element ohne einen einzigen Frame kann im
    // Render nicht entstehen.
    ['bild, dessen dauer auf 0 Frames rundet', bild(0.01, 'id-l')],
    // 1.0 -> 30 Frames, 1.01 -> 30,3 -> 30 Frames: die Sekunden gehen auseinander,
    // das Frame-Raster nicht.
    ['video, dessen Ausschnitt kuerzer als ein Frame ist', video(1.0, 1.01, 'id-m')],
    [
      'unbekannte art',
      { id: 'id-n', art: 'ton', ref: 'x', dauer: 5, trimStart: null, trimEnde: null, einblendung: null } as unknown as Listenelement,
    ],
  ]

  for (const [name, element] of faelle) {
    it(name, () => {
      const f = fehler(frameDauer(element))
      expect(f.code).toBe('ungueltige_eingabe')
      expect(f.meldung).toContain(element.id)

      // Derselbe Fall bringt auch die GESAMTE Rechnung zu Fall - kein Teilergebnis.
      const gesamt = fehler(berechneGesamtlaenge([bild(4.71, 'gut-1'), element, bild(4.71, 'gut-2')]))
      expect(gesamt.code).toBe('ungueltige_eingabe')
      expect(gesamt.meldung).toContain(element.id)
    })
  }

  it('weist einen negativen Trim-Anfang ab - wie der render-service', () => {
    // NICHT in der Fehlertabelle des Issues, aber in `trimFrames` (#174) gebaut, und
    // der gebaute Code gewinnt. Ohne diesen Zweig zeigte die Oberflaeche fuer
    // trimStart = -1.02 eine Laenge von round(3.04*fps) - round(-1.02*fps)
    // = 91 - (-31) = 122 Frames an - und der Render braeche danach ab.
    expect(Math.round(3.04 * fps) - Math.round(-1.02 * fps)).toBe(122)

    const f = fehler(frameDauer(video(-1.02, 3.04, 'id-neg')))
    expect(f.code).toBe('ungueltige_eingabe')
    expect(f.meldung).toContain('id-neg')

    // Und die Gegenseite meldet denselben Mangel.
    const dort = frameDauerRender({
      id: 'id-neg',
      art: 'video',
      medienRef: 'media/a.mp4',
      trimStart: -1.02,
      trimEnde: 3.04,
      einblendung: null,
    } as unknown as RenderItem)
    expect(dort.ok).toBe(false)
  })

  it('wirft nicht, wenn ein Element gar kein Objekt ist', () => {
    const loch = [bild(4.71, 'gut'), null] as unknown as Listenelement[]
    const f = fehler(berechneGesamtlaenge(loch))
    expect(f.code).toBe('ungueltige_eingabe')
  })

  it('gibt fuer ein Video ohne Trim-Werte KEINE ungefaehre Laenge zurueck', () => {
    const ergebnis = berechneGesamtlaenge([bild(10.5, 'gut'), video(null, null, 'kaputt')])
    expect(ergebnis.ok).toBe(false)
    expect(JSON.stringify(ergebnis)).not.toContain('315')
  })

  it('zaehlt ein kaputtes Element (fehlendes Asset) normal mit', () => {
    // „kaputt" heisst: `ref` zeigt ins Leere. Fuer die Rechnung ist das kein Fall -
    // sie sieht nur Dauern. Der Reparatur-Modus (#131 ff.) behandelt das.
    const kaputt = bild(4.71, 'ref-weg')
    kaputt.ref = 'gibt-es-nicht'
    expect(wert(berechneGesamtlaenge([kaputt])).frames).toBe(141)
  })
})

describe('formatiereLaenge', () => {
  it('erfuellt die vier Beispiele der DoD', () => {
    expect(formatiereLaenge(0)).toBe('0:00')
    expect(formatiereLaenge(65)).toBe('1:05')
    expect(formatiereLaenge(3600)).toBe('1:00:00')
    expect(formatiereLaenge(3661)).toBe('1:01:01')
  })

  it('rundet auf ganze Sekunden ab, damit die Anzeige nie zu lang wirkt', () => {
    // 4,71 s werden als 0:04 angezeigt, nicht als 0:05.
    expect(formatiereLaenge(4.71)).toBe('0:04')
    expect(formatiereLaenge(59.99)).toBe('0:59')
    expect(formatiereLaenge(WARNSCHWELLE_SEKUNDEN)).toBe('30:00')
    expect(formatiereLaenge(WARNSCHWELLE_SEKUNDEN + 1 / fps)).toBe('30:00')
    expect(formatiereLaenge(3599)).toBe('59:59')
  })

  it('stellt unbrauchbare Eingaben als 0:00 dar, statt Unsinn zu zeigen', () => {
    expect(formatiereLaenge(-1)).toBe('0:00')
    expect(formatiereLaenge(Number.NaN)).toBe('0:00')
    expect(formatiereLaenge(Number.POSITIVE_INFINITY)).toBe('0:00')
  })
})

describe('dieselbe Zahl wie der render-service (#174)', () => {
  // Die Zusage aus TK 9.7.4: die angezeigte Laenge und die Laenge der fertigen Datei
  // sind DIESELBE Zahl. Beide Seiten rechnen sie getrennt aus (der Renderer darf
  // nichts aus src/main/ importieren) - also wird hier gemessen, dass sie
  // uebereinstimmen, statt es zu behaupten.
  it('liefert fuer dieselben Werte bitgleich dieselbe Frame-Zahl', () => {
    for (let i = 1; i <= 120; i++) {
      const start = i * 0.0417
      const ende = start + i * 0.1931
      const hier = wert(frameDauer(video(start, ende)))
      const dort = wert(
        frameDauerRender({
          id: 'v',
          art: 'video',
          medienRef: 'media/a.mp4',
          trimStart: start,
          trimEnde: ende,
          einblendung: null,
        } as unknown as RenderItem),
      )
      expect(hier).toBe(dort)

      const dauer = i * 0.271
      expect(wert(frameDauer(bild(dauer)))).toBe(
        wert(
          frameDauerRender({ id: 'b', art: 'bild', medienRef: 'media/a.png', dauer } as unknown as RenderItem),
        ),
      )
    }
  })
})

describe('Grep-Proben aus der DoD', () => {
  const pfad = fileURLToPath(new URL('../../src/renderer/composer/gesamtlaenge.ts', import.meta.url))
  const quelltext = readFileSync(pfad, 'utf8')
  // Kommentare entfernen - die Regel gilt dem CODE. Der Vertrag selbst wird im Kopf
  // der Datei woertlich zitiert, und dort stehen „30 fps" und „30-Minuten-Warnung"
  // voellig zu Recht.
  //
  // REIHENFOLGE BEACHTEN: erst die Zeilenkommentare, DANN die Blockkommentare. Der
  // Dateikopf zitiert `src/main/**` - darin steckt die Zeichenfolge, die einen
  // Blockkommentar EROEFFNET. Wer zuerst nach Blockkommentaren sucht, schneidet ab
  // dieser Stelle bis zum naechsten `*/` alles heraus, also auch die Import-Zeilen,
  // und prueft danach an einem loechrigen Text. Genau das ist beim Schreiben dieses
  // Tests passiert; der Sanity-Test darunter ist die Schranke dagegen.
  const code = quelltext.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('das Entfernen der Kommentare hat den Code nicht mit weggeschnitten', () => {
    expect(code).toContain('Math.round(sekunden * RENDER_PROFILE.fps)')
    expect(code).toContain("import { RENDER_PROFILE } from '../../shared/contracts/render-profile'")
    expect(code).toContain('export function frameDauer')
    expect(code).toContain('export function berechneGesamtlaenge')
    expect(code).toContain('export function formatiereLaenge')
    expect(code).toContain('export const WARNSCHWELLE_SEKUNDEN')
  })

  it('enthaelt die Zahl 30 nicht als Literal - fps kommt aus RENDER_PROFILE', () => {
    expect(code).not.toMatch(/\b30\b/)
    expect(code).toContain('RENDER_PROFILE.fps')
  })

  it('liest die Einblendung nirgends', () => {
    expect(quelltext.toLowerCase()).not.toContain('einblendung')
  })

  it('enthaelt weder IPC noch Dateisystem noch JSX', () => {
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toContain('window.api')
    expect(code).not.toMatch(/\bfrom '(node:)?fs'/)
    expect(code).not.toMatch(/<\/[A-Za-z]/)
  })

  it('importiert nichts aus src/main - der Renderer bleibt getrennt (E3)', () => {
    // Nur die Import-Zeilen; der Kopf der Datei NENNT src/main/render-service/frames.ts
    // als die zweite Haelfte der Zusage, und das soll er auch.
    const importe = code.match(/^\s*import[\s\S]*?from\s+'[^']+'/gm) ?? []
    expect(importe.length).toBeGreaterThan(0)
    for (const zeile of importe) expect(zeile).not.toContain('main/')
  })
})
