// Issue #409: Der Vorlagen-Editor-Auftritt wirft React #301 ("Too many re-renders"),
// weil der Nutzungs-Hinweis SEINEN Zustand im RENDERKOERPER setzt - beginneLaden liefert
// zustand 'laedt', giltFuer verlangt 'geladen', also setzte JEDE Renderphase erneut und
// React baute den ganzen Baum ab. Der Fix hebt das Laden in einen Effect (auf die
// parent-Zugehoerigkeit) und stellt alle Hooks VOR den Sitzungs-Rueckweg.
//
// Dieser Test begleitet den Bauschein am echten Renderer (jsdom): Das Montieren der
// Wurzel MIT offener Sitzung darf ohne React-Fehler durchlaufen und den Kopf zeigen.

// @vitest-environment jsdom
import { createElement, act, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { EditorSitzung } from '../../src/renderer/vorlagen-editor/arbeitskopie'
import type { VorlagenEditorWurzelProps } from '../../src/renderer/vorlagen-editor'
import type {
  VorlagenZugang,
  ZeichenZugang,
  MarkenZugang,
  ProjektZugang,
} from '../../src/renderer/app-shell/sichten'
import type { Sitzungshalter } from '../../src/renderer/app-shell/undo-aufzeichnung-vorlage'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Project } from '../../src/shared/contracts/project'
import { VorlagenEditorWurzel } from '../../src/renderer/vorlagen-editor'

// #393: Die Vorschau laeuft ueber EINEN Zeichenaufruf (`zeichneSegment`, TK 9.10.1).
// Der wird hier gezaehlt und liefert ein Ersatzbild - jsdom hat kein Canvas.
// Gezaehlt werden AKTION und MARKE mit, weil #393 beides beweglich gemacht hat.
const zeichnen = vi.hoisted(() => ({
  aufrufe: [] as Array<{ aktion: { id: string }; vorlage: Vorlage; marke: { id: string } }>,
}))

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  stelleSchriftenBereit: vi.fn(async () => undefined),
}))

vi.mock('../../src/renderer/template-canvas/zeichne-segment', () => ({
  zeichneSegment: (aktion: unknown, vorlage: unknown, marke: unknown) => {
    zeichnen.aufrufe.push({
      aktion: aktion as { id: string },
      vorlage: vorlage as Vorlage,
      marke: marke as { id: string },
    })
    const nummer = zeichnen.aufrufe.length
    return {
      canvas: { toDataURL: () => `data:image/png;base64,BILD-${String(nummer)}` },
      breite: 1920,
      hoehe: 1080,
    }
  },
}))

// Die Zeichen-Marke: ohne sie zeichnet der Editor NICHTS (#312/#313).
// `logo: null` ist ein regulaerer Zustand (TK 9.10.10) - bereiteLogoVor kehrt sofort zurueck.
// JE KENNUNG DASSELBE OBJEKT (wie der echte Bestand): Ein neues Objekt je Aufruf setzte
// den Zeichen-Effekt in eine Endlosschleife - die Attrappe muss sich wie der Speicher
// verhalten, sonst misst der Test den Messaufbau.
const markenBestand = vi.hoisted(() => new Map<string, unknown>())

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  stelleMarkeBereit: vi.fn(async () => ({ ok: true, wert: undefined })),
  holeBereiteMarke: vi.fn((markeId: string) => {
    const vorhanden = markenBestand.get(markeId)
    if (vorhanden !== undefined) return vorhanden
    const marke = { id: markeId, name: markeId, farben: {}, zonen: [], logo: null }
    markenBestand.set(markeId, marke)
    return marke
  }),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({
    ok: true,
    wert: { aktionen: [], listenelemente: [] },
  })),
}))

function eigene(id: string): Vorlage {
  return {
    id,
    name: `Name ${id}`,
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
  }
}

function sitzungFest(parentVorlage: Vorlage): EditorSitzung {
  const arbeitskopie: Vorlage = { ...parentVorlage, id: `${parentVorlage.id}-arbeits`, parent: parentVorlage.id }
  return {
    arbeitsId: arbeitskopie.id,
    arbeitskopie,
    parentId: parentVorlage.id,
    parentName: parentVorlage.name,
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: parentVorlage.zonen,
  }
}

function baueAktion(id: string, titel: string): Aktion {
  return {
    id,
    titel,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vorlage-test',
    markeId: 'marke-eingebaut',
    akzentfarbe: null,
  }
}

