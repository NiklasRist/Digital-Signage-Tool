// Verhaltenstest zu #227/#422 - die Darstellung (bibliothek-ansicht.tsx, jsdom).
//
// #422 (15.10.2026): Ein Projekt hat genau EIN Video. Der Medien-Bereich heisst "Video"
// und zeigt NUR Video-Assets; Bilder sind Motiv einer Aktion (action-editor) und
// erscheinen hier nicht mehr. Das Video ist automatisch Listeneintrag - es gibt fuer es
// KEIN "Zur Liste hinzufuegen" mehr (das bleibt fuer AKTIONEN).
//
// Gemessen wird: zwei getrennte Bereiche, der Hinweis ueber fehlende Videos, dass ein
// fehlendes Video gekennzeichnet aber NICHT gesperrt ist, dass die Video-Zeile keinen
// Hinzufuegen-Knopf traegt, und dass ein Aktions-Klick genau EINEN Aufruf ausloest.
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
    markeId: "marke-test",
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
    standardMarkeId: "marke-test",
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
    sichtSchreiber: () => {},
    ...ueber,
  };
}

describe("Bibliotheksansicht (bibliothek-ansicht.tsx, #422)", () => {
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

  it("zeigt zwei getrennte Bereiche: Video und Aktionen", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1" })],
      aktionen: [aktion({ id: "k1" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    expect(host.textContent).toContain("Video");
    expect(host.textContent).toContain("Aktionen");
    expect(host.querySelector("[data-testid='video-liste']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-liste']")).not.toBeNull();
  });

  it("zeigt nur VIDEO-Assets - ein Bild erscheint hier nicht (Bild = Aktions-Motiv)", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "v1", typ: "video" }), asset({ id: "b1", typ: "bild", dauer: null })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    expect(host.querySelector("[data-testid='medium-v1']")).not.toBeNull();
    expect(host.querySelector("[data-testid='medium-b1']")).toBeNull();
  });

  it("zeigt den Hinweis ueber fehlende Videos nur, wenn welche fehlen (Fehlerpfad)", () => {
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

  it("zeigt Leer-Hinweise fuer leere Bereiche (Fehlerpfad)", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: projekt({ id: "p1" }) })));
    });

    expect(host.querySelector("[data-testid='video-leer']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-leer']")).not.toBeNull();
  });

  it("die Video-Zeile traegt KEINEN Hinzufuegen-Knopf, aber Loeschen (#422)", () => {
    const p = projekt({ id: "p1", assets: [asset({ id: "a1" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const zeile = host.querySelector("[data-testid='medium-a1']");
    expect(zeile).not.toBeNull();
    const knopfe = Array.from(zeile?.querySelectorAll("button") ?? []);
    expect(knopfe.some((b) => b.textContent?.includes("Zur Liste hinzufügen"))).toBe(false);
    expect(knopfe.some((b) => b.textContent?.includes("Löschen"))).toBe(true);
  });

  it("ohne aufAktionLoeschen traegt die Aktionszeile KEINEN Loeschen-Knopf (#430)", () => {
    const p = projekt({ id: "p1", aktionen: [aktion({ id: "k1" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    expect(host.querySelector("[data-testid='aktion-loeschen-k1']")).toBeNull();
  });

  it("mit aufAktionLoeschen loest der Loeschen-Knopf GENAU EINEN Ruf mit der Aktions-ID aus (#430)", async () => {
    const aufAktionLoeschen = vi.fn();
    const p = projekt({ id: "p1", aktionen: [aktion({ id: "k1" })] });
    act(() => {
      root.render(
        createElement(Bibliotheksansicht, eigenschaften({ projekt: p, aufAktionLoeschen })),
      );
    });

    const knopf = host.querySelector("[data-testid='aktion-loeschen-k1']");
    expect(knopf).not.toBeNull();
    await act(async () => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(aufAktionLoeschen).toHaveBeenCalledTimes(1);
    expect(aufAktionLoeschen).toHaveBeenCalledWith("k1");
    // Der Loeschen-Knopf reisst KEINEN Hinzufuege-Ruf mit an.
    expect(attrappen.fuegeElementHinzu).not.toHaveBeenCalled();
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
    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledWith("k1", undefined, expect.any(Function));
  });

  it("ist auch fuer kaputte Aktionen erreichbar - kein Sperren (DoD)", async () => {
    const p = projekt({
      id: "p1",
      aktionen: [aktion({ id: "k1", bildRef: "unbekannt" })],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Zur Liste hinzufügen"),
    );
    expect(knopf).toBeDefined();

    await act(async () => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(attrappen.fuegeElementHinzu).toHaveBeenCalledTimes(1);
    expect(attrappen.fuegeElementHinzu.mock.calls.map((c) => c[0])).toEqual(["k1"]);
  });

  it("leitet einen Fehler von fuegeElementHinzu unveraendert an aufFehler - kein zweiter Aufruf (DoD)", async () => {
    const p = projekt({ id: "p1", aktionen: [aktion({ id: "k1" })] });
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
