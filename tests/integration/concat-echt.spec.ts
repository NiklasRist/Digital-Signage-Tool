import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Integrationstest zu #169: die concat-Liste gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT. Der Unit-Test prueft Zeichenketten. Genau das, worum es in
// diesem Issue geht, kann er deshalb NICHT belegen: ob ffmpegs eigener Zeilen-Parser
// die Liste so liest, wie sie gemeint ist. Die concat-Liste hat ANDERE
// Anfuehrungs- und Escaping-Regeln als die Kommandozeile, und ein falsch
// geschriebener Eintrag bricht entweder ab - oder bindet still die falsche Datei ein.
//
// DER ARBEITSORDNER IST DESHALB ABSICHTLICH BOESE: Er traegt einen APOSTROPH
// ("Max O'Neil dir"), und die Segmentdateien tragen ein LEERZEICHEN ("seg 1.mp4").
// Das sind die beiden Zeichen, an denen die Liste kippt:
//   - der Apostroph beendet die Anfuehrung (deshalb '\'' als einzige Ersetzung),
//   - das Leerzeichen ist AUSSERHALB der Anfuehrung ein Feldtrenner.
// Ein Ordner ohne beides liefe auch mit falschem Escaping gruen durch.
//
// GEMESSEN AM 15.08.2026 (ffmpeg 6.1.1 aus ffmpeg-static, Windows x64) - zur
// Einordnung, was dieser Test verhindert: Dieselben drei Segmente, mit einer Liste
// OHNE Anfuehrungszeichen: Exit 127, "Impossible to open 'C:UsersacerAppData...Max'"
// (jeder Backslash gefressen, am Leerzeichen abgeschnitten). Mit VERDOPPELTEN
// Backslashes: Exit 127, "Impossible to open '...\\Max O\Neil'".
//
// Gefahren wird der PRODUKTIVWEG: `fuehreConcatAus` schreibt die Liste selbst und
// ruft `fuehreFfmpegAus` (#158) samt festem Vorspann - genau der Weg, den der
// render-service (#181) spaeter nimmt.

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import('../../src/main/ffmpeg-pfad')
const { fuehreConcatAus } = await import('../../src/main/ffmpeg-adapter/concat')
const { RENDER_PROFILE } = await import('../../src/shared/contracts/render-profile')

const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-concat-echt-'))

/** Der boese Unterordner: Apostroph im Namen. */
const boeserOrdner = path.join(arbeitsordner, "Max O'Neil dir")

/** So viele Segmente, jedes eine Sekunde lang. */
const SEGMENTE = 3
const SEKUNDEN_JE_SEGMENT = 1

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true })
})

/**
 * Drei uniforme Zwischenclips mit Leerzeichen im Dateinamen.
 *
 * Klein (320x180) statt 1920x1080: Fuer die Frage dieses Tests - findet ffmpeg die
 * Dateien und haengt es sie vollstaendig aneinander - ist die Bildgroesse
 * gleichgueltig, und der Lauf bleibt schnell. Uniform sind sie trotzdem: gleicher
 * Codec, gleiche Groesse, gleiche Bildrate, geschlossene GOP mit Schluesselbild am
 * Anfang (Bedingung fuer `-c copy`, TK 9.2.6), stille Tonspur wie im Profil.
 */
function erzeugeSegmente(): string[] {
  mkdirSync(boeserOrdner, { recursive: true })
  const fps = RENDER_PROFILE.fps
  const pfade: string[] = []

  for (let n = 1; n <= SEGMENTE; n += 1) {
    const ziel = path.join(boeserOrdner, `seg ${String(n)}.mp4`)
    execFileSync(ermittleFfmpegPfad(), [
      '-y', '-loglevel', 'error',
      '-f', 'lavfi',
      '-i', `color=c=black:s=320x180:r=${String(fps)}:d=${String(SEKUNDEN_JE_SEGMENT)}`,
      '-f', 'lavfi',
      '-i', `anullsrc=r=${String(RENDER_PROFILE.audio.sampleRateHz)}:cl=mono`,
      '-c:v', 'libx264',
      '-pix_fmt', RENDER_PROFILE.pixelformat,
      '-g', String(fps), '-keyint_min', String(fps), '-sc_threshold', '0',
      '-c:a', RENDER_PROFILE.audio.codec,
      '-ar', String(RENDER_PROFILE.audio.sampleRateHz),
      '-ac', String(RENDER_PROFILE.audio.kanaele),
      '-shortest',
      ziel,
    ])
    pfade.push(ziel)
  }
  return pfade
}

/** Ein ffprobe-Feld der fertigen Datei. */
function probe(datei: string, argumente: string[]): string {
  return execFileSync(ermittleFfprobePfad(), ['-v', 'error', ...argumente, datei])
    .toString()
    .trim()
}

let segmentPfade: string[] = []

beforeAll(() => {
  segmentPfade = erzeugeSegmente()
})

