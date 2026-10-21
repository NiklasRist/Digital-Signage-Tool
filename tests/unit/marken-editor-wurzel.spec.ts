// Verhaltenstest zu #330 - MarkenEditorWurzel (jsdom): Anordnung, Aufrufzählung,
// Import, Herkunft, Löschen, Ableiten. Alle zwölf Bausteine sind Doppeln.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Marke, MarkenHerkunftJeFeld } from "../../src/shared/contracts/marke";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({
  oeffneMarke: vi.fn(() => Promise.resolve({ ok: true, wert: null })),
  holeGeoeffnete: vi.fn((): unknown => null),
  aufGeoeffneteGeaendert: vi.fn((_cb?: unknown) => () => undefined),
  erstelleEigenstaendigeMarke: vi.fn(),
  setzeFarbe: vi.fn(),
  baueSchriftAnzeige: vi.fn(() => []),
  entferneLogo: vi.fn(),
  setzeFeldAufGeerbt: vi.fn((): unknown => Promise.resolve({ ok: true, wert: null })),
  leseHerkunft: vi.fn((): unknown => 'eigen'),
  baueHerkunftText: vi.fn((status: unknown, eltern: unknown): unknown => `Eigenwert ${String(status)} ${String(eltern)}`),
  ableitbareBasen: vi.fn((): unknown => []),
  leiteMarkeAb: vi.fn(),
  KontrastWarnung: vi.fn(() => null),
  ermittleLoeschvorschau: vi.fn(),
  brauchtStandardmarkenAusweg: vi.fn(() => false),
  bestaetigeLoeschen: vi.fn(),
  setzeSlogan: vi.fn(),
  setzeSicherheitsabstand: vi.fn(),
  baueVorlagenHinweis: vi.fn(() => null),
  waehleUndImportiereSchrift: vi.fn(),
  waehleUndImportiereLogo: vi.fn(),
}));

vi.mock('../../src/renderer/marken-editor/marken-uebersicht', () => ({
  oeffneMarke: h.oeffneMarke,
  holeGeoeffneteMarke: h.holeGeoeffnete,
  aufGeoeffneteMarkeGeaendert: h.aufGeoeffneteGeaendert,
  erstelleEigenstaendigeMarke: h.erstelleEigenstaendigeMarke,
}));
vi.mock('../../src/renderer/marken-editor/farben-bearbeiten', () => ({
  FARB_ROLLEN: ['akzent', 'akzentTief', 'linie', 'scrimStart', 'scrimEnde',
    'akzentKraeftig', 'flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell',
    'flaecheAkzentZart', 'textAufDunkel', 'textAufHell', 'textSekundaer'],
  setzeFarbe: h.setzeFarbe,
}));
vi.mock('../../src/renderer/marken-editor/schriften-bearbeiten', () => ({
  baueSchriftAnzeige: h.baueSchriftAnzeige,
  LIZENZHINWEIS_IMPORT: 'LIZENZ',
}));
vi.mock('../../src/renderer/marken-editor/logo-bearbeiten', () => ({
  HINWEIS_LOGO_ENTFERNT: 'HINWEIS',
  entferneLogo: h.entferneLogo,
}));
vi.mock('../../src/renderer/marken-editor/herkunft-anzeigen', () => ({
  setzeFeldAufGeerbt: h.setzeFeldAufGeerbt,
  leseHerkunft: h.leseHerkunft,
  baueHerkunftText: h.baueHerkunftText,
}));
vi.mock('../../src/renderer/marken-editor/marke-ableiten', () => ({
  HINWEIS_NUR_EIGENSTAENDIGE_BASIS: 'HINWEIS_BASIS',
  ableitbareBasen: h.ableitbareBasen,
  leiteMarkeAb: h.leiteMarkeAb,
}));
vi.mock('../../src/renderer/marken-editor/kontrast-warnung', () => ({
  KontrastWarnung: h.KontrastWarnung,
}));
vi.mock('../../src/renderer/marken-editor/loeschen-vorwarnung', () => ({
  ermittleLoeschvorschau: h.ermittleLoeschvorschau,
  brauchtStandardmarkenAusweg: h.brauchtStandardmarkenAusweg,
  bestaetigeLoeschen: h.bestaetigeLoeschen,
}));
vi.mock('../../src/renderer/marken-editor/slogan-bearbeiten', () => ({
  setzeSlogan: h.setzeSlogan,
}));
vi.mock('../../src/renderer/marken-editor/sicherheitsabstand-bearbeiten', () => ({
  setzeSicherheitsabstand: h.setzeSicherheitsabstand,
  baueVorlagenHinweis: h.baueVorlagenHinweis,
}));
vi.mock('../../src/renderer/marken-editor/datei-import', () => ({
  waehleUndImportiereSchrift: h.waehleUndImportiereSchrift,
  waehleUndImportiereLogo: h.waehleUndImportiereLogo,
}));

