// Issue #235 (M7-42) - undo-projekt.ts: Schnappschuss als GANZES ueber DIESEN EINEN
// Weg zurueckschreiben - `project:setzeBearbeitungsstand` (M7-44/M7-47) - und die
// gemeinsame Projekt-Sicht nachziehen. Denselben Pfad wie eine normale Aenderung,
// damit das Auto-Speichern (9.5.4) im Main anspringt (TK 9.13.2); KEIN Ausloesen
// des Speicherns hier (ENTSCHIEDEN 7), keine inversen Operationen (FALLE 2), kein
// Teil-Schnappschuss, `assets`/`letzterAusgabeName` beruehrt diese Datei NIE.
// Der Stapel wird erst NACH dem erfolgreichen Aufruf vollzogen (ENTSCHIEDEN 1);
// im Erfolgsfall erst `vollzieheZurueck`, dann `setzeProjekt` (ENTSCHIEDEN 2).
// Bauform wie beim Zwilling `undo-vorlage.ts` (M7-43): kein throw,
// jeder Weg endet in einem Ergebnis oder void; die fuenf Exporte behalten ihre
// kurzen Namen (ENTSCHIEDEN 8 - die Vorlagen-Gegenstuecke tragen Vorlage-Namen).

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { projektHistorie, leereProjektHistorie, type ProjektStand } from './undo-historien'

/**
 * Der Zugang zur gemeinsamen Projekt-Sicht. Wird als PARAMETER übergeben (Entscheidung E1,
 * #197) – diese Datei importiert KEINE Sicht aus einem anderen Renderer-Modul.
 */
export interface ProjektUndoZugang {
  /** Das aktuell geladene Projekt; null, wenn keins offen ist. Aus #197: projekt.hole().projekt */
  holeProjekt: () => Project | null
  /** Ersetzt das Projekt in der gemeinsamen Sicht (#121, über #197). */
  setzeProjekt: (projekt: Project) => void
}

/** Was ein Rückgängig/Wiederherstellen bewirkt hat. */
export type UndoWirkung =
  | { art: 'nichts_zu_tun' }
  | { art: 'angewendet'; projekt: Project }

/**
 * Legt den JETZIGEN Stand des geladenen Projekts als Schnappschuss ab.
 * VOR jeder Instant-Operation der Projekt-Bearbeitung aufzurufen (TK 9.13.2).
 * Ohne geladenes Projekt geschieht nichts.
 */
export function merkeVorAenderung(zugang: ProjektUndoZugang): void {
  // 1. Ohne geladenes Projekt geschieht NICHTS - kein Fehler, keine Meldung.
  const projekt = zugang.holeProjekt()
  if (projekt === null) {
    return
  }

  // 2. Der Schnappschuss wird OHNE Kopie gebildet (ENTSCHIEDEN 5): die gemeinsame
  //    Sicht garantiert, dass ihre Werte nie verändert werden; die verbindliche
  //    Kopie passiert beim Serialisieren über IPC und im Main.
  projektHistorie().ablegen({
    projektId: projekt.id,
    // VERTRAGSNACHTRAG (gemeldet, s. Issue-Nachtrag): Der Issue-Text nennt genau zwei
    // Felder (Stand vor TK v3.18); der gebaute Vertrag Bearbeitungsstand verlangt seit
    // #334 / v3.18 zusaetzlich standardSegmentdauer (project.ts-Kommentar: "das dritte
    // Feld kam mit TK v3.18 / #334 dazu"). Gebauter Code gewinnt - das Feld gehoert in
    // den Schnappschuss, sonst waere kein Undo mehr gueltig einspielbar.
    stand: {
      aktionen: projekt.aktionen,
      liste: projekt.liste,
      standardSegmentdauer: projekt.standardSegmentdauer,
    },
  })
}

/** Ob ein Rückgängig gerade angeboten werden darf (Stand vorhanden UND zum offenen Projekt). */
export function kannRueckgaengig(zugang: ProjektUndoZugang): boolean {
  const projekt = zugang.holeProjekt()
  if (projekt === null) {
    return false
  }
  const ziel = projektHistorie().vorschauZurueck()
  return ziel !== null && ziel.projektId === projekt.id
}

/** Gegenstück für das Wiederherstellen. */
export function kannWiederherstellen(zugang: ProjektUndoZugang): boolean {
  const projekt = zugang.holeProjekt()
  if (projekt === null) {
    return false
  }
  const ziel = projektHistorie().vorschauVor()
  return ziel !== null && ziel.projektId === projekt.id
}

