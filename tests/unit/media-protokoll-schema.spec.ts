// Verhaltenstest zu #321 - MEDIA_SCHEMA als Daten statt als Aufruf.
//
// Die vier Privilegien sind gemessen und im Betrieb (#9); der Test vergleicht sie Feld
// fuer Feld gegen den gebauten Stand - ein still veraendertes Privileg aenderte das
// Verhalten der Vorschau, ohne irgendwo einen Fehler zu erzeugen.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { MEDIA_SCHEMA, registriereMediaProtokollHandler } from "../../src/main/media-protokoll";

describe("MEDIA_SCHEMA (#321, aus #9)", () => {
  it("traegt scheme 'media' und GENAU die fuenf Privilegien des gebauten Standes", () => {
    // #364: `corsEnabled` ist die fuenfte Eigenschaft - ohne sie blockiert Chromium
    // jedes `fetch('media://…')` vor dem Handler (gemessen an `marken://`, B15).
    expect(MEDIA_SCHEMA).toEqual({
      scheme: "media",
      privileges: {
        secure: true,
        supportFetchAPI: true,
        stream: true,
        standard: true,
        corsEnabled: true,
      },
    });
    // GENAU FUENF Privilegien: Feldschluesselmenge, nicht nur Werte - toEqual schlaegt
    // bei einem zuvor Kumulierten nur dann zu, wenn ein Wert abweicht, nicht bei einem
    // zusaetzlichen Feld mit "falschem" Wert; die Schluesselmenge schliesst beides aus.
    expect(Object.keys(MEDIA_SCHEMA.privileges ?? {}).sort()).toEqual([
      "corsEnabled",
      "secure",
      "standard",
      "stream",
      "supportFetchAPI",
    ]);
  });

  it("die Funktion registriereMediaProtokollSchema existiert nicht mehr (Grep-Probe auf CODE)", () => {
    // Kommentare ABGESTREIFT: Der Dateikopf erwaehnt "registerSchemesAsPrivileged" als
    // PROSA (Begruendung des Einmal-Zwangs) - das ist kein Aufruf. Ohne Abstreifen
    // geraet die Probe an Prosa statt Code und schlaegt falsch an.
    const ohneKommentare = strippe(testquelle());
    expect(ohneKommentare.includes("registriereMediaProtokollSchema")).toBe(false);
    expect(ohneKommentare.includes("registerSchemesAsPrivileged")).toBe(false);
  });

  it("die echte Registrierung bleibt eine Funktion und die Datei bleibt pfadfrei (Grep-Probe auf CODE)", () => {
    // #340: Der Stub ist GEGENENWARTIG abgelöst; registriereMediaProtokollHandler
    // meldet den echten Aufloeser (project-store) an, ohne selbst Pfade zu bauen.
    expect(typeof registriereMediaProtokollHandler).toBe("function");
    const ohneKommentare = strippe(testquelle());
    expect(ohneKommentare.includes("path.join")).toBe(false);
    expect(ohneKommentare.includes("node:fs")).toBe(false);
    // protocol bleibt GENAU EINMAL im CODE uebrig - in registriereMediaProtokollHandler.
    expect(ohneKommentare.match(/protocol\./g)?.length).toBe(1);
  });
});

/** Liest die Quelldatei; die Tests greifen aufs Dateisystem, deshalb eigener Kopf. */
function testquelle(): string {
  return readFileSync("src/main/media-protokoll.ts", "utf8");
}

/** Streift Block- und Zeilenkommentare ab, ZUERST die Zeilenenden vereinheitlicht. */
function strippe(quelle: string): string {
  return (
    quelle
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n")
  );
}
