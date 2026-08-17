// Verhaltenstests zu #196 - der Start-Ablauf der app-shell
// (src/renderer/app-shell/start.ts, TK 9.5.6 / 9.14.2 / 9.14.3).
//
// Die Datei ist reiner Renderer-Zustand mit `rufeAuf` als einziger IPC-Quelle.
// `rufeAuf` (#24) wird ersetzt, weil es an `window.api` haengt - die Bruecke gibt es
// im Testlauf nicht. Der Ersatz ist zugleich der Beweis: Wuerde die Datei den Main auf
// einem anderen Weg anfassen, faende der Spion nichts und die Zaehl-Tests fielen um.
//
// Die Reiter-Seite (#194) laeuft ECHT ueber demselben Modul; `setzeReiterZustandZurueck`
// setzt ihren Zustand zwischen den Tests zurueck. Die DoD verlangt fuer einzelne Punkte
// einen Spion auf `wechsleReiter` - deshalb importiert diese Datei den Reiter-Namensraum.
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppKonfig } from '../../src/shared/contracts/app-konfig'
import { KANAELE } from '../../src/shared/contracts/kanaele'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import * as reiterModul from '../../src/renderer/app-shell/reiter'
import {
  UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT,
  UI_SCHLUESSEL_REITER,
  leseQueueAufgeklappt,
  merkeAktivenReiter,
  merkeQueueAufgeklappt,
  starteSitzung,
} from '../../src/renderer/app-shell/start'

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: attrappen.rufeAuf,
}))

function konfig(ueberschreibungen: Partial<AppKonfig> = {}): AppKonfig {
  return {
    aktivesProjektId: null,
    letztesExportZiel: null,
    uiVoreinstellungen: {},
    ...ueberschreibungen,
  }
}

function element(id: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref: `aktion-${id}`,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

function projekt(id = 'projekt-1'): Project {
  return {
    id,
    name: `Projekt ${id}`,
    erstelltAm: '2026-08-13T10:00:00.000Z',
    geaendertAm: '2026-08-13T10:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  }
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset()
  // Sicherheitsnetz: Jeder Aufruf, fuer den der Test keine Antwort vorgesehen hat,
  // laesst den Test laut scheitern - ein stilles undefined haette nichts belegt.
  attrappen.rufeAuf.mockImplementation(() => {
    throw new Error('unvorhergesehener IPC-Aufruf in diesem Test')
  })
  reiterModul.setzeReiterZustandZurueck()
  // Die internen Vermerke der Merk-Funktionen sind gewolltes Verhalten; der Testlauf
  // bleibt leise, die eigentliche Zusage (kein Wurf, kein unbehandeltes Promise) prueft
  // der ablehnende Doppel-Test selbst.
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('starteSitzung (DoD)', () => {
  it('liefert bei aktivesProjektId null kein-projekt und ruft wechsleReiter mit projekte, ohne project:öffneProjekt', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ aktivesProjektId: null }),
    })
    const spion = vi.spyOn(reiterModul, 'wechsleReiter')

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: { art: 'kein_aktives_projekt' },
    })
    expect(spion).toHaveBeenCalledTimes(1)
    expect(spion).toHaveBeenCalledWith('projekte')
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.config.leseKonfig)
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(
      KANAELE.project.öffneProjekt,
      expect.anything(),
    )
  })

  it('ruft bei unlesbarer Konfiguration nicht project:öffneProjekt und reicht den Code des Main unveraendert durch', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'config.json und die Sicherung sind beschaedigt.' },
    })

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'konfig_unlesbar',
        code: 'speicher_fehler',
        meldung: 'config.json und die Sicherung sind beschaedigt.',
      },
    })
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(
      KANAELE.project.öffneProjekt,
      expect.anything(),
    )
  })

  it('landet nach erfolgreichem Oeffnen ohne gemerkten Reiter in zusammenstellen', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ aktivesProjektId: 'projekt-1' }),
    })
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt('projekt-1') })

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'projekt-geladen',
      projekt: projekt('projekt-1'),
      reiter: 'zusammenstellen',
    })
  })

  it('landet nach erfolgreichem Oeffnen bei gemerktem vorlagen in vorlagen', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({
        aktivesProjektId: 'projekt-1',
        uiVoreinstellungen: { [UI_SCHLUESSEL_REITER]: 'vorlagen' },
      }),
    })
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt('projekt-1') })

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'projekt-geladen',
      projekt: projekt('projekt-1'),
      reiter: 'vorlagen',
    })
  })

  it('uebergeht ein gemerktes projekte und landet in zusammenstellen', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({
        aktivesProjektId: 'projekt-1',
        uiVoreinstellungen: { [UI_SCHLUESSEL_REITER]: 'projekte' },
      }),
    })
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt('projekt-1') })

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'projekt-geladen',
      projekt: projekt('projekt-1'),
      reiter: 'zusammenstellen',
    })
  })

  it.each([[42], ['Projekte'], [null]])(
    'verwirft einen ungueltigen gemerkten Reiter %j und landet in zusammenstellen, ohne Hinweis',
    async (wert) => {
      attrappen.rufeAuf.mockResolvedValueOnce({
        ok: true,
        wert: konfig({
          aktivesProjektId: 'projekt-1',
          uiVoreinstellungen: { [UI_SCHLUESSEL_REITER]: wert },
        }),
      })
      attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt('projekt-1') })

      const ergebnis = await starteSitzung()

      // projekt-geladen traegt strukturell keinen Hinweis - das IST die Zusage.
      expect(ergebnis).toEqual({
        art: 'projekt-geladen',
        projekt: projekt('projekt-1'),
        reiter: 'zusammenstellen',
      })
    },
  )

  it('faellt bei nicht_gefunden sanft zurueck und ruft config:setzeAktivesProjekt NICHT', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ aktivesProjektId: 'projekt-1' }),
    })
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Der Projektordner fehlt.' },
    })

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'projekt_unlesbar',
        projektId: 'projekt-1',
        code: 'nicht_gefunden',
        meldung: 'Der Projektordner fehlt.',
      },
    })
    expect(attrappen.rufeAuf).not.toHaveBeenCalledWith(
      KANAELE.config.setzeAktivesProjekt,
      expect.anything(),
    )
  })

  it('wirft auch bei werfendem rufeAuf beim Lesen der Konfiguration nicht', async () => {
    attrappen.rufeAuf.mockRejectedValueOnce(new Error('IPC-Bruecke nicht verfuegbar'))

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'konfig_unlesbar',
        code: 'unbekannter_fehler',
        meldung: 'IPC-Bruecke nicht verfuegbar',
      },
    })
  })

  it('faengt auch einen Wurf beim Oeffnen des Projekts als projekt_unlesbar', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ aktivesProjektId: 'projekt-1' }),
    })
    attrappen.rufeAuf.mockRejectedValueOnce(new Error('Main weg'))

    const ergebnis = await starteSitzung()

    expect(ergebnis).toEqual({
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'projekt_unlesbar',
        projektId: 'projekt-1',
        code: 'unbekannter_fehler',
        meldung: 'Main weg',
      },
    })
  })
})

