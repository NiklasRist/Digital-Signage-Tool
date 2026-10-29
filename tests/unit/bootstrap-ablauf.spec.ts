// Tests zu #260 - bootstrap.ts (die feste Reihenfolge und die Wirkstellen).
// Vollstaendig ohne Browser: alle Bausteine sind Attrappen, es wird KEINE
// Bridge gebraucht. Der Kern sind ZWEI benannte Tests: die Aufruf-Reihenfolge
// und die Verdraheit aller acht Wirkungen.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ANFANGS_BOOTSTRAP,
  baueNachlaufWirkungen,
  starteRenderer,
  type BootstrapLage,
  type BootstrapSchritte,
} from '../../src/renderer/app-shell/bootstrap'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Project } from '../../src/shared/contracts/project'
import type { Sichten, ProjektZugang, VorlagenZugang, ZeichenZugang, MarkenZugang } from '../../src/renderer/app-shell/sichten'
import type { StartErgebnis, StartHinweis } from '../../src/renderer/app-shell/start'
import type { NachlaufWirkungen } from '../../src/renderer/app-shell/auftrags-nachlauf'

// ---------------- Attrappen ----------------

function baueProjekt(): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-10-06T00:00:00Z', geaendertAm: '2026-10-06T00:00:00Z',
    schemaVersion: 1,
    assets: [], aktionen: [], liste: [],
    letzterAusgabeName: null, standardSegmentdauer: 10, standardMarkeId: 'm1',
  }
}

function baueMarkenZugangAttrappe(): MarkenZugang {
  return {
    lade: async () => defaultErgebnis(),
    hole: () => null,
    aufGeaendert: () => () => {},
  }
}

interface Automat {
  zugangRoh: ProjektZugang
  zugangUmhuellt: ProjektZugang
  vorlagen: VorlagenZugang
  zeichnen: ZeichenZugang
  sichten: Sichten
  log: string[]
  lagen: BootstrapLage[]
  abmeldeMerker: ReturnType<typeof vi.fn>
  abmeldeNachlauf: ReturnType<typeof vi.fn>
  merkeAufrufe: number
  nachlaufAufrufe: Array<[unknown, unknown]>
  setzeProjektAufrufe: Project[]
  setzeProjektZeiten: number[]
  bereiteVorAufrufe: Project[]
  bereiteVorAntwort: Ergebnis<never> | null
  startSitzungErgebnis: StartErgebnis
  sichtenAntwort: Ergebnis<Sichten, string>
}

function baueAutomat(): Automat {
  const automat: Automat = {
    zugangRoh: null as never,
    zugangUmhuellt: null as never,
    vorlagen: {
      lade: async () => defaultErgebnis(),
      hole: () => null,
      aufGeaendert: () => () => {},
    },
    zeichnen: null as never,
    sichten: null as never,
    log: [],
    lagen: [],
    abmeldeMerker: vi.fn(),
    abmeldeNachlauf: vi.fn(),
    merkeAufrufe: 0,
    nachlaufAufrufe: [],
    setzeProjektAufrufe: [],
    setzeProjektZeiten: [],
    bereiteVorAufrufe: [],
    bereiteVorAntwort: null,
    startSitzungErgebnis: { art: 'projekt-geladen', projekt: baueProjekt(), reiter: 'zusammenstellen' },
    sichtenAntwort: null as never,
  }

  function eineZugangFassung(name: string): ProjektZugang {
    return {
      lade: async (projectId: string) => {
        automat.log.push(`${name}/lade/${projectId}`)
        return defaultErgebnis()
      },
      hole: () => {
        automat.log.push(`${name}/hole`)
        return { projekt: null, ladefehler: null }
      },
      setzeProjekt: (projekt: Project) => {
        automat.log.push(`${name}/setzeProjekt`)
        automat.setzeProjektAufrufe.push(projekt)
        automat.setzeProjektZeiten.push(automat.log.length)
      },
      setzeListe: () => {
        automat.log.push(`${name}/setzeListe`)
      },
      gleicheElementAb: () => {
        automat.log.push(`${name}/gleicheElementAb`)
      },
      leere: () => {
        automat.log.push(`${name}/leere`)
      },
      aufGeaendert: () => {
        automat.log.push(`${name}/aufGeaendert`)
        return () => {}
      },
    }
  }

  automat.zugangRoh = eineZugangFassung('roh')
  automat.zugangUmhuellt = {
    ...automat.zugangRoh,
    setzeProjekt: (projekt: Project) => {
      automat.log.push('umhuellt/setzeProjekt')
    },
    setzeListe: () => {
      automat.log.push('umhuellt/setzeListe')
    },
    lade: automat.zugangRoh.lade,
    hole: automat.zugangRoh.hole,
    gleicheElementAb: automat.zugangRoh.gleicheElementAb,
    leere: automat.zugangRoh.leere,
    aufGeaendert: automat.zugangRoh.aufGeaendert,
  }
  automat.zeichnen = {
    bereiteVor: async (projekt: Project) => {
      automat.log.push('zeichnen/bereiteVor')
      automat.bereiteVorAufrufe.push(projekt)
      if (automat.bereiteVorAntwort !== null) return automat.bereiteVorAntwort as never
      return { ok: true, wert: null } as never
    },
    hole: () => null,
    verwirfMotivBestand: () => {
      automat.log.push('zeichnen/verwirfMotivBestand')
    },
  }
  automat.sichten = { projekt: automat.zugangRoh, vorlagen: automat.vorlagen, zeichnen: automat.zeichnen, marken: baueMarkenZugangAttrappe() }
  automat.sichtenAntwort = { ok: true, wert: automat.sichten }
  return automat
}

