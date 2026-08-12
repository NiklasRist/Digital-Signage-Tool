// Vertragstest zu #19 - `RenderResult` und `RenderProgress`.
//
// DoD 2 und 4 verlangen den Nachweis, dass die Verengung ueber `status` traegt:
// `ausgabePfad`/`ausgabeName` gibt es NUR im erfolg-Zweig, `fehlercode` NUR im
// fehler-Zweig.
//
// WARUM DAS ZAEHLT: Die Oberflaeche zeigt nach jedem Lauf entweder den Dateinamen
// oder einen Fehler. Waeren alle Felder auf einem flachen Objekt optional, koennte
// die Anzeige "fertig: undefined" schreiben, ohne dass irgendetwas bricht - und der
// Nutzer suchte eine Datei, die es nicht gibt. Die diskriminierte Union macht diesen
// Zustand unerreichbar: Ohne Pruefung auf `status` kompiliert der Zugriff nicht.
import { describe, expect, it } from "vitest";

import type { RenderProgress, RenderResult } from "../../src/shared/contracts/render-result";
import type { Behaupte, Gleich } from "../typ-gleich";

type Erfolg = Extract<RenderResult, { status: "erfolg" }>;
type Fehler = Extract<RenderResult, { status: "fehler" }>;
type Abgebrochen = Extract<RenderResult, { status: "abgebrochen" }>;

// --- DoD 3: der erfolg-Zweig hat genau diese sechs Felder --------------------
type T1 = Behaupte<
  Gleich<
    keyof Erfolg,
    "status" | "renderId" | "ausgabePfad" | "ausgabeName" | "gesamtdauer" | "dateigroesse"
  >
>;

// --- DoD 4: `ausgabeName` ist Pflicht, nicht nullbar, nur hier ---------------
type T2 = Behaupte<Gleich<Erfolg["ausgabeName"], string>>;
type T3 = Behaupte<Gleich<Extract<keyof Fehler, "ausgabeName">, never>>;
type T4 = Behaupte<Gleich<Extract<keyof Abgebrochen, "ausgabeName">, never>>;

// --- DoD 3: kein `historieEintrag` mehr (TK v2.8 E-1, ersatzlos gestrichen) --
type T5 = Behaupte<Gleich<Extract<keyof Erfolg, "historieEintrag">, never>>;

// --- DoD 2: `fehlercode` nur im fehler-Zweig ---------------------------------
type T6 = Behaupte<Gleich<Extract<keyof Erfolg, "fehlercode">, never>>;

// Der Zugriff ist NUR nach der Pruefung moeglich - diese Funktion uebersetzt genau
// deshalb.
function beschreibe(ergebnis: RenderResult): string {
  if (ergebnis.status === "erfolg") return ergebnis.ausgabeName;
  if (ergebnis.status === "fehler") return ergebnis.fehlercode;
  return `abgebrochen bei ${ergebnis.abgebrochenBei ?? 0}`;
}

// Gegenbeweise - nie aufgerufen.
function nurTypebene(ergebnis: RenderResult, fehler: Fehler): void {
  // @ts-expect-error Ohne Pruefung auf `status` gibt es `ausgabePfad` nicht.
  const blind: string = ergebnis.ausgabePfad;

  // @ts-expect-error `fehlercode` gehoert nicht in den erfolg-Zweig.
  const falsch: Erfolg = { ...(undefined as unknown as Erfolg), fehlercode: "x" };

  // @ts-expect-error `ausgabeName` gibt es im fehler-Zweig nicht.
  const auchFalsch: string = fehler.ausgabeName;

  void blind;
  void falsch;
  void auchFalsch;
}
void nurTypebene;

const erfolg: RenderResult = {
  status: "erfolg",
  renderId: "r-1",
  ausgabePfad: "C:/daten/projects/p-1/output/sommeraktion.mp4",
  ausgabeName: "sommeraktion",
  gesamtdauer: 120.5,
  dateigroesse: 181_000_000,
};

const fortschritt: RenderProgress = {
  renderId: "r-1",
  phase: "normalisieren",
  elementIndex: 2,
  elementAnzahl: 7,
  elementId: "e-2",
  prozent: 28,
};

export type { T1, T2, T3, T4, T5, T6 };

describe("RenderResult / RenderProgress (#19)", () => {
  it("gibt den Ausgabenamen nur nach `status === 'erfolg'` heraus", () => {
    expect(beschreibe(erfolg)).toBe("sommeraktion");
    expect(
      beschreibe({ status: "abgebrochen", renderId: "r-2", abgebrochenBei: null }),
    ).toBe("abgebrochen bei 0");
  });

  it("fuehrt den Ausgabenamen OHNE Endung, den Pfad MIT", () => {
    // FA-22: `ausgabeName` ist die Nutzereingabe ohne Endung; der Pfad ist das, was
    // wirklich auf der Platte liegt.
    const e = erfolg as Erfolg;
    expect(e.ausgabeName.endsWith(".mp4")).toBe(false);
    expect(e.ausgabePfad.endsWith(".mp4")).toBe(true);
    expect(e.ausgabePfad).toContain(e.ausgabeName);
  });

  it("meldet Fortschritt in Prozent zwischen 0 und 100", () => {
    expect(fortschritt.prozent).toBeGreaterThanOrEqual(0);
    expect(fortschritt.prozent).toBeLessThanOrEqual(100);
    expect(["normalisieren", "verketten"]).toContain(fortschritt.phase);
  });
});
