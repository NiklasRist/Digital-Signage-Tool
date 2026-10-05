import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SICHERHEITSABSTAND_PX } from "../../src/shared/contracts/konstanten";
import { zeichneTextZone } from "../../src/renderer/template-canvas/zone-text";
import { schriftKurzform } from "../../src/renderer/template-canvas/schriften";
import { ZEILENHOEHE_FAKTOR } from "../../src/renderer/template-canvas/text-kaskade";
import { loeseFarbe, loeseSchrift } from "../../src/renderer/template-canvas/farben";
import { passeTextEin } from "../../src/renderer/template-canvas/text-kaskade";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { FarbRolle, Marke, SchriftRolle } from "../../src/shared/contracts/marke";
import type { Zone } from "../../src/shared/contracts/vorlage";
import type { KaskadenEingang, KaskadenErgebnis } from "../../src/renderer/template-canvas/text-kaskade";

// ---------------- Mocks ----------------
// loeseFarbe/loeseSchrift/passeTextEin werden als echtes Verhalten mit
// Abschaltmoeglichkeit gekapselt, um die drei Wurf-Fehlerpfade zu pruefen.

vi.mock("../../src/renderer/template-canvas/farben", async (importOriginal) => {
  const echt = await importOriginal<typeof import("../../src/renderer/template-canvas/farben")>();
  return {
    loeseFarbe: vi.fn(echt.loeseFarbe),
    loeseSchrift: vi.fn(echt.loeseSchrift),
  };
});

vi.mock("../../src/renderer/template-canvas/text-kaskade", async (importOriginal) => {
  const echt = await importOriginal<typeof import("../../src/renderer/template-canvas/text-kaskade")>();
  return {
    ZEILENHOEHE_FAKTOR: echt.ZEILENHOEHE_FAKTOR,
    passeTextEin: vi.fn(echt.passeTextEin),
  };
});

// ---------------- Quell-Pruefungen (Grep als Test) ----------------

const QUELLE = readFileSync(
  new URL("../../src/renderer/template-canvas/zone-text.ts", import.meta.url),
  "utf8",
);

