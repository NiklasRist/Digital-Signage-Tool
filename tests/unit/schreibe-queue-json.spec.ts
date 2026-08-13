import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  aendereQueueDatei,
  leseQueueDatei,
  schreibeQueueDatei,
} from "../../src/main/auftrags-manager/schreibe-queue-json";

// Unit-Test zu #69. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen. Ein Mock ist nicht noetig: Beide Funktionen
// bekommen ihren Pfad uebergeben und kennen das Datei-Layout nicht.
//
// WAS DIESER TEST NICHT LEISTET: Der eigentliche Grund fuer die Wiederholung - ein
// fremder Prozess haelt die Zieldatei offen und das Rename scheitert mit EPERM - laesst
// sich hier nicht nachstellen; er ist in #31 gemessen worden. Ebenso wenig pruefbar ist
// der Stromausfall zwischen fsync und Rename.

let ordner = "";

function p(name: string): string {
  return path.join(ordner, name);
}

async function lies(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(await fs.readFile(p(name), "utf8")) as Record<string, unknown>;
}

async function existiert(name: string): Promise<boolean> {
  return fs
    .access(p(name))
    .then(() => true)
    .catch(() => false);
}

beforeEach(async () => {
  ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-queue-"));
});

afterEach(async () => {
  await fs.rm(ordner, { recursive: true, force: true });
});

describe("leseQueueDatei (#69)", () => {
  it("liefert den fallback, wenn die Datei fehlt, und legt dabei nichts an", async () => {
    // Erste Benutzung - keine der drei Queue-Dateien existiert beim allerersten Start.
    const ergebnis = await leseQueueDatei(p("q2.json"), { eintraege: [] });

    expect(ergebnis).toEqual({ ok: true, wert: { eintraege: [] } });
    expect(await fs.readdir(ordner)).toEqual([]);
  });

  it("liefert den geparsten Inhalt einer gueltigen Datei", async () => {
    await fs.writeFile(p("q3.json"), JSON.stringify({ eintraege: [1, 2] }), "utf8");

    const ergebnis = await leseQueueDatei(p("q3.json"), { eintraege: [] });

    expect(ergebnis).toEqual({ ok: true, wert: { eintraege: [1, 2] } });
  });

  it("meldet speicher_fehler statt des fallback, wenn Datei und .bak unbrauchbar sind", async () => {
    // DER KERN DES ISSUES: Ein stiller Rueckfall auf den fallback verwandelte eine
    // beschaedigte Q2 in eine leere und vernichtete alle vorgemerkten Fehlschlaege.
    await fs.writeFile(p("q2.json"), '{"eintraege": [{"id"', "utf8");

    const ergebnis = await leseQueueDatei(p("q2.json"), { eintraege: [] });

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
    }
  });

  it("rettet aus der .bak und laesst die defekte Datei dabei unangetastet", async () => {
    const kaputt = '{"eintraege": [{"id"';
    await fs.writeFile(p("q2.json"), kaputt, "utf8");
    await fs.writeFile(p("q2.json.bak"), JSON.stringify({ eintraege: ["gerettet"] }), "utf8");

    const ergebnis = await leseQueueDatei(p("q2.json"), { eintraege: [] });

    expect(ergebnis).toEqual({ ok: true, wert: { eintraege: ["gerettet"] } });
    // Repariert wird nichts von selbst - das Zurueckschreiben gehoert dem naechsten
    // regulaeren schreibeQueueDatei des Aufrufers.
    expect(await fs.readFile(p("q2.json"), "utf8")).toBe(kaputt);
  });

  it("weist einen leeren Pfad ab", async () => {
    const ergebnis = await leseQueueDatei("", { eintraege: [] });

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
  });

  it("sieht einen noch nicht erwarteten Schreibvorgang derselben Datei", async () => {
    // Das Lesen laeuft ebenfalls ueber die Kette (STOPP-Punkt, hier entschieden): Wer
    // schreibt und ohne await weiterliest, bekaeme sonst den Stand VOR seiner eigenen
    // Aenderung und schriebe ihn anschliessend zurueck.
    void schreibeQueueDatei(p("q4.json"), { lauf: 1 });
    const ergebnis = await leseQueueDatei(p("q4.json"), { lauf: 0 });

    expect(ergebnis).toEqual({ ok: true, wert: { lauf: 1 } });
  });
});

