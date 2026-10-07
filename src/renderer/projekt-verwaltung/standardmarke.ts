// [projekt-verwaltung] Standardmarke - Lage ableiten, Auswahl bauen, Wechsel ausfuehren
// (#324, TK 9.14.3 / 9.5.2). Reine Logik + EIN IPC-Aufruf; das Bedienelement zeichnet
// standardmarke.tsx.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import type { Project } from '../../shared/contracts/project'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/** Ein Eintrag des Auswahlmenues. Reine Anzeige-Ableitung, kein gehaltener Zustand. */
export interface MarkenWahl {
  id: string
  name: string
  eingebaut: boolean
  /** true fuer genau den Eintrag, der aktuell Standardmarke ist. Hoechstens einer. */
  aktuell: boolean
}

/**
 * Die Lage EINER Projektzeile in Bezug auf ihre Standardmarke. Ein WERT, nichts mutiert ihn.
 * `gesperrt` heisst: sichtbar, aber nicht bedienbar (TK 9.14.3) - NIE unsichtbar.
 */
export type StandardmarkenLage =
  | { art: 'bereit'; aktuelle: Marke; wahl: readonly MarkenWahl[] }
  | { art: 'unbekannte_marke'; markeId: string; wahl: readonly MarkenWahl[] }
  | { art: 'gesperrt'; grund: 'beschaedigt' | 'kein_bestand' }

export function baueStandardmarkenLage(
  meta: ProjektMeta,
  aktuelleMarkeId: string | null,
  marken: readonly Marke[] | null,
): StandardmarkenLage {
  // Reihenfolge der Pruefung verbindlich: beschaedigt -> kein_bestand ->
  // unbekannte_marke -> bereit. Reine Funktion, kein IPC.
  if (meta.beschaedigt) {
    return { art: 'gesperrt', grund: 'beschaedigt' }
  }
  if (marken === null || marken.length === 0) {
    return { art: 'gesperrt', grund: 'kein_bestand' }
  }
  const wahl: MarkenWahl[] = marken.map((marke) => ({
    id: marke.id,
    name: marke.name,
    eingebaut: marke.eingebaut,
    aktuell: aktuelleMarkeId === marke.id,
  }))
  // Die Kennung kommt SO, wie sie reinkommt; sie wird nie gegen den Bestand erzwungen.
  const aktuelle =
    aktuelleMarkeId !== null ? marken.find((marke) => marke.id === aktuelleMarkeId) : undefined
  if (aktuelleMarkeId === null || aktuelle === undefined) {
    return { art: 'unbekannte_marke', markeId: aktuelleMarkeId ?? '', wahl }
  }
  return { art: 'bereit', aktuelle, wahl }
}

export function istWechselNoetig(
  aktuelleMarkeId: string | null,
  gewaehlteMarkeId: string,
): boolean {
  if (gewaehlteMarkeId === '') return false
  return aktuelleMarkeId !== gewaehlteMarkeId
}

export interface StandardmarkenWirkungen {
  /** Das GELADENE Projekt oder null. Nur zum Vergleich der Kennung - nicht zum Schreiben. */
  holeProjekt: () => Project | null
  /**
   * Uebernimmt das zurueckgegebene Projekt in die gemeinsame Projekt-Sicht.
   * Wird AUSSCHLIESSLICH gerufen, wenn `holeProjekt()?.id === projektId` ist (TK 9.5.2).
   */
  uebernimmProjekt: (projekt: Project) => void
  /** Laedt die Projektliste neu (#222). Ihr Rueckgabewert wird NICHT ausgewertet. */
  aktualisiereProjektliste: () => Promise<unknown>
  /** Meldeweg fuer Fehler. Diese Dateien zeigen nichts selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

export async function wechsleStandardMarke(
  projektId: string,
  markeId: string,
  wirkungen: StandardmarkenWirkungen,
): Promise<Ergebnis<Project, string>> {
  // EIN Aufruf (TK 9.5.2); die Nutzlast hat EXAKT zwei Felder. Kein Undo, keine
  // Umhuellung: nicht undo-faehig, und der Wechsel ist jederzeit wiederholbar.
  const antwort = await rufeAuf<Project, string>(
    KANAELE.project.setzeStandardMarke,
    { projektId, markeId },
  )
  if (!antwort.ok) {
    wirkungen.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
    return antwort // Code und meldung reisen UNVERAENDERT
  }
  // UEbernehmen NUR beim geladenen Projekt (verbindlich, TK 9.5.2) - sonst tauscht
  // der fremde Wechsel das offene Projekt in der gemeinsamen Sicht aus.
  if (wirkungen.holeProjekt()?.id === projektId) {
    wirkungen.uebernimmProjekt(antwort.wert)
  }
  // Die Liste laedt in ALLEN Erfolgsfaellen neu; ihr Rueckgabewert wird NICHT
  // ausgewertet und ihr Scheitern gilt nicht als Rueckbau des Wechsels.
  // Der Fehler bleibt NICHT abgefangen: er wuerde das ok: true aus der Hand
  // reissen. Bewusst ohne Meldung - die Liste ist #222 zugeordnet.
  try {
    await wirkungen.aktualisiereProjektliste()
  } catch {
    // Gemessen in standardmarke-logik.spec.ts: unverändert ok: true, keine Meldung.
  }
  return antwort
}
