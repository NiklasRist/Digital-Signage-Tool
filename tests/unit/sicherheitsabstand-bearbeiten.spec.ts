// Verhaltenstest zu #308 - Sicherheitsabstand-Bearbeitung + Vorlagen-Hinweis.
// Die Zahlen 480/270/96/54 stehen NICHT im Quellcode des Issues (Grep); in der
// Testdatei sind sie zulässig.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  uebernimme: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  uebernimmAktualisierteMarke: h.uebernimme,
}));

const { setzeSicherheitsabstand, baueVorlagenHinweis } = await import(
  "../../src/renderer/marken-editor/sicherheitsabstand-bearbeiten"
);

const DIE_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.resetAllMocks();
  h.uebernimme.mockImplementation(() => undefined);
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
});

describe("setzeSicherheitsabstand (#308)", () => {
  it("schickt teilwerte GENAU mit sicherheit, sicherheit mit BEIDEN Achsen", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    await setzeSicherheitsabstand(DIE_ID, { horizontal: 120, vertikal: 80 });

    expect(h.rufeAuf).toHaveBeenCalledWith(
      "marken:bearbeiteMarke",
      { markeId: DIE_ID, teilwerte: { sicherheit: { horizontal: 120, vertikal: 80 } } },
    );
    const teilwerte = (h.rufeAuf.mock.calls[0]![1] as { teilwerte: object }).teilwerte;
    expect(Object.keys(teilwerte)).toEqual(["sicherheit"]);
  });

  it("0/0 ist ZULAESSIG und loest den IPC-Ruf aus (Vorsichtsmassnahme, R-08)", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    const antwort = (await setzeSicherheitsabstand(DIE_ID, { horizontal: 0, vertikal: 0 })) as { ok: boolean };

    expect(antwort.ok).toBe(true);
    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it.each([
    { horizontal: 481, vertikal: 0 },
    { horizontal: 0, vertikal: 271 },
    { horizontal: 54.5, vertikal: 0 },
    { horizontal: NaN, vertikal: 0 },
    { horizontal: Infinity, vertikal: 0 },
  ])("%j liegt ausserhalb und erzeugt KEINEN IPC-Ruf", async (sicherheit) => {
    const antwort = (await setzeSicherheitsabstand(DIE_ID, sicherheit)) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("die oberen Grenzwerte (Viertel der Kante) laufen RECHTLICH durch", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    const antwort = (await setzeSicherheitsabstand(DIE_ID, { horizontal: 480, vertikal: 270 })) as { ok: boolean };

    expect(antwort.ok).toBe(true);
  });

  it("bei Erfolg geht die Rueckgabe UNVERAENDERT an uebernimm, VOR der Rueckkehr (Reihenfolge)", async () => {
    const marke = { id: DIE_ID, name: "M" } as never;
    const folge: string[] = [];
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      folge.push(kanal);
      return { ok: true as const, wert: marke };
    });
    h.uebernimme.mockImplementation((m: never) => {
      folge.push("uebernimm");
      expect(m).toBe(marke);
    });

    const antwort = await setzeSicherheitsabstand(DIE_ID, { horizontal: 100, vertikal: 60 });

    expect((antwort as { wert: unknown }).wert).toBe(marke);
    expect(folge).toEqual(["marken:bearbeiteMarke", "uebernimm"]);
  });

  it("bei Fehlern des Stores wird NICHT uebernommen und der Code reist unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code: "speicher_fehler", meldung: "z" } });

    const antwort = (await setzeSicherheitsabstand(DIE_ID, { horizontal: 100, vertikal: 60 })) as {
      fehler: { code: string };
    };

    expect(antwort.fehler.code).toBe("speicher_fehler");
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("leere markeId: ungueltige_eingabe ohne IPC", async () => {
    const antwort = (await setzeSicherheitsabstand("", { horizontal: 1, vertikal: 1 })) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("baueVorlagenHinweis (#308)", () => {
  it("Wachsen einer Achse liefert den FESTEN Text mit den NEUEN Zahlen", () => {
    const text = baueVorlagenHinweis({ horizontal: 96, vertikal: 54 }, { horizontal: 96, vertikal: 120 })!;
    expect(text).toContain("120");
    expect(text).toContain("96 × 120");
    expect(text).toContain("app-weit");
    expect(text).toContain("Vorlagen-Editor");
  });

  it("gleichbleibende oder schrumpfende Werte liefern NULL (nichts zu warnen)", () => {
    expect(baueVorlagenHinweis({ horizontal: 96, vertikal: 54 }, { horizontal: 96, vertikal: 54 })).toBeNull();
    expect(baueVorlagenHinweis({ horizontal: 100, vertikal: 60 }, { horizontal: 80, vertikal: 40 })).toBeNull();
  });

  it("reine Funktion: kein IPC-Ruf", async () => {
    baueVorlagenHinweis({ horizontal: 10, vertikal: 10 }, { horizontal: 20, vertikal: 20 });
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("Grep-Probe auf sicherheitsabstand-bearbeiten.ts (#308)", () => {
  it("keine Magier-Zahlen (480/270/96/54) im Quelltext, kein Timer/round/geerbt/fs", async () => {
    const { readFileSync } = await import("node:fs");
    const text = readFileSync("src/renderer/marken-editor/sicherheitsabstand-bearbeiten.ts", "utf8");
    const ohneKommentare = text
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");

    expect(ohneKommentare).toContain("setzeSicherheitsabstand");
    for (const verboten of ["480", "270", "96", "54", "setTimeout", "Math.round", "geerbt", "vorlagen:", "node:fs"]) {
      expect(ohneKommentare.includes(verboten)).toBe(false);
    }
  });
});
