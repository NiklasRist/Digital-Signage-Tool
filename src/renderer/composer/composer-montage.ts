// Issue #259 (M7-66) - composer-montage.ts: die reine Zusammensetz-Logik der
// Modul-Wurzel des composer. Total, rein, ohne JSX, ohne react, ohne IPC.
//
// Was die Wurzel (#261) an Zustand braucht - welches Overlay oben liegt, welche
// Zeile gewaehlt ist, welche Meldung steht, welcher Name im Render-Dialog
// steht, welche Datei zum Export gewaehlt ist - entsteht hier als WERT und ist
// damit ohne Browser pruefbar. Anordnung und Verdrahtung bleiben in #261.
//
// Diese Datei RECHNET NICHTS: keine Summe (#127), keine Kaputt-Regel (#131),
// keine Freigabe-Rechnung (#132), keine Namenspruefung (#231). Sie haelt Werte
// und uebersetzt. Jede Rechnung hier waere eine zweite Wahrheit - und sie
// faele erst am Fernseher auf.
//
// Die gefaehrlichste Stelle dieses Issues ist `folgeAus`: der TABELLENFUSS, der
// aus einer FixWirkung (#133) die naechste Handlung macht. Genau zwei Ausgaenge,
// kein dritter, kein default, der etwas erfindet. Die Uebergabe (`Uebergabe`,
// #133) wird hier NIE ausgefuehrt - sie reist als Wert nach oben an die Shell
// (#202/#203/#204 fhren sie dort aus); wer sie hier ausfuehren oder
// verschlucken wuerde, baue genau den stillen Abbruch, den TK 9.7.5 verbietet.
//
// Jede Funktion ist total: nie Wurf, nie Mutation der uebergebenen Lage, nie
// async. Der halbe Nachweis besteht darin, eine mit Object.freeze eingefrorene
// Lage durch jede Funktion zu schicken. Eine einzige Zuweisung an ein Feld
// eines Parameters nimmt diesen Nachweis weg - und der Schaden zeigte sich in
// der Oberflaeche als React, das nie neu zeichnet.

import { LEERE_EXPORTAUSWAHL, type Exportauswahl } from './export-dialog'
import type { KaputteStelle } from './kaputt-erkennung'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { FixWirkung, Uebergabe } from './reparatur-optionen'

/** Was gerade ueber der Zusammenstellung liegt. Genau eins oder keins (s. ENTSCHIEDEN 1). */
export type ComposerOverlay =
  | { art: 'keins' }
  | { art: 'medium_loeschen'; assetId: string }
  | { art: 'render' }
  | { art: 'export' }
  | { art: 'einblendung'; elementId: string }
  | { art: 'reparatur_optionen'; stelle: KaputteStelle }

export const KEIN_OVERLAY: ComposerOverlay = { art: 'keins' }

/** Eine Meldung, die diese Wurzel ueber der Ansicht zeigt. Genau EINE, nie ein Stapel. */
export interface WurzelMeldung {
  code: string
  meldung: string
  /** true = hervorheben (etwas ist schiefgegangen), false = sachliche Rueckmeldung. */
  warnung: boolean
}

/** Der gesamte lokale Zustand dieser Wurzel. Ein WERT - keine Funktion mutiert ihn. */
export interface ComposerLage {
  overlay: ComposerOverlay
  /** Die zuletzt angeklickte Zeile; null = keine. Reine Anzeige-Auswahl. */
  gewaehltesElementId: string | null
  /** Die zuletzt gezeigte Meldung; null = keine. */
  meldung: WurzelMeldung | null
  /** true, solange ein Ausloesen laeuft - die Ausloese-Knoepfe sind dann gesperrt. */
  laeuft: boolean
  /** Der Text im Namensfeld des Render-Dialogs. ROH, ungeprueft - geprueft wird er ueber
   *  pruefeAusgabeName (#231), nicht hier. Wird beim Oeffnen des Render-Overlays aus
   *  vorbelegterName(projekt) belegt (s. ENTSCHIEDEN 3). */
  ausgabeName: string
  /** Die Auswahl des Export-Dialogs (#232). Wird ausschliesslich ueber waehleDatei und
   *  waehleZiel (#232) fortgeschrieben - diese Wurzel baut sie NICHT selbst. */
  exportauswahl: Exportauswahl
}

/** Kein Overlay, keine Auswahl, keine Meldung, nichts laeuft, leerer Name, leere Exportauswahl. */
export const LEERE_COMPOSER_LAGE: ComposerLage = {
  overlay: KEIN_OVERLAY,
  gewaehltesElementId: null,
  meldung: null,
  laeuft: false,
  ausgabeName: '',
  exportauswahl: LEERE_EXPORTAUSWAHL,
}

/** Jede dieser Funktionen liefert eine NEUE Lage; die uebergebene bleibt unveraendert.
 *  Alle sind total: sie werfen nie. */
export function oeffneOverlay(lage: ComposerLage, overlay: ComposerOverlay): ComposerLage {
  // ENTSCHIEDEN 1: GENAU EIN Overlay, kein Stapel. Ein bereits offenes wird
  // ersetzt - es gibt keine Vorratshaltung fuer Fall, den es nicht gibt.
  return { ...lage, overlay }
}

