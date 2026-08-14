// Tests zu #165 - die Filterkette der Einblendung (TK 9.2.8 Art B).
//
// WAS HIER PRUEFBAR IST: Die Datei baut ausschliesslich eine Zeichenkette; alle
// Kriterien des Issues sind reine Unit-Tests ohne Prozessstart. Deshalb startet
// hier kein ffmpeg.
//
// Beim Bauen wurde die Kette dennoch mit dem mitgelieferten ffmpeg 6.1.1
// nachgemessen (Bandkante, Alphamischung, volle Videohoehe, Gegenprobe mit
// `format=yuv420p` auf dem Bandzweig); die Messwerte stehen im Kopf der
// Quelldatei. Der Zeichenketten-Vergleich in "die nachgemessene Kette" ist der
// Anker dazu: Aendert jemand die Kette, wird dieser Test rot und die Messung ist
// zu wiederholen.
//
// DIE WICHTIGSTEN PRUEFUNGEN sind die, die Art B von Art A (#164) trennen: das
// Video wird NICHT verkleinert, das Band liegt DARUEBER, und der Bandzweig
// behaelt seinen Alphakanal. Ein Verwechseln der beiden Arten erzeugt weder
// Fehlerbild noch Meldung, sondern ein Video, das anders aussieht als die
// Vorschau.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { baueEinblendungFilter } from "../../src/main/ffmpeg-adapter/filter-einblendung";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { RenderProfile } from "../../src/shared/contracts/render-profile";

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/filter-einblendung.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren zitieren das TK
// woertlich (Regel D) und nennen dabei die Masse des Ausgabe-Profils und die
// nachgemessenen Bildgroessen - das ist erwuenscht und darf die Literal-Probe
// nicht ausloesen. Dieselbe Trennung benutzen die Tests zu #161, #163 und #164
// im selben Modul.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

/** Ein Profil mit abweichenden Werten - die Umtypung gehoert AUSSCHLIESSLICH hierher. */
function abgewandelt(aenderung: Record<string, unknown>): RenderProfile {
  return { ...RENDER_PROFILE, ...aenderung } as unknown as RenderProfile;
}

