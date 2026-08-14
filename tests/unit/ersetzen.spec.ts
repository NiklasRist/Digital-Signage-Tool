import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #187.
//
// Zwei Testarten, weil zwei verschiedene Dinge zu belegen sind:
//  - Der Erfolgspfad laeuft auf einer ECHTEN Platte. Nur dort zeigt sich, dass eine
//    VORHANDENE Zieldatei wirklich ersetzt wird (Ueberschreiben ist hier der
//    Regelfall, FA-22) und dass die Arbeitsdatei danach verbraucht ist.
//  - Die Fehlerpfade laufen ueber eine Attrappe auf `node:fs/promises`. Ein von einem
//    fremden Prozess gehaltenes Handle, ein gezogener Stick oder eine
//    schreibgeschuetzte Platte lassen sich im Test nicht herstellen; nachstellbar ist
//    nur, was `rename` dabei meldet.
//
// Die Zeit ist kuenstlich (vi.useFakeTimers): Die Staffel wartet insgesamt 1,5 s, der
// Test darf das nicht wirklich tun. Vorgespult wird ausdruecklich SCHRITTWEISE - so
// zeigt sich, dass zwischen zwei Versuchen tatsaechlich gewartet und nicht bloss
// durchgezaehlt wird. Weil `Date.now()` mitgefaelscht wird, laesst sich die
// Wartezeit VOR jedem Versuch direkt messen, statt sie zu unterstellen.
const attrappe = vi.hoisted(() => ({
  rename: null as null | ((ruf: number) => Promise<void>),
  renameRufe: 0,
  renameZeiten: [] as number[],
  statRufe: 0,
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    rename: vi.fn(async (quelle: string, ziel: string) => {
      attrappe.renameRufe += 1;
      attrappe.renameZeiten.push(Date.now());
      if (attrappe.rename !== null) {
        await attrappe.rename(attrappe.renameRufe);
        return;
      }
      await echt.rename(quelle, ziel);
    }),
    stat: vi.fn(async (pfad: string) => {
      attrappe.statRufe += 1;
      return echt.stat(pfad);
    }),
    // Diese drei duerfen NIE gerufen werden - sie erzeugten genau das Zeitfenster, in
    // dem am Ziel keine gueltige Datei liegt. Sie sind nur als Spitzel eingehaengt.
    unlink: vi.fn(echt.unlink),
    rm: vi.fn(echt.rm),
    truncate: vi.fn(echt.truncate),
  };
});

const { rename, rm, stat, truncate, unlink } = await import("node:fs/promises");
const { ersetzeAtomar, ERSETZEN_BACKOFF_MS, ERSETZEN_VERSUCHE } = await import(
  "../../src/main/export-service/ersetzen"
);

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-ersetzen-"));
const ALT = "die alte, lauffaehige Werbeschleife";
const NEU = "die frisch gerenderte Schleife - laenger als die alte";

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`rename ${code}`), { code });
}

/** `rename` meldet `code`, bis `erfolgAb` erreicht ist. `Infinity` = nie Erfolg. */
function meldet(code: string, erfolgAb = Number.POSITIVE_INFINITY): void {
  attrappe.rename = async (ruf) => {
    if (ruf >= erfolgAb) {
      return;
    }
    throw systemfehler(code);
  };
}

/** Legt Arbeitsdatei und (optional) vorhandene Zieldatei echt an. */
function lege(name: string, mitZiel = true): { partPfad: string; zielPfad: string } {
  const ordner = mkdtempSync(path.join(BASIS, `${name}-`));
  const zielPfad = path.join(ordner, "werbung.mp4");
  const partPfad = `${zielPfad}.part`;
  writeFileSync(partPfad, NEU);
  if (mitZiel) {
    writeFileSync(zielPfad, ALT);
  }
  return { partPfad, zielPfad };
}

/** Spult die ganze Staffel ab, ohne echte Zeit zu verbrauchen. */
async function spuleVor(): Promise<void> {
  for (const ms of ERSETZEN_BACKOFF_MS) {
    await vi.advanceTimersByTimeAsync(ms);
  }
}

beforeEach(() => {
  attrappe.rename = null;
  attrappe.renameRufe = 0;
  attrappe.renameZeiten = [];
  attrappe.statRufe = 0;
  vi.mocked(rename).mockClear();
  vi.mocked(stat).mockClear();
  vi.mocked(unlink).mockClear();
  vi.mocked(rm).mockClear();
  vi.mocked(truncate).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  // Gilt fuer JEDEN Test dieser Datei: Diese Funktion loescht, leert und verschiebt
  // nichts - sie benennt um. Ein `unlink` auf den Zielpfad waere der naheliegende und
  // falsche Weg (TK 9.6.3).
  expect(unlink).not.toHaveBeenCalled();
  expect(rm).not.toHaveBeenCalled();
  expect(truncate).not.toHaveBeenCalled();
});

