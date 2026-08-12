import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Verhaltenstest zu #26 (leseKonfig) und zum Nachtrag aendereKonfig (#31).
// Der Datenort ist gemockt, sonst laege die echte config.json des Projekts im Zugriff.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { leseKonfig } = await import("../../src/main/config-store/lese-konfig");
const { aendereKonfig, schreibeConfig } = await import(
  "../../src/main/config-store/schreibe-config"
);

const pfad = (name: string): string => path.join(zustand.ordner, name);

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "konfig-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("leseKonfig (#26)", () => {
  it("liefert bei fehlender config.json die Vorbelegungen ohne Fehler", async () => {
    const e = await leseKonfig();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.wert).toEqual({
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: {},
    });
  });

  it("stellt aus der .bak wieder her, wenn config.json beschaedigt ist", async () => {
    await fs.writeFile(pfad("config.json"), "{ das ist kein JSON");
    await fs.writeFile(
      pfad("config.json.bak"),
      JSON.stringify({ aktivesProjektId: "p-alt", letztesExportZiel: "E:/", uiVoreinstellungen: {} }),
    );

    const e = await leseKonfig();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.wert.aktivesProjektId).toBe("p-alt");
  });

  it("meldet speicher_fehler, wenn auch die .bak unbrauchbar ist", async () => {
    await fs.writeFile(pfad("config.json"), "kaputt");
    await fs.writeFile(pfad("config.json.bak"), "auch kaputt");

    const e = await leseKonfig();
    expect(e.ok).toBe(false);
    if (e.ok) return;
    // Kein stiller Rueckfall auf Vorbelegungen: der saehe aus wie ein erster Start und
    // wuerfe das zuletzt geoeffnete Projekt weg (TK 9.5.4).
    expect(e.fehler.code).toBe("speicher_fehler");
  });

  it("rettet die uebrigen Felder, wenn ein einzelnes unbrauchbar ist", async () => {
    await fs.writeFile(
      pfad("config.json"),
      JSON.stringify({ aktivesProjektId: "p-1", letztesExportZiel: 42, uiVoreinstellungen: [] }),
    );

    const e = await leseKonfig();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.wert.aktivesProjektId).toBe("p-1");
    expect(e.wert.letztesExportZiel).toBeNull();
    expect(e.wert.uiVoreinstellungen).toEqual({});
  });
});

describe("aendereKonfig (#31, Nachtrag)", () => {
  it("verliert bei zwei gleichzeitigen Aenderungen keine davon", async () => {
    // DAS ist der Grund, warum es diese Operation gibt. Beide Aufrufe lesen, aendern ein
    // ANDERES Feld und schreiben zurueck - am Ende muessen BEIDE Aenderungen dastehen.
    await schreibeConfig({
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: {},
    });

    await Promise.all([
      aendereKonfig((k) => ({ ok: true, wert: { konfig: { ...k, aktivesProjektId: "p-1" }, wert: 1 } })),
      aendereKonfig((k) => ({ ok: true, wert: { konfig: { ...k, letztesExportZiel: "E:/" }, wert: 2 } })),
    ]);

    const e = await leseKonfig();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.wert.aktivesProjektId).toBe("p-1");
    expect(e.wert.letztesExportZiel).toBe("E:/");
  });

  it("Gegenprobe: dasselbe von Hand gebaut verliert eine Aenderung", async () => {
    // Ohne die Operation sieht der Ablauf so aus - und belegt, dass der Test oben nicht
    // ohnehin gruen waere.
    await schreibeConfig({
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: {},
    });

    const vonHand = async (feld: "aktivesProjektId" | "letztesExportZiel", wert: string) => {
      const gelesen = await leseKonfig();
      if (!gelesen.ok) return;
      await schreibeConfig({ ...gelesen.wert, [feld]: wert });
    };

    await Promise.all([vonHand("aktivesProjektId", "p-1"), vonHand("letztesExportZiel", "E:/")]);

    const e = await leseKonfig();
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    const beide = e.wert.aktivesProjektId !== null && e.wert.letztesExportZiel !== null;
    expect(beide).toBe(false);
  });

  it("schreibt nichts, wenn die Aenderungsfunktion ablehnt", async () => {
    await schreibeConfig({
      aktivesProjektId: "unveraendert",
      letztesExportZiel: null,
      uiVoreinstellungen: {},
    });

    const e = await aendereKonfig(() => ({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "abgelehnt" },
    }));

    expect(e.ok).toBe(false);
    const danach = await leseKonfig();
    expect(danach.ok).toBe(true);
    if (!danach.ok) return;
    expect(danach.wert.aktivesProjektId).toBe("unveraendert");
  });

  it("faengt einen Wurf der Aenderungsfunktion als Ergebnis ab", async () => {
    // Ein Rueckruf von aussen darf den Schreibpfad nicht als Ausnahme verlassen.
    const e = await aendereKonfig(() => {
      throw new Error("Rueckruf kaputt");
    });
    expect(e.ok).toBe(false);
    if (e.ok) return;
    expect(e.fehler.code).toBe("ungueltige_eingabe");
  });
});
