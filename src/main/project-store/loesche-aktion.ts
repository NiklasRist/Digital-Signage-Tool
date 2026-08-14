// GENERIERT aus dem Signaturblock von Issue #40.
// [project-store] löscheAktion mit chirurgischer Kaskade implementieren
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
// GERUEST-PRUEFSUMME: c33ddc2ddb4f3a49
//
// [ERLEDIGT: Zeile 1 (eslint-disable no-unused-vars) ist mit diesem Rumpf entfernt -
//  alle Parameter und Importe werden benutzt.]

import { holeAktivesProjekt } from './aktives-projekt'          // #192
import { planeAutoSpeicherung } from './auto-speichern'         // #47
import { mitD1Lock } from './d1-lock'                           // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // der kritische Abschnitt "darf selbst nicht erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr)".
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren) - KEINE Kopie; kein Projekt offen -> null.
//         // SYNCHRON, NIMMT KEIN LOCK, WIRFT NIE.
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // 3-5s-Entprellungstimer. SYNCHRON, KEIN Rueckgabewert, kann nicht fehlschlagen,
//         // nimmt das Lock NICHT. Setzt seit dem 12.08.2026 ZUSAETZLICH Project.geaendertAm -
//         // "DER EINE ORT, an dem geaendertAm fortgeschrieben wird"; diese Datei fasst das
//         // Feld deshalb NICHT an.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Bearbeitungsstand } from '../../shared/contracts/project'

/**
 * Der Rueckgabetyp EINMAL benannt, damit er an der Signatur, am Rueckruf und an den
 * Fehlerhelfern unten woertlich derselbe ist. Ausgeschrieben werden muss er an jeder
 * dieser Stellen: Ohne Zieltyp weitet TypeScript `ok: false` in einem Objektliteral zu
 * `boolean`, und die Ergebnis-Huelle waere nicht mehr diskriminierbar.
 *
 * Er ist WORTGLEICH zum Signaturblock des Issues - nur benannt, nicht veraendert.
 */
type LoeschAktionErgebnis = Ergebnis<{
  stand: Bearbeitungsstand
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}>

