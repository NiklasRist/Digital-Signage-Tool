import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #464: der Bildplan im Render, gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT - DIE EINE ZUSAGE, DIE EIN UNIT-TEST NICHT TRAGEN KANN:
// "Die Bildzahl ist die Dauer. Geschrieben wird auf die Summe aus 9.16.4 fest; es
// gibt keine Toleranz (9.2.6)." (TK 9.16.5) Ob eine Datei wirklich 300 Bilder hat,
// entscheidet der Encoder - nicht die Zeichenkette. Deshalb faehrt dieser Test das
// Argument-Array, das der PRODUKTIVCODE erzeugt, durch echtes ffmpeg und zaehlt die
// decodierten Bilder mit `-count_frames`.
//
// DIE ZWEITE ZUSAGE IST DIE REIHENFOLGE: Ein Plan, der 60 verschiedene Frames
// fuenfmal spielt, muss Bild 0 und Bild 60 GLEICH und Bild 0 und Bild 1
// VERSCHIEDEN zeigen. Eine Umsetzung, die nur den ersten Frame wiederholt, haette
// ebenfalls 300 Bilder - und waere trotzdem falsch. Verglichen wird deshalb die
// Farbe einer festen Bildstelle, nicht nur die Zahl (Einzelheiten bei `farbe`).
//
// GEGENPROBE: Dieselbe Kette OHNE das abschliessende `setpts=N/FRAME_RATE/TB`.
// Dann liegen die Einzelbild-Abschnitte auf demselben Zeitstempel, und der Encoder
// verwirft sie - es bleiben weniger als 300 Bilder. Genau diese Zeile traegt die
// Zusage; ohne die Gegenprobe waere der Test auch dann gruen, wenn etwas anderes
// die Bildzahl zufaellig richtig macht.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import("../../src/main/ffmpeg-pfad");
const { baueBildfolgeArgumente } = await import("../../src/main/ffmpeg-adapter/bildfolge");
const { RENDER_PROFILE } = await import("../../src/shared/contracts/render-profile");

// Der feste Vorspann aus #158 - nachgebildet wie in standbild-echt.spec.ts, weil
// dieser Test die ARGUMENTE von #464 misst und nicht die Prozessfuehrung von #158.
const FESTER_VORSPANN = [
  "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
  "-progress", "pipe:1", "-nostats",
];

const EINDEUTIGE_FRAMES = 60;
const WIEDERHOLUNGEN = 5;
const GESAMT_FRAMES = EINDEUTIGE_FRAMES * WIEDERHOLUNGEN;

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-bildfolge-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

/**
 * 60 VERSCHIEDENE Frames in einem Lauf - der bewegte Bildinhalt, den der Renderer
 * liefern wuerde. Bewusst VOLLFLAECHIGE Farben statt eines Testbilds: Der Vergleich
 * unten prueft, ob derselbe Frame an anderer Stelle WIRKLICH derselbe ist - und ein
 * verlustbehafteter Encoder reproduziert eine gleichmaessige Flaeche viel enger als
 * ein Testbild mit harten Kanten. Die Hue-Drehung macht jede der 60 Quellen
 * unterscheidbar.
 */
function erzeugeFrames(): string[] {
  const ziel = path.join(arbeitsordner, "frame-%03d.png");
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi",
      "-i", `color=c=red:s=${String(RENDER_PROFILE.breite)}x${String(RENDER_PROFILE.hoehe)}:r=30:d=2`,
      "-vf", "hue=H=2*PI*t",
      "-frames:v", String(EINDEUTIGE_FRAMES),
      // Der Bild-Muxer nummeriert sonst ab 1; die App nummeriert ab 000 (#464).
      "-start_number", "0",
      ziel,
    ],
    { stdio: "ignore" },
  );
  return Array.from({ length: EINDEUTIGE_FRAMES }, (_wert, i) =>
    path.join(arbeitsordner, `frame-${String(i).padStart(3, "0")}.png`),
  );
}

