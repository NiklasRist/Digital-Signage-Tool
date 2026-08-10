/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #138.
// [action-editor] Bild zuweisen – aus der Bibliothek wählen oder neu importieren
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

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Die Bilder des Projekts, die als Motiv taugen: typ === 'bild' UND zustand === 'ok'.
 *  Reihenfolge = Reihenfolge in Project.assets, ohne Sortierung. */
export function waehlbareBilder(assets: Asset[]): Asset[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #138."
  );
}

/** Setzt bildRef auf eine bereits vorhandene Asset-ID. Schreibt über #136.
 *  `assets` ist Project.assets – ohne den Bestand kann diese Funktion die Zuweisung nicht prüfen. */
export async function weiseBildZu(
  aktionId: string,
  assetId: string,
  assets: readonly Asset[],
): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #138."
  );
}

/** Entfernt das Bild: bildRef = null. Die Aktion bleibt gültig (Bild optional, Titel Pflicht). */
export async function entferneBild(aktionId: string): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #138."
  );
}

/** Öffnet den Medien-Dialog und reiht für JEDEN gewählten Pfad einen EIGENEN Import-Auftrag ein.
 *  Setzt bildRef NICHT – die neue Asset-ID entsteht erst, wenn der Auftrag durchgelaufen ist.
 *  `abbruchGrund` ist der Fehlercode des Aufrufs, an dem die Schleife stehengeblieben ist, sonst
 *  null. Ein Teilerfolg ist ein ERFOLG mit Teilmenge, kein Fehler. */
export async function starteBildImport(
  projektId: string,
): Promise<Ergebnis<{ auftragIds: string[]; abbruchGrund: string | null }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #138."
  );
}
