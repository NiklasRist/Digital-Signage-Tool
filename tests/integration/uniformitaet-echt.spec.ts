import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

// Integrationstest zu #170: das ECHTE ffprobe.exe an einem ECHTEN Zwischenclip.
//
// WARUM ES IHN GIBT. Der Unit-Test zu #170 stellt `child_process` und arbeitet auf einer
// eingefrorenen, gemessenen ffprobe-Ausgabe. Zwei Dinge kann er deshalb grundsaetzlich
// nicht zeigen: (1) dass der ueber #6 ermittelte Pfad zu einem lauffaehigen Binary
// fuehrt, und (2) dass ein mit den Argumenten aus #161/#162 erzeugter Zwischenclip die
// Pruefung TATSAECHLICH besteht. Punkt 2 ist der teure: Waere ein einziger Sollwert in
// #170 anders geschrieben als in den Encoder-Argumenten - `high` gegen `High`, `4.0`
// gegen `40`, `30/1` gegen `30000/1001` -, wuerde die Pruefung JEDEN gesunden Lauf
// abweisen. Die Attrappe kann das nicht bemerken, weil sie beide Seiten aus derselben
// Vorstellung speist.
//
// Er laeuft NUR ueber `npm run test:integration` - er startet ffmpeg und ffprobe und
// schreibt Dateien auf die Platte.

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import('../../src/main/ffmpeg-pfad')
const { baueVideoKodierArgumente } = await import(
  '../../src/main/ffmpeg-adapter/encoder-argumente'
)
const { baueStilleTonspurEingang, baueTonspurKodierArgumente, baueTonspurMapping } = await import(
  '../../src/main/ffmpeg-adapter/tonspur'
)
const { leseStromEigenschaften, liesStromEigenschaften, pruefeUniformitaet } = await import(
  '../../src/main/ffmpeg-adapter/uniformitaet'
)

const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-uniformitaet-'))

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true })
})

/**
 * Ein echter Zwischenclip - erzeugt mit GENAU den Argumenten, die der Render benutzt.
 *
 * `mitTon: false` baut den Clip, um dessentwillen dieses Issue existiert: Ohne Tonspur
 * bricht `concat -c copy` NICHT ab, sondern erzeugt eine Datei, die am Fernseher nach dem
 * ersten Segment einfriert oder den Ton verliert.
 */
function erzeugeZwischenclip(name: string, farbe: string, mitTon: boolean): string {
  const ziel = path.join(arbeitsordner, name)
  const groesse = `${String(RENDER_PROFILE.breite)}x${String(RENDER_PROFILE.hoehe)}`
  const argumente = [
    '-y',
    '-v',
    'error',
    '-hide_banner',
    '-f',
    'lavfi',
    '-i',
    `color=c=${farbe}:s=${groesse}:r=${String(RENDER_PROFILE.fps)}:d=1`,
    ...(mitTon ? baueStilleTonspurEingang(RENDER_PROFILE) : []),
    '-map',
    '0:v:0',
    ...(mitTon ? baueTonspurMapping(1) : []),
    '-vf',
    'setsar=1',
    ...baueVideoKodierArgumente(RENDER_PROFILE),
    ...(mitTon ? baueTonspurKodierArgumente(RENDER_PROFILE) : []),
    ziel,
  ]
  execFileSync(ermittleFfmpegPfad(), argumente, { stdio: 'ignore' })
  return ziel
}

