import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { SICHERHEITSABSTAND_PX } from "../../src/shared/contracts/konstanten";
import { loeseFarbe, loeseSchrift } from "../../src/renderer/template-canvas/farben";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { FarbRolle, Marke, SchriftRolle } from "../../src/shared/contracts/marke";

const QUELLE = readFileSync(
  new URL("../../src/renderer/template-canvas/farben.ts", import.meta.url),
  "utf8",
);

const CODEZEILEN = QUELLE.split("\n").filter((z) => {
  const t = z.trim();
  return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
}).join("\n");

// Die dreizehn Farb-Rollen mit ihren Werten aus TK 9.11.2.
const FARBEN: Record<FarbRolle, string> = {
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
};

const marke = (farben: Record<FarbRolle, string> = FARBEN): Marke => ({
  farben,
  schriften: {
    headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "PlayfairDisplay-Bold.woff2" },
    headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "ArchivoBlack-Regular.woff2" },
    fliesstext: { familie: "Arimo", gewicht: 400, datei: "Arimo-Regular.woff2" },
    fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "Arimo-Bold.woff2" },
  },
  logo: { datei: "logo.png", seitenverhaeltnis: 3.5 },
  sicherheit: SICHERHEITSABSTAND_PX,
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#00000040" },
  slogan: { text: "", aktiv: false },
});

const aktion = (akzentfarbe: string | null): Aktion => ({
  id: "a1",
  titel: "Probeaktion",
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: "vollbild",
  akzentfarbe,
});

const OHNE_WAHL = aktion(null);

const AKZENT_ROLLEN: FarbRolle[] = ["akzent", "akzentKraeftig", "akzentTief"];
const UEBRIGE_ROLLEN = (Object.keys(FARBEN) as FarbRolle[]).filter(
  (r) => !AKZENT_ROLLEN.includes(r),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loeseFarbe – Markenwerte", () => {
  it.each(Object.keys(FARBEN) as FarbRolle[])("löst %s auf", (rolle) => {
    const erwartet = rolle === "scrimStart"
      ? "rgba(0, 0, 0, 0)"
      : rolle === "scrimEnde"
        ? "rgba(0, 0, 0, 0.702)"
        : FARBEN[rolle];
    expect(loeseFarbe(marke(), rolle, OHNE_WAHL)).toBe(erwartet);
  });

  it("reicht sechsstelliges Hex unverändert durch, auch in Kleinschreibung", () => {
    const m = marke({ ...FARBEN, linie: "#aabbcc" });
    expect(loeseFarbe(m, "linie", OHNE_WAHL)).toBe("#aabbcc");
  });

  it("liefert bei zweimaligem Auflösen denselben Wert", () => {
    const m = marke();
    expect(loeseFarbe(m, "scrimEnde", OHNE_WAHL)).toBe(loeseFarbe(m, "scrimEnde", OHNE_WAHL));
  });
});

describe("loeseFarbe – achtstelliges Hex wird zu rgba()", () => {
  it.each([
    ["#000000B3", "rgba(0, 0, 0, 0.702)"],
    ["#00000000", "rgba(0, 0, 0, 0)"],
    ["#0000001A", "rgba(0, 0, 0, 0.102)"],
    ["#FF4040FF", "rgba(255, 64, 64, 1)"],
  ])("%s -> %s", (hex, erwartet) => {
    expect(loeseFarbe(marke({ ...FARBEN, linie: hex }), "linie", OHNE_WAHL)).toBe(erwartet);
  });

  it("formatiert die Deckkraft nicht sprachabhängig", () => {
    const toLocale = vi
      .spyOn(Number.prototype, "toLocaleString")
      .mockReturnValue("0,702");
    const numberFormat = vi.spyOn(Intl, "NumberFormat");

    expect(loeseFarbe(marke(), "scrimEnde", OHNE_WAHL)).toBe("rgba(0, 0, 0, 0.702)");
    expect(toLocale).not.toHaveBeenCalled();
    expect(numberFormat).not.toHaveBeenCalled();
  });
});

