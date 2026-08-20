// Verhaltenstest zu #153 - die Anmeldung der beiden nachgetragenen project-store-Kanaele.
//
// Gemockt wird `electron` und die zwei Fachoperationen. Der Wrapper #23 laeuft dagegen ECHT
// mit: Er ist der Weg, den die Nutzlast im Betrieb nimmt, und an ihm haengt die Zusage
// "bei ungueltiger Eingabe laeuft die Operation gar nicht erst an" (TK 9.1.1 Punkt 6).
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
  setzeEinblendung: vi.fn(),
  setzeElementReferenz: vi.fn(),
}));

vi.mock("../../src/main/project-store/setze-einblendung", () => ({
  setzeEinblendung: ops.setzeEinblendung,
}));
vi.mock("../../src/main/project-store/setze-element-referenz", () => ({
  setzeElementReferenz: ops.setzeElementReferenz,
}));

const { verdrahteProjectStoreNachtragIPC } = await import(
  "../../src/main/ipc-gateway/project-store-nachtrag"
);

// EINMAL verdrahten, wie im Bootstrap (#3).
verdrahteProjectStoreNachtragIPC();

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
  for (const op of Object.values(ops)) op.mockResolvedValue(OK);
});

describe("verdrahteProjectStoreNachtragIPC (#153)", () => {
  it("meldet genau die zwei Kanaele an, jeden genau einmal", () => {
    const erwartet = [KANAELE.project.setzeEinblendung, KANAELE.project.setzeElementReferenz];

    expect([...angemeldet.keys()].sort()).toEqual([...erwartet].sort());
    // Eine zweite Anmeldung desselben Kanals wirft erst im Betrieb (ipcMain.handle) - die
    // Map allein wuerde sie ueberschreiben und den Fehler verdecken.
    expect(anmeldungen).toHaveLength(2);
  });

  it("ruft setzeElementReferenz mit genau den zwei Werten in dieser Reihenfolge und reicht das Ergebnis unveraendert durch", async () => {
    const antwort = { ok: true as const, wert: { id: "e1", ref: "a9" } };
    ops.setzeElementReferenz.mockResolvedValue(antwort);

    const ergebnis = await rufe(KANAELE.project.setzeElementReferenz, {
      referenz: "a9",
      elementId: "e1",
      unfug: true,
    });

    expect(ops.setzeElementReferenz).toHaveBeenCalledWith("e1", "a9");
    // toBe: kein Auspacken, kein Umformen, kein Zusatzfeld.
    expect(ergebnis).toBe(antwort);
  });

  it("reicht das einblendung-Objekt als DIESELBE Referenz weiter, ohne Felder zu ergaenzen", async () => {
    const einblendung = {
      bandVorlageId: "v1",
      abschnitte: [{ aktionRef: "a1", dauer: 10 }],
    };

    await rufe(KANAELE.project.setzeEinblendung, { elementId: "e1", einblendung, unfug: 1 });

    expect(ops.setzeEinblendung).toHaveBeenCalledWith("e1", einblendung);
    // Deep-Vergleich zusaetzlich zur Referenz: Ein Kopieren mit Ergaenzung faende `toBe` zwar
    // auch, aber die Meldung waere unlesbar.
    expect(ops.setzeEinblendung.mock.calls[0]?.[1]).toBe(einblendung);
    expect(ops.setzeEinblendung.mock.calls[0]?.[1]).toEqual({
      bandVorlageId: "v1",
      abschnitte: [{ aktionRef: "a1", dauer: 10 }],
    });
  });

  it("laesst einblendung: null durch - das ist 'Band entfernen', keine ungueltige Eingabe", async () => {
    await rufe(KANAELE.project.setzeEinblendung, { elementId: "x", einblendung: null });

    expect(ops.setzeEinblendung).toHaveBeenCalledWith("x", null);
  });

  it("lehnt ein FEHLENDES Feld einblendung ab, statt es als null zu lesen", async () => {
    // Der teure Fall: Als `null` gelesen loeschte ein Renderer-Fehler stillschweigend das
    // Werbeband des Nutzers.
    await expect(rufe(KANAELE.project.setzeEinblendung, { elementId: "x" })).resolves.toMatchObject(
      UNGUELTIG,
    );
    await expect(
      rufe(KANAELE.project.setzeEinblendung, { elementId: "x", einblendung: undefined }),
    ).resolves.toMatchObject(UNGUELTIG);

    expect(ops.setzeEinblendung).not.toHaveBeenCalled();
  });

  it("lehnt Array, String und Zahl als einblendung ab", async () => {
    for (const einblendung of [[], "x", 5]) {
      await expect(
        rufe(KANAELE.project.setzeEinblendung, { elementId: "x", einblendung }),
      ).resolves.toMatchObject(UNGUELTIG);
    }

    expect(ops.setzeEinblendung).not.toHaveBeenCalled();
  });

  it("lehnt je Kanal eine ungueltige Nutzlast ab, ohne die Operation aufzurufen", async () => {
    const faelle: [string, ReturnType<typeof vi.fn>, unknown][] = [
      [KANAELE.project.setzeEinblendung, ops.setzeEinblendung, null],
      [KANAELE.project.setzeEinblendung, ops.setzeEinblendung, ["e1"]],
      [KANAELE.project.setzeEinblendung, ops.setzeEinblendung, { elementId: "", einblendung: null }],
      [KANAELE.project.setzeEinblendung, ops.setzeEinblendung, { elementId: 42, einblendung: null }],
      [KANAELE.project.setzeElementReferenz, ops.setzeElementReferenz, null],
      [KANAELE.project.setzeElementReferenz, ops.setzeElementReferenz, "e1"],
      [KANAELE.project.setzeElementReferenz, ops.setzeElementReferenz, { elementId: "e1" }],
      [KANAELE.project.setzeElementReferenz, ops.setzeElementReferenz, { referenz: "a1" }],
      [
        KANAELE.project.setzeElementReferenz,
        ops.setzeElementReferenz,
        { elementId: "e1", referenz: "   " },
      ],
      [
        KANAELE.project.setzeElementReferenz,
        ops.setzeElementReferenz,
        { elementId: "e1", referenz: 7 },
      ],
    ];

    for (const [kanal, op, nutzlast] of faelle) {
      await expect(rufe(kanal, nutzlast), JSON.stringify(nutzlast)).resolves.toMatchObject(
        UNGUELTIG,
      );
      expect(op, kanal).not.toHaveBeenCalled();
    }
  });

  it("reicht einen Fachfehler mit seinem Code und seinem daten-Feld unveraendert durch", async () => {
    const daten = { betroffeneElemente: ["e1", "e2"] };
    const antwort = {
      ok: false as const,
      fehler: { code: "nicht_gefunden", meldung: "Element unbekannt.", daten },
    };
    ops.setzeElementReferenz.mockResolvedValue(antwort);

    const ergebnis = (await rufe(KANAELE.project.setzeElementReferenz, {
      elementId: "e1",
      referenz: "a1",
    })) as typeof antwort;

    expect(ergebnis.fehler.code).toBe("nicht_gefunden");
    expect(ergebnis.fehler.daten).toEqual(daten);
    expect(ergebnis.fehler.daten).toBe(daten);
  });

  it("fuegt einem fehler OHNE daten kein daten-Feld hinzu", async () => {
    ops.setzeEinblendung.mockResolvedValue({
      ok: false,
      fehler: { code: "projekt_beschaeftigt", meldung: "Speichern laeuft." },
    });

    const ergebnis = (await rufe(KANAELE.project.setzeEinblendung, {
      elementId: "e1",
      einblendung: null,
    })) as { fehler: Record<string, unknown> };

    expect("daten" in ergebnis.fehler).toBe(false);
    expect(ergebnis.fehler.code).toBe("projekt_beschaeftigt");
  });

  it("uebersetzt eine geworfene Ausnahme in unbekannter_fehler, statt sie ueber die IPC-Grenze zu lassen", async () => {
    ops.setzeEinblendung.mockRejectedValue(new Error("kaputt"));

    await expect(
      rufe(KANAELE.project.setzeEinblendung, { elementId: "e1", einblendung: null }),
    ).resolves.toMatchObject({ ok: false, fehler: { code: "unbekannter_fehler" } });
  });
});

