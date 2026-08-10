import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// Waechter fuer die Prozess-Trennung aus #1 (#267).
//
// WARUM ES DIESEN TEST GIBT: `skipLibCheck: true` steht seit #3 in
// tsconfig.base.json und wird von allen drei Prozess-Konfigurationen geerbt. Er musste
// gesetzt werden - electron.d.ts beschreibt auch Renderer-Dinge (<webview>,
// MessagePort, VideoFrame) und braucht dafuer DOM-Typen, die der Main bewusst nicht
// hat; ohne den Schalter ist der Main-Typecheck rot wegen FREMDEN Codes.
//
// Dass die Trennung trotzdem haelt, wurde beim Bauen mit zwei Gegenproben belegt -
// aber der Beleg lebte nur in einer Commit-Nachricht. Aendert spaeter jemand `lib` oder
// `types`, faellt es niemandem auf. Dieser Test macht die Proben wiederholbar.
//
// Er liegt in tests/integration/, weil er einen echten Compiler-Prozess startet
// (Sekunden, nicht Millisekunden) - und ist damit NICHT Teil von "npm test" (#11).

const WURZEL = join(__dirname, "..", "..");

/**
 * Zeitgrenze je Fall. Vitests Voreinstellung sind 5 s - ein `tsc`-Lauf ueber diesen
 * Baum braucht gemessen 4 bis 6 s. Der Test war damit ein Wettlauf gegen die Uhr: Beim
 * ersten Lauf gingen alle drei Faelle durch (4,1 s / 4,1 s / 4,8 s), beim zweiten fiel
 * einer bei 5,9 s heraus. Ein Test, der mal rot und mal gruen ist, ist schlimmer als
 * keiner - man gewoehnt sich an das Rot.
 *
 * Die Grenze gehoert hierher und NICHT in vitest.integration.config.ts: Dieses Issue
 * darf nur diese Datei anfassen. Dass die Integrations-Konfiguration eine hoehere
 * Voreinstellung braucht - spaetestens wenn dort echte ffmpeg-Laeufe stehen, die
 * Minuten dauern -, ist gemeldet und gehoert zu #11.
 */
const ZEITGRENZE_MS = 60_000;

/** Angelegte Sonden, damit `nachher` sie auch nach einem Fehlschlag wegraeumt. */
const sonden: string[] = [];

/**
 * Legt eine Sondendatei an und liefert die Fehlercodes, die `tsc` dazu meldet.
 *
 * Die Sonde MUSS innerhalb des geprueften Ordners liegen - nur dort greifen die
 * `include`-Muster der Konfiguration. Eine Sonde im Temp-Verzeichnis pruefte nichts.
 */
function pruefeMitSonde(relativerPfad: string, inhalt: string, konfig: string): string[] {
  const voll = join(WURZEL, relativerPfad);
  mkdirSync(dirname(voll), { recursive: true });
  writeFileSync(voll, inhalt, "utf8");
  sonden.push(voll);

  try {
    execFileSync("npx", ["tsc", "-p", konfig, "--noEmit"], {
      cwd: WURZEL,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    return [];
  } catch (fehler) {
    // tsc meldet Fehler ueber den Exit-Code; die Meldungen stehen auf stdout.
    const ausgabe = String((fehler as { stdout?: string }).stdout ?? "");
    return [...ausgabe.matchAll(/error (TS\d+)/g)].map((t) => t[1] as string);
  }
}

afterEach(() => {
  // Aufraeumen auch nach einem Fehlschlag: Eine liegengebliebene Sonde unter src/
  // faerbt jeden folgenden Typecheck rot und sieht dabei aus wie ein echter Fehler.
  while (sonden.length > 0) rmSync(sonden.pop() as string, { force: true });
});

describe("Prozess-Trennung (#1) haelt trotz skipLibCheck (#267)", () => {
  it("document in src/main/ scheitert mit TS2584", () => {
    const codes = pruefeMitSonde(
      "src/main/_sonde-dom.ts",
      "export const x = document.title;\n",
      "tsconfig.main.json",
    );
    // Auf den CODE pruefen, nicht auf den Meldungstext: Texte aendern sich mit jeder
    // TypeScript-Version und mit der Sprache der Werkzeugkette.
    expect(codes).toContain("TS2584");
  }, ZEITGRENZE_MS);

  it("node:fs in src/renderer/ scheitert mit TS2307", () => {
    const codes = pruefeMitSonde(
      "src/renderer/_sonde-fs.ts",
      'import { readFileSync } from "node:fs";\nexport const x = readFileSync;\n',
      "tsconfig.renderer.json",
    );
    expect(codes).toContain("TS2307");
  }, ZEITGRENZE_MS);

  it("electron im Main laeuft durch - die Gegenprobe zur Gegenprobe", () => {
    // Ohne diesen Fall belegen die ersten beiden nur, dass IRGENDETWAS scheitert. Sie
    // waeren auch gruen, wenn die Konfiguration insgesamt kaputt waere. Erst der
    // Nachweis, dass ein ERLAUBTER Import durchlaeuft, zeigt, dass die Pruefung
    // unterscheidet - und genau dieser Import ist der Grund fuer skipLibCheck.
    const codes = pruefeMitSonde(
      "src/main/_sonde-electron.ts",
      'import { app } from "electron";\nexport const x = app;\n',
      "tsconfig.main.json",
    );
    expect(codes).toEqual([]);
  }, ZEITGRENZE_MS);
});
