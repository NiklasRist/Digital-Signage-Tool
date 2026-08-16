import { beforeEach, describe, expect, it, vi } from "vitest";

import { entferneAsset } from "../../src/main/project-store/assets";

import type { Asset } from "../../src/shared/contracts/asset";
import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu entferneAsset (#73): WAS blockiert das Loeschen, WAS steht danach im Projekt,
// WANN meldet die Funktion Erfolg - und was bleibt nach einem Fehlschlag zurueck.
//
// Drei Nachbarn sind gemockt, jeder aus einem eigenen Grund:
//   - `auto-speichern` (#47), weil der Fehlerfall (volle Platte) auf einer echten Platte nicht
//     herstellbar ist und weil geprueft werden soll, WIE OFT und WOMIT geflusht wird;
//   - `aktives-projekt` (#192), weil der Halter modulweiten Zustand fuehrt, den jeder Test frisch
//     belegen koennen muss;
//   - `d1-lock` (#32), weil die Zusage "Pruefen und Entfernen in EINEM Abschnitt" von aussen sonst
//     unsichtbar ist. Der Mock fuehrt die Aktion echt aus und legt zusaetzlich die Sonde aus, mit
//     der die TOCTOU-Luecke sichtbar wuerde (Begruendung dort).
const zustand = vi.hoisted(() => ({
  aktivesProjekt: null as Project | null,
  /** Aufrufe von sofortFlush - je Eintrag das uebergebene Projekt. */
  geflusht: [] as unknown[],
  /** Aufrufe von planeAutoSpeicherung. Muss leer bleiben: Loeschen ist ein Auftrag. */
  entprellt: [] as unknown[],
  lockAufrufe: 0,
  imLock: false,
  /** War beim Flush ein Lock-Abschnitt offen? */
  flushImLock: [] as boolean[],
  /** Die Sonde: Laenge von assets beim ERSTEN `await` innerhalb des Lock-Abschnitts. */
  beobachtet: [] as number[],
  /** Antwort des naechsten sofortFlush; `null` = Erfolg. */
  flushAntwort: null as unknown,
  /** Haelt sofortFlush an, bis der Test aufloest. */
  flushBremse: null as null | Promise<void>,
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: () => zustand.aktivesProjekt,
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  sofortFlush: async (projekt: unknown) => {
    zustand.geflusht.push(projekt);
    zustand.flushImLock.push(zustand.imLock);
    if (zustand.flushBremse !== null) {
      await zustand.flushBremse;
    }
    return zustand.flushAntwort ?? { ok: true, wert: undefined };
  },
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.entprellt.push(projekt);
  },
}));

vi.mock("../../src/main/project-store/d1-lock", () => ({
  mitD1Lock: async <T>(aktion: () => Promise<T>): Promise<T> => {
    zustand.lockAufrufe += 1;

    // DIE SONDE gegen die TOCTOU-Luecke. Eine Attrappe des Locks sieht die MITTE der Operation
    // nicht; sichtbar wird sie ueber die Reihenfolge der Microtasks: Ein HIER, also VOR dem
    // Aufruf von aktion(), eingeplanter Microtask kommt fruehestens beim ERSTEN `await`
    // innerhalb der Operation zum Zug. Liegen Pruefung UND Entfernen davor (so ist es richtig -
    // der erste `await` ist der auf sofortFlush), sieht er die bereits verkuerzte Liste. Stuende
    // zwischen Pruefung und Entfernen ein `await`, saehe er die alte Laenge.
    const projekt = zustand.aktivesProjekt;
    void Promise.resolve().then(() => {
      if (projekt !== null) {
        zustand.beobachtet.push(projekt.assets.length);
      }
    });

    zustand.imLock = true;
    try {
      return await aktion();
    } finally {
      zustand.imLock = false;
    }
  },
}));

function neuesAsset(id: string): Asset {
  return {
    id,
    typ: "video",
    dateiname: `${id}.mp4`,
    originalname: "Werbung Sommer.MP4",
    maße: { breite: 1920, höhe: 1080 },
    dauer: 12.5,
    importdatum: "2026-08-13T09:00:00.000Z",
    zustand: "ok",
  };
}

