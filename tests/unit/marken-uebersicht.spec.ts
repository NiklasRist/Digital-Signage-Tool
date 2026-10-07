// Verhaltenstest zu #295 - die gemeinsame Marken-Sicht des marken-editors.
//
// Alle Wege mit Doppeln (rufeAuf); der Mechanismus leereMarkenBestand (#312) ist ein Spion.
// Der tragende Punkt: uebernimmAktualisierteMarke setzt SYNCHRON, bevor das Nachladen
// angestossen wird - die Reihenfolge wird per Aufzeichner gemessen, nicht behauptet.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Marke } from "../../src/shared/contracts/marke";

const h = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  leereMarkenBestand: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({ rufeAuf: h.rufeAuf }));
vi.mock("../../src/renderer/gemeinsam/marken-bereitstellung", () => ({
  leereMarkenBestand: h.leereMarkenBestand,
}));

const {
  ladeUebersicht,
  holeUebersicht,
  aufUebersichtGeaendert,
  oeffneMarke,
  holeGeoeffneteMarke,
  aufGeoeffneteMarkeGeaendert,
  erstelleEigenstaendigeMarke,
  uebernimmAktualisierteMarke,
} = await import("../../src/renderer/marken-editor/marken-uebersicht");

/** Eine minimale Marke-Attrappe mit denselben Struktur-Zusaetzen. */
function attrappeMarke(id: string, name = "Partner GmbH"): Marke {
  return {
    id,
    name,
    parent: null,
    eingebaut: false,
    farben: {},
    schriften: {},
    logo: null,
    sicherheit: { horizontal: 96, vertikal: 54 },
    radien: {},
    schatten: { versatzY: 2, weichzeichnen: 6, farbe: "#000" },
    slogan: { text: "", aktiv: false },
    herkunftJeFeld: {} as never,
  } as unknown as Marke;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.rufeAuf.mockResolvedValue({
    ok: false,
    fehler: { code: "marke_nicht_gefunden", meldung: "vorgestellt" },
  });
});

describe("ladeUebersicht (#295)", () => {
  it("ruft marken:listeMarken GENAU EINMAL, setzt die Sicht und meldet DANACH die Hoerer", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [attrappeMarke("A"), attrappeMarke("B")] });
    const empfangen: unknown[] = [];
    aufUebersichtGeaendert((u) => empfangen.push(u));

    const antwort = await ladeUebersicht();

    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(antwort.ok).toBe(true);
    expect(holeUebersicht()?.marken.map((m: Marke) => m.id)).toEqual(["A", "B"]);
    // Der Hoerer liegt NACH dem Setzen an: er sieht DIESELBE Referenz wie die Sicht.
    expect(empfangen).toHaveLength(1);
    expect((empfangen[0] as { marken: readonly Marke[] }).marken).toBe(holeUebersicht()?.marken);
  });

  it("scheitert das Laden, bleibt die alte Sicht UNVERAENDERT und kein Hoerer laeuft an", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [attrappeMarke("A")] });
    await ladeUebersicht();

    const empfangen: unknown[] = [];
    aufUebersichtGeaendert((u) => empfangen.push(u));

    h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });
    const antwort = await ladeUebersicht();

    expect(antwort.ok).toBe(false);
    expect(holeUebersicht()?.marken.map((m: Marke) => m.id)).toEqual(["A"]);
    expect(empfangen).toHaveLength(0);
  });

  it("die Reihenfolge der Liste bleibt bestandsgetreu - kein Sortieren", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [attrappeMarke("Z"), attrappeMarke("A"), attrappeMarke("M")] });
    await ladeUebersicht();
    expect(holeUebersicht()?.marken.map((m: Marke) => m.id)).toEqual(["Z", "A", "M"]);
  });
});

