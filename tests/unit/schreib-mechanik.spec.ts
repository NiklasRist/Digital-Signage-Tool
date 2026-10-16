import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  istCode,
  mitWiederholung,
  taugtAlsSicherung,
  text,
} from "../../src/main/gemeinsam/schreib-mechanik";

// Q2/A (docs/agents/schreib-mechanik-plan.md): Testachse des gemeinsamen Mechanik-Moduls.
// Bis hierher lagen diese Helfer byte-gleich in den fuenf `schreibe-*`-Dateien; ihre
// Wiederholungs-Tauglichkeit wird auf einer echten Platte in einem Temp-Ordner geprueft.

const zustand = { ordner: "" };

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-mechanik-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

function systemfehler(code: string): Error & { code: string } {
  const fehler = new Error(code) as Error & { code: string };
  fehler.code = code;
  return fehler;
}

describe("istCode", () => {
  it("erkennt einen passenden Systemfehler-Code", () => {
    expect(istCode(systemfehler("EPERM"), "EPERM", "EBUSY")).toBe(true);
  });

  it("lehnt fremde Codes und Nicht-Objekte ab", () => {
    expect(istCode(systemfehler("ENOENT"), "EPERM", "EBUSY")).toBe(false);
    expect(istCode("EPERM", "EPERM")).toBe(false);
    expect(istCode(null, "EPERM")).toBe(false);
  });
});

describe("text", () => {
  it("nimmt die Meldung eines Error", () => {
    expect(text(new Error("kaputt"))).toBe("kaputt");
  });

  it("stringifiziert alles andere", () => {
    expect(text("roh")).toBe("roh");
    expect(text(42)).toBe("42");
  });
});

describe("taugtAlsSicherung", () => {
  it("true fuer parsebares JSON", async () => {
    const p = path.join(zustand.ordner, "gut.json");
    await fs.writeFile(p, JSON.stringify({ a: 1 }));

    expect(await taugtAlsSicherung(p)).toBe(true);
  });

  it("false fuer unlesbares JSON", async () => {
    const p = path.join(zustand.ordner, "kaputt.json");
    await fs.writeFile(p, "{ kein json");

    expect(await taugtAlsSicherung(p)).toBe(false);
  });

  it("false fuer eine fehlende Datei", async () => {
    expect(await taugtAlsSicherung(path.join(zustand.ordner, "weg.json"))).toBe(false);
  });
});

describe("mitWiederholung", () => {
  it("liefert null, wenn die Arbeit gelingt", async () => {
    expect(await mitWiederholung(async () => undefined, [])).toBeNull();
  });

  it("wiederholt EPERM und gelingt beim zweiten Versuch", async () => {
    let versuche = 0;
    const ergebnis = await mitWiederholung(async () => {
      versuche += 1;
      if (versuche < 2) throw systemfehler("EPERM");
    }, [1]);

    expect(ergebnis).toBeNull();
    expect(versuche).toBe(2);
  });

  it("gibt bei einem nicht wiederholbaren Fehler sofort auf", async () => {
    let versuche = 0;
    const ergebnis = await mitWiederholung(async () => {
      versuche += 1;
      throw systemfehler("ENOSPC");
    }, [1, 1]);

    expect(istCode(ergebnis, "ENOSPC")).toBe(true);
    expect(versuche).toBe(1);
  });

  it("liefert nach erschoepften Versuchen den letzten Fehler", async () => {
    let versuche = 0;
    const ergebnis = await mitWiederholung(async () => {
      versuche += 1;
      throw systemfehler("EPERM");
    }, [1, 1]);

    expect(istCode(ergebnis, "EPERM")).toBe(true);
    // Der erste Versuch laeuft sofort, danach die zwei uebergebenen Wartezeiten.
    expect(versuche).toBe(3);
  });
});
