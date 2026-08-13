import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Vorlage } from "../../src/shared/contracts/vorlage";

// Unit-Test zu #98. Er prueft VERHALTEN auf einer echten Platte, in einem eigenen
// Temp-Ordner - nicht die Deklarationen.
//
// Der Datenort (#5) ist gemockt, und das ist der wichtigste Handgriff dieser Datei:
// ermittleDatenOrt() liefert im Entwicklungslauf process.cwd(), der Test wuerde also
// die ECHTE vorlagen.json im Projektverzeichnis ueberschreiben - genau der Datenverlust,
// gegen den dieses Issue existiert. Der Mock haelt die Funktion zugleich von `electron`
// fern, das es im Testlauf gar nicht gibt.
//
// WAS DIESER TEST NICHT LEISTET: Der eigentliche Anlass fuer die Wiederhol-Wartezeiten -
// ein fremder Prozess haelt vorlagen.json offen und das Rename scheitert mit EPERM -
// laesst sich hier nicht nachstellen. Er ist in #31 gemessen worden, nicht hier.
const zustand = { ordner: "" };

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

type Modul = typeof import("../../src/main/vorlagen-store/schreibe-vorlagen");
type Ereignis = { typ: "gespeichert" } | { typ: "fehler"; code: string };

// Jeder Test bekommt ein FRISCHES Modul. Der Bestand, die Kette, der Timer und die
// Hoerer leben im Modulbereich; ohne vi.resetModules() traegt Test 2 den
// zwischengespeicherten Bestand von Test 1 und prueft nicht mehr, was er zu pruefen
// meint.
let modul: Modul;

function eigene(id: string): Vorlage {
  return {
    id,
    name: id,
    art: "vollflaeche",
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [
      {
        id: `${id}-zone`,
        rolle: "frei",
        bindung: "titel",
        rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
        ausrichtung: { horizontal: "links", vertikal: "oben" },
        wennLeer: "leer",
      },
    ],
  };
}

/** Haengt eine Vorlage an - die Aenderung, die fast jeder Test braucht. */
function haengeAn(vorlage: Vorlage) {
  return (bestand: Vorlage[]) => ({
    ok: true as const,
    wert: { bestand: [...bestand, vorlage], wert: vorlage.id },
  });
}

function pfad(name: string): string {
  return path.join(zustand.ordner, name);
}

async function lies(name: string): Promise<string> {
  return fs.readFile(pfad(name), "utf8");
}

async function liesDatei(name = "vorlagen.json"): Promise<{ schemaVersion: number; vorlagen: Vorlage[] }> {
  return JSON.parse(await lies(name)) as { schemaVersion: number; vorlagen: Vorlage[] };
}

async function existiert(name: string): Promise<boolean> {
  return fs
    .access(pfad(name))
    .then(() => true)
    .catch(() => false);
}

async function schreibeRoh(name: string, inhalt: string): Promise<void> {
  await fs.writeFile(pfad(name), inhalt, "utf8");
}

function ids(vorlagen: Vorlage[]): string[] {
  return vorlagen.map((v) => v.id);
}

/**
 * Wartet, bis `liste` mindestens `anzahl` Eintraege hat.
 *
 * Warum das noetig ist: Der entprellte Schreibvorgang laeuft aus einem Timer heraus und
 * wartet danach auf ECHTE Platten-Ein-/Ausgabe; `advanceTimersByTimeAsync` gibt zurueck,
 * sobald die Microtasks durch sind, nicht wenn die Platte fertig ist.
 *
 * Warum ueber `setImmediate` und ECHTE Uhrzeit: Der Test faelscht nur setTimeout und
 * clearTimeout - Date und setImmediate bleiben echt. Eine feste Rundenzahl reichte NICHT:
 * 50 Runden der Ereignisschleife sind zusammen unter einer Millisekunde, ein readFile
 * braucht laenger. Gemessen beim Bau von #98, der Test war deshalb zunaechst rot.
 */