export function schliesseOverlay(lage: ComposerLage): ComposerLage {
  // Nur das Overlay faellt; Auswahl, Meldung und laeuft bleiben unberuehrt -
  // ein Schliessen ist kein Reset (Fehlerpfade: „leaves untouched").
  return { ...lage, overlay: KEIN_OVERLAY }
}

export function waehleElement(lage: ComposerLage, elementId: string | null): ComposerLage {
  // Die reine Anzeige-Auswahl; ob es die Zeile gibt, weiss allein die Wurzel
  // (#261), nicht diese Datei - hier wird nichts geprueft.
  return { ...lage, gewaehltesElementId: elementId }
}

export function melde(lage: ComposerLage, meldung: WurzelMeldung): ComposerLage {
  // Genau EINE Meldung: die neue ersetzt die alte (ENTSCHIEDEN 2). Kein Stapel,
  // kein Systemdialog - dieselbe Festlegung wie in #248.
  return { ...lage, meldung }
}

/** Der Name traegt `Wurzel`, weil #248 im SELBEN Modulordner ein gleichnamiges
 *  verwirfMeldung(lage: MeldungsLage) fuehrt. Zwei gleichnamige Exporte im selben
 *  Ordner sind die Fehlerklasse aus M6: ein falscher Import kompiliert, aber der
 *  Name allein sagt beim Lesen nicht mehr, welche Meldung gemeint ist. */
export function verwirfWurzelMeldung(lage: ComposerLage): ComposerLage {
  // Ohne stehende Meldung ist das eine neue, inhaltlich gleiche Lage - kein Wurf.
  return { ...lage, meldung: null }
}

export function setzeLaeuft(lage: ComposerLage, laeuft: boolean): ComposerLage {
  return { ...lage, laeuft }
}

/** Setzt den ROHEN Text des Namensfeldes. Prueft NICHTS - das tut pruefeAusgabeName (#231). */
export function setzeAusgabeName(lage: ComposerLage, name: string): ComposerLage {
  // Der Wert kommt UNVERAENDERT an: nicht beschnitten, nicht geprueft, nicht
  // abgelehnt (Fehlerpfade: '' und Pfade wie '../x' und reservierte Namen
  // durchreisen hier ungeprueft).
  return { ...lage, ausgabeName: name }
}

/** Uebernimmt eine von #232 gelieferte Auswahl UNVERAENDERT. Baut sie NICHT selbst. */
export function setzeExportauswahl(lage: ComposerLage, auswahl: Exportauswahl): ComposerLage {
  // Referenzidentischen Uebergang (DoD: toBe), kein Kopieren, kein Ergaenzen.
  return { ...lage, exportauswahl: auswahl }
}

/**
 * Was nach einer FixWirkung (#133) zu geschehen hat - eine Tabelle, keine Heuristik.
 * REIN: fuehrt selbst nichts aus, ruft nichts auf, schreibt nichts.
 */
export type FixFolge =
  | { art: 'neu_rechnen' }                 // 'erledigt' -> aktualisiereReparatur, Overlay zu
  | { art: 'an_shell'; an: Uebergabe }     // 'uebergabe' -> meldeUebergabe, Overlay zu
export function folgeAus(wirkung: FixWirkung): FixFolge {
  // DIE TABELLE. Genau zwei Ausgaenge; es gibt keinen dritten und keinen
  // default-Zweig. Die Uebergabe reist ALS WERT nach oben - sie wird hier
  // NIEMALS ausgefuehrt (STOPP-Verbot) und hier nicht kopiert.
  switch (wirkung.art) {
    case 'erledigt':
      return { art: 'neu_rechnen' }
    case 'uebergabe':
      return { art: 'an_shell', an: wirkung.an }
  }
}

/** Die Stelle, die die Fuehrung gerade zeigt; null, wenn keine laeuft oder keine offen ist.
 *  Liest AUSSCHLIESSLICH stand.aktuelle - es wird NICHTS nachgerechnet. */
export function aktuelleStelle(stand: ReparaturStand | null): KaputteStelle | null {
  // ENTSCHIEDEN 8: der Wert wird toBe-gleich durchgereicht; keine
  // Stellenliste wird durchsucht, kein Index verglichen.
  return stand === null ? null : stand.aktuelle
}

/** Laeuft der gefuehrte Modus? Liest AUSSCHLIESSLICH stand.aktiv. */
export function fuehrungLaeuft(stand: ReparaturStand | null): boolean {
  return stand !== null && stand.aktiv
}

/**
 * Darf der Render-Knopf angeklickt werden? Nimmt die Freigabe-Auskunft von #132 als
 * Parameter entgegen und rechnet sie NICHT selbst aus (s. ENTSCHIEDEN 6).
 */
export function istRenderKnopfFrei(renderFreigegeben: boolean, laeuft: boolean): boolean {
  // Zwei unabhaengige Schranken: die Freigabe der Fuehrung (#132) und der
  // Laufzustand des Ausloesens. Die Freigabe kommt UNVERAENDERT hier herein -
  // eine zweite Ableitung aus der Stellenliste waere die zweite Wahrheit.
  return renderFreigegeben && !laeuft
}