afterAll(() => {
  rmSync(BASIS, { recursive: true, force: true });
});

describe("ersetzeAtomar - Formpruefung", () => {
  it.each([
    ["beide leer", "", ""],
    ["partPfad leer", "", "C:/ziel/werbung.mp4"],
    ["zielPfad leer", "C:/ziel/werbung.mp4.part", ""],
    ["identische Pfade", "C:/ziel/werbung.mp4", "C:/ziel/werbung.mp4"],
  ])("%s ergibt ungueltige_eingabe ohne jeden fs-Aufruf", async (_fall, part, ziel) => {
    const ergebnis = await ersetzeAtomar(part, ziel);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    // Der Kern der Zusage: KEIN Dateisystemzugriff. Ein `rename(x, x)` gelaenge
    // klaglos und meldete einen Export als gelungen, bei dem am Ziel nie etwas
    // ankaeme.
    expect(rename).not.toHaveBeenCalled();
    expect(stat).not.toHaveBeenCalled();
  });
});

describe("ersetzeAtomar - Erfolg auf echter Platte", () => {
  it("ersetzt eine vorhandene Zieldatei vollstaendig und verbraucht die Arbeitsdatei", async () => {
    const { partPfad, zielPfad } = lege("erfolg");
    expect(readFileSync(zielPfad, "utf8")).toBe(ALT);

    const ergebnis = await ersetzeAtomar(partPfad, zielPfad);

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    // Vollstaendig ersetzt - kein Rest der laengeren alten Fassung, kein Anhaengsel.
    expect(readFileSync(zielPfad, "utf8")).toBe(NEU);
    expect(existsSync(partPfad)).toBe(false);
    expect(rename).toHaveBeenCalledTimes(1);
    expect(rename).toHaveBeenCalledWith(partPfad, zielPfad);
  });

  it("legt die Zieldatei auch dann an, wenn dort noch keine liegt", async () => {
    const { partPfad, zielPfad } = lege("neu", false);

    const ergebnis = await ersetzeAtomar(partPfad, zielPfad);

    expect(ergebnis.ok).toBe(true);
    expect(readFileSync(zielPfad, "utf8")).toBe(NEU);
  });
});

describe("ersetzeAtomar - Wiederholung bei EBUSY/EPERM", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it.each(["EBUSY", "EPERM"])(
    "%s zweimal, dann Erfolg: ok und genau drei rename-Aufrufe",
    async (code) => {
      meldet(code, 3);
      const lauf = ersetzeAtomar("/ziel/werbung.mp4.part", "/ziel/werbung.mp4");
      await spuleVor();

      await expect(lauf).resolves.toEqual({ ok: true, wert: undefined });
      expect(attrappe.renameRufe).toBe(3);
      // Nach dem Erfolg wird nicht weitergewartet: Der vierte und fuenfte Platz der
      // Staffel bleiben ungenutzt.
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("durchgehend EBUSY: ziel_gesperrt nach genau ERSETZEN_VERSUCHE Aufrufen", async () => {
    meldet("EBUSY");
    const start = Date.now();
    const lauf = ersetzeAtomar("/ziel/werbung.mp4.part", "/ziel/werbung.mp4");
    await spuleVor();
    const ergebnis = await lauf;

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ziel_gesperrt");
      // Die Handlungsanweisung, die den Wiederholversuch (FA-17) erst erfolgreich
      // macht: Der Nutzer muss erfahren, dass ein fremdes Programm die Datei haelt.
      expect(ergebnis.fehler.meldung).toMatch(/anderen Programm geoeffnet/);
      expect(ergebnis.fehler.meldung).toContain("werbung.mp4");
      expect(ergebnis.fehler.meldung).not.toContain("at ");
    }
    expect(attrappe.renameRufe).toBe(ERSETZEN_VERSUCHE);

    // Die Wartezeit VOR jedem Versuch, am gefaelschten Uhrwerk gemessen: erst
    // sofort, dann die Staffel. Ein "durchgezaehltes" Wiederholen ohne echtes
    // Warten faellt hier auf.
    const abstaende = attrappe.renameZeiten.map((zeit) => zeit - start);
    expect(abstaende).toEqual([0, 100, 300, 700, 1500]);
    const summe = ERSETZEN_BACKOFF_MS.reduce((a, b) => a + b, 0);
    expect(abstaende.at(-1)).toBe(summe);
  });
});

