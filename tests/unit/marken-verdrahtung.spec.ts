// Verhaltenstest zu #304 - die Anmeldung der neun marken-Kanaele.
//
// Gemockt wird `electron` (wie in project-store-verdrahtung.spec.ts) und jede Fachoperation.
// Der Wrapper #23 laeuft dagegen ECHT mit: Er ist der Weg, den die Nutzlast im Betrieb
// nimmt, und an ihm haengt die Zusage "bei ungueltiger Eingabe laeuft die Operation gar
// nicht erst an".
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>;

const angemeldet = new Map<string, Hoerer>();
/** JEDE Anmeldung, auch eine zweite auf demselben Kanal - die Map allein verschluckte sie. */
const anmeldungen: string[] = [];

vi.mock("electron", () => ({
  ipcMain: {
    handle: (kanal: string, hoerer: Hoerer) => {
      anmeldungen.push(kanal);
      angemeldet.set(kanal, hoerer);
    },
  },
}));

const ops = vi.hoisted(() => ({
  listeMarken: vi.fn(),
  leseMarke: vi.fn(),
  erstelleMarke: vi.fn(),
  bearbeiteMarke: vi.fn(),
  pruefeMarkenReferenzen: vi.fn(),
  löscheMarke: vi.fn(),
  importiereMarkenDatei: vi.fn(),
  entferneMarkenDatei: vi.fn(),
  öffneMarkenDateiDialog: vi.fn(),
}));

vi.mock("../../src/main/marken-store/liste", () => ({ listeMarken: ops.listeMarken }));
vi.mock("../../src/main/marken-store/lese-marke", () => ({ leseMarke: ops.leseMarke }));
vi.mock("../../src/main/marken-store/erstelle-marke", () => ({
  erstelleMarke: ops.erstelleMarke,
}));
vi.mock("../../src/main/marken-store/bearbeite-marke", () => ({
  bearbeiteMarke: ops.bearbeiteMarke,
}));
vi.mock("../../src/main/marken-store/referenzpruefung", () => ({
  pruefeMarkenReferenzen: ops.pruefeMarkenReferenzen,
}));
vi.mock("../../src/main/marken-store/loesche-marke", () => ({ löscheMarke: ops.löscheMarke }));
vi.mock("../../src/main/marken-store/dateien", () => ({
  importiereMarkenDatei: ops.importiereMarkenDatei,
  entferneMarkenDatei: ops.entferneMarkenDatei,
}));
vi.mock("../../src/main/marken-store/dialog", () => ({
  öffneMarkenDateiDialog: ops.öffneMarkenDateiDialog,
}));

const { verdrahteMarkenIPC } = await import("../../src/main/ipc-gateway/marken-verdrahtung");

// EINMAL verdrahten, wie im Bootstrap (#3 / #309).
verdrahteMarkenIPC();

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

const MARKE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OK = { ok: true as const, wert: undefined };
const UNGUELTIG = { ok: false, fehler: { code: "ungueltige_eingabe" } };

beforeEach(() => {
  vi.clearAllMocks();
  for (const op of Object.values(ops)) op.mockResolvedValue(OK);
});

describe("verdrahteMarkenIPC (#304) - die Anmeldung", () => {
  it("meldet genau die neun Instant-Kanaele aus KANAELE.marken an, jeden genau einmal", () => {
    const erwartet = [
      KANAELE.marken.listeMarken,
      KANAELE.marken.leseMarke,
      KANAELE.marken.erstelleMarke,
      KANAELE.marken.bearbeiteMarke,
      KANAELE.marken.pruefeMarkenReferenzen,
      KANAELE.marken.loescheMarke,
      KANAELE.marken.importiereMarkenDatei,
      KANAELE.marken.entferneMarkenDatei,
      KANAELE.marken.öffneMarkenDateiDialog,
    ];
    expect(erwartet).toHaveLength(9);
    // Das Ereignis marken:autoSpeichernStatus meldet die ANDERE Datei (Eigene Datei, mit
    // Fenster) - hier darf es nicht auftauchen.
    expect(angemeldet.has(KANAELE.marken.autoSpeichernStatus)).toBe(false);
    expect([...angemeldet.keys()].sort()).toEqual([...erwartet].sort());
    // Eine zweite Anmeldung desselben Kanals wirft erst im Betrieb (ipcMain.handle) - die
    // Map allein wuerde sie ueberschreiben und den Fehler verdecken.
    expect(anmeldungen).toHaveLength(9);
  });

  it("die Registry enthaelt genau die zehn Eintraege des Blocks (neun + Ereignis)", () => {
    expect(Object.keys(KANAELE.marken).sort()).toEqual(
      [
        "autoSpeichernStatus",
        "bearbeiteMarke",
        "entferneMarkenDatei",
        "erstelleMarke",
        "importiereMarkenDatei",
        "leseMarke",
        "listeMarken",
        "loescheMarke",
        "öffneMarkenDateiDialog",
        "pruefeMarkenReferenzen",
      ].sort(),
    );
    // Alle Kanalnamen tragen das Praefix marken: (TK 9.1.1 Punkt 4).
    for (const kanal of Object.values(KANAELE.marken)) {
      expect(kanal.startsWith("marken:")).toBe(true);
    }
  });
});

