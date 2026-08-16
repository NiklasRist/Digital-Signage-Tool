// Verhaltenstests zu #130 - die Wirkung der Abschnittsfolge eines Werbebands,
// berechnet in derselben Frame-Rundung wie der Render.
//
// Hier zaehlen ZAHLEN. Jeder Erwartungswert ist von Hand nachgerechnet, die
// Rundung kommt aus `fps` (und nie als Literal 30):
//   videoFrames    = round(ende * fps) - round(start * fps)      EINZELN gerundet
//   abschnittsFrames[i] = round(dauer * fps)
//   volleDurchlaeufe = floor(videoFrames / folgeFrames); der Rest steckt in restFrames
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Werte, die auf dem Frame-Raster
// glatt aufgehen, beweisen NICHTS. `dauer: 0.7` sind exakt 21 Frames - eine falsche
// Rundung faellt daran nie auf. Deshalb hier drei Abschnitte zu je 3,333 s gegen ein
// Video von 10 s: Sekunden-Rechnung sagt „Folge kuerzer, wiederholt sich",
// Frame-Rechnung sagt „passt exakt" (je 100 Frames, Summe 300 = 300) - genau die
// Abweichung, die diese Datei sichtbar machen soll.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { planeBandAblauf } from '../../src/renderer/composer/einblendung-vorschau'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

const fps = RENDER_PROFILE.fps

/** Abschnitte aus rohen Dauern; `index` ist nur fuer den Parameternamen da. */
function abschnitte(...dauern: number[]): Array<{ aktionRef: string; dauer: number }> {
  return dauern.map((dauer, index) => ({ aktionRef: `aktion-${index + 1}`, dauer }))
}

describe('die Frame-Rundung ist die des Renders (TK 9.2.6)', () => {
  it('rundet beide Trim-Grenzen EINZELN und bildet erst dann die Differenz', () => {
    const plan = planeBandAblauf(1.02, 3.04, abschnitte(4.71))
    // 1.02 * fps = 30,6 -> 31; 3.04 * fps = 91,2 -> 91; 91 - 31 = 60 Frames.
    expect(plan.videoFrames).toBe(60)
    expect(plan.videoFrames).toBe(Math.round(3.04 * fps) - Math.round(1.02 * fps))
  })

  it('unterscheidet sich nachweislich von der Rundung der Sekundendifferenz', () => {
    // Der verbotene Weg: round((3.04 - 1.02) * fps). Die Subtraktion liefert
    // 2.0200000000000005, mal fps 60,60000000000002 -> 61 statt 60. Ein Frame je
    // Element - der Drift, den TK 9.2.6 ausschliesst.
    expect(Math.round((3.04 - 1.02) * fps)).toBe(61)
    const plan = planeBandAblauf(1.02, 3.04, abschnitte(4.71))
    expect(plan.videoFrames).toBe(60)
    expect(plan.videoFrames).not.toBe(Math.round((3.04 - 1.02) * fps))
  })

  it('rundet Abschnitts-Dauern mit derselben Regel, krumme und glatte', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(4.71, 4.72, 10.5))
    // 4.71 -> 141,3 -> 141; 4.72 -> 141,6 -> 142; 10.5 -> 315 (exakt).
    expect(plan.abschnittsFrames).toEqual([
      Math.round(4.71 * fps),
      Math.round(4.72 * fps),
      Math.round(10.5 * fps),
    ])
    expect(plan.abschnittsFrames).toEqual([141, 142, 315])
    expect(plan.folgeFrames).toBe(141 + 142 + 315)
  })

  it('liefert fuer krumme Trim-Grenzen durchgehend die Einzelrundung', () => {
    for (let i = 1; i <= 60; i++) {
      const start = i * 0.037
      const ende = start + i * 0.113
      const plan = planeBandAblauf(start, ende, abschnitte(1))
      expect(plan.videoFrames).toBe(Math.round(ende * fps) - Math.round(start * fps))
    }
  })
})

