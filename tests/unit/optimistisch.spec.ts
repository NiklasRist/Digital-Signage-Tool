// Verhaltenstests zu #126 - die ZWEI Fehlerklassen der optimistischen Bedienung
// (TK 9.7.3, 9.5.4, 9.1.1).
//
// Die eine Frage, die diese Datei beantwortet: Wird bei einem Fehlschlag
// zurueckgenommen oder nicht? Klasse 1 (der Main lehnt die Operation ab) MUSS
// zuruecknehmen, Klasse 2 (das Auto-Speichern scheitert) darf es NIEMALS - dort liegt
// die Aenderung gueltig im Speicher des Main, ein Rollback naehme dem Nutzer echte
// Arbeit weg (TK 9.5.4, NFA-02).
//
// Deshalb traegt der Klasse-2-Block einen `zuruecknehmen`-Spion, obwohl es dort gar
// keinen Rueckruf zu rufen gaebe: Genau das ist die Aussage. Der Spion belaeuft sich
// auf null Aufrufe, NACHDEM er in einem echten optimistischen Schritt benutzt wurde -
// er ist also scharf und nicht bloss unbeteiligt.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
// Nur der TYP wird statisch geholt; die Werte kommen je Test aus `frisch()`, damit
// der modulweite Zustand nicht zwischen Tests durchsickert.
import type { SpeicherEreignis } from "../../src/renderer/composer/optimistisch";

type Modul = typeof import("../../src/renderer/composer/optimistisch");

// Der Zustand dieser Datei ist modulweit (Hoererlisten, Speicherzustand) und hat im
// Vertrag KEINE Zuruecksetzfunktion. Ein frisches Modul je Test ist deshalb der
// einzige Weg zu einem wirklich unberuehrten Anfangszustand - besonders fuer die
// Probe auf den Ausgangswert 'unbekannt'.
async function frisch(): Promise<Modul> {
  vi.resetModules();
  return await import("../../src/renderer/composer/optimistisch");
}

/** Nimmt das Ereignis auf, das `verbindeSpeicherstatus` uebergeben bekommt. */
function abgabestelle(): {
  abonniere: (hoerer: (ereignis: SpeicherEreignis) => void) => () => void;
  sende: (ereignis: SpeicherEreignis) => void;
  abmeldungen: number;
} {
  const stelle = {
    hoerer: null as null | ((ereignis: SpeicherEreignis) => void),
    abmeldungen: 0,
    abonniere(hoerer: (ereignis: SpeicherEreignis) => void): () => void {
      stelle.hoerer = hoerer;
      return () => {
        stelle.abmeldungen += 1;
        stelle.hoerer = null;
      };
    },
    sende(ereignis: SpeicherEreignis): void {
      if (stelle.hoerer === null) throw new Error("Es ist kein Hoerer angemeldet.");
      stelle.hoerer(ereignis);
    },
  };
  return stelle;
}

