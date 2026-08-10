// GENERIERT aus dem Signaturblock von Issue #231.
// [composer] Render auslösen – Namenseingabe, Überschreib-Hinweis, Reparatur statt Fehlermeldung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { AusgabeDatei } from './ausgabe-liste'
import type { AusloeseFehlercode } from './render-ausloesen'   // #134 – NUR der Typ

/** Frühe Rückmeldung auf den eingegebenen Namen – KEIN Ersatz für die Prüfung im Main. */
export type NamensBefund =
  | 'ok'
  | 'leer'
  | 'pfadtrenner'      // enthält '/' oder '\'
  | 'punkt_punkt'      // enthält '..'
  | 'unzulaessiges_zeichen'  // < > : " | ? * oder ein Steuerzeichen
  | 'reservierter_name'      // CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9
  | 'endung_angegeben'       // endet auf '.mp4' – der Name geht OHNE Endung in den Auftrag

/** Prüft den Ausgabenamen nach TK 9.2.6. Der erste zutreffende Befund gewinnt. */
export function pruefeAusgabeName(eingabe: string): NamensBefund {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #231."
  );
}

/** Die Vorbelegung des Eingabefeldes: `projekt.letzterAusgabeName`; null = keine Vorbelegung.
 *  Es wird KEIN Ersatzname erfunden (s. ENTSCHIEDEN 3). */
export function vorbelegterName(projekt: Project): string | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #231."
  );
}

/** Was der Nutzer neben dem Eingabefeld sieht – rein abgeleitet, ohne Zustand. */
export interface Ueberschreiblage {
  /** true, wenn im Ausgabeordner bereits eine Datei mit diesem Namen liegt. */
  ersetzt: boolean
  /** Die Datei, die ersetzt wird; null, wenn keine. */
  vorhandene: AusgabeDatei | null
  /** Der Hinweistext – KEINE Frage, sondern eine Feststellung. Leer, wenn nichts ersetzt wird. */
  hinweis: string
}

/**
 * Bildet den Dateinamen (`<name>.mp4`) und sucht ihn im übergebenen Bestand.
 * Der Bestand kommt als Parameter aus #230 – diese Datei lädt ihn NICHT (s. ENTSCHIEDEN 5).
 */
export function pruefeUeberschreiben(
  ausgabeName: string,
  ausgaben: readonly AusgabeDatei[],
): Ueberschreiblage {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #231."
  );
}

/** Alles, was der Auslöse-Ablauf braucht und was diese Datei nicht selbst besitzt. */
export interface RenderDialogWirkungen {
  /** Der Auslöser aus #134. Wird als Parameter übergeben, nicht importiert (s. ENTSCHIEDEN 6). */
  loeseRenderAus: (
    projekt: Project,
    ausgabeName: string,
    marke: Marke,
    vorlagen: readonly Vorlage[],
  ) => Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>>
  /** Führt in den geführten Reparatur-Modus. Wird bei `kaputte_elemente` gerufen – STATT einer
   *  Fehlermeldung. Der Aufrufer verdrahtet ihn mit #132/#201. */
  starteReparaturModus: () => void
  /** Meldeweg für alle übrigen Fehler. Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Was nach dem Auslösen geschehen ist – für den Aufrufer, der den Dialog schließt. */
export type RenderAusloesung =
  | { art: 'eingereiht'; auftragId: string }
  | { art: 'reparatur' }          // in den Reparatur-Modus geführt, NICHT eingereiht
  | { art: 'abgelehnt'; code: string }

/**
 * Löst den Render aus. Setzt voraus, dass `pruefeAusgabeName` `'ok'` geliefert hat – das prüft
 * die Anzeige, nicht diese Funktion.
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1).
 */
export async function loeseRenderMitNamenAus(
  projekt: Project,
  ausgabeName: string,
  marke: Marke,
  vorlagen: readonly Vorlage[],
  wirkungen: RenderDialogWirkungen,
): Promise<RenderAusloesung> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #231."
  );
}
