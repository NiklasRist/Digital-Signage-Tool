// Beleg: wirkt das Freistellen am echten Fenster? (13.11.2026, #474 / FA-29)
//
// WAS GEMESSEN WIRD - vier Dinge, jede fuer sich eine Zusage aus TK 9.21.5:
//   1. Das Modell reist im Paket mit und kommt ueber `modell://` an (kein Netz).
//   2. Freistellen aendert die VORSCHAU: die ECKE zeigt danach die Flaeche der Vorlage,
//      die MITTE weiter das Produkt (Pixelprobe, kein Augenmass).
//   3. Ausschalten ist byte-gleich zu vorher (Hash der ganzen Vorschauflaeche).
//   4. Der Zaun: Modell laden + rechnen und (zweiter Lauf, Modell im Speicher) nur rechnen.
//
// DAS BILD: 1920 x 1080, weisser Grund, blaues Rechteck in der Mitte - genau die Groesse,
// gegen die der Zaun steht („Laufzeit je Bild <= 5 s (1920x1080)"). Es wird ueber
// `queue:reiheEin` importiert, also ueber DENSELBEN Weg wie ein echter Import.
//
// NICHTS WIRD GESPEICHERT: Der Entwurf bleibt offen und wird am Ende verworfen (Reiter-
// wechsel). Das Projekt behaelt nur das eine importierte Bild.
//
// Aufruf: node scripts/beleg-freistellen.mjs   (Vorbedingung: npm run build)

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");
const FFMPEG = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
const TMP = "/private/var/folders/p3/l7d1rdv941g6vcbfdjzhd4440000gn/T/opencode";
const schlafe = (ms) => new Promise((w) => setTimeout(w, ms));

