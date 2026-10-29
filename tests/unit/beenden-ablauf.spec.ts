// Verhaltenstest zu #336 - pruefeBeendenUndFlush (Reihenfolge der drei Flushs,
// Wiederholen nur der Gescheiterten, Verwerfen endgueltig) und der Separat-Dialog.
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({
  flushBeimBeenden: vi.fn(),
  flushVorlagenBestand: vi.fn(),
  flushMarkenBestand: vi.fn(),
  registriereEntscheidung: vi.fn(),
  webContentsSend: vi.fn(),
  isDestroyed: vi.fn(() => false),
}));

vi.mock('../../src/main/project-store/auto-speichern', () => ({
  flushBeimBeenden: (nutzlast?: unknown) => h.flushBeimBeenden(nutzlast),
}));
vi.mock('../../src/main/vorlagen-store/schreibe-vorlagen', () => ({
  flushBestand: (nutzlast?: unknown) => h.flushVorlagenBestand(nutzlast),
}));
vi.mock('../../src/main/marken-store/schreibe-marken', () => ({
  flushBestand: (nutzlast?: unknown) => h.flushMarkenBestand(nutzlast),
}));
vi.mock('electron', () => ({
  ipcMain: {
    handleOnce: h.registriereEntscheidung,
  },
  protocol: {},
}))

const { pruefeBeendenUndFlush, flushesBeimBeendenOhneDialogAus, ENTSCHEIDUNG_FRIST_MS } = await import('../../src/main/beenden-ablauf');
const { KANAELE } = await import('../../src/shared/contracts/kanaele');

function fenster(): never {
  throw new Error('Platzhalter');
}
void fenster;

function fesFenster(): {
  isDestroyed: ReturnType<typeof vi.fn>;
  webContents: { send: ReturnType<typeof vi.fn> };
} {
  return { isDestroyed: h.isDestroyed, webContents: { send: h.webContentsSend } };
}

function fehler(code: string, meldung: string): { ok: false; fehler: { code: string; meldung: string } } {
  return { ok: false, fehler: { code, meldung } };
}

beforeEach(() => {
  vi.resetAllMocks();
  h.isDestroyed.mockImplementation(() => false);
  h.registriereEntscheidung.mockImplementation((_kanal: string, hoerer: unknown) => {
    // der Renderer "klickt" direkt: wir loesen die Entscheidung synchron aus
    (hoerer as (ereignis: unknown, nutzlast: { entscheidung: string }) => void)(
      {},
      { entscheidung: 'verwerfen' },
    );
  });
  h.flushBeimBeenden.mockResolvedValue({ ok: true });
  h.flushVorlagenBestand.mockResolvedValue({ ok: true });
  h.flushMarkenBestand.mockResolvedValue({ ok: true });
});

