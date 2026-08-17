import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

// Verhaltenstest zu #102 (speichereArbeitskopie).
//
// Der groesste Teil nutzt eine Attrappe fuer `schreibe-vorlagen` (#98), die die Aufrufe
// zaehlt, die Schreibart prueft, die Aenderungsfunktion auf einer tiefen Kopie ausfuehrt
// und deren `bestand` NUR bei ok:true uebernimmt - exakt der Vertrag von #98 ("liefert
// die Aenderungsfunktion ok:false, wird NICHTS geschrieben"). Damit sind die DoD-Aussagen
// ("aendereBestand wird genau einmal gerufen", "bei Fehler wird nichts geschrieben",
// "Länge und Reihenfolge unverändert") belegbar, ohne die echte vorlagen.json anzufassen.
//
// Der letzte describe-Block laeuft gegen den ECHTEN aendereBestand in einem Temp-Ordner
// und belegt den DoD-Punkt "unmittelbar nach dem Aufruf ist vorlagen.json noch nicht
// geaendert; nach flushBestand() ist sie es" (TK 9.5.4) - gegen eine Attrappe waere er
// wertlos. Gemockt ist nur der Datenort (#5), damit keine echte Projekt-Datei beruehrt wird.
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
  /** Temp-Ordner fuer den echten-#98-Describe; nur dort gesetzt. */
  datenOrtOrdner: '',
}))

// Top-Level, weil vi.mock hoisted laeuft. Wirkt nur im letzten describe: Dort wird
// schreibe-vorlagen doUnmockt und das Modul frisch geladen, das dann echten Datenort
// braucht. In den Attrappen-Describes ist schreibe-vorlagen gemockt und datenort
// unerreichbar.
vi.mock('../../src/main/datenort', () => ({ ermittleDatenOrt: () => zustand.datenOrtOrdner }))

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

const { speichereArbeitskopie } = await import('../../src/main/vorlagen-store/speichere-arbeitskopie')

beforeEach(() => {
  zustand.bestand = []
  zustand.aenderungsBestand = null
  zustand.schreibVersuche = 0
  zustand.schreibarten = []
  zustand.schreibFehler = null
  zustand.aenderungsfunktion = null
})

/** Eine freie Textzone, die die Flächenprüfung passiert. */
function zone(id: string, teil: Partial<NonNullable<Vorlage['zonen'][number]>> = {}) {
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
    ...teil,
  }
}