describe('BandVerhalten wird nach der Tabelle vergeben (TK 9.2.8)', () => {
  // Das DoD-Beispiel: drei Abschnitte zu je 3,333 s gegen ein Video von 10 s.
  // Sekunden-Rechnung faende 9,999 s < 10 s („wiederholt"), Frames sagen exakt.
  it('liefert bei gleicher Frame-Laenge exakt, wo Sekunden noch einen Rest sehen', () => {
    expect(Math.round(3.333 * fps)).toBe(100)
    expect(9.999).toBeLessThan(10)
    const plan = planeBandAblauf(0, 10, abschnitte(3.333, 3.333, 3.333))
    expect(plan.videoFrames).toBe(300)
    expect(plan.folgeFrames).toBe(300)
    expect(plan.verhalten).toBe('exakt')
    expect(plan.volleDurchlaeufe).toBe(1)
    expect(plan.restFrames).toBe(0)
  })

  it('liefert exakt auch bei kuerzerer Folge, die restlos aufgeht (ohne Rest)', () => {
    // Folge 60 + 30 = 90 Frames, Video 270 -> 3 volle Durchlaeufe, Rest 0.
    const plan = planeBandAblauf(0, 9, abschnitte(2, 1))
    expect(plan.folgeFrames).toBe(90)
    expect(plan.videoFrames).toBe(270)
    expect(plan.verhalten).toBe('exakt')
    expect(plan.volleDurchlaeufe).toBe(3)
    expect(plan.restFrames).toBe(0)
    expect(plan.angeschnittenerIndex).toBeNull()
  })

  it('liefert wiederholt bei kuerzerer Folge mit Rest (DoD: „mit und ohne Rest")', () => {
    // Folge 300 Frames, Video 23,333 s -> 700 Frames: 2 volle Durchlaeufe,
    // Rest 100. Der Rest endet mitten im zweiten Abschnitt (cumsum 200 > 100).
    expect(Math.round(23.333 * fps)).toBe(700)
    const plan = planeBandAblauf(0, 23.333, abschnitte(3.333, 3.333, 3.333))
    expect(plan.verhalten).toBe('wiederholt')
    expect(plan.volleDurchlaeufe).toBe(2)
    expect(plan.restFrames).toBe(100)
    expect(plan.angeschnittenerIndex).toBe(1)
  })

  it('liefert abgeschnitten bei laengerer Folge (DoD: „Folge laenger als Video")', () => {
    // Folge 120 + 120 = 240 Frames, Video 5 s = 150: kein voller Durchlauf, der
    // Abbruch liegt mitten im zweiten Abschnitt (cumsum 240 > 150).
    const plan = planeBandAblauf(0, 5, abschnitte(4, 4))
    expect(plan.folgeFrames).toBe(240)
    expect(plan.videoFrames).toBe(150)
    expect(plan.verhalten).toBe('abgeschnitten')
    expect(plan.volleDurchlaeufe).toBe(0)
    expect(plan.restFrames).toBe(150)
    expect(plan.angeschnittenerIndex).toBe(1)
  })

  it('liefert abgeschnitten fuer ein Video mit 0 Frames (exakt verlangt >= 1 Durchlauf)', () => {
    const plan = planeBandAblauf(0, 0, abschnitte(4))
    expect(plan.videoFrames).toBe(0)
    expect(plan.verhalten).toBe('abgeschnitten')
    expect(plan.volleDurchlaeufe).toBe(0)
    expect(plan.restFrames).toBe(0)
    expect(plan.angeschnittenerIndex).toBe(0)
  })

  it('liefert leer fuer eine leere Folge', () => {
    const plan = planeBandAblauf(0, 10, [])
    expect(plan.verhalten).toBe('leer')
    expect(plan.videoFrames).toBe(300)
    expect(plan.folgeFrames).toBe(0)
    expect(plan.volleDurchlaeufe).toBe(0)
    expect(plan.restFrames).toBe(0)
    expect(plan.angeschnittenerIndex).toBeNull()
  })

  it('liefert leer, wenn alle Dauern auf 0 Frames runden', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(0.01, -5, Number.NaN))
    expect(plan.folgeFrames).toBe(0)
    expect(plan.verhalten).toBe('leer')
    expect(plan.volleDurchlaeufe).toBe(0)
    // ANDERS als bei der leeren Folge: hier gibt es Indizes, und alle sind drin.
    expect(plan.nullFrameIndizes).toEqual([0, 1, 2])
  })
})

