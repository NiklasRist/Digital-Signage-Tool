import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #104 (alsEigenstaendige).
//
// Gemockt ist der eine Nachbar mit Dateizugriff – `schreibe-vorlagen` (#98) zoege ueber
// ermittleDatenOrt() zum Testzeitpunkt `electron` herein und fasste die ECHTE vorlagen.json an.
// Die Attrappe zaehlt Aufrufe und Schreibart (DoD: "genau einmal, mit schreibart === 'sofort'"
// bzw. "nachweislich nicht aufgerufen") und wendet die Aenderungsfunktion auf eine tiefe Kopie
// des Zustands an – wie der echte #98, dessen Zusage darin besteht, dass eine `ok: false`
// liefernde Aenderungsfunktion NICHTS schreibt.
const zustand = vi.hoisted(() => ({
  bestand: [] as Vorlage[],
  /** Bestand, den die Attrappe von aendereBestand an die Aenderungsfunktion gibt. */
  aenderungsBestand: null as Vorlage[] | null,
  schreibVersuche: 0,
  schreibarten: [] as string[],
  schreibFehler: null as string | null,
  aenderungsfunktion: null as
    | ((bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: unknown }, string>)
    | null,
}))

vi.mock('../../src/main/vorlagen-store/schreibe-vorlagen', () => ({
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
    const quelle = zustand.aenderungsBestand === null ? zustand.bestand : zustand.aenderungsBestand
    const ergebnis = aenderung(structuredClone(quelle))
    if (!ergebnis.ok) {
      return ergebnis
    }
    zustand.bestand = ergebnis.wert.bestand
    return { ok: true, wert: ergebnis.wert.wert }
  },
}))

const { alsEigenstaendige } = await import('../../src/main/vorlagen-store/als-eigenstaendige')

beforeEach(() => {
  zustand.bestand = []
  zustand.aenderungsBestand = null
  zustand.schreibVersuche = 0
  zustand.schreibarten = []
  zustand.schreibFehler = null
  zustand.aenderungsfunktion = null
})

function vorlage(id: string, teil: Partial<Vorlage> = {}): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [
      {
        id: `${id}-zone`,
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
      },
    ],
    ...teil,
  }
}

/** Besteht auf einem Fehlerergebnis und gibt dessen Fehler zurueck. */
async function fehlschlag(arbeitsId: unknown, name: unknown = 'Neuer Name') {
  const ergebnis = await alsEigenstaendige(arbeitsId as string, name as string)
  if (ergebnis.ok) {
    throw new Error(`erwartet: Fehler, erhalten: ok:true`)
  }
  return ergebnis.fehler
}

/** Besteht auf einem Erfolg. */
async function erfolg(arbeitsId: string, name = 'Neuer Name') {
  const ergebnis = await alsEigenstaendige(arbeitsId, name)
  if (!ergebnis.ok) {
    throw new Error(`unerwartet fehlgeschlagen: ${ergebnis.fehler.code} ${ergebnis.fehler.meldung}`)
  }
  return ergebnis
}

describe('alsEigenstaendige (#104) – Erfolgsfall', () => {
  it('nullt parent, setzt eingebaut false, uebernimmt den getrimmten Namen und behaelt id, art, höhe und zonen (Deep-Vergleich)', async () => {
    const kopie = vorlage('kopie', {
      parent: 'v1',
      art: 'split',
      höhe: 162,
      name: '  Arbeitskopie von v1  ',
      zonen: [
        {
          id: 'z1',
          rolle: 'frei',
          bindung: 'titel',
          rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
          ausrichtung: { horizontal: 'links', vertikal: 'oben' },
          wennLeer: 'leer',
        },
        {
          id: 'z2',
          rolle: 'fest',
          bindung: 'logo',
          rahmen: { x: 10, y: 20, breite: 300, höhe: 100 },
          ausrichtung: { horizontal: 'rechts', vertikal: 'mitte' },
          wennLeer: 'ausblenden',
        },
      ],
    })
    zustand.bestand = [vorlage('v1'), kopie]

    const ergebnis = await erfolg('kopie', '  Meine Vorlage  ')

    expect(ergebnis.wert.id).toBe('kopie')
    expect(ergebnis.wert.parent).toBeNull()
    expect(ergebnis.wert.eingebaut).toBe(false)
    expect(ergebnis.wert.name).toBe('Meine Vorlage')
    expect(ergebnis.wert.art).toBe('split')
    expect(ergebnis.wert.höhe).toBe(162)
    // Deep-Vergleich der Zonen: unveraendert, inhaltsgleich.
    expect(ergebnis.wert.zonen).toEqual(kopie.zonen)
  })

  it('der Bestand hat dieselbe Laenge, und der Eintrag steht an derselben Position (ganzes Array verglichen)', async () => {
    const kopie = vorlage('kopie', { parent: 'v1' })
    zustand.bestand = [vorlage('a'), kopie, vorlage('c')]

    await erfolg('kopie', 'Neu')

    expect(zustand.bestand).toHaveLength(3)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['a', 'kopie', 'c'])
    expect(zustand.bestand[1]?.parent).toBeNull()
    expect(zustand.bestand[1]?.name).toBe('Neu')
  })

  it('der Parent-Eintrag ist danach byte-gleich (Deep-Vergleich) – unveraendert in name, zonen, eingebaut und parent', async () => {
    const parent = vorlage('v1', {
      name: 'Original-Name',
      art: 'split',
      höhe: 162,
      eingebaut: true,
      parent: null,
    })
    const kopie = vorlage('kopie', { parent: 'v1' })
    zustand.bestand = [parent, kopie]
    const vorher = JSON.stringify(parent)

    await erfolg('kopie', 'Neu')

    expect(JSON.stringify(zustand.bestand[0])).toBe(vorher)
    expect(zustand.bestand[0]).toEqual(parent)
  })

  it('eine Arbeitskopie eines EINGEBAUTEN Parents wird erfolgreich eigenstaendig – der eingebaute Parent bleibt unveraendert im Bestand', async () => {
    const eingebaut = vorlage('vollbild', { name: 'Vollbild', eingebaut: true })
    const kopie = vorlage('kopie-vollbild', { parent: 'vollbild', name: 'Vollbild-Kopie' })
    zustand.bestand = [eingebaut, kopie]

    const ergebnis = await erfolg('kopie-vollbild', 'Eigene Vollbild-Vorlage')

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.wert.parent).toBeNull()
    expect(zustand.bestand).toHaveLength(2)
    expect(zustand.bestand[0]).toEqual(eingebaut)
  })

  it('ruft aendereBestand genau einmal mit schreibart "sofort" auf (Spy)', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]

    await erfolg('kopie', 'Neu')

    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.schreibarten).toEqual(['sofort'])
  })
})

