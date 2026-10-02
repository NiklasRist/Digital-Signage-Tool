// Verhaltenstests zu #191 - die Anmeldung des Export-Kanals und die Weitergabe des
// Render-Fortschritts an das eine Fenster.
//
// GEMOCKT ist `electron` (wie in ipc-verdrahtung.spec.ts und registriere-handler.spec.ts),
// die Operation `wähleExportZiel` (#183) und die Hoerer-Registrierung
// `aufRenderFortschritt` (#178). Der Wrapper `registriereHandler` (#23) ist als Spy
// gemockt, der an die ECHTE Fassung DELEGIERT: Nur so laesst sich zugleich zaehlen, wie
// oft er gerufen wurde (DoD-Punkt 1), und pruefen, was der registrierte Kanal
// tatsaechlich antwortet (DoD-Punkte 2 und 3) - ein reiner Spy ohne Rumpf registrierte
// gar nichts, ein reiner Durchlauf ohne Spy waere nicht zaehlbar.
//
// NICHT gemockt ist `nutzlast-pruefer` (#332): `ohneNutzlast` ist der Pruefer, dessen
// Verhalten DoD-Punkt 3 ausdruecklich abnimmt.
//
// DASS DIE MOCK-SIGNATUREN ZU DEN GEBAUTEN DATEIEN PASSEN, prueft nicht dieser Test,
// sondern `npm run typecheck`: src/main/ipc-gateway/export-verdrahtung.ts importiert die
// ECHTEN Module, ein abweichender Hoerer-Typ oder Rueckgabewert waere dort ein
// Uebersetzungsfehler.
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowserWindow } from "electron";

import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import { KANAELE } from "../../src/shared/contracts/kanaele";
import type { RenderProgress } from "../../src/shared/contracts/render-progress";

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>;

const angemeldet = new Map<string, Hoerer>();
const doppelt: string[] = [];

vi.mock("electron", () => ({
  ipcMain: {
    handle: (kanal: string, hoerer: Hoerer) => {
      // `ipcMain.handle` wirft im Betrieb bei einer zweiten Anmeldung desselben Kanals.
      // Der Mock ueberschreibt nur - deshalb wird der Fall hier mitgeschrieben.
      if (angemeldet.has(kanal)) doppelt.push(kanal);
      angemeldet.set(kanal, hoerer);
    },
  },
}));

const spione = vi.hoisted(() => ({
  registriereHandler: vi.fn(),
  wähleExportZiel: vi.fn(),
  aufRenderFortschritt: vi.fn(),
  abmelden: vi.fn(),
}));

vi.mock("../../src/main/ipc-gateway/registriere-handler", async (echtLaden) => {
  const echt =
    await echtLaden<typeof import("../../src/main/ipc-gateway/registriere-handler")>();
  // DELEGIEREND, nicht ersetzend: Der Spy zaehlt, die echte Fassung registriert. Die
  // Implementierung ueberlebt `vi.clearAllMocks()` (das raeumt nur Aufrufe, nicht
  // Implementierungen ab) - `vi.resetAllMocks()` waere hier falsch.
  spione.registriereHandler.mockImplementation(echt.registriereHandler);
  return { registriereHandler: spione.registriereHandler };
});

vi.mock("../../src/main/export-service/ziel-dialog", () => ({
  wähleExportZiel: spione.wähleExportZiel,
}));

/** Die Hoerer, die sich ueber die gemockte Registrierung angemeldet haben. */
const fortschrittsHoerer: Array<(fortschritt: RenderProgress) => void> = [];

vi.mock("../../src/main/render-service/fortschritt", () => ({
  aufRenderFortschritt: spione.aufRenderFortschritt,
}));

spione.aufRenderFortschritt.mockImplementation(
  (hoerer: (fortschritt: RenderProgress) => void) => {
    fortschrittsHoerer.push(hoerer);
    return spione.abmelden;
  },
);

const { verdrahteExportUndFortschrittIPC } = await import(
  "../../src/main/ipc-gateway/export-verdrahtung"
);

type FensterDoppel = {
  webContents: { send: ReturnType<typeof vi.fn> };
  zerstoere: () => void;
  belebe: () => void;
  schliesse: () => void;
};

