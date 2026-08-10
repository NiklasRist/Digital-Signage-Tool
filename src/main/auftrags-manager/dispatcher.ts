// GENERIERT aus dem Signaturblock von Issue #60.
// [auftrags-manager] Fachdienst-Handler registrieren und ausführen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag, AuftragArt } from '../../shared/contracts/auftrag';
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis';

export interface AusfuehrungsKontext {
  auftragId: string;
  meldeFortschritt: (prozent: number | null) => void;
}

// F = die fachliche Fehlercode-Union des ausfuehrenden Dienstes (z. B. ImportFehlercode).
// Die drei generischen Codes sind ueber `F | GenerischerFehlercode` immer enthalten.
export type HandlerErgebnis<F extends string = string> =
  | {
      status: 'erfolg';
      // fachliche Nutzdaten des Dienstes, oder null wenn er nichts zu melden hat.
      // Bedeutung je Auftragsart laut TK 9.3.1: import -> der fertige Asset,
      // loeschen -> { assetId }, render -> Pfad/Groesse/Dauer, export -> { zielPfad, dateigroesse }.
      ergebnis: unknown | null;
    }
  | {
      status: 'fehlgeschlagen';
      fehler: { code: F | GenerischerFehlercode; meldung: string; daten?: unknown };
    }
  | { status: 'abgebrochen' };

export type HandlerFuer<A extends AuftragArt> = (
  auftrag: Extract<Auftrag, { art: A }>,
  kontext: AusfuehrungsKontext,
) => Promise<HandlerErgebnis<string>>;

export function registriereAuftragsHandler<A extends AuftragArt>(
  art: A,
  handler: HandlerFuer<A>,
  brichAb?: (auftrag: Auftrag) => void,
): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #60."
  );
}

export function fuehreAus(
  auftrag: Auftrag,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #60."
  );
}

export function kannAbbrechen(art: AuftragArt): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #60."
  );
}

/** true, wenn ein Abbrecher registriert war und gerufen wurde. */
export function brich(auftrag: Auftrag): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #60."
  );
}
