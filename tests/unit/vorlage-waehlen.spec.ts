// Verhaltenstests zu #137 - nur nutzbare Vollflaechen-Vorlagen waehlen
// (TK 9.12.1, TK 9.11.1, TK 9.1.1).
//
// `rufeAuf` (#24) wird ersetzt, weil es an `window.api` haengt - die Bruecke gibt es
// im Testlauf nicht. Der Ersatz ist zugleich der Beweis: Der einzige Weg in den Main
// fuehrt ueber diesen Kanal, und die Tests zaehlen die Aufrufe.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Vorlage } from "../../src/shared/contracts/vorlage";
import { KANAELE } from "../../src/shared/contracts/kanaele";

const attrappen = vi.hoisted(() => ({ rufeAuf: vi.fn() }));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf }));

import * as modul from "../../src/renderer/action-editor/vorlage-waehlen";

function vorlage(teil: Partial<Vorlage>): Vorlage {
  return {
    id: "v-1",
    name: "Vorlage",
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [],
    ...teil,
  };
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("istWaehlbar", () => {
  it("ist wahr genau fuer parent === null UND höhe === null (Ganzbild)", () => {
    const a = [
      vorlage({ parent: null }),
      vorlage({ parent: null, höhe: 162 }),
      vorlage({ parent: null, höhe: 162 }),
      vorlage({ parent: "p" }),
      vorlage({ parent: "p", höhe: 162 }),
      vorlage({ parent: "p", höhe: 162 }),
    ];
    expect(a.map(modul.istWaehlbar)).toEqual([true, false, false, false, false, false]);
  });
});

describe("ladeWaehlbareVorlagen", () => {
  it("ruft rufeAuf mit dem Kanal aus KANAELE und OHNE Nutzlast", async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: [] });
    await modul.ladeWaehlbareVorlagen();
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.vorlagen.listeVorlagen);
  });

  it("behaelt eine Band-Vorlage (höhe 162) nicht im Ergebnis", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: [
        vorlage({ id: "vollbild" }),
        vorlage({ id: "band-standard", höhe: 162 }),
      ] });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({ ok: true, wert: [vorlage({ id: "vollbild" })] });
  });

  it("behaelt eine Arbeitskopie (parent !== null) nicht im Ergebnis", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: [vorlage({ id: "vollbild" }), vorlage({ id: "kopie", parent: "vollbild" })] });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({ ok: true, wert: [vorlage({ id: "vollbild" })] });
  });

  it("laesst die Bestandsreihenfolge der uebrig bleibenden Eintraege unveraendert", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: [
        vorlage({ id: "zebra", name: "Zebra" }),
        vorlage({ id: "alpha", name: "Alpha" }),
        vorlage({ id: "split", höhe: 162 }),
        vorlage({ id: "mittel", name: "Mittel" }),
      ] });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({
      ok: true,
      wert: [
        vorlage({ id: "zebra", name: "Zebra" }),
        vorlage({ id: "alpha", name: "Alpha" }),
        vorlage({ id: "mittel", name: "Mittel" }),
      ] });
  });

  it("reicht einen speicher_fehler des Stores unveraendert durch, OHNE leere Liste", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" } });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" } });
  });

  it("reicht einen generischen Fehlercode des Stores unveraendert durch", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "kaputt" } });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "kaputt" } });
  });

  it("meldet eine leere gefilterte Liste als Erfolg, nicht als Fehler", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: true,
      wert: [vorlage({ id: "band", höhe: 162 })] });
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis).toEqual({ ok: true, wert: [] });
  });

  it("faengt eine werfende rufeAuf-Attrappe als unbekannter_fehler, ohne Ausnahme", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));
    const ergebnis = await modul.ladeWaehlbareVorlagen();
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
      expect(ergebnis.fehler.meldung).toContain("window.api fehlt");
    }
  });
});

describe("findeZugewiesene", () => {
  it("liefert die passende Vorlage aus der Liste", () => {
    const gefunden = modul.findeZugewiesene("v-2", [
      vorlage({ id: "v-1" }),
      vorlage({ id: "v-2", name: "Zwei" }),
    ]);
    expect(gefunden?.id).toBe("v-2");
  });

  it("liefert null fuer eine vorlagenId, die nicht in der Liste steht - KEINE Ersatz-Vorlage", () => {
    const liste = [vorlage({ id: "v-1" }), vorlage({ id: "v-2" })];
    expect(modul.findeZugewiesene("v-99", liste)).toBeNull();
  });

  it("liefert null fuer einen leeren String (neue, noch nicht zugewiesene Aktion)", () => {
    expect(modul.findeZugewiesene("", [vorlage({ id: "v-1" })])).toBeNull();
  });
});
