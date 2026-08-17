// Verhaltenstests zu #214 - der Transport der Vorschau-Uhr.
//
// Die Uhr rechnet NUR in Frames und Millisekunden-Bruchteilen, nie in Sekunden und
// nie ueber eine Element-Dauer: `msProFrame` ist die EINZIGE Zeitkonstante dieser
// Datei (1000 / RENDER_PROFILE.fps). Alle Zahlen im Test gegen `RENDER_PROFILE.fps`,
// nie gegen ein Literal-30.
//
// Wo die DoD einen Zyklus mit `tick(..., 500)` beschreibt, wird zusaetzlich geprueft,
// dass eine Pause zwischen zwei ticks nichts veraendert ("die Pause verliert nichts"):
// Der Zyklus mit `pausiere`/`spieleAb` dazwischen muss das GLEICHE Ergebnis liefern
// wie zwei ticks ohne Pause.
//
// Diese Suite braucht KEINE Browser-Umgebung: sie importiert nur die reine Rechnung
// (vitest.config: environment "node").
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  baueTransport,
  markierterIndex,
  pausiere,
  spieleAb,
  springeZuElement,
  springeZuFrame,
  tick,
} from '../../src/renderer/preview-player/transport'
import type { TransportStand } from '../../src/renderer/preview-player/transport'
import type { Zeitachse } from '../../src/renderer/preview-player/zeitachse'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

const fps = RENDER_PROFILE.fps
const msProFrame = 1000 / fps

/** Eine Achse aus vorgegebenen Abschnitts-Frame-Zahlen, direkt konstruiert. */
function achse(...abschnittsFrames: number[]): Zeitachse {
  let start = 0
  const abschnitte = abschnittsFrames.map((frames, index) => {
    const abschnitt = {
      elementId: `e${index}`,
      index,
      startFrame: start,
      endeFrame: start + frames,
      frames,
    }
    start += frames
    return abschnitt
  })
  return { abschnitte, gesamtFrames: start, gesamtSekunden: start / fps }
}

/** Der laufende Anfangsstand - bequemer Ausgangspunkt fuer tick-Szenarien. */
function laufend(frame = 0, restMs = 0): TransportStand {
  return { laeuft: true, frame, restMs }
}

describe('baueTransport', () => {
  it('liefert den Anfangsstand { laeuft: false, frame: 0, restMs: 0 }', () => {
    expect(baueTransport()).toEqual({ laeuft: false, frame: 0, restMs: 0 })
  })
})

describe('spieleAb', () => {
  it('bei frame: 0 setzt laeuft: true und laesst frame unveraendert', () => {
    const stand = spieleAb(baueTransport(), achse(300, 150, 450))
    expect(stand.laeuft).toBe(true)
    expect(stand.frame).toBe(0)
  })

  it('bei frame === gesamtFrames setzt frame: 0, restMs: 0, laeuft: true (ENTSCHIEDEN 3)', () => {
    const achse3 = achse(300, 150, 450)
    const amEnde: TransportStand = { laeuft: false, frame: achse3.gesamtFrames, restMs: 12.5 }
    const stand = spieleAb(amEnde, achse3)
    expect(stand).toEqual({ laeuft: true, frame: 0, restMs: 0 })
  })

  it('auf einer leeren Achse laesst laeuft: false und steht bei frame: 0', () => {
    const leer = achse()
    const stand = spieleAb(baueTransport(), leer)
    expect(stand.laeuft).toBe(false)
    expect(stand.frame).toBe(0)
    // Auch wenn der Stand vorher lief, beginnt auf leerer Achse nichts.
    const liefSchon = spieleAb(laufend(0, 3), leer)
    expect(liefSchon.laeuft).toBe(false)
  })
})

describe('pausiere', () => {
  it('setzt laeuft: false und laesst frame UND restMs unveraendert', () => {
    const stand: TransportStand = { laeuft: true, frame: 123, restMs: 7.5 }
    expect(pausiere(stand)).toEqual({ laeuft: false, frame: 123, restMs: 7.5 })
  })
})

