import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #289. Echter Disk-Flow; das Logo-Pixelmaterial ist ein REAL 1×1-PNG
// (base64), damit ffprobe auf die KOPIERTE Datei laufen kann. Der woff2-Test nutzt
// ein Wegwerf-Bytefile - Inhalte werden NICHT geprueft, nur kopiert.

const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

let importiereMarkenDatei: typeof import("../../src/main/marken-store/dateien").importiereMarkenDatei;
let entferneMarkenDatei: typeof import("../../src/main/marken-store/dateien").entferneMarkenDatei;
let markenOrdner: typeof import("../../src/main/marken-store/pfade").markenOrdner;
let loeseMarkenDateiPfad: typeof import("../../src/main/marken-store/pfade").loeseMarkenDateiPfad;
let ladeBestand: typeof import("../../src/main/marken-store/schreibe-marken").ladeBestand;
let flushBestand: typeof import("../../src/main/marken-store/schreibe-marken").flushBestand;

beforeEach(async () => {
  vi.resetModules();
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-d-"));
  const d = await import("../../src/main/marken-store/dateien");
  importiereMarkenDatei = d.importiereMarkenDatei;
  entferneMarkenDatei = d.entferneMarkenDatei;
  const p = await import("../../src/main/marken-store/pfade");
  markenOrdner = p.markenOrdner;
  loeseMarkenDateiPfad = p.loeseMarkenDateiPfad;
  const f = await import("../../src/main/marken-store/schreibe-marken");
  ladeBestand = f.ladeBestand;
  flushBestand = f.flushBestand;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const QUELLE_ORDNER = path.join(zustand.ordner, "quelle");
async function legeQuelleAn(name: string, inhalt: Buffer): Promise<string> {
  await fs.mkdir(QUELLE_ORDNER, { recursive: true });
  const pfad = path.join(QUELLE_ORDNER, name);
  await fs.writeFile(pfad, inhalt);
  return pfad;
}

describe("importiereMarkenDatei (#289)", () => {
  it("woff2-Import fuer headlineElegant setzt herkunft 'importiert'; die Kopie liegt im Marken-Ordner", async () => {
    const einzeln = await ladeBestand();
    expect(einzeln.ok).toBe(true);
    const markeId = (einzeln.ok ? einzeln.wert[0]!.id : "") as string;

    const quelle = await legeQuelleAn("Elegant-Datei.woff2", Buffer.from("WOFF2-DUMPF"));
    const erg = await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.schriften.headlineElegant?.herkunft).toBe("importiert");
    // LoeseMarkenDateiPfad liefert Pfad im marken-assets/<markeId> (Pfad-Autorität #288)
    const kopie = loeseMarkenDateiPfad(markeId, "headlineElegant.woff2");
    expect(kopie.ok).toBe(true);
    if (kopie.ok) {
      expect(kopie.wert.startsWith(markenOrdner(markeId))).toBe(true);
      await expect(fs.readFile(kopie.wert, "utf8")).resolves.toBe("WOFF2-DUMPF");
    }
  });

  it("die QUELLDATEI bleibt unberuehrt und byte-identisch (Import KOPIERT)", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;

    const quelle = await legeQuelleAn("Elegant-Datei.woff2", Buffer.from("WOFF2-DUMPF"));
    await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);

    await expect(fs.readFile(quelle, "utf8")).resolves.toBe("WOFF2-DUMPF");
  });

  it("eine .ttf fuer schrift => ungueltige_eingabe, KEIN Kopieren (keine Zieldatei)", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;

    const quelle = await legeQuelleAn("x.ttf", Buffer.from("TTF"));
    const erg = await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("ungueltige_eingabe");
    await expect(fs.access(path.join(markenOrdner(markeId), "headlineElegant.woff2"))).rejects.toThrow();
  });

  it("eine .mp4 für logo => ungueltige_eingabe, kein Kopieren", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;

    const quelle = await legeQuelleAn("x.mp4", Buffer.from("MP4"));
    const erg = await importiereMarkenDatei(markeId, "logo", null, quelle);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("ungueltige_eingabe");
    await expect(fs.access(path.join(markenOrdner(markeId), "logo.mp4"))).rejects.toThrow();
  });

  it("art 'logo' mit schriftRolle gesetzt => ungueltige_eingabe; art 'schrift' mit null ebenfalls", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;
    const quelle = await legeQuelleAn("labor.png", PNG_1x1);

    const logoMitRolle = await importiereMarkenDatei(markeId, "logo", "headlineElegant", quelle);
    expect(logoMitRolle.ok).toBe(false);
    if (!logoMitRolle.ok) expect(logoMitRolle.fehler.code).toBe("ungueltige_eingabe");

    const schriftOhneRolle = await importiereMarkenDatei(markeId, "schrift", null, quelle);
    expect(schriftOhneRolle.ok).toBe(false);
    if (!schriftOhneRolle.ok) expect(schriftOhneRolle.fehler.code).toBe("ungueltige_eingabe");
  });

  it("Import mit UNBEKANNTER markeId => marke_nicht_gefunden, kein Kopiervorgang", async () => {
    const quelle = await legeQuelleAn("labor.png", PNG_1x1);
    const erg = await importiereMarkenDatei("unbekannt", "logo", null, quelle);

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_nicht_gefunden");
    // Kein Marken-Ordner angelegt_, kein Kopiervorgang:
    await expect(fs.access(markenOrdner("unbekannt"))).rejects.toThrow();
  });

  it("alle WHITELIST-Bildformate (aus FORMAT_WHITELIST.bild, #13) gehen beim Logo-Import durch", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;

    for (const endung of ["jpg", "jpeg", "png", "webp"] as const) {
      const quelle = await legeQuelleAn(`labor.${endung}`, PNG_1x1);
      const erg = await importiereMarkenDatei(markeId, "logo", null, quelle);
      expect(erg.ok).toBe(true);
    }
  });

  it("ein ERSATZ-Import ERSETZT die Rolle: nur ein Logo bleibt", async () => {
    const einzeln = await ladeBestand();
    if (!einzeln.ok) return;
    const markeId = einzeln.wert[0]!.id;

    await importiereMarkenDatei(markeId, "logo", null, await legeQuelleAn("labor.png", PNG_1x1));
    await importiereMarkenDatei(markeId, "logo", null, await legeQuelleAn("labor.jpg", PNG_1x1));

    const beschreiben = await fs.readdir(markenOrdner(markeId));
    expect(beschreiben.filter((f) => f.startsWith("logo."))).toEqual(["logo.jpg"]);
  });
});