describe('alsEigenstaendige (#104) – Namensregeln', () => {
  it('ein Name mit fuehrenden und abschliessenden Leerzeichen steht getrimmt im Eintrag', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]

    const ergebnis = await erfolg('kopie', '   Mitte   ')

    expect(ergebnis.wert.name).toBe('Mitte')
    expect(zustand.bestand[1]?.name).toBe('Mitte')
  })

  it.each([
    ['leerer Name', ''],
    ['nur Leerzeichen', '   '],
    ['81 Zeichen', 'a'.repeat(81)],
    ['kein String', 42],
  ])(
    'lehnt %s mit ungueltige_eingabe ab – aendereBestand wurde nachweislich nicht aufgerufen (0 Aufrufe)',
    async (_beschreibung, name) => {
      zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]

      const fehler = await fehlschlag('kopie', name)

      expect(fehler.code).toBe('ungueltige_eingabe')
      expect(zustand.schreibVersuche).toBe(0)
      expect(zustand.bestand).toHaveLength(2)
      expect(zustand.bestand[1]?.name).toBe('Name kopie')
    },
  )

  it('ein Name mit 80 Zeichen ist zulaessig', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]

    const ergebnis = await erfolg('kopie', 'x'.repeat(80))

    expect(ergebnis.ok).toBe(true)
  })
})

describe('alsEigenstaendige (#104) – arbeitsId-Regeln', () => {
  it.each([
    ['leere arbeitsId', ''],
    ['kein String', 42],
  ])(
    'lehnt %s mit ungueltige_eingabe ab – aendereBestand wurde nachweislich nicht aufgerufen (0 Aufrufe)',
    async (_beschreibung, arbeitsId) => {
      zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]

      const fehler = await fehlschlag(arbeitsId)

      expect(fehler.code).toBe('ungueltige_eingabe')
      expect(zustand.schreibVersuche).toBe(0)
      expect(zustand.bestand).toHaveLength(2)
    },
  )

  it('eine arbeitsId auf einen Eintrag mit parent === null liefert ungueltige_eingabe und benennt nichts um (Bestand unveraendert)', async () => {
    const eigenstaendig = vorlage('eigen', { name: 'Bleibt' })
    const andere = vorlage('andere')
    zustand.bestand = [eigenstaendig, andere]

    const fehler = await fehlschlag('eigen', 'Umbenennen')

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.bestand).toEqual([eigenstaendig, andere])
  })

  it('eine unbekannte arbeitsId liefert nicht_gefunden ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('v1')]

    const fehler = await fehlschlag('unbekannt', 'Neu')

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.bestand).toEqual([vorlage('v1')])
  })

  it('eine Arbeitskopie, deren parent auf eine nicht mehr vorhandene ID zeigt, wird trotzdem erfolgreich eigenstaendig', async () => {
    const verwaist = vorlage('kopie', { parent: 'weg' })
    zustand.bestand = [verwaist]

    const ergebnis = await erfolg('kopie', 'Neu')

    expect(ergebnis.ok).toBe(true)
    expect(ergebnis.wert.parent).toBeNull()
    expect(zustand.bestand).toHaveLength(1)
  })
})

describe('alsEigenstaendige (#104) – Schreibfehler', () => {
  it('reicht speicher_fehler von aendereBestand unveraendert durch', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]
    zustand.schreibFehler = 'speicher_fehler'

    const fehler = await fehlschlag('kopie', 'Neu')

    expect(fehler.code).toBe('speicher_fehler')
    expect(zustand.schreibVersuche).toBe(1)
  })
})

describe('alsEigenstaendige (#104) – die Aenderungsfunktion ist synchron', () => {
  it('ihr Rueckgabewert ist kein Promise', async () => {
    zustand.bestand = [vorlage('v1'), vorlage('kopie', { parent: 'v1' })]
    await erfolg('kopie', 'Neu')

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

describe('als-eigenstaendige.ts – was die Datei nicht anfasst', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/vorlagen-store/als-eigenstaendige.ts',
    ),
    'utf8',
  )

  it('hat die eslint-Abschaltzeile aus Zeile 1 nicht mehr', () => {
    expect(quelle).not.toContain('eslint-disable')
  })

  it.each(['node:fs', 'node:fs/promises', 'ipcMain', 'BrowserWindow', 'erzeugeId', 'mitD1Lock'])(
    'enthaelt %s nicht',
    (verboten) => {
      expect(quelle).not.toContain(verboten)
    },
  )

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
