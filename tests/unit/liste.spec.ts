// Logik-Tests zu #222 - die Projektliste laden, halten und anzeigen
// (liste.ts, node, ohne Browser).
//
// Der Modul-Zustand liegt in der Datei - deshalb wird je Test mit `vi.resetModules()`
// ein frisches Modul geladen (Muster aus projektzustand.spec.ts). Bewiesen werden:
// der eine Lade-Aufruf ohne Nutzlast, das Uebernehmen ohne Umsortierung/Ergaenzung,
// das Stehenlassen eines guten Bestands bei Fehlschlag, die Hoerer-Benachrichtigung
// samt Abmeldung und die reinen Ableitungen.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import { readFileSync } from "node:fs";

// Benannter Nachweis der DoD: `ProjektMeta` wird aus `./liste` importiert und einem
// Wert mit ALLEN ACHT Feldern zugewiesen - der Beleg fuer die sechs fremden
// Importstellen (#223 ×2, #225, #226 ×2, #252).
import type { ProjektMeta } from "../../src/renderer/projekt-verwaltung/liste";
const VOLLER_EINTRAG: ProjektMeta = {
  id: "p1",
  name: "Projekt Eins",
  erstelltAm: "2026-08-01T10:00:00.000Z",
  geaendertAm: "2026-08-02T11:30:00.000Z",
  ordner: "p1",
  beschaedigt: false,
  anzahlMedien: 3,
  anzahlAusgaben: 1,
};

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

type Modul = typeof import("../../src/renderer/projekt-verwaltung/liste");

async function frisch(): Promise<Modul> {
  vi.resetModules();
  return await import("../../src/renderer/projekt-verwaltung/liste");
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ladeProjektliste – der eine Aufruf (DoD)", () => {
  it("ruft rufeAuf genau einmal auf project:listeProjekte und ohne Nutzlast (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [] });

    await modul.ladeProjektliste();

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.project.listeProjekte);
    const nutzlast = attrappen.rufeAuf.mock.calls[0]?.[1];
    expect(nutzlast).toBeUndefined();
  });
});

describe("holeProjektliste – Ausgangszustand und Uebernahme (DoD)", () => {
  it("liefert vor dem ersten Laden genau LEERE_PROJEKTLISTE mit zustand unbekannt (DoD)", async () => {
    const modul = await frisch();

    expect(modul.holeProjektliste()).toEqual(modul.LEERE_PROJEKTLISTE);
    expect(modul.holeProjektliste().zustand).toBe("unbekannt");
    expect(modul.holeProjektliste().eintraege).toEqual([]);
  });

  it("setzt bei Erfolg zustand geladen und uebernimmt die Eintraege UNVERAENDERT (DoD)", async () => {
    const modul = await frisch();
    const eintraege = [VOLLER_EINTRAG];
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: eintraege });

    const ergebnis = await modul.ladeProjektliste();

    expect(ergebnis).toEqual({ ok: true, wert: eintraege });
    // Identitaet statt Feldgleichheit: nicht umkopiert, nicht umsortiert, nicht ergaenzt.
    expect(modul.holeProjektliste().eintraege).toBe(eintraege);
    expect(modul.holeProjektliste().zustand).toBe("geladen");
    expect(modul.holeProjektliste().ladefehler).toBeNull();
  });

  it("behandelt ein leeres Array als gueltigen Bestand, nicht als Fehler (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [] });

    const ergebnis = await modul.ladeProjektliste();

    expect(ergebnis.ok).toBe(true);
    expect(modul.holeProjektliste().zustand).toBe("geladen");
    expect(modul.holeProjektliste().eintraege).toEqual([]);
    expect(modul.holeProjektliste().ladefehler).toBeNull();
  });
});

describe("ladeProjektliste – Fehlschlaege (DoD)", () => {
  it("laesst einen zuvor geladenen Bestand stehen, setzt ladefehler und gibt den Code unveraendert (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLER_EINTRAG] });
    await modul.ladeProjektliste();

    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte weg" },
    } satisfies Ergebnis<ProjektMeta[], string>);
    const ergebnis = await modul.ladeProjektliste();

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte weg" },
    });
    // Der gute Bestand bleibt stehen; zustand bleibt geladen.
    expect(modul.holeProjektliste().eintraege).toEqual([VOLLER_EINTRAG]);
    expect(modul.holeProjektliste().zustand).toBe("geladen");
    expect(modul.holeProjektliste().ladefehler?.code).toBe("speicher_fehler");
  });

  it("fängt ein werfendes rufeAuf (Bridge fehlt) und wirft nicht nach aussen (Fehlerpfad)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockRejectedValueOnce(new Error("Preload fehlt"));

    const ergebnis = await modul.ladeProjektliste();

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    }
  });
});

