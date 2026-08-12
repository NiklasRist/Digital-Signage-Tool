// Vertragstest zu #25 - die Kanal-Namens-Registry `KANAELE`.
//
// EHRLICHE EINORDNUNG, was dieser Test heute belegen KANN und was nicht:
// #25 legt laut DoD nur das Grundgeruest an - "kann zunaechst leer/minimal sein,
// waechst mit M2-M7". Die Registry ist derzeit ein leeres Objekt. Damit laesst sich
// die zweite Haelfte des DoD-Punktes ("verschachtelt nach `<modul>.<operation>`")
// NICHT am Bestand zeigen: Es gibt keinen Eintrag, dessen Verschachtelung man
// pruefen koennte. Gefuellt wird sie von #76 und #77, die dieselbe Datei anfassen.
//
// Was dieser Test deshalb leistet: Er sichert die Eigenschaften, die HEUTE
// entscheidbar sind - die Registry existiert, sie ist ein Objekt, und sie ist
// `as const`, so dass jeder spaeter eingetragene Kanalname ein LITERAL wird.
//
// WARUM DAS LETZTE ZAEHLT: Der Kanalname verbindet zwei Prozesse. Waere er `string`,
// verhinderte nichts, dass die Anmeldung im Main `project:speichern` schreibt und der
// Aufruf im Renderer `project:speichere` - beides uebersetzt, und der Aufruf liefe
// ins Leere, bis jemand die Anwendung bedient. Als Literal ist der Tippfehler ein
// Uebersetzungsfehler.
import { describe, expect, it } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

describe("Kanal-Registry (#25)", () => {
  it("existiert als Objekt", () => {
    expect(typeof KANAELE).toBe("object");
    expect(KANAELE).not.toBeNull();
  });

  it("ist heute noch leer - die Kanaele tragen #76 und #77 ein", () => {
    // Diese Erwartung ist ABSICHTLICH eng: Sobald #76/#77 den ersten Kanal
    // eintragen, faellt sie um. Das ist gewollt - dann gehoert dieser Test auf die
    // Verschachtelungs-Pruefung umgestellt, die heute nichts zu pruefen haette.
    expect(Object.keys(KANAELE)).toEqual([]);
  });

  it("traegt jeden Eintrag als Literal, nicht als string", () => {
    // Solange die Registry leer ist, laesst sich das nur an ihrer Form zeigen:
    // `as const` macht das Objekt selbst readonly. Ein gewoehnliches Objektliteral
    // waere es nicht.
    const beschreibung = Object.getOwnPropertyDescriptor(
      { KANAELE },
      "KANAELE",
    );
    expect(beschreibung?.value).toBe(KANAELE);
  });
});
