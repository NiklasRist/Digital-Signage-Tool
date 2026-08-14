// GENERIERT aus dem Signaturblock von Issue #179.
// [render-service] Abbruch entgegennehmen
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
// GERUEST-PRUEFSUMME: 3fa8de53b3eec1de
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - beide Parameter werden
// jetzt benutzt.
//
// ============================================================================
// DER EINE ZUSTAND "DIESER LAUF IST ABGEBROCHEN"
// ============================================================================
// Hier entsteht er, hier wird er gelesen, und sonst nirgends. Er lebt als EIN
// AbortController je Lauf; `istAbgebrochen()` und `signal` sind zwei SICHTEN auf
// ihn, keine zwei Zustaende. Der Grund, warum es zwei Sichten braucht, steht in
// der Naht zum ffmpeg-adapter: `FfmpegLauf.abbruchSignal` (#158) nimmt ein
// AbortSignal, `renderReel` (#181) will zwischen den Schritten fragen. Zwei
// UNABHAENGIGE Kennzeichen waeren der Fehler - dann meldete der Adapter
// "abgebrochen", waehrend renderReel noch "laeuft" denkt.
//
// WARUM DAS SIGNAL UEBERHAUPT MITREISEN MUSS - AM 14.08.2026 GEMESSEN und als
// tests/integration/ffmpeg-abbruch-echt.spec.ts festgeschrieben (zu #159): Ein
// ueber `taskkill` beendetes ffmpeg meldet unter Windows `code 1, signal null` -
// von einem echten Encoder-Fehler NICHT zu unterscheiden. Ohne das mitgefuehrte
// Signal kaeme jeder Nutzer-Abbruch als rotes "Render fehlgeschlagen" an. Der
// Adverb-Unterschied ist entscheidend: Der Adapter KILLT nicht anhand des Signals,
// er DEUTET damit nur den Ausgang. Getoetet wird ueber beendeLaufendenProzess().
// Deshalb tut cancelRender BEIDES aus EINER Quelle - wer nur eines tut, bekommt
// entweder den falschen Fehlercode oder einen weiterlaufenden Prozess.
//
// UND WAS HIER AUSDRUECKLICH NICHT PASSIERT:
//
// 1. KEIN ZWEITES LOCK. "**Seriell:** hoechstens **ein** Auftrag in `laeuft`. Das
//    ist der einzige Sperr-Mechanismus des Systems; ein zweites Lock ist nicht
//    noetig und darf nicht eingefuehrt werden." (TK 9.3.5) Diese Datei fuehrt
//    Buch, sie sperrt nicht: Ein zweites registriereLauf ERSETZT das erste und
//    wird gemeldet, aber es wird nicht verhindert. Das Verhindern ist Sache des
//    Torwaechters (#59).
//
// 2. KEIN LOESCHEN. "Bei `fehler` und `abgebrochen` entsteht **keine** neue
//    Ausgabedatei ... Aufgeraeumt sind in beiden Faellen **der Arbeitsbereich T1
//    *und* die angefangene `<name>.mp4.part` im Ausgabeordner**" (TK 9.2.3) - das
//    loest #181 in seinem terminalen Zweig ein, und zwar aus einem gemessenen
//    Grund: Solange der Prozess LEBT, haelt er unter Windows ein Handle auf die
//    Datei; das Entfernen scheitert mit EBUSY (14.08.2026 gegen das gebuendelte
//    ffmpeg nachgemessen, siehe Kopf von ffmpeg-adapter/abbruch.ts). Erst wenn das
//    `await` in #181 zurueckgekehrt ist, ist der Prozess wirklich weg. Raeumte
//    DIESE Datei sofort auf, liefe sie genau in diesen Fehler - und auf macOS in
//    den stillen unlink bei noch offener Datei.
//
// 3. KEIN ZEITGEBER. #158 hat entschieden, dass ein Renderlauf KEINE Zeitgrenze
//    bekommt (er darf legitim Minuten dauern, NFA-05); der Abbruch ist der einzige
//    Weg, ihn zu beenden. Ein "hart nachtreten nach n Sekunden" waere hier die
//    zweite Prozessverwaltung - die Fristen dafuer liegen in #159.
//
// 4. KEINE PROZESSE. Diese Datei kennt kein Handle und keine PID. Es gibt genau
//    EINE Stelle im Projekt, die ffmpeg-Prozesse anfasst (#159) - eine zweite
//    raeumte auf, waehrend die erste noch schreibt.
//
// 5. KEIN FEHLER. "**`abgebrochen` ist *kein* Fehlercode.**" (TK 9.2.3) Diese
//    Datei liefert nach aussen keinen Code und kein `fehler`-Objekt; der Ausgang
//    des Laufs reist ueber den Auftrags-Zustand (TK 9.1.1, Punkt 1).

