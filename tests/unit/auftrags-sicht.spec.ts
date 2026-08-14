// Verhaltenstest zu #205 - die Auftrags-Sicht der Warteschlangen-Leiste
// (TK 9.1.1 Punkt 10, TK 9.14.2).
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import { KANAELE } from "../../src/shared/contracts/kanaele";

// Attrappen fuer die beiden Zugaenge zum Main. Der ganze Beweis dieses Issues haengt an
// der REIHENFOLGE zwischen beiden, deshalb sind sie einzeln steuerbar.
const attrappen = vi.hoisted(() => ({
  rufeAuf: vi.fn(),
  abonniere: vi.fn(),
}));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));
vi.mock("../../src/renderer/ipc-client/ereignisse", () => ({
  abonniere: attrappen.abonniere,
}));

const { ANFANGS_SICHT, baueAuftragsSichtAuf } = await import(
  "../../src/renderer/queue-panel/auftrags-sicht"
);

/** Ein Holen, dessen Antwort der Test selbst auslöst - so wird das Zeitfenster prüfbar. */
function angehaltenesHolen() {
  let antworte: (ergebnis: Ergebnis<Auftrag[]>) => void = () => {};
  const versprechen = new Promise<Ergebnis<Auftrag[]>>((aufloesen) => {
    antworte = aufloesen;
  });
  attrappen.rufeAuf.mockReturnValue(versprechen);
  // Wartet, bis die Fortsetzung hinter dem `await` in der Datei gelaufen ist.
  return {
    async antworte(ergebnis: Ergebnis<Auftrag[]>) {
      antworte(ergebnis);
      await versprechen;
      await Promise.resolve();
    },
  };
}

/** Doppel von `abonniere` (#151): merkt sich die Hörer je Kanal, je Abo eine Abmeldung. */
function abonnementeDoppel() {
  const hoerer = new Map<string, (nutzlast: never) => void>();
  const abmeldungen = new Map<string, ReturnType<typeof vi.fn>>();

  attrappen.abonniere.mockImplementation(
    (kanal: string, h: (nutzlast: never) => void) => {
      hoerer.set(kanal, h);
      const abmelden = vi.fn();
      abmeldungen.set(kanal, abmelden);
      return abmelden;
    },
  );

  return {
    abmeldungen,
    sende(kanal: string, nutzlast: unknown) {
      const h = hoerer.get(kanal);
      if (h === undefined) {
        throw new Error(`Test: auf "${kanal}" hoert niemand`);
      }
      (h as (n: unknown) => void)(nutzlast);
    },
    hoertAuf(kanal: string) {
      return hoerer.has(kanal);
    },
  };
}

