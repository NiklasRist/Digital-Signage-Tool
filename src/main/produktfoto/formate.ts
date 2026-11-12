// [produktfoto] Format aus dem Content-Type ableiten (FA-27 / TK 9.19.4)
//
// „Das Format entscheidet der Inhalt, nicht die Endung: der Content-Type muss zu
// FORMAT_WHITELIST.bild passen; die Endung des Assets wird daraus abgeleitet."
//
// Die Zuordnung steht hier EINMAL - Abruf (Kandidat laden) und Wahl (Asset anlegen)
// lesen dieselbe Funktion. Zwei Kopien wuerden auseinanderlaufen, sobald ein Format
// dazukommt, und die eine Stelle wuerde eine Datei annehmen, die die andere ablehnt.

import { FORMAT_WHITELIST } from '../../shared/contracts/asset'

export type BildEndung = (typeof FORMAT_WHITELIST.bild)[number]

/** Der nackte Medientyp ohne Parameter (`image/jpeg; charset=…` -> `image/jpeg`). */
export function basisTyp(contentType: string): string {
  return (contentType.split(';')[0] ?? '').trim().toLowerCase()
}

/**
 * Endung fuer einen Bild-Medientyp - oder `null`, wenn er nicht zugelassen ist.
 *
 * `image/jpeg` wird zu `jpg` (die Whitelist fuehrt beide Endungen; gespeichert wird die
 * kuerzere). Alles ausser jpg/png/webp ist `null` - GIF, AVIF und SVG sind bewusst nicht
 * dabei, weil die Whitelist sie nicht kennt.
 */
export function endungFuerBildTyp(contentType: string): BildEndung | null {
  const typ = basisTyp(contentType)
  if (typ === 'image/jpeg' || typ === 'image/jpg') return 'jpg'
  if (typ === 'image/png') return 'png'
  if (typ === 'image/webp') return 'webp'
  return null
}
