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
