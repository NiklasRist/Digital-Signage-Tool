import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { FfmpegFehlercode, FfmpegLauf } from '../../src/main/ffmpeg-adapter/prozess'

// Verhaltenstest zu #158 (Prozessstart fuehreFfmpegAus).
//
// GESTELLT IST GENAU EINE SACHE: der Start des fremden Prozesses. Ein echtes ffmpeg wuerde
// diese Tests von Mediendateien, von Rechenzeit und - beim Fehlerfall - vom Zufall abhaengig
// machen. Die Attrappe gibt dafuer her, was ein echter Lauf gerade NICHT hergibt: einen in der
// Zeilenmitte zerteilten Datenblock, ein `error` UND ein `close` hintereinander, einen
// werfenden Rueckruf und ein Binary, das gar nicht erst startet - jeweils auf Kommando.

type Hoerer = (...args: never[]) => void

interface Strom {
  kodierung: string | null
  setEncoding(kodierung: string): void
  on(name: string, hoerer: Hoerer): Strom
  /** Schiebt einen Datenblock hinein - so, wie das Betriebssystem ihn liefern wuerde. */
  sende(block: string): void
}

interface Kind {
  pid: number
  stdout: Strom
  stderr: Strom
  /** Belegt, dass DIESE Datei nichts beendet - das Beenden ist #159. */
  getoetet: boolean
  kill(signal?: string): boolean
  on(name: string, hoerer: Hoerer): Kind
  sende(name: string, ...args: unknown[]): void
}

type Aufruf = {
  datei: string
  argumente: readonly string[]
  optionen: Record<string, unknown>
}

const zustand = vi.hoisted(() => ({
  binaer: 'C:\\Program Files\\Signage Tool\\ffmpeg.exe',
  pfadWirft: false,
  spawnWirft: null as Error | null,
  aufrufe: [] as Aufruf[],
  kind: null as Kind | null,
}))

vi.mock('../../src/main/ffmpeg-pfad', () => ({
  ermittleFfmpegPfad: () => {
    if (zustand.pfadWirft) throw new Error('ffmpeg-static liefert keinen Pfad')
    return zustand.binaer
  },
}))

vi.mock('node:child_process', () => {
  const spawn = (
    datei: string,
    argumente: readonly string[],
    optionen: Record<string, unknown>,
  ): unknown => {
    zustand.aufrufe.push({ datei, argumente, optionen })
    if (zustand.spawnWirft) throw zustand.spawnWirft
    const kind = erzeugeKind()
    zustand.kind = kind
    return kind
  }
  return { spawn: spawn as unknown as typeof import('node:child_process').spawn }
})

const { fuehreFfmpegAus } = await import('../../src/main/ffmpeg-adapter/prozess')

const VORSPANN = [
  '-hide_banner',
  '-nostdin',
  '-loglevel',
  'error',
  '-y',
  '-progress',
  'pipe:1',
  '-nostats',
]

function erzeugeStrom(): Strom {
  const hoerer: Hoerer[] = []
  const strom: Strom = {
    kodierung: null,
    setEncoding(kodierung: string) {
      strom.kodierung = kodierung
    },
    on(name: string, h: Hoerer) {
      if (name === 'data') hoerer.push(h)
      return strom
    },
    sende(block: string) {
      for (const h of [...hoerer]) (h as (block: string) => void)(block)
    },
  }
  return strom
}

function erzeugeKind(): Kind {
  const hoerer = new Map<string, Hoerer[]>()
  const kind: Kind = {
    pid: 4711,
    stdout: erzeugeStrom(),
    stderr: erzeugeStrom(),
    getoetet: false,
    kill() {
      kind.getoetet = true
      return true
    },
    on(name: string, h: Hoerer) {
      hoerer.set(name, [...(hoerer.get(name) ?? []), h])
      return kind
    },
    sende(name: string, ...args: unknown[]) {
      for (const h of [...(hoerer.get(name) ?? [])]) (h as (...a: unknown[]) => void)(...args)
    },
  }
  return kind
}

