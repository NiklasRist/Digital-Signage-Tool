import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Einblendung } from '../../src/shared/contracts/project'

// Verhaltenstest zu #220 (band-takt.ts): welcher Bandabschnitt bei welchem Frame sichtbar ist.
//
// Reine Rechnung, keine Browser-Umgebung, kein IPC, kein Zustand (TK 9.9.2). Gemockt wird
// NUR `sekundenZuFrame` aus #213 - die EINZIGE Sekunden->Frames-Umrechnung des Renderers.
// Die Attrappe zaehlt die Aufrufe (DoD: "genau einmal je Abschnitt") und delegiert an die
// echte Funktion, damit die frame-gerundeten Ergebnisse real bleiben.
const zustand = vi.hoisted(() => ({ aufrufe: 0 }))

vi.mock('../../src/renderer/preview-player/zeitachse', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/preview-player/zeitachse')>()
  return {
    ...echt,
    sekundenZuFrame: (sekunden: number): number => {
      zustand.aufrufe += 1
      return echt.sekundenZuFrame(sekunden)
    },
  }
})

const { baueBandtakt, waehleAbschnitt } = await import(
  '../../src/renderer/preview-player/band-takt'
)

beforeEach(() => {
  zustand.aufrufe = 0
})

/** Eine Einblendung mit Abschnitten, deren Dauern in SEKUNDEN sind. */
function einblendung(abschnitte: Array<{ aktionRef: string; dauer: number }>): Einblendung {
  return { bandVorlageId: 'band-standard', abschnitte }
}

function zehnFuenfzehn(): Einblendung {
  return einblendung([
    { aktionRef: 'aktion-a', dauer: 10 },
    { aktionRef: 'aktion-b', dauer: 5 },
    { aktionRef: 'aktion-c', dauer: 15 },
  ])
}

describe('baueBandtakt (#220) – die Rundung', () => {
  it('drei Abschnitte zu 10 s, 5 s, 15 s ergeben bei 30 fps [0,300), [300,450), [450,900) und rundeFrames 900', () => {
    const takt = baueBandtakt(zehnFuenfzehn())

    expect(takt.abschnitte.map((a) => a.startFrame)).toEqual([0, 300, 450])
    expect(takt.abschnitte.map((a) => a.endeFrame)).toEqual([300, 450, 900])
    expect(takt.rundeFrames).toBe(900)
  })

  it('index entspricht bei jedem Abschnitt seiner Position, und abschnitte.length === einblendung.abschnitte.length', () => {
    const takt = baueBandtakt(zehnFuenfzehn())

    expect(takt.abschnitte.map((a) => a.index)).toEqual([0, 1, 2])
    expect(takt.abschnitte.length).toBe(3)
  })

  it('Lueckenlosigkeit: erster startFrame 0, endeFrame === naechster startFrame, rundeFrames === letztes endeFrame', () => {
    const takt = baueBandtakt(zehnFuenfzehn())

    expect(takt.abschnitte[0]?.startFrame).toBe(0)
    for (let i = 0; i + 1 < takt.abschnitte.length; i += 1) {
      expect(takt.abschnitte[i]!.endeFrame).toBe(takt.abschnitte[i + 1]!.startFrame)
    }
    expect(takt.rundeFrames).toBe(takt.abschnitte[takt.abschnitte.length - 1]!.endeFrame)
  })

  it('summiert die GERUNDETEN Dauern, nicht die gerundete Summe (ENTSCHIEDEN 2)', () => {
    // 0.5 s + 0.5 s: einzeln je Math.round(15)=15, Summe 30. Die gerundete Summe (1 s) waere 30 - gleich.
    // Der Unterschied zeigt sich bei zwei Dauern, deren Bruchanteile sich zur ganzen aufaddieren:
    // 0.0166..s (0.5 Frame) und 0.0166..s (0.5 Frame) -> je 0 Frames, Summe 0.
    const einzeln = baueBandtakt(einblendung([{ aktionRef: 'a', dauer: 0.0166 }, { aktionRef: 'b', dauer: 0.0166 }]))
    expect(einzeln.rundeFrames).toBe(0)
    // Die gerundete Summe (0.0332 s = 1 Frame) waere 1 - nicht hier.
  })

  it('sekundenZuFrame wird genau einmal je Abschnitt aufgerufen (Spion)', () => {
    baueBandtakt(zehnFuenfzehn())

    expect(zustand.aufrufe).toBe(3)
  })

  it('die uebergebene einblendung ist nach dem Aufruf unveraendert', () => {
    const eingang = zehnFuenfzehn()
    const vorher = JSON.stringify(eingang)

    baueBandtakt(eingang)

    expect(JSON.stringify(eingang)).toBe(vorher)
  })
})

