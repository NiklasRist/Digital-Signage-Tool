// GENERIERT aus dem Signaturblock von Issue #131.
// [composer] Kaputte Stellen erkennen
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
// GERUEST-PRUEFSUMME: 236fcd8f1bd01114
//
// ---------------------------------------------------------------------------
// Diese Datei ist die EINZIGE Instanz, die entscheidet, ob ein Render starten
// darf (TK 9.7.4/9.7.5). Sie liest ausschliesslich das bereits geladene Projekt:
// kein IPC, kein Dateisystem, kein Zwischenspeicher. Ob eine Datei wirklich auf
// der Platte liegt, hat der Reconcile im Main festgestellt und in
// `Asset.zustand` hinterlegt (TK 9.4.7) - ein eigener Existenzcheck hier waere
// eine zweite Wahrheit ueber den Medienbestand.
//
// Und weil TK 9.4.7 ausdruecklich auch die RUECKRICHTUNG zusagt ("Ist die Datei
// wieder da, wird `zustand` auf `\"ok\"` zurueckgesetzt"), wird bei jedem Aufruf
// neu gerechnet und nichts gemerkt. Ein memoisiertes Ergebnis zeigte den Defekt
// fuer immer weiter, obwohl der Nutzer die Datei laengst zurueckkopiert hat.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Project } from '../../shared/contracts/project'

export type KaputtGrund =
  | 'asset_fehlt'        // Asset existiert in D1, steht aber auf zustand: 'fehlt' (TK 9.4.7)
  | 'asset_unbekannt'    // die Asset-ID steht in keinem Project.assets-Eintrag
  | 'aktion_unbekannt'   // die Aktions-ID steht in keinem Project.aktionen-Eintrag

export type KaputteStelle =
  | { art: 'element_asset';  elementId: string; assetId: string;
      grund: 'asset_fehlt' | 'asset_unbekannt' }
  | { art: 'element_aktion'; elementId: string; aktionId: string; assetId: string | null;
      grund: KaputtGrund }
  | { art: 'band_abschnitt'; elementId: string; abschnittIndex: number; aktionId: string;
      assetId: string | null; grund: KaputtGrund }

/**
 * Das Urteil ueber EINE Referenz: `null` heisst heil, sonst der Grund samt der
 * Asset-ID, die den Defekt traegt (`null`, wenn schon die Aktion fehlt).
 */
type Befund = { grund: KaputtGrund; assetId: string | null }

/**
 * Urteil ueber ein Asset, auf das ein Listenelement direkt zeigt (Fall 1).
 *
 * Nur zwei Gruende sind hier moeglich - `aktion_unbekannt` kann es nicht geben,
 * weil gar keine Aktion im Spiel ist. Der Rueckgabetyp sagt das ausdruecklich,
 * damit die `element_asset`-Variante ohne Umweg gebaut werden kann.
 */
function pruefeAsset(
  assetId: string,
  assets: ReadonlyMap<string, Asset>,
): 'asset_fehlt' | 'asset_unbekannt' | null {
  const asset = assets.get(assetId)
  if (asset === undefined) return 'asset_unbekannt'
  if (asset.zustand === 'fehlt') return 'asset_fehlt'
  return null
}

/**
 * Urteil ueber das BILD einer Aktion - die gemeinsame Grundlage von Fall 2
 * (Aktions-Segment) und Fall 3 (Band-Abschnitt). Beide Faelle zeigen auf
 * dieselbe Aktion und werden auf derselben Ebene repariert (TK 9.7.5); sie
 * duerfen daher nicht zweimal unabhaengig beurteilt werden.
 *
 * `bildRef === null` ist AUSDRUECKLICH heil: "eine Aktion ohne Bild ist gueltig -
 * Bild ist optional, Titel Pflicht" (TK 9.8.5). Die Bildzone greift dann die
 * Leer-Regel der Vorlage, es entsteht KEIN Platzhalter. Wer sie mitzaehlte,
 * sperrte den Render dauerhaft, ohne dass es etwas zu reparieren gaebe.
 */
function pruefeAktionsBild(
  aktionId: string,
  aktionen: ReadonlyMap<string, Aktion>,
  assets: ReadonlyMap<string, Asset>,
): Befund | null {
  const aktion = aktionen.get(aktionId)
  if (aktion === undefined) return { grund: 'aktion_unbekannt', assetId: null }
  if (aktion.bildRef === null) return null

  const grund = pruefeAsset(aktion.bildRef, assets)
  if (grund === null) return null
  return { grund, assetId: aktion.bildRef }
}

