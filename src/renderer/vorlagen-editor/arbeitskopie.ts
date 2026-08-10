/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #143.
// [vorlagen-editor] Auf einer Arbeitskopie arbeiten und den Parent durchgehend anzeigen
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * Der EINE Text, mit dem der Editor begründet, warum „überarbeiten" gesperrt ist.
 * Exportiert, weil #149 denselben Text als Ersatz braucht, wenn `ueberarbeitenGrund`
 * ausnahmsweise `null` ist – zwei Formulierungen für dieselbe Sperre wären zwei Wahrheiten.
 */
export const GRUND_PARENT_EINGEBAUT =
  'Diese Vorlage ist mitgeliefert und bleibt unverändert. Speichern ist nur als neue eigenständige Vorlage möglich.'

/** Der Kopf des Editors: die Arbeitskopie und alles, was über ihren Parent angezeigt wird. */
export interface EditorSitzung {
  arbeitsId: string             // = arbeitskopie.id; Adresse für alle Store-Aufrufe
  arbeitskopie: Vorlage         // parent !== null; DAS ist der bearbeitete Datensatz
  parentId: string              // = arbeitskopie.parent (nie null in einer Sitzung)
  parentName: string            // Anzeigename des Parents – für „Arbeitskopie von <Name>"
  parentEingebaut: boolean      // aus dem Parent-Datensatz, NICHT aus der Arbeitskopie
  ueberarbeitenErlaubt: boolean // === !parentEingebaut
  ueberarbeitenGrund: string | null  // GRUND_PARENT_EINGEBAUT, wenn nicht erlaubt; sonst null
  festeZonenSoll: readonly Zone[]    // die festen Zonen, wie sie BEIM ÖFFNEN vorlagen
}

/**
 * Öffnet `vorlagenId` zur Bearbeitung und baut daraus die Sitzung.
 * `vorlagenId` ist IMMER die ID einer nutzbaren Vorlage (parent === null) – nie die einer
 * Arbeitskopie. Existiert bereits eine Arbeitskopie zu dieser Vorlage, setzt der Store sie fort.
 */
export async function starteBearbeitung(
  vorlagenId: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #143."
  );
}

/**
 * Sichert den aktuellen Bearbeitungsstand in die Arbeitskopie (Auto-Speichern).
 * Liefert bei Erfolg die Sitzung mit dem vom Store zurückgegebenen – also geprüften und
 * getrimmten – Stand in `arbeitskopie`.
 */
export async function sichereStand(
  sitzung: EditorSitzung,
  stand: Vorlage,
): Promise<Ergebnis<EditorSitzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #143."
  );
}
