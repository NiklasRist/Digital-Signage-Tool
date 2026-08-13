import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable, Writable } from "node:stream";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportFehlercode } from "../../src/main/media-service/fehlercodes";

// Unit-Test zu #84.
//
// Zwei Testarten, weil zwei verschiedene Dinge zu belegen sind:
//  - Der Erfolgsweg laeuft auf einer ECHTEN Platte in einem eigenen Temp-Ordner. Nur
//    dort ist nachweisbar, dass am Ende wirklich eine VOLLSTAENDIGE Datei unter dem
//    endgueltigen Namen liegt und die `.part`-Datei weg ist. Eine Attrappe koennte
//    das nur behaupten.
//  - Platzmangel, E/A-Fehler, ein fehlgeschlagener `fsync` und ein Rename ueber eine
//    Partitionsgrenze lassen sich nicht herstellen; nachstellbar ist nur, was
//    `node:fs/promises` dabei meldet.
const attrappe = vi.hoisted(() => ({
  // Seit dem 13.08.2026 kopiert #84 ueber Stroeme statt ueber copyFile (Fortschritt).
  // Die Attrappen sitzen deshalb an createReadStream/createWriteStream - dort, wo die
  // Fehler jetzt wirklich entstehen.
  leseStrom: null as (() => NodeJS.ReadableStream) | null,
  schreibStrom: null as ((ziel: string) => NodeJS.WritableStream) | null,
  mkdir: null as ((pfad: string) => Promise<void>) | null,
  open: null as ((pfad: string, modus: string) => Promise<unknown>) | null,
  rename: null as ((von: string, nach: string) => Promise<void>) | null,
}));

vi.mock("node:fs", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs")>();
  return {
    ...echt,
    createReadStream: vi.fn((pfad: string) =>
      attrappe.leseStrom === null ? echt.createReadStream(pfad) : attrappe.leseStrom(),
    ),
    createWriteStream: vi.fn((pfad: string) =>
      attrappe.schreibStrom === null ? echt.createWriteStream(pfad) : attrappe.schreibStrom(pfad),
    ),
  };
});

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    stat: vi.fn((pfad: string) => echt.stat(pfad)),
    mkdir: vi.fn((pfad: string, optionen: { recursive: true }) =>
      attrappe.mkdir === null ? echt.mkdir(pfad, optionen) : attrappe.mkdir(pfad),
    ),
    open: vi.fn((pfad: string, modus: string) =>
      attrappe.open === null ? echt.open(pfad, modus) : attrappe.open(pfad, modus),
    ),
    rename: vi.fn((von: string, nach: string) =>
      attrappe.rename === null ? echt.rename(von, nach) : attrappe.rename(von, nach),
    ),
  };
});

const { mkdir, open, rename, stat } = await import("node:fs/promises");
const { createReadStream, createWriteStream } = await import("node:fs");
const { kopiereInsStaging, macheEndgueltig, STAGING_ORDNER, PART_ENDUNG } = await import(
  "../../src/main/media-service/import-datei"
);

// Beleg, dass die beiden hier verwendeten Literale aus der Modul-Union (#79) stammen
// und nicht neu erfunden sind. Er steht im Test und nicht in der Quelldatei, weil der
// Import dort unbenutzt bliebe und den Typecheck braeche (Hausform aus #82).
const belegNichtGefunden: ImportFehlercode = "datei_nicht_gefunden";
const belegKopierFehler: ImportFehlercode = "kopier_fehler";

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-import-"));
const INHALT = "0123456789".repeat(5000); // 50 000 Bytes - keine Ein-Byte-Attrappe
const DATEINAME = "8d1e4c2a-0000-4000-8000-000000000001.mp4";

let lauf = 0;