/** Ein Projekt, wie es der LESENDE Zugang liefert - nur die Felder, die der Editor liest. */
function baueProjekt(aktionen: readonly Aktion[]): Project {
  return {
    id: 'p-393',
    name: 'Vorlagen-Probe',
    erstelltAm: '2026-11-01T00:00:00Z',
    geaendertAm: '2026-11-01T00:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [...aktionen],
    liste: [],
    letzterAusgabeName: null,
    standardSegmentdauer: 10,
    standardMarkeId: 'marke-eingebaut',
  }
}

/** Der veraenderliche Projektstand der Attrappe - `hoerer` ist die Abonnentenliste. */
interface ProjektStand {
  projekt: Project
  hoerer: Set<() => void>
}

function baueEigenschaften(
  sitzung: EditorSitzung | null,
  aktionen: readonly Aktion[] = [],
  stand?: ProjektStand,
): VorlagenEditorWurzelProps {
  // EIN Projektobjekt je Aufbau - der echte Zugang liefert ebenfalls den GESPEICHERTEN
  // Stand, nicht bei jedem `hole()` eine neue Kopie.
  const projektStand: ProjektStand = stand ?? { projekt: baueProjekt(aktionen), hoerer: new Set() }
  return {
    sichtbar: true,
    vorlagen: {
      hole: () => null,
      lade: async () => null,
      aufGeaendert: () => () => undefined,
    } as unknown as VorlagenZugang,
    zeichnen: { hole: () => null } as unknown as ZeichenZugang,
    marken: {
      hole: () => ({
        marken: [
          { id: 'marke-eingebaut', eingebaut: true, name: 'Eingebaut' },
          { id: 'marke-zwei', eingebaut: false, name: 'Zwei' },
        ],
      }),
      aufGeaendert: () => () => undefined,
    } as unknown as MarkenZugang,
    // #393: der lesende Projektzugang - die Vorschau zieht ihre Aktion hierher.
    projekt: {
      hole: () => ({ projekt: projektStand.projekt, ladefehler: null }),
      aufGeaendert: (hoerer: () => void) => {
        projektStand.hoerer.add(hoerer)
        return () => projektStand.hoerer.delete(hoerer)
      },
    } as unknown as ProjektZugang,
    sitzung: {
      holeSitzung: () => sitzung,
      uebernimmAenderung: () => undefined,
      uebernimmSpeicherstand: () => undefined,
      beendeSitzung: () => undefined,
      aufSitzungGeaendert: () => () => undefined,
    } as unknown as Sitzungshalter,
  }
}

const GERAETE: Array<{ behaelter: HTMLElement; wurzel: Root }> = []

function rendere(eigenschaften: VorlagenEditorWurzelProps): HTMLElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(VorlagenEditorWurzel, eigenschaften) as ReactElement)
  })
  GERAETE.push({ behaelter, wurzel })
  return behaelter
}

/** Wie `rendere`, gibt aber die Wurzel zurueck - fuer den Nachweis eines NEUEN Renderns. */
async function rendereMitWurzel(
  eigenschaften: VorlagenEditorWurzelProps,
): Promise<{ behaelter: HTMLElement; wurzel: Root }> {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  await act(async () => {
    wurzel.render(createElement(VorlagenEditorWurzel, eigenschaften) as ReactElement)
    await new Promise((fertig) => setTimeout(fertig, 0))
  })
  GERAETE.push({ behaelter, wurzel })
  return { behaelter, wurzel }
}

afterEach(() => {
  zeichnen.aufrufe.length = 0
  for (const geraet of GERAETE) {
    act(() => {
      geraet.wurzel.unmount()
    })
    geraet.behaelter.remove()
  }
  GERAETE.length = 0
})

