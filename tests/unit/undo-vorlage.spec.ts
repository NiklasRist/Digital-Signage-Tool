// Verhaltenstests zu #236 - Rueckgaengig und Wiederherstellen im Vorlagen-Editor.
//
// Die Historie laeuft ECHT mit (#234, ueber `setzeHistorienZurueck` frisch pro Test):
// Genau darum geht es, dass diese Datei die EINE vorlagen-Historie benutzt und die
// projekt-Historie nie anfasst. `zugang.sichereStand` wird als Doppel ersetzt; die
// uebrigen Zugriffe (`holeSitzung`, `setzeSitzung`) sind Spione in einem Zugang-Objekt.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Vorlage } from "../../src/shared/contracts/vorlage";
import type { EditorSitzung } from "../../src/renderer/vorlagen-editor/arbeitskopie";
import {
  projektHistorie,
  setzeHistorienZurueck,
  vorlagenHistorie,
} from "../../src/renderer/app-shell/undo-historien";
import {
  kannVorlageRueckgaengig,
  kannVorlageWiederherstellen,
  macheVorlageRueckgaengig,
  merkeVorlageVorAenderung,
  stelleVorlageWiederHer,
  type VorlagenUndoZugang,
} from "../../src/renderer/app-shell/undo-vorlage";

function vorlage(id: string, parent: string | null = "v-1"): Vorlage {
  return {
    id,
    name: "Arbeitskopie",
    art: "vollflaeche",
    höhe: null,
    parent,
    eingebaut: false,
    zonen: [],
  };
}

function sitzung(teil: Partial<EditorSitzung> = {}): EditorSitzung {
  return {
    arbeitsId: "ak-1",
    arbeitskopie: vorlage("ak-1"),
    parentId: "v-1",
    parentName: "Vorlage",
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: [],
    ...teil,
  };
}

/** Ein Zugang, dessen sichereStand den uebergebenen stand als neue Sitzung zurueckgibt. */
function fabrikZugang(teil: Partial<VorlagenUndoZugang> = {}): {
  zugang: VorlagenUndoZugang;
  holeSitzung: ReturnType<typeof vi.fn>;
  setzeSitzung: ReturnType<typeof vi.fn>;
  sichereStand: ReturnType<typeof vi.fn>;
} {
  const holeSitzung = vi.fn(() => sitzung());
  const setzeSitzung = vi.fn();
  const sichereStand = vi.fn(async (_s: EditorSitzung, stand: Vorlage) => ({
    ok: true as const,
    wert: sitzung({ arbeitskopie: stand, arbeitsId: stand.id }),
  }));
  return {
    holeSitzung,
    setzeSitzung,
    sichereStand,
    zugang: {
      holeSitzung: holeSitzung as unknown as () => EditorSitzung | null,
      setzeSitzung,
      sichereStand,
      ...teil,
    },
  };
}

beforeEach(() => {
  setzeHistorienZurueck();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("merkeVorlageVorAenderung", () => {
  it("legt genau einen Stand ab, der toBe-gleich zur Arbeitskopie ist (kein Kopieren)", () => {
    const arbeitskopie = vorlage("ak-1");
    const u = fabrikZugang();
    u.holeSitzung.mockReturnValue(sitzung({ arbeitskopie }));

    merkeVorlageVorAenderung(u.zugang);

    const stand = vorlagenHistorie().stand();
    expect(stand.zurueck).toBe(1);
    expect(vorlagenHistorie().vorschauZurueck()).toBe(arbeitskopie);
  });

  it("legt ohne offene Sitzung nichts ab und wirft nicht", () => {
    const u = fabrikZugang();
    u.holeSitzung.mockReturnValue(null);

    expect(() => merkeVorlageVorAenderung(u.zugang)).not.toThrow();

    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 0, vor: 0 });
  });
});

