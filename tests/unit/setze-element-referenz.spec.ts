import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Einblendung, Listenelement, Project } from "../../src/shared/contracts/project";

// Unit-Test zu #152. Geprueft wird VERHALTEN am lebenden Datenmodell.
//
// Gemockt ist allein das Auto-Speichern (#47): Der echte `planeAutoSpeicherung` startet einen
// Entprellungstimer, der spaeter `schreibeProjekt` ruft - der Test fasste sonst echte Dateien an.
// Das D1-Lock (#32) laeuft ECHT mit; es braucht kein Dateisystem und ist Teil der Zusage.
const angemeldet: Project[] = [];

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    angemeldet.push(projekt);
  },
}));

const { setzeElementReferenz } = await import(
  "../../src/main/project-store/setze-element-referenz"
);
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");

function asset(id: string, typ: "video" | "bild"): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === "video" ? "mp4" : "png"}`,
    originalname: `${id}-original`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === "video" ? 42.5 : null,
    importdatum: "2026-08-15T08:00:00.000Z",
    zustand: "ok",
  };
}

function aktion(id: string, standardDauer: number | null = null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer,
    vorlagenId: "split",
    akzentfarbe: null,
  };
}

const band: Einblendung = {
  bandVorlageId: "band-1",
  abschnitte: [
    { aktionRef: "ak-1", dauer: 5 },
    { aktionRef: "ak-2", dauer: 7 },
  ],
};

function videoElement(): Listenelement {
  return {
    id: "e-video",
    art: "video",
    ref: "a-video-alt",
    dauer: null,
    trimStart: 1.5,
    trimEnde: 9.25,
    einblendung: structuredClone(band),
  };
}

function segmentElement(): Listenelement {
  return {
    id: "e-segment",
    art: "segment",
    ref: "ak-1",
    dauer: 23,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  };
}

function projektMit(liste: Listenelement[]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-15T08:00:00.000Z",
    geaendertAm: "2026-08-15T08:00:00.000Z",
    schemaVersion: 1,
    assets: [
      asset("a-video-alt", "video"),
      asset("a-video-neu", "video"),
      asset("a-bild-alt", "bild"),
      asset("a-bild-neu", "bild"),
    ],
    // ak-2 traegt ausdruecklich eine ABWEICHENDE standardDauer - damit belegt der
    // Segment-Test, dass sie beim Referenzwechsel NICHT uebernommen wird (TK 9.8.4).
    aktionen: [aktion("ak-1", 10), aktion("ak-2", 45)],
    liste,
    letzterAusgabeName: null,
  };
}

let projekt: Project;

beforeEach(() => {
  angemeldet.length = 0;
  projekt = projektMit([videoElement(), segmentElement()]);
  merkeAktivesProjekt(projekt);
});

describe("setzeElementReferenz - Erfolgsfaelle je art", () => {
  it("haengt ein Video-Element um, setzt beide Trim-Werte auf null und laesst dauer null", async () => {
    const ergebnis = await setzeElementReferenz("e-video", "a-video-neu");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.ref).toBe("a-video-neu");
    expect(ergebnis.wert.trimStart).toBeNull();
    expect(ergebnis.wert.trimEnde).toBeNull();
    expect(ergebnis.wert.dauer).toBeNull();
    expect(angemeldet).toEqual([projekt]);
  });

  it("laesst die einblendung mit allen Abschnitten unveraendert", async () => {
    const vorher = structuredClone(projekt.liste[0]!.einblendung);

    await setzeElementReferenz("e-video", "a-video-neu");

    expect(projekt.liste[0]!.einblendung).toEqual(vorher);
    expect(projekt.liste[0]!.einblendung?.abschnitte).toHaveLength(2);
  });

  it("haengt ein Segment-Element auf eine andere Aktion um, ohne deren standardDauer zu uebernehmen", async () => {
    // ak-2 hat standardDauer 45, das Element steht auf 23. Ein Referenzwechsel ist KEIN
    // Platzieren (TK 9.8.4) - wuerde er die Dauer mitziehen, aenderte eine Reparatur die
    // Laenge des fertigen Films.
    const ergebnis = await setzeElementReferenz("e-segment", "ak-2");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.ref).toBe("ak-2");
    expect(ergebnis.wert.dauer).toBe(23);
    expect(ergebnis.wert.trimStart).toBeNull();
    expect(ergebnis.wert.trimEnde).toBeNull();
    expect(ergebnis.wert.einblendung).toBeNull();
  });

  it("laesst art und Position in der Liste bei jedem Erfolg unveraendert", async () => {
    await setzeElementReferenz("e-video", "a-video-neu");
    await setzeElementReferenz("e-segment", "ak-2");

    expect(projekt.liste.map((eintrag) => eintrag.id)).toEqual(["e-video", "e-segment"]);
    expect(projekt.liste.map((eintrag) => eintrag.art)).toEqual(["video", "segment"]);
  });

  it("setzt bei gleicher Referenz den Trim eines Video-Elements trotzdem zurueck", async () => {
    const ergebnis = await setzeElementReferenz("e-video", "a-video-alt");

    expect(ergebnis.ok).toBe(true);
    expect(projekt.liste[0]!.ref).toBe("a-video-alt");
    expect(projekt.liste[0]!.trimStart).toBeNull();
    expect(projekt.liste[0]!.trimEnde).toBeNull();
  });
});

describe("setzeElementReferenz - der Zielbestand folgt allein der art", () => {
  it("weist eine gueltige Aktions-ID unter einem Video-Element mit nicht_gefunden ab", async () => {
    const ergebnis = await setzeElementReferenz("e-video", "ak-2");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
    expect(projekt.liste[0]!.ref).toBe("a-video-alt");
  });

  it("weist eine gueltige Asset-ID unter einem Segment-Element mit nicht_gefunden ab", async () => {
    const ergebnis = await setzeElementReferenz("e-segment", "a-bild-neu");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
    expect(projekt.liste[1]!.ref).toBe("ak-1");
  });
});

describe("setzeElementReferenz - Fehlerpfade wirken nicht", () => {
  it("weist ein Bild-Asset unter einem Video-Element ab, ohne den Trim zurueckzusetzen", async () => {
    const ergebnis = await setzeElementReferenz("e-video", "a-bild-neu");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.liste[0]!.ref).toBe("a-video-alt");
    expect(projekt.liste[0]!.trimStart).toBe(1.5);
    expect(projekt.liste[0]!.trimEnde).toBe(9.25);
  });

  it("meldet eine unbekannte elementId als nicht_gefunden", async () => {
    const ergebnis = await setzeElementReferenz("gibt-es-nicht", "a-video-neu");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
  });

  it("meldet leere Argumente als ungueltige_eingabe", async () => {
    await expect(setzeElementReferenz("", "a-video-neu")).resolves.toMatchObject({
      ok: false,
      fehler: { code: "ungueltige_eingabe" },
    });
    await expect(setzeElementReferenz("e-video", "  ")).resolves.toMatchObject({
      ok: false,
      fehler: { code: "ungueltige_eingabe" },
    });
  });

  it("meldet kein_projekt, wenn keines geoeffnet ist - das ist etwas anderes als nicht_gefunden", async () => {
    merkeAktivesProjekt(null);

    const ergebnis = await setzeElementReferenz("e-video", "a-video-neu");

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "kein_projekt" } });
  });

  it("meldet auf keinem Fehlerpfad ein Auto-Speichern an", async () => {
    await setzeElementReferenz("e-video", "ak-2");
    await setzeElementReferenz("e-video", "a-bild-neu");
    await setzeElementReferenz("gibt-es-nicht", "a-video-neu");
    await setzeElementReferenz("", "");

    expect(angemeldet).toEqual([]);
  });
});

describe("setzeElementReferenz - laeuft im D1-Lock", () => {
  it("wartet, solange ein anderer Abschnitt das Lock haelt", async () => {
    const protokoll: string[] = [];

    // Der haltende Abschnitt entfernt das Element, WAEHREND der Referenzwechsel schon
    // eingereiht ist. Liefe der Wechsel nicht im Lock, laese er die Liste vor dem Entfernen
    // und meldete Erfolg an einem Element, das es danach nicht mehr gibt.
    const haelt = mitD1Lock(async () => {
      protokoll.push("halter start");
      await new Promise((auf) => setTimeout(auf, 20));
      projekt.liste.splice(0, 1);
      protokoll.push("halter ende");
    });

    const wechsel = setzeElementReferenz("e-video", "a-video-neu").then((ergebnis) => {
      protokoll.push("wechsel");
      return ergebnis;
    });

    const [, ergebnis] = await Promise.all([haelt, wechsel]);

    expect(protokoll).toEqual(["halter start", "halter ende", "wechsel"]);
    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
  });
});

describe("setzeElementReferenz - Nachbarbestaende bleiben unberuehrt", () => {
  it("laesst Project.assets und Project.aktionen bei Erfolg wie bei Fehlschlag unveraendert", async () => {
    const assetsVorher = structuredClone(projekt.assets);
    const aktionenVorher = structuredClone(projekt.aktionen);

    await setzeElementReferenz("e-video", "a-video-neu");
    await setzeElementReferenz("e-segment", "ak-2");
    await setzeElementReferenz("e-video", "a-bild-neu");
    await setzeElementReferenz("e-segment", "a-video-neu");

    expect(projekt.assets).toEqual(assetsVorher);
    expect(projekt.aktionen).toEqual(aktionenVorher);
  });

  it("haengt ausschliesslich das benannte Element um, nicht die uebrigen mit demselben Ziel", async () => {
    const zwilling: Listenelement = { ...segmentElement(), id: "e-segment-2" };
    projekt.liste.push(zwilling);

    await setzeElementReferenz("e-segment", "ak-2");

    expect(projekt.liste[1]!.ref).toBe("ak-2");
    expect(projekt.liste[2]!.ref).toBe("ak-1");
  });
});
