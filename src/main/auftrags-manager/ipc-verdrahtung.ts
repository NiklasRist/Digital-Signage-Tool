// GENERIERT aus dem Signaturblock von Issue #71.
// [auftrags-manager] Die vier Queue-Kanäle und das Ereignis verdrahten
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
// GERUEST-PRUEFSUMME: 00030e1e282ac5c3
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt; Parameter und Importe werden jetzt benutzt.

import type { BrowserWindow } from 'electron'

import type { AuftragArt } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'          // #25
// Die vier Nutzlast-Pruefer liegen seit #332 an EINEM Ort (Vermerk 2 am Dateiende).
// Der Import ueber die Modulgrenze ist kein neuer Grenzuebertritt: `registriereHandler`
// kommt aus derselben Richtung.
import { abgelehnt, istGefuellterText, istObjekt, ohneNutzlast } from '../ipc-gateway/nutzlast-pruefer' // #332
import { registriereHandler } from '../ipc-gateway/registriere-handler' // #23
import { entferne } from './entferne'                             // #62
import { holeStand } from './hole-stand'                          // #64
import { aufQueueGeaendert, aufQueueStoerung } from './queue-ereignis' // #65
import { reiheEin, type NutzlastVon } from './reihe-ein'          // #61
import { wiederhole } from './wiederhole'                         // #63

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird. Alle sechs
// sind gegen die GEBAUTEN Dateien geprueft, nicht gegen das Zitat im Issue:
//   #23: registriereHandler<T, F extends string>(
//          kanal: string,
//          validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                          | { ok: true; wert: unknown },
//          ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//        ): void
//        // validiert zuerst; bei ok:false laeuft `ausfuehren` GAR NICHT an. Faengt jede
//        // Ausnahme und uebersetzt sie in 'unbekannter_fehler'. Reicht das Ergebnis von
//        // `ausfuehren` unveraendert zurueck.
//   #61: reiheEin<A extends AuftragArt>(art: A, payload: NutzlastVon<A>)
//          : Promise<Ergebnis<{ auftragId: string }>>
//   #62: entferne(auftragId: string): Promise<Ergebnis<void>>
//   #63: wiederhole(auftragId: string): Promise<Ergebnis<void>>
//   #64: holeStand(): Promise<Ergebnis<Auftrag[]>>
//   #65: aufQueueGeaendert(hoerer: (auftraege: Auftrag[]) => void): () => void
//        aufQueueStoerung(hoerer: (meldung: string) => void): () => void
//        // beide MAIN-INTERN; der Rueckgabewert ist die Abmelde-Funktion.

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird.
 *
 * `registriereHandler` (#23) reicht der Fachoperation genau das herein, was der Validierer
 * als `wert` zurueckgegeben hat - seine Signatur schreibt aber `validierteNutzlast: unknown`,
 * der Typ geht auf dem Weg also verloren. Ohne diese Huelle stuende in jedem der vier
 * Kanaele ein eigenes `as`; verstreute Behauptungen kann niemand mehr gegen ihren
 * Validierer halten, und die erste, die zum falschen gehoert, faellt erst zur Laufzeit auf.
 *
 * Hier steht die Behauptung EINMAL, und `pruefe` und `rufe` sind ueber `W` aneinander
 * gebunden. Gleiche Bauform wie in `ipc-gateway/config-store-verdrahtung.ts` (#77) - dort
 * ist sie modulprivat, und ein gemeinsamer Baustein daraus zu machen hiesse, eine fremde
 * Datei zu aendern (Regel E). Gemeldet ist die Doppelung am Dateiende.
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) =>
    // SAFETY: pruefe hat die Nutzlast unmittelbar zuvor validiert und in die Huelle
    // gelegt; der Cast benennt diese belegte Form, damit rufe den geprueften Typ sieht.
    rufe(validierteNutzlast as W),
  )
}

/**
 * Die vier erlaubten Auftragsarten - als `Record<AuftragArt, true>` und nicht als Array.
 *
 * Der Unterschied ist die Wartung: Kaeme in `AuftragArt` (#16) je eine fuenfte Art hinzu,
 * WIRFT diese Zeile einen Uebersetzungsfehler, weil das Objekt dann unvollstaendig ist.
 * Ein `readonly AuftragArt[]` mit vier Literalen bliebe dagegen still gueltig, und die neue
 * Art waere aus dem Renderer unerreichbar - ein Kanal, der genau eine Auftragsart lautlos
 * verschluckt, ist die teuerste Art von Luecke.
 */
