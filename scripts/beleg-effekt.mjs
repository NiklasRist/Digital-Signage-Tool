// Beleg: bewegt sich die Vorschau, wenn ein Effekt an ist? (09.11.2026, #461/#462/#463)
//
// ZWEI PHASEN, eine Gegenprobe: Zuerst zwei Aufnahmen OHNE Effekt - sie muessen
// IDENTISCH sein (sonst waere der Unterschied nicht dem Effekt zuzuschreiben).
// Dann wird "Zoom-Atmen" eingeschaltet und wieder zwei Aufnahmen - sie muessen sich
// UNTERSCHEIDEN. Verglichen werden die Bytes der Vorschauflaeche, nicht das ganze
// Fenster (kein blinkender Cursor, keine Uhr).
//
// Aufruf: node scripts/beleg-effekt.mjs   (Vorbedingung: npm run build)

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");
const TMP = "/private/var/folders/p3/l7d1rdv941g6vcbfdjzhd4440000gn/T/opencode";
const schlafe = (ms) => new Promise((w) => setTimeout(w, ms));

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

  const frist = Date.now() + 20_000;
  while (Date.now() < frist && !(await da('[data-testid="reiter-projekte"]'))) await schlafe(250);

  // Projekt oeffnen (wie scripts/schau.mjs).
  if (!(await da('[data-testid="composer-wurzel"]'))) {
    const konfig = JSON.parse(fs.readFileSync(path.join(WURZEL, "config.json"), "utf-8"));
    let id = konfig.aktivesProjektId;
    await seite.click('[data-testid="reiter-projekte"]');
    await schlafe(600);
    if (id === null || id === undefined) {
      id = await seite.evaluate(() => {
        const eintrag = document.querySelector('li[data-testid^="projekt-"]');
        return eintrag === null ? null : (eintrag.getAttribute("data-testid") ?? "").replace("projekt-", "");
      });
    }
    await seite.click(`[data-testid="projekt-${id}"] button`);
    await schlafe(2500);
  }

  await seite.click('[data-testid="reiter-zusammenstellen"]');
  await schlafe(600);
  const rail = '[data-testid="sidepanel-ansicht-aktionen"]';
  if (await da(rail)) {
    const gedrueckt = await seite.evaluate(
      (a) => document.querySelector(a)?.getAttribute("aria-pressed") === "true", rail);
    if (!gedrueckt) { await seite.click(rail); await schlafe(600); }
  }
  await seite.click('[data-testid="aktion-anlegen-oeffnen"]');
  await schlafe(2000); // Vorbelegung + Motive/Schriften

  const flaeche = await seite.$('[data-testid="aktion-vorschau-flaeche"]');
  if (flaeche === null) throw new Error("Vorschauflaeche nicht gefunden");

  const schuss = async (name) => {
    const p = path.join(TMP, name);
    await flaeche.screenshot({ path: p });
    return fs.readFileSync(p);
  };

  // Phase 1: OHNE Effekt - zwei Aufnahmen muessen gleich sein.
  const vor1 = await schuss("effekt-vor-1.png");
  await schlafe(500);
  const vor2 = await schuss("effekt-vor-2.png");

  // Effekt einschalten.
  await seite.click('[data-testid="effekt-zoomAtmen"] input[type="checkbox"]');
  await schlafe(800);

  const nach1 = await schuss("effekt-nach-1.png");
  await schlafe(500);
  const nach2 = await schuss("effekt-nach-2.png");

  console.log(JSON.stringify({
    vorherGleich: vor1.equals(vor2),
    nachherGleich: nach1.equals(nach2),
    groesse: vor1.length,
    dateien: [path.join(TMP, "effekt-vor-1.png"), path.join(TMP, "effekt-nach-1.png")],
  }, null, 1));
} finally {
  await browser.close();
}
