// GENERIERT aus dem Signaturblock von Issue #131.
// [composer] Kaputte Stellen erkennen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'

export type KaputtGrund =
  | 'asset_fehlt'        // Asset existiert in D1, steht aber auf zustand: 'fehlt' (TK 9.4.7)
  | 'asset_unbekannt'    // die Asset-ID steht in keinem Project.assets-Eintrag
  | 'aktion_unbekannt'   // die Aktions-ID steht in keinem Project.aktionen-Eintrag

export type KaputteStelle =
  | { art: 'element_asset';  elementId: string; assetId: string;
      grund: 'asset_fehlt' | 'asset_unbekannt' }
  | { art: 'element_aktion'; elementId: string; aktionId: string; assetId: string | null;
      grund: KaputtGrund }
  | { art: 'band_abschnitt'; elementId: string; abschnittIndex: number; aktionId: string;
      assetId: string | null; grund: KaputtGrund }

/** Alle kaputten Stellen des Projekts, in stabiler Reihenfolge. Rein, ohne Seiteneffekt. */
export function findeKaputteStellen(projekt: Project): KaputteStelle[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #131."
  );
}

/** Alle Stellen, die EIN Fix an dieser Aktion mit behebt – Listenelemente UND Band-Abschnitte. */
export function stellenZuAktion(
  stellen: readonly KaputteStelle[],
  aktionId: string,
): KaputteStelle[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #131."
  );
}
