// GENERIERT aus dem Signaturblock von Issue #150.
// [vorlagen-editor] Live-Vorschau mit einer echten Aktion und testweise geleerten Feldern
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { zeichneSegment, type SegmentBild } from '../template-canvas/zeichne-segment'
import { bereiteMotiveVor } from '../template-canvas/bild-laden'
import { bereiteLogoVor } from '../template-canvas/logo-laden'
import { stelleSchriftenBereit } from '../template-canvas/schriften'

/** Die Aktions-Felder, die sich für die Vorschau leeren lassen. */
export type VorschauFeld = 'titel' | 'beschreibung' | 'preis' | 'cta' | 'bild'

/** Ersatz, wenn die Aktions-Bibliothek des Projekts leer ist. Wird NIE gespeichert. */
export const BEISPIEL_AKTION: Aktion = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #150."
  );
})();

/** Die gewählte Aktion, sonst die erste der Bibliothek, sonst BEISPIEL_AKTION. */
export function waehleVorschauAktion(
  aktionen: readonly Aktion[],
  gewaehlteId: string | null,
): Aktion {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #150."
  );
}

/** Kopie der Aktion mit den genannten Feldern geleert. Verändert die Vorlage NICHT. */
export function leereFelderFuerVorschau(
  aktion: Aktion,
  geleert: ReadonlySet<VorschauFeld>,
): Aktion {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #150."
  );
}

/**
 * Lädt alles, was zeichneSegment synchron voraussetzt: Schriften, Logo und die Motive der
 * übergebenen Aktionen. MUSS vor dem ersten zeichneVorschau abgeschlossen sein.
 * `projektId === null` = kein Projekt geöffnet: Schriften und Logo werden trotzdem geladen,
 * Motive entfallen (media:// löst nur innerhalb eines Projekt-Medienordners auf).
 */
export async function bereiteVorschauVor(
  projektId: string | null,
  aktionen: readonly Aktion[],
  assets: readonly Asset[],
  marke: Marke,
): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #150."
  );
}

/** Der EINZIGE Zeichenaufruf des vorlagen-editor. Leert die Felder und ruft zeichneSegment. */
export function zeichneVorschau(
  aktion: Aktion,
  vorlage: Vorlage,
  marke: Marke,
  geleert: ReadonlySet<VorschauFeld>,
): SegmentBild {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #150."
  );
}
