// Verhaltenstests zu #195 – der Rahmen (rahmen.tsx, jsdom).
//
// Der Rahmen ist die Anordnung aus Reiterleiste, anwendungsweiter Meldungsfläche,
// Reiterinhalten und Warteschlangen-Leiste. Die reine Montage-Regel (rahmen-montage.ts)
// wird in rahmen-montage.spec.ts ohne Browser geprüft; hier geht es um das JSX: Wo
// sitzt was, was bleibt montiert, was wird genau einmal gerufen.
//
// Der Reiter-Zustand (#194) läuft ECHT: holeReiter() liefert den Anfangswert, und
// die Knöpfe rufen wechsleReiter. `setzeReiterZustandZurueck` setzt den Modul-Zustand
// zwischen den Tests zurück (NUR für Tests exportiert, s. #194).
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, useEffect, type JSX, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import * as reiterModul from '../../src/renderer/app-shell/reiter'
import { REITER_REIHENFOLGE } from '../../src/renderer/app-shell/reiter'
import {
  Rahmen,
  type RahmenEigenschaften,
  type ReiterInhalt,
} from '../../src/renderer/app-shell/rahmen'
import type { ReiterId } from '../../src/renderer/app-shell/reiter'

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
// Vitest mit jsdom erkennt es nicht automatisch - also hier setzen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function einfacherInhalt(testid: string): ReiterInhalt {
  return function Inhalt(): JSX.Element {
    return createElement('div', { 'data-testid': testid })
  }
}

/** Ein Reiterinhalt, dessen Aufbau-Effekt einen Spion ruft – zählt die Aufbauten. */
function inhaltMitAufbau(aufbau: () => void): ReiterInhalt {
  return function Inhalt(): JSX.Element {
    useEffect(() => {
      aufbau()
    }, [aufbau])
    return createElement('div', { 'data-testid': 'inhalt-aufbau' })
  }
}

function vollstaendigeInhalte(
  ueberschreibungen: Partial<Record<ReiterId, ReiterInhalt>> = {},
): Record<ReiterId, ReiterInhalt> {
  const inhalte: Record<ReiterId, ReiterInhalt> = {
    zusammenstellen: einfacherInhalt('inhalt-zusammenstellen'),
    aktionen: einfacherInhalt('inhalt-aktionen'),
    vorlagen: einfacherInhalt('inhalt-vorlagen'),
    projekte: einfacherInhalt('inhalt-projekte'),
  }
  return { ...inhalte, ...ueberschreibungen }
}

function eigenschaften(teil: Partial<RahmenEigenschaften> = {}): RahmenEigenschaften {
  return {
    inhalte: vollstaendigeInhalte(),
    warteschlangenLeiste: () => createElement('div', { 'data-testid': 'leiste' }),
    ...teil,
  }
}

interface Geraet {
  behaelter: HTMLDivElement
  fertig: () => void
}

const aktiveGeraete: Array<Geraet & { wurzel: Root }> = []

function rendere(eig: RahmenEigenschaften): Geraet {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(Rahmen, eig) as ReactElement)
  })
  const geraet = {
    behaelter,
    wurzel,
    fertig: () => {
      // Idempotent: nach dem Abbau passiert nichts mehr – auch nicht im afterEach.
      if (behaelter.isConnected) {
        act(() => {
          wurzel.unmount()
        })
        behaelter.remove()
      }
    },
  }
  aktiveGeraete.push(geraet)
  return geraet
}

beforeEach(() => {
  reiterModul.setzeReiterZustandZurueck()
})

