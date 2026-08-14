import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #168: die Bandspur gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT. Der Unit-Test prueft Zeichenketten. Er kann deshalb genau die
// zwei Zusagen NICHT belegen, um derentwillen diese Datei existiert (das Issue sagt
// das selbst und weist sie hierher):
//   1. Hat die fertige Bandspur wirklich EXAKT `gesamtFrames` Bilder? Ist sie auch
//      nur eines zu kurz, endet das Band vor dem Video - bei `split` bleibt unten ein
//      schwarzer Streifen stehen, bei `einblendung` verschwindet das Band.
//   2. UEBERLEBT DER ALPHAKANAL? Wird die Bandspur in einem Format ohne Alpha
//      abgelegt, ist die Transparenz weg, BEVOR #165 sie ueberhaupt sieht - das Band
//      erscheint dann als deckender Kasten ueber dem Video. Der Fehler entstuende in
//      bandspur.ts und wuerde erst zwei Bausteine spaeter sichtbar.
// Beides haengt am echten Encoder und nicht an der Zeichenkette.
//
// Der Test faehrt die Argument-Arrays, die der PRODUKTIVCODE erzeugt - nicht von Hand
// getippte. Genau das schliesst die Luecke zwischen "am 14.08.2026 einmal gemessen"
// (die Werte im Kopf von bandspur.ts) und "gilt auch morgen noch".
//
// AUCH GEPRUEFT: Das Experiment aus dem STOPP-Block des Issues - kennt das
// mitgelieferte ffmpeg den qtrle-Encoder? Faellt er in einer kuenftigen
// ffmpeg-Fassung weg, wird dieser Test rot, statt dass es beim Kunden auffaellt.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import("../../src/main/ffmpeg-pfad");
const { baueBandspur } = await import("../../src/main/ffmpeg-adapter/bandspur");
const { RENDER_PROFILE } = await import("../../src/shared/contracts/render-profile");

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-bandspur-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

const HOEHE_BAND = 162;

/**
 * Ein Band-PNG mit ECHTEM Alphakanal.
 *
 * `colorchannelmixer=aa=<deckkraft>` senkt den Alphawert; ohne `format=rgba` davor
 * gaebe es keinen Kanal, den es senken koennte. Genau so sieht ein
 * Einblendungs-Band aus, das `template-canvas` liefert (TK 9.10.2).
 */
function erzeugeBandPng(name: string, farbe: string, deckkraft: number): string {
  const ziel = path.join(arbeitsordner, name);
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi",
      "-i", `color=c=${farbe}:s=1920x${String(HOEHE_BAND)}:d=1`,
      "-vf", `format=rgba,colorchannelmixer=aa=${String(deckkraft)}`,
      "-frames:v", "1",
      ziel,
    ],
    { stdio: "ignore" },
  );
  return ziel;
}

/** Ein einzelnes ffprobe-Feld des ersten Stroms. */
function stromFeld(datei: string, feld: string): string {
  return execFileSync(
    ermittleFfprobePfad(),
    [
      "-hide_banner", "-v", "error",
      "-select_streams", "v:0",
      "-count_frames",
      "-show_entries", `stream=${feld}`,
      "-of", "default=noprint_wrappers=1:nokey=1",
      datei,
    ],
    { encoding: "utf8" },
  ).trim();
}

/**
 * Die RGBA-Werte EINES Bildpunkts eines bestimmten Bildes.
 *
 * `select=eq(n\,<nummer>)` waehlt genau ein Bild aus, `crop=1:1:x:y` genau einen
 * Punkt, `rawvideo`/`rgba` gibt die vier Bytes unveraendert aus. Kein Encoder
 * dazwischen, der etwas glaetten koennte.
 */
function bildpunkt(datei: string, bildnummer: number): [number, number, number, number] {
  const roh = execFileSync(
    ermittleFfmpegPfad(),
    [
      "-loglevel", "error",
      "-i", datei,
      "-vf", `select=eq(n\\,${String(bildnummer)}),format=rgba,crop=1:1:10:10`,
      "-fps_mode", "passthrough",
      "-f", "rawvideo", "-pix_fmt", "rgba", "-",
    ],
    { maxBuffer: 1024 * 1024 },
  );
  return [roh[0] ?? -1, roh[1] ?? -1, roh[2] ?? -1, roh[3] ?? -1];
}

/** Rot oder Gruen - der Vergleich bleibt tolerant gegen ein Bit Rundung. */
function istRotHalbdeckend(punkt: readonly number[]): boolean {
  return (punkt[0] ?? 0) > 200 && (punkt[1] ?? 0) < 50 && Math.abs((punkt[3] ?? 0) - 128) <= 2;
}

function istGruenDeckend(punkt: readonly number[]): boolean {
  return (punkt[1] ?? 0) > 200 && (punkt[0] ?? 0) < 50 && (punkt[3] ?? 0) === 255;
}

