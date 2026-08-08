import { existsSync, linkSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

// Integrationstest zu #6: Der Selbsttest muss mit einem Pfad zurechtkommen, der ein
// LEERZEICHEN enthaelt.
//
// WARUM DAS EIN INTEGRATIONSTEST IST UND KEIN UNIT-TEST: Die Aussage lautet "kein
// String-Shell-Aufruf". Ein Unit-Test mit gemocktem child_process wuerde genau die
// Schicht wegmocken, in der der Fehler saesse - er koennte nicht scheitern und bewiese
// deshalb nichts. Hier laeuft ein ECHTES Binary aus einem Ordner mit Leerzeichen.
//
// Warum das in der Praxis zaehlt: Der Datenort liegt neben der portablen EXE (#5), und
// die landet regelmaessig unter "C:\Program Files\..." oder in einem Nutzerordner mit
// Vor- und Nachname. Mit `exec` (Zeichenkette an die Kommandozeile) zerfiele der Aufruf
// am Leerzeichen in Wortteile und scheiterte mit einer Meldung, die auf alles Moegliche
// hindeutet, nur nicht auf die Ursache.

vi.mock("electron", () => ({ app: { isPackaged: false, getPath: () => "" } }));

const { pruefeFfprobeVerfuegbar, ermittleFfprobePfad, ermittleFfmpegPfad } =
  await import("../../src/main/ffmpeg-pfad");

const ordnerMitLeerzeichen = path.join(tmpdir(), "signage test ordner");

afterAll(() => {
  rmSync(ordnerMitLeerzeichen, { recursive: true, force: true });
});

describe("Selbsttest der Binaries", () => {
  it("erkennt das echte ffprobe", async () => {
    await expect(pruefeFfprobeVerfuegbar(ermittleFfprobePfad())).resolves.toBe(true);
  });

  it("kommt mit einem Pfad zurecht, der Leerzeichen enthaelt", async () => {
    mkdirSync(ordnerMitLeerzeichen, { recursive: true });
    const ziel = path.join(ordnerMitLeerzeichen, "ffprobe.exe");
    if (!existsSync(ziel)) {
      // Harte Verknuepfung statt Kopie: dieselbe Datei unter einem zweiten Namen,
      // ohne 60 MB zu bewegen. Liegt der Temp-Ordner auf einem anderen Laufwerk,
      // scheitert das - dann faellt der Test auf eine Kopie zurueck.
      try {
        linkSync(ermittleFfprobePfad(), ziel);
      } catch {
        const { copyFileSync } = await import("node:fs");
        copyFileSync(ermittleFfprobePfad(), ziel);
      }
    }
    expect(ziel).toContain(" ");
    await expect(pruefeFfprobeVerfuegbar(ziel)).resolves.toBe(true);
  });

  it("meldet einen nicht vorhandenen Pfad als nicht benutzbar", async () => {
    // Gegenprobe: Ohne sie waere nicht gezeigt, dass die Pruefung ueberhaupt
    // unterscheidet - eine Funktion, die immer true liefert, bestuende die zwei
    // Tests oben ebenfalls.
    const gibtEsNicht = path.join(ordnerMitLeerzeichen, "kein ffprobe.exe");
    await expect(pruefeFfprobeVerfuegbar(gibtEsNicht)).resolves.toBe(false);
  });

  it("meldet einen leeren Pfad als nicht benutzbar", async () => {
    await expect(pruefeFfprobeVerfuegbar("")).resolves.toBe(false);
  });

  it("liefert fuer ffmpeg einen vorhandenen Pfad", () => {
    expect(existsSync(ermittleFfmpegPfad())).toBe(true);
  });
});