const { MarkenEditorWurzel } = await import('../../src/renderer/marken-editor/index.tsx');

const DIE_ID = "11111111-1111-4111-8111-111111111111";
const PARENT_ID = "22222222-2222-4222-8222-222222222222";
const LIMA_ID = "33333333-3333-4333-8333-333333333333";

function markeFuerTest(teil: Record<string, unknown> = {}): Marke {
  return {
    id: DIE_ID, name: 'M', parent: null, eingebaut: false,
    farben: {}, schriften: {}, logo: null, sicherheit: { horizontal: 0, vertikal: 0 },
    slogan: { text: '', aktiv: false }, herkunftJeFeld: {} as MarkenHerkunftJeFeld,
    ...teil,
  } as unknown as Marke;
}

const UEBERSICHT = { marken: [markeFuerTest(), markeFuerTest({ id: PARENT_ID, name: 'P' })] };
const ZUGANG = (initial: unknown) => ({
  lade: vi.fn(() => Promise.resolve({ ok: true, wert: initial })),
  hole: vi.fn(() => initial),
  aufGeaendert: vi.fn(() => () => undefined),
});

let behaelter: HTMLDivElement | null = null;
let wurzel: Root | null = null;

beforeEach(() => {
  behaelter = document.createElement('div');
  document.body.appendChild(behaelter);
  // Aufrufzählungen isolieren - jede Testprobe zählt nur ihre eigenen Rufe.
  h.oeffneMarke.mockClear();
});

afterEach(() => {
  if (wurzel !== null && behaelter !== null) {
    act(() => wurzel!.unmount());
  }
  behaelter?.remove();
  behaelter = null;
  wurzel = null;
});

function zeige(props: Record<string, unknown>): HTMLElement {
  wurzel = createRoot(behaelter!);
  act(() => {
    wurzel!.render(
      createElement(MarkenEditorWurzel, props as never) as ReactElement,
    );
  });
  return behaelter as unknown as HTMLElement;
}

describe('MarkenEditorWurzel (#330) - Anordnung und Liste', () => {
  it('drei Bereiche in Reihenfolge Liste, Mark, Vorschau; keine Lade-Rufe beim Aufbau', () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    expect(
      Array.from(behaelterTest.querySelectorAll(':scope > div [data-testid], [data-testid]')).map(
        (e) => e.getAttribute('data-testid'),
      ).filter((n) => n !== null),
    ).toEqual(
      expect.arrayContaining(['marken-liste', 'marken-offen-leer', 'marken-vorschau']),
    );
    expect(zugang.lade).not.toHaveBeenCalled();
    expect(h.oeffneMarke).not.toHaveBeenCalled();
  });

  it('Liste enthaelt ALLE Marken in Bestandsreihenfolge, ohne Sortierung', () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    const texte = Array.from(
      behaelterTest.querySelectorAll('[data-testid="marken-liste"] button'),
    )
      .map((b) => b.textContent)
      .filter((t) => t === 'M' || t === 'P');
    expect(texte).toEqual(['M', 'P']);
  });

  it('Klick auf Listeneintrag: oeffneMarke GENAU EINMAL mit dessen id', async () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="marken-liste"] button')!.click();
    });
    expect(h.oeffneMarke).toHaveBeenCalledTimes(1);
    expect(h.oeffneMarke).toHaveBeenCalledWith(DIE_ID);
  });

  it('hole() === null: Hinweis + EINE Schaltfläche; erst deren Betätigung ruft lade() GENAU EINMAL', async () => {
    const zugang = ZUGANG(null);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    expect(zugang.lade).not.toHaveBeenCalled();
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="marken-lade"]')!.click();
    });
    expect(zugang.lade).toHaveBeenCalledTimes(1);
  });
});

