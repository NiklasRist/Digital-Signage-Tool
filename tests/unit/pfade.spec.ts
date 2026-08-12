import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

// Unit-Test zu #49 (Pfad-Autoritaet).
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

const { projektOrdner, medienOrdner, ausgabeOrdner, loeseAssetPfad, loeseAusgabePfad } =
  await import("../../src/main/project-store/pfade");

const PROJEKT = "3f2a1c4e-0000-4000-8000-0123456789ab";
const DATEI = "9b7d0e21-1111-4111-8111-abcdefabcdef.mp4";

// Steuerzeichen werden berechnet und nicht getippt: Ein rohes Byte in der Quelldatei
// ist beim Lesen unsichtbar und beim naechsten Werkzeuglauf eine Fehlerquelle.
const STEUERZEICHEN = String.fromCharCode(1);
const EINHEITENTRENNER = String.fromCharCode(31);

function erwarteAbweisung(ergebnis: ReturnType<typeof loeseAssetPfad>): void {
  expect(ergebnis.ok).toBe(false);
  if (!ergebnis.ok) {
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  }
}

describe("Ordnerpfade", () => {
  it("legt den Projektordner unter <Datenort>/projects/<id> an", () => {
    expect(projektOrdner(PROJEKT)).toBe(
      path.join(path.resolve(process.cwd()), "projects", PROJEKT),
    );
  });

  it("liefert bei jedem Aufruf denselben Pfad", () => {
    expect(projektOrdner(PROJEKT)).toBe(projektOrdner(PROJEKT));
  });

  it("haengt media/ und output/ an den Projektordner an", () => {
    expect(medienOrdner(PROJEKT)).toBe(path.join(projektOrdner(PROJEKT), "media"));
    expect(ausgabeOrdner(PROJEKT)).toBe(path.join(projektOrdner(PROJEKT), "output"));
  });
});

describe("loeseAssetPfad", () => {
  it("legt einen gueltigen Dateinamen in den Medienordner", () => {
    const ergebnis = loeseAssetPfad(PROJEKT, DATEI);
    expect(ergebnis).toEqual({ ok: true, wert: path.join(medienOrdner(PROJEKT), DATEI) });
  });

  it.each([
    ["..-Ausbruch (DoD)", "../../etc/passwd"],
    ["Ausbruch mit Rueckwaerts-Schraegstrich (DoD)", "..\\..\\secrets"],
    ["absoluter POSIX-Pfad (DoD)", "/etc/passwd"],
    ["absoluter Windows-Pfad (DoD)", "C:\\Windows\\x"],
    ["leerer Name (DoD)", ""],
    ["Unterordner", "unterordner/datei.mp4"],
    ["laufwerksrelativ ohne Trenner", "C:datei.mp4"],
    ["NTFS-Datenstrom", "datei.mp4:versteckt"],
    ["der Ordner selbst", "."],
    ["der Elternordner", ".."],
    ["Geraetename", "NUL"],
    ["Geraetename mit Endung, klein geschrieben", "con.mp4"],
    ["Steuerzeichen im Namen", `datei${STEUERZEICHEN}.mp4`],
    ["Punkt am Ende (Windows schneidet ihn ab)", "datei.mp4."],
    ["Leerzeichen am Ende (Windows schneidet es ab)", "datei.mp4 "],
  ])("weist %s ab", (_beschreibung, dateiname) => {
    erwarteAbweisung(loeseAssetPfad(PROJEKT, dateiname));
  });

  it.each(["", "..", "../andere", "a/b", "C:\\Windows"])(
    "weist die Projekt-ID %j ab",
    (projektId) => {
      erwarteAbweisung(loeseAssetPfad(projektId, DATEI));
    },
  );
});

describe("loeseAusgabePfad", () => {
  it("haengt .mp4 an und legt die Datei in den Ausgabeordner", () => {
    const ergebnis = loeseAusgabePfad(PROJEKT, "Sommeraktion 2026");
    expect(ergebnis).toEqual({
      ok: true,
      wert: path.join(ausgabeOrdner(PROJEKT), "Sommeraktion 2026.mp4"),
    });
  });

  it("erlaubt Punkte im Namen, solange davor kein Geraetename steht", () => {
    expect(loeseAusgabePfad(PROJEKT, "aktion.v2").ok).toBe(true);
  });

  it.each([
    "../../etc/passwd",
    "..\\..\\secrets",
    "/etc/passwd",
    "C:\\Windows\\x",
    "",
    "a/b",
    "a\\b",
    "CON",
    "NUL",
    "datei<name",
    "datei|name",
    "datei>name",
    'datei"name',
    "datei?name",
    "datei*name",
    "datei:name",
    "lpt9.mp4",
    "name.",
    "name ",
    `name${EINHEITENTRENNER}x`,
  ])("weist den Ausgabenamen %j ab", (ausgabeName) => {
    erwarteAbweisung(loeseAusgabePfad(PROJEKT, ausgabeName));
  });

  it.each(["", "..", "../andere", "a/b"])("weist die Projekt-ID %j ab", (projektId) => {
    erwarteAbweisung(loeseAusgabePfad(projektId, "sommer"));
  });
});

describe("kein Dateisystemzugriff", () => {
  it("ruft waehrend aller fuenf Funktionen keine fs-Funktion", () => {
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
      projektOrdner(PROJEKT);
      medienOrdner(PROJEKT);
      ausgabeOrdner(PROJEKT);
      loeseAssetPfad(PROJEKT, DATEI);
      loeseAusgabePfad(PROJEKT, "sommer");
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
      new URL("../../src/main/project-store/pfade.ts", import.meta.url),
      "utf8",
    );
    expect(quelle).not.toMatch(/["'](node:)?fs(\/promises)?["']/);
  });
});
