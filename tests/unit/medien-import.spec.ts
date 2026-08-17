// Verhaltenstests zu #228 - der Weg aus der Medien-Bibliothek heraus.
//
// Geprüft wird der werfende Rumpf der Datei: `importiereMedien` stösst den
// Übergabe-Weg aus #204 (als Parameter übergeben, Entscheidung E1) GENAU EINMAL
// mit `nurTyp: null` an, wartet NICHT auf den Ausgang (der läuft über #199
// zurück), reicht ein `ok: false` UNVERÄNDERT durch und übersetzt ein `ok: true`
// über `baueImportBericht` in einen Klartext-Bericht, der Übersprungenes beim
// DATEINAMEN und Abgelehntes bei Dateiname+Code nennt (ENTSCHIEDEN 2/3/4).
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ImportUebergabeErgebnis } from '../../src/renderer/app-shell/medien-import-uebergabe'
import type { MedienImportStarter } from '../../src/renderer/composer/medien-import'

const { baueImportBericht, dateinameAusPfad, importiereMedien } = await import(
  '../../src/renderer/composer/medien-import'
)

const QUELLE = readFileSync(
  new URL('../../src/renderer/composer/medien-import.ts', import.meta.url),
  'utf8',
)
// Kommentare zuerst zeilen-, dann blockweise entfernen - die Grep-Proben gelten dem Code.
const CODETEIL = QUELLE.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

/** Ein vollständiges Ergebnis von #204, wie `starteMedienImport` es liefern kann. */
function ergebnisVon204(teil: Partial<ImportUebergabeErgebnis> = {}): ImportUebergabeErgebnis {
  return {
    auftragIds: [],
    uebersprungen: [],
    abgelehnt: [],
    abgebrochen: false,
    ...teil,
  }
}

