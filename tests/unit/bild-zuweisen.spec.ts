// Verhaltenstests zu #138 - bild-zuweisen.ts.
// rufeAuf (#24) und speichereAktion (#136) als Doppel; der Fokus sind Auswahlregel,
// Nutzlasten und die Teilerfolg-Logik der Einreih-Schleife.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Aktion } from '../../src/shared/contracts/aktion'

const doppelWeg = vi.hoisted(() => ({
  rufeAufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  rufeAntworten: [] as unknown[],
  speicherAufrufe: [] as Array<{ id: string; aenderungen: unknown }>,
  speicherAntwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppelWeg.rufeAufrufe.push({ kanal, nutzlast })
    const antwort = doppelWeg.rufeAntworten.shift()
    if (antwort === undefined) {
      throw new Error('Doppel: keine Antwort vorbereitet')
    }
    return antwort
  },
}))

vi.mock('../../src/renderer/action-editor/aktion-bearbeiten', () => ({
  speichereAktion: async (id: string, aenderungen: unknown) => {
    doppelWeg.speicherAufrufe.push({ id, aenderungen })
    return doppelWeg.speicherAntwort
  },
}))

import {
  entferneBild,
  starteBildImport,
  waehlbareBilder,
  weiseBildZu,
} from '../../src/renderer/action-editor/bild-zuweisen'

// ---------------- Quelldatei-Verbote (Grep) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/action-editor/bild-zuweisen.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('bild-zuweisen – Verbote in der Quelldatei (Grep)', () => {
  it('enthaelt weder Kanal-Literale noch window.api noch fs noch Endungs-Filter', () => {
    expect(CODEZEILEN).not.toContain("'media:'")
    expect(CODEZEILEN).not.toContain("'queue:'")
    expect(CODEZEILEN).not.toContain('window.api')
    expect(CODEZEILEN).not.toMatch(/(endsWith|\.extname|splitPath)/)
  })

  it('traegt den leeren String als bildRef-Wert nirgends (nur null) und kein fehler.daten-Feld', () => {
    expect(CODEZEILEN).not.toContain("bildRef: ''")
    expect(CODEZEILEN).not.toContain('fehler.daten ')
  })
})

// ---------------- Bausteine ----------------

function asset(id: string, typ: 'video' | 'bild', zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === 'video' ? 'mp4' : 'png'}`,
    originalname: `medium-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12.5 : null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

const AKTION_OK = {
  ok: true as const,
  wert: {
    id: 'a-1',
    titel: 'Sommeraktion',
    beschreibung: null,
    preis: null,
    bildRef: 'b-neu',
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  } as Aktion,
}

beforeEach(() => {
  doppelWeg.rufeAufrufe.splice(0)
  doppelWeg.speicherAufrufe.splice(0)
  doppelWeg.rufeAntworten = [
    // Standard: Dialog liefert drei Bildpfade (andere Reihenfolge bewusst krumm).
    {
      ok: true,
      wert: { pfade: ['/pfad/eins.png', '/pfad/zwei.jpg', '/pfad/drei.png'] },
    },
    { ok: true, wert: { auftragId: 'q-1' } },
    { ok: true, wert: { auftragId: 'q-2' } },
    { ok: true, wert: { auftragId: 'q-3' } },
  ]
  doppelWeg.speicherAntwort = AKTION_OK
})

describe('waehlbareBilder (#138)', () => {
  it('liefert NUR typ bild UND zustand ok, in Eingabereihenfolge (Videos und fehlt-Bilder raus)', () => {
    const eingabe = [
      asset('v1', 'video'),
      asset('b-fehlt', 'bild', 'fehlt'),
      asset('b-ok', 'bild'),
      asset('v-fehlt', 'video', 'fehlt'),
    ]
    expect(waehlbareBilder(eingabe).map((a) => a.id)).toEqual(['b-ok'])
  })

  it('leere Eingabe -> leere Auswahl, kein Wurf', () => {
    expect(waehlbareBilder([])).toEqual([])
  })
})

describe('weiseBildZu (#138)', () => {
  it('ruft speichereAktion(aktionId, { bildRef: assetId }) - NUR dieses Feld', async () => {
    await weiseBildZu('a-1', 'b-ok', [asset('b-ok', 'bild')])
    expect(doppelWeg.speicherAufrufe).toEqual([
      { id: 'a-1', aenderungen: { bildRef: 'b-ok' } },
    ])
  })

  it('leere assetId -> ungueltige_eingabe, kein Aufruf', async () => {
    const antwort = await weiseBildZu('a-1', '', [asset('b-ok', 'bild')])
    expect(antwort.ok).toBe(false)
    expect(doppelWeg.speicherAufrufe).toHaveLength(0)
  })

  it('unbekannte assetId -> ungueltige_eingabe, kein Aufruf, Meldung nennt die ID', async () => {
    const antwort = await weiseBildZu('a-1', 'gibts-nicht', [asset('b-ok', 'bild')])
    expect(antwort.ok).toBe(false)
    expect(doppelWeg.speicherAufrufe).toHaveLength(0)
  })

  it('fehlt-Asset -> ungueltige_eingabe, kein Aufruf (kein Defekt auf Bestellung)', async () => {
    const antwort = await weiseBildZu('a-1', 'b-fehlt', [asset('b-fehlt', 'bild', 'fehlt')])
    expect(antwort.ok).toBe(false)
    expect(doppelWeg.speicherAufrufe).toHaveLength(0)
  })

  it('Video als Aktions-Bild -> ungueltige_eingabe, kein Aufruf', async () => {
    const antwort = await weiseBildZu('a-1', 'v1', [asset('v1', 'video')])
    expect(antwort.ok).toBe(false)
    expect(doppelWeg.speicherAufrufe).toHaveLength(0)
  })

  it('Main-Fehler (nicht_gefunden) wird unveraendert durchgereicht', async () => {
    const mainFehler = {
      ok: false as const,
      fehler: { code: 'nicht_gefunden', meldung: 'Aktion unbekannt', daten: undefined },
    }
    doppelWeg.speicherAntwort = mainFehler
    const antwort = await weiseBildZu('fehlt', 'b-ok', [asset('b-ok', 'bild')])
    expect(antwort).toBe(mainFehler)
  })
})

