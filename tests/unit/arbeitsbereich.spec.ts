import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #172.
//
// DIESE TESTS LAUFEN AUF EINER ECHTEN PLATTE, und zwar mit Absicht. Die Funktionen
// LOESCHEN VERZEICHNISSE REKURSIV; eine Attrappe koennte zwar zeigen, dass `rm` mit
// den richtigen Argumenten gerufen wurde, aber nicht, dass am Ende die richtigen
// Ordner noch DA sind. Genau das ist hier die Aussage - deshalb legt jeder Test
// ausdruecklich Dinge an, die ueberleben MUESSEN, und prueft hinterher ihren Inhalt.
//
// Attrappen kommen nur dort zum Einsatz, wo sich der Zustand nicht herstellen laesst:
// eine volle Platte (`ENOSPC`), ein fehlendes Schreibrecht (`EACCES`) und ein
// nachhaengendes Windows-Handle (`EBUSY`).
//
// DAS TEMP-VERZEICHNIS WIRD UNTERGESCHOBEN. `raeumeVerwaisteArbeitsbereiche` fegt
// alles Verwaiste aus `os.tmpdir()`; liefe der Test gegen das ECHTE Temp-Verzeichnis,
// loeschte er dort Ordner, die ihm nicht gehoeren - womoeglich den Arbeitsbereich
// eines gerade laufenden Renders. Deshalb zeigt `tmpdir()` in fast allen Tests auf
// einen eigenen Ordner unterhalb des echten Temp-Verzeichnisses. Die EINE Ausnahme
// ist der Nachweis, dass ohne Attrappe wirklich `os.tmpdir()` benutzt wird.
const attrappe = vi.hoisted(() => ({
  temp: null as string | null,
  mkdtemp: null as (() => Promise<string>) | null,
  rm: null as ((pfad: string) => Promise<void>) | null,
  readdir: null as (() => Promise<never>) | null,
}));

vi.mock("node:os", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:os")>();
  return { ...echt, tmpdir: vi.fn(() => attrappe.temp ?? echt.tmpdir()) };
});

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return {
    ...echt,
    mkdtemp: vi.fn((praefix: string) =>
      attrappe.mkdtemp === null ? echt.mkdtemp(praefix) : attrappe.mkdtemp(),
    ),
    rm: vi.fn((pfad: string, optionen?: Parameters<typeof echt.rm>[1]) =>
      attrappe.rm === null ? echt.rm(pfad, optionen) : attrappe.rm(pfad),
    ),
    readdir: vi.fn((pfad: string, optionen: { withFileTypes: true }) =>
      attrappe.readdir === null ? echt.readdir(pfad, optionen) : attrappe.readdir(),
    ),
  };
});

const { mkdtemp, rm } = await import("node:fs/promises");
const {
  ARBEITSBEREICH_PRAEFIX,
  LOESCH_VERSUCHE,
  LOESCH_WARTEZEITEN_MS,
  VERWAIST_AB_MS,
  erzeugeArbeitsbereich,
  raeumeVerwaisteArbeitsbereiche,
  verwirfArbeitsbereich,
} = await import("../../src/main/render-service/arbeitsbereich");

// Alles liegt unter EINER Wurzel im echten Temp-Verzeichnis: `TEMP` spielt das
// Temp-Verzeichnis, `FREMD` liegt daneben und steht fuer "alles ausserhalb".
const WURZEL = mkdtempSync(path.join(os.tmpdir(), "ds-arbeitsbereich-"));
const TEMP = path.join(WURZEL, "temp");
const FREMD = path.join(WURZEL, "fremd");

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`rm ${code}`), { code });
}

/** `rm` meldet `code`, bis `erfolgAb` erreicht ist. `Infinity` = nie Erfolg. */
function meldet(code: string, erfolgAb = Number.POSITIVE_INFINITY): void {
  let ruf = 0;
  attrappe.rm = async () => {
    ruf += 1;
    if (ruf >= erfolgAb) {
      return;
    }
    throw systemfehler(code);
  };
}

/** Spult die ganze Staffel ab, ohne echte Zeit zu verbrauchen. */
async function spuleVor(): Promise<void> {
  for (const ms of LOESCH_WARTEZEITEN_MS) {
    await vi.advanceTimersByTimeAsync(ms);
  }
}

/** Legt einen Ordner mit einer Datei darin an und liefert den Ordnerpfad. */
function ordnerMitInhalt(elternteil: string, name: string): string {
  const ordner = path.join(elternteil, name);
  mkdirSync(ordner, { recursive: true });
  writeFileSync(path.join(ordner, "schatz.txt"), "unersetzlich");
  return ordner;
}

