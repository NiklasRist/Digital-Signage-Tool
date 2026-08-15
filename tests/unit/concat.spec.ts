import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'

// Verhaltenstest zu #169 (concat-Liste schreiben und verlustfrei verketten).
//
// WAS HIER GEPRUEFT WIRD UND WAS NICHT. Der Kern dieses Issues ist eine TEXTDATEI mit
// eigener Syntax - die laesst sich vollstaendig ohne ffmpeg pruefen, und genau das
// passiert hier: Escaping, Zeilenenden, Kodierung, Argument-Reihenfolge, Fehlerpfade
// und die Weitergabe an #158. Was hier grundsaetzlich NICHT belegt werden kann, ist,
// ob ffmpeg die entstandene Liste auch so liest, wie diese Datei sie meint - dafuer
// gibt es tests/integration/concat-echt.spec.ts, das mit einem Pfad faehrt, der ein
// LEERZEICHEN und einen APOSTROPH enthaelt.
//
// GESTELLT SIND ZWEI MODULE:
//   - `./prozess` (#158), weil sonst jeder Aufruf ein echtes ffmpeg startete. Die
//     Attrappe ist zugleich das Messgeraet: Sie haelt fest, WAS ankommt - und nur so
//     ist die Objektidentitaet der drei durchgereichten Felder pruefbar.
//   - `./tonspur` (#162), damit "die Container-Argumente stehen UNVERAENDERT an dieser
//     Stelle" wirklich geprueft wird und nicht bloss "irgendwo steht -movflags". Die
//     Attrappe liefert eine Kennung, die im echten Aufruf nie vorkaeme; ein zweiter
//     Fall liefert das leere Array (Profil-Aussage "aus") und belegt, dass concat.ts
//     dann NICHTS ergaenzt. Der echte Wert wird im Integrationstest gefahren.

const CONTAINER_KENNUNG = ['--container-aus-162-a', '--container-aus-162-b']

let containerArgumente: string[] = [...CONTAINER_KENNUNG]

vi.mock('../../src/main/ffmpeg-adapter/tonspur', () => ({
  baueContainerArgumente: (...args: unknown[]) => {
    containerAufrufe.push(args)
    return containerArgumente
  },
}))

const containerAufrufe: unknown[][] = []

interface FfmpegAufruf {
  argumente: readonly string[]
  aufAusgabeZeile?: unknown
  aufProzessStart?: unknown
  abbruchSignal?: unknown
}

const ffmpegAufrufe: FfmpegAufruf[] = []
let ffmpegAntwort: Ergebnis<void, 'ffmpeg_fehler' | 'ffmpeg_abgebrochen'> = {
  ok: true,
  wert: undefined,
}

vi.mock('../../src/main/ffmpeg-adapter/prozess', () => ({
  fuehreFfmpegAus: (lauf: FfmpegAufruf) => {
    ffmpegAufrufe.push(lauf)
    return Promise.resolve(ffmpegAntwort)
  },
}))

const {
  baueConcatArgumente,
  baueConcatListe,
  escapeFuerConcatListe,
  fuehreConcatAus,
  schreibeConcatListe,
} = await import('../../src/main/ffmpeg-adapter/concat')

const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-concat-'))

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true })
})

beforeEach(() => {
  ffmpegAufrufe.length = 0
  containerAufrufe.length = 0
  containerArgumente = [...CONTAINER_KENNUNG]
  ffmpegAntwort = { ok: true, wert: undefined }
})

/** Der Wert eines gelungenen Ergebnisses - oder ein sprechender Fehlschlag. */
function wert<T>(ergebnis: Ergebnis<T, string>): T {
  if (!ergebnis.ok) throw new Error(`Unerwartet fehlgeschlagen: ${ergebnis.fehler.meldung}`)
  return ergebnis.wert
}

/** Der Fehler eines fehlgeschlagenen Ergebnisses - oder ein sprechender Fehlschlag. */
function fehler<T>(ergebnis: Ergebnis<T, string>): {
  code: string
  meldung: string
  daten?: unknown
} {
  if (ergebnis.ok) throw new Error('Unerwartet gelungen.')
  return ergebnis.fehler
}

