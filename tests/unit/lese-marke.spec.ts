import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { leseMarke } from "../../src/main/config-store/lese-marke";

// Verhaltenstest zu #29 (leseMarke). Geprueft wird nur, was der Typ NICHT schon
// erzwingt: das Format der Werte, die Existenz der verwiesenen Dateien und die
// Unveraenderlichkeit.

const marke = async () => {
  const e = await leseMarke();
  if (!e.ok) throw new Error(`leseMarke hat gemeldet: ${e.fehler.meldung}`);
  return e.wert;
};

describe("leseMarke (#29)", () => {
  it("liefert jede Farb-Rolle als 6- oder 8-stelliges Hex", async () => {
    const m = await marke();
    // Ein Tippfehler wie '#FF404' uebersetzt anstandslos und faerbt spaeter gar nichts -
    // das Canvas nimmt einen unlesbaren Wert kommentarlos hin.
    for (const [rolle, wert] of Object.entries(m.farben)) {
      expect(wert, rolle).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
    }
    expect(m.farben.akzent).toBe("#FF4040");
  });

  it("verweist mit jeder Schrift auf eine Datei, die im Renderer-Bundle liegt", async () => {
    const m = await marke();
    for (const schrift of Object.values(m.schriften)) {
      const datei = new URL(`../../src/renderer/assets/fonts/${schrift.datei}`, import.meta.url);
      expect(existsSync(datei), schrift.datei).toBe(true);
    }
  });

  it("laesst sich nicht verstellen", async () => {
    const m = await marke();
    // Ohne die Sperre bliebe eine Zuweisung hier fuer ALLE spaeteren Leser stehen,
    // ohne dass irgendwo ein Schreibpfad zu sehen waere.
    expect(() => {
      (m.farben as Record<string, string>)["akzent"] = "#00FF00";
    }).toThrow();
    expect((await marke()).farben.akzent).toBe("#FF4040");
  });
});