/** Eine feste Zone (Markenrahmen) - darf der Nutzer nie aendern (TK 9.12.1). */
function festeZone(id: string, höhe = 200, y = 54) {
  return {
    id,
    rolle: 'fest' as const,
    bindung: null as const,
    rahmen: { x: 96, y, breite: 800, höhe },
    ausrichtung: { horizontal: 'links' as const, vertikal: 'oben' as const },
    wennLeer: 'leer' as const,
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

/** Eine nutzbare Arbeitskopie mit festen Zonen wie die eingebaute "Vollbild" (vereinfacht). */
function kopieMitFesten(id: string, extra: Vorlage['zonen'] = []) {
  return vorlage(id, {
    parent: 'parent-1',
    zonen: [festeZone('hintergrund'), festeZone('scrim'), ...extra],
  })
}

/** Besteht auf einem Erfolgsergebnis und gibt den gespeicherten Stand zurueck. */
async function erfolg(arbeitsId: string, neu: Vorlage) {
  const ergebnis = await speichereArbeitskopie(arbeitsId, neu)
  if (!ergebnis.ok) {
    throw new Error(`unerwartet fehlgeschlagen: ${ergebnis.fehler.code} ${ergebnis.fehler.meldung}`)
  }
  return ergebnis
}

/** Besteht auf einem Fehlerergebnis und gibt dessen Fehler zurueck. */
async function fehlschlag(arbeitsId: unknown, neu?: unknown) {
  const ergebnis = await speichereArbeitskopie(arbeitsId as string, neu as Vorlage)
  if (ergebnis.ok) {
    throw new Error('erwartet: Fehler, erhalten: ok:true')
  }
  return ergebnis.fehler
}

describe('speichereArbeitskopie – Erfolgslauf', () => {
  it('aendert GENAU den Eintrag mit id === arbeitsId; die uebrigen Eintraege – vor allem der Parent – bleiben byte-identisch', async () => {
    const parent = vorlage('parent-1', { zonen: [festeZone('hintergrund')] })
    const kopie = vorlage('kopie', { parent: 'parent-1', zonen: [festeZone('hintergrund')] })
    const andere = vorlage('andere', { zonen: [festeZone('hintergrund')] })
    zustand.bestand = [parent, kopie, andere]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      name: '  Neuer Name  ',
      zonen: [festeZone('hintergrund'), zone('motiv')],
    })
    await erfolg('kopie', neu)

    expect(zustand.bestand).toHaveLength(3)
    expect(zustand.bestand[0]).toEqual(parent)
    expect(zustand.bestand[2]).toEqual(andere)
    expect(zustand.bestand[1]?.name).toBe('Neuer Name')
  })

  it('Laenge und Reihenfolge des Bestands bleiben unveraendert', async () => {
    zustand.bestand = [
      vorlage('parent-1'),
      vorlage('kopie-a', { parent: 'parent-1' }),
      vorlage('kopie-b', { parent: 'parent-1' }),
    ]

    await erfolg('kopie-a', vorlage('kopie-a', { parent: 'parent-1', name: 'Geaendert' }))

    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie-a', 'kopie-b'])
  })

  it('liefert den gespeicherten Stand zurueck: getrimmter name und exakt die uebergebene Zonen-Reihenfolge', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      name: '  Name mit Rand  ',
      zonen: [zone('motiv'), zone('preis')],
    })
    const ergebnis = await erfolg('kopie', neu)

    expect(ergebnis.wert.name).toBe('Name mit Rand')
    expect(ergebnis.wert.zonen.map((z) => z.id)).toEqual(['motiv', 'preis'])
    expect(zustand.bestand[1]?.name).toBe('Name mit Rand')
  })

  it('ruft aendereBestand genau einmal mit schreibart "entprellt" auf', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    await erfolg('kopie', vorlage('kopie', { parent: 'parent-1', name: 'x' }))

    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.schreibarten).toEqual(['entprellt'])
  })

  it('das Einfuegen einer FREIEN Zone zwischen zwei festen Zonen gelingt und wird in uebergebener Reihenfolge gespeichert', async () => {
    zustand.bestand = [vorlage('parent-1'), kopieMitFesten('kopie')]

    const neu = kopieMitFesten('kopie', [zone('motiv')])
    await erfolg('kopie', neu)

    expect(zustand.bestand[1]?.zonen.map((z) => z.id)).toEqual(['hintergrund', 'scrim', 'motiv'])
  })

  it('zwei sich ueberlappende Zonen und eine Zone innerhalb des Sicherheitsabstands werden OHNE Fehler gespeichert', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [
        zone('hintergrund-gross', { rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 } }),
        zone('ueberlappt', { rahmen: { x: 100, y: 100, breite: 500, höhe: 300 } }),
      ],
    })
    await erfolg('kopie', neu)

    expect(zustand.bestand[1]?.zonen).toHaveLength(2)
  })

  it('eine Zone, die exakt an der Kante endet (x + breite = 1920, y + höhe = Flächenhöhe), gelingt', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [
        zone('kante-x', { rahmen: { x: 1200, y: 0, breite: 720, höhe: 100 } }),
        zone('kante-y', { rahmen: { x: 0, y: 980, breite: 100, höhe: 100 } }),
      ],
    })
    await erfolg('kopie', neu)
  })

  it('bei art split mit höhe 162 wird gegen 1920 x 162 geprueft – eine Zone bei y = 200 wird abgelehnt', async () => {
    zustand.bestand = [
      vorlage('parent-1'),
      vorlage('kopie', {
        parent: 'parent-1',
        art: 'split',
        höhe: 162,
        zonen: [festeZone('hintergrund', 162, 0)],
      }),
    ]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      art: 'split',
      höhe: 162,
      zonen: [
        festeZone('hintergrund', 162, 0),
        zone('motiv', { rahmen: { x: 96, y: 200, breite: 800, höhe: 100 } }),
      ],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('derselbe Aufruf mit höhe 162 und einer Zone innerhalb der Flaeche gelingt', async () => {
    zustand.bestand = [
      vorlage('parent-1'),
      vorlage('kopie', {
        parent: 'parent-1',
        art: 'split',
        höhe: 162,
        zonen: [festeZone('hintergrund', 162, 0)],
      }),
    ]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      art: 'split',
      höhe: 162,
      zonen: [
        festeZone('hintergrund', 162, 0),
        zone('motiv', { rahmen: { x: 96, y: 20, breite: 800, höhe: 100 } }),
      ],
    })
    await erfolg('kopie', neu)
  })
})

