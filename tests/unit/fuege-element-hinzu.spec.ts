import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Asset } from "../../src/shared/contracts/asset";
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from "../../src/shared/contracts/konstanten";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu fuegeElementHinzu (#41): WELCHE art und WELCHE Feldbelegung das
// neue Element je Referenz bekommt, wo es landet, und was bei einer Referenz
// geschieht, die niemand kennt.
//
// `planeAutoSpeicherung` (#47) ist gemockt - sonst liefe ein echter 4-Sekunden-Timer
// mit, der am Ende auf die Platte schriebe. Der Halter des aktiven Projekts (#192)
// und das D1-Lock (#32) sind ECHT: An ihnen haengt das Verhalten, das hier geprueft
// wird (lebende Referenz, Serialisierung).
const zustand = vi.hoisted(() => ({ geplant: [] as unknown[] }));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.geplant.push(projekt);
  },
}));

import { merkeAktivesProjekt } from "../../src/main/project-store/aktives-projekt";
import { mitD1Lock } from "../../src/main/project-store/d1-lock";
import { fügeElementHinzu } from "../../src/main/project-store/fuege-element-hinzu";

function asset(teil: Partial<Asset> & Pick<Asset, "id" | "typ">): Asset {
  return {
    dateiname: `${teil.id}.bin`,
    originalname: "quelle",
    maße: { breite: 1920, höhe: 1080 },
    dauer: teil.typ === "video" ? 42.5 : null,
    importdatum: "2026-08-12T08:00:00.000Z",
    zustand: "ok",
    ...teil,
  };
}

function aktion(id: string, standardDauer: number | null): Aktion {
  return {
    id,
    titel: "Sommeraktion",
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer,
    vorlagenId: "vollbild",
    akzentfarbe: null,
  };
}

const VIDEO = asset({ id: "a-video", typ: "video" });
const BILD = asset({ id: "a-bild", typ: "bild" });
const VIDEO_FEHLT = asset({ id: "a-weg", typ: "video", zustand: "fehlt" });
const VIDEO_OHNE_DAUER = asset({ id: "a-kaputt", typ: "video", dauer: null });

function projekt(liste: Listenelement[] = []): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [VIDEO, BILD, VIDEO_FEHLT, VIDEO_OHNE_DAUER],
    aktionen: [aktion("akt-vorgabe", 25), aktion("akt-ohne", null), aktion("akt-ausreisser", 100)],
    liste,
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

function element(id: string): Listenelement {
  return { id, art: "segment", ref: "akt-vorgabe", dauer: 10, trimStart: null, trimEnde: null, einblendung: null };
}

beforeEach(() => {
  zustand.geplant = [];
  merkeAktivesProjekt(null);
});

