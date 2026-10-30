// Tests zu #253 - einblendung-ansicht.tsx (die Band-Bedienung, jsdom).
//
// Ersetzt wird NUR die IPC-Naht uebernehmeBand (#129) - waehlbareBandVorlagen
// und die sechs Entwurfs-Funktionen laufen ECHT (Spion mit Durchleitung: der
// Test zaehlt die Aufrufe, die Rechnung bleibt die des Wahrheitsgebers).
// planeBandAblauf (#130) ebenfalls echt mit Durchleitung, damit nachgewiesen
// ist, mit welchem Trim und welchem Entwurf sie gerufen wird.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Listenelement } from '../../src/shared/contracts/project'
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../src/shared/contracts/konstanten'
import type { BandEntwurf } from '../../src/renderer/composer/einblendung-bearbeiten'
import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import { EinblendungAnsicht, type EinblendungAnsichtEigenschaften } from '../../src/renderer/composer/einblendung-ansicht.tsx'

// ---------------- Doppel (hoisted, Muster wie render-dialog-anzeige.spec.ts) ----------------

const doppel = vi.hoisted(() => ({
  // die IPC-Attrappe
  uebernehmen: [] as Array<{ elementId: string; entwurf: BandEntwurf }>,
  antwort: null as unknown,
  // die Aufruf-Zaehler der sechs durchgeleiteten Entwurfsfunktionen
  fuege: [] as Array<{ entwurf: BandEntwurf; aktionRef: string; dauer: number }>,
  entferne: [] as Array<{ entwurf: BandEntwurf; index: number }>,
  verschiebe: [] as Array<{ entwurf: BandEntwurf; von: number; nach: number }>,
  setzeDauer: [] as Array<{ entwurf: BandEntwurf; index: number; dauer: number }>,
  wechsle: [] as Array<{ entwurf: BandEntwurf; bandVorlageId: string }>,
  // die erhaltenen Trim-/Abschnitte-Anrufe an planeBandAblauf
  plant: [] as Array<{ trimStart: number; trimEnde: number; abschnitte: unknown }>,
}))

vi.mock('../../src/renderer/composer/einblendung-bearbeiten', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/einblendung-bearbeiten')>()
  return {
    ...echt,
    uebernehmeBand: vi.fn(async (elementId: string, entwurf: BandEntwurf) => {
      doppel.uebernehmen.push({ elementId, entwurf })
      return doppel.antwort as never
    }),
    fuegeAbschnittAn: (entwurf: BandEntwurf, aktionRef: string, dauer: number) => {
      doppel.fuege.push({ entwurf, aktionRef, dauer })
      return echt.fuegeAbschnittAn(entwurf, aktionRef, dauer)
    },
    entferneAbschnitt: (entwurf: BandEntwurf, index: number) => {
      doppel.entferne.push({ entwurf, index })
      return echt.entferneAbschnitt(entwurf, index)
    },
    verschiebeAbschnitt: (entwurf: BandEntwurf, von: number, nach: number) => {
      doppel.verschiebe.push({ entwurf, von, nach })
      return echt.verschiebeAbschnitt(entwurf, von, nach)
    },
    setzeAbschnittsDauer: (entwurf: BandEntwurf, index: number, dauer: number) => {
      doppel.setzeDauer.push({ entwurf, index, dauer })
      return echt.setzeAbschnittsDauer(entwurf, index, dauer)
    },
    wechsleBandVorlage: (entwurf: BandEntwurf, bandVorlageId: string) => {
      doppel.wechsle.push({ entwurf, bandVorlageId })
      return echt.wechsleBandVorlage(entwurf, bandVorlageId)
    },
    // waehlbareBandVorlagen bleibt UNVERAENDERT echt - sie wird von der Ansicht
    // und von den Tests gemeinsam benutzt.
  }
})

