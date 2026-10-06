import { describe, expect, it } from "vitest";

import type { FarbRolle, Marke, SchriftRolle } from "../../src/shared/contracts/marke";
import type { MarkenEintrag } from "../../src/main/marken-store/schreibe-marken";
import { loeseMarkeAuf } from "../../src/main/marken-store/vererbung";

// Unit-Test zu #279. Reine Berechnung - keine Dateien, kein Bestand im Hintergrund.
// Die einleitenden Invarianten folgen Wort fuer Wort dem Issue, jede Pruefung nennt
// ihren DoD-Punkt.

const ALLE_FARBROLLEN: FarbRolle[] = [
  "akzent", "akzentKraeftig", "akzentTief", "flaecheDunkel", "flaecheSehrDunkel",
  "flaecheHell", "flaecheAkzentZart", "textAufDunkel", "textAufHell", "textSekundaer",
  "linie", "scrimStart", "scrimEnde",
];
const ALLE_SCHRIFTROLLEN: SchriftRolle[] = [
  "headlineElegant", "headlinePlakativ", "fliesstext", "fliesstextFett",
];

function vollstaendigerEintrag(id: string, ueber: Partial<MarkenEintrag> = {}): MarkenEintrag {
  const farben: Record<FarbRolle, string> = {
    akzent: "#FF4040", akzentKraeftig: "#DF3131", akzentTief: "#971316",
    flaecheDunkel: "#2F2E2E", flaecheSehrDunkel: "#4B090B", flaecheHell: "#FFFFFF",
    flaecheAkzentZart: "#F5AEAF", textAufDunkel: "#FFFFFF", textAufHell: "#202020",
    textSekundaer: "#8F8F8F", linie: "#CCCCCC", scrimStart: "#00000000", scrimEnde: "#000000B3",
  };
  const schriften = {
    headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "PlayfairDisplay-Bold.woff2", herkunft: "gebuendelt" as const },
    headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "ArchivoBlack-Regular.woff2", herkunft: "gebuendelt" as const },
    fliesstext: { familie: "Arimo", gewicht: 400, datei: "Arimo-Regular.woff2", herkunft: "gebuendelt" as const },
    fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "Arimo-Bold.woff2", herkunft: "gebuendelt" as const },
  };
  return {
    id,
    name: "Basis " + id,
    parent: null,
    eingebaut: false,
    farben,
    schriften,
    logo: { datei: "logo-basis.png", herkunft: "gebuendelt", seitenverhaeltnis: 3.5 },
    sicherheit: { horizontal: 96, vertikal: 54 },
    radien: { pille: 40, karte: 10, klein: 2 },
    schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" },
    slogan: { text: "Basis-Slogan", aktiv: true },
    ...ueber,
  };
}

