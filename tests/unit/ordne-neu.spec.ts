import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Listenelement, Project } from "../../src/shared/contracts/project";

// Unit-Test zu #43. Geprueft wird VERHALTEN an der lebenden Liste, nicht die Deklaration.
//
// Gemockt ist allein das Auto-Speichern (#47): Der echte `planeAutoSpeicherung` startet einen
// 4-Sekunden-Timer, der spaeter `schreibeProjekt` ruft - der Test wuerde also nach seinem Ende
// echte Dateien anfassen. Der Mock haelt zugleich fest, OB und MIT WELCHEM Stand die Aenderung
// zum Speichern angemeldet wurde; ohne diese Anmeldung waere die Umsortierung nach dem naechsten
// Programmstart weg.
const angemeldet: Project[] = [];

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: (projekt: Project) => {
    angemeldet.push(projekt);
  },
}));

const { ordneNeu } = await import("../../src/main/project-store/ordne-neu");
const { merkeAktivesProjekt } = await import("../../src/main/project-store/aktives-projekt");
const { mitD1Lock } = await import("../../src/main/project-store/d1-lock");

function element(id: string): Listenelement {
  return {
    id,
    art: "segment",
    ref: `aktion-${id}`,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  };
}

function projektMit(...ids: string[]): Project {
  return {
    id: "p1",
    name: "Studio Nord",
    erstelltAm: "2026-08-12T08:00:00.000Z",
    geaendertAm: "2026-08-12T08:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: ids.map(element),
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

const ids = (projekt: Project): string[] => projekt.liste.map((e) => e.id);

describe("ordneNeu (#43)", () => {
  beforeEach(() => {
    angemeldet.length = 0;
    merkeAktivesProjekt(null);
  });

  it("uebernimmt eine vollstaendige neue Abfolge", async () => {
    const projekt = projektMit("a", "b", "c");
    merkeAktivesProjekt(projekt);

    const ergebnis = await ordneNeu(["c", "a", "b"]);

    expect(ergebnis.ok).toBe(true);
    expect(ids(projekt)).toEqual(["c", "a", "b"]);
    expect(angemeldet).toEqual([projekt]);
  });

  it("haengt dieselben Objekte um, statt sie zu kopieren oder Felder zu ueberschreiben", async () => {
    const projekt = projektMit("a", "b");
    const [a, b] = projekt.liste;
    const arrayVorher = projekt.liste;
    merkeAktivesProjekt(projekt);

    await ordneNeu(["b", "a"]);

    // toBe, nicht toEqual: Eine Kopie bestuende den Inhaltsvergleich und waere trotzdem falsch -
    // wer den alten Verweis haelt, bearbeitete ab dann einen Zwilling.
    expect(projekt.liste[0]).toBe(b);
    expect(projekt.liste[1]).toBe(a);
    // Auch das Array selbst bleibt dasselbe: Eine Zuweisung `liste = neu` liesse jede anderswo
    // gehaltene Array-Referenz fuer immer die alte Reihenfolge sehen.
    expect(projekt.liste).toBe(arrayVorher);
    expect(b).toEqual(element("b"));
  });

  it("lehnt eine unbekannte ID ab, ohne die Liste anzufassen", async () => {
    const projekt = projektMit("a", "b");
    merkeAktivesProjekt(projekt);

    const ergebnis = await ordneNeu(["a", "fremd"]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(ids(projekt)).toEqual(["a", "b"]);
    expect(angemeldet).toEqual([]);
  });

  it("lehnt eine unvollstaendige Abfolge ab - hier verschwaende sonst ein Element", async () => {
    const projekt = projektMit("a", "b", "c");
    merkeAktivesProjekt(projekt);

    const ergebnis = await ordneNeu(["c", "a"]);

    expect(ergebnis.ok).toBe(false);
    expect(ids(projekt)).toEqual(["a", "b", "c"]);
  });

  it("lehnt eine doppelte ID ab - auch wenn die Anzahl stimmt", async () => {
    // Der teure Fall: gleiche Laenge, also faellt eine reine Zaehlpruefung darauf herein.
    // "b" waere danach zweimal in der Liste und "c" weg.
    const projekt = projektMit("a", "b", "c");
    merkeAktivesProjekt(projekt);

    const ergebnis = await ordneNeu(["a", "b", "b"]);

    expect(ergebnis.ok).toBe(false);
    expect(ids(projekt)).toEqual(["a", "b", "c"]);
  });

  it("meldet kein_projekt, wenn gar kein Projekt geoeffnet ist", async () => {
    const ergebnis = await ordneNeu(["a"]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("kein_projekt");
    }
  });

  it("nimmt eine leere Liste an, ohne zu klagen", async () => {
    const projekt = projektMit();
    merkeAktivesProjekt(projekt);

    expect((await ordneNeu([])).ok).toBe(true);
  });

  it("wartet auf das D1-Lock, statt in einen laufenden Schreibvorgang hineinzusortieren", async () => {
    const projekt = projektMit("a", "b");
    merkeAktivesProjekt(projekt);

    let freigeben: () => void = () => {};
    const belegt = mitD1Lock(
      () =>
        new Promise<void>((aufloesen) => {
          freigeben = aufloesen;
        }),
    );

    const laeuft = ordneNeu(["b", "a"]);
    // Genug Microtasks, damit ein Rumpf OHNE Lock laengst fertig waere.
    await Promise.resolve();
    await Promise.resolve();
    expect(ids(projekt)).toEqual(["a", "b"]);

    freigeben();
    await belegt;
    await laeuft;
    expect(ids(projekt)).toEqual(["b", "a"]);
  });
});