describe('speichereArbeitskopie – Fehlerpfade', () => {
  it('lehnt einen Eintrag mit parent === null ab und schreibt nachweislich nichts', async () => {
    const nutzbar = vorlage('nutzbar', { zonen: [festeZone('hintergrund')] })
    zustand.bestand = [nutzbar]

    const fehler = await fehlschlag('nutzbar', vorlage('nutzbar'))

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['nutzbar'])
    expect(zustand.bestand[0]).toEqual(vorlage('nutzbar', { zonen: [festeZone('hintergrund')] }))
  })

  it('liefert fuer eine unbekannte arbeitsId nicht_gefunden ohne Schreibvorgang', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag('unbekannt', vorlage('kopie', { parent: 'parent-1' }))

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
  })

  it('lehnt eine Nicht-Objekt-Nutzlast mit ungueltige_eingabe ab, ohne aendereBestand zu rufen', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag('kopie', null)

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.schreibVersuche).toBe(0)
  })

  it('reicht speicher_fehler von aendereBestand unveraendert durch', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]
    zustand.schreibFehler = 'speicher_fehler'

    const fehler = await fehlschlag('kopie', vorlage('kopie', { parent: 'parent-1' }))

    expect(fehler.code).toBe('speicher_fehler')
    expect(zustand.schreibVersuche).toBe(1)
    expect(zustand.bestand.map((v) => v.id)).toEqual(['parent-1', 'kopie'])
  })

  it('ist der Eintrag im Bestand der Aenderungsfunktion nicht mehr vorhanden, ergibt nicht_gefunden und nichts wird geschrieben', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]
    zustand.aenderungsBestand = [vorlage('parent-1')]

    const fehler = await fehlschlag('kopie', vorlage('kopie', { parent: 'parent-1' }))

    expect(fehler.code).toBe('nicht_gefunden')
    expect(zustand.bestand).toEqual([vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })])
  })
})

