// Verhaltenstest zu #312 - der Marken-Bereitstellweg der Zeichner.
//
// Alles mit Doppeln (rufeAuf, Schriften, Logo); ohne Browser. Der Plan: der
// einzige IPC-Weg ist marken:leseMarke; der Bestand ist je markeId; Fehlschlaege
// werden NICHT gemerkt; geliefert wird die Marke UNVERAENDERT (herkunftJeFeld reist mit).
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  stelleMarkenSchriftenBereit: vi.fn(),
  leereMarkenSchriftBestand: vi.fn(),
  bereiteLogoVor: vi.fn(),
  holeLogo: vi.fn(),
  leereLogoBestand: vi.fn(),
  spurensicherung: [] as string[],
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/template-canvas/marken-schriften", () => ({
  stelleMarkenSchriftenBereit: h.stelleMarkenSchriftenBereit,
  leereMarkenSchriftBestand: h.leereMarkenSchriftBestand,
  sindMarkenSchriftenBereit: vi.fn(() => true),
}));
vi.mock("../../src/renderer/template-canvas/logo-laden", () => ({
  bereiteLogoVor: h.bereiteLogoVor,
  holeLogo: h.holeLogo,
  leereLogoBestand: h.leereLogoBestand,
}));

const mockMarke = (id = "11111111-1111-4111-8111-111111111111"): Marke => ({
  id,
  name: "Partner GmbH",
  parent: null,
  eingebaut: false,
  farben: {
    akzent: "#FF4040",
    akzentKraeftig: "#E03030",
    akzentTief: "#B02020",
    flaecheDunkel: "#2F2E2E",
    flaecheSehrDunkel: "#1E1D1D",
    flaecheHell: "#F5F4F4",
    flaecheAkzentZart: "#FFE8E8",
    textAufDunkel: "#FFFFFF",
    textAufHell: "#1E1D1D",
    textSekundaer: "#6B6B6B",
    linie: "#C0C0C0",
    scrimStart: "#000000",
    scrimEnde: "#333333",
  },
  schriften: {
    headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "p.ttf", herkunft: "gebuendelt" },
    headlinePlakativ: { familie: "Archivo Black", gewicht: 400, datei: "a.ttf", herkunft: "gebuendelt" },
    fliesstext: { familie: "Arimo", gewicht: 400, datei: "r.ttf", herkunft: "gebuendelt" },
    fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "rb.ttf", herkunft: "gebuendelt" },
  },
  logo: null,
  sicherheit: { horizontal: 96, vertikal: 54 },
  radien: { pille: 27, karte: 12, klein: 6 },
  schatten: { versatzY: 2, weichzeichnen: 6, farbe: "#00000088" },
  slogan: { text: "Beweg dich. Fühl dich gut.", aktiv: false },
  herkunftJeFeld: {
    farben: { akzent: "eigen", akzentKraeftig: "eigen", akzentTief: "eigen", flaecheDunkel: "eigen", flaecheSehrDunkel: "eigen", flaecheHell: "eigen", flaecheAkzentZart: "eigen", textAufDunkel: "eigen", textAufHell: "eigen", textSekundaer: "eigen", linie: "eigen", scrimStart: "eigen", scrimEnde: "eigen" } as never,
    schriften: {
      headlineElegant: "eigen",
      headlinePlakativ: "eigen",
      fliesstext: "eigen",
      fliesstextFett: "eigen",
    },
    logo: "keins",
    sicherheit: "eigen",
    radien: "eigen",
    schatten: "eigen",
    slogan: "eigen",
  },
});

const {
  stelleMarkeBereit,
  holeBereiteMarke,
  leereMarkenBestand,
  MARKEN_DATEI_FEHLT,
} = await import("../../src/renderer/gemeinsam/marken-bereitstellung");

const PLAN_FALSCH = { ok: false as const, fehler: { code: "marke_nicht_gefunden", meldung: "x" } };

beforeEach(() => {
  // Der Voraus-Leerlauf VOR clearAllMocks: der Zaehlerstart ist sonst je Test um EINS schief.
  leereMarkenBestand();
  vi.clearAllMocks();
  h.spurensicherung.length = 0;
  h.rufeAuf.mockImplementation(async (): Promise<{ ok: false; fehler: { code: string; meldung: string } }> => ({
    ok: false,
    fehler: { code: "marke_nicht_gefunden", meldung: "vorgestellt" },
  }));
  h.stelleMarkenSchriftenBereit.mockImplementation(async (marke: Marke): Promise<void> => {
    h.spurensicherung.push("schriften");
    void marke;
  });
  h.bereiteLogoVor.mockImplementation(async (): Promise<void> => {
    h.spurensicherung.push("logo");
  });
  h.holeLogo.mockImplementation(() => ({ zustand: "geladen", bild: {}, breite: 10, höhe: 10 } as never));
});