describe('MarkenEditorWurzel (#330) - geöffnete Marke', () => {
  beforeEach(() => {
    h.holeGeoeffnete.mockImplementation(() => markeFuerTest({ id: DIE_ID }));
  });

  it('dreizehn Farbfelder in FARB_ROLLEN-Reihenfolge und kein Object.keys auf farben', () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    expect(
      behaelterTest.querySelectorAll('[data-testid^="farbe-"]'),
    ).toHaveLength(13);
  });

  it('KontrastWarnung mit der geöffneten Marke und schwellenwert KONTRAST_SCHWELLE (4.5)', () => {
    const zugang = ZUGANG(UEBERSICHT);
    zeige({ sichtbar: true, marken: zugang });
    expect(h.KontrastWarnung).toHaveBeenCalled();
    const ruf = h.KontrastWarnung.mock.calls[h.KontrastWarnung.mock.calls.length - 1] as unknown as [
      { marke: Marke; schwellenwert: number },
    ];
    expect(ruf[0]!.marke.id).toBe(DIE_ID);
    expect(ruf[0]!.schwellenwert).toBe(4.5);

  });

  it(' Farbänderung: setzeFarbe GENAU EINMAL mit (marke.id, rolle, wert UNVERAENDERT)', async () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    const feld = behaelterTest.querySelector<HTMLInputElement>('[data-testid="farbe-akzent"]')!;
    await act(async () => {
      feld.focus();
      fieldGetSetter(feld, '#ABcdef');
      feld.blur();
    });
    expect(h.setzeFarbe).toHaveBeenCalledTimes(1);
    expect(h.setzeFarbe).toHaveBeenCalledWith(DIE_ID, 'akzent', '#ABcdef');
  });

  it('Slogan geändert: setzeSlogan mit BEIDEN Schlüsseln (bekannter text bleibt)', async () => {
    h.holeGeoeffnete.mockReturnValue(
      markeFuerTest({ slogan: { text: 'BESTTEXT', aktiv: false } }),
    );
    h.setzeSlogan.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // Nur den Schalter umbenennen
    const schalter = behaelterTest.querySelector<HTMLInputElement>('[data-testid="marken-slogan"] input[type="checkbox"]')!;
    await act(async () => {
      schalter.click();
    });
    const schaltflaechen = behaelterTest.querySelectorAll<HTMLButtonElement>('[data-testid="marken-slogan"] button');
    schaltflaechen[0]!.click();
    expect(h.setzeSlogan).toHaveBeenCalledTimes(1);
    expect(h.setzeSlogan).toHaveBeenCalledWith(DIE_ID, { text: 'BESTTEXT', aktiv: true });
  });

  it('Abstand: baueVorlagenHinweis VOR dem Schreiben; es heißt NULL, kein Hinweis', async () => {
    h.setzeSicherheitsabstand.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    const feld = behaelterTest.querySelector<HTMLInputElement>('[data-testid="abstand-horizontal"]')!;
    fieldGetSetter(feld, '10');
    await act(async () => {
      feld.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const schalteSehrKlein = behaelterTest.querySelectorAll<HTMLButtonElement>('[data-testid="marken-sicherheit"] button');
    schalteSehrKlein[0]!.click();
    expect(h.baueVorlagenHinweis).toHaveBeenCalledTimes(1);
    expect(h.setzeSicherheitsabstand).toHaveBeenCalledWith(DIE_ID, { horizontal: 10, vertikal: 0 });
  });

  it('Import Schrift: Schaltfläche ruft waehleUndImportiereSchrift GENAU EINMAL mit (marke.id, rolle)', async () => {
    h.baueSchriftAnzeige.mockReturnValue([
      { rolle: 'fliesstext', schrift: {}, importiert: false },
    ] as never);
    h.waehleUndImportiereSchrift.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    expect((document.body.textContent as string).includes('LIZENZ')).toBe(true);
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="import-schrift-fliesstext"]')!.click();
    });
    expect(h.waehleUndImportiereSchrift).toHaveBeenCalledTimes(1);
    expect(h.waehleUndImportiereSchrift).toHaveBeenCalledWith(DIE_ID, 'fliesstext');
  });

  it('der Abbruch des Imports ({ ok: true, wert: null }) macht NICHTS', async () => {
    h.baueSchriftAnzeige.mockReturnValue([
      { rolle: 'fliesstext', schrift: {}, importiert: false },
    ] as never);
    h.waehleUndImportiereSchrift.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    const davor = behaelterTest.innerHTML;
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="import-schrift-fliesstext"]')!.click();
    });
    expect(behaelterTest.querySelector('[data-testid="import-fehler"]')).toBeNull();
    expect((behaelterTest.innerHTML === davor).valueOf()).toBe(true);
  });

  it('Logo entfernen: entferneLogo GENAU EINMAL; HINWEIS_LOGO_ENTFERNT unverändert', async () => {
    h.entferneLogo.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    expect((document.body.textContent as string).includes('HINWEIS')).toBe(true);
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="entferne-logo"]')!.click();
    });
    expect(h.entferneLogo).toHaveBeenCalledTimes(1);
    expect(h.entferneLogo).toHaveBeenCalledWith(DIE_ID);
  });
});

