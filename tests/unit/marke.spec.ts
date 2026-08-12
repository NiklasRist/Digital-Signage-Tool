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
import { describe, expect, it } from "vitest";

import type { FarbRolle, Marke, Schrift, SchriftRolle } from "../../src/shared/contracts/marke";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 2: geschlossene Unionen ---------------------------------------------
type T1 = Behaupte<Gleich<Gleich<FarbRolle, string>, false>>;
type T2 = Behaupte<Gleich<SchriftRolle, "headlineElegant" | "headlinePlakativ" | "fliesstext" | "fliesstextFett">>;
type T3 = Behaupte<Gleich<Gleich<SchriftRolle, string>, false>>;

// --- DoD 3: nur Lesen - kein partielles Gegenstueck in dieser Datei ----------
// Ein `Partial<Marke>` waere die Tuer zu halb gefuellten Marken. Dass es hier keinen
// solchen Typ gibt, sichert die Vollstaendigkeit an der Quelle.
type T4 = Behaupte<Gleich<Marke["farben"], Record<FarbRolle, string>>>;
type T5 = Behaupte<Gleich<Marke["schriften"], Record<SchriftRolle, Schrift>>>;

const schrift: Schrift = { familie: "Archivo Black", gewicht: 400, datei: "ArchivoBlack.ttf" };

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
  });

  it("fuehrt den Sicherheitsabstand als absolute Pixel", () => {
    // Nicht in Prozent: Der Rahmen ist immer 1920x1080, und eine Prozentangabe
    // muesste an jeder Zeichenstelle erneut umgerechnet werden.
    const sicherheit: Marke["sicherheit"] = { horizontal: 96, vertikal: 54 };
    expect(sicherheit.horizontal).toBe(96);
    expect(sicherheit.vertikal).toBe(54);
  });
});
