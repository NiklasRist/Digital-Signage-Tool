import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragStatus } from "../../src/shared/contracts/auftrag";

// Verhaltenstests zu holeStand (#64): geprueft wird die zusammengefuehrte Liste -
// Quellen, Deduplizierung, Reihenfolge, Unveraendertheit der Speicher.
//
// Q2 wird ERSETZT, Q1 nicht. Grund: Das echte Q2-Modul (#55) haengt an der Platte
// (queue-retry.json, Projektordner); es hier mitlaufen zu lassen, hiesse Dateien
// anzulegen, um eine Funktion zu pruefen, die ausdruecklich KEINE Datei-I/O ausloesen
// darf. Der Ersatz ist zugleich der Nachweis dafuer: Waeschelte holeStand die Platte
// an, laeuft der Test in ein nicht vorhandenes Projekt. Q1 (#54) ist reiner RAM und
// laeuft deshalb echt mit - nur so wird die geforderte FIFO-Reihenfolge wirklich
// geprueft und nicht bloss nachgestellt.
const q2 = vi.hoisted(() => ({
  stand: null as { projektId: string; datei: { schemaVersion: number; auftraege: unknown[]; pendingDeletions: unknown[] } } | null,
}));

vi.mock("../../src/main/auftrags-manager/q2-wiederholung", () => ({
  // Gibt bewusst das ORIGINAL heraus, nicht wie #55 eine Kopie: So faellt auf, wenn
  // holeStand an Ort und Stelle sortierte oder anhaengte.
  holeQ2Stand: () => q2.stand,
}));

type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");
type HoleStand = typeof import("../../src/main/auftrags-manager/hole-stand").holeStand;

// Q1 ist modulweiter, fluechtiger Zustand ohne Leer-Funktion im Vertrag; ein frisches
// Modul je Test ist der einzige Weg zu einer leeren Schlange (dasselbe Muster nutzt
// q1-warteschlange.spec.ts). Beide Importe nach demselben `resetModules` treffen
// dieselbe Instanz - auch der, den holeStand intern zieht.
async function frisch(): Promise<{ q1: Q1Modul; holeStand: HoleStand }> {
  vi.resetModules();
  const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
  const { holeStand } = await import("../../src/main/auftrags-manager/hole-stand");
  return { q1, holeStand };
}

function auftrag(
  id: string,
  status: AuftragStatus = "anstehend",
  erstelltAm = "2026-08-13T10:00:00.000Z",
): Auftrag {
  return {
    auftragId: id,
    art: "import",
    status,
    label: `Import ${id}`,
    payload: { projektId: "p1", quellPfad: `C:/quelle/${id}.mp4` },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm,
  };
}

function q2Stand(auftraege: Auftrag[], pendingDeletions: unknown[] = []): void {
  q2.stand = { projektId: "p1", datei: { schemaVersion: 1, auftraege, pendingDeletions } };
}

const ids = (auftraege: Auftrag[]): string[] => auftraege.map((a) => a.auftragId);

function wert(ergebnis: Awaited<ReturnType<HoleStand>>): Auftrag[] {
  if (!ergebnis.ok) {
    throw new Error(`unerwarteter Fehler: ${ergebnis.fehler.code}`);
  }
  return ergebnis.wert;
}

