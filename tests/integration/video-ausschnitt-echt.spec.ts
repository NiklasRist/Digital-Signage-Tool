import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #167: der Video-Ausschnitt gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT. Der Unit-Test prueft Zeichenketten. Er kann deshalb genau die
// zwei Zusagen NICHT belegen, um derentwillen diese Datei existiert - das Issue
// sagt das selbst und weist sie hierher:
//
//   1. ENDET DER LAUF VON SELBST? Der Aufruf enthaelt mit `anullsrc` einen
//      UNBEGRENZTEN Eingang. Er endet ALLEIN deshalb, weil `-frames:v` die
//      Videospur hart begrenzt und `-shortest` (aus #162) die Ausgabe mit dem
//      kuerzesten Strom beendet. Trifft das nicht zu, endet der Prozess NIE:
//      #158 hat bewusst KEIN Timeout, der Auftrag bliebe fuer immer auf "laeuft",
//      und danach steht die GANZE Warteschlange still, bis die App neu gestartet
//      wird. (Scheitert dieser Test: MELDEN. Die Abhilfe waere eine
//      Laengenbegrenzung des `anullsrc`-Eingangs, und die gehoert #162.)
//
//   2. BEGINNT DER SCHNITT AM GEWUENSCHTEN BILD? Das ist die eigentliche Frage
//      dieses Issues, und sie ist NUR AM BILDINHALT zu beantworten. Beim
//      M6-Prueflauf stand `-ss` hier ZWISCHEN zwei `-i` und war damit die
//      Eingangs-Option des FALSCHEN Eingangs: Das Quellvideo begann bei Bild 0,
//      `-frames:v` sorgte trotzdem fuer die richtige Bildzahl - RICHTIGE LAENGE,
//      FALSCHER INHALT, Exit-Code 0, keine Warnung. Eine Abnahme, die die Dauer
//      misst, kann diesen Fehler GRUNDSAETZLICH nicht finden.
//
// DIE QUELLE IST DESHALB EIGENS DAFUER GEBAUT:
//   - JEDES BILD TRAEGT SEINE NUMMER. `geq=lum='16+N'` faerbt Bild n flaechig mit
//     dem Luma-Wert 16+n. Aus einem Bildpunkt des fertigen Clips laesst sich also
//     ablesen, WELCHES Quellbild dort steht.
//   - EIN EINZIGES SCHLUESSELBILD, bei Bild 0 (`-g 300 -keyint_min 300
//     -sc_threshold 0`), also ein Abstand von 7,3 s. Nur so eine Quelle - wie sie
//     Handy-Aufnahmen und Streaming-Downloads mitbringen - macht ein
//     keyframe-approximatives Suchen ueberhaupt sichtbar. Bei einer Quelle mit
//     Schluesselbild im Sekundentakt liefe auch ein falscher Aufruf gruen durch.
//
// Gefahren wird das Array, das der PRODUKTIVCODE erzeugt, ueber `fuehreFfmpegAus`
// (#158) - also genau der Weg, den der `render-service` spaeter nimmt, samt festem
// Vorspann.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad, ermittleFfprobePfad } = await import("../../src/main/ffmpeg-pfad");
const { fuehreFfmpegAus } = await import("../../src/main/ffmpeg-adapter/prozess");
const { baueVideoAusschnittArgumente } = await import(
  "../../src/main/ffmpeg-adapter/video-ausschnitt"
);
const { baueVollbildFilter } = await import("../../src/main/ffmpeg-adapter/filter-vollbild");
const { RENDER_PROFILE } = await import("../../src/shared/contracts/render-profile");

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-ausschnitt-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

/** So viele Bilder hat die Quelle. Bei `16+N` bleibt der Luma-Wert damit unter 236. */
const QUELL_BILDER = 220;

/**
 * Die Quelle mit LANGEM Schluesselbild-Abstand und einer Bildnummer in jedem Bild.
 *
 * 16:9, damit die Filterkette aus #163 sie ohne Balken einpasst - sonst laege der
 * gemessene Bildpunkt womoeglich im schwarzen Rand statt im Bild.
 */
