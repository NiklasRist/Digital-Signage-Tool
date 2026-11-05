// Werkzeug: die GEBAUTE App starten, ein Projekt oeffnen und einen Screenshot ablegen.
//
// WARUM ES DIESE DATEI GIBT (04.11.2026): Die Sichtpruefung eines Umbaus braucht ein
// Bild. Ein Bildschirmfoto des ganzen Desktops hilft nur, solange das Fenster vorn ist;
// Klicks von aussen scheitern an fehlenden Bedienungshilfen. Der Treiber (`durchlauf.mjs`)
// steuert die App laengst ueber CDP - dasselbe hier, nur zum Schauen statt zum Messen.
//
// Aufruf:
//   node scripts/schau.mjs [ziel.png] [--editor|--start|--aktion <id>] [--gross] [--gestaltung]
//
// Vorbedingung: `npm run build` (dist/main/index.cjs + dist/renderer/index.html).

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");

const args = process.argv.slice(2);
const zielIndex = args.findIndex((a) => !a.startsWith("--"));
const ziel = zielIndex === -1 ? "/tmp/schau.png" : args[zielIndex];
const modusIndex = args.findIndex((a) => a === "--editor" || a === "--start" || a === "--aktion");
const modus = modusIndex === -1 ? "--editor" : args[modusIndex];
const aktionId = modus === "--aktion" ? args[modusIndex + 1] : null;

const schlafe = (ms) => new Promise((w) => setTimeout(w, ms));

function raeumeSperren() {
  for (const d of ["instanz.lock", "instanz.signal"]) {
    const p = path.join(WURZEL, d);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

const main = async () => {
  if (!fs.existsSync(path.join(WURZEL, "dist", "main", "index.cjs"))) {
    console.error("[abbrechen] dist/main/index.cjs fehlt - zuerst 'npm run build'.");
    process.exit(1);
  }
  raeumeSperren();

  const browser = await puppeteer.launch({
    executablePath: ELEKTRON,
    args: [path.join(WURZEL, "dist", "main", "index.cjs")],
    defaultViewport: null,
  });
  try {
    const [seite] = await browser.pages();
    const da = async (auswahl) => (await seite.$(auswahl)) !== null;

    // Warten, bis die Oberflaeche steht (Reiterleiste).
    const frist = Date.now() + 20_000;
    while (Date.now() < frist && !(await da('[data-testid="reiter-projekte"]'))) {
      await schlafe(250);
    }

    // 04.11.2026: Ob das gemerkte Projekt von selbst offen ist, ist der Befund zu FA-15.
    const projektOffen = await da('[data-testid="composer-wurzel"]');
    console.log(`[schau] Projekt beim Start offen: ${String(projektOffen)}.`);

    if (!projektOffen) {
      const konfig = JSON.parse(fs.readFileSync(path.join(WURZEL, "config.json"), "utf-8"));
      let id = konfig.aktivesProjektId;
      await seite.click('[data-testid="reiter-projekte"]');
      await schlafe(600);
      if (id === null || id === undefined) {
        // 05.11.2026: Nach einem Treiber-Lauf ist `aktivesProjektId` leer. Dann ist die
        // ERSTE sichtbare Projektzeile die einzige sinnvolle Wahl (die Zeilen sind <li>).
        id = await seite.evaluate(() => {
          const eintrag = document.querySelector('li[data-testid^="projekt-"]');
          if (eintrag === null) return null;
          return (eintrag.getAttribute("data-testid") ?? "").replace("projekt-", "");
        });
      }
      const zeile = `[data-testid="projekt-${id}"] button`;
      if (!(await da(zeile))) {
        console.error(`[schau] Projektzeile ${id} nicht gefunden.`);
      } else {
        await seite.click(zeile);
        await schlafe(2500);
      }
    }

    if (modus !== "--start") {
      await seite.click('[data-testid="reiter-zusammenstellen"]');
      await schlafe(600);
      // Die Rail faellt beim Oeffnen auf „Video" zurueck (Panel-Zustand ueberlebt kein
      // Projekt-Neuoeffnen) - die Bibliothek mit „+ Neue Aktion" liegt unter „Aktionen".
      const railKnopf = '[data-testid="sidepanel-ansicht-aktionen"]';
      if (await da(railKnopf)) {
        const gedrueckt = await seite.evaluate(
          (auswahl) => document.querySelector(auswahl)?.getAttribute("aria-pressed") === "true",
          railKnopf,
        );
        if (!gedrueckt) {
          await seite.click(railKnopf);
          await schlafe(600);
        }
      }
      if (modus === "--aktion" && aktionId !== null) {
        const zeile = `[data-testid="aktion-bearbeiten-${aktionId}"]`;
        if (await da(zeile)) await seite.click(zeile);
        else console.error(`[schau] Aktion ${aktionId} nicht in der Bibliothek.`);
      } else if (await da('[data-testid="aktion-anlegen-oeffnen"]')) {
        await seite.click('[data-testid="aktion-anlegen-oeffnen"]');
      } else {
        console.error("[schau] Oeffner 'aktion-anlegen-oeffnen' fehlt - Seitenleiste zugeklappt?");
      }
      await schlafe(1200);
    }

    // Die Fenstergroesse des Starts ist 800 x 572 (die Stressgroesse des Treibers).
    // Fuer die Sichtpruefung bei 1440 x 900 wird der Viewport gesetzt - die Layout-
    // Breiten sind dann echt, nur nicht die Fenstergroesse.
    if (args.includes("--gross")) {
      await seite.setViewport({ width: 1440, height: 900 });
      await schlafe(600);
    }

    // 05.11.2026: Fuer die Sichtpruefung der Gestaltung (Scrim, Farben) muss der
    // Inspector bis zum Schritt „Gestaltung" scrollen - sonst zeigt das Bild nur die
    // Vorlagen-Galerie. `--gestaltung` ist reine Anzeige, es wird nichts geklickt.
    if (args.includes("--gestaltung")) {
      await seite.evaluate(() => {
        const form = document.querySelector('[data-testid="aktion-formular"]');
        const summaries = Array.from(form?.querySelectorAll("summary") ?? []);
        const ziel = summaries.find((s) => (s.textContent ?? "").startsWith("Gestaltung"));
        ziel?.scrollIntoView({ block: "start" });
      });
      await schlafe(500);
    }

    // Masse statt Augenmass: zwei dunkle Flaechen uebereinander sind im Bild nicht zu
    // unterscheiden (04.11.2026 - die „mittige" Vorschau liess sich so nicht pruefen).
    const masse = await seite.evaluate(() => {
      const kasten = (auswahl) => {
        const el = document.querySelector(auswahl);
        if (el === null) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };
      return {
        buehne: kasten('[data-testid="aktion-vorschau"]'),
        flaeche: kasten('[data-testid="aktion-vorschau-flaeche"]'),
        canvas: kasten('[data-testid="aktion-vorschau-flaeche"] canvas'),
        streifen: kasten('[data-testid="aktion-bibliothek"]'),
        inspector: kasten('[data-testid="aktion-formular"]'),
      };
    });
    console.log("[schau] Masse: " + JSON.stringify(masse));

    await seite.screenshot({ path: ziel });
    console.log(`[schau] Screenshot: ${ziel}`);
  } finally {
    await browser.close();
  }
};

main().catch((fehler) => {
  console.error("[schau] " + String(fehler));
  process.exit(1);
});