const ARTEN: Record<AuftragArt, true> = { import: true, loeschen: true, render: true, export: true }

/**
 * `Object.hasOwn` statt `wert in ARTEN`: `in` findet auch Geerbtes, und eine Nutzlast mit
 * `art: 'toString'` oder `art: 'constructor'` kaeme damit durch. Sie scheiterte dann erst
 * im Auffangzweig von #61 - mit einer Meldung ueber eine unbekannte Auftragsart statt mit
 * `ungueltige_eingabe` an der Grenze, und nach dem hier verbotenen Umweg durch die
 * Fachoperation.
 */
function istAuftragArt(wert: unknown): wert is AuftragArt {
  return typeof wert === 'string' && Object.hasOwn(ARTEN, wert)
}

/**
 * Der EINE Sendeweg an das EINE Fenster (TK 9.1.1 Punkt 10).
 *
 * Beide Ereignisse gehen hier durch; ein zweiter `webContents.send`-Ort im Modul gaebe
 * es nicht. Das Fenster kommt als Parameter herein - diese Funktion sucht keines und
 * waehlt keines aus.
 *
 * DIE PRUEFUNG AUF `isDestroyed()` IST TRAGEND: Nach dem Schliessen des Fensters wirft
 * schon der Zugriff auf `webContents`. Der Hoerer laeuft aber innerhalb von
 * `sendeQueueGeaendert` (#65), das seinerseits von #59/#61/#62/#63/#70 abgewartet wird -
 * eine Ausnahme brachte also den Auftragsfluss zum Stehen. Verworfen wird STILL und ohne
 * Merker: Gepuffert wird ausdruecklich nichts (TK 9.1.1 Punkt 10), den Ausgleich schafft
 * der Renderer, indem er beim Aufbau einmal `holeStand` ruft und erst danach abonniert.
 *
 * Das `try/catch` daneben ist die zweite Haelfte der Zusage "der Versand darf NIE werfen":
 * Zwischen Pruefung und Senden liegt kein `await`, aber `webContents` kann auch aus
 * anderem Grund weg sein (abgestuerzter Renderer-Prozess). Geschluckt wird der Fall nicht -
 * ohne die Zeile waere ein dauerhaft unerreichbares Fenster von "es gibt nichts Neues"
 * nicht zu unterscheiden.
 */
function sende(fenster: BrowserWindow, kanal: string, nutzlast: unknown): void {
  if (fenster.isDestroyed()) {
    return
  }
  try {
    fenster.webContents.send(kanal, nutzlast)
  } catch (ursache) {
    console.error(`[auftrags-manager] ipc-verdrahtung: Senden auf "${kanal}" fehlgeschlagen:`, ursache)
  }
}

