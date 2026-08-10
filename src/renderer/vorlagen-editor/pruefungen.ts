// GENERIERT aus dem Signaturblock von Issue #148.
// [vorlagen-editor] Prüfungen des Editors: harte Sperre gegen Warnung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import { flaecheDerVorlage, sicherheitsBox } from './zonen-canvas'
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

export type BefundSchwere = 'sperre' | 'warnung'

export type BefundCode =
  | 'zone_ausserhalb'          // Sperre  – TK 9.12.2, Zeile 1
  | 'bandhoehe_ungueltig'      // Sperre  – TK 9.12.2, Zeilen 2 UND 3 (Wertebereich und Geradzahligkeit)
  | 'textparameter_fehlen'     // Sperre  – TK 9.12.2, Zeile 4
  | 'bildparameter_fehlen'     // Sperre  – zusätzlich, weil #102 sie ablehnt (s. u.)
  | 'zonen_id_doppelt'         // Sperre  – zusätzlich, weil #102 sie ablehnt (s. u.)
  | 'feste_zone_veraendert'    // Sperre  – TK 9.12.2, Zeile 7
  | 'sicherheitsabstand'       // Warnung – TK 9.12.2, Zeile 5

export interface Befund {
  schwere: BefundSchwere
  code: BefundCode
  zonenId: string | null   // null = betrifft die Vorlage als Ganzes (nur bei bandhoehe_ungueltig)
  meldung: string          // fertiger Anzeigetext, nennt die betroffene Zone beim Namen
}

/**
 * Prüft die gesamte Arbeitskopie.
 * `festeZonenSoll` sind die festen Zonen, wie sie beim Öffnen der Arbeitskopie vorlagen –
 * der Vergleichsmassstab für 'feste_zone_veraendert'. Der Aufrufer nimmt sie aus
 * `sitzung.festeZonenSoll` (#143) und bildet sie NICHT aus dem aktuellen Stand neu.
 */
export function pruefeVorlage(vorlage: Vorlage, festeZonenSoll: readonly Zone[]): Befund[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #148."
  );
}

/** true, wenn KEIN Befund die Schwere 'sperre' hat. Warnungen blockieren nie. */
export function istSpeicherbar(befunde: readonly Befund[]): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #148."
  );
}

/**
 * Band-y, ab dem der Inhalt im Overscan liegt (= höhe − 54).
 * null bei `vollflaeche` und wenn die ganze Bandfläche unsicher ist.
 */
export function bandSicherheitsLinie(vorlage: Vorlage): number | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #148."
  );
}