/** Alle kaputten Stellen des Projekts, in stabiler Reihenfolge. Rein, ohne Seiteneffekt. */
export function findeKaputteStellen(projekt: Project): KaputteStelle[] {
  // Nachschlagetabellen statt linearer Suche je Referenz: Diese Funktion laeuft
  // nach JEDER Mutation erneut, und ein Projekt kann Hunderte Elemente und
  // Abschnitte haben - lineare Suche machte daraus quadratischen Aufwand.
  const assets = new Map(projekt.assets.map((asset) => [asset.id, asset]))
  const aktionen = new Map(projekt.aktionen.map((aktion) => [aktion.id, aktion]))

  const stellen: KaputteStelle[] = []

  // Listenreihenfolge = Array-Reihenfolge (TK 9.11.3). Es wird NICHT sortiert,
  // NICHT gruppiert und NICHT nach Aktion zusammengefasst: "Angezeigte
  // Reihenfolge = gerenderte Reihenfolge - keine versteckte Sortierung."
  // (TK 9.7.4). Diese Reihenfolge bestimmt, welche Stelle der Reparatur-Modus
  // als erste ansteuert (#132).
  for (const element of projekt.liste) {
    if (element.art === 'segment') {
      // Fall 2: Listenelement -> Aktion, deren Bild fehlt. Repariert wird auf
      // AKTIONS-Ebene (TK 9.7.5) - deshalb reist die Aktions-ID mit.
      const befund = pruefeAktionsBild(element.ref, aktionen, assets)
      if (befund !== null) {
        stellen.push({
          art: 'element_aktion',
          elementId: element.id,
          aktionId: element.ref,
          assetId: befund.assetId,
          grund: befund.grund,
        })
      }
    } else {
      // Fall 1: Listenelement -> Asset fehlt (Video). Repariert wird auf
      // Listenelement-Ebene.
      const grund = pruefeAsset(element.ref, assets)
      if (grund !== null) {
        stellen.push({
          art: 'element_asset',
          elementId: element.id,
          assetId: element.ref,
          grund,
        })
      }
    }

    // Fall 3 - der leicht zu uebersehende (TK 9.7.5): Das Video selbst ist
    // einwandfrei, nur ein Abschnitt seines Bandes zeigt auf eine Aktion mit
    // fehlendem Bild. Wuerde er nicht gezaehlt, gaelte das Element als heil,
    // `template-canvas` zeichnete aber einen PLATZHALTER - und der darf nie in
    // den finalen Render (TK 9.10.7).
    //
    // Zwei Bedingungen, beide bewusst: Parallele Baender gibt es "nur bei
    // `\"video\"`-Items" (TK 9.2.8); eine `einblendung` an einem
    // `segment`-Element wird IGNORIERT und nicht gemeldet - das ist ein Fehler
    // des schreibenden Moduls, keine kaputte Stelle im Sinne von FA-19.
    //
    // Und die Abschnitte werden AUCH DANN geprueft, wenn das Video oben schon
    // kaputt war: Ein Video mit fehlender Datei und kaputtem Bandabschnitt
    // liefert ZWEI Stellen. Bei Abbruch nach dem ersten Defekt verschwaende die
    // zweite erst aus der Zaehlung und tauchte nach der ersten Reparatur wieder
    // auf - "X von N" liefe rueckwaerts, und wer "N behoben" liest, haette
    // immer noch keinen freien Render.
    if (element.art === 'video' && element.einblendung !== null) {
      // Array-Reihenfolge, und der Index ist die einzige Information, mit der
      // der Abschnitt spaeter wiedergefunden wird (#132/#133).
      for (const [abschnittIndex, abschnitt] of element.einblendung.abschnitte.entries()) {
        const befund = pruefeAktionsBild(abschnitt.aktionRef, aktionen, assets)
        if (befund !== null) {
          stellen.push({
            art: 'band_abschnitt',
            elementId: element.id,
            abschnittIndex,
            aktionId: abschnitt.aktionRef,
            assetId: befund.assetId,
            grund: befund.grund,
          })
        }
      }
    }
  }

  // KEINE Entduplizierung: Verwenden drei Listenelemente dieselbe kaputte
  // Aktion, sind das DREI Stellen - jede ist eine eigene Position, die der
  // Nutzer sieht. Eine entduplizierte Liste koennte den Fortschritt nie um mehr
  // als eins fallen lassen; genau das verlangt TK 9.7.5 aber. Das Zusammenfassen
  // leistet `stellenZuAktion`, nicht eine verkuerzte Liste.
  return stellen
}

/** Alle Stellen, die EIN Fix an dieser Aktion mit behebt – Listenelemente UND Band-Abschnitte. */
export function stellenZuAktion(
  stellen: readonly KaputteStelle[],
  aktionId: string,
): KaputteStelle[] {
  // Traegt die Zusage aus TK 9.7.5: "Da Aktionen referenzierbar sind, behebt EIN
  // Fix an der Aktion ALLE Stellen, die sie verwenden - Listenelemente UND
  // Band-Abschnitte. Der Fortschritt 'X von N' kann dadurch um mehr als eins
  // sinken."
  //
  // `element_asset` bleibt aussen vor: Diese Stellen haengen an keiner Aktion und
  // werden auf Listenelement-Ebene repariert (TK 9.7.5, Zeile 1 der Tabelle).
  //
  // Die Eingabeliste wird nur gelesen; das Ergebnis ist ein neues Array mit
  // denselben Eintraegen in unveraenderter Reihenfolge.
  return stellen.filter(
    (stelle) =>
      (stelle.art === 'element_aktion' || stelle.art === 'band_abschnitt') &&
      stelle.aktionId === aktionId,
  )
}
