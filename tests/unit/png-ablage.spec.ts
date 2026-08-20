import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { RenderItem } from "../../src/shared/contracts/render-request";

// Unit-Test zu #175.
//
// DIESE TESTS SCHREIBEN AUF EINE ECHTE PLATTE, und zwar mit Absicht. Die Aussage
// dieser Datei ist nicht "writeFile wurde mit den richtigen Argumenten gerufen",
// sondern "die Datei auf der Platte enthaelt GENAU die uebergebenen Bytes". Genau
// dazwischen sitzt der teuerste Fehlgriff des Issues: Ein `Uint8Array`, der nur ein
// Ausschnitt eines groesseren Speicherblocks ist, wird bei falschem Schreiben um
// Fremdbytes ergaenzt - eine Attrappe wuerde das nie zeigen, weil sie denselben
// Puffer zurueckreicht, den sie bekommen hat.
//
// Attrappen kommen nur dort zum Einsatz, wo sich der Zustand nicht herstellen laesst:
// eine volle Platte (`ENOSPC`), ein fehlendes Schreibrecht (`EACCES`), das Zaehlen der
// Schreibversuche und der Nachweis, dass sie einander nicht ueberlappen.
const attrappe = vi.hoisted(() => ({
  writeFile: null as ((pfad: string, daten: Uint8Array) => Promise<void>) | null,
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    writeFile: vi.fn((pfad: string, daten: Uint8Array) =>
      attrappe.writeFile === null ? echt.writeFile(pfad, daten) : attrappe.writeFile(pfad, daten),
    ),
  };
});

const { writeFile } = await import("node:fs/promises");
const QUELLE = path.join(__dirname, "../../src/main/render-service/png-ablage.ts");
const { bandDateiname, legePngsAb, segmentPngDateiname } = await import(
  "../../src/main/render-service/png-ablage"
);

const WURZEL = mkdtempSync(path.join(os.tmpdir(), "ds-png-ablage-"));
let bereich = "";

/** Ein erkennbarer Puffer - der Inhalt wird spaeter Byte fuer Byte verglichen. */
function pngBytes(fuellung: number, laenge = 64): Uint8Array {
  const bytes = new Uint8Array(laenge);
  bytes.fill(fuellung);
  return bytes;
}

function segment(id: string, png: Uint8Array): RenderItem {
  return { id, art: "segment", png, dauer: 10 };
}

function video(id: string, abschnitte: Uint8Array[] | null): RenderItem {
  return {
    id,
    art: "video",
    medienRef: "media/clip.mp4",
    trimStart: 0,
    trimEnde: 5,
    einblendung:
      abschnitte === null
        ? null
        : {
            art: "einblendung",
            höhe: 162,
            bandVorlageId: "band-1",
            abschnitte: abschnitte.map((png) => ({ png, dauer: 5 })),
          },
  };
}

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`writeFile ${code}`), { code });
}

beforeEach(() => {
  attrappe.writeFile = null;
  vi.mocked(writeFile).mockClear();
  bereich = mkdtempSync(path.join(WURZEL, "reel-"));
});

afterAll(() => {
  rmSync(WURZEL, { recursive: true, force: true });
});

