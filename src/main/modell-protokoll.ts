// [main] Lese-Protokoll `modell://` fuer das mitgelieferte Freistell-Modell (13.11.2026, #474)
//
// WARUM ES DIESES PROTOKOLL GIBT: Das gepackte Fenster laedt die Seite ueber `loadFile`,
// also `file://` (#3). Dort ist `fetch` auf eine relative Datei blockiert - und ohne
// `fetch` kommt weder das Modell noch die WASM-Runtime des Rechners in den Renderer.
// Dieselbe Bauart wie `marken://` (9.15.3): EIN privilegiertes Schema, dieselben fuenf
// Rechte (`standard`, `secure`, `supportFetchAPI`, `stream`, `corsEnabled`).
//
// GENAU DIESE DATEIEN, KEIN PFAD AUS DER ANFRAGE: Die Zuordnung ist eine Tabelle aus
// festen Namen auf feste Pfade. Es gibt keine Verzeichnisliste, kein `path.join` mit
// Anfrageanteilen, kein Aufloesen ueber `..`. Alles andere beantwortet 404.
//
// ABWEICHUNG VOM ISSUE, GEMELDET: #474 nennt als einziges Ziel `modell://freistellen.onnx`.
// Das Modell ist aber nicht die einzige Datei, die der Renderer unter `file://` nicht
// laden kann - ONNX Runtime Web zieht seine WASM-Runtime nach (`ort-wasm-simd-threaded.wasm`,
// 14,8 MB). Sie ueber einen zweiten Kanal zu holen waere ein neuer IPC-Weg (in 9.21.8
// ausdruecklich ausgeschlossen), und sie als BASE64 in das JS-Buendel zu legen kostete
// ~19 MB Text im Renderer-Bundle. Deshalb dient dasselbe Schema ZWEI festen Namen; der
// Schutzgedanke des Issues (kein Pfad aus der Anfrage, keine Verzeichnisliste) bleibt
// unangetastet. Meldung im Abschlusskommentar.

import { protocol } from "electron";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CustomScheme } from "electron";

/** Das Schema. Als DATEN, nicht als Aufruf - `registerSchemesAsPrivileged` geht nur einmal. */
export const MODELL_SCHEMA: CustomScheme = {
  scheme: "modell",
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    stream: true,
    // Wie bei `marken://` GEMESSEN (22.10.2026): ohne dieses Recht blockiert Chromium
    // JEDEN fetch auf ein fremdes Schema ("Cross origin requests are only supported for
    // protocol schemes: ..."), noch bevor der Handler erreicht wird.
    corsEnabled: true,
  },
}

/** Der Modellname im Schema - der EINE Name aus #474. */
const MODELL_NAME = 'freistellen.onnx'
/** Der Name, den ONNX Runtime Web an `wasmPaths` haengt (Fassung 1.31.1, exakt gepinnt). */
const LAUFZEIT_NAME = 'ort-wasm-simd-threaded.wasm'
/**
 * Der LADER derselben Runtime. ONNX Runtime Web importiert ihn als ES-Modul von
 * `wasmPaths` - auch in der „bundle"-Fassung, weil der Bundler die Einbettung nur mit
 * seinem eigenen Define vornimmt. GEMESSEN am 13.11.2026: Ohne ihn meldet das Fenster
 * „cannot determine the script source URL" / CSP-Blockade, und das Freistellen ist
 * „nicht verfuegbar".
 */
const LADER_NAME = 'ort-wasm-simd-threaded.mjs'

/**
 * Die erlaubten Ziele: Name -> Inhaltstyp, und die Pfade, unter denen die Datei liegen
 * KANN. Zwei Kandidaten je Datei, weil Entwicklungslauf und gepackte App verschiedene
 * Wurzeln haben; genommen wird der erste, der lesbar ist. Kein Anfrageanteil ist beteiligt.
 */
const ZIELE: Record<string, { typ: string; pfade: () => string[] }> = {
  [MODELL_NAME]: {
    typ: 'application/octet-stream',
    // Entwicklungslauf: `public/` wird von Vite verbatim in den Renderer kopiert; die
    // Datei liegt dort im Projekt. Gepackt: `dist/renderer/`, also INNERHALB von
    // `app.asar` - `readFile` liest dort hinein (Electron patcht `fs`), und weil das
    // Modell nur gelesen wird, braucht es kein `asarUnpack`.
    pfade: () =>
      istEntwicklung()
        ? [path.join(wurzelOrdner(), 'public', 'modell', MODELL_NAME)]
        : [path.join(wurzelOrdner(), 'dist', 'renderer', 'modell', MODELL_NAME)],
  },
  [LADER_NAME]: {
    typ: 'text/javascript',
    pfade: () =>
      istEntwicklung()
        ? [path.join(wurzelOrdner(), 'node_modules', 'onnxruntime-web', 'dist', LADER_NAME)]
        : [path.join(wurzelOrdner(), 'dist', 'renderer', LADER_NAME)],
  },
  [LAUFZEIT_NAME]: {
    typ: 'application/wasm',
    // Die Runtime kommt aus dem Paket (devDependency, exakt gepinnt) und wird beim Build
    // in den Renderer-Ordner kopiert (`vite.config.ts`). Im Entwicklungslauf liegt sie
    // noch in `node_modules`.
    pfade: () =>
      istEntwicklung()
        ? [path.join(wurzelOrdner(), 'node_modules', 'onnxruntime-web', 'dist', LAUFZEIT_NAME)]
        : [path.join(wurzelOrdner(), 'dist', 'renderer', LAUFZEIT_NAME)],
  },
}

