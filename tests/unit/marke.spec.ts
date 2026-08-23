// Vertragstest zu #52 - `Marke`, `FarbRolle`, `SchriftRolle`, `Schrift`.
//
// DoD 2 verlangt geschlossene String-Unionen. Der Kern ist `Record<FarbRolle, string>`:
// Weil die Rolle eine geschlossene Union ist, erzwingt der Record VOLLSTAENDIGKEIT -
// eine Marke, der eine Farbe fehlt, uebersetzt nicht.
//
// WARUM DAS ZAEHLT: Die Farben werden im Render als ROLLEN nachgeschlagen, nie als
// Hexzahl (TK v2.8 E-8). Waere `FarbRolle` ein offenes `string`, koennte
// template-canvas eine Rolle abfragen, die keine Marke fuehrt; der Wert waere
// `undefined`, und die Zeichenroutine malte mit "undefined" als Farbe - im Canvas
// ein stiller Fehlgriff, der erst im fertigen Video sichtbar wird.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type {
  FarbRolle,
  Herkunft,
  MarkenHerkunftJeFeld,
  Marke,
  Schrift,
  SchriftRolle,
} from "../../src/shared/contracts/marke";
import type { Behaupte, Gleich } from "../typ-gleich";

const QUELLE = readFileSync(
  new URL("../../src/shared/contracts/marke.ts", import.meta.url),
  "utf8",
);

// --- DoD 2: geschlossene Unionen ---------------------------------------------
type T1 = Behaupte<Gleich<Gleich<FarbRolle, string>, false>>;
type T2 = Behaupte<Gleich<SchriftRolle, "headlineElegant" | "headlinePlakativ" | "fliesstext" | "fliesstextFett">>;
type T3 = Behaupte<Gleich<Gleich<SchriftRolle, string>, false>>;

// --- DoD 3: nur Lesen - kein partielles Gegenstueck in dieser Datei ----------
// Ein `Partial<Marke>` waere die Tuer zu halb gefuellten Marken. Dass es hier keinen
// solchen Typ gibt, sichert die Vollstaendigkeit an der Quelle.
type T4 = Behaupte<Gleich<Marke["farben"], Record<FarbRolle, string>>>;
type T5 = Behaupte<Gleich<Marke["schriften"], Record<SchriftRolle, Schrift>>>;

const schrift: Schrift = {
  familie: "Archivo Black",
  gewicht: 400,
  datei: "ArchivoBlack.ttf",
  herkunft: "gebuendelt",
};

// Vollstaendiges Marken-Literal (#320) - die Referenz fuer die Schluesselzahl-Tests.
const vollstaendig: Marke = {
  id: "m1",
  name: "Testmarke",
  parent: null,
  eingebaut: false,
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
    headlineElegant: { ...schrift, familie: "Playfair Display" },
    headlinePlakativ: schrift,
    fliesstext: { ...schrift, familie: "Arimo", gewicht: 400 },
    fliesstextFett: { ...schrift, familie: "Arimo", gewicht: 700 },
  },
  logo: null, // TK 9.10.10: null -> Ersatz-Logo
  sicherheit: { horizontal: 120, vertikal: 30 },
  radien: { pille: 8, karte: 8, klein: 8 },
  schatten: { versatzY: 6, weichzeichnen: 12, farbe: "#0000001A" },
  slogan: { text: "", aktiv: false },
  herkunftJeFeld: {
    farben: {
      akzent: "eigen",
      akzentKraeftig: "eigen",
      akzentTief: "eigen",
      flaecheDunkel: "eigen",
      flaecheSehrDunkel: "eigen",
      flaecheHell: "eigen",
      flaecheAkzentZart: "eigen",
      textAufDunkel: "eigen",
      textAufHell: "eigen",
      textSekundaer: "eigen",
      linie: "eigen",
      scrimStart: "eigen",
      scrimEnde: "eigen",
    },
    schriften: {
      headlineElegant: "eigen",
      headlinePlakativ: "eigen",
      fliesstext: "eigen",
      fliesstextFett: "eigen",
    },
    logo: "keins", // genau dann, wenn logo === null (TK 9.11.2)
    sicherheit: "eigen",
    radien: "eigen",
    schatten: "eigen",
    slogan: "eigen",
  },
};
void vollstaendig;

// --- #320: `herkunftJeFeld` ist Pflicht --------------------------------------
const { herkunftJeFeld: _entfernt, ...ohneStempelRest } = vollstaendig;
void _entfernt;
// @ts-expect-error Der Stempel fehlt - kein Aufrufer behandelt einen Sonderfall (TK 9.11.2).
const ohneStempel: Marke = ohneStempelRest;
void ohneStempel;

// --- #320: `Schrift.herkunft` ist Pflicht ------------------------------------
// @ts-expect-error `herkunft` fehlt an der Schrift.
const schriftOhneHerkunft: Schrift = { familie: "Arimo", gewicht: 400, datei: "Arimo-Regular.woff2" };
void schriftOhneHerkunft;

