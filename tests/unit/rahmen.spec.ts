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
import { readFileSync } from 'node:fs'

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
  it('zeigt vier Knöpfe in REITER_REIHENFOLGE-Reihenfolge; ein Klick ruft wechsleReiter mit der passenden ReiterId (DoD)', () => {
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

  it('zeigt immer alle vier Knöpfe, nie ausgegraut (ENTSCHIEDEN 6)', () => {
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

describe('Bauvorschriften dieser Datei (DoD-Grep-Proben)', () => {
  const QUELLE = readFileSync('src/renderer/app-shell/rahmen.tsx', 'utf8')

  // Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
  const CODEZEILEN = QUELLE.split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('enthält kein useState (benannter Test zu ENTSCHIEDEN 8 – der Rahmen hält keine Meldungen)', () => {
    expect(CODEZEILEN).not.toContain('useState')
  })

  it('enthält kein Array für Meldungen', () => {
    expect(CODEZEILEN).not.toContain('meldungen')
    expect(CODEZEILEN).not.toContain('fehlerListe')
  })

  it('enthält kein setTimeout', () => {
    expect(CODEZEILEN).not.toContain('setTimeout')
  })

  it('enthält weder rufeAuf noch abonniere noch KANAELE (Verbot: kein dritter Auswerter)', () => {
    for (const verboten of ['rufeAuf', 'abonniere', 'KANAELE']) {
      expect(CODEZEILEN).not.toContain(verboten)
    }
  })
})

describe('Bauvorschriften von src/renderer/App.tsx (DoD-Grep-Proben)', () => {
  const QUELLE = readFileSync('src/renderer/App.tsx', 'utf8')

  const CODEZEILEN = QUELLE.split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('enthält keine eigene ReiterId-Deklaration mehr, sondern importiert sie aus app-shell/reiter (DoD)', () => {
    expect(CODEZEILEN).not.toMatch(/type\s+ReiterId\s*=/)
    expect(CODEZEILEN).toContain("from './app-shell/reiter'")
  })

  it('enthält kein useState für den aktiven Reiter (DoD)', () => {
    expect(CODEZEILEN).not.toContain('useState')
  })

  it('enthält keinen IPC-Aufruf (DoD)', () => {
    for (const verboten of ['rufeAuf', 'abonniere', 'KANAELE', 'window.api']) {
      expect(CODEZEILEN).not.toContain(verboten)
    }
  })
})