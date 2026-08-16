import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Einblendung, Listenelement, Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu löscheAktion (#40). Der Kern des Issues ist NICHT, was verschwindet,
// sondern was ausdruecklich STEHENBLEIBT - deshalb legt fast jeder Test hier Dinge an, die
// die Kaskade nicht anfassen darf, und weist ihr Ueberleben nach.
//
// `planeAutoSpeicherung` (#47) ist gemockt - sonst liefe ein echter 3-5-Sekunden-Timer mit,
// der am Ende auf die Platte schriebe. Der Halter des aktiven Projekts (#192) und das
// D1-Lock (#32) sind ECHT: An ihnen haengt das Verhalten, das hier geprueft wird (lebende
// Referenz, Serialisierung).
const zustand = vi.hoisted(() => ({ geplant: [] as unknown[] }));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.geplant.push(projekt);
  },
}));

import { merkeAktivesProjekt } from "../../src/main/project-store/aktives-projekt";
import { mitD1Lock } from "../../src/main/project-store/d1-lock";
import { löscheAktion } from "../../src/main/project-store/loesche-aktion";

function aktion(id: string, bildRef: string | null = null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: "vollbild",
    akzentfarbe: null,
  };
}

function segment(id: string, aktionsId: string): Listenelement {
  return {
    id,
    art: "segment",
    ref: aktionsId,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  };
}

function video(id: string, aktionsIds: string[] | null): Listenelement {
  const einblendung: Einblendung | null =
    aktionsIds === null
      ? null
      : {
          bandVorlageId: "band-standard",
          abschnitte: aktionsIds.map((aktionRef) => ({ aktionRef, dauer: 8 })),
        };
  return { id, art: "video", ref: "asset-video", dauer: null, trimStart: 0, trimEnde: 30, einblendung };
}

// Das Bild-Asset, das ZWEI Aktionen benutzen. Es ist der Kronzeuge fuer "eine Aktion
// referenziert ein Asset nur, sie besitzt es nicht" (TK 9.5.3).
const BILD: Asset = {
  id: "asset-bild",
  typ: "bild",
  dateiname: "asset-bild.png",
  originalname: "angebot.png",
  maße: { breite: 1920, höhe: 1080 },
  dauer: null,
  importdatum: "2026-08-13T08:00:00.000Z",
  zustand: "ok",
};

const VIDEO_ASSET: Asset = {
  id: "asset-video",
  typ: "video",
  dateiname: "asset-video.mp4",
  originalname: "studio.mp4",
  maße: { breite: 1920, höhe: 1080 },
  dauer: 30,
  importdatum: "2026-08-13T08:00:00.000Z",
  zustand: "ok",
};

function projekt(aktionen: Aktion[], liste: Listenelement[]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-13T08:00:00.000Z",
    geaendertAm: "2026-08-13T08:00:00.000Z",
    schemaVersion: 1,
    assets: [BILD, VIDEO_ASSET],
    aktionen,
    liste,
    letzterAusgabeName: null,
  };
}

beforeEach(() => {
  zustand.geplant = [];
  merkeAktivesProjekt(null);
});

describe("löscheAktion (#40) - Fall 1: Segment-Listenelemente", () => {
  it("entfernt jedes Segment-Element dieser Aktion und laesst die uebrigen in ihrer Reihenfolge stehen", async () => {
    // Dieselbe Aktion wird von ZWEI Elementen benutzt; ein drittes zeigt auf eine andere.
    const p = projekt(
      [aktion("akt-weg"), aktion("akt-bleibt")],
      [
        segment("e1", "akt-weg"),
        segment("e2", "akt-bleibt"),
        segment("e3", "akt-weg"),
        video("e4", null),
      ],
    );
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.entfernteElementIds).toEqual(["e1", "e3"]);
    expect(ergebnis.wert.geaenderteElementIds).toEqual([]);
    // Kennungen in Reihenfolge, nicht nur die Laenge: Ein Vorwaerts-splice haette e3
    // uebersprungen, und ein `delete` liesse ein undefined-Loch stehen.
    expect(p.liste.map((e) => e.id)).toEqual(["e2", "e4"]);
  });

  it("fasst ein Video-Element nicht an, dessen ref zufaellig der Aktions-Kennung gleicht", async () => {
    // Kann bei UUIDs nicht vorkommen - genau deshalb steht die Art-Pruefung im Code und
    // nicht die Belegung dafuer gerade. `ref` traegt je nach `art` zwei verschiedene
    // Namensraeume (TK 9.11.3).
    const videoElement: Listenelement = {
      id: "e-video",
      art: "video",
      ref: "akt-weg",
      dauer: null,
      trimStart: 0,
      trimEnde: 10,
      einblendung: null,
    };
    const p = projekt([aktion("akt-weg")], [videoElement]);
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.entfernteElementIds).toEqual([]);
    expect(p.liste.map((e) => e.id)).toEqual(["e-video"]);
  });
});

