// GENERIERT aus dem Signaturblock von Issue #42.
// [project-store] entferneElement implementieren
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
// GERUEST-PRUEFSUMME: 8e4a8bbf4fa57d6e

import { holeAktivesProjekt } from './aktives-projekt'          // #192
import { planeAutoSpeicherung } from './auto-speichern'         // #47
import { mitD1Lock } from './d1-lock'                           // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // "darf selbst nicht erneut mitD1Lock aufrufen (Deadlock-Gefahr)".
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren) - KEINE Kopie; kein Projekt offen -> null.
//         // SYNCHRON, NIMMT KEIN LOCK, WIRFT NIE.
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // 3-5s-Entprellungstimer; KEIN Rueckgabewert, kann nicht fehlschlagen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
export async function entferneElement(
  elementId: string,
): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // DAS LOCK NIMMT DIESE FUNKTION SELBST. Sie darf NICHT noch einmal in mitD1Lock
  // eingewickelt werden - der innere Aufruf wartete auf den aeusseren, der auf ihn wartet
  // (#32, "Deadlock-Gefahr").
  //
  // Warum ueberhaupt ein Lock fuer eine reine Speicheroperation: Der kritische Abschnitt ist
  // "suchen, dann streichen". Ohne Serialisierung koennten zwei Aufrufe zwischen findIndex
  // und splice ineinandergreifen, und der zweite entfernte den Nachbarn statt des gemeinten
  // Elements - `splice` arbeitet auf einem Index, der dann nicht mehr gilt. Ausserdem laeuft
  // JEDE D1-Mutation durch dieses eine Lock (TK 9.5.1); eine Ausnahme "das hier ist ja nur
  // Speicher" waere der Anfang eines zweiten Regelwerks.
  //
  // Der Rueckgabetyp des Abschnitts steht ausgeschrieben da, statt sich ableiten zu lassen:
  // Ohne ihn wuerde `ok: false` in einem Objektliteral zu `boolean` verbreitert, und die
  // Ergebnis-Huelle waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()

    // KEIN OFFENES PROJEKT -> `nicht_gefunden`, kein eigener Code.
    //
    // Das ist eine Abwaegung, keine Bequemlichkeit: Die Fehlerpfad-Tabelle des Issues ist
    // ausdruecklich als "(vollstaendig)" ueberschrieben und kennt genau einen Code, und die
    // Signatur `Ergebnis<void>` traegt ausser den drei generischen Codes ohnehin keinen
    // weiteren. Fachlich stimmt die Auskunft: Ohne offenes Projekt gibt es keine
    // `Project.liste`, in der diese `elementId` stehen koennte - die Wirkung ist dieselbe
    // ("keine Wirkung"), und der Aufrufer behandelt beide Faelle gleich (Element weg bzw.
    // nie da). Ein eigener Code waere hier eine Vertragsaenderung. S. Bericht/STOPP.
    if (projekt === null) {
      // NACHGEZOGEN am 14.08.2026 (Entscheidung des Users): eigener Code statt
      // `nicht_gefunden`. Die Begruendung darueber - "die Signatur traegt keinen weiteren
      // Code" - war der Grund, nicht die Rechtfertigung; die Signatur traegt jetzt den
      // zweiten Typparameter. "Kein Projekt offen" und "dieses Element gibt es nicht"
      // verlangen vom Nutzer Verschiedenes, und der Reparatur-Modus (FA-19) muss beides
      // unterscheiden koennen.
      return {
        ok: false,
        fehler: {
          code: 'kein_projekt',
          meldung: 'Es ist kein Projekt geoeffnet; es wurde nichts entfernt.',
        },
      }
    }

    // KEINE EIGENE PRUEFUNG DER `elementId`. Ueber die Prozessgrenze kann ein `unknown` als
    // `string` getarnt hereinkommen (TK 9.1.1) - hier ist das gefahrlos: Der Vergleich unten
    // ist ein reiner Gleichheitstest, er wirft bei keinem Wert und trifft bei keinem
    // Unsinnswert. Ein leerer String, `null` oder ein Objekt landen also auf demselben Weg
    // bei `nicht_gefunden`, ohne dass ein zweiter Fehlercode noetig waere.
    const index = projekt.liste.findIndex((element) => element.id === elementId)
    if (index === -1) {
      return nichtGefunden(elementId)
    }

    // GENAU EIN EINTRAG, NICHT ALLE MIT DIESER ID.
    //
    // IDs sind UUIDs (TK 9.11.4) und damit eindeutig; der Fall kann nur durch eine
    // beschaedigte project.json entstehen. Dann ist "eins entfernen" die richtige Antwort:
    // Der Nutzer hat auf EINE Zeile gezeigt. Ein `filter` ueber die ganze Liste loeschte
    // ohne Rueckfrage eine zweite Zeile mit - genau die Klasse von Zusatzwirkung, gegen die
    // dieses Issue geschrieben ist. Der verbliebene Zwilling laesst sich danach mit einem
    // zweiten Aufruf ebenso entfernen.
    //
    // `splice` und NICHT `delete projekt.liste[index]`: Letzteres liesse ein
    // `undefined`-Loch stehen, und die Reihenfolge IST die Array-Reihenfolge - "es gibt kein
    // separates `position`-Feld" (TK 9.11.3). Alles hinter dem Loch verschoebe sich nicht,
    // dafuer stolperte jeder Leser darueber. Die uebrigen Elemente ruecken auf und behalten
    // ihre relative Reihenfolge; nachzufuehren ist nichts, weil es nichts nachzufuehren gibt.
    projekt.liste.splice(index, 1)

    // NICHTS WEITER WIRD ANGEFASST - das ist der eigentliche Inhalt dieses Issues:
    //
    // 1. `Project.assets` und `Project.aktionen` bleiben unveraendert. "Die von der Aktion
    //    verwendeten Medien-Assets bleiben unangetastet und projektweit verfuegbar - eine
    //    Aktion referenziert ein Asset nur, sie besitzt es nicht." (TK 9.5.3) Dasselbe gilt
    //    hier: Mehrere Listenelemente duerfen dieselbe Aktion referenzieren (TK 9.7.2), und
    //    der Reparatur-Modus (TK 9.7.5) benutzt genau diese Operation als Fix-Option - wer
    //    dabei die Bibliothek mit ausduennte, naehme dem Nutzer beim Reparieren EINES
    //    Elements Inhalte weg, die anderswo noch gebraucht werden.
    // 2. KEINE DATEI wird geloescht. Das Medium liegt weiter in D2; zustaendig dafuer ist
    //    ausschliesslich der media-service (TK 9.4.6), und der loescht nur auf eigenen
    //    Auftrag.
    // 3. Die `einblendung` des entfernten Elements verschwindet MIT ihm - sie ist ein Feld
    //    AUF dem Listenelement (TK 9.11.3), kein eigener Speicher. Aufzuraeumen bleibt
    //    nichts: Ihre `abschnitte` verweisen ueber `aktionRef` auf `Project.aktionen`, die
    //    stehen bleiben (Punkt 1), und `bandVorlageId` zeigt auf eine app-weite Vorlage,
    //    die dieses Modul ohnehin nicht besitzt. Umgekehrt kann keine fremde Einblendung
    //    ins Leere zeigen: Einblendungen referenzieren Aktionen, niemals Listenelemente.
    // 4. KEIN Nachfuehren von Positionen, Zaehlern oder einer Gesamtdauer. Es gibt kein
    //    solches Feld, und wer eines einfuehrte, baute die zweite Quelle der Wahrheit neben
    //    der Array-Reihenfolge.

    // ENTSCHIEDEN (und im Bericht gemeldet): `geaendertAm` wird HIER gesetzt, bei der
    // Mutation im Speicher - nicht erst beim Schreiben.
    //
    // Der STOPP-Block des Issues verbietet, das frei zu waehlen. Frei ist es inzwischen auch
    // nicht mehr: `schreibeProjekt` (#46) ist gebaut und laesst das Feld ausdruecklich in
    // Ruhe ("ALLES ANDERE BLEIBT UNANGETASTET - insbesondere `geaendertAm` [...] ein hier
    // gesetzter Zeitstempel waere eine zweite, unsichtbare Quelle fuer ein fachliches
    // Feld"). Damit gibt es nur noch zwei Moeglichkeiten: hier setzen - oder nie. "Nie"
    // hiesse, dass `listeProjekte` (TK 9.5.2) dauerhaft das Erstelldatum anzeigt und jedes
    // Projekt fuer immer "unberuehrt" aussieht.
    //
    // Der Zeitstempel steht damit fuer "zuletzt GEAENDERT", nicht "zuletzt gespeichert" -
    // das ist die Lesart, die zum Namen und zur Anzeige passt. Nebenwirkung, die bewusst in
    // Kauf genommen wird: Nach einem gescheiterten Auto-Speichern traegt der Speicherstand
    // ein neueres Datum als die Platte. Das ist richtig so - die Aenderung hat
    // stattgefunden, "die Aenderungen bleiben im Speicher (kein Rollback)" (TK 9.5.4).
    // Der Zeitstempel wird NICHT hier gesetzt, sondern in planeAutoSpeicherung (#47) -
    // dem einen Engpass, durch den jede Aenderung laeuft (vereinheitlicht 12.08.2026).
    // Vorher tat es diese Datei als einzige der Welle; die Geschwister #43/#44/#45
    // liessen es bewusst, und zwei verschiedene Antworten auf dieselbe Frage sind
    // schlechter als jede der beiden.

    // ENTPRELLT, NICHT SOFORT. entferneElement ist eine Instant-Operation (TK 9.5.4:
    // "Instant-Operationen (Millisekunden)"), kein Auftrag - nur Auftraege schreiben am Ende
    // sofort (sofortFlush, TK 9.5.4 Faelle 1-4). Beim Umsortieren einer Liste faellt eine
    // Aenderung pro Handgriff an; jede einzeln zu schreiben waere genau das, wogegen die
    // Entprellung existiert.
    //
    // Uebergeben wird das LEBENDE Projekt (#192 gibt "dieselbe Objektreferenz" heraus, die
    // hier gerade mutiert wurde). Eine Kopie hielte den Stand von JETZT fest und verloere
    // alles, was der Nutzer in den folgenden Sekunden noch tut.
    //
    // Gemeldet wird der Erfolg SOFORT und nicht erst nach dem Schreiben: Ein Ergebnis, das
    // 4 Sekunden auf sich warten liesse, waere keine Instant-Operation mehr. Ob das
    // Schreiben gelingt, meldet der eigene Kanal `project:autoSpeichernStatus` (#47).
    planeAutoSpeicherung(projekt)

    return { ok: true, wert: undefined }
  })
}
// Ausgang bei Erfolg: Ergebnis<void> mit ok: true; das Element ist aus Project.liste entfernt,
// die Reihenfolge der verbleibenden Elemente bleibt unveraendert (Array-Verschiebung, kein Loch).
// Ausgang bei Fehler: nicht_gefunden (keine Wirkung auf Project.liste).

