import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

// Verhaltenstests zur Einzel-Instanz-Sperre (#51). Geprueft wird auf einer ECHTEN
// Platte in einem eigenen Temp-Ordner, weil die Sperre nichts anderes ist als
// Dateisystem-Verhalten - eine Attrappe von `fs` wuerde genau das wegmocken, worauf es
// ankommt.
//
// ZWEI "INSTANZEN" IN EINEM PROZESS: `vi.resetModules()` + erneuter Import liefert ein
// Modul mit frischem Zustand, waehrend die vorige Fassung ihren Dateihandle weiter
// haelt. Das bildet den Fall "zweiter Start auf demselben Datenort" fuer den TEST
// nach - der Handle ist echt, der Prozess ist derselbe.
//
// WAS DIESE TESTS NICHT LEISTEN - und wodurch es abgedeckt ist:
//   - Zwei echte Prozesse. Der Vertrag ist genau dafuer gebaut; die Sharing-Regel des
//     Betriebssystems unterscheidet aber nicht nach Prozess, weshalb der Handle-Test
//     hier dieselbe Wirkung zeigt. Der abschliessende Nachweis bleibt der manuelle Test
//     aus der DoD: zwei Kopien der portablen EXE an verschiedenen Pfaden, ein Datenort.
//   - Ein WIRKLICH schreibgeschuetzter Ordner. Rechte lassen sich im Testlauf nicht
//     zuverlaessig plattformuebergreifend setzen (unter Windows braucht das ACL-Aufrufe,
//     unter macOS/Linux waere ein Lauf als root die Ausnahme). Der Test unten benutzt
//     einen nicht vorhandenen Ordner: Er trifft dieselbe Verzweigung - die Schreibprobe
//     scheitert -, und darauf kommt es an ('datenort_nicht_beschreibbar' statt 'belegt').
//   - Der harte Absturz. Nachgestellt wird sein ERGEBNIS: eine Sperrdatei, die niemand
//     mehr offen haelt. Der Handle-Verlust beim Prozesstod ist Sache des
//     Betriebssystems und am 10.08.2026 mit `taskkill /F` gemessen worden.
//   - macOS. Der dortige Zweig (O_EXLOCK) ist UNGEPRUEFT; auf einem macOS-Rechner
//     laufen die beiden gesperrten Tests unten mit und wuerden ein Abweichen sofort
//     zeigen.

const LOCK_DATEI = "instanz.lock";
const SIGNAL_DATEI = "instanz.signal";

// Auf Linux sperrt diese Datei bewusst nicht (kein O_EXLOCK, kein Auslieferungsziel).
// Die beiden Tests, die ein 'belegt' erwarten, gelten deshalb nur fuer die beiden
// Zielplattformen.
const SPERRT_HIER = process.platform === "win32" || process.platform === "darwin";

const ordnerListe: string[] = [];

async function neuerDatenOrt(): Promise<string> {
  const ordner = await fsp.mkdtemp(path.join(os.tmpdir(), "signage-instanz-"));
  ordnerListe.push(ordner);
  return ordner;
}

async function frischeInstanz(): Promise<
  typeof import("../../src/main/project-store/einzel-instanz")
> {
  vi.resetModules();
  return import("../../src/main/project-store/einzel-instanz");
}

async function warteBis(bedingung: () => boolean, frist = 4000): Promise<void> {
  const ende = Date.now() + frist;
  while (Date.now() < ende) {
    if (bedingung()) return;
    await new Promise((auf) => setTimeout(auf, 20));
  }
}

afterEach(async () => {
  // Die gehaltenen Handles werden absichtlich nie geschlossen (sie SIND die Sperre).
  // Ein Fehlschlag beim Aufraeumen ist deshalb hinnehmbar - der Temp-Ordner gehoert
  // dem Betriebssystem.
  for (const ordner of ordnerListe.splice(0)) {
    await fsp.rm(ordner, { recursive: true, force: true }).catch(() => undefined);
  }
});

