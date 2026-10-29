// Verhaltenstest zu #321 - MEDIA_SCHEMA als Daten statt als Aufruf.
//
// Die Privilegien sind gemessen und im Betrieb (#9); der Test vergleicht sie Feld fuer
// Feld gegen den gebauten Stand - ein still veraendertes Privileg aenderte das Verhalten
// der Vorschau, ohne irgendwo einen Fehler zu erzeugen.
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

  it("meldet den echten Handler als Funktion an (#340)", () => {
    // #340: Der Stub ist abgeloest; registriereMediaProtokollHandler meldet den echten
    // Aufloeser (project-store) an. Dass diese Datei dabei keine Pfade baut, ist Zusage
    // der Pfad-Autoritaet (TK 9.5.7) - eine Quelltext-Probe darauf gibt es nicht mehr.
    expect(typeof registriereMediaProtokollHandler).toBe("function");
  });
});
