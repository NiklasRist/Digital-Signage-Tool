/**
 * Rendert eine SVG-Datei per headless Chromium (Puppeteer) zu PNG.
 *
 * Wird für das DFD gebraucht: die SVG ist die Quelle (im Technischen Konzept eingebettet),
 * das PNG ist die Fassung, die `generate-docx.js` in die Word-Datei einbettet.
 *
 * Aufruf:
 *   node tools/render-dfd.js <eingabe.svg> <ausgabe.png>
 *
 * Kette bei Änderungen am DFD:
 *   1. SVG im Technischen Konzept anpassen
 *   2. node tools/render-dfd.js <svg> tools/assets/dfd.png
 *   3. node tools/generate-docx.js <md> <docx> --dfd tools/assets/dfd.png
 *
 * Hinweis: Puppeteer liegt in diesem Setup nicht global, sondern unter
 * C:/Users/acer/programming/node_modules — daher ggf. NODE_PATH setzen:
 *   export NODE_PATH="C:/Users/acer/programming/node_modules"
 */
const puppeteer = require("puppeteer");
const fs = require("fs");

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Aufruf: node tools/render-dfd.js <eingabe.svg> <ausgabe.png>");
  process.exit(1);
}

(async () => {
  const svg = fs.readFileSync(inPath, "utf-8");
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  // deviceScaleFactor 2 → doppelte Pixeldichte, damit die Schrift im Word scharf bleibt
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#fff">${svg}</body></html>`,
    { waitUntil: "networkidle0" }
  );
  const el = await page.$("svg");
  if (!el) { console.error("FEHLER: keine <svg> im Eingabedokument gefunden"); process.exit(1); }
  await el.screenshot({ path: outPath });
  await browser.close();
  console.log("gerendert:", outPath);
})();
