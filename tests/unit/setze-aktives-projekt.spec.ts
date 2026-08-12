import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #27. Er prueft VERHALTEN auf einer echten Platte in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt: ermittleDatenOrt() liefert im Entwicklungslauf
// process.cwd(), der Test wuerde sonst die ECHTE config.json im Projektverzeichnis
// ueberschreiben. Zugleich haelt der Mock `electron` fern, das es im Testlauf nicht gibt.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { setzeAktivesProjekt } = await import(
  "../../src/main/config-store/setze-aktives-projekt"
);
const { aendereKonfig } = await import("../../src/main/config-store/schreibe-config");

async function liesConfig(): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, "config.json"), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-aktives-projekt-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("setzeAktivesProjekt (#27)", () => {
  it("merkt die projektId in config.json", async () => {
    const ergebnis = await setzeAktivesProjekt("projekt-1");

    expect(ergebnis.ok).toBe(true);
    expect((await liesConfig())["aktivesProjektId"]).toBe("projekt-1");
  });

  it("laesst die uebrigen Felder der Konfiguration unberuehrt", async () => {
    await aendereKonfig<void>((konfig) => ({
      ok: true,
      wert: { konfig: { ...konfig, letztesExportZiel: "E:\\" }, wert: undefined },
    }));

    await setzeAktivesProjekt("projekt-1");

    expect((await liesConfig())["letztesExportZiel"]).toBe("E:\\");
  });

  it("weist leere Eingaben ab, ohne config.json anzufassen", async () => {
    for (const eingabe of ["", "   ", undefined as unknown as string]) {
      const ergebnis = await setzeAktivesProjekt(eingabe);

      expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    }
    // "keine Wirkung" heisst: es wurde nicht einmal eine Datei angelegt.
    await expect(liesConfig()).rejects.toThrow();
  });

  it("verliert keine gleichzeitige Aenderung an einem anderen Feld", async () => {
    // Der Grund fuer aendereKonfig statt leseKonfig + schreibeConfig: Liefen Lesen und
    // Schreiben getrennt, laesen beide denselben Stand und der zuerst geschriebene waere weg.
    await Promise.all([
      setzeAktivesProjekt("projekt-1"),
      aendereKonfig<void>((konfig) => ({
        ok: true,
        wert: { konfig: { ...konfig, letztesExportZiel: "E:\\" }, wert: undefined },
      })),
    ]);

    const konfig = await liesConfig();
    expect(konfig["aktivesProjektId"]).toBe("projekt-1");
    expect(konfig["letztesExportZiel"]).toBe("E:\\");
  });
});
