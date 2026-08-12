import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Verhaltenstest zu #28. Der Datenort ist gemockt, sonst laege die echte config.json
// des Projekts im Zugriff - und `electron` gibt es im Testlauf gar nicht.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { setzeExportZiel } = await import(
  "../../src/main/config-store/setze-export-ziel"
);
const { aendereKonfig, schreibeConfig } = await import(
  "../../src/main/config-store/schreibe-config"
);

async function konfigAufPlatte(): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, "config.json"), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "export-ziel-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("setzeExportZiel (#28)", () => {
  it("merkt sich den Pfad in config.json", async () => {
    const ergebnis = await setzeExportZiel("E:\\signage");

    expect(ergebnis.ok).toBe(true);
    expect((await konfigAufPlatte())["letztesExportZiel"]).toBe("E:\\signage");
  });

  it("laesst die uebrigen Felder unberuehrt", async () => {
    await schreibeConfig({
      aktivesProjektId: "projekt-1",
      letztesExportZiel: null,
      uiVoreinstellungen: { reiter: "composer" },
    });

    await setzeExportZiel("E:\\signage");

    const konfig = await konfigAufPlatte();
    expect(konfig["aktivesProjektId"]).toBe("projekt-1");
    expect(konfig["uiVoreinstellungen"]).toEqual({ reiter: "composer" });
  });

  it("speichert ein nicht erreichbares Laufwerk trotzdem", async () => {
    // Der Stick darf beim Merken abgezogen sein - geprueft wird erst beim Export
    // (TK 9.6.2). Eine Existenzpruefung hier wuerde genau die Vorbelegung loeschen.
    const ergebnis = await setzeExportZiel(path.join(zustand.ordner, "gibt-es-nicht"));

    expect(ergebnis.ok).toBe(true);
  });

  it.each([
    ["leer", ""],
    ["nur Leerzeichen", "   "],
    ["kein String", 42 as unknown as string],
  ])("weist %s ab, ohne etwas zu schreiben", async (_fall, eingabe) => {
    const ergebnis = await setzeExportZiel(eingabe);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    // "keine Wirkung": es entsteht nicht einmal eine config.json.
    await expect(konfigAufPlatte()).rejects.toThrow();
  });

  it("verliert keine gleichzeitige Aenderung eines anderen Feldes", async () => {
    // Der Grund fuer aendereKonfig statt leseKonfig + schreibeConfig: Beide Aufrufe
    // laufen ineinander, beide lesen denselben Stand - ohne die Klammer waere eine
    // der beiden Aenderungen lautlos weg.
    await Promise.all([
      setzeExportZiel("E:\\signage"),
      aendereKonfig<void>((konfig) => ({
        ok: true,
        wert: {
          konfig: { ...konfig, aktivesProjektId: "projekt-1" },
          wert: undefined,
        },
      })),
    ]);

    const konfig = await konfigAufPlatte();
    expect(konfig["letztesExportZiel"]).toBe("E:\\signage");
    expect(konfig["aktivesProjektId"]).toBe("projekt-1");
  });
});