vi.mock('../../src/renderer/composer/einblendung-vorschau', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/einblendung-vorschau')>()
  return {
    ...echt,
    planeBandAblauf: (
      trimStart: number,
      trimEnde: number,
      abschnitte: ReadonlyArray<{ aktionRef: string; dauer: number }>,
    ) => {
      doppel.plant.push({ trimStart, trimEnde, abschnitte })
      return echt.planeBandAblauf(trimStart, trimEnde, abschnitte)
    },
  }
})

// React 19: act(...)-Umgebung (Muster wie render-dialog-anzeige.spec.ts).
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Bausteine ----------------

function aktion(id: string, titel: string): Aktion {
  return {
    id, titel, beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer: null, markeId: "m1", vorlagenId: 'vollbild', akzentfarbe: null,
  }
}

function vorlage(id: string, parent: string | null, hoehe: number | null): Vorlage {
  return { id, name: id, höhe: hoehe, parent, eingebaut: false, zonen: [] }
}

function element(ueber: Partial<Listenelement> = {}): Listenelement {
  return {
    id: 'el-1', art: 'video', ref: 'asset-1', dauer: null,
    trimStart: null, trimEnde: null, einblendung: null,
    ...ueber,
  }
}

const BANDBESTAND: readonly Vorlage[] = [
  vorlage('volle', null, null),
  vorlage('kopie-1', 'band-1', 210),
  vorlage('band-1', null, 210),
  vorlage('band-2', null, 54),
]

const AKTIONS_BESTAND: readonly Aktion[] = [aktion('a-1', 'Sommeraktion'), aktion('a-2', 'Winterpause')]

function eigenschaften(ueber: Partial<EinblendungAnsichtEigenschaften> = {}): EinblendungAnsichtEigenschaften {
  return {
    element: element({ trimStart: 0.3, trimEnde: 42.3 }),
    aktionen: AKTIONS_BESTAND,
    vorlagen: BANDBESTAND,
    stellen: [],
    aufUebernommen: vi.fn(),
    aufAbbrechen: vi.fn(),
    aufFehler: vi.fn(),
    ...ueber,
  }
}