/**
 * Wendet den nächsten Stand an (Rückgängig ODER Wiederherstellen) - der gemeinsame
 * Kern beider Richtungen; der Aufruf, die Kennungsprüfung und die Vollzugs-Reihenfolge
 * sind vertraglich und in beiden Richtungen identisch.
 */
async function wendeAn(
  zugang: ProjektUndoZugang,
  richtung: 'zurueck' | 'vor',
): Promise<Ergebnis<UndoWirkung, string>> {
  // Schritt 1: kein Projekt geladen -> nicht_gefunden, OHNE jede Wirkung.
  const projekt = zugang.holeProjekt()
  if (projekt === null) {
    return {
      ok: false,
      fehler: {
        code: 'nicht_gefunden',
        meldung: 'Es ist kein Projekt geladen, ein Rückgängig ist nicht möglich.',
      },
    }
  }

  // Schritt 2: nichts zu tun ist KEIN Fehler (ENTSCHIEDEN 4) - kein Aufruf,
  // Stapel unangetastet.
  const ziel =
    richtung === 'zurueck' ? projektHistorie().vorschauZurueck() : projektHistorie().vorschauVor()
  if (ziel === null) {
    return { ok: true, wert: { art: 'nichts_zu_tun' } }
  }

  // Schritt 3 (ENTSCHIEDEN 3, die wichtigste Schutzmaßnahme): Ein Schnappschuss mit
  // fremder projektId wird ABGEWIESEN und die ganze Historie geleert - der Main kann
  // ihn nicht als fremd erkennen, und ein leerer Schnappschuss ist dort gültig; ein
  // übersehener Projektwechsel würde sonst das neue Projekt VOLLSTÄNDIG leeren.
  if (ziel.projektId !== projekt.id) {
    leereProjektHistorie()
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          `Der Schnappschuss gehört zum Projekt "${ziel.projektId}", geöffnet ist ` +
          `"${projekt.id}". Die Historie wurde geleert.`,
      },
    }
  }

  // Schritt 4: der Stand JETZT (wird bei Erfolg in den Gegenzweig vollzogen).
  const aktuell: ProjektStand = {
    projektId: projekt.id,
    stand: {
      aktionen: projekt.aktionen,
      liste: projekt.liste,
      standardSegmentdauer: projekt.standardSegmentdauer,
    },
  }

  // Schritt 5: GENAU EIN Aufruf, mit dem VOLLSTÄNDIGEN Schnappschuss und der
  // vorgeschriebenen Nutzlast { stand }. Nie Einzeloperationen, nie ein Delta.
  let antwort: Ergebnis<Project, string>
  try {
    antwort = await rufeAuf<Project, string>(KANAELE.project.setzeBearbeitungsstand, {
      stand: ziel.stand,
    })
  } catch (ursache) {
    // Fehlerpfad: rufeAuf wirft (Bridge fehlt, Serialisierung scheitert) -> gefangen,
    // kein Wurf nach außen; Stapel unverändert.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }

  // Schritt 6: Fehlschlag -> Code UNVERÄNDERT; NICHTS vollziehen, NICHTS an der
  // Sicht ändern („halb eingespielt wäre schlimmer als nicht ausgeführt", TK 9.5.2).
  if (!antwort.ok) {
    return antwort
  }

  // Schritt 7 - in DIESER Reihenfolge (ENTSCHIEDEN 2): erst den Stapel vollziehen
  // (sonst schriebe ein zweites Rückgängig denselben Stand), dann die Sicht
  // nachziehen. Ein werfendes setzeProjekt verlässt die Datei nicht.
  try {
    if (richtung === 'zurueck') {
      projektHistorie().vollzieheZurueck(aktuell)
    } else {
      projektHistorie().vollzieheVor(aktuell)
    }
    zugang.setzeProjekt(antwort.wert)
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
  return { ok: true, wert: { art: 'angewendet', projekt: antwort.wert } }
}

/** Schreibt den vorherigen Schnappschuss über setzeBearbeitungsstand zurück. */
export async function macheRueckgaengig(
  zugang: ProjektUndoZugang,
): Promise<Ergebnis<UndoWirkung, string>> {
  return wendeAn(zugang, 'zurueck')
}

/** Schreibt den zuvor zurückgenommenen Schnappschuss wieder vor. */
export async function stelleWiederHer(
  zugang: ProjektUndoZugang,
): Promise<Ergebnis<UndoWirkung, string>> {
  return wendeAn(zugang, 'vor')
}