beforeEach(() => {
  zustand.pfadWirft = false
  zustand.spawnWirft = null
  zustand.aufrufe = []
  zustand.kind = null
})

function ersterAufruf(): Aufruf {
  const aufruf = zustand.aufrufe[0]
  if (!aufruf) throw new Error('spawn wurde nicht aufgerufen')
  return aufruf
}

function kind(): Kind {
  if (!zustand.kind) throw new Error('spawn wurde nicht aufgerufen')
  return zustand.kind
}

/** Startet den Lauf und spielt danach ab, was der Prozess getan haette. */
async function laufe(
  lauf: FfmpegLauf,
  ablauf: (k: Kind) => void = (k) => k.sende('close', 0, null),
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  const versprechen = fuehreFfmpegAus(lauf)
  ablauf(kind())
  return versprechen
}

function fehlerVon(ergebnis: Ergebnis<void, FfmpegFehlercode>) {
  if (ergebnis.ok) throw new Error('Erwartet war ein Fehler, geliefert wurde ok')
  return ergebnis.fehler
}

describe('fuehreFfmpegAus - Prozessstart', () => {
  it('startet den Pfad aus ermittleFfmpegPfad mit Argument-Array und ohne Shell', async () => {
    await laufe({ argumente: ['-i', 'a.mp4', 'b.mp4'] })

    const aufruf = ersterAufruf()
    expect(aufruf.datei).toBe(zustand.binaer)
    expect(aufruf.argumente).toEqual([...VORSPANN, '-i', 'a.mp4', 'b.mp4'])
    expect(aufruf.optionen).toEqual({ windowsHide: true })
    expect(aufruf.optionen.shell).toBeUndefined()
  })

  it('reicht ein Argument mit Leerzeichen ungequotet als EIN Element durch', async () => {
    const pfad = 'C:\\Test Ordner\\seg 01.mp4'

    await laufe({ argumente: ['-i', pfad] })

    // Kein Quoting, kein Escaping, kein zusammengesetztes Kommando: Genau hier braeche ein
    // Aufruf ueber die Kommandozeile bei jedem Windows-Pfad mit Leerzeichen.
    expect(ersterAufruf().argumente).toContain(pfad)
    expect(ersterAufruf().argumente.filter((a) => a.includes('seg 01'))).toEqual([pfad])
  })

  it('setzt den festen Vorspann VOR die Aufrufer-Argumente', async () => {
    await laufe({ argumente: ['-i', 'a.mp4'] })

    expect(ersterAufruf().argumente.slice(0, VORSPANN.length)).toEqual(VORSPANN)
  })

  // DER FORTSCHRITTS-TEST.
  //
  // OHNE `-progress pipe:1` schreibt ffmpeg UEBERHAUPT NICHTS nach stdout - und `-loglevel
  // error` aus demselben Vorspann unterdrueckt zusaetzlich die voreingestellte
  // Fortschrittsanzeige auf stderr. Folge: `aufAusgabeZeile` wird nie gerufen, der
  // Fortschritts-Leser (#160) bekommt nie eine Zeile, und der Fortschritt bleibt im ganzen
  // Produkt bei 0 % stehen, OHNE dass irgendetwas fehlschlaegt. Jedes Glied der Kette
  // #160 -> #177 -> #178 -> #191 waere fuer sich richtig und die Kette tot.
  // `-nostats` gehoert dazu: sonst fuellt die unstrukturierte Statuszeile den
  // stderr-Ringpuffer mit Nicht-Fehlern, und die Meldung zeigt Fortschritt statt Ursache.
  it('setzt -progress pipe:1 und -nostats - auch ohne Argumente und ohne Zeilenempfaenger', async () => {
    await laufe({ argumente: [] })

    const argumente = ersterAufruf().argumente
    const stelle = argumente.indexOf('-progress')
    expect(stelle).toBeGreaterThanOrEqual(0)
    expect(argumente[stelle + 1]).toBe('pipe:1')
    expect(argumente).toContain('-nostats')
    // Leeres Aufrufer-Array heisst: nur der Vorspann laeuft - das ist erlaubt.
    expect(argumente).toEqual(VORSPANN)
  })

  it('reicht das Handle genau einmal an aufProzessStart heraus', async () => {
    const gesehen: unknown[] = []

    await laufe({ argumente: [], aufProzessStart: (k) => gesehen.push(k) })

    expect(gesehen).toHaveLength(1)
    expect(gesehen[0]).toBe(kind())
  })
})