for (const d of ["instanz.lock", "instanz.signal"]) {
  const p = path.join(WURZEL, d);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// 1. Das Produktbild: weisser Grund, blaues Rechteck - 1920 x 1080.
const produkt = path.join(TMP, "freistellen-produkt-1920.png");
await new Promise((f, r) => {
  const p = spawn(FFMPEG, ["-y", "-f", "lavfi", "-i", "color=c=white:s=1920x1080:d=1",
    "-vf", "drawbox=x=660:y=290:w=600:h=500:color=0x2f6fdb@1:t=fill",
    "-frames:v", "1", produkt], { stdio: "ignore" });
  p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg exit " + String(c)))));
});

const browser = await puppeteer.launch({
  executablePath: ELEKTRON,
  args: [path.join(WURZEL, "dist", "main", "index.cjs")],
  defaultViewport: null,
  protocolTimeout: 300_000,
});

try {
  const [seite] = await browser.pages();
  const da = async (auswahl) => (await seite.$(auswahl)) !== null;
  const fehler = [];
  const messzeilen = [];
  seite.on("console", (m) => {
    if (m.type() === "error") fehler.push(m.text());
    if (m.text().startsWith("[freistellen]")) messzeilen.push(m.text());
  });

  const fristStart = Date.now() + 30_000;
  while (Date.now() < fristStart && !(await da('[data-testid="reiter-projekte"]'))) await schlafe(250);

  // Projekt oeffnen (wie scripts/beleg-effekt.mjs).
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

  const projektId = JSON.parse(fs.readFileSync(path.join(WURZEL, "config.json"), "utf-8")).aktivesProjektId;

  await seite.click('[data-testid="reiter-zusammenstellen"]');
  await schlafe(600);

  // 2. Das Bild importieren - derselbe Weg wie ein echter Import.
  const importAntwort = await seite.evaluate(async (pfad, projekt) => {
    return window.api.invoke("queue:reiheEin", {
      art: "import",
      payload: { projektId: projekt, quellPfad: pfad },
    });
  }, produkt, projektId);
  await schlafe(3000);

  // 3. Neue Aktion, Vorlage mit Bildzone, unser Bild waehlen.
  const rail = '[data-testid="sidepanel-ansicht-aktionen"]';
  if (await da(rail)) {
    const gedrueckt = await seite.evaluate(
      (a) => document.querySelector(a)?.getAttribute("aria-pressed") === "true", rail);
    if (!gedrueckt) { await seite.click(rail); await schlafe(600); }
  }
  await seite.evaluate(() => {
    const knopf = document.querySelector('[data-testid="aktion-anlegen-oeffnen"]')
      ?? document.querySelector('[data-testid="aktion-neu"]');
    knopf?.click();
  });
  await schlafe(2500);

  let kachel = false;
  const fristKachel = Date.now() + 10_000;
  while (Date.now() < fristKachel && !kachel) {
    kachel = await da('[data-testid="aktion-vorlage-vollbild"]');
    if (!kachel) await schlafe(250);
  }
  if (kachel) {
    await seite.evaluate(() => document.querySelector('[data-testid="aktion-vorlage-vollbild"]')?.click());
    await schlafe(600);
  }

  const gewaehlt = await seite.evaluate(() => {
    const titel = document.querySelector('[data-testid="aktion-titel"]');
    const wahl = document.querySelector('[data-testid="aktion-bild-wahl"]');
    if (titel === null || wahl === null) return null;
    const setzeText = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setzeText.call(titel, `Beleg-Freistellen-${String(Date.now())}`);
    titel.dispatchEvent(new Event("input", { bubbles: true }));
    // Der Titel geht erst beim VERLASSEN in den Entwurf (onBlur, unkontrolliertes Feld).
    // Ohne dieses Ereignis blieb der Entwurf leer und "Anlegen" tat still nichts -
    // GEMESSEN am 13.11.2026.
    titel.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    const treffer = Array.from(wahl.querySelectorAll("option"))
      .find((o) => (o.textContent ?? "").includes("freistellen-produkt-1920"));
    if (treffer === undefined) {
      return { fehlt: true, optionen: Array.from(wahl.querySelectorAll("option")).map((o) => o.textContent) };
    }
    const setzeWahl = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setzeWahl.call(wahl, treffer.value);
    wahl.dispatchEvent(new Event("change", { bubbles: true }));
    return { id: treffer.value, titel: titel.value };
  });

  const HASH = `(() => {
    const c = document.querySelector('[data-testid="aktion-vorschau-flaeche"] canvas');
    if (!(c instanceof HTMLCanvasElement) || c.width === 0) return null;
    const ctx = c.getContext('2d');
    if (ctx === null) return null;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 1) { h ^= d[i]; h = Math.imul(h, 16777619); }
    return h >>> 0;
  })()`;
  const hash = async () => seite.evaluate(HASH);
  const ecken = async () => seite.evaluate(() => {
    const c = document.querySelector('[data-testid="aktion-vorschau-flaeche"] canvas');
    if (!(c instanceof HTMLCanvasElement) || c.width === 0) return null;
    const ctx = c.getContext('2d');
    if (ctx === null) return null;
    const mitte = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
    const ecke = ctx.getImageData(3, 3, 1, 1).data;
    return {
      breite: c.width, hoehe: c.height,
      mitte: [mitte[0], mitte[1], mitte[2], mitte[3]],
      ecke: [ecke[0], ecke[1], ecke[2], ecke[3]],
    };
  });
  const warteRuhig = async (fristMs) => {
    const ende = Date.now() + fristMs;
    let letzter = null;
    while (Date.now() < ende) {
      const jetzt = await hash();
      if (jetzt !== null && jetzt === letzter) return jetzt;
      letzter = jetzt;
      await schlafe(350);
    }
    return letzter;
  };

  const vorher = gewaehlt === null ? null : await warteRuhig(10_000);
  const eckenVorher = gewaehlt === null ? null : await ecken();

  // 4. EINSCHALTEN. Die Uhr laeuft ab dem Klick: Modell laden + rechnen + zeichnen.
  const schalter = await seite.evaluate(() => {
    const feld = document.querySelector('[data-testid="aktion-freistellen"]');
    if (!(feld instanceof HTMLInputElement) || feld.disabled) return false;
    feld.click();
    return true;
  });
  const start = Date.now();
  let mit = vorher;
  let hinweis = null;
  const fristMit = Date.now() + 30_000;
  while (Date.now() < fristMit && mit === vorher) {
    await schlafe(150);
    mit = await hash();
    hinweis = await seite.evaluate(
      () => document.querySelector('[data-testid="aktion-freistellen-hinweis"]')?.textContent ?? null);
    if (hinweis !== null) break;
  }
  const dauerMit = Date.now() - start;
  // STABILITAET: zweimal derselbe Hash heisst „die Vorschau steht". Ohne diese Probe
  // koennte der Vergleichswert aus einem Zwischenstand stammen.
  const mitBestaetigt = mit === vorher ? null : await (async () => {
    await schlafe(700);
    return hash();
  })();
  const eckenMit = mit === vorher ? null : await ecken();

  // 5. AUS -> wieder byte-gleich? Dann noch einmal AN (Modell ist geladen) -> nur Rechnen.
  await seite.evaluate(() => {
    const feld = document.querySelector('[data-testid="aktion-freistellen"]');
    if (feld instanceof HTMLInputElement && feld.checked) feld.click();
  });
  let zurueck = mit;
  const fristZurueck = Date.now() + 15_000;
  while (Date.now() < fristZurueck && zurueck !== vorher) {
    await schlafe(150);
    zurueck = await hash();
  }

  const startZweit = Date.now();
  await seite.evaluate(() => {
    const feld = document.querySelector('[data-testid="aktion-freistellen"]');
    if (feld instanceof HTMLInputElement && !feld.checked) feld.click();
  });
  let mitZweit = zurueck;
  const fristZweit = Date.now() + 20_000;
  while (Date.now() < fristZweit && mitZweit === zurueck) {
    await schlafe(100);
    mitZweit = await hash();
  }
  const dauerZweit = Date.now() - startZweit;

  await seite.evaluate(() => {
    const feld = document.querySelector('[data-testid="aktion-freistellen"]');
    if (feld instanceof HTMLInputElement && feld.checked) feld.click();
  });
  let ende = mitZweit;
  const fristEnde = Date.now() + 15_000;
  while (Date.now() < fristEnde && ende !== vorher) {
    await schlafe(150);
    ende = await hash();
  }

  // 6. ABSCHLIESSEN und in der DATEI nachsehen: `freistellen: true` an der Aktion, und
  //    die Mediendatei byte-gleich (9.21.7 - nicht destruktiv).
  await seite.evaluate(() => {
    const feld = document.querySelector('[data-testid="aktion-freistellen"]');
    if (feld instanceof HTMLInputElement && !feld.checked) feld.click();
  });
  await warteRuhig(20_000);

  const medienOrdner = path.join(WURZEL, "projects", projektId, "media");
  // Nur DATEIEN: im Medienordner kann ein Unterordner liegen (z. B. `output`).
  const vorherDateien = fs.existsSync(medienOrdner)
    ? fs.readdirSync(medienOrdner, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name)
    : [];
  const hashes = new Map();
  for (const name of vorherDateien) {
    hashes.set(name, fs.readFileSync(path.join(medienOrdner, name)));
  }

  // DIAGNOSE (voruebergehend): Was steht im Feld, was im Knopf?
  const vorSave = await seite.evaluate(() => ({
    titelFeld: document.querySelector('[data-testid="aktion-titel"]')?.value ?? null,
    knopf: document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')?.textContent ?? null,
    knopfDisabled: document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')?.disabled ?? null,
  }));
  console.log("vorSpeichern:", JSON.stringify(vorSave));
  await seite.evaluate(() => document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')?.click());
  await schlafe(1200);
  const nachSave = await seite.evaluate(() => ({
    editorOffen: document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]') !== null,
    meldung: document.querySelector('[data-testid="meldungs-flaeche"]')?.textContent ?? null,
    befunde: Array.from(document.querySelectorAll('[data-testid^="befund"], [data-testid="aktion-befunde"]')).map((e) => e.textContent),
  }));
  console.log("nachSpeichern:", JSON.stringify(nachSave));

  const datei = path.join(WURZEL, "projects", projektId, "project.json");
  let gespeichert = null;
  const fristDatei = Date.now() + 30_000;
  while (Date.now() < fristDatei) {
    await schlafe(250);
    try {
      const stand = JSON.parse(fs.readFileSync(datei, "utf-8"));
      const treffer = Array.isArray(stand.aktionen)
        ? stand.aktionen.find((a) => a.titel === gewaehlt.titel)
        : undefined;
      if (treffer !== undefined) { gespeichert = treffer; break; }
    } catch {
      // Datei wird gerade geschrieben - naechster Versuch.
    }
  }

  const nachherDateien = fs.existsSync(medienOrdner)
    ? fs.readdirSync(medienOrdner, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name)
    : [];
  const medienGleich = vorherDateien.length === nachherDateien.length &&
    vorherDateien.every((name) => {
      const alt = hashes.get(name);
      return alt !== undefined && alt.equals(fs.readFileSync(path.join(medienOrdner, name)));
    });

  console.log("gespeichert:", JSON.stringify({
    titel: gespeichert?.titel ?? null,
    freistellen: gespeichert?.freistellen ?? null,
    assets: (() => { try { return JSON.parse(fs.readFileSync(datei, "utf-8")).assets.length; } catch { return -1; } })(),
    medien: `${String(vorherDateien.length)} -> ${String(nachherDateien.length)}`,
    medienGleich,
  }, null, 1));

  console.log(JSON.stringify({
    import: importAntwort,
    bild: gewaehlt,
    schalter,
    hinweis,
    hash: { vorher, mit, mitBestaetigt, zurueck, mitZweit, ende },
    pixel: { vorher: eckenVorher, mit: eckenMit },
    ms: { ladenUndRechnen: dauerMit, nurRechnen: dauerZweit },
    messzeilen,
    fensterFehler: fehler.slice(0, 5),
  }, null, 1));
} finally {
  await browser.close();
}
