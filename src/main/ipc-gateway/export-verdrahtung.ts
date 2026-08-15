// GENERIERT aus dem Signaturblock von Issue #191.
// [ipc-gateway] Den Export-Kanal und das Render-Fortschritts-Ereignis verdrahten
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
// GERUEST-PRUEFSUMME: 48d1e5546ba4a3da
//
// ERLEDIGT (14.08.2026): Die dateiweite Abschaltzeile fuer no-unused-vars ist mit
// dem Fuellen des Rumpfes entfernt - Parameter und Importe werden jetzt benutzt.
//
// WAS DIESE DATEI IST: die LETZTE MEILE zweier Wege, die sonst beide vollstaendig
// gebaut und trotzdem tot waeren.
//   1. `wähleExportZiel` (#183) ist der einzige Ort, an dem ein absoluter Zielpfad
//      entsteht; der Renderer sieht "**nur relative** Referenzen (`dateiname`),
//      **nie** absolute Pfade" (TK 9.5.7). Ohne den Kanal hier bleibt
//      `ExportRequest.zielPfad` unfuellbar und FA-09 unerfuellbar.
//   2. `render:fortschritt` ist die einzige Rueckmeldung waehrend eines Renders,
//      der Minuten dauert. Die Kette #158 -> #160 -> #177 -> #178 rechnet den Wert
//      aus; hier wird er ueber die Prozessgrenze getragen. "**Der Kanal
//      `render:fortschritt` wird gebaut, nicht nur erwaehnt.**" (TK 9.2.7)
//
// KEIN ZUSTAND, KEINE FACHLOGIK: Diese Datei merkt sich keine renderId, kein
// "letztes Ereignis", keinen Prozentwert und keinen Zielpfad. Sie liest keine
// Datei, nimmt kein Lock und ruft kein ffmpeg. Sie reicht durch.

import type { BrowserWindow } from 'electron'

import { KANAELE } from '../../shared/contracts/kanaele'                 // #25
import type { RenderProgress } from '../../shared/contracts/render-progress' // #157
import { wähleExportZiel } from '../export-service/ziel-dialog'          // #183
import { aufRenderFortschritt } from '../render-service/fortschritt'     // #178
import { ohneNutzlast } from './nutzlast-pruefer'                        // #332
import { registriereHandler } from './registriere-handler'               // #23

// Fremde Aufrufe - alle gegen die GEBAUTEN Dateien geprueft (14.08.2026), nicht gegen
// die Zitate im Issue:
//   #23: registriereHandler<T, F extends string>(
//          kanal: string,
//          validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                          | { ok: true; wert: unknown },
//          ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//        ): void
//   #183: wähleExportZiel(): Promise<Ergebnis<{ pfad: string | null }>>
//         // `pfad === null` heisst "abgebrochen" und ist ok:true, KEIN Fehler.
//   #178: aufRenderFortschritt(hoerer: (fortschritt: RenderProgress) => void): () => void
//         // MAIN-INTERN; der Rueckgabewert ist die Abmelde-Funktion. #178 sendet NICHT
//         // selbst - nachgelesen in src/main/render-service/fortschritt.ts: die Datei
//         // importiert weder `electron` noch die Kanal-Registry. Es gibt also genau
//         // EINEN Ereignisweg, und das ist dieser hier.
//   #332: ohneNutzlast(): { ok: true; wert: undefined }
//         // Der gemeinsame Validierer der argumentlosen Kanaele. Eine trotzdem
//         // uebergebene Nutzlast wird IGNORIERT, nicht abgelehnt.

/**
 * Der EINE Sendeweg an das EINE Fenster (TK 9.1.1 Punkt 10).
 *
 * Gleiche Bauform wie `sende` in src/main/auftrags-manager/ipc-verdrahtung.ts (#71) -
 * die andere der drei Stellen mit einer Fensterreferenz. Eine gemeinsame Fassung daraus
 * zu machen hiesse, eine fremde Datei zu aendern (Regel E); gemeldet am Dateiende.
 *
 * DIE PRUEFUNG AUF `isDestroyed()` IST TRAGEND, nicht kosmetisch: Nach dem Schliessen
 * des Fensters wirft bereits der Zugriff auf `webContents`. Dieser Hoerer laeuft
 * innerhalb von `sende()` in #178, das seinerseits aus dem laufenden Render heraus
 * gerufen wird - eine Ausnahme von hier liefe in den Sende-Pfad des `render-service`
 * zurueck. #178 faengt sie zwar ab (`rufeGeschuetzt`), aber sich darauf zu verlassen
 * hiesse, den Schutz der einen Datei zur Vorbedingung der anderen zu machen.
 *
 * VERWORFEN WIRD STILL und ohne Merker: Gepuffert wird ausdruecklich nichts -
 * "Ereignisse vor dem Aufbau des Fensters verfallen still - es wird NICHT gepuffert
 * (bindend)." (TK 9.1.1 Punkt 10). Nachgeliefert wird also auch nichts.
 *
 * Das `try/catch` daneben ist die zweite Haelfte der Zusage "der Versand darf NIE
 * werfen": Zwischen Pruefung und Senden liegt kein `await`, aber `webContents` kann auch
 * aus anderem Grund weg sein (abgestuerzter Renderer-Prozess). Geschluckt wird der Fall
 * nicht - ohne die Zeile waere ein dauerhaft unerreichbares Fenster von "es gibt nichts
 * Neues" nicht zu unterscheiden.
 */