function rendere(props: EinblendungAnsichtEigenschaften): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(EinblendungAnsicht, props) as ReactElement)
  })
  return { behaelter, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

function klick(im: HTMLElement, testId: string): void {
  act(() => {
    im.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click()
  })
}

/** Die erste Vorlagen-Auswahl im Bauteil; die Auswahl ist EINE beim ganzen Band. */
function vorlagenWahl(im: HTMLElement): HTMLSelectElement {
  const knoten = im.querySelector<HTMLSelectElement>('[data-testid="band-vorlagen-wahl"]')
  expect(knoten).not.toBeNull()
  return knoten as HTMLSelectElement
}

function waehle(im: HTMLElement, testId: string, wert: string): void {
  const knoten = im.querySelector<HTMLSelectElement>(`[data-testid="${testId}"]`)
  expect(knoten).not.toBeNull()
  act(() => {
    // Den Wert ueber den NATIVEN Setzer setzen, sonst meldet React kein
    // onChange (der value-Tracker vergleicht Werte - derselbe Trick wie im
    // render-dialog, nur fuer selects).
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(knoten as unknown as HTMLSelectElement, wert)
    ;(knoten as unknown as HTMLSelectElement).dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function tippe(im: HTMLElement, wert: string, feld?: HTMLInputElement): void {
  const knoten = feld ?? im.querySelector<HTMLInputElement>('[aria-label^="Dauer des Abschnitts"]')
  expect(knoten).not.toBeNull()
  act(() => {
    // dieselbe Konvention wie im render-dialog (kontrollierte Eingabe)
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(knoten as unknown as HTMLInputElement, wert)
    ;(knoten as unknown as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function blure(feld: HTMLInputElement): void {
  act(() => {
    // React fuehrt onBlur ueber die delegierten focusin/focusout-Ereignisse
    // - plain 'blur' steigt in jsdom nicht hoch (kein Bubbling).
    feld.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  })
}

const zeilenImDom = (im: HTMLElement): HTMLElement[] =>
  Array.from(im.querySelectorAll<HTMLElement>('[data-testid="band-abschnitte"] li'))

/** Der EINZIGE Eintrag nach einer Laengenpruefung - noUncheckedIndexedAccess
 *  im Test ohne Fluchttuer (`!`), mit Beleg statt Behauptung. */
function derEinzige<T>(liste: readonly T[]): T {
  expect(liste).toHaveLength(1)
  return liste[0] as T
}

/** Der letzte Eintrag nach einer Laengenpruefung. */
function derLetzte<T>(liste: readonly T[]): T {
  expect(liste.length).toBeGreaterThan(0)
  return liste[liste.length - 1] as T
}

const textVon = (im: HTMLElement, testId: string): string =>
  im.querySelector(`[data-testid="${testId}"]`)?.textContent ?? ''

const bestucktesElement = (): Listenelement =>
  element({
    einblendung: {
      bandVorlageId: 'band-1',
      abschnitte: [
        { aktionRef: 'a-2', dauer: 5 },
        { aktionRef: 'a-1', dauer: 6 },
        { aktionRef: 'a-2', dauer: 7 },
      ],
    },
  })

beforeEach(() => {
  doppel.uebernehmen = []
  doppel.fuege = []
  doppel.entferne = []
  doppel.verschiebe = []
  doppel.setzeDauer = []
  doppel.wechsle = []
  doppel.plant = []
  doppel.antwort = { ok: true, wert: element() }
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------- Die EINE Vorlagen-Auswahl (Kernnachweis 3, TK 9.2.8) ----------------

describe('Die eine Vorlagen-Auswahl fuer das ganze Band', () => {
  it('bietet ausschliesslich an, was waehlbareBandVorlagen liefert - vollflaeche und Arbeitskopie erscheinen NICHT', () => {
    // Bestand aus allen vier Sorten: vollflaeche, Arbeitskopien (parent gesetzt)
    // fuer beide Band-Arten, plus die zwei echten Band-Vorlagen.
    const bestand = [
      vorlage('volle-v', null, null),
      vorlage('kopie-split', 'band-1', 210),
      vorlage('kopie-ein', 'band-2', 54),
      vorlage('band-1', null, 210),
      vorlage('band-2', null, 54),
    ]
    const { behaelter, fertig } = rendere(eigenschaften({ vorlagen: bestand }))
    const angebot = Array.from(vorlagenWahl(behaelter).options).map((option) => option.value)
    // Es gab hier vorher Eingaben aus einem anderen Zweig - jetzt ist der
    // Verlagsvertrag klar: nur die zwei waelbaren Band-Vorlagen.
    expect(angebot).toEqual(['band-1', 'band-2'])
    fertig()
  })

  it('es gibt GENAU EINE Auswahlfeld fuer das Band und KEINE zweite in einer Abschnitts-Zeile', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    expect(behaelter.querySelectorAll('[data-testid="band-vorlagen-wahl"]').length).toBe(1)
    expect(
      behaelter.querySelector('[data-testid="band-abschnitte"]')
        ?.querySelectorAll<'select'>('select').length ?? -1,
    ).toBe(0)
    fertig()
  })

  it('ein Vorlagenwechsel ruft wechsleBandVorlage GENAU EINMAL und behaelt alle Abschnitte in derselben Reihenfolge', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    expect(doppel.wechsle).toHaveLength(0)
    waehle(behaelter, 'band-vorlagen-wahl', 'band-2')
    expect(doppel.wechsle).toHaveLength(1)
    expect(derEinzige(doppel.wechsle).bandVorlageId).toBe('band-2')
    // Alle drei Abschnitte bleiben, in derselben Reihenfolge (Winter, Sommer,
    // Winter - wie bei bestucktesElement oben).
    expect(derEinzige(doppel.wechsle).entwurf.abschnitte).toHaveLength(3)
    const zeilen = zeilenImDom(behaelter)
    expect(zeilen).toHaveLength(3)
    expect((zeilen[0] as HTMLElement).textContent).toContain('Winterpause')
    expect((zeilen[1] as HTMLElement).textContent).toContain('Sommeraktion')
    expect((zeilen[2] as HTMLElement).textContent).toContain('Winterpause')
    fertig()
  })
})

// ---------------- Hinzufuegen, Umordnen, Entfernen, Dauer ----------------

describe('die Entwurfs-Bedienung', () => {
  it('Abschnitt hinzufuegen ruft fuegeAbschnittAn GENAU EINMAL mit der gewaehlten Referenz und der Konstante aus #21', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    expect(doppel.fuege).toHaveLength(0)
    waehle(behaelter, 'abschnitt-aktions-wahl', 'a-2')
    klick(behaelter, 'abschnitt-hinzufuegen')
    expect(doppel.fuege).toHaveLength(1)
    expect(derEinzige(doppel.fuege).aktionRef).toBe('a-2')
    expect(derEinzige(doppel.fuege).dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN)
    fertig()
  })

  function knopfIn(zeile: HTMLElement, stelle: number): HTMLButtonElement {
    const knoepfe = Array.from(zeile.querySelectorAll<HTMLButtonElement>('button'))
    return knoepfe[stelle] as HTMLButtonElement
  }

  it('„nach oben“ ruft verschiebeAbschnitt GENAU EINMAL mit (index, index - 1)', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    expect(doppel.verschiebe).toHaveLength(0)
    // Zeile 2 (position 2 = index 1) nach oben.
    const zweite = zeilenImDom(behaelter)[1] as HTMLElement
    act(() => knopfIn(zweite, 0).click())
    expect(doppel.verschiebe).toHaveLength(1)
    expect(derEinzige(doppel.verschiebe).von).toBe(1)
    expect(derEinzige(doppel.verschiebe).nach).toBe(0)
    fertig()
  })

  it('„nach unten“ ruft verschiebeAbschnitt GENAU EINMAL mit (index, index + 1)', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    const erste = zeilenImDom(behaelter)[0] as HTMLElement
    act(() => knopfIn(erste, 1).click())
    expect(doppel.verschiebe).toHaveLength(1)
    expect(derEinzige(doppel.verschiebe).von).toBe(0)
    expect(derEinzige(doppel.verschiebe).nach).toBe(1)
    fertig()
  })

  it('die Pfeil-Knoepfe sind am Rand gesperrt: erste Zeile nicht nach oben, letzte nicht nach unten', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    const zeilen = zeilenImDom(behaelter)
    expect(zeilen.length).toBeGreaterThan(1)

    const erste = zeilen[0] as HTMLElement
    expect(knopfIn(erste, 0).disabled).toBe(true)
    expect(knopfIn(erste, 1).disabled).toBe(false)

    const letzte = zeilen[zeilen.length - 1] as HTMLElement
    expect(knopfIn(letzte, 1).disabled).toBe(true)
    expect(knopfIn(letzte, 0).disabled).toBe(false)
    fertig()
  })

  it('„Entfernen“ ruft entferneAbschnitt GENAU EINMAL mit dem Index der Zeile', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    expect(doppel.entferne).toHaveLength(0)
    const zweite = zeilenImDom(behaelter)[1] as HTMLElement
    act(() => knopfIn(zweite, 2).click())
    expect(doppel.entferne).toHaveLength(1)
    expect(derEinzige(doppel.entferne).index).toBe(1)
    fertig()
  })

  it('die Dauer-Eingabe ruft setzeAbschnittsDauer GENAU EINMAL mit dem Index und der gut aufgelösten Zahl (Komma erlaubt)', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    expect(doppel.setzeDauer).toHaveLength(0)
    const dritte = zeilenImDom(behaelter)[2] as HTMLElement
    const feld = dritte.querySelector<HTMLInputElement>('input') as HTMLInputElement
    tippe(behaelter, '4,5', feld)
    blure(feld)
    expect(doppel.setzeDauer).toHaveLength(1)
    expect(derEinzige(doppel.setzeDauer).index).toBe(2)
    expect(derEinzige(doppel.setzeDauer).dauer).toBe(4.5)
    fertig()
  })

  it('ungueltige Dauer-Eingaben (0, negativ, keine Zahl) sagen NICHTS - kein Eintrag, kein Wurf', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestucktesElement() }))
    const feld = (zeilenImDom(behaelter)[0] as HTMLElement).querySelector<HTMLInputElement>('input') as HTMLInputElement
    for (const ungultig of ['0', '-2', 'abc', '']) {
      tippe(behaelter, ungultig, feld)
      blure(feld)
    }
    expect(doppel.setzeDauer).toHaveLength(0)
    fertig()
  })

  it('planeBandAblauf wird mit trimStart ?? 0 / trimEnde ?? 0 und den Abschnitten des AKTUELLEN Entwurfs gerufen', () => {
    // Null-Trim wird als 0 gerufen.
    const erstes = rendere(eigenschaften({ element: element({ trimStart: null, trimEnde: null }) }))
    const erster = derLetzte(doppel.plant)
    expect(erster.trimStart).toBe(0)
    expect(erster.trimEnde).toBe(0)
    expect(erster.abschnitte).toEqual([])
    erstes.fertig()

    // Nach einem Hinzufuegen aendert sich die uebergebene Abschnittsliste:
    // der Plan sieht den ENTWURF, nicht die gespeicherte Einblendung.
    const zweites = rendere(eigenschaften({ element: bestucktesElement() }))
    const stand = doppel.plant.length
    klick(zweites.behaelter, 'abschnitt-hinzufuegen')
    expect(doppel.plant.length).toBeGreaterThan(stand)
    const letzter = derLetzte(doppel.plant)
    expect((letzter.abschnitte as Array<{ aktionRef: string; dauer: number }>)).toHaveLength(4)
    expect(
      (letzter.abschnitte as Array<{ aktionRef: string; dauer: number }>)[3],
    ).toEqual({ aktionRef: 'a-1', dauer: STANDARD_ANZEIGEDAUER_SEKUNDEN })
    zweites.fertig()
  })
})

