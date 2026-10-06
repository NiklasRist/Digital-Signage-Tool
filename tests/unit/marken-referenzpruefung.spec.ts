import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #286. Der marken-Bestand kommt ueber den Umschalter (wie in den
// Markennutzungs-Testen), die PROJEKTE auf echter Platte: in einem Temp-Datenort
// liegen projects/<id>/project.json, gelesen wird ECHT.

const zustand = {
  ordner: "",
  bestandUmschalten: null as null | (() => unknown),
  projekteUmschalten: null as null | (() => unknown),
};

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const bestandSpur: unknown[] = [];
const projekteSpur: unknown[] = [];
const ordnerSpur: string[] = [];

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  return {
    ...echtes,
    ladeBestand: async () => {
      if (zustand.bestandUmschalten !== null) {
        bestandSpur.push(zustand);
        return zustand.bestandUmschalten() as Awaited<ReturnType<typeof echtes.ladeBestand>>;
      }
      bestandSpur.push(zustand);
      return echtes.ladeBestand();
    },
  };
});

vi.mock("../../src/main/project-store/liste-projekte", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/project-store/liste-projekte")>();
  return {
    ...echtes,
    listeProjekte: async () => {
      if (zustand.projekteUmschalten !== null) {
        projekteSpur.push(zustand);
        return zustand.projekteUmschalten() as Awaited<ReturnType<typeof echtes.listeProjekte>>;
      }
      projekteSpur.push(zustand);
      return echtes.listeProjekte();
    },
  };
});

vi.mock("../../src/main/project-store/pfade", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/project-store/pfade")>();
  return {
    ...echtes,
    projektOrdner: (projektId: string) => {
      ordnerSpur.push(projektId);
      return echtes.projektOrdner(projektId);
    },
  };
});

let pruefeMarkenReferenzen: typeof import("../../src/main/marken-store/referenzpruefung").pruefeMarkenReferenzen;

let projektZaehler = 0;