describe('baueBandtakt (#220) – Abschnitte mit 0 Frames', () => {
  it('ein Abschnitt mit dauer 0 bleibt in der Liste, hat frames 0 und startFrame === endeFrame', () => {
    const takt = baueBandtakt(einblendung([{ aktionRef: 'a', dauer: 0 }, { aktionRef: 'b', dauer: 5 }]))

    expect(takt.abschnitte).toHaveLength(2)
    const a = takt.abschnitte[0]
    expect(a?.aktionRef).toBe('a')
    expect(a?.frames).toBe(0)
    expect(a?.startFrame).toBe(a?.endeFrame)
  })

  it.each([
    ['-1', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('eine dauer von %s ergibt 0 Frames und wirft nicht', (_beschreibung, dauer) => {
    const takt = baueBandtakt(einblendung([{ aktionRef: 'a', dauer }, { aktionRef: 'b', dauer: 5 }]))

    expect(takt.abschnitte[0]?.frames).toBe(0)
    expect(takt.rundeFrames).toBe(150)
  })

  it('leere abschnitte ergeben { abschnitte: [], rundeFrames: 0 }', () => {
    const takt = baueBandtakt(einblendung([]))

    expect(takt.abschnitte).toEqual([])
    expect(takt.rundeFrames).toBe(0)
  })
})

describe('waehleAbschnitt (#220) – Wiederholung und Abschneiden', () => {
  const takt900 = baueBandtakt(zehnFuenfzehn())

  it('Wiederholung: bei rundeFrames 900 und elementFrames 2000 liefern lokalerFrame 0, 900, 1800 denselben Abschnitt (Index 0)', () => {
    const a = waehleAbschnitt(takt900, 0, 2000)
    const b = waehleAbschnitt(takt900, 900, 2000)
    const c = waehleAbschnitt(takt900, 1800, 2000)

    expect(a).not.toBeNull()
    expect(a?.index).toBe(0)
    expect(b?.index).toBe(a?.index)
    expect(c?.index).toBe(a?.index)
  })

  it('Wiederholung: lokalerFrame 1200 bei rundeFrames 900 trifft den Abschnitt mit Index 1', () => {
    const gefunden = waehleAbschnitt(takt900, 1200, 2000)

    expect(gefunden?.index).toBe(1)
  })

  it('Abschneiden: bei elementFrames 500 liefert 499 einen Abschnitt und 500 null - auch wenn die Runde 900 lang ist', () => {
    expect(waehleAbschnitt(takt900, 499, 500)).not.toBeNull()
    expect(waehleAbschnitt(takt900, 500, 500)).toBeNull()
  })

  it('kuerzere Folge: bei rundeFrames 60 und elementFrames 300 liefert ueber alle Frames 0..299 durchgehend einen Abschnitt', () => {
    const takt = baueBandtakt(einblendung([{ aktionRef: 'a', dauer: 2 }])) // 60 Frames

    for (let frame = 0; frame < 300; frame += 1) {
      const gefunden = waehleAbschnitt(takt, frame, 300)
      expect(gefunden).not.toBeNull()
      expect(gefunden?.index).toBe(0)
    }
  })

  it('Grenzen: der Wechsel liegt bei endeFrame, nicht bei endeFrame - 1', () => {
    // Abschnitt b beginnt bei 300. Frame 299 gehoert zu Index 0, Frame 300 zu Index 1.
    expect(waehleAbschnitt(takt900, 299, 900)?.index).toBe(0)
    expect(waehleAbschnitt(takt900, 300, 900)?.index).toBe(1)
  })
})

describe('waehleAbschnitt (#220) – Fehlerpfade', () => {
  const takt900 = baueBandtakt(zehnFuenfzehn())

  it.each([
    ['-1', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('liefert fuer lokalerFrame %s null und wirft nicht', (_beschreibung, frame) => {
    expect(waehleAbschnitt(takt900, frame, 900)).toBeNull()
  })

  it('bei rundeFrames 0 liefert er null, ohne Division durch null', () => {
    const leer = baueBandtakt(einblendung([{ aktionRef: 'a', dauer: 0 }]))

    expect(leer.rundeFrames).toBe(0)
    expect(waehleAbschnitt(leer, 0, 100)).toBeNull()
    expect(waehleAbschnitt(leer, 50, 100)).toBeNull()
  })

  it('bei elementFrames <= 0 liefert er null', () => {
    expect(waehleAbschnitt(takt900, 0, 0)).toBeNull()
    expect(waehleAbschnitt(takt900, 0, -5)).toBeNull()
  })

  it('ein Abschnitt mit 0 Frames wird NIE geliefert (halboffene Zaehlweise)', () => {
    const takt = baueBandtakt(einblendung([{ aktionRef: 'a', dauer: 0 }, { aktionRef: 'b', dauer: 5 }]))

    // Frame 0 faellt in [0,150) -> b. a ist [0,0), leer.
    expect(waehleAbschnitt(takt, 0, 300)?.aktionRef).toBe('b')
    expect(waehleAbschnitt(takt, 149, 300)?.aktionRef).toBe('b')
  })
})

describe('band-takt.ts (#220) – Grep-Proben der DoD', () => {
  const quelle = readFileSync(
    fileURLToPath(new URL('../../src/renderer/preview-player/band-takt.ts', import.meta.url)),
    'utf8',
  )
  // Nur der Code, ohne Kommentare - die Proben pruefen den Rumpf.
  const code = quelle.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('enthält weder eigene Rundung noch RENDER_PROFILE noch ein Literal 30', () => {
    expect(code).not.toMatch(/Math\.(round|floor|ceil)/)
    expect(code).not.toMatch(/RENDER_PROFILE/)
    expect(code).not.toMatch(/\b30\b/)
    expect(code).not.toMatch(/toFixed/)
  })

  it('kennt keine Vorlagen, Geometrie, Trim oder Zustand', () => {
    expect(code).not.toMatch(/bandVorlageId/)
    expect(code).not.toMatch(/trimStart/)
    expect(code).not.toMatch(/trimEnde/)
    expect(code).not.toMatch(/berechneBandGeometrie/)
    expect(code).not.toMatch(/\bVorlage\b/)
    expect(code).not.toMatch(/Date\.now|performance\.now|requestAnimationFrame|setInterval/)
  })

  it('ist kein JSX und spricht keinen IPC-Kanal an', () => {
    expect(code).not.toMatch(/react/)
    expect(code).not.toMatch(/rufeAuf|abonniere/)
    expect(code).not.toMatch(/window\.api/)
  })

  it('hat kein `let` auf Modulebene', () => {
    expect(code).not.toMatch(/^let /m)
  })
})