async function bisMindestens(liste: readonly unknown[], anzahl: number): Promise<void> {
  const ende = Date.now() + 5000;
  while (liste.length < anzahl && Date.now() < ende) {
    await new Promise((weiter) => setImmediate(weiter));
  }
}

beforeEach(async () => {
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-vorlagen-"));
  vi.resetModules();
  modul = await import("../../src/main/vorlagen-store/schreibe-vorlagen");
});

afterEach(async () => {
  vi.useRealTimers();
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

describe("ladeBestand (#98)", () => {
  it("legt bei fehlender vorlagen.json die drei eingebauten an", async () => {
    const ergebnis = await modul.ladeBestand();

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ids(ergebnis.wert)).toEqual(["vollbild", "split", "band-standard"]);

    const datei = await liesDatei();
    expect(datei.schemaVersion).toBe(1);
    expect(ids(datei.vorlagen)).toEqual(["vollbild", "split", "band-standard"]);
  });

  it("ergaenzt nur die fehlende Vorlage hinten und laesst den vorhandenen Eintrag unangetastet", async () => {
    // Das absichtlich abgeaenderte `vollbild` ist der Kern des Tests: TK 9.11.1.1 verbietet
    // die In-place-Aenderung an einer eingebauten Vorlage. Ein "Reparieren beim Start"
    // wuerde Aktionen in bestehenden Projekten nach einem App-Update anders aussehen lassen.
    const abgeaendert: Vorlage = { ...eigene("vollbild"), name: "Selbst umbenannt", eingebaut: true };
    const split: Vorlage = { ...eigene("split"), eingebaut: true };
    await schreibeRoh("vorlagen.json", JSON.stringify({ schemaVersion: 1, vorlagen: [abgeaendert, split] }));

    const ergebnis = await modul.ladeBestand();

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ids(ergebnis.wert)).toEqual(["vollbild", "split", "band-standard"]);
    expect(ergebnis.wert[0]).toEqual(abgeaendert);

    // Und dasselbe auf der Platte: Der Eintrag ist byte-identisch geblieben.
    const datei = await liesDatei();
    expect(JSON.stringify(datei.vorlagen[0])).toBe(JSON.stringify(abgeaendert));
    expect(datei.vorlagen[2]?.id).toBe("band-standard");
  });

  it("meldet speicher_fehler bei kaputtem JSON ohne brauchbares .bak - und faellt NICHT auf den Anfangsbestand zurueck", async () => {
    await schreibeRoh("vorlagen.json", '{"schemaVersion": 1, "vorlagen": [{"id": "eig');

    const ergebnis = await modul.ladeBestand();

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
  });

  it("rettet aus dem .bak und laesst die defekte Datei unveraendert liegen", async () => {
    const gerettet = eigene("eigene-1");
    const kaputt = '{"schemaVersion": 1, "vorlagen": [{"id": "eig';
    await schreibeRoh("vorlagen.json", kaputt);
    await schreibeRoh(
      "vorlagen.json.bak",
      JSON.stringify({ schemaVersion: 1, vorlagen: [gerettet] }),
    );

    const ergebnis = await modul.ladeBestand();

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    // Die eigene Vorlage ist da; die fehlenden eingebauten sind hinten ergaenzt.
    expect(ids(ergebnis.wert)).toEqual(["eigene-1", "vollbild", "split", "band-standard"]);
  });

  it("laesst die defekte Datei byte-identisch, wenn nichts zu ergaenzen ist", async () => {
    const kaputt = '{"schemaVersion": 1, "vorlagen": [{"id": "eig';
    await schreibeRoh("vorlagen.json", kaputt);
    await schreibeRoh(
      "vorlagen.json.bak",
      JSON.stringify({
        schemaVersion: 1,
        vorlagen: [eigene("vollbild"), eigene("split"), eigene("band-standard")],
      }),
    );

    await modul.ladeBestand();

    // "Die Wiederherstellung aus .bak repariert nichts von selbst": kein Loeschen, kein
    // Ersetzen durch das Backup, kein Zurueckschreiben.
    expect(await lies("vorlagen.json")).toBe(kaputt);
  });

  it("meldet speicher_fehler bei unbekannter schemaVersion und laedt nichts", async () => {
    await schreibeRoh(
      "vorlagen.json",
      JSON.stringify({ schemaVersion: 2, vorlagen: [eigene("eigene-1")] }),
    );

    const ergebnis = await modul.ladeBestand();

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(ergebnis.fehler.meldung).toContain("2");
  });

  it("legt bei zwei gleichzeitigen Aufrufen genau EINMAL an", async () => {
    // Ohne dazwischenliegendes await gestartet.
    const [a, b] = await Promise.all([modul.ladeBestand(), modul.ladeBestand()]);

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(ids(a.wert)).toEqual(ids(b.wert));

    // DER SCHREIB-ZAEHLER, an der Platte abgelesen: Der erste Schreibvorgang findet keine
    // Datei vor und legt deshalb kein .bak an. Haette ein ZWEITER stattgefunden, waere die
    // inzwischen vorhandene vorlagen.json nach .bak kopiert worden.
    expect(await existiert("vorlagen.json.bak")).toBe(false);
  });

  it("gibt den Bestand als tiefe Kopie heraus", async () => {
    const erst = await modul.ladeBestand();
    expect(erst.ok).toBe(true);
    if (!erst.ok) return;

    const zone = erst.wert[0]?.zonen[0];
    expect(zone).toBeDefined();
    if (zone === undefined) return;
    zone.rahmen.x = -999;

    const zweit = await modul.ladeBestand();
    expect(zweit.ok).toBe(true);
    if (!zweit.ok) return;
    expect(zweit.wert[0]?.zonen[0]?.rahmen.x).not.toBe(-999);
  });
});

