import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { EditorSitzung } from '../vorlagen-editor/arbeitskopie'   // NUR der Typ (import type)
import type { VorlagenUndoZugang } from './undo-vorlage'
import { merkeVorlageVorAenderung } from './undo-vorlage'
import { leereVorlagenHistorie } from './undo-historien'

/** Warum ein Schnappschuss abgelegt wurde – oder warum nicht. */
export type Vorlagenaufzeichnung =
  | 'ablegen'          // echte Aenderung an derselben Arbeitskopie -> merkeVorlageVorAenderung
  | 'sitzungsbeginn'   // vorher war keine Sitzung offen -> nichts zu sichern
  | 'sitzungswechsel'  // eine ANDERE arbeitsId zieht ein -> nichts zu sichern, Historie leeren
  | 'ohne_wirkung'     // dieselbe Arbeitskopie-Referenz -> es hat sich nichts geaendert

/**
 * Die ganze Entscheidungslogik dieses Issues – als REINE Funktion ohne Zustand, ohne Stapel und
 * ohne Sitzungshalter. Sie ist der Teil, der ohne Browser und ohne Testdoppel vollstaendig
 * pruefbar ist. Reihenfolge der Pruefungen ist Vertrag (s. „Der Ablauf").
 * Total: wirft nie.
 */
export function entscheideVorlagenAufzeichnung(
  jetzt: EditorSitzung | null,
  eingehend: EditorSitzung,
): Vorlagenaufzeichnung {
  // Genau diese Reihenfolge, erster Treffer gewinnt (Vertrag, s. „Der Ablauf").
  //
  // 1. Keine offene Sitzung: es gibt nichts zu sichern - auch dann nicht, wenn `eingehend`
  //    irgendeine Arbeitskopie traegt.
  if (jetzt === null) {
    return 'sitzungsbeginn'
  }
  // 2. Eine ANDERE arbeitsId zieht ein: Die Kennung entscheidet, nicht der Inhalt - zwei
  //    Arbeitskopien koennen theoretisch dieselbe Referenz tragen (in Tests trivial).
  if (eingehend.arbeitsId !== jetzt.arbeitsId) {
    return 'sitzungswechsel'
  }
  // 3. DIESELBE Arbeitskopie-Referenz: nichts geschehen, nichts ablegen. Kein tiefer
  //    Vergleich (ENTSCHIEDEN 8) - der Editor liefert bei jeder Aenderung einen neuen Wert.
  if (eingehend.arbeitskopie === jetzt.arbeitskopie) {
    return 'ohne_wirkung'
  }
  // 4. Alles andere ist eine echte Bearbeitung derselben Arbeitskopie.
  return 'ablegen'
}

/**
 * Der Sitzungshalter der Shell. Er ist die EINE Stelle, an der die laufende Editor-Sitzung liegt –
 * damit sie einen Reiterwechsel ueberlebt (TK 9.14.2) und damit es einen Ort gibt, an dem der
 * Schnappschuss entsteht.
 */
export interface Sitzungshalter {
  /** Die laufende Sitzung; null, wenn der Editor nicht geoeffnet ist. */
  holeSitzung: () => EditorSitzung | null
  /**
   * Eine BEARBEITUNG uebernehmen (Zone verschoben, Parameter geaendert, Zone hinzugefuegt …).
   * Legt vorher den bisherigen Stand auf die Vorlagen-Historie – das ist der Auslöser aus 9.13.2.
   */
  uebernimmAenderung: (sitzung: EditorSitzung) => void
  /**
   * Einen Stand uebernehmen, der KEINE Bearbeitung ist: den Nachhall von `sichereStand` und das
   * Ergebnis eines Rueckgaengig/Wiederherstellen. Legt NIE einen Schnappschuss ab.
   */
  uebernimmSpeicherstand: (sitzung: EditorSitzung) => void
  /**
   * Editor-Schluss: nach `uebernehmeInParent`, `alsEigenstaendige` oder `verwerfeArbeitskopie`.
   * Setzt die Sitzung auf null UND leert die Vorlagen-Historie (TK 9.13.2, s. ENTSCHIEDEN 5).
   */
  beendeSitzung: () => void
  /** Abonnement fuer Sitzungsaenderungen; Rueckgabewert ist die Abmelde-Funktion. */
  aufSitzungGeaendert: (hoerer: (sitzung: EditorSitzung | null) => void) => () => void
}

// Der EINE Halter des Fensters als Modul-Zustand (ENTSCHIEDEN 1): Er ueberlebt damit den
// Reiterwechsel (TK 9.14.2) und liegt ausserhalb jeder Komponente. Die Hörerliste wird nie
// in eine uebernommene Sitzung geschrieben und gehoert nicht zu einem Browser-Fenster.
let aktuellerHalter: Sitzungshalter | null = null

/** Der EINE Sitzungshalter des Fensters. Liefert bei jedem Aufruf DIESELBE Instanz. */
export function sitzungshalter(): Sitzungshalter {
  if (aktuellerHalter === null) {
    aktuellerHalter = bauerHalter()
  }
  return aktuellerHalter
}

