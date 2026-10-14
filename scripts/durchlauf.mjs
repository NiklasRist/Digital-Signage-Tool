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
    // #340-Gegenprobe (Beobachtung s. Schritt 4b): JEDE media://-Antwort wird beobachtet.
    // Der echte Handler liefert 200/206 - der Stub antwortete 404 auf ALLES. Der Anlass
    // kommt spaeter (Seed-Import, Galerie-Bild).
    const mediaAntworten = [];
    seite.on("response", (antwort) => {
      if ((antwort.url() || "").startsWith("media://")) {
        mediaAntworten.push({ url: antwort.url(), status: antwort.status() });
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
      // Ablehnungen des Fensters FRUEH abholen: `void x()`-Wegs versenken sie
      // still (unhandled rejection feuert keinen pageerror) - ein Sammelort im
      // Fensterspeicher macht sie fuer ALLE Schritte lesbar.
      const ablehnungen = [];
      window.addEventListener('unhandledrejection', (ereignis) => {
        ablehnungen.push(String(ereignis.reason));
      });
      window.__durchlauf = { kanaele: sammel, ablehnungen, kanalliste: Object.keys(window.api) };
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

    // #342-Gegenprobe am echten Fenster: Der neue Oeffnungsknopf „Rendern..." oeffnet
    // das Render-Overlay; „Exportieren" an der Ausgabe-Liste oeffnet das Export-Overlay.
    // Abbrechen nimmt beide zurueck (kein Auftrag eingereiht).
    const renderOeffner = await stehtDa('[data-testid="composer-render-oefnen"]');
    if (renderOeffner) {
      await klick('[data-testid="composer-render-oefnen"]');
      await schlafe(400);
      if (await stehtDa('[data-testid="render-dialog"]')) {
        console.log("[schritt-3] render-dialog im Fenster nach Klick auf composer-render-oefnen (#342 behoben).");
        const abbrechen = await seite.$('[data-testid="render-dialog"] button[type="button"]:not([data-testid])');
        if (abbrechen) {
          await abbrechen.click();
          await schlafe(300);
        }
      } else {
        fund("Zusammenstellen", "render-dialog nach Klick auf composer-render-oefnen",
          "Overlay oeffnet nicht", "BLOCKER", "composer/index.tsx");
      }
    } else {
      fund("Zusammenstellen", "composer-render-oefnen im Kopf der Zusammenstellung",
        "Knopf nicht da", "BLOCKER", "composer/index.tsx");
    }
    const ausgabenBereich = await stehtDa('[data-testid="composer-ausgaben"]');
    if (ausgabenBereich) {
      const exportierKnopf = await seite.$('[data-testid="composer-ausgaben"] button');
      let gefunden = false;
      for (const knopf of await seite.$$('[data-testid="composer-ausgaben"] button')) {
        const text = await seite.evaluate((e) => e.textContent, knopf);
        if (text === "Exportieren") {
          gefunden = true;
          await knopf.click();
          await schlafe(400);
          break;
        }
      }
      if (gefunden && (await stehtDa('[data-testid="export-dialog"]'))) {
        console.log("[schritt-3] export-dialog im Fenster nach Klick auf Exportieren (#342 behoben).");
        const abbrechen = await seite.$('[data-testid="export-dialog-abbrechen"]');
        if (abbrechen) {
          await abbrechen.click();
          await schlafe(300);
        }
      } else {
        const leerText = await seite.evaluate(() => {
          const bereich = document.querySelector('[data-testid="composer-ausgaben"]');
          return bereich === null ? null : bereich.textContent ?? "";
        });
        if (leerText !== null && leerText.includes("Noch keine Ausgabedatei")) {
          console.log("[schritt-3] kein Exportieren-Knopf: Liste leer (geladen) - korrekt.");
          fund("Zusammenstellen", "export-dialog nach Klick auf Exportieren",
            "MANUELL (User-Entscheidung 13.10.2026): der Zielordner-Dialog ist NATIV - der Treiber bedient ihn NICHT und mocked ihn nicht; der Export-Weg bleibt Hand-Abgleich.",
            "MANUELL", "composer/index.tsx");
        } else {
          fund("Zusammenstellen", "export-dialog nach Klick auf Exportieren an der Ausgabe-Liste",
            gefunden ? "Overlay oeffnet nicht" : "kein Exportieren-Knopf", "BLOCKER",
            "composer/index.tsx");
        }
      }
    } else {
      fund("Zusammenstellen", "Ausgaben-Bereich (composer-ausgaben) sichtbar",
        "Bereich nicht da", "BLOCKER", "composer/index.tsx");
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
      // Der Reiter-Klick wird IM Fensterskript FRISCH ermittelt: die Reiter-
      // Leiste re-rendert waehrend der Seed-/Dialog-Schritte, und ein
      // Koordinaten-Click aus dem Treiber kann still daneben liegen
      // (derselbe Befund-Muster #403 wie am Bedienweg-Knopf).
      const reiterKlick = await seite.evaluate((name) => {
        const tab = document.querySelector(`[data-testid="reiter-${name}"]`);
        if (tab === null) return false;
        tab.click();
        return true;
      }, reiter);
      console.log(`[schritt-4] Reiter-Klick ${reiter}: ${String(reiterKlick)}`);
      await schlafe(700);
      if (reiter === "vorlagen") {
        // #404-Rest (c) - Vorlagen-Editor-Sitzung am Treiber: aus der Uebersicht
        // heraus die ERSTE Vorlage zur Bearbeitung oeffnen (Frischgriff im
        // Fensterskript; Koordinaten-Klicks trafen hier genauso still daneben
        // wie am Bedienweg-Knopf und an der Reiter-Leiste).
        const bearbeitenKlick = await seite.evaluate(() => {
          const zeile = document.querySelector('[data-testid^="vorlage-bearbeiten-"]');
          if (zeile === null) return false;
          zeile.click();
          return true;
        });
        console.log(`[schritt-4] Editor-Sitzung oeffnen: ${String(bearbeitenKlick)}`);
        await schlafe(1_200);
        const sitzungsDiag = await seite.evaluate(() => ({
          arbeitskopieKopf: !!document.querySelector('[data-testid="arbeitskopie-kopf"]'),
          vorlagenUebersichtNoch: !!document.querySelector('[data-testid="vorlagen-uebersicht"]'),
          inspektor: !!document.querySelector('[data-testid="inspektor"]'),
        }));
        console.log("[schritt-4] Vorlagen-Sitzungs-Diagnostik: " + JSON.stringify(sitzungsDiag));
        if (!bearbeitenKlick) {
          fund("Vorlagen-Editor", "Bearbeiten-Knopf an der Uebersicht",
            "Kein Zeile-Knopf gefunden", "Untersuchung", "vorlagen-editor/index.tsx");
        } else if (!sitzungsDiag.arbeitskopieKopf) {
          fund("Vorlagen-Editor", "arbeitskopie-kopf nach Bearbeiten (#404 Rest c)",
            `Sitzungsdiag: ${JSON.stringify(sitzungsDiag)}`, "Untersuchung", "vorlagen-editor/index.tsx");
        } else {
          console.log("[schritt-4] arbeitskopie-kopf im Fenster (Editor-Sitzung laueft).");
        }
      }

      const reiterDiag = await seite.evaluate(() => ({
        reiterAktiv: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? null,
        aktionEditorWurzel: !!document.querySelector('[data-testid="aktion-editor-root"]'),
        aktionBibliothek: !!document.querySelector('[data-testid="aktion-bibliothek"]'),
        vorlagenUebersicht: !!document.querySelector('[data-testid="vorlagen-uebersicht"]'),
        arbeitskopieKopf: !!document.querySelector('[data-testid="arbeitskopie-kopf"]'),
        projektVerwaltung: !!document.querySelector('[data-testid="projekt-verwaltung"]'),
        keineAktion: (document.body.textContent ?? "").includes("Kein Projekt aktiv"),
      }));
      console.log(`[schritt-4] Reiter ${reiter}: ` + JSON.stringify(reiterDiag));
      const grund = await seite.evaluate((k) => document.body.innerHTML.includes(k), kennung);
      // Sonderfall Vorlagen: Ist die Sitzung geoeffnet, steht der EDITOR statt
      // der Uebersicht im Fenster - der Bestand der Kennung gilt dann ueber den
      // arbeitskopie-kopf, nicht als Vermutung.
      const sitzungOffen = await seite.evaluate(
        () => !!document.querySelector('[data-testid="arbeitskopie-kopf"]'),
      );

      if (!grund && !(reiter === "vorlagen" && sitzungOffen)) {
        fund("Reiter: " + reiter, `Kennung ${kennung} im DOM`,
          `Kennung fehlt (Diagnostik: ${JSON.stringify(reiterDiag)})`, "Untersuchung", "Reiter-Montage");
      }
    }
    // Schritt 4a - Standardmarke je Projekt-Zeile (#324, TK 9.14.3): die Auswahl ist
    // ein echtes <select> mit aria-label "Standardmarke". Der Wechsel wird IM
    // Fensterskript gesetzt (React liest die Aenderung ueber den nativen
    // HTMLSelectElement-Wert) und der neue Wert wird danach gemessen.
    const wechsleMarke = async () => {
      return await seite.evaluate(() => {
        const auswahl = document.querySelector('select[aria-label="Standardmarke"]')
        if (auswahl === null) return { da: false }
        const davor = auswahl.value
        const eineAndere = [...auswahl.options].find((o) => o.value !== "" && o.value !== davor)
        if (eineAndere === undefined) return { da: true, davor, leer: true }
        const trage = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set
        trage.call(auswahl, eineAndere.value)
        auswahl.dispatchEvent(new Event("change", { bubbles: true }))
        return { da: true, davor, ziel: eineAndere.value, leer: false }
      });
    };
    const pruefeWert = async () => {
      return await seite.evaluate(() => {
        const auswahl = document.querySelector('select[aria-label="Standardmarke"]')
        return { wert: auswahl === null ? null : auswahl.value };
      });
    };
    const markeVersuch1 = await wechsleMarke();
    console.log("[schritt-4a] Auswahl-Bedienung: " + JSON.stringify(markeVersuch1));
    if (!markeVersuch1.da) {
      fund("Standardmarke", "die Auswahl je Projekt-Zeile (#324)",
        "kein select mit aria-label Standardmarke", "Untersuchung", "projekt-verwaltung");
    } else if (markeVersuch1.leer === false) {
      await schlafe(2_500);
      const ablehnungenA = await seite.evaluate(() => window.__durchlauf?.ablehnungen ?? []);
      console.log("[schritt-4a] Ablehnungen bis dahin: " + JSON.stringify(ablehnungenA));
      const listenDiag = await seite.evaluate(async () => {
        const antwort = await window.api.invoke("project:listeProjekte");
        if (!antwort.ok) return { listenfehler: JSON.stringify(antwort.fehler ?? {}) };
        const erster = antwort.wert[0] ?? null;
        return erster === null ? { erster: null } : { erster: { id: erster.id, marke: erster.standardMarkeId } };
      });
      console.log("[schritt-4a] Frische Liste: " + JSON.stringify(listenDiag));
      const danach = await pruefeWert();
      console.log("[schritt-4a] Bedienelement danach: " + JSON.stringify(danach));
      if (danach.wert !== markeVersuch1.ziel) {
        fund("Standardmarke", "der Wechsel steht im Bedienelement (#324)",
          `gewaehlt ${markeVersuch1.ziel}, gezeigt ${String(danach.wert)}`, "Befund",
          "projekt-verwaltung/standardmarke.tsx");
      } else {
        console.log("[schritt-4a] Standardmarke-Wechsel GEMESSEN am echten select (davor/nach).");
      }
    } else {
      console.log("[schritt-4a] Nur eine Marke im Bestand - der Wechsel braucht eine zweite (Seed-Weg ungetestet, UI-Weg folgt).");
    }

    // Schritt 4b - Medien-Seed: Ein mit dem mitgebundelten ffmpeg erzeugtes Testvideo
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
        // #340/#407-Gegenprobe: media://-Handler statt Stub. Anlass: das Seed-Video
        // kommt in die Wiedergabeliste - ueber den ECHTEN Bedienweg "Zur Liste
        // hinzufuegen" der Bibliotheksansicht (#227, in der Wurzel gemountet, siehe
        // #407-Nachtrag): Der Baustein #123 versorgt die Sicht selbst
        // (setzeListe in composer/element-hinzufuegen.ts). Der Zugriff auf das Video
        // ging frueher als Roh-IPC-Ruf - das lag AN DER FALSCHEN Naht und rief
        // keine Sicht-Pflege (Architektur: KEIN Auffrischen aus dem Main).
        const assetId = await seite.evaluate(() => {
          const eintrag = document.querySelector('[data-testid^="medium-"]');
          return eintrag === null ? null : eintrag.getAttribute("data-testid").replace("medium-", "");
        });
        const bibliothekDa = await seite.evaluate(() => !!document.querySelector('[data-testid="bibliothek"]'));
        console.log(`[schritt-4b] Bibliotheksansicht gemountet: ${bibliothekDa} (Medium-Kennung: ${assetId})`);
        if (!bibliothekDa) {
          fund("Bibliotheksansicht", "bibliothek in der Wurzel gemountet (#407)",
            "Ansicht fehlt im Fenster", "BLOCKER", "composer/index.tsx");
        } else {
          // Der Knopf "Zur Liste hinzufuegen" liegt je Medienzeile - hier ist das
          // Seed-Video das EINZIGE Medium, also die erste Zeile. Geklickt wird IM
          // Fensterskript FRISCH ermittelt: Ein vorab geholtes Element-Handle kann
          // still auf verschobene Koordinaten zielen (React re-render, Befund-Muster
          // #403) - der Frischgriff umgeht genau das. Abgewiesene Rufe hoebt
          // `void hinzufuegen` still weg; sie werden gesammelt und belegt.
          await seite.evaluate(() => {
            window.__durchlauf.ablehnungen = [];
            window.addEventListener('unhandledrejection', (ereignis) => {
              window.__durchlauf.ablehnungen.push(String(ereignis.reason));
            });
          });
          const klickDa = await seite.evaluate(() => {
            const zeile = document.querySelector('[data-testid^="medium-"]');
            const knopf = zeile === null
              ? null
              : [...(zeile.querySelectorAll('button') ?? [])]
                  .find((k) => k.textContent === "Zur Liste hinzufügen");
            if (knopf === null) return false;
            knopf.click();
            return true;
          });
          console.log("[schritt-4b] Klick am echten Bedienweg: " + String(klickDa));
          if (!klickDa) {
            fund("Sicht-Aktualitaet", 'Knopf "Zur Liste hinzufuegen" an der Medienzeile',
              "Knopf nicht gefunden", "BLOCKER", "composer/bibliothek-ansicht.tsx");
          }
          await schlafe(3_500);

          const listeDiag = await seite.evaluate(() => ({
            zeilen: document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
            listeDa: !!document.querySelector('[data-testid="wiedergabeliste"]'),
            leerDa: !!document.querySelector('[data-testid="wiedergabeliste-leer"]'),
            ladefehler: document.querySelector('[data-testid="composer-ladefehler"]')?.textContent ?? null,
            meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
            ablehnungen: window.__durchlauf.ablehnungen ?? [],
          }));
          console.log("[schritt-4b] Listen-Diagnostik: " + JSON.stringify(listeDiag));
          if (listeDiag.zeilen === 0) {
            fund("Sicht-Aktualitaet", "Liste zeigt das ueber den Bedienweg hinzugefuegte Element (#407)",
              "Knopf geklickt, aber 0 Zeilen in der Ansicht", "Befund", "composer/index.tsx");
          } else {
            console.log(`[schritt-4b] Wiedergabeliste zeigt ${listeDiag.zeilen} Zeile(n) nach dem echten Bedienweg (#407 belegt).`);
          }
        }
        // #340-Gegenprobe (media-Antworten werden an der Kopf-Messstelle beobachtet): Ein
        // BILD-Seed laesst die Galerie <img src="media://..."> rendern - die Anfrage
        // streift den echten Handler (der Stub antwortete 404 auf ALLES).
        const probeBild = path.join("/tmp", "durchlauf-probe.png");
        const ffmpeg2 = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
        await new Promise((f, r) => {
          const p = spawn(ffmpeg2, ["-y", "-f", "lavfi", "-i", "testsrc2=size=120x90:rate=1",
            "-frames:v", "1", probeBild], { stdio: "ignore" });
          p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt kein Bild (code " + c + ")"))));
        });
        await seite.evaluate(async (pfad2, projektId2) => {
          return window.api.invoke("queue:reiheEin", {
            art: "import",
            payload: { projektId: projektId2, quellPfad: pfad2 },
          });
        }, probeBild, aktivesProjektId);
        // Warten, bis die queue:geaendert-Ereignisse durchlaufen sind und die Galerie fragt.
        await schlafe(3_500);
        const gut = mediaAntworten.filter((a) => a.status < 400).length;
        const schief = mediaAntworten.filter((a) => a.status >= 400).length;
        console.log(`[schritt-4b] media://-Gegenprobe: ${gut} geladen(e), ${schief} abgelehnt(e) (${mediaAntworten.map((a) => a.status).join(", ") || "keine Anfrage"})`);
        if (gut === 0) {
          fund("media://-Protokoll", "media://-Anfrage liefert Bytes (#340)",
            mediaAntworten.length === 0
              ? "keine media://-Anfrage im Lauf - Gegenprobe unbestaetigt"
              : "alle media://-Anfragen wurden abgelehnt (Stub oder Pruefung) - kein Bild/Video laedt",
            "BLOCKER", "src/main/index.ts, Schritt 4");
        }
      }
    }

    // Schritt 4c - Render-Lauf ueber den echten Dialog (#404-Rest, Teil a):
    // Seed-Video liegt in D1, der Dialog (#342) ist montiert. Der Render liest die
    // SICHT (inhalt) - und #407 meldet, dass direkte D1-Mutationen die Sicht nicht
    // erreichen. Der Lauf erzwinge nichts; er misst, was im echten Fenster passiert.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    const renderLaufName = "durchlauf-render-" + Date.now();
    if (!(await klick('[data-testid="composer-render-oefnen"]'))) {
      fund("Render-Lauf", "composer-render-oefnen betaetigbar (#342)",
        "Knopf nicht klickbar", "BLOCKER", "composer/index.tsx");
    } else if (!(await stehtDa('[data-testid="render-dialog"]'))) {
      const oefnerDiag = await seite.evaluate(() => ({
        oefnerDa: !!document.querySelector('[data-testid="composer-render-oefnen"]'),
        oefnerGesperrt: document.querySelector('[data-testid="composer-render-oefnen"]')?.disabled ?? null,
      }));
      console.log("[schritt-4c] Oefner-Diagnostik: " + JSON.stringify(oefnerDiag));
      fund("Render-Lauf", "render-dialog nach Klick auf composer-render-oefnen",
        "Overlay oeffnet nicht", "BLOCKER", "composer/index.tsx");
    } else if (!(await stehtDa('[data-testid="render-dialog-name"]'))) {
      fund("Render-Lauf", "Namensfeld render-dialog-name",
        "Feld fehlt", "BLOCKER", "composer/render-dialog.tsx");
    } else {
      // FA-22: Name OHNE Endung tippen; der Dialog vorprueft je Tastendruck.
      await seite.click('[data-testid="render-dialog-name"]');
      await seite.type('[data-testid="render-dialog-name"]', renderLaufName);
      const gesperrt = await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
        if (knopf === null) return null;
        return { gesperrt: knopf.disabled,
          befund: document.querySelector('[data-testid="render-dialog-befund"]')?.textContent ?? null };
      });
      if (gesperrt === null || gesperrt.gesperrt) {
        fund("Render-Lauf", "Ausloeser betaetigbar nach Namenseingabe",
          "knopf gesperrt: " + JSON.stringify(gesperrt), "Untersuchung",
          "composer/render-dialog.tsx");
      } else {
        // Der Ausloeser wird IM Fensterskript frisch geklickt (dasselbe Muster wie
        // der Bedienweg am Medium - verschobene Koordinaten werden vermieden);
        // danach zeigt die Diagnostik, WO der Riecher geblieben ist.
        await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
          if (knopf !== null) knopf.click();
        });
        await schlafe(3_000);
        const ausloesDiag = await seite.evaluate(() => ({
          dialogNoch: !!document.querySelector('[data-testid="render-dialog"]'),
          knopfGesperrt: document.querySelector('[data-testid="render-dialog-ausloeser"]')?.disabled ?? null,
          meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
          kanaele: (window.__durchlauf?.kanaele ?? []).map((e) => e.kanal),
          ablehnungen: window.__durchlauf?.ablehnungen ?? [],
        }));
        console.log("[schritt-4c] Ausloes-Diagnostik: " + JSON.stringify(ausloesDiag));
        // Der Fortschritt reist ueber render:fortschritt (Ereignis-Kanal, #348-Folge)
        // - am Fenster-Sammelort beobachtet, nicht geraten.
        const fortschritte = await seite.evaluate(() => new Promise((f) => {
          const start = Date.now();
          const nachsehen = () => {
            const n = (window.__durchlauf?.kanaele ?? [])
              .filter((e) => e.kanal === "render:fortschritt").length;
            if (n > 0) return f(n);
            if (Date.now() - start > 45_000) return f(0);
            setTimeout(nachsehen, 500);
          };
          nachsehen();
        }));
        console.log(`[schritt-4c] render:fortschritt-Ereignisse: ${fortschritte}`);
        // #347-Beleg: Die Ausgabe-Liste zeigt die Datei, OHNE dass ein Knopf
        // betaetigt wird (der Nachlauf #199 frischt nach render-Erfolg auf).
        const dateiInListe = await seite.evaluate((name) => new Promise((f) => {
          const start = Date.now();
          const nachsehen = () => {
            const liste = document.querySelector('[data-testid="composer-ausgaben"]');
            if (liste !== null && liste.textContent.includes(name)) return f(true);
            if (Date.now() - start > 45_000) return f(false);
            setTimeout(nachsehen, 500);
          };
          nachsehen();
        }), renderLaufName);
        if (fortschritte === 0 && !dateiInListe) {
          const laufDiag = await seite.evaluate(() => ({
            zeilen: document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
            meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
            ladefehler: document.querySelector('[data-testid="composer-ladefehler"]')?.textContent ?? null,
            ablehnungen: window.__durchlauf?.ablehnungen ?? [],
          }));
          console.log("[schritt-4c] Lauf-Diagnostik: " + JSON.stringify(laufDiag));
          fund("Render-Lauf", "render:fortschritt beim echten Render-Lauf (#404 Schritt 5/6)",
            "kein Fortschritts-Ereignis nach 45 s und keine Ausgabedatei in der Liste",
            "Untersuchung", "composer/index.tsx / auftrags-manager");
        } else if (!dateiInListe) {
          fund("Render-Lauf", `Ausgabe-Liste zeigt ${renderLaufName} ohne Knopfdruck (#347)`,
            `${fortschritte} Fortschritts-Ereignis(se), aber die Datei erscheint nicht binnen 45 s`,
            "Befund", "composer/ausgabe-liste.tsx (#199 Nachlauf)");
        } else {
          console.log(`[schritt-4c] Render-Lauf: Ausgabe "${renderLaufName}" steht in der Liste OHNE Auffrisch-Klick (#347 belegt).`);
        }
      }
      // Das Overlay wieder schliessen, falls der Lauf nicht ausloesete.
      const overlayOffen = await seite.$('[data-testid="render-dialog"] button[type="button"]:not([data-testid])');
      if (overlayOffen) {
        await overlayOffen.click();
        await schlafe(300);
      }
    }

    // Schritt 4e - KontextMenue im echten Fenster (#408): Rechtsklick auf die
    // ERSTE Zeile oeffnet das Menue (Fraschgriff im Fensterskript), dann ruft der
    // Treiber "Duplikat am Listenende anfuegen" - durch den Baustein #123, der die
    // Sicht selbst versorgt. GEMESSEN: Zeilen davor/danach.
    const zeilenDavor4e = await seite.evaluate(
      () => document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
    );
    const menueOeffnen = await seite.evaluate(() => {
      const zeile = document.querySelector('[data-testid="wiedergabeliste-zeile"]');
      if (zeile === null) return false;
      const rechteck = zeile.getBoundingClientRect();
      zeile.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true, cancelable: true,
        clientX: rechteck.left + 4, clientY: rechteck.top + 4,
      }));
      return true;
    });
    console.log(`[schritt-4e] Kontextmenue-Kaemme: ${String(menueOeffnen)} (Zeilen davor: ${zeilenDavor4e})`);
    if (!menueOeffnen) {
      fund("KontextMenue", "die erste Zeile fuer den Rechtsklick (#408)",
        "keine Wiedergabeliste-Zeile im Fenster", "Untersuchung", "composer/liste-ansicht.tsx");
    } else {
      await schlafe(600);
      const menueDa = await seite.evaluate(() => ({
        menue: !!document.querySelector('[data-testid="kontext-menue"]'),
        duplikat: !!document.querySelector('[data-testid="menue-duplikat"]'),
      }));
      console.log("[schritt-4e] Menue-Diagnostik: " + JSON.stringify(menueDa));
      if (!menueDa.menue || !menueDa.duplikat) {
        fund("KontextMenue", "kontext-menue samt menue-duplikat nach dem Rechtsklick (#408)",
          `Menue-Diagn: ${JSON.stringify(menueDa)}`, "Befund", "composer/index.tsx");
      } else {
        await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="menue-duplikat"]');
          if (knopf !== null) knopf.click();
        });
        await schlafe(3_500);
        const zeilenDanach4e = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
        );
        console.log(`[schritt-4e] Zeilen nach dem Duplikat: ${zeilenDanach4e}`);
        if (zeilenDanach4e > zeilenDavor4e) {
          console.log("[schritt-4e] Duplikat GEMESSEN: die Zeile wuchs am echten Menue (#408 belegt).");
        } else {
          fund("KontextMenue", "Duplikat verlaengert die Liste (#408/#123)",
            `Zeilen davor/nachher: ${zeilenDavor4e}/${zeilenDanach4e}`, "Befund", "composer/kontext-menu.tsx");
        }
        // Das Menue selbst: nach einem Menue-Akt ist es geschlossen (tue() ruft schliesse).
        // #408-Zweitmessung (User-Entscheidung 14.10.2026): der ENTFERNEN-Weg wird
        // am Treiber-Projekt ausprobiert - die Liste ist 2 Zeilen (Seed + Duplikat);
        // "Element entfernen" auf der ERSTEN Zeile muss die Liste wieder auf 1 bringen.
        await schlafe(600);
        const entfernenKontext = await seite.evaluate(() => {
          const zeile = document.querySelector('[data-testid="wiedergabeliste-zeile"]');
          if (zeile === null) return false;
          const rechteck = zeile.getBoundingClientRect();
          zeile.dispatchEvent(new MouseEvent("contextmenu", {
            bubbles: true, cancelable: true,
            clientX: rechteck.left + 4, clientY: rechteck.top + 4,
          }));
          return true;
        });
        await schlafe(600);
        const entfernenDa = await seite.evaluate(() => !!document.querySelector('[data-testid="menue-entfernen"]'));
        console.log(`[schritt-4e] Entfernen-Menue: offen=${String(entfernenKontext && entfernenDa)}`);
        if (!entfernenDa) {
          fund("KontextMenue", "menue-entfernen nach dem zweiten Rechtsklick (#408)",
            "Entfernen-Eintrag fehlt", "Befund", "composer/kontext-menu.tsx");
        } else {
          await seite.evaluate(() => {
            const knopf = document.querySelector('[data-testid="menue-entfernen"]');
            if (knopf !== null) knopf.click();
          });
          await schlafe(3_500);
          const zeilenNachEntfernen = await seite.evaluate(
            () => document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
          );
          console.log(`[schritt-4e] Zeilen nach dem Entfernen: ${zeilenNachEntfernen}`);
          if (zeilenNachEntfernen < zeilenDanach4e) {
            console.log("[schritt-4e] Entfernen GEMESSEN: die Liste schrumpft am echten Menue (#408 belegt).");
          } else {
            fund("KontextMenue", "Entfernen verkleinert die Liste (#408/#124)",
              `Zeilen davor/nachher: ${zeilenDanach4e}/${zeilenNachEntfernen}`, "Befund", "composer/kontext-menu.tsx");
          }
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
