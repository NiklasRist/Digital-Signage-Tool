import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #166: das Standbild-Argument-Array gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT - DIE TERMINIERUNGS-ZUSAGE. Dieser Aufruf hat ZWEI
// UNBEGRENZTE EINGAENGE: das mit `-loop 1` unbegrenzt wiederholte Standbild und
// die endlose `anullsrc`-Stille aus #162. Er endet ALLEIN deshalb, weil
// `-frames:v` die Videospur hart begrenzt und `-shortest` (aus #162) die Ausgabe
// mit dem kuerzesten Strom beendet.
//
// TRIFFT DIESE ZUSAGE NICHT ZU, ENDET DER PROZESS NIE. #158 hat bewusst KEIN
// Timeout ("Keine Zeitgrenze: Ein Renderlauf darf legitim viele Minuten dauern"),
// der Auftrag bliebe fuer immer auf "laeuft", und danach steht die GESAMTE
// Warteschlange still - kein Import, kein Loeschen, kein Export -, bis die App
// neu gestartet wird. Scheitert dieser Test, ist das zu MELDEN: Die Abhilfe waere
// eine Laengenbegrenzung des `anullsrc`-Eingangs, und die gehoert #162, nicht
// #166.
//
// Ein Unit-Test kann das grundsaetzlich nicht sagen: Ob eine Ausgabe endet,
// entscheidet der echte Encoder, nicht die Zeichenkette. Dasselbe gilt fuer die
// zweite Zusage, die hier haengt - dass die Datei EXAKT `frames` Bilder hat, denn
// "ein Aktions-Segment mit 10 s Anzeigedauer muss exakt 300 Frames haben, nicht
// 299 und nicht 301" (#166).
//
// Der Test faehrt das Argument-Array, das der PRODUKTIVCODE erzeugt, und die
// Filterkette, die #163 erzeugt - nichts davon ist von Hand getippt. Genau das
// schliesst die Luecke zwischen "am 14.08.2026 einmal gemessen" (die Werte im
// Kopf von standbild.ts) und "gilt auch morgen noch".

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import("../../src/main/ffmpeg-pfad");
const { baueStandbildArgumente } = await import("../../src/main/ffmpeg-adapter/standbild");
const { baueVollbildFilter } = await import("../../src/main/ffmpeg-adapter/filter-vollbild");
const { RENDER_PROFILE } = await import("../../src/shared/contracts/render-profile");

// Der feste Vorspann aus #158. Er wird hier NACHGEBILDET statt `fuehreFfmpegAus`
// zu rufen, weil dieser Test die ARGUMENTE von #166 misst und nicht die
// Prozessfuehrung von #158 (die hat ihre eigenen Tests). Waere er falsch
// abgeschrieben, faellt es sofort auf: `-y` fehlt -> ffmpeg fragt nach und
// haengt.
const FESTER_VORSPANN = [
  "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
  "-progress", "pipe:1", "-nostats",
];

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-standbild-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

/**
 * Ein Standbild, das NICHT 16:9 ist.
 *
 * Absicht: So entstehen im Zwischenclip die schwarzen Balken (Letterbox), und die
 * Messung laeuft nicht am realistischen Fall vorbei - ein Segment-PNG aus
 * `template-canvas` ist zwar 1920x1080, ein importiertes Bild (FA-01) aber
 * beliebig.
 */
function erzeugeStandbild(name: string): string {
  const ziel = path.join(arbeitsordner, name);
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi", "-i", "color=c=red:s=800x800:d=1",
      "-frames:v", "1",
      ziel,
    ],
    { stdio: "ignore" },
  );
  return ziel;
}

/** Die echte Filterkette aus #163 - diese Datei baut keine eigene. */
function filterkette(): string {
  const kette = baueVollbildFilter("black", RENDER_PROFILE);
  if (!kette.ok) throw new Error(`Filterkette (#163) abgewiesen: ${kette.fehler.meldung}`);
  return kette.wert;
}

/** Das Argument-Array aus dem Produktivcode. */
function argumente(bildPfad: string, frames: number, zielPfad: string): string[] {
  const gebaut = baueStandbildArgumente(
    { bildPfad, frames, filterkette: filterkette(), zielPfad },
    RENDER_PROFILE,
  );
  if (!gebaut.ok) throw new Error(`Argumente abgewiesen: ${gebaut.fehler.meldung}`);
  return gebaut.wert;
}

/**
 * Ein Lauf mit FRIST.
 *
 * Die Frist ist das Messinstrument, nicht die Loesung: Sie ist genau der Grund,
 * warum dieser Test die Terminierungs-Zusage ueberhaupt pruefen KANN. In der
 * Anwendung gibt es sie nicht (#158 setzt bewusst keine).
 */