describe("holeStand (#64)", () => {
  beforeEach(() => {
    q2.stand = null;
  });

  it("liefert bei leerem Q1 und leerem Q2 ein leeres Array, keinen Fehler", async () => {
    const { holeStand } = await frisch();

    expect(await holeStand()).toEqual({ ok: true, wert: [] });

    q2Stand([]);
    expect(await holeStand()).toEqual({ ok: true, wert: [] });
  });

  it("zeigt Fehlschlaege, die nur in Q2 liegen", async () => {
    const { holeStand } = await frisch();
    q2Stand([auftrag("f1", "fehlgeschlagen")]);

    expect(ids(wert(await holeStand()))).toEqual(["f1"]);
  });

  it("zeigt einen wiederholten Auftrag genau einmal, mit der Q1-Fassung", async () => {
    const { q1, holeStand } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("a1", "anstehend"));
    q2Stand([auftrag("a1", "fehlgeschlagen")]);

    const liste = wert(await holeStand());

    expect(ids(liste)).toEqual(["a1"]);
    expect(liste[0]?.status).toBe("anstehend");
  });

  it("ordnet laufenden Auftrag, anstehende in FIFO und Fehlschlaege juengster zuerst", async () => {
    const { q1, holeStand } = await frisch();
    // Absichtlich NICHT in der Zielreihenfolge eingereiht: der Laufende kommt zuletzt
    // herein. Stuende er in der Ausgabe trotzdem vorn, weil er zufaellig der aelteste
    // Eintrag ist, pruefte der Test nichts.
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    const laeuft = auftrag("l1", "laeuft");
    q1.fuegeAnsEndeAn(laeuft);
    q2Stand([
      auftrag("f-alt", "fehlgeschlagen", "2026-08-01T08:00:00.000Z"),
      auftrag("f-neu", "fehlgeschlagen", "2026-08-12T08:00:00.000Z"),
    ]);

    const liste = wert(await holeStand());

    expect(ids(liste)).toEqual(["l1", "a1", "a2", "f-neu", "f-alt"]);
    expect(liste.filter((a) => a.status === "laeuft")).toHaveLength(1);
    expect(liste[0]).toBe(laeuft);
  });

  it("entscheidet bei gleichem erstelltAm nach auftragId und bleibt bei Wiederholung gleich", async () => {
    const { holeStand } = await frisch();
    const gleich = "2026-08-12T08:00:00.000Z";
    q2Stand([
      auftrag("f-c", "fehlgeschlagen", gleich),
      auftrag("f-a", "fehlgeschlagen", gleich),
      auftrag("f-b", "fehlgeschlagen", gleich),
    ]);

    const erster = ids(wert(await holeStand()));
    const zweiter = ids(wert(await holeStand()));

    expect(erster).toEqual(["f-a", "f-b", "f-c"]);
    expect(zweiter).toEqual(erster);
  });

  it("uebernimmt alle Fehlschlaege ohne Kappung", async () => {
    const { holeStand } = await frisch();
    const viele = Array.from({ length: 150 }, (_, i) =>
      auftrag(`f${String(i).padStart(3, "0")}`, "fehlgeschlagen", "2026-08-12T08:00:00.000Z"),
    );
    q2Stand(viele);

    expect(wert(await holeStand())).toHaveLength(150);
  });

  it("laesst pendingDeletions draussen", async () => {
    const { holeStand } = await frisch();
    q2Stand(
      [auftrag("f1", "fehlgeschlagen")],
      [{ dateiname: "abc.mp4", vermerktAm: "2026-08-12T08:00:00.000Z" }],
    );

    expect(ids(wert(await holeStand()))).toEqual(["f1"]);
  });

  it("gibt die Auftraege selbst heraus, ohne den internen Q1-Datensatz", async () => {
    const { q1, holeStand } = await frisch();
    const eingereiht = auftrag("a1");
    q1.fuegeAnsEndeAn(eingereiht);

    const liste = wert(await holeStand());

    // Dieselbe Objektreferenz: Der Fortschritt eines laufenden Auftrags wird am
    // lebenden Objekt fortgeschrieben, eine Kopie waere im Panel veraltet.
    expect(liste[0]).toBe(eingereiht);
    expect(liste[0]).not.toHaveProperty("begonnenAm");
    expect(liste[0]).not.toHaveProperty("auftrag");
  });

  it("veraendert Q1 und Q2 auch nach mehreren Aufrufen nicht", async () => {
    const { q1, holeStand } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    q2Stand([
      auftrag("f-alt", "fehlgeschlagen", "2026-08-01T08:00:00.000Z"),
      auftrag("f-neu", "fehlgeschlagen", "2026-08-12T08:00:00.000Z"),
    ]);
    const q1Vorher = structuredClone(q1.alleQ1());
    const q2Vorher = structuredClone(q2.stand);

    await holeStand();
    await holeStand();

    expect(q1.alleQ1()).toEqual(q1Vorher);
    expect(q2.stand).toEqual(q2Vorher);
  });
});
