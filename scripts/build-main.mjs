// Baut Main UND Preload mit esbuild. Beide zusammen, weil sie dieselbe Zielumgebung
// haben (Node/CommonJS im Electron-Prozess) und dieselbe externals-Liste brauchen -
// zwei getrennte Skripte waeren zwei Orte, an denen die Liste auseinanderlaufen kann.
//
// Aufruf:
//   node scripts/build-main.mjs           einmal bauen
//   node scripts/build-main.mjs --watch   beobachten (nutzt das Dev-Skript)

import esbuild from "esbuild";
import { pathToFileURL } from "node:url";

/**
 * Pakete, die NICHT ins Bundle wandern duerfen.
 *
 * - electron          ist zur Laufzeit von der Electron-Umgebung bereitgestellt und
 *                     existiert als Modul gar nicht auf der Platte.
 * - ffmpeg-static     liefert eine grosse, plattformspezifische BINAERDATEI mit. Ein
 *                     Bundler, der sie anfasst, zerstoert sie - und zwar lautlos: Der
 *                     Build laeuft durch, der Fehler zeigt sich erst beim ersten
 *                     echten Render-Aufruf. Das Buendeln uebernimmt electron-builder
 *                     ueber asarUnpack (#6/#7), nicht dieser Bundler.
 * - fluent-ffmpeg     laedt seine Module zur Laufzeit dynamisch nach; gebuendelt
 *                     findet es sie nicht mehr.
 *
 * Diese Liste ist der einzige Ort, an dem die Regel steht. Wer hier etwas entfernt,
 * hebt sie auf.
 */
const EXTERN = ["electron", "ffmpeg-static", "fluent-ffmpeg"];

/** @type {import("esbuild").BuildOptions} */
const gemeinsam = {
  bundle: true,
  platform: "node",
  // Node-Version, die Electron mitbringt. Nicht hoeher setzen, ohne die
  // Electron-Version zu pruefen.
  target: "node20",
  // CommonJS, nicht ESM: Electron laedt Preload-Skripte im Sandbox-Modus nur als
  // CommonJS (siehe tsconfig.preload.json), und der Main bleibt aus demselben Grund
  // im gleichen Format.
  format: "cjs",
  external: EXTERN,
  sourcemap: true,
  logLevel: "info",
};

/** @type {Array<{name: string, optionen: import("esbuild").BuildOptions}>} */
const ziele = [
  {
    name: "main",
    optionen: { ...gemeinsam, entryPoints: ["src/main/index.ts"], outfile: "dist/main/index.js" },
  },
  {
    name: "preload",
    optionen: { ...gemeinsam, entryPoints: ["src/preload/index.ts"], outfile: "dist/preload/index.js" },
  },
];

const beobachten = process.argv.includes("--watch");

/**
 * Baut beide Ziele einmal.
 * @returns {Promise<void>}
 */
export async function baue() {
  await Promise.all(ziele.map((z) => esbuild.build(z.optionen)));
}

/**
 * Beobachtet beide Ziele und ruft nach jedem erfolgreichen Durchlauf `beiNeubau`.
 * @param {(ziel: string) => void} beiNeubau
 * @returns {Promise<() => Promise<void>>} Funktion zum Beenden der Beobachtung
 */
export async function beobachte(beiNeubau) {
  const kontexte = await Promise.all(
    ziele.map((z) =>
      esbuild.context({
        ...z.optionen,
        plugins: [
          {
            name: "melde-neubau",
            setup(build) {
              build.onEnd((ergebnis) => {
                if (ergebnis.errors.length === 0) beiNeubau(z.name);
              });
            },
          },
        ],
      }),
    ),
  );
  await Promise.all(kontexte.map((k) => k.watch()));
  return async () => {
    await Promise.all(kontexte.map((k) => k.dispose()));
  };
}

// Nur ausfuehren, wenn direkt aufgerufen - nicht beim Import aus dev.mjs.
// pathToFileURL statt Zeichenkette zusammenbauen: auf Windows lautet die URL
// "file:///C:/..." mit drei Schraegstrichen, ein selbstgebautes "file://C:/..."
// haette nie uebereingestimmt und das Skript waere beim direkten Aufruf stumm geblieben.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (beobachten) {
    await beobachte((ziel) => console.log(`[build-main] ${ziel} neu gebaut`));
  } else {
    await baue();
  }
}
