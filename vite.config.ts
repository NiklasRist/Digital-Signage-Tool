import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "vite";

import type { Plugin } from "vite";

/**
 * Kopiert die WASM-Runtime von ONNX Runtime Web in den Renderer-Ordner (#474, FA-29).
 *
 * WARUM EIN KOPIERSCHRITT UND KEIN `import …?url`: Das gepackte Fenster laedt die Seite
 * ueber `file://` (#3). Ein `fetch` auf eine relative Datei ist dort blockiert - der
 * Renderer holt Modell UND Runtime deshalb ueber `modell://`
 * (src/main/modell-protokoll.ts). Der Main wiederum liest sie aus dem BEREITS GEBAUTEN
 * Renderer-Ordner; also muss die Datei dort liegen.
 *
 * `onnxruntime-web` ist eine devDependency und wird NICHT von electron-builder in das
 * Paket kopiert (`files: dist/**`). Genau deshalb landet hier nur die EINE Variante, die
 * der Renderer braucht - das Paket enthaelt nicht die vier weiteren WASM-Fassungen des
 * npm-Pakets.
 */
function onnxLaufzeitKopieren(): Plugin {
  // ZWEI Dateien: die WASM-Runtime und ihr Lader (`.mjs`). ONNX Runtime Web holt beide
  // ueber `modell://` (src/main/modell-protokoll.ts) - auch der Lader ist ein eigenes
  // ES-Modul, das der Bundler NICHT einbettet (gemessen 13.11.2026).
  const dateien = ["ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs"];
  return {
    name: "onnx-laufzeit-kopieren",
    apply: "build",
    generateBundle(_optionen, buendel) {
      // KEINE ZWEITE KOPIE DER WASM-DATEI IM BUENDEL.
      //
      // ONNX Runtime Web enthaelt `new URL('ort-wasm-simd-threaded.wasm', import.meta.url)`.
      // Vite loest das statisch auf und legt die 14,8 MB als eigenes Asset unter `assets/`
      // ab - GEMESSEN am 13.11.2026: Damit lagen 29,7 MB WASM im Paket statt 14,8 MB, und
      // der Zaun aus TK 9.21.5 (<= 25 MB Zusatzgewicht) war gerissen.
      //
      // Die Kopie wird NICHT gebraucht: `wasmPaths` wird vor dem ersten Lauf auf
      // `modell://` gesetzt (src/renderer/template-canvas/freistellen.ts), und dann holt
      // ONNX Runtime Web die Datei ueber das Protokoll. Was hier liegt, wird nie geladen.
      for (const name of Object.keys(buendel)) {
        if (name.endsWith(".wasm")) delete buendel[name];
      }
    },
    closeBundle() {
      for (const name of dateien) {
        const quelle = path.resolve("node_modules/onnxruntime-web/dist", name);
        // Laut und frueh: Ohne diese Dateien scheitert das Freistellen erst im Fenster,
        // und zwar als „nicht verfuegbar" - ein Zustand, den niemand als Buildfehler erkennt.
        if (!existsSync(quelle)) {
          throw new Error(
            `onnx-laufzeit-kopieren: ${quelle} fehlt. "npm install" ausfuehren - ohne die ` +
              "Runtime ist das Freistellen im gepackten Paket nicht verfuegbar.",
          );
        }
        const ziel = path.resolve("dist/renderer", name);
        mkdirSync(path.dirname(ziel), { recursive: true });
        copyFileSync(quelle, ziel);
      }
    },
  };
}

// Renderer-Build. Vite sieht AUSSCHLIESSLICH den Renderer - Main und Preload baut
// esbuild in scripts/build-main.mjs.
//
// Zur STOPP-Frage aus #2 ("muss ffmpeg-static auch hier als external stehen?"):
// NEIN, und zwar bewusst nicht. "external" hiesse: "dieser Import bleibt stehen und
// wird zur Laufzeit aufgeloest" - die App braeche dann erst im Browser-Kontext des
// Renderers, wo es kein require() gibt.
//
// ACHTUNG - hier stand, ohne den Eintrag scheitere "schon der BUILD, laut und mit
// Dateinamen". Das ist beim Abnehmen von #2 nachgemessen worden und stimmt NICHT:
// Ein `import ffmpegPfad from "ffmpeg-static"` in src/renderer/ laeuft durch. Vite
// stubbt die davon benutzten Node-Bausteine (path, os) und WARNT nur
// ("has been externalized for browser compatibility"); Exitcode bleibt 0. Auch der
// Renderer-Typecheck greift nicht: "types": [] sperrt nur ambiente @types-Pakete,
// also das nackte fs/path - ffmpeg-static bringt eigene Typen mit.
//
// Es gibt fuer diesen Fall also DERZEIT KEINE Schranke. Die Sperre "Nur der
// Main-Prozess beruehrt ffmpeg und Dateisystem." (TK 2) haengt hier allein an der
// Aufmerksamkeit des Schreibenden. Der richtige Ort dafuer ist eine Lint-Regel, die
// Importe aus src/renderer/** auf ffmpeg-static und die Node-Bausteine verbietet -
// vermerkt in #193 (ESLint-Setup). Bis dahin: nicht darauf verlassen.
export default defineConfig({
  plugins: [onnxLaufzeitKopieren()],
  // Relative Pfade, weil das gepackte Fenster die Seite ueber file:// laedt (#3).
  // Mit dem Standard "/" wuerde der Browser unter file:// im Wurzelverzeichnis des
  // Laufwerks suchen und nichts finden.
  base: "./",

  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
    sourcemap: true,
    // Chromium-Version von Electron. Kein Transpilieren auf alte Browser noetig -
    // die Zielumgebung ist genau ein bekannter Chromium.
    target: "chrome128",
  },

  server: {
    port: 5173,
    // Ohne strictPort weicht Vite bei belegtem Port still auf 5174 aus - das
    // Dev-Skript reicht die URL aber an Electron weiter und wuerde dann auf einen
    // leeren Port zeigen.
    strictPort: true,
  },
});
