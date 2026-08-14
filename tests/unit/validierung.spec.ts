// Verhaltenstests zu #173 - die Grenzkontrolle des Render-Auftrags.
//
// Diese Datei entscheidet, was ueberhaupt in den Render darf. Sie wird deshalb an
// ZAHLEN geprueft, nicht an Beispielen:
//   * die Dauer-Grenzen einschliesslich (10 ja, 9.99 nein - 45 ja, 45.01 nein),
//   * die PNG-Masse EXAKT (1920x1081 nein, 1919x1080 nein - keine Toleranz),
//   * die Bandbreite 1920 und NICHT die eingepasste Videobreite 1632.
//
// DIE FALLE, gegen die der letzte Punkt gebaut ist (Nachtrag zum Issue vom
// 14.08.2026): Im gebauten `BandGeometrie` (#239) heisst `videoBreite` die
// EINGEPASSTE Breite - bei H = 162 sind das 1632, nicht 1920. Wer sie als Bandbreite
// einsetzte, wiese jedes richtige Band-PNG ab, und weil beide Felder `number` sind,
// uebersetzt das fehlerfrei. Der Test unten haelt beide Zahlen nebeneinander.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { berechneBandGeometrie } from '../../src/shared/band-geometrie'
import { DAUER_BEREICH } from '../../src/shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import type {
  RenderItemBild,
  RenderItemSegment,
  RenderItemVideo,
  RenderRequest,
} from '../../src/shared/contracts/render-request'

// Der Datenort wird gemockt, weil `pfade.ts` sonst ueber `datenort.ts` an `electron`
// geraet - im Testlauf gibt es keins. Gerechnet wird trotzdem mit dem ECHTEN #49.
vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => '/daten',
}))

// Die Attrappe fuer die Pfad-Autoritaet: Sie zaehlt die Aufrufe und reicht an die
// ECHTE Fassung durch. So belegt der Test, dass die Namensregeln aus TK 9.2.6 hier
// nicht nachgebaut, sondern GERUFEN werden (ENTSCHIEDEN 1).
const zustand = vi.hoisted(() => ({ ausgabeAufrufe: [] as Array<[string, unknown]> }))

vi.mock('../../src/main/project-store/pfade', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/main/project-store/pfade')>(
      '../../src/main/project-store/pfade',
    )
  return {
    ...echt,
    loeseAusgabePfad: (projektId: string, ausgabeName: string) => {
      zustand.ausgabeAufrufe.push([projektId, ausgabeName])
      return echt.loeseAusgabePfad(projektId, ausgabeName)
    },
  }
})

const { liesPngMasse, pruefeRenderRequest } = await import(
  '../../src/main/render-service/validierung'
)
const { frameDauer } = await import('../../src/main/render-service/frames')
const { bestimmeBandgeometrie } = await import('../../src/main/render-service/band-geometrie')

// ---------------------------------------------------------------------------
// Ein ECHTES, minimales PNG: 1 x 1 Pixel, RGBA, mit gueltigen Pruefsummen (die
// IHDR-Pruefsumme 1f 15 c4 89 und die IEND-Pruefsumme ae 42 60 82 sind die bekannten
// Konstanten fuer genau diesen Fall). 68 Bytes.
// ---------------------------------------------------------------------------
const PNG_1X1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0b, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x00, 0x02, 0x00,
  0x00, 0x05, 0x00, 0x01, 0x7a, 0x5e, 0xab, 0x3f, 0x00, 0x00, 0x00, 0x00,
  0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
])

/**
 * Dasselbe PNG mit anderen Massen im Kopf. Die IHDR-Pruefsumme stimmt danach NICHT
 * mehr - das ist Absicht: `liesPngMasse` prueft laut ENTSCHIEDEN 5 ausdruecklich keine
 * Pruefsumme. Wuerde sie es doch, faellt es hier auf.
 */
function png(breite: number, höhe: number): Uint8Array {
  const bytes = PNG_1X1.slice()
  const sicht = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  sicht.setUint32(16, breite)
  sicht.setUint32(20, höhe)
  return bytes
}

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'
const BANDHOEHE = 162

