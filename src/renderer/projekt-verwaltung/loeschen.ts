// [projekt-verwaltung] Ein Projekt löschen – die Bestätigung nennt vorher, was verschwindet

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
  if (
    typeof meta.name !== 'string' ||
    typeof meta.anzahlMedien !== 'number' ||
    !Number.isFinite(meta.anzahlMedien) ||
    typeof meta.anzahlAusgaben !== 'number' ||
    !Number.isFinite(meta.anzahlAusgaben)
  ) {
    return {
      ok: false,
      grund: 'zahlen_fehlen',
      text:
        'Die Zahlen zu Medien und Ausgaben sind nicht bereit; ohne sie darf nicht gelöscht werden.',
    }
  }
  const medien = meta.anzahlMedien === 1 ? '1 Medium' : `${meta.anzahlMedien} Medien`
  const ausgaben =
    meta.anzahlAusgaben === 1 ? '1 gerenderte Ausgabedatei' : `${meta.anzahlAusgaben} gerenderte Ausgabedateien`
  return {
    ok: true,
    text:
      `Projekt ${meta.name} löschen? Der Ordner enthält ${medien} und ${ausgaben}. ` +
      'Das lässt sich nicht rückgängig machen.',
  }
}

/** true, wenn `meta` das aktuell in der gemeinsamen Sicht geladene Projekt ist. */
export function istAktivesProjekt(meta: ProjektMeta, geladenes: Project | null): boolean {
  return geladenes !== null && meta.id === geladenes.id
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
  const ergebnis = await rufeAuf<void>(KANAELE.project.löscheProjekt, { id: meta.id })
  if (!ergebnis.ok) {
    return { ok: false, fehler: ergebnis.fehler }
  }

  const geladenes = wirkungen.holeProjekt()
  if (geladenes !== null && geladenes.id === meta.id) {
    // Der Rückfall auf "kein Projekt geladen" – ohne Ersatzprojekt, ohne erfundene
    // Kennung (TK 9.7.4). Und die daneben hängenden Bausteine: Motive weg, Undo weg.
    wirkungen.verwirfMotivBestand()
    wirkungen.leereProjektHistorie()
    wirkungen.leereProjektSicht()
  }

  // Die Liste FRISCH: der Eintrag ist sonst weiterhin sichtbar.
  await wirkungen.aktualisiereProjektliste()
  return { ok: true, wert: undefined }
}