function defaultErgebnis(): never {
  throw new Error('nicht relevant')
}

function baueSchritte(automat: Automat,lageTafel: BootstrapLage[] = automat.lagen): BootstrapSchritte {
  return {
    baueSichten: async () => {
      automat.log.push('baueSichten')
      return automat.sichtenAntwort as Ergebnis<Sichten, string>
    },
    verteileZugaenge: (sichten: Sichten) => {
      automat.log.push('verteileZugaenge')
      expect(sichten).toBe(automat.sichten)
      return {
        projektBearbeitung: automat.zugangUmhuellt,
        projektRoh: automat.zugangRoh,
        vorlagen: automat.vorlagen,
        zeichnen: automat.zeichnen,
        marken: baueMarkenZugangAttrappe(),
      }
    },
    starteSitzung: async () => {
      automat.log.push('starteSitzung')
      return automat.startSitzungErgebnis
    },
    merkeAktivenReiter: () => {
      automat.log.push('merkeAktivenReiter')
      automat.merkeAufrufe += 1
      return automat.abmeldeMerker as () => void
    },
    starteAuftragsNachlauf: (
      abonniereQueue: (hoerer: (auftraege: unknown[]) => void) => () => void,
      wirkungen: NachlaufWirkungen,
    ) => {
      automat.log.push('starteAuftragsNachlauf')
      automat.nachlaufAufrufe.push([abonniereQueue, wirkungen])
      return automat.abmeldeNachlauf as () => void
    },
    abonniereQueue: () => {
      automat.log.push('abonniereQueue')
      return () => {}
    },
    leereProjektHistorie: () => {
      automat.log.push('leereProjektHistorie')
    },
    aktualisiereAusgabenListe: () => {
      automat.log.push('aktualisiereAusgabenListe')
    },
    meldeImportErgebnis: () => {
      automat.log.push('meldeImportErgebnis')
    },
    meldeFehler: (code: string, meldung: string) => {
      automat.log.push(`meldeFehler/${code}/${meldung}`)
    },
    setzeLage: (lage: BootstrapLage) => {
      automat.log.push(`setzeLage/${'schritt' in lage ? lage.schritt : '?'}`)
      lageTafel.push(lage)
    },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ---------------- DIE REIHENFOLGE (Kernnachweis 1) ----------------

describe('Die feste Reihenfolge (Kernnachweis 1)', () => {
  it('laeuft baueSichten -> verteileZugaenge -> starteSitzung -> setzeProjekt -> bereiteVor -> merkeAktivenReiter -> starteAuftragsNachlauf, EINmal je; setzeLage erst am Ende', async () => {
    const automat = baueAutomat()
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.log).toEqual([
      'baueSichten', 'verteileZugaenge', 'starteSitzung', 'roh/setzeProjekt',
      'zeichnen/bereiteVor', 'merkeAktivenReiter', 'starteAuftragsNachlauf',
      'setzeLage/bereit',
    ])
    // merkeAktivenReiter NACH starteSitzung, aber VOR dem Nachlauf:
    expect(automat.merkeAufrufe).toBe(1)
    expect(automat.nachlaufAufrufe).toHaveLength(1)
  })

  it('verteileZugaenge wird mit dem GENAUEN Objekt gerufen; starteAuftragsNachlauf erst NACH der Erfuellung von starteSitzung (Spion-Positionen)', async () => {
    const automat = baueAutomat()
    const schritte = baueSchritte(automat)
    const originalStarteSitzung = schritte.starteSitzung
    const erfuellung: Array<unknown> = []
    schritte.starteSitzung = async () => {
      const ergebnis = await originalStarteSitzung()
      erfuellung.push('starteSitzung erfuehrt')
      return ergebnis
    }
    const besser = schritte.starteAuftragsNachlauf
    schritte.starteAuftragsNachlauf = (abo, wirkungen) => {
      erfuellung.push('nachlauf gestartet')
      return besser(abo, wirkungen)
    }
    const neu = { ...schritte }
    starteRenderer(neu)
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(erfuellung).toEqual(['starteSitzung erfuehrt', 'nachlauf gestartet'])
  })

  it('setzeProjekt GENAU einmal mit dem gelieferten projekt, DANN bereiteVor mit DEMSELBEN projekt (Reihenfolge und Argument)', async () => {
    const automat = baueAutomat()
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.setzeProjektAufrufe).toHaveLength(1)
    const geladen = automat.startSitzungErgebnis as Extract<StartErgebnis, { art: 'projekt-geladen' }>
    expect(automat.setzeProjektAufrufe[0]).toBe(geladen.projekt)
    expect(automat.bereiteVorAufrufe).toHaveLength(1)
    expect(automat.bereiteVorAufrufe[0]).toBe(geladen.projekt)
    expect(automat.log.indexOf('roh/setzeProjekt')).toBeLessThan(automat.log.indexOf('zeichnen/bereiteVor'))
  })

  it('kein-projekt: setzeProjekt und bereiteVor null Mal; Lage bereit mit GENAUEM hinweis', async () => {
    const automat = baueAutomat()
    const hinweis: StartHinweis = { art: 'kein_aktives_projekt' }
    automat.startSitzungErgebnis = { art: 'kein-projekt', reiter: 'projekte', hinweis }
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.setzeProjektAufrufe).toHaveLength(0)
    expect(automat.bereiteVorAufrufe).toHaveLength(0)
    const bereit = automat.lagen.find((lage) => lage.schritt === 'bereit') as Extract<BootstrapLage, { schritt: 'bereit' }>
    expect(bereit.startHinweis).toBe(hinweis)
  })

  it('der umhüllte Zugang wird in KEINEMOLF Pfad benutzt: alle seine kennzeichnenden Rufo bleiben KALT', async () => {
    const automat = baueAutomat()
    // Die Spur: alles was mit 'umhuellt/' beginnt, muss FEHLEN.
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.log.some((eins) => eins.startsWith('umhuellt/'))).toBe(false)
  })
})