describe("verdrahteMarkenIPC (#304) - Durchreichung", () => {
  it("leseMarke ruft leseMarke(markeId) und reicht das Ergebnis unveraendert durch", async () => {
    const antwort = { ok: true as const, wert: { id: MARKE_ID, name: "Fitnessworld24" } };
    ops.leseMarke.mockResolvedValue(antwort);
    const ergebnis = await rufe(KANAELE.marken.leseMarke, { markeId: MARKE_ID, unfug: true });
    expect(ops.leseMarke).toHaveBeenCalledTimes(1);
    expect(ops.leseMarke).toHaveBeenCalledWith(MARKE_ID);
    expect(ergebnis).toBe(antwort);
  });

  it("listeMarken ohne Nutzlast ruft ohne Argument, auch ein leeres Objekt wird ignoriert", async () => {
    const antwort = { ok: true as const, wert: [] };
    ops.listeMarken.mockResolvedValue(antwort);
    const ergebnis = await rufe(KANAELE.marken.listeMarken, undefined);
    expect(ops.listeMarken).toHaveBeenCalledWith();
    expect(ergebnis).toBe(antwort);
    await rufe(KANAELE.marken.listeMarken, {});
    expect(ops.listeMarken).toHaveBeenCalledTimes(2);
  });

  it("erstelleMarke mit parentId: null ruft erstelleMarke(name, null)", async () => {
    ops.erstelleMarke.mockResolvedValue({ ok: true as const, wert: { id: MARKE_ID } });
    await rufe(KANAELE.marken.erstelleMarke, { name: "Neu", parentId: null });
    expect(ops.erstelleMarke).toHaveBeenCalledWith("Neu", null);
  });

  it("erstelleMarke mit einem echten Parent reicht die Id zeichengleich weiter", async () => {
    await rufe(KANAELE.marken.erstelleMarke, { name: "Ableitung", parentId: MARKE_ID });
    expect(ops.erstelleMarke).toHaveBeenCalledWith("Ableitung", MARKE_ID);
  });

  it("bearbeiteMarke reicht teilwerte UNveraendert durch - das { geerbt: true } wird nicht aufgeloest", async () => {
    const teilwerte = { farben: { akzent: { geerbt: true } }, slogan: { text: "Neu", aktiv: true } };
    ops.bearbeiteMarke.mockResolvedValue({ ok: true as const, wert: { id: MARKE_ID } });
    await rufe(KANAELE.marken.bearbeiteMarke, { markeId: MARKE_ID, teilwerte });
    expect(ops.bearbeiteMarke).toHaveBeenCalledTimes(1);
    const [id, durchgereicht] = ops.bearbeiteMarke.mock.calls[0] as [string, unknown];
    expect(id).toBe(MARKE_ID);
    // Deep-Vergleich: identisch, keine Umformung der Sentinel-Form.
    expect(durchgereicht).toEqual(teilwerte);
    expect((durchgereicht as typeof teilwerte).farben.akzent).toEqual({ geerbt: true });
  });

  it("importiereMarkenDatei mit art 'logo' und schriftRolle null ruft mit genau vier Argumenten", async () => {
    ops.importiereMarkenDatei.mockResolvedValue({ ok: true as const, wert: { id: MARKE_ID } });
    await rufe(KANAELE.marken.importiereMarkenDatei, {
      markeId: MARKE_ID,
      art: "logo",
      schriftRolle: null,
      quellPfad: "/tmp/logo.png",
    });
    expect(ops.importiereMarkenDatei).toHaveBeenCalledWith(
      MARKE_ID,
      "logo",
      null,
      "/tmp/logo.png",
    );
  });

  it("entferneMarkenDatei mit art 'logo' und schriftRolle null ruft mit schriftRolle: null", async () => {
    await rufe(KANAELE.marken.entferneMarkenDatei, {
      markeId: MARKE_ID,
      art: "logo",
      schriftRolle: null,
    });
    expect(ops.entferneMarkenDatei).toHaveBeenCalledWith(MARKE_ID, "logo", null);
  });

  it("öffneMarkenDateiDialog reicht nur das art-Feld weiter; Abbruch (pfade: []) bleibt Erfolg", async () => {
    const antwort = { ok: true as const, wert: { pfade: [] } };
    ops.öffneMarkenDateiDialog.mockResolvedValue(antwort);
    const ergebnis = await rufe(KANAELE.marken.öffneMarkenDateiDialog, { art: "schrift" });
    expect(ops.öffneMarkenDateiDialog).toHaveBeenCalledWith("schrift");
    expect(ergebnis).toBe(antwort);
  });

  it("ein marke_referenziert-Fehler mit allen drei Trefferlisten kommt mit identischem daten an", async () => {
    const nutzung = {
      aktionen: [],
      abgeleiteteMarken: [{ markeId: MARKE_ID, markeName: "Tochter" }],
      standardInProjekten: [],
    };
    const antwort = {
      ok: false as const,
      fehler: { code: "marke_referenziert", meldung: "referenziert", daten: nutzung },
    };
    ops.löscheMarke.mockResolvedValue(antwort);
    const ergebnis = (await rufe(KANAELE.marken.loescheMarke, { markeId: MARKE_ID })) as typeof antwort;
    expect(ergebnis).toBe(antwort);
    expect(ergebnis.fehler.daten).toEqual(nutzung);
    // Alle drei Listen bleiben je einzeln erhaeltlich - auch die leeren; keine wird
    // weggelassen, zusammengefasst oder gezaehlt.
    expect(ergebnis.fehler.daten.aktionen).toEqual([]);
    expect(ergebnis.fehler.daten.abgeleiteteMarken).toHaveLength(1);
    expect(ergebnis.fehler.daten.standardInProjekten).toEqual([]);
  });
});

