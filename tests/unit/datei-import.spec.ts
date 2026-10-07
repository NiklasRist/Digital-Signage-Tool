// Verhaltenstest zu #326 - waehle & importiere: Dialog kapseln, ersten Pfad weiterreichen,
// Abbruch als { ok: true, wert: null } (KEIN Fehlercode).
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  importiereSchrift: vi.fn(),
  importiereLogo: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/schriften-bearbeiten", () => ({
  importiereSchrift: h.importiereSchrift,
  LIZENZHINWEIS_IMPORT: "X",
}));
vi.mock("../../src/renderer/marken-editor/logo-bearbeiten", () => ({
  importiereLogo: h.importiereLogo,
  HINWEIS_LOGO_ENTFERNT: "X",
}));

const { waehleUndImportiereSchrift, waehleUndImportiereLogo } = await import(
  "../../src/renderer/marken-editor/datei-import"
);

const DIE_ID = "11111111-1111-4111-8111-111111111111";
const MARKE = { id: DIE_ID } as unknown as import("../../src/shared/contracts/marke").Marke;

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks) - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.importiereSchrift.mockResolvedValue({ ok: true, wert: MARKE });
  h.importiereLogo.mockResolvedValue({ ok: true, wert: MARKE });
});

describe("waehleUndImportiereSchrift (#326)", () => {
  it("oeffnet den Dialog GENAU EINMAL mit { art: 'schrift' } - ohne markeId in der Nutzlast - und reicht den ERSTEN Pfad UNVERAENDERT weiter", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: ["/q/Schrift.woff2"] } });

    const antwort = (await waehleUndImportiereSchrift(DIE_ID, "fliesstext")) as unknown as {
      ok: true;
      wert: object;
    };

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:\u00F6ffneMarkenDateiDialog", { art: "schrift" });
    expect(h.importiereSchrift).toHaveBeenCalledTimes(1);
    expect(h.importiereSchrift).toHaveBeenCalledWith(DIE_ID, "fliesstext", "/q/Schrift.woff2");
    expect((antwort as { wert: object }).wert).toBe(MARKE); // dieselbe Referenz, keine Kopie
  });

  it("Abbruch (pfade: []): { ok: true, wert: null } und KEIN Import-Ruf", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: [] } });

    const antwort = await waehleUndImportiereSchrift(DIE_ID, "fliesstext");

    expect(antwort).toEqual({ ok: true, wert: null });
    expect(h.importiereSchrift).not.toHaveBeenCalled();
  });

  it("Dialog-Fehler kommt UNVERAENDERT durch (meldung erhalten), kein Import", async () => {
    h.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "x", daten: { rampe: 1 } },
    });

    const antwort = (await waehleUndImportiereSchrift(DIE_ID, "headlineElegant")) as unknown as {
      fehler: { code: string; meldung: string; daten?: unknown };
    };

    expect(antwort.fehler.code).toBe("unbekannter_fehler");
    expect(antwort.fehler.meldung).toBe("x");
    expect(antwort.fehler.daten).toEqual({ rampe: 1 });
    expect(h.importiereSchrift).not.toHaveBeenCalled();
  });

  it("zwei Pfade vom OS: NUR der erste wird importiert (kein Iterieren)", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: ["/q/erste", "/q/zweite"] } });

    await waehleUndImportiereSchrift(DIE_ID, "fliesstext");

    expect(h.importiereSchrift).toHaveBeenCalledTimes(1);
    expect(h.importiereSchrift).toHaveBeenCalledWith(DIE_ID, "fliesstext", "/q/erste");
  });

  it("leere markeId: ungueltige_eingabe OHNE Dialog - der Dialog geht NICHT auf", async () => {
    for (const leer of ["", "   "]) {
      const antwort = (await waehleUndImportiereSchrift(leer, "fliesstext")) as {
        fehler: { code: string };
      };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.importiereSchrift).not.toHaveBeenCalled();
  });

  it("Import-Fehler reisen UNVERAENDERT, kein eigener Code", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: ["/q/a"] } });
    h.importiereSchrift.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "vom Store" },
    });

    const antwort = (await waehleUndImportiereSchrift(DIE_ID, "fliesstext")) as {
      fehler: { code: string; meldung: string };
    };

    expect(antwort.fehler.code).toBe("speicher_fehler");
    expect(antwort.fehler.meldung).toBe("vom Store");
  });
});

describe("waehleUndImportiereLogo (#326)", () => {
  it("Dialog mit { art: 'logo' }, erster Pfad an importiereLogo", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: ["/q/Logo.png"] } });

    await waehleUndImportiereLogo(DIE_ID);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:\u00F6ffneMarkenDateiDialog", { art: "logo" });
    expect(h.importiereLogo).toHaveBeenCalledTimes(1);
    expect(h.importiereLogo).toHaveBeenCalledWith(DIE_ID, "/q/Logo.png");
  });

  it("Abbruch ebenso: { ok: true, wert: null }, kein Import", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { pfade: [] } });
    const antwort = await waehleUndImportiereLogo(DIE_ID);
    expect(antwort).toEqual({ ok: true, wert: null });
    expect(h.importiereLogo).not.toHaveBeenCalled();
  });

  it("leere markeId ohne Dialog", async () => {
    const antwort = (await waehleUndImportiereLogo("")) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("DoD-Grep-Proben (#326)", () => {
  it("nur zwei Exporte, keine verbotenen Weg und keine Endungs-Literale", async () => {
    const fs = await import("node:fs/promises");
    const roh = await fs.readFile("src/renderer/marken-editor/datei-import.ts", "utf8");
    // Kommentare entfernen: Die verbindliche Signaturdokumentation zitiert den
    // .woff2-Filter UNVERAENDERBAR - geprueft wird der Code.
    const text = roh
      .split("\n")
      .filter((zeile) => !/^\s*\/\*|^\s*\*/.test(zeile))
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");
    expect(text).not.toMatch(/woff|ttf|otf|png|\bjpg\b|webp|svg/);
    expect(text).not.toMatch(/uebernimmAktualisierteMarke|leereMarkenBestand|leereMarkenSchriftBestand|leereLogoBestand/);
    expect(text).not.toMatch(/entferneMarkenDatei|importiereMarkenDatei|reiheEin/);
    expect(text).not.toMatch(/node:fs|['"]fs['"]|['"]path['"]|window\.api|document|<input|useState/);
    expect(text).not.toMatch(/pfade\[0\]/);
  });

  it("verbleibende Struktur-Proben ueber den Rohstand", async () => {
    const text = await (await import("node:fs/promises")).readFile(
      "src/renderer/marken-editor/datei-import.ts",
      "utf8",
    );
    expect((text.match(/^export /gm) ?? [])).toHaveLength(2); // die beiden Funktionen, sonst nichts
    expect(text).not.toMatch(/export default|export function|export const/);
    expect(text).not.toMatch(/export default/);
  });
});
