// GENERIERT aus dem Signaturblock von Issue #45.
// [project-store] setzeDauer implementieren
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
// GERUEST-PRUEFSUMME: 3bc02c38b669fc8b
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
// [ERLEDIGT: Zeile 1 ist mit diesem Rumpf entfernt - alle Parameter und Importe
//  werden benutzt.]

import { DAUER_BEREICH } from '../../shared/contracts/konstanten'   // #21
import { holeAktivesProjekt } from './aktives-projekt'              // #192
import { planeAutoSpeicherung } from './auto-speichern'             // #47
import { mitD1Lock } from './d1-lock'                               // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #21:  DAUER_BEREICH: { readonly min: number; readonly max: number }
//         // die EINE Stelle, an der die Grenzen stehen (TK 9.11.4: "Konstanten in
//         // contracts/types (an *einer* Stelle, nicht verstreut)").
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // die Aktion darf selbst NICHT erneut mitD1Lock aufrufen (Deadlock-Gefahr).
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer; SYNCHRON, nimmt KEIN Lock, kann nicht fehlschlagen.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Listenelement } from '../../shared/contracts/project'
export async function setzeDauer(
  elementId: string,
  dauer: number,   // Sekunden
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // FUER AUFRUFER: Das Lock wird hier SELBST genommen - dieselbe Linie wie #33, #34, #37, #72.
  // Diese Funktion darf NICHT noch einmal in mitD1Lock eingewickelt werden; der innere Aufruf
  // wartete auf den aeusseren, der auf ihn wartet (#32, "Deadlock-Gefahr").
  //
  // WARUM UEBERHAUPT EIN LOCK, OBWOHL HIER NUR EIN FELD IM SPEICHER GESETZT WIRD: Der kritische
  // Abschnitt ist nicht die Zuweisung, sondern das Paar aus Suchen und Aendern zusammen mit dem
  // Vormerken. Ohne das Lock koennte zwischen dem Finden des Elements und der Zuweisung ein
  // laufendes schreibeProjekt (#46) genau dieses Projekt serialisieren - die geschriebene
  // project.json truege dann einen Stand, den es im Speicher nie gab. TK 9.5.1 verlangt
  // ausdruecklich das eine D1-Lock, "durch das ALLE project.json-Mutationen laufen".
  //
  // Die Rueckgabeangabe am Rueckruf ist nicht Zierde: Ohne sie hat `return { ok: true, ... }`
  // keinen Zieltyp, `ok` weitete sich zu `boolean`, und die unterschiedene Union `Ergebnis`
  // waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // Die Fehlerpfad-Tabelle des Issues kennt fuer diesen Fall keine eigene Zeile - sie fragt
      // nur, ob `elementId` "in Project.liste" existiert. Ohne offenes Projekt gibt es diese
      // Liste nicht, also kann das Element darin auch nicht existieren: `nicht_gefunden`.
      // BEWUSST NICHT `unbekannter_fehler`: Das ist kein Defekt, sondern ein normaler Zustand
      // (Anwendung frisch gestartet, Projekt gerade geloescht), und ein "unbekannter Fehler"
      // liesse die Oberflaeche einen Absturz melden, wo nichts kaputt ist. Die Meldung
      // unterscheidet die beiden Faelle trotzdem, damit eine Fehlersuche sie auseinanderhaelt.
      return fehler('kein_projekt', 'Es ist kein Projekt geoeffnet; es wurde nichts geaendert.')
    }

    // Reihenfolge der Pruefungen = Reihenfolge der Fehlerpfad-Tabelle: erst Existenz, dann Art,
    // dann Wert. Sie ist hier folgenlos (keine Pruefung hat eine Wirkung), aber sie bestimmt,
    // WELCHEN Fehler der Nutzer bei mehreren Maengeln sieht - und "das Element gibt es nicht" ist
    // die Auskunft, die weiterhilft, wenn zusaetzlich die Dauer daneben liegt.
    const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined) {
      // Die Kennung steht ABSICHTLICH nicht in der Meldung - sie reist bis in die Oberflaeche
      // (gleiche Linie wie #37/#49), und eine UUID hilft dort niemandem.
      return fehler('nicht_gefunden', 'Zu dieser Kennung gibt es kein Element in der Wiedergabeliste.')
    }

    if (element.art === 'video') {
      // "ein Video-Element hat KEIN setzbares dauer-Feld; ein Aufruf auf ein solches Element ist
      // ein Fehler dieser Funktion, kein Sonderfall im Datenmodell" (Issue, Invarianten). Die
      // Dauer eines Videos ergibt sich ausschliesslich aus dem Trim - setzeTrim (#44) ist dafuer
      // zustaendig, und ein hier gesetztes `dauer` waere ein zweiter, widerspruechlicher
      // Laengen-Wert, den der render-service (TK 9.2.6) gar nicht auswertet.
      return fehler(
        'ungueltige_eingabe',
        'Die Dauer eines Video-Elements ergibt sich aus seinem Trim und laesst sich nicht direkt setzen.',
      )
    }

    if (!istDarstellbareDauer(dauer)) {
      return fehler(
        'ungueltige_eingabe',
        `Die Anzeigedauer muss zwischen ${DAUER_BEREICH.min} und ${DAUER_BEREICH.max} Sekunden liegen.`,
      )
    }

    // AB HIER WIRKT ES. Alle Pruefungen liegen davor, deshalb ist "keine Wirkung" auf jedem
    // Fehlerpfad nicht zugesichert, sondern strukturell wahr - es gibt keinen Rueckweg, der
    // zurueckdrehen muesste.
    //
    // Mutiert wird das LEBENDE Element (holeAktivesProjekt gibt "dieselbe Objektreferenz" heraus,
    // #192). Genau darauf beruht das Auto-Speichern: `planeAutoSpeicherung` merkt sich dieselbe
    // Referenz, und der Timer schreibt deshalb beim Ablaufen den NEUESTEN Stand.
    element.dauer = dauer

    // `trimStart`, `trimEnde` und `einblendung` werden NICHT angefasst. Das Issue sagt, sie
    // "bleiben null" - bleiben, nicht "werden gesetzt". Fuer ein segment-Element sind sie
    // nach der Belegungstabelle (TK 9.11.3) ohnehin null; stuende dort etwas, waere das ein
    // Defekt der Stelle, die es geschrieben hat, und ihn hier still wegzuraeumen loeschte den
    // einzigen Beleg dafuer. Diese Funktion setzt die Dauer, sie repariert keine Fremdfelder.

    // Vormerken NOCH INNERHALB des Locks: Der Aufruf ist synchron und nimmt selbst kein Lock
    // (#47), es entsteht also keine Schachtelung. Ausserhalb waere er falsch - zwischen dem
    // Verlassen des Locks und dem Vormerken koennte ein Projektwechsel (#34) oder ein Loeschen
    // (#37) liegen, und die Aenderung stuende in keinem Termin mehr.
    planeAutoSpeicherung(projekt)

    // Zurueck geht die LEBENDE Referenz, keine Kopie - dieselbe Entscheidung wie in #34 ("eine
    // Kopie waere die zweite Wahrheit, die #192 ausschliesst"). Ueber die IPC-Grenze wird ohnehin
    // serialisiert, der Renderer bekommt also einen Wert; main-intern bleibt es der eine Stand.
    return { ok: true, wert: element }
  })
}
// - laeuft VOLLSTAENDIG innerhalb von mitD1Lock (#32); das Lock wird hier SELBST genommen
// - validiert den Bereich ueber DAUER_BEREICH (#21), nie ueber Zahlenliterale (TK 9.11.4)
// - Video-Elemente werden abgewiesen (TK 9.11.3, Anforderungsdokument 4.4)
// - auf jedem Fehlerpfad bleibt Project.liste unveraendert