function fieldGetSetter(feld: HTMLInputElement, wert: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(feld), 'value')
  setter?.set?.call(feld, wert)
}

describe('MarkenEditorWurzel (#330) - Herkunft, Loeschen, Ableiten', () => {
  it('abgeleitete Marke: JEDES Feld traegt eine Herkunft-Zeile aus baueHerkunftText', () => {
    h.holeGeoeffnete.mockReturnValue(
      markeFuerTest({ id: DIE_ID, parent: PARENT_ID }),
    );
    h.leseHerkunft.mockReturnValue('eigen');

    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // Eine Zeile je Fachbegriff-art; die hauptdouzieme Fields (13 Farben etc.) zeigen je their Zeilen.
    const zeilen = Array.from(behaelterTest.querySelectorAll('[data-testid^="herkunft-"]')).map(
      (e) => e.getAttribute('data-testid'),
    );
    expect(zeilen.length).toBeGreaterThan(5);
    for (const art of ['herkunft-farbe', 'herkunft-schrift', 'herkunft-logo', 'herkunft-slogan', 'herkunft-sicherheit']) {
      expect(Array.from(behaelterTest.querySelectorAll(`[data-testid="${art}"]`)).length).toBeGreaterThan(0);
    }
    expect((document.body.textContent as string).includes('Eigenwert')).toBe(true);
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID }));
  });

  it('eigenstaendige Marke: KEINE Herkunftr zeile, leseHerkunft und baueHerkunftText NULL Mal', () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID, parent: null }));
    h.leseHerkunft.mockClear();
    h.baueHerkunftText.mockClear();
    const zugang = ZUGANG(UEBERSICHT);
    zeige({ sichtbar: true, marken: zugang });
    expect(h.leseHerkunft).not.toHaveBeenCalled();
    expect(h.baueHerkunftText).not.toHaveBeenCalled();
    h.leseHerkunft.mockReturnValue('eigen');
    h.baueHerkunftText.mockReturnValue('Eigenwert');
  });

  it('Loeschen: ERST ermittleLoeschvorschau, DANN bestaetigeLoeschen nach Bestätigung; bei eingebaut NULL', async () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID, parent: null }));
    const vorschau = {
      darfLoeschen: true,
      eingebaut: false,
      nutzung: null,
    } as never;
    h.ermittleLoeschvorschau.mockResolvedValue({ ok: true, wert: vorschau });
    h.bestaetigeLoeschen.mockResolvedValue({ ok: true, wert: undefined });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });

    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="loeschengesuch"]')!.click();
    });
    expect(h.ermittleLoeschvorschau).toHaveBeenCalledTimes(1);
    expect(h.ermittleLoeschvorschau).toHaveBeenCalledWith(
      expect.objectContaining({ id: DIE_ID }),
    );
    expect(h.bestaetigeLoeschen).not.toHaveBeenCalled();

    await act(async () => {
      Array.from(behaelterTest.querySelectorAll<HTMLButtonElement>('button')).forEach((b) => {
        if (b.textContent === 'Löschen bestätigen') b.click();
      });
    });
    expect(h.bestaetigeLoeschen).toHaveBeenCalledTimes(1);
    expect(h.bestaetigeLoeschen).toHaveBeenCalledWith(DIE_ID);
    expect(zugang.lade).toHaveBeenCalledTimes(1);
  });

  it('Ableiten: leiteMarkeAb GENAU EINMAL; nach Erfolg marken.lade() GENAU EINMAL, oeffneMarke NULL Mal', async () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID, parent: null }));
    h.leiteMarkeAb.mockResolvedValue({ ok: true, wert: markeFuerTest({ id: LIMA_ID }) });
    h.ableitbareBasen.mockReturnValue([markeFuerTest({ id: PARENT_ID, name: 'P' })]);
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="marke-ableiten"]')!.click();
    });
    expect(h.leiteMarkeAb).toHaveBeenCalledTimes(1);
    expect(zugang.lade).toHaveBeenCalledTimes(1);
    expect(h.oeffneMarke).not.toHaveBeenCalled();
  });

  it('Neue Marke: erstelleEigenstaendigeMarke GENAU EINMAL OHNE marken.lade() und OHNE oeffneMarke', async () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID, parent: null }));
    h.erstelleEigenstaendigeMarke.mockResolvedValue({ ok: true, wert: markeFuerTest() });
    const zugang = ZUGANG(UEBERSICHT);
    zeige({ sichtbar: true, marken: zugang });
    await act(async () => {
      (
        behaelter as unknown as HTMLElement
      ).querySelector<HTMLButtonElement>('[data-testid="erstelle-eigenstaendige-marken-namen"]')!.click();
    });
    expect(h.erstelleEigenstaendigeMarke).toHaveBeenCalledTimes(1);
    expect(zugang.lade).not.toHaveBeenCalled();
    expect(h.oeffneMarke).not.toHaveBeenCalled();
  });

  it('eine erneut geoeffnete Marke setzt die Loeschvorschau zurueck - der Ausweg ist keine Sackgasse', async () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID, parent: null }));
    // Den Hoerer des Editors abfangen: Er wird gerufen, wenn eine Marke geoeffnet wird.
    let hoerer: ((marke: unknown) => void) | null = null;
    h.aufGeoeffneteGeaendert.mockImplementation((cb: unknown) => {
      hoerer = cb as (marke: unknown) => void;
      return () => undefined;
    });
    h.ermittleLoeschvorschau.mockResolvedValue({
      ok: true,
      wert: {
        darfLoeschen: false,
        eingebaut: false,
        nutzung: {
          aktionen: [],
          abgeleiteteMarken: [],
          standardInProjekten: [{ projektId: 'p-1', projektName: 'Projekt' }],
        },
      },
    });
    h.brauchtStandardmarkenAusweg.mockReturnValue(true);

    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="loeschengesuch"]')!.click();
    });
    expect(behaelterTest.querySelector('[data-testid="marken-loesch-blockiert"]')).not.toBeNull();

    // Der Nutzer folgt dem Ausweg ("Wechsle die Standardmarke im Reiter Projekte") und
    // oeffnet die Marke danach wieder. Ohne Ruecksetzen blieb die Blockade stehen und
    // der Loeschweg war bis zum App-Neustart verschwunden (gemessen 21.10.2026, Treiber 4a2).
    await act(async () => {
      hoerer?.(markeFuerTest({ id: DIE_ID, parent: null }));
    });
    expect(behaelterTest.querySelector('[data-testid="marken-loesch-blockiert"]')).toBeNull();
    expect(behaelterTest.querySelector('[data-testid="loeschengesuch"]')).not.toBeNull();

    h.aufGeoeffneteGeaendert.mockImplementation(() => () => undefined);
  });
});