/** Setzt die Aenderungszeit so weit zurueck, dass der Ordner als verwaist gilt. */
function altere(pfad: string): void {
  const vorher = new Date(Date.now() - VERWAIST_AB_MS - 60_000);
  utimesSync(pfad, vorher, vorher);
}

function inhaltIstHeil(ordner: string): boolean {
  return (
    existsSync(ordner) && readFileSync(path.join(ordner, "schatz.txt"), "utf8") === "unersetzlich"
  );
}

beforeEach(() => {
  attrappe.mkdtemp = null;
  attrappe.rm = null;
  attrappe.readdir = null;
  attrappe.temp = TEMP;
  vi.mocked(mkdtemp).mockClear();
  vi.mocked(rm).mockClear();
  rmSync(TEMP, { recursive: true, force: true });
  rmSync(FREMD, { recursive: true, force: true });
  mkdirSync(TEMP, { recursive: true });
  mkdirSync(FREMD, { recursive: true });
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  rmSync(WURZEL, { recursive: true, force: true });
});

describe("erzeugeArbeitsbereich (#172) legt je Lauf einen eigenen leeren Ordner an", () => {
  it("liefert zweimal hintereinander verschiedene, existierende, leere Ordner", async () => {
    const erster = await erzeugeArbeitsbereich();
    const zweiter = await erzeugeArbeitsbereich();

    expect(erster.ok).toBe(true);
    expect(zweiter.ok).toBe(true);
    if (!erster.ok || !zweiter.ok) return;

    expect(erster.wert).not.toBe(zweiter.wert);
    for (const pfad of [erster.wert, zweiter.wert]) {
      expect(path.basename(pfad).startsWith(ARBEITSBEREICH_PRAEFIX)).toBe(true);
      expect(path.dirname(pfad)).toBe(TEMP);
      expect(statSync(pfad).isDirectory()).toBe(true);
      // ENTSCHIEDEN 9: kein `png/`, kein `clips/`, keine Platzhalterdatei.
      expect(readdirSync(pfad)).toEqual([]);
    }
  });

  it("legt den Ordner ohne Attrappe wirklich unterhalb von os.tmpdir() an", async () => {
    attrappe.temp = null;

    const ergebnis = await erzeugeArbeitsbereich();

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    try {
      expect(path.dirname(path.resolve(ergebnis.wert))).toBe(path.resolve(os.tmpdir()));
    } finally {
      rmSync(ergebnis.wert, { recursive: true, force: true });
    }
  });
});

describe("erzeugeArbeitsbereich (#172) wandelt jeden Fehler in ein Ergebnis", () => {
  it("meldet eine volle Platte als kein_platz und nennt Ort und Grund", async () => {
    attrappe.mkdtemp = async () => {
      throw systemfehler("ENOSPC");
    };

    const ergebnis = await erzeugeArbeitsbereich();

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("kein_platz");
    expect(ergebnis.fehler.meldung).toContain("ENOSPC");
    expect(ergebnis.fehler.meldung).toContain(TEMP);
  });

  it.each(["EACCES", "EPERM", "EROFS", "EWASAUCHIMMER"])(
    "meldet %s als speicher_fehler, mit dem Code nur in der Meldung",
    async (code) => {
      attrappe.mkdtemp = async () => {
        throw systemfehler(code);
      };

      const ergebnis = await erzeugeArbeitsbereich();

      expect(ergebnis.ok).toBe(false);
      if (ergebnis.ok) return;
      expect(ergebnis.fehler.code).toBe("speicher_fehler");
      expect(ergebnis.fehler.meldung).toContain(code);
    },
  );

  it("wandelt eine Ausnahme ohne Systemcode in unbekannter_fehler, statt zu werfen", async () => {
    attrappe.mkdtemp = () => {
      throw "kein Systemfehler";
    };

    const ergebnis = await erzeugeArbeitsbereich();

    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
  });
});

describe("verwirfArbeitsbereich (#172) entfernt den Arbeitsbereich samt Inhalt", () => {
  it("entfernt den Ordner mit allem, was darin liegt", async () => {
    const bereich = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}voll`);
    writeFileSync(path.join(bereich, "seg_000.mp4"), "clip");
    mkdirSync(path.join(bereich, "unterordner"));
    writeFileSync(path.join(bereich, "unterordner", "concat.txt"), "liste");

    await verwirfArbeitsbereich(bereich);

    expect(existsSync(bereich)).toBe(false);
  });

  it("laeuft auch beim zweiten Aufruf ohne Fehler durch (idempotent)", async () => {
    const bereich = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}zweimal`);

    await expect(verwirfArbeitsbereich(bereich)).resolves.toBeUndefined();
    await expect(verwirfArbeitsbereich(bereich)).resolves.toBeUndefined();
    expect(existsSync(bereich)).toBe(false);
  });
});

