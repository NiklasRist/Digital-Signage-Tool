import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'

// Verhaltenstest zu markiereFehlende (#89).
//
// ECHTE Dateien in einem Temp-Ordner: Die Funktion lebt davon, ob dort eine regulaere Datei
// liegt - ein durchgehend gemocktes `fs` prueft nur noch die eigene Attrappe. Gemockt sind
// dagegen die beiden Nachbarn: `pfade` (#49) als Attrappe, weil die echte Fassung ueber
// `datenort` an Electron haengt, und `assets` (#74) als Spion, weil "wie oft und mit welchen
// Argumenten geschrieben wurde" die eigentliche Aussage jedes Falls ist.
//
// `node:fs/promises` bleibt ECHT und wird nur durchgereicht - bis auf einen Sonderfall: Fuer
// EACCES gibt es keinen plattformunabhaengigen Weg, ein echtes Rechteproblem herzustellen
// (unter Windows greift chmod nicht). Deshalb kann der Test fuer EINEN Pfad einen Fehler
// hinterlegen; alle anderen Pfade beantwortet das echte Dateisystem.
const zustand = vi.hoisted(() => ({
  medienOrdner: '',
  /** Dateinamen, fuer die loeseAssetPfad `ok: false` liefern soll. */
  pfadAbweisungen: new Set<string>(),
  /** Aufrufe von setzeAssetZustand, in Reihenfolge. */
  aufrufe: [] as Array<{ projektId: string; assetId: string; zustand: 'ok' | 'fehlt' }>,
  /** Antwort auf den n-ten Aufruf von setzeAssetZustand (Standard: Erfolg). */
  antworten: [] as Array<{ ok: false; fehler: { code: string; meldung: string } } | null>,
  /** Pfad -> Fehler, den `fs.stat` stattdessen werfen soll. */
  statFehler: new Map<string, NodeJS.ErrnoException>(),
  /** Jeder Pfad, den `fs.stat` zu sehen bekam - der Zeuge fuer "kein Dateisystemzugriff". */
  statAufrufe: [] as string[],
}))

vi.mock('../../src/main/project-store/pfade', () => ({
  loeseAssetPfad: (projektId: string, dateiname: string) => {
    if (zustand.pfadAbweisungen.has(dateiname)) {
      return {
        ok: false,
        fehler: {
          code: 'ungueltige_eingabe',
          meldung: 'Der Dateiname ist kein reiner Dateiname ohne Verzeichnisanteil.',
        },
      }
    }
    return { ok: true, wert: path.join(zustand.medienOrdner, dateiname) }
  },
}))

vi.mock('../../src/main/project-store/assets', () => ({
  setzeAssetZustand: async (projektId: string, assetId: string, wert: 'ok' | 'fehlt') => {
    zustand.aufrufe.push({ projektId, assetId, zustand: wert })
    const antwort = zustand.antworten[zustand.aufrufe.length - 1]
    return antwort ?? { ok: true, wert: undefined }
  },
}))

vi.mock('node:fs/promises', async (originalImportieren) => {
  const echt = await originalImportieren<typeof import('node:fs/promises')>()
  // Nur die einfache Form (ein Pfad, keine Optionen) - genau so ruft die gepruefte Datei auf.
  // Die volle Ueberladung von `stat` nachzubilden, brauchte eine Typbehauptung und wuerde einen
  // zusaetzlichen Aufruf mit Optionen ohnehin nicht besser abbilden.
  const stat = async (ziel: Parameters<typeof echt.stat>[0]) => {
    zustand.statAufrufe.push(String(ziel))
    const hinterlegt = typeof ziel === 'string' ? zustand.statFehler.get(ziel) : undefined
    if (hinterlegt !== undefined) {
      throw hinterlegt
    }
    return echt.stat(ziel)
  }
  return { ...echt, stat, default: { ...echt, stat } }
})

const { markiereFehlende } = await import('../../src/main/media-service/reconcile-fehlt')

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'

