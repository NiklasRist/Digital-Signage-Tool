// GENERIERT aus dem Signaturblock von Issue #62.
// [auftrags-manager] entferne implementieren
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
// GERUEST-PRUEFSUMME: 1243e54bb270ff87
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
//   #54 (Q1): findeQ1(auftragId: string): Q1Eintrag | undefined
//             entferneAusQ1(auftragId: string): boolean
//             alleQ1(): Auftrag[]
//   #60 (Handler-Registry): kannAbbrechen(art: AuftragArt): boolean
//                           brich(auftrag: Auftrag): boolean
//                             - true, wenn ein Abbrecher registriert war und gerufen wurde;
//                               er bekommt den GANZEN Auftrag und zieht die renderId selbst
//                               aus auftrag.payload (#68). DIESE DATEI KENNT DIE renderId NICHT.
//   #57 (Q4-Journal): haengeJournalEintragAn(eintrag: JournalEintrag)
//                       : Promise<Ergebnis<void, QueueFehlercode>>
//   #65 (Ereignis): sendeQueueGeaendert(): Promise<void>

import type { JournalEintrag } from '../../shared/contracts/protokoll'
import { brich, kannAbbrechen } from './dispatcher'
import { alleQ1, entferneAusQ1, findeQ1 } from './q1-warteschlange'
import { haengeJournalEintragAn } from './q4-journal'
import { sendeQueueGeaendert } from './queue-ereignis'

export async function entferne(auftragId: string): Promise<Ergebnis<void>> {
  if (typeof auftragId !== 'string' || auftragId.length === 0) {
    // Geprueft, obwohl der Parameter typisiert ist: Der Aufruf kommt ueber #71 vom
    // Renderer herein, und die Nutzlast eines IPC-Aufrufs ist zur Laufzeit alles
    // Moegliche. Ohne die Zeile liefe `undefined` bis in `findeQ1` und kaeme dort als
    // `nicht_gefunden` heraus - ein Programmierfehler des Aufrufers saehe dann aus wie
    // ein bereits beendeter Auftrag.
    return fehler('ungueltige_eingabe', 'entferne wurde ohne Auftrags-Kennung aufgerufen.')
  }

  // Q1 gibt den LEBENDEN Eintrag heraus (#54), keine Kopie. Gelesen wird hier
  // ausschliesslich - `status`, `fehler` und `fortschritt` bleiben unberuehrt, auch im
  // Abbruch-Fall (Invariante "der Abbruch setzt hier keinen Status").
  const eintrag = findeQ1(auftragId)
  if (eintrag === undefined) {
    // Beide Faelle der Fehlerpfad-Tabelle laufen hier zusammen: die unbekannte Kennung
    // und die, die nur noch als Q2-Eintrag (`fehlgeschlagen`) existiert. Q2 wird
    // deshalb gar nicht erst befragt - beide Ausgaenge waeren `nicht_gefunden`, und
    // "Verwerfen" ist keine Operation (Invariante).
    return fehler('nicht_gefunden', `Zur Kennung "${auftragId}" gibt es keinen Auftrag in der Warteschlange.`)
  }

  const auftrag = eintrag.auftrag

  // FALL 1 - anstehend: verschwindet sofort und hat nie gelaufen.
  if (auftrag.status === 'anstehend') {
    // VOR dem Entfernen ermittelt: danach hat der Auftrag keinen Platz mehr, und die
    // Q4-Bewegung soll den nennen, den er hatte.
    const position = platzInDerSchlange(auftragId)

    // Der Rueckgabewert wird nicht geprueft: Zwischen `findeQ1` und dieser Zeile liegt
    // kein `await`, der Eintrag kann also nicht unter der Hand verschwunden sein. Eine
    // Fallunterscheidung hier waere ein Zweig, den kein Ablauf erreicht.
    entferneAusQ1(auftragId)

    // KEIN Q3-Eintrag: "Q3 protokolliert nur, was tatsaechlich gelaufen ist." (TK 9.3)
    await schreibeBewegung({
      zeit: new Date().toISOString(),
      auftragId,
      bewegung: 'entfernt',
      position,
    })
    await melde()

    return { ok: true, wert: undefined }
  }

  // FALL 2 - laufender, abbrechbarer Auftrag: Abbruch anstossen, mehr nicht.
  if (auftrag.status === 'laeuft') {
    if (!kannAbbrechen(auftrag.art)) {
      // Der laufende Nicht-Render (ENTSCHIEDEN 03.08.2026). `kannAbbrechen` ist die im
      // Issue benannte Pruefung, und sie steht VOR `brich`, damit der Abbrecher in
      // diesem Fall nachweislich nicht gerufen wird.
      //
      // Gemessen wird damit die Faehigkeit, nicht die Auftragsart: Heute registriert
      // allein der Render-Handler einen Abbrecher (#68), beides faellt also zusammen.
      // Siehe Vermerk am Dateiende.
      return fehler(
        'ungueltige_eingabe',
        `Ein laufender Auftrag der Art "${auftrag.art}" laesst sich nicht abbrechen.`,
      )
    }

    if (!brich(auftrag)) {
      // Nach einem erfolgreichen `kannAbbrechen` unerreichbar - beide lesen dieselbe
      // Ablage, und dazwischen liegt kein `await`. Die Zeile steht trotzdem hier, weil
      // die einzige Alternative waere, `ok` zu melden, ohne dass irgendetwas angestossen
      // wurde: Der Nutzer haette im Panel den Eindruck, den Render gestoppt zu haben,
      // waehrend ffmpeg weiterlaeuft.
      return fehler(
        'ungueltige_eingabe',
        `Der laufende Auftrag der Art "${auftrag.art}" konnte nicht abgebrochen werden.`,
      )
    }

    // SOFORT `ok`, ohne auf das Ende von ffmpeg zu warten - und OHNE Q4-Bewegung, ohne
    // Q3-Eintrag, ohne `starteNaechsten`, ohne Statuswechsel. Das alles macht genau
    // einmal der Abschlussweg (#70), sobald `RenderResult { status: 'abgebrochen' }`
    // eintrifft. Auch das Ereignis `queue:geaendert` kommt von dort: Hier hat sich noch
    // nichts geaendert, was zu melden waere - der Auftrag laeuft in diesem Augenblick
    // weiter.
    return { ok: true, wert: undefined }
  }

  // FALL 3 - `erfolg`, `fehlgeschlagen`, `abgebrochen`: terminal (TK 9.3.3), also
  // nichts mehr zu entfernen. Ein `ok` waere hier die teure Falschauskunft "du hast
  // etwas verhindert", obwohl der Vorgang laengst gelaufen ist.
  return fehler(
    'nicht_gefunden',
    `Der Auftrag "${auftragId}" ist bereits beendet (${auftrag.status}) und kann nicht entfernt werden.`,
  )
}
// anstehend  -> aus Q1 nehmen, Q4-Bewegung `entfernt` (position = Platz VOR dem Entfernen),
//               Ereignis queue:geaendert, { ok: true }
// laeuft + abbrechbar -> brich(auftrag) (#60) und sofort { ok: true }; kein Statuswechsel
// sonst      -> nicht_gefunden bzw. ungueltige_eingabe, ohne jede Wirkung

