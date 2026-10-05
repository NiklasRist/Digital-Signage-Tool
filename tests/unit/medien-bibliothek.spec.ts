// Tests zu #335 (NA-02) - medien-bibliothek.ts (zweiter Importweg per Drag-and-drop).
// `rufeAuf` (#24) wird als Doppel ersetzt; FORMAT_WHITELIST (#13) wird ECHT benutzt.
// Der Kanal-Entscheidung folgend (Variante A, User 05.10.): fließt über queue:reiheEin.
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { File } from '../../src/renderer/ipc-client/pfad-fuer-datei'

// ---------------- Doppel (hoisted, Muster wie aktion-loeschen.spec.ts) ----------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  wirft: false,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    if (doppel.wirft) {
      throw new Error('Bridge fehlt')
    }
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

import {
  greifeDropAuf,
  reiheDropEin,
  type PfadHoler,
} from '../../src/renderer/composer/medien-bibliothek'

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/composer/medien-bibliothek.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('medien-bibliothek.ts – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('KEIN zweiter Main-Weg: kein Direktaufruf an media:, kein eigener Kanalname, kein Dateisystem', () => {
    for (const verbot of [
      "'media:", 'KANAELE.media', 'importMedium', "'rw:'", 'node:fs', 'node:path', 'existsSync',
      'starteMedienImport', 'öffneMedienDialog',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
    // Der EINZIGE Main-Weg ist queue:reiheEin (Torwächter).
    expect(CODEZEILEN).toContain('KANAELE.queue.reiheEin')
    expect((CODEZEILEN.match(/KANAELE\.queue/g) ?? []).length).toBe(1)
  })

  it('die zweite Formatquelle ist tabu: FORMAT_WHITELIST ist die EINE Quelle und wird benutzt (kein Duplikat)', () => {
    expect(CODEZEILEN).toContain('FORMAT_WHITELIST')
    // Kein händisches Duplikat der Endungen:
    expect(CODEZEILEN).not.toContain("['mp4'")
    expect(CODEZEILEN).not.toContain("['jpg'")
  })
})

// ---------------- Bausteine ----------------

function datei(name: string, pfad: string): { file: File; pfad: string } {
  return { file: { name, path: pfad } as unknown as File, pfad }
}