function asset(id: string, wert: Asset['zustand'] = 'ok', dateiname = `${id}.mp4`): Asset {
  return {
    id,
    typ: 'video',
    dateiname,
    originalname: 'Werbung Sommer.MP4',
    maße: { breite: 1920, höhe: 1080 },
    dauer: 12.5,
    importdatum: '2026-08-13T09:00:00.000Z',
    zustand: wert,
  }
}

async function legeAn(dateiname: string): Promise<string> {
  const ziel = path.join(zustand.medienOrdner, dateiname)
  await fsp.writeFile(ziel, 'x')
  return ziel
}

function fehlerMit(code: string): NodeJS.ErrnoException {
  const ursache: NodeJS.ErrnoException = new Error(`vorgetaeuschter ${code}`)
  ursache.code = code
  return ursache
}

beforeEach(async () => {
  zustand.medienOrdner = await fsp.mkdtemp(path.join(os.tmpdir(), 'reconcile-fehlt-'))
  zustand.pfadAbweisungen = new Set()
  zustand.aufrufe = []
  zustand.antworten = []
  zustand.statFehler = new Map()
  zustand.statAufrufe = []
})

afterEach(async () => {
  await fsp.rm(zustand.medienOrdner, { recursive: true, force: true })
})

describe('markiereFehlende (#89) - Befund je Asset', () => {
  it('setzt ein Asset ohne Datei auf fehlt und zaehlt es', async () => {
    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins')])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 1 } })
    expect(zustand.aufrufe).toEqual([
      { projektId: PROJEKT, assetId: 'a-eins', zustand: 'fehlt' },
    ])
  })

  it('setzt einen Rueckkehrer auf ok, ohne ihn zu zaehlen', async () => {
    // Ohne diese Rueckrichtung bliebe ein einmal markiertes Medium fuer immer rot; gezaehlt
    // wird es trotzdem nicht, weil `markiert` die Frage "ist seit dem letzten Mal etwas
    // kaputtgegangen?" beantwortet.
    await legeAn('a-eins.mp4')

    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins', 'fehlt')])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 0 } })
    expect(zustand.aufrufe).toEqual([{ projektId: PROJEKT, assetId: 'a-eins', zustand: 'ok' }])
  })

  it('fasst nichts an, wenn der gespeicherte Zustand schon stimmt', async () => {
    await legeAn('a-eins.mp4')

    const ergebnis = await markiereFehlende(PROJEKT, [
      asset('a-eins', 'ok'),
      asset('a-zwei', 'fehlt'),
    ])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 0 } })
    expect(zustand.aufrufe).toEqual([])
  })

  it('behandelt ein Verzeichnis am Ort der Datei wie eine fehlende Datei', async () => {
    await fsp.mkdir(path.join(zustand.medienOrdner, 'a-eins.mp4'))

    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins')])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 1 } })
    expect(zustand.aufrufe).toEqual([
      { projektId: PROJEKT, assetId: 'a-eins', zustand: 'fehlt' },
    ])
  })

  it('markiert mehrere betroffene Assets und laesst die intakten in Ruhe', async () => {
    await legeAn('a-zwei.mp4')

    const ergebnis = await markiereFehlende(PROJEKT, [
      asset('a-eins'),
      asset('a-zwei'),
      asset('a-drei'),
    ])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 2 } })
    expect(zustand.aufrufe.map((a) => a.assetId)).toEqual(['a-eins', 'a-drei'])
  })

  it('liefert markiert 0 bei leerer Asset-Liste, ohne einen Schreibaufruf', async () => {
    const ergebnis = await markiereFehlende(PROJEKT, [])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 0 } })
    expect(zustand.aufrufe).toEqual([])
  })
})

