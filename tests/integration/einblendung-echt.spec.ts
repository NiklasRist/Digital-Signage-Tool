import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #450 / M9: das Band eines Video-Elements gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT. Die Unit-Tests pruefen Zeichenketten. Die Zusage aus TK 9.2.8
// (v3.31) ist aber eine Lage im FERTIGEN Bild:
//
//   „Das Video wird wie gewohnt auf 1920 × 1080 normalisiert … Das Band
//    (1920 × H, deckend) wird unten überlagert (y = 1080 − H)."
//
// Nur eine Messung am Pixel kann das belegen. Ein Test, der `overlay` in der Kette
// liest, bliebe auch dann gruen, wenn `y` falsch berechnet waere.
//
// AUFBAU: Quellvideo BLAU (1920 × 1080), Band-PNG GRUEN (1920 × 162, deckend),
// Bandspur ueber #168, Filterkette ueber #165, Clip ueber #167 - alles mit den
// Argument-Arrays des PRODUKTIVCODES. Gemessen werden dann fuenf Punkte einer
// Spalte: knapp ueber der Bandkante, auf der Kante und knapp darunter.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad } = await import("../../src/main/ffmpeg-pfad");
const { fuehreFfmpegAus } = await import("../../src/main/ffmpeg-adapter/prozess");
const { baueBandspur } = await import("../../src/main/ffmpeg-adapter/bandspur");
const { baueEinblendungFilter } = await import(
  "../../src/main/ffmpeg-adapter/filter-einblendung"
);
const { baueVideoAusschnittArgumente } = await import(
  "../../src/main/ffmpeg-adapter/video-ausschnitt"
);
const { RENDER_PROFILE } = await import("../../src/shared/contracts/render-profile");

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-einblendung-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

const HOEHE_BAND = 162;
/** Die Bandoberkante im fertigen Bild - die Zahl, um die es geht. */
const BAND_Y = RENDER_PROFILE.hoehe - HOEHE_BAND;
const SPALTE_X = RENDER_PROFILE.breite / 2;

/** Ein 2-Sekunden-Quellvideo in Vollbildgroesse, flaechig blau. */
function erzeugeQuelle(): string {
  const ziel = path.join(arbeitsordner, "quelle.mp4");
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi",
      "-i", `color=c=blue:s=${String(RENDER_PROFILE.breite)}x${String(RENDER_PROFILE.hoehe)}:r=${String(RENDER_PROFILE.fps)}:d=2`,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      ziel,
    ],
    { stdio: "ignore" },
  );
  return ziel;
}

/** Ein DECKENDES Band-PNG 1920 x 162 in Gruen. */
function erzeugeBandPng(): string {
  const ziel = path.join(arbeitsordner, "band.png");
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi",
      "-i", `color=c=lime:s=${String(RENDER_PROFILE.breite)}x${String(HOEHE_BAND)}:d=1`,
      "-vf", "format=rgba",
      "-frames:v", "1",
      ziel,
    ],
    { stdio: "ignore" },
  );
  return ziel;
}

/** Die RGB-Werte EINES Bildpunkts eines bestimmten Bildes. */
function punkt(datei: string, y: number): [number, number, number] {
  const roh = execFileSync(
    ermittleFfmpegPfad(),
    [
      "-loglevel", "error",
      "-i", datei,
      "-vf", `select=eq(n\\,0),format=rgb24,crop=1:1:${String(SPALTE_X)}:${String(y)}`,
      "-fps_mode", "passthrough",
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ],
    { maxBuffer: 1024 * 1024 },
  );
  return [roh[0] ?? -1, roh[1] ?? -1, roh[2] ?? -1];
}

function istBlau(p: readonly number[]): boolean {
  return (p[2] ?? 0) > 150 && (p[0] ?? 0) < 80 && (p[1] ?? 0) < 80;
}

function istGruen(p: readonly number[]): boolean {
  return (p[1] ?? 0) > 150 && (p[0] ?? 0) < 80 && (p[2] ?? 0) < 80;
}

describe("#450 Band-Einblendung gegen echtes ffmpeg", () => {
  it(
    "das Video bleibt vollflaechig, das Band liegt DECKEND bei y = 1080 − H",
    async () => {
      const quelle = erzeugeQuelle();
      const bandPng = erzeugeBandPng();

      // Bandspur (#168): 60 Bilder aus einem Abschnitt von 60 Bildern.
      const bandSpur = path.join(arbeitsordner, "bandspur.mov");
      const spur = await baueBandspur(
        {
          abschnitte: [{ pngPfad: bandPng, frames: 60 }],
          hoeheBand: HOEHE_BAND,
          gesamtFrames: 60,
          sequenzPfad: path.join(arbeitsordner, "bandsequenz.mov"),
          zielPfad: bandSpur,
        },
        RENDER_PROFILE,
      );
      expect(spur.ok).toBe(true);

      const kette = baueEinblendungFilter(HOEHE_BAND, RENDER_PROFILE);
      expect(kette.ok).toBe(true);
      if (!kette.ok) return;

      const zielPfad = path.join(arbeitsordner, "clip.mp4");
      const gebaut = baueVideoAusschnittArgumente(
        {
          quellPfad: quelle,
          startFrame: 0,
          endFrame: 30,
          bandSpurPfad: bandSpur,
          filterkette: kette.wert,
          zielPfad,
        },
        RENDER_PROFILE,
      );
      expect(gebaut.ok).toBe(true);
      if (!gebaut.ok) return;

      const lauf = await fuehreFfmpegAus({ argumente: [...gebaut.wert] });
      expect(lauf.ok).toBe(true);

      // 1. DAS VIDEO IST DURCHGEHEND - auch direkt ueber der Bandkante.
      expect(istBlau(punkt(zielPfad, BAND_Y - 5))).toBe(true);
      // 2. DIE KANTE LIEGT EXAKT AUF 1080 − H: eine Zeile darueber Video, die
      //    Kante selbst schon Band.
      expect(istBlau(punkt(zielPfad, BAND_Y - 1))).toBe(true);
      expect(istGruen(punkt(zielPfad, BAND_Y))).toBe(true);
      // 3. UND DECKEND - das Bild unter dem Band scheint nirgends durch.
      expect(istGruen(punkt(zielPfad, BAND_Y + 5))).toBe(true);
      expect(istGruen(punkt(zielPfad, RENDER_PROFILE.hoehe - 1))).toBe(true);

      // Gegenprobe gegen ein blosses „alles ist gruen": Oberhalb der Kante ist
      // das Bild nachweislich NICHT gruen.
      expect(istGruen(punkt(zielPfad, 0))).toBe(false);
    },
    180_000,
  );
});