function video(ueber: Partial<RenderItemVideo> = {}): RenderItemVideo {
  return {
    id: 'v1',
    art: 'video',
    medienRef: 'a.mp4',
    trimStart: 0,
    trimEnde: 10,
    einblendung: null,
    ...ueber,
  }
}

function mitBand(
  ueber: Partial<NonNullable<RenderItemVideo['einblendung']>> = {},
): RenderItemVideo {
  return video({
    einblendung: {
      art: 'einblendung',
      höhe: BANDHOEHE,
      bandVorlageId: 'bv1',
      abschnitte: [
        { png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer: 5 },
        { png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer: 5 },
      ],
      ...ueber,
    },
  })
}

function bild(ueber: Partial<RenderItemBild> = {}): RenderItemBild {
  return { id: 'b1', art: 'bild', medienRef: 'a.png', dauer: 10, ...ueber }
}

function segment(ueber: Partial<RenderItemSegment> = {}): RenderItemSegment {
  return {
    id: 's1',
    art: 'segment',
    png: png(RENDER_PROFILE.breite, RENDER_PROFILE.hoehe),
    dauer: 10,
    ...ueber,
  }
}

function anfrage(ueber: Partial<RenderRequest> = {}): RenderRequest {
  return {
    renderId: 'r1',
    projektId: PROJEKT,
    elemente: [mitBand(), bild(), segment()],
    profil: structuredClone(RENDER_PROFILE),
    ausgabeName: 'Sommeraktion',
    ...ueber,
  }
}

/** Der Fehler eines fehlgeschlagenen Ergebnisses - schlaegt fehl, statt still weiterzulaufen. */
function fehler(ergebnis: ReturnType<typeof pruefeRenderRequest>): {
  code: string
  meldung: string
  daten?: unknown
} {
  if (ergebnis.ok) throw new Error('Erwartet war ein Fehler, bekommen: ok')
  return ergebnis.fehler
}

/** Ein Mangel der ANFRAGE: richtiger Code UND kein `daten` (DoD). */
function anfrageFehler(ergebnis: ReturnType<typeof pruefeRenderRequest>): string {
  const f = fehler(ergebnis)
  expect(f.code).toBe('ungueltige_eingabe')
  expect(f.daten).toBeUndefined()
  return f.meldung
}

/** Ein Mangel eines ELEMENTS: richtiger Code UND `daten` mit genau dieser Kennung (DoD). */
function elementFehler(ergebnis: ReturnType<typeof pruefeRenderRequest>, id: string): string {
  const f = fehler(ergebnis)
  expect(f.code).toBe('ungueltiges_element')
  expect(f.daten).toEqual({ elementId: id })
  return f.meldung
}

beforeEach(() => {
  zustand.ausgabeAufrufe = []
})

describe('pruefeRenderRequest - der stimmige Auftrag', () => {
  it('nimmt video (mit Band aus zwei Abschnitten), bild und segment an', () => {
    expect(pruefeRenderRequest(anfrage())).toEqual({ ok: true, wert: undefined })
  })

  it('veraendert die uebergebene Anfrage nachweislich nicht', () => {
    const original = anfrage()
    const kopie = structuredClone(original)
    expect(pruefeRenderRequest(original).ok).toBe(true)
    expect(original).toEqual(kopie)

    // Und auch auf dem Fehlerweg wird nichts zurechtgebogen: keine Dauer geklemmt,
    // kein fehlendes Feld ergaenzt.
    const kaputt = anfrage({ elemente: [bild({ dauer: 99 })] })
    const kaputtKopie = structuredClone(kaputt)
    expect(pruefeRenderRequest(kaputt).ok).toBe(false)
    expect(kaputt).toEqual(kaputtKopie)
  })
})

