// Verhaltenstests zu #174 - Frame-Rundung und Gesamtdauer im render-service.
//
// Hier zaehlen ZAHLEN. Jeder Erwartungswert unten ist von Hand nachgerechnet, nicht
// aus der Umsetzung abgeschrieben:
//   zuFrames(s)  = round(s * 30)
//   trimFrames   = round(ende * 30) - round(start * 30)   EINZELN, dann Differenz
//   gesamtdauer  = Summe der Frames / 30
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Wer statt der Einzelrundung
// `round((ende - start) * 30)` schreibt, liegt bei den meisten Wertepaaren RICHTIG.
// Auffaellig wird der Fehler erst dort, wo beide Grenzen zwischen zwei Frames
// liegen - und dann nicht als Meldung, sondern als ein Frame Abweichung je Element.
// Ein einzelnes Beispiel beweist deshalb nichts; die Tests laufen ueber BEREICHE,
// und der Drift-Test unten zeigt, ab wann die feste 0,5-s-Toleranz der Verifikation
// reisst.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import {
  frameDauer,
  gesamtFrames,
  gesamtdauer,
  trimFrames,
  zuFrames,
  zuSekunden,
} from '../../src/main/render-service/frames'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import type {
  RenderItem,
  RenderItemSegment,
  RenderItemVideo,
} from '../../src/shared/contracts/render-request'

const fps = RENDER_PROFILE.fps

function video(trimStart: number, trimEnde: number, id = 'v1'): RenderItemVideo {
  return { id, art: 'video', medienRef: 'media/a.mp4', trimStart, trimEnde, einblendung: null }
}
function segment(dauer: number, id = 's1'): RenderItemSegment {
  return { id, art: 'segment', png: new Uint8Array([1, 2, 3]), dauer }
}

/** Der Wert eines gelungenen Ergebnisses - schlaegt fehl, statt still `undefined` zu liefern. */
function wert<T>(ergebnis: { ok: true; wert: T } | { ok: false; fehler: unknown }): T {
  if (!ergebnis.ok) throw new Error(`Erwartet war Erfolg, bekommen: ${JSON.stringify(ergebnis)}`)
  return ergebnis.wert
}
/** Der Fehler eines fehlgeschlagenen Ergebnisses. */
function fehler(
  ergebnis: { ok: true; wert: unknown } | { ok: false; fehler: { code: string; meldung: string; daten?: unknown } },
): { code: string; meldung: string; daten?: unknown } {
  if (ergebnis.ok) throw new Error(`Erwartet war ein Fehler, bekommen: ${JSON.stringify(ergebnis)}`)
  return ergebnis.fehler
}