/** Ein BrowserWindow-Doppel; Electron wird nicht gestartet. */
function baueFenster(): FensterDoppel & BrowserWindow {
  const beimSchliessen: Array<() => void> = [];
  let zerstoert = false;
  const doppel = {
    webContents: { send: vi.fn() },
    isDestroyed: () => zerstoert,
    once(ereignis: string, hoerer: () => void) {
      if (ereignis === "closed") beimSchliessen.push(hoerer);
      return doppel;
    },
    zerstoere: () => {
      zerstoert = true;
    },
    // Nur fuer den Test: Er muss zeigen koennen, dass der Hoerer NACH einer verworfenen
    // Meldung die naechste wieder normal verarbeitet.
    belebe: () => {
      zerstoert = false;
    },
    schliesse: () => {
      zerstoert = true;
      for (const hoerer of beimSchliessen) hoerer();
    },
  };
  return doppel as unknown as FensterDoppel & BrowserWindow;
}

// ---------------------------------------------------------------------------------
// DER BLOSSE IMPORT DARF NICHTS GETAN HABEN (DoD: "Der Modulimport allein registriert
// nichts"). Festgehalten VOR dem ersten Aufruf.
// ---------------------------------------------------------------------------------
const kanaeleVorAufruf = [...angemeldet.keys()];
const wrapperAufrufeVorAufruf = spione.registriereHandler.mock.calls.length;
const abosVorAufruf = spione.aufRenderFortschritt.mock.calls.length;

const fenster = baueFenster();
verdrahteExportUndFortschrittIPC(fenster);

// Festgehalten VOR den Tests weiter unten: die verdrahten eigene Fenster und melden den
// Kanal dabei erneut an (im Betrieb unmoeglich, hier der Preis fuer isolierte Tests).
// Diese Aufnahmen beschreiben deshalb den EINEN Aufruf oben.
const kanaeleNachAufruf = [...angemeldet.keys()];
const doppeltNachAufruf = [...doppelt];
const wrapperAufrufeNachAufruf = spione.registriereHandler.mock.calls.length;
const wrapperKanalNachAufruf = spione.registriereHandler.mock.calls[0]?.[0];
const abosNachAufruf = spione.aufRenderFortschritt.mock.calls.length;

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

/** Verdrahtet ein frisches Fenster und liefert es samt seinem Fortschritts-Hoerer. */
function frischVerdrahtet(): {
  fenster: FensterDoppel & BrowserWindow;
  melde: (fortschritt: RenderProgress) => void;
} {
  const eigenes = baueFenster();
  const vorher = fortschrittsHoerer.length;
  verdrahteExportUndFortschrittIPC(eigenes);
  const hoerer = fortschrittsHoerer[vorher];
  if (hoerer === undefined) throw new Error("Kein Fortschritts-Hoerer angemeldet.");
  return { fenster: eigenes, melde: hoerer };
}

/** Eine Nutzlast, wie sie #178 baut - alle sechs Felder, sonst nichts. */
function baueFortschritt(prozent: number): RenderProgress {
  return {
    renderId: "r-1",
    phase: "normalisieren",
    elementIndex: 0,
    elementAnzahl: 3,
    elementId: "el-1",
    prozent,
  };
}

const ZIEL: Ergebnis<{ pfad: string | null }> = { ok: true, wert: { pfad: "D:\\stick" } };

beforeEach(() => {
  vi.clearAllMocks();
  spione.wähleExportZiel.mockResolvedValue(ZIEL);
});

