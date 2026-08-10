// GENERIERT aus dem Signaturblock von Issue #107.
// [vorlagen-store] löscheVorlage – blockierend löschen, mit beiden Trefferlisten im Fehler
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { VorlagenFehlercode } from './fehlercodes'

import type { Vorlagennutzung } from '../../shared/contracts/vorlage'

// Der Typ gehört #95 und wird hier NUR importiert, NIE neu deklariert: Er reist als fehler.daten

// über die IPC-Grenze, und der Renderer darf nicht aus src/main/** importieren.



export async function löscheVorlage(

  id: string,

): Promise<Ergebnis<void, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #107."
  );
}

// - blockierend, NICHT kaskadierend: kein Projekt wird verändert

// - bei Treffern: fehler.code = 'vorlage_referenziert' mit fehler.daten = Vorlagennutzung

//   (also { aktionen: VorlagenReferenz[], listenelemente: VorlagenReferenz[] })

// - eingebaute Vorlagen sind unlöschbar

// - Arbeitskopien der gelöschten Vorlage werden im SELBEN Schreibvorgang von ihr gelöst (#108)

// - Referenzpruefung VOR der Schreib-Einheit (sie ist async), Entfernen + Loesen in EINER

//   aendereBestand(…, 'sofort')-Einheit (#98)

// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
