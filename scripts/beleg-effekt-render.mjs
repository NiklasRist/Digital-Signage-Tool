// Beleg: kommt ein Effekt im GERENDERTEN Video an? (09.11.2026, #464)
//
// DER WEG IST DER ECHTE: eine Kopie eines Projekts, in `project.json` ein Segment
// mit „Zoom-Atmen" UND einem Motiv, dann die gebaute App starten, im Composer
// „Video erzeugen" druecken und die entstandene Datei mit ffprobe/ffmpeg messen.
//
// WARUM MIT MOTIV: Genau dieser Fall war vor dem 09.11.2026 kaputt - ein
// `media://`-Bild direkt im `<img>` taintet das Canvas, und `toBlob` scheitert mit
// "Tainted canvases may not be exported". Der Beleg ist damit zugleich die
// Gegenprobe fuer den Blob-Weg in `bild-laden.ts`.
//
// ZWEI PHASEN, eine Gegenprobe:
//   1. MIT Effekt  -> 300 Bilder (10 s), und die Bildmitte sieht in Bild 0 ANDERS
//      aus als in Bild 30 (das Motiv atmet).
//   2. OHNE Effekt -> 300 Bilder (10 s), und Bild 0 sieht aus wie Bild 30.
// Nur zusammen traegt das: Phase 1 allein koennte auch ein anderer Unterschied sein,
// Phase 2 allein sagt nichts ueber den Effekt.
//
// Die Projektkopie, ihre Ausgabe und die geaenderte `config.json` werden am Ende
// ENTFERNT; das Originalprojekt wird nie angefasst.
//
// Aufruf: node scripts/beleg-effekt-render.mjs   (Vorbedingung: npm run build)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");
const FFMPEG = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
const FFPROBE = path.join(WURZEL, "node_modules", "ffprobe-static", "bin",
  "darwin", "x64", "ffprobe");
const schlafe = (ms) => new Promise((w) => setTimeout(w, ms));

/** Das Projekt, dessen Aktion als Vorlage dient (nur gelesen, nie geschrieben). */
const QUELLE = "ceb80879-6423-4d8d-ba03-bccf4de405dd";
const NEUE_ID = `beleg-${Date.now()}`;
const AUSGABE_MIT = "effekt-mit";
const AUSGABE_OHNE = "effekt-ohne";

const quelle = path.join(WURZEL, "projects", QUELLE);
const ziel = path.join(WURZEL, "projects", NEUE_ID);
const konfigPfad = path.join(WURZEL, "config.json");
const konfigOriginal = fs.readFileSync(konfigPfad, "utf-8");

function baueProjekt(mitEffekt) {
  const projekt = JSON.parse(fs.readFileSync(path.join(quelle, "project.json"), "utf-8"));
  const aktion = projekt.aktionen.find((a) => a.titel === "Fill in");
  if (aktion === undefined) throw new Error("Aktion 'Fill in' fehlt in der Quelle");

  // Ein Motiv, damit „Zoom-Atmen" etwas zu bewegen hat (AD 4.10: die Schleifen
  // wirken aufs Motiv). Die Datei liegt in der Kopie unter media/.
  const bild = projekt.assets.find((a) => a.typ === "bild");
  if (bild === undefined) throw new Error("Kein Bild-Asset in der Quelle");
  aktion.bildRef = bild.id;
  aktion.effekte = mitEffekt ? { zoomAtmen: { staerke: 100 } } : null;

  projekt.id = NEUE_ID;
  projekt.name = "beleg-effekt-render";
  projekt.letzterAusgabeName = null;
  // NUR ein Segment, 10 s - damit die Datei genau ein Element enthaelt und die
  // Bildzahl eindeutig dem Effekt-Weg zuzuordnen ist.
  projekt.liste = [
    {
      id: "beleg-element",
      art: "segment",
      ref: aktion.id,
      dauer: 10,
      trimStart: null,
      trimEnde: null,
      einblendung: null,
    },
  ];

  fs.rmSync(ziel, { recursive: true, force: true });
  fs.cpSync(quelle, ziel, {
    recursive: true,
    // Die alte Ausgabe der Quelle (1,5 GB) gehoert nicht zum Beleg.
    filter: (pfad) => !pfad.includes(path.join("output", "try.mp4")),
  });
  fs.writeFileSync(path.join(ziel, "project.json"), JSON.stringify(projekt, null, 2));
}

