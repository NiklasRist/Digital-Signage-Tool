import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Unit-Test zu #45. Geprueft wird VERHALTEN, nicht die Deklaration: was nach einem Aufruf im
// Datenmodell steht - und vor allem, was auf den Fehlerpfaden NICHT darin steht.
//
// Das Auto-Speichern (#47) ist gemockt. Nicht aus Bequemlichkeit: `planeAutoSpeicherung` startet
// einen echten Timer, der nach Ablauf `schreibeProjekt` (#46) ruft und damit waehrend des
// Testlaufs eine project.json ins Projektverzeichnis schriebe. Der Mock haelt den Test bei der
// Sache und macht zugleich pruefbar, DASS vorgemerkt wird - und mit welchem Objekt.
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: vi.fn(),
}));

const { planeAutoSpeicherung } = await import("../../src/main/project-store/auto-speichern");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { setzeDauer } = await import("../../src/main/project-store/setze-dauer");
const { DAUER_BEREICH, STANDARD_ANZEIGEDAUER_SEKUNDEN } = await import(
  "../../src/shared/contracts/konstanten"
);

function element(id: string, art: Listenelement["art"]): Listenelement {
  return art === "video"
    ? { id, art, ref: "a1", dauer: null, trimStart: 0, trimEnde: 12, einblendung: null }
    : {
        id,
        art,
        ref: "a1",
        dauer: STANDARD_ANZEIGEDAUER_SEKUNDEN,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      };
}

let projekt: Project;

beforeEach(() => {
  projekt = {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-13T08:00:00.000Z",
    geaendertAm: "2026-08-13T08:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [element("s0", "segment"), element("s1", "segment"), element("v1", "video")],
    letzterAusgabeName: null,
  };
  merkeAktivesProjekt(projekt);
  vi.mocked(planeAutoSpeicherung).mockClear();
});

describe("setzeDauer (#45)", () => {
  it("uebernimmt die Untergrenze des Bereichs und merkt den lebenden Stand vor", async () => {
    const ergebnis = await setzeDauer("s0", DAUER_BEREICH.min);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.liste[0]?.dauer).toBe(DAUER_BEREICH.min);
    // toBe, nicht toEqual: Vorgemerkt werden MUSS das lebende Projekt. Eine Kopie bestuende den
    // Inhaltsvergleich und schriebe spaeter einen eingefrorenen Stand auf die Platte.
    expect(vi.mocked(planeAutoSpeicherung).mock.calls[0]?.[0]).toBe(projekt);
  });

  it("uebernimmt die Obergrenze des Bereichs auch fuer ein Aktions-Segment", async () => {
    const ergebnis = await setzeDauer("s1", DAUER_BEREICH.max);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.liste[1]?.dauer).toBe(DAUER_BEREICH.max);
  });

  it("weist einen Wert knapp unterhalb der Untergrenze ab, ohne etwas zu aendern", async () => {
    const ergebnis = await setzeDauer("s0", DAUER_BEREICH.min - 0.001);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.liste[0]?.dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN);
    expect(planeAutoSpeicherung).not.toHaveBeenCalled();
  });

  it("weist einen Wert knapp oberhalb der Obergrenze ab, ohne etwas zu aendern", async () => {
    const ergebnis = await setzeDauer("s0", DAUER_BEREICH.max + 0.001);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.liste[0]?.dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN);
  });

  it("weist NaN ab - eine reine Bereichspruefung liesse es durch", async () => {
    // Der eigentliche Grund fuer diesen Fall: `NaN < min` und `NaN > max` sind BEIDE falsch.
    // Ohne die vorgeschaltete Endlichkeitspruefung stuende NaN im Modell und in der JSON-Datei
    // als `null` - ein Standbild ohne Dauer.
    const ergebnis = await setzeDauer("s0", Number.NaN);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.liste[0]?.dauer).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN);
  });

  it("weist ein Video-Element ab und laesst dessen Trim unberuehrt", async () => {
    const ergebnis = await setzeDauer("v1", DAUER_BEREICH.min);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(projekt.liste[2]?.dauer).toBeNull();
    expect(projekt.liste[2]?.trimEnde).toBe(12);
    expect(planeAutoSpeicherung).not.toHaveBeenCalled();
  });

  it("meldet eine unbekannte Kennung als nicht_gefunden", async () => {
    const ergebnis = await setzeDauer("gibtsnicht", DAUER_BEREICH.min);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "nicht_gefunden" } });
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    merkeAktivesProjekt(null);

    const ergebnis = await setzeDauer("s0", DAUER_BEREICH.min);

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "kein_projekt" } });
  });

  it("reicht einen Nachkommawert unveraendert durch - hier wird NICHT gerundet", async () => {
    // Haelt die heute gebaute Variante fest (Rundung ist Sache des render-service, s. STOPP im
    // Rumpf). Faellt die Entscheidung anders aus, MUSS dieser Test rot werden.
    const krumm = DAUER_BEREICH.min + 0.3456;

    const ergebnis = await setzeDauer("s0", krumm);

    expect(ergebnis.ok).toBe(true);
    expect(projekt.liste[0]?.dauer).toBe(krumm);
  });
});
