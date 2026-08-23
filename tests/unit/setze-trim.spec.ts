import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Asset } from "../../src/shared/contracts/asset";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu setzeTrim (#44). Interessant ist hier die Rechenkante: Was genau
// landet im Listenelement, und wo verlaeuft die Grenze zur Quelllaenge.
//
// Gemockt sind genau zwei Nachbarn: `holeAktivesProjekt` (#192) haelt den Zustand, den
// dieser Test aufbaut, und `planeAutoSpeicherung` (#47) wuerde sonst einen echten
// Schreibvorgang planen. Das D1-Lock (#32) laeuft ECHT mit - es ist Teil der Zusage
// dieser Operation und funktioniert ohne Dateisystem.
const zustand = vi.hoisted(() => ({
  aktivesProjekt: null as unknown,
  vorgemerkt: [] as unknown[],
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: () => zustand.aktivesProjekt,
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.vorgemerkt.push(projekt);
  },
}));

// Erst NACH den Mocks laden - wie in den uebrigen Spezifikationen dieses Moduls.
const { setzeTrim } = await import("../../src/main/project-store/setze-trim");

const VIDEO_ASSET: Asset = {
  id: "a-video",
  typ: "video",
  dateiname: "a-video.mp4",
  originalname: "trailer.mp4",
  maße: { breite: 1920, höhe: 1080 },
  dauer: 12.345,
  importdatum: "2026-08-12T08:00:00.000Z",
  zustand: "ok",
};

function video(): Listenelement {
  return {
    id: "e-video",
    art: "video",
    ref: "a-video",
    dauer: null,
    trimStart: 0,
    trimEnde: 12.345,
    einblendung: null,
  };
}

function segment(): Listenelement {
  return {
    id: "e-segment",
    art: "segment",
    ref: "akt-1",
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  };
}

