// GENERIERT aus dem Signaturblock von Issue #99.
// [vorlagen-store] listeVorlagen und listeArbeitskopien implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-vorlagen'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: ladeBestand(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>>
//          // vollstaendiger Bestand als TIEFE Kopie: nutzbare Vorlagen UND Arbeitskopien
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

/** Nur NUTZBARE Vorlagen: parent === null. Arbeitskopien erscheinen hier nicht. */
export async function listeVorlagen(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #99."
  );
}

/** Nur ARBEITSKOPIEN: parent !== null. Fuer „Bearbeitung fortsetzen". */
export async function listeArbeitskopien(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #99."
  );
}
