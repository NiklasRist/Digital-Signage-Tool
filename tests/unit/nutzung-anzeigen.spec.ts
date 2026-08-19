// Verhaltenstests zu #254 - Die Nutzung einer Vorlage anzeigen.
//
// Gegenstand ist ausschliesslich die REINE Logik in nutzung-anzeigen.ts: der eine IPC-Aufruf
// (holeNutzung, `rufeAuf` als Doppel), das Auslesen aus fehler.daten, die Anzeige-Ableitung
// und der gehaltene Stand. Die .tsx-Anzeige testet eine zweite Datei (nutzung-anzeigen-
// ansicht.spec.ts, jsdom); hier geht es um die Fachlichkeit ohne Browser.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Vorlagennutzung, VorlagenReferenz } from "../../src/shared/contracts/vorlage";
import { KANAELE } from "../../src/shared/contracts/kanaele";

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

import {
  LEERE_NUTZUNG,
  LEERER_NUTZUNGSSTAND,
  baueNutzungsAnzeige,
  beginneLaden,
  giltFuer,
  holeNutzung,
  leseVorlagennutzung,
  uebernimmFehler,
  uebernimmNutzung,
  zaehleProjekte,
} from "../../src/renderer/vorlagen-editor/nutzung-anzeigen";

function referenz(teil: Partial<VorlagenReferenz> = {}): VorlagenReferenz {
  return { projektId: "p-1", projektName: "Projekt", id: "a-1", ...teil };
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LEERE_NUTZUNG und LEERER_NUTZUNGSSTAND", () => {
  it("LEERE_NUTZUNG ist { aktionen: [], listenelemente: [] } und bleibt unveraendert (Object.freeze)", () => {
    expect(LEERE_NUTZUNG).toEqual({ aktionen: [], listenelemente: [] });
    // DoD: Der Test friert sie mit Object.freeze ein - das laeuft ohne Wurf durch.
    expect(() => Object.freeze(LEERE_NUTZUNG)).not.toThrow();
    expect(LEERE_NUTZUNG).toEqual({ aktionen: [], listenelemente: [] });
  });

  it("Kernnachweis - LEERER_NUTZUNGSSTAND ist 'unbekannt', nicht 'frei' (benannter Test)", () => {
    expect(LEERER_NUTZUNGSSTAND).toEqual({
      zustand: "unbekannt",
      vorlagenId: null,
      nutzung: null,
      fehler: null,
    });
  });
});

