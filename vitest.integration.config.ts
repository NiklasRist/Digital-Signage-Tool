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
    // WARUM HIER EINE EIGENE ZEITGRENZE STEHT (ergaenzt 15.08.2026):
    // Vitest gibt jedem Test voreingestellt 5000 ms. Das widerspricht dem, was der
    // Kommentar oben ueber diesen Lauf sagt - ein einzelner ffmpeg-Aufruf dauert hier
    // regelmaessig laenger, und wenn mehrere Dateien nebeneinander echte Prozesse
    // starten, erst recht.
    //
    // ANLASS: `tests/integration/uniformitaet-echt.spec.ts` war die erste Datei ohne
    // eigene Zeitgrenzen. Isoliert lief sie gruen, im vollen Integrationslauf riss ein
    // Test die 5000 ms - ein Flackerer, der nichts ueber den Code aussagt. Alle
    // uebrigen Dateien tragen ihre Grenzen einzeln nach (30_000 bis 60_000); dass
    // jeder Autor daran denken muss, ist die eigentliche Fehlerquelle.
    //
    // 120 Sekunden sind grosszuegig gewaehlt: Diese Grenze soll HAENGENDE Laeufe
    // beenden, nicht langsame. Ein Test, der laenger braucht, hat ein Problem.
    // Einzelne Tests duerfen weiterhin eine EIGENE Grenze setzen - die gewinnt.
    testTimeout: 120_000,
  },
});
