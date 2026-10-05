// Issue #249 (M7-56) - element-zeile.ts: die reine Bedienlogik des Reglers und die
// abgeleiteten Anzeigewerte, ohne JSX, ohne react, ohne IPC.
//
// Bauform: EIN Bauteil fuer alle drei Elementarten (AD 4.4) - die Zahl der Griffe
// kommt aus `modell.griffe`, nicht aus einer Verzweigung. Die Klemmung liegt
// AUSSCHLIESSLICH bei `begrenze` (#125); es gibt hier keine zweite Grenze, kein
// Literal aus DAUER_BEREICH und keine Frame-Rundung. `uebernehmeGrenzen` (#125)
// wird von der ANZEIGE (element-zeile.tsx) genau einmal beim Loslassen gerufen -
// die Logik hier rechnet nur.
//
// ENTSCHIEDEN 11: `anteil` liefert bei entarteter Spanne (obergrenze ===
// untergrenze) 0 statt NaN - ein NaN in einer CSS-Prozentangabe ergaebe eine
// unsichtbare oder wild springende Griffposition und keine Fehlermeldung.
//
// `formatiereReglerDauer` ist das Format einer EINZELNEN Elementdauer (eine
// Nachkommastelle, Einheit) und wird NIE auf eine Gesamtlänge angewandt;
// `formatiereLaenge` (#127) ist das Gegenstück (dort verboten).

import type { Listenelement } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { ReglerModell } from './dauer-regler'
import { begrenze } from './dauer-regler'

/** Welcher Griff bewegt wird. Bei `griffe: 1` ist NUR 'ende' zulaessig (s. ENTSCHIEDEN 2). */
export type Reglergriff = 'anfang' | 'ende'

/** Der Zustand WAEHREND einer Ziehbewegung. Ausserhalb einer Geste gilt die Ruhelage. */
export interface ReglerLage {
  /** true, solange der Nutzer zieht. Nur dann weichen `anfang`/`ende` vom Modell ab. */
  zieht: boolean
  anfang: number
  ende: number
}

/** Die Lage, die dem gespeicherten Stand entspricht: `zieht: false`, Werte aus dem Modell. */
export function ruheLage(modell: ReglerModell): ReglerLage {
  return { zieht: false, anfang: modell.anfang, ende: modell.ende }
}

/**
 * Übernimmt eine Zieh-Bewegung in die Lage. Klemmt AUSSCHLIESSLICH über `begrenze` (#125) –
 * diese Datei kennt keine eigene Grenze. Liefert eine NEUE Lage; die übergebene bleibt
 * unverändert. Total: wirft nie.
 */
export function ziehe(
  modell: ReglerModell,
  lage: ReglerLage,
  griff: Reglergriff,
  wert: number,
): ReglerLage {
  // ENTSCHIEDEN 2: Bei einem Griff ist NUR 'ende' beweglich - der Aufruf mit
  // 'anfang' ist ein Programmierfehler der Anzeige und laesst die Lage unberuehrt,
  // statt ihn in eine falsche Zahl zu uebersetzen.
  if (modell.griffe === 1 && griff === 'anfang') {
    return lage
  }
  // Fehlerpfad: nicht endliche Werte lassen die Lage unveraendert - `begrenze`
  // faellt auf den Modellstand zurueck, und der ist NICHT die gezogene Lage.
  if (!Number.isFinite(wert)) {
    return lage
  }
  // Die GRENZEN kommen aus dem Modell, der GEZOGENE Wert wird geklemmt: genau
  // eine Klemmstelle, und sie sieht das Paar (anfang, ende) - begrenze entscheidet
  // selbst, wie ein gekreuztes Paar behandelt wird.
  const ziel = { anfang: lage.anfang, ende: lage.ende }
  if (griff === 'anfang') {
    ziel.anfang = wert
  } else {
    ziel.ende = wert
  }
  const resultat = begrenze(modell, ziel.anfang, ziel.ende)
  return { zieht: true, anfang: resultat.anfang, ende: resultat.ende }
}