describe('fuehreFfmpegAus - Ausgang', () => {
  it('liefert bei Exit-Code 0 ok', async () => {
    const ergebnis = await laufe({ argumente: ['-i', 'a.mp4'] })

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('liefert bei Exit-Code ungleich 0 ffmpeg_fehler mit den letzten stderr-Zeilen', async () => {
    const fehler = fehlerVon(
      await laufe({ argumente: [] }, (k) => {
        k.stderr.sende('Warnung: irgendwas\nNo such file or directory\n')
        k.sende('close', 1, null)
      }),
    )

    expect(fehler.code).toBe('ffmpeg_fehler')
    expect(fehler.meldung).toContain('No such file or directory')
    // Der Exit-Code darf in der Meldung stehen - nie im Code.
    expect(fehler.meldung).toContain('1')
    expect(fehler.code).not.toContain('1')
  })

  it('haelt genau die letzten 20 stderr-Zeilen', async () => {
    // Kurze Zeilen, damit hier allein der Ringpuffer wirkt und nicht die Laengenkuerzung.
    const fehler = fehlerVon(
      await laufe({ argumente: [] }, (k) => {
        for (let n = 1; n <= 50; n += 1) k.stderr.sende(`zeile-${n}\n`)
        k.sende('close', 1, null)
      }),
    )

    expect(fehler.meldung).toContain('zeile-50')
    expect(fehler.meldung).toContain('zeile-31')
    expect(fehler.meldung).not.toContain('zeile-30')
  })

  it('kuerzt eine geschwaetzige Ausgabe auf 2000 Zeichen und behaelt dabei das Ende', async () => {
    const fehler = fehlerVon(
      await laufe({ argumente: [] }, (k) => {
        for (let n = 1; n <= 50; n += 1) k.stderr.sende(`zeile-${n} ${'x'.repeat(300)}\n`)
        k.sende('close', 1, null)
      }),
    )

    expect(fehler.meldung.length).toBeLessThanOrEqual(2000)
    // Das Ende bleibt - dort steht bei ffmpeg der Grund; der Kopf mit dem Exit-Code auch.
    expect(fehler.meldung).toContain('zeile-50')
    expect(fehler.meldung).toContain('Exit-Code 1')
  })

  it('nennt ein Signal ohne gesetzten Abbruch als Fehler, nicht als Abbruch', async () => {
    const fehler = fehlerVon(
      await laufe({ argumente: [] }, (k) => k.sende('close', null, 'SIGKILL')),
    )

    expect(fehler.code).toBe('ffmpeg_fehler')
    expect(fehler.meldung).toContain('SIGKILL')
  })

  // DER WINDOWS-FALL: Dort gibt es keine Signale - ein hart beendeter Prozess liefert schlicht
  // einen Exit-Code ungleich 0. Wer den Abbruch aus Exit-Code und Signal raet, zeigt dem
  // Nutzer einen roten Fehlschlag fuer seinen eigenen Abbruch (TK 9.2.3 verbietet das).
  it('meldet ffmpeg_abgebrochen, wenn das Abbruchsignal gesetzt ist - trotz Exit-Code 1', async () => {
    const steuerung = new AbortController()
    steuerung.abort()

    const fehler = fehlerVon(
      await laufe({ argumente: [], abbruchSignal: steuerung.signal }, (k) => {
        k.stderr.sende('Conversion failed!\n')
        k.sende('close', 1, null)
      }),
    )

    expect(fehler.code).toBe('ffmpeg_abgebrochen')
    // Diese Datei beendet nichts - das Handle geht an #159.
    expect(kind().getoetet).toBe(false)
  })
})

describe('fuehreFfmpegAus - stdout zeilenweise', () => {
  it('gibt nur vollstaendige Zeilen weiter, auch bei einem in der Mitte zerteilten Block', async () => {
    const zeilen: string[] = []

    await laufe({ argumente: [], aufAusgabeZeile: (z) => zeilen.push(z) }, (k) => {
      k.stdout.sende('out_time_ms=1000\r\nprog')
      k.stdout.sende('ress=continue\nrest ohne Umbruch')
      k.sende('close', 0, null)
    })

    expect(zeilen).toEqual(['out_time_ms=1000', 'progress=continue', 'rest ohne Umbruch'])
  })

  it('gibt ein leeres Reststueck am Prozessende nicht weiter', async () => {
    const zeilen: string[] = []

    await laufe({ argumente: [], aufAusgabeZeile: (z) => zeilen.push(z) }, (k) => {
      k.stdout.sende('progress=end\n')
      k.sende('close', 0, null)
    })

    expect(zeilen).toEqual(['progress=end'])
  })
})

describe('fuehreFfmpegAus - genau eine Antwort', () => {
  it('verwirft ein close, das nach einem error noch feuert', async () => {
    const ergebnis = await laufe({ argumente: [] }, (k) => {
      k.sende('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }))
      // Node schickt nach `error` regelmaessig noch ein `close` hinterher. Ohne Waechter
      // ueberholte es die erste Antwort - oder erzeugte eine zweite, die lautlos verschwindet.
      k.sende('close', 0, null)
    })

    expect(fehlerVon(ergebnis).code).toBe('ffmpeg_fehler')
  })

  it('meldet ein fehlgeschlagenes spawn als Verpackungsfehler, statt zu werfen', async () => {
    const fehler = fehlerVon(
      await laufe({ argumente: [] }, (k) =>
        k.sende('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' })),
      ),
    )

    expect(fehler.code).toBe('ffmpeg_fehler')
    expect(fehler.meldung).toContain('VERPACKUNGSFEHLER')
    expect(fehler.meldung).toContain(zustand.binaer)
  })

  it('antwortet auch, wenn spawn selbst wirft', async () => {
    zustand.spawnWirft = new Error('kaputte Argumente')

    const fehler = fehlerVon(await fuehreFfmpegAus({ argumente: [] }))

    expect(fehler.code).toBe('ffmpeg_fehler')
    expect(fehler.meldung).toContain('kaputte Argumente')
  })

  it('antwortet auch, wenn schon die Pfadermittlung wirft', async () => {
    zustand.pfadWirft = true

    const fehler = fehlerVon(await fuehreFfmpegAus({ argumente: [] }))

    expect(fehler.code).toBe('ffmpeg_fehler')
    expect(zustand.aufrufe).toHaveLength(0)
  })

  it('kippt nicht in einen unbeantworteten Zustand, wenn ein Rueckruf wirft', async () => {
    const ergebnis = await laufe(
      {
        argumente: [],
        aufAusgabeZeile: () => {
          throw new Error('Empfaenger kaputt')
        },
      },
      (k) => {
        k.stdout.sende('progress=continue\n')
        k.sende('close', 0, null)
      },
    )

    // Exit-Code 0, aber der Aufrufer konnte den Fortschritt nicht entgegennehmen - das als
    // Erfolg zu melden waere ein stiller Fehlschlag.
    expect(fehlerVon(ergebnis).code).toBe('ffmpeg_fehler')
    expect(fehlerVon(ergebnis).meldung).toContain('Empfaenger kaputt')
  })

  it('kippt nicht in einen unbeantworteten Zustand, wenn aufProzessStart wirft', async () => {
    const ergebnis = await laufe({
      argumente: [],
      aufProzessStart: () => {
        throw new Error('Handle nicht annehmbar')
      },
    })

    expect(fehlerVon(ergebnis).code).toBe('ffmpeg_fehler')
  })
})
