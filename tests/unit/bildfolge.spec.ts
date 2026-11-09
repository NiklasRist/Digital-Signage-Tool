// Tests zu #464 - der Bildplan im Render (TK 9.16.4/9.16.5).
//
// WAS HIER PRUEFBAR IST: die gesamte Argument- und Kettenbildung aus dem Auftrag -
// reine Zeichenketten. Es startet KEIN ffmpeg.
//
// WAS HIER NICHT PRUEFBAR IST: ob die erzeugte Datei wirklich `gesamtFrames` Bilder
// hat. Das haengt am echten Encoder und steht in
// `tests/integration/bildfolge-echt.spec.ts`. Die Tests hier sind der Anker:
// Aendert jemand eine Kette, werden sie rot und die Messung ist zu wiederholen.
//
// DIE ZWEI TEUERSTEN FEHLER DIESER DATEI SIND RECHNERISCH UND POSITIONELL:
// eine fehlende Wiederholung (Dauer zu kurz) und `-framerate`/`-i` an falscher
// Stelle. Beide sehen typrichtig aus. Deshalb pruefen die Tests Werte und PLAETZE.
import { describe, expect, it } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { BildfolgeAuftrag } from '../../src/main/ffmpeg-adapter/bildfolge'
import type { RenderProfile } from '../../src/shared/contracts/render-profile'

const { baueBildfolgeArgumente } = await import('../../src/main/ffmpeg-adapter/bildfolge')

const FPS = String(RENDER_PROFILE.fps)

/** Ein gueltiger Auftrag; jeder Test aendert nur, was er meint. */
function auftrag(aenderung: Partial<BildfolgeAuftrag> = {}): BildfolgeAuftrag {
  return {
    laeufe: [
      {
        pngPfade: ['/t1/segment-0007-000.png', '/t1/segment-0007-001.png', '/t1/segment-0007-002.png'],
        wiederholungen: 2,
      },
      {
        pngPfade: ['/t1/segment-0007-003.png', '/t1/segment-0007-004.png'],
        wiederholungen: 1,
      },
    ],
    gesamtFrames: 3 * 2 + 2,
    zielPfad: '/t1/seg_0007.mp4',
    ...aenderung,
  }
}

