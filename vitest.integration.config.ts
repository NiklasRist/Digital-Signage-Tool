import { defineConfig } from "vitest/config";

// Integrationstests (#11) - laufen NUR, wenn sie ausdruecklich gestartet werden:
//   npm run test:integration
//
// Warum sie nicht Teil von "npm test" sind: Hier landen spaeter die Laeufe, die
// echtes ffmpeg starten, Dateien auf die Platte schreiben und Electron hochfahren.
// Sie dauern Minuten statt Sekunden. Ein Standardlauf, der das mitmacht, wird so
// selten gestartet, dass er niemandem mehr etwas sagt.
//
// Die Trennung ist AUSSCHLIESSLICH ueber "include" gebaut, in beiden Konfigurationen
// ausgeschrieben: Der Unit-Lauf sieht tests/unit/, dieser Lauf sieht
// tests/integration/. Kein Muster ueberschneidet sich, keine Datei kann in beiden
// Laeufen landen.
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.spec.ts"],
    environment: "node",
  },
});