const CODEZEILEN = QUELLE.split("\n")
  .filter((z) => {
    const t = z.trim();
    return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

describe("zone-text – Verbote in der Quelldatei (Grep)", () => {
  it("enthaelt das Kaskaden-Literal 1.2 nicht (Faktor kommt aus #113)", () => {
    expect(CODEZEILEN).not.toMatch(/\b1\.2\b/);
  });

  it("baut kein font-Literal selbst (kein 'px \"' und kein 'sans-serif')", () => {
    expect(CODEZEILEN).not.toContain('px "');
    expect(CODEZEILEN).not.toContain("sans-serif");
  });

  it("enthaelt kein Farb-Literal (kein '#RRGGBB', kein rgb/rgba)", () => {
    expect(CODEZEILEN).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODEZEILEN).not.toMatch(/\brgba?\(/);
  });

  it("liest marke.schriften nicht selbst und liest aktion.akzentfarbe nicht", () => {
    expect(CODEZEILEN).not.toContain("schriften[");
    expect(CODEZEILEN).not.toContain("akzentfarbe");
  });

  it("liest marke.sicherheit nicht (kein erneuter Abzug des Sicherheitsabstands)", () => {
    expect(CODEZEILEN).not.toContain("sicherheit");
  });

  it("enthaelt kein await/async/Math.random/Date/devicePixelRatio/document/window", () => {
    for (const verbot of [
      "await ",
      "async ",
      "Math.random",
      "new Date",
      "Date.",
      "devicePixelRatio",
      "document",
      "window",
    ]) {
      expect(CODEZEILEN).not.toContain(verbot);
    }
  });

  it("greift nicht auf k.zeilenhoehe zu (das Feld existiert nicht)", () => {
    expect(CODEZEILEN).not.toContain(".zeilenhöhe");
    expect(CODEZEILEN).not.toContain(".zeilenhoehe");
  });
});

// ---------------- Aufzeichnungs-Doppel ----------------

type Ereignis = { art: string; name?: string; argumente?: unknown[]; wert?: unknown };

function baueKontextDoppel(messbareBreite = 100): {
  kontext: CanvasRenderingContext2D;
  ereignisse: Ereignis[];
  fillTextAufrufe: { text: string; x: number; y: number; argumentzahl: number }[];
} {
  const ereignisse: Ereignis[] = [];
  const fillTextAufrufe: { text: string; x: number; y: number; argumentzahl: number }[] = [];

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
    set shadowColor(wert: string) {
      ereignisse.push({ art: "set", name: "shadowColor", wert });
    },
    get shadowColor() {
      return "transparent";
    },
    set shadowBlur(wert: number) {
      ereignisse.push({ art: "set", name: "shadowBlur", wert });
    },
    get shadowBlur() {
      return 0;
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
    rect(x: number, y: number, breite: number, höhe: number) {
      ereignisse.push({ art: "rufe", name: "rect", argumente: [x, y, breite, höhe] });
    },
    clip() {
      ereignisse.push({ art: "rufe", name: "clip" });
    },
    fillText(text: string, x: number, y: number, ...rest: unknown[]) {
      fillTextAufrufe.push({ text, x, y, argumentzahl: 2 + rest.length });
      ereignisse.push({ art: "rufe", name: "fillText", argumente: [text, x, y] });
    },
    measureText(t: string) {
      ereignisse.push({ art: "rufe", name: "measureText", argumente: [t] });
      return { width: messbareBreite } as TextMetrics;
    },
  } as unknown as CanvasRenderingContext2D & Record<string, unknown>;

  return { kontext: kontext as CanvasRenderingContext2D, ereignisse, fillTextAufrufe };
}

// ---------------- Marken / Aktion / Zone ----------------

const marke = (abweichendeSchriften = false): Marke => ({
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
    fliesstext: { familie: abweichendeSchriften ? "Arimo" : "Arimo", gewicht: 400, datei: "R.woff2", herkunft: 'gebuendelt' },
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
  id: "a-1",
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

const zone = (aenderungen: Partial<Zone> = {}, textAenderungen: Partial<NonNullable<Zone["text"]>> = {}): Zone => ({
  id: "ueberschrift",
  rolle: "fest",
  bindung: null,
  rahmen: { x: 96, y: 100, breite: 800, höhe: 300 },
  ausrichtung: { horizontal: "links", vertikal: "oben" },
  wennLeer: "leer",
  text: {
    schriftRolle: "headlineElegant",
    farbRolle: "textAufHell",
    größeMax: 72,
    größeMin: 24,
    maxZeilen: 3,
    ...textAenderungen,
  },
  ...aenderungen,
});

const KASKADE_FEST: KaskadenErgebnis = { zeilen: ["a", "b", "c"], größe: 50, gekürzt: false };

beforeEach(() => {
  vi.mocked(loeseFarbe).mockImplementation(function (
    this: unknown,
    m: Marke,
    r: FarbRolle,
    a: Aktion,
  ) {
    // Echtes Verhalten: 8-stelliges Hex wird in rgba umgerechnet, 6-stelliges
    // bleibt. Fuer die Tests reicht ein deterministischer, von den Argumenten
    // abhaengiger Wert.
    const wert = m.farben[r];
    if (wert === undefined) throw new Error("unbekannte Rolle");
    if (a.akzentfarbe !== null && a.akzentfarbe !== undefined) {
      // loeseFarbe (#112) ersetzt die drei Akzent-Rollen - hier nur Tracer.
      return `AKTION:${a.akzentfarbe}:${r}`;
    }
    return wert;
  });
  vi.mocked(loeseSchrift).mockImplementation((m: Marke, r: SchriftRolle) => {
    const wert = m.schriften[r];
    if (wert === undefined) throw new Error("unbekannte Schrift-Rolle");
    return wert;
  });
  vi.mocked(passeTextEin).mockImplementation((eingang: KaskadenEingang) => ({
    zeilen: [eingang.text.slice(0, 5)],
    größe: eingang.größeMax,
    gekürzt: false,
  }));
});

// ---------------- Tests ----------------

describe("zeichneTextZone (#114) - horizontale Ausrichtung", () => {
  it.each([
    ["links", "left", 96],
    ["mitte", "center", 96 + 800 / 2],
    ["rechts", "right", 96 + 800],
  ] as const)("%s setzt textAlign %s und x=%s", (horizontal, erwartetAlign, erwartetX) => {
    const { kontext, ereignisse, fillTextAufrufe } = baueKontextDoppel();
    zeichneTextZone(
      kontext,
      zone({ ausrichtung: { horizontal, vertikal: "oben" } }),
      "Beispiel",
      marke(),
      aktion(null),
    );

    const align = ereignisse.find((e) => e.art === "set" && e.name === "textAlign");
    expect(align?.wert).toBe(erwartetAlign);
    expect(fillTextAufrufe).toHaveLength(1);
    expect(fillTextAufrufe[0]?.x).toBe(erwartetX);
  });
});

describe("zeichneTextZone (#114) - vertikale Ausrichtung (Kaskaden-Doppel)", () => {
  const daten = { zeilen: ["a", "b", "c"], größe: 50, gekürzt: false } as KaskadenErgebnis;

  beforeEach(() => {
    vi.mocked(passeTextEin).mockReturnValue(daten);
  });

  // zeilenhöhe = 50 * 1.2 = 60, blockHöhe = 180, y = 100, höhe = 300
  it.each([
    ["oben", 100],
    ["mitte", 160],
    ["unten", 220],
  ] as const)("%s startet die erste Zeile bei y=%s", (vertikal, erwartetY) => {
    const { kontext, fillTextAufrufe } = baueKontextDoppel();
    zeichneTextZone(
      kontext,
      zone({ ausrichtung: { horizontal: "links", vertikal } }),
      "Beispiel",
      marke(),
      aktion(null),
    );

    expect(fillTextAufrufe).toHaveLength(3);
    expect(fillTextAufrufe[0]?.y).toBe(erwartetY);
    // Die zweite Zeile liegt genau eine Zeilenhöhe tiefer.
    expect(fillTextAufrufe[1]?.y).toBe((erwartetY as number) + 60);
  });
});

describe("zeichneTextZone (#114) - Kaskaden-Vertrag", () => {
  it("importiert den Faktor aus #113 und rechnet damit (Probe: 50 * FAKTOR)", () => {
    expect(ZEILENHOEHE_FAKTOR).toBe(1.2);
  });

  it("ruft passeTextEin mit GENAU zwei Argumenten auf: Eingang + Messer", () => {
    const { kontext } = baueKontextDoppel();
    const z = zone({}, { größeMax: 72, größeMin: 24, maxZeilen: 3 });
    zeichneTextZone(kontext, z, "Beispiel", marke(), aktion(null));

    const ruf = vi.mocked(passeTextEin).mock.calls.at(-1);
    expect(ruf).toBeDefined();
    expect(ruf).toHaveLength(2);

    const eingang = ruf?.[0] as KaskadenEingang;
    expect(eingang).toEqual({
      text: "Beispiel",
      breite: 800,
      höhe: 300,
      größeMax: 72,
      größeMin: 24,
      maxZeilen: 3,
    });
  });

  it("setzt ctx.font VOR JEDEM measureText (Messer misst auf demselben ctx)", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    // Echte Kaskade: sie misst mehrfach (Stufen), hier mit abwechselnden
    // Probiergroessen - der Test schreibt mit, welche angefordert wurde.
    const angefordert: number[] = [];
    vi.mocked(passeTextEin).mockImplementation(
      (eingang: KaskadenEingang, messe: (t: string, g: number) => number) => {
        messe("Beispiel", eingang.größeMax);
        angefordert.push(eingang.größeMax);
        messe("Beispiel", eingang.größeMax - 4);
        angefordert.push(eingang.größeMax - 4);
        return { zeilen: ["Beispiel"], größe: eingang.größeMax - 4, gekürzt: false };
      },
    );
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));

    // Vor dem i-ten measureText stand die i-te angeforderte Groesse im ctx.font.
    const messungen = ereignisse
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.art === "rufe" && e.name === "measureText");
    expect(messungen.length).toBeGreaterThanOrEqual(2);
    messungen.forEach(({ i }, stufe) => {
      const letzteFont = ereignisse.slice(0, i)
        .filter((e) => e.art === "set" && e.name === "font")
        .at(-1)?.wert as string;
      expect(letzteFont).toBe(
        schriftKurzform(marke().schriften.headlineElegant, angefordert[stufe] ?? 0),
      );
    });
  });

  it("setzt ctx.font NACH der Kaskade erneut mit der gewaehlten Groesse", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    vi.mocked(passeTextEin).mockReturnValue({ zeilen: ["x"], größe: 31, gekürzt: false });
    zeichneTextZone(
      kontext,
      zone({}, { größeMax: 72 }),
      "Beispiel",
      marke(),
      aktion(null),
    );

    // Alle font-Sets NACH dem letzten measureText - genau eines, mit 31.
    const letzteMessung = ereignisse.map((e, i) => ({ e, i }))
      .filter(({ e }) => e.art === "rufe" && e.name === "measureText")
      .at(-1)?.i ?? -1;
    const danach = ereignisse.slice(letzteMessung + 1).filter(
      (e) => e.art === "set" && e.name === "font",
    );
    expect(danach).toHaveLength(1);
    expect(danach[0]?.wert).toBe(schriftKurzform(marke().schriften.headlineElegant, 31));
  });
});

