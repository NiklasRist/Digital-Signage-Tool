// Verhaltenstest zu #60 - die Handler-Registry des auftrags-manager (TK 9.3.2).
//
// JEDER Test bekommt ein FRISCHES Modul. Die Registry lebt im Modulzustand, und sie
// kennt keinen Weg, einen Eintrag wieder zu ENTFERNEN (das ist so gewollt: registriert
// wird beim Start, nicht im Betrieb). Ohne frisches Modul liesse sich der Fall
// "fuer diese Art ist kein Dienst registriert" nach dem ersten Test nie wieder
// herstellen - er haenge dann an der Reihenfolge der Tests.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";
import type * as DispatcherModul from "../../src/main/auftrags-manager/dispatcher";
import type {
  AusfuehrungsKontext,
  HandlerErgebnis,
  HandlerFuer,
} from "../../src/main/auftrags-manager/dispatcher";

async function frischerDispatcher(): Promise<typeof DispatcherModul> {
  vi.resetModules();
  return import("../../src/main/auftrags-manager/dispatcher");
}

const gemeinsam = {
  status: "laeuft" as const,
  label: "Test",
  fortschritt: null,
  versuche: 1,
  fehler: null,
  ergebnis: null,
  erstelltAm: "2026-08-13T10:00:00.000Z",
};

const auftraege = {
  import: {
    ...gemeinsam,
    auftragId: "a-import",
    art: "import",
    payload: { projektId: "p-1", quellPfad: "C:/tmp/clip.mp4" },
  },
  loeschen: {
    ...gemeinsam,
    auftragId: "a-loeschen",
    art: "loeschen",
    payload: { projektId: "p-1", assetId: "m-1" },
  },
  render: {
    ...gemeinsam,
    auftragId: "a-render",
    art: "render",
    payload: {
      renderId: "r-1",
      projektId: "p-1",
      elemente: [],
      profil: RENDER_PROFILE,
      ausgabeName: "sommeraktion",
    },
  },
  export: {
    ...gemeinsam,
    auftragId: "a-export",
    art: "export",
    payload: { projektId: "p-1", dateiname: "sommeraktion.mp4", zielPfad: "E:/" },
  },
} satisfies Record<string, Auftrag>;

const erfolg: HandlerErgebnis<string> = { status: "erfolg", ergebnis: null };

function kontextFuer(
  auftrag: Auftrag,
  meldeFortschritt: (prozent: number | null) => void = () => undefined,
): AusfuehrungsKontext {
  return { auftragId: auftrag.auftragId, meldeFortschritt };
}

