import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChildProcess } from 'node:child_process'

// Verhaltenstest zu #159 (laufenden ffmpeg-Prozess plattformsicher beenden).
//
// KEIN ECHTER KINDPROZESS. Gestellt sind die beiden Dinge, die diese Datei anfasst:
// das Prozess-Handle und `taskkill`. Nur mit Attrappen sind die Faelle ueberhaupt
// herstellbar, auf die es ankommt - ein Prozess, der auf das erste Signal NICHT
// reagiert; ein `taskkill`, das sich nicht starten laesst; ein `kill`, das wirft. Ein
// echtes ffmpeg tut nichts davon auf Kommando.
//
// Und die Plattform ist gestellt, weil beide Zweige auf JEDEM Entwicklungsrechner
// gelten muessen: Der Windows-Zweig faellt sonst nie auf einem Mac auf und umgekehrt -
// und der Fehler zeigt sich erst beim Nutzer, als haengende Warteschlange.
//
// Was hier grundsaetzlich NICHT belegt werden kann, ist die Wirkung auf das
// Betriebssystem (ist der Prozess danach wirklich weg, ist die Datei wirklich frei).
// Das wurde am 14.08.2026 gegen das gebuendelte ffmpeg gemessen und steht im Kopf von
// abbruch.ts.

// Die Fristen stehen in abbruch.ts als benannte Konstanten und werden nicht
// exportiert. Hier stehen sie absichtlich als Zahl: Der Test prueft die ZUSAGE, nicht
// die Variable - wer die Frist in der Quelle aendert, soll hier rot werden.
const GNADENFRIST_MS = 3_000
const ABSCHLUSS_FRIST_MS = 5_000

type Hoerer = (...args: never[]) => void

interface Aufruf {
  datei: string
  argumente: readonly string[]
  optionen: Record<string, unknown>
}

/** Das gestellte `taskkill`. */
interface Werkzeug {
  once(name: string, hoerer: Hoerer): Werkzeug
  /** Spielt ein Ereignis ein, das der echte Prozess geliefert haette. */
  sende(name: string, ...args: unknown[]): void
}

/** Das gestellte ffmpeg-Handle. */
interface Kind {
  pid: number | undefined
  exitCode: number | null
  signalCode: string | null
  /** Jedes gesendete Signal, in der Reihenfolge; `undefined` = `kill()` ohne Namen. */
  signale: (string | undefined)[]
  killWirft: boolean
  kill(signal?: string): boolean
  once(name: string, hoerer: Hoerer): Kind
  /** Spielt das Prozessende ein. */
  beende(): void
}

const zustand = vi.hoisted(() => ({
  aufrufe: [] as Aufruf[],
  spawnWirft: null as Error | null,
  werkzeug: null as Werkzeug | null,
}))

vi.mock('node:child_process', () => {
  const spawn = (
    datei: string,
    argumente: readonly string[],
    optionen: Record<string, unknown>,
  ): unknown => {
    zustand.aufrufe.push({ datei, argumente, optionen })
    if (zustand.spawnWirft) throw zustand.spawnWirft
    const werkzeug = erzeugeWerkzeug()
    zustand.werkzeug = werkzeug
    return werkzeug
  }
  return { spawn: spawn as unknown as typeof import('node:child_process').spawn }
})

function erzeugeWerkzeug(): Werkzeug {
  const hoerer = new Map<string, Hoerer[]>()
  const werkzeug: Werkzeug = {
    once(name: string, h: Hoerer) {
      hoerer.set(name, [...(hoerer.get(name) ?? []), h])
      return werkzeug
    },
    sende(name: string, ...args: unknown[]) {
      for (const h of [...(hoerer.get(name) ?? [])]) (h as (...a: unknown[]) => void)(...args)
    },
  }
  return werkzeug
}

function erzeugeKind(pid: number | undefined = 4711): Kind {
  const hoerer = new Map<string, Hoerer[]>()
  const kind: Kind = {
    pid,
    exitCode: null,
    signalCode: null,
    signale: [],
    killWirft: false,
    kill(signal?: string) {
      kind.signale.push(signal)
      if (kind.killWirft) throw Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' })
      return true
    },
    once(name: string, h: Hoerer) {
      hoerer.set(name, [...(hoerer.get(name) ?? []), h])
      return kind
    },
    beende() {
      kind.exitCode = 1
      for (const h of [...(hoerer.get('exit') ?? [])]) (h as (...a: unknown[]) => void)(1, null)
    },
  }
  return kind
}

function alsHandle(kind: Kind): ChildProcess {
  return kind as unknown as ChildProcess
}

function ersterAufruf(): Aufruf {
  const aufruf = zustand.aufrufe[0]
  if (!aufruf) throw new Error('spawn wurde nicht aufgerufen')
  return aufruf
}