afterEach(() => {
  for (const geraet of aktiveGeraete) {
    geraet.fertig()
  }
  aktiveGeraete.length = 0
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('Reiterleiste (DoD)', () => {
  it('#456: zeigt VIER Knöpfe in REITER_REIHENFOLGE-Reihenfolge; ein Klick ruft wechsleReiter mit der passenden ReiterId', () => {
    const spion = vi.spyOn(reiterModul, 'wechsleReiter')
    const { behaelter, fertig } = rendere(eigenschaften())

    const knöpfe = behaelter.querySelectorAll('button[role="tab"]')
    expect(knöpfe).toHaveLength(4)
    expect(Array.from(knöpfe).map((k) => k.getAttribute('data-testid'))).toEqual(
      REITER_REIHENFOLGE.map((reiter) => `reiter-${reiter}`),
    )
    expect(Array.from(knöpfe).map((k) => k.textContent)).toEqual([
      'Zusammenstellen',
      'Aktionen',
      'Vorlagen',
      'Projekte',
    ])

    const vorlagenKnopf = behaelter.querySelector(
      '[data-testid="reiter-vorlagen"]',
    ) as HTMLButtonElement
    act(() => {
      vorlagenKnopf.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(spion).toHaveBeenCalledTimes(1)
    expect(spion).toHaveBeenCalledWith('vorlagen')

    fertig()
  })

  it('markiert GENAU den aktiven Reiter mit aria-selected=true', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const aktiv = Array.from(behaelter.querySelectorAll('button[role="tab"]')).filter(
      (knopf) => knopf.getAttribute('aria-selected') === 'true',
    )
    expect(aktiv.map((k) => k.getAttribute('data-testid'))).toEqual([
      `reiter-${reiterModul.holeReiter()}`,
    ])
    fertig()
  })

  it('zeigt immer alle fünf Knöpfe, nie ausgegraut (ENTSCHIEDEN 6)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const knöpfe = behaelter.querySelectorAll('button[role="tab"]')
    expect(knöpfe).toHaveLength(4)
    for (const knopf of knöpfe) {
      expect(knopf.hasAttribute('disabled')).toBe(false)
    }
    fertig()
  })
})

describe('Besuchte Reiter bleiben montiert (DoD, ENTSCHIEDEN 2)', () => {
  it('baut den Inhalt von vorlagen nach projekte → vorlagen → projekte genau einmal auf (DoD)', () => {
    const aufbauVorlagen = vi.fn()
    const inhalte = vollstaendigeInhalte({
      vorlagen: inhaltMitAufbau(aufbauVorlagen),
    })
    const { fertig } = rendere(eigenschaften({ inhalte }))

    expect(aufbauVorlagen).toHaveBeenCalledTimes(0)

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(aufbauVorlagen).toHaveBeenCalledTimes(1)

    act(() => {
      reiterModul.wechsleReiter('projekte')
    })
    // Beim Zurückwechseln wird vorlagen NICHT neu aufgebaut – nur versteckt.
    expect(aufbauVorlagen).toHaveBeenCalledTimes(1)

    fertig()
  })

  it('baut den Inhalt von zusammenstellen nach marken und zurück GENAU EINMAL auf (#314: die Montage-Zusage gilt für den fünften Reiter)', () => {
    const aufbau = vi.fn()
    const inhalte = vollstaendigeInhalte({
      zusammenstellen: inhaltMitAufbau(aufbau),
    })
    const { fertig } = rendere(eigenschaften({ inhalte }))

    // Start: 'projekte' (setzeReiterZustandZurueck). Wechsel nach marken baut den
    // zusammenstellen-Inhalt noch NICHT:
    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(aufbau).toHaveBeenCalledTimes(0)

    act(() => {
      reiterModul.wechsleReiter('zusammenstellen')
    })
    expect(aufbau).toHaveBeenCalledTimes(1)

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    // Der ZUSAMMENSTELLEN-Inhalt bleibt montiert (versteckt), wird NICHT neu aufgebaut:
    expect(aufbau).toHaveBeenCalledTimes(1)

    fertig()
  })

  it('der versteckte Inhalt ist weiterhin im DOM und trägt hidden; der aktive nicht (DoD)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    act(() => {
      reiterModul.wechsleReiter('projekte')
    })

    const projekte = behaelter.querySelector('[data-testid="rahmen-inhalt-projekte"]')
    const vorlagen = behaelter.querySelector('[data-testid="rahmen-inhalt-vorlagen"]')

    expect(vorlagen).not.toBeNull()
    expect(vorlagen?.hasAttribute('hidden')).toBe(true)
    expect(projekte?.hasAttribute('hidden')).toBe(false)

    // Ein nie besuchter Reiter wird gar nicht erst aufgebaut (ENTSCHIEDEN 2).
    expect(behaelter.querySelector('[data-testid="rahmen-inhalt-aktionen"]')).toBeNull()
    expect(
      behaelter.querySelector('[data-testid="rahmen-inhalt-zusammenstellen"]'),
    ).toBeNull()

    fertig()
  })

  it('jede Inhaltsfunktion bekommt sichtbar: true genau dann, wenn ihr Reiter aktiv ist (DoD)', () => {
    const merker: Record<ReiterId, boolean | undefined> = {
      zusammenstellen: undefined,
      aktionen: undefined,
      vorlagen: undefined,
      projekte: undefined,
    }
    function merkerInhalt(key: ReiterId): ReiterInhalt {
      return function Inhalt({ sichtbar }: { sichtbar: boolean }): JSX.Element {
        merker[key] = sichtbar
        return createElement('div', { 'data-testid': `merk-${key}` })
      }
    }
    const inhalte: Record<ReiterId, ReiterInhalt> = {
      zusammenstellen: merkerInhalt('zusammenstellen'),
      aktionen: merkerInhalt('aktionen'),
      vorlagen: merkerInhalt('vorlagen'),
      projekte: merkerInhalt('projekte'),
    }
    const { fertig } = rendere(eigenschaften({ inhalte }))

    // Start (holeReiter(): 'projekte'): nur projekte ist aufgebaut und sichtbar.
    expect(merker.projekte).toBe(true)
    expect(merker.zusammenstellen).toBeUndefined()
    expect(merker.aktionen).toBeUndefined()
    expect(merker.vorlagen).toBeUndefined()

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(merker.vorlagen).toBe(true)
    expect(merker.projekte).toBe(false)

    act(() => {
      reiterModul.wechsleReiter('projekte')
    })
    expect(merker.projekte).toBe(true)
    expect(merker.vorlagen).toBe(false)

    fertig()
  })
})

