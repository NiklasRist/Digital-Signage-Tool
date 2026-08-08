import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Lint-Regeln (#193).
//
// Dieses Setup fuehrt bewusst NUR die zwei Schranken ein, die im Issue stehen. Beide
// schliessen dieselbe Luecke: eine Zusage, die der Typechecker nicht durchsetzen kann.
// Weitere naheliegende Regeln (Formatierung, Namenskonventionen, Import-Grenzen
// zwischen Main und Renderer) sind ausdruecklich NICHT dabei - sie haetten eigene
// Folgen fuer die noch offenen Issues aus M1 bis M7 und gehoeren einzeln vorgelegt.

// Node-Bausteine, die im Renderer nichts zu suchen haben - jeweils mit und ohne
// "node:"-Praefix, weil beide Schreibweisen zum selben Modul fuehren und eine Sperre,
// die nur eine davon kennt, in einer Minute umgangen ist.
const NODE_BAUSTEINE = [
  "assert", "buffer", "child_process", "cluster", "crypto", "dgram", "dns",
  "fs", "fs/promises", "http", "http2", "https", "net", "os", "path",
  "path/posix", "path/win32", "process", "readline", "stream", "timers",
  "tls", "url", "util", "v8", "vm", "worker_threads", "zlib",
];

const VERBOTEN_IM_RENDERER = [
  ...NODE_BAUSTEINE,
  ...NODE_BAUSTEINE.map((m) => `node:${m}`),
  // Die ffmpeg-Werkzeugkette (TK 3). Dieselbe Liste steht als "external" in
  // scripts/build-main.mjs - dort, damit der Bundler sie in Ruhe laesst, hier, damit
  // der Renderer sie gar nicht erst anfasst.
  "ffmpeg-static",
  "ffprobe-static",
  "fluent-ffmpeg",
];

// Der Geltungsbereich aus #193: NUR der Quellcode der Anwendung.
//
// Warum das ausdruecklich an JEDEM Block steht und nicht nur im Skript: `eslint .`
// laeuft ueber den ganzen Baum. Ein Regelblock ohne `files` gilt dann fuer ALLES -
// beim ersten Lauf schlugen so 38 Fehler in `tools/` und `scripts/` an, also in
// Node-Skripten, die `require`, `process` und `__dirname` voellig zu Recht benutzen.
// `tools/` gehoert ueberdies der Dokumentations-Erzeugung und wird von der Bau-Arbeit
// nicht angefasst.
const QUELLDATEIEN = ["src/**/*.ts", "src/**/*.tsx"];

export default [
  { ignores: ["dist/**", "release/**", "node_modules/**", "coverage/**"] },

  { files: QUELLDATEIEN, ...js.configs.recommended },
  // "recommended" OHNE Typinformation. Die Variante "recommended-type-checked"
  // verlangt einen zusammenhaengenden Programm-Verbund; das Projekt hat aber DREI
  // getrennte tsconfigs (#1), die sich gerade nicht zu einem Verbund fuegen sollen.
  // Beide Regeln unten brauchen keine Typinformation.
  ...tseslint.configs.recommended.map((eintrag) => ({
    ...eintrag,
    files: QUELLDATEIEN,
  })),

  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      // WARUM DAS "error" IST UND KEIN "warning": Eine Warnung aendert den
      // Rueckgabewert nicht und wird deshalb uebersehen.
      //
      // Und warum die Regel ueberhaupt: tsconfig.base.json setzt seit #1
      // noUncheckedIndexedAccess, ein Array-Zugriff `elemente[i]` hat also den Typ
      // `Listenelement | undefined`. Die Fluchttuer `elemente[i]!` stellt exakt den
      // Zustand von vorher wieder her - und ist SCHLECHTER als kein Schalter, weil
      // der Code danach geprueft aussieht. Genau das ist der Weg des geringsten
      // Widerstands fuer jemanden, der eine kleine Funktion isoliert schreibt und
      // einen Compiler-Fehler wegbekommen will: Man tippt das Ausrufezeichen, nicht
      // die Fallunterscheidung.
      //
      // Stoesst echter Code an eine Stelle, an der die Behauptung unvermeidlich
      // scheint: NICHT abschalten und nicht dateiweise ausnehmen, sondern vorlegen.
      // Fast immer fehlt dort in Wahrheit eine Fallunterscheidung.
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },

  {
    files: ["src/renderer/**/*.ts", "src/renderer/**/*.tsx"],
    rules: {
      // "Nur der Main-Prozess beruehrt ffmpeg und Dateisystem." (TK 2)
      //
      // Diese Zusage hing bis hierher an nichts als der Aufmerksamkeit des
      // Schreibenden. Beim Abnehmen von #2 wurde nachgemessen, dass der Renderer
      // `ffmpeg-static` importieren kann, OHNE dass irgendetwas anschlaegt: Der
      // Vite-Build stubbt die benutzten Node-Bausteine und warnt nur (Rueckgabewert
      // 0), und der Renderer-Typecheck greift ebenfalls nicht - `"types": []` sperrt
      // allein ambiente @types-Pakete, also das nackte `fs`/`path`; `ffmpeg-static`
      // bringt eigene Typen mit.
      //
      // Die nackten Node-Bausteine fallen heute schon im Typecheck durch (TS2307, in
      // #1 nachgewiesen). Sie stehen hier trotzdem mit drin, damit die Sperre EINE
      // Adresse hat und nicht davon abhaengt, welches Paket zufaellig eigene Typen
      // mitliefert.
      //
      // KEINE Ausnahmeliste fuer einzelne Dateien: Wer im Renderer ffmpeg braucht,
      // braucht in Wirklichkeit einen IPC-Aufruf (TK 9.1.1).
      "no-restricted-imports": [
        "error",
        {
          paths: VERBOTEN_IM_RENDERER.map((name) => ({
            name,
            message:
              "Nur der Main-Prozess beruehrt ffmpeg und Dateisystem (TK 2). " +
              "Im Renderer fuehrt der Weg ueber einen IPC-Aufruf (TK 9.1.1).",
          })),
        },
      ],
    },
  },
];
