import { describe, expect, it } from "vitest";

import { istCode, text } from "../../src/main/gemeinsam/systemfehler";

// Q2/A S7 (docs/agents/schreib-mechanik-plan.md): Testachse der generischen
// Systemfehler-Helfer. Diese lagen zuvor in ~24 `main/`-Dateien byte-gleich kopiert.

function systemfehler(code: string): Error & { code: string } {
  const fehler = new Error(code) as Error & { code: string };
  fehler.code = code;
  return fehler;
}

describe("istCode", () => {
  it("erkennt einen passenden Systemfehler-Code", () => {
    expect(istCode(systemfehler("EPERM"), "EPERM", "EBUSY")).toBe(true);
  });

  it("erkennt auch einen einzelnen Code", () => {
    expect(istCode(systemfehler("ENOENT"), "ENOENT")).toBe(true);
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
