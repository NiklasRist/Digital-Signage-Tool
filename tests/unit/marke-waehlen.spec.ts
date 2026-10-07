// Tests zu #319 - marke-waehlen.ts (die Marken-Auswahl und der Zuweisungsweg).
//
// Komplett ohne Browser: markenAuswahl und istBekannteMarke sind rein;
// setzeMarke wird ueber ein rufeAuf-Doppel geprueft (ueber den Schreibweg
// speichereAktion aus #136).
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Marke } from '../../src/shared/contracts/marke'
import type { Aktion } from '../../src/shared/contracts/aktion'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
}))

const bereitschaft = vi.hoisted(() => ({
  rufeBereit: [] as string[][],
  scheitert: false as boolean,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  stelleMarkeBereit: async (markeId: string) => {
    bereitschaft.rufeBereit.push([markeId])
    if (bereitschaft.scheitert) return { ok: false as const, fehler: { code: 'marken_datei_fehlt', meldung: 'x' } }
    return { ok: true as const, wert: {} }
  },
}))

const { markenAuswahl, istBekannteMarke, setzeMarke } = await import(
  '../../src/renderer/action-editor/marke-waehlen'
)

function marke(id: string, name: string): Marke {
  return {
    id,
    name,
    parent: null,
    eingebaut: false,
    farben: null as never,
    schriften: null as never,
    logo: null as never,
    sicherheit: { horizontal: 96, vertikal: 54 },
    radien: null as never,
    schatten: null as never,
    slogan: null as never,
    herkunftJeFeld: null as never,
  }
}

const BESTAND = [
  marke('m-k', 'Königshafen'),
  marke('m-a', 'Atrium'),
  marke('m-z', 'Zeitlos'),
]

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = { ok: true, wert: { id: 'a1' } as Aktion }
  bereitschaft.rufeBereit = []
  bereitschaft.scheitert = false
})

describe('markenAuswahl (ENTSCHIEDEN 2: keine Sortierung, keine Filterung)', () => {
  it('genau so viele Eintrage wie Marken, in derselben (absichtlich unalphabetischen) Reihenfolge', () => {
    const auswahl = markenAuswahl(BESTAND)
    expect(auswahl.map((e) => e.markeId)).toEqual(['m-k', 'm-a', 'm-z'])
    expect(auswahl.map((e) => e.name)).toEqual(['Königshafen', 'Atrium', 'Zeitlos'])
  })

  it('leere Liste: leere Auswahl - kein Wurf, kein Ersatzeintrag', () => {
    expect(markenAuswahl([])).toEqual([])
  })

  it('ein Eintrag traegt GENAU zwei Felder (ENTSCHIEDEN 8)', () => {
    const [e] = markenAuswahl(BESTAND)
    expect(e !== undefined).toBe(true)
    expect(Object.keys(e as object).sort()).toEqual(['markeId', 'name'])
  })
})

describe('istBekannteMarke (ENTSCHIEDEN 7: Auskunft, keine Korrektur)', () => {
  it('true fuer eine enthaltene Kennung, false fuer eine unbekannte', () => {
    expect(istBekannteMarke('m-a', BESTAND)).toBe(true)
    expect(istBekannteMarke('fehlt', BESTAND)).toBe(false)
  })

  it('ein leerer markeId liefert false', () => {
    expect(istBekannteMarke('', BESTAND)).toBe(false)
  })

  it('der Bestand bleibt unveraendert (Object.freeze, kein Wurf)', () => {
    const fest = Object.freeze(BESTAND)
    expect(() => istBekannteMarke('m-a', fest)).not.toThrow()
  })
})

describe('setzeMarke (der einzige Weg ueber speichereAktion, #136)', () => {
  it('ruft speichereAktion(aktionId, { markeId }) - die Nutzlast enthaelt GENAU dieses Feld', async () => {
    doppel.antwort = { ok: true, wert: { id: 'a1' } as Aktion }
    const antwort = await setzeMarke('a1', 'm2')
    expect(antwort.ok).toBe(true)
    expect(doppel.aufrufe).toHaveLength(1)
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { id: string; aktionsdaten: Record<string, unknown> }
    expect(nutzlast.id).toBe('a1')
    expect(Object.keys(nutzlast.aktionsdaten)).toEqual(['markeId'])
    expect(nutzlast.aktionsdaten.markeId).toBe('m2')
  })

  it('ein leerer markeId sendet NICHT und liefert ungueltige_eingabe', async () => {
    const antwort = await setzeMarke('a1', '')
    expect(doppel.aufrufe).toHaveLength(0)
    expect(antwort.ok).toBe(false)
  })
})

describe('setzeMarke - der Nachzug aus #319 (a): bereitstellen nach dem Speichern', () => {
  it('ruft nach erfolgreichem Speichern GENAU EINMAL stelleMarkeBereit(markeId); der Rueckgabewert bleibt der des Speichers', async () => {
    const speicherAntwort = { ok: true as const, wert: { id: 'a1' } as Aktion }
    doppel.antwort = speicherAntwort

    const antwort = await setzeMarke('a1', 'm2')

    expect(antwort).toBe(speicherAntwort)
    expect(bereitschaft.rufeBereit).toEqual([['m2']])
  })

  it('scheitert das Speichern, wird NICHT bereitgestellt', async () => {
    doppel.antwort = { ok: false as const, fehler: { code: 'nicht_gefunden', meldung: 'x' } }

    await setzeMarke('a1', 'm2')

    expect(bereitschaft.rufeBereit).toEqual([])
  })

  it('scheitert die BEREITSTELLUNG, bleibt die Speicher-Antwort unangetastet geliefert', async () => {
    const speicherAntwort = { ok: true as const, wert: { id: 'a1' } as Aktion }
    doppel.antwort = speicherAntwort
    bereitschaft.scheitert = true

    const antwort = await setzeMarke('a1', 'm2')

    expect(antwort).toBe(speicherAntwort)
    expect(bereitschaft.rufeBereit).toEqual([['m2']])
  })
})
