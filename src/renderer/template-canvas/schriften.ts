 
// GENERIERT aus dem Signaturblock von Issue #110.
// [template-canvas] Marken-Schriften bereitstellen und den Canvas-Schriftwert bilden
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
// GERUEST-PRUEFSUMME: b09233bf40a8a1a0
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

import type { Schrift } from '../../shared/contracts/marke'
import { ladeMarkenSchriften } from '../styles/schriften'

/** Das EINE gecachte Erfolgspromise; null, solange noch nie erfolgreich aufgelöst. */
let bereit: Promise<void> | null = null

export async function stelleSchriftenBereit(): Promise<void> {
  if (bereit !== null) return bereit
  const lauft = ladeMarkenSchriften()
  bereit = lauft

  try {
    await lauft
  } catch (grund) {
    // Ein abgelehntes Promise wird NICHT gemerkt (Kontrakt oben) - der nächste Aufruf
    // versucht es erneut; der hier laufende sieht den Fehler trotzdem.
    bereit = null
    throw grund
  }
}
// Idempotent: merkt sich das EINE Promise von ladeMarkenSchriften() (#8) in einem Modul-Zustand und
// gibt es bei jedem weiteren Aufruf unverändert zurück. Lädt nie ein zweites Mal. Ein abgelehntes
// Promise wird NICHT gemerkt – der nächste Aufruf versucht es erneut.

export function sindSchriftenBereit(): boolean {
  // Der Gecache ist seit jeher ERFOLG-kaufend: Das Merkfeld entsteht erst beim Aufruf und
  // wird bei Fehlschlag wieder geräumt.
  return bereit !== null
}
// Synchron. true erst, nachdem stelleSchriftenBereit() erfolgreich aufgelöst hat; sonst false.
// Existiert, weil zeichneSegment (#117) synchron ist und deshalb nicht awaiten darf.
// #117 ruft diese Abfrage als ALLERERSTEN Schritt auf und wirft einen Error, wenn sie false
// liefert. Diese Datei selbst weigert sich nie – sie gibt nur Auskunft.

export function schriftKurzform(schrift: Schrift, größePx: number): string {
  return `${schrift.gewicht} ${größePx}px "${schrift.familie}"`
}

// Liefert den Wert für CanvasRenderingContext2D.font, exakt in dieser Form und Reihenfolge:
//   `${schrift.gewicht} ${größePx}px "${schrift.familie}"`
// Der Familienname steht IMMER in doppelten Anführungszeichen. Keine weiteren Bestandteile
// (kein style, kein variant, kein stretch, kein line-height, keine Fallback-Familie).
