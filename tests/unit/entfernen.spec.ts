// Verhaltenstest zu #209 - [queue-panel] Entfernen und Abbrechen.
// fa-18: ein anstehender Auftrag kann entfernt, ein laufender Render abgebrochen
// werden (TK 9.3.4, 9.3.6, 9.2.7). Diese Datei haelt keinen Zustand - sie beantwortet
// nur, ob/welcher Schalter erscheint, und spricht den EINEN Kanal `KANAELE.queue.entferne`.
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragArt, AuftragStatus } from "../../src/shared/contracts/auftrag";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

const { beschriftung, brauchtBestaetigung, fuehreQueueAktionAus, moeglicheAktion, rueckfrageText } =
  await import("../../src/renderer/queue-panel/entfernen");

const ARTEN = ["import", "loeschen", "render", "export"] as const;
const STATUS = ["anstehend", "laeuft", "erfolg", "fehlgeschlagen", "abgebrochen"] as const;

/** Eine vollwertige Auftrags-Attrappe je Art - der Rumpf liest nur status/art/label. */
function auftrag(art: AuftragArt, status: AuftragStatus, auftragId = "a-1"): Auftrag {
  const gemeinsam = {
    auftragId,
    status,
    label: "Lauf A",
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-16T10:00:00.000Z",
  };
  switch (art) {
    case "import":
      return { ...gemeinsam, art, payload: { projektId: "p1", quellPfad: "C:/x.mp4" } };
    case "loeschen":
      return { ...gemeinsam, art, payload: { projektId: "p1", assetId: "m-1" } };
    case "render":
      return {
        ...gemeinsam,
        art,
        payload: {
          renderId: "r-1",
          projektId: "p1",
          elemente: [],
          profil: RENDER_PROFILE,
          ausgabeName: "sommer",
        },
      };
    case "export":
      return {
        ...gemeinsam,
        art,
        payload: { projektId: "p1", dateiname: "sommer.mp4", zielPfad: "E:/" },
      };
  }
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("moeglicheAktion (#209)", () => {
  it("beantwortet alle 20 Status/Art-Kombinationen - genau zwei Gruppen liefern einen Schalter", () => {
    for (const status of STATUS) {
      for (const art of ARTEN) {
        const erwartet =
          status === "anstehend"
            ? "entfernen"
            : status === "laeuft" && art === "render"
              ? "abbrechen"
              : null;
        expect(moeglicheAktion(auftrag(art, status, `${status}/${art}`)), `${status}/${art}`).toBe(
          erwartet,
        );
      }
    }
  });

  it("laeuft mit import, loeschen oder export liefert null", () => {
    expect(moeglicheAktion(auftrag("import", "laeuft"))).toBeNull();
    expect(moeglicheAktion(auftrag("loeschen", "laeuft"))).toBeNull();
    expect(moeglicheAktion(auftrag("export", "laeuft"))).toBeNull();
  });

  it("erfolg, fehlgeschlagen und abgebrochen liefern in allen Arten null", () => {
    for (const status of ["erfolg", "fehlgeschlagen", "abgebrochen"] as const) {
      for (const art of ARTEN) {
        expect(moeglicheAktion(auftrag(art, status)), `${status}/${art}`).toBeNull();
      }
    }
  });

  it("unbekannte status- oder art-Werte liefern null, ohne Ausnahme", () => {
    const unbekannterStatus = { ...auftrag("render", "laeuft"), status: "gestoppt" } as unknown as Auftrag;
    const unbekannteArt = { ...auftrag("import", "laeuft"), art: "drehen" } as unknown as Auftrag;

    expect(() => moeglicheAktion(unbekannterStatus)).not.toThrow();
    expect(moeglicheAktion(unbekannterStatus)).toBeNull();
    expect(() => moeglicheAktion(unbekannteArt)).not.toThrow();
    expect(moeglicheAktion(unbekannteArt)).toBeNull();
  });
});

describe("brauchtBestaetigung und Texte (#209, ENTSCHIEDEN 2/3)", () => {
  it("nur der Abbruch braucht eine Rueckfrage", () => {
    expect(brauchtBestaetigung("abbrechen")).toBe(true);
    expect(brauchtBestaetigung("entfernen")).toBe(false);
  });

  it("beschriftung liefert die verbindlichen Schalt- und Beschriftungstexte", () => {
    expect(beschriftung("entfernen")).toBe("Aus der Warteschlange nehmen");
    expect(beschriftung("abbrechen")).toBe("Render abbrechen");
  });

  it("rueckfrageText eines laufenden Render nennt dessen label und die unveraenderte Datei", () => {
    const auftragMitLabel = { ...auftrag("render", "laeuft"), label: "Sommeraktion" } as Auftrag;
    const text = rueckfrageText(auftragMitLabel);

    expect(text).toContain("Sommeraktion");
    expect(text).toContain("Eine vorhandene Datei gleichen Namens bleibt unverändert.");
  });

  it("rueckfrageText entspricht exakt dem verbindlichen Text aus ENTSCHIEDEN 3", () => {
    expect(rueckfrageText(auftrag("render", "laeuft", "r-42"))).toBe(
      "„Lauf A\" abbrechen? Der bisherige Fortschritt geht verloren, und es entsteht keine Ausgabedatei. Eine vorhandene Datei gleichen Namens bleibt unverändert.",
    );
  });

  it("rueckfrageText ist leer, wenn keine Rueckfrage ansteht", () => {
    expect(rueckfrageText(auftrag("import", "anstehend"))).toBe("");
    expect(rueckfrageText(auftrag("render", "erfolg"))).toBe("");
  });
});

describe("fuehreQueueAktionAus (#209)", () => {
  it("ruft rufeAuf genau einmal mit KANAELE.queue.entferne und der Nutzlast { auftragId }", async () => {
    attrappen.rufeAuf.mockResolvedValue({ ok: true, wert: undefined });

    const ergebnis = await fuehreQueueAktionAus("a-1");

    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.queue.entferne, { auftragId: "a-1" });
  });

  it("reicht ein ok:false mit nicht_gefunden unveraendert durch - kein Umdeuten in ok", async () => {
    attrappen.rufeAuf.mockResolvedValue({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "Der Auftrag laeuft nicht mehr." },
    });

    const ergebnis = await fuehreQueueAktionAus("a-1");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("nicht_gefunden");
      expect(ergebnis.fehler.meldung).toBe("Der Auftrag laeuft nicht mehr.");
    }
  });

  it("leere auftragId ergibt ungueltige_eingabe ohne Aufruf", async () => {
    const ergebnis = await fuehreQueueAktionAus("");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
  });

  it("faengt eine werfende rufeAuf-Attrappe als unbekannter_fehler, ohne Ausnahme", async () => {
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));

    const ergebnis = await fuehreQueueAktionAus("a-1");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
      expect(ergebnis.fehler.meldung).toBe("window.api fehlt");
    }
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("faengt auch eine werfende Attrappe ohne Error-Objekt - meldung als Zeichenkette", async () => {
    attrappen.rufeAuf.mockRejectedValue("nackter Grund");

    const ergebnis = await fuehreQueueAktionAus("a-1");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
      expect(ergebnis.fehler.meldung).toBe("nackter Grund");
    }
  });
});