export function verdrahteQueueIPC(fenster: BrowserWindow): void {
  // Alle sechs Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung. Ein Tippfehler waere
  // sonst erst zur Laufzeit sichtbar, und zwar als Aufruf, der ins Leere laeuft, nicht als
  // Uebersetzungsfehler.

  meldeAn(
    KANAELE.queue.reiheEin,
    // Der ausgeschriebene Rueckgabetyp steht ABSICHTLICH da: Er legt `W` der Huelle fest,
    // bevor der zweite Rueckruf getippt wird - ohne ihn muesste TypeScript `W` aus zwei
    // zugleich kontextabhaengigen Funktionen erraten.
    //
    // `payload` reist als `unknown` weiter, obwohl es hier als Objekt erkannt wurde: Seine
    // Form ist Sache von #61, und ein `Record<string, unknown>` an dieser Stelle waere eine
    // Aussage ueber sie, die diese Datei nicht treffen darf - sie zwaenge die Umschreibung
    // unten ausserdem ueber zwei Stufen (`as unknown as`), weil die vier Request-Typen sich
    // mit einem Record nicht ueberschneiden.
    (nutzlast: unknown): Ergebnis<{ art: AuftragArt; payload: unknown }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('reiheEin erwartet ein Objekt { art, payload }.')
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung
      // durch die Waechterfunktionen verlaesslich, an einem Feld eines Record-Typs nicht
      // ueberall.
      const art = nutzlast.art
      const payload = nutzlast.payload
      if (!istAuftragArt(art)) {
        return abgelehnt('reiheEin braucht eine art aus import, loeschen, render oder export.')
      }
      // NICHT TIEFER (Pruef-Tabelle des Issues): Ob die Felder der Nutzlast zur Art passen,
      // entscheidet #61 - und zwar mit vier getrennten Zweigen, die genau das absichern.
      // Eine zweite, hier nachgebaute Fachpruefung waere die naechste Stelle, die beim
      // Erweitern eines Requests vergessen wird, und sie waere dann STRENGER als die
      // Fachoperation: ein Feld, das #61 laengst kennt, kaeme gar nicht erst bei ihm an.
      if (!istObjekt(payload)) return abgelehnt('reiheEin braucht ein Objekt als payload.')
      // NUR die beiden erwarteten Felder reisen weiter; ein Fremdfeld landete ueber #61 im
      // Auftrag und von dort in Q4 und Q3.
      return { ok: true, wert: { art, payload } }
    },
    // DIE EINE BEHAUPTUNG DIESER DATEI - und sie behauptet weniger, als sie aussieht:
    // `reiheEin` bindet `art` und `payload` ueber `A` aneinander, hier ist `art` aber die
    // ganze Union, weil sie erst zur Laufzeit feststeht. Statisch laesst sich das Paar an
    // dieser Grenze nicht mehr binden. Gedeckt ist die Umschreibung dadurch, dass #61 die
    // Nutzlast je Art SELBST prueft und eine unpassende mit `ungueltige_eingabe` ablehnt
    // (nachgelesen in reihe-ein.ts, `baueAuftrag`) - der Typechecker verliert hier also
    // eine Zusage, die zur Laufzeit einen Schritt weiter erneut eingeloest wird.
    // Vier `switch`-Zweige mit je einer eigenen Umschreibung waeren VIER Behauptungen
    // statt einer und brachten keinen Beweis dazu.
    // SAFETY: #61 prueft die Nutzlast je Art in baueAuftrag selbst (Ergebnis-Huelle);
    // der Cast benennt die erwartete Form, die dort erneut eingeloest wird.
    ({ art, payload }) => reiheEin(art, payload as NutzlastVon<AuftragArt>),
  )

  meldeAn(
    KANAELE.queue.entferne,
    (nutzlast: unknown): Ergebnis<{ auftragId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('entferne erwartet ein Objekt { auftragId }.')
      const auftragId = nutzlast.auftragId
      if (!istGefuellterText(auftragId)) {
        return abgelehnt('entferne braucht eine nicht leere auftragId.')
      }
      return { ok: true, wert: { auftragId } }
    },
    // KEINE Vorpruefung, ob es den Auftrag gibt, und kein Blick in Q1/Q2: Hier steckt keine
    // Fachlogik. `nicht_gefunden` vergibt #62, und zwar unter Kenntnis des Zustands.
    ({ auftragId }) => entferne(auftragId),
  )

  meldeAn(
    KANAELE.queue.wiederhole,
    (nutzlast: unknown): Ergebnis<{ auftragId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('wiederhole erwartet ein Objekt { auftragId }.')
      const auftragId = nutzlast.auftragId
      if (!istGefuellterText(auftragId)) {
        return abgelehnt('wiederhole braucht eine nicht leere auftragId.')
      }
      return { ok: true, wert: { auftragId } }
    },
    ({ auftragId }) => wiederhole(auftragId),
  )

  meldeAn(KANAELE.queue.holeStand, ohneNutzlast, () => holeStand())

  // ---------------------------------------------------------------------------------
  // Die beiden Ereignisse. JE GENAU EINE Anmeldung - zwei hiessen zwei Weitergaben
  // derselben Meldung, und der Renderer bekaeme denselben Stand doppelt.
  // ---------------------------------------------------------------------------------

  // Das Array reist NACKT: kein `ok`, kein `wert`, kein `fehler` (TK 9.1.1 Punkte 2 und 5).
  // Und unveraendert: nicht umsortiert, nicht gefiltert, ohne Zusatzfelder - sonst zeigte
  // das Panel beim Oeffnen (holeStand) etwas anderes als beim Push.
  const abmeldenGeaendert = aufQueueGeaendert((auftraege) => {
    sende(fenster, KANAELE.queue.geaendert, auftraege)
  })

  // Klartext, kein Fehlercode und keine Huelle (#65). Der Empfaenger zeigt die Meldung an,
  // er verzweigt nicht darauf.
  const abmeldenStoerung = aufQueueStoerung((meldung) => {
    sende(fenster, KANAELE.queue.stoerung, meldung)
  })

  // ABRAEUMEN. Ohne diese Zeilen hinge nach dem Schliessen des Fensters eine
  // Fensterreferenz an zwei lebenden Hoerern: #65 haelt sie in einer Menge, die den ganzen
  // Prozess ueberdauert, und jede weitere Zustandsaenderung liefe in `sende` und dort in
  // die `isDestroyed`-Pruefung - ein stiller Leerlauf, der das Fenster am Freigegebenwerden
  // hindert.
  //
  // `once('closed')` und NICHT `'close'`: `close` ist abbrechbar (ein Hoerer kann
  // `preventDefault` rufen), und eine dort ausgehaengte Verdrahtung liesse sich durch nichts
  // wieder anmelden - die Warteschlangen-Anzeige waere ab dem ersten abgebrochenen
  // Schliessversuch tot. `closed` faellt an, wenn das Fenster tatsaechlich weg ist.
  //
  // Das ist KEIN Warten auf den Aufbau des Fensters im Sinne des Verbots: Angemeldet wird
  // sofort und unbedingt, aufgeschoben ist allein das ABMELDEN. Gepuffert wird nichts, und
  // auf ein Ladeereignis wartet diese Datei an keiner Stelle.
  fenster.once('closed', () => {
    abmeldenGeaendert()
    abmeldenStoerung()
  })
}
// 1. registriert die vier Operations-Kanaele KANAELE.queue.reiheEin/.entferne/.wiederhole/
//    .holeStand ueber den Wrapper aus #23 - je mit eigener Validierungsfunktion.
// 2. meldet sich ueber aufQueueGeaendert und aufQueueStoerung (#65) je EINMAL als Hoerer an
//    und gibt jede Meldung auf KANAELE.queue.geaendert bzw. KANAELE.queue.stoerung an DAS
//    EINE Fenster weiter - OHNE Huelle, OHNE Endzustand.
// 3. Vor jedem Senden wird fenster.isDestroyed() geprueft; ist es zerstoert, wird still
//    verworfen. Beim Schliessen des Fensters werden beide Hoerer abgemeldet.

