import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FarbRolle } from "../../src/shared/contracts/marke";

// Unit-Test zu #282. Umlagerung wie im lese-marke-Test: EIN echter Disk-Lauf (bestand
// allein die eingebaute Marke), alle weiteren über den Umschalter - mit den beiden
// durchsichtigen Assistenz-Spiegeln (Protokollierung ohne Ersetzung).

const zustand = { ordner: "", ladeBestandUmschalten: null as null | (() => unknown) };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const ladeBestandSpur: unknown[] = [];
const loeseMarkeAufSpur: Array<{ eintrag: unknown; bestand: unknown }> = [];

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  return {
    ...echtes,
    ladeBestand: async () => {
      if (zustand.ladeBestandUmschalten !== null) {
        ladeBestandSpur.push(zustand);
        return zustand.ladeBestandUmschalten() as Awaited<ReturnType<typeof echtes.ladeBestand>>;
      }
      ladeBestandSpur.push(zustand);
      return echtes.ladeBestand();
    },
  };
});

vi.mock("../../src/main/marken-store/vererbung", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/vererbung")>();
  return {
    ...echtes,
    loeseMarkeAuf: (eintrag: never, bestand: never) => {
      loeseMarkeAufSpur.push({ eintrag, bestand });
      return echtes.loeseMarkeAuf(eintrag, bestand);
    },
  };
});

let listeMarken: typeof import("../../src/main/marken-store/liste").listeMarken;

beforeEach(async () => {
  vi.resetModules();
  Object.assign(zustand, { ladeBestandUmschalten: null });
  ladeBestandSpur.length = 0;
  loeseMarkeAufSpur.length = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-list-"));
  const modul = await import("../../src/main/marken-store/liste");
  listeMarken = modul.listeMarken;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

const ALLE_FARBROLLEN: FarbRolle[] = [
  "akzent", "akzentKraeftig", "akzentTief", "flaecheDunkel", "flaecheSehrDunkel",
  "flaecheHell", "flaecheAkzentZart", "textAufDunkel", "textAufHell", "textSekundaer",
  "linie", "scrimStart", "scrimEnde",
];

function voll(id: string, ueber: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    name: "Basis " + id,
    parent: null,
    eingebaut: false,
    farben: {
      akzent: "#FF4040", akzentKraeftig: "#DF3131", akzentTief: "#971316",
      flaecheDunkel: "#2F2E2E", flaecheSehrDunkel: "#4B090B", flaecheHell: "#FFFFFF",
      flaecheAkzentZart: "#F5AEAF", textAufDunkel: "#FFFFFF", textAufHell: "#202020",
      textSekundaer: "#8F8F8F", linie: "#CCCCCC", scrimStart: "#00000000", scrimEnde: "#000000B3",
    },
    schriften: {
      headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "a.woff2", herkunft: "gebuendelt" },
      headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "b.woff2", herkunft: "gebuendelt" },
      fliesstext: { familie: "Arimo", gewicht: 400, datei: "c.woff2", herkunft: "gebuendelt" },
      fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "d.woff2", herkunft: "gebuendelt" },
    },
    logo: { datei: "logo-basis.png", herkunft: "gebuendelt", seitenverhaeltnis: 3.5 },
    sicherheit: { horizontal: 96, vertikal: 54 },
    radien: { pille: 40, karte: 10, klein: 2 },
    schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" },
    slogan: { text: "Basis-Slogan", aktiv: true },
    ...ueber,
  };
}

function stelleBestand(bestand: unknown): void {
  zustand.ladeBestandUmschalten = () => ({ ok: true, wert: bestand });
}

describe("listeMarken (#282)", () => {
  it("liefert bei frisch angelegter marken.json (nur eingebaute Marke) GENAU EIN Element", async () => {
    // echter Disk-Lauf; die Eingangs-Anlage entsteht durch ladeBestand selbst (#280).
    const erg = await listeMarken();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert).toHaveLength(1);
    expect(erg.wert[0]?.name).toBe("Fitnessworld24");
  });

  it("ein Bestand aus einer eigenstaendigen und zwei abgeleiteten kommt ALLE drei, in Bestandsreihenfolge", async () => {
    const basis = voll("basis-1");
    const saison = { id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false, farben: { akzent: "#00FF00" }, schriften: {} };
    const kampagne = { id: "kamp-1", name: "Kampagne", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([basis, saison, kampagne]);
    loeseMarkeAufSpur.length = 0;

    const erg = await listeMarken();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.map((m) => m.id)).toEqual(["basis-1", "saison-1", "kamp-1"]);
    // Spy: GENAU EIN Aufruf je Eintrag.
    expect(loeseMarkeAufSpur).toHaveLength(3);
  });

  it("die abgeleitete Marke traegt ALLE FarbRollen - die fehlenden aus dem Parent", async () => {
    const basis = voll("basis-1");
    const saison = { id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false, farben: { akzent: "#00FF00" }, schriften: {} };
    stelleBestand([basis, saison]);

    const erg = await listeMarken();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    const aufgeloest = erg.wert[1]!;
    for (const rolle of ALLE_FARBROLLEN) {
      expect(typeof aufgeloest.farben[rolle]).toBe("string");
    }
    expect(aufgeloest.farben["akzent"]).toBe("#00FF00");
  });

  it("ein ladeBestand-Neinmelder (speicher_fehler) kommt durch - und loeseMarkeAuf wird NICHT gerufen", async () => {
    zustand.ladeBestandUmschalten = () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "marken.json unlesbar." } });
    loeseMarkeAufSpur.length = 0;

    const erg = await listeMarken();

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
    expect(loeseMarkeAufSpur).toHaveLength(0);
  });

  it("eine verwaiste Ableitung GIT die marke_nicht_gefunden als Gesamtergebnis - keine Teilliste", async () => {
    const basis = voll("basis-1");
    const ok = { id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false, farben: {}, schriften: {} };
    const verwaist = { id: "kaputt-1", name: "Kaputt", parent: "verschwunden", eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([basis, ok, verwaist]);

    const erg = await listeMarken();

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("JEDES Ergebnis-Element traegt ein vollstaendiges herkunftJeFeld - byte-identisch mit loeseMarkeAuf", async () => {
    const basis = voll("basis-1");
    const saison = { id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false, farben: { akzent: "#00FF00" }, schriften: {} };
    stelleBestand([basis, saison]);

    const erg = await listeMarken();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    const echte = await import("../../src/main/marken-store/vererbung");
    for (let i = 0; i < 2; i++) {
      const ruf = loeseMarkeAufSpur[i]!;
      const direkt = echte.loeseMarkeAuf(ruf.eintrag as never, ruf.bestand as never);
      expect(direkt.ok).toBe(true);
      if (!direkt.ok) return;
      expect(erg.wert[i]!.herkunftJeFeld).toEqual(direkt.wert.herkunftJeFeld);
      for (const rolle of ALLE_FARBROLLEN) {
        expect(["eigen", "geerbt"]).toContain(erg.wert[i]!.herkunftJeFeld.farben[rolle]);
      }
      for (const feld of ["sicherheit", "radien", "schatten", "slogan"] as const) {
        expect(erg.wert[i]!.herkunftJeFeld[feld] === undefined).toBe(false);
      }
    }
  });
});
