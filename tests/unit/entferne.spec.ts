import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragStatus } from "../../src/shared/contracts/auftrag";
import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import type { JournalEintrag } from "../../src/shared/contracts/protokoll";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

// Verhaltenstests zu entferne (#62): die drei Faelle und was sie NICHT anfassen.
//
// Q1 (#54) und die Handler-Registry (#60) laufen ECHT mit - beides ist reiner RAM.
// Nur so ist wirklich geprueft, dass der Auftrag aus der Schlange verschwindet und
// dass der Abbrecher ueber die Registry erreicht wird; mit einem Q1-Mock waere beides
// bloss nachgestellt. Ersetzt sind die Nachbarn, die auf die Platte gehen (Q3, Q4),
// die einen anderen Speicher lesen (Q2) oder deren Rumpf noch offen ist und beim
// Aufruf wirft (Torwaechter #59). `queue-ereignis` (#65) ist ersetzt, weil es sonst
// ueber holeStand Q2 zieht - hier interessiert allein, DASS und WIE OFT gemeldet wird.
const spuren = vi.hoisted(() => {
  const zustand = { journalFehler: false };
  return {
    zustand,
    journal: vi.fn(async (_eintrag: JournalEintrag) =>
      zustand.journalFehler
        ? { ok: false as const, fehler: { code: "speicher_fehler", meldung: "Platte voll" } }
        : { ok: true as const, wert: undefined },
    ),
    ereignis: vi.fn(async () => {}),
    protokollEintrag: vi.fn(),
    starteNaechsten: vi.fn(),
    holeQ2Stand: vi.fn(() => null),
  };
});

vi.mock("../../src/main/auftrags-manager/q4-journal", () => ({
  haengeJournalEintragAn: spuren.journal,
}));
vi.mock("../../src/main/auftrags-manager/queue-ereignis", () => ({
  sendeQueueGeaendert: spuren.ereignis,
}));
vi.mock("../../src/main/auftrags-manager/q3-protokoll", () => ({
  haengeProtokollEintragAn: spuren.protokollEintrag,
}));
vi.mock("../../src/main/auftrags-manager/torwaechter", () => ({
  starteNaechsten: spuren.starteNaechsten,
}));
vi.mock("../../src/main/auftrags-manager/q2-wiederholung", () => ({
  holeQ2Stand: spuren.holeQ2Stand,
}));

type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");
type RegistryModul = typeof import("../../src/main/auftrags-manager/dispatcher");
type Entferne = typeof import("../../src/main/auftrags-manager/entferne").entferne;

// Q1 und die Registry sind fluechtiger Modulzustand ohne Leer-Funktion; ein frisches
// Modul je Test ist der einzige Weg zu beidem. Alle Importe nach demselben
// resetModules treffen dieselbe Instanz - auch die, die entferne intern zieht.
async function frisch(): Promise<{ q1: Q1Modul; registry: RegistryModul; entferne: Entferne }> {
  vi.resetModules();
  const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
  const registry = await import("../../src/main/auftrags-manager/dispatcher");
  const { entferne } = await import("../../src/main/auftrags-manager/entferne");
  return { q1, registry, entferne };
}

