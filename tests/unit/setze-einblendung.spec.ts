import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Einblendung, Listenelement, Project } from "../../src/shared/contracts/project";

// Unit-Test zu #120. Geprueft wird VERHALTEN am lebenden Datenmodell, nicht die Deklaration.
//
// Gemockt ist allein das Auto-Speichern (#47): Der echte `planeAutoSpeicherung` startet einen
// Entprellungstimer, der spaeter `schreibeProjekt` ruft - der Test fasste also nach seinem Ende
// echte Dateien an. Der Mock haelt zugleich fest, OB und MIT WELCHEM Stand vorgemerkt wurde;
// ohne diese Anmeldung waere das gesetzte Band nach dem naechsten Programmstart weg.
// Das D1-Lock (#32) laeuft ECHT mit - es ist Teil der Zusage dieser Operation und braucht kein
// Dateisystem.
const angemeldet: Project[] = [];

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    angemeldet.push(projekt);
  },
}));

const { setzeEinblendung } = await import("../../src/main/project-store/setze-einblendung");
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
    akzentfarbe: null,
  };
}

function video(einblendung: Einblendung | null = null): Listenelement {
  return {
    id: "e-video",
    art: "video",
    ref: "a-video",
    dauer: null,
    trimStart: 1.5,
    trimEnde: 9.25,
    einblendung,
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
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

// Ein Band, das die Formpruefung besteht - die Bandhoehe steckt AUSDRUECKLICH NICHT hier,
// sondern in der Vorlage (TK 9.2.8); `bandVorlageId` ist der einzige Verweis darauf.
function band(...refs: string[]): Einblendung {
  return {
    bandVorlageId: "band-standard",
    abschnitte: refs.map((aktionRef, i) => ({ aktionRef, dauer: 5 + i })),
  };
}

beforeEach(() => {
  angemeldet.length = 0;
  merkeAktivesProjekt(null);
});

describe("setzeEinblendung (#120)", () => {
  it("uebernimmt ein gueltiges Band vollstaendig und in exakt der uebergebenen Reihenfolge", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", band("ak-2", "ak-1", "ak-2"));

    expect(ergebnis.ok).toBe(true);
    expect(element.einblendung).toEqual({
      bandVorlageId: "band-standard",
      abschnitte: [
        { aktionRef: "ak-2", dauer: 5 },
        { aktionRef: "ak-1", dauer: 6 },
        { aktionRef: "ak-2", dauer: 7 },
      ],
    });
    // Zurueck geht der LEBENDE Eintrag, keine Kopie (gleiche Linie wie #44/#45).
    expect(ergebnis.ok && ergebnis.wert).toBe(element);
    expect(angemeldet).toHaveLength(1);
  });

  it("laesst dauer, trimStart und trimEnde unangetastet", async () => {
    // "Die Elementdauer bestimmt allein das Video (Trim). Das Band verlaengert oder
    // verkuerzt sie nie." (TK 9.2.8)
    const element = video();
    const vorher = { dauer: element.dauer, trimStart: element.trimStart, trimEnde: element.trimEnde };
    merkeAktivesProjekt(projektMit([element]));

    await setzeEinblendung("e-video", band("ak-1"));

    expect({
      dauer: element.dauer,
      trimStart: element.trimStart,
      trimEnde: element.trimEnde,
    }).toEqual(vorher);
  });

  it("speichert die Abschnitts-Dauern ROH, ohne Rundung auf das Ausgaberaster", async () => {
    // 4,71 s liegt NICHT auf dem 30-fps-Raster (141,3 Frames). Gerundet wird ausschliesslich
    // im render-service (TK 9.2.6/9.2.8); zwei rundende Stellen waeren zwei Regeln.
    // Der Wert ist mit Bedacht gewaehlt: 0,7 s waere 21/30 und ueberlebte jede Rundung
    // unveraendert - ein solcher Test kann nicht fehlschlagen und belegt nichts.
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    await setzeEinblendung("e-video", {
      bandVorlageId: "band-standard",
      abschnitte: [{ aktionRef: "ak-1", dauer: 4.71 }],
    });

    expect(element.einblendung?.abschnitte[0]?.dauer).toBe(4.71);
  });

  it("baut das Band neu und uebernimmt kein mitgeschicktes Fremdfeld", async () => {
    // Die Bandhoehe gehoert der Vorlage, nicht dem Element (TK 9.2.8). Ein Renderer, der
    // trotzdem eine `höhe` mitschickt, darf sie nicht in der project.json wiederfinden.
    const element = video();
    merkeAktivesProjekt(projektMit([element]));
    const hereingereicht = {
      bandVorlageId: "band-standard",
      abschnitte: [{ aktionRef: "ak-1", dauer: 5, sortierung: 3 }],
      höhe: 163,
    } as unknown as Einblendung;

    await setzeEinblendung("e-video", hereingereicht);

    expect(element.einblendung).not.toBe(hereingereicht);
    expect(element.einblendung).toEqual({
      bandVorlageId: "band-standard",
      abschnitte: [{ aktionRef: "ak-1", dauer: 5 }],
    });
    expect(Object.keys(element.einblendung ?? {})).toEqual(["bandVorlageId", "abschnitte"]);
  });

  it("entfernt ein vorhandenes Band bei null und laesst das Element in der Liste", async () => {
    const element = video(band("ak-1"));
    const projekt = projektMit([element]);
    merkeAktivesProjekt(projekt);

    const ergebnis = await setzeEinblendung("e-video", null);

    expect(ergebnis.ok).toBe(true);
    expect(element.einblendung).toBeNull();
    expect(projekt.liste).toEqual([element]);
  });

  it("meldet Erfolg, wenn null auf ein Element ohne Band trifft", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", null);

    expect(ergebnis.ok).toBe(true);
    expect(element.einblendung).toBeNull();
  });

  it("normalisiert ein leeres abschnitte-Array zu null statt es abzulehnen", async () => {
    // TK 9.5.3, hier auf dem SETZ-Weg: Ein Band ohne Abschnitte haette nichts zu zeigen.
    // Gespeichert wird null - KEINE leere Einblendung.
    const element = video(band("ak-1"));
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", {
      bandVorlageId: "band-standard",
      abschnitte: [],
    });

    expect(ergebnis.ok).toBe(true);
    expect(element.einblendung).toBeNull();
  });

  it("weist ein segment-Element ab", async () => {
    const element = standbild();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-segment", band("ak-1"));

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.einblendung).toBeNull();
  });

  it("uebernimmt NICHTS, wenn erst der LETZTE Abschnitt eine unbekannte Aktion nennt", async () => {
    // Der teure Fall: Die vorderen Abschnitte sind gueltig. Wird geprueft und gesetzt in
    // einem Zug, bleibt das alte Band exakt stehen (TK 9.1.1 Punkt 6).
    const vorheriges = band("ak-1");
    const element = video(vorheriges);
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", {
      bandVorlageId: "band-neu",
      abschnitte: [
        { aktionRef: "ak-1", dauer: 4 },
        { aktionRef: "ak-2", dauer: 4 },
        { aktionRef: "ak-weg", dauer: 4 },
      ],
    });

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(element.einblendung).toBe(vorheriges);
    expect(element.einblendung).toEqual({
      bandVorlageId: "band-standard",
      abschnitte: [{ aktionRef: "ak-1", dauer: 5 }],
    });
    expect(angemeldet).toHaveLength(0);
  });

  it.each([
    ["null Sekunden", 0],
    ["negativ", -1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["Zeichenkette", "12"],
  ])("weist eine Abschnitts-Dauer ab: %s", async (_name, dauer) => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", {
      bandVorlageId: "band-standard",
      abschnitte: [{ aktionRef: "ak-1", dauer }],
    } as unknown as Einblendung);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.einblendung).toBeNull();
  });

  it.each([
    ["fehlende bandVorlageId", { abschnitte: [{ aktionRef: "ak-1", dauer: 5 }] }],
    ["leere bandVorlageId", { bandVorlageId: "  ", abschnitte: [{ aktionRef: "ak-1", dauer: 5 }] }],
    ["abschnitte kein Array", { bandVorlageId: "band-standard", abschnitte: "ak-1" }],
    ["Abschnitt kein Objekt", { bandVorlageId: "band-standard", abschnitte: ["ak-1"] }],
    [
      "Abschnitt ohne aktionRef",
      { bandVorlageId: "band-standard", abschnitte: [{ dauer: 5 }] },
    ],
    ["Einblendung ist ein Array", []],
    ["Einblendung ist eine Zeichenkette", "band"],
  ])("weist eine kaputte Bandstruktur ab: %s", async (_name, nutzlast) => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    const ergebnis = await setzeEinblendung("e-video", nutzlast as unknown as Einblendung);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.einblendung).toBeNull();
    expect(angemeldet).toHaveLength(0);
  });

  it("weist eine unbekannte elementId ab", async () => {
    merkeAktivesProjekt(projektMit([video()]));

    const ergebnis = await setzeEinblendung("gibt-es-nicht", band("ak-1"));

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(angemeldet).toHaveLength(0);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await setzeEinblendung("e-video", band("ak-1"));

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("kein_projekt");
  });

  it("prueft den ZUSTAND der referenzierten Aktion nicht", async () => {
    // TK 9.7.5 Fall 3: Der kaputte Band-Abschnitt ist ein NACHTRAEGLICH erkannter
    // Reparaturfall. Eine Sperre hier blockierte die Reparaturwege, die selbst ueber
    // diese Operation laufen.
    const kaputt: Aktion = { ...aktion("ak-kaputt"), bildRef: "a-weg" };
    const element = video();
    merkeAktivesProjekt(projektMit([element], [kaputt]));

    const ergebnis = await setzeEinblendung("e-video", band("ak-kaputt"));

    expect(ergebnis.ok).toBe(true);
    expect(element.einblendung?.abschnitte[0]?.aktionRef).toBe("ak-kaputt");
  });

  it("wartet auf das D1-Lock, statt in einen laufenden Schreibvorgang hineinzuschreiben", async () => {
    const element = video();
    merkeAktivesProjekt(projektMit([element]));

    let freigeben: () => void = () => {};
    const belegt = mitD1Lock(
      () =>
        new Promise<void>((aufloesen) => {
          freigeben = aufloesen;
        }),
    );

    const laeuft = setzeEinblendung("e-video", band("ak-1"));
    // Genug Microtasks, damit ein Rumpf OHNE Lock laengst fertig waere.
    await Promise.resolve();
    await Promise.resolve();
    expect(element.einblendung).toBeNull();

    freigeben();
    await belegt;
    await laeuft;
    expect(element.einblendung?.abschnitte).toHaveLength(1);
  });
});
