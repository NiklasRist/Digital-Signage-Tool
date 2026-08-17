// Verhaltenstests zu #213 - die frame-gerundete Zeitachse des preview-player.
//
// Alle Zahlen pruefen gegen `RENDER_PROFILE.fps`, nie gegen eine Literal-30 im Test:
//   frameZuSekunden(f) = f / fps
//   sekundenZuFrame(s) = Math.round(s * fps)
//
// Wo die DoD "ein Doppel fuer frameDauer" verlangt, gibt ein Spion die Frame-Zahl
// VOR - die Achse rechnet selbst NUR mit den von `frameDauer` gelieferten Frames
// (ENTSCHIEDEN 2, TK 9.2.6). Eine eigene Multiplikation im Test waere genau die
// zweite Rundungsstelle, die das Issue verbietet.
//
// Diese Suite braucht KEINE Browser-Umgebung: sie importiert nur die reine Rechnung
// und `node:fs`/`node:url` (vitest.config: environment "node").
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import * as gesamtlaenge from '../../src/renderer/composer/gesamtlaenge'
import {
  baueZeitachse,
  findeAbschnitt,
  frameZuSekunden,
  lokalerFrame,
  sekundenZuFrame,
} from '../../src/renderer/preview-player/zeitachse'
import type { Achsenabschnitt, Zeitachse } from '../../src/renderer/preview-player/zeitachse'
import type { Listenelement } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

const fps = RENDER_PROFILE.fps

function video(trimStart: number, trimEnde: number, id = 'v1'): Listenelement {
  return { id, art: 'video', ref: 'asset-v', dauer: null, trimStart, trimEnde, einblendung: null }
}
function segment(dauer: number, id = 's1'): Listenelement {
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
): { code: string; meldung: string; daten?: unknown } {
  if (ergebnis.ok) throw new Error(`Erwartet war ein Fehler, bekommen: ${JSON.stringify(ergebnis)}`)
  return ergebnis.fehler
}

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Eine Achse aus vorgegebenen Frame-Zahlen (Doppel fuer `frameDauer`).
 *
 * Die Elemente selbst sind egal - der Spion ersetzt die Rechnung vollstaendig. Die
 * DoD-Beispiele 300/150/450 brauchen so keinen Umweg ueber Sekunden.
 */
function achseMitFrames(...frames: number[]): Zeitachse {
  const spy = vi.spyOn(gesamtlaenge, 'frameDauer')
  let zaehler = 0
  spy.mockImplementation(() => {
    const f = frames[zaehler]
    zaehler += 1
    if (typeof f !== 'number') {
      return { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'kein Wert' } }
    }
    return { ok: true, wert: f }
  })
  const liste = frames.map((_, i) => segment(1, `e${String(i)}`))
  return wert(baueZeitachse(liste))
}

describe('baueZeitachse - leere Liste', () => {
  it('liefert ok: true mit einer leeren Achse, KEINEN Fehler', () => {
    expect(baueZeitachse([])).toEqual({ ok: true, wert: { abschnitte: [], gesamtFrames: 0, gesamtSekunden: 0 } })
    expect(baueZeitachse([]).ok).toBe(true)
  })
})

describe('baueZeitachse - drei Elemente, die DoD-Achse', () => {
  it('300/150/450 Frames ergeben die Abschnitte [0,300), [300,450), [450,900)', () => {
    const achse = achseMitFrames(300, 150, 450)

    expect(achse.abschnitte.map((a) => a.startFrame)).toEqual([0, 300, 450])
    expect(achse.abschnitte.map((a) => a.endeFrame)).toEqual([300, 450, 900])
    expect(achse.abschnitte.map((a) => a.frames)).toEqual([300, 150, 450])
    expect(achse.gesamtFrames).toBe(900)
    // 900 / 30 - die ganze Zahl ist wichtig: exakt 30 Sekunden, nicht 29,9666...
    expect(achse.gesamtSekunden).toBe(900 / fps)
    expect(achse.gesamtSekunden).toBe(30)
  })
})