describe("löscheAktion (#40) - Fall 2: Band-Abschnitte", () => {
  it("schneidet nur den Abschnitt heraus und laesst das Video in der Liste", async () => {
    // DER Fehler, gegen den dieses Issue geschrieben ist: "Wuerde Fall 2 wie Fall 1
    // behandelt, verloere der Nutzer sein Video aus der Wiedergabeliste" (TK 9.5.3).
    const p = projekt(
      [aktion("akt-weg"), aktion("akt-bleibt")],
      [video("e-vid", ["akt-weg", "akt-bleibt"])],
    );
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.entfernteElementIds).toEqual([]);
    expect(ergebnis.wert.geaenderteElementIds).toEqual(["e-vid"]);

    const uebrig = p.liste[0];
    expect(uebrig?.id).toBe("e-vid");
    expect(uebrig?.einblendung?.abschnitte).toEqual([{ aktionRef: "akt-bleibt", dauer: 8 }]);
    // Die Bandvorlage gehoert nicht dieser Operation - sie bleibt.
    expect(uebrig?.einblendung?.bandVorlageId).toBe("band-standard");
  });

  it("setzt einblendung auf null, wenn das Band leer wird - das Video bleibt", async () => {
    const p = projekt([aktion("akt-weg")], [video("e-vid", ["akt-weg"])]);
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.geaenderteElementIds).toEqual(["e-vid"]);
    expect(p.liste.map((e) => e.id)).toEqual(["e-vid"]);
    // null, NICHT ein leeres abschnitte-Array: Ein Band-Rest liesse den Render die
    // Bandflaeche weiter freihalten.
    expect(p.liste[0]?.einblendung).toBeNull();
  });

  it("meldet ein Video nicht, dessen Band die Aktion gar nicht enthaelt, und laesst es unveraendert", async () => {
    const unbeteiligt = video("e-fremd", ["akt-bleibt"]);
    const vorher = structuredClone(unbeteiligt.einblendung);
    const p = projekt(
      [aktion("akt-weg"), aktion("akt-bleibt")],
      [video("e-vid", ["akt-weg"]), unbeteiligt],
    );
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // Nur das betroffene Video steht drin - `geaenderteElementIds` benennt die Stellen,
    // die die Oberflaeche hervorhebt; ein unveraendertes Video darunter waere gelogen.
    expect(ergebnis.wert.geaenderteElementIds).toEqual(["e-vid"]);
    expect(unbeteiligt.einblendung).toEqual(vorher);
  });
});

describe("löscheAktion (#40) - was stehenbleiben MUSS", () => {
  it("laesst Assets, fremde Aktionen und ein gemeinsam benutztes Bild unangetastet", async () => {
    // Beide Aktionen zeigen auf DASSELBE Bild-Asset. Wer beim Loeschen "aufraeumt",
    // nimmt der ueberlebenden Aktion ihr Motiv.
    const bleibt = aktion("akt-bleibt", "asset-bild");
    const p = projekt(
      [aktion("akt-weg", "asset-bild"), bleibt],
      [segment("e1", "akt-weg"), segment("e2", "akt-bleibt")],
    );
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    expect(p.assets).toEqual([BILD, VIDEO_ASSET]);
    expect(p.aktionen).toEqual([bleibt]);
    expect(bleibt.bildRef).toBe("asset-bild");
    expect(p.liste.map((e) => e.id)).toEqual(["e2"]);
  });

  it("loescht eine Aktion, die gar nicht benutzt wird, mit zwei leeren Kennungslisten", async () => {
    const p = projekt(
      [aktion("akt-weg"), aktion("akt-bleibt")],
      [segment("e1", "akt-bleibt"), video("e2", ["akt-bleibt"])],
    );
    merkeAktivesProjekt(p);
    const listeVorher = structuredClone(p.liste);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.entfernteElementIds).toEqual([]);
    expect(ergebnis.wert.geaenderteElementIds).toEqual([]);
    expect(p.liste).toEqual(listeVorher);
    expect(p.aktionen.map((a) => a.id)).toEqual(["akt-bleibt"]);
  });

  it("entfernt am Ende den Aktions-Datensatz selbst", async () => {
    const p = projekt([aktion("akt-weg"), aktion("akt-bleibt")], [segment("e1", "akt-weg")]);
    merkeAktivesProjekt(p);

    await löscheAktion("akt-weg");

    expect(p.aktionen.some((a) => a.id === "akt-weg")).toBe(false);
  });
});

