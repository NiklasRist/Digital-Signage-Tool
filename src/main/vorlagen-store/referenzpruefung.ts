// GENERIERT aus dem Signaturblock von Issue #106.
// [vorlagen-store] Referenzprüfung einer Vorlage über ALLE Projekte
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { VorlagenFehlercode } from './fehlercodes'
import type { VorlagenReferenz, Vorlagennutzung } from '../../shared/contracts/vorlage'
// BEIDE Typen gehören #95 und werden hier NUR importiert, NIE neu deklariert: Sie reisen als
// fehler.daten über die IPC-Grenze (#107), und der Renderer darf nicht aus src/main/** importieren.

export async function pruefeVorlagenReferenzen(
  vorlagenId: string,
): Promise<Ergebnis<Vorlagennutzung, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #106."
  );
}
// - durchsucht ALLE von listeProjekte (#35) gemeldeten Projekte, nicht nur das geladene
// - erfasst BEIDE Referenzarten und liefert sie GETRENNT zurück
// - keine Treffer => beide Arrays leer (ok: true) – das ist KEIN Fehler
// - liest ausschliesslich; schreibt nichts, legt nichts an, repariert nichts