describe('Eigenschaften: lueckenlos, indiziert, ganzzahligen Sekunden', () => {
  /** Die Eigenschaften aus der DoD, ueber eine ganze Achse. */
  function pruefeEigenschaften(achse: Zeitachse, liste: readonly Listenelement[]): void {
    expect(achse.abschnitte.length).toBe(liste.length)

    if (achse.abschnitte.length > 0) {
      expect(achse.abschnitte[0]?.startFrame).toBe(0)
    }

    for (let i = 0; i < achse.abschnitte.length; i++) {
      const aktuell = achse.abschnitte[i]!
      // DoD: index entspricht der Position in der uebergebenen Liste.
      expect(aktuell.index).toBe(i)
      expect(aktuell.frames).toBe(aktuell.endeFrame - aktuell.startFrame)
      if (i < achse.abschnitte.length - 1) {
        const naechster = achse.abschnitte[i + 1]!
        // DoD: aneinandergrenzend - endeFrame[i] === startFrame[i+1].
        expect(aktuell.endeFrame).toBe(naechster.startFrame)
      }
    }

    // DoD: gesamtFrames === endeFrame des letzten Abschnitts.
    expect(achse.gesamtFrames).toBe(achse.abschnitte.at(-1)?.endeFrame ?? 0)

    // DoD: gesamtSekunden x fps ist ganzzahlig. Wie in gesamtlaenge.spec (#127):
    // das Gleitkomma-Produkt kann um ein ULP danebenliegen (31/fps*fps === 31 ist
    // false), deshalb die von dort uebernommene tragfaehige Formulierung.
    expect(Math.round(achse.gesamtSekunden * fps)).toBe(achse.gesamtFrames)
    expect(achse.gesamtSekunden).toBe(achse.gesamtFrames / fps)
  }

  it('fuer mehrere Listen mit echten frameDauer-Werten', () => {
    const listen = [
      [segment(4.71, 'a')],
      [video(1.02, 3.04, 'v'), segment(4.71, 's')],
      [
        video(2.51, 10.49, 'v1'),
        segment(10.5, 's1'),
        video(0.5, 1.0, 'v2'),
        // krumme Werte: 0.7 s sind exakt 21 Frames, 0.04 s sind 1.2 -> 1 Frame.
        segment(0.7, 's2'),
        segment(0.04, 's3'),
      ],
    ]
    for (const liste of listen) {
      // gesamtFrames deshalb auch fuer die letzte Liste nicht glatt laufend zu fps.
      const achse = wert(baueZeitachse(liste))
      pruefeEigenschaften(achse, liste)
    }
  })

  it('auch fuer die Spion-Achse der DoD', () => {
    // Die Gesamtlauefe ueber echte frameDauer-Werte sind Luecken-NACHWEIS; die
    // DoD nennt die Lueckenlosigkeit ausdruecklich als Eigenschafts-Test "fuer jede
    // gepruefte Liste" - hier also die Achse aus dem Doppel, auf dieselbe Art.
    const achse = achseMitFrames(137, 89, 15, 400)
    const liste = achse.abschnitte.map((a) => segment(1, a.elementId))
    pruefeEigenschaften(achse, liste)
  })
})