describe('Warteschlangen-Leiste (DoD)', () => {
  it('wird bei jedem Rendervorgang genau einmal aufgerufen und liegt im DOM außerhalb aller Reiterinhalte (DoD)', () => {
    const aufrufeLeiste = vi.fn()
    const leiste = (): JSX.Element => {
      aufrufeLeiste()
      return createElement('div', { 'data-testid': 'leiste' })
    }
    const { behaelter, fertig } = rendere(eigenschaften({ warteschlangenLeiste: leiste }))

    expect(aufrufeLeiste).toHaveBeenCalledTimes(1)

    const leisteEl = behaelter.querySelector('[data-testid="leiste"]')
    expect(leisteEl).not.toBeNull()
    // Elternkette: direktes Kind der Wurzel, nicht innerhalb eines Reiterinhalts.
    expect(leisteEl?.parentElement).toBe(behaelter.firstElementChild)
    expect(leisteEl?.closest('[data-testid="rahmen-inhalt-bereich"]')).toBeNull()
    expect(leisteEl?.closest('[data-testid^="rahmen-inhalt-"]')).toBeNull()

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(aufrufeLeiste).toHaveBeenCalledTimes(2)

    fertig()
  })

  it('bleibt über zwei Reiterwechsel hinweg dieselbe Instanz (DoD)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const leisteEl = behaelter.querySelector('[data-testid="leiste"]')

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    act(() => {
      reiterModul.wechsleReiter('projekte')
    })

    expect(behaelter.querySelector('[data-testid="leiste"]')).toBe(leisteEl)

    fertig()
  })
})

