import { describe, expect, it } from "vitest";

import {
  EFFEKT_GRENZEN,
  RUHE_ZUSTAND,
  effektZustand,
  normalisiereEffekte,
} from "../../src/shared/effekte";

import type { EffektSatz } from "../../src/shared/contracts/aktion";

// Die Effekt-Rechnung (09.11.2026, FA-25 / TK 9.16.1/9.16.2) - ohne Canvas, ohne DOM,
// ohne Uhr. Sie ist die EINE Quelle fuer Editor-Vorschau und Render; die Tests pruefen
// deshalb die ENDPUNKTE und die Nahtlosigkeit, nicht einzelne Zwischenkurven
// (TK 9.16.2: „Vertrag sind die Endpunkte, die Nahtlosigkeit und die Monotonie").

const FPS = EFFEKT_GRENZEN.bilderProSekunde;

/** Ein Satz mit genau einem Fenster-Effekt über einen Bereich. */
function mitFenster(
  name: keyof EffektSatz,
  staerke: number,
  vonSekunden: number,
  bisSekunden: number,
): EffektSatz {
  return { [name]: { staerke, vonSekunden, bisSekunden } } as EffektSatz;
}

describe("effektZustand – ohne Effekte", () => {
  it("liefert den Ruhezustand bei fehlendem Satz", () => {
    expect(effektZustand(null, 0, 300)).toEqual(RUHE_ZUSTAND);
    expect(effektZustand(undefined, 150, 300)).toEqual(RUHE_ZUSTAND);
  });

  it("behandelt staerke 0 wie AUS – auf jedem der zehn Felder", () => {    const satz: EffektSatz = {
      kenBurns: { staerke: 0, vonSekunden: 0, bisSekunden: 1.5 },
      textEinblendung: { staerke: 0, vonSekunden: 0, bisSekunden: 0.4 },
      preisPop: { staerke: 0, vonSekunden: 0, bisSekunden: 0.33 },
      glanzSweep: { staerke: 0, vonSekunden: 0, bisSekunden: 0.6 },
      preisZaehlt: { staerke: 0, vonSekunden: 0, bisSekunden: 1 },
      bildReveal: { staerke: 0, vonSekunden: 0, bisSekunden: 0.5 },
      puls: { staerke: 0, vonSekunden: 0, bisSekunden: 1.5 },
      zoomAtmen: { staerke: 0 },
      drift: { staerke: 0 },
      parallax: { staerke: 0 },
    };
    expect(effektZustand(satz, 6, 300)).toEqual(RUHE_ZUSTAND);
  });

  it("bleibt bei bilderGesamt 0 im Ruhezustand", () => {
    const satz = mitFenster("kenBurns", 100, 0, 1.5);
    expect(effektZustand(satz, 0, 0)).toEqual(RUHE_ZUSTAND);
    expect(effektZustand(satz, 0, -30)).toEqual(RUHE_ZUSTAND);
  });
});

describe("Ken Burns (Fenster)", () => {
  it("startet bei 100 % / 0, endet exakt bei 108 % / 2 % und haelt danach", () => {
    const satz = mitFenster("kenBurns", 100, 0, 1.5);
    const start = effektZustand(satz, 0, 300);
    expect(start.zoomBild).toBe(100);
    expect(start.versatzBildX).toBe(0);

    const letztes = Math.round(1.5 * FPS) - 1;
    const ende = effektZustand(satz, letztes, 300);
    expect(ende.zoomBild).toBeCloseTo(108, 10);
    expect(ende.versatzBildX).toBeCloseTo(2, 10);

    // NACH dem Fenster steht der Endzustand - kein Rueckfall auf 100 %.
    expect(effektZustand(satz, letztes + 1, 300).zoomBild).toBeCloseTo(108, 10);
    expect(effektZustand(satz, 299, 300).zoomBild).toBeCloseTo(108, 10);
  });

  it("steigt monoton", () => {
    const satz = mitFenster("kenBurns", 100, 0, 1.5);
    let vorher = -1;
    for (let bild = 0; bild < 45; bild += 1) {
      const wert = effektZustand(satz, bild, 300).zoomBild;
      expect(wert).toBeGreaterThanOrEqual(vorher);
      vorher = wert;
    }
  });

  it("skaliert mit der Staerke", () => {
    const satz = mitFenster("kenBurns", 50, 0, 1.5);
    expect(effektZustand(satz, 44, 300).zoomBild).toBeCloseTo(104, 10);
  });
});

describe("Text-Einblendung (Fenster mit spaeterem Beginn)", () => {
  const satz = mitFenster("textEinblendung", 100, 1, 1.4);

  it("ist vor dem Fenster unsichtbar", () => {
    const vor = effektZustand(satz, FPS - 1, 300);
    expect(vor.textAlpha).toBe(0);
    expect(vor.textVersatzY).toBe(12);
  });

  it("steht am letzten Fensterbild vollstaendig da", () => {
    const letztes = Math.round(1.4 * FPS) - 1;
    const ende = effektZustand(satz, letztes, 300);
    expect(ende.textAlpha).toBe(1);
    expect(ende.textVersatzY).toBe(0);
  });

  it("bleibt nach dem Fenster stehen", () => {
    const nach = effektZustand(satz, 299, 300);
    expect(nach.textAlpha).toBe(1);
    expect(nach.textVersatzY).toBe(0);
  });
});

