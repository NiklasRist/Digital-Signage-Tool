// Issue #256 (M7-64) - uebergabe.tsx: die dünne Anzeige, die EINES der beiden
// Auswahl-Overlays einsetzt - oder nichts.
//
// ENTSCHIEDEN 7: Diese Anzeige rechnet nichts und lädt nichts. Sie ruft
// `overlayFuer`, `elementIdFuer`, `abschnittIndexFuer` - und sonst KEINE Funktion
// dieses Issues; insbesondere nicht `nimmUebergabeEntgegen`, nicht
// `beendeLaufende`, nicht `schliesseFixAb` und nicht `fuehreMedienImportAus`.
// Sie meldet über die drei Rückrufe nach oben (wer die Ansicht auch handeln
// ließe, könnte sie nicht mehr ohne die halbe Shell testen).
//
// ENTSCHIEDEN 9: Liefert ein Rückweg `ok: false`, meldet das Overlay über
// `aufFehler` und bleibt offen; erst `aufAbgeschlossen` oder `aufAbgebrochen`
// beendet - beides entscheidet der AUFRUFER (M7-69-Belegung).
//
// Fehlerpfade: `pa.projekt === null` liefert `null` - kein Overlay ohne Projekt
// (M7-09 und M7-10 verlangen ein Project), keine eigene Meldung, kein Ersatz.

import type { JSX } from 'react'
import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FixWirkung } from '../composer/reparatur-optionen'
import type { ShellReparatur } from './reparatur-fuehrung-shell'
import { AssetAuswahl, type AssetAuswahlEigenschaften } from './asset-auswahl'
import { AktionsAuswahl, type AktionsAuswahlEigenschaften } from './aktions-auswahl'
import {
  UnterbrechungsAuswahl,
  type UnterbrechungsAuswahlEigenschaften,
} from './unterbrechungs-auswahl'
import { overlayFuer, elementIdFuer, abschnittIndexFuer, unterbrechungsIndexFuer } from './uebergabe'

export interface UebergabeOverlayEigenschaften {
  /** Die gehaltene Lage (M7-64 `reparaturhalter`). Diese Datei haelt sie NICHT selbst. */
  lage: ShellReparatur
  /** Das geladene Projekt. null = kein Overlay (s. Fehlerpfade). */
  projekt: Project | null

  /** Die drei Abschluss-Funktionen aus #133 – als PARAMETER, nicht importiert (E1). */
  schliesseMediumFixAb: (elementId: string, neueAssetId: string) => Promise<Ergebnis<FixWirkung>>
  schliesseAktionsFixAb: (elementId: string, neueAktionId: string) => Promise<Ergebnis<FixWirkung>>
  schliesseAbschnittsFixAb: (
    elementId: string,
    abschnittIndex: number,
    neueAktionId: string,
    projekt: Project,
  ) => Promise<Ergebnis<FixWirkung>>
  /** Rückweg für Fall 4 (v3.27): tauscht die `aktionRef` GENAU EINES Einschubs. */
  schliesseUnterbrechungsFixAb: (
    elementId: string,
    unterbrechungIndex: number,
    neueAktionId: string,
    projekt: Project,
  ) => Promise<Ergebnis<FixWirkung>>

  /** Der Nutzer hat gewaehlt und der Rückweg hat bestätigt. Der Aufrufer ruft `schliesseFixAb`. */
  aufAbgeschlossen: (wirkung: FixWirkung) => void
  /** Abbruch. Der Aufrufer ruft `beendeLaufende`; es wurde nichts geschrieben. */
  aufAbgebrochen: () => void
  aufFehler: (code: string, meldung: string) => void
}

/** Setzt EINES der beiden Auswahl-Overlays ein – oder nichts. */
export function UebergabeOverlay(p: UebergabeOverlayEigenschaften): JSX.Element | null {
  const art = overlayFuer(p.lage.laufendeUebergabe)
  if (art === 'keins' || p.projekt === null) {
    // `keins` heißt NICHTS gezeigt; `projekt === null` heißt ebenfalls NICHTS - und
    // kein Ersatzobjekt erfunden (Fehlerpfade).
    return null
  }
  const elementId = elementIdFuer(p.lage.laufendeUebergabe)
  if (elementId === null) {
    // Defensiv unmöglich: `art !== 'keins'` garantiert ein Ziel mit elementId.
    return null
  }

  if (art === 'unterbrechungs-auswahl') {
    const unterbrechungIndex = unterbrechungsIndexFuer(p.lage.laufendeUebergabe)
    if (unterbrechungIndex === null) {
      // Defensiv unmöglich: `art === 'unterbrechungs-auswahl'` garantiert das Ziel.
      return null
    }
    const eigenschaften: UnterbrechungsAuswahlEigenschaften = {
      elementId,
      unterbrechungIndex,
      projekt: p.projekt,
      schliesseUnterbrechungsFixAb: p.schliesseUnterbrechungsFixAb,
      aufAbgeschlossen: p.aufAbgeschlossen,
      aufAbgebrochen: p.aufAbgebrochen,
      aufFehler: p.aufFehler,
    }
    return <UnterbrechungsAuswahl {...eigenschaften} />
  }

  if (art === 'asset-auswahl') {
    const eigenschaften: AssetAuswahlEigenschaften = {
      elementId,
      projekt: p.projekt,
      schliesseMediumFixAb: p.schliesseMediumFixAb,
      aufAbgeschlossen: p.aufAbgeschlossen,
      aufAbgebrochen: p.aufAbgebrochen,
      aufFehler: p.aufFehler,
    }
    return <AssetAuswahl {...eigenschaften} />
  }

  // art === 'aktions-auswahl': der Band-Abschnitt wird UNVERÄNDERT durchgereicht -
  // nicht in `null` umgewandelt (DoD: `{ abschnittIndex: 2 }` trifft das Overlay als 2).
  const abschnittIndex = abschnittIndexFuer(p.lage.laufendeUebergabe)
  const eigenschaften: AktionsAuswahlEigenschaften = {
    elementId,
    abschnittIndex,
    projekt: p.projekt,
    schliesseAktionsFixAb: p.schliesseAktionsFixAb,
    schliesseAbschnittsFixAb: p.schliesseAbschnittsFixAb,
    aufAbgeschlossen: p.aufAbgeschlossen,
    aufAbgebrochen: p.aufAbgebrochen,
    aufFehler: p.aufFehler,
  }
  return <AktionsAuswahl {...eigenschaften} />
}