function projektMit(liste: Listenelement[], assets: Asset[] = [VIDEO_ASSET]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets,
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

beforeEach(() => {
  zustand.aktivesProjekt = null;
  zustand.vorgemerkt = [];
});

describe("setzeTrim (#44)", () => {
  it("uebernimmt die Sekundenwerte ROH, ohne Rundung auf das Ausgaberaster", async () => {
    // 1,033333... s liegt nicht auf dem 30-fps-Raster. Genau daran entscheidet sich, ob
    // diese Funktion sich an die Arbeitsteilung mit dem render-service haelt: Sie darf
    // NICHT auf den naechsten Frame ziehen (das waeren 1.0333333333333334 bzw. 1.0).
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 1.0333333333333333, 9.987654321);

    expect(ergebnis.ok).toBe(true);
    expect(element.trimStart).toBe(1.0333333333333333);
    expect(element.trimEnde).toBe(9.987654321);
  });

  it("laesst dauer bei null und gibt das Element aus der Liste heraus", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 1, 5);

    expect(ergebnis.ok && ergebnis.wert.dauer).toBeNull();
    // toBe, nicht toEqual: main-interne Aufrufer sollen den lebenden Eintrag bekommen.
    expect(ergebnis.ok && ergebnis.wert).toBe(element);
  });

  it("laesst trimEnde GENAU auf der Quelllaenge zu", async () => {
    // Die Grenze ist einschliessend (AD 4.4: bis zur Quelllaenge). Wer den Regler ganz
    // ans Ende zieht, schickt exakt diesen Wert - eine Ausschlussgrenze machte das
    // letzte Bild unerreichbar.
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 0, 12.345);

    expect(ergebnis.ok).toBe(true);
    expect(element.trimEnde).toBe(12.345);
  });

  it("weist einen Wert knapp hinter der Quelllaenge ab und laesst die Liste unberuehrt", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 0, 12.346);

    expect(ergebnis.ok).toBe(false);
    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.trimEnde).toBe(12.345);
    expect(zustand.vorgemerkt).toHaveLength(0);
  });

  it("nimmt einen Ausschnitt an, der kuerzer als ein Einzelbild ist", async () => {
    // Bewusst festgehalten: Eine Mindestlaenge wird hier NICHT durchgesetzt (STOPP-Block
    // des Issues). Faellt diese Zusage, ist das eine Entscheidung, kein Zufall - der Test
    // muss dann mitentscheiden, nicht stillschweigend nachgezogen werden.
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 1, 1.01);

    expect(ergebnis.ok).toBe(true);
    expect(element.trimEnde).toBe(1.01);
  });

  it("weist einen Ausschnitt ohne Laenge ab (start === ende)", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 4, 4);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.trimStart).toBe(0);
  });

  it("weist einen umgekehrten Ausschnitt ab (start > ende)", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 9, 4);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist NaN ab, statt es in die Liste zu lassen", async () => {
    // Ein leeres Zahlenfeld in der Oberflaeche wird schnell zu NaN. Jeder Vergleich mit
    // NaN ist falsch - ohne eigene Pruefung liefe der Wert durch beide Bereichstests und
    // stuende danach als `null` in der project.json (JSON kennt kein NaN).
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", Number.NaN, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.trimStart).toBe(0);
  });

  it("weist Infinity ab", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", 0, Number.POSITIVE_INFINITY);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist einen Anfang vor dem Videoanfang ab", async () => {
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-video", -0.5, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist ein Element ab, das kein Video ist", async () => {
    const element = segment();
    zustand.aktivesProjekt = projektMit([element]);

    const ergebnis = await setzeTrim("e-segment", 1, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.trimStart).toBeNull();
    expect(element.dauer).toBe(10);
  });

  it("meldet eine unbekannte Kennung als nicht_gefunden", async () => {
    zustand.aktivesProjekt = projektMit([video()]);

    const ergebnis = await setzeTrim("gibt-es-nicht", 1, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("nicht_gefunden");
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await setzeTrim("e-video", 1, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("kein_projekt");
  });

  it("weist ab, wenn die Quelllaenge nicht ermittelbar ist (ref zeigt ins Leere)", async () => {
    // Ohne Asset gibt es keine Obergrenze - der Ausschnitt duerfte dann gegen NICHTS
    // geprueft werden. Bewusst ungueltige_eingabe: nicht_gefunden gehoert der elementId,
    // und ein Aufrufer duerfte daraus schliessen, das Element sei aus der Liste weg.
    const element = video();
    zustand.aktivesProjekt = projektMit([element], []);

    const ergebnis = await setzeTrim("e-video", 1, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(element.trimEnde).toBe(12.345);
  });

  it("weist ab, wenn zum referenzierten Medium keine Laufzeit hinterlegt ist", async () => {
    const element = video();
    const ohneDauer: Asset = { ...VIDEO_ASSET, dauer: null };
    zustand.aktivesProjekt = projektMit([element], [ohneDauer]);

    const ergebnis = await setzeTrim("e-video", 1, 5);

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("merkt bei Erfolg genau das lebende Projekt zum Speichern vor - entprellt, nicht sofort", async () => {
    const projekt = projektMit([video()]);
    zustand.aktivesProjekt = projekt;

    await setzeTrim("e-video", 1, 5);

    expect(zustand.vorgemerkt).toEqual([projekt]);
    expect(zustand.vorgemerkt[0]).toBe(projekt);
  });

  it("serialisiert nebenlaeufige Aufrufe und laesst den letzten gewinnen", async () => {
    // Das D1-Lock laeuft hier echt mit. Ohne es koennten sich zwei Zuege am Regler
    // ueberholen, und in der Liste stuende am Ende der aeltere Stand.
    const element = video();
    zustand.aktivesProjekt = projektMit([element]);

    await Promise.all([setzeTrim("e-video", 0, 3), setzeTrim("e-video", 2, 6)]);

    expect(element.trimStart).toBe(2);
    expect(element.trimEnde).toBe(6);
    expect(zustand.vorgemerkt).toHaveLength(2);
  });
});
