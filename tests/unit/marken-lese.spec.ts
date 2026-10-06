import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FarbRolle, SchriftRolle } from "../../src/shared/contracts/marke";

// Unit-Test zu #283. Zwei Pruef-Weben:
// (1) DISK: der Datenort ist gemockt (wie in schreibe-marken.spec.ts), ladeBestand und
//     loeseMarkeAuf laufen ECHT mit einer echten marken.json.
// (2) SPAEHER: um die ECHTEN Funktionen liegt jeweils eine durchsichtige Assistenz,
//     die festhaelt, WANN und WAS gerufen wurde (DoD-Punkte ueber Aufruforder/Argumente).

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

let leseMarke: typeof import("../../src/main/marken-store/lese-marke").leseMarke;

beforeEach(async () => {
  vi.resetModules();
  Object.assign(zustand, { ladeBestandUmschalten: null });
  ladeBestandSpur.length = 0;
  loeseMarkeAufSpur.length = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-l-"));
  const modul = await import("../../src/main/marken-store/lese-marke");
  leseMarke = modul.leseMarke;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

const ALLE_FARBROLLEN: FarbRolle[] = [
  "akzent", "akzentKraeftig", "akzentTief", "flaecheDunkel", "flaecheSehrDunkel",
  "flaecheHell", "flaecheAkzentZart", "textAufDunkel", "textAufHell", "textSekundaer",
  "linie", "scrimStart", "scrimEnde",
];
const ALLE_SCHRIFTROLLEN: SchriftRolle[] = [
  "headlineElegant", "headlinePlakativ", "fliesstext", "fliesstextFett",
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


// Nach dem ERSTEN Test liefert ladeBestand staetisch (UEBER den Umschalter); die
// echte marken.json-Disk-Logik ist in schreibe-marken.spec.ts allein zu Hause. Der
// Grund: das echte Modul haelt den Bestand im Speicher - der Zustand wuerde oben
// ueber die Tests hinweg bleiben und jeden nachfolgenden Disk-Test faelschlich
// aus der Speicher-Unterbringung beantworten.
function stelleBestand(bestand: unknown): void {
  zustand.ladeBestandUmschalten = () => ({ ok: true, wert: bestand });
}

describe("leseMarke (#283)", () => {
  it("liefert die eingebaute Marke in VOLLSTANDIG befueller Form (dreizehn Farb-Rollen, vier Schrift-Rollen)", async () => {
    // Der eingebaute Bestand enttaeft an der#277-Initialanlage; wir lesen EINEN Bestand
    // und verlangen die eingebaut Marke in vollstaendiger Form zurueck.
    await fs.mkdir(zustand.ordner, { recursive: true });
    // ZUERST leseMarke anrufen: bei fehlender marken.json legt ladeBestand die eingebaut
    // Marke an (#280) und leseMarke liefert sie aufgeloest zurueck. Wir brauchen ihre ID:
    // sie kommt aus dem in Test 2 unten belegten Pfad (Komplettbestand). Hier nutzen wir
    // einen bestand mit EINER Marke (ID bekannt).
    const eingebaut = {
      id: "eingebaut-1", name: "Fitnessworld24", parent: null, eingebaut: true,
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
      logo: { datei: "logo-fitnessworld24.png", herkunft: "gebuendelt", seitenverhaeltnis: 3.5 },
      sicherheit: { horizontal: 96, vertikal: 54 },
      radien: { pille: 40, karte: 10, klein: 2 },
      schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" },
      slogan: { text: "", aktiv: false },
    };
    await fs.writeFile(
      path.join(zustand.ordner, "marken.json"),
      JSON.stringify({ schemaVersion: 1, marken: [eingebaut] }),
      "utf8",
    );

    const erg = await leseMarke("eingebaut-1");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    for (const rolle of ALLE_FARBROLLEN) {
      expect(typeof erg.wert.farben[rolle]).toBe("string");
    }
    for (const rolle of ALLE_SCHRIFTROLLEN) {
      expect(erg.wert.schriften[rolle]).toBeDefined();
    }
    expect(erg.wert.sicherheit).toEqual({ horizontal: 96, vertikal: 54 });
    expect(erg.wert.logo).toBeDefined();
  });

  it("eine abgeleitete Marke, die nur farben.akzent setzt, traegt sonst alles vom Parent (Saison-Look)", async () => {
    const parent = {
      id: "basis-1", name: "Basis", parent: null, eingebaut: false,
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
    };
    const kind = {
      id: "saison-1", name: "Saison", parent: "basis-1", eingebaut: false,
      farben: { akzent: "#00FF00" }, schriften: {},
    };
    stelleBestand([parent, kind]);

    const erg = await leseMarke("saison-1");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.farben["akzent"]).toBe("#00FF00");
    for (const rolle of ALLE_FARBROLLEN) {
      if (rolle === "akzent") continue;
      expect(erg.wert.farben[rolle]).toBe((parent.farben as Record<string, string>)[rolle]);
    }
    expect(erg.wert.radien).toEqual((parent as { radien: unknown }).radien);
    expect(erg.wert.slogan).toEqual((parent as { slogan: unknown }).slogan);
  });

  it("leseMarke('') und leseMarke(123) liefern ungueltige_eingabe OHNE ladeBestand zu rufen", async () => {
    zustand.ladeBestandUmschalten = () => { throw "muss nicht gerufen werden"; };

    const leer = await leseMarke("");
    expect(leer.ok).toBe(false);
    if (!leer.ok) expect(leer.fehler.code).toBe("ungueltige_eingabe");

    const zahl = await leseMarke(123 as unknown as string);
    expect(zahl.ok).toBe(false);
    if (!zahl.ok) expect(zahl.fehler.code).toBe("ungueltige_eingabe");

    // Der Umschalter wuerde beim Aufruf werfen - er ist nie angesproch hier (2 Aufrufe
    // ohne Ausnahme zeigen: null echte ladeBestand-Weg). Direkt beigeblaufen:
    expect(zustand.ladeBestandUmschalten).toBeTypeOf("function");
  });

  it("denno eine unbekannte markeId liefert marke_nicht_gefunden", async () => {
    const einzeln = { id: "a-1", name: "A", parent: null, eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([einzeln]);

    const erg = await leseMarke("unbekannt");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("ein ladeBestand-Neinmelder (speicher_fehler) kommt UNVERAENDERT durch", async () => {
    zustand.ladeBestandUmschalten = () => ({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "marken.json ist unlesbar und .bak bot keine heile Fassung." },
    });

    const erg = await leseMarke("egal");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("eine verwaiste Ableitung liefert marke_nicht_gefunden (Parent fehlt im Bestand)", async () => {
    const kind = { id: "kind-1", name: "Kind", parent: "verschwunden", eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([kind]);

    const erg = await leseMarke("kind-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("loeseMarkeAuf wird mit dem gefundenen Eintrag UND dem vollemn Bestand gerufen", async () => {
    const a = voll("a-1");
    const kind = { id: "kind-1", name: "Kind", parent: "a-1", eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([a, kind]);

    const erg = await leseMarke("kind-1");

    expect(erg.ok).toBe(true);
    expect(loeseMarkeAufSpur).toHaveLength(1);
    const ruf = loeseMarkeAufSpur[0]!;
    expect((ruf.eintrag as { id: string }).id).toBe("kind-1");
    expect((ruf.bestand as { length: number }).length).toBe(2);
    const bestand = ruf.bestand as Array<{ id: string }>;
    expect(bestand.map((e) => e.id).sort()).toEqual(["a-1", "kind-1"]);
  });

  it("die Rueckgabe ist BYTE-identisch mit dem, was loeseMarkeAuf geliefert hat (Stempel reist mit)", async () => {
    const parent = voll("a-1");
    const eintrag = { id: "eigen-1", name: "Eigenstaendig", parent: null, eingebaut: false, farben: {}, schriften: {} };
    const geerbtKind = { id: "kind-1", name: "Kind", parent: "a-1", eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([eintrag]);

    const erg = await leseMarke("eigen-1");
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;

    // Der hier gemeldete Aufruf-Argument wurde in derselben Rundentreue geliefert:
    // die Marke kam direkt aus der echten loeseMarkeAuf-Form (kein Nachbessern, kein
    // Weglassen des Stempels).
    const echte = await import("../../src/main/marken-store/vererbung");
    const direkt = echte.loeseMarkeAuf(loeseMarkeAufSpur[0]!.eintrag as never, (loeseMarkeAufSpur[0]!.bestand as never));
    expect(direkt.ok).toBe(true);
    if (direkt.ok) expect(direkt.wert.herkunftJeFeld).toEqual(erg.wert.herkunftJeFeld);

    stelleBestand([parent, geerbtKind]);
    const ergAbgeleitet = await leseMarke("kind-1");
    void geerbtKind;
    expect(ergAbgeleitet.ok).toBe(true);
    if (!ergAbgeleitet.ok) return;
    expect(Object.keys(ergAbgeleitet.wert.herkunftJeFeld.farben).length).toBe(13);
    expect(Object.keys(ergAbgeleitet.wert.herkunftJeFeld.schriften).length).toBe(4);
    expect(ergAbgeleitet.wert.herkunftJeFeld.logo).toBeDefined();
  });

  it("ein Grossbuchstaben-Aufruf trifft die klein geschriebene ID NICHT (exakter Vergleich)", async () => {
    const eintrag = { id: "a-1", name: "A", parent: null, eingebaut: false, farben: {}, schriften: {} };
    stelleBestand([eintrag]);

    const erg = await leseMarke("A-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });
});
