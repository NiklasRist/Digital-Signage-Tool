/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #102.
// [vorlagen-store] speichereArbeitskopie implementieren
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
// GERUEST-PRUEFSUMME: 6494af67b909e315
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
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: aendereBestand<T>(
//            aenderung: (bestand: Vorlage[]) =>
//              Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, VorlagenFehlercode>>
//          // 'entprellt': der Bestand ist im Speicher uebernommen und das Promise wird erfuellt;
//          //             die Datei wird 4000 ms nach der LETZTEN entprellten Aenderung geschrieben.
//          //             Ein Fehler der SYNCHRONEN `aenderung` kommt sofort im Ergebnis zurueck.
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }
//          interface Zone { id: string; rolle: 'fest'|'frei'; bindung: Bindung | null
//                           rahmen: { x: number; y: number; breite: number; höhe: number }
//                           ausrichtung: { horizontal: 'links'|'mitte'|'rechts'
//                                          vertikal: 'oben'|'mitte'|'unten' }
//                           wennLeer: 'leer'|'ausblenden'
//                           text?: { schriftRolle: SchriftRolle; farbRolle: FarbRolle
//                                    größeMax: number; größeMin: number; maxZeilen: number }
//                           bild?: { einpassung: 'contain'|'cover' }
//                           deko?: { füllungFarbRolle?: FarbRolle; radius?: number
//                                    statischerText?: string; verlauf?: { … } } }

/** Auto-Speichern waehrend des Bearbeitens. Trifft NUR die Arbeitskopie mit dieser arbeitsId. */
export async function speichereArbeitskopie(
  arbeitsId: string,
  vorlage: Vorlage,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #102."
  );
}
