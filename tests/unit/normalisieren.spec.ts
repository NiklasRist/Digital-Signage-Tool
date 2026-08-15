// Tests zu #177 - die WEICHE des render-service: aus EINEM RenderItem entsteht
// genau eine Zwischendatei seg_NNNN.mp4 in T1 (TK 9.2.5, 9.2.6, 9.2.8, 9.2.3).
//
// WAS HIER PRUEFBAR IST: die Auswahl der Filterkette, die Werte, die an die
// Bausteine des ffmpeg-adapter gehen, die Abbruch-Kette, die Fortschritts-Naht
// und der geschlossene Satz der Fehlerausgaenge. Es startet KEIN ffmpeg - #158,
// #163..#168 sind Attrappen.
//
// ECHT gelassen sind #174 (frames.ts), #176 + der geteilte Rechenkern
// (band-geometrie), #160 (fortschritt.ts) und `markenFarbeZuFfmpeg` (#164).
// Grund: Genau an diesen drei Naehten sitzen die Fehler, die STILL versagen -
// die Einheit des Fortschritts (0..100 gegen 0..1), die Bedeutung von
// `videoBreite` (eingepasst 1632, NICHT die Zielflaeche 1920) und die
// Frame-Rundung. Eine Attrappe wuerde die Zahl liefern, die der Test erwartet,
// und damit genau das verdecken, wonach gesucht wird.
//
// NICHT hier: ob die erzeugte Datei am Fernseher laeuft. Das kann ein Unit-Test
// grundsaetzlich nicht sagen (Warnblock `risiko:tv-ausgabe` im Issue).
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";

import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { ChildProcess } from "node:child_process";
import type { RenderItem } from "../../src/shared/contracts/render-request";
import type { NormalisierKontext } from "../../src/main/render-service/normalisieren";

// ---------------------------------------------------------------------------
// Attrappen. Nur die Bausteine, die einen Prozess starten oder eine Zeichenkette
// bauen - siehe Kopf.
// ---------------------------------------------------------------------------
const attrappe = vi.hoisted(() => ({
  loeseAssetPfad: vi.fn(),
  fuehreFfmpegAus: vi.fn(),
  baueVollbildFilter: vi.fn(),
  baueSplitFilter: vi.fn(),
  baueEinblendungFilter: vi.fn(),
  baueStandbildArgumente: vi.fn(),
  baueVideoAusschnittArgumente: vi.fn(),
  baueBandspur: vi.fn(),
}));

vi.mock("../../src/main/project-store/pfade", () => ({
  loeseAssetPfad: attrappe.loeseAssetPfad,
}));

vi.mock("../../src/main/ffmpeg-adapter/prozess", () => ({
  fuehreFfmpegAus: attrappe.fuehreFfmpegAus,
}));

vi.mock("../../src/main/ffmpeg-adapter/filter-vollbild", () => ({
  baueVollbildFilter: attrappe.baueVollbildFilter,
}));

// TEILWEISE echt: `markenFarbeZuFfmpeg` bleibt die Originalfunktion, damit der
// Test die WIRKLICHE Umrechnung sieht und nicht seine eigene Erwartung.
vi.mock("../../src/main/ffmpeg-adapter/filter-split", async (originalLaden) => {
  const echt = await originalLaden<typeof import("../../src/main/ffmpeg-adapter/filter-split")>();
  return { ...echt, baueSplitFilter: attrappe.baueSplitFilter };
});

vi.mock("../../src/main/ffmpeg-adapter/filter-einblendung", () => ({
  baueEinblendungFilter: attrappe.baueEinblendungFilter,
}));

vi.mock("../../src/main/ffmpeg-adapter/standbild", () => ({
  baueStandbildArgumente: attrappe.baueStandbildArgumente,
}));

vi.mock("../../src/main/ffmpeg-adapter/video-ausschnitt", () => ({
  baueVideoAusschnittArgumente: attrappe.baueVideoAusschnittArgumente,
}));

vi.mock("../../src/main/ffmpeg-adapter/bandspur", () => ({
  baueBandspur: attrappe.baueBandspur,
}));