/** Die Kette oder ein aussagekraeftiger Fehlschlag. */
function kette(hoeheBand: number, profil: RenderProfile = RENDER_PROFILE): string {
  const ergebnis = baueEinblendungFilter(hoeheBand, profil);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/**
 * Der Fehler oder ein aussagekraeftiger Erfolg.
 *
 * BEIDE Parameter sind Pflicht - KEINE Vorgabewerte. Mit einem Vorgabewert haette
 * der Fall "Profil fehlt" (`undefined`) still den gueltigen Wert eingesetzt und
 * der Test waere gruen gewesen, ohne den Fehlerpfad je zu betreten.
 */
function fehler(hoeheBand: unknown, profil: unknown): { code: string; meldung: string } {
  const ergebnis = baueEinblendungFilter(hoeheBand as number, profil as RenderProfile);
  if (ergebnis.ok) throw new Error(`unerwartet gelungen: ${ergebnis.wert}`);
  return ergebnis.fehler;
}

/** Zieht die Zahlen aus den Stellen, an denen sie in der Kette stehen. */
function masse(wert: string): {
  flaeche: [number, number];
  flaecheRate: number;
  scale: [number, number];
  pad: [number, number];
  bandY: number;
  fpsVideo: number;
  fpsBand: number;
} {
  const flaeche = /color=c=[^:]+:s=(\d+)x(\d+):r=(\d+)\[hg\]/.exec(wert);
  const scale = /scale=(\d+):(\d+):force_original_aspect_ratio/.exec(wert);
  const pad = /pad=(\d+):(\d+):\(ow-iw\)/.exec(wert);
  const bandOverlay = /\[bg\]\[band\]overlay=x=0:y=(\d+):/.exec(wert);
  const video = /\[0:v\]fps=(\d+),/.exec(wert);
  const band = /\[1:v\]fps=(\d+),/.exec(wert);
  if (
    flaeche === null || scale === null || pad === null ||
    bandOverlay === null || video === null || band === null
  ) {
    throw new Error(`Kette nicht auswertbar: ${wert}`);
  }
  return {
    flaeche: [Number(flaeche[1]), Number(flaeche[2])],
    flaecheRate: Number(flaeche[3]),
    scale: [Number(scale[1]), Number(scale[2])],
    pad: [Number(pad[1]), Number(pad[2])],
    bandY: Number(bandOverlay[1]),
    fpsVideo: Number(video[1]),
    fpsBand: Number(band[1]),
  };
}

describe("die nachgemessene Kette", () => {
  it("ist fuer die eingebaute Vorlage (H = 162) genau die Zeichenkette, mit der gemessen wurde", () => {
    // Mit GENAU dieser Kette wurde gemessen (ffmpeg 6.1.1, Quelle blau,
    // halbdeckendes rotes Band): Ergebnis 1920x1080, yuv420p, SAR 1:1, 30 fps,
    // Profil High; Zeile 917 reines Video, Bandkante exakt bei y = 918, im
    // Bandbereich eine Mischung aus Video- und Bandfarbe.
    expect(kette(162)).toBe(
      "color=c=black:s=1920x1080:r=30[hg];" +
        "[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease:flags=bicubic," +
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[vg];" +
        "[hg][vg]overlay=x=0:y=0:shortest=1:format=yuv420,setsar=1[bg];" +
        "[1:v]fps=30,setsar=1[band];" +
        "[bg][band]overlay=x=0:y=918:shortest=1:format=yuv420,format=yuv420p,setsar=1[v]",
    );
  });

  it("skaliert auf die VOLLE Flaeche und ueberlagert das Band bei y = hoehe - hoeheBand", () => {
    const m = masse(kette(162));
    expect(m.scale).toEqual([1920, 1080]);
    expect(m.pad).toEqual([1920, 1080]);
    expect(m.flaeche).toEqual([1920, 1080]);
    expect(m.bandY).toBe(918);
  });

  it("ist EINE Zeile und traegt keine Anfuehrungszeichen", () => {
    // Der Rueckgabewert ist EIN Element des spaeteren Argument-Arrays. Wer
    // Anfuehrungszeichen darum legt, macht sie zum Bestandteil des Filterausdrucks.
    const wert = kette(162);
    expect(wert).not.toMatch(/[\n\r]/);
    expect(wert).not.toMatch(/["']/);
    expect(wert.trim()).toBe(wert);
  });

  it("liefert bei gleichem Aufruf dieselbe Zeichenkette", () => {
    expect(kette(162)).toBe(kette(162));
  });
});

describe("Art B gegen Art A - der optisch groesste Unterschied im Produkt", () => {
  it("verkleinert das Video bei KEINER Bandhoehe", () => {
    // Der Kern von Art B: "das Video behaelt seine volle Groesse; dafuer verdeckt
    // das Band den unteren Bildbereich" (TK 9.2.8). Bei Art A stuende hier
    // 1080 - H. Rechnerisch ueber den ganzen Hoehenbereich, nicht am Beispiel -
    // die eingebaute Vorlage H = 162 allein wuerde einen falschen Bezug nicht
    // aufdecken.
    for (let h = 2; h <= 1078; h += 2) {
      const m = masse(kette(h));
      expect(`H=${h}: ${m.scale.join("x")}`).toBe(`H=${h}: 1920x1080`);
      expect(`H=${h}: ${m.pad.join("x")}`).toBe(`H=${h}: 1920x1080`);
      expect(`H=${h}: ${m.flaeche.join("x")}`).toBe(`H=${h}: 1920x1080`);
    }
  });

  it("setzt die Bandkante fuer JEDE zulaessige Hoehe auf hoehe - hoeheBand, und immer gerade", () => {
    // Ein ungerader Versatz ist in 4:2:0 nicht darstellbar; die Bandkante
    // verliefe quer durch einen Farbblock und erschiene als ausgefranste Linie.
    // Hier ist er gerade, WEIL beide Summanden es sind - der Rumpf weist eine
    // ungerade Bandhoehe ab, statt zu runden.
    for (let h = 2; h <= 1078; h += 2) {
      const m = masse(kette(h));
      expect(`H=${h}: ${m.bandY}`).toBe(`H=${h}: ${1080 - h}`);
      expect(`H=${h}: ${m.bandY % 2}`).toBe(`H=${h}: 0`);
    }
  });

  it("enthaelt kein vstack und keine Markenfarbe - das ist nicht die Split-Kette", () => {
    const wert = kette(162);
    expect(wert).not.toContain("vstack");
    // Eine Markenfarbe ist `0x` + SECHS Hexziffern. Ein blosses "0x" waere hier
    // die falsche Probe: `s=1920x1080` enthaelt es (die 0 der Breite und das x
    // des Masstrenners) - der Test waere rot, ohne dass eine Farbe im Spiel ist.
    expect(wert).not.toMatch(/0x[0-9a-fA-F]{6}/);
    expect(wert).not.toContain("[oben]");
    expect(wert).not.toContain("[unten]");
    // Und in der GANZEN Datei keine Hexfarbe: "hier kommt keine Markenfarbe vor,
    // sondern nur die Balkenfarbe `black` aus 9.2.4" (#165). Eine zweite Quelle
    // fuer eine Markenfarbe liesse die Einblendung lautlos vom Rest abweichen.
    expect(QUELLE).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(QUELLE).not.toMatch(/0x[0-9a-fA-F]{6}/);
  });

  it("fuellt mit schwarz - die Ausnahme mit der Markenfarbe betrifft nur split", () => {
    // "einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), kein Beschnitt"
    // (TK 9.2.4)
    const wert = kette(162);
    expect(wert).toContain("color=c=black:s=");
    expect(wert).toContain(":color=black,setsar=1[vg]");
  });

  it("rechnet NICHTS auf ein Vielfaches von vier - hier gibt es nichts einzupassen", () => {
    // "Die Vierer-Rundung aus TK 9.2.8 betrifft diese Datei NICHT" (#165). Wer sie
    // hier nachzoege, verkleinerte das Video um bis zu 3 px und schuefe die zweite
    // Rundungsstelle, die #239 beseitigt hat.
    for (const verboten of ["16/9", "16 / 9", "1.777", "Math.floor", "Math.round", "Math.ceil"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
    // Und die Bandgeometrie (#239) wird nicht importiert: Ihre sechs uebrigen
    // Felder beschreiben eine Aufteilung, die es in Art B gar nicht gibt.
    expect(CODEZEILEN).not.toContain("band-geometrie");
    expect(CODEZEILEN).not.toContain("BandGeometrie");
    // Gegenprobe an der Hoehe, die bei split NICHT aufgeht: 880 x 16/9 = 1564,44.
    // Taeuchte diese Zahl hier auf, waere die Rundung faelschlich nachgezogen.
    const wert = kette(200);
    expect(wert).not.toContain("1564");
    expect(wert).toContain("scale=1920:1080:");
  });
});

describe("der Bandzweig [1:v] - hier haengt der Alphakanal dran", () => {
  /** Genau der Zweig zwischen dem Eingangslabel und dem Ausgangslabel des Bandes. */
  function bandzweig(wert: string): string {
    return wert.slice(wert.indexOf("[1:v]"), wert.indexOf("[band];") + "[band]".length);
  }

  it("enthaelt KEIN format=yuv420p - sonst wird aus der Einblendung ein deckender Kasten", () => {
    // `yuv420p` hat keinen Alphakanal. Wer die Bandspur vor dem `overlay` in
    // dieses Format zwingt, wirft die Transparenz weg. NACHGEMESSEN: mit dieser
    // einen zusaetzlichen Zeile zeigt der Bandbereich die REINE Bandfarbe
    // (255,0,1) statt der Mischung (132,0,123). Dieselbe Zeile ist bei `split`
    // (#164) richtig - deshalb faellt der Fehler im Code nicht auf.
    expect(bandzweig(kette(162))).not.toContain("format=yuv420p");
    expect(bandzweig(kette(162))).not.toContain("format=");
  });

  it("enthaelt KEIN scale - ein still hochskaliertes Band waere schlimmer als ein Abbruch", () => {
    // Die Pruefung der PNG-Masse gehoert dem render-service (TK 9.2.3,
    // `ungueltiges_element`), der die Datei kennt; diese Funktion sieht sie nie.
    const zweig = bandzweig(kette(162));
    expect(zweig).not.toContain("scale");
    expect(zweig).not.toContain("pad");
    expect(zweig).toBe("[1:v]fps=30,setsar=1[band]");
  });

  it("setzt trotzdem Bildrate und SAR - sonst vermittelt ffmpeg beim overlay", () => {
    expect(bandzweig(kette(162))).toContain("fps=30");
    expect(bandzweig(kette(162))).toContain("setsar=1");
  });
});

describe("Label-Konvention und Aufbau der Kette", () => {
  const wert = kette(162);

  it("verbraucht genau [0:v] und [1:v] und endet auf [v]", () => {
    expect(wert).toContain("[0:v]");
    expect(wert).toContain("[1:v]");
    expect(wert).not.toContain("[2:v]");
    expect(wert.endsWith("[v]")).toBe(true);
  });

  it("hat genau ZWEI overlay-Filter, beide mit shortest=1 und format=yuv420", () => {
    const treffer = wert.match(/overlay=/g);
    expect(treffer).toHaveLength(2);
    // Der erste flacht den Hintergrund ab, der zweite legt das Band auf.
    expect(wert).toContain("[hg][vg]overlay=x=0:y=0:shortest=1:format=yuv420,");
    expect(wert).toContain("[bg][band]overlay=x=0:y=918:shortest=1:format=yuv420,");
    // `shortest=1` beendet das Overlay mit der Quelle - die `color`-Quelle ist
    // unendlich, ohne das liefe der Clip endlos weiter.
    expect(wert.match(/shortest=1/g)).toHaveLength(2);
  });

  it("legt das Format erst NACH dem Mischen fest und endet auf format=yuv420p,setsar=1[v]", () => {
    expect(wert.endsWith("format=yuv420p,setsar=1[v]")).toBe(true);
    // Genau EINMAL in der ganzen Kette - und zwar am Schluss. Stuende es schon
    // hinter dem ersten overlay, waere es harmlos; auf dem Bandzweig waere es der
    // Fehler aus dem Test oben.
    expect(wert.match(/format=yuv420p/g)).toHaveLength(1);
    expect(RENDER_PROFILE.pixelformat).toBe("yuv420p");
  });

  it("bildet den Bandversatz als Zahl, nicht als ffmpeg-Ausdruck", () => {
    // Ein `y=H-h` waere die zweite Stelle, die den Versatz bestimmt, und ergaebe
    // bei einem falsch bemassten Band lautlos etwas anderes.
    expect(wert).not.toContain("overlay=x=0:y=(");
    expect(wert).not.toContain("y=H-h");
    expect(wert).toContain("y=918:");
  });

  it("passt ein und beschneidet nicht", () => {
    // "einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), kein Beschnitt"
    // (TK 9.2.4) - bei `einblendung` gilt das unveraendert.
    expect(wert).toContain("force_original_aspect_ratio=decrease");
    expect(wert).not.toContain("force_original_aspect_ratio=increase");
    expect(wert).not.toContain("crop");
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
    const m = masse(kette(120, abgewandelt({ breite: 1280, hoehe: 720, fps: 25 })));
    expect(m).toEqual({
      flaeche: [1280, 720],
      flaecheRate: 25,
      scale: [1280, 720],
      pad: [1280, 720],
      bandY: 600,
      fpsVideo: 25,
      fpsBand: 25,
    });
  });

  it("setzt die Bildrate an allen drei Stellen - Flaeche, Video und Band", () => {
    // Verschiedene Raten zwaengen ffmpeg beim Overlay zu vermitteln; das Band
    // liefe gegen das Video weg.
    for (const fps of [1, 24, 25, 30, 50, 60]) {
      const m = masse(kette(162, abgewandelt({ fps })));
      expect(m.flaecheRate).toBe(fps);
      expect(m.fpsVideo).toBe(fps);
      expect(m.fpsBand).toBe(fps);
    }
  });

  it("schreibt kein Mass als Literal in den ausfuehrbaren Teil", () => {
    for (const literal of ["1920", "1080", "918", "162", "30"]) {
      expect(CODEZEILEN).not.toContain(literal);
    }
  });
});

describe("Fehlerpfade - immer ungueltige_eingabe, nie ein Wurf", () => {
  const schlecht: [string, unknown, unknown][] = [
    ["Bandhoehe ist NaN", Number.NaN, RENDER_PROFILE],
    ["Bandhoehe ist unendlich", Number.POSITIVE_INFINITY, RENDER_PROFILE],
    ["Bandhoehe ist 0", 0, RENDER_PROFILE],
    ["Bandhoehe ist negativ", -162, RENDER_PROFILE],
    ["Bandhoehe ist gebrochen", 162.5, RENDER_PROFILE],
    ["Bandhoehe ist ungerade (163)", 163, RENDER_PROFILE],
    ["Bandhoehe erreicht die Bildhoehe (1080)", 1080, RENDER_PROFILE],
    ["Bandhoehe uebersteigt die Bildhoehe", 1200, RENDER_PROFILE],
    ["Bandhoehe fehlt", undefined, RENDER_PROFILE],
    ["Profil fehlt", 162, undefined],
    ["Profil ist null", 162, null],
    ["Breite ist NaN", 162, abgewandelt({ breite: Number.NaN })],
    ["Breite ist 0", 162, abgewandelt({ breite: 0 })],
    ["Breite ist ungerade", 162, abgewandelt({ breite: 1921 })],
    ["Hoehe ist gebrochen", 162, abgewandelt({ hoehe: 1080.5 })],
    ["Hoehe ist ungerade", 162, abgewandelt({ hoehe: 1079 })],
    ["fps ist 0", 162, abgewandelt({ fps: 0 })],
    ["fps ist gebrochen", 162, abgewandelt({ fps: 29.97 })],
    ["fps ist negativ", 162, abgewandelt({ fps: -30 })],
  ];

  for (const [name, h, profil] of schlecht) {
    it(`meldet ungueltige_eingabe: ${name}`, () => {
      expect(() => baueEinblendungFilter(h as number, profil as RenderProfile)).not.toThrow();
      expect(fehler(h, profil).code).toBe("ungueltige_eingabe");
    });
  }

  it("nennt bei einer ungeraden Bandhoehe die 4:2:0-Farbunterabtastung als Grund", () => {
    const meldung = fehler(163, RENDER_PROFILE).meldung;
    expect(meldung).toContain("yuv420p");
    expect(meldung).toContain("4:2:0");
  });

  it("nennt bei einer zu grossen Bandhoehe den zulaessigen Bereich", () => {
    expect(fehler(1080, RENDER_PROFILE).meldung).toContain("1079");
  });

  it("prueft die Masse vor der Geradzahligkeit", () => {
    // Sonst meldete ein NaN "ungerade" - eine Meldung, die in die Irre fuehrt.
    expect(fehler(Number.NaN, RENDER_PROFILE).meldung).not.toContain("ungerade");
  });

  it("liefert in KEINEM Fehlerfall eine Kette mit korrigierten Zahlen", () => {
    for (const h of [163, 1080, 0, 162.5]) {
      expect(baueEinblendungFilter(h, RENDER_PROFILE).ok).toBe(false);
    }
  });

  it("wirft bei keiner Eingabe - auch nicht bei voellig fremden Werten", () => {
    const fremd: unknown[] = [undefined, null, "162", {}, [], Symbol.iterator, () => 1];
    for (const wert of fremd) {
      expect(() =>
        baueEinblendungFilter(wert as number, wert as RenderProfile),
      ).not.toThrow();
    }
  });
});

describe("die Funktion ist rein", () => {
  it("importiert nichts, was Wirkung haette", () => {
    for (const verboten of [
      "node:fs", "node:path", "node:child_process", "./prozess", "ffprobe",
      "config-store", "leseMarke", "vorlagen", "filter-split",
    ]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
    // Nur TYP-Importe. Insbesondere KEIN Import aus #164: "diese Datei importiert
    // aus #164 nichts - insbesondere kein `markenFarbeZuFfmpeg`" (#165).
    expect(CODEZEILEN.match(/^import .*$/gm)).toEqual([
      "import type { RenderProfile } from '../../shared/contracts/render-profile'",
      "import type { Ergebnis } from '../../shared/contracts/ergebnis'",
    ]);
  });

  it("veraendert das uebergebene Profil nicht", () => {
    const vorher = structuredClone(RENDER_PROFILE);
    baueEinblendungFilter(162, RENDER_PROFILE);
    expect(RENDER_PROFILE).toEqual(vorher);
  });

  it("kennt keine Fachbegriffe", () => {
    for (const verboten of ["Projekt", "Aktion", "Listenelement", "Asset", "Auftrag"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });
});
