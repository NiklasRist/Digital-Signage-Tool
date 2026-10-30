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
  MarkenVorschau: vi.fn(() => null),
  findeVorschauVorlage: vi.fn((): unknown => null),
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
  SCHRIFT_ROLLEN: ['headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett'],
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
// Die Live-Vorschau ist ein eigener Baustein (A1, 22.10.2026); hier wird nur geprueft,
// dass die Wurzel ihn mit der geoeffneten Marke und dem Vorlagen-Zugang versorgt.
vi.mock('../../src/renderer/marken-editor/vorschau-flaeche', () => ({
  MarkenVorschau: h.MarkenVorschau,
  findeVorschauVorlage: h.findeVorschauVorlage,
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
// #449: Die Elemente kommen aus der VORSCHAU-VORLAGE. Ohne sie gaebe es nichts zu klicken -
// deshalb liefert die Vorlagen-Sicht hier die eingebaute „Vollbild" (Ausschnitt).
const VORLAGE_VOLLBILD = {
  id: 'vollbild', name: 'Vollbild', höhe: null, parent: null, eingebaut: true,
  zonen: [
    { id: 'hintergrund', rolle: 'fest', bindung: null, rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 }, ausrichtung: { horizontal: 'links', vertikal: 'oben' }, wennLeer: 'leer', deko: { füllungFarbRolle: 'flaecheDunkel' } },
    { id: 'motiv', rolle: 'frei', bindung: 'bild', rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 }, ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' }, wennLeer: 'leer', bild: { einpassung: 'cover' } },
    { id: 'scrim', rolle: 'fest', bindung: null, rahmen: { x: 0, y: 432, breite: 1920, höhe: 648 }, ausrichtung: { horizontal: 'links', vertikal: 'oben' }, wennLeer: 'leer', deko: { verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' } } },
    { id: 'logo', rolle: 'fest', bindung: 'logo', rahmen: { x: 96, y: 54, breite: 420, höhe: 120 }, ausrichtung: { horizontal: 'links', vertikal: 'mitte' }, wennLeer: 'leer', bild: { einpassung: 'contain' } },
    { id: 'ueberschrift', rolle: 'frei', bindung: 'titel', rahmen: { x: 96, y: 640, breite: 1150, höhe: 190 }, ausrichtung: { horizontal: 'links', vertikal: 'unten' }, wennLeer: 'leer', text: { schriftRolle: 'headlinePlakativ', farbRolle: 'textAufDunkel', größeMax: 96, größeMin: 56, maxZeilen: 2 } },
    { id: 'preis', rolle: 'frei', bindung: 'preis', rahmen: { x: 1300, y: 660, breite: 524, höhe: 150 }, ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' }, wennLeer: 'ausblenden', text: { schriftRolle: 'headlinePlakativ', farbRolle: 'textAufDunkel', größeMax: 84, größeMin: 48, maxZeilen: 1 }, deko: { füllungFarbRolle: 'akzent', radius: 40 } },
    { id: 'cta', rolle: 'frei', bindung: 'cta', rahmen: { x: 1300, y: 830, breite: 524, höhe: 120 }, ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' }, wennLeer: 'ausblenden', text: { schriftRolle: 'headlinePlakativ', farbRolle: 'textAufHell', größeMax: 56, größeMin: 36, maxZeilen: 1 }, deko: { füllungFarbRolle: 'flaecheHell', radius: 40 } },
  ],
};

const VORLAGEN = {
  lade: vi.fn(() => Promise.resolve({ ok: true, wert: { nutzbare: [], verwaisteArbeitskopien: [] } })),
  hole: vi.fn(() => ({ nutzbare: [{ vorlage: VORLAGE_VOLLBILD }], verwaisteArbeitskopien: [] })),
  aufGeaendert: vi.fn(() => () => undefined),
};

let behaelter: HTMLDivElement | null = null;
let wurzel: Root | null = null;

beforeEach(() => {
  behaelter = document.createElement('div');
  document.body.appendChild(behaelter);
  // Aufrufzählungen isolieren - jede Testprobe zählt nur ihre eigenen Rufe.
  h.oeffneMarke.mockClear();
  // #449: Das Vorschau-Doppel zeigt die Elemente als Knoepfe; der Klick oeffnet die Box,
  // die die WURZEL rendert (deshalb genuegt ein Doppel ohne Zeichenweg).
  h.findeVorschauVorlage.mockReturnValue(VORLAGE_VOLLBILD);
  (h.MarkenVorschau as unknown as { mockImplementation: (f: unknown) => void }).mockImplementation((p: { elemente?: Array<{ id: string; titel: string }>; aufElement?: (id: string) => void }) =>
    createElement(
      'div',
      { 'data-testid': 'vorschau-doppel' },
      ...(p.elemente ?? []).map((element) =>
        createElement(
          'button',
          { key: element.id, 'data-testid': `element-${element.id}`, onClick: () => p.aufElement?.(element.id) },
          element.titel,
        ),
      ),
    ),
  );
});

/** Oeffnet die Box eines Elements ueber das Vorschau-Doppel (#449). */
function oeffne(behaelterTest: HTMLElement, id: string): void {
  const knopf = behaelterTest.querySelector<HTMLButtonElement>(`[data-testid="element-${id}"]`);
  if (knopf === null) throw new Error(`Element ${id} nicht im Doppel`);
  act(() => knopf.click());
}

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
      createElement(MarkenEditorWurzel, { vorlagen: VORLAGEN, ...props } as never) as ReactElement,
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

  it('die Live-Vorschau bekommt die geoeffnete Marke und den Vorlagen-Zugang (A1, 22.10.2026)', () => {
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({ id: DIE_ID }));
    const zugang = ZUGANG(UEBERSICHT);
    zeige({ sichtbar: true, marken: zugang });
    expect(h.MarkenVorschau).toHaveBeenCalled();
    const ruf = h.MarkenVorschau.mock.calls[h.MarkenVorschau.mock.calls.length - 1] as unknown as [
      { marke: Marke; vorlagen: unknown },
    ];
    expect(ruf[0].marke.id).toBe(DIE_ID);
    expect(ruf[0].vorlagen).toBe(VORLAGEN);
    h.holeGeoeffnete.mockReturnValue(null);
  });

  it('ohne geoeffnete Marke bekommt die Vorschau marke=null', () => {
    h.holeGeoeffnete.mockReturnValue(null);
    const zugang = ZUGANG(UEBERSICHT);
    zeige({ sichtbar: true, marken: zugang });
    expect(h.MarkenVorschau).toHaveBeenCalled();
    const ruf = h.MarkenVorschau.mock.calls[h.MarkenVorschau.mock.calls.length - 1] as unknown as [
      { marke: unknown },
    ];
    expect(ruf[0].marke).toBeNull();
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

  it('alle 13 Farb-Rollen sind erreichbar: 7 an Elementen, 6 in der Palette (#449)', () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // Die Elemente der festen Vorlage decken 7 Rollen ab; die Palette traegt die uebrigen 6.
    const palette = Array.from(behaelterTest.querySelectorAll('[data-testid^="palette-farbe-"]'));
    expect(palette).toHaveLength(6);
    // Eine der sichtbaren Rollen liegt im Preis-Element (akzent) - Box oeffnen und pruefen.
    oeffne(behaelterTest, 'preis');
    expect(behaelterTest.querySelector('[data-testid="farbe-akzent"]')).not.toBeNull();
  });

  it('KontrastWarnung mit der geöffneten Marke und schwellenwert KONTRAST_SCHWELLE (4.5)', () => {
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // Die Akzent-Rolle liegt am Preis-Element (#449).
    oeffne(behaelterTest, 'preis');
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
    oeffne(behaelterTest, 'preis');
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
    // Der Slogan (Ersatz-Logo) liegt in der Box des Logo-Elements (#449).
    oeffne(behaelterTest, 'logo');
    const schalter = behaelterTest.querySelector<HTMLInputElement>('[data-testid="slogan-aktiv"]')!;
    await act(async () => {
      schalter.click();
    });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="slogan-uebernehmen"]')!.click();
    });
    expect(h.setzeSlogan).toHaveBeenCalledTimes(1);
    expect(h.setzeSlogan).toHaveBeenCalledWith(DIE_ID, { text: 'BESTTEXT', aktiv: true });
  });

  it('Abstand: baueVorlagenHinweis VOR dem Schreiben; es heißt NULL, kein Hinweis', async () => {
    h.setzeSicherheitsabstand.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // Der Sicherheitsabstand gehoert zu keiner Zone - er liegt in der Palette (#449).
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="palette-abstand"]')!.click();
    });
    const feld = behaelterTest.querySelector<HTMLInputElement>('[data-testid="abstand-horizontal"]')!;
    fieldGetSetter(feld, '10');
    await act(async () => {
      feld.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="abstand-uebernehmen"]')!.click();
    });
    expect(h.baueVorlagenHinweis).toHaveBeenCalledTimes(1);
    expect(h.setzeSicherheitsabstand).toHaveBeenCalledWith(DIE_ID, { horizontal: 10, vertikal: 0 });
  });

  it('Import Schrift: Schaltfläche ruft waehleUndImportiereSchrift GENAU EINMAL mit (marke.id, rolle)', async () => {
    h.baueSchriftAnzeige.mockReturnValue([
      { rolle: 'headlinePlakativ', schrift: {}, importiert: false },
    ] as never);
    h.waehleUndImportiereSchrift.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    oeffne(behaelterTest, 'ueberschrift');
    expect((document.body.textContent as string).includes('LIZENZ')).toBe(true);
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="import-schrift-headlinePlakativ"]')!.click();
    });
    expect(h.waehleUndImportiereSchrift).toHaveBeenCalledTimes(1);
    expect(h.waehleUndImportiereSchrift).toHaveBeenCalledWith(DIE_ID, 'headlinePlakativ');
  });

  it('der Abbruch des Imports ({ ok: true, wert: null }) macht NICHTS', async () => {
    h.baueSchriftAnzeige.mockReturnValue([
      { rolle: 'headlinePlakativ', schrift: {}, importiert: false },
    ] as never);
    h.waehleUndImportiereSchrift.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    oeffne(behaelterTest, 'ueberschrift');
    const davor = behaelterTest.innerHTML;
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="import-schrift-headlinePlakativ"]')!.click();
    });
    expect(behaelterTest.querySelector('[data-testid="import-fehler"]')).toBeNull();
    expect((behaelterTest.innerHTML === davor).valueOf()).toBe(true);
  });

  it('Logo entfernen: entferneLogo GENAU EINMAL; HINWEIS_LOGO_ENTFERNT unverändert', async () => {
    h.entferneLogo.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    oeffne(behaelterTest, 'logo');
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
  it('abgeleitete Marke: JEDES Feld traegt eine Herkunft-Zeile aus baueHerkunftText', async () => {
    h.holeGeoeffnete.mockReturnValue(
      markeFuerTest({ id: DIE_ID, parent: PARENT_ID }),
    );
    h.leseHerkunft.mockReturnValue('eigen');

    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });
    // #449: Jede Box zeigt die Herkunft ihrer Felder - hier nacheinander alle Arten.
    const arten = new Set<string>();
    for (const id of ['preis', 'ueberschrift', 'logo']) {
      oeffne(behaelterTest, id);
      for (const zeile of Array.from(behaelterTest.querySelectorAll('[data-testid^="herkunft-"]'))) {
        arten.add(zeile.getAttribute('data-testid') ?? '');
      }
    }
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="palette-abstand"]')!.click();
    });
    for (const zeile of Array.from(behaelterTest.querySelectorAll('[data-testid^="herkunft-"]'))) {
      arten.add(zeile.getAttribute('data-testid') ?? '');
    }
    for (const art of ['herkunft-farbe', 'herkunft-schrift', 'herkunft-logo', 'herkunft-slogan', 'herkunft-sicherheit']) {
      expect(arten.has(art)).toBe(true);
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

describe('MarkenEditorWurzel (#330) - Momentaufnahmen beim Markenwechsel (Treiber 4m, 22.10.2026)', () => {
  // Beide Proben bilden ab, was der Treiber am echten Fenster gefunden hat: Der Editor
  // zeigte nach dem Oeffnen einer Marke den Stand des ERSTEN Aufbaus (Abstand 0/0 statt
  // 96/54) und behielt im Akzentfeld den Wert der VORIGEN Marke.
  it('beim Oeffnen einer Marke zeigen Abstand und Slogan deren Werte, nicht den Stand des ersten Aufbaus', async () => {
    h.holeGeoeffnete.mockReturnValue(null);
    let hoerer: ((marke: unknown) => void) | null = null;
    h.aufGeoeffneteGeaendert.mockImplementation((cb: unknown) => {
      hoerer = cb as (marke: unknown) => void;
      return () => undefined;
    });
    h.setzeSicherheitsabstand.mockResolvedValue({ ok: true, wert: null });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });

    // Beim Aufbau ist keine Marke offen - der Bereich zeigt den Leerzustand.
    expect(behaelterTest.querySelector('[data-testid="marken-offen-leer"]')).not.toBeNull();

    // Jetzt wird eine Marke mit 96/54 px und einem Slogan geoeffnet.
    h.holeGeoeffnete.mockReturnValue(markeFuerTest({
      id: PARENT_ID,
      sicherheit: { horizontal: 96, vertikal: 54 },
      slogan: { text: 'Saisonstart', aktiv: true },
    }));
    await act(async () => {
      hoerer?.(markeFuerTest({
        id: PARENT_ID,
        sicherheit: { horizontal: 96, vertikal: 54 },
        slogan: { text: 'Saisonstart', aktiv: true },
      }));
    });

    // #449: Abstand liegt in der Palette, Slogan in der Logo-Box.
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="palette-abstand"]')!.click();
    });
    expect(behaelterTest.querySelector<HTMLInputElement>('[data-testid="abstand-horizontal"]')!.value).toBe('96');
    expect(behaelterTest.querySelector<HTMLInputElement>('[data-testid="abstand-vertikal"]')!.value).toBe('54');
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="marken-box-schliessen"]')!.click();
    });
    oeffne(behaelterTest, 'logo');
    expect(behaelterTest.querySelector<HTMLInputElement>('[data-testid="slogan-text"]')!.value).toBe('Saisonstart');
    expect(behaelterTest.querySelector<HTMLInputElement>('[data-testid="slogan-aktiv"]')!.checked).toBe(true);

    // Ein Klick auf "Abstand uebernehmen" schreibt jetzt den Wert DER MARK, nicht 0/0.
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="marken-box-schliessen"]')!.click();
    });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="palette-abstand"]')!.click();
    });
    await act(async () => {
      behaelterTest.querySelector<HTMLButtonElement>('[data-testid="abstand-uebernehmen"]')!.click();
    });
    expect(h.setzeSicherheitsabstand).toHaveBeenCalledWith(PARENT_ID, { horizontal: 96, vertikal: 54 });

    h.aufGeoeffneteGeaendert.mockImplementation(() => () => undefined);
    h.holeGeoeffnete.mockReturnValue(null);
  });

  it('beim Wechsel der Marke zeigen die Farbfelder den Wert der NEUEN Marke', async () => {
    h.holeGeoeffnete.mockReturnValue(
      markeFuerTest({ id: DIE_ID, farben: { akzent: '#808080' } as never }),
    );
    let hoerer: ((marke: unknown) => void) | null = null;
    h.aufGeoeffneteGeaendert.mockImplementation((cb: unknown) => {
      hoerer = cb as (marke: unknown) => void;
      return () => undefined;
    });
    h.setzeFarbe.mockResolvedValue({ ok: true, wert: markeFuerTest() });
    const zugang = ZUGANG(UEBERSICHT);
    const behaelterTest = zeige({ sichtbar: true, marken: zugang });

    // Der Nutzer bearbeitet das Akzentfeld - dadurch ist der Wert "eigen" (dirty) und
    // ein spaeteres defaultValue allein aendert die Anzeige nicht mehr.
    oeffne(behaelterTest, 'preis');
    const feld = behaelterTest.querySelector<HTMLInputElement>('[data-testid="farbe-akzent"]')!;
    await act(async () => {
      feld.focus();
      fieldGetSetter(feld, '#123456');
      feld.blur();
    });

    // Danach wird eine ANDERE Marke mit einem anderen Akzent geoeffnet.
    const neueMarke = markeFuerTest({ id: PARENT_ID, farben: { akzent: '#FF4040' } as never });
    h.holeGeoeffnete.mockReturnValue(neueMarke);
    await act(async () => {
      hoerer?.(neueMarke);
    });

    // Der Markenwechsel schliesst die Box (boxZiel wird zurueckgesetzt) - neu oeffnen.
    oeffne(behaelterTest, 'preis');
    expect(behaelterTest.querySelector<HTMLInputElement>('[data-testid="farbe-akzent"]')!.value).toBe('#FF4040');

    h.aufGeoeffneteGeaendert.mockImplementation(() => () => undefined);
    h.holeGeoeffnete.mockReturnValue(null);
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
