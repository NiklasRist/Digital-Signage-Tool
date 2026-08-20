// Unit-Test zu #233 – der wertbasierte Schnappschuss-Stapel der app-shell.
//
// Die Datei ist reiner Renderer-Zustand ohne IPC, ohne Ergebnis<T> und ohne JSX –
// alles, was die DoD hier verlangt, ist ohne Browser in einer Node-Umgebung
// pruefbar. Die Fabrik (ENTSCHIEDEN 1) haelt KEINEN Modul-Zustand; jede Instanz
// ist eigenstaendig, ein Zuruecksetzen zwischen Tests ist daher nicht noetig und
// die Tests praegen sich gegenseitig nicht.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  UNDO_TIEFE,
  erzeugeUndoStapel,
} from "../../src/renderer/app-shell/undo-stapel";

const QUELLE = readFileSync(
  new URL("../../src/renderer/app-shell/undo-stapel.ts", import.meta.url),
  "utf8",
);

// Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split("\n")
  .filter((z) => {
    const t = z.trim();
    return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

describe("Konstante und Fabrik (DoD)", () => {
  it("ist UNDO_TIEFE der Vertragswert 50 (DoD)", () => {
    expect(UNDO_TIEFE).toBe(50);
  });

  it("liefert erzeugeUndoStapel() bei jedem Aufruf eine EIGENE Instanz (DoD)", () => {
    const jeder = erzeugeUndoStapel<number>();
    const andere = erzeugeUndoStapel<number>();

    jeder.ablegen(1);

    expect(jeder.stand()).toEqual({ zurueck: 1, vor: 0 });
    expect(andere.stand()).toEqual({ zurueck: 0, vor: 0 });
  });

  it("erzeugt jeden Aufruf sogar mit gleicher Tiefe eine unabhaengige Instanz", () => {
    const a = erzeugeUndoStapel<number>(2);
    const b = erzeugeUndoStapel<number>(2);
    a.ablegen(1);
    a.ablegen(2);
    a.ablegen(3);
    expect(a.stand().zurueck).toBe(2);
    expect(b.stand().zurueck).toBe(0);
  });
});

describe("Frisch erzeugt (DoD)", () => {
  it("gilt kannZurueck() false, kannVor() false, beide Vorschauen null, stand() { 0, 0 } (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    expect(stapel.kannZurueck()).toBe(false);
    expect(stapel.kannVor()).toBe(false);
    expect(stapel.vorschauZurueck()).toBeNull();
    expect(stapel.vorschauVor()).toBeNull();
    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 0 });
  });
});

describe("ablegen und vorschauZurueck (DoD)", () => {
  it("liefert nach ablegen(a) vorschauZurueck() a und verandert stand() nicht – zweimal gerufen kommt zweimal a (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(11);

    expect(stapel.vorschauZurueck()).toBe(11);
    expect(stapel.stand()).toEqual({ zurueck: 1, vor: 0 });

    expect(stapel.vorschauZurueck()).toBe(11);
    expect(stapel.stand()).toEqual({ zurueck: 1, vor: 0 });
  });
});

describe("vollzieheZurueck / vollzieheVor (DoD)", () => {
  it("ergibt vollzieheZurueck(b) nach ablegen(a) stand() { zurueck: 0, vor: 1 } und vorschauVor() b (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(1);
    stapel.vollzieheZurueck(2);

    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 1 });
    expect(stapel.vorschauVor()).toBe(2);
  });

  it("fuehrt der volle Zyklus ablegen(a), vollzieheZurueck(b), vollzieheVor(a) zurueck auf { zurueck: 1, vor: 0 } und vorschauZurueck() a (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(1);
    stapel.vollzieheZurueck(2);
    stapel.vollzieheVor(1);

    expect(stapel.stand()).toEqual({ zurueck: 1, vor: 0 });
    expect(stapel.vorschauZurueck()).toBe(1);
  });

  it("leert ein ablegen nach vollzieheZurueck den Wiederherstellen-Zweig (DoD, benannt)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(1);
    stapel.vollzieheZurueck(2);
    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 1 });

    stapel.ablegen(3);

    expect(stapel.stand().vor).toBe(0);
    expect(stapel.vorschauVor()).toBeNull();
  });
});

describe("Begrenzte Tiefe (DoD, ENTSCHIEDEN 3)", () => {
  it("wirft bei tiefe 3 nach fuenf ablegen(1..5) der aelteste heraus: stand().zurueck 3, Vorschau/Vollzug liefert 5, 4, 3 (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>(3);
    for (let i = 1; i <= 5; i++) {
      stapel.ablegen(i);
    }

    expect(stapel.stand()).toEqual({ zurueck: 3, vor: 0 });

    const folge: Array<number | null> = [];
    for (let i = 0; i < 3; i++) {
      folge.push(stapel.vorschauZurueck());
      stapel.vollzieheZurueck(i);
    }
    expect(folge).toEqual([5, 4, 3]);
    expect(stapel.stand().zurueck).toBe(0);
  });
});