describe('angeschnittenerIndex benennt den Abschnitt, der nicht zu Ende gezeigt wird', () => {
  it('bleibt bei exakt und leer null', () => {
    expect(planeBandAblauf(0, 10, abschnitte(3.333, 3.333, 3.333)).angeschnittenerIndex).toBeNull()
    expect(planeBandAblauf(0, 10, []).angeschnittenerIndex).toBeNull()
    expect(planeBandAblauf(0, 10, abschnitte(0.01)).angeschnittenerIndex).toBeNull()
  })

  it('ist bei wiederholt der Abschnitt, in dem der Rest endet', () => {
    // Folgen-Frames [30, 60, 90], Video 55 Frames -> volle 0? Nein: 55 / 180,
    // volle 0 -> abgeschnitten. Fuer wiederholt: video lang genug.
    const plan = planeBandAblauf(0, 18 + 1 / 30, abschnitte(1, 2, 3))
    // 18,0333 s -> round(541) = 541; 541 / 180 = 3,006 -> 3 volle, Rest 1.
    expect(plan.verhalten).toBe('wiederholt')
    expect(plan.restFrames).toBe(1)
    // kleinste kumulierte Summe > 1: cumsum[0] = 30 -> Index 0.
    expect(plan.angeschnittenerIndex).toBe(0)
  })

  it('ueberspringt bei wiederholt einen auf 0 gerundeten Abschnitt an der Nahtstelle', () => {
    // Frames [0, 60, 60], Folge 120, Video 10 s = 300 -> 2 volle, Rest 60.
    // Der 0-Frame-Abschnitt erhoeht die kumulierte Summe nicht: 0 <= 60, 60 <= 60,
    // erst 120 > 60 -> Index 2, nicht Index 1.
    const plan = planeBandAblauf(0, 10, abschnitte(0.01, 2, 2))
    expect(plan.verhalten).toBe('wiederholt')
    expect(plan.restFrames).toBe(60)
    expect(plan.nullFrameIndizes).toEqual([0])
    expect(plan.angeschnittenerIndex).toBe(2)
  })

  it('ist bei trimEnde <= trimStart der erste frame-tragende Abschnitt', () => {
    const plan = planeBandAblauf(10, 5, abschnitte(4, 4))
    expect(plan.videoFrames).toBe(0)
    expect(plan.verhalten).toBe('abgeschnitten')
    expect(plan.angeschnittenerIndex).toBe(0)
  })

  it('ist bei einem Video mit 0 Frames nicht der lautlos verschwundene Null-Abschnitt', () => {
    const plan = planeBandAblauf(0, 0, abschnitte(0.01, 4))
    expect(plan.verhalten).toBe('abgeschnitten')
    expect(plan.nullFrameIndizes).toEqual([0])
    // Der Null-Abschnitt kann nicht „angeschnitten" sein - er kommt gar nicht vor.
    expect(plan.angeschnittenerIndex).toBe(1)
  })
})

describe('nullFrameIndizes', () => {
  it('enthaelt GENAU die Indizes mit abschnittsFrames[i] === 0, aufsteigend', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(2, 0.01, 2, 1, 0.015))
    // 0,015 * fps = 0,45 -> 0 Frames; die Dauern 0,01 und 0,015 ergeben Indizes 1 und 4.
    expect(plan.abschnittsFrames).toEqual([60, 0, 60, 30, 0])
    expect(plan.nullFrameIndizes).toEqual([1, 4])
  })

  it('meldet einen mittigen Null-Abschnitt, waehrend folgeFrames und volleDurchlaeufe unauffaellig bleiben', () => {
    const mitNull = planeBandAblauf(0, 10, abschnitte(2, 0.01, 2))
    const ohneNull = planeBandAblauf(0, 10, abschnitte(2, 2))
    // Die Null-Dauer veraendert die Zaehler nicht - der Nutzer sieht also einen
    // plausiblen Plan, und genau deshalb ist das Feld als Hinweis noetig.
    expect(mitNull.folgeFrames).toBe(ohneNull.folgeFrames)
    expect(mitNull.volleDurchlaeufe).toBe(ohneNull.volleDurchlaeufe)
    expect(mitNull.folgeFrames).toBe(120)
    expect(mitNull.volleDurchlaeufe).toBe(2)
    expect(mitNull.nullFrameIndizes).toEqual([1])
    expect(ohneNull.nullFrameIndizes).toEqual([])
  })

  it('ist bei einer Folge ohne Null-Abschnitte ein leeres Array, nie undefined', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(2, 2, 1))
    expect(plan.nullFrameIndizes).toBeDefined()
    expect(plan.nullFrameIndizes).toEqual([])
    expect(Array.isArray(plan.nullFrameIndizes)).toBe(true)
  })

  it('zaehlt eine Dauer von genau 0 als Null-Abschnitt (DoD: „Abschnitt mit Dauer 0")', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(3, 0, 3))
    expect(plan.abschnittsFrames).toEqual([90, 0, 90])
    expect(plan.nullFrameIndizes).toEqual([1])
  })
})