describe('Stufe 1 - Maengel der ANFRAGE (ungueltige_eingabe, ohne daten)', () => {
  it('Zeile 1: request ist kein Objekt oder null', () => {
    for (const kaputt of [null, undefined, 42, 'anfrage']) {
      anfrageFehler(pruefeRenderRequest(kaputt as unknown as RenderRequest))
    }
  })

  it('Zeile 2: projektId fehlt, ist leer oder kein String', () => {
    for (const kaputt of [undefined, '', 7, null]) {
      anfrageFehler(pruefeRenderRequest(anfrage({ projektId: kaputt as unknown as string })))
    }
  })

  it('Zeile 3: renderId fehlt, ist leer oder kein String', () => {
    for (const kaputt of [undefined, '', 7, null]) {
      anfrageFehler(pruefeRenderRequest(anfrage({ renderId: kaputt as unknown as string })))
    }
  })

  it('Zeile 4: elemente ist kein Array', () => {
    for (const kaputt of [undefined, null, 'a', {}]) {
      anfrageFehler(
        pruefeRenderRequest(anfrage({ elemente: kaputt as unknown as RenderRequest['elemente'] })),
      )
    }
  })

  it('Zeile 5: elemente ist leer', () => {
    const meldung = anfrageFehler(pruefeRenderRequest(anfrage({ elemente: [] })))
    expect(meldung).toContain('kein einziges Element')
  })

  it('Zeile 6: ein Element hat keine oder eine leere id - die Meldung nennt den Index', () => {
    const meldung = anfrageFehler(
      pruefeRenderRequest(anfrage({ elemente: [bild(), { ...bild(), id: '' }] })),
    )
    expect(meldung).toContain('Position 1')

    // Ein Loch im Array ist derselbe Fall - und keine Ausnahme.
    anfrageFehler(
      pruefeRenderRequest(
        anfrage({ elemente: [undefined] as unknown as RenderRequest['elemente'] }),
      ),
    )
  })

  it('Zeile 7: zwei Elemente tragen dieselbe id - die Meldung nennt die ID', () => {
    const meldung = anfrageFehler(
      pruefeRenderRequest(anfrage({ elemente: [bild({ id: 'gleich' }), segment({ id: 'gleich' })] })),
    )
    expect(meldung).toContain('gleich')
  })

  it('Zeile 8: ein Element hat eine unbekannte art', () => {
    const meldung = anfrageFehler(
      pruefeRenderRequest(
        anfrage({
          elemente: [{ id: 'x', art: 'ton', dauer: 10 }] as unknown as RenderRequest['elemente'],
        }),
      ),
    )
    expect(meldung).toContain('ton')
  })

  it('Zeile 9: das Profil fehlt', () => {
    anfrageFehler(
      pruefeRenderRequest(anfrage({ profil: undefined as unknown as RenderRequest['profil'] })),
    )
  })

  it('Zeile 9 (DoD): pixelformat yuv422p wird abgewiesen, die Meldung nennt das Feld', () => {
    const p = structuredClone(RENDER_PROFILE)
    ;(p as unknown as Record<string, unknown>)['pixelformat'] = 'yuv422p'
    const meldung = anfrageFehler(pruefeRenderRequest(anfrage({ profil: p })))
    expect(meldung).toContain('pixelformat')
    expect(meldung).toContain('yuv420p')
    expect(meldung).toContain('yuv422p')
  })

  it('Zeile 9 (Gegenprobe): JEDES einzelne Profilfeld wird geprueft - alle 22', () => {
    // Der Test, der beisst, wenn jemand ein Feld vergisst: Er laeuft ueber die
    // Blattpfade von RENDER_PROFILE und verlangt fuer jeden einzelnen eine Abweisung,
    // die genau diesen Pfad nennt.
    const pfade = blattPfade(RENDER_PROFILE as unknown as Record<string, unknown>)
    expect(pfade).toHaveLength(22)

    for (const pfad of pfade) {
      const p = structuredClone(RENDER_PROFILE) as unknown as Record<string, unknown>
      setze(p, pfad, 'ABWEICHUNG')
      const meldung = anfrageFehler(
        pruefeRenderRequest(anfrage({ profil: p as unknown as RenderRequest['profil'] })),
      )
      expect(meldung).toContain(pfad)
    }
  })

  it('Zeile 10 (DoD): ausgabeName "../../config" wird ueber #49 abgewiesen - Attrappe genau einmal', () => {
    const meldung = anfrageFehler(
      pruefeRenderRequest(anfrage({ ausgabeName: '../../config' })),
    )
    expect(zustand.ausgabeAufrufe).toHaveLength(1)
    expect(zustand.ausgabeAufrufe[0]).toEqual([PROJEKT, '../../config'])
    // Die Meldung von #49 wird uebernommen, nicht durch eine eigene ersetzt.
    expect(meldung).toContain('Der Ausgabename ist leer')
  })

  it('Zeile 10: auch ein fehlender oder reservierter Name laeuft ueber #49', () => {
    for (const name of [undefined, '', 'NUL', 'a/b', 'a<b'] as unknown as string[]) {
      anfrageFehler(pruefeRenderRequest(anfrage({ ausgabeName: name })))
    }
    expect(zustand.ausgabeAufrufe).toHaveLength(5)
  })

  it('Zeile 22: eine unerwartete Ausnahme wird zu unbekannter_fehler, nicht zum throw', () => {
    const boesartig = {
      renderId: 'r1',
      projektId: PROJEKT,
      elemente: [bild()],
      ausgabeName: 'Sommeraktion',
      get profil(): unknown {
        throw new Error('kaputter Getter')
      },
    }
    expect(() => pruefeRenderRequest(boesartig as unknown as RenderRequest)).not.toThrow()
    const f = fehler(pruefeRenderRequest(boesartig as unknown as RenderRequest))
    expect(f.code).toBe('unbekannter_fehler')
  })

  it('prueft in der verbindlichen Reihenfolge: erst die Anfrage, dann die Elemente', () => {
    // Diese Anfrage ist an BEIDEN Stufen kaputt (leerer Ausgabename UND ein Element
    // mit unzulaessiger Dauer). Gemeldet werden muss die Stufe 1.
    const f = fehler(
      pruefeRenderRequest(anfrage({ ausgabeName: '', elemente: [bild({ dauer: 99 })] })),
    )
    expect(f.code).toBe('ungueltige_eingabe')
  })
})

