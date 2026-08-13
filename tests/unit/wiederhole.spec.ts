import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragStatus } from "../../src/shared/contracts/auftrag";
import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import type { JournalEintrag } from "../../src/shared/contracts/protokoll";

// Verhaltenstests zu wiederhole (#63).
//
// Q1 (#54) laeuft ECHT mit - reiner RAM, und nur so ist wirklich geprueft, dass der
// Auftrag hinten in der Schlange landet und dass kein Duplikat entsteht. Ersetzt sind
// die Nachbarn, die auf die Platte gehen (Q4), einen anderen Speicher lesen (Q2) oder
// deren Wirkung hier nur gezaehlt werden soll (Ereignis #65, Torwaechter #59).
const spuren = vi.hoisted(() => {
  const zustand = {
    stand: null as { projektId: string; datei: { auftraege: unknown[] } } | null,
    journalFehler: false,
    journalWirft: false,
  };
  return {
    zustand,
    holeQ2Stand: vi.fn(() => {
      // Wie #55: eine Kopie der LISTE, aber dieselben Auftrags-Objekte.
      const stand = zustand.stand;
      return stand === null
        ? null
        : { projektId: stand.projektId, datei: { ...stand.datei, auftraege: [...stand.datei.auftraege] } };
    }),
    journal: vi.fn(async (_eintrag: JournalEintrag) => {
      if (zustand.journalWirft) {
        throw new Error("Journal kaputt");
      }
      return zustand.journalFehler
        ? { ok: false as const, fehler: { code: "speicher_fehler", meldung: "Platte voll" } }
        : { ok: true as const, wert: undefined };
    }),
    ereignis: vi.fn(async () => {}),
    starteNaechsten: vi.fn(),
  };
});

vi.mock("../../src/main/auftrags-manager/q2-wiederholung", () => ({
  holeQ2Stand: spuren.holeQ2Stand,
}));
vi.mock("../../src/main/auftrags-manager/q4-journal", () => ({
  haengeJournalEintragAn: spuren.journal,
}));
vi.mock("../../src/main/auftrags-manager/queue-ereignis", () => ({
  sendeQueueGeaendert: spuren.ereignis,
}));
vi.mock("../../src/main/auftrags-manager/torwaechter", () => ({
  starteNaechsten: spuren.starteNaechsten,
}));

type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");
type Wiederhole = typeof import("../../src/main/auftrags-manager/wiederhole").wiederhole;

// Q1 ist fluechtiger Modulzustand ohne Leer-Funktion; ein frisches Modul je Test ist der
// einzige Weg dorthin. Alle Importe nach demselben resetModules treffen dieselbe Instanz.
async function frisch(): Promise<{ q1: Q1Modul; wiederhole: Wiederhole }> {
  vi.resetModules();
  const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
  const { wiederhole } = await import("../../src/main/auftrags-manager/wiederhole");
  return { q1, wiederhole };
}