describe("#168 Bandspur gegen echtes ffmpeg", () => {
  // A halbdeckend (Alpha 128), B deckend (Alpha 255). Der Unterschied ist der
  // ganze Punkt: Nur so faellt auf, wenn der Alphakanal unterwegs verloren geht.
  const pngA = erzeugeBandPng("band_a.png", "red", 0.5);
  const pngB = erzeugeBandPng("band_b.png", "lime", 1);

  const ABSCHNITT_A = 30;
  const ABSCHNITT_B = 15;
  const SEQUENZ = ABSCHNITT_A + ABSCHNITT_B; // 45

  function auftrag(gesamtFrames: number, kennung: string) {
    return {
      abschnitte: [
        { pngPfad: pngA, frames: ABSCHNITT_A },
        { pngPfad: pngB, frames: ABSCHNITT_B },
      ],
      hoeheBand: HOEHE_BAND,
      gesamtFrames,
      sequenzPfad: path.join(arbeitsordner, `sequenz_${kennung}.mov`),
      zielPfad: path.join(arbeitsordner, `spur_${kennung}.mov`),
    };
  }

  it(
    "liefert EXAKT gesamtFrames Bilder, wiederholt die Folge und behaelt den Alphakanal",
    async () => {
      const GESAMT = 120; // 2 volle Durchlaeufe (90) + 30 - bricht mitten in A ab
      const a = auftrag(GESAMT, "lang");

      // Der Fortschritt muss auch waehrend der Bandspur beim Leser ankommen - er
      // reist ueber den durchgereichten Rueckruf, nicht ueber ein eigenes Flag.
      const zeilen: string[] = [];
      const ergebnis = await baueBandspur(a, RENDER_PROFILE, {
        aufAusgabeZeile: (zeile) => zeilen.push(zeile),
      });

      expect(ergebnis.ok).toBe(true);

      // 1. DIE LAENGE. Ein Bild zu wenig, und das Band endet vor dem Video.
      expect(stromFeld(a.zielPfad, "nb_read_frames")).toBe(String(GESAMT));
      // Die Zwischendatei traegt die Folge GENAU EINMAL.
      expect(stromFeld(a.sequenzPfad, "nb_read_frames")).toBe(String(SEQUENZ));

      // 2. FLAECHE UND ZEITACHSE - die Bandspur muss die des Videos teilen.
      expect(stromFeld(a.zielPfad, "width")).toBe(String(RENDER_PROFILE.breite));
      expect(stromFeld(a.zielPfad, "height")).toBe(String(HOEHE_BAND));
      expect(stromFeld(a.zielPfad, "avg_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);
      expect(stromFeld(a.zielPfad, "codec_name")).toBe("qtrle");

      // 3. DER ALPHAKANAL - die Kernzusage. Das Pixelformat muss Alpha tragen
      //    (qtrle schreibt `argb`, ffprobe meldet beim Decodieren `bgra`; die
      //    beiden unterscheiden sich nur in der Byte-Reihenfolge). Ein Format wie
      //    `rgb24` oder `yuv420p` waere das Scheitern.
      expect(["argb", "rgba", "bgra", "abgr"]).toContain(stromFeld(a.zielPfad, "pix_fmt"));

      // 4. UND DER ALPHA-WERT UEBERLEBT WIRKLICH. Das ist die schaerfere Frage:
      //    Ein alphafaehiges Format allein nuetzt nichts, wenn der Wert auf 255
      //    hochgezogen wurde - das Band waere dann trotzdem ein deckender Kasten.
      expect(istRotHalbdeckend(bildpunkt(a.zielPfad, 0))).toBe(true);

      // 5. DIE WIEDERHOLUNG, an den Naehten gemessen. Periode 45.
      expect(istRotHalbdeckend(bildpunkt(a.zielPfad, ABSCHNITT_A - 1))).toBe(true); // 29 = A
      expect(istGruenDeckend(bildpunkt(a.zielPfad, ABSCHNITT_A))).toBe(true); //      30 = B
      expect(istGruenDeckend(bildpunkt(a.zielPfad, SEQUENZ - 1))).toBe(true); //      44 = B
      expect(istRotHalbdeckend(bildpunkt(a.zielPfad, SEQUENZ))).toBe(true); //        45 = A
      expect(istRotHalbdeckend(bildpunkt(a.zielPfad, GESAMT - 1))).toBe(true); //    119 = A

      // 6. Der Fortschritt kam an.
      expect(zeilen.length).toBeGreaterThan(0);
    },
    120_000,
  );

  it(
    "schneidet am Videoende ab, wenn die Folge LAENGER ist als das Video",
    async () => {
      // "Ist sie laenger, wird am Videoende abgeschnitten." (TK 9.2.8) - und es
      // gibt dafuer bewusst KEINEN Sonderpfad: Er liefe selten, waere deshalb
      // faktisch ungetestet und erzeugte eine zweite Art von Bandspur.
      const GESAMT = 20; // kuerzer als die Folge (45), bricht mitten in A ab
      const a = auftrag(GESAMT, "kurz");

      const ergebnis = await baueBandspur(a, RENDER_PROFILE);

      expect(ergebnis.ok).toBe(true);
      expect(stromFeld(a.zielPfad, "nb_read_frames")).toBe(String(GESAMT));
      // Nichts wurde auf ein Vielfaches der Folge aufgerundet - das verlaengerte
      // das Element und die Gesamtdauer stimmte nicht mehr mit dem composer.
      expect(istRotHalbdeckend(bildpunkt(a.zielPfad, GESAMT - 1))).toBe(true);
    },
    120_000,
  );

  it(
    "meldet einen ffmpeg-Fehlschlag unveraendert und startet Schritt 2 nicht",
    async () => {
      // Ein PNG, das es nicht gibt: Schritt 1 scheitert im echten ffmpeg. Der Code
      // muss UNVERAENDERT durchgereicht werden - die Verdichtung gehoert dem
      // render-service (TK 9.2.3).
      const a = auftrag(60, "fehlt");
      a.abschnitte[0] = { pngPfad: path.join(arbeitsordner, "gibt_es_nicht.png"), frames: 30 };

      const ergebnis = await baueBandspur(a, RENDER_PROFILE);

      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    },
    120_000,
  );
});