/** NUR für Tests: ersetzt den Sitzungshalter durch einen frischen, leeren. */
export function setzeSitzungshalterZurueck(): void {
  aktuellerHalter = null
}

/** Baut einen frischen, leeren Halter. Nicht exportiert - die Instanz wird gemerkt. */
function bauerHalter(): Sitzungshalter {
  let sitzung: EditorSitzung | null = null
  let hoerer: ((sitzung: EditorSitzung | null) => void)[] = []

  function benachrichtige(neuerStand: EditorSitzung | null): void {
    // Kopie der Hörerliste in Anmeldereihenfolge (ENTSCHIEDEN 10): Ein Hörer, der sich in
    // seinem eigenen Rückruf abmeldet, bricht die laufende Runde nicht ab; ein werfender
    // Hörer reißt niemanden mit.
    const kopie = [...hoerer]
    for (const anmelden of kopie) {
      try {
        anmelden(neuerStand)
      } catch {
        // Ein werfender Hörer wird gefangen - die Ausnahme verlässt diese Datei nicht.
      }
    }
  }

  function holeSitzung(): EditorSitzung | null {
    return sitzung
  }

  function uebernimmSpeicherstand(neue: EditorSitzung): void {
    // Der stumme Weg: Nachhall von sichereStand bzw. Ergebnis eines Rueckgaengig. NIE ein
    // Schnappschuss, NIE ein Leeren (Gestalt 1 aus der R2-Pruefung).
    sitzung = neue
    benachrichtige(neue)
  }

  /**
   * Der Zugang für den Schnappschuss-Auslöser (ENTSCHIEDEN 8): Diese Datei baut den
   * Schnappschuss nicht selbst, sie ruft `merkeVorlageVorAenderung` (#236), die nur
   * `holeSitzung()` liest und `sitzung.arbeitskopie` ablegt. `setzeSitzung` und
   * `sichereStand` werden dabei nie gerufen; sie stehen nur, weil der Typ sie verlangt.
   */
  function zugangAufJetzigenStand(): VorlagenUndoZugang {
    return {
      holeSitzung,
      setzeSitzung: uebernimmSpeicherstand,
      sichereStand: () =>
        Promise.resolve({
          ok: false as const,
          fehler: {
            code: 'unbekannter_fehler' as const,
            meldung: 'Der Sitzungshalter hat keinen Speicherweg - nur #236 besitzt einen.',
          },
        }),
    }
  }

  function uebernimmAenderung(neue: EditorSitzung): void {
    // 1+2. Entscheiden, BEVOR irgendetwas uebernommen wird.
    const entscheidung = entscheideVorlagenAufzeichnung(sitzung, neue)
    if (entscheidung === 'ablegen') {
      // 3. Der Schnappschuss VOR der Uebernahme: merkeVorlageVorAenderung liest die
      //    Sitzung ueber holeSitzung() - jetzt steht dort noch der ALTE Stand.
      merkeVorlageVorAenderung(zugangAufJetzigenStand())
    } else if (entscheidung === 'sitzungswechsel') {
      // 4. ENTSCHIEDEN 4: ein Wechsel leert die Historie - als Ausloeser, nicht als Pruefung.
      leereVorlagenHistorie()
    }
    // 5. Uebernehmen und benachrichtigen.
    sitzung = neue
    benachrichtige(neue)
  }

  function beendeSitzung(): void {
    // 1+2. Sitzung auf null, Historie leeren (ENTSCHIEDEN 5), 3. Hörer mit null.
    sitzung = null
    leereVorlagenHistorie()
    benachrichtige(null)
  }

  function aufSitzungGeaendert(hoererIn: (sitzung: EditorSitzung | null) => void): () => void {
    // Beim Anmelden wird NICHT gerufen (DoD).
    hoerer.push(hoererIn)
    let aktiv = true
    return () => {
      // Idempotent: der zweite und jeder weitere Aufruf ist wirkungslos (ENTSCHIEDEN 10).
      if (!aktiv) {
        return
      }
      aktiv = false
      hoerer = hoerer.filter((h) => h !== hoererIn)
    }
  }

  return {
    holeSitzung,
    uebernimmAenderung,
    uebernimmSpeicherstand,
    beendeSitzung,
    aufSitzungGeaendert,
  }
}

/**
 * Baut den Zugang, den #236 erwartet – der Setzer ist IMMER `uebernimmSpeicherstand`.
 * Das schliesst die Rueckkopplung „Rueckgaengig erzeugt einen Schnappschuss" strukturell aus.
 */
export function baueVorlagenUndoZugang(
  halter: Sitzungshalter,
  sichereStand: (
    sitzung: EditorSitzung,
    stand: Vorlage,
  ) => Promise<Ergebnis<EditorSitzung, string>>,
): VorlagenUndoZugang {
  return {
    holeSitzung: halter.holeSitzung,
    setzeSitzung: halter.uebernimmSpeicherstand,
    sichereStand,
  }
}
