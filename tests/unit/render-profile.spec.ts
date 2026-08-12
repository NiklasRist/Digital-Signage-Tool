// Vertragstest zu #18 - `RENDER_PROFILE`.
//
// DoD 2 verlangt, dass der Typ "literal genug" ist: Ein versehentlich falscher Wert
// wie `hoehe: 1081` muss einen TYPFEHLER erzeugen, keinen stillen Durchlauf.
//
// WARUM DAS ZAEHLT: Dieses Profil ist die einzige Beschreibung dessen, was am Ende
// aus dem USB-Stick in den Fernseher geht. Waeren die Felder `number` und `string`,
// bliebe eine verrutschte Ziffer unbemerkt, bis das fertige Video am Geraet haengt:
// 1081 Zeilen sind fuer yuv420p eine ungerade Hoehe, und der TV zeigt entweder
// nichts oder ein verzerrtes Bild. Ein Fehler hier faellt in KEINEM Testlauf auf -
// nur am Fernseher.
import { describe, expect, it } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";
import type { RenderProfile } from "../../src/shared/contracts/render-profile";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 2: die festen Werte sind Literaltypen, nicht `number`/`string` -------
type T1 = Behaupte<Gleich<RenderProfile["breite"], 1920>>;
type T2 = Behaupte<Gleich<RenderProfile["hoehe"], 1080>>;
type T3 = Behaupte<Gleich<RenderProfile["fps"], 30>>;
type T4 = Behaupte<Gleich<RenderProfile["pixelformat"], "yuv420p">>;

// Die Gegenprobe zur Behauptung: Waeren die Felder weit typisiert, waere der
// folgende Vergleich `true`. Er ist `false` - und genau das ist der Nachweis.
type T5 = Behaupte<Gleich<Gleich<RenderProfile["hoehe"], number>, false>>;
type T6 = Behaupte<Gleich<Gleich<RenderProfile["pixelformat"], string>, false>>;

// Alle "darf nicht uebersetzen"-Faelle in einer nie aufgerufenen Funktion.
function nurTypebene(): void {
  // @ts-expect-error 1081 ist nicht 1080 - eine ungerade Hoehe bricht yuv420p.
  const falscheHoehe: RenderProfile = { ...RENDER_PROFILE, hoehe: 1081 };

  // @ts-expect-error 25 fps ist nicht das Profil - der TV bekommt CFR 30.
  const falscheFps: RenderProfile = { ...RENDER_PROFILE, fps: 25 };

  // @ts-expect-error yuv444p ueberlebt die Consumer-Wiedergabekette nicht.
  const falschesPixelformat: RenderProfile = { ...RENDER_PROFILE, pixelformat: "yuv444p" };

  void falscheHoehe;
  void falscheFps;
  void falschesPixelformat;
}
void nurTypebene;

export type { T1, T2, T3, T4, T5, T6 };

describe("RENDER_PROFILE (#18)", () => {
  it("traegt die Werte des Ausgabe-Profils unveraendert", () => {
    expect(RENDER_PROFILE.breite).toBe(1920);
    expect(RENDER_PROFILE.hoehe).toBe(1080);
    expect(RENDER_PROFILE.fps).toBe(30);
    expect(RENDER_PROFILE.videoCodec).toBe("h264");
    expect(RENDER_PROFILE.profil).toBe("high");
    expect(RENDER_PROFILE.level).toBe("4.0");
    expect(RENDER_PROFILE.container).toBe("mp4");
  });

  it("haelt Breite und Hoehe gerade - Bedingung fuer yuv420p", () => {
    // yuv420p tastet die Farbe halbiert ab; ungerade Kantenlaengen sind damit nicht
    // darstellbar. Das gilt auch fuer jede spaeter berechnete Bandgeometrie
    // (TK v2.9: gerade Bandhoehen, Split-Breite auf Vielfaches von 4).
    expect(RENDER_PROFILE.breite % 2).toBe(0);
    expect(RENDER_PROFILE.hoehe % 2).toBe(0);
    expect(RENDER_PROFILE.pixelformat).toBe("yuv420p");
  });

  it("deckelt die Rate und traegt eine stille Tonspur", () => {
    // Gedeckeltes VBR: die Spitzenrate liegt ueber der Zielrate, der Puffer darueber.
    expect(RENDER_PROFILE.ratensteuerung.maxBitrateKbps).toBeGreaterThan(
      RENDER_PROFILE.ratensteuerung.zielBitrateKbps,
    );
    // R-06: eine stille AAC-Spur, damit der TV die Datei nicht als defekt abweist.
    expect(RENDER_PROFILE.audio.still).toBe(true);
    expect(RENDER_PROFILE.audio.codec).toBe("aac");
  });
});