/** Das Argument-Array aus dem Produktivcode - 60 Frames, fuenfmal gespielt. */
function argumente(pngPfade: string[], zielPfad: string): string[] {
  const gebaut = baueBildfolgeArgumente(
    {
      laeufe: [{ pngPfade, wiederholungen: WIEDERHOLUNGEN }],
      gesamtFrames: GESAMT_FRAMES,
      zielPfad,
    },
    RENDER_PROFILE,
  );
  if (!gebaut.ok) throw new Error(`Argumente abgewiesen: ${gebaut.fehler.meldung}`);
  return gebaut.wert;
}

/** Ein Lauf mit FRIST - wie in standbild-echt.spec.ts, damit ein Haenger auffaellt. */
function lauf(
  argumenteOhneVorspann: readonly string[],
  fristMs: number,
): Promise<{ code: number | null; signal: NodeJS.Signals | null; dauerMs: number; stderr: string }> {
  const begonnen = Date.now();
  return new Promise((fertig) => {
    const kind = spawn(ermittleFfmpegPfad(), [...FESTER_VORSPANN, ...argumenteOhneVorspann], {
      windowsHide: true,
    });
    let stderr = "";
    kind.stderr.on("data", (stueck: Buffer) => {
      stderr += stueck.toString("utf8");
    });
    // stdout leeren - sonst blockiert der Kindprozess an `-progress`.
    kind.stdout.on("data", () => {});
    const frist = setTimeout(() => {
      kind.kill("SIGTERM");
    }, fristMs);
    const netz = setTimeout(() => {
      kind.kill("SIGKILL");
    }, fristMs + 2_000);
    kind.on("close", (code, signal) => {
      clearTimeout(frist);
      clearTimeout(netz);
      fertig({ code, signal, dauerMs: Date.now() - begonnen, stderr: stderr.trim() });
    });
  });
}

/** Die TATSAECHLICH decodierten Bilder - gezaehlt, nicht aus dem Kopf gelesen. */
function zaehleBilder(datei: string): number {
  const ausgabe = execFileSync(
    ermittleFfprobePfad(),
    [
      "-hide_banner", "-v", "error",
      "-select_streams", "v:0",
      "-count_frames",
      "-show_entries", "stream=nb_read_frames",
      "-of", "default=noprint_wrappers=1:nokey=1",
      datei,
    ],
    { encoding: "utf8" },
  ).trim();
  return Number(ausgabe);
}

/** Ein einzelnes Stromfeld, fuer die Uniformitaets-Probe. */
function stromFeld(datei: string, strom: string, feld: string): string {
  return execFileSync(
    ermittleFfprobePfad(),
    [
      "-hide_banner", "-v", "error",
      "-select_streams", strom,
      "-show_entries", `stream=${feld}`,
      "-of", "default=noprint_wrappers=1:nokey=1",
      datei,
    ],
    { encoding: "utf8" },
  ).trim();
}

/**
 * Die drei Farbwerte EINES decodierten Bildes an einer festen Stelle.
 *
 * WARUM NICHT DER FRAME-HASH: Der Encoder ist verlustbehaftet. Derselbe Quellframe
 * kann an anderer Stelle im GOP ein paar Werte anders reproduziert werden - ein
 * Hash-Vergleich wuerde dann eine richtige Folge als falsch melden. Gemessen am
 * 09.11.2026: Bild 0 und Bild 60 hatten verschiedene Hashes bei gleichem Quellbild.
 * Die Farbe einer vollflaechigen Flaeche ist dagegen stabil; verglichen wird mit
 * Toleranz.
 */
function farbe(datei: string, bild: number): [number, number, number] {
  const roh = execFileSync(
    ermittleFfmpegPfad(),
    [
      "-hide_banner", "-v", "error",
      "-i", datei,
      "-vf", `select=eq(n\\,${String(bild)}),format=rgb24,crop=1:1:960:540`,
      "-frames:v", "1",
      "-pix_fmt", "rgb24",
      "-f", "rawvideo",
      "-",
    ],
    { maxBuffer: 1024 },
  );
  return [roh[0] ?? -1, roh[1] ?? -1, roh[2] ?? -1];
}