describe("löscheAktion (#40) - der zurueckgegebene stand", () => {
  it("traegt GENAU die Schluessel aktionen und liste", async () => {
    const p = projekt([aktion("akt-weg")], [segment("e1", "akt-weg")]);
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    const stand = ergebnis.wert.stand;
    expect(Object.keys(stand).sort()).toEqual(["aktionen", "liste"]);
    expect("assets" in stand).toBe(false);
    expect("letzterAusgabeName" in stand).toBe(false);
    expect("id" in stand).toBe(false);
    expect("schemaVersion" in stand).toBe(false);
  });

  it("stimmt mit dem zum Speichern vorgemerkten Projekt ueberein - kein Zwischenstand", async () => {
    const bleibt = aktion("akt-bleibt");
    const p = projekt(
      [aktion("akt-weg"), bleibt],
      [segment("e1", "akt-weg"), video("e2", ["akt-weg", "akt-bleibt"]), segment("e3", "akt-bleibt")],
    );
    merkeAktivesProjekt(p);

    const ergebnis = await löscheAktion("akt-weg");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // Vorgemerkt wird das LEBENDE Projekt - das ist der Stand, der geschrieben wird.
    expect(zustand.geplant).toEqual([p]);
    expect(zustand.geplant[0]).toBe(p);
    // toBe, nicht toEqual: `stand` traegt dieselben Arrays, nicht Kopien davon - sonst
    // waere nicht nachweisbar, dass gemeldeter und gespeicherter Stand derselbe ist.
    expect(ergebnis.wert.stand.aktionen).toBe(p.aktionen);
    expect(ergebnis.wert.stand.liste).toBe(p.liste);
    expect(ergebnis.wert.stand.aktionen.map((a) => a.id)).toEqual(["akt-bleibt"]);
    expect(ergebnis.wert.stand.liste.map((e) => e.id)).toEqual(["e2", "e3"]);
  });
});

describe("löscheAktion (#40) - Fehlerpfade und Lock", () => {
  it("meldet nicht_gefunden bei unbekannter Kennung, ohne Wirkung und ohne stand", async () => {
    const p = projekt([aktion("akt-1")], [segment("e1", "akt-1")]);
    merkeAktivesProjekt(p);
    const listeVorher = structuredClone(p.liste);

    const ergebnis = await löscheAktion("gibt-es-nicht");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    // Die Ergebnis-Huelle traegt im Nein-Zweig gar keinen Wert - hier zur Sicherheit
    // gegen ein versehentlich mitgeschicktes Feld.
    expect("wert" in ergebnis).toBe(false);
    expect(p.aktionen.map((a) => a.id)).toEqual(["akt-1"]);
    expect(p.liste).toEqual(listeVorher);
    // Nichts geaendert heisst auch: nichts zu speichern.
    expect(zustand.geplant).toEqual([]);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await löscheAktion("akt-1");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    // `kein_projekt` (ProjectStoreFehlercode) passt in die einparametrige Signatur dieses
    // Issues nicht hinein - s. Kommentar in der Datei und Bericht.
    expect(ergebnis.fehler.code).toBe("kein_projekt");
    expect(zustand.geplant).toEqual([]);
  });

  it("laeuft im D1-Lock - wartet, solange ein fremder Abschnitt es haelt", async () => {
    const p = projekt([aktion("akt-weg")], [segment("e1", "akt-weg")]);
    merkeAktivesProjekt(p);

    let freigeben = (): void => {};
    const halter = mitD1Lock(
      () => new Promise<void>((aufloesen) => { freigeben = aufloesen; }),
    );

    const laeuft = löscheAktion("akt-weg");
    // Mehrere Microtasks weiter ist die Bibliothek immer noch voll: Der Aufruf steht in
    // der Warteschlange. Ohne Lock waere sie hier bereits leer.
    await Promise.resolve();
    await Promise.resolve();
    expect(p.aktionen).toHaveLength(1);

    freigeben();
    await halter;
    await laeuft;
    expect(p.aktionen).toEqual([]);
    expect(p.liste).toEqual([]);
  });
});
