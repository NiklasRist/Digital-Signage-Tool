// Verhaltenstest zu #151 - das Abonnieren von Ereignissen des Main-Prozesses (TK 9.1.1).
import { afterEach, describe, expect, it, vi } from "vitest";

import { abonniere } from "../../src/renderer/ipc-client/ereignisse";

/**
 * Doppel der Preload-Bruecke (#4) mit dem Verhalten, das #151 voraussetzt: je
 * Registrierung ein eigener Hoerer und eine eigene Abmelde-Funktion, die genau diesen
 * einen entfernt.
 *
 * Die Zustellung faengt ABSICHTLICH NICHT - sonst pruefte der Wurf-Test das Doppel
 * statt die Datei. Genau so verhaelt sich der Ereignis-Verteiler der Plattform: Ein
 * durchgereichter Wurf braeche die Schleife ab, und die spaeter registrierten Hoerer
 * desselben Kanals bekaemen ihre Meldung nicht mehr.
 */
function bruecke() {
  const hoerende = new Map<string, Array<(daten: unknown) => void>>();
  const abmeldungen = vi.fn();

  const on = vi.fn((kanal: string, handler: (daten: unknown) => void) => {
    const liste = hoerende.get(kanal) ?? [];
    liste.push(handler);
    hoerende.set(kanal, liste);
    return () => {
      abmeldungen();
      hoerende.set(
        kanal,
        (hoerende.get(kanal) ?? []).filter((eintrag) => eintrag !== handler),
      );
    };
  });

  vi.stubGlobal("window", { api: { on } });

  return {
    on,
    abmeldungen,
    /** Sendet wie der Main: ohne Huelle, ohne Umformung. */
    sende(kanal: string, daten: unknown) {
      for (const handler of hoerende.get(kanal) ?? []) {
        handler(daten);
      }
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("abonniere (#151)", () => {
  it("registriert genau einmal, mit dem Kanalnamen unveraendert", () => {
    const b = bruecke();

    const ab = abonniere<number>("test:kanal", () => {});

    expect(b.on).toHaveBeenCalledTimes(1);
    expect(b.on.mock.calls[0]?.[0]).toBe("test:kanal");
    // Die Rueckgabe ist eine Funktion - keine Ergebnis-Huelle, kein Promise.
    expect(typeof ab).toBe("function");
  });

  it("reicht die Nutzlast unveraendert durch - auch wenn sie wie eine Huelle aussieht", () => {
    const b = bruecke();
    const gesehen: unknown[] = [];
    const nutzlast = { ok: true, wert: 1 };

    abonniere<unknown>("test:kanal", (n) => gesehen.push(n));
    b.sende("test:kanal", nutzlast);

    // toBe, nicht toEqual: Es wird nichts ausgepackt und nicht einmal umkopiert.
    expect(gesehen).toHaveLength(1);
    expect(gesehen[0]).toBe(nutzlast);
  });

  it("reicht auch undefined durch, statt ein Ersatzobjekt einzusetzen", () => {
    const b = bruecke();
    const gesehen: unknown[] = [];

    abonniere<undefined>("test:kanal", (n) => gesehen.push(n));
    b.sende("test:kanal", undefined);

    expect(gesehen).toEqual([undefined]);
  });

  it("beendet das Abo: Bruecken-Abmeldung genau einmal, danach kommt nichts mehr an", () => {
    const b = bruecke();
    const hoerer = vi.fn();

    const ab = abonniere<number>("test:kanal", hoerer);
    b.sende("test:kanal", 1);
    ab();
    b.sende("test:kanal", 2);

    expect(hoerer).toHaveBeenCalledTimes(1);
    expect(b.abmeldungen).toHaveBeenCalledTimes(1);
  });

  it("laesst sich mehrfach abmelden, ohne zu werfen und ohne zweite Abmeldung", () => {
    // React-Aufraeumfunktionen laufen in der Entwicklung doppelt.
    const b = bruecke();

    const ab = abonniere<number>("test:kanal", () => {});
    ab();
    expect(() => {
      ab();
      ab();
    }).not.toThrow();

    expect(b.abmeldungen).toHaveBeenCalledTimes(1);
  });

  it("haelt zwei Abos desselben Kanals auseinander", () => {
    const b = bruecke();
    const ersterHoerer = vi.fn();
    const zweiterHoerer = vi.fn();

    const ersterAb = abonniere<number>("test:kanal", ersterHoerer);
    abonniere<number>("test:kanal", zweiterHoerer);
    b.sende("test:kanal", 1);
    ersterAb();
    b.sende("test:kanal", 2);

    expect(ersterHoerer).toHaveBeenCalledTimes(1);
    expect(zweiterHoerer).toHaveBeenCalledTimes(2);
    expect(zweiterHoerer).toHaveBeenLastCalledWith(2);
  });

  it("faengt einen werfenden Hoerer, ohne die uebrigen um ihre Meldung zu bringen", () => {
    const b = bruecke();
    const protokoll = vi.spyOn(console, "error").mockImplementation(() => {});
    const werfer = vi.fn(() => {
      throw new Error("Anzeigefehler");
    });
    const nachbar = vi.fn();

    abonniere<number>("test:kanal", werfer);
    abonniere<number>("test:kanal", nachbar);

    // Weder verlaesst die Ausnahme den Handler ...
    expect(() => b.sende("test:kanal", 1)).not.toThrow();
    // ... noch verliert das zweite Abo desselben Kanals seine Meldung ...
    expect(nachbar).toHaveBeenCalledTimes(1);

    // ... und der werfende Hoerer bleibt fuer spaetere Ereignisse angemeldet.
    b.sende("test:kanal", 2);
    expect(werfer).toHaveBeenCalledTimes(2);
    expect(protokoll).toHaveBeenCalledTimes(2);
  });

  it("wirft beim Anmelden, wenn die Bruecke fehlt - statt fuer immer zu schweigen", () => {
    // Dieselbe Antwort wie in #24: ein Verdrahtungsfehler in #3/#4 muss auffallen.
    vi.stubGlobal("window", {});

    expect(() => abonniere<number>("test:kanal", () => {})).toThrow(/window\.api/);
  });
});
