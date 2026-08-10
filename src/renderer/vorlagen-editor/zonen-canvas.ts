// GENERIERT aus dem Signaturblock von Issue #144.
// [vorlagen-editor] Zonen auf dem Canvas ziehen, bemaßen und einrasten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Rahmen, Vorlage, Zone } from '../../shared/contracts/vorlage'
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Die native Zeichenfläche einer Vorlage (TK 9.10.2). */
export interface Flaeche {
  breite: number
  höhe: number
}

/** Kandidatenlinien zum Einrasten, getrennt nach Achse. Aufsteigend sortiert, ohne Dubletten. */
export interface Einrastlinien {
  x: number[]
  y: number[]
}

/** Anfasser einer Zone. Himmelsrichtungen; `n` = obere Kante, `se` = untere rechte Ecke. */
export type Griff = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const EINRAST_RASTER_PX = 8
export const EINRAST_TOLERANZ_PX = 6
export const MINDEST_ZONEN_KANTE_PX = 8

/** 1920 × 1080 bei `vollflaeche`, sonst 1920 × vorlage.höhe. */
export function flaecheDerVorlage(vorlage: Vorlage): Flaeche {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}

/**
 * Der sichere Bereich IN KOORDINATEN DER VORLAGENFLÄCHE (nicht des Bildrahmens).
 * Kann bei sehr niedrigen Bändern die Breite/Höhe 0 haben – dann ist nichts sicher nutzbar.
 */
export function sicherheitsBox(vorlage: Vorlage): Rahmen {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}

/** Begrenzt einen Rahmen auf die Fläche, OHNE ihn zu verkleinern (verschiebt ihn hinein). */
export function begrenzeAufFlaeche(rahmen: Rahmen, flaeche: Flaeche): Rahmen {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}

/** Alle Kandidatenlinien: Flächenkanten, Sicherheitsbox, Kanten ALLER anderen Zonen. */
export function sammleEinrastlinien(vorlage: Vorlage, ausserZonenId: string): Einrastlinien {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}

/** Verschiebt die Zone um (dx, dy) in FLÄCHENPIXELN. Feste Zonen bleiben unverändert. */
export function verschiebeZone(
  zone: Zone,
  dx: number,
  dy: number,
  flaeche: Flaeche,
  linien: Einrastlinien,
): Zone {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}

/** Bemaßt die Zone an einem Griff um (dx, dy). Feste Zonen bleiben unverändert. */
export function bemasseZone(
  zone: Zone,
  griff: Griff,
  dx: number,
  dy: number,
  flaeche: Flaeche,
  linien: Einrastlinien,
): Zone {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #144."
  );
}
