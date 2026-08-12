// Vertragstest zu #13 - Typ `Asset` und Konstante `FORMAT_WHITELIST`.
//
// Geprueft wird DoD-Punkt 2: "`FORMAT_WHITELIST` ist `as const` (literale Typen,
// keine `string[]`)". Das ist eine Aussage ueber den TYP, nicht ueber den Wert - ein
// Laufzeittest auf den Inhalt wuerde sie nicht belegen, denn `['mp4']` sieht zur
// Laufzeit gleich aus, egal ob es `string[]` oder `readonly ['mp4']` ist.
//
// WARUM DAS ZAEHLT: Ohne `as const` ist der Typ `string[]`. Jede Pruefung der Art
// "ist diese Endung erlaubt?" verliert dann ihre Enge - ein Tippfehler in einem
// Vergleichswert faellt erst zur Laufzeit auf, und ein `push()` auf die vermeintlich
// feste Liste kompiliert klaglos.
import { describe, expect, it } from "vitest";

import { FORMAT_WHITELIST } from "../../src/shared/contracts/asset";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- Typebene: die Endungen sind Literale, nicht `string` ---------------------
type VideoEndungen = (typeof FORMAT_WHITELIST)["video"][number];
type BildEndungen = (typeof FORMAT_WHITELIST)["bild"][number];

type T1 = Behaupte<Gleich<VideoEndungen, "mp4">>;
type T2 = Behaupte<Gleich<BildEndungen, "jpg" | "jpeg" | "png" | "webp">>;

// Gegenprobe zur Gegenprobe: Waere die Konstante `string[]`, waere der folgende
// Vergleich `true` - er ist es nicht, und genau das belegt die Enge.
type T3 = Behaupte<Gleich<Gleich<VideoEndungen, string>, false>>;

// --- Typebene: die Listen sind unveraenderlich --------------------------------
// ACHTUNG, hier stand zuerst ein echter Aufruf `FORMAT_WHITELIST.video.push("avi")`
// mit @ts-expect-error darueber. Der Typecheck war gruen - und der LAUFZEITTEST
// darunter fiel um: `as const` wirkt nur beim Uebersetzen, das Array bleibt zur
// Laufzeit veraenderlich. Der Test haette die geteilte Konstante fuer jede weitere
// Datei im selben Prozess verfaelscht. Deshalb steht die Aussage jetzt rein auf der
// Typebene, ohne eine einzige ausgefuehrte Anweisung.
type T4 = Behaupte<Gleich<typeof FORMAT_WHITELIST.video, readonly ["mp4"]>>;
type T5 = Behaupte<
  Gleich<typeof FORMAT_WHITELIST.bild, readonly ["jpg", "jpeg", "png", "webp"]>
>;

// --- Typebene: `Asset` traegt die Pflichtfelder --------------------------------
const gueltig: Asset = {
  id: "3f1b0c9e-0000-4000-8000-000000000001",
  typ: "video",
  dateiname: "3f1b0c9e-0000-4000-8000-000000000001.mp4",
  originalname: "Sommeraktion.MP4",
  maße: { breite: 1920, höhe: 1080 },
  dauer: 12.5,
  importdatum: "2026-08-11T10:00:00.000Z",
  zustand: "ok",
};

// @ts-expect-error `zustand` kennt nur 'ok' | 'fehlt'.
const falscherZustand: Asset = { ...gueltig, zustand: "kaputt" };

export type { T1, T2, T3, T4, T5 };
void falscherZustand;

describe("Asset / FORMAT_WHITELIST (#13)", () => {
  it("listet genau die im Vertrag genannten Endungen", () => {
    expect(FORMAT_WHITELIST.video).toEqual(["mp4"]);
    expect(FORMAT_WHITELIST.bild).toEqual(["jpg", "jpeg", "png", "webp"]);
  });

  it("nennt Endungen ohne Punkt und in Kleinschreibung", () => {
    const alle = [...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild];
    for (const endung of alle) {
      expect(endung).toBe(endung.toLowerCase());
      expect(endung.startsWith(".")).toBe(false);
    }
  });
});
