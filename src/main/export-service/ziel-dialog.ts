// GENERIERT aus dem Signaturblock von Issue #183.
// [export-service] Exportziel über einen Ordner-Dialog wählen
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
// GERUEST-PRUEFSUMME: 5a14f4147f6bec3a
//
// ERLEDIGT: Die Abschaltzeile fuer no-unused-vars ist entfernt, der Rumpf ist
// gefuellt - alle Importe werden benutzt.
//
// WAS DIESE DATEI IST: die einzige Stelle, an der der Zielordner eines Exports
// ueberhaupt entsteht. Der Renderer kennt keine absoluten Pfade ("Der Renderer sieht
// **nur relative** Referenzen (`dateiname`), **nie** absolute Pfade.", TK 9.5.7); er
// kann den Laufwerksbuchstaben des Sticks also weder tippen noch erraten. Ohne diese
// Funktion bliebe `ExportRequest.zielPfad` unfuellbar und FA-09 unerfuellbar.
//
// DER ABBRUCH IST KEIN FEHLER - die teuerste Fehlentscheidung dieser Datei. Er ist der
// haeufigste Ausgang ueberhaupt. Wer ihn als Fehler meldet, laesst die Oberflaeche bei
// jedem versehentlich geoeffneten Dialog eine Fehlermeldung zeigen - und schlimmer: Ein
// Aufrufer, der Fehler protokolliert oder einen Wiederholversuch anbietet, taete das
// fuer einen Vorgang, den der Nutzer bewusst abgebrochen hat. Genauso haelt es der
// Muster-Dialog `öffneMedienDialog` (#81, media-service/dialog.ts): dort `ok: true` mit
// leerem Pfad-Array. Deshalb hier kein Code `abgebrochen`, kein `nicht_gefunden`, kein
// `ungueltige_eingabe` und kein `throw` fuer diesen Fall.
//
// UND `null`, NICHT `''`: Ein leerer String ist ein falsy Pfad, der unbemerkt an
// `path.join` oder `setzeExportZiel` weitergereicht werden kann - `path.join('', 'x')`
// ergibt einen RELATIVEN Pfad und zeigt damit auf das Arbeitsverzeichnis des Prozesses.
// Der Export landete im Programmordner statt auf dem Stick, ohne dass irgendetwas
// fehlschlaegt. `null` ist der einzige Wert, den ein Aufrufer nicht versehentlich als
// Pfad benutzt.
//
// INSTANT-OPERATION, KEIN AUFTRAG: "**Nicht** über die Queue laufen
// **Instant-Operationen** (Millisekunden, reine D1-Schreibvorgänge): Aktion
// anlegen/bearbeiten, Liste umsortieren, Trim setzen, **Aktion** löschen, Datei-Dialog
// öffnen." (TK 9.3.2) Sie traegt deshalb die Huelle: "**Nur Instant-Aufrufe tragen die
// Hülle.**" (TK 9.1.1) Kein `reiheEin`, kein Auftrag, kein Eintrag in Q1/Q2/Q3, kein
// Erscheinen im queue-panel. Der EXPORT selbst ist ein Auftrag und wird hier NICHT
// angestossen; das Einreihen macht der `composer` (#134).
//
// HIER WIRD DAS ZIEL NICHT GEMERKT: kein `setzeExportZiel` (#28). "Das gewählte Ziel
// merkt sich der `config-store` (`setzeExportZiel`, 9.5.6) und belegt den Dialog beim
// nächsten Mal vor." (TK 9.6.5) - diese Datei LIEST die Vorbelegung; geschrieben wird
// sie nach einem ERFOLGREICHEN Export (#188). Wer hier schriebe, merkte sich einen
// Ordner, auf den nie geschrieben wurde: Nach einem abgebrochenen Versuch auf dem
// falschen Laufwerk waere der Dialog beim naechsten Mal falsch vorbelegt.
//
// HIER WIRD NICHTS GEPRUEFT: keine Existenz, keine Schreibrechte, keine
// Dateisystem-Erkennung, keine Platzpruefung, kein `fs`. Das gehoert vollstaendig zu
// #184 (`ziel-pruefung.ts`) und laeuft dort mit der TATSAECHLICHEN Dateigroesse
// unmittelbar vor dem Kopieren. Eine Pruefung hier waere zum Zeitpunkt des Exports
// laengst veraltet - der Stick kann dazwischen gezogen werden - und erzeugte eine
// zweite, abweichende Wahrheit ueber dasselbe Ziel.
//
// KEIN ELTERNFENSTER (entschieden im Issue): Die Signatur nimmt kein `BrowserWindow`
// entgegen, und ein Griff nach `BrowserWindow.getFocusedWindow()` aus diesem Modul
// heraus waere eine zusaetzliche, unnoetige Abhaengigkeit vom Renderer-Lebenszyklus -
// der `export-service` soll die Fensterverwaltung nicht kennen. Praktische Folge: Der
// Dialog haengt nicht als Sheet am Fenster. Bewusst in Kauf genommener kosmetischer
// Nachteil, kein Versehen - genau wie bei #81.
//
// KEIN IPC-KANAL, KEIN HANDLER-REGISTER, KEIN EINTRAG IN `kanaele.ts`: Der Kanal
// `export:wähleExportZiel` wird in #191 (`ipc-gateway/export-verdrahtung.ts`)
// angemeldet. Sonst registrierte ihn spaeter ein zweites Issue ein zweites Mal.

