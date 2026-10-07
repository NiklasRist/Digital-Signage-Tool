// Verhaltenstest zu #304 - der Sender des Ereignisses marken:autoSpeichernStatus.
//
// Gemockt wird `electron` (BrowserWindow mit webContents.send-Spy) und aufMarkenSpeichernEreignis
// (#278); die Weitergabe "Meldung unveraendert auf den Kanal" laeuft dagegen ECHT.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KANAELE } from "../../src/shared/contracts/kanaele";

type Hoerer = (ereignis: unknown) => void;

const webContentsSend = vi.fn();
const empfaenglichesFenster = {
  isDestroyed: vi.fn(() => false),
  webContents: { send: webContentsSend },
};
const zerstoertesFenster = {
  isDestroyed: vi.fn(() => true),
  webContents: { send: webContentsSend },
};

const hoererListe: Hoerer[] = [];
const abmeldungen: Hoerer[] = [];

vi.mock("../../src/main/marken-store/speicher-status", () => ({
  aufMarkenSpeichernEreignis: (hoerer: Hoerer) => {
    hoererListe.push(hoerer);
    return () => {
      const index = hoererListe.indexOf(hoerer);
      if (index >= 0) {
        const entfernt = hoererListe.splice(index, 1)[0];
        if (entfernt !== undefined) abmeldungen.push(entfernt);
      }
    };
  },
}));

const { verdrahteMarkenSpeicherstatusIPC } = await import(
  "../../src/main/ipc-gateway/marken-speicherstatus-verdrahtung"
);

function melde(ereignis: unknown): void {
  for (const hoerer of [...hoererListe]) hoerer(ereignis);
}
beforeEach(() => {
  vi.clearAllMocks();
  hoererListe.length = 0;
  abmeldungen.length = 0;
});

describe("verdrahteMarkenSpeicherstatusIPC (#304)", () => {
  it("meldet sich GENAU EINMAL ueber aufMarkenSpeichernEreignis an", () => {
    verdrahteMarkenSpeicherstatusIPC(empfaenglichesFenster as never);
    expect(hoererListe).toHaveLength(1);
  });

  it("eine Fehler-Meldung reist UNVERAENDERT auf marken:autoSpeichernStatus - ohne Huelle", () => {
    verdrahteMarkenSpeicherstatusIPC(empfaenglichesFenster as never);
    melde({ typ: "fehler", code: "speicher_fehler" });
    expect(webContentsSend).toHaveBeenCalledTimes(1);
    expect(webContentsSend).toHaveBeenCalledWith(KANAELE.marken.autoSpeichernStatus, {
      typ: "fehler",
      code: "speicher_fehler",
    });
  });

  it("eine Erfolg-Meldung reist unveraendert; kein Endzustand, kein Zeitstempel zusaetzlich", () => {
    verdrahteMarkenSpeicherstatusIPC(empfaenglichesFenster as never);
    melde({ typ: "gespeichert" });
    expect(webContentsSend).toHaveBeenCalledWith(KANAELE.marken.autoSpeichernStatus, {
      typ: "gespeichert",
    });
    // KEIN zweiter Versand desselben Ereignisses (kein Dauerfeuer, kein Puffer-Wiederholer).
    expect(webContentsSend).toHaveBeenCalledTimes(1);
  });

  it("bei isDestroyed() === true wird NICHT gesendet und NICHT geworfen", () => {
    expect(() =>
      verdrahteMarkenSpeicherstatusIPC(zerstoertesFenster as never),
    ).not.toThrow();
    melde({ typ: "gespeichert" });
    expect(webContentsSend).not.toHaveBeenCalled();
  });

  it("ein Wirf von webContents.send wird gefangen und wirft nicht nach aussen", () => {
    webContentsSend.mockImplementationOnce(() => {
      throw new Error("webContents weg");
    });
    verdrahteMarkenSpeicherstatusIPC(empfaenglichesFenster as never);
    expect(() => melde({ typ: "gespeichert" })).not.toThrow();
  });
});
