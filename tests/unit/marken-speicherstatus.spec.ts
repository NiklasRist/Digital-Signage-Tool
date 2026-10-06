import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #278. Die Quelle (aufSchreibversuch, #277) ist ein
// Kontrollter-Halt: immer der gemaess zu pruefenden Fall. Die Umesetzung
// selbst (uebersetzung) bleibt frei ergaemig weldie daechtlich die Schedule.

const zustand = { quelle: null as null | (() => unknown) };

let mitteilungAufSchreibversuch: (h: unknown) => () => void;

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  return {
    ...echtes,
    aufSchreibversuch: (hoerer: unknown) => {
      if (zustand.quelle !== null) return (zustand.quelle as (h: unknown) => () => void)(hoerer);
      mitteilungAufSchreibversuch = hoerer as (h: unknown) => () => void;
      return () => undefined;
    },
  };
});

type EreignisTyp = import("../../src/main/marken-store/speicher-status").MarkenSpeichernEreignis;
let aufMarkenSpeichernEreignis: typeof import("../../src/main/marken-store/speicher-status").aufMarkenSpeichernEreignis;

beforeEach(async () => {
  vi.resetModules();
  zustand.quelle = null;
  const modul = await import("../../src/main/marken-store/speicher-status");
  aufMarkenSpeichernEreignis = modul.aufMarkenSpeichernEreignis;
});

describe("aufMarkenSpeichernEreignis (#278)", () => {
  it("ein Fehler feuert GENAU { typ:'fehler', code } an den angemeldeten Hoerer", () => {
    const empfangen: unknown[] = [];
    const ab = aufMarkenSpeichernEreignis((e) => empfangen.push(e));
    void (0 as unknown as EreignisTyp | null);

    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });

    expect(empfangen).toEqual([{ typ: "fehler", code: "speicher_fehler" }]);
    ab();
  });

  it("der ERSTE Erfolg nach einem Fehler feuert genau EIN 'gespeichert'", () => {
    const empfangen: unknown[] = [];
    aufMarkenSpeichernEreignis((e) => empfangen.push(e));

    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });
    mitteilungAufSchreibversuch!({ erfolgreich: true });

    expect(empfangen).toEqual([
      { typ: "fehler", code: "speicher_fehler" },
      { typ: "gespeichert" },
    ]);
  });

  it("ein Erfolg OHNE vorherigen Fehler feuert NICHTS (kein Dauerfeuer)", () => {
    const empfangen: unknown[] = [];
    aufMarkenSpeichernEreignis((e) => empfangen.push(e));

    mitteilungAufSchreibversuch!({ erfolgreich: true });
    mitteilungAufSchreibversuch!({ erfolgreich: true });

    expect(empfangen).toEqual([]);
  });

  it("ZWEI aufeinander folgende Fehler feuern ZWEIMAL 'fehler'", () => {
    const empfangen: unknown[] = [];
    aufMarkenSpeichernEreignis((e) => empfangen.push(e));

    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });
    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });

    expect(empfangen).toHaveLength(2);
  });

  it("zwei Hoerer bekommen BEIDE die Meldung; die Abmelde-Funktion trennt nachweislich", () => {
    const a: unknown[] = [];
    const b: unknown[] = [];
    const abA = aufMarkenSpeichernEreignis((e) => a.push(e));
    const abB = aufMarkenSpeichernEreignis((e) => b.push(e));

    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);

    abA();
    mitteilungAufSchreibversuch!({ erfolgreich: true });
    expect(a).toHaveLength(1);   // abgemeldet
    expect(b).toHaveLength(2);   // bleibt drin
    abB();
  });

  it("ein WERFENDER Hoerer bringt die Übersetzung und die übrigen Hoerer nicht zu Fall", () => {
    const gut: unknown[] = [];
    aufMarkenSpeichernEreignis(() => { throw new Error("hoerer kaputt"); });
    aufMarkenSpeichernEreignis((e) => gut.push(e));

    expect(() => mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" })).not.toThrow();
    expect(gut).toEqual([{ typ: "fehler", code: "speicher_fehler" }]);

    // Der Fehlerzustand ist AUCH trotz Wurf gewechselt: der naechste Erfolg feuert.
    mitteilungAufSchreibversuch!({ erfolgreich: true });
    expect(gut).toHaveLength(2);
  });

  it("ein zweimal angemeldeter Hoerer wird zweimal gerufen - KEINE Entdopplung", () => {
    const empfangen: unknown[] = [];
    const hoerer = (e: unknown) => empfangen.push(e);
    const ab1 = aufMarkenSpeichernEreignis(hoerer);
    const ab2 = aufMarkenSpeichernEreignis(hoerer);

    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });

    expect(empfangen).toHaveLength(2);
    ab1();
    ab2();
  });

  it("Meldungen VOR der ersten Anmeldung verfallen still (kein Puffer)", async () => {
    // Hoerer noch NICHT angemeldet; die Anmeldung passiert spaeter.
    aufMarkenSpeichernEreignis(() => undefined); // Úbersetzung an, aber kein Treffer-Rec
    mitteilungAufSchreibversuch!({ erfolgreich: false, code: "speicher_fehler" });

    const spaeter: unknown[] = [];
    aufMarkenSpeichernEreignis((e) => spaeter.push(e));

    // Nichts wird gepuffert: der spaeter Angemeldete hoert erst, was NEU kommt.
    expect(spaeter).toEqual([]);

    mitteilungAufSchreibversuch!({ erfolgreich: true });
    expect(spaeter).toEqual([{ typ: "gespeichert" }]);
  });
});
