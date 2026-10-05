// Tests zu #243 - undo-aufzeichnung.ts (FA-21, ohne Browser).
//
// Zwei Ebenen: die REINE Logik (standGleich, entscheideAufzeichnung) mit
// handgebauten Standen; die HUELLE gegen ein Doppel (historien + merke).
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project, Listenelement, Bearbeitungsstand } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { ProjektZugang, Projektsicht } from '../../src/renderer/app-shell/sichten'
import type { ProjektStand } from '../../src/renderer/app-shell/undo-historien'

const doppel = vi.hoisted(() => ({
  merke: [] as Array<{ projektId: string; stand: Bearbeitungsstand }>,
  oberster: null as ProjektStand | null,
}))

vi.mock('../../src/renderer/app-shell/undo-projekt', () => ({
  merkeVorAenderung: (zugang: { holeProjekt: () => Project | null }) => {
    const projekt = zugang.holeProjekt()
    if (projekt !== null) {
      doppel.merke.push({
        projektId: projekt.id,
        stand: {
          aktionen: projekt.aktionen,
          liste: projekt.liste,
          standardSegmentdauer: projekt.standardSegmentdauer,
        },
      })
    }
  },
}))

vi.mock('../../src/renderer/app-shell/undo-historien', () => ({
  projektHistorie: () => ({
    ablegen: () => undefined,
    vorschauZurueck: () => doppel.oberster,
  }),
  leereProjektHistorie: () => undefined,
}))

const {
  standGleich,
  entscheideAufzeichnung,
  umhuelleFuerBearbeitung,
  ohneAufzeichnung,
  baueUndoZugang,
} = await import('../../src/renderer/app-shell/undo-aufzeichnung')

