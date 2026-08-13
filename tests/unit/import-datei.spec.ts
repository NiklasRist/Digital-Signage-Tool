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
  copyFile: null as ((quelle: string, ziel: string) => Promise<void>) | null,
  mkdir: null as ((pfad: string) => Promise<void>) | null,
  open: null as ((pfad: string, modus: string) => Promise<unknown>) | null,
  rename: null as ((von: string, nach: string) => Promise<void>) | null,
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    stat: vi.fn((pfad: string) => echt.stat(pfad)),
    mkdir: vi.fn((pfad: string, optionen: { recursive: true }) =>
      attrappe.mkdir === null ? echt.mkdir(pfad, optionen) : attrappe.mkdir(pfad),
    ),
    copyFile: vi.fn((quelle: string, ziel: string) =>
      attrappe.copyFile === null ? echt.copyFile(quelle, ziel) : attrappe.copyFile(quelle, ziel),
    ),
    open: vi.fn((pfad: string, modus: string) =>
      attrappe.open === null ? echt.open(pfad, modus) : attrappe.open(pfad, modus),
    ),
    rename: vi.fn((von: string, nach: string) =>
      attrappe.rename === null ? echt.rename(von, nach) : attrappe.rename(von, nach),
    ),
  };
});

const { copyFile, mkdir, open, rename, stat } = await import("node:fs/promises");
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
  attrappe.copyFile = null;
  attrappe.mkdir = null;
  attrappe.open = null;
  attrappe.rename = null;
  vi.mocked(stat).mockClear();
  vi.mocked(mkdir).mockClear();
  vi.mocked(copyFile).mockClear();
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
    expect(copyFile).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist eine leere Quelle und einen leeren Zielordner ab", async () => {
    const { quelle, medien } = neuerFall();

    expect((await kopiereInsStaging("", medien, DATEINAME)).ok).toBe(false);
    expect((await kopiereInsStaging(quelle, "", DATEINAME)).ok).toBe(false);
    expect(mkdir).not.toHaveBeenCalled();
    expect(copyFile).not.toHaveBeenCalled();
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
    expect(copyFile).not.toHaveBeenCalled();
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
    expect(copyFile).not.toHaveBeenCalled();
  });

  it("meldet eine zwischen Pruefung und Kopie verschwundene Quelle als datei_nicht_gefunden", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.copyFile = async () => {
      throw systemfehler("ENOENT");
    };

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe(belegNichtGefunden);
  });

  it("laesst bei ENOSPC die halb geschriebene .part-Datei liegen und meldet Platzmangel", async () => {
    const { quelle, medien, part } = neuerFall();
    // So sieht ein Abbruch mitten im Kopieren aus: ein Teil der Bytes steht schon da.
    attrappe.copyFile = async (_quelle, ziel) => {
      writeFileSync(ziel, INHALT.slice(0, 1234));
      throw systemfehler("ENOSPC");
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
    attrappe.copyFile = async () => {
      throw systemfehler("EIO");
    };

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

    expect(copyFile).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
  });

  it("wandelt eine unerwartete Ausnahme in ein Ergebnis, statt zu werfen", async () => {
    const { quelle, medien } = neuerFall();
    attrappe.copyFile = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await kopiereInsStaging(quelle, medien, DATEINAME);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kopier_fehler");
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
