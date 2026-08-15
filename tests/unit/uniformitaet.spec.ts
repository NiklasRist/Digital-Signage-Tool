import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { RenderProfile } from '../../src/shared/contracts/render-profile'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Abweichung, StromEigenschaften } from '../../src/main/ffmpeg-adapter/uniformitaet'

// Verhaltenstest zu #170 (Uniformitaet der Zwischenclips vor dem concat pruefen).
//
// WARUM DIESE PRUEFUNG UEBERHAUPT EXISTIERT - und warum ihre Tests scharf sein muessen:
// `concat -c copy` kopiert die codierten Pakete, ohne sie anzusehen. Unterscheiden sich
// zwei Zwischenclips, meldet ffmpeg ERFOLG. Die Datei entsteht in erwartbarer Groesse,
// laesst sich oeffnen - und friert am Fernseher nach dem ersten Segment ein oder verliert
// die Tonspur. Ist diese Pruefung loechrig, ist sie schlimmer als keine: Sie erzeugt das
// Gefuehl, abgesichert zu sein.
//
// DIE AUSGANGSGROESSE IST GEMESSEN, NICHT ERFUNDEN. `ECHTE_PROBE` ist die woertliche
// ffprobe-Ausgabe zu einem Zwischenclip, der am 15.08.2026 mit den Kodierargumenten aus
// #161/#162 erzeugt wurde (ffmpeg-static 6.1.1 / ffprobe-static, Windows x64). Ein von
// Hand ausgedachtes JSON haette genau die Eigenheiten nicht, um derentwillen es diesen
// Parser gibt: `level` kommt als ZAHL, `sample_rate` und `format.duration` als
// ZEICHENKETTE, und `field_order` fehlt komplett.
//
// GESTELLT IST GENAU EINE SACHE: der Start des fremden Prozesses (`node:child_process`).
// Ein echtes ffprobe machte diese Datei von einer Binaerdatei, von Mediendateien und -
// beim Zeitablauf - von 15 Sekunden Wartezeit abhaengig; sie gehoerte dann nach
// tests/integration/. Die Attrappe gibt her, was ein echter Lauf gerade NICHT hergibt:
// ein fehlendes Binary, eine unlesbare Ausgabe und einen Haenger, jeweils auf Kommando.

type ExecFehler = Error & { code?: string | number; killed?: boolean }

type Rueckruf = (fehler: ExecFehler | null, stdout: string, stderr: string) => void

const zustand = vi.hoisted(() => ({
  aufrufe: [] as { binaer: string; argumente: readonly string[]; optionen: Record<string, unknown> }[],
  /** Antwort je Dateipfad - der letzte Eintrag des Argument-Arrays. */
  antworten: new Map<string, { fehler?: unknown; stdout?: string; stderr?: string }>(),
  /** Belegt, dass die Standardeingabe geschlossen wird. */
  stdinBeendet: 0,
  /** Belegt, dass ein haengender Prozess hart beendet wird. */
  getoetet: [] as string[],
  /** Wie viele ffprobe-Laeufe gleichzeitig offen waren - erwartet: nie mehr als einer. */
  offen: 0,
  maxOffen: 0,
  startWirft: null as Error | null,
  exitCode: null as number | null,
  signalCode: null as string | null,
}))

vi.mock('node:child_process', () => {
  const execFile = (
    binaer: string,
    argumente: readonly string[],
    optionen: Record<string, unknown>,
    rueckruf: Rueckruf,
  ): unknown => {
    zustand.aufrufe.push({ binaer, argumente, optionen })
    if (zustand.startWirft !== null) throw zustand.startWirft

    zustand.offen += 1
    zustand.maxOffen = Math.max(zustand.maxOffen, zustand.offen)

    const datei = argumente[argumente.length - 1] ?? ''
    const antwort = zustand.antworten.get(datei) ?? {}

    // ASYNCHRON, so wie der echte execFile: Node ruft den Rueckruf NIE synchron. Eine
    // Attrappe, die sofort zurueckruft, testet einen Ablauf, den es nicht gibt - und
    // liefe im Produktivcode in die zeitliche Totzone der noch nicht zugewiesenen
    // Prozessvariablen.
    setTimeout(() => {
      zustand.offen -= 1
      rueckruf(
        (antwort.fehler ?? null) as ExecFehler | null,
        antwort.stdout ?? '',
        antwort.stderr ?? '',
      )
    }, 0)

    return {
      pid: 4711,
      get exitCode() {
        return zustand.exitCode
      },
      get signalCode() {
        return zustand.signalCode
      },
      stdin: {
        end: () => {
          zustand.stdinBeendet += 1
        },
      },
      kill: (signal?: string) => {
        zustand.getoetet.push(signal ?? 'SIGTERM')
        zustand.signalCode = signal ?? 'SIGTERM'
        return true
      },
    }
  }
  return { execFile: execFile as unknown as typeof import('node:child_process').execFile }
})

const { leseStromEigenschaften, liesStromEigenschaften, pruefeUniformitaet, vergleicheStroeme } =
  await import('../../src/main/ffmpeg-adapter/uniformitaet')

const FFPROBE = 'C:\\Program Files\\Signage Tool\\ffprobe.exe'

// ---------------------------------------------------------------------------
// Die gemessene Ausgangsgroesse
// ---------------------------------------------------------------------------

