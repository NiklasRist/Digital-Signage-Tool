// GENERIERT aus dem Signaturblock von Issue #93.
// [media-service] Dialog-Kanal verdrahten
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
// GERUEST-PRUEFSUMME: 52b29c98bc836207

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'                // #25
import { registriereHandler } from '../ipc-gateway/registriere-handler' // #23
import { öffneMedienDialog } from './dialog'                            // #81

// Fremde Aufrufe - vollstaendige Signaturen, beide gegen die GEBAUTEN Dateien geprueft,
// nicht gegen das Zitat im Issue:
//   #23: registriereHandler<T, F extends string>(
//          kanal: string,
//          validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                          | { ok: true; wert: unknown },
//          ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//        ): void
//        // validiert zuerst; bei ok:false laeuft `ausfuehren` GAR NICHT an. Faengt jede
//        // Ausnahme und uebersetzt sie in 'unbekannter_fehler'. Reicht das Ergebnis von
//        // `ausfuehren` unveraendert zurueck.
//   #81: öffneMedienDialog(): Promise<Ergebnis<{ pfade: string[] }>>
//        // Auswahl -> pfade = absolute Quellpfade; Abbruch -> ok: true mit pfade = [].

/**
 * Der Validierer des nutzlastfreien Kanals: Es gibt nichts zu pruefen.
 *
 * ER ENTFAELLT TROTZDEM NICHT - der Wrapper (#23) verlangt ihn, und er ist die Stelle,
 * an der festgehalten ist, dass hier nichts erwartet wird. Ein `null` oder ein Cast
 * stuende an derselben Stelle und saehe aus wie ein Versehen.
 *
 * IGNORIEREN, NICHT ABLEHNEN (verbindlich im Issue): Eine trotzdem uebergebene Nutzlast
 * ist kein Fehler. Genau so ist der andere nutzlastfreie Kanal festgelegt
 * (`queue:holeStand`, #71) - zwei verschiedene Regeln fuer zwei nutzlastfreie Kanaele
 * waeren eine Falle fuer jeden, der den Renderer-Aufruf schreibt. Dazu schickt die
 * uebliche Aufrufform `invoke(kanal)` ohnehin `undefined` mit; ein strenges Ablehnen
 * machte den Kanal auf diesem Weg unbenutzbar, ohne dass irgendetwas sicherer wuerde -
 * es gibt keine Nutzlast, die Schaden anrichten koennte.
 *
 * OHNE PARAMETER, nicht mit einem ungenutzten: Was nicht angenommen wird, kann auch
 * nicht versehentlich weitergereicht werden. Zur Laufzeit nimmt die Funktion jedes
 * Argument entgegen und ignoriert es; JavaScript verlangt keine Deklaration dafuer.
 */
function ohneNutzlast(): Ergebnis<void, 'ungueltige_eingabe'> {
  return { ok: true, wert: undefined }
}