describe("Bildfolge gegen das echte ffmpeg (#464, TK 9.16.5)", () => {
  it(
    "hat exakt dauer x 30 Bilder und spielt die Folge in der richtigen Reihenfolge",
    async () => {
      const frames = erzeugeFrames();
      const ziel = path.join(arbeitsordner, "seg_0007.mp4");

      const ergebnis = await lauf(argumente(frames, ziel), 180_000);

      expect(ergebnis.signal).toBeNull();
      expect(ergebnis.code, ergebnis.stderr).toBe(0);
      expect(ergebnis.stderr).toBe("");

      // DIE BILDZAHL IST DIE DAUER (TK 9.16.5).
      expect(zaehleBilder(ziel)).toBe(GESAMT_FRAMES);
      expect(Number(stromFeld(ziel, "v:0", "duration"))).toBeCloseTo(10, 3);

      // Die Folge wiederholt sich: Bild 0 = Bild 60 = Bild 120 ... (mit Toleranz,
      // weil der Encoder verlustbehaftet ist).
      const erste = farbe(ziel, 0);
      for (const versatz of [60, 120, 180, 240]) {
        const spaeter = farbe(ziel, versatz);
        for (const kanal of [0, 1, 2] as const) {
          expect(Math.abs(spaeter[kanal] - erste[kanal])).toBeLessThanOrEqual(4);
        }
      }
      // ... und die Frames innerhalb der Schleife sind NICHT alle gleich - sonst
      // waere "Bewegung" nur ein Standbild mit 300 Kopien.
      const zweiter = farbe(ziel, 1);
      const abstand =
        Math.abs(zweiter[0] - erste[0]) +
        Math.abs(zweiter[1] - erste[1]) +
        Math.abs(zweiter[2] - erste[2]);
      expect(abstand).toBeGreaterThan(10);
    },
    240_000,
  );

  it(
    "erfuellt die Uniformitaets-Voraussetzung von concat (TK 9.2.6)",
    () => {
      const datei = path.join(arbeitsordner, "seg_0007.mp4");

      expect(stromFeld(datei, "v:0", "width")).toBe(String(RENDER_PROFILE.breite));
      expect(stromFeld(datei, "v:0", "height")).toBe(String(RENDER_PROFILE.hoehe));
      expect(stromFeld(datei, "v:0", "pix_fmt")).toBe(RENDER_PROFILE.pixelformat);
      expect(stromFeld(datei, "v:0", "r_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);
      expect(stromFeld(datei, "v:0", "avg_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);
      expect(stromFeld(datei, "v:0", "sample_aspect_ratio")).toBe(RENDER_PROFILE.sar);
      expect(stromFeld(datei, "v:0", "codec_name")).toBe(RENDER_PROFILE.videoCodec);

      // Die stille Tonspur ist Pflicht: Fehlt sie einem Zwischenclip, bricht
      // `concat` NICHT ab - der Ton hoert nur mitten im Video auf (gemessen #162).
      expect(stromFeld(datei, "a:0", "codec_name")).toBe(RENDER_PROFILE.audio.codec);
      expect(stromFeld(datei, "a:0", "sample_rate")).toBe(
        String(RENDER_PROFILE.audio.sampleRateHz),
      );
      expect(stromFeld(datei, "a:0", "channels")).toBe(String(RENDER_PROFILE.audio.kanaele));
    },
    60_000,
  );

  it(
    "GEGENPROBE: ohne das abschliessende setpts verwirft der Encoder Bilder",
    async () => {
      // Die eine Zeile, an der die Bildzahl haengt, wird entfernt - alles andere
      // bleibt gleich. GEMESSEN am 09.11.2026: 243 statt 300 Bilder. Bliebe der Test
      // oben trotzdem gruen, traege diese Zeile nichts.
      const frames = erzeugeFrames();
      const ziel = path.join(arbeitsordner, "ohne-setpts.mp4");
      const voll = argumente(frames, ziel);

      const stelle = voll.indexOf("-filter_complex");
      expect(stelle).toBeGreaterThan(-1);
      const kette = voll[stelle + 1] ?? "";
      expect(kette).toContain("setpts=N/FRAME_RATE/TB");
      const ohne = [...voll];
      ohne[stelle + 1] = kette.replaceAll("setpts=N/FRAME_RATE/TB,", "");

      const ergebnis = await lauf(ohne, 180_000);
      expect(ergebnis.code, ergebnis.stderr).toBe(0);

      const bilder = zaehleBilder(ziel);
      expect(bilder).toBeLessThan(GESAMT_FRAMES);
    },
    240_000,
  );
});
