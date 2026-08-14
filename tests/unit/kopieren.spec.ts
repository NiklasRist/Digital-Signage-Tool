import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #186.
//
// Zwei Testarten, weil zwei verschiedene Dinge zu belegen sind:
//  - Der Erfolgspfad laeuft auf einer ECHTEN Platte. Nur dort zeigt sich, dass die
//    Bytes wirklich ankommen, dass die danebenliegende Zieldatei unangetastet bleibt
//    und dass `handle.sync()` auf dieser Plattform ueberhaupt gelingt: Wuerde die
//    Datei nur lesend geoeffnet, meldete Windows EPERM, und der Test schluege fehl.
//  - Die Fehlerpfade laufen ueber eine Attrappe auf `node:fs/promises`. Ein voller
//    Stick, ein waehrend des Kopierens gezogenes Laufwerk oder ein abgeschnittener
//    Schreibvorgang lassen sich nicht herstellen; nachstellbar ist nur, was die
//    Systemaufrufe dabei melden.
//
// `ablauf` haelt die REIHENFOLGE der Systemaufrufe fest - die ist hier der
// eigentliche Vertrag (kopieren -> Groesse vergleichen -> fsync -> erst dann Erfolg).
const attrappe = vi.hoisted(() => ({
  ablauf: [] as string[],
  copyFile: null as null | (() => Promise<void>),
  statGroesse: null as null | number,
  statFehler: null as null | unknown,
  unlink: null as null | ((ruf: number) => Promise<void>),
  openFehler: null as null | unknown,
  syncFehler: null as null | unknown,
  closeFehler: null as null | unknown,
  unlinkRufe: 0,
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    copyFile: vi.fn(async (quelle: string, ziel: string) => {
      attrappe.ablauf.push("copyFile");
      if (attrappe.copyFile !== null) {
        await attrappe.copyFile();
        return;
      }
      await echt.copyFile(quelle, ziel);
    }),
    stat: vi.fn(async (pfad: string) => {
      attrappe.ablauf.push("stat");
      if (attrappe.statFehler !== null) {
        throw attrappe.statFehler;
      }
      if (attrappe.statGroesse !== null) {
        return { size: attrappe.statGroesse } as unknown as Awaited<ReturnType<typeof echt.stat>>;
      }
      return echt.stat(pfad);
    }),
    unlink: vi.fn(async (pfad: string) => {
      attrappe.ablauf.push("unlink");
      attrappe.unlinkRufe += 1;
      if (attrappe.unlink !== null) {
        await attrappe.unlink(attrappe.unlinkRufe);
        return;
      }
      await echt.unlink(pfad);
    }),
    open: vi.fn(async (pfad: string, modus: string) => {
      attrappe.ablauf.push(`open(${modus})`);
      if (attrappe.openFehler !== null) {
        throw attrappe.openFehler;
      }
      const handle = await echt.open(pfad, modus as "r+");
      return {
        sync: async () => {
          attrappe.ablauf.push("sync");
          if (attrappe.syncFehler !== null) {
            throw attrappe.syncFehler;
          }
          await handle.sync();
        },
        close: async () => {
          attrappe.ablauf.push("close");
          await handle.close();
          if (attrappe.closeFehler !== null) {
            throw attrappe.closeFehler;
          }
        },
      };
    }),
  };
});

const { copyFile, open, stat, unlink } = await import("node:fs/promises");
const { kopiereNachPart } = await import("../../src/main/export-service/kopieren");

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-kopieren-"));
// Quelle und Ziel liegen in GETRENNTEN Ordnern - nur so laesst sich pruefen, dass die
// Meldungen den Zielordner nennen und den Quellpfad verschweigen (TK 9.5.7).
const QUELLORDNER = path.join(BASIS, "projekt-output");
const ZIELORDNER = path.join(BASIS, "stick");
const INHALT = "0123456789 die fertige Werbeschleife";

let lauf = 0;

interface Aufbau {
  quellPfad: string;
  partPfad: string;
  zielPfad: string;
  groesse: number;
}

/** Legt fuer einen Test eine echte Quelldatei und einen eigenen Zielnamen an. */
function aufbau(inhalt = INHALT): Aufbau {
  lauf += 1;
  const name = `reel-${lauf}.mp4`;
  const quellPfad = path.join(QUELLORDNER, name);
  writeFileSync(quellPfad, inhalt);
  return {
    quellPfad,
    partPfad: path.join(ZIELORDNER, `${name}.part`),
    zielPfad: path.join(ZIELORDNER, name),
    groesse: Buffer.byteLength(inhalt),
  };
}

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`${code} beim Kopieren`), { code });
}