describe('#169 gegen das echte ffmpeg', () => {
  it('verkettet drei Segmente aus einem Pfad mit Apostroph und Leerzeichen VOLLSTAENDIG', async () => {
    const listenPfad = path.join(boeserOrdner, 'concat liste.txt')
    // Die Endung .part wie im Produktivpfad - sie ist der Grund, warum der Aufruf
    // das Ausgabeformat ausdruecklich nennen muss.
    const zielPfad = path.join(arbeitsordner, "Sommer O'26.mp4.part")

    /** Die Zeilen, die ueber den durchgereichten Rueckruf ankommen. */
    const zeilen: string[] = []

    const ergebnis = await fuehreConcatAus(
      segmentPfade,
      listenPfad,
      zielPfad,
      RENDER_PROFILE,
      { aufAusgabeZeile: (zeile) => zeilen.push(zeile) },
    )

    expect(ergebnis).toEqual({ ok: true, wert: undefined })

    // Die geschriebene Liste - so, wie ffmpeg sie eben gelesen hat.
    const liste = readFileSync(listenPfad, 'utf8')
    expect(liste).toContain("O'\\''Neil")
    expect(liste).not.toContain('\\\\')

    // DIE EIGENTLICHE FRAGE: Ist ALLES drin? `-c copy` meldet auch dann Erfolg, wenn
    // es Material verliert - eine Datei, die nur "existiert" und "sich oeffnen laesst",
    // ist KEIN Beleg. Deshalb wird die Bildzahl gezaehlt.
    const bilder = Number(
      probe(zielPfad, [
        '-select_streams', 'v:0',
        '-count_frames',
        '-show_entries', 'stream=nb_read_frames',
        '-of', 'default=nw=1:nk=1',
      ]),
    )
    expect(bilder).toBe(SEGMENTE * SEKUNDEN_JE_SEGMENT * RENDER_PROFILE.fps)

    // Und die Tonspur ist noch da: Ein still abgeschnittener Ton ist der Fehler, den
    // dieses Projekt experimentell erlebt hat.
    expect(probe(zielPfad, ['-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'default=nw=1:nk=1'])).toBe(
      RENDER_PROFILE.audio.codec,
    )

    // Der Index steht VOR den Mediendaten - die Container-Argumente aus #162 wirken
    // an dieser Stelle (TK 9.2.4).
    const kopf = readFileSync(zielPfad).subarray(0, 512).toString('latin1')
    expect(kopf.indexOf('moov')).toBeGreaterThan(-1)
    expect(kopf.indexOf('moov')).toBeLessThan(kopf.indexOf('mdat') === -1 ? 512 : kopf.indexOf('mdat'))

    // Der durchgereichte Rueckruf hat wirklich Zeilen bekommen - der feste Vorspann
    // aus #158 traegt die Fortschrittsausgabe, und sie kommt bis hierher durch.
    expect(zeilen.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // BEFUND (15.08.2026, gemessen - NICHT vermutet): EIN FEHLENDES SEGMENT AB DER
  // ZWEITEN POSITION MELDET ERFOLG.
  //
  // Die Erwartung war, dass ein Pfad in der Liste, zu dem es keine Datei gibt, den
  // Lauf abbrechen laesst. Gemessen wurde:
  //
  //   fehlt das ERSTE Segment      -> Exit 127, "Error opening input file"
  //   fehlt ein SPAETERES Segment  -> EXIT 0, Ausgabedatei entsteht, ABGESCHNITTEN
  //
  // Im zweiten Fall steht der Grund nur auf stderr ("Impossible to open ... | Error
  // during demuxing"), waehrend der Rueckgabewert Erfolg sagt. Nachgezaehlt: bei
  // drei Segmenten und einem fehlenden an Position 2 enthielt die Ausgabe 30 statt
  // 90 Bilder - eine Datei, die sich oeffnen laesst und ein Drittel lang ist.
  //
  // WARUM DAS HIER NICHT REPARIERT WIRD: Das Issue verbietet dieser Datei
  // ausdruecklich, eine fehlende Zwischendatei zu ueberbruecken oder das Ergebnis
  // von #158 zu deuten - "das Ergebnis wird UNVERAENDERT durchgereicht". Und #158
  // macht aus dem Exit-Code bewusst keinen Fehlercode. Die Stelle, die diesen Fall
  // faengt, ist die Verifikation in #180: Sie misst die Dauer der fertigen Datei
  // gegen die Solldauer mit einer festen Toleranz von 0,5 s
  // (DAUER_TOLERANZ_SEKUNDEN in src/main/render-service/ausgabe-platzieren.ts) und
  // schlaegt bei einem fehlenden Segment an. Dieser Test haelt den Befund fest,
  // damit niemand die Sicherung fuer entbehrlich haelt: OHNE #180 gaebe es KEINE.
  it('meldet Erfolg, obwohl ein spaeteres Segment fehlt - deshalb ist #180 unverzichtbar', async () => {
    const zielPfad = path.join(arbeitsordner, 'unvollstaendig.mp4.part')

    const ergebnis = await fuehreConcatAus(
      [segmentPfade[0] as string, path.join(boeserOrdner, 'gibt es nicht.mp4'), segmentPfade[2] as string],
      path.join(boeserOrdner, 'liste fehlend.txt'),
      zielPfad,
      RENDER_PROFILE,
    )

    expect(ergebnis).toEqual({ ok: true, wert: undefined })

    const bilder = Number(
      probe(zielPfad, [
        '-select_streams', 'v:0',
        '-count_frames',
        '-show_entries', 'stream=nb_read_frames',
        '-of', 'default=nw=1:nk=1',
      ]),
    )
    // Ein Drittel statt drei Dritteln - und ffmpeg sagt "in Ordnung".
    expect(bilder).toBe(SEKUNDEN_JE_SEGMENT * RENDER_PROFILE.fps)
  })
})