describe("schreibeQueueDatei (#69)", () => {
  it("schreibt die Datei und legt beim ersten Mal keine .bak an", async () => {
    const ergebnis = await schreibeQueueDatei(p("q3.json"), { eintraege: ["a"] });

    expect(ergebnis.ok).toBe(true);
    expect(await lies("q3.json")).toEqual({ eintraege: ["a"] });
    expect(await existiert("q3.json.bak")).toBe(false);
  });

  it("sichert vor jedem weiteren Schreiben die vorherige Fassung nach .bak", async () => {
    await schreibeQueueDatei(p("q3.json"), { stand: "alt" });
    await schreibeQueueDatei(p("q3.json"), { stand: "neu" });

    expect(await lies("q3.json.bak")).toEqual({ stand: "alt" });
    expect(await lies("q3.json")).toEqual({ stand: "neu" });
  });

  it("laesst die Zieldatei unveraendert, wenn das Schreiben der .tmp scheitert", async () => {
    await schreibeQueueDatei(p("q3.json"), { stand: "alt" });
    // Ein Verzeichnis an der Stelle der .tmp: fs.open(.., 'w') scheitert - dasselbe
    // Ergebnis wie ein Abbruch mitten im Schreiben, nur reproduzierbar.
    await fs.mkdir(p("q3.json.tmp"));

    const ergebnis = await schreibeQueueDatei(p("q3.json"), { stand: "neu" });

    expect(ergebnis.ok).toBe(false);
    expect(await lies("q3.json")).toEqual({ stand: "alt" });
  });

  it("weist nicht serialisierbaren Inhalt ab, ohne .bak oder .tmp anzufassen", async () => {
    await schreibeQueueDatei(p("q3.json"), { stand: "alt" });
    const zirkel: Record<string, unknown> = {};
    zirkel["selbst"] = zirkel;

    const ergebnis = await schreibeQueueDatei(p("q3.json"), zirkel);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(await existiert("q3.json.bak")).toBe(false);
    expect(await existiert("q3.json.tmp")).toBe(false);
    expect(await lies("q3.json")).toEqual({ stand: "alt" });
  });

  it("weist eine Funktion als Inhalt ab, statt das Wort undefined zu schreiben", async () => {
    const ergebnis = await schreibeQueueDatei(p("q3.json"), () => undefined);

    expect(ergebnis.ok).toBe(false);
    expect(await existiert("q3.json")).toBe(false);
  });

  it("ueberschreibt eine heile .bak nicht mit einer kaputten Zieldatei", async () => {
    // Der gefaehrliche Ablauf: Die Datei ist defekt, der Stand wurde aus der .bak
    // gerettet. Wuerde jetzt blind gesichert, kopierte die kaputte Fassung ueber die
    // einzige heile - und ein anschliessend scheiterndes Schreiben (volle Platte, meist
    // genau die Ursache) liesse gar nichts Brauchbares zurueck.
    await fs.writeFile(p("q2.json"), "{kaputt", "utf8");
    await fs.writeFile(p("q2.json.bak"), JSON.stringify({ stand: "heil" }), "utf8");

    const ergebnis = await schreibeQueueDatei(p("q2.json"), { stand: "neu" });

    expect(ergebnis.ok).toBe(true);
    expect(await lies("q2.json.bak")).toEqual({ stand: "heil" });
    expect(await lies("q2.json")).toEqual({ stand: "neu" });
  });

  it("laesst zwei Schreibvorgaenge auf denselben Pfad nacheinander laufen", async () => {
    // Ohne Kette benutzten beide DIESELBE .tmp; die Datei truege danach die Haelfte des
    // einen und die Haelfte des anderen Standes - und JSON.parse fiele darueber.
    const erster = schreibeQueueDatei(p("q2.json"), {
      stand: "erster",
      fuellung: "x".repeat(200_000),
    });
    const zweiter = schreibeQueueDatei(p("q2.json"), { stand: "zweiter" });

    expect((await Promise.all([erster, zweiter])).every((e) => e.ok)).toBe(true);
    expect(await lies("q2.json")).toEqual({ stand: "zweiter" });
  });

  it("laesst verschiedene Pfade einander nicht blockieren", async () => {
    // Sechs Schreibvorgaenge auf A, einer auf B - alle im selben Tick angestossen. Bei
    // einer gemeinsamen Kette muesste B hinter allen sechs warten.
    const reihenfolge: string[] = [];
    const laeufe = [
      ...Array.from({ length: 6 }, (_, i) =>
        schreibeQueueDatei(p("a.json"), { i, fuellung: "x".repeat(100_000) }).then(() => {
          reihenfolge.push("A");
        }),
      ),
      schreibeQueueDatei(p("b.json"), { klein: true }).then(() => {
        reihenfolge.push("B");
      }),
    ];
    await Promise.all(laeufe);

    expect(reihenfolge.indexOf("B")).toBeLessThan(reihenfolge.lastIndexOf("A"));
  });

  it("weist einen leeren Pfad ab", async () => {
    const ergebnis = await schreibeQueueDatei("", { stand: "neu" });

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
  });

  // --- aendereQueueDatei (nachgetragen 12.08.2026) ---------------------------
  it("verliert bei zwei gleichzeitigen Aenderungen KEINE davon", async () => {
    // Der Kern des Nachtrags. Mit leseQueueDatei + schreibeQueueDatei haengen zwei
    // Glieder in der Kette, und dazwischen passt ein fremdes drittes - dessen
    // Aenderung ist danach weg. Genau das trifft Q4 (#57) mit seinen fuenf
    // Schreibern.
    const ziel = p("q4.json");
    await fs.writeFile(ziel, JSON.stringify({ eintraege: [] }), "utf8");

    const anhaengen = (was: string) =>
      aendereQueueDatei<{ eintraege: string[] }, number>(
        ziel,
        { eintraege: [] },
        (inhalt) => ({
          ok: true,
          wert: {
            inhalt: { eintraege: [...inhalt.eintraege, was] },
            wert: inhalt.eintraege.length + 1,
          },
        }),
      );

    await Promise.all([anhaengen("a"), anhaengen("b")]);

    const gelesen = await leseQueueDatei<{ eintraege: string[] }>(ziel, { eintraege: [] });
    expect(gelesen.ok).toBe(true);
    if (!gelesen.ok) return;
    expect([...gelesen.wert.eintraege].sort()).toEqual(["a", "b"]);
  });

  it("schreibt NICHTS, wenn die Aenderungsfunktion ablehnt", async () => {
    const ziel = p("q2.json");
    await fs.writeFile(ziel, JSON.stringify({ eintraege: ["alt"] }), "utf8");

    const ergebnis = await aendereQueueDatei<{ eintraege: string[] }, void>(
      ziel,
      { eintraege: [] },
      () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "nein" } }),
    );

    expect(ergebnis.ok).toBe(false);
    // Der Grund des Aufrufers reist unveraendert zurueck.
    if (!ergebnis.ok) expect(ergebnis.fehler.meldung).toBe("nein");
    const gelesen = await leseQueueDatei<{ eintraege: string[] }>(ziel, { eintraege: [] });
    if (gelesen.ok) expect(gelesen.wert.eintraege).toEqual(["alt"]);
  });
});
