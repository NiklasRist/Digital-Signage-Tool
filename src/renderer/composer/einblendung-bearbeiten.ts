/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #129.
// [composer] Einblendung am Video-Element bearbeiten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Listenelement, Einblendung } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export interface BandEntwurf {
  bandVorlageId: string
  abschnitte: Array<{ aktionRef: string; dauer: number }>   // Reihenfolge = Abspielreihenfolge
}

/** Die Vorlagen, die als Band-Vorlage angeboten werden dürfen. Reine Filterung, keine Sortierung. */
export function waehlbareBandVorlagen(vorlagen: readonly Vorlage[]): Vorlage[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}

/** Entwurfsbearbeitung – rein lokal, ohne IPC, ohne Seiteneffekt. Liefert je einen NEUEN Entwurf. */
export function fuegeAbschnittAn(entwurf: BandEntwurf, aktionRef: string, dauer: number): BandEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}
export function entferneAbschnitt(entwurf: BandEntwurf, index: number): BandEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}
export function verschiebeAbschnitt(entwurf: BandEntwurf, von: number, nach: number): BandEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}
export function setzeAbschnittsDauer(entwurf: BandEntwurf, index: number, dauer: number): BandEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}
export function wechsleBandVorlage(entwurf: BandEntwurf, bandVorlageId: string): BandEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}

/** Übernimmt den Entwurf ins Projekt. Ein Entwurf OHNE Abschnitte wird als `null` übernommen. */
export async function uebernehmeBand(
  elementId: string,
  entwurf: BandEntwurf | null,
): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #129."
  );
}
