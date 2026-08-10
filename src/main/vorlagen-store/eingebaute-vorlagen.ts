// GENERIERT aus dem Signaturblock von Issue #96.
// [vorlagen-store] Die drei eingebauten Vorlagen als Daten anlegen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 47fc4c8ba554fb9a

import type { Vorlage } from '../../shared/contracts/vorlage'
// #95 – src/shared/contracts/vorlage.ts:
//   export type VorlagenArt = 'vollflaeche' | 'split' | 'einblendung'
//   export type Bindung = 'titel'|'beschreibung'|'preis'|'cta'|'bild'|'logo'|'slogan'
//   export interface Rahmen { x: number; y: number; breite: number; höhe: number }
//   export interface Ausrichtung { horizontal: 'links'|'mitte'|'rechts'
//                                  vertikal: 'oben'|'mitte'|'unten' }
//   export interface ZonenText { schriftRolle: SchriftRolle; farbRolle: FarbRolle
//                                größeMax: number; größeMin: number; maxZeilen: number }
//   export interface ZonenBild { einpassung: 'contain' | 'cover' }
//   export interface ZonenDeko { füllungFarbRolle?: FarbRolle; radius?: number
//                                statischerText?: string
//                                verlauf?: { vonFarbRolle: FarbRolle; bisFarbRolle: FarbRolle
//                                            richtung: 'oben'|'unten'|'links'|'rechts' } }
//   export interface Zone { id: string; rolle: 'fest'|'frei'; bindung: Bindung | null
//                           rahmen: Rahmen; ausrichtung: Ausrichtung
//                           wennLeer: 'leer'|'ausblenden'
//                           text?: ZonenText; bild?: ZonenBild; deko?: ZonenDeko }
//   export interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

/** Die IDs der mitgelieferten Vorlagen – Reihenfolge = Reihenfolge im Anfangsbestand. */
export const EINGEBAUTE_VORLAGEN_IDS = ['vollbild', 'split', 'band-standard'] as const

/**
 * Liefert bei JEDEM Aufruf eine frische, TIEFE Kopie der drei mitgelieferten Vorlagen.
 * Bewusst eine Funktion und kein exportiertes Array: Ein gemeinsam genutztes Array liesse sich von
 * einem Aufrufer versehentlich in-place aendern, und der Anfangsbestand waere fuer die restliche
 * Prozesslaufzeit verfaelscht – ein Fehler, der erst nach einem Neustart wieder verschwindet und
 * deshalb praktisch nicht reproduzierbar ist.
 */
export function eingebauteVorlagen(): Vorlage[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #96."
  );
}
