// GENERIERT aus dem Signaturblock von Issue #81.
// [media-service] öffneMedienDialog implementieren
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
// GERUEST-PRUEFSUMME: fbea1312c7b4987a

import { dialog } from 'electron'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// DER EINSTIEGSPUNKT JEDES IMPORTS (FA-01) - und die einzige Stelle, an der ein
// absoluter Fremdpfad ins System kommt. Zwei Dinge entscheiden sich hier, und beide
// sind teuer, wenn sie falsch fallen.
//
// ERSTENS: DER ABBRUCH IST KEIN FEHLER. "| Nutzer bricht ab | `ok: true` mit
// `pfade = []` - Abbruch ist **kein** Fehler |" (TK 9.4.3). Er ist der haeufigste
// Ausgang ueberhaupt. Wer ihn als Fehler meldet, laesst die Oberflaeche bei jedem
// versehentlich geoeffneten Dialog eine Fehlermeldung zeigen - und schlimmer: Ein
// Aufrufer, der Fehler protokolliert oder einen Wiederholungsversuch anbietet, taete
// das dann fuer einen Vorgang, den der Nutzer bewusst abgebrochen hat. Deshalb gibt es
// hier keinen Code `abgebrochen`, kein `nicht_gefunden` und kein `ungueltige_eingabe`
// fuer diesen Fall.
//
// ZWEITENS: DER FILTER KOMMT AUS DERSELBEN KONSTANTEN WIE DIE IMPORT-PRUEFUNG. "Der
// Formatfilter des Dialogs (9.4.3) und die Pruefung beim Import lesen **denselben**
// konstanten Wert aus `contracts/types` - sie duerfen nie auseinanderlaufen."
// (TK 9.4.2), "**Format-Whitelist** kommt aus **einem** konstanten Wert in
// `contracts/types` (Dialog-Filter **und** Import-Pruefung)." (TK 9.4.8, Punkt 7)
// DESHALB STEHT IN DIESER DATEI KEIN EINZIGES ENDUNGS-LITERAL - nicht im Code, nicht
// im Kommentar, nicht in einem Meldungstext. Liefe der Filter der Pruefung (#80)
// davon, fuehrte die Anwendung den Nutzer in eine Sackgasse: Er duerfte die Datei
// waehlen und bekaeme danach `format_nicht_unterstuetzt`. Umgekehrt versteckte ein zu
// enger Filter Dateien, die importierbar waeren.
//
// DER FILTER IST EINE BEQUEMLICHKEIT, KEINE GARANTIE. Auf beiden Betriebssystemen kann
// der Nutzer ihn umgehen (Dateinamen tippen, "Alle Dateien" waehlen, per
// Automatisierung aufrufen). Die verbindliche Pruefung ist `pruefeFormat` beim Import
// (#80). Diese Datei prueft deshalb NICHT selbst und filtert die Rueckgabe NICHT nach -
// auch nicht "zur Sicherheit": Zwei Prueforte laufen mit der ersten Formataenderung
// auseinander, und dann weiss niemand mehr, welcher gilt.
//
// INSTANT-OPERATION, KEIN AUFTRAG: "**Nicht** ueber die Queue laufen
// **Instant-Operationen** (Millisekunden, reine D1-Schreibvorgaenge): Aktion
// anlegen/bearbeiten, Liste umsortieren, Trim setzen, **Aktion** loeschen, Datei-Dialog
// oeffnen." (TK 9.3.2) Sie traegt deshalb die Ergebnis-Huelle: "**Nur Instant-Aufrufe
// tragen die Huelle.**" (TK 9.1.1) Kein `reiheEin`, kein `Auftrag`, kein Eintrag in
// Q1/Q2/Q3, kein Erscheinen im queue-panel.
//
// UND KEINE SCHLEIFE UEBER DIE PFADE: Die Mehrfachauswahl faechert die OBERFLAECHE auf
// - ein `reiheEin('import', ...)` je Pfad, damit die Warteschlange sie einzeln und
// sichtbar abarbeitet und jeder Fehlschlag einzeln wiederholbar ist (FA-17). Ein
// Sammel-Auftrag waere unteilbar. Hier wird das Array nur unveraendert abgeliefert.
//
// KEIN ELTERNFENSTER (entschieden im Issue): Die Signatur nimmt kein `BrowserWindow`
// entgegen, und ein Griff nach `BrowserWindow.getFocusedWindow()` aus diesem Modul
// heraus waere eine zusaetzliche, unnoetige Abhaengigkeit vom Renderer-Lebenszyklus -
// der `media-service` soll die Fensterverwaltung nicht kennen. Praktische Folge: Der
// Dialog haengt nicht als Sheet am Fenster. Bewusst in Kauf genommener kosmetischer
// Nachteil, kein Versehen.
//
// KEIN `defaultPath` UND KEIN MERKEN DES ZULETZT BENUTZTEN ORDNERS (entschieden im
// Issue): Der `config-store` (D3) haelt das zuletzt benutzte EXPORT-Ziel, kein
// Medien-Verzeichnis; ein neues Feld dort waere eine fremde Datei und eine Erweiterung
// des Konfigurationsvertrags. Das Betriebssystem merkt sich den Ordner ohnehin selbst.
//
// KEIN IPC-KANAL, KEIN HANDLER-REGISTER, KEIN EINTRAG IN `kanaele.ts`: Kanalname,
// Validierung und `registriereHandler` liegen gebuendelt in #93
// (`src/main/media-service/ipc-verdrahtung.ts`, `verdrahteMedienIPC`). Sonst
// registrierte spaeter ein zweites Issue denselben Kanal ein zweites Mal. Der Name der
// Electron-Klasse, die das taete, steht deshalb nirgends in dieser Datei - auch nicht
// im Kommentar, damit die Grep-Probe des Issues aussagekraeftig bleibt.
//
// KEIN DATEIZUGRIFF: kein `fs`, keine Existenzpruefung, keine Groessenermittlung, kein
// Vorab-Lesen. Der Dialog liefert Pfade, sonst nichts (TK 9.4.1).

