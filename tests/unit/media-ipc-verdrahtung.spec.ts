// Verhaltenstests zu #93 - die Anmeldung des einen media-service-Kanals.
//
// DATEINAME: `ipc-verdrahtung.spec.ts` ist bereits von #71 (auftrags-manager) belegt.
// Der Name ist deshalb modulqualifiziert; zwei Dateien gleichen Namens in tests/unit/
// wuerden einander ueberschreiben.
//
// Gemockt sind `electron` (wie in registriere-handler.spec.ts - gebraucht wird nur
// `ipcMain.handle`, und der Test will an den angemeldeten Hoerer heran, um ihn selbst
// aufzurufen) und `dialog` (#81). NICHT gemockt ist der Wrapper #23: Er ist der Weg,
// den ein Aufruf im Betrieb nimmt - nur mit dem echten Wrapper ist "Ergebnis
// unveraendert durchgereicht" wirklich geprueft statt nachgestellt. Er ist lediglich
// UMHUELLT, damit der Test an die uebergebene Validierungsfunktion herankommt.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>;
type Wrapper = typeof import("../../src/main/ipc-gateway/registriere-handler");
type Validierer = Parameters<Wrapper["registriereHandler"]>[1];
type Ausfuehrer = Parameters<Wrapper["registriereHandler"]>[2];

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

const registrierungen = vi.hoisted(
  () => [] as Array<{ kanal: string; validiere: Validierer; ausfuehren: Ausfuehrer }>,
);

vi.mock("../../src/main/ipc-gateway/registriere-handler", async (importOriginal) => {
  const echt = await importOriginal<Wrapper>();
  return {
    registriereHandler: (kanal: string, validiere: Validierer, ausfuehren: Ausfuehrer) => {
      registrierungen.push({ kanal, validiere, ausfuehren });
      echt.registriereHandler(kanal, validiere, ausfuehren);
    },
  };
});

const dialogMock = vi.hoisted(() => ({ öffneMedienDialog: vi.fn() }));
vi.mock("../../src/main/media-service/dialog", () => dialogMock);

const { verdrahteMedienIPC } = await import("../../src/main/media-service/ipc-verdrahtung");

// Der blosse Import darf nichts angemeldet haben - eine Anmeldung als Nebeneffekt des
// Ladens haenge davon ab, wer wen zuerst importiert (im Issue ausdruecklich verboten).
const kanaeleVorAufruf = [...angemeldet.keys()];

verdrahteMedienIPC();

const kanaeleNachAufruf = [...angemeldet.keys()];

/** Ruft den angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(KANAELE.media.öffneMedienDialog);
  if (hoerer === undefined) throw new Error("Kein Hoerer fuer den Medien-Dialog angemeldet.");
  return hoerer({}, nutzlast);
}

beforeEach(() => {
  vi.clearAllMocks();
  dialogMock.öffneMedienDialog.mockResolvedValue({ ok: true, wert: { pfade: [] } });
});

describe("verdrahteMedienIPC (#93) - Anmeldung", () => {
  it("meldet genau einen Kanal an, und zwar den aus der Registry", () => {
    expect(kanaeleNachAufruf).toEqual([KANAELE.media.öffneMedienDialog]);
    expect(registrierungen).toHaveLength(1);
    expect(registrierungen[0]?.kanal).toBe("media:öffneMedienDialog");
  });

  it("meldet keinen Kanal zweimal an", () => {
    expect(doppelt).toEqual([]);
  });

  it("registriert beim blossen Import nichts", () => {
    expect(kanaeleVorAufruf).toEqual([]);
  });

  it("ergaenzt die Registry nur um die media-Gruppe", () => {
    // Der Kanalname entsteht ausschliesslich in kanaele.ts, und die Gruppen der anderen
    // Module (#71, #77) bleiben unberuehrt - dort arbeiten andere Agents.
    expect(Object.keys(KANAELE).sort()).toEqual(["config", "media", "queue"]);
    expect(Object.keys(KANAELE.media)).toEqual(["öffneMedienDialog"]);
    expect(Object.keys(KANAELE.queue).sort()).toEqual([
      "entferne",
      "geaendert",
      "holeStand",
      "reiheEin",
      "stoerung",
      "wiederhole",
    ]);
    expect(Object.keys(KANAELE.config)).toHaveLength(5);
  });
});

describe("verdrahteMedienIPC (#93) - Nutzlast", () => {
  it("nimmt jede Nutzlast an, statt sie abzulehnen", () => {
    const validiere = registrierungen[0]?.validiere;
    expect(validiere).toBeTypeOf("function");

    for (const nutzlast of [undefined, null, { unerwartet: 1 }, "x", 42, ["a"]]) {
      expect(validiere?.(nutzlast)).toMatchObject({ ok: true });
    }
  });

  it("ruft öffneMedienDialog ohne Argument auf, auch mit mitgeschickter Nutzlast", async () => {
    await rufe();
    await rufe({ unerwartet: 1 });

    expect(dialogMock.öffneMedienDialog).toHaveBeenCalledTimes(2);
    // `toHaveBeenCalledWith()` allein wuerde eine ueberzaehlige Nutzlast nicht sicher
    // aufdecken - geprueft wird die Argumentliste selbst.
    expect(dialogMock.öffneMedienDialog.mock.calls[0]).toEqual([]);
    expect(dialogMock.öffneMedienDialog.mock.calls[1]).toEqual([]);
  });
});

describe("verdrahteMedienIPC (#93) - Ergebnis", () => {
  it("reicht die Auswahl unveraendert durch", async () => {
    const antwort = { ok: true as const, wert: { pfade: ["C:\\a.mp4", "C:\\b.png"] } };
    dialogMock.öffneMedienDialog.mockResolvedValue(antwort);

    await expect(rufe()).resolves.toBe(antwort);
  });

  it("macht aus dem Abbruch (leeres pfade) keinen Fehler", async () => {
    const antwort = { ok: true as const, wert: { pfade: [] } };
    dialogMock.öffneMedienDialog.mockResolvedValue(antwort);

    await expect(rufe()).resolves.toBe(antwort);
  });

  it("reicht Code und Meldung eines Fehlschlags unveraendert durch", async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: { code: "unbekannter_fehler", meldung: "Dialog verweigert" },
    };
    dialogMock.öffneMedienDialog.mockResolvedValue(fehlschlag);

    await expect(rufe()).resolves.toBe(fehlschlag);
  });

  it("uebersetzt eine geworfene Ausnahme in unbekannter_fehler, statt sie zu werfen", async () => {
    // Das leistet der Wrapper (#23); geprueft ist damit, dass diese Datei ihn benutzt
    // und kein eigenes try/catch danebenstellt, das den Code ersetzte.
    const protokoll = vi.spyOn(console, "error").mockImplementation(() => undefined);
    dialogMock.öffneMedienDialog.mockRejectedValue(new Error("kaputt"));

    await expect(rufe()).resolves.toMatchObject({
      ok: false,
      fehler: { code: "unbekannter_fehler" },
    });
    protokoll.mockRestore();
  });
});
