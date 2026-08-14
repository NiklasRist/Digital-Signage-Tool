// Tests zu #163 - die Filterkette der Vollbild-Normalisierung.
//
// WAS HIER PRUEFBAR IST UND WAS NICHT: Die Datei baut ausschliesslich eine
// Zeichenkette. Ob ffmpeg sie annimmt und WELCHE Geometrie dabei entsteht,
// entscheidet sich erst beim Aufruf - das gehoert in den langsamen
// Integrationstest-Ordner (#11) und ist nicht Teil dieses Issues. Deshalb startet
// hier kein Prozess.
//
// Beim Bauen wurde die Kette dennoch mit dem mitgelieferten ffmpeg 6.1.1
// nachgemessen, und die dabei erzielten Werte stehen als Kommentar in der
// Quelldatei. Der Zeichenketten-Vergleich in "die nachgemessene Kette" ist der
// Anker dazu: Aendert jemand die Kette, wird dieser Test rot und die Messung ist
// zu wiederholen. Ein gruener Test ohne diesen Anker hiesse nur, dass eine
// Zeichenkette entsteht - nicht, dass es DIE gemessene ist.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { baueVollbildFilter } from "../../src/main/ffmpeg-adapter/filter-vollbild";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { RenderProfile } from "../../src/shared/contracts/render-profile";

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/filter-vollbild.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren nennen das Ausgabe-
// Profil und die nachgemessenen Bildgroessen woertlich - das ist erwuenscht und
// darf die Literal-Probe nicht ausloesen. Dieselbe Trennung benutzt der Test zu
// #161 im selben Modul.
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

