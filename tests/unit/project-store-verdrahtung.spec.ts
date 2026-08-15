// Verhaltenstest zu #76 - die Anmeldung der vierzehn project-store-Kanaele.
//
// Gemockt wird `electron` (wie in config-store-verdrahtung.spec.ts) und jede Fachoperation.
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
  erstelleProjekt: vi.fn(),
  oeffneProjektAblauf: vi.fn(),
  öffneProjekt: vi.fn(),
  listeProjekte: vi.fn(),
  dupliziereProjekt: vi.fn(),
  löscheProjekt: vi.fn(),
  erstelleAktion: vi.fn(),
  bearbeiteAktion: vi.fn(),
  löscheAktion: vi.fn(),
  fügeElementHinzu: vi.fn(),
  entferneElement: vi.fn(),
  ordneNeu: vi.fn(),
  setzeTrim: vi.fn(),
  setzeDauer: vi.fn(),
  listeAusgaben: vi.fn(),
}));

vi.mock("../../src/main/ipc-gateway/projekt-oeffnen-ablauf", () => ({
  oeffneProjektAblauf: ops.oeffneProjektAblauf,
}));
vi.mock("../../src/main/project-store/oeffne-projekt", () => ({ öffneProjekt: ops.öffneProjekt }));
vi.mock("../../src/main/project-store/erstelle-projekt", () => ({
  erstelleProjekt: ops.erstelleProjekt,
}));
vi.mock("../../src/main/project-store/liste-projekte", () => ({ listeProjekte: ops.listeProjekte }));
vi.mock("../../src/main/project-store/dupliziere-projekt", () => ({
  dupliziereProjekt: ops.dupliziereProjekt,
}));
vi.mock("../../src/main/project-store/loesche-projekt", () => ({
  löscheProjekt: ops.löscheProjekt,
}));
vi.mock("../../src/main/project-store/erstelle-aktion", () => ({
  erstelleAktion: ops.erstelleAktion,
}));
vi.mock("../../src/main/project-store/bearbeite-aktion", () => ({
  bearbeiteAktion: ops.bearbeiteAktion,
}));
vi.mock("../../src/main/project-store/loesche-aktion", () => ({ löscheAktion: ops.löscheAktion }));
vi.mock("../../src/main/project-store/fuege-element-hinzu", () => ({
  fügeElementHinzu: ops.fügeElementHinzu,
}));
vi.mock("../../src/main/project-store/entferne-element", () => ({
  entferneElement: ops.entferneElement,
}));
vi.mock("../../src/main/project-store/ordne-neu", () => ({ ordneNeu: ops.ordneNeu }));
vi.mock("../../src/main/project-store/setze-trim", () => ({ setzeTrim: ops.setzeTrim }));
vi.mock("../../src/main/project-store/setze-dauer", () => ({ setzeDauer: ops.setzeDauer }));
vi.mock("../../src/main/project-store/ausgaben", () => ({ listeAusgaben: ops.listeAusgaben }));

const { verdrahteProjectStoreIPC } = await import(
  "../../src/main/ipc-gateway/project-store-verdrahtung"
);

// EINMAL verdrahten, wie im Bootstrap (#3).
verdrahteProjectStoreIPC();

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OK = { ok: true as const, wert: undefined };
const UNGUELTIG = { ok: false, fehler: { code: "ungueltige_eingabe" } };

beforeEach(() => {
  vi.clearAllMocks();
  for (const op of Object.values(ops)) op.mockResolvedValue(OK);
});

