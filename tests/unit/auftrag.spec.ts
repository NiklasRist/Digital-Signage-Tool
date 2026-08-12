// Vertragstest zu #16 - `AuftragArt`, `AuftragStatus`, `Auftrag`.
//
// DoD 3 verlangt den Nachweis, dass die Union ueber `art` DISKRIMINIERT: Zu
// `art: 'import'` gehoert zwingend ein `ImportRequest`, nie ein `RenderRequest`.
//
// WARUM DAS ZAEHLT: Der Torwaechter (P6) nimmt alle vier Auftragsarten durch
// DIESELBE Warteschlange. Traegt die Art nicht ihre eigene Nutzlast, dann reicht ein
// verwechselter Aufruf, um dem media-service einen Render-Auftrag zu uebergeben -
// und der Fehler faellt erst auf, wenn der Auftrag laeuft, also beim Nutzer.
import { describe, expect, it } from "vitest";

import type { Auftrag, AuftragArt, AuftragStatus } from "../../src/shared/contracts/auftrag";
import type { RenderRequest } from "../../src/shared/contracts/render-request";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 2: genau fuenf Zustaende, geschlossene Union ------------------------
type T1 = Behaupte<
  Gleich<AuftragStatus, "anstehend" | "laeuft" | "erfolg" | "fehlgeschlagen" | "abgebrochen">
>;
type T2 = Behaupte<Gleich<AuftragArt, "import" | "loeschen" | "render" | "export">>;

// Geschlossen heisst: `string` ist NICHT dasselbe.
type T3 = Behaupte<Gleich<Gleich<AuftragStatus, string>, false>>;

// --- DoD 3: die Art bestimmt die Nutzlast ------------------------------------
const importAuftrag: Auftrag = {
  auftragId: "a-1",
  art: "import",
  status: "anstehend",
  label: "Sommerclip importieren",
  payload: { projektId: "p-1", quellPfad: "C:/tmp/clip.mp4" },
  fortschritt: null,
  versuche: 0,
  fehler: null,
  ergebnis: null,
  erstelltAm: "2026-08-11T10:00:00.000Z",
};

// Der Gegenbeweis steht in einer Funktion, die NIE AUFGERUFEN wird.
//
// WARUM NICHT AUF MODULEBENE: Dort stand zuerst `declare const einRenderRequest` mit
// einer Zuweisung darunter. Der Typecheck war gruen - aber `declare` erzeugt keinen
// Wert, und die Zuweisung LIEF beim Testlauf trotzdem: ReferenceError, die ganze
// Datei fiel aus der Sammlung ("0 test"), waehrend die Zusammenfassung weiter
// "15 passed" meldete. Ein Gegenbeweis darf nichts ausfuehren.
//
// Die Direktive gehoert ausserdem an die DEKLARATIONSZEILE, nicht an die Eigenschaft:
// Bei einer diskriminierten Union meldet TypeScript die Unvertraeglichkeit am ganzen
// Objekt, nicht an der Zeile mit `payload`. Stand sie an der Eigenschaft, blieb der
// echte Fehler stehen UND die Direktive galt als unbenutzt - zwei Meldungen statt
// keiner.
function nurTypebene(einRenderRequest: RenderRequest): void {
  // @ts-expect-error `art: 'import'` verlangt einen ImportRequest, keinen RenderRequest.
  const mitFalscherNutzlast: Auftrag = { ...importAuftrag, payload: einRenderRequest };
  void mitFalscherNutzlast;
}
void nurTypebene;

// --- Verengung: nach der Pruefung auf `art` steht die Nutzlast fest ----------
function nutzlastArt(auftrag: Auftrag): string {
  if (auftrag.art === "render") {
    // Nur hier gibt es `ausgabeName` - im Import-Zweig waere der Zugriff ein Fehler.
    return auftrag.payload.ausgabeName;
  }
  return auftrag.art;
}

export type { T1, T2, T3 };

describe("Auftrag (#16)", () => {
  it("fuehrt Zustand und Art getrennt", () => {
    expect(importAuftrag.art).toBe("import");
    expect(importAuftrag.status).toBe("anstehend");
  });

  it("startet mit versuche 0 und ohne Fehler", () => {
    // `versuche` steigt beim START eines Versuchs (TK v2.5, Nachtrag aus M2) -
    // ein frisch eingereihter Auftrag steht deshalb auf 0.
    expect(importAuftrag.versuche).toBe(0);
    expect(importAuftrag.fehler).toBeNull();
    expect(importAuftrag.ergebnis).toBeNull();
  });

  it("verengt die Nutzlast ueber `art`", () => {
    expect(nutzlastArt(importAuftrag)).toBe("import");
  });
});
