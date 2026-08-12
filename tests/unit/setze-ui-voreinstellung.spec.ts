import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #30. Geprueft wird VERHALTEN auf einer echten Platte in einem eigenen
// Temp-Ordner - der Datenort (#5) ist gemockt, weil er im Testlauf sonst auf das
// Projektverzeichnis zeigt und die ECHTE config.json ueberschriebe.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { setzeUIVoreinstellung } = await import(
  "../../src/main/config-store/setze-ui-voreinstellung"
);

async function liesConfig(): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, "config.json"), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

async function schreibeConfigDatei(inhalt: unknown): Promise<void> {
  await fs.writeFile(path.join(zustand.ordner, "config.json"), JSON.stringify(inhalt), "utf8");
}

async function configExistiert(): Promise<boolean> {
  return fs
    .access(path.join(zustand.ordner, "config.json"))
    .then(() => true)
    .catch(() => false);
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-ui-vor-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("setzeUIVoreinstellung (#30)", () => {
  it("speichert den Wert, ohne die uebrigen Felder anzutasten", async () => {
    await schreibeConfigDatei({
      aktivesProjektId: "projekt-1",
      letztesExportZiel: "E:/stick",
      uiVoreinstellungen: { "app-shell.aktiverReiter": "composer" },
      schemaVersion: 1,
    });

    const ergebnis = await setzeUIVoreinstellung("composer.spaltenbreite", 320);

    expect(ergebnis.ok).toBe(true);
    const konfig = await liesConfig();
    expect(konfig["uiVoreinstellungen"]).toEqual({
      "app-shell.aktiverReiter": "composer",
      "composer.spaltenbreite": 320,
    });
    expect(konfig["aktivesProjektId"]).toBe("projekt-1");
    expect(konfig["letztesExportZiel"]).toBe("E:/stick");
  });

  it("verliert bei gleichzeitigen Aufrufen keinen der beiden Schluessel", async () => {
    // Der eigentliche Grund fuer aendereKonfig: Beide starten, bevor der erste fertig
    // ist. Wer zwischen Lesen und Schreiben unterbrechbar waere, schriebe hier den
    // Stand von vorher zurueck - der zuerst gesetzte Schluessel waere weg.
    await Promise.all([
      setzeUIVoreinstellung("a", 1),
      setzeUIVoreinstellung("b", 2),
    ]);

    expect((await liesConfig())["uiVoreinstellungen"]).toEqual({ a: 1, b: 2 });
  });

  it("weist einen leeren Schluessel ab, ohne etwas zu schreiben", async () => {
    const leer = await setzeUIVoreinstellung("", "x");
    const nurLeerzeichen = await setzeUIVoreinstellung("   ", "x");

    expect(leer.ok === false && leer.fehler.code).toBe("ungueltige_eingabe");
    expect(nurLeerzeichen.ok === false && nurLeerzeichen.fehler.code).toBe("ungueltige_eingabe");
    expect(await configExistiert()).toBe(false);
  });

  it("weist nicht serialisierbare Werte ab, ohne etwas zu schreiben", async () => {
    const zirkulaer: Record<string, unknown> = {};
    zirkulaer["selbst"] = zirkulaer;

    const funktion = await setzeUIVoreinstellung("k", () => undefined);
    const undefiniert = await setzeUIVoreinstellung("k", undefined);
    const kreis = await setzeUIVoreinstellung("k", zirkulaer);

    expect(funktion.ok === false && funktion.fehler.code).toBe("ungueltige_eingabe");
    // undefined wird MITABGELEHNT statt als "Schluessel entfernen" gedeutet - eine
    // Loesch-Bedeutung steht in keinem Vertrag.
    expect(undefiniert.ok === false && undefiniert.fehler.code).toBe("ungueltige_eingabe");
    expect(kreis.ok === false && kreis.fehler.code).toBe("ungueltige_eingabe");
    expect(await configExistiert()).toBe(false);
  });

  it("legt config.json beim ersten Setzen samt Vorbelegungen an", async () => {
    // Erster Start: es gibt noch keine Datei. leseKonfig faellt auf die Vorbelegungen
    // zurueck, und die duerfen nicht als "leer geschrieben" verlorengehen.
    await setzeUIVoreinstellung("app-shell.aktiverReiter", "projekte");

    const konfig = await liesConfig();
    expect(konfig["uiVoreinstellungen"]).toEqual({ "app-shell.aktiverReiter": "projekte" });
    expect(konfig["aktivesProjektId"]).toBeNull();
    expect(konfig["schemaVersion"]).toBe(1);
  });
});