describe("zeichneTextZone (#114) - Rahmen unverändert, Beschnitt, fillText-Form", () => {
  it("zeichnet bei x=96 wirklich bei 96 - NICHT bei 192 (kein zweiter Abzug)", () => {
    const { kontext, fillTextAufrufe } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));
    expect(fillTextAufrufe[0]?.x).toBe(96);
    expect(fillTextAufrufe[0]?.x).not.toBe(192);
  });

  it("setzt rect + clip mit GENAU den Rahmenwerten, bevor der erste fillText kommt", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));

    const ersterFillText = ereignisse.findIndex((e) => e.art === "rufe" && e.name === "fillText");
    expect(ersterFillText).toBeGreaterThan(-1);

    const rectRufe = ereignisse.map((e, i) => ({ e, i }))
      .filter(({ e }) => e.art === "rufe" && e.name === "rect");
    expect(rectRufe).toHaveLength(1);
    expect(rectRufe[0]?.e.argumente).toEqual([96, 100, 800, 300]);

    const clipIndex = ereignisse.findIndex((e) => e.art === "rufe" && e.name === "clip");
    expect(clipIndex).toBeGreaterThan(-1);
    expect(clipIndex).toBeLessThan(ersterFillText);
  });

  it("ruft fillText ohne viertes Argument (maxWidth) auf", () => {
    const { kontext, fillTextAufrufe } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));
    for (const ruf of fillTextAufrufe) {
      expect(ruf.argumentzahl).toBe(2);
    }
  });

  it("lueckenlose Klammerung: genau ein save, genau ein restore, restore nach letztem fillText", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));

    const saves = ereignisse.filter((e) => e.art === "rufe" && e.name === "save");
    const restores = ereignisse.filter((e) => e.art === "rufe" && e.name === "restore");
    expect(saves).toHaveLength(1);
    expect(restores).toHaveLength(1);

    const letzterFillText = ereignisse.map((e, i) => ({ e, i }))
      .filter(({ e }) => e.art === "rufe" && e.name === "fillText")
      .at(-1)?.i ?? -1;
    expect(erster(ereignisse, "save")).toBeLessThan(letzterFillText);
    expect(letzter(ereignisse, "restore")).toBeGreaterThan(letzterFillText);
  });
});