describe("legePngsAb (#175) legt genau die Pixel tragenden Elemente ab", () => {
  it("schreibt fuer [segment, video, video-mit-2-Abschnitten] genau drei Dateien", async () => {
    const elemente = [
      segment("a", pngBytes(0x11)),
      video("b", null),
      video("c", [pngBytes(0x22), pngBytes(0x33)]),
    ];

    const ergebnis = await legePngsAb(bereich, elemente);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    // Index-parallel zur Liste - beide Felder haben DREI Eintraege, obwohl nur zwei
    // Elemente Pixel tragen. Ohne das muesste jeder Aufrufer selbst umrechnen.
    expect(ergebnis.wert.segmentPngs).toEqual([
      path.join(bereich, "segment-0000.png"),
      null,
      null,
    ]);
    expect(ergebnis.wert.bandPngs).toEqual([
      [],
      [],
      [path.join(bereich, "band-0002-0000.png"), path.join(bereich, "band-0002-0001.png")],
    ]);

    // Und der Beweis auf der Platte: drei Dateien, flach, kein Unterordner.
    const eintraege = readdirSync(bereich, { withFileTypes: true });
    expect(eintraege.map((e) => e.name).sort()).toEqual([
      "band-0002-0000.png",
      "band-0002-0001.png",
      "segment-0000.png",
    ]);
    expect(eintraege.every((e) => e.isFile())).toBe(true);
  });

  it("schreibt fuer eine leere Liste nichts und liefert zwei leere Felder", async () => {
    const ergebnis = await legePngsAb(bereich, []);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.wert.segmentPngs).toEqual([]);
    expect(ergebnis.wert.bandPngs).toEqual([]);
    expect(writeFile).not.toHaveBeenCalled();
    expect(readdirSync(bereich)).toEqual([]);
  });

  it("gibt zwei Segmenten verschiedene Dateien, statt eines zu ueberschreiben", async () => {
    // Der Index unterscheidet sie - genau dafuer steht er im Namen. Waere der Name
    // aus etwas anderem gebildet (Art, Dauer, Vorlage), traefen zwei gleichartige
    // Segmente auf dieselbe Datei, und das zweite ueberschriebe das erste.
    const ergebnis = await legePngsAb(bereich, [
      segment("erstes", pngBytes(0xa1)),
      segment("zweites", pngBytes(0xa2)),
    ]);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(readdirSync(bereich).sort()).toEqual(["segment-0000.png", "segment-0001.png"]);
    expect(readFileSync(path.join(bereich, "segment-0000.png"))[0]).toBe(0xa1);
    expect(readFileSync(path.join(bereich, "segment-0001.png"))[0]).toBe(0xa2);
  });
});

describe("legePngsAb (#175) schreibt die Bytes unveraendert", () => {
  it("schreibt den vollstaendigen Inhalt Byte fuer Byte", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x7f]);

    const ergebnis = await legePngsAb(bereich, [segment("a", png)]);

    expect(ergebnis.ok).toBe(true);
    const geschrieben = readFileSync(path.join(bereich, "segment-0000.png"));
    expect(new Uint8Array(geschrieben)).toEqual(png);
  });

  it("schreibt einen Puffer, der nur ein AUSSCHNITT eines groesseren Blocks ist, korrekt", async () => {
    // DER PFLICHTTEST DES ISSUES. `Buffer.from(png.buffer)` schriebe hier 30 statt 10
    // Bytes - mit Fremdbytes davor und dahinter. Der Fehler tritt NUR auf, wenn der
    // Puffer zufaellig ein Ausschnitt ist, faellt also in einem naiven Testlauf nie
    // auf; die fertige MP4 zeigte dann ein schwarzes oder verzerrtes Segment.
    const block = new Uint8Array(30);
    block.fill(0xee);
    const ausschnitt = block.subarray(10, 20);
    ausschnitt.fill(0x5c);

    expect(ausschnitt.byteOffset).toBe(10);
    expect(ausschnitt.byteLength).toBe(10);
    expect(ausschnitt.buffer.byteLength).toBe(30);

    const ergebnis = await legePngsAb(bereich, [segment("a", ausschnitt)]);

    expect(ergebnis.ok).toBe(true);
    const geschrieben = readFileSync(path.join(bereich, "segment-0000.png"));
    expect(geschrieben.length).toBe(10);
    expect(new Uint8Array(geschrieben)).toEqual(new Uint8Array(10).fill(0x5c));
  });

  it("schreibt einen leeren Puffer als leere Datei, statt ihn zu ueberspringen", async () => {
    const ergebnis = await legePngsAb(bereich, [segment("a", new Uint8Array(0))]);

    expect(ergebnis.ok).toBe(true);
    // Die Datei MUSS entstehen: Ihr Pfad steht im Ergebnis, und die Filterkette
    // (#166) wuerde sonst auf eine Datei zeigen, die es nicht gibt.
    expect(statSync(path.join(bereich, "segment-0000.png")).size).toBe(0);
  });

  it("schreibt auch einen sehr grossen Puffer vollstaendig", async () => {
    const gross = new Uint8Array(5 * 1024 * 1024);
    gross.fill(0x7a);
    gross[gross.length - 1] = 0x01;

    const ergebnis = await legePngsAb(bereich, [segment("a", gross)]);

    expect(ergebnis.ok).toBe(true);
    const geschrieben = readFileSync(path.join(bereich, "segment-0000.png"));
    expect(geschrieben.length).toBe(gross.length);
    expect(geschrieben[geschrieben.length - 1]).toBe(0x01);
  });
});