// ---------------- Uebernehmen ----------------

describe('Uebernehmen (der eine Weg ueber die Prozessgrenze, #129)', () => {
  it('der Knopf ist bei istUebernehmbar === false gesperrt, und uebernehmeBand wird NULL Mal gerufen', () => {
    // Mit dem Hand.bestand: eine gespeicherte Einblendung mit LEERER aktionRef
    // (Bestands-Daten koennen kaputt sein) - die fruehe Rueckmeldung sperrt.
    const kaputtBestand = eigenschaften({
      element: element({
        einblendung: { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: '', dauer: 5 }] },
      }),
    })
    const { behaelter, fertig } = rendere(kaputtBestand)
    const knopf = behaelter.querySelector<HTMLButtonElement>('[data-testid="einblendung-uebernehmen"]')
    expect(knopf?.disabled).toBe(true)
    expect(doppel.uebernehmen).toHaveLength(0)
    fertig()
  })

  it('ein Uebernehmen mit NULL Abschnitten wird NICHT gesperrt (TK 9.5.3: das Band wird entfernt)', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: element() }))
    const knopf = behaelter.querySelector<HTMLButtonElement>('[data-testid="einblendung-uebernehmen"]')
    expect(knopf?.disabled).toBe(false)
    klick(behaelter, 'einblendung-uebernehmen')
    expect(doppel.uebernehmen).toHaveLength(1)
    expect(derEinzige(doppel.uebernehmen).elementId).toBe('el-1')
    expect(derEinzige(doppel.uebernehmen).entwurf.abschnitte).toHaveLength(0)
    fertig()
  })

  it('ein Erfolg ruft aufUebernommen GENAU EINMAL mit dem toBe-gleichen Element; aufFehler zaehlt null', async () => {
    const geheiltesElement = element()
    doppel.antwort = { ok: true, wert: geheiltesElement }
    const aufUebernommen = vi.fn()
    const aufFehler = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ element: element(), aufUebernommen, aufFehler }))
    klick(behaelter, 'einblendung-uebernehmen')
    // die Attrappe resolved erst bei der act-Schleife
    await act(async () => undefined)
    expect(aufUebernommen).toHaveBeenCalledTimes(1)
    expect(derEinzige(aufUebernommen.mock.calls)[0]).toBe(geheiltesElement)
    expect(aufFehler).toHaveBeenCalledTimes(0)
    fertig()
  })

  it('eine Ablehnung ruft aufFehler GENAU EINMAL mit dem UNVERAENDERTEN Code; kein Uebernommen, Entwurf steht', async () => {
    const bestand = element({
      einblendung: { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 5 }] },
    })
    doppel.antwort = { ok: false, fehler: { code: 'element_unbekannt', meldung: 'Probe', daten: null } }
    const aufUebernommen = vi.fn()
    const aufFehler = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ element: bestand, aufUebernommen, aufFehler }))
    klick(behaelter, 'einblendung-uebernehmen')
    // die Attrappe ist async: erst abwarten, dann sehen
    await act(async () => undefined)
    expect(aufFehler).toHaveBeenCalledTimes(1)
    expect(aufFehler).toHaveBeenCalledWith('element_unbekannt', 'Probe')
    expect(aufUebernommen).toHaveBeenCalledTimes(0)
    // Der Entwurf steht UNVERAENDERT weiter - die Zeilen sind noch da.
    expect(zeilenImDom(behaelter).length).toBe(1)
    fertig()
  })
})

