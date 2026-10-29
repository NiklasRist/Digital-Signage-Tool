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
import ffprobeStatic from "ffprobe-static";

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

  // EIN Start (22.10.2026): Bis hierher startete diese Datei Electron zweimal (spawn UND
  // puppeteer.launch). Die Einzelinstanz liess einen der beiden gewinnen; verlor der
  // gesteuerte Prozess, starb mitten im Lauf der Frame ("detached Frame",
  // "Requesting main frame too early", stummer Haenger). Puppeteer besitzt ihn jetzt allein.
  const browser = await puppeteer.launch({
    executablePath: ELEKTRON,
    args: [path.join(WURZEL, "dist", "main", "index.cjs")],
    defaultViewport: null,
  });

  // Am Funktionsumfang, damit das finally ihn setzen kann.
  let abschluss = false;
  try {
    const [seite] = await browser.pages();
    const erlebteFehler = [];
    seite.on("pageerror", (tu) => erlebteFehler.push(String(tu)));
    seite.on("error", (tu) => console.log("[fenster crash] " + String(tu)));
    seite.on("close", () => {
      // Nur ein UNERWARTETES Schliessen ist ein Befund fuer das Log; der Abschluss
      // schliesst den Browser selbst (finally).
      if (!abschluss) console.log("[fenster zu] - vor dem Ende des Durchlaufs");
    });
    // B5 (Gate-Blindstelle, behoben 22.10.2026): Ein `console.error` im Fenster ist ein
    // BEFUND, keine Randnotiz. Am 20.10.2026 lief "Maximum update depth exceeded" durch
    // ein gruenes Gate, weil der Treiber die Meldung nur druckte. Jede eindeutige
    // Fehlermeldung zaehlt genau einmal (React wiederholt sie sonst pro Render).
    const geseheneFensterFehler = new Set();
    seite.on("console", (meldung) => {
      if (meldung.type() === 'error') {
        const text = meldung.text();
        if (!geseheneFensterFehler.has(text)) {
          geseheneFensterFehler.add(text);
          // Die QUELLE gehoert in den Befund: "Failed to load resource: 404" ohne URL
          // laesst offen, ob ein Medium, eine Marke oder eine Schrift fehlt (22.10.2026).
          const quelle = meldung.location?.()?.url ?? "";
          fund("Fenster-Konsole", "kein console.error im Fenster",
            quelle === "" ? text : `${text} [${quelle}]`, "Befund", "Renderer/React");
        }
      } else if (meldung.type() === 'warning') {
        console.log(`[fenster warning] ${meldung.text()}`);
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
    if (reiterZahl !== 5) {
      fund("Start", "5 Reiter (TK 9.14.1)", `gemessen ${reiterZahl}`, "Untersuchung", "rahmen.tsx");
    }


    // Schritt 2 - Projekte: Reiter Projekte oeffnen und messen.
    const klick = async (auswahl) => {
      try { await seite.click(auswahl, { timeout: 5_000 }); return true; }
      catch { return false; }
    };
    const stehtDa = async (auswahl) => (await seite.$$(auswahl)).length > 0;
    // Projekt ueber die LISTE neu oeffnen (der einzige Weg, der den Reconcile ausloest).
    // Auf die Zeile WARTEN statt 400 ms zu raten: Unter Last ist die Liste noch nicht
    // gerendert, der Klick liefe ins Leere und das Fenster behielte den ALTEN Stand
    // (gemessen am 19.10.2026 in Schritt 4h nach dem #438-Seed).
    const oeffneUeberListe = async (pid) => {
      await klick('[data-testid="reiter-projekte"]');
      const frist = Date.now() + 8_000;
      let da = false;
      while (Date.now() < frist) {
        da = await stehtDa(`[data-testid="projekt-${pid}"]`);
        if (da) break;
        await schlafe(200);
      }
      if (!da) return false;
      await seite.evaluate((id) => {
        const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
        const knopf = zeile === null ? null : zeile.querySelector("button");
        if (knopf !== null) knopf.click();
      }, pid);
      await schlafe(2_500);
      return true;
    };
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
      // #423 (User 15.10.2026): Video zuerst, PFLICHT - kein Haekchen mehr. Ein Klick auf
      // „Anlegen" oeffnet jetzt einen NATIVEN Video-Dialog; der Treiber bedient ihn NICHT
      // (MANUELL, wie der Export). Gemessen wird: kein Haekchen; dann Abbrechen.
      if (await stehtDa('[data-testid="dialog-anlegen-video"]')) {
        fund("Projekt anlegen", 'kein "Video importieren"-Haekchen mehr (#423)',
          "Haekchen ist noch da", "Befund", "projekt-verwaltung/index.tsx");
      } else {
        console.log("[schritt-2] Anlegen-Dialog ohne Haekchen (Video zuerst, #423); Video-Dialog = NATIV (MANUELL).");
      }
      await seite.evaluate(() => {
        const dlg = document.querySelector('[data-testid="dialog-anlegen"]');
        const ab = dlg === null ? null : [...dlg.querySelectorAll('button')].find((b) => b.textContent === 'Abbrechen');
        if (ab) ab.click();
      });
      await schlafe(300);

      // Den UI-Anlege-Weg selbst kann der Treiber nicht fahren (nativer Video-Dialog).
      // Er legt das Projekt per IPC-Seed an und OEFFNET es dann ueber die Projektliste
      // (der echte UI-Weg wechselt nach Zusammenstellen) - so bleibt der Rest messbar.
      const neueId = await seite.evaluate(async (name) => {
        const ant = await window.api.invoke("project:erstelleProjekt", { name });
        return ant && ant.ok ? ant.wert.id : null;
      }, namen);
      if (neueId === null) {
        fund("Projekt anlegen", "Projekt per IPC anlegen (Messweg)",
          "erstelleProjekt ohne Ergebnis", "BLOCKER", "project-store/erstelle-projekt.ts");
      } else {
        await klick('[data-testid="verwaltung-erneut-laden"]');
        await schlafe(700);
        const geoeffnet = await seite.evaluate((id) => {
          const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
          const knopf = zeile === null ? null : zeile.querySelector('button');
          if (knopf === null) return false;
          knopf.click();
          return true;
        }, neueId);
        console.log("[schritt-2] Projekt ueber die Liste geoeffnet: " + String(geoeffnet));
        await schlafe(2_500);
        await klick('[data-testid="reiter-projekte"]');
        await schlafe(400);
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
      }
    } else {
      fund("Projekt anlegen", "Knopf verwaltung-anlegen",
        "nicht klickbar", "BLOCKER", "projekt-verwaltung/index.tsx");
    }

    // Schritt 3 - Zusammenstellen: Zeitleiste (PRIMÄR seit #414, Weiche B), Ausgaben,
    // Dialog-Mounts (#342). Die #248-Wiedergabeliste liegt hinter dem Umschalter.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    // #424: Die Undo/Redo-Pfeile sitzen in der Reiterleiste der Shell.
    if (await stehtDa('[data-testid="undo-pfeil"]')) {
      console.log("[schritt-3] Undo/Redo-Pfeile in der Reiterleiste (#424).");
    } else {
      fund("Undo/Redo-Pfeile", "die Pfeile sind in der Reiterleiste sichtbar (#424)",
        "undo-pfeil fehlt", "Befund", "app-shell/undo-pfeile.tsx");
    }
    if (!(await stehtDa('[data-testid="zeitleiste"]'))) {
      fund("Zusammenstellen", "Zeitleiste im Fenster (primäre Ansicht seit #414)",
        "zeitleiste nicht da", "BLOCKER", "composer/index.tsx");
    } else {
      const kanteRuhelageSichtbar = await seite.evaluate(
        () => !!document.querySelector('[data-testid="zeitleiste-kante-0"]'),
      );
      if (kanteRuhelageSichtbar) {
        fund("Zeitleiste", "die Kanten sind in der Ruhelage UNSICHTBAR (#412)",
          "Kante-0 in der Ruhelage sichtbar", "Befund", "composer/zeitleiste.tsx");
      } else {
        console.log("[schritt-3] Zeitleiste da; die Kanten sind in der Ruhelage unsichtbar (#412).");
      }
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
    // Schritt 4a0 - FA-23: eine ZWEITE Marke ueber die ECHTE Oberflaeche anlegen.
    // Ohne sie kann 4a den Standardmarken-Wechsel nicht fahren (Bestand war genau eine
    // Marke - B2 der Matrix). Der neue Name ist je Lauf eindeutig; die Marke wird in 4a2
    // wieder geloescht, damit der Bestand nicht waechst.
    const neueMarkeName4a0 = "DurchlaufMarke-" + Date.now();
    let neueMarkeId4a0 = null;
    {
      const markenReiter4a0 = await seite.evaluate(() => {
        const tab = document.querySelector('[data-testid="reiter-marken"]');
        if (tab === null) return false;
        tab.click();
        return true;
      });
      await schlafe(1_200);
      const listeDa4a0 = await stehtDa('[data-testid="marken-liste"]');
      console.log(`[schritt-4a0] Marken-Reiter: geklickt=${String(markenReiter4a0)}, Liste=${String(listeDa4a0)}.`);
      if (!markenReiter4a0 || !listeDa4a0) {
        fund("Standardmarke (FA-23)", "der Marken-Reiter laesst sich oeffnen und zeigt die Liste",
          `geklickt=${String(markenReiter4a0)}, Liste=${String(listeDa4a0)}`,
          "Befund", "app-shell/rahmen.tsx");
      } else {
        const vorher4a0 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="marken-liste"] > div > div > button').length,
        );
        await seite.click('[data-testid="marken-liste"] input');
        await seite.type('[data-testid="marken-liste"] input', neueMarkeName4a0, { delay: 8 });
        await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="erstelle-eigenstaendige-marken-namen"]');
          if (knopf !== null) knopf.click();
        });
        const frist4a0 = Date.now() + 15_000;
        let nachher4a0 = vorher4a0;
        while (Date.now() < frist4a0) {
          nachher4a0 = await seite.evaluate(
            () => document.querySelectorAll('[data-testid="marken-liste"] > div > div > button').length,
          );
          if (nachher4a0 > vorher4a0) break;
          await schlafe(300);
        }
        const fehler4a0 = await seite.evaluate(
          () => document.querySelector('[data-testid="marken-neu-fehler"]')?.textContent ?? null,
        );
        console.log(`[schritt-4a0] Marken vorher/nachher: ${vorher4a0}/${nachher4a0}, Fehler=${String(fehler4a0)}.`);
        if (nachher4a0 <= vorher4a0) {
          fund("Standardmarke (FA-23)", 'die zaehlende Marke "Neue Marke" legt eine zweite Marke an (FA-24)',
            `Marken ${vorher4a0}->${nachher4a0}, Fehler: ${String(fehler4a0)}`,
            "Befund", "marken-editor/index.tsx");
        } else {
          console.log(`[schritt-4a0] Zweite Marke GEMESSEN: "${neueMarkeName4a0}" (${vorher4a0} -> ${nachher4a0}).`);
          neueMarkeId4a0 = await seite.evaluate(async (name) => {
            const antwort = await window.api.invoke("marken:listeMarken");
            if (!antwort || !antwort.ok) return null;
            const treffer = antwort.wert.find((m) => m.name === name);
            return treffer === undefined ? null : treffer.id;
          }, neueMarkeName4a0);
        }
      }
      // Zurueck zum Projekte-Reiter - 4a misst am echten <select>.
      await seite.evaluate(() => {
        const tab = document.querySelector('[data-testid="reiter-projekte"]');
        if (tab !== null) tab.click();
      });
      await schlafe(1_200);
    }

    // Schritt 4a - Standardmarke je Projekt-Zeile (#324, TK 9.14.3): die Auswahl ist
    // ein echtes <select> mit aria-label "Standardmarke". Der Wechsel wird IM
    // Fensterskript gesetzt (React liest die Aenderung ueber den nativen
    // HTMLSelectElement-Wert) und der neue Wert wird danach gemessen.
    const wechsleMarke = async (zielId) => {
      return await seite.evaluate((ziel) => {
        const auswahl = document.querySelector('select[aria-label="Standardmarke"]')
        if (auswahl === null) return { da: false }
        const davor = auswahl.value
        // GEZIELT die Marke aus 4a0 - nicht "irgendeine andere": Im Bestand koennen
        // weitere Marken liegen; ein Wechsel auf die falsche machte 4a2 unpruefbar.
        const gewaehlt = [...auswahl.options].find((o) => o.value === ziel)
        if (gewaehlt === undefined) return { da: true, davor, leer: true }
        const trage = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set
        trage.call(auswahl, gewaehlt.value)
        auswahl.dispatchEvent(new Event("change", { bubbles: true }))
        return { da: true, davor, ziel: gewaehlt.value, leer: false }
      }, zielId);
    };
    const pruefeWert = async () => {
      return await seite.evaluate(() => {
        const auswahl = document.querySelector('select[aria-label="Standardmarke"]')
        return { wert: auswahl === null ? null : auswahl.value };
      });
    };
    if (neueMarkeId4a0 === null) {
      fund("Standardmarke (FA-23)", "die Kennung der neuen Marke ist lesbar",
        "marken:listeMarken liefert sie nicht", "Untersuchung", "scripts/durchlauf.mjs");
    }
    const markeVersuch1 = await wechsleMarke(neueMarkeId4a0);
    console.log("[schritt-4a] Auswahl-Bedienung: " + JSON.stringify(markeVersuch1));
    if (!markeVersuch1.da) {
      fund("Standardmarke", "die Auswahl je Projekt-Zeile (#324)",
        "kein select mit aria-label Standardmarke", "Untersuchung", "projekt-verwaltung");
    } else if (markeVersuch1.leer === false) {
      await schlafe(2_500);
      const ablehnungenA = await seite.evaluate(() => window.__durchlauf?.ablehnungen ?? []);
      console.log("[schritt-4a] Ablehnungen bis dahin: " + JSON.stringify(ablehnungenA));
      const listenDiagLesen = () => seite.evaluate(async () => {
        const antwort = await window.api.invoke("project:listeProjekte");
        if (!antwort.ok) return { listenfehler: JSON.stringify(antwort.fehler ?? {}) };
        const erster = antwort.wert[0] ?? null;
        return erster === null ? { erster: null } : { erster: { id: erster.id, marke: erster.standardMarkeId } };
      });
      let listenDiag = await listenDiagLesen();
      // Die Liste liest die PLATTE; das Auto-Speichern ist entprellt (3-5 s, TK 9.5.4).
      // Statt zu raten, wird bis 10 s nachgesehen - der Wechsel muss in D1 ankommen.
      const fristListe4a = Date.now() + 10_000;
      while (Date.now() < fristListe4a) {
        if (listenDiag.erster !== null && listenDiag.erster !== undefined
          && listenDiag.erster.marke === markeVersuch1.ziel) break;
        await schlafe(400);
        listenDiag = await listenDiagLesen();
      }
      console.log("[schritt-4a] Frische Liste: " + JSON.stringify(listenDiag));
      const danach = await pruefeWert();
      console.log("[schritt-4a] Bedienelement danach: " + JSON.stringify(danach));
      if (danach.wert !== markeVersuch1.ziel) {
        fund("Standardmarke", "der Wechsel steht im Bedienelement (#324)",
          `gewaehlt ${markeVersuch1.ziel}, gezeigt ${String(danach.wert)}`, "Befund",
          "projekt-verwaltung/standardmarke.tsx");
      } else if (listenDiag.erster === null || listenDiag.erster === undefined
        || listenDiag.erster.marke !== markeVersuch1.ziel) {
        // #324/FA-23: Der Wechsel muss in D1 ankommen, nicht nur im <select> stehen.
        fund("Standardmarke", "der Wechsel steht im Projekt (project:listeProjekte, FA-23)",
          `gewaehlt ${markeVersuch1.ziel}, Liste zeigt ${JSON.stringify(listenDiag.erster)}`,
          "Befund", "project-store/setze-standard-marke.ts");
      } else {
        console.log("[schritt-4a] Standardmarke-Wechsel GEMESSEN am echten select und in der Liste (davor/nach).");
      }
    } else {
      console.log("[schritt-4a] Nur eine Marke im Bestand - der Wechsel braucht eine zweite (Seed-Weg ungetestet, UI-Weg folgt).");
    }

    // Schritt 4a2 - FA-23 Loeschsperre: Die neue Marke ist jetzt die STANDARDMARKE des
    // Messprojekts. Ein Loeschversuch muss mit Grund gesperrt werden (marke_referenziert,
    // standardInProjekten) und den Ausweg nennen. Danach wird die Standardmarke
    // zurueckgestellt: JETZT muss das Loeschen gehen - damit ist die Sperre nachweislich
    // die Nutzung und nicht ein Zufall. Die Marke verschwindet wieder aus dem Bestand.
    {
      // Die aktive Projekt-Kennung steht zu diesem Zeitpunkt in D3 (config.json) -
      // die Treiber-Variable `aktivesProjektId` entsteht erst mit dem Medien-Seed (4b).
      let projektId4a2 = null;
      try {
        projektId4a2 = JSON.parse(fs.readFileSync(path.join(WURZEL, "config.json"), "utf-8")).aktivesProjektId ?? null;
      } catch (tu) {
        console.log("[schritt-4a2] config.json nicht lesbar: " + String(tu));
      }
      const neueMarke4a2 = await seite.evaluate(async (name) => {
        const antwort = await window.api.invoke("marken:listeMarken");
        if (!antwort || !antwort.ok) return null;
        const treffer = antwort.wert.find((m) => m.name === name);
        return treffer === undefined ? null : { id: treffer.id, name: treffer.name };
      }, neueMarkeName4a0);

      const stand4a2 = await seite.evaluate(() => {
        const auswahl = document.querySelector('select[aria-label="Standardmarke"]');
        return { wert: auswahl === null ? null : auswahl.value };
      });
      console.log(`[schritt-4a2] Neue Marke: ${JSON.stringify(neueMarke4a2)}, Standard im select: ${String(stand4a2.wert)}.`);

      if (neueMarke4a2 === null) {
        fund("Standardmarke (FA-23)", "die neue Marke steht im Bestand",
          "marken:listeMarken findet sie nicht", "Befund", "marken-store/liste.ts");
      } else if (stand4a2.wert !== neueMarke4a2.id) {
        fund("Standardmarke (FA-23)", "4a hat die neue Marke als Standard gesetzt",
          `select=${String(stand4a2.wert)}`, "Untersuchung", "scripts/durchlauf.mjs");
      } else {
        // Marken-Reiter, neue Marke oeffnen, Loeschversuch.
        await seite.evaluate(() => {
          const tab = document.querySelector('[data-testid="reiter-marken"]');
          if (tab !== null) tab.click();
        });
        await schlafe(1_200);
        const geoeffnet4a2 = await seite.evaluate((name) => {
          const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] button')];
          const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === name);
          if (knopf === undefined) return false;
          knopf.click();
          return true;
        }, neueMarke4a2.name);
        await schlafe(800);
        const kopf4a2 = await seite.evaluate(
          () => document.querySelector('[data-testid="marken-kopf"]')?.textContent ?? null,
        );
        const loeschKlick4a2 = await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="loeschengesuch"]');
          if (knopf === null) return false;
          knopf.click();
          return true;
        });
        const frist4a2 = Date.now() + 10_000;
        let lage4a2 = { blockiert: false, bestaetigen: false };
        while (Date.now() < frist4a2) {
          lage4a2 = await seite.evaluate(() => ({
            blockiert: document.querySelector('[data-testid="marken-loesch-blockiert"]') !== null,
            bestaetigen: [...document.querySelectorAll('[data-testid="marken-offen"] button')]
              .some((b) => (b.textContent ?? "").trim() === "Löschen bestätigen"),
          }));
          if (lage4a2.blockiert || lage4a2.bestaetigen) break;
          await schlafe(250);
        }
        const gruende4a2 = await seite.evaluate(() => ({
          standard: document.querySelector('[data-testid="loesch-standard"]')?.textContent ?? null,
          ausweg: document.querySelector('[data-testid="loesch-ausweg"]')?.textContent ?? null,
        }));
        console.log(`[schritt-4a2] Loeschversuch: geoeffnet=${String(geoeffnet4a2)}, Kopf=${String(kopf4a2)}, blockiert=${String(lage4a2.blockiert)}, Gruende=${JSON.stringify(gruende4a2)}.`);
        if (!geoeffnet4a2 || kopf4a2 !== neueMarke4a2.name || !loeschKlick4a2) {
          fund("Standardmarke (FA-23)", "die neue Marke laesst sich oeffnen und der Loeschweg startet",
            `geoeffnet=${String(geoeffnet4a2)}, Kopf=${String(kopf4a2)}, Klick=${String(loeschKlick4a2)}`,
            "Untersuchung", "marken-editor/index.tsx");
        } else if (!lage4a2.blockiert) {
          fund("Standardmarke (FA-23)", "eine als Standardmarke genutzte Marke ist NICHT loeschbar (TK 9.15.1/AD FA-23)",
            `bestaetigen=${String(lage4a2.bestaetigen)}`, "Befund", "marken-store/loesche-marke.ts");
        } else if (!(gruende4a2.standard ?? "").includes("DurchlaufTest")) {
          fund("Standardmarke (FA-23)", "der Sperrgrund nennt das Projekt (standardInProjekten)",
            `loesch-standard: ${String(gruende4a2.standard)}`, "Befund", "marken-editor/index.tsx");
        } else if (gruende4a2.ausweg === null) {
          fund("Standardmarke (FA-23)", "die Sperre nennt den Ausweg (Standardmarke im Reiter Projekte wechseln)",
            "loesch-ausweg fehlt", "Befund", "marken-editor/index.tsx");
        } else {
          console.log(`[schritt-4a2] Loeschsperre GEMESSEN: ${String(gruende4a2.standard)}; Ausweg "${String(gruende4a2.ausweg)}".`);

          // Standardmarke zurueckstellen - ueber DENSELBEN echten select wie 4a.
          await seite.evaluate(() => {
            const tab = document.querySelector('[data-testid="reiter-projekte"]');
            if (tab !== null) tab.click();
          });
          await schlafe(1_200);
          const zurueck4a2 = await seite.evaluate((ziel) => {
            const auswahl = document.querySelector('select[aria-label="Standardmarke"]');
            if (auswahl === null) return false;
            const trage = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
            trage.call(auswahl, ziel);
            auswahl.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }, markeVersuch1.davor);
          await schlafe(2_500);
          const standZurueckLesen = () => seite.evaluate(async (projektId) => {
            if (typeof projektId !== "string") return null;
            const liste = await window.api.invoke("project:listeProjekte");
            const treffer = liste && liste.ok
              ? liste.wert.find((p) => p.id === projektId) ?? null
              : null;
            return treffer === null ? null : treffer.standardMarkeId ?? treffer.marke ?? null;
          }, projektId4a2);
          let standZurueck4a2 = await standZurueckLesen();
          const fristZurueck4a2 = Date.now() + 10_000;
          while (Date.now() < fristZurueck4a2) {
            if (standZurueck4a2 === markeVersuch1.davor) break;
            await schlafe(400);
            standZurueck4a2 = await standZurueckLesen();
          }
          if (!zurueck4a2 || standZurueck4a2 !== markeVersuch1.davor) {
            fund("Standardmarke (FA-23)", "die Standardmarke laesst sich zurueckstellen",
              `geklickt=${String(zurueck4a2)}, Projekt zeigt ${String(standZurueck4a2)}`,
              "Befund", "projekt-verwaltung/standardmarke.tsx");
          } else {
            // Jetzt MUSS das Loeschen gehen - die Sperre war die Nutzung.
            await seite.evaluate(() => {
              const tab = document.querySelector('[data-testid="reiter-marken"]');
              if (tab !== null) tab.click();
            });
            await schlafe(1_200);
            await seite.evaluate((name) => {
              const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] button')];
              const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === name);
              if (knopf !== undefined) knopf.click();
            }, neueMarke4a2.name);
            await schlafe(800);
            await seite.evaluate(() => {
              const knopf = document.querySelector('[data-testid="loeschengesuch"]');
              if (knopf !== null) knopf.click();
            });
            const fristFrei4a2 = Date.now() + 10_000;
            let bestaetigen4a2 = false;
            while (Date.now() < fristFrei4a2) {
              bestaetigen4a2 = await seite.evaluate(
                () => [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                  .some((b) => (b.textContent ?? "").trim() === "Löschen bestätigen"),
              );
              if (bestaetigen4a2) break;
              await schlafe(250);
            }
            if (!bestaetigen4a2) {
              fund("Standardmarke (FA-23)", "nach dem Zurueckstellen ist die Marke loeschbar (Sperre = Nutzung)",
                "kein Bestaetigen-Knopf - weiterhin gesperrt", "Befund", "marken-store/referenzpruefung.ts");
            } else {
              await seite.evaluate(() => {
                const knopf = [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                  .find((b) => (b.textContent ?? "").trim() === "Löschen bestätigen");
                if (knopf !== undefined) knopf.click();
              });
              const fristGeloescht4a2 = Date.now() + 10_000;
              let bestand4a2 = null;
              while (Date.now() < fristGeloescht4a2) {
                bestand4a2 = await seite.evaluate(async (name) => {
                  const antwort = await window.api.invoke("marken:listeMarken");
                  if (!antwort || !antwort.ok) return null;
                  return {
                    anzahl: antwort.wert.length,
                    nochDa: antwort.wert.some((m) => m.name === name),
                  };
                }, neueMarke4a2.name);
                if (bestand4a2 !== null && !bestand4a2.nochDa) break;
                await schlafe(300);
              }
              console.log(`[schritt-4a2] Nach dem Loeschen: ${JSON.stringify(bestand4a2)}.`);
              if (bestand4a2 === null || bestand4a2.nochDa) {
                fund("Standardmarke (FA-23)", "die freigegebene Marke verschwindet aus dem Bestand",
                  JSON.stringify(bestand4a2), "Befund", "marken-editor/index.tsx");
              } else {
                console.log("[schritt-4a2] Loeschsperre GEMESSEN: genutzt -> gesperrt mit Grund/Ausweg; zurueckgestellt -> geloescht (FA-23).");
              }
            }
          }
        }
      }
      // Der Marken-Reiter bleibt offen; 4b wechselt selbst auf Zusammenstellen.
    }

    // Schritt 4m - FA-24 Marken-Editor: Der Reiter wird nicht mehr nur auf Vorhandensein
    // geprueft. Gemessen wird der Kern der Anforderung am echten Fenster: eine Marke ueber
    // die Oberflaeche anlegen und oeffnen, die Akzentfarbe frei setzen (sie landet im
    // Bestand V2), die Kontrast-Warnung am Grenzwert ausloesen und wieder loeschen, eine
    // Marke ableiten und die Herkunft ("geerbt") anzeigen. Dazu die beiden Felder, die
    // eine Momentaufnahme der geoeffneten Marke sind (Sicherheitsabstand, Slogan): sie
    // muessen den Wert der GEoeffneten Marke zeigen, nicht den des ersten Aufbaus.
    //
    // Seit der Entscheidung A1 (22.10.2026) gehoert die Live-Vorschau dazu: Sie zeichnet
    // ueber zeichneMarkenVorschau (#303, derselbe Zeichenweg) mit der festen Vorlage
    // "Vollbild", nach eigener Vorbereitung von Schriften und Logo (#291/#315).
    {
      const stempel4m = Date.now();
      const name4m = "DurchlaufMarke-FA24-" + stempel4m;
      const kind4m = name4m + "-Kind";

      const markenReiter4m = await seite.evaluate(() => {
        const tab = document.querySelector('[data-testid="reiter-marken"]');
        if (tab === null) return false;
        tab.click();
        return true;
      });
      await schlafe(1_200);
      if (!markenReiter4m) {
        fund("Marken-Editor (FA-24)", "der Reiter Marken ist erreichbar",
          "reiter-marken fehlt", "Befund", "app-shell/reiter.ts");
      } else {
        const anzahlVorher4m = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="marken-liste"] > div > div > button').length,
        );

        // (1) Anlegen ueber die echte Oberflaeche. Das Namensfeld ist kontrolliert und
        // behaelt nach dem Anlegen seinen Text (4a0 hat es schon benutzt). Getippte
        // Zeichen sind hier NICHT verlaesslich: In zwei Laeufen verschluckte die
        // kontrollierte React-Eingabe Zeichen, und das Ergebnis war ein zusammengesetzter
        // Name ("DurchlaufMarke-17DurchlaufMarke-FA24-…"). Der Fehler lag im MESSWEG,
        // nicht in der App. Deshalb wird der Wert wie bei einem Einfuegen gesetzt: ueber
        // den nativen Setter mit einem echten `input`-Ereignis - derselbe onChange-Pfad,
        // den auch das Tippen ausloest, nur ohne Tastenrennen.
        const setzeEingabe4m = async (index, wert) => seite.evaluate(({ i, w }) => {
          const felder = [...document.querySelectorAll('[data-testid="marken-liste"] input')];
          const feld = felder[i];
          if (feld === undefined) return false;
          const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setzeWert.call(feld, w);
          feld.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }, { i: index, w: wert });
        await setzeEingabe4m(0, name4m);
        const angelegt4m = await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="erstelle-eigenstaendige-marken-namen"]');
          if (knopf === null) return false;
          knopf.click();
          return true;
        });
        const fristAnlegen4m = Date.now() + 15_000;
        let anzahlNachher4m = anzahlVorher4m;
        while (Date.now() < fristAnlegen4m) {
          anzahlNachher4m = await seite.evaluate(
            () => document.querySelectorAll('[data-testid="marken-liste"] > div > div > button').length,
          );
          if (anzahlNachher4m > anzahlVorher4m) break;
          await schlafe(200);
        }
        const neuFehler4m = await seite.evaluate(
          () => document.querySelector('[data-testid="marken-neu-fehler"]')?.textContent ?? null,
        );
        console.log(`[schritt-4m] Anlegen: Marken ${anzahlVorher4m} -> ${anzahlNachher4m}, Fehler=${String(neuFehler4m)}.`);
        if (!angelegt4m || anzahlNachher4m <= anzahlVorher4m) {
          fund("Marken-Editor (FA-24)", "eine eigenstaendige Marke laesst sich ueber die Oberflaeche anlegen",
            `Marken ${anzahlVorher4m}->${anzahlNachher4m}, Fehler: ${String(neuFehler4m)}`,
            "Befund", "marken-editor/index.tsx");
        } else {
          // (2) Oeffnen.
          const geoeffnet4m = await seite.evaluate((name) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === name);
            if (knopf === undefined) return false;
            knopf.click();
            return true;
          }, name4m);
          const fristOeffnen4m = Date.now() + 10_000;
          let kopf4m = null;
          while (Date.now() < fristOeffnen4m) {
            kopf4m = await seite.evaluate(
              () => document.querySelector('[data-testid="marken-kopf"]')?.textContent ?? null,
            );
            if (kopf4m === name4m) break;
            await schlafe(200);
          }
          if (!geoeffnet4m || kopf4m !== name4m) {
            fund("Marken-Editor (FA-24)", "die angelegte Marke laesst sich oeffnen",
              `geklickt=${String(geoeffnet4m)}, Kopf=${String(kopf4m)}`, "Befund", "marken-editor/index.tsx");
          } else {
            const markeId4m = await seite.evaluate(async (name) => {
              const antwort = await window.api.invoke("marken:listeMarken");
              if (!antwort || !antwort.ok) return null;
              const treffer = antwort.wert.find((m) => m.name === name);
              return treffer === undefined ? null : treffer.id;
            }, name4m);

            const leseFeld4m = (testid) => seite.evaluate(
              (t) => document.querySelector(`[data-testid="${t}"]`)?.value ?? null, testid,
            );
            const liesStand4m = async () => seite.evaluate(async (name) => {
              const antwort = await window.api.invoke("marken:listeMarken");
              if (!antwort || !antwort.ok) return null;
              const treffer = antwort.wert.find((m) => m.name === name);
              return treffer === undefined ? null : {
                akzent: treffer.farben.akzent,
                sicherheit: treffer.sicherheit,
                slogan: treffer.slogan,
              };
            }, name4m);
            const warnung4m = () => seite.evaluate(() => {
              const hinweis = document.querySelector('[data-testid="marken-offen"] [role="status"]');
              return hinweis === null ? null : (hinweis.textContent ?? "").trim();
            });

            // (3) Ausgangslage: die Kopie der eingebauten Marke hat genug Kontrast.
            const warnungVorher4m = await warnung4m();
            const akzentVorher4m = await leseFeld4m("farbe-akzent");
            console.log(`[schritt-4m] Ausgang: akzent=${String(akzentVorher4m)}, Warnung=${String(warnungVorher4m)}.`);
            if (warnungVorher4m !== null) {
              fund("Marken-Editor (FA-24)", "bei ausreichendem Kontrast zeigt der Editor KEINE Warnung",
                `Warnung: ${warnungVorher4m}`, "Befund", "marken-editor/kontrast-warnung.tsx");
            }

            // (4) Akzentfarbe auf einen Wert setzen, der gegen BEIDE Textrollen unter 4,5:1
            // liegt (#808080: gegen Weiss 3,95:1, gegen #202020 4,13:1). Das Feld ist
            // unkontrolliert und schreibt beim Verlassen (onBlur).
            const gesetzt4m = await seite.evaluate(() => {
              const feld = document.querySelector('[data-testid="farbe-akzent"]');
              if (feld === null) return false;
              feld.focus();
              feld.value = "#808080";
              feld.dispatchEvent(new Event("input", { bubbles: true }));
              // Reacts onBlur haengt an `focusout`; ein nacktes `blur()` feuert in
              // einem nicht fokussierten Fenster nicht (23.10.2026 am Treiber belegt).
              feld.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
              feld.blur();
              return true;
            });
            const fristWarnung4m = Date.now() + 10_000;
            let warnungNachher4m = null;
            while (Date.now() < fristWarnung4m) {
              warnungNachher4m = await warnung4m();
              if (warnungNachher4m !== null) break;
              await schlafe(250);
            }
            const stand4m = await liesStand4m();
            const blockiert4m = await seite.evaluate(() => ({
              feldGesperrt: document.querySelector('[data-testid="farbe-akzent"]')?.disabled ?? null,
              dialog: document.querySelector('[role="dialog"]') !== null,
            }));
            console.log(`[schritt-4m] Akzent #808080: Warnung=${String(warnungNachher4m)}, Store=${JSON.stringify(stand4m)}, blockiert=${JSON.stringify(blockiert4m)}.`);
            if (!gesetzt4m) {
              fund("Marken-Editor (FA-24)", "die Akzentfarbe ist im Editor bedienbar",
                "farbe-akzent fehlt", "Befund", "marken-editor/index.tsx");
            } else if (stand4m === null || stand4m.akzent !== "#808080") {
              fund("Marken-Editor (FA-24)", "die gesetzte Akzentfarbe landet im Bestand (V2)",
                JSON.stringify(stand4m), "Befund", "marken-editor/farben-bearbeiten.ts");
            } else if (warnungNachher4m === null) {
              fund("Marken-Editor (FA-24)", "bei zu geringem Kontrast warnt der Editor sichtbar (TK 9.15.2)",
                "kein role=status im geoeffneten Bereich", "Befund", "marken-editor/kontrast-warnung.tsx");
            } else if (blockiert4m.feldGesperrt === true || blockiert4m.dialog) {
              fund("Marken-Editor (FA-24)", "die Warnung blockiert die Wahl NICHT (FA-24)",
                JSON.stringify(blockiert4m), "Befund", "marken-editor/index.tsx");
            } else {
              console.log(`[schritt-4m] Kontrast-Warnung GEMESSEN: "${warnungNachher4m}" (Wahl bleibt moeglich).`);

              // (5) Die Felder, die eine Momentaufnahme der geoeffneten Marke sind:
              // Sicherheitsabstand und Slogan. Die neue Marke kopiert 96/54 aus der
              // eingebauten - steht hier 0/0, zeigt der Editor den Stand des ERSTEN Aufbaus.
              const standFelder4m = await liesStand4m();
              const abstandH4m = await leseFeld4m("abstand-horizontal");
              const abstandV4m = await leseFeld4m("abstand-vertikal");
              const sloganFeld4m = await seite.evaluate(() => {
                const abschnitt = document.querySelector('[data-testid="marken-slogan"]');
                if (abschnitt === null) return null;
                const felder = [...abschnitt.querySelectorAll('input')];
                return { text: felder[0]?.value ?? null, aktiv: felder[1]?.checked ?? null };
              });
              console.log(`[schritt-4m] Felder: Abstand ${String(abstandH4m)}/${String(abstandV4m)} (Store ${JSON.stringify(standFelder4m?.sicherheit)}), Slogan=${JSON.stringify(sloganFeld4m)} (Store ${JSON.stringify(standFelder4m?.slogan)}).`);
              if (standFelder4m === null) {
                fund("Marken-Editor (FA-24)", "der Bestand ist nach dem Oeffnen lesbar",
                  "marken:listeMarken liefert die Marke nicht", "Befund", "marken-store/liste.ts");
              } else if (String(abstandH4m) !== String(standFelder4m.sicherheit.horizontal)
                || String(abstandV4m) !== String(standFelder4m.sicherheit.vertikal)) {
                fund("Marken-Editor (FA-24)", "die Abstands-Felder zeigen den Wert der GEOEFFNETEN Marke",
                  `Felder ${String(abstandH4m)}/${String(abstandV4m)} statt ${standFelder4m.sicherheit.horizontal}/${standFelder4m.sicherheit.vertikal}`,
                  "Befund", "marken-editor/index.tsx");
              } else if (sloganFeld4m === null
                || String(sloganFeld4m.text) !== String(standFelder4m.slogan.text)) {
                fund("Marken-Editor (FA-24)", "das Slogan-Feld zeigt den Wert der GEOEFFNETEN Marke",
                  JSON.stringify(sloganFeld4m), "Befund", "marken-editor/index.tsx");
              } else {
                console.log("[schritt-4m] Felder der geoeffneten Marke GEMESSEN (Abstand und Slogan stimmen mit dem Bestand).");
              }

              // (6) Live-Vorschau (TK 9.14.1/9.15.2, A1): Die rechte Spalte zeichnet ein
              // echtes Canvas ueber denselben Zeichenweg (#303) mit der festen Vorlage
              // "Vollbild" (1920x1080). Die Vorbereitung ist asynchron - warten.
              const fristVorschau4m = Date.now() + 10_000;
              let vorschau4m = null;
              while (Date.now() < fristVorschau4m) {
                vorschau4m = await seite.evaluate(() => {
                  const flaeche = document.querySelector('[data-testid="marken-vorschau"]');
                  if (flaeche === null) return { da: false, canvas: false, text: null };
                  const canvas = flaeche.querySelector('canvas');
                  const hinweis = flaeche.querySelector('[data-testid="marken-vorschau-hinweis"]');
                  return {
                    da: true,
                    canvas: canvas !== null,
                    breite: canvas?.width ?? null,
                    hoehe: canvas?.height ?? null,
                    text: (hinweis?.textContent ?? "").trim(),
                  };
                });
                if (vorschau4m?.canvas === true) break;
                await schlafe(250);
              }
              console.log(`[schritt-4m] Live-Vorschau: ${JSON.stringify(vorschau4m)}.`);
              if (vorschau4m === null || vorschau4m.da !== true) {
                fund("Marken-Editor (FA-24)", "die dritte Spalte der Live-Vorschau existiert (TK 9.14.1)",
                  JSON.stringify(vorschau4m), "Befund", "marken-editor/index.tsx");
              } else if (vorschau4m.canvas !== true) {
                fund("Marken-Editor (FA-24)", "die Live-Vorschau zeichnet die geoeffnete Marke (TK 9.15.2)",
                  `kein Canvas; Hinweis: ${String(vorschau4m.text)}`,
                  "Befund", "marken-editor/vorschau-flaeche.tsx");
              } else if (vorschau4m.breite !== 1920 || vorschau4m.hoehe !== 1080) {
                fund("Marken-Editor (FA-24)", "die Live-Vorschau nutzt die Vorlage Vollbild (1920x1080)",
                  `${String(vorschau4m.breite)}x${String(vorschau4m.hoehe)}`,
                  "Befund", "marken-editor/vorschau-flaeche.tsx");
              } else {
                console.log(`[schritt-4m] Live-Vorschau GEMESSEN: Canvas ${vorschau4m.breite}x${vorschau4m.hoehe} ueber den Zeichenweg (#303).`);
              }

              // (7) Ableiten ueber die echte Oberflaeche: Namensfeld (zweites Eingabefeld),
              // Basis-Auswahl (der eine <select> der Liste), Knopf "Ableiten".
              const eingabeFelder4m = await seite.$$('[data-testid="marken-liste"] input');
              const auswahl4m = await seite.$('[data-testid="marken-liste"] select');
              if (eingabeFelder4m.length < 2 || auswahl4m === null || markeId4m === null) {
                fund("Marken-Editor (FA-24)", "Ableiten ist ueber die Oberflaeche bedienbar",
                  `Eingaben=${eingabeFelder4m.length}, select=${auswahl4m !== null}, id=${String(markeId4m)}`,
                  "Untersuchung", "marken-editor/index.tsx");
              } else {
                await setzeEingabe4m(1, kind4m);
                await seite.evaluate((ziel) => {
                  const auswahl = document.querySelector('[data-testid="marken-liste"] select');
                  if (auswahl === null) return;
                  const trage = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
                  trage.call(auswahl, ziel);
                  auswahl.dispatchEvent(new Event("change", { bubbles: true }));
                }, markeId4m);
                const abgeleitetKlick4m = await seite.evaluate(() => {
                  const knopf = document.querySelector('[data-testid="marke-ableiten"]');
                  if (knopf === null) return false;
                  knopf.click();
                  return true;
                });
                const fristKind4m = Date.now() + 15_000;
                let kindDa4m = false;
                while (Date.now() < fristKind4m) {
                  kindDa4m = await seite.evaluate((name) => {
                    const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
                    return knoepfe.some((k) => (k.textContent ?? "").trim() === name);
                  }, kind4m);
                  if (kindDa4m) break;
                  await schlafe(250);
                }
                const ableitFehler4m = await seite.evaluate(
                  () => document.querySelector('[data-testid="marken-ableiten-fehler"]')?.textContent ?? null,
                );
                console.log(`[schritt-4m] Ableiten: Knopf=${String(abgeleitetKlick4m)}, Kind=${String(kindDa4m)}, Fehler=${String(ableitFehler4m)}.`);
                if (!abgeleitetKlick4m || !kindDa4m) {
                  fund("Marken-Editor (FA-24)", "eine Marke laesst sich ueber die Oberflaeche ableiten",
                    `Kind im Bestand=${String(kindDa4m)}, Fehler: ${String(ableitFehler4m)}`,
                    "Befund", "marken-editor/marke-ableiten.ts");
                } else {
                  // (8) Das Kind oeffnen: es ist als abgeleitet gekennzeichnet und zeigt
                  // mindestens eine Herkunftszeile mit "geerbt" (TK 9.15.2).
                  await seite.evaluate((name) => {
                    const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
                    const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === name);
                    if (knopf !== undefined) knopf.click();
                  }, kind4m);
                  const fristKindKopf4m = Date.now() + 10_000;
                  let kindKopf4m = null;
                  while (Date.now() < fristKindKopf4m) {
                    kindKopf4m = await seite.evaluate(
                      () => document.querySelector('[data-testid="marken-kopf"]')?.textContent ?? null,
                    );
                    if (kindKopf4m === kind4m) break;
                    await schlafe(200);
                  }
                  const herkunft4m = await seite.evaluate(() => {
                    const bereich = document.querySelector('[data-testid="marken-offen"]');
                    const zeilen = [...document.querySelectorAll('[data-testid^="herkunft-"]')];
                    const verbindlicherKnopf = document.querySelector('[data-testid^="herkunft-zurueck-"]');
                    return {
                      abgeleitetText: (bereich?.innerText ?? "").includes("abgeleitet"),
                      zeilen: zeilen.length,
                      erste: (zeilen[0]?.textContent ?? "").trim(),
                      zurueckKnopf: verbindlicherKnopf !== null,
                    };
                  });
                  console.log(`[schritt-4m] Kind geoeffnet: Kopf=${String(kindKopf4m)}, Herkunft=${JSON.stringify(herkunft4m)}.`);
                  if (kindKopf4m !== kind4m) {
                    fund("Marken-Editor (FA-24)", "das abgeleitete Kind laesst sich oeffnen",
                      `Kopf=${String(kindKopf4m)}`, "Befund", "marken-editor/index.tsx");
                  } else if (!herkunft4m.abgeleitetText || herkunft4m.zeilen === 0) {
                    fund("Marken-Editor (FA-24)", "bei einer abgeleiteten Marke ist sichtbar, was geerbt ist (TK 9.15.2)",
                      JSON.stringify(herkunft4m), "Befund", "marken-editor/herkunft-anzeigen.ts");
                  } else {
                    console.log(`[schritt-4m] Ableitung GEMESSEN: "${kind4m}" ist abgeleitet, ${herkunft4m.zeilen} Herkunftszeilen, erste "${herkunft4m.erste}".`);
                  }
                }
              }
            }
          }
        }

        // (8) Die Warnung und die Farbfelder haengen am WERT der GEOEFFNETEN Marke. Die
        // eingebaute Marke hat wieder genug Kontrast (#FF4040 gegen #202020 = 4,71:1).
        // Beim Wechsel muessen sich deshalb die unkontrollierten Felder (defaultValue)
        // mitziehen - sonst schreibt der naechste onBlur den ALTEN Wert in die neue Marke.
        const eingebaut4m = await seite.evaluate(async () => {
          const antwort = await window.api.invoke("marken:listeMarken");
          if (!antwort || !antwort.ok) return null;
          return antwort.wert.find((m) => m.eingebaut)?.name ?? null;
        });
        if (eingebaut4m === null) {
          fund("Marken-Editor (FA-24)", "der Bestand fuehrt eine eingebaute Marke",
            "keine Marke mit eingebaut=true", "Untersuchung", "marken-store/liste.ts");
        } else {
          await seite.evaluate((name) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === name);
            if (knopf !== undefined) knopf.click();
          }, eingebaut4m);
          const fristWechsel4m = Date.now() + 10_000;
          let kopfWechsel4m = null;
          while (Date.now() < fristWechsel4m) {
            kopfWechsel4m = await seite.evaluate(
              () => document.querySelector('[data-testid="marken-kopf"]')?.textContent ?? null,
            );
            if (kopfWechsel4m === eingebaut4m) break;
            await schlafe(200);
          }
          const akzentFeld4m = await seite.evaluate(
            () => document.querySelector('[data-testid="farbe-akzent"]')?.value ?? null,
          );
          const warnungEingebaut4m = await seite.evaluate(() => {
            const hinweis = document.querySelector('[data-testid="marken-offen"] [role="status"]');
            return hinweis === null ? null : (hinweis.textContent ?? "").trim();
          });
          const abstandEingebaut4m = await seite.evaluate(
            () => document.querySelector('[data-testid="abstand-horizontal"]')?.value ?? null,
          );
          console.log(`[schritt-4m] Wechsel auf "${eingebaut4m}": Kopf=${String(kopfWechsel4m)}, akzentFeld=${String(akzentFeld4m)}, Warnung=${String(warnungEingebaut4m)}, AbstandFeld=${String(abstandEingebaut4m)}.`);
          if (kopfWechsel4m !== eingebaut4m) {
            fund("Marken-Editor (FA-24)", "die eingebaute Marke laesst sich oeffnen",
              `Kopf=${String(kopfWechsel4m)}`, "Befund", "marken-editor/index.tsx");
          } else {
            if (akzentFeld4m !== "#FF4040") {
              fund("Marken-Editor (FA-24)", "beim Wechsel der Marke zeigen die Farbfelder den Wert der NEUEN Marke",
                `Feld ${String(akzentFeld4m)} statt #FF4040`, "Befund", "marken-editor/index.tsx");
            }
            if (warnungEingebaut4m !== null) {
              fund("Marken-Editor (FA-24)", "die Kontrast-Warnung verschwindet bei ausreichendem Kontrast",
                `Warnung bleibt: ${String(warnungEingebaut4m)}`, "Befund", "marken-editor/kontrast-warnung.tsx");
            }
          }
        }

        // (9) Aufraeumen IN diesem Schritt: das Kind zuerst (sonst ist die Basis noch
        // referenziert), danach die Basis. Beide ueber die echte Oberflaeche.
        const loescheUeberUi4m = async (name) => {
          const vorhanden4m = await seite.evaluate((n) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            return knoepfe.some((k) => (k.textContent ?? "").trim() === n);
          }, name);
          if (!vorhanden4m) {
            // Nichts anfassen, was nicht eindeutig diese Messmarke ist.
            return { name, gesucht: false, bestaetigt: false, nochDa: false };
          }
          await seite.evaluate((n) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === n);
            if (knopf !== undefined) knopf.click();
          }, name);
          await schlafe(700);
          const gesucht4m = await seite.evaluate(() => {
            const knopf = document.querySelector('[data-testid="loeschengesuch"]');
            if (knopf === null) return false;
            knopf.click();
            return true;
          });
          if (!gesucht4m) return { name, gesucht: false, bestaetigt: false };
          const frist4m = Date.now() + 10_000;
          let bestaetigen4m = null;
          while (Date.now() < frist4m) {
            bestaetigen4m = await seite.evaluate(
              () => [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                .find((b) => (b.textContent ?? "").trim() === "Löschen bestätigen") !== undefined,
            );
            if (bestaetigen4m) break;
            await schlafe(250);
          }
          if (bestaetigen4m) {
            await seite.evaluate(() => {
              const knopf = [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                .find((b) => (b.textContent ?? "").trim() === "Löschen bestätigen");
              if (knopf !== undefined) knopf.click();
            });
            await schlafe(1_200);
          }
          const nochDa4m = await seite.evaluate(async (n) => {
            const antwort = await window.api.invoke("marken:listeMarken");
            if (!antwort || !antwort.ok) return null;
            return antwort.wert.some((m) => m.name === n);
          }, name);
          return { name, gesucht: true, bestaetigt: Boolean(bestaetigen4m), nochDa: nochDa4m };
        };
        const wegKind4m = await loescheUeberUi4m(kind4m);
        const wegBasis4m = await loescheUeberUi4m(name4m);
        console.log(`[schritt-4m] Aufraeumen: ${JSON.stringify([wegKind4m, wegBasis4m])}.`);
        if (wegKind4m.nochDa === true || wegBasis4m.nochDa === true) {
          fund("Marken-Editor (FA-24)", "die Messmarken lassen sich wieder loeschen",
            JSON.stringify([wegKind4m, wegBasis4m]), "Untersuchung", "marken-editor/index.tsx");
        }
      }
      // Der Marken-Reiter bleibt offen; 4b wechselt selbst auf Zusammenstellen.
    }

    // Schritt 4m2 - FA-24 Rest: Was 4m offen liess, wird hier am echten Fenster gemessen:
    // ALLE dreizehn Farbrollen schreiben, Slogan und Sicherheitsabstand schreiben (inkl.
    // Wachstums-Hinweis), die Bearbeitung einer abgeleiteten Marke (eigen -> geerbt) und
    // die IMPORT-Pipeline fuer Schrift und Logo samt "Logo entfernen".
    //
    // Der NATIVE Dateidialog bleibt bewusst aussen vor (wie FA-09/Export): Er laesst sich
    // nicht steuern. Gemessen wird die Pipeline ueber den echten Kanal
    // `marken:importiereMarkenDatei` mit einer echten Datei - das ist derselbe Weg, den
    // `datei-import.ts` nach der Auswahl nimmt. Was NICHT belegt ist, ist der Klick auf
    // "Eigene Schrift/Logo waehlen" bis zum Dialog - dieser Teil bleibt MANUELL.
    {
      const stempel4m2 = Date.now();
      const name4m2 = "DurchlaufMarke-FA24R-" + stempel4m2;
      const kind4m2 = name4m2 + "-Kind";
      const rollen4m2 = [
        "akzent", "akzentKraeftig", "akzentTief",
        "flaecheDunkel", "flaecheSehrDunkel", "flaecheHell", "flaecheAkzentZart",
        "textAufDunkel", "textAufHell", "textSekundaer",
        "linie", "scrimStart", "scrimEnde",
      ];

      const leseMarke4m2 = (id) => seite.evaluate(async (markeId) => {
        const antwort = await window.api.invoke("marken:listeMarken");
        if (!antwort || !antwort.ok) return null;
        return antwort.wert.find((m) => m.id === markeId) ?? null;
      }, id);
      const warteAuf4m2 = async (id, pruefung, fristMs = 8_000) => {
        const frist = Date.now() + fristMs;
        let letzte = null;
        while (Date.now() < frist) {
          letzte = await leseMarke4m2(id);
          if (letzte !== null && pruefung(letzte)) return letzte;
          await schlafe(200);
        }
        return letzte;
      };
      const oeffne4m2 = async (name) => {
        await seite.evaluate((n) => {
          const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
          const knopf = knoepfe.find((k) => (k.textContent ?? "").trim() === n);
          if (knopf !== undefined) knopf.click();
        }, name);
        const frist = Date.now() + 10_000;
        while (Date.now() < frist) {
          const kopf = await seite.evaluate(
            () => document.querySelector('[data-testid="marken-kopf"]')?.textContent ?? null,
          );
          if (kopf === name) return true;
          await schlafe(200);
        }
        return false;
      };
      const setzeWert4m2 = async (testid, wert, ereignis = "blur") => seite.evaluate(({ t, w, e }) => {
        const feld = document.querySelector(`[data-testid="${t}"]`);
        if (feld === null) return false;
        const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setzeWert.call(feld, w);
        if (e === "blur") {
          feld.focus();
          feld.dispatchEvent(new Event("input", { bubbles: true }));
          // `focusout` statt nur `blur`: Reacts onBlur haengt an `focusout`; in einem
          // nicht fokussierten Fenster bleibt `blur()` sonst wirkungslos (23.10.2026).
          feld.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
          feld.blur();
        } else {
          feld.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return true;
      }, { t: testid, w: wert, e: ereignis });

      const reiter4m2 = await seite.evaluate(() => {
        const tab = document.querySelector('[data-testid="reiter-marken"]');
        if (tab === null) return false;
        tab.click();
        return true;
      });
      await schlafe(1_200);

      if (!reiter4m2) {
        fund("Marken-Rest (FA-24)", "der Reiter Marken ist erreichbar",
          "reiter-marken fehlt", "Befund", "app-shell/reiter.ts");
      } else {
        // Anlegen und oeffnen (deterministisch: nativer Setter + input, s. 4m).
        await seite.evaluate((name) => {
          const felder = [...document.querySelectorAll('[data-testid="marken-liste"] input')];
          const feld = felder[0];
          if (feld === undefined) return;
          const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setzeWert.call(feld, name);
          feld.dispatchEvent(new Event("input", { bubbles: true }));
        }, name4m2);
        await seite.evaluate(() => {
          document.querySelector('[data-testid="erstelle-eigenstaendige-marken-namen"]')?.click();
        });
        const fristAnlegen4m2 = Date.now() + 15_000;
        let angelegt4m2 = false;
        while (Date.now() < fristAnlegen4m2) {
          angelegt4m2 = await seite.evaluate((n) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            return knoepfe.some((k) => (k.textContent ?? "").trim() === n);
          }, name4m2);
          if (angelegt4m2) break;
          await schlafe(200);
        }
        // Die Kennung ueber den Namen holen (die Liste liefert sie nicht als Attribut).
        const id4m2 = await seite.evaluate(async (n) => {
          const antwort = await window.api.invoke("marken:listeMarken");
          if (!antwort || !antwort.ok) return null;
          return antwort.wert.find((m) => m.name === n)?.id ?? null;
        }, name4m2);
        const geoeffnet4m2 = await oeffne4m2(name4m2);
        if (!angelegt4m2 || !geoeffnet4m2 || id4m2 === null) {
          fund("Marken-Rest (FA-24)", "die Messmarke laesst sich anlegen und oeffnen",
            `angelegt=${String(angelegt4m2)}, geoeffnet=${String(geoeffnet4m2)}, id=${String(id4m2)}`,
            "Befund", "marken-editor/index.tsx");
        } else {
          // (1) ALLE dreizehn Farbrollen ueber die Oberflaeche schreiben.
          const erwartet4m2 = {};
          for (let i = 0; i < rollen4m2.length; i += 1) {
            const rolle = rollen4m2[i];
            const wert = "#" + (i + 1).toString(16).padStart(2, "0").repeat(3);
            erwartet4m2[rolle] = wert;
            const gesetzt = await setzeWert4m2(`farbe-${rolle}`, wert, "blur");
            if (!gesetzt) {
              fund("Marken-Rest (FA-24)", `Farbfeld ${rolle} ist vorhanden`,
                "Feld fehlt", "Befund", "marken-editor/index.tsx");
              break;
            }
            const stand = await warteAuf4m2(id4m2, (m) => m.farben[rolle] === wert);
            if (stand === null || stand.farben[rolle] !== wert) {
              fund("Marken-Rest (FA-24)", `die Farbrolle ${rolle} laesst sich schreiben`,
                `Store: ${String(stand?.farben?.[rolle])}`, "Befund", "marken-editor/farben-bearbeiten.ts");
            }
          }
          const farben4m2 = await leseMarke4m2(id4m2);
          const abweichend4m2 = rollen4m2.filter((r) => farben4m2?.farben?.[r] !== erwartet4m2[r]);
          console.log(`[schritt-4m2] Farbrollen: ${rollen4m2.length - abweichend4m2.length}/${rollen4m2.length} im Store, abweichend=${JSON.stringify(abweichend4m2)}.`);
          if (abweichend4m2.length > 0) {
            fund("Marken-Rest (FA-24)", "alle dreizehn Farbrollen landen im Bestand",
              JSON.stringify(abweichend4m2), "Befund", "marken-editor/farben-bearbeiten.ts");
          } else {
            console.log("[schritt-4m2] Alle dreizehn Farbrollen GEMESSEN (je ein eigener Wert im Bestand).");
          }

          // (2) Slogan schreiben: Text + Schalter, dann "Slogan uebernehmen".
          const sloganText4m2 = "Saisonstart 2026";
          await seite.evaluate(() => {
            const abschnitt = document.querySelector('[data-testid="marken-slogan"]');
            if (abschnitt === null) return;
            const felder = [...abschnitt.querySelectorAll('input')];
            const text = felder[0];
            const schalter = felder[1];
            if (text !== undefined) {
              const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              setzeWert.call(text, "Saisonstart 2026");
              text.dispatchEvent(new Event("input", { bubbles: true }));
            }
            if (schalter !== undefined && !schalter.checked) schalter.click();
          });
          await seite.evaluate(() => {
            const abschnitt = document.querySelector('[data-testid="marken-slogan"]');
            const knopf = abschnitt === null ? null : abschnitt.querySelector("button");
            if (knopf !== null) knopf.click();
          });
          const standSlogan4m2 = await warteAuf4m2(id4m2,
            (m) => m.slogan.text === sloganText4m2 && m.slogan.aktiv === true);
          console.log(`[schritt-4m2] Slogan: ${JSON.stringify(standSlogan4m2?.slogan)}.`);
          if (standSlogan4m2 === null || standSlogan4m2.slogan.text !== sloganText4m2
            || standSlogan4m2.slogan.aktiv !== true) {
            fund("Marken-Rest (FA-24)", "Slogan-Text und -Schalter landen im Bestand",
              JSON.stringify(standSlogan4m2?.slogan), "Befund", "marken-editor/slogan-bearbeiten.ts");
          } else {
            console.log("[schritt-4m2] Slogan GEMESSEN (Text und Schalter im Bestand).");
          }

          // (3) Sicherheitsabstand schreiben: 80/40.
          await setzeWert4m2("abstand-horizontal", "80", "input");
          await setzeWert4m2("abstand-vertikal", "40", "input");
          await seite.evaluate(() => {
            const abschnitt = document.querySelector('[data-testid="marken-sicherheit"]');
            const knopf = abschnitt === null ? null : abschnitt.querySelector("button");
            if (knopf !== null) knopf.click();
          });
          const standAbstand4m2 = await warteAuf4m2(id4m2,
            (m) => m.sicherheit.horizontal === 80 && m.sicherheit.vertikal === 40);
          console.log(`[schritt-4m2] Abstand: ${JSON.stringify(standAbstand4m2?.sicherheit)}.`);
          if (standAbstand4m2 === null || standAbstand4m2.sicherheit.horizontal !== 80
            || standAbstand4m2.sicherheit.vertikal !== 40) {
            fund("Marken-Rest (FA-24)", "der Sicherheitsabstand landet im Bestand",
              JSON.stringify(standAbstand4m2?.sicherheit), "Befund", "marken-editor/sicherheitsabstand-bearbeiten.ts");
          }

          // (4) Wachstums-Hinweis: 120 ist groesser als 80 -> der Editor warnt VOR dem Speichern.
          await setzeWert4m2("abstand-horizontal", "120", "input");
          const hinweis4m2 = await seite.evaluate(
            () => document.querySelector('[data-testid="abstand-hinweis"]')?.textContent ?? null,
          );
          console.log(`[schritt-4m2] Wachstums-Hinweis: ${String(hinweis4m2)}.`);
          if (hinweis4m2 === null || !hinweis4m2.includes("120")) {
            fund("Marken-Rest (FA-24)", "ein WACHSENDER Abstand warnt vor unsicheren Vorlagen (TK 9.11.4)",
              `Hinweis: ${String(hinweis4m2)}`, "Befund", "marken-editor/sicherheitsabstand-bearbeiten.ts");
          } else {
            console.log("[schritt-4m2] Wachstums-Hinweis GEMESSEN (nennt den neuen Wert).");
          }
          // Nicht speichern: der Bestand bleibt bei 80/40.

          // (5) IMPORT-Pipeline (ohne nativen Dialog, s. Kopf): Schrift und Logo ueber den
          // echten Kanal, dann die Marke neu oeffnen und die Anzeige pruefen.
          const schriftPfad4m2 = path.join(WURZEL, "src", "renderer", "assets", "fonts", "Arimo-Regular.woff2");
          const logoPfad4m2 = path.join(WURZEL, "tools", "assets", "logo.png");
          const importSchrift4m2 = await seite.evaluate(async ({ id, pfad }) => {
            const antwort = await window.api.invoke("marken:importiereMarkenDatei", {
              markeId: id, art: "schrift", schriftRolle: "fliesstext", quellPfad: pfad,
            });
            return antwort && antwort.ok ? "ok" : JSON.stringify(antwort?.fehler ?? antwort);
          }, { id: id4m2, pfad: schriftPfad4m2 });
          const importLogo4m2 = await seite.evaluate(async ({ id, pfad }) => {
            const antwort = await window.api.invoke("marken:importiereMarkenDatei", {
              markeId: id, art: "logo", schriftRolle: null, quellPfad: pfad,
            });
            return antwort && antwort.ok ? "ok" : JSON.stringify(antwort?.fehler ?? antwort);
          }, { id: id4m2, pfad: logoPfad4m2 });
          const neuGeoeffnet4m2 = await oeffne4m2(name4m2);
          await schlafe(500);
          const standImport4m2 = await leseMarke4m2(id4m2);
          // Der Speicherort der Kopien (TK 9.15.3): marken-assets/<markeId>/. Die Liste
          // macht sichtbar, ob ein 404 der Vorschau aus einem FEHLENDEN Asset stammt.
          let markenOrdnerInhalt4m2 = null;
          try {
            markenOrdnerInhalt4m2 = fs.readdirSync(path.join(WURZEL, "marken-assets", id4m2));
          } catch {
            markenOrdnerInhalt4m2 = null;
          }
          console.log(`[schritt-4m2] marken-assets/<id>: ${JSON.stringify(markenOrdnerInhalt4m2)}.`);
          const importAnzeige4m2 = await seite.evaluate(() => {
            const schriften = document.querySelector('[data-testid="marken-schriften"]');
            const logo = document.querySelector('[data-testid="marken-logo"]');
            return {
              schriftText: (schriften?.innerText ?? ""),
              logoKnopf: logo?.querySelector('[data-testid="entferne-logo"]') !== null,
            };
          });
          console.log(`[schritt-4m2] Import: schrift=${importSchrift4m2}, logo=${importLogo4m2}, wieder geoeffnet=${String(neuGeoeffnet4m2)}, Store=${JSON.stringify({ schrift: standImport4m2?.schriften?.fliesstext, logo: standImport4m2?.logo })}, Anzeige=${JSON.stringify(importAnzeige4m2)}.`);
          if (importSchrift4m2 !== "ok" || importLogo4m2 !== "ok") {
            fund("Marken-Rest (FA-24)", "Schrift- und Logo-Import nehmen eine echte Datei an",
              `schrift=${importSchrift4m2}, logo=${importLogo4m2}`, "Befund", "marken-store/importiere-datei.ts");
          } else if (standImport4m2?.schriften?.fliesstext?.herkunft !== "importiert"
            || standImport4m2?.logo === null) {
            fund("Marken-Rest (FA-24)", "der Import steht danach im Bestand (herkunft importiert, Logo gesetzt)",
              JSON.stringify({ schrift: standImport4m2?.schriften?.fliesstext, logo: standImport4m2?.logo }),
              "Befund", "marken-store/importiere-datei.ts");
          } else if (!importAnzeige4m2.schriftText.includes("(importiert)") || !importAnzeige4m2.logoKnopf) {
            fund("Marken-Rest (FA-24)", "der Editor zeigt die importierte Schrift und den Logo-Weg",
              JSON.stringify(importAnzeige4m2), "Befund", "marken-editor/index.tsx");
          } else {
            console.log("[schritt-4m2] Import GEMESSEN: Schrift herkunft=importiert, Logo gesetzt, Anzeige folgt.");

            // (6) "Logo entfernen" ueber den echten Knopf. ENTSCHEIDUNG #440 (22.10.2026):
            // Bei einer EIGENSTAENDIGEN Marke faellt das Logo auf null zurueck (Ersatz-Logo
            // mit dem Markennamen, TK 9.10.10) - nicht auf das gebuendelte Fremdlogo der
            // eingebauten Marke. Der Hinweis HINWEIS_LOGO_ENTFERNT sagt genau das.
            await seite.evaluate(() => {
              document.querySelector('[data-testid="entferne-logo"]')?.click();
            });
            const ohneLogo4m2 = await warteAuf4m2(id4m2, (m) => m.logo === null);
            const logo4m2 = ohneLogo4m2?.logo ?? null;
            console.log(`[schritt-4m2] Nach Logo entfernen: ${JSON.stringify(logo4m2)}.`);
            if (ohneLogo4m2 === null) {
              fund("Marken-Rest (FA-24)", "der Bestand ist nach dem Logo-Entfernen lesbar",
                "marken:listeMarken liefert die Marke nicht", "Befund", "marken-store/liste.ts");
            } else if (logo4m2 !== null) {
              fund("Marken-Rest (FA-24)", "Logo entfernen setzt bei einer eigenstaendigen Marke logo auf null (#440)",
                JSON.stringify(logo4m2), "Befund", "marken-store/dateien.ts");
            } else {
              console.log("[schritt-4m2] Logo entfernen GEMESSEN (logo=null, Ersatz-Logo greift).");
            }
          }

          // (7) Eine ABGELEITETE Marke bearbeiten: eigen setzen, Herkunft zeigt "Eigener Wert",
          // "Vererbung wiederherstellen" -> wieder geerbt.
          const eingabeFelder4m2 = await seite.$$('[data-testid="marken-liste"] input');
          const auswahl4m2 = await seite.$('[data-testid="marken-liste"] select');
          if (eingabeFelder4m2.length < 2 || auswahl4m2 === null) {
            fund("Marken-Rest (FA-24)", "Ableiten ist ueber die Oberflaeche bedienbar",
              `Eingaben=${eingabeFelder4m2.length}, select=${auswahl4m2 !== null}`,
              "Untersuchung", "marken-editor/index.tsx");
          } else {
            await seite.evaluate(({ name, basis }) => {
              const felder = [...document.querySelectorAll('[data-testid="marken-liste"] input')];
              const feld = felder[1];
              if (feld !== undefined) {
                const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                setzeWert.call(feld, name);
                feld.dispatchEvent(new Event("input", { bubbles: true }));
              }
              const auswahl = document.querySelector('[data-testid="marken-liste"] select');
              if (auswahl !== null) {
                const trage = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
                trage.call(auswahl, basis);
                auswahl.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }, { name: kind4m2, basis: id4m2 });
            await seite.evaluate(() => {
              document.querySelector('[data-testid="marke-ableiten"]')?.click();
            });
            const fristKind4m2 = Date.now() + 15_000;
            let kind4m2Da = false;
            while (Date.now() < fristKind4m2) {
              kind4m2Da = await seite.evaluate((n) => {
                const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
                return knoepfe.some((k) => (k.textContent ?? "").trim() === n);
              }, kind4m2);
              if (kind4m2Da) break;
              await schlafe(250);
            }
            const kindId4m2 = await seite.evaluate(async (n) => {
              const antwort = await window.api.invoke("marken:listeMarken");
              if (!antwort || !antwort.ok) return null;
              return antwort.wert.find((m) => m.name === n)?.id ?? null;
            }, kind4m2);
            if (!kind4m2Da || kindId4m2 === null || !(await oeffne4m2(kind4m2))) {
              fund("Marken-Rest (FA-24)", "eine abgeleitete Marke laesst sich oeffnen",
                `Kind=${String(kind4m2Da)}, id=${String(kindId4m2)}`, "Befund", "marken-editor/marke-ableiten.ts");
            } else {
              await setzeWert4m2("farbe-akzent", "#0e0e0e", "blur");
              const eigenStand4m2 = await warteAuf4m2(kindId4m2,
                (m) => m.herkunftJeFeld.farben.akzent === "eigen");
              const eigenAnzeige4m2 = await seite.evaluate(() => ({
                text: (document.querySelector('[data-testid="herkunft-farbe"]')?.textContent ?? "").trim(),
                knopf: document.querySelector('[data-testid="herkunft-zurueck-farbe"]') !== null,
              }));
              console.log(`[schritt-4m2] Eigenwert am Kind: Store=${String(eigenStand4m2?.herkunftJeFeld?.farben?.akzent)}, Anzeige=${JSON.stringify(eigenAnzeige4m2)}.`);
              if (eigenStand4m2 === null || eigenStand4m2.herkunftJeFeld.farben.akzent !== "eigen") {
                fund("Marken-Rest (FA-24)", "ein gesetzter Wert am Kind wird als EIGEN gefuehrt",
                  String(eigenStand4m2?.herkunftJeFeld?.farben?.akzent), "Befund", "marken-store/vererbung.ts");
              } else if (!eigenAnzeige4m2.text.includes("Eigener Wert") || !eigenAnzeige4m2.knopf) {
                fund("Marken-Rest (FA-24)", "der Editor zeigt 'Eigener Wert' und den Weg zurueck (TK 9.15.2)",
                  JSON.stringify(eigenAnzeige4m2), "Befund", "marken-editor/herkunft-anzeigen.ts");
              } else {
                console.log("[schritt-4m2] Eigenwert-Anzeige GEMESSEN ('Eigener Wert' + Rueckweg).");
                await seite.evaluate(() => {
                  document.querySelector('[data-testid="herkunft-zurueck-farbe"]')?.click();
                });
                const geerbt4m2 = await warteAuf4m2(kindId4m2,
                  (m) => m.herkunftJeFeld.farben.akzent === "geerbt");
                const zurueckText4m2 = await seite.evaluate(
                  () => (document.querySelector('[data-testid="herkunft-farbe"]')?.textContent ?? "").trim(),
                );
                console.log(`[schritt-4m2] Vererbung zurueck: Store=${String(geerbt4m2?.herkunftJeFeld?.farben?.akzent)}, Anzeige="${zurueckText4m2}".`);
                if (geerbt4m2 === null || geerbt4m2.herkunftJeFeld.farben.akzent !== "geerbt"
                  || !zurueckText4m2.includes("Geerbt von")) {
                  fund("Marken-Rest (FA-24)", "die Vererbung laesst sich wiederherstellen",
                    `Store=${String(geerbt4m2?.herkunftJeFeld?.farben?.akzent)}, Anzeige="${zurueckText4m2}"`,
                    "Befund", "marken-editor/herkunft-anzeigen.ts");
                } else {
                  console.log("[schritt-4m2] Vererbung-wiederherstellen GEMESSEN (eigen -> geerbt).");
                }
              }
            }
          }
        }

        // Aufraeumen: Kind zuerst, dann die Basis (die Basis ist sonst referenziert).
        const loesche4m2 = async (n) => {
          const vorhanden = await seite.evaluate((name) => {
            const knoepfe = [...document.querySelectorAll('[data-testid="marken-liste"] > div > div > button')];
            return knoepfe.some((k) => (k.textContent ?? "").trim() === name);
          }, n);
          if (!vorhanden) return false;
          await oeffne4m2(n);
          await seite.evaluate(() => {
            document.querySelector('[data-testid="loeschengesuch"]')?.click();
          });
          const frist = Date.now() + 10_000;
          let bestaetigen = false;
          while (Date.now() < frist) {
            bestaetigen = await seite.evaluate(
              () => [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                .some((b) => (b.textContent ?? "").trim() === "Löschen bestätigen"),
            );
            if (bestaetigen) break;
            await schlafe(250);
          }
          if (bestaetigen) {
            await seite.evaluate(() => {
              const knopf = [...document.querySelectorAll('[data-testid="marken-offen"] button')]
                .find((b) => (b.textContent ?? "").trim() === "Löschen bestätigen");
              if (knopf !== undefined) knopf.click();
            });
            await schlafe(1_200);
          }
          return seite.evaluate(async (name) => {
            const antwort = await window.api.invoke("marken:listeMarken");
            if (!antwort || !antwort.ok) return null;
            return antwort.wert.some((m) => m.name === name);
          }, n);
        };
        // Die Kennung VOR dem Loeschen merken: Danach ist die Marke weg, und der Ordner
        // marken-assets/<markeId>/ muss mit ihr verschwunden sein (#441).
        const aufraeumId4m2 = await seite.evaluate(async (n) => {
          const antwort = await window.api.invoke("marken:listeMarken");
          if (!antwort || !antwort.ok) return null;
          return antwort.wert.find((m) => m.name === n)?.id ?? null;
        }, name4m2);
        const kindNochDa4m2 = await loesche4m2(kind4m2);
        const basisNochDa4m2 = await loesche4m2(name4m2);
        console.log(`[schritt-4m2] Aufraeumen: Kind noch da=${String(kindNochDa4m2)}, Basis noch da=${String(basisNochDa4m2)}.`);
        if (kindNochDa4m2 === true || basisNochDa4m2 === true) {
          fund("Marken-Rest (FA-24)", "die Messmarken lassen sich wieder loeschen",
            `Kind=${String(kindNochDa4m2)}, Basis=${String(basisNochDa4m2)}`, "Untersuchung", "marken-editor/index.tsx");
        }
        if (aufraeumId4m2 !== null) {
          // #441: der Store raeumt den Ordner mit der Marke ab. Beleg am Dateisystem.
          const ordner4m2 = path.join(WURZEL, "marken-assets", aufraeumId4m2);
          const ordnerDa4m2 = fs.existsSync(ordner4m2);
          console.log(`[schritt-4m2] marken-assets-Ordner nach dem Loeschen: ${String(ordnerDa4m2)} (${aufraeumId4m2}).`);
          if (ordnerDa4m2) {
            fund("Marken-Rest (FA-24)", "der Ordner marken-assets/<markeId>/ verschwindet mit der Marke (#441)",
              `Ordner besteht weiter: ${aufraeumId4m2}`, "Befund", "marken-store/loesche-marke.ts");
          } else {
            console.log("[schritt-4m2] marken-assets-Aufraeumen GEMESSEN (Ordner mit der Marke weg, #441).");
          }
        }
      }
    }

    // Schritt 4n - FA-13: Vorlagen anlegen, Zone hinzufuegen, speichern, verwerfen.
    // Gemessen wird am echten Editor; die Belege kommen aus `vorlagen:listeVorlagen`
    // (Parent) und `vorlagen:listeArbeitskopien` (Arbeitskopie). Die Testvorlage wird
    // am Ende ueber `vorlagen:löscheVorlage` entfernt - sonst bliebe sie in vorlagen.json.
    {
      const name4n = "DurchlaufVorlage-" + Date.now();
      const leseVorlagen4n = () => seite.evaluate(async () => {
        const antwort = await window.api.invoke("vorlagen:listeVorlagen");
        return antwort && antwort.ok ? antwort.wert : null;
      });
      const leseArbeitskopien4n = () => seite.evaluate(async () => {
        const antwort = await window.api.invoke("vorlagen:listeArbeitskopien");
        return antwort && antwort.ok ? antwort.wert : null;
      });
      const warteVorlage4n = async (id, pruefung, fristMs = 20_000) => {
        const frist = Date.now() + fristMs;
        let letzte = null;
        while (Date.now() < frist) {
          const liste = await leseVorlagen4n();
          letzte = liste === null ? null : liste.find((v) => v.id === id) ?? null;
          if (letzte !== null && pruefung(letzte)) return letzte;
          await schlafe(250);
        }
        return letzte;
      };
      let id4n = null;
      try {
        await klick('[data-testid="reiter-vorlagen"]');
        await schlafe(800);
        // Eine aus Schritt 4 offene Sitzung zuerst beenden, sonst steht die Uebersicht nicht.
        const sitzungOffen4n = await seite.evaluate(
          () => document.querySelector('[data-testid="arbeitskopie-kopf"]') !== null,
        );
        if (sitzungOffen4n) {
          await seite.evaluate(() => document.querySelector('[data-testid="vorlage-verwerfen"]')?.click());
          await schlafe(1_200);
        }
        const neuKnopf4n = await seite.$('[data-testid="vorlagen-neu-vollflaeche"]');
        if (neuKnopf4n === null) {
          fund("Vorlagen (FA-13)", "der Weg 'Neu: vollflaeche' steht in der Uebersicht",
            "vorlagen-neu-vollflaeche fehlt", "Befund", "vorlagen-editor/index.tsx");
        } else {
          await neuKnopf4n.click();
          neuKnopf4n.dispose?.();
          await schlafe(300);
          const nameGesetzt4n = await seite.evaluate((n) => {
            const feld = document.querySelector('[data-testid="vorlage-name"]');
            if (feld === null) return false;
            const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            setzeWert.call(feld, n);
            feld.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }, name4n);
          await seite.evaluate(() => {
            document.querySelector('[data-testid="vorlage-anlegen-bestaetigen"]')?.click();
          });
          const fristSitzung4n = Date.now() + 15_000;
          let sitzungDa4n = false;
          while (Date.now() < fristSitzung4n) {
            sitzungDa4n = await seite.evaluate(
              () => document.querySelector('[data-testid="arbeitskopie-kopf"]') !== null,
            );
            if (sitzungDa4n) break;
            await schlafe(250);
          }
          const listeNachAnlegen4n = await leseVorlagen4n();
          id4n = listeNachAnlegen4n?.find((v) => v.name === name4n)?.id ?? null;
          console.log(`[schritt-4n] Anlegen: nameGesetzt=${String(nameGesetzt4n)}, Sitzung=${String(sitzungDa4n)}, id=${String(id4n)}.`);
          if (!nameGesetzt4n || !sitzungDa4n || id4n === null) {
            fund("Vorlagen (FA-13)", "eine eigene Vorlage laesst sich anlegen und oeffnen",
              `Sitzung=${String(sitzungDa4n)}, id=${String(id4n)}`, "Befund", "vorlagen-editor/index.tsx");
          } else {
            const vorher4n = await warteVorlage4n(id4n, () => true);
            const zonenVor4n = vorher4n?.zonen.length ?? null;
            // Eine Textzone hinzufuegen (der Knopf ist der oeffentliche Weg, #147).
            const zoneKlick4n = await seite.evaluate(() => {
              const knopf = [...document.querySelectorAll('[data-testid="zone-hinzufuegen"] button')]
                .find((b) => (b.textContent ?? "").includes("Textzone"));
              if (knopf === undefined) return false;
              knopf.click();
              return true;
            });
            await schlafe(1_200);
            const arbeitskopien4n = await leseArbeitskopien4n();
            const kopie4n = arbeitskopien4n?.find((v) => v.parent === id4n) ?? null;
            console.log(`[schritt-4n] Zone: geklickt=${String(zoneKlick4n)}, Zonen Parent ${String(zonenVor4n)} -> Arbeitskopie ${String(kopie4n?.zonen.length)}, Knopf "uebernehmen"=${String(await seite.evaluate(() => {
              const k = document.querySelector('[data-testid="vorlage-uebernehmen"]');
              return k === null ? null : k.disabled === false;
            }))}.`);
            if (!zoneKlick4n || zonenVor4n === null || kopie4n === null || kopie4n.zonen.length !== zonenVor4n + 1) {
              fund("Vorlagen (FA-13)", "eine Textzone landet in der ARBEITSKOPIE (nicht im Parent)",
                `Parent=${String(zonenVor4n)}, Kopie=${String(kopie4n?.zonen.length)}`,
                "Befund", "vorlagen-editor/index.tsx");
            } else {
              await seite.evaluate(() => document.querySelector('[data-testid="vorlage-uebernehmen"]')?.click());
              const gespeichert4n = await warteVorlage4n(id4n, (v) => v.zonen.length === zonenVor4n + 1);
              // Die Sitzung schliesst NACH dem Schreibvorgang: Der Bestand ist schon
              // aktualisiert, waehrend React noch rendert. Deshalb MIT FRIST warten statt
              // EINMAL zu lesen - der Einmal-Leser war am 28.10.2026 in 2 von 3 Laeufen rot,
              // ohne dass sich am Produktcode etwas geaendert hatte (Messfehler, kein Befund).
              const fristSitzungZu4n = Date.now() + 5_000;
              let sitzungNach4n = true;
              while (Date.now() < fristSitzungZu4n) {
                sitzungNach4n = await seite.evaluate(
                  () => document.querySelector('[data-testid="arbeitskopie-kopf"]') !== null,
                );
                if (!sitzungNach4n) break;
                await schlafe(250);
              }
              console.log(`[schritt-4n] Speichern: Zonen Parent=${String(gespeichert4n?.zonen.length)} (erwartet ${String(zonenVor4n + 1)}), Sitzung noch offen=${String(sitzungNach4n)}.`);
              if (gespeichert4n === null || gespeichert4n.zonen.length !== zonenVor4n + 1) {
                fund("Vorlagen (FA-13)", "„Vorlage uebernehmen' schreibt die Zone in den Parent",
                  `Zonen=${String(gespeichert4n?.zonen.length)}`, "Befund", "vorlagen-editor/index.tsx");
              } else if (sitzungNach4n) {
                fund("Vorlagen (FA-13)", "nach dem Uebernehmen ist die Sitzung beendet",
                  "arbeitskopie-kopf steht noch", "Befund", "vorlagen-editor/index.tsx");
              } else {
                // Zweiter Durchgang: Zone hinzufuegen, dann VERWERFEN - der Parent bleibt.
                const zeile4n = await seite.$(`[data-testid="vorlage-bearbeiten-${id4n}"]`);
                if (zeile4n === null) {
                  fund("Vorlagen (FA-13)", "die gespeicherte Vorlage laesst sich erneut bearbeiten",
                    "vorlage-bearbeiten fehlt", "Befund", "vorlagen-editor/index.tsx");
                } else {
                  await zeile4n.click();
                  zeile4n.dispose?.();
                  await schlafe(1_200);
                  await seite.evaluate(() => {
                    const knopf = [...document.querySelectorAll('[data-testid="zone-hinzufuegen"] button')]
                      .find((b) => (b.textContent ?? "").includes("Textzone"));
                    if (knopf !== undefined) knopf.click();
                  });
                  await schlafe(1_000);
                  await seite.evaluate(() => document.querySelector('[data-testid="vorlage-verwerfen"]')?.click());
                  await schlafe(1_500);
                  const nachVerwerfen4n = await warteVorlage4n(
                    id4n, (v) => v.zonen.length === zonenVor4n + 1,
                  );
                  const kopieWeg4n = (await leseArbeitskopien4n())?.some((v) => v.parent === id4n) ?? true;
                  console.log(`[schritt-4n] Verwerfen: Zonen Parent=${String(nachVerwerfen4n?.zonen.length)} (erwartet ${String(zonenVor4n + 1)}), Arbeitskopie=${String(kopieWeg4n)}.`);
                  if (nachVerwerfen4n === null || nachVerwerfen4n.zonen.length !== zonenVor4n + 1) {
                    fund("Vorlagen (FA-13)", "„Verwerfen' laesst den Parent unveraendert",
                      `Zonen=${String(nachVerwerfen4n?.zonen.length)}`, "Befund", "vorlagen-editor/index.tsx");
                  } else if (kopieWeg4n) {
                    fund("Vorlagen (FA-13)", "nach dem Verwerfen ist keine Arbeitskopie mehr da",
                      "Arbeitskopie steht noch", "Befund", "vorlagen-editor/index.tsx");
                  } else {
                    console.log("[schritt-4n] Vorlagen GEMESSEN: anlegen, Zone in der Arbeitskopie, uebernehmen -> Parent, erneut aendern -> verwerfen -> Parent unveraendert (FA-13).");
                  }
                }
              }
            }
          }
        }
      } finally {
        // Aufraeumen: die Testvorlage entfernen (sonst bleibt sie in vorlagen.json).
        if (id4n !== null) {
          const weg4n = await seite.evaluate(async (id) => {
            const antwort = await window.api.invoke("vorlagen:löscheVorlage", { id });
            return antwort && antwort.ok ? true : JSON.stringify(antwort?.fehler ?? antwort);
          }, id4n);
          console.log(`[schritt-4n] Aufraeumen: loeschen=${JSON.stringify(weg4n)}.`);
          await klick('[data-testid="reiter-zusammenstellen"]');
          await schlafe(300);
        }
      }
    }

    // Schritt 4r - FA-13 / #100: Die EINBLENDUNG ist seit der Entscheidung vom 23.10.2026
    // anlegbar (AD v1.9 / TK 9.11.1) - mit den festen Zonen des Bandes, aber dem
    // Scrim-Verlauf als Hintergrund statt der deckenden Fuellung. Gemessen wird am echten
    // Editor; der Bestand kommt aus `vorlagen:listeVorlagen`.
    {
      const name4r = "DurchlaufEinblendung-" + Date.now();
      const leseVorlagen4r = () => seite.evaluate(async () => {
        const antwort = await window.api.invoke("vorlagen:listeVorlagen");
        return antwort && antwort.ok ? antwort.wert : null;
      });
      let id4r = null;
      try {
        await klick('[data-testid="reiter-vorlagen"]');
        await schlafe(800);
        const sitzungOffen4r = await seite.evaluate(
          () => document.querySelector('[data-testid="arbeitskopie-kopf"]') !== null,
        );
        if (sitzungOffen4r) {
          await seite.evaluate(() => document.querySelector('[data-testid="vorlage-verwerfen"]')?.click());
          await schlafe(1_200);
        }
        const neuKnopf4r = await seite.$('[data-testid="vorlagen-neu-einblendung"]');
        if (neuKnopf4r === null) {
          fund("Einblendung anlegen (FA-13)", "der Weg 'Neu: einblendung' steht in der Uebersicht",
            "vorlagen-neu-einblendung fehlt", "Befund", "vorlagen-editor/index.tsx");
        } else {
          await neuKnopf4r.click();
          neuKnopf4r.dispose?.();
          await schlafe(300);
          const nameGesetzt4r = await seite.evaluate((n) => {
            const feld = document.querySelector('[data-testid="vorlage-name"]');
            if (feld === null) return false;
            const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            setzeWert.call(feld, n);
            feld.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }, name4r);
          await seite.evaluate(() => {
            document.querySelector('[data-testid="vorlage-anlegen-bestaetigen"]')?.click();
          });
          const frist4r = Date.now() + 15_000;
          let neu4r = null;
          while (Date.now() < frist4r) {
            const liste = await leseVorlagen4r();
            neu4r = liste === null ? null : liste.find((v) => v.name === name4r) ?? null;
            if (neu4r !== null) break;
            await schlafe(250);
          }
          id4r = neu4r === null ? null : neu4r.id;
          const zonen4r = neu4r === null ? [] : neu4r.zonen;
          const zoneHintergrund4r = zonen4r.find((z) => z.id === 'hintergrund') ?? null;
          const zoneLogo4r = zonen4r.find((z) => z.id === 'logo') ?? null;
          const verlauf4r = zoneHintergrund4r?.deko?.verlauf ?? null;
          console.log(`[schritt-4r] Einblendung: nameGesetzt=${String(nameGesetzt4r)}, gefunden=${String(neu4r !== null)}, art=${String(neu4r?.art)}, hoehe=${String(neu4r?.höhe)}, zonen=${JSON.stringify(zonen4r.map((z) => z.id))}, hintergrund=${JSON.stringify(zoneHintergrund4r?.deko)}, logo=${JSON.stringify(zoneLogo4r?.rahmen)}.`);
          if (!nameGesetzt4r || neu4r === null) {
            fund("Einblendung anlegen (FA-13)", "eine eigene Einblendung laesst sich anlegen",
              `gefunden=${String(neu4r !== null)}`, "Befund", "vorlagen-editor/index.tsx");
          } else if (neu4r.art !== 'einblendung' || neu4r.höhe !== 162) {
            fund("Einblendung anlegen (FA-13)", "die Einblendung traegt art=einblendung und hoehe=162",
              `art=${String(neu4r.art)}, hoehe=${String(neu4r.höhe)}`, "Befund", "vorlagen-store/erstelle-vorlage.ts");
          } else if (zonen4r.map((z) => z.id).join(',') !== 'hintergrund,logo') {
            fund("Einblendung anlegen (FA-13)", "die festen Zonen sind hintergrund und logo (Reihenfolge)",
              JSON.stringify(zonen4r.map((z) => z.id)), "Befund", "vorlagen-store/erstelle-vorlage.ts");
          } else if (verlauf4r === null
            || verlauf4r.vonFarbRolle !== 'scrimStart'
            || verlauf4r.bisFarbRolle !== 'scrimEnde'
            || verlauf4r.richtung !== 'unten'
            || zoneHintergrund4r?.deko?.füllungFarbRolle !== undefined) {
            fund("Einblendung anlegen (FA-13)", "der Hintergrund traegt den Scrim-Verlauf scrimStart -> scrimEnde (unten), keine deckende Fuellung",
              JSON.stringify(zoneHintergrund4r?.deko), "Befund", "vorlagen-store/erstelle-vorlage.ts");
          } else if (zoneLogo4r === null
            || zoneLogo4r.rahmen.x !== 96 || zoneLogo4r.rahmen.y !== 20
            || zoneLogo4r.rahmen.breite !== 240 || zoneLogo4r.rahmen.höhe !== 69) {
            fund("Einblendung anlegen (FA-13)", "das Logo steht auf dem Band-Rahmen (96, 20, 240, 69)",
              JSON.stringify(zoneLogo4r?.rahmen), "Befund", "vorlagen-store/erstelle-vorlage.ts");
          } else {
            console.log("[schritt-4r] Einblendung GEMESSEN: art=einblendung, hoehe=162, Zonen [hintergrund, logo], Scrim-Verlauf, Logo (96, 20, 240, 69) (#100/FA-13).");
          }
        }
      } finally {
        // Aufraeumen: Sitzung beenden, dann die Testvorlage entfernen (sonst bleibt sie in vorlagen.json).
        await seite.evaluate(() => document.querySelector('[data-testid="vorlage-verwerfen"]')?.click());
        await schlafe(800);
        if (id4r !== null) {
          const weg4r = await seite.evaluate(async (id) => {
            const antwort = await window.api.invoke("vorlagen:löscheVorlage", { id });
            return antwort && antwort.ok ? true : JSON.stringify(antwort?.fehler ?? antwort);
          }, id4r);
          console.log(`[schritt-4r] Aufraeumen: loeschen=${JSON.stringify(weg4r)}.`);
        }
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(300);
      }
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
          // #422: Das importierte Video landet AUTOMATISCH in der Wiedergabeliste - an
          // der Video-Zeile gibt es KEIN "Zur Liste hinzufuegen" mehr. Gemessen wird
          // also OHNE jeden Klick, dass die Sicht das Element von selbst traegt.
          // Abgewiesene Rufe der automatischen Uebernahme werden gesammelt und belegt.
          await seite.evaluate(() => {
            window.__durchlauf.ablehnungen = [];
            window.addEventListener('unhandledrejection', (ereignis) => {
              window.__durchlauf.ablehnungen.push(String(ereignis.reason));
            });
          });
          const zeileHatHinzufuegen = await seite.evaluate(() => {
            const zeile = document.querySelector('[data-testid^="medium-"]');
            return zeile === null
              ? null
              : [...(zeile.querySelectorAll('button') ?? [])].some((k) => k.textContent === "Zur Liste hinzufügen");
          });
          console.log("[schritt-4b] Video-Zeile hat 'Zur Liste hinzufuegen': " + String(zeileHatHinzufuegen) + " (soll false sein, #422)");
          if (zeileHatHinzufuegen === true) {
            fund("Sicht-Aktualitaet", "die Video-Zeile traegt KEIN 'Zur Liste hinzufuegen' (#422)",
              "Knopf ist noch da", "Befund", "composer/bibliothek-ansicht.tsx");
          }
          await schlafe(3_500);

          const listeDiag = await seite.evaluate(() => ({
            zeilen: document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
            listeDa: !!document.querySelector('[data-testid="wiedergabeliste"]'),
            leerDa: !!document.querySelector('[data-testid="wiedergabeliste-leer"]'),
            // #414: die zeitleiste-Kanten-bedingten Bloecken sind die PRIMIaERE Sicht.
            bloecke: document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
            ladefehler: document.querySelector('[data-testid="composer-ladefehler"]')?.textContent ?? null,
            meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
            ablehnungen: window.__durchlauf.ablehnungen ?? [],
          }));
          console.log("[schritt-4b] Listen-Diagnostik: " + JSON.stringify(listeDiag));
          const sichtZeigtElement = listeDiag.zeilen > 0 || listeDiag.bloecke > 0;
          if (!sichtZeigtElement) {
            fund("Sicht-Aktualitaet", "Liste zeigt das automatisch uebernommene Video (#422)",
              "kein Klick erfolgte, aber 0 Zeilen (Liste) und 0 Bloecke (Zeitleiste) in der Ansicht", "Befund", "composer/index.tsx");
          } else {
            console.log(`[schritt-4b] Die Sicht zeigt ${sichtZeigtElement ? (listeDiag.bloecke > 0 ? listeDiag.bloecke + " Zeitleisten-Bloecke" : listeDiag.zeilen + " Listen-Zeilen") : "nichts"} nach dem Import (#422 automatisch belegt).`);
          }
        }

        // Schritt 4b3 - Videostage am echten Fenster (#419): Zeigt die Buehne das Video,
        // und laeuft der Transport? Gemessen werden die Buehnen-Maße (der #414-Kandidat
        // "Buehne kollabiert") und der Play-Weg (currentTime + Uhr-Frame).
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(600);
        const buehneDiag = await seite.evaluate(() => {
          const kasten = document.querySelector('[data-testid="buehne-kasten"]');
          const flaeche = document.querySelector('[data-testid="buehne-flaeche"]');
          const video = document.querySelector('[data-testid="preview-video"] video');
          const kv = kasten === null ? null : kasten.getBoundingClientRect();
          const fv = flaeche === null ? null : flaeche.getBoundingClientRect();
          const vv = video === null ? null : video.getBoundingClientRect();
          const medium = document.querySelector('[data-testid^="medium-"]');
          const galerie = document.querySelector('[data-testid^="galerie-eintrag-"]');
          return {
            vorschau: !!document.querySelector('[data-testid="vorschau"]'),
            kasten: kv === null ? null : { w: Math.round(kv.width), h: Math.round(kv.height) },
            flaeche: fv === null ? null : { w: Math.round(fv.width), h: Math.round(fv.height) },
            videoDa: video !== null,
            video: vv === null ? null : { w: Math.round(vv.width), h: Math.round(vv.height) },
            playLabel: document.querySelector('[data-testid="vorschau-play-pause"]')?.textContent ?? null,
            // #418: das nach dem Import standardmaessig ausgewaehlte Video.
            auswahlMedium: medium === null ? null : medium.getAttribute('data-ausgewaehlt'),
            auswahlGalerie: galerie === null ? null : galerie.getAttribute('data-ausgewaehlt'),
          };
        });
        console.log("[schritt-4b3] Videostage: " + JSON.stringify(buehneDiag));
        if (buehneDiag.auswahlMedium !== 'true' && buehneDiag.auswahlGalerie !== 'true') {
          fund("Import-Auswahl", "das importierte Video ist standardmaessig ausgewaehlt (#418)",
            `medium=${buehneDiag.auswahlMedium}, galerie=${buehneDiag.auswahlGalerie}`,
            "Befund", "composer/index.tsx");
        } else {
          console.log(`[schritt-4b3] Import-Auswahl GEMESSEN: medium=${buehneDiag.auswahlMedium}, galerie=${buehneDiag.auswahlGalerie}.`);
        }
        if (buehneDiag.kasten === null || buehneDiag.kasten.h < 10) {
          fund("Videostage", "die Buehne hat eine sichtbare Hoehe (> 10 px)",
            `Kasten/Flaeche: ${JSON.stringify(buehneDiag.kasten)}/${JSON.stringify(buehneDiag.flaeche)}`,
            "Befund", "preview-player/vorschau.tsx");
        } else {
          console.log(`[schritt-4b3] Buehne hat Hoehe ${buehneDiag.kasten.h} px; Video-Box ${JSON.stringify(buehneDiag.video)}.`);
        }
        await klick('[data-testid="vorschau-play-pause"]');
        await schlafe(1_200);
        const playDiag = await seite.evaluate(() => {
          const video = document.querySelector('[data-testid="preview-video"] video');
          return {
            playLabel: document.querySelector('[data-testid="vorschau-play-pause"]')?.textContent ?? null,
            currentTime: video === null ? null : Math.round((video.currentTime ?? 0) * 100) / 100,
            paused: video === null ? null : video.paused,
            frame: document.querySelector('[data-testid="vorschau-zeitleiste"]')?.value ?? null,
          };
        });
        console.log("[schritt-4b3] Play: " + JSON.stringify(playDiag));
        const lief = playDiag.currentTime !== null && playDiag.currentTime > 0;
        const uhrLief = playDiag.frame !== null && Number(playDiag.frame) > 0;
        if (!lief && !uhrLief) {
          fund("Videostage", "Play bewegt die Vorschau (currentTime > 0 oder Uhr-Frame > 0)",
            JSON.stringify(playDiag), "Befund", "preview-player/vorschau.tsx");
        } else {
          console.log(`[schritt-4b3] Play GEMESSEN: currentTime=${playDiag.currentTime}, Uhr-Frame=${playDiag.frame}.`);
        }
        await klick('[data-testid="vorschau-play-pause"]');
        await schlafe(300);
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

        // Schritt 4b4 - Filmstreifen (#433): zeigt der Video-Block die EINZELBILDER des
        // Videos? Der Baustein holt sie ueber media:// (wie die Thumbnails, #128).
        await schlafe(1_500);
        const filmDiag = await seite.evaluate(() => ({
          streifen: document.querySelectorAll('[data-testid="zeitleiste-filmstreifen"]').length,
          bilder: document.querySelectorAll('[data-testid="zeitleiste-filmstreifen-bild"]').length,
        }));
        console.log("[schritt-4b4] Filmstreifen: " + JSON.stringify(filmDiag));
        if (filmDiag.streifen === 0 || filmDiag.bilder === 0) {
          fund("Frames-Anzeige", "der Video-Block zeigt Einzelbilder des Videos (#433)",
            JSON.stringify(filmDiag), "Befund", "composer/zeitleiste.tsx");
        } else {
          console.log(`[schritt-4b4] Filmstreifen GEMESSEN: ${filmDiag.bilder} Einzelbild(er) im Video-Block (#433 belegt).`);
        }
        // Gegenprobe: Hineinzoomen verbreitert den Block - es muessen MEHR Einzelbilder werden.
        for (let i = 0; i < 4; i++) await klick('[data-testid="zeitleiste-zoom-ein"]');
        await schlafe(1_500);
        const filmZoom = await seite.evaluate(() => ({
          bilder: document.querySelectorAll('[data-testid="zeitleiste-filmstreifen-bild"]').length,
          wert: document.querySelector('[data-testid="zeitleiste-zoom-wert"]')?.textContent ?? null,
        }));
        console.log("[schritt-4b4] Filmstreifen nach Zoom +: " + JSON.stringify(filmZoom));
        if (filmZoom.bilder <= filmDiag.bilder) {
          fund("Frames-Anzeige", "Hineinzoomen zeigt mehr Einzelbilder (#433)",
            `${filmDiag.bilder} -> ${filmZoom.bilder} (${String(filmZoom.wert)})`,
            "Befund", "composer/zeitleiste.tsx");
        } else {
          console.log(`[schritt-4b4] Zoom GEMESSEN: ${filmDiag.bilder} -> ${filmZoom.bilder} Einzelbilder bei ${String(filmZoom.wert)}.`);
        }

        // Schritt 4o - #394: Die Statistik war gebaut, aber ohne Aufrufer; seit 28.10. sitzt
        // sie als flache Leiste in der Kopfzeile des Composers. Gemessen wird, dass sie DA
        // ist und dass ihre Zahlen zum Bestand passen. Die Gesamtdauer wird NICHT im
        // Treiber nachgerechnet - eine zweite Rechnung waere eine zweite Quelle (TK 9.7.4);
        // geprueft wird die Form der Anzeige und die Zaehler gegen project.json.
        {
          const projektDatei4o = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
          const stand4o = JSON.parse(fs.readFileSync(projektDatei4o, "utf-8"));
          const statistik4o = await seite.evaluate(() => {
            const wert = (name) => document.querySelector(`[data-testid="statistik-${name}"]`)?.textContent ?? null;
            const leiste = document.querySelector('[data-testid="statistik"]');
            const wurzel = document.querySelector('[data-testid="composer-wurzel"]');
            return {
              da: leiste !== null,
              inKopfzeile: leiste !== null && wurzel !== null && wurzel.contains(leiste),
              text: leiste === null ? null : leiste.innerText,
              gesamt: wert('Gesamtdauer'),
              elemente: wert('Elemente'),
              videos: wert('Videos'),
              segmente: wert('Aktions-Segmente'),
              warnung: document.querySelector('[data-testid^="statistik-30-Minuten"]')?.textContent ?? null,
            };
          });
          const liste4o = stand4o.liste ?? [];
          const erwartet4o = {
            elemente: String(liste4o.length),
            videos: String(liste4o.filter((e) => e.art === 'video').length),
            segmente: String(liste4o.filter((e) => e.art === 'segment').length),
          };
          console.log(`[schritt-4o] Statistik: ${JSON.stringify(statistik4o)}; Bestand=${JSON.stringify(erwartet4o)}.`);
          if (!statistik4o.da || !statistik4o.inKopfzeile) {
            fund("Statistik (#394)", "die Statistik-Leiste steht im Composer (Kopfzeile)",
              `da=${String(statistik4o.da)}, inKopfzeile=${String(statistik4o.inKopfzeile)}`,
              "Befund", "composer/index.tsx");
          } else if (statistik4o.gesamt === null || !/^\d+(:\d{2}){1,2}$/.test(statistik4o.gesamt)) {
            fund("Statistik (#394)", "die Gesamtdauer wird angezeigt (m:ss)",
              `Gesamtdauer=${JSON.stringify(statistik4o.gesamt)}`, "Befund", "composer/statistik.tsx");
          } else if (statistik4o.elemente !== erwartet4o.elemente
            || statistik4o.videos !== erwartet4o.videos
            || statistik4o.segmente !== erwartet4o.segmente) {
            fund("Statistik (#394)", "Elemente/Videos/Segmente stimmen mit dem Bestand",
              `Anzeige=${JSON.stringify({ elemente: statistik4o.elemente, videos: statistik4o.videos, segmente: statistik4o.segmente })} Bestand=${JSON.stringify(erwartet4o)}`,
              "Befund", "composer/statistik.tsx");
          } else if (statistik4o.warnung !== 'unter der Schwelle') {
            fund("Statistik (#394)", "die 30-Minuten-Warnung steht auf 'unter der Schwelle'",
              `Warnung=${JSON.stringify(statistik4o.warnung)}`, "Untersuchung", "composer/statistik.tsx");
          } else {
            console.log(`[schritt-4o] Statistik GEMESSEN: Gesamtdauer "${String(statistik4o.gesamt)}", ${erwartet4o.elemente} Element(e) / ${erwartet4o.videos} Video(s) / ${erwartet4o.segmente} Segment(e) (#394).`);
          }
        }

        // Schritt 4p - #364: PIXEL-BELEG am echten Fenster. Der Filmstreifen holt die
        // Videobytes als Blob-URL; nur dann ist die Aufnahme ungetaintet. Der Gegenbeweis
        // waere ein SecurityError bei `getImageData` - genau der Befund, der #364 ausgeloest
        // hat. Zusaetzlich: die BUEHNE muss weiterhin direkt media:// binden (DoD).
        {
          const pixel4p = await seite.evaluate(() => {
            const kacheln = [...document.querySelectorAll('[data-testid="zeitleiste-filmstreifen-bild"]')];
            const buehne = document.querySelector('[data-testid="preview-video"] video');
            const gelesen = kacheln.map((kachel) => {
              const lage = { breite: kachel.width, hoehe: kachel.height };
              try {
                const kontext = kachel.getContext('2d');
                if (kontext === null) return { ...lage, fehler: 'kein 2d-Kontext' };
                const daten = kontext.getImageData(0, 0, kachel.width, kachel.height).data;
                const farben = new Set();
                // Jede 37. Pixelprobe reicht: ein leeres Bild hat EINE Farbe, ein echtes
                // Videoframe viele.
                for (let i = 0; i + 2 < daten.length; i += 4 * 37) {
                  farben.add(`${daten[i]},${daten[i + 1]},${daten[i + 2]}`);
                }
                return { ...lage, farben: farben.size };
              } catch (tu) {
                return { ...lage, fehler: String(tu) };
              }
            });
            return {
              kacheln: kacheln.length,
              gelesen,
              buehneQuelle: buehne === null ? null : String(buehne.currentSrc || buehne.src || ''),
            };
          });
          console.log('[schritt-4p] Pixel-Beleg: ' + JSON.stringify(pixel4p));
          const fehler4p = pixel4p.gelesen.filter((e) => typeof e.fehler === 'string');
          const leer4p = pixel4p.gelesen.filter((e) => typeof e.farben === 'number' && e.farben <= 1);
          if (pixel4p.kacheln === 0) {
            fund("Canvas-Tainting (#364)", "der Filmstreifen traegt Kacheln mit lesbaren Pixeln",
              "keine Kachel im Fenster", "Befund", "composer/video-filmstreifen.tsx");
          } else if (fehler4p.length > 0) {
            fund("Canvas-Tainting (#364)", "getImageData auf einer Kachel wirft KEINEN SecurityError",
              JSON.stringify(fehler4p), "Befund", "composer/video-filmstreifen.tsx");
          } else if (leer4p.length > 0) {
            fund("Canvas-Tainting (#364)", "die gelesenen Kachel-Pixel tragen Bildinhalt (mehr als eine Farbe)",
              JSON.stringify(leer4p), "Befund", "composer/video-filmstreifen.tsx");
          } else {
            console.log(`[schritt-4p] Pixel-Beleg GEMESSEN: ${pixel4p.kacheln} Kachel(n), Farben je Kachel ${JSON.stringify(pixel4p.gelesen.map((e) => e.farben))} - kein SecurityError (#364).`);
          }
          if (pixel4p.buehneQuelle === null || !pixel4p.buehneQuelle.startsWith('media://')) {
            fund("Canvas-Tainting (#364)", "die Buehne bleibt bei der direkten media://-Quelle",
              `Buehnen-Quelle: ${String(pixel4p.buehneQuelle)}`, "Befund", "preview-player/video.tsx");
          } else {
            console.log(`[schritt-4p] Buehne GEMESSEN: ${pixel4p.buehneQuelle} (kein Blob, #364).`);
          }
        }

        // Schritt 4b7 - FA-01: EIN Video, ERSETZEN mit Rueckfrage. Der natuerliche Weg
        // (Dateidialog) ist nativ und nicht steuerbar; gemessen werden (a) die Rueckfrage
        // VOR dem Import, (b) Abbrechen aendert nichts, (c) die ERSETZEN-Wirkung, indem ein
        // zweites Video ueber denselben Kanal importiert wird, den der Dialog danach nimmt
        // (queue:reiheEin, wie der Medien-Seed 4b).
        {
          const projektDatei4b7 = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
          const liesProjekt4b7 = () => JSON.parse(fs.readFileSync(projektDatei4b7, "utf-8"));
          const videos4b7 = (p) => p.liste.filter((e) => e.art === "video");
          const vorher4b7 = liesProjekt4b7();
          const videoVor4b7 = videos4b7(vorher4b7);
          console.log(`[schritt-4b7] Ausgang: ${videoVor4b7.length} Video-Element(e), Bloecke ${vorher4b7.liste.length}.`);
          if (videoVor4b7.length !== 1) {
            fund("Video ersetzen (FA-01)", "genau EIN Video vor dem Ersetzen",
              `${videoVor4b7.length} Video-Element(e)`, "Untersuchung", "composer/index.tsx");
          } else {
            const frage4b7 = await seite.evaluate(() => {
              document.querySelector('[data-testid="composer-medien-import"]')?.click();
              return true;
            });
            const fristFrage4b7 = Date.now() + 6_000;
            let frageDa4b7 = false;
            while (Date.now() < fristFrage4b7) {
              frageDa4b7 = await seite.evaluate(
                () => document.querySelector('[data-testid="composer-ersetzen-frage"]') !== null,
              );
              if (frageDa4b7) break;
              await schlafe(200);
            }
            const frageText4b7 = await seite.evaluate(
              () => (document.querySelector('[data-testid="composer-ersetzen-frage"]')?.textContent ?? "").trim(),
            );
            console.log(`[schritt-4b7] Rueckfrage: da=${String(frageDa4b7)}, Text="${frageText4b7}".`);
            if (!frage4b7 || !frageDa4b7) {
              fund("Video ersetzen (FA-01)", "vor dem Ersetzen fragt die Wurzel nach (#422)",
                `Rueckfrage da=${String(frageDa4b7)}`, "Befund", "composer/index.tsx");
            } else {
              await seite.evaluate(() => {
                document.querySelector('[data-testid="composer-ersetzen-nein"]')?.click();
              });
              await schlafe(400);
              const nachNein4b7 = liesProjekt4b7();
              const frageWeg4b7 = await seite.evaluate(
                () => document.querySelector('[data-testid="composer-ersetzen-frage"]') === null,
              );
              const videosNachNein4b7 = videos4b7(nachNein4b7);
              console.log(`[schritt-4b7] Abbrechen: Frage weg=${String(frageWeg4b7)}, Videos=${videosNachNein4b7.length}, id unveraendert=${String(videosNachNein4b7[0]?.id === videoVor4b7[0].id)}.`);
              if (!frageWeg4b7 || videosNachNein4b7.length !== 1
                || videosNachNein4b7[0]?.id !== videoVor4b7[0].id) {
                fund("Video ersetzen (FA-01)", "Abbrechen laesst das bisherige Video unberuehrt",
                  `Frage weg=${String(frageWeg4b7)}, Videos=${videosNachNein4b7.length}`,
                  "Befund", "composer/index.tsx");
              } else {
                // Zweites Video erzeugen und ueber queue:reiheEin importieren. Danach
                // uebernimmt der Sicht-Effekt genau EIN neues Video ans Listenende und
                // entfernt das alte (derselbe Weg, den der Dialog nach der Bestaetigung nimmt).
                const probe2 = path.join("/tmp", "durchlauf-probe2.mp4");
                const ffmpeg = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
                await new Promise((f, r) => {
                  // 2 s wie das Seed-Video aus 4b: 4b5/4b6 legen eine Unterbrechung bei
                  // 1 s an; bei einem 1-s-Video liegt die Zeitstelle ausserhalb (0..1).
                  const proc = spawn(ffmpeg, ["-y", "-f", "lavfi", "-i", "color=c=red:size=320x180:rate=30",
                    "-t", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", probe2], { stdio: "ignore" });
                  proc.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt nichts (code " + c + ")"))));
                });
                await seite.evaluate(async (pfad, projektId) => {
                  await window.api.invoke("queue:reiheEin", {
                    art: "import",
                    payload: { projektId, quellPfad: pfad },
                  });
                }, probe2, aktivesProjektId);
                const fristErsetzt4b7 = Date.now() + 40_000;
                let nachher4b7 = liesProjekt4b7();
                while (Date.now() < fristErsetzt4b7) {
                  nachher4b7 = liesProjekt4b7();
                  const jetzt = videos4b7(nachher4b7);
                  if (jetzt.length === 1 && jetzt[0].id !== videoVor4b7[0].id) break;
                  await schlafe(400);
                }
                const videosNach4b7 = videos4b7(nachher4b7);
                const neueVideoAssets4b7 = (nachher4b7.assets ?? []).filter((a) => a.typ === "video");
                console.log(`[schritt-4b7] Ersetzen: Videos=${videosNach4b7.length}, alt weg=${String(!videosNach4b7.some((v) => v.id === videoVor4b7[0].id))}, Video-Assets=${neueVideoAssets4b7.length}, Bloecke ${vorher4b7.liste.length} -> ${nachher4b7.liste.length}.`);
                if (videosNach4b7.length !== 1) {
                  fund("Video ersetzen (FA-01)", "nach dem Import liegt weiterhin genau EIN Video in der Liste",
                    `${videosNach4b7.length} Video-Element(e)`, "Befund", "composer/index.tsx");
                } else if (videosNach4b7[0].id === videoVor4b7[0].id) {
                  fund("Video ersetzen (FA-01)", "das neue Video ERSETZT das alte Element",
                    `id unveraendert: ${videosNach4b7[0].id}`, "Befund", "composer/index.tsx");
                } else if (neueVideoAssets4b7.length < 2) {
                  fund("Video ersetzen (FA-01)", "das neue Video liegt als eigenes Asset vor",
                    `${neueVideoAssets4b7.length} Video-Asset(s)`, "Befund", "media-service");
                } else {
                  console.log("[schritt-4b7] Video ersetzen GEMESSEN: Rueckfrage, Abbrechen ohne Wirkung, Ersetzen -> genau ein Video (FA-01; der native Dialog bleibt MANUELL).");
                }
              }
            }
          }
        }

        // Schritt 4b5 - Unterbrechung in der Vorschau (#436): Der Bedienweg (#437) ist noch
        // nicht gebaut, deshalb legt der Treiber Aktion + Unterbrechung per IPC-Seed an (wie
        // den Medien-Seed) und MISST dann an der Vorschau: an der Zeitstelle steht die Aktion
        // auf der Buehne und das Video ist PAUSIERT; danach laeuft es an derselben Stelle
        // weiter (TK v3.26 / 9.2.9).
        const projektDatei = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
        let seedBasis = null;
        try {
          seedBasis = JSON.parse(fs.readFileSync(projektDatei, "utf-8"));
        } catch {
          fund("Unterbrechungs-Seed", "project.json lesbar (elementId, standardMarkeId)",
            "nicht lesbar: " + projektDatei, "Untersuchung", "project.json");
        }
        const videoElement = seedBasis === null
          ? null
          : (Array.isArray(seedBasis.liste) ? seedBasis.liste : []).find((e) => e && e.art === "video");
        if (seedBasis === null || !videoElement) {
          fund("Unterbrechungs-Seed", "ein Video-Element in der Wiedergabeliste (aus Schritt 4b)",
            "keins gefunden", "Befund", "composer/index.tsx");
        } else {
          const seed = await seite.evaluate(async (elementId, markeId) => {
            const akt = await window.api.invoke("project:erstelleAktion", {
              aktionsdaten: {
                titel: "Durchlauf-Einschub",
                beschreibung: null, preis: null, bildRef: null, cta: null,
                standardDauer: null, vorlagenId: "vollbild", markeId, akzentfarbe: null,
              },
            });
            if (!akt || !akt.ok) return { aktion: akt };
            const unter = await window.api.invoke("project:setzeUnterbrechungen", {
              elementId,
              unterbrechungen: [{ zeitstelle: 1, aktionRef: akt.wert.id, dauer: 1 }],
            });
            return { aktion: akt, unterbrechung: unter };
          }, videoElement.id, seedBasis.standardMarkeId);
          if (!seed.aktion || !seed.aktion.ok) {
            fund("Unterbrechungs-Seed", "Aktion per IPC angelegt (#426)",
              JSON.stringify(seed.aktion), "Befund", "project-store/erstelle-aktion.ts");
          } else if (!seed.unterbrechung || !seed.unterbrechung.ok) {
            fund("Unterbrechungs-Seed", "Unterbrechung per IPC gesetzt (#426)",
              JSON.stringify(seed.unterbrechung), "Befund", "project-store/setze-unterbrechungen.ts");
          } else {
            // Die Renderer-SICHT kennt keinen Nachzieh-Kanal (composer/projektzustand.ts:
            // nur Laden ueber oeffneProjekt). Deshalb das Projekt ueber die LISTE erneut
            // oeffnen - das flusht den lebenden Stand mitsamt den Seeds und laedt ihn frisch.
            await klick('[data-testid="reiter-projekte"]');
            await schlafe(400);
            await klick('[data-testid="verwaltung-erneut-laden"]');
            await schlafe(700);
            await seite.evaluate((id) => {
              const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
              const knopf = zeile === null ? null : zeile.querySelector('button');
              if (knopf) knopf.click();
            }, aktivesProjektId);
            await schlafe(2_500);
            await klick('[data-testid="reiter-zusammenstellen"]');
            await schlafe(800);

            // Auf einen Frame IM Einschub springen: Zeitstelle 1 s = Frame 30, Einschub [30, 60).
            const setzeFrame = (wert) => seite.evaluate((w) => {
              const schieber = document.querySelector('[data-testid="vorschau-zeitleiste"]');
              if (schieber === null) return false;
              const setzen = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
              if (setzen) setzen.call(schieber, String(w));
              schieber.dispatchEvent(new Event("input", { bubbles: true }));
              return true;
            }, wert);
            const vorschauDiag = () => seite.evaluate(() => {
              const video = document.querySelector('[data-testid="preview-video"] video');
              return {
                einschub: !!document.querySelector('[data-testid="preview-einschub"]'),
                paused: video === null ? null : video.paused,
                frame: document.querySelector('[data-testid="vorschau-zeitleiste"]')?.value ?? null,
              };
            });

            await klick('[data-testid="vorschau-play-pause"]'); // die Uhr laeuft
            await schlafe(300);
            const schieberDa = await setzeFrame(45);
            if (!schieberDa) {
              fund("Unterbrechung Vorschau", "die Vorschau-Zeitleiste ist bedienbar (#436)",
                "keine vorschau-zeitleiste im Fenster", "Befund", "preview-player/vorschau.tsx");
            } else {
              await schlafe(300);
              const imEinschub = await vorschauDiag();
              console.log("[schritt-4b5] Im Einschub: " + JSON.stringify(imEinschub));
              await setzeFrame(70); // nach dem Einschub (zweiter Video-Teil)
              await schlafe(500);
              const danach = await vorschauDiag();
              console.log("[schritt-4b5] Danach: " + JSON.stringify(danach));
              if (!imEinschub.einschub || imEinschub.paused !== true) {
                fund("Unterbrechung Vorschau", "an der Zeitstelle: Aktion auf der Buehne, Video PAUSIERT",
                  JSON.stringify(imEinschub), "Befund", "preview-player/vorschau.tsx");
              } else if (danach.einschub || danach.paused !== false) {
                fund("Unterbrechung Vorschau", "nach dem Einschub: Video laeuft an derselben Stelle weiter",
                  JSON.stringify(danach), "Befund", "preview-player/vorschau.tsx");
              } else {
                console.log(`[schritt-4b5] Unterbrechung GEMESSEN: Einschub @${imEinschub.frame} (Video pausiert) -> danach @${danach.frame} (Video laeuft), #436 belegt.`);
              }
            }

            // Der Seed raeumt sich weg: die Durchlauf-Aktion samt Unterbrechung wieder
            // entfernen (loescheAktion kaskadiert auf den Einschub, #426), Sicht per UI
            // nachziehen - sonst faende #4f spaeter eine FREMDE erste Aktionszeile vor.
            await seite.evaluate(async (aktionId) => {
              return window.api.invoke("project:löscheAktion", { id: aktionId });
            }, seed.aktion.wert.id);
            await klick('[data-testid="reiter-projekte"]');
            await schlafe(400);
            await seite.evaluate((id) => {
              const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
              const knopf = zeile === null ? null : zeile.querySelector("button");
              if (knopf) knopf.click();
            }, aktivesProjektId);
            await schlafe(2_000);
          }
        }
      }
    }

    // Schritt 4b6 - Unterbrechung per Drag (#437/#442): Eine Aktion wird auf den
    // VIDEO-Koerper gezogen. Seit der Entscheidung zu #442 (29.10.2026) legt JEDER Drop
    // auf den Koerper eine Unterbrechung an; die Vorlagenart entscheidet NICHTS mehr.
    // Deshalb wird hier bewusst eine Aktion mit BAND-Vorlage gezogen (frueher waere sie
    // ein Band-Abschnitt geworden). Erwartet: EINE Marke im Video-Block; ein Klick
    // entfernt sie; Aufnahme UND Entfernen sind je EIN Undo.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(700);
    const projektDatei4b6 = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
    let basis4b6 = null;
    try {
      basis4b6 = JSON.parse(fs.readFileSync(projektDatei4b6, "utf-8"));
    } catch (tu) {
      fund("Unterbrechung Drag", "project.json lesbar (Video-Element, Marke)",
        "nicht lesbar: " + String(tu), "Untersuchung", "project.json");
    }
    const video4b6 = basis4b6 === null
      ? null
      : (Array.isArray(basis4b6.liste) ? basis4b6.liste : []).find((e) => e && e.art === "video");
    if (basis4b6 === null || !video4b6) {
      fund("Unterbrechung Drag", "ein Video-Element fuer den Unterbrechungs-Drop (#437)",
        "keins gefunden", "Untersuchung", "composer/index.tsx");
    } else {
      // Aktion mit BAND-Vorlage saen - sie belegt, dass die Vorlage die Wirkung nicht
      // mehr entscheidet (#442).
      const saat4b6 = await seite.evaluate(async (markeId) => {
        const antwort = await window.api.invoke("project:erstelleAktion", {
          aktionsdaten: {
            titel: "Durchlauf-Unterbrechung",
            beschreibung: null, preis: null, bildRef: null, cta: null,
            standardDauer: 1, vorlagenId: "band-standard", markeId, akzentfarbe: null,
          },
        });
        if (antwort === null || antwort.ok !== true) {
          return { fehler: "erstelleAktion: " + JSON.stringify(antwort) };
        }
        return { aktionId: antwort.wert.id };
      }, basis4b6.standardMarkeId);
      if (typeof saat4b6.aktionId !== "string") {
        fund("Unterbrechung Drag", "eine Aktion mit Band-Vorlage als Drag-Quelle (#442)",
          `${saat4b6.fehler}`, "BLOCKER", "project-store/erstelle-aktion.ts");
      } else {
        // Sicht nachziehen: roher IPC-Ruf erreicht die Sicht NICHT - Projekt per UI neu oeffnen.
        await klick('[data-testid="reiter-projekte"]');
        await schlafe(400);
        await seite.evaluate((id) => {
          const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
          const knopf = zeile === null ? null : zeile.querySelector("button");
          if (knopf) knopf.click();
        }, aktivesProjektId);
        await schlafe(2_500);
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(700);

        // Die vollflaechige Aktionszeile finden, in den sichtbaren Bereich holen, messen.
        await seite.evaluate(() => {
          const zeilen = [...document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]')];
          const z = zeilen.find((e) => e.textContent.includes("Durchlauf-Unterbrechung"));
          if (z) z.scrollIntoView({ block: "center", inline: "nearest" });
        });
        await schlafe(300);
        const qBox4b6 = await seite.evaluate(() => {
          const zeilen = [...document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]')];
          const z = zeilen.find((e) => e.textContent.includes("Durchlauf-Unterbrechung"));
          if (!z) return null;
          const r = z.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        });
        const marken4b6 = () => seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-unterbrechung-"]').length,
        );
        const vor4b6 = await marken4b6();
        if (qBox4b6 === null) {
          fund("Unterbrechung Drag", "die vollflaechige Aktionszeile ist als Drag-Quelle sichtbar",
            "Quelle-Box null", "Untersuchung", "composer/index.tsx");
        } else {
          const blockSelektor4b6 = `[data-element-id="${video4b6.id}"]`;
          const grip4b6 = { x: qBox4b6.x + 6, y: qBox4b6.y + qBox4b6.height / 2 };
          await seite.mouse.move(grip4b6.x, grip4b6.y);
          await seite.mouse.down();
          await seite.mouse.move(grip4b6.x + 12, grip4b6.y);
          await schlafe(400);
          // Ziel JETZT messen - der Drag hat die Kanten geoeffnet und damit das Layout verschoben.
          const zielBox4b6 = await seite.evaluate((sel) => {
            const block = document.querySelector(sel);
            if (!block) return null;
            const r = block.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          }, blockSelektor4b6);
          if (zielBox4b6 === null) {
            await seite.mouse.up();
            fund("Unterbrechung Drag", "der Video-Block steht fuer den Drop im Fenster",
              "Video-Block nicht gefunden", "Befund", "composer/index.tsx");
          } else {
            const ziel4b6 = { x: zielBox4b6.x + zielBox4b6.width / 2, y: zielBox4b6.y + zielBox4b6.height / 2 };
            const schritte4b6 = 16;
            for (let t = 1; t <= schritte4b6; t += 1) {
              await seite.mouse.move(
                grip4b6.x + 12 + ((ziel4b6.x - (grip4b6.x + 12)) * t) / schritte4b6,
                grip4b6.y + ((ziel4b6.y - grip4b6.y) * t) / schritte4b6,
              );
              await schlafe(30);
            }
            await schlafe(500);
            const bandZiel4b6 = await seite.evaluate(
              (sel) => document.querySelector(sel)?.getAttribute("data-band-ziel"),
              blockSelektor4b6,
            );
            await seite.mouse.up();
            // Auf das entprellte Auto-Speichern warten (wie #4f2) - der harte Beleg ist
            // der STORE-Stand auf der Platte, nicht nur die optimistische Marke im DOM.
            await schlafe(6_500);
            const nachDrop4b6 = await marken4b6();
            // Harter Beleg: der STORE-Stand auf der Platte traegt einen Einschub.
            let einschuebe4b6 = null;
            try {
              const j = JSON.parse(fs.readFileSync(projektDatei4b6, "utf-8"));
              const v = (j.liste ?? []).find((e) => e.art === "video");
              einschuebe4b6 = v ? (v.unterbrechungen ?? []).length : null;
            } catch {
              einschuebe4b6 = "lesefehler";
            }
            console.log(`[schritt-4b6] Unterbrechung: Marken ${vor4b6}->${nachDrop4b6}; store-Einschuebe=${JSON.stringify(einschuebe4b6)}; data-band-ziel=${bandZiel4b6}.`);
            if (nachDrop4b6 !== 1 || einschuebe4b6 !== 1) {
              fund("Unterbrechung Drag", "ein Drop einer vollflaechigen Aktion auf das Video wird EINE Unterbrechung (#437)",
                `Marken ${vor4b6}->${nachDrop4b6}; Store-Einschuebe ${JSON.stringify(einschuebe4b6)}; data-band-ziel=${bandZiel4b6}`,
                "Befund", "composer/verwende-zeitleisten-zug.ts");
            } else {
              console.log("[schritt-4b6] Unterbrechungs-Drop GEMESSEN: der Video-Block traegt EINE Marke (#437 belegt).");
            }
            // Entfernen: Klick auf die Marke (EIN Undo-Schritt). Danach 0 Marken.
            const markeSelektor = await seite.evaluate(() => {
              const marke = document.querySelector('[data-testid^="zeitleiste-unterbrechung-"]');
              return marke ? marke.getAttribute("data-testid") : null;
            });
            if (markeSelektor === null) {
              fund("Unterbrechung Drag", "die Unterbrechungs-Marke ist im Fenster anklickbar",
                "keine Marke gefunden", "Befund", "composer/zeitleiste.tsx");
            } else {
              await klick(`[data-testid="${markeSelektor}"]`);
              await schlafe(1_500);
              const nachEntfernen4b6 = await marken4b6();
              await seite.keyboard.down("Meta");
              await seite.keyboard.press("z");
              await seite.keyboard.up("Meta");
              await schlafe(1_500);
              const nachUndoEins4b6 = await marken4b6();
              await seite.keyboard.down("Meta");
              await seite.keyboard.press("z");
              await seite.keyboard.up("Meta");
              await schlafe(1_500);
              const nachUndoZwei4b6 = await marken4b6();
              console.log(`[schritt-4b6] Entfernen: ${nachEntfernen4b6}; Undo1=${nachUndoEins4b6}; Undo2=${nachUndoZwei4b6}.`);
              if (nachEntfernen4b6 !== 0) {
                fund("Unterbrechung Drag", "ein Klick auf die Marke entfernt die Unterbrechung (#437)",
                  `Marken nach Entfernen: ${nachEntfernen4b6}`, "Befund", "composer/index.tsx");
              } else if (nachUndoEins4b6 !== 1 || nachUndoZwei4b6 !== 0) {
                fund("Unterbrechung Drag", "Aufnahme (Undo2) und Entfernen (Undo1) sind je EIN Undo-Schritt",
                  `Entfernen=${nachEntfernen4b6}; Undo1=${nachUndoEins4b6}; Undo2=${nachUndoZwei4b6}`,
                  "Befund", "composer/index.tsx");
              } else {
                console.log("[schritt-4b6] Unterbrechung Entfernen/Undo GEMESSEN: 1 -> 0 -> 1 -> 0 (je EIN Schritt, #437 belegt).");
              }
            }
          }
        }
        // Aufraeumen: die geseaete Aktion wieder entfernen (loescheAktion kaskadiert auf den
        // Einschub, #426) - sonst faende #4f eine fremde erste Aktionszeile vor.
        await seite.evaluate(async (aktionId) => {
          return window.api.invoke("project:löscheAktion", { id: aktionId });
        }, saat4b6.aktionId);
        await klick('[data-testid="reiter-projekte"]');
        await schlafe(400);
        await seite.evaluate((id) => {
          const zeile = document.querySelector(`[data-testid="projekt-${id}"]`);
          const knopf = zeile === null ? null : zeile.querySelector("button");
          if (knopf) knopf.click();
        }, aktivesProjektId);
        await schlafe(2_000);
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

    // Schritt 4c2 - FA-22: Die Vorbelegung, das ERSETZEN statt Anlegen und eine ZWEITE
    // Ausgabe. Gemessen wird am echten Dialog und am Ausgabeordner; der Render selbst
    // laeuft wie in 4c ueber den Dialog (kein zweiter Weg).
    {
      const ausgabeOrdner4c2 = path.join(WURZEL, "projects", aktivesProjektId, "output");
      const mp4s4c2 = () => fs.existsSync(ausgabeOrdner4c2)
        ? fs.readdirSync(ausgabeOrdner4c2).filter((d) => d.endsWith(".mp4"))
        : [];
      const part4c2 = () => fs.existsSync(ausgabeOrdner4c2)
        ? fs.readdirSync(ausgabeOrdner4c2).filter((d) => d.endsWith(".part"))
        : [];
      const zeilen4c2 = () => seite.evaluate(
        () => document.querySelectorAll('[data-testid="ausgaben-liste"] li').length,
      );
      const mtime4c2 = (name) => {
        const datei = path.join(ausgabeOrdner4c2, `${name}.mp4`);
        return fs.existsSync(datei) ? fs.statSync(datei).mtimeMs : null;
      };
      const setzeName4c2 = async (name) => seite.evaluate((n) => {
        const feld = document.querySelector('[data-testid="render-dialog-name"]');
        if (feld === null) return false;
        const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setzeWert.call(feld, n);
        feld.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }, name);
      const oeffneDialog4c2 = async () => {
        await klick('[data-testid="composer-render-oefnen"]');
        await schlafe(500);
        return stehtDa('[data-testid="render-dialog-name"]');
      };
      const loeseAus4c2 = async () => {
        await seite.evaluate(() => {
          document.querySelector('[data-testid="render-dialog-ausloeser"]')?.click();
        });
        await schlafe(3_000);
      };
      const warteOhnePart4c2 = async (fristMs = 90_000) => {
        const frist = Date.now() + fristMs;
        while (Date.now() < frist) {
          if (part4c2().length === 0) return true;
          await schlafe(500);
        }
        return false;
      };
      const warteAufZeile4c2 = async (name, fristMs = 60_000) => {
        const frist = Date.now() + fristMs;
        while (Date.now() < frist) {
          const treffer = await seite.evaluate((n) => {
            const liste = document.querySelector('[data-testid="ausgaben-liste"]');
            if (liste === null) return false;
            return (liste.textContent ?? "").includes(n);
          }, name);
          if (treffer) return true;
          await schlafe(500);
        }
        return false;
      };

      const vorher4c2 = { mp4: mp4s4c2(), zeilen: await zeilen4c2() };
      console.log(`[schritt-4c2] Ausgang: ${JSON.stringify(vorher4c2)}.`);
      if (!vorher4c2.mp4.includes(`${renderLaufName}.mp4`)) {
        fund("Zweite Ausgabe (FA-22)", "die Ausgabe aus 4c liegt im Ausgabeordner",
          JSON.stringify(vorher4c2), "Untersuchung", "render-service/ausgabe-platzieren.ts");
      } else if (!(await oeffneDialog4c2())) {
        fund("Zweite Ausgabe (FA-22)", "der Render-Dialog laesst sich erneut oeffnen",
          "render-dialog-name fehlt", "Befund", "composer/render-dialog.tsx");
      } else {
        const vorbelegung4c2 = await seite.evaluate(
          () => document.querySelector('[data-testid="render-dialog-name"]')?.value ?? null,
        );
        console.log(`[schritt-4c2] Vorbelegung: "${String(vorbelegung4c2)}" (erwartet "${renderLaufName}").`);
        if (vorbelegung4c2 !== renderLaufName) {
          fund("Zweite Ausgabe (FA-22)", "der Dialog ist mit dem letzten Ausgabenamen vorbelegt",
            `Feld "${String(vorbelegung4c2)}" statt "${renderLaufName}"`,
            "Befund", "composer/render-dialog.ts");
        } else {
          const mtimeVor4c2 = mtime4c2(renderLaufName);
          await loeseAus4c2();
          const ersetzt4c2 = await warteAufZeile4c2(renderLaufName);
          // Die Zeile stand schon vor dem Lauf da (gleicher Name). Erst das
          // Verschwinden der .part-Datei belegt, dass die neue Fassung FERTIG ist.
          const ohnePart4c2 = await warteOhnePart4c2();
          const mtimeNach4c2 = mtime4c2(renderLaufName);
          const mp4Nach4c2 = mp4s4c2();
          const zeilenNach4c2 = await zeilen4c2();
          console.log(`[schritt-4c2] Ersetzen: Zeile=${String(ersetzt4c2)}, mtime ${String(mtimeVor4c2)} -> ${String(mtimeNach4c2)}, mp4=${JSON.stringify(mp4Nach4c2)}, Zeilen=${zeilenNach4c2}, part=${JSON.stringify(part4c2())}.`);
          if (!ersetzt4c2 || !ohnePart4c2 || mp4Nach4c2.length !== 1 || !mp4Nach4c2.includes(`${renderLaufName}.mp4`)) {
            fund("Zweite Ausgabe (FA-22)", "derselbe Name ERSETZT die vorhandene Ausgabe (kein zweites .mp4)",
              `mp4=${JSON.stringify(mp4Nach4c2)}`, "Befund", "render-service/ausgabe-platzieren.ts");
          } else if (mtimeVor4c2 === null || mtimeNach4c2 === null || mtimeNach4c2 <= mtimeVor4c2) {
            fund("Zweite Ausgabe (FA-22)", "die vorhandene Datei wird neu geschrieben",
              `mtime ${String(mtimeVor4c2)} -> ${String(mtimeNach4c2)}`,
              "Befund", "render-service/ausgabe-platzieren.ts");
          } else if (zeilenNach4c2 !== vorher4c2.zeilen) {
            fund("Zweite Ausgabe (FA-22)", "das Ersetzen legt KEINE zweite Listenzeile an",
              `Zeilen ${vorher4c2.zeilen} -> ${zeilenNach4c2}`, "Befund", "composer/ausgabe-liste.tsx");
          } else {
            console.log("[schritt-4c2] Ersetzen GEMESSEN: eine Datei, neu geschrieben, eine Listenzeile (FA-22).");
          }

          // Zweite AUSGABE mit neuem Namen: genau eine weitere Datei und eine weitere Zeile.
          if (!(await oeffneDialog4c2())) {
            fund("Zweite Ausgabe (FA-22)", "der Dialog laesst sich fuer die zweite Ausgabe oeffnen",
              "render-dialog-name fehlt", "Befund", "composer/render-dialog.tsx");
          } else {
            const zweiterName4c2 = "durchlauf-zweite-" + Date.now();
            await setzeName4c2(zweiterName4c2);
            await loeseAus4c2();
            const zweiteDa4c2 = await warteAufZeile4c2(zweiterName4c2);
            const ohnePartZwei4c2 = await warteOhnePart4c2();
            const mp4Zwei4c2 = mp4s4c2();
            const zeilenZwei4c2 = await zeilen4c2();
            console.log(`[schritt-4c2] Zweite Ausgabe: Zeile=${String(zweiteDa4c2)}, mp4=${JSON.stringify(mp4Zwei4c2)}, Zeilen=${zeilenZwei4c2}, part=${JSON.stringify(part4c2())}.`);
            if (!zweiteDa4c2 || !ohnePartZwei4c2 || !mp4Zwei4c2.includes(`${zweiterName4c2}.mp4`)) {
              fund("Zweite Ausgabe (FA-22)", "ein neuer Name legt eine ZWEITE Ausgabe an",
                `mp4=${JSON.stringify(mp4Zwei4c2)}`, "Befund", "composer/render-dialog.tsx");
            } else if (mp4Zwei4c2.length !== 2) {
              fund("Zweite Ausgabe (FA-22)", "zwei Ausgaben liegen nebeneinander",
                JSON.stringify(mp4Zwei4c2), "Befund", "render-service/ausgabe-platzieren.ts");
            } else if (zeilenZwei4c2 !== vorher4c2.zeilen + 1) {
              fund("Zweite Ausgabe (FA-22)", "die Ausgabenliste zeigt beide Fassungen",
                `Zeilen ${zeilenZwei4c2} (erwartet ${vorher4c2.zeilen + 1})`,
                "Befund", "composer/ausgabe-liste.tsx");
            } else {
              console.log("[schritt-4c2] Zweite Ausgabe GEMESSEN: zwei Dateien, zwei Listenzeilen (FA-22).");
            }
          }
        }
        // Ein noch offenes Overlay schliessen (Abbruchweg des Dialogs).
        await seite.evaluate(() => {
          const overlay = document.querySelector('[data-testid="render-dialog"]');
          if (overlay === null) return;
          const ab = [...overlay.querySelectorAll("button")].find((b) => (b.textContent ?? "").trim() === "Abbrechen");
          if (ab) ab.click();
        });
        await schlafe(300);
      }
    }

    // Schritt 4f5 - FA-08: Die erzeugte MP4 wird per ffprobe gegen die ANGEZEIGTE
    // Gesamtlaenge geprueft. Der Lauf entsteht ueber den echten Dialog; die Liste traegt
    // zu diesem Zeitpunkt Video + mindestens eine Aktion (sequenziell), also mehr als das
    // 2-s-Seed-Video aus 4c. Geprueft werden: genau eine Datei, kein .part, Dauer passt
    // zur Anzeige (Anzeige rundet AB, deshalb +/-1 s).
    {
      // EINE gueltige sequenzielle Aktion (vollflaeche) anlegen und ueber die
      // Bibliothek an die Liste haengen. Der Band-Seed aus 4f traegt absichtlich
      // `band-standard` (162 px) und ist fuer eine MP4-Prüfung untauglich; 4f5 laeuft
      // deshalb VOR 4e (Liste sonst leer) und raeumt die Probe danach wieder ab.
      const fa08Titel = "Durchlauf-FA08-" + Date.now();
      const saat4f5 = await seite.evaluate(async ({ projektId, titel }) => {
        const projektAntwort = await window.api.invoke("project:öffneProjekt", { id: projektId });
        if (!projektAntwort || !projektAntwort.ok) return { fehler: "oeffneProjekt" };
        const antwort = await window.api.invoke("project:erstelleAktion", {
          projektId,
          aktionsdaten: {
            titel,
            beschreibung: null,
            preis: null,
            bildRef: null,
            cta: null,
            standardDauer: 10,
            vorlagenId: "vollbild",
            markeId: projektAntwort.wert.standardMarkeId,
            akzentfarbe: null,
          },
        });
        return antwort && antwort.ok ? { aktionId: antwort.wert.id } : { fehler: JSON.stringify(antwort) };
      }, { projektId: aktivesProjektId, titel: fa08Titel });
      if (typeof saat4f5.aktionId !== "string") {
        fund("Dauer der MP4 (FA-08)", "eine vollflaechige Aktion als sequenzieller Inhalt",
          String(saat4f5.fehler), "Untersuchung", "project-store/erstelle-aktion.ts");
      } else {
        // Sicht nachziehen: Projekt ueber die Liste neu oeffnen, dann die Aktionszeile
        // ueber ihren echten Knopf an die Liste haengen.
        await oeffneUeberListe(aktivesProjektId);
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(800);
        const hinzu4f5 = await seite.evaluate((id) => {
          const zeile = document.querySelector(`[data-testid="aktion-${id}"]`);
          if (zeile === null) return false;
          const knopf = zeile.querySelector("button");
          if (knopf === null) return false;
          knopf.click();
          return true;
        }, saat4f5.aktionId);
        const fristHinzu4f5 = Date.now() + 10_000;
        let bloecke4f5 = 0;
        while (Date.now() < fristHinzu4f5) {
          bloecke4f5 = await seite.evaluate(
            () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
          );
          if (bloecke4f5 >= 2) break;
          await schlafe(250);
        }
        console.log(`[schritt-4f5] Aktions-Probe: angelegt=${String(hinzu4f5)}, Bloecke=${bloecke4f5}.`);
        // Die Gesamtdauer zeichnet die LISTEN-Ansicht (#248).
        await klick('[data-testid="composer-ansicht-liste"]');
        await schlafe(700);
      const anzeige4f5 = await seite.evaluate(
        () => document.querySelector('[data-testid="wiedergabeliste-laenge"]')?.textContent ?? null,
      );
      const treffer4f5 = /(\d+):(\d\d)/.exec(String(anzeige4f5));
      const angezeigtSek4f5 = treffer4f5 === null
        ? null
        : Number(treffer4f5[1]) * 60 + Number(treffer4f5[2]);
      console.log(`[schritt-4f5] Anzeige: "${String(anzeige4f5)}" (${String(angezeigtSek4f5)} s).`);
      if (angezeigtSek4f5 === null || angezeigtSek4f5 < 3) {
        fund("Dauer der MP4 (FA-08)", "die Wiedergabeliste zeigt eine Gesamtdauer mit sequenziellem Inhalt",
          `Anzeige "${String(anzeige4f5)}"`, "Untersuchung", "composer/liste-ansicht.tsx");
      } else {
        const name4f5 = "durchlauf-fa08-" + Date.now();
        const ziel4f5 = path.join(WURZEL, "projects", aktivesProjektId, "output", `${name4f5}.mp4`);
        const oeffnen4f5 = await klick('[data-testid="composer-render-oefnen"]');
        await schlafe(500);
        const feldDa4f5 = await stehtDa('[data-testid="render-dialog-name"]');
        if (!oeffnen4f5 || !feldDa4f5) {
          fund("Dauer der MP4 (FA-08)", "der Render-Dialog laesst sich oeffnen",
            `geklickt=${String(oeffnen4f5)}, Feld=${String(feldDa4f5)}`,
            "Befund", "composer/render-dialog.tsx");
        } else {
          const nameGesetzt4f5 = await seite.evaluate((n) => {
            const feld = document.querySelector('[data-testid="render-dialog-name"]');
            if (feld === null) return false;
            const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            setzeWert.call(feld, n);
            feld.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }, name4f5);
          const ausloeser4f5 = await seite.evaluate(() => {
            const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
            if (knopf === null) return null;
            const zustand = { da: true, gesperrt: knopf.disabled, befund: document.querySelector('[data-testid="render-dialog-befund"]')?.textContent ?? null };
            knopf.click();
            return zustand;
          });
          console.log(`[schritt-4f5] Ausloesen: nameGesetzt=${String(nameGesetzt4f5)}, ${JSON.stringify(ausloeser4f5)}.`);
          await schlafe(5_000);
          if (!fs.existsSync(ziel4f5)) {
            const diag4f5 = await seite.evaluate(() => ({
              dialogNoch: document.querySelector('[data-testid="render-dialog"]') !== null,
              meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
              ladefehler: document.querySelector('[data-testid="composer-ladefehler"]')?.textContent ?? null,
              ablehnungen: window.__durchlauf?.ablehnungen ?? [],
              fortschritte: (window.__durchlauf?.kanaele ?? []).filter((e) => e.kanal === "render:fortschritt").length,
              queue: document.querySelector('[data-testid="queue-panel"]')?.textContent ?? null,
            }));
            console.log(`[schritt-4f5] Diagnose nach 5 s: ${JSON.stringify(diag4f5)}.`);
          }
          const ordner4f5 = path.dirname(ziel4f5);
          const frist4f5 = Date.now() + 150_000;
          while (Date.now() < frist4f5) {
            const dateien4f5 = fs.existsSync(ordner4f5) ? fs.readdirSync(ordner4f5) : [];
            if (dateien4f5.includes(`${name4f5}.mp4`)
              && !dateien4f5.some((d) => d.endsWith(".part"))) break;
            await schlafe(1_000);
          }
          const dateienEnde4f5 = fs.existsSync(ordner4f5) ? fs.readdirSync(ordner4f5) : [];
          const mp4Ende4f5 = dateienEnde4f5.filter((d) => d.endsWith(".mp4"));
          const partEnde4f5 = dateienEnde4f5.filter((d) => d.endsWith(".part"));
          if (!fs.existsSync(ziel4f5)) {
            fund("Dauer der MP4 (FA-08)", "der Render legt die Ausgabedatei an",
              `nicht gefunden: ${name4f5}.mp4; Dateien=${JSON.stringify(dateienEnde4f5)}`,
              "Befund", "render-service/ausgabe-platzieren.ts");
          } else {
            const dauer4f5 = await new Promise((f, r) => {
              const proc = spawn(ffprobeStatic.path, [
                "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", ziel4f5,
              ]);
              let aus = "";
              proc.stdout.on("data", (d) => { aus += String(d); });
              proc.on("exit", (c) => (c === 0 ? f(Number(aus.trim())) : r(new Error("ffprobe code " + c))));
            });
            console.log(`[schritt-4f5] ffprobe: ${name4f5}.mp4 = ${dauer4f5} s; Anzeige ${angezeigtSek4f5} s; mp4=${mp4Ende4f5.length}, part=${partEnde4f5.length}.`);
            if (!Number.isFinite(dauer4f5) || dauer4f5 < angezeigtSek4f5 - 0.5 || dauer4f5 > angezeigtSek4f5 + 1.0) {
              fund("Dauer der MP4 (FA-08)", "die Dauer der Datei entspricht der angezeigten Gesamtlaenge",
                `ffprobe ${String(dauer4f5)} s, Anzeige ${angezeigtSek4f5} s`,
                "Befund", "render-service/ausgabe-platzieren.ts");
            } else if (partEnde4f5.length > 0) {
              fund("Dauer der MP4 (FA-08)", "nach dem Erfolg liegt keine .part-Datei mehr",
                JSON.stringify(partEnde4f5), "Befund", "render-service/ausgabe-platzieren.ts");
            } else if (!mp4Ende4f5.includes(`${name4f5}.mp4`)) {
              fund("Dauer der MP4 (FA-08)", "die geprueffte Datei ist die neue Ausgabe",
                JSON.stringify(mp4Ende4f5), "Befund", "render-service/ausgabe-platzieren.ts");
            } else {
              console.log(`[schritt-4f5] Dauer GEMESSEN: ffprobe ${dauer4f5} s gegen Anzeige ${angezeigtSek4f5} s (FA-08).`);
            }
          }
        }
      }
        // Probe wieder aus der Liste nehmen (EIN Undo-Schritt der Hinzufuegung).
        await klick('[data-testid="undo-pfeil"]');
        await schlafe(1_200);
        const bloeckeNach4f5 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        // Die Probe-Aktion wieder loeschen: Sie stammt aus 4f5 und wuerde sonst die
        // Drag-Quelle der Schritte 4f/4f2 verschieben (gemessen 22.10.2026).
        const weg4f5 = await seite.evaluate(async (id) => {
          const antwort = await window.api.invoke("project:löscheAktion", { id });
          return antwort && antwort.ok ? true : antwort;
        }, saat4f5.aktionId);
        console.log(`[schritt-4f5] Aufraeumen: Bloecke nach Undo=${bloeckeNach4f5}, Aktion geloescht=${JSON.stringify(weg4f5)}.`);
      }
    }

    // Schritt 4e - KontextMenue im echten Fenster (#408): Rechtsklick auf die
    // ERSTE Zeile oeffnet das Menue (Fraschgriff im Fensterskript), dann ruft der
    // Treiber "Duplikat am Listenende anfuegen" - durch den Baustein #123, der die
    // Sicht selbst versorgt. GEMESSEN: Zeilen davor/danach.
    // #414: Das KontextMenue haengt an der #248-Zeilen-LISTE (Fallback);
    // der Ansichtsschalter bringt sie zuerst in das Fenster.
    await seite.evaluate(() => {
      const knopf = document.querySelector('[data-testid="composer-ansicht-liste"]');
      if (knopf !== null) knopf.click();
    });
    await schlafe(600);
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

    // Schritt 4e2 - KontextMenue an der ZEITLEISTE (#420): dieselbe Komponente, die
    // andere Ansicht. Rechtsklick auf den ersten Zeitleisten-Block oeffnet das EINE
    // Menue; Duplikat/Entfernen wirken an der Zeitleiste genauso wie an der #248-Liste.
    await seite.evaluate(() => {
      const knopf = document.querySelector('[data-testid="composer-ansicht-zeitleiste"]');
      if (knopf !== null) knopf.click();
    });
    await schlafe(600);
    const bloeckeDavor4e2 = await seite.evaluate(
      () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
    );
    const blockMenue = await seite.evaluate(() => {
      const block = document.querySelector('[data-testid^="zeitleiste-block-"]');
      if (block === null) return false;
      const rechteck = block.getBoundingClientRect();
      block.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true, cancelable: true,
        clientX: rechteck.left + 4, clientY: rechteck.top + 4,
      }));
      return true;
    });
    console.log(`[schritt-4e2] Zeitleisten-Kontextmenue: ${String(blockMenue)} (Bloecke davor: ${bloeckeDavor4e2})`);
    if (!blockMenue || bloeckeDavor4e2 === 0) {
      fund("KontextMenue-Zeitleiste", "ein Zeitleisten-Block fuer den Rechtsklick (#420)",
        `Bloecke: ${bloeckeDavor4e2}`, "Untersuchung", "composer/zeitleiste.tsx");
    } else {
      await schlafe(600);
      const menueDa2 = await seite.evaluate(() => ({
        menue: !!document.querySelector('[data-testid="kontext-menue"]'),
        duplikat: !!document.querySelector('[data-testid="menue-duplikat"]'),
      }));
      if (!menueDa2.menue || !menueDa2.duplikat) {
        fund("KontextMenue-Zeitleiste", "kontext-menue nach Rechtsklick auf einen Zeitleisten-Block (#420)",
          `Menue-Diagn: ${JSON.stringify(menueDa2)}`, "Befund", "composer/index.tsx");
      } else {
        await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="menue-duplikat"]');
          if (knopf !== null) knopf.click();
        });
        await schlafe(3_500);
        const bloeckeDanach4e2 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        if (bloeckeDanach4e2 > bloeckeDavor4e2) {
          console.log(`[schritt-4e2] Duplikat GEMESSEN an der Zeitleiste: ${bloeckeDavor4e2} -> ${bloeckeDanach4e2} Bloecke (#420 belegt).`);
        } else {
          fund("KontextMenue-Zeitleiste", "Duplikat verlaengert die Zeitleiste (#420)",
            `Bloecke davor/nachher: ${bloeckeDavor4e2}/${bloeckeDanach4e2}`, "Befund", "composer/kontext-menu.tsx");
        }
        await schlafe(600);
        await seite.evaluate(() => {
          const block = document.querySelector('[data-testid^="zeitleiste-block-"]');
          if (block === null) return;
          const rechteck = block.getBoundingClientRect();
          block.dispatchEvent(new MouseEvent("contextmenu", {
            bubbles: true, cancelable: true,
            clientX: rechteck.left + 4, clientY: rechteck.top + 4,
          }));
        });
        await schlafe(600);
        const entfernenDa2 = await seite.evaluate(() => !!document.querySelector('[data-testid="menue-entfernen"]'));
        if (!entfernenDa2) {
          fund("KontextMenue-Zeitleiste", "menue-entfernen nach dem zweiten Rechtsklick an der Zeitleiste (#420)",
            "Entfernen-Eintrag fehlt", "Befund", "composer/kontext-menu.tsx");
        } else {
          await seite.evaluate(() => {
            const knopf = document.querySelector('[data-testid="menue-entfernen"]');
            if (knopf !== null) knopf.click();
          });
          await schlafe(3_500);
          const bloeckeNachEntfernen4e2 = await seite.evaluate(
            () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
          );
          if (bloeckeNachEntfernen4e2 < bloeckeDanach4e2) {
            console.log(`[schritt-4e2] Entfernen GEMESSEN an der Zeitleiste: ${bloeckeDanach4e2} -> ${bloeckeNachEntfernen4e2} Bloecke (#420 belegt).`);
          } else {
            fund("KontextMenue-Zeitleiste", "Entfernen verkuerzt die Zeitleiste (#420)",
              `Bloecke davor/nachher: ${bloeckeDanach4e2}/${bloeckeNachEntfernen4e2}`, "Befund", "composer/kontext-menu.tsx");
          }
        }
      }
    }

    // Schritt 4f - Spalt-Drop am echten Fenster (#411-#414 Abnahme, Kernachse;
    // Quellen-Wechsel mit #417: gezogen wird eine AKTION, kein Medium).
    // User-Klaerung 15.10.2026 (#417): Drag&Drop ist fuer AKTIONEN gedacht (und spaeter
    // Banner) - Bilder/Videos sind KEINE Drag-Quelle mehr. Eine Aktion ist im heutigen
    // Stand nicht aus dem Composer heraus anzulegen (#416 offen); sie wird daher ueber
    // den ECHTEN Vertragskanal project:erstelleAktion gesaet, danach wird das Projekt
    // per UI neu geoeffnet (der Weg, der die gemeinsame Sicht nachzieht). Dann Liste auf
    // 2 Bloecke (Klick-Weg #407) und die AKTIONSzeile per Pointer-Drag in die Kante 1
    // ziehen ("zwischen die Videoframes", Position 2). Erwartet: 3 Bloecke, Position 2
    // traegt die Aktions-Id. Danach Cmd+Z: GENAU EIN Schritt zurueck auf 2 Bloecke.
    await schlafe(400);
    const saat417 = await seite.evaluate(async (projektId) => {
      const projektAntwort = await window.api.invoke("project:öffneProjekt", { id: projektId });
      if (projektAntwort === null || projektAntwort.ok !== true) {
        return { fehler: "oeffneProjekt: " + JSON.stringify(projektAntwort) };
      }
      const antwort = await window.api.invoke("project:erstelleAktion", {
        aktionsdaten: {
          titel: "Durchlauf-Aktion",
          beschreibung: null,
          preis: null,
          bildRef: null,
          cta: null,
          standardDauer: null,
          vorlagenId: "band-standard",
          markeId: projektAntwort.wert.standardMarkeId,
          akzentfarbe: null,
        },
      });
      if (antwort === null || antwort.ok !== true) {
        return { fehler: "erstelleAktion: " + JSON.stringify(antwort) };
      }
      return { aktionId: antwort.wert.id };
    }, aktivesProjektId);
    let aktionsId417 = null;
    if (typeof saat417.aktionId === "string") {
      aktionsId417 = saat417.aktionId;
      console.log(`[schritt-4f] Aktions-Saat angelegt: ${aktionsId417}`);
    } else {
      fund("Spalt-Drop", "eine Aktion als Drag-Quelle (Saat via project:erstelleAktion)",
        `${saat417.fehler}`, "BLOCKER", "project-store/erstelle-aktion.ts");
    }
    // Projekt per UI neu oeffnen - erst das zieht die gemeinsame Sicht nach (ein roher
    // IPC-Mutationsruf allein erreicht die Sicht NICHT, s. composer/projektzustand.ts).
    await klick('[data-testid="reiter-projekte"]');
    await schlafe(400);
    const neuGeoeffnet417 = await seite.evaluate((pid) => {
      const zeile = document.querySelector(`[data-testid="projekt-${pid}"]`);
      const knopf = zeile === null ? null : zeile.querySelector("button");
      if (knopf === null) return false;
      knopf.click();
      return true;
    }, aktivesProjektId);
    console.log(`[schritt-4f] Projekt neu geoeffnet: ${neuGeoeffnet417}`);
    await schlafe(2_500);
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(700);
    const aktionDa417 = await seite.evaluate(
      () => !!document.querySelector('[data-testid="aktionen-liste"] [data-testid^="aktion-"]'),
    );
    if (!aktionDa417) {
      fund("Spalt-Drop", "die Aktionszeile steht nach der Saat in der Bibliothek",
        "aktionen-liste ohne Aktionszeile", "Befund", "composer/bibliothek-ansicht.tsx");
    }
      const zweiterKlick = await seite.evaluate(() => {
        // #422: an der Video-Zeile gibt es kein "Zur Liste hinzufuegen" mehr - der
        // zweite Block entsteht ueber den ECHTEN Weg der AKTIONEN (die sind ziehbar
        // und haben den Knopf weiterhin).
        const zeile = document.querySelector('[data-testid="aktionen-liste"] [data-testid^="aktion-"]');
        const knopf = zeile === null
          ? null
          : [...(zeile.querySelectorAll('button') ?? [])]
              .find((k) => k.textContent === "Zur Liste hinzufügen");
        if (knopf === null) return false;
        knopf.click();
        return true;
      });
      console.log("[schritt-4f] Zweiter Klick am Bedienweg: " + String(zweiterKlick));
      await schlafe(3_500);
      const davor4f = await seite.evaluate(() => ({
        bloecke: [...document.querySelectorAll('[data-testid^="zeitleiste-block-"]')]
          .map((b) => b.getAttribute("data-ref")),
        zeilen: document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
      }));
      console.log("[schritt-4f] Bloecke davor (data-ref): " + JSON.stringify(davor4f));
      if (davor4f.bloecke.length < 2) {
        fund("Spalt-Drop", "zwei Bloecke in der Zeitleiste vor dem Drop",
          `${davor4f.bloecke.length} Bloecke`, "Untersuchung", "composer/index.tsx");
      } else {
        const quelleHandle = await seite.$('[data-testid="aktionen-liste"] [data-testid^="aktion-"]');
        // #417-Messlehre: Die Aktions-Zeile liegt UNTER dem Medien-Block der Bibliothek.
        // In einem kleinen Fenster faellt sie unter den sichtbaren Bereich - ein Griff
        // dorthin traefe ins Leere (elementFromPoint -> null, belegt). Ein Mensch
        // scrollt die Bibliothek zuerst; genau das bildet der Treiber hier nach.
        if (quelleHandle !== null) {
          await quelleHandle.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
          await schlafe(200);
        }
        const quelleBox = quelleHandle === null ? null : await quelleHandle.boundingBox();
        if (quelleBox === null || quelleHandle === null) {
          fund("Spalt-Drop", "die Aktionszeile als Drag-Quelle ist sichtbar",
            `Quelle-Box: ${JSON.stringify(quelleBox)}`,
            "Untersuchung", "composer/index.tsx");
        } else {
          quelleHandle.dispose?.();
          // Der Griff sitzt am LINKEN Rand der Zeile (Titel) - das Zeilen-Zentrum
          // traefe den "Zur Liste hinzufuegen"-Knopf. dnd-kit braucht pointerdown
          // + 4 px Bewegung (PointerSensor, composer/index.tsx).
          const grip = {
            x: quelleBox.x + 6,
            y: quelleBox.y + quelleBox.height / 2,
          };
          await seite.mouse.move(grip.x, grip.y);
          await seite.mouse.down();
          // ERST ein kleiner Zug: der Drag muss LAUFEN, damit die Kanten (#412-Ruhelage
          // "unsichtbar, beim Neu-Drag sichtbar") ueberhaupt im Fenster stehen.
          await seite.mouse.move(grip.x + 12, grip.y);
          await schlafe(700);
          const kanteLaufend = await seite.$('[data-testid="zeitleiste-kante-1"]');
          const kanteBoxLaufend = kanteLaufend === null ? null : await kanteLaufend.boundingBox();
          if (kanteBoxLaufend === null) {
            await seite.mouse.up();
            fund("Spalt-Drop", "waehrend des Neu-Drags steht die Kante-1 im Fenster",
              "Kante-1 fehlt im laufenden Drag", "Untersuchung", "composer/index.tsx");
          } else {
            kanteLaufend.dispose?.();
            const ziel = {
              x: kanteBoxLaufend.x + kanteBoxLaufend.width / 2,
              y: kanteBoxLaufend.y + kanteBoxLaufend.height / 2,
            };
            const schritte = 14;
            let letzterX = grip.x + 12;
            for (let teilschritt = 1; teilschritt <= schritte; teilschritt += 1) {
              letzterX = grip.x + 12 + ((ziel.x - (grip.x + 12)) * teilschritt) / schritte;
              await seite.mouse.move(
                letzterX,
                grip.y + ((ziel.y - grip.y) * teilschritt) / schritte,
              );
              await schlafe(35);
            }
            await schlafe(600);
            await seite.mouse.up();
            await schlafe(3_500);
          const danach4f = await seite.evaluate(() => ({
            bloecke: [...document.querySelectorAll('[data-testid^="zeitleiste-block-"]')]
              .map((b) => b.getAttribute("data-ref")),
            meldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
            ablehnungen: window.__durchlauf.ablehnungen ?? [],
          }));
          console.log("[schritt-4f] Bloecke danach (data-ref): " + JSON.stringify(danach4f));
          const quelleRef = aktionsId417;
          const wuchs = danach4f.bloecke.length === davor4f.bloecke.length + 1;
          const anStelleZwei = quelleRef !== null && danach4f.bloecke[1] === quelleRef;
          if (wuchs && anStelleZwei) {
            console.log("[schritt-4f] Spalt-Drop GEMESSEN: Liste " + davor4f.bloecke.length +
              " -> " + danach4f.bloecke.length + " Bloecke; Position 2 traegt die gezogene " +
              "Referenz (Kernachse belegt).");
          } else if (wuchs) {
            fund("Spalt-Drop", "das Element steigt an der Kante-POSITION 2 in die Liste",
              `Bloecke danach: ${JSON.stringify(danach4f.bloecke)}`, "Befund", "composer/index.tsx");
          } else {
            fund("Spalt-Drop", "ein Drop auf die Kante fuegt an dieser Position ein (#411/#412)",
              `Bloecke davor/nachher: ${davor4f.bloecke.length}/${danach4f.bloecke.length}; ` +
              `Meldung: ${JSON.stringify(danach4f.meldung)}; Ablehnungen: ${JSON.stringify(danach4f.ablehnungen)}`,
              "Befund", "composer/index.tsx");
          }
          // #414-Abnahme-Rest: GENAU EIN Undo-Schritt nimmt das Einfuegen zurueck.
          const davorUndo = davor4f.bloecke.length;
          await seite.keyboard.down("Meta");
          await seite.keyboard.press("z");
          await seite.keyboard.up("Meta");
          await schlafe(1_500);
          const nachUndo4f = await seite.evaluate(
            () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
          );
          if (nachUndo4f === davorUndo) {
            console.log("[schritt-4f] Undo GEMESSEN: " + nachUndo4f +
              " Bloecke nach Cmd+Z (#243/#350: ein Einfuegen ist EIN Schritt).");
          } else {
            fund("Spalt-Drop-Undo", "Cmd+Z nimmt das Kanten-Einfuegen in EINEM Schritt zurueck",
              `Bloecke danach Undo: ${nachUndo4f} (erwartet ${davorUndo})`,
              "Befund", "composer/index.tsx");
          }
        }
      }
    }

    // Schritt 4f2 - Drop auf den Video-Koerper (#442, Entscheidung 29.10.2026): eine
    // Aktion wird auf den VIDEO-Block gezogen (nicht an eine Kante). Erwartet: das
    // Video-Element traegt danach eine UNTERBRECHUNG (harter Beleg: project.json), es
    // entsteht KEIN Band-Abschnitt mehr, die Zahl der Zeitleisten-Bloecke bleibt GLEICH
    // (der Einschub ist kein neues Listenelement, TK 9.2.9), waehrend des Zugs traegt
    // der Video-Block data-band-ziel="true". Danach: Cmd+Z nimmt den Einschub in EINEM
    // Schritt zurueck.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    const videoBlock4f2 = await seite.$('[data-testid="zeitleiste-block-0"]');
    const videoBlockBox4f2 = videoBlock4f2 === null ? null : await videoBlock4f2.boundingBox();
    const bloeckeVor4f2 = await seite.evaluate(
      () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
    );
    const quelle4f2 = await seite.$('[data-testid="aktionen-liste"] [data-testid^="aktion-"]');
    if (videoBlockBox4f2 === null || quelle4f2 === null) {
      fund("Band-Aufnahme", "Video-Block und Aktionszeile fuer den Band-Drag",
        `videoBox=${JSON.stringify(videoBlockBox4f2)}, quelle=${quelle4f2 !== null}`,
        "Untersuchung", "composer/index.tsx");
    } else {
      await quelle4f2.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
      await schlafe(200);
      const qBox4f2 = await quelle4f2.boundingBox();
      videoBlock4f2?.dispose?.();
      quelle4f2.dispose?.();
      if (qBox4f2 === null) {
        fund("Band-Aufnahme", "die Aktionszeile ist als Drag-Quelle sichtbar",
          "Quelle-Box null", "Untersuchung", "composer/index.tsx");
      } else {
        const grip4f2 = { x: qBox4f2.x + 6, y: qBox4f2.y + qBox4f2.height / 2 };
        await seite.mouse.move(grip4f2.x, grip4f2.y);
        await seite.mouse.down();
        await seite.mouse.move(grip4f2.x + 12, grip4f2.y);
        await schlafe(500);
        // Ziel: die MITTE des Video-Blocks (der Koerper ist das Band-Ziel, nicht die Kante).
        const ziel4f2 = {
          x: videoBlockBox4f2.x + videoBlockBox4f2.width / 2,
          y: videoBlockBox4f2.y + videoBlockBox4f2.height / 2,
        };
        const schritte4f2 = 16;
        for (let t = 1; t <= schritte4f2; t += 1) {
          await seite.mouse.move(
            grip4f2.x + 12 + ((ziel4f2.x - (grip4f2.x + 12)) * t) / schritte4f2,
            grip4f2.y + ((ziel4f2.y - grip4f2.y) * t) / schritte4f2,
          );
          await schlafe(30);
        }
        await schlafe(500);
        const bandZiel4f2 = await seite.evaluate(
          () => document.querySelector('[data-testid="zeitleiste-block-0"]')?.getAttribute("data-band-ziel"),
        );
        await seite.mouse.up();
        await schlafe(6_500);
        const bloeckeNach4f2 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        // Der harte Beleg ist der STORE-Stand auf der Platte - nach dem entprellten
        // Auto-Speichern: der Einschub steht in `unterbrechungen`, das Band bleibt leer
        // (ein Drop auf den Koerper legt seit #442 KEINEN Band-Abschnitt mehr an).
        let unterbrechungen4f2 = null;
        let abschnitte4f2 = null;
        try {
          const json4f2 = JSON.parse(
            fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"),
          );
          const videoEl4f2 = (json4f2.liste ?? []).find((e) => e.art === "video");
          unterbrechungen4f2 = Array.isArray(videoEl4f2?.unterbrechungen) ? videoEl4f2.unterbrechungen : [];
          abschnitte4f2 = videoEl4f2 && videoEl4f2.einblendung ? videoEl4f2.einblendung.abschnitte : null;
        } catch (tu) {
          unterbrechungen4f2 = "lesefehler: " + String(tu);
        }
        await klick('[data-testid="composer-ansicht-zeitleiste"]');
        await schlafe(200);
        const meldung4f2 = await seite.evaluate(
          () => document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
        );
        console.log(`[schritt-4f2] Drop auf Video: bandZiel=${bandZiel4f2}; Bloecke ${bloeckeVor4f2}->${bloeckeNach4f2}; Unterbrechungen=${JSON.stringify(unterbrechungen4f2)}; Band-Abschnitte=${JSON.stringify(abschnitte4f2)}; Meldung=${JSON.stringify(meldung4f2)}`);
        const hatUnterbrechung4f2 =
          Array.isArray(unterbrechungen4f2) && unterbrechungen4f2.some((u) => u.aktionRef === aktionsId417);
        const hatBand4f2 = Array.isArray(abschnitte4f2) && abschnitte4f2.some((a) => a.aktionRef === aktionsId417);
        if (bandZiel4f2 !== "true") {
          fund("Drop auf Video", "der Video-Block ist waehrend des Zugs sichtbar das Drop-Ziel (#425)",
            `data-band-ziel=${bandZiel4f2}`, "Befund", "composer/index.tsx");
        }
        if (!hatUnterbrechung4f2) {
          fund("Drop auf Video", "ein Drop auf den Video-Koerper wird eine Unterbrechung (#442)",
            `Unterbrechungen: ${JSON.stringify(unterbrechungen4f2)}; Meldung: ${JSON.stringify(meldung4f2)}`,
            "Befund", "composer/index.tsx");
        } else if (hatBand4f2) {
          fund("Drop auf Video", "ein Drop auf den Koerper legt KEINEN Band-Abschnitt an (#442)",
            `Band-Abschnitte: ${JSON.stringify(abschnitte4f2)}`, "Befund", "composer/index.tsx");
        } else if (bloeckeNach4f2 !== bloeckeVor4f2) {
          fund("Drop auf Video", "die Unterbrechung ist KEIN neues Listenelement (TK 9.2.9)",
            `Bloecke ${bloeckeVor4f2}->${bloeckeNach4f2}`, "Befund", "composer/index.tsx");
        } else {
          console.log("[schritt-4f2] Drop auf Video GEMESSEN: das Video traegt eine Unterbrechung, keinen Band-Abschnitt, die Blockzahl ist unveraendert (#442 belegt).");
        }
        // DoD: die Aufnahme ist EIN Undo-Schritt (Cmd+Z). Gemessen wird in der
        // Oberflaeche: nach EINEM Cmd+Z ist die Marke im Video-Block weg.
        await seite.keyboard.down("Meta");
        await seite.keyboard.press("z");
        await seite.keyboard.up("Meta");
        await schlafe(1_500);
        const markenUndo4f2 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-unterbrechung-"]').length,
        );
        console.log(`[schritt-4f2] Undo: Unterbrechungs-Marken nach Cmd+Z = ${markenUndo4f2}`);
        if (markenUndo4f2 !== 0) {
          fund("Drop auf Video - Undo", "Cmd+Z nimmt die Unterbrechung in EINEM Schritt zurueck (#243)",
            `Marken nach Undo: ${markenUndo4f2}`, "Befund", "composer/index.tsx");
        } else {
          console.log("[schritt-4f2] Undo GEMESSEN: die Unterbrechung ist EIN Schritt (Cmd+Z, #442 belegt).");
        }
      }
    }

    // Schritt 4f3 - Undo/Redo-PFEILE am echten Fenster (#424): eine Aktion über den
    // Klick-Weg hinzufuegen, dann den SICHTBAREN Pfeil-Rueckgaengig druecken (nicht nur
    // Cmd+Z) und messen, dass die Liste schrumpft; danach Redo und messen, dass sie
    // wieder waechst. Am Ende zuruecknehmen, damit der Zustand fuer 4g/4h gleich bleibt.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    const bloeckeVor4f3 = await seite.evaluate(
      () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
    );
    const zweiter4f3 = await seite.evaluate(() => {
      const zeile = document.querySelector('[data-testid="aktionen-liste"] [data-testid^="aktion-"]');
      const knopf = zeile === null
        ? null
        : [...(zeile.querySelectorAll('button') ?? [])]
            .find((k) => k.textContent === "Zur Liste hinzufügen");
      if (knopf === null) return false;
      knopf.click();
      return true;
    });
    await schlafe(3_000);
    const nachHinzu4f3 = await seite.evaluate(
      () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
    );
    const undoDa4f3 = await seite.evaluate(() => {
      const k = document.querySelector('[data-testid="undo-pfeil"]');
      return k === null ? null : { da: true, disabled: k.disabled };
    });
    const redoDa4f3 = await seite.evaluate(() => {
      const k = document.querySelector('[data-testid="redo-pfeil"]');
      return k === null ? null : { da: true, disabled: k.disabled };
    });
    let nachUndo4f3 = null;
    let nachRedo4f3 = null;
    if (undoDa4f3 !== null && undoDa4f3.disabled === false) {
      await klick('[data-testid="undo-pfeil"]');
      await schlafe(1_500);
      nachUndo4f3 = await seite.evaluate(
        () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
      );
      if (redoDa4f3 !== null && nachUndo4f3 !== null) {
        await klick('[data-testid="redo-pfeil"]');
        await schlafe(1_500);
        nachRedo4f3 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
      }
    }
    console.log(`[schritt-4f3] Pfeile: KlickHinzu=${zweiter4f3}, Bloecke ${bloeckeVor4f3}->${nachHinzu4f3}, undo=${JSON.stringify(undoDa4f3)}, redo=${JSON.stringify(redoDa4f3)}, nach Undo=${nachUndo4f3}, nach Redo=${nachRedo4f3}`);
    if (undoDa4f3 === null || redoDa4f3 === null) {
      fund("Undo/Redo-Pfeile", "die Pfeile stehen in der Reiterleiste (#424)",
        `undo=${JSON.stringify(undoDa4f3)}, redo=${JSON.stringify(redoDa4f3)}`, "Befund", "app-shell/undo-pfeile.tsx");
    } else if (undoDa4f3.disabled === true) {
      fund("Undo/Redo-Pfeile", "der Undo-Pfeil ist nach einer Hinzufuegung AKTIV (#424)",
        "undo-pfeil ist disabled", "Befund", "app-shell/undo-pfeile.tsx");
    } else if (nachUndo4f3 === bloeckeVor4f3 && nachRedo4f3 === nachHinzu4f3) {
      console.log("[schritt-4f3] Pfeile GEMESSEN: Undo schrumpft, Redo waechst (je EIN Schritt).");
    } else {
      fund("Undo/Redo-Pfeile", "Undo nimmt zurueck, Redo stellt wieder her (#424)",
        `Bloecke: vor=${bloeckeVor4f3}, nach Hinzu=${nachHinzu4f3}, nach Undo=${nachUndo4f3}, nach Redo=${nachRedo4f3}`,
        "Befund", "app-shell/undo-pfeile.tsx");
    }
    // Zustand fuer 4g/4h wiederherstellen (falls Redo die Aktion zurueckgebracht hat).
    if (nachRedo4f3 !== null && nachRedo4f3 !== bloeckeVor4f3) {
      await klick('[data-testid="undo-pfeil"]');
      await schlafe(1_200);
    }

    // Schritt 4f4 - Dauer/Trim-Undo am echten Fenster (#429): die Grenze am Regler
    // ziehen (Dauer aendert sich) und mit dem Undo-PFEIL zuruecknehmen. Zuvor schrieb
    // der Dauer-/Trim-Weg am Undo-Stapel vorbei - der Pfeil tat fuer ihn nichts.
    {
      await klick('[data-testid="composer-ansicht-liste"]');
      await schlafe(700);
      const dauerVor4f4 = await seite.evaluate(
        () => document.querySelector('[data-testid="element-dauer"]')?.textContent ?? null,
      );
      const griff4f4 = await seite.$('[data-testid="element-griff-ende"]');
      const box4f4 = griff4f4 === null ? null : await griff4f4.boundingBox();
      griff4f4?.dispose?.();
      let dauerNach4f4 = dauerVor4f4;
      let dauerUndo4f4 = dauerVor4f4;
      if (box4f4 !== null) {
        const mx = box4f4.x + box4f4.width / 2;
        const my = box4f4.y + box4f4.height / 2;
        await seite.mouse.move(mx, my);
        await seite.mouse.down();
        for (let i = 1; i <= 8; i += 1) {
          await seite.mouse.move(mx - i * 8, my);
          await schlafe(30);
        }
        await seite.mouse.up();
        await schlafe(1_500);
        dauerNach4f4 = await seite.evaluate(
          () => document.querySelector('[data-testid="element-dauer"]')?.textContent ?? null,
        );
        const undoZustand4f4 = await seite.evaluate(() => {
          const k = document.querySelector('[data-testid="undo-pfeil"]');
          return k === null ? null : { da: true, disabled: k.disabled };
        });
        const zeilenVorUndo4f4 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
        );
        await klick('[data-testid="undo-pfeil"]');
        await schlafe(1_500);
        dauerUndo4f4 = await seite.evaluate(
          () => document.querySelector('[data-testid="element-dauer"]')?.textContent ?? null,
        );
        const zeilenNachUndo4f4 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="wiedergabeliste-zeile"]').length,
        );
        const meldung4f4 = await seite.evaluate(
          () => document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
        );
        console.log(`[schritt-4f4] Diagnose: undo=${JSON.stringify(undoZustand4f4)}, Zeilen ${zeilenVorUndo4f4}->${zeilenNachUndo4f4}, Meldung=${JSON.stringify(meldung4f4)}`);
      }
      console.log(`[schritt-4f4] Dauer/Trim-Undo: ${JSON.stringify(dauerVor4f4)} -> ${JSON.stringify(dauerNach4f4)} -> Undo ${JSON.stringify(dauerUndo4f4)}`);
      if (dauerNach4f4 === dauerVor4f4) {
        fund("Dauer/Trim-Undo", "das Ziehen am Regler aendert die Dauer (Vorbedingung)",
          `Dauer unveraendert (${JSON.stringify(dauerVor4f4)})`, "Untersuchung", "composer/element-zeile.tsx");
      } else if (dauerUndo4f4 !== dauerVor4f4) {
        fund("Dauer/Trim-Undo", "der Undo-Pfeil nimmt eine Dauer-/Trim-Aenderung zurueck (#429/TK 9.13.1)",
          `Dauer nach Undo ${JSON.stringify(dauerUndo4f4)} (erwartet ${JSON.stringify(dauerVor4f4)})`,
          "Befund", "composer/dauer-regler.ts");
      } else {
        console.log("[schritt-4f4] Dauer/Trim-Undo GEMESSEN: der Pfeil nimmt die Regler-Aenderung in EINEM Schritt zurueck (#429).");
      }
      await klick('[data-testid="composer-ansicht-zeitleiste"]');
      await schlafe(200);
    }

    // Schritt 4g - Aktion anlegen aus dem Composer (#416): Inline-Erst-Anlage ohne
    // Reiterwechsel. Titel eintippen, Vorlage waehlen, Knopf druecken - der Eintrag
    // muss SOFORT in der Aktionen-Liste der Bibliothek stehen.
    await klick('[data-testid="reiter-zusammenstellen"]');
    await schlafe(600);
    const aktionenDavor4g = await seite.evaluate(
      () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
    );
    const formDa4g = await seite.evaluate(() => !!document.querySelector('[data-testid="aktion-anlegen"]'));
    if (!formDa4g) {
      fund("Aktion anlegen", "das Inline-Formular steht in der Bibliothek (#416)",
        "aktion-anlegen fehlt", "Befund", "composer/bibliothek-ansicht.tsx");
    } else {
      await seite.evaluate(() => {
        const feld = document.querySelector('[data-testid="aktion-anlegen-titel"]');
        if (feld !== null) feld.scrollIntoView({ block: 'center' });
      });
      await schlafe(150);
      await seite.click('[data-testid="aktion-anlegen-titel"]');
      await seite.type('[data-testid="aktion-anlegen-titel"]', 'Durchlauf-Aktion-inline');
      await schlafe(200);
      await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="aktion-anlegen-knopf"]');
        if (knopf !== null) knopf.click();
      });
      await schlafe(2_500);
      const aktionenDanach4g = await seite.evaluate(
        () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
      );
      if (aktionenDanach4g > aktionenDavor4g) {
        console.log(`[schritt-4g] Aktion anlegen GEMESSEN: ${aktionenDavor4g} -> ${aktionenDanach4g} Aktionen (#416 belegt).`);
      } else {
        fund("Aktion anlegen", "die neue Aktion erscheint sofort in der Bibliothek (#416)",
          `Aktionen davor/nachher: ${aktionenDavor4g}/${aktionenDanach4g}`, "Befund", "composer/index.tsx");
      }
    }

    // Schritt 4g2 - Undo nach einer AKTIONS-Anlage (User-Pfad 15.10.2026: „eine Aktion
    // namens nnn hinzugefügt" -> Undo tat nichts). Gemessen wird am AKTIONS-Zähler der
    // Bibliothek: nach dem Undo-Pfeil muss die neu angelegte Aktion verschwinden.
    {
      await klick('[data-testid="reiter-zusammenstellen"]');
      await schlafe(500);
      const aktionenVorUndo4g2 = await seite.evaluate(
        () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
      );
      const undoAktiv4g2 = await seite.evaluate(() => {
        const k = document.querySelector('[data-testid="undo-pfeil"]');
        return k === null ? null : k.disabled === false;
      });
      if (undoAktiv4g2 === true) {
        await klick('[data-testid="undo-pfeil"]');
        await schlafe(1_500);
      }
      const aktionenNachUndo4g2 = await seite.evaluate(
        () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
      );
      console.log(`[schritt-4g2] Aktions-Anlage rückgängig: Aktionen ${aktionenVorUndo4g2}->${aktionenNachUndo4g2}; Undo war aktiv=${undoAktiv4g2}`);
      if (undoAktiv4g2 === true && aktionenNachUndo4g2 !== aktionenVorUndo4g2 - 1) {
        fund("Undo Aktions-Anlage", "der Undo-Pfeil nimmt eine neu angelegte Aktion zurück (#416/FA-21)",
          `Aktionen ${aktionenVorUndo4g2}->${aktionenNachUndo4g2} (erwartet ${aktionenVorUndo4g2 - 1})`,
          "Befund", "composer/index.tsx");
      } else if (undoAktiv4g2 === true) {
        console.log("[schritt-4g2] Undo nach Aktions-Anlage GEMESSEN (#416/FA-21).");
      }
    }

    // Schritt 4g4 - Aktion in der Bibliothek loeschen + Undo (#430). Ohne Rueckfrage;
    // der Schritt ist in EINEM Zug rueckgaengig zu machen.
    {
      await klick('[data-testid="reiter-zusammenstellen"]');
      await schlafe(500);
      const vor4g4 = await seite.evaluate(
        () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
      );
      const loeschKnopf4g4 = await seite.$('[data-testid^="aktion-loeschen-"]');
      let nach4g4 = vor4g4;
      let undo4g4 = vor4g4;
      if (loeschKnopf4g4 === null) {
        fund("Aktion loeschen", "Loeschen-Knopf in der Composer-Bibliothek (#430)",
          "kein aktion-loeschen-Knopf gefunden", "Befund", "composer/bibliothek-ansicht.tsx");
      } else {
        await loeschKnopf4g4.click();
        loeschKnopf4g4.dispose?.();
        await schlafe(2_000);
        nach4g4 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
        );
        await klick('[data-testid="undo-pfeil"]');
        await schlafe(1_500);
        undo4g4 = await seite.evaluate(
          () => document.querySelectorAll('[data-testid="aktionen-liste"] > li').length,
        );
        console.log(`[schritt-4g4] Aktion loeschen: ${vor4g4} -> ${nach4g4} -> Undo ${undo4g4}`);
        if (nach4g4 !== vor4g4 - 1) {
          fund("Aktion loeschen", "der Loeschen-Knopf entfernt die Aktion aus der Bibliothek (#430)",
            `Aktionen ${vor4g4}->${nach4g4} (erwartet ${vor4g4 - 1})`, "Befund", "composer/index.tsx");
        } else if (undo4g4 !== vor4g4) {
          fund("Aktion loeschen-Undo", "Cmd+Z/Pfeil nimmt das Loeschen in EINEM Schritt zurueck (#430/TK 9.13.1)",
            `Aktionen nach Undo ${undo4g4} (erwartet ${vor4g4})`, "Befund", "composer/index.tsx");
        } else {
          console.log("[schritt-4g4] Aktion loeschen GEMESSEN: entfernt und in EINEM Schritt rueckgaengig (#430).");
        }
      }
    }

    // Schritt 4g3 - FA-03: eine AKTION BEARBEITEN (Titel) und im Bestand nachlesen.
    // Der Weg ist der Aktionen-Reiter (Klick auf die Zeile, Feld verlassen = speichern).
    // Die Zahl der Aktionen darf sich dabei NICHT aendern (Bearbeiten, nicht Anlegen).
    {
      await klick('[data-testid="reiter-aktionen"]');
      await schlafe(800);
      const projektDatei4g3 = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
      const liesAktionen4g3 = () => JSON.parse(fs.readFileSync(projektDatei4g3, "utf-8")).aktionen;
      const vorher4g3 = liesAktionen4g3();
      const zeile4g3 = await seite.$('[data-testid="aktion-bibliothek"] li button');
      if (zeile4g3 === null) {
        fund("Aktion bearbeiten (FA-03)", "eine Aktionszeile im Aktionen-Reiter",
          "aktion-bibliothek/li/button fehlt", "Befund", "action-editor/index.tsx");
      } else {
        await zeile4g3.click();
        zeile4g3.dispose?.();
        await schlafe(600);
        const alt4g3 = await seite.evaluate(
          () => document.querySelector('[data-testid="aktion-titel"]')?.value ?? null,
        );
        const neu4g3 = `${String(alt4g3)}-bearbeitet`;
        const gesetzt4g3 = await seite.evaluate((wert) => {
          const feld = document.querySelector('[data-testid="aktion-titel"]');
          if (feld === null) return { gesetzt: false, fensterFokus: document.hasFocus(), aktiv: null, feldFokus: null };
          const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setzeWert.call(feld, wert);
          feld.focus();
          feld.dispatchEvent(new Event("input", { bubbles: true }));
          // `focusout` wie an den beiden Stellen vom 23.10. (#310): Reacts onBlur haengt an
          // `focusout`; ein nacktes `blur()` ist wirkungslos, wenn das Feld keinen Fokus
          // bekommt. EHRLICH: Die Gegenprobe am 27.10. hat das fuer DIESEN Schritt NICHT
          // bestaetigt - der alte Stand (nur `blur()`) war im selben Lauf gruen. Die
          // Ursache des FA-03-Befunds vom 26.10. ist offen; die drei Felder unten sind
          // dafuer die Diagnose. Sie messen die Umgebung, nicht das Produkt.
          const feldFokus = document.activeElement === feld;
          feld.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
          feld.blur();
          const aktiv = document.activeElement;
          return {
            gesetzt: true,
            fensterFokus: document.hasFocus(),
            aktiv: aktiv === null ? null : (aktiv.getAttribute("data-testid") ?? aktiv.tagName),
            feldFokus,
          };
        }, neu4g3);
        const frist4g3 = Date.now() + 8_000;
        let nachher4g3 = vorher4g3;
        while (Date.now() < frist4g3) {
          try {
            nachher4g3 = liesAktionen4g3();
          } catch {
            nachher4g3 = vorher4g3;
          }
          if (nachher4g3.some((a) => a.titel === neu4g3)) break;
          await schlafe(250);
        }
        const geaendert4g3 = nachher4g3.find((a) => a.titel === neu4g3) ?? null;
        console.log(`[schritt-4g3] Bearbeiten: gesetzt=${String(gesetzt4g3.gesetzt)}, "${String(alt4g3)}" -> "${neu4g3}", Aktionen ${vorher4g3.length} -> ${nachher4g3.length}, gefunden=${geaendert4g3 !== null}.`);
        console.log(`[schritt-4g3] Diagnose: Fensterfokus=${String(gesetzt4g3.fensterFokus)}, Feld hatte Fokus=${String(gesetzt4g3.feldFokus)}, aktives Element danach=${String(gesetzt4g3.aktiv)}.`);
        if (!gesetzt4g3.gesetzt || alt4g3 === null) {
          fund("Aktion bearbeiten (FA-03)", "das Titelfeld ist im Aktionen-Reiter bedienbar",
            "aktion-titel fehlt", "Befund", "action-editor/index.tsx");
        } else if (geaendert4g3 === null) {
          // Diagnose (FA-03, 27.10.2026): Der Befund vom 26.10. war nicht zuordenbar, weil
          // weder Meldung noch Zeilentext festgehalten wurden. Beides wird jetzt gemessen,
          // BEVOR der Fund geschrieben wird: die Meldung nennt den Zweig (Formular-Meldung
          // vs. Wurzel-Meldung vs. gar keine), der Zeilentext die Sicht.
          const lageFehlschlag4g3 = await seite.evaluate(() => ({
            titelfeld: document.querySelector('[data-testid="aktion-titel"]')?.value ?? null,
            zeilen: [...document.querySelectorAll('[data-testid="aktion-bibliothek"] li button')]
              .map((knopf) => knopf.textContent),
            formularMeldung: document.querySelector('[data-testid="aktion-speicher-meldung"]')?.textContent ?? null,
            wurzelMeldung: document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
          }));
          console.log(`[schritt-4g3] Diagnose Fehlschlag: Titelfeld="${String(lageFehlschlag4g3.titelfeld)}", Zeilen=${JSON.stringify(lageFehlschlag4g3.zeilen)}, FormularMeldung=${JSON.stringify(lageFehlschlag4g3.formularMeldung)}, WurzelMeldung=${JSON.stringify(lageFehlschlag4g3.wurzelMeldung)}.`);
          fund("Aktion bearbeiten (FA-03)", "der geaenderte Titel landet im Bestand",
            `Titel im project.json: ${JSON.stringify(nachher4g3.map((a) => a.titel))}`,
            "Befund", "action-editor/index.tsx");
        } else if (nachher4g3.length !== vorher4g3.length) {
          fund("Aktion bearbeiten (FA-03)", "Bearbeiten legt KEINE zweite Aktion an",
            `Aktionen ${vorher4g3.length} -> ${nachher4g3.length}`, "Befund", "action-editor/index.tsx");
        } else if (geaendert4g3.id !== vorher4g3[0].id && !vorher4g3.some((a) => a.id === geaendert4g3.id)) {
          fund("Aktion bearbeiten (FA-03)", "der geaenderte Titel gehoert zur bestehenden Aktion",
            `id ${geaendert4g3.id}`, "Befund", "action-editor/index.tsx");
        } else {
          console.log("[schritt-4g3] Aktion bearbeiten GEMESSEN: Titel geaendert, Aktionszahl unveraendert (FA-03).");
        }
      }
    }

    // Schritt 4q - #445: Im Modus "Neue Aktion" erreichte der getippte Titel den Entwurf
    // nie (das Feld war ungesteuert, `feldVerlassen` kehrte bei `gewaehlt === null` zurueck);
    // "Anlegen" schickte `titel: ''`. Gemessen wird der ECHTE Bedienweg: Neue Aktion ->
    // Titel tippen -> Feld verlassen -> Anlegen -> Aktion im Bestand. Dazu die Gegenprobe:
    // ein leerer Titel wird AM FORMULAR sichtbar abgelehnt und legt nichts an.
    {
      const projektDatei4q = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
      const liesAktionen4q = () => JSON.parse(fs.readFileSync(projektDatei4q, "utf-8")).aktionen;
      const vorher4q = liesAktionen4q();
      const titel4q = `Durchlauf-Neu-${Date.now()}`;
      const neuGeklickt4q = await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="aktion-neu"]');
        if (knopf === null) return false;
        knopf.click();
        return true;
      });
      await schlafe(400);
      const getippt4q = await seite.evaluate((wert) => {
        const feld = document.querySelector('[data-testid="aktion-titel"]');
        if (feld === null) return false;
        const setzeWert = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setzeWert.call(feld, wert);
        feld.focus();
        feld.dispatchEvent(new Event("input", { bubbles: true }));
        // `focusout` wie in 4g3: Reacts onBlur haengt daran (#310).
        feld.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        feld.blur();
        return true;
      }, titel4q);
      await schlafe(300);
      const angelegt4q = await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]');
        if (knopf === null) return false;
        knopf.click();
        return true;
      });
      const frist4q = Date.now() + 8_000;
      let nachher4q = vorher4q;
      while (Date.now() < frist4q) {
        try {
          nachher4q = liesAktionen4q();
        } catch {
          nachher4q = vorher4q;
        }
        if (nachher4q.some((a) => a.titel === titel4q)) break;
        await schlafe(250);
      }
      const neu4q = nachher4q.find((a) => a.titel === titel4q) ?? null;
      const sicht4q = await seite.evaluate(() => ({
        titelfeld: document.querySelector('[data-testid="aktion-titel"]')?.value ?? null,
        zeilen: [...document.querySelectorAll('[data-testid="aktion-bibliothek"] li button')]
          .map((knopf) => knopf.textContent),
        befund: document.querySelector('[data-testid="aktion-befund"]')?.textContent ?? null,
        speicherMeldung: document.querySelector('[data-testid="aktion-speicher-meldung"]')?.textContent ?? null,
      }));
      console.log(`[schritt-4q] Neue Aktion: Knopf=${String(neuGeklickt4q)}, getippt=${String(getippt4q)}, Anlegen=${String(angelegt4q)}, Aktionen ${vorher4q.length} -> ${nachher4q.length}, gefunden=${neu4q !== null}.`);
      console.log(`[schritt-4q] Diagnose: Titelfeld="${String(sicht4q.titelfeld)}", Zeilen=${JSON.stringify(sicht4q.zeilen)}, FormularMeldung=${JSON.stringify(sicht4q.speicherMeldung)}, Befund=${JSON.stringify(sicht4q.befund)}.`);
      if (!neuGeklickt4q || !getippt4q || !angelegt4q) {
        fund("Aktion anlegen (#445)", "der Weg 'Neue Aktion' ist im Aktionen-Reiter bedienbar",
          `neu=${String(neuGeklickt4q)}, titel=${String(getippt4q)}, anlegen=${String(angelegt4q)}`,
          "Befund", "action-editor/index.tsx");
      } else if (neu4q === null) {
        fund("Aktion anlegen (#445)", "der getippte Titel landet beim Anlegen im project.json",
          `Aktionen ${vorher4q.length} -> ${nachher4q.length}; Titelfeld=${JSON.stringify(sicht4q.titelfeld)}; Befund=${JSON.stringify(sicht4q.befund)}; Meldung=${JSON.stringify(sicht4q.speicherMeldung)}`,
          "Befund", "action-editor/index.tsx");
      } else if (nachher4q.length !== vorher4q.length + 1) {
        fund("Aktion anlegen (#445)", "genau EINE neue Aktion",
          `Aktionen ${vorher4q.length} -> ${nachher4q.length}`, "Befund", "action-editor/index.tsx");
      } else if (!sicht4q.zeilen.some((zeile) => String(zeile).includes(titel4q))) {
        fund("Aktion anlegen (#445)", "die neue Aktion steht in der Bibliothek",
          JSON.stringify(sicht4q.zeilen), "Befund", "action-editor/index.tsx");
      } else {
        console.log(`[schritt-4q] Anlegen GEMESSEN: "${titel4q}" im project.json und in der Bibliothek (#445).`);
      }
      // Gegenprobe: leerer Titel -> Befund am Formular, KEIN neuer Eintrag.
      const vorLeer4q = liesAktionen4q().length;
      const leerNeu4q = await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="aktion-neu"]');
        if (knopf === null) return false;
        knopf.click();
        return true;
      });
      await schlafe(400);
      const leerGeklickt4q = await seite.evaluate(() => {
        const knopf = document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]');
        if (knopf === null) return false;
        knopf.click();
        return true;
      });
      await schlafe(600);
      const leerLage4q = await seite.evaluate(() => ({
        befund: document.querySelector('[data-testid="aktion-befund"]')?.textContent ?? null,
        anlegenKnopf: document.querySelector('[data-testid="aktion-anlegen-bestaetigen"]') !== null,
      }));
      const nachLeer4q = liesAktionen4q().length;
      console.log(`[schritt-4q] Leerer Titel: neu=${String(leerNeu4q)}, Anlegen=${String(leerGeklickt4q)}, Befund=${JSON.stringify(leerLage4q.befund)}, Aktionen ${vorLeer4q} -> ${nachLeer4q}.`);
      if (!leerNeu4q || !leerGeklickt4q || !leerLage4q.anlegenKnopf) {
        fund("Aktion anlegen (#445)", "der Anlegen-Knopf steht im Modus 'Neue Aktion' am Formular",
          `neu=${String(leerNeu4q)}, anlegen=${String(leerGeklickt4q)}, knopf=${String(leerLage4q.anlegenKnopf)}`,
          "Befund", "action-editor/index.tsx");
      } else if (nachLeer4q !== vorLeer4q) {
        fund("Aktion anlegen (#445)", "ein leerer Titel legt KEINE Aktion an",
          `Aktionen ${vorLeer4q} -> ${nachLeer4q}`, "Befund", "action-editor/index.tsx");
      } else if (leerLage4q.befund === null) {
        fund("Aktion anlegen (#445)", "der abgelehnte Anlege-Versuch steht am Formular (aktion-befund)",
          "kein Befund sichtbar", "Befund", "action-editor/index.tsx");
      } else {
        console.log("[schritt-4q] Leerer Titel AM FORMULAR abgelehnt (#445 belegt).");
      }
    }

    // Schritt 4i - VIERTER FALL (#438) am echten Fenster: Ein kaputter EINSCHUB (Aktion
    // mit fehlendem Bild) muss als `unterbrechung` im Reparatur-Panel stehen und den
    // Render sperren. Bisher hielt das nur der Unit-Test (TK 9.7.5 v3.27).
    //
    // Derselbe echte Weg wie 4h: Bild-Asset aus Schritt 4b3 benutzen, Aktion per
    // Vertragskanal anlegen, Einschub per `setzeUnterbrechungen` setzen, die Bilddatei
    // auf der Platte loeschen und das Projekt ueber die Liste NEU OEFFNEN (Reconcile
    // setzt `zustand: 'fehlt'`). Danach raeumt der Schritt sich weg, damit 4h wieder
    // GENAU EINE (Video-)Stelle vorfindet.
    {
      let bildAsset4i = null;
      let videoId4i = null;
      let markeId4i = null;
      try {
        const pj4i = JSON.parse(
          fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"),
        );
        bildAsset4i = (pj4i.assets ?? []).find((a) => a.typ === "bild" && a.zustand === "ok") ?? null;
        videoId4i = ((pj4i.liste ?? []).find((e) => e && e.art === "video") ?? {}).id ?? null;
        markeId4i = pj4i.standardMarkeId;
      } catch (tu) {
        console.log("[schritt-4i] Projektstand nicht lesbar: " + String(tu));
      }
      if (bildAsset4i === null || videoId4i === null) {
        fund("Vierter Fall (#438)", "ein Bild-Asset (aus 4b3) und ein Video-Element im Seed",
          "Seed unvollstaendig", "Untersuchung", "scripts/durchlauf.mjs");
      } else {
        const seed4i = await seite.evaluate(async (elementId, markeId, bildRef) => {
          const akt = await window.api.invoke("project:erstelleAktion", {
            aktionsdaten: {
              titel: "Durchlauf-Einschub-kaputt",
              beschreibung: null, preis: null, bildRef, cta: null,
              standardDauer: null, vorlagenId: "vollbild", markeId, akzentfarbe: null,
            },
          });
          if (!akt || !akt.ok) return { aktion: akt };
          const unter = await window.api.invoke("project:setzeUnterbrechungen", {
            elementId,
            unterbrechungen: [{ zeitstelle: 1, aktionRef: akt.wert.id, dauer: 1 }],
          });
          return { aktionId: akt.wert.id, unterbrechung: unter };
        }, videoId4i, markeId4i, bildAsset4i.id);

        const bildDatei4i = path.join(WURZEL, "projects", aktivesProjektId, "media", bildAsset4i.dateiname);
        if (!seed4i.aktionId) {
          fund("Vierter Fall (#438)", "Aktion mit Bild per project:erstelleAktion",
            JSON.stringify(seed4i), "Befund", "project-store/erstelle-aktion.ts");
        } else if (!seed4i.unterbrechung || !seed4i.unterbrechung.ok) {
          fund("Vierter Fall (#438)", "Einschub per project:setzeUnterbrechungen",
            JSON.stringify(seed4i.unterbrechung), "Befund", "project-store/setze-unterbrechungen.ts");
        } else if (!fs.existsSync(bildDatei4i)) {
          fund("Vierter Fall (#438)", "die Bilddatei des Seeds liegt auf der Platte",
            "Datei nicht gefunden", "Untersuchung", "scripts/durchlauf.mjs");
        } else {
          fs.unlinkSync(bildDatei4i);
          await oeffneUeberListe(aktivesProjektId);
          await klick('[data-testid="reiter-zusammenstellen"]');
          await schlafe(800);
          const lage4i = await seite.evaluate(() => ({
            panel: !!document.querySelector('[data-testid="reparatur-panel"]'),
            stelle: document.querySelector('[data-testid="reparatur-stelle"]')?.textContent ?? null,
            fortschritt: document.querySelector('[data-testid="reparatur-fortschritt"]')?.textContent ?? null,
            renderGesperrt: document.querySelector('[data-testid="composer-render-oefnen"]')?.disabled ?? null,
          }));
          const stelleOk4i = (lage4i.stelle ?? "").includes("unterbrechung");
          if (!lage4i.panel || !stelleOk4i || lage4i.renderGesperrt !== true) {
            fund("Vierter Fall (#438)", "kaputter Einschub erscheint als 'unterbrechung' und sperrt den Render",
              JSON.stringify(lage4i), "Befund", "composer/kaputt-erkennung.ts");
          } else {
            console.log(`[schritt-4i] Vierter Fall GEMESSEN: ${String(lage4i.stelle)} - Render gesperrt, ${String(lage4i.fortschritt)} (#438 belegt).`);
          }
          // Aufraeumen ueber die KASKADE (#426/TK 9.5.3): `löscheAktion` entfernt den
          // Einschub mit. Das fehlende Asset bleibt in D1, ist danach aber
          // unreferenziert -> keine kaputte Stelle mehr.
          await seite.evaluate(async (aktionId) => {
            await window.api.invoke("project:löscheAktion", { id: aktionId });
          }, seed4i.aktionId);
          // Der Auto-Speicher ist ENTRELLT (3-5 s, TK 9.5.4). Statt zu raten, wird die
          // PLATTE befragt: erst wenn Unterbrechung und Aktion dort weg sind, wird neu
          // geoeffnet - sonst laese 4h den alten Stand und faende die falsche Stelle.
          let aufgeraeumt4i = false;
          const frist4i = Date.now() + 12_000;
          while (Date.now() < frist4i) {
            try {
              const pj = JSON.parse(fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"));
              const videoJetzt = (pj.liste ?? []).find((e) => e && e.id === videoId4i);
              const aktionNochDa = (pj.aktionen ?? []).some((a) => a && a.id === seed4i.aktionId);
              if (((videoJetzt?.unterbrechungen ?? []).length === 0) && !aktionNochDa) { aufgeraeumt4i = true; break; }
            } catch { /* Datei wird gerade geschrieben */ }
            await schlafe(300);
          }
          if (!aufgeraeumt4i) {
            fund("Vierter Fall (#438)", "das Aufraeumen steht auf der Platte (Unterbrechung/Aktion weg)",
              "project.json traegt beides noch nach 12 s", "Befund", "project-store/schreibe-projekt.ts");
          }
          await oeffneUeberListe(aktivesProjektId);
          await klick('[data-testid="reiter-zusammenstellen"]');
          await schlafe(600);
          // Erst weiter, wenn die Reparatur-Anzeige WEG ist - sie haengt am neuen Stand.
          const fristWeg4i = Date.now() + 10_000;
          while (Date.now() < fristWeg4i) {
            const nochDa4i = await seite.evaluate(
              () => !!document.querySelector('[data-testid="reparatur-panel"]'),
            );
            if (!nochDa4i) break;
            await schlafe(300);
          }
        }
      }
    }

    // Schritt 4h - Reparatur-Fuehrung (#421): eine KAPUTTE Stelle erzeugen (die kopierte
    // Medien-Datei loeschen), das Projekt per UI neu oeffnen (Reconcile -> Asset 'fehlt'),
    // dann eine Fix-Option bedienen und Cmd+Z messen (EIN Schritt ueber den Wrapped-Schreiber).
    let kaputtGemacht = false;
    try {
      const projektJson = JSON.parse(
        fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"),
      );
      // Das Video-Element der LISTE ist der Bezug - nach dem Ersetzen (4b7) liegt
      // noch das alte Video als Asset im Bestand, aber nicht mehr in der Liste. Ein
      // `find` ueber alle Assets loeschte dann die falsche Datei (gemessen 22.10.2026:
      // "Stelle nach dem Oeffnen: null", weil das ungenutzte alte Asset kaputt war).
      const videoRef = (projektJson.liste ?? []).find((e) => e.art === "video")?.ref ?? null;
      const videoAsset = (projektJson.assets ?? []).find(
        (a) => a.id === videoRef && a.typ === "video" && a.zustand === "ok",
      );
      if (videoAsset !== undefined) {
        const datei = path.join(WURZEL, "projects", aktivesProjektId, "media", videoAsset.dateiname);
        if (fs.existsSync(datei)) { fs.unlinkSync(datei); kaputtGemacht = true; }
      }
    } catch (tu) {
      console.log("[schritt-4h] Kaputt-Machen fehlgeschlagen: " + String(tu));
    }
    if (!kaputtGemacht) {
      fund("Reparatur-Fuehrung", "eine kaputte Stelle fuer den Treiber (#421)",
        "keine Video-Datei zum Loeschen gefunden", "Untersuchung", "tests/scripts");
    } else {
      await oeffneUeberListe(aktivesProjektId);
      await klick('[data-testid="reiter-zusammenstellen"]');
      await schlafe(800);
      // WARTEN statt raten: Das Oeffnen laeuft asynchron (Reconcile + Zeichen-
      // voraussetzungen). Erst wenn die ERWARTETE Stelle (das Video-Asset) im Panel
      // steht, ist der neue Stand wirklich da - sonst laese der Test den ALTEN.
      const fristStelle4h = Date.now() + 12_000;
      let stelleJetzt4h = null;
      while (Date.now() < fristStelle4h) {
        stelleJetzt4h = await seite.evaluate(
          () => document.querySelector('[data-testid="reparatur-stelle"]')?.textContent ?? null,
        );
        if ((stelleJetzt4h ?? "").includes("element_asset")) break;
        await schlafe(300);
      }
      console.log("[schritt-4h] Stelle nach dem Oeffnen: " + String(stelleJetzt4h));
      const panelDa4h = await seite.evaluate(() => !!document.querySelector('[data-testid="reparatur-panel"]'));
      if (!panelDa4h) {
        fund("Reparatur-Fuehrung", "das Reparatur-Panel erscheint bei kaputter Stelle (#421)",
          "kein reparatur-panel im Fenster", "Befund", "composer/index.tsx");
      } else {
        // Q4-3 (19.10.2026): Die Zusage aus FA-19/TK 9.7.5 am ECHTEN Fenster messen -
        // "der Render wird erst freigegeben, wenn alle behoben sind". Bisher bewies das
        // nur der Unit-Test; hier haengt es an `disabled` des echten Knopfes.
        const lage4h = await seite.evaluate(() => ({
          fortschritt: document.querySelector('[data-testid="reparatur-fortschritt"]')?.textContent ?? null,
          renderGesperrt: document.querySelector('[data-testid="composer-render-oefnen"]')?.disabled ?? null,
        }));
        const fortschrittOk = /^0 von [1-9]\d* behoben$/.test((lage4h.fortschritt ?? "").trim());
        if (!fortschrittOk) {
          fund("Reparatur-Fuehrung", 'der Fortschritt zeigt "0 von N behoben" mit N >= 1 (TK 9.7.5)',
            `Fortschritt "${String(lage4h.fortschritt)}"`, "Befund", "composer/index.tsx");
        }
        if (lage4h.renderGesperrt !== true) {
          fund("Render-Sperre", "composer-render-oefnen ist bei kaputter Stelle GESPERRT (FA-19/TK 9.7.5)",
            `disabled=${String(lage4h.renderGesperrt)}`, "Befund", "composer/index.tsx");
        } else if (fortschrittOk) {
          console.log('[schritt-4h] Render-Sperre GEMESSEN: Knopf gesperrt, Fortschritt "0 von N behoben" (FA-19).');
        }

        const bloeckeDavor4h = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        const klickFix4h = await seite.evaluate(() => {
          const knopf = document.querySelector('[data-testid="reparatur-option-element_entfernen"]');
          if (knopf === null) return false;
          knopf.click();
          return true;
        });
        await schlafe(3_500);
        const bloeckeDanach4h = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        if (klickFix4h && bloeckeDanach4h < bloeckeDavor4h) {
          console.log(`[schritt-4h] Reparatur "Element entfernen" GEMESSEN: ${bloeckeDavor4h} -> ${bloeckeDanach4h} Bloecke (#421 belegt).`);
          await seite.keyboard.down("Meta");
          await seite.keyboard.press("z");
          await seite.keyboard.up("Meta");
          await schlafe(1_500);
          const bloeckeNachUndo4h = await seite.evaluate(
            () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
          );
          if (bloeckeNachUndo4h === bloeckeDavor4h) {
            console.log(`[schritt-4h] Undo GEMESSEN: ${bloeckeDavor4h} Bloecke nach Cmd+Z (Reparatur = EIN Schritt).`);
          } else {
            fund("Reparatur-Fuehrung", "Cmd+Z nimmt die Reparatur in EINEM Schritt zurueck (#421)",
              `Bloecke davor/nachher Undo: ${bloeckeDavor4h}/${bloeckeNachUndo4h}`, "Befund", "composer/index.tsx");
          }
        } else {
          const diag4h = await seite.evaluate(() => ({
            stelle: document.querySelector('[data-testid="reparatur-stelle"]')?.textContent ?? null,
            fortschritt: document.querySelector('[data-testid="reparatur-fortschritt"]')?.textContent ?? null,
            optionen: [...document.querySelectorAll('[data-testid^="reparatur-option-"]')]
              .map((e) => e.getAttribute('data-testid')),
          }));
          fund("Reparatur-Fuehrung", "eine Fix-Option entfernt das kaputte Element (#421)",
            `Bloecke davor/nachher: ${bloeckeDavor4h}/${bloeckeDanach4h}, geklickt=${String(klickFix4h)}, Lage=${JSON.stringify(diag4h)}`,
            "Befund", "composer/index.tsx");
        }
      }
    }

    // Schritt 4j - WARTESCHLANGE (#257/FA-16): Die Leiste ist im Arbeitsbereich immer
    // sichtbar, zeigt einen GEHOLTEN Stand (nicht "wird geladen"), ueberlebt den
    // Reiterwechsel und laesst sich auf-/zuklappen. Das ist die Zusage, die vor #257
    // keinen Aufrufer hatte (die Leiste war ein leerer footer).
    {
      const leisteDa4j = await stehtDa('[data-testid="queue-panel"]');
      if (!leisteDa4j) {
        fund("Warteschlange", "queue-panel ist im Fenster sichtbar (#257/FA-16)",
          "keine Warteschlangen-Leiste im DOM", "Befund", "queue-panel/index.tsx");
      } else {
        await schlafe(800);
        const lage4j = await seite.evaluate(() => {
          const leiste = document.querySelector('[data-testid="queue-panel"]');
          return {
            text: (leiste?.textContent ?? "").trim(),
            listeZu: leiste?.querySelector("ul") === null,
            zeilenZu: document.querySelectorAll('[data-testid^="auftrag-"]').length,
          };
        });
        if (lage4j.text.includes("wird geladen")) {
          fund("Warteschlange", "die Leiste zeigt den GEHOLTEN Stand (#205, TK 9.14.2)",
            `Leiste haengt auf "${lage4j.text}"`, "Befund", "queue-panel/auftrags-sicht.ts");
        } else if (lage4j.listeZu !== true) {
          fund("Warteschlange", "die Leiste startet EINGEKLAPPT (ENTSCHIEDEN 3)",
            "die Liste ist beim Aufbau schon offen", "Befund", "queue-panel/index.tsx");
        } else {
          console.log(`[schritt-4j] Warteschlange GEMESSEN: Leiste da, eingeklappt, Text "${lage4j.text}" (#257/FA-16).`);
        }

        // "Sie darf nie hinter einem Moduswechsel verschwinden" (TK 9.14.2).
        await klick('[data-testid="reiter-aktionen"]');
        await schlafe(400);
        const nachWechsel4j = await stehtDa('[data-testid="queue-panel"]');
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(400);
        if (!nachWechsel4j) {
          fund("Warteschlange", "die Leiste ueberlebt den Reiterwechsel (TK 9.14.2)",
            "nach dem Wechsel auf Aktionen fehlt queue-panel", "Befund", "app-shell/rahmen.tsx");
        } else {
          console.log("[schritt-4j] Reiterwechsel GEMESSEN: die Leiste bleibt sichtbar (TK 9.14.2).");
        }

        // Aufklappen ueber den ECHTEN Schalter (aria-label aus #206).
        const geklappt4j = await seite.evaluate(() => {
          const knopf = document.querySelector('[aria-label="Warteschlange aufklappen"]');
          if (knopf === null) return false;
          knopf.click();
          return true;
        });
        await schlafe(500);
        const offen4j = await seite.evaluate(() => {
          const leiste = document.querySelector('[data-testid="queue-panel"]');
          return {
            liste: leiste?.querySelector("ul") !== null,
            leer: (leiste?.textContent ?? "").includes("Keine Aufträge"),
            zeilen: document.querySelectorAll('[data-testid^="auftrag-"]').length,
          };
        });
        if (!geklappt4j || (!offen4j.liste && !offen4j.leer)) {
          fund("Warteschlange", "der Klapp-Schalter oeffnet die Auftragsliste (#257, #207)",
            `geklickt=${String(geklappt4j)}, Lage=${JSON.stringify(offen4j)}`, "Befund", "queue-panel/index.tsx");
        } else {
          console.log(`[schritt-4j] Aufklappen GEMESSEN: ${offen4j.zeilen} Auftragszeile(n), leer=${String(offen4j.leer)}.`);
        }
      }
    }

    // Schritt 4k - FA-17: Ein FEHLGESCHLAGENER Auftrag ist mit Grund sichtbar und laesst
    // sich ueber den ECHTEN Schalter "Erneut versuchen" wiederholen. Der Fehlschlag wird
    // provoziert (Import einer nicht vorhandenen Datei), der Grund am Fenster gelesen,
    // die Ursache behoben (Datei anlegen) und danach der Schalter geklickt. Damit reisst
    // die Messung BEIDE Haelften der Zusage: den Grund UND das Gelingen der Wiederholung.
    {
      // Die Leiste muss offen sein, sonst gibt es keine Zeilen im DOM (4j hat sie
      // aufgeklappt - hier wird nicht darauf geraten).
      const leisteZu4k = await seite.evaluate(
        () => document.querySelector('[data-testid="queue-panel"] ul') === null,
      );
      if (leisteZu4k) {
        await seite.evaluate(() => {
          const knopf = document.querySelector('[aria-label="Warteschlange aufklappen"]');
          if (knopf !== null) knopf.click();
        });
        await schlafe(400);
      }

      const fehlPfad = path.join("/tmp", "durchlauf-fa17-" + Date.now() + ".png");
      if (fs.existsSync(fehlPfad)) fs.unlinkSync(fehlPfad);

      // Der Fehlschlag entsteht IM FACHDIENST: `reiheEin` prueft die Nutzlast nur auf
      // Struktur (keine Existenzpruefung, TK 9.3) - der Auftrag wird eingereiht und
      // scheitert sichtbar als `datei_nicht_gefunden`.
      const fehlAntwort = await seite.evaluate(async (pfad, projektId) => {
        return window.api.invoke("queue:reiheEin", {
          art: "import",
          payload: { projektId, quellPfad: pfad },
        });
      }, fehlPfad, aktivesProjektId);

      const fehlId = fehlAntwort && fehlAntwort.ok ? fehlAntwort.wert?.auftragId ?? null : null;
      if (typeof fehlId !== "string" || fehlId.length === 0) {
        fund("Wiederholen (FA-17)", "ein Import-Auftrag laesst sich einreihen",
          "queue:reiheEin ohne auftragId: " + JSON.stringify(fehlAntwort),
          "Befund", "auftrags-manager/ipc-verdrahtung.ts");
      } else {
        const zeilenText4k = () => seite.evaluate((id) => {
          const zeile = document.querySelector(`[data-testid="auftrag-${id}"]`);
          return zeile === null ? null : zeile.textContent;
        }, fehlId);

        const fristFehl4k = Date.now() + 20_000;
        let textFehl4k = null;
        while (Date.now() < fristFehl4k) {
          textFehl4k = await zeilenText4k();
          if ((textFehl4k ?? "").includes("fehlgeschlagen")) break;
          await schlafe(250);
        }
        console.log("[schritt-4k] Fehlschlag-Zeile: " + String(textFehl4k));

        const lage4k = await seite.evaluate((id) => {
          const schalter = document.querySelector(`[data-testid="queue-schalter-${id}"]`);
          const grund = document.querySelector(`[data-testid="queue-fehler-${id}"]`);
          return {
            grund: grund === null ? null : grund.textContent,
            wiederholen: schalter === null ? false
              : [...schalter.querySelectorAll("button")].some((b) => b.textContent === "Erneut versuchen"),
            schalterText: schalter === null ? null : schalter.textContent,
          };
        }, fehlId);

        if (!(textFehl4k ?? "").includes("fehlgeschlagen")) {
          fund("Wiederholen (FA-17)", "der fehlgeschlagene Auftrag steht als Zeile in der Leiste (Q2, FA-16/17)",
            `Zeile nach 20 s: ${String(textFehl4k)}`, "Befund", "auftrags-manager/hole-stand.ts");
        } else if (!(lage4k.grund ?? "").includes("Datei nicht gefunden")) {
          fund("Wiederholen (FA-17)", 'der Grund steht als Klartext an der Zeile ("Datei nicht gefunden", #211)',
            `Grund: ${String(lage4k.grund)}`, "Befund", "queue-panel/fehlertexte.ts");
        } else if (!lage4k.wiederholen) {
          fund("Wiederholen (FA-17)", 'der Schalter "Erneut versuchen" steht an der fehlgeschlagenen Zeile (#210)',
            `Schalter: ${String(lage4k.schalterText)}`, "Befund", "queue-panel/index.tsx");
        } else {
          console.log(`[schritt-4k] Fehlschlag GEMESSEN: Zeile "fehlgeschlagen", Grund "${String(lage4k.grund)}", Schalter "Erneut versuchen".`);

          // Die Ursache beheben - sonst bewiese die Wiederholung nur, dass sie wieder
          // scheitern kann. DIESELBE Datei am DIESELBEN Pfad, jetzt vorhanden.
          const ffmpeg4k = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
          await new Promise((f, r) => {
            const p = spawn(ffmpeg4k, ["-y", "-f", "lavfi", "-i", "testsrc2=size=120x90:rate=1",
              "-frames:v", "1", fehlPfad], { stdio: "ignore" });
            p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt kein Bild (code " + c + ")"))));
          });

          const galerieDavor4k = await seite.evaluate(
            () => document.querySelectorAll('[data-testid^="galerie-eintrag-"]').length,
          );
          // Der ERFOLGS-BELEG kommt aus D1, nicht aus einer Anzeige: Die importierte
          // Datei muss als Asset im Projekt stehen (project.json, entprellt gespeichert).
          const assetsDavor4k = (() => {
            try {
              const pj = JSON.parse(fs.readFileSync(
                path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"));
              return (pj.assets ?? []).length;
            } catch {
              return -1;
            }
          })();
          const retry4k = await seite.evaluate((id) => {
            const schalter = document.querySelector(`[data-testid="queue-schalter-${id}"]`);
            if (schalter === null) return false;
            const knopf = [...schalter.querySelectorAll("button")]
              .find((b) => b.textContent === "Erneut versuchen");
            if (knopf === undefined) return false;
            knopf.click();
            return true;
          }, fehlId);
          if (!retry4k) {
            fund("Wiederholen (FA-17)", "der Schalter laesst sich am echten Fenster klicken",
              "kein Klick ausgeloest", "Befund", "queue-panel/index.tsx");
          } else {
            // Erfolg heisst: der Auftrag ist aus Q1 UND Q2 weg (der Q2-Eintrag wird nur
            // nach ERFOLG gestrichen, TK 9.3.5) - die Zeile verschwindet, und der Import
            // legt einen Galerie-Eintrag an.
            const fristWeg4k = Date.now() + 25_000;
            let weg4k = false;
            while (Date.now() < fristWeg4k) {
              weg4k = await seite.evaluate(
                (id) => document.querySelector(`[data-testid="auftrag-${id}"]`) === null, fehlId,
              );
              if (weg4k) break;
              await schlafe(300);
            }
            // Auf den ENTRELLTEN Speicher warten: der Import schreibt das Asset sofort in
            // D1, project.json aber erst nach dem Auto-Speichern (3-5 s, TK 9.5.4).
            let assetsJetzt4k = assetsDavor4k;
            const fristAssets4k = Date.now() + 15_000;
            while (Date.now() < fristAssets4k) {
              try {
                const pj = JSON.parse(fs.readFileSync(
                  path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"));
                assetsJetzt4k = (pj.assets ?? []).length;
              } catch { /* Datei wird gerade geschrieben */ }
              if (assetsJetzt4k > assetsDavor4k) break;
              await schlafe(300);
            }
            const galerieJetzt4k = await seite.evaluate(
              () => document.querySelectorAll('[data-testid^="galerie-eintrag-"]').length,
            );
            const standNach4k = await seite.evaluate(async (id) => {
              const antwort = await window.api.invoke("queue:holeStand");
              return antwort && antwort.ok ? antwort.wert.some((a) => a.auftragId === id) : null;
            }, fehlId);
            console.log(`[schritt-4k] Wiederholung: Zeile weg=${String(weg4k)}, Assets ${assetsDavor4k}->${assetsJetzt4k}, Galerie ${galerieDavor4k}->${galerieJetzt4k}, Stand traegt den Auftrag=${String(standNach4k)}.`);
            if (!weg4k) {
              fund("Wiederholen (FA-17)", "der wiederholte Auftrag ist nach dem Erfolg nicht mehr in der Leiste",
                `Zeile nach 25 s noch da, Assets ${assetsDavor4k}->${assetsJetzt4k}`,
                "Befund", "auftrags-manager/beende-auftrag.ts");
            } else if (assetsDavor4k < 0) {
              fund("Wiederholen (FA-17)", "der Projektstand ist fuer den Erfolgsbeleg lesbar",
                "project.json nicht lesbar", "Untersuchung", "scripts/durchlauf.mjs");
            } else if (assetsJetzt4k <= assetsDavor4k) {
              fund("Wiederholen (FA-17)", "die Wiederholung fuehrt den Import wirklich aus (Asset in D1)",
                `Assets ${assetsDavor4k}->${assetsJetzt4k}`, "Befund", "media-service/import-datei.ts");
            } else if (standNach4k === true) {
              fund("Wiederholen (FA-17)", "der Erfolg streicht den Q2-Eintrag (TK 9.3.5)",
                "holeStand traegt den Auftrag weiterhin", "Befund", "auftrags-manager/beende-auftrag.ts");
            } else {
              console.log("[schritt-4k] Wiederholen GEMESSEN: Grund gelesen, Datei nachgereicht, \"Erneut versuchen\" -> Auftrag aus Q1/Q2 weg, Asset in D1 (FA-17).");
            }
          }
        }
      }
      // Messrest entfernen (die importierte Kopie liegt im Messprojekt und geht mit ihm).
      if (fs.existsSync(fehlPfad)) fs.unlinkSync(fehlPfad);
    }

    // Schritt 4l - FA-18: Einen ANSTEHENDEN Auftrag entfernen und einen LAUFENDEN Render
    // abbrechen - beides ueber die echten Schalter der Leiste. Der Render wird dafuer
    // lang genug gemacht (30 Elemente auf dasselbe Video); die Elemente gehoeren nur dem
    // Messprojekt und verschwinden mit ihm in Schritt 5.
    {
      const pj4lDatei = path.join(WURZEL, "projects", aktivesProjektId, "project.json");
      let videoAsset4l = null;
      try {
        const pj4l = JSON.parse(fs.readFileSync(pj4lDatei, "utf-8"));
        videoAsset4l = (pj4l.assets ?? []).find((a) => a.typ === "video") ?? null;
      } catch (tu) {
        console.log("[schritt-4l] Projektstand nicht lesbar: " + String(tu));
      }
      if (videoAsset4l === null) {
        fund("Warteschlange (FA-18)", "ein Video-Asset fuer den Render",
          "kein Video-Asset im Messprojekt", "Untersuchung", "scripts/durchlauf.mjs");
      } else {
        // 4h hat die Videodatei GELOESCHT (kaputte Stelle) und nur das Element per Undo
        // zurueckgeholt - die Datei fehlt seither. Fuer diesen Schritt wird sie
        // wiederhergestellt; sonst scheiterte der Render an `medium_fehlt`, bevor es
        // etwas zu entfernen oder abzubrechen gaebe.
        const probe4l = path.join("/tmp", "durchlauf-probe.mp4");
        if (!fs.existsSync(probe4l)) {
          const ffmpeg4l = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
          await new Promise((f, r) => {
            const p = spawn(ffmpeg4l, ["-y", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30",
              "-t", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", probe4l], { stdio: "ignore" });
            p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt nichts (code " + c + ")"))));
          });
        }
        const videoDatei4l = path.join(WURZEL, "projects", aktivesProjektId, "media", videoAsset4l.dateiname);
        fs.copyFileSync(probe4l, videoDatei4l);

        // Die Liste auf einen sauberen, langen Render-Bestand bringen: alte Elemente weg,
        // 30x dasselbe Video hinein. Beides ueber die Vertragskanaele (dieselbe Naht wie
        // der Seed in 4b) - die Sicht wird danach durch NEU OEFFNEN nachgezogen (#407).
        let alteIds4l = [];
        try {
          const pjJetzt = JSON.parse(fs.readFileSync(pj4lDatei, "utf-8"));
          alteIds4l = (pjJetzt.liste ?? []).map((e) => e && e.id).filter((id) => typeof id === "string");
        } catch (tu) {
          console.log("[schritt-4l] Liste nicht lesbar: " + String(tu));
        }
        const umbau4l = await seite.evaluate(async (alteIds, referenz) => {
          const entfernt = [];
          for (const id of alteIds) {
            const antwort = await window.api.invoke("project:entferneElement", { elementId: id });
            entfernt.push(antwort && antwort.ok);
          }
          const angelegt = [];
          for (let i = 0; i < 30; i++) {
            const antwort = await window.api.invoke("project:fügeElementHinzu", { referenz });
            angelegt.push(antwort && antwort.ok);
          }
          return {
            entferntOk: entfernt.filter(Boolean).length,
            entfernt: entfernt.length,
            angelegtOk: angelegt.filter(Boolean).length,
            angelegt: angelegt.length,
          };
        }, alteIds4l, videoAsset4l.id);
        console.log("[schritt-4l] Listen-Umbau: " + JSON.stringify(umbau4l));
        if (umbau4l.angelegtOk !== umbau4l.angelegt) {
          fund("Warteschlange (FA-18)", "30 Video-Elemente fuer einen langen Render",
            `${umbau4l.angelegtOk} von ${umbau4l.angelegt} angelegt`, "Untersuchung", "scripts/durchlauf.mjs");
        }

        // Der Auto-Speicher ist entprellt - erst wenn die PLATTE 30 Elemente traegt, wird
        // neu geoeffnet (sonst laese die Ansicht den alten Stand).
        let gespeichert4l = false;
        const fristSave4l = Date.now() + 15_000;
        while (Date.now() < fristSave4l) {
          try {
            const pj = JSON.parse(fs.readFileSync(pj4lDatei, "utf-8"));
            if ((pj.liste ?? []).length === 30) { gespeichert4l = true; break; }
          } catch { /* Datei wird gerade geschrieben */ }
          await schlafe(300);
        }
        await oeffneUeberListe(aktivesProjektId);
        await klick('[data-testid="reiter-zusammenstellen"]');
        await schlafe(1_200);
        const bloecke4l = await seite.evaluate(
          () => document.querySelectorAll('[data-testid^="zeitleiste-block-"]').length,
        );
        const reparatur4l = await seite.evaluate(
          () => document.querySelector('[data-testid="reparatur-panel"]') !== null,
        );
        console.log(`[schritt-4l] Nach dem Neuoeffnen: ${bloecke4l} Bloecke, Reparatur-Panel=${String(reparatur4l)}, gespeichert=${String(gespeichert4l)}.`);

        const renderName4l = "durchlauf-abbruch-" + Date.now();
        if (!gespeichert4l || bloecke4l !== 30 || reparatur4l) {
          fund("Warteschlange (FA-18)", "der Messbestand steht als 30 Bloecke ohne kaputte Stelle",
            `gespeichert=${String(gespeichert4l)}, Bloecke=${bloecke4l}, Reparatur=${String(reparatur4l)}`,
            "Untersuchung", "scripts/durchlauf.mjs");
        } else if (!(await klick('[data-testid="composer-render-oefnen"]'))
          || !(await stehtDa('[data-testid="render-dialog-name"]'))) {
          fund("Warteschlange (FA-18)", "der Render-Dialog laesst sich oeffnen",
            "kein Namensfeld im Dialog", "Befund", "composer/render-dialog.tsx");
        } else {
          // Namenfeld LEEREN (es traegt den letzten Ausgabenamen vor) und neu tippen.
          await seite.click('[data-testid="render-dialog-name"]');
          await seite.keyboard.down("Meta");
          await seite.keyboard.press("a");
          await seite.keyboard.up("Meta");
          await seite.type('[data-testid="render-dialog-name"]', renderName4l);
          const gesperrt4l = await seite.evaluate(() => {
            const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
            return knopf === null ? null : knopf.disabled;
          });
          if (gesperrt4l !== false) {
            fund("Warteschlange (FA-18)", "der Ausloeser ist nach der Namenseingabe betaetigbar",
              `disabled=${String(gesperrt4l)}`, "Untersuchung", "composer/render-dialog.tsx");
          } else {
            await seite.evaluate(() => {
              const knopf = document.querySelector('[data-testid="render-dialog-ausloeser"]');
              if (knopf !== null) knopf.click();
            });

            // Zeilen der Leiste als {id, text} - gesucht wird ueber das Label, weil die
            // auftragId erst mit dem Ereignis ins Fenster kommt.
            const zeilen4l = () => seite.evaluate(() =>
              [...document.querySelectorAll('[data-testid^="auftrag-"]')].map((e) => ({
                id: (e.getAttribute("data-testid") ?? "").replace("auftrag-", ""),
                text: e.textContent ?? "",
              })));
            const gleicheZeile = (zeilen, teil) => zeilen.find((z) => z.text.includes(teil)) ?? null;

            const fristLauf4l = Date.now() + 20_000;
            let renderZeile4l = null;
            while (Date.now() < fristLauf4l) {
              renderZeile4l = gleicheZeile(await zeilen4l(), `Render: ${renderName4l}.mp4`);
              if (renderZeile4l !== null && renderZeile4l.text.includes("läuft")) break;
              renderZeile4l = null;
              await schlafe(150);
            }
            if (renderZeile4l === null) {
              fund("Warteschlange (FA-18)", "der Render steht als LAUFENDE Zeile in der Leiste",
                "keine laufende Render-Zeile nach 20 s", "Befund", "queue-panel/auftrags-sicht.ts");
            } else {
              console.log(`[schritt-4l] Render laeuft: ${renderZeile4l.text}`);
              // Ein gueltiger Import hinter dem laufenden Render -> er MUSS anstehen.
              const wartPfad = path.join("/tmp", "durchlauf-fa18-" + Date.now() + ".png");
              const ffmpegW = path.join(WURZEL, "node_modules", "ffmpeg-static", "ffmpeg");
              await new Promise((f, r) => {
                const p = spawn(ffmpegW, ["-y", "-f", "lavfi", "-i", "testsrc2=size=120x90:rate=1",
                  "-frames:v", "1", wartPfad], { stdio: "ignore" });
                p.on("exit", (c) => (c === 0 ? f() : r(new Error("ffmpeg erzeugt kein Bild (code " + c + ")"))));
              });
              await seite.evaluate(async (pfad, projektId) => {
                return window.api.invoke("queue:reiheEin", {
                  art: "import",
                  payload: { projektId, quellPfad: pfad },
                });
              }, wartPfad, aktivesProjektId);

              const fristWart4l = Date.now() + 10_000;
              let wartZeile4l = null;
              while (Date.now() < fristWart4l) {
                wartZeile4l = gleicheZeile(await zeilen4l(), "Import: " + path.basename(wartPfad));
                if (wartZeile4l !== null && wartZeile4l.text.includes("wartet")) break;
                if (wartZeile4l !== null && wartZeile4l.text.includes("läuft")) break;
                wartZeile4l = null;
                await schlafe(150);
              }
              if (wartZeile4l === null) {
                fund("Warteschlange (FA-18)", "ein Auftrag hinter einem laufenden Render steht als 'wartet'",
                  "keine wartende Import-Zeile nach 10 s", "Untersuchung", "scripts/durchlauf.mjs");
              } else if (!wartZeile4l.text.includes("wartet")) {
                fund("Warteschlange (FA-18)", "der zweite Auftrag wartet hinter dem Render (serielle Freigabe, NFA-09)",
                  `Zeile: ${wartZeile4l.text}`, "Untersuchung", "auftrags-manager/torwaechter.ts");
              } else {
                console.log(`[schritt-4l] Anstehend GEMESSEN: ${wartZeile4l.text}`);
                const entferntKlick4l = await seite.evaluate((id) => {
                  const schalter = document.querySelector(`[data-testid="queue-schalter-${id}"]`);
                  if (schalter === null) return false;
                  const knopf = [...schalter.querySelectorAll("button")]
                    .find((b) => b.textContent === "Aus der Warteschlange nehmen");
                  if (knopf === undefined) return false;
                  knopf.click();
                  return true;
                }, wartZeile4l.id);
                await schlafe(1_500);
                const nachEntfernen4l = await zeilen4l();
                const wartWeg4l = gleicheZeile(nachEntfernen4l, "Import: " + path.basename(wartPfad)) === null;
                const renderNoch4l = gleicheZeile(nachEntfernen4l, `Render: ${renderName4l}.mp4`);
                if (!entferntKlick4l || !wartWeg4l) {
                  fund("Warteschlange (FA-18)", "der Schalter nimmt den anstehenden Auftrag aus der Leiste",
                    `geklickt=${String(entferntKlick4l)}, Zeile weg=${String(wartWeg4l)}`,
                    "Befund", "queue-panel/index.tsx");
                } else {
                  console.log("[schritt-4l] Entfernen GEMESSEN: anstehender Auftrag ist aus der Leiste verschwunden (FA-18).");
                  const abortKlick4l = await seite.evaluate((id) => {
                    const schalter = document.querySelector(`[data-testid="queue-schalter-${id}"]`);
                    if (schalter === null) return false;
                    const knopf = [...schalter.querySelectorAll("button")]
                      .find((b) => b.textContent === "Render abbrechen");
                    if (knopf === undefined) return false;
                    knopf.click();
                    return true;
                  }, renderZeile4l.id);
                  await schlafe(400);
                  const frage4l = await seite.evaluate(() => {
                    const frage = document.querySelector('[data-testid="queue-panel-rueckfrage"]');
                    return {
                      da: frage !== null,
                      text: frage === null ? null
                        : document.querySelector('[data-testid="queue-panel-rueckfrage-text"]')?.textContent ?? null,
                    };
                  });
                  if (!abortKlick4l || !frage4l.da) {
                    fund("Warteschlange (FA-18)", "der Abbruch fragt zuerst nach (#209, TK 9.2.3)",
                      `geklickt=${String(abortKlick4l)}, Rueckfrage=${String(frage4l.da)}`,
                      "Befund", "queue-panel/index.tsx");
                  } else if (!(frage4l.text ?? "").includes("abbrechen?")
                    || !(frage4l.text ?? "").includes("keine Ausgabedatei")) {
                    fund("Warteschlange (FA-18)", "die Rueckfrage nennt Abbruch und unveraenderte Datei",
                      `Text: ${String(frage4l.text)}`, "Befund", "queue-panel/entfernen.ts");
                  } else {
                    console.log(`[schritt-4l] Rueckfrage GEMESSEN: ${String(frage4l.text)}`);
                    await seite.evaluate(() => {
                      const knopf = document.querySelector('[data-testid="queue-panel-rueckfrage-bestaetigen"]');
                      if (knopf !== null) knopf.click();
                    });
                    const fristAbbruch4l = Date.now() + 30_000;
                    let renderWeg4l = false;
                    while (Date.now() < fristAbbruch4l) {
                      renderWeg4l = gleicheZeile(await zeilen4l(), `Render: ${renderName4l}.mp4`) === null;
                      if (renderWeg4l) break;
                      await schlafe(250);
                    }
                    const restStand4l = await seite.evaluate(async (ids) => {
                      const antwort = await window.api.invoke("queue:holeStand");
                      if (!antwort || !antwort.ok) return null;
                      return antwort.wert
                        .filter((a) => ids.includes(a.auftragId))
                        .map((a) => ({ id: a.auftragId, status: a.status }));
                    }, [renderZeile4l.id, wartZeile4l.id]);
                    const ausgabe4l = path.join(WURZEL, "projects", aktivesProjektId, "output", renderName4l + ".mp4");
                    const dateiDa4l = fs.existsSync(ausgabe4l);
                    console.log(`[schritt-4l] Abbruch: Zeile weg=${String(renderWeg4l)}, Rest=${JSON.stringify(restStand4l)}, Ausgabedatei=${String(dateiDa4l)}.`);
                    if (!renderWeg4l) {
                      fund("Warteschlange (FA-18)", "der abgebrochene Render verlaesst die Leiste",
                        "Zeile nach 30 s noch da", "Befund", "auftrags-manager/beende-auftrag.ts");
                    } else if (Array.isArray(restStand4l) && restStand4l.length > 0) {
                      fund("Warteschlange (FA-18)", "nach dem Abbruch bleibt kein Auftrag im Stand",
                        JSON.stringify(restStand4l), "Befund", "auftrags-manager/beende-auftrag.ts");
                    } else if (dateiDa4l) {
                      fund("Warteschlange (FA-18)", "der Abbruch erzeugt KEINE Ausgabedatei (TK 9.2.3)",
                        `Datei entstanden: ${ausgabe4l}`, "Befund", "auftrags-manager/entferne.ts");
                    } else {
                      console.log("[schritt-4l] Abbrechen GEMESSEN: Rueckfrage bestaetigt, Render abgebrochen, keine Ausgabedatei (FA-18).");
                    }
                  }
                }
              }
              if (fs.existsSync(wartPfad)) fs.unlinkSync(wartPfad);
            }
          }
        }
      }
    }

    // Schritt 5 - Abschluss: gesammelte Ereignisse und Fehler ablesen.
    // Aufräumblock (User-Entscheidung 14.10.2026, solange die App NICHT fertig ist):
    // Jeder Lauf loescht seine eigenen Projekte ("DurchlaufTest-*") ueber den ECHTEN
    // IPC-Weg (project:löscheProjekt, D1-Lock, Loesch-Asymmetrie im Projektstore) -
    // so bleibt der Datenort zwischen den Laeufen leer und nichts schleppt sich an.
    const aufraeumt = await seite.evaluate(async () => {
      const liste = await window.api.invoke("project:listeProjekte");
      const projekte = liste && liste.ok ? liste.wert : [];
      const geloescht = [];
      for (const eintrag of projekte) {
        const name = String((eintrag && (eintrag.name ?? eintrag.titel)) ?? "");
        if (!name.startsWith("DurchlaufTest")) continue;
        try {
          const antwort = await window.api.invoke("project:löscheProjekt", { id: String(eintrag.id) });
          geloescht.push({ id: String(eintrag.id), ok: antwort.ok });
        } catch (fehler) {
          geloescht.push({ id: String(eintrag.id), ok: false, fehler: String(fehler) });
        }
      }
      return { gefunden: projekte.length, geloescht };
    });
    console.log("[schritt-5] Aufraeumen: " + JSON.stringify(aufraeumt));
    const nichtGeloescht = (aufraeumt.geloescht ?? []).filter((g) => !g.ok);
    if (nichtGeloescht.length > 0) {
      fund("Aufraeumen", "der Lauf loescht seine eigenen DurchlaufTest-Projekte",
        `${nichtGeloescht.length} Einträge blieben liegengedecht (s. Protokoll)`, "Untersuchung", "scripts/durchlauf.mjs");
    }

    // Auch die eigenen MESS-MARKEN (4a0): Sie sind projektuebergreifend und wuerden sonst
    // den Bestand jedes Laufs wachsen lassen. Erlaubt ist nur der eindeutige Praefix;
    // eine Ablehnung (noch referenziert) wird gemeldet, nicht verschwiegen.
    const markenAufraeumt = await seite.evaluate(async () => {
      const antwort = await window.api.invoke("marken:listeMarken");
      if (!antwort || !antwort.ok) return { fehler: 'listeMarken' };
      const eigene = antwort.wert.filter((m) => String(m.name).startsWith("DurchlaufMarke"));
      // ABGELEITETE ZUERST: eine Basis mit noch existierendem Kind ist gesperrt
      // (marke_referenziert). In Bestandsreihenfolge steht die Basis vorn - nach einem
      // abgebrochenen Lauf bliebe sie sonst als Leiche liegen (gemessen 22.10.2026).
      const reihenfolge = [...eigene].sort((a, b) => (a.parent === null ? 1 : 0) - (b.parent === null ? 1 : 0));
      const ergebnisse = [];
      for (const marke of reihenfolge) {
        const weg = await window.api.invoke("marken:loescheMarke", { markeId: marke.id });
        ergebnisse.push({ name: marke.name, ok: weg && weg.ok, code: weg && !weg.ok ? weg.fehler.code : null });
      }
      return { anzahl: eigene.length, ergebnisse };
    });
    console.log("[schritt-5] Marken-Aufraeumen: " + JSON.stringify(markenAufraeumt));
    if (markenAufraeumt.fehler === undefined
      && (markenAufraeumt.ergebnisse ?? []).some((e) => !e.ok)) {
      fund("Aufraeumen", "der Lauf loescht seine eigenen DurchlaufMarke-Eintraege",
        JSON.stringify(markenAufraeumt.ergebnisse), "Untersuchung", "scripts/durchlauf.mjs");
    }

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

    // Gate (Q4, 19.10.2026): `npm run pruefung` muss an einem echten Fund scheitern.
    // `Untersuchung` und `MANUELL` bleiben Hinweise - sie sind keine Regression.
    const befundZahl = funde.filter((f) => f.schwere === "Befund").length;
    if (befundZahl > 0) {
      console.error(`[befund] ${befundZahl} Fund(e) der Schwere "Befund" - Pruefung nicht bestanden.`);
    }
    if (erlebteFehler.length > 0 || befundZahl > 0) process.exitCode = 2;
  } finally {
    abschluss = true;
    await browser.close().catch(() => {});
  }
};

await main();
