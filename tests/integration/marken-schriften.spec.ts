import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Nachweis fuer die Marken-Schriften aus #8.
//
// WARUM DIESER TEST IN EINEM ECHTEN CHROMIUM LAEUFT UND NICHT IN NODE:
// Die Definition of Done von #8 verlangt Belege, die eine Schrift-Engine brauchen -
// "Canvas-Textbreite vor/nach dem Await unterscheidet sich messbar" und der Nachweis,
// dass die vier Familien danach "tatsaechlich verfuegbar" sind. Unter
// environment: "node" gibt es weder FontFace noch document.fonts noch measureText. Ein
// Test mit nachgebautem FontFace pruefte ausschliesslich die eigenen Attrappen und
// liesse genau die Fehlerklasse durch, gegen die #8 existiert: eine Schrift, die im
// Buendel fehlt oder deren URL ins Leere zeigt.
//
// WARUM DER ECHTE PRODUKTIV-BUILD GELADEN WIRD UND KEIN EIGENER EINSTIEGSPUNKT:
// In main.tsx steht die teuer gelernte Warnung, dass beim Abnehmen von #8 schon einmal
// eine Pruefsonde gruen war, die ihre eigene Voraussetzung mitbrachte - sie importierte
// die Schriften selbst, waehrend sie im Buendel fehlten. Dieser Test importiert deshalb
// NICHTS selbst. Er laedt den fertigen Chunk aus dist/renderer/, also genau das
// Artefakt, das auch ausgeliefert wird, und laesst dessen eigenen Startpfad
// (main.tsx -> ladeMarkenSchriften) die Schriften anfordern. Damit deckt er die ganze
// Naht ab: Datei im Repo -> von Vite gebuendelt -> URL unter file:// aufloesbar ->
// FontFace.load() erfolgreich -> Familie im Canvas benutzbar.
//
// WARUM document.fonts.check() HIER NICHT DER MASSSTAB IST - beim Bauen gemessen:
// check() beantwortet NICHT die Frage "ist diese Familie da?", sondern "muesste zum
// Zeichnen noch etwas nachgeladen werden?". Fuer eine Familie, die es nirgends gibt,
// ist die Antwort "nein, nichts nachzuladen" - check() liefert also TRUE. Gemessen in
// einem frischen Fenster mit document.fonts.size === 0:
//   document.fonts.check('700 100px "Playfair Display"') === true
// Ein Test, der sich darauf verlaesst, ist damit IMMER gruen - auch wenn keine einzige
// Schrift geladen wurde. Die erste Fassung dieses Tests ist genau darauf
// hereingefallen: Die Warteschleife lief gegen check() und war sofort fertig, lange
// bevor die Dateien da waren.
// Belastbar sind stattdessen zwei Dinge: der Zustand der vier FontFace-Objekte in
// document.fonts (status === "loaded" gibt es nur nach erfolgreich geladener und
// geparster Datei) und die Canvas-Breite gegen die Ersatzschrift bei GLEICHEM Gewicht.
//
// Er liegt in tests/integration/, weil er einen echten Electron-Prozess startet
// (Sekunden, nicht Millisekunden) - und ist damit NICHT Teil von "npm test" (#11),
// derselben Einordnung folgend wie prozess-trennung.spec.ts (#267).

const WURZEL = join(__dirname, "..", "..");
const BUILD = join(WURZEL, "dist", "renderer");
const ZEITGRENZE_MS = 180_000;

/**
 * Die vier Schriften mit dem Gewicht, unter dem sie angesprochen werden.
 * Steht hier bewusst ein zweites Mal, damit der Test eine EIGENE Erwartung hat und
 * nicht die Behauptung der Implementierung nachspricht.
 */
const SCHRIFTEN = [
  { familie: "Playfair Display", gewicht: "700", datei: "PlayfairDisplay-Bold" },
  { familie: "Archivo Black", gewicht: "900", datei: "ArchivoBlack-Regular" },
  { familie: "Arimo", gewicht: "400", datei: "Arimo-Regular" },
  { familie: "Arimo", gewicht: "700", datei: "Arimo-Bold" },
] as const;

/**
 * Fuer welche Familien die Breitenprobe aussagekraeftig ist.
 *
 * ARIMO IST ABSICHTLICH NICHT DABEI - und das ist kein Nachlassen, sondern der Kern
 * der Sache: Arimo ist metrisch kompatibel zu Arial gebaut, Zeichen fuer Zeichen
 * gleich breit. Faellt der Canvas mangels geladener Schrift auf die Systemschrift
 * zurueck, kann dieselbe Breite herauskommen. Eine Gleichheit waere hier also kein
 * Fehler; eine Ungleichheit einzufordern haette den Test wackelig gemacht.
 * Fuer Arimo tragen stattdessen der Face-Zustand und die Probe Regular vs. Bold.
 */
