import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Project } from '../../src/shared/contracts/project'

// Verhaltenstest zu oeffneProjektAblauf (#94).
//
// Alle drei Schritte sind Attrappen. Diese Datei hat keine eigene Fachlogik - geprueft wird
// deshalb genau das, was sie beitraegt: WER wird WOMIT und in WELCHER Reihenfolge gerufen, wer
// danach NICHT mehr, welches Objekt am Ende herauskommt und welcher Fehlercode.
//
// `verlauf` haelt Start UND Ende jedes Schrittes fest. Nur so faellt ein nicht abgewartetes
// `await` auf: Ohne es stuende '67:start' vor '34:ende'.
const zustand = vi.hoisted(() => ({
  verlauf: [] as string[],
  oeffnenAufrufe: [] as unknown[],
  q2Aufrufe: [] as unknown[],
  reconcileAufrufe: [] as Array<{ projektId: unknown; assets: unknown }>,
  oeffnen: null as unknown,
  q2: { ok: true, wert: undefined } as unknown,
  reconcile: { ok: true, wert: { entfernt: 0, markiert: 0, erledigt: 0, offen: 0 } } as unknown,
  /** Wirft statt zu antworten - fuer den Zweig "unerwartete Ausnahme". */
  q2Wirft: false,
  /** Die sichtbaren Stoerungsmeldungen (#65), seit dem 13.08.2026. */
  stoerungen: [] as string[],
}))

vi.mock('../../src/main/auftrags-manager/queue-ereignis', () => ({
  meldeQueueStoerung: (meldung: string) => {
    zustand.stoerungen.push(meldung)
  },
}))

vi.mock('../../src/main/project-store/oeffne-projekt', () => ({
  öffneProjekt: async (id: string) => {
    zustand.verlauf.push('34:start')
    zustand.oeffnenAufrufe.push(id)
    // Verzoegert ueber mehrere Ereignisrunden hinweg - ein Aufrufer, der die Zusage nicht
    // abwartet, startet Schritt 2 in dieser Luecke.
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('34:ende')
    return zustand.oeffnen
  },
}))

vi.mock('../../src/main/auftrags-manager/start-wiederherstellung', () => ({
  stelleBeiProjektOeffnungHer: async (projektId: string) => {
    zustand.verlauf.push('67:start')
    zustand.q2Aufrufe.push(projektId)
    if (zustand.q2Wirft) {
      throw new Error('Die Platte hat sich verabschiedet.')
    }
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('67:ende')
    return zustand.q2
  },
}))

vi.mock('../../src/main/media-service/reconcile', () => ({
  reconcile: async (projektId: string, assets: unknown) => {
    zustand.verlauf.push('91:start')
    zustand.reconcileAufrufe.push({ projektId, assets })
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('91:ende')
    return zustand.reconcile
  },
}))

const { oeffneProjektAblauf } = await import('../../src/main/ipc-gateway/projekt-oeffnen-ablauf')

function projektMit(assets: Asset[]): Project {
  return {
    id: 'p-1',
    name: 'Studio Nord',
    erstelltAm: '2026-08-13T10:00:00.000Z',
    geaendertAm: '2026-08-13T10:00:00.000Z',
    schemaVersion: 1,
    assets,
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }
}

function asset(id: string, dateiname: string): Asset {
  return {
    id,
    typ: 'video',
    dateiname,
    originalname: `${id}.mp4`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 10,
    importdatum: '2026-08-13T10:00:00.000Z',
    zustand: 'ok',
  }
}

/**
 * Die Signatur verlangt `string`; die Fehlertabelle des Issues nennt aber ausdruecklich "kein
 * String" als eigenen Fall. Der Main "validiert jede eingehende Nutzlast" (TK 9.1.1) - geprueft
 * wird das ueber diese Tuer.
 */
const ruf = oeffneProjektAblauf as unknown as (
  projektId: unknown,
) => ReturnType<typeof oeffneProjektAblauf>

const PROJEKT = projektMit([asset('a-1', 'aaa.mp4'), asset('a-2', 'bbb.png')])

