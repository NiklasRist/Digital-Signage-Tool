// GENERIERT aus dem Signaturblock von Issue #190.
// [export-service] Den Export-Handler bei der Auftragsverwaltung anmelden
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
// GERUEST-PRUEFSUMME: f2b1168585a496e4

import { registriereAuftragsHandler } from '../auftrags-manager/dispatcher'

import { exportiereAusgabe } from './export'

// Fremde Aufrufe - vollstaendige Signaturen, am 14.08.2026 in der GEBAUTEN Datei nachgelesen,
// nicht aus dem Issue abgeschrieben:
//   #60 (src/main/auftrags-manager/dispatcher.ts):
//         registriereAuftragsHandler<A extends AuftragArt>(
//           art: A, handler: HandlerFuer<A>, brichAb?: (auftrag: Auftrag) => void,
//         ): void
//         // genau EIN Handler je Art; ein zweiter Aufruf ERSETZT den Eintrag als Ganzes.
//         // Fehlt brichAb, ist die Art NICHT abbrechbar - kannAbbrechen('export') liefert false.
//   #188 (src/main/export-service/export.ts):
//         exportiereAusgabe(
//           auftrag: Extract<Auftrag, { art: 'export' }>, kontext: AusfuehrungsKontext,
//         ): Promise<HandlerErgebnis<ExportFehlercode>>
//         // "Sie wirft NIE." und liefert nie { status: 'abgebrochen' } (eigener Vertrag, #188).
//
// Die Fachfunktion TRAEGT die Handler-Signatur bereits: `HandlerErgebnis<ExportFehlercode>` ist
// auf `HandlerErgebnis<string>` zuweisbar, das `HandlerFuer<'export'>` verlangt. Ein Adapter ist
// deshalb nicht noetig - und waere verboten.

/**
 * Meldet die vierte und letzte Auftragsart beim Dispatcher an (TK 9.3.2: `export` ->
 * `export-service`, Nutzlast `ExportRequest`).
 *
 * OHNE DIESE ZEILE GIBT ES DEN EXPORT NICHT. Der Dispatcher waehlt den Ausfuehrenden ALLEIN ueber
 * `auftrag.art` und kennt keinen Fachdienst beim Namen. Fehlt der Eintrag, meldet `fuehreAus`
 * (#60) `unbekannter_fehler` - jeder Export schluege sofort und immer fehl, obwohl an
 * `exportiereAusgabe` nichts falsch waere. Betroffen sind FA-09 und der zweite Teil von
 * Akzeptanzkriterium 2.
 *
 * DIE INVARIANTE DIESES ISSUES: Zwischen Dispatcher und Fachfunktion liegt KEINE
 * Uebersetzungsschicht. Uebergeben wird die Funktionsreferenz selbst - kein umhuellendes
 * `async (auftrag, kontext) => …`, kein try/catch, keine Pruefung und kein Neuaufbau des
 * `HandlerErgebnis`. Jede Huelle waere eine ZWEITE Stelle, an der ein Fehlercode, ein
 * `daten`-Feld oder das Auftrags-Ergebnis verloren gehen kann, und der fachliche Code entsteht
 * ausschliesslich in #188: "Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und
 * der FAT32-Hinweis alle zu 'irgendwas ist schiefgelaufen'." (TK 9.1.1) Beim Export ist das
 * besonders greifbar: `datei_zu_gross_fat32` muss zur exFAT-Empfehlung fuehren, `ziel_gesperrt` zu
 * "Programm schliessen", `kein_platz` zu "aufraeumen" - drei Handlungen aus drei Codes.
 *
 * AUCH DAS FANGEN GEHOERT NICHT HIERHER. Dass der Handler nie wirft, sagt #188 in seinem eigenen
 * Vertrag zu ("Sie wirft NIE"); abgesichert ist es zusaetzlich vom Dispatcher, der eine geworfene
 * Ausnahme in `unbekannter_fehler` wandelt (#60). Ein DRITTES try/catch waere die einzige der drei
 * Stellen, die den fachlichen Code nicht kennt.
 *
 * KEIN SOFORT-FLUSH VON D1 HIER. Er ist "der erste Schritt IM HANDLER" (TK 9.3.3) und liegt
 * gebaut in #188 (Schritt 0 von `exportiereAusgabe`). Diese Datei ruft weder `holeAktivesProjekt`
 * noch `sofortFlush` noch `mitD1Lock` - ein zweiter Flush schriebe `project.json` ein zweites Mal,
 * ohne dass sich etwas geaendert hat.
 *
 * KEIN ABBRECHER (dritter Parameter bleibt weg). Grundlage ist FA-18: "Ein noch nicht gestarteter
 * Auftrag kann aus der Warteschlange entfernt, ein laufender Render abgebrochen werden." Nur der
 * Render ist abbrechbar; ein ANSTEHENDER Export laesst sich weiterhin ueber `entferne` (#62) aus
 * der Schlange nehmen, das braucht keinen Abbrecher. Auch keine LEERE `brichAb`-Funktion - sie
 * wuerde `kannAbbrechen('export')` auf `true` setzen und der Oberflaeche einen Knopf anbieten, der
 * mitten in einem Kopiervorgang auf ein Wechselmedium eingriffe; genau das schliesst TK 9.6.3 aus.
 *
 * KEIN IPC-KANAL. Ein Export wird nie direkt aufgerufen, sondern ueber `reiheEin` eingereiht
 * (TK 9.3.4); `kanaele.ts` wird hier nicht angefasst und `registriereHandler` (#23) nicht gerufen.
 * Der einzige Export-Kanal des Systems ist `export:wähleExportZiel`, angemeldet in #191.
 *
 * GERUFEN WIRD SIE VON #3 beim Programmstart, genau einmal und - da sie kein Fenster braucht - in
 * der Gruppe der Anmeldungen OHNE Fenster (dort Position 10). Diese Datei traegt den Aufruf
 * NIRGENDS selbst ein: kein Selbstaufruf am Modulende, kein `app.whenReady()`-Anhang, kein Eintrag
 * in `index.ts`. Eine Anmeldung als Import-Nebeneffekt haenge davon ab, wer wen zuerst importiert -
 * weder nachlesbar noch stabil, und ein frueh eingereihter Auftrag liefe ins Leere.
 */
export function meldeExportHandlerAn(): void {
  // 1. trägt für art: 'export' die Funktion exportiereAusgabe (#188) DIREKT als Handler ein
  // 2. registriert für diese Art KEINEN Abbrecher (dritter Parameter bleibt weg)
  registriereAuftragsHandler('export', exportiereAusgabe)
}
