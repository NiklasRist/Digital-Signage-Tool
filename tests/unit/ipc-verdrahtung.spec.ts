// Verhaltenstests zu #71 - die Anmeldung der vier Warteschlangen-Kanaele und die
// Weitergabe der zwei Ereignisse an das eine Fenster.
//
// Gemockt sind `electron` (wie in registriere-handler.spec.ts) und die vier
// Operationen (#61-#64). NICHT gemockt ist queue-ereignis (#65): Es ist der Weg, den
// eine Meldung im Betrieb nimmt, und nur mit dem echten Modul ist "genau einmal
// abonniert" wirklich geprueft statt nachgestellt. Damit es ohne Platte auskommt, ist
// stattdessen hole-stand (#64) gemockt - das einzige, was #65 sonst benutzt.
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BrowserWindow } from "electron";

import type { Auftrag } from "../../src/shared/contracts/auftrag";
import { KANAELE } from "../../src/shared/contracts/kanaele";

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

const ops = vi.hoisted(() => ({
  reiheEin: vi.fn(),
  entferne: vi.fn(),
  wiederhole: vi.fn(),
  holeStand: vi.fn(),
}));

vi.mock("../../src/main/auftrags-manager/reihe-ein", () => ({ reiheEin: ops.reiheEin }));
vi.mock("../../src/main/auftrags-manager/entferne", () => ({ entferne: ops.entferne }));
vi.mock("../../src/main/auftrags-manager/wiederhole", () => ({ wiederhole: ops.wiederhole }));
vi.mock("../../src/main/auftrags-manager/hole-stand", () => ({ holeStand: ops.holeStand }));

const stand: Auftrag[] = [];
ops.holeStand.mockResolvedValue({ ok: true, wert: stand });

const { meldeQueueStoerung, sendeQueueGeaendert } = await import(
  "../../src/main/auftrags-manager/queue-ereignis"
);
const { verdrahteQueueIPC } = await import("../../src/main/auftrags-manager/ipc-verdrahtung");

type FensterDoppel = {
  webContents: { send: ReturnType<typeof vi.fn> };
  zerstoere: () => void;
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
    schliesse: () => {
      zerstoert = true;
      for (const hoerer of beimSchliessen) hoerer();
    },
  };
  return doppel as unknown as FensterDoppel & BrowserWindow;
}

// Der blosse Import darf nichts angemeldet haben.
const kanaeleVorAufruf = [...angemeldet.keys()];

const fenster = baueFenster();
verdrahteQueueIPC(fenster);