function zeile(id: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref: 'a-' + id,
    dauer: null,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

function aktion(): Aktion {
  return {
    id: 'a-1', titel: 'Probe', beschreibung: null, preis: null, bildRef: null,
    cta: null, standardDauer: null, vorlagenId: 'vollbild', markeId: 'm1',
    akzentfarbe: null,
  }
}

const STAMMAKTIONEN = [aktion()]

function standNr(liste: Listenelement[], aktionen: Aktion[] = STAMMAKTIONEN): Bearbeitungsstand {
  return { aktionen, liste, standardSegmentdauer: 10 }
}

function projekt(id: string, liste: Listenelement[]): Project {
  return {
    id,
    name: 'Probe',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: [] as Asset[],
    aktionen: STAMMAKTIONEN,
    liste,
    letzterAusgabeName: null,
    standardSegmentdauer: 10,
    standardMarkeId: 'm1',
  }
}

function stand(id: string, liste: Listenelement[]): ProjektStand {
  return { projektId: id, stand: standNr(liste) }
}

function rohZugang(start: Project | null): ProjektZugang {
  let projekt = start
  const zugang: ProjektZugang = {
    lade: vi.fn((_id: string) => null as unknown as Promise<Ergebnis<Project>>),
    hole: vi.fn(() => ({ projekt, ladefehler: null }) as Projektsicht),
    setzeProjekt: vi.fn((p: Project) => {
      projekt = p
    }),
    setzeListe: vi.fn((liste: Listenelement[]) => {
      if (projekt !== null) {
        projekt = { ...projekt, liste }
      }
    }),
    gleicheElementAb: vi.fn(() => undefined),
    leere: vi.fn(() => undefined),
    aufGeaendert: vi.fn(() => () => undefined),
  }
  return zugang
}

beforeEach(() => {
  doppel.merke = []
  doppel.oberster = null
})

// ---------------- standGleich: flach, ohne Tiefe ----------------

const lA = [zeile('a'), zeile('b')]

describe('standGleich', () => {
  it('true fuer toBe-gleiche Arrays', () => {
    expect(standGleich(standNr(lA), standNr(lA))).toBe(true)
  })

  it('true fuer flache Kopien mit denselben Elementen', () => {
    expect(standGleich(standNr(lA), standNr([...lA]))).toBe(true)
  })

  it('false bei Laengenunterschied', () => {
    expect(standGleich(standNr(lA), standNr([zeile('a')]))).toBe(false)
  })

  it('false bei einem neuen, inhaltgleichen Elementzwilling (kein Feldvergleich)', () => {
    const zwilling = { ...zeile('a') }
    expect(standGleich(standNr([zeile('a')]), standNr([zwilling]))).toBe(false)
  })
})

// ---------------- entscheideAufzeichnung: Reihenfolge 1-5 ----------------

const L0 = [zeile('a')]
const L1 = [zeile('b')]
const L2 = [zeile('c')]

describe('entscheideAufzeichnung - Reihenfolge', () => {
  it('projektwechsel schlaegt ALLES, auch bei selbigem Stand (Schritt 1)', () => {
    expect(
      entscheideAufzeichnung(stand('p1', L0), { projektId: 'p2', stand: standNr(L0) }, stand('p1', L1)),
    ).toBe('projektwechsel')
  })

  it('ohne_wirkung bei selbigem Stand (Schritt 2)', () => {
    expect(entscheideAufzeichnung(stand('p1', L0), { projektId: 'p1', stand: standNr(L0) }, null)).toBe('ohne_wirkung')
  })

  it('ruecknahme (R1): eingehend gleich oberster (Schritt 3)', () => {
    expect(
      entscheideAufzeichnung(stand('p1', L1), { projektId: 'p1', stand: standNr(L0) }, stand('p1', L0)),
    ).toBe('ruecknahme')
  })

  it('doppelt (R2): jetzt gleich oberster, eingehend anders (Schritt 4)', () => {
    expect(
      entscheideAufzeichnung(stand('p1', L1), { projektId: 'p1', stand: standNr(L2) }, stand('p1', L1)),
    ).toBe('doppelt')
  })

  it('ablegen bei leerem Stapel und veraenderndem Stand', () => {
    expect(entscheideAufzeichnung(stand('p1', L0), { projektId: 'p1', stand: standNr(L1) }, null)).toBe('ablegen')
  })

  it('ablegen bei fremd-projektigem oberster - beide Richtungen, keine falschen R1/R2', () => {
    expect(
      entscheideAufzeichnung(stand('p1', L1), { projektId: 'p1', stand: standNr(L0) }, stand('p2', L0)),
    ).toBe('ablegen')
    expect(
      // Schritt 2 (ohne_wirkung) feuer zuerst - deshalb muss eingehend hier
      // vom Jetzt-Stand abweichen, damit NUR die fremd-projektige Abweisung von R2
      // in Erscheinung tritt.
      entscheideAufzeichnung(stand('p1', L1), { projektId: 'p1', stand: standNr(L2) }, stand('p2', L1)),
    ).toBe('ablegen')
  })
})

// ---------------- die HUELLE gegen das Doppel ----------------

describe('KERNNACHWEIS - abgelehnte optimistische Operation', () => {
  it('L0 -> setzeListe(L1): EIN Schnappschuss; Ruecknahme auf L0: kein zweiter; naechste echte Aenderung: weiterhin EIN', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    // echte Aenderung -> ablegen
    gehuellt.setzeListe(L1)
    expect(doppel.merke).toHaveLength(1)
    expect(doppel.merke[0]?.stand.liste).toBe(L0)
    // Ruecknahme (derselbe Stand wie der abgelegte): Regel R1 - kein zweiter
    doppel.oberster = stand('p1', L0)
    gehuellt.setzeListe(L0)
    expect(doppel.merke).toHaveLength(1)
    // Fortsetzung R2: naechste echte Aenderung, noch solange der oberste dem
    // jetzigen entspricht - kein weiterer
    gehuellt.setzeListe(L2)
    expect(doppel.merke).toHaveLength(1)
    // die Delegation ist trotzdem durchgelaufen (unverstaendiger Stand L2)
    expect(roh.hole().projekt?.liste).toBe(L2)
  })

  it('Ruecknahme als flache Kopie ([...L0]) wird erkannt', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    gehuellt.setzeListe(L1)
    doppel.oberster = stand('p1', L0)
    gehuellt.setzeListe([...L0])
    expect(doppel.merke).toHaveLength(1)
  })
})