describe('markiereFehlende (#89) - Befunde, die den Lauf nicht abbrechen', () => {
  it('setzt ein Asset mit unbrauchbarem Dateinamen auf fehlt und prueft weiter', async () => {
    zustand.pfadAbweisungen.add('../ausbruch.mp4')
    await legeAn('a-drei.mp4')

    const ergebnis = await markiereFehlende(PROJEKT, [
      asset('a-eins', 'ok', '../ausbruch.mp4'),
      asset('a-zwei'),
      asset('a-drei', 'fehlt'),
    ])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 2 } })
    expect(zustand.aufrufe).toEqual([
      { projektId: PROJEKT, assetId: 'a-eins', zustand: 'fehlt' },
      { projektId: PROJEKT, assetId: 'a-zwei', zustand: 'fehlt' },
      { projektId: PROJEKT, assetId: 'a-drei', zustand: 'ok' },
    ])
  })

  it('laesst den Zustand bei EACCES unveraendert und prueft die uebrigen weiter', async () => {
    // "Ich darf nicht hinsehen" ist nicht dasselbe wie "ist nicht da" - und weil der Zustand
    // persistiert wird, bliebe ein Fehlbefund auch nach dem Entsperren stehen.
    zustand.statFehler.set(path.join(zustand.medienOrdner, 'a-eins.mp4'), fehlerMit('EACCES'))

    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins'), asset('a-zwei')])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 1 } })
    expect(zustand.aufrufe).toEqual([
      { projektId: PROJEKT, assetId: 'a-zwei', zustand: 'fehlt' },
    ])
  })

  it('laesst auch ein bereits als fehlt gefuehrtes Asset bei EIO unberuehrt', async () => {
    zustand.statFehler.set(path.join(zustand.medienOrdner, 'a-eins.mp4'), fehlerMit('EIO'))

    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins', 'fehlt')])

    expect(ergebnis).toEqual({ ok: true, wert: { markiert: 0 } })
    expect(zustand.aufrufe).toEqual([])
  })
})

describe('markiereFehlende (#89) - Abbruch und Eingangspruefung', () => {
  it('bricht beim zweiten von drei Assets ab und reicht speicher_fehler unveraendert weiter', async () => {
    zustand.antworten = [
      null,
      { ok: false, fehler: { code: 'speicher_fehler', meldung: 'Platte voll' } },
    ]

    const ergebnis = await markiereFehlende(PROJEKT, [
      asset('a-eins'),
      asset('a-zwei'),
      asset('a-drei'),
    ])

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('speicher_fehler')
    // Fuer das dritte Asset darf KEIN Aufruf mehr abgesetzt worden sein.
    expect(zustand.aufrufe.map((a) => a.assetId)).toEqual(['a-eins', 'a-zwei'])
  })

  it.each([
    ['', 'leer'],
    ['../x', 'Aufstieg'],
    ['a/b', 'Schraegstrich'],
    ['a\\b', 'Rueckwaerts-Schraegstrich'],
  ])('weist die Projekt-ID %s (%s) ab, ohne irgendetwas anzufassen', async (id) => {
    const ergebnis = await markiereFehlende(id, [asset('a-eins')])

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.aufrufe).toEqual([])
    expect(zustand.statAufrufe).toEqual([])
  })

  it('meldet unbekannter_fehler statt zu werfen, wenn ein Eintrag kaputt ist', async () => {
    const kaputt = [null] as unknown as Asset[]

    const ergebnis = await markiereFehlende(PROJEKT, kaputt)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
  })

  // Dieser Test hielt bis zum 13.08.2026 einen VERLUST fest: `kein_projekt` passte nicht in
  // `ReconcileFehlercode` und fiel auf `unbekannter_fehler`. Behoben in #79 - die Union traegt
  // den Code jetzt. Umgedreht statt geloescht, weil er die Zusage bewacht, auf die der
  // Reparatur-Modus (FA-19) angewiesen ist: Der Aufrufer muss auf dem CODE verzweigen koennen,
  // nicht auf dem Meldungstext.
  it('reicht kein_projekt unveraendert durch', async () => {
    zustand.antworten = [
      { ok: false, fehler: { code: 'kein_projekt', meldung: 'Es ist kein Projekt geoeffnet.' } },
    ]

    const ergebnis = await markiereFehlende(PROJEKT, [asset('a-eins')])

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('kein_projekt')
    expect(ergebnis.fehler.meldung).toBe('Es ist kein Projekt geoeffnet.')
  })
})