describe("fuegeElementHinzu (#41)", () => {
  it("legt aus einem Video-Asset ein video-Element mit dem vollen Ausschnitt an", async () => {
    const p = projekt();
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("a-video");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert).toMatchObject({
      art: "video",
      ref: "a-video",
      dauer: null,
      trimStart: 0,
      // Volle Laenge als Vorbelegung - und damit ein Wert, den setzeTrim (#44)
      // anschliessend annimmt (0 <= start < ende <= Quelldauer).
      trimEnde: 42.5,
      einblendung: null,
    });
  });

  it("weist ein Bild-Asset ab, statt daraus ein Listenelement zu bauen", async () => {
    // Die Elementart "bild" ist mit TK v3.16 gestrichen (TK 9.11.3): Ein Bild kommt
    // ausschliesslich als Motiv einer Aktion in die Liste. Das Medium IST gefunden -
    // deshalb ungueltige_eingabe und nicht nicht_gefunden.
    const p = projekt();
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("a-bild");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(p.liste).toEqual([]);
    expect(zustand.geplant).toEqual([]);
  });

  it("uebernimmt Aktion.standardDauer als Startwert des segment-Elements", async () => {
    merkeAktivesProjekt(projekt());

    const ergebnis = await fügeElementHinzu("akt-vorgabe");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert).toMatchObject({ art: "segment", ref: "akt-vorgabe", dauer: 25 });
  });

  it("faellt ohne Vorgabe und bei einer Vorgabe ausserhalb 10-45 s auf die Standarddauer zurueck", async () => {
    merkeAktivesProjekt(projekt());

    const ohne = await fügeElementHinzu("akt-ohne");
    // 100 s stehen in keiner Aktion versehentlich: erstelleAktion (#38) prueft die
    // Spanne bewusst nicht. Uebernommen werden darf der Wert trotzdem nicht - die
    // Belegungstabelle (TK 9.11.3) bindet segment auf 10-45 s.
    const ausreisser = await fügeElementHinzu("akt-ausreisser");

    expect(ohne.ok && ohne.wert.dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN);
    expect(ausreisser.ok && ausreisser.wert.dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN);
  });

  it("haengt ans Ende an und vergibt je Aufruf eine eigene Kennung", async () => {
    const p = projekt([element("e-alt")]);
    merkeAktivesProjekt(p);

    await fügeElementHinzu("a-video");
    await fügeElementHinzu("a-video");

    expect(p.liste.map((e) => e.id)[0]).toBe("e-alt");
    expect(p.liste).toHaveLength(3);
    // Dieselbe Referenz zweimal ist erlaubt - eine Wiederholung im Reel ist der
    // Normalfall. Verschieden sein muessen die Element-Kennungen.
    expect(p.liste[1]?.id).not.toBe(p.liste[2]?.id);
  });

  it("nimmt ein Medium mit zustand 'fehlt' auf, statt es abzuweisen", async () => {
    // TK 9.7.5 erkennt kaputte Elemente NACHTRAEGLICH; wer hier sperrte, machte die
    // gefuehrte Reparatur (FA-19) fuer neue Elemente unmoeglich.
    const p = projekt();
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("a-weg");

    expect(ergebnis.ok).toBe(true);
    expect(p.liste).toHaveLength(1);
  });

  it("weist ein Video ohne hinterlegte Laufzeit ab, ohne die Liste anzufassen", async () => {
    const p = projekt();
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("a-kaputt");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    // Das Medium IST gefunden - deshalb nicht `nicht_gefunden`, sonst duerfte der
    // Aufrufer schliessen, das Asset sei verschwunden.
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(p.liste).toEqual([]);
    expect(zustand.geplant).toEqual([]);
  });

  it("meldet nicht_gefunden bei unbekannter Referenz und aendert nichts", async () => {
    const p = projekt([element("e-alt")]);
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("gibt-es-nicht");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(p.liste.map((e) => e.id)).toEqual(["e-alt"]);
    expect(zustand.geplant).toEqual([]);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await fügeElementHinzu("a-video");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_projekt");
    expect(zustand.geplant).toEqual([]);
  });

  it("gibt das eingehaengte Element heraus und merkt den LEBENDEN Stand vor", async () => {
    const p = projekt();
    merkeAktivesProjekt(p);

    const ergebnis = await fügeElementHinzu("a-video");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // toBe, nicht toEqual: Herausgegeben wird dasselbe Objekt, das in der Liste
    // haengt - eine Kopie waere die zweite Wahrheit, die #192 ausschliesst.
    expect(p.liste[0]).toBe(ergebnis.wert);
    expect(zustand.geplant[0]).toBe(p);
  });

  it("laeuft im D1-Lock - wartet, solange ein fremder Abschnitt es haelt", async () => {
    const p = projekt();
    merkeAktivesProjekt(p);

    let freigeben = (): void => {};
    const halter = mitD1Lock(() => new Promise<void>((aufloesen) => { freigeben = aufloesen; }));

    const laeuft = fügeElementHinzu("a-video");
    await Promise.resolve();
    await Promise.resolve();
    // Ohne Lock stuende das Element hier schon in der Liste.
    expect(p.liste).toEqual([]);

    freigeben();
    await halter;
    await laeuft;
    expect(p.liste).toHaveLength(1);
  });
});
