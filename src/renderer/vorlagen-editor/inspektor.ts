// GENERIERT aus dem Signaturblock von Issue #145.
// [vorlagen-editor] Der Zahlen-Inspektor für exakte Rahmenwerte
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Zone } from '../../shared/contracts/vorlage'
import {
  begrenzeAufFlaeche,
  MINDEST_ZONEN_KANTE_PX,
  type Flaeche,
} from './zonen-canvas'

/** Die vier bearbeitbaren Rahmenwerte. Achtung: `höhe` MIT Umlaut (so heisst das Feld in #95). */
export type RahmenFeld = 'x' | 'y' | 'breite' | 'höhe'

/**
 * Übernimmt eine getippte Zahl in genau ein Rahmenfeld.
 * Rastet NICHT ein – der eingegebene Wert wird nur auf die Fläche begrenzt.
 * Liefert eine NEUE Zone; die übergebene bleibt unverändert.
 */
export function setzeRahmenWert(
  zone: Zone,
  feld: RahmenFeld,
  eingabe: string,
  flaeche: Flaeche,
): Ergebnis<Zone> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #145."
  );
}
