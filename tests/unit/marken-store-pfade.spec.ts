import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

// Unit-Test zu #288 (Pfad-Autoritaet des marken-store).
//
// `electron` ist gemockt, weil pfade.ts ueber ermittleDatenOrt() (#5) daran haengt.
// Mit `isPackaged: false` liefert der Datenort das Arbeitsverzeichnis - ein Wert, den
// der Test selbst nachrechnen kann, ohne einen Pfad fest einzutippen.
//
// Geprueft wird VERHALTEN, vor allem das Abweisen von Ausbruchsversuchen. Was dieser
// Test NICHT leisten kann: Er sagt nichts ueber Symlinks und Junctions - die pruefte
// nur ein Blick auf die Platte, und genau den macht pfade.ts bewusst nicht (s. Vermerk
// am Ende jener Datei).

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { markenAssetsWurzel, markenOrdner, loeseMarkenDateiPfad } =
  await import("../../src/main/marken-store/pfade");

const MARKE = "7c4f9e12-0000-4000-8000-0123456789ab";
const DATEI = "logo-marke.svg";

function erwarteAbweisung(
  ergebnis: ReturnType<typeof loeseMarkenDateiPfad>,
): void {
  expect(ergebnis.ok).toBe(false);
  if (!ergebnis.ok) {
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  }
}

describe("markenAssetsWurzel", () => {
  it("legt die Wurzel unter <Datenort>/marken-assets an", () => {
    expect(markenAssetsWurzel()).toBe(
      path.join(path.resolve(process.cwd()), "marken-assets"),
    );
  });

  it("liefert bei jedem Aufruf denselben Pfad", () => {
    expect(markenAssetsWurzel()).toBe(markenAssetsWurzel());
  });
});

describe("markenOrdner", () => {
  it("haengt die markeId an die Assets-Wurzel an", () => {
    expect(markenOrdner(MARKE)).toBe(path.join(markenAssetsWurzel(), MARKE));
  });

  it("liefert bei jedem Aufruf denselben Pfad", () => {
    expect(markenOrdner(MARKE)).toBe(markenOrdner(MARKE));
  });
});

describe("loeseMarkenDateiPfad", () => {
  it("legt einen gueltigen Dateinamen in den Ordner der Marke", () => {
    const ergebnis = loeseMarkenDateiPfad(MARKE, DATEI);
    expect(ergebnis).toEqual({
      ok: true,
      wert: path.join(markenOrdner(MARKE), DATEI),
    });
  });

  it("erlaubt Namen mit Umlaut, Leerzeichen und Punkt", () => {
    expect(loeseMarkenDateiPfad(MARKE, "Meine Firma Logo v2.svg").ok).toBe(true);
  });

  it.each([
    ["..-Ausbruch (DoD)", "../../etc/passwd"],
    ["Ausbruch mit Rueckwaerts-Schraegstrich (DoD)", "..\\..\\secrets"],
    ["absoluter POSIX-Pfad (DoD)", "/etc/passwd"],
    ["absoluter Windows-Pfad (DoD)", "C:\\Windows\\x"],
    ["leerer Name (DoD)", ""],
    ["Unterordner (DoD)", "a/b"],
    ["Unterordner, Rueckwaerts (DoD)", "a\\b"],
    ["laufwerksrelativ ohne Trenner", "C:datei.jpg"],
    ["der Ordner selbst", "."],
    ["der Elternordner", ".."],
    ["Geraetename", "NUL"],
    ["Punkt am Ende (Windows schneidet ihn ab)", "logo.svg."],
    ["Leerzeichen am Ende (Windows schneidet es ab)", "logo.svg "],
  ])("weist %s ab", (_beschreibung, dateiname) => {
    erwarteAbweisung(loeseMarkenDateiPfad(MARKE, dateiname));
  });

  it.each(["", "..", "../andere", "a/b", "C:\\Windows"])(
    "weist die markeId %j ab",
    (markeId) => {
      erwarteAbweisung(loeseMarkenDateiPfad(markeId, DATEI));
    },
  );
});