describe("aendereBestand (#98)", () => {
  it("sichert die vorherige Fassung nach .bak und schreibt die neue", async () => {
    await modul.ladeBestand();
    const vorher = await lies("vorlagen.json");

    const ergebnis = await modul.aendereBestand(haengeAn(eigene("eigene-1")), "sofort");

    expect(ergebnis.ok).toBe(true);
    expect(await lies("vorlagen.json.bak")).toBe(vorher);
    expect(ids((await liesDatei()).vorlagen)).toContain("eigene-1");
  });

  it("laesst das heile .bak nach einer Rettung unangetastet und legt erst beim uebernaechsten Mal ein neues an", async () => {
    const gerettet = eigene("eigene-1");
    const heilesBak = JSON.stringify({
      schemaVersion: 1,
      vorlagen: [gerettet, eigene("vollbild"), eigene("split"), eigene("band-standard")],
    });
    // ABSICHTLICH GUELTIGES JSON mit KAPUTTER Form: `vorlagen` ist kein Array. Dieser Fall
    // trifft die Ausnahme haerter als eine abgeschnittene Datei - eine solche faellt schon
    // daran auf, dass sie nicht parst. Hier parst sie, und nur der gemerkte
    // Wiederherstellungs-Zustand verhindert, dass der Schrott ins heile .bak wandert.
    await schreibeRoh("vorlagen.json", '{"schemaVersion": 1, "vorlagen": "kaputt"}');
    await schreibeRoh("vorlagen.json.bak", heilesBak);

    await modul.ladeBestand();
    await modul.aendereBestand(haengeAn(eigene("eigene-2")), "sofort");

    // Der defekte Inhalt landet NIE in der Sicherung - sonst waere die einzige heile
    // Fassung ausgerechnet durch die Rettung vernichtet worden.
    expect(await lies("vorlagen.json.bak")).toBe(heilesBak);

    const nachErstem = await lies("vorlagen.json");
    await modul.aendereBestand(haengeAn(eigene("eigene-3")), "sofort");

    // Jetzt liegt wieder eine heile vorlagen.json da, also wird wieder normal gesichert.
    expect(await lies("vorlagen.json.bak")).toBe(nachErstem);
  });

  it("verschraenkt zwei gleichzeitige Aenderungen nicht (Lost Update)", async () => {
    await modul.ladeBestand();

    // Ohne dazwischenliegendes await gestartet: Beide lesen, aendern und schreiben
    // denselben Bestand. Ohne Serialisierung ueberschreibt der zweite den ersten.
    const [a, b] = await Promise.all([
      modul.aendereBestand(haengeAn(eigene("eigene-a")), "sofort"),
      modul.aendereBestand(haengeAn(eigene("eigene-b")), "sofort"),
    ]);

    expect(a.ok && b.ok).toBe(true);
    const gespeichert = ids((await liesDatei()).vorlagen);
    expect(gespeichert).toContain("eigene-a");
    expect(gespeichert).toContain("eigene-b");
  });

  it("schreibt nichts und reicht den Code durch, wenn die Aenderung ablehnt", async () => {
    await modul.ladeBestand();
    const vorher = await lies("vorlagen.json");

    const ergebnis = await modul.aendereBestand(
      () => ({ ok: false, fehler: { code: "vorlage_referenziert", meldung: "in Benutzung" } }),
      "sofort",
    );

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("vorlage_referenziert");
    expect(await lies("vorlagen.json")).toBe(vorher);

    // Auch der Bestand im Speicher ist unveraendert.
    const danach = await modul.ladeBestand();
    expect(danach.ok).toBe(true);
    if (!danach.ok) return;
    expect(ids(danach.wert)).toEqual(["vollbild", "split", "band-standard"]);
  });

  it("faengt eine werfende Aenderung als unbekannter_fehler ab", async () => {
    await modul.ladeBestand();
    const vorher = await lies("vorlagen.json");

    const ergebnis = await modul.aendereBestand(() => {
      throw new Error("Absicht");
    }, "sofort");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    expect(await lies("vorlagen.json")).toBe(vorher);
  });

  it("laesst vorlagen.json unveraendert, wenn das Schreiben der .tmp abbricht", async () => {
    await modul.ladeBestand();
    const vorher = await lies("vorlagen.json");
    // Ein Ordner an der Stelle der .tmp: Das Oeffnen mit 'w' scheitert, das Rename findet
    // nie statt.
    await fs.mkdir(pfad("vorlagen.json.tmp"));

    const ergebnis = await modul.aendereBestand(haengeAn(eigene("eigene-1")), "sofort");

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("speicher_fehler");
    expect(await lies("vorlagen.json")).toBe(vorher);

    // KEIN ROLLBACK (TK 9.5.4): Der Stand liegt weiter im Speicher und geht auf die Platte,
    // sobald es wieder moeglich ist. Der Aufraeumschritt beendet zugleich den
    // Wiederholungs-Termin, den der Fehlschlag geplant hat.
    await fs.rm(pfad("vorlagen.json.tmp"), { recursive: true });
    const nachgeholt = await modul.flushBestand();
    expect(nachgeholt.ok).toBe(true);
    expect(ids((await liesDatei()).vorlagen)).toContain("eigene-1");
  });
});

