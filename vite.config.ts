import { defineConfig } from "vite";

// Renderer-Build. Vite sieht AUSSCHLIESSLICH den Renderer - Main und Preload baut
// esbuild in scripts/build-main.mjs.
//
// Zur STOPP-Frage aus #2 ("muss ffmpeg-static auch hier als external stehen?"):
// NEIN, und zwar bewusst nicht. "external" hiesse: "dieser Import bleibt stehen und
// wird zur Laufzeit aufgeloest" - der Build liefe dann durch und die App braeche erst
// im Browser-Kontext des Renderers, wo es kein require() gibt. Ohne den Eintrag
// scheitert schon der BUILD, laut und mit Dateinamen. Das ist hier das gewuenschte
// Verhalten: Der Renderer darf ffmpeg nie importieren ("Nur der Main-Prozess beruehrt
// ffmpeg und Dateisystem.", TK 2), also soll der Versuch auffallen und nicht
// stillschweigend gelingen.
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
