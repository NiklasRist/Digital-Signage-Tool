import { describe, expect, it } from "vitest";

import { effektZustand } from "../../src/shared/effekte";
import { expandiere, rahmenplan } from "../../src/shared/bildplan";

import type { EffektSatz } from "../../src/shared/contracts/aktion";

// Der Bildplan (09.11.2026, FA-25 / TK 9.16.4) - ohne Canvas, ohne DOM.
//
// Geprueft werden die zwei Invarianten des Vertrags:
//   1. Summe aus anzahl x wiederholungen = bilderGesamt, EXAKT.
//   2. Jeder expandierte Frame traegt genau den Zustand seines Zeitpunkts.

const FPS = 30;

/** Die expandierte Folge als Zustands-Kette - so laesst sich Invariante 2 direkt vergleichen. */
function zustaendeDerFolge(satz: EffektSatz, plan: ReturnType<typeof rahmenplan>, gesamt: number): string[] {
  if (plan === null) return [];
  return expandiere(plan).map((bild) => JSON.stringify(effektZustand(satz, bild, gesamt)));
}

describe("rahmenplan – kein Effekt, kein Plan", () => {
  it("gibt null zurueck, wenn der Satz fehlt", () => {
    expect(rahmenplan(null, 300)).toBeNull();
    expect(rahmenplan(undefined, 300)).toBeNull();
  });

  it("gibt null zurueck bei leerem Satz oder lauter Staerke 0", () => {
    expect(rahmenplan({}, 300)).toBeNull();
    expect(
      rahmenplan({ zoomAtmen: { staerke: 0 }, drift: { staerke: 0 } }, 300),
    ).toBeNull();
  });

  it("gibt null zurueck ohne Bilder", () => {
    expect(rahmenplan({ zoomAtmen: { staerke: 100 } }, 0)).toBeNull();
    expect(rahmenplan({ zoomAtmen: { staerke: 100 } }, -30)).toBeNull();
  });
});

describe("rahmenplan – Schleife ueber die ganze Dauer", () => {
  const satz: EffektSatz = { zoomAtmen: { staerke: 100 } };

  it("zeichnet nur 60 Bilder fuer 300", () => {
    const plan = rahmenplan(satz, 300);
    expect(plan).not.toBeNull();
    expect(plan?.bildNummern.length).toBe(60);
    expect(plan?.laeufe).toEqual([{ erstesBild: 0, anzahl: 60, wiederholungen: 5 }]);
  });

  it("wiederholt die Periode auch bei ungerader Bildzahl (Rest am Ende)", () => {
    const plan = rahmenplan(satz, 301);
    expect(plan?.laeufe).toEqual([
      { erstesBild: 0, anzahl: 60, wiederholungen: 5 },
      { erstesBild: 0, anzahl: 1, wiederholungen: 1 },
    ]);
    expect(expandiere(plan!).length).toBe(301);
  });

  it("bleibt bei 45 s (1350 Bilder) bei 60 eindeutigen Frames", () => {
    const plan = rahmenplan(satz, 45 * FPS);
    expect(plan?.bildNummern.length).toBe(60);
    expect(plan?.laeufe.length).toBeLessThanOrEqual(2);
    expect(expandiere(plan!).length).toBe(1350);
  });
});

describe("rahmenplan – Fenster ohne Schleife", () => {
  const satz: EffektSatz = { textEinblendung: { staerke: 100, vonSekunden: 0, bisSekunden: 0.4 } };

  it("fasst den Ruhezustand nach dem Fenster zu EINEM Lauf zusammen", () => {
    const plan = rahmenplan(satz, 300);
    expect(plan).not.toBeNull();
    // Das Fenster endet EXAKT im Ruhezustand (TK 9.16.2): Bild 11 traegt schon den
    // Endzustand, also beginnt die stille Strecke dort – ein Frame weniger zu zeichnen.
    expect(plan?.laeufe[plan.laeufe.length - 1]).toEqual({
      erstesBild: 11,
      anzahl: 1,
      wiederholungen: 289,
    });
    expect(plan?.bildNummern.length).toBe(12);
    expect(expandiere(plan!).length).toBe(300);
  });
});

describe("rahmenplan – Fenster und Schleife gemischt", () => {
  const satz: EffektSatz = {
    textEinblendung: { staerke: 100, vonSekunden: 0, bisSekunden: 0.4 },
    zoomAtmen: { staerke: 100 },
  };

  it("zeichnet die Fensterbilder plus EINE Periode", () => {
    const plan = rahmenplan(satz, 300);
    // Bild 11 ist der Endzustand des Fensters und zugleich Phase 11 der Schleife – die
    // Periode beginnt dort. 11 Fensterframes + 60 Periodenframes.
    expect(plan?.bildNummern.length).toBe(71);
  });

  it("haelt beide Invarianten", () => {
    const gesamt = 300;
    const plan = rahmenplan(satz, gesamt);
    expect(plan).not.toBeNull();

    const summe = (plan?.laeufe ?? []).reduce(
      (wert, lauf) => wert + lauf.anzahl * lauf.wiederholungen,
      0,
    );
    expect(summe).toBe(gesamt);
    expect(expandiere(plan!)).toHaveLength(gesamt);

    // Invariante 2: der Frame im Plan traegt denselben Zustand wie sein Zeitpunkt.
    const folge = expandiere(plan!);
    for (let bild = 0; bild < gesamt; bild += 1) {
      expect(JSON.stringify(effektZustand(satz, folge[bild] as number, gesamt))).toBe(
        JSON.stringify(effektZustand(satz, bild, gesamt)),
      );
    }
  });
});

describe("rahmenplan – Form", () => {
  it("hat nie einen Lauf ohne Bilder oder ohne Wiederholung", () => {
    const saetze: EffektSatz[] = [
      { zoomAtmen: { staerke: 60 } },
      { puls: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 } },
      { kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 }, drift: { staerke: 40 } },
    ];
    for (const satz of saetze) {
      const plan = rahmenplan(satz, 240);
      expect(plan).not.toBeNull();
      for (const lauf of plan!.laeufe) {
        expect(lauf.anzahl).toBeGreaterThan(0);
        expect(lauf.wiederholungen).toBeGreaterThan(0);
        expect(lauf.erstesBild + lauf.anzahl).toBeLessThanOrEqual(plan!.bildNummern.length);
      }
    }
  });

  it("expandiert zu genau denselben Zustaenden wie die Zeitachse (drei Effekte)", () => {
    const satz: EffektSatz = {
      kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
      puls: { staerke: 80, vonSekunden: 2, bisSekunden: 3 },
      drift: { staerke: 50 },
    };
    const gesamt = 240;
    const plan = rahmenplan(satz, gesamt)!;
    expect(zustaendeDerFolge(satz, plan, gesamt)).toEqual(
      Array.from({ length: gesamt }, (_, bild) => JSON.stringify(effektZustand(satz, bild, gesamt))),
    );
  });
});
