import { describe, expect, it } from "vitest";

import type { Project } from "../../src/shared/contracts/project";
import type { Aktion } from "../../src/shared/contracts/aktion";
import { migriereProjektAufMarke } from "../../src/main/marken-store/migration";

// Unit-Test zu #281: reine Funktion, kein I/O. Jede Pruefung nennt ihren DoD-Punkt.

const EINGEBAUT = "eingebaut-id-1";

function projekt(ueber: Record<string, unknown> = {}): Project {
  return {
    id: "p-1",
    name: "Projekt",
    erstelltAm: "jetzt",
    geaendertAm: "jetzt",
    schemaVersion: 1,
    aktionen: [],
    medien: [],
    ausgaben: [],
    ...(ueber as object),
  } as unknown as Project;
}

function aktion(id: string, markeId?: string): Aktion {
  return {
    id,
    name: "Aktion " + id,
    defaultDauer: 10,
    elements: [],
    ...(markeId === undefined ? {} : { markeId }),
  } as unknown as Aktion;
}

describe("migriereProjektAufMarke (#281)", () => {
  it("leer project: alle DREI Stellen (standardMarkeId + Zwei aktionen) tragen die eingebaut id; geaendert true", () => {
    const original = projekt({ aktionen: [aktion("a-1"), aktion("a-2")] });

    const erg = migriereProjektAufMarke(original, EINGEBAUT);

    expect(erg.geaendert).toBe(true);
    expect(erg.project.standardMarkeId).toBe(EINGEBAUT);
    expect((erg.project.aktionen[0] as unknown as { markeId: string }).markeId).toBe(EINGEBAUT);
    expect((erg.project.aktionen[1] as unknown as { markeId: string }).markeId).toBe(EINGEBAUT);
  });

  it("ein bereits GESETZTES standardMarkeId (fremde ID) bleibt unangetastet", () => {
    const original = projekt({ standardMarkeId: "fremde-marke" });

    const erg = migriereProjektAufMarke(original, EINGEBAUT);

    expect(erg.project.standardMarkeId).toBe("fremde-marke");
    if (erg.project.aktionen.length === 0) expect(erg.geaendert).toBe(false);
  });

  it("eine der drei aktionen traeGT bereits markeId - NUR die anderen zwei werden ergaenzt", () => {
    const original = projekt({ aktionen: [aktion("a-1", "eigene-marke"), aktion("a-2"), aktion("a-3")] });

    const erg = migriereProjektAufMarke(original, EINGEBAUT);

    expect((erg.project.aktionen[0] as unknown as { markeId: string }).markeId).toBe("eigene-marke");
    expect((erg.project.aktionen[1] as unknown as { markeId: string }).markeId).toBe(EINGEBAUT);
    expect((erg.project.aktionen[2] as unknown as { markeId: string }).markeId).toBe(EINGEBAUT);
    expect(erg.geaendert).toBe(true);
  });

  it("bereits vollstaendig migriert: geaendert false, deep-gleich zum Original", () => {
    const original = projekt({
      standardMarkeId: EINGEBAUT,
      aktionen: [aktion("a-1", EINGEBAUT), aktion("a-2", EINGEBAUT)],
    });

    const erg = migriereProjektAufMarke(original, EINGEBAUT);

    expect(erg.geaendert).toBe(false);
    expect(erg.project).toEqual(original);
  });

  it("das ARGUMENT bleibt UNVERAENDERT (Referenz und Inhalt)", () => {
    const original = projekt({ aktionen: [aktion("a-1")] });
    const vorher = structuredClone(original);

    const erg = migriereProjektAufMarke(original, EINGEBAUT);

    expect(original).toEqual(vorher);
    expect(original.aktionen[0]).not.toBe(erg.project.aktionen[0]);
    expect(erg.project).not.toBe(original);
  });

  it("zweifacher Aufruf: Idempotenz (zweiter Lauf geaendert false, deep-gleich zum ersten Ergebnis)", () => {
    const original = projekt({ aktionen: [aktion("a-1")] });

    const erste = migriereProjektAufMarke(original, EINGEBAUT);
    const zweite = migriereProjektAufMarke(erste.project, EINGEBAUT);

    expect(zweite.geaendert).toBe(false);
    expect(zweite.project).toEqual(erste.project);
  });
});
