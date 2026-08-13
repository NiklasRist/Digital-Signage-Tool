import { describe, expect, it } from "vitest";

import { werteMetadatenAus } from "../../src/main/media-service/metadaten";

import type { ImportFehlercode } from "../../src/main/media-service/fehlercodes";

// Unit-Test zu #83 (Metadaten auswerten: Masse, Rotation, Dauer).
//
// Kein Mock, kein Aufraeumen, kein Testvideo: Die Funktion ist rein und synchron. Genau
// dafuer ist der Schnitt zwischen #82 (beschaffen) und #83 (deuten) gemacht - jeder
// Sonderfall ist ein von Hand geschriebenes Objekt.
//
// WOHER DIE TESTDATEN STAMMEN: Sie sind NICHT erfunden. Alle unten verwendeten Strukturen
// sind am 13.08.2026 vom GEBUENDELTEN ffprobe abgeschrieben (ffprobe 4.0.2 aus
// ffprobe-static 3.1.0, dasselbe Binary, das #6 im Betrieb ermittelt), erzeugt mit dem
// gebuendelten ffmpeg 6.1.1. Deshalb steht hier `width: 1920` als ZAHL, aber
// `duration: "1.000000"` als ZEICHENKETTE - genau so kommt es an. Ein Test mit
// ausgedachtem JSON haette diesen Unterschied verfehlt, und er ist der Kern der Aufgabe.

/**
 * Ein Video-Stream, wie ihn das gebuendelte ffprobe liefert - verbatim gemessen an einer
 * MP4-Datei mit ECHTER Display-Matrix (erzeugt mit `ffmpeg -display_rotation 90`).
 *
 * Die Felder jenseits von width/height/duration/tags stehen absichtlich mit drin: Sie
 * belegen, dass die Auswertung in einem realen, vollen Objekt das Richtige greift und
 * nicht bloss in einem auf drei Felder abgemagerten.
 *
 * BEACHTENSWERT und der Grund, warum dieser Datensatz hier steht: `tags.rotate` ist
 * `"270"`, waehrend `side_data_list[0].rotation` `90` ist - die beiden Quellen haben
 * ENTGEGENGESETZTE Vorzeichen. Fuer die Frage, um die es hier geht, ist das gleichgueltig:
 * 90 und 270 fuehren beide zum Tausch. Genau deshalb ist der Achsentausch gegen die
 * Vorzeichenkonvention unempfindlich.
 */
const ECHTER_ROTIERTER_STREAM = {
  index: 0,
  codec_name: "h264",
  codec_type: "video",
  width: 1920,
  height: 1080,
  sample_aspect_ratio: "1:1",
  duration: "1.000000",
  nb_frames: "25",
  tags: {
    rotate: "270",
    language: "und",
    handler_name: "VideoHandler",
    encoder: "Lavc60.31.102 libx264",
  },
  side_data_list: [
    {
      side_data_type: "Display Matrix",
      displaymatrix:
        "\n00000000:            0      -65536           0\n00000001:        65536           0           0\n00000002:            0           0  1073741824\n",
      rotation: 90,
    },
  ],
};

/** Baut eine Rohausgabe in der gemessenen Form: `streams` als Liste, `format` daneben. */
function roh(streams: unknown[], format?: Record<string, unknown>): unknown {
  return format === undefined ? { streams } : { streams, format };
}

/** Ein Video-Stream mit den gemessenen Feldtypen; `rotate` nur, wenn angegeben. */
function videoStrom(felder: Record<string, unknown> = {}): Record<string, unknown> {
  return { index: 0, codec_name: "h264", codec_type: "video", width: 1920, height: 1080, ...felder };
}

