// Verhaltenstest zu #24 - der typisierte Invoke-Wrapper des ipc-client (TK 9.1.1).
import { afterEach, describe, expect, it, vi } from "vitest";

import { rufeAuf } from "../../src/renderer/ipc-client/rufe-auf";

/** Stellt eine Preload-Bruecke bereit, deren `invoke` das Vorgegebene liefert. */
function mitBruecke(invoke: (kanal: string, nutzlast?: unknown) => Promise<unknown>) {
  const spion = vi.fn(invoke);
  vi.stubGlobal("window", { api: { invoke: spion } });
  return spion;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rufeAuf (#24)", () => {
  it("reicht Kanal und Nutzlast durch und gibt die Antwort unveraendert zurueck", async () => {
    // toBe, nicht toEqual: Der Wrapper darf die Antwort nicht einmal umkopieren.
    const antwort = { ok: true as const, wert: { id: "a1" } };
    const spion = mitBruecke(() => Promise.resolve(antwort));

    const ergebnis = await rufeAuf<{ id: string }>("project:oeffne", { id: "a1" });

    expect(spion).toHaveBeenCalledWith("project:oeffne", { id: "a1" });
    expect(ergebnis).toBe(antwort);
  });

  it("liefert eine Fehler-Huelle zurueck, statt sie zu werfen oder auszupacken", async () => {
    // Am Fehlercode haengt echtes Verhalten (FA-19) - er muss den Aufrufer erreichen.
    const antwort = {
      ok: false as const,
      fehler: { code: "asset_referenziert", meldung: "in Benutzung", daten: ["e1"] },
    };
    mitBruecke(() => Promise.resolve(antwort));

    await expect(rufeAuf("media:loescheMedium", { id: "m1" })).resolves.toBe(antwort);
  });

  it("reicht eine Ablehnung der Bruecke unveraendert weiter", async () => {
    // Kein try/catch: Ein Umverpacken in eine Huelle waere die verbotene Transformation.
    const grund = new Error("No handler registered for 'project:oeffne'");
    mitBruecke(() => Promise.reject(grund));

    await expect(rufeAuf("project:oeffne")).rejects.toBe(grund);
  });

  it("lehnt ab, wenn die Bruecke fehlt - ohne ein Ergebnis zu erfinden", async () => {
    // Offener STOPP-Punkt des Issues: kein synthetisches unbekannter_fehler.
    vi.stubGlobal("window", {});

    await expect(rufeAuf("project:oeffne")).rejects.toThrow(/window\.api/);
  });
});
