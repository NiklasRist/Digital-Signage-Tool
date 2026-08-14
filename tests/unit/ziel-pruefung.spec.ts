import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Verhaltenstest zu pruefeExportZiel (#184).
//
// ECHTE Ordner und Dateien in einem Temp-Ordner: Die Funktion lebt davon, ob dort ein
// Verzeichnis liegt, eine Datei oder nichts - ein durchgehend gemocktes `fs` pruefte nur noch
// die eigene Attrappe. Zwei Dinge sind trotzdem gestellt, weil sie sich echt nicht herstellen
// lassen: der FREIE PLATZ (er richtet sich nach der Testmaschine, ein "kein Platz"-Fall waere
// sonst nicht ausloesbar) und ein RECHTEPROBLEM (unter Windows greift chmod nicht).
//
// `stat`, `access` und `statfs` reichen im Normalfall an das echte Dateisystem durch und
// zaehlen dabei mit, WER ueberhaupt angefasst wurde - das ist der Zeuge fuer "kein
// Dateisystemzugriff bei ungueltiger Eingabe".
const zustand = vi.hoisted(() => ({
  /** Jeder fs-Aufruf, in Reihenfolge, als "name:pfad". */
  aufrufe: [] as string[],
  /** Gestellter freier Platz; `null` = echte Antwort des Dateisystems. */
  statfsAntwort: null as { bavail: number; bsize: number } | null,
  /** Wenn gesetzt, wirft `statfs` das hier. */
  statfsFehler: null as Error | null,
  /** Wenn gesetzt, wirft `access` das hier. */
  accessFehler: null as NodeJS.ErrnoException | null,
}))

vi.mock('node:fs/promises', async (originalImportieren) => {
  const echt = await originalImportieren<typeof import('node:fs/promises')>()
  const stat = async (ziel: string) => {
    zustand.aufrufe.push(`stat:${ziel}`)
    return echt.stat(ziel)
  }
  const access = async (ziel: string, modus?: number) => {
    zustand.aufrufe.push(`access:${ziel}`)
    if (zustand.accessFehler !== null) {
      throw zustand.accessFehler
    }
    return echt.access(ziel, modus)
  }
  const statfs = async (ziel: string) => {
    zustand.aufrufe.push(`statfs:${ziel}`)
    if (zustand.statfsFehler !== null) {
      throw zustand.statfsFehler
    }
    const echteAntwort = await echt.statfs(ziel)
    if (zustand.statfsAntwort === null) {
      return echteAntwort
    }
    return { ...echteAntwort, ...zustand.statfsAntwort }
  }
  return { ...echt, stat, access, statfs, default: { ...echt, stat, access, statfs } }
})

const { pruefeExportZiel, dateisystemErkennung, FAT32_MAX_DATEIGROESSE } = await import(
  '../../src/main/export-service/ziel-pruefung'
)

const wurzel = mkdtempSync(path.join(os.tmpdir(), 'ziel-pruefung-'))
/** Eine echte Datei - fuer den Fall "existiert, ist aber kein Verzeichnis". */
const datei = path.join(wurzel, 'keine-mappe.mp4')

beforeEach(() => {
  writeFileSync(datei, 'x')
})

afterEach(() => {
  zustand.aufrufe = []
  zustand.statfsAntwort = null
  zustand.statfsFehler = null
  zustand.accessFehler = null
  vi.restoreAllMocks()
})

afterAll(() => {
  rmSync(wurzel, { recursive: true, force: true })
})

/** Legt einen frischen Zielordner an und liefert seinen Pfad. */
function frischerOrdner(...dateien: Array<{ name: string; bytes: number }>): string {
  const ordner = mkdtempSync(path.join(wurzel, 'ziel-'))
  for (const eintrag of dateien) {
    writeFileSync(path.join(ordner, eintrag.name), Buffer.alloc(eintrag.bytes))
  }
  return ordner
}

/** Stellt den freien Platz auf genau diese Bytezahl. `bsize: 1` haelt die Rechnung trivial. */
function freierPlatz(bytes: number): void {
  zustand.statfsAntwort = { bavail: bytes, bsize: 1 }
}

describe('pruefeExportZiel - Formpruefung', () => {
  const ungueltig: Array<[string, unknown, unknown]> = [
    ['leerer Zielordner', '', 100],
    ['Zielordner kein String', 42, 100],
    ['Zielordner undefined', undefined, 100],
    ['negative Groesse', 'C:\\ziel', -1],
    ['NaN als Groesse', 'C:\\ziel', Number.NaN],
    ['Infinity als Groesse', 'C:\\ziel', Number.POSITIVE_INFINITY],
    ['Groesse keine Zahl', 'C:\\ziel', '100'],
  ]

  for (const [name, ordner, bytes] of ungueltig) {
    it(`${name} -> ungueltige_eingabe, ohne jeden fs-Aufruf`, async () => {
      const ergebnis = await pruefeExportZiel(ordner as string, bytes as number)

      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
      }
      // Der eigentliche Punkt: Die Platte wurde nicht angefasst.
      expect(zustand.aufrufe).toEqual([])
    })
  }
})