// ---------------------------------------------------------------------------
// Intern. Nicht exportiert: Wer diese Pruefung braucht, braucht in Wahrheit setzeDauer - eine
// zweite Stelle, die entscheidet, welche Dauer gueltig ist, liefe beim naechsten Zusatz
// auseinander.
// ---------------------------------------------------------------------------

/**
 * Ist `dauer` ein Wert, den diese Operation uebernehmen darf?
 *
 * DIE TYPPRUEFUNG IST NICHT UEBERFLUESSIG, obwohl die Signatur `number` sagt: Der Aufruf kommt
 * ueber IPC aus dem Renderer (#75/#76), und was dort ankommt, ist zur Laufzeit ungeprueft. Ein
 * versehentlich als Text uebergebener Reglerwert ("12") bestuende beide Vergleiche unten
 * (Zeichenkette gegen Zahl wird numerisch verglichen) und landete als String im Datenmodell -
 * die project.json enthielte danach `"dauer": "12"`, und erst der render-service fiele darueber.
 *
 * DIE ENDLICHKEITSPRUEFUNG MUSS VOR DEN VERGLEICHEN STEHEN, nicht daneben: Jeder Vergleich mit
 * `NaN` ist falsch, also waeren `NaN < min` UND `NaN > max` beide falsch - `NaN` rutschte durch
 * eine reine Bereichspruefung glatt hindurch und stuende danach als `null` in der JSON-Datei
 * (JSON kennt kein NaN). Das ist genau der "Standbild mit Nulldauer"-Fall, gegen den die
 * Einleitung des Issues argumentiert. `Number.isFinite` schliesst NaN, Infinity und -Infinity in
 * einem Zug aus und ist zugleich die Typpruefung (es liefert fuer Nicht-Zahlen `false`, anders
 * als das globale `isFinite`, das vorher umwandelt).
 *
 * ABGEWIESEN, NICHT BEGRENZT: Ein Wert ausserhalb des Bereichs wird zurueckgewiesen und NICHT
 * stillschweigend auf min/max gezogen. Das Issue verlangt es so ("keine Wirkung" in allen drei
 * Wertzeilen der Fehlerpfad-Tabelle), und es ist auch die richtige Seite des Irrtums: Ein
 * Begrenzen liesse den Aufrufer glauben, sein Wert sei uebernommen worden, und der composer
 * zeigte optimistisch 60 s an, waehrend im Modell die Obergrenze steht - ein Auseinanderlaufen,
 * das erst am fertigen Video auffiele. Ein Fehler dagegen ist sofort sichtbar, und den Regler auf den
 * erlaubten Bereich zu begrenzen ist ohnehin Aufgabe der Oberflaeche (TK 9.7, Anforderungs-
 * dokument 4.4 - "derselbe Regler"), nicht des Speichers.
 *
 * NICHT GERUNDET, UND ZWAR BEWUSST NICHT - s. STOPP-Vermerk am Dateiende.
 */
