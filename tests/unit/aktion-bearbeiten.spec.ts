// Verhaltenstests zu #136 (aktion-bearbeiten) in der von #318 umgestellten Form.
//
// Die Akzentfarbe ist ein FREIER Hex-Wert (FA-24, TK v3.4) - die #318-DoD-Punkte
// ERSETZEN die alten #136-Punkte (keine_rolle -> kein_hex, AkzentRolle ->
// string | null, istAkzentfarbe statt istAkzentRolle). Alles Uebrige gilt
// unverändert: Titel ist Pflicht, pruefeEntwurf prueft nur vorhandene Felder,
// die Vollstaendigkeit sitzt allein in legeAktionAn, und gesendet wird
// ausschliesslich ueber rufeAuf (#24) mit den Kanaelen aus KANAELE (#25).
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../src/shared/contracts/konstanten'
import { KANAELE } from '../../src/shared/contracts/kanaele'

import type { Aktion } from '../../src/shared/contracts/aktion'

// ---------------- rufeAuf-Doppel ----------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

import {
  leererEntwurf,
  legeAktionAn,
  pruefeEntwurf,
  speichereAktion,
  type AktionsEntwurf,
} from '../../src/renderer/action-editor/aktion-bearbeiten'

// ---------------- Bausteine ----------------

function vollerEntwurf(): Aktion {
  return {
    id: '',
    titel: 'Sommeraktion',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: 10,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: '#FF4040',
  }
}

const AKTION_OK: Aktion = { ...vollerEntwurf(), id: 'a-neu' }

beforeEach(() => {
  doppel.aufrufe.splice(0)
  doppel.antwort = { ok: true, wert: AKTION_OK }
})

describe('pruefeEntwurf – nur vorhandene Felder', () => {
  it('leeres Objekt liefert ein leeres Array (fehlendes Feld ist kein Befund)', () => {
    expect(pruefeEntwurf({})).toEqual([])
  })

  it('ein nur vorhandenes anderes Feld ist kein Befund (Vollstaendigkeit prueft nur legeAktionAn)', () => {
    expect(pruefeEntwurf({ preis: '9,90' })).toEqual([])
  })

  it('leerer Titel und nur-Leerzeichen-Titel je als { titel, leer }', () => {
    expect(pruefeEntwurf({ titel: '' })).toEqual([{ feld: 'titel', grund: 'leer' }])
    expect(pruefeEntwurf({ titel: '   \t ' })).toEqual([{ feld: 'titel', grund: 'leer' }])
  })

  it('leere vorlagenId als { vorlagenId, leer }', () => {
    expect(pruefeEntwurf({ vorlagenId: '' })).toEqual([
      { feld: 'vorlagenId', grund: 'leer' },
    ])
  })

  it('standardDauer ausserhalb des Bereichs als { standardDauer, ausserhalb_bereich }; null ist befundfrei', () => {
    expect(pruefeEntwurf({ standardDauer: 300 })).toEqual([
      { feld: 'standardDauer', grund: 'ausserhalb_bereich' },
    ])
    expect(pruefeEntwurf({ standardDauer: 9 })).toEqual([
      { feld: 'standardDauer', grund: 'ausserhalb_bereich' },
    ])
    expect(pruefeEntwurf({ standardDauer: 45 })).toEqual([])
    expect(pruefeEntwurf({ standardDauer: 10 })).toEqual([])
    expect(pruefeEntwurf({ standardDauer: null })).toEqual([])
  })

  // ERSETZT die #136-Punkte: ein Hex-Wert ist gueltig, ein Rollenname ist es NICHT.
  it('akzentfarbe als Hex ist befundfrei (#318)', () => {
    expect(pruefeEntwurf({ akzentfarbe: '#FF4040' })).toEqual([])
  })

  it('akzentfarbe als Rollenname, kurzes Hex, achtstellig und leer als { akzentfarbe, kein_hex }', () => {
    for (const wert of ['akzentTief', 'flaecheHell', '#FFF', '']) {
      expect(pruefeEntwurf({ akzentfarbe: wert })).toEqual([
        { feld: 'akzentfarbe', grund: 'kein_hex' },
      ])
    }
  })

  it('null bleibt befundfrei (es gilt der Markenwert)', () => {
    expect(pruefeEntwurf({ akzentfarbe: null })).toEqual([])
  })

  it('ein fehlendes akzentfarbe-Feld ist kein Befund', () => {
    expect(pruefeEntwurf({ titel: 'ok', standardDauer: 10 })).toEqual([])
  })
})

