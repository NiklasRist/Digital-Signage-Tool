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
          vorlagenId: "vollbild",
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

    // Schritt 4f2 - BAND-Aufnahme am echten Fenster (#425): eine Aktion wird auf den
    // VIDEO-Block gezogen (nicht an eine Kante). Erwartet: das Video-Element traegt
    // danach einen Band-Abschnitt (harter Beleg: project.json), die Zahl der
    // Zeitleisten-Bloecke bleibt GLEICH (das Band ist kein neues Listenelement, TK 9.2.8),
    // und waehrend des Zugs traegt der Video-Block data-band-ziel="true".
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
        // Der harte Beleg ist der STORE-Stand auf der Platte (der Main schreibt die
        // Einblendung ueber setzeEinblendung, #129) - nach dem entprellten Auto-Speichern.
        let abschnitte4f2 = null;
        try {
          const json4f2 = JSON.parse(
            fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"),
          );
          const videoEl4f2 = (json4f2.liste ?? []).find((e) => e.art === "video");
          abschnitte4f2 = videoEl4f2 && videoEl4f2.einblendung ? videoEl4f2.einblendung.abschnitte : null;
        } catch (tu) {
          abschnitte4f2 = "lesefehler: " + String(tu);
        }
        // Zweiter Beleg aus der OBERFLAECHE: die Band-Ansicht oeffnen und die
        // Abschnittszeilen zaehlen (der Baustein liest die vorhandene Einblendung).
        await klick('[data-testid="composer-ansicht-liste"]');
        await schlafe(500);
        const bandKnopf4f2 = await seite.$('[data-testid="element-band"]');
        let bandZeilen4f2 = null;
        if (bandKnopf4f2 !== null) {
          await bandKnopf4f2.click();
          await schlafe(700);
          bandZeilen4f2 = await seite.evaluate(
            () => document.querySelectorAll('[data-testid="band-abschnitt-griff"]').length,
          );
          await seite.evaluate(() => {
            const overlay = document.querySelector('[data-testid="composer-overlay-band"]');
            const ab = overlay === null
              ? null
              : [...overlay.querySelectorAll('button')].find((b) => b.textContent === 'Abbrechen');
            if (ab) ab.click();
          });
          await schlafe(200);
        }
        await klick('[data-testid="composer-ansicht-zeitleiste"]');
        await schlafe(200);
        const meldung4f2 = await seite.evaluate(
          () => document.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent ?? null,
        );
        console.log(`[schritt-4f2] Band: bandZiel=${bandZiel4f2}; Bloecke ${bloeckeVor4f2}->${bloeckeNach4f2}; Abschnitte=${JSON.stringify(abschnitte4f2)}; Band-Zeilen=${bandZeilen4f2}; Meldung=${JSON.stringify(meldung4f2)}`);
        const hatAbschnitt4f2 =
          (Array.isArray(abschnitte4f2) && abschnitte4f2.some((a) => a.aktionRef === aktionsId417)) ||
          (typeof bandZeilen4f2 === "number" && bandZeilen4f2 > 0);
        if (bandZiel4f2 !== "true") {
          fund("Band-Aufnahme", "der Video-Block ist waehrend des Zugs sichtbar das Band-Ziel (#425)",
            `data-band-ziel=${bandZiel4f2}`, "Befund", "composer/index.tsx");
        }
        if (!hatAbschnitt4f2) {
          fund("Band-Aufnahme", "ein Drop auf das Video wird ein Band-Abschnitt (#425)",
            `Abschnitte: ${JSON.stringify(abschnitte4f2)}; Band-Zeilen: ${bandZeilen4f2}; Meldung: ${JSON.stringify(meldung4f2)}`,
            "Befund", "composer/index.tsx");
        } else if (bloeckeNach4f2 !== bloeckeVor4f2) {
          fund("Band-Aufnahme", "das Band ist KEIN neues Listenelement (TK 9.2.8)",
            `Bloecke ${bloeckeVor4f2}->${bloeckeNach4f2}`, "Befund", "composer/index.tsx");
        } else {
          console.log("[schritt-4f2] Band-Aufnahme GEMESSEN: das Video traegt einen Band-Abschnitt, die Blockzahl ist unveraendert (#425 belegt).");
        }
        // DoD: die Aufnahme ist EIN Undo-Schritt (Cmd+Z). Gemessen wird in der
        // Oberflaeche: nach EINEM Cmd+Z ist der Band-Abschnitt weg (Band-Zeilen 0).
        await seite.keyboard.down("Meta");
        await seite.keyboard.press("z");
        await seite.keyboard.up("Meta");
        await schlafe(1_500);
        await klick('[data-testid="composer-ansicht-liste"]');
        await schlafe(400);
        const bandKnopfUndo4f2 = await seite.$('[data-testid="element-band"]');
        let bandZeilenUndo4f2 = null;
        if (bandKnopfUndo4f2 !== null) {
          await bandKnopfUndo4f2.click();
          await schlafe(600);
          bandZeilenUndo4f2 = await seite.evaluate(
            () => document.querySelectorAll('[data-testid="band-abschnitt-griff"]').length,
          );
          await seite.evaluate(() => {
            const overlay = document.querySelector('[data-testid="composer-overlay-band"]');
            const ab = overlay === null
              ? null
              : [...overlay.querySelectorAll('button')].find((b) => b.textContent === 'Abbrechen');
            if (ab) ab.click();
          });
          await schlafe(200);
        }
        await klick('[data-testid="composer-ansicht-zeitleiste"]');
        await schlafe(200);
        console.log(`[schritt-4f2] Undo: Band-Zeilen nach Cmd+Z = ${bandZeilenUndo4f2}`);
        if (bandZeilenUndo4f2 !== 0) {
          fund("Band-Aufnahme-Undo", "Cmd+Z nimmt die Band-Aufnahme in EINEM Schritt zurueck (#243)",
            `Band-Zeilen nach Undo: ${bandZeilenUndo4f2}`, "Befund", "composer/index.tsx");
        } else {
          console.log("[schritt-4f2] Undo GEMESSEN: die Band-Aufnahme ist EIN Schritt (Cmd+Z, #425 belegt).");
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
      () => document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]').length,
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
        () => document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]').length,
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
        () => document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]').length,
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
        () => document.querySelectorAll('[data-testid="aktionen-liste"] [data-testid^="aktion-"]').length,
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

    // Schritt 4h - Reparatur-Fuehrung (#421): eine KAPUTTE Stelle erzeugen (die kopierte
    // Medien-Datei loeschen), das Projekt per UI neu oeffnen (Reconcile -> Asset 'fehlt'),
    // dann eine Fix-Option bedienen und Cmd+Z messen (EIN Schritt ueber den Wrapped-Schreiber).
    let kaputtGemacht = false;
    try {
      const projektJson = JSON.parse(
        fs.readFileSync(path.join(WURZEL, "projects", aktivesProjektId, "project.json"), "utf-8"),
      );
      const videoAsset = (projektJson.assets ?? []).find((a) => a.typ === "video" && a.zustand === "ok");
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
      await klick('[data-testid="reiter-projekte"]');
      await schlafe(400);
      await seite.evaluate((pid) => {
        const zeile = document.querySelector(`[data-testid="projekt-${pid}"]`);
        const knopf = zeile === null ? null : zeile.querySelector("button");
        if (knopf !== null) knopf.click();
      }, aktivesProjektId);
      await schlafe(2_500);
      await klick('[data-testid="reiter-zusammenstellen"]');
      await schlafe(800);
      const panelDa4h = await seite.evaluate(() => !!document.querySelector('[data-testid="reparatur-panel"]'));
      if (!panelDa4h) {
        fund("Reparatur-Fuehrung", "das Reparatur-Panel erscheint bei kaputter Stelle (#421)",
          "kein reparatur-panel im Fenster", "Befund", "composer/index.tsx");
      } else {
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
          fund("Reparatur-Fuehrung", "eine Fix-Option entfernt das kaputte Element (#421)",
            `Bloecke davor/nachher: ${bloeckeDavor4h}/${bloeckeDanach4h}, geklickt=${String(klickFix4h)}`,
            "Befund", "composer/index.tsx");
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