describe('Stufe 2 - Maengel eines ELEMENTS (ungueltiges_element, mit daten)', () => {
  it('Zeile 11: medienRef bei video und bild fehlt, ist leer oder kein String', () => {
    for (const kaputt of [undefined, '', 7]) {
      elementFehler(
        pruefeRenderRequest(
          anfrage({ elemente: [video({ id: 'v-x', medienRef: kaputt as unknown as string })] }),
        ),
        'v-x',
      )
      elementFehler(
        pruefeRenderRequest(
          anfrage({ elemente: [bild({ id: 'b-x', medienRef: kaputt as unknown as string })] }),
        ),
        'b-x',
      )
    }
  })

  it('Zeile 12: der Fehler von frameDauer (#174) wird unveraendert durchgereicht', () => {
    // trimFrames: round(1.01 * 30) = 30 = round(1 * 30) -> kuerzer als ein Frame.
    const element = video({ id: 'v-kurz', trimStart: 1, trimEnde: 1.01 })
    const direkt = frameDauer(element)
    if (direkt.ok) throw new Error('Der Aufbau des Tests stimmt nicht: #174 haette melden muessen.')

    const meldung = elementFehler(
      pruefeRenderRequest(anfrage({ elemente: [element] })),
      'v-kurz',
    )
    expect(meldung).toBe(direkt.fehler.meldung)
  })

  it('Zeile 13 (DoD): dauer 10 und 45 werden angenommen, 9.99 und 45.01 abgewiesen', () => {
    expect(DAUER_BEREICH).toEqual({ min: 10, max: 45 })

    for (const dauer of [DAUER_BEREICH.min, DAUER_BEREICH.max, 27.5]) {
      expect(pruefeRenderRequest(anfrage({ elemente: [bild({ dauer })] })).ok).toBe(true)
      expect(pruefeRenderRequest(anfrage({ elemente: [segment({ dauer })] })).ok).toBe(true)
    }
    for (const dauer of [9.99, 45.01, 0.5, 3600]) {
      const meldung = elementFehler(
        pruefeRenderRequest(anfrage({ elemente: [bild({ id: 'b-x', dauer })] })),
        'b-x',
      )
      // Die Meldung nennt BEIDE Grenzen.
      expect(meldung).toContain('10')
      expect(meldung).toContain('45')
      elementFehler(
        pruefeRenderRequest(anfrage({ elemente: [segment({ id: 's-x', dauer })] })),
        's-x',
      )
    }
  })

  it('Zeile 13 (Gegenprobe): die Grenze ist einschliesslich, nicht knapp daneben', () => {
    // Ein Frame unter der Grenze ist bereits zu wenig - hier gibt es keine Toleranz.
    expect(pruefeRenderRequest(anfrage({ elemente: [bild({ dauer: 10 - 1 / 30 })] })).ok).toBe(false)
    expect(pruefeRenderRequest(anfrage({ elemente: [bild({ dauer: 45 + 1 / 30 })] })).ok).toBe(false)
  })

  it('Zeile 14: das PNG eines segment fehlt, ist kein Uint8Array oder ist leer', () => {
    for (const kaputt of [undefined, null, new Uint8Array(), [1, 2, 3], 'png']) {
      elementFehler(
        pruefeRenderRequest(
          anfrage({ elemente: [segment({ id: 's-x', png: kaputt as unknown as Uint8Array })] }),
        ),
        's-x',
      )
    }
  })

  it('Zeile 15 (DoD): ein segment-PNG mit 1920 x 1081 wird abgewiesen', () => {
    const meldung = elementFehler(
      pruefeRenderRequest(anfrage({ elemente: [segment({ id: 's-x', png: png(1920, 1081) })] })),
      's-x',
    )
    // Soll- und Ist-Masse stehen in der Meldung.
    expect(meldung).toContain('1081')
    expect(meldung).toContain('1080')
    expect(meldung).toContain('1920')
  })

  it('Zeile 15 (Gegenprobe): exakt, ohne Toleranz - auch ein Pixel zu schmal faellt durch', () => {
    for (const [b, h] of [
      [1919, 1080],
      [1921, 1080],
      [1920, 1079],
      [960, 540],
      [1632, 1080],
    ] as const) {
      expect(
        pruefeRenderRequest(anfrage({ elemente: [segment({ png: png(b, h) })] })).ok,
      ).toBe(false)
    }
    expect(pruefeRenderRequest(anfrage({ elemente: [segment({ png: png(1920, 1080) })] })).ok).toBe(
      true,
    )
  })

  it('Zeile 21: ein kaputter Kopf faellt am Element auf - liesPngMasse selbst setzt kein daten', () => {
    const zuKurz = png(1920, 1080).slice(0, 23)
    const falscheSignatur = png(1920, 1080)
    falscheSignatur[0] = 0x88
    const keinKopf = png(1920, 1080)
    keinKopf[12] = 0x41

    for (const kaputt of [zuKurz, falscheSignatur, keinKopf]) {
      // Ohne Elementbezug, solange die Funktion allein gerufen wird ...
      const roh = liesPngMasse(kaputt)
      if (roh.ok) throw new Error('Erwartet war ein Fehler von liesPngMasse.')
      expect(roh.fehler.code).toBe('ungueltiges_element')
      expect(roh.fehler.daten).toBeUndefined()

      // ... und MIT Elementbezug, sobald der Aufrufer in dieser Datei ihn ergaenzt.
      elementFehler(
        pruefeRenderRequest(anfrage({ elemente: [segment({ id: 's-x', png: kaputt })] })),
        's-x',
      )
    }
  })
})

