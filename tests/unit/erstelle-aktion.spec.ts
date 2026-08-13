import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #38. Geprueft wird VERHALTEN, nicht die Deklaration.
//
// Das Auto-Speichern (#47) ist gemockt - aus zwei Gruenden: Es ist der einzige
// beobachtbare Nachweis dafuer, dass die Instant-Operation das Speichern anstoesst
// (auf der Platte passiert an dieser Stelle absichtlich nichts), und der echte Modul
// zoege ueber schreibeProjekt den Datenort und damit `electron` herein, das es im
// Testlauf nicht gibt.
const geplant: Project[] = [];
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    geplant.push(projekt);
  },
}));

const { erstelleAktion } = await import("../../src/main/project-store/erstelle-aktion");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");

function projekt(): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-13T08:00:00.000Z",
    geaendertAm: "2026-08-13T08:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  };
}

/** Ein vollstaendiger Entwurf - die Tests aendern davon jeweils nur, worum es geht. */
function entwurf(aenderungen: Partial<Omit<Aktion, "id">> = {}): Omit<Aktion, "id"> {
  return {
    titel: "Sommeraktion",
    beschreibung: null,
    preis: "19,90 EUR",
    bildRef: null,
    cta: null,
    standardDauer: 15,
    vorlagenId: "vollbild",
    akzentfarbe: null,
    ...aenderungen,
  };
}

let offen: Project;

beforeEach(() => {
  geplant.length = 0;
  offen = projekt();
  merkeAktivesProjekt(offen);
});

describe("erstelleAktion (#38)", () => {
  it("haengt die Aktion mit eigener ID an die Bibliothek und merkt sie zum Speichern vor", async () => {
    const ergebnis = await erstelleAktion(entwurf());

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.id.length).toBeGreaterThan(0);
    expect(ergebnis.wert.titel).toBe("Sommeraktion");
    // toBe, nicht toEqual: Die zurueckgegebene Aktion IST der Eintrag der Bibliothek -
    // eine Kopie bestuende den Inhaltsvergleich und waere trotzdem die zweite Wahrheit.
    expect(offen.aktionen.length).toBe(1);
    expect(offen.aktionen[0]).toBe(ergebnis.wert);
    // "Ihr Erfolg bedeutet 'gueltig uebernommen', nicht 'schon auf Platte'" (TK 9.5.4) -
    // nachgewiesen wird deshalb das Vormerken, nicht ein Schreibvorgang. Und vorgemerkt
    // wird der LEBENDE Stand (#192), nicht eine Momentaufnahme.
    expect(geplant.length).toBe(1);
    expect(geplant[0]).toBe(offen);
  });

  it("weist einen leeren Titel ab, ohne die Bibliothek zu veraendern", async () => {
    const ergebnis = await erstelleAktion(entwurf({ titel: "   " }));

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(offen.aktionen).toEqual([]);
    expect(geplant).toEqual([]);
  });

  it("weist eine fehlende vorlagenId ab", async () => {
    const ergebnis = await erstelleAktion(entwurf({ vorlagenId: "" }));

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(offen.aktionen).toEqual([]);
  });

  it("speichert den Titel ohne Randleerzeichen", async () => {
    const ergebnis = await erstelleAktion(entwurf({ titel: "  Sommeraktion  " }));

    expect(ergebnis.ok && ergebnis.wert.titel).toBe("Sommeraktion");
  });

  it("gibt jeder Aktion eine eigene ID und haengt sie hinten an", async () => {
    const eins = await erstelleAktion(entwurf({ titel: "Erste" }));
    const zwei = await erstelleAktion(entwurf({ titel: "Zweite" }));

    expect(eins.ok && zwei.ok).toBe(true);
    if (!eins.ok || !zwei.ok) return;
    expect(eins.wert.id).not.toBe(zwei.wert.id);
    expect(offen.aktionen.map((a) => a.titel)).toEqual(["Erste", "Zweite"]);
  });

  it("macht aus fehlenden Feldern null statt undefined", async () => {
    // So kommt ein Entwurf ueber IPC an, dem der Renderer ein Feld nicht mitgegeben hat.
    // Bliebe `undefined` stehen, liesse JSON.stringify den Schluessel beim Speichern weg.
    const luecke = entwurf();
    delete (luecke as Partial<Omit<Aktion, "id">>).cta;

    const ergebnis = await erstelleAktion(luecke);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.cta).toBeNull();
    expect(JSON.parse(JSON.stringify(ergebnis.wert))).toHaveProperty("cta", null);
  });

  it("uebernimmt keine fremden Felder in den gespeicherten Datensatz", async () => {
    const mitBallast = { ...entwurf(), heimlich: "aus dem Renderer" };

    const ergebnis = await erstelleAktion(mitBallast);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert).not.toHaveProperty("heimlich");
  });

  it("meldet nicht_gefunden, wenn kein Projekt geoeffnet ist", async () => {
    merkeAktivesProjekt(null);

    const ergebnis = await erstelleAktion(entwurf());

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(geplant).toEqual([]);
  });

  it("laeuft innerhalb des D1-Locks", async () => {
    let freigeben: () => void = () => undefined;
    const gehalten = mitD1Lock(() => new Promise<void>((auf) => (freigeben = auf)));

    const lauf = erstelleAktion(entwurf());
    await new Promise((weiter) => setTimeout(weiter, 20));
    // Solange ein fremder Abschnitt das Lock haelt, darf D1 unberuehrt bleiben.
    expect(offen.aktionen).toEqual([]);

    freigeben();
    await gehalten;
    expect((await lauf).ok).toBe(true);
    expect(offen.aktionen.length).toBe(1);
  });
});