function werkzeug(): Werkzeug {
  if (!zustand.werkzeug) throw new Error('taskkill wurde nicht gestartet')
  return zustand.werkzeug
}

const echtePlattform = process.platform

function aufPlattform(name: string): void {
  Object.defineProperty(process, 'platform', { value: name, configurable: true })
}

/**
 * Ein frisches Modul je Test.
 *
 * Der gemerkte Prozess ist Modul-Zustand - genau EIN Platz, so verlangt es die
 * serielle Zusage (NFA-09). Ohne diesen Schnitt schleppte ein Test das Handle des
 * vorigen mit sich, und ein vergessenes Freigeben faende hier nie jemand.
 */
async function frischesModul(): Promise<typeof import('../../src/main/ffmpeg-adapter/abbruch')> {
  vi.resetModules()
  return import('../../src/main/ffmpeg-adapter/abbruch')
}

let protokoll: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  zustand.aufrufe = []
  zustand.spawnWirft = null
  zustand.werkzeug = null
  protokoll = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
  protokoll.mockRestore()
  Object.defineProperty(process, 'platform', { value: echtePlattform, configurable: true })
})

describe('beendeLaufendenProzess - loest immer auf', () => {
  it('loest ohne gemerkten Prozess auf und startet nichts', async () => {
    const { beendeLaufendenProzess } = await frischesModul()

    // Der Abbruch vor dem Start und der Abbruch kurz nach dem regulaeren Ende sind
    // derselbe Fall: ein normaler Wettlauf, kein Fehler.
    await expect(beendeLaufendenProzess()).resolves.toBeUndefined()
    expect(zustand.aufrufe).toEqual([])
  })

  // Exit-Code 0 ist hier die eigentliche Falle: Wer `if (kind.exitCode)` schreibt,
  // haelt den sauber beendeten Prozess fuer laufend und wartet auf ein 'exit', das nie
  // mehr kommt - die Zusage haengt dann bis zur Abschlussfrist.
  it('loest bei exitCode 0 sofort auf, ohne kill zu rufen', async () => {
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    kind.exitCode = 0
    merkeProzess(alsHandle(kind))

    await beendeLaufendenProzess()

    expect(kind.signale).toEqual([])
    expect(zustand.aufrufe).toEqual([])
  })

  it('loest bei gesetztem signalCode sofort auf, ohne kill zu rufen', async () => {
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    kind.signalCode = 'SIGKILL'
    merkeProzess(alsHandle(kind))

    await beendeLaufendenProzess()

    expect(kind.signale).toEqual([])
  })

  // DIE NOTBREMSE. Bliebe die Zusage offen, stuende die gesamte Warteschlange fuer den
  // Rest der Sitzung (TK 9.3.5) - der Abbruch waere schlimmer als kein Abbruch.
  it('loest nach der Abschlussfrist auch dann auf, wenn exit ausbleibt', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    let fertig = false
    const versprechen = beendeLaufendenProzess().then(() => {
      fertig = true
    })

    await vi.advanceTimersByTimeAsync(ABSCHLUSS_FRIST_MS - 1)
    expect(fertig).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await versprechen
    expect(fertig).toBe(true)
  })

  it('lehnt nicht ab, wenn kill wirft (ESRCH)', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    kind.killWirft = true
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    // Beide Signale werfen - SIGTERM sofort, SIGKILL nach der Gnadenfrist.
    await vi.advanceTimersByTimeAsync(ABSCHLUSS_FRIST_MS)

    await expect(versprechen).resolves.toBeUndefined()
    expect(kind.signale).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('beschiesst denselben Prozess beim zweiten Abbruch nicht erneut', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const erster = beendeLaufendenProzess()
    const zweiter = beendeLaufendenProzess()

    expect(kind.signale).toEqual(['SIGTERM'])
    kind.beende()
    await expect(Promise.all([erster, zweiter])).resolves.toEqual([undefined, undefined])
  })
})

describe('beendeLaufendenProzess - POSIX', () => {
  it('sendet erst SIGTERM und nach der Gnadenfrist SIGKILL', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    expect(kind.signale).toEqual(['SIGTERM'])

    await vi.advanceTimersByTimeAsync(GNADENFRIST_MS - 1)
    expect(kind.signale).toEqual(['SIGTERM'])

    await vi.advanceTimersByTimeAsync(1)
    expect(kind.signale).toEqual(['SIGTERM', 'SIGKILL'])

    // Kein taskkill ausserhalb von Windows.
    expect(zustand.aufrufe).toEqual([])

    kind.beende()
    await versprechen
  })

  it('schickt kein SIGKILL hinterher, wenn SIGTERM gewirkt hat', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    kind.beende()
    await versprechen

    // ffmpeg hat geordnet beendet und seine Datei-Handles freigegeben - ein SIGKILL
    // danach traefe im schlimmsten Fall eine neu vergebene PID.
    await vi.advanceTimersByTimeAsync(GNADENFRIST_MS + 1)
    expect(kind.signale).toEqual(['SIGTERM'])
  })
})

