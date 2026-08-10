// GENERIERT aus dem Signaturblock von Issue #226.
// [projekt-verwaltung] Ein Projekt löschen – die Bestätigung nennt vorher, was verschwindet
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/**
 * Der Bestätigungstext – oder die Absage, wenn die Pflichtangaben fehlen.
 * `ok: false` heißt: Es DARF nicht gelöscht werden (s. ENTSCHIEDEN 2).
 */
export type LoeschBestaetigung =
  | { ok: true; text: string }
  | { ok: false; grund: 'zahlen_fehlen'; text: string }

/**
 * Baut den Text aus `ProjektMeta`. Er nennt Projektname, Anzahl Medien, Anzahl gerenderter
 * Ausgabedateien und die Unumkehrbarkeit (TK 9.5.2). Er zählt NICHTS nach.
 */
export function baueLoeschBestaetigung(meta: ProjektMeta): LoeschBestaetigung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #226."
  );
}

/** true, wenn `meta` das aktuell in der gemeinsamen Sicht geladene Projekt ist. */
export function istAktivesProjekt(meta: ProjektMeta, geladenes: Project | null): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #226."
  );
}

/**
 * Alles, worauf das Löschen des AKTIVEN Projekts wirkt. Wird als Parameter übergeben
 * (Entscheidung E1) – diese Datei importiert KEINE Sicht und KEINEN Undo-Stapel direkt.
 */
export interface LoeschWirkungen {
  /** Das aktuell geladene Projekt; null, wenn keins offen ist. Aus #197: projekt.hole().projekt */
  holeProjekt: () => Project | null
  /** Verwirft den Motiv-Bestand UND den gemerkten Stand der Voraussetzungen (#154, über #197). */
  verwirfMotivBestand: () => void
  /** Leert die Undo-Historie der Projekt-Bearbeitung (TK 9.13.2). Kommt aus #234. */
  leereProjektHistorie: () => void
  /** Setzt die gemeinsame Projekt-Sicht auf „kein Projekt geladen" zurück (TK 9.7.4).
   *  Aus #197: `projekt.leere()`. KEIN Ersatzprojekt, keine erfundene Kennung. */
  leereProjektSicht: () => void
  /** Lädt die Projektliste neu (#222). Pflicht: der Eintrag ist sonst weiterhin sichtbar. */
  aktualisiereProjektliste: () => Promise<unknown>
  /** Meldeweg für Zustände, die diese Datei nicht auflösen kann. Sie zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/**
 * Löscht das Projekt. Setzt voraus, dass `baueLoeschBestaetigung` `ok: true` geliefert hat UND
 * der Nutzer bestätigt hat – beides prüft die Ansicht, nicht diese Funktion (s. ENTSCHIEDEN 2).
 * Führt bei einem gelöschten AKTIVEN Projekt zusätzlich den Rückfall aus (s. Ablauf).
 */
export async function loescheProjekt(
  meta: ProjektMeta,
  wirkungen: LoeschWirkungen,
): Promise<Ergebnis<void, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #226."
  );
}