/** Erwartet Erfolg und liefert den Wert - erspart jedem Test die Aufweitung von Hand. */
function erwarteErfolg(ergebnis: ReturnType<typeof werteMetadatenAus>) {
  expect(ergebnis.ok).toBe(true);
  if (!ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
  return ergebnis.wert;
}

/** Erwartet den einen fachlichen Fehlercode dieser Funktion. */
function erwarteProbeFehler(ergebnis: ReturnType<typeof werteMetadatenAus>): void {
  expect(ergebnis.ok).toBe(false);
  if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
  expect(ergebnis.fehler.code).toBe("probe_fehler");
  // Die Meldung dient der Fehlersuche; leer waere sie nutzlos.
  expect(ergebnis.fehler.meldung).not.toBe("");
}

describe("Masse und Rotation", () => {
  it("uebernimmt Masse ohne Rotations-Tag unveraendert", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom()], { duration: "12.033000" }), "video"),
    );
    expect(wert.maße).toEqual({ breite: 1920, höhe: 1080 });
  });

  it.each([
    ["90", { breite: 1080, höhe: 1920 }],
    ["270", { breite: 1080, höhe: 1920 }],
    // "-90" ist dieselbe Drehung wie "270", nur anders geschrieben. Ohne die
    // Normalisierung ((n % 360) + 360) % 360 bliebe genau dieser Fall unerkannt - und der
    // Unerkannte ist der Hochkant-Fall.
    ["-90", { breite: 1080, höhe: 1920 }],
    ["450", { breite: 1080, höhe: 1920 }],
    // 180 dreht das Bild, nicht die Kanten.
    ["180", { breite: 1920, höhe: 1080 }],
    ["-180", { breite: 1920, höhe: 1080 }],
    ["0", { breite: 1920, höhe: 1080 }],
    ["360", { breite: 1920, höhe: 1080 }],
  ])("tauscht bei rotate=%s die Kanten zu %o", (rotate, erwartet) => {
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ tags: { rotate } })], { duration: "12.033000" }),
        "video",
      ),
    );
    expect(wert.maße).toEqual(erwartet);
  });

  it("liest die Drehung aus einer ECHTEN Datei mit Display-Matrix (1920x1080 -> hochkant)", () => {
    // Der Kern des Issues an echten Daten: Das Video ist 1920x1080 CODIERT und wird
    // hochkant ANGEZEIGT. Wer stream.width/height ungeprueft uebernimmt, speichert hier
    // dauerhaft ein Querformat - und die Balken landen spaeter am Fernseher auf der
    // falschen Seite.
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([ECHTER_ROTIERTER_STREAM], { format_name: "mov,mp4,m4a,3gp,3g2,mj2", duration: "1.000000" }),
        "video",
      ),
    );
    expect(wert).toEqual({ maße: { breite: 1080, höhe: 1920 }, dauer: 1 });
  });

  it.each([
    ["fehlendes tags-Objekt", videoStrom()],
    ["tags ohne rotate", videoStrom({ tags: { language: "und", handler_name: "VideoHandler" } })],
    ["nicht numerischer Wert", videoStrom({ tags: { rotate: "kaputt" } })],
    ["leere Zeichenkette", videoStrom({ tags: { rotate: "" } })],
    ["rotate ist null", videoStrom({ tags: { rotate: null } })],
    ["tags ist eine Liste", videoStrom({ tags: [] })],
  ])("behandelt %s als Drehung 0 - ohne Fehler und ohne Tausch", (_fall, strom) => {
    const wert = erwarteErfolg(werteMetadatenAus(roh([strom], { duration: "12.033000" }), "video"));
    expect(wert.maße).toEqual({ breite: 1920, höhe: 1080 });
  });

  it("rundet nicht ganzzahlige Masse mit Math.round", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ width: 1919.6, height: 1080.4 })], { duration: "12.033000" }),
        "video",
      ),
    );
    expect(wert.maße).toEqual({ breite: 1920, höhe: 1080 });
  });

  it("rundet VOR dem Tausch, sodass auch gedrehte Masse ganzzahlig sind", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ width: 1919.6, height: 1080.4, tags: { rotate: "90" } })], {
          duration: "12.033000",
        }),
        "video",
      ),
    );
    expect(wert.maße).toEqual({ breite: 1080, höhe: 1920 });
    expect(Number.isInteger(wert.maße.breite)).toBe(true);
    expect(Number.isInteger(wert.maße.höhe)).toBe(true);
  });
});

describe("Auswahl des Streams", () => {
  it("nimmt den ersten Video-Stream, auch wenn die Tonspur davor steht", () => {
    // Gemessen: Ein MP4 mit Bild und Ton liefert beide Streams in EINER Liste; die
    // Reihenfolge bestimmt die Datei. `streams[0]` waere hier die Tonspur - ohne width
    // und height - und eine voellig gesunde Datei liesse sich nicht importieren.
    const ton = {
      index: 0,
      codec_name: "aac",
      codec_type: "audio",
      sample_rate: "44100",
      channels: 1,
      duration: "2.000000",
    };
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([ton, videoStrom({ index: 1, width: 640, height: 480, duration: "2.000000" })], {
          duration: "2.000000",
        }),
        "video",
      ),
    );
    expect(wert.maße).toEqual({ breite: 640, höhe: 480 });
  });

  it("nimmt bei mehreren Video-Streams den ersten", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ width: 640, height: 480 }), videoStrom({ index: 1, width: 320, height: 240 })], {
          duration: "2.000000",
        }),
        "video",
      ),
    );
    expect(wert.maße).toEqual({ breite: 640, höhe: 480 });
  });
});

