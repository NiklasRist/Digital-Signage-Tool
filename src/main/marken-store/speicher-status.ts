// [marken-store] Ereignis marken:autoSpeichernStatus – Speicherfehler sichtbar machen

import type { MarkenFehlercode } from './fehlercodes'
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import { aufSchreibversuch } from './schreibe-marken'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #277: aufSchreibversuch(
//            hoerer: (ergebnis: { erfolgreich: true }
//                             | { erfolgreich: false; code: MarkenFehlercode }) => void,
//          ): () => void
//          // main-interner Hoerer, fuer JEDEN abgeschlossenen Schreibversuch (sofort/entprellt/Flush)

/**
 * Ereignisform des Speicherstatus dieses Stores. Gleichartig zu `AutoSpeichernEreignis` des
 * project-store (#47) und `VorlagenSpeichernEreignis` (M4-04) – TK 9.15.1: "gleichartig zu
 * `vorlagen:autoSpeichernStatus` (9.12.1)". KEINE Ergebnis-Huelle: Ereignisse tragen keine
 * (TK 9.1.1 Punkte 2 und 5).
 */
export type MarkenSpeichernEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: MarkenFehlercode | GenerischerFehlercode }
// Kanalname (an ipc-gateway zu uebergeben, #304): "marken:autoSpeichernStatus"
// ("<modul>:<ereignis>", TK 9.1.1 Punkt 4)

/**
 * Registriert einen Hoerer fuer Statuswechsel des Marken-Speichers; Rueckgabewert ist die
 * ABMELDE-Funktion. Diese Datei kennt WEDER den Kanalnamen NOCH ein `BrowserWindow`: Sie meldet
 * main-intern. Den Weg auf den IPC-Kanal baut die Verdrahtung im `ipc-gateway` (#304).
 */
export function aufMarkenSpeichernEreignis(
  hoerer: (ereignis: MarkenSpeichernEreignis) => void,
): () => void {
  beginneUebersetzung()
  hoererListe.push(hoerer)
  return () => {
    // Genau EINE Anmeldung entfernen - ein zweimal Angemeldeter bleibt einmal drin.
    const stellen = hoererListe.indexOf(hoerer)
    if (stellen !== -1) hoererListe.splice(stellen, 1)
  }
}

/**
 * Die INTERNEN Bauteile. Die Anmeldung bei `aufSchreibversuch` (#277) geschieht EINMAL
 * (beim ersten Aufruf von aufMarkenSpeichernEreignis), NICHT beim Modul-Laden - ein
 * Testlauf, der die Datei nur importiert, ohne zu hoeren, setzt keine Meldungen ab.
 */
const hoererListe: Array<(ereignis: MarkenSpeichernEreignis) => void> = []
let istInFehlerzustand = false
let uebersetzungAn = false

function beginneUebersetzung(): void {
  if (uebersetzungAn) {
    return
  }
  uebersetzungAn = true
  aufSchreibversuch((schreibversuch) => {
    if (!schreibversuch.erfolgreich) {
      // (1) JEDER Fehlschlag feuert - auch der zweite, dritte; die Oberflaeche soll
      // sehen, dass es WEITER schiefgeht, nicht nur einmal.
      istInFehlerzustand = true
      schickeAnAlle({ typ: 'fehler', code: schreibversuch.code })
      return
    }
    if (!istInFehlerzustand) {
      // (3) KEIN Dauerfeuer: ein gelungener Lauf ohne vorherigen Fehler meldet nichts;
      // der Hinweis soll verschwinden, nicht bei jedem Tastendruck blinken.
      return
    }
    // (2) Der ERSTE Erfolg nach einem Fehler feuert GENAU EIN 'gespeichert' und endet
    // den Fehlerzustand.
    istInFehlerzustand = false
    schickeAnAlle({ typ: 'gespeichert' })
  })
}

function schickeAnAlle(ereignis: MarkenSpeichernEreignis): void {
  // Abmeldung WAEHREND des Feuerns darf Stellung im Slice nicht verwerfen - DAS Array ist
  // momentan zuerst. (KEINE Entdopplung gewuenscht: ein zweimal Angemeldeter hoert zweimal.)
  for (const horcher of [...hoererListe]) {
    try {
      horcher(ereignis)
    } catch {
      // (4) Ein werfender Hoerer bringt weder die Übersetzung noch die uebrigen Hoerer
      // zu Fall; der Wurf verlaesst diese Datei nicht.
    }
  }
}
