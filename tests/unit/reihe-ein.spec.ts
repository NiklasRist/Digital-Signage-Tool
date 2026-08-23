import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import type { Project } from "../../src/shared/contracts/project";
import type { JournalEintrag } from "../../src/shared/contracts/protokoll";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

// Verhaltenstests zu reiheEin (#61).
//
// Q1 (#54) und der Halter des aktiven Projekts (#192) laufen ECHT mit - beides ist
// reiner RAM. Nur so ist wirklich geprueft, dass der Auftrag in der Schlange landet
// und dass der Label-Nachschlag am geladenen Projekt haengt. Ersetzt sind die
// Nachbarn, die auf die Platte gehen (Q4), die ueber holeStand weitere Speicher
// ziehen (#65) und die Arbeit anstossen wuerden (Torwaechter #59) - fuer die
// interessiert hier allein, OB und WIE OFT sie gerufen werden. Der letzte Test
// dreht das um und laesst den echten Torwaechter laufen.
const spuren = vi.hoisted(() => {
  const zustand = { journalFehler: false, journalHaengt: false };
  return {
    zustand,
    journal: vi.fn((_eintrag: JournalEintrag) => {
      if (zustand.journalHaengt) {
        return new Promise<never>(() => {});
      }
      return Promise.resolve(
        zustand.journalFehler
          ? { ok: false as const, fehler: { code: "speicher_fehler", meldung: "Platte voll" } }
          : { ok: true as const, wert: undefined },
      );
    }),
    ereignis: vi.fn(async () => {}),
    starteNaechsten: vi.fn(),
    protokollEintrag: vi.fn(),
  };
});

vi.mock("../../src/main/auftrags-manager/q4-journal", () => ({
  haengeJournalEintragAn: spuren.journal,
}));
vi.mock("../../src/main/auftrags-manager/queue-ereignis", () => ({
  sendeQueueGeaendert: spuren.ereignis,
}));
vi.mock("../../src/main/auftrags-manager/torwaechter", () => ({
  starteNaechsten: spuren.starteNaechsten,
}));
// Q3 wird von reiheEin gar nicht erst importiert; der Spion haelt die Invariante
// "ein Auftrag, der die Schlange nie verlassen hat, erzeugt keinen Protokolleintrag"
// (TK 9.3) trotzdem fest - er schlaegt an, sobald jemand sie aufweicht.
vi.mock("../../src/main/auftrags-manager/q3-protokoll", () => ({
  haengeProtokollEintragAn: spuren.protokollEintrag,
}));

type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");
type ProjektModul = typeof import("../../src/main/project-store/aktives-projekt");
type ReiheEin = typeof import("../../src/main/auftrags-manager/reihe-ein").reiheEin;

// Q1 und der Projekt-Halter sind fluechtiger Modulzustand ohne Leer-Funktion; ein
// frisches Modul je Test ist der einzige Weg zu beidem.
async function frisch(): Promise<{ q1: Q1Modul; projekt: ProjektModul; reiheEin: ReiheEin }> {
  vi.resetModules();
  const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
  const projekt = await import("../../src/main/project-store/aktives-projekt");
  const { reiheEin } = await import("../../src/main/auftrags-manager/reihe-ein");
  return { q1, projekt, reiheEin };
}

const renderNutzlast = {
  renderId: "r-1",
  projektId: "p1",
  elemente: [],
  profil: RENDER_PROFILE,
  ausgabeName: "woche-32",
};

const importNutzlast = { projektId: "p1", quellPfad: "C:\\Videos\\sommer-aktion.mp4" };
const exportNutzlast = { projektId: "p1", dateiname: "woche-32.mp4", zielPfad: "E:\\" };

function projektMitAsset(assetId: string, originalname: string): Project {
  return {
    id: "p1",
    name: "Studio",
    erstelltAm: "2026-08-01T10:00:00.000Z",
    geaendertAm: "2026-08-01T10:00:00.000Z",
    schemaVersion: 1,
    assets: [
      {
        id: assetId,
        typ: "video",
        dateiname: `${assetId}.mp4`,
        originalname,
        maße: { breite: 1920, höhe: 1080 },
        dauer: 12,
        importdatum: "2026-08-01T10:00:00.000Z",
        zustand: "ok",
      },
    ],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  };
}

function bewegungen(): JournalEintrag[] {
  return spuren.journal.mock.calls.map(([eintrag]) => eintrag);
}

function label(auftraege: Auftrag[]): string {
  return auftraege[0]?.label ?? "(kein Auftrag)";
}