describe("Ordnergrenze zwischen benachbarten Marken", () => {
  it("trennt 'a' und 'ab' an der Grenze (Regression gegen naive startsWith)", () => {
    // DoD: Zwei verschiedene markeId-Werte liefern verschiedene Ordner, die sich NICHT
    // ueberschneiden - `markenOrdner('a')` ist ein Praefix-Teilstring von
    // `markenOrdner('ab')`, darf aber nicht faelschlich als "innerhalb" durchgehen.
    const ordnerA = markenOrdner("a");
    const ordnerAb = markenOrdner("ab");
    expect(ordnerAb).not.toBe(ordnerA);

    // Der Beleg, dass die Falle hier ueberhaupt existiert: Ein naiver
    // startsWith-Vergleich OHNE Pfadtrenner-Grenze haelt `ab` zeichenweise fuer
    // "innerhalb" von `a`.
    expect(ordnerAb.startsWith(ordnerA)).toBe(true);

    // Die Aufloesung darf sich davon nicht taeuschen lassen: Jede Marke landet in
    // ihrem EIGENEN Ordner, kein Ergebnis liegt innerhalb des benachbarten Ordners.
    const ergebnisA = loeseMarkenDateiPfad("a", DATEI);
    const ergebnisAb = loeseMarkenDateiPfad("ab", DATEI);
    expect(ergebnisA.ok && ergebnisAb.ok).toBe(true);
    if (ergebnisA.ok && ergebnisAb.ok) {
      expect(ergebnisA.wert).toBe(path.join(ordnerA, DATEI));
      expect(ergebnisAb.wert).toBe(path.join(ordnerAb, DATEI));
      expect(
        path.relative(ordnerAb, ergebnisA.wert).startsWith(".."),
      ).toBe(true);
      expect(
        path.relative(ordnerA, ergebnisAb.wert).startsWith(".."),
      ).toBe(true);
    }
  });
});

describe("kein Dateisystemzugriff", () => {
  it("ruft waehrend aller drei Funktionen keine fs-Funktion", () => {
    // Der von der DoD verlangte Spy. Er beobachtet das CJS-Modulobjekt von node:fs -
    // dieselben Funktionen, die ein `fs.existsSync(...)` in pfade.ts treffen wuerde.
    // Die Ueberwachung ist synchron und wird sofort wieder zurueckgebaut, damit sie
    // keine fremden Aufrufe des Testlaufs einfaengt.
    const fs = createRequire(import.meta.url)("node:fs");
    const beobachtet = [
      "existsSync",
      "statSync",
      "lstatSync",
      "realpathSync",
      "readdirSync",
      "readFileSync",
      "openSync",
    ];
    const aufrufe: string[] = [];
    const original = new Map<string, unknown>();

    for (const name of beobachtet) {
      original.set(name, fs[name]);
      fs[name] = (...args: unknown[]) => {
        aufrufe.push(name);
        const echt = original.get(name) as (...a: unknown[]) => unknown;
        return echt(...args);
      };
    }
    try {
      markenAssetsWurzel();
      markenOrdner(MARKE);
      loeseMarkenDateiPfad(MARKE, DATEI);
      loeseMarkenDateiPfad(MARKE, "../../etc/passwd");
    } finally {
      for (const name of beobachtet) {
        fs[name] = original.get(name);
      }
    }

    expect(aufrufe).toEqual([]);
  });

  it("importiert ueberhaupt kein fs-Modul", () => {
    // Die Gegenprobe zum Spy oben, und der eigentliche Beweis: Ein ESM-Import bindet
    // die Funktion direkt, ein Spy auf dem Modulobjekt sieht sie dann NICHT mehr. Wer
    // hier spaeter fs einfuehrt, faellt an dieser Stelle auf.
    const quelle = readFileSync(
      new URL("../../src/main/marken-store/pfade.ts", import.meta.url),
      "utf8",
    );
    expect(quelle).not.toMatch(/["'](node:)?fs(\/promises)?["']/);
  });
});