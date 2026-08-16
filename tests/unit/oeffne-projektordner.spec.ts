import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #241.
//
// `electron` wird gestellt, weil ein echter `shell.openPath`-Aufruf ein
// Explorer-/Finder-Fenster oeffnete und den Testlauf blockierte - getestet wird die
// Uebergabe an das Betriebssystem, nicht das Betriebssystem selbst.
// `node:fs/promises` wird VOLLSTAENDIG durch Spies ersetzt. `stat` ist der Nachweis
// zur Existenzpruefung; `mkdir` ist die Gegenprobe zum Verbot "es wird NICHTS
// angelegt" (ENTSCHIEDEN 1) - wer einen Ordner anlegte, muesste durch diesen Spy.
// `projektOrdner` (#49) wird als Spion gestellt, weil der echte Aufruf den echten
// Datenort des Entwicklungsrechners beruehrte und dessen Rueckgabewert hier als
// erkennbarer Pfad verfolgbar sein muss (DoD: Meldungen duerfen ihn nicht nennen).

const attrappe = vi.hoisted(() => ({
  openPath: vi.fn(),
  projektOrdner: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: attrappe,
  stat: attrappe.stat,
  mkdir: attrappe.mkdir,
}));
vi.mock("electron", () => ({ shell: { openPath: attrappe.openPath } }));
vi.mock("../../src/main/project-store/pfade", () => ({
  projektOrdner: attrappe.projektOrdner,
}));

const { öffneProjektordner } = await import(
  "../../src/main/project-store/oeffne-projektordner"
);

// Der Rueckgabewert des `projektOrdner`-Spions. Er ist absichtlich kein Pfad, der
// zufaellig in einer Meldung auftauchen koennte, sondern ein eindeutiger Marker -
// so faellt JEDE Stelle auf, an der jemand den Pfad in eine Meldung schriebe.
const PROJEKT_PFAD = "/DATENORT/PROJEKT_MARKER_FUER_DIE_MELDPRUEFUNG/kaputtes-projekt";

function verzeichnis(): { isDirectory: () => boolean } {
  return { isDirectory: () => true };
}

function keineVerzeichnis(): { isDirectory: () => boolean } {
  return { isDirectory: () => false };
}

function enoent(): Error & { code: string } {
  return Object.assign(new Error("ENOENT: kein solches Verzeichnis"), { code: "ENOENT" });
}

beforeEach(() => {
  attrappe.projektOrdner.mockReturnValue(PROJEKT_PFAD);
  attrappe.openPath.mockResolvedValue("");
  attrappe.stat.mockResolvedValue(verzeichnis());
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("regulaerer Weg", () => {
  it("ruft projektOrdner genau einmal mit der uebergebenen Projekt-ID und reicht dessen Rueckgabewert unveraendert an shell.openPath weiter", async () => {
    const id = "kaputtes-projekt";
    const ergebnis = await öffneProjektordner(id);
    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(attrappe.projektOrdner).toHaveBeenCalledTimes(1);
    expect(attrappe.projektOrdner).toHaveBeenCalledWith(id);
    expect(attrappe.openPath).toHaveBeenCalledTimes(1);
    expect(attrappe.openPath).toHaveBeenCalledWith(PROJEKT_PFAD);
  });

  it("liefert bei vorhandenem Verzeichnis und openPath => '' das Ergebnis { ok: true } und ruft openPath genau einmal", async () => {
    await expect(öffneProjektordner("projekt-1")).resolves.toEqual({
      ok: true,
      wert: undefined,
    });
    expect(attrappe.openPath).toHaveBeenCalledTimes(1);
  });

  it("prueft die Existenz mit genau einem stat-Aufruf auf genau den gelieferten Pfad", async () => {
    await öffneProjektordner("projekt-1");
    expect(attrappe.stat).toHaveBeenCalledTimes(1);
    expect(attrappe.stat).toHaveBeenCalledWith(PROJEKT_PFAD);
  });

  it("akzeptiert einen Ordnernamen ohne UUID-Form - diese Datei prueft keine UUID-Form (ENTSCHIEDEN 9)", async () => {
    const ergebnis = await öffneProjektordner("kaputtes-projekt");
    expect(ergebnis).toEqual({ ok: true, wert: undefined });
    expect(attrappe.projektOrdner).toHaveBeenCalledWith("kaputtes-projekt");
    expect(attrappe.openPath).toHaveBeenCalledWith(PROJEKT_PFAD);
  });
});

describe("ungueltige Eingabe", () => {
  it.each<[string, unknown]>([
    ["einen leeren String", ""],
    ["null", null],
    ["undefined", undefined],
    ["einen Nicht-String", 42],
  ])("liefert bei %s ungueltige_eingabe, ohne stat und ohne openPath", async (_bezeichnung, eingabe) => {
    const ergebnis = await öffneProjektordner(eingabe as string);
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: expect.any(String) },
    });
    expect(attrappe.stat).not.toHaveBeenCalled();
    expect(attrappe.openPath).not.toHaveBeenCalled();
  });
});