describe('escapeFuerConcatListe / baueConcatListe - das Escaping ist der Kern von #169', () => {
  it('erzeugt je Segment genau eine Zeile in der UEBERGEBENEN Reihenfolge, LF, mit Schluss-LF', () => {
    // Absichtlich NICHT alphabetisch: Die Reihenfolge des Arrays IST die
    // Wiedergabereihenfolge (TK 9.2.1). Wer hier sortierte, saehe richtig aus und
    // haette eine zweite Wahrheit neben der Liste des render-service.
    const text = wert(
      baueConcatListe(['C:\\T\\seg_0003.mp4', 'C:\\T\\seg_0001.mp4', 'C:\\T\\seg_0002.mp4']),
    )

    expect(text).toBe(
      "file 'C:\\T\\seg_0003.mp4'\n" +
        "file 'C:\\T\\seg_0001.mp4'\n" +
        "file 'C:\\T\\seg_0002.mp4'\n",
    )
    expect(text.endsWith('\n')).toBe(true)
    expect(text).not.toContain('\r')
    expect(text.split('\n').filter((z) => z.length > 0)).toHaveLength(3)
  })

  it('setzt jeden Pfad in einfache Anfuehrungszeichen und laesst Backslashes UNVERAENDERT', () => {
    // Gemessen am echten Binary (15.08.2026): Ohne Anfuehrung frisst ffmpegs
    // Zeilen-Parser JEDEN Backslash und bricht zusaetzlich am Leerzeichen ab -
    // uebrig blieb "C:UsersacerAppData...Max". Mit verdoppelten Backslashes wird
    // aus dem Pfad einer, den es nicht gibt.
    expect(wert(baueConcatListe(['C:\\Temp\\seg 1.mp4']))).toBe("file 'C:\\Temp\\seg 1.mp4'\n")
    expect(escapeFuerConcatListe('C:\\Temp\\seg 1.mp4')).toBe('C:\\Temp\\seg 1.mp4')
  })

  it("schreibt einen Apostroph als '\\'' - die einzige Ersetzung", () => {
    expect(wert(baueConcatListe(["C:\\Users\\Max O'Neil\\a.mp4"]))).toBe(
      "file 'C:\\Users\\Max O'\\''Neil\\a.mp4'\n",
    )
  })

  it('entschaerft ein fuehrendes # durch die Anfuehrung (sonst waere die Zeile ein Kommentar)', () => {
    expect(wert(baueConcatListe(['/tmp/#seg.mp4']))).toBe("file '/tmp/#seg.mp4'\n")
  })

  it('nimmt KEINE weitere Ersetzung vor - Sonderzeichen und Umlaute stehen buchstaeblich da', () => {
    const wild = 'C:\\Übung "Kür"; a,b [1]\\seg.mp4'
    const zeile = wert(baueConcatListe([wild]))

    // Zwischen den beiden aeusseren Anfuehrungszeichen steht der Pfad UNANGETASTET.
    expect(zeile).toBe(`file '${wild}'\n`)
    expect(zeile.slice("file '".length, -"'\n".length)).toBe(wild)
  })
})

describe('baueConcatListe - Fehlerpfade', () => {
  it('weist ein leeres Array ab', () => {
    expect(fehler(baueConcatListe([])).code).toBe('ungueltige_eingabe')
  })

  it('weist einen leeren Segmentpfad ab und nennt die Position', () => {
    const f = fehler(baueConcatListe(['C:\\T\\a.mp4', '']))
    expect(f.code).toBe('ungueltige_eingabe')
    expect(f.meldung).toContain('1')
  })

  it('weist einen Zeilenumbruch im Pfad ab - er erzeugte in der Liste ZWEI Zeilen', () => {
    expect(fehler(baueConcatListe(['C:\\T\\a\nfile evil.mp4'])).code).toBe('ungueltige_eingabe')
  })

  it('weist ein Nullzeichen im Pfad ab', () => {
    expect(fehler(baueConcatListe(['C:\\T\\a\0.mp4'])).code).toBe('ungueltige_eingabe')
  })

  it('weist einen doppelten Segmentpfad ab und nennt BEIDE Positionen', () => {
    // Nicht stillschweigend entfernen: Ein Duplikat verlaengerte die fertige Ausgabe
    // unbemerkt.
    const f = fehler(baueConcatListe(['C:\\T\\a.mp4', 'C:\\T\\b.mp4', 'C:\\T\\a.mp4']))
    expect(f.code).toBe('ungueltige_eingabe')
    expect(f.meldung).toContain('0')
    expect(f.meldung).toContain('2')
  })

  it('wirft bei keiner Eingabe - auch nicht bei voellig falschen Werten', () => {
    for (const eingabe of [
      undefined,
      null,
      'kein Array',
      [42],
      [undefined],
    ] as unknown as string[][]) {
      expect(() => baueConcatListe(eingabe)).not.toThrow()
      expect(baueConcatListe(eingabe).ok).toBe(false)
    }
  })
})

