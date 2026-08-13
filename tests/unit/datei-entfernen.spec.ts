import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #86.
//
// Zwei Testarten, weil zwei verschiedene Dinge zu belegen sind:
//  - Die ersten beiden Faelle laufen auf einer ECHTEN Platte in einem eigenen
//    Temp-Ordner. Nur dort ist nachweisbar, dass die Datei hinterher wirklich weg ist.
//  - Alle Fehlerpfade laufen ueber eine Attrappe auf `node:fs/promises`. Ein belegtes
//    Handle, eine schreibgeschuetzte Platte oder ein E/A-Fehler lassen sich im Test
//    nicht herstellen; nachstellbar ist nur, was `unlink` dabei meldet.
//
// Die Zeit ist kuenstlich (vi.useFakeTimers): Die Staffel wartet insgesamt 1,5 s, der
// Test darf das nicht wirklich tun. Vorgespult wird ausdruecklich SCHRITTWEISE - so
// zeigt sich, dass zwischen zwei Versuchen tatsaechlich gewartet und nicht bloss
// durchgezaehlt wird.
const attrappe = vi.hoisted(() => ({ unlink: null as ((pfad: string) => Promise<void>) | null }));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    unlink: vi.fn((pfad: string) =>
      attrappe.unlink === null ? echt.unlink(pfad) : attrappe.unlink(pfad),
    ),
  };
});

const { unlink } = await import("node:fs/promises");
const { entferneDatei, WARTEZEITEN_MS, VERSUCHE_GESAMT } = await import(
  "../../src/main/media-service/datei-entfernen"
);

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-entfernen-"));

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`unlink ${code}`), { code });
}

/** `unlink` meldet `code`, bis `erfolgAb` erreicht ist. `Infinity` = nie Erfolg. */
function meldet(code: string, erfolgAb = Number.POSITIVE_INFINITY): void {
  let ruf = 0;
  attrappe.unlink = async () => {
    ruf += 1;
    if (ruf >= erfolgAb) {
      return;
    }
    throw systemfehler(code);
  };
}

/** Spult die ganze Staffel ab, ohne echte Zeit zu verbrauchen. */
async function spuleVor(): Promise<void> {
  for (const ms of WARTEZEITEN_MS) {
    await vi.advanceTimersByTimeAsync(ms);
  }
}

beforeEach(() => {
  attrappe.unlink = null;
  vi.mocked(unlink).mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  rmSync(BASIS, { recursive: true, force: true });
});

describe("entferneDatei (#86) auf einer echten Platte", () => {
  it("entfernt eine vorhandene Datei und meldet Erfolg", async () => {
    const datei = path.join(BASIS, "vorhanden.mp4");
    writeFileSync(datei, "x");

    const ergebnis = await entferneDatei(datei);

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(existsSync(datei)).toBe(false);
  });

  it("meldet auch beim zweiten Aufruf Erfolg (idempotent)", async () => {
    const datei = path.join(BASIS, "zweimal.mp4");
    writeFileSync(datei, "x");

    expect((await entferneDatei(datei)).ok).toBe(true);
    expect((await entferneDatei(datei)).ok).toBe(true);
  });
});

describe("entferneDatei (#86) wiederholt nur bei belegter Datei", () => {
  it("gelingt beim dritten Versuch nach zweimal EBUSY", async () => {
    meldet("EBUSY", 3);

    const lauf = entferneDatei(path.join(BASIS, "belegt.mp4"));
    await spuleVor();

    expect(await lauf).toEqual({ ok: true, wert: undefined });
    expect(unlink).toHaveBeenCalledTimes(3);
  });

  it("wartet zwischen den Versuchen wirklich, statt nur zu zaehlen", async () => {
    meldet("EBUSY");

    const lauf = entferneDatei(path.join(BASIS, "belegt.mp4"));
    await vi.advanceTimersByTimeAsync(0);
    expect(unlink).toHaveBeenCalledTimes(1);

    const [erste] = WARTEZEITEN_MS;
    await vi.advanceTimersByTimeAsync(erste - 1);
    expect(unlink).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(unlink).toHaveBeenCalledTimes(2);

    await spuleVor();
    await lauf;
  });

  it.each(["EBUSY", "EPERM"])(
    "gibt bei dauerhaftem %s nach der Obergrenze auf und meldet datei_fehler",
    async (code) => {
      meldet(code);

      const lauf = entferneDatei(path.join(BASIS, "dauerhaft-belegt.mp4"));
      await spuleVor();
      const ergebnis = await lauf;

      expect(unlink).toHaveBeenCalledTimes(VERSUCHE_GESAMT);
      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("datei_fehler");
      expect(ergebnis.fehler.meldung).toContain("belegt");
      expect(ergebnis.fehler.meldung).toContain(code);
    },
  );
});

describe("entferneDatei (#86) gibt bei allen uebrigen Codes sofort auf", () => {
  // EACCES/EROFS/EISDIR/EIO bessern sich durch Warten nicht; ein Retry verzoegerte nur
  // die Meldung und blockierte die serielle Warteschlange.
  it.each(["EACCES", "EROFS", "EISDIR", "EIO", "EWASAUCHIMMER"])(
    "%s fuehrt ohne Wiederholung zu datei_fehler",
    async (code) => {
      meldet(code);

      const ergebnis = await entferneDatei(path.join(BASIS, "unloeschbar.mp4"));

      expect(unlink).toHaveBeenCalledTimes(1);
      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("datei_fehler");
    },
  );

  it("meldet eine fehlende Datei als Erfolg, ohne zu wiederholen", async () => {
    meldet("ENOENT");

    const ergebnis = await entferneDatei(path.join(BASIS, "nie-dagewesen.mp4"));

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(unlink).toHaveBeenCalledTimes(1);
  });

  it("wandelt eine unerwartete Ausnahme in ein Ergebnis, statt zu werfen", async () => {
    attrappe.unlink = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await entferneDatei(path.join(BASIS, "kaputt.mp4"));

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("datei_fehler");
  });
});

describe("entferneDatei (#86) meldet Pfad und Code so, wie der Vertrag es verlangt", () => {
  it("nennt den Dateinamen und den Betriebssystem-Code, nie den vollen Pfad", async () => {
    meldet("EACCES");
    const datei = path.join(BASIS, "geheimer-ordner", "medium.mp4");

    const ergebnis = await entferneDatei(datei);

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.meldung).toContain("medium.mp4");
    expect(ergebnis.fehler.meldung).toContain("EACCES");
    expect(ergebnis.fehler.meldung).not.toContain(BASIS);
  });

  it("weist einen leeren Pfad ohne Dateisystemzugriff ab", async () => {
    const ergebnis = await entferneDatei("");

    expect(unlink).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("weist auch einen Nicht-String ab, der aus Q2 hereinkommen kann", async () => {
    const ergebnis = await entferneDatei(undefined as unknown as string);

    expect(unlink).not.toHaveBeenCalled();
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });
});