describe("verdrahteMarkenIPC (#304) - Ablehnung", () => {
  const faelle: Array<{ kanal: string; nutzlast: unknown; op: keyof typeof ops }> = [
    { kanal: KANAELE.marken.leseMarke, nutzlast: null, op: "leseMarke" },
    { kanal: KANAELE.marken.leseMarke, nutzlast: {}, op: "leseMarke" },
    { kanal: KANAELE.marken.leseMarke, nutzlast: { markeId: "" }, op: "leseMarke" },
    {
      kanal: KANAELE.marken.erstelleMarke,
      nutzlast: { parentId: null }, // name fehlt
      op: "erstelleMarke",
    },
    {
      kanal: KANAELE.marken.erstelleMarke,
      nutzlast: { name: "X" }, // parentId-Feld fehlt PFLICHT
      op: "erstelleMarke",
    },
    {
      kanal: KANAELE.marken.erstelleMarke,
      nutzlast: { name: "X", parentId: "" }, // leerer String statt null
      op: "erstelleMarke",
    },
    {
      kanal: KANAELE.marken.bearbeiteMarke,
      nutzlast: { markeId: MARKE_ID }, // teilwerte fehlt
      op: "bearbeiteMarke",
    },
    {
      kanal: KANAELE.marken.bearbeiteMarke,
      nutzlast: { markeId: MARKE_ID, teilwerte: [] }, // Array statt Objekt
      op: "bearbeiteMarke",
    },
    {
      kanal: KANAELE.marken.pruefeMarkenReferenzen,
      nutzlast: { markeId: "" },
      op: "pruefeMarkenReferenzen",
    },
    { kanal: KANAELE.marken.loescheMarke, nutzlast: 42, op: "löscheMarke" },
    {
      kanal: KANAELE.marken.importiereMarkenDatei,
      nutzlast: { markeId: MARKE_ID, art: "zoom", schriftRolle: null, quellPfad: "/tmp/x" },
      op: "importiereMarkenDatei",
    },
    {
      kanal: KANAELE.marken.importiereMarkenDatei,
      nutzlast: { markeId: MARKE_ID, art: "schrift", quellPfad: "/tmp/x" }, // schriftRolle fehlt
      op: "importiereMarkenDatei",
    },
    {
      kanal: KANAELE.marken.importiereMarkenDatei,
      nutzlast: { markeId: MARKE_ID, art: "logo", schriftRolle: null }, // quellPfad fehlt
      op: "importiereMarkenDatei",
    },
    {
      kanal: KANAELE.marken.entferneMarkenDatei,
      nutzlast: { markeId: MARKE_ID, art: "logo" }, // schriftRolle fehlt PFLICHT
      op: "entferneMarkenDatei",
    },
    {
      kanal: KANAELE.marken.öffneMarkenDateiDialog,
      nutzlast: { art: " initializer" }, // weder logo noch schrift
      op: "öffneMarkenDateiDialog",
    },
    { kanal: KANAELE.marken.öffneMarkenDateiDialog, nutzlast: {}, op: "öffneMarkenDateiDialog" },
  ];

  it.each(faelle)(
    "$kanal mit ungueltiger Nutzlast liefert ungueltige_eingabe und ruft die Operation NICHT",
    async ({ kanal, nutzlast, op }) => {
      const ergebnis = (await rufe(kanal, nutzlast)) as { ok: boolean; fehler?: { code?: string } };
      expect(ergebnis.ok).toBe(false);
      expect(ergebnis.fehler?.code).toBe("ungueltige_eingabe");
      expect(ops[op]).not.toHaveBeenCalled();
    },
  );
});
