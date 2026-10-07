// [ipc-gateway] Sender des Auto-Speichern-Ereignisses `marken:autoSpeichernStatus` (#304).
//
// DIE LETZTE MEILE eines dritten Ereignis-Wegs: Der Empfaenger im Renderer ist gebaut
// (abonniere, #151), die main-interne Meldung ist gebaut (aufMarkenSpeichernEreignis,
// #278) - aber niemand ueberfuehrt sie auf den IPC-Kanal. Ohne diese Datei bleibt ein
// gescheitertes Speichern der marken.json VOLLSTAENDIG unsichtbar (NFA-02): Dieselbe
// Fehlerklasse, die M7-45/#238 fuer project/vorlagen bereits geschlossen hat, bliebe fuer
// marken offen, bis ein Nutzer beim naechsten Start seine Markenänderungen vermisst.
//
// WARUM EIGENE DATEI statt dritter Zweig in #238: "Ein Issue darf keine fremde Datei
// aendern." #238 (speicherstatus-verdrahtung.ts) ist eine fremde, bereits abgeschlossene
// Datei; wuerde dieser Zweig dort "nur erweitern", muessten zwei Agents dieselbe Datei
// schreiben. Kein Import aus ihr, kein Aufruf von verdrahteSpeicherstatusIPC (Verbot).
//
// KEIN ZUSTAND, KEINE FACHLOGIK: Diese Datei merkt sich keinen "letzten Status", keinen
// Zaehler, kein Merkflag und keinen Puffer. Sie liest keine Datei und registriert keinen
// Aufrufkanal. Sie reicht durch - jede Meldung UNVERAENDERT, OHNE Huelle, OHNE Endzustand,
// OHNE Umformen (TK 9.1.1 Punkt 5: Ereignisse sind Einbahnstrassen und tragen keinen
// Endzustand).
//
// Genau EINE Anmeldung: Zwei hiessen zwei Weitergaben derselben Meldung, und der Renderer
// bekaeme jeden Status doppelt. Ereignisse vor dem Aufbau des Fensters verfallen still -
// es wird NICHT gepuffert (TK 9.1.1).

import type { BrowserWindow } from 'electron'

import { KANAELE } from '../../shared/contracts/kanaele' // #25
import type { MarkenSpeichernEreignis } from '../marken-store/speicher-status' // #278
import { aufMarkenSpeichernEreignis } from '../marken-store/speicher-status' // #278

// Fremder Aufruf - gegen die gebaute Datei geprueft (07.10.2026):
//   #278: aufMarkenSpeichernEreignis(hoerer: (ereignis: MarkenSpeichernEreignis) => void): () => void
//     // MAIN-INTERN. Nachgelesen in src/main/marken-store/speicher-status.ts: Die Datei
//     // importiert weder `electron` noch die Kanal-Registry - sie sendet NICHT selbst
//     // (Kommentar dort: "Den Weg auf den IPC-Kanal baut die Verdrahtung im ipc-gateway,
//     // #304"). Es gibt also GENAU EINEN Ereignisweg auf `marken:autoSpeichernStatus`,
//     // und der ist dieser hier.
//   MarkenSpeichernEreignis ist
//     | { typ: 'gespeichert' }
//     | { typ: 'fehler'; code: MarkenFehlercode | GenerischerFehlercode }

/**
 * Der EINE Sendeweg an das EINE Fenster (TK 9.1.1 Punkt 10: "Die App hat GENAU EIN Fenster -
 * und jedes Ereignis geht an dieses eine Fenster. Der Sender im Main adressiert das eine
 * Fenster; es gibt keine Verteilerlogik, keine Empfaengerliste, kein 'an alle Fenster
 * senden'.").
 *
 * Gleiche Bauform wie `sende` in speicherstatus-verdrahtung.ts (#238):
 *  - DIE PRUEFUNG AUF `isDestroyed()` IST TRAGEND: Nach dem Schliessen des Fensters wirft
 *    bereits der Zugriff auf `webContents`. Dieser Hoerer laeuft innerhalb der Schreibkette
 *    des marken-store - ausgerechnet in dem Pfad, der gerade ohnehin einen Speicherfehler
 *    behandelt. Eine Ausnahme von hier liefe dorthin zurueck.
 *  - VERWORFEN WIRD STILL und ohne Merker: Gepuffert wird ausdruecklich nichts.
 *  - Das try/catch daneben ist die zweite Haelfte der Zusage "der Versand darf NIE werfen":
 *    Zwischen Pruefung und Senden liegt kein `await`, aber `webContents` kann auch aus
 *    anderem Grund weg sein (abgestuerzter Renderer-Prozess). Abfangen, intern
 *    protokollieren, kein throw nach aussen.
 */
function sende(fenster: BrowserWindow, kanal: string, nutzlast: unknown): void {
  if (fenster.isDestroyed()) {
    return
  }
  try {
    fenster.webContents.send(kanal, nutzlast)
  } catch (ursache) {
    console.error(
      `[ipc-gateway] marken-speicherstatus-verdrahtung: Senden auf "${kanal}" fehlgeschlagen:`,
      ursache,
    )
  }
}

export function verdrahteMarkenSpeicherstatusIPC(fenster: BrowserWindow): void {
  // Der Kanalname kommt aus der Registry (#25); in dieser Datei steht kein Kanalname als
  // Zeichenkette, nur der Protokoll-Praefix in der Fehlermeldung oben - und der gilt der
  // Datei, nicht dem Ereignis-Kanal.
  //
  // Die Anmeldung wird NUR beim Aufruf dieser Funktion versucht - nicht beim Import. Und
  // sie passiert SOFORT, nicht erst, wenn das Fenster geladen ist; früher eintreffende
  // Meldungen verfallen still (kein Puffer).
  //
  // JEDE Anmeldung einzeln abgefangen (hier die einzige): Wirft `aufMarkenSpeichernEreignis`,
  // laeuft der Start des Hauptprozesses trotzdem weiter - die Markendatei ist dann unveraendert
  // da, nur ihr Status ist still. Intern protokolliert, nicht geschluckt.
  let markenAbmelden: () => void = () => {}
  try {
    markenAbmelden = aufMarkenSpeichernEreignis((ereignis: MarkenSpeichernEreignis) => {
      sende(fenster, KANAELE.marken.autoSpeichernStatus, ereignis)
    })
  } catch (ursache) {
    console.error(
      '[ipc-gateway] marken-speicherstatus-verdrahtung: Anmeldung fehlgeschlagen:',
      ursache,
    )
  }
  void markenAbmelden // Ein einmal verdrahteter Sender meldet sich nie wieder ab (wie #238).
}