describe("reiheEin (#61)", () => {
  beforeEach(() => {
    spuren.zustand.journalFehler = false;
    spuren.zustand.journalHaengt = false;
    spuren.journal.mockClear();
    spuren.ereignis.mockClear();
    spuren.starteNaechsten.mockClear();
    spuren.protokollEintrag.mockClear();
  });

  it("stellt den Auftrag anstehend in Q1 und antwortet mit seiner UUID", async () => {
    const { q1, reiheEin } = await frisch();

    const ergebnis = await reiheEin("render", renderNutzlast);

    expect(ergebnis.ok).toBe(true);
    const auftrag = q1.alleQ1()[0];
    expect(auftrag).toMatchObject({
      art: "render",
      status: "anstehend",
      versuche: 0,
      fortschritt: null,
      fehler: null,
      ergebnis: null,
      label: "Render: woche-32.mp4",
    });
    expect(auftrag?.auftragId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(ergebnis.ok && ergebnis.wert.auftragId).toBe(auftrag?.auftragId);
    // Identitaet, nicht Gleichheit: Der eingereihte payload IST der Snapshot (TK 9.3.5).
    // Eine Kopie waere ein zweiter Stand, und die Frage, welcher gerendert wird.
    expect(auftrag?.payload).toBe(renderNutzlast);
  });

  it("haelt die Aufrufreihenfolge ein (FIFO) und zaehlt die Position mit", async () => {
    const { q1, reiheEin } = await frisch();

    const erst = await reiheEin("import", importNutzlast);
    const dann = await reiheEin("export", exportNutzlast);

    expect(q1.alleQ1().map((a) => a.auftragId)).toEqual([
      erst.ok && erst.wert.auftragId,
      dann.ok && dann.wert.auftragId,
    ]);
    expect(bewegungen().map((b) => b.position)).toEqual([1, 2]);
  });

  it("schreibt genau eine Q4-Bewegung eingereiht und keinen Q3-Eintrag", async () => {
    const { q1, reiheEin } = await frisch();

    await reiheEin("render", renderNutzlast);

    const auftrag = q1.alleQ1()[0];
    expect(bewegungen()).toEqual([
      { zeit: auftrag?.erstelltAm, auftragId: auftrag?.auftragId, bewegung: "eingereiht", position: 1 },
    ]);
    expect(spuren.protokollEintrag).not.toHaveBeenCalled();
  });

  it("meldet queue:geaendert und stoesst den Torwaechter je genau einmal an", async () => {
    const { reiheEin } = await frisch();

    await reiheEin("render", renderNutzlast);

    expect(spuren.ereignis).toHaveBeenCalledTimes(1);
    expect(spuren.starteNaechsten).toHaveBeenCalledTimes(1);
  });

  it("reiht auch dann ein, wenn die Q4-Bewegung nicht geschrieben werden kann", async () => {
    const { q1, reiheEin } = await frisch();
    spuren.zustand.journalFehler = true;

    const ergebnis = await reiheEin("render", renderNutzlast);

    expect(ergebnis.ok).toBe(true);
    expect(q1.alleQ1()).toHaveLength(1);
  });

  it("wartet nicht auf das Journal", async () => {
    // Das Journal loest NIE auf. Ohne die Zusage "nicht abgewartet" liefe dieser Test
    // in den Zeitablauf statt in eine Antwort - eine gesperrte Diagnosedatei duerfte
    // die Antwortzeit von reiheEin nicht bestimmen.
    const { q1, reiheEin } = await frisch();
    spuren.zustand.journalHaengt = true;

    const ergebnis = await reiheEin("render", renderNutzlast);

    expect(ergebnis.ok).toBe(true);
    expect(q1.alleQ1()).toHaveLength(1);
    expect(spuren.ereignis).toHaveBeenCalledTimes(1);
  });

  describe("ungueltige Nutzlast", () => {
    it.each([
      ["unbekannte Art", "loeschen_alles", importNutzlast],
      ["keine Nutzlast", "import", undefined],
      ["Nutzlast kein Objekt", "import", "C:\\Videos\\x.mp4"],
      ["Nutzlast passt nicht zur Art", "import", renderNutzlast],
      ["Pflichtfeld leer", "render", { ...renderNutzlast, ausgabeName: "   " }],
      ["Pflichtfeld falsch typisiert", "export", { ...exportNutzlast, dateiname: 42 }],
    ])("lehnt %s mit ungueltige_eingabe ab, ohne jede Spur", async (_fall, art, nutzlast) => {
      const { q1, reiheEin } = await frisch();

      // Der Aufruf kommt ueber #71 vom Renderer herein; zur Laufzeit kann dort alles
      // ankommen - deshalb die Umschreibung.
      const ergebnis = await (reiheEin as unknown as (a: unknown, p: unknown) => Promise<
        Awaited<ReturnType<ReiheEin>>
      >)(art, nutzlast);

      expect(ergebnis.ok).toBe(false);
      expect(!ergebnis.ok && ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(q1.alleQ1()).toEqual([]);
      expect(spuren.journal).not.toHaveBeenCalled();
      expect(spuren.ereignis).not.toHaveBeenCalled();
      expect(spuren.starteNaechsten).not.toHaveBeenCalled();
    });
  });

  describe("label", () => {
    it.each([
      ["Windows-Trenner", "C:\\Videos\\sommer-aktion.mp4"],
      ["POSIX-Trenner", "/Users/n/Videos/sommer-aktion.mp4"],
    ])("nennt beim Import den Dateinamen ohne Verzeichnisanteil (%s)", async (_fall, quellPfad) => {
      const { q1, reiheEin } = await frisch();

      await reiheEin("import", { projektId: "p1", quellPfad });

      expect(label(q1.alleQ1())).toBe("Import: sommer-aktion.mp4");
    });

    it("haengt beim Render die Endung an den Ausgabenamen", async () => {
      const { q1, reiheEin } = await frisch();

      await reiheEin("render", renderNutzlast);

      expect(label(q1.alleQ1())).toBe("Render: woche-32.mp4");
    });

    it("nimmt beim Export den Dateinamen, wie er ist", async () => {
      const { q1, reiheEin } = await frisch();

      await reiheEin("export", exportNutzlast);

      expect(label(q1.alleQ1())).toBe("Export: woche-32.mp4");
    });

    it("schlaegt beim Loeschen den originalname im geladenen Projekt nach", async () => {
      const { q1, projekt, reiheEin } = await frisch();
      projekt.merkeAktivesProjekt(projektMitAsset("a-1", "sommer-aktion.mp4"));

      await reiheEin("loeschen", { projektId: "p1", assetId: "a-1" });

      expect(label(q1.alleQ1())).toBe("Löschen: sommer-aktion.mp4");
    });

    it.each([
      ["kein Projekt geoeffnet", null, { projektId: "p1", assetId: "a-1" }],
      ["fremdes Projekt", projektMitAsset("a-1", "sommer-aktion.mp4"), { projektId: "p2", assetId: "a-1" }],
      ["Asset nicht im Projekt", projektMitAsset("a-1", "sommer-aktion.mp4"), { projektId: "p1", assetId: "a-9" }],
    ])("reiht beim Loeschen auch ohne Namen ein (%s)", async (_fall, stand, nutzlast) => {
      // Kein nicht_gefunden: Ob das Medium existiert, entscheidet sich erst beim
      // Ausfuehren. Und niemals die assetId als Ersatzname - "Loeschen: 9f3c…-a1" waere
      // im Panel wertlos.
      const { q1, projekt, reiheEin } = await frisch();
      projekt.merkeAktivesProjekt(stand);

      const ergebnis = await reiheEin("loeschen", nutzlast);

      expect(ergebnis.ok).toBe(true);
      expect(label(q1.alleQ1())).toBe("Löschen: unbekannte Datei");
    });
  });

  it("kehrt zurueck, ohne auf den Ausgang zu warten, und startet den zweiten Auftrag nicht", async () => {
    // Der einzige Test MIT echtem Torwaechter (#59) und echter Registry (#60): Nur so
    // ist beobachtbar, dass reiheEin den Ausgang nicht abwartet (der Handler loest nie
    // auf) und dass die serielle Zusage nicht hier, sondern im Torwaechter haengt.
    vi.resetModules();
    vi.doUnmock("../../src/main/auftrags-manager/torwaechter");
    try {
      const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
      const registry = await import("../../src/main/auftrags-manager/dispatcher");
      const { reiheEin } = await import("../../src/main/auftrags-manager/reihe-ein");
      registry.registriereAuftragsHandler("import", () => new Promise(() => {}));

      const erst = await reiheEin("import", importNutzlast);
      const dann = await reiheEin("import", { projektId: "p1", quellPfad: "/tmp/zweiter.mp4" });

      expect(erst.ok).toBe(true);
      expect(dann.ok).toBe(true);
      expect(q1.alleQ1().map((a) => a.status)).toEqual(["laeuft", "anstehend"]);
    } finally {
      vi.doMock("../../src/main/auftrags-manager/torwaechter", () => ({
        starteNaechsten: spuren.starteNaechsten,
      }));
      vi.resetModules();
    }
  });
});