beforeEach(() => {
  // Der Dispatcher protokolliert jede gefangene Ausnahme. Der Testlauf soll davon
  // nicht rot eingefaerbt werden - dass protokolliert WIRD, prueft der erste Test.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Handler-Registry (#60)", () => {
  it("waehlt den Handler allein ueber auftrag.art und uebergibt den ganzen Auftrag", async () => {
    // Die vier Arten laufen durch DIESELBE Warteschlange; wer hier falsch zuordnet,
    // uebergibt dem media-service einen Render-Auftrag.
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    const gerufen: Array<[string, Auftrag]> = [];
    for (const auftrag of Object.values(auftraege)) {
      const eigeneArt = auftrag.art;
      registriereAuftragsHandler(eigeneArt, async (uebergeben: Auftrag) => {
        gerufen.push([eigeneArt, uebergeben]);
        return { status: "erfolg", ergebnis: eigeneArt };
      });
    }

    for (const auftrag of Object.values(auftraege)) {
      const ergebnis = await fuehreAus(auftrag, kontextFuer(auftrag));
      expect(ergebnis).toEqual({ status: "erfolg", ergebnis: auftrag.art });
    }

    // Jeder Handler genau einmal, jeder mit SEINEM eigenen Auftrag - und zwar mit dem
    // ganzen Objekt, nicht nur der Nutzlast (der Abbrecher und die Diagnose brauchen es).
    expect(gerufen).toEqual([
      ["import", auftraege.import],
      ["loeschen", auftraege.loeschen],
      ["render", auftraege.render],
      ["export", auftraege.export],
    ]);
  });

  it("faengt eine geworfene Ausnahme des Handlers und lehnt sein Promise nie ab", async () => {
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    const geheim = "C:\\Users\\privat\\projekt.json";
    registriereAuftragsHandler("import", () => {
      throw new Error(`ENOENT: ${geheim}`);
    });

    const ergebnis = await fuehreAus(auftraege.import, kontextFuer(auftraege.import));

    expect(ergebnis).toMatchObject({
      status: "fehlgeschlagen",
      fehler: { code: "unbekannter_fehler" },
    });
    // Kein Stacktrace, keine rohe Ausnahme-Meldung nach aussen (TK 9.1.1) - im
    // Protokoll des Hauptprozesses dagegen sehr wohl.
    expect(JSON.stringify(ergebnis)).not.toContain(geheim);
    expect(console.error).toHaveBeenCalled();
  });

  it("faengt auch eine abgelehnte Promise des Handlers", async () => {
    // Die Fehlerklasse, die ein fehlendes `await` durchrutschen liesse - und im Betrieb
    // die haeufigere, weil jeder Fachdienst async ist.
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    registriereAuftragsHandler("render", () => Promise.reject(new Error("ffmpeg weg")));

    await expect(fuehreAus(auftraege.render, kontextFuer(auftraege.render))).resolves.toMatchObject({
      status: "fehlgeschlagen",
      fehler: { code: "unbekannter_fehler" },
    });
  });

  it("antwortet ohne registrierten Handler mit unbekannter_fehler und nennt die Art", async () => {
    // Ein Programmierfehler im Main. Ein `throw` verliesse den Ablauf des Torwaechters -
    // die Warteschlange stuende danach fuer den Rest der Sitzung still.
    const { fuehreAus } = await frischerDispatcher();

    const ergebnis = await fuehreAus(auftraege.export, kontextFuer(auftraege.export));

    expect(ergebnis).toMatchObject({
      status: "fehlgeschlagen",
      fehler: { code: "unbekannter_fehler" },
    });
    expect(JSON.stringify(ergebnis)).toContain("export");
  });

  it("verwandelt eine Antwort ohne gueltige Form in unbekannter_fehler", async () => {
    // Ein vergessenes `return` im Fachdienst genuegt. Ungeprueft laese `beendeAuftrag`
    // (#70) `undefined.status` - der Wurf faende INNERHALB des Torwaechters statt.
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    registriereAuftragsHandler(
      "loeschen",
      (async () => undefined) as unknown as HandlerFuer<"loeschen">,
    );

    await expect(
      fuehreAus(auftraege.loeschen, kontextFuer(auftraege.loeschen)),
    ).resolves.toMatchObject({ status: "fehlgeschlagen", fehler: { code: "unbekannter_fehler" } });
  });

  it("reicht Fachcode, Meldung und daten unveraendert durch", async () => {
    // toBe: An Code und `daten` haengen Wiederholen (FA-17) und der gefuehrte
    // Reparatur-Modus (FA-19). Nichts wird umgeschrieben, nichts umkopiert, nichts
    // auf `unbekannter_fehler` vereinheitlicht.
    //
    // Der Handler antwortet mit SEINER eigenen Fehlercode-Union - der Nachweis, dass
    // ein `HandlerErgebnis<'probe_fehler' | 'kopier_fehler'>` sich eintragen laesst,
    // ohne dass die Registry diese Codes kennt.
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    const fachfehler: HandlerErgebnis<"probe_fehler" | "kopier_fehler"> = {
      status: "fehlgeschlagen",
      fehler: { code: "probe_fehler", meldung: "ffprobe lieferte keine Dauer", daten: { a: 1 } },
    };
    const handler: HandlerFuer<"import"> = async () => fachfehler;
    registriereAuftragsHandler("import", handler);

    await expect(fuehreAus(auftraege.import, kontextFuer(auftraege.import))).resolves.toBe(
      fachfehler,
    );
  });

  it("reicht meldeFortschritt unveraendert durch und fasst nichts zusammen", async () => {
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    const gemeldet: Array<number | null> = [];
    registriereAuftragsHandler("render", async (_auftrag, kontext) => {
      kontext.meldeFortschritt(0);
      kontext.meldeFortschritt(50);
      kontext.meldeFortschritt(null);
      kontext.meldeFortschritt(100);
      return erfolg;
    });

    await fuehreAus(
      auftraege.render,
      kontextFuer(auftraege.render, (prozent) => gemeldet.push(prozent)),
    );

    expect(gemeldet).toEqual([0, 50, null, 100]);
  });

  it("laesst ein werfendes meldeFortschritt die Ausfuehrung nicht beenden", async () => {
    // Ein Render kann zwanzig Minuten gelaufen sein - er darf nicht an einer
    // Fortschrittsmeldung sterben.
    const { registriereAuftragsHandler, fuehreAus } = await frischerDispatcher();
    registriereAuftragsHandler("render", async (_auftrag, kontext) => {
      kontext.meldeFortschritt(10);
      return { status: "erfolg", ergebnis: { pfad: "output/sommeraktion.mp4" } };
    });

    const ergebnis = await fuehreAus(
      auftraege.render,
      kontextFuer(auftraege.render, () => {
        throw new Error("Fenster schon zu");
      }),
    );

    expect(ergebnis).toEqual({ status: "erfolg", ergebnis: { pfad: "output/sommeraktion.mp4" } });
  });

  it("ersetzt bei erneuter Registrierung den ganzen Eintrag - Handler und Abbrecher", async () => {
    // Ohne diese Regel prueft ein Test scheinbar den echten Dienst, obwohl er seinen
    // eigenen registriert hat.
    const { registriereAuftragsHandler, fuehreAus, kannAbbrechen } = await frischerDispatcher();
    registriereAuftragsHandler("render", async () => ({ status: "erfolg", ergebnis: "erster" }), () => undefined);
    expect(kannAbbrechen("render")).toBe(true);

    registriereAuftragsHandler("render", async () => ({ status: "erfolg", ergebnis: "zweiter" }));

    await expect(fuehreAus(auftraege.render, kontextFuer(auftraege.render))).resolves.toEqual({
      status: "erfolg",
      ergebnis: "zweiter",
    });
    // Der zweite Aufruf brachte keinen Abbrecher mit - also ist die Art danach NICHT
    // mehr abbrechbar. Kein Zusammenfuehren mit dem alten Eintrag.
    expect(kannAbbrechen("render")).toBe(false);
  });

  it("meldet kannAbbrechen nur fuer Arten mit registriertem Abbrecher", async () => {
    const { registriereAuftragsHandler, kannAbbrechen } = await frischerDispatcher();
    registriereAuftragsHandler("render", async () => erfolg, () => undefined);
    registriereAuftragsHandler("import", async () => erfolg);

    expect(kannAbbrechen("render")).toBe(true);
    // Registriert, aber ohne Abbrecher - und eine gar nicht belegte Art ebenso.
    expect(kannAbbrechen("import")).toBe(false);
    expect(kannAbbrechen("export")).toBe(false);
  });

  it("ruft brich den Abbrecher mit dem ganzen Auftrag auf und veraendert nichts", async () => {
    const { registriereAuftragsHandler, brich } = await frischerDispatcher();
    const abbrecher = vi.fn((_auftrag: Auftrag) => undefined);
    registriereAuftragsHandler("render", async () => erfolg, abbrecher);
    const vorher = JSON.parse(JSON.stringify(auftraege.render)) as Auftrag;

    expect(brich(auftraege.render)).toBe(true);

    // Der Abbrecher des Render-Handlers (#68) holt sich die `renderId` aus der
    // Nutzlast - eine blosse ID reichte ihm nicht.
    expect(abbrecher).toHaveBeenCalledWith(auftraege.render);
    // `brich` beendet den Auftrag NICHT: kein Statuswechsel, kein Q1-/Q3-Eingriff. Der
    // Abschluss kommt regulaer ueber das HandlerErgebnis und `beendeAuftrag` (#70).
    expect(auftraege.render).toEqual(vorher);
  });

  it("liefert brich ohne registrierten Abbrecher false und ruft nichts", async () => {
    const { registriereAuftragsHandler, brich } = await frischerDispatcher();
    const handler = vi.fn(async () => erfolg);
    registriereAuftragsHandler("export", handler);

    expect(brich(auftraege.export)).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("wirft nicht, wenn der Abbrecher wirft, und meldet trotzdem true", async () => {
    // `true` heisst "es gab einen Abbrecher und er wurde gerufen" - danach richtet sich
    // `entferne` (#62).
    const { registriereAuftragsHandler, brich } = await frischerDispatcher();
    registriereAuftragsHandler("render", async () => erfolg, () => {
      throw new Error("Prozess schon tot");
    });

    expect(brich(auftraege.render)).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });
});
