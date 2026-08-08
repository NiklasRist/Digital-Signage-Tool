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
async function beende(code) {
  herunterfahren = true;
  if (entprellung) clearTimeout(entprellung);
  if (elektron) {
    neustartLaeuft = true;
    elektron.kill();
  }
  if (stoppeBeobachtung) await stoppeBeobachtung();
  if (server) await server.close();
  process.exit(code);
}

process.on("SIGINT", () => void beende(0));
process.on("SIGTERM", () => void beende(0));

server = await createServer();
await server.listen();

const devUrl = server.resolvedUrls?.local?.[0];
if (!devUrl) {
  console.error("[dev] Vite hat keine lokale URL gemeldet - Abbruch.");
  await beende(1);
}

console.log(`[dev] Vite laeuft auf ${devUrl}`);

stoppeBeobachtung = await beobachte(() => starteNeu(devUrl));
