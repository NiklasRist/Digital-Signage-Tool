import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Listenelement, Project, Unterbrechung } from "../../src/shared/contracts/project";

// Unit-Test zu #426 (Modell + Store, TK v3.26 / 9.5.2). Geprueft wird VERHALTEN am lebenden
// Datenmodell. Gemockt ist allein das Auto-Speichern (#47) - es startet sonst einen
// Entprellungstimer, der spaeter echte Dateien anfasst. Das D1-Lock (#32) laeuft echt mit.
const angemeldet: Project[] = [];

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    angemeldet.push(projekt);
  },
}));

const { setzeUnterbrechungen } = await import("../../src/main/project-store/setze-unterbrechungen");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");

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

/** Der Ausschnitt ist [1,5, 9,25) -> die gespielte Videodauer ist 7,75 s. */
function video(unterbrechungen?: Unterbrechung[]): Listenelement {
  return {
    id: "e-video",
    art: "video",
    ref: "a-video",
    dauer: null,
    trimStart: 1.5,
    trimEnde: 9.25,
    einblendung: null,
    unterbrechungen,
  };
}

function standbild(): Listenelement {
  return {
    id: "e-segment",
    art: "segment",
    ref: "ak-1",
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
    unterbrechungen: [],
  };
}

function projektMit(liste: Listenelement[], aktionen: Aktion[] = [aktion("ak-1"), aktion("ak-2")]): Project {
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
  angemeldet.length = 0;
  merkeAktivesProjekt(null);
});

