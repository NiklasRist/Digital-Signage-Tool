import { beforeEach, describe, expect, it, vi } from "vitest";

import { setzeAssetZustand } from "../../src/main/project-store/assets";

import type { Asset } from "../../src/shared/contracts/asset";
import type { Project } from "../../src/shared/contracts/project";

// Verhaltenstests zu setzeAssetZustand (#74): WELCHES Feld sich aendert, WANN eine Speicherung
// geplant wird - und wann ausdruecklich keine.
//
// Gemockt sind dieselben drei Nachbarn wie bei den anderen Asset-Operationen: `auto-speichern`
// (#47), weil hier gezaehlt wird, wie oft die entprellte Speicherung angestossen wird und dass
// der Sofort-Flush NIE laeuft; `aktives-projekt` (#192), weil der Halter modulweiten Zustand
// fuehrt; `d1-lock` (#32), weil "alles in EINEM Lock-Abschnitt" von aussen sonst unsichtbar ist.
const zustand = vi.hoisted(() => ({
  aktivesProjekt: null as Project | null,
  /** Aufrufe von planeAutoSpeicherung - je Eintrag das uebergebene Projekt. */
  entprellt: [] as unknown[],
  /** Aufrufe von sofortFlush. Muss leer bleiben: Der Reconcile ist kein Auftrag. */
  geflusht: [] as unknown[],
  lockAufrufe: 0,
  imLock: false,
  /** War beim Planen der Speicherung ein Lock-Abschnitt offen? */
  planImLock: [] as boolean[],
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: () => zustand.aktivesProjekt,
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: unknown) => {
    zustand.entprellt.push(projekt);
    zustand.planImLock.push(zustand.imLock);
  },
  sofortFlush: async (projekt: unknown) => {
    zustand.geflusht.push(projekt);
    return { ok: true, wert: undefined };
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

function neuesAsset(id: string, wert: Asset["zustand"] = "ok"): Asset {
  return {
    id,
    typ: "video",
    dateiname: `${id}.mp4`,
    originalname: "Werbung Sommer.MP4",
    maße: { breite: 1920, höhe: 1080 },
    dauer: 12.5,
    importdatum: "2026-08-13T09:00:00.000Z",
    zustand: wert,
  };
}

let projekt: Project;

beforeEach(() => {
  projekt = {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [neuesAsset("a-eins"), neuesAsset("a-zwei"), neuesAsset("a-drei", "fehlt")],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  };
  zustand.aktivesProjekt = projekt;
  zustand.entprellt = [];
  zustand.geflusht = [];
  zustand.lockAufrufe = 0;
  zustand.imLock = false;
  zustand.planImLock = [];
});

describe("setzeAssetZustand (#74) - Erfolgsfall", () => {
  it("setzt genau das Feld zustand und plant die entprellte Speicherung einmal", async () => {
    const vorher = structuredClone(projekt.assets);

    const ergebnis = await setzeAssetZustand("p1", "a-zwei", "fehlt");

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    // Nur `zustand` des einen Assets weicht ab - alle uebrigen Felder und alle anderen Assets
    // stehen unveraendert da.
    expect(projekt.assets).toEqual(
      vorher.map((a) => (a.id === "a-zwei" ? { ...a, zustand: "fehlt" } : a)),
    );

    expect(zustand.entprellt).toEqual([projekt]);
    expect(zustand.planImLock).toEqual([true]);
    // Kein Sofort-Flush: Der Reconcile ist keiner der vier Anlaesse aus TK 9.5.4.
    expect(zustand.geflusht).toEqual([]);
    expect(zustand.lockAufrufe).toBe(1);
  });

  it("setzt ein als fehlt markiertes Asset wieder auf ok", async () => {
    const ergebnis = await setzeAssetZustand("p1", "a-drei", "ok");

    expect(ergebnis.ok).toBe(true);
    expect(projekt.assets.map((a) => a.zustand)).toEqual(["ok", "ok", "ok"]);
    expect(zustand.entprellt).toHaveLength(1);
  });

  it("meldet Erfolg ohne Speicherung, wenn der Zustand schon stimmt", async () => {
    // Der Reconcile laeuft bei JEDEM Projektstart ueber ALLE Assets - plante er dabei jedes Mal
    // eine Speicherung, waere geaendertAm nach jedem Blick ins Projekt neu.
    const unveraendert = await setzeAssetZustand("p1", "a-eins", "ok");
    const auchUnveraendert = await setzeAssetZustand("p1", "a-drei", "fehlt");

    expect(unveraendert.ok).toBe(true);
    expect(auchUnveraendert.ok).toBe(true);
    expect(zustand.entprellt).toEqual([]);
    expect(projekt.assets.map((a) => a.zustand)).toEqual(["ok", "ok", "fehlt"]);
  });
});

describe("setzeAssetZustand (#74) - Fehlerfaelle", () => {
  it("weist einen unbekannten Zustandswert ab, ohne etwas zu aendern", async () => {
    const ergebnis = await setzeAssetZustand(
      "p1",
      "a-eins",
      "unbekannt" as unknown as Asset["zustand"],
    );

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(projekt.assets.map((a) => a.zustand)).toEqual(["ok", "ok", "fehlt"]);
    expect(zustand.entprellt).toEqual([]);
  });

  it("meldet nicht_gefunden bei unbekannter Asset-ID und fremdem Projekt", async () => {
    const unbekannt = await setzeAssetZustand("p1", "a-gibtsnicht", "fehlt");
    const fremd = await setzeAssetZustand("p2", "a-eins", "fehlt");

    for (const ergebnis of [unbekannt, fremd]) {
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe("nicht_gefunden");
      }
    }
    expect(projekt.assets.map((a) => a.zustand)).toEqual(["ok", "ok", "fehlt"]);
    expect(zustand.entprellt).toEqual([]);
  });

  // Seit dem 13.08.2026 ein eigener Code. Wichtig gerade hier: Der Reconcile laeuft beim
  // Projektstart - ein `kein_projekt` bedeutet, dass er zu frueh dran war, und das ist ein
  // anderer Befund als eine unbekannte Medien-ID.
  it("meldet kein_projekt, wenn ueberhaupt kein Projekt geladen ist", async () => {
    zustand.aktivesProjekt = null;

    const ergebnis = await setzeAssetZustand("p1", "a-eins", "fehlt");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("kein_projekt");
    }
    expect(projekt.assets.map((a) => a.zustand)).toEqual(["ok", "ok", "fehlt"]);
    expect(zustand.entprellt).toEqual([]);
  });

  it("meldet ungueltige_eingabe bei formal unbrauchbaren IDs", async () => {
    const leereProjektId = await setzeAssetZustand("", "a-eins", "fehlt");
    const leereAssetId = await setzeAssetZustand("p1", "   ", "fehlt");

    for (const ergebnis of [leereProjektId, leereAssetId]) {
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      }
    }
    expect(zustand.entprellt).toEqual([]);
  });
});
