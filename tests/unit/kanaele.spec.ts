// Vertragstest zur Kanal-Registry (#25).
//
// UMGESTELLT am 12.08.2026, wie in der ersten Fassung angekuendigt: Solange die Registry
// leer war, liess sich die geforderte Verschachtelung `<modul>.<operation>` nicht zeigen -
// der Test sicherte deshalb nur ihre Leere und war bewusst so eng, dass er umfaellt, sobald
// #76 oder #77 den ersten Kanal eintraegt. #77 hat das getan.
import { describe, expect, it } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

describe("Kanal-Registry (#25)", () => {
  it("ist nach <modul>.<operation> verschachtelt", () => {
    for (const [modul, operationen] of Object.entries(KANAELE)) {
      expect(typeof operationen).toBe("object");
      for (const [operation, kanal] of Object.entries(operationen)) {
        expect(kanal).toBe(`${modul}:${operation}`);
      }
    }
  });

  it("vergibt keinen Kanalnamen zweimal", () => {
    // Zwei Operationen auf demselben Namen hiessen: Die zweite Anmeldung wirft beim Start
    // (ipcMain.handle laesst keinen zweiten Handler zu), und zwar erst im laufenden Betrieb.
    const alle = Object.values(KANAELE).flatMap((m) => Object.values(m));
    expect(new Set(alle).size).toBe(alle.length);
  });

  it("fuehrt die fuenf config-Kanaele", () => {
    expect(Object.keys(KANAELE.config).sort()).toEqual([
      "leseKonfig",
      "leseMarke",
      "setzeAktivesProjekt",
      "setzeExportZiel",
      "setzeUIVoreinstellung",
    ]);
  });
});
