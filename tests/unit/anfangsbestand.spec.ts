import { describe, expect, it } from "vitest";

import type { FarbRolle } from "../../src/shared/contracts/marke";
import { eingebauteMarke } from "../../src/main/marken-store/anfangsbestand";

// Unit-Test zu #280: die eingebaute Fitnessworld24-Marke ist vollständig befüllt,
// eine TIEFE Kopie je Aufruf und trägt die Werte genau wie in TK 9.11.2.
const ALLE_FARBROLLEN: FarbRolle[] = [
  "akzent",
  "akzentKraeftig",
  "akzentTief",
  "flaecheDunkel",
  "flaecheSehrDunkel",
  "flaecheHell",
  "flaecheAkzentZart",
  "textAufDunkel",
  "textAufHell",
  "textSekundaer",
  "linie",
  "scrimStart",
  "scrimEnde",
];

describe("eingebauteMarke (#280)", () => {
  it("liefert eingebaut true, parent null und den Namen", () => {
    const marke = eingebauteMarke();

    expect(marke.eingebaut).toBe(true);
    expect(marke.parent).toBeNull();
    expect(marke.name).toBe("Fitnessworld24");
  });

  it("liefert bei zwei Aufrufen unterschiedliche IDs und zwei unabhängige Objekte", () => {
    const a = eingebauteMarke();
    const b = eingebauteMarke();

    expect(a.id).not.toBe(b.id);
    a.farben["akzent"] = "#000000";
    expect(b.farben["akzent"]).toBe("#FF4040");
  });

  it("traegt ALLE 13 Farb-Rollen mit Wert", () => {
    const marke = eingebauteMarke();

    expect(Object.keys(marke.farben).sort()).toEqual([...ALLE_FARBROLLEN].sort());
    for (const rolle of ALLE_FARBROLLEN) {
      expect(marke.farben[rolle]).toMatch(/^#[0-9A-Fa-f]{6,8}$/);
    }
  });

  it("traegt die Farb-Werte exakt wie in TK 9.11.2, Wert fuer Wert", () => {
    const marke = eingebauteMarke();

    expect(marke.farben).toEqual({
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
    });
  });

  it("traegt ALLE 4 Schrift-Rollen vollstaendig (familie/gewicht/datei/herkunft)", () => {
    const marke = eingebauteMarke();

    expect(marke.schriften).toEqual({
      headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "PlayfairDisplay-Bold.woff2", herkunft: "gebuendelt" },
      headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "ArchivoBlack-Regular.woff2", herkunft: "gebuendelt" },
      fliesstext: { familie: "Arimo", gewicht: 400, datei: "Arimo-Regular.woff2", herkunft: "gebuendelt" },
      fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "Arimo-Bold.woff2", herkunft: "gebuendelt" },
    });
  });

  it("traegt die vier gebuendelten Schriftdateien, die das Bundle tatsaechlich haelt", async () => {
    const marke = eingebauteMarke();
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    expect(marke.schriften.headlineElegant).toBeDefined();
    // Der datei-Verweis liegt im Renderer-Bundle (angelegt #7/#8); der Test haelt
    // fest, dass ein Umbenennen nicht lautlos ins Leere zeigt.
    const verzeichnis = path.resolve(__dirname, "../../src/renderer/assets/fonts");
    for (const schrift of Object.values(marke.schriften)) {
      if (!schrift) continue;
      expect(schrift.herkunft).toBe("gebuendelt");
      await expect(fs.access(path.join(verzeichnis, schrift.datei))).resolves.toBeUndefined();
    }
  });

  it("traegt Logo, Sicherheitsabstand, Radien, Schatten und den Slogan-Platzhalter", () => {
    const marke = eingebauteMarke();

    // Die STOPP-Frage zum Logo ist durch gebauten Code beantwortet (#315-Nachtrag,
    // registry + lese-marke #29); der Slogan bleibt der abgeschaltete Platzhalter.
    expect(marke.logo).toEqual({ datei: "logo-fitnessworld24.png", herkunft: "gebuendelt", seitenverhaeltnis: 3.5 });
    expect(marke.sicherheit).toEqual({ horizontal: 96, vertikal: 54 });
    expect(marke.radien).toEqual({ pille: 40, karte: 10, klein: 2 });
    expect(marke.schatten).toEqual({ versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" });
    expect(marke.slogan).toEqual({ text: "", aktiv: false });
  });
});