describe('pruefeExportZiel - Erreichbarkeit', () => {
  it('nicht angelegter Pfad -> ziel_nicht_verfügbar', async () => {
    const fehlt = path.join(wurzel, 'nie-angelegt', 'usb')

    const ergebnis = await pruefeExportZiel(fehlt, 1000)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ziel_nicht_verfügbar')
      // Der Nutzer muss den Ordner wiedererkennen, um den richtigen Stick einzustecken.
      expect(ergebnis.fehler.meldung).toContain(fehlt)
    }
    // Nach dem gescheiterten stat wird nichts weiter versucht.
    expect(zustand.aufrufe).toEqual([`stat:${fehlt}`])
  })

  it('Datei statt Ordner -> ziel_nicht_verfügbar', async () => {
    const ergebnis = await pruefeExportZiel(datei, 1000)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ziel_nicht_verfügbar')
    }
    expect(zustand.aufrufe).toEqual([`stat:${datei}`])
  })

  it('nicht beschreibbar -> ziel_nicht_verfügbar, und der Platz wird gar nicht mehr geprueft', async () => {
    const ordner = frischerOrdner()
    const fehler: NodeJS.ErrnoException = Object.assign(new Error('EACCES'), { code: 'EACCES' })
    zustand.accessFehler = fehler

    const ergebnis = await pruefeExportZiel(ordner, 1000)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ziel_nicht_verfügbar')
      expect(ergebnis.fehler.meldung).toContain('beschreibbar')
    }
    expect(zustand.aufrufe.some((eintrag) => eintrag.startsWith('statfs:'))).toBe(false)
  })
})

describe('pruefeExportZiel - freier Platz', () => {
  it('weniger frei als benoetigt -> kein_platz', async () => {
    const ordner = frischerOrdner()
    freierPlatz(999)

    const ergebnis = await pruefeExportZiel(ordner, 1000)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('kein_platz')
      expect(ergebnis.fehler.meldung).toContain('1000')
      expect(ergebnis.fehler.meldung).toContain('999')
    }
  })

  it('genau so viel frei wie benoetigt -> ok', async () => {
    const ordner = frischerOrdner()
    freierPlatz(1000)

    const ergebnis = await pruefeExportZiel(ordner, 1000)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('eine gleich grosse Zieldatei im Ordner wird NICHT abgezogen', async () => {
    // Waehrend des Kopierens liegen `.part` und alte Datei gleichzeitig auf dem Stick
    // (TK 9.6.3). Wer die vorhandene abzieht, haette hier 999 + 1000 = genug gerechnet.
    const ordner = frischerOrdner({ name: 'sommeraktion.mp4', bytes: 1000 })
    freierPlatz(999)

    const ergebnis = await pruefeExportZiel(ordner, 1000)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('kein_platz')
    }
  })

  it('werfendes statfs -> ok (Rueckfallregel)', async () => {
    const ordner = frischerOrdner()
    zustand.statfsFehler = Object.assign(new Error('ENOSYS'), { code: 'ENOSYS' })

    const ergebnis = await pruefeExportZiel(ordner, Number.MAX_SAFE_INTEGER)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })
})