export async function öffneMedienDialog(): Promise<Ergebnis<{ pfade: string[] }>> {
  try {
    // Die Optionen stehen ABSICHTLICH als Literal im Aufruf und nicht in einer eigenen
    // Konstanten: So typisiert TypeScript `properties` kontextuell gegen Electrons
    // `OpenDialogOptions`. Aus einer separaten Konstanten wuerde `string[]`, und ein
    // Tippfehler in einem der Eigenschaftsnamen fiele erst am laufenden Dialog auf.
    const antwort = await dialog.showOpenDialog({
      // 'openFile' + 'multiSelections' - beides Pflicht. Die Mehrfachauswahl ist keine
      // Bequemlichkeit, sondern der Vertrag: "| Nutzer waehlt Dateien | `pfade` = Array
      // absoluter Quellpfade |" (TK 9.4.3). Ohne sie koennte das Array nie mehr als
      // einen Eintrag tragen.
      //
      // KEIN 'openDirectory' (auf Windows und Linux kann ein Dialog nicht beides sein -
      // gesetzt wuerde daraus ein reiner Ordner-Waehler, und der Import bekaeme
      // Verzeichnisse statt Dateien) und KEIN 'promptToCreate' (das bietet an, eine
      // nicht vorhandene Datei anzulegen; importiert wuerde eine leere Huelle).
      properties: ['openFile', 'multiSelections'],

      // Die Reihenfolge ist verbindlich: Der ERSTE Eintrag ist im Dialog vorausgewaehlt,
      // und das muss der kombinierte sein. Der Nutzer stellt eine Werbeschleife aus
      // Videos UND Bildern zusammen; muesste er erst den Typ waehlen, koennte er nicht
      // beides in einem Zug auswaehlen.
      //
      // Die Namen sind reine Anzeigetexte. Die Endungen kommen aus FORMAT_WHITELIST
      // (#13) und stehen OHNE fuehrenden Punkt - so erwartet es Electron; mit Punkt
      // findet der Dialog auf Windows lautlos nichts mehr.
      filters: [
        {
          name: 'Medien',
          extensions: [...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild],
        },
        { name: 'Videos', extensions: [...FORMAT_WHITELIST.video] },
        { name: 'Bilder', extensions: [...FORMAT_WHITELIST.bild] },
      ],

      // KEIN `title`: Der verbindliche Ablauf des Issues nennt genau `properties` und
      // `filters`. Ohne eigenen Titel zeigt das Betriebssystem seinen eigenen,
      // mitlokalisierten - das ist keine Luecke, sondern die kleinere Festlegung.
    })

    // Abbruch und leere Auswahl haben denselben Ausgang - bewusst KEIN Sonderfall.
    // `canceled: false` mit leerem `filePaths` ist auf keiner Plattform zugesichert,
    // aber wenn es auftritt, ist es dasselbe Ereignis aus Nutzersicht: Es wurde nichts
    // gewaehlt. Zwei Zweige daraus zu machen hiesse, dem Aufrufer einen Unterschied zu
    // erzaehlen, den es fuer ihn nicht gibt.
    if (antwort.canceled || antwort.filePaths.length === 0) {
      return { ok: true, wert: { pfade: [] } }
    }

    // UNVERAENDERT durchgereicht: nicht sortiert, nicht dedupliziert, nicht
    // normalisiert, nicht auf Existenz geprueft. Jede dieser Bequemlichkeiten waere
    // eine stille Umdeutung der Nutzerauswahl - und die Reihenfolge ist die, in der die
    // Oberflaeche anschliessend die Import-Auftraege einreiht.
    return { ok: true, wert: { pfade: antwort.filePaths } }
  } catch (ursache) {
    // "Niemals `throw` ueber die Prozessgrenze" (TK 9.1.1): Wirft der Aufruf wider
    // Erwarten - etwa weil beim Start noch kein Fenster bereit ist oder das
    // Betriebssystem den Dialog verweigert -, wird die Ausnahme HIER gefangen. Ohne
    // diesen Zweig bliebe beim Renderer nur Text uebrig: "Wirft der Main
    // `new Error(...)` mit einem eigenen Feld `code`, kommt beim Renderer **nicht**
    // dieser Fehler an".
    //
    // Der Zweig deckt zugleich den Fall ab, dass die Antwort gar nicht die zugesagte
    // Form hat (fehlendes `filePaths`) - auch dann verlaesst die Funktion die Huelle
    // nicht.
    vermerke(ursache)
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        // `text()` liefert die MELDUNG der Ausnahme, nie ihren Stacktrace: "kein
        // Stacktrace ... in die Oberflaeche" (TK 9.1.1 Punkt 8). Die Meldung dient der
        // Anzeige, nicht der Verzweigung - dafuer ist der Code da.
        meldung: `Der Datei-Dialog konnte nicht geoeffnet werden: ${text(ursache)}`,
      },
    }
  }
}

