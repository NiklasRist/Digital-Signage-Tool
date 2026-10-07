 
// GENERIERT aus dem Signaturblock von Issue #302.
// [marken-editor] Löschen mit Vorwarnung
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
// GERUEST-PRUEFSUMME: 2824545f80db07bd
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

import { rufeAuf } from '../ipc-client/rufe-auf'
import { KANAELE } from '../../shared/contracts/kanaele'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, Markennutzung } from '../../shared/contracts/marke'

export interface Loeschvorschau {
  darfLoeschen: boolean          // false bei eingebaut:true ODER bei mindestens einer Referenz
                                 // in EINER der DREI Listen von Markennutzung
  eingebaut: boolean
  nutzung: Markennutzung | null  // null NUR wenn eingebaut:true (Prüfung wird dann übersprungen)
}

/**
 * Ermittelt VOR jedem Löschversuch, ob und warum eine Marke nicht gelöscht werden darf.
 * Ruft `pruefeMarkenReferenzen` NUR auf, wenn die Marke nicht eingebaut ist (eine eingebaute Marke
 * ist immer und ohne Prüfung gesperrt, TK 9.15.1).
 * darfLoeschen = nutzung.aktionen.length === 0
 *             && nutzung.abgeleiteteMarken.length === 0
 *             && nutzung.standardInProjekten.length === 0
 */
export async function ermittleLoeschvorschau(
  marke: Marke,
): Promise<Ergebnis<Loeschvorschau, string>> {
  // Die EINGEBAUTE MARKE ohne Pruefung (TK 9.15.1): sie ist nie loeschbar,
  // und der Kanal wird NICHT gerufen.
  if (marke.eingebaut) {
    return {
      ok: true,
      wert: { darfLoeschen: false, eingebaut: true, nutzung: null },
    }
  }
  const pruefung = await rufeAuf<Markennutzung, string>(
    KANAELE.marken.pruefeMarkenReferenzen,
    { markeId: marke.id },
  )
  if (!pruefung.ok) return pruefung
  const nutzung = pruefung.wert
  // ALLE DREI Bedingungen - nichts fehlt, nichts wird verkuerzt (AD v1.4 FA-23).
  const frei =
    nutzung.aktionen.length === 0 &&
    nutzung.abgeleiteteMarken.length === 0 &&
    nutzung.standardInProjekten.length === 0
  return { ok: true, wert: { darfLoeschen: frei, eingebaut: false, nutzung } }
}

/**
 * true GENAU DANN, wenn die Vorschau Treffer in `standardInProjekten` trägt – also wenn die
 * anzeigende Stelle (#330) zusätzlich zur Trefferliste den AUSWEG zeigen muss: den Verweis auf den
 * Reiter [Projekte], wo sich die Standardmarke wechseln lässt (TK 9.15.2, TK 9.5.2).
 *
 * REIN: kein IPC, kein Zustand, wirft nie. Bei `nutzung === null` (eingebaute Marke) IMMER false –
 * die eingebaute Marke ist unabhängig von jeder Referenz gesperrt, ein Ausweg existiert nicht.
 *
 * WARUM ALS FUNKTION UND NICHT ALS FELD an `Loeschvorschau`: Ein zweites, gespeichertes Feld neben
 * `nutzung.standardInProjekten` wäre eine zweite Zählung derselben Sache und könnte von ihr
 * abweichen. Als abgeleitete Funktion kann sie das nicht – und die Bedingung steht trotzdem an
 * genau EINER Stelle statt in jeder anzeigenden Komponente neu.
 */
export function brauchtStandardmarkenAusweg(vorschau: Loeschvorschau): boolean {
  // Rein abgeleitet, keine zweite Zaehlung. nutzung === null ist NUR die
  // eingebaute Marke - deren Ausweg existiert nicht.
  return vorschau.nutzung !== null && vorschau.nutzung.standardInProjekten.length > 0
}

/**
 * Löst das eigentliche Löschen aus. Der Aufrufer MUSS zuvor ermittleLoeschvorschau() gezeigt und
 * der Nutzer MUSS bestätigt haben – diese Funktion prüft das NICHT nach und verlässt sich auf die
 * Blockade in löscheMarke (#287) als letzte Instanz (TOCTOU-Fall, s. Fehlerpfade).
 */
export async function bestaetigeLoeschen(
  markeId: string,
): Promise<Ergebnis<void, string>> {
  // Delegieren ohne Vorpruefung (Verbot): die Sperre von loescheMarke (#287)
  // ist die letzte Instanz; TOCTOU ist der UI-Stelle (#330) zugeordnet.
  return rufeAuf<void, string>(KANAELE.marken.loescheMarke, { markeId })
}