/**
 * Die eine Fehlerantwort dieser Datei - an EINER Stelle, damit Code und Wortlaut nicht
 * auseinanderlaufen.
 *
 * Die `elementId` steht im Text, weil der Reparatur-Modus (TK 9.7.5) Elemente einzeln und
 * nacheinander behandelt: Ohne die Kennung waere aus der Meldung nicht zu erkennen, WELCHES
 * der X von N Elemente gemeint war. `String(...)` statt der Einbettung ueber die Vorlage,
 * weil der Wert ueber die Prozessgrenze auch etwas anderes als ein String sein kann.
 */
function nichtGefunden(elementId: unknown): Ergebnis<void, ProjectStoreFehlercode> {
  return {
    ok: false,
    fehler: {
      code: 'nicht_gefunden',
      meldung: `Es gibt kein Listenelement mit der Kennung ${String(elementId)}.`,
    },
  }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE UNTERGRENZE FUER `Project.liste`. Das letzte Element darf entfernt werden, die
//    Liste darf leer sein. Der STOPP-Block des Issues stellt die Frage ausdruecklich; frei
//    zu waehlen ist sie hier nicht: Die als "(vollstaendig)" bezeichnete Fehlerpfad-Tabelle
//    kennt keinen Code fuer "das war das letzte", und `Ergebnis<void>` traegt nur die drei
//    generischen. Ein Blockieren muesste also entweder einen Code erfinden (Vertrags-
//    aenderung) oder mit `nicht_gefunden` luegen. Hinzu kommt: Eine leere Liste entsteht
//    ohnehin bei jedem neuen Projekt (#33 legt `liste: []` an) - eine Untergrenze, die das
//    Entfernen verbietet, aber das Anlegen zulaesst, waere keine Invariante, sondern eine
//    Stolperstelle. Wo der leere Render abgefangen wird, gehoert entschieden - Kandidat ist
//    der Render-Auftrag (TK 9.2), nicht diese Datei. S. Bericht/STOPP.
//
// 2. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt vor jeder Instant-Operation einen
//    Schnappschuss; gebaut wird er NICHT hier, sondern in der Huelle um die gemeinsame
//    Projekt-Sicht (#243, M7) - dort passiert JEDE Aenderung genau eine Stelle, statt dass
//    dreissig Operationen es jede fuer sich tun. Diese Datei nimmt keinen und loescht keinen.
//
// 3. KEIN IPC-KANAL, KEINE ANMELDUNG. Der Kanal `project:entferneElement` wird an anderer
//    Stelle angemeldet (Verdrahtung im ipc-gateway); diese Datei kennt ihn nicht.
//
// 4. KEIN EREIGNIS AN DEN RENDERER. Es gibt bewusst kein `project:geaendert` (Entscheidung
//    E1 aus dem M5-Prueflauf): Der Aufrufer im Renderer kennt den neuen Stand, weil er die
//    Aenderung ausgeloest hat.