// Festgehalten VOR den Tests weiter unten: die verdrahten eigene Fenster und melden die
// vier Kanaele dabei erneut an (im Betrieb unmoeglich, hier der Preis fuer isolierte
// Abraeum-Tests). Diese beiden Aufnahmen beschreiben deshalb den EINEN Aufruf oben.
const kanaeleNachAufruf = [...angemeldet.keys()];
const doppeltNachAufruf = [...doppelt];

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal);
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`);
  return hoerer({}, nutzlast);
}

const OK = { ok: true as const, wert: undefined };

beforeEach(() => {
  vi.clearAllMocks();
  ops.reiheEin.mockResolvedValue({ ok: true, wert: { auftragId: "a1" } });
  ops.entferne.mockResolvedValue(OK);
  ops.wiederhole.mockResolvedValue(OK);
  ops.holeStand.mockResolvedValue({ ok: true, wert: stand });
});

describe("verdrahteQueueIPC (#71) - Kanaele", () => {
  it("meldet genau die vier Operations-Kanaele an, die Ereignisse nicht", () => {
    expect(kanaeleNachAufruf.sort()).toEqual(
      [
        KANAELE.queue.reiheEin,
        KANAELE.queue.entferne,
        KANAELE.queue.wiederhole,
        KANAELE.queue.holeStand,
      ].sort(),
    );
  });

  it("meldet keinen Kanal zweimal an", () => {
    expect(doppeltNachAufruf).toEqual([]);
  });

  it("registriert beim blossen Import nichts", () => {
    expect(kanaeleVorAufruf).toEqual([]);
  });

  it("reicht art und payload unveraendert an reiheEin", async () => {
    const payload = { projektId: "p1", quellPfad: "C:\\a.mp4" };
    await rufe(KANAELE.queue.reiheEin, { art: "import", payload });

    expect(ops.reiheEin).toHaveBeenCalledWith("import", payload);
  });

  it("reicht das Ergebnis von reiheEin unveraendert durch", async () => {
    const antwort = { ok: true as const, wert: { auftragId: "a7" } };
    ops.reiheEin.mockResolvedValue(antwort);

    await expect(
      rufe(KANAELE.queue.reiheEin, { art: "render", payload: {} }),
    ).resolves.toBe(antwort);
  });

  it("reicht Fachcode und daten eines Fehlschlags unveraendert durch", async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: { code: "nicht_gefunden", meldung: "weg", daten: { auftragId: "a1" } },
    };
    ops.entferne.mockResolvedValue(fehlschlag);

    await expect(rufe(KANAELE.queue.entferne, { auftragId: "a1" })).resolves.toBe(fehlschlag);
  });

  it("packt auftragId aus und trimmt sie nicht", async () => {
    await rufe(KANAELE.queue.entferne, { auftragId: " a1 ", unfug: true });
    await rufe(KANAELE.queue.wiederhole, { auftragId: "a2" });

    expect(ops.entferne).toHaveBeenCalledWith(" a1 ");
    expect(ops.wiederhole).toHaveBeenCalledWith("a2");
  });

  it("laesst holeStand ohne Nutzlast arbeiten und ignoriert eine uebergebene", async () => {
    await expect(rufe(KANAELE.queue.holeStand)).resolves.toMatchObject({ ok: true });
    await expect(rufe(KANAELE.queue.holeStand, { unerwartet: 1 })).resolves.toMatchObject({
      ok: true,
    });
    expect(ops.holeStand).toHaveBeenCalledWith();
  });
});

describe("verdrahteQueueIPC (#71) - Nutzlast-Pruefung", () => {
  it("lehnt eine unbekannte art ab, ohne reiheEin aufzurufen", async () => {
    const ergebnis = await rufe(KANAELE.queue.reiheEin, { art: "bla", payload: {} });

    expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    expect(ops.reiheEin).not.toHaveBeenCalled();
  });

  it("lehnt geerbte Eigenschaften als art ab", async () => {
    // `art in ARTEN` statt Object.hasOwn liesse 'toString' und 'constructor' durch.
    for (const art of ["toString", "constructor", "__proto__"]) {
      const ergebnis = await rufe(KANAELE.queue.reiheEin, { art, payload: {} });
      expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    }
    expect(ops.reiheEin).not.toHaveBeenCalled();
  });

  it("lehnt einen payload ab, der kein Objekt ist", async () => {
    for (const payload of [null, "x", 42, ["a"], undefined]) {
      const ergebnis = await rufe(KANAELE.queue.reiheEin, { art: "export", payload });
      expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    }
    expect(ops.reiheEin).not.toHaveBeenCalled();
  });

  it("lehnt eine Nutzlast ab, die kein Objekt ist", async () => {
    for (const kanal of [
      KANAELE.queue.reiheEin,
      KANAELE.queue.entferne,
      KANAELE.queue.wiederhole,
    ]) {
      for (const kaputt of [null, "a1", 42, ["a1"], undefined]) {
        const ergebnis = await rufe(kanal, kaputt);
        expect(ergebnis).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
      }
    }
    expect(ops.reiheEin).not.toHaveBeenCalled();
    expect(ops.entferne).not.toHaveBeenCalled();
    expect(ops.wiederhole).not.toHaveBeenCalled();
  });

  it("lehnt eine leere auftragId ab, ohne die Operation aufzurufen", async () => {
    for (const auftragId of ["", "   ", 42, null]) {
      const a = await rufe(KANAELE.queue.entferne, { auftragId });
      const b = await rufe(KANAELE.queue.wiederhole, { auftragId });
      expect(a).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
      expect(b).toMatchObject({ ok: false, fehler: { code: "ungueltige_eingabe" } });
    }
    expect(ops.entferne).not.toHaveBeenCalled();
    expect(ops.wiederhole).not.toHaveBeenCalled();
  });
});

describe("verdrahteQueueIPC (#71) - Ereignisse", () => {
  it("schickt den Stand genau einmal und als nacktes Array", async () => {
    const auftraege: Auftrag[] = [];
    ops.holeStand.mockResolvedValue({ ok: true, wert: auftraege });

    await sendeQueueGeaendert();

    expect(fenster.webContents.send).toHaveBeenCalledTimes(1);
    expect(fenster.webContents.send).toHaveBeenCalledWith(KANAELE.queue.geaendert, auftraege);
  });

  it("gibt eine Stoerung als Klartext weiter", () => {
    meldeQueueStoerung("Stand nicht ermittelbar");

    expect(fenster.webContents.send).toHaveBeenCalledTimes(1);
    expect(fenster.webContents.send).toHaveBeenCalledWith(
      KANAELE.queue.stoerung,
      "Stand nicht ermittelbar",
    );
  });

  it("schickt bei nicht ermittelbarem Stand keinen Stand, sondern eine Stoerung", async () => {
    ops.holeStand.mockResolvedValue({
      ok: false,
      fehler: { code: "unbekannter_fehler", meldung: "Q2 unlesbar" },
    });

    await sendeQueueGeaendert();

    expect(fenster.webContents.send).toHaveBeenCalledTimes(1);
    expect(fenster.webContents.send.mock.calls[0]?.[0]).toBe(KANAELE.queue.stoerung);
  });

  it("verwirft still, wenn das Fenster zerstoert ist, und liefert nichts nach", async () => {
    const eigenes = baueFenster();
    verdrahteQueueIPC(eigenes);
    eigenes.zerstoere();

    await expect(sendeQueueGeaendert()).resolves.toBeUndefined();
    expect(eigenes.webContents.send).not.toHaveBeenCalled();

    eigenes.schliesse();
  });

  it("meldet beim Schliessen des Fensters BEIDE Hoerer ab", async () => {
    const eigenes = baueFenster();
    verdrahteQueueIPC(eigenes);

    await sendeQueueGeaendert();
    meldeQueueStoerung("noch da");
    expect(eigenes.webContents.send).toHaveBeenCalledTimes(2);

    eigenes.schliesse();
    eigenes.webContents.send.mockClear();

    await sendeQueueGeaendert();
    meldeQueueStoerung("nach dem Schliessen");
    expect(eigenes.webContents.send).not.toHaveBeenCalled();
  });
});
