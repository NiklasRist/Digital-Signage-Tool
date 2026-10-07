// Verhaltenstest zu #297 (Schrift-Rollen + Import) und #298 (Logo importieren/entfernen).
// rufeAuf und uebernimmAktualisierteMarke sind Doppeln; gemessen wird die Nutzlast
// (exakt vier Felder, in JEDER Nutzlast schriftRolle - bei Logo mit null), die
// Übernahme-Reihenfolge und die fehlerfrei durchgereichten Codes.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke, SchriftRolle } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  uebernimme: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  uebernimmAktualisierteMarke: h.uebernimme,
}));

const {
  SCHRIFT_ROLLEN,
  LIZENZHINWEIS_IMPORT,
  baueSchriftAnzeige,
  importiereSchrift,
} = await import("../../src/renderer/marken-editor/schriften-bearbeiten");
const {
  HINWEIS_LOGO_ENTFERNT,
  importiereLogo,
  entferneLogo,
} = await import("../../src/renderer/marken-editor/logo-bearbeiten");

const DIE_ID = "11111111-1111-4111-8111-111111111111";
const PFAD = "/tmp/quelle.woff2";

function attrappeMarke(id: string): Marke {
  return { id, name: "M-" + id } as unknown as Marke;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks), damit kein Spion aus einem frueheren Test
  // in den naechsten laeuft - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.uebernimme.mockImplementation(() => undefined);
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
});

describe("SCHRIFT_ROLLEN (#297)", () => {
  it("traegt GENAU die vier Rollen in TK 9.11.2 Tabellenreihenfolge", () => {
    expect(SCHRIFT_ROLLEN).toEqual([
      "headlineElegant", "headlinePlakativ", "fliesstext", "fliesstextFett",
    ]);
  });
});

describe("baueSchriftAnzeige (#297)", () => {
  it("liefert vier Eintraege in SCHRIFT_ROLLEN-Reihenfolge; gemischte Herkuenfte setzen importiert rein aus herkunft", () => {
    const herkuenfte: Record<SchriftRolle, string> = {
      headlineElegant: "gebuendelt",
      headlinePlakativ: "importiert",
      fliesstext: "gebuendelt",
      fliesstextFett: "importiert",
    };
    const marke = {
      id: DIE_ID,
      schriften: Object.fromEntries(
        (Object.keys(herkuenfte) as SchriftRolle[]).map((rolle) => [
          rolle,
          { familie: "F", gewicht: 400, datei: "d", herkunft: herkuenfte[rolle] },
        ]),
      ),
    } as unknown as Marke;

    const anzeige = baueSchriftAnzeige(marke);

    expect(anzeige.map((e) => e.rolle)).toEqual([
      "headlineElegant", "headlinePlakativ", "fliesstext", "fliesstextFett",
    ]);
    expect(anzeige.map((e) => e.importiert)).toEqual([false, true, false, true]);
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("importiereSchrift (#297)", () => {
  it("sendet GENAU die vier Felder an marken:importiereMarkenDatei, schriftRolle = rolle", async () => {
    const marke = attrappeMarke(DIE_ID);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    await importiereSchrift(DIE_ID, "fliesstext", PFAD);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:importiereMarkenDatei", {
      markeId: DIE_ID,
      art: "schrift",
      schriftRolle: "fliesstext",
      quellPfad: PFAD,
    });
  });

  it("uebernimmAktualisierteMarke laeuft mit der Rueckgabe VOR der Rueckkehr; Ergebnis UNVERAENDERT", async () => {
    const marke = attrappeMarke(DIE_ID);
    const folge: string[] = [];
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      folge.push(kanal);
      return { ok: true as const, wert: marke };
    });
    h.uebernimme.mockImplementation((m: Marke) => {
      folge.push("uebernimm");
      expect(m).toBe(marke);
    });

    const antwort = (await importiereSchrift(DIE_ID, "headlineElegant", PFAD)) as { wert: Marke };

    expect(antwort.wert).toBe(marke);
    expect(folge).toEqual(["marken:importiereMarkenDatei", "uebernimm"]);
  });

  it("ungueltige_eingabe vom Store reist UNVERAENDERT durch; keine Übernahme", async () => {
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "Format - nur .woff2" },
    });

    const antwort = (await importiereSchrift(DIE_ID, "fliesstext", PFAD)) as {
      fehler: { code: string; meldung: string };
    };

    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(antwort.fehler.meldung).toBe("Format - nur .woff2");
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it.each([
    ["leere markeId", "", PFAD],
    ["nur Whitespace markeId", "   ", PFAD],
    ["leerer quellPfad", DIE_ID, ""],
    ["nur Whitespace quellPfad", DIE_ID, "  "],
  ])("%s loest KEINEN IPC-Ruf aus", async (_t, markeId, quellPfad) => {
    const antwort = (await importiereSchrift(markeId as string, "fliesstext", quellPfad as string)) as {
      fehler: { code: string };
    };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });
});

describe("Text-Konstanten", () => {
  it("LIZENZHINWEIS_IMPORT und HINWEIS_LOGO_ENTFERNT tragen beide einen nicht leeren, fuer #330 exportierten Text", () => {
    expect(LIZENZHINWEIS_IMPORT.length).toBeGreaterThan(40);
    expect(HINWEIS_LOGO_ENTFERNT.length).toBeGreaterThan(40);
  });
});

