import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #46. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt: ermittleDatenOrt() liefert im Entwicklungslauf
// process.cwd(), der Test wuerde sonst echte Projekte im Projektverzeichnis anfassen.
// Der Mock haelt ihn zugleich von `electron` fern, das es im Testlauf nicht gibt.
//
// WAS DIESER TEST NICHT LEISTET: Der eigentliche Grund fuer die Wiederholung - ein
// fremder Prozess haelt project.json offen und das Rename scheitert mit EPERM - laesst
// sich hier nicht nachstellen; er ist in #31 gemessen worden. Ebenso wenig pruefbar ist
// der Stromausfall zwischen fsync und Rename.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { schreibeProjekt } = await import("../../src/main/project-store/schreibe-projekt");
const { projektOrdner } = await import("../../src/main/project-store/pfade");

const BASIS: Project = {
  id: "p1",
  name: "Studio Nord",
  erstelltAm: "2026-08-12T08:00:00.000Z",
  geaendertAm: "2026-08-12T08:00:00.000Z",
  schemaVersion: 0, // absichtlich falsch - die Datei muss trotzdem 1 tragen
  assets: [],
  aktionen: [],
  liste: [],
  letzterAusgabeName: null,
};

function pfad(name: string): string {
  return path.join(projektOrdner(BASIS.id), name);
}

async function lies(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(await fs.readFile(pfad(name), "utf8")) as Record<string, unknown>;
}

async function existiert(name: string): Promise<boolean> {
  return fs
    .access(pfad(name))
    .then(() => true)
    .catch(() => false);
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-projekt-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("schreibeProjekt (#46)", () => {
  it("schreibt project.json mit aktueller schemaVersion und legt den Projektordner an", async () => {
    const ergebnis = await schreibeProjekt(BASIS);

    expect(ergebnis.ok).toBe(true);
    expect(await lies("project.json")).toEqual({ ...BASIS, schemaVersion: 1 });
  });

  it("legt beim ersten Schreiben keine .bak an", async () => {
    // Es gibt noch nichts zu sichern - Normalfall beim ersten Speichern, kein Fehler.
    await schreibeProjekt(BASIS);

    expect(await existiert("project.json.bak")).toBe(false);
  });

  it("sichert vor jedem Schreiben die vorherige Fassung nach .bak", async () => {
    await schreibeProjekt(BASIS);
    await schreibeProjekt({ ...BASIS, name: "Studio Sued" });

    // .bak = die letzte heile Version (TK 9.5.4), project.json = die neue.
    expect((await lies("project.json.bak"))["name"]).toBe("Studio Nord");
    expect((await lies("project.json"))["name"]).toBe("Studio Sued");
  });

  it("laesst project.json unveraendert, wenn das Schreiben der .tmp scheitert", async () => {
    await schreibeProjekt(BASIS);
    // Ein Verzeichnis an der Stelle der .tmp: fs.open(.., 'w') scheitert - dasselbe
    // Ergebnis wie ein Abbruch mitten im Schreiben, nur reproduzierbar.
    await fs.mkdir(pfad("project.json.tmp"));

    const ergebnis = await schreibeProjekt({ ...BASIS, name: "Studio Sued" });

    expect(ergebnis.ok).toBe(false);
    expect((await lies("project.json"))["name"]).toBe("Studio Nord");
  });

  it("bricht ab, wenn die Sicherung nach .bak scheitert, und schreibt dann nicht", async () => {
    // Die im STOPP-Block geklaerte Variante: kein Schreiben ohne frisches Backup
    // (gleichlautend mit der gebauten Schwesterfunktion #31).
    await schreibeProjekt(BASIS);
    await fs.rm(pfad("project.json.bak"), { force: true });
    await fs.mkdir(pfad("project.json.bak"));

    const ergebnis = await schreibeProjekt({ ...BASIS, name: "Studio Sued" });

    expect(ergebnis.ok).toBe(false);
    expect((await lies("project.json"))["name"]).toBe("Studio Nord");
  });

  it("weist eine Projekt-ID ab, die aus ihrem Ordner ausbrechen wuerde", async () => {
    const ergebnis = await schreibeProjekt({ ...BASIS, id: `..${path.sep}fremd` });

    expect(ergebnis.ok).toBe(false);
    // Nichts angelegt: Der Ausbruch haette neben dem Datenort geschrieben.
    expect(await fs.readdir(zustand.ordner)).toEqual([]);
  });

  // --- Das .bak-Fenster (gefunden beim Bau von #34, geschlossen 12.08.2026) ---
  it("ueberschreibt eine HEILE .bak nicht mit einer kaputten project.json", async () => {
    // Der gefaehrliche Ablauf: project.json ist defekt, das Projekt wurde aus der .bak
    // gerettet. Wuerde jetzt blind gesichert, kopierte die kaputte Fassung ueber die
    // einzige heile - und ein anschliessend scheiterndes Schreiben (volle Platte, meist
    // genau die Ursache) liesse gar nichts Brauchbares zurueck.
    await fs.mkdir(projektOrdner(BASIS.id), { recursive: true });
    await fs.writeFile(pfad("project.json"), "{kaputt", "utf8");
    await fs.writeFile(
      pfad("project.json.bak"),
      JSON.stringify({ ...BASIS, name: "die heile Fassung" }),
      "utf8",
    );

    const ergebnis = await schreibeProjekt({ ...BASIS, name: "der neue Stand" });

    expect(ergebnis.ok).toBe(true);
    // Die Sicherung ist unberuehrt geblieben ...
    expect((await lies("project.json.bak")).name).toBe("die heile Fassung");
    // ... und der neue Stand steht trotzdem.
    expect((await lies("project.json")).name).toBe("der neue Stand");
  });

  it("sichert eine lesbare project.json weiterhin", async () => {
    // Gegenprobe: Die Reparatur darf die Sicherung nicht generell abschalten.
    await fs.mkdir(projektOrdner(BASIS.id), { recursive: true });
    await fs.writeFile(
      pfad("project.json"),
      JSON.stringify({ ...BASIS, name: "der alte Stand" }),
      "utf8",
    );

    await schreibeProjekt({ ...BASIS, name: "der neue Stand" });

    expect((await lies("project.json.bak")).name).toBe("der alte Stand");
  });
});
