// GENERIERT aus dem Signaturblock von Issue #215.
// [preview-player] Ein Bild-Element darstellen – contain auf Schwarz, Quelle über media://
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 85bdcf14a2a40334

import { medienUrl as sharedMedienUrl } from '../../shared/medien-url';

/**
 * Baut die Lese-URL einer Projektdatei: `media://<projektId>/<dateiname>`.
 * Beide Bestandteile werden mit encodeURIComponent geschrieben (s. ENTSCHIEDEN 2).
 * Total: wirft nie, prueft nichts, kennt keine Fehlercodes.
 */
export function medienUrl(projektId: string, dateiname: string): string {
  return sharedMedienUrl(projektId, dateiname);
}
