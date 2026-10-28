// Verhaltenstest zu #230 - die Darstellung (ausgabe-liste.tsx, jsdom).
//
// Die Ansicht haelt den Stand NICHT selbst (Signatur) und exportiert NICHTS selbst.
// Gemessen wird, was bei jedem Zustand erscheint (unbekannt/fehler/leer/zeilen),
// dass unbekannt einen ANDEREN Text traegt als leer, und dass der Export-Rueckruf
// die ORIGINAL-Datei aus dem Bestand erhaelt.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

import type { AusgabeDatei } from "../../src/renderer/composer/ausgabe-liste";
import type { AusgabeListenEigenschaften } from "../../src/renderer/composer/ausgabe-liste.tsx";
import type { Ausgabenstand } from "../../src/renderer/composer/ausgabe-liste";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
import { AusgabeListenansicht } from "../../src/renderer/composer/ausgabe-liste.tsx";


(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function datei(ueber: Partial<AusgabeDatei> = {}): AusgabeDatei {
  return {
    dateiname: "sommeraktion.mp4",
    dateigroesse: 1_288_490_188,
    geaendertAm: "2026-08-19T12:00:00.000Z",
    ...ueber,
  };
}

function geladen(...dateien: AusgabeDatei[]): Ausgabenstand {
  return { zustand: "geladen", dateien, projektId: "p1", ladefehler: null };
}

function eigenschaften(ueber: Partial<AusgabeListenEigenschaften> = {}): AusgabeListenEigenschaften {
  return {
    stand: geladen(),
    aufExportieren: () => {},
    aufErneutLaden: () => {},
    ...ueber,
  };
}

describe("AusgabeListenansicht (ausgabe-liste.tsx)", () => {
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

  it("zeigt fuer unbekannt einen EIGENEN Text - nie denselben wie leer (DoD)", () => {
    act(() => {
      root.render(
        createElement(
          AusgabeListenansicht,
          eigenschaften({ stand: { zustand: "unbekannt", dateien: [], projektId: null, ladefehler: null } }),
        ),
      );
    });

    expect(host.textContent).toContain("Noch nicht geladen");
    expect(host.textContent).not.toContain("Noch keine Ausgabedatei");
    expect(host.querySelector("[data-testid='ausgaben-unbekannt']")).not.toBeNull();
  });

  it("zeigt fuer geladen und leer den Leer-Text (DoD)", () => {
    act(() => {
      root.render(createElement(AusgabeListenansicht, eigenschaften({ stand: geladen() })));
    });

    expect(host.textContent).toContain("Noch keine Ausgabedatei");
    expect(host.querySelector("[data-testid='ausgaben-leer']")).not.toBeNull();
  });

  it("zeigt bei ladefehler den Hinweis mit Knopf Erneut laden (Fehlerpfad)", () => {
    const aufErneutLaden = vi.fn();
    act(() => {
      root.render(
        createElement(
          AusgabeListenansicht,
          eigenschaften({
            stand: { ...geladen(datei()), ladefehler: { code: "speicher_fehler", meldung: "weg" } },
            aufErneutLaden,
          }),
        ),
      );
    });

    expect(host.textContent).toContain("Ausgabe-Liste nicht lesbar");
    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Erneut laden"),
    );
    expect(knopf).toBeDefined();
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufErneutLaden).toHaveBeenCalledTimes(1);
  });

  it("stellt jede Zeile mit Name, Groesse und Zeitpunkt dar (FA-22)", () => {
    const eintrag = datei({ dateiname: "sommeraktion.mp4" });
    act(() => {
      root.render(
        createElement(AusgabeListenansicht, eigenschaften({ stand: geladen(eintrag) })),
      );
    });

    expect(host.textContent).toContain("sommeraktion.mp4");
    // Die Groesse 1_288_490_188 Bytes erscheint als GB-Text.
    expect(host.textContent).toMatch(/GB/);
  });

  it("gibt dem Export-Rueckruf die ORIGINAL-Datei aus dem Bestand (DoD)", () => {
    const eintrag = datei({ dateiname: "sommeraktion.mp4" });
    const aufExportieren = vi.fn();
    act(() => {
      root.render(
        createElement(
          AusgabeListenansicht,
          eigenschaften({ stand: geladen(eintrag), aufExportieren }),
        ),
      );
    });

    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Exportieren"),
    );
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(aufExportieren).toHaveBeenCalledTimes(1);
    expect(aufExportieren.mock.calls[0]?.[0]).toBe(eintrag);
  });

  it("gibt jedem Export-Knopf seine EIGENE Datei - auch bei zwei Zeilen (DoD)", () => {
    const erste = datei({ dateiname: "a.mp4" });
    const zweite = datei({ dateiname: "b.mp4" });
    const aufExportieren = vi.fn();
    act(() => {
      root.render(
        createElement(
          AusgabeListenansicht,
          eigenschaften({ stand: geladen(erste, zweite), aufExportieren }),
        ),
      );
    });

    const knoepfe = Array.from(host.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Exportieren"),
    );
    expect(knoepfe).toHaveLength(2);
    act(() => {
      knoepfe[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(aufExportieren).toHaveBeenCalledTimes(1);
    expect(aufExportieren.mock.calls[0]?.[0]).toBe(zweite);
  });
});
