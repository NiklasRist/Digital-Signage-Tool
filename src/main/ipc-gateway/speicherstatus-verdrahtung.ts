// GENERIERT aus dem Signaturblock von Issue #238.
// [ipc-gateway] Sender für die beiden Auto-Speichern-Meldungen
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
// GERUEST-PRUEFSUMME: b3bc78859077eb1f
//
// WAS DIESE DATEI IST: die LETZTE MEILE zweier Ereignis-Wege, die sonst beide
// vollstaendig gebaut und trotzdem tot waeren. Der Empfaenger im Renderer ist
// gebaut (`abonniere`, #151), die main-interne Meldung ist gebaut
// (`aufAutoSpeichernEreignis`, #47, und `aufVorlagenSpeichernEreignis`, #98) -
// aber niemand ueberfuehrt sie auf den IPC-Kanal. Ohne diese Datei bleibt ein
// gescheiterter Schreibvorgang VOLLSTAENDIG unsichtbar (NFA-02, FA-15): Die
// Oberflaeche wuerde so aussehen, als sei alles gesichert.
//
// KEIN ZUSTAND, KEINE FACHLOGIK: Diese Datei merkt sich keinen "letzten Status",
// keinen Zaehler, kein Merkflag und keinen Puffer (ENTSCHIEDEN 3). Sie liest
// keine Datei und registriert KEINEN Aufrufkanal (Verbot im Issue). Sie reicht
// durch - jede Meldung unveraendert, OHNE Huelle, OHNE Endzustand, OHNE Filtern.

import type { BrowserWindow } from 'electron'

import { KANAELE } from '../../shared/contracts/kanaele'                    // #25
import type { AutoSpeichernEreignis } from '../project-store/auto-speichern' // #47
import { aufAutoSpeichernEreignis } from '../project-store/auto-speichern'   // #47
import type { VorlagenSpeichernEreignis } from '../vorlagen-store/schreibe-vorlagen' // #98
import { aufVorlagenSpeichernEreignis } from '../vorlagen-store/schreibe-vorlagen'   // #98

// Fremde Aufrufe - alle gegen die GEBAUTEN Dateien geprueft (20.08.2026), nicht
// gegen die Zitate im Issue:
//   #47: aufAutoSpeichernEreignis(hoerer: (ereignis: AutoSpeichernEreignis) => void): () => void
//        // MAIN-INTERN. Nachgelesen in src/main/project-store/auto-speichern.ts: Die Datei
//        // importiert weder `electron` noch die Kanal-Registry - sie sendet NICHT selbst.
//        // Es gibt also genau EINEN Ereignisweg auf `project:autoSpeichernStatus`, und der
//        // ist dieser hier (MELDE-KLAUSEL Punkt 1 ist damit erfuellt).
//   #98: aufVorlagenSpeichernEreignis(hoerer: (ereignis: VorlagenSpeichernEreignis) => void): () => void
//        // MAIN-INTERN; dieselbe Bauform wie #47, absichtlich anderer Name.
//        // Nachgelesen in src/main/vorlagen-store/schreibe-vorlagen.ts: auch diese Datei
//        // kennt weder `electron` noch die Registry. EIN Weg, und der ist dieser hier.

/**
 * Der EINE Sendeweg an das EINE Fenster (TK 9.1.1 Punkt 10).
 *
 * Gleiche Bauform wie `sende` in src/main/ipc-gateway/export-verdrahtung.ts (#191)
 * und src/main/auftrags-manager/ipc-verdrahtung.ts (#71) - die dritte der drei
 * Stellen mit einer Fensterreferenz. Eine gemeinsame Fassung daraus zu machen
 * hiesse, fremde Dateien zu aendern (Regel E); gemeldet in export-verdrahtung.ts.
 *
 * DIE PRUEFUNG AUF `isDestroyed()` IST TRAGEND, nicht kosmetisch: Nach dem
 * Schliessen des Fensters wirft bereits der Zugriff auf `webContents`. Dieser
 * Hoerer laeuft innerhalb der Schreibkette des `project-store` bzw. des
 * `vorlagen-store` - ausgerechnet in den Pfad, der gerade ohnehin einen
 * Speicherfehler behandelt (ENTSCHIEDEN 4). Eine Ausnahme von hier liefe dorthin
 * zurueck.
 *
 * VERWORFEN WIRD STILL und ohne Merker: Gepuffert wird ausdruecklich nichts -
 * "Ereignisse vor dem Aufbau des Fensters verfallen still" (TK 9.1.1).
 *
 * Das `try/catch` daneben ist die zweite Haelfte der Zusage "der Versand darf NIE
 * werfen": Zwischen Pruefung und Senden liegt kein `await`, aber `webContents`
 * kann auch aus anderem Grund weg sein (abgestuerzter Renderer-Prozess).
 */
function sende(fenster: BrowserWindow, kanal: string, nutzlast: unknown): void {
  if (fenster.isDestroyed()) {
    return
  }
  try {
    fenster.webContents.send(kanal, nutzlast)
  } catch (ursache) {
    console.error(
      `[ipc-gateway] speicherstatus-verdrahtung: Senden auf "${kanal}" fehlgeschlagen:`,
      ursache,
    )
  }
}

