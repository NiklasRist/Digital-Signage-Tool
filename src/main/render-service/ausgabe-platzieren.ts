/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #180.
// [render-service] Fertige Datei verifizieren und atomar platzieren
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

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'      // #171

export interface PlatzierenErgebnis {
  ausgabePfad: string      // absoluter Pfad der fertigen <name>.mp4
  dateigroesse: number     // Bytes
}

export async function verifiziereUndPlatziere(
  partPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4.part
  zielPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4 (aus #49)
  erwarteteGesamtdauer: number,   // Sekunden, framegerundet (#174)
  profil: RenderProfile,          // #18 – die Sollwerte der Pruefung
  ffprobePfad: string,            // von renderReel (#181) hereingereicht, s. u.
): Promise<Ergebnis<PlatzierenErgebnis, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #180."
  );
}