const { normalisiereElement, pruefeMedienVorhanden, zwischenclipDateiname } = await import(
  "../../src/main/render-service/normalisieren"
);

const QUELLE = readFileSync(
  new URL("../../src/main/render-service/normalisieren.ts", import.meta.url),
  "utf8",
);

/** Nur die CODE-Zeilen - die Begruendungen zitieren das Issue und duerfen die Proben nicht ausloesen. */
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

// ---------------------------------------------------------------------------
// Echte Dateien fuer die Existenzpruefung (`fs.access`, nicht `fs.stat`).
// ---------------------------------------------------------------------------
const MEDIEN = mkdtempSync(path.join(tmpdir(), "norm-medien-"));
const T1 = mkdtempSync(path.join(tmpdir(), "norm-t1-"));
writeFileSync(path.join(MEDIEN, "bild.png"), "x");
writeFileSync(path.join(MEDIEN, "video.mp4"), "x");

afterAll(() => {
  rmSync(MEDIEN, { recursive: true, force: true });
  rmSync(T1, { recursive: true, force: true });
});

const FLAECHE_DUNKEL = "#2F2E2E";
const VOLLBILD_KETTE = "<vollbild>";
const SPLIT_KETTE = "<split>";
const EINBLENDUNG_KETTE = "<einblendung>";
const STANDBILD_ARGUMENTE = ["-standbild"];
const VIDEO_ARGUMENTE = ["-video"];

let prozessZaehler = 0;
/** Ein unterscheidbares Prozess-Handle. Objektidentitaet ist hier die Aussage. */
function neuerProzess(): ChildProcess {
  prozessZaehler += 1;
  return { pid: prozessZaehler } as unknown as ChildProcess;
}

let abbruch: AbortController;
let merkeProzess: ReturnType<typeof vi.fn>;
let gibProzessFrei: ReturnType<typeof vi.fn>;
let aufElementFortschritt: ReturnType<typeof vi.fn>;

function kontext(ueberschreibung: Partial<NormalisierKontext> = {}): NormalisierKontext {
  return {
    projektId: "p-1",
    arbeitsbereich: T1,
    profil: RENDER_PROFILE,
    flaecheDunkel: FLAECHE_DUNKEL,
    abbruchSignal: abbruch.signal,
    merkeProzess: merkeProzess as unknown as (kindProzess: ChildProcess) => void,
    gibProzessFrei: gibProzessFrei as unknown as (kindProzess: ChildProcess) => void,
    aufElementFortschritt: aufElementFortschritt as unknown as (anteil: number) => void,
    ...ueberschreibung,
  };
}

const SEGMENT: RenderItem = { id: "e-seg", art: "segment", dauer: 4 } as RenderItem;
const BILD: RenderItem = {
  id: "e-bild",
  art: "bild",
  medienRef: "bild.png",
  dauer: 2,
} as RenderItem;
const VIDEO_OHNE_BAND: RenderItem = {
  id: "e-vid",
  art: "video",
  medienRef: "video.mp4",
  trimStart: 0,
  trimEnde: 4,
  einblendung: null,
} as RenderItem;

/** Ein Videoelement mit Band. `höhe` traegt den Umlaut wie im Vertrag (#17). */
function videoMitBand(art: "split" | "einblendung", höhe = 162): RenderItem {
  return {
    id: "e-band",
    art: "video",
    medienRef: "video.mp4",
    trimStart: 0,
    trimEnde: 4,
    einblendung: {
      art,
      höhe,
      abschnitte: [
        { png: new Uint8Array(), dauer: 2 },
        { png: new Uint8Array(), dauer: 1 },
      ],
    },
  } as unknown as RenderItem;
}

const BAND_PNGS = { segment: null, band: ["/t1/band-0000-0000.png", "/t1/band-0000-0001.png"] };
const KEINE_PNGS = { segment: null, band: [] };

