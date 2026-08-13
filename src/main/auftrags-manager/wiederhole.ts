// GENERIERT aus dem Signaturblock von Issue #63.
// [auftrags-manager] wiederhole implementieren
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
// GERUEST-PRUEFSUMME: 4302fc35ac5eaaf0
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile ist mit dem Fuellen des Rumpfes entfernt;
// Parameter und Importe werden jetzt benutzt. Der Absatz darueber bleibt als Beleg
// stehen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #55 (Q2): holeQ2Stand(): { projektId: string; datei: Q2Datei } | null
//             synchron, nur RAM - der Stand des ZULETZT GELADENEN Projekts. Heraus kommt
//             eine Kopie der beiden LISTEN, aber DIESELBEN Auftrags-Objekte; genau darauf
//             beruht Schritt 2 (Wertkopie statt Objektreferenz).
//   #54 (Q1): fuegeAnsEndeAn(auftrag: Auftrag): number   - die Position in der Schlange
//             findeQ1(auftragId: string): Q1Eintrag | undefined
//   #57 (Q4-Journal): haengeJournalEintragAn(eintrag: JournalEintrag)
//                       : Promise<Ergebnis<void, QueueFehlercode>>
//   #65 (Ereignis): sendeQueueGeaendert(): Promise<void>
//   #59 (Torwaechter): starteNaechsten(): void
//
// ZU findeQ1: Es steht NICHT in der Funktionsliste des Issues, ist fuer die dort
// verbindlich verlangte Idempotenz aber unverzichtbar - "steht der Auftrag bereits in Q1"
// ist eine Frage an Q1, und `fuegeAnsEndeAn` beantwortet sie nicht: Sein Rueckgabewert ist
// in beiden Faellen eine Position und unterscheidet "angehaengt" nicht von "war schon da".
// Gemeldet am Dateiende, Punkt 1.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { JournalEintrag } from '../../shared/contracts/protokoll'
import { findeQ1, fuegeAnsEndeAn } from './q1-warteschlange'
import { holeQ2Stand } from './q2-wiederholung'
import { haengeJournalEintragAn } from './q4-journal'
import { sendeQueueGeaendert } from './queue-ereignis'
import { starteNaechsten } from './torwaechter'

