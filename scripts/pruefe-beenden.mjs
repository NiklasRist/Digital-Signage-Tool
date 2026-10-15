// Einmalige Prozess-Messung zu #427: Beendet sich die App, wenn das Fenster
// geschlossen wird (rotes Kreuz -> window-all-closed -> app.quit -> before-quit)?
// Gemessen wird am ECHTEN, gebauten Fenster. Kein Teil des regulaeren Durchlaufs.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");

for (const d of ["instanz.lock", "instanz.signal"]) {
  const p = path.join(WURZEL, d);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const browser = await puppeteer.launch({
  executablePath: ELEKTRON,
  args: [path.join(WURZEL, "dist", "main", "index.cjs")],
  defaultViewport: null,
});

const prozess = browser.process();
console.log(`[beenden] App gestartet, PID=${prozess?.pid}`);

const [seite] = await browser.pages();
await seite.waitForSelector("body", { timeout: 30_000 });
await new Promise((w) => setTimeout(w, 3_000));

console.log("[beenden] Fenster schliessen (window.close im Renderer = rotes Kreuz) ...");
await seite.evaluate(() => window.close());

// Auf das Ende des App-Prozesses warten (hoechstens 20 s).
let beendet = null;
for (let s = 0; s < 40; s += 1) {
  await new Promise((w) => setTimeout(w, 500));
  const tot = prozess === null || prozess.exitCode !== null || prozess.signalCode !== null;
  if (tot) { beendet = s * 0.5; break; }
}

if (beendet === null) {
  console.log("[beenden] BEFUND: Der Prozess lebt nach 20 s noch (Waisenprozess, #427)");
  try { prozess?.kill("SIGKILL"); } catch { /* egal */ }
  process.exit(1);
} else {
  console.log(`[beenden] OK: Die App ist ${beendet} s nach dem Fenster-Schliessen beendet (#427 belegt).`);
  for (const d of ["instanz.lock", "instanz.signal"]) {
    const p = path.join(WURZEL, d);
    if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(`[beenden] Sperre ${d} geraeumt.`); }
  }
  process.exit(0);
}