const BREITE_AUSSAGEKRAEFTIG = new Set(["Playfair Display", "Archivo Black"]);

interface Messpunkt {
  familie: string;
  gewicht: string;
  breite: number;
  /** Breite derselben Zeichenfolge bei gleichem Gewicht mit einer erfundenen Familie. */
  ersatzbreite: number;
  check: boolean;
}

interface Sondenergebnis {
  vorher: Messpunkt[];
  nachher: Messpunkt[];
  facesVorher: number;
  faces: { familie: string; gewicht: string; status: string }[];
  fehler: string | null;
  wartenAbgelaufen: boolean;
}

interface Anfrage {
  url: string;
  status: number;
}

let ergebnis: Sondenergebnis;
let anfragen: Anfrage[];
let aufraeumen: (() => void)[] = [];

/** Liest aus der gebauten index.html den Namen des Einstiegs-Chunks. */
function findeChunk(): string {
  const html = readFileSync(join(BUILD, "index.html"), "utf8");
  const treffer = /<script[^>]+src="\.\/(assets\/[^"]+\.js)"/.exec(html);
  if (!treffer?.[1]) {
    throw new Error("In dist/renderer/index.html steht kein Modul-Script - Build kaputt?");
  }
  return treffer[1];
}

beforeAll(() => {
  // Frisch bauen, damit der Test nicht an einem alten dist/ vorbeimisst.
  execFileSync("npx", ["vite", "build"], {
    cwd: WURZEL,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "pipe",
  });

  const chunk = findeChunk();

  // Die Sonde MUSS in dist/renderer/ liegen: Nur von dort loesen der relative Import
  // des Chunks und die daraus gebildeten Schrift-URLs so auf wie in der echten App.
  const sondenSeite = join(BUILD, "__schriften-sonde.html");
  writeFileSync(sondenSeite, sondenHtml(chunk), "utf8");
  aufraeumen.push(() => rmSync(sondenSeite, { force: true }));

  const temp = mkdtempSync(join(tmpdir(), "schriften-sonde-"));
  aufraeumen.push(() => rmSync(temp, { recursive: true, force: true }));
  const hauptSkript = join(temp, "haupt.cjs");
  writeFileSync(hauptSkript, electronHauptSkript(), "utf8");

  const elektron = join(
    WURZEL,
    "node_modules",
    "electron",
    "dist",
    process.platform === "win32" ? "electron.exe" : "electron",
  );
  const ausgabe = execFileSync(elektron, [hauptSkript, sondenSeite], {
    cwd: WURZEL,
    encoding: "utf8",
    timeout: 120_000,
    stdio: "pipe",
  });

  const lies = <T>(marke: string): T => {
    const zeile = ausgabe.split(/\r?\n/).find((z) => z.startsWith(marke));
    if (!zeile) throw new Error(`Sonde lieferte "${marke}" nicht. Ausgabe war:\n${ausgabe}`);
    return JSON.parse(zeile.slice(marke.length)) as T;
  };
  ergebnis = lies<Sondenergebnis>("ERGEBNIS_JSON:");
  anfragen = lies<Anfrage[]>("ANFRAGEN_JSON:");
}, ZEITGRENZE_MS);

afterAll(() => {
  for (const f of aufraeumen.reverse()) f();
  aufraeumen = [];
});

