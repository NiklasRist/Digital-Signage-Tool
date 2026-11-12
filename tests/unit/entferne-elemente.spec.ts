// Verhaltenstests zu #392 - `entferneElemente` (project-store).
//
// Die Operation ist die EINE Store-Mutation hinter dem Gruppen-Entfernen der
// Mehrfachauswahl. Geprueft wird: alles oder nichts, eine Reihenfolge ohne Loch,
// EIN Speichervorgang, Assets/Aktionen bleiben stehen. Das D1-Lock ist echt, nur
// `planeAutoSpeicherung` ist gemockt (sonst liefe ein echter 4-Sekunden-Timer mit).
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

const zustand = vi.hoisted(() => ({ geplant: [] as unknown[] }));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.geplant.push(projekt);
  },
}));

import { merkeAktivesProjekt } from "../../src/main/project-store/aktives-projekt";
import { entferneElemente } from "../../src/main/project-store/entferne-elemente";

function element(id: string, ref: string): Listenelement {
  return { id, art: "segment", ref, dauer: 10, trimStart: null, trimEnde: null, einblendung: null };
}

const ASSET: Asset = {
  id: "a-1",
  typ: "bild",
  dateiname: "a-1.png",
  originalname: "angebot.png",
  maße: { breite: 1920, höhe: 1080 },
  dauer: null,
  importdatum: "2026-08-12T08:00:00.000Z",
  zustand: "ok",
  herkunft: { art: 'manuell' },
};

const AKTION: Aktion = {
  id: "akt-1",
  titel: "Sommeraktion",
  beschreibung: null,
  preis: null,
  bildRef: "a-1",
  cta: null,
  standardDauer: null,
  vorlagenId: "vollbild",
  markeId: "marke-test",
  akzentfarbe: null,
};

function projekt(liste: Listenelement[]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [ASSET],
    aktionen: [AKTION],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: "marke-test",
    standardSegmentdauer: 10,
  };
}

beforeEach(() => {
  zustand.geplant = [];
  merkeAktivesProjekt(null);
});

describe("entferneElemente (#392)", () => {
  it("entfernt mehrere Eintraege, die uebrigen ruecken in ihrer Reihenfolge auf", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2"), element("e3", "a3"), element("e4", "a4")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElemente(["e2", "e4"]);

    expect(ergebnis.ok).toBe(true);
    expect(p.liste.map((e) => e.id)).toEqual(["e1", "e3"]);
  });

  it("plant GENAU EINEN Speichervorgang - das ist der Zweck der Operation", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2"), element("e3", "a3")]);
    merkeAktivesProjekt(p);

    await entferneElemente(["e1", "e3"]);

    expect(zustand.geplant).toHaveLength(1);
    // Uebergeben wird das LEBENDE Projekt (dieselbe Referenz), nicht eine Kopie.
    expect(zustand.geplant[0]).toBe(p);
  });

  it("laesst Assets und Aktionen stehen (TK 9.5.3)", async () => {
    const p = projekt([element("e1", "akt-1"), element("e2", "a2")]);
    merkeAktivesProjekt(p);

    await entferneElemente(["e1", "e2"]);

    expect(p.liste).toEqual([]);
    expect(p.assets).toEqual([ASSET]);
    expect(p.aktionen).toEqual([AKTION]);
  });

  it("alles oder nichts: eine unbekannte Kennung entfernt NICHTS und speichert nicht", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElemente(["e1", "gibt-es-nicht"]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("nicht_gefunden");
      expect(ergebnis.fehler.meldung).toContain("gibt-es-nicht");
    }
    expect(p.liste.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(zustand.geplant).toEqual([]);
  });

  it("meldet kein_projekt, wenn keines geoeffnet ist", async () => {
    const ergebnis = await entferneElemente(["e1"]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("kein_projekt");
    }
    expect(zustand.geplant).toEqual([]);
  });

  it("weist eine leere Liste von Kennungen ab, ohne zu speichern", async () => {
    const p = projekt([element("e1", "a1")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElemente([]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(p.liste.map((e) => e.id)).toEqual(["e1"]);
    expect(zustand.geplant).toEqual([]);
  });

  it("entfernt bei doppelter Kennung im Aufruf genau den einen Eintrag", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2")]);
    merkeAktivesProjekt(p);

    await entferneElemente(["e1", "e1"]);

    expect(p.liste.map((e) => e.id)).toEqual(["e2"]);
  });

  it("darf die ganze Liste leeren", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElemente(["e1", "e2"]);

    expect(ergebnis.ok).toBe(true);
    expect(p.liste).toEqual([]);
  });
});
