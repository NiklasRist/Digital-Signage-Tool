import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProtokollEintrag } from "../../src/shared/contracts/protokoll";

// Verhaltenstest zu #56 (Q3-Ausfuehrungsprotokoll).
//
// Der Datenort ist gemockt, sonst schriebe der Test in die echte protokoll.json des
// Projektordners - und die ist "dauerhaft, unbegrenzt" (TK 9.3), also genau die Datei,
// die man nicht aus Versehen anfassen will.
//
// WAS DIESER TEST NICHT LEISTET: Er sagt nichts ueber zwei GLEICHZEITIGE Abschluesse.
// #69 garantiert Reihenfolge, nicht Unteilbarkeit; heute traegt die Seriellitaet des
// Torwaechters, dass es nur einen Schreiber gibt (s. Vermerk am Ende von
// q3-protokoll.ts). Ein Test dazu wuerde den heutigen Verlust festschreiben, statt ihn
// zu beheben - er ist gemeldet, nicht getestet.

const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { haengeProtokollEintragAn } = await import(
  "../../src/main/auftrags-manager/q3-protokoll"
);

const pfad = (): string => path.join(zustand.ordner, "protokoll.json");

function eintrag(teil: Partial<ProtokollEintrag> = {}): ProtokollEintrag {
  return {
    id: "e1",
    auftragId: "a1",
    art: "render",
    projektId: "p1",
    versuch: 1,
    begonnenAm: "2026-08-13T10:00:00.000Z",
    beendetAm: "2026-08-13T10:02:00.000Z",
    ergebnis: "erfolg",
    fehler: null,
    ausgabe: null,
    ...teil,
  };
}

async function lies(): Promise<{ schemaVersion: number; eintraege: ProtokollEintrag[] }> {
  return JSON.parse(await fs.readFile(pfad(), "utf8")) as {
    schemaVersion: number;
    eintraege: ProtokollEintrag[];
  };
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-q3-"));
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("haengeProtokollEintragAn (#56)", () => {
  it("legt die Datei beim ersten beendeten Auftrag mit Version und einem Eintrag an", async () => {
    const e = await haengeProtokollEintragAn(eintrag({ id: "erster" }));

    expect(e.ok).toBe(true);
    const datei = await lies();
    expect(datei.schemaVersion).toBe(1);
    expect(datei.eintraege).toHaveLength(1);
    expect(datei.eintraege[0]?.id).toBe("erster");
  });

  it("haengt an und laesst die vorhandenen Eintraege in ihrer Reihenfolge stehen", async () => {
    await haengeProtokollEintragAn(eintrag({ id: "a" }));
    await haengeProtokollEintragAn(eintrag({ id: "b" }));
    await haengeProtokollEintragAn(eintrag({ id: "c" }));

    expect((await lies()).eintraege.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("schreibt fuer jede Wiederholung einen eigenen Eintrag, statt den alten zu ersetzen", async () => {
    // "Fehlschlaege bleiben sichtbar" (TK 9.3): derselbe Auftrag, hoeherer versuch - zwei
    // Eintraege. Ein Ueberschreiben nach auftragId loeschte die Fehlerhistorie.
    await haengeProtokollEintragAn(
      eintrag({ id: "v1", versuch: 1, ergebnis: "fehlgeschlagen", fehler: { code: "kein_platz", meldung: "voll" } }),
    );
    await haengeProtokollEintragAn(eintrag({ id: "v2", versuch: 2 }));

    const eintraege = (await lies()).eintraege;
    expect(eintraege.map((x) => x.versuch)).toEqual([1, 2]);
    expect(eintraege.every((x) => x.auftragId === "a1")).toBe(true);
  });

  it("weist einen Eintrag ohne den Schluessel ausgabe ab und laesst die Datei unberuehrt", async () => {
    await haengeProtokollEintragAn(eintrag({ id: "vorher" }));
    const vorher = await fs.readFile(pfad(), "utf8");
    const ohneAusgabe = eintrag({ id: "luecke" }) as unknown as Record<string, unknown>;
    delete ohneAusgabe["ausgabe"];

    const e = await haengeProtokollEintragAn(ohneAusgabe as unknown as ProtokollEintrag);

    expect(e.ok).toBe(false);
    if (!e.ok) {
      expect(e.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(await fs.readFile(pfad(), "utf8")).toBe(vorher);
  });

  it("weist einen nicht beendeten Versuch ab - Q3 protokolliert nur Beendetes", async () => {
    const e = await haengeProtokollEintragAn(
      eintrag({ ergebnis: "laeuft" as unknown as ProtokollEintrag["ergebnis"] }),
    );

    expect(e.ok).toBe(false);
    if (!e.ok) {
      expect(e.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(await fs.readdir(zustand.ordner)).toEqual([]);
  });

  it("laesst eine beschaedigte protokoll.json unangetastet, statt neu anzufangen", async () => {
    // DER TEUERSTE FEHLGRIFF DES ISSUES: Wer hier mit leerer Liste neu beginnt, loescht die
    // gesamte, unwiederbringliche Historie mit einem Schreibvorgang.
    const kaputt = '{"schemaVersion": 1, "eintraege": [{"id"';
    await fs.writeFile(pfad(), kaputt, "utf8");

    const e = await haengeProtokollEintragAn(eintrag());

    expect(e.ok).toBe(false);
    if (!e.ok) {
      expect(e.fehler.code).toBe("speicher_fehler");
    }
    expect(await fs.readFile(pfad(), "utf8")).toBe(kaputt);
  });

  it("schreibt nichts, wenn die Datei eine fremde schemaVersion traegt", async () => {
    const fremd = JSON.stringify({ schemaVersion: 2, eintraege: [] });
    await fs.writeFile(pfad(), fremd, "utf8");

    const e = await haengeProtokollEintragAn(eintrag());

    expect(e.ok).toBe(false);
    if (!e.ok) {
      expect(e.fehler.code).toBe("speicher_fehler");
    }
    expect(await fs.readFile(pfad(), "utf8")).toBe(fremd);
  });
});
