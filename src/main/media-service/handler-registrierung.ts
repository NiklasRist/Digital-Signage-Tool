// GENERIERT aus dem Signaturblock von Issue #92.
// [media-service] Handler für import und loeschen registrieren
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
// GERUEST-PRUEFSUMME: 1487f8c4b8b729d6

import { registriereAuftragsHandler } from '../auftrags-manager/dispatcher';

import { importMedium } from './import-medium';
import { löscheMedium } from './loesche-medium';

// Fremde Aufrufe - vollstaendige Signaturen, am 13.08.2026 in der GEBAUTEN Datei nachgelesen,
// nicht aus dem Issue abgeschrieben:
//   #60 (src/main/auftrags-manager/dispatcher.ts):
//         registriereAuftragsHandler<A extends AuftragArt>(
//           art: A, handler: HandlerFuer<A>, brichAb?: (auftrag: Auftrag) => void,
//         ): void
//         // genau EIN Handler je Art; fehlt brichAb, ist die Art NICHT abbrechbar
//         // (kannAbbrechen(art) liefert dann false)
//   #85:  importMedium(auftrag: Extract<Auftrag, { art: 'import' }>, kontext: AusfuehrungsKontext)
//           : Promise<HandlerErgebnis<ImportFehlercode>>
//   #87:  löscheMedium(auftrag: Extract<Auftrag, { art: 'loeschen' }>, kontext: AusfuehrungsKontext)
//           : Promise<HandlerErgebnis<LoeschFehlercode>>
//
// Beide Fachfunktionen TRAGEN die Handler-Signatur bereits: `HandlerErgebnis<ImportFehlercode>`
// bzw. `HandlerErgebnis<LoeschFehlercode>` sind auf `HandlerErgebnis<string>` zuweisbar, das
// `HandlerFuer<A>` verlangt. Ein Adapter ist deshalb nicht noetig - und waere verboten.

/**
 * Meldet die beiden Medien-Auftragsarten beim Dispatcher an (TK 9.3.2).
 *
 * DIE INVARIANTE DIESES ISSUES: Zwischen Dispatcher und Fachfunktion liegt KEINE
 * Uebersetzungsschicht. Uebergeben wird die Funktionsreferenz selbst - kein umhuellendes
 * `async (auftrag, kontext) => …`, kein try/catch, keine Pruefung und kein Neuaufbau des
 * `HandlerErgebnis`. Jede Huelle waere eine ZWEITE Stelle, an der ein Fehlercode oder ein
 * `daten`-Feld verloren gehen kann, und der fachliche Code entsteht ausschliesslich in
 * #85/#87: "Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der
 * FAT32-Hinweis alle zu 'irgendwas ist schiefgelaufen'." (TK 9.1.1)
 *
 * Auch das Fangen gehoert nicht hierher. Dass ein Handler nie wirft, sagen #85 und #87 in
 * ihren eigenen Vertraegen zu; abgesichert ist es zusaetzlich vom Dispatcher, der eine
 * geworfene Ausnahme in `unbekannter_fehler` wandelt (#60). Ein DRITTES try/catch waere die
 * einzige der drei Stellen, die den fachlichen Code nicht kennt.
 *
 * KEIN ABBRECHER (dritter Parameter bleibt weg), fuer beide Arten. Grundlage ist FA-18: "Ein
 * noch nicht gestarteter Auftrag kann aus der Warteschlange entfernt, ein laufender Render
 * abgebrochen werden." Nur der Render ist abbrechbar. Auch keine LEERE `brichAb`-Funktion -
 * sie wuerde `kannAbbrechen('import')` auf `true` setzen und der Oberflaeche (#62) einen
 * Abbruch anbieten, der nichts tut.
 *
 * GERUFEN WIRD SIE VON #3 beim Programmstart, genau einmal und - da sie kein Fenster braucht -
 * in der Gruppe der Anmeldungen OHNE Fenster (Schritt 5 des Bootstraps, also vor
 * `verdrahteQueueIPC(fenster)`). Diese Datei traegt den Aufruf NIRGENDS selbst ein: kein
 * Selbstaufruf am Modulende, kein `app.whenReady()`-Anhang, kein Eintrag in `index.ts`. Eine
 * Anmeldung als Import-Nebeneffekt haenge davon ab, wer wen zuerst importiert - weder
 * nachlesbar noch stabil.
 */
export function registriereMedienHandler(): void {
  // 1. trägt für art: 'import'   die Funktion importMedium (#85) DIREKT als Handler ein
  registriereAuftragsHandler('import', importMedium);
  // 2. trägt für art: 'loeschen' die Funktion löscheMedium (#87) DIREKT als Handler ein
  registriereAuftragsHandler('loeschen', löscheMedium);
  // 3. registriert für BEIDE Arten KEINEN Abbrecher (dritter Parameter bleibt weg)
}
