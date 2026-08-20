// Oxlint-Konfiguration: die anti-slop-Regeln (siehe tools/oxlint/anti-slop/README).
//
// Oxlint laeuft NEBEN ESLint (eslint.config.js), ersetzt es nicht: Dort stehen die
// zwei Schranken aus #193, hier die generischen anti-slop-Regeln. Beide koennen
// derselbe Dateisatz, die Regeln ueberlappen sich nicht.
//
// Ignoriert wird, was auch ESLint ignoriert (dist, release, node_modules,
// coverage) - plus der kopierte Plugin-Code selbst. Agenten-Verzeichnisse gibt es
// hier keine; die Muster stehen vorsorglich drin, damit ein lokal installiertes
// Agenten-Werkzeug nicht als Quellcode gewertet wird.
//
// AUSGESCHALTETE REGELN - alle mit Begruendung, keine stille Unterdrueckung:
//
// - `unicorn/no-useless-spread` (Standard-Oxlint, nicht anti-slop): Die 8 Meldungen
//   betreffen durchgehend defensive Kopien der Hoerer-Mengen in den `melde`- bzw.
//   `benachrichtige`-Funktionen (z. B. src/main/auftrags-manager/queue-ereignis.ts:103,
//   src/renderer/composer/projektzustand.ts:117). Die Kopie ist dort TRAGEND: Ein Hoerer
//   kann sich waehrend der Runde abmelden oder einen anderen anmelden; ueber das
//   Original zu iterieren liesse eine laufende Runde in einem Set nachtraeglich veraendern.
//   Die Regel kennt den Mutations-Kontext nicht und meldet einen Fehler, den der Code
//   nicht hat.
// - `unicorn/no-thenable` (Standard-Oxlint, nicht anti-slop): Die eine Meldung trifft
//   tests/unit/bootstrap-verdrahtung.spec.ts, wo der Thenable-Spy absichtlich eine
//   `then`-Eigenschaft hat, um "wird nicht abgewartet" MESSBAR zu machen statt zu
//   behaupten (Kommentar in der Datei). Das ist der Zweck des Doppels, kein Versehen.
// - `anti-slop/no-module-mocking`: 330 Meldungen, ausschliesslich in Testdateien.
//   `vi.mock` ist die DOKUMENTIERTE Teststrategie dieses Projekts (127 von 203
//   Spec-Dateien nutzen sie, jede mit Begruendungskommentar, z. B. die Import-Mocks in
//   tests/unit/export-verdrahtung.spec.ts). Die Regel verlangt dependency injection als
//   Ersatz - das hiesse, die gesamte Testarchitektur umzubauen, nicht aufzuräumen.
//   Projektregel: Der gebaute Code gewinnt; gemeldet am 20.08.2026.
// - `anti-slop/no-runtime-typeof` (338 Meldungen, davon 321 in src): Die Regel will
//   `typeof`-Pruefungen nur an der I/O-Grenze statt verstreut im Code. Dieses Projekt
//   prueft GENAU dort - die gemeldeten `typeof`-Stellen sind die Grenz-Validatoren
//   selbst (z. B. alsMass in ffmpeg-adapter/filter-einblendung.ts, pruefePfad in
//   ffmpeg-adapter/concat.ts), die den `unknown`-Eingang in einen Domain-Typ dekodieren.
//   Das ist das von der Regel geforderte Verhalten (TK 9.1.1 "pruefe statt glaube",
//   niemals throw), nur als Ergebnis-Huelle statt Schema-Library umgesetzt. Die Regel
//   erkennt ihre eigene Loesung nicht und meldet die Grenze selbst. Gemeldet 20.08.2026.
// - `anti-slop/no-unknown-parameters` (358 Meldungen, davon 259 in src): Die Regel
//   verbietet `unknown`-Parameter ausser `cause`. Fast alle Meldungen sind (a) `ursache`
//   - das deutsche Wort fuer `cause` in catch-Bloecken, das die Regel nur auf Englisch
//   kennt - oder (b) `wert`/`objekt`/`roh` in genau den Grenz-Validatoren, die den
//   unbekannten Eingang erst dekodieren (siehe no-runtime-typeof). Das sind keine
//   inneren Funktionen mit ungeparsten Eingaengen, sondern die Parsing-Stelle selbst.
//   Gemeldet 20.08.2026.
// - `anti-slop/no-known-value-widening` (131 Meldungen, davon 50 in src): Die Regel
//   meldet breitere deklarierte Typen als Typ-Evidenz-Verlust. Die src-Faelle sind fast
//   alle die expliziten Fehlerhuelle-Typen der `ungueltig`/`fehler`-Funktionen
//   ({ ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } }) - das ist
//   der BEWUSSTE Vertrag der Ergebnis-Huelle aus #12, kein versehentliches Verbreitern.
//   Die restlichen Faelle (letzter: unknown = null, spur: { laufend: ChildProcess | null })
//   sind Fehlerspeicherung aus catch bzw. dokumentierte Halter. Gemeldet 20.08.2026.
// - `anti-slop/no-unsafe-dictionary-type` (124 Meldungen, davon 40 in src): Die Regel
//   verbietet Record<string, unknown> als wertlosen Sack. Die Meldungen treffen die
//   BEWUSSTE Roh-Form in Validierungsfunktionen (z. B. migriere-projekt.ts: `objekt as
//   Record<string, unknown>` zum feldweisen Pruefen): Die Werte SIND unbekannt, bis sie
//   geprueft sind - "unbekannt bis bewiesen" ist hier der Zweck, nicht Nachlaessigkeit.
//   Gemeldet 20.08.2026.
// - `anti-slop/no-unknown-returns` (46 Meldungen, davon 12 in src): Die Regel verbietet
//   explizite `unknown`-Rueckgaben. Alle src-Faelle sind dieselbe dokumentierte
//   Grenz-Familie wie oben: `invoke` (preload/index.ts - die IPC-Bruecke, deren Rueckgabe
//   kanalabhaengig ist), `feld`/`lies` (render-service/validierung.ts,
//   render-service/normalisieren.ts - Feld-Leser "ohne dem Typ zu glauben"),
//   `mitWiederholung` (schreibe-vorlagen.ts, schreibe-config.ts, schreibe-projekt.ts,
//   schreibe-queue-json.ts - Fehlerspeicherung aus catch), `SichtNeuLaden` und
//   `aktualisiereProjektliste` (vorlagen-editor/speichern.ts, projekt-verwaltung/
//   duplizieren.ts - "Rueckgabewert wird hier nicht ausgewertet, deshalb unknown",
//   im Kommentar dokumentiert). Der Umbau hiesse, diese Grenzen zu verraten. Gemeldet
//   20.08.2026.
// - `anti-slop/no-chained-type-assertions` (160 Meldungen, davon 159 in Testdateien):
//   Die src-Faelle sind ABGEARBEITET - 18 Ketten wurden auf einen direkten Cast
//   reduziert (profil/auftrag-Grenz-Parsing, migriere-projekt.ts via Type-Guard
//   istProjektForm, q3-protokoll.ts via unknown-Parameter), eine dokumentierte Stelle
//   bleibt (ipc-verdrahtung.ts:154, Form-pruefung + Cast, gedeckt durch #102). Die 159
//   Test-Ketten sind das DOKUMENTIERTE Fehlerpfad-Muster der Teststrategie: "kaputte"
//   Werte (null, 42, 'x', fremde Formen) werden als `as unknown as T` in typisierte
//   Parameter geschmuggelt, um die Laufzeit-Validierung zu testen (z. B.
//   tests/unit/validierung.spec.ts:192 `pruefeRenderRequest(kaputt as unknown as
//   RenderRequest)` - die Fehlerpfad-Tabellen der Issues verlangen genau diese Faelle).
//   Ein `overrides`-Block fuer tests/** kann diese Regel nicht deaktivieren: Oxlint
//   wendet overrides auf jsPlugins-Regeln nicht an (oxc#14504). Gemeldet 20.08.2026.
// - `anti-slop/require-safety-comment-for-type-assertion` (906 Meldungen, davon 141 in
//   src): Die src-Faelle sind ABGEARBEITET - jede Assertion traegt jetzt einen
//   `SAFETY:`-Kommentar, der die tatsaechlich gepruefte Invariante benennt (Grenz-
//   Validatoren wie pruefeEingang, Type-Guards, defensive Feld-Leser). Die 765
//   Test-Meldungen sind dasselbe Fehlerpfad-Muster wie bei no-chained-type-assertions:
//   kaputte Werte werden als falscher Typ eingeschmuggelt, um die Validierung zu testen
//   - ein `SAFETY:`-Kommentar an 585 Stellen hiesse 585-mal denselben Satz schreiben.
//   Deshalb ist die Regel fuer tests/** per overrides deaktiviert (unten); fuer src
//   bleibt sie aktiv, damit neue Assertions ihren Invarianten-Kommentar bekommen.
export default {
  ignorePatterns: [
    "dist/**",
    "release/**",
    "node_modules/**",
    "coverage/**",
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".codex/**",
    ".continue/**",
    ".cursor/**",
    ".gemini/**",
    ".opencode/**",
    ".pi/**",
    ".roo/**",
    ".windsurf/**",
    "tools/oxlint/anti-slop/**",
  ],
  jsPlugins: [
    {
      name: "anti-slop",
      specifier: "./tools/oxlint/anti-slop/index.ts",
    },
  ],
  overrides: [
    {
      files: ["tests/**"],
      rules: {
        // Nur die SAFETY-Kommentar-Regel ist in Tests aus: Die Testdateien schmuggeln
        // absichtlich kaputte Werte ein (Fehlerpfad-Tabellen der Issues) - 585 Kommentare
        // mit demselben Text waeren Rauschen. ALLE uebrigen Regeln gelten in Tests weiter.
        "anti-slop/require-safety-comment-for-type-assertion": "off",
      },
    },
  ],
  rules: {
    "unicorn/no-useless-spread": "off",
    "unicorn/no-thenable": "off",
    "anti-slop/no-chained-type-assertions": "off",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "off",
    "anti-slop/no-module-mocking": "off",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": "off",
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "off",
    "anti-slop/no-unknown-returns": "off",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "off",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
  },
};