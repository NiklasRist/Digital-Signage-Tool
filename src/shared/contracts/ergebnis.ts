// Die Ergebnis-Huelle (#12) - der Rueckgabetyp JEDER Instant-Operation ueber die
// Renderer-Main-Grenze (TK 9.1.1 Punkt 2).
//
// WARUM NIE EXCEPTIONS UEBER DIE GRENZE: Renderer und Main sind getrennte Prozesse;
// alles dazwischen wird serialisiert. Wirft der Main `new Error(...)` mit einem
// eigenen Feld `code`, kommt beim Renderer NICHT dieser Fehler an, sondern eine
// verpackte Meldung der Art
//
//   Error: Error invoking remote method 'media:importMedium': Error: Datei nicht gefunden
//
// Fehlerklasse und eigene Felder wie `code` sind dann verloren - uebrig ist Text. Der
// Aufrufer muesste Meldungstexte vergleichen, was bei jeder Umformulierung, jeder
// Tippfehler-Korrektur und jeder Uebersetzung bricht.
//
// Bei uns haengt an den Codes ECHTES VERHALTEN: `asset_referenziert` zeigt die
// betroffenen Listenelemente, `vorlage_referenziert` beide Trefferlisten,
// `datei_zu_gross_fat32` erklaert exFAT, `kein_platz` und `ziel_gesperrt` brauchen
// verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus (FA-19),
// Wiederholen (FA-17) und der FAT32-Hinweis alle zu "irgendwas ist schiefgelaufen".

/**
 * Die generischen Fehlercodes - gueltig fuer jede Operation.
 *
 * Fachliche Codes (TK 9.4.9, 9.6.4, 9.12.1) werden hier ABSICHTLICH NICHT ergaenzt.
 * Sie entstehen dort, wo der Code vergeben wird, und wandern ueber den zweiten
 * Typparameter herein, den #22 (M1) ergaenzt. Wer sie hier einsammelte, machte diese
 * Datei zu einer zweiten Quelle der Wahrheit - und jedes Modul muesste beim Anlegen
 * eines neuen Codes eine fremde, geteilte Datei anfassen.
 */
export type Fehlercode =
  | "ungueltige_eingabe"
  | "nicht_gefunden"
  | "unbekannter_fehler";

/**
 * Ergebnis einer Instant-Operation.
 *
 * Diskriminiert ueber `ok`: Nach `if (ergebnis.ok)` verengt TypeScript im
 * Ja-Zweig auf `{ wert: T }` und im Nein-Zweig auf `{ fehler: ... }`. Damit ist das
 * Vergessen der Fehlerbehandlung strukturell unmoeglich - ein Zugriff auf `.wert`
 * ohne vorherige Pruefung kompiliert nicht.
 *
 * Zu `daten`: Manche Fehler sind erst mit ihren Nutzdaten bedienbar
 * (`asset_referenziert` muss die betroffenen Listenelemente nennen). Das Feld ist
 * OPTIONAL, seine Form ist je Fehlercode festgelegt und typisiert - dokumentiert
 * dort, wo der Code vergeben wird. Es ist kein Freitext-Anhang und kein Ersatz fuer
 * `meldung`.
 *
 * Warum hier `unknown` und nicht der im TK genannte Platzhalter `Fehlerdaten`: Ein
 * Typ dieses Namens gehoert nicht in diese Datei, denn die Form der Nutzdaten wird je
 * Fehlercode in M1 bis M6 festgelegt, nicht in M0. `unknown` haelt den Anhang offen,
 * ohne ihn zu erfinden - und zwingt einen Aufrufer, der die Nutzdaten benutzen will,
 * sie erst auf die fuer seinen Code dokumentierte Form einzugrenzen. Ein unbesehener
 * Zugriff kompiliert nicht; mit `any` wuerde er es.
 *
 * NICHT MEHR LANGE EINPARAMETRIG: #22 (M1) erweitert diesen Typ um einen zweiten,
 * optionalen Typparameter fuer die fachliche Fehlercode-Union
 * (`Ergebnis<T, F extends string = GenerischerFehlercode>`). Bestehende Verwendungen
 * als `Ergebnis<T>` bleiben davon unberuehrt, weil der Parameter einen Vorgabewert
 * bekommt.
 */
export type Ergebnis<T> =
  | { ok: true; wert: T }
  | {
      ok: false;
      fehler: { code: Fehlercode; meldung: string; daten?: unknown };
    };

/**
 * Kurzform fuer Operationen, die nichts zu melden haben: Das gelungene `ok` IST die
 * Information.
 *
 * VERBOTEN sind Ersatzformen wie `Ergebnis<boolean>`, `Ergebnis<null>` oder ein
 * blankes `true`. Grund: Sonst gaebe es ZWEI Wege zu sagen "hat funktioniert"
 * (`ok: true` und `wert: true`), und ein Aufrufer prueft irgendwann den falschen -
 * ein Fehlschlag mit `wert: false` ginge dann als Erfolg durch.
 */
export type ErgebnisVoid = Ergebnis<void>;