describe("entferneMarkenDatei (#289)", () => {
  it("auf einer ABGELEITETEN Marke: der Sentinel tritt als Payload auf (datei weg, geerbt wiederhergestellt)", async () => {
    const basis = await ladeBestand();
    if (!basis.ok) return;
    const basisId = basis.wert[0]!.id;

    const abgeleitet = await (await import("../../src/main/marken-store/erstelle-marke")).erstelleMarke("Saison", basisId);
    if (!abgeleitet.ok) return;
  
    const quelle = await legeQuelleAn("x.woff2", Buffer.from("WOFF2-DUMPF"));
    await importiereMarkenDatei(abgeleitet.wert.id, "schrift", "headlineElegant", quelle);
    await flushBestand();
  
    const erg = await entferneMarkenDatei(abgeleitet.wert.id, "schrift", "headlineElegant");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    // Spy: das uebergebene teilwerte tritt den Sentinel.Auf (geerbt: true) fuer die Rolle:
    // (der gelieferte Aufruf ist lesemarke auf der entarmten marke; der Sentinel geht
    // in den MarkenBestand, was ich direkt pruefe)
    await flushBestand();
    const danach = await ladeBestand();
    if (!danach.ok) return;
    const eintrag = danach.wert.find((e) => e.id === abgeleitet.wert.id)!;
    expect("headlineElegant" in (eintrag.schriften as Record<string, unknown>)).toBe(false);
    expect(erg.wert.schriften.headlineElegant?.herkunft).toBe(basis.wert[0]!.schriften.headlineElegant!.herkunft);
  });

  it("auf EIGENSTAENDIGER Marke: der gebuendedelte Wert aus eingebauteMarke() wird zurueckgesetzt", async () => {
    const basis = await ladeBestand();
    if (!basis.ok) return;
    const markeId = basis.wert[0]!.id;

    const quelle = await legeQuelleAn("x.woff2", Buffer.from("WOFF2-DUMPF"));
    await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);
    await flushBestand();

    const erg = await entferneMarkenDatei(markeId, "schrift", "headlineElegant");

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert.schriften.headlineElegant?.herkunft).toBe("gebuendelt");
    expect(erg.wert.schriften.headlineElegant?.datei).toBe("PlayfairDisplay-Bold.woff2");
  });

  it("die IMPORTIERTE physische Datei ist nach dem Entfernen WEG", async () => {
    const basis = await ladeBestand();
    if (!basis.ok) return;
    const markeId = basis.wert[0]!.id;

    const quelle = await legeQuelleAn("x.woff2", Buffer.from("WOFF2-DUMPF"));
    await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);
    await flushBestand();

    await entferneMarkenDatei(markeId, "schrift", "headlineElegant");

    await expect(fs.access(path.join(markenOrdner(markeId), "headlineElegant.woff2"))).rejects.toThrow();
  });

  it("Entfernen von NICHTS (keine importierte Datei): ok mit der unveränderten Marke", async () => {
    const basis = await ladeBestand();
    if (!basis.ok) return;
    const markeId = basis.wert[0]!.id;

    const erg = await entferneMarkenDatei(markeId, "logo", null);
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    // Die Marke selbst ist unverändert - herkunft bleibt 'gebuendelt':
    expect(erg.wert.logo?.herkunft).toBe("gebuendelt");
  });

  it("Scheitert das KOPIEREN, bleibt marken.json UNVERAENDERT (byte-identisch) und keine Zieldatei entsteht", async () => {
    const basis = await ladeBestand();
    if (!basis.ok) return;
    const markeId = basis.wert[0]!.id;
    await flushBestand();
    const markenVolltext = await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8");

    // Die SPERRE: marken-assets/<markeId> ist eine DATEI statt eines Ordners - copyFile
    // scheitert mit ENOTDIR/EISFILE; REST: marken.json muss UNVERAENDERT bleiben.
    const assetsWurzel = path.join(zustand.ordner, "marken-assets", markeId);
    await fs.mkdir(path.join(zustand.ordner, "marken-assets"), { recursive: true });
    await fs.writeFile(assetsWurzel, Buffer.alloc(4, 0));

    const quelle = await legeQuelleAn("x.woff2", Buffer.from("WOFF2-DUMPF"));

    const erg = await importiereMarkenDatei(markeId, "schrift", "headlineElegant", quelle);

    expect(erg.ok).toBe(false);
    if (!erg.ok) expect(erg.fehler.code).toBe("speicher_fehler");
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8")).toBe(markenVolltext);
    await expect(fs.access(path.join(markenOrdner(markeId), "headlineElegant.woff2"))).rejects.toThrow();
  });
});
