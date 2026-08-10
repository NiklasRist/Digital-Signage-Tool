/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #225.
// [projekt-verwaltung] Ein Projekt duplizieren
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
// GERUEST-PRUEFSUMME: 4f7f394ac1be7725
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

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/** Frühe Rückmeldung auf den eingegebenen Namen. KEIN Ersatz für die Prüfung im Main. */
export type Namenspruefung = { ok: true; name: string } | { ok: false; grund: 'leer' }

/** Schneidet führende/folgende Leerzeichen ab und weist einen danach leeren Namen zurück.
 *  Es wird NICHTS anderes geprüft (s. ENTSCHIEDEN 4). */
export function pruefeDuplikatname(eingabe: string): Namenspruefung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #225."
  );
}

/** Der vorbelegte Vorschlag für das Eingabefeld: `<name> Kopie` (s. ENTSCHIEDEN 3). */
export function schlageDuplikatnamenVor(meta: ProjektMeta): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #225."
  );
}

/**
 * Der Hinweis, der VOR dem Auslösen zu zeigen ist. Nennt die Anzahl der mitkopierten Medien,
 * dass es dauern kann, und dass die gerenderten Ausgabedateien NICHT mitkopiert werden.
 * Liefert `null`, wenn `anzahlMedien` keine brauchbare Zahl ist (s. ENTSCHIEDEN 5).
 */
export function baueDuplizierHinweis(meta: ProjektMeta): string | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #225."
  );
}

/** Was der Aufrufer während des Laufs anzeigen und danach tun muss. */
export interface DuplizierWirkungen {
  /** Lädt die Projektliste neu (#222). Pflicht: sonst fehlt das Duplikat in der Übersicht. */
  aktualisiereProjektliste: () => Promise<unknown>
}

/**
 * Dupliziert das Projekt und frischt danach die Liste auf.
 * Öffnet das Duplikat NICHT (s. ENTSCHIEDEN 2) und wechselt KEINEN Reiter.
 */
export async function dupliziereProjekt(
  quellId: string,
  eingabe: string,
  wirkungen: DuplizierWirkungen,
): Promise<Ergebnis<Project, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #225."
  );
}
