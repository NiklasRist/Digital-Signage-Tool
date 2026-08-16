import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu entferneElement (#42): WAS steht danach in Project.liste, was
// bleibt daneben unangetastet, und wann wird gespeichert.
//
// `planeAutoSpeicherung` (#47) ist gemockt - sonst liefe ein echter 4-Sekunden-Timer
// mit, der am Ende auf die Platte schriebe. Der Halter des aktiven Projekts (#192)
// und das D1-Lock (#32) sind ECHT: Beide sind gebaut, und gerade an ihnen haengt das
// Verhalten, das hier geprueft wird (lebende Referenz, Serialisierung).
const zustand = vi.hoisted(() => ({ geplant: [] as unknown[] }));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.geplant.push(projekt);
  },
}));

import { merkeAktivesProjekt } from "../../src/main/project-store/aktives-projekt";
import { mitD1Lock } from "../../src/main/project-store/d1-lock";
import { entferneElement } from "../../src/main/project-store/entferne-element";

function element(id: string, ref: string): Listenelement {
  return { id, art: "segment", ref, dauer: 10, trimStart: null, trimEnde: null, einblendung: null };
}

const ASSET: Asset = {
  id: "a-fehlt",
  typ: "bild",
  dateiname: "a-fehlt.png",
  originalname: "angebot.png",
  maße: { breite: 1920, höhe: 1080 },
  dauer: null,
  importdatum: "2026-08-12T08:00:00.000Z",
  zustand: "fehlt",
};

const AKTION: Aktion = {
  id: "akt-1",
  titel: "Sommeraktion",
  beschreibung: null,
  preis: null,
  bildRef: "a-fehlt",
  cta: null,
  standardDauer: null,
  vorlagenId: "vollbild",
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
  };
}

beforeEach(() => {
  zustand.geplant = [];
  merkeAktivesProjekt(null);
});

describe("entferneElement (#42)", () => {
  it("streicht den Eintrag und laesst die uebrigen in ihrer Reihenfolge aufruecken", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2"), element("e3", "a3")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElement("e2");

    expect(ergebnis.ok).toBe(true);
    // Die Kennungen in Reihenfolge - nicht nur die Laenge: Ein `delete` statt `splice`
    // liesse ein undefined-Loch stehen, und die Laenge waere trotzdem unauffaellig.
    expect(p.liste.map((e) => e.id)).toEqual(["e1", "e3"]);
  });

  it("laesst Asset und Aktion in der Bibliothek stehen, auch wenn das Medium fehlt", async () => {
    // Genau der Fall aus dem Reparatur-Modus (TK 9.7.5): Das Element zeigt auf eine
    // Aktion, deren Motiv-Asset zustand "fehlt" traegt - entfernt wird trotzdem, und
    // zwar NUR die Zeile.
    const p = projekt([element("e1", "akt-1")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElement("e1");

    expect(ergebnis.ok).toBe(true);
    expect(p.liste).toEqual([]);
    expect(p.assets).toEqual([ASSET]);
    expect(p.aktionen).toEqual([AKTION]);
  });

  it("meldet nicht_gefunden bei unbekannter Kennung und aendert nichts", async () => {
    const p = projekt([element("e1", "a1")]);
    merkeAktivesProjekt(p);
    const vorher = p.geaendertAm;

    const ergebnis = await entferneElement("gibt-es-nicht");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    }
    expect(p.liste.map((e) => e.id)).toEqual(["e1"]);
    expect(p.geaendertAm).toBe(vorher);
    // Nichts geaendert heisst auch: nichts zu speichern.
    expect(zustand.geplant).toEqual([]);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await entferneElement("e1");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("kein_projekt");
    }
    expect(zustand.geplant).toEqual([]);
  });

  it("entfernt bei doppelter Kennung genau EINEN Eintrag", async () => {
    // Kann nur aus einer beschaedigten project.json kommen; die Antwort darauf ist
    // "eine Zeile", nicht "alle" - der Nutzer hat auf eine gezeigt.
    const p = projekt([element("e1", "a1"), element("e1", "a2")]);
    merkeAktivesProjekt(p);

    await entferneElement("e1");

    expect(p.liste).toHaveLength(1);
    expect(p.liste[0]?.ref).toBe("a2");
  });

  it("darf das letzte Element entfernen", async () => {
    const p = projekt([element("e1", "a1")]);
    merkeAktivesProjekt(p);

    const ergebnis = await entferneElement("e1");

    expect(ergebnis.ok).toBe(true);
    expect(p.liste).toEqual([]);
  });

  it("merkt den LEBENDEN Stand zum Speichern vor", async () => {
    const p = projekt([element("e1", "a1"), element("e2", "a2")]);
    merkeAktivesProjekt(p);

    await entferneElement("e1");

    // toBe, nicht toEqual: Eine Kopie hielte den Stand von jetzt fest und verloere
    // alles, was der Nutzer waehrend der Entprellung noch tut.
    expect(zustand.geplant).toEqual([p]);
    expect(zustand.geplant[0]).toBe(p);
    // `geaendertAm` wird hier NICHT mehr geprueft: Der Stempel entsteht seit dem
    // 12.08.2026 in planeAutoSpeicherung (#47) - dem einen Engpass, durch den jede
    // Aenderung laeuft. Diese Datei mockt jene Funktion und koennte ihn gar nicht
    // beobachten. Geprueft wird er in tests/unit/auto-speichern.spec.ts.
  });

  it("laeuft im D1-Lock - wartet, solange ein fremder Abschnitt es haelt", async () => {
    const p = projekt([element("e1", "a1")]);
    merkeAktivesProjekt(p);

    let freigeben = (): void => {};
    const halter = mitD1Lock(
      () => new Promise<void>((aufloesen) => { freigeben = aufloesen; }),
    );

    const laeuft = entferneElement("e1");
    // Mehrere Microtasks weiter ist die Liste immer noch voll: Der Aufruf steht in der
    // Warteschlange. Ohne Lock waere sie hier bereits leer.
    await Promise.resolve();
    await Promise.resolve();
    expect(p.liste).toHaveLength(1);

    freigeben();
    await halter;
    await laeuft;
    expect(p.liste).toEqual([]);
  });
});