/** Frischer Medienordner je Test, damit kein Test den Zustand eines anderen sieht. */
function neuerFall(): { quelle: string; medien: string; part: string; ende: string } {
  lauf += 1;
  const wurzel = path.join(BASIS, `fall-${lauf}`);
  const medien = path.join(wurzel, "media");
  mkdirSync(medien, { recursive: true });
  const quelle = path.join(wurzel, "original.mp4");
  writeFileSync(quelle, INHALT);
  return {
    quelle,
    medien,
    part: path.join(medien, STAGING_ORDNER, DATEINAME + PART_ENDUNG),
    ende: path.join(medien, DATEINAME),
  };
}

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`fs ${code}`), { code });
}

beforeEach(() => {
  attrappe.leseStrom = null;
  attrappe.schreibStrom = null;
  attrappe.mkdir = null;
  attrappe.open = null;
  attrappe.rename = null;
  vi.mocked(stat).mockClear();
  vi.mocked(mkdir).mockClear();
  vi.mocked(createReadStream).mockClear();
  vi.mocked(createWriteStream).mockClear();
  vi.mocked(open).mockClear();
  vi.mocked(rename).mockClear();
});

afterAll(() => {
  rmSync(BASIS, { recursive: true, force: true });
});

describe("kopiereInsStaging (#84) auf einer echten Platte", () => {
  it("kopiert byte-identisch nach .staging und meldet genau den erwarteten Pfad", async () => {
    const { quelle, medien, part } = neuerFall();

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis).toEqual({ ok: true, wert: { partPfad: part } });
    expect(part).toBe(path.join(medien, STAGING_ORDNER, DATEINAME + PART_ENDUNG));
    expect(statSync(part).size).toBe(statSync(quelle).size);
    expect(readFileSync(part, "utf8")).toBe(readFileSync(quelle, "utf8"));
  });

  it("laesst die Quelldatei unveraendert liegen", async () => {
    const { quelle, medien } = neuerFall();
    const vorher = statSync(quelle);

    await kopiereInsStaging(quelle, medien, DATEINAME);

    const nachher = statSync(quelle);
    expect(existsSync(quelle)).toBe(true);
    expect(nachher.size).toBe(vorher.size);
    expect(nachher.mtimeMs).toBe(vorher.mtimeMs);
    expect(readFileSync(quelle, "utf8")).toBe(INHALT);
  });

  it("gelingt auch mit bereits vorhandenem .staging-Ordner (Anlage ist idempotent)", async () => {
    const { quelle, medien } = neuerFall();

    expect((await kopiereInsStaging(quelle, medien, DATEINAME)).ok).toBe(true);
    expect((await kopiereInsStaging(quelle, medien, DATEINAME)).ok).toBe(true);
  });

  it("ueberschreibt einen gleichnamigen .part-Rest, statt daran zu scheitern", async () => {
    const { quelle, medien, part } = neuerFall();
    mkdirSync(path.dirname(part), { recursive: true });
    writeFileSync(part, "Rest eines abgestuerzten Laufs");

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(true);
    expect(readFileSync(part, "utf8")).toBe(INHALT);
  });
});

describe("kopiereInsStaging (#84) weist falsche Eingaben ohne Dateisystemzugriff ab", () => {
  it.each([
    ["Pfadtrenner vorwaerts", "unter/ordner.mp4"],
    ["Pfadtrenner rueckwaerts", "unter\\ordner.mp4"],
    ["Verzeichniswechsel", "../geheim.mp4"],
    ["nur zwei Punkte", ".."],
    ["leer", ""],
  ])("%s liefert ungueltige_eingabe", async (_name, dateiname) => {
    const { quelle, medien } = neuerFall();

    const ergebnis = await kopiereInsStaging(quelle, medien, dateiname);

    expect(stat).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
    expect(createReadStream).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist eine leere Quelle und einen leeren Zielordner ab", async () => {
    const { quelle, medien } = neuerFall();

    expect((await kopiereInsStaging("", medien, DATEINAME)).ok).toBe(false);
    expect((await kopiereInsStaging(quelle, "", DATEINAME)).ok).toBe(false);
    expect(mkdir).not.toHaveBeenCalled();
    expect(createReadStream).not.toHaveBeenCalled();
  });
});

