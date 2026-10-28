
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SICHERHEITSABSTAND_PX } from "../../src/shared/contracts/konstanten";
import { zeichneBildZone } from "../../src/renderer/template-canvas/zone-bild";
import { schriftKurzform } from "../../src/renderer/template-canvas/schriften";
import { loeseFarbe, loeseSchrift } from "../../src/renderer/template-canvas/farben";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { FarbRolle, Marke, SchriftRolle } from "../../src/shared/contracts/marke";
import type { Zone } from "../../src/shared/contracts/vorlage";
import type { Motiv } from "../../src/renderer/template-canvas/bild-laden";

// ---------------- Mocks ----------------

vi.mock("../../src/renderer/template-canvas/farben", async (importOriginal) => {
  const echt = await importOriginal<typeof import("../../src/renderer/template-canvas/farben")>();
  return {
    loeseFarbe: vi.fn(echt.loeseFarbe),
    loeseSchrift: vi.fn(echt.loeseSchrift),
  };
});

// ---------------- Aufzeichnungs-Doppel ----------------

type Ereignis = { art: string; name?: string; argumente?: unknown[]; wert?: unknown };

function baueKontextDoppel(zeicheFehlerBeiDrawImage = false): {
  kontext: CanvasRenderingContext2D;
  ereignisse: Ereignis[];
  drawImageAufrufe: unknown[][];
  fillTextAufrufe: { text: string; x: number; y: number; argumentzahl: number }[];
  fillRectAufrufe: unknown[][];
  strokeRectAufrufe: unknown[][];
  striche: number;
} {
  const ereignisse: Ereignis[] = [];
  const drawImageAufrufe: unknown[][] = [];
  const fillTextAufrufe: { text: string; x: number; y: number; argumentzahl: number }[] = [];
  const fillRectAufrufe: unknown[][] = [];
  const strokeRectAufrufe: unknown[][] = [];
  let striche = 0;

  const kontext = {
    set font(wert: string) {
      ereignisse.push({ art: "set", name: "font", wert });
    },
    get font() {
      return "";
    },
    set fillStyle(wert: string) {
      ereignisse.push({ art: "set", name: "fillStyle", wert });
    },
    get fillStyle() {
      return "";
    },
    set strokeStyle(wert: string) {
      ereignisse.push({ art: "set", name: "strokeStyle", wert });
    },
    get strokeStyle() {
      return "";
    },
    set lineWidth(wert: number) {
      ereignisse.push({ art: "set", name: "lineWidth", wert });
    },
    get lineWidth() {
      return 1;
    },
    set textAlign(wert: string) {
      ereignisse.push({ art: "set", name: "textAlign", wert });
    },
    get textAlign() {
      return "left";
    },
    set textBaseline(wert: string) {
      ereignisse.push({ art: "set", name: "textBaseline", wert });
    },
    get textBaseline() {
      return "top";
    },
    set imageSmoothingEnabled(wert: boolean) {
      ereignisse.push({ art: "set", name: "imageSmoothingEnabled", wert });
    },
    get imageSmoothingEnabled() {
      return true;
    },
    set imageSmoothingQuality(wert: string) {
      ereignisse.push({ art: "set", name: "imageSmoothingQuality", wert });
    },
    get imageSmoothingQuality() {
      return "low";
    },
    save() {
      ereignisse.push({ art: "rufe", name: "save" });
    },
    restore() {
      ereignisse.push({ art: "rufe", name: "restore" });
    },
    beginPath() {
      ereignisse.push({ art: "rufe", name: "beginPath" });
    },
    moveTo(x: number, y: number) {
      ereignisse.push({ art: "rufe", name: "moveTo", argumente: [x, y] });
    },
    lineTo(x: number, y: number) {
      ereignisse.push({ art: "rufe", name: "lineTo", argumente: [x, y] });
    },
    stroke() {
      striche += 1;
      ereignisse.push({ art: "rufe", name: "stroke" });
    },
    strokeRect(...argumente: unknown[]) {
      strokeRectAufrufe.push(argumente);
      ereignisse.push({ art: "rufe", name: "strokeRect", argumente });
    },
    fillRect(...argumente: unknown[]) {
      fillRectAufrufe.push(argumente);
      ereignisse.push({ art: "rufe", name: "fillRect", argumente });
    },
    fillText(text: string, x: number, y: number, ...rest: unknown[]) {
      fillTextAufrufe.push({ text, x, y, argumentzahl: 2 + rest.length });
      ereignisse.push({ art: "rufe", name: "fillText", argumente: [text, x, y] });
    },
    drawImage(...argumente: unknown[]) {
      if (zeicheFehlerBeiDrawImage) throw new Error("verwaistes Bildobjekt");
      drawImageAufrufe.push(argumente);
      ereignisse.push({ art: "rufe", name: "drawImage", argumente });
    },
  } as unknown as CanvasRenderingContext2D & Record<string, unknown>;

  return {
    kontext: kontext as CanvasRenderingContext2D,
    ereignisse,
    drawImageAufrufe,
    fillTextAufrufe,
    fillRectAufrufe,
    strokeRectAufrufe,
    get striche() {
      return striche;
    },
  };
}