export async function löscheAktion(id: string): Promise<LoeschAktionErgebnis> {
  // DAS LOCK NIMMT DIESE FUNKTION SELBST. Sie darf NICHT noch einmal in mitD1Lock
  // eingewickelt werden - der innere Aufruf wartete auf den aeusseren, der auf ihn wartet
  // (#32, "Deadlock-Gefahr").
  //
  // ALLES liegt im Lock, auch die Existenzpruefung. Das ist hier nicht Vorsicht, sondern
  // der Kern der Zusage aus dem Issue: "beides in EINEM Durchlauf unter demselben
  // mitD1Lock, damit kein Zwischenzustand mit verwaisten Referenzen [...] von aussen
  // sichtbar wird". Wer die Kaskade und das Streichen des Datensatzes in zwei Abschnitte
  // legte, liesse dazwischen ein schreibeProjekt (#46) zu - und in der geschriebenen
  // project.json stuenden Listenelemente, die auf eine geloeschte Aktion zeigen.
  return mitD1Lock(async (): Promise<LoeschAktionErgebnis> => {
    const projekt = holeAktivesProjekt()

    // KEIN OFFENES PROJEKT -> `nicht_gefunden`, kein eigener Code.
    //
    // Die Signatur ist einparametrig (`Ergebnis<{...}>`), sie traegt also AUSSCHLIESSLICH
    // die drei generischen Codes (ergebnis.ts). Der seit dem 13.08.2026 entschiedene Code
    // `kein_projekt` gehoert zu `ProjectStoreFehlercode` (assets.ts, #72) und passt hier
    // NICHT hinein - ihn zu verwenden hiesse, den zweiten Typparameter nachzutragen, und
    // das waere eine Aenderung an der verbindlichen Signatur. Fachlich stimmt die Auskunft
    // trotzdem: Ohne offenes Projekt gibt es keine Aktions-Bibliothek, in der diese `id`
    // stehen koennte. Dieselbe Wahl wie in #38, #39 und #42. GEMELDET, s. Bericht/STOPP.
    if (projekt === null) {
      return nichtGefunden('Es ist kein Projekt geoeffnet; es wurde nichts geloescht.')
    }

    // KEINE EIGENE PRUEFUNG DER `id`. Ueber die Prozessgrenze kann ein `unknown` als
    // `string` getarnt hereinkommen (TK 9.1.1 Punkt 6) - hier ist das gefahrlos: Jede
    // Verwendung von `id` unten ist ein reiner Gleichheitstest. Er wirft bei keinem Wert
    // und trifft bei keinem Unsinnswert; ein leerer String, `null` oder ein Objekt landen
    // also auf demselben Weg bei `nicht_gefunden`, ohne einen zweiten Fehlercode.
    if (!projekt.aktionen.some((aktion) => aktion.id === id)) {
      // Die Kennung steht ABSICHTLICH nicht in der Meldung - sie reist bis in die
      // Oberflaeche, und eine UUID hilft dort niemandem (gleiche Linie wie #37/#39/#45).
      return nichtGefunden('Zu dieser Kennung gibt es keine Aktion in der Bibliothek.')
    }

    // =====================================================================
    // AB HIER WIRKT ES. Beide Pruefungen liegen davor, deshalb ist "keine Wirkung" auf
    // jedem Fehlerpfad strukturell wahr statt nachgerechnet - es gibt keinen Rueckweg,
    // der zurueckdrehen muesste.
    //
    // SCHRITT 1: DIE KASCADE. Erst danach faellt der Aktions-Datensatz selbst (Schritt 2,
    // so festgelegt in der "Architektur-Entscheidung dieses Issues").
    //
    // DIE ZWEI REFERENZARTEN WERDEN VERSCHIEDEN BEHANDELT - das ist der ganze Inhalt
    // dieses Issues (TK 9.5.3):
    //   Fall 1  Listenelement mit `art: "segment"`, dessen `ref` die Aktion ist -> "das
    //           Element IST diese Aktion und wird entfernt".
    //   Fall 2  `einblendung.abschnitte[].aktionRef` in einem Video-Element -> "die Aktion
    //           ist nur EIN Abschnitt eines rotierenden Bandes. Hier werden ausschliesslich
    //           die betroffenen Abschnitte entfernt; das Videoelement bleibt erhalten."
    //
    // WARUM DAS NICHT ZUSAMMENFALLEN DARF: "Wuerde Fall 2 wie Fall 1 behandelt, verloere
    // der Nutzer sein Video aus der Wiedergabeliste, nur weil eine von mehreren rotierenden
    // Werbeaktionen geloescht wurde." (TK 9.5.3) Die naheliegendste Fassung dieser Funktion
    // - "entferne alle Elemente, die auf diese Aktion zeigen" - ist genau die falsche.
    // =====================================================================
    const entfernteElementIds: string[] = []
    const geaenderteElementIds: string[] = []
    // Die Indizes der Fall-1-Elemente, gesammelt in Listenreihenfolge und erst DANACH
    // rueckwaerts herausgeschnitten. Waehrend eines Vorwaertslaufs zu splicen verschoebe
    // die noch nicht besuchten Elemente unter dem Zaehler weg - der Nachbar jedes
    // getroffenen Elements bliebe ungeprueft, und sein Band behielte einen Abschnitt, der
    // auf die geloeschte Aktion zeigt.
    const zuEntfernen: number[] = []

    projekt.liste.forEach((element, index) => {
      // FALL 1 ZUERST, UND MIT `continue`-Wirkung: Ein Element, das ohnehin ganz
      // verschwindet, braucht keine Band-Behandlung mehr - und es gehoert in GENAU EINE
      // der beiden Kennungslisten. Stuende dieselbe Kennung in beiden, koennte die
      // Oberflaeche dem Nutzer nicht sagen, was mit dem Element geschehen ist.
      //
      // GEPRUEFT WIRD `art === 'segment'` UND `ref`, nicht `ref` allein. `ref` traegt je
      // nach `art` eine Asset-ID ODER eine Aktions-ID (TK 9.11.3); ein Vergleich ohne die
      // Art-Pruefung mischte beide Namensraeume. Dass sich zwei UUIDs heute nicht treffen,
      // ist eine Eigenschaft der Belegung, kein Vertrag.
      if (element.art === 'segment' && element.ref === id) {
        entfernteElementIds.push(element.id)
        zuEntfernen.push(index)
        return
      }

      const einblendung = element.einblendung
      if (einblendung === null) {
        return
      }

      // BEHANDELT WIRD JEDE vorhandene Einblendung, ohne `art === 'video'` davorzusetzen.
      // Der Vertrag sagt zwar "nur video" (project.ts), aber das ist eine Zusage AN diese
      // Funktion, keine, die sie erzwingen kann: Kommt aus einer beschaedigten project.json
      // ein Bild-Element mit Band herein, bliebe bei einer Art-Pruefung ein `aktionRef` auf
      // eine geloeschte Aktion stehen - genau der verwaiste Verweis, den die
      // Architektur-Entscheidung dieses Issues ausschliesst. Die Behandlung ist dieselbe,
      // also ist es KEINE erfundene Regel fuer einen dritten Referenztyp.
      const verbleibende = einblendung.abschnitte.filter(
        (abschnitt) => abschnitt.aktionRef !== id,
      )
      if (verbleibende.length === einblendung.abschnitte.length) {
        // Kein Abschnitt betroffen. Das Element wird NICHT gemeldet - `geaenderteElementIds`
        // benennt die Stellen, die die Oberflaeche hervorheben soll ("aus dem Werbeband von
        // 3 Videos gekuerzt", TK 9.5.3); ein unveraendertes Video darunter waere eine
        // falsche Auskunft.
        return
      }

      geaenderteElementIds.push(element.id)

      if (verbleibende.length === 0) {
        // "Randfall: Wird ein Band durch das Entfernen leer (keine Abschnitte mehr),
        // entfaellt die Einblendung ganz (`einblendung = null`) - das Videoelement bleibt."
        // (TK 9.5.3)
        //
        // WARUM NICHT EINFACH EIN LEERES `abschnitte`-ARRAY: Eine Einblendung ohne
        // Abschnitte ist kein Band, sondern ein Band-Rest. Der Render muesste fuer sie
        // trotzdem die Bandflaeche freihalten (TK 9.2/9.9: die Split-Geometrie haengt an
        // der Bandhoehe), und im Video erschiene ein leerer Streifen, den niemand bestellt
        // hat. `null` heisst "kein Band" und ist der Zustand, den jedes Video ohne
        // Einblendung ohnehin traegt.
        element.einblendung = null
      } else {
        // NUR DAS `abschnitte`-ARRAY WIRD ERSETZT. `bandVorlageId` bleibt unangetastet -
        // sie zeigt auf eine app-weite Vorlage, die dieses Modul nicht besitzt, und das
        // Band laeuft mit den verbliebenen Abschnitten unveraendert weiter. Die
        // Reihenfolge der Ueberlebenden bleibt die des `filter`, also die urspruengliche;
        // die Rotationsfolge aendert sich nur um den gestrichenen Eintrag.
        einblendung.abschnitte = verbleibende
      }
    })

    // RUECKWAERTS, damit jeder Index noch der ist, unter dem er gefunden wurde.
    //
    // `splice` und NICHT `delete projekt.liste[i]`: Letzteres liesse ein `undefined`-Loch
    // stehen, und die Reihenfolge IST die Array-Reihenfolge - "es gibt kein separates
    // `position`-Feld" (TK 9.11.3).
    //
    // Und NICHT `projekt.liste = projekt.liste.filter(...)`: Das Feld muss dieselbe
    // Objektreferenz behalten. #192 gibt das Projekt als LEBENDEN Stand heraus; wer die
    // Liste durch ein neues Array ersetzt, entwertet jede main-interne Referenz darauf -
    // und der zurueckgegebene `stand.liste` waere dann nicht mehr nachweisbar dasselbe
    // Array wie das des gespeicherten Projekts.
    for (let i = zuEntfernen.length - 1; i >= 0; i -= 1) {
      const index = zuEntfernen[i]
      if (index === undefined) {
        continue
      }
      projekt.liste.splice(index, 1)
    }

    // =====================================================================
    // SCHRITT 2: DER AKTIONS-DATENSATZ SELBST.
    //
    // "danach wird die Aktion aus `Project.aktionen` entfernt" (Architektur-Entscheidung
    // des Issues). Erst jetzt, weil zwischen Schritt 1 und 2 kein anderer Abschnitt laufen
    // kann - beide liegen unter demselben Lock.
    //
    // ENTFERNT WERDEN ALLE EINTRAEGE MIT DIESER KENNUNG, nicht nur der erste. Das ist
    // bewusst ANDERS als in #42, wo bei doppelter Kennung genau EIN Listenelement faellt:
    // Dort zeigt der Nutzer auf EINE Zeile der Wiedergabeliste. Hier nennt die DoD die
    // Kennung ("ist nach Erfolg nicht mehr in `Project.aktionen` enthalten"), und die
    // Kaskade hat soeben JEDE Referenz auf diese Kennung aufgeloest - ein zurueckbleibender
    // Zwilling waere eine Aktion, auf die per Vertrag nichts mehr zeigen darf und die
    // trotzdem in der Bibliothek steht. Doppelte IDs koennen ohnehin nur aus einer
    // beschaedigten project.json stammen (UUIDs, TK 9.11.4).
    // =====================================================================
    for (let i = projekt.aktionen.length - 1; i >= 0; i -= 1) {
      if (projekt.aktionen[i]?.id === id) {
        projekt.aktionen.splice(i, 1)
      }
    }

    // ENTPRELLT, NICHT SOFORT. löscheAktion ist eine Instant-Operation (TK 9.5.4:
    // "Instant-Operationen (Millisekunden)"), kein Auftrag - nur Auftraege schreiben am
    // Ende sofort (sofortFlush, #47).
    //
    // Uebergeben wird das LEBENDE Projekt (#192 gibt "dieselbe Objektreferenz" heraus, die
    // hier gerade mutiert wurde). Eine Kopie hielte den Stand von JETZT fest und verloere
    // alles, was der Nutzer in den folgenden Sekunden noch tut.
    //
    // NOCH INNERHALB DES LOCKS: Der Aufruf ist synchron und nimmt selbst kein Lock (#47),
    // es entsteht also keine Schachtelung. Ausserhalb waere er falsch - zwischen dem
    // Verlassen des Locks und dem Vormerken koennte ein Projektwechsel (#34) oder ein
    // Loeschen (#37) liegen, und die Aenderung stuende in keinem Termin mehr.
    planeAutoSpeicherung(projekt)

    // DER `stand` WIRD HIER GEBILDET - nach beiden Schritten und noch INNERHALB des Locks.
    // "Er ist damit derselbe Stand, der gespeichert wird, und kein Zwischenstand."
    //
    // GENAU ZWEI SCHLUESSEL, und zwar die LEBENDEN Arrays selbst: `stand.aktionen` und
    // `stand.liste` sind "genau die beiden Felder des gespeicherten Projekts nach der
    // Aenderung - nicht neu sortiert, nicht gefiltert, nicht kopiert-und-veraendert"
    // (Issue). Deshalb steht hier ein Objektliteral mit zwei Feldern und kein Spread ueber
    // das Projekt: Ein `{ ...projekt }` truege `id`, `assets`, `schemaVersion` und
    // `letzterAusgabeName` mit - "der `stand` ist deshalb KEIN `Project`" (TK 9.5.2). Fuer
    // den Renderer ist ohnehin alles eine Kopie (IPC serialisiert); ein main-interner
    // Aufrufer bekaeme mit einer Kopie dagegen einen Stand, der sich vom gespeicherten
    // fortentwickeln kann.
    //
    // `Project.assets` wird NICHT angefasst: "Die von der Aktion verwendeten Medien-Assets
    // bleiben unangetastet und projektweit verfuegbar - eine Aktion referenziert ein Asset
    // nur, sie besitzt es nicht." (TK 9.5.3) Das gilt auch fuer ein Bild, das NUR diese
    // eine Aktion benutzt hat: Ob eine Datei verwaist ist, entscheidet der media-service
    // (TK 9.4.6/9.4.7) auf eigenen Auftrag, nicht diese Funktion nebenbei.
    return {
      ok: true,
      wert: {
        stand: { aktionen: projekt.aktionen, liste: projekt.liste },
        entfernteElementIds,
        geaenderteElementIds,
      },
    }
  })
}
// Ausgang bei Erfolg: der vollstaendige neue `stand` (Bibliothek OHNE die geloeschte Aktion,
// Wiedergabeliste nach der Kaskade) plus BEIDE Kennungslisten - auch wenn eine davon leer ist.
// Auf der Platte steht das Ergebnis erst nach der entprellten Auto-Speicherung (#47).
// Ausgang bei Fehler: `nicht_gefunden`, ohne jede Wirkung auf D1 - und OHNE `stand`, weil die
// Ergebnis-Huelle im Nein-Zweig gar keinen Wert traegt (ergebnis.ts).

