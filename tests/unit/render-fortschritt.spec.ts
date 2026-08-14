import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  aufRenderFortschritt,
  erzeugeFortschrittSender,
} from '../../src/main/render-service/fortschritt'

import type { RenderProgress } from '../../src/shared/contracts/render-result'

// Verhaltenstest zu #178 (Fortschritts-Ereignisse bilden und senden).
//
// Die Zeit ist kuenstlich (vi.useFakeTimers faelscht auch Date.now): Die Drosselung misst
// 250 ms, echtes Warten machte den Lauf langsam und wackelig.
//
// Die Hoerer-Liste ist MODULWEIT - jeder Test meldet ueber `merkeHoerer` an und wird in
// afterEach wieder abgemeldet, sonst erbte der naechste Test fremde Hoerer.

const MIND_ABSTAND_MS = 250

const abmelder: Array<() => void> = []

function merkeHoerer(hoerer: (fortschritt: RenderProgress) => void): () => void {
  const abmelden = aufRenderFortschritt(hoerer)
  abmelder.push(abmelden)
  return abmelden
}

/** Ein Sender mit Sammelkorb fuer den Rueckruf aus #68. */
function sender(elementAnzahl: number, renderId = 'r-1') {
  const anAuftrag: RenderProgress[] = []
  return {
    anAuftrag,
    s: erzeugeFortschrittSender(elementAnzahl === 0 ? 'r-leer' : renderId, elementAnzahl, (e) => {
      anAuftrag.push(e)
    }),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})