// ---------------- Marken / Aktion / Zone / Motiv ----------------

const marke = (): Marke => ({
  farben: {
    akzent: "#FF4040",
    akzentKraeftig: "#DF3131",
    akzentTief: "#971316",
    flaecheDunkel: "#2F2E2E",
    flaecheSehrDunkel: "#4B090B",
    flaecheHell: "#FFFFFF",
    flaecheAkzentZart: "#F5AEAF",
    textAufDunkel: "#FFFFFF",
    textAufHell: "#202020",
    textSekundaer: "#8F8F8F",
    linie: "#CCCCCC",
    scrimStart: "#00000000",
    scrimEnde: "#000000B3",
  },
  schriften: {
    headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "P.woff2", herkunft: 'gebuendelt' },
    headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "A.woff2", herkunft: 'gebuendelt' },
    fliesstext: { familie: "Arimo", gewicht: 400, datei: "R.woff2", herkunft: 'gebuendelt' },
    fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "B.woff2", herkunft: 'gebuendelt' },
  },
  logo: { datei: "logo.png", seitenverhaeltnis: 3.5, herkunft: 'gebuendelt' },
  sicherheit: SICHERHEITSABSTAND_PX,
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#00000040" },
  slogan: { text: "", aktiv: false },
  id: 'm1',
  name: 'Probe',
  parent: null,
  eingebaut: false,
  herkunftJeFeld: null as never,
});

const aktion = (akzentfarbe: string | null): Aktion => ({
  id: "a-2",
  titel: "Probeaktion",
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: "vollbild",
  markeId: "m1",
  akzentfarbe,
});

const zone = (
  rahmen: { x: number; y: number; breite: number; höhe: number },
  einpassung: "contain" | "cover" | undefined,
): Zone => ({
  id: "motiv",
  rolle: "fest",
  bindung: "bild",
  rahmen,
  ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
  wennLeer: "ausblenden",
  bild: einpassung === undefined ? undefined : { einpassung },
});

// Attrappe als "Bild": Die Maesse kommen aus motiv.breite/motiv.hoehe, das
// Bildobjekt wird nie angesehen - ein beliebiger Wert genuegt.
const ATTRAPPE = { attribut: "attrappe" } as unknown as ImageBitmap;

const MOTIV: Motiv = {
  zustand: "geladen",
  bild: ATTRAPPE,
  breite: 1600,
  höhe: 1200,
};

const FEHLT: Motiv = { zustand: "fehlt" };

const OHNE_WAHL = aktion(null);

beforeEach(() => {
  vi.mocked(loeseFarbe).mockClear().mockImplementation((m: Marke, r: FarbRolle) => {
    const wert = m.farben[r];
    if (wert === undefined) throw new Error("unbekannte Rolle");
    return wert;
  });
  vi.mocked(loeseSchrift).mockClear().mockImplementation((m: Marke, r: SchriftRolle) => {
    const wert = m.schriften[r];
    if (wert === undefined) throw new Error("unbekannte Schrift-Rolle");
    return wert;
  });
});

// ---------------- Tests ----------------