/** Die Kette oder ein aussagekraeftiger Fehlschlag - erspart jedem Test die Huellen-Pruefung. */
function kette(hintergrund: string, profil: RenderProfile): string {
  const ergebnis = baueVollbildFilter(hintergrund, profil);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/** Der Fehler oder ein aussagekraeftiger Erfolg. */
function fehler(hintergrund: unknown, profil: unknown): { code: string; meldung: string } {
  const ergebnis = baueVollbildFilter(hintergrund as string, profil as RenderProfile);
  if (ergebnis.ok) throw new Error(`unerwartet gelungen: ${ergebnis.wert}`);
  return ergebnis.fehler;
}

describe("die nachgemessene Kette", () => {
  it("ist fuer RENDER_PROFILE genau die Zeichenkette, mit der gemessen wurde", () => {
    // Mit GENAU dieser Kette wurde nachgemessen (ffmpeg 6.1.1 + ffprobe):
    //   Quelle 640x480   -> 1440 x 1080 bei x=240   Pillarbox, kein Beschnitt
    //   Quelle 1000x100  -> 1920 x  192 bei y=444   Letterbox
    //   Quelle 3840x1600 -> 1920 x  800 bei y=140   Letterbox
    //   Quelle 1920x1080 -> vollflaechig, keine Balken
    //   Quelle 32x32     -> 1080 x 1080 bei x=420   sehr klein, hochskaliert
    //   Quelle 200x800   ->  270 x 1080 bei x=824   ungerader Versatz, von `pad`
    //                                               auf das Farbraster abgerundet
    // Ergebnis in jedem Fall: 1920x1080, SAR 1:1, yuv420p, 30 fps, High/4.0.
    expect(kette("black", RENDER_PROFILE)).toBe(
      "color=c=black:s=1920x1080:r=30[hg];" +
        "[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease:flags=bicubic," +
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[vg];" +
        "[hg][vg]overlay=x=0:y=0:shortest=1:format=yuv420,format=yuv420p,setsar=1[v]",
    );
  });

  it("ist EINE Zeile und traegt keine Anfuehrungszeichen", () => {
    // Der Rueckgabewert ist EIN Element des spaeteren Argument-Arrays. Wer
    // Anfuehrungszeichen darum legt, macht sie zum Bestandteil des Filterausdrucks -
    // ffmpeg meldet dann einen unverstaendlichen Parserfehler.
    const wert = kette("black", RENDER_PROFILE);
    expect(wert).not.toMatch(/[\n\r]/);
    expect(wert).not.toMatch(/["']/);
    expect(wert.trim()).toBe(wert);
  });

  it("liefert bei gleichem Aufruf dieselbe Zeichenkette", () => {
    expect(kette("black", RENDER_PROFILE)).toBe(kette("black", RENDER_PROFILE));
  });
});

describe("Label-Konvention des ffmpeg-adapter", () => {
  it("verbraucht [0:v], endet auf [v] und kennt kein [1:v]", () => {
    const wert = kette("black", RENDER_PROFILE);
    expect(wert).toContain("[0:v]");
    expect(wert.endsWith("[v]")).toBe(true);
    // Die Bandspur ist hier NICHT vorhanden. Stuende sie in der Kette, verlangte
    // der Lauf einen zweiten Eingang, den niemand liefert.
    expect(wert).not.toContain("[1:v]");
  });
});

describe("Seitenverhaeltnis-Politik: einpassen, nie beschneiden", () => {
  const wert = kette("black", RENDER_PROFILE);

  it("passt ein und beschneidet nicht", () => {
    // "einpassen + schwarze Balken (pad; Letterbox/Pillarbox), kein Beschnitt"
    // (TK 9.2.4). `increase` + `crop` waere die verbotene Gegenrichtung, ein
    // fehlendes force_original_aspect_ratio verzerrte.
    expect(wert).toContain("force_original_aspect_ratio=decrease");
    expect(wert).not.toContain("force_original_aspect_ratio=increase");
    expect(wert).not.toContain("crop");
  });

  it("zentriert die Balken ueber die Masse des Ergebnisses, nicht ueber geratene Zahlen", () => {
    // (ow-iw)/2 rechnet ffmpeg aus dem TATSAECHLICH dekodierten Bild. Ein hier
    // hingeschriebener Versatz waere eine zweite Wahrheit ueber die Quellgroesse -
    // und die falsche, sobald ein Video einen Drehungs-Vermerk traegt.
    expect(wert).toContain(":(ow-iw)/2:(oh-ih)/2:");
  });

  it("dreht nicht - die Autorotation hat ffmpeg beim Dekodieren schon angewandt", () => {
    // Ein Drehfilter ZUSAETZLICH zur greifenden Autorotation drehte doppelt; das
    // Video stuende im Endvideo quer.
    for (const verboten of ["transpose", "rotate", "hflip", "vflip", "noautorotate"]) {
      expect(wert).not.toContain(verboten);
    }
  });

  it("pinnt den Skalierer und haelt SAR vor UND nach dem Overlay fest", () => {
    // Der Vorgabe-Skalierer ist buildabhaengig; gepinnt bleibt dieselbe Quelle auf
    // jedem Rechner pixelgleich. `setsar` steht zweimal, weil manche Filter das
    // Pixel-Seitenverhaeltnis zuruecksetzen - der Wert muss am Ausgang stehen.
    expect(wert).toContain("flags=bicubic");
    const vorOverlay = wert.slice(0, wert.indexOf("overlay="));
    const abOverlay = wert.slice(wert.indexOf("overlay="));
    expect(vorOverlay).toContain("setsar=1");
    expect(abOverlay).toContain("setsar=1");
    expect(wert.endsWith("setsar=1[v]")).toBe(true);
  });

  it("legt das Bild auf eine deckende Flaeche und beendet sie mit der Quelle", () => {
    // Ohne die Flaeche verlaere ein Quellbild MIT Alphakanal seinen Alphakanal bei
    // format=yuv420p, und transparente Pixel zeigten ihren gespeicherten,
    // undefinierten RGB-Wert. Ohne shortest=1 liefe der Clip endlos: die
    // color-Quelle ist unendlich.
    expect(wert).toContain("[hg][vg]overlay=");
    expect(wert).toContain("shortest=1");
    expect(wert).toContain("overlay=x=0:y=0:");
  });

  it("nagelt das Pixelformat des Ausgabe-Profils fest", () => {
    // Consumer-TVs decodieren NUR 4:2:0/8 Bit. `format=yuv420` ist die
    // Overlay-Option (Mischen im YUV-Raum), `format=yuv420p` der Abschluss.
    expect(wert).toContain("overlay=x=0:y=0:shortest=1:format=yuv420,");
    expect(wert).toContain(",format=yuv420p,");
    expect(RENDER_PROFILE.pixelformat).toBe("yuv420p");
  });
});

describe("jede Zahl stammt aus dem Profil", () => {
  /** Zieht die Masse aus den drei Stellen, an denen sie in der Kette stehen. */
  function masse(wert: string): {
    flaeche: [number, number];
    scale: [number, number];
    pad: [number, number];
    fpsFilter: number;
    flaecheRate: number;
  } {
    const flaeche = /color=c=[^:]+:s=(\d+)x(\d+):r=(\d+)\[hg\]/.exec(wert);
    const scale = /scale=(\d+):(\d+):force_original_aspect_ratio/.exec(wert);
    const pad = /pad=(\d+):(\d+):\(ow-iw\)/.exec(wert);
    const fps = /\[0:v\]fps=(\d+),/.exec(wert);
    if (flaeche === null || scale === null || pad === null || fps === null) {
      throw new Error(`Kette nicht auswertbar: ${wert}`);
    }
    return {
      flaeche: [Number(flaeche[1]), Number(flaeche[2])],
      flaecheRate: Number(flaeche[3]),
      scale: [Number(scale[1]), Number(scale[2])],
      pad: [Number(pad[1]), Number(pad[2])],
      fpsFilter: Number(fps[1]),
    };
  }

  it("laesst ein abgewandeltes Profil an ALLEN Stellen durchschlagen", () => {
    const m = masse(kette("black", abgewandelt({ breite: 1280, hoehe: 720, fps: 25 })));
    expect(m).toEqual({
      flaeche: [1280, 720],
      flaecheRate: 25,
      scale: [1280, 720],
      pad: [1280, 720],
      fpsFilter: 25,
    });
  });

  it("nennt an allen drei Geometrie-Stellen dasselbe Mass - rechnerisch, nicht am Beispiel", () => {
    // Ein Ausreisser an EINER der drei Stellen erzeugte einen Zwischenclip, der
    // nicht die Profilgroesse hat. `concat -c copy` scheiterte daran NICHT - die
    // fertige Datei friert am Fernseher nach dem ersten Segment ein.
    for (let breite = 2; breite <= 4096; breite += 2) {
      const hoehe = breite % 4 === 0 ? breite / 2 : breite;
      const m = masse(kette("black", abgewandelt({ breite, hoehe })));
      const hinweis = `${breite}x${hoehe}`;
      expect(`${hinweis}: ${m.flaeche.join("x")}`).toBe(`${hinweis}: ${breite}x${hoehe}`);
      expect(`${hinweis}: ${m.scale.join("x")}`).toBe(`${hinweis}: ${breite}x${hoehe}`);
      expect(`${hinweis}: ${m.pad.join("x")}`).toBe(`${hinweis}: ${breite}x${hoehe}`);
      // yuv420p tastet die Farbe in BEIDEN Richtungen um zwei unter: Was die Kette
      // als Zielmass nennt, muss gerade sein. Der zentrierte Versatz ist Sache von
      // `pad` - der Filter rundet ihn selbst auf das Farbraster ab (nachgemessen).
      expect(`${hinweis}: ${m.flaeche[0] % 2}${m.flaeche[1] % 2}`).toBe(`${hinweis}: 00`);
    }
  });

  it("uebernimmt die Bildrate an beiden Stellen und rundet sie nicht", () => {
    for (const fps of [1, 24, 25, 30, 50, 60, 120]) {
      const m = masse(kette("black", abgewandelt({ fps })));
      expect(m.fpsFilter).toBe(fps);
      // Die Flaeche muss in der ZIELrate erzeugt werden, sonst muesste ffmpeg beim
      // Overlay zwischen zwei Raten vermitteln.
      expect(m.flaecheRate).toBe(fps);
    }
  });

  it("schreibt kein Mass des Profils als Literal in den Quelltext", () => {
    for (const literal of ["1920", "1080", "30"]) {
      expect(CODEZEILEN).not.toContain(literal);
    }
  });
});

describe("der Hintergrund reist durch, ohne den Graphen zu oeffnen", () => {
  it("setzt die Farbe an BEIDEN Stellen - Flaeche und Balken", () => {
    // Zwei verschiedene Farben ergaeben einen sichtbaren Rand zwischen Balken und
    // Flaeche, sobald die eingepasste Groesse nicht auf das Pixel aufgeht.
    const wert = kette("0x2F2E2E", RENDER_PROFILE);
    expect(wert).toContain("color=c=0x2F2E2E:s=");
    expect(wert).toContain(":color=0x2F2E2E,setsar=1[vg]");
    expect(wert).not.toContain("black");
  });

  it("weist jedes Zeichen ab, das im Filtergraph trennt", () => {
    // Ohne diese Abweisung koennte ein durchgereichter Farbwert den Graphen um
    // beliebige weitere Filter erweitern.
    for (const boese of [
      "black,crop=100:100",
      "black;[0:v]null[v]",
      "black[x]",
      "bl]ack",
      "black'",
      'black"',
      "black\\",
      "black white",
    ]) {
      const f = fehler(boese, RENDER_PROFILE);
      expect(f.code).toBe("ungueltige_eingabe");
      expect(f.meldung.length).toBeGreaterThan(0);
    }
  });

  it("laesst zulaessige Farbausdruecke durch", () => {
    for (const gut of ["black", "white", "0xFF4040", "0x2F2E2E"]) {
      expect(kette(gut, RENDER_PROFILE)).toContain(`color=c=${gut}:s=`);
    }
  });
});

describe("Fehlerpfade - immer ungueltige_eingabe, nie ein Wurf", () => {
  const schlecht: [string, unknown, unknown][] = [
    ["leerer Hintergrund", "", RENDER_PROFILE],
    ["Hintergrund ist kein Text", 42, RENDER_PROFILE],
    ["Hintergrund fehlt", undefined, RENDER_PROFILE],
    ["fps ist NaN", "black", abgewandelt({ fps: Number.NaN })],
    ["fps ist unendlich", "black", abgewandelt({ fps: Number.POSITIVE_INFINITY })],
    ["fps ist 0", "black", abgewandelt({ fps: 0 })],
    ["fps ist gebrochen", "black", abgewandelt({ fps: 29.97 })],
    ["Breite ist negativ", "black", abgewandelt({ breite: -2 })],
    ["Breite ist gebrochen", "black", abgewandelt({ breite: 1920.5 })],
    ["Breite ist kein Text-freier Wert", "black", abgewandelt({ breite: "1920" })],
    ["Breite ist ungerade", "black", abgewandelt({ breite: 1921 })],
    ["Hoehe ist ungerade", "black", abgewandelt({ hoehe: 1079 })],
    ["Profil fehlt", "black", undefined],
    ["Profil ist null", "black", null],
  ];

  for (const [name, hintergrund, profil] of schlecht) {
    it(`meldet ungueltige_eingabe: ${name}`, () => {
      expect(() => baueVollbildFilter(hintergrund as string, profil as RenderProfile)).not.toThrow();
      expect(fehler(hintergrund, profil).code).toBe("ungueltige_eingabe");
    });
  }

  it("nennt bei einem schiefen Mass das betroffene Feld", () => {
    expect(fehler("black", abgewandelt({ fps: Number.NaN })).meldung).toContain("profil.fps");
    expect(fehler("black", abgewandelt({ breite: 1921 })).meldung).toContain("profil.breite");
    expect(fehler("black", abgewandelt({ hoehe: 1079 })).meldung).toContain("profil.hoehe");
  });

  it("nennt bei einer ungeraden Kante yuv420p als Grund", () => {
    expect(fehler("black", abgewandelt({ hoehe: 1079 })).meldung).toContain("yuv420p");
  });

  it("nennt das gefundene Trennzeichen", () => {
    expect(fehler("black,crop=2:2", RENDER_PROFILE).meldung).toContain('","');
    expect(fehler("black white", RENDER_PROFILE).meldung).toContain("Leerzeichen");
  });

  it("prueft die Masse vor der Geradzahligkeit", () => {
    // Sonst meldete ein NaN "ungerade" - eine Meldung, die in die Irre fuehrt.
    expect(fehler("black", abgewandelt({ breite: Number.NaN })).meldung).not.toContain("ungerade");
  });
});

describe("die Funktion ist rein", () => {
  it("importiert nichts, was Wirkung haette", () => {
    for (const verboten of ["node:fs", "node:path", "node:child_process", "./prozess", "ffprobe"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
    // Nur TYP-Importe: ein Wertimport braechte Laufzeit-Abhaengigkeiten in eine
    // Funktion, die nichts als eine Zeichenkette bauen soll.
    expect(CODEZEILEN.match(/^import .*$/gm)).toEqual([
      "import type { RenderProfile } from '../../shared/contracts/render-profile'",
      "import type { Ergebnis } from '../../shared/contracts/ergebnis'",
    ]);
  });

  it("veraendert das uebergebene Profil nicht", () => {
    const vorher = structuredClone(RENDER_PROFILE);
    baueVollbildFilter("black", RENDER_PROFILE);
    expect(RENDER_PROFILE).toEqual(vorher);
  });

  it("kennt keine Fachbegriffe", () => {
    // Diese Datei bekommt Zahlen und eine Farbe und liefert eine Zeichenkette.
    for (const verboten of ["Projekt", "Aktion", "Vorlage", "Listenelement", "Asset", "Auftrag"]) {
      expect(CODEZEILEN).not.toContain(verboten);
    }
  });
});