function istDarstellbareDauer(dauer: number): boolean {
  return Number.isFinite(dauer) && dauer >= DAUER_BEREICH.min && dauer <= DAUER_BEREICH.max
}

/** Die Fehlerseite der Huelle. Beide Codes sind generisch (ergebnis.ts, #12). */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// NICHT HIER, UND GEMELDET:
//
// 1. KEINE RUNDUNG AUF DAS 30-fps-RASTER, UND KEINE ABWEISUNG UNGERASTERTER WERTE. Der
//    STOPP-Block des Issues verbietet ausdruecklich, das hier zu entscheiden. Uebernommen wird
//    deshalb der Wert, wie er hereinkommt - z. B. 12,3333 s. Was das offen laesst: Bei 30 fps
//    (RENDER_PROFILE, #18) ist ein Frame 1/30 s; jede Dauer, die kein ganzes Vielfaches davon
//    ist, kann der Render nicht exakt darstellen und muss selbst runden. Die 30-Minuten-Warnung
//    (TK 9.7.4) rechnet dagegen mit der frame-gerundeten Summe ALLER Elementdauern - laufen die
//    beiden Rundungen auseinander, weicht die angezeigte Gesamtdauer von der Datei ab. Die
//    Entscheidung ist eine von dreien und gehoert an EINE Stelle: (a) hier auf ganze Sekunden,
//    (b) hier auf das Frame-Raster wie beim Video-Trim (TK 9.2.6 nennt dort ausdruecklich
//    round(... x 30)), (c) gar nicht hier, dann muss der render-service runden UND die
//    Gesamtdauer-Anzeige dieselbe Rundung benutzen. Gebaut ist heute (c) - aber nur, weil das
//    die einzige Variante ist, die nichts festlegt, nicht weil sie gewaehlt waere.
//
// 2. KEIN SETZEN VON `Project.geaendertAm`. Ebenfalls STOPP-Block ("nicht selbst festlegen").
//    ACHTUNG, das ist heute eine echte Luecke und nicht nur eine offene Frage: `schreibeProjekt`
//    (#46) setzt den Zeitstempel ausdruecklich NICHT ("ALLES ANDERE BLEIBT UNANGETASTET -
//    insbesondere geaendertAm"), und ausser `erstelleProjekt` (#33) schreibt ihn im gesamten
//    gebauten Bestand niemand. Solange das so bleibt, steht in jeder project.json der
//    Erstellzeitpunkt, und `listeProjekte` (#35) sortiert die Projektliste nach "zuletzt
//    bearbeitet" anhand eines Wertes, der sich nie aendert. Wo der Zeitstempel gesetzt wird -
//    in jeder Instant-Operation oder einmal in schreibeProjekt - ist zu entscheiden; hier wurde
//    es nicht.
//
// 3. KEINE ABSTIMMUNG MIT DER GESAMTDAUER-WARNUNG. Diese Funktion prueft nur die EINZELdauer.
//    Ob die Summe aller Elemente die 30-Minuten-Grenze (Anforderungsdokument 5.3) sprengt, ist
//    Sache der Oberflaeche (TK 9.7.4); der Speicher kennt die Grenze nicht und weist deshalb
//    auch nichts deswegen ab. Das ist so gewollt - eine Warnung ist keine Sperre.
//
// 4. KEIN UNDO-SCHNAPPSCHUSS. TK 9.13.2 verlangt einen Schnappschuss vor jeder
//    Instant-Operation; gebaut wird er in der Huelle um die gemeinsame Projekt-Sicht (M7-50,
//    #243), nicht in den dreissig aufrufenden Operationen. Hier steht deshalb bewusst nichts.
//
// 5. KEINE ANMELDUNG EINES IPC-KANALS. Der Weg vom Renderer hierher entsteht in
//    verdrahteProjectStoreIPC (#75, heute noch ein werfender Rumpf in
//    src/main/ipc-gateway/project-store-verdrahtung.ts); auch `kanaele.ts` (#20) kennt bisher
//    keinen Eintrag fuer diese Operation. Ohne beides ist die Funktion fertig, aber vom
//    composer aus unerreichbar - dieselbe Lueckenklasse, die das Projekt seit M1 wiederholt an
//    den Nahtstellen gefunden hat.
