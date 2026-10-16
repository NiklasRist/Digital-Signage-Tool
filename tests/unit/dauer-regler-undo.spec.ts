// Test zu #429 - Dauer/Trim gehen jetzt DURCH die Undo-Huelle.
//
// Der eigentliche Nachweis: Mit dem ECHTEN `umhuelleFuerBearbeitung` (#243) legt ein
// Trim-/Dauer-Schritt einen Schnappschuss an, den `kannRueckgaengig` sieht. Zuvor schrieb
// `uebernehmeGrenzen` ueber das rohe `gleicheElementAb` direkt am Stapel vorbei.
//
// Gestellt sind nur die IPC-Naht (`rufeAuf`) und die Sicht (`holeSicht`) - die Huelle und
// die Historie laufen echt.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Listenelement, Project } from '../../src/shared/contracts/project'
import type { ProjektZugang } from '../../src/renderer/app-shell/sichten'

const doppel = vi.hoisted(() => ({
  sicht: null as Project | null,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async () => doppel.antwort,
}))
vi.mock('../../src/renderer/composer/projektzustand', () => ({
  holeSicht: () => ({ projekt: doppel.sicht, ladefehler: null }),
  // Der Bestaetigungs-Abgleich ist hier ohne Sicht-Wirkung - die Snapshot-Frage haengt
  // allein am Anwenden (#429).
  gleicheElementAb: () => {},
}))

const { uebernehmeGrenzen } = await import('../../src/renderer/composer/dauer-regler')
const { umhuelleFuerBearbeitung } = await import('../../src/renderer/app-shell/undo-aufzeichnung')
const { kannRueckgaengig } = await import('../../src/renderer/app-shell/undo-projekt')
const { leereProjektHistorie } = await import('../../src/renderer/app-shell/undo-historien')

function videoElement(): Listenelement {
  return {
    id: 'el-video',
    art: 'video',
    ref: 'asset-1',
    dauer: null,
    trimStart: 4.71,
    trimEnde: 71.37,
    einblendung: null,
  }
}

function projektMit(liste: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    schemaVersion: 1,
    erstellt: '2026-08-15T00:00:00.000Z',
    geaendert: '2026-08-15T00:00:00.000Z',
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  } as unknown as Project
}

/** Ein Projektzugang, der die Sicht wie #121 fuehrt (neues Objekt, neues Array). */
function rohZugang(initial: Project): ProjektZugang {
  let aktuell = initial
  doppel.sicht = initial
  return {
    lade: async () => ({ ok: true as const, wert: aktuell }),
    hole: () => ({ projekt: aktuell, ladefehler: null }),
    setzeProjekt: (p) => {
      aktuell = p
      doppel.sicht = p
    },
    setzeListe: (liste) => {
      aktuell = { ...aktuell, liste }
      doppel.sicht = aktuell
    },
    gleicheElementAb: () => {},
    leere: () => {},
    aufGeaendert: () => () => {},
  }
}

beforeEach(() => {
  doppel.sicht = null
  doppel.antwort = null
  leereProjektHistorie()
})

describe('uebernehmeGrenzen durch die Undo-Huelle (#429)', () => {
  it('KERNNACHWEIS: ein Trim-Schritt legt EINEN Schnappschuss an (kannRueckgaengig)', async () => {
    const element = videoElement()
    const roh = rohZugang(projektMit([element]))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    const undoZugang = { holeProjekt: () => roh.hole().projekt, setzeProjekt: roh.setzeProjekt }
    doppel.antwort = { ok: true, wert: { ...element, trimStart: 9.13, trimEnde: 63.29 } }

    // Vorher: nichts rueckgaengig zu machen.
    expect(kannRueckgaengig(undoZugang)).toBe(false)

    await uebernehmeGrenzen(element, 9.13, 63.29, gehuellt.setzeListe)

    // Nachher: der Schnappschuss steht, die Sicht traegt den bestaetigten Stand.
    expect(kannRueckgaengig(undoZugang)).toBe(true)
    expect(roh.hole().projekt?.liste[0]?.trimStart).toBe(9.13)
  })

  it('auch ein Segment-Dauer-Schritt zeichnet auf', async () => {
    const element: Listenelement = {
      id: 'el-segment',
      art: 'segment',
      ref: 'ref-1',
      dauer: 23.41,
      trimStart: null,
      trimEnde: null,
      einblendung: null,
    }
    const roh = rohZugang(projektMit([element]))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    const undoZugang = { holeProjekt: () => roh.hole().projekt, setzeProjekt: roh.setzeProjekt }
    doppel.antwort = { ok: true, wert: { ...element, dauer: 31.87 } }

    await uebernehmeGrenzen(element, 0, 31.87, gehuellt.setzeListe)

    expect(kannRueckgaengig(undoZugang)).toBe(true)
  })

  it('ein ABGELEHNTER Schritt hinterlaesst KEINEN zweiten Schnappschuss (R1)', async () => {
    const element = videoElement()
    const roh = rohZugang(projektMit([element]))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    doppel.antwort = { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'nein' } }

    await uebernehmeGrenzen(element, 9.13, 63.29, gehuellt.setzeListe)

    // Der eine Schnappschuss bleibt (der Stand VOR dem Zug); die Ruecknahme erzeugt
    // KEINEN zweiten - dieselbe R1-Regel wie bei den uebrigen optimistischen Wegen.
    const top = (await import('../../src/renderer/app-shell/undo-historien')).projektHistorie().vorschauZurueck()
    expect(top?.stand.liste).toEqual([element])
  })
})
