// Generiert aus dem Signaturblock von Issue #300 und dort GEFUELLT: 07.10.2026, Session v.
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
// GERUEST-PRUEFSUMME: 3061ba4fb7fad427
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
import type { Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { oeffneMarke, type MarkenUebersicht } from './marken-uebersicht'

/**
 * HINWEISTEXT, warum nur eigenständige Marken als Basis erscheinen. Sachlage aus TK 9.11.2
 * (Ein-Stufen-Grenze); der Wortlaut ist eine Festlegung DIESES Issues, kein Zitat.
 * Fest, exportiert, damit die zeichnende Komponente ihn UNVERÄNDERT anzeigt.
 */
export const HINWEIS_NUR_EIGENSTAENDIGE_BASIS =
  'Nur eigenständige Marken können als Basis dienen – eine bereits abgeleitete Marke darf nicht ' +
  'noch einmal Grundlage einer weiteren Ableitung sein (Ketten sind auf eine Stufe begrenzt).'

/**
 * Filtert eine bereits geladene Übersicht (#295) auf die als Basis wählbaren Marken:
 * ausschließlich `parent === null` – eingebaute UND eigene eigenständige Marken.
 */
export function ableitbareBasen(uebersicht: MarkenUebersicht): readonly Marke[] {
  // Reiner Filter (ENTSCHIEDEN 1, 2): kein IPC, keine zweite Quelle - die Liste
  // kommt von #295. Der Filter ist parent === null, NICHT !eingebaut: die eingebaute
  // Marke DARF Basis sein (FA-23, Saison-Look).
  return uebersicht.marken.filter((marke) => marke.parent === null)
}

/**
 * Legt eine neue, von `parentId` abgeleitete Marke an und öffnet sie sofort zur Bearbeitung
 * (via `oeffneMarke`, #295) – dieselbe „anlegen und öffnen in einem Zug"-Reihenfolge wie beim
 * Anlegen einer Vorlage.
 */
export async function leiteMarkeAb(
  name: string,
  parentId: string,
): Promise<Ergebnis<Marke, string>> {
  // FORM vor IPC (wie #296/#298): beide Parameter gefuellter Text. Eine zweite
  // Ein-Stufen-Pruefung gibt es hier NICHT - erstelleMarke (#284) ist die
  // durchsetzende Instanz (ENTSCHIEDEN 4).
  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'leiteMarkeAb braucht einen nicht leeren name.',
      },
    }
  }
  if (typeof parentId !== 'string' || parentId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'leiteMarkeAb braucht eine nicht leere parentId.',
      },
    }
  }
  const angelegt = await rufeAuf<Marke, string>(KANAELE.marken.erstelleMarke, {
    name,
    parentId,
  })
  if (!angelegt.ok) return angelegt
  // ANLEGEN UND OEFFNEN IN EINEM ZUG (ENTSCHIEDEN 3): oeffneMarke (#295) liefert die
  // GARANTIERT aufgeloeste Fassung. Scheitert das Oeffnen nach erfolgreichem Anlegen,
  // bleibt die neue Marke BESTEHEN - kein Rueckrufen (kein loescheMarke),
  // der Code von oeffneMarke reist unverändert.
  return oeffneMarke(angelegt.wert.id)
}
