import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #105 (verwerfeArbeitskopie).
//
// Gemockt ist ausschliesslich `schreibe-vorlagen` (#98): Die Attrappe zaehlt die Aufrufe,
// prueft die Schreibart, fuehrt die Aenderungsfunktion auf einer tiefen Kopie aus und
// uebernimmt deren `bestand` NUR bei ok:true - exakt der Vertrag von #98 ("liefert die
// Aenderungsfunktion ok:false, wird NICHTS geschrieben"). Damit sind die DoD-Aussagen
// ("aendereBestand wird genau einmal gerufen", "bei Fehler wird nichts geschrieben")
// belegbar, ohne die ECHTE vorlagen.json anzufassen - die zoege ueber ermittleDatenOrt()
// zum Testzeitpunkt `electron` herein.
const zustand = vi.hoisted(() => ({
  bestand: [] as Vorlage[],
  /** Bestand, den die Attrappe von aendereBestand statt `bestand` an die Aenderungsfunktion gibt. */
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

const { verwerfeArbeitskopie } = await import('../../src/main/vorlagen-store/verwerfe-arbeitskopie')

beforeEach(() => {
  zustand.bestand = []
  zustand.aenderungsBestand = null
  zustand.schreibVersuche = 0
  zustand.schreibarten = []
  zustand.schreibFehler = null
  zustand.aenderungsfunktion = null
})

/** Eine Zone mit verschachteltem Inhalt, damit Deep-Vergleiche wirklich greifen. */
function zone(id: string) {
  return {
    id,
    rolle: 'frei' as const,
    bindung: 'titel' as const,
    rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
    ausrichtung: { horizontal: 'links' as const, vertikal: 'oben' as const },
    wennLeer: 'leer' as const,
    text: {
      schriftRolle: 'fliesstext' as const,
      farbRolle: 'textAufHell' as const,
      größeMax: 64,
      größeMin: 32,
      maxZeilen: 3,
    },
  }
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

/** Besteht auf einem Erfolgsergebnis und gibt es zurueck. */
async function erfolg(id: string) {
  const ergebnis = await verwerfeArbeitskopie(id)
  if (!ergebnis.ok) {
    throw new Error(`unerwartet fehlgeschlagen: ${ergebnis.fehler.code} ${ergebnis.fehler.meldung}`)
  }
  return ergebnis
}

/** Besteht auf einem Fehlerergebnis und gibt dessen Fehler zurueck. */
async function fehlschlag(id: unknown) {
  const ergebnis = await verwerfeArbeitskopie(id as string)
  if (ergebnis.ok) {
    throw new Error(`erwartet: Fehler, erhalten: ok:true`)
  }
  return ergebnis.fehler
}

describe('verwerfeArbeitskopie – Erfolgslauf', () => {
  it('entfernt GENAU den Eintrag mit id === arbeitsId; die uebrigen Eintraege bleiben unveraendert und in Reihenfolge', async () => {
    const parent = vorlage('parent-1', { zonen: [zone('hintergrund')] })
    const kopie = vorlage('kopie', { parent: 'parent-1', zonen: [zone('motiv')] })
    const andere = vorlage('andere', { zonen: [zone('logo')] })
    zustand.bestand = [parent, kopie, andere]

    await erfolg('kopie')

    // Deep-Vergleich des ganzen Arrays: genau ein Eintrag weniger, Reihenfolge und Inhalt sonst
    // unveraendert - auch die verschachtelten Zonen.
    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'andere'])
    expect(zustand.bestand[0]).toEqual(parent)
    expect(zustand.bestand[1]).toEqual(andere)
  })

  it('liefert genau { ok: true, wert: undefined }', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const ergebnis = await erfolg('kopie')

    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('der Parent-Eintrag ist danach byte-gleich wie vorher (Deep-Vergleich)', async () => {
    const parent = vorlage('parent-1', { zonen: [zone('hintergrund')], art: 'split', höhe: 162 })
    const kopie = vorlage('kopie', { parent: 'parent-1' })
    zustand.bestand = [parent, kopie]

    await erfolg('kopie')

    expect(zustand.bestand).toHaveLength(1)
    expect(zustand.bestand[0]).toEqual(parent)
  })

  it('eine zweite Arbeitskopie desselben Parents bleibt im Bestand stehen', async () => {
    zustand.bestand = [
      vorlage('parent-1'),
      vorlage('kopie-a', { parent: 'parent-1' }),
      vorlage('kopie-b', { parent: 'parent-1' }),
    ]

    await erfolg('kopie-a')

    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie-b'])
    expect(zustand.bestand[1]).toEqual(vorlage('kopie-b', { parent: 'parent-1' }))
  })

  it('ruft aendereBestand genau einmal mit schreibart "sofort" auf', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    await erfolg('kopie')

    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.schreibarten).toEqual(['sofort'])
  })
})

describe('verwerfeArbeitskopie – Fehlerpfade', () => {
  it('lehnt einen Eintrag mit parent === null ab - auch wenn er eingebaut: false traegt - und schreibt nachweislich nichts', async () => {
    const nutzbar = vorlage('nutzbar', { eingebaut: false })
    const andere = vorlage('andere')
    zustand.bestand = [nutzbar, andere]

    const fehler = await fehlschlag('nutzbar')

    expect(fehler.code).toBe('ungueltige_eingabe')
    // Die Aenderungsfunktion lief (schreibVersuche = 1), meldete aber ok:false - die Attrappe
    // schreibt dann NICHTS, genau wie #98. Der Eintrag steht unveraendert weiter im Bestand.
    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['nutzbar', 'andere'])
    expect(zustand.bestand[0]).toEqual(vorlage('nutzbar', { eingebaut: false }))
  })

  it('die Aenderungsfunktion liefert bei parent === null selbst ok:false', async () => {
    zustand.bestand = [vorlage('nutzbar')]

    await fehlschlag('nutzbar')

    const aenderung = zustand.aenderungsfunktion
    if (aenderung === null) {
      throw new Error('aendereBestand-Attrappe hat keine Aenderungsfunktion bekommen')
    }
    const ergebnis = aenderung(structuredClone(zustand.bestand))
    if (ergebnis.ok) {
      throw new Error('erwartet: Fehler, erhalten: ok:true')
    }
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('liefert fuer eine unbekannte arbeitsId nicht_gefunden ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag('unbekannt')

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie'])
  })

  it.each([
    ['leere ID', ''],
    ['Nicht-String', 42],
  ])('lehnt %s mit ungueltige_eingabe ab und ruft aendereBestand nachweislich NICHT (Spy: null Aufrufe)', async (_beschreibung, id) => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag(id)

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.schreibVersuche).toBe(0)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie'])
  })

  it('reicht speicher_fehler von aendereBestand unveraendert durch', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]
    zustand.schreibFehler = 'speicher_fehler'

    const fehler = await fehlschlag('kopie')

    expect(fehler.code).toBe('speicher_fehler')
    expect(zustand.schreibVersuche).toBe(1)
    // Die Aenderungsfunktion lief gar nicht erst - #98 kann den Bestand nicht laden/schreiben.
    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie'])
  })

  it('ist der Eintrag im Bestand der Aenderungsfunktion nicht mehr vorhanden, ergibt nicht_gefunden und nichts wird geschrieben', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]
    zustand.aenderungsBestand = [vorlage('parent-1')]

    const fehler = await fehlschlag('kopie')

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.bestand).toEqual([vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })])
  })
})

describe('verwerfeArbeitskopie – die Aenderungsfunktion ist synchron', () => {
  it('ihr Rueckgabewert ist kein Promise', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    await erfolg('kopie')

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

describe('verwerfe-arbeitskopie.ts – was die Datei nicht anfasst', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/vorlagen-store/verwerfe-arbeitskopie.ts',
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