beforeEach(() => {
  mkdirSync(QUELLORDNER, { recursive: true });
  mkdirSync(ZIELORDNER, { recursive: true });
  attrappe.ablauf = [];
  attrappe.copyFile = null;
  attrappe.statGroesse = null;
  attrappe.statFehler = null;
  attrappe.unlink = null;
  attrappe.openFehler = null;
  attrappe.syncFehler = null;
  attrappe.closeFehler = null;
  attrappe.unlinkRufe = 0;
  vi.mocked(copyFile).mockClear();
  vi.mocked(stat).mockClear();
  vi.mocked(unlink).mockClear();
  vi.mocked(open).mockClear();
});

afterAll(() => {
  rmSync(BASIS, { recursive: true, force: true });
});

describe("kopiereNachPart (#186) weist unbrauchbare Angaben ohne Dateisystemzugriff ab", () => {
  it.each([
    ["leerer Quellpfad", "", "C:/stick/reel.mp4.part", 10],
    ["leerer Zielpfad", "C:/projekt/reel.mp4", "", 10],
    ["negative Groesse", "C:/projekt/reel.mp4", "C:/stick/reel.mp4.part", -1],
    ["NaN", "C:/projekt/reel.mp4", "C:/stick/reel.mp4.part", Number.NaN],
    ["Infinity", "C:/projekt/reel.mp4", "C:/stick/reel.mp4.part", Number.POSITIVE_INFINITY],
  ])("%s -> ungueltige_eingabe", async (_fall, quelle, ziel, groesse) => {
    const ergebnis = await kopiereNachPart(quelle, ziel, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(attrappe.ablauf).toEqual([]);
    expect(copyFile).not.toHaveBeenCalled();
    expect(stat).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("weist auch einen Nicht-String und eine Nicht-Zahl ab", async () => {
    const ohnePfad = await kopiereNachPart(undefined as unknown as string, "C:/s/a.part", 1);
    const ohneGroesse = await kopiereNachPart("C:/p/a.mp4", "C:/s/a.part", "10" as unknown as number);

    expect(ohnePfad.ok).toBe(false);
    expect(ohneGroesse.ok).toBe(false);
    expect(attrappe.ablauf).toEqual([]);
  });
});

describe("kopiereNachPart (#186) auf einer echten Platte", () => {
  it("legt die .part an und laesst die vorhandene Zieldatei unangetastet", async () => {
    const { quellPfad, partPfad, zielPfad, groesse } = aufbau();
    // Die gute, im Studio laufende Fassung - sie darf dieser Lauf nicht anfassen.
    writeFileSync(zielPfad, "ALTE GUTE FASSUNG");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(readFileSync(partPfad, "utf8")).toBe(INHALT);
    expect(readFileSync(zielPfad, "utf8")).toBe("ALTE GUTE FASSUNG");
  });

  it("kopiert, verifiziert und syncet in genau dieser Reihenfolge - Erfolg erst danach", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(true);
    // 'r+' und nicht 'r': fsync auf einem nur lesenden Handle meldet unter Windows
    // EPERM (gemessen). Dieser Lauf beweist zugleich, dass sync() hier gelingt.
    expect(attrappe.ablauf).toEqual([
      "unlink",
      "copyFile",
      "stat",
      "open(r+)",
      "sync",
      "close",
    ]);
  });

  it("entfernt einen alten .part-Rest vor dem Kopieren", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    writeFileSync(partPfad, "LEICHE EINES FRUEHEREN, ABGEBROCHENEN EXPORTS - viel laenger");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(true);
    expect(readFileSync(partPfad, "utf8")).toBe(INHALT);
    // Der Inhaltsvergleich allein wuerde ein fehlendes Schritt 2 NICHT bemerken -
    // `copyFile` kuerzt eine laengere Datei ohnehin. Es zaehlt, dass wirklich zuerst
    // entfernt wird: Nach einem kuerzeren Schreibvorgang bleibt auf manchen
    // Dateisystemen der laengere Rest stehen.
    expect(attrappe.ablauf[0]).toBe("unlink");
  });

  it("gibt auf, wenn sich der alte .part-Rest nicht entfernen laesst, und kopiert nicht", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.unlink = async () => {
      throw systemfehler("EACCES");
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
    expect(copyFile).not.toHaveBeenCalled();
  });
});

describe("kopiereNachPart (#186) ordnet die Fehler des Kopierens zu", () => {
  it.each([
    ["ENOSPC", "kein_platz"],
    ["ENODEV", "ziel_nicht_verfügbar"],
    ["ENXIO", "ziel_nicht_verfügbar"],
    ["EACCES", "schreib_fehler"],
    ["EROFS", "schreib_fehler"],
    ["EIO", "schreib_fehler"],
  ])("%s -> %s, ohne .part-Leiche und ohne sync", async (sysCode, code) => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.copyFile = async () => {
      // Ein abgebrochener Kopiervorgang hinterlaesst ein angefangenes Stueck.
      writeFileSync(partPfad, "halb");
      throw systemfehler(sysCode);
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe(code);
    expect(existsSync(partPfad)).toBe(false);
    expect(attrappe.ablauf).not.toContain("sync");
  });

  it("nennt bei kein_platz die benoetigte Groesse und den Zielordner, nie den Quellpfad", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.copyFile = async () => {
      throw systemfehler("ENOSPC");
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.meldung).toContain(String(groesse));
    expect(ergebnis.fehler.meldung).toContain(ZIELORDNER);
    expect(ergebnis.fehler.meldung).not.toContain(QUELLORDNER);
  });

  it("deutet ENOENT bei noch vorhandener Quelle als verschwundenes Ziel", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.copyFile = async () => {
      throw systemfehler("ENOENT");
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ziel_nicht_verfügbar");
  });

  it("deutet ENOENT bei verschwundener Quelle als schreib_fehler und sagt es in der Meldung", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    rmSync(quellPfad);
    attrappe.copyFile = async () => {
      throw systemfehler("ENOENT");
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
    expect(ergebnis.fehler.meldung).toContain("verschwunden");
  });

  it("wandelt eine Ausnahme ohne Systemcode in unbekannter_fehler, statt zu werfen", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.copyFile = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
  });
});