describe('die Reihenfolge und die Delegation', () => {
  it('merkeVorAenderung laeuft VOR der Delegation; Delegation immer, argument toBe', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    const spion = roh.setzeListe as ReturnType<typeof vi.fn>
    const befehl = L1
    gehuellt.setzeListe(befehl)
    expect(spion).toHaveBeenCalledWith(befehl)
  })
})

describe('die Naehren ohne Schnappschuss-Neigung', () => {
  it('ohne geladenes Projekt: kein Schnappschuss, ABER delegiert', () => {
    const roh = rohZugang(null)
    const gehuellt = umhuelleFuerBearbeitung(roh)
    gehuellt.setzeListe(L1)
    expect(doppel.merke).toHaveLength(0)
    expect(roh.setzeListe as ReturnType<typeof vi.fn>).toBeTruthy()
  })

  it('setzeProjekt mit fremder projektId: kein Schnappschuss; leereProjektHistorie wird NICHT gerufen', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    doppel.oberster = stand('p1', L0)
    gehuellt.setzeProjekt(projekt('p2', L0))
    expect(doppel.merke).toHaveLength(0)
  })

  it('leere() delegiert GENAU EINMAL - auch bei geladenem Projekt und gefuelltem Stapel - und legt nichts ab', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    doppel.oberster = stand('p1', L0)
    gehuellt.leere()
    expect((roh.leere as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1)
    expect(doppel.merke).toHaveLength(0)
  })

  it('gleicheElementAb/lade/hole/aufGeaendert delegieren unverändert und rufen merke NIE', () => {
    const roh = rohZugang(projekt('p1', L0))
    doppel.oberster = stand('p1', L0)
    const gehuellt = umhuelleFuerBearbeitung(roh)
    const argument = zeile('x')
    gehuellt.gleicheElementAb(argument)
    expect((roh.gleicheElementAb as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(argument)
    void gehuellt.lade('p1')
    gehuellt.hole()
    const abmeldung = gehuellt.aufGeaendert(() => undefined)
    expect(typeof abmeldung).toBe('function')
    expect(doppel.merke).toHaveLength(0)
  })

  it('ohne_wirkung delegiert trotzdem (dieselbe Referenz, toBe)', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    gehuellt.setzeListe(L0)
    expect(doppel.merke).toHaveLength(0)
    expect((roh.setzeListe as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(L0)
  })
})

describe('die Huelle und ihre Entpacker', () => {
  it('umhuelleFuerBearbeitung liefert ein NEUES Objekt; Wiederholung liefert dieselbe Huelle', () => {
    const roh = rohZugang(projekt('p1', L0))
    const erste = umhuelleFuerBearbeitung(roh)
    expect(erste).not.toBe(roh)
    expect(umhuelleFuerBearbeitung(roh)).toBe(erste)
    expect(umhuelleFuerBearbeitung(erste)).toBe(erste)
  })

  it('ohneAufzeichnung: roh bleibt roh, Huelle liefert den Rohbau', () => {
    const roh = rohZugang(projekt('p1', L0))
    expect(ohneAufzeichnung(roh)).toBe(roh)
    const gehuellt = umhuelleFuerBearbeitung(roh)
    expect(ohneAufzeichnung(gehuellt)).toBe(roh)
  })

  it('baueUndoZugang(huelle): setzeProjekt ist das ROHE (Rueckgaengig kann sich nicht aufzeichnen)', () => {
    const roh = rohZugang(projekt('p1', L0))
    const gehuellt = umhuelleFuerBearbeitung(roh)
    const undo = baueUndoZugang(gehuellt)
    expect(undo.setzeProjekt).toBe(roh.setzeProjekt)
    expect(undo.holeProjekt()).toBe(roh.hole().projekt)
    undo.setzeProjekt(projekt('p1', L1))
    expect(doppel.merke).toHaveLength(0)
  })

  it('der Rohwurf reisst die Huelle UNVERAENDERT durch (setzeListe wirft)', () => {
    const roh = rohZugang(projekt('p1', L0))
    ;(roh.setzeListe as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Probe-Bruch')
    })
    const gehuellt = umhuelleFuerBearbeitung(roh)
    expect(() => gehuellt.setzeListe(L0)).toThrow('Probe-Bruch')
  })
})
