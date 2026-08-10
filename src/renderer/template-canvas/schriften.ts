// GENERIERT aus dem Signaturblock von Issue #110.
// [template-canvas] Marken-Schriften bereitstellen und den Canvas-Schriftwert bilden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Schrift } from '../../shared/contracts/marke'

export async function stelleSchriftenBereit(): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #110."
  );
}
// Idempotent: merkt sich das EINE Promise von ladeMarkenSchriften() (#8) in einem Modul-Zustand und
// gibt es bei jedem weiteren Aufruf unverändert zurück. Lädt nie ein zweites Mal. Ein abgelehntes
// Promise wird NICHT gemerkt – der nächste Aufruf versucht es erneut.

export function sindSchriftenBereit(): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #110."
  );
}
// Synchron. true erst, nachdem stelleSchriftenBereit() erfolgreich aufgelöst hat; sonst false.
// Existiert, weil zeichneSegment (#117) synchron ist und deshalb nicht awaiten darf.
// #117 ruft diese Abfrage als ALLERERSTEN Schritt auf und wirft einen Error, wenn sie false
// liefert. Diese Datei selbst weigert sich nie – sie gibt nur Auskunft.

export function schriftKurzform(schrift: Schrift, größePx: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #110."
  );
}
// Liefert den Wert für CanvasRenderingContext2D.font, exakt in dieser Form und Reihenfolge:
//   `${schrift.gewicht} ${größePx}px "${schrift.familie}"`
// Der Familienname steht IMMER in doppelten Anführungszeichen. Keine weiteren Bestandteile
// (kein style, kein variant, kein stretch, kein line-height, keine Fallback-Familie).
