import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Vorlage, Vorlagennutzung, VorlagenReferenz } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #107 (löscheVorlage).
//
// Gemockt sind die zwei Nachbarn mit Dateizugriff - `schreibe-vorlagen` (#98) zoege ueber
// ermittleDatenOrt() zum Testzeitpunkt `electron` herein und fasste die ECHTE vorlagen.json an,
// `referenzpruefung` (#106) laese echte project.json-Dateien. `verwaiste-arbeitskopien` (#108)
// bleibt ECHT und wird nur belauscht (Spy): Dass bei einem Erfolg "gelöst, nicht gelöscht" wird,
// ist die Aussage von #108, die #107 in seinen einen Schreibvorgang einbindet.
const zustand = vi.hoisted(() => ({
  bestand: [] as Vorlage[],
  /** Bestand, den die Attrappe von aendereBestand statt `bestand` an die Aenderungsfunktion gibt. */
  aenderungsBestand: null as Vorlage[] | null,
  ladeAufrufe: 0,
  ladeFehler: null as string | null,
  pruefAufrufe: 0,
  pruefArgumente: [] as string[],
  pruefFehler: null as string | null,
  nutzung: { ok: true, wert: { aktionen: [], listenelemente: [] } } as
    | { ok: true; wert: Vorlagennutzung }
    | { ok: false; fehler: { code: string; meldung: string } },
  schreibVersuche: 0,
  schreibarten: [] as string[],
  schreibFehler: null as string | null,
  aenderungsfunktion: null as
    | ((bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: unknown }, string>)
    | null,
  loesungen: [] as string[],
}))

vi.mock('../../src/main/vorlagen-store/schreibe-vorlagen', () => ({
  ladeBestand: async (): Promise<Ergebnis<Vorlage[], string>> => {
    zustand.ladeAufrufe += 1
    if (zustand.ladeFehler !== null) {
      return { ok: false, fehler: { code: zustand.ladeFehler, meldung: 'Attrappe' } }
    }
    return { ok: true, wert: structuredClone(zustand.bestand) }
  },
  aendereBestand: async <T,>(
    aenderung: (bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: T }, string>,
    schreibart: string,
  ): Promise<Ergebnis<T, string>> => {
    zustand.schreibVersuche += 1
    zustand.schreibarten.push(schreibart)
    zustand.aenderungsfunktion = aenderung as (
      bestand: Vorlage[],
    ) => Ergebnis<{ bestand: Vorlage[]; wert: unknown }, string>
    if (zustand.schreibFehler !== null) {
      return { ok: false, fehler: { code: zustand.schreibFehler, meldung: 'Attrappe' } }
    }
    const quelle =
      zustand.aenderungsBestand === null ? zustand.bestand : zustand.aenderungsBestand
    const ergebnis = aenderung(structuredClone(quelle))
    if (!ergebnis.ok) {
      return ergebnis
    }
    zustand.bestand = ergebnis.wert.bestand
    return { ok: true, wert: ergebnis.wert.wert }
  },
}))

vi.mock('../../src/main/vorlagen-store/referenzpruefung', () => ({
  pruefeVorlagenReferenzen: async (
    vorlagenId: string,
  ): Promise<Ergebnis<Vorlagennutzung, string>> => {
    zustand.pruefAufrufe += 1
    zustand.pruefArgumente.push(vorlagenId)
    if (zustand.pruefFehler !== null) {
      return { ok: false, fehler: { code: zustand.pruefFehler, meldung: 'Attrappe' } }
    }
    const vorbereitet = zustand.nutzung
    if (!vorbereitet.ok) {
      return vorbereitet
    }
    return { ok: true, wert: structuredClone(vorbereitet.wert) }
  },
}))

// Echte Umformung, aber belauscht: Der Spy weist nach, dass sie mit der zu loeschenden ID
// aufgerufen wurde (DoD) - und trotzdem liefert die echte Implementierung das Nullen.
vi.mock('../../src/main/vorlagen-store/verwaiste-arbeitskopien', async (originalImportieren) => {
  const echt =
    await originalImportieren<typeof import('../../src/main/vorlagen-store/verwaiste-arbeitskopien')>()
  return {
    löseArbeitskopienVomParent: (bestand: Vorlage[], parentId: string) => {
      zustand.loesungen.push(parentId)
      return echt.löseArbeitskopienVomParent(bestand, parentId)
    },
  }
})

const { löscheVorlage } = await import('../../src/main/vorlagen-store/loesche-vorlage')

beforeEach(() => {
  zustand.bestand = []
  zustand.aenderungsBestand = null
  zustand.ladeAufrufe = 0
  zustand.ladeFehler = null
  zustand.pruefAufrufe = 0
  zustand.pruefArgumente.length = 0
  zustand.pruefFehler = null
  zustand.nutzung = { ok: true, wert: { aktionen: [], listenelemente: [] } }
  zustand.schreibVersuche = 0
  zustand.schreibarten = []
  zustand.schreibFehler = null
  zustand.aenderungsfunktion = null
  zustand.loesungen.length = 0
})

