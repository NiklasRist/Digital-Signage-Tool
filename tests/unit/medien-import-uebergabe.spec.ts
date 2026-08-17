// Verhaltenstests zu #204 - das Übergabe-Ziel des Medien-Imports.
//
// Geprüft wird der werfende Rumpf der Datei: der Dialog aus #81 wird geoeffnet,
// je gewaehltem Pfad genau EIN Import-Auftrag eingereiht (nacheinander, in der
// Reihenfolge der Auswahl), auf den Ausgang der Auftraege wird NICHT gewartet
// (TK 9.1.1, 9.3.4), uebersprungen/abgelehnt tragen jeden nicht eingereihten
// Pfad benennbar, und der Typ-Filter kommt aus FORMAT_WHITELIST (#13).
//
// Die Attrappe ersetzt AUSSCHLIESSLICH `rufeAuf` (#24) - mehr Fremdes beruehrt
// die Datei nicht. Alle Antworten sind gewoehnliche Objekte OHNE Terminal-Zustand:
// die Funktion darf nie etwas sehen, was aus den Auftraegen geworden ist.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: attrappen.rufeAuf,
}))

const { starteMedienImport, typAusPfad } = await import(
  '../../src/renderer/app-shell/medien-import-uebergabe'
)

const QUELLE = readFileSync(
  new URL('../../src/renderer/app-shell/medien-import-uebergabe.ts', import.meta.url),
  'utf8',
)
// Kommentare zuerst zeilen-, dann blockweise entfernen - die Grep-Proben gelten dem Code.
const CODETEIL = QUELLE.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

beforeEach(() => {
  attrappen.rufeAuf.mockReset()
  // Sicherheitsnetz: Jeder Aufruf, fuer den der Test keine Antwort vorgesehen hat,
  // laesst den Test laut scheitern - ein stilles undefined haette nichts belegt.
  attrappen.rufeAuf.mockImplementation(() => {
    throw new Error('unvorhergesehener IPC-Aufruf in diesem Test')
  })
})

describe('typAusPfad (DoD)', () => {
  it("liefert 'video' bei Grossschreibung und Backslash-Trennzeichen (DoD)", () => {
    expect(typAusPfad('C:\\Videos\\sommer.MP4')).toBe('video')
  })

  it("liefert 'bild' fuer jpeg (DoD)", () => {
    expect(typAusPfad('/Users/x/bild.jpeg')).toBe('bild')
  })

  it.each([
    ['unbekannte Endung mov', '/Users/x/clip.mov'],
    ['keine Endung', 'ohne-endung'],
    ['fuehrender Punkt', '.gitignore'],
  ])('liefert null fuer %s (DoD)', (_name, pfad) => {
    expect(typAusPfad(pfad)).toBeNull()
  })

  it('schneidet den Verzeichnisanteil an BEIDEN Trennzeichen ab', () => {
    expect(typAusPfad('C:\\mixed/pfad\\video.Mp4')).toBe('video')
    expect(typAusPfad('relativ/bild.PNG')).toBe('bild')
  })

  it('kennt alle Endungen der Whitelist - und nur die', () => {
    expect(typAusPfad('a.mp4')).toBe('video')
    expect(typAusPfad('b.jpg')).toBe('bild')
    expect(typAusPfad('c.png')).toBe('bild')
    expect(typAusPfad('d.webp')).toBe('bild')
    expect(typAusPfad('e.jpeg')).toBe('bild')
    expect(typAusPfad('f.avi')).toBeNull()
    expect(typAusPfad('g.mov')).toBeNull()
  })
})

