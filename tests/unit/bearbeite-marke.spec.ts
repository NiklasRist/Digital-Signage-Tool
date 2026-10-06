import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #285. Echter marken-store mit frischem Modul je Pruefung (wie in
// schreibe-marken.spec.ts); die nahtpunkt-Proben folgen dem DoD Wort fuer Wort.

const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

let bearbeiteMarke: typeof import("../../src/main/marken-store/bearbeite-marke").bearbeiteMarke;
let erstelleMarke: typeof import("../../src/main/marken-store/erstelle-marke").erstelleMarke;

const aendereSpur: Array<{ schreibart: unknown }> = [];

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  type A = typeof echtes.aendereBestand;
  return {
    ...echtes,
    aendereBestand: ((aenderung: unknown, schreibart: unknown) => {
      aendereSpur.push({ schreibart });
      return echtes.aendereBestand(aenderung as Parameters<A>[0], schreibart as Parameters<A>[1]);
    }) as A,
  };
});

beforeEach(async () => {
  vi.resetModules();
  aendereSpur.length = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-b-"));
  const modul = await import("../../src/main/marken-store/bearbeite-marke");
  bearbeiteMarke = modul.bearbeiteMarke;
  const em = await import("../../src/main/marken-store/erstelle-marke");
  erstelleMarke = em.erstelleMarke;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

import { ladeBestand, flushBestand } from "../../src/main/marken-store/schreibe-marken";

async function idDerEingebauten(): Promise<string> {
  const geladen = await ladeBestand();
  if (!geladen.ok) throw geladen.fehler;
  return geladen.wert[0]!.id;
}

type MarkenEintrag = {
  id: string; name: string; parent: string | null; eingebaut: boolean;
  farben: Record<string, unknown>; schriften: Record<string, unknown>;
  logo?: unknown | null; sicherheit?: Record<string, number>; radien?: unknown; schatten?: unknown; slogan?: unknown;
};

async function liesBestand(): Promise<{ marken: MarkenEintrag[] }> {
  const roh = await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8");
  return JSON.parse(roh) as { schemaVersion: number; marken: MarkenEintrag[] };
}

type Marke = {
  id: string; name: string; parent: string | null; eingebaut: boolean;
  farben: Record<string, string>; schriften: Record<string, unknown>;
  logo?: unknown | null; sicherheit?: Record<string, number>; radien?: unknown; schatten?: unknown; slogan?: unknown;
  herkunftJeFeld: Record<string, unknown>;
};

const GEERBT = { geerbt: true } as const;
type MarkenTeilwerteLoose = Parameters<typeof bearbeiteMarke>[1];
type UnknownMarke = { farben: Record<string, string>; [k: string]: unknown };

describe("bearbeiteMarke (#285)", () => {
  it("ein eigenstaendiges Feld farben.akzent wird uebernommen und erscheint in der Aufgeloesten Rueckgabe", async () => {
    const erg = await bearbeiteMarke(await idDerEingebauten(), { farben: { akzent: "#112233" } });
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.farben["akzent"]).toBe("#112233");
    // Spy 'entprellt':
    expect(aendereSpur).toHaveLength(1);
    expect(aendereSpur[0]?.schreibart).toBe("entprellt");
  });

  it("auf einer ABGELEITETEN Marke setzt der Fachwert GENAU die Rolle eigen; Rest bleibt geerbt", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;

    const erg = await bearbeiteMarke(ableitung.wert.id, { farben: { akzent: "#112233" } });
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.farben["akzent"]).toBe("#112233");
    await flushBestand();   // entprellt: der Blick auf die Platte CELT erst nach dem Flush
    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === ableitung.wert.id)!;
    // 'akzent' eigen, alle uebrigen Rollen kommen NICHT als eigenen Eintrag vor:
    expect(Object.keys(eintrag.farben)).toEqual(["akzent"]);
    expect(eintrag.farben["akzent"]).toBe("#112233");
  });

  it("'Zurück auf geerbt' ENTFERNT den Schluessel aus dem Bestandseintrag ('akzent' in eintrag.farben === false)", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;
    const setz = await bearbeiteMarke(ableitung.wert.id, { farben: { akzent: "#112233" } });
    expect(setz.ok).toBe(true);

    const erg = await bearbeiteMarke(ableitung.wert.id, { farben: { akzent: GEERBT } } as unknown as MarkenTeilwerteLoose);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === ableitung.wert.id)!;
    expect("akzent" in eintrag.farben).toBe(false);
    // die aufgeloese Rueckgabe traegt WIEBC den WEBC Parent-Wert:
    expect(erg.wert.farben["akzent"]).toBe((basis.wert as unknown as Marke).farben["akzent"]);
  });

  it("der Sentinel auf einer EIGENSTAENDIGEN Marke wirft ungueltige_eingabe", async () => {
    // Der reale Schreibzustand dieses Testlaufs // deshalb basiert der Beweis allein auf der ABLEHnung (Code), ohne Datei-Blick.
    const erg = await bearbeiteMarke(await idDerEingebauten(), { farben: { akzent: GEERBT } } as unknown as MarkenTeilwerteLoose);

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("ungueltige_eingabe");
  });

  it("logo null (eigenes KEIN-Logo) vs. GEERBT-Sentinel (zurueck zum Parent) sind UNTERSCHIEDBAR", async () => {
    const basis = await erstelleMarke("Basis-Mit-Logo", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison-Mit-Logo", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;

    // Fall A: eigenes 'kein Logo' - der Schluessel bleibt GESETZT mit null.
    const ein = await bearbeiteMarke(ableitung.wert.id, { logo: null });
    expect(ein.ok).toBe(true);
    if (!ein.ok) return;
    await flushBestand();
    const bestandA = await liesBestand();
    const eintragA = bestandA.marken.find((m) => m.id === ableitung.wert.id)!;
    expect("logo" in eintragA).toBe(true);
    expect(eintragA.logo).toBeNull();
    expect(ein.wert.herkunftJeFeld["logo"]).toBe("keins");

    // Fall B: zurueck zum Parent - der Schluessel ENTFAALLT; die RuhaltsLogo kommt vom Parent.
    const zur = await bearbeiteMarke(ableitung.wert.id, { logo: GEERBT } as unknown as MarkenTeilwerteLoose);
    expect(zur.ok).toBe(true);
    if (!zur.ok) return;
    await flushBestand();
    const bestandB = await liesBestand();
    const eintragB = bestandB.marken.find((m) => m.id === ableitung.wert.id)!;
    expect("logo" in eintragB).toBe(false);
  });

  it("ein UNBEKANNTER Schlüssel in farben wirft ungueltige_eingabe", async () => {
    const erg = await bearbeiteMarke(await idDerEingebauten(), { farben: { nichtVorhandeneRolle: "#fff" } } as unknown as MarkenTeilwerteLoose);
    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("ungueltige_eingabe");
  });

  it("name wird IMMER eigen uebernommen, auch auf einer abgeleiteten Marke (kein geerbt-Wert dort)", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;

    const erg = await bearbeiteMarke(ableitung.wert.id, { name: "  Mein Look  " });
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.name).toBe("Mein Look");
  });

  it("SICHERHEIT: Untergrenze 0 ist gueltig, 481 und 271 sind ungueltige_eingabe, der Bestand bleibt unverändert", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;

    const nullerg = await bearbeiteMarke(ableitung.wert.id, { sicherheit: { horizontal: 0, vertikal: 0 } });
    expect(nullerg.ok).toBe(true);
    if (nullerg.ok) expect(nullerg.wert.sicherheit).toEqual({ horizontal: 0, vertikal: 0 });

    const davor = await liesBestand();
    const zuHoch = await bearbeiteMarke(ableitung.wert.id, { sicherheit: { horizontal: 481, vertikal: 54 } });
    expect(zuHoch.ok).toBe(false);
    if (!zuHoch.ok) expect(zuHoch.fehler.code).toBe("ungueltige_eingabe");
    const zuHochV = await bearbeiteMarke(ableitung.wert.id, { sicherheit: { horizontal: 96, vertikal: 271 } });
    expect(zuHochV.ok).toBe(false);

    // der Bestand ist UNVERAENDERT (Test am Eintrag, nicht am Rueckgabewert)
    const danach = await liesBestand();
    const eintrag = danach.marken.find((m) => m.id === ableitung.wert.id)!;
    expect(eintrag.sicherheit).toEqual((davor.marken.find((m) => m.id === ableitung.wert.id) as { sicherheit?: unknown }).sicherheit);
  });

  it("SICHERHEIT: 96.5 wird NICHT gerundet - ungueltige_eingabe", async () => {
    const erg = await bearbeiteMarke(await idDerEingebauten(), { sicherheit: { horizontal: 96.5, vertikal: 54 } });
    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("ungueltige_eingabe");
  });

  it("SICHERHEIT-SENTINEL auf einer abgeleiteten Marke entfernt den Schluessel und trifft NICHT die Bereichsprüfung", async () => {
    const basis = await erstelleMarke("Basis", null);
    expect(basis.ok).toBe(true);
    if (!basis.ok) return;
    const ableitung = await erstelleMarke("Saison", basis.wert.id);
    expect(ableitung.ok).toBe(true);
    if (!ableitung.ok) return;
    const eigen = await bearbeiteMarke(ableitung.wert.id, { sicherheit: { horizontal: 30, vertikal: 20 } });
    expect(eigen.ok).toBe(true);

    const erg = await bearbeiteMarke(ableitung.wert.id, { sicherheit: GEERBT } as unknown as MarkenTeilwerteLoose);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    await flushBestand();
    const bestand = await liesBestand();
    const eintrag = bestand.marken.find((m) => m.id === ableitung.wert.id)!;
    expect("sicherheit" in eintrag).toBe(false);
  });

  it("eine unbekannte markeId ergibt marke_nicht_gefunden (fachlicher Code)", async () => {
    const erg = await bearbeiteMarke("unbekannt", { name: "Nichts" });
    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("marke_nicht_gefunden");
  });

  it("markeId '' liefert ungueltige_eingabe ohne Lesen/Schreiben", async () => {
    const erg = await bearbeiteMarke("", { name: "Nichts" });
    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("ungueltige_eingabe");
    expect(aendereSpur).toHaveLength(0);
  });
});