function auftrag(auftragId: string): Auftrag {
  return {
    auftragId,
    art: "import",
    status: "anstehend",
    label: `Import ${auftragId}`,
    payload: { projektId: "p1", quellPfad: "C:/x.mp4" },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("baueAuftragsSichtAuf (#205)", () => {
  it("sagt anfangs `unbekannt` und setzt beim Betreten gar nichts", () => {
    // `unbekannt` heisst „noch nicht geholt", nicht „keine Auftraege" - eine leere
    // Liste als Startwert waere eine Behauptung ueber die Schlange (Invariante 1).
    expect(ANFANGS_SICHT).toEqual({ zustand: "unbekannt" });

    abonnementeDoppel();
    angehaltenesHolen();
    const setzeSicht = vi.fn();

    baueAuftragsSichtAuf(setzeSicht);

    expect(setzeSicht).not.toHaveBeenCalled();
  });

  it("holt zuerst und abonniert ERST DANACH - genau ein Holen, beide Kanaele", async () => {
    const abos = abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();
    const bestand = [auftrag("a1"), auftrag("a2")];

    baueAuftragsSichtAuf(setzeSicht);

    // Der Kern des Issues: Solange die Antwort aussteht, gibt es KEIN Abonnement.
    // Andernfalls koennte die Antwort ein zwischenzeitliches Ereignis ueberschreiben.
    expect(attrappen.abonniere).not.toHaveBeenCalled();
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.queue.holeStand);

    await holen.antworte({ ok: true, wert: bestand });

    expect(setzeSicht).toHaveBeenCalledTimes(1);
    expect(setzeSicht).toHaveBeenCalledWith({
      zustand: "geladen",
      auftraege: bestand,
    });
    expect(abos.hoertAuf(KANAELE.queue.geaendert)).toBe(true);
    expect(abos.hoertAuf(KANAELE.queue.stoerung)).toBe(true);
    // Kein zweiter Beschaffungsweg: nach dem Abonnieren wird nicht erneut geholt.
    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
  });

  it("reicht die Ereignis-Nutzlast unveraendert weiter - ohne Sortieren, Filtern, Kappen", async () => {
    const abos = abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();

    baueAuftragsSichtAuf(setzeSicht);
    await holen.antworte({ ok: true, wert: [] });

    const push = [auftrag("z"), auftrag("a"), auftrag("m")];
    abos.sende(KANAELE.queue.geaendert, push);

    const letzte = setzeSicht.mock.calls.at(-1)?.[0];
    // toBe, nicht toEqual: Reihenfolge und Zusammenfuehrung sind Vertrag von #64/#65;
    // eine zweite Sortierregel hier zeigte beim Oeffnen etwas anderes als nach dem Push.
    expect(letzte).toEqual({ zustand: "geladen", auftraege: push });
    expect((letzte as { auftraege: Auftrag[] }).auftraege).toBe(push);
  });

  it("uebernimmt einen Fehlschlag des Holens mit unveraendertem Code - und abonniert trotzdem", async () => {
    const abos = abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();

    baueAuftragsSichtAuf(setzeSicht);
    // Die Reihenfolge gilt auch im Fehlerfall: erst die Antwort, dann das Abonnement.
    expect(attrappen.abonniere).not.toHaveBeenCalled();

    await holen.antworte({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "Q1 nicht lesbar" },
    });

    expect(setzeSicht).toHaveBeenCalledWith({
      zustand: "fehler",
      code: "nicht_gefunden",
      meldung: "Q1 nicht lesbar",
    });
    // Ohne Abonnement bliebe die Leiste bis zum Neuaufbau tot; das naechste Ereignis
    // ist der erste belastbare Stand.
    expect(abos.hoertAuf(KANAELE.queue.geaendert)).toBe(true);
    expect(abos.hoertAuf(KANAELE.queue.stoerung)).toBe(true);
  });

  it("faengt ein werfendes Holen ab, statt die Leiste vom Bildschirm zu nehmen", async () => {
    const abos = abonnementeDoppel();
    attrappen.rufeAuf.mockRejectedValue(new Error("window.api fehlt"));
    const setzeSicht = vi.fn();

    expect(() => baueAuftragsSichtAuf(setzeSicht)).not.toThrow();
    await vi.waitFor(() => expect(setzeSicht).toHaveBeenCalled());

    const sicht = setzeSicht.mock.calls[0]?.[0] as { zustand: string; code: string };
    expect(sicht.zustand).toBe("fehler");
    expect(sicht.code).toBe("unbekannter_fehler");
    expect(abos.hoertAuf(KANAELE.queue.geaendert)).toBe(true);
  });

  it("zeigt eine Stoerung im selben Fehlerzustand an - Klartext, ohne den Stand zu leeren", async () => {
    const abos = abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();

    baueAuftragsSichtAuf(setzeSicht);
    await holen.antworte({ ok: true, wert: [auftrag("laeuft-gerade")] });

    abos.sende(
      KANAELE.queue.stoerung,
      "Der Stand der Warteschlange konnte nicht ermittelt werden.",
    );

    expect(setzeSicht).toHaveBeenLastCalledWith({
      zustand: "fehler",
      code: "unbekannter_fehler",
      meldung: "Der Stand der Warteschlange konnte nicht ermittelt werden.",
    });
    // Nie eine leere Liste: sie truege die Aussage „die Warteschlange ist leer" und
    // verdeckte einen laufenden Render.
    for (const [sicht] of setzeSicht.mock.calls) {
      expect(sicht).not.toEqual({ zustand: "geladen", auftraege: [] });
    }
  });

  it("schaltet ein noch laufendes Holen ab: kein setzeSicht, kein Abonnement", async () => {
    abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();

    const abbauen = baueAuftragsSichtAuf(setzeSicht);
    // Genau das Zeitfenster, wegen dem die Funktion synchron zurueckkehrt.
    abbauen();
    await holen.antworte({ ok: true, wert: [auftrag("a1")] });

    expect(setzeSicht).not.toHaveBeenCalled();
    expect(attrappen.abonniere).not.toHaveBeenCalled();
  });

  it("meldet jedes Abonnement genau einmal ab; danach kommt nichts mehr durch", async () => {
    const abos = abonnementeDoppel();
    const holen = angehaltenesHolen();
    const setzeSicht = vi.fn();

    const abbauen = baueAuftragsSichtAuf(setzeSicht);
    await holen.antworte({ ok: true, wert: [] });
    setzeSicht.mockClear();

    abbauen();
    // Zweiter und dritter Aufruf sind wirkungslos - React-Aufraeumfunktionen laufen in
    // der Entwicklung doppelt.
    expect(() => {
      abbauen();
      abbauen();
    }).not.toThrow();

    for (const [kanal, abmelden] of abos.abmeldungen) {
      expect(abmelden, kanal).toHaveBeenCalledTimes(1);
    }

    abos.sende(KANAELE.queue.geaendert, [auftrag("spaet")]);
    abos.sende(KANAELE.queue.stoerung, "spaete Stoerung");
    expect(setzeSicht).not.toHaveBeenCalled();
  });

  it("ueberlebt ein werfendes Abonnieren - ohne Wurf nach aussen, mit aufrufbarem Abbau", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const holen = angehaltenesHolen();
    attrappen.abonniere.mockImplementation(() => {
      throw new Error("Bruecke fehlt");
    });
    const setzeSicht = vi.fn();

    const abbauen = baueAuftragsSichtAuf(setzeSicht);
    await holen.antworte({ ok: true, wert: [auftrag("a1")] });

    // Die bereits gesetzte Sicht bleibt stehen ...
    expect(setzeSicht).toHaveBeenCalledTimes(1);
    expect(setzeSicht).toHaveBeenCalledWith({
      zustand: "geladen",
      auftraege: [auftrag("a1")],
    });
    // ... und der Abbau ist wirkungslos, aber aufrufbar.
    expect(() => abbauen()).not.toThrow();
  });
});