/**
 * Die eine Fehlerantwort dieser Datei - an EINER Stelle, damit Code und Wortlaut nicht
 * auseinanderlaufen. Die Fehlerpfad-Tabelle des Issues ist als "(vollstaendig)" ueberschrieben
 * und kennt genau diese eine Zeile.
 */
function nichtGefunden(meldung: string): LoeschAktionErgebnis {
  return { ok: false, fehler: { code: 'nicht_gefunden', meldung } }
}

// ---------------------------------------------------------------------------
// NICHT HIER, UND GEMELDET:
//
// 1. KEIN DRITTER REFERENZTYP. Gesucht wurde nach weiteren Stellen, an denen eine Aktions-ID
//    stehen kann: `Listenelement.ref` (nur bei `art: "segment"`) und
//    `Einblendung.abschnitte[].aktionRef` sind die einzigen im geteilten Vertrag
//    (project.ts, #15). `Aktion.bildRef` zeigt auf ein Asset, `Aktion.vorlagenId` auf eine
//    app-weite Vorlage - beide zeigen VON der Aktion weg, nicht auf sie. Damit deckt sich der
//    gebaute Typ mit dem Vollstaendigkeitsanspruch von TK 9.5.3; es war nichts zu melden.
//
// 2. KEIN AUFRAEUMEN VON ASSETS UND KEINE DATEIOPERATION. Weder `Project.assets` noch die
//    Dateien in D2 werden angefasst (Begruendung oben am `stand`).
//
// 3. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt vor jeder Instant-Operation einen
//    Schnappschuss; gebaut wird er NICHT hier, sondern in der Huelle um die gemeinsame
//    Projekt-Sicht (#243, M7) - dort passiert JEDE Aenderung genau eine Stelle. Der `stand`
//    dieser Rueckgabe ist das, was jene Huelle weiterschaltet ("Er ist es, der die Sicht auf
//    das Projekt weiterschaltet und damit den Undo-Schnappschuss ausloest", TK 9.5.3).
//
// 4. KEINE VORSCHAU, KEINE RUECKFRAGE. Was das Loeschen bewirken WIRD, rechnet der
//    action-editor vorab aus (`berechneLoeschVorschau`, #142) - im Renderer, aus derselben
//    Liste. Diese Funktion fragt nicht nach; sie fuehrt aus.
//
// 5. KEIN IPC-KANAL, KEINE ANMELDUNG. Der Kanal `project:löscheAktion` wird an anderer Stelle
//    angemeldet (#76); diese Datei kennt ihn nicht.
//
// 6. KEIN EREIGNIS AN DEN RENDERER. Es gibt bewusst kein `project:geaendert` (Entscheidung E1
//    aus dem M5-Prueflauf): Der Aufrufer kennt den neuen Stand, weil er ihn zurueckbekommt -
//    genau dafuer traegt die Rueckgabe den `stand`.