describe('Vorlagen-Editor-Sitzung (#409)', () => {
  it('Der Editor-Auftritt montiert MIT offener Sitzung, ohne React #301, und zeigt den Kopf', () => {
    const parent = eigene('vorlage-test')
    const behaelter = rendere(baueEigenschaften(sitzungFest(parent)))
    // Vor dem Fix warf dieser Mount React #301 und nahm den ganzen Baum mit.
    const kopf = behaelter.querySelector('[data-testid="arbeitskopie-kopf"]')
    expect(kopf !== null).toBe(true)
    expect(kopf?.textContent ?? '').toContain('Name vorlage-test')
  })

  it('"+ Textzone (titel)" legt eine Zone in der Arbeitskopie an (kein stiller Fehler)', async () => {
    const parent = eigene('vorlage-test')
    const aenderungen: EditorSitzung[] = []
    const eigenschaften = baueEigenschaften(sitzungFest(parent))
    ;(eigenschaften.sitzung as unknown as { uebernimmAenderung: (v: EditorSitzung) => void })
      .uebernimmAenderung = (v) => aenderungen.push(v)
    const behaelter = rendere(eigenschaften)
    const knopf = [...behaelter.querySelectorAll<HTMLButtonElement>('[data-testid="zone-hinzufuegen"] button')]
      .find((b) => (b.textContent ?? '').includes('Textzone'))
    expect(knopf).toBeDefined()
    await act(async () => {
      knopf!.click()
      await new Promise((fertig) => setTimeout(fertig, 0))
    })
    // Bis 22.10.2026 bestellte der Knopf die nicht existierende Sorte
    // 'text-formatiert' - die reine Funktion warf sie ab, der Klick tat NICHTS.
    expect(aenderungen.length).toBeGreaterThan(0)
    expect(aenderungen[aenderungen.length - 1]!.arbeitskopie.zonen.length).toBe(parent.zonen.length + 1)
  })

  it('Ohne Sitzung zeigt die Wurzel die Uebersicht und wirft NICHT', () => {
    const behaelter = rendere(baueEigenschaften(null))
    expect(behaelter.querySelector('[data-testid="vorlagen-uebersicht"]') !== null).toBe(true)
  })
})