/** Beendet die Geste: `zieht: false`, Werte bleiben stehen. Liefert eine NEUE Lage. */
export function beendeZiehen(lage: ReglerLage): ReglerLage {
  return { zieht: false, anfang: lage.anfang, ende: lage.ende }
}

/** true, wenn die Lage von den Werten des Modells abweicht – nur dann wird übernommen. */
export function istVeraendert(modell: ReglerModell, lage: ReglerLage): boolean {
  return lage.anfang !== modell.anfang || lage.ende !== modell.ende
}

/** Position eines Sekundenwerts auf dem Balken, 0..1. Fuer die CSS-Platzierung der Griffe. */
export function anteil(modell: ReglerModell, wert: number): number {
  const spanne = modell.obergrenze - modell.untergrenze
  // ENTSCHIEDEN 11: entartete Spanne -> 0, NIE NaN.
  if (!(spanne > 0)) {
    return 0
  }
  const teil = (wert - modell.untergrenze) / spanne
  if (teil < 0) return 0
  if (teil > 1) return 1
  return teil
}

/** Die Umkehrung: aus einer Balkenposition 0..1 den Sekundenwert. */
export function wertAusAnteil(modell: ReglerModell, teil: number): number {
  const spanne = modell.obergrenze - modell.untergrenze
  if (!(spanne > 0)) {
    return modell.untergrenze
  }
  const geklemmt = teil < 0 ? 0 : teil > 1 ? 1 : teil
  return modell.untergrenze + geklemmt * spanne
}

/**
 * Die numerische Anzeige des Reglers (AD 4.4): eine Nachkommastelle und die Einheit, z. B.
 * „12,5 s". Das ist NICHT `formatiereLaenge` (#127) – Begründung in ENTSCHIEDEN 5.
 */
export function formatiereReglerDauer(sekunden: number): string {
  const anzeige = Number.isFinite(sekunden) ? sekunden.toFixed(1).replace('.', ',') : '—'
  return `${anzeige} s`
}

/** Der Zustand des Werbebandes an DIESEM Element, anzeigefertig. */
export interface BandStatus {
  /** true nur bei `art: 'video'` MIT `einblendung !== null`. */
  vorhanden: boolean
  /** Anzahl der Abschnitte; 0, wenn kein Band. */
  abschnitte: number
  /** Name der Band-Vorlage aus dem übergebenen Bestand; null, wenn sie dort fehlt. */
  vorlagenName: string | null
  /** Der fertige Anzeigetext der Schaltfläche. */
  text: string
  /** false bei `art: 'bild'` und `art: 'segment'` – dort gibt es kein Band (TK 9.2.8). */
  bedienbar: boolean
}

export function baueBandStatus(
  element: Listenelement,
  vorlagen: readonly Vorlage[],
): BandStatus {
  // TK 9.2.8: Bänder gibt es nur bei video. Ein wider Erwarten gesetztes Feld bei
  // bild/segment wird IGNORIERT, nicht gemeldet (Fehlerpfade-Tabelle).
  if (element.art !== 'video') {
    return { vorhanden: false, abschnitte: 0, vorlagenName: null, text: '', bedienbar: false }
  }
  const einblendung = element.einblendung
  if (einblendung === null) {
    // Der Zugang bleibt bei einem Video OHNE Band bedienbar - dort wird eines angelegt.
    return { vorhanden: false, abschnitte: 0, vorlagenName: null, text: 'Werbeband…', bedienbar: true }
  }
  const vorlagenName =
    vorlagen.find((vorlage) => vorlage.id === einblendung.bandVorlageId)?.name ?? null
  const anzahl = einblendung.abschnitte.length
  // Kein erfundener Name (Fehlerpfade): fehlt die Vorlage, nennt der Text nur die Zahl.
  const text =
    vorlagenName === null
      ? `Werbeband: ${anzahl} Abschnitt${anzahl === 1 ? '' : 'e'}`
      : `${vorlagenName}: ${anzahl} Abschnitt${anzahl === 1 ? '' : 'e'}`
  return { vorhanden: true, abschnitte: anzahl, vorlagenName, text, bedienbar: true }
}