describe("Dauer bei Video", () => {
  it("liest format.duration als Zahl mit drei Dezimalstellen", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom()], { duration: "12.033000" }), "video"),
    );
    expect(wert.dauer).toBe(12.033);
    expect(typeof wert.dauer).toBe("number");
  });

  it("rundet 12.0334 auf 12.033 - und ausdruecklich NICHT auf 12", () => {
    // Der teuerste denkbare Fehler dieser Funktion, weil er richtig aussieht: Aus 12,033 s
    // wuerden 12 s, und der frame-genaue Schnitt verschoebe sich um bis zu einer Sekunde -
    // bei jedem Element, ueber die Schleife aufsummiert.
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom()], { duration: "12.0334" }), "video"),
    );
    expect(wert.dauer).toBe(12.033);
    expect(wert.dauer).not.toBe(12);
  });

  it("rundet die vierte Dezimalstelle kaufmaennisch auf", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom()], { duration: "1.033984" }), "video"),
    );
    expect(wert.dauer).toBe(1.034);
  });

  it("faellt auf die Stream-Dauer zurueck, wenn format.duration fehlt", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom({ duration: "1.033984" })], { size: "2495" }), "video"),
    );
    expect(wert.dauer).toBe(1.034);
  });

  it("faellt auf die Stream-Dauer zurueck, wenn es gar kein format-Objekt gibt", () => {
    const wert = erwarteErfolg(werteMetadatenAus(roh([videoStrom({ duration: "2.000000" })]), "video"));
    expect(wert.dauer).toBe(2);
  });

  it.each([
    ["N/A", "N/A"],
    ["leer", ""],
    ["null", null],
  ])("faellt bei unbrauchbarem format.duration (%s) auf den Stream zurueck", (_fall, wertImContainer) => {
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ duration: "2.000000" })], { duration: wertImContainer }),
        "video",
      ),
    );
    expect(wert.dauer).toBe(2);
  });

  it("gibt dem Container-Wert Vorrang vor dem Stream-Wert", () => {
    // Der Container beschreibt die Laenge, die ein Abspieler tatsaechlich zeigt; der
    // Video-Stream kann kuerzer sein als die Datei (etwa wenn eine laengere Tonspur den
    // Container bestimmt). Die beiden Werte muessen sich hier deutlich unterscheiden,
    // sonst prueft der Test die Reihenfolge gar nicht: Ein erster Anlauf stand auf dem
    // gemessenen Paar "1.034000"/"1.033984" - beide runden auf 1.034, und eine vertauschte
    // Rangfolge waere unbemerkt durchgegangen.
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ duration: "1.033984" })], { duration: "2.000000" }),
        "video",
      ),
    );
    expect(wert.dauer).toBe(2);
    expect(wert.dauer).not.toBe(1.034);
  });
});

describe("Dauer bei Bild", () => {
  it("liefert null fuer ein PNG - gemessen: dort steht ueberhaupt keine Dauer", () => {
    // Verbatim gemessen an einer echten PNG-Datei: codec_type ist "video" (Bilder
    // erscheinen als Video-Stream), und weder Stream noch Container nennen eine Dauer.
    const png = {
      index: 0,
      codec_name: "png",
      codec_type: "video",
      width: 800,
      height: 600,
      pix_fmt: "rgb24",
      r_frame_rate: "25/1",
      avg_frame_rate: "0/0",
    };
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([png], { format_name: "png_pipe", size: "2955" }), "bild"),
    );
    expect(wert).toEqual({ maße: { breite: 800, höhe: 600 }, dauer: null });
  });

  it("ignoriert eine vorhandene Dauer und liefert trotzdem null", () => {
    // Der Typ entscheidet, nicht der Fund: Meldet ffprobe fuer ein Einzelbild eine
    // erfundene Dauer, waere sie schlicht falsch.
    const wert = erwarteErfolg(
      werteMetadatenAus(
        roh([videoStrom({ codec_name: "mjpeg", duration: "0.040000" })], { duration: "0.040000" }),
        "bild",
      ),
    );
    expect(wert.dauer).toBeNull();
  });

  it("korrigiert die Rotation auch bei Bildern", () => {
    const wert = erwarteErfolg(
      werteMetadatenAus(roh([videoStrom({ tags: { rotate: "90" } })]), "bild"),
    );
    expect(wert).toEqual({ maße: { breite: 1080, höhe: 1920 }, dauer: null });
  });
});

