import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #334. Geprueft wird VERHALTEN: was nach einem Aufruf im Datenmodell steht -
// und vor allem, was auf den Fehlerpfaden NICHT darin steht (alles oder nichts).
//
// Das Auto-Speichern (#47) ist gemockt - dieselbe Begruendung wie in setze-dauer.spec.ts:
// `planeAutoSpeicherung` startet einen echten Timer, der waehrend des Testlaufs eine
// project.json schreiben wuerde; der Mock macht zusaetzlich pruefbar, DASS und WORMIT
// vorgemerkt wird.
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: vi.fn(),
}));

const { planeAutoSpeicherung } = await import("../../src/main/project-store/auto-speichern");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { setzeStandardSegmentdauer } = await import(
  "../../src/main/project-store/setze-standard-segmentdauer"
);
const { DAUER_BEREICH } = await import("../../src/shared/contracts/konstanten");

function aktion(id: string, standardDauer: number | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer,
    vorlagenId: "v1",
    akzentfarbe: null,
  };
}

function projektMit(aktionen: Aktion[], standardSegmentdauer: number): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-13T08:00:00.000Z",
    geaendertAm: "2026-08-13T08:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen,
    liste: [],
    letzterAusgabeName: null,
    standardSegmentdauer,
  };
}

let projekt: Project;

beforeEach(() => {
  projekt = projektMit([aktion("a1", null), aktion("a2", 20), aktion("a3", null)], 10);
  merkeAktivesProjekt(projekt);
  vi.mocked(planeAutoSpeicherung).mockClear();
});

describe("setzeStandardSegmentdauer (#334)", () => {
  it("friert eine abgewaehlte Aktion auf ihrem BISHER wirksamen Wert ein (Gegenprobe der DoD)", async () => {
    // Der bindende Fall: a1 hat standardDauer null und lief bislang auf dem ALTEN Standard 10.
    // Der Einfrier-Wert wird VOR dem Setzen des neuen Standards gelesen - danach muss a1 auf
    // 10 stehen, NICHT auf dem neuen Wert.
    const ergebnis = await setzeStandardSegmentdauer(30, ["a1"]);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.standardSegmentdauer).toBe(30);
    expect(projekt.aktionen[0]?.standardDauer).toBe(10);
  });

  it("laesst bereits eingefrorene Aktionen ihren Wert behalten", async () => {
    const ergebnis = await setzeStandardSegmentdauer(30, ["a2"]);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.aktionen[1]?.standardDauer).toBe(20);
  });

  it("nimmt mehrere Aktionen in EINEM Zug und liefert das mutierte Projekt zurueck", async () => {
    const ergebnis = await setzeStandardSegmentdauer(DAUER_BEREICH.max, ["a1", "a2"]);

    expect(ergebnis.ok).toBe(true);
    // toBe, nicht toEqual: Zurueck kommt der LEBENDE Stand, nicht eine Kopie.
    expect(ergebnis.ok && ergebnis.wert).toBe(projekt);
    expect(projekt.standardSegmentdauer).toBe(DAUER_BEREICH.max);
    expect(projekt.aktionen[0]?.standardDauer).toBe(10);
    expect(projekt.aktionen[1]?.standardDauer).toBe(20);
  });

  it("akzeptiert Doppel-Eintraege idempotent", async () => {
    const ergebnis = await setzeStandardSegmentdauer(15, ["a1", "a1"]);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.aktionen[0]?.standardDauer).toBe(10);
  });

  it("akzeptiert die leere Liste - nur der Standard aendert sich", async () => {
    const ergebnis = await setzeStandardSegmentdauer(25, []);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.standardSegmentdauer).toBe(25);
    expect(projekt.aktionen.every((a) => a.standardDauer === null || a.standardDauer === 20)).toBe(
      true,
    );
  });

  it("merkt das lebende Projekt GENAU EINMAL fuer die Auto-Speicherung vor", async () => {
    await setzeStandardSegmentdauer(12, ["a1"]);

    expect(planeAutoSpeicherung).toHaveBeenCalledTimes(1);
    expect(vi.mocked(planeAutoSpeicherung).mock.calls[0]?.[0]).toBe(projekt);
  });

  it("weist einen Wert unterhalb des Bereichs ab, ohne IRGENDETWAS zu aendern", async () => {
    const vorher = JSON.stringify(projekt);

    const ergebnis = await setzeStandardSegmentdauer(DAUER_BEREICH.min - 0.001, ["a1"]);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    // bytegleich zum Ausgangszustand - auch der Standard wurde nicht gesetzt.
    expect(JSON.stringify(projekt)).toBe(vorher);
    expect(planeAutoSpeicherung).not.toHaveBeenCalled();
  });

  it("weist NaN ab - die reine Bereichsprobe liesse es durch", async () => {
    const ergebnis = await setzeStandardSegmentdauer(Number.NaN, []);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.standardSegmentdauer).toBe(10);
  });

  it("weist eine unbekannte Aktions-ID ab, ohne auch nur den Standard zu setzen", async () => {
    const vorher = JSON.stringify(projekt);

    const ergebnis = await setzeStandardSegmentdauer(30, ["a1", "gibtsnicht"]);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    // Reihenfolge der Pruefungen: Die Kennungen werden ALLE geprueft, BEVOR etwas geschrieben
    // wird - a1 ist bekannt, aber auch sein Einfrieren ist unterblieben.
    expect(JSON.stringify(projekt)).toBe(vorher);
    expect(planeAutoSpeicherung).not.toHaveBeenCalled();
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    merkeAktivesProjekt(null);

    const ergebnis = await setzeStandardSegmentdauer(30, []);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "kein_projekt" } });
    expect(planeAutoSpeicherung).not.toHaveBeenCalled();
  });
});