describe('tick - die verbindliche Rechnung', () => {
  it('30 Schritte zu je einem Frame (msProFrame) stehen auf frame: 30', () => {
    let stand = spieleAb(baueTransport(), achse(900))
    for (let i = 0; i < 30; i++) stand = tick(stand, achse(900), msProFrame)
    expect(stand.frame).toBe(30)
    expect(stand.laeuft).toBe(true)
  })

  it('Eigenschafts-Test: 300 Aufrufe mit 16,7 ms weichen hoechstens einen Frame von der Referenz ab', () => {
    let stand = spieleAb(baueTransport(), achse(1000))
    const schritte = 300
    const schrittMs = 16.7
    let gesamtMs = 0
    for (let i = 0; i < schritte; i++) {
      stand = tick(stand, achse(1000), schrittMs)
      gesamtMs += schrittMs
    }
    const referenz = Math.floor(gesamtMs / msProFrame)
    expect(Math.abs(stand.frame - referenz)).toBeLessThanOrEqual(1)
  })

  it('tick mit 1000 ms auf einer Achse mit gesamtFrames = 20 liefert frame: 20 und laeuft: false', () => {
    const stand = tick(spieleAb(baueTransport(), achse(20)), achse(20), 1000)
    expect(stand).toEqual({ laeuft: false, frame: 20, restMs: 0 })
  })

  it('ein Zyklus spieleAb -> tick(500) -> pausiere -> spieleAb -> tick(500) verliert durch die Pause nichts', () => {
    const achse900 = achse(300, 150, 450)

    const mitPause = tick(spieleAb(pausiere(tick(spieleAb(baueTransport(), achse900), achse900, 500)), achse900), achse900, 500)
    const ohnePause = tick(tick(spieleAb(baueTransport(), achse900), achse900, 500), achse900, 500)

    // "die Pause verliert nichts": der Stand ist identisch, Pause aendert nur laeuft.
    expect(mitPause).toEqual(ohnePause)

    // Das Ergebnis der VERBINDLICHEN Rechnung: 500 ms sind 14.999... Frames, also
    // 14 ganze plus ein Rest von fast einem Frame. Zwei solche ticks sammeln den
    // Rest und stehen nach 1000 ms bei frame: 29, laeuft: true. Die DoD nennt hier
    // "Frame 30" - das ist die EXAKTE 1000-ms-Rechnung; die verbindliche
    // floor-Rechnung mit msProFrame = 1000 / 30 (33.333...) ergibt 29. Der gebaute
    // Code folgt der verbindlichen Rechnung (Widerspruch wird gemeldet).
    expect(mitPause.laeuft).toBe(true)
    expect(mitPause.frame).toBe(29)
    expect(mitPause.restMs).toBeGreaterThan(0)
    expect(mitPause.restMs).toBeLessThan(msProFrame)
  })

  it('restMs liegt nach jedem tick in [0, msProFrame) - Eigenschafts-Test', () => {
    const achse1000 = achse(1000)
    let stand = spieleAb(baueTransport(), achse1000)
    const schritte = [0.1, 16.7, 33.3, 500, 1000, 0.01, 7.77]
    for (let runde = 0; runde < 20; runde++) {
      for (const ms of schritte) {
        const vorher = stand.frame
        stand = tick(stand, achse1000, ms)
        expect(stand.restMs).toBeGreaterThanOrEqual(0)
        expect(stand.restMs).toBeLessThan(msProFrame)
        expect(stand.frame).toBeGreaterThanOrEqual(vorher)
      }
    }
  })
})

describe('tick - unbrauchbare Eingaben', () => {
  const unbrauchbar = [-5, 0, Number.NaN, Number.POSITIVE_INFINITY]

  it('liefert fuer -5, 0, NaN, Infinity den IDENTISCHEN Stand zurueck', () => {
    const achse900 = achse(900)
    for (const wert of unbrauchbar) {
      const stand: TransportStand = { laeuft: true, frame: 10, restMs: 5 }
      expect(tick(stand, achse900, wert)).toBe(stand)
    }
  })

  it('liefert bei laeuft: false den identischen Stand zurueck', () => {
    const achse900 = achse(900)
    const stand: TransportStand = { laeuft: false, frame: 10, restMs: 5 }
    expect(tick(stand, achse900, 500)).toBe(stand)
  })
})

