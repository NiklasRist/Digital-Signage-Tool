// [composer] Die Ansicht „Eigenschaften" im Sidepanel: was der GEWAEHLTE Block ist und
// was er fuers Ganze bedeutet.
//
// WARUM SIE DIE BESTEHENDE BEDIENUNG MONTIERT (02.11.2026): Dauer-Regler, Trim-Griffe,
// Band-Zugang und Entfernen gibt es seit #249 (`ElementBedienung`) - sie lagen nur in der
// versteckten Wiedergabeliste und waren damit UNERREICHBAR. Diese Ansicht baut keine zweite
// Bedienung; sie holt dieselbe hervor und stellt die FOLGE darueber (`eigenschaften.ts`).
//
// WAS SIE NICHT TUT: rechnen. Modell, Folge und Position kommen aus bestehenden Funktionen.

import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import type { KaputteStelle } from './kaputt-erkennung'
import { baueListenZeilen, type ListenZeileModell } from './liste-ansicht'
import { berechneFolge, folgeText } from './eigenschaften'

export interface EigenschaftenAnsichtEigenschaften {
  projekt: Project
  /** Die IDs der gewaehlten Elemente (#392) - die Ansicht zeigt das ERSTE. */
  ausgewaehlt: readonly string[]
  /** Die kaputten Stellen fuer die Markierung des Band-Zugangs - unveraendert durchgereicht. */
  stellen: readonly KaputteStelle[]
  /** Die Bedienung EINER Zeile (Montage aus der Wurzel, damit dort EINE Quelle bleibt). */
  bedienung: (modell: ListenZeileModell) => JSX.Element
}

export function EigenschaftenAnsicht(p: EigenschaftenAnsichtEigenschaften): JSX.Element {
  if (p.ausgewaehlt.length === 0) {
    return (
      <p data-testid="eigenschaften-leer">
        In der Zeitleiste einen Block wählen – Dauer, Trim, Unterbrechungen und Band stehen dann
        hier.
      </p>
    )
  }

  const zeilen = baueListenZeilen(p.projekt, p.stellen, null)
  const modell = zeilen.find((zeile) => zeile.elementId === p.ausgewaehlt[0])
  const element = p.projekt.liste.find((eintrag) => eintrag.id === p.ausgewaehlt[0])

  if (modell === undefined || element === undefined) {
    return (
      <p data-testid="eigenschaften-weg">
        Dieser Block steht nicht mehr im Projekt – in der Zeitleiste neu wählen.
      </p>
    )
  }

  return (
    <div data-testid="eigenschaften" data-element-id={modell.elementId}>
      {/* Der Kopf sagt, WAS man gerade aendert - ohne ihn bedient man einen anonymen Regler. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span
          data-testid="eigenschaften-titel"
          style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={modell.bezeichnung}
        >
          {modell.bezeichnung}
        </span>
        <span data-testid="eigenschaften-position" style={{ flex: '0 0 auto', fontSize: 11, color: '#6f6f7a' }}>
          {`Block ${modell.position} von ${p.projekt.liste.length}`}
        </span>
      </div>

      {/* DIE FOLGE: nicht „10 s", sondern was 10 s fuer das Video bedeuten. */}
      <div
        data-testid="eigenschaften-folge"
        style={{ fontSize: 11, color: '#9aa4b2', margin: '2px 0 6px' }}
      >
        {folgeText(berechneFolge(p.projekt, element))}
      </div>

      {p.ausgewaehlt.length > 1 && (
        <p data-testid="eigenschaften-mehrfach" style={{ fontSize: 11, color: '#6f6f7a' }}>
          {`${p.ausgewaehlt.length} Blöcke gewählt – hier steht der erste.`}
        </p>
      )}

      {/* DIE BESTEHENDE BEDIENUNG - keine zweite.#249 bleibt die eine Quelle. */}
      {p.bedienung(modell)}
    </div>
  )
}
