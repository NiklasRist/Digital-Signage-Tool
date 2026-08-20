// Verhaltenstest zu #222 - die Darstellung (liste-ansicht.tsx, jsdom).
//
// Die Ansicht haelt den Stand NICHT selbst (Signatur) und fuehrt keine Operation aus -
// sie ruft nur die uebergebenen Rueckrufe. Gemessen wird, was bei jedem Zustand
// erscheint (unbekannt/fehler/leer/zeilen), dass unbekannt einen ANDEREN Text traegt
// als leer, und dass die Rueckrufe das ORIGINAL-meta erhalten (kein Ersatzwert).
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

import type { ProjektMeta } from "../../src/renderer/projekt-verwaltung/liste";
import type { ProjektlisteEigenschaften } from "../../src/renderer/projekt-verwaltung/liste-ansicht";
import type { Projektliste } from "../../src/renderer/projekt-verwaltung/liste";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
// @ts-expect-error - liste-ansicht.tsx statt des `.ts`-Zwillings (siehe oben)
import { Projektlisteansicht } from "../../src/renderer/projekt-verwaltung/liste-ansicht.tsx";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function meta(ueber: Partial<ProjektMeta> = {}): ProjektMeta {
  return {
    id: "p1",
    name: "Projekt Eins",
    erstelltAm: "2026-08-01T10:00:00.000Z",
    geaendertAm: "2026-08-02T11:30:00.000Z",
    ordner: "p1",
    beschaedigt: false,
    anzahlMedien: 3,
    anzahlAusgaben: 1,
    ...ueber,
  };
}

function geladen(...eintraege: ProjektMeta[]): Projektliste {
  return { zustand: "geladen", eintraege, ladefehler: null };
}

function eigenschaften(ueber: Partial<ProjektlisteEigenschaften> = {}): ProjektlisteEigenschaften {
  return {
    liste: geladen(),
    offenesProjektId: null,
    aufOeffnen: () => {},
    aufDuplizieren: () => {},
    aufLoeschen: () => {},
    aufErneutLaden: () => {},
    zeichneBeschaedigteZeile: () => createElement("span", { "data-testid": "beschaedigt" }, "defekt"),
    ...ueber,
  };
}

describe("Projektlisteansicht (liste-ansicht.tsx)", () => {
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
          Projektlisteansicht,
          eigenschaften({ liste: { zustand: "unbekannt", eintraege: [], ladefehler: null } }),
        ),
      );
    });

    expect(host.textContent).toContain("Noch nicht geladen");
    expect(host.textContent).not.toContain("Noch keine Projekte");
    expect(host.querySelector("[data-testid='projektliste-unbekannt']")).not.toBeNull();
  });

  it("zeigt fuer geladen und leer den Leer-Text (DoD)", () => {
    act(() => {
      root.render(createElement(Projektlisteansicht, eigenschaften({ liste: geladen() })));
    });

    expect(host.textContent).toContain("Noch keine Projekte");
    expect(host.querySelector("[data-testid='projektliste-leer']")).not.toBeNull();
  });

  it("zeigt bei ladefehler den Hinweis mit Knopf Erneut laden (Fehlerpfad)", () => {
    const aufErneutLaden = vi.fn();
    act(() => {
      root.render(
        createElement(
          Projektlisteansicht,
          eigenschaften({
            liste: { ...geladen(meta({ id: "p1" })), ladefehler: { code: "speicher_fehler", meldung: "weg" } },
            aufErneutLaden,
          }),
        ),
      );
    });

    expect(host.textContent).toContain("Projektliste nicht lesbar");
    const knopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Erneut laden"),
    );
    expect(knopf).toBeDefined();
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufErneutLaden).toHaveBeenCalledTimes(1);
  });

  it("stellt jede Zeile dar und gibt den Rueckrufen das ORIGINAL-meta (DoD)", () => {
    const eintrag = meta({ id: "p1", name: "Projekt Eins", ordner: "p1" });
    const aufOeffnen = vi.fn();
    act(() => {
      root.render(
        createElement(
          Projektlisteansicht,
          eigenschaften({ liste: geladen(eintrag), aufOeffnen }),
        ),
      );
    });

    expect(host.textContent).toContain("Projekt Eins");
    expect(host.textContent).toContain("p1");

    const oeffnenKnopf = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Projekt Eins"),
    );
    act(() => {
      oeffnenKnopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufOeffnen).toHaveBeenCalledTimes(1);
    // Das Original-meta - mit den Zaehlfeldern (kein Ersatzwert, ENTSCHIEDEN 5).
    expect(aufOeffnen.mock.calls[0]?.[0]).toBe(eintrag);
  });

  it("uebergibt eine beschaedigte Zeile an zeichneBeschaedigteZeile (#223) und zeigt keinen Oeffnen-Knopf", () => {
    const besch = meta({ id: "p2", name: "Kaputt", beschaedigt: true });
    const zeichner = vi.fn((_p: ProjektMeta) => createElement("span", { "data-testid": "beschaedigt" }, "defekt"));
    act(() => {
      root.render(
        createElement(
          Projektlisteansicht,
          eigenschaften({ liste: geladen(besch), zeichneBeschaedigteZeile: zeichner }),
        ),
      );
    });

    expect(zeichner).toHaveBeenCalledTimes(1);
    expect(zeichner.mock.calls[0]?.[0]).toBe(besch);
    expect(host.querySelector("[data-testid='beschaedigt']")).not.toBeNull();
    // Kein Oeffnen-Knopf fuer die beschaedigte Zeile (oeffnenErlaubt === false).
    expect(Array.from(host.querySelectorAll("button")).map((b) => b.textContent)).not.toContain(
      "Kaputt",
    );
  });

  it("hebt das offene Projekt hervor (data-ton hervorgehoben)", () => {
    act(() => {
      root.render(
        createElement(
          Projektlisteansicht,
          eigenschaften({ liste: geladen(meta({ id: "p1" })), offenesProjektId: "p1" }),
        ),
      );
    });

    expect(host.querySelector("[data-ton='hervorgehoben']")).not.toBeNull();
  });
});

describe("DoD-Grep-Proben (liste-ansicht.tsx, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/projekt-verwaltung/liste-ansicht.tsx", "utf8")
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

  it("enthaelt kein rufeAuf, kein KANAELE und keinen eigenen Ladevorgang (DoD)", () => {
    for (const verboten of ["rufeAuf", "KANAELE", "listeProjekte", "ladeProjektliste"]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("haelt keinen eigenen Zustand (kein useState/useEffect)", () => {
    expect(CODE).not.toContain("useState");
    expect(CODE).not.toContain("useEffect");
  });
});