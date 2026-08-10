/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #154.
// [composer] Zeichenvoraussetzungen vorbereiten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
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
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { stelleSchriftenBereit } from '../template-canvas/schriften'
import { bereiteLogoVor, holeLogo } from '../template-canvas/logo-laden'
import { bereiteMotiveVor, leereMotivBestand } from '../template-canvas/bild-laden'

/** Alles, was zeichnende Aufrufe des composer als Parameter brauchen. */
export interface Zeichenvoraussetzungen {
  marke: Marke
  vorlagen: readonly Vorlage[]
}

/**
 * Stellt die Zeichenvoraussetzungen für DIESES Projekt her.
 * Muss abgeschlossen sein, BEVOR ein Thumbnail (#128), eine Vorschau oder ein Render (#134)
 * entsteht. Erneut aufrufen nach jedem abgeschlossenen Import und bei jedem Projektwechsel.
 */
export async function bereiteZeichnenVor(
  projekt: Project,
): Promise<Ergebnis<Zeichenvoraussetzungen, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #154."
  );
}

/**
 * Verwirft den Motiv-Bestand. Vor jedem Projektwechsel und nach jedem abgeschlossenen Import
 * aufzurufen; danach muss bereiteZeichnenVor erneut laufen.
 */
export function verwirfMotivBestand(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #154."
  );
}