import { beendeLaufendenProzess } from '../ffmpeg-adapter/abbruch'

// Der fremde Aufruf - vollstaendige Signatur, damit hier nichts geraten wird:
//   #159: beendeLaufendenProzess(): Promise<void>
//         // Beendet den gemerkten Prozess plattformsicher.
//         // Loest IMMER auf - auch wenn kein Prozess gemerkt ist, der Prozess schon
//         // tot ist oder das Beenden selbst fehlschlaegt. Lehnt NIE ab und wirft NIE.
//         // merkeProzess/gibProzessFrei ruft DIESE Datei nicht; das verdrahtet #181
//         // ueber FfmpegLauf.aufProzessStart.

export interface LaufRegistrierung {
  /** true, sobald cancelRender fuer GENAU DIESEN Lauf gerufen wurde. */
  istAbgebrochen(): boolean
  /**
   * DASSELBE Abbruch-Kennzeichen in der Form, die der ffmpeg-adapter versteht
   * (FfmpegLauf.abbruchSignal, #158). KEIN zweites Flag - eine Quelle, zwei Formen.
   */
  readonly signal: AbortSignal
  /** Am terminalen Ausgang aufzurufen; hebt die Registrierung auf. Idempotent. */
  freigeben(): void
}

/**
 * Der EINE Platz - kein Verzeichnis, keine Liste.
 *
 * "Es laeuft stets nur ein Auftrag gleichzeitig; die uebrigen warten in
 * Reihenfolge." (Anforderungsdokument NFA-09) Ein Verzeichnis mehrerer Laeufe
 * behauptete das Gegenteil und waere damit die zweite Wahrheit ueber einen
 * Zustand, den der Torwaechter schon fuehrt.
 *
 * Mitgefuehrt wird die Registrierung SELBST, nicht nur ihr Controller: Nur so kann
 * `freigeben()` pruefen, ob der Platz noch IHR gehoert.
 */
let aktiverLauf: {
  readonly renderId: string
  readonly controller: AbortController
  readonly registrierung: LaufRegistrierung
} | null = null

/**
 * Meldet den beginnenden Lauf an. renderReel (#181) ruft das als ersten Schritt auf und
 * `freigeben()` in seinem finally-Zweig.
 */
export function registriereLauf(renderId: string): LaufRegistrierung {
  // FRISCH je Lauf. Ein wiederverwendeter Controller waere nach dem ersten Abbruch
  // dauerhaft ausgeloest und liesse jeden folgenden Render sofort als abgebrochen
  // enden - der Nutzer koennte nach einem einzigen Abbruch nie wieder rendern.
  const controller = new AbortController()

  const registrierung: LaufRegistrierung = {
    // Beide Sichten lesen DENSELBEN Controller. Ein eigenes boolean daneben waere
    // das zweite Kennzeichen, das TK 9.3.5 und dieses Issue ausschliessen - und es
    // koennte vom Signal abweichen.
    istAbgebrochen: () => controller.signal.aborted,
    signal: controller.signal,
    freigeben: () => {
      // Nur den EIGENEN Platz raeumen. Ein spaet eintreffendes freigeben() eines
      // alten Laufs darf den inzwischen gestarteten neuen nicht abmelden - der waere
      // danach unabbrechbar. Dieselbe Vorsicht wie in gibProzessFrei (#159).
      // Zugleich ist das die Idempotenz: der zweite Aufruf findet seinen Platz nicht
      // mehr vor und tut nichts.
      if (aktiverLauf?.registrierung !== registrierung) return
      aktiverLauf = null
    },
  }

  if (renderId === '') {
    // Die `renderId` "wird **vom Renderer vergeben**" (TK 9.2.1) und ist damit
    // Nutzlast von aussen. Leer darf sie nicht sein - dann traefe jeder Abbruch mit
    // leerer Kennung diesen Lauf. Geworfen wird trotzdem nicht: Ein Wurf an dieser
    // Stelle nimmt #181 den Anfang seines Laufs und damit dem Nutzer den Abbruch
    // ueberhaupt. Die Abweisung der Anfrage gehoert an den Auftrags-Eingang
    // (`ungueltige_eingabe`, TK 9.2.3), nicht hierher.
    protokolliere('registriereLauf mit leerer renderId - der Auftrags-Eingang hat sie durchgelassen')
  }

  if (aktiverLauf !== null) {
    // Kein Wurf und KEIN Abbruch des Vorgaengers: Wer den alten Controller hier
    // ausloeste, meldete einen Lauf als vom Nutzer abgebrochen, den niemand
    // abgebrochen hat. Der alte Lauf behaelt seine eigene Registrierung samt
    // Antwort; verloren geht ihm nur die Erreichbarkeit fuer cancelRender.
    protokolliere('registriereLauf: Es lag bereits ein Lauf - die serielle Zusage ist verletzt')
  }

  aktiverLauf = { renderId, controller, registrierung }
  return registrierung
}

