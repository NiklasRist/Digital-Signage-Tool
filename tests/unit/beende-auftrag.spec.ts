import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { ProtokollEintrag } from '../../src/shared/contracts/protokoll'

// Verhaltenstests zu beende-auftrag (#70): der terminale Uebergang.
//
// Gemockt sind die vier Nachbarn, die an die Platte gehen oder heute noch ein
// werfender Rumpf sind - Q3 (#56), Q2 (#55), das Ereignis (#65) und
// starteNaechsten (#59). Q1 (#54) laeuft ECHT mit: Ob der Auftrag am Ende wirklich
// aus der Warteschlange heraus ist, laesst sich nur am echten Speicher zeigen.
//
// Q2 ist dabei kein blosser Spion, sondern ein winziger Nachbau: Nur so ist
// "abgebrochen laesst einen bestehenden Eintrag unveraendert" ueberhaupt pruefbar.
const welt = vi.hoisted(() => {
  const zustand = {
    reihenfolge: [] as string[],
    q3: [] as ProtokollEintrag[],
    q3Fehler: false,
    q2: [] as { projektId: string; auftrag: Auftrag }[],
    // Der Test darf bei JEDEM Schritt in den echten Q1 sehen - so wird die
    // Reihenfolge belegt und nicht nur das Vorkommen der Aufrufe.
    beobachte: null as ((stelle: string) => void) | null,
  }
  const merke = (stelle: string): void => {
    zustand.reihenfolge.push(stelle)
    zustand.beobachte?.(stelle)
  }

  return {
    zustand,
    protokoll: vi.fn(async (eintrag: ProtokollEintrag) => {
      merke('q3')
      if (zustand.q3Fehler) {
        return { ok: false as const, fehler: { code: 'speicher_fehler', meldung: 'Platte voll' } }
      }
      zustand.q3.push(eintrag)
      return { ok: true as const, wert: undefined }
    }),
    merkeFehlschlag: vi.fn(async (projektId: string, auftrag: Auftrag) => {
      merke('q2:merke')
      const stelle = zustand.q2.findIndex((e) => e.auftrag.auftragId === auftrag.auftragId)
      if (stelle >= 0) {
        zustand.q2[stelle] = { projektId, auftrag }
      } else {
        zustand.q2.push({ projektId, auftrag })
      }
      return { ok: true as const, wert: undefined }
    }),
    streicheAusQ2: vi.fn(async (projektId: string, auftragId: string) => {
      merke('q2:streiche')
      zustand.q2 = zustand.q2.filter((e) => e.auftrag.auftragId !== auftragId)
      // IDEMPOTENT wie #55: ein fehlender Eintrag ist kein Fehler, sondern der Normalfall.
      return { ok: true as const, wert: undefined }
    }),
    sendeQueueGeaendert: vi.fn(async () => {
      merke('ereignis')
    }),
    starteNaechsten: vi.fn(() => {
      merke('starteNaechsten')
    }),
  }
})

vi.mock('../../src/main/auftrags-manager/q3-protokoll', () => ({
  haengeProtokollEintragAn: welt.protokoll,
}))
vi.mock('../../src/main/auftrags-manager/q2-wiederholung', () => ({
  merkeFehlschlag: welt.merkeFehlschlag,
  streicheAusQ2: welt.streicheAusQ2,
}))
vi.mock('../../src/main/auftrags-manager/queue-ereignis', () => ({
  sendeQueueGeaendert: welt.sendeQueueGeaendert,
}))
vi.mock('../../src/main/auftrags-manager/torwaechter', () => ({
  starteNaechsten: welt.starteNaechsten,
}))

type Q1Modul = typeof import('../../src/main/auftrags-manager/q1-warteschlange')
type BeendeAuftrag = typeof import('../../src/main/auftrags-manager/beende-auftrag').beendeAuftrag

// Q1 ist fluechtiger Modulzustand ohne Leer-Funktion; ein frisches Modul je Test ist
// der einzige Weg zu einer leeren Warteschlange.
async function frisch(): Promise<{ q1: Q1Modul; beendeAuftrag: BeendeAuftrag }> {
  vi.resetModules()
  const q1 = await import('../../src/main/auftrags-manager/q1-warteschlange')
  const { beendeAuftrag } = await import('../../src/main/auftrags-manager/beende-auftrag')
  return { q1, beendeAuftrag }
}

