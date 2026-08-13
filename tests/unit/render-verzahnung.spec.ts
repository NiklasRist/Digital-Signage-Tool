// Verhaltenstests zu #68 - die Naht zwischen Auftragsverwaltung (P6) und render-service (P4).
//
// Geprueft wird ausschliesslich von aussen: Was passiert am Auftrag, waehrend der Lauf laeuft,
// und welchen Ausgang traegt der Handler in die Registry (#60) zurueck. Der "render-service" ist
// hier ein Test-`renderReel` - genau dafuer werden die beiden Funktionen hineingereicht statt
// importiert (M6 gibt es noch nicht).
//
// JEDER Test bekommt ein FRISCHES Modul: Die Registry des Dispatchers lebt im Modulzustand und
// kennt keinen Weg, einen Eintrag zu entfernen. Ohne frisches Modul haenge jeder Test daran, was
// ein vorheriger registriert hat.
//
// KEINE Zusicherung steht INNERHALB von `renderReel`: Der Handler faengt jede Ausnahme des
// Dienstes ab - eine dort fehlschlagende Erwartung wuerde verschluckt und der Test bliebe gruen.
// Beobachtet wird waehrend des Laufs, geprueft wird danach.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import type {
  AusfuehrungsKontext,
  HandlerErgebnis,
} from "../../src/main/auftrags-manager/dispatcher";
import type { RenderRequest } from "../../src/shared/contracts/render-request";
import type { RenderProgress, RenderResult } from "../../src/shared/contracts/render-result";

// Drei Nachbarn sind gemockt, jeder aus einem eigenen Grund:
//   - `aktives-projekt` (#192), weil der Halter modulweiten Zustand fuehrt, den jeder Test frisch
//     belegen koennen muss;
//   - `auto-speichern` (#47), weil ein Flush-Fehlschlag (volle Platte) auf einer echten Platte
//     nicht herstellbar ist - und weil kein Test eine project.json schreiben soll;
//   - `d1-lock` (#32), weil die Zusage "der Flush laeuft INNERHALB des Locks" nur von aussen
//     sichtbar ist. Der Mock fuehrt die Aktion echt aus und merkt sich nur, ob er gerade drin ist.
const zustand = vi.hoisted(() => ({
  aktivesProjekt: null as unknown,
  /** Aufrufe von sofortFlush - je Eintrag das uebergebene Projekt. */
  geflusht: [] as unknown[],
  /** War beim Flush ein Lock-Abschnitt offen? */
  flushImLock: [] as boolean[],
  imLock: false,
  /** Antwort des naechsten sofortFlush; `null` = Erfolg. */
  flushAntwort: null as unknown,
}));

vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: () => zustand.aktivesProjekt,
}));

vi.mock("../../src/main/project-store/auto-speichern", () => ({
  sofortFlush: async (projekt: unknown) => {
    zustand.geflusht.push(projekt);
    zustand.flushImLock.push(zustand.imLock);
    return zustand.flushAntwort ?? { ok: true, wert: undefined };
  },
}));

vi.mock("../../src/main/project-store/d1-lock", () => ({
  mitD1Lock: async <T>(aktion: () => Promise<T>): Promise<T> => {
    zustand.imLock = true;
    try {
      return await aktion();
    } finally {
      zustand.imLock = false;
    }
  },
}));

async function frischeVerzahnung() {
  vi.resetModules();
  const dispatcher = await import("../../src/main/auftrags-manager/dispatcher");
  const { registriereRenderHandler } = await import(
    "../../src/main/auftrags-manager/render-verzahnung"
  );
  return { ...dispatcher, registriereRenderHandler };
}

type RenderAuftrag = Extract<Auftrag, { art: "render" }>;

type TestRenderReel = (
  request: RenderRequest,
  aufFortschritt: (f: RenderProgress) => void,
) => Promise<RenderResult>;

