import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Unit-Test zu #50 (media://-Handler).
//
// Geprueft wird VERHALTEN an der Aussengrenze: Was kommt aus dem Renderer herein, und
// was faengt der Handler ab, BEVOR er die Platte anfasst. Deshalb sind `readFile` und
// `realpath` echte Funktionen mit Zaehler (kein Ersatz), und der Medienordner liegt als
// echter Ordner im Temp-Verzeichnis - Verknuepfungen kann man nicht nachstellen, man
// muss sie anlegen.
//
// `ermittleDatenOrt` ist ersetzt, damit dieser Ordner der Datenort ist. Das haelt den
// Test aus dem Arbeitsverzeichnis heraus (dort laege sonst `projects/` im Repo) und
// spart zugleich den electron-Ersatz, den pfade.ts sonst braucht.

const gehoben = vi.hoisted(() => ({ datenOrt: "" }));

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => gehoben.datenOrt,
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return { ...echt, readFile: vi.fn(echt.readFile), realpath: vi.fn(echt.realpath) };
});

vi.mock("../../src/main/project-store/pfade", async (echtLaden) => {
  const echt = await echtLaden<typeof import("../../src/main/project-store/pfade")>();
  return { ...echt, loeseAssetPfad: vi.fn(echt.loeseAssetPfad) };
});

const { readFile, realpath } = await import("node:fs/promises");
const { loeseAssetPfad } = await import("../../src/main/project-store/pfade");
const { behandleMediaAnfrage } = await import(
  "../../src/main/project-store/media-protokoll"
);

const PROJEKT = "3f2a1c4e-0000-4000-8000-0123456789ab";
const DATEI = "9b7d0e21-1111-4111-8111-abcdefabcdef.mp4";
const VERKNUEPFUNG = "5c0a9f33-2222-4222-8222-fedcbafedcba.mp4";
const INHALT = Buffer.from([0x00, 0x01, 0x02, 0x03]);

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-media-"));
gehoben.datenOrt = BASIS;

const MEDIEN = path.join(BASIS, "projects", PROJEKT, "media");
const AUSSEN = path.join(BASIS, "aussen");
mkdirSync(MEDIEN, { recursive: true });
mkdirSync(AUSSEN, { recursive: true });
writeFileSync(path.join(MEDIEN, DATEI), INHALT);
writeFileSync(path.join(AUSSEN, "geheim.mp4"), Buffer.from([0xff]));

// Als JUNCTION, nicht als Symlink: Ein Datei-Symlink verlangt unter Windows erhoehte
// Rechte, dieser Test liefe dort gar nicht erst an. Auf anderen Systemen ignoriert Node
// die Typangabe und legt einen gewoehnlichen Symlink an - fuer die Pruefung dasselbe.
const verknuepfungPfad = path.join(MEDIEN, VERKNUEPFUNG);
let verknuepfungDa = true;
try {
  symlinkSync(AUSSEN, verknuepfungPfad, "junction");
} catch {
  verknuepfungDa = false;
}

afterAll(() => {
  try {
    if (verknuepfungDa) {
      try {
        rmdirSync(verknuepfungPfad);
      } catch {
        unlinkSync(verknuepfungPfad);
      }
    }
    rmSync(BASIS, { recursive: true, force: true });
  } catch {
    // Ein liegengebliebener Temp-Ordner ist kein Testfehler.
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

function anfrage(url: string, methode = "GET"): Promise<Response> {
  return behandleMediaAnfrage(new Request(url, { method: methode }));
}

function erwarteKeinenPlattenzugriff(): void {
  expect(readFile).not.toHaveBeenCalled();
  expect(realpath).not.toHaveBeenCalled();
}

describe("behandleMediaAnfrage", () => {
  it("liefert eine Datei aus dem Medienordner mit passendem Inhaltstyp", async () => {
    const antwort = await anfrage(`media://${PROJEKT}/${DATEI}`);

    expect(antwort.status).toBe(200);
    expect(antwort.headers.get("content-type")).toBe("video/mp4");
    expect(Buffer.from(await antwort.arrayBuffer())).toEqual(INHALT);
  });

  it("weist POST ab, ohne aufzuloesen", async () => {
    const antwort = await anfrage(`media://${PROJEKT}/${DATEI}`, "POST");

    expect(antwort.status).not.toBe(200);
    expect(loeseAssetPfad).not.toHaveBeenCalled();
    erwarteKeinenPlattenzugriff();
  });

  it("dekodiert VOR der Aufloesung und weist den kodierten Ausbruch ab", async () => {
    // Der Kern dieses Issues: %2e%2e%2f ist "../". Dekodierte der Handler erst nach der
    // Aufloesung, saehe #49 einen harmlosen Dateinamen und liesse ihn durch.
    const antwort = await anfrage(`media://${PROJEKT}/%2e%2e%2f%2e%2e%2fgeheim.mp4`);

    expect(antwort.status).not.toBe(200);
    expect(loeseAssetPfad).toHaveBeenCalledWith(PROJEKT, "../../geheim.mp4");
    erwarteKeinenPlattenzugriff();
  });

  it.each([
    ["zusaetzliche Pfadebene", `media://${PROJEKT}/unter/${DATEI}`],
    ["fehlender Dateiname", `media://${PROJEKT}/`],
    ["Query-String", `media://${PROJEKT}/${DATEI}?roh=1`],
    ["kaputte Prozentfolge", `media://${PROJEKT}/%zz.mp4`],
  ])("weist die Adresse ab (%s)", async (_beschreibung, url) => {
    const antwort = await anfrage(url);

    expect(antwort.status).not.toBe(200);
    expect(loeseAssetPfad).not.toHaveBeenCalled();
    erwarteKeinenPlattenzugriff();
  });

  it("antwortet auf eine fehlende Datei mit einem Fehlerstatus", async () => {
    const antwort = await anfrage(`media://${PROJEKT}/00000000-0000-4000-8000-000000000000.mp4`);

    expect(antwort.status).not.toBe(200);
    expect(readFile).not.toHaveBeenCalled();
  });

  it.skipIf(!verknuepfungDa)(
    "weist eine Verknuepfung ab, die aus dem Medienordner hinausfuehrt",
    async () => {
      const antwort = await anfrage(`media://${PROJEKT}/${VERKNUEPFUNG}`);

      expect(antwort.status).not.toBe(200);
      // Entscheidend ist nicht der Status, sondern dass gar nicht erst gelesen wurde.
      expect(readFile).not.toHaveBeenCalled();
    },
  );

  it("meldet einen Lesefehler als Fehlerstatus, statt zu werfen", async () => {
    const ebusy = Object.assign(new Error("EBUSY"), { code: "EBUSY" });
    vi.mocked(readFile).mockRejectedValueOnce(ebusy);

    const antwort = await anfrage(`media://${PROJEKT}/${DATEI}`);

    expect(antwort.status).not.toBe(200);
  });
});
