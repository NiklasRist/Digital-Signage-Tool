// Verhaltenstests zu #148 - Pruefungen des Editors: harte Sperre gegen Warnung
// (TK 9.12.2, 9.11.2, 9.10.5, 9.11.1, 9.12.1).
//
// Der schaerfste Test ist der erste: Die drei EINGEBAUTEN Vorlagen liefern eine leere
// Befundliste. Die Pruefdaten stehen hier als Literale (der Renderer darf nicht aus
// src/main/** importieren) - Zone fuer Zone nach dem Block "Pruefdaten der drei
// eingebauten Vorlagen" im Issue #148. Schlaegt der Test fehl, ist die Pruefung falsch,
// NICHT die Pruefdaten.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import type { FarbRolle, SchriftRolle } from "../../src/shared/contracts/marke";
import type { Zone, Vorlage } from "../../src/shared/contracts/vorlage";

import {
  bandSicherheitsLinie,
  istSpeicherbar,
  pruefeVorlage,
} from "../../src/renderer/vorlagen-editor/pruefungen";

// ---------------------------------------------------------------------------
// Pruefdaten: die drei eingebauten Vorlagen (TK 9.11.1, Werte aus #96).
// ---------------------------------------------------------------------------

const DUNKEL: FarbRolle = "flaecheDunkel";
const TEXT_DUNKEL: FarbRolle = "textAufDunkel";
const TEXT_HELL: FarbRolle = "textAufHell";
const AKZENT: FarbRolle = "akzent";
const HELL: FarbRolle = "flaecheHell";
const PLAKATIV: SchriftRolle = "headlinePlakativ";
const FLIESSTEXT: SchriftRolle = "fliesstext";

function text(schriftRolle: SchriftRolle, farbRolle: FarbRolle, max: number, min: number, maxZeilen: number): Zone["text"] {
  return { schriftRolle, farbRolle, größeMax: max, größeMin: min, maxZeilen };
}

function bild(einpassung: "contain" | "cover"): Zone["bild"] {
  return { einpassung };
}

function deko(füllungFarbRolle: FarbRolle, radius: number): Zone["deko"] {
  return { füllungFarbRolle, radius };
}

