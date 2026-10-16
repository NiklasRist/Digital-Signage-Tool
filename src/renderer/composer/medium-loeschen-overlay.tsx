// S3 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N3).
//
// Das Bestaetigungs-Overlay des Medium-Loeschens (#229/#259) als eigener
// Baustein: Rahmen + Anzeige. Es haelt KEINEN Zustand. Die beiden Schreibwege
// (`loescheMedium` aus dem composer, `gibVideoHandlesFrei` aus #246) sind reine
// Modulfunktionen und werden HIER hereingereicht - der Auftrag reist ohnehin
// ueber den Torwaechter, dieser Baustein wartet nicht.

import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import { gibVideoHandlesFrei } from '../gemeinsam/video-handles'
import { loescheMedium } from './medium-loeschen'
import { MediumLoeschen } from './medium-loeschen.tsx'
import { OverlayRahmen } from './overlay-rahmen.tsx'

export interface MediumLoeschenOverlayEigenschaften {
  projekt: Project
  assetId: string
  aufErledigt: () => void
  aufAbgebrochen: () => void
  aufFehler: (code: string, meldung: string) => void
}

export function MediumLoeschenOverlay(p: MediumLoeschenOverlayEigenschaften): JSX.Element {
  return (
    <OverlayRahmen testid="composer-overlay">
      <MediumLoeschen
        projekt={p.projekt}
        assetId={p.assetId}
        loescheMedium={loescheMedium}
        gibVideoHandlesFrei={gibVideoHandlesFrei}
        aufErledigt={p.aufErledigt}
        aufAbgebrochen={p.aufAbgebrochen}
        aufFehler={p.aufFehler}
      />
    </OverlayRahmen>
  )
}
