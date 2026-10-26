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

  it("fuehrt die vier config-Kanaele (#317: leseMarke ist entfallen)", () => {
    expect(Object.keys(KANAELE.config).sort()).toEqual([
      "leseKonfig",
      "setzeAktivesProjekt",
      "setzeExportZiel",
      "setzeUIVoreinstellung",
    ]);
  });

  it("laesst die Schluesselmengen ALLER uebrigen Bloecke unveraendert (#317)", () => {
    // #317 nimmt genau eine Zeile aus `config`. Der Test haelt die Schluesselmengen
    // der uebrigen Bloecke fest - nicht ihre Werte (die prueft jeder Modultest
    // selbst), sondern dass niemand beim Aufraeumen eine fremde Operation mitzieht
    // oder eine hinzufuegt. Verglichen wird sortiert: Die Reihenfolge ist nur im
    // `config`-Block Vertrag (der Test darueber prueft sie).
    const bloecke = Object.fromEntries(
      Object.entries(KANAELE).map(([modul, operationen]) => [modul, Object.keys(operationen).sort()]),
    );
    expect(bloecke).toEqual({
      queue: ["entferne", "geaendert", "holeStand", "reiheEin", "stoerung", "wiederhole"],
      project: ["autoSpeichernStatus", "bearbeiteAktion", "dupliziereProjekt", "entferneElement", "erstelleAktion", "erstelleProjekt", "fügeElementHinzu", "listeAusgaben", "listeProjekte", "löscheAktion", "löscheProjekt", "ordneNeu", "setzeBearbeitungsstand", "setzeDauer", "setzeEinblendung", "setzeElementReferenz", "setzeStandardMarke", "setzeStandardSegmentdauer", "setzeTrim", "setzeUnterbrechungen", "öffneProjekt", "öffneProjektordner"],
      beenden: ["entscheidung", "status"],
      config: ["leseKonfig", "setzeAktivesProjekt", "setzeExportZiel", "setzeUIVoreinstellung"],
      media: ["öffneMedienDialog"],
      export: ["wähleExportZiel"],
      render: ["fortschritt"],
      vorlagen: ["alsEigenstaendige", "autoSpeichernStatus", "erstelleVorlage", "listeArbeitskopien", "listeVorlagen", "löscheVorlage", "oeffneZurBearbeitung", "pruefeVorlagenReferenzen", "speichereArbeitskopie", "uebernehmeInParent", "verwerfeArbeitskopie"],
      marken: ["autoSpeichernStatus", "bearbeiteMarke", "entferneMarkenDatei", "erstelleMarke", "importiereMarkenDatei", "leseMarke", "listeMarken", "loescheMarke", "pruefeMarkenReferenzen", "öffneMarkenDateiDialog"],
    });
  });
});
