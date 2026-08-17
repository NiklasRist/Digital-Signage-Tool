// GENERIERT aus dem Signaturblock von Issue #137.
// [action-editor] Vorlage zuweisen – nur nutzbare Vollflächen-Vorlagen
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
// GERUEST-PRUEFSUMME: dc37b31a56a1eaa3
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
import type { Vorlage } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Ist diese Vorlage im action-editor auswählbar? Nutzbar (parent === null) UND vollflächig. */
export function istWaehlbar(vorlage: Vorlage): boolean {
  return vorlage.parent === null && vorlage.art === 'vollflaeche'
}

/** Holt die nutzbaren Vorlagen vom vorlagen-store und behält nur die auswählbaren.
 *  Die Reihenfolge des Bestands bleibt erhalten.
 *  Fehlercode-Parameter ist `string` – Begründung unter „ENTSCHIEDEN" unmittelbar darunter. */
export async function ladeWaehlbareVorlagen(): Promise<Ergebnis<Vorlage[], string>> {
  // Kanal aus der Registry (#25), NICHT als Literal getippt; der Kanal erwartet KEINE
  // Nutzlast (#99) – deshalb kein zweites Argument.
  try {
    const antwort = await rufeAuf<Vorlage[], string>(KANAELE.vorlagen.listeVorlagen)
    if (!antwort.ok) {
      // Lesefehler wird UNVERÄNDERT durchgereicht (#99 zu TK 9.1.1 Punkt 7): keine leere
      // Liste als Ersatz – sie sähe für den Nutzer aus, als gäbe es keine Vorlagen.
      return antwort
    }
    // Art-Filter GEHÖRT hierher (TK 9.11.1 Punkt 0: das Angebot der passenden Art macht
    // die Oberfläche; #99 verbietet dem Store ausdrücklich das Filtern nach `art`).
    // Bestandsreihenfolge bleibt, kein sort. Eine leere gefilterte Liste ist keine Fehler,
    // sondern eine Aussage ("gerade keine vollflächige Vorlage").
    const waehlbare = antwort.wert.filter(istWaehlbar)
    return { ok: true, wert: waehlbare }
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24). Fehlerpfad: gefangen und als
    // Huelle gemeldet, KEIN throw (TK 9.1.1 Punkt 7).
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}

/** Die aktuell zugewiesene Vorlage einer Aktion in der Auswahlliste finden.
 *  null = die `vorlagenId` der Aktion ist nicht (mehr) auswählbar; die Oberfläche zeigt dann
 *  „unbekannte Vorlage" und verlangt eine bewusste Neuwahl. */
export function findeZugewiesene(vorlagenId: string, waehlbare: Vorlage[]): Vorlage | null {
  // Kein Ersatz-Vorlage einsetzen (Verbot): unbekannte id -> null; die Liste wird NICHT
  // erneut gefiltert. Leerer String ist erlaubt und ergibt ebenfalls null.
  return waehlbare.find((vorlage) => vorlage.id === vorlagenId) ?? null
}