/**
 * Der interne Vermerk zur Ausnahme.
 *
 * Das ist KEIN eigener Logger und KEINE eigene Protokolldatei: Es ist derselbe
 * vorlaeufige Platzhalter, den `registriere-handler` (#23), der `dispatcher` (#60) und
 * der `torwaechter` (#59) bereits benutzen. Ein projektweiter Mechanismus ist offen
 * (#23) und wird in diesem Issue nicht erfunden - wenn er kommt, ist dies die eine
 * Stelle, die zu aendern ist.
 *
 * Das ganze Fehlerobjekt geht hinein, Stacktrace eingeschlossen. Kein Widerspruch zu
 * TK 9.1.1 Punkt 8: Verboten ist der Stacktrace im RUECKGABEWERT, also auf dem Weg in
 * die Oberflaeche. Im Protokoll des Hauptprozesses ist er das Einzige, was einen
 * solchen Fehler ueberhaupt auffindbar macht - der Rueckgabewert traegt nur noch die
 * Meldung.
 */
function vermerke(ursache: unknown): void {
  console.error('[media-service] öffneMedienDialog: Der Datei-Dialog hat geworfen:', ursache)
}

/**
 * Die Ausnahme als Klartext - `message` bei einem `Error`, sonst die Zeichenkette.
 *
 * `String(ursache)` greift bewusst auch fuer geworfene Nicht-Fehler (eine Zeichenkette,
 * `undefined`, ein Objekt): Diese Funktion darf selbst unter keinen Umstaenden werfen,
 * sonst risse sie genau den Zweig auf, der die Prozessgrenze schuetzen soll.
 */
function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
