// Test zu #161 - die Encoder-Argumente aus RENDER_PROFILE.
//
// WARUM DIESER TEST ANDERS AUSSIEHT ALS EIN UEBLICHER: Die Funktion hat keine
// Fehlerpfade und keine Zweige - ihr ganzer Wert liegt darin, WELCHE Flags mit
// WELCHER Herkunft entstehen. Ein Fehler faellt sonst nirgends auf: ffmpeg meldet
// Erfolg, die Datei entsteht, sie laeuft auf dem Laptop - und ruckelt, verfaerbt
// oder startet nicht am 85-Zoll-Samsung im Studio.
//
// Deshalb wird STRUKTURELL geprueft (Paare, Vollstaendigkeit, keine Doppelung),
// nicht als ein langer Zeichenkettenvergleich: Der braeche bei jeder harmlosen
// Umstellung und sagte nicht, WAS falsch ist.
//
// Und deshalb werden die erwarteten Werte AUS `RENDER_PROFILE` abgeleitet: Ein
// Test, der `-g 60` fest erwartet, bliebe gruen, wenn auch die Quelldatei die 60
// fest hinschriebe - und beide waeren nach einer Profilaenderung still ueberholt.
// Abgeleitet wird derselbe Test rot.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { baueVideoKodierArgumente } from "../../src/main/ffmpeg-adapter/encoder-argumente";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { RenderProfile } from "../../src/shared/contracts/render-profile";

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/encoder-argumente.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen: Die Begruendungen in den Kommentaren zitieren das Profil
// woertlich ("30 fps, CFR", "yuv420p") - das ist erwuenscht und darf die
// Literal-Probe nicht ausloesen.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

/**
 * Zerlegt die flache Argumentliste in Flag/Wert-Paare und belegt dabei, dass sie
 * ueberhaupt paarweise aufgebaut ist: Ein verrutschtes Element verschoebe sonst
 * alle folgenden Werte auf die falschen Flags - und ffmpeg nimmt manches davon
 * klaglos an.
 */
function paare(argumente: readonly string[]): Record<string, string> {
  expect(argumente.length % 2).toBe(0);

  const ergebnis: Record<string, string> = {};
  for (let i = 0; i < argumente.length; i += 2) {
    const flag = argumente[i];
    const wert = argumente[i + 1];
    if (flag === undefined || wert === undefined) throw new Error("unpaarig");
    expect(flag.startsWith("-")).toBe(true);
    expect(wert.startsWith("-")).toBe(false);
    // Keine Doppelung: Zwei gleiche Flags ueberschreiben sich je nach Position -
    // welches gewinnt, ist keine Eigenschaft, auf die man bauen kann.
    expect(ergebnis[flag]).toBeUndefined();
    ergebnis[flag] = wert;
  }
  return ergebnis;
}

/** Ein Profil mit abweichenden Werten - die Umtypung gehoert AUSSCHLIESSLICH hierher. */
function abgewandelt(aenderung: Partial<Record<string, unknown>>): RenderProfile {
  return { ...RENDER_PROFILE, ...aenderung } as unknown as RenderProfile;
}