function lauf(argumenteOhneVorspann: readonly string[], fristMs: number) {
  const begonnen = Date.now();
  const ergebnis = spawnSync(
    ermittleFfmpegPfad(),
    [...FESTER_VORSPANN, ...argumenteOhneVorspann],
    { timeout: fristMs, encoding: "utf8", windowsHide: true },
  );
  return {
    code: ergebnis.status,
    signal: ergebnis.signal,
    dauerMs: Date.now() - begonnen,
    stderr: (ergebnis.stderr ?? "").trim(),
  };
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

describe("Standbild-Zwischenclip gegen das echte ffmpeg", () => {
  it("hat mit den ECHTEN Fragmenten genau zwei -map-Argumente, Video vor Ton", () => {
    // Diese eine Zusage kann der Unit-Test nicht pruefen: Dort sind #161/#162
    // Attrappen, das zweite `-map` kommt also gar nicht als solches vor. Hier
    // laufen die echten Module - und "genau zwei" ist die Bedingung dafuer, dass
    // der Clip eine Video- UND eine Tonspur bekommt und der Quellton wegfaellt.
    const a = argumente("/t1/seg.png", 300, "/t1/seg.mp4");
    const gemappt = a.flatMap((wert, i) => (wert === "-map" ? [a[i + 1]] : []));
    expect(gemappt).toEqual(["[v]", "1:a:0"]);
  });


  it(
    "endet von selbst und hat exakt 300 Bilder (10 s bei 30 fps)",
    () => {
      const bild = erzeugeStandbild("motiv.png");
      const ziel = path.join(arbeitsordner, "seg_0300.mp4");

      // Die Frist ist grosszuegig gegen die gemessenen ~8 s und trotzdem endlich:
      // Laeuft der Prozess hinein, ist die Terminierungs-Zusage gebrochen.
      const ergebnis = lauf(argumente(bild, 300, ziel), 90_000);

      expect(ergebnis.signal).toBeNull();
      expect(ergebnis.code).toBe(0);
      expect(ergebnis.stderr).toBe("");
      expect(zaehleBilder(ziel)).toBe(300);
    },
    120_000,
  );

  it(
    "trifft auch die Raender des Dauerbereichs genau",
    () => {
      const bild = erzeugeStandbild("motiv2.png");
      // 1 Bild ist die vertragliche Mindestlaenge dieser Funktion; 1350 Bilder
      // sind 45 s, das obere Ende des zulaessigen Dauerbereichs (4.4).
      for (const frames of [1, 1350]) {
        const ziel = path.join(arbeitsordner, `seg_${String(frames)}.mp4`);
        const ergebnis = lauf(argumente(bild, frames, ziel), 120_000);
        expect(ergebnis.signal).toBeNull();
        expect(ergebnis.code).toBe(0);
        expect(zaehleBilder(ziel)).toBe(frames);
      }
    },
    240_000,
  );

  it(
    "GEGENPROBE: ohne -frames:v endet derselbe Lauf NICHT",
    () => {
      // Ohne diesen Nachweis waere der Test oben wertlos: Er koennte auch dann
      // gruen sein, wenn irgendetwas anderes den Lauf beendet. Hier wird die
      // eine Zeile herausgenommen, an der die Zusage haengt - und der Prozess
      // laeuft, bis die Frist ihn toetet.
      const bild = erzeugeStandbild("motiv3.png");
      const ziel = path.join(arbeitsordner, "endlos.mp4");
      const volle = argumente(bild, 300, ziel);
      const stelle = volle.indexOf("-frames:v");
      expect(stelle).toBeGreaterThan(-1);
      const ohne = [...volle.slice(0, stelle), ...volle.slice(stelle + 2)];

      const ergebnis = lauf(ohne, 15_000);

      // Vom Signal getoetet, nicht selbst beendet.
      expect(ergebnis.signal).not.toBeNull();
      expect(ergebnis.code).toBeNull();
    },
    60_000,
  );

  it(
    "erfuellt die Uniformitaets-Voraussetzung von concat (TK 9.2.6)",
    () => {
      // "Alle seg_*.mp4 muessen IDENTISCHE Parameter tragen (Codec, Profil,
      // Aufloesung, fps, Zeitbasis, Pixelformat, Streamlayout)." (TK 9.2.6)
      // Geprueft wird an der Datei aus dem ersten Fall, damit hier kein
      // zusaetzlicher Lauf noetig ist.
      const datei = path.join(arbeitsordner, "seg_0300.mp4");

      // Je Feld ein eigener Aufruf: ffprobe trennt mehrere Felder mit dem
      // Zeilenende der PLATTFORM, ein Vergleich gegen "\n" schluege auf Windows
      // fehl und auf macOS nicht.
      expect(stromFeld(datei, "v:0", "width")).toBe(String(RENDER_PROFILE.breite));
      expect(stromFeld(datei, "v:0", "height")).toBe(String(RENDER_PROFILE.hoehe));
      expect(stromFeld(datei, "v:0", "pix_fmt")).toBe(RENDER_PROFILE.pixelformat);
      expect(stromFeld(datei, "v:0", "r_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);
      expect(stromFeld(datei, "v:0", "avg_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);
      expect(stromFeld(datei, "v:0", "sample_aspect_ratio")).toBe(RENDER_PROFILE.sar);
      expect(stromFeld(datei, "v:0", "codec_name")).toBe(RENDER_PROFILE.videoCodec);

      // DIE STILLE TONSPUR MUSS DA SEIN. Fehlt sie einem einzigen Zwischenclip,
      // bricht `concat` NICHT ab - es entsteht eine Datei, deren Ton irgendwo in
      // der Mitte aufhoert (nachgemessen in #162).
      expect(stromFeld(datei, "a:0", "codec_name")).toBe(RENDER_PROFILE.audio.codec);
      expect(stromFeld(datei, "a:0", "sample_rate")).toBe(
        String(RENDER_PROFILE.audio.sampleRateHz),
      );
      expect(stromFeld(datei, "a:0", "channels")).toBe(String(RENDER_PROFILE.audio.kanaele));
    },
    60_000,
  );
});
