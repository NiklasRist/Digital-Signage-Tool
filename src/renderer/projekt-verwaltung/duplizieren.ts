// GENERIERT aus dem Signaturblock von Issue #225.
// [projekt-verwaltung] Ein Projekt duplizieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
