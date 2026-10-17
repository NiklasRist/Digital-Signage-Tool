import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Unit-Test zu #426: die chirurgische Kaskade von `löscheAktion` um den DRITTEN
// Referenztyp erweitert - `unterbrechungen[].aktionRef` (TK 9.5.3). Gemockt ist nur das
// Auto-Speichern (#47); das D1-Lock laeuft echt mit.
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: () => {},
}));

const { löscheAktion } = await import("../../src/main/project-store/loesche-aktion");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");

function aktion(id: string): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: "split",
    markeId: "marke-test",
    akzentfarbe: null,
  };
}

function video(unterbrechungen?: Listenelement["unterbrechungen"]): Listenelement {
  return {
    id: "e-video",
    art: "video",
    ref: "a-video",
    dauer: null,
    trimStart: 0,
    trimEnde: 20,
    einblendung: null,
    unterbrechungen,
  };
}

function projektMit(liste: Listenelement[], aktionen: Aktion[]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen,
    liste,
    letzterAusgabeName: null,
    standardMarkeId: "marke-test",
    standardSegmentdauer: 10,
  };
}

beforeEach(() => {
  merkeAktivesProjekt(null);
});

describe("löscheAktion - Kaskade für Unterbrechungen (#426)", () => {
  it("entfernt nur den betroffenen Einschub; das Videoelement bleibt", async () => {
    const element = video([
      { zeitstelle: 2, aktionRef: "ak-1", dauer: 5 },
      { zeitstelle: 8, aktionRef: "ak-2", dauer: 5 },
    ]);
    const projekt = projektMit([element], [aktion("ak-1"), aktion("ak-2")]);
    merkeAktivesProjekt(projekt);

    const ergebnis = await löscheAktion("ak-1");

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([{ zeitstelle: 8, aktionRef: "ak-2", dauer: 5 }]);
    expect(projekt.liste).toEqual([element]);
    expect(ergebnis.ok && ergebnis.wert.entfernteElementIds).toEqual([]);
    expect(ergebnis.ok && ergebnis.wert.geaenderteElementIds).toEqual(["e-video"]);
  });

  it("laesst ein leeres unterbrechungen-Array zurueck, wenn der letzte Einschub faellt", async () => {
    const element = video([{ zeitstelle: 2, aktionRef: "ak-1", dauer: 5 }]);
    merkeAktivesProjekt(projektMit([element], [aktion("ak-1")]));

    const ergebnis = await löscheAktion("ak-1");

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([]);
  });

  it("meldet ein Element mit Band UND Einschub nur EINMAL (kein Duplikat)", async () => {
    const element: Listenelement = {
      ...video([{ zeitstelle: 2, aktionRef: "ak-1", dauer: 5 }]),
      einblendung: { bandVorlageId: "band-standard", abschnitte: [{ aktionRef: "ak-1", dauer: 5 }] },
    };
    merkeAktivesProjekt(projektMit([element], [aktion("ak-1")]));

    const ergebnis = await löscheAktion("ak-1");

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([]);
    expect(element.einblendung).toBeNull();
    expect(ergebnis.ok && ergebnis.wert.geaenderteElementIds).toEqual(["e-video"]);
  });

  it("laesst ein Video ohne Bezug unberuehrt und ungemeldet", async () => {
    const element = video([{ zeitstelle: 2, aktionRef: "ak-2", dauer: 5 }]);
    merkeAktivesProjekt(projektMit([element], [aktion("ak-1"), aktion("ak-2")]));

    const ergebnis = await löscheAktion("ak-1");

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([{ zeitstelle: 2, aktionRef: "ak-2", dauer: 5 }]);
    expect(ergebnis.ok && ergebnis.wert.geaenderteElementIds).toEqual([]);
  });
});
