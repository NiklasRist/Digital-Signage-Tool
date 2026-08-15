// GENERIERT aus dem Signaturblock von Issue #189.
// [render-service] Den Render-Handler beim Programmstart anmelden
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
// GERUEST-PRUEFSUMME: 0d0252f167736a2b

import { registriereRenderHandler } from '../auftrags-manager/render-verzahnung'

import { cancelRender } from './abbruch'
import { renderReel } from './render-reel'

// Fremde Aufrufe - vollstaendige Signaturen, am 15.08.2026 in den GEBAUTEN Dateien nachgelesen,
// nicht aus dem Issue abgeschrieben:
//   #68 (src/main/auftrags-manager/render-verzahnung.ts):
//         registriereRenderHandler(
//           renderReel: (request: RenderRequest,
//                        aufFortschritt: (fortschritt: RenderProgress) => void)
//                        => Promise<RenderResult>,
//           cancelRender: (renderId: string) => void,
//         ): void
//         // registriert intern ueber registriereAuftragsHandler('render', handler, brichAb) (#60)
//         // und leistet die GESAMTE Uebersetzung: Fortschritt -> Auftrag.fortschritt (begrenzt),
//         // RenderResult -> HandlerErgebnis, Pruefung des Fehlercodes gegen TK 9.2.3, Abbrecher,
//         // der die renderId aus auftrag.payload zieht, sowie den Sofort-Flush von D1.
//   #181 (src/main/render-service/render-reel.ts):
//         renderReel(request: RenderRequest,
//                    aufFortschritt: (fortschritt: RenderProgress) => void): Promise<RenderResult>
//   #179 (src/main/render-service/abbruch.ts):
//         cancelRender(renderId: string): void
//         // kehrt SOFORT zurueck und wartet NICHT auf das Prozessende.
//
// Beide Fachfunktionen TRAGEN die von #68 verlangte Form bereits - Parameterzahl, -reihenfolge und
// Rueckgabetyp stimmen zeichengenau. Ein Adapter ist deshalb nicht noetig und waere verboten.

/**
 * Meldet den `render-service` als Ausfuehrenden der Auftragsart `render` an (TK 9.3.2: `render` ->
 * `render-service` (9.2, `renderReel`), Nutzlast `RenderRequest`).
 *
 * OHNE DIESE ZEILE GIBT ES DEN RENDER NICHT. `registriereRenderHandler` (#68) baut die vollstaendige
 * Verzahnung, registriert von sich aus aber nichts - es nimmt `renderReel` und `cancelRender` als
 * Argumente entgegen, weil der `render-service` zum Zeitpunkt von M2 noch gar nicht existierte.
 * Ruft niemand die Funktion mit den echten Implementierungen auf, findet der Dispatcher fuer
 * `art: 'render'` keinen Handler: Der Auftrag erschiene in der Warteschlange, kaeme an die Reihe
 * und scheiterte sofort und immer mit `unbekannter_fehler`, obwohl an `renderReel` nichts falsch
 * waere. FA-08 und Akzeptanzkriterium 2 - das Kernversprechen des Produkts - waeren unerfuellbar.
 *
 * DIE INVARIANTE DIESES ISSUES: Zwischen #68 und den Fachfunktionen liegt KEINE
 * Uebersetzungsschicht. Uebergeben werden die Funktionsreferenzen selbst - kein umhuellendes
 * `async (request, aufFortschritt) => …`, kein try/catch, kein Umformen von `RenderProgress` oder
 * `RenderResult`, keine Pruefung des `fehlercode`. Die gesamte Uebersetzungsarbeit steckt an EINER
 * Stelle in #68; jede Huelle hier waere eine ZWEITE, an der ein Fortschritts-Ereignis oder ein
 * Fehlercode verloren gehen kann: "Geht der Code verloren, degradieren Reparatur-Modus,
 * Wiederholen und der FAT32-Hinweis alle zu 'irgendwas ist schiefgelaufen'." (TK 9.1.1)
 *
 * KEIN DIREKTER EINTRAG BEIM DISPATCHER. `registriereAuftragsHandler` (#60) wird hier NICHT
 * gerufen; der Weg fuer `render` fuehrt ueber #68. Ein direkter Eintrag umginge die Verzahnung und
 * liesse den Auftrag ohne Fortschritt, ohne Abbrecher und ohne geprueften Fehlercode laufen. Fuer
 * `import`/`loeschen`/`export` ist der direkte Weg der richtige - dort gibt es keine
 * Verzahnungsschicht. Diese Asymmetrie ist gewollt.
 *
 * KEIN SOFORT-FLUSH VON D1 HIER. Er ist "der erste Schritt IM HANDLER" (TK 9.3.3) und liegt gebaut
 * in #68 (`flusheD1VorDemRender`, Schritt 1 des dortigen Handlers). Diese Datei ruft weder
 * `holeAktivesProjekt` noch `sofortFlush` noch `mitD1Lock` - ein zweiter Flush schriebe
 * `project.json` ein zweites Mal, ohne dass sich etwas geaendert hat.
 *
 * KEIN ZWEITER ABBRUCHWEG. Kein Prozess-Kill, kein eigenes Abbruch-Flag, keine zusaetzliche
 * Abbruch-Funktion neben `cancelRender`. Der Abbruch laeuft ausschliesslich ueber den in #68
 * registrierten Abbrecher, der die `renderId` aus dem Auftrag zieht - "auftragId und renderId
 * bleiben fest verknuepft" (TK 9.3.6). Diese Datei kennt keine `renderId`.
 *
 * KEIN IPC-KANAL. "Richtung: Renderer -> Main ueber die Auftrags-Queue (`reiheEin`, `art: render`)
 * - kein direkter Request/Response-Aufruf (9.3.4)" (TK 9.2). `kanaele.ts` wird hier nicht
 * angefasst, `registriereHandler` (#23) nicht gerufen.
 *
 * KEINE ABSICHERUNG GEGEN DOPPELTE ANMELDUNG. Was ein zweiter Aufruf bewirkt, legt #60 fest ("eine
 * erneute Registrierung derselben Art ersetzt die vorherige vollstaendig"); ein "schon
 * angemeldet"-Flag hier waere eine zweite Wahrheit ueber dasselbe Verhalten.
 *
 * GERUFEN WIRD SIE VON #3 beim Programmstart, genau einmal und - da sie kein Fenster braucht - in
 * der Gruppe der Anmeldungen OHNE Fenster (dort Position 9). Diese Datei traegt den Aufruf NIRGENDS
 * selbst ein: kein Selbstaufruf am Modulende, kein `app.whenReady()`-Anhang, kein Eintrag in
 * `index.ts`. Eine Anmeldung als Import-Nebeneffekt haenge davon ab, wer wen zuerst importiert -
 * weder nachlesbar noch stabil, und ein frueh eingereihter Auftrag liefe ins Leere.
 *
 * Wirft nie: Sie nimmt keine Eingaben entgegen, fuehrt keine I/O aus und ruft genau eine
 * Registrierungsfunktion mit zwei Funktionsreferenzen auf.
 */
export function meldeRenderHandlerAn(): void {
  // 1. Argument renderReel (#181), 2. Argument cancelRender (#179) - beide DIREKT, als Referenz.
  registriereRenderHandler(renderReel, cancelRender)
}
