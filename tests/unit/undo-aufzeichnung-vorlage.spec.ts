// Verhaltenstests zu #245 - Schnappschuesse im Vorlagen-Editor ausloesen.
//
// `merkeVorlageVorAenderung` (#236) und `leereVorlagenHistorie` (#234) werden durch
// Testdoppel ersetzt (DoD): Genau darum geht es, dass der Sitzungshalter den Schnappschuss
// ueber #236 ausloest und die Historie ueber #234 leert - nicht selbst baut und nicht
// selbst bedient. Der abgelegte Stand wird im merke-Doppel ueber `holeSitzung()` gelesen.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Vorlage } from "../../src/shared/contracts/vorlage";
import type { EditorSitzung } from "../../src/renderer/vorlagen-editor/arbeitskopie";
import type { VorlagenUndoZugang } from "../../src/renderer/app-shell/undo-vorlage";
import {
  baueVorlagenUndoZugang,
  entscheideVorlagenAufzeichnung,
  setzeSitzungshalterZurueck,
  sitzungshalter,
  type Sitzungshalter,
} from "../../src/renderer/app-shell/undo-aufzeichnung-vorlage";

const attrappen = vi.hoisted(() => ({
  merkeVorlageVorAenderung: vi.fn(),
  leereVorlagenHistorie: vi.fn(),
}));

vi.mock("../../src/renderer/app-shell/undo-vorlage", () => ({
  merkeVorlageVorAenderung: attrappen.merkeVorlageVorAenderung,
}));

vi.mock("../../src/renderer/app-shell/undo-historien", () => ({
  leereVorlagenHistorie: attrappen.leereVorlagenHistorie,
}));

function vorlage(id: string, parent: string | null = "v-1"): Vorlage {
  return {
    id,
    name: "Arbeitskopie",
    art: "vollflaeche",
    höhe: null,
    parent,
    eingebaut: false,
    zonen: [],
  };
}

function sitzung(teil: Partial<EditorSitzung> = {}): EditorSitzung {
  return {
    arbeitsId: "ak-1",
    arbeitskopie: vorlage("ak-1"),
    parentId: "v-1",
    parentName: "Vorlage",
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: [],
    ...teil,
  };
}

