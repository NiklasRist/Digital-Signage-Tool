import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import type { Vorlage, Zone } from "../../src/shared/contracts/vorlage";

// Verhaltenstest zu #103 (uebernehmeInParent). Der Schreibweg (#98) ist als Attrappe gemockt,
// und zwar aus drei Gruenden: (1) die DoD verlangt einen Spy - "aendereBestand wird genau
// EINMAL aufgerufen, mit schreibart === 'sofort'"; (2) "nichts geschrieben" ist nur gegen
// eine Attrappe nachweisbar, die den Rueckgabewert der Aenderungsfunktion prueft; (3) der
// echte #98 zoege ueber ermittleDatenOrt() `electron` herein, das es im Testlauf nicht gibt.
//
// Die Attrappe bildet die Vertraege von #98 ab: die Aenderungsfunktion ist SYNCHRON, bekommt
// eine TIEFE KOPIE des Bestands, liefert ok:false unveraendert nach draussen und übernimmt den
// gelieferten Bestand NUR bei ok:true.
const zustand: {
  bestand: Vorlage[];
  fehler: string | null;
  aufrufe: { schreibart: string }[];
  letzteRueckgabe: unknown;
} = { bestand: [], fehler: null, aufrufe: [], letzteRueckgabe: null };

vi.mock("../../src/main/vorlagen-store/schreibe-vorlagen", () => ({
  aendereBestand: async <T,>(
    aenderung: (bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: T }, string>,
    schreibart: string,
  ): Promise<Ergebnis<T, string>> => {
    zustand.aufrufe.push({ schreibart });
    if (zustand.fehler !== null) {
      // Der Fehlschlag steht VOR der Uebernahme - wie beim echten #98 laeuft die
      // Aenderungsfunktion dann gar nicht erst.
      return { ok: false, fehler: { code: zustand.fehler, meldung: "Attrappe" } };
    }
    // Wie #98: die Aenderungsfunktion bekommt eine TIEFE KOPIE.
    const ergebnis = aenderung(structuredClone(zustand.bestand));
    zustand.letzteRueckgabe = ergebnis;
    if (!ergebnis.ok) {
      // "wird NICHTS geschrieben" ist hier ablesbar: `zustand.bestand` bleibt unberuehrt.
      return ergebnis;
    }
    zustand.bestand = ergebnis.wert.bestand;
    return { ok: true, wert: ergebnis.wert.wert };
  },
}));

const { uebernehmeInParent } = await import("../../src/main/vorlagen-store/uebernehme-in-parent");

beforeEach(() => {
  zustand.bestand = [];
  zustand.fehler = null;
  zustand.aufrufe = [];
  zustand.letzteRueckgabe = null;
});

/** Eine nutzbare Vorlage; Standard: split mit gerade hoehe 162. */
function vorlage(id: string, ueber: Partial<Vorlage> = {}): Vorlage {
  return {
    id,
    name: `Vorlage ${id}`,
    art: "split",
    höhe: 162,
    parent: null,
    eingebaut: false,
    zonen: [
      {
        id: `${id}-hintergrund`,
        rolle: "fest",
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 162 },
        ausrichtung: { horizontal: "mitte", vertikal: "oben" },
        wennLeer: "leer",
      },
    ],
    ...ueber,
  };
}

/** Eine Arbeitskopie mit gesetztem parent. */
function arbeitskopie(id: string, parentId: string, ueber: Partial<Vorlage> = {}): Vorlage {
  return vorlage(id, { name: `Kopie ${id}`, parent: parentId, ...ueber });
}

/** Eine freie Zone, damit die Arbeitskopie sich vom Parent INHALTLICH unterscheidet. */
function freieZone(id: string, rahmenX = 96): Zone {
  return {
    id,
    rolle: "frei",
    bindung: "titel",
    rahmen: { x: rahmenX, y: 54, breite: 800, höhe: 200 },
    ausrichtung: { horizontal: "links", vertikal: "oben" },
    wennLeer: "leer",
  };
}

