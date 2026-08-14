import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #159: der Abbruch gegen das ECHTE ffmpeg.
//
// WARUM ES IHN GIBT. Der Unit-Test zu #159 stellt `child_process` und kann deshalb die
// teuerste Frage nicht beantworten: Stirbt ein LAUFENDES ffmpeg wirklich, und ist die
// Ausgabedatei danach loeschbar? Bleibt der Prozess am Leben, haelt er unter Windows ein
// Handle auf die Datei - jedes spaetere Loeschen scheitert dann mit EBUSY, und der
// Aufraeumlauf (#172) traegt die Leiche fuer immer mit sich herum.
//
// Der Bau-Agent von #159 hat das am 14.08.2026 von Hand gemessen und protokolliert. Diese
// Datei macht die Messung wiederholbar: Wer die Abbruch-Logik spaeter umbaut, sieht den
// Rueckschritt sofort statt erst an einer Datei, die sich nicht loeschen laesst.
//
// DER TEST BRAUCHT KEINEN TIMEOUT-ERSATZ. #158 hat ausdruecklich entschieden, dass ein
// Renderlauf KEINE Zeitgrenze bekommt (er darf legitim Minuten dauern, NFA-05) - der
// Abbruch ist der einzige Weg, ihn zu beenden. Genau der wird hier geprueft.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { ermittleFfmpegPfad } = await import("../../src/main/ffmpeg-pfad");
const { fuehreFfmpegAus } = await import("../../src/main/ffmpeg-adapter/prozess");
const { beendeLaufendenProzess, merkeProzess, gibProzessFrei } = await import(
  "../../src/main/ffmpeg-adapter/abbruch"
);

const arbeitsordner = mkdtempSync(path.join(tmpdir(), "signage-abbruch-"));

afterAll(() => {
  rmSync(arbeitsordner, { recursive: true, force: true });
});