describe("kopiereInsStaging (#84) Fehlerpfade", () => {
  it("meldet eine fehlende Quelle als datei_nicht_gefunden und legt nichts an", async () => {
    const { medien } = neuerFall();
    const fehlt = path.join(BASIS, "gibt-es-nicht.mp4");

    const ergebnis = await kopiereInsStaging(fehlt, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("datei_nicht_gefunden");
    expect(ergebnis.fehler.meldung).toContain("gibt-es-nicht.mp4");
    expect(existsSync(path.join(medien, STAGING_ORDNER))).toBe(false);
    expect(createReadStream).not.toHaveBeenCalled();
  });

  it("meldet einen Ordner als Quelle mit kopier_fehler und sagt das ausdruecklich", async () => {
    const { medien } = neuerFall();
    const ordner = path.join(BASIS, `ordner-als-quelle-${lauf}`);
    mkdirSync(ordner, { recursive: true });

    const ergebnis = await kopiereInsStaging(ordner, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe(belegKopierFehler);
    expect(ergebnis.fehler.meldung).toContain("Ordner");
    expect(createReadStream).not.toHaveBeenCalled();
  });

  it("meldet eine zwischen Pruefung und Kopie verschwundene Quelle als datei_nicht_gefunden", async () => {
    const { quelle, medien } = neuerFall();
    // Der Lesestrom ist seit dem 13.08.2026 die Stelle, an der dieser Fehler entsteht:
    // Zwischen `stat` und dem Oeffnen kann der Nutzer den Stick abgezogen haben.
    attrappe.leseStrom = () =>
      new Readable({
        read() {
          this.destroy(systemfehler("ENOENT"));
        },
      });

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe(belegNichtGefunden);
  });

  it("laesst bei ENOSPC die halb geschriebene .part-Datei liegen und meldet Platzmangel", async () => {
    const { quelle, medien, part } = neuerFall();
    // So sieht ein Abbruch mitten im Kopieren aus: ein Teil der Bytes steht schon auf
    // der Platte, dann geht der Platz aus. Der Schreibstrom schreibt deshalb ECHT,
    // bevor er scheitert - sonst waere die Zusicherung auf die Restdatei unten leer.
    attrappe.schreibStrom = (ziel) => {
      writeFileSync(ziel, INHALT.slice(0, 1234));
      return new Writable({
        write(_block, _kodierung, fertig) {
          fertig(systemfehler("ENOSPC"));
        },
      });
    };

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
    expect(ergebnis.fehler.meldung).toContain("Platz");
    // NICHT aufgeraeumt - das ist Sache des Reconcile (#88), nicht dieser Datei.
    expect(existsSync(part)).toBe(true);
    expect(statSync(part).size).toBe(1234);
  });

  it("meldet einen Lesefehler waehrend der Kopie als kopier_fehler", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.leseStrom = () =>
      new Readable({
        read() {
          this.destroy(systemfehler("EIO"));
        },
      });

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
    expect(ergebnis.fehler.meldung).toContain("EIO");
  });

  it("meldet einen nicht anlegbaren Staging-Ordner als kopier_fehler, ohne zu kopieren", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.mkdir = async () => {
      throw systemfehler("EACCES");
    };

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(createReadStream).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
  });

  it("wandelt eine unerwartete Ausnahme in ein Ergebnis, statt zu werfen", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.leseStrom = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
  });

  // DIE SCHRANKE, die den Wegfall von copyFile ausgleicht (13.08.2026). Ein Strom, der
  // vorzeitig endet, meldet KEINEN Fehler - er ist einfach zu Ende. Ohne den
  // Byte-Vergleich wanderte ein halbes Video unter gueltigem Namen in die Bibliothek,
  // und auffallen wuerde es erst als mitten im Lauf abbrechender Render.
  it("erkennt eine still abgebrochene Kopie am Byte-Vergleich", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.leseStrom = () => Readable.from([Buffer.from(INHALT.slice(0, 4096))]);

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe(belegKopierFehler);
    expect(ergebnis.fehler.meldung).toContain("unvollstaendig");
  });
});