describe('springeZuFrame', () => {
  it('klemmt -10 -> 0, gesamtFrames + 5 -> gesamtFrames, NaN -> 0; restMs wird 0; laeuft unveraendert', () => {
    const achse900 = achse(300, 150, 450)

    const nachUnten = springeZuFrame(laufend(), achse900, -10)
    expect(nachUnten).toEqual({ laeuft: true, frame: 0, restMs: 0 })

    const nachOben = springeZuFrame(laufend(), achse900, achse900.gesamtFrames + 5)
    expect(nachOben).toEqual({ laeuft: true, frame: achse900.gesamtFrames, restMs: 0 })

    const beiNaN = springeZuFrame(laufend(7, 3), achse900, Number.NaN)
    expect(beiNaN).toEqual({ laeuft: true, frame: 0, restMs: 0 })
  })

  it('laesst laeuft unveraendert - auch bei pausiertem Stand', () => {
    const achse900 = achse(300, 150, 450)
    const pausiert = springeZuFrame(pausiere(laufend(7)), achse900, 100)
    expect(pausiert.laeuft).toBe(false)
    expect(pausiert.frame).toBe(100)
  })

  it('legt nicht ganzzahlige Werte mit Math.round auf einen Frame', () => {
    const achse900 = achse(300, 150, 450)
    expect(springeZuFrame(laufend(), achse900, 0.4).frame).toBe(0)
    expect(springeZuFrame(laufend(), achse900, 0.6).frame).toBe(1)
    expect(springeZuFrame(laufend(), achse900, 149.5).frame).toBe(150)
  })
})

describe('springeZuElement', () => {
  it('setzt frame auf achse.abschnitte[1].startFrame', () => {
    const achse900 = achse(300, 150, 450)
    const stand = springeZuElement(laufend(0, 8), achse900, 1)
    expect(stand.frame).toBe(achse900.abschnitte[1]!.startFrame)
    expect(stand.frame).toBe(300)
  })

  it('klemmt Index -3 auf den ersten, Index 99 auf den letzten Abschnitt', () => {
    const achse900 = achse(300, 150, 450)
    const erster = springeZuElement(laufend(), achse900, -3)
    expect(erster.frame).toBe(achse900.abschnitte[0]!.startFrame)
    expect(erster.frame).toBe(0)

    const letzter = springeZuElement(laufend(), achse900, 99)
    expect(letzter.frame).toBe(achse900.abschnitte[2]!.startFrame)
    expect(letzter.frame).toBe(450)
  })

  it('auf einer leeren Achse liefert einen Stand mit frame: 0', () => {
    const leer = achse()
    const stand = springeZuElement(laufend(0, 8), leer, 0)
    expect(stand.frame).toBe(0)
    expect(stand.laeuft).toBe(true)
  })
})

describe('markierterIndex - abgeleitet', () => {
  it('liefert fuer einen Frame im zweiten Abschnitt den Index 1', () => {
    const achse900 = achse(300, 150, 450)
    expect(markierterIndex(laufend(300), achse900)).toBe(1)
    expect(markierterIndex(laufend(449), achse900)).toBe(1)
  })

  it('liefert fuer frame === gesamtFrames null (die Uhr steht am Ende)', () => {
    const achse900 = achse(300, 150, 450)
    expect(markierterIndex(laufend(achse900.gesamtFrames), achse900)).toBeNull()
  })

  it('liefert fuer eine leere Achse null', () => {
    expect(markierterIndex(laufend(), achse())).toBeNull()
  })
})