function erzeugeQuelle(): string {
  const ziel = path.join(arbeitsordner, "quelle.mp4");
  execFileSync(
    ermittleFfmpegPfad(),
    [
      "-y", "-loglevel", "error",
      "-f", "lavfi",
      "-i", `color=c=black:s=320x180:r=${String(RENDER_PROFILE.fps)}:d=10`,
      "-vf", "geq=lum='16+N':cb=128:cr=128,format=yuv420p",
      "-c:v", "libx264",
      // Ein Schluesselbild, sonst keines.
      "-g", "300", "-keyint_min", "300", "-sc_threshold", "0",
      "-frames:v", String(QUELL_BILDER),
      ziel,
    ],
    { stdio: "ignore" },
  );
  return ziel;
}

/** Ein einzelnes ffprobe-Feld des ersten Videostroms. */
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
 * Der Luma-Wert EINES Bildpunkts eines bestimmten Bildes - die abgelesene
 * Bildnummer.
 *
 * `select=eq(n\,<nummer>)` waehlt genau ein Bild, `crop=1:1:x:y` genau einen Punkt,
 * `rawvideo`/`gray` gibt das Byte unveraendert aus. `format=gray` MUSS vor dem
 * `crop` stehen: Auf `yuv420p` hat eine 1x1-Flaeche keine Chroma-Ebene mehr, und
 * ffmpeg bricht mit "non positive size" ab.
 *
 * Der Wert ist NICHT direkt die Bildnummer - die Wandlung von begrenztem in vollen
 * Wertebereich streckt ihn. Das ist gleichgueltig: Verglichen wird immer MESSUNG
 * GEGEN MESSUNG, also der Wert im Clip gegen den Wert derselben Ablesung an der
 * Quelle. So steckt in der Zusage keine einzige gerechnete Annahme.
 */
function bildmarke(datei: string, bildnummer: number, x: number, y: number): number {
  const roh = execFileSync(
    ermittleFfmpegPfad(),
    [
      "-loglevel", "error",
      "-i", datei,
      "-vf", `select=eq(n\\,${String(bildnummer)}),format=gray,crop=1:1:${String(x)}:${String(y)}`,
      "-fps_mode", "passthrough",
      "-f", "rawvideo", "-pix_fmt", "gray", "-",
    ],
    { maxBuffer: 1024 * 1024 },
  );
  return roh[0] ?? -1;
}

const MITTE_X = RENDER_PROFILE.breite / 2;
const MITTE_Y = RENDER_PROFILE.hoehe / 2;

/** Die Bildmarke der QUELLE - die 320x180 grosse Datei, gemessen in ihrer Mitte. */
function quellMarke(quelle: string, bildnummer: number): number {
  return bildmarke(quelle, bildnummer, 160, 90);
}

/** Die Bildmarke eines fertigen CLIPS - 1920x1080, gemessen in der Mitte. */
function clipMarke(clip: string, bildnummer: number): number {
  return bildmarke(clip, bildnummer, MITTE_X, MITTE_Y);
}

