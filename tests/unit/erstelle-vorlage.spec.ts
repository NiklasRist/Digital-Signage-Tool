import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import type { Vorlage } from "../../src/shared/contracts/vorlage";

// Unit-Test zu #100. Geprueft wird VERHALTEN, nicht die Deklaration.
//
// Der Schreibweg (#98) ist gemockt, und das aus zwei Gruenden: Der echte Modul zoege ueber
// ermittleDatenOrt() `electron` herein, das es im Testlauf nicht gibt und wuerde die ECHTE
// vorlagen.json anfassen - und nur mit einem Mock laesst sich der `speicher_fehler` ausloesen
// und nachweisen, dass bei einer ungueltigen Eingabe GAR NICHT geschrieben wird.
//
// `eingebaute-vorlagen` (#96) ist ABSICHTLICH NICHT gemockt: Die Aussage dieses Issues ist
// gerade, dass die festen Zonen aus DIESER Quelle kommen. Gegen ein Attrappen-Objekt geprueft
// waere der Test gruen, auch wenn die Zahlen des Markenrahmens hier ein zweites Mal
// hingeschrieben stuenden.
const zustand: {
  bestand: Vorlage[];
  fehler: string | null;
  aufrufe: { schreibart: string }[];
} = { bestand: [], fehler: null, aufrufe: [] };

vi.mock("../../src/main/vorlagen-store/schreibe-vorlagen", () => ({
  aendereBestand: async <T,>(
    aenderung: (bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: T }, string>,
    schreibart: string,
  ): Promise<Ergebnis<T, string>> => {
    zustand.aufrufe.push({ schreibart });
    if (zustand.fehler !== null) {
      // Der Fehlschlag steht VOR der Uebernahme: Was in diesem Test "der Bestand" heisst, ist der
      // PERSISTIERTE Stand. Dass der echte #98 den geaenderten Stand bei einem Schreibfehler im
      // Speicher behaelt (kein Rollback, TK 9.5.4), ist sein Vertrag und nicht die Zusage dieser
      // Funktion - hier zaehlt, dass der Code unveraendert durchgereicht wird.
      return { ok: false, fehler: { code: zustand.fehler, meldung: "Attrappe" } };
    }
    // Wie #98: die Aenderungsfunktion bekommt eine TIEFE KOPIE.
    const ergebnis = aenderung(structuredClone(zustand.bestand));
    if (!ergebnis.ok) {
      return ergebnis;
    }
    zustand.bestand = ergebnis.wert.bestand;
    return { ok: true, wert: ergebnis.wert.wert };
  },
}));

const { erstelleVorlage } = await import("../../src/main/vorlagen-store/erstelle-vorlage");
const { eingebauteVorlagen } = await import("../../src/main/vorlagen-store/eingebaute-vorlagen");

beforeEach(() => {
  zustand.bestand = [];
  zustand.fehler = null;
  zustand.aufrufe = [];
});

/** Legt an und besteht auf Erfolg - fuer die Tests, in denen der Fehlerfall nicht das Thema ist. */
async function angelegt(art: "vollflaeche" | "split", höhe: number | null, name: string) {
  const ergebnis = await erstelleVorlage(art, höhe, name);
  if (!ergebnis.ok) {
    throw new Error(`unerwartet fehlgeschlagen: ${ergebnis.fehler.code} ${ergebnis.fehler.meldung}`);
  }
  return ergebnis.wert;
}

function zone(vorlage: Vorlage, id: string) {
  const treffer = vorlage.zonen.find((eintrag) => eintrag.id === id);
  if (treffer === undefined) {
    throw new Error(`Zone ${id} fehlt`);
  }
  return treffer;
}

/** Die eingebaute Vorlage als Vergleichsmassstab - nie abgeschriebene Zahlen. */
function eingebaute(id: string): Vorlage {
  const treffer = eingebauteVorlagen().find((vorlage) => vorlage.id === id);
  if (treffer === undefined) {
    throw new Error(`eingebaute Vorlage ${id} fehlt`);
  }
  return treffer;
}