describe("aufProjektlisteGeaendert – Hoerer und Abmeldung (DoD)", () => {
  it("benachrichtigt bei Erfolg und bei Fehlschlag (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLER_EINTRAG] });
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "weg" },
    } satisfies Ergebnis<ProjektMeta[], string>);

    const gehoert: unknown[] = [];
    const abmelden = modul.aufProjektlisteGeaendert((liste) => gehoert.push(liste.zustand));

    await modul.ladeProjektliste();
    await modul.ladeProjektliste();

    expect(gehoert).toEqual(["geladen", "geladen"]);
    abmelden();
  });

  it("beendet das Abo durch die Abmeldung; ein zweiter Aufruf wirft nicht (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: [] });

    const gehoert: string[] = [];
    const abmelden = modul.aufProjektlisteGeaendert((liste) => gehoert.push(liste.zustand));

    await modul.ladeProjektliste();
    abmelden();
    abmelden(); // zweiter Aufruf: wirkungslos, kein Wurf
    await modul.ladeProjektliste();

    expect(gehoert).toEqual(["geladen"]);
  });

  it("meldet einen werfenden Hoerer, unterbricht aber die uebrigen nicht", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: [] });

    const gehoert: string[] = [];
    modul.aufProjektlisteGeaendert(() => {
      throw new Error("kaputt");
    });
    modul.aufProjektlisteGeaendert((liste) => gehoert.push(liste.zustand));

    await modul.ladeProjektliste();

    expect(gehoert).toEqual(["geladen"]);
  });
});

describe("findeProjekt (DoD)", () => {
  it("findet den Eintrag mit der Kennung aus dem gehaltenen Stand", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLER_EINTRAG] });
    await modul.ladeProjektliste();

    expect(modul.findeProjekt("p1")).toEqual(VOLLER_EINTRAG);
  });

  it("liefert fuer eine unbekannte Kennung null und loest kein Nachladen aus (DoD)", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [VOLLER_EINTRAG] });
    await modul.ladeProjektliste();
    attrappen.rufeAuf.mockClear();

    expect(modul.findeProjekt("unbekannt")).toBeNull();
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });
});

describe("baueListenZeilen – Ableitung (DoD)", () => {
  it("setzt oeffnenErlaubt genau dann false, wenn beschaedigt true ist (DoD)", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    const zeilen = modul.baueListenZeilen([
      VOLLER_EINTRAG,
      { ...VOLLER_EINTRAG, id: "p2", name: "Kaputt", beschaedigt: true },
    ]);

    expect(zeilen[0]?.oeffnenErlaubt).toBe(true);
    expect(zeilen[1]?.oeffnenErlaubt).toBe(false);
    expect(zeilen[1]?.beschaedigt).toBe(true);
  });

  it("veraendert die Reihenfolge nicht - auch bei absichtlich unsortierten Daten (DoD)", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    const eintraege = [
      { ...VOLLER_EINTRAG, id: "c", geaendertAm: "2026-03-01T00:00:00.000Z" },
      { ...VOLLER_EINTRAG, id: "a", geaendertAm: "2026-01-01T00:00:00.000Z" },
      { ...VOLLER_EINTRAG, id: "b", geaendertAm: "2026-02-01T00:00:00.000Z" },
    ];

    const zeilen = modul.baueListenZeilen(eintraege);

    expect(zeilen.map((z) => z.id)).toEqual(["c", "a", "b"]);
  });

  it("laesst einen beschaedigten Eintrag im Ergebnis (Regression gegen stilles Ueberspringen)", async () => {
    const modul = await frisch();
    const besch = { ...VOLLER_EINTRAG, id: "p2", name: "Kaputt", beschaedigt: true };
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: [besch] });

    await modul.ladeProjektliste();

    expect(modul.holeProjektliste().eintraege).toEqual([besch]);
  });
});

describe("formatiereZeitpunkt (DoD)", () => {
  it("liefert fuer einen gueltigen ISO-Wert Datum UND Uhrzeit", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    const iso = "2026-08-19T12:00:00.000Z";
    const ergebnis = modul.formatiereZeitpunkt(iso);

    // Derselbe Aufruf wie in der Datei: lokale Zeitzone, Datum und Uhrzeit.
    const erwartet = new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    expect(ergebnis).toBe(erwartet);
    // Kein 'Invalid Date', kein Rohwert.
    expect(ergebnis).not.toContain("Invalid");
    expect(ergebnis).not.toBe(iso);
  });

  it("liefert fuer unbrauchbare Werte den Ersatztext '—' (DoD)", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    for (const kaputt of ["", "kaputt", undefined as unknown as string]) {
      expect(modul.formatiereZeitpunkt(kaputt)).toBe("—");
    }
  });
});

describe("DoD-Grep-Proben (liste.ts, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/projekt-verwaltung/liste.ts", "utf8")
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

  it("enthaelt kein JSX, keinen react-Import, kein abonniere, kein 'queue:', kein window. (DoD)", () => {
    for (const verboten of ["react", "JSX", "abonniere", "'queue:", "window."]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("deklariert ProjektMeta NICHT; importiert und re-exportiert genau einmal (DoD)", () => {
    expect(CODE).not.toMatch(/interface ProjektMeta/);
    expect(CODE).not.toMatch(/type ProjektMeta =/);
    expect(CODE).toContain("import type { ProjektMeta } from '../../shared/contracts/projekt-meta'");
    expect(CODE).toContain("export type { ProjektMeta }");
    const anzahlImporte = CODE.match(/import type \{ ProjektMeta \}/g)?.length ?? 0;
    expect(anzahlImporte).toBe(1);
  });

  it("setzt fuer anzahlMedien/anzahlAusgaben keinen Ersatzwert (DoD)", () => {
    expect(CODE).not.toContain("anzahlMedien");
    expect(CODE).not.toContain("anzahlAusgaben");
  });
});