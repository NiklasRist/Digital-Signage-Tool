import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #82: das ECHTE ffprobe.exe.
//
// WARUM ES IHN GIBT. Der Unit-Test zu #82 stellt `child_process` und kann deshalb zwei
// Dinge grundsaetzlich nicht zeigen: (1) dass der ueber #6 ermittelte Pfad zu einem
// lauffaehigen Binary fuehrt, und (2) dass ein HAENGENDES ffprobe nach der Zeitgrenze
// wirklich verschwindet. Punkt 2 ist die teure Frage: Bliebe der Prozess am Leben,
// hielte er den Datei-Handle, und das Loeschen desselben Mediums scheiterte anschliessend
// mit EBUSY - genau der Fall, gegen den #86 sein Retry baut. Ein gemockter Kindprozess
// kann darueber nichts aussagen, weil die gemockte Schicht genau die ist, in der der
// Fehler saesse.
//
// Der Bau-Agent von #82 hat diese Luecke selbst gemeldet ("Nicht belegt ist, dass das
// echte ffprobe.exe nach SIGKILL auf Windows tatsaechlich verschwindet"). Hier wird sie
// geschlossen.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfprobePfad, ermittleFfmpegPfad } = await import("../../src/main/ffmpeg-pfad");
const { leseRohMetadaten } = await import("../../src/main/media-service/ffprobe");
const { werteMetadatenAus } = await import("../../src/main/media-service/metadaten");

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-ffprobe-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