beforeEach(() => {
  // Die Datei meldet Ausnahmen aus fremden Rueckrufen an die Konsole (TK 9.1.1,
  // "kein stiller Fehlschlag"). Das ist gewolltes Verhalten - im Testlauf soll es
  // nur nicht die Ausgabe fluten.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Klasse 1 - die Operation wird vom Main bestaetigt oder abgelehnt", () => {
  it("bei ok: true wird angewendet und NICHT zurueckgenommen - in dieser Reihenfolge", async () => {
    const { fuehreOptimistischAus } = await frisch();
    const reihenfolge: string[] = [];

    const anwenden = vi.fn(() => void reihenfolge.push("anwenden"));
    const zuruecknehmen = vi.fn(() => void reihenfolge.push("zuruecknehmen"));
    const bestaetigen = vi.fn(async (): Promise<Ergebnis<number>> => {
      reihenfolge.push("bestaetigen");
      return { ok: true, wert: 7 };
    });

    const ergebnis = await fuehreOptimistischAus(anwenden, zuruecknehmen, bestaetigen);

    expect(anwenden).toHaveBeenCalledTimes(1);
    expect(zuruecknehmen).toHaveBeenCalledTimes(0);
    // Erst anzeigen, dann bestaetigen - das IST der optimistische Schritt
    // ("lokal sofort angezeigt, dann per Instant-Op bestaetigt", TK 9.7.3).
    expect(reihenfolge).toEqual(["anwenden", "bestaetigen"]);
    expect(ergebnis).toEqual({ ok: true, wert: 7 });
  });

  it("gibt das Ergebnis bei ok: false unveraendert weiter - samt daten", async () => {
    const { fuehreOptimistischAus } = await frisch();

    const abgelehnt: Ergebnis<number> = {
      ok: false,
      fehler: {
        code: "ungueltige_eingabe",
        meldung: "Die Dauer liegt ausserhalb von 10-45 s.",
        daten: { elementId: "el-1", erlaubt: [10, 45] },
      },
    };
    const zuruecknehmen = vi.fn();

    const ergebnis = await fuehreOptimistischAus(vi.fn(), zuruecknehmen, async () => abgelehnt);

    expect(zuruecknehmen).toHaveBeenCalledTimes(1);
    expect(ergebnis).toEqual(abgelehnt);
    // Identitaet, nicht nur Gleichheit: Ein nachgebautes Ergebnis waere die
    // Umformung, die TK 9.1.1 Punkt 3 ausschliesst - und `daten` ginge dabei
    // erfahrungsgemaess als Erstes verloren.
    expect(ergebnis).toBe(abgelehnt);
  });

  it("schickt bei ok: false genau EINE Inline-Meldung mit Code und Text des Main", async () => {
    const { fuehreOptimistischAus, aufInlineMeldung } = await frisch();

    const meldungen: unknown[] = [];
    aufInlineMeldung((meldung) => void meldungen.push(meldung));

    await fuehreOptimistischAus(vi.fn(), vi.fn(), async () => ({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "Das Element gibt es nicht." },
    }));

    expect(meldungen).toEqual([
      { code: "nicht_gefunden", meldung: "Das Element gibt es nicht." },
    ]);
  });

  it("schickt bei ok: true KEINE Inline-Meldung", async () => {
    const { fuehreOptimistischAus, aufInlineMeldung } = await frisch();

    const hoerer = vi.fn();
    aufInlineMeldung(hoerer);

    await fuehreOptimistischAus(vi.fn(), vi.fn(), async () => ({ ok: true, wert: null }));

    expect(hoerer).toHaveBeenCalledTimes(0);
  });

  it("uebersetzt eine Ausnahme aus bestaetigen in unbekannter_fehler und nimmt zurueck", async () => {
    const { fuehreOptimistischAus } = await frisch();

    const zuruecknehmen = vi.fn();
    // ENTSCHIEDEN 2: Die Aenderung ist nachweislich NICHT bestaetigt worden, also
    // gilt dieselbe Regel wie bei einer Ablehnung. Geworfen wird nichts - der
    // `resolves`-Zweig ist zugleich der Beleg dafuer.
    const ergebnis = await fuehreOptimistischAus(vi.fn(), zuruecknehmen, async () => {
      throw new Error("Die Bruecke ist weg.");
    });

    expect(zuruecknehmen).toHaveBeenCalledTimes(1);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar");
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    // Kein Stacktrace und kein roher Ausnahmetext in der Oberflaeche (TK 9.1.1).
    expect(ergebnis.fehler.meldung).not.toContain("Die Bruecke ist weg.");
  });

  it("ruft bestaetigen nicht, wenn anwenden wirft - und nimmt auch nichts zurueck", async () => {
    const { fuehreOptimistischAus } = await frisch();

    const bestaetigen = vi.fn(async (): Promise<Ergebnis<void>> => ({ ok: true, wert: undefined }));
    const zuruecknehmen = vi.fn();

    const ergebnis = await fuehreOptimistischAus(
      () => {
        throw new Error("Die Sicht ist kaputt.");
      },
      zuruecknehmen,
      bestaetigen,
    );

    // Waere `bestaetigen` gelaufen, liefe im Main eine Aenderung durch, die die
    // Oberflaeche nie gezeigt hat.
    expect(bestaetigen).toHaveBeenCalledTimes(0);
    // Es ist nichts angewendet worden, also gibt es nichts zurueckzunehmen.
    expect(zuruecknehmen).toHaveBeenCalledTimes(0);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar");
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
  });

  it("laesst eine Ausnahme aus zuruecknehmen den Ablauf nicht zerreissen", async () => {
    const { fuehreOptimistischAus, aufInlineMeldung } = await frisch();

    const hoerer = vi.fn();
    aufInlineMeldung(hoerer);

    const ergebnis = await fuehreOptimistischAus(
      vi.fn(),
      () => {
        throw new Error("Rollback misslungen.");
      },
      async () => ({ ok: false, fehler: { code: "nicht_gefunden", meldung: "weg" } }),
    );

    // Saehe der Nutzer sonst WEDER den richtigen Stand NOCH einen Hinweis.
    expect(hoerer).toHaveBeenCalledTimes(1);
    expect(ergebnis.ok).toBe(false);
  });

  it("beendet die Benachrichtigung nach dem Abmelden", async () => {
    const { fuehreOptimistischAus, aufInlineMeldung } = await frisch();

    const hoerer = vi.fn();
    const abmelden = aufInlineMeldung(hoerer);
    abmelden();
    abmelden(); // mehrfach abmelden darf keinen fremden Hoerer treffen

    const zweiter = vi.fn();
    aufInlineMeldung(zweiter);

    await fuehreOptimistischAus(vi.fn(), vi.fn(), async () => ({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    }));

    expect(hoerer).toHaveBeenCalledTimes(0);
    expect(zweiter).toHaveBeenCalledTimes(1);
  });
});