describe("kopiereInsStaging (#84) meldet Fortschritt", () => {
  it("meldet aufsteigende Anteile und zuletzt genau 1", async () => {
    const { quelle, medien } = neuerFall();
    const anteile: number[] = [];

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME, (a) => anteile.push(a));

    expect(ergebnis.ok).toBe(true);
    expect(anteile.length).toBeGreaterThan(0);
    expect(anteile.at(-1)).toBe(1);
    expect([...anteile].sort((a, b) => a - b)).toEqual(anteile);
    expect(anteile.every((a) => a > 0 && a <= 1)).toBe(true);
  });

  it("meldet hoechstens 101 Mal, egal wie viele Bloecke kommen", async () => {
    const { quelle, medien } = neuerFall();
    // 5000 Bloecke a 10 Bytes: ungedrosselt waeren das 5000 Meldungen. Die Drosselung
    // auf ganze Prozent deckelt sie bei 101 - und diese Zahl haengt NICHT an der
    // Geschwindigkeit der Maschine, anders als bei einem Zeitfilter.
    attrappe.leseStrom = () =>
      Readable.from(
        Array.from({ length: 5000 }, (_wert, i) => Buffer.from(INHALT.slice(i * 10, i * 10 + 10))),
      );
    const anteile: number[] = [];

    await kopiereInsStaging(quelle, medien, DATEINAME, (a) => anteile.push(a));

    expect(anteile.length).toBeLessThanOrEqual(101);
    expect(anteile.length).toBeGreaterThan(50);
  });

  it("meldet bei einer leeren Datei einmal 1, statt zu schweigen", async () => {
    const { quelle, medien } = neuerFall();
    writeFileSync(quelle, "");
    const anteile: number[] = [];

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME, (a) => anteile.push(a));

    expect(ergebnis.ok).toBe(true);
    expect(anteile).toEqual([1]);
  });

  it("faengt beim zweiten Lauf wieder bei vorn an", async () => {
    // Die Prozentstufe liegt modulweit (nur ein Auftrag laeuft gleichzeitig, TK 9.3).
    // Ohne Zuruecksetzen bliebe die Stufe des vorigen Imports stehen, und der naechste
    // meldete erst wieder, wenn er sie ueberholt - bei gleich grossen Dateien also nie.
    const ersterFall = neuerFall();
    await kopiereInsStaging(ersterFall.quelle, ersterFall.medien, DATEINAME, () => {});

    const zweiterFall = neuerFall();
    const anteile: number[] = [];
    await kopiereInsStaging(zweiterFall.quelle, zweiterFall.medien, DATEINAME, (a) =>
      anteile.push(a),
    );

    expect(anteile.length).toBeGreaterThan(0);
    expect(anteile.at(-1)).toBe(1);
  });

  it("kopiert unveraendert, wenn kein Rueckruf uebergeben wird", async () => {
    const { quelle, medien, part } = neuerFall();

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(true);
    expect(readFileSync(part, "utf8")).toBe(INHALT);
  });
});