beforeEach(() => {
  vi.clearAllMocks();
  prozessZaehler = 0;
  abbruch = new AbortController();
  merkeProzess = vi.fn();
  gibProzessFrei = vi.fn();
  aufElementFortschritt = vi.fn();

  attrappe.loeseAssetPfad.mockImplementation((_projektId: string, dateiname: string) =>
    dateiname.includes("..")
      ? { ok: false, fehler: { code: "ungueltige_eingabe", meldung: "Traversal abgewiesen." } }
      : { ok: true, wert: path.join(MEDIEN, dateiname) },
  );
  attrappe.baueVollbildFilter.mockReturnValue({ ok: true, wert: VOLLBILD_KETTE });
  attrappe.baueSplitFilter.mockReturnValue({ ok: true, wert: SPLIT_KETTE });
  attrappe.baueEinblendungFilter.mockReturnValue({ ok: true, wert: EINBLENDUNG_KETTE });
  attrappe.baueStandbildArgumente.mockReturnValue({ ok: true, wert: STANDBILD_ARGUMENTE });
  attrappe.baueVideoAusschnittArgumente.mockReturnValue({ ok: true, wert: VIDEO_ARGUMENTE });

  attrappe.fuehreFfmpegAus.mockImplementation(
    async (lauf: { aufProzessStart?: (p: ChildProcess) => void }) => {
      lauf.aufProzessStart?.(neuerProzess());
      return { ok: true, wert: undefined };
    },
  );
  attrappe.baueBandspur.mockImplementation(
    async (
      _auftrag: unknown,
      _profil: unknown,
      lauf?: { aufProzessStart?: (p: ChildProcess) => void },
    ) => {
      lauf?.aufProzessStart?.(neuerProzess());
      return { ok: true, wert: undefined };
    },
  );
});

// ===========================================================================
describe("zwischenclipDateiname (#177, ENTSCHIEDEN)", () => {
  it("fuellt auf vier Stellen auf", () => {
    expect(zwischenclipDateiname(0)).toBe("seg_0000.mp4");
    expect(zwischenclipDateiname(7)).toBe("seg_0007.mp4");
    expect(zwischenclipDateiname(142)).toBe("seg_0142.mp4");
  });

  it("schneidet einen Index ab 10000 NIE ab - sonst fielen 10000 und 0000 zusammen", () => {
    expect(zwischenclipDateiname(10000)).toBe("seg_10000.mp4");
    expect(zwischenclipDateiname(12345)).toBe("seg_12345.mp4");
  });
});