describe("Klasse 2 - das Auto-Speichern scheitert: WARNEN, nicht zurueckrollen", () => {
  it("vor jedem Ereignis ist der Zustand 'unbekannt' - nicht 'gespeichert'", async () => {
    const { holeSpeicherzustand } = await frisch();

    // Der Waechter gegen die stille Falschaussage (ENTSCHIEDEN 3): Ein Nutzer, der
    // "gespeichert" liest, hat keinen Anlass nachzusehen.
    expect(holeSpeicherzustand()).toEqual({ zustand: "unbekannt", letzterFehlercode: null });
  });

  it("das blosse Anmelden ist keine Entwarnung", async () => {
    const { verbindeSpeicherstatus, holeSpeicherzustand, aufSpeicherzustand } = await frisch();

    const hoerer = vi.fn();
    aufSpeicherzustand(hoerer);
    verbindeSpeicherstatus(abgabestelle().abonniere);

    expect(holeSpeicherzustand().zustand).toBe("unbekannt");
    expect(hoerer).toHaveBeenCalledTimes(0);
  });

  it("ein Fehler-Ereignis warnt und nimmt NICHTS zurueck", async () => {
    const { fuehreOptimistischAus, verbindeSpeicherstatus, holeSpeicherzustand, aufInlineMeldung } =
      await frisch();

    const stelle = abgabestelle();
    verbindeSpeicherstatus(stelle.abonniere);

    // Der Spion wird zuerst in einem ECHTEN optimistischen Schritt benutzt: Ein
    // Rueckruf, der nie irgendwo ankam, koennte auch aus Versehen null Aufrufe
    // zeigen. So steht fest, dass er scharf ist.
    const zuruecknehmen = vi.fn();
    await fuehreOptimistischAus(vi.fn(), zuruecknehmen, async () => ({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    }));
    expect(zuruecknehmen).toHaveBeenCalledTimes(1);
    zuruecknehmen.mockClear();

    const inline = vi.fn();
    aufInlineMeldung(inline);

    stelle.sende({ typ: "fehler", code: "speicher_fehler" });

    // DIE zentrale Pruefung dieses Issues: kein Rollback, kein Arbeitsverlust
    // (TK 9.5.4).
    expect(zuruecknehmen).toHaveBeenCalledTimes(0);
    // Und auch keine Inline-Meldung: Die gehoert zu Klasse 1 und beschriebe hier
    // eine Ablehnung, die es nicht gab.
    expect(inline).toHaveBeenCalledTimes(0);
    expect(holeSpeicherzustand()).toEqual({
      zustand: "nicht_gespeichert",
      letzterFehlercode: "speicher_fehler",
    });
  });

  it("ein spaeteres 'gespeichert' loescht Hinweis und Fehlercode", async () => {
    const { verbindeSpeicherstatus, holeSpeicherzustand } = await frisch();

    const stelle = abgabestelle();
    verbindeSpeicherstatus(stelle.abonniere);

    stelle.sende({ typ: "fehler", code: "speicher_fehler" });
    stelle.sende({ typ: "gespeichert" });

    // "Erst nach erfolgreichem Schreiben verschwindet der Hinweis." (TK 9.5.4)
    expect(holeSpeicherzustand()).toEqual({ zustand: "gespeichert", letzterFehlercode: null });
  });

  it("zwei Fehler nacheinander behalten den Zustand und tragen den ZULETZT gemeldeten Code", async () => {
    const { verbindeSpeicherstatus, holeSpeicherzustand } = await frisch();

    const stelle = abgabestelle();
    verbindeSpeicherstatus(stelle.abonniere);

    stelle.sende({ typ: "fehler", code: "kein_platz" });
    stelle.sende({ typ: "fehler", code: "ziel_gesperrt" });

    expect(holeSpeicherzustand()).toEqual({
      zustand: "nicht_gespeichert",
      letzterFehlercode: "ziel_gesperrt",
    });
  });

  it("faellt nach dem ersten Ereignis nie wieder auf 'unbekannt' zurueck", async () => {
    vi.useFakeTimers();
    try {
      const { verbindeSpeicherstatus, holeSpeicherzustand, aufSpeicherzustand } = await frisch();

      const gesehen: string[] = [];
      aufSpeicherzustand((zustand) => void gesehen.push(zustand.zustand));

      const stelle = abgabestelle();
      verbindeSpeicherstatus(stelle.abonniere);

      stelle.sende({ typ: "gespeichert" });
      stelle.sende({ typ: "fehler", code: "kein_platz" });
      stelle.sende({ typ: "gespeichert" });

      // Kein Timer kann etwas nachtraeglich umstellen (ENTSCHIEDEN 4): Eine Stunde
      // vorgespulte Zeit aendert nichts.
      vi.advanceTimersByTime(60 * 60 * 1000);

      expect(gesehen).toEqual(["gespeichert", "nicht_gespeichert", "gespeichert"]);
      expect(holeSpeicherzustand().zustand).toBe("gespeichert");
    } finally {
      vi.useRealTimers();
    }
  });

  it("die Abmeldung aus verbindeSpeicherstatus reicht bis zur uebergebenen Abo-Funktion durch", async () => {
    const { verbindeSpeicherstatus, holeSpeicherzustand } = await frisch();

    const stelle = abgabestelle();
    const abmelden = verbindeSpeicherstatus(stelle.abonniere);
    abmelden();

    expect(stelle.abmeldungen).toBe(1);
    // Nach der Abmeldung gibt es niemanden mehr, an den gesendet werden koennte.
    expect(() => stelle.sende({ typ: "fehler", code: "kein_platz" })).toThrow();
    expect(holeSpeicherzustand().zustand).toBe("unbekannt");
  });

  it("beendet die Zustands-Benachrichtigung nach dem Abmelden", async () => {
    const { verbindeSpeicherstatus, aufSpeicherzustand } = await frisch();

    const stelle = abgabestelle();
    verbindeSpeicherstatus(stelle.abonniere);

    const hoerer = vi.fn();
    const abmelden = aufSpeicherzustand(hoerer);
    const zweiter = vi.fn();
    aufSpeicherzustand(zweiter);

    abmelden();
    abmelden();
    stelle.sende({ typ: "gespeichert" });

    expect(hoerer).toHaveBeenCalledTimes(0);
    expect(zweiter).toHaveBeenCalledTimes(1);
  });

  it("laesst einen werfenden Hoerer die uebrigen nicht abschneiden", async () => {
    const { verbindeSpeicherstatus, aufSpeicherzustand, holeSpeicherzustand } = await frisch();

    const stelle = abgabestelle();
    verbindeSpeicherstatus(stelle.abonniere);

    aufSpeicherzustand(() => {
      throw new Error("Panel kaputt.");
    });
    const zweiter = vi.fn();
    aufSpeicherzustand(zweiter);

    expect(() => stelle.sende({ typ: "fehler", code: "kein_platz" })).not.toThrow();
    expect(zweiter).toHaveBeenCalledTimes(1);
    expect(holeSpeicherzustand().zustand).toBe("nicht_gespeichert");
  });
});

describe("Was diese Datei nicht anfasst", () => {
  const quelle = readFileSync(
    new URL("../../src/renderer/composer/optimistisch.ts", import.meta.url),
    "utf8",
  );

  it("beruehrt keinen IPC-Kanal und keinen Zeitgeber", () => {
    // Der gesuchte Kanal-Praefix wird ZUSAMMENGESETZT, damit diese Testdatei nicht
    // selbst zum Treffer wird, wenn jemand die Probe als Grep ueber das Repo
    // wiederholt.
    expect(quelle).not.toContain(`${"project"}:`);
    for (const verboten of ["window.api", "ipcRenderer", "rufeAuf", "setTimeout", "setInterval"]) {
      expect(quelle).not.toContain(verboten);
    }
  });

  it("importiert nichts aus src/main", () => {
    // Modulgrenze E3: Fachliche Fehlercode-Unionen liegen im Main und duerfen vom
    // Renderer nicht importiert werden - `code` ist deshalb `string`.
    expect(quelle).not.toMatch(/from\s+['"][^'"]*\/main\//);
  });
});
