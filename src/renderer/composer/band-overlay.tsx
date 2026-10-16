// S3 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N3).
//
// Das Band-Bearbeitungs-Overlay (#425, montierte #253/M7-60) als eigener
// Baustein: Rahmen + `EinblendungAnsicht`. Es haelt KEINEN Zustand - die Wurzel
// reicht das VIDEO-Element, die Aktions-Bibliothek, die Vorlagen und die bereits
// gerechneten kaputten Stellen herein. Die Uebernahme (EIN Undo-Schritt ueber
// den Wrapped-Zugang, #243) und der Meldeweg bleiben in der Wurzel.

import type { JSX } from 'react'

import type { Aktion } from '../../shared/contracts/aktion'
import type { Listenelement } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { EinblendungAnsicht } from './einblendung-ansicht.tsx'
import type { KaputteStelle } from './kaputt-erkennung'
import { OverlayRahmen } from './overlay-rahmen.tsx'

export interface BandOverlayEigenschaften {
  element: Listenelement
  aktionen: readonly Aktion[]
  vorlagen: readonly Vorlage[]
  stellen: readonly KaputteStelle[]
  aufUebernommen: (element: Listenelement) => void
  aufAbbrechen: () => void
  aufFehler: (code: string, meldung: string) => void
}

export function BandOverlay(p: BandOverlayEigenschaften): JSX.Element {
  return (
    <OverlayRahmen
      testid="composer-overlay-band"
      panelStil={{ minWidth: 460, maxHeight: '80vh', overflow: 'auto' }}
    >
      <EinblendungAnsicht
        element={p.element}
        aktionen={p.aktionen}
        vorlagen={p.vorlagen}
        stellen={p.stellen}
        aufUebernommen={p.aufUebernommen}
        aufAbbrechen={p.aufAbbrechen}
        aufFehler={p.aufFehler}
      />
    </OverlayRahmen>
  )
}
