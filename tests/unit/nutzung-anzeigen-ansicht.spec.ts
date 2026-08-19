// Verhaltenstests zu #254 - die Anzeige (nutzung-anzeigen.tsx, jsdom).
//
// Die Anzeige ist DÜNN: sie haelt den Stand nicht selbst, rechnet nichts und ruft
// keinerlei Fachlichkeit. `stand`, `anzeige`, `aufgeklappt` kommen von aussen;
// gemessen wird, was bei jedem Zustand erscheint - und dass "unbekannt" nie eine
// Zahl und nie "frei" zeigt (der gefaehrlichste Fehler dieses Issues).
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement, type ReactElement } from "react";

import type { Nutzungsstand, NutzungsAnzeige } from "../../src/renderer/vorlagen-editor/nutzung-anzeigen";
import { LEERER_NUTZUNGSSTAND, baueNutzungsAnzeige } from "../../src/renderer/vorlagen-editor/nutzung-anzeigen";
import * as nutzungModul from "../../src/renderer/vorlagen-editor/nutzung-anzeigen";
// Es gibt im selben Ordner einen `.ts`-Zwilling (nutzung-anzeigen.ts, die Logik).
// Der endungslose Import wuerde zu IHm aufloesen, nicht zur Komponente. Der Import
// mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite); das Test-tsconfig
// verbietet die Endung aber ohne `allowImportingTsExtensions` (TS5097). Da diese
// Konfiguration ausserhalb des Aenderungsbereichs liegt, wird der reale Fehler hier
// wie im Projekt ueblich per ts-expect-error gewusst quittiert.
// @ts-expect-error - nutzung-anzeigen.tsx statt des `.ts`-Zwillings (siehe oben)
import { NutzungAnzeige, type NutzungAnzeigeEigenschaften } from "../../src/renderer/vorlagen-editor/nutzung-anzeigen.tsx";

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
// Vitest mit jsdom erkennt es nicht automatisch - also hier setzen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function eigenschaften(
  stand: Nutzungsstand,
  teil: Partial<NutzungAnzeigeEigenschaften> = {},
): NutzungAnzeigeEigenschaften {
  return {
    stand,
    anzeige: null,
    aufgeklappt: false,
    aufUmschalten: vi.fn(),
    aufErneutLaden: vi.fn(),
    ...teil,
  };
}

