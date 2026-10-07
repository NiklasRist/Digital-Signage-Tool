// Issue #244 - inhalte-zugaenge.ts: die REINE Verteilung der Projektzugaenge.
// Kein JSX, kein react, kein Zustand, kein IPC, kein Wurf - und ohne Browser
// pruefbar.
//
// DIE KRITISCHE ENTSCHEIDUNG IST EIN EINZIGER ORT (ENTSCHIEDEN 3): Der umhüllte
// Zugang (#243, zeichnet vor jeder Aenderung einen Undo-Schnappschuss) geht
// AUSSCHLIESSLICH an composer und action-editor. Alle übrigen Empfänger
// bekommen den ROHEN Zugang; die Heftigkeit dieser Regel stehe ausgeschrieben:
//   * projekt-verwaltung: ein Projektwechsel ist kein Bearbeitungsschritt; ein
//     Schnappschuss davon zeigte auf ein ANDERES Projekt.
//   * #199 (Auftrags-Nachlauf): Ein Import-Setzer über die Hülle wäre ein
//     Schnappschuss DES STANDES VOR DEM Import - ein späteres Rückgängig
//     würde das soeben importierte Medium wieder aus dem Datenbestand
//     entfernen, WÄHREND seine Datei auf der Platte bleibt, und die in
//     TK 9.13.3 geforderte Leerung der Historie im SELBEN Atemzug unterlaufen.
//   * #235 (Rückgängig selbst), #196 (Start-Ablauf) und jedes reine Lesen:
//     roh.
// preview-player und vorlagen-editor bekommen ueberhaupt KEINEN
// Projektzugang - sie veraendern das Projekt nicht (ENTSCHIEDEN 6 in inhalte.tsx).
//
// `umhuelleFuerBearbeitung` wird GENAU EINmal gerufen und `ohneAufzeichnung`
// GENAU EINmal; #243 ist idempotent und `ohneAufzeichnung` liefert einen rohen
// Zugang unverändert selbst - projektRoh ist also ToBe-gleich sichten.projekt.

import type { Sichten, ProjektZugang, VorlagenZugang, ZeichenZugang, MarkenZugang } from './sichten'
import { umhuelleFuerBearbeitung, ohneAufzeichnung } from './undo-aufzeichnung'

/**
 * Die fertig verteilten Zugaenge eines Fensters. Beide Projektfassungen stehen NEBENEINANDER –
 * wer welche bekommt, steht in der Tabelle dieses Issues und in ENTSCHIEDEN 3.
 */
export interface Reiterzugaenge {
  /** UMHUELLT (#243): zeichnet vor jeder Aenderung einen Undo-Schnappschuss auf.
   *  AUSSCHLIESSLICH fuer `composer` und `action-editor`. */
  projektBearbeitung: ProjektZugang
  /** ROH: zeichnet NICHTS auf. Fuer projekt-verwaltung, #199, #235, #196 und fuer jedes Lesen. */
  projektRoh: ProjektZugang
  vorlagen: VorlagenZugang
  zeichnen: ZeichenZugang
  /** ERSETZT `marke: Marke`. Reine Weiterreichung von `sichten.marken` – dieselbe Objektreferenz. */
  marken: MarkenZugang
}

/**
 * Baut aus den gemeinsamen Sichten (#197) die verteilten Zugaenge.
 * REINE Funktion: kein Zustand, kein IPC, kein JSX. Total: wirft nie.
 */
export function verteileZugaenge(sichten: Sichten): Reiterzugaenge {
  return {
    // GENAU EIN Umhüller, GENAU EIN Ent-Hüller - die Frage „welcher Zugang
    // gilt hier?“ wird an GENAU EINER Stelle beantwortet (ENTSCHIEDEN 3).
    projektBearbeitung: umhuelleFuerBearbeitung(sichten.projekt),
    // `ohneAufzeichnung` auf dem ROHEN Zugang liefert ihn UNVERAENDERT selbst:
    // die Identität bleibt erhalten (ToBe), es entsteht keine zweite Kopie.
    projektRoh: ohneAufzeichnung(sichten.projekt),
    // unverändert durchgereicht - es wird nichts kopiert, nichts ergänzt:
    vorlagen: sichten.vorlagen,
    zeichnen: sichten.zeichnen,
    marken: sichten.marken,
  }
}
