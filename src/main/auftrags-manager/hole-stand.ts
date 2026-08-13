// GENERIERT aus dem Signaturblock von Issue #64.
// [auftrags-manager] holeStand implementieren
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
// GERUEST-PRUEFSUMME: 88792c8a68031707

import { alleQ1 } from './q1-warteschlange'
import { holeQ2Stand } from './q2-wiederholung'

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #54: alleQ1(): Auftrag[]
//        Neues Array mit denselben Auftrag-REFERENZEN, bereits in der Panel-Reihenfolge:
//        der laufende zuerst, danach die anstehenden in FIFO-, also Einfuegereihenfolge,
//        zuletzt die nur kurzzeitig vorhandenen terminalen Eintraege (zwischen
//        Statuswechsel und Entfernen in #70).
//   #55: holeQ2Stand(): { projektId: string; datei: Q2Datei } | null
//        Der zuletzt geladene Q2-Stand aus dem Arbeitsspeicher, OHNE Dateizugriff;
//        null, solange in dieser Sitzung noch kein Projekt geladen wurde. Herausgegeben
//        wird bereits eine flache Kopie der beiden Listen.
//
// WARUM laufender() (#54) HIER NICHT AUFGERUFEN WIRD, obwohl das Issue es als verfuegbar
// nennt: `alleQ1()` stellt den laufenden Auftrag SELBST an die erste Stelle - das ist
// keine Zufaelligkeit der Einfuegereihenfolge, sondern in #54 ausdruecklich so gebaut und
// dort begruendet. Wer ihn hier zusaetzlich ueber `laufender()` holte und vorne
// anhaengte, haette ihn ZWEIMAL in der Liste: einmal aus `laufender()`, einmal aus
// `alleQ1()`. Die geforderte Reihenfolge entsteht also aus `alleQ1()` allein.

/**
 * Momentaufnahme der Warteschlange fuer die Oberflaeche (TK 9.3.4, FA-16).
 *
 * ZUSAMMENGEFUEHRT AUS ZWEI SPEICHERN, weil keiner allein die Frage beantwortet, die
 * FA-16 stellt: Q1 ist fluechtig und haelt nur Laufendes und Anstehendes, die
 * Fehlschlaege liegen in Q2 (TK 9.3, Speichertabelle). Nur Q1 hiesse: Fehlschlaege sind
 * im Panel unsichtbar, und FA-17 (Wiederholen) haette keine Schaltflaeche, auf die der
 * Nutzer klicken koennte.
 *
 * REINE LESE-OPERATION: kein Statuswechsel, kein Journaleintrag, kein Ereignis, kein
 * Aufraeumen alter Q2-Eintraege. Das Panel ruft diese Funktion potenziell oft auf; jede
 * Nebenwirkung waere damit an einen harmlosen Klick gekoppelt.
 *
 * KEINE DATEI-I/O: Q2 kommt ausschliesslich aus dem beim Projektoeffnen (#67) geladenen
 * Stand ueber `holeQ2Stand()` (#55) - deshalb gibt es in dieser Datei keinen fs-Import
 * und keinen Aufruf von #69.
 *
 * KEINE OBERGRENZE: Es wandern ALLE Fehlschlaege des gehaltenen Standes in die Liste -
 * kein `slice`, kein Altersfilter. Eine Kappung schnitte genau die Information ab, die
 * FA-16 "jederzeit" verlangt, und machte gekappte Auftraege fuer FA-17 unerreichbar.
 *
 * ZURUECK GEHEN DIESELBEN `Auftrag`-OBJEKTE, keine Kopien: Der Fortschritt eines
 * laufenden Renders wird am lebenden Auftrag fortgeschrieben (#54), eine Kopie waere im
 * Panel eine Momentaufnahme von gestern. Der interne Q1-Datensatz mit `begonnenAm`
 * bleibt dagegen im Modul - nach aussen wandert ausschliesslich `Auftrag[]` (#16).
 */