/**
 * Der Ordner des gebauten Renderers - GEMESSEN, nicht angenommen: `app.getAppPath()` ist
 * beim Start ueber `electron dist/main/index.cjs` selbst schon `dist/main` (13.11.2026 am
 * Fenster geprueft), taugt hier also nicht als Wurzel. Diese Datei liegt als
 * `dist/main/index.cjs` im selben Baum wie der Renderer, und `__dirname` zeigt genau
 * dorthin - im Entwicklungslauf wie im Paket (dort in `app.asar`). Eine Alternative mit
 * `process.resourcesPath` waere im ungepackten Lauf falsch.
 */
/**
 * Nur fuer Tests: die Wurzel ueberschreiben, unter der `public/`, `node_modules/` und
 * `dist/renderer/` liegen. Im Betrieb ist sie `path.join(__dirname, '..', '..')` - der
 * Ordner also, in dem `dist/main` und `dist/renderer` Geschwister sind (ungepackt wie im
 * `app.asar`). Dieselbe Bauart wie `vergissFreistellModell` im Renderer: ein benannter
 * Griff fuer den Pruefstand, kein zweiter Produktweg.
 */
let testWurzel: string | null = null

export function setzeModellWurzel(pfad: string | null): void {
  testWurzel = pfad
}

/** Der Ordner, unter dem `public/`, `node_modules/` und `dist/` liegen. */
function wurzelOrdner(): string {
  // `__dirname` gibt es nur im gebauten Main (CJS). Der Testbetrieb setzt `testWurzel`.
  return testWurzel ?? path.join(__dirname, '..', '..')
}

/**
 * Ist das ein Entwicklungslauf? DASSELBE Merkmal wie in `main/index.ts` (`devServerUrl`):
 * der Vite-Devserver setzt die Umgebungsvariable. Hier steht eine zweite Lesestelle, weil
 * die Reihenfolge der Kandidaten davon abhaengt - im Entwicklungslauf liegt das Modell in
 * `public/`, in der gepackten App in `dist/renderer/`. Eine Umgebungsvariable ist keine
 * zweite Wahrheit ueber den Pfad, sondern dasselbe Merkmal.
 */
function istEntwicklung(): boolean {
  return (process.env['VITE_DEV_SERVER_URL'] ?? '') !== ''
}


export function registriereModellProtokollHandler(): void {
  protocol.handle('modell', behandleModellAnfrage)
}

/**
 * Beantwortet eine Anfrage. Der Handler wirft NICHT: Ein abgelehntes Promise aus einem
 * `protocol.handle`-Rumpf ist eine unbehandelte Ablehnung im Main-Prozess - fuer ein
 * fehlendes Modell eine zu teuer bezahlte Instabilitaet (`marken-protokoll.ts`, gleiche
 * Begruendung).
 */
export async function behandleModellAnfrage(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return fehlerAntwort(405, 'Nur GET.')
  }

  const name = zielName(request.url)
  if (name === null) {
    return fehlerAntwort(404, 'Unbekanntes Ziel.')
  }
  const ziel = ZIELE[name]
  if (ziel === undefined) {
    return fehlerAntwort(404, 'Unbekanntes Ziel.')
  }

  for (const pfad of ziel.pfade()) {
    try {
      const puffer = await readFile(pfad)
      return new Response(puffer, {
        status: 200,
        headers: {
          'content-type': ziel.typ,
          // Wie bei `marken://`: In einem als `secure` angemeldeten Schema darf Chromium
          // den Typ nicht raten.
          'x-content-type-options': 'nosniff',
        },
      })
    } catch {
      // Naechster Kandidat. Alle erschoepft -> 404, ohne den Pfad zu nennen.
    }
  }
  return fehlerAntwort(404, 'Datei nicht gefunden.')
}

/**
 * `modell://<name>` -> `<name>`. KEINE Reparatur und kein Zurechtbiegen: Query, Fragment,
 * Anmeldedaten und Port haben in diesem Schema keine Bedeutung und werden abgewiesen;
 * alles, was nicht genau ein Pfadsegment auf der Wurzel ist, ebenso.
 */
function zielName(roh: string): string | null {
  let adresse: URL
  try {
    adresse = new URL(roh)
  } catch {
    return null
  }
  if (adresse.protocol !== 'modell:') return null
  if (
    adresse.search !== '' ||
    adresse.hash !== '' ||
    adresse.username !== '' ||
    adresse.password !== '' ||
    adresse.port !== ''
  ) {
    return null
  }
  // `modell://freistellen.onnx` ist bei einem `standard`-Schema eine Adresse mit HOST -
  // der Name steht also im Hostnamen, und der Pfad ist genau "/". Ein zusaetzliches
  // Pfadsegment (`modell://a/b.onnx`) ist damit kein anderer Name, sondern eine andere
  // Adresse: abgewiesen.
  if (adresse.pathname !== '/' && adresse.pathname !== '') return null
  // GENAU EINMAL dekodieren (dieselbe Begruendung wie in `marken-protokoll.ts`): ein
  // zweiter Durchgang machte aus `%252e` erst den Ausbruchsversuch.
  let name: string
  try {
    name = decodeURIComponent(adresse.hostname)
  } catch {
    return null
  }
  if (name === '') return null
  return name
}

/** Fehler reisen als Status, NIE als `Ergebnis<T>` - ein Protokoll ist kein IPC-Kanal. */
function fehlerAntwort(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  })
}
