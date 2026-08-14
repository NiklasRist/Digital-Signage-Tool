// Verhaltenstests zu #190 - die Anmeldung der Auftragsart `export` beim Dispatcher.
//
// AUFBAU (derselbe wie in handler-registrierung.spec.ts zu #92): Der Dispatcher (#60) ist ECHT,
// aber sein `registriereAuftragsHandler` liegt hinter einem DURCHREICHENDEN Spion. Nur so lassen
// sich beide Aussagen in EINER Datei belegen: was genau angemeldet wurde (Spion) und dass ein
// Auftrag danach wirklich bei `exportiereAusgabe` ankommt (echte Registry + echtes `fuehreAus`).
//
// Die Fachfunktion (#188) ist eine Attrappe - sie wuerde sonst Platte, D1-Lock und config-store
// anfassen. Fuer den Identitaetsvergleich aendert das nichts: Testdatei und Quelldatei bekommen
// dieselbe Attrappe, und ein umhuellendes Lambda in der Quelldatei liesse den Vergleich weiterhin
// scheitern. Genau darum geht es.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AusfuehrungsKontext,
  HandlerErgebnis,
  HandlerFuer,
} from '../../src/main/auftrags-manager/dispatcher'
import type { Auftrag } from '../../src/shared/contracts/auftrag'

const fach = vi.hoisted(() => ({ exportiereAusgabe: vi.fn() }))

vi.mock('../../src/main/export-service/export', () => ({
  exportiereAusgabe: fach.exportiereAusgabe,
}))

const spion = vi.hoisted(() => ({ registriere: vi.fn(), ipcKanal: vi.fn() }))

vi.mock('../../src/main/auftrags-manager/dispatcher', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/main/auftrags-manager/dispatcher')>()
  // Der Spion REICHT DURCH: Die echte Registry wird wirklich gefuellt, sonst haette `fuehreAus`
  // weiter unten nichts nachzuschlagen.
  spion.registriere.mockImplementation((...argumente: unknown[]) => {
    ;(echt.registriereAuftragsHandler as unknown as (...a: unknown[]) => void)(...argumente)
  })
  return { ...echt, registriereAuftragsHandler: spion.registriere }
})

// DoD: "Die Datei registriert nachweislich KEINEN IPC-Kanal (Spy auf registriereHandler aus #23,
// der nie aufgerufen wird)."
vi.mock('../../src/main/ipc-gateway/registriere-handler', () => ({
  registriereHandler: spion.ipcKanal,
}))

const { exportiereAusgabe } = await import('../../src/main/export-service/export')
const { fuehreAus, kannAbbrechen } = await import('../../src/main/auftrags-manager/dispatcher')
const { meldeExportHandlerAn } = await import('../../src/main/export-service/handler-anmeldung')

// Der blosse Import darf nichts angemeldet haben - die Anmeldung ist kein Nebeneffekt des Ladens,
// sondern ein Aufruf aus #3 (Invariante des Issues).
const aufrufeVorAufruf = spion.registriere.mock.calls.length

meldeExportHandlerAn()

// Festgehalten, bevor irgendein beforeEach die Aufzeichnung leert: Diese Kopie beschreibt den
// EINEN Aufruf oben.
//
// FUER DEN IPC-SPION IST DAS NICHT KOSMETIK, SONDERN TRAGEND: Die Anmeldung laeuft EINMAL beim
// Laden des Moduls. Wuerde die Behauptung "kein IPC-Kanal" erst in einem `it` gegen den lebenden
// Spion gestellt, haette `beforeEach` seine Aufzeichnung laengst geleert - der Test waere blind
// und bliebe auch dann gruen, wenn die Quelldatei einen Kanal anmeldete. Nachgemessen: Eine
// Fassung mit `registriereHandler(...)` im Rumpf liess die lebende Variante durchgehen.
const aufrufe = spion.registriere.mock.calls.map((argumente) => [...argumente])
const ipcAufrufe = spion.ipcKanal.mock.calls.length

function baueExportAuftrag(): Extract<Auftrag, { art: 'export' }> {
  return {
    auftragId: 'a7',
    art: 'export',
    status: 'laeuft',
    label: 'Export',
    payload: { projektId: 'p1', dateiname: 'sommer.mp4', zielPfad: 'E:\\' },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-14T10:00:00.000Z',
  }
}

function baueKontext(auftragId: string): AusfuehrungsKontext {
  return { auftragId, meldeFortschritt: () => {} }
}

beforeEach(() => {
  fach.exportiereAusgabe.mockReset()
})