beforeEach(() => {
  zustand.verlauf = []
  zustand.oeffnenAufrufe = []
  zustand.q2Aufrufe = []
  zustand.reconcileAufrufe = []
  zustand.oeffnen = { ok: true, wert: PROJEKT }
  zustand.q2 = { ok: true, wert: undefined }
  zustand.reconcile = { ok: true, wert: { entfernt: 0, markiert: 0, erledigt: 0, offen: 0 } }
  zustand.q2Wirft = false
  zustand.stoerungen = []
  // Der interne Vermerk geht in die Konsole des Hauptprozesses; im Testlauf wird er
  // abgefangen - teils, damit die Ausgabe lesbar bleibt, teils, weil ein Test ihn prueft.
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('oeffneProjektAblauf - Reihenfolge und Abwarten', () => {
  it('ruft #34, dann #67, dann #91 und wartet jeden Schritt ab', async () => {
    await oeffneProjektAblauf('p-1')

    expect(zustand.verlauf).toEqual([
      '34:start',
      '34:ende',
      '67:start',
      '67:ende',
      '91:start',
      '91:ende',
    ])
  })

  it('reicht dieselbe projektId an alle drei Schritte weiter und laedt genau einmal', async () => {
    await oeffneProjektAblauf('p-1')

    expect(zustand.oeffnenAufrufe).toEqual(['p-1'])
    expect(zustand.q2Aufrufe).toEqual(['p-1'])
    expect(zustand.reconcileAufrufe[0]?.projektId).toBe('p-1')
  })
})

describe('oeffneProjektAblauf - die Asset-Liste stammt aus Schritt 1', () => {
  it('gibt #91 GENAU das assets-Array des geladenen Projekts (keine Kopie)', async () => {
    await oeffneProjektAblauf('p-1')

    // Identitaetsvergleich: `markiereFehlende` (#89) bricht den ganzen Aufraeumlauf ab, sobald
    // die Liste nicht zum geoeffneten Projekt gehoert - deshalb muss sie DIESE sein.
    expect(zustand.reconcileAufrufe[0]?.assets).toBe(PROJEKT.assets)
  })

  it('liefert bei Erfolg GENAU das Project aus Schritt 1 zurueck', async () => {
    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      expect(ergebnis.wert).toBe(PROJEKT)
    }
  })

  it('nimmt die Liste aus DERSELBEN Rueckgabe - ein spaeter geliefertes Projekt gilt', async () => {
    // Zweites Projekt mit eigener Liste: Wuerde die Datei die Assets irgendwo anders herholen
    // (Halter, zweiter Ladevorgang), zeigte der Spion auf die falsche Liste.
    const anderes = projektMit([asset('a-9', 'zzz.mp4')])
    zustand.oeffnen = { ok: true, wert: anderes }

    const ergebnis = await oeffneProjektAblauf('p-2')

    expect(zustand.reconcileAufrufe[0]?.assets).toBe(anderes.assets)
    expect(ergebnis.ok && ergebnis.wert).toBe(anderes)
  })
})

describe('oeffneProjektAblauf - Schritt 1 scheitert', () => {
  it('startet Schritt 2 und 3 nicht und reicht Code und Meldung unveraendert durch', async () => {
    zustand.oeffnen = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Zu dieser Kennung gibt es keinen Projektordner.' },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(zustand.q2Aufrufe).toEqual([])
    expect(zustand.reconcileAufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('nicht_gefunden')
      expect(ergebnis.fehler.meldung).toBe('Zu dieser Kennung gibt es keinen Projektordner.')
    }
  })

  it('haelt speicher_fehler samt daten-Feld fest', async () => {
    zustand.oeffnen = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'project.json und .bak defekt.', daten: { x: 1 } },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('speicher_fehler')
      expect(ergebnis.fehler.daten).toEqual({ x: 1 })
    }
  })

  it('reicht schema_zu_neu unveraendert durch', async () => {
    // Dieser Test hielt bis zum 13.08.2026 einen VERLUST fest: Der Rueckgabetyp kannte
    // 'schema_zu_neu' nicht, der Code fiel auf 'unbekannter_fehler' und der Grund stand nur
    // noch im Meldungstext. Umgedreht statt geloescht - er bewacht jetzt die Zusage, von der
    // die Oberflaeche lebt: "Diese Datei stammt aus einer neueren App-Version" muss ein CODE
    // sein, auf den sie verzweigen kann, kein Satz, den sie durchsuchen muesste.
    zustand.oeffnen = {
      ok: false,
      fehler: { code: 'schema_zu_neu', meldung: 'Mit einer neueren App-Version erstellt.' },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('schema_zu_neu')
      expect(ergebnis.fehler.meldung).toBe('Mit einer neueren App-Version erstellt.')
    }
  })
})