function renderAuftrag(): RenderAuftrag {
  return {
    auftragId: "a-render",
    art: "render",
    status: "laeuft",
    label: "Sommeraktion rendern",
    payload: {
      renderId: "r-42",
      projektId: "p-1",
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: "sommeraktion",
    },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

const erfolgsErgebnis: RenderResult = {
  status: "erfolg",
  renderId: "r-42",
  ausgabePfad: "C:/daten/projects/p-1/output/sommeraktion.mp4",
  ausgabeName: "sommeraktion",
  gesamtdauer: 123.5,
  dateigroesse: 98765,
};

function fortschritt(prozent: number): RenderProgress {
  return {
    renderId: "r-42",
    phase: "normalisieren",
    elementIndex: 0,
    elementAnzahl: 3,
    elementId: "el-1",
    prozent,
  };
}

/**
 * Ein kompletter Lauf: Handler registrieren, ausfuehren, Ausgang zurueckgeben.
 *
 * `meldeFortschritt` schreibt an den Auftrag - genau das tut der Torwaechter (#59) am LEBENDEN
 * Q1-Eintrag (#54). Damit ist von aussen sichtbar, was die DoD-Punkte behaupten.
 */
async function laufe(
  renderReel: TestRenderReel,
  auftrag: RenderAuftrag = renderAuftrag(),
  cancelRender: (renderId: string) => void = () => undefined,
): Promise<HandlerErgebnis<string>> {
  const { registriereRenderHandler, fuehreAus } = await frischeVerzahnung();
  registriereRenderHandler(renderReel, cancelRender);

  const kontext: AusfuehrungsKontext = {
    auftragId: auftrag.auftragId,
    meldeFortschritt: (prozent) => {
      auftrag.fortschritt = prozent;
    },
  };

  return fuehreAus(auftrag, kontext);
}

function alsErfolg(ausgang: HandlerErgebnis<string>): unknown {
  if (ausgang.status !== "erfolg") throw new Error(`Erwartet: erfolg, bekommen: ${ausgang.status}`);
  return ausgang.ergebnis;
}

function alsFehlschlag(ausgang: HandlerErgebnis<string>): {
  code: string;
  meldung: string;
  daten?: unknown;
} {
  if (ausgang.status !== "fehlgeschlagen") {
    throw new Error(`Erwartet: fehlgeschlagen, bekommen: ${ausgang.status}`);
  }
  return ausgang.fehler;
}

beforeEach(() => {
  zustand.aktivesProjekt = null;
  zustand.geflusht = [];
  zustand.flushImLock = [];
  zustand.flushAntwort = null;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Render-Verzahnung (#68)", () => {
  it("uebergibt genau die eingefrorene Nutzlast und laedt nichts nach", async () => {
    // "Render friert seinen Eingang beim Einreihen ein" (TK 9.3.5) - `toBe`, nicht `toEqual`:
    // ein nachgeschlagener oder umkopierter Request waere gleich, aber nicht dasselbe Objekt.
    const auftrag = renderAuftrag();
    const gesehen: RenderRequest[] = [];

    await laufe(async (request) => {
      gesehen.push(request);
      return erfolgsErgebnis;
    }, auftrag);

    expect(gesehen).toHaveLength(1);
    expect(gesehen[0]).toBe(auftrag.payload);
  });

  it("setzt Fortschritt 42 am laufenden Auftrag, ohne Status oder Fehler zu beruehren", async () => {
    const auftrag = renderAuftrag();
    const waehrendDesLaufs: unknown[] = [];

    await laufe(async (_request, aufFortschritt) => {
      aufFortschritt(fortschritt(42));
      waehrendDesLaufs.push(auftrag.fortschritt, auftrag.status, auftrag.fehler);
      return erfolgsErgebnis;
    }, auftrag);

    expect(waehrendDesLaufs).toEqual([42, "laeuft", null]);
  });

  it.each([
    [130, 100],
    [-5, 0],
    [0, 0],
    [100, 100],
  ])("begrenzt den gemeldeten Prozentwert %s auf %s", async (gemeldet, erwartet) => {
    const auftrag = renderAuftrag();

    const ausgang = await laufe(async (_request, aufFortschritt) => {
      aufFortschritt(fortschritt(gemeldet));
      return erfolgsErgebnis;
    }, auftrag);

    expect(auftrag.fortschritt).toBe(erwartet);
    // Kein Statuswechsel, kein Fehler: Der Fortschrittskanal traegt keinen Endzustand
    // (TK 9.2.7) - ein verrutschter Prozentwert darf keine Minuten Renderarbeit vernichten.
    expect(ausgang.status).toBe("erfolg");
    expect(auftrag.status).toBe("laeuft");
  });

  it("verwirft Fortschrittsmeldungen NACH dem terminalen Ergebnis", async () => {
    // TK 9.2.7: Nach dem RenderResult darf kein RenderProgress mehr folgen. Haelt der Dienst
    // sich nicht daran, ueberschriebe ein Nachzuegler den Fortschritt eines Auftrags, der
    // laengst abgeschlossen ist.
    const auftrag = renderAuftrag();
    let nachzuegler: (f: RenderProgress) => void = () => undefined;

    await laufe(async (_request, aufFortschritt) => {
      aufFortschritt(fortschritt(80));
      nachzuegler = aufFortschritt;
      return erfolgsErgebnis;
    }, auftrag);

    expect(auftrag.fortschritt).toBe(80);
    nachzuegler(fortschritt(5));
    expect(auftrag.fortschritt).toBe(80);
  });

  it("uebersetzt Erfolg in genau vier Nutzdaten, ausgabeName zeichengleich", async () => {
    // Der Name unterscheidet sich bewusst vom Dateinamen im Pfad: Er darf NICHT aus dem Pfad
    // abgeleitet sein. Ueber ihn haelt die Oberflaeche ihre Vorbelegung (FA-22) im Gleichklang.
    const ausgang = await laufe(async () => ({
      status: "erfolg",
      renderId: "r-42",
      ausgabePfad: "C:/daten/projects/p-1/output/sommeraktion (1).mp4",
      ausgabeName: "sommeraktion",
      gesamtdauer: 123.5,
      dateigroesse: 98765,
    }));

    const ergebnis = alsErfolg(ausgang);
    expect(ergebnis).toEqual({
      pfad: "C:/daten/projects/p-1/output/sommeraktion (1).mp4",
      ausgabeName: "sommeraktion",
      dateigroesse: 98765,
      gesamtdauer: 123.5,
    });
    // Genau diese vier Schluessel - kein fuenfter. Was hier hineinkommt, legt die Q3-Form fest,
    // und Q3 ist dauerhaft.
    expect(Object.keys(ergebnis as object).sort()).toEqual([
      "ausgabeName",
      "dateigroesse",
      "gesamtdauer",
      "pfad",
    ]);
  });

  it.each([
    "medium_fehlt",
    "ungueltiges_element",
    "ungueltige_eingabe",
    "ffmpeg_fehler",
    "kein_platz",
    "speicher_fehler",
    "unbekannter_fehler",
  ])("uebernimmt den gelisteten Fehlercode %s zeichengleich", async (code) => {
    const ausgang = await laufe(async () => ({
      status: "fehler",
      renderId: "r-42",
      fehlercode: code,
      fehlerhaftesElementId: null,
      meldung: "Vorgang gescheitert",
    }));

    // `fehlgeschlagen`, nicht "fehler": RenderResult.status und Auftrag.status heissen
    // verschieden (TK 9.2.3 / 9.3.1), die Uebersetzung ist Absicht.
    expect(ausgang.status).toBe("fehlgeschlagen");
    expect(alsFehlschlag(ausgang).code).toBe(code);
    expect(alsFehlschlag(ausgang).meldung).toBe("Vorgang gescheitert");
  });

  it.each(["irgendwas_neues", "abgebrochen"])(
    "bildet den nicht gelisteten Code %s auf unbekannter_fehler ab und behaelt den Rohwert",
    async (code) => {
      // `abgebrochen` ist KEIN Fehlercode (TK 9.2.3) - kommt er als solcher an, ist das ein
      // Vertragsbruch des Dienstes und wird gemeldet, nicht in status:'abgebrochen' umgedeutet.
      const ausgang = await laufe(async () => ({
        status: "fehler",
        renderId: "r-42",
        fehlercode: code,
        fehlerhaftesElementId: null,
        meldung: "Vorgang gescheitert",
      }));

      const fehler = alsFehlschlag(ausgang);
      expect(fehler.code).toBe("unbekannter_fehler");
      expect(fehler.meldung).toContain(code);
    },
  );

  it("reicht fehlerhaftesElementId als daten.elementId weiter", async () => {
    // Ohne diesen Weg erreichte die ID nie den Nutzer, und der gefuehrte Reparatur-Modus
    // (FA-19) faende die Stelle nicht, zu der er fuehren soll.
    const ausgang = await laufe(async () => ({
      status: "fehler",
      renderId: "r-42",
      fehlercode: "medium_fehlt",
      fehlerhaftesElementId: "el-7",
      meldung: "Medium fehlt",
    }));

    expect(alsFehlschlag(ausgang).daten).toEqual({ elementId: "el-7" });
  });

  it("laesst daten weg, wenn fehlerhaftesElementId null ist", async () => {
    // Kein `{ elementId: null }`: Die Form von `daten` ist je Fehlercode festgelegt, ein leerer
    // Beutel waere eine dritte Bedeutung.
    const ausgang = await laufe(async () => ({
      status: "fehler",
      renderId: "r-42",
      fehlercode: "ffmpeg_fehler",
      fehlerhaftesElementId: null,
      meldung: "ffmpeg brach ab",
    }));

    expect("daten" in alsFehlschlag(ausgang)).toBe(false);
  });

  it("uebersetzt Abbruch ohne Nutzdaten und ohne fehler-Objekt", async () => {
    const ausgang = await laufe(async () => ({
      status: "abgebrochen",
      renderId: "r-42",
      abgebrochenBei: 12.5,
    }));

    // Exakt dieses Objekt: `abgebrochenBei` hat im HandlerErgebnis kein Feld, und ein
    // `fehler`-Objekt zeigte die Oberflaeche einen Abbruch als Fehler.
    expect(ausgang).toEqual({ status: "abgebrochen" });
  });

  it("macht aus einer abgelehnten Zusage einen Fehlschlag, keinen Stillstand", async () => {
    // Bliebe der Auftrag auf `laeuft`, stuende die GESAMTE Warteschlange still - die serielle
    // Ordnung ist der einzige Sperr-Mechanismus des Systems (TK 9.3.5).
    const geheim = "C:\\Users\\privat\\projekt.json";

    const ausgang = await laufe(() => Promise.reject(new Error(`ENOENT: ${geheim}`)));

    expect(alsFehlschlag(ausgang).code).toBe("unbekannter_fehler");
    // Keine rohe Ausnahme-Meldung nach aussen (TK 9.1.1) - ins Protokoll dagegen sehr wohl.
    expect(JSON.stringify(ausgang)).not.toContain("privat");
    expect(console.error).toHaveBeenCalled();
  });

  it("ruft cancelRender ueber brich mit der renderId aus der Nutzlast", async () => {
    // `entferne` (#62) erreicht den Abbruch ausschliesslich ueber `brich(auftrag)` aus #60 - der
    // Abbrecher bekommt den GANZEN Auftrag, nur so kommt er an die renderId.
    const { registriereRenderHandler, brich, kannAbbrechen } = await frischeVerzahnung();
    const cancelRender = vi.fn((_renderId: string) => undefined);
    registriereRenderHandler(async () => erfolgsErgebnis, cancelRender);

    expect(kannAbbrechen("render")).toBe(true);
    expect(brich(renderAuftrag())).toBe(true);
    expect(cancelRender).toHaveBeenCalledWith("r-42");
  });

  it("flusht D1 im Lock, bevor renderReel startet", async () => {
    // TK 9.3.3: Der Sofort-Flush laeuft als ERSTER SCHRITT im Handler - nicht im Torwaechter
    // (#59), dessen Statuswechsel-Abschnitt bewusst kein `await` enthaelt.
    const projekt = { id: "p-1", name: "Studio" };
    zustand.aktivesProjekt = projekt;
    let flusheVorDemLauf = -1;

    await laufe(async () => {
      flusheVorDemLauf = zustand.geflusht.length;
      return erfolgsErgebnis;
    });

    expect(flusheVorDemLauf).toBe(1);
    // `toBe`: geflusht wird der LEBENDE Stand, keine Kopie (#192).
    expect(zustand.geflusht[0]).toBe(projekt);
    // "MUSS von der aufrufenden Stelle innerhalb von mitD1Lock ausgefuehrt werden" (#47).
    expect(zustand.flushImLock).toEqual([true]);
  });

  it("startet den Render nicht, wenn der Flush scheitert", async () => {
    // Einen Render auf einen Stand zu fahren, der nicht auf der Platte steht, waere genau der
    // Datenverlust, den der Flush verhindern soll.
    zustand.aktivesProjekt = { id: "p-1" };
    zustand.flushAntwort = {
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Datentraeger voll" },
    };
    const renderReel = vi.fn(async () => erfolgsErgebnis);

    const ausgang = await laufe(renderReel);

    expect(renderReel).not.toHaveBeenCalled();
    expect(alsFehlschlag(ausgang).code).toBe("speicher_fehler");
    expect(alsFehlschlag(ausgang).meldung).toContain("Datentraeger voll");
  });

  it("rendert auch ohne geoeffnetes Projekt - es gibt dann nichts zu flushen", async () => {
    const renderReel = vi.fn(async () => erfolgsErgebnis);

    const ausgang = await laufe(renderReel);

    expect(zustand.geflusht).toEqual([]);
    expect(renderReel).toHaveBeenCalledTimes(1);
    expect(ausgang.status).toBe("erfolg");
  });
});
