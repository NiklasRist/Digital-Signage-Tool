// Unit-Test zu #194 – der Reiter-Zustand der app-shell.
//
// Die Datei ist reiner Renderer-Zustand ohne IPC, ohne Ergebnis<T> und ohne JSX –
// alles, was die DoD hier verlangt, ist ohne Browser in einer Node-Umgebung
// pruefbar. Der Modul-Zustand lebt zwischen den Tests weiter; deshalb setzt
// `beforeEach` ihn ueber `setzeReiterZustandZurueck()` zurueck. Genau dafuer
// existiert diese Funktion (ENTSCHIEDEN: NUR fuer Tests).
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  REITER_NACH_PROJEKT_OEFFNEN,
  REITER_REIHENFOLGE,
  START_REITER_OHNE_PROJEKT,
  aufReiterGeaendert,
  holeReiter,
  istGueltigerReiter,
  setzeReiterZustandZurueck,
  wechsleReiter,
} from "../../src/renderer/app-shell/reiter";

const QUELLE = readFileSync(
  new URL("../../src/renderer/app-shell/reiter.ts", import.meta.url),
  "utf8",
);

// Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split("\n")
  .filter((z) => {
    const t = z.trim();
    return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

beforeEach(() => {
  setzeReiterZustandZurueck();
});

describe("Konstanten und Anfangswert (DoD)", () => {
  it("liefert holeReiter() vor jedem wechsleReiter den Wert 'projekte' (DoD)", () => {
    expect(holeReiter()).toBe("projekte");
  });

  it("startet den Zustand auf START_REITER_OHNE_PROJEKT", () => {
    expect(START_REITER_OHNE_PROJEKT).toBe("projekte");
    expect(holeReiter()).toBe(START_REITER_OHNE_PROJEKT);
  });

  it("waermt REITER_NACH_PROJEKT_OEFFNEN auf 'zusammenstellen'", () => {
    expect(REITER_NACH_PROJEKT_OEFFNEN).toBe("zusammenstellen");
  });

  it("enthaelt REITER_REIHENFOLGE genau die vier Werte in Skizzen-Reihenfolge (DoD)", () => {
    expect(REITER_REIHENFOLGE).toEqual([
      "zusammenstellen",
      "aktionen",
      "vorlagen",
      "projekte",
    ]);
  });
});

describe("wechsleReiter (DoD)", () => {
  it("aendert holeReiter() auf 'aktionen' und ruft jeden Hoerer genau einmal mit 'aktionen' (DoD)", () => {
    const erster = vi.fn();
    const zweiter = vi.fn();
    aufReiterGeaendert(erster);
    aufReiterGeaendert(zweiter);

    wechsleReiter("aktionen");

    expect(holeReiter()).toBe("aktionen");
    expect(erster).toHaveBeenCalledTimes(1);
    expect(erster).toHaveBeenCalledWith("aktionen");
    expect(zweiter).toHaveBeenCalledTimes(1);
    expect(zweiter).toHaveBeenCalledWith("aktionen");
  });

  it("ruft beim Wechsel auf den bereits aktiven Reiter keinen Hoerer (DoD)", () => {
    const spion = vi.fn();
    aufReiterGeaendert(spion);

    wechsleReiter("aktionen");
    expect(spion).toHaveBeenCalledTimes(1);

    wechsleReiter("aktionen");
    expect(spion).toHaveBeenCalledTimes(1);
  });

  it("ruft die Hoerer in Anmeldereihenfolge (ENTSCHIEDEN 7)", () => {
    const reihenfolge: string[] = [];
    aufReiterGeaendert(() => reihenfolge.push("erster"));
    aufReiterGeaendert(() => reihenfolge.push("zweiter"));
    aufReiterGeaendert(() => reihenfolge.push("dritter"));

    wechsleReiter("vorlagen");

    expect(reihenfolge).toEqual(["erster", "zweiter", "dritter"]);
  });
});

describe("aufReiterGeaendert (DoD)", () => {
  it("ruft den Hoerer beim Anmelden NICHT sofort (DoD)", () => {
    const spion = vi.fn();
    aufReiterGeaendert(spion);
    expect(spion).toHaveBeenCalledTimes(0);
  });

  it("beendet die Abmelde-Funktion das Abo; der zweite Aufruf wirft nicht und laesst andere Abos unberuehrt (DoD)", () => {
    const bleibt = vi.fn();
    const weg = vi.fn();
    aufReiterGeaendert(bleibt);
    const abmelden = aufReiterGeaendert(weg);

    abmelden();
    expect(() => abmelden()).not.toThrow();

    wechsleReiter("aktionen");
    expect(weg).toHaveBeenCalledTimes(0);
    expect(bleibt).toHaveBeenCalledTimes(1);
    expect(bleibt).toHaveBeenCalledWith("aktionen");
  });
});

describe("werfende und sich abmeldende Hoerer (DoD)", () => {
  it("verhindert ein werfender Hoerer nicht, dass ein danach angemeldeter gerufen wird, und wechsleReiter wirft nicht nach aussen (DoD)", () => {
    const werfender = vi.fn(() => {
      throw new Error("Anzeigefehler");
    });
    const gesunder = vi.fn();
    aufReiterGeaendert(werfender);
    aufReiterGeaendert(gesunder);

    expect(() => wechsleReiter("aktionen")).not.toThrow();
    expect(gesunder).toHaveBeenCalledTimes(1);
    expect(gesunder).toHaveBeenCalledWith("aktionen");
  });

  it("erreicht ein werfender Hoerer bei spaeteren Wechseln weiterhin (Fehlerpfad)", () => {
    const werfender = vi.fn(() => {
      throw new Error("Anzeigefehler");
    });
    const gesunder = vi.fn();
    aufReiterGeaendert(werfender);
    aufReiterGeaendert(gesunder);

    wechsleReiter("aktionen");
    wechsleReiter("vorlagen");

    expect(werfender).toHaveBeenCalledTimes(2);
    expect(gesunder).toHaveBeenCalledTimes(2);
  });

  it("bricht ein Hoerer, der sich in seinem eigenen Rueckruf abmeldet, die laufende Benachrichtigung nicht ab (DoD)", () => {
    const erster = vi.fn();
    let abmeldenMitte: () => void = () => {};
    const mitte = vi.fn(() => abmeldenMitte());
    const dritter = vi.fn();
    aufReiterGeaendert(erster);
    abmeldenMitte = aufReiterGeaendert(mitte);
    aufReiterGeaendert(dritter);

    wechsleReiter("vorlagen");

    // Die laufende Runde laeuft ueber eine Kopie zu Ende – alle drei werden gerufen.
    expect(erster).toHaveBeenCalledTimes(1);
    expect(mitte).toHaveBeenCalledTimes(1);
    expect(dritter).toHaveBeenCalledTimes(1);

    // Ab der naechsten Runde ist der mittlere abgemeldet, die anderen zwei nicht.
    wechsleReiter("aktionen");
    expect(erster).toHaveBeenCalledTimes(2);
    expect(mitte).toHaveBeenCalledTimes(1);
    expect(dritter).toHaveBeenCalledTimes(2);
  });
});

describe("istGueltigerReiter (DoD)", () => {
  it.each(["zusammenstellen", "aktionen", "vorlagen", "projekte"])(
    "akzeptiert %s",
    (wert) => {
      expect(istGueltigerReiter(wert)).toBe(true);
    },
  );

  it.each([null, undefined, 42, {}, "", "Projekte"])(
    "weist %j ab – kein Wurf, kein Ersatzwert (DoD)",
    (wert) => {
      expect(istGueltigerReiter(wert)).toBe(false);
    },
  );

  it("wirft auch fuer weitere unbekannte Zeichenketten nie (Fehlerpfad)", () => {
    for (const wert of ["marken", "uebersicht", "   "]) {
      expect(istGueltigerReiter(wert)).toBe(false);
    }
  });
});

describe("setzeReiterZustandZurueck (NUR fuer Tests)", () => {
  it("setzt den Zustand auf den Anfangswert zurueck", () => {
    wechsleReiter("aktionen");
    expect(holeReiter()).toBe("aktionen");

    setzeReiterZustandZurueck();

    expect(holeReiter()).toBe("projekte");
  });

  it("entfernt alle Hoerer", () => {
    const spion = vi.fn();
    aufReiterGeaendert(spion);

    setzeReiterZustandZurueck();
    wechsleReiter("aktionen");

    expect(spion).toHaveBeenCalledTimes(0);
  });
});

describe("Bauvorschriften dieser Datei (DoD-Grep-Proben)", () => {
  it("enthaelt kein JSX und kein JSX-Element-Muster", () => {
    expect(QUELLE).not.toMatch(/\bJSX\b/);
    expect(CODEZEILEN).not.toMatch(/<[a-z][a-z0-9]*[\s/>]/i);
  });

  it("importiert nichts aus react", () => {
    expect(CODEZEILEN).not.toMatch(/from\s+['"]react['"]/);
  });

  it("enthaelt kein rufeAuf", () => {
    expect(CODEZEILEN).not.toMatch(/rufeAuf/);
  });

  it("enthaelt kein window.", () => {
    expect(CODEZEILEN).not.toMatch(/window\./);
  });

  it("enthaelt kein localStorage", () => {
    expect(CODEZEILEN).not.toMatch(/localStorage/);
  });
});