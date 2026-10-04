// Die REINE Auswahlregel hinter der Aktions-Auswahl im Reparatur-Modus (#203).
// Kein JSX, kein React, kein IPC.
//
// dieselbe Regel wie #131 (kaputt-Erkennung): Kaputte Aktionen werden nicht
// angeboten - die Fuehrung staende sonst vor derselben Sorte kaputter Stelle, nur
// mit anderer Kennung, und der Nutzer liefe im Kreis. Gueltig ist dagegen
// bildRef === null: nicht jede Vorlage braucht ein Motiv.
// (Warum hier trotzdem keine zweite Wahrheit neben #131: Diese Datei beantworte
// "welche Aktion TAUGT ALS ERSATZ?" - und ist bis die UNBENUTZTEN relevant. #131
// ermittelt sie nur fuer Benutzte ableitbar.)

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'

/**
 * Taugt diese Aktion als Ersatz? Nur wenn ihr Bild vorhanden ist:
 *   bildRef === null                              → true  (Aktion ohne Bild ist gültig)
 *   bildRef zeigt auf ein Asset mit zustand 'ok'  → true
 *   bildRef zeigt auf ein fehlendes/unbekanntes Asset → false
 * Der Typ des Assets wird NICHT geprüft (das tut der action-editor beim Setzen).
 */
export function istAktionBrauchbar(aktion: Aktion, assets: readonly Asset[]): boolean {
  if (aktion.bildRef === null) {
    return true
  }
  const asset = assets.find((eintrag) => eintrag.id === aktion.bildRef)
  if (asset === undefined) {
    return false
  }
  return asset.zustand === 'ok'
}

/**
 * Die anbietbaren Aktionen. Reihenfolge = Bestandsreihenfolge aus `aktionen`; es wird NICHT
 * sortiert - eine zweite, unsichtbare Ordnung neben der gespeicherten wäre für den Nutzer
 * nicht erklärbar. `ausgeschlossen` nimmt genau die aktuell referenzierte Aktion heraus
 * (erneut zu waehlen waere ein Klick ohne Wirkung); null = nichts ausgeschlossen.
 */
export function waehlbareAktionen(
  aktionen: readonly Aktion[],
  assets: readonly Asset[],
  ausgeschlossen: string | null,
): Aktion[] {
  return aktionen.filter(
    (aktion) => aktion.id !== ausgeschlossen && istAktionBrauchbar(aktion, assets),
  )
}
