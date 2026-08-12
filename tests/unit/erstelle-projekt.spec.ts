import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #33. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt: Sonst legte der Test echte Projekte im
// Projektverzeichnis an, und ermittleDatenOrt() zoege `electron` herein, das es im
// Testlauf nicht gibt.
const zustand = { ordner: "", schreibFehler: false };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

// schreibeProjekt (#46) laeuft ECHT, ausser wenn der Rollback-Test es scheitern lassen
// will. Anders ist der Fall nicht herbeizufuehren: Der Projektordner heisst nach der ID,
// und die entsteht erst im Aufruf - vorher gibt es nichts zu blockieren.
vi.mock("../../src/main/project-store/schreibe-projekt", async () => {
  const echt = await vi.importActual<
    typeof import("../../src/main/project-store/schreibe-projekt")
  >("../../src/main/project-store/schreibe-projekt");
  return {
    schreibeProjekt: (projekt: Project) =>
      zustand.schreibFehler
        ? Promise.resolve({
            ok: false,
            fehler: { code: "speicher_fehler", meldung: "Test: Platte voll" },
          })
        : echt.schreibeProjekt(projekt),
  };
});

const { erstelleProjekt } = await import("../../src/main/project-store/erstelle-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");
const { projektOrdner } = await import("../../src/main/project-store/pfade");

/** <Datenort>/projects - abgeleitet statt nachgebaut, damit der Test kein Layout kennt. */
function projekteOrdner(): string {
  return path.dirname(projektOrdner("beliebig"));
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-erstelle-"));
  zustand.schreibFehler = false;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("erstelleProjekt (#33)", () => {
  it("legt project.json und media/ an und liefert ein leeres Projekt", async () => {
    const ergebnis = await erstelleProjekt("Studio Nord");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert).toMatchObject({
      name: "Studio Nord",
      assets: [],
      aktionen: [],
      liste: [],
      letzterAusgabeName: null,
    });

    const ordner = projektOrdner(ergebnis.wert.id);
    const datei = JSON.parse(await fs.readFile(path.join(ordner, "project.json"), "utf8")) as unknown;
    // Der Rueckgabewert und die Datei sind derselbe Stand - sonst haette der Aufrufer ein
    // Projekt in der Hand, das so nicht auf der Platte liegt (DoD: "ueber oeffneProjekt
    // mit identischem Inhalt ladbar").
    expect(datei).toEqual(ergebnis.wert);
    expect((await fs.stat(path.join(ordner, "media"))).isDirectory()).toBe(true);
  });

  it("weist einen leeren Namen ab und legt nichts an", async () => {
    const ergebnis = await erstelleProjekt("   ");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(await fs.readdir(zustand.ordner)).toEqual([]);
  });

  it("speichert den Anzeigenamen ohne Randleerzeichen", async () => {
    const ergebnis = await erstelleProjekt("  Studio Nord  ");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.name).toBe("Studio Nord");
  });

  it("gibt jedem Aufruf einen eigenen Ordner", async () => {
    const eins = await erstelleProjekt("Studio Nord");
    const zwei = await erstelleProjekt("Studio Nord");

    expect(eins.ok && zwei.ok).toBe(true);
    expect((await fs.readdir(projekteOrdner())).length).toBe(2);
  });

  it("laesst keinen halben Projektordner zurueck, wenn project.json nicht geschrieben werden kann", async () => {
    zustand.schreibFehler = true;

    const ergebnis = await erstelleProjekt("Studio Nord");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    // Kein Ordner ohne project.json - der waere fuer listeProjekte (#35) eine Leiche.
    expect(await fs.readdir(projekteOrdner())).toEqual([]);
  });

  it("laeuft innerhalb des D1-Locks", async () => {
    let freigeben: () => void = () => undefined;
    const gehalten = mitD1Lock(() => new Promise<void>((auf) => (freigeben = auf)));

    const lauf = erstelleProjekt("Studio Nord");
    await new Promise((weiter) => setTimeout(weiter, 20));
    // Solange ein fremder Abschnitt das Lock haelt, darf nichts auf der Platte passieren.
    expect(await fs.readdir(zustand.ordner)).toEqual([]);

    freigeben();
    await gehalten;
    expect((await lauf).ok).toBe(true);
  });
});