function argumente(
  a: BildfolgeAuftrag = auftrag(),
  p: RenderProfile = RENDER_PROFILE,
): string[] {
  const ergebnis = baueBildfolgeArgumente(a, p)
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`)
  return ergebnis.wert
}

function fehlertext(a: BildfolgeAuftrag, p: RenderProfile = RENDER_PROFILE): string {
  const ergebnis = baueBildfolgeArgumente(a, p)
  if (ergebnis.ok) throw new Error('Erwartet war ein Fehler, bekommen: ok')
  expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  return ergebnis.fehler.meldung
}

/** Der Wert HINTER einem Flag - so wird die Position mitgeprueft, nicht nur das Vorkommen. */
function wertVon(argumente: readonly string[], flag: string): string | undefined {
  const stelle = argumente.indexOf(flag)
  return stelle === -1 ? undefined : argumente[stelle + 1]
}

/** Die Filterkette. */
function kette(argumente: readonly string[]): string {
  const k = wertVon(argumente, '-filter_complex')
  if (k === undefined) throw new Error('keine Filterkette im Argument-Array')
  return k
}

/** Alle Werte hinter einem Flag. */
function werteVon(argumente: readonly string[], flag: string): string[] {
  return argumente.flatMap((wert, i) => (wert === flag ? [argumente[i + 1] ?? ''] : []))
}

describe('baueBildfolgeArgumente - Eingaenge', () => {
  it('nimmt JEDEN Frame als eigenen Eingang, in der Reihenfolge der Laeufe', () => {
    const a = argumente()
    const eingaenge = werteVon(a, '-i')
    expect(eingaenge).toEqual([
      '/t1/segment-0007-000.png',
      '/t1/segment-0007-001.png',
      '/t1/segment-0007-002.png',
      '/t1/segment-0007-003.png',
      '/t1/segment-0007-004.png',
      // Die stille Tonspur ist der LETZTE Eingang (#162).
      'anullsrc=channel_layout=mono:sample_rate=48000',
    ])
  })

  it('setzt -framerate als EINGANGS-Option direkt vor jedes PNG -i', () => {
    // Dieselbe Positionsfalle wie in #166/#168: Hinter dem `-i` waere es eine
    // Ausgabe-Option und wirkte nicht auf den Eingang. Die stille Tonquelle ist die
    // Ausnahme - sie kommt aus #162 und hat ihre eigene Form.
    const a = argumente()
    a.forEach((wert, i) => {
      if (wert !== '-i') return
      const ziel = a[i + 1] ?? ''
      if (!ziel.startsWith('/t1/')) return
      expect(a[i - 2]).toBe('-framerate')
      expect(a[i - 1]).toBe(FPS)
    })
  })

  it('traegt KEIN -loop 1: ein PNG liefert genau ein Bild', () => {
    // #166 braucht `-loop 1`, weil EIN Bild die ganze Dauer haelt. Hier kommen die
    // Bilder aus dem Plan - ein unbegrenzter Eingang waere ein zweiter Weg.
    expect(argumente()).not.toContain('-loop')
  })
})

describe('baueBildfolgeArgumente - die Kette', () => {
  it('baut je Frame einen Zweig, je Lauf ein concat und die Wiederholung als loop', () => {
    const k = kette(argumente())

    // Fuenf Zweige, in Eingangsreihenfolge - das Label traegt den Eingangsindex.
    for (let i = 0; i < 5; i++) {
      expect(k).toContain(`[${String(i)}:v]trim=end_frame=1,setpts=PTS-STARTPTS,`)
    }

    // Lauf 1: 3 Frames, 2 Wiederholungen -> loop=loop=1 (ZUSATZ-Wiederholungen).
    expect(k).toContain('[b0][b1][b2]concat=n=3:v=1:a=0,loop=loop=1:size=3:start=0[r0]')
    // Lauf 2: 2 Frames, 1 Wiederholung -> KEIN loop.
    expect(k).toContain('[b3][b4]concat=n=2:v=1:a=0[r1]')
    // Abschluss: Laeufe verketten, Zeitstempel neu vergeben, Ausgabelabel [v].
    expect(k).toContain('[r0][r1]concat=n=2:v=1:a=0,setpts=N/FRAME_RATE/TB,')
    expect(k.endsWith('[v]')).toBe(true)
  })

  it('die Bildzahl steht in -frames:v - und zwar exakt die Summe der Laeufe', () => {
    expect(wertVon(argumente(), '-frames:v')).toBe('8')
  })

  it('erzwingt die Bildrate des Profils (auch im Filter, nicht nur im Encoder)', () => {
    // Ohne `setpts=N/FRAME_RATE/TB` landen Einzelbild-Abschnitte auf demselben
    // Zeitstempel; der Encoder verwirft sie dann (gemessen, s. Kopf der Quelldatei).
    expect(kette(argumente())).toContain('setpts=N/FRAME_RATE/TB')
    expect(wertVon(argumente(), '-r')).toBe(FPS)
  })

  it('mappt Video UND die stille Tonspur ausdruecklich', () => {
    const a = argumente()
    expect(werteVon(a, '-map')).toEqual(['[v]', '5:a:0'])
  })

  it('endet mit dem Zielpfad und setzt den Container aus dem Profil', () => {
    const a = argumente()
    expect(a.at(-1)).toBe('/t1/seg_0007.mp4')
    // Das LETZTE `-f` ist das Ausgabeformat; das erste gehoert zur lavfi-Tonspur.
    expect(werteVon(a, '-f').at(-1)).toBe(RENDER_PROFILE.container)
  })

  it('uebernimmt das Pixelformat aus dem Profil in jeden Zweig', () => {
    // Alle Zweige muessen dasselbe Format tragen, sonst verhandelt ffmpeg je Zweig -
    // und die Uniformitaet fuer `concat -c copy` (9.2.6) haengt daran.
    const k = kette(argumente())
    expect(k.match(/format=yuv420p/g)?.length).toBe(5 + 1)
  })
})

describe('baueBildfolgeArgumente - Fehlerpfade', () => {
  it('weist eine Plansumme ab, die nicht gesamtFrames ergibt', () => {
    const meldung = fehlertext(auftrag({ gesamtFrames: 9 }))
    expect(meldung).toContain('8')
    expect(meldung).toContain('9')
  })

  it('weist einen Auftrag ohne Lauf ab', () => {
    expect(fehlertext(auftrag({ laeufe: [] }))).toContain('mindestens einen')
  })

  it('weist einen Lauf ohne Pfad ab', () => {
    const meldung = fehlertext(
      auftrag({ laeufe: [{ pngPfade: [], wiederholungen: 1 }], gesamtFrames: 1 }),
    )
    expect(meldung).toContain('mindestens ein Frame')
  })

  it('weist nicht-ganzzahlige und zu kleine Wiederholungen ab', () => {
    for (const wiederholungen of [0, -1, 1.5, Number.NaN]) {
      fehlertext(
        auftrag({
          laeufe: [{ pngPfade: ['/t1/a.png'], wiederholungen }],
          gesamtFrames: 1,
        }),
      )
    }
  })

  it('weist gesamtFrames <= 0 und nicht-ganzzahlige Werte ab', () => {
    for (const gesamtFrames of [0, -30, 8.5, Number.POSITIVE_INFINITY]) {
      fehlertext(auftrag({ gesamtFrames }))
    }
  })

  it('weist einen leeren oder mit - beginnenden Pfad ab', () => {
    for (const pfad of ['', '-i', '/t1/a\nb.png', '/t1/a\u0000b.png']) {
      fehlertext(
        auftrag({
          laeufe: [{ pngPfade: [pfad], wiederholungen: 1 }],
          gesamtFrames: 1,
        }),
      )
    }
  })

  it('weist ein Ziel auf einer Quelle ab', () => {
    const meldung = fehlertext(
      auftrag({
        laeufe: [{ pngPfade: ['/t1/seg_0007.mp4'], wiederholungen: 1 }],
        gesamtFrames: 1,
      }),
    )
    expect(meldung).toContain('ueberschriebe')
  })

  it('weist ein unbrauchbares Profil ab, bevor Argumente entstehen', () => {
    const kaputt = { ...RENDER_PROFILE, fps: 0 } as unknown as RenderProfile
    expect(fehlertext(auftrag(), kaputt)).toContain('profil.fps')

    const ohneFormat = { ...RENDER_PROFILE, pixelformat: 'yuv420p,scale=1:1' } as unknown as RenderProfile
    expect(fehlertext(auftrag(), ohneFormat)).toContain('trennt')

    const ohneContainer = { ...RENDER_PROFILE, container: '' } as unknown as RenderProfile
    expect(fehlertext(auftrag(), ohneContainer)).toContain('profil.container')
  })

  it('wirft nie - auch nicht bei null oder undefined', () => {
    for (const kaputt of [null, undefined, 42]) {
      const ergebnis = baueBildfolgeArgumente(
        kaputt as unknown as BildfolgeAuftrag,
        RENDER_PROFILE,
      )
      expect(ergebnis.ok).toBe(false)
    }
  })
})
