// #443 - bedienung.ts: die reinen Regeln der Player-Bedienung (Ton und Zeiger).
//
// WARUM ES TON UEBERHAUPT GIBT (Entscheidung 29.10.2026): Die AUSGABE ist still
// (TK 9.2.4: stille AAC-Spur; AD R-06 ist damit entschieden). Der Ton dieser
// Vorschau zeigt deshalb NICHT das Ergebnis, sondern die QUELLE - er ist ein
// Hoer-Behelf beim Suchen der Schnittstellen. Der Startwert ist STUMM: Wer nichts
// erwartet, soll auch nichts hoeren; erst ein bewusster Klick schaltet ihn ein.
// In der Leiste steht darum dauerhaft "Ausgabe bleibt stumm" - ein Ton ohne diesen
// Hinweis waere die Behauptung, das fertige Video habe Ton.
//
// Hier liegt KEIN Zustand, sondern die Uebergaenge als WERT (wie #214 im Transport):
// Jede Funktion liefert einen NEUEN Stand, keine mutiert ihre Eingabe.

import type { Zeitachse } from './zeitachse'

/** Der Ton-Zustand der Vorschau. Gehoert der Vorschau (#214: „Der Aufrufer haelt den Stand"). */
export interface TonStand {
  /** true = die Vorschau gibt keinen Ton. DER STARTWERT (Entscheidung 29.10.2026). */
  stumm: boolean
  /** 0..1. Bleibt beim Stummschalten stehen - der Regler springt nicht auf 0. */
  lautstaerke: number
}

/** Der Anfang: stumm, Regler auf voll. */
export const TON_STAND: TonStand = { stumm: true, lautstaerke: 1 }

/**
 * Der Schalter stumm <-> hoerbar. Die Lautstaerke bleibt erhalten.
 * Sonderfall stumm MIT Lautstaerke 0 (Regler ganz unten): hoerbar wird mit 1 -
 * sonst waere der Schalter wirkungslos („an" bei Regler 0 bleibt lautlos).
 */
export function schalteTonUm(ton: TonStand): TonStand {
  if (!ton.stumm) return { stumm: true, lautstaerke: ton.lautstaerke }
  return { stumm: false, lautstaerke: ton.lautstaerke > 0 ? ton.lautstaerke : 1 }
}

/**
 * Der Regler. Klemmt auf [0, 1]; ein unbrauchbarer Wert (NaN, Infinity) laesst den
 * Stand UNVERAENDERT - kein Ersatzwert, kein Sprung auf 0.
 * Lautstaerke 0 bedeutet STUMM: Sonst behauptete der Knopf „Ton an", waehrend der
 * Regler nichts durchlaesst.
 */
export function setzeLautstaerke(ton: TonStand, wert: number): TonStand {
  if (!Number.isFinite(wert)) return ton
  const geklemmt = Math.min(Math.max(wert, 0), 1)
  return { stumm: geklemmt === 0, lautstaerke: geklemmt }
}

/**
 * Der Frame unter dem Zeiger: Anteil der Balkenbreite (0..1) -> Frame der Achse.
 * Geklemmt; ausserhalb von [0, 1] und bei NaN kommt 0 heraus (der Balken kann nicht
 * vor seinem Anfang liegen). Was mit dem Frame geschieht, entscheidet `springeZuFrame`
 * (#214) - hier wird nur der Zeiger uebersetzt.
 */
export function frameBeiAnteil(anteil: number, achse: Zeitachse): number {
  if (!Number.isFinite(anteil)) return 0
  const geklemmt = Math.min(Math.max(anteil, 0), 1)
  return Math.round(geklemmt * achse.gesamtFrames)
}