describe("Grep-Proben der Definition of Done", () => {
  it("baut keinen Pfad selbst und startet keinen Prozess", () => {
    expect(CODEZEILEN).not.toContain("projects");
    expect(CODEZEILEN).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(CODEZEILEN).not.toContain("-c:v");
    expect(CODEZEILEN).not.toMatch(/\bspawn\b|\bexec\b|require\(/);
  });

  it("importiert aus node:child_process ausschliesslich den TYP (Signaturblock)", () => {
    const zeilen = CODEZEILEN.split("\n").filter((z) => z.includes("child_process"));
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toContain("import type");
  });
});

// ===========================================================================
describe("pruefeMedienVorhanden (#177)", () => {
  it("prueft video und bild, ueberspringt segment", async () => {
    const ergebnis = await pruefeMedienVorhanden([SEGMENT, BILD, VIDEO_OHNE_BAND], "p-1");
    expect(ergebnis.ok).toBe(true);
    expect(attrappe.loeseAssetPfad).toHaveBeenCalledTimes(2);
    expect(attrappe.loeseAssetPfad).toHaveBeenCalledWith("p-1", "bild.png");
    expect(attrappe.loeseAssetPfad).toHaveBeenCalledWith("p-1", "video.mp4");
  });

  it("meldet den ERSTEN fehlenden mit medium_fehlt und daten = { elementId }", async () => {
    const fehlt = { id: "e-weg", art: "bild", medienRef: "weg.png", dauer: 2 } as RenderItem;
    const zweiterFehler = { id: "e-weg2", art: "bild", medienRef: "weg2.png", dauer: 2 } as RenderItem;

    const ergebnis = await pruefeMedienVorhanden([BILD, fehlt, zweiterFehler], "p-1");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("medium_fehlt");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-weg" });
    expect(ergebnis.fehler.meldung).toContain("weg.png");
    // Abbruch beim ersten Treffer: das dritte Element wird gar nicht mehr aufgeloest.
    expect(attrappe.loeseAssetPfad).toHaveBeenCalledTimes(2);
  });

  it("reicht ungueltige_eingabe der Pfad-Autoritaet durch - OHNE daten, id in der Meldung", async () => {
    const boese = { id: "e-boese", art: "bild", medienRef: "../../config", dauer: 2 } as RenderItem;
    const ergebnis = await pruefeMedienVorhanden([boese], "p-1");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-boese");
  });

  it("ueberspringt einen unbekannten art-Wert - das Urteil faellt die Weiche", async () => {
    const fremd = { id: "e-fremd", art: "audio", medienRef: "weg.png" } as unknown as RenderItem;
    const ergebnis = await pruefeMedienVorhanden([fremd], "p-1");
    expect(ergebnis.ok).toBe(true);
    expect(attrappe.loeseAssetPfad).not.toHaveBeenCalled();
  });
});

// ===========================================================================
describe("Die fuenf Faelle der Weiche", () => {
  it("Fall 1 - segment: Vollbild-Kette auf das Segment-PNG, genau eine Datei", async () => {
    const png = "/t1/segment-0007.png";
    const ergebnis = await normalisiereElement(SEGMENT, 7, { segment: png, band: [] }, kontext());

    expect(ergebnis).toEqual({ ok: true, wert: path.join(T1, "seg_0007.mp4") });
    // Reihenfolge wie GEBAUT (#163): (hintergrund, profil) - das Issue-Zitat dreht sie um.
    expect(attrappe.baueVollbildFilter).toHaveBeenCalledWith("black", RENDER_PROFILE);
    expect(attrappe.baueStandbildArgumente).toHaveBeenCalledWith(
      {
        bildPfad: png,
        frames: 120, // dauer 4 s x 30 fps (#174)
        filterkette: VOLLBILD_KETTE,
        zielPfad: path.join(T1, "seg_0007.mp4"),
      },
      RENDER_PROFILE,
    );
    expect(attrappe.baueSplitFilter).not.toHaveBeenCalled();
    expect(attrappe.baueEinblendungFilter).not.toHaveBeenCalled();
    expect(attrappe.fuehreFfmpegAus).toHaveBeenCalledTimes(1);
  });

  it("Fall 2 - bild: derselbe Weg, der Pfad kommt aus loeseAssetPfad", async () => {
    const ergebnis = await normalisiereElement(BILD, 1, KEINE_PNGS, kontext());

    expect(ergebnis).toEqual({ ok: true, wert: path.join(T1, "seg_0001.mp4") });
    expect(attrappe.baueStandbildArgumente.mock.calls[0]?.[0]).toMatchObject({
      bildPfad: path.join(MEDIEN, "bild.png"),
      frames: 60,
    });
  });

  it("Fall 3 - video ohne Band: Vollbild, bandSpurPfad null, keine Bandspur", async () => {
    const ergebnis = await normalisiereElement(VIDEO_OHNE_BAND, 2, KEINE_PNGS, kontext());

    expect(ergebnis).toEqual({ ok: true, wert: path.join(T1, "seg_0002.mp4") });
    expect(attrappe.baueVollbildFilter).toHaveBeenCalledWith("black", RENDER_PROFILE);
    expect(attrappe.baueVideoAusschnittArgumente).toHaveBeenCalledWith(
      {
        quellPfad: path.join(MEDIEN, "video.mp4"),
        startFrame: 0,
        endFrame: 120,
        bandSpurPfad: null,
        filterkette: VOLLBILD_KETTE,
        zielPfad: path.join(T1, "seg_0002.mp4"),
      },
      RENDER_PROFILE,
    );
    expect(attrappe.baueBandspur).not.toHaveBeenCalled();
  });

  it("Fall 4 - split: EINGEPASSTE Breite 1632, nicht die Zielflaeche 1920", async () => {
    const ergebnis = await normalisiereElement(videoMitBand("split"), 3, BAND_PNGS, kontext());
    expect(ergebnis.ok).toBe(true);

    // Die Werte stammen aus der geteilten Rechnung (#239): bei H = 162 ist
    // 918 x 16/9 = 1632 und der Versatz (1920 - 1632) / 2 = 144.
    expect(attrappe.baueSplitFilter).toHaveBeenCalledWith(162, 1632, 144, "0x2F2E2E", RENDER_PROFILE);
    // Die Zielflaeche darf NIE als Videobreite herausgehen - das ist der stille Fehler.
    expect(attrappe.baueSplitFilter.mock.calls[0]?.[1]).not.toBe(RENDER_PROFILE.breite);
    expect(attrappe.baueEinblendungFilter).not.toHaveBeenCalled();
    expect(attrappe.baueVollbildFilter).not.toHaveBeenCalled();

    expect(attrappe.baueVideoAusschnittArgumente.mock.calls[0]?.[0]).toMatchObject({
      bandSpurPfad: path.join(T1, "band_0003.mp4"),
      filterkette: SPLIT_KETTE,
    });
  });

  it("Fall 5 - einblendung: Band-Kette, kein Split, keine Markenfarbe", async () => {
    const ergebnis = await normalisiereElement(videoMitBand("einblendung"), 4, BAND_PNGS, kontext());
    expect(ergebnis.ok).toBe(true);

    expect(attrappe.baueEinblendungFilter).toHaveBeenCalledWith(162, RENDER_PROFILE);
    expect(attrappe.baueSplitFilter).not.toHaveBeenCalled();
    expect(attrappe.baueVideoAusschnittArgumente.mock.calls[0]?.[0]).toMatchObject({
      filterkette: EINBLENDUNG_KETTE,
    });
  });

  it("default-Zweig: unbekannte art liefert ungueltige_eingabe OHNE daten", async () => {
    const fremd = { id: "e-fremd", art: "audio", dauer: 2 } as unknown as RenderItem;
    const ergebnis = await normalisiereElement(fremd, 0, KEINE_PNGS, kontext());

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-fremd");
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });

  it("das Argument-Array wird UNVERAENDERT durchgereicht", async () => {
    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    const lauf = attrappe.fuehreFfmpegAus.mock.calls[0]?.[0] as { argumente: readonly string[] };
    // Objektidentitaet: kein Anhaengen, kein Entfernen, kein Umsortieren, kein -progress.
    expect(lauf.argumente).toBe(STANDBILD_ARGUMENTE);
  });
});

// ===========================================================================
describe("Bandspur (#168) - drei Argumente, Laenge vom Video", () => {
  it("bekommt gesamtFrames = trimFrames(...).frames und Abschnitte in FRAMES", async () => {
    await normalisiereElement(videoMitBand("split"), 3, BAND_PNGS, kontext());

    const auftrag = attrappe.baueBandspur.mock.calls[0]?.[0] as {
      abschnitte: Array<{ pngPfad: string; frames: number }>;
      hoeheBand: number;
      gesamtFrames: number;
      sequenzPfad: string;
      zielPfad: string;
    };
    expect(auftrag.gesamtFrames).toBe(120); // trimEnde 4 s − trimStart 0 s bei 30 fps
    expect(auftrag.hoeheBand).toBe(162);
    // dauer 2 s / 1 s -> 60 / 30 Frames, NICHT Sekunden.
    expect(auftrag.abschnitte).toEqual([
      { pngPfad: BAND_PNGS.band[0], frames: 60 },
      { pngPfad: BAND_PNGS.band[1], frames: 30 },
    ]);
    expect(auftrag.sequenzPfad).toBe(path.join(T1, "bandseq_0003.mp4"));
    expect(auftrag.zielPfad).toBe(path.join(T1, "band_0003.mp4"));
  });

  it("nimmt bei GETRIMMTEM Video die Laenge, nicht endFrame", async () => {
    // Der entscheidende Fall: startFrame 30, endFrame 150, frames 120. Nur wenn
    // getrimmt wird, gehen die beiden Zahlen auseinander - ein Test mit
    // trimStart = 0 kann die Verwechslung grundsaetzlich nicht sehen.
    const getrimmt = {
      ...(videoMitBand("split") as unknown as Record<string, unknown>),
      trimStart: 1,
      trimEnde: 5,
    } as unknown as RenderItem;

    await normalisiereElement(getrimmt, 0, BAND_PNGS, kontext());

    const auftrag = attrappe.baueBandspur.mock.calls[0]?.[0] as { gesamtFrames: number };
    expect(auftrag.gesamtFrames).toBe(120);
    expect(attrappe.baueVideoAusschnittArgumente.mock.calls[0]?.[0]).toMatchObject({
      startFrame: 30,
      endFrame: 150,
    });
  });

  it("wird mit DREI Argumenten gerufen; das dritte traegt die Abbruch-Kette", async () => {
    const k = kontext();
    await normalisiereElement(videoMitBand("split"), 3, BAND_PNGS, k);

    const aufruf = attrappe.baueBandspur.mock.calls[0];
    expect(aufruf).toHaveLength(3);
    expect(aufruf?.[1]).toBe(RENDER_PROFILE);

    const lauf = aufruf?.[2] as {
      abbruchSignal?: AbortSignal;
      aufProzessStart?: (p: ChildProcess) => void;
      aufAusgabeZeile?: (z: string) => void;
    };
    // DIESELBE Abbruch-Quelle, nicht eine Kopie.
    expect(lauf.abbruchSignal).toBe(k.abbruchSignal);
    expect(typeof lauf.aufProzessStart).toBe("function");
    expect(typeof lauf.aufAusgabeZeile).toBe("function");

    // Der Rueckruf ist eine Huelle (Befund B5 der Quelldatei) - geprueft wird das
    // VERHALTEN: was hineingeht, kommt bei merkeProzess an.
    const handle = neuerProzess();
    lauf.aufProzessStart?.(handle);
    expect(merkeProzess).toHaveBeenCalledWith(handle);
  });

  it("bricht ab, wenn die Bandspur scheitert - kein Video-Aufruf danach", async () => {
    attrappe.baueBandspur.mockResolvedValue({
      ok: false,
      fehler: { code: "ffmpeg_fehler", meldung: "Encoder weg." },
    });

    const ergebnis = await normalisiereElement(videoMitBand("split"), 3, BAND_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-band");
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });
});

// ===========================================================================
describe("Abbruch-Kette (#159/#179)", () => {
  it("haengt abbruchSignal und aufProzessStart an JEDEN Lauf", async () => {
    const k = kontext();
    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, k);

    const lauf = attrappe.fuehreFfmpegAus.mock.calls[0]?.[0] as {
      abbruchSignal?: AbortSignal;
      aufProzessStart?: unknown;
    };
    expect(lauf.abbruchSignal).toBe(k.abbruchSignal);
    expect(typeof lauf.aufProzessStart).toBe("function");
  });

  it("gibt das Handle nach dem Lauf wieder frei - mit DEMSELBEN Wert", async () => {
    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());

    expect(merkeProzess).toHaveBeenCalledTimes(1);
    expect(gibProzessFrei).toHaveBeenCalledTimes(1);
    expect(gibProzessFrei.mock.calls[0]?.[0]).toBe(merkeProzess.mock.calls[0]?.[0]);
  });

  it("gibt auch im Fehlerfall frei - Adapter mit Wurf", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(
      (lauf: { aufProzessStart?: (p: ChildProcess) => void }) => {
        lauf.aufProzessStart?.(neuerProzess());
        throw new Error("Adapter geplatzt.");
      },
    );

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    expect(gibProzessFrei).toHaveBeenCalledTimes(1);
    expect(gibProzessFrei.mock.calls[0]?.[0]).toBe(merkeProzess.mock.calls[0]?.[0]);
  });

  it("gibt bei Band den ERSTEN Prozess frei, bevor der zweite angemeldet wird", async () => {
    const reihenfolge: string[] = [];
    merkeProzess.mockImplementation(() => reihenfolge.push("merke"));
    gibProzessFrei.mockImplementation(() => reihenfolge.push("frei"));

    await normalisiereElement(videoMitBand("split"), 3, BAND_PNGS, kontext());

    // Bandspur-Lauf, Freigabe, Video-Lauf, Freigabe - nie zwei gleichzeitig.
    expect(reihenfolge).toEqual(["merke", "frei", "merke", "frei"]);
  });
});