/** Ein echtes, winziges Video - erzeugt mit dem mitgelieferten ffmpeg, nicht eingecheckt. */
function erzeugeVideo(): string {
  const ziel = path.join(arbeitsordner, "probe.mp4");
  execFileSync(
    ermittleFfmpegPfad(),
    ["-y", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=1", "-pix_fmt", "yuv420p", ziel],
    { stdio: "ignore" },
  );
  return ziel;
}

/**
 * Ein echtes Video MIT Drehung.
 *
 * ZWEI SCHRITTE, UND DAS IST NOETIG - am 13.08.2026 gemessen: `-display_rotation` ist eine
 * EINGANGS-Option des Demuxers und wirkt nur auf eine DATEI. Auf einen `lavfi`-Eingang
 * angewandt bleibt sie wirkungslos, und `-metadata:s:v:0 rotate=90` schreibt mit ffmpeg 6.x
 * ueberhaupt nichts mehr - weder Tag noch Side-Data. Wer sein Testmaterial so erzeugt, prueft
 * ein UNGEDREHTES Video und haelt den Test fuer gruen.
 */
function erzeugeGedrehtesVideo(): string {
  const flach = path.join(arbeitsordner, "flach.mp4");
  const gedreht = path.join(arbeitsordner, "gedreht.mp4");
  execFileSync(
    ermittleFfmpegPfad(),
    ["-y", "-f", "lavfi", "-i", "color=c=red:s=320x240:d=1", "-pix_fmt", "yuv420p", flach],
    { stdio: "ignore" },
  );
  execFileSync(
    ermittleFfmpegPfad(),
    ["-y", "-display_rotation", "90", "-i", flach, "-c", "copy", gedreht],
    { stdio: "ignore" },
  );
  return gedreht;
}

/** Lebt der Prozess noch? Signal 0 stellt nur die Frage, es sendet nichts. */
function lebt(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

describe("ffprobe gegen das echte Binary (#82)", () => {
  it("liest Maße und Dauer aus einer echten Datei", async () => {
    const ergebnis = await leseRohMetadaten(erzeugeVideo());

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    // Absichtlich hier und nicht in der Funktion ausgewertet: #82 liefert `unknown` und
    // ruehrt die Felder nicht an - die Auswertung gehoert #83. Dieser Test belegt nur,
    // dass ueberhaupt brauchbares JSON ankommt.
    const roh = ergebnis.wert as {
      streams?: { width?: number; height?: number }[];
      format?: { duration?: string };
    };
    expect(roh.streams?.[0]?.width).toBe(320);
    expect(roh.streams?.[0]?.height).toBe(240);
    expect(Number(roh.format?.duration)).toBeGreaterThan(0);
  });

  // DIE WICHTIGSTE SCHRANKE DIESER DATEI.
  //
  // `werteMetadatenAus` (#83) liest die Drehung ausschliesslich aus `tags.rotate`. Das ist
  // richtig fuer das GEBUENDELTE Binary - ffprobe 4.0.2 aus ffprobe-static 3.1.0 setzt den
  // Tag zuverlaessig (am 13.08.2026 gemessen: `rotate: "270"` neben einer Display-Matrix mit
  // `rotation: 90`). Neuere Fassungen legen die Drehung nur noch als Side-Data ab; das
  // mitgelieferte ffmpeg 6.1.1 zeigt genau dieses Verhalten bereits.
  //
  // WAS PASSIERTE, WENN JEMAND ffprobe-static ANHEBT: `tags.rotate` faellt weg, die Drehung
  // wird als 0 gelesen, und JEDES Hochkant-Video kaeme mit vertauschten Achsen durch. Der
  // Import meldete keinen Fehler - die Masse waeren nur die falschen -, und auffallen wuerde
  // es erst am Fernseher, als Balken an der falschen Seite. Genau diese Klasse von stillem
  // Schaden macht dieser Test laut: Er wird ROT, sobald das Binary den Tag nicht mehr liefert.
  it("liest die Drehung aus tags.rotate - Schranke gegen einen ffprobe-Versionssprung", async () => {
    const ergebnis = await leseRohMetadaten(erzeugeGedrehtesVideo());
    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    // Erst die Quelle, auf die sich #83 stuetzt - hier bricht ein Versionssprung zuerst.
    const roh = ergebnis.wert as { streams?: { tags?: { rotate?: string } }[] };
    expect(roh.streams?.[0]?.tags?.rotate).toBe("270");

    // Dann die Wirkung: 270 Grad tauschen die Achsen. Das Video ist 320x240 aufgenommen und
    // muss als 240x320 ankommen - sonst rechnet der Render mit der falschen Geometrie.
    const gedeutet = werteMetadatenAus(ergebnis.wert, "video");
    expect(gedeutet.ok).toBe(true);
    if (!gedeutet.ok) return;
    expect(gedeutet.wert.maße).toEqual({ breite: 240, höhe: 320 });
  });

  it("meldet eine Datei, die es nicht gibt, als probe_fehler statt zu werfen", async () => {
    const ergebnis = await leseRohMetadaten(path.join(arbeitsordner, "gibt-es-nicht.mp4"));

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("probe_fehler");
  });

  it("beendet ein HAENGENDES ffprobe wirklich - der Prozess ist danach weg", async () => {
    // Warum nicht ueber `leseRohMetadaten`: Dessen Zeitgrenze steht fest bei 30 s (#82,
    // PROBE_TIMEOUT_MS) und ist nicht einstellbar. Ein Test, der 30 s wartet, wird
    // abgeschaltet. Geprueft wird deshalb DERSELBE Mechanismus mit demselben Binary und
    // demselben Optionssatz - nur die Zahl ist kleiner. Die Frage, um die es geht, haengt
    // an `timeout` + `killSignal` und am Verhalten von Windows, nicht an der Dauer.
    //
    // `pipe:0` bringt ffprobe zum Haengen: Es wartet auf Eingabe, die nie kommt und deren
    // Ende nie signalisiert wird. Am 13.08.2026 nachgemessen, bevor dieser Test entstand.
    const pid = await new Promise<number>((aufloesen, ablehnen) => {
      const kind = execFile(
        ermittleFfprobePfad(),
        ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", "pipe:0"],
        { timeout: 2500, killSignal: "SIGKILL", windowsHide: true },
        (fehler) => {
          // Der Rueckruf MUSS mit einem Fehler kommen - kaeme er ohne, haette ffprobe
          // wider Erwarten von selbst beendet und der Test bewiese nichts.
          if (fehler === null) {
            ablehnen(new Error("ffprobe hat nicht gehangen - der Test prueft dann nichts"));
            return;
          }
          expect(kind.killed).toBe(true);
          if (kind.pid === undefined) {
            ablehnen(new Error("Kein pid - der Prozess ist gar nicht erst gestartet"));
            return;
          }
          aufloesen(kind.pid);
        },
      );
    });

    // SELBSTPRUEFUNG, ohne die der Test wertlos waere: Lieferte `lebt` immer `false` -
    // etwa weil `process.kill(pid, 0)` auf dieser Plattform grundsaetzlich wirft -, ginge
    // die Zusicherung unten durch, ohne irgendetwas zu zeigen. Der eigene Prozess lebt
    // ganz sicher.
    expect(lebt(process.pid)).toBe(true);

    // Kurze Nachfrist: Der Rueckruf feuert beim Schliessen der Stroeme, das Aufraeumen
    // des Prozesses im Betriebssystem kann einen Wimpernschlag spaeter fertig sein.
    await new Promise((f) => setTimeout(f, 300));

    expect(lebt(pid)).toBe(false);
  }, 20_000);
});