// --- #320: `Herkunft` ist eine geschlossene Union mit genau zwei Werten ------
const gebuendelt: Herkunft = "gebuendelt";
const importiert: Herkunft = "importiert";
void gebuendelt;
void importiert;
// @ts-expect-error Tippfehler - die Union ist geschlossen.
const falsch1: Herkunft = "gebundelt";
// @ts-expect-error Englisches Wort - gehoert nicht zur Union.
const falsch2: Herkunft = "bundled";
void falsch1;
void falsch2;

// --- #320: nur `logo` kennt 'keins' ------------------------------------------
// @ts-expect-error 'keins' gibt es nur an `logo`, nirgends sonst im Stempel.
const stempelFalsch: MarkenHerkunftJeFeld = { ...vollstaendig.herkunftJeFeld, sicherheit: "keins" };
void stempelFalsch;

// --- #320: eine fehlende Farb-Rolle im Stempel faellt auf --------------------
// @ts-expect-error Der Stempel verlangt ALLE dreizehn Rollen.
const stempelLuecke: MarkenHerkunftJeFeld["farben"] = { akzent: "eigen" };
void stempelLuecke;

// Gegenbeweise - nie aufgerufen.
function nurTypebene(marke: Marke): void {
  // @ts-expect-error 'akzentZart' ist keine Farb-Rolle - die Union ist geschlossen.
  const unbekannteRolle: string = marke.farben.akzentZart;

  // @ts-expect-error Der Record verlangt JEDE Rolle - eine unvollstaendige Palette faellt durch.
  const luecke: Marke["farben"] = { akzent: "#FF4040" };

  void unbekannteRolle;
  void luecke;
}
void nurTypebene;

export type { T1, T2, T3, T4, T5 };

describe("Marke (#52)", () => {
  it("beschreibt Schriften als gebuendelte Dateien", () => {
    // TK 9.10.4: Playfair Display fehlt auf Windows und macOS. Ohne mitgelieferte
    // Datei zeichnete jede Maschine eine andere Ersatzschrift - der Canvas waere
    // nicht mehr deterministisch, und Vorschau und Render zeigten Verschiedenes.
    expect(schrift.datei).toMatch(/\.(ttf|otf|woff2?)$/);
    expect(schrift.datei.includes("/")).toBe(false);
    // NEU mit #320 (v3.4): Jede Datei-Referenz traegt ihre Herkunft.
    expect(schrift.herkunft).toBe("gebuendelt");
  });

  it("fuehrt den Sicherheitsabstand als absolute Pixel", () => {
    // Nicht in Prozent: Der Rahmen ist immer 1920x1080, und eine Prozentangabe
    // muesste an jeder Zeichenstelle erneut umgerechnet werden.
    const sicherheit: Marke["sicherheit"] = { horizontal: 96, vertikal: 54 };
    expect(sicherheit.horizontal).toBe(96);
    expect(sicherheit.vertikal).toBe(54);
  });
});

describe("Marke als identifizierbarer Datensatz (#320, TK 9.11.2)", () => {
  it("hat genau zwoelf Felder in der verbindlichen Reihenfolge", () => {
    expect(Object.keys(vollstaendig)).toEqual([
      "id",
      "name",
      "parent",
      "eingebaut",
      "farben",
      "schriften",
      "logo",
      "sicherheit",
      "radien",
      "schatten",
      "slogan",
      "herkunftJeFeld",
    ]);
  });

  it("akzeptiert logo: null (Ersatz-Logo, TK 9.10.10)", () => {
    expect(vollstaendig.logo).toBeNull();
  });

  it("traegt number-Felder bei sicherheit und radien - die Zahlen sind WERTE, keine Typen", () => {
    // Vorbelegung der eingebauten Marke (96/54, 40/10/2) und ein beliebiger anderer
    // Wert muessen beide kompilieren - "Marke.sicherheit ist seit v3.4 bearbeitbar".
    expect(vollstaendig.sicherheit).toEqual({ horizontal: 120, vertikal: 30 });
    expect(vollstaendig.radien).toEqual({ pille: 8, karte: 8, klein: 8 });
  });

  it("zaehlt dreizehn Farb- und vier Schrift-Rollen, unverändert", () => {
    expect(Object.keys(vollstaendig.farben)).toHaveLength(13);
    expect(Object.keys(vollstaendig.schriften)).toHaveLength(4);
  });

  it("kennt im Stempel genau sieben Schluessel, 'keins' nur an logo", () => {
    expect(Object.keys(vollstaendig.herkunftJeFeld)).toEqual([
      "farben",
      "schriften",
      "logo",
      "sicherheit",
      "radien",
      "schatten",
      "slogan",
    ]);
    expect(vollstaendig.herkunftJeFeld.logo).toBe("keins");
  });

  it("enthaelt keinen Laufzeit-Code", () => {
    const zeilen = QUELLE.split("\n").filter((z) => !z.trim().startsWith("//"));
    expect(zeilen.join("\n")).not.toMatch(/\bconst\s|\bfunction\s|\bclass\s/);
  });

  it("fuehrt die Nutzungs-Typen von #275 und MarkenEintrag von #277 NICHT selbst", () => {
    for (const verboten of [
      "Markennutzung",
      "MarkenReferenz",
      "AbgeleiteteMarkenReferenz",
      "StandardmarkenReferenz",
      "MarkenEintrag",
      "Partial",
    ]) {
      expect(QUELLE).not.toContain(verboten);
    }
  });
});
