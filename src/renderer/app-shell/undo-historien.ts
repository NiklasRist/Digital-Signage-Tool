// [app-shell] Zwei getrennte Undo-Historien, die ein Reiterwechsel nicht vermischt

import type { Bearbeitungsstand } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { ReiterId } from './reiter'
import { erzeugeUndoStapel, type UndoStapel } from './undo-stapel'

/**
 * Ein Schnappschuss der Projekt-Bearbeitung – MIT der Kennung des Projekts, zu dem er gehört.
 * Der `Bearbeitungsstand` des geteilten Vertrags trägt sie nicht (er wird auf das GELADENE
 * Projekt angewendet); ohne sie wäre nicht feststellbar, ob ein Stand zum offenen Projekt passt.
 */
export interface ProjektStand {
  projektId: string
  stand: Bearbeitungsstand
}

/** Die beiden Historien-Bereiche aus TK 9.13.2. */
export type Historienbereich = 'projekt-bearbeitung' | 'vorlagen-editor'

// ENTSCHIEDEN 1: genau zwei Historien als Modul-Zustand DIESER Datei. #233 ist eine
// zustandslose Fabrik; hier steht die Antwort auf "welche Historie?". Es gibt genau einen
// Ort, an dem die beiden Instanzen leben, damit die Shell (und #199) zum Leeren rankommt.
let projektStapel: UndoStapel<ProjektStand> = erzeugeUndoStapel()
let vorlagenStapel: UndoStapel<Vorlage> = erzeugeUndoStapel()

/**
 * Welcher Bereich im gegebenen Reiter gilt – REINE Funktion, ohne Zugriff auf den Reiter-Zustand.
 * `null` = in diesem Reiter gibt es kein Rückgängig.
 */
export function bereichFuerReiter(reiter: ReiterId): Historienbereich | null {
  // ENTSCHIEDEN 2, verbindliche Tabelle (TK 9.14.1): zwei Reiter zeigen auf DENSELBEN
  // Bereich - zusammenstellen und aktionen bearbeiten beide project.json.
  switch (reiter) {
    case 'zusammenstellen':
    case 'aktionen':
      return 'projekt-bearbeitung'
    case 'vorlagen':
      return 'vorlagen-editor'
    // #456: 'marken' ist kein Reiter mehr. Die Marken-Ansicht hat KEINE Historie
    // (TK 9.15.2) - die Pfeile bleiben dort abgeschaltet, weil sie ueber keinem Reiter
    // liegt und die Shell fuer sie keinen Bereich kennt.
    default:
      // 'projekte' und jeder unbekannte Wert: kein Rueckgaengig (TK 9.13.1 - Vorgaenge mit
      // Dateiwirkung sind nicht undo-faehig). Kein Wurf, kein Ersatzbereich.
      return null
  }
}

/**
 * Der WIRKSAME Undo-Bereich: Eine offene Ansicht gewinnt ueber den Reiter (FA-21).
 *
 * WARUM DAS HIER STEHT UND NICHT IM RAHMEN: Die Regel ist eine reine Funktion ohne
 * DOM und ohne Zustand - genau wie `bereichFuerReiter`. Der Rahmen kennt die offenen
 * Ansichten, diese Datei entscheidet, welche Historie daraus folgt. Nur so ist die
 * Regel ohne gerendertes Fenster pruefbar (und der Treiber belegt den Weg am Fenster).
 *
 * Vorrang: Marken (keine Historie) -> Aktionen (Projekt) -> Vorlagen (Arbeitskopie)
 * -> aktiver Reiter. Es liegt immer nur EINE Ansicht ueber der Reiterflaeche (9.14.2).
 */
export function wirksamerUndoBereich(offen: {
  marken: boolean
  aktionen: boolean
  vorlagen: boolean
  reiter: ReiterId
}): Historienbereich | null {
  if (offen.marken) return null
  if (offen.aktionen) return 'projekt-bearbeitung'
  if (offen.vorlagen) return 'vorlagen-editor'
  return bereichFuerReiter(offen.reiter)
}

/** Die EINE Historie der Projekt-Bearbeitung (composer + action-editor). */
export function projektHistorie(): UndoStapel<ProjektStand> {
  return projektStapel
}

/** Die EINE Historie des Vorlagen-Editors. Schnappschuss ist die vollständige Arbeitskopie. */
export function vorlagenHistorie(): UndoStapel<Vorlage> {
  return vorlagenStapel
}

/** Leert die Historie der Projekt-Bearbeitung (TK 9.13.3; außerdem bei Projektwechsel, 9.13.2). */
export function leereProjektHistorie(): void {
  // Ausgeloest wird das von #199 bzw. #224/#226 - NIE von hier (kein Abonnement, ENTSCHIEDEN 5).
  projektStapel.leere()
}

/** Leert die Historie des Vorlagen-Editors (Editor-Schluss, TK 9.13.2). */
export function leereVorlagenHistorie(): void {
  vorlagenStapel.leere()
}

/** NUR für Tests: ersetzt beide Historien durch frische, leere Stapel. */
export function setzeHistorienZurueck(): void {
  // ENTSCHIEDEN 7: ERSETZEN statt leeren - eine zuvor geholte Instanz zeigt danach nicht mehr
  // auf die produktive Historie. (Im Betrieb sind die beiden leere…-Funktionen der Weg.)
  projektStapel = erzeugeUndoStapel()
  vorlagenStapel = erzeugeUndoStapel()
}