function neuesElement(
  id: string,
  art: Listenelement["art"],
  ref: string,
  einblendung: Listenelement["einblendung"] = null,
): Listenelement {
  return { id, art, ref, dauer: null, trimStart: null, trimEnde: null, einblendung };
}

let projekt: Project;
let ersterAsset: Asset;
let mittlererAsset: Asset;

beforeEach(() => {
  ersterAsset = neuesAsset("a-erst");
  mittlererAsset = neuesAsset("a-mitte");
  projekt = {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [ersterAsset, mittlererAsset, neuesAsset("a-letzt")],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  };
  zustand.aktivesProjekt = projekt;
  zustand.geflusht = [];
  zustand.entprellt = [];
  zustand.lockAufrufe = 0;
  zustand.imLock = false;
  zustand.flushImLock = [];
  zustand.beobachtet = [];
  zustand.flushAntwort = null;
  zustand.flushBremse = null;
});

describe("entferneAsset (#73) - Erfolgsfall", () => {
  it("entfernt den Eintrag, laesst die uebrigen in Reihenfolge stehen und liefert ihn zurueck", async () => {
    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      // Dieselbe Objektreferenz - der media-service braucht daraus den `dateiname`.
      expect(ergebnis.wert).toBe(mittlererAsset);
      expect(ergebnis.wert.dateiname).toBe("a-mitte.mp4");
    }
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-letzt"]);

    expect(zustand.geflusht).toEqual([projekt]);
    // Seit dem 12.08.2026 wird die Aenderung ZUERST angemeldet und dann sofort geschrieben:
    // planeAutoSpeicherung (#47) ist der eine Ort, an dem `geaendertAm` fortgeschrieben wird,
    // und sofortFlush stempelt nicht. Ohne die Anmeldung truege project.json nach einem
    // Auftrag das alte Aenderungsdatum. Der gesetzte Entprellungstermin ist unschaedlich -
    // sofortFlush bricht ihn als Erstes ab.
    expect(zustand.entprellt).toEqual([projekt]);
    expect(zustand.lockAufrufe).toBe(1);
    expect(zustand.flushImLock).toEqual([true]);
  });

  it("hat beim ersten `await` bereits entfernt - Pruefung und Entfernen ohne `await` dazwischen", async () => {
    await entferneAsset("p1", "a-mitte");

    // Drei Assets vorher; die Sonde muss die verkuerzte Liste sehen (s. Mock).
    expect(zustand.beobachtet).toEqual([2]);
  });

  it("kehrt erst zurueck, wenn der Flush aufgeloest ist", async () => {
    let loese: () => void = () => {};
    zustand.flushBremse = new Promise<void>((auf) => {
      loese = auf;
    });

    let fertig = false;
    const laeuft = entferneAsset("p1", "a-mitte").then((wert) => {
      fertig = true;
      return wert;
    });

    // Mehrere Microtask-Runden - haette die Funktion vor dem Flush gemeldet, waere sie hier durch.
    await Promise.resolve();
    await Promise.resolve();
    expect(fertig).toBe(false);

    loese();
    await expect(laeuft).resolves.toMatchObject({ ok: true });
  });

  it("laesst sich von einem segment-Element und von aktionRef nicht aufhalten", async () => {
    projekt.liste = [
      // `ref` ist bei art 'segment' eine AKTIONS-ID - dass sie hier zufaellig gleich lautet,
      // darf das Loeschen nicht blockieren.
      neuesElement("le-segment", "segment", "a-mitte"),
      neuesElement("le-video", "video", "a-erst", {
        bandVorlageId: "v1",
        // aktionRef ist ebenfalls eine Aktions-ID.
        abschnitte: [{ aktionRef: "a-mitte", dauer: 10 }],
      }),
    ];

    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(true);
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-letzt"]);
  });
});

