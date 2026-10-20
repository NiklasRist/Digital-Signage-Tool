import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Q4-3 (docs/agents/treiber-matrix.md): Die Matrix "Anforderung -> Szenario" ist nur so viel
// wert wie ihre Vollstaendigkeit. Diese Schranke haelt drei Zusagen mechanisch:
//   1. Jede FA-Nummer aus dem Anforderungsdokument hat GENAU EINE Zeile.
//   2. Jede in der Spalte "Treiber-Schritt(e)" genannte Kennung existiert im Treiber.
//   3. Jeder Szenario-Schritt des Treibers (schritt-4a bis schritt-4i) ist zugeordnet.
// Sie prueft NICHT die Wahrheit der Statusspalte - das kann nur das Lesen des Schritts.

const WURZEL = process.cwd();
const ANFORDERUNGEN = path.join(WURZEL, "docs", "Anforderungsdokument_Digital-Signage-Tool.md");
const MATRIX = path.join(WURZEL, "docs", "agents", "treiber-matrix.md");
const TREIBER = path.join(WURZEL, "scripts", "durchlauf.mjs");

interface MatrixZeile {
  fa: string;
  schritte: string[];
}

function liesMatrix(): MatrixZeile[] {
  const text = fs.readFileSync(MATRIX, "utf8");
  const zeilen: MatrixZeile[] = [];
  for (const zeile of text.split(/\r?\n/)) {
    if (!zeile.startsWith("| FA-")) continue;
    const zellen = zeile.split("|").map((z) => z.trim());
    // zellen[0] ist leer (fuehrendes |), zellen[1] die FA-Nummer, zellen[3] die Schritte.
    const schrittZelle = zellen[3] ?? "";
    const schritte = schrittZelle === "-" || schrittZelle === ""
      ? []
      : schrittZelle.split(",").map((s) => s.trim());
    zeilen.push({ fa: zellen[1] ?? "", schritte });
  }
  return zeilen;
}

describe("Treiber-Matrix", () => {
  const matrix = liesMatrix();
  const treiber = fs.readFileSync(TREIBER, "utf8");

  it("jede FA-Nummer des Anforderungsdokuments hat genau eine Zeile", () => {
    const ad = fs.readFileSync(ANFORDERUNGEN, "utf8");
    const gefordert = new Set(
      [...ad.matchAll(/\bFA-\d{2}\b/g)].map((treffer) => treffer[0]),
    );
    const gezaehlt = new Map<string, number>();
    for (const zeile of matrix) {
      gezaehlt.set(zeile.fa, (gezaehlt.get(zeile.fa) ?? 0) + 1);
    }

    const fehlend = [...gefordert].filter((fa) => !gezaehlt.has(fa));
    const doppelt = [...gezaehlt.entries()].filter(([, zahl]) => zahl !== 1).map(([fa]) => fa);
    const fremd = [...gezaehlt.keys()].filter((fa) => !gefordert.has(fa));

    expect({ fehlend, doppelt, fremd }).toEqual({ fehlend: [], doppelt: [], fremd: [] });
    expect(gefordert.size).toBe(24);
  });

  it("jede genannte Schritt-Kennung existiert im Treiber", () => {
    const fehlend: string[] = [];
    for (const zeile of matrix) {
      for (const schritt of zeile.schritte) {
        if (!/^\d+[0-9a-z]*$/.test(schritt)) {
          fehlend.push(`${zeile.fa}: unlesbare Kennung "${schritt}"`);
        } else if (!treiber.includes(`[schritt-${schritt}]`)) {
          fehlend.push(`${zeile.fa}: [schritt-${schritt}] fehlt in scripts/durchlauf.mjs`);
        }
      }
    }

    expect(fehlend).toEqual([]);
  });

  it("jeder Szenario-Schritt des Treibers ist in der Matrix zugeordnet", () => {
    const imTreiber = new Set(
      [...treiber.matchAll(/\[schritt-(4[0-9a-z]+)\]/g)]
        .map((treffer) => treffer[1])
        .filter((schritt): schritt is string => typeof schritt === "string"),
    );
    const inMatrix = new Set(matrix.flatMap((zeile) => zeile.schritte));

    const nichtZugeordnet = [...imTreiber].filter((schritt) => !inMatrix.has(schritt));
    expect(nichtZugeordnet).toEqual([]);
    // Schutz gegen eine leere Messung: der Treiber hat heute mindestens diese Schritte.
    expect(imTreiber.size).toBeGreaterThanOrEqual(15);
  });
});