/** Die Seite, die im Renderer misst - vor und nach dem Laden des echten Bundles. */
function sondenHtml(chunk: string): string {
  return `<!doctype html>
<html lang="de"><head><meta charset="UTF-8"><title>Schriften-Sonde</title></head>
<body>
<div id="wurzel"></div>
<script type="module">
const TEXT = "Fitnessworld24 Kursplan ABCDEFG abcdefg 0123456789";
const SCHRIFTEN = ${JSON.stringify(SCHRIFTEN)};
// Eine Familie, die es garantiert nirgends gibt: So sieht der Rueckfall auf die
// Ersatzschrift aus. Gemessen wird sie bei JEDEM Gewicht einzeln - eine fette
// Ersatzschrift ist breiter als eine normale, ein Vergleich ueber Gewichte hinweg
// vergliche also Aepfel mit Birnen.
const ERFUNDEN = "Gibt-Es-Garantiert-Nicht-QXZ";
const ctx = document.createElement("canvas").getContext("2d");
const wert = (f, g) => g + " 100px \\"" + f + "\\"";
const messe = (f, g) => { ctx.font = wert(f, g); return ctx.measureText(TEXT).width; };
const aufnahme = () => SCHRIFTEN.map((s) => ({
  familie: s.familie,
  gewicht: s.gewicht,
  breite: messe(s.familie, s.gewicht),
  ersatzbreite: messe(ERFUNDEN, s.gewicht),
  check: document.fonts.check(wert(s.familie, s.gewicht)),
}));

const ergebnis = {
  vorher: aufnahme(),
  nachher: [],
  facesVorher: document.fonts.size,
  faces: [],
  fehler: null,
  wartenAbgelaufen: false,
};
try {
  // Der echte Einstiegspunkt der App. Er ruft von sich aus ladeMarkenSchriften().
  await import("./${chunk}");
  // NICHT gegen document.fonts.check() warten - das ist auch ohne geladene Schrift
  // sofort true (siehe Kopf dieser Datei). Gewartet wird auf die vier Faces selbst.
  const genug = () => {
    if (document.fonts.size < SCHRIFTEN.length) return false;
    let alleFertig = true;
    document.fonts.forEach((f) => { if (f.status !== "loaded") alleFertig = false; });
    return alleFertig;
  };
  const grenze = Date.now() + 30000;
  while (Date.now() < grenze && !genug()) {
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!genug()) ergebnis.wartenAbgelaufen = true;
  ergebnis.nachher = aufnahme();
  document.fonts.forEach((f) => {
    // family kommt mit Anfuehrungszeichen zurueck, wenn der Name Leerzeichen enthaelt.
    ergebnis.faces.push({
      familie: f.family.replace(/^"|"$/g, ""),
      gewicht: f.weight,
      status: f.status,
    });
  });
} catch (e) {
  ergebnis.fehler = String((e && e.stack) || e);
  ergebnis.nachher = aufnahme();
}
window.__ergebnis = ergebnis;
</script>
</body></html>`;
}

/** Electron-Hauptprozess: laedt die Sonde in einem unsichtbaren Fenster und liest ab. */
function electronHauptSkript(): string {
  return `const { app, BrowserWindow } = require("electron");

// Ohne Hardware-Beschleunigung: Der Lauf soll auch auf einem Rechner ohne brauchbaren
// Grafiktreiber (Build-Server, Remote-Sitzung) durchgehen. Fuer Schrift-Metriken
// spielt die GPU keine Rolle - measureText rechnet auf der CPU.
app.disableHardwareAcceleration();

const seite = process.argv[2];
const anfragen = [];

app.whenReady().then(async () => {
  const fenster = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  // Mitschreiben, welche Schrift-Dateien wirklich vom Datentraeger geholt wurden.
  // Das ist der Beleg dafuer, dass die Dateien im Buendel liegen und ihre URL
  // aufloest - unabhaengig davon, was die Seite selbst behauptet.
  // "file://*" MUSS mit in den Filter: Das Muster "*://*/*" deckt file:// NICHT ab,
  // und die ausgelieferte App laedt ausschliesslich ueber file:// (#3). Ohne den
  // Eintrag bleibt die Liste leer und der Test faellt aus - nicht, weil eine Datei
  // fehlt, sondern weil niemand hingesehen hat.
  const filter = { urls: ["file://*", "file://*/*", "*://*/*"] };
  fenster.webContents.session.webRequest.onCompleted(filter, (d) => {
    if (d.url.endsWith(".woff2")) anfragen.push({ url: d.url, status: d.statusCode });
  });
  let ergebnis = null;
  try {
    await fenster.loadFile(seite);
    const grenze = Date.now() + 60000;
    while (Date.now() < grenze) {
      ergebnis = await fenster.webContents.executeJavaScript("window.__ergebnis || null");
      if (ergebnis) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (e) {
    ergebnis = { fehler: String((e && e.stack) || e) };
  }
  console.log("ERGEBNIS_JSON:" + JSON.stringify(ergebnis));
  console.log("ANFRAGEN_JSON:" + JSON.stringify(anfragen));
  app.exit(0);
});`;
}