describe("Entprellung und flushBestand (#98)", () => {
  it("schreibt entprellt erst beim Flush, nicht sofort", async () => {
    await modul.ladeBestand();

    const ergebnis = await modul.aendereBestand(haengeAn(eigene("eigene-1")), "entprellt");

    expect(ergebnis.ok).toBe(true);
    expect(ids((await liesDatei()).vorlagen)).not.toContain("eigene-1");

    await modul.flushBestand();
    expect(ids((await liesDatei()).vorlagen)).toContain("eigene-1");
  });

  it("nimmt eine ausstehende entprellte Aenderung in den naechsten Sofort-Schreibvorgang mit und laesst keinen Timer laufen", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await modul.ladeBestand();

    await modul.aendereBestand(haengeAn(eigene("entprellt-1")), "entprellt");
    await modul.aendereBestand(haengeAn(eigene("sofort-1")), "sofort");

    const gespeichert = ids((await liesDatei()).vorlagen);
    expect(gespeichert).toContain("entprellt-1");
    expect(gespeichert).toContain("sofort-1");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ist ohne ausstehenden Stand ein erfolgreicher Leerlauf", async () => {
    const ergebnis = await modul.flushBestand();

    expect(ergebnis.ok).toBe(true);
    // Keine Datei wird angefasst - insbesondere wird vorlagen.json nicht angelegt.
    expect(await existiert("vorlagen.json")).toBe(false);
  });
});