describe('speichereArbeitskopie – unveränderliche Felder (Abgleich)', () => {
  it.each([
    ['id', vorlage('kopie', { parent: 'parent-1', name: 'Neue id' })],
    ['art', vorlage('kopie', { parent: 'parent-1', art: 'split', höhe: 162 })],
    ['parent', vorlage('kopie', { parent: 'anderer-parent' })],
    ['eingebaut', vorlage('kopie', { parent: 'parent-1', eingebaut: true })],
  ])('weicht %s ab, ergibt ungueltige_eingabe und der gespeicherte Eintrag ist danach unveraendert', async (_beschreibung, neu) => {
    const gespeichert = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [festeZone('hintergrund')],
    })
    zustand.bestand = [vorlage('parent-1'), gespeichert]

    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.bestand[1]).toEqual(gespeichert)
  })
})
describe('speichereArbeitskopie – name und höhe', () => {
  it.each([
    ['kein String', vorlage('kopie', { parent: 'parent-1', name: 42 as unknown as string })],
    ['leer nach trim', vorlage('kopie', { parent: 'parent-1', name: '   ' })],
    ['laenger als 80 Zeichen', vorlage('kopie', { parent: 'parent-1', name: 'x'.repeat(81) })],
  ])('lehnt einen Namen, der %s ist, mit ungueltige_eingabe ab', async (_beschreibung, neu) => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.bestand[1]).toEqual(vorlage('kopie', { parent: 'parent-1' }))
  })

  it('ein Name von genau 80 Zeichen nach trim gelingt', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    await erfolg('kopie', vorlage('kopie', { parent: 'parent-1', name: 'x'.repeat(80) }))

    expect(zustand.bestand[1]?.name).toBe('x'.repeat(80))
  })

  it('lehnt eine höhe bei vollflaeche (statt null) mit ungueltige_eingabe ab', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const fehler = await fehlschlag('kopie', vorlage('kopie', { parent: 'parent-1', höhe: 162 }))

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it.each([0, -5, 1080, 1079.5, 161, 200.5])('lehnt eine unbrauchbare höhe %s bei split ab', async (höhe) => {
    const kopie = vorlage('kopie', { parent: 'parent-1', art: 'split', höhe: 162 })
    zustand.bestand = [vorlage('parent-1'), kopie]

    const fehler = await fehlschlag('kopie', vorlage('kopie', { parent: 'parent-1', art: 'split', höhe }))

    expect(fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.bestand[1]).toEqual(kopie)
  })

  it('eine gerade hohe 162 bei split gelingt', async () => {
    zustand.bestand = [
      vorlage('parent-1'),
      vorlage('kopie', { parent: 'parent-1', art: 'split', höhe: 162 }),
    ]

    await erfolg('kopie', vorlage('kopie', { parent: 'parent-1', art: 'split', höhe: 162 }))
  })
})

describe('speichereArbeitskopie – Zonen-Prüfungen', () => {
  it('eine Zone mit x + breite = 1921 ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('raus', { rahmen: { x: 1200, y: 0, breite: 721, höhe: 100 } })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit y + höhe groesser als die Flächenhöhe ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('raus', { rahmen: { x: 0, y: 980, breite: 100, höhe: 200 } })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit nicht-endlichem Rahmenwert ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('nan', { rahmen: { x: Number.NaN, y: 0, breite: 100, höhe: 100 } })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine feste Zone verschieben ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), kopieMitFesten('kopie')]

    const neu = kopieMitFesten('kopie', [zone('motiv')])
    neu.zonen[0] = { ...neu.zonen[0]!, rahmen: { x: 500, y: 500, breite: 100, höhe: 100 } }
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine feste Zone entfernen ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), kopieMitFesten('kopie')]

    const neu = vorlage('kopie', { parent: 'parent-1', zonen: [festeZone('hintergrund')] })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine feste Zone hinzufuegen ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), kopieMitFesten('kopie')]

    const neu = kopieMitFesten('kopie', [zone('motiv'), festeZone('neu-fest')])
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('zwei feste Zonen vertauschen ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), kopieMitFesten('kopie')]

    const neu = kopieMitFesten('kopie', [zone('motiv')])
    neu.zonen = [festeZone('scrim'), festeZone('hintergrund'), zone('motiv')]
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine gebundene Textzone ohne text ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('titel', { text: undefined })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Textzone mit größeMin > größeMax ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [
        zone('titel', {
          text: {
            schriftRolle: 'fliesstext',
            farbRolle: 'textAufHell',
            größeMax: 32,
            größeMin: 64,
            maxZeilen: 3,
          },
        }),
      ],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit deko.statischerText ohne text ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('deko', { bindung: null, text: undefined, deko: { statischerText: 'Hallo' } })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit bindung bild ohne bild ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('motiv', { bindung: 'bild', text: undefined, bild: undefined })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit bindung bild und einpassung fill ergibt ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [
        zone('motiv', {
          bindung: 'bild',
          text: undefined,
          bild: { einpassung: 'fill' as 'contain' },
        }),
      ],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('dieselbe Pruefung greift fuer bindung logo', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('logo', { bindung: 'logo', text: undefined })],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine Zone mit bindung bild und einpassung contain gelingt', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('motiv', { bindung: 'bild', text: undefined, bild: { einpassung: 'contain' } })],
    })
    await erfolg('kopie', neu)
  })

  it('zwei Zonen mit derselben id ergeben ungueltige_eingabe', async () => {
    zustand.bestand = [vorlage('parent-1'), vorlage('kopie', { parent: 'parent-1' })]

    const neu = vorlage('kopie', {
      parent: 'parent-1',
      zonen: [zone('doppelt'), zone('doppelt')],
    })
    const fehler = await fehlschlag('kopie', neu)

    expect(fehler.code).toBe('ungueltige_eingabe')
  })
})

