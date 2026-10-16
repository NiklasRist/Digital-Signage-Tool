// [preview-player] Ein Bild-Element darstellen – contain auf Schwarz, Quelle über media://

import { medienUrl as sharedMedienUrl } from '../../shared/medien-url';

/**
 * Baut die Lese-URL einer Projektdatei: `media://<projektId>/<dateiname>`.
 * Beide Bestandteile werden mit encodeURIComponent geschrieben (s. ENTSCHIEDEN 2).
 * Total: wirft nie, prueft nichts, kennt keine Fehlercodes.
 */
export function medienUrl(projektId: string, dateiname: string): string {
  return sharedMedienUrl(projektId, dateiname);
}
