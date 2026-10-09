// Oberflaechen-Durchlauf (Session 09.10./10.10.2026): Ein Treiber, das BUILT Fenster
// mit Puppeteer bedient, gemessen nach der Regel "Messen -> Ursache -> Fix ->
// Gegenprobe -> Issue-Nachtrag" (Uebergabe 08.10.).
//
// Vorbedingungen (werden geprueft und mit klarer Meldung abgebrochen):
//   npm run build     -> dist/main/index.cjs + dist/renderer/index.html
//
// Datenort: Im Ungepackten process.cwd() (#5) - derselbe Ort wie "npm run dev".
// Das Skript raeumt VOR dem Start veraltete Sperren weg (instanz.lock/.signal im
// Wurzelverzeichnis), sonst beendet sich die App lautlos mit Code 0.
//
// Start: npm run durchlauf
// Ergebnis: jeder Schritt wird beobachtet und ins Fundsprotokoll
// docs/agents/oberflaeche-durchlauf.md ergaenzt.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const WURZEL = process.cwd();
const PROTOKOLL = path.join(WURZEL, "docs", "agents", "oberflaeche-durchlauf.md");
const ELEKTRON = path.join(WURZEL, "node_modules", "electron", "dist",
  "Electron.app", "Contents", "MacOS", "Electron");

const funde = [];

/** Schreibt einen Fund mit Schwere und Ort. */
function fund(schritt, erwartet, erkannt, schwere = "Befund", ort = "") {
  funde.push({ schritt, erwartet, erkannt, schwere, ort });
  console.log(`[${schwere}] ${schritt} :: ${erwartet} -> ${erkannt}${ort ? ` (${ort})` : ""}`);
}

/** Bestehende Einzelinstanz-Sperren raeumen, bevor die App startet. */
function raeumeSperren() {
  for (const d of ["instanz.lock", "instanz.signal"]) {
    const p = path.join(WURZEL, d);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`[sperre] ${d} entfernen.`);
    }
  }
}

function brecheAb(meldung) {
  console.error("[abbrechen] " + meldung);
  process.exit(1);
}

function pruefeVorbedingungen() {
  if (!fs.existsSync(path.join(WURZEL, "dist", "main", "index.cjs"))) {
    brecheAb("dist/main/index.cjs fehlt - zuerst 'npm run build' ausfuehren.");
  }
  if (!fs.existsSync(path.join(WURZEL, "dist", "renderer", "index.html"))) {
    brecheAb("dist/renderer/index.html fehlt - zuerst 'npm run build' ausfuehren.");
  }
  if (!fs.existsSync(ELEKTRON)) {
    brecheAb(`Electron-Binary fehlt: ${ELEKTRON}`);
  }
}

async function schlafe(ms) {
  await new Promise((w) => setTimeout(w, ms));
}