const BEGONNEN = '2026-08-13T10:00:00.000Z'

function importAuftrag(id = 'a-import'): Auftrag {
  return {
    auftragId: id,
    art: 'import',
    status: 'anstehend',
    label: 'Video importieren',
    payload: { projektId: 'p-1', quellPfad: 'C:/quelle/clip.mp4' },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: BEGONNEN,
  }
}

function loeschAuftrag(id = 'a-loeschen'): Auftrag {
  return { ...importAuftrag(id), art: 'loeschen', payload: { projektId: 'p-1', assetId: 'as-1' } }
}

function renderAuftrag(id = 'a-render'): Auftrag {
  return {
    ...importAuftrag(id),
    art: 'render',
    payload: {
      renderId: 'r-42',
      projektId: 'p-1',
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: 'sommeraktion',
    },
  }
}

function exportAuftrag(id = 'a-export'): Auftrag {
  return {
    ...importAuftrag(id),
    art: 'export',
    payload: { projektId: 'p-1', dateiname: 'sommeraktion.mp4', zielPfad: 'E:/' },
  }
}

/** Legt den Auftrag in Q1 und versetzt ihn in den Zustand, den der Torwaechter (#59) hinterlaesst. */
function laeuft(q1: Q1Modul, auftrag: Auftrag, begonnenAm = BEGONNEN): Auftrag {
  q1.fuegeAnsEndeAn(auftrag)
  const eintrag = q1.findeQ1(auftrag.auftragId)
  if (eintrag === undefined) {
    throw new Error('Testaufbau: Auftrag steht nicht in Q1')
  }
  eintrag.auftrag.status = 'laeuft'
  eintrag.begonnenAm = begonnenAm
  return eintrag.auftrag
}

function ersterQ3(): ProtokollEintrag {
  const eintrag = welt.zustand.q3[0]
  if (eintrag === undefined) {
    throw new Error('Es wurde kein Q3-Eintrag geschrieben')
  }
  return eintrag
}

