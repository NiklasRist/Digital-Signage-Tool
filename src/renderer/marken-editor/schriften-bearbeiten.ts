// Issue #297 - [marken-editor] Schrift-Rollen anzeigen und eine .woff2 importieren.
//
// VIER feste Rollen; Anzeige rein ueber marke.schriften[rolle].herkunft, KEINE zweite
// Quelle (ENTSCHIEDEN 1). importiereSchrift loest KEINEN Dateidialog aus (ENTSCHIEDEN 2):
// der native Dialog mit dem .woff2-Filter gehoert dem marken-store (#306); quellPfad
// kommt als fertiger Parameter - gerufen wird der Dialog von
// waehleUndImportiereSchrift in datei-import.ts (#326), die danach importiereSchrift ruft.
// Diese Datei importiert datei-import.ts daher ausdruecklich NICHT (Richtung umgekehrt).
//
// LIZENZHINWEIS (R-07, TK 9.15.3): kein technischer Riegel moeglich - es gibt keine
// Lizenzpruefung im Code. Die Zusage haengt daran, dass der Nutzer den Text SIEHT,
// bevor die Dateiauswahl aufgeht; Anzeiger ist #330 (#326 kapselt den Ruf).
// dès Text gibt es GENAU EINEN: LIZENZHINWEIS_IMPORT.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, Schrift, SchriftRolle } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/**
 * Die vier Schrift-Rollen in fester Anzeigereihenfolge (TK 9.11.2) - NICHT alphabetisch
 * sortiert, sondern Tabellenreihenfolge.
 */
export const SCHRIFT_ROLLEN: readonly SchriftRolle[] = [
  'headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett',
]

/** Reiner Lesezugriff: die Schrift EINER Rolle plus ob sie importiert (statt gebündelt) ist. */
export interface SchriftAnzeige {
  rolle: SchriftRolle
  schrift: Schrift // vollstaendig, wie in marke.schriften[rolle]
  importiert: boolean // === (schrift.herkunft === 'importiert')
}

/** Baut die Anzeige fuer ALLE VIER Rollen einer bereits geladenen (aufgeloesten) Marke. */
export function baueSchriftAnzeige(marke: Marke): readonly SchriftAnzeige[] {
  return SCHRIFT_ROLLEN.map((rolle) => {
    const schrift = marke.schriften[rolle]
    return { rolle, schrift, importiert: schrift.herkunft === 'importiert' }
  })
}

/**
 * LIZENZHINWEIS-TEXT (fest, TK 9.15.3 / Anforderungsdokument R-07). Exportiert, damit die
 * zeichnende Komponente ihn UNVERAENDERT anzeigt, statt ihn selbst zu formulieren.
 */
export const LIZENZHINWEIS_IMPORT =
  'Für importierte Schriften trägst du die Nutzungsrechte. Die Anwendung brennt die Schrift in ein ' +
  'Video ein, das weitergegeben und öffentlich gezeigt wird – prüfe die Lizenz vor dem Import.'

/**
 * Importiert quellPfad als .woff2 fuer rolle der Marke markeId und uebernimmt bei Erfolg
 * das Ergebnis in die gemeinsame Sicht (#295).
 */
export async function importiereSchrift(
  markeId: string,
  rolle: SchriftRolle,
  quellPfad: string,
): Promise<Ergebnis<Marke, string>> {
  // Die FORM vor IPC: markeId und quellPfad muessen gefuellter Text sein. schriftRolle
  // wird AUSSCHLIESSLICH als der Wert von rolle gesendet (#304 verlangt das Feld immer;
  // bei art 'schrift' gesetzt).
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'importiereSchrift braucht eine nicht leere markeId.',
      },
    }
  }
  if (typeof quellPfad !== 'string' || quellPfad.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'importiereSchrift braucht einen nicht leeren quellPfad.',
      },
    }
  }
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.importiereMarkenDatei, {
    markeId,
    art: 'schrift',
    schriftRolle: rolle,
    quellPfad,
  })
  if (!antwort.ok) return antwort
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}