describe('pruefeExportZiel - FAT32-Grenze', () => {
  it('die Konstante ist 4 GiB minus ein Byte', () => {
    expect(FAT32_MAX_DATEIGROESSE).toBe(4294967295)
  })

  it('bei erkanntem FAT32 passt die Datei bei exakt der Grenze noch', async () => {
    const ordner = frischerOrdner()
    vi.spyOn(dateisystemErkennung, 'erkenne').mockResolvedValue('fat32')
    freierPlatz(Number.MAX_SAFE_INTEGER)

    const ergebnis = await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('bei erkanntem FAT32 ist ein Byte mehr zu viel -> datei_zu_gross_fat32', async () => {
    const ordner = frischerOrdner()
    vi.spyOn(dateisystemErkennung, 'erkenne').mockResolvedValue('fat32')
    freierPlatz(Number.MAX_SAFE_INTEGER)

    const ergebnis = await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE + 1)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('datei_zu_gross_fat32')
      // TK 9.6.4 fuehrt den Code als "-> exFAT noetig"; ohne diesen Hinweis ist die
      // Meldung fuer das Studio-Personal nicht handlungsfaehig.
      expect(ergebnis.fehler.meldung).toContain('exFAT')
    }
  })

  it('ein anderes Dateisystem loest die Grenze nicht aus', async () => {
    const ordner = frischerOrdner()
    vi.spyOn(dateisystemErkennung, 'erkenne').mockResolvedValue('anderes')
    freierPlatz(Number.MAX_SAFE_INTEGER)

    const ergebnis = await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE + 1)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('werfende Erkennung -> ok (Rueckfallregel)', async () => {
    const ordner = frischerOrdner()
    vi.spyOn(dateisystemErkennung, 'erkenne').mockRejectedValue(new Error('kein Verfahren'))
    freierPlatz(Number.MAX_SAFE_INTEGER)

    const ergebnis = await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE + 1)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('SO IST DER STAND: ohne beantwortetes Experiment erkennt niemand FAT32, der Waechter greift also nicht', async () => {
    const ordner = frischerOrdner()
    freierPlatz(Number.MAX_SAFE_INTEGER)

    // Voreinstellung, kein Spy: Die Erkennung liefert `null` = nicht ermittelbar.
    await expect(dateisystemErkennung.erkenne(ordner)).resolves.toBeNull()

    const ergebnis = await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE + 1)

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })
})

describe('pruefeExportZiel - Wirkungslosigkeit am Ziel', () => {
  it('kein Durchlauf veraendert den Ordnerinhalt', async () => {
    const ordner = frischerOrdner({ name: 'alte-ausgabe.mp4', bytes: 8 })
    const vorher = readdirSync(ordner).sort()

    // Erfolg, kein_platz und datei_zu_gross_fat32 nacheinander durch denselben Ordner.
    freierPlatz(10_000)
    await pruefeExportZiel(ordner, 1000)
    freierPlatz(1)
    await pruefeExportZiel(ordner, 1000)
    freierPlatz(Number.MAX_SAFE_INTEGER)
    vi.spyOn(dateisystemErkennung, 'erkenne').mockResolvedValue('fat32')
    await pruefeExportZiel(ordner, FAT32_MAX_DATEIGROESSE + 1)

    expect(readdirSync(ordner).sort()).toEqual(vorher)
    // Weder eine Testdatei noch ein angelegter Unterordner - und die alte Ausgabe lebt.
    expect(vorher).toEqual(['alte-ausgabe.mp4'])
  })

  it('ein fehlender Zielordner wird nicht angelegt', async () => {
    const fehlt = path.join(wurzel, 'wird-nicht-angelegt')

    await pruefeExportZiel(fehlt, 1000)

    expect(readdirSync(wurzel)).not.toContain('wird-nicht-angelegt')
  })
})

describe('pruefeExportZiel - wirft nie', () => {
  it('jeder Fehlerfall kommt als Ergebnis zurueck, keiner als Ausnahme', async () => {
    const ordner = frischerOrdner()
    const faelle: Array<() => Promise<unknown>> = [
      () => pruefeExportZiel('', 1),
      () => pruefeExportZiel(path.join(wurzel, 'gibt-es-nicht'), 1),
      () => pruefeExportZiel(datei, 1),
      () => pruefeExportZiel(ordner, Number.NaN),
    ]

    for (const fall of faelle) {
      await expect(fall()).resolves.toMatchObject({ ok: false })
    }
  })
})