describe("Marken-Schriften (#8)", () => {
  it("liefert ein Messergebnis ohne Fehler", () => {
    expect(ergebnis, "Sonde lieferte null").toBeTruthy();
    expect(ergebnis.fehler).toBeNull();
    expect(ergebnis.wartenAbgelaufen, "Schriften wurden nicht rechtzeitig fertig").toBe(false);
  });

  it("startet mit einem Dokument ganz ohne registrierte Schriften", () => {
    // Sonst waere jede Aussage ueber "vorher" wertlos.
    expect(ergebnis.facesVorher).toBe(0);
  });

  it("holt alle vier woff2-Dateien erfolgreich aus dem Buendel", () => {
    // Der harte Naht-Beleg: Datei im Repo -> von Vite gebuendelt -> unter file://
    // gefunden. Faende Chromium eine Datei nicht, stuende hier ein Fehlercode oder
    // die Anfrage fehlte ganz.
    for (const s of SCHRIFTEN) {
      const treffer = anfragen.filter((a) => a.url.includes(s.datei));
      expect(treffer.length, `keine Anfrage fuer ${s.datei}.woff2`).toBeGreaterThan(0);
      for (const t of treffer) {
        expect(t.status, `${s.datei}.woff2 wurde mit Status ${t.status} beantwortet`).toBe(200);
      }
    }
  });

  it("registriert genau die vier Faces, alle im Zustand loaded", () => {
    // status === "loaded" gibt es nur, wenn die Datei geholt UND als Schrift geparst
    // werden konnte. Das ist der Beleg, dass ladeMarkenSchriften() nicht bloss ein
    // Promise aufgeloest hat - genau die Unterscheidung, die die DoD verlangt.
    expect(ergebnis.faces).toHaveLength(SCHRIFTEN.length);
    for (const s of SCHRIFTEN) {
      const face = ergebnis.faces.find((f) => f.familie === s.familie && f.gewicht === s.gewicht);
      expect(face, `Face ${s.familie} ${s.gewicht} fehlt in document.fonts`).toBeDefined();
      expect(face!.status).toBe("loaded");
    }
  });

  it("zeichnet vor dem Laden nachweislich mit der Ersatzschrift", () => {
    // Gegenprobe zur eigentlichen Probe: Vor dem Laden muss jede Marken-Familie
    // GENAUSO breit sein wie eine frei erfundene - beide landen bei derselben
    // Ersatzschrift. Waere das nicht so, kaeme die Breite von woanders her und der
    // Vergleich im naechsten Fall bewiese nicht, was er behauptet (z. B. weil die
    // Schrift doch systemweit installiert ist).
    for (const m of ergebnis.vorher) {
      expect(
        m.breite,
        `${m.familie} ${m.gewicht} war schon VOR dem Laden nicht die Ersatzschrift - ` +
          `systemweit installiert? Dann belegt dieser Test nichts.`,
      ).toBeCloseTo(m.ersatzbreite, 1);
    }
  });

  it("aendert die Canvas-Textbreite messbar (Schriften mit eigener Metrik)", () => {
    for (const m of ergebnis.nachher) {
      if (!BREITE_AUSSAGEKRAEFTIG.has(m.familie)) continue;
      const vorher = ergebnis.vorher.find(
        (v) => v.familie === m.familie && v.gewicht === m.gewicht,
      );
      expect(vorher).toBeDefined();
      expect(
        Math.abs(m.breite - vorher!.breite),
        `${m.familie}: Breite vor (${vorher!.breite}) und nach (${m.breite}) dem Laden ` +
          `ist gleich - der Canvas zeichnet also weiter mit der Ersatzschrift.`,
      ).toBeGreaterThan(1);
      // und sie ist danach auch nicht mehr die Ersatzschrift
      expect(Math.abs(m.breite - m.ersatzbreite)).toBeGreaterThan(1);
    }
  });

  it("unterscheidet die beiden Arimo-Schnitte nach dem Laden", () => {
    // Arimo traegt zwei Dateien fuer dieselbe Familie. Wuerde nur eine davon geladen
    // oder beide unter demselben Gewicht registriert, faende der Canvas trotzdem
    // etwas - der Fettschnitt fehlte aber. Verschiedene Breiten belegen, dass wirklich
    // zwei verschiedene Dateien angekommen sind.
    const regular = ergebnis.nachher.find((m) => m.familie === "Arimo" && m.gewicht === "400");
    const fett = ergebnis.nachher.find((m) => m.familie === "Arimo" && m.gewicht === "700");
    expect(regular).toBeDefined();
    expect(fett).toBeDefined();
    expect(fett!.breite).toBeGreaterThan(regular!.breite);
  });
});
