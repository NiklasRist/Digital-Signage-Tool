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

// Benannter Nachweis der DoD: `ProjektMeta` wird aus `./liste` importiert und einem
// Wert mit ALLEN NEUN Feldern zugewiesen (seit #399 mit `standardMarkeId`) - der
// Beleg fuer die fremden Importstellen (#223 ×2, #225, #226 ×2, #252).
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
  standardMarkeId: null,
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

// ---------------- Suchleiste (Wunsch 29.10.2026) ----------------

describe("filtereProjekte – die Suchleiste", () => {
  const bestand = [
    { ...VOLLER_EINTRAG, id: "a", name: "Fitnessworld24 Herbst", ordner: "p-a" },
    { ...VOLLER_EINTRAG, id: "b", name: "Frühjahr", ordner: "p-b" },
    { ...VOLLER_EINTRAG, id: "c", name: "Kaputt", ordner: "beschaedigt-1", beschaedigt: true },
  ];

  it("ein leerer Suchtext liefert den Bestand UNVERAENDERT - dieselbe Referenz, dieselbe Reihenfolge", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "")).toBe(bestand);
    // Nur Leerzeichen ist ebenfalls "keine Suche" - ein getipptes Leerzeichen darf die
    // Liste nicht leeren.
    expect(modul.filtereProjekte(bestand, "   ")).toBe(bestand);
  });

  it("sucht im Namen, Gross und Klein sind gleich", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "fitnessWORLD").map((e) => e.id)).toEqual(["a"]);
  });

  it("sucht auch im Ordnernamen - bei beschaedigten Projekten ist er der einzige Name", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "beschaedigt").map((e) => e.id)).toEqual(["c"]);
  });

  it("schneidet umschliessende Leerzeichen ab", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "  kaputt  ").map((e) => e.id)).toEqual(["c"]);
  });

  it("kein Treffer ergibt eine LEERE Liste - kein Ersatzwert, kein Alles-Zurueckfallen", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "gibtesnicht")).toEqual([]);
  });

  it("Umlaute werden NICHT gefaltet: 'fruh' findet 'Frühjahr' nicht (ehrlicher Nichttreffer)", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    expect(modul.filtereProjekte(bestand, "fruh")).toEqual([]);
    expect(modul.filtereProjekte(bestand, "früh").map((e) => e.id)).toEqual(["b"]);
  });

  it("behaelt die Reihenfolge der Treffer wie im Bestand (nicht sortiert)", async () => {
    const modul = await import("../../src/renderer/projekt-verwaltung/liste");
    const alle = [
      { ...VOLLER_EINTRAG, id: "z", name: "Treffer Z", ordner: "p-z" },
      { ...VOLLER_EINTRAG, id: "a", name: "Treffer A", ordner: "p-a" },
    ];
    expect(modul.filtereProjekte(alle, "Treffer").map((e) => e.id)).toEqual(["z", "a"]);
  });
});
