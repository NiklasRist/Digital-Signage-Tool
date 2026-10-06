import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #284. Der echte Disk-Lauf (echte marken.json, frisch importiertes Modul
// je Pruefung - wie in schreibe-marken.spec.ts); der speicher_fehler-Pfad ueber den
// Umschalter-Schalter um das echte aendereBestand.

const zustand = { ordner: "", aendereUmschalten: null as null | (() => unknown) };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const loeseMarkeAufSpur: Array<{ eintrag: { id?: string }; bestand: { length: number } }> = [];

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

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  type A = typeof echtes.aendereBestand;
  return {
    ...echtes,
    aendereBestand: ((aenderung: unknown, schreibart: unknown) => {
      if (zustand.aendereUmschalten !== null) {
        return zustand.aendereUmschalten() as ReturnType<A>;
      }
      return echtes.aendereBestand(aenderung as Parameters<A>[0], schreibart as Parameters<A>[1]);
    }) as A,
  };
});

let erstelleMarke: typeof import("../../src/main/marken-store/erstelle-marke").erstelleMarke;

beforeEach(async () => {
  vi.resetModules();
  zustand.aendereUmschalten = null;
  loeseMarkeAufSpur.length = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-e-"));
  const modul = await import("../../src/main/marken-store/erstelle-marke");
  erstelleMarke = modul.erstelleMarke;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

type MarkenEintrag = {
  id: string; name: string; parent: string | null; eingebaut: boolean;
  farben: Record<string, unknown>; schriften: Record<string, unknown>;
  logo?: unknown | null; sicherheit?: unknown; radien?: unknown; schatten?: unknown; slogan?: unknown;
};

async function liesBestand(): Promise<{ marken: MarkenEintrag[] }> {
  const roh = await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8");
  return JSON.parse(roh) as { schemaVersion: number; marken: MarkenEintrag[] };
}

describe("erstelleMarke (#284)", () => {
  it("eine eigenstaendige Marke hat UUID, parent null, eingebaut false und die SECHS Werte-Felder als tiefe Kopie", async () => {
    const erg = await erstelleMarke("Partner GmbH", null);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;

    expect(/^[0-9a-f-]{36}$/.test(erg.wert.id)).toBe(true);
    expect(erg.wert.parent).toBeNull();
    expect(erg.wert.eingebaut).toBe(false);
    // Vorherige Pruefung (13 Farb-Rollen und die fuenf festen Werte):
    expect(Object.keys(erg.wert.farben)).toHaveLength(13);
    expect(erg.wert.radien).toEqual({ pille: 40, karte: 10, klein: 2 });
    expect(erg.wert.slogan).toEqual({ text: "", aktiv: false });
  });

  it("die neue eigenstaendige Marke traegt logo === null - GESETZT, nicht weggelassen", async () => {
    const erg = await erstelleMarke("Partner GmbH", null);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;

    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === erg.wert.id)!;
    // Nachweis ueber 'logo' in eintrag UND eintrag.logo === null - nicht == null.
    expect("logo" in eintrag).toBe(true);
    expect(eintrag.logo).toBeNull();
  });

  it("die Rueckgabe meldet herkunftJeFeld.logo === 'keins' (Naht-Probe zu #279)", async () => {
    const erg = await erstelleMarke("Partner GmbH", null);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.herkunftJeFeld.logo).toBe("keins");
    for (const [rolle] of Object.entries(erg.wert.herkunftJeFeld.farben)) {
      expect(erg.wert.herkunftJeFeld.farben[rolle as keyof typeof erg.wert.herkunftJeFeld.farben]).not.toBeUndefined();
    }
  });

  it("die tiefe Kopie haelt: Aenderung am Ergebnis erreicht die eingebaute Marke nicht", async () => {
    const erg = await erstelleMarke("Partner GmbH", null);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    erg.wert.farben["akzent"] = "#01FE02";

    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === erg.wert.id)!;
    expect(eintrag.farben["akzent"]).not.toBe("#01FE02");
  });

  it("eine abgeleitete Marke traegt NUR id/name/parent/eingebaut im Bestand - Rest bleibt geerbt", async () => {
    const basis = await erstelleMarke("Fitnessworld24-Vorlage", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const erg = await erstelleMarke("Sommeraktion", basis.wert.id);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;

    expect(erg.wert.parent).toBe((basis.wert as { id: string }).id);
    expect(erg.wert.eingebaut).toBe(false);
    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === erg.wert.id)!;
    expect(eintrag.farben).toEqual({});
    expect(eintrag.schriften).toEqual({});
    expect("sicherheit" in eintrag).toBe(false);
    expect("slogan" in eintrag).toBe(false);
    // trotzdem vollstaendig aufgeloest zurueck:
    expect(Object.keys(erg.wert.farben)).toHaveLength(13);
  });

  it("die KETTENSPERRE lehnt eine Ableitung von einer bereits abgeleiteten Marke ab", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const abgeleitet = await erstelleMarke("Erste Ebene", basis.wert.id);
    expect(abgeleitet.ok).toBe(true);
    if (!abgeleitet.ok) return;

    const erg = await erstelleMarke("X", abgeleitet.wert.id as string);
    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("ungueltige_eingabe");
    const bestand = await liesBestand();
    expect(bestand.marken.some((m) => m.name === "X")).toBe(false);
  });

  it("eine unbekannte parentId liefert marke_nicht_gefunden", async () => {
    const erg = await erstelleMarke("X", "unbekannt-1");
    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("der NAME-TRIMMTrimm: Leerraum-Namen abweisen, Rand-Leerraum getrimmt speichern", async () => {
    const leer = await erstelleMarke("   ", null);
    expect(leer.ok).toBe(false);
    if (!leer.ok) expect(leer.fehler.code).toBe("ungueltige_eingabe");

    const mitRand = await erstelleMarke("  Randmarke  ", null);
    expect(mitRand.ok).toBe(true);
    if (!mitRand.ok) return;
    const bestand = await liesBestand();
    expect(bestand.marken.find((m) => m.id === mitRand.wert.id)!.name).toBe("Randmarke");
  });

  it("zwei Aufrufe mit demselben Namen liefern zwei ID-Werte, beide bleiben im Bestand", async () => {
    const a = await erstelleMarke("Zwilling", null);
    const b = await erstelleMarke("Zwilling", null);
    expect(a.ok && b.ok).toBe(true);
    if (!(a.ok && b.ok)) return;
    expect(a.wert.id).not.toBe(b.wert.id);
    const bestand = await liesBestand();
    expect(bestand.marken.filter((m) => m.name === "Zwilling")).toHaveLength(2);
  });

  it("die neue Marke steht am ENDE des Bestands; die vorherige Reihenfolge bleibt", async () => {
    const erste = await erstelleMarke("Erste-Ordnung", null);
    expect(erste.ok).toBe(true);
    const zweite = await erstelleMarke("Zweite-Ordnung", null);
    expect(zweite.ok).toBe(true);
    const bestand = await liesBestand();
    // Das gesamt Modul ueberlebt hier je Prozess, nicht je Pruefung (der echte
    // marken-store haelt den Bestand im Speicher) - deshalb Subsequenz statt
    // Ganzer-Array-Vergleich: Fitnessworld24 vorne, die zwei neuen dahinter je
    // in der Reihenfolge, unter den ETWAS frueheren jetzt bestehenden Eintraege.
    const namen = bestand.marken.filter((m) =>
      ["Fitnessworld24", "Erste-Ordnung", "Zweite-Ordnung"].includes(m.name)).map((m) => m.name);
    expect(namen).toEqual(["Fitnessworld24", "Erste-Ordnung", "Zweite-Ordnung"]);
    expect(bestand.marken.at(-1)?.name).toBe("Zweite-Ordnung");
  });

  it("ein aendereBestand-Neinmelder (speicher_fehler) kommt durch - die Marke entsteht NICHT", async () => {
    zustand.aendereUmschalten = () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "Platte voll." } });
    loeseMarkeAufSpur.length = 0;

    const erg = await erstelleMarke("Nicht da", null);

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
    expect(loeseMarkeAufSpur).toHaveLength(0);
  });
});