describe("kopiereNachPart (#186) verifiziert die Groesse ohne Toleranz", () => {
  it.each([-1, 1])(
    "meldet bei %s Byte Abweichung schreib_fehler, entfernt die .part und syncet nicht",
    async (abweichung) => {
      const { quellPfad, partPfad, groesse } = aufbau();
      attrappe.statGroesse = groesse + abweichung;

      const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("schreib_fehler");
      expect(ergebnis.fehler.meldung).toContain(String(groesse));
      expect(ergebnis.fehler.meldung).toContain(String(groesse + abweichung));
      expect(existsSync(partPfad)).toBe(false);
      expect(open).not.toHaveBeenCalled();
      expect(attrappe.ablauf).not.toContain("sync");
    },
  );

  it("meldet schreib_fehler, wenn sich die Groesse gar nicht feststellen laesst", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.statFehler = systemfehler("EIO");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
    expect(existsSync(partPfad)).toBe(false);
  });
});

describe("kopiereNachPart (#186) meldet nie Erfolg ohne gelungenen fsync", () => {
  it("scheitert der sync, ist das Ergebnis schreib_fehler und die .part weg", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.syncFehler = systemfehler("EIO");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
    expect(existsSync(partPfad)).toBe(false);
  });

  it("scheitert schon das Oeffnen, ist das Ergebnis schreib_fehler", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.openFehler = systemfehler("EPERM");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
    expect(attrappe.ablauf).not.toContain("close");
  });

  it("scheitert das Schliessen, gilt der Export ebenfalls nicht als fertig", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.closeFehler = systemfehler("EIO");

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("schreib_fehler");
  });

  it("schliesst den Handle in jedem Pfad - einmal geoeffnet, einmal geschlossen", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.syncFehler = systemfehler("EIO");

    await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(attrappe.ablauf.filter((s) => s.startsWith("open("))).toHaveLength(1);
    expect(attrappe.ablauf.filter((s) => s === "close")).toHaveLength(1);
  });
});

describe("kopiereNachPart (#186) laesst ein gescheitertes Aufraeumen das Ergebnis nicht aendern", () => {
  it("meldet weiter kein_platz, obwohl das Entfernen der .part scheitert", async () => {
    const { quellPfad, partPfad, groesse } = aufbau();
    attrappe.unlink = async (ruf) => {
      // Erster Ruf: Schritt 2, es liegt nichts herum. Zweiter Ruf: das Aufraeumen.
      if (ruf === 1) throw systemfehler("ENOENT");
      throw systemfehler("EACCES");
    };
    attrappe.copyFile = async () => {
      throw systemfehler("ENOSPC");
    };

    const ergebnis = await kopiereNachPart(quellPfad, partPfad, groesse);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_platz");
    expect(attrappe.unlinkRufe).toBe(2);
  });
});
