// [media-service] Dialog-Kanal verdrahten
//
// `Ergebnis` wird hier seit #332 nicht mehr als Typ gebraucht - der einzige Verwender
// war der umgezogene Pruefer. In den Signatur-Vermerken unten steht der Name weiter,
// dort aber als Text.
import type { GenerischerFehlercode, Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'                // #25
// Der Pruefer liegt seit #332 an EINEM Ort. Bis dahin stand er hier als Kopie - Wort
// fuer Wort auch in #71, #76 und #77. Der Import ueber die Modulgrenze ist kein neuer
// Grenzuebertritt: `registriereHandler` kommt aus derselben Richtung.
import { abgelehnt, istObjekt } from '../ipc-gateway/nutzlast-pruefer'  // #332
import { registriereHandler } from '../ipc-gateway/registriere-handler' // #23
import { öffneMedienDialog, type MedienDialogOptionen } from './dialog' // #81/#418

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
//   #418: öffneMedienDialog(optionen?: MedienDialogOptionen)
//        // NEU: optionaler Parameter ({ nurTyp?: 'video'|'bild'; einzel?: boolean }).
//        // Ohne Optionen byte-identisch zum #81-Verhalten (Mehrfachauswahl, beide Typen).
//        // Nachtrag an #81 (rueckwaertskompatibel) - der Bild-Weg ruft ohne Optionen.

/**
 * Prueft die OPTIONALE Nutzlast des Dialog-Kanals (#418).
 *
 * Bis #418 war der Kanal nutzlastfrei (`ohneNutzlast` verwarf jedes Argument). Mit dem
 * optionalen Parameter traegt er jetzt eine kleine, benannte Form. Fehlt sie, gilt der
 * alte Zustand (keine Optionen); eine FALSCHE Form wird abgelehnt - anders als bei den
 * nutzlastfreien Kanaelen, wo eine mitgeschickte Nutzlast folgenlos ist, hat sie hier
 * WIRKUNG (Filter/Auswahl) und darf nicht still verworfen werden.
 */
function pruefeDialogOptionen(
  nutzlast: unknown,
): Ergebnis<unknown, 'ungueltige_eingabe'> | { ok: true; wert: MedienDialogOptionen } {
  if (nutzlast === undefined || nutzlast === null) return { ok: true, wert: {} }
  if (!istObjekt(nutzlast)) {
    return abgelehnt('Der Medien-Dialog erwartet hoechstens { nurTyp, einzel }.')
  }
  const { nurTyp, einzel } = nutzlast
  if (nurTyp !== undefined && nurTyp !== 'video' && nurTyp !== 'bild') {
    return abgelehnt('nurTyp muss "video" oder "bild" sein.')
  }
  if (einzel !== undefined && typeof einzel !== 'boolean') {
    return abgelehnt('einzel muss ein Wahrheitswert sein.')
  }
  const wert: MedienDialogOptionen = {}
  if (nurTyp === 'video' || nurTyp === 'bild') wert.nurTyp = nurTyp
  if (typeof einzel === 'boolean') wert.einzel = einzel
  return { ok: true, wert }
}

// DER VALIDIERER TRAEGT JETZT EINE KLEINE FORM (#418). Bis dahin war dieser Kanal
// nutzlastfrei, und der Pruefer hielt fest, dass NICHTS erwartet wird (IGNORIEREN,
// NICHT ABLEHNEN - wie `queue:holeStand`, #71). Mit dem optionalen Parameter hat eine
// mitgeschickte Nutzlast WIRKUNG; sie wird deshalb geprueft und eine falsche Form
// ABGELEHNT (s. `pruefeDialogOptionen`). Fehlt sie ganz, gilt der alte Zustand.

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
    pruefeDialogOptionen,
    // DIE PFEILFUNKTION reicht die VALIDIERTE Nutzlast weiter. Durch `pruefeDialogOptionen`
    // ist die Form garantiert ({ nurTyp?, einzel? }); der Cast stellt dem Uebersetzer nur
    // den geprueften Wert als `MedienDialogOptionen` bereit.
    //
    // Das Ergebnis reist UNVERAENDERT zurueck: kein Auspacken von `wert`, kein `throw`,
    // kein Umschreiben von Codes - und vor allem KEIN Umdeuten des leeren `pfade`-Arrays
    // in einen Fehler. Der Abbruch ist der haeufigste Ausgang des Dialogs und "kein
    // Fehler" (TK 9.4.3); wer ihn hier zu einem machte, liesse die Oberflaeche fuer eine
    // bewusste Nutzerentscheidung eine Fehlermeldung zeigen.
    (optionen) => öffneMedienDialog(optionen as MedienDialogOptionen),
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
