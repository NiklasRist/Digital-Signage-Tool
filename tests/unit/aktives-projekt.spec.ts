import { beforeEach, describe, expect, it } from "vitest";

import {
  holeAktivesProjekt,
  merkeAktivesProjekt,
} from "../../src/main/project-store/aktives-projekt";
import type { Project } from "../../src/shared/contracts/project";

const PROJEKT: Project = {
  id: "p1",
  name: "Studio Nord",
  erstelltAm: "2026-08-12T08:00:00.000Z",
  geaendertAm: "2026-08-12T08:00:00.000Z",
  schemaVersion: 1,
  assets: [],
  aktionen: [],
  liste: [],
  letzterAusgabeName: null,
};

describe("Halter des aktiven Projekts (#192)", () => {
  beforeEach(() => {
    merkeAktivesProjekt(null);
  });

  it("gibt DIESELBE Referenz heraus, keine Kopie", () => {
    // toBe, nicht toEqual: Eine Kopie bestuende den Inhaltsvergleich und waere trotzdem
    // falsch - sie waere die zweite Wahrheit, und ein Flush schriebe womoeglich einen
    // veralteten Stand.
    merkeAktivesProjekt(PROJEKT);
    expect(holeAktivesProjekt()).toBe(PROJEKT);
  });

  it("gibt Mutationen am lebenden Stand weiter", () => {
    merkeAktivesProjekt(PROJEKT);
    const gehalten = holeAktivesProjekt();
    PROJEKT.name = "Studio Sued";
    expect(gehalten?.name).toBe("Studio Sued");
    PROJEKT.name = "Studio Nord";
  });

  it("kennt den Zustand 'kein Projekt geoeffnet'", () => {
    merkeAktivesProjekt(PROJEKT);
    merkeAktivesProjekt(null);
    expect(holeAktivesProjekt()).toBeNull();
  });
});
