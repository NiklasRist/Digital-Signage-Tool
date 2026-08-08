import { afterEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #5. Er deckt beide vom Issue verlangten Faelle ab (Dev und gepackt) -
// mit gemocktem `app` und gemocktem `process`, weil die echten Werte im Testlauf immer
// "Dev" ergaeben und der gepackte Zweig damit nie liefe.
//
// WAS DIESER TEST NICHT LEISTET, und das ist wichtig: Er kann nicht beweisen, dass
// PORTABLE_EXECUTABLE_DIR im echten Portable-Build ueberhaupt gesetzt ist und auf den
// Ablageort der EXE zeigt. Genau das ist die entscheidende Frage (#5 nennt sie
// ausdruecklich als eigenen DoD-Punkt), und sie ist nur mit einem echten Build zu
// beantworten: EXE bauen, verschieben, starten, Daten anlegen, neu starten. Ein
// gemockter Test, der hier gruen ist, sagt darueber NICHTS.

const app = { isPackaged: false, getPath: (_name: string) => "" };

vi.mock("electron", () => ({ app }));

const { ermittleDatenOrt } = await import("../../src/main/datenort");

afterEach(() => {
  app.isPackaged = false;
  app.getPath = () => "";
  delete process.env["PORTABLE_EXECUTABLE_DIR"];
  vi.unstubAllGlobals();
});

describe("ermittleDatenOrt", () => {
  it("liefert im Dev-Modus das Projektverzeichnis", () => {
    app.isPackaged = false;
    expect(ermittleDatenOrt()).toBe(process.cwd());
  });

  it("liefert im Dev-Modus bei jedem Aufruf denselben Pfad", () => {
    app.isPackaged = false;
    expect(ermittleDatenOrt()).toBe(ermittleDatenOrt());
  });

  it("nutzt im Portable-Build PORTABLE_EXECUTABLE_DIR", () => {
    app.isPackaged = true;
    app.getPath = () => "C:\\Users\\x\\AppData\\Local\\Temp\\1A2B\\App.exe";
    process.env["PORTABLE_EXECUTABLE_DIR"] = "E:\\Signage";
    expect(ermittleDatenOrt()).toBe("E:\\Signage");
  });

  it("nimmt im Portable-Build NICHT den Pfad der ausfuehrbaren Datei", () => {
    // Die Gegenprobe zur teuersten Falle dieses Issues: Das NSIS-Portable-Target
    // entpackt bei jedem Start nach <Temp>. Wer den Datenort aus execPath ableitet,
    // legt die Projekte dorthin - und Windows raeumt sie weg.
    app.isPackaged = true;
    const tempPfad = "C:\\Users\\x\\AppData\\Local\\Temp\\1A2B\\App.exe";
    app.getPath = () => tempPfad;
    process.env["PORTABLE_EXECUTABLE_DIR"] = "E:\\Signage";
    expect(ermittleDatenOrt()).not.toContain("Temp");
  });

  it("faellt gepackt ohne PORTABLE_EXECUTABLE_DIR auf den Ordner der EXE zurueck", () => {
    app.isPackaged = true;
    app.getPath = () => "D:\\Programme\\Signage\\App.exe";
    expect(ermittleDatenOrt()).toBe("D:\\Programme\\Signage");
  });

  it("nimmt auf macOS den Ordner, der das .app-Bundle enthaelt", () => {
    // Haelt die beabsichtigte Ableitung fest. Sie ist damit NICHT bestaetigt: Der Test
    // rechnet nur nach, was die Funktion rechnet - ob ein echtes macOS-Bundle
    // tatsaechlich so liegt, ist hier nicht geprueft worden (kein macOS-Rechner) und
    // gehoert beim ersten macOS-Build nachgemessen.
    app.isPackaged = true;
    app.getPath = () => "/Volumes/Stick/Signage.app/Contents/MacOS/Signage";
    const echt = process.platform;
    Object.defineProperty(process, "platform", { value: "darwin" });
    try {
      expect(ermittleDatenOrt()).toBe("/Volumes/Stick");
    } finally {
      Object.defineProperty(process, "platform", { value: echt });
    }
  });
});
