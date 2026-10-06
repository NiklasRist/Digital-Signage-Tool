import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


// Unit-Test zu #306: die Zuordnung art -> Filter, die Abbruch-Regel und der
// unverändert-durchgereichte Pfad. Electron.dialog ist MOCK (kein Fenster im Test).

let öffneMarkenDateiDialog: typeof import("../../src/main/marken-store/dialog").öffneMarkenDateiDialog;


const showOpenDialog = vi.fn();
vi.mock("electron", () => ({ dialog: { showOpenDialog } }));

beforeEach(async () => {
  vi.resetModules();
  showOpenDialog.mockClear();
  const modul = await import("../../src/main/marken-store/dialog");
  öffneMarkenDateiDialog = modul.öffneMarkenDateiDialog;
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("öffneMarkenDateiDialog (#306)", () => {
  it("'schrift' uebergibt GENAU EINEN Filtereintrag mit extensions GENAU [MARKEN_SCHRIFT_ENDUNG], ohne führenden Punkt", async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

    await öffneMarkenDateiDialog("schrift");

    expect(showOpenDialog).toHaveBeenCalledTimes(1);
    const rohr = showOpenDialog.mock.calls[0]![0] as { filters: Array<{ name: string; extensions: string[] }>; properties: string[] };
    expect(rohr.filters).toHaveLength(1);
    expect(rohr.filters[0]!.extensions).toEqual(["woff2"]);
    expect(rohr.filters[0]!.name).toBe("Schriften (WOFF2)");
    expect(rohr.properties).toEqual(["openFile"]);
  });

  it("'logo' uebergibt GENAU EINEN Filtereintrag mit ALLEN Bild-Endungen (aus FORMAT_WHITELIST.bild, #13)", async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

    await öffneMarkenDateiDialog("logo");

    const rohr = showOpenDialog.mock.calls[0]![0] as { filters: Array<{ name: string; extensions: string[] }>; properties: string[] };
    expect(rohr.filters).toHaveLength(1);
    // Die FORM: alle Bild-Endungen, OHNE führenden Punkt; die Reihenfolge ist nicht
    // verbindlich (deshalb beiderseits sortiert).
    expect([...rohr.filters[0]!.extensions].sort()).toEqual([...["jpg", "jpeg", "png", "webp"]].sort());
    expect(rohr.filters[0]!.name).toBe("Bilder");
    expect(rohr.properties).toEqual(["openFile"]);
  });

  it("ein Abbruch ist ein ERFOLG mit leeren Pfaden (kein Fehler, TK 9.4.3)", async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

    const erg = await öffneMarkenDateiDialog("logo");
    expect(erg.ok).toBe(true);
    if (erg.ok) expect(erg.wert.pfade).toEqual([]);

    const erg2 = await öffneMarkenDateiDialog("schrift");
    expect(erg2.ok).toBe(true);
    if (erg2.ok) expect(erg2.wert.pfade).toEqual([]);
  });

  it("canceled false mit LEEREN Pfaden ist ebenfalls ok: leeres Array, kein Sonderfall", async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });

    const erg = await öffneMarkenDateiDialog("logo");
    expect(erg.ok).toBe(true);
    if (erg.ok) expect(erg.wert.pfade).toEqual([]);
  });

  it("ein Pfad komme UNVERAENDERT durch (nicht normalisiert/getrimmt/verkleinert)", async () => {
    const pfad = "C:\\a\\LoGo.PNG";
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [pfad] });

    const erg = await öffneMarkenDateiDialog("logo");
    expect(erg.ok).toBe(true);
    if (erg.ok) expect(erg.wert.pfade).toEqual([pfad]);
  });

  it("MEHRERE Pfade vom Betriebssystem kommen ALLE unverändert in derselben Reihenfolge durch", async () => {
    const pfade = ["C:\\a\\x.png", "C:\\b\\y.jpg", "C:\\c\\z.webp"];
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: pfade });

    const erg = await öffneMarkenDateiDialog("logo");
    expect(erg.ok).toBe(true);
    if (erg.ok) expect(erg.wert.pfade).toEqual(pfade);
  });

  it("ein Wert AUSSERHALB der Union lieferT ungueltige_eingabe OHNE Dialogaufruf (Spy: null Aufrufe)", async () => {
    const erg = await öffneMarkenDateiDialog("sonst" as unknown as "logo");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("ungueltige_eingabe");
    expect(showOpenDialog).toHaveBeenCalledTimes(0);
  });

  it("ein WERFENDER Dialog lieferT unbekannter_fehler, KEIN Stacktrace in der Meldung", async () => {
    showOpenDialog.mockImplementation(() => { throw new Error("kein Fenster"); });

    const erg = await öffneMarkenDateiDialog("logo");

    expect(erg.ok).toBe(false);
    if (erg.ok) return;
    expect(erg.fehler.code).toBe("unbekannter_fehler");
    expect(erg.fehler.meldung.includes("\n")).toBe(false);   // kein Stacktrace (der waere Zeilenweise)
  });
});