describe('Fehlerpfade - geklemmt, nie geworfen (Anzeige, keine Pruefstelle)', () => {
  it('behandelt negative und nicht endliche Dauern als 0 Frames', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(-4.71, Number.POSITIVE_INFINITY, 3))
    expect(plan.abschnittsFrames).toEqual([0, 0, 90])
    expect(plan.nullFrameIndizes).toEqual([0, 1])
    expect(plan.folgeFrames).toBe(90)
    // 300 / 90 = 3 volle Durchlaeufe, Rest 30 - die Null-Abschnitte blechen nichts.
    expect(plan.verhalten).toBe('wiederholt')
  })

  it('behandelt nicht endliche Trim-Grenzen als 0 (kein Wurf)', () => {
    const naN = planeBandAblauf(Number.NaN, 3.04, abschnitte(1))
    expect(naN.videoFrames).toBe(Math.round(3.04 * fps))

    const unendlich = planeBandAblauf(0, Number.POSITIVE_INFINITY, abschnitte(1))
    expect(unendlich.videoFrames).toBe(0)
    expect(unendlich.verhalten).toBe('abgeschnitten')

    const allesUndefiniert = planeBandAblauf(Number.NaN, Number.NEGATIVE_INFINITY, [])
    expect(allesUndefiniert.videoFrames).toBe(0)
    expect(allesUndefiniert.verhalten).toBe('leer')
  })

  it('klemmt trimEnde <= trimStart auf 0 Frames, ohne aufzurunden', () => {
    const plan = planeBandAblauf(10, 5, abschnitte(2))
    expect(plan.videoFrames).toBe(0)
    expect(plan.verhalten).toBe('abgeschnitten')
  })

  it('liefert fuer jede Eingabe einen Plan ohne Infinity, NaN oder undefined', () => {
    const faelle = [
      planeBandAblauf(0, 10, []),
      planeBandAblauf(0, 10, abschnitte(0.01)),
      planeBandAblauf(0, 0, abschnitte(4)),
      planeBandAblauf(0, 10, abschnitte(4.71, -2, Number.NaN, Number.POSITIVE_INFINITY)),
      planeBandAblauf(Number.NaN, Number.POSITIVE_INFINITY, abschnitte(1, 2, 3)),
      planeBandAblauf(23.333, 10, abschnitte(3.333, 3.333, 3.333)),
    ]
    for (const plan of faelle) {
      expect(JSON.stringify(plan)).not.toMatch(/Infinity|NaN|undefined/)
    }
  })

  it('ist eine reine Funktion: gleiche Eingabe, gleiches Ergebnis', () => {
    const eingabe = [0, 10, abschnitte(3.333, 3.333, 3.333)] as const
    const erst = planeBandAblauf(eingabe[0], eingabe[1], eingabe[2])
    const zweit = planeBandAblauf(eingabe[0], eingabe[1], eingabe[2])
    expect(erst).toEqual(zweit)
  })
})