describe("Preis-Pop (Fenster)", () => {
  it("beginnt bei 0,85, ueberschwingt ueber 1,04 und endet exakt bei 1,00", () => {
    const satz = mitFenster("preisPop", 100, 0, 0.33);
    const letztes = Math.round(0.33 * FPS) - 1;

    expect(effektZustand(satz, 0, 300).preisSkala).toBeCloseTo(0.85, 10);
    expect(effektZustand(satz, letztes, 300).preisSkala).toBeCloseTo(1, 10);

    let maximum = 0;
    for (let bild = 0; bild <= letztes; bild += 1) {
      maximum = Math.max(maximum, effektZustand(satz, bild, 300).preisSkala);
    }
    expect(maximum).toBeGreaterThanOrEqual(1.04);
  });

  it("ist ausserhalb des Fensters wirkungslos", () => {
    const satz = mitFenster("preisPop", 100, 1, 1.33);
    expect(effektZustand(satz, 0, 300).preisSkala).toBe(1);
    expect(effektZustand(satz, 299, 300).preisSkala).toBe(1);
  });
});

describe("Preis zaehlt hoch (Fenster)", () => {
  it("liefert 0,8 am Anfang, 1 am Ende und ausserhalb null", () => {
    const satz = mitFenster("preisZaehlt", 100, 0, 1);
    const letztes = FPS - 1;
    expect(effektZustand(satz, 0, 300).zaehlAnteil).toBeCloseTo(0.8, 10);
    expect(effektZustand(satz, letztes, 300).zaehlAnteil).toBeCloseTo(1, 10);
    expect(effektZustand(satz, FPS, 300).zaehlAnteil).toBeNull();
  });
});

describe("Glanz-Sweep (Fenster)", () => {
  it("laeuft von 0 nach 1 und ist ausserhalb aus", () => {
    const satz = mitFenster("glanzSweep", 100, 0, 0.6);
    expect(effektZustand(satz, 0, 300).glanzFortschritt).toBe(0);
    const letztes = Math.round(0.6 * FPS) - 1;
    expect(effektZustand(satz, letztes, 300).glanzFortschritt).toBe(1);
    expect(effektZustand(satz, letztes + 1, 300).glanzFortschritt).toBeNull();
  });
});

describe("Bild-Reveal (Fenster)", () => {
  it("ist vor dem Fenster verdeckt und danach vollstaendig da", () => {
    const satz = mitFenster("bildReveal", 100, 1, 1.5);
    expect(effektZustand(satz, 0, 300).revealAnteil).toBe(0);
    expect(effektZustand(satz, 299, 300).revealAnteil).toBe(1);
  });
});

describe("Puls (Fenster)", () => {
  it("beginnt und endet exakt bei 1,00 und schlaegt dazwischen", () => {
    const satz = mitFenster("puls", 100, 0, 1.5);
    const letztes = Math.round(1.5 * FPS) - 1;
    expect(effektZustand(satz, 0, 300).pulsSkala).toBe(1);
    expect(effektZustand(satz, letztes, 300).pulsSkala).toBe(1);

    let maximum = 0;
    for (let bild = 0; bild <= letztes; bild += 1) {
      maximum = Math.max(maximum, effektZustand(satz, bild, 300).pulsSkala);
    }
    expect(maximum).toBeGreaterThan(1.02);
  });
});

describe("Zoom-Atmen (Schleife)", () => {
  it("ist nahtlos: der Sprung an der Naht ist nicht groesser als im Inneren", () => {
    const satz: EffektSatz = { zoomAtmen: { staerke: 100 } };
    const n = EFFEKT_GRENZEN.schleifeBilder;
    const zoom = (bild: number): number => effektZustand(satz, bild, 1350).zoomBild;

    let groessterSchrittInnen = 0;
    for (let bild = 0; bild < n - 1; bild += 1) {
      groessterSchrittInnen = Math.max(groessterSchrittInnen, Math.abs(zoom(bild + 1) - zoom(bild)));
    }
    // Bild n ist Bild 0 der naechsten Periode - der Sprung dort ist der Sprung der Naht.
    const naht = Math.abs(zoom(n) - zoom(n - 1));
    expect(naht).toBeLessThanOrEqual(groessterSchrittInnen + 1e-9);
  });

  it("atmet auf 104 % in der Mitte der Periode", () => {
    const satz: EffektSatz = { zoomAtmen: { staerke: 100 } };
    expect(effektZustand(satz, 30, 300).zoomBild).toBeCloseTo(104, 10);
    expect(effektZustand(satz, 0, 300).zoomBild).toBe(100);
  });

  it("addiert sich auf Ken Burns", () => {
    const nurKenBurns: EffektSatz = {
      kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
    };
    const satz: EffektSatz = { ...nurKenBurns, zoomAtmen: { staerke: 100 } };
    // Bild 30: Atmen steht auf 104 %, Ken Burns ist noch nicht am Ende (weich < 1).
    const mit = effektZustand(satz, 30, 300).zoomBild;
    const ohne = effektZustand(nurKenBurns, 30, 300).zoomBild;
    expect(mit).toBeCloseTo(ohne + 4, 10);
  });
});