// ===========================================================================
describe("Fortschritts-Naht (#160 -> #178): 0..100 wird zu 0..1", () => {
  it("teilt durch 100 - der halbe Lauf meldet 0.5, nicht 50", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(
      async (lauf: {
        aufProzessStart?: (p: ChildProcess) => void;
        aufAusgabeZeile?: (z: string) => void;
      }) => {
        lauf.aufProzessStart?.(neuerProzess());
        // Solldauer dieses Aufrufs: 120 Frames / 30 fps = 4 s. 2 s sind die Haelfte.
        lauf.aufAusgabeZeile?.("out_time_us=2000000");
        return { ok: true, wert: undefined };
      },
    );

    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());

    expect(aufElementFortschritt).toHaveBeenCalledTimes(1);
    expect(aufElementFortschritt).toHaveBeenCalledWith(0.5);
  });

  it("meldet am Ende 1 und niemals mehr", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(
      async (lauf: {
        aufProzessStart?: (p: ChildProcess) => void;
        aufAusgabeZeile?: (z: string) => void;
      }) => {
        lauf.aufProzessStart?.(neuerProzess());
        lauf.aufAusgabeZeile?.("out_time_us=99000000"); // weit ueber die Solldauer
        lauf.aufAusgabeZeile?.("progress=end");
        return { ok: true, wert: undefined };
      },
    );

    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());

    const werte = aufElementFortschritt.mock.calls.map((c) => c[0] as number);
    expect(werte.length).toBeGreaterThan(0);
    for (const wert of werte) {
      expect(wert).toBeGreaterThanOrEqual(0);
      expect(wert).toBeLessThanOrEqual(1);
    }
    expect(werte.at(-1)).toBe(1);
  });

  it("ignoriert Zeilen ohne Fortschritt", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(
      async (lauf: {
        aufProzessStart?: (p: ChildProcess) => void;
        aufAusgabeZeile?: (z: string) => void;
      }) => {
        lauf.aufProzessStart?.(neuerProzess());
        lauf.aufAusgabeZeile?.("irgendwas ohne Gleichheitszeichen");
        return { ok: true, wert: undefined };
      },
    );

    await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(aufElementFortschritt).not.toHaveBeenCalled();
  });
});

