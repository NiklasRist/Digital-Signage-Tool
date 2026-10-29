// Tests zu #166 - das Argument-Array fuer den Standbild-Zwischenclip
// (TK 9.2.6 "Standbild -> Clip", 9.2.4 Ausgabe-Profil, 9.2.2).
//
// WAS HIER PRUEFBAR IST: alles ausser einem. `baueStandbildArgumente` ist eine
// reine Funktion; Reihenfolge, Vollstaendigkeit, Plaetze und saemtliche
// Fehlerpfade haengen an nichts als dem zurueckgegebenen Array. Es startet also
// KEIN ffmpeg.
//
// NICHT hier, sondern in tests/integration/standbild-echt.spec.ts (#11): dass der
// Lauf VON SELBST ENDET und die Datei exakt `frames` Bilder hat. Das kann ein
// Unit-Test grundsaetzlich nicht sagen - beide Eingaenge dieses Aufrufs sind
// unbegrenzt, und ob die Ausgabe trotzdem endet, entscheidet der echte Encoder.
//
// #161 UND #162 STEHEN HIER ALS ATTRAPPE. Das Issue verlangt es so, und es hat
// einen Grund: Geprueft werden soll, dass die vier fremden Fragmente
// UNVERAENDERT und VOLLSTAENDIG an den vorgegebenen Plaetzen landen. Mit den
// echten Flags waere das nicht zu unterscheiden von "die richtigen Flags stehen
// zufaellig irgendwo"; mit erkennbaren Platzhaltern ist Position und
// Vollstaendigkeit direkt ablesbar. Damit bleibt dieses Issue ausserdem pruefbar,
// ohne vom Inhalt jener beiden Dateien abzuhaengen.
//
// DIE TEUERSTEN FEHLER DIESER DATEI SIND RECHNERISCH UND POSITIONELL, nicht
// vertraglich - eine falsche Bildzahl und eine Option am falschen Platz sehen
// beide typrichtig aus. Deshalb pruefen die Tests unten Werte und PLAETZE, nicht
// nur Vorhandensein.
import { describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { StandbildAuftrag } from "../../src/main/ffmpeg-adapter/standbild";
import type { RenderProfile } from "../../src/shared/contracts/render-profile";

// Erkennbare Platzhalter statt echter Flags. Kein Eintrag beginnt mit einem
// Bindestrich, damit ein versehentlich mitgezaehltes Fragment in den
// Flag-Proben unten NICHT als echtes Argument durchgeht.
const VIDEO_KODIER = ["VIDEO_A", "VIDEO_B", "VIDEO_C"];
const TON_EINGANG = ["TON_EINGANG_A", "TON_EINGANG_B"];
const TON_KODIER = ["TON_KODIER_A", "TON_KODIER_B"];

const attrappe = vi.hoisted(() => ({
  baueVideoKodierArgumente: vi.fn(),
  baueStilleTonspurEingang: vi.fn(),
  baueTonspurKodierArgumente: vi.fn(),
  baueTonspurMapping: vi.fn(),
}));

vi.mock("../../src/main/ffmpeg-adapter/encoder-argumente", () => ({
  baueVideoKodierArgumente: attrappe.baueVideoKodierArgumente,
}));
vi.mock("../../src/main/ffmpeg-adapter/tonspur", () => ({
  baueStilleTonspurEingang: attrappe.baueStilleTonspurEingang,
  baueTonspurKodierArgumente: attrappe.baueTonspurKodierArgumente,
  baueTonspurMapping: attrappe.baueTonspurMapping,
}));

attrappe.baueVideoKodierArgumente.mockReturnValue(VIDEO_KODIER);
attrappe.baueStilleTonspurEingang.mockReturnValue(TON_EINGANG);
attrappe.baueTonspurKodierArgumente.mockReturnValue(TON_KODIER);
// Die einzige Attrappe, die ihr Argument sichtbar macht: Nur so ist pruefbar,
// dass der uebergebene Eingangs-Index wirklich im Ergebnis landet.
attrappe.baueTonspurMapping.mockImplementation((index: number) => [
  "TON_MAP",
  `index=${String(index)}`,
]);

const { baueStandbildArgumente } = await import("../../src/main/ffmpeg-adapter/standbild");

const KETTE = "[0:v]scale=1920:1080[v]";

/** Ein gueltiger Auftrag; jeder Test aendert nur, was er meint. */
function auftrag(aenderung: Partial<StandbildAuftrag> = {}): StandbildAuftrag {
  return {
    bildPfad: "/t1/seg_0003.png",
    frames: 300,
    filterkette: KETTE,
    zielPfad: "/t1/seg_0003.mp4",
    ...aenderung,
  };
}

/** Das Array eines gelungenen Aufrufs - der Fehlerfall waere ein Testfehler. */
function argumente(
  aenderung: Partial<StandbildAuftrag> = {},
  profil: RenderProfile = RENDER_PROFILE,
): string[] {
  const ergebnis = baueStandbildArgumente(auftrag(aenderung), profil);
  if (!ergebnis.ok) throw new Error(`unerwartet abgewiesen: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/** Die Stelle eines Teil-Arrays im Ergebnis, oder -1. */
function stelleVon(ganzes: readonly string[], teil: readonly string[]): number {
  for (let i = 0; i + teil.length <= ganzes.length; i += 1) {
    if (teil.every((wert, k) => ganzes[i + k] === wert)) return i;
  }
  return -1;
}

describe("baueStandbildArgumente - Aufbau und Reihenfolge", () => {
  it("liefert die tabellierten Argumente in genau der vorgegebenen Reihenfolge", () => {
    // Das VOLLSTAENDIGE Array, ausgeschrieben. Ein Vergleich auf Gleichheit statt
    // einzelner "enthaelt"-Proben: Nur so faellt ein zusaetzliches, ein fehlendes
    // UND ein verschobenes Argument auf - und genau das Verschieben ist der
    // Fehler, den dieses Modul fuerchtet.
    expect(argumente()).toEqual([
      "-loop",
      "1",
      "-framerate",
      "30",
      "-i",
      "/t1/seg_0003.png",
      ...TON_EINGANG,
      "-filter_complex",
      KETTE,
      "-map",
      "[v]",
      "TON_MAP",
      "index=1",
      "-frames:v",
      "300",
      ...VIDEO_KODIER,
      ...TON_KODIER,
      "-map_metadata",
      "-1",
      "-f",
      "mp4",
      "/t1/seg_0003.mp4",
    ]);
  });

  it("stellt -loop und -framerate VOR den Bild-Eingang, nicht dahinter", () => {
    // Der positionelle Kern: Beide sind Eingangs-Optionen und gehoeren zu dem
    // `-i`, das ihnen FOLGT. Hinter `-i <bildPfad>` gestellt gehoerten sie zum
    // Tonspur-Eingang; gemessen bricht ffmpeg dann mit "Option loop not found" ab.
    const a = argumente();
    expect(a.indexOf("-loop")).toBeLessThan(a.indexOf("-i"));
    expect(a.indexOf("-framerate")).toBeLessThan(a.indexOf("-i"));
    expect(a.indexOf("-i")).toBeLessThan(stelleVon(a, TON_EINGANG));
  });

  it("haengt den Tonspur-Eingang als LETZTEN Eingang an", () => {
    // Damit ist das Standbild immer Eingang 0 und die Label-Konvention der
    // Filterketten ([0:v] die Bildquelle) bleibt gueltig.
    const a = argumente();
    expect(stelleVon(a, TON_EINGANG)).toBeGreaterThan(a.indexOf("/t1/seg_0003.png"));
    expect(a.indexOf("-i", a.indexOf("-i") + 1)).toBe(-1);
  });

  it("setzt den Zielpfad als letztes Element", () => {
    expect(argumente().at(-1)).toBe("/t1/seg_0003.mp4");
  });

  it("traegt in -frames:v exakt auftrag.frames", () => {
    const a = argumente({ frames: 300 });
    expect(a[a.indexOf("-frames:v") + 1]).toBe("300");
    // Und die beiden Enden des zulaessigen Dauerbereichs, 10 s und 45 s bei
    // 30 fps: Die Zahl wird eingesetzt, nicht gerechnet.
    expect(argumente({ frames: 1350 })[argumente({ frames: 1350 }).indexOf("-frames:v") + 1]).toBe(
      "1350",
    );
    expect(argumente({ frames: 1 })[argumente({ frames: 1 }).indexOf("-frames:v") + 1]).toBe("1");
  });

  it("nimmt Eingangs-Bildrate und Container aus dem Profil", () => {
    // RENDER_PROFILE fuehrt 30 fps und `mp4`; mit diesen beiden Werten allein
    // waere ein hingeschriebenes Literal von einem gelesenen Wert nicht zu
    // unterscheiden. 25 und `mov` sind absichtlich andere Werte.
    const profil = { ...RENDER_PROFILE, fps: 25, container: "mov" } as unknown as RenderProfile;
    const a = argumente({}, profil);
    expect(a[a.indexOf("-framerate") + 1]).toBe("25");
    expect(a[a.indexOf("-f") + 1]).toBe("mov");
    // Der Zielpfad bleibt das letzte Element - `-f` aendert daran nichts.
    expect(a.at(-1)).toBe("/t1/seg_0003.mp4");
  });

  it("hat genau zwei -map-Argumente, Video zuerst, Ton mit Eingangs-Index 1", () => {
    const a = argumente();
    const maps = a.filter((wert) => wert === "-map" || wert === "TON_MAP");
    expect(maps).toEqual(["-map", "TON_MAP"]);
    expect(a[a.indexOf("-map") + 1]).toBe("[v]");
    // Der Index ist 1, weil der Tonspur-Eingang der LETZTE und hier der zweite
    // Eingang ist. Geprueft wird der ARGUMENTWERT der Attrappe, nicht nur ihr
    // Ergebnis - eine fest verdrahtete "1" im Ergebnis waere sonst nicht von
    // einem richtig berechneten Index zu unterscheiden.
    expect(attrappe.baueTonspurMapping).toHaveBeenCalledWith(1);
    expect(stelleVon(a, ["TON_MAP", "index=1"])).toBe(a.indexOf("-map") + 2);
  });

  it("enthaelt -map_metadata mit dem Wert -1", () => {
    const a = argumente();
    expect(a[a.indexOf("-map_metadata") + 1]).toBe("-1");
  });

  it("uebernimmt die vier fremden Fragmente unveraendert, vollstaendig und an ihrem Platz", () => {
    const a = argumente();
    const eingang = stelleVon(a, TON_EINGANG);
    const mapping = stelleVon(a, ["TON_MAP", "index=1"]);
    const video = stelleVon(a, VIDEO_KODIER);
    const ton = stelleVon(a, TON_KODIER);

    // Vollstaendig: jedes Fragment als zusammenhaengender Block gefunden.
    for (const stelle of [eingang, mapping, video, ton]) expect(stelle).toBeGreaterThan(-1);

    // Unveraendert: kein Element eines Fragments taucht ein zweites Mal auf, es
    // wurde also keins gefiltert und keins verdoppelt.
    for (const wert of [...TON_EINGANG, ...VIDEO_KODIER, ...TON_KODIER]) {
      expect(a.filter((x) => x === wert)).toHaveLength(1);
    }

    // An ihrem Platz: Eingang vor der Filterkette, Mapping direkt nach `-map [v]`,
    // die beiden Kodier-Bloecke nach `-frames:v` und vor `-map_metadata`, Video
    // vor Ton.
    expect(eingang).toBeLessThan(a.indexOf("-filter_complex"));
    expect(mapping).toBe(a.indexOf("-map") + 2);
    expect(a.indexOf("-frames:v")).toBeLessThan(video);
    expect(video).toBeLessThan(ton);
    expect(ton).toBeLessThan(a.indexOf("-map_metadata"));

    // Und mit dem Profil gerufen, nicht mit eigenen Werten.
    expect(attrappe.baueVideoKodierArgumente).toHaveBeenCalledWith(RENDER_PROFILE);
    expect(attrappe.baueStilleTonspurEingang).toHaveBeenCalledWith(RENDER_PROFILE);
    expect(attrappe.baueTonspurKodierArgumente).toHaveBeenCalledWith(RENDER_PROFILE);
  });

  it("gibt jedes Argument ungequotet als EIN Element zurueck", () => {
    const bildPfad = "C:\\Users\\Max O'Neil\\Eigene Bilder\\a b.png";
    const zielPfad = "C:\\Users\\Max O'Neil\\Eigene Bilder\\seg 0003.mp4";
    const a = argumente({ bildPfad, zielPfad });

    // Der Pfad steht UNVERAENDERT als EIN Element da - kein Quoting, kein
    // Escapen. #158 startet ohne Shell; Anfuehrungszeichen wuerden Bestandteil
    // des Dateinamens.
    expect(a.filter((wert) => wert === bildPfad)).toHaveLength(1);
    expect(a.at(-1)).toBe(zielPfad);

    // Kein Element traegt umschliessende Anfuehrungszeichen - insbesondere lautet
    // das Map-Argument `[v]` und nicht `"[v]"`.
    for (const wert of a) {
      expect(wert.startsWith('"') && wert.endsWith('"')).toBe(false);
      expect(wert.startsWith("'") && wert.endsWith("'")).toBe(false);
    }
    expect(a).toContain("[v]");
    expect(a).not.toContain('"[v]"');
  });

  it("liefert bei zweimaligem Aufruf ein gleiches Array", () => {
    expect(argumente()).toEqual(argumente());
  });
});

describe("baueStandbildArgumente - Fehlerpfade", () => {
  // Alle sechs Fehlerpfade der Tabelle des Issues. Erwartet wird jedes Mal
  // derselbe Code und KEINE Wirkung - und vor allem: kein Wurf.
  const faelle: ReadonlyArray<readonly [string, Partial<StandbildAuftrag>]> = [
    ["bildPfad leer", { bildPfad: "" }],
    ["bildPfad beginnt mit Bindestrich", { bildPfad: "-i" }],
    ["bildPfad mit Zeilenumbruch", { bildPfad: "/t1/a\nb.png" }],
    ["bildPfad mit Nullzeichen", { bildPfad: "/t1/a\0b.png" }],
    ["zielPfad leer", { zielPfad: "" }],
    ["zielPfad beginnt mit Bindestrich", { zielPfad: "-y" }],
    ["zielPfad mit Zeilenumbruch", { zielPfad: "/t1/a\nb.mp4" }],
    ["zielPfad gleich bildPfad", { zielPfad: "/t1/seg_0003.png" }],
    ["frames = 0", { frames: 0 }],
    ["frames negativ", { frames: -5 }],
    ["frames nicht ganzzahlig", { frames: 1.5 }],
    ["frames NaN", { frames: Number.NaN }],
    ["frames unendlich", { frames: Number.POSITIVE_INFINITY }],
    ["filterkette leer", { filterkette: "" }],
    ["filterkette ohne [v]", { filterkette: "[0:v]scale=1920:1080[x]" }],
  ];

  for (const [name, aenderung] of faelle) {
    it(`weist ab: ${name}`, () => {
      const ergebnis = baueStandbildArgumente(auftrag(aenderung), RENDER_PROFILE);
      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.meldung).not.toBe("");
    });
  }

  it("weist ein Profil mit unbrauchbarer fps ab", () => {
    for (const fps of [0, -30, 29.97, Number.NaN, Number.POSITIVE_INFINITY]) {
      const ergebnis = baueStandbildArgumente(auftrag(), {
        ...RENDER_PROFILE,
        fps,
      } as unknown as RenderProfile);
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
  });

  it("weist einen unbrauchbaren Container ab", () => {
    // Der Formatname kommt aus dem Profil (s. Test oben) und wird deshalb
    // geprueft: Ein leerer oder mit `-` beginnender Wert waere dieselbe
    // Argument-Einschleusung, die bei den Pfaden ausgeschlossen wird.
    for (const container of ["", "-mp4", 7]) {
      const profil = { ...RENDER_PROFILE, container } as unknown as RenderProfile;
      const ergebnis = baueStandbildArgumente(auftrag(), profil);
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
  });

  it("wirft bei keiner Eingabe - auch nicht bei fehlenden Feldern (TK 9.1.1)", () => {
    const boesartig: unknown[] = [
      undefined,
      null,
      {},
      { bildPfad: 1, frames: "300", filterkette: null, zielPfad: [] },
    ];
    for (const eingabe of boesartig) {
      expect(() =>
        baueStandbildArgumente(eingabe as StandbildAuftrag, RENDER_PROFILE),
      ).not.toThrow();
      expect(baueStandbildArgumente(eingabe as StandbildAuftrag, RENDER_PROFILE).ok).toBe(false);
      expect(() =>
        baueStandbildArgumente(auftrag(), eingabe as RenderProfile),
      ).not.toThrow();
    }
  });
});