describe("ersetzeAtomar - sofortiges Aufgeben ohne Wartezeit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // Kein Vorspulen in diesen Tests: Wuerde die Funktion warten, kaeme das Ergebnis
  // bei stehender Uhr nie an und der Test liefe in die Zeitgrenze. Das Durchlaufen
  // IST der Beleg fuer "ohne Wartezeit".
  it.each([
    ["EACCES", "schreib_fehler"],
    ["EROFS", "schreib_fehler"],
    ["EIO", "schreib_fehler"],
    ["EISDIR", "schreib_fehler"],
    ["ENOSPC", "schreib_fehler"],
    ["EXDEV", "schreib_fehler"],
    ["ENODEV", "ziel_nicht_verfügbar"],
    ["ENXIO", "ziel_nicht_verfügbar"],
  ])("%s ergibt sofort %s mit genau einem Versuch", async (code, erwartet) => {
    meldet(code);

    const ergebnis = await ersetzeAtomar("/ziel/werbung.mp4.part", "/ziel/werbung.mp4");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe(erwartet);
      // Der Betriebssystem-Code steht in der Meldung, NIE im Code (TK 9.1.1).
      expect(ergebnis.fehler.meldung).toContain(code);
    }
    expect(attrappe.renameRufe).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("EXDEV benennt den gemeinsamen Datentraeger als Bedingung", async () => {
    meldet("EXDEV");

    const ergebnis = await ersetzeAtomar("/ziel/werbung.mp4.part", "/ziel/werbung.mp4");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.meldung).toMatch(/demselben Datentraeger/);
    }
  });

  it("eine Ausnahme ohne Systemcode ergibt unbekannter_fehler statt eines throw", async () => {
    attrappe.rename = async () => {
      throw new Error("etwas voellig Unerwartetes");
    };

    const ergebnis = await ersetzeAtomar("/ziel/werbung.mp4.part", "/ziel/werbung.mp4");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("ersetzeAtomar - ENOENT ist zweideutig", () => {
  it("bei erreichbarem Zielordner: schreib_fehler wegen verschwundener Arbeitsdatei", async () => {
    const { partPfad, zielPfad } = lege("enoent-da");
    meldet("ENOENT");

    const ergebnis = await ersetzeAtomar(partPfad, zielPfad);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("schreib_fehler");
      expect(ergebnis.fehler.meldung).toMatch(/Arbeitsdatei .* ist verschwunden/);
    }
    // Genau EIN Blick auf den Ordner, und zwar nur im Fehlerpfad.
    expect(attrappe.statRufe).toBe(1);
    expect(attrappe.renameRufe).toBe(1);
  });

  it("bei nicht mehr erreichbarem Zielordner: ziel_nicht_verfuegbar", async () => {
    // Der Ordner existiert wirklich nicht - der Stick ist gezogen. Hier wird nichts
    // gemockt ausser `rename` selbst.
    const zielPfad = path.join(BASIS, "gezogener-stick", "werbung.mp4");
    meldet("ENOENT");

    const ergebnis = await ersetzeAtomar(`${zielPfad}.part`, zielPfad);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ziel_nicht_verfügbar");
      expect(ergebnis.fehler.meldung).toMatch(/wieder anschliessen/);
    }
    expect(attrappe.statRufe).toBe(1);
  });

  it("sieht bei anderen Codes gar nicht erst nach dem Ordner", async () => {
    const { partPfad, zielPfad } = lege("kein-stat");
    meldet("EACCES");

    await ersetzeAtomar(partPfad, zielPfad);

    expect(attrappe.statRufe).toBe(0);
  });
});

describe("ersetzeAtomar - die vorhandene Zieldatei ueberlebt jeden Fehlschlag", () => {
  const faelle: ReadonlyArray<readonly [string, string | null]> = [
    ["EBUSY bis zum Schluss", "EBUSY"],
    ["EPERM bis zum Schluss", "EPERM"],
    ["EACCES", "EACCES"],
    ["EROFS", "EROFS"],
    ["EIO", "EIO"],
    ["EXDEV", "EXDEV"],
    ["ENOENT", "ENOENT"],
    ["ENODEV", "ENODEV"],
    ["unerwartete Ausnahme", null],
  ];

  it.each(faelle)("%s laesst sie bit-identisch und wirft nicht", async (_fall, code) => {
    vi.useFakeTimers();
    const { partPfad, zielPfad } = lege("unversehrt");
    const vorher = readFileSync(zielPfad);

    if (code === null) {
      attrappe.rename = async () => {
        throw "kein Error-Objekt";
      };
    } else {
      meldet(code);
    }

    // Kein `expect(...).rejects`: Diese Funktion wirft nie - ein `throw` liesse den
    // Auftrag auf `laeuft` stehen und braechte die serielle Warteschlange fuer den
    // Rest der Sitzung zum Stillstand (TK 9.3.5).
    const lauf = ersetzeAtomar(partPfad, zielPfad);
    await spuleVor();
    const ergebnis = await lauf;

    expect(ergebnis.ok).toBe(false);
    expect(readFileSync(zielPfad).equals(vorher)).toBe(true);
    // Die `.part`-Leiche bleibt liegen - dieser Ausgang ist von TK 9.6.3
    // ausdruecklich vorgesehen, und das Aufraeumen macht der Aufrufer (#188).
    expect(existsSync(partPfad)).toBe(true);
  });
});
