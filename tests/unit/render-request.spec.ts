// Vertragstest zu #17 - `RenderRequest` und die drei `RenderItem`-Varianten.
//
// DoD 2 verlangt, dass `einblendung` BEIDE Geometriefelder traegt: `art` und `höhe`
// MIT UMLAUT. Beides zusammen ergibt erst die Bandgeometrie - und beides ist eine
// Stelle, an der ein Fehler nicht im Test auffaellt, sondern erst am Fernseher:
//
//  - Fehlt `art`, weiss der ffmpeg-Adapter nicht, ob das Band UNTER dem Video liegt
//    (split, Video wird kleiner) oder DARUEBER (einblendung, Video bleibt voll).
//  - Steht dort `hoehe` statt `höhe`, ist es fuer TypeScript ein ANDERES Feld. Der
//    Zugriff auf `höhe` ergaebe `undefined`, die Bandhoehe waere NaN, und die
//    Filterkette rechnete mit einem Wert, den niemand gesetzt hat.
//
// DoD 4: `RenderItemSegment` traegt NUR `png`, `dauer` und `id` (plus `art` als
// Unterscheider). Aktions- oder Vorlagendaten haben hier nichts zu suchen - das
// Segment ist zum Zeitpunkt des Renderns bereits ein fertiges Bild (Variante A,
// TK 9.1/9.2): Der Renderer hat gezeichnet, der Main bekommt Pixel.
import { describe, expect, it } from "vitest";

import type {
  RenderItem,
  RenderItemSegment,
  RenderItemVideo,
  RenderRequest,
} from "../../src/shared/contracts/render-request";
import type { Behaupte, Gleich } from "../typ-gleich";

type Einblendung = NonNullable<RenderItemVideo["einblendung"]>;

// --- DoD 2: beide Geometriefelder, Umlaut-Schreibweise ------------------------
type T1 = Behaupte<Gleich<Einblendung["art"], "split" | "einblendung">>;
type T2 = Behaupte<Gleich<Einblendung["höhe"], number>>;

// Ein Feld `hoehe` OHNE Umlaut darf es nicht geben - sonst gaebe es zwei Namen fuer
// dieselbe Zahl und der Vertrag entschiede nicht mehr, welcher gilt.
type T3 = Behaupte<Gleich<Extract<keyof Einblendung, "hoehe">, never>>;

// --- DoD 4: das Segment traegt nur Pixel und Dauer ---------------------------
type T4 = Behaupte<Gleich<keyof RenderItemSegment, "id" | "art" | "png" | "dauer">>;

// --- DoD 3: Verengung ueber `art` --------------------------------------------
// Nur im segment-Zweig gibt es `.png`. Die Funktion ist der Nachweis: Sie
// uebersetzt NUR, weil TypeScript nach der Pruefung auf `art` genau eine Variante
// uebrig laesst.
function pixelGroesse(element: RenderItem): number {
  if (element.art === "segment") return element.png.byteLength;
  if (element.art === "bild") return element.dauer;
  return element.trimEnde - element.trimStart;
}

// Alle "darf nicht uebersetzen"-Faelle stehen in einer Funktion, die NIE aufgerufen
// wird - ein Gegenbeweis darf nichts ausfuehren.
function nurTypebene(basis: Einblendung, segment: RenderItemSegment): void {
  // @ts-expect-error `art` fehlt - ohne sie ist die Kompositionsart unbestimmt.
  const ohneArt: Einblendung = { höhe: 162, bandVorlageId: "b", abschnitte: [] };

  // @ts-expect-error `höhe` fehlt - ohne sie hat das Band keine Geometrie.
  const ohneHoehe: Einblendung = { art: "split", bandVorlageId: "b", abschnitte: [] };

  // @ts-expect-error 'vollflaeche' ist keine Kompositionsart (TK 9.2.8 kennt zwei).
  const falscheArt: Einblendung = { ...basis, art: "vollflaeche" };

  // @ts-expect-error Im segment-Zweig gibt es keine Aktions-/Vorlagendaten.
  const mitAktion: RenderItemSegment = { ...segment, aktionRef: "a1" };

  // @ts-expect-error `.png` gibt es nur im segment-Zweig, nicht auf der Union.
  const blind: number = (undefined as unknown as RenderItem).png.byteLength;

  void ohneArt;
  void ohneHoehe;
  void falscheArt;
  void mitAktion;
  void blind;
}
void nurTypebene;

const segment: RenderItemSegment = {
  id: "s1",
  art: "segment",
  png: new Uint8Array([137, 80, 78, 71]),
  dauer: 10,
};

const anfrage: RenderRequest = {
  renderId: "r-1",
  projektId: "p-1",
  elemente: [segment],
  profil: {
    breite: 1920,
    hoehe: 1080,
    fps: 30,
    videoCodec: "h264",
    profil: "high",
    level: "4.0",
    pixelformat: "yuv420p",
    bitTiefe: 8,
    ratensteuerung: { zielBitrateKbps: 10000, maxBitrateKbps: 12000, vbvBufferKbit: 24000 },
    gopMaxSekunden: 2,
    farbmetadaten: { primaries: "bt709", transfer: "bt709", matrix: "bt709" },
    sar: "1:1",
    audio: { codec: "aac", sampleRateHz: 48000, kanaele: 1, still: true },
    faststart: true,
    container: "mp4",
  },
  ausgabeName: "sommeraktion",
};

export type { T1, T2, T3, T4 };

describe("RenderRequest / RenderItem (#17)", () => {
  it("verengt ueber `art` auf genau eine Variante", () => {
    expect(pixelGroesse(segment)).toBe(4);
  });

  it("fuehrt den Ausgabenamen OHNE Endung (FA-22)", () => {
    expect(anfrage.ausgabeName).toBe("sommeraktion");
    expect(anfrage.ausgabeName.endsWith(".mp4")).toBe(false);
  });

  it("uebergibt Segment-Pixel als Uint8Array", () => {
    // Uint8Array ueberlebt Electrons structured clone verlustfrei - ein Buffer oder
    // ArrayBuffer taete das nicht zuverlaessig (TK 9.1, Variante A).
    expect(segment.png).toBeInstanceOf(Uint8Array);
  });
});