describe("Fehlerpfade", () => {
  it.each([
    ["roh ist null", null],
    ["roh ist eine Zeichenkette", "text"],
    ["roh ist eine Zahl", 42],
    ["roh ist undefined", undefined],
    ["roh ist eine Liste", []],
    ["streams fehlt", {}],
    ["streams ist kein Array", { streams: { "0": {} } }],
    ["streams ist leer", { streams: [] }],
  ])("meldet bei %s probe_fehler statt zu werfen", (_fall, eingabe) => {
    erwarteProbeFehler(werteMetadatenAus(eingabe, "video"));
    erwarteProbeFehler(werteMetadatenAus(eingabe, "bild"));
  });

  it("meldet eine reine Tondatei als probe_fehler", () => {
    // Verbatim gemessen an einer echten MP3: ein einziger Stream, codec_type "audio".
    const mp3 = {
      index: 0,
      codec_name: "mp3",
      codec_type: "audio",
      sample_rate: "44100",
      channels: 1,
      duration: "2.037551",
    };
    erwarteProbeFehler(werteMetadatenAus(roh([mp3], { duration: "2.037551" }), "video"));
  });

  it.each([
    ["width fehlt", { width: undefined }],
    ["height fehlt", { height: undefined }],
    ["width ist 0", { width: 0 }],
    ["height ist negativ", { height: -1080 }],
    ["width ist keine Zahl", { width: "breit" }],
    ["width ist null", { width: null }],
    ["width ist unendlich", { width: Number.POSITIVE_INFINITY }],
    ["width ist NaN", { width: Number.NaN }],
  ])("meldet bei unbrauchbaren Massen (%s) probe_fehler", (_fall, ueberschreibung) => {
    erwarteProbeFehler(
      werteMetadatenAus(
        roh([videoStrom(ueberschreibung)], { duration: "12.033000" }),
        "video",
      ),
    );
  });

  it.each([
    ["beide fehlen", {}, undefined],
    ["beide sind N/A", { duration: "N/A" }, { duration: "N/A" }],
    ["beide sind 0", { duration: "0.000000" }, { duration: "0.000000" }],
  ])(
    "meldet bei Video ohne brauchbare Dauer (%s) probe_fehler",
    (_fall, stromFelder, formatFelder) => {
      erwarteProbeFehler(
        werteMetadatenAus(roh([videoStrom(stromFelder)], formatFelder), "video"),
      );
    },
  );

  it("scheitert NICHT an fehlender Dauer, wenn es ein Bild ist", () => {
    // Gegenprobe zum Block darueber: Dieselbe Rohausgabe, anderer Typ. Ohne diesen Test
    // koennte die Dauerpruefung versehentlich auch fuer Bilder greifen - und dann waere
    // kein einziges PNG importierbar, weil PNGs gemessen gar keine Dauer tragen.
    const wert = erwarteErfolg(werteMetadatenAus(roh([videoStrom()]), "bild"));
    expect(wert.dauer).toBeNull();
  });

  it("wirft bei fremdartigen Strukturen nicht, sondern meldet", () => {
    // `roh` stammt aus einem fremden Programm. Eine Ausnahme hier liesse den
    // Import-Auftrag ohne brauchbaren Code scheitern (TK 9.1.1).
    const fremdartig: unknown[] = [
      { streams: [null] },
      { streams: ["video"] },
      { streams: [{ codec_type: "video" }] },
      { streams: [{ codec_type: 42, width: 1920, height: 1080 }] },
      { streams: [videoStrom()], format: "kaputt" },
      { streams: [videoStrom()], format: [] },
    ];
    for (const eingabe of fremdartig) {
      expect(() => werteMetadatenAus(eingabe, "video")).not.toThrow();
      expect(() => werteMetadatenAus(eingabe, "bild")).not.toThrow();
    }
  });
});

describe("Herkunft des Fehlercodes", () => {
  it("verwendet ein Literal aus der Fehlercode-Union des Moduls (#79)", () => {
    // Der Beleg, dass 'probe_fehler' nicht frei erfunden ist. Er liegt auf der Typebene
    // und wird deshalb erst von `tsc -p tsconfig.tests.json` geprueft - Vitest entfernt
    // die Typen, ohne sie anzusehen.
    const beleg: ImportFehlercode = "probe_fehler";
    expect(beleg).toBe("probe_fehler");
  });
});