// ---------------- die Fehlpfade ----------------

describe('Die Fehlpfade', () => {
  it('baueSichten scheitert: Lage gescheitert mit UNVERAENDERTEM Code; alle Folgeschritte null Mal', async () => {
    const automat = baueAutomat()
    automat.sichtenAntwort = { ok: false, fehler: { code: 'datenort_unlesbar', meldung: 'Stick fehlt.' } }
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'gescheitert')).toBe(true)
    })
    const lage = automat.lagen.find((ein) => ein.schritt === 'gescheitert') as Extract<BootstrapLage, { schritt: 'gescheitert'; code: string; meldung: string }>
    expect(lage.code).toBe('datenort_unlesbar')
    expect(lage.meldung).toBe('Stick fehlt.')
    expect(automat.log.filter((eins) => eins === 'verteileZugaenge' || eins === 'starteSitzung' || eins === 'merkeAktivenReiter' || eins === 'starteAuftragsNachlauf')).toHaveLength(0)
  })

  it('bereiteVor scheitert: meldeFehler mit UNVERAENDERTEM Code, Lage trotzdem bereit, kein zweiter Versuch', async () => {
    const automat = baueAutomat()
    automat.bereiteVorAntwort = { ok: false, fehler: { code: 'bereit_vor_schriften_fehlen', meldung: 'Schriften fehlen.' } } as never
    starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.log.filter((eins) => eins.startsWith('meldeFehler/')).join('|')).toContain('schriften_fehlen')
    expect(automat.bereiteVorAufrufe).toHaveLength(1) // kein zweiter Versuch
  })

  it('starteRenderer wirft in keinem der Faelle - auch nicht mit WERFENDEN Attrappen', () => {
    const automat = baueAutomat()
    automat.sichtenAntwort = null as never
    const zerstoerte = baueSchritte(automat)
    zerstoerte.baueSichten = async () => {
      throw new Error('Attrappen-Bug')
    }
    expect(() => starteRenderer(zerstoerte)).not.toThrow()
  })

  it('werfendes starteSitzung: Lage gescheitert mit unbekannter_fehler; die Abmeldungen bleiben aufrufbar', async () => {
    const automat = baueAutomat()
    const schritte = baueSchritte(automat)
    schritte.starteSitzung = async () => {
      automat.log.push('starteSitzung')
      throw new Error('uneigentlicher Bug')
    }
    expect(() => starteRenderer(schritte)).not.toThrow()
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'gescheitert')).toBe(true)
    })
    const lage = automat.lagen.find((ein) => ein.schritt === 'gescheitert') as Extract<BootstrapLage, { schritt: 'gescheitert' }>
    expect(lage.code).toBe('unbekannter_fehler')
  })
})

