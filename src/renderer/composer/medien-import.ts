/* eslint-disable @typescript-eslint/no-unused-vars */
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
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #228."
  );
}

/** Der Dateiname eines Pfades, ohne Verzeichnisanteil – für die Anzeige.
 *  Behandelt `/` UND `\`, damit Windows- und macOS-Pfade gleich behandelt werden. */
export function dateinameAusPfad(pfad: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #228."
  );
}

/**
 * Stößt den Import für die Medien-Bibliothek an: BEIDE Typen zulassen (`nurTyp: null`).
 * Wartet NICHT auf den Ausgang der Aufträge – der läuft über #199 zurück.
 */
export async function importiereMedien(
  projektId: string,
  starte: MedienImportStarter,
): Promise<Ergebnis<ImportBericht, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #228."
  );
}