describe("stelleMarkeBereit (#312)", () => {
  it("lehnt leere und Nicht-String-IDs lokal ab, OHNE jeden IPC-Aufruf", async () => {
    const leer = await stelleMarkeBereit("");
    expect(leer).toEqual({ ok: false, fehler: expect.objectContaining({ code: "ungueltige_eingabe" }) });
    const keinString = await (stelleMarkeBereit as unknown as (v: unknown) => Promise<unknown>)(123);
    expect((keinString as { ok: boolean }).ok).toBe(false);
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(holeBereiteMarke("")).toBe(null);
  });

  it("ein erfolgreicher Aufruf ruft rufeAuf GENAU EINMAL mit Kanal und Nutzlast", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    const ergebnis = await stelleMarkeBereit(marke.id);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf).toHaveBeenCalledWith("marken:leseMarke", { markeId: marke.id });
    expect(ergebnis).toEqual({ ok: true, wert: marke });
  });

  it("ein zweiter Aufruf zur selben markeId ruft NICHT und liefert die toBe-gleiche Marke", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    const erst = await stelleMarkeBereit(marke.id);
    const zweit = await stelleMarkeBereit(marke.id);

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect((zweit as { ok: true; wert: Marke }).wert).toBe((erst as { ok: true; wert: Marke }).wert);
  });

  it("zwanzig gleichzeitige Aufrufe teilen sich EIN 'rufeAuf' und die toBe-gleiche Marke", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockImplementation(() => new Promise((weiter) => setTimeout(() => weiter({ ok: true, wert: marke }), 5)));

    const alle = await Promise.all(
      Array.from({ length: 20 }, () => stelleMarkeBereit(marke.id)),
    );

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    for (const ergebnis of alle) {
      expect(ergebnis.ok).toBe(true);
      expect((ergebnis as { wert: Marke }).wert).toBe((alle[0] as { wert: Marke }).wert);
    }
  });

  it("zwei verschiedene markeId fuehren zu zwei rufeAuf-Aufrufen", async () => {
    const a = mockMarke("11111111-1111-4111-8111-111111111111");
    const b = mockMarke("22222222-2222-4222-8222-222222222222");
    h.rufeAuf.mockImplementation(async (_k: string, n: { markeId: string }) => ({
      ok: true as const,
      wert: n.markeId === a.id ? a : b,
    }));

    await stelleMarkeBereit(a.id);
    await stelleMarkeBereit(b.id);

    expect(h.rufeAuf).toHaveBeenCalledTimes(2);
    expect(holeBereiteMarke(a.id)?.id).toBe(a.id);
    expect(holeBereiteMarke(b.id)?.id).toBe(b.id);
  });

  it("marken:leseMarke meldet ok:false: Code UNVERAENDERT, nichts gemerkt, Retry startet neu", async () => {
    h.rufeAuf.mockResolvedValueOnce(PLAN_FALSCH);

    const erst = await stelleMarkeBereit("99999999-9999-4999-8999-999999999999");

    expect((erst as { ok: boolean }).ok).toBe(false);
    expect(holeBereiteMarke("99999999-9999-4999-8999-999999999999")).toBe(null);

    const marke = mockMarke("99999999-9999-4999-8999-999999999999");
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });
    const erneuert = await stelleMarkeBereit("99999999-9999-4999-8999-999999999999");
    expect(h.rufeAuf).toHaveBeenCalledTimes(2);
    expect((erneuert as { ok: boolean }).ok).toBe(true);
  });

  it("stelleMarkenSchriftenBereit laeuft NACH dem Lesen und VOR dem Logo (Aufzeichner)", async () => {
    const marke = { ...mockMarke(), logo: { datei: "logo.png", herkunft: "importiert" as const, seitenverhaeltnis: 2 } };
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    await stelleMarkeBereit(marke.id);

    expect(h.spurensicherung).toEqual(["schriften", "logo"]);
  });

  it("wirft stelleMarkenSchriftenBereit, heisst der Code marken_datei_fehlt und es wird NICHTS gemerkt", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });
    h.stelleMarkenSchriftenBereit.mockRejectedValueOnce(new Error("FontFace fehlerhaft"));

    const ergebnis = (await stelleMarkeBereit(marke.id)) as { ok: boolean; fehler?: { code?: string } };

    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.fehler?.code).toBe(MARKEN_DATEI_FEHLT);
    expect(h.bereiteLogoVor).not.toHaveBeenCalled();
    expect(holeBereiteMarke(marke.id)).toBe(null);
  });

  it("marke.logo === null: kein bereiteLogoVor, aber die Marke gilt als bereit", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    const ergebnis = (await stelleMarkeBereit(marke.id)) as { ok: boolean };

    expect(ergebnis.ok).toBe(true);
    expect(h.bereiteLogoVor).not.toHaveBeenCalled();
    expect(holeBereiteMarke(marke.id)?.id).toBe(marke.id);
  });

  it("holeLogo liefert fehlt: marken_datei_fehlt und NICHTS gemerkt", async () => {
    const marke = mockMarke();
    const mitLogo = { ...marke, logo: { datei: "logo.png", herkunft: "importiert" as const, seitenverhaeltnis: 2 } };
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: mitLogo });
    h.holeLogo.mockImplementation(() => ({ zustand: "fehlt" }) as never);

    const ergebnis = (await stelleMarkeBereit(marke.id)) as { ok: boolean; fehler?: { code?: string } };

    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.fehler?.code).toBe(MARKEN_DATEI_FEHLT);
    expect(holeBereiteMarke(marke.id)).toBe(null);
  });

  it("die Marke reist UNVERAENDERT - herkunftJeFeld reist mit und die Referenz bleibt toBe-gleich", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: marke });

    const ergebnis = (await stelleMarkeBereit(marke.id)) as { wert: Marke };

    expect(ergebnis.wert).toBe(marke);
    expect(ergebnis.wert.herkunftJeFeld).toEqual(marke.herkunftJeFeld);
    expect(holeBereiteMarke(marke.id)).toBe(marke);
  });

  it("rufeAuf wirft: unbekannter_fehler, kein throw nach aussen, nichts gemerkt", async () => {
    h.rufeAuf.mockRejectedValueOnce(new Error("bridge kaputt"));

    const ergebnis = (await stelleMarkeBereit("33333333-3333-4333-8333-333333333333")) as {
      ok: boolean;
      fehler?: { code?: string };
    };

    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.fehler?.code).toBe("unbekannter_fehler");
    expect(holeBereiteMarke("33333333-3333-4333-8333-333333333333")).toBe(null);
  });
});

