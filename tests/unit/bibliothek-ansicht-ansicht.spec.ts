// Verhaltenstest zu #227/#422 - die Darstellung (bibliothek-ansicht.tsx, jsdom).
//
// #422 (15.10.2026): Ein Projekt hat genau EIN Video. Der Medien-Bereich heisst "Video"
// und zeigt NUR Video-Assets; Bilder sind Motiv einer Aktion (action-editor) und
// erscheinen hier nicht mehr.
//
// 02.11.2026: "Zur Liste hinzufuegen" ist ENTFALLEN (Niklas: "Aktion als eigener Block
// ... ist Muell von frueher"). Eine Aktion gehoert ins VIDEO - als Band-Abschnitt oder
// als Unterbrechung. Die Tests, die den alten Knopf und `fuegeElementHinzu` prueften,
// sind mit dem Weg entfallen; die Montage des neuen Wegs steht in `ins-video-knopf.spec`.
//
// Gemessen wird: zwei getrennte Bereiche, der Hinweis ueber fehlende Videos, dass ein
// fehlendes Video gekennzeichnet aber NICHT gesperrt ist, und die Loeschen-Wege.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("zeigt KEINEN Hinweis, wenn kein Video fehlt (die Gegenprobe zum Hinweis)", () => {
    const p = projekt({ id: "p1", assets: [asset({ id: "a1", zustand: "ok" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    // Ohne fehlende Medien gibt es nichts zu melden - "0 Medien fehlen" waere Rauschen.
    expect(host.querySelector("[data-testid='bibliothek-hinweis']")).toBeNull();
  });

  it("kennzeichnet die ausgewaehlte Videozeile und meldet den Klick (#418)", () => {
    const aufWaehlen = vi.fn();
    const p = projekt({ id: "p1", assets: [asset({ id: "a1" }), asset({ id: "a2" })] });
    act(() => {
      root.render(
        createElement(
          Bibliotheksansicht,
          eigenschaften({ projekt: p, ausgewaehltesId: "a2", aufWaehlen }),
        ),
      );
    });

    expect(host.querySelector("[data-testid='medium-a1']")?.getAttribute("data-ausgewaehlt")).toBe(
      "false",
    );
    expect(host.querySelector("[data-testid='medium-a2']")?.getAttribute("data-ausgewaehlt")).toBe(
      "true",
    );
    act(() => {
      (host.querySelector("[data-testid='medium-a1']") as HTMLElement).click();
    });
    expect(aufWaehlen).toHaveBeenCalledTimes(1);
    expect(aufWaehlen).toHaveBeenCalledWith("a1");
  });

  it("kennzeichnet eine kaputte Aktion mit „· defekt“ - sichtbar, nicht gesperrt (#414)", () => {
    const aufAktionLoeschen = vi.fn();
    const p = projekt({
      id: "p1",
      aktionen: [aktion({ id: "k1", bildRef: "gibt-es-nicht" })],
    });
    act(() => {
      root.render(
        createElement(Bibliotheksansicht, eigenschaften({ projekt: p, aufAktionLoeschen })),
      );
    });

    const zeile = host.querySelector("[data-testid='aktion-k1']");
    expect(zeile?.textContent).toContain("defekt");
    // Gekennzeichnet heisst NICHT gesperrt: die Bedienung der Zeile bleibt stehen.
    expect(zeile?.querySelector("[data-testid='aktion-loeschen-k1']")).not.toBeNull();
  });

  it("zeigt Leer-Hinweise fuer leere Bereiche (Fehlerpfad)", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: projekt({ id: "p1" }) })));
    });

    expect(host.querySelector("[data-testid='video-leer']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-leer']")).not.toBeNull();
  });

  it("die Video-Zeile traegt nur Loeschen - einen Hinzufuegen-Weg gibt es nirgends mehr (#422)", () => {
    const p = projekt({ id: "p1", assets: [asset({ id: "a1" })] });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });

    const zeile = host.querySelector("[data-testid='medium-a1']");
    expect(zeile).not.toBeNull();
    const knopfe = Array.from(zeile?.querySelectorAll("button") ?? []);
    expect(knopfe.some((b) => b.textContent?.includes("Zur Liste hinzufügen"))).toBe(false);
    expect(knopfe.some((b) => b.textContent?.includes("Löschen"))).toBe(true);
    // 02.11.2026: auch die AKTIONS-Zeile traegt den alten Knopf nicht mehr.
    expect(host.textContent).not.toContain("Zur Liste hinzufügen");
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
  });
});