/** Die Vorlage "Vollbild" - art vollflaeche, hoehe null (TK 9.11.1). */
function vollbild(): Vorlage {
  return {
    id: "vollbild",
    name: "Vollbild",
    art: "vollflaeche",
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [
      {
        id: "hintergrund",
        rolle: "fest",
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        deko: { füllungFarbRolle: DUNKEL },
      },
      {
        id: "motiv",
        rolle: "frei",
        bindung: "bild",
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "leer",
        bild: bild("cover"),
      },
      {
        id: "scrim",
        rolle: "fest",
        bindung: null,
        rahmen: { x: 0, y: 432, breite: 1920, höhe: 648 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        deko: {
          verlauf: { vonFarbRolle: "scrimStart", bisFarbRolle: "scrimEnde", richtung: "unten" },
        },
      },
      {
        id: "logo",
        rolle: "fest",
        bindung: "logo",
        rahmen: { x: 96, y: 54, breite: 420, höhe: 120 },
        ausrichtung: { horizontal: "links", vertikal: "mitte" },
        wennLeer: "leer",
        bild: bild("contain"),
      },
      {
        id: "ueberschrift",
        rolle: "frei",
        bindung: "titel",
        rahmen: { x: 96, y: 640, breite: 1150, höhe: 190 },
        ausrichtung: { horizontal: "links", vertikal: "unten" },
        wennLeer: "leer",
        text: text(PLAKATIV, TEXT_DUNKEL, 96, 56, 2),
      },
      {
        id: "beschreibung",
        rolle: "frei",
        bindung: "beschreibung",
        rahmen: { x: 96, y: 850, breite: 1150, höhe: 100 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        text: text(FLIESSTEXT, TEXT_DUNKEL, 48, 34, 2),
      },
      {
        id: "preis",
        rolle: "frei",
        bindung: "preis",
        rahmen: { x: 1300, y: 660, breite: 524, höhe: 150 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_DUNKEL, 84, 48, 1),
        deko: deko(AKZENT, 40),
      },
      {
        id: "cta",
        rolle: "frei",
        bindung: "cta",
        rahmen: { x: 1300, y: 830, breite: 524, höhe: 120 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_HELL, 56, 36, 1),
        deko: deko(HELL, 40),
      },
    ],
  };
}

/** Die Vorlage "Split" - art vollflaeche (id 'split' ist VOLLFLÄCHIG!), hoehe null. */
function split(): Vorlage {
  return {
    id: "split",
    name: "Split",
    art: "vollflaeche",
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [
      {
        id: "hintergrund",
        rolle: "fest",
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        deko: { füllungFarbRolle: DUNKEL },
      },
      {
        id: "motiv",
        rolle: "frei",
        bindung: "bild",
        rahmen: { x: 0, y: 0, breite: 960, höhe: 1080 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "leer",
        bild: bild("contain"),
      },
      {
        id: "logo",
        rolle: "fest",
        bindung: "logo",
        rahmen: { x: 1056, y: 54, breite: 420, höhe: 120 },
        ausrichtung: { horizontal: "links", vertikal: "mitte" },
        wennLeer: "leer",
        bild: bild("contain"),
      },
      {
        id: "ueberschrift",
        rolle: "frei",
        bindung: "titel",
        rahmen: { x: 1056, y: 260, breite: 768, höhe: 240 },
        ausrichtung: { horizontal: "links", vertikal: "unten" },
        wennLeer: "leer",
        text: text(PLAKATIV, TEXT_DUNKEL, 84, 52, 3),
      },
      {
        id: "beschreibung",
        rolle: "frei",
        bindung: "beschreibung",
        rahmen: { x: 1056, y: 530, breite: 768, höhe: 200 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        text: text(FLIESSTEXT, TEXT_DUNKEL, 40, 30, 4),
      },
      {
        id: "preis",
        rolle: "frei",
        bindung: "preis",
        rahmen: { x: 1056, y: 780, breite: 360, höhe: 130 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_DUNKEL, 72, 44, 1),
        deko: deko(AKZENT, 40),
      },
      {
        id: "cta",
        rolle: "frei",
        bindung: "cta",
        rahmen: { x: 1056, y: 930, breite: 500, höhe: 96 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_HELL, 48, 32, 1),
        deko: deko(HELL, 40),
      },
    ],
  };
}

/** Die Vorlage "Band-Standard" - art split, hoehe 162 (TK 9.11.1). */
function bandStandard(): Vorlage {
  return {
    id: "band-standard",
    name: "Band-Standard",
    art: "split",
    höhe: 162,
    parent: null,
    eingebaut: true,
    zonen: [
      {
        id: "hintergrund",
        rolle: "fest",
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 162 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
        deko: { füllungFarbRolle: DUNKEL },
      },
      {
        id: "logo",
        rolle: "fest",
        bindung: "logo",
        rahmen: { x: 96, y: 20, breite: 240, höhe: 69 },
        ausrichtung: { horizontal: "links", vertikal: "mitte" },
        wennLeer: "leer",
        bild: bild("contain"),
      },
      {
        id: "titel",
        rolle: "frei",
        bindung: "titel",
        rahmen: { x: 380, y: 18, breite: 900, höhe: 72 },
        ausrichtung: { horizontal: "links", vertikal: "mitte" },
        wennLeer: "leer",
        text: text(PLAKATIV, TEXT_DUNKEL, 64, 44, 1),
      },
      {
        id: "preis",
        rolle: "frei",
        bindung: "preis",
        rahmen: { x: 1330, y: 18, breite: 240, höhe: 72 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_DUNKEL, 48, 32, 1),
        deko: deko(AKZENT, 36),
      },
      {
        id: "cta",
        rolle: "frei",
        bindung: "cta",
        rahmen: { x: 1590, y: 18, breite: 234, höhe: 72 },
        ausrichtung: { horizontal: "mitte", vertikal: "mitte" },
        wennLeer: "ausblenden",
        text: text(PLAKATIV, TEXT_HELL, 40, 28, 1),
        deko: deko(HELL, 36),
      },
    ],
  };
}

function feste(zone: Zone): Zone {
  return { ...zone, rolle: "fest" };
}

/** Eine minimale, gültige Band-Vorlage für die Band-spezifischen Tests. */
function band(höhe: number, zonen: Zone[]): Vorlage {
  return {
    id: "band-x",
    name: "Band X",
    art: "split",
    höhe,
    parent: null,
    eingebaut: false,
    zonen,
  };
}

describe("Die drei eingebauten Vorlagen liefern eine LEERE Befundliste", () => {
  it.each([
    ["Vollbild", vollbild()],
    ["Split", split()],
    ["Band-Standard", bandStandard()],
  ])("%s", (_name, vorlage) => {
    const soll = vorlage.zonen.filter((z) => z.rolle === "fest");
    const befunde = pruefeVorlage(vorlage, soll);
    expect(befunde).toEqual([]);
  });
});

describe("zone_ausserhalb (Sperre)", () => {
  it("eine Zone mit y + hoehe groesser als die Flaeche liefert GENAU EINEN Befund", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "ok", rolle: "frei", bindung: null, rahmen: { x: 0, y: 0, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
        { id: "raus", rolle: "frei", bindung: null, rahmen: { x: 0, y: 1000, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
      ],
    };
    const befunde = pruefeVorlage(vorlage, []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "zone_ausserhalb", schwere: "sperre", zonenId: "raus" });
  });
});

describe("sicherheitsabstand (Warnung)", () => {
  it("ein Band mit Textzone bei y 100/hoehe 40 liefert eine WARNUNG und bleibt speicherbar", () => {
    const vorlage = band(162, [
      feste({ id: "hintergrund", rolle: "fest", bindung: null, rahmen: { x: 0, y: 0, breite: 1920, höhe: 162 }, ausrichtung: { horizontal: "links", vertikal: "oben" }, wennLeer: "leer", deko: { füllungFarbRolle: DUNKEL } }),
      { id: "titel", rolle: "frei", bindung: "titel", rahmen: { x: 96, y: 100, breite: 900, höhe: 40 }, ausrichtung: { horizontal: "links", vertikal: "mitte" }, wennLeer: "leer", text: text(PLAKATIV, TEXT_DUNKEL, 48, 32, 1) },
    ]);
    const befunde = pruefeVorlage(vorlage, [vorlage.zonen[0]!]);
    const warnung = befunde.filter((b) => b.code === "sicherheitsabstand");
    expect(warnung).toHaveLength(1);
    expect(warnung[0]!.schwere).toBe("warnung");
    expect(warnung[0]!.zonenId).toBe("titel");
    expect(istSpeicherbar(befunde)).toBe(true);
  });

  it("eine Dekorationszone ohne Text ueber die volle Flaeche warnt nicht", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "deko", rolle: "frei", bindung: null, rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 }, ausrichtung: { horizontal: "links", vertikal: "oben" }, wennLeer: "leer", deko: { füllungFarbRolle: DUNKEL } },
      ],
    };
    expect(pruefeVorlage(vorlage, [])).toEqual([]);
  });

  it("eine Zone mit bindung 'bild' ueber die volle Flaeche warnt nicht", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "motiv", rolle: "frei", bindung: "bild", rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer", bild: bild("cover") },
      ],
    };
    expect(pruefeVorlage(vorlage, [])).toEqual([]);
  });
});