function auftrag(id: string, status: AuftragStatus = "fehlgeschlagen"): Auftrag {
  return {
    auftragId: id,
    art: "import",
    status,
    label: `Import ${id}`,
    payload: { projektId: "p1", quellPfad: `C:/quelle/${id}.mp4` },
    fortschritt: 80,
    versuche: 1,
    fehler: { code: "kein_platz", meldung: "Der Stick ist voll." },
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

/** Der Q2-Stand des geladenen Projekts - mit genau diesen Objekten. */
function q2Mit(...auftraege: Auftrag[]): void {
  spuren.zustand.stand = { projektId: "p1", datei: { auftraege } };
}

const ids = (auftraege: Auftrag[]): string[] => auftraege.map((a) => a.auftragId);

function bewegungen(): JournalEintrag[] {
  return spuren.journal.mock.calls.map(([eintrag]) => eintrag);
}

function code(ergebnis: Ergebnis<void>): string {
  return ergebnis.ok ? "ok" : ergebnis.fehler.code;
}

describe("wiederhole (#63)", () => {
  beforeEach(() => {
    spuren.zustand.stand = null;
    spuren.zustand.journalFehler = false;
    spuren.zustand.journalWirft = false;
    spuren.holeQ2Stand.mockClear();
    spuren.journal.mockClear();
    spuren.ereignis.mockClear();
    spuren.starteNaechsten.mockClear();
  });

  describe("der Fehlschlag geht zurueck in die Schlange", () => {
    it("stellt denselben Auftrag als anstehend ans Ende von Q1", async () => {
      const { q1, wiederhole } = await frisch();
      const fehlschlag = auftrag("a1");
      q2Mit(fehlschlag);
      q1.fuegeAnsEndeAn(auftrag("wartet", "anstehend"));

      const ergebnis = await wiederhole("a1");

      expect(ergebnis).toEqual({ ok: true, wert: undefined });
      expect(ids(q1.alleQ1())).toEqual(["wartet", "a1"]);
      const eingereiht = q1.findeQ1("a1")?.auftrag;
      expect(eingereiht).toEqual({ ...fehlschlag, status: "anstehend" });
      // payload ist der Snapshot von damals und wird nicht neu beschafft.
      expect(eingereiht?.payload).toBe(fehlschlag.payload);
    });

    it("laesst versuche unveraendert - der Zaehler steigt allein beim Start (#59)", async () => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));

      await wiederhole("a1");

      expect(q1.findeQ1("a1")?.auftrag.versuche).toBe(1);
    });

    it("laesst den Q2-Eintrag bestehen - er ist ein eigenes Objekt (FA-17)", async () => {
      const { q1, wiederhole } = await frisch();
      const fehlschlag = auftrag("a1");
      q2Mit(fehlschlag);

      await wiederhole("a1");
      const eingereiht = q1.findeQ1("a1")?.auftrag;
      // Der Torwaechter setzt spaeter genau das an seinem Q1-Eintrag.
      if (eingereiht !== undefined) {
        eingereiht.status = "laeuft";
      }

      expect(eingereiht).not.toBe(fehlschlag);
      expect(fehlschlag.status).toBe("fehlgeschlagen");
      expect(fehlschlag.fehler).toEqual({ code: "kein_platz", meldung: "Der Stick ist voll." });
      expect(spuren.zustand.stand?.datei.auftraege).toEqual([fehlschlag]);
    });

    it("schreibt genau eine Q4-Bewegung, meldet einmal und stoesst den Torwaechter einmal an", async () => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));
      q1.fuegeAnsEndeAn(auftrag("wartet", "anstehend"));

      await wiederhole("a1");

      expect(bewegungen()).toEqual([
        { zeit: expect.any(String), auftragId: "a1", bewegung: "erneut_eingereiht", position: 2 },
      ]);
      expect(spuren.ereignis).toHaveBeenCalledTimes(1);
      expect(spuren.starteNaechsten).toHaveBeenCalledTimes(1);
    });
  });

  describe("zweiter Aufruf in Folge", () => {
    it("legt keinen zweiten Eintrag an und wiederholt keine Nebenwirkung", async () => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));

      await wiederhole("a1");
      const zweites = await wiederhole("a1");

      expect(zweites).toEqual({ ok: true, wert: undefined });
      expect(ids(q1.alleQ1())).toEqual(["a1"]);
      expect(spuren.journal).toHaveBeenCalledTimes(1);
      expect(spuren.ereignis).toHaveBeenCalledTimes(1);
      expect(spuren.starteNaechsten).toHaveBeenCalledTimes(1);
    });

    it.each<AuftragStatus>(["laeuft", "anstehend", "fehlgeschlagen"])(
      "bleibt wirkungslos, solange der Auftrag als %s in Q1 steht",
      async (status) => {
        const { q1, wiederhole } = await frisch();
        const fehlschlag = auftrag("a1");
        q2Mit(fehlschlag);
        const inQ1 = auftrag("a1", status);
        q1.fuegeAnsEndeAn(inQ1);

        const ergebnis = await wiederhole("a1");

        expect(ergebnis).toEqual({ ok: true, wert: undefined });
        expect(q1.alleQ1()).toEqual([inQ1]);
        expect(inQ1.status).toBe(status);
        expect(spuren.journal).not.toHaveBeenCalled();
        expect(spuren.ereignis).not.toHaveBeenCalled();
        expect(spuren.starteNaechsten).not.toHaveBeenCalled();
      },
    );
  });

  describe("nichts zu wiederholen", () => {
    it("meldet fuer eine unbekannte Kennung nicht_gefunden, ohne Wirkung", async () => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));

      const ergebnis = await wiederhole("unbekannt");

      expect(code(ergebnis)).toBe("nicht_gefunden");
      expect(q1.alleQ1()).toEqual([]);
      expect(spuren.journal).not.toHaveBeenCalled();
      expect(spuren.ereignis).not.toHaveBeenCalled();
      expect(spuren.starteNaechsten).not.toHaveBeenCalled();
    });

    it("meldet nicht_gefunden fuer eine Kennung, die nur in Q1 steht", async () => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));
      q1.fuegeAnsEndeAn(auftrag("nurQ1", "anstehend"));

      const ergebnis = await wiederhole("nurQ1");

      expect(code(ergebnis)).toBe("nicht_gefunden");
      expect(ids(q1.alleQ1())).toEqual(["nurQ1"]);
      expect(spuren.journal).not.toHaveBeenCalled();
    });

    it("meldet nicht_gefunden, wenn gar kein Projekt geladen ist", async () => {
      // Q2 liegt pro Projekt; ein fremder Stand wird NICHT nachgeladen.
      const { q1, wiederhole } = await frisch();

      const ergebnis = await wiederhole("a1");

      expect(code(ergebnis)).toBe("nicht_gefunden");
      expect(q1.alleQ1()).toEqual([]);
      expect(spuren.starteNaechsten).not.toHaveBeenCalled();
    });

    it.each([
      ["leerer String", ""],
      ["kein String", undefined],
      ["kein String (Zahl)", 42],
    ])("meldet bei ungueltiger Kennung (%s) ungueltige_eingabe", async (_fall, eingabe) => {
      const { wiederhole } = await frisch();
      q2Mit(auftrag("a1"));

      // Der Aufruf kommt ueber IPC herein; zur Laufzeit kann dort alles ankommen.
      const ergebnis = await wiederhole(eingabe as unknown as string);

      expect(code(ergebnis)).toBe("ungueltige_eingabe");
      expect(spuren.holeQ2Stand).not.toHaveBeenCalled();
      expect(spuren.journal).not.toHaveBeenCalled();
    });
  });

  describe("Nebenwege drehen das Wiedereinreihen nicht zurueck", () => {
    it.each([
      ["die Q4-Bewegung nicht geschrieben werden kann", "journalFehler" as const],
      ["das Q4-Journal entgegen seinem Vertrag wirft", "journalWirft" as const],
    ])("meldet ok, wenn %s", async (_fall, schalter) => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));
      spuren.zustand[schalter] = true;

      const ergebnis = await wiederhole("a1");

      expect(ergebnis).toEqual({ ok: true, wert: undefined });
      expect(ids(q1.alleQ1())).toEqual(["a1"]);
      expect(spuren.ereignis).toHaveBeenCalledTimes(1);
      expect(spuren.starteNaechsten).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["sendeQueueGeaendert", spuren.ereignis],
      ["starteNaechsten", spuren.starteNaechsten],
    ])("meldet ok, wenn %s wirft", async (_fall, spion) => {
      const { q1, wiederhole } = await frisch();
      q2Mit(auftrag("a1"));
      spion.mockImplementationOnce(() => {
        throw new Error("Nachbar kaputt");
      });

      await expect(wiederhole("a1")).resolves.toEqual({ ok: true, wert: undefined });
      expect(ids(q1.alleQ1())).toEqual(["a1"]);
    });
  });
});
