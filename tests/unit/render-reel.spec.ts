// Tests zu #181 - der Dirigent der Render-Kette.
//
// ECHT gelassen sind #179 (abbruch.ts) und der Ausgabeordner auf der Platte: Genau
// dort sitzen die Zusagen, die still versagen - dass das AbortSignal aus derselben
// Quelle kommt wie istAbgebrochen(), und dass die `.part` in JEDEM nicht
// erfolgreichen Ausgang wirklich weg ist. Eine Attrappe wuerde hier das behaupten,
// was der Test hoeren will.
//
// ATTRAPPIERT sind alle Bausteine, die einen Prozess starten oder Platz brauchen
// (#169, #170, #172, #173, #174, #175, #177, #180) sowie #178 - der Sender wird als
// Zaehlwerk gebraucht, um `schliesse()` und die Fortschritts-Naht zu pruefen.
//
// NICHT hier: ob die erzeugte Datei am Fernseher laeuft, und ob concat mit `-c copy`
// tatsaechlich ein fehlendes Segment durchwinkt. Das erste kann ein Unit-Test
// grundsaetzlich nicht sagen, das zweite ist in #180 gemessen.
import { mkdtempSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { ChildProcess } from "node:child_process";
import type { RenderItem, RenderRequest } from "../../src/shared/contracts/render-request";
import type { RenderProgress } from "../../src/shared/contracts/render-result";

const attrappe = vi.hoisted(() => ({
  pruefeRenderRequest: vi.fn(),
  loeseAusgabePfad: vi.fn(),
  ausgabeOrdner: vi.fn(),
  pruefeMedienVorhanden: vi.fn(),
  normalisiereElement: vi.fn(),
  leseMarke: vi.fn(),
  ermittleFfprobePfad: vi.fn(),
  erzeugeArbeitsbereich: vi.fn(),
  verwirfArbeitsbereich: vi.fn(),
  legePngsAb: vi.fn(),
  gesamtdauer: vi.fn(),
  pruefeUniformitaet: vi.fn(),
  fuehreConcatAus: vi.fn(),
  verifiziereUndPlatziere: vi.fn(),
  merkeProzess: vi.fn(),
  gibProzessFrei: vi.fn(),
  beendeLaufendenProzess: vi.fn(),
  erzeugeFortschrittSender: vi.fn(),
}));

vi.mock("../../src/main/render-service/validierung", () => ({
  pruefeRenderRequest: attrappe.pruefeRenderRequest,
}));
vi.mock("../../src/main/project-store/pfade", () => ({
  loeseAusgabePfad: attrappe.loeseAusgabePfad,
  ausgabeOrdner: attrappe.ausgabeOrdner,
}));
vi.mock("../../src/main/render-service/normalisieren", () => ({
  pruefeMedienVorhanden: attrappe.pruefeMedienVorhanden,
  normalisiereElement: attrappe.normalisiereElement,
}));
vi.mock("../../src/main/config-store/lese-marke", () => ({
  leseMarke: attrappe.leseMarke,
}));
vi.mock("../../src/main/ffmpeg-pfad", () => ({
  ermittleFfprobePfad: attrappe.ermittleFfprobePfad,
  ermittleFfmpegPfad: () => "/nicht/gerufen/ffmpeg",
}));
vi.mock("../../src/main/render-service/arbeitsbereich", () => ({
  erzeugeArbeitsbereich: attrappe.erzeugeArbeitsbereich,
  verwirfArbeitsbereich: attrappe.verwirfArbeitsbereich,
}));
vi.mock("../../src/main/render-service/png-ablage", () => ({
  legePngsAb: attrappe.legePngsAb,
}));
vi.mock("../../src/main/render-service/frames", () => ({
  gesamtdauer: attrappe.gesamtdauer,
}));
vi.mock("../../src/main/ffmpeg-adapter/uniformitaet", () => ({
  pruefeUniformitaet: attrappe.pruefeUniformitaet,
}));
vi.mock("../../src/main/ffmpeg-adapter/concat", () => ({
  fuehreConcatAus: attrappe.fuehreConcatAus,
}));
vi.mock("../../src/main/render-service/ausgabe-platzieren", () => ({
  verifiziereUndPlatziere: attrappe.verifiziereUndPlatziere,
}));
vi.mock("../../src/main/ffmpeg-adapter/abbruch", () => ({
  merkeProzess: attrappe.merkeProzess,
  gibProzessFrei: attrappe.gibProzessFrei,
  beendeLaufendenProzess: attrappe.beendeLaufendenProzess,
}));
vi.mock("../../src/main/render-service/fortschritt", () => ({
  erzeugeFortschrittSender: attrappe.erzeugeFortschrittSender,
}));

// #179 bleibt ECHT - siehe Kopf.
import { cancelRender } from "../../src/main/render-service/abbruch";
import { renderReel } from "../../src/main/render-service/render-reel";

const wurzel = mkdtempSync(path.join(tmpdir(), "render-reel-test-"));
afterAll(() => {
  rmSync(wurzel, { recursive: true, force: true });
});

const QUELLE = readFileSync(
  path.join(__dirname, "..", "..", "src", "main", "render-service", "render-reel.ts"),
  "utf8",
);

let laufZaehler = 0;

interface SenderProtokoll {
  starteElement: ReturnType<typeof vi.fn>;
  meldeAnteil: ReturnType<typeof vi.fn>;
  beendeElement: ReturnType<typeof vi.fn>;
  starteVerketten: ReturnType<typeof vi.fn>;
  schliesse: ReturnType<typeof vi.fn>;
}
let sender: SenderProtokoll;
let ausgabeVerzeichnis: string;
let t1: string;

function element(id: string): RenderItem {
  return { id, art: "segment", png: new Uint8Array([1]), dauer: 10 };
}

function anfrage(ueberschreibung: Partial<RenderRequest> = {}): RenderRequest {
  laufZaehler += 1;
  return {
    renderId: `r-${String(laufZaehler)}`,
    projektId: "p-1",
    elemente: [element("e-1"), element("e-2")],
    profil: RENDER_PROFILE,
    ausgabeName: "Sommeraktion",
    ...ueberschreibung,
  };
}

/** Der Zielpfad, den die Pfad-Autorität für diese Anfrage liefert. */
function zielVon(request: RenderRequest): string {
  return path.join(ausgabeVerzeichnis, `${request.ausgabeName}.mp4`);
}

beforeEach(() => {
  vi.clearAllMocks();
  ausgabeVerzeichnis = mkdtempSync(path.join(wurzel, "out-"));
  t1 = mkdtempSync(path.join(wurzel, "t1-"));

  sender = {
    starteElement: vi.fn(),
    meldeAnteil: vi.fn(),
    beendeElement: vi.fn(),
    starteVerketten: vi.fn(),
    schliesse: vi.fn(),
  };
  attrappe.erzeugeFortschrittSender.mockReturnValue(sender);

  attrappe.pruefeRenderRequest.mockReturnValue({ ok: true, wert: undefined });
  attrappe.ausgabeOrdner.mockImplementation(() => ausgabeVerzeichnis);
  attrappe.loeseAusgabePfad.mockImplementation((_p: string, name: string) => ({
    ok: true,
    wert: path.join(ausgabeVerzeichnis, `${name}.mp4`),
  }));
  attrappe.pruefeMedienVorhanden.mockResolvedValue({ ok: true, wert: undefined });
  attrappe.leseMarke.mockResolvedValue({
    ok: true,
    wert: { farben: { flaecheDunkel: "#2F2E2E" } },
  });
  attrappe.ermittleFfprobePfad.mockReturnValue("/gebuendelt/ffprobe");
  attrappe.erzeugeArbeitsbereich.mockImplementation(() => Promise.resolve({ ok: true, wert: t1 }));
  attrappe.verwirfArbeitsbereich.mockResolvedValue(undefined);
  attrappe.legePngsAb.mockResolvedValue({
    ok: true,
    wert: { segmentPngs: ["/t1/segment-0000.png", "/t1/segment-0001.png"], bandPngs: [[], []] },
  });
  attrappe.gesamtdauer.mockReturnValue({ ok: true, wert: 20 });
  attrappe.normalisiereElement.mockImplementation((_e: RenderItem, index: number) =>
    Promise.resolve({ ok: true, wert: path.join(t1, `seg_000${String(index)}.mp4`) }),
  );
  attrappe.pruefeUniformitaet.mockResolvedValue({
    ok: true,
    wert: { ok: true, abweichungen: [] },
  });
  attrappe.fuehreConcatAus.mockResolvedValue({ ok: true, wert: undefined });
  attrappe.verifiziereUndPlatziere.mockImplementation((_part: string, ziel: string) =>
    Promise.resolve({ ok: true, wert: { ausgabePfad: ziel, dateigroesse: 4711 } }),
  );
});

describe("renderReel - Erfolg", () => {
  it("liefert genau die Nutzdaten aus TK 9.2.3 und keinen Bissen mehr", async () => {
    const request = anfrage();
    const ergebnis = await renderReel(request, () => undefined);

    expect(ergebnis).toEqual({
      status: "erfolg",
      renderId: request.renderId,
      ausgabePfad: zielVon(request),
      ausgabeName: "Sommeraktion",
      gesamtdauer: 20,
      dateigroesse: 4711,
    });
  });

  it("reicht `ausgabeName` zeichengleich durch, statt ihn aus dem Pfad zurueckzurechnen", async () => {
    // Der Name unterscheidet sich absichtlich vom Dateinamen im Pfad: Eine
    // Rueckrechnung per basename lieferte "anders", nicht "Sommeraktion".
    attrappe.loeseAusgabePfad.mockReturnValue({
      ok: true,
      wert: path.join(ausgabeVerzeichnis, "anders.mp4"),
    });
    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(ergebnis).toMatchObject({ status: "erfolg", ausgabeName: "Sommeraktion" });
    expect(JSON.stringify(ergebnis)).not.toContain(".mp4\",\"gesamtdauer");
  });

  it("verwirft T1 genau einmal und laesst die Zieldatei stehen", async () => {
    await renderReel(anfrage(), () => undefined);

    expect(attrappe.verwirfArbeitsbereich).toHaveBeenCalledTimes(1);
    expect(attrappe.verwirfArbeitsbereich).toHaveBeenCalledWith(t1);
    expect(sender.schliesse).toHaveBeenCalledTimes(1);
  });

  it("legt den Ausgabeordner an, bevor die .part geschrieben wird", async () => {
    const frisch = path.join(wurzel, "noch-nicht-da", "tief");
    attrappe.ausgabeOrdner.mockReturnValue(frisch);
    attrappe.loeseAusgabePfad.mockReturnValue({ ok: true, wert: path.join(frisch, "x.mp4") });

    await renderReel(anfrage(), () => undefined);

    expect(existsSync(frisch)).toBe(true);
  });

  it("ruft ermittleFfprobePfad genau einmal und reicht denselben Wert an #170 und #180", async () => {
    await renderReel(anfrage(), () => undefined);

    expect(attrappe.ermittleFfprobePfad).toHaveBeenCalledTimes(1);
    expect(attrappe.pruefeUniformitaet.mock.calls[0]?.[2]).toBe("/gebuendelt/ffprobe");
    expect(attrappe.verifiziereUndPlatziere.mock.calls[0]?.[4]).toBe("/gebuendelt/ffprobe");
  });

  it("ruft leseMarke genau einmal und traegt flaecheDunkel unveraendert in den Kontext", async () => {
    await renderReel(anfrage(), () => undefined);

    expect(attrappe.leseMarke).toHaveBeenCalledTimes(1);
    expect(attrappe.normalisiereElement.mock.calls[0]?.[3]).toMatchObject({
      flaecheDunkel: "#2F2E2E",
      projektId: "p-1",
      arbeitsbereich: t1,
      profil: RENDER_PROFILE,
    });
  });

  it("reicht die PNG-Pfade index-parallel durch", async () => {
    await renderReel(anfrage(), () => undefined);

    expect(attrappe.normalisiereElement.mock.calls[0]?.[2]).toEqual({
      segment: "/t1/segment-0000.png",
      band: [],
    });
    expect(attrappe.normalisiereElement.mock.calls[1]?.[2]).toEqual({
      segment: "/t1/segment-0001.png",
      band: [],
    });
  });

  it("uebergibt #180 die framegerundete Solldauer aus #174", async () => {
    await renderReel(anfrage(), () => undefined);
    expect(attrappe.verifiziereUndPlatziere.mock.calls[0]?.[2]).toBe(20);
  });
});

describe("renderReel - Abbruch-Kette", () => {
  it("haengt DASSELBE Signal wie istAbgebrochen() sowie beide Prozess-Haken in den Kontext", async () => {
    const request = anfrage();
    let signal: AbortSignal | undefined;
    attrappe.normalisiereElement.mockImplementation(
      (_e: RenderItem, index: number, _p: unknown, kontext: { abbruchSignal: AbortSignal }) => {
        signal = kontext.abbruchSignal;
        return Promise.resolve({ ok: true, wert: `seg${String(index)}` });
      },
    );

    await renderReel(request, () => undefined);

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(attrappe.normalisiereElement.mock.calls[0]?.[3]).toMatchObject({
      merkeProzess: attrappe.merkeProzess,
      gibProzessFrei: attrappe.gibProzessFrei,
    });
  });

  it("uebergibt fuehreConcatAus fuenf Argumente mit beiden Haken und OHNE aufAusgabeZeile", async () => {
    await renderReel(anfrage(), () => undefined);

    const aufruf = attrappe.fuehreConcatAus.mock.calls[0];
    expect(aufruf).toHaveLength(5);
    const lauf = aufruf?.[4] as Record<string, unknown>;
    expect(typeof lauf.aufProzessStart).toBe("function");
    expect(lauf.abbruchSignal).toBeInstanceOf(AbortSignal);
    expect("aufAusgabeZeile" in lauf).toBe(false);
    expect(aufruf?.[1]).toBe(`${t1}/concat.txt`);
  });

  it("gibt den concat-Prozess auch dann frei, wenn der concat scheitert", async () => {
    const kind = { pid: 4242 } as unknown as ChildProcess;
    attrappe.fuehreConcatAus.mockImplementation(
      (
        _s: string[],
        _l: string,
        _z: string,
        _p: unknown,
        lauf: { aufProzessStart?: (k: ChildProcess) => void },
      ) => {
        lauf.aufProzessStart?.(kind);
        return Promise.resolve({ ok: false, fehler: { code: "ffmpeg_fehler", meldung: "x" } });
      },
    );

    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(attrappe.merkeProzess).toHaveBeenCalledWith(kind);
    expect(attrappe.gibProzessFrei).toHaveBeenCalledWith(kind);
    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "ffmpeg_fehler" });
  });

  it("endet als `abgebrochen` mit dem Index des zuletzt begonnenen Elements - auch wenn der Aufruf einen Fehler meldete", async () => {
    const request = anfrage({ elemente: [element("e-1"), element("e-2"), element("e-3")] });
    attrappe.legePngsAb.mockResolvedValue({
      ok: true,
      wert: { segmentPngs: [null, null, null], bandPngs: [[], [], []] },
    });
    attrappe.normalisiereElement.mockImplementation((_e: RenderItem, index: number) => {
      if (index === 1) {
        // So sieht ein Abbruch von aussen aus: Der laufende ffmpeg-Aufruf endet mit
        // einem Fehler, WEIL der Prozess beendet wurde.
        cancelRender(request.renderId);
        return Promise.resolve({
          ok: false,
          fehler: { code: "ffmpeg_fehler", meldung: "Prozess beendet" },
        });
      }
      return Promise.resolve({ ok: true, wert: `seg${String(index)}` });
    });

    const ergebnis = await renderReel(request, () => undefined);

    expect(ergebnis).toEqual({
      status: "abgebrochen",
      renderId: request.renderId,
      abgebrochenBei: 1,
    });
    expect(attrappe.fuehreConcatAus).not.toHaveBeenCalled();
    expect(attrappe.verwirfArbeitsbereich).toHaveBeenCalledTimes(1);
  });

  it("liefert abgebrochenBei: null, wenn noch kein Element begonnen wurde", async () => {
    const request = anfrage();
    attrappe.legePngsAb.mockImplementation(() => {
      cancelRender(request.renderId);
      return Promise.resolve({
        ok: true,
        wert: { segmentPngs: [null, null], bandPngs: [[], []] },
      });
    });

    const ergebnis = await renderReel(request, () => undefined);

    expect(ergebnis).toEqual({
      status: "abgebrochen",
      renderId: request.renderId,
      abgebrochenBei: null,
    });
    expect(attrappe.normalisiereElement).not.toHaveBeenCalled();
  });

  it("entfernt die .part beim Abbruch und laesst eine vorhandene Zieldatei unversehrt", async () => {
    const request = anfrage();
    const zielPfad = zielVon(request);
    const partPfad = `${zielPfad}.part`;
    writeFileSync(zielPfad, "alte gute Datei");

    attrappe.normalisiereElement.mockImplementation((_e: RenderItem, index: number) => {
      writeFileSync(partPfad, "halbe Datei");
      cancelRender(request.renderId);
      return Promise.resolve({ ok: true, wert: `seg${String(index)}` });
    });

    const ergebnis = await renderReel(request, () => undefined);

    expect(ergebnis).toMatchObject({ status: "abgebrochen" });
    expect(existsSync(partPfad)).toBe(false);
    expect(readFileSync(zielPfad, "utf8")).toBe("alte gute Datei");
  });

  it("bildet ffmpeg_abgebrochen ohne gesetztes Kennzeichen auf ffmpeg_fehler ab", async () => {
    attrappe.fuehreConcatAus.mockResolvedValue({
      ok: false,
      fehler: { code: "ffmpeg_abgebrochen", meldung: "Signal" },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "ffmpeg_fehler" });
    expect(JSON.stringify(ergebnis)).not.toContain("ffmpeg_abgebrochen");
  });
});

