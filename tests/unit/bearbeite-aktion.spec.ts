import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Project } from "../../src/shared/contracts/project";

// Unit-Test zu #39. Geprueft wird VERHALTEN, nicht die Deklaration.
//
// Das Auto-Speichern (#47) ist gemockt - aus denselben zwei Gruenden wie in
// erstelle-aktion.spec.ts: Es ist der einzige beobachtbare Nachweis dafuer, dass die
// Instant-Operation das Speichern anstoesst (auf der Platte passiert hier absichtlich
// nichts), und der echte Modul zoege ueber schreibeProjekt den Datenort und damit
// `electron` herein, das es im Testlauf nicht gibt.
const geplant: Project[] = [];
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    geplant.push(projekt);
  },
}));

const { bearbeiteAktion } = await import("../../src/main/project-store/bearbeite-aktion");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");

function bestand(): Aktion {
  return {
    id: "a1",
    titel: "Sommeraktion",
    beschreibung: "Zwei Monate gratis",
    preis: "19,90 EUR",
    bildRef: "asset-7",
    cta: "Jetzt anmelden",
    standardDauer: 15,
    vorlagenId: "vollbild",
    markeId: "marke-test",
    akzentfarbe: "#FF4040",
  };
}

function projekt(aktionen: Aktion[]): Project {
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
    standardMarkeId: "marke-test",
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

let offen: Project;
let aktion: Aktion;

beforeEach(() => {
  geplant.length = 0;
  aktion = bestand();
  offen = projekt([aktion]);
  merkeAktivesProjekt(offen);
});

describe("bearbeiteAktion (#39)", () => {
  it("aendert nur die mitgeschickten Felder und merkt zum Speichern vor", async () => {
    const ergebnis = await bearbeiteAktion("a1", { preis: "24,90 EUR" });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.preis).toBe("24,90 EUR");
    // Alles Uebrige steht unangetastet da - der eigentliche Vertrag dieser Funktion.
    expect(ergebnis.wert.titel).toBe("Sommeraktion");
    expect(ergebnis.wert.beschreibung).toBe("Zwei Monate gratis");
    expect(ergebnis.wert.bildRef).toBe("asset-7");
    expect(ergebnis.wert.cta).toBe("Jetzt anmelden");
    expect(ergebnis.wert.standardDauer).toBe(15);
    expect(ergebnis.wert.vorlagenId).toBe("vollbild");
    expect(ergebnis.wert.akzentfarbe).toBe("#FF4040");
    // toBe, nicht toEqual: Geaendert wird der LEBENDE Eintrag, kein Ersatzobjekt - sonst
    // haelt jeder main-interne Aufrufer danach eine Leiche.
    expect(ergebnis.wert).toBe(aktion);
    expect(offen.aktionen[0]).toBe(aktion);
    expect(geplant).toEqual([offen]);
  });

  it("unterscheidet 'nicht mitgeschickt' von 'auf null gesetzt'", async () => {
    // Der Kern des Partial-Vertrags: undefined laesst stehen, null leert absichtlich
    // ("Bild entfernen" ist eine der drei Fix-Optionen aus TK 9.8.5).
    const ergebnis = await bearbeiteAktion("a1", { bildRef: null, cta: undefined });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.bildRef).toBeNull();
    expect(ergebnis.wert.cta).toBe("Jetzt anmelden");
  });

  it("weist einen leeren Titel ab, ohne die Aktion zu veraendern", async () => {
    const ergebnis = await bearbeiteAktion("a1", { titel: "   ", preis: "1 EUR" });

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    // Auch das mitgeschickte, fuer sich gueltige Feld bleibt liegen: keine halbe Aenderung.
    expect(aktion).toEqual(bestand());
    expect(geplant).toEqual([]);
  });

  it("speichert den Titel ohne Randleerzeichen", async () => {
    const ergebnis = await bearbeiteAktion("a1", { titel: "  Winteraktion  " });

    expect(ergebnis.ok && ergebnis.wert.titel).toBe("Winteraktion");
  });

  it("weist eine leere vorlagenId ab", async () => {
    const ergebnis = await bearbeiteAktion("a1", { vorlagenId: "" });

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(aktion.vorlagenId).toBe("vollbild");
  });

  it("laesst die Vorlage wechseln", async () => {
    const ergebnis = await bearbeiteAktion("a1", { vorlagenId: "split" });

    expect(ergebnis.ok && ergebnis.wert.vorlagenId).toBe("split");
  });

  it("uebernimmt jeden Farbwert - die Palette ist seit FA-24 keine Schranke", async () => {
    const ergebnis = await bearbeiteAktion("a1", { akzentfarbe: "#0AF3C9" });

    expect(ergebnis.ok && ergebnis.wert.akzentfarbe).toBe("#0AF3C9");
  });

  it("meldet nicht_gefunden bei unbekannter Kennung, ohne etwas zu aendern", async () => {
    const ergebnis = await bearbeiteAktion("gibt-es-nicht", { titel: "Neu" });

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(aktion).toEqual(bestand());
    expect(geplant).toEqual([]);
  });

  it("meldet kein_projekt, wenn kein Projekt geoeffnet ist", async () => {
    merkeAktivesProjekt(null);

    const ergebnis = await bearbeiteAktion("a1", { titel: "Neu" });

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_projekt");
    expect(geplant).toEqual([]);
  });

  it("meldet die unbekannte Kennung, auch wenn der Titel zugleich leer ist", async () => {
    // Reihenfolge der Fehlerpfad-Tabelle: erst Existenz, dann Form.
    const ergebnis = await bearbeiteAktion("gibt-es-nicht", { titel: "" });

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
  });

  it("uebernimmt keine fremden Felder in den gespeicherten Datensatz", async () => {
    const mitBallast = { preis: "9 EUR", heimlich: "aus dem Renderer" };

    const ergebnis = await bearbeiteAktion("a1", mitBallast);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert).not.toHaveProperty("heimlich");
  });

  it("macht aus einer unbrauchbaren standardDauer null statt NaN", async () => {
    // Stuende NaN im Speicher, schriebe JSON.stringify null in die Datei - Speicher und
    // Platte sagten Verschiedenes, sichtbar erst nach einem Neustart.
    const ergebnis = await bearbeiteAktion("a1", { standardDauer: Number.NaN });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.standardDauer).toBeNull();
  });

  it("laeuft innerhalb des D1-Locks", async () => {
    let freigeben: () => void = () => undefined;
    const gehalten = mitD1Lock(() => new Promise<void>((auf) => (freigeben = auf)));

    const lauf = bearbeiteAktion("a1", { titel: "Winteraktion" });
    await new Promise((weiter) => setTimeout(weiter, 20));
    // Solange ein fremder Abschnitt das Lock haelt, darf D1 unberuehrt bleiben.
    expect(aktion.titel).toBe("Sommeraktion");

    freigeben();
    await gehalten;
    expect((await lauf).ok).toBe(true);
    expect(aktion.titel).toBe("Winteraktion");
  });
});

