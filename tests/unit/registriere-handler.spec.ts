// Verhaltenstest zu #23 - der Kanal-Wrapper des ipc-gateway (TK 9.1.1).
//
// Electron wird gemockt statt gestartet: Gebraucht wird von `ipcMain` nur `handle`,
// und der Test will ohnehin an den angemeldeten Hoerer heran, um ihn selbst
// aufzurufen - das ist genau die Rolle, die im Betrieb der Renderer spielt.
import { afterEach, describe, expect, it, vi } from "vitest";

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>;

const angemeldet = new Map<string, Hoerer>();

vi.mock("electron", () => ({
  ipcMain: {
    handle: (kanal: string, hoerer: Hoerer) => {
      angemeldet.set(kanal, hoerer);
    },
  },
}));

const { registriereHandler } = await import("../../src/main/ipc-gateway/registriere-handler");

/** Registriert den Kanal und liefert eine Funktion, die ihn wie der Renderer aufruft. */
function alsRenderer(
  kanal: string,
  validiere: Parameters<typeof registriereHandler>[1],
  ausfuehren: Parameters<typeof registriereHandler>[2],
): (nutzlast?: unknown) => Promise<unknown> {
  registriereHandler(kanal, validiere, ausfuehren);
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return (nutzlast?: unknown) => hoerer({}, nutzlast);
}

const nieGerufen = () => Promise.reject(new Error("darf nicht aufgerufen werden"));

afterEach(() => {
  angemeldet.clear();
  vi.restoreAllMocks();
});

describe("registriereHandler (#23)", () => {
  it("ruft ausfuehren bei ungueltiger Eingabe nicht auf und reicht dessen Fehler-Huelle durch", async () => {
    // Der Kern von TK 9.1.1 Punkt 6: keine Wirkung auf die Daten. Die Meldung des
    // Validierers muss ueberleben - sonst kann die Oberflaeche nicht sagen, was fehlt.
    const spion = vi.fn(nieGerufen);
    const huelle = {
      ok: false as const,
      fehler: { code: "ungueltige_eingabe" as const, meldung: "dauer fehlt", daten: { feld: "dauer" } },
    };
    const rufe = alsRenderer("project:setzeDauer", () => huelle, spion);

    await expect(rufe({ kaputt: true })).resolves.toBe(huelle);
    expect(spion).not.toHaveBeenCalled();
  });

  it("faengt eine Exception aus ausfuehren und antwortet mit unbekannter_fehler", async () => {
    const protokoll = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const rufe = alsRenderer(
      "project:oeffneProjekt",
      (nutzlast) => ({ ok: true as const, wert: nutzlast }),
      () => {
        throw new Error("Datenbank kaputt");
      },
    );

    const ergebnis = await rufe({ id: "p1" });

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "unbekannter_fehler" } });
    expect(protokoll).toHaveBeenCalled();
  });

  it("faengt auch eine abgelehnte Promise aus ausfuehren", async () => {
    // Die Fehlerklasse, die ein fehlendes `await` im Wrapper durchrutschen liesse -
    // und die im Betrieb die haeufigere ist, weil jede Fachoperation async ist.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const rufe = alsRenderer(
      "media:listeMedien",
      (nutzlast) => ({ ok: true as const, wert: nutzlast }),
      () => Promise.reject(new Error("kein Zugriff")),
    );

    await expect(rufe()).resolves.toMatchObject({ ok: false, fehler: { code: "unbekannter_fehler" } });
  });

  it("laesst weder Stacktrace noch rohe Fehlermeldung in die Antwort", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const geheim = "C:\\Users\\privat\\projekt.json";
    const rufe = alsRenderer(
      "project:listeProjekte",
      (nutzlast) => ({ ok: true as const, wert: nutzlast }),
      () => Promise.reject(new Error(`ENOENT: ${geheim}`)),
    );

    const alsText = JSON.stringify(await rufe());

    expect(alsText).not.toContain(geheim);
    expect(alsText).not.toContain("ENOENT");
    expect(alsText).not.toContain("at ");
  });

  it("faengt auch eine Exception aus validiere, statt den Aufruf ablehnen zu lassen", async () => {
    // Ueber den Wortlaut des Issues hinaus, aber TK 9.1.1 Punkt 8 folgend: Eine
    // abgelehnte Promise kaeme beim Renderer als Text ohne Code an.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const spion = vi.fn(nieGerufen);
    const rufe = alsRenderer(
      "project:setzeTrim",
      () => {
        throw new TypeError("Cannot read properties of null");
      },
      spion,
    );

    await expect(rufe(null)).resolves.toMatchObject({ ok: false, fehler: { code: "unbekannter_fehler" } });
    expect(spion).not.toHaveBeenCalled();
  });

  it("reicht ein regulaeres ok:false mit Fachcode unveraendert durch", async () => {
    // toBe: Am Fachcode und an `daten` haengt der Reparatur-Modus (FA-19). Das
    // Gateway darf hier nichts umformen, auch nicht umkopieren.
    const fachfehler = {
      ok: false as const,
      fehler: { code: "asset_referenziert", meldung: "in Benutzung", daten: { referenzenIds: ["e1"] } },
    };
    const rufe = alsRenderer(
      "media:loescheMedium",
      (nutzlast) => ({ ok: true as const, wert: nutzlast }),
      () => Promise.resolve(fachfehler),
    );

    await expect(rufe({ id: "m1" })).resolves.toBe(fachfehler);
  });

  it("uebergibt ausfuehren den geprueften Wert, nicht die rohe Nutzlast", async () => {
    // Sonst waere die Arbeit des Validierers verloren und jede Fachfunktion muesste
    // ein zweites Mal pruefen.
    const spion = vi.fn(() => Promise.resolve({ ok: true as const, wert: null }));
    const rufe = alsRenderer(
      "project:setzeDauer",
      () => ({ ok: true as const, wert: { dauer: 10 } }),
      spion,
    );

    await rufe({ dauer: "10", unfug: true });

    expect(spion).toHaveBeenCalledWith({ dauer: 10 });
  });
});