describe('baueZeitachse - Fehlerpfad: GANZE Achse scheitert, durchgereicht', () => {
  it('bricht beim ZWEITEN Element ab: genau dessen Code/Meldung, drittes nie aufgerufen', () => {
    const spy = vi.spyOn(gesamtlaenge, 'frameDauer')
    const kaputterFehler: Ergebnis<number> = {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Element kaputt-2: die Dauer eines "segment"-Elements muss eine endliche Zahl groesser als 0 sein, vorgefunden: null.',
        daten: { grund: 'probe' },
      },
    }
    const aufrufe: string[] = []
    spy.mockImplementation((element) => {
      const id = String((element as { id?: unknown }).id)
      aufrufe.push(id)
      if (id === 'kaputt-2') return kaputterFehler
      return { ok: true, wert: 300 }
    })

    const ergebnis = baueZeitachse([segment(1, 'gut-1'), segment(1, 'kaputt-2'), segment(1, 'gut-3')])

    expect(ergebnis.ok).toBe(false)
    // Der dritte Aufruf ruehrt sich nicht - kein Element wird ausgelassen oder
    // uebersprungen, es liegt keinerlei Teil-Achse vor.
    expect(aufrufe).toEqual(['gut-1', 'kaputt-2'])

    const durchgereicht = fehler(ergebnis)
    // Die DoD fordert "genau dessen Code und Meldung", unveraendert durchgereicht.
    // Die Implementierung reicht das Ergebnis-Objekt von `frameDauer` referenzgleich
    // weiter; ein neues Wrapper-Objekt ist nicht gefordert.
    expect(ergebnis).toBe(kaputterFehler)
    expect((ergebnis as { fehler: unknown }).fehler).toBe(kaputterFehler.fehler)
    expect(durchgereicht.code).toBe('ungueltige_eingabe')
    expect(durchgereicht.meldung).toBe(
      'Element kaputt-2: die Dauer eines "segment"-Elements muss eine endliche Zahl groesser als 0 sein, vorgefunden: null.',
    )
    expect(durchgereicht.daten).toEqual({ grund: 'probe' })
  })

  it('reicht den Fehler des ERSTEN gescheiterten Elements unveraendert durch', () => {
    const spy = vi.spyOn(gesamtlaenge, 'frameDauer')
    const kaputt: Ergebnis<number> = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Element kaputt-1: kaputt.', daten: undefined },
    }
    spy.mockImplementation((element) => {
      const id = String((element as { id?: unknown }).id)
      if (id === 'kaputt-1') return kaputt
      return { ok: true, wert: 1 }
    })

    const ergebnis = baueZeitachse([segment(1, 'kaputt-1'), segment(1, 'gut-2')])
    const durchgereicht = fehler(ergebnis)
    expect(durchgereicht.code).toBe('nicht_gefunden')
    expect(durchgereicht.meldung).toBe('Element kaputt-1: kaputt.')
  })
})

describe('findeAbschnitt', () => {
  it('halboffen an der DoD-Grenze: 299 -> erster, 300 -> zweiter, 900/-1 -> null', () => {
    const achse = achseMitFrames(300, 150, 450)

    expect(findeAbschnitt(achse, 299)?.index).toBe(0)
    expect(findeAbschnitt(achse, 300)?.index).toBe(1)
    expect(findeAbschnitt(achse, 900)).toBeNull()
    expect(findeAbschnitt(achse, -1)).toBeNull()

    // die anderen Grenzen derselben Achse
    expect(findeAbschnitt(achse, 0)?.index).toBe(0)
    expect(findeAbschnitt(achse, 449)?.index).toBe(1)
    expect(findeAbschnitt(achse, 450)?.index).toBe(2)
    expect(findeAbschnitt(achse, 899)?.index).toBe(2)
  })

  it('NaN ergibt null, ohne zu werfen - kein Klemmen auf den ersten Abschnitt', () => {
    const achse = wert(baueZeitachse([segment(10), segment(10)]))
    expect(findeAbschnitt(achse, Number.NaN)).toBeNull()
  })

  it('leere Achse ergibt fuer jede Position null', () => {
    const achse = wert(baueZeitachse([]))
    expect(findeAbschnitt(achse, 0)).toBeNull()
    expect(findeAbschnitt(achse, -1)).toBeNull()
    expect(findeAbschnitt(achse, Number.NaN)).toBeNull()
  })
})

describe('lokalerFrame', () => {
  it('liefert 0 am Abschnittsanfang und frames - 1 am letzten Frame', () => {
    const achse = wert(baueZeitachse([segment(10), segment(5)]))
    const erster: Achsenabschnitt = achse.abschnitte[0]!
    const zweiter: Achsenabschnitt = achse.abschnitte[1]!
    expect(erster.frames).toBe(300)
    expect(lokalerFrame(erster, 0)).toBe(0)
    expect(lokalerFrame(erster, 299)).toBe(299)
    expect(lokalerFrame(zweiter, 300)).toBe(0)
    expect(lokalerFrame(zweiter, 449)).toBe(149)
  })

  it('klemmt nicht ausserhalb des Abschnitts - das Urteil faellt der Aufrufer', () => {
    const achse = wert(baueZeitachse([segment(10)]))
    const erster = achse.abschnitte[0]!
    expect(lokalerFrame(erster, -5)).toBe(-5)
    expect(lokalerFrame(erster, 1000)).toBe(1000)
  })
})