describe("oeffneMarke (#295)", () => {
  it("scheitert das Lesen, bleibt die geoeffnete Marke unverändert und keine Attrappe wird gesetzt", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code: "marke_nicht_gefunden", meldung: "x" } });
    const antwort = await oeffneMarke("Q");

    expect(antwort.ok).toBe(false);
    expect((antwort as { fehler: { code: string } }).fehler.code).toBe("marke_nicht_gefunden");
    expect(holeGeoeffneteMarke()).toBe(null);
  });

  it("leere markeId: ungueltige_eingabe OHNE IPC; die geoeffnete Marke bleibt unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [attrappeMarke("A")] });
    await ladeUebersicht();
    const geoeffnet = attrappeMarke("B");
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: geoeffnet });
    await oeffneMarke("B");

    const antwort = await oeffneMarke("");

    expect((antwort as { ok: boolean }).ok).toBe(false);
    expect(h.rufeAuf.mock.calls).toHaveLength(2); // kein dritter Aufruf
    expect(holeGeoeffneteMarke()?.id).toBe("B");
  });

  it("liest IMMER ueber marken:leseMarke, NIE aus der Liste; bei Erfolg wird die geoeffnete Marke gesetzt", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [attrappeMarke("A")] });
    await ladeUebersicht();

    const geoeffnet = attrappeMarke("B");
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: geoeffnet });
    const antwort = await oeffneMarke("B");

    // ZWEI Aufrufe insgesamt: EINMAL listeMarken (Laden), EINMAL leseMarke (Oeffnen).
    expect(h.rufeAuf.mock.calls).toHaveLength(2);
    expect(h.rufeAuf.mock.calls[1]).toEqual(["marken:leseMarke", { markeId: "B" }]);
    expect(antwort.ok).toBe(true);
    expect(holeGeoeffneteMarke()).toBe(geoeffnet);
  });
});


