// GENERIERT aus dem Signaturblock von Issue #119.
// [template-canvas] Das gebündelte Marken-Logo laden und bereitstellen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Marke } from '../../shared/contracts/marke'
import type { Motiv } from './bild-laden'

export async function bereiteLogoVor(marke: Marke): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #119."
  );
}
// Lädt marke.logo.datei aus dem Bundle des Renderers, dekodiert es mit await img.decode() und legt
// das Ergebnis im Modul-Bestand ab. Idempotent: merkt sich das EINE Promise und gibt es bei jedem
// weiteren Aufruf unverändert zurück; ein abgelehntes Promise wird NICHT gemerkt.
// Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als { zustand: 'fehlt' } im
// Bestand. Geworfen wird nur bei einem leeren marke.logo.datei (Programmierfehler).

export function holeLogo(): Motiv {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #119."
  );
}
// SYNCHRON, ohne Parameter. Liest ausschließlich den Bestand – lädt nichts, wartet auf nichts,
// erzeugt kein Image. Vor der ersten erfolgreichen Vorbereitung: { zustand: 'fehlt' }.