describe("baueVideoKodierArgumente (#161)", () => {
  it("liefert jedes Flag und jeden Wert als eigenes Element", () => {
    // "ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als
    // Argument-Array." (TK 9.4.8 Punkt 2) - ein `['-c:v libx264']` waere fuer
    // ffmpeg EIN unbekanntes Flag, nicht zwei bekannte Teile.
    for (const element of baueVideoKodierArgumente(RENDER_PROFILE)) {
      expect(element).not.toBe("");
      expect(element).not.toContain(" ");
    }
  });

  it("setzt genau die vierzehn Kodier-Flags - keins mehr, keins weniger", () => {
    expect(Object.keys(paare(baueVideoKodierArgumente(RENDER_PROFILE))).sort()).toEqual(
      [
        "-b:v",
        "-bufsize",
        "-c:v",
        "-color_primaries",
        "-color_trc",
        "-colorspace",
        "-flags",
        "-fps_mode",
        "-g",
        "-level:v",
        "-maxrate",
        "-pix_fmt",
        "-profile:v",
        "-r",
      ].sort(),
    );
  });

  it("nimmt jeden Wert aus dem uebergebenen Profil", () => {
    const p = paare(baueVideoKodierArgumente(RENDER_PROFILE));

    // Format -> Encoder ist die einzige Uebersetzung, die NICHT aus #18 kommt:
    // `h264` ist das Format, `libx264` der Encoder. Kein Hardware-Encoder.
    expect(RENDER_PROFILE.videoCodec).toBe("h264");
    expect(p["-c:v"]).toBe("libx264");

    expect(p["-profile:v"]).toBe(RENDER_PROFILE.profil);
    expect(p["-level:v"]).toBe(RENDER_PROFILE.level);
    expect(p["-pix_fmt"]).toBe(RENDER_PROFILE.pixelformat);
    expect(p["-r"]).toBe(String(RENDER_PROFILE.fps));
    expect(p["-fps_mode"]).toBe("cfr");

    // Gedeckeltes VBR: Ziel, Deckel und VBV-Puffer - der Deckel ist der Teil, der
    // den Hardware-Decoder des Fernsehers vor Bitratenspitzen schuetzt.
    expect(p["-b:v"]).toBe(`${String(RENDER_PROFILE.ratensteuerung.zielBitrateKbps)}k`);
    expect(p["-maxrate"]).toBe(`${String(RENDER_PROFILE.ratensteuerung.maxBitrateKbps)}k`);
    expect(p["-bufsize"]).toBe(`${String(RENDER_PROFILE.ratensteuerung.vbvBufferKbit)}k`);

    // Geschlossene GOP, Laenge BERECHNET - Voraussetzung fuer `concat -c copy`.
    expect(p["-g"]).toBe(String(RENDER_PROFILE.fps * RENDER_PROFILE.gopMaxSekunden));
    expect(p["-flags"]).toBe("+cgop");

    // Alle drei Farbmetadaten, sonst raet der Player (meist BT.601) und #FF4040
    // ist am Fernseher nicht mehr die Markenfarbe.
    expect(p["-color_primaries"]).toBe(RENDER_PROFILE.farbmetadaten.primaries);
    expect(p["-color_trc"]).toBe(RENDER_PROFILE.farbmetadaten.transfer);
    expect(p["-colorspace"]).toBe(RENDER_PROFILE.farbmetadaten.matrix);
  });

  it("ergibt fuer RENDER_PROFILE die Flags, die am Fernseher geprueft sind", () => {
    // Die Gegenprobe zur Ableitung oben: So - und nur so - sah der Aufruf aus, mit
    // dem die fertige Datei nachgemessen wurde (profile=High, level=40,
    // pix_fmt=yuv420p, BT.709 dreifach, ein Keyframe je 60 Bilder). Wandert das
    // Profil, wird dieser Test rot und die Messung ist zu wiederholen.
    expect(paare(baueVideoKodierArgumente(RENDER_PROFILE))).toEqual({
      "-c:v": "libx264",
      "-profile:v": "high",
      "-level:v": "4.0",
      "-pix_fmt": "yuv420p",
      "-r": "30",
      "-fps_mode": "cfr",
      "-b:v": "10000k",
      "-maxrate": "12000k",
      "-bufsize": "24000k",
      "-g": "60",
      "-flags": "+cgop",
      "-color_primaries": "bt709",
      "-color_trc": "bt709",
      "-colorspace": "bt709",
    });
  });

  it("laesst Bildrate und GOP mit dem Profil wandern", () => {
    // Der Beweis, dass nichts fest verdrahtet ist: 25 fps bei 4 s GOP sind 100
    // Bilder. Waere die 60 hingeschrieben, waere die GOP hier 2,4 s lang.
    const p = paare(baueVideoKodierArgumente(abgewandelt({ fps: 25, gopMaxSekunden: 4 })));
    expect(p["-r"]).toBe("25");
    expect(p["-g"]).toBe("100");
  });

  it("laesst die Ratensteuerung mit dem Profil wandern und haengt die Einheit an", () => {
    // Ohne das `k` deutet ffmpeg die Zahl als Bit pro Sekunde - aus 8 Mbit/s
    // wuerden 8 kbit/s, und niemand koennte im Studio erklaeren, warum das Bild
    // aussieht wie ein Videoanruf.
    const p = paare(
      baueVideoKodierArgumente(
        abgewandelt({
          ratensteuerung: { zielBitrateKbps: 8000, maxBitrateKbps: 9000, vbvBufferKbit: 18000 },
        }),
      ),
    );
    expect(p["-b:v"]).toBe("8000k");
    expect(p["-maxrate"]).toBe("9000k");
    expect(p["-bufsize"]).toBe("18000k");
  });

  it("veraendert das uebergebene Profil nicht", () => {
    const vorher = structuredClone(RENDER_PROFILE);
    baueVideoKodierArgumente(RENDER_PROFILE);
    expect(RENDER_PROFILE).toEqual(vorher);
  });

  it("uebernimmt nichts, was anderen Stellen gehoert", () => {
    // Betriebsflags (#158), Eingaben und Ausgabepfad (#166/#167), Filterkette
    // samt setsar (#163 ff.), Tonspur und Container (#162). Doppelt gesetzte
    // Flags sind je nach Position wirkungslos oder ueberschreiben sich; ein `-map`
    // hier hoebe zudem das automatische Mapping des ganzen Laufs auf.
    const argumente = baueVideoKodierArgumente(RENDER_PROFILE);
    for (const verboten of [
      "-hide_banner",
      "-nostdin",
      "-loglevel",
      "-y",
      "-progress",
      "-nostats",
      "-i",
      "-t",
      "-ss",
      "-map",
      "-vf",
      "-filter_complex",
      "-c:a",
      "-an",
      "-movflags",
      "-aspect",
      "-crf",
      "-preset",
      "-tune",
      "-refs",
      "-top",
      "-field_order",
    ]) {
      expect(argumente).not.toContain(verboten);
    }
    expect(argumente.join(" ")).not.toContain("setsar");
  });

  it("schreibt keinen Profilwert als Literal in den Quelltext", () => {
    // Sonst waere die naechste Profilaenderung keine Datenaenderung mehr, sondern
    // eine Quelltextaenderung an einer zweiten, leicht zu uebersehenden Stelle -
    // und die zweite Stelle bliebe beim ersten Mal stehen.
    for (const literal of [
      "1920",
      "1080",
      "10000",
      "12000",
      "24000",
      "30",
      "60",
      "high",
      "4.0",
      "yuv420p",
      "bt709",
    ]) {
      expect(CODEZEILEN).not.toContain(literal);
    }
  });

  it("nennt keinen Hardware-Encoder und keine Qualitaets-Stellschraube", () => {
    // Hardware-Encoder ignorieren einen Teil dieser Einstellungen und liefern je
    // nach Grafiktreiber unterschiedliche Dateien - die Uniformitaetszusage fuer
    // `-c copy` haenge dann an der Hardware des Nutzers.
    for (const verboten of [
      "nvenc",
      "qsv",
      "amf",
      "videotoolbox",
      "crf",
      "preset",
      "tune",
      "movflags",
      "setsar",
    ]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });
});