describe('Die Einblendung - Band-Geometrie, Abschnitte, PNG-Masse', () => {
  it('Zeile 16: der Fehler von bestimmeBandgeometrie (#176) kommt mit seiner Meldung + elementId', () => {
    // Eine UNGERADE Bandhoehe. Geprueft wird sie NICHT hier, sondern von #176 - das
    // Ausgabe-Profil verlangt yuv420p, und das erlaubt nur gerade Hoehen (TK v2.9).
    const direkt = bestimmeBandgeometrie({ art: 'einblendung', höhe: 163 })
    if (direkt.ok) throw new Error('Der Aufbau des Tests stimmt nicht: #176 haette melden muessen.')

    const meldung = elementFehler(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            { ...mitBand({ höhe: 163 }), id: 'v-x' },
          ],
        }),
      ),
      'v-x',
    )
    expect(meldung).toBe(direkt.fehler.meldung)
    expect(meldung).toContain('ungerade')
  })

  it('Zeile 16: unbekannte art, Hoehe 0, Hoehe >= 1080 - alle ueber #176', () => {
    for (const kaputt of [
      { art: 'vollflaeche' as unknown as 'split' },
      { höhe: 0 },
      { höhe: RENDER_PROFILE.hoehe },
      { höhe: 162.5 },
      { höhe: Number.NaN },
    ]) {
      elementFehler(
        pruefeRenderRequest(anfrage({ elemente: [{ ...mitBand(kaputt), id: 'v-x' }] })),
        'v-x',
      )
    }
  })

  it('Zeile 17: abschnitte fehlen, sind kein Array oder leer', () => {
    for (const kaputt of [undefined, null, 'a', {}, []]) {
      elementFehler(
        pruefeRenderRequest(
          anfrage({
            elemente: [
              {
                ...mitBand({
                  abschnitte: kaputt as unknown as { png: Uint8Array; dauer: number }[],
                }),
                id: 'v-x',
              },
            ],
          }),
        ),
        'v-x',
      )
    }
  })

  it('Zeile 18: ein Abschnitts-PNG fehlt - die Meldung nennt den Index', () => {
    const meldung = elementFehler(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            {
              ...mitBand({
                abschnitte: [
                  { png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer: 5 },
                  { png: new Uint8Array(), dauer: 5 },
                ],
              }),
              id: 'v-x',
            },
          ],
        }),
      ),
      'v-x',
    )
    expect(meldung).toContain('Position 1')
  })

  it('Zeile 19 (DoD): richtige Breite, falsche Hoehe - der haeufigste reale Fall', () => {
    // Die Vorlage wurde nach dem Zeichnen geaendert: Das PNG ist noch 1920 x 120,
    // die Anfrage nennt H = 162.
    const meldung = elementFehler(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            {
              ...mitBand({
                abschnitte: [{ png: png(RENDER_PROFILE.breite, 120), dauer: 5 }],
              }),
              id: 'v-x',
            },
          ],
        }),
      ),
      'v-x',
    )
    expect(meldung).toContain('Position 0')
    expect(meldung).toContain('120')
    expect(meldung).toContain('162')
  })

  it('Zeile 19 (GEGENPROBE ZUM NACHTRAG): die Bandbreite ist 1920, NICHT die eingepasste 1632', () => {
    // Bei H = 162 rechnet die geteilte Geometrie (#239) videoBreite = 1632 - das ist
    // die EINGEPASSTE Videobreite, nicht die Bandbreite. Wer sie hier einsetzte,
    // wiese jedes richtige Band-PNG ab und liesse jedes falsche durch.
    const geo = berechneBandGeometrie(BANDHOEHE)
    expect(geo.videoBreite).toBe(1632)
    expect(geo.videoBereichBreite).toBe(1920)
    expect(geo.bandY).toBe(918)

    // Das RICHTIGE Band-PNG (1920 breit) wird angenommen ...
    expect(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            mitBand({ abschnitte: [{ png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer: 5 }] }),
          ],
        }),
      ).ok,
    ).toBe(true)

    // ... und ein PNG mit der eingepassten Videobreite abgewiesen.
    expect(
      pruefeRenderRequest(
        anfrage({
          elemente: [mitBand({ abschnitte: [{ png: png(geo.videoBreite, BANDHOEHE), dauer: 5 }] })],
        }),
      ).ok,
    ).toBe(false)
  })

  it('Zeile 19 (Gegenprobe): die Bandhoehe folgt der Anfrage, nicht der eingebauten 162', () => {
    // H = 200 geht bei der Vierer-Abrundung NICHT glatt auf (880 x 16/9 = 1564,44...),
    // ist aber eine voellig zulaessige Bandhoehe. Das Band-PNG bleibt 1920 x 200.
    expect(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            mitBand({ höhe: 200, abschnitte: [{ png: png(1920, 200), dauer: 5 }] }),
          ],
        }),
      ).ok,
    ).toBe(true)
    expect(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            mitBand({ höhe: 200, abschnitte: [{ png: png(1920, BANDHOEHE), dauer: 5 }] }),
          ],
        }),
      ).ok,
    ).toBe(false)
  })

  it('Zeile 20: die Dauer eines Abschnitts ist unbrauchbar oder kuerzer als ein Frame', () => {
    for (const dauer of [undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, '5', 0.016]) {
      elementFehler(
        pruefeRenderRequest(
          anfrage({
            elemente: [
              {
                ...mitBand({
                  abschnitte: [
                    { png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer: dauer as number },
                  ],
                }),
                id: 'v-x',
              },
            ],
          }),
        ),
        'v-x',
      )
    }
    // Die 10-45-s-Grenze gilt fuer Abschnitte AUSDRUECKLICH NICHT (ENTSCHIEDEN 9):
    // 0.034 s (ein Frame ist 0.0333) und 3600 s sind beide zulaessig.
    for (const dauer of [0.034, 1, 3600]) {
      expect(
        pruefeRenderRequest(
          anfrage({
            elemente: [
              mitBand({ abschnitte: [{ png: png(RENDER_PROFILE.breite, BANDHOEHE), dauer }] }),
            ],
          }),
        ).ok,
      ).toBe(true)
    }
  })

  it('einblendung: genau null heisst „kein Band" - alles andere wird geprueft', () => {
    expect(pruefeRenderRequest(anfrage({ elemente: [video({ einblendung: null })] })).ok).toBe(true)
    elementFehler(
      pruefeRenderRequest(
        anfrage({
          elemente: [
            video({
              id: 'v-x',
              einblendung: undefined as unknown as RenderItemVideo['einblendung'],
            }),
          ],
        }),
      ),
      'v-x',
    )
  })

  it('die Dauer eines video haengt am Trim, nicht am Band', () => {
    // Ein Video von 2 s ist zulaessig, obwohl 2 s ausserhalb von DAUER_BEREICH liegt:
    // „die Dauer ergibt sich aus dem Trim" (TK 9.11.3), ENTSCHIEDEN 9.
    expect(
      pruefeRenderRequest(anfrage({ elemente: [video({ trimStart: 0, trimEnde: 2 })] })).ok,
    ).toBe(true)
  })
})