describe('beendeLaufendenProzess - Windows', () => {
  it('startet taskkill mit Argument-Array und benutzt keinen Signalnamen', async () => {
    aufPlattform('win32')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()

    const aufruf = ersterAufruf()
    expect(aufruf.datei).toBe('taskkill')
    expect(aufruf.argumente).toEqual(['/pid', '4711', '/t', '/f'])
    expect(aufruf.optionen).toEqual({ windowsHide: true })
    expect(aufruf.optionen.shell).toBeUndefined()

    // Windows kennt keine Signale: Node bildet jeden Namen auf ein hartes
    // TerminateProcess ab, und etwaige Kindprozesse ueberleben - dagegen steht `/t`.
    expect(aufruf.argumente.some((a) => a.startsWith('SIG'))).toBe(false)
    expect(kind.signale).toEqual([])

    werkzeug().sende('close', 0)
    kind.beende()
    await versprechen
  })

  it('greift nicht zum Handle, wenn taskkill mit 0 endet', async () => {
    aufPlattform('win32')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    werkzeug().sende('close', 0)
    kind.beende()
    await versprechen

    expect(kind.signale).toEqual([])
  })

  // Gemessen am 14.08.2026: taskkill auf eine PID, die es nicht mehr gibt, endet mit
  // Exit-Code 128.
  it('faellt auf das Handle zurueck, wenn taskkill einen Fehlschlag meldet', async () => {
    aufPlattform('win32')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    werkzeug().sende('close', 128)

    expect(kind.signale).toEqual([undefined])
    kind.beende()
    await versprechen
  })

  it('faellt auf das Handle zurueck, wenn taskkill gar nicht startet', async () => {
    aufPlattform('win32')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()
    werkzeug().sende('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }))

    expect(kind.signale).toEqual([undefined])
    kind.beende()
    await versprechen
  })

  it('faellt auf das Handle zurueck, wenn spawn selbst wirft', async () => {
    aufPlattform('win32')
    zustand.spawnWirft = new Error('taskkill nicht ausfuehrbar')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()

    expect(kind.signale).toEqual([undefined])
    kind.beende()
    await expect(versprechen).resolves.toBeUndefined()
  })

  // Ohne PID ist der Start selbst fehlgeschlagen. `String(undefined)` als Argument
  // waere ein taskkill ins Blaue - und im schlimmsten Fall auf einen fremden Prozess.
  it('ruft taskkill nicht ohne PID auf', async () => {
    aufPlattform('win32')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    kind.pid = undefined
    merkeProzess(alsHandle(kind))

    const versprechen = beendeLaufendenProzess()

    expect(zustand.aufrufe).toEqual([])
    expect(kind.signale).toEqual([undefined])
    kind.beende()
    await versprechen
  })
})

describe('merkeProzess und gibProzessFrei - der eine Platz', () => {
  it('laesst das gemerkte Handle von einem fremden gibProzessFrei unangetastet', async () => {
    aufPlattform('darwin')
    const { merkeProzess, gibProzessFrei, beendeLaufendenProzess } = await frischesModul()
    const gemerkt = erzeugeKind(1001)
    const fremd = erzeugeKind(1002)
    merkeProzess(alsHandle(gemerkt))

    // Das spaet eintreffende Ende eines alten Laufs darf den neuen nicht abmelden.
    gibProzessFrei(alsHandle(fremd))

    const versprechen = beendeLaufendenProzess()
    expect(gemerkt.signale).toEqual(['SIGTERM'])
    expect(fremd.signale).toEqual([])

    gemerkt.beende()
    await versprechen
  })

  it('gibt den Platz frei, wenn das gemerkte Handle uebergeben wird', async () => {
    aufPlattform('darwin')
    const { merkeProzess, gibProzessFrei, beendeLaufendenProzess } = await frischesModul()
    const kind = erzeugeKind()
    merkeProzess(alsHandle(kind))

    gibProzessFrei(alsHandle(kind))
    await beendeLaufendenProzess()

    expect(kind.signale).toEqual([])
  })

  it('ersetzt ein schon liegendes Handle, ohne zu werfen, und protokolliert das', async () => {
    aufPlattform('darwin')
    const { merkeProzess, beendeLaufendenProzess } = await frischesModul()
    const alt = erzeugeKind(1001)
    const neu = erzeugeKind(1002)

    merkeProzess(alsHandle(alt))
    expect(() => merkeProzess(alsHandle(neu))).not.toThrow()
    expect(protokoll).toHaveBeenCalledTimes(1)

    const versprechen = beendeLaufendenProzess()
    expect(neu.signale).toEqual(['SIGTERM'])
    expect(alt.signale).toEqual([])

    neu.beende()
    await versprechen
  })
})
