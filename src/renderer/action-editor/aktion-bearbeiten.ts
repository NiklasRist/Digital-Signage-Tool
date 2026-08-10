/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #136.
// [action-editor] Aktion anlegen und bearbeiten – Titel ist Pflicht
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
// GERUEST-PRUEFSUMME: 585a63a68616298b
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

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { istAkzentRolle, type AkzentRolle } from './akzentfarbe'

/** Der Entwurf im Formular: alle Felder der Aktion außer der ID, die der Main vergibt. */
export type AktionsEntwurf = Omit<Aktion, 'id'>

/** Feldbezogene Befunde für die Formularanzeige – KEIN IPC-Fehlercode. */
export type EntwurfBefund =
  | { feld: 'titel'; grund: 'leer' }
  | { feld: 'vorlagenId'; grund: 'leer' }
  | { feld: 'standardDauer'; grund: 'ausserhalb_bereich' }
  | { feld: 'akzentfarbe'; grund: 'keine_rolle' }

/** Reine, synchrone Vorabprüfung. Geprüft wird AUSSCHLIESSLICH, was im übergebenen Objekt
 *  tatsächlich vorkommt – ein fehlendes Feld erzeugt KEINEN Befund. Leeres Array heißt
 *  „nichts zu beanstanden", NICHT „vollständig". */
export function pruefeEntwurf(entwurf: Partial<AktionsEntwurf>): EntwurfBefund[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #136."
  );
}

/** Ein leerer Entwurf mit den Vorbelegungen für „Neue Aktion". */
export function leererEntwurf(vorlagenId: string, akzentfarbe: AkzentRolle): AktionsEntwurf {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #136."
  );
}

/** Legt die Aktion über den Kanal `project:erstelleAktion` an.
 *  Prüft ZUSÄTZLICH zu `pruefeEntwurf`, dass die Pflichtfelder überhaupt vorhanden sind. */
export async function legeAktionAn(entwurf: AktionsEntwurf): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #136."
  );
}

/** Schreibt geänderte Felder über den Kanal `project:bearbeiteAktion`. */
export async function speichereAktion(
  id: string,
  aenderungen: Partial<AktionsEntwurf>,
): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #136."
  );
}