// ---------------- Hinweis statt Bedienung ----------------

describe('Hinweis statt Bedienung (Fehlerpfade)', () => {
  it('bei einem Segment-Element erscheint der Hinweis und KEINE Bedienung', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ element: element({ art: 'segment' }) }))
    expect(textVon(behaelter, 'einblendung-hinweis')).not.toBe('')
    expect(behaelter.querySelector('[data-testid="band-vorlagen-wahl"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="einblendung-uebernehmen"]')).toBeNull()
    fertig()
  })

  it('bei leerem Ergebnis von waehlbareBandVorlagen erscheint der Hinweis mit dem Weg zum Reiter Vorlagen', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({
        // Nur eine vollflaechige Vorlage und eine Arbeitskopie: nichts waelbar.
        vorlagen: [vorlage('volle', null, null), vorlage('kopie', 'band', 210)],
      }),
    )
    expect(textVon(behaelter, 'einblendung-hinweis')).not.toBe('')
    expect(behaelter.querySelector('[data-testid="band-vorlagen-wahl"]')).toBeNull()
    fertig()
  })
})

// ---------------- Kaputte Abschnitte: kennzeichnen, NICHT heilen ----------------

describe('kaputte Abschnitte (Fall 3, TK 9.7.5)', () => {
  it('die Zeile ist gekennzeichnet; keine Fix-Option, keine automatische Entfernung, keine Sende-Uebergabe', () => {
    const stellen: readonly KaputteStelle[] = [
      // Eine Stelle eines ANDEREN Elements (erlaubte Stille) und die eigen.
      { art: 'element_asset', elementId: 'anderes', assetId: 'x', grund: 'asset_fehlt' },
      { art: 'band_abschnitt', elementId: 'el-1', abschnittIndex: 0, aktionId: 'a-2', assetId: null, grund: 'asset_fehlt' },
    ]
    const { behaelter, fertig } = rendere(
      eigenschaften({ element: bestucktesElement(), stellen }),
    )
    expect(textVon(behaelter, 'band-abschnitte')).toContain('[kaputt]')
    // Genau die richtig Zeile (position 1 = Winterpause, aktionRef a-2).
    const zeilen = zeilenImDom(behaelter)
    expect(zeilen[0]?.textContent).toContain('[kaputt]')
    expect(zeilen[1]?.textContent).not.toContain('[kaputt]')
    // Kein automatisch-Eintrag in KEINEM Weg: keine Sende-Atthappe, keine
    // Entfernungs- oder Verschiebe-Protokolle.
    expect(doppel.uebernehmen).toHaveLength(0)
    expect(doppel.entferne).toHaveLength(0)
    expect(doppel.verschiebe).toHaveLength(0)
    fertig()
  })
})