describe("loeseMarkeAuf (#279)", () => {
  it("liefert einen eigenstaendigen, vollstaendigen Eintrag unveraendert als Marke", () => {
    const eintrag = vollstaendigerEintrag("basis-1");
    const erg = loeseMarkeAuf(eintrag, [eintrag]);

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.id).toBe("basis-1");
    expect(erg.wert.farben["akzent"]).toBe("#FF4040");
    expect(erg.wert.sicherheit).toEqual({ horizontal: 96, vertikal: 54 });
  });

  it("eine Saison-Marke, die nur farben.akzent setzt, erbt alles andere vom Parent", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = {
      id: "saison-1",
      name: "Saison",
      parent: "basis-1",
      eingebaut: false,
      farben: { akzent: "#00FF00" },
      schriften: {},
    };
    const erg = loeseMarkeAuf(kind, [parent, kind]);

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    // der eigene Wert steht, alle anderen kommen vom Parent (TK 9.11.2 Saison-Look).
    expect(erg.wert.farben["akzent"]).toBe("#00FF00");
    for (const rolle of ALLE_FARBROLLEN) {
      if (rolle === "akzent") continue;
      expect(erg.wert.farben[rolle]).toBe(parent.farben[rolle]);
    }
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      expect((erg.wert.schriften[rolle] as { datei: string }).datei).toBe(parent.schriften[rolle]!.datei);
    }
    expect(erg.wert.logo).toEqual(parent.logo);
    expect(erg.wert.sicherheit).toEqual(parent.sicherheit);
    expect(erg.wert.radien).toEqual(parent.radien);
    expect(erg.wert.schatten).toEqual(parent.schatten);
    expect(erg.wert.slogan).toEqual(parent.slogan);
  });

  it("sicherheit eigen gesetzt gilt ALS GANZES - kein Feld vom Parent durchsickert", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = {
      id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false,
      farben: {}, schriften: {},
      sicherheit: { horizontal: 50, vertikal: 50 },
    };
    const erg = loeseMarkeAuf(kind, [parent, kind]);

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.sicherheit).toEqual({ horizontal: 50, vertikal: 50 });
  });

  it("eine abgeleitete Marke ohne jedes eigene Feld stimmt in jedem Feld mit dem Parent", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = { id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(kind, [parent, kind]);

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.farben).toEqual(parent.farben);
    expect(erg.wert.schriften).toEqual(parent.schriften);
    expect(erg.wert.logo).toEqual(parent.logo);
    expect(erg.wert.sicherheit).toEqual(parent.sicherheit);
    expect(erg.wert.radien).toEqual(parent.radien);
    expect(erg.wert.schatten).toEqual(parent.schatten);
    expect(erg.wert.slogan).toEqual(parent.slogan);
  });

  it("eine unbekannte Parent-ID liefert marke_nicht_gefunden, KEIN Rueckfall", () => {
    const kind: MarkenEintrag = { id: "kind-1", name: "Kind", parent: "verschwunden", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(kind, []);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("ein Parent, der selbst parent !== null hat, liefert unbekannter_fehler (User-Entscheid 06.10.)", () => {
    const grossel = vollstaendigerEintrag("gross");
    const parent: MarkenEintrag = { id: "mitte", name: "Mitte", parent: "gross", eingebaut: false, farben: {}, schriften: {} };
    const kind: MarkenEintrag = { id: "kind-1", name: "Kind", parent: "mitte", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(kind, [grossel, parent, kind]);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("unbekannter_fehler");
  });

  it("ein Loch beim Parent liefert unbekannter_fehler (User-Entscheid 06.10.)", () => {
    // Der Parent traegt fuer eine Rolle selbst KEINEN Wert (Invariante verletzt).
    const parent = vollstaendigerEintrag("basis-1", { schriften: {} as Record<SchriftRolle, never> });
    const kind: MarkenEintrag = { id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(kind, [parent, kind]);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("unbekannter_fehler");
  });

  it("herkunftJeFeld ist IMMER vollstaendig gefuellt (alle Rollenliste)", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = { id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(kind, [parent, kind]);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(Object.keys(erg.wert.herkunftJeFeld.farben).sort()).toEqual([...ALLE_FARBROLLEN].sort());
    expect(Object.keys(erg.wert.herkunftJeFeld.schriften).sort()).toEqual([...ALLE_SCHRIFTROLLEN].sort());
    for (const rolle of ALLE_FARBROLLEN) {
      expect(["eigen", "geerbt"]).toContain(erg.wert.herkunftJeFeld.farben[rolle]);
    }
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      expect(["eigen", "geerbt"]).toContain(erg.wert.herkunftJeFeld.schriften[rolle]);
    }
    expect(["eigen", "geerbt", "keins"]).toContain(erg.wert.herkunftJeFeld.logo);
    for (const feld of ["sicherheit", "radien", "schatten", "slogan"] as const) {
      expect(["eigen", "geerbt"]).toContain(erg.wert.herkunftJeFeld[feld]);
    }
  });

  it("ein eigenstaendiger Eintrag traegt durchgehend 'eigen' - logo 'keins' nur wenn null", () => {
    const eintrag = vollstaendigerEintrag("basis-1");
    const erg = loeseMarkeAuf(eintrag, [eintrag]);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    for (const rolle of ALLE_FARBROLLEN) {
      expect(erg.wert.herkunftJeFeld.farben[rolle]).toBe("eigen");
    }
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      expect(erg.wert.herkunftJeFeld.schriften[rolle]).toBe("eigen");
    }
    expect(erg.wert.herkunftJeFeld.logo).toBe("eigen");
    expect(erg.wert.herkunftJeFeld.sicherheit).toBe("eigen");
    expect(erg.wert.herkunftJeFeld.slogan).toBe("eigen");

    const ohneLogo = vollstaendigerEintrag("basis-2", { logo: null });
    const erg2 = loeseMarkeAuf(ohneLogo, [ohneLogo]);
    expect(erg2.ok).toBe(true);
    if (!erg2.ok) return;
    expect(erg2.wert.herkunftJeFeld.logo).toBe("keins");
  });

  it("die nur-akzent-Marke traegt 'eigen' dort und 'geerbt' ueberall sonst", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = {
      id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false,
      farben: { akzent: "#00FF00" }, schriften: {},
    };
    const erg = loeseMarkeAuf(kind, [parent, kind]);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.herkunftJeFeld.farben["akzent"]).toBe("eigen");
    for (const rolle of ALLE_FARBROLLEN) {
      if (rolle === "akzent") continue;
      expect(erg.wert.herkunftJeFeld.farben[rolle]).toBe("geerbt");
    }
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      expect(erg.wert.herkunftJeFeld.schriften[rolle]).toBe("geerbt");
    }
    expect(erg.wert.herkunftJeFeld.logo).toBe("geerbt");
    expect(erg.wert.herkunftJeFeld.sicherheit).toBe("geerbt");
  });

  it("setzt das Kind einen Wert GLEICH dem Parent, steht 'eigen' - kein Wertvergleich", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = {
      id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false, farben: {},
      schriften: {},
      sicherheit: { horizontal: 96, vertikal: 54 },  // bewusst GLEICH dem Parent
    };
    const erg = loeseMarkeAuf(kind, [parent, kind]);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.herkunftJeFeld.sicherheit).toBe("eigen");
  });

  it("id, name, parent, eingebaut stammen IMMER vom eintrag", () => {
    const parent: MarkenEintrag = { ...vollstaendigerEintrag("basis-1"), name: "MUTTER-NAME", eingebaut: true };
    const eintrag: MarkenEintrag = { id: "kind-1", name: "KIND-NAME", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    const erg = loeseMarkeAuf(eintrag, [parent, eintrag]);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.name).toBe("KIND-NAME");
    expect(erg.wert.eingebaut).toBe(false);
    expect(erg.wert.parent).toBe("basis-1");
  });

  it("die Funktion ist REIN: zwei Aufrufe liefern deep-gleiche Ergebnisse; Eingaben unveraendert", () => {
    const parent = vollstaendigerEintrag("basis-1");
    const kind: MarkenEintrag = {
      id: "kind-1", name: "Kind", parent: "basis-1", eingebaut: false, farben: {}, schriften: {},
    };
    const parentFrozen = structuredClone(parent);
    const kindFrozen = structuredClone(kind);

    const a = loeseMarkeAuf(kind, [parent, kind]);
    const b = loeseMarkeAuf(kind, [parent, kind]);
    expect(a).toEqual(b);
    expect(parent).toEqual(parentFrozen);
    expect(kind).toEqual(kindFrozen);
  });
});