export async function wiederhole(auftragId: string): Promise<Ergebnis<void>> {
  if (typeof auftragId !== 'string' || auftragId.length === 0) {
    // Geprueft, obwohl der Parameter typisiert ist: Der Aufruf kommt ueber #71 vom
    // Renderer herein, und die Nutzlast eines IPC-Aufrufs ist zur Laufzeit alles
    // Moegliche. Ohne die Zeile liefe `undefined` in die Q2-Suche und kaeme dort als
    // `nicht_gefunden` heraus - ein Programmierfehler des Aufrufers saehe dann aus wie
    // ein Fehlschlag, den es nicht mehr gibt.
    return fehler('ungueltige_eingabe', 'wiederhole wurde ohne Auftrags-Kennung aufgerufen.')
  }

  // SCHRITT 1: In Q2 suchen - und AUSSCHLIESSLICH dort.
  //
  // Die Q2-DATEI wird hier nicht angefasst: kein `fs`, kein #69, kein eigenes Parsen von
  // queue-retry.json. Es gibt genau EINEN Kenner der Dateiform (#55), und ein zweiter
  // laege beim naechsten Formatwechsel still daneben.
  //
  // `null` heisst: In dieser Sitzung wurde noch kein Projekt geladen. Dann gibt es
  // ueberhaupt keinen Stand, in dem der Eintrag liegen koennte. NACHGELADEN wird nichts -
  // Q2 liegt pro Projekt (TK 9.3), und ein fremdes Q2 zu ziehen hiesse, zwei Projekte
  // gleichzeitig im Speicher zu halten (TK 9.5.1: "Nur *ein* Projekt ist gleichzeitig
  // geladen").
  const stand = holeQ2Stand()
  if (stand === null) {
    return fehler(
      'nicht_gefunden',
      `Zur Kennung "${auftragId}" gibt es keinen wiederholbaren Auftrag - es ist kein Projekt geladen.`,
    )
  }

  const q2Eintrag = stand.datei.auftraege.find((vorhanden) => vorhanden.auftragId === auftragId)
  if (q2Eintrag === undefined) {
    // Hier laufen drei Zeilen der Fehlerpfad-Tabelle zusammen: die unbekannte Kennung, die
    // Kennung, die NUR in Q1 steht (anstehend oder laufend - wiederholt wird ausschliesslich,
    // was in Q2 liegt), und der Fehlschlag eines anderen, nicht geladenen Projekts. Alle drei
    // sind aus der Sicht dieser Funktion dasselbe: In dem Stand, der wiederholbar ist, gibt es
    // ihn nicht.
    return fehler(
      'nicht_gefunden',
      `Zur Kennung "${auftragId}" gibt es im Wiederholungs-Speicher des Projekts ` +
        `"${stand.projektId}" keinen Fehlschlag.`,
    )
  }

  // DOPPELKLICK - der Ablauf endet nach Schritt 1 (entschieden im Issue).
  //
  // Ohne diese Abfrage bliebe zwar das Duplikat aus (#54 haengt eine bereits vorhandene
  // Kennung nicht ein zweites Mal an), aber Journal, Ereignis und Torwaechter liefen ein
  // zweites Mal - die Q4-Bewegung behauptete dann ein Einreihen, das gar nicht stattgefunden
  // hat. Ein Fehler ist das nicht: Der Nutzer hat nichts falsch gemacht, und der gewuenschte
  // Zustand ist hergestellt.
  //
  // GEPRUEFT WIRD AUF DEN EINTRAG, NICHT AUF SEINEN STATUS. Das Issue nennt `anstehend` und
  // `laeuft`; ein Q1-Eintrag mit TERMINALEM Status ist der schmale Augenblick im Abschlussweg
  // (#70) zwischen `merkeFehlschlag` und `entferneAusQ1`, in dem der Auftrag in beiden
  // Speichern steht. Auch dann darf nichts geschehen: Einhaengen wuerde #54 ohnehin ablehnen
  // (die Kennung ist da), und uebrig blieben eine falsche Journalzeile und ein Ereignis ohne
  // Aenderung. #70 raeumt den Eintrag unmittelbar danach weg, der Q2-Eintrag bleibt bestehen -
  // ein zweiter Klick wirkt dann. Eigene Festlegung, gemeldet am Dateiende, Punkt 2.
  if (findeQ1(auftragId) !== undefined) {
    return { ok: true, wert: undefined }
  }

  // SCHRITT 2: die WERTKOPIE. Sie traegt dieselbe `auftragId` und dieselbe `payload` - es
  // entsteht kein zweiter Vorgang, nur eine zweite Objektreferenz.
  //
  // WARUM NICHT `q2Eintrag` SELBST: #55 gibt die Auftrags-OBJEKTE des gehaltenen Standes
  // heraus (kopiert werden nur die beiden Listen). Ginge dieses Objekt nach Q1, setzte der
  // Torwaechter (#59) `status`, `versuche`, `begonnenAm` und `fortschritt` daran - und damit
  // am Q2-Eintrag. Dessen letzter Fehlerstand waere ueberschrieben, `holeStand` (#64) verloere
  // die Angabe, auf der seine Fehler-Anzeige beruht (FA-16), und der naechste Q2-Schreibvorgang
  // legte `status: 'laeuft'` dauerhaft in die Datei.
  //
  // GEAENDERT WIRD EINZIG `status`:
  //   - `versuche` NICHT (auch nicht zurueckgesetzt): Der Zaehler steigt genau einmal, beim
  //     START in #59 (TK 9.3.3). Zaehlten beide Stellen, stuende nach einem Fehlschlag und
  //     einer Wiederholung `versuche = 3` statt 2, und `ProtokollEintrag.versuch` waere
  //     dauerhaft falsch - Q3 ist der Speicher, aus dem nichts mehr herauskommt.
  //   - `fortschritt` NICHT: Den setzt der Torwaechter beim Start auf null zurueck (#59,
  //     Schritt 6b). Eine zweite Stelle, die dasselbe tut, waere eine zweite Wahrheit.
  //   - `fehler` NICHT: FA-17 verlangt, dass der Fehlschlag "mit Fehlergrund sichtbar" bleibt.
  //     Geleert wird er beim ERFOLG (#70) - dort, wo er tatsaechlich ueberholt ist.
  const kopie: Auftrag = { ...q2Eintrag, status: 'anstehend' }

  // ANS ENDE - die FIFO-Zusage aus TK 9.3.5 gilt ausdruecklich auch fuer `wiederhole`. Die
  // Position kommt von #54 zurueck und wird NICHT selbst nachgerechnet; sie geht unveraendert
  // in die Q4-Bewegung, damit dort keine erfundene Zahl steht.
  const position = fuegeAnsEndeAn(kopie)

  // SCHRITT 3 ist eine Unterlassung und deshalb hier nur als Kommentar zu sehen: DER
  // Q2-EINTRAG BLEIBT. Er wird nicht geloescht, nicht verschoben und nicht als "in
  // Bearbeitung" markiert. Q2 existiert, damit Wiederholen einen ABSTURZ uebersteht; wer ihn
  // jetzt streicht, verlegt den Fehlschlag in den fluechtigen Q1 (TK 9.3: Q1 ist "fluechtig
  // (RAM) - nach Neustart leer"), und ein Absturz waehrend der Wiederholung loeschte ihn
  // spurlos aus. Gestrichen wird er allein nach ERFOLG, im Abschlussweg (#70).
  //
  // Folge, die hier auszuhalten und nicht zu "loesen" ist: Bis zum Ausgang steht derselbe
  // Auftrag in Q1 UND Q2. Dass er in der Oberflaeche trotzdem einmal erscheint, besorgen
  // #64 und #65 durch Deduplizieren ueber `auftragId`.

  // SCHRITT 4: Q4-Bewegung. Ein Fehlschlag beim Schreiben macht das Wiedereinreihen NICHT
  // rueckgaengig - der Auftrag steht bereits in Q1.
  await schreibeBewegung({
    zeit: new Date().toISOString(),
    auftragId,
    bewegung: 'erneut_eingereiht',
    position,
  })

  // KEIN Q3-EINTRAG. "Q3 protokolliert nur, was tatsaechlich gelaufen ist" (TK 9.3); der neue
  // Eintrag mit hoeherem `versuch` entsteht erst, wenn dieser Versuch beendet ist (#70).

  // SCHRITT 5: Ereignis - ABGEWARTET, bevor Schritt 6 antwortet. So hat das Panel den neuen
  // Stand, wenn die Antwort auf den Klick eintrifft.
  await melde()

  // SCHRITT 6: anstossen, nicht selbst starten. Der Torwaechter ist der einzige
  // Sperr-Mechanismus des Systems (TK 9.3.5); er entscheidet, ob ueberhaupt etwas losgehen
  // darf, und er tut es auch dann, wenn die Schlange gerade leer aussieht. Ein eigener Start
  // hier waere das zweite Lock, das es nicht geben darf.
  stosseAn()

  return { ok: true, wert: undefined }
}
// Ablauf: Eingang pruefen -> holeQ2Stand() (#55) -> Eintrag in datei.auftraege suchen
//         -> schon in Q1? dann ohne jede Wirkung { ok: true } -> Wertkopie mit
//         status: 'anstehend' ans Ende von Q1 (#54) -> Q2-Eintrag BLEIBT
//         -> Q4-Bewegung `erneut_eingereiht` (#57) -> queue:geaendert (#65, abgewartet)
//         -> starteNaechsten() (#59) -> { ok: true, wert: undefined }