describe("renderReel - Fortschritts-Naht", () => {
  it("reicht den Anteil aus #177 UNVERAENDERT an meldeAnteil - kein zweites Teilen", async () => {
    attrappe.normalisiereElement.mockImplementation(
      (
        _e: RenderItem,
        index: number,
        _p: unknown,
        kontext: { aufElementFortschritt: (a: number) => void },
      ) => {
        // #177 hat bereits 42 % zu 0.42 gemacht.
        kontext.aufElementFortschritt(0.42);
        return Promise.resolve({ ok: true, wert: `seg${String(index)}` });
      },
    );

    await renderReel(anfrage(), () => undefined);

    expect(sender.meldeAnteil).toHaveBeenCalledWith(0.42);
    expect(sender.meldeAnteil).not.toHaveBeenCalledWith(0.0042);
  });

  it("meldet Elementwechsel und den Uebergang ins Verketten in dieser Reihenfolge", async () => {
    await renderReel(anfrage(), () => undefined);

    expect(sender.starteElement.mock.calls).toEqual([
      [0, "e-1"],
      [1, "e-2"],
    ]);
    expect(sender.beendeElement).toHaveBeenCalledTimes(2);
    expect(sender.starteVerketten).toHaveBeenCalledTimes(1);
    expect(sender.schliesse).toHaveBeenCalledTimes(1);
  });

  it("reicht den Rueckruf aus #68 an den Sender weiter, statt ihn selbst zu rufen", async () => {
    const aufFortschritt = vi.fn<(f: RenderProgress) => void>();
    const request = anfrage();

    await renderReel(request, aufFortschritt);

    expect(attrappe.erzeugeFortschrittSender).toHaveBeenCalledWith(
      request.renderId,
      2,
      aufFortschritt,
    );
    expect(aufFortschritt).not.toHaveBeenCalled();
  });
});