// 02.11.2026 (Sidepanel): Die Leiste schaltet zwischen den Bereichen um. Ohne `bereich`
// bleibt alles wie bisher - beide Bereiche untereinander (die Tests oben belegen das).
describe("Bereichs-Filter der Bibliothek (Sidepanel, 02.11.2026)", () => {
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

  const vollesProjekt = () =>
    projekt({ id: "p1", assets: [asset({ id: "a1" })], aktionen: [aktion({ id: "k1" })] });

  it("bereich 'video' zeigt NUR den Video-Bereich", () => {
    act(() => {
      root.render(
        createElement(
          Bibliotheksansicht,
          eigenschaften({ projekt: vollesProjekt(), bereich: "video" }),
        ),
      );
    });
    expect(host.querySelector("[data-testid='video-liste']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-liste']")).toBeNull();
    // Auch der Anlege-Weg der Aktionen gehoert nicht dazu.
    expect(host.querySelector("[data-testid='aktion-anlegen-oeffnen']")).toBeNull();
  });

  it("bereich 'aktionen' zeigt NUR den Aktionen-Bereich", () => {
    act(() => {
      root.render(
        createElement(
          Bibliotheksansicht,
          eigenschaften({ projekt: vollesProjekt(), bereich: "aktionen" }),
        ),
      );
    });
    expect(host.querySelector("[data-testid='aktionen-liste']")).not.toBeNull();
    expect(host.querySelector("[data-testid='video-liste']")).toBeNull();
    // Der Import-Knopf gehoert zum Video-Bereich.
    expect(host.querySelector("[data-testid='composer-medien-import']")).toBeNull();
  });

  it("ohne bereich bleibt beides sichtbar (bestehende Aufrufer unveraendert)", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: vollesProjekt() })));
    });
    expect(host.querySelector("[data-testid='video-liste']")).not.toBeNull();
    expect(host.querySelector("[data-testid='aktionen-liste']")).not.toBeNull();
  });
});

// 02.11.2026 (Messlatte): Die Zeile sagt, WO die Aktion laeuft. Ohne diesen Rueckverweis
// musste man die Zeitleiste absuchen - genau die Arbeit, die das Werkzeug abnehmen soll.
describe("Rueckverweis: laeuft bei (Aktionszeile, 02.11.2026)", () => {
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

  const videoMitBand = (abschnitte: Array<{ aktionRef: string; dauer: number }>) => ({
    id: "v1",
    art: "video" as const,
    ref: "a1",
    dauer: null,
    trimStart: 0,
    trimEnde: 30,
    einblendung: { bandVorlageId: "band", abschnitte },
    unterbrechungen: [],
  });

  it("nennt Startstelle und Wiederholung aus dem Band", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1" })],
      aktionen: [aktion({ id: "k1" })],
      // Folge 5 s, Video 30 s -> 6 Durchlaeufe
      liste: [videoMitBand([{ aktionRef: "k1", dauer: 5 }])],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });
    expect(host.querySelector("[data-testid='aktion-verwendung-k1']")?.textContent).toBe(
      "Band ab 0:00 · 6×",
    );
  });

  it("eine Aktion ohne Verwendung sagt das, statt zu schweigen", () => {
    const p = projekt({
      id: "p1",
      assets: [asset({ id: "a1" })],
      aktionen: [aktion({ id: "k1" })],
      liste: [videoMitBand([{ aktionRef: "andere", dauer: 5 }])],
    });
    act(() => {
      root.render(createElement(Bibliotheksansicht, eigenschaften({ projekt: p })));
    });
    expect(host.querySelector("[data-testid='aktion-verwendung-k1']")?.textContent).toBe(
      "noch nicht im Video",
    );
  });
});

// 02.11.2026: Zwei Formen, zwei Layouts. Ein Band (11,85:1) bekommt eine EIGENE Zeile in
// voller Breite; ein Ganzbild (16:9) steht neben dem Titel. Geprueft wird das Layout am
// DOM - ob wirklich gezeichnet wurde, kann jsdom nicht zeigen (kein 2d-Canvas), das
// misst der Treiber am Fenster.
describe("Motiv-Layout nach Form der Vorlage (02.11.2026)", () => {
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

  const mitVorlage = (hoehe: number | null) =>
    eigenschaften({
      projekt: projekt({ id: "p1", aktionen: [aktion({ id: "k1" })] }),
      vorlagen: [{ id: "v1", name: "Probe", höhe: hoehe, parent: null, eingebaut: true, zonen: [] }],
      holeMarke: () => null,
    });

  it("Band: das Motiv steht in VOLLER Breite", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, mitVorlage(162)));
    });
    const bild = host.querySelector<HTMLCanvasElement>("[data-testid='aktion-bild-k1']");
    expect(bild).not.toBeNull();
    expect(bild?.style.width).toBe("100%");
  });

  it("Ganzbild: das Motiv steht neben dem Titel in fester Breite", () => {
    act(() => {
      root.render(createElement(Bibliotheksansicht, mitVorlage(null)));
    });
    const bild = host.querySelector<HTMLCanvasElement>("[data-testid='aktion-bild-k1']");
    expect(bild).not.toBeNull();
    expect(bild?.style.width).toBe("71px");
  });
});
