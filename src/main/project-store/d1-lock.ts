// GENERIERT aus dem Signaturblock von Issue #32.
// [project-store] D1-Schreib-Lock-Primitive bauen
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
// GERUEST-PRUEFSUMME: 8e711a88672bd973
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

// ---------------------------------------------------------------------------
// Der Zustand der Sperre: EINE Variable, modulweit.
//
// `ende` ist immer das Freigabe-Versprechen des ZULETZT eingereihten Abschnitts -
// also das Ende der Schlange. Wer neu dazukommt, merkt sich dieses Versprechen als
// seinen Vorgaenger, haengt sein eigenes Ende an und wartet dann auf den Vorgaenger.
// Daraus ergibt sich die Warteschlange, ohne dass ein Array gefuehrt werden muss:
// Die Kette IST die Schlange, jeder Wartende haelt genau einen Verweis, und nach dem
// Ablaufen bleibt nur das letzte Versprechen uebrig.
//
// WARUM KEIN ARRAY VON WARTENDEN: Ein Array muesste beim Freigeben durchsucht,
// verschoben und bei Fehlern aufgeraeumt werden - drei Stellen, an denen ein Eintrag
// liegenbleiben und die Sperre fuer immer blockieren kann. Die Kette hat diesen
// Zustand nicht: Es gibt nichts zu entfernen.
//
// WARUM KEIN BOOLEAN "gesperrt" MIT POLLING: Ein `while (gesperrt) await warte(10)`
// waere weder FIFO (wer zuerst wartet, kommt nicht zuerst dran) noch sofort - jeder
// Schreibvorgang zahlte bis zu 10 ms Verzoegerung, und genau diese Operationen sind
// laut TK 7 "Instant-Operationen (Millisekunden)".
//
// `Promise<unknown>` und nicht `Promise<void>`: Hier wird nur GEWARTET, nie ein Wert
// gelesen. `unknown` sagt das aus und verhindert, dass jemand spaeter versehentlich
// einen Rueckgabewert durch die Kette zu reichen versucht.
let ende: Promise<unknown> = Promise.resolve();