describe('liesPngMasse - nur der Kopf, nichts dekodiert', () => {
  it('DoD: liest aus dem echten 1x1-PNG die Masse 1 x 1', () => {
    const ergebnis = liesPngMasse(PNG_1X1)
    expect(ergebnis).toEqual({ ok: true, wert: { breite: 1, höhe: 1 } })
  })

  it('DoD: ein um ein Byte gekuerzter Puffer und eine falsche Signatur liefern je einen Fehler', () => {
    const gekuerzt = PNG_1X1.slice(0, 23)
    const roh = liesPngMasse(gekuerzt)
    if (roh.ok) throw new Error('Erwartet war ein Fehler.')
    expect(roh.fehler.code).toBe('ungueltiges_element')
    expect(roh.fehler.meldung).toContain('23')

    const falsch = PNG_1X1.slice()
    falsch[3] = 0x00
    const zweiter = liesPngMasse(falsch)
    if (zweiter.ok) throw new Error('Erwartet war ein Fehler.')
    expect(zweiter.fehler.code).toBe('ungueltiges_element')

    // Genau 24 Bytes reichen dagegen - mehr braucht es nicht.
    expect(liesPngMasse(png(1920, 1080).slice(0, 24)).ok).toBe(true)
  })

  it('liest grosse Masse vorzeichenlos - kein Schieben mit Vorzeichen', () => {
    // 0x80000001 hat ein gesetztes hoechstes Bit. Mit `<< 24` kaeme eine NEGATIVE
    // Breite heraus; sie waere nie gleich 1920 und der Fehler faellt nirgends auf.
    const gross = png(0x80000001, 0xffffffff)
    expect(liesPngMasse(gross)).toEqual({
      ok: true,
      wert: { breite: 2147483649, höhe: 4294967295 },
    })
  })

  it('prueft KEINE Pruefsumme und dekodiert nicht', () => {
    // `png()` laesst die IHDR-Pruefsumme absichtlich falsch stehen (ENTSCHIEDEN 5).
    expect(liesPngMasse(png(1920, 1080)).ok).toBe(true)
  })

  it('wirft nie - auch nicht bei null, undefined oder einem fremden Objekt', () => {
    for (const kaputt of [null, undefined, 42, [1, 2, 3], { byteLength: 99 }]) {
      expect(() => liesPngMasse(kaputt as unknown as Uint8Array)).not.toThrow()
      const roh = liesPngMasse(kaputt as unknown as Uint8Array)
      if (roh.ok) throw new Error('Erwartet war ein Fehler.')
      expect(roh.fehler.code).toBe('ungueltiges_element')
    }
  })
})

