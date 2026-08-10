/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #223.
// [projekt-verwaltung] Beschädigte Projekte sichtbar machen und den Ordner öffnen
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
// GERUEST-PRUEFSUMME: 23954cf4f8329f12
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
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/** Was von einem beschädigten Eintrag angezeigt wird – rein abgeleitet, ohne Zustand. */
export interface BeschaedigtDarstellung {
  /** Die Behelfs-Bezeichnung: `meta.name`, der bei `beschaedigt: true` der ORDNERNAME ist. */
  bezeichnung: string
  /** Der Warntext der Zeile. Nennt, was NICHT geht, und was noch da ist. */
  warntext: string
  /** Immer false bei `beschaedigt: true` – „Öffnen" ist deaktiviert (TK 9.14.3). */
  oeffnenErlaubt: false
  /** Immer true – „Ordner öffnen" ist auch und gerade hier aktiv (TK 9.14.3). */
  ordnerOeffnenErlaubt: true
}

/** Baut die Darstellung. Wirft NICHT und prüft NICHT, ob `meta.beschaedigt` gesetzt ist –
 *  das entscheidet der Aufrufer über `istBeschaedigt`. */
export function baueBeschaedigtDarstellung(meta: ProjektMeta): BeschaedigtDarstellung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #223."
  );
}

/** Genau `meta.beschaedigt === true`. Keine zweite Heuristik (s. ENTSCHIEDEN 1). */
export function istBeschaedigt(meta: ProjektMeta): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #223."
  );
}

/** Genau `meta.beschaedigt === false`. Die einzige Öffnen-Regel dieses Moduls. */
export function istOeffnenErlaubt(meta: ProjektMeta): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #223."
  );
}

/**
 * Öffnet `projects/<projektId>/` im Datei-Explorer des Betriebssystems (TK 9.5.2).
 * INSTANT-Aufruf, KEIN Auftrag der Queue. Diese Funktion baut KEINEN Pfad – sie schickt nur die
 * Projektkennung; der Main ist die Pfad-Autorität (TK 9.5.7).
 * Auch für NICHT beschädigte Projekte benutzbar (TK 9.5.2: „daneben aber überall in der
 * Projektverwaltung").
 */
export async function oeffneProjektordner(projektId: string): Promise<Ergebnis<void, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #223."
  );
}
