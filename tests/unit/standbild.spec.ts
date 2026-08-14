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
import { readFileSync } from "node:fs";

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

// Die Abgrenzungs-Probe ueber die QUELLDATEI (Issue #166, Definition of Done).
//
// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren nennen die fremden
// Flags namentlich - das ist erwuenscht und darf die Probe nicht ausloesen.
// Dieselbe Trennung benutzen die Tests zu #161, #163, #164, #165 und #168 im
// selben Modul.
const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/standbild.ts", import.meta.url),
  "utf8",
);
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

describe("Abgrenzung - was diese Datei NICHT setzen darf", () => {
  const fremd: ReadonlyArray<readonly [string, string]> = [
    ["-y", "#158, fester Vorspann"],
    ["-hide_banner", "#158, fester Vorspann"],
    ["-nostdin", "#158, fester Vorspann"],
    ["-loglevel", "#158, fester Vorspann"],
    ["-progress", "#158 - ein zweites schriebe jede Fortschrittszeile doppelt (#160)"],
    ["-nostats", "#158, fester Vorspann"],
    ["-r", "#161, Bildrate der Ausgabe"],
    ["-fps_mode", "#161, Bildraten-Modus"],
    ["-c", "#161/#162 - und `-c copy` gehoert allein #169 (TK 9.2.6: hier wird NEU codiert)"],
    ["-c:v", "#161, Video-Encoder"],
    ["-c:a", "#162, Ton-Encoder"],
    ["-b:v", "#161, Ratensteuerung"],
    ["-crf", "#161 - und im Profil gar nicht vorgesehen"],
    ["-preset", "#161 - und im Profil gar nicht vorgesehen"],
    ["-pix_fmt", "#161, Pixelformat"],
    ["-g", "#161, GOP"],
    ["-shortest", "#162, Laengenbegrenzung der Tonspur"],
  ];

  // Geprueft wird die ZEICHENKETTEN-LITERALFORM, nicht die blosse Teilzeichenkette.
  // Grund: Ein Argument steht im Code immer als `'-r'` da, nie als `-r ` mit
  // Leerzeichen. Eine Probe auf die nackte Folge "-r" fiele umgekehrt auf jedes
  // Wort herein, das sie zufaellig enthaelt - und eine Probe auf "-r " (mit
  // Leerzeichen) faende das echte `'-r',` NIE. Beide Anfuehrungsarten, weil die
  // Datei einfache benutzt und ein spaeterer Umbau doppelte benutzen koennte.
  const literalformen = (flag: string): string[] => [`'${flag}'`, `"${flag}"`];

  for (const [flag, zustaendig] of fremd) {
    it(`setzt kein ${flag} (zustaendig: ${zustaendig})`, () => {
      for (const form of literalformen(flag)) expect(CODEZEILEN).not.toContain(form);
    });
  }

  // Diese drei koennen in keiner harmlosen Zeile vorkommen und werden deshalb
  // zusaetzlich als nackte Folge geprueft - `+faststart` und `setsar` stehen als
  // WERT eines Arguments, nicht als eigenes Literal, und `-c copy` als zwei.
  for (const [folge, zustaendig] of [
    ["+faststart", "#162 baueContainerArgumente, und die nur am concat-Lauf (#169)"],
    ["setsar", "#163, die Filterkette"],
    ["copy", "#169 - hier wird NEU codiert (TK 9.2.6)"],
  ] as const) {
    it(`setzt kein ${folge} (zustaendig: ${zustaendig})`, () => {
      expect(CODEZEILEN).not.toContain(folge);
    });
  }

  it("die Probe beisst - jedes verbotene Flag wuerde im Code gefunden", () => {
    // Gegenprobe zur Probe selbst. Ohne sie waere nicht zu sehen, ob die
    // Kommentar-Filterung oben nicht versehentlich ALLES herausfiltert und
    // saemtliche Zusicherungen leer durchlaufen. Geprueft wird jedes Flag der
    // Liste einzeln - eine Stichprobe koennte ein falsch geschriebenes Muster
    // ueberdecken.
    expect(CODEZEILEN.length).toBeGreaterThan(1000);
    for (const [flag] of fremd) {
      const verfaelscht = `${CODEZEILEN}\n      '${flag}', 'wert',`;
      expect(literalformen(flag).some((form) => verfaelscht.includes(form))).toBe(true);
    }
    // Und die Kommentarfilterung entfernt wirklich nur Kommentare: Die Zeilen mit
    // den tatsaechlich gesetzten Argumenten sind noch da.
    for (const erlaubt of ["'-loop'", "'-framerate'", "'-frames:v'", "'-map_metadata'", "'-f'"]) {
      expect(CODEZEILEN).toContain(erlaubt);
    }
  });

  it("importiert weder fs noch child_process noch ./prozess", () => {
    for (const verboten of ["fs", "child_process", "./prozess", "node:fs", "node:child_process"]) {
      expect(CODEZEILEN).not.toContain(`'${verboten}'`);
      expect(CODEZEILEN).not.toContain(`"${verboten}"`);
    }
    // Und positiv: Die Datei importiert genau die vier erlaubten Adressen.
    const importe = [...CODEZEILEN.matchAll(/from '([^']+)'/g)].map((treffer) => treffer[1]);
    expect(new Set(importe)).toEqual(
      new Set([
        "../../shared/contracts/render-profile",
        "../../shared/contracts/ergebnis",
        "./encoder-argumente",
        "./tonspur",
      ]),
    );
  });

  it("rechnet keine Sekunden in Frames um - die Rundung gehoert #174", () => {
    expect(CODEZEILEN).not.toContain("Math.round");
    expect(CODEZEILEN).not.toContain("* 30");
    expect(CODEZEILEN).not.toContain("/ 30");
  });
});
