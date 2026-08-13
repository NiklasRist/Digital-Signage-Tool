import { beforeEach, describe, expect, it, vi } from "vitest";

import { fuegeAssetHinzu } from "../../src/main/project-store/assets";

import type { Asset } from "../../src/shared/contracts/asset";
import type { Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu fuegeAssetHinzu (#72): WAS steht danach im Projekt, WANN meldet die Funktion
// Erfolg, und was bleibt nach einem Fehlschlag zurueck.
//
// Drei Nachbarn sind gemockt, jeder aus einem eigenen Grund:
//   - `auto-speichern` (#47), weil der Fehlerfall (volle Platte) auf einer echten Platte nicht
//     herstellbar ist und weil geprueft werden soll, WIE OFT und WOMIT geflusht wird;
//   - `aktives-projekt` (#192), weil der Halter modulweiten Zustand fuehrt, den jeder Test frisch
//     belegen koennen muss;
//   - `d1-lock` (#32), weil die Zusage "alles in EINEM Lock-Abschnitt" nur von aussen sichtbar
//     ist. Der Mock fuehrt die Aktion echt aus und merkt sich nur, ob er gerade drin ist - die
//     Serialisierung selbst hat ihren eigenen Test.
const zustand = vi.hoisted(() => ({
  aktivesProjekt: null as unknown,
  /** Aufrufe von sofortFlush - je Eintrag das uebergebene Projekt. */
  geflusht: [] as unknown[],
  /** Aufrufe von planeAutoSpeicherung. Muss leer bleiben. */
  entprellt: [] as unknown[],
  lockAufrufe: 0,
  /** Laeuft gerade eine an mitD1Lock uebergebene Aktion? */
  imLock: false,
  /** War beim Flush ein Lock-Abschnitt offen? */
  flushImLock: [] as boolean[],
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
    zustand.imLock = true;
    try {
      return await aktion();
    } finally {
      zustand.imLock = false;
    }
  },
}));

function neuesAsset(ueberschreibung: Partial<Asset> = {}): Asset {
  return {
    id: "a-neu",
    typ: "video",
    dateiname: "8f1c2b3d-0000-4000-8000-000000000001.mp4",
    originalname: "Werbung Sommer.MP4",
    maße: { breite: 1920, höhe: 1080 },
    dauer: 12.5,
    importdatum: "2026-08-13T09:00:00.000Z",
    zustand: "ok",
    ...ueberschreibung,
  };
}

const VORHANDEN: Asset = neuesAsset({ id: "a-alt", dateiname: "alt.mp4" });

function neuesProjekt(): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [VORHANDEN],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  };
}

let projekt: Project;

beforeEach(() => {
  projekt = neuesProjekt();
  zustand.aktivesProjekt = projekt;
  zustand.geflusht = [];
  zustand.entprellt = [];
  zustand.lockAufrufe = 0;
  zustand.imLock = false;
  zustand.flushImLock = [];
  zustand.flushAntwort = null;
  zustand.flushBremse = null;
});