describe("renderReel - Fehlerpfade", () => {
  it("prueft die Medien VOR dem ersten ffmpeg-Aufruf", async () => {
    attrappe.pruefeMedienVorhanden.mockResolvedValue({
      ok: false,
      fehler: { code: "medium_fehlt", meldung: "fehlt", daten: { elementId: "e-2" } },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(ergebnis).toMatchObject({
      status: "fehler",
      fehlercode: "medium_fehlt",
      fehlerhaftesElementId: "e-2",
    });
    expect(attrappe.normalisiereElement).not.toHaveBeenCalled();
    expect(attrappe.pruefeUniformitaet).not.toHaveBeenCalled();
    expect(attrappe.fuehreConcatAus).not.toHaveBeenCalled();
  });

  it("ruft verwirfArbeitsbereich GAR NICHT, wenn der Lauf vor Schritt 6 scheitert", async () => {
    for (const vorbereiten of [
      () => {
        attrappe.pruefeRenderRequest.mockReturnValue({
          ok: false,
          fehler: { code: "ungueltige_eingabe", meldung: "leer" },
        });
      },
      () => {
        attrappe.loeseAusgabePfad.mockReturnValue({
          ok: false,
          fehler: { code: "ungueltige_eingabe", meldung: "Name" },
        });
      },
      () => {
        attrappe.leseMarke.mockResolvedValue({
          ok: false,
          fehler: { code: "unbekannter_fehler", meldung: "Paket" },
        });
      },
      () => {
        attrappe.erzeugeArbeitsbereich.mockResolvedValue({
          ok: false,
          fehler: { code: "kein_platz", meldung: "voll" },
        });
      },
    ]) {
      attrappe.verwirfArbeitsbereich.mockClear();
      vorbereiten();

      const ergebnis = await renderReel(anfrage(), () => undefined);

      expect(ergebnis.status).toBe("fehler");
      expect(attrappe.verwirfArbeitsbereich).not.toHaveBeenCalled();
    }
  });

  it("uebernimmt den Code aus #180 unveraendert, auch wenn die .part dort schon weg ist", async () => {
    attrappe.verifiziereUndPlatziere.mockResolvedValue({
      ok: false,
      fehler: { code: "ffmpeg_fehler", meldung: "Dauer weicht um 60,000 s ab" },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "ffmpeg_fehler" });
    expect(ergebnis).toMatchObject({ meldung: "Dauer weicht um 60,000 s ab" });
    expect(attrappe.verwirfArbeitsbereich).toHaveBeenCalledTimes(1);
  });

  it("wertet den Uniformitaetsbefund als Fehlschlag des Laufs und laesst den concat aus", async () => {
    attrappe.pruefeUniformitaet.mockResolvedValue({
      ok: true,
      wert: {
        ok: false,
        abweichungen: [
          { datei: "seg_0001.mp4", feld: "fps", erwartet: "30/1", gefunden: "25/1" },
        ],
      },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);

    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "ffmpeg_fehler" });
    expect((ergebnis as { meldung: string }).meldung).toContain("seg_0001.mp4");
    expect(attrappe.fuehreConcatAus).not.toHaveBeenCalled();
  });

  it("leitet ENOSPC aus dem Listen-Schreibfehler von #169 auf kein_platz", async () => {
    attrappe.fuehreConcatAus.mockResolvedValue({
      ok: false,
      fehler: {
        code: "unbekannter_fehler",
        meldung: "Liste",
        daten: { systemFehlercode: "ENOSPC" },
      },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);
    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "kein_platz" });
  });

  it("leitet jeden anderen Systemfehler von #169 auf speicher_fehler", async () => {
    attrappe.fuehreConcatAus.mockResolvedValue({
      ok: false,
      fehler: {
        code: "unbekannter_fehler",
        meldung: "Liste",
        daten: { systemFehlercode: "EACCES" },
      },
    });

    const ergebnis = await renderReel(anfrage(), () => undefined);
    expect(ergebnis).toMatchObject({ status: "fehler", fehlercode: "speicher_fehler" });
  });

  it("uebernimmt die Element-ID aus fehler.daten, sonst null", async () => {
    attrappe.normalisiereElement.mockResolvedValue({
      ok: false,
      fehler: {
        code: "ungueltiges_element",
        meldung: "kaputt",
        daten: { elementId: "e-1" },
      },
    });
    const mitId = await renderReel(anfrage(), () => undefined);
    expect(mitId).toMatchObject({ fehlercode: "ungueltiges_element", fehlerhaftesElementId: "e-1" });

    attrappe.normalisiereElement.mockResolvedValue({
      ok: false,
      fehler: { code: "kein_platz", meldung: "voll" },
    });
    const ohneId = await renderReel(anfrage(), () => undefined);
    expect(ohneId).toMatchObject({ fehlercode: "kein_platz", fehlerhaftesElementId: null });
  });

  it("wirft nie - egal welcher Baustein wirft", async () => {
    const werfer: (keyof typeof attrappe)[] = [
      "pruefeRenderRequest",
      "loeseAusgabePfad",
      "pruefeMedienVorhanden",
      "leseMarke",
      "ermittleFfprobePfad",
      "erzeugeArbeitsbereich",
      "ausgabeOrdner",
      "legePngsAb",
      "gesamtdauer",
      "normalisiereElement",
      "pruefeUniformitaet",
      "fuehreConcatAus",
      "verifiziereUndPlatziere",
    ];

    for (const name of werfer) {
      const gemerkt = attrappe[name].getMockImplementation();
      attrappe[name].mockImplementation(() => {
        throw new Error(`${name} ist geplatzt`);
      });

      const ergebnis = await renderReel(anfrage(), () => undefined);

      expect(ergebnis, name).toMatchObject({
        status: "fehler",
        fehlercode: "unbekannter_fehler",
        fehlerhaftesElementId: null,
      });
      // Kein Stacktrace und keine Node-Fehlerklasse beim Nutzer.
      expect((ergebnis as { meldung: string }).meldung).not.toContain("geplatzt");
      expect(sender.schliesse).toHaveBeenCalled();

      attrappe[name].mockReset();
      if (gemerkt !== undefined) attrappe[name].mockImplementation(gemerkt);
    }
  });
});

describe("renderReel - Formprobe an der Quelldatei", () => {
  it("enthaelt genau einen `return` in renderReel selbst", () => {
    const rumpf = QUELLE.slice(
      QUELLE.indexOf("export async function renderReel"),
      QUELLE.indexOf("// Ergebnis-Bau"),
    )
      // OHNE die Kommentare: Die Begruendung dieser Bauweise spricht selbst ueber
      // `return`s. Wer die Zeilen mitzaehlt, zaehlt Prosa.
      .replace(/\/\/.*$/gm, "");
    expect(rumpf.match(/\breturn\b/g)).toHaveLength(1);
  });

  it("kennt weder `historieEintrag` noch eine eigene Pfad- oder Namensbildung", () => {
    expect(QUELLE).not.toContain("historieEintrag");
    expect(QUELLE).not.toContain("'projects'");
    expect(QUELLE).not.toContain('"projects"');
    expect(QUELLE).not.toContain("path.join");
    expect(QUELLE).not.toContain("ermittleFfmpegPfad");
  });
});
