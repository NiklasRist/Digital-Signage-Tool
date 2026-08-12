// Vertragstest zu #20 - der eine ID-Generator (TK 9.11.4).
import { describe, expect, it } from "vitest";

import { erzeugeId } from "../../src/shared/contracts/id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("erzeugeId (#20)", () => {
  it("liefert eine UUID v4 in Kleinschreibung", () => {
    // Kleinschreibung zaehlt: Asset-Dateinamen werden als "<uuid>.<ext>" gebildet.
    expect(erzeugeId()).toMatch(UUID_V4);
  });

  it("zaehlt nicht hoch", () => {
    // Der Punkt des Issues: kein fortlaufender Zaehler, der nach Loeschen oder beim
    // Duplizieren eines Projekts kollidiert.
    const folge = Array.from({ length: 50 }, erzeugeId);
    expect(new Set(folge).size).toBe(50);
    expect(folge).not.toEqual([...folge].sort());
  });
});
