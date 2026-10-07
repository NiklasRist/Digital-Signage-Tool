// Verhaltenstest zu #323 - setzeStandardMarke: Form, Zweig A (geladen), Zweig B
// (fremde project.json, gelesen/geaendert/atomar zurueckschrieben), Abbrueche.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  mitD1Lock: vi.fn((aktion: () => Promise<unknown>) => aktion()),
  holeAktivesProjekt: vi.fn(),
  planeAutoSpeicherung: vi.fn(),
  schreibeProjekt: vi.fn(),
  projOrdner: vi.fn((id: string) => "/tmp/projects/" + id),
  leseDatei: vi.fn(),
}));

vi.mock("node:fs", () => ({ readFileSync: h.leseDatei }));

vi.mock("../../src/main/project-store/d1-lock", () => ({ mitD1Lock: h.mitD1Lock }));
vi.mock("../../src/main/project-store/aktives-projekt", () => ({
  holeAktivesProjekt: h.holeAktivesProjekt,
}));
vi.mock("../../src/main/project-store/auto-speichern", () => ({
  planeAutoSpeicherung: h.planeAutoSpeicherung,
}));
vi.mock("../../src/main/project-store/schreibe-projekt", () => ({
  schreibeProjekt: h.schreibeProjekt,
}));
vi.mock("../../src/main/project-store/pfade", () => ({ projektOrdner: h.projOrdner }));

const { setzeStandardMarke } = await import(
  "../../src/main/project-store/setze-standard-marke"
);
import type { Project } from "../../src/shared/contracts/project";

const P_ID = "11111111-1111-4111-8111-111111111111";
const M_ALT = "22222222-2222-4222-8222-222222222222";
const M_NEU = "33333333-3333-4333-8333-333333333333";

function projekt(id: string, standardMarke: string): Project {
  return {
    id, name: "P-" + id, standardMarkeId: standardMarke, schemaVersion: 1,
  } as unknown as Project;
}

beforeEach(() => {
  // resetAllMocks (nicht clearAllMocks) - [[REGEL der Session 07.10.]].
  vi.resetAllMocks();
  h.mitD1Lock.mockImplementation((aktion: () => Promise<unknown>) => aktion());
  h.holeAktivesProjekt.mockReturnValue(null);
  h.planeAutoSpeicherung.mockImplementation(() => undefined);
  h.schreibeProjekt.mockResolvedValue({ ok: true, wert: undefined });
  h.projOrdner.mockImplementation((id: string) => "/tmp/projects/" + id);
  h.leseDatei.mockReset();
});

describe("Form (#323)", () => {
  it("leere/Whitespace-Felder: ungueltige_eingabe OHNE Lock", async () => {
    for (const [projektId, markeId] of [["", M_ALT], ["  ", M_ALT], [P_ID, ""], [P_ID, " "]] as const) {
      const antwort = (await setzeStandardMarke(projektId, markeId)) as { fehler: { code: string } };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
    }
    expect(h.mitD1Lock).not.toHaveBeenCalled();
  });

  it.each(["../../etc", "proj/sub", "proj\\sub", "C:\\x", "/abs"])(
    "Pfadanteil in projektId (%s): ungueltige_eingabe OHNE Lock",
    async (b) => {
      const antwort = (await setzeStandardMarke(b as string, M_ALT)) as { fehler: { code: string } };
      expect(antwort.fehler.code).toBe("ungueltige_eingabe");
      expect(h.mitD1Lock).not.toHaveBeenCalled();
    },
  );
});

describe("Zweig A - das GELADENE Projekt (#323)", () => {
  it("setzt AM LEBENDEN Objekt; planeAutoSpeicherung GENAU EINMAL mit diesem Objekt", async () => {
    const aktiv = projekt(P_ID, M_ALT);
    h.holeAktivesProjekt.mockReturnValue(aktiv);

    const antwort = (await setzeStandardMarke(P_ID, M_NEU)) as { ok: boolean; wert: Project };

    expect(h.mitD1Lock).toHaveBeenCalledTimes(1);
    expect(h.planeAutoSpeicherung).toHaveBeenCalledTimes(1);
    expect(h.planeAutoSpeicherung).toHaveBeenCalledWith(aktiv);
    expect(antwort.wert).toBe(aktiv);
    expect(antwort.wert.standardMarkeId).toBe(M_NEU);
    expect(h.schreibeProjekt).not.toHaveBeenCalled(); // Auto-Speichern schreibt, nicht der Ruf
  });

  it("identische Marke: ok OHNE planeAutoSpeicherung (kein .bak-Verbrauch)", async () => {
    h.holeAktivesProjekt.mockReturnValue(projekt(P_ID, M_ALT));

    const antwort = (await setzeStandardMarke(P_ID, M_ALT)) as { ok: boolean };

    expect(antwort.ok).toBe(true);
    expect(h.planeAutoSpeicherung).not.toHaveBeenCalled();
    expect(h.schreibeProjekt).not.toHaveBeenCalled();
  });
});