describe("verdrahteProjectStoreIPC (#76)", () => {
  it("meldet genau die vierzehn Kanaele aus KANAELE.project an, jeden genau einmal", () => {
    // ANGEPASST am 15.08.2026 durch #153, und zwar genau so, wie #153 es vorsieht: "Der
    // DoD-Punkt von #76 'KANAELE.project enthaelt genau diese 14 Namen' ist ab diesem Issue
    // auf sechzehn zu lesen ... der DoD-Punkt ist dort zu praezisieren ('die vierzehn Namen
    // dieses Issues sind enthalten')". Vorher stand hier `Object.values(KANAELE.project)`;
    // die Gruppe darf laut Registry-Kommentar wachsen, DIESE Datei aber nicht - der Test
    // sichert seither die vierzehn NAMENTLICH, statt sie aus der Registry abzuleiten. Damit
    // beisst er schaerfer als zuvor: Ein fuenfzehnter Kanal in project-store-verdrahtung.ts
    // faellt jetzt auf, auch wenn er in der Registry steht.
    const erwartet = [
      KANAELE.project.erstelleProjekt,
      KANAELE.project.öffneProjekt,
      KANAELE.project.listeProjekte,
      KANAELE.project.dupliziereProjekt,
      KANAELE.project.löscheProjekt,
      KANAELE.project.erstelleAktion,
      KANAELE.project.bearbeiteAktion,
      KANAELE.project.löscheAktion,
      KANAELE.project.fügeElementHinzu,
      KANAELE.project.entferneElement,
      KANAELE.project.ordneNeu,
      KANAELE.project.setzeTrim,
      KANAELE.project.setzeDauer,
      KANAELE.project.listeAusgaben,
    ];
    expect(erwartet).toHaveLength(14);
    // Die zwei Nachtrags-Kanaele (#153) meldet eine ANDERE Datei an - hier duerfen sie nicht
    // auftauchen; #76 verbietet seiner Datei einen fuenfzehnten Kanal ausdruecklich.
    expect(angemeldet.has(KANAELE.project.setzeEinblendung)).toBe(false);
    expect(angemeldet.has(KANAELE.project.setzeElementReferenz)).toBe(false);
    expect([...angemeldet.keys()].sort()).toEqual([...erwartet].sort());
    // Eine zweite Anmeldung desselben Kanals wirft erst im Betrieb (ipcMain.handle) - die
    // Map allein wuerde sie ueberschreiben und den Fehler verdecken.
    expect(anmeldungen).toHaveLength(14);
  });

  it("ruft setzeTrim mit genau den drei Werten in dieser Reihenfolge und reicht das Ergebnis unveraendert durch", async () => {
    const antwort = { ok: true as const, wert: { id: "e1", trimStart: 1.5, trimEnde: 9 } };
    ops.setzeTrim.mockResolvedValue(antwort);

    const ergebnis = await rufe(KANAELE.project.setzeTrim, {
      elementId: "e1",
      trimEnde: 9,
      trimStart: 1.5,
      unfug: true,
    });

    expect(ops.setzeTrim).toHaveBeenCalledWith("e1", 1.5, 9);
    // toBe: kein Auspacken, kein Umformen, kein Zusatzfeld.
    expect(ergebnis).toBe(antwort);
  });

  it("laesst das Oeffnen ueber oeffneProjektAblauf (#94) laufen, nicht ueber öffneProjekt (#34)", async () => {
    await rufe(KANAELE.project.öffneProjekt, { id: UUID });

    expect(ops.oeffneProjektAblauf).toHaveBeenCalledWith(UUID);
    // Sonst zeigte die Oberflaeche Medien an, die es auf der Platte nicht mehr gibt
    // (TK 9.4.7: Reconcile laeuft, BEVOR die UI Medien zeigt).
    expect(ops.öffneProjekt).not.toHaveBeenCalled();
  });

  it("packt die Nutzlast jedes Kanals aus und reicht sie unveraendert weiter", async () => {
    await rufe(KANAELE.project.erstelleProjekt, { name: " Sommer " });
    await rufe(KANAELE.project.dupliziereProjekt, { id: "p1", neuerName: "Kopie" });
    await rufe(KANAELE.project.löscheProjekt, { id: "p1" });
    await rufe(KANAELE.project.löscheAktion, { id: "a1" });
    await rufe(KANAELE.project.fügeElementHinzu, { referenz: "a1" });
    await rufe(KANAELE.project.entferneElement, { elementId: "e1" });
    await rufe(KANAELE.project.setzeDauer, { elementId: "e1", dauer: 12 });
    await rufe(KANAELE.project.listeAusgaben, { projektId: UUID });

    // Getrimmt wird NICHT, nur geprueft - Fremdfelder reisen nicht mit.
    expect(ops.erstelleProjekt).toHaveBeenCalledWith(" Sommer ");
    expect(ops.dupliziereProjekt).toHaveBeenCalledWith("p1", "Kopie");
    expect(ops.löscheProjekt).toHaveBeenCalledWith("p1");
    expect(ops.löscheAktion).toHaveBeenCalledWith("a1");
    expect(ops.fügeElementHinzu).toHaveBeenCalledWith("a1");
    expect(ops.entferneElement).toHaveBeenCalledWith("e1");
    expect(ops.setzeDauer).toHaveBeenCalledWith("e1", 12);
    expect(ops.listeAusgaben).toHaveBeenCalledWith(UUID);
  });

  it("reicht aktionsdaten als dasselbe Objekt weiter, ohne Felder zu ergaenzen", async () => {
    const aktionsdaten = { titel: "Probetraining" };

    await rufe(KANAELE.project.erstelleAktion, { aktionsdaten });
    await rufe(KANAELE.project.bearbeiteAktion, { id: "a1", aktionsdaten });

    expect(ops.erstelleAktion).toHaveBeenCalledWith(aktionsdaten);
    expect(ops.bearbeiteAktion).toHaveBeenCalledWith("a1", aktionsdaten);
    // Ein leeres Objekt ist gueltig: "aendere nichts" ist eine zulaessige Teilaenderung.
    await rufe(KANAELE.project.bearbeiteAktion, { id: "a1", aktionsdaten: {} });
    expect(ops.bearbeiteAktion).toHaveBeenLastCalledWith("a1", {});
  });

  it("reicht die Reihenfolge als dasselbe Array weiter - nicht sortiert, nicht entdoppelt", async () => {
    const reihenfolge = ["e2", "e1", "e1"];

    await rufe(KANAELE.project.ordneNeu, { reihenfolge });

    expect(ops.ordneNeu).toHaveBeenCalledWith(reihenfolge);
  });

  it("lehnt je Kanal eine ungueltige Nutzlast ab, ohne die Operation aufzurufen", async () => {
    // `listeProjekte` fehlt hier mit Absicht: Es kennt keine ungueltige Nutzlast (eigener
    // Test darunter).
    const faelle: [string, ReturnType<typeof vi.fn>, unknown][] = [
      [KANAELE.project.erstelleProjekt, ops.erstelleProjekt, { name: "  " }],
      [KANAELE.project.öffneProjekt, ops.oeffneProjektAblauf, null],
      [KANAELE.project.dupliziereProjekt, ops.dupliziereProjekt, { id: "p1" }],
      [KANAELE.project.löscheProjekt, ops.löscheProjekt, { id: 42 }],
      [KANAELE.project.erstelleAktion, ops.erstelleAktion, { aktionsdaten: null }],
      [KANAELE.project.bearbeiteAktion, ops.bearbeiteAktion, { id: "a1", aktionsdaten: "neu" }],
      [KANAELE.project.löscheAktion, ops.löscheAktion, {}],
      [KANAELE.project.fügeElementHinzu, ops.fügeElementHinzu, { referenz: "" }],
      [KANAELE.project.entferneElement, ops.entferneElement, ["e1"]],
      [KANAELE.project.ordneNeu, ops.ordneNeu, { reihenfolge: ["e1", 2] }],
      [KANAELE.project.setzeTrim, ops.setzeTrim, { elementId: "e1", trimStart: 0, trimEnde: "5" }],
      [KANAELE.project.setzeDauer, ops.setzeDauer, { elementId: "e1", dauer: Infinity }],
      [KANAELE.project.listeAusgaben, ops.listeAusgaben, { projektId: "kein-uuid" }],
    ];

    for (const [kanal, op, nutzlast] of faelle) {
      await expect(rufe(kanal, nutzlast)).resolves.toMatchObject(UNGUELTIG);
      expect(op, kanal).not.toHaveBeenCalled();
    }
  });

  it("lehnt einen numerischen String und NaN als dauer ab", async () => {
    // Der teure Fehler waere `typeof === 'number'`: NaN ist eine Zahl, liefe durch jede
    // Bereichspruefung von #45 und stuende danach als `null` in project.json.
    for (const dauer of ["20", NaN]) {
      await expect(
        rufe(KANAELE.project.setzeDauer, { elementId: "e1", dauer }),
      ).resolves.toMatchObject(UNGUELTIG);
    }
    expect(ops.setzeDauer).not.toHaveBeenCalled();
  });

  it("laesst listeProjekte ohne Nutzlast arbeiten und ignoriert eine uebergebene", async () => {
    await expect(rufe(KANAELE.project.listeProjekte)).resolves.toMatchObject({ ok: true });
    await expect(rufe(KANAELE.project.listeProjekte, { unerwartet: 1 })).resolves.toMatchObject({
      ok: true,
    });
    expect(ops.listeProjekte).toHaveBeenCalledWith();
  });

  it("weist jede projektId ab, die als Pfadsegment taugen wuerde", async () => {
    for (const projektId of ["../../x", "a/b", "a\\b", "kein-uuid", ""]) {
      await expect(rufe(KANAELE.project.listeAusgaben, { projektId })).resolves.toMatchObject(
        UNGUELTIG,
      );
    }
    expect(ops.listeAusgaben).not.toHaveBeenCalled();

    // Eine gueltige UUID kommt durch - die Pruefung sperrt Pfade aus, nicht die Operation.
    await rufe(KANAELE.project.listeAusgaben, { projektId: UUID });
    expect(ops.listeAusgaben).toHaveBeenCalledWith(UUID);
  });

  it("reicht Fachcode und daten eines Fehlschlags unveraendert durch", async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: {
        code: "nicht_gefunden",
        meldung: "Die Aktion gibt es nicht.",
        daten: { elementIds: ["e1", "e2"] },
      },
    };
    ops.löscheAktion.mockResolvedValue(fehlschlag);

    const ergebnis = await rufe(KANAELE.project.löscheAktion, { id: "a1" });

    expect(ergebnis).toBe(fehlschlag);
    expect(ergebnis).toStrictEqual(fehlschlag);
  });

  it("reicht kein_projekt unveraendert durch", async () => {
    // Seit dem 14.08.2026 tragen alle elf Mutationen diesen Code. Wuerde das Gateway ihn
    // vereinheitlichen, koennte die Oberflaeche "kein Projekt offen" nicht mehr von einem
    // Speicherfehler unterscheiden.
    const fehlschlag = {
      ok: false as const,
      fehler: { code: "kein_projekt", meldung: "Es ist kein Projekt offen." },
    };
    ops.setzeDauer.mockResolvedValue(fehlschlag);

    await expect(
      rufe(KANAELE.project.setzeDauer, { elementId: "e1", dauer: 20 }),
    ).resolves.toBe(fehlschlag);
  });

  it("fuegt einem Fehler ohne daten keines hinzu", async () => {
    ops.erstelleProjekt.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });

    const ergebnis = (await rufe(KANAELE.project.erstelleProjekt, { name: "Sommer" })) as {
      fehler: Record<string, unknown>;
    };

    expect("daten" in ergebnis.fehler).toBe(false);
  });
});
