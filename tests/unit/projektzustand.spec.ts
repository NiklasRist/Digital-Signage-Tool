// Verhaltenstests zu #121 - die gemeinsame Sicht auf das offene Projekt
// (TK 9.7.4, 9.7.3, 9.5.4, 9.1.1).
//
// Gegenstand ist ausschliesslich VERHALTEN: was nach einem Aufruf in der Sicht steht,
// wer benachrichtigt wird, was NICHT passiert. Kein Test wiederholt eine Deklaration.
//
// `rufeAuf` (#24) wird ersetzt, weil es an `window.api` haengt - die Bruecke gibt es
// im Testlauf nicht. Der Ersatz ist zugleich der Beweis: Wuerde die Datei den Main auf
// einem anderen Weg anfassen, faende der Spion nichts und die Zaehl-Tests fielen um.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Listenelement, Project } from "../../src/shared/contracts/project";
import { KANAELE } from "../../src/shared/contracts/kanaele";

const attrappen = vi.hoisted(() => ({ rufeAuf: vi.fn() }));

vi.mock("../../src/renderer/ipc-client/rufe-auf", () => ({
  rufeAuf: attrappen.rufeAuf,
}));

type Modul = typeof import("../../src/renderer/composer/projektzustand");

// Der Zustand dieser Datei ist modulweit und hat im Vertrag KEINE Zuruecksetzfunktion
// (`leereProjektSicht` leert die Sicht, nicht die Hoererliste). Ein frisches Modul je
// Test ist deshalb der einzige Weg zu einem wirklich unberuehrten Anfangszustand -
// dasselbe Muster nutzt hole-stand.spec.ts.
async function frisch(): Promise<Modul> {
  vi.resetModules();
  return await import("../../src/renderer/composer/projektzustand");
}

function element(id: string): Listenelement {
  return {
    id,
    art: "bild",
    ref: `asset-${id}`,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  };
}

function projekt(id: string, listenIds: string[] = []): Project {
  return {
    id,
    name: `Projekt ${id}`,
    erstelltAm: "2026-08-13T10:00:00.000Z",
    geaendertAm: "2026-08-13T10:00:00.000Z",
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: listenIds.map(element),
    letzterAusgabeName: null,
  };
}

/** Bringt die Sicht in den geladenen Zustand - der Ausgangspunkt der meisten Tests. */
async function mitGeladenemProjekt(
  vorbelegt: Project = projekt("p1", ["a", "b", "c"]),
): Promise<{ modul: Modul; geladen: Project }> {
  const modul = await frisch();
  attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: vorbelegt });
  await modul.ladeProjekt(vorbelegt.id);
  return { modul, geladen: vorbelegt };
}

