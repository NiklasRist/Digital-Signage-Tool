import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AutoSpeichernEreignis } from "../../src/main/project-store/auto-speichern";
import type { Project } from "../../src/shared/contracts/project";

// Verhaltenstests zum Auto-Speichern (#47): Was landet WANN und WIE OFT auf der
// Platte, und was wird gemeldet - nicht, was die Deklarationen behaupten.
//
// `schreibeProjekt` (#46) ist gemockt: Geprueft wird die Terminplanung, nicht das
// atomare Schreiben (das hat seinen eigenen Test). Der Mock zaehlt die Aufrufe und
// kann auf Kommando scheitern - der Fehlerfall (volle Platte) ist auf einer echten
// Platte nicht herstellbar. `holeAktivesProjekt` (#192) ist gemockt, weil sein Rumpf
// noch wirft (M6).
//
// Die Zeit ist kuenstlich (vi.useFakeTimers): Die Entprellung dauert 4 s, die
// Wiederholung 5 s - echtes Warten machte den Lauf langsam und wackelig.
const zustand = vi.hoisted(() => ({
  geschrieben: [] as unknown[],
  /** So viele der naechsten Schreibversuche scheitern mit speicher_fehler. */
  fehlschlaege: 0,
  aktivesProjekt: null as unknown,
}));

vi.mock("../../src/main/project-store/schreibe-projekt", () => ({
  schreibeProjekt: async (projekt: unknown) => {
    zustand.geschrieben.push(projekt);
    if (zustand.fehlschlaege > 0) {
      zustand.fehlschlaege -= 1;
      return { ok: false, fehler: { code: "speicher_fehler", meldung: "Platte voll" } };
    }
    return { ok: true, wert: undefined };
  },
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: () => zustand.aktivesProjekt,
}));

const PROJEKT: Project = {
  id: "p1",
  name: "Studio Nord",
  erstelltAm: "2026-08-12T08:00:00.000Z",
  geaendertAm: "2026-08-12T08:00:00.000Z",
  schemaVersion: 1,
  assets: [],
  aktionen: [],
  liste: [],
  letzterAusgabeName: null,
};

// Das Modul haelt seinen Zustand modulweit (Termin, vorgemerkter Stand, Fehlerlage).
// Jeder Test bekommt deshalb eine frische Fassung.
async function ladeModul() {
  vi.resetModules();
  return import("../../src/main/project-store/auto-speichern");
}

beforeEach(() => {
  vi.useFakeTimers();
  zustand.geschrieben = [];
  zustand.fehlschlaege = 0;
  zustand.aktivesProjekt = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Auto-Speichern (#47)", () => {
  it("schreibt bei mehreren Aenderungen innerhalb der Entprellung nur EINMAL", async () => {
    const { planeAutoSpeicherung } = await ladeModul();

    // Drei Zuege am Dauer-Regler in derselben Sekunde.
    planeAutoSpeicherung(PROJEKT);
    planeAutoSpeicherung(PROJEKT);
    planeAutoSpeicherung(PROJEKT);

    await vi.advanceTimersByTimeAsync(2000);
    expect(zustand.geschrieben).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(3000);
    expect(zustand.geschrieben).toEqual([PROJEKT]);
  });

  it("schreibt mit sofortFlush sofort und laesst den laufenden Termin nicht nachfeuern", async () => {
    const { planeAutoSpeicherung, sofortFlush } = await ladeModul();

    planeAutoSpeicherung(PROJEKT);
    // Das D1-Lock nimmt laut Vertrag der Aufrufer (#32/#47); fuer diese Zusage ist es
    // ohne Belang, hier laeuft ohnehin nur ein Schreibvorgang.
    const ergebnis = await sofortFlush(PROJEKT);

    expect(ergebnis.ok).toBe(true);
    expect(zustand.geschrieben).toHaveLength(1);

    // Waere der Termin nicht abgebrochen, kaeme jetzt ein zweiter, ueberfluessiger Lauf.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(zustand.geschrieben).toHaveLength(1);
  });

  it("meldet einen Fehlschlag, behaelt den Stand und wiederholt bis zum Erfolg", async () => {
    zustand.fehlschlaege = 1;
    const { planeAutoSpeicherung, aufAutoSpeichernEreignis } = await ladeModul();

    const gemeldet: AutoSpeichernEreignis[] = [];
    aufAutoSpeichernEreignis((ereignis) => gemeldet.push(ereignis));

    planeAutoSpeicherung(PROJEKT);
    await vi.advanceTimersByTimeAsync(4000);

    expect(gemeldet).toEqual([{ typ: "fehler", code: "speicher_fehler" }]);
    // Kein Rollback, kein Verwerfen: derselbe Stand geht in den Wiederholversuch.
    expect(zustand.geschrieben).toEqual([PROJEKT]);

    await vi.advanceTimersByTimeAsync(5000);

    expect(zustand.geschrieben).toEqual([PROJEKT, PROJEKT]);
    expect(gemeldet).toEqual([
      { typ: "fehler", code: "speicher_fehler" },
      { typ: "gespeichert" },
    ]);
  });

  it("meldet einem abgemeldeten Hoerer nichts mehr", async () => {
    zustand.fehlschlaege = 1;
    const { planeAutoSpeicherung, aufAutoSpeichernEreignis } = await ladeModul();

    const gemeldet: AutoSpeichernEreignis[] = [];
    const abmelden = aufAutoSpeichernEreignis((ereignis) => gemeldet.push(ereignis));
    abmelden();

    planeAutoSpeicherung(PROJEKT);
    await vi.advanceTimersByTimeAsync(4000);

    expect(zustand.geschrieben).toHaveLength(1);
    expect(gemeldet).toEqual([]);
  });

  it("flushBeimBeenden schreibt den aktiven Stand und reicht dessen Fehler durch", async () => {
    zustand.aktivesProjekt = PROJEKT;
    zustand.fehlschlaege = 1;
    const { flushBeimBeenden } = await ladeModul();

    const gescheitert = await flushBeimBeenden();
    expect(gescheitert.ok).toBe(false);
    if (!gescheitert.ok) {
      expect(gescheitert.fehler.code).toBe("speicher_fehler");
    }

    // Der Beenden-Ablauf (#3) darf es erneut versuchen; dann gelingt es.
    const gelungen = await flushBeimBeenden();
    expect(gelungen.ok).toBe(true);
    expect(zustand.geschrieben).toEqual([PROJEKT, PROJEKT]);
  });

  it("flushBeimBeenden ohne offenes Projekt ist ein Erfolg ohne Schreibvorgang", async () => {
    zustand.aktivesProjekt = null;
    const { flushBeimBeenden } = await ladeModul();

    const ergebnis = await flushBeimBeenden();

    expect(ergebnis.ok).toBe(true);
    expect(zustand.geschrieben).toEqual([]);
  });
});