// -------------------------------------------------------------------------------------------
// Kleinkram
// -------------------------------------------------------------------------------------------

/**
 * Der Platz in der Schlange, 1-basiert - `null`, wenn der Auftrag nicht (mehr) darin steht.
 *
 * Gezaehlt wird auf `alleQ1()` (#54) und nicht auf der internen Einfuegereihenfolge, weil
 * das die Liste IST, die das Panel zeigt: laufender zuerst, dann die anstehenden in
 * FIFO-Reihenfolge. Die Q4-Bewegung soll denselben Platz nennen, den der Nutzer gesehen hat.
 * Solange der laufende Auftrag der aelteste ist - der Normalfall -, sind beide Zaehlungen
 * ohnehin gleich.
 */
function platzInDerSchlange(auftragId: string): number | null {
  const stelle = alleQ1().findIndex((a) => a.auftragId === auftragId)
  return stelle === -1 ? null : stelle + 1
}

/**
 * Q4-Bewegung schreiben - und einen Fehlschlag NICHT zum Fehlschlag der Operation machen.
 *
 * #57 verlangt das ausdruecklich von seinen Aufrufern ("Dass die Aufrufer bei
 * `speicher_fehler` NICHT abbrechen, ist ihre Pflicht"). Q4 ist rein diagnostisch; der
 * Auftrag IST aus Q1 verschwunden, wenn diese Zeile laeuft. Eine Fehlermeldung an dieser
 * Stelle wuerde dem Nutzer sagen, das Entfernen sei misslungen - und er stuende vor einem
 * Panel, in dem der Auftrag trotzdem fehlt.
 *
 * Der `catch` deckt den Vertragsbruch ab: #57 sagt zu, nicht zu werfen. Ohne den Fang
 * verliesse eine Ausnahme diese Funktion NACH der Aenderung an Q1, das Gateway (#23) machte
 * `unbekannter_fehler` daraus, und dieselbe Falschauskunft entstuende auf dem Umweg.
 */