function setzeAktivesProjekt() {
  const konfig = JSON.parse(konfigOriginal);
  konfig.aktivesProjektId = NEUE_ID;
  konfig.uiVoreinstellungen = {
    ...(konfig.uiVoreinstellungen ?? {}),
    "app-shell.aktiverReiter": "zusammenstellen",
  };
  fs.writeFileSync(konfigPfad, JSON.stringify(konfig, null, 2));
}

/** Startet die App, rendert ueber den ECHTEN Dialog und wartet auf die Datei. */
async function rendere(name) {
  for (const d of ["instanz.lock", "instanz.signal"]) {
    const p = path.join(WURZEL, d);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const browser = await puppeteer.launch({
    executablePath: ELEKTRON,
    args: [path.join(WURZEL, "dist", "main", "index.cjs")],
    defaultViewport: null,
  });
  try {
    const [seite] = await browser.pages();
    const da = async (auswahl) => (await seite.$(auswahl)) !== null;
    seite.on("console", (meldung) => {
      console.warn("[seite]", meldung.type(), meldung.text());
    });
    seite.on("pageerror", (fehler) => console.error("[pageerror]", fehler.message));

    const frist = Date.now() + 30_000;
    while (Date.now() < frist && !(await da('[data-testid="composer-wurzel"]'))) {
      await schlafe(250);
    }
    if (!(await da('[data-testid="composer-wurzel"]'))) {
      throw new Error("Das Projekt wurde nicht geoeffnet (composer-wurzel fehlt)");
    }

    await seite.click('[data-testid="composer-render-oefnen"]');
    await schlafe(400);
    await seite.click('[data-testid="render-dialog-name"]');
    await seite.type('[data-testid="render-dialog-name"]', name);
    await schlafe(200);
    // Diagnose: Ein leeres Feld haelt den Knopf gesperrt, und der Render startet nie.
    const feldwert = await seite.$eval('[data-testid="render-dialog-name"]', (el) => el.value);
    const gesperrt = await seite.$eval('[data-testid="render-dialog-ausloeser"]', (el) => el.disabled);
    if (feldwert !== name || gesperrt) {
      throw new Error(`Der Dialog nahm den Namen nicht an (Feld=${JSON.stringify(feldwert)}, gesperrt=${String(gesperrt)}).`);
    }
    // Der Ausloeser wird IM Fensterskript geklickt: `seite.click` traefe an dieser
    // Stelle die Vorschau-Transportleiste, die darueber liegt (gemessen 09.11.2026:
    // elementFromPoint liefert `vorschau-transport`). Dasselbe Muster benutzt der
    // Treiber (scripts/durchlauf.mjs, Schritt 4c).
    await seite.evaluate(() => {
      const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
      if (knopf !== null) knopf.click();
    });

    const datei = path.join(ziel, "output", `${name}.mp4`);
    const ende = Date.now() + 240_000;
    let meldung = "";
    while (Date.now() < ende && !fs.existsSync(datei)) {
      // Eine Ablehnung (z. B. "Tainted canvases ...") steht als Meldung im Fenster -
      // dann NICHT vier Minuten auf eine Datei warten, die nie kommt.
      meldung = await seite.evaluate(
        () => document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? "",
      );
      if (meldung !== "") break;
      await schlafe(500);
    }
    if (!fs.existsSync(datei)) {
      if (meldung !== "") throw new Error(`Render ${name} abgelehnt: ${meldung}`);
      const text = await seite.evaluate(() => document.body.innerText.slice(0, 3000));
      throw new Error(`Render ${name} wurde nicht fertig. Fenstertext:\n${text}`);
    }
  } finally {
    await browser.close();
  }
}

function ffprobeFeld(datei, feld) {
  return execFileSync(FFPROBE, [
    "-hide_banner", "-v", "error", "-select_streams", "v:0",
    "-count_frames", "-show_entries", `stream=${feld}`,
    "-of", "default=noprint_wrappers=1:nokey=1", datei,
  ], { encoding: "utf8" }).trim();
}

/**
 * Ein RGB-Ausschnitt aus der BILDMITTE (760, 390, 400 x 300). Dort liegt das Motiv;
 * „Zoom-Atmen" veraendert genau diesen Ausschnitt, waehrend der Rand gleich bleibt.
 */
function ausschnitt(datei, bild) {
  return execFileSync(FFMPEG, [
    "-hide_banner", "-v", "error", "-i", datei,
    "-vf", `select=eq(n\\,${bild}),crop=400:300:760:390`,
    "-frames:v", "1", "-pix_fmt", "rgb24", "-f", "rawvideo", "-",
  ], { maxBuffer: 400 * 300 * 3 + 4096 });
}

/** So viele Bytes des Ausschnitts weichen um mehr als 16 Stufen ab. */
function unterschied(a, b) {
  const laenge = Math.min(a.length, b.length);
  let zahl = 0;
  for (let i = 0; i < laenge; i += 1) {
    if (Math.abs(a[i] - b[i]) > 16) zahl += 1;
  }
  return zahl;
}

try {
  setzeAktivesProjekt();

  baueProjekt(true);
  await rendere(AUSGABE_MIT);
  const mitDatei = path.join(ziel, "output", `${AUSGABE_MIT}.mp4`);
  const mitBilder = Number(ffprobeFeld(mitDatei, "nb_read_frames"));
  const mitDauer = Number(ffprobeFeld(mitDatei, "duration"));
  const mitAbweichung = unterschied(ausschnitt(mitDatei, 0), ausschnitt(mitDatei, 30));

  baueProjekt(false);
  await rendere(AUSGABE_OHNE);
  const ohneDatei = path.join(ziel, "output", `${AUSGABE_OHNE}.mp4`);
  const ohneBilder = Number(ffprobeFeld(ohneDatei, "nb_read_frames"));
  const ohneDauer = Number(ffprobeFeld(ohneDatei, "duration"));
  const ohneAbweichung = unterschied(ausschnitt(ohneDatei, 0), ausschnitt(ohneDatei, 30));

  console.log(JSON.stringify({
    mit: {
      bilder: mitBilder,
      dauer: mitDauer,
      abweichendeBytesBild0zu30: mitAbweichung,
    },
    ohne: {
      bilder: ohneBilder,
      dauer: ohneDauer,
      abweichendeBytesBild0zu30: ohneAbweichung,
    },
    befund: {
      bilderGleich: mitBilder === 300 && ohneBilder === 300,
      // Die Datei ist der fertige Reel-Container; seine Dauer traegt die
      // AAC-Priming-Zeit (~21 ms). Gemessen wird gegen 10 s mit 0,1 s Luft.
      dauerGleich: Math.abs(mitDauer - 10) < 0.1 && Math.abs(ohneDauer - 10) < 0.1,
      mitBewegung: mitAbweichung > 100,
      ohneBewegung: ohneAbweichung <= 20,
    },
  }, null, 1));
} finally {
  if (process.env.BELEG_KEEP !== "1") {
    fs.rmSync(ziel, { recursive: true, force: true });
    fs.writeFileSync(konfigPfad, konfigOriginal);
  }
  for (const d of ["instanz.lock", "instanz.signal"]) {
    const p = path.join(WURZEL, d);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}
