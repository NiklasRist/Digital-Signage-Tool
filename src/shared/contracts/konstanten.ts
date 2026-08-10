// GENERIERT aus dem Signaturblock von Issue #21.
// [contracts] Projektweite Konstanten definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export const STANDARD_ANZEIGEDAUER_SEKUNDEN = 10
export const DAUER_BEREICH = { min: 10, max: 45 } as const
export const SICHERHEITSABSTAND_PX = { horizontal: 96, vertikal: 54 } as const
// Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben gebracht werden.
// EINE zentrale Stelle – sie wird von öffneProjekt (#34), schreibeProjekt (#46) und
// migriereProjekt (#48) gelesen; drei eigene Kopien würden unweigerlich auseinanderlaufen.
export const AKTUELLE_SCHEMA_VERSION = 1
// „Aktuelle schemaVersion | 1 | wird von öffneProjekt, schreibeProjekt und der Migration
//  gelesen (9.5.5) – eine Stelle, sonst laufen drei Kopien auseinander" (TK 9.11.4, wörtlich)
export { FORMAT_WHITELIST } from '../asset' // Re-Export aus #13 – hier NICHT dupliziert