describe('schreibeConcatListe', () => {
  it('schreibt UTF-8 OHNE Byte-Reihenfolge-Marke, mit LF, Umlaut als Zwei-Byte-Folge', async () => {
    const ziel = path.join(arbeitsordner, 'liste-utf8.txt')
    const inhalt = wert(baueConcatListe(['C:\\Übung\\seg 1.mp4']))

    expect((await schreibeConcatListe(inhalt, ziel)).ok).toBe(true)

    const rohBytes = readFileSync(ziel)
    // Eine Marke am Anfang machte die erste `file`-Direktive unlesbar - und der
    // Fehler traete gerade nicht auf dem Entwicklungsrechner auf.
    expect([...rohBytes.subarray(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf])
    expect(rohBytes[0]).toBe('f'.charCodeAt(0))
    // Ü = U+00DC = C3 9C
    expect([...rohBytes].join(',')).toContain('195,156')
    expect(rohBytes.includes(0x0d)).toBe(false)
    expect(rohBytes[rohBytes.length - 1]).toBe(0x0a)
  })

  it('liefert bei einem Schreibfehler unbekannter_fehler mit systemFehlercode - kein throw', async () => {
    const ziel = path.join(arbeitsordner, 'gibt-es-nicht', 'tiefer', 'liste.txt')

    const ergebnis = await schreibeConcatListe('file \'x\'\n', ziel)

    const f = fehler(ergebnis)
    expect(f.code).toBe('unbekannter_fehler')
    // Der Systemcode wird DURCHGEREICHT: Nur damit kann der render-service daraus
    // kein_platz bzw. speicher_fehler machen (TK 9.2.3).
    const daten = f.daten as { systemFehlercode?: string; datei?: string }
    expect(daten.systemFehlercode).toBe('ENOENT')
    expect(daten.datei).toBe(ziel)
  })
})

describe('baueConcatArgumente', () => {
  const LISTE = 'C:\\Temp\\reel-3f2a\\liste.txt'
  const ZIEL = 'C:\\Projekte\\p1\\output\\Sommer 2026.mp4.part'

  it('liefert die Argumente in genau der vorgegebenen Reihenfolge; das Ziel ist das LETZTE', () => {
    const args = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))

    expect(args).toEqual([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      LISTE,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-c',
      'copy',
      ...CONTAINER_KENNUNG,
      '-map_metadata',
      '-1',
      // PFLICHT wegen der Endung .part: ffmpeg raet den Muxer aus der Dateiendung
      // und kennt .part nicht. Am echten Binary gemessen - ohne diese Angabe
      // "Unable to choose an output format", Exit 127.
      '-f',
      'mp4',
      ZIEL,
    ])
    expect(args[args.length - 1]).toBe(ZIEL)
  })

  it('enthaelt -f concat und -safe 0, und -safe 0 steht VOR -i', () => {
    const args = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))

    expect(args[args.indexOf('-f') + 1]).toBe('concat')
    const safe = args.indexOf('-safe')
    expect(args[safe + 1]).toBe('0')
    expect(safe).toBeLessThan(args.indexOf('-i'))
  })

  it('kopiert nur - kein einziges Kodier-Argument (einziger verlustfreier Schritt)', () => {
    const args = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))

    expect(args[args.indexOf('-c') + 1]).toBe('copy')
    for (const verboten of [
      '-c:v',
      '-c:a',
      '-b:v',
      '-crf',
      '-preset',
      '-filter_complex',
      '-vf',
    ]) {
      // Jedes davon codierte neu: doppelte Renderzeit, verlorene Qualitaet - und es
      // VERDECKTE eine Uniformitaetsverletzung, statt sie sichtbar zu machen (#170).
      expect(args).not.toContain(verboten)
    }
  })

  it('setzt genau zwei -map-Argumente in der Reihenfolge 0:v:0, 0:a:0', () => {
    const args = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))
    const maps = args.filter((_, i) => args[i - 1] === '-map')

    expect(args.filter((a) => a === '-map')).toHaveLength(2)
    expect(maps).toEqual(['0:v:0', '0:a:0'])
  })

  it('setzt die Container-Argumente aus #162 unveraendert an ihre Stelle und ergaenzt nichts', () => {
    // Die Attrappe fuer #162 liefert hier eine Kennung, die im echten Aufruf nie
    // vorkaeme - nur so belegt der Test die STELLE und die UNVERAENDERTHEIT statt
    // bloss "irgendwo steht ein Container-Flag".
    const args = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))
    expect(args.slice(args.indexOf('copy') + 1, args.indexOf('-map_metadata'))).toEqual(
      CONTAINER_KENNUNG,
    )
    expect(containerAufrufe).toEqual([[RENDER_PROFILE]])

    // Liefert #162 nichts (Profil-Aussage "aus"), ergaenzt diese Datei NICHTS.
    containerArgumente = []
    const ohne = wert(baueConcatArgumente(LISTE, ZIEL, RENDER_PROFILE))
    expect(ohne.slice(ohne.indexOf('copy') + 1, ohne.indexOf('-map_metadata'))).toEqual([])
    expect(ohne.some((a) => a.includes('faststart'))).toBe(false)
  })

  it('weist leere Pfade, fuehrende Bindestriche, Steuerzeichen und Gleichheit ab', () => {
    const faelle: [string, string][] = [
      ['', ZIEL],
      [LISTE, ''],
      ['-y', ZIEL],
      [LISTE, '-y'],
      ['C:\\T\\a\nb.txt', ZIEL],
      [LISTE, 'C:\\T\\a\0b.part'],
      [LISTE, LISTE],
    ]
    for (const [liste, ziel] of faelle) {
      const ergebnis = baueConcatArgumente(liste, ziel, RENDER_PROFILE)
      expect(fehler(ergebnis).code).toBe('ungueltige_eingabe')
    }
  })
})