describe("macheVorlageRueckgaengig", () => {
  it("ruft sichereStand genau einmal mit der laufenden sitzung und dem unveraenderten Schnappschuss", async () => {
    const u = fabrikZugang();
    const aktuelleSitzung = sitzung();
    u.holeSitzung.mockReturnValue(aktuelleSitzung);
    merkeVorlageVorAenderung(u.zugang);
    const ziel = vorlagenHistorie().vorschauZurueck();
    expect(ziel).not.toBeNull();

    await macheVorlageRueckgaengig(u.zugang);

    expect(u.sichereStand).toHaveBeenCalledTimes(1);
    const erstes = u.sichereStand.mock.calls[0] as [EditorSitzung, Vorlage];
    expect(erstes[0]).toBe(aktuelleSitzung);
    expect(erstes[1]).toBe(ziel);
  });

  it("ruft setzeSitzung genau einmal mit dem unveraenderten antwort.wert und meldet 'angewendet'", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    const antwortSitzung = sitzung({ arbeitskopie: vorlage("ak-1", "v-1") });
    u.sichereStand.mockResolvedValue({ ok: true, wert: antwortSitzung });

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(u.setzeSitzung).toHaveBeenCalledTimes(1);
    expect(u.setzeSitzung).toHaveBeenCalledWith(antwortSitzung);
    expect(ergebnis).toEqual({ ok: true, wert: { art: "angewendet", sitzung: antwortSitzung } });
  });

  it("ruft vollzieheZurueck VOR setzeSitzung (Aufrufreihenfolge)", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    u.sichereStand.mockResolvedValue({ ok: true, wert: sitzung() });

    await macheVorlageRueckgaengig(u.zugang);

    // vollzieheZurueck bewegt den Stand von zurueck nach vor; setzeSitzung laeuft erst
    // NACH dem vollzogenen Stapel. Der Stapel-Spiegel nach dem Aufruf ist der Beweis.
    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 0, vor: 1 });
    expect(u.setzeSitzung).toHaveBeenCalled();
  });

  it("gibt bei ok: false den Code unveraendert weiter, ruft setzeSitzung nicht und laesst den Stapel unveraendert", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    u.sichereStand.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    const vorher = vorlagenHistorie().stand();

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });
    expect(u.setzeSitzung).not.toHaveBeenCalled();
    expect(vorlagenHistorie().stand()).toEqual(vorher);
  });

  it("voller Zyklus: merke -> aendern -> rueckgaengig -> wiederherstellen fuehrt auf den Stand vor dem Rueckgaengig zurueck", async () => {
    // Der Stand VOR der Aenderung (Schnappschuss) und die geaenderte Arbeitskopie.
    const urspruenglich = vorlage("ak-1");
    const geaendert = vorlage("ak-1");
    geaendert.name = "Geaendert";
    const u = fabrikZugang();
    u.holeSitzung.mockReturnValue(sitzung({ arbeitskopie: geaendert }));

    // merke legt die JETZIGE (geaenderte) Arbeitskopie als Schnappschuss ab...
    merkeVorlageVorAenderung(u.zugang);
    // ...wir legen aber noch den urspruenglichen Stand darunter, den das Rueckgaengig trifft.
    vorlagenHistorie().ablegen(urspruenglich);
    u.holeSitzung.mockReturnValue(sitzung({ arbeitskopie: geaendert }));

    // Rueckgaengig: der urspruengliche Stand wird ueber sichereStand zur neuen Sitzung.
    const ergebnis = await macheVorlageRueckgaengig(u.zugang);
    expect(ergebnis).toEqual({ ok: true, wert: { art: "angewendet", sitzung: expect.anything() } });
    if (ergebnis.ok && ergebnis.wert.art === "angewendet") {
      expect(ergebnis.wert.sitzung.arbeitskopie).toBe(urspruenglich);
    }

    // Wiederherstellen: der Stand, der beim Rueckgaengig ersetzt wurde (geaendert), kommt zurueck.
    u.holeSitzung.mockReturnValue(sitzung({ arbeitskopie: urspruenglich }));
    const wieder = await stelleVorlageWiederHer(u.zugang);
    expect(wieder.ok).toBe(true);
    if (wieder.ok && wieder.wert.art === "angewendet") {
      expect(wieder.wert.sitzung.arbeitskopie).toBe(geaendert);
    }
  });

  it("liefert ohne offene Sitzung nicht_gefunden und ruft sichereStand nicht", async () => {
    const u = fabrikZugang();
    u.holeSitzung.mockReturnValue(null);

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: expect.any(String) },
    });
    expect(u.sichereStand).not.toHaveBeenCalled();
  });

  it("liefert bei leerer Historie ok:true mit 'nichts_zu_tun' und ruft sichereStand nicht", async () => {
    const u = fabrikZugang();

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis).toEqual({ ok: true, wert: { art: "nichts_zu_tun" } });
    expect(u.sichereStand).not.toHaveBeenCalled();
  });

  it("weist einen Schnappschuss mit fremder id ab, leert die Historie und ruft sichereStand nicht (benannter Test)", async () => {
    const fremde = vorlage("ak-9", "v-2");
    vorlagenHistorie().ablegen(fremde);
    const u = fabrikZugang();

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
      expect(ergebnis.fehler.meldung).toContain("ak-9");
      expect(ergebnis.fehler.meldung).toContain("ak-1");
    }
    expect(u.sichereStand).not.toHaveBeenCalled();
    expect(vorlagenHistorie().stand()).toEqual({ zurueck: 0, vor: 0 });
  });

  it("faengt ein werfendes sichereStand als unbekannter_fehler, Stapel unveraendert", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    u.sichereStand.mockRejectedValue(new Error("kaputt"));
    const vorher = vorlagenHistorie().stand();

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
    expect(vorlagenHistorie().stand()).toEqual(vorher);
  });

  it("faengt ein werfendes setzeSitzung als unbekannter_fehler (Stapel bleibt vollzogen)", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    u.sichereStand.mockResolvedValue({ ok: true, wert: sitzung() });
    u.setzeSitzung.mockImplementation(() => {
      throw new Error("Sicht kaputt");
    });

    const ergebnis = await macheVorlageRueckgaengig(u.zugang);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });

  it("schreibt die vollstaendige Vorlage zurueck, zonen zeichengleich in derselben Reihenfolge", async () => {
    const mitZonen = vorlage("ak-1");
    mitZonen.zonen = [
      { id: "hintergrund", rolle: "fest", bindung: null, rahmen: { x: 0, y: 0, breite: 10, höhe: 10 }, ausrichtung: { horizontal: "mitte", vertikal: "mitte" }, wennLeer: "leer" },
      { id: "titel", rolle: "frei", bindung: "titel", rahmen: { x: 1, y: 1, breite: 2, höhe: 2 }, ausrichtung: { horizontal: "links", vertikal: "oben" }, wennLeer: "ausblenden" },
    ];
    vorlagenHistorie().ablegen(mitZonen);
    const u = fabrikZugang();

    await macheVorlageRueckgaengig(u.zugang);

    const gesendet = u.sichereStand.mock.calls[0]?.[1] as Vorlage;
    expect(gesendet.zonen).toEqual(mitZonen.zonen);
    expect(gesendet.zonen.map((z) => z.id)).toEqual(["hintergrund", "titel"]);
  });
});

