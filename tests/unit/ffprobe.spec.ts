import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { ImportFehlercode } from '../../src/main/media-service/fehlercodes'

// Verhaltenstest zu #82 (ffprobe mit Timeout aufrufen).
//
// GESTELLT IST GENAU EINE SACHE: der Start des fremden Prozesses. Ein echtes ffprobe
// wuerde diese Tests von einer 60-MB-Binaerdatei, von Mediendateien im Repo und - beim
// Timeout - von 30 Sekunden Wartezeit abhaengig machen. Die Attrappe gibt dafuer her,
// was ein echter Lauf gerade NICHT hergibt: einen beschaedigten Stream, einen
// Pufferueberlauf und ein Binary, das gar nicht erst startet, jeweils auf Kommando.
//
// Was die Attrappe NICHT belegen kann, steht im Bericht: dass das echte ffprobe nach
// SIGKILL tatsaechlich verschwindet. Diese Aussage braucht ein Stub-Programm im
// getrennten Ordner fuer langsame Integrationstests (#11) - der liegt ausserhalb der
// zwei Dateien dieses Auftrags.

type Rueckruf = (fehler: ExecFehler | null, stdout: string, stderr: string) => void

type ExecFehler = Error & { code?: string | number; killed?: boolean }

type Aufruf = { datei: string; argumente: readonly string[]; optionen: Record<string, unknown> }

const zustand = vi.hoisted(() => ({
  binaer: 'C:\\Program Files\\Signage Tool\\ffprobe.exe',
  pfadWirft: false,
  aufrufe: [] as Aufruf[],
  ablauf: [] as string[],
  rueckruf: null as Rueckruf | null,
  pid: 4711 as number | undefined,
  exitCode: null as number | null,
  signalCode: null as string | null,
}))

vi.mock('../../src/main/ffmpeg-pfad', () => ({
  ermittleFfprobePfad: () => {
    if (zustand.pfadWirft) throw new Error('ffprobe-static liefert keinen Pfad')
    return zustand.binaer
  },
}))

vi.mock('node:child_process', () => {
  const execFile = (
    datei: string,
    argumente: readonly string[],
    optionen: Record<string, unknown>,
    rueckruf: Rueckruf,
  ): unknown => {
    zustand.aufrufe.push({ datei, argumente, optionen })
    zustand.rueckruf = rueckruf
    return {
      // Getter statt fester Werte: Ein Test setzt den Zustand des Prozesses, BEVOR er
      // den Rueckruf ausloest - eine Kopie waere dann schon veraltet.
      get pid() {
        return zustand.pid
      },
      get exitCode() {
        return zustand.exitCode
      },
      get signalCode() {
        return zustand.signalCode
      },
      kill: (signal?: string) => {
        zustand.ablauf.push(`kill:${signal ?? 'SIGTERM'}`)
        zustand.signalCode = signal ?? 'SIGTERM'
        return true
      },
    }
  }
  return { execFile: execFile as unknown as typeof import('node:child_process').execFile }
})

const { leseRohMetadaten } = await import('../../src/main/media-service/ffprobe')

const DATEI = 'C:\\Test Ordner\\mein clip.mp4'

const ARGUMENTE_OHNE_DATEI = [
  '-v',
  'error',
  '-print_format',
  'json',
  '-show_streams',
  '-show_format',
]

const JSON_AUSGABE = '{"streams":[{"width":1920,"height":1080}],"format":{"duration":"12.5"}}'

beforeEach(() => {
  zustand.pfadWirft = false
  zustand.aufrufe = []
  zustand.ablauf = []
  zustand.rueckruf = null
  zustand.pid = 4711
  zustand.exitCode = null
  zustand.signalCode = null
})

function execFehler(felder: { meldung?: string; code?: string | number; killed?: boolean }): ExecFehler {
  return Object.assign(new Error(felder.meldung ?? 'Command failed'), {
    code: felder.code,
    killed: felder.killed,
  })
}

/** Startet den Aufruf und beantwortet ihn mit dem, was ffprobe geliefert haette. */
async function probe(
  antwort: { fehler?: ExecFehler; stdout?: string; stderr?: string },
  datei = DATEI,
): Promise<Ergebnis<unknown, 'probe_fehler'>> {
  const versprechen = leseRohMetadaten(datei)
  const rueckruf = zustand.rueckruf
  if (!rueckruf) throw new Error('execFile wurde nicht aufgerufen')
  rueckruf(antwort.fehler ?? null, antwort.stdout ?? '', antwort.stderr ?? '')
  return versprechen
}

function fehlerVon(ergebnis: Ergebnis<unknown, 'probe_fehler'>) {
  if (ergebnis.ok) throw new Error('Erwartet war ein Fehler, geliefert wurde ok')
  return ergebnis.fehler
}

function ersterAufruf(): Aufruf {
  const aufruf = zustand.aufrufe[0]
  if (!aufruf) throw new Error('execFile wurde nicht aufgerufen')
  return aufruf
}

describe('leseRohMetadaten - Prozessstart', () => {
  it('uebergibt den Pfad mit Leerzeichen ungequotet als letztes Argument', async () => {
    await probe({ stdout: JSON_AUSGABE })

    const aufruf = ersterAufruf()
    expect(aufruf.datei).toBe(zustand.binaer)
    expect(aufruf.argumente).toEqual([...ARGUMENTE_OHNE_DATEI, DATEI])
    expect(aufruf.argumente.at(-1)).toBe(DATEI)
  })

  it('startet ohne Shell', async () => {
    await probe({ stdout: JSON_AUSGABE })

    expect(ersterAufruf().optionen.shell).toBeUndefined()
  })

  it('setzt Zeitgrenze, SIGKILL, Puffergroesse und windowsHide', async () => {
    await probe({ stdout: JSON_AUSGABE })

    expect(ersterAufruf().optionen).toMatchObject({
      timeout: 30_000,
      killSignal: 'SIGKILL',
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    })
  })
})