function pfadHoler(liste: Array<{ file: File; pfad: string }>): PfadHoler {
  const karte = new Map<File, string>(liste.map((eintrag) => [eintrag.file, eintrag.pfad]))
  return (datei) => karte.get(datei) ?? ''
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = null
  doppel.wirft = false
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------- greifeDropAuf ----------------

describe('greifeDropAuf (#335)', () => {
  it('unterstützte Videodatei -> einreihbar, webpackbar; keine Abweisung', () => {
    const e1 = datei('a.mp4', 'C:/Videos/a.mp4')
    const ergebnis = greifeDropAuf([e1.file], pfadHoler([e1]))
    expect(ergebnis.einreihbar).toEqual(['C:/Videos/a.mp4'])
    expect(ergebnis.abgelehnt).toEqual([])
    expect(ergebnis.ohnePfad).toBe(0)
  })

  it('mehrere Dateien nacheinander in Zugreihenfolge aufgeteilt (Teilerfolg)', () => {
    const a = datei('a.mp4', 'C:/a.mp4')
    const b = datei('b.xyz', 'C:/b.xyz')
    const c = datei('c.png', 'C:/c.png')
    const ergebnis = greifeDropAuf([a.file, b.file, c.file], pfadHoler([a, b, c]))
    expect(ergebnis.einreihbar).toEqual(['C:/a.mp4', 'C:/c.png'])
    expect(ergebnis.abgelehnt).toEqual([
      {
        pfad: 'C:/b.xyz',
        code: 'format_nicht_unterstuetzt',
        meldung: expect.stringContaining('b.xyz'),
      },
    ])
  })

  it('nicht-whitelisted Endung -> abgewiesen OHNE Auftrag (code format_nicht_unterstuetzt, EINE Quelle #13)', () => {
    const b = datei('b.webm', 'C:/b.webm')
    const ergebnis = greifeDropAuf([b.file], pfadHoler([b]))
    expect(ergebnis.einreihbar).toEqual([])
    expect(ergebnis.abgelehnt).toHaveLength(1)
    expect(ergebnis.abgelehnt[0]?.code).toBe('format_nicht_unterstuetzt')
  })

  it('GROSSESCHREIBUNG und jpeg werden normalisiert/akzeptiert (EINE Quelle: FORMAT_WHITELIST)', () => {
    const a = datei('A.MP4', 'C:/A.MP4')
    const b = datei('b.JPEG', 'C:/b.JPEG')
    const ergebnis = greifeDropAuf([a.file, b.file], pfadHoler([a, b]))
    expect(ergebnis.einreihbar).toEqual(['C:/A.MP4', 'C:/b.JPEG'])
  })

  it('keine auswertbare Endung: abgewiesen mit ausdrücklicher Hinweismeldung', () => {
    const a = datei('README', 'C:/README')
    const ergebnis = greifeDropAuf([a.file], pfadHoler([a]))
    expect(ergebnis.einreihbar).toEqual([])
    expect(ergebnis.abgelehnt[0]?.code).toBe('format_nicht_unterstuetzt')
    expect(ergebnis.abgelehnt[0]?.meldung).toContain('keine auswertbare Dateiendung')
  })

  it('ohne Pfad (Textauswahl, webUtils fehlte): kein Auftrag, als ohnePfad gezählt, keine Abweisung', () => {
    const leer: { file: File; pfad: string } = { file: { name: 'text' } as File, pfad: '' }
    const ergebnis = greifeDropAuf([leer.file], pfadHoler([leer]))
    expect(ergebnis.einreihbar).toEqual([])
    expect(ergebnis.ohnePfad).toBe(1)
    expect(ergebnis.abgelehnt).toEqual([])
  })

  it('werfendes Pfad-Holer wird gefangen (wie ein fehlender Pfad merklich)', () => {
    const datei1 = { file: { name: 'a.mp4' } as unknown as File }
    const werfer: PfadHoler = () => {
      throw new Error('webUtils fehlt')
    }
    const ergebnis = greifeDropAuf([datei1.file], werfer)
    expect(ergebnis.ohnePfad).toBe(1)
  })

  it('UNIX-Pfadtrenner werden auf der gleichen Fachebene behandelt (macOS-Fitnessstudio-Weights)', () => {
    const a = datei('a.mp4', '/Volumes/STICK/a.mp4')
    const ergebnis = greifeDropAuf([a.file], pfadHoler([a]))
    expect(ergebnis.einreihbar).toEqual(['/Volumes/STICK/a.mp4'])
  })
})

// ---------------- reiheDropEin ----------------

describe('reiheDropEin (#335) – der Torwächter-Weg wie in #228', () => {
  it('reiht JEĞ-en Pfad GENAU EINMAL ein, NACHEINANDER, mit demselben Payload wie #228', async () => {
    doppel.antwort = { ok: true, wert: { auftragId: 'q-1' } }
    const wert = await reiheDropEin('p-1', ['C:/a.mp4', 'C:/c.png'])
    expect(doppel.aufrufe).toEqual([
      {
        kanal: 'queue:reiheEin',
        nutzlast: { art: 'import', payload: { projektId: 'p-1', quellPfad: 'C:/a.mp4' } },
      },
      {
        kanal: 'queue:reiheEin',
        nutzlast: { art: 'import', payload: { projektId: 'p-1', quellPfad: 'C:/c.png' } },
      },
    ])
    expect(wert.auftragIds).toEqual(['q-1', 'q-1'])
    expect(wert.abgebrochen).toBe(false)
  })

  it('Ablehnungeines Pfades: bleibt benennbar in abgelehnt, kein Abbruch', async () => {
    doppel.antwort = {
      ok: false,
      fehler: { code: 'format_nicht_unterstuetzt', meldung: 'vom Main' },
    }
    const wert = await reiheDropEin('p-1', ['C:/b.webm'])
    expect(wert.auftragIds).toEqual([])
    expect(wert.abgelehnt).toEqual([
      { pfad: 'C:/b.webm', code: 'format_nicht_unterstuetzt', meldung: 'vom Main' },
    ])
  })

  it('wirft der Einreihungs-Aufruf: gezogen als unbekannter_fehler, benennbar - der Wurf verlässt die Datei nicht', async () => {
    doppel.wirft = true
    const wert = await reiheDropEin('p-1', ['C:/a.mp4'])
    expect(wert.abgelehnt).toEqual([
      {
        pfad: 'C:/a.mp4',
        code: 'unbekannter_fehler',
        meldung: 'Der Import-Auftrag konnte nicht eingereiht werden.',
      },
    ])
  })
})