describe('importiereMedien - der Ablauf', () => {
  let starte: ReturnType<typeof vi.fn<MedienImportStarter>> = vi.fn()

  beforeEach(() => {
    starte = vi.fn<MedienImportStarter>()
  })

  it('ruft den Starter genau einmal mit (projektId, null) - zweiter Parameter IMMER null (DoD)', async () => {
    starte.mockResolvedValue({ ok: true, wert: ergebnisVon204({ auftragIds: ['A1'] }) })

    const ergebnis = await importiereMedien('p1', starte)

    expect(ergebnis.ok).toBe(true)
    expect(starte).toHaveBeenCalledTimes(1)
    expect(starte.mock.calls[0]).toEqual(['p1', null])
  })

  it('lässt BEIDE Typen zu - null ist der einzige jemals übergebene zweite Parameter (DoD)', async () => {
    starte.mockResolvedValue({ ok: true, wert: ergebnisVon204() })

    await importiereMedien('projekt-1', starte)
    await importiereMedien('projekt-2', starte)

    for (const aufruf of starte.mock.calls) {
      expect(aufruf[1]).toBeNull()
    }
    expect(starte).toHaveBeenCalledTimes(2)
  })

  it('lehnt eine leere projektId ohne jeden Starter-Aufruf ab (DoD)', async () => {
    const ergebnis = await importiereMedien('', starte)

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: expect.any(String) },
    })
    expect(starte).not.toHaveBeenCalled()
  })

  it('lehnt eine Nicht-Zeichenkette ebenfalls als ungueltige_eingabe ab', async () => {
    const ergebnis = await importiereMedien(undefined as unknown as string, starte)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(starte).not.toHaveBeenCalled()
  })

  it('reicht ein ok: false UNVERAENDERT durch und erzeugt KEINEN Bericht - zwei Codes (DoD)', async () => {
    for (const code of ['unbekannter_fehler', 'ungueltige_eingabe']) {
      starte.mockReset()
      starte.mockResolvedValue({
        ok: false,
        fehler: { code, meldung: 'Ursache bleibt sichtbar' },
      })

      const ergebnis = await importiereMedien('p1', starte)

      expect(ergebnis).toEqual({
        ok: false,
        fehler: { code, meldung: 'Ursache bleibt sichtbar' },
      })
      // Kein Bericht: es gibt kein `wert`-Feld.
      expect('wert' in ergebnis).toBe(false)
    }
  })

  it('faengt einen WERFENDEN Starter als unbekannter_fehler (DoD Fehlerpfad)', async () => {
    starte.mockRejectedValue(new Error('Bridge weg'))

    const ergebnis = await importiereMedien('p1', starte)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
  })

  it('übersetzt ein ok: true über baueImportBericht in den Bericht (DoD)', async () => {
    starte.mockResolvedValue({
      ok: true,
      wert: ergebnisVon204({ auftragIds: ['A1', 'A2'] }),
    })

    const ergebnis = await importiereMedien('p1', starte)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { eingereiht: 2, abgebrochen: false, text: expect.any(String), brauchtAufmerksamkeit: false },
    })
  })

  it('bleibt bei ALLEN abgelehnten Pfaden ok: true mit eingereiht: 0 (Teilerfolg-Regel, DoD)', async () => {
    starte.mockResolvedValue({
      ok: true,
      wert: ergebnisVon204({
        abgelehnt: [
          { pfad: '/a/b.mp4', code: 'ungueltige_eingabe', meldung: 'böser Pfad' },
          { pfad: '/a/c.mp4', code: 'nicht_gefunden', meldung: 'weg' },
        ],
      }),
    })

    const ergebnis = await importiereMedien('p1', starte)

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      expect(ergebnis.wert.eingereiht).toBe(0)
      expect(ergebnis.wert.brauchtAufmerksamkeit).toBe(true)
    }
  })

  it('wartet NICHT auf den Ausgang - der Bericht entsteht direkt aus der Übergabe (DoD)', async () => {
    // Der Spion liefert NUR das Übergabe-Ergebnis (auftragIds) und nie einen
    // Auftrags-Endzustand - importiereMedien darf also nie auf einen warten.
    starte.mockResolvedValue({ ok: true, wert: ergebnisVon204({ auftragIds: ['A1'] }) })

    const ergebnis = await importiereMedien('p1', starte)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { eingereiht: 1, abgebrochen: false, text: '1 Medium eingereiht', brauchtAufmerksamkeit: false },
    })
  })
})