describe("verdrahteExportUndFortschrittIPC (#191) - der Aufrufkanal", () => {
  it("meldet GENAU EINEN Kanal an, und zwar den aus der Registry", () => {
    expect(kanaeleNachAufruf).toEqual([KANAELE.export.wähleExportZiel]);
    expect(doppeltNachAufruf).toEqual([]);
  });

  it("ruft registriereHandler (#23) genau einmal, mit dem Registry-Namen", () => {
    expect(wrapperAufrufeNachAufruf - wrapperAufrufeVorAufruf).toBe(1);
    expect(wrapperKanalNachAufruf).toBe(KANAELE.export.wähleExportZiel);
  });

  it("meldet insbesondere KEINEN Kanal fuer renderReel, cancelRender, export oder listeAusgaben an", () => {
    // Alle vier laufen anderswo: `render` und `export` als AUFTRAG ueber `reiheEin`
    // (TK 9.3.4), der Abbruch ueber `entferne` (#62), `listeAusgaben` ueber #76. Ein
    // Kanal hier waere je ein zweiter Weg an der einzigen Serialisierung des Systems
    // bzw. am einzigen Abbruchweg vorbei.
    expect(kanaeleNachAufruf).toHaveLength(1);
  });

  it("gibt das Ergebnis von wähleExportZiel (#183) REFERENZGLEICH zurueck", async () => {
    const antwort = await rufe(KANAELE.export.wähleExportZiel);

    expect(spione.wähleExportZiel).toHaveBeenCalledTimes(1);
    // `toBe`, nicht `toEqual`: Es wird nichts neu verpackt, nichts kopiert, nichts
    // ausgepackt. Eine Umformung faellt bei `toEqual` gerade NICHT auf.
    expect(antwort).toBe(ZIEL);
  });

  it("reicht auch den Abbruch (pfad: null) als ok:true durch - er ist kein Fehler", async () => {
    const abbruch: Ergebnis<{ pfad: string | null }> = { ok: true, wert: { pfad: null } };
    spione.wähleExportZiel.mockResolvedValue(abbruch);

    expect(await rufe(KANAELE.export.wähleExportZiel)).toBe(abbruch);
  });

  it("reicht ok:false der Operation unveraendert durch und erfindet keinen eigenen Code", async () => {
    const fehlschlag: Ergebnis<{ pfad: string | null }> = {
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "Dialog kaputt" },
    };
    spione.wähleExportZiel.mockResolvedValue(fehlschlag);

    expect(await rufe(KANAELE.export.wähleExportZiel)).toBe(fehlschlag);
  });

  it("ruft die Operation OHNE Argument - die validierte Nutzlast wird nicht durchgereicht", async () => {
    await rufe(KANAELE.export.wähleExportZiel, { irgendwas: 1 });

    expect(spione.wähleExportZiel).toHaveBeenCalledWith();
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["ein Objekt", { irgendwas: 1 }],
    ["ein Array", [1, 2]],
    ["eine Zahl", 42],
  ])("ignoriert eine mitgeschickte Nutzlast (%s), statt sie abzulehnen", async (_name, nutzlast) => {
    const antwort = (await rufe(KANAELE.export.wähleExportZiel, nutzlast)) as Ergebnis<{
      pfad: string | null;
    }>;

    expect(antwort).toBe(ZIEL);
    expect(spione.wähleExportZiel).toHaveBeenCalledTimes(1);
    // Ausdruecklich: KEIN `ungueltige_eingabe`. Ein Aufruf ohne Argumente darf nicht
    // daran scheitern, dass ein Aufrufer etwas mitschickt (Pruef-Tabelle des Issues,
    // gleiche Regelung wie `queue:holeStand` in #71).
    expect(antwort.ok).toBe(true);
  });
});