// Die DoD von #393 verlangt "Vorschau aktualisiert sich bei Aenderungen". Bis zum
// 01.11.2026 war die Live-Vorschau des Vorlagen-Editors in KEINEM Test gemountet:
// das Kabel `vorlage -> zeichneSegment` war nur am Fenster sichtbar.
describe('#393: die Live-Vorschau zeichnet bei einer Aenderung neu', () => {
  it('eine geaenderte Arbeitskopie erzeugt ein NEUES Bild (kein eingefrorener Stand)', async () => {
    const parent = eigene('vorlage-test')
    let aktuelle: EditorSitzung | null = sitzungFest(parent)
    const eigenschaften = baueEigenschaften(aktuelle)
    ;(eigenschaften.sitzung as unknown as { holeSitzung: () => EditorSitzung | null }).holeSitzung =
      () => aktuelle
    ;(
      eigenschaften.sitzung as unknown as { uebernimmAenderung: (v: EditorSitzung) => void }
    ).uebernimmAenderung = (v) => {
      aktuelle = v
    }

    const { behaelter, wurzel } = await rendereMitWurzel(eigenschaften)

    const erstes = behaelter.querySelector('[data-testid="vorschau-bild"]')
    expect(erstes).not.toBeNull()
    expect(zeichnen.aufrufe.length).toBeGreaterThan(0)
    expect(zeichnen.aufrufe.at(-1)?.vorlage.zonen.length).toBe(parent.zonen.length)
    const erstesBild = erstes?.getAttribute('src')

    const knopf = [
      ...behaelter.querySelectorAll<HTMLButtonElement>('[data-testid="zone-hinzufuegen"] button'),
    ].find((b) => (b.textContent ?? '').includes('Textzone'))
    expect(knopf).toBeDefined()
    await act(async () => {
      knopf!.click()
      await new Promise((fertig) => setTimeout(fertig, 0))
    })

    // Die Sitzung meldet die neue Arbeitskopie zurueck; der Editor rendert mit IHR.
    await act(async () => {
      wurzel.render(createElement(VorlagenEditorWurzel, eigenschaften) as ReactElement)
      await new Promise((fertig) => setTimeout(fertig, 0))
    })

    const letzte = zeichnen.aufrufe.at(-1)
    expect(letzte?.vorlage.zonen.length).toBe(parent.zonen.length + 1)
    const zweites = behaelter.querySelector('[data-testid="vorschau-bild"]')
    expect(zweites).not.toBeNull()
    expect(zweites?.getAttribute('src')).not.toBe(erstesBild)
  })

  it('zeichnet die ERSTE Aktion des Projekts und listet alle im Auswahlfeld', async () => {
    const sitzung = sitzungFest(eigene('vorlage-test'))
    const { behaelter } = await rendereMitWurzel(
      baueEigenschaften(sitzung, [baueAktion('a-1', 'Sommeraktion'), baueAktion('a-2', 'Winterpause')]),
    )

    const optionen = [...behaelter.querySelectorAll('[data-testid="vorschau-aktion-wahl"] option')]
    expect(optionen.map((o) => o.textContent)).toEqual(['Sommeraktion', 'Winterpause'])
    expect(zeichnen.aufrufe.at(-1)?.aktion.id).toBe('a-1')
  })

  it('die Wahl im Auswahlfeld zeichnet mit DIESER Aktion neu (kein Beispiel mehr)', async () => {
    const sitzung = sitzungFest(eigene('vorlage-test'))
    const { behaelter } = await rendereMitWurzel(
      baueEigenschaften(sitzung, [baueAktion('a-1', 'Sommeraktion'), baueAktion('a-2', 'Winterpause')]),
    )
    const erstesBild = behaelter.querySelector('[data-testid="vorschau-bild"]')?.getAttribute('src')

    const feld = behaelter.querySelector<HTMLSelectElement>('[data-testid="vorschau-aktion-wahl"] select')
    expect(feld).not.toBeNull()
    await act(async () => {
      feld!.value = 'a-2'
      feld!.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((fertig) => setTimeout(fertig, 0))
    })

    expect(zeichnen.aufrufe.at(-1)?.aktion.id).toBe('a-2')
    const zweitesBild = behaelter.querySelector('[data-testid="vorschau-bild"]')
    expect(zweitesBild).not.toBeNull()
    expect(zweitesBild?.getAttribute('src')).not.toBe(erstesBild)
  })

  it('ohne Aktion im Projekt zeichnet die BEISPIEL_AKTION - und das Feld sagt es', async () => {
    const sitzung = sitzungFest(eigene('vorlage-test'))
    const { behaelter } = await rendereMitWurzel(baueEigenschaften(sitzung, []))

    const optionen = [...behaelter.querySelectorAll('[data-testid="vorschau-aktion-wahl"] option')]
    expect(optionen.length).toBe(1)
    expect(optionen[0]?.textContent ?? '').toContain('keine Aktion im Projekt')
    expect(zeichnen.aufrufe.at(-1)?.aktion.id).toBe('vorschau-beispiel-aktion')
  })

  it('das AUSWAHLFELD zieht nach, wenn das Projekt sich aendert (Abonnement)', async () => {
    const sitzung = sitzungFest(eigene('vorlage-test'))
    const stand: ProjektStand = { projekt: baueProjekt([]), hoerer: new Set() }
    const { behaelter } = await rendereMitWurzel(baueEigenschaften(sitzung, [], stand))

    stand.projekt = baueProjekt([baueAktion('a-9', 'Frisch angelegt')])
    await act(async () => {
      for (const hoerer of stand.hoerer) hoerer()
      await new Promise((fertig) => setTimeout(fertig, 0))
    })

    const optionen = [...behaelter.querySelectorAll('[data-testid="vorschau-aktion-wahl"] option')]
    expect(optionen.map((o) => o.textContent)).toEqual(['Frisch angelegt'])
    expect(zeichnen.aufrufe.at(-1)?.aktion.id).toBe('a-9')
  })

  it('der Wechsel der MARKE holt die Vorschau zurueck (vorher blieb sie fuer immer leer)', async () => {
    // Gefundener Fehler: Der Vorbereitungs-Effekt hing allein an `arbeitsId`; die Wahl
    // einer anderen Marke setzte `vorbereitet` auf false und nichts stellte es wieder her.
    const sitzung = sitzungFest(eigene('vorlage-test'))
    const { behaelter } = await rendereMitWurzel(baueEigenschaften(sitzung, []))
    expect(behaelter.querySelector('[data-testid="vorschau-bild"]')).not.toBeNull()

    const feld = behaelter.querySelector<HTMLSelectElement>('[data-testid="vorschau-marke-wahl"] select')
    expect(feld).not.toBeNull()
    await act(async () => {
      feld!.value = 'marke-zwei'
      feld!.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((fertig) => setTimeout(fertig, 0))
    })

    expect(behaelter.querySelector('[data-testid="vorschau-bild"]')).not.toBeNull()
    expect(zeichnen.aufrufe.at(-1)?.marke.id).toBe('marke-zwei')
  })
})