describe("Fehler der Existenzpruefung", () => {
  it("liefert bei ENOENT nicht_gefunden, ruft openPath nicht und legt nichts an", async () => {
    attrappe.stat.mockRejectedValue(enoent());
    const ergebnis = await öffneProjektordner("projekt-1");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: expect.any(String) },
    });
    expect(attrappe.openPath).not.toHaveBeenCalled();
    expect(attrappe.mkdir).not.toHaveBeenCalled();
  });

  it("liefert bei einem vorhandenen Nicht-Verzeichnis nicht_gefunden und ruft openPath nicht", async () => {
    attrappe.stat.mockResolvedValue(keineVerzeichnis());
    const ergebnis = await öffneProjektordner("projekt-1");
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: "nicht_gefunden", meldung: expect.any(String) },
    });
    expect(attrappe.openPath).not.toHaveBeenCalled();
  });

  it("liefert bei einem anderen stat-Fehler als ENOENT unbekannter_fehler - nicht nicht_gefunden", async () => {
    const spion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    attrappe.stat.mockRejectedValue(
      Object.assign(new Error("EACCES: Zugriff verweigert"), { code: "EACCES" }),
    );
    const ergebnis = await öffneProjektordner("projekt-1");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    expect(attrappe.openPath).not.toHaveBeenCalled();
    spion.mockRestore();
  });
});

describe("Fehler von shell.openPath", () => {
  it("liefert bei einer nicht leeren Fehlerzeichenkette unbekannter_fehler", async () => {
    const spion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    attrappe.openPath.mockResolvedValue("Der Datei-Explorer ist nicht verfuegbar.");
    const ergebnis = await öffneProjektordner("projekt-1");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
    expect(ergebnis.fehler.code).toBe("unbekannter_fehler");
    spion.mockRestore();
  });

  it("faengt einen Wurf von openPath ein - das Ergebnis resolvet statt zu rejecten", async () => {
    const spion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    attrappe.openPath.mockRejectedValue(new Error("Der Datei-Explorer ist nicht erreichbar"));
    await expect(öffneProjektordner("projekt-1")).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        fehler: expect.objectContaining({ code: "unbekannter_fehler" }),
      }),
    );
    spion.mockRestore();
  });

  it("protokolliert den Fehlertext des Betriebssystems intern (console.error) und nennt ihn nicht in der Meldung", async () => {
    const spion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    attrappe.openPath.mockResolvedValue(`kann ${PROJEKT_PFAD} nicht oeffnen`);
    const ergebnis = await öffneProjektordner("projekt-1");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
    expect(ergebnis.fehler.meldung).not.toContain(PROJEKT_PFAD);
    expect(spion).toHaveBeenCalled();
    spion.mockRestore();
  });
});

describe("keine Meldung eines Fehlerpfads nennt den Projektpfad", () => {
  const faelle: Array<[string, () => void]> = [
    ["ENOENT", () => attrappe.stat.mockRejectedValue(enoent())],
    ["Eintrag ist kein Verzeichnis", () => attrappe.stat.mockResolvedValue(keineVerzeichnis())],
    ["anderer stat-Fehler", () => attrappe.stat.mockRejectedValue(new Error("EACCES"))],
    [
      "nicht leere openPath-Meldung",
      () => attrappe.openPath.mockResolvedValue(`kann ${PROJEKT_PFAD} nicht oeffnen`),
    ],
    ["openPath-Wurf", () => attrappe.openPath.mockRejectedValue(new Error(`kaputt: ${PROJEKT_PFAD}`))],
  ];

  it.each(faelle)("bei %s ist der Projektpfad weder in der Meldung noch im Code", async (_fall, einrichten) => {
    const spion = vi.spyOn(console, "error").mockImplementation(() => undefined);
    einrichten();
    const ergebnis = await öffneProjektordner("kaputtes-projekt");
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
    expect(ergebnis.fehler.meldung).not.toContain(PROJEKT_PFAD);
    spion.mockRestore();
  });
});

describe("Grenzen der Datei", () => {
  // Der immer wiederkehrende Verstoes distinguiert nicht zwischen Code und Prosa -
  // deshalb wird hier der KOMMENTARFILTER auf den Quelltext angewendet (Hausform aus
  // ziel-dialog.spec.ts): Ein Verbot, das nur in einem Kommentar steht, ist keines.
  const quelle = readFileSync(
    new URL("../../src/main/project-store/oeffne-projektordner.ts", import.meta.url),
    "utf8",
  );
  const code = quelle
    .split("\n")
    .filter((zeile) => !/^\s*(\/\/|\/?\*)/.test(zeile))
    .join("\n");

  it.each([
    "mkdir",
    "writeFile",
    "readFile",
    "path.join",
    "child_process",
    "mitD1Lock",
    "BrowserWindow",
    "webContents",
    "showItemInFolder",
    "openExternal",
    "'projects'",
  ])("benutzt %s nicht", (verboten) => {
    expect(code).not.toContain(verboten);
  });
});