describe("erstelleVorlage – vollflaechig", () => {
  it("legt eine nutzbare Vorlage mit UUID, parent null und eingebaut false an", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");

    expect(neu.name).toBe("Meine Vorlage");
    expect(neu.art).toBe("vollflaeche");
    expect(neu.höhe).toBeNull();
    expect(neu.parent).toBeNull();
    expect(neu.eingebaut).toBe(false);
    expect(neu.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    // 'sofort': Das Anlegen ist eine ausdrueckliche Nutzeraktion und darf nicht in der Entprellung
    // haengen bleiben.
    expect(zustand.aufrufe).toEqual([{ schreibart: "sofort" }]);
  });

  it("belegt genau die zwei festen Zonen des Markenrahmens vor – hintergrund zuerst", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");

    expect(neu.zonen.map((z) => z.id)).toEqual(["hintergrund", "logo"]);
    expect(neu.zonen.every((z) => z.rolle === "fest")).toBe(true);
  });

  it("uebernimmt die Rahmenwerte unveraendert aus der eingebauten Vorlage 'vollbild'", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");
    const quelle = eingebaute("vollbild");

    expect(zone(neu, "hintergrund")).toEqual(zone(quelle, "hintergrund"));
    expect(zone(neu, "logo")).toEqual(zone(quelle, "logo"));
  });

  it("kopiert KEINE scrim-Zone", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");

    // 'vollbild' fuehrt DREI feste Zonen; der Scrim gehoert nicht zum Markenrahmen.
    expect(eingebaute("vollbild").zonen.filter((z) => z.rolle === "fest")).toHaveLength(3);
    expect(neu.zonen.map((z) => z.id)).not.toContain("scrim");
  });

  it("nimmt das Logo aus 'vollbild' und nicht aus der eingebauten Vorlage 'split'", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");

    expect(zone(neu, "logo").rahmen.x).toBe(zone(eingebaute("vollbild"), "logo").rahmen.x);
    expect(zone(neu, "logo").rahmen.x).not.toBe(zone(eingebaute("split"), "logo").rahmen.x);
  });

  it("belegt keine freien Zonen vor", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");

    expect(neu.zonen.filter((z) => z.rolle === "frei")).toEqual([]);
  });

  it("liefert tiefe Kopien – eine Aenderung daran beruehrt weder #96 noch den Bestand", async () => {
    const neu = await angelegt("vollflaeche", null, "Meine Vorlage");
    const vorher = zone(eingebaute("vollbild"), "hintergrund").rahmen.x;

    const ersteZone = neu.zonen[0];
    expect(ersteZone).toBeDefined();
    if (ersteZone === undefined) {
      return;
    }
    ersteZone.rahmen.x = 999;
    neu.name = "hinter dem Ruecken geaendert";

    expect(zone(eingebaute("vollbild"), "hintergrund").rahmen.x).toBe(vorher);
    const gespeichert = zustand.bestand[0];
    expect(gespeichert?.name).toBe("Meine Vorlage");
    expect(gespeichert?.zonen[0]?.rahmen.x).toBe(vorher);
  });
});

describe("erstelleVorlage – Band", () => {
  it("uebernimmt bei der Standard-Bandhoehe die zwei festen Zonen von 'band-standard'", async () => {
    const quelle = eingebaute("band-standard");
    const neu = await angelegt("split", quelle.höhe, "Mein Band");

    expect(neu.art).toBe("split");
    expect(neu.höhe).toBe(quelle.höhe);
    expect(neu.zonen.map((z) => z.id)).toEqual(["hintergrund", "logo"]);
    expect(zone(neu, "hintergrund")).toEqual(zone(quelle, "hintergrund"));
    expect(zone(neu, "logo")).toEqual(zone(quelle, "logo"));
  });

  it("legt fuer eine noch nicht festgelegte Bandhoehe NICHTS an", async () => {
    // Die offene Entscheidung des Issues: Welche festen Zonen bekommt ein Band, das nicht die
    // Hoehe der eingebauten Vorlage hat - und welche eine 'einblendung'? Bis das entschieden ist,
    // darf hier keine Vorlage entstehen; eine ohne Markenrahmen liesse sich spaeter nicht mehr
    // reparieren.
    const ergebnis = await erstelleVorlage("split", 120, "Schmales Band");

    expect(ergebnis.ok).toBe(false);
    expect(zustand.aufrufe).toEqual([]);
    expect(zustand.bestand).toEqual([]);
  });

  it("legt fuer eine einblendung NICHTS an", async () => {
    const ergebnis = await erstelleVorlage("einblendung", 162, "Einblendung");

    expect(ergebnis.ok).toBe(false);
    expect(zustand.aufrufe).toEqual([]);
    expect(zustand.bestand).toEqual([]);
  });
});