describe('baueImportBericht - der Text (ENTSCHIEDEN 3/4/5)', () => {
  it('liefert bei abgebrochen: true eingereiht: 0, text: "" und brauchtAufmerksamkeit: false (DoD)', () => {
    const bericht = baueImportBericht(ergebnisVon204({ abgebrochen: true }))

    expect(bericht).toEqual({
      eingereiht: 0,
      abgebrochen: true,
      text: '',
      brauchtAufmerksamkeit: false,
    })
  })

  it('zählt drei auftragIds, bleibt leise und sagt "eingereiht" statt "importiert" (DoD)', () => {
    const bericht = baueImportBericht(ergebnisVon204({ auftragIds: ['A1', 'A2', 'A3'] }))

    expect(bericht.eingereiht).toBe(3)
    expect(bericht.brauchtAufmerksamkeit).toBe(false)
    expect(bericht.text).toContain('eingereiht')
    expect(bericht.text).not.toContain('importiert')
  })

  it('nennt jeden übersprungenen Pfad mit seinem DATEINAMEN (DoD)', () => {
    const bericht = baueImportBericht(
      ergebnisVon204({
        auftragIds: ['A1'],
        uebersprungen: ['C:\\Videos\\werbung.mp4', '/Users/x/bild.jpg'],
      }),
    )

    expect(bericht.brauchtAufmerksamkeit).toBe(true)
    expect(bericht.text).toContain('werbung.mp4')
    expect(bericht.text).toContain('bild.jpg')
    expect(bericht.text).not.toContain('C:\\Videos')
    expect(bericht.text).not.toContain('/Users/x')
  })

  it('nennt jeden abgelehnten Pfad mit DATEINAME und Code (DoD)', () => {
    const bericht = baueImportBericht(
      ergebnisVon204({
        auftragIds: ['A1'],
        abgelehnt: [{ pfad: '/Videos/kaputt.mp4', code: 'ungueltige_eingabe', meldung: 'x' }],
      }),
    )

    expect(bericht.brauchtAufmerksamkeit).toBe(true)
    expect(bericht.text).toContain('kaputt.mp4')
    expect(bericht.text).toContain('ungueltige_eingabe')
  })

  it('enthaelt bei abgelehnten Pfaden KEINEN absoluten Pfad - nur den Dateinamen (DoD)', () => {
    const bericht = baueImportBericht(
      ergebnisVon204({
        abgelehnt: [
          { pfad: 'C:\\Videos\\a.mp4', code: 'nicht_gefunden', meldung: 'm' },
          { pfad: '/Users/x/a.mp4', code: 'unbekannter_fehler', meldung: 'm' },
        ],
      }),
    )

    expect(bericht.text).toContain('a.mp4')
    expect(bericht.text).not.toContain('C:\\Videos')
    expect(bericht.text).not.toContain('/Users/x')
    expect(bericht.text).not.toContain('C:')
  })

  it('verändert das übergebene Ergebnis nicht - Feldgleichheit zu einer Kopie (DoD)', () => {
    const eingabe = ergebnisVon204({
      auftragIds: ['A1'],
      uebersprungen: ['/x/1.mp4'],
      abgelehnt: [{ pfad: '/x/2.mp4', code: 'unbekannter_fehler', meldung: 'm' }],
    })
    const kopie = {
      auftragIds: [...eingabe.auftragIds],
      uebersprungen: [...eingabe.uebersprungen],
      abgelehnt: eingabe.abgelehnt.map((a) => ({ ...a })),
      abgebrochen: eingabe.abgebrochen,
    }

    baueImportBericht(eingabe)

    expect(eingabe).toEqual(kopie)
  })

  it('liest das Ergebnis nur - weder sortiert noch neu zusammensetzt', () => {
    const bericht = baueImportBericht(
      ergebnisVon204({
        uebersprungen: ['/x/b.mp4', '/x/a.mp4'],
      }),
    )

    // Reihenfolge der Übergabe bleibt erhalten (kein Sortieren).
    const bIndex = bericht.text.indexOf('b.mp4')
    const aIndex = bericht.text.indexOf('a.mp4')
    expect(bIndex).toBeGreaterThanOrEqual(0)
    expect(aIndex).toBeGreaterThan(bIndex)
  })
})