describe('entferneBild (#138)', () => {
  it('ruft speichereAktion(aktionId, { bildRef: null }) - null, nie der leere String', async () => {
    await entferneBild('a-1')
    expect(doppelWeg.speicherAufrufe).toEqual([
      { id: 'a-1', aenderungen: { bildRef: null } },
    ])
  })
})

describe('starteBildImport (#138)', () => {
  it('drei Pfade -> DREI reiheEin-Aufrufe je { art: import, payload: { projektId, quellPfad } }; abbruchGrund null', async () => {
    const antwort = await starteBildImport('p-1')
    const einreihungen = doppelWeg.rufeAufrufe.slice(1)
    expect(einreihungen).toHaveLength(3)
    expect(einreihungen[0]).toEqual({
      kanal: KANAELE.queue.reiheEin,
      nutzlast: { art: 'import', payload: { projektId: 'p-1', quellPfad: '/pfad/eins.png' } },
    })
    expect(einreihungen[1]?.nutzlast).toEqual({
      art: 'import',
      payload: { projektId: 'p-1', quellPfad: '/pfad/zwei.jpg' },
    })
    expect(einreihungen[2]?.nutzlast).toEqual({
      art: 'import',
      payload: { projektId: 'p-1', quellPfad: '/pfad/drei.png' },
    })
    if (antwort.ok) {
      expect(antwort.wert.abbruchGrund).toBeNull()
      expect(antwort.wert.auftragIds).toEqual(['q-1', 'q-2', 'q-3'])
    }
  })

  it('Dialog-Abbruch (pfade: []) -> ok true, LEERE Liste, KEIN reiheEin-Aufruf', async () => {
    doppelWeg.rufeAntworten = [{ ok: true, wert: { pfade: [] } }]
    const antwort = await starteBildImport('p-1')
    expect(antwort).toEqual({ ok: true, wert: { auftragIds: [], abbruchGrund: null } })
    expect(doppelWeg.rufeAufrufe).toHaveLength(1) // nur der Dialog
  })

  it('schtlaegt der ZWEITE von drei fehl -> ok true, EINE auftragId, abbruchGrund = Code, KEIN dritter Aufruf', async () => {
    doppelWeg.rufeAntworten = [
      { ok: true, wert: { pfade: ['P1', 'P2', 'P3'] } },
      { ok: true,wert: { auftragId: 'q-1' } },
      {
        ok: false,
        fehler: { code: 'reihen_kaputt', meldung: 'x', daten: undefined },
      },
    ]
    const antwort = await starteBildImport('p-1')
    expect(doppelWeg.rufeAufrufe).toHaveLength(3) // Dialog + zwei, kein dritter
    if (antwort.ok) {
      expect(antwort.wert.auftragIds).toEqual(['q-1'])
      expect(antwort.wert.abbruchGrund).toBe('reihen_kaputt')
    } else {
      expect.unreachable('Ein Teilerfolg believe ein Erfolg zu sein')
    }
  })

  it('schtlaegt der ERSTE fehl -> ok false mit UNVERAENDERTER Antwort; nichts laeuft', async () => {
    doppelWeg.rufeAntworten = [
      { ok: true, wert: { pfade: ['P1', 'P2'] } },
      { ok: false, fehler: { code: 'speicher_voll', meldung: 'x', daten: undefined } },
    ]
    const antwort = await starteBildImport('p-1')
    expect(antwort).toEqual({
      ok: false,
      fehler: { code: 'speicher_voll', meldung: 'x', daten: undefined },
    })
  })

  it('Dialog mit ok:false -> Antwort UNVERAENDERT, nichts eingereiht', async () => {
    const dialogFehler = {
      ok: false as const,
      fehler: { code: 'unbekannter_fehler', meldung: 'dialog kaputt', daten: undefined },
    }
    doppelWeg.rufeAntworten = [dialogFehler]
    const antwort = await starteBildImport('p-1')
    expect(antwort).toBe(dialogFehler)
    expect(doppelWeg.rufeAufrufe).toHaveLength(1) // NUR der Dialog
  })

  it('die Pfade gehen UNVERAENDERT weiter - keine Sortierung, keine Whitelist-Vorsortierung', async () => {
    doppelWeg.rufeAntworten = [{ ok: true, wert: { pfade: ['/p/z.mp4', '/p/a.jpg', '/p/m.xyz'] } },
      { ok: true, wert: { auftragId: 'q-1' } },
      { ok: true, wert: { auftragId: 'q-2' } },
      { ok: true, wert: { auftragId: 'q-3' } }]
    await starteBildImport('p-1')
    const pfade = doppelWeg.rufeAufrufe
      .slice(1)
      .map((ruf) => (ruf.nutzlast as { payload: { quellPfad: string } }).payload.quellPfad)
    expect(pfade).toEqual(['/p/z.mp4', '/p/a.jpg', '/p/m.xyz'])
  })
})