beforeEach(async () => {
  vi.resetModules();
  zustand.bestandUmschalten = null;
  zustand.projekteUmschalten = null;
  bestandSpur.length = 0;
  projekteSpur.length = 0;
  ordnerSpur.length = 0;
  projektZaehler = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-ref-"));
  const modul = await import("../../src/main/marken-store/referenzpruefung");
  pruefeMarkenReferenzen = modul.pruefeMarkenReferenzen;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

type ProjektMeta = {
  id: string; name: string; erstelltAm: string; geaendertAm: string; ordner: string;
  beschaedigt: boolean; anzahlMedien: number; anzahlAusgaben: number;
};

/** Legt ein Projekt mit gelesener project.json im Temp-Datenort an und liefert die Meta. */
async function legeProjektAn(felder: { name: string; standardMarkeId?: unknown; aktionen?: unknown; roh?: string }): Promise<ProjektMeta> {
  projektZaehler += 1;
  const id = `proj-${String(projektZaehler)}`;
  const ordner = path.join(zustand.ordner, "projects", id);
  await fs.mkdir(ordner, { recursive: true });
  const inhalt =
    felder.roh ??
    JSON.stringify({
      id,
      name: felder.name + "-DATEI",
      aktionen: felder.aktionen ?? [],
      schemaVersion: 1,
      ...(felder.standardMarkeId === undefined ? {} : { standardMarkeId: felder.standardMarkeId }),
    });
  await fs.writeFile(path.join(ordner, "project.json"), inhalt, "utf8");
  return {
    id,
    name: felder.name,
    erstelltAm: "jetzt",
    geaendertAm: "jetzt",
    ordner,
    beschaedigt: false,
    anzahlMedien: 0,
    anzahlAusgaben: 0,
  };
}

function stelleBestand(bestand: unknown): void {
  zustand.bestandUmschalten = () => ({ ok: true, wert: bestand });
}

describe("pruefeMarkenReferenzen (#286)", () => {
  it("nur parent-Referenz: die Marke steht in abgeleiteteMarken, die anderen Listen sind leer", async () => {
    stelleBestand([
      { id: "m-basis", name: "Basis", parent: null, eingebaut: false, farben: {}, schriften: {} },
      { id: "m-saison", name: "Saison-Marke", parent: "m-basis", eingebaut: false, farben: {}, schriften: {} },
    ]);
    zustand.projekteUmschalten = () => ({ ok: true, wert: [] });

    const erg = await pruefeMarkenReferenzen("m-basis");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.abgeleiteteMarken).toEqual([{ markeId: "m-saison", markeName: "Saison-Marke" }]);
    expect(erg.wert.aktionen).toEqual([]);
    expect(erg.wert.standardInProjekten).toEqual([]);
  });

  it("nur aktion.markeId: Treffer in aktionen, mit projektName aus ProjektMeta - NICHT aus der Datei", async () => {
    stelleBestand([]);
    const meta = await legeProjektAn({ name: "Studio Nord", aktionen: [{ id: "a-1", markeId: "m-1" }] });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [meta] });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.aktionen).toEqual([{ projektId: meta.id, projektName: "Studio Nord", aktionId: "a-1" }]);
    expect(erg.wert.standardInProjekten).toEqual([]);
  });

  it("KERN: nur standardMarkeId - Treffer mit projektId UND projektName, die Obigen leer", async () => {
    stelleBestand([]);
    const meta = await legeProjektAn({ name: "Studio Sued", standardMarkeId: "m-std", aktionen: [] });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [meta] });

    const erg = await pruefeMarkenReferenzen("m-std");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.standardInProjekten).toEqual([{ projektId: meta.id, projektName: "Studio Sued" }]);
    expect(erg.wert.aktionen).toEqual([]);
    expect(erg.wert.abgeleiteteMarken).toEqual([]);
  });

  it("mehrere Projekte mit derselben Standardmarke stehen ALLE in der Liste, je mit ihrem Namen", async () => {
    stelleBestand([]);
    const m1 = await legeProjektAn({ name: "Erstes", standardMarkeId: "m-std" });
    const m2 = await legeProjektAn({ name: "Zweites", standardMarkeId: "anders" });
    const m3 = await legeProjektAn({ name: "Drittes", standardMarkeId: "m-std" });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [m1, m2, m3] });

    const erg = await pruefeMarkenReferenzen("m-std");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.standardInProjekten).toHaveLength(2);
    expect(erg.wert.standardInProjekten.map((r) => r.projektName).sort()).toEqual(["Drittes", "Erstes"]);
  });

  it("ein Projekt kann in BEIDEN Listen stehen - kein Entdoppeln (Standard + aktion)", async () => {
    stelleBestand([]);
    const meta = await legeProjektAn({
      name: "Beides",
      standardMarkeId: "m-1",
      aktionen: [{ id: "a-2", markeId: "m-1" }],
    });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [meta] });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.aktionen).toEqual([{ projektId: meta.id, projektName: "Beides", aktionId: "a-2" }]);
    expect(erg.wert.standardInProjekten).toEqual([{ projektId: meta.id, projektName: "Beides" }]);
  });

  it("JEDES gemeldete Projekt wird EINMAL gelesen (ordnerSpur-zaehlung), auch dasselbe Paths", async () => {
    stelleBestand([]);
    const m1 = await legeProjektAn({ name: "Eins", standardMarkeId: "m-x", aktionen: [{ id: "a", markeId: "m-y" }] });
    const m2 = await legeProjektAn({ name: "Zwei" });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [m1, m2] });
    ordnerSpur.length = 0;

    await pruefeMarkenReferenzen("m-x");

    // Spy: GENAU EIN projektOrdner-Aufruf je gemeldetem Projekt (two readings aus einem
    // Leseorganisation: Referenzart 1 UND 3 aus demselben gelesenen Stand).
    expect(ordnerSpur).toEqual([m1.id, m2.id]);
  });

  it("ein beschaedigt:-Protlekt wird NICHT uebersprungen: Scheitern der Lesung -> speicher_fehler", async () => {
    stelleBestand([]);
    const ok = await legeProjektAn({ name: "Heil", standardMarkeId: "m-1" });
    zustand.projekteUmschalten = () => ({
      ok: true,
      wert: [ok, { ...ok, id: "kaputt", name: "Kaputt", beschaedigt: true }],
    });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("fehlt das project.json eines gemeldeten Projekts, kommt speicher_fehler - NICHT Erfolg mit Treffern des Rests", async () => {
    stelleBestand([]);
    const ok = await legeProjektAn({ name: "Heil", standardMarkeId: "m-1" });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [ok, { ...ok, id: "fehlt", name: "Fehlt" }] });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("standardMarkeId fehlt ganz, ist null oder leer: KEIN Fehler, kein Treffer, Pruefung laeuft", async () => {
    stelleBestand([]);
    const a = await legeProjektAn({ name: "Ohne Feld" });
    const b = await legeProjektAn({ name: "Null", roh: JSON.stringify({ id: "x", name: "Null-DATEI", aktionen: [], standardMarkeId: null }) });
    const c = await legeProjektAn({ name: "Leer", roh: JSON.stringify({ id: "y", name: "Leer-DATEI", aktionen: [], standardMarkeId: "" }) });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [a, b, c] });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.standardInProjekten).toEqual([]);
    expect(erg.wert.aktionen).toEqual([]);
  });

  it("einen nirgends benutzte Marke liefert ok mit ALLEN DREI Listen, leer", async () => {
    stelleBestand([{ id: "m-andere", name: "A", parent: null, eingebaut: false, farben: {}, schriften: {} }]);
    zustand.projekteUmschalten = () => ({ ok: true, wert: [] });

    const erg = await pruefeMarkenReferenzen("m-frei");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert).toEqual({ aktionen: [], abgeleiteteMarken: [], standardInProjekten: [] });
  });

  it("ladeBestand-Fehler bricht VOR listeProjekte ab (Spy: null ProjektAufrufe)", async () => {
    zustand.bestandUmschalten = () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "marken.json unlesbar." } });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
    expect(projekteSpur).toHaveLength(0);
    expect(ordnerSpur).toHaveLength(0);
  });

  it("minimal listeProjekte-Neinmelder kommt UNVERAENDERT durch", async () => {
    stelleBestand([]);
    zustand.projekteUmschalten = () => ({ ok: false, fehler: { code: "kein_projekt", meldung: "kein Datenort." } });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("kein_projekt");
  });

  it("markeId '' und Nicht-String: ungueltige_eingabe, OHNE dass ladeBestand oder listeProjekte gerufen wurden", async () => {
    zustand.bestandUmschalten = () => { throw "muss nie anliegen"; };
    zustand.projekteUmschalten = () => { throw "muss nie anliegen"; };

    const leer = await pruefeMarkenReferenzen("");
    expect(leer.ok).toBe(false);
    if (!leer.ok) expect(leer.fehler.code).toBe("ungueltige_eingabe");

    const zahl = await pruefeMarkenReferenzen(123 as unknown as string);
    expect(zahl.ok).toBe(false);
    if (!zahl.ok) expect(zahl.fehler.code).toBe("ungueltige_eingabe");

    expect(bestandSpur).toHaveLength(0);
    expect(projekteSpur).toHaveLength(0);
  });

  it("aktionen vorhanden, aber kein Array: speicher_fehler (kein Ueberspringen)", async () => {
    stelleBestand([]);
    const meta = await legeProjektAn({ name: "Krumm", roh: JSON.stringify({ id: "k", name: "K-D", aktionen: "kaputt" }) });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [meta] });

    const erg = await pruefeMarkenReferenzen("m-1");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("standardMarkeId vorhanden, aber kein String: speicher_fehler", async () => {
    stelleBestand([]);
    const meta = await legeProjektAn({ name: "Zahl", roh: JSON.stringify({ id: "z", name: "Z-D", aktionen: [], standardMarkeId: 42 }) });
    zustand.projekteUmschalten = () => ({ ok: true, wert: [meta] });

    const erg = await pruefeMarkenReferenzen("42");

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
  });
});
