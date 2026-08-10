/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #147.
// [vorlagen-editor] Eine Zone hinzufügen: gebundener Text, Bild oder Dekoration
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
// GERUEST-PRUEFSUMME: 7abaf8996202b225
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
