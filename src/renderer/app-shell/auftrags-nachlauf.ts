/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #199.
// [app-shell] Der einzige Auswerter der Warteschlangen-Ereignisse
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

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Asset } from '../../shared/contracts/asset'
import type { Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Alles, worauf der Nachlauf wirkt. Wird als Parameter übergeben (Entscheidung E1, #197) –
 *  diese Datei importiert KEINE Sicht und KEINEN Undo-Stapel direkt. */
export interface NachlaufWirkungen {
  /** Das aktuell geladene Projekt; null, wenn keins offen ist. Aus #197: projekt.hole().projekt */
  holeProjekt: () => Project | null
  /** Ersetzt das Projekt in der gemeinsamen Sicht (#121, über #197). */
  setzeProjekt: (projekt: Project) => void
  /** Verwirft den Motiv-Bestand und den gemerkten Stand (#154, über #197). */
  verwirfMotivBestand: () => void
  /** Stellt die Zeichenvoraussetzungen erneut her (#154, über #197). */
  bereiteZeichnenVor: (projekt: Project) => Promise<Ergebnis<Zeichenvoraussetzungen, string>>
  /** Leert die Undo-Historie der Projekt-Bearbeitung (TK 9.13.3). Kommt aus #234. */
  leereProjektHistorie: () => void
  /** Optional: die Ausgabe-Liste neu laden (#230). Fehlt sie, geschieht nichts. */
  aktualisiereAusgabenListe?: () => void
  /** Optional: meldet der Reparatur-Führung die Kennung eines ERFOLGREICH importierten Assets
   *  (#256 `schliesseMedienImportAb`, über #262). NUR bei art 'import' und status 'erfolg'.
   *  Fehlt sie, geschieht nichts. Diese Datei weiß NICHT, ob eine Reparatur läuft – das
   *  entscheidet der Empfänger (s. ENTSCHIEDEN 11). */
  meldeImportErgebnis?: (assetId: string) => void
  /** Meldeweg für Fehler, die beim Nachlauf selbst auftreten (z. B. Vorbereiten schlägt fehl).
   *  Diese Datei zeigt NICHTS selbst an. Wo die Meldung LANDET, ist entschieden: in der
   *  anwendungsweiten `meldungsFlaeche` des Rahmens (#195), gehalten von #262 (`App.tsx`). */
  meldeFehler: (code: string, meldung: string) => void
}

/**
 * Startet den Nachlauf: abonniert die Warteschlange und wertet TERMINALE Übergänge aus.
 * `abonniereQueue` bildet der Aufrufer aus `abonniere` (#151) – diese Datei kennt keinen
 * Kanalnamen und importiert die Kanal-Registry nicht.
 * Rückgabewert ist die Abmelde-Funktion; sie beendet das Abo und vergisst die gemerkten Kennungen.
 */
export function starteAuftragsNachlauf(
  abonniereQueue: (hoerer: (auftraege: Auftrag[]) => void) => () => void,
  wirkungen: NachlaufWirkungen,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #199."
  );
}

/** Die drei terminalen Zustände (TK 9.3.3). Exportiert, damit Tests sie nicht nachbauen müssen. */
export const TERMINALE_ZUSTAENDE: readonly ['erfolg', 'fehlgeschlagen', 'abgebrochen'] = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #199."
  );
})();

/** Die beiden Auftragsarten, die D1 verändern (TK 9.13.3). */
export const D1_AENDERNDE_ARTEN: readonly ['import', 'loeschen'] = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #199."
  );
})();