describe('frameZuSekunden und sekundenZuFrame - die Rundung', () => {
  it('liefert die vier DoD-Werte', () => {
    expect(frameZuSekunden(45)).toBe(1.5)
    expect(sekundenZuFrame(1.5)).toBe(45)
    expect(sekundenZuFrame(1.51)).toBe(45)
    expect(sekundenZuFrame(1.517)).toBe(46)
  })

  it('frameZuSekunden teilt, sekundenZuFrame rundet auf das 30-fps-Raster', () => {
    expect(frameZuSekunden(0)).toBe(0)
    expect(frameZuSekunden(fps)).toBe(1)
    expect(frameZuSekunden(1)).toBe(1 / fps)
    expect(sekundenZuFrame(1 / fps)).toBe(1)
    // knapp unter/ueber einer halben Rahmen-Einheit
    expect(sekundenZuFrame(0.016)).toBe(0) // 0,48 -> 0
    expect(sekundenZuFrame(0.017)).toBe(1) // 0,51 -> 1
  })

  it('NaN und unendliche Eingaben ergeben das Ergebnis von Math.round - kein throw, kein Ersatz', () => {
    const werte = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
    for (const w of werte) {
      if (Number.isNaN(Math.round(w))) {
        expect(Number.isNaN(sekundenZuFrame(w))).toBe(true)
      } else {
        expect(sekundenZuFrame(w)).toBe(Math.round(w))
      }
    }
    expect(() => sekundenZuFrame(Number.NaN)).not.toThrow()
    expect(() => sekundenZuFrame(Number.POSITIVE_INFINITY)).not.toThrow()
    expect(sekundenZuFrame(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('baueZeitachse - Aufrufzahlen mit Spion', () => {
  it('ruft frameDauer fuer jedes Element GENAU EINMAL auf', () => {
    const spy = vi.spyOn(gesamtlaenge, 'frameDauer')
    const liste = [video(1.02, 3.04, 'v'), segment(4.71, 's'), video(2.51, 10.49, 'v2')]

    wert(baueZeitachse(liste))

    expect(spy).toHaveBeenCalledTimes(liste.length)
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('laesst die uebergebene Liste unveraendert', () => {
    const liste = [video(1.02, 3.04, 'v'), segment(4.71, 's'), video(2.51, 10.49, 'v2')]
    const kopie = liste.map((e) => ({ ...e }))

    wert(baueZeitachse(liste))

    expect(liste).toEqual(kopie)
  })
})

describe('Grep-Proben aus der DoD', () => {
  const pfad = fileURLToPath(new URL('../../src/renderer/preview-player/zeitachse.ts', import.meta.url))
  const quelltext = readFileSync(pfad, 'utf8')
  // Zuerst die Zeilen-, dann die Blockkommentare - wie in gesamtlaenge.spec (#127):
  // Der Dateikopf zitiert "src/main/**«, was eine Blockkommentar-Erkennung stoert.
  const code = quelltext.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('das Entfernen der Kommentare hat den Code nicht mit weggeschnitten', () => {
    expect(code).toContain('export function baueZeitachse')
    expect(code).toContain('export function findeAbschnitt')
    expect(code).toContain('export function lokalerFrame')
    expect(code).toContain('export function frameZuSekunden')
    expect(code).toContain('export function sekundenZuFrame')
    expect(code).toContain('Math.round(sekunden * RENDER_PROFILE.fps)')
  })

  it('enthält GENAU EIN Math.round - die einzige Rundungsstelle dieser Datei', () => {
    const treffer = code.match(/Math\.round/g)
    expect(treffer).toHaveLength(1)
  })

  it('keine zweite Rundungsform: kein floor, kein ceil, kein toFixed', () => {
    expect(code).not.toMatch(/Math\.floor/)
    expect(code).not.toMatch(/Math\.ceil/)
    expect(code).not.toMatch(/toFixed/)
  })

  it('liest weder Element-Dauer noch Trim noch Einblendung noch Medien', () => {
    expect(code).not.toMatch(/\.dauer/)
    expect(code).not.toContain('trimStart')
    expect(code).not.toContain('trimEnde')
    expect(code.toLowerCase()).not.toContain('einblendung')
  })

  it('kein IPC, kein JSX, kein react, kein window.api', () => {
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toContain('abonniere')
    expect(code).not.toContain('window.api')
    expect(code).not.toMatch(/<\/[A-Za-z]/)
    expect(code).not.toContain('react')
  })
})