describe("zeichneBildZone (#115) - contain (5-Argument-Form)", () => {
  it("Split-Zone 960x1080 mit 1600x1200 -> (bild, 0, 180, 960, 720)", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "contain"), MOTIV, marke(), OHNE_WAHL);
    expect(drawImageAufrufe).toEqual([[ATTRAPPE, 0, 180, 960, 720]]);
    expect(drawImageAufrufe[0]).toHaveLength(5);
  });

  it("Seitenverhaeltnis bleibt erhalten - Toleranz statt Gleichheit (krumme Maße 1601x1200)", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    const krumm: Motiv = { zustand: "geladen", bild: ATTRAPPE, breite: 1601, höhe: 1200 };
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "contain"), krumm, marke(), OHNE_WAHL);
    const [, zielX, zielY, zielBreite, zielHöhe] = drawImageAufrufe[0] as number[];
    expect(Math.abs((zielBreite as number) / (zielHöhe as number) - 1601 / 1200)).toBeLessThan(1e-9);
    void zielX;
    void zielY;
  });

  it("zentriert im Rahmen: Rand gleichmaessig links/rechts und oben/unten", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "contain"), MOTIV, marke(), OHNE_WAHL);
    const [, zielX, zielY, zielBreite, zielHöhe] = drawImageAufrufe[0] as number[];
    expect(zielX).toBe((0 + (960 - (zielBreite as number))) / 2);
    expect(zielY).toBe((0 + (1080 - (zielHöhe as number))) / 2);
  });
});

describe("zeichneBildZone (#115) - cover (9-Argument-Form, Beschnitt mittig)", () => {
  it("Vollbild-Zone 1920x1080 mit 1600x1200 -> (bild, 0, 150, 1600, 900, 0, 0, 1920, 1080)", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 1920, höhe: 1080 }, "cover"), MOTIV, marke(), OHNE_WAHL);
    expect(drawImageAufrufe).toEqual([[ATTRAPPE, 0, 150, 1600, 900, 0, 0, 1920, 1080]]);
    expect(drawImageAufrufe[0]).toHaveLength(9);
  });

  it("Split-Zone 960x1080 mit 1920x1080 -> Beschnitt MITTIG: quellX = 480", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    const breit: Motiv = { zustand: "geladen", bild: ATTRAPPE, breite: 1920, höhe: 1080 };
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "cover"), breit, marke(), OHNE_WAHL);
    expect(drawImageAufrufe).toEqual([[ATTRAPPE, 480, 0, 960, 1080, 0, 0, 960, 1080]]);
  });

  it("Seitenverhältnis des sichtbaren Ausschnitts = Rahmen-Verhältnis (Toleranz)", () => {
    const { kontext, drawImageAufrufe } = baueKontextDoppel();
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "cover"), MOTIV, marke(), OHNE_WAHL);
    const [, quellX, quellY, quellBreite, quellHöhe] = drawImageAufrufe[0] as number[];
    expect(Math.abs((quellBreite as number) / (quellHöhe as number) - 960 / 1080)).toBeLessThan(1e-9);
    void quellX;
    void quellY;
  });

  it("gleicher Seitenverhältnis-Fall -> contain und cover liefern dieselben Zielmaße (kein Beschnitt, kein Rand)", () => {
    const quadrat: Motiv = { zustand: "geladen", bild: ATTRAPPE, breite: 900, höhe: 900 };
    const rahmen = { x: 0, y: 0, breite: 900, höhe: 900 };

    const mitContain = baueKontextDoppel();
    zeichneBildZone(mitContain.kontext, zone(rahmen, "contain"), quadrat, marke(), OHNE_WAHL);

    const mitCover = baueKontextDoppel();
    zeichneBildZone(mitCover.kontext, zone(rahmen, "cover"), quadrat, marke(), OHNE_WAHL);

    const zielContain = mitContain.drawImageAufrufe[0]?.slice(1);
    const zielCover = mitCover.drawImageAufrufe[0]?.slice(5);
    expect(zielCover).toEqual(zielContain);
  });
});