describe("leereMarkenBestand (#312)", () => {
  it("leert alle drei Beraende und loest den FAQstil naechsten Aufruf zu einem NEUEN rufeAuf", async () => {
    const marke = mockMarke();
    h.rufeAuf.mockResolvedValue({ ok: true, wert: marke });

    await stelleMarkeBereit(marke.id);
    expect(h.rufeAuf).toHaveBeenCalledTimes(1);

    leereMarkenBestand();
    expect(holeBereiteMarke(marke.id)).toBe(null);
    expect(h.leereMarkenSchriftBestand).toHaveBeenCalledTimes(1);
    expect(h.leereLogoBestand).toHaveBeenCalledTimes(1);

    await stelleMarkeBereit(marke.id);
    expect(h.rufeAuf).toHaveBeenCalledTimes(2);
  });

  it("zwei aufeinanderfolgende Leeraufrufe werfen nicht und sind wirkungsgleich (idempotent)", () => {
    expect(() => leereMarkenBestand()).not.toThrow();
    expect(() => leereMarkenBestand()).not.toThrow();
    expect(h.leereMarkenSchriftBestand).toHaveBeenCalledTimes(2);
    expect(h.leereLogoBestand).toHaveBeenCalledTimes(2);
  });
});

describe("Grep-Proben auf die Datei (#312)", () => {
  it("kein fs, kein path, kein window.api, kein verbotenes Wort im CODE", async () => {
    const quelle = await import("node:fs");
    const text = (quelle as typeof import("node:fs")).readFileSync(
      "src/renderer/gemeinsam/marken-bereitstellung.ts",
      "utf8",
    );
    const ohneKommentare = text
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");

    // Schutz gegen zu gieriges Abstreifen: Der Kern steht NIEMALS in Kommentaren.
    expect(ohneKommentare).toContain("stelleMarkeBereit");
    expect(ohneKommentare).toContain("leereLogoBestand");

    for (const verboten of [
      "node:fs",
      "from 'path'",
      "window.api",
      "document.",
      "zeichneSegment",
      "marken://",
      "marke.parent",
      "listeMarken",
      "setTimeout",
      "setInterval",
      "ctx.",
    ]) {
      expect(ohneKommentare.includes(verboten)).toBe(false);
    }
  });
});