describe("entferneAsset (#73) - Fehlerfaelle", () => {
  it("blockiert bei Referenzen und nennt die Element-IDs nur in daten", async () => {
    projekt.liste = [
      neuesElement("le-eins", "video", "a-mitte"),
      neuesElement("le-fremd", "video", "a-erst"),
      neuesElement("le-zwei", "video", "a-mitte"),
      // Doppelte Element-ID (Datenfehler im Projekt): darf die Meldung nicht doppelt fuellen.
      neuesElement("le-eins", "video", "a-mitte"),
    ];
    const vorher = structuredClone(projekt.assets);

    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("asset_referenziert");
      expect(ergebnis.fehler.daten).toEqual({ referenzenIds: ["le-eins", "le-zwei"] });
      // Die IDs stehen NICHT in der Meldung - sie sind kein Ersatz fuer `daten` (TK 9.1.1).
      expect(ergebnis.fehler.meldung).not.toContain("le-eins");
      expect(ergebnis.fehler.meldung).not.toContain("le-zwei");
    }
    // Kein Kaskadieren: Die Listenelemente bleiben, die Assets auch - und geschrieben wird nicht.
    expect(projekt.liste).toHaveLength(4);
    expect(projekt.assets).toEqual(vorher);
    expect(zustand.geflusht).toEqual([]);
  });

  it("nimmt das Entfernen an der urspruenglichen Stelle zurueck, wenn der Flush scheitert", async () => {
    const vorher = structuredClone(projekt.assets);
    zustand.flushAntwort = {
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    };

    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
    }
    // Ganzes Array, nicht nur die Laenge: Die Anzeigereihenfolge IST die Array-Reihenfolge.
    expect(projekt.assets).toEqual(vorher);
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-mitte", "a-letzt"]);
  });

  it("setzt auch das erste Asset wieder nach vorn, wenn der Flush scheitert", async () => {
    const vorher = structuredClone(projekt.assets);
    zustand.flushAntwort = {
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    };

    await entferneAsset("p1", "a-erst");

    expect(projekt.assets).toEqual(vorher);
    expect(projekt.assets[0]).toBe(ersterAsset);
  });

  it("meldet asset_nicht_gefunden bei unbekannter ID und fremdem Projekt", async () => {
    const unbekannt = await entferneAsset("p1", "a-gibtsnicht");
    const fremd = await entferneAsset("p2", "a-mitte");

    for (const ergebnis of [unbekannt, fremd]) {
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe("asset_nicht_gefunden");
      }
    }
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-mitte", "a-letzt"]);
    expect(zustand.geflusht).toEqual([]);
  });

  // Seit dem 13.08.2026 ein eigener Code: Ohne offenes Projekt ist nicht der Asset das
  // Problem, sondern dass es nichts gibt, worin man suchen koennte.
  it("meldet kein_projekt, wenn ueberhaupt kein Projekt geladen ist", async () => {
    zustand.aktivesProjekt = null;

    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("kein_projekt");
    }
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-mitte", "a-letzt"]);
    expect(zustand.geflusht).toEqual([]);
  });

  it("meldet ungueltige_eingabe bei formal unbrauchbaren IDs", async () => {
    const leereProjektId = await entferneAsset("  ", "a-mitte");
    const leereAssetId = await entferneAsset("p1", "");
    const keinString = await entferneAsset("p1", 42 as unknown as string);

    for (const ergebnis of [leereProjektId, leereAssetId, keinString]) {
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      }
    }
    expect(projekt.assets).toHaveLength(3);
    expect(zustand.geflusht).toEqual([]);
  });

  it("blockiert, wenn nur eine AKTION ueber bildRef auf das Asset zeigt", async () => {
    // Entschieden am 12.08.2026. Vorher wurde nur die Wiedergabeliste geprueft - ein Bild,
    // auf das nur eine Aktion zeigte, liess sich loeschen, und die Aktion zeigte danach ins
    // Leere. Das ist NICHT der Fall aus TK 9.8.5, wo der Eintrag noch existiert.
    projekt.aktionen = [
      {
        id: "akt-1",
        titel: "Sommeraktion",
        beschreibung: null,
        preis: null,
        bildRef: "a-mitte",
        cta: null,
        standardDauer: null,
        vorlagenId: "vollbild",
        akzentfarbe: null,
      },
    ];

    const ergebnis = await entferneAsset("p1", "a-mitte");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("asset_referenziert");
    expect(ergebnis.fehler.daten).toEqual({ referenzenIds: ["akt-1"] });
    // Nichts entfernt, nichts geschrieben.
    expect(projekt.assets.map((a) => a.id)).toEqual(["a-erst", "a-mitte", "a-letzt"]);
    expect(zustand.geflusht).toEqual([]);
  });
});