// ===========================================================================
describe("Fehlerpfade - daten NUR bei medium_fehlt und ungueltiges_element", () => {
  it("segment ohne PNG-Pfad: ungueltiges_element MIT daten", async () => {
    const ergebnis = await normalisiereElement(SEGMENT, 0, KEINE_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-seg" });
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });

  it("segment mit LEEREM PNG-Pfad: ungueltiges_element - eine leere Zeichenkette ist kein Pfad", async () => {
    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-seg" });
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });

  it("Band-Abschnitt mit LEEREM PNG-Pfad: ungueltiges_element", async () => {
    const ergebnis = await normalisiereElement(
      videoMitBand("split"),
      0,
      { segment: null, band: ["/t1/band-0000-0000.png", ""] },
      kontext(),
    );
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-band" });
    expect(attrappe.baueBandspur).not.toHaveBeenCalled();
  });

  it("zu wenige Band-PNGs: ungueltiges_element MIT daten", async () => {
    const ergebnis = await normalisiereElement(videoMitBand("split"), 0, {
      segment: null,
      band: ["/t1/band-0000-0000.png"],
    }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-band" });
    expect(attrappe.baueBandspur).not.toHaveBeenCalled();
  });

  it("Medium zwischenzeitlich verschwunden: medium_fehlt MIT daten", async () => {
    const weg = { id: "e-weg", art: "bild", medienRef: "weg.png", dauer: 2 } as RenderItem;
    const ergebnis = await normalisiereElement(weg, 0, KEINE_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("medium_fehlt");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-weg" });
  });

  it("Traversal: ungueltige_eingabe OHNE daten, id in der Meldung", async () => {
    const boese = { id: "e-boese", art: "bild", medienRef: "../../x", dauer: 2 } as RenderItem;
    const ergebnis = await normalisiereElement(boese, 0, KEINE_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-boese");
  });

  it("ffmpeg_fehler: OHNE daten, id in der Meldung, Adapter-Meldung uebernommen", async () => {
    attrappe.fuehreFfmpegAus.mockResolvedValue({
      ok: false,
      fehler: { code: "ffmpeg_fehler", meldung: "Unknown encoder." },
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-seg");
    expect(ergebnis.fehler.meldung).toContain("Unknown encoder.");
  });

  it("ffmpeg_abgebrochen wird zu ffmpeg_fehler - der Code wird NICHT erfunden", async () => {
    attrappe.fuehreFfmpegAus.mockResolvedValue({
      ok: false,
      fehler: { code: "ffmpeg_abgebrochen", meldung: "Abbruch." },
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("e-seg");
  });

  it("ENOSPC wird kein_platz, OHNE daten, mit dem Arbeitsbereich in der Meldung", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(() => {
      throw Object.assign(new Error("no space"), { code: "ENOSPC" });
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_platz");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain(T1);
    expect(ergebnis.fehler.meldung).toContain("e-seg");
  });

  it("jeder andere Systemfehler wird speicher_fehler, OHNE daten", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(() => {
      throw Object.assign(new Error("kein Zugriff"), { code: "EACCES" });
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).toContain("EACCES");
  });

  it("eine Ausnahme ohne Systemcode wird unbekannter_fehler - kein throw nach draussen", async () => {
    attrappe.fuehreFfmpegAus.mockImplementation(() => {
      throw new Error("etwas Unerwartetes");
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(ergebnis.fehler.meldung).not.toContain("at ");
  });

  it("Codes fremder Bausteine kommen UNVERAENDERT durch (#174: Trim)", async () => {
    const kaputt = {
      id: "e-trim",
      art: "video",
      medienRef: "video.mp4",
      trimStart: 3,
      trimEnde: 1,
      einblendung: null,
    } as unknown as RenderItem;

    const ergebnis = await normalisiereElement(kaputt, 0, KEINE_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-trim" });
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });

  it("Codes fremder Bausteine kommen UNVERAENDERT durch (#176: ungerade Bandhoehe)", async () => {
    const ergebnis = await normalisiereElement(videoMitBand("split", 161), 0, BAND_PNGS, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltiges_element");
    expect(ergebnis.fehler.daten).toEqual({ elementId: "e-band" });
    expect(attrappe.baueBandspur).not.toHaveBeenCalled();
  });

  it("ein scheiternder Filter-Baustein bricht vor dem Prozessstart ab", async () => {
    attrappe.baueVollbildFilter.mockReturnValue({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "Profil kaputt." },
    });

    const ergebnis = await normalisiereElement(SEGMENT, 0, { segment: "/t1/s.png", band: [] }, kontext());
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(ergebnis.fehler.daten).toBeUndefined();
    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
  });

  it("ein fehlender Arbeitsbereich liefert ungueltige_eingabe statt seg_undefined.mp4", async () => {
    const ergebnis = await normalisiereElement(
      SEGMENT,
      0,
      { segment: "/t1/s.png", band: [] },
      kontext({ arbeitsbereich: "" }),
    );
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("ein unbrauchbarer Index liefert ungueltige_eingabe statt seg_NaN.mp4", async () => {
    const ergebnis = await normalisiereElement(
      SEGMENT,
      Number.NaN,
      { segment: "/t1/s.png", band: [] },
      kontext(),
    );
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });
});

// ===========================================================================
describe("Der Kontext wird nicht veraendert", () => {
  it("laesst profil und flaecheDunkel unberuehrt", async () => {
    const k = kontext();
    const vorher = JSON.stringify(k.profil);
    await normalisiereElement(videoMitBand("split"), 0, BAND_PNGS, k);

    expect(JSON.stringify(k.profil)).toBe(vorher);
    expect(k.profil).toBe(RENDER_PROFILE);
    expect(k.flaecheDunkel).toBe(FLAECHE_DUNKEL);
  });
});