export async function mitD1Lock<T>(aktion: () => Promise<T>): Promise<T> {
  // Die naechsten drei Zeilen laufen SYNCHRON - eine async-Funktion arbeitet ihren
  // Rumpf bis zum ersten `await` ohne Unterbrechung ab. Genau darauf beruht die
  // FIFO-Zusage: Die Reihenfolge, in der `ende` weitergeschaltet wird, ist die
  // Reihenfolge der AUFRUFE. Wuerde vor dieser Stelle irgendetwas awaitet, koennten
  // sich zwei Aufrufer ueberholen und die Schlange waere nur noch ungefaehr sortiert.
  const vorgaenger = ende;

  // Zum `!` in der naechsten Zeile: Das ist eine ZUWEISUNGS-Zusicherung an der
  // Deklaration, nicht die verbotene Fluchttuer `wert!` an einem Ausdruck (die Regel
  // @typescript-eslint/no-non-null-assertion trifft nur letztere). Und sie ist wahr,
  // nicht behauptet: Der Ausfuehrer eines Promise laeuft laut Sprachnorm SOFORT und
  // SYNCHRON, `freigeben` ist also zugewiesen, bevor die naechste Zeile beginnt.
  // TypeScript kann das nur nicht nachvollziehen, weil die Zuweisung in einem
  // Rueckruf steht.
  //
  // Die Alternative waere eine Leerbelegung `= () => {}`. Die waere SCHLECHTER: Bliebe
  // die echte Zuweisung je aus, gaebe eine Leerbelegung die Sperre nie frei - lautlos
  // und fuer immer. Die Zusicherung liesse an derselben Stelle sofort einen Fehler
  // sehen.
  let freigeben!: () => void;
  ende = new Promise<void>((aufloesen) => {
    freigeben = aufloesen;
  });

  // Auf den Vorgaenger warten. Sein Versprechen wird ausschliesslich im `finally`
  // unten aufgeloest und NIE abgewiesen - deshalb braucht dieses `await` kein
  // catch, und ein Fehler in einem fremden kritischen Abschnitt reisst weder diesen
  // Aufruf mit noch hinterlaesst er eine unbehandelte Abweisung im Prozess.
  //
  // Ist die Sperre frei, ist `vorgaenger` bereits aufgeloest; das `await` kostet dann
  // einen Microtask, keine echte Wartezeit.
  await vorgaenger;

  try {
    // `return await` und nicht `return`: Ohne das `await` gaebe die Funktion das
    // Versprechen von `aktion()` heraus und verliesse den try-Block SOFORT - das
    // `finally` liefe, waehrend der kritische Abschnitt noch arbeitet, und die Sperre
    // waere wirkungslos. Das ist die klassische Falle an dieser Stelle: Der Code
    // sieht richtig aus, die Serialisierung ist aber weg, und auffallen wuerde es erst
    // als sporadisch zerschossene project.json.
    return await aktion();
  } finally {
    // Freigabe im `finally`: Wirft `aktion()` - synchron oder als abgewiesenes
    // Versprechen -, laeuft diese Zeile trotzdem. Andernfalls bliebe die Sperre nach
    // dem ersten Fehler fuer die gesamte Laufzeit der App gehalten, und jeder weitere
    // Schreibvorgang wartete stumm fuer immer.
    //
    // Der Fehler selbst wird hier NICHT angefasst; er verlaesst die Funktion
    // unveraendert (so verlangt es der Vertrag: "propagiert der Fehler unveraendert").
    // Deshalb steht hier kein catch und kein eigener Fehlertyp.
    freigeben();
  }
}
// führt aktion() garantiert seriell aus: ruft ein zweiter Aufrufer mitD1Lock() auf, während
// der erste noch läuft, wartet er, bis der erste fertig ist (FIFO-Warteschlange innerhalb
// des Prozesses, KEINE Datei-/OS-Sperre)

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT
//
// 1. KEINE REENTRANZ, UND KEINE ERKENNUNG DAVON. Ruft `aktion()` selbst wieder
//    mitD1Lock() auf, wartet der innere Aufruf auf den aeusseren, der aber erst
//    fertig wird, wenn der innere fertig ist: Deadlock. Das ist kein Versehen,
//    sondern der Vertrag - das Issue nennt es unter "Grenzen/Validierung"
//    ("darf selbst nicht erneut mitD1Lock aufrufen (Deadlock-Gefahr)"), und die
//    aufrufenden Module sind entsprechend geschnitten: fuegeAssetHinzu (#72) haelt
//    ausdruecklich fest, dass es das Lock SELBST nimmt und der `media-service` es
//    nicht ein zweites Mal einwickeln darf.
//    Eine Erkennung (AsyncLocalStorage, die den geschachtelten Aufruf mit einem
//    Fehler abweist) waere technisch moeglich, ist aber NICHT gebaut: Der Abschnitt
//    "Fehlerpfade (vollstaendig)" des Issues sagt "Entfaellt (die Sperre selbst
//    schlaegt nicht fehl)". Eine Erkennung fuehrte genau den Fehlerpfad ein, den der
//    Vertrag ausschliesst, und jeder Aufrufer muesste ihn ab sofort behandeln.
//    GEMELDET, nicht entschieden: Wenn das Projekt eine Deadlock-Diagnose will,
//    gehoert sie in ein eigenes Issue - nicht in diesen Rumpf.
//
// 2. KEINE ZEITGRENZE. Ein Wartender wartet, solange der Halter arbeitet. Ein
//    Zeitlimit klaenge nach Sicherheit, waere aber das Gegenteil: Nach Ablauf muesste
//    es entweder abbrechen (dann faellt ein Schreibvorgang aus, obwohl nichts kaputt
//    ist - die Platte war nur langsam) oder die Sperre brechen (dann laufen zwei
//    Abschnitte gleichzeitig, und das ist der Datenverlust, gegen den diese Datei
//    existiert). Auch das ist ein Fehlerpfad, den der Vertrag nicht kennt.
//
// 3. KEINE SPERRE JE PROJEKT. Die Signatur nimmt keine `projektId` entgegen, also ist
//    die Sperre global - und das ist richtig so: Das TK spricht durchgehend vom
//    "einen D1-Schreib-Lock", "durch das ALLE project.json-Mutationen laufen (auch
//    die von media-service delegierten)" (TK 9.5.1). Es ist ohnehin immer nur EIN
//    Projekt aktiv; eine Aufteilung je Projekt braechte keinen Durchsatz, waere aber
//    ein zweiter Sperr-Mechanismus im Sinne von TK 9.4.8 Punkt 9.
//
// 4. KEINE DATEI- ODER OS-SPERRE. Rein prozessintern, wie TK 9.5.4 es verlangt.
//    Dass daneben keine zweite App-Instanz laeuft, sichert NICHT diese Datei, sondern
//    die Einzel-Instanz-Sperre (#51) - TK 9.5.4 nennt sie ausdruecklich als
//    "Voraussetzung fuer das ganze Lock-Design".
//
// 5. KEINE ZURUECKSETZ- ODER STATUSFUNKTION. Ein exportiertes `istGesperrt()` oder
//    `setzeZurueck()` waere ein zweiter Weg, den Zustand zu beeinflussen, und die
//    Signatur des Issues kennt beides nicht. Der Test unten kommt ohne aus.