describe("setzeUnterbrechungen (#426)", () => {
  it("uebernimmt die Einschuebe vollstaendig und in exakt der uebergebenen Reihenfolge", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", [
      { zeitstelle: 1, aktionRef: "ak-2", dauer: 5 },
      { zeitstelle: 4, aktionRef: "ak-1", dauer: 3 },
    ]);

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([
      { zeitstelle: 1, aktionRef: "ak-2", dauer: 5 },
      { zeitstelle: 4, aktionRef: "ak-1", dauer: 3 },
    ]);
    // Zurueck geht der LEBENDE Eintrag, keine Kopie.
    expect(ergebnis.ok && ergebnis.wert).toBe(element);
    expect(angemeldet).toHaveLength(1);
  });

  it("laesst dauer, trimStart, trimEnde und die Einblendung unangetastet", async () => {
    const element = video();
    const band = { bandVorlageId: "band-standard", abschnitte: [{ aktionRef: "ak-1", dauer: 5 }] };
    element.einblendung = band;
    const vorher = { dauer: element.dauer, trimStart: element.trimStart, trimEnde: element.trimEnde };
    merkeAktivesProjekt(projektMit([element]));

    await setzeUnterbrechungen("e-video", [{ zeitstelle: 2, aktionRef: "ak-1", dauer: 4 }]);

    expect({ dauer: element.dauer, trimStart: element.trimStart, trimEnde: element.trimEnde }).toEqual(vorher);
    expect(element.einblendung).toBe(band);
  });

  it("speichert Zeitstelle und Dauer ROH, ohne Rundung auf das Ausgaberaster", async () => {
    // 4,71 s liegt NICHT auf dem 30-fps-Raster; gerundet wird nur im render-service (9.2.6).
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    await setzeUnterbrechungen("e-video", [{ zeitstelle: 2.37, aktionRef: "ak-1", dauer: 4.71 }]);

    expect(element.unterbrechungen?.[0]?.zeitstelle).toBe(2.37);
    expect(element.unterbrechungen?.[0]?.dauer).toBe(4.71);
  });

  it("baut die Eintraege neu und uebernimmt kein mitgeschicktes Fremdfeld", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));
    const hereingereicht = [{ zeitstelle: 3, aktionRef: "ak-1", dauer: 5, position: 9 }] as unknown as Unterbrechung[];

    await setzeUnterbrechungen("e-video", hereingereicht);

    expect(element.unterbrechungen?.[0]).not.toBe(hereingereicht[0]);
    expect(Object.keys(element.unterbrechungen?.[0] ?? {})).toEqual(["zeitstelle", "aktionRef", "dauer"]);
  });

  it("nimmt ein leeres Array an (alle Unterbrechungen entfernt) - das Videoelement bleibt", async () => {
    const element = video([{ zeitstelle: 1, aktionRef: "ak-1", dauer: 5 }]);
    const projekt = projektMit([element]);
    merkeAktivesProjekt(projekt);

    const ergebnis = await setzeUnterbrechungen("e-video", []);

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen).toEqual([]);
    expect(projekt.liste).toEqual([element]);
  });

  it("weist ein segment-Element ab", async () => {
    const element = standbild();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-segment", [{ zeitstelle: 1, aktionRef: "ak-1", dauer: 5 }]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.unterbrechungen).toEqual([]);
  });

  it("uebernimmt NICHTS, wenn erst der LETZTE Eintrag eine unbekannte Aktion nennt", async () => {
    const vorheriges: Unterbrechung[] = [{ zeitstelle: 1, aktionRef: "ak-1", dauer: 5 }];
    const element = video([...vorheriges]);
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", [
      { zeitstelle: 1, aktionRef: "ak-1", dauer: 4 },
      { zeitstelle: 4, aktionRef: "ak-weg", dauer: 4 },
    ]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(element.unterbrechungen).toEqual(vorheriges);
    expect(angemeldet).toHaveLength(0);
  });

  it.each([
    ["0 (Rand, nicht enthalten)", 0],
    ["genau das Videoende", 7.75],
    ["dahinter", 8],
    ["negativ", -1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["Zeichenkette", "2"],
  ])("weist eine unzulaessige Zeitstelle ab: %s", async (_name, zeitstelle) => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", [
      { zeitstelle, aktionRef: "ak-1", dauer: 5 },
    ] as unknown as Unterbrechung[]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.unterbrechungen).toBeUndefined();
    expect(angemeldet).toHaveLength(0);
  });

  it.each([
    ["null Sekunden", 0],
    ["negativ", -1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["Zeichenkette", "5"],
  ])("weist eine unzulaessige Dauer ab: %s", async (_name, dauer) => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", [
      { zeitstelle: 2, aktionRef: "ak-1", dauer },
    ] as unknown as Unterbrechung[]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.unterbrechungen).toBeUndefined();
  });

  it("weist nicht aufsteigende oder doppelte Zeitstellen ab", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", [
      { zeitstelle: 4, aktionRef: "ak-1", dauer: 3 },
      { zeitstelle: 2, aktionRef: "ak-2", dauer: 3 },
    ]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it.each([
    ["kein Array", "ak-1"],
    ["Eintrag ist eine Zeichenkette", ["ak-1"]],
    ["Eintrag ohne aktionRef", [{ zeitstelle: 2, dauer: 5 }]],
    ["leerer aktionRef", [{ zeitstelle: 2, aktionRef: "  ", dauer: 5 }]],
  ])("weist eine kaputte Struktur ab: %s", async (_name, nutzlast) => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeUnterbrechungen("e-video", nutzlast as unknown as Unterbrechung[]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(angemeldet).toHaveLength(0);
  });

  it("weist eine unbekannte elementId ab", async () => {
    merkeAktivesProjekt(projektMit([video()]));

    const ergebnis = await setzeUnterbrechungen("gibt-es-nicht", [{ zeitstelle: 2, aktionRef: "ak-1", dauer: 5 }]);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(angemeldet).toHaveLength(0);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await setzeUnterbrechungen("e-video", []);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("kein_projekt");
  });

  it("prueft den ZUSTAND der referenzierten Aktion nicht (Reparaturfall, 9.7.5)", async () => {
    const kaputt: Aktion = { ...aktion("ak-kaputt"), bildRef: "a-weg" };
    const element = video();
    merkeAktivesProjekt(projektMit([element], [kaputt]));

    const ergebnis = await setzeUnterbrechungen("e-video", [{ zeitstelle: 2, aktionRef: "ak-kaputt", dauer: 5 }]);

    expect(ergebnis.ok).toBe(true);
    expect(element.unterbrechungen?.[0]?.aktionRef).toBe("ak-kaputt");
  });

  it("wartet auf das D1-Lock, statt in einen laufenden Schreibvorgang hineinzuschreiben", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    let freigeben: () => void = () => {};
    const belegt = mitD1Lock(() => new Promise<void>((aufloesen) => { freigeben = aufloesen; }));

    const laeuft = setzeUnterbrechungen("e-video", [{ zeitstelle: 2, aktionRef: "ak-1", dauer: 5 }]);
    await Promise.resolve();
    await Promise.resolve();
    expect(element.unterbrechungen).toBeUndefined();

    freigeben();
    await belegt;
    await laeuft;
    expect(element.unterbrechungen).toHaveLength(1);
  });
});