describe("macheEndgueltig (#84) auf einer echten Platte", () => {
  it("verschiebt die Datei vollstaendig unter den endgueltigen Namen", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);

    const ergebnis = await macheEndgueltig(part, ende);

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(existsSync(part)).toBe(false);
    expect(statSync(ende).size).toBe(statSync(quelle).size);
    expect(readFileSync(ende, "utf8")).toBe(INHALT);
  });

  it("laesst den .staging-Ordner stehen und darin nichts zurueck", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);

    await macheEndgueltig(part, ende);

    const staging = path.join(medien, STAGING_ORDNER);
    expect(existsSync(staging)).toBe(true);
    expect(readdirSync(staging)).not.toContain(DATEINAME + PART_ENDUNG);
  });

  it("oeffnet zum fsync mit 'r+' - mit 'r' scheitert fsync unter Windows mit EPERM", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);

    expect((await macheEndgueltig(part, ende)).ok).toBe(true);
    expect(open).toHaveBeenCalledWith(part, "r+");
  });

  it("ersetzt ein bereits vorhandenes Ziel (gemessenes rename-Verhalten)", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    writeFileSync(ende, "Waise eines abgestuerzten Laufs");
    await kopiereInsStaging(quelle, medien, DATEINAME);

    const ergebnis = await macheEndgueltig(part, ende);

    expect(ergebnis.ok).toBe(true);
    expect(readFileSync(ende, "utf8")).toBe(INHALT);
  });
});

describe("macheEndgueltig (#84) Fehlerpfade", () => {
  it("verhindert bei fehlgeschlagenem fsync den Rename vollstaendig", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);
    attrappe.open = async () => ({
      sync: async () => {
        throw systemfehler("EIO");
      },
      close: async () => undefined,
    });

    const ergebnis = await macheEndgueltig(part, ende);

    expect(rename).not.toHaveBeenCalled();
    expect(existsSync(ende)).toBe(false);
    expect(existsSync(part)).toBe(true); // wird NICHT von dieser Datei aufgeraeumt
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
  });

  it("benennt bei EXDEV ausdruecklich die Partitionsgrenze", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);
    attrappe.rename = async () => {
      throw systemfehler("EXDEV");
    };

    const ergebnis = await macheEndgueltig(part, ende);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
    expect(ergebnis.fehler.meldung).toContain("Partitionen");
  });

  it.each(["ENOENT", "EPERM", "EBUSY", "EACCES"])(
    "meldet %s beim Rename als kopier_fehler, ohne das Ziel anzufassen",
    async (code) => {
      const { quelle, medien, part, ende } = neuerFall();
      await kopiereInsStaging(quelle, medien, DATEINAME);
      attrappe.rename = async () => {
        throw systemfehler(code);
      };

      const ergebnis = await macheEndgueltig(part, ende);

      expect(existsSync(ende)).toBe(false);
      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("kopier_fehler");
      expect(ergebnis.fehler.meldung).toContain(code);
    },
  );

  it("meldet eine gar nicht vorhandene .part-Datei als kopier_fehler, statt zu werfen", async () => {
    const { medien, part, ende } = neuerFall();

    const ergebnis = await macheEndgueltig(part, ende);

    expect(existsSync(path.join(medien, DATEINAME))).toBe(false);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
  });

  it("nennt in der Meldung nur den Dateinamen, nie den ganzen Pfad", async () => {
    const { quelle, medien, part, ende } = neuerFall();
    await kopiereInsStaging(quelle, medien, DATEINAME);
    attrappe.rename = async () => {
      throw systemfehler("EPERM");
    };

    const ergebnis = await macheEndgueltig(part, ende);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.meldung).toContain(DATEINAME);
    expect(ergebnis.fehler.meldung).not.toContain(BASIS);
  });
});

describe("import-datei.ts (#84) haelt seine Modulgrenzen ein", () => {
  it("importiert weder electron noch child_process noch project-store noch ffmpeg", () => {
    const quelltext = readFileSync(
      path.join(__dirname, "..", "..", "src", "main", "media-service", "import-datei.ts"),
      "utf8",
    );
    const importzeilen = quelltext
      .split("\n")
      .filter((zeile) => zeile.startsWith("import "))
      .join("\n");

    expect(importzeilen).not.toContain("electron");
    expect(importzeilen).not.toContain("child_process");
    expect(importzeilen).not.toContain("project-store");
    expect(importzeilen).not.toContain("ffmpeg");
    expect(belegNichtGefunden).toBe("datei_nicht_gefunden");
  });
});