function referenz(id: string, projektId = `projekt-${id}`): VorlagenReferenz {
  return { projektId, projektName: `Projekt ${projektId}`, id }
}

function vorlage(id: string, teil: Partial<Vorlage> = {}): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [],
    ...teil,
  }
}

/** Besteht auf einem Fehlerergebnis und gibt dessen Fehler zurueck. */
async function fehlschlag(id: unknown) {
  const ergebnis = await löscheVorlage(id as string)
  if (ergebnis.ok) {
    throw new Error(`erwartet: Fehler, erhalten: ok:true`)
  }
  return ergebnis.fehler
}

/** Besteht auf einem Erfolg. */
async function erfolg(id: string) {
  const ergebnis = await löscheVorlage(id)
  if (!ergebnis.ok) {
    throw new Error(`unerwartet fehlgeschlagen: ${ergebnis.fehler.code} ${ergebnis.fehler.meldung}`)
  }
  return ergebnis
}

describe('löscheVorlage – Erfolgslauf', () => {
  it('entfernt die Vorlage und laesst die uebrigen Eintraege unveraendert und in Reihenfolge', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('v2'), vorlage('v3')]

    await erfolg('v2')

    expect(zustand.bestand.map((v) => v.id)).toEqual(['v1', 'v3'])
    expect(zustand.bestand[0]).toEqual(vorlage('v1'))
    expect(zustand.bestand[1]).toEqual(vorlage('v3'))
  })

  it('liefert genau { ok: true, wert: undefined }', async () => {
    zustand.bestand = [vorlage('v1')]

    const ergebnis = await erfolg('v1')

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('nullt den parent der Arbeitskopien und loescht sie nicht - #108 wird als Spy gerufen', async () => {
    const kopie = vorlage('kopie', { parent: 'v1' })
    zustand.bestand = [vorlage('v1'), kopie, vorlage('andere')]

    await erfolg('v1')

    expect(zustand.bestand.map((v) => v.id)).toEqual(['kopie', 'andere'])
    expect(zustand.bestand[0]?.parent).toBeNull()
    expect(zustand.loesungen).toEqual(['v1'])
  })

  it('ruft aendereBestand genau einmal mit schreibart "sofort" auf', async () => {
    zustand.bestand = [vorlage('v1')]

    await erfolg('v1')

    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.schreibarten).toEqual(['sofort'])
  })
})

describe('löscheVorlage – Sperre durch Treffer', () => {
  const trefferFaelle: Array<[string, Vorlagennutzung]> = [
    ['ueber aktionen', { aktionen: [referenz('a-1')], listenelemente: [] }],
    ['ueber listenelemente (Band-Vorlage)', { aktionen: [], listenelemente: [referenz('el-9')] }],
  ]
  it.each(trefferFaelle)(
    'blockiert %s mit vorlage_referenziert und schreibt nachweislich nicht',
    async (_weg, treffer) => {
      zustand.bestand = [vorlage('v1'), vorlage('v2')]
      zustand.nutzung = { ok: true, wert: structuredClone(treffer) }

      const fehler = await fehlschlag('v1')

      expect(fehler.code).toBe('vorlage_referenziert')
      expect(zustand.schreibVersuche).toBe(0)
      expect(zustand.loesungen).toEqual([])
    },
  )

  it('traegt daten mit BEIDEN Schluesseln - auch die leere - deep-gleich zum Pruefergebnis', async () => {
    const treffer: Vorlagennutzung = { aktionen: [referenz('a-1')], listenelemente: [] }
    zustand.bestand = [vorlage('v1')]
    zustand.nutzung = { ok: true, wert: structuredClone(treffer) }

    const fehler = await fehlschlag('v1')

    expect(fehler.code).toBe('vorlage_referenziert')
    expect(fehler.daten).toEqual(treffer)
    const daten = fehler.daten as Vorlagennutzung
    expect(daten.aktionen).toEqual(treffer.aktionen)
    expect(daten.listenelemente).toEqual([])
  })

  it('schreibt die Treffer-IDs nicht in die Meldung - sie gehoeren in daten', async () => {
    zustand.bestand = [vorlage('v1')]
    zustand.nutzung = {
      ok: true,
      wert: { aktionen: [referenz('treffer-xyz')], listenelemente: [referenz('element-abc')] },
    }

    const fehler = await fehlschlag('v1')

    expect(fehler.meldung).not.toContain('treffer-xyz')
    expect(fehler.meldung).not.toContain('element-abc')
  })
})

