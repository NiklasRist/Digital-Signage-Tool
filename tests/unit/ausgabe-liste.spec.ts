// Logik-Tests zu #230 - die Ausgabe-Liste (ausgabe-liste.ts, node, ohne Browser).
//
// Der Modul-Zustand liegt in der Datei - deshalb wird je Test mit `vi.resetModules()`
// ein frisches Modul geladen (Muster aus projektzustand.spec.ts und #222). Bewiesen
// werden: der eine Lade-Aufruf mit { projektId }, die projektId-Prüfung, das
// Uebernehmen ohne Umsortierung/Ergaenzung, das Stehenlassen des Bestands bei
// Fehlschlag, aktualisiereAusgaben und die reinen Ableitungen.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import { readFileSync } from "node:fs";

// Benannter Nachweis der DoD: `AusgabeDatei` wird aus `./ausgabe-liste` importiert und
// einem Wert mit ALLEN DREI Feldern zugewiesen - der Beleg fuer die drei fremden
// Importstellen (#231, #232 ×2).
import type { AusgabeDatei } from "../../src/renderer/composer/ausgabe-liste";
const VOLLE_DATEI: AusgabeDatei = {
  dateiname: "sommeraktion.mp4",
  dateigroesse: 1_288_490_188,
  geaendertAm: "2026-08-19T12:00:00.000Z",
};

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

type Modul = typeof import("../../src/renderer/composer/ausgabe-liste");

async function frisch(): Promise<Modul> {
  vi.resetModules();
  return await import("../../src/renderer/composer/ausgabe-liste");
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ladeAusgaben – der eine Aufruf und die Pruefung (DoD)", () => {
  it("ruft rufeAuf genau einmal auf project:listeAusgaben mit { projektId } (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [] });

    await modul.ladeAusgaben("p1");

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.project.listeAusgaben, {
      projektId: "p1",
    });
  });

  it("liefert bei leerer projektId ungueltige_eingabe und ruft kein rufeAuf (DoD)", async () => {
    const modul = await frisch();

    const ergebnis = await modul.ladeAusgaben("");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("holeAusgaben – Ausgangszustand und Uebernahme (DoD)", () => {
  it("liefert vor dem ersten Laden genau LEERER_AUSGABENSTAND (DoD)", async () => {
    const modul = await frisch();

    expect(modul.holeAusgaben()).toEqual(modul.LEERER_AUSGABENSTAND);
    expect(modul.holeAusgaben().zustand).toBe("unbekannt");
    expect(modul.holeAusgaben().projektId).toBeNull();
  });

  it("setzt bei Erfolg geladen, merkt sich die projektId und uebernimmt unveraendert (DoD)", async () => {
    const modul = await frisch();
    const dateien = [VOLLE_DATEI];
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: dateien });

    const ergebnis = await modul.ladeAusgaben("p1");

    expect(ergebnis).toEqual({ ok: true, wert: dateien });
    // Identitaet: nicht umkopiert, nicht umsortiert, nicht ergaenzt.
    expect(modul.holeAusgaben().dateien).toBe(dateien);
    expect(modul.holeAusgaben().zustand).toBe("geladen");
    expect(modul.holeAusgaben().projektId).toBe("p1");
    expect(modul.holeAusgaben().ladefehler).toBeNull();
  });

  it("behandelt ein leeres Array als gueltigen Bestand, nicht als Fehler (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [] });

    const ergebnis = await modul.ladeAusgaben("p1");

    expect(ergebnis.ok).toBe(true);
    expect(modul.holeAusgaben().zustand).toBe("geladen");
    expect(modul.holeAusgaben().dateien).toEqual([]);
    expect(modul.holeAusgaben().ladefehler).toBeNull();
  });
});

describe("ladeAusgaben – Fehlschlag (DoD)", () => {
  it("laesst einen zuvor geladenen Bestand stehen, setzt ladefehler, gibt Code unveraendert (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLE_DATEI] });
    await modul.ladeAusgaben("p1");

    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte weg" },
    } satisfies Ergebnis<AusgabeDatei[], string>);
    const ergebnis = await modul.ladeAusgaben("p1");

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte weg" },
    });
    expect(modul.holeAusgaben().dateien).toEqual([VOLLE_DATEI]);
    expect(modul.holeAusgaben().zustand).toBe("geladen");
    expect(modul.holeAusgaben().projektId).toBe("p1");
    expect(modul.holeAusgaben().ladefehler?.code).toBe("speicher_fehler");
  });

  it("faengt ein werfendes rufeAuf (Bridge fehlt) und wirft nicht nach aussen (Fehlerpfad)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockRejectedValueOnce(new Error("Preload fehlt"));

    const ergebnis = await modul.ladeAusgaben("p1");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("aktualisiereAusgaben (DoD)", () => {
  it("ruft nach einem erfolgreichen Lauf erneut mit derselben projektId (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: [] });
    await modul.ladeAusgaben("p1");
    attrappen.rufeAuf.mockClear();

    modul.aktualisiereAusgaben();
    await vi.waitFor(() => {
      expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    });

    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.project.listeAusgaben, {
      projektId: "p1",
    });
  });

  it("ruft ohne vorherigen Ladevorgang kein rufeAuf und wirft nicht (DoD)", async () => {
    const modul = await frisch();

    expect(() => modul.aktualisiereAusgaben()).not.toThrow();
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("aufAusgabenGeaendert – Hoerer und Abmeldung (DoD)", () => {
  it("benachrichtigt bei Erfolg und bei Fehlschlag (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLE_DATEI] });
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "weg" },
    } satisfies Ergebnis<AusgabeDatei[], string>);

    const gehoert: unknown[] = [];
    const abmelden = modul.aufAusgabenGeaendert((stand) => gehoert.push(stand.zustand));

    await modul.ladeAusgaben("p1");
    await modul.ladeAusgaben("p1");

    expect(gehoert).toEqual(["geladen", "geladen"]);
    abmelden();
  });

  it("beendet das Abo; ein zweiter Aufruf wirft nicht (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: [] });

    const gehoert: string[] = [];
    const abmelden = modul.aufAusgabenGeaendert((stand) => gehoert.push(stand.zustand));

    await modul.ladeAusgaben("p1");
    abmelden();
    abmelden();
    await modul.ladeAusgaben("p1");

    expect(gehoert).toEqual(["geladen"]);
  });
});

