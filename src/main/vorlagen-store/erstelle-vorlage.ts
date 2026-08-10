// GENERIERT aus dem Signaturblock von Issue #100.
// [vorlagen-store] erstelleVorlage implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, VorlagenArt, Zone } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'
import { eingebauteVorlagen } from './eingebaute-vorlagen'
import { erzeugeId } from '../../shared/contracts/id'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: aendereBestand<T>(
//            aenderung: (bestand: Vorlage[]) =>
//              Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, VorlagenFehlercode>>
//          // `aenderung` ist SYNCHRON und bekommt eine tiefe Kopie des Bestands.
//   #96: eingebauteVorlagen(): Vorlage[]   // frische TIEFE Kopie der drei Mitgelieferten
//   #20:   erzeugeId(): string               // UUID v4
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: type VorlagenArt = 'vollflaeche' | 'split' | 'einblendung'
//          interface Zone { id: string; rolle: 'fest'|'frei'; bindung: Bindung | null
//                           rahmen: { x: number; y: number; breite: number; höhe: number }
//                           ausrichtung: { horizontal: 'links'|'mitte'|'rechts'
//                                          vertikal: 'oben'|'mitte'|'unten' }
//                           wennLeer: 'leer'|'ausblenden'
//                           text?: ZonenText; bild?: ZonenBild; deko?: ZonenDeko }
//          interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

export async function erstelleVorlage(
  art: VorlagenArt,
  höhe: number | null,
  name: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #100."
  );
}
