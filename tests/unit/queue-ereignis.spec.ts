import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragStatus } from "../../src/shared/contracts/auftrag";

// Verhaltenstests zu queue-ereignis (#65): WER bekommt WANN WAS gemeldet.
//
// Gemockt ist nur Q2 (#55) - es haengt an der Platte (queue-retry.json im
// Projektordner), und ein Push darf keine Datei-I/O ausloesen. Q1 (#54) und
// holeStand (#64) laufen ECHT mit: Nur so ist die geforderte Gleichheit von
// Push-Nutzlast und holeStand-Ergebnis wirklich geprueft und nicht bloss
// nachgestellt. Der Q2-Mock kann ausserdem werfen - das ist der einzige Weg, den
// Auffangzweig von holeStand (ok: false) herzustellen.
const q2 = vi.hoisted(() => ({
  stand: null as { projektId: string; datei: { schemaVersion: number; auftraege: unknown[]; pendingDeletions: unknown[] } } | null,
  wirft: false,
}));

vi.mock("../../src/main/auftrags-manager/q2-wiederholung", () => ({
  holeQ2Stand: () => {
    if (q2.wirft) {
      throw new Error("Q2 unlesbar");
    }
    return q2.stand;
  },
}));

// Diese drei duerfen von einer reinen Benachrichtigung nicht angefasst werden.
// Sie sind gemockt, damit ein Aufruf als Spur zurueckbleibt, statt auf die Platte
// zu gehen bzw. (starteNaechsten, #59) an seinem Rumpf zu werfen.
const spuren = vi.hoisted(() => ({
  starteNaechsten: vi.fn(),
  protokoll: vi.fn(),
  journal: vi.fn(),
}));

vi.mock("../../src/main/auftrags-manager/torwaechter", () => ({
  starteNaechsten: spuren.starteNaechsten,
}));
vi.mock("../../src/main/auftrags-manager/q3-protokoll", () => ({
  haengeProtokollEintragAn: spuren.protokoll,
}));
vi.mock("../../src/main/auftrags-manager/q4-journal", () => ({
  haengeJournalEintragAn: spuren.journal,
}));

type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");
type EreignisModul = typeof import("../../src/main/auftrags-manager/queue-ereignis");
type HoleStand = typeof import("../../src/main/auftrags-manager/hole-stand").holeStand;

// Q1 ist fluechtiger Modulzustand ohne Leer-Funktion, und die Hoererliste von #65
// ebenso; ein frisches Modul je Test ist der einzige Weg zu beidem. Alle Importe
// nach demselben resetModules treffen dieselbe Instanz - auch die, die
// sendeQueueGeaendert intern zieht.
async function frisch(): Promise<{ q1: Q1Modul; ereignis: EreignisModul; holeStand: HoleStand }> {
  vi.resetModules();
  const q1 = await import("../../src/main/auftrags-manager/q1-warteschlange");
  const { holeStand } = await import("../../src/main/auftrags-manager/hole-stand");
  const ereignis = await import("../../src/main/auftrags-manager/queue-ereignis");
  return { q1, ereignis, holeStand };
}

function auftrag(
  id: string,
  status: AuftragStatus = "anstehend",
  erstelltAm = "2026-08-13T10:00:00.000Z",
): Auftrag {
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
    erstelltAm,
  };
}

function q2Stand(auftraege: Auftrag[]): void {
  q2.stand = { projektId: "p1", datei: { schemaVersion: 1, auftraege, pendingDeletions: [] } };
}

const ids = (auftraege: Auftrag[]): string[] => auftraege.map((a) => a.auftragId);