function sende(fenster: BrowserWindow, kanal: string, nutzlast: unknown): void {
  if (fenster.isDestroyed()) {
    return
  }
  try {
    fenster.webContents.send(kanal, nutzlast)
  } catch (ursache) {
    console.error(
      `[ipc-gateway] export-verdrahtung: Senden auf "${kanal}" fehlgeschlagen:`,
      ursache,
    )
  }
}

export function verdrahteExportUndFortschrittIPC(fenster: BrowserWindow): void {
  // Beide Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung. Ein Tippfehler waere
  // sonst kein Uebersetzungsfehler, sondern ein Aufruf, der zur Laufzeit ins Leere geht.

  // ------------------------------------------------------------------------------
  // 1. Der Aufrufkanal.
  // ------------------------------------------------------------------------------
  //
  // KEINE eigene Pruef-Funktion, sondern `ohneNutzlast` (#332): Die Operation nimmt kein
  // Argument, es gibt also nichts zu pruefen, und eine trotzdem uebergebene Nutzlast wird
  // IGNORIERT statt abgelehnt (Pruef-Tabelle des Issues). Genauso haelt es #71 fuer
  // `queue:holeStand`, den anderen argumentlosen Kanal des Systems. Ein eigener Pruefer
  // waere hier die sechste Kopie derselben vier Zeilen - genau das, was #332 aufgeloest hat.
  //
  // KEINE Umschreibung des Ergebnisses und keine Huelle von Hand: `registriereHandler`
  // reicht das `Ergebnis` von `wähleExportZiel` UNVERAENDERT zurueck (nachgelesen in #23,
  // Schritt 3). Der Abbruch des Nutzers (`pfad: null`) ist dabei ok:true und darf hier
  // nicht in einen Fehler umgedeutet werden - er ist der haeufigste Ausgang ueberhaupt.
  //
  // `() => wähleExportZiel()` statt `wähleExportZiel` direkt: Der Wrapper reicht seinem
  // dritten Rueckruf die validierte Nutzlast als erstes Argument herein. Uebergaebe man
  // die Funktion unverpackt, bekaeme sie `undefined` als Argument - heute wirkungslos,
  // weil sie keins nimmt, aber es waere die stille Zusage, dass das so bleibt.
  registriereHandler(KANAELE.export.wähleExportZiel, ohneNutzlast, () => wähleExportZiel())

  // ------------------------------------------------------------------------------
  // 2. Das Ereignis.
  // ------------------------------------------------------------------------------
  //
  // GENAU EINE Anmeldung. Zwei hiessen zwei Weitergaben derselben Meldung, und der
  // Renderer bekaeme jeden Fortschritt doppelt - bei ungleicher Reihenfolge zeigte er
  // einen veralteten Stand.
  //
  // DAS OBJEKT REIST NACKT UND UNVERAENDERT: kein `ok`, kein `wert`, kein Statusfeld,
  // kein "fertig"-Flag (TK 9.1.1 Punkt 5 - "Ereignisse sind Einbahnstrassen und tragen
  // keinen Endzustand"). Und kein Umbenennen, kein Weglassen von
  // `phase`/`elementIndex`/`elementId`, kein Begrenzen von `prozent`, keine `auftragId`
  // dazu. Waere es verpackt, laese der Abonnent (#151) `nutzlast.prozent` und faende
  // `undefined` - der Balken bewegte sich nie, ohne dass irgendetwas eine Fehlermeldung
  // erzeugte.
  //
  // KEINE ZWEITE DROSSELUNG: Sie ist Vertrag des Senders ("*dass* gedrosselt wird, ist
  // verbindlich", TK 9.2.7) und in #178 mit 250 ms gebaut. Eine zweite hier verschluckte
  // Ereignisse, die der Sender bewusst geschickt hat, und niemand koennte danach sagen,
  // welche Rate tatsaechlich beim Renderer ankommt.
  //
  // UND KEIN NACHFILTERN AUF DEN ENDZUSTAND: "Nach dem terminalen `RenderResult` duerfen
  // **keine** weiteren `RenderProgress`-Ereignisse dieser `renderId` mehr folgen."
  // (TK 9.2.7) - das sichert der Sender zu (`schliesse()` in #178). Diese Datei kennt den
  // terminalen Zustand gar nicht und koennte ihn nur raten.
  const abmelden = aufRenderFortschritt((fortschritt: RenderProgress) => {
    sende(fenster, KANAELE.render.fortschritt, fortschritt)
  })

  // ABRAEUMEN, wenn das Fenster tatsaechlich weg ist - dieselbe Zeile und derselbe Grund
  // wie in #71: #178 haelt seine Hoerer in einer Menge, die den ganzen Prozess
  // ueberdauert. Ohne das Abmelden haenge dort dauerhaft eine Fensterreferenz an einem
  // lebenden Hoerer, und jede weitere Meldung liefe in `sende` und dort in die
  // `isDestroyed`-Pruefung - ein stiller Leerlauf, der das Fenster am Freigegebenwerden
  // hindert.
  //
  // `once('closed')` und NICHT `'close'`: `close` ist abbrechbar (ein Hoerer kann
  // `preventDefault` rufen), und eine dort ausgehaengte Verdrahtung liesse sich durch
  // nichts wieder anmelden - die Fortschrittsanzeige waere ab dem ersten abgebrochenen
  // Schliessversuch tot. `closed` faellt an, wenn das Fenster tatsaechlich weg ist.
  //
  // Der Bootstrap (#3) erzeugt genau EIN Fenster und legt danach keines mehr an (kein
  // `activate`-Handler, nachgelesen in src/main/index.ts am 14.08.2026) - nach `closed`
  // gibt es also nichts mehr, wohin gesendet werden koennte.
  //
  // Das ist KEIN Warten auf den Aufbau des Fensters: Angemeldet wird sofort und
  // unbedingt, aufgeschoben ist allein das ABMELDEN. Gepuffert wird nichts.
  fenster.once('closed', () => {
    abmelden()
  })
}
// 1. registriert den Aufrufkanal `export:wähleExportZiel` über den Wrapper aus #23
//    (mit eigener Validierungsfunktion; die Operation hat keine Nutzlast)
// 2. meldet sich über aufRenderFortschritt (#178) als Hörer an und gibt jede Meldung auf dem
//    EREIGNIS-Kanal `render:fortschritt` an den Renderer weiter – OHNE Hülle, OHNE Endzustand
// Kein Zustand, keine Fachlogik, keine Umformung der Nutzlast.

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUFRUFER. src/main/index.ts fuehrt diese Verdrahtung nur als Kommentar
//    ("2. LUECKE: verdrahteExportUndFortschrittIPC(fenster) - #191", Schritt 7, direkt
//    nach `verdrahteQueueIPC(fenster)`). Das ist die richtige Stelle - nach
//    `erstelleHauptfenster()`, weil diese Datei als eine von dreien ein Fenster braucht -,
//    aber die Zeile fehlt noch. Dieses Issue darf #3 ausdruecklich NICHT anfassen (Regel E);
//    der Auftraggeber zieht es nach.
//    ZWEI ABWEICHUNGEN IN JENEM KOMMENTAR, beide harmlos, beide nur Text:
//      (a) Er schreibt den Kanal als `export:waehleExportZiel` (ASCII). Verbindlich und
//          hier gebaut ist `export:wähleExportZiel` mit Umlaut - der Kanalname steht im
//          Signaturblock von #191 und folgt der Operation aus TK 9.6.1.
//      (b) Er nummeriert die Verdrahtung des Speicherstatus als #238; #191 nennt sie
//          M7-45. Dasselbe Issue, zwei Schreibweisen.
//
// 2. `RenderProgress` STEHT ZWEIMAL. #157 sollte den Typ aus
//    src/shared/contracts/render-result.ts herausziehen und dort nur die Zeile
//    `export type { RenderProgress } from './render-progress'` hinterlassen. Die neue Datei
//    render-progress.ts existiert mit genau den sechs Feldern - render-result.ts DEFINIERT
//    den Typ aber weiterhin selbst (Stand 14.08.2026), der Umzug ist also halb erledigt.
//    Folge heute: nichts, weil beide Fassungen zeichengleich sind und TypeScript
//    strukturell prueft - #178 importiert aus `render-result`, diese Datei aus
//    `render-progress`, und die Anmeldung uebersetzt trotzdem. Folge morgen: Wer eines der
//    sechs Felder aendert, aendert es in einer von zwei Dateien, und der Bruch faellt
//    NICHT beim Uebersetzen auf. Gehoert zu #157, ausserhalb des Dateibereichs dieses
//    Issues.
//
// 3. `sende` STEHT ZWEIMAL. Diese Funktion ist Zeile fuer Zeile dieselbe wie in
//    src/main/auftrags-manager/ipc-verdrahtung.ts (#71); mit M7-45
//    (speicherstatus-verdrahtung.ts) kaeme eine dritte Kopie dazu. Genau dieselbe
//    Fehlerklasse, die #332 fuer die Nutzlast-Pruefer aufgeloest hat: Solange die Kopien
//    gleich sind, ist es kein Fehler - es wird einer, sobald jemand eine davon haertet
//    (etwa um einen zerstoerten `webContents` mitzupruefen) und die uebrigen lax bleiben.
//    Der Ort waere dieses Modul. Eine fremde Verdrahtungsdatei zu aendern ist Regel E,
//    deshalb hier nur gemeldet.