describe('fuehreConcatAus - die Weitergabe an #158', () => {
  const ZIEL = path.join(arbeitsordner, 'ausgabe.mp4.part')

  function listenPfad(name: string): string {
    return path.join(arbeitsordner, name)
  }

  it('ruft fuehreFfmpegAus mit einem OBJEKT und dem gebauten Argument-Array', async () => {
    const liste = listenPfad('lauf-a.txt')
    const segmente = ['C:\\T\\seg_0001.mp4', 'C:\\T\\seg_0002.mp4']

    const ergebnis = await fuehreConcatAus(segmente, liste, ZIEL, RENDER_PROFILE)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
    expect(ffmpegAufrufe).toHaveLength(1)
    const aufruf = ffmpegAufrufe[0]
    expect(aufruf).toBeDefined()
    // Ein Objekt mit dem Feld `argumente` - nicht das Array direkt.
    expect(Array.isArray(aufruf)).toBe(false)
    expect(aufruf?.argumente).toEqual(wert(baueConcatArgumente(liste, ZIEL, RENDER_PROFILE)))
    // Und die Liste liegt wirklich auf der Platte, mit dem erwarteten Inhalt.
    expect(readFileSync(liste, 'utf8')).toBe(wert(baueConcatListe(segmente)))
  })

  it('reicht aufAusgabeZeile, aufProzessStart und abbruchSignal IDENTISCH durch', async () => {
    // Fehlt das Durchreichen, ist der Abbrechen-Knopf genau waehrend des Schritts
    // wirkungslos, der die .part-Datei schreibt - und der Fortschrittsbalken steht
    // im laengsten Schritt still. Beides faellt in keinem anderen Test auf.
    const aufAusgabeZeile = (): void => undefined
    const aufProzessStart = (): void => undefined
    const abbruchSignal = new AbortController().signal

    await fuehreConcatAus(
      ['C:\\T\\seg_0001.mp4'],
      listenPfad('lauf-b.txt'),
      ZIEL,
      RENDER_PROFILE,
      { aufAusgabeZeile, aufProzessStart, abbruchSignal },
    )

    const aufruf = ffmpegAufrufe[0]
    expect(aufruf?.aufAusgabeZeile).toBe(aufAusgabeZeile)
    expect(aufruf?.aufProzessStart).toBe(aufProzessStart)
    expect(aufruf?.abbruchSignal).toBe(abbruchSignal)
  })

  it('erfindet ohne lauf nichts - die drei Felder sind dann nicht gesetzt', async () => {
    await fuehreConcatAus(['C:\\T\\seg_0001.mp4'], listenPfad('lauf-c.txt'), ZIEL, RENDER_PROFILE)

    const aufruf = ffmpegAufrufe[0]
    expect(aufruf?.aufAusgabeZeile).toBeUndefined()
    expect(aufruf?.aufProzessStart).toBeUndefined()
    expect(aufruf?.abbruchSignal).toBeUndefined()
    expect(Object.keys(aufruf ?? {})).toEqual(['argumente'])
  })

  it('reicht das Ergebnis von #158 UNVERAENDERT durch - auch den Fehlercode', async () => {
    for (const code of ['ffmpeg_fehler', 'ffmpeg_abgebrochen'] as const) {
      ffmpegAufrufe.length = 0
      ffmpegAntwort = { ok: false, fehler: { code, meldung: `Wortlaut von #158: ${code}` } }

      const ergebnis = await fuehreConcatAus(
        ['C:\\T\\seg_0001.mp4'],
        listenPfad(`lauf-${code}.txt`),
        ZIEL,
        RENDER_PROFILE,
      )

      // Keine Uebersetzung, keine Umformulierung: die Verdichtung gehoert dem
      // render-service (TK 9.2.3).
      expect(ergebnis).toEqual(ffmpegAntwort)
    }
  })

  it('startet ffmpeg NICHT, wenn das Schreiben der Liste fehlschlaegt', async () => {
    const ergebnis = await fuehreConcatAus(
      ['C:\\T\\seg_0001.mp4'],
      path.join(arbeitsordner, 'gibt-es-nicht', 'liste.txt'),
      ZIEL,
      RENDER_PROFILE,
    )

    expect(fehler(ergebnis).code).toBe('unbekannter_fehler')
    expect((fehler(ergebnis).daten as { systemFehlercode?: string }).systemFehlercode).toBe('ENOENT')
    expect(ffmpegAufrufe).toHaveLength(0)
  })

  it('startet ffmpeg NICHT und schreibt nichts, wenn die Eingabe ungueltig ist', async () => {
    const faelle: [string[], string, string][] = [
      [[], listenPfad('nie-a.txt'), ZIEL],
      [['C:\\T\\a\nb.mp4'], listenPfad('nie-b.txt'), ZIEL],
      [['C:\\T\\a.mp4', 'C:\\T\\a.mp4'], listenPfad('nie-c.txt'), ZIEL],
      [['C:\\T\\a.mp4'], ZIEL, ZIEL],
      [['C:\\T\\a.mp4'], '-y', ZIEL],
      // Die Listendatei bzw. die Zieldatei ist zugleich ein Zwischenclip: Der Lauf
      // ueberschriebe seine eigene Eingabe. Keine der beiden Einzelpruefungen kann
      // das sehen - ihr fehlt jeweils die andere Seite.
      [['C:\\T\\a.mp4'], 'C:\\T\\a.mp4', ZIEL],
      [['C:\\T\\a.mp4'], listenPfad('nie-d.txt'), 'C:\\T\\a.mp4'],
    ]

    for (const [segmente, liste, ziel] of faelle) {
      const ergebnis = await fuehreConcatAus(segmente, liste, ziel, RENDER_PROFILE)
      expect(fehler(ergebnis).code).toBe('ungueltige_eingabe')
    }
    expect(ffmpegAufrufe).toHaveLength(0)
  })
})

describe('Abgrenzung zum festen Vorspann aus #158 (Grep-Probe ueber die Quelldatei)', () => {
  it('wiederholt kein Betriebsflag und tippt das Container-Flag nicht selbst', () => {
    const quelle = readFileSync(
      new URL('../../src/main/ffmpeg-adapter/concat.ts', import.meta.url),
      'utf8',
    )

    // Diese sechs setzt #158 fuer JEDEN Aufruf voran. Doppelt gesetzt sind sie je
    // nach Stellung wirkungslos oder ueberschreiben sich gegenseitig. Gesucht wird
    // die LITERAL-Form, in der ein Argument hier stehen wuerde.
    for (const flagge of [
      'hide_banner',
      'nostdin',
      'loglevel',
      'progress',
      'nostats',
      "'-y'",
    ]) {
      expect(quelle).not.toContain(flagge)
    }

    // Das Container-Flag liefert baueContainerArgumente (#162) - es steht hier nicht
    // als Literal.
    expect(quelle).not.toContain('+faststart')
    expect(quelle).not.toContain('movflags')
  })
})