describe("holeNutzung", () => {
  it("liefert fuer '' ungueltige_eingabe und ruft rufeAuf null Mal", async () => {
    const ergebnis = await holeNutzung("");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("benannter Test - ruft rufeAuf genau einmal mit pruefeVorlagenReferenzen und der Nutzlast { vorlagenId: id } (kein Feld id)", async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: { aktionen: [], listenelemente: [] } });

    await holeNutzung("v-7");

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    const [kanal, nutzlast] = attrappen.rufeAuf.mock.calls[0] as [string, unknown];
    expect(kanal).toBe(KANAELE.vorlagen.pruefeVorlagenReferenzen);
    const schluessel = Object.keys(nutzlast as Record<string, unknown>);
    expect(schluessel).toEqual(["vorlagenId"]);
    expect((nutzlast as Record<string, unknown>).vorlagenId).toBe("v-7");
    expect("id" in (nutzlast as Record<string, unknown>)).toBe(false);
  });

  it("reicht ein ok: false unveraendert durch - Code und Meldung sind toBe-gleich (benannter Test)", async () => {
    const fehler = { ok: false as const, fehler: { code: "speicher_fehler", meldung: "Platte voll" } };
    attrappen.rufeAuf.mockResolvedValue(fehler);

    const ergebnis = await holeNutzung("v-7");

    expect(ergebnis).toBe(fehler);
  });

  it("liefert bei zwei leeren Listen ok: true - ein leeres Ergebnis ist kein Fehler (benannter Test)", async () => {
    const leer = { ok: true as const, wert: { aktionen: [], listenelemente: [] } };
    attrappen.rufeAuf.mockResolvedValue(leer);

    const ergebnis = await holeNutzung("v-7");

    expect(ergebnis).toBe(leer);
  });

  it("faengt ein werfendes rufeAuf als unbekannter_fehler", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("kaputt"));

    const ergebnis = await holeNutzung("v-7");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("leseVorlagennutzung", () => {
  it("liest eine gueltige Nutzlast vollstaendig aus (beide Listen, alle Felder)", () => {
    const nutzung = leseVorlagennutzung({
      aktionen: [referenz({ projektId: "p-1", projektName: "Alpha", id: "a-1" })],
      listenelemente: [referenz({ projektId: "p-2", projektName: "Beta", id: "l-1" })],
    });

    expect(nutzung).toEqual({
      aktionen: [{ projektId: "p-1", projektName: "Alpha", id: "a-1" }],
      listenelemente: [{ projektId: "p-2", projektName: "Beta", id: "l-1" }],
    });
  });

  it("Kernnachweis - liefert bei sieben unlesbaren Formen null, niemals LEERE_NUTZUNG (benannter Test)", () => {
    const unlesbar = [
      undefined,
      null,
      42,
      "text",
      {},
      { aktionen: "x", listenelemente: [] },
      { aktionen: [{ projektName: "P", id: "a-1" }], listenelemente: [] },
    ];
    for (const daten of unlesbar) {
      expect(leseVorlagennutzung(daten), JSON.stringify(daten)).toBeNull();
    }
  });

  it("ueberspringt einzelne unvollstaendige Eintraege und behaelt die uebrigen", () => {
    const nutzung = leseVorlagennutzung({
      aktionen: [
        referenz({ id: "a-1" }),
        { projektId: "p-x" }, // ohne projektName und id -> uebersprungen
        referenz({ id: "a-2" }),
      ],
      listenelemente: [],
    });

    expect(nutzung?.aktionen.map((a) => a.id)).toEqual(["a-1", "a-2"]);
  });

  it("liefert LEERE_NUTZUNG, wenn beide Listen tatsaechlich leer sind", () => {
    expect(leseVorlagennutzung({ aktionen: [], listenelemente: [] })).toBe(LEERE_NUTZUNG);
  });
});

describe("baueNutzungsAnzeige", () => {
  it("liefert fuer LEERE_NUTZUNG frei: true, anzahlProjekte 0, leere gruppen und einen nicht leeren text", () => {
    const anzeige = baueNutzungsAnzeige(LEERE_NUTZUNG);

    expect(anzeige.frei).toBe(true);
    expect(anzeige.anzahlAktionen).toBe(0);
    expect(anzeige.anzahlListenelemente).toBe(0);
    expect(anzeige.anzahlProjekte).toBe(0);
    expect(anzeige.gruppen).toEqual([]);
    expect(anzeige.text.length).toBeGreaterThan(0);
    expect(anzeige.text).toContain("nirgends");
  });

  it("benannter Test - nur Listenelement-Treffer: frei false und der text nennt die Listenelemente (Band-Vorlagen-Fall)", () => {
    const anzeige = baueNutzungsAnzeige({
      aktionen: [],
      listenelemente: [referenz({ id: "l-1" })],
    });

    expect(anzeige.frei).toBe(false);
    expect(anzeige.text).toContain("Listenelement");
    expect(anzeige.text).not.toMatch(/0 Aktionen/);
  });

  it("benannter Test - gemischte Treffer nennen beide Arten im text", () => {
    const anzeige = baueNutzungsAnzeige({
      aktionen: [referenz({ id: "a-1" })],
      listenelemente: [referenz({ id: "l-1" })],
    });

    expect(anzeige.text).toContain("Aktionen");
    expect(anzeige.text).toContain("Listenelementen");
  });

  it("anzahlProjekte ist exakt zaehleProjekte(nutzung)", () => {
    const nutzung: Vorlagennutzung = {
      aktionen: [referenz({ projektId: "p-1" }), referenz({ projektId: "p-2" })],
      listenelemente: [referenz({ projektId: "p-2" })],
    };
    const anzeige = baueNutzungsAnzeige(nutzung);

    expect(anzeige.anzahlProjekte).toBe(zaehleProjekte(nutzung));
    expect(anzeige.anzahlProjekte).toBe(2);
  });

  it("benannter Test - gruppen: je Projekt genau eine, Reihenfolge des ersten Auftretens, unalphabetische Namen", () => {
    const anzeige = baueNutzungsAnzeige({
      aktionen: [
        referenz({ projektId: "z", projektName: "Zebra", id: "a-1" }),
        referenz({ projektId: "a", projektName: "Alpha", id: "a-2" }),
        referenz({ projektId: "z", projektName: "Zebra", id: "a-3" }),
      ],
      listenelemente: [referenz({ projektId: "m", projektName: "Mitte", id: "l-1" })],
    });

    expect(anzeige.gruppen.map((g) => g.projektId)).toEqual(["z", "a", "m"]);
    const zebra = anzeige.gruppen.find((g) => g.projektId === "z");
    expect(zebra?.aktionen.map((a) => a.id)).toEqual(["a-1", "a-3"]);
    expect(zebra?.projektName).toBe("Zebra");
  });

  it("die Summe der Gruppen-Treffer ist anzahlAktionen bzw. anzahlListenelemente - kein Treffer geht verloren oder erscheint doppelt", () => {
    const anzeige = baueNutzungsAnzeige({
      aktionen: [referenz({ id: "a-1" }), referenz({ id: "a-2" })],
      listenelemente: [referenz({ id: "l-1" })],
    });

    const summeAktionen = anzeige.gruppen.reduce((s, g) => s + g.aktionen.length, 0);
    const summeListen = anzeige.gruppen.reduce((s, g) => s + g.listenelemente.length, 0);
    expect(summeAktionen).toBe(anzeige.anzahlAktionen);
    expect(summeListen).toBe(anzeige.anzahlListenelemente);
  });

  it("veraendert seine Eingabe nicht (Object.freeze)", () => {
    const nutzung = Object.freeze({
      aktionen: [referenz({ id: "a-1" })],
      listenelemente: [referenz({ id: "l-1" })],
    });

    expect(() => baueNutzungsAnzeige(nutzung)).not.toThrow();
  });
});

describe("zaehleProjekte", () => {
  it("benannter Test - ein Projekt in beiden Listen zaehlt einmal", () => {
    const anzahl = zaehleProjekte({
      aktionen: [referenz({ projektId: "p-1" })],
      listenelemente: [referenz({ projektId: "p-1" })],
    });

    expect(anzahl).toBe(1);
  });

  it("veraendert seine Eingabe nicht (Object.freeze)", () => {
    const nutzung = Object.freeze({
      aktionen: [referenz({ id: "a-1" })],
      listenelemente: [],
    });

    expect(() => zaehleProjekte(nutzung)).not.toThrow();
  });
});

describe("Nutzungsstand-Uebergaenge", () => {
  it("beginneLaden setzt zustand 'laedt' und vorlagenId, nutzung und fehler auf null", () => {
    const stand = beginneLaden(LEERER_NUTZUNGSSTAND, "v-7");

    expect(stand.zustand).toBe("laedt");
    expect(stand.vorlagenId).toBe("v-7");
    expect(stand.nutzung).toBeNull();
    expect(stand.fehler).toBeNull();
  });

  it("uebernimmNutzung setzt zustand 'geladen', nutzung (toBe) und fehler null", () => {
    const nutzung: Vorlagennutzung = { aktionen: [], listenelemente: [] };
    const stand = uebernimmNutzung(beginneLaden(LEERER_NUTZUNGSSTAND, "v-7"), "v-7", nutzung);

    expect(stand.zustand).toBe("geladen");
    expect(stand.nutzung).toBe(nutzung);
    expect(stand.fehler).toBeNull();
  });

  it("uebernimmFehler setzt zustand 'fehler', fehler und laesst nutzung auf null", () => {
    const stand = uebernimmFehler(beginneLaden(LEERER_NUTZUNGSSTAND, "v-7"), "v-7", "nicht_gefunden", "gibt es nicht");

    expect(stand.zustand).toBe("fehler");
    expect(stand.fehler).toEqual({ code: "nicht_gefunden", meldung: "gibt es nicht" });
    expect(stand.nutzung).toBeNull();
  });

  it("Kernnachweis - uebernimmNutzung und uebernimmFehler mit anderer vorlagenId liefern den toBe-gleichen Stand (benannter Test)", () => {
    const laufend = beginneLaden(LEERER_NUTZUNGSSTAND, "v-1");

    expect(uebernimmNutzung(laufend, "v-2", { aktionen: [], listenelemente: [] })).toBe(laufend);
    expect(uebernimmFehler(laufend, "v-2", "x", "y")).toBe(laufend);
  });

  it("benannter Test - beginneLaden liefert ein neues Objekt und laesst den Stand unveraendert (Object.freeze)", () => {
    const eingefroren = Object.freeze(LEERER_NUTZUNGSSTAND);

    expect(beginneLaden(eingefroren, "v-1")).not.toBe(eingefroren);
    expect(() => beginneLaden(eingefroren, "v-1")).not.toThrow();
    expect(eingefroren).toEqual(LEERER_NUTZUNGSSTAND);
  });

  it("benannter Test - uebernimmNutzung liefert ein neues Objekt und laesst den Stand unveraendert (Object.freeze)", () => {
    const laufend = beginneLaden(LEERER_NUTZUNGSSTAND, "v-1");
    const eingefroren = Object.freeze(laufend);

    const neuer = uebernimmNutzung(eingefroren, "v-1", { aktionen: [], listenelemente: [] });

    expect(neuer).not.toBe(eingefroren);
    expect(() => uebernimmNutzung(eingefroren, "v-1", { aktionen: [], listenelemente: [] })).not.toThrow();
    expect(eingefroren).toEqual(laufend);
  });

  it("benannter Test - uebernimmFehler liefert ein neues Objekt und laesst den Stand unveraendert (Object.freeze)", () => {
    const laufend = beginneLaden(LEERER_NUTZUNGSSTAND, "v-1");
    const eingefroren = Object.freeze(laufend);

    const neuer = uebernimmFehler(eingefroren, "v-1", "x", "y");

    expect(neuer).not.toBe(eingefroren);
    expect(() => uebernimmFehler(eingefroren, "v-1", "x", "y")).not.toThrow();
    expect(eingefroren).toEqual(laufend);
  });
});

describe("giltFuer", () => {
  it("giltFuer(LEERER_NUTZUNGSSTAND, 'a') ist false; true nur bei uebereinstimmender vorlagenId und zustand 'geladen'", () => {
    expect(giltFuer(LEERER_NUTZUNGSSTAND, "a")).toBe(false);

    const laedt = beginneLaden(LEERER_NUTZUNGSSTAND, "a");
    expect(giltFuer(laedt, "a")).toBe(false); // laedt, nicht geladen

    const geladen = uebernimmNutzung(laedt, "a", { aktionen: [], listenelemente: [] });
    expect(giltFuer(geladen, "a")).toBe(true);
    expect(giltFuer(geladen, "b")).toBe(false);
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const CODE = readFileSync("src/renderer/vorlagen-editor/nutzung-anzeigen.ts", "utf8");
  const IMPORTE = CODE.split("\n").filter((z) => z.trim().startsWith("import "));

  it("enthaelt kein JSX, kein react, kein abonniere, kein setInterval/setTimeout, kein Literal 'vorlagen:', kein entferneVorlage/bearbeiteVorlage/ueberarbeiteVorlage, kein window, kein Project und keinen Import aus src/main oder fremden Renderer-Modulen", () => {
    for (const verboten of [
      "<div",
      "react",
      "abonniere",
      "setInterval",
      "setTimeout",
      "'vorlagen:",
      "entferneVorlage",
      "bearbeiteVorlage",
      "ueberarbeiteVorlage",
      "window.",
      "Project",
      "src/main",
    ]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
    // Renderer-interne Imports (ein Verzeichnis hoch, nicht shared): nur rufe-auf.
    // Vorsicht: `'../../shared` enthaelt den Teilstring `'../` - daher Pfad via Regex pruefen.
    const rendererIntern = IMPORTE.filter((z) => {
      const pfad = z.match(/from\s+['"]([^'"]+)['"]/)?.[1] ?? "";
      return pfad.startsWith("../") && !pfad.startsWith("../../");
    });
    expect(rendererIntern).toEqual([`import { rufeAuf } from '../ipc-client/rufe-auf'`]);
    // Kein Import aus src/main.
    expect(IMPORTE.join("\n")).not.toContain("src/main");
  });

  it("sendet die vorlagenId nicht als blossen String und keine Nutzlast der Form { id:", () => {
    // Die Nutzlast ist { vorlagenId } - als Objekt, nicht als String-Kanalargument.
    expect(CODE).toContain("{ vorlagenId }");
    expect(CODE).not.toContain("{ id:");
    // kein rufeAuf-Aufruf mit der vorlagenId als blossem String:
    expect(CODE).not.toContain("rufeAuf(KANAELE.vorlagen.pruefeVorlagenReferenzen, vorlagenId)");
  });

  it("importiert die Vorlagentypen aus shared/contracts/vorlage und nicht aus src/main", () => {
    expect(CODE).toContain(
      "import type { Vorlagennutzung, VorlagenReferenz } from '../../shared/contracts/vorlage'",
    );
    expect(CODE).not.toContain("src/main");
  });
});