import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AKTUELLE_SCHEMA_VERSION } from "../../src/shared/contracts/konstanten";

import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #36. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt: Sonst legte der Test echte Projekte im Projektverzeichnis
// an, und ermittleDatenOrt() zoege `electron` herein, das es im Testlauf nicht gibt.
const zustand = { ordner: "", schreibFehler: false };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

// schreibeProjekt (#46) laeuft ECHT, ausser wenn der Aufraeum-Test es scheitern lassen will.
// Anders ist der Fall nicht herbeizufuehren: Der Zielordner heisst nach der neuen ID, und die
// entsteht erst im Aufruf - vorher gibt es nichts zu blockieren.
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

const { dupliziereProjekt } = await import("../../src/main/project-store/dupliziere-projekt");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");
const { medienOrdner, projektOrdner } = await import("../../src/main/project-store/pfade");

const QUELL_ID = "11111111-1111-4111-8111-111111111111";
const VIDEO = "22222222-2222-4222-8222-222222222222.mp4";

/** <Datenort>/projects - abgeleitet statt nachgebaut, damit der Test kein Layout kennt. */
function projekteOrdner(): string {
  return path.dirname(projektOrdner("beliebig"));
}

function quellProjekt(): Project {
  return {
    id: QUELL_ID,
    name: "Sommeraktion",
    erstelltAm: "2026-01-01T00:00:00.000Z",
    geaendertAm: "2026-01-02T00:00:00.000Z",
    schemaVersion: AKTUELLE_SCHEMA_VERSION,
    assets: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        typ: "video",
        dateiname: VIDEO,
        originalname: "sommer.mp4",
        maße: { breite: 1920, höhe: 1080 },
        dauer: 12.5,
        importdatum: "2026-01-01T00:00:00.000Z",
        zustand: "ok",
      },
    ],
    aktionen: [],
    liste: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        art: "video",
        ref: "22222222-2222-4222-8222-222222222222",
        dauer: null,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      },
    ],
    letzterAusgabeName: "Sommer",
    standardSegmentdauer: 10, // Pflichtfeld seit TK v3.18 (#334)
  };
}

/** Legt die Quelle direkt auf der Platte an - ohne erstelleProjekt (#33), damit der Test nur #36 misst. */
async function legeQuelleAn(): Promise<void> {
  await fs.mkdir(medienOrdner(QUELL_ID), { recursive: true });
  await fs.writeFile(path.join(medienOrdner(QUELL_ID), VIDEO), "originalvideo", "utf8");
  await fs.writeFile(
    path.join(projektOrdner(QUELL_ID), "project.json"),
    JSON.stringify(quellProjekt(), null, 2),
    "utf8",
  );
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-dupliziere-"));
  zustand.schreibFehler = false;
  merkeAktivesProjekt(null);
  await legeQuelleAn();
});

afterEach(async () => {
  merkeAktivesProjekt(null);
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("dupliziereProjekt (#36)", () => {
  it("vergibt eine neue Projekt-ID, behaelt die internen IDs und kopiert media/ physisch", async () => {
    const ergebnis = await dupliziereProjekt(QUELL_ID, "  Winteraktion  ");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    const kopie = ergebnis.wert;
    expect(kopie.id).not.toBe(QUELL_ID);
    expect(kopie.name).toBe("Winteraktion");
    // TK 9.11.4: die projektinternen IDs bleiben - sonst zeigt Listenelement.ref ins Leere.
    expect(kopie.assets[0]?.id).toBe(quellProjekt().assets[0]?.id);
    expect(kopie.liste[0]?.id).toBe(quellProjekt().liste[0]?.id);
    expect(kopie.liste[0]?.ref).toBe(kopie.assets[0]?.id);

    // Die Datei traegt denselben Stand wie der Rueckgabewert.
    const datei = JSON.parse(
      await fs.readFile(path.join(projektOrdner(kopie.id), "project.json"), "utf8"),
    ) as unknown;
    expect(datei).toEqual(kopie);

    // "keine Referenz auf den Original-Ordner": Die Quelle wird nach dem Kopieren ueberschrieben,
    // die Kopie muss davon unberuehrt bleiben.
    const kopiertesVideo = path.join(medienOrdner(kopie.id), VIDEO);
    await fs.writeFile(path.join(medienOrdner(QUELL_ID), VIDEO), "spaeter geaendert", "utf8");
    expect(await fs.readFile(kopiertesVideo, "utf8")).toBe("originalvideo");

    // Das Original bleibt unveraendert.
    const quelleNachher = JSON.parse(
      await fs.readFile(path.join(projektOrdner(QUELL_ID), "project.json"), "utf8"),
    ) as unknown;
    expect(quelleNachher).toEqual(quellProjekt());
  });

  it("kopiert den Speicherstand des offenen Projekts, nicht die aeltere Datei", async () => {
    // Der Fall aus dem Alltag: entprelltes Auto-Speichern (3-5 s), der Nutzer dupliziert sofort
    // nach einer Aenderung.
    const offen = quellProjekt();
    offen.liste.push({
      id: "44444444-4444-4444-8444-444444444444",
      art: "video",
      ref: "22222222-2222-4222-8222-222222222222",
      dauer: null,
      trimStart: 0,
      trimEnde: 12.5,
      einblendung: null,
    });
    merkeAktivesProjekt(offen);

    const ergebnis = await dupliziereProjekt(QUELL_ID, "Winteraktion");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.liste).toHaveLength(2);
    // Und das offene Projekt teilt seine Arrays NICHT mit der Kopie.
    expect(ergebnis.wert.liste).not.toBe(offen.liste);
    expect(offen.id).toBe(QUELL_ID);
  });

  it("weist einen leeren Namen ab und legt nichts an", async () => {
    const ergebnis = await dupliziereProjekt(QUELL_ID, "   ");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(await fs.readdir(projekteOrdner())).toEqual([QUELL_ID]);
  });

  it("meldet nicht_gefunden, wenn es die Quelle nicht gibt", async () => {
    const ergebnis = await dupliziereProjekt("99999999-9999-4999-8999-999999999999", "Kopie");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(await fs.readdir(projekteOrdner())).toEqual([QUELL_ID]);
  });

  it("laesst keinen halben Projektordner zurueck, wenn project.json nicht geschrieben werden kann", async () => {
    zustand.schreibFehler = true;

    const ergebnis = await dupliziereProjekt(QUELL_ID, "Winteraktion");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    // Kein Ordner mit kopierten Medien, aber ohne project.json - der waere eine Leiche.
    expect(await fs.readdir(projekteOrdner())).toEqual([QUELL_ID]);
  });

  it("laeuft innerhalb des D1-Locks", async () => {
    let freigeben: () => void = () => undefined;
    const gehalten = mitD1Lock(() => new Promise<void>((auf) => (freigeben = auf)));

    const lauf = dupliziereProjekt(QUELL_ID, "Winteraktion");
    await new Promise((weiter) => setTimeout(weiter, 20));
    // Solange ein fremder Abschnitt das Lock haelt, darf kein Zielordner entstehen.
    expect(await fs.readdir(projekteOrdner())).toEqual([QUELL_ID]);

    freigeben();
    await gehalten;
    expect((await lauf).ok).toBe(true);
  });
});