/**
 * Abbruch-Signal. Kommt aus #68 (der Abbrecher des render-Auftrags) und damit letztlich aus
 * `entferne(auftragId)` im queue-panel. Kehrt SOFORT zurueck und wartet NICHT auf das Prozessende.
 */
export function cancelRender(renderId: string): void {
  const lauf = aktiverLauf

  // Kein Lauf registriert: Der Klick kam, nachdem der Lauf von selbst fertig wurde.
  // Der Nutzer hat richtig gehandelt, es war nur zu spaet - daraus einen Fehler zu
  // machen, waere fuer ihn unverstaendlich.
  if (lauf === null) return

  // Fremde Kennung: NIE einen anderen Lauf treffen. Der Vergleich ist verlaesslich,
  // weil die `renderId` "**vom Renderer vergeben**" wird, "sodass er verspaetete
  // Ereignisse eines alten Laufs sicher erkennen kann (9.2.7)." (TK 9.2.1)
  if (lauf.renderId !== renderId) return

  // ERST das Kennzeichen, DANN der Stopp: Der Stopp darf scheitern, der Lauf muss
  // trotzdem im Abbruch-Zweig enden - sonst kaeme ein Abbruch mit stolperndem
  // Adapter als roter Fehlschlag an. Zweimal abort() auf denselben Controller ist
  // folgenlos; daher die Idempotenz.
  //
  // EHRLICHKEIT ZUR REIHENFOLGE, am 14.08.2026 als Gegenprobe nachgemessen: Sie
  // ALLEIN traegt die Zusage nicht. Vertauscht man die beiden Zeilen, bleibt der
  // Testlauf gruen - weil der Faenger in stosseStoppAn den Wurf schluckt und die
  // Ausfuehrung hier weiterlaeuft. Was tatsaechlich beisst, ist das Entfernen des
  // Faengers (dann faellt der Wurf durch cancelRender hindurch, und das Kennzeichen
  // bleibt ungesetzt). Beides bleibt stehen: Die Reihenfolge kostet nichts und ist
  // die Vorkehrung fuer den Tag, an dem jemand den Faenger enger zieht.
  lauf.controller.abort()

  // Der Platz bleibt belegt. Aufgeraeumt wird er von `freigeben()` am terminalen
  // Ausgang (#181) - erst dort steht fest, dass der Lauf wirklich vorbei ist. Wer
  // hier abmeldete, machte den zweiten Abbruch wirkungslos und liesse einen nicht
  // reagierenden Prozess unerreichbar zurueck.
  stosseStoppAn()
}

/**
 * Der Stopp beim ffmpeg-adapter: anstossen und weitergehen.
 *
 * NICHT ABGEWARTET, und das ist der ganze Punkt: cancelRender muss synchron
 * zurueckkehren, sonst haengt die Oberflaeche an dem Knopf, den der Nutzer gerade
 * gedrueckt hat. Dass der Lauf danach wirklich endet, stellt #181 fest, indem sein
 * `await` zurueckkehrt.
 *
 * Die beiden Faenger sind Vorsorge gegen einen gebrochenen Vertrag, nicht gegen den
 * erwarteten Fall: #159 sagt zu, IMMER aufzuloesen und NIE zu werfen. Haelt es sich
 * eines Tages nicht daran, kostet das hier eine Protokollzeile - ohne die Faenger
 * kostete es den Abbruch (Wurf) oder den Hauptprozess (unbehandelte Ablehnung).
 */
function stosseStoppAn(): void {
  try {
    void beendeLaufendenProzess().catch((ursache: unknown) => {
      protokolliere('Der Adapter-Stopp hat abgelehnt', ursache)
    })
  } catch (ursache) {
    protokolliere('Der Adapter-Stopp ist unerwartet gescheitert', ursache)
  }
}

/**
 * Die interne Protokollierung - wie im uebrigen Hauptprozess als console.error mit
 * Modul-Praefix. Nach aussen dringt nichts: Diese Datei kennt weder einen
 * Fehlercode noch einen Empfaenger, und eine Meldung an den Nutzer waere die
 * Behauptung, sein Abbruch sei schiefgegangen.
 */
function protokolliere(stelle: string, ursache?: unknown): void {
  if (ursache === undefined) {
    console.error(`[render-service] abbruch: ${stelle}`)
    return
  }
  console.error(`[render-service] abbruch: ${stelle}:`, ursache)
}
