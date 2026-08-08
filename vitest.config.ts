import { defineConfig } from "vitest/config";

// Standard-Testlauf: NUR die schnellen Unit-Tests (#11).
//
// Warum eine eigene Datei und nicht die vite.config.ts: Jene beschreibt den
// RENDERER-Build (Ausgabeordner, Ziel-Chromium, Devserver-Port). Vitest wuerde sie
// sonst mit einlesen und Bau-Einstellungen anwenden, die mit dem Testlauf nichts zu
// tun haben. Zwei Zwecke, zwei Dateien.
//
// Warum "include" hier ausgeschrieben steht, obwohl das Skript in package.json den
// Ordner ohnehin nennt: Ohne den Eintrag greift Vitests Standardmuster und findet
// AUCH tests/integration/. Der Ordnername im Skript wirkt dann nur wie ein Filter -
// und wer das Skript einmal ohne Pfad aufruft (z. B. "npx vitest"), zieht die
// langsamen Integrationstests unbemerkt mit herein.
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    environment: "node",
  },
});