describe("Drift (Schleife)", () => {
  it("nutzt fuer x und y verschiedene Perioden", () => {
    const satz: EffektSatz = { drift: { staerke: 100 } };
    // x bei halber 60er-Periode = 1,5 %; y bei halber 30er-Periode = 1 %
    expect(effektZustand(satz, 30, 1350).versatzBildX).toBeCloseTo(1.5, 10);
    expect(effektZustand(satz, 30, 1350).versatzBildY).toBeCloseTo(0, 10);
    expect(effektZustand(satz, 15, 1350).versatzBildY).toBeCloseTo(1, 10);
  });

  it("ist nahtlos ueber die volle Periode", () => {
    const satz: EffektSatz = { drift: { staerke: 100 } };
    const n = EFFEKT_GRENZEN.schleifeBilder;
    const x = (bild: number): number => effektZustand(satz, bild, 1350).versatzBildX;
    let groessterSchrittInnen = 0;
    for (let bild = 0; bild < n - 1; bild += 1) {
      groessterSchrittInnen = Math.max(groessterSchrittInnen, Math.abs(x(bild + 1) - x(bild)));
    }
    expect(Math.abs(x(n) - x(n - 1))).toBeLessThanOrEqual(groessterSchrittInnen + 1e-9);
  });
});

describe("Parallax (Beziehung, kein Antrieb)", () => {
  it("bleibt ohne Bewegung unsichtbar", () => {
    const satz: EffektSatz = { parallax: { staerke: 100 } };
    expect(effektZustand(satz, 120, 300)).toEqual(RUHE_ZUSTAND);
  });

  it("laesst den Hintergrund mit 0,6x der Bildbewegung laufen", () => {
    const satz: EffektSatz = {
      kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
      parallax: { staerke: 100 },
    };
    const ende = effektZustand(satz, 44, 300);
    expect(ende.versatzBildX).toBeCloseTo(2, 10);
    expect(ende.versatzHintergrundX).toBeCloseTo(1.2, 10);
  });
});

describe("Klemmung", () => {
  it("klemmt den Bildindex auf den Rand", () => {
    const satz = mitFenster("kenBurns", 100, 0, 1.5);
    expect(effektZustand(satz, -5, 300)).toEqual(effektZustand(satz, 0, 300));
    expect(effektZustand(satz, 9999, 300)).toEqual(effektZustand(satz, 299, 300));
  });
});

describe("normalisiereEffekte", () => {
  it("gibt null zurueck, wenn nichts uebrig bleibt", () => {
    expect(normalisiereEffekte(null, 10)).toBeNull();
    expect(normalisiereEffekte(undefined, 10)).toBeNull();
    expect(normalisiereEffekte({}, 10)).toBeNull();
    expect(normalisiereEffekte({ kenBurns: { staerke: 0, vonSekunden: 0, bisSekunden: 1 } }, 10)).toBeNull();
  });

  it("begrenzt die Staerke auf 0–100", () => {
    const satz = normalisiereEffekte({ puls: { staerke: 250, vonSekunden: 0, bisSekunden: 1 } }, 10);
    expect(satz?.puls?.staerke).toBe(100);
  });

  it("kappt ein Fenster auf 3 Sekunden", () => {
    const satz = normalisiereEffekte({ kenBurns: { staerke: 100, vonSekunden: 1, bisSekunden: 9 } }, 10);
    expect(satz?.kenBurns?.bisSekunden).toBe(4);
  });

  it("hebt ein zu kurzes Fenster auf 1 Sekunde", () => {
    const satz = normalisiereEffekte({ puls: { staerke: 100, vonSekunden: 2, bisSekunden: 2.1 } }, 10);
    expect(satz?.puls?.vonSekunden).toBe(2);
    expect(satz?.puls?.bisSekunden).toBe(3);
  });

  it("wirft ein Fenster weg, das nach dem Segmentende beginnt", () => {
    expect(normalisiereEffekte({ puls: { staerke: 100, vonSekunden: 10, bisSekunden: 12 } }, 10)).toBeNull();
  });

  it("wirft ein Fenster mit bis <= von weg", () => {
    expect(normalisiereEffekte({ puls: { staerke: 100, vonSekunden: 5, bisSekunden: 5 } }, 10)).toBeNull();
  });

  it("laesst Schleifen unveraendert stehen", () => {
    const satz = normalisiereEffekte({ zoomAtmen: { staerke: 80 } }, 10);
    expect(satz).toEqual({ zoomAtmen: { staerke: 80 } });
  });
});