describe('leererEntwurf', () => {
  it('setzt titel leer, optionale Felder null und standardDauer auf die Konstante', () => {
    const entwurf = leererEntwurf('vollbild', 'm1', '#FF4040')
    expect(entwurf).toEqual({
      titel: '',
      beschreibung: null,
      preis: null,
      bildRef: null,
      cta: null,
      standardDauer: STANDARD_ANZEIGEDAUER_SEKUNDEN,
      vorlagenId: 'vollbild',
      markeId: 'm1',
      akzentfarbe: '#FF4040',
    })
  })

  it('nimmt akzentfarbe null unverändert (Parameter ist string | null)', () => {
    expect(leererEntwurf('v1', 'm1', null).akzentfarbe).toBeNull()
  })
})

describe('legeAktionAn', () => {
  it('ruft rufeAuf mit dem Kanael aus KANAELE und der Nutzlast { aktionsdaten: entwurf }', async () => {
    const entwurf = vollerEntwurf()
    await legeAktionAn(entwurf as unknown as Aktion)
    expect(doppel.aufrufe).toEqual([
      { kanal: KANAELE.project.erstelleAktion, nutzlast: { aktionsdaten: entwurf } },
    ])
  })

  it.each([
    ['titel', (e: Record<string, unknown>) => delete e['titel']],
    ['vorlagenId', (e: Record<string, unknown>) => delete e['vorlagenId']],
    ['akzentfarbe', (e: Record<string, unknown>) => delete e['akzentfarbe']],
  ])('fehlendes Pflichtfeld %s -> ungueltige_eingabe, kein Senden, Meldung nennt das Feld', async (_feld, kuerze) => {
    const entwurf = vollerEntwurf() as unknown as Record<string, unknown>
    kuerze(entwurf)
    const antwort = await legeAktionAn(entwurf as unknown as Aktion)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('ungueltige_eingabe')
      expect(antwort.fehler.meldung).toContain(_feld)
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('ungueltiger Titel -> kein IPC-Aufruf', async () => {
    const antwort = await legeAktionAn({ ...vollerEntwurf(), titel: '  ' } as Aktion)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('ungueltige_eingabe')
      expect(antwort.fehler.meldung).toContain('titel')
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('Rollennamen als akzentfarbe -> kein IPC-Aufruf (#318)', async () => {
    const antwort = await legeAktionAn({ ...vollerEntwurf(), akzentfarbe: 'akzent' } as Aktion)
    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('ok: false des Main wird UNVERAENDERT weitergereicht', async () => {
    const mainFehler = {
      ok: false as const,
      fehler: { code: 'ungueltige_eingabe', meldung: 'vom Main', daten: undefined },
    }
    doppel.antwort = mainFehler
    const antwort = await legeAktionAn(vollerEntwurf() as Aktion)
    expect(antwort).toBe(mainFehler)
  })

  it('ok: true gibt die Main-Antwort unverändert zurueck (Referenz)', async () => {
    const antwort = await legeAktionAn(vollerEntwurf() as Aktion)
    expect(antwort.ok).toBe(true)
    expect(antwort).toEqual({ ok: true, wert: AKTION_OK })
  })
})

describe('speichereAktion', () => {
  it('ruft rufeAuf mit { id, aktionsdaten: aenderungen } und schickt NUR die uebergebenen Felder', async () => {
    await speichereAktion('a-1', { preis: '9,90' })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.bearbeiteAktion,
        nutzlast: { id: 'a-1', aktionsdaten: { preis: '9,90' } },
      },
    ])
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { aktionsdaten: Record<string, unknown> }
    expect('titel' in nutzlast.aktionsdaten).toBe(false)
  })

  it('standardDauer 300 -> kein IPC-Aufruf (bewusst strenger als der Main)', async () => {
    const antwort = await speichereAktion('a-1', { standardDauer: 300 })
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('ungueltige_eingabe')
      expect(antwort.fehler.meldung).toContain('standardDauer')
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('mitgeschickter leerer Titel -> kein IPC-Aufruf', async () => {
    const antwort = await speichereAktion('a-1', { titel: '' })
    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('mitgeschickter Rollenname -> kein IPC-Aufruf (#318)', async () => {
    const antwort = await speichereAktion('a-1', { akzentfarbe: 'akzent' })
    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toHaveLength(0)
  })

  it('gesetzter Hex-Wert wird gesendet (#318)', async () => {
    await speichereAktion('a-1', { akzentfarbe: '#00AAFF' })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.bearbeiteAktion,
        nutzlast: { id: 'a-1', aktionsdaten: { akzentfarbe: '#00AAFF' } },
      },
    ])
  })

  it('null als akzentfarbe wird GESSENDET, nicht ausgelassen', async () => {
    await speichereAktion('a-1', { akzentfarbe: null })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.bearbeiteAktion,
        nutzlast: { id: 'a-1', aktionsdaten: { akzentfarbe: null } },
      },
    ])
  })

  it('nicht_gefunden vom Main wird unverändert durchgereicht', async () => {
    const mainFehler = {
      ok: false as const,
      fehler: { code: 'nicht_gefunden', meldung: 'Aktion unbekannt', daten: undefined },
    }
    doppel.antwort = mainFehler
    const antwort = await speichereAktion('fehlt', { cta: 'Kommt' })
    expect(antwort).toBe(mainFehler)
    expect(doppel.aufrufe).toHaveLength(1)
  })

  it('leere id -> kein IPC-Aufruf', async () => {
    const antwort = await speichereAktion('', { cta: 'Kommt' })
    expect(antwort.ok).toBe(false)
    expect(doppel.aufrufe).toHaveLength(0)
  })
})

describe('pruefeEntwurf (#319) - markeId', () => {
  it('ein vorhandenes, leeres markeId ist ein Befund; fehlendes ist keiner', () => {
    expect(pruefeEntwurf({ markeId: '' })).toEqual([{ feld: 'markeId', grund: 'leer' }])
    expect(pruefeEntwurf({ markeId: '   ' })).toEqual([{ feld: 'markeId', grund: 'leer' }])
    // unveraendert aus #136: das fehlende Feld erzeugt KEINEN Befund.
    expect(pruefeEntwurf({})).toEqual([])
  })

})

describe('legeAktionAn (#319) - vier Pflichtfelder', () => {
  it('ein Entwurf, in dem markeId ganz fehlt, wird NICHT gesendet', async () => {
    doppel.aufrufe = []
    doppel.antwort = { ok: true, wert: AKTION_OK }
    const fehlen = { ...vollerEntwurf() } as unknown as Record<string, unknown>
    delete fehlen.markeId
    const antwort = await legeAktionAn(fehlen as unknown as AktionsEntwurf)
    expect(antwort.ok).toBe(false)
    if (!antwort.ok) {
      expect(antwort.fehler.code).toBe('ungueltige_eingabe')
      expect(antwort.fehler.meldung).toContain('markeId')
    }
    expect(doppel.aufrufe).toHaveLength(0)
  })
})

describe('speichereAktion (#319) - die Nutzlast eines Marken-Wechsels', () => {
  it('speichereAktion(id, { markeId: m2 }) sendet GENAU { id, aktionsdaten: { markeId } }', async () => {
    doppel.aufrufe = []
    doppel.antwort = { ok: true, wert: AKTION_OK }
    await speichereAktion('a1', { markeId: 'm2' })
    expect(doppel.aufrufe).toHaveLength(1)
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { id: string; aktionsdaten: Record<string, unknown> }
    expect(nutzlast.id).toBe('a1')
    expect(Object.keys(nutzlast.aktionsdaten)).toEqual(['markeId'])
    expect(nutzlast.aktionsdaten.markeId).toBe('m2')
  })
})

// Die Meldungstabelle hatte bis Charge 22 KEINEN Test: Ein geloeschter `case` in
// `meldungZuBefunden` blieb gruen (Mutation B6). Geprueft wird je Befund, dass die
// Meldung FELD und GRUND nennt - nicht der genaue Satzbau.
describe('meldungZuBefunden - jeder Befund nennt Feld und Grund', () => {
  it.each([
    ['titel', { titel: '   ' }, 'titel: Der Titel ist Pflicht'],
    ['vorlagenId', { vorlagenId: '  ' }, 'vorlagenId: Es muss eine Vorlage gewählt sein.'],
    ['standardDauer', { standardDauer: 5 }, 'standardDauer: Der Wert liegt außerhalb'],
    ['akzentfarbe', { akzentfarbe: 'rot' }, 'akzentfarbe: Der Wert ist kein gültiger Hex-Wert'],
  ])('nennt %s und den Grund, ohne zu senden', async (_feld, aenderungen, erwartet) => {
    doppel.aufrufe = []
    doppel.antwort = { ok: true, wert: AKTION_OK }
    const antwort = await speichereAktion('a1', aenderungen as Partial<AktionsEntwurf>)

    expect(antwort.ok).toBe(false)
    if (antwort.ok) return
    expect(antwort.fehler.meldung).toContain(erwartet)
    expect(doppel.aufrufe).toHaveLength(0)
  })
})
