// Verhaltenstest zu #255 - die Anmeldung des einen nachgetragenen vorlagen-Kanals
// `vorlagen:pruefeVorlagenReferenzen` (TK 9.12.1 seit v3.0).
//
// Gemockt wird `electron` und die eine Fachoperation. Der Wrapper #23 laeuft dagegen ECHT
// mit: Er ist der Weg, den die Nutzlast im Betrieb nimmt, und an ihm haengt die Zusage
// "bei ungueltiger Eingabe laeuft die Operation gar nicht erst an" (TK 9.1.1 Punkt 6)
// sowie "jede unerwartete Ausnahme wird zu unbekannter_fehler" (TK 9.1.1 Punkt 8).
import { readFileSync } from "node:fs";

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
  pruefeVorlagenReferenzen: vi.fn(),
}));

vi.mock("../../src/main/vorlagen-store/referenzpruefung", () => ({
  pruefeVorlagenReferenzen: ops.pruefeVorlagenReferenzen,
}));

const { verdrahteVorlagenNachtragIPC } = await import(
  "../../src/main/ipc-gateway/vorlagen-nachtrag"
);

// EINMAL verdrahten, wie im Bootstrap (#3) nach verdrahteVorlagenIPC().
verdrahteVorlagenNachtragIPC();

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

const OK = { ok: true as const, wert: undefined };
const UNGUELTIG = { ok: false, fehler: { code: "ungueltige_eingabe" } };

beforeEach(() => {
  vi.clearAllMocks();
  ops.pruefeVorlagenReferenzen.mockResolvedValue(OK);
});

describe("verdrahteVorlagenNachtragIPC (#255)", () => {
  it("meldet genau den einen Kanal an, und zwar unter seinem Registry-Namen", () => {
    expect([...angemeldet.keys()]).toEqual([KANAELE.vorlagen.pruefeVorlagenReferenzen]);
    // Eine zweite Anmeldung desselben Kanals wirft erst im Betrieb (ipcMain.handle) - die
    // Map allein wuerde sie ueberschreiben und den Fehler verdecken.
    expect(anmeldungen).toHaveLength(1);
    expect(anmeldungen[0]).toBe("vorlagen:pruefeVorlagenReferenzen");
  });

  it("ruft pruefeVorlagenReferenzen mit genau der einen vorlagenId und reicht das Ergebnis unveraendert durch", async () => {
    const antwort = {
      ok: true as const,
      wert: {
        aktionen: [
          { projektId: "p1", projektName: "Sommer", id: "a1" },
          { projektId: "p2", projektName: "Winter", id: "a7" },
        ],
        listenelemente: [{ projektId: "p1", projektName: "Sommer", id: "e3" }],
      },
    };
    ops.pruefeVorlagenReferenzen.mockResolvedValue(antwort);

    const ergebnis = await rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, {
      vorlagenId: "v1",
      unfug: true,
    });

    expect(ops.pruefeVorlagenReferenzen).toHaveBeenCalledTimes(1);
    expect(ops.pruefeVorlagenReferenzen).toHaveBeenCalledWith("v1");
    // toBe: kein Auspacken, kein Umformen, kein Zusatzfeld.
    expect(ergebnis).toBe(antwort);
  });

  it("KERNNACHWEIS: eine eingebaute Vorlagen-ID wie 'band-standard' laeuft die Operation an - es gibt KEINE UUID-Formpruefung", async () => {
    // #106: Die eingebauten Vorlagen heissen "vollbild", "split", "band-standard" und sind
    // keine UUIDs. Eine UUID-Prüfung an diesem Kanal erklaerte die drei wichtigsten
    // Vorlagen dauerhaft für "unbenutzt" - deshalb wird hier nur die Form geprueft.
    const antwort = { ok: true as const, wert: { aktionen: [], listenelemente: [] } };
    ops.pruefeVorlagenReferenzen.mockResolvedValue(antwort);

    const ergebnis = await rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, {
      vorlagenId: "band-standard",
    });

    expect(ops.pruefeVorlagenReferenzen).toHaveBeenCalledWith("band-standard");
    expect(ergebnis).toBe(antwort);
  });

  it("liefert eine LEERE Nutzung als Erfolg, nicht als nicht_gefunden (TK 9.12.1)", async () => {
    ops.pruefeVorlagenReferenzen.mockResolvedValue({
      ok: true,
      wert: { aktionen: [], listenelemente: [] },
    });

    const ergebnis = await rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, {
      vorlagenId: "frei",
    });

    expect(ergebnis).toEqual({ ok: true, wert: { aktionen: [], listenelemente: [] } });
  });

  it("lehnt die ungueltigen Nutzlasten ab, ohne die Operation aufzurufen", async () => {
    const faelle: unknown[] = [
      null,
      undefined,
      "v1",
      5,
      [],
      {},
      { vorlagenId: "" },
      { vorlagenId: 7 },
      { vorlagenId: null },
    ];

    for (const nutzlast of faelle) {
      await expect(rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, nutzlast), JSON.stringify(nutzlast)).resolves.toMatchObject(
        UNGUELTIG,
      );
      expect(ops.pruefeVorlagenReferenzen).not.toHaveBeenCalled();
    }
  });

  it("lehnt { id: 'v1' } ab - das Feld heisst vorlagenId, eine zweite Schreibweise wird nicht still akzeptiert", async () => {
    await expect(
      rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, { id: "v1" }),
    ).resolves.toMatchObject(UNGUELTIG);

    expect(ops.pruefeVorlagenReferenzen).not.toHaveBeenCalled();
  });

  it("reicht einen Fachfehler mit genau seinem Code und seinem daten-Feld unveraendert durch", async () => {
    const daten = { projekt: "p9", datei: "project.json" };
    const antwort = {
      ok: false as const,
      fehler: { code: "speicher_fehler", meldung: "Projekt nicht lesbar.", daten },
    };
    ops.pruefeVorlagenReferenzen.mockResolvedValue(antwort);

    const ergebnis = (await rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, {
      vorlagenId: "v1",
    })) as typeof antwort;

    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(ergebnis.fehler.daten).toEqual(daten);
    expect(ergebnis.fehler.daten).toBe(daten);
  });

  it("fuegt einem fehler OHNE daten kein daten-Feld hinzu", async () => {
    ops.pruefeVorlagenReferenzen.mockResolvedValue({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "seltsam" },
    });

    const ergebnis = (await rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, {
      vorlagenId: "v1",
    })) as { fehler: Record<string, unknown> };

    expect("daten" in ergebnis.fehler).toBe(false);
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
  });

  it("uebersetzt eine geworfene Ausnahme in unbekannter_fehler, ohne Stacktrace in die Oberflaeche", async () => {
    ops.pruefeVorlagenReferenzen.mockRejectedValue(new Error("kaputt"));

    await expect(
      rufe(KANAELE.vorlagen.pruefeVorlagenReferenzen, { vorlagenId: "v1" }),
    ).resolves.toMatchObject({ ok: false, fehler: { code: "unbekannter_fehler" } });
  });
});