import { dialog } from 'electron'

import { leseKonfig } from '../config-store/lese-konfig'

import type { Ergebnis } from '../../shared/contracts/ergebnis'

export async function wähleExportZiel(): Promise<Ergebnis<{ pfad: string | null }>> {
  // Die Vorbelegung wird VOR dem `try` geholt und kann selbst nicht scheitern (s.
  // `ermittleVorbelegung`): Ein Problem mit `config.json` darf den Dialog nicht
  // verhindern, sondern nur seine Bequemlichkeit kosten.
  const vorbelegung = await ermittleVorbelegung()

  try {
    // Die Optionen stehen ABSICHTLICH als Literal im Aufruf und nicht in einer eigenen
    // Konstanten: So typisiert TypeScript `properties` kontextuell gegen Electrons
    // `OpenDialogOptions`. Aus einer separaten Konstanten wuerde `string[]`, und ein
    // Tippfehler in einem der Eigenschaftsnamen fiele erst am laufenden Dialog auf.
    const antwort = await dialog.showOpenDialog({
      title: 'Zielordner für den Export wählen',

      // Der bedingte Spread statt `defaultPath: vorbelegung ?? undefined`: Fehlt die
      // Vorbelegung, darf der Schluessel GAR NICHT gesetzt sein. Electron behandelt
      // beides heute gleich, aber "kein Startordner raten" ist eine Zusage des Issues -
      // und ein gesetzter Schluessel mit undefiniertem Wert ist der Anfang jeder
      // spaeteren Verwechslung ("wir setzen ihn doch").
      ...(vorbelegung === null ? {} : { defaultPath: vorbelegung }),

      // GENAU diese zwei. `openDirectory` ist Pflicht - gewaehlt wird ein ORDNER, nicht
      // eine Datei; ohne die Angabe liefert der Dialog Dateipfade, und der Export
      // schriebe in einen "Ordner", der eine Datei ist. `createDirectory` erlaubt auf
      // macOS das Anlegen eines Unterordners im Dialog; auf Windows ist die Angabe
      // wirkungslos und schadet nicht.
      //
      // KEIN `multiSelections` (es gibt genau EIN Ziel), KEIN `openFile` (siehe oben),
      // KEIN `promptToCreate` (das gehoert zu Datei-Dialogen).
      properties: ['openDirectory', 'createDirectory'],

      // KEINE `filters`: Filter gelten fuer Dateien, nicht fuer Ordner. Sie waeren im
      // Ordner-Dialog wirkungslos und suggerierten eine Auswahl, die es nicht gibt.
    })

    // Abbruch und leere Auswahl haben denselben Ausgang - bewusst KEIN Sonderfall.
    // `canceled: false` mit leerem `filePaths` ist auf keiner Plattform zugesichert,
    // aber wenn es auftritt, ist es aus Nutzersicht dasselbe Ereignis: Es wurde nichts
    // gewaehlt. Zwei Zweige daraus zu machen hiesse, dem Aufrufer einen Unterschied zu
    // erzaehlen, den es fuer ihn nicht gibt.
    if (antwort.canceled) {
      return { ok: true, wert: { pfad: null } }
    }

    // Die Zerlegung statt `filePaths[0]`: Mit `noUncheckedIndexedAccess` (#1) hat der
    // Zugriff den Typ `string | undefined`, und die Fluchttuer `!` ist projektweit
    // verboten (#193). Die Fallunterscheidung deckt zugleich das leere Array ab.
    //
    // `filePaths[1..]` wird ignoriert - bei `openDirectory` ohne `multiSelections` kann
    // es keinen zweiten Eintrag geben. Faende sich doch einer, waere die stille Wahl des
    // ersten immer noch besser als ein Fehler, denn ein Ziel gibt es nur eines.
    const [erster] = antwort.filePaths
    if (erster === undefined) {
      return { ok: true, wert: { pfad: null } }
    }

    // UNVERAENDERT durchgereicht: nicht normalisiert, nicht getrimmt, kein Schraegstrich
    // vereinheitlicht, nicht auf Existenz und nicht auf Schreibbarkeit geprueft. Jede
    // dieser Bequemlichkeiten waere eine stille Umdeutung der Nutzerauswahl - und die
    // Pruefung sitzt in #184, mit der tatsaechlichen Dateigroesse.
    return { ok: true, wert: { pfad: erster } }
  } catch (ursache) {
    // "Niemals `throw` ueber die Prozessgrenze" (TK 9.1.1): Wirft der Aufruf wider
    // Erwarten - etwa weil beim Start noch kein Fenster bereit ist oder das
    // Betriebssystem den Dialog verweigert -, wird die Ausnahme HIER gefangen. Sonst
    // bliebe beim Renderer nur Text uebrig: "**Fehlerklasse und eigene Felder wie
    // `code` sind verloren** - übrig ist Text." (TK 9.1.1)
    //
    // Der Zweig deckt zugleich den Fall ab, dass die Antwort gar nicht die zugesagte
    // Form hat (fehlendes `filePaths`) - auch dann verlaesst die Funktion die Huelle
    // nicht.
    //
    // `unbekannter_fehler` ist der EINZIGE moegliche Code. Diese Operation vergibt
    // keinen der sieben fachlichen Export-Codes (TK 9.6.4, #182): "**Eine rohe
    // Exception-Meldung wird nie zum Code.**" (TK 9.1.1)
    vermerke(ursache)
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        // `text()` liefert die MELDUNG der Ausnahme, nie ihren Stacktrace (TK 9.1.1
        // Punkt 8). Die Meldung dient der Anzeige, nicht der Verzweigung - dafuer ist
        // der Code da.
        meldung: `Der Ordner-Dialog konnte nicht geoeffnet werden: ${text(ursache)}`,
      },
    }
  }
}