describe("erstelleEigenstaendigeMarke (#295)", () => {
  it("sendet GENAU { name, parentId: null } - das Feld parentId ist VORHANDEN", async () => {
    const neu = attrappeMarke("N");
    h.rufeAuf.mockImplementation(async (kanal: string, nutzlast: unknown) => {
      if (kanal === "marken:erstelleMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:leseMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:listeMarken") return { ok: true as const, wert: [attrappeMarke("A"), neu] };
      return { ok: false as const, fehler: { code: "unbekannter_fehler", meldung: kanal } };
    });

    const antwort = await erstelleEigenstaendigeMarke("Partner GmbH");

    const ruf = h.rufeAuf.mock.calls.find((c) => c[0] === "marken:erstelleMarke")!;
    const nutzlast = ruf[1] as Record<string, unknown>;
    expect("parentId" in nutzlast).toBe(true);
    expect(nutzlast["parentId"] === null).toBe(true);
    expect(nutzlast["name"]).toBe("Partner GmbH");
    expect(antwort.ok).toBe(true);
  });

  it("nach dem Anlegen: oeffneMarke GENAU EINMAL mit der neuen id, danach ladeUebersicht genau einmal (Spy-Reihenfolge)", async () => {
    const neu = attrappeMarke("N");
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      if (kanal === "marken:erstelleMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:leseMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:listeMarken") return { ok: true as const, wert: [neu] };
      return { ok: false as const, fehler: { code: "unbekannter_fehler", meldung: kanal } };
    });

    const antwort = await erstelleEigenstaendigeMarke("Partner GmbH");

    const kanalFolgenger = h.rufeAuf.mock.calls.map((c) => c[0]);
    const anlegen = kanalFolgenger.indexOf("marken:erstelleMarke")!;
    const lesen = kanalFolgenger.indexOf("marken:leseMarke")!;
    const laden = kanalFolgenger.indexOf("marken:listeMarken")!;
    expect(anlegen).toBeLessThan(lesen);
    expect(lesen).toBeLessThan(laden);
    // oeffneMarke GENAU EINMAL: leseMarke GERADE EINMAL ausserhalb des Anlegens.
    expect(kanalFolgenger.filter((k) => k === "marken:leseMarke")).toHaveLength(1);
    expect((antwort as { wert: Marke }).wert.id).toBe("N");
    expect(holeGeoeffneteMarke()?.id).toBe("N");
  });

  it("scheitert das Anlegen: oeffneMarke und ladeUebersicht werden NULL Mal gerufen, Code unverändert", async () => {
    h.rufeAuf.mockResolvedValueOnce({ ok: false, fehler: { code: "ungueltige_eingabe", meldung: "zu lang (80)" } });

    const antwort = (await erstelleEigenstaendigeMarke("X".repeat(200))) as { fehler: { code: string } };

    expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    // GENAU EIN rufeAuf (das Anlegen); weder leseMarke noch listeMarken wurden gerufen.
    expect(h.rufeAuf).toHaveBeenCalledTimes(1);
    expect(h.leereMarkenBestand).not.toHaveBeenCalled();
  });

  it("leerer oder Leerzeichen-Name: ungueltige_eingabe OHNE jeden IPC-Aufruf", async () => {
    expect((await erstelleEigenstaendigeMarke("")).ok).toBe(false);
    expect((await erstelleEigenstaendigeMarke("   ")).ok).toBe(false);
    expect(h.rufeAuf).not.toHaveBeenCalled();
    expect(h.leereMarkenBestand).not.toHaveBeenCalled();
  });

  it("ein 200-Zeichen-Name wird UNVERAENDERT gesendet (kein trim, keine eigene Grenze)", async () => {
    const neu = attrappeMarke("N");
    h.rufeAuf.mockImplementation(async (kanal: string, nutzlast: unknown) => {
      if (kanal === "marken:erstelleMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:leseMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:listeMarken") return { ok: true as const, wert: [neu] };
      return { ok: false as const, fehler: { code: "unbekannter_fehler", meldung: kanal } };
    });

    const lang = " " + "X".repeat(200) + " ";
    await erstelleEigenstaendigeMarke(lang);

    const ruf = h.rufeAuf.mock.calls.find((c) => c[0] === "marken:erstelleMarke")!;
    expect((ruf[1] as Record<string, unknown>)["name"]).toBe(lang); // UNVERAENDERT
  });

  it("scheitert das Oeffnen NACH erfolgreichem Anlegen: ladeUebersicht laeuft TROTZDEM, kein Aufräum-Aufruf", async () => {
    const neu = attrappeMarke("N");
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      if (kanal === "marken:erstelleMarke") return { ok: true as const, wert: neu };
      if (kanal === "marken:leseMarke") return { ok: false as const, fehler: { code: "unbekannter_fehler", meldung: "lesen" } };
      if (kanal === "marken:listeMarken") return { ok: true as const, wert: [neu] };
      return { ok: false as const, fehler: { code: "unbekannter_fehler", meldung: kanal } };
    });

    const antwort = (await erstelleEigenstaendigeMarke("Partner GmbH")) as { fehler: { code: string } };

    expect(antwort.fehler.code).toBe("unbekannter_fehler");
    expect(h.rufeAuf.mock.calls.filter((c) => c[0] === "marken:listeMarken")).toHaveLength(1);
    // keine Aufräum-Handlung: kein loescheMarke-Weg in dieser Datei (Grep-Probe separat).
    expect(h.leereMarkenBestand).not.toHaveBeenCalled();
  });
});