function importAuftrag(id: string, status: AuftragStatus = "anstehend"): Auftrag {
  return {
    auftragId: id,
    art: "import",
    status,
    label: `Import ${id}`,
    payload: { projektId: "p1", quellPfad: `C:/quelle/${id}.mp4` },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

function renderAuftrag(id: string, status: AuftragStatus = "laeuft"): Auftrag {
  return {
    auftragId: id,
    art: "render",
    status,
    label: "Sommeraktion rendern",
    payload: {
      renderId: "r-42",
      projektId: "p1",
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: "sommeraktion",
    },
    fortschritt: 40,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

const ids = (auftraege: Auftrag[]): string[] => auftraege.map((a) => a.auftragId);

function bewegungen(): JournalEintrag[] {
  return spuren.journal.mock.calls.map(([eintrag]) => eintrag);
}

function code(ergebnis: Ergebnis<void>): string {
  return ergebnis.ok ? "ok" : ergebnis.fehler.code;
}

describe("entferne (#62)", () => {
  beforeEach(() => {
    spuren.zustand.journalFehler = false;
    spuren.journal.mockClear();
    spuren.ereignis.mockClear();
    spuren.protokollEintrag.mockClear();
    spuren.starteNaechsten.mockClear();
    spuren.holeQ2Stand.mockClear();
  });

  describe("Fall 1 - anstehender Auftrag", () => {
    it("nimmt ihn aus Q1, schreibt genau eine Q4-Bewegung, meldet einmal und liefert ok", async () => {
      const { q1, entferne } = await frisch();
      q1.fuegeAnsEndeAn(importAuftrag("a1"));
      q1.fuegeAnsEndeAn(importAuftrag("a2"));

      const ergebnis = await entferne("a1");

      expect(ergebnis).toEqual({ ok: true, wert: undefined });
      expect(ids(q1.alleQ1())).toEqual(["a2"]);
      expect(bewegungen()).toEqual([
        { zeit: expect.any(String), auftragId: "a1", bewegung: "entfernt", position: 1 },
      ]);
      expect(spuren.ereignis).toHaveBeenCalledTimes(1);
      expect(spuren.protokollEintrag).not.toHaveBeenCalled();
    });

    it("nennt in der Q4-Bewegung den Platz VOR dem Entfernen", async () => {
      const { q1, entferne } = await frisch();
      q1.fuegeAnsEndeAn(importAuftrag("a1"));
      q1.fuegeAnsEndeAn(importAuftrag("a2"));
      q1.fuegeAnsEndeAn(importAuftrag("a3"));

      await entferne("a2");

      expect(bewegungen()[0]?.position).toBe(2);
      expect(ids(q1.alleQ1())).toEqual(["a1", "a3"]);
    });

    it("meldet Erfolg, auch wenn die Q4-Bewegung nicht geschrieben werden kann", async () => {
      // Q4 ist rein diagnostisch, und der Auftrag IST zu diesem Zeitpunkt aus Q1
      // verschwunden: Ein Fehler hier hiesse dem Nutzer, das Entfernen sei
      // misslungen, waehrend das Panel den Auftrag nicht mehr zeigt.
      const { q1, entferne } = await frisch();
      q1.fuegeAnsEndeAn(importAuftrag("a1"));
      spuren.zustand.journalFehler = true;

      const ergebnis = await entferne("a1");

      expect(ergebnis).toEqual({ ok: true, wert: undefined });
      expect(q1.alleQ1()).toEqual([]);
      expect(spuren.ereignis).toHaveBeenCalledTimes(1);
    });
  });

  describe("Fall 2 - laufender Render", () => {
    it("ruft den Abbrecher mit genau diesem Auftrag und meldet sofort ok", async () => {
      const { q1, registry, entferne } = await frisch();
      const abbrecher = vi.fn();
      registry.registriereAuftragsHandler("render", async () => ({ status: "erfolg", ergebnis: null }), abbrecher);
      const auftrag = renderAuftrag("r1");
      q1.fuegeAnsEndeAn(auftrag);

      const ergebnis = await entferne("r1");

      expect(ergebnis).toEqual({ ok: true, wert: undefined });
      // Identitaet, nicht Gleichheit: Der Abbrecher (#68) zieht die renderId aus
      // auftrag.payload - eine Kopie wuerde die Verknuepfung zum lebenden Q1-Eintrag
      // verlieren.
      expect(abbrecher).toHaveBeenCalledTimes(1);
      expect(abbrecher.mock.calls[0]?.[0]).toBe(auftrag);
    });

    it("laesst Auftrag und Warteschlange unveraendert und schliesst nichts ab", async () => {
      const { q1, registry, entferne } = await frisch();
      registry.registriereAuftragsHandler("render", async () => ({ status: "erfolg", ergebnis: null }), vi.fn());
      const auftrag = renderAuftrag("r1");
      q1.fuegeAnsEndeAn(auftrag);

      await entferne("r1");

      expect(auftrag.status).toBe("laeuft");
      expect(auftrag.fehler).toBeNull();
      expect(auftrag.fortschritt).toBe(40);
      expect(ids(q1.alleQ1())).toEqual(["r1"]);
      // Der Endzustand entsteht genau einmal im Abschlussweg (#70) - zwei Wege
      // dorthin waeren zwei Wahrheiten ueber denselben Auftrag.
      expect(spuren.protokollEintrag).not.toHaveBeenCalled();
      expect(spuren.starteNaechsten).not.toHaveBeenCalled();
      expect(spuren.journal).not.toHaveBeenCalled();
    });
  });

  describe("Fall 3 - alles Uebrige", () => {
    it("lehnt einen laufenden Auftrag ohne Abbrecher mit ungueltige_eingabe ab", async () => {
      const { q1, registry, entferne } = await frisch();
      // Handler OHNE brichAb - genau der laufende Nicht-Render aus der
      // Fehlerpfad-Tabelle: kannAbbrechen('import') === false.
      registry.registriereAuftragsHandler("import", async () => ({ status: "erfolg", ergebnis: null }));
      const auftrag = importAuftrag("i1", "laeuft");
      q1.fuegeAnsEndeAn(auftrag);

      const ergebnis = await entferne("i1");

      expect(code(ergebnis)).toBe("ungueltige_eingabe");
      expect(registry.kannAbbrechen("import")).toBe(false);
      expect(auftrag.status).toBe("laeuft");
      expect(ids(q1.alleQ1())).toEqual(["i1"]);
      expect(spuren.journal).not.toHaveBeenCalled();
      expect(spuren.ereignis).not.toHaveBeenCalled();
    });

    it.each<AuftragStatus>(["erfolg", "fehlgeschlagen", "abgebrochen"])(
      "meldet fuer einen beendeten Auftrag (%s) nicht_gefunden, ohne Wirkung",
      async (status) => {
        const { q1, entferne } = await frisch();
        q1.fuegeAnsEndeAn(importAuftrag("a1", status));

        const ergebnis = await entferne("a1");

        expect(code(ergebnis)).toBe("nicht_gefunden");
        expect(ids(q1.alleQ1())).toEqual(["a1"]);
        expect(spuren.journal).not.toHaveBeenCalled();
        expect(spuren.ereignis).not.toHaveBeenCalled();
      },
    );

    it("meldet fuer eine unbekannte Kennung nicht_gefunden und befragt Q2 gar nicht erst", async () => {
      // Ein Auftrag, den es nur als Q2-Eintrag (fehlgeschlagen) gibt, ist genau
      // dieser Fall: "Verwerfen" ist keine Operation, also gibt es fuer entferne
      // keinen Grund, Q2 ueberhaupt anzusehen.
      const { q1, entferne } = await frisch();
      q1.fuegeAnsEndeAn(importAuftrag("a1"));

      const ergebnis = await entferne("unbekannt");

      expect(code(ergebnis)).toBe("nicht_gefunden");
      expect(ids(q1.alleQ1())).toEqual(["a1"]);
      expect(spuren.holeQ2Stand).not.toHaveBeenCalled();
      expect(spuren.journal).not.toHaveBeenCalled();
      expect(spuren.ereignis).not.toHaveBeenCalled();
    });

    it.each([
      ["leerer String", ""],
      ["kein String", undefined],
      ["kein String (Zahl)", 42],
    ])("meldet bei ungueltiger Kennung (%s) ungueltige_eingabe", async (_fall, eingabe) => {
      const { q1, entferne } = await frisch();
      q1.fuegeAnsEndeAn(importAuftrag("a1"));

      // Der Aufruf kommt ueber IPC herein; zur Laufzeit kann dort alles ankommen.
      const ergebnis = await entferne(eingabe as unknown as string);

      expect(code(ergebnis)).toBe("ungueltige_eingabe");
      expect(ids(q1.alleQ1())).toEqual(["a1"]);
      expect(spuren.journal).not.toHaveBeenCalled();
      expect(spuren.ereignis).not.toHaveBeenCalled();
    });
  });

  it("ruft brich gar nicht erst, wenn die Art nicht abbrechbar ist", async () => {
    // Der einzige Test, der die Registry ERSETZT: Mit der echten (#60) ist "brich wurde
    // nicht aufgerufen" nicht beobachtbar - ohne registrierten Abbrecher ist der Aufruf
    // wirkungslos und hinterlaesst keine Spur. Genau das verlangt die DoD aber
    // ausdruecklich, weil ein Abbrecher, der trotz kannAbbrechen === false gerufen wird,
    // spaeter einen fremden Auftrag toeten koennte.
    vi.resetModules();
    const brich = vi.fn(() => true);
    vi.doMock("../../src/main/auftrags-manager/dispatcher", () => ({
      kannAbbrechen: () => false,
      brich,
    }));
    try {
      const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
      const { entferne } = await import("../../src/main/auftrags-manager/entferne");
      q1.fuegeAnsEndeAn(importAuftrag("i1", "laeuft"));

      const ergebnis = await entferne("i1");

      expect(code(ergebnis)).toBe("ungueltige_eingabe");
      expect(brich).not.toHaveBeenCalled();
    } finally {
      vi.doUnmock("../../src/main/auftrags-manager/dispatcher");
      vi.resetModules();
    }
  });

  it("wirft nie, sondern antwortet in der Ergebnis-Huelle", async () => {
    const { q1, registry, entferne } = await frisch();
    // Ein Abbrecher, der wirft, ist der einzige Weg, aus einem Nachbarn heraus eine
    // Ausnahme in diesen Ablauf zu tragen; #60 faengt sie und meldet trotzdem true.
    registry.registriereAuftragsHandler("render", async () => ({ status: "erfolg", ergebnis: null }), () => {
      throw new Error("ffmpeg reagiert nicht");
    });
    q1.fuegeAnsEndeAn(renderAuftrag("r1"));

    await expect(entferne("r1")).resolves.toEqual({ ok: true, wert: undefined });
  });
});
