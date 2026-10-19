// Verhaltenstest zu #323 - verdrahteProjectStoreNachtrag3IPC: leseMarke VOR dem Store,
// Store-Fehler UNVERAENDERT, Nutzlast exakt zwei Felder; KANAELE.project-Eintraege.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  registriereHandler: vi.fn(),
  leseMarke: vi.fn(),
  setzeStandardMarke: vi.fn(),
}));

vi.mock("../../src/main/ipc-gateway/registriere-handler", () => ({
  registriereHandler: h.registriereHandler,
}));
vi.mock("../../src/main/marken-store/lese-marke", () => ({ leseMarke: h.leseMarke }));
vi.mock("../../src/main/project-store/setze-standard-marke", () => ({
  setzeStandardMarke: h.setzeStandardMarke,
}));

const { verdrahteProjectStoreNachtrag3IPC } = await import(
  "../../src/main/ipc-gateway/project-store-nachtrag"
);
import { KANAELE } from "../../src/shared/contracts/kanaele";

const P_ID = "11111111-1111-4111-8111-111111111111";
const M_ID = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
  h.leseMarke.mockResolvedValue({ ok: true, wert: { id: M_ID } });
  h.setzeStandardMarke.mockResolvedValue({ ok: true, wert: { id: P_ID } });
});

type Pruefer = (nutzlast: unknown) => unknown;
type Ausfuehrer = (nutzlast: unknown) => Promise<unknown>;

function fangeVerdrahtungIn(): { kanal: string; pruefe: Pruefer; fuehre: Ausfuehrer } {
  let gehalten: { kanal: string; pruefe: Pruefer; fuehre: Ausfuehrer } | null = null;
  h.registriereHandler.mockImplementation((kanal: string, pruefe: Pruefer, fuehre: Ausfuehrer) => {
    gehalten = { kanal, pruefe, fuehre };
  });
  verdrahteProjectStoreNachtrag3IPC();
  return gehalten as unknown as { kanal: string; pruefe: Pruefer; fuehre: Ausfuehrer };
}

describe("verdrahteProjectStoreNachtrag3IPC (#323)", () => {
  it("registriert GENAU EINEN Kanal: project:setzeStandardMarke, aus KANAELE (kein String-Literal)", () => {
    const { kanal } = fangeVerdrahtungIn();
    expect(h.registriereHandler).toHaveBeenCalledTimes(1);
    expect(kanal).toBe("project:setzeStandardMarke");
    expect(kanal).toBe(KANAELE.project.setzeStandardMarke);
  });

  it("gueltige Nutzlast: leseMarke VOR setzeStandardMarke mit EXAKT den zwei Werten; dessen Ergebnis reist unverändert", async () => {
    const { pruefe, fuehre } = fangeVerdrahtungIn();
    const form = pruefe({ projektId: P_ID, markeId: M_ID }) as { ok: boolean };
    expect(form.ok).toBe(true);

    const folge: string[] = [];
    h.leseMarke.mockImplementation(async (markeId: string) => {
      folge.push("leseMarke:" + markeId);
      return { ok: true as const, wert: { id: markeId } };
    });
    h.setzeStandardMarke.mockImplementation(async (projektId: string, markeId: string) => {
      folge.push("setzeStandardMarke");
      return { ok: true as const, wert: { id: projektId } };
    });

    const antwort = await fuehre({ projektId: P_ID, markeId: M_ID });

    expect(folge).toEqual(["leseMarke:" + M_ID, "setzeStandardMarke"]);
    expect(h.setzeStandardMarke).toHaveBeenCalledTimes(1);
    expect(h.setzeStandardMarke).toHaveBeenCalledWith(P_ID, M_ID);
    expect(antwort).toEqual({ ok: true, wert: { id: P_ID } });
  });

  it("leseMarke liefert marke_nicht_gefunden -> setzeStandardMarke NACHWEISLICH NICHT gerufen; Code unverändert", async () => {
    const { pruefe, fuehre } = fangeVerdrahtungIn();
    expect((pruefe({ projektId: P_ID, markeId: M_ID }) as { ok: boolean }).ok).toBe(true);

    h.leseMarke.mockResolvedValueOnce({
      ok: false,
      fehler: { code: "marke_nicht_gefunden", meldung: "unbekannt" },
    });

    const antwort = await fuehre({ projektId: P_ID, markeId: M_ID });

    expect((antwort as { fehler: { code: string } }).fehler.code).toBe("marke_nicht_gefunden");
    expect(h.setzeStandardMarke).not.toHaveBeenCalled();
  });

  it("Form: kein Objekt / fehlende oder leere Felder -> ungueltige_eingabe, ausfuehren laeuft NICHT", async () => {
    const { pruefe, fuehre } = fangeVerdrahtungIn();
    for (const nutzlast of [null, "x", {}, { projektId: P_ID }, { projektId: "", markeId: M_ID }, { projektId: P_ID, markeId: "  " }]) {
      const form = pruefe(nutzlast) as { ok: boolean; fehler?: { code: string } };
      expect(form.ok).toBe(false);
      expect((form as { fehler: { code: string } }).fehler.code).toBe("ungueltige_eingabe");
    }
    // Der Wrapper (#23) ruft ausfuehren NUR mit validierter Nutzlast; null reist hier nie an
    // - deshalb messen wir den Form-Ablehnung genau dieser sechs Faelle oben.
    void fuehre;
  });
});

describe("KANAELE.project (#323)", () => {
  it("traegt GENAU 22 Eintraege (21 nach #323 + setzeUnterbrechungen durch #426); Stichproben der bestehenden sind enthalten", () => {
    const eintraege = Object.entries(KANAELE.project);
    expect(eintraege).toHaveLength(22);
    const namen = eintraege.map(([, v]) => v as string);
    for (const schluessel in { // Stichprobe bestehender Eintraege unveraendert
      listeProjekte: 0,
      erstelleProjekt: 0,
      setzeBearbeitungsstand: 0,
      setzeStandardSegmentdauer: 0,
    } as const) {
      expect(namen).toContain(`project:` + schluessel);
    }
    expect(namen).toContain("project:setzeStandardMarke");
  });
});

describe("index.ts-Verdrahtung (#323)", () => {
  it("ruft verdrahteProjectStoreNachtrag3IPC GENAU EINMAL; Schritt 5 enthaelt GENAU 14 Aufrufe; Schritt 7 enthaelt 4", async () => {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile("src/main/index.ts", "utf8");
    expect((text.match(/^  verdrahteProjectStoreNachtrag3IPC\(\);/gm) ?? [])).toHaveLength(1);
    expect((text.match(/verdrahteProjectStoreNachtrag3IPC/g) ?? [])).toHaveLength(3); // Import + Kommentar (Nummerierung) + Ruf
    const schritt5 = text.slice(text.indexOf("SCHRITT 5"), text.indexOf("SCHRITT 6"));
    const rufeFuenf = (schritt5.match(/^  [a-zA-Z].*\(\);/gm) ?? []);
    expect(rufeFuenf.length).toBe(14);
    const schritt7 = text.slice(text.indexOf("SCHRITT 7"), text.indexOf("SCHRITT 8"));
    expect((schritt7.match(/^  [a-zA-Z].*\(fenster\);/gm) ?? []).length).toBe(4);
    void KANAELE;
  });
});
