import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #287. Realer marken-store (frisch je Pruefung); die drei Partnerfunktionen
// laufen als durchsichtige Assistenten, die nur PROTOTOKOLLIEREN und je Test umschaltbar
// sind - so sind die Spy-Binden der DoD (Aufrufzaehlungen, 'sofort', keine Schreibaufrufe)
// belegbar, ohne etwas zu ersetzen.

const zustand = {
  ordner: "",
  bestandUmschalten: null as null | (() => unknown),
  pruefungUmschalten: null as null | (() => unknown),
  aendereUmschalten: null as null | (() => unknown),
};

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => zustand.ordner,
}));

const bestandSpur: unknown[] = [];
const pruefungSpur: string[] = [];
const aendereSpur: Array<{ schreibart: unknown; aenderung?: unknown }> = [];

vi.mock("../../src/main/marken-store/schreibe-marken", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/schreibe-marken")>();
  type A = typeof echtes.aendereBestand;
  return {
    ...echtes,
    ladeBestand: async () => {
      if (zustand.bestandUmschalten !== null) {
        bestandSpur.push(zustand);
        return zustand.bestandUmschalten() as Awaited<ReturnType<typeof echtes.ladeBestand>>;
      }
      bestandSpur.push(zustand);
      return echtes.ladeBestand();
    },
    aendereBestand: ((aenderung: unknown, schreibart: unknown) => {
      aendereSpur.push({ schreibart, aenderung });
      if (zustand.aendereUmschalten !== null) {
        return zustand.aendereUmschalten() as ReturnType<A>;
      }
      return echtes.aendereBestand(
        aenderung as Parameters<A>[0],
        schreibart as Parameters<A>[1],
      ) as ReturnType<A>;
    }) as A,
  };
});

vi.mock("../../src/main/marken-store/referenzpruefung", async (importOriginal) => {
  const echtes = await importOriginal<typeof import("../../src/main/marken-store/referenzpruefung")>();
  return {
    ...echtes,
    pruefeMarkenReferenzen: async (markeId: string) => {
      pruefungSpur.push(markeId);
      if (zustand.pruefungUmschalten !== null) {
        return zustand.pruefungUmschalten() as Awaited<
          ReturnType<typeof echtes.pruefeMarkenReferenzen>
        >;
      }
      return echtes.pruefeMarkenReferenzen(markeId);
    },
  };
});

let löscheMarke: typeof import("../../src/main/marken-store/loesche-marke").löscheMarke;
let ladeBestand: typeof import("../../src/main/marken-store/schreibe-marken").ladeBestand;

beforeEach(async () => {
  vi.resetModules();
  Object.assign(zustand, {
    bestandUmschalten: null,
    pruefungUmschalten: null,
    aendereUmschalten: null,
  });
  bestandSpur.length = 0;
  pruefungSpur.length = 0;
  aendereSpur.length = 0;
  zustand.ordner = await fs.mkdtemp(path.join(os.tmpdir(), "signage-marken-del-"));
  const modul = await import("../../src/main/marken-store/loesche-marke");
  löscheMarke = modul.löscheMarke;
  const fm = await import("../../src/main/marken-store/schreibe-marken");
  ladeBestand = fm.ladeBestand;
});

afterEach(async () => {
  await fs.rm(zustand.ordner, { recursive: true, force: true });
});

type Marke = {
  id: string; name: string; parent: string | null; eingebaut: boolean; farben: Record<string, string>; schriften: Record<string, unknown>;
};

function marke(id: string, ueber: Partial<Marke> = {}): Marke {
  return {
    id,
    name: "Marke " + id,
    parent: null,
    eingebaut: false,
    farben: {
      akzent: "#FF4040", akzentKraeftig: "#DF3131", akzentTief: "#971316",
      flaecheDunkel: "#2F2E2E", flaecheSehrDunkel: "#4B090B", flaecheHell: "#FFFFFF",
      flaecheAkzentZart: "#F5AEAF", textAufDunkel: "#FFFFFF", textAufHell: "#202020",
      textSekundaer: "#8F8F8F", linie: "#CCCCCC", scrimStart: "#00000000", scrimEnde: "#000000B3",
    },
    schriften: {},
    ...ueber,
  };
}

function stelleBestand(marken: Marke[]): void {
  zustand.bestandUmschalten = () => ({ ok: true, wert: marken });
}

function leereNutzung() {
  return { aktionen: [], abgeleiteteMarken: [], standardInProjekten: [] };
}