export function verdrahteMedienIPC(): void {
  // Der Name kommt aus der Registry (#25); in dieser Datei steht kein Kanalname als
  // Zeichenkette - auch nicht in einer Meldung. Ein Tippfehler waere sonst erst zur
  // Laufzeit sichtbar, und zwar als Aufruf, der ins Leere laeuft.
  //
  // GENAU EIN AUFRUF. Kanaele fuer `importMedium` und `löscheMedium` entstehen hier
  // NICHT: Sie laufen ueber `reiheEin` (TK 9.3.4), und ein direkter Kanal waere ein
  // zweiter Weg an der seriellen Ordnung vorbei - dem einzigen Sperr-Mechanismus des
  // Systems. Ein Import, der daran vorbei sofort liefe, koennte parallel zu einem
  // Render dieselbe Datei anfassen.
  //
  // KEIN Schutz gegen einen zweiten Aufruf dieser Funktion (kein "schon
  // registriert"-Merker): #3 ruft genau einmal, und der Wrapper wirft bei einer
  // doppelten Anmeldung von sich aus (#23, nachgelesen) - dieser Wurf faellt beim Start
  // an und soll auffallen. Ein Merker verdeckte einen echten Programmierfehler.
  //
  // Die Electron-Bausteine (Fensterklasse, IPC-Register, Datei-Dialog) werden hier
  // NICHT angefasst; ihre Namen stehen deshalb nirgends in dieser Datei, auch nicht im
  // Kommentar - so bleibt die Grep-Probe des Issues aussagekraeftig.
  registriereHandler<{ pfade: string[] }, GenerischerFehlercode>(
    KANAELE.media.öffneMedienDialog,
    ohneNutzlast,
    // DIE PFEILFUNKTION IST TRAGEND, NICHT KOSMETIK: `öffneMedienDialog` direkt als
    // dritten Parameter zu uebergeben wuerde uebersetzen (ein Parameter weniger ist
    // erlaubt), rief die Funktion aber MIT der validierten Nutzlast auf. Heute folgenlos,
    // weil sie kein Argument liest - aber es waere eine Weitergabe von Renderer-Daten an
    // eine Funktion, die nach Vertrag keine bekommt, und der naechste Parameter, der dort
    // hinzukaeme, waere ab dem ersten Tag fremdbelegt.
    //
    // Das Ergebnis reist UNVERAENDERT zurueck: kein Auspacken von `wert`, kein `throw`,
    // kein Umschreiben von Codes - und vor allem KEIN Umdeuten des leeren `pfade`-Arrays
    // in einen Fehler. Der Abbruch ist der haeufigste Ausgang des Dialogs und "kein
    // Fehler" (TK 9.4.3); wer ihn hier zu einem machte, liesse die Oberflaeche fuer eine
    // bewusste Nutzerentscheidung eine Fehlermeldung zeigen.
    () => öffneMedienDialog(),
  )
}
// registriert GENAU EINEN Kanal – media:öffneMedienDialog – über den Wrapper aus #23,
// mit einer eigenen Validierungsfunktion. Kein Ereignis, kein zweiter Kanal.

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUFRUFER. src/main/index.ts fuehrt `verdrahteMedienIPC()` als Schritt 5,
//    Position 5 - als LUECKE im Kommentar, nicht als Zeile. Diese Datei traegt den
//    Aufruf ausdruecklich NICHT selbst ein (kein Selbstaufruf am Modulende, kein Anhang
//    an ein Start-Ereignis, kein Eintrag in einer fremden Datei); das waere eine
//    Aenderung ausserhalb des erlaubten Dateibereichs. Zu verdrahten ist er in der
//    Bootstrap-Kette (#3 / #270 ff.).
//
// 2. DIE EINORDNUNG IM ISSUE-TEXT IST TEILWEISE UEBERHOLT. #93 nennt die Reihenfolge
//    `verdrahteQueueIPC()`, `verdrahteProjectStoreIPC()`, `verdrahteConfigStoreIPC()`,
//    `verdrahteMedienIPC()`, `registriereMedienHandler()` - alle vor dem Fenster.
//    Gebaut ist etwas anderes: `verdrahteQueueIPC` nimmt das Fenster als Parameter und
//    steht in Schritt 7 (erste der Anmeldungen MIT Fenster). Fuer DIESE Datei aendert das
//    nichts an der Sache: Sie braucht kein Fenster und gehoert damit in die Gruppe OHNE
//    Fenster (Schritt 5) - genau dort steht sie in src/main/index.ts. Ueberholt ist
//    allein die Behauptung, `verdrahteQueueIPC` liefe davor.
//
// 3. DIE GREP-PROBE "kein `dialog`" IST MIT DEM IMPORT UNVEREINBAR: Die Operation aus
//    #81 liegt in `src/main/media-service/dialog.ts`, der Modulpfad traegt das Wort also
//    zwangslaeufig. Gemeint ist ersichtlich der Electron-Baustein gleichen Namens - der
//    wird hier nicht importiert und nicht benutzt.