describe("queue-ereignis (#65)", () => {
  beforeEach(() => {
    q2.stand = null;
    q2.wirft = false;
    spuren.starteNaechsten.mockClear();
    spuren.protokoll.mockClear();
    spuren.journal.mockClear();
  });

  it("meldet jedem Hoerer genau einmal denselben Stand, den holeStand liefert", async () => {
    const { q1, ereignis, holeStand } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("l1", "laeuft"));
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q2Stand([auftrag("f1", "fehlgeschlagen", "2026-08-01T08:00:00.000Z")]);
    const eins: Auftrag[][] = [];
    const zwei: Auftrag[][] = [];
    ereignis.aufQueueGeaendert((a) => eins.push(a));
    ereignis.aufQueueGeaendert((a) => zwei.push(a));

    await ereignis.sendeQueueGeaendert();

    const erwartet = await holeStand();
    expect(erwartet.ok && erwartet.wert).toEqual(eins[0]);
    expect(ids(eins[0] ?? [])).toEqual(["l1", "a1", "f1"]);
    expect(eins).toHaveLength(1);
    expect(zwei).toEqual(eins);
  });

  it("meldet ein nacktes Array ohne Ergebnis-Huelle", async () => {
    const { q1, ereignis } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    let nutzlast: unknown;
    ereignis.aufQueueGeaendert((a) => {
      nutzlast = a;
    });

    await ereignis.sendeQueueGeaendert();

    expect(Array.isArray(nutzlast)).toBe(true);
    expect(nutzlast).not.toHaveProperty("ok");
    expect(nutzlast).not.toHaveProperty("wert");
    expect(nutzlast).not.toHaveProperty("fehler");
  });

  it("meldet bei leerer Warteschlange ein leeres Array statt gar nichts", async () => {
    const { ereignis } = await frisch();
    const meldungen: Auftrag[][] = [];
    ereignis.aufQueueGeaendert((a) => meldungen.push(a));

    await ereignis.sendeQueueGeaendert();

    expect(meldungen).toEqual([[]]);
  });

  it("erfuellt sein Promise erst nach der Meldung und haelt die Aufrufreihenfolge", async () => {
    const { q1, ereignis } = await frisch();
    const meldungen: string[][] = [];
    ereignis.aufQueueGeaendert((a) => meldungen.push(ids(a)));

    q1.fuegeAnsEndeAn(auftrag("a1"));
    await ereignis.sendeQueueGeaendert();
    // Die Pruefung VOR dem zweiten Aufruf: Waere die Meldung erst spaeter faellig,
    // stuende hier noch nichts.
    expect(meldungen).toEqual([["a1"]]);

    q1.fuegeAnsEndeAn(auftrag("a2"));
    await ereignis.sendeQueueGeaendert();

    expect(meldungen).toEqual([["a1"], ["a1", "a2"]]);
  });

  it("meldet nach dem Abmelden nicht mehr", async () => {
    const { ereignis } = await frisch();
    let anzahl = 0;
    const abmelden = ereignis.aufQueueGeaendert(() => {
      anzahl += 1;
    });

    await ereignis.sendeQueueGeaendert();
    abmelden();
    await ereignis.sendeQueueGeaendert();
    // Zweites Abmelden darf nicht werfen.
    abmelden();

    expect(anzahl).toBe(1);
  });

  it("haelt zwei Anmeldungen derselben Funktion auseinander", async () => {
    const { ereignis } = await frisch();
    let anzahl = 0;
    const hoerer = (): void => {
      anzahl += 1;
    };
    const abmelden = ereignis.aufQueueGeaendert(hoerer);
    ereignis.aufQueueGeaendert(hoerer);

    abmelden();
    await ereignis.sendeQueueGeaendert();

    // Die zweite Anmeldung lebt weiter - ein Set<Hoerer> haette hier 0 gezaehlt.
    expect(anzahl).toBe(1);
  });

  it("laesst einen werfenden Hoerer die uebrigen nicht mitreissen", async () => {
    const { ereignis } = await frisch();
    const erreicht: string[] = [];
    ereignis.aufQueueGeaendert(() => erreicht.push("vorher"));
    ereignis.aufQueueGeaendert(() => {
      throw new Error("Anzeige kaputt");
    });
    ereignis.aufQueueGeaendert(() => erreicht.push("nachher"));

    await expect(ereignis.sendeQueueGeaendert()).resolves.toBeUndefined();

    expect(erreicht).toEqual(["vorher", "nachher"]);
  });

  it("wirft ohne registrierten Hoerer nicht", async () => {
    const { ereignis } = await frisch();

    await expect(ereignis.sendeQueueGeaendert()).resolves.toBeUndefined();
  });

  it("kommt mit An- und Abmelden waehrend einer laufenden Meldung zurecht", async () => {
    const { ereignis } = await frisch();
    const erreicht: string[] = [];
    let abmeldenB = (): void => {};
    ereignis.aufQueueGeaendert(() => {
      erreicht.push("a");
      // B wird MITTEN in der Runde abgemeldet. Die Zusage gilt ab dem Aufruf der
      // Abmelde-Funktion: In #71 haengt am Hoerer eine Fensterreferenz, die nach dem
      // Schliessen nicht mehr angesprochen werden darf.
      abmeldenB();
      ereignis.aufQueueGeaendert(() => erreicht.push("c"));
    });
    abmeldenB = ereignis.aufQueueGeaendert(() => erreicht.push("b"));

    await ereignis.sendeQueueGeaendert();
    expect(erreicht).toEqual(["a"]);

    // Der waehrend der Runde angemeldete C bekommt die naechste Meldung.
    await ereignis.sendeQueueGeaendert();
    expect(erreicht).toEqual(["a", "a", "c"]);
  });

  it("veraendert nichts: Q1, Q2 unberuehrt, kein Protokoll, kein Journal, kein Torwaechter", async () => {
    const { q1, ereignis } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q2Stand([auftrag("f1", "fehlgeschlagen")]);
    ereignis.aufQueueGeaendert(() => {});
    const q1Vorher = structuredClone(q1.alleQ1());
    const q2Vorher = structuredClone(q2.stand);

    await ereignis.sendeQueueGeaendert();
    await ereignis.sendeQueueGeaendert();

    expect(q1.alleQ1()).toEqual(q1Vorher);
    expect(q2.stand).toEqual(q2Vorher);
    expect(spuren.starteNaechsten).not.toHaveBeenCalled();
    expect(spuren.protokoll).not.toHaveBeenCalled();
    expect(spuren.journal).not.toHaveBeenCalled();
  });

  it("meldet nichts, wenn holeStand den Stand nicht ermitteln kann", async () => {
    const { q1, ereignis } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("l1", "laeuft"));
    const meldungen: Auftrag[][] = [];
    ereignis.aufQueueGeaendert((a) => meldungen.push(a));
    q2.wirft = true;

    await expect(ereignis.sendeQueueGeaendert()).resolves.toBeUndefined();

    // Kein leeres Array: Das waere die Falschaussage "die Warteschlange ist leer",
    // obwohl l1 laeuft (FA-16). Der zuletzt gemeldete Stand bleibt stehen.
    expect(meldungen).toEqual([]);
  });

  it("meldet die Stoerung ueber den eigenen Weg, statt zu schweigen", async () => {
    const { q1, ereignis } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("l1", "laeuft"));
    const staende: Auftrag[][] = [];
    const stoerungen: string[] = [];
    ereignis.aufQueueGeaendert((a) => staende.push(a));
    ereignis.aufQueueStoerung((m) => stoerungen.push(m));
    q2.wirft = true;

    await ereignis.sendeQueueGeaendert();

    // Die eigentliche Zusage: Der Stoerfall ist von "nichts hat sich geaendert"
    // unterscheidbar. Ohne diesen zweiten Weg waeren beide Faelle ein leeres `staende`.
    expect(stoerungen).toHaveLength(1);
    expect(stoerungen[0]).toContain("nicht ermittelt werden");
    expect(staende).toEqual([]);
  });

  it("meldet im Regelfall NUR den Stand und keine Stoerung", async () => {
    const { q1, ereignis } = await frisch();
    q1.fuegeAnsEndeAn(auftrag("a1", "anstehend"));
    const stoerungen: string[] = [];
    ereignis.aufQueueStoerung((m) => stoerungen.push(m));

    await ereignis.sendeQueueGeaendert();

    // Gegenprobe zum Test darueber: Ohne sie liesse sich der Stoerungsweg auch dann fuer
    // erfuellt halten, wenn er bei JEDER Meldung feuerte.
    expect(stoerungen).toEqual([]);
  });

  it("meldet dem abgemeldeten Stoerungs-Hoerer nicht mehr", async () => {
    const { ereignis } = await frisch();
    const stoerungen: string[] = [];
    const ab = ereignis.aufQueueStoerung((m) => stoerungen.push(m));
    q2.wirft = true;

    ab();
    await ereignis.sendeQueueGeaendert();

    expect(stoerungen).toEqual([]);
  });

  it("laesst einen werfenden Stoerungs-Hoerer die uebrigen nicht mitreissen", async () => {
    const { ereignis } = await frisch();
    const erreicht: string[] = [];
    ereignis.aufQueueStoerung(() => {
      throw new Error("kaputter Empfaenger");
    });
    ereignis.aufQueueStoerung((m) => erreicht.push(m));
    q2.wirft = true;

    // Darf nicht abweisen: Dieses Promise wird MITTEN in einer Warteschlangen-Operation
    // abgewartet - eine gescheiterte Meldung wuerde sonst den Auftrag umbringen.
    await expect(ereignis.sendeQueueGeaendert()).resolves.toBeUndefined();

    expect(erreicht).toHaveLength(1);
  });
});