describe("fuegeAssetHinzu (#72) - Erfolgsfall", () => {
  it("haengt hinten an, flusht genau einmal im Lock und liefert das uebergebene Asset", async () => {
    const asset = neuesAsset();

    const ergebnis = await fuegeAssetHinzu("p1", asset);

    expect(ergebnis).toEqual({ ok: true, wert: asset });
    // Dieselbe Objektreferenz, keine Kopie - sonst laufen Aufrufer und Store auseinander.
    if (ergebnis.ok) {
      expect(ergebnis.wert).toBe(asset);
    }
    expect(projekt.assets).toEqual([VORHANDEN, asset]);

    expect(zustand.geflusht).toEqual([projekt]);
    // Seit dem 12.08.2026 wird die Aenderung ZUERST angemeldet und dann sofort geschrieben:
    // planeAutoSpeicherung (#47) ist der eine Ort, an dem `geaendertAm` fortgeschrieben wird,
    // und sofortFlush stempelt nicht. Ohne die Anmeldung truege project.json nach einem
    // Auftrag das alte Aenderungsdatum. Der gesetzte Entprellungstermin ist unschaedlich -
    // sofortFlush bricht ihn als Erstes ab.
    expect(zustand.entprellt).toEqual([projekt]);
    expect(zustand.lockAufrufe).toBe(1);
    // Der Flush lief INNERHALB der an mitD1Lock uebergebenen Aktion.
    expect(zustand.flushImLock).toEqual([true]);
  });

  it("kehrt erst zurueck, wenn der Flush aufgeloest ist", async () => {
    let loese: () => void = () => {};
    zustand.flushBremse = new Promise<void>((auf) => {
      loese = auf;
    });

    let fertig = false;
    const laeuft = fuegeAssetHinzu("p1", neuesAsset()).then((wert) => {
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
});

describe("fuegeAssetHinzu (#72) - Fehlerfaelle", () => {
  it("nimmt das Anhaengen zurueck, wenn der Flush scheitert", async () => {
    const vorher = structuredClone(projekt.assets);
    zustand.flushAntwort = {
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    };

    const ergebnis = await fuegeAssetHinzu("p1", neuesAsset());

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
    }
    expect(projekt.assets).toEqual(vorher);
  });

  it("weist eine bereits vergebene Asset-ID ab, ohne zu ueberschreiben oder zu flushen", async () => {
    const ergebnis = await fuegeAssetHinzu("p1", neuesAsset({ id: "a-alt" }));

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      // Die Meldung nennt die doppelte ID, damit der media-service sie zuordnen kann.
      expect(ergebnis.fehler.meldung).toContain("a-alt");
    }
    expect(projekt.assets).toEqual([VORHANDEN]);
    expect(zustand.geflusht).toEqual([]);
  });

  it.each(["a/b.mp4", "a\\b.mp4", "../x.mp4", ""])(
    "weist den Dateinamen %j als Verzeichnisanteil ab",
    async (dateiname) => {
      const ergebnis = await fuegeAssetHinzu("p1", neuesAsset({ dateiname }));

      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      }
      expect(projekt.assets).toEqual([VORHANDEN]);
      expect(zustand.geflusht).toEqual([]);
    },
  );

  it("weist einen unbekannten Medientyp und eine leere Asset-ID ab", async () => {
    const falscherTyp = await fuegeAssetHinzu(
      "p1",
      neuesAsset({ typ: "audio" as unknown as Asset["typ"] }),
    );
    const leereId = await fuegeAssetHinzu("p1", neuesAsset({ id: "  " }));

    expect(falscherTyp.ok).toBe(false);
    expect(leereId.ok).toBe(false);
    expect(projekt.assets).toEqual([VORHANDEN]);
    expect(zustand.geflusht).toEqual([]);
  });

  it("unterscheidet Formfehler der projektId von einem fremden Projekt", async () => {
    const leer = await fuegeAssetHinzu("", neuesAsset());
    const keinString = await fuegeAssetHinzu(42 as unknown as string, neuesAsset());
    const fremd = await fuegeAssetHinzu("p2", neuesAsset());

    expect(leer.ok).toBe(false);
    if (!leer.ok) expect(leer.fehler.code).toBe("ungueltige_eingabe");
    expect(keinString.ok).toBe(false);
    if (!keinString.ok) expect(keinString.fehler.code).toBe("ungueltige_eingabe");
    // Ein unbekanntes Projekt ist ein fachlicher Zustand, kein Formfehler - der media-service
    // muss die beiden auseinanderhalten koennen.
    expect(fremd.ok).toBe(false);
    if (!fremd.ok) expect(fremd.fehler.code).toBe("nicht_gefunden");

    expect(projekt.assets).toEqual([VORHANDEN]);
    expect(zustand.geflusht).toEqual([]);
  });

  // Zwei Faelle, zwei Codes - seit dem 13.08.2026 getrennt. Ein gemeinsamer Code waere
  // nicht falsch, aber unbrauchbar: "oeffne ein Projekt" richtet sich an den Nutzer,
  // "du nennst das falsche Projekt" an den Aufrufer.
  it("unterscheidet kein Projekt offen von fremdem Projekt", async () => {
    zustand.aktivesProjekt = null;
    const ohneProjekt = await fuegeAssetHinzu("p1", neuesAsset());
    expect(ohneProjekt.ok).toBe(false);
    if (!ohneProjekt.ok) {
      expect(ohneProjekt.fehler.code).toBe("kein_projekt");
    }

    zustand.aktivesProjekt = projekt;
    const fremd = await fuegeAssetHinzu("p2", neuesAsset());
    expect(fremd.ok).toBe(false);
    if (!fremd.ok) {
      expect(fremd.fehler.code).toBe("nicht_gefunden");
    }

    expect(zustand.geflusht).toEqual([]);
  });
});