beforeEach(() => {
  attrappen.rufeAuf.mockReset();
  // Die Warnungen der Ignorier-Pfade sind gewolltes Verhalten und werden einzeln
  // geprueft; hier wird nur der Testlauf leise gehalten.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ladeProjekt", () => {
  it("ruft genau einmal, auf dem Oeffnen-Kanal, mit der Nutzlast { id }", async () => {
    const modul = await frisch();
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt("p1") });

    await modul.ladeProjekt("p1");

    expect(attrappen.rufeAuf).toHaveBeenCalledTimes(1);
    expect(attrappen.rufeAuf).toHaveBeenCalledWith(KANAELE.project.öffneProjekt, { id: "p1" });
  });

  it("macht das gelieferte Projekt zur Sicht und laesst keinen Ladefehler stehen", async () => {
    const modul = await frisch();
    const geliefert = projekt("p1", ["a"]);
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: geliefert });

    const ergebnis = await modul.ladeProjekt("p1");

    // GENAU das gelieferte Projekt - keine Umformung, keine Kopie.
    expect(modul.holeSicht().projekt).toBe(geliefert);
    expect(modul.holeSicht().ladefehler).toBeNull();
    expect(ergebnis).toEqual({ ok: true, wert: geliefert });
  });

  it("uebernimmt bei ok:false den Code des Main WOERTLICH und laesst die Sicht stehen", async () => {
    const { modul, geladen } = await mitGeladenemProjekt();
    // Ein FACHLICHER Code des project-store - nicht einer der drei generischen. Genau
    // an ihm faellt auf, wenn diese Datei Codes umschreibt oder auf eine eigene Union
    // einengt.
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "projekt_beschaeftigt", meldung: "Ein Render laeuft." },
    });

    const ergebnis = await modul.ladeProjekt("p2");

    expect(modul.holeSicht().projekt).toBe(geladen);
    expect(modul.holeSicht().ladefehler).toEqual({
      code: "projekt_beschaeftigt",
      meldung: "Ein Render laeuft.",
    });
    // Durchgereicht, nicht in eine Ausnahme verwandelt.
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "projekt_beschaeftigt", meldung: "Ein Render laeuft." },
    });
  });

  it("raeumt einen alten Ladefehler beim naechsten geglueckten Laden weg", async () => {
    // Der Fall, den der Test darueber NICHT erwischt: dort ist die Sicht frisch, also
    // ist `ladefehler` ohnehin null. Erst mit einem VORHER gesetzten Fehler zeigt sich,
    // ob das Laden ihn wirklich leert - sonst stuende an der Oberflaeche neben dem
    // frisch geoeffneten Projekt eine Meldung ueber ein anderes, vergangenes Ereignis.
    const { modul } = await mitGeladenemProjekt();
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    await modul.ladeProjekt("p2");
    expect(modul.holeSicht().ladefehler).not.toBeNull();

    const spaeter = projekt("p3", ["x"]);
    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: spaeter });
    await modul.ladeProjekt("p3");

    expect(modul.holeSicht().projekt).toBe(spaeter);
    expect(modul.holeSicht().ladefehler).toBeNull();
  });

  it("weist eine leere projektId lokal ab - ohne IPC und ohne die Sicht anzufassen", async () => {
    const { modul, geladen } = await mitGeladenemProjekt();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);
    attrappen.rufeAuf.mockReset();

    for (const wert of ["", "   ", undefined as unknown as string]) {
      const ergebnis = await modul.ladeProjekt(wert);
      expect(ergebnis.ok).toBe(false);
      if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
    }

    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
    // Vollstaendig unberuehrt: kein Ladefehler, keine Benachrichtigung.
    expect(modul.holeSicht().projekt).toBe(geladen);
    expect(modul.holeSicht().ladefehler).toBeNull();
    expect(hoerer).not.toHaveBeenCalled();
  });
});