// Der ECHTE #98 im Temp-Ordner: belegt den DoD-Punkt, dass unmittelbar nach dem Aufruf
// vorlagen.json noch nicht geaendert ist und erst nach flushBestand() (TK 9.5.4).
// Gemockt wird nur der Datenort (#5), damit kein echtes Projekt beruehrt wird.
describe('speichereArbeitskopie – Entprellung gegen den echten #98', () => {
  let ordner: string
  let schreibe: typeof import('../../src/main/vorlagen-store/schreibe-vorlagen')
  let speichere: typeof import('../../src/main/vorlagen-store/speichere-arbeitskopie')

  beforeEach(async () => {
    ordner = await fs.mkdtemp(path.join(os.tmpdir(), 'signage-speichere-kopie-'))
    zustand.datenOrtOrdner = ordner
    vi.doUnmock('../../src/main/vorlagen-store/schreibe-vorlagen')
    vi.resetModules()
    schreibe = await import('../../src/main/vorlagen-store/schreibe-vorlagen')
    speichere = await import('../../src/main/vorlagen-store/speichere-arbeitskopie')
  })

  afterEach(async () => {
    vi.useRealTimers()
    // Den ausstehenden Timer aus #98 beenden, damit kein Test in den naechsten lauft.
    if (schreibe !== undefined) {
      await schreibe.flushBestand()
    }
    await fs.rm(ordner, { recursive: true, force: true })
  })

  function pfad(): string {
    return path.join(ordner, 'vorlagen.json')
  }

  async function dateiInhalt(): Promise<{ vorlagen: Vorlage[] }> {
    return JSON.parse(await fs.readFile(pfad(), 'utf8')) as { vorlagen: Vorlage[] }
  }

  it('aendert vorlagen.json unmittelbar nach dem Aufruf noch nicht, aber nach flushBestand()', async () => {
    // Arbeitskopie anlegen (#101), damit der echte Bestand sie kennt.
    const kopieErgebnis = await speichere.speichereArbeitskopie('gibt-es-nicht', {
      id: 'gibt-es-nicht',
      name: 'x',
      art: 'vollflaeche',
      höhe: null,
      parent: 'band-standard',
      eingebaut: false,
      zonen: [],
    })
    if (kopieErgebnis.ok) {
      throw new Error('unerwartet erfolgreich')
    }

    // Die eingebaute "vollbild" als Arbeitskopie oeffnen (#101), dann einen neuen Stand speichern.
    const oeffne = await import('../../src/main/vorlagen-store/oeffne-zur-bearbeitung')
    const offen = await oeffne.oeffneZurBearbeitung('vollbild')
    expect(offen.ok).toBe(true)
    if (!offen.ok) return
    const arbeitsId = offen.wert.id

    const vorher = await dateiInhalt()
    const neu = { ...offen.wert, name: 'Neuer Name' }
    const gespeichert = await speichere.speichereArbeitskopie(arbeitsId, neu)
    expect(gespeichert.ok).toBe(true)
    if (!gespeichert.ok) return

    // Unmittelbar nach dem Aufruf: noch nicht auf der Platte.
    const dazwischen = await dateiInhalt()
    expect(dazwischen).toEqual(vorher)

    // Erst flushBestand() schreibt (TK 9.5.4: "gültig übernommen" != "auf Platte").
    const flush = await schreibe.flushBestand()
    expect(flush.ok).toBe(true)
    const danach = await dateiInhalt()
    const kopie = danach.vorlagen.find((v) => v.id === arbeitsId)
    expect(kopie?.name).toBe('Neuer Name')
  })
})
