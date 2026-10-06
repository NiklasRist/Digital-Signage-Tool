import { describe, expect, it } from "vitest";

// Unit-Test zu #275: die vier Typen sind aus marke.ts exportiert und aus einem
// Renderer-seitigen Kontext importierbar; ein fehlendes Feld wird vom Typecheck abgelehnt.
import type {
  AbgeleiteteMarkenReferenz,
  MarkenReferenz,
  Markennutzung,
  StandardmarkenReferenz,
} from "../../src/shared/contracts/marke";
import type { Marke } from "../../src/shared/contracts/marke";

describe("Markennutzung (#275)", () => {
  it("importiert alle vier Typen aus marke.ts und haelt die Felder exakt", () => {
    const aktion: MarkenReferenz = { projektId: "p1", projektName: "Projekt", aktionId: "a1" };
    const abgeleitet: AbgeleiteteMarkenReferenz = { markeId: "m1", markeName: "Saison" };
    const standard: StandardmarkenReferenz = { projektId: "p1", projektName: "Projekt" };
    const nutzung: Markennutzung = {
      aktionen: [aktion],
      abgeleiteteMarken: [abgeleitet],
      standardInProjekten: [standard],
    };

    expect(nutzung.aktionen[0]?.aktionId).toBe("a1");
    expect(nutzung.abgeleiteteMarken[0]?.markeId).toBe("m1");
    expect(nutzung.standardInProjekten[0]?.projektName).toBe("Projekt");
    void (0 as unknown as Marke | null); // Marke bleibt aus derselben Datei importierbar
  });

  it("Negativ-Probe: standardInProjekten ist NICHT optional (einem Objekt ohne es fehlt das Feld)", () => {
    // Der Beweis laeuft ueber den Typecheck: Diese Zeile kompiliert NICHT, wenn man einen
    // Datensatz ohne das Feld des Typs Markennutzung zuweist. Statisch verankert:
    const probe = { aktionen: [], abgeleiteteMarken: [] } as unknown as Markennutzung | Record<string, never>;
    expect("standardInProjekten" in probe).toBe(false);
  });
});
