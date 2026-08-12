// Verhaltenstest zu #77 - die Anmeldung der fuenf config-store-Kanaele.
//
// Gemockt wird `electron` (wie in registriere-handler.spec.ts) und die fuenf
// Fachoperationen. Der Wrapper #23 laeuft dagegen ECHT mit: Er ist der Weg, den die
// Nutzlast im Betrieb nimmt, und genau an ihm haengt die Zusage "bei ungueltiger
// Eingabe laeuft die Operation gar nicht erst an".
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>;

const angemeldet = new Map<string, Hoerer>();

vi.mock("electron", () => ({
  ipcMain: {
    handle: (kanal: string, hoerer: Hoerer) => {
      angemeldet.set(kanal, hoerer);
    },
  },
}));

const ops = vi.hoisted(() => ({
  leseKonfig: vi.fn(),
  setzeAktivesProjekt: vi.fn(),
  setzeExportZiel: vi.fn(),
  leseMarke: vi.fn(),
  setzeUIVoreinstellung: vi.fn(),
}));

vi.mock("../../src/main/config-store/lese-konfig", () => ({ leseKonfig: ops.leseKonfig }));
vi.mock("../../src/main/config-store/lese-marke", () => ({ leseMarke: ops.leseMarke }));
vi.mock("../../src/main/config-store/setze-aktives-projekt", () => ({
  setzeAktivesProjekt: ops.setzeAktivesProjekt,
}));
vi.mock("../../src/main/config-store/setze-export-ziel", () => ({
  setzeExportZiel: ops.setzeExportZiel,
}));
vi.mock("../../src/main/config-store/setze-ui-voreinstellung", () => ({
  setzeUIVoreinstellung: ops.setzeUIVoreinstellung,
}));

const { verdrahteConfigStoreIPC } = await import(
  "../../src/main/ipc-gateway/config-store-verdrahtung"
);

// EINMAL verdrahten, wie im Bootstrap (#3). Ein zweiter Aufruf waere im Betrieb ein
// Fehler; hier bliebe er unbemerkt, weil der Mock nur ueberschreibt.
verdrahteConfigStoreIPC();

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

const OK = { ok: true as const, wert: undefined };

beforeEach(() => {
  vi.clearAllMocks();
  ops.leseKonfig.mockResolvedValue({
    ok: true,
    wert: { aktivesProjektId: null, letztesExportZiel: null, uiVoreinstellungen: {} },
  });
  ops.leseMarke.mockResolvedValue({ ok: true, wert: { farben: {} } });
  ops.setzeAktivesProjekt.mockResolvedValue(OK);
  ops.setzeExportZiel.mockResolvedValue(OK);
  ops.setzeUIVoreinstellung.mockResolvedValue(OK);
});

describe("verdrahteConfigStoreIPC (#77)", () => {
  it("meldet genau die fuenf Kanaele aus KANAELE.config an", () => {
    expect([...angemeldet.keys()].sort()).toEqual(Object.values(KANAELE.config).sort());
  });

  it("reicht 0, false und null als gueltige Voreinstellungswerte durch", async () => {
    // Der teure Fehler waere eine Wahrheitspruefung statt "ist vorhanden" - sie
    // verwuerfe genau die haeufigsten Oberflaechen-Werte.
    for (const wert of [0, false, null, ""]) {
      await rufe(KANAELE.config.setzeUIVoreinstellung, { schlüssel: "reiter", wert });
      expect(ops.setzeUIVoreinstellung).toHaveBeenLastCalledWith("reiter", wert);
    }
  });

  it("lehnt eine Voreinstellung ohne wert ab, ohne die Operation aufzurufen", async () => {
    const ergebnis = await rufe(KANAELE.config.setzeUIVoreinstellung, { schlüssel: "reiter" });

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(ops.setzeUIVoreinstellung).not.toHaveBeenCalled();
  });

  it("lehnt eine Nutzlast ab, die kein Objekt ist", async () => {
    for (const kaputt of [null, "config", 42, ["a"]]) {
      const ergebnis = await rufe(KANAELE.config.setzeAktivesProjekt, kaputt);
      expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    }
    expect(ops.setzeAktivesProjekt).not.toHaveBeenCalled();
  });

  it("lehnt leere Zeichenketten in projektId und pfad ab", async () => {
    const a = await rufe(KANAELE.config.setzeAktivesProjekt, { projektId: "   " });
    const b = await rufe(KANAELE.config.setzeExportZiel, { pfad: "" });

    expect(a).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(b).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(ops.setzeAktivesProjekt).not.toHaveBeenCalled();
    expect(ops.setzeExportZiel).not.toHaveBeenCalled();
  });

  it("packt projektId und pfad aus und reicht sie unveraendert weiter", async () => {
    await rufe(KANAELE.config.setzeAktivesProjekt, { projektId: " p1 ", unfug: true });
    await rufe(KANAELE.config.setzeExportZiel, { pfad: "E:\\usb" });

    // Getrimmt wird NICHT, nur geprueft - und Fremdfelder reisen nicht mit.
    expect(ops.setzeAktivesProjekt).toHaveBeenCalledWith(" p1 ");
    expect(ops.setzeExportZiel).toHaveBeenCalledWith("E:\\usb");
  });

  it("laesst die Lese-Kanaele ohne Nutzlast arbeiten und ignoriert eine uebergebene", async () => {
    await expect(rufe(KANAELE.config.leseKonfig)).resolves.toMatchObject({ ok: true });
    await expect(rufe(KANAELE.config.leseMarke)).resolves.toMatchObject({ ok: true });
    await expect(rufe(KANAELE.config.leseMarke, { unerwartet: 1 })).resolves.toMatchObject({
      ok: true,
    });
    expect(ops.leseMarke).toHaveBeenCalledWith();
  });

  it("reicht das Ergebnis von leseMarke unveraendert durch", async () => {
    // toBe: keine Umformung, keine berechneten Zusatzfelder - template-canvas (M4)
    // erwartet genau die Rollen aus #52.
    const marke = { ok: true as const, wert: { farben: { akzent: "#FF4040" } } };
    ops.leseMarke.mockResolvedValue(marke);

    await expect(rufe(KANAELE.config.leseMarke)).resolves.toBe(marke);
  });

  it("reicht Fachcode und daten eines Fehlschlags unveraendert durch", async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: { code: "nicht_gefunden", meldung: "kein Projekt", daten: { projektId: "p1" } },
    };
    ops.setzeAktivesProjekt.mockResolvedValue(fehlschlag);

    await expect(rufe(KANAELE.config.setzeAktivesProjekt, { projektId: "p1" })).resolves.toBe(
      fehlschlag,
    );
  });

  it("fuegt einem Fehler ohne daten keines hinzu", async () => {
    ops.setzeExportZiel.mockResolvedValue({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });

    const ergebnis = (await rufe(KANAELE.config.setzeExportZiel, { pfad: "E:\\usb" })) as {
      fehler: Record<string, unknown>;
    };

    expect("daten" in ergebnis.fehler).toBe(false);
  });
});
