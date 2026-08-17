// GENERIERT aus dem Signaturblock von Issue #228.
// [composer] Medien importieren – der Weg aus der Medien-Bibliothek heraus
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
// GERUEST-PRUEFSUMME: 9b025e5f63be519a
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ImportUebergabeErgebnis } from '../app-shell/medien-import-uebergabe'

/**
 * Der Starter wird als PARAMETER übergeben, nicht importiert (Entscheidung E1):
 * `starteMedienImport` liegt in einem anderen Renderer-Modul (`app-shell`, #204), und
 * modulübergreifend reisen nur Typen, keine Aufrufe. Der Typ selbst darf als `import type`
 * kommen – er trägt keinen Zustand.
 */
export type MedienImportStarter = (
  projektId: string,
  nurTyp: 'video' | 'bild' | null,
) => Promise<Ergebnis<ImportUebergabeErgebnis, string>>

/** Was dem Nutzer nach dem Import gesagt wird – rein abgeleitet, ohne Zustand. */
export interface ImportBericht {
  /** Zahl der eingereihten Aufträge = `auftragIds.length`. */
  eingereiht: number
  /** true, wenn der Dialog ohne Auswahl geschlossen wurde. Dann ist alles andere leer. */
  abgebrochen: boolean
  /** Der eine Satz für die Oberfläche. Leer, wenn `abgebrochen` (s. ENTSCHIEDEN 3). */
  text: string
  /** true, wenn etwas übersprungen ODER abgelehnt wurde – der Satz gehört dann hervorgehoben. */
  brauchtAufmerksamkeit: boolean
}

/** Baut den Bericht. Nennt Übersprungenes mit DATEINAMEN und Abgelehntes mit Code (ENTSCHIEDEN 2). */
export function baueImportBericht(ergebnis: ImportUebergabeErgebnis): ImportBericht {
  const eingereiht = ergebnis.auftragIds.length
  const abgebrochen = ergebnis.abgebrochen
  const brauchtAufmerksamkeit =
    ergebnis.uebersprungen.length > 0 || ergebnis.abgelehnt.length > 0

  let text = ''
  if (!abgebrochen) {
    const teile: string[] = [
      `${eingereiht} ${eingereiht === 1 ? 'Medium' : 'Medien'} eingereiht`,
    ]
    if (ergebnis.uebersprungen.length > 0) {
      teile.push(
        `übersprungen: ${ergebnis.uebersprungen.map(dateinameAusPfad).join(', ')}`,
      )
    }
    if (ergebnis.abgelehnt.length > 0) {
      teile.push(
        `abgelehnt: ${ergebnis.abgelehnt
          .map((a) => `${dateinameAusPfad(a.pfad)} (${a.code})`)
          .join(', ')}`,
      )
    }
    text = teile.join('; ')
  }

  return { eingereiht, abgebrochen, text, brauchtAufmerksamkeit }
}

/** Der Dateiname eines Pfades, ohne Verzeichnisanteil – für die Anzeige.
 *  Behandelt `/` UND `\`, damit Windows- und macOS-Pfade gleich behandelt werden. */
export function dateinameAusPfad(pfad: string): string {
  return pfad.split(/[\\/]/).pop() ?? ''
}

/**
 * Stößt den Import für die Medien-Bibliothek an: BEIDE Typen zulassen (`nurTyp: null`).
 * Wartet NICHT auf den Ausgang der Aufträge – der läuft über #199 zurück.
 */
export async function importiereMedien(
  projektId: string,
  starte: MedienImportStarter,
): Promise<Ergebnis<ImportBericht, string>> {
  // Schritt 1 - projektId pruefen, OHNE den Starter zu rufen (Import hat kein Ziel).
  if (typeof projektId !== 'string' || projektId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'projektId fehlt - ein Import braucht ein geoeffnetes Projekt.',
      },
    }
  }

  // Schritt 2 - der Uebergabe-Weg aus #204, IMMER mit nurTyp: null (Bibliothek fuehrt
  // beide Typen). Kein Warten auf den Ausgang - der laeuft ueber #199 zurueck.
  try {
    const ergebnis = await starte(projektId, null)
    if (!ergebnis.ok) {
      // Schritt 3 - Code UNVERAENDERT zurueck, kein Bericht, kein zweiter Versuch.
      return ergebnis
    }
    // Schritt 4 - Erfolg: das Ergebnis von #204 in Klartext uebersetzt.
    return { ok: true, wert: baueImportBericht(ergebnis.wert) }
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Medien-Import konnte nicht angestossen werden.',
      },
    }
  }
}