describe("bearbeiteAktion (#319) - markeId", () => {
  it("ein nicht mitgeschicktes markeId bleibt UNVERAENDERT", async () => {
    const ergebnis = await bearbeiteAktion("a1", { titel: "X" });
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.markeId).toBe("marke-test");
    }
  });

  it("ein mitgeschicktes, LEERES markeId wird mit ungueltige_eingabe abgewiesen und die Aktion bleibt", async () => {
    const ergebnis = await bearbeiteAktion("a1", { markeId: "" });
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.meldung).toContain("markeId");
    }
    const danach = offen.aktionen.find((a) => a.id === "a1");
    expect(danach?.markeId).toBe("marke-test");
  });

  it("ein gueltiges markeId aendert NUR dieses Feld", async () => {
    const ergebnis = await bearbeiteAktion("a1", { markeId: "m2" });
    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.wert.markeId).toBe("m2");
      expect(ergebnis.wert.titel).toBe("Sommeraktion");
      expect(ergebnis.wert.akzentfarbe).toBe("#FF4040");
    }
  });
});

describe("bearbeiteAktion - Effekte (09.11.2026, TK 9.16.1)", () => {
  it("uebernimmt einen Effekt-Satz normalisiert", async () => {
    const ergebnis = await bearbeiteAktion("a1", {
      effekte: { zoomAtmen: { staerke: 100 } },
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.effekte).toEqual({ zoomAtmen: { staerke: 100 } });
    expect(offen.aktionen[0]?.effekte).toEqual({ zoomAtmen: { staerke: 100 } });
  });

  it("klemmt ein Fenster auf die Wirksamkeitsdauer", async () => {
    const ergebnis = await bearbeiteAktion("a1", {
      effekte: { textEinblendung: { staerke: 100, vonSekunden: 0, bisSekunden: 10 } },
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // Hoechstens 3 s (EFFEKT_GRENZEN), nicht die 10 aus dem Aufruf.
    expect(ergebnis.wert.effekte).toEqual({
      textEinblendung: { staerke: 100, vonSekunden: 0, bisSekunden: 3 },
    });
  });

  it("ein NICHT mitgeschickter Satz bleibt unangetastet", async () => {
    await bearbeiteAktion("a1", { effekte: { zoomAtmen: { staerke: 60 } } });
    const ergebnis = await bearbeiteAktion("a1", { preis: "29,90 EUR" });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.effekte).toEqual({ zoomAtmen: { staerke: 60 } });
  });

  it("effekte null LOESCHT den Satz - der Zustand ohne Effekt", async () => {
    await bearbeiteAktion("a1", { effekte: { zoomAtmen: { staerke: 60 } } });
    const ergebnis = await bearbeiteAktion("a1", { effekte: null });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.effekte).toBeNull();
  });
});

describe("bearbeiteAktion - Gestaltung je Zone und Bildausschnitt (05.11.2026, TK 9.8.8)", () => {
  it("uebernimmt die Gestaltung normalisiert", async () => {
    const antwort = await bearbeiteAktion("a1", {
      zonenGestaltung: { preis: { flaechefarbe: "#00FF00", groesseProzent: 500 } },
      bildAusschnitt: { zoom: 150 },
    });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.zonenGestaltung).toEqual({
      preis: { flaechefarbe: "#00FF00", groesseProzent: 200 },
    });
    expect(antwort.wert.bildAusschnitt).toEqual({ zoom: 150, versatzX: 0, versatzY: 0 });
  });

  it("ein NICHT mitgeschicktes Feld bleibt unangetastet", async () => {
    // Dieselbe Zusage wie fuer jedes andere Feld: Was nicht im Auftrag steht, aendert sich
    // nicht. Fuer einen Record ist das nicht selbstverstaendlich - ein Mischen wollte
    // niemand.
    await bearbeiteAktion("a1", { zonenGestaltung: { preis: { textfarbe: "#123456" } } });
    const antwort = await bearbeiteAktion("a1", { titel: "Neuer Titel" });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.zonenGestaltung).toEqual({ preis: { textfarbe: "#123456" } });
  });

  it('ein leerer Record LOESCHT die Gestaltung - „keine Angabe“ ist ein Zustand', async () => {
    await bearbeiteAktion("a1", { zonenGestaltung: { preis: { textfarbe: "#123456" } } });
    const antwort = await bearbeiteAktion("a1", { zonenGestaltung: {} });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.zonenGestaltung).toEqual({});
  });

  it("eine Abdunkelung wird normalisiert uebernommen (Deckkraft 0-100, Farbe #RRGGBB)", async () => {
    const antwort = await bearbeiteAktion("a1", {
      zonenGestaltung: {
        scrim: {
          scrim: { vonFarbe: "#112233", vonDeckkraft: 500, bisDeckkraft: 70 },
        },
      },
    });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.zonenGestaltung).toEqual({
      scrim: { scrim: { vonFarbe: "#112233", vonDeckkraft: 100, bisDeckkraft: 70 } },
    });
  });

  it("bildAusschnitt null nimmt den eigenen Ausschnitt zurueck", async () => {
    await bearbeiteAktion("a1", { bildAusschnitt: { zoom: 200 } });
    const antwort = await bearbeiteAktion("a1", { bildAusschnitt: null });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.bildAusschnitt).toBeNull();
  });
});

describe("bearbeiteAktion - Aufbereitung des Motivs (13.11.2026, FA-28 / TK 9.21.3)", () => {
  it("setzt die Werte normalisiert", async () => {
    const antwort = await bearbeiteAktion("a1", {
      bildAufbereitung: { helligkeit: -250, schaerfe: 40 },
    });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.bildAufbereitung).toEqual({ helligkeit: -100, schaerfe: 40 });
  });

  it("null nimmt die Aufbereitung zurueck", async () => {
    await bearbeiteAktion("a1", { bildAufbereitung: { kontrast: 30 } });
    const antwort = await bearbeiteAktion("a1", { bildAufbereitung: null });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.bildAufbereitung).toBeNull();
  });

  it("ein NICHT mitgeschicktes Feld bleibt unangetastet", async () => {
    await bearbeiteAktion("a1", { bildAufbereitung: { kontrast: 30 } });
    const antwort = await bearbeiteAktion("a1", { titel: "Neuer Titel" });
    expect(antwort.ok).toBe(true);
    if (!antwort.ok) return;
    expect(antwort.wert.bildAufbereitung).toEqual({ kontrast: 30 });
  });
});
