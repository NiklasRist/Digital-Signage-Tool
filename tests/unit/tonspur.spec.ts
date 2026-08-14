// Test zu #162 - die stille Tonspur und die Container-Argumente.
//
// WARUM DIESER TEST STRUKTURELL PRUEFT UND NICHT ZEICHENKETTEN VERGLEICHT: Die vier
// Funktionen haben keine Fehlerpfade. Ihr ganzer Wert liegt darin, WELCHE Flags mit
// WELCHER Herkunft entstehen - und ein Fehler faellt sonst nirgends auf. ffmpeg
// meldet Erfolg, die Datei entsteht, sie laeuft auf dem Laptop, und am 85-Zoll-
// Samsung im Studio verliert sie nach dem ersten Segment den Ton, friert ein oder
// startet gar nicht.
//
// Die erwarteten Werte werden AUS `RENDER_PROFILE` abgeleitet: Ein Test, der `-ar
// 48000` fest erwartet, bliebe gruen, wenn auch die Quelldatei die Zahl fest
// hinschriebe - beide waeren nach einer Profilaenderung still ueberholt. Abgeleitet
// wird derselbe Test rot.
//
// NICHT hier geprueft wird, was anderen Stellen gehoert: die Betriebsflags (#158)
// und die Video-Kodierargumente (#161) haben eigene Tests.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  baueContainerArgumente,
  baueStilleTonspurEingang,
  baueTonspurKodierArgumente,
  baueTonspurMapping,
} from "../../src/main/ffmpeg-adapter/tonspur";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { RenderProfile } from "../../src/shared/contracts/render-profile";

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/tonspur.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen: Die Begruendungen in den Kommentaren zitieren das Konzept
// woertlich ("48 kHz, mono") und nennen Messwerte - das ist erwuenscht und darf die
// Literal-Probe nicht ausloesen.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

/**
 * Zerlegt eine Argumentliste in Flag/Wert-Paare und belegt dabei, dass sie
 * ueberhaupt paarweise aufgebaut ist: Ein verrutschtes Element verschoebe alle
 * folgenden Werte auf die falschen Flags - und ffmpeg nimmt manches davon klaglos
 * an. `alleinstehend` nennt die Schalter ohne Wert (hier nur `-shortest`); sie
 * werden vor dem Paaren herausgenommen, nachdem ihr Vorhandensein belegt ist.
 */