describe('pruefeBeendenUndFlush (#336)', () => {
  it('alle drei erfolgreich: GENAU true; KEIN Ereignis, KEIN Dialog', async () => {
    const erlaubt = await pruefeBeendenUndFlush(fesFenster() as never);
    expect(erlaubt).toBe(true);
    expect(h.flushBeimBeenden).toHaveBeenCalledTimes(1);
    expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(1);
    expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
    expect(h.webContentsSend).toHaveBeenCalledTimes(0);
    // Ereignis-Regeln: kein Senden ohne isDestroyed-Pruefe
    expect(h.isDestroyed).toHaveBeenCalledTimes(0);
  });

  it('ein Flush scheitert: fenster.isDestroyed, Event mit Code und Meldung; Verwerfen endgueltig true', async () => {
    h.flushVorlagenBestand.mockResolvedValue(fehler('speicher_fehler', 'Platte zu voll'));
    const erlaubt = await pruefeBeendenUndFlush(fesFenster() as never);
    expect(erlaubt).toBe(true); // 'verwerfen' - ENDGUeLTIG, kein weiterer Flush
    expect(h.webContentsSend).toHaveBeenCalledTimes(1);
    const [kanal, nutzlast] = h.webContentsSend.mock.calls[0] as unknown as [
      string,
      { berichte: unknown[]; empfehlung: string },
    ];
    expect(kanal).toBe(KANAELE.beenden.status);
    expect(nutzlast.berichte).toHaveLength(1);
    expect(nutzlast.berichte[0]).toEqual({
      speicher: 'vorlagen',
      ok: false,
      code: 'speicher_fehler',
      meldung: 'Platte zu voll',
    });
    expect(nutzlast.empfehlung).toContain('Platte');
    // 'verwerfen' entlaesst das Wiederversuchen: genau EINE Flush-Runde je Bereich.
    expect(h.flushBeimBeenden).toHaveBeenCalledTimes(1);
    // VERWERFEN: nichts wird erneut geschrieben
    expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(1);
  });

  it('antwortet der Renderer NICHT, gilt nach der Frist "verwerfen" - kein Stillstand', async () => {
    // Ein toter Renderer antwortet nie. Ohne Frist bliebe die App im Beenden stehen
    // (Waisen-Prozess vom 27.10.2026) - hier wird die Frist belegt.
    h.registriereEntscheidung.mockImplementation(() => undefined);
    h.flushVorlagenBestand.mockResolvedValue(fehler('speicher_fehler', 'Platte zu voll'));
    vi.useFakeTimers();
    try {
      const lauf = pruefeBeendenUndFlush(fesFenster() as never);
      await vi.advanceTimersByTimeAsync(ENTSCHEIDUNG_FRIST_MS + 1);
      await expect(lauf).resolves.toBe(true);
      expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('wiederholen wiederholt NUR die GESCHEITERTEN; Erfolg dabei -> danach true', async () => {
    expect(true).toBe(true);
    // Setup: project und vorlagen scheitern im ersten Erfassungsversuch, marken gelingt;
    // im zweiten Lauf bleibt marken erfolgreich und gilt als bereits geschrieben - NUR zwei Rufe:
    h.flushBeimBeenden
      .mockResolvedValueOnce(fehler('speicher_fehler', 'x'))
      .mockResolvedValueOnce({ ok: true });
    h.flushVorlagenBestand
      .mockResolvedValueOnce(fehler('speicher_fehler', 'y'))
      .mockResolvedValueOnce({ ok: true });
    h.flushMarkenBestand.mockResolvedValue({ ok: true });
    h.registriereEntscheidung.mockImplementation((_kanal: string, hoerer: unknown) => {
      (hoerer as (ereignis: unknown, nutzlast: { entscheidung: string }) => void)(
        {},
        { entscheidung: 'wiederholen' },
      );
    });

    const erlaubt = await pruefeBeendenUndFlush(fesFenster() as never);

    expect(erlaubt).toBe(true);
    // Erster Lauf (alle drei), dann Wiederholung NUR der beiden Gescheiterten:
    // project 2x, vorlagen 2x, marken GENAU 1x
    expect(h.flushBeimBeenden).toHaveBeenCalledTimes(2);
    expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(2);
    expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
    expect(h.webContentsSend).toHaveBeenCalledTimes(1); // EIN Ereignis fuer beide Berichte
    const [, nutzlast] = h.webContentsSend.mock.calls[0] as unknown as [
      string,
      { berichte: unknown[] },
    ];
    expect(nutzlast.berichte).toHaveLength(2);
  });

  it('isDestroyed: Senden unterlassen, kein Wurf', async () => {
    h.isDestroyed.mockImplementation(() => true);
    h.flushVorlagenBestand.mockResolvedValue(fehler('speicher_fehler', 'isDestroyed'));
    const erlaubt = await pruefeBeendenUndFlush(fesFenster() as never);
    expect(erlaubt).toBe(true);
    expect(h.webContentsSend).toHaveBeenCalledTimes(0);
  });
});

describe('flushesBeimBeendenOhneDialogAus (#427)', () => {
  it('ruft alle drei Flushs GENAU einmal, in der Reihenfolge project, vorlagen, marken', async () => {
    const reihenfolge: string[] = [];
    h.flushBeimBeenden.mockImplementation(async () => {
      reihenfolge.push('project');
      return { ok: true };
    });
    h.flushVorlagenBestand.mockImplementation(async () => {
      reihenfolge.push('vorlagen');
      return { ok: true };
    });
    h.flushMarkenBestand.mockImplementation(async () => {
      reihenfolge.push('marken');
      return { ok: true };
    });

    await flushesBeimBeendenOhneDialogAus();

    expect(reihenfolge).toEqual(['project', 'vorlagen', 'marken']);
    // KEIN Fehler-Dialog: das Fenster wird nicht einmal angefasst.
    expect(h.webContentsSend).toHaveBeenCalledTimes(0);
    expect(h.registriereEntscheidung).toHaveBeenCalledTimes(0);
  });

  it('ein gescheiterter Flush wird verworfen, die uebrigen laufen trotzdem', async () => {
    h.flushVorlagenBestand.mockResolvedValue(fehler('speicher_fehler', 'Platte zu voll'));
    await expect(flushesBeimBeendenOhneDialogAus()).resolves.toBeUndefined();
    expect(h.flushBeimBeenden).toHaveBeenCalledTimes(1);
    expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(1);
    expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
  });

  it('eine ABGELEHNTE Zusage wird geschluckt und beendet den Durchlauf nicht', async () => {
    h.flushBeimBeenden.mockRejectedValue(new Error('EIO'));
    await expect(flushesBeimBeendenOhneDialogAus()).resolves.toBeUndefined();
    // Die beiden folgenden Flushs laufen weiter.
    expect(h.flushVorlagenBestand).toHaveBeenCalledTimes(1);
    expect(h.flushMarkenBestand).toHaveBeenCalledTimes(1);
  });
});