describe("erstelleVorlage – Validierung", () => {
  /** Jeder Fehlerfall prueft dasselbe Paar: richtiger Code UND kein Schreibversuch. */
  async function abgewiesen(
    art: Parameters<typeof erstelleVorlage>[0],
    höhe: number | null,
    name: string,
  ) {
    const ergebnis = await erstelleVorlage(art, höhe, name);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) {
      return;
    }
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    // DER eigentliche Nachweis fuer "ohne jede Wirkung": Der Schreibweg wurde nicht einmal
    // betreten. Ein Test, der nur den Bestand hinterher anschaut, uebersaehe eine Aenderung, die
    // erst spaeter zurueckgerollt wird.
    expect(zustand.aufrufe).toEqual([]);
    expect(zustand.bestand).toEqual([]);
  }

  it("weist eine unbekannte Art ab", async () => {
    await abgewiesen("band" as Parameters<typeof erstelleVorlage>[0], null, "X");
  });

  it("weist eine Hoehe bei einer vollflaechigen Vorlage ab", async () => {
    await abgewiesen("vollflaeche", 162, "X");
  });

  it("weist 0, 1080, gebrochene und fehlende Bandhoehen ab", async () => {
    await abgewiesen("split", 0, "X");
    await abgewiesen("split", 1080, "X");
    await abgewiesen("split", 162.5, "X");
    await abgewiesen("split", null, "X");
  });

  it("weist UNGERADE Bandhoehen ab, gerade nicht", async () => {
    // Der Kern von TK 9.11.1 Punkt 8: 161 und 162 unterscheiden sich um ein einziges Pixel, aber
    // nur die gerade Hoehe laesst die Komposition des Ausgabe-Profils heil.
    await abgewiesen("split", 161, "X");
    await abgewiesen("einblendung", 161, "X");

    const neu = await angelegt("split", 162, "X");
    expect(neu.höhe).toBe(162);
  });

  it("weist einen leeren und einen zu langen Namen ab", async () => {
    await abgewiesen("vollflaeche", null, "   ");
    await abgewiesen("vollflaeche", null, "");
    await abgewiesen("vollflaeche", null, "a".repeat(81));
  });

  it("speichert den Namen getrimmt", async () => {
    const neu = await angelegt("vollflaeche", null, "  Mein Aushang  ");

    expect(neu.name).toBe("Mein Aushang");
    expect(zustand.bestand[0]?.name).toBe("Mein Aushang");
  });
});

describe("erstelleVorlage – Bestand", () => {
  it("erlaubt zwei Vorlagen mit demselben Namen und gibt ihnen verschiedene IDs", async () => {
    const eine = await angelegt("vollflaeche", null, "Aushang");
    const andere = await angelegt("vollflaeche", null, "Aushang");

    expect(eine.id).not.toBe(andere.id);
    expect(zustand.bestand.map((v) => v.id)).toEqual([eine.id, andere.id]);
  });

  it("haengt hinten an und laesst die Reihenfolge der vorhandenen Eintraege unveraendert", async () => {
    zustand.bestand = eingebauteVorlagen();
    const vorher = zustand.bestand.map((v) => v.id);

    const neu = await angelegt("vollflaeche", null, "Aushang");

    expect(zustand.bestand.map((v) => v.id)).toEqual([...vorher, neu.id]);
  });

  it("reicht speicher_fehler unveraendert durch und legt nichts an", async () => {
    zustand.fehler = "speicher_fehler";

    const ergebnis = await erstelleVorlage("vollflaeche", null, "Aushang");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) {
      return;
    }
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(zustand.bestand).toEqual([]);
  });
});