describe('leseRohMetadaten - Erfolg', () => {
  it('liefert das geparste Objekt, nicht die Zeichenkette', async () => {
    const ergebnis = await probe({ stdout: JSON_AUSGABE })

    expect(ergebnis).toEqual({
      ok: true,
      wert: { streams: [{ width: 1920, height: 1080 }], format: { duration: '12.5' } },
    })
  })
})

describe('leseRohMetadaten - Fehlerpfade', () => {
  it('meldet probe_fehler bei Exit-Code ungleich 0 und nimmt stderr in die Meldung', async () => {
    const fehler = fehlerVon(
      await probe({
        fehler: execFehler({ code: 1 }),
        stderr: 'moov atom not found',
      }),
    )

    expect(fehler.code).toBe('probe_fehler')
    expect(fehler.meldung).toContain('moov atom not found')
  })

  it('kuerzt eine sehr lange stderr-Ausgabe', async () => {
    const fehler = fehlerVon(
      await probe({ fehler: execFehler({ code: 1 }), stderr: 'x'.repeat(4000) }),
    )

    expect(fehler.meldung).toContain('...')
    expect(fehler.meldung.length).toBeLessThan(700)
  })

  it('meldet probe_fehler, wenn ffprobe nur nach stderr statt nach stdout schreibt', async () => {
    const fehler = fehlerVon(await probe({ stdout: '', stderr: JSON_AUSGABE }))

    expect(fehler.code).toBe('probe_fehler')
  })

  it('meldet probe_fehler bei unbrauchbarem JSON', async () => {
    const fehler = fehlerVon(await probe({ stdout: '{ "streams": [' }))

    expect(fehler.code).toBe('probe_fehler')
  })

  it('meldet probe_fehler, wenn die Datei nicht existiert', async () => {
    const fehler = fehlerVon(
      await probe({
        fehler: execFehler({ code: 1 }),
        stderr: 'C:\\weg.mp4: No such file or directory',
      }),
    )

    expect(fehler.code).toBe('probe_fehler')
  })

  it('meldet einen Pufferueberlauf als solchen und nicht als Zeitueberschreitung', async () => {
    // Node toetet den Prozess auch hier und setzt dabei `killed` - genau wie beim
    // Timeout. Nur die Reihenfolge der Abfragen haelt die beiden auseinander.
    const fehler = fehlerVon(
      await probe({
        fehler: execFehler({ code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER', killed: true }),
      }),
    )

    expect(fehler.code).toBe('probe_fehler')
    expect(fehler.meldung).toContain('Ausgabepuffer')
    expect(fehler.meldung).not.toContain('Zeitgrenze')
  })

  it('nennt bei ENOENT den Binaerpfad, weil das ein Verpackungsfehler ist', async () => {
    const fehler = fehlerVon(await probe({ fehler: execFehler({ code: 'ENOENT' }) }))

    expect(fehler.code).toBe('probe_fehler')
    expect(fehler.meldung).toContain(zustand.binaer)
  })

  it('antwortet auch dann, wenn schon die Pfadermittlung wirft', async () => {
    zustand.pfadWirft = true

    const fehler = fehlerVon(await leseRohMetadaten(DATEI))

    expect(fehler.code).toBe('probe_fehler')
    expect(zustand.aufrufe).toHaveLength(0)
  })
})

describe('leseRohMetadaten - Zeitgrenze', () => {
  it('beendet den noch laufenden Prozess mit SIGKILL, bevor es antwortet', async () => {
    const fehler = fehlerVon(await probe({ fehler: execFehler({ killed: true }) }))

    expect(fehler.code).toBe('probe_fehler')
    expect(zustand.ablauf).toEqual(['kill:SIGKILL'])
    expect(zustand.signalCode).toBe('SIGKILL')
  })

  it('unterscheidet den Timeout nicht im Code, nur in der Meldung', async () => {
    const zeit = fehlerVon(await probe({ fehler: execFehler({ killed: true }) }))
    zustand.ablauf = []
    zustand.exitCode = 1
    const defekt = fehlerVon(await probe({ fehler: execFehler({ code: 1 }) }))

    expect(zeit.code).toBe(defekt.code)
  })

  it('toetet einen bereits beendeten Prozess nicht noch einmal', async () => {
    zustand.exitCode = 1

    await probe({ fehler: execFehler({ code: 1 }), stderr: 'kaputt' })

    expect(zustand.ablauf).toEqual([])
  })

  it('toetet nichts, wenn nie ein Prozess entstanden ist', async () => {
    zustand.pid = undefined

    await probe({ fehler: execFehler({ code: 'ENOENT' }) })

    expect(zustand.ablauf).toEqual([])
  })
})

describe('Herkunft des Fehlercodes', () => {
  it('fuehrt probe_fehler in der Modul-Union ImportFehlercode', () => {
    // Der Beleg aus dem Signaturblock von #82: In der Quelldatei waere der Import
    // unbenutzt und nur mit abgeschalteter Lint-Regel zu halten.
    const beleg: ImportFehlercode = 'probe_fehler'

    expect(beleg).toBe('probe_fehler')
  })
})