describe("setzeListe", () => {
  it("ersetzt die Liste vollstaendig und laesst einen frueher genommenen Stand unberuehrt", async () => {
    const { modul } = await mitGeladenemProjekt();
    const vorher = modul.holeSicht();

    modul.setzeListe([element("c"), element("a")]);

    expect(modul.holeSicht().projekt?.liste.map((e) => e.id)).toEqual(["c", "a"]);
    // DER KERN DER UNVERAENDERLICHKEIT: Der Rollback aus TK 9.7.3 haengt daran.
    expect(vorher.projekt?.liste.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("uebernimmt die Reihenfolge, wie sie kommt - auch unsortiert", async () => {
    const { modul } = await mitGeladenemProjekt();

    modul.setzeListe([element("z"), element("m"), element("a")]);

    expect(modul.holeSicht().projekt?.liste.map((e) => e.id)).toEqual(["z", "m", "a"]);
  });

  it("haelt die eigene Liste von spaeteren Aenderungen am uebergebenen Array frei", async () => {
    const { modul } = await mitGeladenemProjekt();
    const uebergeben = [element("a"), element("b")];

    modul.setzeListe(uebergeben);
    uebergeben.push(element("eingeschmuggelt"));

    expect(modul.holeSicht().projekt?.liste.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("wird ohne geladenes Projekt ignoriert - mit Warnung, ohne Wurf", async () => {
    const modul = await frisch();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);

    expect(() => modul.setzeListe([element("a")])).not.toThrow();

    expect(modul.holeSicht().projekt).toBeNull();
    expect(hoerer).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe("gleicheElementAb", () => {
  it("ersetzt an derselben Stelle und laesst die uebrigen Elemente in Ruhe", async () => {
    const { modul } = await mitGeladenemProjekt();
    const vorher = modul.holeSicht().projekt?.liste ?? [];
    const neu: Listenelement = { ...element("b"), dauer: 42 };

    modul.gleicheElementAb(neu);

    const nachher = modul.holeSicht().projekt?.liste ?? [];
    expect(nachher.map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(nachher[1]).toBe(neu);
    // Die anderen Eintraege sind dieselben Objekte - es wurde ersetzt, nicht neu gebaut.
    expect(nachher[0]).toBe(vorher[0]);
    expect(nachher[2]).toBe(vorher[2]);
    // Und der alte Stand traegt weiterhin das alte Element.
    expect(vorher[1]?.dauer).toBe(10);
  });

  it("baut ein unbekanntes Element NICHT ein", async () => {
    const { modul } = await mitGeladenemProjekt();
    const vorher = modul.holeSicht();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);

    modul.gleicheElementAb(element("gibt-es-nicht"));

    expect(modul.holeSicht()).toBe(vorher);
    expect(hoerer).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("wird ohne geladenes Projekt ignoriert", async () => {
    const modul = await frisch();

    expect(() => modul.gleicheElementAb(element("a"))).not.toThrow();

    expect(modul.holeSicht().projekt).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe("setzeProjekt", () => {
  it("ersetzt das ganze Projekt und laesst einen frueher genommenen Stand unberuehrt", async () => {
    const { modul, geladen } = await mitGeladenemProjekt();
    const vorher = modul.holeSicht();
    const neues = projekt("p1", ["x"]);

    modul.setzeProjekt(neues);

    expect(modul.holeSicht().projekt).toBe(neues);
    expect(vorher.projekt).toBe(geladen);
  });

  it("wird ohne geladenes Projekt ignoriert - kein Einstieg am Laden vorbei", async () => {
    const modul = await frisch();

    expect(() => modul.setzeProjekt(projekt("p9"))).not.toThrow();

    expect(modul.holeSicht().projekt).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe("leereProjektSicht", () => {
  it("nimmt Projekt UND Ladefehler zurueck", async () => {
    const { modul } = await mitGeladenemProjekt();
    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll." },
    });
    await modul.ladeProjekt("p2");
    // Ausgangslage: geladenes Projekt UND gesetzter Ladefehler.
    expect(modul.holeSicht().projekt).not.toBeNull();
    expect(modul.holeSicht().ladefehler).not.toBeNull();

    modul.leereProjektSicht();

    expect(modul.holeSicht().projekt).toBeNull();
    expect(modul.holeSicht().ladefehler).toBeNull();
  });

  it("benachrichtigt genau einmal - auch wenn nie ein Projekt geladen war", async () => {
    const modul = await frisch();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);

    modul.leereProjektSicht();

    expect(hoerer).toHaveBeenCalledTimes(1);
    expect(hoerer).toHaveBeenCalledWith({ projekt: null, ladefehler: null });
    // Kein Sonderfall, keine Warnung.
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("laesst einen vor dem Leeren genommenen Stand sein Projekt behalten", async () => {
    const { modul, geladen } = await mitGeladenemProjekt();
    const vorher = modul.holeSicht();

    modul.leereProjektSicht();

    expect(vorher.projekt).toBe(geladen);
    expect(modul.holeSicht().projekt).toBeNull();
  });

  it("fasst den Main nicht an und erfindet kein Ersatzprojekt", async () => {
    const { modul } = await mitGeladenemProjekt();
    attrappen.rufeAuf.mockReset();

    modul.leereProjektSicht();

    expect(attrappen.rufeAuf).not.toHaveBeenCalled();
    // Kein leeres Projekt mit erfundener Kennung (TK 9.7.4, ausdrueckliches Verbot).
    expect(modul.holeSicht().projekt).toBeNull();
  });
});

describe("aufSichtGeaendert", () => {
  it("meldet jede der drei Setz-Funktionen genau einmal", async () => {
    const { modul } = await mitGeladenemProjekt();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);

    modul.setzeListe([element("a")]);
    expect(hoerer).toHaveBeenCalledTimes(1);

    modul.gleicheElementAb({ ...element("a"), dauer: 20 });
    expect(hoerer).toHaveBeenCalledTimes(2);

    modul.setzeProjekt(projekt("p1", ["q"]));
    expect(hoerer).toHaveBeenCalledTimes(3);

    // Der Hoerer sieht den NEUEN Stand, nicht den davor.
    expect(hoerer).toHaveBeenLastCalledWith(modul.holeSicht());
  });

  it("meldet auch das Laden - erfolgreich wie abgelehnt", async () => {
    const modul = await frisch();
    const hoerer = vi.fn();
    modul.aufSichtGeaendert(hoerer);

    attrappen.rufeAuf.mockResolvedValueOnce({ ok: true, wert: projekt("p1") });
    await modul.ladeProjekt("p1");
    expect(hoerer).toHaveBeenCalledTimes(1);

    attrappen.rufeAuf.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: "weg" },
    });
    await modul.ladeProjekt("p2");
    expect(hoerer).toHaveBeenCalledTimes(2);
  });

  it("beendet die Benachrichtigungen beim Abmelden - und nur die eigenen", async () => {
    const { modul } = await mitGeladenemProjekt();
    const bleibt = vi.fn();
    const geht = vi.fn();
    modul.aufSichtGeaendert(bleibt);
    const abmelden = modul.aufSichtGeaendert(geht);

    abmelden();
    // Zweiter Aufruf darf keinen fremden Hoerer mitnehmen.
    abmelden();
    modul.setzeListe([element("a")]);

    expect(geht).not.toHaveBeenCalled();
    expect(bleibt).toHaveBeenCalledTimes(1);
  });

  it("nimmt bei doppelt aufgerufener Abmeldung kein zweites Abo derselben Funktion mit", async () => {
    const { modul } = await mitGeladenemProjekt();
    const hoerer = vi.fn();
    // ZWEIMAL dieselbe Funktion - der Fall, in dem eine nicht abgesicherte Abmeldung
    // beim zweiten Aufruf das FREMDE Abo entfernt.
    const abmeldenA = modul.aufSichtGeaendert(hoerer);
    modul.aufSichtGeaendert(hoerer);

    abmeldenA();
    abmeldenA();
    modul.setzeListe([element("a")]);

    expect(hoerer).toHaveBeenCalledTimes(1);
  });

  it("ueberspringt niemanden, wenn sich ein Hoerer waehrend der Meldung abmeldet", async () => {
    const { modul } = await mitGeladenemProjekt();
    const spaeter = vi.fn();
    const abmelden = modul.aufSichtGeaendert(() => abmelden());
    modul.aufSichtGeaendert(spaeter);

    modul.setzeListe([element("a")]);

    expect(spaeter).toHaveBeenCalledTimes(1);
  });

  it("laesst einen werfenden Hoerer weder die uebrigen noch den Aufrufer treffen", async () => {
    const { modul } = await mitGeladenemProjekt();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const danach = vi.fn();
    modul.aufSichtGeaendert(() => {
      throw new Error("Fehler in der Oberflaeche");
    });
    modul.aufSichtGeaendert(danach);

    expect(() => modul.setzeListe([element("a")])).not.toThrow();

    expect(danach).toHaveBeenCalledTimes(1);
    expect(modul.holeSicht().projekt?.liste.map((e) => e.id)).toEqual(["a"]);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

describe("Bauform der Datei (Grep-Proben der DoD)", () => {
  const quelle = readFileSync(
    new URL("../../src/renderer/composer/projektzustand.ts", import.meta.url),
    "utf8",
  );

  it("bildet keinen Kanalnamen selbst und umgeht den ipc-client nicht", () => {
    // Kanalnamen kommen aus KANAELE (#25) - nie als Literal. Der gesuchte Text wird
    // ZUSAMMENGESETZT, damit diese Testdatei nicht selbst zum Treffer wird, wenn
    // jemand die Probe von aussen als Grep ueber das Repo wiederholt.
    expect(quelle).not.toContain(`${"project"}:`);
    for (const verboten of ["window.api", "ipcRenderer"]) {
      expect(quelle).not.toContain(verboten);
    }
    // Node-Bausteine: geprueft wird der Import, nicht das blosse Vorkommen der zwei
    // Buchstaben "fs" - sonst schlaegt die Probe auf jedem Wort an, das sie enthaelt.
    expect(quelle).not.toMatch(/from\s+['"](node:)?(fs|path|os|child_process)['"]/);
    expect(quelle).not.toMatch(/require\(\s*['"](node:)?(fs|path|os|child_process)['"]/);
  });

  it("sortiert nirgends", () => {
    // "Angezeigte Reihenfolge = gerenderte Reihenfolge" (TK 9.7.4).
    expect(quelle).not.toContain(".sort(");
  });

  it("baut nirgends selbst ein Projekt zusammen", () => {
    expect(quelle).not.toContain("crypto.randomUUID");
    expect(quelle).not.toContain("aktionen: []");
  });
});
