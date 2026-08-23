// Vertragstest zu #15 - Typen `Project`, `Listenelement`, `Einblendung`,
// `Bearbeitungsstand`.
//
// Der wichtigste Punkt ist DoD 4: `Bearbeitungsstand` hat GENAU drei Felder (seit
// TK v3.18 mit `standardSegmentdauer`, #334). Er ist der Ausschnitt, den Undo/Redo
// fuehrt (TK 9.5.2). Traegt er versehentlich mehr -
// etwa `assets` oder `letzterAusgabeName` -, dann macht ein Undo Dinge rueckgaengig,
// die niemand rueckgaengig machen wollte: Ein Widerruf einer Listenaenderung naehme
// den zwischenzeitlich importierten Film gleich mit aus dem Projekt.
//
// DoD 2 (`liste` ohne Positionsfeld) ist die zweite Invariante: Die Reihenfolge IST
// die Array-Reihenfolge (TK 9.11.3). Ein zusaetzliches `position` waere eine zweite
// Quelle der Wahrheit, und beide liefen beim ersten Umsortieren auseinander.
import { describe, expect, it } from "vitest";

import type {
  Bearbeitungsstand,
  Einblendung,
  Listenelement,
  Project,
} from "../../src/shared/contracts/project";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 4: genau drei Felder (das dritte kam mit TK v3.18 / #334 dazu) -------
type T1 = Behaupte<
  Gleich<keyof Bearbeitungsstand, "aktionen" | "liste" | "standardSegmentdauer">
>;

// --- DoD 2: die Liste ist ein schlichtes Array -------------------------------
type T2 = Behaupte<Gleich<Project["liste"], Listenelement[]>>;

// Kein Element traegt ein Sortierfeld. Waere eines da, enthielte `keyof` es.
type T3 = Behaupte<Gleich<Extract<keyof Listenelement, "position" | "index">, never>>;
type T4 = Behaupte<Gleich<Extract<keyof Project, "position" | "reihenfolge">, never>>;

// --- Der Ausschnitt passt zu `Project` ---------------------------------------
// Beide Felder muessen im Bearbeitungsstand DENSELBEN Typ haben wie im Projekt.
// Liefen sie auseinander, liesse sich ein Schnappschuss nicht zurueckschreiben.
type T5 = Behaupte<Gleich<Bearbeitungsstand["aktionen"], Project["aktionen"]>>;
type T6 = Behaupte<Gleich<Bearbeitungsstand["liste"], Project["liste"]>>;

const stand: Bearbeitungsstand = { aktionen: [], liste: [], standardSegmentdauer: 10 };

// @ts-expect-error `assets` gehoert NICHT in den Bearbeitungsstand (TK 9.5.2).
const zuViel: Bearbeitungsstand = { aktionen: [], liste: [], assets: [] };

const element: Listenelement = {
  id: "e1",
  art: "video",
  ref: "asset-1",
  dauer: null,
  trimStart: 0,
  trimEnde: 10,
  einblendung: null,
};

const einblendung: Einblendung = {
  bandVorlageId: "band-standard",
  abschnitte: [{ aktionRef: "a1", dauer: 10 }],
};

export type { T1, T2, T3, T4, T5, T6 };
void zuViel;
void einblendung;

describe("Project / Bearbeitungsstand (#15)", () => {
  it("fuehrt im Bearbeitungsstand genau die drei Undo-Felder (seit v3.18 mit dem Standard)", () => {
    expect(Object.keys(stand).sort()).toEqual([
      "aktionen",
      "liste",
      "standardSegmentdauer",
    ]);
  });

  it("traegt die Reihenfolge allein ueber die Array-Position", () => {
    const liste: Listenelement[] = [
      { ...element, id: "e1" },
      { ...element, id: "e2" },
    ];
    // Umsortieren heisst: das Array umstellen. Es gibt kein Feld nachzufuehren.
    const gedreht = [...liste].reverse();
    expect(gedreht.map((e) => e.id)).toEqual(["e2", "e1"]);
    expect(Object.keys(element)).not.toContain("position");
  });
});
