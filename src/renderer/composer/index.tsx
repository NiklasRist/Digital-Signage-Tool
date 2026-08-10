/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #261.
// [composer] Modul-Wurzel: die Bausteine anordnen und verdrahten
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
// GERUEST-PRUEFSUMME: ba232e8e875c96c3
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

import type { JSX } from 'react'
import type { Marke } from '../../shared/contracts/marke'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { Uebergabe } from './reparatur-optionen'
import type { MedienImportStarter } from './medien-import'

/**
 * Was diese Wurzel aus ANDEREN Renderer-Modulen braucht und nicht importieren darf
 * (Entscheidung E1: modulübergreifend reisen nur Typen, keine Aufrufe).
 */
export interface ComposerVerdrahtung {
  /** Der Medien-Dialog samt Import-Auftraegen (#204, `app-shell`). Wird an #228
   *  durchgereicht; diese Wurzel oeffnet KEINEN Dialog selbst. */
  starteMedienImport: MedienImportStarter
  /** Der Reparatur-Stand, den die Shell haelt (#201). null = nie gestartet.
   *  Wird NUR GELESEN – diese Wurzel haelt ihn NICHT (s. #259, ENTSCHIEDEN 5). */
  reparatur: ReparaturStand | null
  /** Meldet der Shell einen neu gerechneten Stand (#201 `uebernimmStand`). */
  meldeReparaturStand: (stand: ReparaturStand) => void
  /** Reicht eine Uebergabe aus #133 an die Shell weiter (#201 `uebernimmUebergabe`).
   *  Diese Wurzel fuehrt eine Uebergabe NIEMALS selbst aus (s. STOPP). */
  meldeUebergabe: (an: Uebergabe) => void
}

/**
 * ZEICHENGLEICH zu `ComposerWurzelProps` in #244 (`src/renderer/app-shell/inhalte.tsx`) – die Naht
 * ist geschlossen: #244 fuehrt seit #255/#256 dieselben sechs Felder und belegt `verdrahtung`
 * aus `umgebung.composerVerdrahtung`. Ohne dieses Buendel waere der Medien-Import nicht anstossbar
 * (#228 verlangt den Starter als Parameter) und der Reparatur-Modus nicht mit der Shell verbunden
 * (#201 haelt den Stand und die laufende Uebergabe, #256 fuehrt sie aus).
 * Weicht die tatsaechliche Fassung in #244 hiervon ab, ist das ein Vertragsfehler an der Naht
 * zwischen zwei Modulen: MELDEN, NICHT eigenmaechtig anpassen und NICHT #244 aendern.
 */
export interface ComposerWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  marke: Marke
  verdrahtung: ComposerVerdrahtung
}

/** Die Modul-Wurzel des `composer`. Wird von #244 als `wurzeln.composer` uebergeben. */
export function ComposerWurzel(p: ComposerWurzelProps): JSX.Element {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #261."
  );
}