describe("segmentPngDateiname / bandDateiname (#175) bilden Namen allein aus Indizes", () => {
  it("fuellt auf vier Stellen auf", () => {
    expect(segmentPngDateiname(7)).toBe("segment-0007.png");
    expect(segmentPngDateiname(0)).toBe("segment-0000.png");
    expect(bandDateiname(3, 12)).toBe("band-0003-0012.png");
  });

  it("schneidet einen Index ab 10000 NICHT ab", () => {
    // Ein Schnitt auf vier Stellen liesse `10000` und `0000` auf dieselbe Datei
    // fallen - das erste Element bekaeme die Pixel des zehntausendundersten.
    expect(segmentPngDateiname(10000)).toBe("segment-10000.png");
    expect(segmentPngDateiname(10000)).not.toBe(segmentPngDateiname(0));
    expect(bandDateiname(10000, 10001)).toBe("band-10000-10001.png");
  });

  it("kollidiert nicht mit den Zwischenclips seg_*.mp4 (ENTSCHIEDEN 5)", () => {
    expect(segmentPngDateiname(7).startsWith("seg_")).toBe(false);
  });
});

describe("die Quelldatei haelt die Grep-Proben der DoD ein", () => {
  const quelltext = readFileSync(QUELLE, "utf8");

  it("nennt den kurzen, kollidierenden Namen an keiner Stelle", () => {
    // ENTSCHIEDEN 10: #177 exportiert im SELBEN Ordner eine Funktion gleicher
    // Signatur mit anderem Ergebnis. Der lange Name ist der Kollisionsschutz.
    expect(quelltext.includes(`segment${"Dateiname"}`)).toBe(false);
  });

  it("feuert die Schreibvorgaenge nicht gebuendelt ab", () => {
    expect(quelltext.includes(`Promise${".all"}`)).toBe(false);
  });
});