describe("Geradzahligkeit der Bandhoehe (Sperre)", () => {
  const innen = (): Zone[] => [
    { id: "titel", rolle: "frei", bindung: "titel", rahmen: { x: 96, y: 20, breite: 900, höhe: 60 }, ausrichtung: { horizontal: "links", vertikal: "mitte" }, wennLeer: "leer", text: text(PLAKATIV, TEXT_DUNKEL, 48, 32, 1) },
  ];

  it.each([
    ["split", 161, 162],
    ["einblendung", 199, 200],
  ] as const)("art %s: hoehe %i -> genau ein bandhoehe_ungueltig, hoehe %i -> keiner", (art, ungerade, gerade) => {
    const ungueltig = pruefeVorlage(
      { id: "b", name: "B", art, höhe: ungerade, parent: null, eingebaut: false, zonen: innen() },
      [],
    );
    expect(ungueltig).toHaveLength(1);
    expect(ungueltig[0]).toMatchObject({
      code: "bandhoehe_ungueltig",
      schwere: "sperre",
      zonenId: null,
    });
    expect(istSpeicherbar(ungueltig)).toBe(false);

    const gueltig = pruefeVorlage(
      { id: "b", name: "B", art, höhe: gerade, parent: null, eingebaut: false, zonen: innen() },
      [],
    );
    expect(gueltig.filter((b) => b.code === "bandhoehe_ungueltig")).toEqual([]);
    expect(gueltig).toEqual([]);
  });

  it("die ungerade Hoehe erzeugt KEINE zone_ausserhalb und bleibt unveraendert (nicht gerundet)", () => {
    const vorlage: Vorlage = { id: "b", name: "B", art: "split", höhe: 161, parent: null, eingebaut: false, zonen: innen() };
    const befunde = pruefeVorlage(vorlage, []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]!.code).toBe("bandhoehe_ungueltig");
    expect(befunde[0]!.zonenId).toBeNull();
    expect(vorlage.höhe).toBe(161);
  });

  it("bei hoehe null bekommt JEDE Zone ein zone_ausserhalb dazu (Flaeche degradiert auf 0)", () => {
    const vorlage: Vorlage = { id: "b", name: "B", art: "split", höhe: null, parent: null, eingebaut: false, zonen: innen() };
    const befunde = pruefeVorlage(vorlage, []);
    const codes = befunde.map((b) => b.code);
    expect(codes.filter((c) => c === "bandhoehe_ungueltig")).toHaveLength(1);
    expect(codes.filter((c) => c === "zone_ausserhalb")).toHaveLength(1);
  });

  it("eine vollflaechige Vorlage mit gesetzter hoehe liefert GENAU EINEN Befund (keine Zonenbefunde)", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: 100,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "ok", rolle: "frei", bindung: null, rahmen: { x: 0, y: 0, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
      ],
    };
    const befunde = pruefeVorlage(vorlage, []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "bandhoehe_ungueltig", zonenId: null });
  });
});