describe("loeseFarbe – Akzent-Ersetzung (TK 9.10.9)", () => {
  const mitWahl = aktion("akzentTief");

  it.each(AKZENT_ROLLEN)("%s trägt die gewählte Akzentfarbe", (rolle) => {
    expect(loeseFarbe(marke(), rolle, mitWahl)).toBe("#971316");
  });

  it.each(AKZENT_ROLLEN)("%s trägt ohne Wahl wieder den Markenwert", (rolle) => {
    expect(loeseFarbe(marke(), rolle, OHNE_WAHL)).toBe(FARBEN[rolle]);
  });

  it.each(UEBRIGE_ROLLEN)("%s bleibt trotz gewählter Akzentfarbe unberührt", (rolle) => {
    const erwartet = rolle === "scrimStart"
      ? "rgba(0, 0, 0, 0)"
      : rolle === "scrimEnde"
        ? "rgba(0, 0, 0, 0.702)"
        : FARBEN[rolle];
    expect(loeseFarbe(marke(), rolle, mitWahl)).toBe(erwartet);
  });

  it("nimmt jede Rolle der Palette als Akzentfarbe an, nicht nur die drei Akzent-Rollen", () => {
    expect(loeseFarbe(marke(), "akzent", aktion("flaecheHell"))).toBe("#FFFFFF");
  });

  it("rechnet eine achtstellige Akzentfarbe genauso um wie einen Markenwert", () => {
    expect(loeseFarbe(marke(), "akzent", aktion("scrimEnde"))).toBe("rgba(0, 0, 0, 0.702)");
  });

  it.each(["#FF4040", "unsinn", "rot", ""])(
    "wirft bei akzentfarbe %o statt auf den Markenwert zurückzufallen",
    (wert) => {
      expect(() => loeseFarbe(marke(), "akzent", aktion(wert))).toThrow(/akzent/);
    },
  );

  it("nennt beim Wurf den Wert und die angefragte Rolle", () => {
    expect(() => loeseFarbe(marke(), "akzentKraeftig", aktion("#FF4040"))).toThrow(
      /#FF4040[\s\S]*akzentKraeftig/,
    );
  });
});

describe("loeseFarbe – Fehlerpfade", () => {
  it("wirft bei einer Rolle, die die Marke nicht führt", () => {
    const { linie: _entfernt, ...ohneLinie } = FARBEN;
    const m = marke(ohneLinie as Record<FarbRolle, string>);
    expect(() => loeseFarbe(m, "linie", OHNE_WAHL)).toThrow(/linie/);
  });

  it.each(["#FFF", "red", "rgb(0,0,0)", "", "FF4040", "#FF40401"])(
    "wirft bei unzulässigem Farbformat %o",
    (wert) => {
      expect(() => loeseFarbe(marke({ ...FARBEN, linie: wert }), "linie", OHNE_WAHL)).toThrow(
        /linie/,
      );
    },
  );

  it("nennt beim Formatfehler Rolle und Wert", () => {
    expect(() => loeseFarbe(marke({ ...FARBEN, linie: "#FFF" }), "linie", OHNE_WAHL)).toThrow(
      /#FFF[\s\S]*linie|linie[\s\S]*#FFF/,
    );
  });

  it("wirft, wenn marke oder aktion fehlt", () => {
    const fehlt = null as unknown as Marke;
    expect(() => loeseFarbe(fehlt, "akzent", OHNE_WAHL)).toThrow(/marke/);
    expect(() => loeseFarbe(marke(), "akzent", null as unknown as Aktion)).toThrow(/aktion/);
  });

  it("deutet ein geerbtes Objekt-Feld nicht als Rolle", () => {
    expect(() => loeseFarbe(marke(), "constructor" as FarbRolle, OHNE_WAHL)).toThrow();
  });
});

describe("loeseSchrift", () => {
  it.each(Object.keys(marke().schriften) as SchriftRolle[])("liefert %s", (rolle) => {
    expect(loeseSchrift(marke(), rolle)).toEqual(marke().schriften[rolle]);
  });

  it("wirft bei einer Rolle, die die Marke nicht führt", () => {
    const { fliesstext: _entfernt, ...rest } = marke().schriften;
    const m = { ...marke(), schriften: rest } as Marke;
    expect(() => loeseSchrift(m, "fliesstext")).toThrow(/fliesstext/);
  });
});

describe("Bauvorschriften dieser Datei", () => {
  it("macht den dritten Parameter nicht optional", () => {
    // @ts-expect-error der dritte Parameter ist Pflicht (Festlegung 8)
    expect(() => loeseFarbe(marke(), "akzent")).toThrow();
    expect(CODEZEILEN).not.toMatch(/aktion\?/);
    expect(CODEZEILEN).not.toMatch(/aktion\s*:\s*Aktion\s*=/);
  });

  it("liest von der Aktion ausschließlich akzentfarbe", () => {
    const felder = [...CODEZEILEN.matchAll(/aktion\.(\w+)/g)].map((t) => t[1]);
    expect(new Set(felder)).toEqual(new Set(["akzentfarbe"]));
  });

  it("greift auf keinen Canvas-Kontext zu und baut keine Schrift-Kurzform", () => {
    expect(CODEZEILEN).not.toMatch(/\bctx\b|fillStyle|strokeStyle|createLinearGradient|font\s*=/);
  });

  it("führt keinen Zwischenspeicher", () => {
    expect(CODEZEILEN).not.toMatch(/new Map\(|new WeakMap\(/);
  });

  it("enthält keine literale Ersatzfarbe", () => {
    expect(CODEZEILEN).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
