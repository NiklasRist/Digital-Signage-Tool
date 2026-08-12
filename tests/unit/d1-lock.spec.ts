import { describe, expect, it } from "vitest";

import { mitD1Lock } from "../../src/main/project-store/d1-lock";

// Verhaltenstests zum D1-Schreib-Lock (#32). Geprueft wird, was die Sperre TUT -
// Reihenfolge und Freigabe -, nicht was ihre Deklaration behauptet.
//
// Die Sperre ist modulweiter Zustand. Jeder Test wartet alle seine Abschnitte ab,
// bevor er endet; danach ist die Schlange leer und der naechste Test faengt sauber an.

const warte = (ms: number): Promise<void> =>
  new Promise((auf) => {
    setTimeout(auf, ms);
  });

describe("mitD1Lock (#32)", () => {
  it("laesst zwei gleichzeitige Abschnitte nacheinander laufen", async () => {
    const protokoll: string[] = [];

    // A wird zuerst gerufen und haelt sich mit 30 ms kuenstlich lange auf. Ohne
    // Sperre wuerde B waehrend dieser Pause starten und sogar zuerst fertig werden.
    const a = mitD1Lock(async () => {
      protokoll.push("A start");
      await warte(30);
      protokoll.push("A ende");
    });
    const b = mitD1Lock(async () => {
      protokoll.push("B start");
      await warte(0);
      protokoll.push("B ende");
    });

    await Promise.all([a, b]);

    expect(protokoll).toEqual(["A start", "A ende", "B start", "B ende"]);
  });

  it("Gegenprobe: ohne die Sperre verschraenken sich dieselben Abschnitte", async () => {
    // Diese Probe hat keinen eigenen Wert fuer das Produkt - sie belegt, dass die
    // Behauptung des vorigen Tests nicht ohnehin gilt. Ohne sie waere nicht zu
    // unterscheiden, ob die Sperre wirkt oder ob die Reihenfolge zufaellig passt.
    const protokoll: string[] = [];

    const a = (async () => {
      protokoll.push("A start");
      await warte(30);
      protokoll.push("A ende");
    })();
    const b = (async () => {
      protokoll.push("B start");
      await warte(0);
      protokoll.push("B ende");
    })();

    await Promise.all([a, b]);

    expect(protokoll).toEqual(["A start", "B start", "B ende", "A ende"]);
  });

  it("bedient Wartende in der Reihenfolge der Aufrufe (FIFO)", async () => {
    const protokoll: number[] = [];

    // Der erste Abschnitt haelt die Sperre lange genug, dass alle uebrigen sicher
    // warten muessen. Ihre absteigenden Wartezeiten wuerden sie ohne FIFO-Zusage in
    // umgekehrter Reihenfolge durchlaufen lassen.
    const laeufe = [40, 8, 6, 4, 2].map((dauer, nummer) =>
      mitD1Lock(async () => {
        await warte(dauer);
        protokoll.push(nummer);
      }),
    );

    await Promise.all(laeufe);

    expect(protokoll).toEqual([0, 1, 2, 3, 4]);
  });

  it("reicht den Rueckgabewert unveraendert durch", async () => {
    const wert = { projektId: "p1" };
    await expect(mitD1Lock(async () => wert)).resolves.toBe(wert);
  });

  it("gibt die Sperre frei, wenn die Aktion wirft, und propagiert den Fehler", async () => {
    const kaputt = new Error("Schreiben fehlgeschlagen");

    await expect(
      mitD1Lock(async () => {
        throw kaputt;
      }),
    ).rejects.toBe(kaputt);

    // Der dritte Aufruf nach einem Fehlschlag muss normal laufen. Bliebe die Sperre
    // gehalten, wuerde dieser Aufruf nie fertig und der Test liefe in den Timeout.
    await expect(mitD1Lock(async () => "danach")).resolves.toBe("danach");
  });

  it("gibt die Sperre auch bei einem synchronen Wurf frei", async () => {
    // Nicht jede Aktion scheitert als abgewiesenes Versprechen: Eine Aktion, die schon
    // beim Aufruf wirft (z. B. an einer Zusicherung), verlaesst die Funktion, bevor
    // ueberhaupt ein Versprechen entsteht. Auch dann muss die Freigabe laufen.
    const kaputt = new Error("sofort kaputt");

    await expect(
      mitD1Lock((): Promise<never> => {
        throw kaputt;
      }),
    ).rejects.toBe(kaputt);

    await expect(mitD1Lock(async () => 1)).resolves.toBe(1);
  });

  it("laesst einen bereits Wartenden nach einem Fehlschlag des Halters weiterlaufen", async () => {
    // Der Wartende steht schon in der Schlange, BEVOR der Halter scheitert. Wuerde der
    // Fehler die Kette entlangwandern, kaeme er hier als Abweisung an statt als "b".
    const kaputt = new Error("Halter scheitert");

    const halter = mitD1Lock(async () => {
      await warte(20);
      throw kaputt;
    });
    const wartender = mitD1Lock(async () => "b");

    await expect(halter).rejects.toBe(kaputt);
    await expect(wartender).resolves.toBe("b");
  });
});