describe('Meldungsfläche (DoD, ENTSCHIEDEN 8)', () => {
  it('wird bei jedem Rendervorgang genau einmal aufgerufen und liegt außerhalb aller Reiterinhalte, unmittelbar nach der Reiterleiste (DoD)', () => {
    const aufrufeMeldung = vi.fn()
    const meldung = (): JSX.Element => {
      aufrufeMeldung()
      return createElement('div', { 'data-testid': 'meldung' })
    }
    const { behaelter, fertig } = rendere(eigenschaften({ meldungsFlaeche: meldung }))

    expect(aufrufeMeldung).toHaveBeenCalledTimes(1)

    const nav = behaelter.querySelector('[role="tablist"]')
    const meldungEl = behaelter.querySelector('[data-testid="meldung"]')
    expect(meldungEl).not.toBeNull()
    // Elternkette: direktes Kind der Wurzel, nicht innerhalb eines Reiterinhalts.
    expect(meldungEl?.parentElement).toBe(behaelter.firstElementChild)
    expect(meldungEl?.closest('[data-testid="rahmen-inhalt-bereich"]')).toBeNull()
    // Geschwisterfolge: unmittelbar nach der Reiterleiste.
    expect(meldungEl?.previousElementSibling).toBe(nav)

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(aufrufeMeldung).toHaveBeenCalledTimes(2)

    fertig()
  })

  it('bleibt über zwei Reiterwechsel hinweg dieselbe Instanz (DoD)', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({ meldungsFlaeche: () => createElement('div', { 'data-testid': 'meldung' }) }),
    )
    const meldungEl = behaelter.querySelector('[data-testid="meldung"]')

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    act(() => {
      reiterModul.wechsleReiter('projekte')
    })

    expect(behaelter.querySelector('[data-testid="meldung"]')).toBe(meldungEl)

    fertig()
  })

  it('ohne meldungsFlaeche ist der Bereich unter der Reiterleiste leer (Grep-freier Test, DoD)', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({ meldungsFlaeche: undefined }),
    )

    const nav = behaelter.querySelector('[role="tablist"]')
    expect(nav).not.toBeNull()

    // Unmittelbar auf die Reiterleiste folgt der Inhaltsbereich – kein Element und
    // kein Text dazwischen (nextSibling === nextElementSibling heißt: kein Textknoten).
    const nachfolger = nav?.nextElementSibling
    expect(nachfolger?.getAttribute('data-testid')).toBe('rahmen-inhalt-bereich')
    expect(nav?.nextSibling).toBe(nachfolger)

    fertig()
  })
})

describe('Speicher-Hinweis (DoD)', () => {
  it('ohne speicherHinweis enthält die Reiterleiste keinen zusätzlichen Text (DoD)', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({ speicherHinweis: undefined }),
    )

    expect(behaelter.textContent).not.toContain('gespeichert')
    expect(behaelter.textContent).not.toContain('nicht gespeichert')

    const nav = behaelter.querySelector('[role="tablist"]')
    // Die Reiterleiste trägt ausschließlich die vier Reiterbeschriftungen.
    expect(nav?.textContent?.trim()).toBe(
      'ZusammenstellenAktionenVorlagenProjekte',
    )

    fertig()
  })

  it('speicherHinweis sitzt in der Reiterleiste und überlebt einen Reiterwechsel', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({
        speicherHinweis: () =>
          createElement('span', { 'data-testid': 'hinweis' }, 'nicht gespeichert'),
      }),
    )

    const nav = behaelter.querySelector('[role="tablist"]')
    const hinweis = behaelter.querySelector('[data-testid="hinweis"]')
    expect(hinweis).not.toBeNull()
    expect(hinweis?.parentElement).toBe(nav)

    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(behaelter.querySelector('[data-testid="hinweis"]')).toBe(hinweis)

    fertig()
  })
})

describe('Abbau des Rahmens (DoD)', () => {
  it('meldet das Abo auf aufReiterGeaendert ab – nach dem Abbau löst wechsleReiter keinen Rendervorgang mehr aus (DoD)', () => {
    const aufrufeLeiste = vi.fn()
    const leiste = (): JSX.Element => {
      aufrufeLeiste()
      return createElement('div', { 'data-testid': 'leiste' })
    }
    const { fertig } = rendere(eigenschaften({ warteschlangenLeiste: leiste }))
    expect(aufrufeLeiste).toHaveBeenCalledTimes(1)

    // Solange der Rahmen steht, rendert jeder Reiterwechsel neu.
    act(() => {
      reiterModul.wechsleReiter('vorlagen')
    })
    expect(aufrufeLeiste).toHaveBeenCalledTimes(2)

    fertig()
    expect(aufrufeLeiste).toHaveBeenCalledTimes(2)

    // Nach dem Abbau ist das Abo beendet: kein Hörer, kein dispatch, kein Rendern.
    act(() => {
      reiterModul.wechsleReiter('aktionen')
    })
    expect(aufrufeLeiste).toHaveBeenCalledTimes(2)
  })
})