describe("verwirfArbeitsbereich (#172) fasst nichts an, was kein Arbeitsbereich ist", () => {
  // DER WICHTIGSTE TEIL DIESER DATEI. Hinter der Schranke steht ein rekursives
  // Loeschen; jeder Fall hier ist einer, in dem fremde Daten verschwinden wuerden.
  it("ruft rm bei keinem der verbotenen Eingaenge auch nur ein einziges Mal", async () => {
    const ausserhalb = ordnerMitInhalt(FREMD, `${ARBEITSBEREICH_PRAEFIX}fremd`);
    const ohnePraefix = ordnerMitInhalt(TEMP, "arbeit-ohne-praefix");
    const echterBereich = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}echt`);
    const enkel = ordnerMitInhalt(echterBereich, "unterordner");
    // Ausbruch ueber `..`: Nach dem Aufloesen ist das `ausserhalb` von oben - der
    // Basisname traegt also das gueltige Praefix, nur der Elternteil stimmt nicht.
    const ausbruch = path.join(
      TEMP,
      `${ARBEITSBEREICH_PRAEFIX}a`,
      "..",
      "..",
      "fremd",
      `${ARBEITSBEREICH_PRAEFIX}fremd`,
    );

    const verboten: unknown[] = [
      "",
      "   ",
      undefined,
      null,
      42,
      // ein Pfad ausserhalb des Temp-Verzeichnisses - MIT gueltigem Praefix
      ausserhalb,
      // im Temp-Verzeichnis, aber ohne Praefix
      ohnePraefix,
      // das Temp-Verzeichnis selbst
      TEMP,
      // ein Enkel: liegt IM Arbeitsbereich, ist aber selbst keiner
      enkel,
      ausbruch,
    ];

    for (const eingang of verboten) {
      await expect(verwirfArbeitsbereich(eingang as string)).resolves.toBeUndefined();
    }

    expect(rm).not.toHaveBeenCalled();
    // Und der Beweis auf der Platte: alles noch da, mit unveraendertem Inhalt.
    expect(inhaltIstHeil(ausserhalb)).toBe(true);
    expect(inhaltIstHeil(ohnePraefix)).toBe(true);
    expect(inhaltIstHeil(echterBereich)).toBe(true);
    expect(inhaltIstHeil(enkel)).toBe(true);
    expect(existsSync(TEMP)).toBe(true);
    expect(existsSync(FREMD)).toBe(true);
  });

  it("loescht das Temp-Verzeichnis selbst auch dann nicht, wenn sein Name das Praefix traegt", async () => {
    // Die Praefix-Pruefung allein wuerde diesen Fall durchlassen; erst die Bedingung
    // "das Elternverzeichnis IST das Temp-Verzeichnis" faengt ihn ab. Ein Fehler hier
    // hiesse `rm -r` auf das gesamte Temp-Verzeichnis.
    const alsTemp = ordnerMitInhalt(WURZEL, `${ARBEITSBEREICH_PRAEFIX}temp`);
    attrappe.temp = alsTemp;

    await expect(verwirfArbeitsbereich(alsTemp)).resolves.toBeUndefined();

    expect(rm).not.toHaveBeenCalled();
    expect(inhaltIstHeil(alsTemp)).toBe(true);
    rmSync(alsTemp, { recursive: true, force: true });
  });
});

describe("verwirfArbeitsbereich (#172) wiederholt nur bei belegtem Ordner", () => {
  const belegt = () => path.join(TEMP, `${ARBEITSBEREICH_PRAEFIX}belegt`);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("gelingt beim dritten Versuch nach zweimal EBUSY", async () => {
    meldet("EBUSY", 3);

    const lauf = verwirfArbeitsbereich(belegt());
    await spuleVor();
    await lauf;

    expect(rm).toHaveBeenCalledTimes(3);
  });

  it("wartet zwischen den Versuchen wirklich, statt nur zu zaehlen", async () => {
    meldet("EBUSY");

    const lauf = verwirfArbeitsbereich(belegt());
    await vi.advanceTimersByTimeAsync(0);
    expect(rm).toHaveBeenCalledTimes(1);

    const [erste] = LOESCH_WARTEZEITEN_MS;
    await vi.advanceTimersByTimeAsync(erste - 1);
    expect(rm).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(rm).toHaveBeenCalledTimes(2);

    await spuleVor();
    await lauf;
  });

  it.each(["EBUSY", "EPERM", "ENOTEMPTY"])(
    "gibt bei dauerhaftem %s nach LOESCH_VERSUCHE Versuchen auf, ohne zu werfen",
    async (code) => {
      meldet(code);

      const lauf = verwirfArbeitsbereich(belegt());
      await spuleVor();

      await expect(lauf).resolves.toBeUndefined();
      expect(rm).toHaveBeenCalledTimes(LOESCH_VERSUCHE);
    },
  );

  it.each(["EACCES", "EROFS", "EIO"])("gibt bei %s sofort auf, ohne Wiederholung", async (code) => {
    meldet(code);

    await expect(verwirfArbeitsbereich(belegt())).resolves.toBeUndefined();

    expect(rm).toHaveBeenCalledTimes(1);
  });
});

describe("raeumeVerwaisteArbeitsbereiche (#172) fegt nur, was wirklich verwaist ist", () => {
  it("entfernt den alten Arbeitsbereich und laesst alles andere unangetastet", async () => {
    const alt = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}alt`);
    const frisch = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}frisch`);
    const ohnePraefix = ordnerMitInhalt(TEMP, "arbeit-alt");
    const datei = path.join(TEMP, `${ARBEITSBEREICH_PRAEFIX}notizen.txt`);
    writeFileSync(datei, "keine Kopie davon");
    altere(alt);
    altere(ohnePraefix);
    altere(datei);

    const entfernt = await raeumeVerwaisteArbeitsbereiche();

    expect(entfernt).toBe(1);
    expect(existsSync(alt)).toBe(false);
    // Der frische Ordner kann der laufende Render einer ZWEITEN Instanz mit anderem
    // Datenort sein (ENTSCHIEDEN 4) - er muss unberuehrt bleiben.
    expect(inhaltIstHeil(frisch)).toBe(true);
    expect(inhaltIstHeil(ohnePraefix)).toBe(true);
    expect(readFileSync(datei, "utf8")).toBe("keine Kopie davon");
  });

  it("folgt keiner Verknuepfung, die wie ein Arbeitsbereich heisst", async () => {
    // Windows-Junction bzw. Symlink. Wo das Anlegen nicht erlaubt ist, entfaellt der
    // Nachweis - deshalb steht er in einem eigenen Test und nicht im vorigen.
    const ziel = ordnerMitInhalt(FREMD, "wertvoll");
    const verknuepfung = path.join(TEMP, `${ARBEITSBEREICH_PRAEFIX}verknuepft`);
    let angelegt = true;
    try {
      symlinkSync(ziel, verknuepfung, "junction");
    } catch {
      angelegt = false;
    }
    if (!angelegt) return;
    altere(ziel);

    const entfernt = await raeumeVerwaisteArbeitsbereiche();

    expect(entfernt).toBe(0);
    expect(existsSync(verknuepfung)).toBe(true);
    expect(inhaltIstHeil(ziel)).toBe(true);
  });

  it("zaehlt nur, was wirklich verschwunden ist", async () => {
    const alt = ordnerMitInhalt(TEMP, `${ARBEITSBEREICH_PRAEFIX}unloeschbar`);
    altere(alt);
    // EACCES statt EBUSY: sofortiges Aufgeben, also ohne Wartestaffel und ohne Timer.
    meldet("EACCES");

    const entfernt = await raeumeVerwaisteArbeitsbereiche();

    expect(entfernt).toBe(0);
    expect(inhaltIstHeil(alt)).toBe(true);
  });

  it("liefert 0 und wirft nicht, wenn das Temp-Verzeichnis gar nicht existiert", async () => {
    attrappe.temp = path.join(WURZEL, "gibt-es-nicht");

    await expect(raeumeVerwaisteArbeitsbereiche()).resolves.toBe(0);
    expect(rm).not.toHaveBeenCalled();
  });

  it("liefert 0 und wirft nicht, wenn das Temp-Verzeichnis nicht lesbar ist", async () => {
    attrappe.readdir = async () => {
      throw systemfehler("EACCES");
    };

    await expect(raeumeVerwaisteArbeitsbereiche()).resolves.toBe(0);
    expect(rm).not.toHaveBeenCalled();
  });
});
