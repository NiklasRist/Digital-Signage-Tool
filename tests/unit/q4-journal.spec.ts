import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalEintrag } from "../../src/shared/contracts/protokoll";

// Verhaltenstest zu #57 (Q4-Warteschlangenjournal). Echte Platte, eigener Temp-Ordner,
// keine Typebenen-Behauptungen - geprueft wird, was nach dem Aufruf in der Datei steht.
//
// Der Datenort ist gemockt: Ohne den Mock schriebe der Test in das echte
// warteschlangen-journal.json des Projektordners (ermittleDatenOrt() liefert im
// Entwicklungslauf process.cwd()), und `electron` liesse sich hier ohnehin nicht laden.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { haengeJournalEintragAn } = await import("../../src/main/auftrags-manager/q4-journal");

const DATEI = "warteschlangen-journal.json";

// Dieselbe Zahl wie die Konstante in q4-journal.ts. Sie wird dort BEWUSST nicht
// exportiert (DoD: "wird nirgendwo importiert"); der Test schreibt sie deshalb ab und
// prueft damit zugleich ihren Wert.
const MAX = 1000;

function pfad(name = DATEI): string {
  return path.join(zustand.ordner, name);
}

function eintrag(auftragId: string, position: number | null = 0): JournalEintrag {
  return { zeit: "2026-08-13T10:00:00.000Z", auftragId, bewegung: "eingereiht", position };
}

async function lies(): Promise<{ schemaVersion: number; eintraege: JournalEintrag[] }> {
  return JSON.parse(await fs.readFile(pfad(), "utf8")) as {
    schemaVersion: number;
    eintraege: JournalEintrag[];
  };
}

async function lege(inhalt: unknown): Promise<void> {
  await fs.writeFile(pfad(), JSON.stringify(inhalt), "utf8");
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-q4-"));
  // Der Vermerk bei defekter Datei geht als interne Meldung auf die Konsole des
  // Hauptprozesses. Hier abgefangen, damit die Testausgabe lesbar bleibt - und damit
  // pruefbar ist, DASS vermerkt wird.
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("haengeJournalEintragAn (#57)", () => {
  it("legt die Datei bei der ersten Bewegung an", async () => {
    const e = await haengeJournalEintragAn(eintrag("a-1"));

    expect(e.ok).toBe(true);
    const datei = await lies();
    expect(datei.schemaVersion).toBe(1);
    expect(datei.eintraege).toEqual([eintrag("a-1")]);
  });

  it("haengt hinten an und laesst die vorhandenen Eintraege in Reihenfolge davor stehen", async () => {
    await haengeJournalEintragAn(eintrag("a-1"));
    await haengeJournalEintragAn(eintrag("a-2"));
    await haengeJournalEintragAn(eintrag("a-3"));

    expect((await lies()).eintraege.map((j) => j.auftragId)).toEqual(["a-1", "a-2", "a-3"]);
  });

  it("kuerzt an der Grenze am Anfang und behaelt den gerade geschriebenen Eintrag", async () => {
    // DER INTERESSANTE FALL. Die Datei steht genau auf der Grenze; der naechste Eintrag
    // muss den aeltesten verdraengen und selbst ueberleben. Ein Kuerzen VOR dem
    // Anhaengen oder ein slice vom falschen Ende faellt genau hier auf.
    await lege({
      schemaVersion: 1,
      eintraege: Array.from({ length: MAX }, (_, i) => eintrag(`alt-${i}`)),
    });

    const e = await haengeJournalEintragAn(eintrag("neu"));

    expect(e.ok).toBe(true);
    const eintraege = (await lies()).eintraege;
    expect(eintraege).toHaveLength(MAX);
    expect(eintraege[0]?.auftragId).toBe("alt-1"); // "alt-0" ist herausrotiert
    expect(eintraege[MAX - 1]?.auftragId).toBe("neu");
  });

  it("kuerzt einen Schritt unterhalb der Grenze nicht", async () => {
    // Gegenprobe: Sonst waere der Test darueber auch mit einer Rotation gruen, die
    // grundsaetzlich einen Eintrag zu frueh wegwirft.
    await lege({
      schemaVersion: 1,
      eintraege: Array.from({ length: MAX - 1 }, (_, i) => eintrag(`alt-${i}`)),
    });

    await haengeJournalEintragAn(eintrag("neu"));

    const eintraege = (await lies()).eintraege;
    expect(eintraege).toHaveLength(MAX);
    expect(eintraege[0]?.auftragId).toBe("alt-0");
  });

  it("beginnt bei einer unlesbaren Datei neu, statt speicher_fehler zu melden", async () => {
    // Die Q4-Ausnahme: rein diagnostisch, keine Nutzdaten. Datei UND .bak kaputt -
    // erst dann meldet #69 einen Fehler.
    await fs.writeFile(pfad(), '{"eintraege": [{"zeit"', "utf8");
    await fs.writeFile(pfad(`${DATEI}.bak`), "auch kaputt", "utf8");

    const e = await haengeJournalEintragAn(eintrag("neu"));

    expect(e.ok).toBe(true);
    expect((await lies()).eintraege).toEqual([eintrag("neu")]);
    expect(console.warn).toHaveBeenCalled();
  });

  it("weist eine fremde schemaVersion ab, ohne die Datei anzufassen", async () => {
    // Eine neuere Fassung der Anwendung hat hier geschrieben. Ueberschreiben hiesse,
    // ihre Daten mit einem alten Format zu ersetzen.
    await lege({ schemaVersion: 2, eintraege: [eintrag("fremd")] });

    const e = await haengeJournalEintragAn(eintrag("neu"));

    expect(e.ok).toBe(false);
    if (e.ok) return;
    expect(e.fehler.code).toBe("speicher_fehler");
    expect((await lies()).eintraege).toEqual([eintrag("fremd")]);
  });

  it("meldet einen Schreibfehler als speicher_fehler, statt zu werfen", async () => {
    await haengeJournalEintragAn(eintrag("a-1"));
    // Ein Verzeichnis an der Stelle der .tmp: das Schreiben in #69 scheitert
    // reproduzierbar, die Zieldatei bleibt unberuehrt.
    await fs.mkdir(pfad(`${DATEI}.tmp`));

    const e = await haengeJournalEintragAn(eintrag("a-2"));

    expect(e.ok).toBe(false);
    if (e.ok) return;
    expect(e.fehler.code).toBe("speicher_fehler");
    expect((await lies()).eintraege).toEqual([eintrag("a-1")]);
  });

  it("weist eine unbekannte Bewegung ab und laesst die Datei unangetastet", async () => {
    await haengeJournalEintragAn(eintrag("a-1"));

    const e = await haengeJournalEintragAn({
      ...eintrag("a-2"),
      bewegung: "geloescht" as JournalEintrag["bewegung"],
    });

    expect(e.ok).toBe(false);
    if (e.ok) return;
    expect(e.fehler.code).toBe("ungueltige_eingabe");
    expect((await lies()).eintraege).toEqual([eintrag("a-1")]);
  });

  it("weist einen Eintrag ohne auftragId ab", async () => {
    // Ein Journal ohne Auftrags-Kennung beantwortet die einzige Frage nicht mehr, fuer
    // die es existiert ("warum lief das nie?").
    const e = await haengeJournalEintragAn({ ...eintrag(""), position: null });

    expect(e.ok).toBe(false);
    if (e.ok) return;
    expect(e.fehler.code).toBe("ungueltige_eingabe");
    await expect(fs.access(pfad())).rejects.toThrow();
  });
});