describe('Grep-Proben der Definition of Done', () => {
  const quelle = readFileSync(
    fileURLToPath(new URL('../../src/main/render-service/validierung.ts', import.meta.url)),
    'utf8',
  )
  const ausfuehrbar = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

  it('enthaelt keinen fs-Import und kein Math.round', () => {
    // Geprueft wird der AUSFUEHRBARE Teil: Im Kopfkommentar steht ausdruecklich, dass
    // diese Datei kein `node:fs` anfasst - der Satz darf dort stehen bleiben.
    expect(ausfuehrbar).not.toMatch(/from\s+['"](node:)?fs(\/promises)?['"]/)
    expect(ausfuehrbar).not.toContain('node:fs')
    expect(ausfuehrbar).not.toContain('require(')
    expect(ausfuehrbar).not.toContain('Math.round')
    // Gegenprobe, damit die Probe nicht an einem zu gierigen Kommentar-Ausschnitt
    // leer laeuft: Der Rumpf ist noch da.
    expect(ausfuehrbar).toContain('loeseAusgabePfad')
    expect(ausfuehrbar).toContain('zuFrames')
  })

  it('baut die Namensregeln aus TK 9.2.6 nicht nach', () => {
    for (const verboten of ['CON', 'PRN', 'LPT']) {
      expect(ausfuehrbar).not.toContain(verboten)
    }
    expect(ausfuehrbar).not.toContain("'..'")
    expect(ausfuehrbar).not.toContain('".."')
  })

  it('baut die Regeln fuer die Bandhoehe nicht nach - sie gehoeren #176', () => {
    // Kein eigener Test auf Geradzahligkeit und kein eigener Vergleich gegen 1080.
    expect(ausfuehrbar).not.toContain('% 2')
    expect(ausfuehrbar).not.toContain('1080')
    expect(ausfuehrbar).toContain('bestimmeBandgeometrie')
  })

  it('vergibt medium_fehlt nicht und sammelt keine Fehler', () => {
    expect(ausfuehrbar).not.toContain('medium_fehlt')
    expect(ausfuehrbar).not.toContain('loeseAssetPfad')
  })
})

// ---------------------------------------------------------------------------
// Zwei Helfer, die ABSICHTLICH nur im Test stehen: Der geprueften Datei ist ein
// solcher Tiefendurchlauf ausdruecklich verboten (ENTSCHIEDEN 3, „kein selbstgebauter
// Tiefenvergleich"). Hier ist er das Werkzeug, mit dem die ausgeschriebene Liste
// gegengeprueft wird.
// ---------------------------------------------------------------------------

function blattPfade(objekt: Record<string, unknown>, praefix = ''): string[] {
  const pfade: string[] = []
  for (const [schluessel, wert] of Object.entries(objekt)) {
    const pfad = praefix === '' ? schluessel : `${praefix}.${schluessel}`
    if (typeof wert === 'object' && wert !== null) {
      pfade.push(...blattPfade(wert as Record<string, unknown>, pfad))
    } else {
      pfade.push(pfad)
    }
  }
  return pfade
}

function setze(objekt: Record<string, unknown>, pfad: string, wert: unknown): void {
  const teile = pfad.split('.')
  let ziel = objekt
  for (let i = 0; i < teile.length - 1; i++) {
    ziel = ziel[teile[i] ?? ''] as Record<string, unknown>
  }
  ziel[teile[teile.length - 1] ?? ''] = wert
}
