// Verhaltenstest zu #307 - Slogan-Bearbeitung.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  uebernimme: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/marken-editor/marken-uebersicht", () => ({
  uebernimmAktualisierteMarke: h.uebernimme,
}));

const { setzeSlogan } = await import("../../src/renderer/marken-editor/slogan-bearbeiten");

const DIE_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.resetAllMocks();
  h.uebernimme.mockImplementation(() => undefined);
  h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
});

describe("setzeSlogan (#307)", () => {
  it("schickt teilwerte GENAU mit dem einen Schluessel slogan, slogan mit BEIDEN Schluesseln", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    await setzeSlogan(DIE_ID, { text: "Stark seit 1999", aktiv: true });

    expect(h.rufeAuf).toHaveBeenCalledWith("marken:bearbeiteMarke", {
      markeId: DIE_ID,
      teilwerte: { slogan: { text: "Stark seit 1999", aktiv: true } },
    });
    const teilwerte = (h.rufeAuf.mock.calls[0]![1] as { teilwerte: object }).teilwerte;
    expect(Object.keys(teilwerte)).toEqual(["slogan"]);
  });

  it("der Text erreicht den Store UNVERAENDERT - auch mit Rand-Leerzeichen", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    await setzeSlogan(DIE_ID, { text: "  Stark seit 1999  ", aktiv: true });

    const slogan = (h.rufeAuf.mock.calls[0]![1] as { teilwerte: { slogan: { text: string } } }).teilwerte.slogan;
    expect(slogan.text).toBe("  Stark seit 1999  ");
  });

  it("der leere Text ist ZULSSIG und loest einen IPC-Ruf aus (Zwischenzustand beim Tippen)", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: { id: DIE_ID } as never });

    const antwort = (await setzeSlogan(DIE_ID, { text: "", aktiv: true })) as { ok: boolean };

    expect(antwort.ok).toBe(true);
    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("bei Erfolg geht die Rueckgabe UNVERAENDERT an uebernimmAktualisierteMarke, VOR der Rueckkehr", async () => {
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

    const antwort = await setzeSlogan(DIE_ID, { text: "x", aktiv: false });

    expect((antwort as { wert: unknown }).wert).toBe(marke);
    expect(folge).toEqual(["marken:bearbeiteMarke", "uebernimm"]);
  });

  it("bei Fehler wird NICHT uebernommen; der Code reist unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code: "marke_nicht_gefunden", meldung: "y" } });

    const antwort = (await setzeSlogan(DIE_ID, { text: "x", aktiv: true })) as { fehler: { code: string } };

    expect(antwort.fehler.code).toBe("marke_nicht_gefunden");
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("leere markeId: ungueltige_eingabe OHNE IPC", async () => {
    const antwort = (await setzeSlogan("", { text: "x", aktiv: true })) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("nur Leerzeichen in der markeId: ungueltige_eingabe OHNE IPC", async () => {
    const antwort = (await setzeSlogan("   ", { text: "x", aktiv: true })) as { fehler: { code: string } };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.uebernimme).not.toHaveBeenCalled();
  });

  it("nicht-String als markeId: ungueltige_eingabe OHNE IPC und ohne Wurf", async () => {
    const antwort = (await setzeSlogan(undefined as unknown as string, { text: "x", aktiv: true })) as {
      fehler: { code: string };
    };
    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    expect(h.rufeAuf).not.toHaveBeenCalled();
  });
});