describe("textparameter_fehlen / bildparameter_fehlen (Sperre)", () => {
  it("eine Textzone ohne text-Block wird gesperrt", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "ueberschrift", rolle: "frei", bindung: "titel", rahmen: { x: 96, y: 640, breite: 500, höhe: 100 }, ausrichtung: { horizontal: "links", vertikal: "unten" }, wennLeer: "leer" },
      ],
    };
    const befunde = pruefeVorlage(vorlage, []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "textparameter_fehlen", schwere: "sperre", zonenId: "ueberschrift" });
  });

  it("eine Bild-Zone (bindung bild) ohne bild-Block wird gesperrt", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "motiv", rolle: "frei", bindung: "bild", rahmen: { x: 0, y: 0, breite: 500, höhe: 300 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
      ],
    };
    const befunde = pruefeVorlage(vorlage, []);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "bildparameter_fehlen", schwere: "sperre", zonenId: "motiv" });
  });
});

describe("feste_zone_veraendert (Sperre)", () => {
  it("eine veränderte feste Zone wird gesperrt", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { ...feste({ id: "logo", rolle: "fest", bindung: "logo", rahmen: { x: 96, y: 54, breite: 420, höhe: 120 }, ausrichtung: { horizontal: "links", vertikal: "mitte" }, wennLeer: "leer", bild: bild("contain") }), rahmen: { x: 100, y: 54, breite: 420, höhe: 120 } },
      ],
    };
    const soll: Zone[] = [{ id: "logo", rolle: "fest", bindung: "logo", rahmen: { x: 96, y: 54, breite: 420, höhe: 120 }, ausrichtung: { horizontal: "links", vertikal: "mitte" }, wennLeer: "leer", bild: bild("contain") }];
    const befunde = pruefeVorlage(vorlage, soll);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "feste_zone_veraendert", schwere: "sperre", zonenId: "logo" });
  });

  it("eine entfernte feste Zone meldet die id aus festeZonenSoll", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [],
    };
    const soll: Zone[] = [{ id: "logo", rolle: "fest", bindung: "logo", rahmen: { x: 96, y: 54, breite: 420, höhe: 120 }, ausrichtung: { horizontal: "links", vertikal: "mitte" }, wennLeer: "leer", bild: bild("contain") }];
    const befunde = pruefeVorlage(vorlage, soll);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ code: "feste_zone_veraendert", schwere: "sperre", zonenId: "logo" });
  });

  it("eine in der relativen Reihenfolge verschobene feste Zone wird gesperrt", () => {
    const a = feste({ id: "a", rolle: "fest", bindung: null, rahmen: { x: 0, y: 0, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "links", vertikal: "oben" }, wennLeer: "leer" });
    const b = feste({ id: "b", rolle: "fest", bindung: null, rahmen: { x: 200, y: 0, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "links", vertikal: "oben" }, wennLeer: "leer" });
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [b, a],
    };
    const befunde = pruefeVorlage(vorlage, [a, b]);
    const sperren = befunde.filter((f) => f.code === "feste_zone_veraendert");
    expect(sperren.length).toBeGreaterThan(0);
    expect(sperren[0]!.schwere).toBe("sperre");
  });
});