describe("verdrahteExportUndFortschrittIPC (#191) - das Ereignis", () => {
  it("abonniert aufRenderFortschritt (#178) genau einmal", () => {
    expect(abosNachAufruf - abosVorAufruf).toBe(1);
  });

  it("sendet die Meldung REFERENZGLEICH auf render:fortschritt", () => {
    const { fenster: eigenes, melde } = frischVerdrahtet();
    const meldung = baueFortschritt(42);

    melde(meldung);

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
    expect(eigenes.webContents.send).toHaveBeenCalledWith(KANAELE.render.fortschritt, meldung);
    // Das GLEICHE Objekt, nicht ein gleich aussehendes: keine Kopie, keine Huelle, kein
    // Umbau. `toHaveBeenCalledWith` allein prueft nur strukturelle Gleichheit.
    expect(eigenes.webContents.send.mock.calls[0]?.[1]).toBe(meldung);
  });

  it("verpackt NICHT in die Ergebnis-Huelle und ergaenzt kein Feld", () => {
    const { fenster: eigenes, melde } = frischVerdrahtet();
    const meldung = baueFortschritt(7);

    melde(meldung);

    const gesendet = eigenes.webContents.send.mock.calls[0]?.[1] as Record<string, unknown>;
    // Waere es verpackt, laese der Abonnent (#151) `nutzlast.prozent` und faende
    // `undefined` - der Balken bewegte sich nie, ohne dass etwas eine Fehlermeldung
    // erzeugt. Deshalb wird hier auf `ok`/`wert` ausdruecklich geprueft.
    expect(gesendet).not.toHaveProperty("ok");
    expect(gesendet).not.toHaveProperty("wert");
    expect(Object.keys(gesendet).sort()).toEqual([
      "elementAnzahl",
      "elementId",
      "elementIndex",
      "phase",
      "prozent",
      "renderId",
    ]);
  });

  it("sendet jede Meldung einzeln weiter - keine Drosselung, kein Zusammenfassen", () => {
    const { fenster: eigenes, melde } = frischVerdrahtet();

    // Drei Meldungen im selben Millisekunden-Fenster. Die Drosselung ist Vertrag des
    // SENDERS (#178, TK 9.2.7); eine zweite hier verschluckte Ereignisse, die der Sender
    // bewusst geschickt hat.
    melde(baueFortschritt(1));
    melde(baueFortschritt(2));
    melde(baueFortschritt(3));

    expect(eigenes.webContents.send).toHaveBeenCalledTimes(3);
    expect(
      eigenes.webContents.send.mock.calls.map((aufruf) => (aufruf[1] as RenderProgress).prozent),
    ).toEqual([1, 2, 3]);
  });

  it("sendet bei zerstoertem Fenster NICHT und wirft NICHT - der Hoerer bleibt angemeldet", () => {
    const { fenster: eigenes, melde } = frischVerdrahtet();

    eigenes.zerstoere();
    expect(() => {
      melde(baueFortschritt(10));
    }).not.toThrow();
    expect(eigenes.webContents.send).not.toHaveBeenCalled();

    // Und die NAECHSTE Meldung wird wieder normal verarbeitet: Der Hoerer wurde nicht
    // abgemeldet und hat sich nichts gemerkt.
    eigenes.belebe();
    melde(baueFortschritt(11));
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(1);
  });

  it("wirft nicht, wenn webContents.send wirft - und der Hoerer bleibt funktionsfaehig", () => {
    const { fenster: eigenes, melde } = frischVerdrahtet();
    eigenes.webContents.send.mockImplementationOnce(() => {
      throw new Error("Renderer-Prozess weg");
    });
    const stumm = vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Eine Ausnahme von hier liefe in den Sende-Pfad des render-service zurueck und
    // koennte einen laufenden Render zum Stehen bringen.
    expect(() => {
      melde(baueFortschritt(20));
    }).not.toThrow();
    expect(stumm).toHaveBeenCalledTimes(1);

    melde(baueFortschritt(21));
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(2);

    stumm.mockRestore();
  });

  it("meldet den Hoerer ab, wenn das Fenster geschlossen ist", () => {
    const { fenster: eigenes } = frischVerdrahtet();

    expect(spione.abmelden).not.toHaveBeenCalled();
    eigenes.schliesse();
    expect(spione.abmelden).toHaveBeenCalledTimes(1);
  });
});

describe("verdrahteExportUndFortschrittIPC (#191) - Import ohne Wirkung", () => {
  it("hat beim blossen Import nichts registriert und nichts abonniert", () => {
    expect(kanaeleVorAufruf).toEqual([]);
    expect(wrapperAufrufeVorAufruf).toBe(0);
    expect(abosVorAufruf).toBe(0);
  });
});

