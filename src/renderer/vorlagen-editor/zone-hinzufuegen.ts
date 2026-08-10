// GENERIERT aus dem Signaturblock von Issue #147.
// [vorlagen-editor] Eine Zone hinzufügen: gebundener Text, Bild oder Dekoration
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Bindung, Vorlage, Zone } from '../../shared/contracts/vorlage'
import { begrenzeAufFlaeche, flaecheDerVorlage, MINDEST_ZONEN_KANTE_PX } from './zonen-canvas'

/** Die drei Sorten aus TK 9.12.2. */
export type ZonenSorte = 'text' | 'bild' | 'deko'

/** Für `text` erlaubt. */
export type TextBindung = 'titel' | 'beschreibung' | 'preis' | 'cta' | 'slogan'
/** Für `bild` erlaubt. */
export type BildBindung = 'bild' | 'logo'

export type ZonenWunsch =
  | { sorte: 'text'; bindung: TextBindung }
  | { sorte: 'bild'; bindung: BildBindung }
  | { sorte: 'deko'; statischerText?: string }

/**
 * Hängt eine neue FREIE Zone ans ENDE von vorlage.zonen (= zuoberst gezeichnet).
 * Liefert eine NEUE Vorlage; die übergebene bleibt unverändert.
 */
export function fuegeZoneHinzu(vorlage: Vorlage, wunsch: ZonenWunsch): Ergebnis<Vorlage> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #147."
  );
}