function kette(): string {
  const ergebnis = baueVollbildFilter("black", RENDER_PROFILE);
  if (!ergebnis.ok) throw new Error(`Filterkette (#163) scheiterte: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

describe("#167 Video-Ausschnitt gegen echtes ffmpeg", () => {
  const quelle = erzeugeQuelle();

  it("baut eine Quelle mit genau EINEM Schluesselbild - sonst sagt der Test nichts", () => {
    // Ohne diese Zusicherung waere der Inhaltstest unten wertlos: Bei kurzen
    // Schluesselbild-Abstaenden liefert auch ein keyframe-approximatives Suchen
    // zufaellig das richtige Bild.
    const schluesselbilder = execFileSync(
      ermittleFfprobePfad(),
      [
        "-hide_banner", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "frame=key_frame",
        "-of", "csv=p=0",
        quelle,
      ],
      { encoding: "utf8" },
    )
      .trim()
      .split(/\r?\n/)
      .filter((z) => z.trim() === "1");

    expect(stromFeld(quelle, "nb_read_frames")).toBe(String(QUELL_BILDER));
    expect(schluesselbilder).toHaveLength(1);
  });

  it(
    "endet von selbst und liefert EXAKT endFrame - startFrame Bilder, ab dem RICHTIGEN Bild",
    async () => {
      const START = 45;
      const ENDE = 165;
      const ANZAHL = ENDE - START; // 120
      const zielPfad = path.join(arbeitsordner, "seg_richtig.mp4");

      const gebaut = baueVideoAusschnittArgumente(
        {
          quellPfad: quelle,
          startFrame: START,
          endFrame: ENDE,
          bandSpurPfad: null,
          filterkette: kette(),
          zielPfad,
        },
        RENDER_PROFILE,
      );
      expect(gebaut.ok).toBe(true);
      if (!gebaut.ok) return;

      // ZUSAGE 1 - Terminierung. Es gibt hier bewusst keine eigene Frist: Genau das
      // ist die Aussage. Bliebe der Lauf haengen, liefe dieser Test in die
      // Zeitgrenze des Testlaufs und waere rot - so, wie es der Auftrag im
      // Betrieb auch waere.
      const lauf = await fuehreFfmpegAus({ argumente: [...gebaut.wert] });
      expect(lauf.ok).toBe(true);

      // ZUSAGE 2 - die Bildzahl ist EXAKT, nicht ungefaehr. "Die effektive
      // Elementdauer ist damit `(endFrame − startFrame) / 30`." (TK 9.2.6)
      expect(stromFeld(zielPfad, "nb_read_frames")).toBe(String(ANZAHL));
      expect(stromFeld(zielPfad, "avg_frame_rate")).toBe(`${String(RENDER_PROFILE.fps)}/1`);

      // ZUSAGE 3 - DER INHALT. Das ist die Zeile, die den historischen Fehler
      // gefunden haette und die eine Dauerpruefung niemals findet.
      // Verglichen wird Messung gegen Messung: Bild 0 des Clips muss dasselbe
      // Bild sein wie Bild 45 der Quelle.
      expect(clipMarke(zielPfad, 0)).toBe(quellMarke(quelle, START));
      expect(clipMarke(zielPfad, ANZAHL - 1)).toBe(quellMarke(quelle, ENDE - 1));

      // ... und AUSDRUECKLICH NICHT bei Bild 0 der Quelle. Ohne diese Zeile
      // koennte die obige gruen sein, weil beide Marken zufaellig gleich sind.
      expect(clipMarke(zielPfad, 0)).not.toBe(quellMarke(quelle, 0));

      // FRAMEGENAU heisst: nicht das Nachbarbild. Beide Nachbarn sind an ihrer
      // Marke unterscheidbar, sonst waere die Zusage "framegenau" nicht pruefbar.
      expect(quellMarke(quelle, START - 1)).not.toBe(quellMarke(quelle, START));
      expect(quellMarke(quelle, START + 1)).not.toBe(quellMarke(quelle, START));
      expect(clipMarke(zielPfad, 0)).not.toBe(quellMarke(quelle, START - 1));
      expect(clipMarke(zielPfad, 0)).not.toBe(quellMarke(quelle, START + 1));
    },
    180_000,
  );

  it(
    "GEGENPROBE: -ss ZWISCHEN zwei -i liefert die richtige Laenge und den FALSCHEN Inhalt",
    async () => {
      // Diese Probe baut den historischen Fehler von Hand nach - sie prueft NICHT
      // den Produktivcode, sondern belegt, dass die Pruefung oben ueberhaupt etwas
      // finden KANN. Ohne sie waere "Bild 0 des Clips ist Quellbild 45" eine
      // Behauptung ueber einen Fehler, den niemand je gesehen hat.
      //
      // Erwartet wird: gleiche Bildzahl, gleiche Dauer, Exit-Code 0, KEINE
      // Fehlermeldung - und Inhalt ab Bild 0. Genau das ist "stumm falsch".
      const START = 45;
      const ANZAHL = 120;
      const zielPfad = path.join(arbeitsordner, "seg_falsch.mp4");
      const startZeit = ((START - 0.25) / RENDER_PROFILE.fps).toFixed(6);

      const falschGestellt = [
        "-i", quelle,
        // HIER liegt der Fehler: Das naechste `-i` folgt noch, also gehoert dieses
        // `-ss` zur STILLEN TONQUELLE - nicht zum Video.
        "-ss", startZeit,
        "-f", "lavfi",
        "-i", `anullsrc=channel_layout=mono:sample_rate=${String(RENDER_PROFILE.audio.sampleRateHz)}`,
        "-filter_complex", kette(),
        "-map", "[v]",
        "-map", "1:a:0",
        "-frames:v", String(ANZAHL),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(RENDER_PROFILE.fps),
        "-c:a", "aac", "-shortest",
        "-f", "mp4", zielPfad,
      ];

      const lauf = await fuehreFfmpegAus({ argumente: falschGestellt });

      // Kein Fehler. Das ist der ganze Punkt.
      expect(lauf.ok).toBe(true);
      // Richtige Laenge.
      expect(stromFeld(zielPfad, "nb_read_frames")).toBe(String(ANZAHL));
      // FALSCHER Inhalt: Das Video wurde nicht vorgespult.
      expect(clipMarke(zielPfad, 0)).toBe(quellMarke(quelle, 0));
      expect(clipMarke(zielPfad, 0)).not.toBe(quellMarke(quelle, START));
    },
    180_000,
  );

  it(
    "beginnt auch ohne -ss beim ersten Bild (startFrame 0)",
    async () => {
      const zielPfad = path.join(arbeitsordner, "seg_ab_null.mp4");

      const gebaut = baueVideoAusschnittArgumente(
        {
          quellPfad: quelle,
          startFrame: 0,
          endFrame: 60,
          bandSpurPfad: null,
          filterkette: kette(),
          zielPfad,
        },
        RENDER_PROFILE,
      );
      expect(gebaut.ok).toBe(true);
      if (!gebaut.ok) return;

      expect(gebaut.wert).not.toContain("-ss");

      const lauf = await fuehreFfmpegAus({ argumente: [...gebaut.wert] });
      expect(lauf.ok).toBe(true);
      expect(stromFeld(zielPfad, "nb_read_frames")).toBe("60");
      expect(clipMarke(zielPfad, 0)).toBe(quellMarke(quelle, 0));
    },
    180_000,
  );

  it(
    "erzeugt einen Clip von EINEM Bild - die kleinste zulaessige Laenge",
    async () => {
      // (299, 300) aus der Definition of Done, hier an der echten Datei: Ein
      // Ein-Bild-Clip ist die Stelle, an der eine Rundung oder ein
      // Aus-eins-mach-null am ehesten auffiele.
      const zielPfad = path.join(arbeitsordner, "seg_eins.mp4");

      const gebaut = baueVideoAusschnittArgumente(
        {
          quellPfad: quelle,
          startFrame: 219,
          endFrame: 220,
          bandSpurPfad: null,
          filterkette: kette(),
          zielPfad,
        },
        RENDER_PROFILE,
      );
      expect(gebaut.ok).toBe(true);
      if (!gebaut.ok) return;

      const lauf = await fuehreFfmpegAus({ argumente: [...gebaut.wert] });
      expect(lauf.ok).toBe(true);
      expect(stromFeld(zielPfad, "nb_read_frames")).toBe("1");
      expect(clipMarke(zielPfad, 0)).toBe(quellMarke(quelle, 219));
    },
    180_000,
  );
});
