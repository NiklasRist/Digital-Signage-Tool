import { describe, expect, it } from "vitest";

// Rauchtest (#11): beweist, dass der Unit-Lauf ueberhaupt Tests findet und ausfuehrt.
//
// Er prueft absichtlich nichts Fachliches. Sein Zweck ist die Gegenprobe zu einer
// stillen Fehlkonfiguration: Ein Testlauf, der NULL Dateien findet, meldet in Vitest
// keinen Fehler, sondern laeuft gruen durch. Ohne mindestens einen Test, der
// nachweislich laeuft, waere "npm test ist gruen" also keine Aussage.
describe("Rauchtest", () => {
  it("fuehrt Unit-Tests aus", () => {
    expect(1 + 1).toBe(2);
  });
});