/**
 * Woertliche ffprobe-Ausgabe zu einem echten Zwischenclip (gemessen 15.08.2026).
 *
 * Die Felder, auf die es ankommt, sind hier ABSICHTLICH in ihrer Original-Schreibweise
 * stehengeblieben: `level: 40` als Zahl, `sample_rate: "48000"` als Zeichenkette,
 * `duration: "2.000000"` als Zeichenkette - und `field_order` gar nicht.
 */
const ECHTE_PROBE = {
  streams: [
    {
      index: 0,
      codec_name: 'h264',
      codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
      profile: 'High',
      codec_type: 'video',
      codec_tag_string: 'avc1',
      width: 1920,
      height: 1080,
      coded_width: 1920,
      coded_height: 1088,
      has_b_frames: 2,
      sample_aspect_ratio: '1:1',
      display_aspect_ratio: '16:9',
      pix_fmt: 'yuv420p',
      level: 40,
      color_range: 'tv',
      color_space: 'bt709',
      color_transfer: 'bt709',
      color_primaries: 'bt709',
      chroma_location: 'left',
      refs: 1,
      is_avc: 'true',
      nal_length_size: '4',
      r_frame_rate: '30/1',
      avg_frame_rate: '30/1',
      time_base: '1/15360',
      start_pts: 0,
      start_time: '0.000000',
      duration_ts: 30720,
      duration: '2.000000',
      bit_rate: '21872',
      bits_per_raw_sample: '8',
      nb_frames: '60',
      tags: { language: 'und', handler_name: 'VideoHandler', encoder: 'Lavc60.31.102 libx264' },
    },
    {
      index: 1,
      codec_name: 'aac',
      codec_long_name: 'AAC (Advanced Audio Coding)',
      profile: 'LC',
      codec_type: 'audio',
      codec_tag_string: 'mp4a',
      sample_fmt: 'fltp',
      sample_rate: '48000',
      channels: 1,
      channel_layout: 'mono',
      bits_per_sample: 0,
      r_frame_rate: '0/0',
      avg_frame_rate: '0/0',
      time_base: '1/48000',
      duration: '1.984000',
      bit_rate: '1567',
      max_bit_rate: '64000',
      nb_frames: '94',
      tags: { language: 'und', handler_name: 'SoundHandler' },
    },
  ],
  format: {
    filename: 'seg_0000.mp4',
    nb_streams: 2,
    nb_programs: 0,
    format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
    start_time: '0.000000',
    duration: '2.000000',
    size: '9484',
    bit_rate: '37936',
    probe_score: 100,
  },
}

/** Entpackt eine Ergebnis-Huelle - und macht ein unerwartetes `ok: false` sichtbar. */
function fordere<T>(ergebnis: Ergebnis<T>): T {
  if (!ergebnis.ok) {
    throw new Error(`Unerwartetes ok:false - ${ergebnis.fehler.code}: ${ergebnis.fehler.meldung}`)
  }
  return ergebnis.wert
}

/** Der Befund zum gemessenen Zwischenclip - die Grundlage aller Vergleichstests. */
const BASIS = fordere(leseStromEigenschaften(ECHTE_PROBE, 'seg_0000.mp4'))

/** Eine Kopie der gemessenen Ausgangsgroesse mit gezielt EINER Abweichung. */
function abgewandelt(
  datei: string,
  aendere: (befund: StromEigenschaften) => void = () => undefined,
): StromEigenschaften {
  const kopie = structuredClone(BASIS)
  kopie.datei = datei
  aendere(kopie)
  return kopie
}

/**
 * Ein Profil mit abgewandelten Werten.
 *
 * `RenderProfile` (#18) benutzt LITERALE Typen (`hoehe: 1080`), ein abweichender Wert ist
 * deshalb nicht direkt zuweisbar. Die Umtypung gehoert AUSSCHLIESSLICH hierher - im
 * Produktivcode ist sie verboten.
 */
function profilMit(aenderung: Record<string, unknown>): RenderProfile {
  return { ...RENDER_PROFILE, ...aenderung } as unknown as RenderProfile
}

/** Alle Abweichungen zu EINEM Feld. */
function zuFeld(abweichungen: Abweichung[], feld: string): Abweichung[] {
  return abweichungen.filter((a) => a.feld === feld)
}

// ---------------------------------------------------------------------------
// leseStromEigenschaften - gegen die gemessene Ausgabe
// ---------------------------------------------------------------------------