beforeEach(() => {
  setzeSitzungshalterZurueck();
  attrappen.merkeVorlageVorAenderung.mockReset();
  attrappen.leereVorlagenHistorie.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("entscheideVorlagenAufzeichnung", () => {
  it("liefert 'sitzungsbeginn', wenn jetzt === null - auch dann, wenn s eine Arbeitskopie traegt", () => {
    expect(entscheideVorlagenAufzeichnung(null, sitzung())).toBe("sitzungsbeginn");
  });

  it("liefert 'sitzungswechsel', wenn die arbeitsId abweicht - auch dann, wenn die arbeitskopie-Referenz dieselbe ist (benannter Test)", () => {
    // Reihenfolge-Beleg: Schritt 2 prueft die Kennung VOR Schritt 3 (Referenz).
    const arbeitskopie = vorlage("ak-1");
    const a = sitzung({ arbeitskopie });
    const b = sitzung({ arbeitsId: "ak-2", arbeitskopie });
    expect(b.arbeitskopie).toBe(a.arbeitskopie);
    expect(entscheideVorlagenAufzeichnung(a, b)).toBe("sitzungswechsel");
  });

  it("liefert 'ohne_wirkung' bei gleicher arbeitsId und derselben arbeitskopie-Referenz", () => {
    const a = sitzung();
    const b = sitzung({ arbeitskopie: a.arbeitskopie });
    expect(b.arbeitskopie).toBe(a.arbeitskopie);
    expect(entscheideVorlagenAufzeichnung(a, b)).toBe("ohne_wirkung");
  });

  it("liefert 'ablegen' bei gleicher arbeitsId und neuer arbeitskopie-Referenz - auch dann, wenn der Inhalt gleich ist", () => {
    // Beleg dafuer, dass NICHT tief verglichen wird: gleicher Inhalt, andere Referenz.
    const a = sitzung();
    const b = sitzung({ arbeitskopie: { ...a.arbeitskopie } });
    expect(b.arbeitskopie).not.toBe(a.arbeitskopie);
    expect(entscheideVorlagenAufzeichnung(a, b)).toBe("ablegen");
  });
});

describe("uebernimmAenderung", () => {
  it("Kernnachweis - 'Bearbeitung zeichnet auf': merkeVorlageVorAenderung genau einmal, holeSitzung() danach neu (toBe)", () => {
    const halter = sitzungshalter();
    halter.uebernimmAenderung(sitzung());
    const neu = sitzung({ arbeitskopie: vorlage("ak-1", "v-1") });
    attrappen.merkeVorlageVorAenderung.mockClear();

    halter.uebernimmAenderung(neu);

    expect(attrappen.merkeVorlageVorAenderung).toHaveBeenCalledTimes(1);
    expect(halter.holeSitzung()).toBe(neu);
  });

  it("merkeVorlageVorAenderung wird VOR der Uebernahme gerufen: holeSitzung() liefert im Doppel noch den alten Stand", () => {
    const halter = sitzungshalter();
    const alt = sitzung();
    halter.uebernimmAenderung(alt);
    const neu = sitzung({ arbeitskopie: vorlage("ak-1", "v-1") });

    let zurZeitDesAufrufs: EditorSitzung | null = null;
    attrappen.merkeVorlageVorAenderung.mockImplementation((zugang: VorlagenUndoZugang) => {
      zurZeitDesAufrufs = zugang.holeSitzung();
    });
    halter.uebernimmAenderung(neu);

    expect(zurZeitDesAufrufs).toBe(alt);
    expect(zurZeitDesAufrufs?.arbeitskopie).toBe(alt.arbeitskopie);
  });

  it("Der abgelegte Schnappschuss ist toBe-gleich zu sitzung.arbeitskopie - es wird nicht kopiert", () => {
    const halter = sitzungshalter();
    const alt = sitzung();
    halter.uebernimmAenderung(alt);
    // holeSitzung ist eine LIVE-Referenz auf die laufende Sitzung - der abgelegte Stand
    // muss deshalb im merke-Doppel eingefangen werden (im Moment des Aufrufs), nicht danach.
    let abgelegt: Vorlage | null = null;
    attrappen.merkeVorlageVorAenderung.mockImplementation((zugang: VorlagenUndoZugang) => {
      abgelegt = zugang.holeSitzung()?.arbeitskopie ?? null;
    });
    halter.uebernimmAenderung(sitzung({ arbeitskopie: vorlage("ak-1", "v-1") }));

    expect(abgelegt).toBe(alt.arbeitskopie);
  });

  it("ruft merkeVorlageVorAenderung nicht, wenn der Halter leer war ('sitzungsbeginn')", () => {
    const halter = sitzungshalter();

    halter.uebernimmAenderung(sitzung());

    expect(attrappen.merkeVorlageVorAenderung).not.toHaveBeenCalled();
    expect(halter.holeSitzung()).not.toBeNull();
  });

  it("ruft merkeVorlageVorAenderung nicht bei derselben arbeitskopie-Referenz ('ohne_wirkung')", () => {
    const halter = sitzungshalter();
    const offen = sitzung();
    halter.uebernimmAenderung(offen);
    const unveraendert = sitzung({ arbeitskopie: offen.arbeitskopie });
    attrappen.merkeVorlageVorAenderung.mockClear();

    halter.uebernimmAenderung(unveraendert);

    expect(attrappen.merkeVorlageVorAenderung).not.toHaveBeenCalled();
    expect(halter.holeSitzung()).toBe(unveraendert);
  });

  it("ruft bei einem Sitzungswechsel leereVorlagenHistorie genau einmal und merkeVorlageVorAenderung nicht (benannter Test)", () => {
    const halter = sitzungshalter();
    halter.uebernimmAenderung(sitzung());
    attrappen.merkeVorlageVorAenderung.mockClear();
    attrappen.leereVorlagenHistorie.mockClear();

    halter.uebernimmAenderung(sitzung({ arbeitsId: "ak-2" }));

    expect(attrappen.leereVorlagenHistorie).toHaveBeenCalledTimes(1);
    expect(attrappen.merkeVorlageVorAenderung).not.toHaveBeenCalled();
  });
});

describe("uebernimmSpeicherstand", () => {
  it("ruft merkeVorlageVorAenderung nie und leereVorlagenHistorie nie, uebernimmt die Sitzung aber (toBe)", () => {
    const halter = sitzungshalter();
    halter.uebernimmAenderung(sitzung());
    const nachhall = sitzung({ arbeitskopie: vorlage("ak-1", "v-1") });
    attrappen.merkeVorlageVorAenderung.mockClear();
    attrappen.leereVorlagenHistorie.mockClear();

    halter.uebernimmSpeicherstand(nachhall);

    expect(attrappen.merkeVorlageVorAenderung).not.toHaveBeenCalled();
    expect(attrappen.leereVorlagenHistorie).not.toHaveBeenCalled();
    expect(halter.holeSitzung()).toBe(nachhall);
  });

  it("uebernimmt auch ohne vorherige Sitzung ohne Schnappschuss und ohne Wurf", () => {
    const halter = sitzungshalter();
    const neu = sitzung();

    expect(() => halter.uebernimmSpeicherstand(neu)).not.toThrow();
    expect(attrappen.merkeVorlageVorAenderung).not.toHaveBeenCalled();
    expect(halter.holeSitzung()).toBe(neu);
  });
});

describe("beendeSitzung", () => {
  it("setzt holeSitzung() auf null, ruft leereVorlagenHistorie genau einmal; ein zweiter Aufruf wirft nicht", () => {
    const halter = sitzungshalter();
    halter.uebernimmAenderung(sitzung());
    expect(halter.holeSitzung()).not.toBeNull();
    attrappen.leereVorlagenHistorie.mockClear();

    halter.beendeSitzung();

    expect(halter.holeSitzung()).toBeNull();
    expect(attrappen.leereVorlagenHistorie).toHaveBeenCalledTimes(1);
    expect(() => halter.beendeSitzung()).not.toThrow();
  });

  it("ohne offene Sitzung wirft es nicht und benachrichtigt die Hoerer mit null", () => {
    const halter = sitzungshalter();
    const hoerer = vi.fn();
    halter.aufSitzungGeaendert(hoerer);

    expect(() => halter.beendeSitzung()).not.toThrow();
    expect(hoerer).toHaveBeenCalledTimes(1);
    expect(hoerer).toHaveBeenCalledWith(null);
  });
});

describe("baueVorlagenUndoZugang", () => {
  it("Kernnachweis - 'Rueckgaengig zeichnet nicht auf': setzeSitzung ist toBe-gleich zu uebernimmSpeicherstand, nicht zu uebernimmAenderung", () => {
    const halter = sitzungshalter();
    const sichereStand = vi.fn();
    const zugang = baueVorlagenUndoZugang(halter, sichereStand);

    expect(zugang.setzeSitzung).toBe(halter.uebernimmSpeicherstand);
    expect(zugang.setzeSitzung).not.toBe(halter.uebernimmAenderung);
  });

  it("holeSitzung ist toBe-gleich zu halter.holeSitzung, sichereStand toBe-gleich zum uebergebenen", () => {
    const halter = sitzungshalter();
    const sichereStand = vi.fn();
    const zugang = baueVorlagenUndoZugang(halter, sichereStand);

    expect(zugang.holeSitzung).toBe(halter.holeSitzung);
    expect(zugang.sichereStand).toBe(sichereStand);
  });
});

describe("sitzungshalter", () => {
  it("liefert bei zwei Aufrufen dasselbe Objekt (toBe); setzeSitzungshalterZurueck danach ein anderes", () => {
    const a = sitzungshalter();
    const b = sitzungshalter();
    expect(a).toBe(b);

    setzeSitzungshalterZurueck();
    const c = sitzungshalter();
    expect(c).not.toBe(a);
  });
});

describe("aufSitzungGeaendert", () => {
  it("ruft den Hoerer beim Anmelden nicht; bei jeder Uebernahme und bei beendeSitzung genau einmal", () => {
    const halter = sitzungshalter();
    const hoerer = vi.fn();
    halter.aufSitzungGeaendert(hoerer);
    expect(hoerer).not.toHaveBeenCalled();

    halter.uebernimmAenderung(sitzung());
    halter.uebernimmSpeicherstand(sitzung());
    halter.beendeSitzung();

    expect(hoerer).toHaveBeenCalledTimes(3);
  });

  it("die Abmelde-Funktion beendet das Abo; ein zweiter Aufruf wirft nicht und laesst andere Abos unberuehrt", () => {
    const halter = sitzungshalter();
    const erster = vi.fn();
    const zweiter = vi.fn();
    const abmeldenErster = halter.aufSitzungGeaendert(erster);
    halter.aufSitzungGeaendert(zweiter);

    abmeldenErster();
    expect(() => abmeldenErster()).not.toThrow();

    halter.uebernimmAenderung(sitzung());

    expect(erster).not.toHaveBeenCalled();
    expect(zweiter).toHaveBeenCalledTimes(1);
  });

  it("ein werfender Hoerer verhindert nicht, dass ein zweiter, danach angemeldeter Hoerer gerufen wird; die Uebernahme wirft nicht nach aussen", () => {
    const halter = sitzungshalter();
    const werfender = vi.fn(() => {
      throw new Error("Hoerer kaputt");
    });
    const zweiter = vi.fn();
    halter.aufSitzungGeaendert(werfender);
    halter.aufSitzungGeaendert(zweiter);

    expect(() => halter.uebernimmAenderung(sitzung())).not.toThrow();
    expect(werfender).toHaveBeenCalledTimes(1);
    expect(zweiter).toHaveBeenCalledTimes(1);
  });

  it("ein Hoerer, der sich in seinem eigenen Rueckruf abmeldet, bricht die laufende Benachrichtigung nicht ab", () => {
    const halter = sitzungshalter();
    const erster = vi.fn();
    const mittlerer = vi.fn();
    const dritter = vi.fn();
    halter.aufSitzungGeaendert(erster);
    const abmeldenMittlerer = halter.aufSitzungGeaendert(() => {
      mittlerer();
      abmeldenMittlerer();
    });
    halter.aufSitzungGeaendert(dritter);

    halter.uebernimmAenderung(sitzung());

    // Die laufende Runde laeuft ueber eine Kopie zu Ende: alle drei werden gerufen.
    expect(erster).toHaveBeenCalledTimes(1);
    expect(mittlerer).toHaveBeenCalledTimes(1);
    expect(dritter).toHaveBeenCalledTimes(1);

    // Ab der naechsten Runde ist der mittlere abgemeldet.
    halter.uebernimmAenderung(sitzung({ arbeitskopie: vorlage("ak-1", "v-1") }));
    expect(mittlerer).toHaveBeenCalledTimes(1);
    expect(erster).toHaveBeenCalledTimes(2);
    expect(dritter).toHaveBeenCalledTimes(2);
  });
});

describe("DoD-Grep-Proben (Quelltext)", () => {
  const CODE = readFileSync("src/renderer/app-shell/undo-aufzeichnung-vorlage.ts", "utf8");

  it("enthaelt kein JSX, kein react, kein rufeAuf, kein abonniere, kein KANAELE, kein window, kein localStorage/sessionStorage, kein Timer, kein JSON.stringify/structuredClone, keine Projekt-Historie, kein vorlagenHistorie, kein .ablegen(, kein vollziehe, kein .leere(, kein macheVorlageRueckgaengig und kein Literal 'vorlagen:'", () => {
    for (const verboten of [
      "<div",
      "react",
      "rufeAuf",
      "abonniere",
      "KANAELE",
      "window.",
      "localStorage",
      "sessionStorage",
      "setTimeout",
      "setInterval",
      "JSON.stringify",
      "structuredClone",
      "projektHistorie",
      "leereProjektHistorie",
      "vorlagenHistorie",
      ".ablegen(",
      "vollziehe",
      ".leere(",
      "macheVorlageRueckgaengig",
      "'vorlagen:",
    ]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("importiert aus ../vorlagen-editor/arbeitskopie ausschliesslich einen Typ", () => {
    expect(CODE).toContain(
      "import type { EditorSitzung } from '../vorlagen-editor/arbeitskopie'",
    );
    const importe = CODE.split("\n").filter((z) => z.includes("vorlagen-editor/arbeitskopie"));
    expect(importe.length).toBe(1);
    expect(importe[0]).toContain("import type");
  });
});
