// [app-shell] Den Reparatur-Modus über den Reiterwechsel führen

import type { ReparaturStand } from '../composer/reparatur-fuehrung'
import type { Uebergabe } from '../composer/reparatur-optionen'
import type { ReiterId } from './reiter'

/** Wohin die laufende Übergabe führt. Overlays bleiben im aktuellen Reiter. */
export type UebergabeZiel = Uebergabe | null

/** Der vollständige Reparatur-Zustand der Shell. Ein WERT – keine Funktion mutiert ihn. */
export interface ShellReparatur {
  /** Der Stand aus #132; null, solange nie gestartet wurde. */
  stand: ReparaturStand | null
  /** Die laufende Übergabe (Overlay oder Reiterwechsel); null, wenn keine läuft. */
  laufendeUebergabe: UebergabeZiel
  /** Die im action-editor hervorzuhebende Aktion; null, wenn dorthin nicht übergeben wurde. */
  hervorgehobeneAktionId: string | null
  /** Der Reiter, in den nach der Übergabe zurückgekehrt wird; null, wenn kein Wechsel stattfand. */
  rueckkehrReiter: ReiterId | null
}

/** Beide Quellen leer – kein Modus, keine Übergabe, keine Hervorhebung. */
export const LEERE_SHELL_REPARATUR: ShellReparatur = {
  stand: null,
  laufendeUebergabe: null,
  hervorgehobeneAktionId: null,
  rueckkehrReiter: null,
}

/** Ein Reiterwechsel, den der Aufrufer ausführen soll. null = im aktuellen Reiter bleiben. */
export interface FuehrungsSchritt {
  lage: ShellReparatur
  wechselZu: ReiterId | null
}

/** Erschöpfungs-Helfer: Eine fuenfte `ziel`-Variante in `Uebergabe` wird zum Übersetzungsfehler
 *  statt still `null` zu liefern (Fehlerpfad-Tabelle). */
function erreichtNie(wert: never): never {
  throw new Error(`Unbekanntes Übergabe-Ziel: ${String(wert)}`)
}

/** Nimmt eine Uebergabe aus #133 entgegen und sagt, ob dafür der Reiter zu wechseln ist. */
export function uebernimmUebergabe(
  lage: ShellReparatur,
  an: Uebergabe,
  aktiverReiter: ReiterId,
): FuehrungsSchritt {
  const wechselZu = reiterFuerUebergabe(an)

  // Es gibt genau eine laufende Übergabe (ENTSCHIEDEN 7): Die neue ersetzt die alte.
  // Die Hervorhebung ist an die laufende Übergabe gebunden (ENTSCHIEDEN 3) – sie wird
  // daher bei jeder Übernahme neu gesetzt: bei einem Aktions-Fix auf die aktionId,
  // sonst auf null.
  const neueLage: ShellReparatur = {
    ...lage,
    laufendeUebergabe: an,
    hervorgehobeneAktionId: an.ziel === 'action-editor' ? an.aktionId : null,
  }

  // Der Rueckkehr-Reiter wird nur gemerkt, wenn ein Wechsel stattfindet, und nur, wenn
  // noch keiner gemerkt ist – sonst verlöre man den Weg zurück (ENTSCHIEDEN 7).
  if (an.ziel === 'action-editor' && lage.rueckkehrReiter === null) {
    neueLage.rueckkehrReiter = aktiverReiter
  }

  return { lage: neueLage, wechselZu }
}

/** Beendet die laufende Übergabe (abgeschlossen ODER abgebrochen) und sagt, wohin
 *  zurückzukehren ist. */
export function beendeUebergabe(lage: ShellReparatur): FuehrungsSchritt {
  // Der Rueckkehr-Reiter wurde beim Wechsel gemerkt, nicht geraten (ENTSCHIEDEN 1).
  // Ohne laufende Übergabe ist er null, und der Aufruf ist wirkungslos (kein Wurf).
  const wechselZu = lage.rueckkehrReiter

  return {
    lage: {
      ...lage,
      laufendeUebergabe: null,
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    },
    wechselZu,
  }
}

/** Übernimmt einen gerechneten Stand aus #132 – den ERSTEN (`starteReparatur`) wie jeden
 *  weiteren (`aktualisiereReparatur`). Der geführte Modus BEGINNT damit; eine eigene
 *  `starteFuehrung` gibt es nicht (ENTSCHIEDEN 8). */
export function uebernimmStand(lage: ShellReparatur, stand: ReparaturStand): ShellReparatur {
  // Unverändert übernommen: nicht kopiert, nicht ergänzt, nicht nachgerechnet (Eingang →
  // Ausgang). Die laufende Übergabe und der Rueckkehr-Reiter bleiben stehen, damit der
  // Fortschritt den Reiterwechsel ueberlebt (TK 9.14.2).
  return { ...lage, stand }
}

/** Verlässt den geführten Modus. Die Render-Sperre bleibt bestehen (das entscheidet #132). */
export function beendeFuehrung(lage: ShellReparatur): ShellReparatur {
  // `stand` bleibt stehen (ENTSCHIEDEN 6): Die Anzeige soll weiter wissen, wie viele
  // Stellen offen sind; die Render-Sperre entscheidet allein #132.
  return {
    ...lage,
    laufendeUebergabe: null,
    hervorgehobeneAktionId: null,
    rueckkehrReiter: null,
  }
}

/** Das Ziel einer Übergabe auf einen Reiter abbilden. null = kein Reiterwechsel nötig. */
export function reiterFuerUebergabe(an: Uebergabe): ReiterId | null {
  // Die Zuordnung ist eine Tabelle, keine Heuristik. Der `default`-Zweig ist erschöpfend:
  // `erreichtNie` verlangt `never` – eine fuenfte Variante wird zum Übersetzungsfehler.
  switch (an.ziel) {
    case 'action-editor':
      return 'aktionen'
    case 'asset-auswahl':
    case 'aktions-auswahl':
    case 'medien-import':
      return null
    default:
      return erreichtNie(an)
  }
}