/**
 * Der Wert fuer `defaultPath` - oder `null`, wenn es keinen gibt.
 *
 * DREI AUSGAENGE, EIN ERGEBNIS: zuletzt gemerktes Ziel vorhanden (`string`), noch nie
 * exportiert (`null`), Konfiguration unlesbar (`null`). Nur der erste belegt vor.
 *
 * WARUM EIN FEHLSCHLAG VON `leseKonfig` NICHT DURCHSCHLAEGT: Die Vorbelegung ist eine
 * Bequemlichkeit; eine beschaedigte `config.json` darf den Export nicht verhindern,
 * sonst kostet ein kosmetisches Problem die Kernfunktion FA-09. Der Dialog oeffnet dann
 * eben ohne Startordner.
 *
 * WARUM AUCH EINE AUSNAHME ABGEFANGEN WIRD, obwohl `leseKonfig` die Huelle traegt:
 * Diese Funktion darf unter keinen Umstaenden werfen, sonst risse eine Stoerung im
 * `config-store` genau den Zweig auf, der die Prozessgrenze schuetzen soll - und der
 * Nutzer bekaeme statt eines Dialogs eine Fehlermeldung. Eine geworfene Ausnahme ist
 * dieselbe Aussage wie `ok: false`, nur unhoeflicher formuliert.
 *
 * ES WIRD NICHTS GERATEN: kein "erstes Wechsellaufwerk", kein `os.homedir()`, keine
 * Laufwerksliste. Ein geratenes Laufwerk ist die wahrscheinlichste Ursache dafuer, dass
 * jemand versehentlich auf die falsche Platte exportiert; ohne `defaultPath` waehlt das
 * Betriebssystem seinen ueblichen Startordner.
 */
async function ermittleVorbelegung(): Promise<string | null> {
  try {
    const konfig = await leseKonfig()
    return konfig.ok ? konfig.wert.letztesExportZiel : null
  } catch (ursache) {
    vermerke(ursache)
    return null
  }
}

/**
 * Der interne Vermerk zur Ausnahme.
 *
 * Das ist KEIN eigener Logger und KEINE eigene Protokolldatei: Es ist derselbe
 * vorlaeufige Platzhalter, den `registriere-handler` (#23), der `dispatcher` (#60) und
 * `öffneMedienDialog` (#81) bereits benutzen. Ein projektweiter Mechanismus ist offen
 * (#23) und wird in diesem Issue nicht erfunden.
 *
 * Das ganze Fehlerobjekt geht hinein, Stacktrace eingeschlossen. Kein Widerspruch zu
 * TK 9.1.1 Punkt 8: Verboten ist der Stacktrace im RUECKGABEWERT, also auf dem Weg in
 * die Oberflaeche. Im Protokoll des Hauptprozesses ist er das Einzige, was einen
 * solchen Fehler ueberhaupt auffindbar macht.
 */
function vermerke(ursache: unknown): void {
  console.error('[export-service] wähleExportZiel:', ursache)
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
