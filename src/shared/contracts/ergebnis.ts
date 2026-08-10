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
export type GenerischerFehlercode =
  | "ungueltige_eingabe"
  | "nicht_gefunden"
  | "unbekannter_fehler";

/**
 * Frueherer Name derselben Union (#12). Bleibt als Alias bestehen, weil bereits
 * Signaturen darauf verweisen.
 *
 * Warum ein Alias und keine zweite Aufzaehlung: Zwei Stellen mit denselben drei
 * Literalen laufen irgendwann auseinander - jemand ergaenzt einen Code an einer von
 * beiden, und ab dann bedeutet `Fehlercode` etwas anderes als `GenerischerFehlercode`,
 * ohne dass irgendetwas bricht. Ein Alias kann das nicht.
 *
 * Der Name `GenerischerFehlercode` ist der tragende: Ihn verlangen die Signaturen aus
 * M1 bis M7, und er sagt deutlicher, was gemeint ist - die generischen Codes im
 * Gegensatz zu den fachlichen der einzelnen Module.
 */
export type Fehlercode = GenerischerFehlercode;

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
 * ZUM ZWEITEN TYPPARAMETER `F` (#22): Ueber ihn haengt jedes Fachmodul seine EIGENE
 * Fehlercode-Union ein - `Ergebnis<Asset, MediaFehlercode>`. Die drei generischen
 * Codes kommen dabei IMMER hinzu (`F | GenerischerFehlercode`), ohne dass ein Modul
 * sie erneut aufzaehlen muss.
 *
 * Warum die fachlichen Unionen NICHT hier stehen: Sie werden dort deklariert, wo der
 * Code entsteht (media-service, vorlagen-store, export-service). Saemmelte diese Datei
 * sie ein, muesste der geteilte Vertrag die Main-Module kennen - contracts/ zeigte
 * dann auf Main-Code, und jedes neue Fehlercode-Issue muesste eine fremde, von allen
 * genutzte Datei anfassen.
 *
 * Warum `F` und nicht "jedes Modul schreibt seine Vollunion selbst": Nur so bleibt der
 * Code am Aufrufer typisiert sichtbar, ohne dass irgendwer generisch + fachlich von
 * Hand gepflegt zusammenhaelt. Ein spaeterer Umbau auf Vollunionen traefe M3, M4 und
 * M6 gleichzeitig.
 *
 * Der Vorgabewert haelt `Ergebnis<T>` einparametrig gueltig - jede Signatur aus #12
 * kompiliert unveraendert weiter.
 */
export type Ergebnis<T, F extends string = GenerischerFehlercode> =
  | { ok: true; wert: T }
  | {
      ok: false;
      fehler: {
        code: F | GenerischerFehlercode;
        meldung: string;
        daten?: unknown;
      };
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