function erster(ereignisse: Ereignis[], name: string): number {
  return ereignisse.findIndex((e) => e.art === "rufe" && e.name === name);
}
function letzter(ereignisse: Ereignis[], name: string): number {
  const idx = ereignisse.map((e, i) => ({ e, i }))
    .filter(({ e }) => e.art === "rufe" && e.name === name)
    .map(({ i }) => i);
  return idx.at(-1) ?? -1;
}

describe("zeichneTextZone (#114) - Farbe und Schrift nur über #112/#110", () => {
  it("ruft loeseFarbe mit (marke, rolle, aktion) in dieser Reihenfolge", () => {
    const { kontext } = baueKontextDoppel();
    const m = marke();
    const a = aktion(null);
    zeichneTextZone(kontext, zone({}, { farbRolle: "textAufHell" }), "Beispiel", m, a);

    const ruf = vi.mocked(loeseFarbe).mock.calls.at(-1);
    expect(ruf?.[0]).toBe(m);
    expect(ruf?.[1]).toBe("textAufHell");
    expect(ruf?.[2]).toBe(a);
    expect(ruf).toHaveLength(3);
  });

  it("ruft loeseSchrift mit (marke, rolle) und liest marke.schriften nicht selbst", () => {
    const { kontext } = baueKontextDoppel();
    const m = marke();
    zeichneTextZone(kontext, zone({}, { schriftRolle: "headlinePlakativ" }), "Beispiel", m, aktion(null));
    const ruf = vi.mocked(loeseSchrift).mock.calls.at(-1);
    expect(ruf?.[0]).toBe(m);
    expect(ruf?.[1]).toBe("headlinePlakativ");
  });

  it("setzt fillStyle auf den Wert von loeseFarbe", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));
    const fillStyle = ereignisse.filter((e) => e.art === "set" && e.name === "fillStyle");
    expect(fillStyle).toHaveLength(1);
    expect(fillStyle[0]?.wert).toBe("#202020"); // textAufHell aus der Probe-Marke
  });

  it("setzt keinen Schatten und keine andere Baseline als top", () => {
    const { kontext, ereignisse } = baueKontextDoppel();
    zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null));
    const schatten = ereignisse.filter((e) => e.art === "set" && e.name === "shadowColor");
    expect(schatten).toHaveLength(1);
    expect(schatten[0]?.wert).toBe("transparent");
    const blur = ereignisse.filter((e) => e.art === "set" && e.name === "shadowBlur");
    expect(blur).toHaveLength(1);
    expect(blur[0]?.wert).toBe(0);
    const baseline = ereignisse.filter((e) => e.art === "set" && e.name === "textBaseline");
    expect(baseline).toHaveLength(1);
    expect(baseline[0]?.wert).toBe("top");
  });
});

