// Verhaltenstests zu #138 - bild-zuweisen.ts.
// Seit dem Editor-Umbau (04.11.2026) schreibt diese Datei NICHT mehr: der Editor haelt
// einen Entwurf. Geprueft werden die Pruefung der Bildwahl (`pruefeBildWahl`) und die
// Teilerfolg-Logik der Einreih-Schleife des Imports.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'

import type { Asset } from '../../src/shared/contracts/asset'

const doppelWeg = vi.hoisted(() => ({
  rufeAufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  rufeAntworten: [] as unknown[],
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

import {
  pruefeBildWahl,
  starteBildImport,
  waehlbareBilder,
} from '../../src/renderer/action-editor/bild-zuweisen'

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

beforeEach(() => {
  doppelWeg.rufeAufrufe.splice(0)
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

describe('pruefeBildWahl (#138, Entwurfs-Modell seit 04.11.2026)', () => {
  it('eine vorhandene Bild-ID wird angenommen - null heisst „darf gewaehlt werden"', () => {
    expect(pruefeBildWahl('b-ok', [asset('b-ok', 'bild')])).toBeNull()
  })

  it('leere assetId -> Meldung, kein Wurf', () => {
    expect(pruefeBildWahl('', [asset('b-ok', 'bild')])).toContain('Kennung ist leer')
  })

  it('unbekannte assetId -> Meldung nennt die ID', () => {
    const meldung = pruefeBildWahl('gibts-nicht', [asset('b-ok', 'bild')])
    expect(meldung).toContain('gibts-nicht')
    expect(meldung).toContain('gehört nicht zum Projektbestand')
  })

  it('fehlt-Asset -> Meldung (kein Defekt auf Bestellung)', () => {
    const meldung = pruefeBildWahl('b-fehlt', [asset('b-fehlt', 'bild', 'fehlt')])
    expect(meldung).toContain('gilt als fehlend')
  })

  it('Video als Aktions-Bild -> Meldung', () => {
    const meldung = pruefeBildWahl('v1', [asset('v1', 'video')])
    expect(meldung).toContain('ist ein Video')
  })

  it('schreibt NICHTS: kein Kanal-Aufruf, keine Nutzlast', () => {
    pruefeBildWahl('b-ok', [asset('b-ok', 'bild')])
    expect(doppelWeg.rufeAufrufe).toHaveLength(0)
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