describe('leseStromEigenschaften an echter ffprobe-Ausgabe', () => {
  it('liest genau die Werte, die der Zwischenclip gemessen traegt', () => {
    expect(BASIS).toEqual({
      datei: 'seg_0000.mp4',
      dauerSekunden: 2,
      stromAnzahl: 2,
      stromArten: ['video', 'audio'],
      video: {
        codec: 'h264',
        profil: 'High',
        level: 40,
        breite: 1920,
        hoehe: 1080,
        pixelformat: 'yuv420p',
        bildrate: '30/1',
        mittlereBildrate: '30/1',
        zeitbasis: '1/15360',
        pixelSeitenverhaeltnis: '1:1',
        farbPrimaries: 'bt709',
        farbTransfer: 'bt709',
        farbMatrix: 'bt709',
        // GEMESSEN: ffprobe schreibt `field_order` bei diesem Material NICHT. Genau
        // deshalb darf ein fehlendes Feld keine Abweichung erzeugen - sonst waere JEDER
        // gesunde Lauf rot.
        feldreihenfolge: null,
        drehung: 0,
      },
      audio: { codec: 'aac', abtastrate: 48000, kanaele: 1 },
    })
  })

  it('liest die Dauer aus format.duration - der Zeichenkette, nicht der Video-Dauer', () => {
    // Nicht gerundet und nicht umgerechnet: Der einzige Verbraucher ist #180.
    const wert = fordere(
      leseStromEigenschaften(
        { ...ECHTE_PROBE, format: { ...ECHTE_PROBE.format, duration: '12.033000' } },
        'seg_0001.mp4',
      ),
    )
    expect(wert.dauerSekunden).toBe(12.033)
  })

  it('bevorzugt die Display-Matrix vor tags.rotate', () => {
    // GEMESSEN am 15.08.2026 an einer echten, mit `-display_rotation 90` erzeugten Datei:
    // ffprobe schreibt BEIDE Quellen - und sie widersprechen sich (90 gegen 270, zwei
    // Zaehlrichtungen). Wer nur `tags.rotate` liest, meldet die falsche Zahl; wer nur eine
    // von beiden liest, uebersieht die Haelfte der Faelle.
    const gedreht = structuredClone(ECHTE_PROBE) as Record<string, unknown>
    const stroeme = gedreht['streams'] as Record<string, unknown>[]
    stroeme[0] = {
      ...stroeme[0],
      side_data_list: [{ side_data_type: 'Display Matrix', rotation: 90 }],
      tags: { rotate: '270' },
    }
    expect(fordere(leseStromEigenschaften(gedreht, 'x.mp4')).video?.drehung).toBe(90)
  })

  it('liest tags.rotate, wenn es keine Display-Matrix gibt', () => {
    const gedreht = structuredClone(ECHTE_PROBE) as Record<string, unknown>
    const stroeme = gedreht['streams'] as Record<string, unknown>[]
    stroeme[0] = { ...stroeme[0], tags: { rotate: '180' } }
    expect(fordere(leseStromEigenschaften(gedreht, 'x.mp4')).video?.drehung).toBe(180)
  })

  it.each([
    ['kein Objekt', 42],
    ['kein streams-Feld', { format: { duration: '1' } }],
    ['kein format-Objekt', { streams: [] }],
    ['kein format.duration', { streams: [], format: {} }],
    ['duration nicht lesbar', { streams: [], format: { duration: 'N/A' } }],
    ['duration unendlich', { streams: [], format: { duration: 'Infinity' } }],
  ])('meldet %s als unbekannter_fehler statt zu werfen', (_name, roh) => {
    const ergebnis = leseStromEigenschaften(roh, 'seg_0000.mp4')
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(ergebnis.fehler.daten).toMatchObject({ datei: 'seg_0000.mp4' })
  })

  it('faellt bei fehlender Dauer NICHT auf 0 zurueck und liefert kein NaN', () => {
    // Eine stillschweigende 0 liesse in #180 JEDE Datei durchfallen, ein NaN JEDE
    // durchwinken - die Pruefung, die den abgebrochenen Encoder-Lauf abfangen soll, waere
    // wirkungslos, ohne dass irgendetwas fehlschlaegt.
    const ergebnis = leseStromEigenschaften({ streams: [], format: {} }, 'seg_0000.mp4')
    expect(ergebnis.ok).toBe(false)
  })

  it('meldet einen fehlenden Videostrom als Layout-Befund, nicht als Fehler-Huelle', () => {
    const nurTon = { ...ECHTE_PROBE, streams: [ECHTE_PROBE.streams[1]] }
    const wert = fordere(leseStromEigenschaften(nurTon, 'seg_0002.mp4'))
    expect(wert.video).toBeNull()
    expect(wert.stromArten).toEqual(['audio'])
    expect(wert.stromAnzahl).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// vergleicheStroeme - der Pruefkern
// ---------------------------------------------------------------------------

describe('vergleicheStroeme', () => {
  it('meldet ok und eine leere Liste bei zwei identischen, profilkonformen Befunden', () => {
    const befund = vergleicheStroeme(
      [abgewandelt('seg_0000.mp4'), abgewandelt('seg_0001.mp4')],
      RENDER_PROFILE,
    )
    expect(befund).toEqual({ ok: true, abweichungen: [] })
  })

  it('DIE FALLE: ein Segment ohne Audiostrom weicht im Feld stromArten ab', () => {
    // OHNE DIESE PRUEFUNG: `concat -c copy` bricht NICHT ab. Es meldet Exit-Code 0, keine
    // Warnung, und erzeugt eine Datei in erwartbarer Groesse - die am Fernseher nach dem
    // ersten Segment einfriert oder die Tonspur verliert. NACHGEMESSEN in #162
    // (ffmpeg 6.1.1): zwei Clips zu je 3 s, einer mit und einer ohne Tonspur, verkettet zu
    // 6,02 s Bild mit 3,008 s Ton - lautlos.
    //
    // Der typische Denkfehler, den das abfaengt: "Das Video hat keinen Ton, dann lasse ich
    // die Tonspur fuer dieses eine Segment weg - Ton ist ja optional." Die Tonspur ist NICHT
    // optional; sie muss in JEDEM Segment identisch vorhanden sein, gerade weil das
    // Ergebnis still ist (TK 9.2.6).
    const ohneTon = abgewandelt('seg_0001.mp4', (b) => {
      b.audio = null
      b.stromArten = ['video']
      b.stromAnzahl = 1
    })

    const befund = vergleicheStroeme([abgewandelt('seg_0000.mp4'), ohneTon], RENDER_PROFILE)

    expect(befund.ok).toBe(false)
    expect(zuFeld(befund.abweichungen, 'stromArten')).toEqual([
      { datei: 'seg_0001.mp4', feld: 'stromArten', erwartet: 'video, audio', gefunden: 'video' },
    ])
    expect(zuFeld(befund.abweichungen, 'stromAnzahl')).toEqual([
      { datei: 'seg_0001.mp4', feld: 'stromAnzahl', erwartet: '2', gefunden: '1' },
    ])
  })

  it('meldet auch dann, wenn ALLE Segmente die Tonspur vermissen', () => {
    // Zwei gleich falsche Segmente sind untereinander uniform. Der concat gelaenge - und
    // die Ausgabedatei waere trotzdem kaputt. Deshalb wird zusaetzlich gegen das PROFIL
    // geprueft.
    const ohneTon = (datei: string): StromEigenschaften =>
      abgewandelt(datei, (b) => {
        b.audio = null
        b.stromArten = ['video']
        b.stromAnzahl = 1
      })

    const befund = vergleicheStroeme([ohneTon('a.mp4'), ohneTon('b.mp4')], RENDER_PROFILE)
    expect(befund.ok).toBe(false)
    expect(zuFeld(befund.abweichungen, 'stromArten').map((a) => a.datei)).toEqual([
      'a.mp4',
      'b.mp4',
    ])
  })

  it.each<[string, (b: StromEigenschaften) => void, string, string]>([
    ['breite', (b) => void (b.video!.breite = 1280), '1920', '1280'],
    ['hoehe', (b) => void (b.video!.hoehe = 720), '1080', '720'],
    ['pixelformat', (b) => void (b.video!.pixelformat = 'yuv422p'), 'yuv420p', 'yuv422p'],
    ['bildrate', (b) => void (b.video!.bildrate = '25/1'), '30/1', '25/1'],
    ['zeitbasis', (b) => void (b.video!.zeitbasis = '1/30000'), '1/15360', '1/30000'],
    ['farbMatrix', (b) => void (b.video!.farbMatrix = 'bt601'), 'bt709', 'bt601'],
    [
      'pixelSeitenverhaeltnis',
      (b) => void (b.video!.pixelSeitenverhaeltnis = '4:3'),
      '1:1',
      '4:3',
    ],
    ['drehung', (b) => void (b.video!.drehung = 90), '0', '90'],
    ['level', (b) => void (b.video!.level = 31), '40', '31'],
    ['abtastrate', (b) => void (b.audio!.abtastrate = 44100), '48000', '44100'],
  ])(
    'meldet eine Abweichung in %s mit Datei, Feld, Erwartung und Fund',
    (feld, aendere, erwartet, gefunden) => {
      const befund = vergleicheStroeme(
        [abgewandelt('seg_0000.mp4'), abgewandelt('seg_0001.mp4', aendere)],
        RENDER_PROFILE,
      )

      expect(befund.ok).toBe(false)
      expect(zuFeld(befund.abweichungen, feld)).toEqual([
        { datei: 'seg_0001.mp4', feld, erwartet, gefunden },
      ])
    },
  )

  it('prueft die Zeitbasis NICHT gegen das Profil - gleiche, ungewoehnliche Werte sind ok', () => {
    // Der Wert ist encoderabhaengig und steht in keinem Profil. Er muss keinem Sollwert
    // entsprechen, aber ueber alle Segmente GLEICH sein.
    const seltsam = (datei: string): StromEigenschaften =>
      abgewandelt(datei, (b) => void (b.video!.zeitbasis = '1/90000'))

    expect(vergleicheStroeme([seltsam('a.mp4'), seltsam('b.mp4')], RENDER_PROFILE)).toEqual({
      ok: true,
      abweichungen: [],
    })
  })

  it('meldet die Zeitbasis auch dann, wenn das ERSTE Segment das ungewoehnliche ist', () => {
    const befund = vergleicheStroeme(
      [
        abgewandelt('seg_0000.mp4', (b) => void (b.video!.zeitbasis = '1/90000')),
        abgewandelt('seg_0001.mp4'),
      ],
      RENDER_PROFILE,
    )
    expect(zuFeld(befund.abweichungen, 'zeitbasis')).toEqual([
      { datei: 'seg_0001.mp4', feld: 'zeitbasis', erwartet: '1/90000', gefunden: '1/15360' },
    ])
  })

  it('meldet keine Abweichung, wenn die Feldreihenfolge in ALLEN Befunden fehlt', () => {
    // Das ist der gemessene Normalfall: ffprobe laesst `field_order` bei progressivem
    // Material weg.
    const befund = vergleicheStroeme(
      [abgewandelt('a.mp4'), abgewandelt('b.mp4')],
      RENDER_PROFILE,
    )
    expect(zuFeld(befund.abweichungen, 'feldreihenfolge')).toEqual([])
  })

  it('meldet eine Feldreihenfolge ungleich progressive', () => {
    const befund = vergleicheStroeme(
      [
        abgewandelt('a.mp4'),
        abgewandelt('b.mp4', (b) => void (b.video!.feldreihenfolge = 'tt')),
      ],
      RENDER_PROFILE,
    )
    expect(zuFeld(befund.abweichungen, 'feldreihenfolge')).toEqual([
      { datei: 'b.mp4', feld: 'feldreihenfolge', erwartet: 'progressive', gefunden: 'tt' },
    ])
  })

  it('nimmt ein fehlendes Pixel-Seitenverhaeltnis hin, wenn es ueberall fehlt', () => {
    const ohneSar = (datei: string): StromEigenschaften =>
      abgewandelt(datei, (b) => void (b.video!.pixelSeitenverhaeltnis = null))
    expect(
      vergleicheStroeme([ohneSar('a.mp4'), ohneSar('b.mp4')], RENDER_PROFILE).abweichungen,
    ).toEqual([])
  })

  it('meldet ein fehlendes Pixel-Seitenverhaeltnis, wenn es nur EINEM Segment fehlt', () => {
    const befund = vergleicheStroeme(
      [
        abgewandelt('a.mp4'),
        abgewandelt('b.mp4', (b) => void (b.video!.pixelSeitenverhaeltnis = null)),
      ],
      RENDER_PROFILE,
    )
    expect(zuFeld(befund.abweichungen, 'pixelSeitenverhaeltnis')).toEqual([
      {
        datei: 'b.mp4',
        feld: 'pixelSeitenverhaeltnis',
        erwartet: '1:1',
        gefunden: '(nicht gesetzt)',
      },
    ])
  })

  it('meldet fehlende Farbmetadaten - hier ist ein leeres Feld KEIN zulaessiger Sonderfall', () => {
    // "Ohne Metadaten RATEN Player, viele nehmen BT.601 an -> die Farben verschieben sich,
    // #FF4040 sieht am TV falsch aus." (TK 9.2.4)
    const ohneFarbe = (datei: string): StromEigenschaften =>
      abgewandelt(datei, (b) => {
        b.video!.farbPrimaries = null
        b.video!.farbTransfer = null
        b.video!.farbMatrix = null
      })

    const befund = vergleicheStroeme([ohneFarbe('a.mp4'), ohneFarbe('b.mp4')], RENDER_PROFILE)
    expect(befund.ok).toBe(false)
    expect(befund.abweichungen.map((a) => a.feld)).toEqual([
      'farbPrimaries',
      'farbTransfer',
      'farbMatrix',
      'farbPrimaries',
      'farbTransfer',
      'farbMatrix',
    ])
    expect(befund.abweichungen[0]).toEqual({
      datei: 'a.mp4',
      feld: 'farbPrimaries',
      erwartet: 'bt709',
      gefunden: '(nicht gesetzt)',
    })
  })

  it('sammelt ALLE Abweichungen, statt bei der ersten abzubrechen', () => {
    // Wer beim ersten Treffer abbricht, zwingt den Nutzer zu so vielen Durchlaeufen, wie es
    // Fehler gibt - nach jeweils einem mehrminuetigen Render.
    const kaputt = abgewandelt('seg_0001.mp4', (b) => {
      b.video!.breite = 1280
      b.video!.pixelformat = 'yuv422p'
      b.audio!.kanaele = 2
    })
    const befund = vergleicheStroeme([abgewandelt('seg_0000.mp4'), kaputt], RENDER_PROFILE)
    expect(befund.abweichungen.map((a) => a.feld).sort()).toEqual([
      'breite',
      'kanaele',
      'pixelformat',
    ])
  })

  it('meldet je Feld genau EINE Zeile, nicht eine je Pruefrichtung', () => {
    const befund = vergleicheStroeme(
      [abgewandelt('a.mp4'), abgewandelt('b.mp4', (v) => void (v.video!.breite = 1280))],
      RENDER_PROFILE,
    )
    expect(befund.abweichungen).toHaveLength(1)
  })

  it('bezieht die Sollwerte aus dem Profil - ein Profil mit hoehe 720 weist 1080er ab', () => {
    const befund = vergleicheStroeme(
      [abgewandelt('a.mp4'), abgewandelt('b.mp4')],
      profilMit({ hoehe: 720 }),
    )
    expect(zuFeld(befund.abweichungen, 'hoehe')).toEqual([
      { datei: 'a.mp4', feld: 'hoehe', erwartet: '720', gefunden: '1080' },
      { datei: 'b.mp4', feld: 'hoehe', erwartet: '720', gefunden: '1080' },
    ])
  })

  it('laesst auch die zwei UMGERECHNETEN Sollwerte mit dem Profil wandern', () => {
    // 'High' und 40 duerfen an der Vergleichsstelle nicht als Literal stehen: Der
    // Profilname kommt aus der benannten Tabelle, das Level wird aus profil.level
    // BERECHNET (3.1 -> 31). Sonst blieben beide bei einer Profilaenderung stehen.
    const befund = vergleicheStroeme(
      [abgewandelt('a.mp4')],
      profilMit({ profil: 'main', level: '3.1' }),
    )
    expect(befund.abweichungen).toEqual([
      { datei: 'a.mp4', feld: 'profil', erwartet: 'Main', gefunden: 'High' },
      { datei: 'a.mp4', feld: 'level', erwartet: '31', gefunden: '40' },
    ])
  })

  it('rechnet JEDES H.264-Level richtig in die ffprobe-Ganzzahl um', () => {
    // BEFUND (nachgemessen 15.08.2026): Die Begruendung des Issues - "Die Rundung faengt
    // die Fliesskomma-Ungenauigkeit von 4.1 * 10 ab" - trifft NICHT zu. In IEEE-754 ist
    // 4.1 * 10 exakt 41, und fuer KEIN H.264-Level von 1.0 bis 6.2 entsteht ein Rest. Das
    // Math.round ist damit harmlos, aber wirkungslos; es ist kein Grund, ihm zu vertrauen.
    // Belegt wird deshalb das, was zaehlt: dass jedes Level auf die Zahl fuehrt, die
    // ffprobe meldet.
    const level = ['1.0', '2.0', '2.1', '3.0', '3.1', '3.2', '4.0', '4.1', '5.0', '5.1', '6.2']
    for (const stufe of level) {
      const erwartet = String(Number(stufe) * 10)
      const befund = vergleicheStroeme(
        [abgewandelt('a.mp4', (b) => void (b.video!.level = Number(erwartet)))],
        profilMit({ level: stufe }),
      )
      expect(zuFeld(befund.abweichungen, 'level')).toEqual([])
      expect(Number.isInteger(Number(stufe) * 10)).toBe(true)
    }
  })

  it('meldet einen fehlenden Videostrom nur ueber das Layout, nicht mit 15 Folgezeilen', () => {
    const nurTon = abgewandelt('b.mp4', (b) => {
      b.video = null
      b.stromArten = ['audio']
      b.stromAnzahl = 1
    })
    const befund = vergleicheStroeme([abgewandelt('a.mp4'), nurTon], RENDER_PROFILE)
    expect(befund.abweichungen.map((a) => a.feld)).toEqual(['stromAnzahl', 'stromArten'])
  })
})

// ---------------------------------------------------------------------------
// Die Grep-Probe aus der Definition of Done
// ---------------------------------------------------------------------------

describe('Grep-Probe: keine Sollwerte als Literal im Quelltext', () => {
  /**
   * Der Quelltext OHNE Kommentare.
   *
   * WARUM OHNE: Der Block "Signatur (verbindlich)" des Issues traegt in seinen eigenen
   * Kommentaren die Beispielwerte ("erwartet 'High'", "erwartet 40", "erwartet 48000") und
   * ist woertlich zu uebernehmen. Eine Grep-Probe ueber die ROHE Datei stuende damit im
   * Widerspruch zur ebenfalls verbindlichen Signatur. Gemeint - und gefaehrlich - ist
   * allein der ausgefuehrte Code: Ein Literal DORT wanderte bei einer Profilaenderung nicht
   * mit. Ein Wort im Kommentar tut gar nichts.
   */
  const quelltext = readFileSync(
    new URL('../../src/main/ffmpeg-adapter/uniformitaet.ts', import.meta.url),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')

  it.each(['1920', '1080', '48000'])('enthaelt %s nicht als Literal', (zahl) => {
    expect(quelltext).not.toContain(zahl)
  })

  it('enthaelt die Bildrate 30 nicht als Literal', () => {
    // Als eigenstaendige Zahl - `15_360` oder `1024` duerfen 30 nicht faelschlich treffen.
    expect(quelltext).not.toMatch(/(?<![\w.])30(?![\w.])/)
  })

  it('enthaelt den Level-Sollwert 40 nicht - er wird berechnet', () => {
    expect(quelltext).not.toMatch(/(?<![\w.])40(?![\w.])/)
  })

  it('nennt High ausschliesslich in der Tabelle H264_PROFIL_ANZEIGE', () => {
    const treffer = [...quelltext.matchAll(/High/g)]
    expect(treffer).toHaveLength(1)
    const tabelle = /H264_PROFIL_ANZEIGE[\s\S]*?\}/.exec(quelltext)?.[0] ?? ''
    expect(tabelle).toContain("high: 'High'")
  })

  it('ermittelt den ffprobe-Pfad nicht selbst und baut keinen zweiten Prozessstarter', () => {
    // Der Binaerpfad reist als PARAMETER herein - VERBOTEN sind ein eigener Aufruf von
    // ermittleFfprobePfad() (#6), ein blankes 'ffprobe' als Befehlsname, ein Pfad aus PATH
    // und ein `spawn` neben #158.
    //
    // `ermittleFfprobePfad` DARF im Quelltext vorkommen - aber nur als Wort in einer
    // Fehlermeldung, die dem Leser sagt, woher der Pfad kommt. Verboten ist der AUFRUF.
    // Deshalb werden hier auch die Zeichenketten-Literale entfernt.
    const ohneTexte = quelltext
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    expect(ohneTexte).not.toContain('ermittleFfprobePfad')
    expect(ohneTexte).not.toContain('ffmpeg-pfad')
    expect(quelltext).not.toContain('process.env')
    expect(quelltext).not.toContain('spawn')
    expect(quelltext).not.toContain('shell')
    // Genau EIN Prozessstart in der ganzen Datei.
    expect([...quelltext.matchAll(/execFile/g)]).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// liesStromEigenschaften / pruefeUniformitaet - mit gestelltem Prozess
// ---------------------------------------------------------------------------

const AUSGABE = JSON.stringify(ECHTE_PROBE)

describe('liesStromEigenschaften', () => {
  beforeEach(() => {
    zustand.aufrufe = []
    zustand.antworten = new Map()
    zustand.stdinBeendet = 0
    zustand.getoetet = []
    zustand.offen = 0
    zustand.maxOffen = 0
    zustand.startWirft = null
    zustand.exitCode = null
    zustand.signalCode = null
  })

  it('ruft ffprobe mit dem verbindlichen Argument-Array auf - Datei zuletzt', async () => {
    const datei = 'C:\\Arbeit\\seg 0000.mp4'
    zustand.antworten.set(datei, { stdout: AUSGABE })

    const ergebnis = await liesStromEigenschaften(datei, FFPROBE)

    expect(fordere(ergebnis).video?.breite).toBe(1920)
    expect(fordere(ergebnis).datei).toBe(datei)
    expect(zustand.aufrufe).toHaveLength(1)
    expect(zustand.aufrufe[0]?.binaer).toBe(FFPROBE)
    expect(zustand.aufrufe[0]?.argumente).toEqual([
      '-v',
      'error',
      '-hide_banner',
      '-print_format',
      'json',
      '-show_streams',
      // OHNE -show_format gaebe es kein format.duration - und #180 muesste ffprobe ein
      // ZWEITES Mal rufen, was dort verboten ist.
      '-show_format',
      datei,
    ])
  })

  it('setzt Zeitgrenze, Puffergrenze und hartes Beenden ausdruecklich', async () => {
    zustand.antworten.set('a.mp4', { stdout: AUSGABE })
    await liesStromEigenschaften('a.mp4', FFPROBE)

    const optionen = zustand.aufrufe[0]?.optionen ?? {}
    // 15 s: grosszuegig fuer einen langsamen Datentraeger, kurz genug, dass ein Haenger
    // auffaellt. Ohne Grenze bliebe die GESAMTE Warteschlange stehen, ohne Fehler.
    expect(optionen['timeout']).toBe(15_000)
    expect(optionen['maxBuffer']).toBe(4 * 1024 * 1024)
    expect(optionen['killSignal']).toBe('SIGKILL')
    expect(optionen['windowsHide']).toBe(true)
    // Keine Shell - sonst zerlegte ein Leerzeichen im Pfad den Aufruf, und ein `&` im
    // Dateinamen schleuste einen fremden Befehl ein.
    expect(optionen['shell']).toBeUndefined()
  })

  it('schliesst die Standardeingabe, damit ffprobe nicht auf Eingabe wartet', async () => {
    // NACHGEMESSEN (Node 22): `execFile` reicht die Option `stdio` NICHT an `spawn` weiter -
    // ein `stdio: ['ignore', ...]` waere ein stiller Blindgaenger. Die Zusage haengt an
    // dieser Zeile.
    zustand.antworten.set('a.mp4', { stdout: AUSGABE })
    await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(zustand.stdinBeendet).toBe(1)
  })

  it.each([
    ['leerer Dateipfad', '', FFPROBE],
    ['Dateipfad beginnt mit -', '-rf', FFPROBE],
    ['Dateipfad mit Zeilenende', 'a\nb.mp4', FFPROBE],
    ['Dateipfad mit Nullzeichen', 'a\0b.mp4', FFPROBE],
    ['leerer ffprobe-Pfad', 'a.mp4', ''],
    ['ffprobe-Pfad beginnt mit -', 'a.mp4', '-v'],
  ])('weist %s ab, ohne einen Prozess zu starten', async (_name, datei, binaer) => {
    const ergebnis = await liesStromEigenschaften(datei, binaer)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.aufrufe).toHaveLength(0)
  })

  it('meldet ein fehlendes Binary als Verpackungsfehler mit Pfad und stderr', async () => {
    const fehler: ExecFehler = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' })
    zustand.antworten.set('a.mp4', { fehler, stderr: 'nichts da' })

    const ergebnis = await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(ergebnis.fehler.meldung).toContain('VERPACKUNGSFEHLER')
    expect(ergebnis.fehler.meldung).toContain(FFPROBE)
    expect(ergebnis.fehler.daten).toEqual({ datei: 'a.mp4', stderrAuszug: 'nichts da' })
  })

  it('nennt bei Zeitablauf die Zeitgrenze', async () => {
    const fehler: ExecFehler = Object.assign(new Error('timeout'), { killed: true })
    zustand.antworten.set('a.mp4', { fehler, stderr: '' })

    const ergebnis = await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.meldung).toContain('15000')
  })

  it('unterscheidet den Pufferueberlauf von der Zeitueberschreitung', async () => {
    // Node toetet den Prozess auch beim Pufferueberlauf und setzt dabei ebenfalls `killed`.
    // Bei umgekehrter Reihenfolge meldete JEDER Ueberlauf eine Zeitueberschreitung - eine
    // Spur, die in die falsche Richtung fuehrt.
    const fehler: ExecFehler = Object.assign(new Error('maxBuffer'), {
      code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
      killed: true,
    })
    zustand.antworten.set('a.mp4', { fehler, stderr: '' })

    const ergebnis = await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.meldung).toContain('Ausgabepuffer')
      expect(ergebnis.fehler.meldung).not.toContain('Zeitgrenze')
    }
  })

  it('beendet einen nach einem Fehler noch laufenden Prozess hart', async () => {
    // Ein weiterlaufendes ffprobe haelt den Datei-Handle - daraus entsteht auf Windows
    // spaeter das EBUSY beim Aufraeumen des Arbeitsbereichs T1.
    const fehler: ExecFehler = Object.assign(new Error('kaputt'), { code: 1 })
    zustand.antworten.set('a.mp4', { fehler, stderr: 'x' })

    await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(zustand.getoetet).toEqual(['SIGKILL'])
  })

  it.each([
    ['leere Ausgabe', ''],
    ['kein JSON', 'ffprobe version 6.1.1'],
  ])('meldet %s als unbekannter_fehler', async (_name, stdout) => {
    zustand.antworten.set('a.mp4', { stdout, stderr: 'stderr-Zeile' })
    const ergebnis = await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
      expect(ergebnis.fehler.daten).toMatchObject({ datei: 'a.mp4' })
    }
  })

  it('kuerzt einen geschwaetzigen stderr vom ENDE her - dort steht der Grund', async () => {
    const fehler: ExecFehler = Object.assign(new Error('x'), { code: 1 })
    const lang = `${'A'.repeat(900)}DER GRUND`
    zustand.antworten.set('a.mp4', { fehler, stderr: lang })

    const ergebnis = await liesStromEigenschaften('a.mp4', FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      const daten = ergebnis.fehler.daten as { stderrAuszug: string }
      expect(daten.stderrAuszug).toHaveLength(500)
      expect(daten.stderrAuszug.endsWith('DER GRUND')).toBe(true)
    }
  })
})

describe('pruefeUniformitaet', () => {
  beforeEach(() => {
    zustand.aufrufe = []
    zustand.antworten = new Map()
    zustand.stdinBeendet = 0
    zustand.getoetet = []
    zustand.offen = 0
    zustand.maxOffen = 0
    zustand.startWirft = null
  })

  it('meldet einen erfolgreichen Prueflauf mit ok:true, wenn alle Clips passen', async () => {
    for (const datei of ['a.mp4', 'b.mp4', 'c.mp4']) {
      zustand.antworten.set(datei, { stdout: AUSGABE })
    }
    const ergebnis = await pruefeUniformitaet(['a.mp4', 'b.mp4', 'c.mp4'], RENDER_PROFILE, FFPROBE)
    expect(fordere(ergebnis)).toEqual({ ok: true, abweichungen: [] })
  })

  it('liefert eine Abweichung als ERFOLGREICHEN Prueflauf mit wert.ok === false', async () => {
    // Eine Fehler-Huelle wuerde genau die Diagnose wegwerfen, die der Nutzer braucht, um zu
    // erfahren, WAS nicht passt.
    const ohneTon = { ...ECHTE_PROBE, streams: [ECHTE_PROBE.streams[0]] }
    zustand.antworten.set('a.mp4', { stdout: AUSGABE })
    zustand.antworten.set('b.mp4', { stdout: JSON.stringify(ohneTon) })

    const ergebnis = await pruefeUniformitaet(['a.mp4', 'b.mp4'], RENDER_PROFILE, FFPROBE)
    const befund = fordere(ergebnis)
    expect(befund.ok).toBe(false)
    expect(zuFeld(befund.abweichungen, 'stromArten')).toEqual([
      { datei: 'b.mp4', feld: 'stromArten', erwartet: 'video, audio', gefunden: 'video' },
    ])
  })

  it('liest die Dateien NACHEINANDER, nicht parallel', async () => {
    // Kein Prozessschwarm bei 200 Segmenten - und ein Ergebnis, dessen Reihenfolge
    // deterministisch ist.
    const dateien = ['a.mp4', 'b.mp4', 'c.mp4', 'd.mp4']
    for (const datei of dateien) zustand.antworten.set(datei, { stdout: AUSGABE })

    await pruefeUniformitaet(dateien, RENDER_PROFILE, FFPROBE)

    expect(zustand.maxOffen).toBe(1)
    expect(zustand.aufrufe.map((a) => a.argumente[a.argumente.length - 1])).toEqual(dateien)
  })

  it('bricht beim ersten unlesbaren Clip ab, statt ein Teilergebnis zu liefern', async () => {
    // Ein Befund ueber die Haelfte der Segmente sagt nichts darueber, ob die andere Haelfte
    // passt.
    const fehler: ExecFehler = Object.assign(new Error('kaputt'), { code: 1 })
    zustand.antworten.set('a.mp4', { stdout: AUSGABE })
    zustand.antworten.set('b.mp4', { fehler, stderr: 'moov atom not found' })
    zustand.antworten.set('c.mp4', { stdout: AUSGABE })

    const ergebnis = await pruefeUniformitaet(['a.mp4', 'b.mp4', 'c.mp4'], RENDER_PROFILE, FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
      expect(ergebnis.fehler.daten).toEqual({
        datei: 'b.mp4',
        stderrAuszug: 'moov atom not found',
      })
    }
    expect(zustand.aufrufe).toHaveLength(2)
  })

  it('weist eine leere Liste ab', async () => {
    const ergebnis = await pruefeUniformitaet([], RENDER_PROFILE, FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.aufrufe).toHaveLength(0)
  })

  it('nennt bei einem ungueltigen Pfad die Stelle in der Liste', async () => {
    const ergebnis = await pruefeUniformitaet(['a.mp4', '-rf'], RENDER_PROFILE, FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
      expect(ergebnis.fehler.meldung).toContain('Stelle 1')
    }
    // KEIN Prozess: Die Pruefung aller Pfade laeuft VOR dem ersten Aufruf.
    expect(zustand.aufrufe).toHaveLength(0)
  })

  it('weist einen leeren ffprobe-Pfad ab', async () => {
    const ergebnis = await pruefeUniformitaet(['a.mp4'], RENDER_PROFILE, '')
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('uebersetzt den Fehlercode NICHT in ffmpeg_fehler', async () => {
    // Die Verdichtung gehoert dem render-service (TK 9.2.3); diese Datei kennt dessen
    // Fehlercodes nicht und reicht den Rohbefund durch.
    const fehler: ExecFehler = Object.assign(new Error('x'), { code: 1 })
    zustand.antworten.set('a.mp4', { fehler, stderr: '' })
    const ergebnis = await pruefeUniformitaet(['a.mp4'], RENDER_PROFILE, FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).not.toBe('ffmpeg_fehler')
  })

  it('wirft auch dann nicht, wenn execFile selbst beim Start wirft', async () => {
    zustand.startWirft = new Error('EMFILE: too many open files')
    const ergebnis = await pruefeUniformitaet(['a.mp4'], RENDER_PROFILE, FFPROBE)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
      expect(ergebnis.fehler.meldung).toContain('EMFILE')
    }
  })
})