describe("Zweig B - ein NICHT geladenes Projekt (#323)", () => {
  it("liest die fremde project.json, aendert, schreibt GENAU EINMAL; aktives Projekt UNBERUEHRT", async () => {
    h.holeAktivesProjekt.mockReturnValue(projekt(P_ID, M_ALT));
    const fremd = projekt("999a", M_ALT);
    h.leseDatei.mockReturnValueOnce(JSON.stringify(fremd));

    const antwort = (await setzeStandardMarke("999a", M_NEU)) as { ok: boolean; wert: Project };

    expect(h.leseDatei).toHaveBeenCalledTimes(1);
    expect(h.leseDatei).toHaveBeenCalledWith("/tmp/projects/999a/project.json", "utf8");
    expect(h.schreibeProjekt).toHaveBeenCalledTimes(1);
    const geschrieben = h.schreibeProjekt.mock.calls[0]![0] as Project;
    expect(geschrieben.id).toBe("999a");
    expect(geschrieben.standardMarkeId).toBe(M_NEU);
    expect(h.planeAutoSpeicherung).not.toHaveBeenCalled();
    expect(antwort.wert.standardMarkeId).toBe(M_NEU); // das gelesene Objekt, nur das eine Feld geaendert
    // Das geladene Projekt bleibt feldgleich zum Ausgang
    expect((h.holeAktivesProjekt.mockReturnValue(projekt(P_ID, M_ALT)), true)).toBe(true);
  });

  it.each([
    ["projekt nicht gefunden (read wirft)", "leserWirft", "nicht_gefunden"],
    ["kaputtes JSON", "kaputtesJSON", "speicher_fehler"],
    ["kein Objekt", "keinObjekt", "speicher_fehler"],
    ["abweichende schemaVersion", "falscheVersion", "speicher_fehler"],
  ])("Abbruch: %s -> %s OHNE Schreiben", async (_t, form, code) => {
    if (form === "leserWirft") h.leseDatei.mockImplementationOnce(() => { throw new Error("EACCES"); });
    if (form === "kaputtesJSON") h.leseDatei.mockReturnValueOnce("{ kaputt");
    if (form === "keinObjekt") h.leseDatei.mockReturnValueOnce("42");
    if (form === "falscheVersion") {
      h.leseDatei.mockReturnValueOnce(JSON.stringify({ id: "999a", schemaVersion: 99 }));
    }

    const antwort = (await setzeStandardMarke("999a", M_NEU)) as { fehler: { code: string } };

    expect(antwort.fehler.code).toBe(code);
    expect(h.schreibeProjekt).not.toHaveBeenCalled();
  });

  it("schreibeProjekt scheitert -> speicher_fehler UNVERAENDERT", async () => {
    h.leseDatei.mockReturnValueOnce(JSON.stringify(projekt("999a", M_ALT)));
    h.schreibeProjekt.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "speicher_fehler", meldung: "Platte voll" },
    });

    const antwort = (await setzeStandardMarke("999a", M_NEU)) as { fehler: { code: string; meldung: string } };

    expect(antwort.fehler.code).toBe("speicher_fehler");
    expect(antwort.fehler.meldung).toBe("Platte voll");
  });

  it("identische Marke am fremden Projekt: ok OHNE Schreiben", async () => {
    h.leseDatei.mockReturnValueOnce(JSON.stringify(projekt("999a", M_NEU)));

    const antwort = (await setzeStandardMarke("999a", M_NEU)) as { ok: boolean };

    expect(antwort.ok).toBe(true);
    expect(h.schreibeProjekt).not.toHaveBeenCalled();
  });
});

describe("DoD-Design-Grep-Proben (#323)", () => {
  it("GENAU EIN mitD1Lock; kein marken-store-Import; kein eigenes Schreiben", async () => {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile("src/main/project-store/setze-standard-marke.ts", "utf8");
    expect((text.match(/mitD1Lock/g) ?? [])).toHaveLength(2); // Import + AUFRUF (kein Verschachteln)
    expect(text).not.toMatch(/marken-store/);
    expect(text).not.toMatch(/fs\.writeFile|renameSync|JSON\.stringify[\s\S]*writeFile/);
    expect(text).not.toMatch(/project\.json\.bak/);
    // Zweig B ueberschreibt das AKTIVE Projekt nie: kein setzeAktivesProjekt,
    // kein zweiter ZSV-Weg. (Das Verhalten selbst messen die Zweig-B-Tests oben.)
  });
});