async function schreibeBewegung(eintrag: JournalEintrag): Promise<void> {
  try {
    const geschrieben = await haengeJournalEintragAn(eintrag)
    if (!geschrieben.ok) {
      protokolliere(`Q4-Bewegung "entfernt" nicht geschrieben (${geschrieben.fehler.code})`, geschrieben.fehler.meldung)
    }
  } catch (ursache) {
    protokolliere('haengeJournalEintragAn (#57) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/**
 * Das Ereignis ausloesen - abgewartet, damit die Hoerer den neuen Stand haben, bevor diese
 * Operation antwortet; gefangen aus demselben Grund wie oben. #65 faengt selbst und wirft
 * laut Vertrag nicht, aber eine gescheiterte BENACHRICHTIGUNG darf ein bereits erfolgtes
 * Entfernen nicht nachtraeglich zum Fehler machen.
 */
async function melde(): Promise<void> {
  try {
    await sendeQueueGeaendert()
  } catch (ursache) {
    protokolliere('sendeQueueGeaendert (#65) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/** Dieselbe vorlaeufige Loesung wie im dispatcher (#60) und im Q4-Journal (#57). */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[auftrags-manager] entferne: ${stelle}:`, ursache)
}

/**
 * Die Fehlerseite der Huelle (TK 9.1.1 Punkt 2).
 *
 * Nur die beiden Codes, die diese Datei selbst vergibt. `unbekannter_fehler` steht nicht
 * dabei: Ihn erzeugt das Gateway (#23) aus einer unerwarteten Ausnahme, hier wird er nicht
 * vorweggenommen. Ein neuer Code wird nicht erfunden, und der frueher fuer die Kollision
 * mit einem laufenden Render vorgesehene Code ist entfallen (TK 9.3.6) - er steht deshalb
 * nirgends in dieser Datei, auch nicht als Zwischenwert oder im Kommentar (DoD-Grep-Probe).
 */
function fehler(code: 'ungueltige_eingabe' | 'nicht_gefunden', meldung: string): Ergebnis<void> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. WIDERSPRUCH IM ISSUE, entschaerft: Fall 2 sagt "Auftrag laeuft und ist ein `render`",
//    die Fehlerpfad-Tabelle "laeuft und ist kein `render` (`import`, `loeschen`, `export`)
//    -> ungueltige_eingabe"; der ENTSCHIEDEN-Absatz vom 03.08.2026 nennt dagegen
//    `kannAbbrechen(art)` als "die Pruefung, an der dieser Fall erkannt wird". Gebaut ist
//    die BENANNTE PRUEFUNG, nicht der Vergleich auf `'render'`. Heute fallen beide
//    zusammen, weil allein #68 einen Abbrecher registriert - der DoD-Test stellt genau
//    diesen Fall her (`import` ohne `brichAb`). Sie liefen erst dann auseinander, wenn ein
//    `import`/`export`/`loeschen` einen Abbrecher mitbraechte; dann brichst diese Datei ihn
//    ab, statt `ungueltige_eingabe` zu melden. Das ist die harmlosere Richtung: Ein
//    Abbrecher, den jemand ausdruecklich registriert hat, wird benutzt, statt zu verrotten.
//    Ein Vergleich auf `art === 'render'` daneben waere eine ZWEITE Regel fuer dieselbe
//    Frage - und dieselbe Doppel-Wahrheit, gegen die dieses Issue geschrieben ist.
//    Ueber die Oberflaeche ist der Unterschied ohnehin nicht erreichbar: #209
//    (`queue-panel/entfernen.ts`) bietet `abbrechen` nur bei `laeuft` UND `art: 'render'`
//    an.
//
// 2. KEIN AUFRUFER UND KEIN KANALNAME. `entferne` wird heute nirgends importiert (geprueft
//    mit grep ueber `src/`: ausserhalb dieser Datei nur Erwaehnungen in Kommentaren). Die
//    Verdrahtung auf den Warteschlangen-Kanal ist #71 (`ipc-verdrahtung.ts`), dessen Rumpf
//    noch offen ist; die Gegenstelle im Renderer ist #209. Der Kanalname selbst kommt in
//    dieser Datei bewusst NICHT vor - weder als Literal noch im Kommentar (DoD-Grep-Probe).
//
// 3. NICHT GEPRUEFT: das Zusammenspiel mit dem Abschlussweg #70 (`beende-auftrag.ts`), der
//    parallel entsteht. Diese Datei ruft ihn nicht und kennt ihn nicht - dass der
//    Q3-Eintrag, der Statuswechsel und die Freigabe des naechsten Auftrags dort GENAU
//    EINMAL entstehen, kann hier weder geprueft noch erzwungen werden.