export async function holeStand(): Promise<Ergebnis<Auftrag[]>> {
  try {
    // Q1 ZUERST - und unveraendert uebernommen. Die Reihenfolge der Anstehenden ist die
    // Reihenfolge, in der tatsaechlich ausgefuehrt wird ("Determinismus durch sichtbare
    // Reihenfolge", TK 9.3.5); sie hier nach `erstelltAm` oder sonst etwas neu zu
    // sortieren, zeigte dem Nutzer eine andere Abfolge als die, die eintritt.
    const ausQ1 = alleQ1()

    // Die IDs aus Q1 sind der Deduplizierungs-Schluessel. Ein gerade wiederholter
    // Auftrag liegt in BEIDEN Speichern: in Q1 mit seinem aktuellen Status
    // ('anstehend'/'laeuft'), in Q2 noch als letzter Fehlschlag, denn der Q2-Eintrag
    // bleibt bis zum Erfolg absichtlich bestehen (#63). Ohne diese Pruefung erschiene er
    // doppelt und mit widersprechendem Status. Q1 gewinnt, weil Q1 die Gegenwart haelt.
    const inQ1 = new Set(ausQ1.map((auftrag) => auftrag.auftragId))

    // `holeQ2Stand()` ist null, solange in dieser Sitzung kein Projekt geladen wurde.
    //
    // VORLAEUFIG BEHANDELT WIE "keine Fehlschlaege" - kein Fehlercode. Das ist die
    // enthaltsame Variante, KEINE Entscheidung der offenen STOPP-Frage des Issues
    // ("Verhalten ohne geoeffnetes Projekt", einheitlich mit #38 zu beantworten): Ein
    // Fehler haette hier einen Code gebraucht, den niemand vergeben hat, und
    // Fehlercodes werden nicht erfunden (TK 9.1.1 Punkt 3). Faellt die Entscheidung
    // anders aus, ist sie genau an dieser Stelle nachzuziehen.
    const q2 = holeQ2Stand()

    // `datei.pendingDeletions` bleiben ausdruecklich draussen: Das sind vorgemerkte
    // Loeschungen von Mediendateien, keine Auftraege (TK v2.4) - sie haben weder
    // `auftragId` noch `status` und gehoeren nicht in die Auftragsliste des Panels.
    const fehlschlaege = (q2?.datei.auftraege ?? [])
      .filter((auftrag) => !inQ1.has(auftrag.auftragId))
      // `filter` hat bereits ein neues Array erzeugt; das `sort` trifft also weder den
      // gehaltenen Q2-Stand noch Q1.
      .sort(juengsterZuerst)

    return { ok: true, wert: [...ausQ1, ...fehlschlaege] }
  } catch (ursache) {
    // Weder `alleQ1()` noch `holeQ2Stand()` haben einen Fehlerpfad - dieser Zweig ist
    // die Zusage, dass ueber die IPC-Grenze NIE eine Ausnahme geht (TK 9.1.1). Ohne ihn
    // haette das Panel bei einem unerwarteten Fehler statt einer Meldung eine verpackte
    // Node-Fehlermeldung ohne Code.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Der Stand der Warteschlange konnte nicht ermittelt werden: ${text(ursache)}`,
      },
    }
  }
}

/**
 * Die Sortierung der Fehlschlaege: `erstelltAm` absteigend (juengster zuerst), bei
 * Gleichstand `auftragId` lexikografisch aufsteigend.
 *
 * WARUM DIE ZWEITE STUFE UEBERHAUPT: Zwei Auftraege derselben Millisekunde sind keine
 * Seltenheit. Ohne Nachrangkriterium haengt ihre Reihenfolge davon ab, wie `sort` den
 * Gleichstand gerade aufloest - das Panel spraenge zwischen zwei aufeinanderfolgenden
 * Aufrufen um, ohne dass sich irgendetwas geaendert haette.
 *
 * WARUM STRING-VERGLEICH UND KEIN `Date.parse`: `erstelltAm` ist ein ISO-8601-Zeitstempel
 * in UTC; bei gleichem Format ist der lexikografische Vergleich chronologisch. Er ist
 * ausserdem TOTAL - ein unerwartet unbrauchbarer Wert ergibt eine feste, wenn auch
 * fachlich beliebige Position, waehrend `Date.parse` dort NaN liefert und der Vergleich
 * unstetig wuerde (`sort` darf dann irgendetwas tun, auch bei den GUELTIGEN Eintraegen).
 * NICHT `localeCompare`: dessen Ergebnis haengt von der Gebietsschema-Einstellung ab, die
 * Panel-Reihenfolge duerfte aber nicht von der Sprache des Rechners abhaengen.
 */
function juengsterZuerst(a: Auftrag, b: Auftrag): number {
  if (a.erstelltAm !== b.erstelltAm) {
    return a.erstelltAm < b.erstelltAm ? 1 : -1
  }
  if (a.auftragId !== b.auftragId) {
    return a.auftragId < b.auftragId ? -1 : 1
  }
  return 0
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