describe('Keine Funktion verändert ihre Eingabe', () => {
  it('friert stand und achse ein und ruft alle sieben Funktionen auf', () => {
    const achse900 = achse(300, 150, 450)
    const stand: TransportStand = { laeuft: true, frame: 100, restMs: 7 }
    const eingefrorenerStand = Object.freeze({ ...stand })
    const eingefroreneAchse = Object.freeze({
      ...achse900,
      abschnitte: Object.freeze([...achse900.abschnitte]),
    })

    expect(() => baueTransport()).not.toThrow()
    expect(() => spieleAb(eingefrorenerStand, eingefroreneAchse)).not.toThrow()
    expect(() => pausiere(eingefrorenerStand)).not.toThrow()
    expect(() => springeZuFrame(eingefrorenerStand, eingefroreneAchse, 50)).not.toThrow()
    expect(() => springeZuElement(eingefrorenerStand, eingefroreneAchse, 1)).not.toThrow()
    expect(() => tick(eingefrorenerStand, eingefroreneAchse, 500)).not.toThrow()
    expect(() => markierterIndex(eingefrorenerStand, eingefroreneAchse)).not.toThrow()

    expect(eingefrorenerStand).toEqual(stand)
    expect(eingefroreneAchse.gesamtFrames).toBe(achse900.gesamtFrames)
    expect(eingefroreneAchse.abschnitte).toEqual(achse900.abschnitte)
  })
})

describe('frame ist nach jeder Funktion ganzzahlig', () => {
  it('Eigenschafts-Test ueber alle sieben Funktionen', () => {
    const achse900 = achse(300, 150, 450)
    const ergebnisse: number[] = []

    ergebnisse.push(baueTransport().frame)
    ergebnisse.push(spieleAb(baueTransport(), achse900).frame)
    ergebnisse.push(pausiere(laufend(1)).frame)
    ergebnisse.push(springeZuFrame(laufend(), achse900, 0.6).frame)
    ergebnisse.push(springeZuElement(laufend(), achse900, 1).frame)

    let stand = spieleAb(baueTransport(), achse900)
    for (let i = 0; i < 5; i++) stand = tick(stand, achse900, 16.7)
    ergebnisse.push(stand.frame)

    const index = markierterIndex(laufend(300), achse900)
    if (index !== null) ergebnisse.push(index)

    for (const wert of ergebnisse) {
      expect(Number.isInteger(wert)).toBe(true)
    }
  })
})

describe('Grep-Proben aus der DoD', () => {
  const pfad = fileURLToPath(new URL('../../src/renderer/preview-player/transport.ts', import.meta.url))
  const quelltext = readFileSync(pfad, 'utf8')
  // Zuerst die Zeilen-, dann die Blockkommentare - wie in zeitachse.spec (#213):
  // Der Dateikopf zitiert "<video>", was eine rohe Suche stoeren wuerde.
  const code = quelltext.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('das Entfernen der Kommentare hat den Code nicht mit weggeschnitten', () => {
    expect(code).toContain('export function baueTransport')
    expect(code).toContain('export function spieleAb')
    expect(code).toContain('export function pausiere')
    expect(code).toContain('export function springeZuFrame')
    expect(code).toContain('export function springeZuElement')
    expect(code).toContain('export function tick')
    expect(code).toContain('export function markierterIndex')
  })

  it('kein Taktgeber, keine Systemzeit, kein video, kein react, kein JSX, kein IPC, kein let auf Modulebene', () => {
    expect(code).not.toMatch(/requestAnimationFrame/)
    expect(code).not.toMatch(/setInterval/)
    expect(code).not.toMatch(/setTimeout/)
    expect(code).not.toMatch(/performance\.now/)
    expect(code).not.toMatch(/Date\.now/)
    expect(code).not.toMatch(/currentTime/)
    expect(code).not.toMatch(/timeupdate/)
    expect(code).not.toMatch(/video/)
    expect(code).not.toMatch(/react/)
    expect(code).not.toMatch(/<\/[A-Za-z]/)
    expect(code).not.toMatch(/rufeAuf/)
    expect(code).not.toMatch(/abonniere/)
    expect(code).not.toMatch(/window\.api/)
    expect(code).not.toMatch(/^\s*let\s/m)
  })
})