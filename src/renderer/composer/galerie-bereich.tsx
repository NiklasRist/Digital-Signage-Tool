// S4 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N4).
//
// Die MITTLERE Region: die Galerie als lebende Datei-Drop-Zone (#335) samt der
// #418-Auswahl. Gesteuerte Praesentation - dieses Bauteil haelt KEINEN Zustand; die
// WIRKUNG des Drops (Dateien einreihen, Bericht setzen) liegt in der Wurzel und kommt
// als `aufDateiDrop` herein (Ownership, #259). Die Testids sind zeichengleich zum
// bisherigen Inline-Block (der Treiber misst sie, Lektion #403).

import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import { AssetGalerie } from './asset-galerie'

export interface GalerieBereichEigenschaften {
  projekt: Project | null
  /** #418: das hervorgehobene Medium (nach dem Import standardmaessig das neue Video). */
  ausgewaehltesId: string | null
  aufWaehlen: (assetId: string) => void
  /** Die Wurzel nimmt die fallengelassenen Dateien - Wirkung und Zustand liegen dort. */
  aufDateiDrop: (dateien: File[]) => void
}

export function GalerieBereich(p: GalerieBereichEigenschaften): JSX.Element {
  return (
    <div
      data-testid="composer-galerie"
      style={{ flex: '1 1 auto', minHeight: 120, borderTop: '1px solid #444' }}
      // #335: Die Drop-Zone der Medien-Bibliothek. preventDefault unterdrückt das
      // Öffnen der Datei im Fenster; ohne Bearbeitung ist das ZIEHEN hier überhaupt
      // erst ein Drop auf DIESEN Bereich.
      onDragOver={(ereignis) => {
        ereignis.preventDefault()
      }}
      onDrop={(ereignis) => {
        ereignis.preventDefault()
        p.aufDateiDrop(Array.from(ereignis.dataTransfer.files))
      }}
    >
      {p.projekt === null ? (
        <AssetGalerie projekt={null} />
      ) : (
        <AssetGalerie
          projekt={p.projekt}
          ausgewaehltesId={p.ausgewaehltesId}
          aufWaehlen={p.aufWaehlen}
        />
      )}
    </div>
  )
}
