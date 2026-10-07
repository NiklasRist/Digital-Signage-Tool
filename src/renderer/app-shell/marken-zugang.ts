// Issue #305 - [app-shell] Zugang zur gemeinsamen Marken-Sicht bereitstellen.
//
// DIESE DATEI VERTEILT NUR DEN ZUGANG: Die Marken-Uebersicht (#295) entsteht EINMAL je
// Fenster und nur im marken-editor (marken-uebersicht.ts); hier liegt kein zweiter
// Bestand, kein eigenes Laden, keine Logik. Module ausserhalb des marken-editor-Ordners
// (action-editor, composer, template-canvas) importieren die Sicht NICHT direkt - dieselbe
// Regel, die M7-04 fuer die Projekt- und die Vorlagen-Sicht festlegt:
//
//   "Module ausserhalb dieses Ordners (etwa app-shell, #305) importieren diese Sicht
//   nicht direkt; sie bekommen die Aktualisierungsfunktionen als Parameter
//   uebergeben." (#295, ENTSCHIEDEN 1)
//
// WARUM ES KEIN IPC-EREIGNIS GIBT: marken:autoSpeichernStatus (#278) meldet ausschliesslich
// einen gescheiterten Schreibvorgang, nicht den Inhalt - der Ausgleich ist wie bei
// Projekt/Vorlagen: Der marken-editor haelt den Stand (#295) und meldet ihn seinen
// Abonnenten. Diese Datei abonniert NICHTS - der Empfaenger ist #327.
//
// EIN AUFRUFER VON BAUEMARKENZUGANG: die Verdrahtung in sichten.ts und dem
// Renderer-Bootstrap leistet #311. Bis dahin ist dieser Zugang fertig, geprueft und OHNE
// Aufrufer - dieselbe Lueckenklasse, die der Zuschnitt als eigenstaendigen Nachtrag
// zugewiesen hat.
//
// AUSDRUECKLICH NICHT HIER: der fuenfte Reiter [Marken] (#314, TK 9.14.1) und der
// Speicherstatus-Hinweis (#327). Auch die Verdrahtung nach sichten.ts gehoert #311 - dort
// entsteht `Sichten.marken` (ein neues Feld, analog zu projekt/vorlagen) und zugleich die
// Entfernung des ueberholten `Sichten.marke` (config:leseMarke liefert EINE unveränderliche
// Marke, TK 9.14.1 v3.4; die Migration #281 nimmt das Markenfeld aus config.json; der
// Kanal dieser Quelle ist ab da ohne Sinn). Diese Datei aendert sichten.ts NICHT.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import {
  type MarkenUebersicht, ladeUebersicht, holeUebersicht, aufUebersichtGeaendert,
} from '../marken-editor/marken-uebersicht'

/**
 * Zugang zur gemeinsamen Marken-Übersicht (#295). Reine Weiterreichung, keine eigene Logik -
 * dasselbe Muster wie `VorlagenZugang` in M7-04 (s. sichten.ts). Bewusst NUR die Listen-Sicht:
 * `oeffneMarke`/`holeGeoeffneteMarke` aus #295 sind editor-interne Konzepte ("welche Marke wird
 * GERADE bearbeitet") und werden NICHT weitergereicht - Module ausserhalb des Editors brauchen
 * eine beliebige Marke per ID aus dem Bestand, nicht "die gerade offene".
 */
export interface MarkenZugang {
  /** (Erneutes) Laden über marken:listeMarken (#304, aufgerufen von #295). */
  lade: () => Promise<Ergebnis<MarkenUebersicht, string>>
  /** Momentaufnahme; null, solange nie erfolgreich geladen wurde. */
  hole: () => MarkenUebersicht | null
  aufGeaendert: (hoerer: (uebersicht: MarkenUebersicht) => void) => () => void
}

/**
 * Baut den Zugang EINMAL auf und lädt die Übersicht einmalig nach. Liefert entweder einen
 * vollständigen Zugang mit gefüllter Übersicht oder einen benannten Fehler - NIE einen Zugang
 * mit `hole() === null` im Erfolgsfall.
 *
 * DIE ZWEI Schritte sind verbindlich (Ablauf):
 *   1. await ladeUebersicht() - bei ok:false den Code UNVERAENDERT als string zurueckgeben
 *      (die fachliche Union MarkenFehlercode liegt im Main; der Renderer importiert sie nicht),
 *      und KEIN Zugang entsteht.
 *   2. Den Zugang mit den drei importierten Funktionen zusammensetzen und liefern.
 *
 * Der Aufruf DARF mehrfach gelten: Ein zweiter Aufruf laedt die Uebersicht erneut (kein
 * Einmal-Schutz, dieselbe Begruendung wie in M7-04); die Funktionen jedes daraus
 * hervorgegangenen Zugangs zeigen aufs SELBE marken-editor-Modul - es entsteht KEINE zweite
 * Sicht.
 */
export async function baueMarkenZugang(): Promise<Ergebnis<MarkenZugang, string>> {
  // SCHRITT 1: das Erstladen - ein fehlgehender Aufruf bricht hier ab, KEIN Zugang.
  const erststand = await ladeUebersicht()
  if (!erststand.ok) return erststand
  // SCHRITT 2: DIE FUNKTIONEN SELBST reisen - keine Wrapper, kein Zusatzverhalten (DoD:
  // toBe-gleich zu den drei importierten Funktionen). hole() liefert ab hier die Sicht,
  // die Schritt 1 soeben gesetzt hat: nie null im Erfolgsfall DIESER Funktion (erst ein
  // spaeterer misslungener lade()-Aufruf laesst den letzten guten Stand stehen).
  const zugang: MarkenZugang = {
    lade: ladeUebersicht,
    hole: holeUebersicht,
    aufGeaendert: aufUebersichtGeaendert,
  }
  return { ok: true, wert: zugang }
}
