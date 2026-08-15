// Verhaltenstests zu #189 - die Anmeldung des `render-service` als Ausfuehrender der Auftragsart
// `render`.
//
// AUFBAU (derselbe wie in export-handler-anmeldung.spec.ts zu #190): Die Verzahnung (#68) ist ECHT,
// aber ihr `registriereRenderHandler` liegt hinter einem DURCHREICHENDEN Spion. Nur so lassen sich
// beide Aussagen in EINER Datei belegen: WAS genau angemeldet wurde (Spion) und dass ein Auftrag
// danach wirklich bei `renderReel` ankommt (echte Verzahnung + echte Registry + echtes `fuehreAus`).
//
// Die beiden Fachfunktionen (#181/#179) sind Attrappen - `renderReel` fasst sonst Platte, ffmpeg
// und den config-store an. Fuer den Identitaetsvergleich aendert das nichts: Testdatei und
// Quelldatei bekommen dieselbe Attrappe, und ein umhuellendes Lambda in der Quelldatei liesse den
// Vergleich weiterhin scheitern. Genau darum geht es.
//
// `holeAktivesProjekt` ist auf `null` festgelegt: Der Sofort-Flush in #68 ist NICHT Gegenstand
// dieses Issues, und ohne geoeffnetes Projekt gibt es nichts zu schreiben.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AusfuehrungsKontext } from '../../src/main/auftrags-manager/dispatcher'
import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { RenderProgress, RenderResult } from '../../src/shared/contracts/render-result'

const fach = vi.hoisted(() => ({ renderReel: vi.fn(), cancelRender: vi.fn() }))

vi.mock('../../src/main/render-service/render-reel', () => ({ renderReel: fach.renderReel }))
vi.mock('../../src/main/render-service/abbruch', () => ({ cancelRender: fach.cancelRender }))
vi.mock('../../src/main/project-store/aktives-projekt', () => ({ holeAktivesProjekt: () => null }))

const spion = vi.hoisted(() => ({ verzahnung: vi.fn(), ipcKanal: vi.fn() }))

vi.mock('../../src/main/auftrags-manager/render-verzahnung', async (importOriginal) => {
  const echt =
    await importOriginal<typeof import('../../src/main/auftrags-manager/render-verzahnung')>()
  // Der Spion REICHT DURCH: Die echte Verzahnung traegt wirklich beim Dispatcher ein, sonst haette
  // `fuehreAus` weiter unten nichts nachzuschlagen.
  spion.verzahnung.mockImplementation((...argumente: unknown[]) => {
    ;(echt.registriereRenderHandler as unknown as (...a: unknown[]) => void)(...argumente)
  })
  return { ...echt, registriereRenderHandler: spion.verzahnung }
})

// DoD: "Die Datei registriert nachweislich KEINEN IPC-Kanal (Spy auf registriereHandler aus #23,
// der nie aufgerufen wird)."
vi.mock('../../src/main/ipc-gateway/registriere-handler', () => ({
  registriereHandler: spion.ipcKanal,
}))

const { renderReel } = await import('../../src/main/render-service/render-reel')
const { cancelRender } = await import('../../src/main/render-service/abbruch')
const { fuehreAus, kannAbbrechen, brich } = await import(
  '../../src/main/auftrags-manager/dispatcher'
)
const { meldeRenderHandlerAn } = await import(
  '../../src/main/render-service/handler-anmeldung'
)
const { RENDER_PROFILE } = await import('../../src/shared/contracts/render-profile')

// Der blosse Import darf nichts angemeldet haben - die Anmeldung ist kein Nebeneffekt des Ladens,
// sondern ein Aufruf aus #3 (Invariante des Issues).
const aufrufeVorAufruf = spion.verzahnung.mock.calls.length

meldeRenderHandlerAn()

// Festgehalten, BEVOR irgendein beforeEach die Aufzeichnung leert: Diese Kopie beschreibt den EINEN
// Aufruf oben.
//
// FUER DEN IPC-SPION IST DAS NICHT KOSMETIK, SONDERN TRAGEND (Befund aus #190): Die Anmeldung
// laeuft EINMAL beim Laden des Moduls, also VOR jedem `beforeEach`. Wuerde die Behauptung "kein
// IPC-Kanal" erst in einem `it` gegen den LEBENDEN Spion gestellt, haette `beforeEach` seine
// Aufzeichnung laengst geleert - der Test waere blind und bliebe auch dann gruen, wenn die
// Quelldatei einen Kanal anmeldete. Deshalb steht hier ein Zaehlwert, kein Spion.
const aufrufe = spion.verzahnung.mock.calls.map((argumente) => [...argumente])
const ipcAufrufe = spion.ipcKanal.mock.calls.length

function baueRenderAuftrag(renderId = 'r1'): Extract<Auftrag, { art: 'render' }> {
  return {
    auftragId: 'a9',
    art: 'render',
    status: 'laeuft',
    label: 'Render',
    payload: {
      renderId,
      projektId: 'p1',
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: 'sommer',
    },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-15T10:00:00.000Z',
  }
}

function baueKontext(gemeldet: Array<number | null>): AusfuehrungsKontext {
  return {
    auftragId: 'a9',
    meldeFortschritt: (prozent) => {
      gemeldet.push(prozent)
    },
  }
}

beforeEach(() => {
  fach.renderReel.mockReset()
  fach.cancelRender.mockReset()
})