describe('oeffneProjektAblauf - Schritt 2 scheitert', () => {
  it('startet Schritt 3 nicht, meldet ok:false und reicht speicher_fehler unveraendert durch', async () => {
    zustand.q2 = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'queue-retry.json ist unlesbar.' },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(zustand.reconcileAufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('speicher_fehler')
      expect(ergebnis.fehler.meldung).toBe('queue-retry.json ist unlesbar.')
    }
  })

  it('nimmt den Ladevorgang NICHT zurueck - kein zweiter Aufruf von #34', async () => {
    // Das Projekt bleibt geladen und im config-store aktiv (offener Punkt 2 des STOPP-Blocks).
    // Von aussen sichtbar ist davon genau eines: Diese Datei ruft nichts auf, um es
    // rueckgaengig zu machen, und laedt insbesondere nicht ein zweites Mal.
    zustand.q2 = { ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } }

    await oeffneProjektAblauf('p-1')

    expect(zustand.oeffnenAufrufe).toEqual(['p-1'])
  })
})

describe('oeffneProjektAblauf - Schritt 3 scheitert', () => {
  it('reicht datei_fehler unveraendert durch', async () => {
    zustand.reconcile = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Der Medienordner ist nicht lesbar.' },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('datei_fehler')
      expect(ergebnis.fehler.meldung).toBe('Der Medienordner ist nicht lesbar.')
    }
  })

  it('reicht kein_projekt unveraendert durch - kein unbekannter_fehler', async () => {
    zustand.reconcile = {
      ok: false,
      fehler: { code: 'kein_projekt', meldung: 'Es ist kein Projekt geoeffnet.' },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok && 'nie').toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('kein_projekt')
    }
  })
})

describe('oeffneProjektAblauf - die vier Zahlen aus Schritt 3', () => {
  it('erweitert die Nutzlast NICHT - herauskommt allein das Project', async () => {
    zustand.reconcile = {
      ok: true,
      wert: { entfernt: 3, markiert: 1, erledigt: 2, offen: 0 },
    }

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis).toEqual({ ok: true, wert: PROJEKT })
  })

  it('warnt intern, wenn vorgemerkte Loeschungen weiterhin offen sind', async () => {
    // "Verschlucke sie nicht": Ohne diese Zeile versuchte der Lauf es bei jedem Start erneut,
    // still und fuer immer.
    zustand.reconcile = { ok: true, wert: { entfernt: 0, markiert: 0, erledigt: 1, offen: 2 } }

    await oeffneProjektAblauf('p-1')

    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('2 weiterhin offen')
  })

  it('vermerkt ohne Warnung, wenn nichts offen geblieben ist', async () => {
    await oeffneProjektAblauf('p-1')

    expect(console.warn).not.toHaveBeenCalled()
    expect(console.info).toHaveBeenCalledTimes(1)
  })
})