// NICHT HIER, UND GEMELDET:
//
// 1. ERLEDIGT am 13.08.2026 - der Vermerk bleibt als Beleg stehen. Hier stand "KEIN
//    AUFRUFER": src/main/index.ts fuehrte den Aufruf nur als Kommentar ("LUECKE",
//    Schritt 7). Mit #269 steht dort jetzt die echte Zeile, als erste der Anmeldungen
//    MIT Fenster, unmittelbar nach `erstelleHauptfenster()`.
//    NICHT VERWECHSELN mit der parameterlosen Form: Neun angelegte Issues zitieren
//    `verdrahteQueueIPC()` ohne Argument und ordnen es VOR das Fenster ein (#61-#64,
//    #71, #76, #77, #92, #93, #109). Das ist ueberholt und in allen neun als Warnung
//    nachgetragen - diese Funktion BRAUCHT das Fenster, weil sie die einzige Stelle mit
//    einer Fensterreferenz ist.
//
// 2. TEILWEISE ERLEDIGT (#332 am 14.08.2026) - der Vermerk bleibt als Beleg stehen. Hier
//    stand, dass die HUELLE `meldeAn` UND die PRUEFER `istObjekt`/`istGefuellterText`/
//    `abgelehnt`/`ohneNutzlast` ein zweites Mal in
//    src/main/ipc-gateway/config-store-verdrahtung.ts (#77) stehen, Wort fuer Wort, und
//    dass der Ort fuer eine Zusammenfuehrung das ipc-gateway waere.
//    DIE VIER PRUEFER SIND UMGEZOGEN: src/main/ipc-gateway/nutzlast-pruefer.ts, importiert
//    oben. Sie stehen in dieser Datei nicht mehr.
//    OFFEN BLEIBT `meldeAn`: Die Huelle steht weiterhin dreifach (hier, #76, #77). #332
//    betrifft ausdruecklich nur die vier Pruefer; sie mitzuziehen waere eine Ausweitung
//    ueber den Auftrag hinaus. Gemeldet fuer ein eigenes Issue.
//
// 3. VERALTETER VERWEIS IN #65. src/main/auftrags-manager/queue-ereignis.ts nennt im
//    Vermerk am Dateiende noch den frueheren Kanalnamen des Stoerungs-Ereignisses
//    (Endung "standFehler"); verbindlich ist seit der Korrektur vom 13.08.2026 der Name aus
//    KANAELE.queue.stoerung. Nur ein Kommentar, kein Code - und eine fremde Datei, deshalb
//    hier nicht angefasst.