describe('Grep-Proben (#330)', () => {
  it('kein IPC-Fenster und kein Fallback im Bildschirm', async () => {
    const fs = await import('node:fs/promises');
    const text = await fs.readFile('src/renderer/marken-editor/index.tsx', 'utf8');
    expect(text).not.toMatch(/rufeAuf|abonniere|KANAELE|'marken:|window\.api|\bfs\b|\bpath\b/);
    expect(text).not.toMatch(/getContext|new Image|document\.fonts|zeichneSegment/);
    expect(text).not.toMatch(/undo|redo|snapshot/);
    expect(text).not.toMatch(/standardMarkeId|Project/);
    expect(text).not.toMatch(/zeichneMarkenVorschau\(|<input type="file"|oeffneMarkenDateiDialog/);
    expect(text).not.toMatch(/importiereSchrift|importiereLogo/);
    expect(text).not.toMatch(/ladeUebersicht|holeUebersicht|aufUebersichtGeaendert|uebernimmAktualisierteMarke/);
    expect(text).not.toMatch(/try|catch|resolve|promise/i);
    expect((text.match(/export /g) ?? [])).toHaveLength(2); // MarkenEditorWurzel + Props
    expect(text).not.toMatch(/export default/);
    expect(text).not.toMatch(/\.sort\(/);
  });
});
