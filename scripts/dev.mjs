// Entwicklungslauf: Vite-Devserver fuer den Renderer (mit HMR), esbuild im
// Beobachtungsmodus fuer Main und Preload, und Electron, das bei jeder Aenderung an
// Main/Preload neu startet.
//
// Warum der Renderer NICHT neu startet: Vite ersetzt geaenderte Module im laufenden
// Fenster (Hot Module Replacement). Ein Neustart waere dort nicht nur unnoetig, er
// wuerde den Zustand der Oberflaeche verwerfen.

import { spawn } from "node:child_process";
import { createServer } from "vite";
import elektronPfad from "electron";
import { beobachte } from "./build-main.mjs";

/** @type {import("node:child_process").ChildProcess | null} */
let elektron = null;
/** true, waehrend wir Electron absichtlich beenden - unterdrueckt das Herunterfahren */
let neustartLaeuft = false;
/** @type {NodeJS.Timeout | null} */
let entprellung = null;
let herunterfahren = false;

/**
 * Startet Electron neu. Entprellt, weil Main und Preload getrennt gebaut werden und
 * eine einzige Aenderung sonst zwei Neustarts ausloesen koennte.
 * @param {string} devUrl
 */
function starteNeu(devUrl) {
  if (entprellung) clearTimeout(entprellung);
  entprellung = setTimeout(() => {
    if (herunterfahren) return;
    if (elektron) {
      neustartLaeuft = true;
      elektron.kill();
    }
    elektron = spawn(elektronPfad, ["dist/main/index.cjs"], {
      stdio: "inherit",
      env: {
        ...process.env,
        // Der Main entscheidet daran, ob er die Dev-URL oder die gebaute
        // dist/renderer/index.html laedt (#3).
        VITE_DEV_SERVER_URL: devUrl,
      },
    });
    elektron.on("exit", (code) => {
      if (neustartLaeuft) {
        neustartLaeuft = false;
        return;
      }
      // Electron wurde vom Nutzer geschlossen (oder ist abgestuerzt) - dann endet
      // auch der Entwicklungslauf, statt einen Devserver ohne Fenster zurueckzulassen.
      console.log(`[dev] Electron beendet (Code ${code ?? 0}) - fahre herunter.`);
      void beende(code ?? 0);
    });
    console.log("[dev] Electron gestartet.");
  }, 150);
}

/** @type {(() => Promise<void>) | null} */
let stoppeBeobachtung = null;
/** @type {import("vite").ViteDevServer | null} */
let server = null;

/**
 * @param {number} code
 * @returns {Promise<never>}
 */
/** Wartet auf das Ende eines Kindprozesses, hoechstens `ms`. */
function warteAufEnde(kind, ms) {
  if (kind.exitCode !== null || kind.signalCode !== null) return Promise.resolve();
  return new Promise((loese) => {
    const frist = setTimeout(loese, ms);
    kind.once("exit", () => {
      clearTimeout(frist);
      loese();
    });
  });
}

async function beende(code) {
  herunterfahren = true;
  if (entprellung) clearTimeout(entprellung);
  if (elektron) {
    neustartLaeuft = true;
    elektron.kill();
    // NACHDECKEN (Befund 29.10.2026): Der Main beendet sich ueber `before-quit` und
    // wartet dort auf die Entscheidung des Renderers (Flush-Dialog). Bleibt die aus,
    // steht er - am 27.10.2026 blieb so eine Electron-Waise zwei Tage ohne Fenster
    // stehen. Ein abgebrochener Dev-Lauf muss enden: nach der Frist hart nachhelfen.
    // Die Frist ist bewusst laenger als der regulaere Flush; die App bekommt ihre Zeit.

    try {
      elektron.kill("SIGKILL");
    } catch {
      // Schon beendet - Aufraeumen ist eine Hoeflichkeit.
    }
  }
  if (stoppeBeobachtung) await stoppeBeobachtung();
  if (server) await server.close();
  process.exit(code);
}

// SIGHUP ist der Fall, der am 27.10.2026 eine Electron-Waise hinterliess: Wird das
// Terminal geschlossen (oder die SSH-Sitzung getrennt), bekommt dieser Prozess SIGHUP -
// ohne Handler stirbt er SOFORT, ohne `beende()` zu erreichen, und das gestartete
// Electron laeuft ohne Devserver weiter (PPID 1, kein Fensterbezug mehr, haelt die
// Einzelinstanz-Sperre). SIGINT/SIGTERM allein deckten das nicht ab.
process.on("SIGINT", () => void beende(0));
process.on("SIGTERM", () => void beende(0));
process.on("SIGHUP", () => void beende(0));

// Letzte Rueckversicherung: Auch auf einem Weg, der `beende()` nicht erreicht (harter
// Abbruch des Node-Prozesses), wird das Kind mitgenommen. `kill()` ist synchron genug
// fuer den exit-Handler; mehr ist hier nicht erlaubt.
process.on("exit", () => {
  if (elektron) {
    try {
      elektron.kill();
    } catch {
      // Beim Herunterfahren ist Aufraeumen eine Hoeflichkeit, kein Fachschritt.
    }
  }
});

server = await createServer();
await server.listen();

const devUrl = server.resolvedUrls?.local?.[0];
if (!devUrl) {
  console.error("[dev] Vite hat keine lokale URL gemeldet - Abbruch.");
  await beende(1);
}

console.log(`[dev] Vite laeuft auf ${devUrl}`);

stoppeBeobachtung = await beobachte(() => starteNeu(devUrl));