describe("erzwingeEinzelInstanz (#51)", () => {
  it("meldet einen freien Datenort als frei und laesst dort nur die Sperrdatei zurueck", async () => {
    const ordner = await neuerDatenOrt();
    const { erzwingeEinzelInstanz } = await frischeInstanz();

    expect(erzwingeEinzelInstanz(ordner, () => undefined)).toBe("frei");

    // Genau EINE Datei: Weder die Probedatei der Schreibbarkeitspruefung noch die
    // Zwischendatei des Umbenennens darf liegenbleiben.
    expect(await fsp.readdir(ordner)).toEqual([LOCK_DATEI]);
  });

  it("meldet einen nicht beschreibbaren Datenort als datenort_nicht_beschreibbar, nicht als belegt", async () => {
    const ordner = path.join(await neuerDatenOrt(), "gibt-es-nicht");
    const { erzwingeEinzelInstanz } = await frischeInstanz();

    expect(erzwingeEinzelInstanz(ordner, () => undefined)).toBe("datenort_nicht_beschreibbar");

    // Der Unterschied ist der ganze Zweck des dritten Befundwerts: 'belegt' schickte den
    // Nutzer auf die Suche nach einem Prozess, den es nicht gibt.
    expect(fs.existsSync(ordner)).toBe(false);
  });

  it("laesst sich von einer verwaisten Sperrdatei nicht blockieren", async () => {
    const ordner = await neuerDatenOrt();
    // Was ein hart abgeschossener Lauf hinterlaesst: die Datei, aber niemand haelt sie.
    await fsp.writeFile(path.join(ordner, LOCK_DATEI), "Rest eines abgestuerzten Laufs");

    const { erzwingeEinzelInstanz } = await frischeInstanz();

    expect(erzwingeEinzelInstanz(ordner, () => undefined)).toBe("frei");
  });

  it("sperrt einen zweiten Datenort nicht mit, waehrend der erste gehalten wird", async () => {
    const ersterOrdner = await neuerDatenOrt();
    const zweiterOrdner = await neuerDatenOrt();

    const halter = await frischeInstanz();
    expect(halter.erzwingeEinzelInstanz(ersterOrdner, () => undefined)).toBe("frei");

    // Zwei Kopien der portablen EXE mit je eigenem Datenbestand duerfen nebeneinander
    // laufen - genau das verhindert Electrons eingebaute Sperre faelschlich (gemessen).
    const andere = await frischeInstanz();
    expect(andere.erzwingeEinzelInstanz(zweiterOrdner, () => undefined)).toBe("frei");
  });

  it("antwortet einem zweiten Aufruf im selben Prozess mit demselben Befund", async () => {
    const ordner = await neuerDatenOrt();
    const { erzwingeEinzelInstanz } = await frischeInstanz();

    expect(erzwingeEinzelInstanz(ordner, () => undefined)).toBe("frei");
    // Ohne den gemerkten Befund pruefte der zweite Aufruf gegen den eigenen offenen
    // Handle und meldete 'belegt' - die App beendete sich selbst mit "laeuft bereits".
    expect(erzwingeEinzelInstanz(ordner, () => undefined)).toBe("frei");
  });

  it("ruft beiZweitemStart, wenn die Signaldatei im Datenort geschrieben wird", async () => {
    const ordner = await neuerDatenOrt();
    const { erzwingeEinzelInstanz } = await frischeInstanz();

    let gerufen = 0;
    expect(
      erzwingeEinzelInstanz(ordner, () => {
        gerufen += 1;
      }),
    ).toBe("frei");

    await fsp.writeFile(path.join(ordner, SIGNAL_DATEI), "test\n");
    await warteBis(() => gerufen > 0);

    expect(gerufen).toBe(1);
  });

  it.skipIf(!SPERRT_HIER)(
    "weist einen zweiten Start auf demselben Datenort ab und meldet ihn dem Halter",
    async () => {
      const ordner = await neuerDatenOrt();

      const halter = await frischeInstanz();
      let gerufen = 0;
      expect(
        halter.erzwingeEinzelInstanz(ordner, () => {
          gerufen += 1;
        }),
      ).toBe("frei");

      const zweiter = await frischeInstanz();
      expect(zweiter.erzwingeEinzelInstanz(ordner, () => undefined)).toBe("belegt");

      await warteBis(() => gerufen > 0);
      expect(gerufen).toBe(1);

      // Auch der abgewiesene Start raeumt hinter sich auf: Probedatei und Zwischendatei
      // sind weg, geblieben sind Sperre und Signal.
      expect((await fsp.readdir(ordner)).sort()).toEqual([LOCK_DATEI, SIGNAL_DATEI].sort());
    },
  );
});