describe('oeffneProjektAblauf - haengende Loeschungen werden SICHTBAR', () => {
  // Entschieden am 13.08.2026: "Nur zeigen, wenn etwas haengt." Die drei anderen Zahlen
  // bleiben Diagnose; `offen` nicht - diese Loeschungen wurden schon einmal verlangt, sind
  // schon einmal gescheitert und werden bei JEDEM Start still erneut versucht.
  it('meldet eine Stoerung, sobald offen groesser als null ist', async () => {
    zustand.reconcile = { ok: true, wert: { entfernt: 0, markiert: 0, erledigt: 1, offen: 2 } }

    await oeffneProjektAblauf('p-1')

    expect(zustand.stoerungen).toHaveLength(1)
    expect(zustand.stoerungen[0]).toContain('2')
    // Der Nutzer muss erfahren, dass es von selbst weitergeht - sonst sucht er nach einer
    // Handlung, die es nicht gibt.
    expect(zustand.stoerungen[0]).toContain('erneut versucht')
  })

  it('schweigt im Regelfall - auch wenn aufgeraeumt wurde', async () => {
    // Gegenprobe: Ohne sie liesse sich der Meldeweg auch dann fuer erfuellt halten, wenn er
    // bei JEDEM Projektoeffnen feuerte. Genau das war die verworfene Alternative.
    zustand.reconcile = { ok: true, wert: { entfernt: 3, markiert: 2, erledigt: 1, offen: 0 } }

    await oeffneProjektAblauf('p-1')

    expect(zustand.stoerungen).toEqual([])
  })

  it('meldet nichts, wenn der Aufraeumlauf selbst gescheitert ist', async () => {
    // Dann gibt es keine Zahlen - eine Meldung "0 Loeschungen haengen" waere erfunden.
    zustand.reconcile = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Der Medienordner ist nicht lesbar.' },
    }

    await oeffneProjektAblauf('p-1')

    expect(zustand.stoerungen).toEqual([])
  })
})

describe('oeffneProjektAblauf - Eingangspruefung und Ausnahmen', () => {
  it.each([
    ['leer', ''],
    ['nur Leerzeichen', '   '],
    ['Elternverzeichnis', '../x'],
    ['Schraegstrich', 'a/b'],
    ['Rueckwaerts-Schraegstrich', 'a\\b'],
    ['kein String', 42],
  ])('weist %s mit ungueltige_eingabe ab, ohne einen Schritt zu starten', async (_name, wert) => {
    const ergebnis = await ruf(wert)

    expect(zustand.oeffnenAufrufe).toEqual([])
    expect(zustand.q2Aufrufe).toEqual([])
    expect(zustand.reconcileAufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
  })

  it('faengt eine Ausnahme aus einem Schritt und meldet unbekannter_fehler', async () => {
    zustand.q2Wirft = true

    const ergebnis = await oeffneProjektAblauf('p-1')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
      expect(ergebnis.fehler.meldung).toContain('Die Platte hat sich verabschiedet.')
    }
  })
})

describe('oeffneProjektAblauf - der Rueckgabetyp traegt beide Unionen', () => {
  it('laesst die fachlichen und generischen Codes zu, einen fremden nicht', async () => {
    const ergebnis = await oeffneProjektAblauf('p-1')
    if (ergebnis.ok) {
      expect(ergebnis.wert).toBe(PROJEKT)
      return
    }

    // Zulaessig: beide fremden Unionen plus die drei generischen Codes.
    const erlaubt: typeof ergebnis.fehler.code = 'speicher_fehler'
    const erlaubt2: typeof ergebnis.fehler.code = 'datei_fehler'
    const erlaubt3: typeof ergebnis.fehler.code = 'projekt_beschaeftigt'
    const erlaubt4: typeof ergebnis.fehler.code = 'kein_projekt'
    const erlaubt5: typeof ergebnis.fehler.code = 'nicht_gefunden'
    const erlaubt6: typeof ergebnis.fehler.code = 'ungueltige_eingabe'
    // @ts-expect-error 'probe_fehler' gehoert zu ImportFehlercode und hat hier nichts zu suchen.
    const verboten: typeof ergebnis.fehler.code = 'probe_fehler'

    expect([erlaubt, erlaubt2, erlaubt3, erlaubt4, erlaubt5, erlaubt6, verboten]).toHaveLength(7)
  })
})
