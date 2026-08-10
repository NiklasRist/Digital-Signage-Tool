// GENERIERT aus dem Signaturblock von Issue #133.
// [composer] Die Fix-Optionen je Fall
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Einblendung, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { KaputteStelle } from './kaputt-erkennung'

export type FixOptionId =
  | 'medium_neu_verknuepfen'   // Fall 1: fehlende Datei neu importieren
  | 'medium_ersetzen'          // Fall 1: anderes vorhandenes Asset referenzieren
  | 'element_entfernen'        // Fall 1 + 2: das Listenelement aus der Liste nehmen
  | 'aktionsbild_reparieren'   // Fall 2 + 3: Bild der Aktion im action-editor in Ordnung bringen
  | 'aktion_ersetzen'          // Fall 2: dem Segment eine andere Aktion geben
  | 'abschnitt_ersetzen'       // Fall 3: dem Band-Abschnitt eine andere Aktion geben
  | 'abschnitt_entfernen'      // Fall 3: den Abschnitt aus dem Band nehmen

/** Die zulässigen Optionen dieser Stelle, in Anzeigereihenfolge. Rein, ohne Seiteneffekt. */
export function optionenFuer(stelle: KaputteStelle): FixOptionId[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #133."
  );
}

export type Uebergabe =
  | { ziel: 'medien-import'; elementId: string }                 // öffneMedienDialog + reiheEin('import')
  | { ziel: 'action-editor'; aktionId: string }                  // Bild der Aktion reparieren
  | { ziel: 'asset-auswahl'; elementId: string }                 // anderes Asset für das Element
  | { ziel: 'aktions-auswahl'; elementId: string; abschnittIndex: number | null }

export type FixWirkung =
  | { art: 'erledigt' }              // eine Store-Operation ist gelaufen und hat bestätigt
  | { art: 'uebergabe'; an: Uebergabe }   // die Oberfläche muss weiterleiten

export async function fuehreFixAus(
  stelle: KaputteStelle,
  option: FixOptionId,
  projekt: Project,
): Promise<Ergebnis<FixWirkung>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #133."
  );
}

/** Der Gegenweg zu den beiden Medium-Übergaben: Nachdem der Nutzer im Import- oder Auswahl-Dialog
 *  ein Asset bestimmt hat, setzt DIESE Funktion die Referenz des Listenelements um. Ohne sie wäre
 *  jede der beiden Übergaben eine Sackgasse (s. Ablauf 5). */
export async function schliesseMediumFixAb(
  elementId: string,
  neueAssetId: string,
): Promise<Ergebnis<FixWirkung>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #133."
  );
}

/** Der Gegenweg zu `aktion_ersetzen`: Nachdem der Nutzer in der Aktions-Auswahl eine andere Aktion
 *  bestimmt hat, setzt DIESE Funktion die Referenz des SEGMENT-Listenelements um. Gleicher Kanal
 *  wie oben – die zweite ID ist hier aber eine AKTIONS-ID (s. Ablauf 5b). */
export async function schliesseAktionsFixAb(
  elementId: string,
  neueAktionId: string,
): Promise<Ergebnis<FixWirkung>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #133."
  );
}

/** Der Gegenweg zu `abschnitt_ersetzen`: Nachdem der Nutzer in der Aktions-Auswahl eine andere
 *  Aktion bestimmt hat, tauscht DIESE Funktion die `aktionRef` GENAU EINES Band-Abschnitts aus.
 *  Sie laeuft ueber `setzeEinblendung` (#120) und NIEMALS ueber `setzeElementReferenz` (#152) –
 *  ein Abschnitt ist kein Listenelement (s. Ablauf 5c und STOPP). `projekt` wird gebraucht, weil
 *  `setzeEinblendung` die GANZE Einblendung ersetzt und das uebrige Band dafuer bekannt sein muss. */
export async function schliesseAbschnittsFixAb(
  elementId: string,
  abschnittIndex: number,
  neueAktionId: string,
  projekt: Project,
): Promise<Ergebnis<FixWirkung>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #133."
  );
}
