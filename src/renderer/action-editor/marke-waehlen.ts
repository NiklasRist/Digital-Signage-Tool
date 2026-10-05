// Issue #319 (M8-46) - marke-waehlen.ts: die Marken-Auswahl und der
// Zuweisungsweg einer Aktion (FA-23).
//
// Sie ist das fehlende Geschwister von vorlage-waehlen.ts (#137),
// bild-zuweisen.ts (#138) und akzentfarbe.ts (#139): Jede Zuweisung an eine
// Aktion hat ihre eigene Datei - fuer die Marke gab es bis heute keine.
//
// Die Herkunft der Auswahlliste ist DIE Entscheidung (ENTSCHIEDEN 1): die
// GEMEINSAME Marken-Sicht, und zwar als `readonly Marke[]` HEREINGEREICHT -
// diese Datei holt Nichts, filtert nichts, sortiert nichts. Ein eigener
// marken:listeMarken-Aufruf ergaebe eine Momentaufnahme, die nach der ersten
// Aenderung im Reiter Marken veraltet ist (#305 verbietet den Direktweg
// wortlich). Waehlen, nie zeichnen: Der zeichenbereite Bestand wohnt woanders
// (#312).
//
// Vorbelegung (ENTSCHIEDEN 3): Project.standardMarkeId, vom Aufrufer als
// PARAMETER. Diese Datei kennt das geladene Projekt nicht.
//
// Der Main prueft die FORM (nicht die Existenz) - dieselbe Grenze wie bei
// vorlagenId (#38/#39); die Architekturfrage bleibt offen und wird fuer
// beide Felder gleich beantwortet (ENTSCHIEDEN 5).
//
// ENTSCHIEDEN 7: istBekannteMarke gibt Auskunft und korrigiert NICHTS - ein
// stiller Rueckfall auf die Standardmarke waere eine Aenderung am Datensatz,
// die niemand veranlasst hat.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import { speichereAktion } from './aktion-bearbeiten'

/** Ein Eintrag der Marken-Auswahl. Mehr Felder gibt es nicht (ENTSCHIEDEN 8). */
export interface MarkenEintrag {
  markeId: string
  name: string
}

/** Die Auswahlliste fuer die Oberflaeche. REINE Funktion: sie holt nichts, sie filtert nicht und
 *  sie sortiert nicht - die Reihenfolge ist die der uebergebenen Liste (ENTSCHIEDEN 2). */
export function markenAuswahl(marken: readonly Marke[]): MarkenEintrag[] {
  // Bewusst JEDES Feld faellt: nur `id` und `name` werden gelesen. Die volle
  // Marke hat die Oberflaeche ohnehin in derselben Liste vorliegen.
  return marken.map((marke) => ({ markeId: marke.id, name: marke.name }))
}

/** Zeigt eine gespeicherte `markeId` noch auf eine Marke des Bestands? Reine Auskunft, KEINE
 *  Korrektur (ENTSCHIEDEN 7). Ein leerer `markeId` liefert `false`. */
export function istBekannteMarke(markeId: string, marken: readonly Marke[]): boolean {
  if (markeId.length === 0) return false
  return marken.some((marke) => marke.id === markeId)
}

/** Weist einer Aktion eine andere Marke zu. Schreibt ueber `speichereAktion` (#136);
 *  die Nutzlast enthaelt GENAU das Feld `markeId` und kein weiteres. */
export async function setzeMarke(aktionId: string, markeId: string): Promise<Ergebnis<Aktion>> {
  // Die FORM-Vorabpruefung vor dem Senden (nicht-leerer Text). Eine leere
  // Kennung senden wir nicht - der Main wuesse damit nichts anzufangen, und
  // TK 9.1.1 Punkt 6 verlangt die Form-Pruefung zuerst an der Quelle.
  // Existenz prueft DIESER Weg nicht: dafuer gibt es istBekannteMarke, und die
  // Oberflaeche entscheidet, ob sie eine unbekannte Kennung anzeigt oder eine
  // Neuwahl verlangt.
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'markeId: Die Kennung der Marke ist leer. Es wurde nichts gespeichert.',
      },
    }
  }
  return speichereAktion(aktionId, { markeId })
}