afterEach(() => {
  while (abmelder.length > 0) abmelder.pop()?.()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('erzeugeFortschrittSender - Nutzlast', () => {
  it('schreibt renderId und die Elementfelder in jedes Ereignis', () => {
    const { s, anAuftrag } = sender(3, 'lauf-42')

    s.starteElement(0, 'el-a')

    expect(anAuftrag).toEqual([
      {
        renderId: 'lauf-42',
        phase: 'normalisieren',
        elementIndex: 0,
        elementAnzahl: 3,
        elementId: 'el-a',
        prozent: 0,
      },
    ])
  })

  it('setzt in Phase verketten elementIndex, elementAnzahl und elementId auf null', () => {
    const { s, anAuftrag } = sender(3)

    s.starteElement(0, 'el-a')
    s.starteVerketten()

    expect(anAuftrag[1]).toEqual({
      renderId: 'r-1',
      phase: 'verketten',
      elementIndex: null,
      elementAnzahl: null,
      elementId: null,
      prozent: 95,
    })
  })

  it('rechnet 95 x (k + anteil) / n und bleibt an der Elementgrenze stehen, statt zu springen', () => {
    const { s, anAuftrag } = sender(3)

    s.starteElement(0, 'a')          // 95 x 0/3      = 0
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(0.5)               // 95 x 0,5/3    = 15,83 -> 16
    s.beendeElement(0)               // 95 x 1/3      = 31,67 -> 32
    s.starteElement(1, 'b')          // 95 x 1/3      = 31,67 -> 32  (derselbe Wert!)
    s.beendeElement(1)               // 95 x 2/3      = 63,33 -> 63
    s.starteElement(2, 'c')          // 63
    s.beendeElement(2)               // 95 x 3/3      = 95

    expect(anAuftrag.map((e) => e.prozent)).toEqual([0, 16, 32, 32, 63, 63, 95])
  })

  it('meldet nur ganzzahlige Werte in 0-100 und erreicht nie 100', () => {
    const { s, anAuftrag } = sender(7)

    for (let k = 0; k < 7; k += 1) {
      s.starteElement(k, `el-${k}`)
      vi.advanceTimersByTime(MIND_ABSTAND_MS)
      s.meldeAnteil(0.5)
      s.beendeElement(k)
    }
    s.starteVerketten()

    expect(anAuftrag.length).toBe(22)
    for (const ereignis of anAuftrag) {
      expect(Number.isInteger(ereignis.prozent)).toBe(true)
      expect(ereignis.prozent).toBeGreaterThanOrEqual(0)
      // Die schaerfere Schranke: nicht nur <= 100, sondern NIE 100.
      expect(ereignis.prozent).toBeLessThan(100)
    }
    expect(Math.max(...anAuftrag.map((e) => e.prozent))).toBe(95)
  })

  it('klemmt anteilImElement auf 0..1 fest, statt darueber hinauszurechnen', () => {
    const { s, anAuftrag } = sender(4)

    s.starteElement(1, 'b')                    // 95 x 1/4 = 23,75 -> 24
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(5)                           // wie 1: 95 x 2/4 = 47,5 -> 48
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(-3)                          // wie 0: 24
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(Number.NaN)                  // wie 0: 24

    expect(anAuftrag.map((e) => e.prozent)).toEqual([24, 48, 24, 24])
  })
})

describe('erzeugeFortschrittSender - Drosselung', () => {
  it('macht aus zwei meldeAnteil-Aufrufen innerhalb von 250 ms ein Ereignis', () => {
    const { s, anAuftrag } = sender(2)

    s.starteElement(0, 'a')
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(0.2)
    vi.advanceTimersByTime(MIND_ABSTAND_MS - 1)
    s.meldeAnteil(0.4)

    expect(anAuftrag.length).toBe(2)

    // Gegenprobe: eine Millisekunde spaeter geht derselbe Aufruf durch.
    vi.advanceTimersByTime(1)
    s.meldeAnteil(0.4)
    expect(anAuftrag.length).toBe(3)
  })

  it('drosselt die Grenz-Ereignisse nie, auch nicht ohne jeden Zeitfortschritt', () => {
    const { s, anAuftrag } = sender(2)

    s.starteElement(0, 'a')
    s.beendeElement(0)
    s.starteElement(1, 'b')
    s.beendeElement(1)
    s.starteVerketten()

    expect(anAuftrag.length).toBe(5)
  })

  it('setzt mit einem Grenz-Ereignis das Drosselfenster zurueck', () => {
    const { s, anAuftrag } = sender(2)

    vi.advanceTimersByTime(1000)
    s.starteElement(0, 'a')          // Grenze: geht durch und setzt das Fenster
    s.meldeAnteil(0.5)               // 0 ms danach -> gedrosselt

    expect(anAuftrag.length).toBe(1)
  })
})

describe('erzeugeFortschrittSender - Grenzfaelle der Eingaben', () => {
  it('verwirft Ereignisse mit einem Index ausserhalb 0 <= k < n, ohne zu werfen', () => {
    const { s, anAuftrag } = sender(3)

    expect(() => {
      s.starteElement(3, 'zu-gross')
      s.starteElement(-1, 'negativ')
      s.starteElement(1.5, 'krumm')
      s.beendeElement(99)
    }).not.toThrow()

    expect(anAuftrag).toEqual([])
  })

  it('verwirft meldeAnteil ohne laufendes Element - vorher, nach dem Ende und beim Verketten', () => {
    const { s, anAuftrag } = sender(2)

    s.meldeAnteil(0.5)               // vor dem ersten starteElement
    s.starteElement(0, 'a')
    s.beendeElement(0)
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(0.3)               // Nachzuegler aus dem beendeten Prozess - liefe rueckwaerts
    s.starteVerketten()
    vi.advanceTimersByTime(MIND_ABSTAND_MS)
    s.meldeAnteil(0.9)               // in der Phase verketten

    expect(anAuftrag.map((e) => e.prozent)).toEqual([0, 48, 95])
  })

  it('meldet bei elementAnzahl 0 kein einziges Normalisier-Ereignis', () => {
    const { s, anAuftrag } = sender(0)

    s.starteElement(0, 'a')
    s.meldeAnteil(0.5)
    s.beendeElement(0)

    expect(anAuftrag).toEqual([])

    // Und keine Division durch 0: das Verketten meldet weiterhin sauber 95.
    s.starteVerketten()
    expect(anAuftrag[0]?.prozent).toBe(95)
  })

  it('nennt beim Ende nur die Kennung des begonnenen Elements', () => {
    const { s, anAuftrag } = sender(3)

    s.starteElement(0, 'a')
    s.beendeElement(1)               // gueltiger Index, aber ein anderes Element

    expect(anAuftrag[1]?.elementId).toBeNull()
  })
})

describe('erzeugeFortschrittSender - schliesse', () => {
  it('laesst nach schliesse() keinen der fuenf Aufrufe mehr ein Ereignis erzeugen', () => {
    const { s, anAuftrag } = sender(3)
    const gehoert: RenderProgress[] = []
    merkeHoerer((e) => gehoert.push(e))

    s.starteElement(0, 'a')
    expect(anAuftrag.length).toBe(1)
    expect(gehoert.length).toBe(1)

    s.schliesse()
    vi.advanceTimersByTime(10_000)
    s.starteElement(1, 'b')
    s.meldeAnteil(0.5)
    s.beendeElement(1)
    s.starteVerketten()
    s.schliesse()

    expect(anAuftrag.length).toBe(1)
    expect(gehoert.length).toBe(1)
  })

  it('ist idempotent und wirft beim zweiten Aufruf nicht', () => {
    const { s } = sender(1)

    expect(() => {
      s.schliesse()
      s.schliesse()
    }).not.toThrow()
  })
})

describe('aufRenderFortschritt', () => {
  it('beliefert alle angemeldeten Hoerer - anAuftrag zuerst, dann in Anmeldereihenfolge', () => {
    const reihenfolge: string[] = []
    const s = erzeugeFortschrittSender('r-1', 1, () => reihenfolge.push('auftrag'))
    merkeHoerer(() => reihenfolge.push('erster'))
    merkeHoerer(() => reihenfolge.push('zweiter'))

    s.starteElement(0, 'a')

    expect(reihenfolge).toEqual(['auftrag', 'erster', 'zweiter'])
  })

  it('stellt dem abgemeldeten Hoerer nichts mehr zu, dem uebrigen weiterhin', () => {
    const a: RenderProgress[] = []
    const b: RenderProgress[] = []
    const abmeldenA = merkeHoerer((e) => a.push(e))
    merkeHoerer((e) => b.push(e))
    const { s } = sender(2)

    s.starteElement(0, 'x')
    abmeldenA()
    s.beendeElement(0)

    expect(a.length).toBe(1)
    expect(b.length).toBe(2)
  })

  it('meldet beim zweiten Aufruf der Abmelde-Funktion keinen fremden Hoerer ab', () => {
    const a: RenderProgress[] = []
    const b: RenderProgress[] = []
    const abmeldenA = merkeHoerer((e) => a.push(e))
    abmeldenA()
    merkeHoerer((e) => b.push(e))
    abmeldenA()                       // zweiter Aufruf - darf B nicht treffen

    const { s } = sender(1)
    s.starteElement(0, 'x')

    expect(a).toEqual([])
    expect(b.length).toBe(1)
  })

  it('behandelt zwei Anmeldungen DERSELBEN Funktion als zwei Hoerer', () => {
    // Gegenprobe zum naheliegenden `Set<Hoerer>`: Jenes haelt die Funktion nur einmal, die
    // erste Abmeldung naehme dem zweiten Anmelder lautlos seine Meldungen weg.
    const gehoert: RenderProgress[] = []
    const hoerer = (e: RenderProgress): void => {
      gehoert.push(e)
    }
    const abmeldenErste = merkeHoerer(hoerer)
    merkeHoerer(hoerer)
    const { s } = sender(1)

    s.starteElement(0, 'x')
    expect(gehoert.length).toBe(2)

    abmeldenErste()
    s.beendeElement(0)
    expect(gehoert.length).toBe(3)
  })

  it('laesst einen werfenden Hoerer weder die uebrigen noch den Lauf mitreissen', () => {
    const fehlerAusgabe = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const spaeter: RenderProgress[] = []
    merkeHoerer(() => {
      throw new Error('kaputter Empfaenger')
    })
    merkeHoerer((e) => spaeter.push(e))
    const { s, anAuftrag } = sender(2)

    expect(() => s.starteElement(0, 'a')).not.toThrow()
    expect(() => s.beendeElement(0)).not.toThrow()

    expect(spaeter.length).toBe(2)
    expect(anAuftrag.length).toBe(2)
    expect(fehlerAusgabe).toHaveBeenCalledTimes(2)
  })

  it('beliefert die Hoerer auch dann, wenn anAuftrag wirft', () => {
    const fehlerAusgabe = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const gehoert: RenderProgress[] = []
    merkeHoerer((e) => gehoert.push(e))
    const s = erzeugeFortschrittSender('r-1', 1, () => {
      throw new Error('Auftragsverwaltung kaputt')
    })

    expect(() => s.starteElement(0, 'a')).not.toThrow()

    expect(gehoert.length).toBe(1)
    expect(fehlerAusgabe).toHaveBeenCalledTimes(1)
  })

  it('arbeitet ohne angemeldeten Hoerer vollstaendig und schweigend', () => {
    const fehlerAusgabe = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { s, anAuftrag } = sender(1)

    s.starteElement(0, 'a')
    s.beendeElement(0)
    s.starteVerketten()

    expect(anAuftrag.length).toBe(3)
    expect(fehlerAusgabe).not.toHaveBeenCalled()
  })
})