describe("zeichneTextZone (#114) - Fehlerpfade werfen nicht", () => {
  it("loeseSchrift wirft -> kein fillText, keine Ausnahme, restore gelaufen", () => {
    vi.mocked(loeseSchrift).mockImplementation(() => {
      throw new Error("unbekannte Rolle");
    });
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    expect(() => zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "restore")).toBeGreaterThan(-1);
  });

  it("loeseFarbe wirft -> kein fillText, keine Ausnahme, restore gelaufen", () => {
    vi.mocked(loeseFarbe).mockImplementation(() => {
      throw new Error("unzulässiges Farbformat");
    });
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    expect(() => zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "restore")).toBeGreaterThan(-1);
  });

  it("passeTextEin wirft -> kein fillText, keine Ausnahme, restore gelaufen", () => {
    vi.mocked(passeTextEin).mockImplementation(() => {
      throw new Error("kaputte Zonen-Parameter");
    });
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    expect(() => zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "restore")).toBeGreaterThan(-1);
  });
});

describe("zeichneTextZone (#114) - Abbruchbedingungen (kein save)", () => {
  it.each([
    ["leerer Text", { text: "" }],
    ["nur Leerzeichen", { text: "   \t\n " }],
  ])("%s -> kein fillText, keine Ausnahme, kein save", (_name, eingang) => {
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    expect(() =>
      zeichneTextZone(kontext, zone(), eingang.text, marke(), aktion(null)),
    ).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "save")).toBe(-1);
  });

  it("fehlendes zone.text -> kein fillText, keine Ausnahme, kein save", () => {
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    const ohneText = zone();
    delete (ohneText as Partial<Zone>).text;
    expect(() => zeichneTextZone(kontext, ohneText as Zone, "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "save")).toBe(-1);
  });

  it("breite = 0 -> kein fillText, keine Ausnahme, kein save", () => {
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    const schmaleZone = zone({ rahmen: { x: 96, y: 100, breite: 0, höhe: 300 } });
    expect(() => zeichneTextZone(kontext, schmaleZone, "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "save")).toBe(-1);
  });

  it("höhe nicht endlich -> kein fillText, kein save", () => {
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    const z = zone({ rahmen: { x: 96, y: 100, breite: 800, höhe: Number.NaN } });
    expect(() => zeichneTextZone(kontext, z, "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "save")).toBe(-1);
  });
});

describe("zeichneTextZone (#114) - leeres Kaskadenergebnis", () => {
  it("zeilen: [] -> kein fillText, restore trotzdem", () => {
    vi.mocked(passeTextEin).mockReturnValue({ zeilen: [], größe: 50, gekürzt: false });
    const { kontext, fillTextAufrufe, ereignisse } = baueKontextDoppel();
    expect(() => zeichneTextZone(kontext, zone(), "Beispiel", marke(), aktion(null))).not.toThrow();
    expect(fillTextAufrufe).toHaveLength(0);
    expect(erster(ereignisse, "restore")).toBeGreaterThan(-1);
  });
});