describe('starteMedienImport - der Ablauf', () => {
  it('lehnt eine leere projektId ohne jeden Dialog ab (DoD)', async () => {
    const ergebnis = await starteMedienImport('', null)

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: expect.any(String) },
    })
    // Der Spion wurde nachweislich NICHT gerufen - der Dialog oeffnet sich nie.
    expect(attrappen.rufeAuf).not.toHaveBeenCalled()
  })

  it('lehnt eine Nicht-Zeichenkette ebenfalls als ungueltige_eingabe ab', async () => {
    const ergebnis = await starteMedienImport(undefined as unknown as string, null)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(attrappen.rufeAuf).not.toHaveBeenCalled()
  })

  it('wertet eine leere Auswahl als Abbruch - ok: true, kein einziges Einreihen (DoD)', async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: [] } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { auftragIds: [], uebersprungen: [], abgelehnt: [], abgebrochen: true },
    })
    // Genau EIN Aufruf (der Dialog), und der kam BEREITS ohne ZWEITES Argument.
    expect(attrappen.rufeAuf.mock.calls).toEqual([[KANAELE.media.öffneMedienDialog]])
  })

  it('reicht einen fehlgeschlagenen Dialog UNVERAENDERT durch und reiht nichts ein', async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'Ploetz' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'unbekannter_fehler', meldung: 'Ploetz' },
    })
    expect(attrappen.rufeAuf.mock.calls).toEqual([[KANAELE.media.öffneMedienDialog]])
  })

  it('faengt einen Werfenden Dialog als unbekannter_fehler und reiht nichts ein', async () => {
    attrappen.rufeAuf
      .mockRejectedValueOnce(new Error('window.api weg'))

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(attrappen.rufeAuf.mock.calls).toEqual([[KANAELE.media.öffneMedienDialog]])
  })

  it('reiht bei drei Pfaden dreimal ein - Argumente UND Reihenfolge der Spion-Aufrufe (DoD)', async () => {
    const pfade = ['/a/1.mp4', '/a/2.mp4', '/a/3.mp4']
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A2' } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A3' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { auftragIds: ['A1', 'A2', 'A3'], uebersprungen: [], abgelehnt: [], abgebrochen: false },
    })
    expect(attrappen.rufeAuf.mock.calls).toEqual([
      [KANAELE.media.öffneMedienDialog],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: '/a/1.mp4' } }],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: '/a/2.mp4' } }],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: '/a/3.mp4' } }],
    ])
  })

  it('ruft die Einreihe-Aufrufe NACHEINANDER auf - der zweite beginnt erst nach dem ersten (DoD)', async () => {
    const pfade = ['/a/1.mp4', '/a/2.mp4', '/a/3.mp4']
    const reihenfolge: string[] = []
    attrappen.rufeAuf
      .mockImplementationOnce(async () => {
        reihenfolge.push('dialog')
        return { ok: true, wert: { pfade } }
      })
      .mockImplementationOnce(async () => {
        reihenfolge.push('1-begonnen')
        await new Promise((loese) => setTimeout(loese, 25))
        reihenfolge.push('1-fertig')
        return { ok: true, wert: { auftragId: 'A1' } }
      })
      .mockImplementationOnce(async () => {
        reihenfolge.push('2-begonnen')
        return { ok: true, wert: { auftragId: 'A2' } }
      })
      .mockImplementationOnce(async () => {
        reihenfolge.push('3-begonnen')
        return { ok: true, wert: { auftragId: 'A3' } }
      })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) expect(ergebnis.wert.auftragIds).toEqual(['A1', 'A2', 'A3'])
    // Das verzögerte Doppel belegt: '1-fertig' liegt VOR '2-begonnen'.
    expect(reihenfolge).toEqual(['dialog', '1-begonnen', '1-fertig', '2-begonnen', '3-begonnen'])
  })

  it("filtriert bei nurTyp:'bild' - b.mp4 wandert nach uebersprungen, a.png und c.jpg werden eingereiht (DoD)", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['a.png', 'b.mp4', 'c.jpg'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A2' } })

    const ergebnis = await starteMedienImport('projekt-1', 'bild')

    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        auftragIds: ['A1', 'A2'],
        uebersprungen: ['b.mp4'],
        abgelehnt: [],
        abgebrochen: false,
      },
    })
    expect(attrappen.rufeAuf.mock.calls).toEqual([
      [KANAELE.media.öffneMedienDialog],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: 'a.png' } }],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: 'c.jpg' } }],
    ])
  })

  it("filtriert auch bei nurTyp:'video' die Bilder heraus", async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['a.png', 'b.MP4'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })

    const ergebnis = await starteMedienImport('projekt-1', 'video')

    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        auftragIds: ['A1'],
        uebersprungen: ['a.png'],
        abgelehnt: [],
        abgebrochen: false,
      },
    })
  })

  it('reiht bei nurTyp:null auch einen Pfad mit unbekannter Endung ein - keine zweite Pruefung (DoD)', async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['seltsam.mov'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { auftragIds: ['A1'], uebersprungen: [], abgelehnt: [], abgebrochen: false },
    })
  })

  it('laeuft bei einer Ablehnung weiter: drei Aufrufe, zwei IDs, ein abgelehnter, ok: true (DoD)', async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['1.mp4', '2.mp4', '3.mp4'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })
      .mockResolvedValueOnce({ ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'böser Pfad' } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A3' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    // Das Gesamtergebnis bleibt ok: true - der AUFRUF ist gelaufen (TK 9.1.1).
    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        auftragIds: ['A1', 'A3'],
        uebersprungen: [],
        abgelehnt: [
          { pfad: '2.mp4', code: 'ungueltige_eingabe', meldung: 'böser Pfad' },
        ],
        abgebrochen: false,
      },
    })
    // Trotz der Ablehnung wurden ALLE drei Einreihe-Aufrufe gemacht.
    expect(attrappen.rufeAuf.mock.calls).toHaveLength(4)
  })

  it('faengt auch ein WERFENDES Einreihen: Pfad nach abgelehnt, die uebrigen laufen weiter', async () => {
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['1.mp4', '2.mp4', '3.mp4'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })
      .mockRejectedValueOnce(new Error('netz weg'))
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A3' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      expect(ergebnis.wert.auftragIds).toEqual(['A1', 'A3'])
      expect(ergebnis.wert.abgelehnt).toEqual([
        { pfad: '2.mp4', code: 'unbekannter_fehler', meldung: expect.any(String) },
      ])
    }
    expect(attrappen.rufeAuf.mock.calls).toHaveLength(4)
  })

  it('löst ihr Promise auf, ohne dass ein Auftrag terminal geworden ist (DoD)', async () => {
    // Das Doppel liefert IMMER nur { auftragId } und nie einen Auftrags-Endzustand -
    // die Funktion darf also nie auf einen solchen warten.
    attrappen.rufeAuf.mockReset()
    attrappen.rufeAuf
      .mockResolvedValueOnce({ ok: true, wert: { pfade: ['x.mp4'] } })
      .mockResolvedValueOnce({ ok: true, wert: { auftragId: 'A1' } })

    const ergebnis = await starteMedienImport('projekt-1', null)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { auftragIds: ['A1'], uebersprungen: [], abgelehnt: [], abgebrochen: false },
    })
    // Und danach kam NICHTS mehr: kein holeStand, kein Abo, kein Nachfragen.
    expect(attrappen.rufeAuf.mock.calls).toEqual([
      [KANAELE.media.öffneMedienDialog],
      [KANAELE.queue.reiheEin, { art: 'import', payload: { projektId: 'projekt-1', quellPfad: 'x.mp4' } }],
    ])
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  it('die Abschaltzeile aus Zeile 1 ist entfernt', () => {
    expect(QUELLE.startsWith('/* eslint-disable')).toBe(false)
    expect(QUELLE.startsWith('// GENERIERT aus dem Signaturblock von Issue #204.')).toBe(true)
  })

  it('die Signatur ist verbindlich und wörtlich unveraendert geblieben', () => {
    expect(QUELLE).toContain('export interface ImportUebergabeErgebnis {')
    expect(QUELLE).toContain('auftragIds: string[]')
    expect(QUELLE).toContain('uebersprungen: string[]')
    expect(QUELLE).toContain('abgelehnt: Array<{ pfad: string; code: string; meldung: string }>')
    expect(QUELLE).toContain('abgebrochen: boolean')
    expect(QUELLE).toContain('): Promise<Ergebnis<ImportUebergabeErgebnis, string>> {')
    expect(QUELLE).toContain("export function typAusPfad(pfad: string): 'video' | 'bild' | null {")
  })

  it('der werfende Geruest-Rumpf ist weg', () => {
    expect(QUELLE).not.toContain('Rumpf gehoert zu Issue #204')
  })

  it('enthaelt keins der im DoD verbotenen Konstrukte', () => {
    for (const verboten of [
      'abonniere',
      "'queue:geaendert'",
      'setInterval',
      'setTimeout',
      'window.api',
    ]) {
      expect(CODETEIL).not.toContain(verboten)
    }
    // Kanalnamen kommen ausschliesslich aus KANAELE - nie als String-Literal.
    expect(CODETEIL).not.toMatch(/['"](?:media|queue):/)
    // Kein react-Import und kein JSX.
    expect(CODETEIL).not.toMatch(/from\s+['"]react['"]/)
    expect(CODETEIL).not.toMatch(/<[A-Za-z][A-Za-z0-9]*\s/)
  })
})

describe('Gegenproben - die Grep-Proben muessen wirklich beissen', () => {
  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    const gefaelscht = '/* eslint-disable @typescript-eslint/no-unused-vars */\n// GENERIERT'
    expect(gefaelscht.startsWith('/* eslint-disable')).toBe(true)
  })

  it('ein eingeschmuggeltes verbotenes Konstrukt wird vom Filter gefunden', () => {
    const gefaelscht = CODETEIL + '\nsetInterval(poll, 1000)'
    expect(gefaelscht).toContain('setInterval')
  })

  it('ein eingeschmuggeltes Kanal-Literal wird vom Regex gefunden', () => {
    const gefaelscht = "const k = 'media:oeffneMedienDialog'"
    expect(gefaelscht).toMatch(/['"](?:media|queue):/)
  })

  it('eine eingeschmuggelte react-Spezifikation wird gefunden', () => {
    const gefaelscht = "import { useState } from 'react'"
    expect(gefaelscht).toMatch(/from\s+['"]react['"]/)
  })
})