describe('zuFrames / zuSekunden - die einzige Rundungsstelle', () => {
  it('bildet eine Sekunde auf genau fps Frames ab und zurueck', () => {
    expect(zuFrames(1)).toBe(fps)
    expect(zuSekunden(fps)).toBe(1)
  })

  it('rundet die Haelfte aufwaerts', () => {
    // 1/60 s sind exakt ein halber Frame; Math.round(0.5) = 1.
    expect((1 / 60) * fps).toBe(0.5)
    expect(zuFrames(1 / 60)).toBe(1)
  })

  it('verschluckt den Gleitkomma-Rest von 0.1 + 0.2', () => {
    // 0.1 + 0.2 ist nicht 0.3 - aber beide liegen auf demselben Frame.
    expect(0.1 + 0.2).not.toBe(0.3)
    expect((0.1 + 0.2) * fps).toBe(9.000000000000002)
    expect(zuFrames(0.1 + 0.2)).toBe(9)
    expect(zuFrames(0.3)).toBe(9)
  })

  it('teilt, statt mit dem Kehrwert zu multiplizieren', () => {
    // `frames * (1 / fps)` ist NICHT `frames / fps`: Der Kehrwert ist selbst schon
    // gerundet, und der Fehler wird beim Multiplizieren mitverstaerkt. Nachgemessen
    // weichen 88 der ersten 1001 Frame-Zahlen ab, die erste bei 23.
    expect(23 / fps).not.toBe(23 * (1 / fps))
    expect(zuSekunden(23)).toBe(23 / fps)
    expect(zuSekunden(23)).not.toBe(23 * (1 / fps))
  })

  it('legt jede Sekundenangabe auf das Frame-Raster - fuer 0 bis 24 h nachgemessen', () => {
    // Das ist die pruefbare Fassung von „exaktes Vielfaches von 1/fps": Der
    // Sekundenwert bezeichnet genau EINE Frame-Zahl und findet zu ihr zurueck.
    //
    // ACHTUNG, ein Multiplizieren-zurueck (`zuSekunden(f) * fps === f`) waere die
    // FALSCHE Probe und schluege fehl - nicht wegen dieser Datei, sondern weil 1/30
    // kein Binaerbruch ist: (31/30) * 30 ergibt 31.000000000000004. Von 200 001
    // Frame-Zahlen scheitern so 6 550, die erste bei 31.
    expect((31 / fps) * fps).not.toBe(31)

    for (let f = 0; f <= 2_592_000; f += 997) {
      expect(zuFrames(zuSekunden(f))).toBe(f)
    }
  })

  it('prueft nicht und traegt keine Ergebnis-Huelle - reine Umrechnung', () => {
    // ENTSCHIEDEN 4: Die Pruefung passiert EINMAL, in trimFrames/frameDauer.
    expect(zuFrames(Number.NaN)).toBeNaN()
    expect(zuFrames(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(zuFrames(0)).toBe(0)
    expect(() => zuFrames(Number.NaN)).not.toThrow()
  })
})

describe('trimFrames - beide Grenzen EINZELN gerundet', () => {
  it('liefert bei [2.51, 10.49] 240 Frames, nicht 239', () => {
    // Das nachrechenbare Gegenbeispiel aus TK 9.2.6:
    //   einzeln:   round(10.49 * 30) - round(2.51 * 30) = 315 - 75 = 240
    //   gemeinsam: round((10.49 - 2.51) * 30) = round(239.4)       = 239
    expect(Math.round(2.51 * fps)).toBe(75)
    expect(Math.round(10.49 * fps)).toBe(315)
    expect(Math.round((10.49 - 2.51) * fps)).toBe(239)

    expect(wert(trimFrames(2.51, 10.49))).toEqual({
      startFrame: 75,
      endFrame: 315,
      frames: 240,
    })
  })

  it('trifft trimFrames(0, 1) auf dem Raster', () => {
    expect(wert(trimFrames(0, 1))).toEqual({ startFrame: 0, endFrame: fps, frames: fps })
  })

  it('nimmt trimStart = 0 an', () => {
    expect(wert(trimFrames(0, 10)).frames).toBe(300)
  })

  it('trifft Grenzen, die genau auf dem Raster liegen', () => {
    expect(wert(trimFrames(1, 2))).toEqual({ startFrame: 30, endFrame: 60, frames: 30 })
    expect(wert(trimFrames(2 / fps, 5 / fps))).toEqual({
      startFrame: 2,
      endFrame: 5,
      frames: 3,
    })
  })

  it('trifft Grenzen, die zwischen zwei Frames liegen', () => {
    // 1/60 = ein halber Frame -> 1; 3/60 = anderthalb Frames -> 2.
    expect(wert(trimFrames(1 / 60, 3 / 60))).toEqual({
      startFrame: 1,
      endFrame: 2,
      frames: 1,
    })
    // 1.02 * 30 = 30.6 -> 31; 1.0 * 30 = 30. Der kuerzestmoegliche gueltige Schnitt.
    expect(wert(trimFrames(1, 1.02)).frames).toBe(1)
  })

  it('weist einen Ausschnitt ab, der kuerzer als ein Frame ist', () => {
    // 1.01 * 30 = 30.3 -> 30, genau wie 1.0. Die rohen Sekunden gehen auseinander,
    // das Frame-Raster nicht.
    expect(zuFrames(1)).toBe(zuFrames(1.01))
    const f = fehler(trimFrames(1, 1.01))
    expect(f.code).toBe('ungueltiges_element')
    // Die Meldung nennt die Mindestdauer und ihren Sekundenwert.
    expect(f.meldung).toContain('ein Frame')
    expect(f.meldung).toContain(String(zuSekunden(1)))
    // Ohne `daten`: diese Funktion kennt die Element-ID nicht.
    expect(f.daten).toBeUndefined()
  })

  it('weist unbrauchbare Grenzen ab und nennt beide Werte', () => {
    for (const [start, ende] of [
      [Number.NaN, 10],
      [0, Number.NaN],
      [Number.POSITIVE_INFINITY, 10],
      [0, Number.POSITIVE_INFINITY],
    ] as const) {
      const f = fehler(trimFrames(start, ende))
      expect(f.code).toBe('ungueltiges_element')
      expect(f.meldung).toContain(String(start))
      expect(f.meldung).toContain(String(ende))
    }
    expect(fehler(trimFrames(-1, 10)).code).toBe('ungueltiges_element')
    expect(fehler(trimFrames(5, 5)).code).toBe('ungueltiges_element')
    expect(fehler(trimFrames(10, 5)).code).toBe('ungueltiges_element')
  })

  it('wirft nie - auch nicht bei Eingaben, die kein number sind', () => {
    const kaputt = trimFrames('3' as unknown as number, null as unknown as number)
    expect(fehler(kaputt).code).toBe('ungueltiges_element')
  })

  it('haelt ueber 4000 Wertepaare hinweg die Einzelrundung ein', () => {
    // Der Eigenschaftstest: fuer jedes Paar muss die Frame-Zahl der ERSTEN Form
    // entsprechen - und mindestens 1 sein, sonst ist es ein Fehler.
    let auseinander = 0
    for (let i = 0; i < 200; i++) {
      for (let j = 1; j <= 20; j++) {
        const start = i * 0.037
        const ende = start + j * 0.041
        const einzeln = zuFrames(ende) - zuFrames(start)
        const gemeinsam = zuFrames(ende - start)
        if (einzeln !== gemeinsam) auseinander++

        const ergebnis = trimFrames(start, ende)
        if (einzeln < 1) {
          expect(fehler(ergebnis).code).toBe('ungueltiges_element')
        } else {
          expect(wert(ergebnis)).toEqual({
            startFrame: zuFrames(start),
            endFrame: zuFrames(ende),
            frames: einzeln,
          })
        }
      }
    }
    // Haelt den Eigenschaftstest davon ab, unbemerkt leer zu laufen: Gaeben beide
    // Formen ueberall dasselbe, bewiese er nichts ueber die Reihenfolge.
    expect(auseinander).toBeGreaterThan(500)
  })
})

describe('frameDauer - je art die richtige Quelle', () => {
  it('liest bei video NUR den Trim - ein untergeschobenes `dauer` wird ignoriert', () => {
    const mitFremdemFeld = { ...video(2.51, 10.49), dauer: 999 } as unknown as RenderItem
    expect(wert(frameDauer(mitFremdemFeld))).toBe(240)
    expect(wert(frameDauer(mitFremdemFeld))).toBe(wert(frameDauer(video(2.51, 10.49))))
  })

  it('zaehlt die Band-Abschnitte NICHT mit', () => {
    // „Die Elementdauer bestimmt allein das Video (Trim). Das Band verlaengert oder
    // verkuerzt sie nie." (TK 9.2.8)
    const ohne = video(0, 10)
    const mit: RenderItemVideo = {
      ...ohne,
      einblendung: {
        art: 'einblendung',
        höhe: 162,
        bandVorlageId: 'bv1',
        abschnitte: [
          { png: new Uint8Array([1]), dauer: 5 },
          { png: new Uint8Array([2]), dauer: 5 },
          { png: new Uint8Array([3]), dauer: 90 },
        ],
      },
    }
    expect(wert(frameDauer(mit))).toBe(300)
    expect(wert(frameDauer(mit))).toBe(wert(frameDauer(ohne)))
  })

  it('nimmt beim segment die Dauer', () => {
    expect(wert(frameDauer(segment(10)))).toBe(300)
    expect(wert(frameDauer(segment(7.5)))).toBe(225)
    // 12.345 * 30 = 370.35 -> 370
    expect(wert(frameDauer(segment(12.345)))).toBe(370)
  })

  it('kommt mit sehr kurzen und sehr langen Dauern zurecht', () => {
    // 0.017 * 30 = 0.51 -> 1 Frame, die kuerzeste zulaessige Dauer.
    expect(wert(frameDauer(segment(0.017)))).toBe(1)
    // Eine Stunde.
    expect(wert(frameDauer(segment(3600)))).toBe(108_000)
  })

  it('weist eine Dauer ab, die auf 0 Frames rundet', () => {
    // 0.016 * 30 = 0.48 -> 0. Ein Standbild ohne Frames erzeugt eine leere
    // Eingabedatei, an der `-c copy` NICHT abbricht (ENTSCHIEDEN 7).
    expect(zuFrames(0.016)).toBe(0)
    const f = fehler(frameDauer(segment(0.016, 's-kurz')))
    expect(f.code).toBe('ungueltiges_element')
    expect(f.daten).toEqual({ elementId: 's-kurz' })
    expect(f.meldung).toContain(String(zuSekunden(1)))
  })

  it('weist Dauer 0, negative und unbrauchbare Dauern ab - mit elementId', () => {
    for (const d of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const f = fehler(frameDauer(segment(d, 'seg-x')))
      expect(f.code).toBe('ungueltiges_element')
      expect(f.daten).toEqual({ elementId: 'seg-x' })
    }
    const keineZahl = { id: 's-x', art: 'segment', png: new Uint8Array(), dauer: '10' }
    const f = fehler(frameDauer(keineZahl as unknown as RenderItem))
    expect(f.code).toBe('ungueltiges_element')
    expect(f.daten).toEqual({ elementId: 's-x' })
  })

  it('reicht den Trim-Fehler durch und ergaenzt allein die elementId', () => {
    const roh = fehler(trimFrames(1, 1.01))
    const amElement = fehler(frameDauer(video(1, 1.01, 'v-kurz')))
    expect(amElement.code).toBe(roh.code)
    expect(amElement.meldung).toBe(roh.meldung)
    expect(amElement.daten).toEqual({ elementId: 'v-kurz' })
  })

  it('meldet ein video ohne Trim-Felder am Element, nicht an der Anfrage', () => {
    // Die `art` ist bekannt, also gibt es einen Elementbezug - der Mangel gehoert
    // dem Element (`ungueltiges_element` MIT daten), nicht der Anfrage.
    const ohneTrim = { id: 'v-leer', art: 'video', medienRef: 'a.mp4', einblendung: null }
    const f = fehler(frameDauer(ohneTrim as unknown as RenderItem))
    expect(f.code).toBe('ungueltiges_element')
    expect(f.daten).toEqual({ elementId: 'v-leer' })
    expect(f.meldung).toContain('undefined')
  })

  it('meldet eine unbekannte art als Mangel der ANFRAGE, ohne daten', () => {
    // TK 9.2.3 ordnet „unbekannte art" der Anfrage zu, nicht dem Element - deshalb
    // derselbe Code wie bei der Pruefung der Anfrage (#173).
    const f = fehler(frameDauer({ id: 'x', art: 'ton', dauer: 5 } as unknown as RenderItem))
    expect(f.code).toBe('ungueltige_eingabe')
    expect(f.daten).toBeUndefined()
  })

  it('wirft nie - auch nicht bei null, undefined oder einem werfenden Getter', () => {
    expect(fehler(frameDauer(null as unknown as RenderItem)).code).toBe('ungueltige_eingabe')
    expect(fehler(frameDauer(undefined as unknown as RenderItem)).code).toBe('ungueltige_eingabe')
    expect(fehler(frameDauer(42 as unknown as RenderItem)).code).toBe('ungueltige_eingabe')

    const boesartig = {
      get art(): string {
        throw new Error('kaputter Getter')
      },
    }
    expect(() => frameDauer(boesartig as unknown as RenderItem)).not.toThrow()
    expect(fehler(frameDauer(boesartig as unknown as RenderItem)).code).toBe('unbekannter_fehler')
  })
})

describe('gesamtFrames / gesamtdauer', () => {
  it('ergibt bei leerer Liste 0 und ist KEIN Fehler', () => {
    expect(wert(gesamtFrames([]))).toBe(0)
    expect(wert(gesamtdauer([]))).toBe(0)
  })

  it('summiert eine gemischte Liste aus nachgerechneten Einzelwerten', () => {
    // video [2.51, 10.49] = 240, segment 7.5 s = 225, segment 10 s = 300 -> 765 Frames
    const liste: RenderItem[] = [video(2.51, 10.49), segment(7.5, 's0'), segment(10)]
    expect(wert(gesamtFrames(liste))).toBe(765)
    expect(wert(gesamtdauer(liste))).toBe(25.5)
  })

  it('ist auf das letzte Bit genau zuSekunden(gesamtFrames)', () => {
    const liste: RenderItem[] = [
      video(2.51, 10.49),
      segment(7.5, 's0'),
      segment(12.345),
      video(0.017, 33.333, 'v2'),
      segment(0.017, 's2'),
    ]
    const frames = wert(gesamtFrames(liste))
    expect(Object.is(wert(gesamtdauer(liste)), zuSekunden(frames))).toBe(true)
  })

  it('summiert genau die Einzelrundungen - nicht mehr und nicht weniger', () => {
    const liste: RenderItem[] = []
    for (let k = 0; k < 60; k++) {
      liste.push(video(k * 0.137, k * 0.137 + 3.339, `v${String(k)}`))
      liste.push(segment(0.7 + k * 0.011, `t${String(k)}`))
      liste.push(segment(10.03 + k * 0.017, `s${String(k)}`))
    }
    let einzeln = 0
    for (const element of liste) einzeln += wert(frameDauer(element))
    expect(wert(gesamtFrames(liste))).toBe(einzeln)
    expect(wert(gesamtdauer(liste))).toBe(zuSekunden(einzeln))
  })

  it('DRIFT: gemeinsame Rundung reisst ab 16 Elementen die 0,5-s-Toleranz', () => {
    // Der Grund fuer diese ganze Datei. Je Element weicht die gemeinsame Rundung
    // hier um genau einen Frame ab (240 statt 239); ein Frame sind 1/30 s.
    const proElement = zuFrames(10.49) - zuFrames(2.51) - zuFrames(10.49 - 2.51)
    expect(proElement).toBe(1)

    // Die Verifikation der fertigen Datei arbeitet mit einer FESTEN Toleranz von
    // 0,5 s - bewusst nicht relativ, weil ein Prozentsatz bei einem 30-Minuten-Reel
    // ein vollstaendig fehlendes Segment durchwinken wuerde.
    const TOLERANZ = 0.5
    // 15 Frames sind EXAKT die Toleranz (15/30 = 0,5) - der Grenzfall liegt also
    // schon bei fuenfzehn Elementen auf der Kante; ab dem sechzehnten ist sie
    // ueberschritten.
    expect(zuSekunden(15 * proElement)).toBe(TOLERANZ)
    expect(zuSekunden(16 * proElement)).toBeGreaterThan(TOLERANZ)

    const liste: RenderItem[] = []
    for (let k = 0; k < 20; k++) liste.push(video(2.51, 10.49, `v${String(k)}`))

    const richtig = wert(gesamtFrames(liste))
    const naiv = 20 * zuFrames(10.49 - 2.51)
    expect(richtig).toBe(4800)
    expect(naiv).toBe(4780)
    expect(zuSekunden(richtig) - zuSekunden(naiv)).toBeGreaterThan(TOLERANZ)
    expect(wert(gesamtdauer(liste))).toBe(160)
  })

  it('haelt auch ueber ein 30-Minuten-Reel hinweg', () => {
    // 180 Segmente zu 10 s = 1800 s = 54 000 Frames, exakt.
    const liste: RenderItem[] = []
    for (let k = 0; k < 180; k++) liste.push(segment(10, `s${String(k)}`))
    expect(wert(gesamtFrames(liste))).toBe(54_000)
    expect(wert(gesamtdauer(liste))).toBe(1800)
  })

  it('bricht beim ERSTEN unstimmigen Element ab und meldet dessen id', () => {
    const liste: RenderItem[] = [
      segment(10, 'gut-1'),
      segment(0.016, 'kaputt-1'),
      segment(0.016, 'kaputt-2'),
    ]
    const f = fehler(gesamtFrames(liste))
    expect(f.code).toBe('ungueltiges_element')
    expect(f.daten).toEqual({ elementId: 'kaputt-1' })
    expect(fehler(gesamtdauer(liste)).daten).toEqual({ elementId: 'kaputt-1' })
  })

  it('meldet eine Liste, die kein Array ist, als Mangel der Anfrage', () => {
    for (const kaputt of [null, undefined, 'abc', 7, {}]) {
      const f = fehler(gesamtFrames(kaputt as unknown as RenderItem[]))
      expect(f.code).toBe('ungueltige_eingabe')
      expect(f.daten).toBeUndefined()
    }
  })

  it('wirft nie - ein Loch im Array wird zum Fehlercode, nicht zur Ausnahme', () => {
    const mitLoch = [segment(10, 'gut'), undefined] as unknown as RenderItem[]
    expect(() => gesamtFrames(mitLoch)).not.toThrow()
    expect(fehler(gesamtFrames(mitLoch)).code).toBe('ungueltige_eingabe')
  })
})

describe('Profilbezug und Grep-Proben', () => {
  it('nimmt die Bildrate aus RENDER_PROFILE - ein abgewandeltes Profil rechnet mit', async () => {
    // Belegt verhaltensnah, dass die 30 nirgends als Zahl im Code steht.
    vi.resetModules()
    vi.doMock('../../src/shared/contracts/render-profile', () => ({
      RENDER_PROFILE: { ...RENDER_PROFILE, fps: 25 } as unknown as typeof RENDER_PROFILE,
    }))
    const bei25 = await import('../../src/main/render-service/frames')

    expect(bei25.zuFrames(1)).toBe(25)
    expect(bei25.zuSekunden(25)).toBe(1)
    // Bei 25 fps: round(10.49 * 25) - round(2.51 * 25) = 262 - 63 = 199.
    expect(Math.round(10.49 * 25)).toBe(262)
    expect(Math.round(2.51 * 25)).toBe(63)
    expect(wert(bei25.trimFrames(2.51, 10.49)).frames).toBe(199)
    expect(wert(bei25.gesamtdauer([segment(10)]))).toBe(10)
    expect(wert(bei25.gesamtFrames([segment(10)]))).toBe(250)

    vi.doUnmock('../../src/shared/contracts/render-profile')
    vi.resetModules()
    // Unter dem echten Profil wieder 240.
    expect(wert(trimFrames(2.51, 10.49)).frames).toBe(240)
  })

  it('enthaelt im ausfuehrbaren Teil weder die 30 noch floor/ceil/toFixed/EPSILON', () => {
    // Die Grep-Probe der Definition of Done. Kommentare mit zitierten TK-Saetzen
    // duerfen die 30 enthalten - der ausfuehrbare Teil nicht, denn eine spaetere
    // Profil-Aenderung muss ein Datenwert bleiben (TK 9.2.4).
    const quelle = readFileSync(
      fileURLToPath(new URL('../../src/main/render-service/frames.ts', import.meta.url)),
      'utf8',
    )
    const ohneKommentare = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(ohneKommentare).not.toMatch(/\b30\b/)
    for (const verboten of ['Math.floor', 'Math.ceil', 'toFixed', 'EPSILON']) {
      expect(ohneKommentare).not.toContain(verboten)
    }
    // Gegenprobe, damit die Probe nicht an einem zu gierigen Kommentar-Ausschnitt
    // leer laeuft: Der Rumpf ist noch da.
    expect(ohneKommentare).toContain('Math.round')
    expect(ohneKommentare).toContain('RENDER_PROFILE.fps')
  })
})