function paare(
  argumente: readonly string[],
  alleinstehend: readonly string[] = [],
): Record<string, string> {
  for (const schalter of alleinstehend) {
    expect(argumente).toContain(schalter);
  }
  const uebrig = argumente.filter((element) => !alleinstehend.includes(element));
  expect(uebrig.length % 2).toBe(0);

  const ergebnis: Record<string, string> = {};
  for (let i = 0; i < uebrig.length; i += 2) {
    const flag = uebrig[i];
    const wert = uebrig[i + 1];
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

/**
 * Ein Profil mit abweichenden Werten. `RenderProfile` (#18) benutzt LITERALE Typen
 * (`kanaele: 1`), ein abweichender Wert ist deshalb nicht direkt zuweisbar - die
 * Umtypung gehoert AUSSCHLIESSLICH hierher und ist im Produktivcode verboten.
 */
function abgewandeltesAudio(aenderung: Record<string, unknown>): RenderProfile {
  return {
    ...RENDER_PROFILE,
    audio: { ...RENDER_PROFILE.audio, ...aenderung },
  } as unknown as RenderProfile;
}

/** Der `anullsrc`-Ausdruck aus dem Eingang - das vierte Element, hinter `-i`. */
function anullsrcAusdruck(profil: RenderProfile): string {
  const argumente = baueStilleTonspurEingang(profil);
  const nachI = argumente[argumente.indexOf("-i") + 1];
  expect(nachI).toBeDefined();
  return nachI ?? "";
}

describe("baueStilleTonspurEingang (#162)", () => {
  it("haengt die endlose Stille als eigene lavfi-Eingabe an", () => {
    // Die Reihenfolge ist Bedeutung: `-f lavfi` beschreibt das Format DER FOLGENDEN
    // Eingabe. Steht es dahinter, gilt es der naechsten - oder der Ausgabe.
    expect(baueStilleTonspurEingang(RENDER_PROFILE)).toEqual([
      "-f",
      "lavfi",
      "-i",
      `anullsrc=channel_layout=mono:sample_rate=${String(RENDER_PROFILE.audio.sampleRateHz)}`,
    ]);
  });

  it("uebersetzt die Kanalzahl ueber eine Tabelle, nicht ueber ein Literal", () => {
    // Der Beweis, dass hier uebersetzt und nicht "mono" hingeschrieben wird: #18
    // fuehrt die KANALZAHL, `anullsrc` verlangt einen NAMEN.
    expect(RENDER_PROFILE.audio.kanaele).toBe(1);
    expect(anullsrcAusdruck(RENDER_PROFILE)).toContain("channel_layout=mono");
    expect(anullsrcAusdruck(abgewandeltesAudio({ kanaele: 2 }))).toContain(
      "channel_layout=stereo",
    );
  });

  it("laesst die Abtastrate in Eingang UND Kodierargumenten mitwandern", () => {
    // Beide Stellen muessen dieselbe Rate nennen: Die Eingabe legt fest, was
    // erzeugt wird, die Kodierargumente, was geschrieben wird. Liefe eine der
    // beiden mit einer festen Zahl, resampelte ffmpeg still - und die Segmente
    // waeren nur scheinbar identisch.
    const profil = abgewandeltesAudio({ sampleRateHz: 44100 });
    expect(anullsrcAusdruck(profil)).toContain("sample_rate=44100");
    expect(paare(baueTonspurKodierArgumente(profil), ["-shortest"])["-ar"]).toBe("44100");
  });
});

describe("baueTonspurMapping (#162)", () => {
  it("mappt genau den uebergebenen Eingang, Tonstrom 0", () => {
    expect(baueTonspurMapping(1)).toEqual(["-map", "1:a:0"]);
    // Der Index wird uebergeben, nicht geraten: Wer ihn nicht kennt, darf die
    // Funktion nicht rufen. Ein fest angenommenes "1" waere in jedem Lauf mit
    // mehreren Eingaben (Band, Ueberlagerung) falsch.
    expect(baueTonspurMapping(0)).toEqual(["-map", "0:a:0"]);
    expect(baueTonspurMapping(2)).toEqual(["-map", "2:a:0"]);
  });

  it("mappt den Quellton nicht mit", () => {
    // Sobald irgendein -map gesetzt ist, mappt ffmpeg NICHTS mehr automatisch -
    // genau dadurch faellt der Quellton weg. Diese Funktion darf ihn deshalb nicht
    // "zur Sicherheit" mitnehmen; die Videospur mappt der Aufrufer selbst.
    const argumente = baueTonspurMapping(1);
    expect(argumente.filter((element) => element === "-map")).toHaveLength(1);
    expect(argumente.join(" ")).not.toContain(":v");
  });
});

describe("baueTonspurKodierArgumente (#162)", () => {
  it("setzt genau die vier Ton-Flags plus -shortest", () => {
    const argumente = baueTonspurKodierArgumente(RENDER_PROFILE);
    expect(Object.keys(paare(argumente, ["-shortest"])).sort()).toEqual(
      ["-ac", "-ar", "-b:a", "-c:a"].sort(),
    );
  });

  it("nimmt Codec, Rate und Kanalzahl aus dem Profil und die Bitrate von hier", () => {
    const p = paare(baueTonspurKodierArgumente(RENDER_PROFILE), ["-shortest"]);

    // Format -> Encoder: `aac` ist das Format (#18), der Encoder-Name eine
    // ffmpeg-Eigenheit. Kein libfdk_aac - der fehlt in den ueblichen Fertigbauten.
    expect(RENDER_PROFILE.audio.codec).toBe("aac");
    expect(p["-c:a"]).toBe("aac");

    expect(p["-ar"]).toBe(String(RENDER_PROFILE.audio.sampleRateHz));
    expect(p["-ac"]).toBe(String(RENDER_PROFILE.audio.kanaele));

    // Die eine Zahl, die NICHT aus dem Profil kommt: #18 fuehrt fuer die Tonspur
    // keine Bitrate. Ohne die Einheit deutet ffmpeg den Wert als Bit pro Sekunde.
    expect(p["-b:a"]).toBe("64k");
  });

  it("enthaelt -shortest", () => {
    // `anullsrc` erzeugt ENDLOS Stille. Ohne diesen Schalter laeuft der Lauf
    // unbegrenzt weiter (nachgemessen: nach 12 s bei einer 3-s-Quelle immer noch,
    // die Datei blieb ohne `moov` unlesbar) - und die Warteschlange steht.
    expect(baueTonspurKodierArgumente(RENDER_PROFILE)).toContain("-shortest");
  });

  it("liefert fuer jede Kanalzahl eine zur Eingabe passende Angabe", () => {
    // `-ac` und das Layout der Eingabe muessen dieselbe Kanalzahl meinen; sonst
    // mischt ffmpeg still um.
    const p = paare(baueTonspurKodierArgumente(abgewandeltesAudio({ kanaele: 2 })), [
      "-shortest",
    ]);
    expect(p["-ac"]).toBe("2");
  });
});

describe("baueContainerArgumente (#162)", () => {
  it("setzt +faststart, wenn das Profil es verlangt", () => {
    expect(RENDER_PROFILE.faststart).toBe(true);
    expect(baueContainerArgumente(RENDER_PROFILE)).toEqual(["-movflags", "+faststart"]);
  });

  it("liefert ein leeres Array, wenn das Profil faststart abschaltet", () => {
    // Kein toter Zweig: Er haelt die Aussage des Profils am Leben. Ein fest
    // gesetztes Flag laese das Feld und ignorierte es.
    const aus = { ...RENDER_PROFILE, faststart: false } as unknown as RenderProfile;
    expect(baueContainerArgumente(aus)).toEqual([]);
  });

  it("setzt kein fragmentiertes MP4", () => {
    // Fragmentiertes MP4 ist ein anderer Container-Aufbau; Consumer-Fernseher
    // spielen es oft nicht ab, und `concat -c copy` verhaelt sich damit anders.
    const argumente = baueContainerArgumente(RENDER_PROFILE).join(" ");
    for (const verboten of ["frag_keyframe", "empty_moov", "default_base_moof"]) {
      expect(argumente).not.toContain(verboten);
    }
  });
});

describe("die vier Funktionen gemeinsam (#162)", () => {
  const alle = (): string[][] => [
    baueStilleTonspurEingang(RENDER_PROFILE),
    baueTonspurMapping(1),
    baueTonspurKodierArgumente(RENDER_PROFILE),
    baueContainerArgumente(RENDER_PROFILE),
  ];

  it("gibt jedes Flag und jeden Wert als eigenes Element", () => {
    // "ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als
    // Argument-Array." (TK 9.4.8 Punkt 2) - ein `['-c:a aac']` waere fuer ffmpeg
    // EIN unbekanntes Flag, nicht zwei bekannte Teile. Der `anullsrc`-Ausdruck ist
    // die eine erlaubte Zusammensetzung und enthaelt selbst kein Leerzeichen.
    for (const liste of alle()) {
      for (const element of liste) {
        expect(element).not.toBe("");
        expect(element).not.toContain(" ");
      }
    }
  });

  it("veraendert das uebergebene Profil nicht", () => {
    const vorher = structuredClone(RENDER_PROFILE);
    alle();
    expect(RENDER_PROFILE).toEqual(vorher);
  });

  it("uebernimmt nichts, was anderen Stellen gehoert", () => {
    // Betriebsflags (#158), Video-Kodierargumente (#161), Eingaben und Ausgabepfad
    // (#166/#167), Filterketten (#163 ff.). Doppelt gesetzte Flags ueberschreiben
    // sich je nach Position.
    const flach = alle().flat();
    for (const verboten of [
      "-hide_banner",
      "-nostdin",
      "-loglevel",
      "-y",
      "-progress",
      "-nostats",
      "-c:v",
      "-pix_fmt",
      "-r",
      "-g",
      "-b:v",
      "-vf",
      "-filter_complex",
      "-t",
      "-ss",
      "-an",
      "-vn",
    ]) {
      expect(flach).not.toContain(verboten);
    }
  });

  it("reicht den Quellton unter keinen Umstaenden durch", () => {
    // Die Fallunterscheidung "vorhandenen Ton behalten, nur bei fehlendem einen
    // erzeugen" ist genau der Fehler: Sie erzeugt zwei verschiedene Streamlayouts
    // und damit eine Datei, die mittendrin kaputtgeht (nachgemessen: die
    // Verkettung mit `-c copy` meldet dann trotzdem Erfolg).
    for (const verboten of ["-an", "c:a copy", "copy"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });

  it("nennt im Quelltext kein Flag, das anderen Stellen gehoert", () => {
    // Dieselbe Probe wie oben, aber auf den QUELLTEXT statt auf das Ergebnis: Ein
    // Flag, das hier nur in einem noch unerreichten Zweig steht, waere von der
    // Ergebnis-Probe nicht zu sehen.
    for (const verboten of ["-c:v", "-pix_fmt", "-y", "frag_keyframe", "empty_moov"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });

  it("schreibt keinen Profilwert als Literal in den Quelltext", () => {
    // Sonst waere die naechste Profilaenderung keine Datenaenderung mehr, sondern
    // eine Quelltextaenderung an einer zweiten, leicht zu uebersehenden Stelle -
    // und die zweite Stelle bliebe beim ersten Mal stehen.
    // NICHT in dieser Liste steht der Encoder-Name: Er MUSS im Quelltext stehen,
    // weil er die Uebersetzung Format -> Encoder ist und #18 ihn bewusst nicht
    // fuehrt - genau wie `libx264` in #161.
    for (const literal of ["48000", "yuv420p", "1920", "1080"]) {
      expect(CODEZEILEN).not.toContain(literal);
    }
    // Die Bitrate ist die EINE erlaubte Zahl - und sie steht genau einmal.
    expect(CODEZEILEN.split("64").length - 1).toBe(1);
  });
});