describe("uebernimmAktualisierteMarke (#295, mit #312)", () => {
  // oeffneMarke liest NUR ueber marken:leseMarke (ENTSCHIEDEN 3); die Listen-Antwort
  // dient allein dem Nachladen im Leeren-Weg von uebernimmAktualisierteMarke (#312).
  function stelleGeoeffnetBereit(): void {
    h.rufeAuf.mockResolvedValueOnce({ ok: true, wert: attrappeMarke("B") }); // leseMarke
    h.rufeAuf.mockResolvedValue({ ok: true, wert: [attrappeMarke("A"), attrappeMarke("B")] }); // danach
  }

  it("mit PASSENDER id: geoeffnete Marke synchron NEU, danach leeren und Nachladen (Reihenfolge)", async () => {
    stelleGeoeffnetBereit();
    await oeffneMarke("B");
    h.rufeAuf.mockClear();

    // Aufzeichner: der Weg von uebernimmAktualisierteMarke wird GEMESSEN.
    const folge: string[] = [];
    h.leereMarkenBestand.mockImplementation(() => {
      folge.push("leeren");
    });
    h.rufeAuf.mockImplementation(async (kanal: string) => {
      folge.push(kanal);
      return { ok: true as const, wert: [attrappeMarke("A"), attrappeMarke("B")] };
    });

    const aktualisiert = attrappeMarke("B");
    aktualisiert.name = "Partner GmbH (neu)";
    uebernimmAktualisierteMarke(aktualisiert);

    // SYNCHRON: die geoeffnete Marke ist schon neu, BEVOR irgendwas asynchron laeuft.
    expect(holeGeoeffneteMarke()?.name).toBe("Partner GmbH (neu)");
    // Reihenfolge: zuerst LEEREN (#312), dann das Nachladen der Liste.
    expect(folge).toEqual(["leeren", "marken:listeMarken"]);
  });

  it("mit ABWEICHENDER id: geoeffnete Marke UNVERAENDERT, trotzdem ladeUebersicht + leereMarkenBestand", async () => {
    stelleGeoeffnetBereit();
    await oeffneMarke("B");
    h.rufeAuf.mockClear();

    uebernimmAktualisierteMarke(attrappeMarke("FREMD"));

    expect(holeGeoeffneteMarke()?.id).toBe("B");
    expect(h.leereMarkenBestand).toHaveBeenCalledTimes(1);
    expect(h.rufeAuf.mock.calls.map((c) => c[0])).toEqual(["marken:listeMarken"]);
  });

  it("scheitert das Nachladen: geöffnete Marke bleibt sync gesetzt gehalten und kein Fehler nach außen", async () => {
    stelleGeoeffnetBereit();
    await oeffneMarke("B");
    h.rufeAuf.mockClear();
    h.rufeAuf.mockResolvedValue({ ok: false, fehler: { code: "speicher_fehler", meldung: "x" } });

    expect(() => uebernimmAktualisierteMarke(attrappeMarke("B"))).not.toThrow();
    expect(holeGeoeffneteMarke()?.id).toBe("B");
  });
});

describe("Grep-Proben auf marken-uebersicht.ts (#295)", () => {
  async function quelle(): Promise<string> {
    const { readFileSync } = await import("node:fs");
    return readFileSync("src/renderer/marken-editor/marken-uebersicht.ts", "utf8");
  }

  function ohneKommentare(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");
  }

  it("kein verbotenes Muster im CODE", async () => {
    const text = ohneKommentare(await quelle());

    // Schutz gegen zu gieriges Abstreifen: die Kennzeichen des Codes stehen IMMER noch drin.
    expect(text).toContain("ladeUebersicht");
    expect(text).toContain("leereMarkenBestand");

    for (const verboten of [
      "sort(",
      "löscheMarke",
      "loescheMarke",
      "node:fs",
      "setTimeout",
      "setInterval",
      "abonniere",
      "autoSpeichernStatus",
      "marke-ableiten",
      "'marken:",
    ]) {
      expect(text.includes(verboten)).toBe(false);
    }
    // trim() entsteht in dieser Datei NUR in den beiden Leer-Pruefungen - jede Trefferstelle
    // ist die reine Pruefung, keine eigene Namensreparatur.
    const trimStellen = text.match(/\w+\.trim\(\)/g) ?? [];
    expect(trimStellen).toHaveLength(2); // markeId (oeffneMarke) und name (erstelle...)
  });

  it("kein zweiter Parameter und keine parent-Leak bei erstelleEigenstaendigeMarke", async () => {
    const text = ohneKommentare(await quelle());
    expect(text.includes("parentId?:")).toBe(false);
    expect(text.includes("parentId ??")).toBe(false);
    expect(text.includes("ersterParameter")).toBe(false);
  });
});