describe("zeichneBildZone (#115) - Interpolation und Klammerung", () => {
  it("imageSmoothingEnabled = true und quality 'high' VOR dem ersten drawImage", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    zeichneBildZone(kontext, zone({ x: 0, y: 0, breite: 960, höhe: 1080 }, "contain"), MOTIV, marke(), OHNE_WAHL);

    const ersterDraw = ereignisse.findIndex((e) => e.art === "rufe" && e.name === "drawImage");
    const enabled = ereignisse.filter((e) => e.art === "set" && e.name === "imageSmoothingEnabled");
    const quality = ereignisse.filter((e) => e.art === "set" && e.name === "imageSmoothingQuality");
    expect(enabled).toHaveLength(1);
    expect(enabled[0]?.wert).toBe(true);
    expect(quality).toHaveLength(1);
    expect(quality[0]?.wert).toBe("high");
    const enabledIndex = ereignisse.findIndex((e) => e.art === "set" && e.name === "imageSmoothingEnabled");
    expect(enabledIndex).toBeGreaterThanOrEqual(0);
    expect(enabledIndex).toBeLessThan(ersterDraw);
  });

  it("genau ein save und genau ein restore auf dem Erfolgs-, Platzhalter- und Fehlerpfad", () => {
    const rahmen = { x: 0, y: 0, breite: 960, höhe: 1080 };

    const geladen = baueKontextDoppel();
    zeichneBildZone(geladen.kontext, zone(rahmen, "cover"), MOTIV, marke(), OHNE_WAHL);
    expect(geladen.ereignisse.filter((e) => e.art === "rufe" && e.name === "save")).toHaveLength(1);
    expect(geladen.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore")).toHaveLength(1);

    const fehlt = baueKontextDoppel();
    zeichneBildZone(fehlt.kontext, zone(rahmen, "cover"), FEHLT, marke(), OHNE_WAHL);
    expect(fehlt.ereignisse.filter((e) => e.art === "rufe" && e.name === "save")).toHaveLength(1);
    expect(fehlt.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore")).toHaveLength(1);

    const bricht = baueKontextDoppel(true);
    expect(() =>
      zeichneBildZone(bricht.kontext, zone(rahmen, "cover"), MOTIV, marke(), OHNE_WAHL),
    ).not.toThrow();
    expect(bricht.ereignisse.filter((e) => e.art === "rufe" && e.name === "save")).toHaveLength(1);
    expect(bricht.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore")).toHaveLength(1);
  });
});

describe("zeichneBildZone (#115) - der Platzhalter", () => {
  const rahmen = { x: 0, y: 0, breite: 1920, höhe: 1080 };

  it("fehlt -> kein drawImage, fillRect ueber den ganzen Rahmen, strokeRect, zwei Linienzuege, EIN fillText 'Bild fehlt'", () => {
    const doppel = baueKontextDoppel();
    zeichneBildZone(doppel.kontext, zone(rahmen, "cover"), FEHLT, marke(), OHNE_WAHL);

    expect(doppel.drawImageAufrufe).toHaveLength(0);
    expect(doppel.fillRectAufrufe).toEqual([[0, 0, 1920, 1080]]);
    expect(doppel.strokeRectAufrufe).toEqual([[2, 2, 1916, 1076]]);
    expect(doppel.striche).toBe(1); // beide Diagonalen in EINEM Linienzug
    expect(doppel.fillTextAufrufe).toEqual([
      { text: "Bild fehlt", x: 960, y: 540, argumentzahl: 2 },
    ]);
  });

  it("Beschriftung mit textAlign center, textBaseline middle, ohne viertes Argument", () => {
    const doppel = baueKontextDoppel();
    zeichneBildZone(doppel.kontext, zone(rahmen, "contain"), FEHLT, marke(), OHNE_WAHL);

    const align = doppel.ereignisse.filter((e) => e.art === "set" && e.name === "textAlign");
    const baseline = doppel.ereignisse.filter((e) => e.art === "set" && e.name === "textBaseline");
    expect(align.at(-1)?.wert).toBe("center");
    expect(baseline.at(-1)?.wert).toBe("middle");
    expect(doppel.fillTextAufrufe[0]?.argumentzahl).toBe(2);
  });

  it("Beschriftungsgroesse = min(48, max(16, round(hoehe/8))) und via schriftKurzform", () => {
    const doppel = baueKontextDoppel();
    zeichneBildZone(doppel.kontext, zone({ x: 0, y: 0, breite: 400, höhe: 80 }, "contain"), FEHLT, marke(), OHNE_WAHL);
    // round(80/8)=10 -> max(16, 10)=16
    expect(doppel.ereignisse.find((e) => e.art === "set" && e.name === "font")?.wert).toBe(
      schriftKurzform(marke().schriften.fliesstext, 16),
    );

    const doppel2 = baueKontextDoppel();
    zeichneBildZone(doppel2.kontext, zone({ x: 0, y: 0, breite: 400, höhe: 1000 }, "contain"), FEHLT, marke(), OHNE_WAHL);
    // round(1000/8)=125 -> min(48, 125)=48
    expect(doppel2.ereignisse.find((e) => e.art === "set" && e.name === "font")?.wert).toBe(
      schriftKurzform(marke().schriften.fliesstext, 48),
    );
  });

  it("geladen mit breite=0 -> derselbe Platzhalter-Verlauf wie bei 'fehlt'", () => {
    const ohneMaße: Motiv = { zustand: "geladen", bild: ATTRAPPE, breite: 0, höhe: 1200 };
    const doppel = baueKontextDoppel();
    zeichneBildZone(doppel.kontext, zone(rahmen, "cover"), ohneMaße, marke(), OHNE_WAHL);

    expect(doppel.drawImageAufrufe).toHaveLength(0);
    expect(doppel.fillRectAufrufe).toEqual([[0, 0, 1920, 1080]]);
    expect(doppel.fillTextAufrufe).toEqual([
      { text: "Bild fehlt", x: 960, y: 540, argumentzahl: 2 },
    ]);
  });

  it("drawImage wirft -> Platzhalter gezeichnet, Funktion kehrt normal zurueck", () => {
    const doppel = baueKontextDoppel(true);
    expect(() =>
      zeichneBildZone(doppel.kontext, zone(rahmen, "cover"), MOTIV, marke(), OHNE_WAHL),
    ).not.toThrow();
    expect(doppel.fillRectAufrufe).toEqual([[0, 0, 1920, 1080]]);
    expect(doppel.fillTextAufrufe[0]?.text).toBe("Bild fehlt");
    expect(doppel.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore")).toHaveLength(1);
  });
});

describe("zeichneBildZone (#115) - Teilschritte des Platzhalters einzeln fangen", () => {
  const rahmen = { x: 0, y: 0, breite: 800, höhe: 600 };

  function verlauf(): { fillRect: number; strokeRect: number; stroke: number; fillText: number; restore: number } {
    const doppel = baueKontextDoppel();
    zeichneBildZone(doppel.kontext, zone(rahmen, "contain"), FEHLT, marke(), OHNE_WAHL);
    return {
      fillRect: doppel.fillRectAufrufe.length,
      strokeRect: doppel.strokeRectAufrufe.length,
      stroke: doppel.striche,
      fillText: doppel.fillTextAufrufe.length,
      restore: doppel.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore").length,
    };
  }

  it("alle vier Schritte vollstaendig (Referenzverlauf)", () => {
    expect(verlauf()).toEqual({ fillRect: 1, strokeRect: 1, stroke: 1, fillText: 1, restore: 1 });
  });

  it("loeseFarbe wirft fuer flaecheDunkel -> nur die Flaeche fehlt", () => {
    vi.mocked(loeseFarbe).mockImplementation((_m: Marke, r: FarbRolle) => {
      if (r === "flaecheDunkel") throw new Error("unbekannte Rolle");
      return "#000000";
    });
    expect(verlauf()).toEqual({ fillRect: 0, strokeRect: 1, stroke: 1, fillText: 1, restore: 1 });
  });

  it("loeseFarbe wirft fuer akzent -> nur Strich und Diagonalen fehlen", () => {
    vi.mocked(loeseFarbe).mockImplementation((_m: Marke, r: FarbRolle) => {
      if (r === "akzent") throw new Error("unbekannte Rolle");
      return "#000000";
    });
    expect(verlauf()).toEqual({ fillRect: 1, strokeRect: 0, stroke: 0, fillText: 1, restore: 1 });
  });

  it("loeseFarbe wirft fuer textAufDunkel -> nur die Beschriftung fehlt", () => {
    vi.mocked(loeseFarbe).mockImplementation((_m: Marke, r: FarbRolle) => {
      if (r === "textAufDunkel") throw new Error("unbekannte Rolle");
      return "#000000";
    });
    expect(verlauf()).toEqual({ fillRect: 1, strokeRect: 1, stroke: 1, fillText: 0, restore: 1 });
  });

  it("loeseSchrift wirft -> nur die Beschriftung fehlt", () => {
    vi.mocked(loeseSchrift).mockImplementation(() => {
      throw new Error("unbekannte Schrift-Rolle");
    });
    expect(verlauf()).toEqual({ fillRect: 1, strokeRect: 1, stroke: 1, fillText: 0, restore: 1 });
  });

  it("keine Ausnahme verlaesst die Funktion (alle Wurf-Faelle)", () => {
    vi.mocked(loeseFarbe).mockImplementation(() => {
      throw new Error("immer");
    });
    const doppel = baueKontextDoppel();
    expect(() =>
      zeichneBildZone(doppel.kontext, zone(rahmen, "contain"), FEHLT, marke(), OHNE_WAHL),
    ).not.toThrow();
  });
});

describe("zeichneBildZone (#115) - Abbruch und Fallbacks", () => {
  it("loeseFarbe bekommt (marke, rolle, aktion); die aktion ist DIESELBE Referenz", () => {
    const doppel = baueKontextDoppel();
    const m = marke();
    const a = aktion("#DF3131");
    zeichneBildZone(doppel.kontext, zone({ x: 0, y: 0, breite: 800, höhe: 600 }, "contain"), FEHLT, m, a);

    const rufe = vi.mocked(loeseFarbe).mock.calls;
    expect(rufe.length).toBeGreaterThanOrEqual(3);
    for (const ruf of rufe) {
      expect(ruf).toHaveLength(3);
      expect(ruf[0]).toBe(m);
      expect(ruf[2]).toBe(a);
      expect(["flaecheDunkel", "akzent", "textAufDunkel"]).toContain(ruf[1]);
    }
  });

  it("zone.bild fehlt bzw. unbekannter Wert -> das contain-Ergebnis", () => {
    const rahmen = { x: 0, y: 0, breite: 960, höhe: 1080 };

    const ohne = baueKontextDoppel();
    zeichneBildZone(ohne.kontext, zone(rahmen, undefined), MOTIV, marke(), OHNE_WAHL);

    const unbekannt = baueKontextDoppel();
    zeichneBildZone(
      unbekannt.kontext,
      { ...zone(rahmen, undefined), bild: { einpassung: "verzerrt" as never } },
      MOTIV,
      marke(),
      OHNE_WAHL,
    );

    const gegenprobe = baueKontextDoppel();
    zeichneBildZone(gegenprobe.kontext, zone(rahmen, "contain"), MOTIV, marke(), OHNE_WAHL);

    expect(ohne.drawImageAufrufe).toEqual(gegenprobe.drawImageAufrufe);
    expect(unbekannt.drawImageAufrufe).toEqual(gegenprobe.drawImageAufrufe);
    expect(ohne.drawImageAufrufe[0]).toHaveLength(5);
  });

  it("breite = 0 -> ueberhaupt kein Zeichenaufruf, kein save, kein restore, keine Ausnahme", () => {
    const doppel = baueKontextDoppel();
    expect(() =>
      zeichneBildZone(
        doppel.kontext,
        zone({ x: 0, y: 0, breite: 0, höhe: 1080 }, "cover"),
        MOTIV,
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow();
    expect(doppel.ereignisse.filter((e) => e.art === "rufe" && e.name === "save")).toHaveLength(0);
    expect(doppel.ereignisse.filter((e) => e.art === "rufe" && e.name === "restore")).toHaveLength(0);
    expect(doppel.fillRectAufrufe).toHaveLength(0);
    expect(doppel.fillTextAufrufe).toHaveLength(0);
  });

  it("hoehe nicht endlich -> ebenfalls gar nichts", () => {
    const doppel = baueKontextDoppel();
    expect(() =>
      zeichneBildZone(
        doppel.kontext,
        zone({ x: 0, y: 0, breite: 960, höhe: Number.POSITIVE_INFINITY }, "cover"),
        MOTIV,
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow();
    expect(doppel.ereignisse.filter((e) => e.art === "rufe" && e.name === "save")).toHaveLength(0);
  });
});