describe('meldeRenderHandlerAn (#189) - was angemeldet wird', () => {
  it('registriert beim blossen Import nichts', () => {
    expect(aufrufeVorAufruf).toBe(0)
  })

  it('ruft registriereRenderHandler genau einmal auf', () => {
    expect(aufrufe).toHaveLength(1)
  })

  it('uebergibt renderReel SELBST als erstes Argument, kein Lambda (Referenzgleichheit)', () => {
    expect(aufrufe[0]?.[0]).toBe(renderReel)
  })

  it('uebergibt cancelRender SELBST als zweites Argument, kein Lambda (Referenzgleichheit)', () => {
    expect(aufrufe[0]?.[1]).toBe(cancelRender)
  })

  it('uebergibt genau zwei Argumente', () => {
    expect(aufrufe[0]).toHaveLength(2)
  })

  it('meldet keinen IPC-Kanal an (#23 bleibt unberuehrt)', () => {
    expect(ipcAufrufe).toBe(0)
  })

  it('liefert void und wirft nicht', () => {
    // Zweiter Aufruf: Er darf nicht werfen. Was eine doppelte Registrierung bewirkt, legt #60 fest
    // ("ersetzt die vorherige vollstaendig"); diese Datei sichert nichts dagegen ab.
    expect(meldeRenderHandlerAn()).toBeUndefined()
  })
})

describe('meldeRenderHandlerAn (#189) - die Naht zum Dispatcher', () => {
  it('bringt einen Render-Auftrag bis in renderReel - mit der eingefrorenen Nutzlast', async () => {
    const auftrag = baueRenderAuftrag()
    const erfolg: RenderResult = {
      status: 'erfolg',
      renderId: 'r1',
      ausgabePfad: 'C:\\p1\\output\\sommer.mp4',
      ausgabeName: 'sommer',
      gesamtdauer: 42,
      dateigroesse: 4711,
    }
    fach.renderReel.mockResolvedValue(erfolg)

    const ergebnis = await fuehreAus(auftrag, baueKontext([]))

    expect(fach.renderReel).toHaveBeenCalledTimes(1)
    // Die Nutzlast geht UNVERAENDERT hinein - dasselbe Objekt (TK 9.3.5, eingefrorener Eingang).
    expect(fach.renderReel.mock.calls[0]?.[0]).toBe(auftrag.payload)
    expect(ergebnis).toEqual({
      status: 'erfolg',
      ergebnis: {
        pfad: 'C:\\p1\\output\\sommer.mp4',
        ausgabeName: 'sommer',
        dateigroesse: 4711,
        gesamtdauer: 42,
      },
    })
  })

  it('reicht den fachlichen Fehlercode unveraendert zurueck (Reparatur-Modus haengt daran)', async () => {
    const fehlschlag: RenderResult = {
      status: 'fehler',
      renderId: 'r1',
      fehlercode: 'medium_fehlt',
      fehlerhaftesElementId: 'e5',
      meldung: 'Medium fehlt',
    }
    fach.renderReel.mockResolvedValue(fehlschlag)

    const ergebnis = await fuehreAus(baueRenderAuftrag(), baueKontext([]))

    expect(ergebnis).toEqual({
      status: 'fehlgeschlagen',
      fehler: { code: 'medium_fehlt', meldung: 'Medium fehlt', daten: { elementId: 'e5' } },
    })
  })

  it('traegt den Fortschritt bis an den Kontext - der zweite Parameter kommt an', async () => {
    const gemeldet: Array<number | null> = []
    fach.renderReel.mockImplementation(
      async (_request: unknown, aufFortschritt: (f: RenderProgress) => void) => {
        aufFortschritt({
          renderId: 'r1',
          phase: 'normalisieren',
          elementIndex: 0,
          elementAnzahl: 2,
          elementId: 'e1',
          prozent: 25,
        })
        return { status: 'abgebrochen', renderId: 'r1', abgebrochenBei: 25 } satisfies RenderResult
      },
    )

    const ergebnis = await fuehreAus(baueRenderAuftrag(), baueKontext(gemeldet))

    expect(gemeldet).toEqual([25])
    expect(ergebnis).toEqual({ status: 'abgebrochen' })
  })

  it('macht render abbrechbar und leitet die renderId aus der Nutzlast an cancelRender', () => {
    expect(kannAbbrechen('render')).toBe(true)

    expect(brich(baueRenderAuftrag('r7'))).toBe(true)

    expect(fach.cancelRender.mock.calls).toEqual([['r7']])
  })
})

describe('meldeRenderHandlerAn (#189) - keine Uebersetzungsschicht', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/render-service/handler-anmeldung.ts',
    ),
    'utf8',
  )

  // Die Grep-Proben gelten dem CODE, nicht der Begruendung daneben: Die Kommentare dieser Datei
  // benennen die verbotenen Konstrukte ausdruecklich.
  const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

  it.each(['try', 'catch', 'async', 'await', '=>'])('enthaelt kein %s', (wort) => {
    expect(code).not.toContain(wort)
  })

  it('geht NICHT direkt an den Dispatcher (#60) und meldet keine zweite Auftragsart an', () => {
    for (const fremd of [
      'registriereAuftragsHandler',
      "'export'",
      "'import'",
      "'loeschen'",
      "'render'",
    ]) {
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
    expect(code).not.toMatch(/^meldeRenderHandlerAn\(\)/m)
  })
})
