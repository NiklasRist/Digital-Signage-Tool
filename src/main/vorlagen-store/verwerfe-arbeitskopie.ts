// GENERIERT aus dem Signaturblock von Issue #105.
// [vorlagen-store] verwerfeArbeitskopie – Bearbeitungsstand fallenlassen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { VorlagenFehlercode } from './fehlercodes'

export async function verwerfeArbeitskopie(
  arbeitsId: string,
): Promise<Ergebnis<void, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #105."
  );
}
// - entfernt GENAU den einen Eintrag mit id === arbeitsId, und nur wenn dessen parent ≠ null ist
// - fasst den Parent NICHT an und liest ihn nicht einmal
// - liefert bei Erfolg Ergebnis<void> – das gelungene `ok` IST die Information
// - laeuft vollstaendig in EINER aendereBestand(…, 'sofort')-Einheit (#98)
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
