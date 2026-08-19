// Verhaltenstest zu #207 - die Darstellung (liste.tsx, jsdom).
//
// Die Anzeige ist DÜNN: sie ruft `baueListenInhalt` und stellt das Ergebnis dar.
// Gemessen wird, was bei jedem Zustand erscheint (unbekannt/fehler/leer/zeilen),
// dass keine eigene Fachlogik im jsx steckt (kein useState/useEffect) und dass
// der Ton als Datenwert am Element haengt.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement, type ReactElement } from "react";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import type { AuftragsSicht } from "../../src/renderer/queue-panel/auftrags-sicht";
import type { ListeProps } from "../../src/renderer/queue-panel/liste";
import * as listenZeilenModul from "../../src/renderer/queue-panel/listen-zeilen";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
// @ts-expect-error - liste.tsx statt des `.ts`-Zwillings (siehe oben)
import { Liste } from "../../src/renderer/queue-panel/liste.tsx";

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
// Vitest mit jsdom erkennt es nicht automatisch - also hier setzen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/** Ein Auftrag mit vernuenftigen Vorbelegungen; je Test ueberschreibbar. */
function auftrag(ueber: Partial<Auftrag> = {}): Auftrag {
  return {
    auftragId: "a-1",
    art: "render",
    status: "anstehend",
    label: "Render a-1",
    payload: { projektId: "p-1", vorlagenId: "v-1", ausgabeId: "a-1" },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-01-01T00:00:00.000Z",
    ...ueber,
  } as Auftrag;
}

function geladen(...auftraege: Auftrag[]): AuftragsSicht {
  return { zustand: "geladen", auftraege };
}

describe("Liste (liste.tsx)", () => {
  let host: HTMLElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("zeigt bei unbekannt den Lade-Hinweis und KEINE leere Liste (Invariante 1)", () => {
    let sicht: AuftragsSicht = { zustand: "unbekannt" };
    act(() => {
      root.render(
        createElement(Liste, {
          sicht,
          zeileSchalter: () => null,
        } satisfies ListeProps),
      );
    });

    expect(host.textContent).toContain("Warteschlange wird geladen");
    expect(host.textContent).not.toContain("Keine Aufträge");

    // Nach dem Nachladen wandert die Sicht in `geladen` - die Liste zeigt Zeilen.
    sicht = geladen(auftrag({ status: "laeuft", label: "Render live" }));
    act(() => {
      root.render(
        createElement(Liste, {
          sicht,
          zeileSchalter: () => null,
        } satisfies ListeProps),
      );
    });

    expect(host.textContent).toContain("Render live");
  });

  it("zeigt bei fehler den Hinweis statt einer leeren Liste", () => {
    act(() => {
      root.render(
        createElement(Liste, {
          sicht: { zustand: "fehler", code: "x", meldung: "kaputt" },
          zeileSchalter: () => null,
        } satisfies ListeProps),
      );
    });

    expect(host.textContent).toContain("nicht lesbar");
    expect(host.textContent).not.toContain("Keine Aufträge");
  });

  it("zeigt bei leer nur den Leer-Hinweis", () => {
    act(() => {
      root.render(
        createElement(Liste, {
          sicht: geladen(),
          zeileSchalter: () => null,
        } satisfies ListeProps),
      );
    });

    expect(host.textContent).toBe("Keine Aufträge");
  });

  it("stellt jede Zeile in der gelieferten Reihenfolge dar (DoD)", () => {
    const zeilenSicht = geladen(
      auftrag({ auftragId: "c", status: "fehlgeschlagen", label: "Fehlgeschlagen" }),
      auftrag({ auftragId: "a", status: "anstehend", label: "Wartet" }),
      auftrag({ auftragId: "b", status: "laeuft", label: "Läuft" }),
    );
    act(() => {
      root.render(
        createElement(Liste, {
          sicht: zeilenSicht,
          zeileSchalter: () => null,
        } satisfies ListeProps),
      );
    });

    const zeilen = Array.from(host.querySelectorAll("li"));
    expect(zeilen.map((z) => z.textContent)).toEqual([
      expect.stringContaining("Fehlgeschlagen"),
      expect.stringContaining("Wartet"),
      expect.stringContaining("Läuft"),
    ]);
  });

  it("gibt dem Klapp-Schalter den Auftrag zur Bedienung mit (Verdrahtung an #257)", () => {
    const schalter = vi.fn((zeile) => createElement("button", {}, zeile.auftragId));
    act(() => {
      root.render(
        createElement(Liste, {
          sicht: geladen(auftrag({ auftragId: "a-1", label: "Render a-1" })),
          zeileSchalter: schalter,
        } satisfies ListeProps),
      );
    });

    expect(schalter).toHaveBeenCalledTimes(1);
    const ersterAufruf = schalter.mock.calls[0]?.[0];
    expect(ersterAufruf).toBeDefined();
    expect(ersterAufruf.auftragId).toBe("a-1");
  });
});

describe("DoD-Grep-Proben (liste.tsx, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/queue-panel/liste.tsx", "utf8").split("\n").filter((zeile) => {
    const getrimmt = zeile.trim();
    return !getrimmt.startsWith("//") && getrimmt !== "";
  }).join("\n");

  it("haelt keinen eigenen Zustand (kein useState/useEffect)", () => {
    expect(CODE).not.toContain("useState");
    expect(CODE).not.toContain("useEffect");
  });

  it("kennt keine IPC-Aufrufe (kein rufeAuf, abonniere, window.api)", () => {
    for (const verboten of ["rufeAuf", "abonniere", "window.api"]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("sortiert, filtert und kappt nicht (kein .sort(, .filter(, .slice()", () => {
    for (const verboten of [".sort(", ".filter(", ".slice("]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });
});