describe('Marken-Ansicht ueber der Reiterflaeche (#456)', () => {
  function mitLeiste(teil: Partial<RahmenEigenschaften> = {}): RahmenEigenschaften {
    return eigenschaften({
      projektleiste: (schalt) =>
        createElement('button', {
          'data-testid': 'projektleiste-marken',
          'aria-pressed': String(schalt.markenOffen),
          onClick: () => schalt.aufMarken('m-1'),
        }, 'Marken'),
      markenAnsicht: (schalt) =>
        createElement('div', { 'data-testid': 'marken-ansicht' },
          createElement('span', { 'data-testid': 'marken-ansicht-marke' }, schalt.markeId),
          createElement('button', {
            'data-testid': 'marken-zurueck',
            onClick: schalt.aufSchliessen,
          }, 'Zurueck')),
      ...teil,
    })
  }

  it('der Knopf oeffnet die Ansicht; die Reiter werden VERDECKT, bleiben aber montiert', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()

    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })

    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).not.toBeNull()
    // TK 9.14.2: besuchte Reiter bleiben montiert - nur verdeckt.
    const reiterFlaechen = Array.from(
      behaelter.querySelectorAll('[data-testid^="rahmen-inhalt-"]'),
    ).filter((knoten) => {
      const id = knoten.getAttribute('data-testid')
      return id !== 'rahmen-inhalt-marken' && id !== 'rahmen-inhalt-bereich'
    })
    expect(reiterFlaechen.length).toBeGreaterThan(0)
    for (const flaeche of reiterFlaechen) {
      expect((flaeche as HTMLElement).hidden).toBe(true)
    }
    fertig()
  })

  it('die Ansicht bekommt die Marke, deren Name geklickt wurde', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht-marke"]')?.textContent).toBe('m-1')
    fertig()
  })

  it('#456: der Name ist ein Umschalter - der ZWEITE Klick fuehrt zurueck ins Projekt', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    const name = () => behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!
    act(() => name().click())
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).not.toBeNull()
    act(() => name().click())
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()
    // Und wieder auf: er schaltet, er klemmt nicht.
    act(() => name().click())
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).not.toBeNull()
    fertig()
  })

  it('#456: eine ANDERE Marke zu oeffnen WECHSELT, statt zu schliessen', () => {
    const { behaelter, fertig } = rendere(eigenschaften({
      projektleiste: (schalt) =>
        createElement('div', null,
          createElement('button', { 'data-testid': 'marke-a', onClick: () => schalt.aufMarken('m-1') }, 'A'),
          createElement('button', { 'data-testid': 'marke-b', onClick: () => schalt.aufMarken('m-2') }, 'B')),
      markenAnsicht: (schalt) =>
        createElement('div', { 'data-testid': 'marken-ansicht' },
          createElement('span', { 'data-testid': 'marken-ansicht-marke' }, schalt.markeId)),
    }))
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="marke-a"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht-marke"]')?.textContent).toBe('m-1')
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="marke-b"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht-marke"]')?.textContent).toBe('m-2')
    fertig()
  })

  it('Zurueck und ein Klick auf einen Reiter schliessen die Ansicht', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="marken-zurueck"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()

    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="reiter-vorlagen"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()
    fertig()
  })

  it('auch ein PROGRAMMATISCHER Reiterwechsel schliesst die Ansicht (Projekt oeffnen, Reparatur)', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).not.toBeNull()
    // Kein Klick auf einen Reiter - der Wechsel kommt aus dem Modul (#194).
    act(() => {
      reiterModul.wechsleReiter('zusammenstellen')
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()
    fertig()
  })

  it('auch der SCHON aktive Reiter schliesst die Ansicht (wechsleReiter meldet dann nichts)', () => {
    const { behaelter, fertig } = rendere(mitLeiste())
    const aktiv = behaelter.querySelector('[role="tab"][aria-selected="true"]') as HTMLButtonElement
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).not.toBeNull()
    act(() => {
      aktiv.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(behaelter.querySelector('[data-testid="marken-ansicht"]')).toBeNull()
    fertig()
  })

  it('OHNE markenAnsicht bleibt die Reiterflaeche sichtbar - kein leeres Fenster', () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({
        projektleiste: (schalt) =>
          createElement('button', {
            'data-testid': 'projektleiste-marken',
            onClick: () => schalt.aufMarken('m-1'),
          }, 'Marken'),
      }),
    )
    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    const aktiv = behaelter.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement
    const flaeche = behaelter.querySelector(`[data-testid="rahmen-inhalt-${aktiv.getAttribute('data-testid')!.replace('reiter-', '')}"]`) as HTMLElement
    expect(flaeche.hidden).toBe(false)
    fertig()
  })
})
