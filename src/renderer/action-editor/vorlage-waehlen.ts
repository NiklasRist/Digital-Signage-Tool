// GENERIERT aus dem Signaturblock von Issue #137.
// [action-editor] Vorlage zuweisen – nur nutzbare Vollflächen-Vorlagen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'

/** Ist diese Vorlage im action-editor auswählbar? Nutzbar (parent === null) UND vollflächig. */
export function istWaehlbar(vorlage: Vorlage): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}

/** Holt die nutzbaren Vorlagen vom vorlagen-store und behält nur die auswählbaren.
 *  Die Reihenfolge des Bestands bleibt erhalten.
 *  Fehlercode-Parameter ist `string` – Begründung unter „ENTSCHIEDEN" unmittelbar darunter. */
export async function ladeWaehlbareVorlagen(): Promise<Ergebnis<Vorlage[], string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}

/** Die aktuell zugewiesene Vorlage einer Aktion in der Auswahlliste finden.
 *  null = die `vorlagenId` der Aktion ist nicht (mehr) auswählbar; die Oberfläche zeigt dann
 *  „unbekannte Vorlage" und verlangt eine bewusste Neuwahl. */
export function findeZugewiesene(vorlagenId: string, waehlbare: Vorlage[]): Vorlage | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}
