// GENERIERT aus dem Signaturblock von Issue #161.
// [ffmpeg-adapter] Encoder-Argumente aus RENDER_PROFILE bilden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProfile } from '../../shared/contracts/render-profile'

/**
 * Bildet die VIDEO-Kodierargumente aus dem Profil.
 * NICHT enthalten: Eingaben (-i), Filterketten (-vf/-filter_complex), Tonspur,
 * Container-Flags und der Ausgabepfad. Die kommen von den jeweils zustaendigen Stellen.
 */
export function baueVideoKodierArgumente(profil: RenderProfile): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #161."
  );
}
