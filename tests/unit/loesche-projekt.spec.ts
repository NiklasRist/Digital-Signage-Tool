import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #37. Er prueft VERHALTEN auf einer echten Platte in einem eigenen
// Temp-Ordner - nicht die Deklarationen. Bei einem unumkehrbaren Vorgang zaehlt vor allem,
// was NICHT verschwindet: Nachbarprojekte, der Datenort, fremde Ordner.
//
// Der Datenort (#5) ist gemockt: ermittleDatenOrt() liefert im Entwicklungslauf
// process.cwd() - ohne den Mock loeschte dieser Test echte Projekte im Projektverzeichnis.
// Zugleich haelt der Mock `electron` fern, das es im Testlauf nicht gibt.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { löscheProjekt } = await import("../../src/main/project-store/loesche-projekt");

function projektPfad(id: string): string {
  return path.join(zustand.ordner, "projects", id);
}

/** Legt einen vollstaendigen Projektordner an - alle fuenf Bestandteile aus der DoD. */
async function legeProjektAn(id: string): Promise<void> {
  const ordner = projektPfad(id);
  await fs.mkdir(path.join(ordner, "media"), { recursive: true });
  await fs.mkdir(path.join(ordner, "output"), { recursive: true });
  await fs.writeFile(path.join(ordner, "project.json"), `{"id":"${id}"}`, "utf8");
  await fs.writeFile(path.join(ordner, "project.json.bak"), `{"id":"${id}"}`, "utf8");
  await fs.writeFile(path.join(ordner, "queue-retry.json"), "[]", "utf8");
  await fs.writeFile(path.join(ordner, "media", "a.mp4"), "x", "utf8");
  await fs.writeFile(path.join(ordner, "output", "loop.mp4"), "x", "utf8");
}

async function existiert(pfad: string): Promise<boolean> {
  return fs
    .access(pfad)
    .then(() => true)
    .catch(() => false);
}

async function schreibeKonfig(aktivesProjektId: string | null): Promise<void> {
  await fs.writeFile(
    path.join(zustand.ordner, "config.json"),
    JSON.stringify({ aktivesProjektId, letztesExportZiel: null, uiVoreinstellungen: {} }),
    "utf8",
  );
}

async function liesKonfig(): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, "config.json"), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-loesche-projekt-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("löscheProjekt (#37)", () => {
  it("entfernt den kompletten Projektordner und laesst das Nachbarprojekt stehen", async () => {
    await legeProjektAn("p1");
    await legeProjektAn("p2");

    const ergebnis = await löscheProjekt("p1");

    expect(ergebnis.ok).toBe(true);
    expect(await existiert(projektPfad("p1"))).toBe(false);
    expect(await existiert(path.join(projektPfad("p2"), "output", "loop.mp4"))).toBe(true);
  });

  it("setzt das aktive Projekt auf null, wenn das geloeschte das aktive war", async () => {
    await legeProjektAn("p1");
    await schreibeKonfig("p1");

    await löscheProjekt("p1");

    // TK 9.5.6: sanfter Rueckfall auf "kein aktives Projekt", kein Zeiger auf einen toten Ordner.
    expect((await liesKonfig())["aktivesProjektId"]).toBeNull();
  });

  it("laesst den Vermerk stehen, wenn ein anderes Projekt aktiv ist", async () => {
    await legeProjektAn("p1");
    await legeProjektAn("p2");
    await schreibeKonfig("p2");

    await löscheProjekt("p1");

    expect((await liesKonfig())["aktivesProjektId"]).toBe("p2");
  });

  it("meldet nicht_gefunden fuer ein Projekt, das es nicht gibt", async () => {
    await legeProjektAn("p1");

    const ergebnis = await löscheProjekt("p2");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
    expect(await fs.readdir(path.join(zustand.ordner, "projects"))).toEqual(["p1"]);
  });

  it("weist eine ID ab, die aus projects/ ausbricht - der Datenort bleibt unberuehrt", async () => {
    await legeProjektAn("p1");

    // projektOrdner("..") ergibt den DATENORT selbst; ohne die Pruefung faellt hier alles.
    for (const id of ["..", `..${path.sep}..`, `p1${path.sep}media`, ""]) {
      expect(await löscheProjekt(id)).toMatchObject({
        ok: false,
        fehler: { code: "ungueltige_eingabe" },
      });
    }
    expect(await existiert(path.join(projektPfad("p1"), "media", "a.mp4"))).toBe(true);
  });

  it("weist eine ID mit Leerzeichen oder Punkt am Ende ab", async () => {
    await legeProjektAn("p1");

    // Windows schneidet beides still ab: "p1 " zeigte dort auf den Ordner "p1" - geloescht
    // wuerde ein Projekt, nach dem niemand gefragt hat.
    expect(await löscheProjekt("p1 ")).toMatchObject({ ok: false });
    expect(await löscheProjekt("p1.")).toMatchObject({ ok: false });
    expect(await existiert(projektPfad("p1"))).toBe(true);
  });

  it("loescht nichts, wenn an der Stelle des Projektordners eine Datei liegt", async () => {
    await fs.mkdir(path.join(zustand.ordner, "projects"), { recursive: true });
    await fs.writeFile(projektPfad("p1"), "keine Projektordner-Struktur", "utf8");

    const ergebnis = await löscheProjekt("p1");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
    expect(await existiert(projektPfad("p1"))).toBe(true);
  });

  it("loescht NICHT bei abweichender Gross-/Kleinschreibung", async () => {
    // Entschieden am 12.08.2026. Die Kennungspruefung ist eine Zeichenkettenpruefung, das
    // Ziel bestimmt aber das Dateisystem: Auf Windows trifft "P1" den Ordner "p1". Ohne die
    // Nachrechnung waere ein Projekt geloescht worden, nach dem niemand gefragt hat.
    await legeProjektAn("p1");

    const ergebnis = await löscheProjekt("P1");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(await existiert(projektPfad("p1"))).toBe(true);
  });
});