// -------------------------------------------------------------------------------------------
// Die drei Nebenwege - keiner dreht das bereits vollzogene Wiedereinreihen zurueck
// -------------------------------------------------------------------------------------------

/**
 * Q4-Bewegung schreiben - und einen Fehlschlag NICHT zum Fehlschlag der Operation machen.
 *
 * #57 verlangt das ausdruecklich von seinen Aufrufern ("Dass die Aufrufer bei
 * `speicher_fehler` NICHT abbrechen, ist ihre Pflicht"). Q4 ist rein diagnostisch; der Auftrag
 * STEHT in der Schlange, wenn diese Zeile laeuft. Eine Fehlermeldung sagte dem Nutzer, das
 * Wiederholen sei misslungen - und er saehe den Auftrag im Panel trotzdem anstehen und
 * gleich darauf laufen.
 *
 * Der `catch` deckt den Vertragsbruch ab: #57 sagt zu, nicht zu werfen. Ohne ihn verliesse eine
 * Ausnahme diese Funktion NACH der Aenderung an Q1, das Gateway (#23) machte
 * `unbekannter_fehler` daraus, und dieselbe Falschauskunft entstuende auf dem Umweg.
 */
async function schreibeBewegung(eintrag: JournalEintrag): Promise<void> {
  try {
    const geschrieben = await haengeJournalEintragAn(eintrag)
    if (!geschrieben.ok) {
      protokolliere(
        `Q4-Bewegung "erneut_eingereiht" fuer Auftrag ${eintrag.auftragId} nicht geschrieben ` +
          `(${geschrieben.fehler.code})`,
        geschrieben.fehler.meldung,
      )
    }
  } catch (ursache) {
    protokolliere('haengeJournalEintragAn (#57) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/**
 * Das Ereignis ausloesen - abgewartet, damit die Hoerer den neuen Stand haben, bevor diese
 * Operation antwortet; gefangen aus demselben Grund wie oben. #65 faengt selbst und wirft laut
 * Vertrag nicht, aber eine gescheiterte BENACHRICHTIGUNG darf ein bereits erfolgtes
 * Wiedereinreihen nicht nachtraeglich zum Fehler machen.
 */
async function melde(): Promise<void> {
  try {
    await sendeQueueGeaendert()
  } catch (ursache) {
    protokolliere('sendeQueueGeaendert (#65) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/**
 * Den Torwaechter anstossen, ohne dass sein Scheitern die Antwort umdreht.
 *
 * Gleiche Ueberlegung wie bei #70, das `starteNaechsten` ebenfalls einfaengt: Der Auftrag ist
 * an dieser Stelle eingereiht, und genau das meldet `ok`. Ein Wurf aus #59 - der laut Vertrag
 * nicht vorkommt - ergaebe am Gateway `unbekannter_fehler`, obwohl der Eintrag in der Schlange
 * steht und der naechste Anstoss (jedes Einreihen, jeder Abschluss) ihn ohnehin aufnimmt.
 */
function stosseAn(): void {
  try {
    starteNaechsten()
  } catch (ursache) {
    protokolliere('starteNaechsten (#59) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/** Dieselbe vorlaeufige Loesung wie in `entferne` (#62) und im Q4-Journal (#57). */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[auftrags-manager] wiederhole: ${stelle}:`, ursache)
}

/**
 * Die Fehlerseite der Huelle (TK 9.1.1 Punkt 2).
 *
 * Nur die beiden Codes, die diese Datei selbst vergibt. `unbekannter_fehler` steht nicht dabei:
 * Ihn erzeugt das Gateway (#23) aus einer unerwarteten Ausnahme, hier wird er nicht
 * vorweggenommen. Erfunden wird kein Code - der Satz ist geschlossen (TK 9.1.1 Punkt 3).
 */
function fehler(code: 'ungueltige_eingabe' | 'nicht_gefunden', meldung: string): Ergebnis<void> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. DIE FUNKTIONSLISTE DES ISSUES IST UNVOLLSTAENDIG: `findeQ1` (#54) fehlt darin, wird fuer
//    die im selben Issue VERBINDLICH verlangte Idempotenz ("steht der Auftrag bereits als
//    anstehend in Q1, endet der Ablauf nach Schritt 1") aber gebraucht. Mit den fuenf genannten
//    Funktionen allein ist die Bedingung nicht formulierbar: `fuegeAnsEndeAn` liefert in beiden
//    Faellen eine Zahl und verschweigt, ob es angehaengt hat. Gebaut ist deshalb der Aufruf mit
//    der aus #54 uebernommenen Signatur `findeQ1(auftragId: string): Q1Eintrag | undefined`;
//    eine Signatur wurde dabei nicht geaendert.
//
// 2. EIGENE FESTLEGUNG - Q1-Eintrag mit TERMINALEM Status. Das Issue regelt den zweiten Aufruf
//    fuer `anstehend` und `laeuft`; ein Eintrag mit `erfolg`/`fehlgeschlagen`/`abgebrochen` ist
//    im Abschlussweg (#70) fuer einen Augenblick gleichzeitig in Q1 und Q2 sichtbar. Dieser
//    Fall wird wie die beiden anderen behandelt (ohne Wirkung, `{ ok: true }`). Die Alternative
//    - trotzdem einreihen - haette keinen Q1-Eintrag mehr erzeugt (#54 lehnt die vorhandene
//    Kennung ab) und nur eine unwahre Q4-Bewegung hinterlassen. Der Q2-Eintrag bleibt in beiden
//    Faellen erhalten, ein erneuter Klick wirkt.
//
// 3. KEIN pruefeUebergang (#58), obwohl `fehlgeschlagen -> anstehend` in dessen Tabelle als
//    Uebergang dieses Issues gefuehrt wird. Der verbindliche Ablauf im Issue nennt die Pruefung
//    nicht, und die Fehlerpfad-Tabelle hat fuer eine Ablehnung keinen Code. Sie waere hier auch
//    folgenlos: Der Status der Kopie wird gesetzt, nicht an einem lebenden Eintrag geaendert -
//    abzulehnen gaebe es also nichts, was jemand beobachten koennte.
//
// 4. KEIN AUFRUFER UND KEIN KANALNAME. `wiederhole` wird heute nirgends importiert (geprueft
//    mit grep ueber `src/`: ausserhalb dieser Datei nur Erwaehnungen in Kommentaren). Die
//    Verdrahtung auf den Warteschlangen-Kanal ist #71 (`ipc-verdrahtung.ts`), die Gegenstelle
//    im Renderer ist `queue-panel/wiederholen.ts`. Der Kanalname selbst kommt in dieser Datei
//    bewusst NICHT vor - weder als Literal noch im Kommentar (DoD-Grep-Probe).
//
// 5. NICHT GEPRUEFT: das Zusammenspiel mit dem Abschlussweg (#70) und dem Einreihen (#61, im
//    Bau). Dass der Q2-Eintrag nach Erfolg tatsaechlich verschwindet, kann hier weder geprueft
//    noch erzwungen werden - diese Datei ruft #70 nicht und kennt es nicht.
