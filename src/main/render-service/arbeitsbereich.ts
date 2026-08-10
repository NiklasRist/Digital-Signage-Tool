/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #172.
// [render-service] Arbeitsbereich T1 anlegen, verwerfen und verwaiste Reste aufräumen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'

/** Namenspräfix aller Arbeitsbereiche – TK Abschnitt 6: `<Temp>/reel-XXXX/`. */
export const ARBEITSBEREICH_PRAEFIX = 'reel-'

/** Ein `reel-*`-Ordner gilt erst nach dieser Zeit als verwaist (Begründung: ENTSCHIEDEN 4). */
export const VERWAIST_AB_MS = 24 * 60 * 60 * 1000

/** Wiederholversuche beim Löschen (Windows-Handles hängen nach). */
export const LOESCH_VERSUCHE = 5
/** Wartezeiten VOR dem 2. bis 5. Versuch, in Millisekunden. */
export const LOESCH_WARTEZEITEN_MS = [50, 100, 200, 400] as const

/**
 * Legt einen neuen, garantiert eindeutigen Arbeitsbereich an und liefert seinen absoluten Pfad.
 * Der Ordner existiert nach erfolgreicher Rückkehr und ist leer.
 */
export async function erzeugeArbeitsbereich(): Promise<Ergebnis<string, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #172."
  );
}

/**
 * Entfernt einen Arbeitsbereich samt Inhalt. Bestmöglich, mit Wiederholung – und OHNE
 * Ergebnis-Hülle: ein misslungenes Aufräumen darf den Ausgang eines Laufs NIE verändern
 * (Begründung: ENTSCHIEDEN 5). Wirft nie.
 */
export async function verwirfArbeitsbereich(pfad: string): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #172."
  );
}

/**
 * Entfernt beim Programmstart alle verwaisten `reel-*`-Ordner aus dem Temp-Verzeichnis und liefert
 * die Anzahl der entfernten Ordner (nur für Protokoll und Test). Wirft nie.
 */
export async function raeumeVerwaisteArbeitsbereiche(): Promise<number> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #172."
  );
}