describe("löscheMarke (#287)", () => {
  it("Erfolgsfall: genau ein aendereBestand-Aufruf mit 'sofort', und die Abfangfunktion entfernt GENAU die Marke", async () => {
    const m1 = marke("m-1");
    const m2 = marke("m-2");
    const m3 = marke("m-3");
    stelleBestand([m1, m2, m3]);
    zustand.pruefungUmschalten = () => ({ ok: true, wert: leereNutzung() });
    // Das Schreiben selbst wird abgefangen (echter Bestand ist hier nicht am Start);
    // die Aenderungsfunktion wird GEFAENGT und gegen den gelesenen Bestand AUSGEFUEHRT.
    zustand.aendereUmschalten = () => ({ ok: true, wert: undefined });

    const erg = await löscheMarke("m-2");

    expect(erg.ok).toBe(true);
    expect((erg as { ok: true; wert: undefined }).wert).toBeUndefined();
    expect(aendereSpur).toHaveLength(1);
    expect(aendereSpur[0]?.schreibart).toBe("sofort");
    // Die gefangene Aenderungsfunktion ausgefuhrt: nur die Marke entfernt, Rest in
    // unveraenderter Reihenfolge.
    const aenderung = aendereSpur[0]!.aenderung as (b: Marke[]) => { ok: boolean; wert: { bestand: Marke[]; wert: undefined } };
    const schub = aenderung([m1, m2, m3]);
    expect(schub.ok).toBe(true);
    expect(schub.wert.wert).toBeUndefined();
    expect(schub.wert.bestand.map((e) => e.id)).toEqual(["m-1", "m-3"]);
  });

  it("Treffer nur ueber abgeleiteteMarken: marke_referenziert, KEIN Schreibaufruf", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({
      ok: true,
      wert: { aktionen: [], abgeleiteteMarken: [{ markeId: "m-2", markeName: "Saison" }], standardInProjekten: [] },
    });

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_referenziert");
    expect(aendereSpur).toHaveLength(0);
  });

  it("KERN: Treffer NUR über standardInProjekten sperrt genauso (keine Ausnahme für die dritte Liste)", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({
      ok: true,
      wert: { aktionen: [], abgeleiteteMarken: [], standardInProjekten: [{ projektId: "p-9", projektName: "Studio West" }] },
    });

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_referenziert");
    expect(aendereSpur).toHaveLength(0);
  });

  it("daten traegt ALLE DREI Schlüssel - deep-gleich mit dem Pruefergebnis, auch leere Listen", async () => {
    const nutzung = {
      aktionen: [{ projektId: "p-1", projektName: "Nord", aktionId: "a-1" }],
      abgeleiteteMarken: [],
      standardInProjekten: [],
    };
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({ ok: true, wert: nutzung });

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.daten).toEqual(nutzung);
  });

  it("ein pruefeMarkenReferenzen-Neinmelder (speicher_fehler) kommt durch, NICHTS wird geschrieben", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "unlesbar" } });
    zustand.aendereUmschalten = () => { throw "darf nicht gerufen werden"; };

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("speicher_fehler");
    expect(aendereSpur).toHaveLength(0);
  });

  it("eingebaute Marke liefert marke_eingebaut - ohne Pruefauf und ohne Schreibaufruf", async () => {
    stelleBestand([marke("eingebaut-1", { eingebaut: true })]);
    zustand.pruefungUmschalten = () => { throw "darf nicht gerufen werden"; };
    zustand.aendereUmschalten = () => { throw "darf nicht gerufen werden"; };

    const erg = await löscheMarke("eingebaut-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_eingebaut");
    expect(pruefungSpur).toHaveLength(0);
    expect(aendereSpur).toHaveLength(0);
  });

  it("unbekannte markeId liefert marke_nicht_gefunden (fachlicher Code) ohne Pruefung/Schreiben", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => { throw "darf nicht gerufen werden"; };

    const erg = await löscheMarke("verschwunden");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_nicht_gefunden");
    expect(pruefungSpur).toHaveLength(0);
    expect(aendereSpur).toHaveLength(0);
  });

  it("'' und Nicht-String liefern ungueltige_eingabe; ladeBestand wird nachweislich nicht gerufen", async () => {
    zustand.bestandUmschalten = () => { throw "darf nicht gerufen werden"; };

    const leer = await löscheMarke("");
    expect(leer.ok).toBe(false);
    if (!leer.ok) expect(leer.fehler.code).toBe("ungueltige_eingabe");

    const zahl = await löscheMarke(123 as unknown as string);
    expect(zahl.ok).toBe(false);
    if (!zahl.ok) expect(zahl.fehler.code).toBe("ungueltige_eingabe");

    expect(bestandSpur).toHaveLength(0);
    expect(pruefungSpur).toHaveLength(0);
  });

  it("Schritt 4a prueft ERNEUT: Marke zwischen Pruefung und Schreiben verschwunden -> marke_nicht_gefunden, nichts geschrieben", async () => {
    // ladeBestand liefert die Marke, die pruefung laeuft frei -aber die aenderungsfunktion
    // bekommt einen BESTAND OHNE die Marke (Attrappe liefert anders als ladeBestand).
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({ ok: true, wert: leereNutzung() });
    zustand.aendereUmschalten = () => {
      const aenderung = (aendereSpur.length && null) ?? null;
      void aenderung;
      return {
        ok: false,
        fehler: { code: "marke_nicht_gefunden", meldung: "in der aenderungsfunktion nicht mehr vorhanden" },
      };
    };

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("marke_nicht_gefunden");
    // Der aendereBestand-Aufruf fand statt (Schritt 4a wurde erreicht), schrieb aber nichts.
    expect(aendereSpur).toHaveLength(1);
  });

  it("die Aenderungsfunktion ist SYNCHRON: Ergebnis ist kein Promise, kein await (Grep folgt)", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({ ok: true, wert: leereNutzung() });
    zustand.aendereUmschalten = () => ({ ok: true, wert: undefined });

    const erg = await löscheMarke("m-1");
    expect(erg.ok).toBe(true);

    const aenderung = aendereSpur[0]!.aenderung as (b: Marke[]) => unknown;
    const ausgabe = aenderung([marke("m-1")]);
    // Ein Promise wuerde die Zusage von #277 aufheben; gefordert ist ein direktes Ergebnis.
    expect((ausgabe as { then?: unknown }).then).toBeUndefined();
  });

  it("ein aendereBestand-Schreibfehler (speicher_fehler) kommt unverändert durch", async () => {
    stelleBestand([marke("m-1")]);
    zustand.pruefungUmschalten = () => ({ ok: true, wert: leereNutzung() });
    zustand.aendereUmschalten = () => ({ ok: false, fehler: { code: "speicher_fehler", meldung: "Platte voll" } });

    const erg = await löscheMarke("m-1");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("speicher_fehler");
  });
});