describe('dateinameAusPfad - drei benannte Fälle (DoD)', () => {
  it('behandelt / und \\ gleich', () => {
    expect(dateinameAusPfad('/Users/x/werbung.mp4')).toBe('werbung.mp4')
    expect(dateinameAusPfad('C:\\Videos\\werbung.mp4')).toBe('werbung.mp4')
  })

  it('liefert für einen Wert ohne Trenner den Wert selbst', () => {
    expect(dateinameAusPfad('nur-ein-name.mp4')).toBe('nur-ein-name.mp4')
  })

  it('nimmt den letzten Trenner - auch bei gemischten Pfaden', () => {
    expect(dateinameAusPfad('C:\\mixed/pfad\\video.MP4')).toBe('video.MP4')
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  it('die Abschaltzeile aus Zeile 1 ist entfernt', () => {
    expect(QUELLE.startsWith('/* eslint-disable')).toBe(false)
    expect(QUELLE.startsWith('// GENERIERT aus dem Signaturblock von Issue #228.')).toBe(true)
  })

  it('die Signatur ist verbindlich und wörtlich unveraendert geblieben', () => {
    expect(QUELLE).toContain('export type MedienImportStarter = (')
    expect(QUELLE).toContain("nurTyp: 'video' | 'bild' | null,")
    expect(QUELLE).toContain('Promise<Ergebnis<ImportUebergabeErgebnis, string>>')
    expect(QUELLE).toContain('export interface ImportBericht {')
    expect(QUELLE).toContain('eingereiht: number')
    expect(QUELLE).toContain('brauchtAufmerksamkeit: boolean')
    expect(QUELLE).toContain('export function baueImportBericht(ergebnis: ImportUebergabeErgebnis): ImportBericht {')
    expect(QUELLE).toContain('export function dateinameAusPfad(pfad: string): string {')
    expect(QUELLE).toContain('): Promise<Ergebnis<ImportBericht, string>> {')
  })

  it('der werfende Geruest-Rumpf ist weg', () => {
    expect(QUELLE).not.toContain('Rumpf gehoert zu Issue #228')
  })

  it('enthaelt keins der im DoD verbotenen Konstrukte', () => {
    for (const verboten of ['rufeAuf', 'KANAELE', 'reiheEin', 'abonniere', 'window.']) {
      expect(CODETEIL).not.toContain(verboten)
    }
    // Kanalnamen nie als String-Literal.
    expect(CODETEIL).not.toMatch(/['"](?:media|queue):/)
    // Kein react-Import und kein JSX.
    expect(CODETEIL).not.toMatch(/from\s+['"]react['"]/)
    expect(CODETEIL).not.toMatch(/<[A-Za-z][A-Za-z0-9]*\s/)
  })

  it('enthaelt KEINE Dateiendungsliste (DoD)', () => {
    expect(CODETEIL).not.toMatch(/['"][^'"]*\.(mp4|jpg|jpeg|png|webp|mov|avi)['"]/)
    expect(CODETEIL).not.toContain('FORMAT_WHITELIST')
  })

  it('importiert aus medien-import-uebergabe NUR als import type (DoD)', () => {
    expect(QUELLE).toContain("import type { ImportUebergabeErgebnis } from '../app-shell/medien-import-uebergabe'")
    // Kein Wertimport: kein Import ohne das `type`-Schlüsselwort auf diese Datei.
    expect(QUELLE).not.toMatch(/^\s*import\s+\{[^}]*\}\s+from\s+['"]\.\.\/app-shell\/medien-import-uebergabe['"]/m)
  })
})

describe('Gegenproben - die Grep-Proben muessen wirklich beissen', () => {
  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    const gefaelscht = '/* eslint-disable @typescript-eslint/no-unused-vars */\n// GENERIERT'
    expect(gefaelscht.startsWith('/* eslint-disable')).toBe(true)
  })

  it('ein eingeschmuggeltes verbotenes Konstrukt wird vom Filter gefunden', () => {
    const gefaelscht = CODETEIL + '\nrufeAuf(KANAELE.queue.reiheEin, { art: "import" })'
    expect(gefaelscht).toContain('rufeAuf')
    expect(gefaelscht).toContain('KANAELE')
  })

  it('eine eingeschmuggelte Dateiendungsliste wird vom Regex gefunden', () => {
    const gefaelscht = CODETEIL + '\nconst ENDUNGEN = ["x.mp4", "y.jpg", "z.png"]'
    expect(gefaelscht).toMatch(/['"][^'"]*\.(mp4|jpg|jpeg|png|webp|mov|avi)['"]/)
  })

  it('ein eingeschmuggelter Wertimport wird vom Regex gefunden', () => {
    const gefaelscht = QUELLE + "\nimport { starteMedienImport } from '../app-shell/medien-import-uebergabe'"
    expect(gefaelscht).toMatch(/^\s*import\s+\{[^}]*\}\s+from\s+['"]\.\.\/app-shell\/medien-import-uebergabe['"]/m)
  })
})