describe('abschnittsFrames spiegeln die Folge in gleicher Reihenfolge', () => {
  it('die Laenge entspricht abschnitte.length', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(2, 2, 2, 0.01, 2))
    expect(plan.abschnittsFrames).toHaveLength(5)
    expect(planeBandAblauf(0, 10, []).abschnittsFrames).toHaveLength(0)
  })

  it('die Reihenfolge folgt den Abschnitten', () => {
    const plan = planeBandAblauf(0, 10, abschnitte(0.5, 2, 3, 0.01))
    expect(plan.abschnittsFrames).toEqual([
      Math.round(0.5 * fps),
      Math.round(2 * fps),
      Math.round(3 * fps),
      0,
    ])
    expect(plan.abschnittsFrames).toEqual([15, 60, 90, 0])
  })

  it('volleDurchlaeufe zaehlt bei wiederholt nur die vollstaendigen', () => {
    const plan = planeBandAblauf(0, 25, abschnitte(3.333, 3.333, 3.333))
    // 25 s -> 750 Frames; 750 / 300 = 2,5 -> 2 volle, Rest 150.
    expect(plan.verhalten).toBe('wiederholt')
    expect(plan.volleDurchlaeufe).toBe(2)
    expect(plan.restFrames).toBe(150)
    expect(plan.angeschnittenerIndex).toBe(1)
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  const pfad = fileURLToPath(new URL('../../src/renderer/composer/einblendung-vorschau.ts', import.meta.url))
  const quelltext = readFileSync(pfad, 'utf8')

  // Kommentare entfernen - die Regeln gelten dem CODE. Der Dateikopf und die
  // Erklaerungen zitieren den Vertrag („30 fps", „#130"), und das voellig zu Recht.
  // REIHENFOLGE BEACHTEN: erst die Zeilen-, dann die Blockkommentare.
  const code = quelltext.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('die Abschaltzeile aus Zeile 1 ist entfernt', () => {
    expect(quelltext.startsWith('/* eslint-disable')).toBe(false)
    expect(quelltext.startsWith('// GENERIERT aus dem Signaturblock von Issue #130.')).toBe(true)
  })

  it('die Signatur ist woeertlich unveraendert geblieben', () => {
    expect(quelltext).toContain("export type BandVerhalten = 'leer' | 'exakt' | 'wiederholt' | 'abgeschnitten'")
    expect(quelltext).toContain('export function planeBandAblauf')
    expect(quelltext).toContain('trimStartSek: number')
    expect(quelltext).toContain('ReadonlyArray<{ aktionRef: string; dauer: number }>')
  })

  it('die Bildrate kommt aus RENDER_PROFILE.fps, nie als Literal 30', () => {
    expect(code).toContain('RENDER_PROFILE.fps')
    expect(code).not.toMatch(/\b30\b/)
  })

  it('rundet Frames ausschliesslich mit Math.round über RENDER_PROFILE.fps', () => {
    // Jede Multiplikation mit der Bildrate liegt in einem Math.round; weder
    // Math.ceil noch Math.floor tauchen als Fake-Rundung auf.
    expect(code).toMatch(/Math\.round\([^)]*fps\)/)
    expect(code).not.toContain('Math.ceil')
    expect(code).not.toMatch(/Math\.floor\([^)]*fps\)/)
  })

  it('enthaelt weder IPC noch Dateisystem noch den werfenden Rumpf', () => {
    expect(code).not.toContain('window.api')
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toMatch(/\bfrom '(node:)?fs'/)
    expect(quelltext).not.toContain('Rumpf gehoert zu Issue #130')
  })

  it('der Vertrag verlangt keine Ergebnis-Huelle: Rueckgabetyp ist BandAblaufplan', () => {
    expect(code).toContain('): BandAblaufplan {')
    expect(code).not.toContain('Ergebnis<')
  })
})

describe('Gegenproben, die pruefen, dass die Grep-Proben wirklich greifen', () => {
  // Eine Probe ohne Beleg ist keine Probe: Diese Faelschungen muessen DURCHFALLEN.
  // Wuerde eine davon gruen, triefe der Filter ins Leere.
  it('eine eingeschmuggelte Bildrate 30 wird gefunden', () => {
    const gefaelscht = "const fps = 30 // Fake"
    const code = gefaelscht.replace(/\/\/.*$/gm, '')
    expect(code).toMatch(/\b30\b/)
  })

  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    const gefaelscht = "/* eslint-disable @typescript-eslint/no-unused-vars */\n// x"
    expect(gefaelscht.startsWith('/* eslint-disable')).toBe(true)
  })
})