function rendere(eig: NutzungAnzeigeEigenschaften): {
  behaelter: HTMLDivElement;
  fertig: () => void;
} {
  const behaelter = document.createElement("div");
  document.body.appendChild(behaelter);
  const wurzel: Root = createRoot(behaelter);
  act(() => {
    wurzel.render(createElement(NutzungAnzeige, eig) as ReactElement);
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

describe("Zustaende der Anzeige", () => {
  it("benannter Test - bei 'unbekannt' erscheint keine Zahl und kein 'wird nirgends verwendet'", () => {
    const { behaelter, fertig } = rendere(eigenschaften(LEERER_NUTZUNGSSTAND));

    expect(behaelter.textContent).not.toMatch(/\d/);
    expect(behaelter.textContent).not.toContain("nirgends");

    fertig();
  });

  it("bei 'laedt' erscheint ein Ladehinweis und keine Zahl", () => {
    const { behaelter, fertig } = rendere(
      eigenschaften({ zustand: "laedt", vorlagenId: "v-1", nutzung: null, fehler: null }),
    );

    expect(behaelter.textContent).toContain("geprueft");
    expect(behaelter.textContent).not.toMatch(/\d/);

    fertig();
  });

  it("bei 'fehler' erscheinen Meldung und der Knopf 'erneut laden'; aufErneutLaden wird bei Klick genau einmal gerufen", () => {
    const aufErneutLaden = vi.fn();
    const { behaelter, fertig } = rendere(
      eigenschaften(
        {
          zustand: "fehler",
          vorlagenId: "v-1",
          nutzung: null,
          fehler: { code: "speicher_fehler", meldung: "Platte voll" },
        },
        { aufErneutLaden },
      ),
    );

    expect(behaelter.textContent).toContain("Platte voll");
    expect(behaelter.textContent).not.toMatch(/\d/);
    expect(behaelter.textContent).not.toContain("frei");

    const knopf = behaelter.querySelector("button");
    expect(knopf).not.toBeNull();
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufErneutLaden).toHaveBeenCalledTimes(1);

    fertig();
  });

  it("bei 'geladen' mit frei: true erscheint der Satz 'wird nirgends verwendet' und keine aufklappbare Liste", () => {
    const nutzung = { aktionen: [], listenelemente: [] };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung, fehler: null };
    const anzeige: NutzungsAnzeige = baueNutzungsAnzeige(nutzung);
    const { behaelter, fertig } = rendere(eigenschaften(stand, { anzeige }));

    expect(behaelter.textContent).toContain("nirgends");
    expect(behaelter.querySelectorAll("ul").length).toBe(0);

    fertig();
  });

  it("benannter Test - 'geladen' mit Treffern zeigt anzeige.text und einen Umschalter; aufgeklappt false zeigt keine Trefferzeile", () => {
    const nutzung = {
      aktionen: [{ projektId: "p-1", projektName: "Projekt", id: "a-1" }],
      listenelemente: [],
    };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung, fehler: null };
    const anzeige: NutzungsAnzeige = baueNutzungsAnzeige(nutzung);
    const { behaelter, fertig } = rendere(eigenschaften(stand, { anzeige, aufgeklappt: false }));

    expect(behaelter.textContent).toContain(anzeige.text);
    const knopf = behaelter.querySelector("button");
    expect(knopf).not.toBeNull();
    expect(knopf?.textContent).toContain("anzeigen");
    expect(behaelter.querySelectorAll("li").length).toBe(0);

    fertig();
  });

  it("benannter Test - aufgeklappt true zeigt alle Trefferzeilen", () => {
    const nutzung = {
      aktionen: [{ projektId: "p-1", projektName: "Projekt", id: "a-1" }],
      listenelemente: [],
    };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung, fehler: null };
    const anzeige: NutzungsAnzeige = baueNutzungsAnzeige(nutzung);
    const { behaelter, fertig } = rendere(eigenschaften(stand, { anzeige, aufgeklappt: true }));

    expect(behaelter.querySelectorAll("li li").length).toBe(1);
    expect(behaelter.textContent).toContain("Aktion a-1");

    fertig();
  });

  it("der Umschalter ruft aufUmschalten genau einmal; die Anzeige haelt keinen eigenen Merker", () => {
    const aufUmschalten = vi.fn();
    const nutzung = {
      aktionen: [{ projektId: "p-1", projektName: "Projekt", id: "a-1" }],
      listenelemente: [],
    };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung, fehler: null };
    const anzeige: NutzungsAnzeige = baueNutzungsAnzeige(nutzung);
    const { behaelter, fertig } = rendere(
      eigenschaften(stand, { anzeige, aufgeklappt: false, aufUmschalten }),
    );

    const knopf = behaelter.querySelector("button");
    act(() => {
      knopf?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(aufUmschalten).toHaveBeenCalledTimes(1);

    fertig();
  });

  it("benannter Test - die aufgeklappte Liste zeigt je Gruppe den projektName und trennt Aktionen von Listenelementen", () => {
    const nutzung = {
      aktionen: [{ projektId: "p-1", projektName: "Projekt A", id: "a-1" }],
      listenelemente: [{ projektId: "p-1", projektName: "Projekt A", id: "l-1" }],
    };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung, fehler: null };
    const anzeige: NutzungsAnzeige = baueNutzungsAnzeige(nutzung);
    const { behaelter, fertig } = rendere(eigenschaften(stand, { anzeige, aufgeklappt: true }));

    expect(behaelter.textContent).toContain("Projekt A");
    expect(behaelter.textContent).toContain("Aktion a-1");
    expect(behaelter.textContent).toContain("Listenelement l-1");

    fertig();
  });

  it("benannter Test - die Anzeige ruft baueNutzungsAnzeige, zaehleProjekte, holeNutzung und leseVorlagennutzung null Mal (vier Spione)", () => {
    // Das `anzeige`-Literal wird von Hand gebaut, damit der eigene Testaufruf die Spione
    // nicht zaehlt: gemessen wird allein, was die ANZEIGE ruft.
    const anzeige: NutzungsAnzeige = {
      frei: false,
      anzahlAktionen: 1,
      anzahlListenelemente: 0,
      anzahlProjekte: 1,
      text: "wird von 1 Aktion in 1 Projekt verwendet",
      gruppen: [
        {
          projektId: "p-1",
          projektName: "Projekt",
          aktionen: [{ projektId: "p-1", projektName: "Projekt", id: "a-1" }],
          listenelemente: [],
        },
      ],
    };
    const stand: Nutzungsstand = { zustand: "geladen", vorlagenId: "v-1", nutzung: null, fehler: null };
    const baueSpion = vi.spyOn(nutzungModul, "baueNutzungsAnzeige");
    const zaehleSpion = vi.spyOn(nutzungModul, "zaehleProjekte");
    const holeSpion = vi.spyOn(nutzungModul, "holeNutzung");
    const leseSpion = vi.spyOn(nutzungModul, "leseVorlagennutzung");

    const { behaelter, fertig } = rendere(eigenschaften(stand, { anzeige, aufgeklappt: true }));

    expect(behaelter.textContent).toContain(anzeige.text);
    expect(baueSpion).not.toHaveBeenCalled();
    expect(zaehleSpion).not.toHaveBeenCalled();
    expect(holeSpion).not.toHaveBeenCalled();
    expect(leseSpion).not.toHaveBeenCalled();

    fertig();
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const CODE = readFileSync("src/renderer/vorlagen-editor/nutzung-anzeigen.tsx", "utf8");

  it("enthaelt kein rufeAuf, kein abonniere, kein KANAELE, kein window.api, kein Literal 'queue:', kein entferneVorlage und kein holeNutzung", () => {
    for (const verboten of [
      "rufeAuf",
      "abonniere",
      "KANAELE",
      "window.api",
      "'queue:",
      "entferneVorlage",
      "holeNutzung",
      "useState",
    ]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("importiert nur Typen aus nutzung-anzeigen (keine Werte)", () => {
    // Die Anzeige rechnet nichts: sie importiert ausschliesslich Typen von hier.
    const importe = CODE.split("\n").filter((z) => z.includes("nutzung-anzeigen'"));
    expect(importe.length).toBe(1);
    for (const zeile of importe) {
      expect(zeile).toContain("import type");
    }
  });
});