describe('Uniformitaetspruefung am echten Binary', () => {
  it('liest einen echten Zwischenclip aus und findet das erwartete Profil', async () => {
    const clip = erzeugeZwischenclip('seg_0000.mp4', 'red', true)
    const ergebnis = await liesStromEigenschaften(clip, ermittleFfprobePfad())

    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    const wert = ergebnis.wert
    expect(wert.stromArten).toEqual(['video', 'audio'])
    expect(wert.video).toMatchObject({
      codec: 'h264',
      profil: 'High',
      level: 40,
      breite: RENDER_PROFILE.breite,
      hoehe: RENDER_PROFILE.hoehe,
      pixelformat: 'yuv420p',
      bildrate: '30/1',
      mittlereBildrate: '30/1',
      pixelSeitenverhaeltnis: '1:1',
      farbPrimaries: 'bt709',
      farbTransfer: 'bt709',
      farbMatrix: 'bt709',
      drehung: 0,
    })
    expect(wert.audio).toEqual({ codec: 'aac', abtastrate: 48000, kanaele: 1 })
    // Aus format.duration, nicht aus der Videospur - #180 braucht genau diesen Wert.
    expect(wert.dauerSekunden).toBeGreaterThan(0.9)
    expect(wert.dauerSekunden).toBeLessThan(1.2)
  })

  it('laesst zwei echte, gleich erzeugte Zwischenclips durch', async () => {
    // DER TEURE PUNKT: Waere ein Sollwert in #170 anders geschrieben als in den
    // Encoder-Argumenten, wiese die Pruefung hier jeden gesunden Lauf ab.
    const a = erzeugeZwischenclip('seg_0100.mp4', 'red', true)
    const b = erzeugeZwischenclip('seg_0101.mp4', 'blue', true)

    const ergebnis = await pruefeUniformitaet([a, b], RENDER_PROFILE, ermittleFfprobePfad())
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.abweichungen).toEqual([])
    expect(ergebnis.wert.ok).toBe(true)
  })

  it('faengt einen echten Zwischenclip OHNE Tonspur ab', async () => {
    const mit = erzeugeZwischenclip('seg_0200.mp4', 'red', true)
    const ohne = erzeugeZwischenclip('seg_0201.mp4', 'blue', false)

    const ergebnis = await pruefeUniformitaet([mit, ohne], RENDER_PROFILE, ermittleFfprobePfad())
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.wert.ok).toBe(false)
    expect(ergebnis.wert.abweichungen.map((a) => a.feld)).toContain('stromArten')
    expect(
      ergebnis.wert.abweichungen.find((a) => a.feld === 'stromArten'),
    ).toMatchObject({ datei: ohne, erwartet: 'video, audio', gefunden: 'video' })
  })

  it('meldet eine fehlende Datei als unbekannter_fehler mit stderr-Auszug', async () => {
    const ergebnis = await liesStromEigenschaften(
      path.join(arbeitsordner, 'gibtesnicht.mp4'),
      ermittleFfprobePfad(),
    )
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    const daten = ergebnis.fehler.daten as { datei: string; stderrAuszug: string }
    expect(daten.stderrAuszug.length).toBeGreaterThan(0)
  })

  it('meldet eine Datei, die kein Medium ist, als unbekannter_fehler', async () => {
    const textdatei = path.join(arbeitsordner, 'kein-video.mp4')
    execFileSync(process.execPath, ['-e', `require('fs').writeFileSync(${JSON.stringify(textdatei)}, 'kein Video')`])
    const ergebnis = await liesStromEigenschaften(textdatei, ermittleFfprobePfad())
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
  })

  it('ist gegen den ffprobe-Aufruf des Unit-Tests deckungsgleich', () => {
    // Die eingefrorene Ausgabe im Unit-Test taugt nur so lange, wie das echte ffprobe
    // dieselben Felder liefert. Hier wird das an der lebenden Datei nachgezogen.
    const clip = erzeugeZwischenclip('seg_0300.mp4', 'green', true)
    const roh = execFileSync(
      ermittleFfprobePfad(),
      [
        '-v',
        'error',
        '-hide_banner',
        '-print_format',
        'json',
        '-show_streams',
        '-show_format',
        clip,
      ],
      { encoding: 'utf8' },
    )
    const ergebnis = leseStromEigenschaften(JSON.parse(roh), clip)
    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      // GEMESSEN: ffprobe schreibt `field_order` bei diesem Material NICHT.
      expect(ergebnis.wert.video?.feldreihenfolge).toBeNull()
      expect(ergebnis.wert.video?.zeitbasis).toMatch(/^1\/\d+$/)
    }
  })
})