describe('meldeExportHandlerAn (#190) - was angemeldet wird', () => {
  it('registriert beim blossen Import nichts', () => {
    expect(aufrufeVorAufruf).toBe(0)
  })

  it('ruft registriereAuftragsHandler genau einmal auf', () => {
    expect(aufrufe).toHaveLength(1)
  })

  it("meldet als erstes Argument die Art 'export' an - und keine zweite Art", () => {
    expect(aufrufe.map((argumente) => argumente[0])).toEqual(['export'])
  })

  it('uebergibt die Funktion exportiereAusgabe SELBST, kein Lambda (Referenzgleichheit)', () => {
    expect(aufrufe[0]?.[1]).toBe(exportiereAusgabe)
  })

  it('uebergibt keinen dritten Parameter - export bleibt unabbrechbar (FA-18)', () => {
    expect(aufrufe[0]).toHaveLength(2)
    expect(aufrufe[0]?.[2]).toBeUndefined()
    expect(kannAbbrechen('export')).toBe(false)
  })

  it('meldet keinen IPC-Kanal an (#23 bleibt unberuehrt)', () => {
    expect(ipcAufrufe).toBe(0)
  })

  it('liefert void und wirft nicht', () => {
    // Zweiter Aufruf: Er darf nicht werfen. Was eine doppelte Registrierung bewirkt, legt #60
    // fest ("ersetzt die vorherige vollstaendig"); diese Datei sichert nichts dagegen ab.
    expect(meldeExportHandlerAn()).toBeUndefined()
  })
})

describe('meldeExportHandlerAn (#190) - die Naht zum Dispatcher', () => {
  it('bringt einen Export-Auftrag samt Kontext bis in exportiereAusgabe', async () => {
    const auftrag = baueExportAuftrag()
    const kontext = baueKontext('a7')
    const antwort: HandlerErgebnis<string> = {
      status: 'erfolg',
      ergebnis: { zielPfad: 'E:\\sommer.mp4', dateigroesse: 1234 },
    }
    fach.exportiereAusgabe.mockResolvedValue(antwort)

    const ergebnis = await fuehreAus(auftrag, kontext)

    expect(fach.exportiereAusgabe).toHaveBeenCalledTimes(1)
    // Der Auftrag geht UNVERAENDERT hinein - dasselbe Objekt, nichts ergaenzt.
    expect(fach.exportiereAusgabe.mock.calls[0]?.[0]).toBe(auftrag)
    expect(fach.exportiereAusgabe.mock.calls[0]?.[1].auftragId).toBe('a7')
    // ... und das Ergebnis unveraendert heraus: kein Neuaufbau, dasselbe Objekt.
    expect(ergebnis).toBe(antwort)
  })

  it('reicht den fachlichen Fehlercode unveraendert zurueck (FAT32-Hinweis haengt daran)', async () => {
    const fehlschlag: HandlerErgebnis<string> = {
      status: 'fehlgeschlagen',
      fehler: { code: 'datei_zu_gross_fat32', meldung: 'Datei > 4 GiB auf FAT32' },
    }
    fach.exportiereAusgabe.mockResolvedValue(fehlschlag)

    const ergebnis = await fuehreAus(baueExportAuftrag(), baueKontext('a7'))

    expect(ergebnis).toBe(fehlschlag)
  })
})

describe('meldeExportHandlerAn (#190) - keine Uebersetzungsschicht', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/export-service/handler-anmeldung.ts',
    ),
    'utf8',
  )

  // Die Grep-Proben gelten dem CODE, nicht der Begruendung daneben: Die Kommentare dieser Datei
  // benennen die verbotenen Konstrukte ausdruecklich.
  const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

  it.each(['try', 'catch', 'async', 'await', '=>'])('enthaelt kein %s', (wort) => {
    expect(code).not.toContain(wort)
  })

  it('registriert weder render noch import noch loeschen', () => {
    for (const fremd of ["'render'", "'import'", "'loeschen'"]) {
      expect(code).not.toContain(fremd)
    }
  })

  it('fasst weder Dateisystem noch IPC noch D1 an', () => {
    for (const verboten of [
      'node:fs',
      'child_process',
      'kanaele',
      'registriereHandler',
      'mitD1Lock',
      'sofortFlush',
      'holeAktivesProjekt',
    ]) {
      expect(code).not.toContain(verboten)
    }
  })

  it('verdrahtet sich nicht selbst - kein Aufruf als Nebeneffekt des Ladens', () => {
    expect(code).not.toContain('whenReady')
    // Ein Selbstaufruf am Modulende stuende ganz links, ohne Einrueckung.
    expect(code).not.toMatch(/^meldeExportHandlerAn\(\)/m)
  })
})

// TYP-TEST (DoD): Die Fachfunktion passt OHNE Umbau auf HandlerFuer<'export'> - der Beleg, dass
// kein Adapter noetig ist. Die Aussage liegt allein auf Typebene und wird von
// `npm run typecheck:tests` geprueft; vi.mock aendert die Typen nicht.
const _handlerExport: HandlerFuer<'export'> = exportiereAusgabe
void _handlerExport
