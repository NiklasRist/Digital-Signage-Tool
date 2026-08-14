// Tests zu #164 - die Filterkette der Split-Komposition (TK 9.2.8 Art A).
//
// WAS HIER PRUEFBAR IST: Die Datei baut ausschliesslich eine Zeichenkette; alle
// Kriterien des Issues sind reine Unit-Tests ohne Prozessstart. Deshalb startet
// hier kein ffmpeg.
//
// Beim Bauen wurde die Kette dennoch mit dem mitgelieferten ffmpeg 6.1.1
// nachgemessen (Geometrie, Pixelformat, Fuellfarbe an den Kanten, Abbruch bei
// falsch breiter Bandspur); die Messwerte stehen im Kopf der Quelldatei. Der
// Zeichenketten-Vergleich in "die nachgemessene Kette" ist der Anker dazu:
// Aendert jemand die Kette, wird dieser Test rot und die Messung ist zu
// wiederholen.
//
// DIE WICHTIGSTE PRUEFUNG steht in "Naht zu #239/#176": Die eingebaute
// Band-Vorlage (H = 162) geht als einzige ausgelieferte Hoehe glatt auf. Ein
// Test, der nur sie kennt, ist gruen, egal ob die Vierer-Regel verstanden wurde.
// Deshalb laeuft die Pruefung ueber JEDE zulaessige Bandhoehe und benutzt dabei
// die ECHTE Rechenfunktion als Lieferant - nicht selbst gerechnete Zahlen.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { baueSplitFilter, markenFarbeZuFfmpeg } from "../../src/main/ffmpeg-adapter/filter-split";
import { berechneBandGeometrie } from "../../src/shared/band-geometrie";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { RenderProfile } from "../../src/shared/contracts/render-profile";

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/filter-split.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren zitieren das TK
// woertlich (Regel D) und nennen dabei die Masse des Ausgabe-Profils und die
// nachgemessenen Bildgroessen - das ist erwuenscht und darf die Literal-Probe
// nicht ausloesen. Dieselbe Trennung benutzen die Tests zu #161 und #163 im
// selben Modul. Fuer die HEXFARBE gilt sie NICHT: die wird unten gegen die
// ganze Datei geprueft, Kommentare eingeschlossen.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

/** Der Wert der Rolle `flaecheDunkel`, umgerechnet - so, wie #177 ihn hereinreicht. */
const FUELLFARBE = "0x2F2E2E";

/** Ein Profil mit abweichenden Werten - die Umtypung gehoert AUSSCHLIESSLICH hierher. */
function abgewandelt(aenderung: Record<string, unknown>): RenderProfile {
  return { ...RENDER_PROFILE, ...aenderung } as unknown as RenderProfile;
}