export function verdrahteSpeicherstatusIPC(fenster: BrowserWindow): void {
  // Beide Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung. Ein Tippfehler
  // waere sonst kein Uebersetzungsfehler, sondern ein Aufruf, der zur Laufzeit ins
  // Leere geht.

  // ------------------------------------------------------------------------------
  // 1. Der project-Zweig.
  // ------------------------------------------------------------------------------
  //
  // GENAU EINE Anmeldung. Zwei hiessen zwei Weitergaben derselben Meldung, und der
  // Renderer bekaeme jeden Status doppelt.
  //
  // DAS OBJEKT REIST NACKT UND UNVERAENDERT: kein `ok`, kein `wert`, kein
  // Statusfeld (TK 9.1.1 Punkt 5 - "Ereignisse sind Einbahnstrassen und tragen
  // keinen Endzustand"). Und kein Umbenennen, kein Weglassen von `typ`/`code`,
  // kein Filtern von `{ typ: 'gespeichert' }`, kein Zeitstempel dazu.
  //
  // KEINE ZWEITE DROSSELUNG: Sie sitzt im Auto-Speichern selbst (3-5 s, TK 9.5.4);
  // eine zweite hier verschlucke Meldungen, die der Store bewusst geschickt hat.
  //
  // JEDE Anmeldung einzeln abgefangen: Wirft `aufAutoSpeichernEreignis`, darf der
  // `vorlagen`-Zweig das nicht mitbekommen und umgekehrt (Fehlerpfad-Tabelle des
  // Issues). Intern protokolliert, nicht geschluckt.
  //
  // Die Anmeldung wird NUR beim Aufruf dieser Funktion versucht - nicht beim
  // Import. Und sie passiert SOFORT, nicht erst, wenn das Fenster geladen ist.
  let projectAbmelden: () => void = () => {}
  try {
    projectAbmelden = aufAutoSpeichernEreignis((ereignis: AutoSpeichernEreignis) => {
      sende(fenster, KANAELE.project.autoSpeichernStatus, ereignis)
    })
  } catch (ursache) {
    console.error(
      "[ipc-gateway] speicherstatus-verdrahtung: project-Zweig konnte sich nicht anmelden:",
      ursache,
    )
  }

  // ------------------------------------------------------------------------------
  // 2. Der vorlagen-Zweig.
  // ------------------------------------------------------------------------------
  //
  // Baugleich zum project-Zweig, aber auf einem EIGENEN Kanal (TK 9.12.1,
  // ENTSCHIEDEN 1): Die Vorlagen-Bibliothek ist app-weit, sie haengt nicht am
  // geladenen Projekt - die Oberflaeche muss die beiden Faelle unterscheiden.
  let vorlagenAbmelden: () => void = () => {}
  try {
    vorlagenAbmelden = aufVorlagenSpeichernEreignis((ereignis: VorlagenSpeichernEreignis) => {
      sende(fenster, KANAELE.vorlagen.autoSpeichernStatus, ereignis)
    })
  } catch (ursache) {
    console.error(
      "[ipc-gateway] speicherstatus-verdrahtung: vorlagen-Zweig konnte sich nicht anmelden:",
      ursache,
    )
  }

  // ABRAEUMEN, wenn das Fenster tatsaechlich weg ist - dieselbe Zeile und derselbe
  // Grund wie in #71 und #191: #47 und #98 halten ihre Hoerer in Mengen, die den
  // ganzen Prozess ueberdauern. Ohne das Abmelden haengen dort dauerhaft eine
  // Fensterreferenz an lebenden Hoerern, und jede weitere Meldung liefe in `sende`
  // und dort in die `isDestroyed`-Pruefung - ein stiller Leerlauf.
  //
  // `once('closed')` und NICHT `'close'`: `close` ist abbrechbar (ein Hoerer kann
  // `preventDefault` rufen), und eine dort ausgehaengte Verdrahtung liesse sich
  // durch nichts wieder anmelden. `closed` faellt an, wenn das Fenster tatsaechlich
  // weg ist.
  //
  // Das ist KEIN Warten auf den Aufbau des Fensters: Angemeldet wird sofort und
  // unbedingt, aufgeschoben ist allein das ABMELDEN. Gepuffert wird nichts.
  fenster.once('closed', () => {
    projectAbmelden()
    vorlagenAbmelden()
  })
}
// 1. meldet sich EINMAL ueber aufAutoSpeichernEreignis (#47) als Hoerer an und gibt jede
//    Meldung UNVERAENDERT auf dem Ereignis-Kanal `project:autoSpeichernStatus` an den
//    Renderer weiter – OHNE Huelle, OHNE Endzustand, OHNE Umformen oder Filtern
// 2. dasselbe fuer den vorlagen-store auf dem Kanal `vorlagen:autoSpeichernStatus`
//    – die main-interne Anmelde-Funktion dafuer ist `aufVorlagenSpeichernEreignis` (#98)
// Kein Zustand, keine Fachlogik, kein Aufrufkanal, keine Umformung der Nutzlast.