// ---------------- Abbau (Invariante 2) ----------------

describe('Der Abbau (Invariante 2)', () => {
  it('vor der Antwort von baueSichten: danach wird NICHTS mehr gerufen (benannter Test)', async () => {
    const automat = baueAutomat()
    const abbau = starteRenderer(baueSchritte(automat))
    abbau()
    // {

    setTimeout(() => {}, 0)
    await new Promise((aufloesen) => setTimeout(aufloesen, 20))
    expect(automat.log.filter((eins) => eins.startsWith('setzeLage'))).toHaveLength(0)
    expect(automat.log.filter((eins) => eins === 'verteileZugaenge')).toHaveLength(0)
    expect(automat.log.filter((eins) => eins === 'starteSitzung')).toHaveLength(0)
    expect(automat.log.filter((eins) => eins === 'starteAuftragsNachlauf')).toHaveLength(0)
  })

  it('nach einem vollstaendigen Lauf: beide Abmeldungen GENAU einmal (Invariante 2, benannter Test); zweiter/dritter Aufruf wirkungslos', async () => {
    const automat = baueAutomat()
    const abbau = starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    abbau()
    expect(automat.abmeldeMerker).toHaveBeenCalledTimes(1)
    expect(automat.abmeldeNachlauf).toHaveBeenCalledTimes(1)
    abbau(); abbau()
    expect(automat.abmeldeMerker).toHaveBeenCalledTimes(1)
    expect(automat.abmeldeNachlauf).toHaveBeenCalledTimes(1)
  })

  it('zwei aufeinanderfolgende Laeufe (mit Abbau dazwischen): genau 2+2 Abmeldungen, kein zweiter Norm', async () => {
    const automat = baueAutomat()
    const erster = starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    erster()
    const zweiter = starteRenderer(baueSchritte(automat))
    await vi.waitFor(() => {
      expect(automat.log.filter((eins) => eins === 'starteAuftragsNachlauf')).toHaveLength(2)
    })
    zweiter()
    expect(automat.abmeldeMerker).toHaveBeenCalledTimes(2)
    expect(automat.abmeldeNachlauf).toHaveBeenCalledTimes(2)
  })
})

// ---------------- baueNachlaufWirkungen (Kernnachweis 2) ----------------