describe('merkeAktivenReiter (DoD)', () => {
  it('schreibt bei einem Reiterwechsel genau einen Aufruf und die Abmelde-Funktion beendet das', async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined })
    const abmelden = merkeAktivenReiter()

    reiterModul.wechsleReiter('aktionen')

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.config.setzeUIVoreinstellung, {
      schlüssel: UI_SCHLUESSEL_REITER,
      wert: 'aktionen',
    })

    abmelden()
    reiterModul.wechsleReiter('vorlagen')
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
  })

  it('fuehrt ein ablehnendes setzeUIVoreinstellung zu keinem Wurf und zu keinem unbehandelten Promise', async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error('Main weg'))
    const abmelden = merkeAktivenReiter()

    expect(() => reiterModul.wechsleReiter('aktionen')).not.toThrow()

    // Die catch-Kette muss das Ablehnen schlucken; wenn sie fehlte, meldete Vitest
    // eine unbehandelte Ablehnung und dieser Test faellt rot.
    await vi.waitFor(() => {
      expect(console.warn).toHaveBeenCalled()
    })
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
    abmelden()
  })
})

describe('leseQueueAufgeklappt (DoD)', () => {
  it('liefert true nur bei exakt true', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ uiVoreinstellungen: { [UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT]: true } }),
    })

    await expect(leseQueueAufgeklappt()).resolves.toBe(true)
  })

  it.each([
    ['fehlenden Wert', undefined],
    ['Zeichenkette true', 'true'],
    ['Zahl 1', 1],
    ['null', null],
  ])('liefert bei %s false', async (_fall, wert) => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: konfig({ uiVoreinstellungen: { [UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT]: wert } }),
    })

    await expect(leseQueueAufgeklappt()).resolves.toBe(false)
  })

  it('liefert bei leseKonfig mit ok:false false, ohne Hinweis und ohne Wurf', async () => {
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'config.json beschaedigt.' },
    })

    await expect(leseQueueAufgeklappt()).resolves.toBe(false)
  })

  it('liefert bei werfendem leseKonfig false und wirft nicht', async () => {
    attrappen.rufeAuf.mockRejectedValueOnce(new Error('Bridge fehlt'))

    await expect(leseQueueAufgeklappt()).resolves.toBe(false)
  })
})

describe('merkeQueueAufgeklappt (DoD)', () => {
  it('schreibt bei false genau einen Aufruf mit wert false - weder weggelassen noch zu undefined gemacht', async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined })

    merkeQueueAufgeklappt(false)

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1)
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.config.setzeUIVoreinstellung, {
      schlüssel: UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT,
      wert: false,
    })
    await Promise.resolve()
  })
})

describe('Konstanten (DoD)', () => {
  it('exportiert die beiden UI-Schluessel mit den verbindlichen Werten', () => {
    expect(UI_SCHLUESSEL_REITER).toBe('app-shell.aktiverReiter')
    expect(UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT).toBe('queue-panel.aufgeklappt')
  })
})

describe('Bauvorschriften der Datei (DoD-Grep-Proben)', () => {
  const QUELLE = readFileSync(
    new URL('../../src/renderer/app-shell/start.ts', import.meta.url),
    'utf8',
  )

  // Nur der Code, ohne Kommentarzeilen - die Grep-Proben der DoD pruefen den Rumpf.
  const CODEZEILEN = QUELLE.split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('enthaelt kein JSX und keinen react-Import', () => {
    expect(QUELLE).not.toMatch(/\bJSX\b/)
    // JSX: weder ein schliessendes noch ein selbstschliessendes Tag. Auf einen
    // Tag-ANFANG zu pruefen ginge nicht - `rufeAuf<void>` sieht genauso aus.
    expect(CODEZEILEN).not.toContain('</')
    expect(CODEZEILEN).not.toContain('/>')
    expect(CODEZEILEN).not.toMatch(/from\s+['"]react['"]/)
  })

  it('enthaelt kein String-Literal mit config: oder project: (die Namen kommen aus KANAELE)', () => {
    expect(CODEZEILEN).not.toContain('config:')
    expect(CODEZEILEN).not.toContain('project:')
  })

  it('enthaelt kein window.api', () => {
    expect(CODEZEILEN).not.toMatch(/window\.api/)
  })
})