describe("uebernehmeInParent (#103) – Erfolgsfall", () => {
  it("überträgt name, art, höhe und zonen der Arbeitskopie und behält id und eingebaut des Parents", async () => {
    const p = vorlage("p", { name: "Alter Parent", zonen: [freieZone("p-alt", 96)] });
    const k = arbeitskopie("k", "p", {
      name: "Neuer Name",
      art: "einblendung",
      höhe: 320,
      zonen: [freieZone("k-neu", 200)],
    });
    zustand.bestand = [p, k];

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    const wert = ergebnis.wert;
    expect(wert.id).toBe("p");
    expect(wert.eingebaut).toBe(p.eingebaut);
    expect(wert.name).toBe("Neuer Name");
    expect(wert.art).toBe("einblendung");
    expect(wert.höhe).toBe(320);
    expect(wert.zonen).toEqual(k.zonen);
    // Deep-Vergleich: der Parent traegt wirklich die Zonen der Arbeitskopie, nicht die alten.
    expect(wert.zonen).not.toEqual(p.zonen);
  });

  it("liefert als wert genau den Parent-Eintrag aus dem geschriebenen Bestand, nicht die Arbeitskopie", async () => {
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p")];

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // Der Eintrag mit der id des Parents im geschriebenen Bestand.
    const eintrag = zustand.bestand.find((v) => v.id === "p");
    expect(eintrag).toBeDefined();
    expect(ergebnis.wert).toEqual(eintrag);
    // Nicht die Arbeitskopie: deren id ist weg.
    expect(zustand.bestand.find((v) => v.id === "k")).toBeUndefined();
    expect(ergebnis.wert.id).not.toBe("k");
  });

  it("entfernt die Arbeitskopie; übrige Einträge unverändert in Reihenfolge, Parent an alter Position", async () => {
    const p = vorlage("p");
    const o = vorlage("o", { name: "Unberührt", höhe: 540, zonen: [freieZone("o-zone", 11)] });
    const k = arbeitskopie("k", "p");
    zustand.bestand = [p, o, k];
    const oVorher = structuredClone(o);

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    // Ersetzen UND Entfernen im gelieferten Bestand: p ersetzt, k weg, o unveraendert.
    expect(zustand.bestand.map((v) => v.id)).toEqual(["p", "o"]);
    expect(zustand.bestand[0]?.name).toBe(k.name);
    expect(zustand.bestand[1]).toEqual(oVorher);
  });

  it("ruft aendereBestand genau einmal mit 'sofort' auf", async () => {
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p")];

    await uebernehmeInParent("k");

    expect(zustand.aufrufe).toEqual([{ schreibart: "sofort" }]);
  });

  it("Regression gegen den Spread-Fehler: parent des Parents bleibt null", async () => {
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p")];

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.parent).toBeNull();
    expect(ergebnis.wert.parent).not.toBe("p");
    expect(ergebnis.wert.parent).not.toBe("k");
  });

  it("liefert die Aenderungsfunktion synchron – ihr Rueckgabewert ist kein Promise", async () => {
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p")];

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    // Was die Aenderungsfunktion zurueckgegeben hat: ein Objekt, kein Promise.
    expect(zustand.letzteRueckgabe).not.toBeInstanceOf(Promise);
    expect(typeof (zustand.letzteRueckgabe as { then?: unknown }).then).toBe("undefined");
  });
});

describe("uebernehmeInParent (#103) – Sperren", () => {
  it("liefert bei eingebautem Parent parent_eingebaut; die Aenderungsfunktion sagt ok:false, nichts wird geschrieben", async () => {
    const p = vorlage("p", { eingebaut: true });
    const k = arbeitskopie("k", "p");
    zustand.bestand = [p, k];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("parent_eingebaut");
    // Die Aenderungsfunktion selbst lieferte ok:false - die Attrappe uebernimmt dann nichts.
    const rueckgabe = zustand.letzteRueckgabe as { ok: boolean };
    expect(rueckgabe.ok).toBe(false);
    expect(zustand.bestand).toEqual(vorher);
  });

  it("liefert fuer eine arbeitsId mit parent === null ungueltige_eingabe ohne Schreibvorgang", async () => {
    const p = vorlage("p");
    zustand.bestand = [p];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("p");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(zustand.bestand).toEqual(vorher);
  });

  it("liefert fuer einen Selbstbezug ungueltige_eingabe und laesst den Eintrag unveraendert stehen", async () => {
    // kaputte Hand-Datei: parent zeigt auf sich selbst. Ohne die Pruefung fände die
    // Parent-Suche denselben Eintrag, der danach als Arbeitskopie entfernt wuerde.
    const selbst = arbeitskopie("s", "s");
    zustand.bestand = [selbst];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("s");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(zustand.bestand).toEqual(vorher);
    expect(zustand.bestand.map((v) => v.id)).toEqual(["s"]);
  });

  it("liefert fuer eine unbekannte arbeitsId nicht_gefunden ohne Schreibvorgang", async () => {
    zustand.bestand = [vorlage("p")];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("gibt-es-nicht");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(zustand.bestand).toEqual(vorher);
  });

  it("liefert fuer einen fehlenden Parent nicht_gefunden ohne Schreibvorgang", async () => {
    // Die Arbeitskopie existiert, ihr Parent steht aber nicht mehr im Bestand.
    const k = arbeitskopie("k", "parent-fehlt");
    zustand.bestand = [k];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(zustand.bestand).toEqual(vorher);
  });
});