describe("Ueberlappung", () => {
  it("zwei ueberlappende Zonen liefern keinen Befund", () => {
    const vorlage: Vorlage = {
      id: "v",
      name: "V",
      art: "vollflaeche",
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [
        { id: "a", rolle: "frei", bindung: null, rahmen: { x: 0, y: 0, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
        { id: "b", rolle: "frei", bindung: null, rahmen: { x: 50, y: 50, breite: 100, höhe: 100 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
      ],
    };
    expect(pruefeVorlage(vorlage, [])).toEqual([]);
  });
});

describe("istSpeicherbar", () => {
  it("ist genau dann false, wenn mindestens ein Befund schwere 'sperre' traegt", () => {
    expect(istSpeicherbar([])).toBe(true);
    expect(istSpeicherbar([{ schwere: "warnung", code: "sicherheitsabstand", zonenId: "x", meldung: "m" }])).toBe(true);
    expect(
      istSpeicherbar([
        { schwere: "warnung", code: "sicherheitsabstand", zonenId: "x", meldung: "m" },
        { schwere: "sperre", code: "zone_ausserhalb", zonenId: "x", meldung: "m" },
      ]),
    ).toBe(false);
  });
});

describe("bandSicherheitsLinie", () => {
  it("liefert 108 bei hoehe 162", () => {
    expect(bandSicherheitsLinie(band(162, []))).toBe(108);
  });

  it("liefert null bei vollflaeche", () => {
    expect(bandSicherheitsLinie(vollbild())).toBeNull();
  });

  it("liefert null bei hoehe 40 (nichts sicher)", () => {
    expect(bandSicherheitsLinie(band(40, []))).toBeNull();
  });

  it("leitet den Wert aus sicherheitsBox ab - KEINE eigene Subtraktion mit der Konstante", () => {
    const CODE = readFileSync("src/renderer/vorlagen-editor/pruefungen.ts", "utf-8");
    const ab = CODE.indexOf("export function bandSicherheitsLinie");
    const rumpf = CODE.slice(ab, CODE.indexOf("Hilfsfunktionen"));
    expect(rumpf).not.toMatch(/SICHERHEITSABSTAND_PX/);
    expect(rumpf).toMatch(/sicherheitsBox/);
  });
});

describe("Determinismus und Nicht-Verbote", () => {
  it("liefert bei gleicher Eingabe reproduzierbare Befunde", () => {
    const vorlage = vollbild();
    const soll = vorlage.zonen.filter((z) => z.rolle === "fest");
    expect(pruefeVorlage(vorlage, soll)).toEqual(pruefeVorlage(vorlage, soll));
  });

  it("enthaelt kein sort im Quelltext", () => {
    const CODE = readFileSync("src/renderer/vorlagen-editor/pruefungen.ts", "utf-8");
    expect(CODE).not.toMatch(/\.sort\(/);
  });

  it("verändert weder die Vorlage noch eine Zone", () => {
    const vorlage = vollbild();
    const soll = vorlage.zonen.filter((z) => z.rolle === "fest");
    const vorher = JSON.stringify(vorlage);
    pruefeVorlage(vorlage, soll);
    expect(JSON.stringify(vorlage)).toBe(vorher);
  });
});