describe("Kanal-Registry (#25) nach der Ergaenzung durch #191", () => {
  it("traegt die zwei neuen Namen zeichengleich", () => {
    expect(KANAELE.export.wähleExportZiel).toBe("export:wähleExportZiel");
    expect(KANAELE.render.fortschritt).toBe("render:fortschritt");
  });

  it("laesst die vorhandenen Bloecke unveraendert", () => {
    // Der DoD-Punkt nennt fuenf Bloecke - `queue`, `project`, `config`, `media`,
    // `vorlagen`. GEBAUT sind VIER: `vorlagen` gibt es in der Registry noch nicht, weil
    // #109 (vorlagen-Verdrahtung) offen ist. Geprueft wird deshalb, was existiert; die
    // Abweichung ist gemeldet.
    //
    // Und geprueft wird nicht nur "vorhanden", sondern die vollstaendige Schluesselliste:
    // Ein Umsortieren oder "Aufraeumen" der Registry wuerde mit den Tests fremder Issues
    // kollidieren, ein stilles Umbenennen faende eine Existenzpruefung nicht.
    expect(Object.keys(KANAELE.queue).sort()).toEqual([
      "entferne",
      "geaendert",
      "holeStand",
      "reiheEin",
      "stoerung",
      "wiederhole",
    ]);
    // 14 -> 16 am 15.08.2026: #153 traegt `setzeEinblendung` und `setzeElementReferenz` in
    // den project-Block nach (im Registry-Kommentar seit #76 vorgesehen). Diese Probe soll
    // zeigen, dass die Verdrahtung des export-service die Registry nicht umbaut - sie darf
    // nicht daran scheitern, dass ein anderes Issue seine eigenen Kanäle ergänzt.
    // 16 -> 17 am 20.08.2026: #238 traegt das ERREIGNIS `autoSpeichernStatus` nach.
    // 17 -> 18 am 23.08.2026: #334 traegt den Kanal `setzeStandardSegmentdauer` nach.
    // 18 -> 20 am 02.10.2026: #240 wird nachgetragen (setzeBearbeitungsstand,
    // öffneProjektordner) und der gerade gekennzeichnete Zustand gelangt damit in den Verdrag.
    expect(Object.keys(KANAELE.project)).toHaveLength(20);
    expect(KANAELE.project.setzeBearbeitungsstand).toBe("project:setzeBearbeitungsstand");
    expect(KANAELE.project.öffneProjektordner).toBe("project:öffneProjektordner");
    expect(KANAELE.project.listeAusgaben).toBe("project:listeAusgaben");
    expect(Object.keys(KANAELE.config).sort()).toEqual([
      "leseKonfig",
      "leseMarke",
      "setzeAktivesProjekt",
      "setzeExportZiel",
      "setzeUIVoreinstellung",
    ]);
    expect(Object.keys(KANAELE.media)).toEqual(["öffneMedienDialog"]);
  });

  it("haelt die Regel <modul>:<operation> auch fuer die zwei neuen Bloecke ein", () => {
    for (const [modul, operationen] of Object.entries(KANAELE)) {
      for (const [operation, kanal] of Object.entries(operationen)) {
        expect(kanal).toBe(`${modul}:${operation}`);
      }
    }
  });
});

describe("export-verdrahtung.ts - Codeinspektion", () => {
  it("enthaelt keinen Kanalnamen als String-Literal", () => {
    const quelle = readFileSync("src/main/ipc-gateway/export-verdrahtung.ts", "utf8");
    const ohneKommentare = quelle
      // ZUERST die Zeilenenden vereinheitlichen, und das ist NICHT kosmetisch:
      // `core.autocrlf` steht in diesem Repo auf `true`, git checkt diese Datei also mit
      // CRLF aus (`git ls-files --eol` -> `i/lf w/crlf`). Nach `split("\n")` endet dann
      // jede Zeile auf `\r`; `/\/\/.*$/` trifft sie NICHT MEHR, weil `.` ein `\r` nicht
      // mitnimmt und `$` ohne `m`-Flag das Ende der Zeichenkette meint. Ohne diese Zeile
      // streift der Filter also GAR KEINEN Zeilenkommentar ab, die Pruefung unten
      // scheitert an den Kommentaren - und behauptet dabei einen Fehler, den der Code
      // nicht hat.
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((zeile) => zeile.replace(/\/\/.*$/, ""))
      .join("\n");

    // Schutz gegen ein zu gieriges Abstreifen: Bleibt der Zugriff ueber die Registry
    // stehen, hat der Filter den Code nicht mitgeloescht - sonst waere die Pruefung
    // unten wertlos, weil sie auf einer leeren Zeichenkette trivial gruen ist.
    expect(ohneKommentare).toContain("KANAELE.export.wähleExportZiel");
    expect(ohneKommentare).toContain("KANAELE.render.fortschritt");

    // Und die Gegenrichtung: Der Filter muss tatsaechlich abgestreift HABEN - je eine
    // Probe aus einem `//`-Kommentar und aus dem `/** */`-Block. Ohne diese zwei Zeilen
    // ist ein blinder Filter (wie der CRLF-Fall oben) von einem sauberen nicht zu
    // unterscheiden: Er faellt dann nur auf, solange zufaellig ein Kanalname im
    // Kommentar steht, und wird lautlos wertlos, sobald keiner mehr dort steht.
    expect(quelle).toContain("GERUEST-PRUEFSUMME");
    expect(ohneKommentare).not.toContain("GERUEST-PRUEFSUMME");
    expect(quelle).toContain("VERWORFEN WIRD STILL");
    expect(ohneKommentare).not.toContain("VERWORFEN WIRD STILL");

    expect(ohneKommentare).not.toContain("export:");
    expect(ohneKommentare).not.toContain("render:");
  });
});