describe("Quelltext-Proben zu #255", () => {
  const CODE = readFileSync(
    new URL("../../src/main/ipc-gateway/vorlagen-nachtrag.ts", import.meta.url),
    "utf8",
  );
  // Der Kommentarteil traegt Kanalnamen und Modulnamen als Prosa; geprueft wird der Code.
  const OHNE_KOMMENTARE = CODE.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  it("bildet keinen Kanalnamen als Zeichenkette, sondern liest ihn aus KANAELE", () => {
    expect(OHNE_KOMMENTARE).not.toMatch(/['"`]vorlagen:/);
    expect(OHNE_KOMMENTARE).toContain("KANAELE.vorlagen.pruefeVorlagenReferenzen");
  });

  it("fasst weder Dateisystem noch Fenster noch Lock an und importiert nicht aus den Nachbar-Verdrahtungen", () => {
    for (const verboten of [
      "child_process",
      "BrowserWindow",
      "webContents",
      "mitD1Lock",
      "listeProjekte",
      "ladeBestand",
      "aendereBestand",
      "flushBestand",
      "ipcMain",
      "ipc-verdrahtung",
      "project-store-nachtrag",
      "node:fs",
    ]) {
      expect(OHNE_KOMMENTARE, verboten).not.toContain(verboten);
    }
    expect(OHNE_KOMMENTARE).not.toMatch(/\bfrom ['"](node:)?fs['"]/);
  });

  it("baut kein eigenes try/catch - das gehoert dem Wrapper aus #23", () => {
    expect(OHNE_KOMMENTARE).not.toMatch(/\btry\s*{/);
    expect(OHNE_KOMMENTARE).not.toMatch(/\bcatch\s*\(/);
  });
});

describe("Kanal-Registry nach #255", () => {
  it("ergaenzt den vorlagen-Block um genau einen Namen und laesst die uebrigen Bloecke unberuehrt", () => {
    expect(KANAELE.vorlagen.pruefeVorlagenReferenzen).toBe(
      "vorlagen:pruefeVorlagenReferenzen",
    );
    // Die neun aus #109 unveraendert.
    expect(Object.keys(KANAELE.vorlagen).slice(0, 9)).toEqual([
      "listeVorlagen",
      "listeArbeitskopien",
      "erstelleVorlage",
      "oeffneZurBearbeitung",
      "speichereArbeitskopie",
      "uebernehmeInParent",
      "alsEigenstaendige",
      "verwerfeArbeitskopie",
      "löscheVorlage",
    ]);
    expect(KANAELE.vorlagen.löscheVorlage).toBe("vorlagen:löscheVorlage");
    // Uebrige Bloecke unveraendert.
    expect(Object.keys(KANAELE.queue)).toHaveLength(6);
    // 16 -> 17 am 20.08.2026: #238 traegt das ERREIGNIS `autoSpeichernStatus` nach.
    // 17 -> 18 am 23.08.2026: #334 traegt den Kanal `setzeStandardSegmentdauer` nach.
    expect(Object.keys(KANAELE.project)).toHaveLength(20);
    expect(Object.keys(KANAELE.config)).toHaveLength(5);
    expect(Object.keys(KANAELE.media)).toEqual(["öffneMedienDialog"]);
    expect(Object.keys(KANAELE.export)).toEqual(["wähleExportZiel"]);
  });
});