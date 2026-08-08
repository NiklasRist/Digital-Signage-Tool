import { defineConfig } from "vite";

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
