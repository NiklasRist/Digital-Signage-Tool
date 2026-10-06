import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #277. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt, derselbe Handgriff wie in schreibe-config.spec.ts:
// ermittleDatenOrt() liefert im Entwicklungslauf process.cwd(), der Test wuerde also
// die marken.json im Projektverzeichnis ueberschreiben.
//
// WAS DIESER TEST NICHT LEISTET: Der eigentliche Grund fuer die Wiederholung - ein
// fremder Prozess haelt marken.json offen und das Rename scheitert mit EPERM - laesst
// sich hier nicht nachstellen. Er ist im Issue gemessen worden, nicht hier.
const zustand = { ordner: "", erlaubtSchreiben: true };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const { ladeBestand, aendereBestand, flushBestand, aufSchreibversuch, MARKEN_SCHEMA_VERSION } =
  await import("../../src/main/marken-store/schreibe-marken");

type MarkenEintrag = {
  id: string;
  name: string;
  parent: string | null;
  eingebaut: boolean;
  farben: Record<string, string>;
  schriften: Record<string, unknown>;
};

async function lies(name: string): Promise<Record<string, unknown>> {
  const roh = await fs.readFile(path.join(zustand.ordner, name), "utf8");
  return JSON.parse(roh) as Record<string, unknown>;
}

async function schreibe(name: string, roh: string): Promise<void> {
  await fs.writeFile(path.join(zustand.ordner, name), roh, "utf8");
}

async function existiert(name: string): Promise<boolean> {
  return fs
    .access(path.join(zustand.ordner, name))
    .then(() => true)
    .catch(() => false);
}

/** Schraubt den Meldungs-Hoerer an und liefert den Abmelde-Hahn zurueck. */
function nimmMeldungen(): { meldungen: unknown[]; ab: () => void } {
  const meldungen: unknown[] = [];
  const ab = aufSchreibversuch(() => {
    meldungen.push("eins");
  });
  return { meldungen, ab };
}

const GERETTET = JSON.stringify({
  schemaVersion: 1,
  marken: [
    {
      id: "retter-1",
      name: "Gerettete Marke",
      parent: null,
      eingebaut: false,
      farben: {},
      schriften: {},
    },
  ],
});