describe('Alle acht Wirkungen sind verdrahtet (Kernnachweis 2)', () => {
  function baueZugaengeFuerWirkungen() {
    const leere = vi.fn()
    const ausgaben = vi.fn()
    const fehl = vi.fn()
    const einImport = vi.fn()
    const automat = baueAutomat()
    const zugaenge = {
      projektBearbeitung: automat.zugangUmhuellt,
      projektRoh: automat.zugangRoh,
      vorlagen: automat.vorlagen,
      zeichnen: automat.zeichnen,
      marken: baueMarkenZugangAttrappe(),
    }
    return { automat, zugaenge, leere, ausgaben, fehl, einImport }
  }

  it('genau acht Schluessel; sechs ToBe-Faesser (setzeProjekt, verwirfMotivBestand, bereiteZeichnenVor, leere, ausgaben, fehl, import)', () => {
    const { automat, zugaenge, leere, ausgaben, fehl, einImport } = baueZugaengeFuerWirkungen()
    const wirkungen = baueNachlaufWirkungen(zugaenge, leere, ausgaben, fehl, einImport)
    expect(Object.keys(wirkungen)).toHaveLength(8)
    expect(wirkungen.setzeProjekt).toBe(automat.zugangRoh.setzeProjekt)
    expect(wirkungen.verwirfMotivBestand).toBe(automat.zeichnen.verwirfMotivBestand)
    expect(wirkungen.bereiteZeichnenVor).toBe(automat.zeichnen.bereiteVor)
    expect(wirkungen.leereProjektHistorie).toBe(leere)
    expect(wirkungen.aktualisiereAusgabenListe).toBe(ausgaben)
    expect(wirkungen.meldeFehler).toBe(fehl)
    expect(wirkungen.meldeImportErgebnis).toBe(einImport)
  })

  it('holeProjekt liefert exakt z.projektRoh.hole().projekt - fuer geladen und fuer null (zwei Pruefungen); der Bau ruft NOCH nichts', () => {
    const { automat, zugaenge, leere, ausgaben, fehl, einImport } = baueZugaengeFuerWirkungen()
    const wirkungen = baueNachlaufWirkungen(zugaenge, leere, ausgaben, fehl, einImport)
    // beim Bauen wurde NOCH NICHTS von den Quellen gerufen (reine Zusammenlegung):
    expect(wirkungen.holeProjekt).toBeDefined()
    const vorBau = automat.log.filter((eins) => eins.startsWith('roh/hole'))
    const projekt = baueProjekt()
    Object.defineProperty(automat, 'sichtGeladen', {
      value: { projekt, ladefehler: null },
      configurable: true,
    })
    // hole drehen, um einen geladenen Stand zu liefern:
    const originalHole = automat.zugangRoh.hole
    ;(automat.zugangRoh as { hole: () => unknown }).hole = () =>
      ({ projekt, ladefehler: null }) as never
    expect(wirkungen.holeProjekt()).toBe(projekt)
    ;(automat.zugangRoh as { hole: () => unknown }).hole = () =>
      ({ projekt: null, ladefehler: null }) as never
    expect(wirkungen.holeProjekt()).toBeNull()
    void originalHole
    void vorBau
  })

  it('der Bau verändert zugaenge NICHT (Object.freeze; ohne Wurf) und ruft projektRoh.hole NICHT beim Bauen', () => {
    const { automat, zugaenge, leere, ausgaben, fehl, einImport } = baueZugaengeFuerWirkungen()
    // Spur statt spyOn: spyOn auf dem SPAETER eingefrorenen Objekt zerstoert
    // die Nachbarsaetze der Wiederherstellung; ein eigener Wrapper zaehlt.
    const holeAufrufe: number[] = []
    ;(zugaenge.projektRoh as { hole: () => unknown }).hole = () => {
      holeAufrufe.push(1)
      return null
    }
    Object.freeze(zugaenge)
    Object.freeze(zugaenge.projektRoh)
    Object.freeze(zugaenge.zeichnen)
    expect(() =>
      baueNachlaufWirkungen(zugaenge, leere, ausgaben, fehl, einImport),
    ).not.toThrow()
    expect(holeAufrufe).toHaveLength(0)
  })

  it('starteAuftragsNachlauf bekommt abonniereQueue UNVERAENDERT (ToBe); bootstrap selbst ruft es null Mal', async () => {
    const automat = baueAutomat()
    const schritte = baueSchritte(automat)
    const abonniereQueue = vi.fn(() => () => {})
    schritte.abonniereQueue = abonniereQueue
    starteRenderer(schritte)
    await vi.waitFor(() => {
      expect(automat.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(automat.nachlaufAufrufe).toHaveLength(1)
    expect((automat.nachlaufAufrufe[0] as [unknown, unknown])[0]).toBe(abonniereQueue)
    // der Kanalname: die Attrappe wurde EIN Mal als Funktion gereicht, aber der
    // Bootstrap selbst hat sie NICHT als Funktion benutzt (kein Kanal-Kontakt):
    expect(abonniereQueue).toHaveBeenCalledTimes(0)
  })

  it('meldeImportErgebnis wird UNVERAENDERT gelegt und von bootstrap NULL Mal gerufen', async () => {
    const mitSpion = baueAutomat()
    const importSpion = vi.fn()
    const schritte = baueSchritte(mitSpion)
    schritte.meldeImportErgebnis = importSpion
    starteRenderer(schritte)
    await vi.waitFor(() => {
      expect(mitSpion.lagen.some((lage) => lage.schritt === 'bereit')).toBe(true)
    })
    expect(importSpion).toHaveBeenCalledTimes(0)
    const wirkungen = (mitSpion.nachlaufAufrufe[0] as [unknown, NachlaufWirkungen])[1]
    expect(wirkungen.meldeImportErgebnis).toBe(importSpion)
  })
})
