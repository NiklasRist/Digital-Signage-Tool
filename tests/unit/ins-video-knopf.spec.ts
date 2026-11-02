// Verhaltenstest zu „Ins Video" (02.11.2026) - der KNOPF in der Aktionszeile.
//
// Die Regel selbst liegt in `ins-video.ts` (eigene Spec). Hier steht nur, was die
// Ansicht zusichert:
//  1. Der Knopf ruft den EINEN Rueckruf mit der Aktions-Kennung.
//  2. Ohne Rueckruf gibt es KEINEN Knopf - die Ansicht erfindet keinen Weg.
//  3. Ohne Video gibt es keinen Knopf: das Ziel fehlt, und ein Knopf, der nur
//     scheitern kann, gehoert nicht in die Zeile.
//  4. Der Tooltip nennt das Ziel, das die Form der Aktion bestimmt.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Listenelement, Project } from "../../src/shared/contracts/project";
import type { Vorlage } from "../../src/shared/contracts/vorlage";
import type { BibliothekEigenschaften } from "../../src/renderer/composer/bibliothek-ansicht.tsx";
import { Bibliotheksansicht } from "../../src/renderer/composer/bibliothek-ansicht.tsx";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function aktion(ueber: Partial<Aktion> & { id: string }): Aktion {
  return {
    titel: `Aktion ${ueber.id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: "band-standard",
    markeId: "marke-test",
    akzentfarbe: null,
    ...ueber,
  };
}

function video(id: string): Listenelement {
  return {
    id,
    art: "video",
    ref: "asset-1",
    dauer: null,
    trimStart: 0,
    trimEnde: 10,
    einblendung: null,
    unterbrechungen: [],
  };
}

function vorlage(id: string, hoehe: number | null): Vorlage {
  return { id, name: id, höhe: hoehe, parent: null, eingebaut: false, zonen: [] };
}

function projekt(ueber: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Projekt",
    erstelltAm: "2026-01-01T00:00:00.000Z",
    geaendertAm: "2026-01-01T00:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [aktion({ id: "akt-1" })],
    liste: [video("video-1")],
    letzterAusgabeName: null,
    standardMarkeId: "marke-test",
    standardSegmentdauer: 10,
    ...ueber,
  };
}

function eigenschaften(ueber: Partial<BibliothekEigenschaften> = {}): BibliothekEigenschaften {
  return {
    projekt: projekt(),
    aufImportieren: () => {},
    aufMediumLoeschen: () => {},
    aufFehler: () => {},
    sichtSchreiber: () => {},
    ...ueber,
  };
}

describe("Aktionszeile: „Ins Video\"", () => {
  let host: HTMLElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  function zeichne(ueber: Partial<BibliothekEigenschaften>): void {
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften(ueber)));
    });
  }

  it("ruft den Rueckruf mit der Aktions-Kennung", () => {
    const aufInsVideo = vi.fn();
    zeichne({ aufInsVideo });
    const knopf = host.querySelector('[data-testid="aktion-ins-video-akt-1"]');
    expect(knopf).not.toBeNull();
    act(() => {
      (knopf as HTMLButtonElement).click();
    });
    expect(aufInsVideo).toHaveBeenCalledWith("akt-1");
  });

  it("ohne Rueckruf gibt es keinen Knopf", () => {
    zeichne({});
    expect(host.querySelector('[data-testid="aktion-ins-video-akt-1"]')).toBeNull();
  });

  it("ohne Video gibt es keinen Knopf - das Ziel fehlt", () => {
    zeichne({ aufInsVideo: () => {}, projekt: projekt({ liste: [] }) });
    expect(host.querySelector('[data-testid="aktion-ins-video-akt-1"]')).toBeNull();
  });

  it("der Tooltip nennt das Ziel: Band-Aktion -> Werbeband", () => {
    zeichne({
      aufInsVideo: () => {},
      vorlagen: [vorlage("band-standard", 162)],
    });
    const knopf = host.querySelector('[data-testid="aktion-ins-video-akt-1"]');
    expect(knopf?.getAttribute("title")).toContain("Werbeband");
  });

  it("der Tooltip nennt das Ziel: Ganzbild-Aktion -> Abspielmarke", () => {
    zeichne({
      aufInsVideo: () => {},
      vorlagen: [vorlage("vollbild", null)],
      projekt: projekt({ aktionen: [aktion({ id: "akt-1", vorlagenId: "vollbild" })] }),
    });
    const knopf = host.querySelector('[data-testid="aktion-ins-video-akt-1"]');
    expect(knopf?.getAttribute("title")).toContain("Abspielmarke");
  });
});