describe("Fehlerpfade – leerer Zweig (DoD)", () => {
  it("ist vollzieheZurueck(x) auf einem leeren Stapel wirkungslos: stand() bleibt { 0, 0 }, vorschauVor() null, kein Wurf (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();

    expect(() => stapel.vollzieheZurueck(42)).not.toThrow();
    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 0 });
    expect(stapel.vorschauVor()).toBeNull();
  });

  it("ist vollzieheVor(x) auf einem leeren Wiederherstellen-Zweig wirkungslos und wirft nicht (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(1);
    expect(stapel.kannVor()).toBe(false);

    expect(() => stapel.vollzieheVor(2)).not.toThrow();
    expect(stapel.stand()).toEqual({ zurueck: 1, vor: 0 });
    expect(stapel.vorschauZurueck()).toBe(1);
  });
});

describe("leere (DoD)", () => {
  it("setzt stand() auf { zurueck: 0, vor: 0 } und beide Vorschauen auf null (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(1);
    stapel.ablegen(2);
    stapel.vollzieheZurueck(3);
    expect(stapel.stand()).toEqual({ zurueck: 1, vor: 1 });

    stapel.leere();

    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 0 });
    expect(stapel.vorschauZurueck()).toBeNull();
    expect(stapel.vorschauVor()).toBeNull();
  });

  it("ist leere() auf einem bereits leeren Stapel wirkungslos und wirft nicht (Fehlerpfad)", () => {
    const stapel = erzeugeUndoStapel<number>();
    expect(() => stapel.leere()).not.toThrow();
    expect(stapel.stand()).toEqual({ zurueck: 0, vor: 0 });
  });
});

describe("erzeugeUndoStapel mit ungueltiger Tiefe (DoD, ENTSCHIEDEN 7)", () => {
  it.each([
    [0],
    [-3],
    [2.5],
    [Number.NaN],
  ])("verhaelt sich tiefe %s wie UNDO_TIEFE: 51 mal ablegen -> stand().zurueck 50 (DoD)", (tiefe) => {
    const stapel = erzeugeUndoStapel<number>(tiefe);
    for (let i = 0; i < 51; i++) {
      stapel.ablegen(i);
    }
    expect(stapel.stand().zurueck).toBe(UNDO_TIEFE);
    expect(stapel.stand().zurueck).toBe(50);
  });
});

describe("Referenz statt Kopie (DoD, ENTSCHIEDEN 5)", () => {
  it("kommt ein per ablegen(obj) uebergebenes Objekt aus vorschauZurueck() als dasselbe Objekt zurueck (DoD)", () => {
    const stapel = erzeugeUndoStapel<{ wert: number }>();
    const objekt = { wert: 41 };

    stapel.ablegen(objekt);

    expect(stapel.vorschauZurueck()).toBe(objekt);
  });

  it("legt auch der Wiederherstellen-Zweig die Referenz ab (ENTSCHIEDEN 5)", () => {
    const stapel = erzeugeUndoStapel<{ wert: number }>();
    const vorher = { wert: 1 };
    const ersetzt = { wert: 2 };

    stapel.ablegen(vorher);
    stapel.vollzieheZurueck(ersetzt);

    expect(stapel.vorschauVor()).toBe(ersetzt);
  });
});

describe("Kein Zusammenfassen (DoD, ENTSCHIEDEN 6)", () => {
  it("ergibt zweimal derselbe Wert stand().zurueck 2 (DoD)", () => {
    const stapel = erzeugeUndoStapel<number>();
    stapel.ablegen(7);
    stapel.ablegen(7);
    expect(stapel.stand().zurueck).toBe(2);
  });
});

describe("Bauvorschriften dieser Datei (DoD-Grep-Proben)", () => {
  it("enthaelt kein JSX", () => {
    expect(QUELLE).not.toMatch(/\bJSX\b/);
    // Bewusst OHNE /i und kleingeschrieben: Die verbindliche Signatur fuehrt
    // den Typparameter <T> (UndoStapel<T>, erzeugeUndoStapel<T>), der GROSS
    // geschrieben ist und kein JSX ist. JSX-HTML-Elemente sind kleingeschrieben
    // (<div>, <canvas/>) und werden von diesem Muster gefunden.
    expect(CODEZEILEN).not.toMatch(/<[a-z][a-z0-9]*[\s/>]/);
  });

  it("importiert nichts aus react", () => {
    expect(CODEZEILEN).not.toMatch(/from\s+['"]react['"]/);
  });

  it("enthaelt kein rufeAuf", () => {
    expect(CODEZEILEN).not.toMatch(/rufeAuf/);
  });

  it("enthaelt kein abonniere", () => {
    expect(CODEZEILEN).not.toMatch(/abonniere/);
  });

  it("enthaelt kein window.", () => {
    expect(CODEZEILEN).not.toMatch(/window\./);
  });

  it("enthaelt kein localStorage", () => {
    expect(CODEZEILEN).not.toMatch(/localStorage/);
  });

  it("enthaelt kein structuredClone", () => {
    expect(CODEZEILEN).not.toMatch(/structuredClone/);
  });

  it("enthaelt kein JSON.stringify", () => {
    expect(CODEZEILEN).not.toMatch(/JSON\.stringify/);
  });

  it("enthaelt kein setTimeout", () => {
    expect(CODEZEILEN).not.toMatch(/setTimeout/);
  });

  it("importiert nichts aus src/shared/contracts/", () => {
    expect(CODEZEILEN).not.toMatch(/src\/shared\/contracts\//);
  });
});