describe("importiereLogo (#298)", () => {
  it("sendet GENAU die vier Felder, schriftRolle FEST null", async () => {
    const marke = attrappeMarke(DIE_ID);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    await importiereLogo(DIE_ID, "/tmp/logo.png");

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:importiereMarkenDatei", {
      markeId: DIE_ID,
      art: "logo",
      schriftRolle: null,
      quellPfad: "/tmp/logo.png",
    });
    expect(h.uebernimme).toHaveBeenCalledWith(marke);
  });

  it("erfolge mit geerbtem/gebündeltem Logo-Wert UND mit logo: null - beide Rückgaben sind Erfolg, Aufzeichner prueft die Reihenfolge", async () => {
    for (const wert of [
      { ...attrappeMarke(DIE_ID), logo: { datei: "x", herkunft: "gebuendelt", seitenverhaeltnis: 3 } },
      { ...attrappeMarke(DIE_ID), logo: null },
    ] as unknown as Marke[]) {
      const folge: string[] = [];
      h.rufeAuf.mockImplementationOnce(async (kanal: string) => {
        folge.push(kanal);
        return { ok: true as const, wert };
      });
      h.uebernimme.mockImplementationOnce((m: Marke) => folge.push("uebernimm"));

      const antwort = (await importiereLogo(DIE_ID, "/tmp/logo.png")) as { wert: Marke };

      expect(antwort.wert).toBe(wert);
      expect(folge).toEqual(["marken:importiereMarkenDatei", "uebernimm"]);
    }
    expect(h.rufeAuf).toHaveBeenCalledTimes(2);
  });

  it("leere/Whitespace markeId oder quellPfad loest KEINEN IPC-Ruf aus", async () => {
    for (const [markeId, quellPfad] of [["", "/p"], ["  ", "/p"], [DIE_ID, ""], [DIE_ID, " "]] as const) {
      const antwort = (await importiereLogo(markeId, quellPfad)) as { fehler: { code: string } };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });
});

describe("entferneLogo (#298)", () => {
  it("sendet { markeId, art: 'logo', schriftRolle: null } GENAU SO an marken:entferneMarkenDatei", async () => {
    const marke = attrappeMarke(DIE_ID);
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { ...marke, logo: null } });

    await entferneLogo(DIE_ID);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:entferneMarkenDatei", {
      markeId: DIE_ID,
      art: "logo",
      schriftRolle: null,
    });
    expect(h.uebernimme).toHaveBeenCalledOnce();
  });

  it("logo: null im Ergebnis ist KEIN Sonderweg - gleiche Behandlung wie ein geerbtes Logo; 'marke_nicht_gefunden' reist unverändert", async () => {
    for (const werte of [
      { ...attrappeMarke(DIE_ID), logo: null },
      { ...attrappeMarke(DIE_ID), logo: { datei: "g", herkunft: "gebuendelt", seitenverhaeltnis: 2 } },
    ] as unknown as Marke[]) {
      h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: werte });
      const antwort = (await entferneLogo(DIE_ID)) as { wert: Marke };
      expect(antwort.wert).toBe(werte);
      expect(h.uebernimme).toHaveBeenLastCalledWith(werte);
    }
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "marke_nicht_gefunden", meldung: "unbekannt" },
    });
    h.uebernimme.mockClear(); // isolation: nur der Fehlerweg zaehlt ab hier
    const antwort = (await entferneLogo(DIE_ID)) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("marke_nicht_gefunden");
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("leere markeId loest KEINEN IPC-Ruf aus", async () => {
    for (const leer of ["", "   "]) {
      const antwort = (await entferneLogo(leer)) as { fehler: { code: string } };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });
});

describe("Grep-Proben der DoD (Beleg: die Muster GREIFEN, bevor sie schweigen)", () => {
  it("keine Quelldatei der beiden Issues beruehrt fs", async () => {
    const fs = await import("node:fs/promises");
    for (const datei of [
      "src/renderer/marken-editor/schriften-bearbeiten.ts",
      "src/renderer/marken-editor/logo-bearbeiten.ts",
    ]) {
      const text = await fs.readFile(datei, "utf8");
      expect(text, datei).not.toMatch(/node:fs|from ['"]fs['"]|require\(['"]fs/);
      expect(text, datei).not.toMatch(/öffneMarkenDateiDialog/); // kein Dialogruf
    }
  });

  it("die Lizenz-Fasern existieren je GENAU EINMAL je Datei", async () => {
    const fs = await import("node:fs/promises");
    const schrift = await fs.readFile("src/renderer/marken-editor/schriften-bearbeiten.ts", "utf8");
    const logoText = await fs.readFile("src/renderer/marken-editor/logo-bearbeiten.ts", "utf8");
    expect(schrift.match(/LIZENZHINWEIS_IMPORT/g)!.length).toBeGreaterThanOrEqual(1);
    expect((schrift.match(/Für importierte Schriften/g) ?? []).length).toBe(1);
    expect((logoText.match(/Diese Marke hat jetzt/g) ?? []).length).toBe(1);
  });
});