describe("legePngsAb (#175) weist unbrauchbare Eingaenge ab, ohne zu schreiben", () => {
  it.each(["", "   ", undefined, null, 42])(
    "meldet %p als speicher_fehler und schreibt nichts",
    async (eingang) => {
      const ergebnis = await legePngsAb(eingang as string, [segment("a", pngBytes(0x11))]);

      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
      expect(writeFile).not.toHaveBeenCalled();
    },
  );

  it("meldet eine Elementliste, die keine Liste ist, als ungueltige_eingabe", async () => {
    const ergebnis = await legePngsAb(bereich, undefined as unknown as RenderItem[]);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("meldet einen verschwundenen Arbeitsbereich als speicher_fehler und sagt es", async () => {
    const weg = path.join(WURZEL, "reel-gibt-es-nicht");

    const ergebnis = await legePngsAb(weg, [segment("a", pngBytes(0x11))]);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(ergebnis.fehler.meldung).toContain("ENOENT");
    expect(ergebnis.fehler.meldung).toContain("verschwunden");
  });
});

describe("legePngsAb (#175) wandelt jeden Schreibfehler in ein Ergebnis", () => {
  it("meldet eine volle Platte als kein_platz, mit Dateiname und Element-Kennung", async () => {
    attrappe.writeFile = async () => {
      throw systemfehler("ENOSPC");
    };

    const ergebnis = await legePngsAb(bereich, [segment("element-42", pngBytes(0x11))]);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_platz");
    expect(ergebnis.fehler.meldung).toContain("segment-0000.png");
    expect(ergebnis.fehler.meldung).toContain("element-42");
    // NUR der Dateiname, nie der ganze Pfad: "Der Renderer kennt keine absoluten
    // Pfade" (TK 9.2.1), und die Meldung reist bis in die Oberflaeche.
    expect(ergebnis.fehler.meldung).not.toContain(bereich);
    expect(ergebnis.fehler.daten).toBeUndefined();
  });

  it.each(["EACCES", "EPERM", "EROFS", "EIO", "EWASAUCHIMMER"])(
    "meldet %s als speicher_fehler, mit dem Code nur in der Meldung",
    async (code) => {
      attrappe.writeFile = async () => {
        throw systemfehler(code);
      };

      const ergebnis = await legePngsAb(bereich, [segment("a", pngBytes(0x11))]);

      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
      expect(ergebnis.fehler.meldung).toContain(code);
      expect(ergebnis.fehler.daten).toBeUndefined();
    },
  );

  it("wandelt eine Ausnahme ohne Systemcode in unbekannter_fehler, statt zu werfen", async () => {
    attrappe.writeFile = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await legePngsAb(bereich, [segment("a", pngBytes(0x11))]);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
  });

  it("bricht beim ersten Fehler ab und laesst das bereits Geschriebene liegen", async () => {
    // ENTSCHIEDEN 7: kein Zurueckrollen - der Aufrufer verwirft den Arbeitsbereich
    // als Ganzes. Und ENTSCHIEDEN 8: nach dem Fehler wird NICHT weitergeschrieben.
    const echt = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    let ruf = 0;
    attrappe.writeFile = async (pfad, daten) => {
      ruf += 1;
      if (ruf === 3) {
        throw systemfehler("EACCES");
      }
      await echt.writeFile(pfad, daten);
    };

    const ergebnis = await legePngsAb(bereich, [
      segment("a", pngBytes(0x11)),
      segment("b", pngBytes(0x22)),
      segment("c", pngBytes(0x33)),
      segment("d", pngBytes(0x44)),
    ]);

    expect(ergebnis.ok).toBe(false);
    expect(writeFile).toHaveBeenCalledTimes(3);
    expect(readdirSync(bereich).sort()).toEqual(["segment-0000.png", "segment-0001.png"]);
  });
});

describe("legePngsAb (#175) schreibt der Reihe nach", () => {
  it("beginnt keinen Schreibvorgang, bevor der vorige beendet ist", async () => {
    // ENTSCHIEDEN 8: hundert gleichzeitige Schreibvorgaenge mit je mehreren Megabyte
    // belasten die Platte ohne Gewinn. Die Attrappe protokolliert Beginn und Ende;
    // bei gebuendeltem Abfeuern staenden alle "los" vor dem ersten "fertig".
    const ablauf: string[] = [];
    attrappe.writeFile = async (pfad) => {
      const name = path.basename(pfad);
      ablauf.push(`los ${name}`);
      await new Promise((weiter) => setTimeout(weiter, 0));
      ablauf.push(`fertig ${name}`);
    };

    await legePngsAb(bereich, [
      segment("a", pngBytes(0x11)),
      video("b", [pngBytes(0x22), pngBytes(0x33)]),
    ]);

    expect(ablauf).toEqual([
      "los segment-0000.png",
      "fertig segment-0000.png",
      "los band-0001-0000.png",
      "fertig band-0001-0000.png",
      "los band-0001-0001.png",
      "fertig band-0001-0001.png",
    ]);
  });
});