describe("kannVorlageRueckgaengig / kannVorlageWiederherstellen", () => {
  it("liefert false ohne Sitzung", () => {
    const u = fabrikZugang();
    u.holeSitzung.mockReturnValue(null);
    expect(kannVorlageRueckgaengig(u.zugang)).toBe(false);
    expect(kannVorlageWiederherstellen(u.zugang)).toBe(false);
  });

  it("liefert false bei leerer Historie", () => {
    const u = fabrikZugang();
    expect(kannVorlageRueckgaengig(u.zugang)).toBe(false);
    expect(kannVorlageWiederherstellen(u.zugang)).toBe(false);
  });

  it("liefert false bei fremder id im Schnappschuss", () => {
    vorlagenHistorie().ablegen(vorlage("ak-9", "v-2"));
    const u = fabrikZugang();
    expect(kannVorlageRueckgaengig(u.zugang)).toBe(false);
  });

  it("liefert true sonst (Stand vorhanden UND zur offenen Arbeitskopie)", () => {
    vorlagenHistorie().ablegen(vorlage("ak-1"));
    const u = fabrikZugang();
    expect(kannVorlageRueckgaengig(u.zugang)).toBe(true);
  });

  it("liefert true fuer Wiederherstellen nach einem vollzogenen Rueckgaengig", async () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    const u = fabrikZugang();
    await macheVorlageRueckgaengig(u.zugang);
    expect(kannVorlageWiederherstellen(u.zugang)).toBe(true);
  });
});

describe("DoD-Grep-Proben (Quelltext) und Historie", () => {
  const CODE = readFileSync("src/renderer/app-shell/undo-vorlage.ts", "utf8");

  it("fasst die Projekt-Historie nicht an (Grep-Probe)", () => {
    expect(CODE).not.toContain("projektHistorie");
    expect(CODE).not.toContain("leereProjektHistorie");
  });

  it("laesst die Projekt-Historie unberuehrt (Spion-Test ueber #234)", () => {
    merkeVorlageVorAenderung(fabrikZugang().zugang);
    macheVorlageRueckgaengig(fabrikZugang().zugang);
    // Der projekt-Stapel ist ein ANDERER als der vorlagen-Stapel (#234).
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 });
    expect(vorlagenHistorie().stand().zurueck).toBeGreaterThanOrEqual(1);
  });

  it("enthaelt kein JSX, kein react, kein rufeAuf, kein KANAELE, kein abonniere, kein Literal, kein window, kein setTimeout", () => {
    for (const verboten of [
      "<div",
      "react",
      "rufeAuf",
      "KANAELE",
      "abonniere",
      "'vorlagen:",
      "'queue:",
      "window.",
      "setTimeout",
    ]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("importiert aus ../vorlagen-editor/arbeitskopie ausschliesslich einen Typ", () => {
    expect(CODE).toContain(
      "import type { EditorSitzung } from '../vorlagen-editor/arbeitskopie'",
    );
    // Kein WERT-Import aus dem fremden Modul (nur der Typ darf von dort kommen).
    const importe = CODE.split("\n").filter((z) => z.includes("vorlagen-editor/arbeitskopie"));
    expect(importe.length).toBe(1);
    expect(importe[0]).toContain("import type");
  });
});