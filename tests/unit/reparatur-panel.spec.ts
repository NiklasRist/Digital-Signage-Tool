// Tests zu #421 - das Bedien-Panel der gefuehrten Reparatur (Fortschritt + Fix-Optionen).
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import type { ReparaturStand } from '../../src/renderer/composer/reparatur-fuehrung'
import { ReparaturPanel } from '../../src/renderer/composer/reparatur-panel.tsx'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function montiere(element: ReturnType<typeof createElement>): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(element)
  })
  return behaelter
}

function stand(stelle: KaputteStelle | null, gesamt = 1, behoben = 0): ReparaturStand {
  return { aktiv: stelle !== null, offen: stelle === null ? [] : [stelle], gesamt, behoben, zeigerIndex: 0, aktuelle: stelle }
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('ReparaturPanel (#421)', () => {
  it('zeigt Fortschritt, Stelle und die Fix-Optionen der Stelle', () => {
    const stelle: KaputteStelle = { art: 'element_asset', elementId: 'el-1', assetId: 'a', grund: 'asset_fehlt' }
    const behaelter = montiere(createElement(ReparaturPanel, { stand: stand(stelle, 3, 1), aufFix: () => {} }))

    expect(behaelter.querySelector('[data-testid="reparatur-fortschritt"]')?.textContent).toBe('1 von 3 behoben')
    expect(behaelter.querySelector('[data-testid="reparatur-stelle"]')?.textContent).toContain('element_asset')
    // Die Optionen des Falls element_asset, je ein Knopf.
    expect(behaelter.querySelector('[data-testid="reparatur-option-medium_neu_verknuepfen"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="reparatur-option-medium_ersetzen"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="reparatur-option-element_entfernen"]')).not.toBeNull()
  })

  it('ein Klick ruft aufFix mit der jeweiligen Option', () => {
    const stelle: KaputteStelle = { art: 'band_abschnitt', elementId: 'el-3', abschnittIndex: 1, aktionId: 'a', assetId: 'x', grund: 'asset_fehlt' }
    const aufFix = vi.fn()
    const behaelter = montiere(createElement(ReparaturPanel, { stand: stand(stelle), aufFix }))

    const knopf = behaelter.querySelector('[data-testid="reparatur-option-abschnitt_entfernen"]') as HTMLButtonElement
    act(() => knopf.click())
    expect(aufFix).toHaveBeenCalledWith('abschnitt_entfernen')
  })

  it('zeigt beim Einschub die Options-Knoepfe mit Beschriftung (Fall 4, v3.27)', () => {
    const stelle: KaputteStelle = { art: 'unterbrechung', elementId: 'el-3', unterbrechungIndex: 1, aktionId: 'a', assetId: 'x', grund: 'asset_fehlt' }
    const behaelter = montiere(createElement(ReparaturPanel, { stand: stand(stelle, 3, 1), aufFix: () => {} }))

    const ersetzen = behaelter.querySelector('[data-testid="reparatur-option-unterbrechung_ersetzen"]')
    const entfernen = behaelter.querySelector('[data-testid="reparatur-option-unterbrechung_entfernen"]')
    expect(ersetzen?.textContent).toBe('Andere Aktion für den Einschub wählen')
    expect(entfernen?.textContent).toBe('Einschub entfernen')
    // Kein "Element entfernen" - das Video ist heil (wie Fall 3).
    expect(behaelter.querySelector('[data-testid="reparatur-option-element_entfernen"]')).toBeNull()
  })

  it('ohne aktuelle Stelle zeigt es nichts an', () => {
    const behaelter = montiere(createElement(ReparaturPanel, { stand: stand(null), aufFix: () => {} }))
    expect(behaelter.querySelector('[data-testid="reparatur-panel"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="reparatur-panel-leer"]')).not.toBeNull()
  })
})