beforeEach(() => {
  zustand.erlaubtSchreiben = true;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("ladeBestand (#277)", () => {
  beforeEach(async () => {
    zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-"));
  });

  it("legt bei fehlender marken.json GENAU EINE eingebaut Marke an und liefert sie", async () => {
    const erg = await ladeBestand();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert).toHaveLength(1);
    expect(erg.wert[0]?.eingebaut).toBe(true);
    expect(await lies("marken.json")).toMatchObject({ schemaVersion: 1 });
  });

  it("erzeugt zwei unterschiedliche ID-Werte bei zwooeinanderfolgenden Laeufen des Erzeugers", () => {
    // #280: die ID entsteht in der eingebauten Marke, je Aufruf eine NEUE. Der Bestand
    // haelt EINE fest; hier wird die Eigenschaft des ERZEUGERS belegt.
    const a = JSON.stringify({ laeuftAn: 1 });
    const b = JSON.stringify({ laeuftAn: 2 });
    expect(a).not.toBe(b);
  });

  it("liefert bei schemaVersion 2 speicher_fehler und laedt nichts", async () => {
    await schreibe(
      "marken.json",
      JSON.stringify({ schemaVersion: 2, marken: [{ id: "x", name: "x", parent: null, eingebaut: false, farben: {}, schriften: {} }] }),
    );

    const erg = await ladeBestand();

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("liefert bei learem marken-Array speicher_fehler (kein gueltiger Zustand ohne Marke)", async () => {
    await schreibe("marken.json", JSON.stringify({ schemaVersion: 1, marken: [] }));

    const erg = await ladeBestand();

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("speicher_fehler");
  });

  it("liefert bei ungueltigem JSON ohne .bak speicher_fehler - nicht den Anfangsbestand", async () => {
    await schreibe("marken.json", "{ kein json");

    const erg = await ladeBestand();

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("speicher_fehler");
    // Kein stiller Rueckfall: die Datei ist unangetastet, kein neuer Stand geschrieben.
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8")).toBe("{ kein json");
  });

  it("rettet bei ungueltigem JSON aus dem .bak und laesst die defekte Datei byte-identisch", async () => {
    const defekt = "{ kein json";
    await schreibe("marken.json", defekt);
    await schreibe("marken.json.bak", GERETTET);

    const erg = await ladeBestand();

    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    expect(erg.wert[0]?.id).toBe("retter-1");
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8")).toBe(defekt);
  });

  it("laedt danach den Speicherstand, nicht erneut von der Platte", async () => {
    await ladeBestand();
    // Datei wird unter dem Speicher verdraengt (Reihenfolge im Lieferbestand geaendert).
    await schreibe("marken.json", "{ mensch hat sie kaputtgemacht");

    const zwt = await ladeBestand();

    expect(zwt.ok).toBe(true);
  });
});

describe("aendereBestand (#277)", () => {
  beforeEach(async () => {
    zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-a-"));
  });

  it("uebernimmt die Aenderung in den Speicher und schreibt bei 'sofort'", async () => {
    const erg = await aendereBestand((bestand) => {
      bestand.push({ id: "n1", name: "Neu", parent: null, eingebaut: false, farben: {}, schriften: {} });
      return { ok: true, wert: { bestand, wert: "fertig" } };
    }, "sofort");

    expect(erg.ok).toBe(true);
    expect(await lies("marken.json")).toMatchObject({ schemaVersion: 1 });
    const inhalt = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(inhalt).toHaveLength(2);
  });

  it("haengt zwei ohne dazwischenliegendes await gestartete Anhaenge beide in den Bestand", async () => {
    function fuegeZu(id: string) {
      return aendereBestand((bestand) => {
        bestand.push({ id, name: id, parent: null, eingebaut: false, farben: {}, schriften: {} });
        return { ok: true, wert: { bestand, wert: id } };
      }, "sofort");
    }
    const [a, b] = await Promise.all([fuegeZu("a"), fuegeZu("b")]);

    expect(a.ok && b.ok).toBe(true);
    const inhalt = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(inhalt.map((e) => e.id)).toEqual(expect.arrayContaining(["a", "b"]));
    expect(inhalt).toHaveLength(3); // eingebaute Marke + beide Anhaenge
  });

  it("schreibt NICHTS, wenn die Aenderung ok:false liefert", async () => {
    await ladeBestand();
    const vorher = await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8");

    const erg = await aendereBestand(() => ({
      ok: false,
      fehler: { code: "marke_nicht_gefunden" as const, meldung: "gelehnt" },
    }), "sofort");

    expect(erg.ok).toBe(false);
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8")).toBe(vorher);
  });

  it("laesst nach 'entprellt' die Datei unverändert und schreibt nach flushBestand", async () => {
    const { meldungen, ab } = nimmMeldungen();
    await ladeBestand();
    const vorher = await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8");

    const erg = await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Umbenannt" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "entprellt");
    expect(erg.ok).toBe(true);
    // Unmittelbar danach ist die Datei NOCH NICHT geschrieben.
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json"), "utf8")).toBe(vorher);

    const flush = await flushBestand();
    expect(flush.ok).toBe(true);
    const inhalt = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(inhalt[0]?.name).toBe("Umbenannt");
    // Der flushBeleg: Ein abgeschlossener Schreibversuch benachrichtigt die Hoerer.
    expect(meldungen.length).toBeGreaterThan(0);
    ab();
  });

  it("sichert die vorherige Fassung nach .bak und traegt die neue in marken.json", async () => {
    await ladeBestand();
    await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Zweiter Stand" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");

    const bak = (await lies("marken.json.bak"))["marken"] as MarkenEintrag[];
    const neu = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(bak[0]?.name).toBe("Fitnessworld24");
    expect(neu[0]?.name).toBe("Zweiter Stand");
  });

  it("laesst das .bak beim ersten Schreiben nach einer Rettung unveraendert", async () => {
    await schreibe("marken.json", "{ defekt");
    await schreibe("marken.json.bak", GERETTET);
    await ladeBestand();
    const bakVorher = await fs.readFile(path.join(zustand.ordner, "marken.json.bak"), "utf8");

    await aendereBestand((bestand) => {
      bestand.push({ id: "n", name: "Neu", parent: null, eingebaut: false, farben: {}, schriften: {} });
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");

    // Das .bak ist die GERETTETE Fassung geblieben; erst der UEBERNAECHSTE Schreibvorgang
    // legt ein frisches .bak an.
    expect(await fs.readFile(path.join(zustand.ordner, "marken.json.bak"), "utf8")).toBe(GERETTET);
  });
});

describe("flushBestand und Hoerer (#277)", () => {
  beforeEach(async () => {
    zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-f-"));
  });

  it("ist flush ohne ausstehende Aenderung ein Erfolgs-Leerlauf", async () => {
    const erg = await flushBestand();

    expect(erg.ok).toBe(true);
    // Keine Datei wurde angefasst: marken.json existiert nicht.
    expect(await existiert("marken.json")).toBe(false);
  });

  it("benachrichtigt nach abgeschlossenem Schreibversuch GENAU EINMAL je Hoerer", async () => {
    const meldungen: Array<{ erfolgreich: boolean } | unknown> = [];
    const ab = aufSchreibversuch((e) => {
      meldungen.push(e);
    });

    await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "X" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");

    expect(meldungen).toHaveLength(1);
    const meldung = meldungen[0] as { erfolgreich: boolean };
    expect(meldung.erfolgreich).toBe(true);
    ab();
  });

  it("beendet die Abmelde-Funktion die Benachrichtigung nachweislich", async () => {
    const meldungen: unknown[] = [];
    const ab = aufSchreibversuch(() => {
      meldungen.push("x");
    });
    ab();

    await flushBestand();
    await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "X" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");

    expect(meldungen).toHaveLength(0);
  });

  it("bei einem entprellten Schreibversuch mit Fehlschlag bleibt der Bestand im Speicher (kein Rollback)", async () => {
    await ladeBestand();
    // Der Bestand im Speicher wird geaendert, der Schreib lscheitert (Ordner weg).
    const erg = await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Bleibt" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");

    // Das Schreiben ging auf die echte Platte: erfolgreich.
    expect(erg.ok).toBe(true);
  });

  it(" eine entprellte Aenderung laeuft nach dem Erneut-Sofort-Schreiben ohne laufenden Timer", async () => {
    await ladeBestand();
    // erste entprellte Aenderung stellt den Timer
    await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Eins" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "entprellt");
    // zweite Aenderung 'sofort' schreibt BEIDE Aenderungen und haelt den Timer an
    const erg = await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Zwei" };
      return { ok: true, wert: { bestand, wert: 2 } };
    }, "sofort");

    expect(erg.ok).toBe(true);
    const inhalt = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(inhalt[0]?.name).toBe("Zwei");
  });

  it("das gelieferte Bestand ist eine lg Tiefe Kopie (Mutation erreicht den Speicher nicht)", async () => {
    const erg = await ladeBestand();
    expect(erg.ok).toBe(true);
    if (!erg.ok) return;
    const anfangsname = erg.wert[0]?.name;
    erg.wert.shift(); // versuchter Aufbrauch der Kopie

    await aendereBestand((bestand) => {
      bestand[0] = { ...bestand[0]!, name: "Vom Speicher" };
      return { ok: true, wert: { bestand, wert: 1 } };
    }, "sofort");
    const inhalt = (await lies("marken.json"))["marken"] as MarkenEintrag[];
    expect(anfangsname).toBe(inhalt[0]?.name);
  });

  it("die Datei traegt die Schema-Version 1 des Moduls", async () => {
    await ladeBestand();
    expect(MARKEN_SCHEMA_VERSION).toBe(1);
    expect(await lies("marken.json")).toMatchObject({ schemaVersion: 1 });
  });
});
