// S1 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N1).
//
// Der eine Backdrop samt dunklem Panel, den die vier Overlays der Composer-Wurzel
// bisher WORTGLEICH inline trugen (Render, Export, Medium-Loeschen, Band). Reine
// Praesentation: dieses Bauteil haelt keinen Zustand und kennt weder Projekt noch
// Lage. Der Testid kommt herein, weil der Treiber ihn misst (Lektion #403).

import type { CSSProperties, JSX, ReactNode } from 'react'

export interface OverlayRahmenEigenschaften {
  /** Der Testid des Backdrops - bisher `composer-overlay` bzw. `composer-overlay-band`. */
  testid: string
  /**
   * Abweichende Masse des Innen-Panels. Standard ist exakt der bisherige Rahmen
   * (`background #1f1f1f, padding 16, minWidth 360`); die Band-Ansicht setzt
   * `minWidth 460, maxHeight 80vh, overflow auto`.
   */
  panelStil?: CSSProperties
  children: ReactNode
}

export function OverlayRahmen(p: OverlayRahmenEigenschaften): JSX.Element {
  return (
    <div
      data-testid={p.testid}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ background: '#1f1f1f', padding: 16, minWidth: 360, ...p.panelStil }}>
        {p.children}
      </div>
    </div>
  )
}
