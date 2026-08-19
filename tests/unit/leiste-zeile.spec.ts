// Verhaltenstest zu #206 - die Darstellung (leiste-zeile.tsx, jsdom).
//
// Die Anzeige ist DÜNN: sie ruft `fasseZusammen` und stellt das Ergebnis dar.
// Gemessen wird, was bei jedem Zustand erscheint, dass der Klapp-Schalter den
// Klapp-Wunsch nach oben meldet (ohne eigenen Zustand) und dass der Ton als
// Datenwert am Element haengt (die Gestaltung von `hervorgehoben` ist eine offene
// Marken-Entscheidung des Issues).
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement, type ReactElement } from "react";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import type { AuftragsSicht } from "../../src/renderer/queue-panel/auftrags-sicht";
import type { LeisteZeileProps } from "../../src/renderer/queue-panel/leiste-zeile";
import * as zusammenfassungModul from "../../src/renderer/queue-panel/leiste-zusammenfassung";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
// @ts-expect-error - leiste-zeile.tsx statt des `.ts`-Zwillings (siehe oben)
import { LeisteZeile } from "../../src/renderer/queue-panel/leiste-zeile.tsx";

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
// Vitest mit jsdom erkennt es nicht automatisch - also hier setzen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/** Ein Auftrag mit vernuenftigen Vorbelegungen; je Test ueberschreibbar. */
function auftrag(ueber: Partial<Auftrag> = {}): Auftrag {
  const basis = {
    auftragId: "a-1",
    art: "import",
    status: "anstehend",
    label: "Import a-1",
    payload: { projektId: "p1", quellPfad: "C:/x.mp4" },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
  return { ...basis, ...ueber } as Auftrag;
}

function eigenschaften(
  sicht: AuftragsSicht,
  teil: Partial<LeisteZeileProps> = {},
): LeisteZeileProps {
  return {
    sicht,
    aufgeklappt: false,
    aufKlappenUmschalten: vi.fn(),
    ...teil,
  };
}

function rendere(eig: LeisteZeileProps): {
  behaelter: HTMLDivElement;
  fertig: () => void;
} {
  const behaelter = document.createElement("div");
  document.body.appendChild(behaelter);
  const wurzel: Root = createRoot(behaelter);
  act(() => {
    wurzel.render(createElement(LeisteZeile, eig as LeisteZeileProps) as ReactElement);
  });
  return {
    behaelter,
    fertig: () => {
      act(() => {
        wurzel.unmount();
      });
      behaelter.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("LeisteZeile (#206)", () => {
  it("stellt den zusammengefassten Text dar und traegt den Ton als Datenwert am Element", () => {
    const sicht: AuftragsSicht = {
      zustand: "geladen",
      auftraege: [
        auftrag({ auftragId: "w-1", status: "anstehend" }),
        auftrag({ auftragId: "f-1", status: "fehlgeschlagen" }),
      ],
    };
    const { behaelter, fertig } = rendere(eigenschaften(sicht));

    expect(behaelter.textContent).toContain("1 in der Warteschlange");
    expect(behaelter.textContent).toContain("1 fehlgeschlagen");
    const zeile = behaelter.querySelector('[data-ton="hervorgehoben"]');
    expect(zeile).not.toBeNull();

    fertig();
  });

  it("zeigt bei `unbekannt` die eigene Lade-Zeile, nie die leere Liste", () => {
    const { behaelter, fertig } = rendere(eigenschaften({ zustand: "unbekannt" }));

    expect(behaelter.textContent).toContain("Warteschlange wird geladen");
    expect(behaelter.textContent).not.toContain("Warteschlange leer");
    expect(behaelter.querySelector('[data-ton="unbekannt"]')).not.toBeNull();

    fertig();
  });

  it("zeigt bei `fehler` die feste Zeile und haengt den Ton hervorgehoben an", () => {
    const sicht: AuftragsSicht = {
      zustand: "fehler",
      code: "speicher_fehler",
      meldung: "Platte voll",
    };
    const { behaelter, fertig } = rendere(eigenschaften(sicht));

    expect(behaelter.textContent).toContain("Warteschlange nicht lesbar");
    // Die technische Meldung gehoert in die aufgeklappte Liste, nicht in die Zeile.
    expect(behaelter.textContent).not.toContain("Platte voll");
    expect(behaelter.querySelector('[data-ton="hervorgehoben"]')).not.toBeNull();

    fertig();
  });

  it("der Klapp-Schalter meldet `aufKlappenUmschalten` genau EINMAL (nicht doppelt ueber die Zeile)", () => {
    const aufKlappenUmschalten = vi.fn();
    const { behaelter, fertig } = rendere(
      eigenschaften({ zustand: "geladen", auftraege: [] }, { aufKlappenUmschalten }),
    );

    const knopf = behaelter.querySelector("button");
    expect(knopf).not.toBeNull();
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufKlappenUmschalten).toHaveBeenCalledTimes(1);

    fertig();
  });

  it("auch der Klick auf die Zeile selbst meldet den Klapp-Wunsch", () => {
    const aufKlappenUmschalten = vi.fn();
    const { behaelter, fertig } = rendere(
      eigenschaften({ zustand: "geladen", auftraege: [] }, { aufKlappenUmschalten }),
    );

    const zeile = behaelter.querySelector('[role="status"]');
    act(() => {
      zeile?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufKlappenUmschalten).toHaveBeenCalledTimes(1);

    fertig();
  });

  it("laesst `aufgeklappt` nur in Richtung und Beschriftung des Schalters wirken", () => {
    const zu = rendere(
      eigenschaften({ zustand: "geladen", auftraege: [] }, { aufgeklappt: false }),
    );
    const knopfZu = zu.behaelter.querySelector("button");
    expect(knopfZu?.getAttribute("aria-expanded")).toBe("false");
    expect(knopfZu?.textContent).toContain("▸");
    expect(knopfZu?.getAttribute("aria-label")).toContain("aufklappen");
    zu.fertig();

    const auf = rendere(
      eigenschaften({ zustand: "geladen", auftraege: [] }, { aufgeklappt: true }),
    );
    const knopfAuf = auf.behaelter.querySelector("button");
    expect(knopfAuf?.getAttribute("aria-expanded")).toBe("true");
    expect(knopfAuf?.textContent).toContain("▾");
    expect(knopfAuf?.getAttribute("aria-label")).toContain("zuklappen");
    auf.fertig();
  });

  it("nutzt den laufenden Auftrag fuer das Label der Zeile (aria-label)", () => {
    const sicht: AuftragsSicht = {
      zustand: "geladen",
      auftraege: [
        auftrag({
          auftragId: "l-1",
          art: "render",
          status: "laeuft",
          label: "Render: sommer-aktion.mp4",
          fortschritt: 40,
        }),
      ],
    };
    const { behaelter, fertig } = rendere(eigenschaften(sicht));

    const zeile = behaelter.querySelector('[role="status"]');
    expect(zeile?.getAttribute("aria-label")).toBe("Render: sommer-aktion.mp4");
    expect(behaelter.textContent).toContain("40 %");

    fertig();
  });

  it("ruft `fasseZusammen` genau EINMAL und rechnet nichts selbst", () => {
    const spion = vi.spyOn(zusammenfassungModul, "fasseZusammen");
    const sicht: AuftragsSicht = {
      zustand: "geladen",
      auftraege: [auftrag({ auftragId: "w-1", status: "anstehend" })],
    };

    const { behaelter, fertig } = rendere(eigenschaften(sicht));

    expect(spion).toHaveBeenCalledTimes(1);
    expect(spion).toHaveBeenCalledWith(sicht);
    expect(behaelter.textContent).toContain("1 in der Warteschlange");

    spion.mockRestore();
    fertig();
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const LOGIK = readFileSync("src/renderer/queue-panel/leiste-zusammenfassung.ts", "utf8");
  const ANZEIGE = readFileSync("src/renderer/queue-panel/leiste-zeile.tsx", "utf8");

  it("kein String, der mit `queue:` beginnt - in beiden Dateien", () => {
    for (const code of [LOGIK, ANZEIGE]) {
      for (const zeile of code.split("\n")) {
        const verkuerzt = zeile.trim().replace(/\/\/.*$/, "");
        expect(verkuerzt, zeile).not.toMatch(/['"`]queue:/);
      }
    }
  });

  it("kein rufeAuf, kein abonniere, kein window.api - in beiden Dateien", () => {
    for (const verboten of ["rufeAuf", "abonniere", "window.api"]) {
      expect(LOGIK, verboten).not.toContain(verboten);
      expect(ANZEIGE, verboten).not.toContain(verboten);
    }
  });

  it("die .tsx enthaelt kein useState, kein useEffect und keine eigene Zaehlung", () => {
    for (const verboten of ["useState", "useEffect"]) {
      expect(ANZEIGE, verboten).not.toContain(verboten);
    }
    // Kein Zaehlen in der Anzeige: keine Aufzaehlung ueber `sicht.auftraege` ausser
    // dem einen Aufruf von `fasseZusammen`.
    expect(ANZEIGE.match(/sicht\.auftraege/g)).toBeNull();
    expect(ANZEIGE.match(/status ===/g)).toBeNull();
  });
});