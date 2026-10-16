import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Q1.3 (docs/agents/kommentar-plan.md, Regel 3 aus docs/agents/kommentar-regeln.md):
// Kein generierter Geruest-Kopf in fertigen Quelldateien. Der Kopf ist ein
// Generator-Artefakt (tools/geruest.py) und gehoert entfernt, sobald der Rumpf steht.
// Diese Schranke haelt das mechanisch - ein neuer Kopf faellt hier auf, nicht erst im Review.

const VERBOTEN = ["GERUEST-PRUEFSUMME", "generiert aus dem signaturblock"];

function quellDateien(ordner: string): string[] {
  const raus: string[] = [];
  for (const eintrag of fs.readdirSync(ordner, { withFileTypes: true })) {
    const pfad = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) raus.push(...quellDateien(pfad));
    else if (/\.tsx?$/.test(eintrag.name)) raus.push(pfad);
  }
  return raus;
}

describe("Geruest-Kopf-Guard", () => {
  it("keine Datei unter src/ traegt einen generierten Geruest-Kopf", () => {
    const treffer: string[] = [];
    for (const datei of quellDateien(path.resolve(process.cwd(), "src"))) {
      const klein = fs.readFileSync(datei, "utf8").toLowerCase();
      for (const muster of VERBOTEN) {
        if (klein.includes(muster.toLowerCase())) treffer.push(`${datei}: ${muster}`);
      }
    }

    expect(treffer).toEqual([]);
  });
});