describe("Quelltext-Proben zu #153", () => {
  const CODE = readFileSync(
    new URL("../../src/main/ipc-gateway/project-store-nachtrag.ts", import.meta.url),
    "utf8",
  );
  // Der Kommentarteil traegt Kanalnamen und Modulnamen als Prosa; geprueft wird der Code.
  const OHNE_KOMMENTARE = CODE.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  it("bildet keinen Kanalnamen als Zeichenkette, sondern liest ihn aus KANAELE", () => {
    expect(OHNE_KOMMENTARE).not.toMatch(/['"`]project:/);
    expect(OHNE_KOMMENTARE).toContain("KANAELE.project.setzeEinblendung");
    expect(OHNE_KOMMENTARE).toContain("KANAELE.project.setzeElementReferenz");
  });

  it("fasst weder Dateisystem noch Fenster noch Lock an und importiert nicht aus #76", () => {
    for (const verboten of [
      "child_process",
      "BrowserWindow",
      "webContents",
      "mitD1Lock",
      "project-store-verdrahtung",
      "node:fs",
    ]) {
      expect(OHNE_KOMMENTARE, verboten).not.toContain(verboten);
    }
    // `fs` nur als eigenstaendiger Bezeichner/Modulname - "fs" steckt sonst in Woertern.
    expect(OHNE_KOMMENTARE).not.toMatch(/\bfrom ['"](node:)?fs['"]/);
  });

  it("importiert die Nutzlast-Pruefer aus #332, statt sie ein fuenftes Mal zu kopieren", () => {
    expect(OHNE_KOMMENTARE).toContain("from './nutzlast-pruefer'");
    expect(OHNE_KOMMENTARE).not.toContain("function istObjekt");
    expect(OHNE_KOMMENTARE).not.toContain("function istGefuellterText");
    expect(OHNE_KOMMENTARE).not.toContain("function abgelehnt");
  });
});

describe("Kanal-Registry nach #153", () => {
  it("ergaenzt den project-Block um genau zwei Namen und laesst die uebrigen Bloecke unberuehrt", () => {
    // 16 -> 17 am 20.08.2026: #238 traegt das ERREIGNIS `autoSpeichernStatus` nach.
    expect(Object.keys(KANAELE.project)).toHaveLength(17);
    expect(KANAELE.project.setzeEinblendung).toBe("project:setzeEinblendung");
    expect(KANAELE.project.setzeElementReferenz).toBe("project:setzeElementReferenz");
    // Die vierzehn aus #76 unveraendert.
    expect(Object.keys(KANAELE.project).slice(0, 14)).toEqual([
      "erstelleProjekt",
      "öffneProjekt",
      "listeProjekte",
      "dupliziereProjekt",
      "löscheProjekt",
      "erstelleAktion",
      "bearbeiteAktion",
      "löscheAktion",
      "fügeElementHinzu",
      "entferneElement",
      "ordneNeu",
      "setzeTrim",
      "setzeDauer",
      "listeAusgaben",
    ]);
    expect(Object.keys(KANAELE.queue)).toHaveLength(6);
    expect(Object.keys(KANAELE.config)).toHaveLength(5);
    expect(Object.keys(KANAELE.media)).toEqual(["öffneMedienDialog"]);
    expect(Object.keys(KANAELE.export)).toEqual(["wähleExportZiel"]);
  });
});