describe("aufVorlagenSpeichernEreignis (#98)", () => {
  it("meldet den Fehlschlag eines entprellten Schreibvorgangs - und danach die Rueckkehr", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await modul.ladeBestand();

    const ereignisse: Ereignis[] = [];
    modul.aufVorlagenSpeichernEreignis((e) => ereignisse.push(e));
    await fs.mkdir(pfad("vorlagen.json.tmp"));

    const ergebnis = await modul.aendereBestand(haengeAn(eigene("eigene-1")), "entprellt");
    // Der Aufrufer hat sein ok laengst - es gibt keine Antwort mehr, an die sich ein
    // spaeterer Fehlschlag haengen koennte. Genau deshalb gibt es das Ereignis.
    expect(ergebnis.ok).toBe(true);
    expect(ereignisse).toEqual([]);

    await vi.advanceTimersByTimeAsync(4000);
    await bisMindestens(ereignisse, 1);

    expect(ereignisse).toEqual([{ typ: "fehler", code: "speicher_fehler" }]);

    // Der naechste ERFOLGREICHE Schreibvorgang laesst den Hinweis verschwinden.
    await fs.rm(pfad("vorlagen.json.tmp"), { recursive: true });
    await modul.flushBestand();
    expect(ereignisse).toEqual([
      { typ: "fehler", code: "speicher_fehler" },
      { typ: "gespeichert" },
    ]);
  });

  it("meldet ohne vorherigen Fehler-Zustand nichts (kein Dauerfeuer)", async () => {
    const ereignisse: Ereignis[] = [];
    modul.aufVorlagenSpeichernEreignis((e) => ereignisse.push(e));

    await modul.ladeBestand();
    await modul.aendereBestand(haengeAn(eigene("eigene-1")), "sofort");

    expect(ereignisse).toEqual([]);
  });

  it("beliefert beide Hoerer, und die Abmelde-Funktion beendet genau eine Anmeldung", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await modul.ladeBestand();

    const a: Ereignis[] = [];
    const b: Ereignis[] = [];
    const abmelden = modul.aufVorlagenSpeichernEreignis((e) => a.push(e));
    modul.aufVorlagenSpeichernEreignis((e) => b.push(e));

    await fs.mkdir(pfad("vorlagen.json.tmp"));
    await modul.aendereBestand(haengeAn(eigene("eigene-1")), "sofort");
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);

    abmelden();
    await modul.aendereBestand(haengeAn(eigene("eigene-2")), "sofort");
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(2);
  });

  it("laesst einen werfenden Hoerer weder den Schreibvorgang noch die uebrigen Hoerer zu Fall bringen", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await modul.ladeBestand();

    const spaeter: Ereignis[] = [];
    modul.aufVorlagenSpeichernEreignis(() => {
      throw new Error("Absicht");
    });
    modul.aufVorlagenSpeichernEreignis((e) => spaeter.push(e));

    await fs.mkdir(pfad("vorlagen.json.tmp"));
    const ergebnis = await modul.aendereBestand(haengeAn(eigene("eigene-1")), "sofort");

    // Der Wurf verlaesst die Datei nicht: Es kommt eine Huelle zurueck, kein Ausnahmefehler.
    expect(ergebnis.ok).toBe(false);
    expect(spaeter).toEqual([{ typ: "fehler", code: "speicher_fehler" }]);
  });
});