describe('löscheVorlage – Fehler der Referenzpruefung', () => {
  it('reicht speicher_fehler unveraendert durch und schreibt nichts - "konnte nicht pruefen" ist nie "unbenutzt"', async () => {
    zustand.bestand = [vorlage('v1')]
    zustand.pruefFehler = 'speicher_fehler'

    const fehler = await fehlschlag('v1')

    expect(fehler.code).toBe('speicher_fehler')
    expect(zustand.schreibVersuche).toBe(0)
    expect(zustand.loesungen).toEqual([])
  })
})

describe('löscheVorlage – unzulaessige IDs', () => {
  it('lehnt eine eingebaute Vorlage ab - ohne Pruefung und ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('vollbild', { eingebaut: true })]

    const fehler = await fehlschlag('vollbild')

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.pruefAufrufe).toBe(0)
    expect(zustand.schreibVersuche).toBe(0)
  })

  it('lehnt eine Arbeitskopie (parent !== null) ab - ohne Pruefung und ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('kopie', { parent: 'v1' })]

    const fehler = await fehlschlag('kopie')

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.pruefAufrufe).toBe(0)
    expect(zustand.schreibVersuche).toBe(0)
    expect(zustand.loesungen).toEqual([])
  })

  it('liefert fuer eine unbekannte id nicht_gefunden - ohne Pruefung und ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('v1')]

    const fehler = await fehlschlag('unbekannt')

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.pruefAufrufe).toBe(0)
    expect(zustand.schreibVersuche).toBe(0)
  })

  it.each([
    ['leere id', ''],
    ['Nicht-String', 42],
  ])('lehnt %s mit ungueltige_eingabe ab und ruft ladeBestand nachweislich nicht', async (_beschreibung, id) => {
    const fehler = await fehlschlag(id)

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.ladeAufrufe).toBe(0)
  })

  it("scheitert bei 'band-standard' (nur) an eingebaut, nicht an der Nicht-UUID-Form", async () => {
    zustand.bestand = [vorlage('band-standard', { eingebaut: true })]

    const fehler = await fehlschlag('band-standard')

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(fehler.meldung.toLowerCase()).toContain('eingebaut')
  })
})

describe('löscheVorlage – Schreiben: zweite Vorpruefung und Schreibfehler', () => {
  it('ist der Eintrag im Bestand der Aenderungsfunktion nicht mehr vorhanden, ergibt nicht_gefunden und nichts wird geschrieben', async () => {
    zustand.bestand = [vorlage('v1')]
    zustand.aenderungsBestand = []

    const fehler = await fehlschlag('v1')

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.bestand).toEqual([vorlage('v1')])
  })

  it('reicht speicher_fehler des Schreibens unveraendert durch', async () => {
    zustand.bestand = [vorlage('v1')]
    zustand.schreibFehler = 'speicher_fehler'

    const fehler = await fehlschlag('v1')

    expect(fehler.code).toBe('speicher_fehler')
    expect(zustand.schreibVersuche).toBe(1)
  })
})

describe('löscheVorlage – die Aenderungsfunktion ist synchron', () => {
  it('ihr Rueckgabewert ist kein Promise', async () => {
    zustand.bestand = [vorlage('v1')]
    await erfolg('v1')

    const aenderung = zustand.aenderungsfunktion
    expect(typeof aenderung).toBe('function')
    if (aenderung === null) {
      throw new Error('aendereBestand-Attrappe hat keine Aenderungsfunktion bekommen')
    }
    const ergebnis = aenderung(structuredClone(zustand.bestand)) as { then?: unknown }

    expect(ergebnis instanceof Promise).toBe(false)
    expect(ergebnis.then).toBeUndefined()
  })
})

describe('loesche-vorlage.ts – was die Datei nicht anfasst', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/vorlagen-store/loesche-vorlage.ts',
    ),
    'utf8',
  )

  it('hat die eslint-Abschaltzeile aus Zeile 1 nicht mehr', () => {
    expect(quelle).not.toContain('eslint-disable')
  })

  it.each(['node:fs', 'node:fs/promises', 'ipcMain', 'BrowserWindow', 'mitD1Lock'])(
    'enthaelt %s nicht',
    (verboten) => {
      expect(quelle).not.toContain(verboten)
    },
  )

  it('greift nicht auf project.json zu', () => {
    expect(quelle).not.toContain('project.json')
  })

  it("enthaelt kein String-Literal 'vorlagen:'", () => {
    expect(quelle).not.toMatch(/'vorlagen:'/)
  })

  it('die Aenderungsfunktion enthaelt kein await (Quelltext ab dem aendereBestand-Aufruf)', () => {
    const ab = quelle.indexOf('return aendereBestand')
    expect(ab).toBeGreaterThan(-1)
    const rumpf = quelle.slice(ab)
    expect(rumpf).not.toMatch(/\bawait\b/)
  })
})