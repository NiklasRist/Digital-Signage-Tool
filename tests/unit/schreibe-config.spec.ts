import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppKonfig } from "../../src/shared/contracts/app-konfig";

// Unit-Test zu #31. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt, und das ist der wichtigste Handgriff dieser Datei:
// ermittleDatenOrt() liefert im Entwicklungslauf process.cwd(), der Test wuerde also
// die ECHTE config.json im Projektverzeichnis ueberschreiben. Der Mock haelt ihn
// zugleich von `electron` fern, das es im Testlauf gar nicht gibt.
//
// WAS DIESER TEST NICHT LEISTET: Der eigentliche Grund fuer die Wiederholung - ein
// fremder Prozess haelt config.json offen und das Rename scheitert mit EPERM - laesst
// sich hier nicht nachstellen. Er ist im Issue gemessen worden, nicht hier.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { schreibeConfig } = await import("../../src/main/config-store/schreibe-config");

const BASIS: AppKonfig = {
  aktivesProjektId: "projekt-1",
  letztesExportZiel: null,
  uiVoreinstellungen: {},
};

async function lies(name: string): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, name), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

async function existiert(name: string): Promise<boolean> {
  return fs
    .access(path.join(zustand.ordner, name))
    .then(() => true)
    .catch(() => false);
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-config-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("schreibeConfig (#31)", () => {
  it("schreibt die Konfiguration mit schemaVersion", async () => {
    const ergebnis = await schreibeConfig(BASIS);

    expect(ergebnis.ok).toBe(true);
    expect(await lies("config.json")).toEqual({ ...BASIS, schemaVersion: 1 });
  });

  it("legt beim ersten Schreiben keine .bak an", async () => {
    // Es gibt noch nichts zu sichern - das ist der Normalfall beim ersten Start und
    // ausdruecklich kein Fehler.
    await schreibeConfig(BASIS);

    expect(await existiert("config.json.bak")).toBe(false);
  });

  it("sichert vor dem Schreiben die vorherige Fassung nach .bak", async () => {
    await schreibeConfig(BASIS);
    await schreibeConfig({ ...BASIS, aktivesProjektId: "projekt-2" });

    // .bak = die letzte heile Version (TK 9.5.4), config.json = die neue.
    expect((await lies("config.json.bak"))["aktivesProjektId"]).toBe("projekt-1");
    expect((await lies("config.json"))["aktivesProjektId"]).toBe("projekt-2");
  });

  it("laesst config.json unveraendert, wenn der Inhalt nicht serialisierbar ist", async () => {
    await schreibeConfig(BASIS);

    const zirkulaer: Record<string, unknown> = {};
    zirkulaer["selbst"] = zirkulaer;
    const ergebnis = await schreibeConfig({ ...BASIS, uiVoreinstellungen: zirkulaer });

    // Kein Wurf ueber die Grenze, und vor allem: die alte Datei steht unversehrt da.
    expect(ergebnis.ok).toBe(false);
    expect((await lies("config.json"))["aktivesProjektId"]).toBe("projekt-1");
  });

  it("fuehrt gleichzeitige Schreibvorgaenge nacheinander aus", async () => {
    // Beide starten, bevor der erste fertig ist. Ohne Serialisierung teilen sie sich
    // dieselbe .tmp-Datei; das Ergebnis waere im besten Fall der falsche Stand, im
    // schlimmsten eine Mischung aus beiden.
    const [a, b] = await Promise.all([
      schreibeConfig({ ...BASIS, aktivesProjektId: "A" }),
      schreibeConfig({ ...BASIS, aktivesProjektId: "B" }),
    ]);

    expect(a.ok && b.ok).toBe(true);
    expect((await lies("config.json"))["aktivesProjektId"]).toBe("B");
  });
});
