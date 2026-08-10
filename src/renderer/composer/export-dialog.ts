// GENERIERT aus dem Signaturblock von Issue #232.
// [composer] Export auslösen – Ausgabedatei und Zielordner wählen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { AusgabeDatei } from './ausgabe-liste'

/** Der Zustand der Auswahl – ein WERT, kein Modul-Zustand (s. ENTSCHIEDEN 4). */
export interface Exportauswahl {
  /** Die gewählte Datei; null, solange keine gewählt ist. */
  datei: AusgabeDatei | null
  /** Der zuletzt gewählte Zielordner; null, solange keiner gewählt wurde. */
  zielPfad: string | null
}

/** Nichts gewählt. */
export const LEERE_EXPORTAUSWAHL: Exportauswahl = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #232."
  );
})();

/** Wählt die Datei mit diesem Namen aus dem übergebenen Bestand. Unbekannter Name ⇒ `datei: null`
 *  (es wird KEIN Eintrag erfunden). Der Zielordner bleibt erhalten. */
export function waehleDatei(
  auswahl: Exportauswahl,
  dateiname: string,
  ausgaben: readonly AusgabeDatei[],
): Exportauswahl {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #232."
  );
}

/** true, wenn BEIDE Angaben vorliegen – nur dann darf ausgelöst werden. */
export function istExportBereit(auswahl: Exportauswahl): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #232."
  );
}

/**
 * Öffnet den Zielordner-Dialog (`export:wähleExportZiel`, #183) und trägt das Ergebnis ein.
 * Ein Abbruch (`pfad === null`) lässt `auswahl.zielPfad` UNVERÄNDERT und ist KEIN Fehler
 * (s. ENTSCHIEDEN 2).
 */
export async function waehleZiel(
  auswahl: Exportauswahl,
): Promise<Ergebnis<{ auswahl: Exportauswahl; abgebrochen: boolean }, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #232."
  );
}

/** Alles, was der Auslöse-Ablauf braucht und was diese Datei nicht selbst besitzt. */
export interface ExportDialogWirkungen {
  /** Der Auslöser aus #134. Wird als Parameter übergeben, nicht importiert (s. ENTSCHIEDEN 5). */
  loeseExportAus: (
    projektId: string,
    dateiname: string,
    zielPfad: string,
  ) => Promise<Ergebnis<{ auftragId: string }, string>>
  /** Meldeweg für Fehler. Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Was nach dem Auslösen geschehen ist – für den Aufrufer, der den Dialog schließt. */
export type ExportAusloesung =
  | { art: 'eingereiht'; auftragId: string }
  | { art: 'abgelehnt'; code: string }

/**
 * Reiht den Export ein. Setzt `istExportBereit(auswahl) === true` voraus – das prüft die Anzeige,
 * nicht diese Funktion.
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1).
 */
export async function loeseExportMitAuswahlAus(
  projektId: string,
  auswahl: Exportauswahl,
  wirkungen: ExportDialogWirkungen,
): Promise<ExportAusloesung> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #232."
  );
}