describe('beendeAuftrag (#70)', () => {
  beforeEach(() => {
    welt.zustand.reihenfolge = []
    welt.zustand.q3 = []
    welt.zustand.q3Fehler = false
    welt.zustand.q2 = []
    welt.zustand.beobachte = null
    welt.protokoll.mockClear()
    welt.merkeFehlschlag.mockClear()
    welt.streicheAusQ2.mockClear()
    welt.sendeQueueGeaendert.mockClear()
    welt.starteNaechsten.mockClear()
  })

  it('uebernimmt bei erfolg genau die Nutzdaten des Handlers und leert fehler', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())
    // Der Fehler des vorigen Versuchs steht noch da - nach einem Erfolg duerfen
    // ergebnis und fehler nicht gleichzeitig gefuellt sein.
    auftrag.fehler = { code: 'probe_fehler', meldung: 'erster Versuch' }
    const nutzdaten = { id: 'as-1', dateiname: 'as-1.mp4' }

    await beendeAuftrag(auftrag.auftragId, { status: 'erfolg', ergebnis: nutzdaten })

    expect(auftrag.status).toBe('erfolg')
    expect(auftrag.ergebnis).toBe(nutzdaten)
    expect(auftrag.fehler).toBeNull()
    expect(q1.findeQ1(auftrag.auftragId)).toBeUndefined()
  })

  it('uebernimmt bei fehlgeschlagen den Fehler samt daten unveraendert', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, loeschAuftrag())
    const fehler = {
      code: 'asset_referenziert',
      meldung: 'Das Medium wird noch benutzt.',
      daten: { referenzenIds: ['le-1', 'le-2'] },
    }

    await beendeAuftrag(auftrag.auftragId, { status: 'fehlgeschlagen', fehler })

    expect(auftrag.status).toBe('fehlgeschlagen')
    expect(auftrag.fehler).toEqual(fehler)
    expect(auftrag.ergebnis).toBeNull()
  })

  it('legt fachliche Fehlercodes zeichengleich in Auftrag und Protokoll ab', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const bekannt = laeuft(q1, loeschAuftrag('a-1'))
    const unbekannt = laeuft(q1, exportAuftrag('a-2'))

    await beendeAuftrag('a-1', {
      status: 'fehlgeschlagen',
      fehler: { code: 'datei_fehler', meldung: 'Datei gesperrt' },
    })
    // 'kein_platz' kennt diese Funktion nicht - abgebildet wird trotzdem nichts.
    await beendeAuftrag('a-2', {
      status: 'fehlgeschlagen',
      fehler: { code: 'kein_platz', meldung: 'Stick voll' },
    })

    expect(bekannt.fehler?.code).toBe('datei_fehler')
    expect(unbekannt.fehler?.code).toBe('kein_platz')
    expect(welt.zustand.q3.map((e) => e.fehler?.code)).toEqual(['datei_fehler', 'kein_platz'])
  })

  it('schreibt in den Q3-Eintrag nur code und meldung, nie daten', async () => {
    const { q1, beendeAuftrag } = await frisch()
    laeuft(q1, loeschAuftrag())

    await beendeAuftrag('a-loeschen', {
      status: 'fehlgeschlagen',
      fehler: { code: 'asset_referenziert', meldung: 'benutzt', daten: { referenzenIds: ['le-1'] } },
    })

    expect(ersterQ3().fehler).toEqual({ code: 'asset_referenziert', meldung: 'benutzt' })
  })

  it('erzeugt fuer jeden der drei Ausgaenge genau einen vollstaendigen Q3-Eintrag', async () => {
    const { q1, beendeAuftrag } = await frisch()
    laeuft(q1, importAuftrag('a-1'))
    laeuft(q1, importAuftrag('a-2'))
    laeuft(q1, importAuftrag('a-3'))
    const vorher = Date.now()

    await beendeAuftrag('a-1', { status: 'erfolg', ergebnis: null })
    await beendeAuftrag('a-2', {
      status: 'fehlgeschlagen',
      fehler: { code: 'probe_fehler', meldung: 'kaputt' },
    })
    await beendeAuftrag('a-3', { status: 'abgebrochen' })

    expect(welt.zustand.q3.map((e) => e.ergebnis)).toEqual([
      'erfolg',
      'fehlgeschlagen',
      'abgebrochen',
    ])
    const eintrag = ersterQ3()
    expect(eintrag.auftragId).toBe('a-1')
    expect(eintrag.art).toBe('import')
    expect(eintrag.projektId).toBe('p-1')
    expect(eintrag.versuch).toBe(1)
    expect(eintrag.begonnenAm).toBe(BEGONNEN)
    expect(Date.parse(eintrag.beendetAm)).toBeGreaterThanOrEqual(vorher)
    expect(eintrag.id).not.toBe(welt.zustand.q3[1]?.id)
  })

  it('benennt beim Export zielPfad in pfad um und setzt gesamtdauer ausdruecklich auf null', async () => {
    const { q1, beendeAuftrag } = await frisch()
    laeuft(q1, exportAuftrag())

    await beendeAuftrag('a-export', {
      status: 'erfolg',
      ergebnis: { zielPfad: 'E:/werbung.mp4', dateigroesse: 123 },
    })

    const ausgabe = ersterQ3().ausgabe
    expect(ausgabe).toEqual({ pfad: 'E:/werbung.mp4', dateigroesse: 123, gesamtdauer: null })
    expect(ausgabe?.pfad).not.toBeUndefined()
    // Gesetzt, nicht weggelassen: das Feld ist `number | null`, nicht optional.
    expect(ausgabe !== null && 'gesamtdauer' in ausgabe).toBe(true)
  })

  it('uebernimmt beim Render die Dauer und laesst ausgabeName weg', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, renderAuftrag())
    const nutzdaten = {
      pfad: 'C:/daten/projects/p-1/output/sommeraktion.mp4',
      ausgabeName: 'sommeraktion',
      dateigroesse: 4096,
      gesamtdauer: 612,
    }

    await beendeAuftrag('a-render', { status: 'erfolg', ergebnis: nutzdaten })

    const ausgabe = ersterQ3().ausgabe
    expect(ausgabe?.gesamtdauer).toBe(612)
    // Schlaegt fehl, sobald der Eintrag per Spread aus auftrag.ergebnis gebaut wird.
    expect(Object.keys(ausgabe ?? {}).sort()).toEqual(['dateigroesse', 'gesamtdauer', 'pfad'])
    expect(ausgabe !== null && 'ausgabeName' in ausgabe).toBe(false)
    // Im Auftrag bleibt der Name dagegen erhalten - nur das Protokoll bekommt ihn nicht.
    expect(auftrag.ergebnis).toEqual(nutzdaten)
  })

  it('laesst ausgabe bei erfolgreichem import und loeschen null', async () => {
    const { q1, beendeAuftrag } = await frisch()
    laeuft(q1, importAuftrag('a-1'))
    laeuft(q1, loeschAuftrag('a-2'))

    await beendeAuftrag('a-1', { status: 'erfolg', ergebnis: { id: 'as-1', pfad: 'media/as-1.mp4' } })
    await beendeAuftrag('a-2', { status: 'erfolg', ergebnis: { assetId: 'as-1' } })

    expect(welt.zustand.q3.map((e) => e.ausgabe)).toEqual([null, null])
  })

  it('ruft bei fehlgeschlagen merkeFehlschlag mit der projektId der Nutzlast, nie streicheAusQ2', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())

    await beendeAuftrag(auftrag.auftragId, {
      status: 'fehlgeschlagen',
      fehler: { code: 'probe_fehler', meldung: 'kaputt' },
    })

    expect(welt.merkeFehlschlag).toHaveBeenCalledTimes(1)
    expect(welt.merkeFehlschlag).toHaveBeenCalledWith('p-1', auftrag)
    expect(welt.streicheAusQ2).not.toHaveBeenCalled()
  })

  it('ruft bei erfolg streicheAusQ2 auch ohne vorhandenen Eintrag und laeuft normal weiter', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())

    await beendeAuftrag(auftrag.auftragId, { status: 'erfolg', ergebnis: null })

    expect(welt.streicheAusQ2).toHaveBeenCalledTimes(1)
    expect(welt.streicheAusQ2).toHaveBeenCalledWith('p-1', auftrag.auftragId)
    expect(welt.merkeFehlschlag).not.toHaveBeenCalled()
    expect(q1.findeQ1(auftrag.auftragId)).toBeUndefined()
    expect(welt.sendeQueueGeaendert).toHaveBeenCalledTimes(1)
    expect(welt.starteNaechsten).toHaveBeenCalledTimes(1)
  })

  it('laesst Q2 bei abgebrochen unveraendert - weder anlegen noch streichen', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, exportAuftrag())
    // FA-17: Der Fehlschlag eines frueheren Versuchs muss den Abbruch der
    // Wiederholung ueberleben.
    welt.zustand.q2 = [{ projektId: 'p-1', auftrag }]
    const vorher = [...welt.zustand.q2]

    await beendeAuftrag(auftrag.auftragId, { status: 'abgebrochen' })

    expect(welt.merkeFehlschlag).not.toHaveBeenCalled()
    expect(welt.streicheAusQ2).not.toHaveBeenCalled()
    expect(welt.zustand.q2).toEqual(vorher)
    expect(welt.zustand.q3).toHaveLength(1)
  })

  it('erzeugt beim zweiten Fehlschlag keinen zweiten Q2-Eintrag, aber einen zweiten Q3-Eintrag', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, exportAuftrag())
    const fehler = { code: 'kein_platz', meldung: 'Stick voll' }

    await beendeAuftrag(auftrag.auftragId, { status: 'fehlgeschlagen', fehler })
    // Was #63 und #59 tun: derselbe Auftrag zurueck in die Schlange, versuche steigt
    // beim START der Wiederholung.
    auftrag.status = 'fehlgeschlagen'
    laeuft(q1, auftrag)
    auftrag.versuche = 2
    await beendeAuftrag(auftrag.auftragId, { status: 'fehlgeschlagen', fehler })

    expect(welt.zustand.q2).toHaveLength(1)
    expect(welt.zustand.q3.map((e) => e.versuch)).toEqual([1, 2])
  })

  it('haelt die Reihenfolge Q3 -> Q2 -> Q1-Entfernen -> Ereignis -> starteNaechsten', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())
    const inQ1: Array<[string, boolean]> = []
    welt.zustand.beobachte = (stelle) => {
      inQ1.push([stelle, q1.findeQ1(auftrag.auftragId) !== undefined])
    }

    await beendeAuftrag(auftrag.auftragId, { status: 'erfolg', ergebnis: null })

    expect(welt.zustand.reihenfolge).toEqual(['q3', 'q2:streiche', 'ereignis', 'starteNaechsten'])
    // Die zweite Spalte belegt Schritt 5: Q3 und Q2 sehen den Auftrag noch (nur so ist
    // begonnenAm da), Ereignis und Torwaechter sehen die geraeumte Schlange.
    expect(inQ1).toEqual([
      ['q3', true],
      ['q2:streiche', true],
      ['ereignis', false],
      ['starteNaechsten', false],
    ])
  })

  it('veraendert beim zweiten Aufruf mit derselben auftragId nichts', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())

    await beendeAuftrag(auftrag.auftragId, { status: 'erfolg', ergebnis: { id: 'as-1' } })
    await expect(
      beendeAuftrag(auftrag.auftragId, {
        status: 'fehlgeschlagen',
        fehler: { code: 'probe_fehler', meldung: 'zu spaet' },
      }),
    ).resolves.toBeUndefined()

    expect(welt.zustand.q3).toHaveLength(1)
    expect(auftrag.status).toBe('erfolg')
    expect(auftrag.fehler).toBeNull()
    expect(welt.starteNaechsten).toHaveBeenCalledTimes(1)
    expect(q1.findeQ1(auftrag.auftragId)).toBeUndefined()
  })

  it('weist ein verspaetetes Ergebnis auf einen bereits terminalen Q1-Eintrag ab', async () => {
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())
    auftrag.status = 'erfolg'

    await beendeAuftrag(auftrag.auftragId, {
      status: 'fehlgeschlagen',
      fehler: { code: 'probe_fehler', meldung: 'zu spaet' },
    })

    expect(welt.zustand.q3).toHaveLength(0)
    expect(auftrag.status).toBe('erfolg')
    // Der Eintrag bleibt liegen: Wer ihn raeumt, entscheidet der Torwaechter, nicht
    // ein abgewiesener Uebergang.
    expect(q1.findeQ1(auftrag.auftragId)).toBeDefined()
    expect(welt.starteNaechsten).not.toHaveBeenCalled()
  })

  it('wirft bei unbekannter auftragId nicht und veraendert nichts', async () => {
    const { q1, beendeAuftrag } = await frisch()
    laeuft(q1, importAuftrag())

    await expect(
      beendeAuftrag('gibt-es-nicht', { status: 'erfolg', ergebnis: null }),
    ).resolves.toBeUndefined()

    expect(welt.zustand.reihenfolge).toEqual([])
    expect(q1.alleQ1()).toHaveLength(1)
  })

  it('haelt die Schlange am Laufen, wenn das Q3-Schreiben scheitert', async () => {
    // VORLAEUFIGES VERHALTEN - der STOPP-Block von #70 verbietet, den Umgang mit einem
    // gescheiterten Q3-/Q2-Schreiben hier zu entscheiden. Dieser Test haelt fest, was
    // die Datei heute tut; wird die Frage beantwortet, MUSS er sich aendern.
    const { q1, beendeAuftrag } = await frisch()
    const auftrag = laeuft(q1, importAuftrag())
    welt.zustand.q3Fehler = true

    await expect(
      beendeAuftrag(auftrag.auftragId, { status: 'erfolg', ergebnis: null }),
    ).resolves.toBeUndefined()

    expect(q1.findeQ1(auftrag.auftragId)).toBeUndefined()
    expect(welt.starteNaechsten).toHaveBeenCalledTimes(1)
  })

  it('beruehrt weder Dateisystem noch project-store noch ffmpeg', async () => {
    const quelle = readFileSync(
      new URL('../../src/main/auftrags-manager/beende-auftrag.ts', import.meta.url),
      'utf8',
    )
    const importe = quelle.match(/^import .*$/gm) ?? []

    expect(importe.join('\n')).not.toMatch(/node:fs|project-store|ffmpeg|d1-lock/)
  })
})
