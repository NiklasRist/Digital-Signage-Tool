// Verhaltenstest zu #324 - StandardmarkeAuswahl (jsdom): sichtbar gesperrt, Reihenfolge,
// Laufzeit-Sperre, kein eigener Auswahl-Zustand nach Fehlschlag.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

function fireEvent(ziel: HTMLSelectElement, wert: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ziel), 'value')
  setter?.set?.call(ziel, wert)
  ziel.dispatchEvent(new Event('change', { bubbles: true }))
}

import type { Marke } from "../../src/shared/contracts/marke";
import type { ProjektMeta } from "../../src/shared/contracts/projekt-meta";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { StandardmarkeAuswahl, STANDARDMARKE_BESCHRIFTUNG } = await import(
  "../../src/renderer/projekt-verwaltung/standardmarke.tsx"
);
const { baueStandardmarkenLage } = await import(
  "../../src/renderer/projekt-verwaltung/standardmarke"
);

const P_ID = "11111111-1111-4111-8111-111111111111";
const M_EINGEBAUT = "22222222-2222-4222-8222-222222222222";
const M_LIMA = "33333333-3333-4333-8333-333333333333";
const M_FEUER = "44444444-4444-4444-8444-444444444444";

function meta(beschaedigt = false): ProjektMeta {
  return {
    id: P_ID, name: "P", erstelltAm: "", geaendertAm: "", ordner: P_ID,
    beschaedigt, anzahlMedien: 0, anzahlAusgaben: 0, standardMarkeId: null,
  } as unknown as ProjektMeta;
}

function marke(id: string, name: string, eingebaut = false): Marke {
  return { id, name, parent: null, eingebaut } as unknown as Marke;
}

const BESTAND = [
  marke(M_EINGEBAUT, "Fitnessworld24", true),
  marke(M_LIMA, "Saison-Look"),
  marke(M_FEUER, "Sommer-Look"),
];

let behaelter: HTMLDivElement | null = null;
let wurzel: Root | null = null;

beforeEach(() => {
  behaelter = document.createElement('div');
  document.body.appendChild(behaelter);
});

afterEach(() => {
  if (wurzel !== null && behaelter !== null) {
    act(() => wurzel!.unmount());
  }
  behaelter?.remove();
  behaelter = null;
  wurzel = null;
});

function zeige(lage: unknown, aufWechsel: (markeId: string) => Promise<unknown>): HTMLSelectElement {
  wurzel = createRoot(behaelter!);
  act(() => {
    wurzel!.render(
      createElement(
        StandardmarkeAuswahl,
        { lage, aufWechsel } as unknown as { lage: Parameters<typeof StandardmarkeAuswahl>[0]['lage']; aufWechsel: (markeId: string) => Promise<unknown> },
      ) as ReactElement,
    );
  });
  return document.body.querySelector('select') as HTMLSelectElement;
}

describe("StandardmarkeAuswahl (#324) - bereit", () => {
  it("zeigt die Beschriftung, ist NICHT deaktiviert, Auswahlwert ist die Kennung der aktuellen Marke", () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND);
    const auswahlEl = zeige(lage, vi.fn());
    expect((document.body as HTMLElement).textContent).toContain("Standardmarke");
    expect(auswahlEl.disabled).toBe(false);
    expect(auswahlEl.value).toBe(M_LIMA);
  });

  it("enthaelt GENAU die Eintraege aus wahl, in derselben Reihenfolge, mit den NAMEN", () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND);
    const auswahlEl = zeige(lage, vi.fn());
    const optionen = Array.from(auswahlEl.querySelectorAll("option"));
    expect(optionen).toHaveLength(3);
    expect(optionen.map((o) => o.value)).toEqual([M_EINGEBAUT, M_LIMA, M_FEUER]);
    expect(optionen.map((o) => o.textContent)).toContain("Fitnessworld24 (eingebaut)");
    expect(optionen.map((o) => o.textContent)).toContain("Saison-Look");
  });

  it("eine Auswahl ruft aufWechsel GENAU EINMAL mit der gewaehlten Kennung", async () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND);
    const aufWechsel = vi.fn(() => Promise.resolve());
    const auswahlEl = zeige(lage, aufWechsel);
    await act(async () => {
      fireEvent(auswahlEl, M_FEUER);
    });
    expect(aufWechsel).toHaveBeenCalledTimes(1);
    expect(aufWechsel).toHaveBeenCalledWith(M_FEUER);
  });

  it("die Wahl der bereits gesetzten Marke ruft aufWechsel NULL Mal (ENTSCHIEDEN 5)", async () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND);
    const aufWechsel = vi.fn(() => Promise.resolve());
    const auswahlEl = zeige(lage, aufWechsel);
    await act(async () => {
      fireEvent(auswahlEl, M_LIMA);
    });
    expect(aufWechsel).not.toHaveBeenCalled();
  });

  it("waehrend der offenen Anfrage ist es deaktiviert, eine zweite Wahl ruft NICHT erneut; danach wieder bedienbar", async () => {
    const lage = baueStandardmarkenLage(meta(false), M_EINGEBAUT, BESTAND);
    let loese: ((wert: unknown) => void) | null = null;
    const aufWechsel = vi.fn(
      () =>
        new Promise((loesen) => {
          if (loese !== null) loese(undefined);
          loese = loesen;
        }),
    );
    const auswahlEl = zeige(lage, aufWechsel);

    await act(async () => {
      fireEvent(auswahlEl, M_LIMA);
    });
    expect(aufWechsel).toHaveBeenCalledTimes(1);
    expect(auswahlEl.disabled).toBe(true);

    await act(async () => {
      fireEvent(auswahlEl, M_FEUER);
    });
    expect(aufWechsel).toHaveBeenCalledTimes(1); // zweite Wahl nicht angenommen

    await act(async () => {
      loese!(undefined);
    });
    expect(auswahlEl.disabled).toBe(false);
  });

  it("abgelehntes aufWechsel: Sperre wird geloest (finally), KEINE eigene Fehlermeldung", async () => {
    const lage = baueStandardmarkenLage(meta(false), M_EINGEBAUT, BESTAND);
    const aufWechsel = vi.fn(() => Promise.reject(new Error("weg")));
    const auswahlEl = zeige(lage, aufWechsel);

    await act(async () => {
      fireEvent(auswahlEl, M_LIMA);
    });
    expect(auswahlEl.disabled).toBe(false);
    expect((document.body as HTMLElement).textContent).not.toMatch(/fehler|Fehler/);
  });

  it("nach fehlgeschlagenem Wechsel mit UNVERAENDERTER Lage: Menue zeigt wieder den ALTEN Wert (kein Auswaehl-Zustand)", () => {
    const lage = baueStandardmarkenLage(meta(false), M_LIMA, BESTAND);
    const auswahlEl = zeige(lage, vi.fn());
    expect(auswahlEl.value).toBe(M_LIMA);
    expect(baueStandardmarkenLage(meta(false), M_LIMA, BESTAND).art).toBe("bereit");
  });
});

