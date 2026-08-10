/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #211.
// [queue-panel] Fehlercodes in Klartext übersetzen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: a4d37a1fb265e2fe
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

import type { AuftragArt } from '../../shared/contracts/auftrag'

export interface Fehlertext {
  /** Kurze Ueberschrift, z. B. „Nicht genug Speicherplatz". Nie leer. */
  titel: string
  /** Was passiert ist, in einem Satz. Nie leer. */
  erklaerung: string
  /** Was der Nutzer JETZT tun kann – ursachenbezogen, nie ein leerer Platzhalter. */
  handlung: string
  /**
   * Listenelement-Kennungen aus `fehler.daten`, sofern der Code welche traegt.
   * Leeres Array, wenn der Code keine Nutzdaten hat oder sie unbrauchbar sind.
   */
  betroffeneElementIds: string[]
  /**
   * Die Element-Kennung, zu der ein Sprung in den gefuehrten Reparatur-Modus fuehren soll –
   * oder null. Gesetzt NUR bei `medium_fehlt` und `ungueltiges_element` (TK 9.2.3).
   * Diese Datei fuehrt den Sprung NICHT aus; sie benennt nur das Ziel (s. STOPP).
   */
  reparaturElementId: string | null
  /** true, wenn der Fehler durch erneutes Ausfuehren behebbar sein kann (FA-17). */
  wiederholenSinnvoll: boolean
}

/**
 * Die EINZIGE Uebersetzung von Fehlercode nach Klartext im Renderer.
 * `art` verfeinert nur die Handlungsempfehlung dort, wo derselbe Code je nach Dienst
 * einen anderen ORT meint (`kein_platz`); sie ist nie noetig, um den Code zu ERKENNEN.
 */
export function uebersetzeFehler(
  fehler: { code: string; meldung: string; daten?: unknown },
  art: AuftragArt | null,
): Fehlertext {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #211."
  );
}

/** Die Codes, die diese Tabelle kennt – fuer die Vollstaendigkeitspruefung im Test. */
export const BEKANNTE_FEHLERCODES: readonly string[] = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #211."
  );
})();
