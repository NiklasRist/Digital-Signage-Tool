// GENERIERT aus dem Signaturblock von Issue #234.
// [app-shell] Zwei getrennte Undo-Historien, die ein Reiterwechsel nicht vermischt
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
// GERUEST-PRUEFSUMME: bdc18f180323cf82

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
    default:
      // 'projekte' und jeder unbekannte Wert: kein Rueckgaengig (TK 9.13.1 - Vorgaenge mit
      // Dateiwirkung sind nicht undo-faehig). Kein Wurf, kein Ersatzbereich.
      return null
  }
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
