// Typ-Werkzeug fuer die Vertragstests der contracts-Dateien.
//
// WARUM DIESE DATEI AUSSERHALB VON tests/unit/ LIEGT: Der Vitest-Lauf sammelt
// "tests/unit/**/*.spec.ts". Eine Hilfsdatei ohne it()-Block waere zwar von diesem
// Muster nicht erfasst, liegt hier aber trotzdem eine Ebene hoeher - so kann auch ein
// spaeter erweitertes Muster sie nicht versehentlich als Testdatei aufgreifen.
//
// WARUM DER UMWEG UEBER <T>() => T extends A ? 1 : 2:
// Der naheliegende Test "A extends B && B extends A" haelt `any`, `unknown` und
// optionale Felder NICHT auseinander: `{ a?: string }` und `{ a: string | undefined }`
// erweitern einander gegenseitig, sind aber verschiedene Typen. Erst der Vergleich
// zweier generischer Funktionssignaturen zwingt TypeScript, die Typen als Ganzes
// gleichzusetzen statt nur ihre Zuweisbarkeit zu pruefen.
export type Gleich<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Faengt eine falsche Behauptung schon beim Typecheck ab: Ergibt Gleich<> ein
// `false`, verletzt es die Schranke `extends true` und tsc bricht ab.
export type Behaupte<_T extends true> = never;

// Die Fehlerseite einer Ergebnis-Huelle. Steht hier, weil mehrere Vertragstests sie
// brauchen und der direkte Zugriff Ergebnis<...>['fehler'] nicht uebersetzbar ist -
// `fehler` gibt es nur im ok:false-Zweig der Union.
export type NurFehler<E> = Extract<E, { ok: false }>;
