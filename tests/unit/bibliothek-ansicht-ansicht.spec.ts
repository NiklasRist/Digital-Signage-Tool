// Verhaltenstest zu #227 - die Darstellung (bibliothek-ansicht.tsx, jsdom).
//
// Die Ansicht haelt keinen Zustand, filtert nichts und fuehrt nur EINE Operation
// aus: `fuegeElementHinzu` (#123). Gemessen wird: zwei getrennte Bereiche, der
// Hinweis ueber fehlende Medien, dass fehlt/kaputt gekennzeichnet aber NICHT gesperrt
// ist, und dass ein Klick genau EINEN Aufruf mit der richtigen Referenz ausloest.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

import type { Asset } from "../../src/shared/contracts/asset";
import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Project } from "../../src/shared/contracts/project";
import type { BibliothekEigenschaften } from "../../src/renderer/composer/bibliothek-ansicht.tsx";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
// @ts-expect-error - bibliothek-ansicht.tsx statt des `.ts`-Zwillings (siehe oben)
import { Bibliotheksansicht } from "../../src/renderer/composer/bibliothek-ansicht.tsx";

const attrappen = vi.hoisted(() => ({
  fuegeElementHinzu: vi.fn(),
}));

vi.mock("../../src/renderer/composer/element-hinzufuegen", () => ({
  fuegeElementHinzu: attrappen.fuegeElementHinzu,
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function asset(ueber: Partial<Asset> & { id: string }): Asset {
  return {
    typ: "video",
    dateiname: `${ueber.id}.mp4`,
    originalname: `Original ${ueber.id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 10,
    importdatum: "2026-01-01T00:00:00.000Z",
    zustand: "ok",
    ...ueber,
  };
}

function aktion(ueber: Partial<Aktion> & { id: string }): Aktion {
  return {
    titel: `Aktion ${ueber.id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: "v1",
    akzentfarbe: null,
    ...ueber,
  };
}

function projekt(ueber: Partial<Project> & { id: string }): Project {
  return {
    name: "Projekt",
    erstelltAm: "2026-01-01T00:00:00.000Z",
    geaendertAm: "2026-01-01T00:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
    ...ueber,
  };
}

function eigenschaften(ueber: Partial<BibliothekEigenschaften> = {}): BibliothekEigenschaften {
  return {
    projekt: projekt({ id: "p1" }),
    aufImportieren: () => {},
    aufMediumLoeschen: () => {},
    aufFehler: () => {},
    ...ueber,
  };
}

describe("Bibliotheksansicht (bibliothek-ansicht.tsx)", () => {
  let host: HTMLElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    attrappen.fuegeElementHinzu.mockReset();
    attrappen.fuegeElementHinzu.mockResolvedValue({ ok: true, wert: null });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("zeigt zwei getrennte Bereiche: Medien und Aktionen (ENTSCHIEDEN 7)", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1" })],
      aktionen: [aktion({ id: "k1" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    expect(host.textContent).toContain("Medien");
    expect(host.textContent).toContain("Aktionen");
    expect(host.querySelector("[data-testid='medien-liste']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-liste']")).not.toBeNull();
  });

  it("zeigt den Hinweis ueber fehlende Medien nur, wenn welche fehlen (Fehlerpfad)", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1", zustand: "ok" }), asset({ id: "a2", zustand: "fehlt" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    expect(host.querySelector("[data-testid='bibliothek-hinweis']")?.textContent).toContain(
      "1 Medium fehlt",
    );
  });

  it("zeiigt Leer-Hinweise fuer leere Bereiche (Fehlerpfad)", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: projekt({ id: "p1" }) })));
    });

    expect(host.querySelector("[data-testid='medien-leer']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-leer']")).not.toBeNull();
  });

  it("ruft fuegeElementHinzu genau einmal mit der Asset-ID beim Medien-Klick (DoD)", async () => {
    const p = projekt({ id: "p1", assets: [asset({ id: "a1" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Zur Liste hinzufügen"),
    );
    await act(async () => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledTimes(1);
    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledWith("a1");
  });

  it("ruft fuegeElementHinzu genau einmal mit der Aktions-ID beim Aktions-Klick (DoD)", async () => {
    const p = projekt({ id: "p1", aktionen: [aktion({ id: "k1" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Zur Liste hinzufügen"),
    );
    await act(async () => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledTimes(1);
    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledWith("k1");
  });

  it("ist auch fuer fehlt-Medien und kaputte Aktionen erreichbar - kein Sperren (DoD)", async () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1", zustand: "fehlt" })],
      aktionen: [aktion({ id: "k1", bildRef: "unbekannt" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const knopfe = Array.from(host.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Zur Liste hinzufügen"),
    );
    expect(knopfe).toHaveLength(2); // beide da, keiner gesperrt

    await act(async () => {
      knopfe[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      knopfe[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledTimes(2);
    expect(attrappen.fuegeElementHinzu.mock.calls.map((c) => c[0])).toEqual(["a1", "k1"]);
  });

  it("leitet einen Fehler von fuegeElementHinzu unveraendert an aufFehler - kein zweiter Aufruf (DoD)", async () => {
    const p = projekt({ id: "p1", assets: [asset({ id: "a1" })] });
    attrappen.fuegeElementHinzu.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    const aufFehler = vi.fn();
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p, aufFehler })));
    });

    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Zur Liste hinzufügen"),
    );
    await act(async () => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(aufFehler).toHaveBeenCalledTimes(1);
    expect(aufFehler).toHaveBeenCalledWith("nicht_gefunden", "weg");
    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledTimes(1);
  });

  it("loest bei einem Bild eine media://-Vorschau aus (ENTSCHIEDEN 4)", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1", typ: "bild", zustand: "ok", dateiname: "a-b-c.png" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const img = host.querySelector("img");
    expect(img?.getAttribute("src")).toBe("media://p1/a-b-c.png");
  });
});

describe("DoD-Grep-Proben (bibliothek-ansicht.tsx, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/composer/bibliothek-ansicht.tsx", "utf8")
    .split("\n")
    .filter((zeile) => {
      const getrimmt = zeile.trim();
      return (
        !getrimmt.startsWith("//") &&
        !getrimmt.startsWith("/*") &&
        !getrimmt.startsWith("*") &&
        !getrimmt.startsWith("{/*") &&
        getrimmt !== ""
      );
    })
    .join("\n");

  it("enthaelt kein <video, kein file://, kein rufeAuf, kein reiheEin (DoD)", () => {
    for (const verboten of ["<video", "file://", "rufeAuf", "reiheEin"]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });
});