const main = async () => {
  pruefeVorbedingungen();
  raeumeSperren();

  const elektron = spawn(ELEKTRON, [path.join(WURZEL, "dist", "main", "index.cjs")], {
    cwd: WURZEL,
    stdio: "ignore",
  });

  const browser = await puppeteer.launch({
    executablePath: ELEKTRON,
    args: [path.join(WURZEL, "dist", "main", "index.cjs")],
    defaultViewport: null,
  });

  try {
    const [seite] = await browser.pages();
    const erlebteFehler = [];
    seite.on("pageerror", (tu) => erlebteFehler.push(String(tu)));
    seite.on("console", (meldung) => {
      if (meldung.type() === 'error' || meldung.type() === 'warning') {
        console.log(`[fenster ${meldung.type()}] ${meldung.text()}`);
      }
    });
    await seite.waitForSelector("body", { timeout: 30_000 });
    await schlafe(2_500);

    // Instrumentation: Ereigniskanaele in den Fensterspeicher sammeln.
    await seite.evaluate(() => {
      const sammel = [];
      for (const kanal of ["queue:geaendert", "render:fortschritt"]) {
        try {
          window.api.on(kanal, (d) =>
            sammel.push({ kanal: kanal, zeit: new Date().toISOString(), wert: d }));
        } catch (tu) {
          sammel.push({ kanal: kanal, fehler: String(tu) });
        }
      }
      window.__durchlauf = { kanaele: sammel, kanalliste: Object.keys(window.api) };
    });

    // Schritt 1 - Start: Shell steht, keine Platzhalter.
    const text = await seite.evaluate(() => document.body.innerText);
    if (text.includes("PlatzhalterInhalt")) {
      fund("Start", "echte Wurzeln", "PlatzhalterInhalt sichtbar");
    }
    for (const reiter of ["zusammenstellen", "aktionen", "vorlagen", "projekte"]) {
      const da = (await seite.$$(`[data-testid="reiter-${reiter}"]`)).length;
      if (da !== 1) {
        fund("Start", `Reiter ${reiter} genau 1x`, `gefunden: ${da}`);
      }
    }

    // ZUSATZ-Gegenprobe (Kostprobe der limitations): Tastenkuerzel-Aufrufer.
    // Reiterleiste: 4 Reiter im Code (TK 9.14.1); die Uebergabe spricht von 5 Reitern
    // - die gemessene Zahl steht im Protokoll, Widerspruch wird gemeldet.
    const reiterZahl = (await seite.$$('[role="tab"]')).length;
    const tabs = await seite.$$eval('[role="tab"]', (e) => e.map((b) => b.textContent.trim()));
    console.log(`[schritt-1] Reiter gemessen: ${reiterZahl} -> ${tabs.join(", ")}`);
    if (reiterZahl !== 4) {
      fund("Start", "4 Reiter (TK 9.14.1)", `gemessen ${reiterZahl}`, "Untersuchung", "rahmen.tsx");
    }


    // Schritt 2 - Projekte: Reiter Projekte oeffnen und messen.
    const klick = async (auswahl) => {
      try { await seite.click(auswahl, { timeout: 5_000 }); return true; }
      catch { return false; }
    };
    const stehtDa = async (auswahl) => (await seite.$$(auswahl)).length > 0;
    const innerText = () => seite.evaluate(() => document.body.innerText);

    await klick('[data-testid="reiter-projekte"]');
    await schlafe(400);
    const startHinweis = (await innerText()).includes("Kein Projekt aktiv");
    if (startHinweis) {
      console.log("[schritt-2] Start-Hinweis sichtbar (Messtelle fuer #346).");
    }

  const namen = "DurchlaufTest-" + Date.now();
  const zeilenanzahl = () =>
    seite.evaluate(() => document.querySelectorAll('[data-testid^="projekt-"]').length);
  const zeilenDavor = await zeilenanzahl();
  if (await klick('[data-testid="verwaltung-anlegen"]')) {
    const feld = await seite.$('[data-testid="dialog-anlegen-name"]');
    if (feld === null) {
      fund("Projekt anlegen", "Namensfeld im Dialog",
        "Dialog ohne Namensfeld", "BLOCKER", "projekt-verwaltung/index.tsx");
    } else {
      await seite.type('[data-testid="dialog-anlegen-name"]', namen);
      await klick('[data-testid="dialog-anlegen-best\u00e4tigen"]');
            // ZEIT FALSCH MESSEN ist selbst ein Befund: Anlegen -> Liste laden -> Projekt
      // oeffnen (Reconcile, Zeichenvorbereitung) braucht mehr als einen Mikrotakt.
      await schlafe(2_500);
// Das Anlegen öffnet automatisch den Reiter Zusammenstellen; die Projektliste
      // steht dann in einem HIDDEN-Div - innerText liest versteckte Elemente NICHT.
      // Deshalb gegen die DOM-Zeilen-Kennung messen, nicht gegen innerText.
      const diagnostik = await seite.evaluate(() => ({
        reiterAktiv: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? null,
      }));
      console.log("[diagnostik] " + JSON.stringify(diagnostik));
      // Der Anlege-Ablauf wechselt nach Zusammenstellen; gemessen wird nach dem
      // Rueckwechsel auf Projekte (das ist der echte Nutzerzustand).
      await klick('[data-testid="reiter-projekte"]');
      await schlafe(400);
      const zurueckstand = await seite.evaluate(() => ({
        reiterAktiv: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? null,
        verwaltungDa: !!document.querySelector('[data-testid="projekt-verwaltung"]'),
        inaktivDa: !!document.querySelector('[data-testid="verwaltung-inaktiv"]'),
        listeDa: !!document.querySelector('[data-testid="projektliste"]'),
        leerPlakette: !!document.querySelector('[data-testid="projektliste-leer"]'),
        nameVorhanden: (document.body.textContent ?? "").length > 0,
      }));
      console.log("[zurueckstand] " + JSON.stringify(zurueckstand));
      const zeilenNach = await zeilenanzahl();
      if (zeilenNach <= zeilenDavor) {
        fund("Projekt anlegen", `eine Zeile mehr (${namen} leicht messbar)`,
          `Zeilen vorher/nachher: ${zeilenDavor}/${zeilenNach}`,
          "Befund", "projekt-verwaltung/liste.ts oder treiber");
      } else {
        console.log(`[schritt-2] Projekt angelegt und in der Liste (${zeilenNach} Zeilen).`);
      }
        if ((await innerText()).includes("Kein Projekt aktiv")) {
          fund("Projekt anlegen", "Start-Hinweis weg, sobald ein Projekt steht",
            "Start-Hinweis bleibt stehen (#346)", "Befund", "bootstrap/start lage");
        }
      }
    } else {
      fund("Projekt anlegen", "Knopf verwaltung-anlegen",
        "nicht klickbar", "BLOCKER", "projekt-verwaltung/index.tsx");
    }

    // Schritt 3 - Zusammenstellen: Wiedergabeliste, Ausgaben, Dialog-Mounts (#342).
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    if (!(await stehtDa('[data-testid="wiedergabeliste"]'))) {
      fund("Zusammenstellen", "Wiedergabeliste sichtbar",
        "liste nicht da", "BLOCKER", "composer/index.tsx");
    }
    // Die Dialoge Render/Export sind gebaut, aber laut Basis-Abgleich ungemountet:
    // Wenn ihre Test-Kennungen im Fenster erscheinen, waere der #342-Befund eholt.
    for (const nachweis of ["render-dialog", "export-dialog"]) {
      if (await stehtDa(`[data-testid="${nachweis}"]`)) {
        fund("Zusammenstellen", `${nachweis} ungemountet (#342-Annahme)`,
          "doch im Fenster - Basis-Abgleich nachpruefen!", "Untersuchung",
          "composer/index.tsx");
      } else {
        console.log(`[schritt-3] ${nachweis} nicht im Fenster (stuetzt #342).`);
      }
    }
    const ausgabeKnopfNormalzustand = await stehtDa(
      '[data-testid="ausgabe-erneut-laden"]');
    if (ausgabeKnopfNormalzustand) {
      console.log("[schritt-3] Auffrisch-Knopf der Ausgaben im Normalzustand da.");
    } else {
      fund("Zusammenstellen", "Auffrisch-Weg der Ausgaben im Normalzustand",
        "kein Knopf (#347)", "Befund", "composer/ausgabe-liste.tsx");
    }

    // Schritt 4 - Aktionen / Vorlagen / Marken: Zustand je Reiter.
    for (const [reiter, kennung] of [
      ["aktionen", "aktion-bibliothek"],
      ["vorlagen", "vorlagen-uebersicht"],
      ["projekte", "projekt-verwaltung"],
    ]) {
      await klick(`[data-testid="reiter-${reiter}"]`);
      await schlafe(500);
      const grund = await seite.evaluate((k) => document.body.innerHTML.includes(k), kennung);
      if (!grund) {
        fund("Reiter: " + reiter, `Kennung ${kennung} im DOM`,
          "Kennung fehlt", "Untersuchung", "Reiter-Montage");
      }
    }
    // Schritt 4b - Medien-Seed: Ein mit dem mitgebündelten ffmpeg erzeugtes Testvideo
    // wird ueber queue:reiheEin importiert (derselbe Weg wie die native Import-Quelle -
    // der Dialog selbst bleibt nativ und wird nicht bedienbar gemockt). Messpartner: der
    // der queue:geaendert-Ereignis-Kanal (#348-Folge, das vereinbarte Seed-Verfahren).
    const aktivesProjektId = JSON.parse(fs.readFileSync(path.join(WURZEL, "config.json"), "utf-8")).aktivesProjektId;
    if (typeof aktivesProjektId !== "string" || aktivesProjektId.length === 0) {
      fund("Medien-Seed", "aktivesProjektId aus config.json (D3)", "nicht lesbar", "Untersuchung", "config.json");
    } else {
      const probe = path.join("/tmp", "durchlauf-probe.mp4");
      const ffmpeg = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
      await new Promise((f, r) => {
        const p = spawn(ffmpeg, ["-y", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30",
          "-t", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", probe], { stdio: "ignore" });
        p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt nichts (code " + c + ")"))));
      });
      if (!fs.existsSync(probe)) {
        fund("Medien-Seed", "Testvideo erzeugt", "kein zugreifbares Video", "BLOCKER", "ffmpeg-static");
      } else {
        // Auf den Reiter Zusammenstellen wechseln: Galerie und Wiedergabeliste
      // leben dort; im Projekte-Reiter ist die composer-Wurzel inaktiv.
      await klick('[data-testid="reiter-zusammenstellen"]');
      await schlafe(700);
      const seed = await seite.evaluate(async (pfad, projektId) => {
          const alle = window.__durchlauf.kanaele;
          const davor = alle.length;
          const ergebnis = await window.api.invoke("queue:reiheEin", {
            art: "import",
            payload: { projektId: projektId, quellPfad: pfad },
          });
          let gewartet = 0;
          while (alle.length === davor && gewartet < 20_000) {
            await new Promise((w) => setTimeout(w, 250));
            gewartet += 250;
          }
          return { dauerteMs: gewartet, ereignisse: alle.length - davor, ergebnis };
        }, probe, aktivesProjektId);
        const rein = seed.ereignisse;
        if (rein === 0) {
          fund("Ereignis-Kanale", "queue:geaendert laeufe beim Seed-Import",
            "kein Ereignis nach 20 s", "BLOCKER", "auftrags-manager/ipc-verdrahtung.ts");
        } else {
          console.log(`[schritt-4b] Seed-Import: ${rein} queue-Ereignis(se) nach ${seed.dauerteMs} ms.`);
        }
        // Das Asset leitet nach dem Import; das Buchstabier-Gefecht wartet bis 12 s.
        const eintrag = await seite.evaluate(() => new Promise((f) => {
          const start = Date.now();
          const nachsehen = () => {
            const n = document.querySelectorAll('[data-testid^="galerie-eintrag-"]').length;
            if (n > 0) return f(n);
            if (Date.now() - start > 12_000) return f(0);
            setTimeout(nachsehen, 400);
          };
          nachsehen();
        }));
        const galerieDa = await seite.evaluate(() => !!document.querySelector('[data-testid="asset-galerie"]'));
        const leerP = await seite.evaluate(() => !!document.querySelector('[data-testid="galerie-leer"]'));
        console.log(`[schritt-4b] Galerie da: ${galerieDa}, leer-Plakette: ${leerP}, Eintraege: ${eintrag}`);
        if (!galerieDa) {
          fund("Medien-Bibliothek", "asset-galerie im Reiter Zusammenstellen",
            "Galerie nicht mountet", "BLOCKER", "composer/index.tsx");
        } else if (eintrag === 0) {
          fund("Medien-Bibliothek", "galerie-eintrag nach dem Seed-Import",
            "kein Eintrag nach 12 s (" + (leerP ? "leer-Plakette an" : "kein leer") + ")",
            "Befund", "composer/asset-galerie.tsx");
        }
      }
    }

    // Schritt 5 - Abschluss: gesammelte Ereignisse und Fehler ablesen.
    const fensterstand = await seite.evaluate(() => ({
      kanaele: window.__durchlauf.kanaele,
      kanalliste: window.__durchlauf.kanalliste,
    }));
    if (fensterstand.kanalliste && fensterstand.kanalliste.length > 0) {
      console.log("[schritt-5] window.api bietet: " + fensterstand.kanalliste.join(", "));
    } else {
      fund("Ereignis-Kanaele", "window.api ablesbar", "window.api leer oder unbekannt",
        "Untersuchung", "preload/index.ts");
    }
    const aboZahl = fensterstand.kanaele.length;
    console.log(`[schritt-5] Gesammelte Ereignisse: ${aboZahl}`);

    const protokolllinie = (l) => `- ${l}`;
    const datum = new Date().toISOString();
    const zeilen = [
      "", `## Nachlauf vom ${datum} (automatisiert durch scripts/durchlauf.mjs)`, "",
      `Gemessene Reiter-Struktur: Reiter ${reiterZahl} (${tabs.join(", ")}).`,
      `Erlebte Fenster-Fehler (pageerror): ${erlebteFehler.length === 0 ? "keine" : erlebteFehler.join(" | ")}`,
      `Ereignisse gesammelt: ${aboZahl}`,
      "",
      ...funde.map((f) =>
        protokolllinie(`**${f.schwere}** ${f.schritt}: erwartet "${f.erwartet}", erkannt "${f.erkannt}"` +
          (f.ort ? ` (Ort: ${f.ort})` : ""))),
    ];
    fs.mkdirSync(path.dirname(PROTOKOLL), { recursive: true });
    fs.appendFileSync(PROTOKOLL, zeilen.join("\n") + "\n");
    console.log("[protokoll] " + PROTOKOLL + " erweitert.");

    if (erlebteFehler.length > 0) process.exitCode = 2;
  } finally {
    await browser.close().catch(() => {});
    elektron.kill();
  }
};

await main();
