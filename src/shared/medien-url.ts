// GENERIERT aus dem Signaturblock von Issue #258.
// [contracts] Die media-Adresse an genau einer Stelle bilden
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
// GERUEST-PRUEFSUMME: ba7d0c37347cbc00
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
//
// ERLEDIGT (14.08.2026): Die Abschaltzeile ist mit dem Fuellen des Rumpfes entfernt;
// beide Parameter werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.
//
// ============================================================================
// DIE EINZIGE STELLE, AN DER DIE LESE-ADRESSE EINER PROJEKTDATEI GEBILDET WIRD
// ============================================================================
// TK 9.5.7 kennt GENAU EINE Adressform und GENAU EINEN Handler dafuer. Gebildet
// wurde sie bisher an DREI Stellen - im preview-player (#215), in der
// Medien-Bibliothek des composer (#227) und bei den Thumbnails (#128) -, und zwei
// dieser drei wurden auf das GEGENTEIL abgenommen: #215 verlangt die
// Prozent-Kodierung beider Bestandteile, #227 verlangt "ohne Kodierungsumbau".
// Wer beide Abnahmen gruen bekommen will, MUSS zwei Umsetzungen schreiben - und ab
// dann laufen sie auseinander, ohne dass irgendwo etwas fehlschlaegt. Deshalb liegt
// die Bildung ab jetzt hier, im geteilten Bereich, den beide Prozesse sehen duerfen.
//
// WARUM DER WIDERSPRUCH HEUTE NICHT AUFFAELLT - und warum das der eigentliche
// Befund ist: Asset.dateiname ist "<uuid>.<endung>" (#13), projektId ist eine UUID
// (TK 9.11.4). In beiden kommt kein Zeichen vor, das die Kodierung veraendert; die
// beiden Fassungen liefern fuer JEDEN heute vorkommenden Wert dieselbe Zeichenkette.
// Das ist eine Eigenschaft der aktuellen BELEGUNG, kein Vertrag. Nirgends steht, dass
// jede Zeichenkette, die je hier hereinkommt, UUID-foermig ist.
//
// WAS OHNE KODIERUNG PASSIERT - dreimal derselbe Ausgang, naemlich eine leere
// Flaeche ohne Fehlermeldung:
//   - ein ungeschuetztes '#' schneidet die Adresse ab; alles dahinter gilt als
//     Fragment und erreicht den Handler nie,
//   - ein Leerzeichen macht die Adresse ungueltig,
//   - ein '?' macht aus dem Rest eine Abfragezeichenkette.
// Und der Import laesst ausdruecklich zu, was das Dateisystem zulaesst.
//
// DIE GEGENSTELLE IST GEBAUT UND PASST: Der Handler in
// src/main/project-store/media-protokoll.ts (#50) dekodiert Host und Pfadstueck
// GENAU EINMAL (dekodiereEinmal) - einmal, weil "%252e" fuer "%2e" steht und nicht
// fuer "." Genau EINMAL kodieren ist also nicht Geschmack, sondern die exakte
// Umkehrung dessen, was der Empfaenger tut. Wer hier nicht kodiert, verlaesst sich
// darauf, dass Chromium den rohen Namen unveraendert durchreicht; wer zweimal
// kodiert, liefert dem Handler einen Namen, den es nicht gibt.
//
// WARUM NICHT encodeURI: Es laesst '#', '?', '/' und ':' UNBERUEHRT - genau die
// Zeichen, auf die es hier ankommt. Es ist fuer GANZE Adressen gedacht; hier werden
// BESTANDTEILE kodiert. An dieser Stelle saehe es richtig aus und liesse die
// gefaehrlichen Zeichen durch.
//
// WAS HIER NICHT PASSIERT: keine Pruefung (weder auf Leere noch auf UUID-Form noch
// auf ".."), kein Fehlercode, keine Huelle, kein Werfen, keine Pfadaufloesung, kein
// Wissen ueber projects/<id>/... - und keine Erkennung "ist schon kodiert". Ein
// bereits kodierter Prozentanteil wird ERNEUT kodiert ('%' wird zu '%25'); eine
// Heuristik dagegen waere unentscheidbar. Der Ausbruchsschutz (kein Aufstieg ueber
// den Medienordner, keine Symlink-Flucht, strikt nur lesend) sitzt im Resolver des
// Main, wo er das Dateisystem sehen kann (TK 9.5.7). Eine zweite, leicht abweichende
// Pruefung hier waere eine zweite Wahrheit darueber, welche Adressen zulaessig sind -
// und welche gewinnt, hinge davon ab, welche zuerst laeuft.
//
// DIESE DATEI IMPORTIERT NICHTS - auch nicht aus contracts/. Der geteilte Bereich
// zeigt auf keinen der beiden Prozesse; eine Abhaengigkeit hier waere eine, die
// Renderer UND Main mittragen muessten.

/** Das Schema des Renderer-Lesezugriffs (TK 9.5.7). Steht hier EINMAL und nirgends sonst. */
export const MEDIEN_SCHEMA = 'media'

/**
 * Baut die Lese-URL einer Projektdatei: `media://<projektId>/<dateiname>` (TK 9.5.7).
 *
 * BEIDE Bestandteile werden mit `encodeURIComponent` geschrieben (s. ENTSCHIEDEN 1).
 * REIN und TOTAL: wirft nie, prueft nichts, kennt keine Fehlercodes, beruehrt kein Dateisystem
 * und loest KEINEN Pfad auf.
 */
export function medienUrl(projektId: string, dateiname: string): string {
  // Der Schraegstrich zwischen den beiden Bestandteilen ist ein LITERAL: er gehoert
  // zur Adressform aus TK 9.5.7. Ein Schraegstrich INNERHALB eines der beiden Teile
  // wird dagegen mitkodiert - Asset.dateiname ist ausdruecklich "OHNE
  // Verzeichnisanteil" (#13), ein Schraegstrich darin ist also keine
  // Verzeichnisangabe, sondern ein Ausbruchsversuch, und der darf die Adressform
  // nicht veraendern.
  //
  // Zwei Schraegstriche nach dem Doppelpunkt, kein dritter: die projektId steht an
  // der Stelle, an der eine gewoehnliche Adresse den Host traegt. Ein dritter ergaebe
  // einen LEEREN Host und schoebe die projektId in den Pfad - der Handler faende dann
  // nichts.
  return `${MEDIEN_SCHEMA}://${encodeURIComponent(projektId)}/${encodeURIComponent(dateiname)}`
}