describe("uebernehmeInParent (#103) – Hohenregel", () => {
  /** Jeder Fehlerfall prueft dasselbe Paar: richtiger Code UND unveraenderter Bestand. */
  async function abgewiesen(k: Vorlage, bestandVorher: Vorlage[]) {
    const ergebnis = await uebernehmeInParent(k.id);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(zustand.bestand).toEqual(bestandVorher);
  }

  it("weist split mit ungerader hoehe 161 ab und schreibt nichts; der Parent bleibt unveraendert", async () => {
    const p = vorlage("p", { höhe: 162 });
    const k = arbeitskopie("k", "p", { art: "split", höhe: 161 });
    zustand.bestand = [p, k];
    const vorher = structuredClone(zustand.bestand);

    await abgewiesen(k, vorher);

    // Der Parent steht unveraendert im Bestand - die abgelehnte 161 hat ihn nicht angeruehrt.
    expect(zustand.bestand.find((v) => v.id === "p")).toEqual(p);
    expect(zustand.bestand.find((v) => v.id === "k")).toEqual(k);
  });

  it("Regression gegen stilles Aufrunden: 161 gelingt NIE, 162 gelingt mit exakt 162", async () => {
    // 161 -> abgewiesen (Test oben), KEINE still erzeugte 162.
    const p = vorlage("p");
    const k = arbeitskopie("k", "p", { art: "split", höhe: 161 });
    zustand.bestand = [p, k];
    const ergebnis161 = await uebernehmeInParent("k");
    expect(ergebnis161.ok).toBe(false);

    // 162 -> gelingt, und der Parent traegt danach exakt 162, nie ein gerundeter Wert.
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p", { art: "split", höhe: 162 })];
    const ergebnis162 = await uebernehmeInParent("k");
    expect(ergebnis162.ok).toBe(true);
    if (!ergebnis162.ok) return;
    expect(ergebnis162.wert.höhe).toBe(162);
    expect(ergebnis162.wert.höhe).toBe(Number(ergebnis162.wert.höhe));
  });

  it("weist einblendung mit hoehe null, 0, -2 und 1080 ab, ohne Schreibvorgang", async () => {
    for (const höhe of [null, 0, -2, 1080]) {
      zustand.bestand = [vorlage("p"), arbeitskopie("k", "p", { art: "einblendung", höhe })];
      const vorher = structuredClone(zustand.bestand);
      await abgewiesen(zustand.bestand[1] as Vorlage, vorher);
    }
  });

  it("weist vollflaeche mit hoehe 162 ab und setzt sie NICHT stillschweigend auf null", async () => {
    const p = vorlage("p");
    const k = arbeitskopie("k", "p", { art: "vollflaeche", höhe: 162 });
    zustand.bestand = [p, k];
    const vorher = structuredClone(zustand.bestand);

    await abgewiesen(k, vorher);
  });
});

describe("uebernehmeInParent (#103) – formale Eingabe", () => {
  it("liefert fuer die leere arbeitsId ungueltige_eingabe, ohne aendereBestand ueberhaupt aufzurufen", async () => {
    zustand.bestand = [vorlage("p")];
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    // "ohne jeden Bestandszugriff": der Schreibweg wurde gar nicht betreten.
    expect(zustand.aufrufe).toEqual([]);
    expect(zustand.bestand).toEqual(vorher);
  });

  it("liefert fuer eine zur Laufzeit durchgereichte Nicht-String-arbeitsId ungueltige_eingabe", async () => {
    // Der Typ `string` haelt nur den Compiler ab, nicht den IPC (TK 9.1.1 Punkt 6).
    const ergebnis = await uebernehmeInParent(undefined as unknown as string);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(zustand.aufrufe).toEqual([]);
  });
});

describe("uebernehmeInParent (#103) – aendereBestand", () => {
  it("reicht speicher_fehler unveraendert durch, ohne etwas zu schreiben", async () => {
    zustand.bestand = [vorlage("p"), arbeitskopie("k", "p")];
    zustand.fehler = "speicher_fehler";
    const vorher = structuredClone(zustand.bestand);

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(zustand.bestand).toEqual(vorher);
  });
});

describe("uebernehmeInParent (#103) – zweite Arbeitskopie", () => {
  it("laesst eine zweite Arbeitskopie desselben Parents nach dem Merge stehen", async () => {
    const p = vorlage("p");
    const k = arbeitskopie("k", "p", { name: "Erste Kopie" });
    const k2 = arbeitskopie("k2", "p", { name: "Zweite Kopie", höhe: 540 });
    zustand.bestand = [p, k, k2];

    const ergebnis = await uebernehmeInParent("k");

    expect(ergebnis.ok).toBe(true);
    expect(zustand.bestand.map((v) => v.id)).toEqual(["p", "k2"]);
    expect(zustand.bestand[1]).toEqual(k2);
  });
});
