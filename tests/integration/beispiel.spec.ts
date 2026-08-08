import { describe, expect, it } from "vitest";

// Beispiel-Integrationstest (#11).
//
// Er hat denselben Zweck wie der Rauchtest im Unit-Ordner, aber fuer den zweiten
// Lauf - und er sichert zusaetzlich die TRENNUNG ab: Dieser Test muss von
// "npm run test:integration" ausgefuehrt werden und von "npm test" NICHT.
//
// Warum das eigens geprueft gehoert: Beide Fehlrichtungen sind still. Eine
// Konfiguration, die tests/integration/ nie einliest, meldet keinen Fehler - sie
// findet einfach nichts und ist gruen. Und eine, die zu viel einliest, faellt erst
// auf, wenn der "schnelle" Lauf ploetzlich Minuten braucht.
describe("Beispiel-Integrationstest", () => {
  it("laeuft nur im Integrationslauf", () => {
    expect(true).toBe(true);
  });
});
