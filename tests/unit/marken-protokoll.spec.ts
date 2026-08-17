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

// Unit-Test zu #290 (marken://-Handler).
//
// Geprueft wird VERHALTEN an der Aussengrenze: Was kommt aus dem Renderer herein, und
// was faengt der Handler ab, BEVOR er die Platte anfasst. Deshalb sind `readFile` und
// `realpath` echte Funktionen mit Zaehler (kein Ersatz), und der Marken-Ordner liegt
// als echter Ordner im Temp-Verzeichnis - Verknuepfungen kann man nicht nachstellen,
// man muss sie anlegen.
//
// `ermittleDatenOrt` ist ersetzt, damit dieser Ordner der Datenort ist. Das haelt den
// Test aus dem Arbeitsverzeichnis heraus (dort laege sonst `marken-assets/` im Repo)
// und spart zugleich den electron-Ersatz, den pfade.ts sonst braucht.
//
// `electron` ist gemockt, weil marken-protokoll.ts `protocol` importiert. Der Mock
// kennt AUSSCHLIESSLICH `handle` - ein versehentlicher
// `registerSchemesAsPrivileged`-Aufruf in der Quelle scheiterte hier lautlos als
// TypeError. Der DoD-Grep ueber Quell- UND Testdatei ist zusaetzlich im Bericht
// gefuehrt; diese Datei haelt die Zeichenkette deshalb auch nicht in einer Probe.

const gehoben = vi.hoisted(() => ({ datenOrt: "" }));

vi.mock("../../src/main/datenort", () => ({
  ermittleDatenOrt: () => gehoben.datenOrt,
}));

vi.mock("electron", () => ({
  protocol: { handle: vi.fn() },
}));

vi.mock("node:fs/promises", async (echtLaden) => {
  const echt = await echtLaden<typeof import("node:fs/promises")>();
  return { ...echt, readFile: vi.fn(echt.readFile), realpath: vi.fn(echt.realpath) };
});

vi.mock("../../src/main/marken-store/pfade", async (echtLaden) => {
  const echt = await echtLaden<typeof import("../../src/main/marken-store/pfade")>();
  return { ...echt, loeseMarkenDateiPfad: vi.fn(echt.loeseMarkenDateiPfad) };
});

const { readFile, realpath } = await import("node:fs/promises");
const { protocol } = await import("electron");
const { loeseMarkenDateiPfad } = await import("../../src/main/marken-store/pfade");
const { MARKEN_SCHEMA, registriereMarkenProtokollHandler, behandleMarkenAssetAnfrage } =
  await import("../../src/main/marken-store/marken-protokoll");

const MARKE = "7c4f9e12-0000-4000-8000-0123456789ab";
const LOGO = "f3a2b1c4-1111-4111-8111-abcdefabcdef.png";
const SCHRIFT = "8d9e0f1a-2222-4222-8222-fedcbafedcba.woff2";
const INHALT = Buffer.from([0x00, 0x01, 0x02, 0x03]);

const BASIS = mkdtempSync(path.join(os.tmpdir(), "ds-marken-"));
gehoben.datenOrt = BASIS;

const MARKENORDNER = path.join(BASIS, "marken-assets", MARKE);
const AUSSEN = path.join(BASIS, "aussen");
mkdirSync(MARKENORDNER, { recursive: true });
mkdirSync(AUSSEN, { recursive: true });
writeFileSync(path.join(MARKENORDNER, LOGO), INHALT);
writeFileSync(path.join(MARKENORDNER, SCHRIFT), INHALT);
writeFileSync(path.join(AUSSEN, "geheim.png"), Buffer.from([0xff]));

// Als JUNCTION, nicht als Symlink: Ein Datei-Symlink verlangt unter Windows erhoehte
// Rechte, dieser Test liefe dort gar nicht erst an. Auf anderen Systemen ignoriert Node
// die Typangabe und legt einen gewoehnlichen Symlink an - fuer die Pruefung dasselbe.
const VERKNUEPFUNG = "5c0a9f33-3333-4333-8333-fedcbafedcba.png";
const verknuepfungPfad = path.join(MARKENORDNER, VERKNUEPFUNG);
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
  return behandleMarkenAssetAnfrage(new Request(url, { method: methode }));
}

function erwarteKeinenPlattenzugriff(): void {
  expect(readFile).not.toHaveBeenCalled();
  expect(realpath).not.toHaveBeenCalled();
}