describe("StandardmarkeAuswahl (#324) - gesperrt und unbekannt", () => {
  it("beschaedigt: select im DOM, DEAKTIVIERT, nie ausgeblendet (zwei Grundfaelle)", () => {
    for (const grund of ['beschaedigt', 'kein_bestand'] as const) {
      behaelter?.remove(); behaelter = document.createElement('div'); document.body.appendChild(behaelter);
      const lage = baueStandardmarkenLage(
        meta(grund === 'beschaedigt' ? true : false),
        grund === 'beschaedigt' ? M_LIMA : M_LIMA,
        grund === 'beschaedigt' ? BESTAND : null,
      );
      const auswahlEl = zeige(lage, vi.fn());
      expect(auswahlEl).toBeTruthy();
      expect(auswahlEl.disabled).toBe(true);
    }
  });

  it("unbekannte_marke: nicht waelbarer Platzhalter ausgewaehlt; Menue BLEIBT BEDIENBAR", () => {
    const lage = baueStandardmarkenLage(meta(false), "keins", BESTAND);
    const auswahlEl = zeige(lage, vi.fn());
    expect(auswahlEl.disabled).toBe(false);
    expect(auswahlEl.value).toBe("");
    const platzhalter = auswahlEl.querySelector('option[value=""]') as HTMLOptionElement | null;
    expect(platzhalter).toBeTruthy();
    expect(platzhalter!.disabled).toBe(true);
  });

  it("unbekannte_marke: eine ECHTE Wahl ruft aufWechsel und traegt die echte Kennung", async () => {
    const lage = baueStandardmarkenLage(meta(false), "keins", BESTAND);
    const aufWechsel = vi.fn(() => Promise.resolve());
    const auswahlEl = zeige(lage, aufWechsel);
    await act(async () => {
      fireEvent(auswahlEl, M_FEUER);
    });
    expect(aufWechsel).toHaveBeenCalledExactlyOnceWith(M_FEUER);
  });
});

describe("Grep-Proben (#324)", () => {
  it("standardmarke.ts ohne react/jsx/Strings; standardmarke.tsx ohne IPC", async () => {
    const fs = await import("node:fs/promises");
    const logik = await fs.readFile("src/renderer/projekt-verwaltung/standardmarke.ts", "utf8");
    expect(logik).not.toMatch(/'project:|'marken:|'queue:|window\.|path\.|umhuelleFuerBearbeitung|zeichneSegment|stelleMarkeBereit|abonniere|main\//);
    expect(logik).not.toMatch(/import .*react|from 'react'|JSX\.Element|useState/);
    const anzeige = await fs.readFile("src/renderer/projekt-verwaltung/standardmarke.tsx", "utf8");
    expect(anzeige).not.toMatch(/rufeAuf|abonniere|KANAELE|window\.api|project:|marken:|wechsleReiter|app-shell|marken-editor|src\/main/);
  });
});