/** Die Kette oder ein aussagekraeftiger Fehlschlag. */
function kette(
  hoeheBand: number,
  breite: number,
  x: number,
  farbe: string = FUELLFARBE,
  profil: RenderProfile = RENDER_PROFILE,
): string {
  const ergebnis = baueSplitFilter(hoeheBand, breite, x, farbe, profil);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/**
 * Der Fehler oder ein aussagekraeftiger Erfolg.
 *
 * ALLE fuenf Parameter sind Pflicht - KEINE Vorgabewerte. Mit einem Vorgabewert
 * haette der Fall "Farbe fehlt" (`undefined`) still den gueltigen Wert eingesetzt
 * und der Test waere gruen gewesen, ohne den Fehlerpfad je zu betreten.
 */
function fehler(
  hoeheBand: unknown,
  breite: unknown,
  x: unknown,
  farbe: unknown,
  profil: unknown,
): { code: string; meldung: string } {
  const ergebnis = baueSplitFilter(
    hoeheBand as number,
    breite as number,
    x as number,
    farbe as string,
    profil as RenderProfile,
  );
  if (ergebnis.ok) throw new Error(`unerwartet gelungen: ${ergebnis.wert}`);
  return ergebnis.fehler;
}

/** Zieht die Zahlen aus den Stellen, an denen sie in der Kette stehen. */
function masse(wert: string): {
  flaeche: [number, number];
  flaecheRate: number;
  scale: [number, number];
  pad: [number, number];
  overlayX: number;
  fpsOben: number;
  fpsUnten: number;
} {
  const flaeche = /color=c=[^:]+:s=(\d+)x(\d+):r=(\d+)\[hg\]/.exec(wert);
  const scale = /scale=(\d+):(\d+):force_original_aspect_ratio/.exec(wert);
  const pad = /pad=(\d+):(\d+):\(ow-iw\)/.exec(wert);
  const overlay = /overlay=x=(\d+):y=0:/.exec(wert);
  const oben = /\[0:v\]fps=(\d+),/.exec(wert);
  const unten = /\[1:v\]fps=(\d+),/.exec(wert);
  if (
    flaeche === null || scale === null || pad === null ||
    overlay === null || oben === null || unten === null
  ) {
    throw new Error(`Kette nicht auswertbar: ${wert}`);
  }
  return {
    flaeche: [Number(flaeche[1]), Number(flaeche[2])],
    flaecheRate: Number(flaeche[3]),
    scale: [Number(scale[1]), Number(scale[2])],
    pad: [Number(pad[1]), Number(pad[2])],
    overlayX: Number(overlay[1]),
    fpsOben: Number(oben[1]),
    fpsUnten: Number(unten[1]),
  };
}

describe("die nachgemessene Kette", () => {
  it("ist fuer das TK-Beispiel (H = 162) genau die Zeichenkette, mit der gemessen wurde", () => {
    // "Beispiel mit der eingebauten Vorlage (H = 162): Video-Bereich 1920 x 918,
    // Video real 1632 x 918 zentriert (x = 144), Restflaechen je 144 px." (TK 9.2.8)
    //
    // Mit GENAU dieser Kette wurde gemessen (ffmpeg 6.1.1 + ffprobe):
    //   Ergebnis 1920x1080, yuv420p, SAR 1:1, 30/1 fps, High/Level 4.0;
    //   Fuellfarbe bei x = 0 und x = 142, Bildinhalt von x = 144 bis x = 1775,
    //   Fuellfarbe wieder ab x = 1776; letzte Videozeile y = 916, Band von
    //   y = 918 bis y = 1078 unversehrt.
    expect(kette(162, 1632, 144)).toBe(
      "color=c=0x2F2E2E:s=1920x918:r=30[hg];" +
        "[0:v]fps=30,scale=1632:918:force_original_aspect_ratio=decrease:flags=bicubic," +
        "pad=1632:918:(ow-iw)/2:(oh-ih)/2:color=0x2F2E2E,setsar=1[vg];" +
        "[hg][vg]overlay=x=144:y=0:shortest=1:format=yuv420,format=yuv420p,setsar=1[oben];" +
        "[1:v]fps=30,format=yuv420p,setsar=1[unten];" +
        "[oben][unten]vstack=inputs=2,format=yuv420p,setsar=1[v]",
    );
  });

  it("setzt bei einer Hoehe, die NICHT aufgeht (H = 200), die gerundeten Werte ein", () => {
    // 880 x 16/9 = 1564,44... -> abgerundet auf ein Vielfaches von 4 = 1564;
    // (1920 - 1564)/2 = 178. Die Werte stammen aus #176 - dieser Test SCHREIBT
    // sie hin, er rechnet sie nicht aus.
    const m = masse(kette(200, 1564, 178));
    expect(m.flaeche).toEqual([1920, 880]);
    expect(m.scale).toEqual([1564, 880]);
    expect(m.pad).toEqual([1564, 880]);
    expect(m.overlayX).toBe(178);
  });

  it("ist EINE Zeile und traegt keine Anfuehrungszeichen", () => {
    // Der Rueckgabewert ist EIN Element des spaeteren Argument-Arrays. Wer
    // Anfuehrungszeichen darum legt, macht sie zum Bestandteil des Filterausdrucks.
    const wert = kette(162, 1632, 144);
    expect(wert).not.toMatch(/[\n\r]/);
    expect(wert).not.toMatch(/["']/);
    expect(wert.trim()).toBe(wert);
  });

  it("liefert bei gleichem Aufruf dieselbe Zeichenkette", () => {
    expect(kette(162, 1632, 144)).toBe(kette(162, 1632, 144));
  });
});

describe("Naht zu #239/#176 - die Geometrie kommt fertig herein", () => {
  it("nimmt fuer JEDE zulaessige Bandhoehe genau die Werte der echten Rechenfunktion an", () => {
    // Der Test rechnet NICHT selbst: Er fragt berechneBandGeometrie (#239) - die
    // einzige Rundungsstelle des Projekts - und reicht deren Ergebnis so herein,
    // wie #177 es tun wird. Waere die Pruefung in #164 strenger oder anders
    // gemeint als die Rechnung, wuerde hier ein zulaessiger Auftrag abgewiesen.
    //
    // H = 1078 ist ausgenommen: dort ist die eingepasste Breite 0 (2 x 16/9 = 3,55,
    // groesstes Vielfaches von 4 darunter = 0). Diese Hoehe weist bereits #176 ab.
    for (let h = 2; h <= 1076; h += 2) {
      const geo = berechneBandGeometrie(h);
      const m = masse(kette(h, geo.videoBreite, geo.videoVersatzX));
      const hinweis = `H=${h}`;
      expect(`${hinweis}: ${m.flaeche.join("x")}`).toBe(`${hinweis}: 1920x${1080 - h}`);
      expect(`${hinweis}: ${m.scale.join("x")}`).toBe(
        `${hinweis}: ${geo.videoBreite}x${1080 - h}`,
      );
      expect(`${hinweis}: ${m.pad.join("x")}`).toBe(`${hinweis}: ${geo.videoBreite}x${1080 - h}`);
      expect(`${hinweis}: ${m.overlayX}`).toBe(`${hinweis}: ${geo.videoVersatzX}`);
    }
  });

  it("nennt in der Kette ausschliesslich gerade Masse und Versaetze - yuv420p verlangt das", () => {
    // Rechnerisch, nicht am Beispiel: Ein ungerader Wert an einer dieser Stellen
    // ist in 4:2:0 nicht darstellbar; ffmpeg rundete still, und das Band saesse
    // eine Zeile daneben.
    for (let h = 2; h <= 1076; h += 2) {
      const geo = berechneBandGeometrie(h);
      const m = masse(kette(h, geo.videoBreite, geo.videoVersatzX));
      const rest = [
        m.flaeche[0] % 2, m.flaeche[1] % 2,
        m.scale[0] % 2, m.scale[1] % 2,
        m.pad[0] % 2, m.pad[1] % 2,
        m.overlayX % 2,
      ].join("");
      expect(`H=${h}: ${rest}`).toBe(`H=${h}: 0000000`);
      // Und die Breite haelt zusaetzlich das Vierer-Raster ein - erst dadurch ist
      // der zentrierte Versatz ueberhaupt gerade.
      expect(`H=${h}: ${m.scale[0] % 4}`).toBe(`H=${h}: 0`);
    }
  });

  it("weist die Hoehe ab, bei der #176 keine Videoflaeche mehr uebrig laesst", () => {
    // Bei H = 1078 liefert die Rechnung die Breite 0 - kein Bild. #176 weist das
    // ab; kaeme es trotzdem hier an, faengt es die Masspruefung.
    expect(berechneBandGeometrie(1078).videoBreite).toBe(0);
    expect(fehler(1078, 0, 960, FUELLFARBE, RENDER_PROFILE).code).toBe("ungueltige_eingabe");
  });
});

describe("die Einpass-Werte werden GEPRUEFT, nicht ersetzt", () => {
  it("weist eine Breite ab, die nicht durch 4 teilbar ist", () => {
    const f = fehler(204, 1557, 182, FUELLFARBE, RENDER_PROFILE);
    expect(f.code).toBe("ungueltige_eingabe");
    expect(f.meldung).toContain("1557");
  });

  it("weist einen Versatz ab, der nicht mittig ist", () => {
    // 181 ist weder gerade noch mittig zu 1556 (mittig waere 182).
    expect(fehler(204, 1556, 181, FUELLFARBE, RENDER_PROFILE).code).toBe("ungueltige_eingabe");
  });

  it("liefert in KEINEM dieser Faelle eine Kette mit korrigierten Zahlen", () => {
    for (const [h, b, x] of [
      [204, 1557, 182],
      [204, 1556, 181],
    ] as [number, number, number][]) {
      const ergebnis = baueSplitFilter(h, b, x, FUELLFARBE, RENDER_PROFILE);
      expect(ergebnis.ok).toBe(false);
    }
  });

  it("nennt beim schiefen Versatz den erwarteten UND den vorgefundenen Wert", () => {
    // 1556 ist durch 4 teilbar, 184 ist gerade - aber mittig waere 182. Ohne die
    // Gegenrechnung ginge dieser Fall durch, und das Video saesse 2 px daneben.
    const f = fehler(204, 1556, 184, FUELLFARBE, RENDER_PROFILE);
    expect(f.code).toBe("ungueltige_eingabe");
    expect(f.meldung).toContain("184");
    expect(f.meldung).toContain("182");
  });

  it("verweist bei der Vierer-Regel auf die Quelle des Werts statt zu rechnen", () => {
    expect(fehler(204, 1557, 182, FUELLFARBE, RENDER_PROFILE).meldung).toContain("#176");
  });

  it("leitet die Breite NICHT aus der Bandhoehe ab", () => {
    // Zu H = 200 gehoert 1564. Wird 1560 hereingereicht (durch 4 teilbar, mittig
    // bei 180), muss die Kette GENAU 1560 einsetzen - sie darf nicht "richtig"
    // stellen. Nur so faellt ein Auseinanderlaufen von #176 und der Kette als
    // FEHLENDE Uebereinstimmung auf und nicht als stille Korrektur.
    const m = masse(kette(200, 1560, 180));
    expect(m.scale[0]).toBe(1560);
    expect(m.overlayX).toBe(180);
  });

  it("enthaelt keine eigene Breitenrechnung im ausfuehrbaren Teil", () => {
    for (const verboten of ["16/9", "16 / 9", "1.777", "Math.floor", "Math.round", "Math.ceil"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });

  it("laesst ffmpeg die Breite nicht selbst waehlen", () => {
    const wert = kette(162, 1632, 144);
    for (const verboten of ["force_divisible_by", "scale=-1", "scale=-2", "scale=-4"]) {
      expect(wert).not.toContain(verboten);
    }
    // Der AEUSSERE Versatz ist eine Zahl, kein von ffmpeg gebildeter Ausdruck.
    expect(wert).not.toContain("overlay=x=(");
    expect(wert).toContain("overlay=x=144:");
  });
});

describe("Label-Konvention und Aufbau der Kette", () => {
  const wert = kette(162, 1632, 144);

  it("verbraucht genau [0:v] und [1:v] und endet auf [v]", () => {
    expect(wert).toContain("[0:v]");
    expect(wert).toContain("[1:v]");
    expect(wert).not.toContain("[2:v]");
    expect(wert.endsWith("[v]")).toBe(true);
  });

  it("skaliert die Bandspur NICHT", () => {
    // "Die Bandspur wird ausdruecklich NICHT skaliert." Ist sie nicht 1920 x H,
    // soll der Aufruf LAUT abbrechen (nachgemessen: er tut es) statt das Band
    // still zu verzerren.
    const zweig = wert.slice(wert.indexOf("[1:v]"), wert.indexOf("[unten]"));
    expect(zweig).not.toContain("scale");
    expect(zweig).not.toContain("pad");
    expect(zweig).toBe("[1:v]fps=30,format=yuv420p,setsar=1");
  });

  it("stapelt vertikal und haelt Format und SAR am Ausgang fest", () => {
    // "bei `split` beide Spuren vertikal stapeln (`vstack`)" (TK 9.2.8).
    expect(wert).toContain("[oben][unten]vstack=inputs=2,");
    expect(wert.endsWith("format=yuv420p,setsar=1[v]")).toBe(true);
    expect(RENDER_PROFILE.pixelformat).toBe("yuv420p");
  });

  it("passt ein und beschneidet nicht", () => {
    // "Die Einpassung bleibt 'contain' ohne Beschnitt." (TK 9.2.8)
    expect(wert).toContain("force_original_aspect_ratio=decrease");
    expect(wert).not.toContain("force_original_aspect_ratio=increase");
    expect(wert).not.toContain("crop");
  });

  it("legt das Video auf eine deckende Flaeche und beendet sie mit der Quelle", () => {
    expect(wert).toContain("[hg][vg]overlay=");
    expect(wert).toContain("shortest=1");
    expect(wert).toContain("flags=bicubic");
  });

  it("dreht nicht", () => {
    for (const verboten of ["transpose", "rotate", "hflip", "vflip", "noautorotate"]) {
      expect(wert).not.toContain(verboten);
    }
  });
});

describe("jede Zahl stammt aus Profil und Parametern", () => {
  it("laesst ein abgewandeltes Profil an ALLEN Stellen durchschlagen", () => {
    // Zu breite=1280 / hoehe=720 / fps=25 und H=120 gehoert ein Video-Bereich von
    // 600; 1064 ist durch 4 teilbar, (1280-1064)/2 = 108 ist gerade.
    const m = masse(kette(120, 1064, 108, FUELLFARBE, abgewandelt({ breite: 1280, hoehe: 720, fps: 25 })));
    expect(m).toEqual({
      flaeche: [1280, 600],
      flaecheRate: 25,
      scale: [1064, 600],
      pad: [1064, 600],
      overlayX: 108,
      fpsOben: 25,
      fpsUnten: 25,
    });
  });

  it("setzt die Bildrate an allen drei Stellen - Flaeche, Video und Band", () => {
    // Verschiedene Raten zwaengen ffmpeg beim Overlay und beim vstack zu
    // vermitteln; das Band liefe gegen das Video weg.
    for (const fps of [1, 24, 25, 30, 50, 60]) {
      const m = masse(kette(162, 1632, 144, FUELLFARBE, abgewandelt({ fps })));
      expect(m.flaecheRate).toBe(fps);
      expect(m.fpsOben).toBe(fps);
      expect(m.fpsUnten).toBe(fps);
    }
  });

  it("schreibt kein Mass als Literal in den ausfuehrbaren Teil", () => {
    for (const literal of ["1920", "1080", "162", "1632", "144", "30"]) {
      expect(CODEZEILEN).not.toContain(literal);
    }
  });

  it("enthaelt in der GANZEN Datei keine Hexfarbe - auch nicht als Beispiel im Kommentar", () => {
    // "Hier steht keine Hexzahl. Auch nicht als Vorgabewert, auch nicht als
    // Kommentar-Beispiel im Code, auch nicht als 'Fallback, falls die Marke mal
    // fehlt'." Eine zweite Quelle fuer eine Markenfarbe laesst den Split lautlos
    // vom Rest des Systems abweichen, sobald sich die Marke aendert.
    expect(QUELLE).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(QUELLE.toLowerCase()).not.toContain("2f2e2e");
  });
});

describe("die Fuellfarbe reist durch, ohne den Graphen zu oeffnen", () => {
  it("steht an BEIDEN Stellen - aeussere Flaeche und innere Auffuellung", () => {
    // Zwei verschiedene Farben ergaeben eine sichtbare Naht zwischen Rahmen und
    // Restflaeche, sobald die Quelle nicht 16:9 ist (nachgemessen: es gibt keine).
    const wert = kette(162, 1632, 144, "0xFF4040");
    expect(wert).toContain("color=c=0xFF4040:s=");
    expect(wert).toContain(":color=0xFF4040,setsar=1[vg]");
  });

  it("weist alles ab, was nicht 0x + sechs Hexziffern ist", () => {
    for (const boese of [
      "black",
      "",
      "0x2F2E2E,crop=100:100",
      "0x2F2E2E;[0:v]null[v]",
      "0x2F2E2E[x]",
      "0x2F2E2",
      "0x2F2E2EFF",
      "#2F2E2E",
      "0xGG2E2E",
      "0x2f2e2e ",
    ]) {
      const f = fehler(162, 1632, 144, boese, RENDER_PROFILE);
      expect(`${boese}: ${f.code}`).toBe(`${boese}: ungueltige_eingabe`);
    }
  });

  it("verweist bei falscher Form auf die Umrechnungsfunktion", () => {
    expect(fehler(162, 1632, 144, "black", RENDER_PROFILE).meldung).toContain("markenFarbeZuFfmpeg");
  });

  it("laesst beide Schreibweisen der Hexziffern durch", () => {
    expect(kette(162, 1632, 144, "0x2f2e2e")).toContain("color=c=0x2f2e2e:s=");
  });
});

describe("markenFarbeZuFfmpeg", () => {
  /** Der Wert oder ein aussagekraeftiger Fehlschlag. */
  function um(hex: unknown): string {
    const ergebnis = markenFarbeZuFfmpeg(hex as string);
    if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
    return ergebnis.wert;
  }

  it("rechnet die Form um und laesst den Wert unveraendert", () => {
    expect(um("#2F2E2E")).toBe("0x2F2E2E");
    expect(um("#2f2e2eFF")).toBe("0x2f2e2e");
    expect(um("#ff4040")).toBe("0xff4040");
  });

  it("liefert genau die Form, die baueSplitFilter annimmt", () => {
    // Die Naht zwischen beiden Funktionen: #177 rechnet um und reicht herein.
    const farbe = markenFarbeZuFfmpeg("#2F2E2E");
    expect(farbe.ok).toBe(true);
    if (!farbe.ok) return;
    expect(kette(162, 1632, 144, farbe.wert)).toContain(`color=c=${farbe.wert}:s=`);
  });

  it("weist ab, was kein Markenwert ist", () => {
    for (const boese of ["2F2E2E", "#GG2E2E", "#2F2E2", "#2F2E2E8", "#", "", "0x2F2E2E", 42, null]) {
      const ergebnis = markenFarbeZuFfmpeg(boese as string);
      expect(`${String(boese)}: ${ergebnis.ok ? "ok" : ergebnis.fehler.code}`).toBe(
        `${String(boese)}: ungueltige_eingabe`,
      );
    }
  });

  it("weist einen teildurchsichtigen Wert ab, statt ihn gegen Schwarz zu mischen", () => {
    // Hinter der Restflaeche liegt nichts; ein gemischter Wert waere eine Farbe,
    // die niemand so gewaehlt hat.
    for (const boese of ["#2F2E2E80", "#2F2E2E00", "#2F2E2EFE"]) {
      const ergebnis = markenFarbeZuFfmpeg(boese);
      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.meldung).toContain("deckend");
    }
  });
});

describe("Fehlerpfade - immer ungueltige_eingabe, nie ein Wurf", () => {
  const schlecht: [string, unknown, unknown, unknown, unknown, unknown][] = [
    ["Bandhoehe ist NaN", Number.NaN, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe ist unendlich", Number.POSITIVE_INFINITY, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe ist 0", 0, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe ist negativ", -162, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe ist gebrochen", 162.5, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe ist ungerade", 161, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe erreicht die Bildhoehe", 1080, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe uebersteigt die Bildhoehe", 1200, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Bandhoehe fehlt", undefined, 1632, 144, FUELLFARBE, RENDER_PROFILE],
    ["Breite ist NaN", 162, Number.NaN, 144, FUELLFARBE, RENDER_PROFILE],
    ["Breite ist 0", 162, 0, 960, FUELLFARBE, RENDER_PROFILE],
    ["Breite ist gebrochen", 162, 1632.5, 144, FUELLFARBE, RENDER_PROFILE],
    ["Breite ist breiter als das Bild", 162, 1924, -2, FUELLFARBE, RENDER_PROFILE],
    ["Breite ist nur gerade, nicht durch 4 teilbar", 162, 1630, 145, FUELLFARBE, RENDER_PROFILE],
    ["Versatz ist NaN", 162, 1632, Number.NaN, FUELLFARBE, RENDER_PROFILE],
    ["Versatz ist negativ", 162, 1632, -144, FUELLFARBE, RENDER_PROFILE],
    ["Versatz ist gebrochen", 162, 1632, 144.5, FUELLFARBE, RENDER_PROFILE],
    ["Versatz ist ungerade", 162, 1632, 143, FUELLFARBE, RENDER_PROFILE],
    ["Versatz ist nicht mittig", 162, 1632, 148, FUELLFARBE, RENDER_PROFILE],
    ["Versatz fehlt", 162, 1632, undefined, FUELLFARBE, RENDER_PROFILE],
    ["Farbe fehlt", 162, 1632, 144, undefined, RENDER_PROFILE],
    ["Farbe ist keine Zeichenkette", 162, 1632, 144, 42, RENDER_PROFILE],
    ["Profil fehlt", 162, 1632, 144, FUELLFARBE, undefined],
    ["Profil ist null", 162, 1632, 144, FUELLFARBE, null],
    ["fps ist 0", 162, 1632, 144, FUELLFARBE, abgewandelt({ fps: 0 })],
    ["fps ist gebrochen", 162, 1632, 144, FUELLFARBE, abgewandelt({ fps: 29.97 })],
    ["Profilbreite ist ungerade", 162, 1632, 144, FUELLFARBE, abgewandelt({ breite: 1921 })],
    ["Profilhoehe ist ungerade", 162, 1632, 144, FUELLFARBE, abgewandelt({ hoehe: 1079 })],
  ];

  for (const [name, h, b, x, farbe, profil] of schlecht) {
    it(`meldet ungueltige_eingabe: ${name}`, () => {
      expect(() =>
        baueSplitFilter(h as number, b as number, x as number, farbe as string, profil as RenderProfile),
      ).not.toThrow();
      expect(fehler(h, b, x, farbe, profil).code).toBe("ungueltige_eingabe");
    });
  }

  it("nennt bei einer ungeraden Bandhoehe yuv420p als Grund", () => {
    expect(fehler(161, 1632, 144, FUELLFARBE, RENDER_PROFILE).meldung).toContain("yuv420p");
  });

  it("nennt bei einer zu grossen Bandhoehe den zulaessigen Bereich", () => {
    expect(fehler(1080, 1632, 144, FUELLFARBE, RENDER_PROFILE).meldung).toContain("1079");
  });

  it("prueft die Masse vor der Geradzahligkeit", () => {
    // Sonst meldete ein NaN "ungerade" - eine Meldung, die in die Irre fuehrt.
    expect(fehler(Number.NaN, 1632, 144, FUELLFARBE, RENDER_PROFILE).meldung).not.toContain("ungerade");
  });

  it("wirft bei keiner Eingabe - auch nicht bei voellig fremden Werten", () => {
    const fremd: unknown[] = [undefined, null, "162", {}, [], Symbol.iterator, () => 1];
    for (const wert of fremd) {
      expect(() =>
        baueSplitFilter(
          wert as number, wert as number, wert as number, wert as string, wert as RenderProfile,
        ),
      ).not.toThrow();
      expect(() => markenFarbeZuFfmpeg(wert as string)).not.toThrow();
    }
  });
});

describe("die Funktion ist rein", () => {
  it("importiert nichts, was Wirkung haette", () => {
    for (const verboten of [
      "node:fs", "node:path", "node:child_process", "./prozess", "ffprobe",
      "config-store", "leseMarke", "band-geometrie", "vorlagen",
    ]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
    // Nur TYP-Importe. Insbesondere KEIN Import der Bandgeometrie: Der
    // ffmpeg-adapter kennt keine Typen des render-service und nimmt blanke Zahlen.
    expect(CODEZEILEN.match(/^import .*$/gm)).toEqual([
      "import type { RenderProfile } from '../../shared/contracts/render-profile'",
      "import type { Ergebnis } from '../../shared/contracts/ergebnis'",
    ]);
  });

  it("veraendert das uebergebene Profil nicht", () => {
    const vorher = structuredClone(RENDER_PROFILE);
    baueSplitFilter(162, 1632, 144, FUELLFARBE, RENDER_PROFILE);
    expect(RENDER_PROFILE).toEqual(vorher);
  });

  it("kennt keine Fachbegriffe", () => {
    for (const verboten of ["Projekt", "Aktion", "Listenelement", "Asset", "Auftrag"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });
});
