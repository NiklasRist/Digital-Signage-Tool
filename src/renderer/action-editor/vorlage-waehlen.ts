// [action-editor] Vorlage zuweisen – nur nutzbare Vollflächen-Vorlagen

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