describe("baueAusgabeZeilen – Ableitung (DoD)", () => {
  it("veraendert die Reihenfolge nicht - auch bei absichtlich falsch sortierten Daten (DoD)", async () => {
    const modul = await import("../../src/renderer/composer/ausgabe-liste");
    const dateien = [
      { ...VOLLE_DATEI, dateiname: "c.mp4", geaendertAm: "2026-03-01T00:00:00.000Z" },
      { ...VOLLE_DATEI, dateiname: "a.mp4", geaendertAm: "2026-01-01T00:00:00.000Z" },
      { ...VOLLE_DATEI, dateiname: "b.mp4", geaendertAm: "2026-02-01T00:00:00.000Z" },
    ];

    const zeilen = modul.baueAusgabeZeilen(dateien);

    expect(zeilen.map((z) => z.dateiname)).toEqual(["c.mp4", "a.mp4", "b.mp4"]);
  });
});

describe("formatiereDateigroesse – sechs benannte Faelle (DoD)", () => {
  it("liefert fuer 0, 1536 und 1_288_490_188 die erwarteten Texte (DoD)", async () => {
    const modul = await import("../../src/renderer/composer/ausgabe-liste");

    expect(modul.formatiereDateigroesse(0)).toContain("0");
    const kb = modul.formatiereDateigroesse(1536);
    expect(kb).toContain("KB");
    const gb = modul.formatiereDateigroesse(1_288_490_188);
    expect(gb).toContain("GB");
    // Eine Nachkommastelle ab MB: 1_288_490_188 / 1024 / 1024 / 1024 = 1,1998... GB
    expect(gb).toMatch(/\d+,\d GB/);
  });

  it("liefert fuer -1, NaN und undefined as unknown as number jeweils '—' (DoD)", async () => {
    const modul = await import("../../src/renderer/composer/ausgabe-liste");
    for (const kaputt of [-1, Number.NaN, undefined as unknown as number]) {
      expect(modul.formatiereDateigroesse(kaputt)).toBe("—");
    }
  });
});

describe("formatiereZeitpunkt (DoD)", () => {
  it("liefert fuer einen gueltigen ISO-Wert Datum UND Uhrzeit", async () => {
    const modul = await import("../../src/renderer/composer/ausgabe-liste");
    const iso = "2026-08-19T12:00:00.000Z";
    const ergebnis = modul.formatiereZeitpunkt(iso);

    const erwartet = new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    expect(ergebnis).toBe(erwartet);
    expect(ergebnis).not.toContain("Invalid");
    expect(ergebnis).not.toBe(iso);
  });

  it("liefert fuer unbrauchbare Werte '—' (DoD)", async () => {
    const modul = await import("../../src/renderer/composer/ausgabe-liste");
    for (const kaputt of ["", "kaputt", undefined as unknown as string]) {
      expect(modul.formatiereZeitpunkt(kaputt)).toBe("—");
    }
  });
});

describe("findeAusgabe – buchstabengetreuer Vergleich (DoD)", () => {
  it("findet die Datei mit genau dem Namen", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLE_DATEI] });
    await modul.ladeAusgaben("p1");

    expect(modul.findeAusgabe("sommeraktion.mp4")).toEqual(VOLLE_DATEI);
  });

  it("findet 'Sommer.mp4' nicht fuer 'sommer.mp4' (Regression gegen hilfreichen Vergleich, DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: true,
      wert: [{ ...VOLLE_DATEI, dateiname: "sommer.mp4" }],
    });
    await modul.ladeAusgaben("p1");

    expect(modul.findeAusgabe("Sommer.mp4")).toBeNull();
  });
});

describe("DoD-Grep-Proben (ausgabe-liste.ts, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/composer/ausgabe-liste.ts", "utf8")
    .split("\n")
    .filter((zeile) => {
      const getrimmt = zeile.trim();
      return (
        !getrimmt.startsWith("//") &&
        !getrimmt.startsWith("/*") &&
        !getrimmt.startsWith("*") &&
        getrimmt !== ""
      );
    })
    .join("\n");

  it("enthaelt kein JSX, kein react, kein abonniere, kein queue:, kein reiheEin, kein window., kein fs/path, kein .part (DoD)", () => {
    for (const verboten of ["react", "JSX", "abonniere", "'queue:", "reiheEin", "window.", "fs", "path", ".part"]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("deklariert AusgabeDatei NICHT; importiert und re-exportiert genau einmal (DoD)", () => {
    expect(CODE).not.toMatch(/interface AusgabeDatei/);
    expect(CODE).not.toMatch(/type AusgabeDatei =/);
    expect(CODE).toContain("import type { AusgabeDatei } from '../../shared/contracts/projekt-meta'");
    expect(CODE).toContain("export type { AusgabeDatei }");
    const anzahlImporte = CODE.match(/import type \{ AusgabeDatei \}/g)?.length ?? 0;
    expect(anzahlImporte).toBe(1);
  });
});