describe("MARKEN_SCHEMA", () => {
  it("ist eine Datenkonstante mit scheme 'marken'", () => {
    expect(MARKEN_SCHEMA.scheme).toBe("marken");
  });

  it("traegt genau die vier Privilegien des media-Schemas", () => {
    expect(MARKEN_SCHEMA.privileges).toEqual({
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    });
  });

  it("setzt corsEnabled NICHT (STOPP: Probe steht noch aus)", () => {
    expect(MARKEN_SCHEMA.privileges?.corsEnabled).toBeUndefined();
  });
});

describe("registriereMarkenProtokollHandler", () => {
  it("meldet 'marken' mit genau diesem Schema-Namen und dem eigenen Handler an", () => {
    registriereMarkenProtokollHandler();

    expect(protocol.handle).toHaveBeenCalledTimes(1);
    expect(protocol.handle).toHaveBeenCalledWith("marken", behandleMarkenAssetAnfrage);
  });
});

describe("behandleMarkenAssetAnfrage", () => {
  it("liefert ein Logo mit passendem Inhaltstyp und den Bytes", async () => {
    const antwort = await anfrage(`marken://${MARKE}/${LOGO}`);

    expect(antwort.status).toBe(200);
    expect(antwort.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await antwort.arrayBuffer())).toEqual(INHALT);
  });

  it("liefert eine Schrift mit font/woff2", async () => {
    const antwort = await anfrage(`marken://${MARKE}/${SCHRIFT}`);

    expect(antwort.status).toBe(200);
    expect(antwort.headers.get("content-type")).toBe("font/woff2");
  });

  it("loest eine gueltige Anfrage ausschliesslich ueber loeseMarkenDateiPfad auf", async () => {
    await anfrage(`marken://${MARKE}/${LOGO}`);

    expect(loeseMarkenDateiPfad).toHaveBeenCalledTimes(1);
    expect(loeseMarkenDateiPfad).toHaveBeenCalledWith(MARKE, LOGO);
  });

  it("weist POST ab, ohne aufzuloesen", async () => {
    const antwort = await anfrage(`marken://${MARKE}/${LOGO}`, "POST");

    expect(antwort.status).not.toBe(200);
    expect(loeseMarkenDateiPfad).not.toHaveBeenCalled();
    erwarteKeinenPlattenzugriff();
  });

  it("dekodiert VOR der Aufloesung und weist den kodierten Ausbruch ab", async () => {
    // Der Kern dieses Issues: %2e%2e%2f ist "../". Dekodierte der Handler erst nach der
    // Aufloesung, saehe #288 einen harmlosen Dateinamen und liesse ihn durch.
    const antwort = await anfrage(`marken://${MARKE}/%2e%2e%2f%2e%2e%2fgeheim.png`);

    expect(antwort.status).not.toBe(200);
    expect(loeseMarkenDateiPfad).toHaveBeenCalledWith(MARKE, "../../geheim.png");
    erwarteKeinenPlattenzugriff();
  });

  it.each([
    ["zusaetzliche Pfadebene", `marken://${MARKE}/unter/${LOGO}`],
    ["fehlender Dateiname", `marken://${MARKE}/`],
    ["Query-String", `marken://${MARKE}/${LOGO}?roh=1`],
    ["kaputte Prozentfolge", `marken://${MARKE}/%zz.png`],
  ])("weist die Adresse ab (%s)", async (_beschreibung, url) => {
    const antwort = await anfrage(url);

    expect(antwort.status).not.toBe(200);
    expect(loeseMarkenDateiPfad).not.toHaveBeenCalled();
    erwarteKeinenPlattenzugriff();
  });

  it("antwortet auf eine fehlende Datei mit einem Fehlerstatus", async () => {
    const antwort = await anfrage(
      `marken://${MARKE}/00000000-0000-4000-8000-000000000000.png`,
    );

    expect(antwort.status).not.toBe(200);
    expect(readFile).not.toHaveBeenCalled();
  });

  it.skipIf(!verknuepfungDa)(
    "weist eine Verknuepfung ab, die aus dem Marken-Ordner hinausfuehrt",
    async () => {
      const antwort = await anfrage(`marken://${MARKE}/${VERKNUEPFUNG}`);

      expect(antwort.status).not.toBe(200);
      // Entscheidend ist nicht der Status, sondern dass gar nicht erst gelesen wurde.
      expect(readFile).not.toHaveBeenCalled();
    },
  );

  it("meldet einen Lesefehler als Fehlerstatus, statt zu werfen", async () => {
    const ebusy = Object.assign(new Error("EBUSY"), { code: "EBUSY" });
    vi.mocked(readFile).mockRejectedValueOnce(ebusy);

    const antwort = await anfrage(`marken://${MARKE}/${LOGO}`);

    expect(antwort.status).not.toBe(200);
  });
});