/** Lebt der Prozess noch? Signal 0 fragt nur, es sendet nichts. */
function lebt(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ein Lauf, der von sich aus NICHT endet - 600 s Testbild in eine Datei.
 *
 * Eine kurze Quelle taugt nicht: Sie waere womoeglich fertig, bevor der Abbruch greift,
 * und der Test bewiese dann nur, dass ffmpeg von selbst aufhoert.
 */
function langerLauf(ziel: string): string[] {
  return [
    "-f", "lavfi",
    "-i", "testsrc=size=640x360:rate=30:duration=600",
    "-pix_fmt", "yuv420p",
    ziel,
  ];
}

describe("Abbruch gegen das echte ffmpeg (#159)", () => {
  it("beendet einen laufenden Prozess, und die Datei ist danach loeschbar", async () => {
    const ziel = path.join(arbeitsordner, "lang.mp4");
    let pid = -1;

    // BEIDE TEILE ZUSAMMEN - und das ist keine Formalitaet, s. den zweiten Test unten:
    // Das Abbruchsignal sagt #158, dass der Ausgang ein Abbruch IST; das Merken sagt #159,
    // welchen Prozess es zu toeten gilt. Wer nur eines von beiden tut, bekommt entweder
    // einen falschen Fehlercode oder einen weiterlaufenden Prozess.
    const abbruch = new AbortController();
    const lauf = fuehreFfmpegAus({
      argumente: langerLauf(ziel),
      abbruchSignal: abbruch.signal,
      aufProzessStart: (kindProzess) => {
        pid = kindProzess.pid ?? -1;
        merkeProzess(kindProzess);
      },
    });

    // Warten, bis wirklich geschrieben wird - sonst bricht der Test womoeglich ab, bevor
    // ffmpeg die Datei ueberhaupt angelegt hat, und die Loeschprobe unten waere leer.
    for (let versuch = 0; versuch < 100 && !existsSync(ziel); versuch += 1) {
      await new Promise((fertig) => setTimeout(fertig, 50));
    }
    expect(existsSync(ziel)).toBe(true);
    expect(pid).toBeGreaterThan(0);

    // SELBSTPRUEFUNG: Ohne sie ginge die Zusicherung unten auch dann durch, wenn `lebt`
    // grundsaetzlich `false` liefert.
    expect(lebt(process.pid)).toBe(true);
    expect(lebt(pid)).toBe(true);

    abbruch.abort();
    await beendeLaufendenProzess();
    const ergebnis = await lauf;

    // Der Ausgang ist ein ABBRUCH, kein Fehlschlag. Genau daran haengt, ob der Nutzer
    // "abgebrochen" oder faelschlich "Render fehlgeschlagen" sieht - unter Windows meldet
    // ein per taskkill beendetes ffmpeg naemlich `code 1, signal null`.
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ffmpeg_abgebrochen");
    }

    // Kurze Nachfrist: Der Rueckruf kommt beim Schliessen der Stroeme, das Aufraeumen im
    // Betriebssystem kann einen Wimpernschlag spaeter fertig sein.
    await new Promise((fertig) => setTimeout(fertig, 300));
    expect(lebt(pid)).toBe(false);

    // DIE EIGENTLICHE ZUSICHERUNG: Lebte der Prozess weiter, scheiterte das hier unter
    // Windows mit EBUSY.
    expect(() => unlinkSync(ziel)).not.toThrow();
  }, 60_000);

  it("meldet OHNE Abbruchsignal einen Fehlschlag - die Falle, gegen die #158 baut", async () => {
    // GEMESSEN, nicht vermutet: Ein per taskkill beendetes ffmpeg meldet unter Windows
    // `code 1, signal null` - fuer #158 nicht von einem echten Encoder-Fehler zu
    // unterscheiden. Ohne das Abbruchsignal kaeme also JEDER vom Nutzer ausgeloeste
    // Abbruch als rotes "Render fehlgeschlagen" an.
    //
    // Dieser Test haelt das absichtlich fest, statt es zu verstecken: Er ist der Beleg
    // dafuer, WARUM der Aufrufer beide Teile benutzen muss. Wird die Erkennung eines Tages
    // robuster (etwa ueber ein eigenes Merkmal statt des Signals), faellt er - und dann
    // gehoert er geloescht, nicht repariert.
    const ziel = path.join(arbeitsordner, "ohne-signal.mp4");
    const lauf = fuehreFfmpegAus({
      argumente: langerLauf(ziel),
      aufProzessStart: (kindProzess) => merkeProzess(kindProzess),
    });
    for (let versuch = 0; versuch < 100 && !existsSync(ziel); versuch += 1) {
      await new Promise((fertig) => setTimeout(fertig, 50));
    }

    await beendeLaufendenProzess();
    const ergebnis = await lauf;

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    }
  }, 60_000);

  it("wirft nicht, wenn gar kein Prozess laeuft", async () => {
    await expect(beendeLaufendenProzess()).resolves.toBeUndefined();
  });

  it("beendet einen bereits freigegebenen Prozess nicht mehr", async () => {
    const ziel = path.join(arbeitsordner, "kurz.mp4");
    // Ein kurzer Lauf, der von selbst fertig wird.
    execFileSync(ermittleFfmpegPfad(), [
      "-y", "-f", "lavfi", "-i", "testsrc=size=64x64:rate=30:duration=1",
      "-pix_fmt", "yuv420p", ziel,
    ], { stdio: "ignore" });

    let pid = -1;
    const lauf = fuehreFfmpegAus({
      argumente: ["-y", "-f", "lavfi", "-i", "testsrc=size=64x64:rate=30:duration=1",
        "-pix_fmt", "yuv420p", path.join(arbeitsordner, "kurz2.mp4")],
      aufProzessStart: (kindProzess) => {
        pid = kindProzess.pid ?? -1;
        merkeProzess(kindProzess);
      },
    });
    const ergebnis = await lauf;
    expect(ergebnis.ok).toBe(true);

    // Nach dem Freigeben darf ein Abbruch nichts mehr finden - und schon gar nicht eine
    // inzwischen neu vergebene PID treffen.
    gibProzessFrei({ pid } as never);
    await expect(beendeLaufendenProzess()).resolves.toBeUndefined();
  }, 60_000);
});
