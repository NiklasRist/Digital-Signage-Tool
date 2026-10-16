// [action-editor] Fehlendes Aktions-Bild behandeln – drei Fix-Optionen auf Aktions-Ebene

import { speichereAktion } from './aktion-bearbeiten'

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement } from '../../shared/contracts/project'

/** Wo im Projekt wirkt sich der Zustand dieser Aktion aus? */
export interface BetroffeneStellen {
  segmentElementIds: string[]                                   // TK 9.7.5, Fall 2
  bandAbschnitte: Array<{ elementId: string; index: number }>   // TK 9.7.5, Fall 3
}

/** Die drei Wege aus TK 9.8.5. `ersetzen` deckt „neu verknüpfen/importieren" mit ab:
 *  beide Wege enden bei einer Asset-ID, sie stammt nur aus verschiedenen Quellen (#138). */
export type BildFix =
  | { art: 'ersetzen'; assetId: string }
  | { art: 'entfernen' }

/** Zählt alle Stellen, die diese Aktion verwenden – Listenelemente UND Band-Abschnitte. */
export function betroffeneStellen(aktionId: string, liste: Listenelement[]): BetroffeneStellen {
  const segmentElementIds: string[] = []
  const bandAbschnitte: Array<{ elementId: string; index: number }> = []

  for (const element of liste) {
    // Fall 2 - ein Listenelement mit art 'segment', dessen Referenz DIESE Aktion nennt.
    // Ein Treffer über ref bei art !== 'segment' wäre ein Fehler (video -> Asset).
    if (element.art === 'segment' && element.ref === aktionId) {
      segmentElementIds.push(element.id)
    }

    // Fall 3 - ein Band-Abschnitt, der die Aktion an seinem Index innerhalb
    // von abschnitte führt. Ein Element kann sie MEHRFACH führen; dann
    // entstehen mehrere Einträge.
    const einblendung = element.einblendung
    if (einblendung !== null) {
      einblendung.abschnitte.forEach((abschnitt, index) => {
        if (abschnitt.aktionRef === aktionId) {
          bandAbschnitte.push({ elementId: element.id, index })
        }
      })
    }
  }

  return { segmentElementIds, bandAbschnitte }
}

/** Anzahl der Stellen, die ein Fix an dieser Aktion auf einen Schlag behebt. */
export function anzahlStellen(stellen: BetroffeneStellen): number {
  return stellen.segmentElementIds.length + stellen.bandAbschnitte.length
}

/** Wendet den Fix an. Schreibt über #136 und meldet die behobenen Stellen mit. */
export async function behebeAktionsBild(
  aktionId: string,
  fix: BildFix,
  liste: Listenelement[],
  assets: readonly Asset[],
): Promise<Ergebnis<{ aktion: Aktion; behobeneStellen: BetroffeneStellen }>> {
  // SCHRITT 1 - die Bestandsprüfung bei 'ersetzen', VOR jedem Schreibversuch und
  // in dieser Reihenfolge. Dieselbe Prüfungsstriologie wie weiseBildZu (#138);
  // 'entfernen' prüft den Bestand NICHT (bildRef null ist ja gerade das Ziel).
  if (fix.art === 'ersetzen') {
    if (typeof fix.assetId !== 'string' || fix.assetId.length === 0) {
      return {
        ok: false,
        fehler: { code: 'ungueltige_eingabe', meldung: 'assetId: Die Kennung ist leer. Es wurde nichts geändert.', daten: undefined },
      }
    }
    const asset = assets.find((eintrag) => eintrag.id === fix.assetId)
    if (asset === undefined) {
      return {
        ok: false,
        fehler: { code: 'ungueltige_eingabe', meldung: `assetId: "${fix.assetId}" gehört nicht zum Projektbestand.`, daten: undefined },
      }
    }
    if (asset.typ !== 'bild') {
      return {
        ok: false,
        fehler: { code: 'ungueltige_eingabe', meldung: `assetId: "${asset.originalname}" ist ein Video und taugt nicht als Aktions-Bild.`, daten: undefined },
      }
    }
    if (asset.zustand !== 'ok') {
      return {
        ok: false,
        fehler: { code: 'ungueltige_eingabe', meldung: `assetId: "${asset.originalname}" gilt als fehlend.`, daten: undefined },
      }
    }
  }

  // SCHRITT 2 - die Stellen VOR dem Schreiben ermitteln: sonst messen sie den
  // NACHHER-Stand statt der betroffenen Verwendungen.
  const stellen = betroffeneStellen(aktionId, liste)

  // SCHRITT 3 - der Schreibweg über #136, identisch bei beiden Fixen.
  const antwort =
    fix.art === 'ersetzen'
      ? await speichereAktion(aktionId, { bildRef: fix.assetId })
      : await speichereAktion(aktionId, { bildRef: null })

  // SCHRITT 4 - ok:false -> UNVERAENDERT durchreichen; nichts wurde behoben,
  // also werden auch keine Stellen gemeldet.
  if (!antwort.ok) {
    return antwort
  }

  // SCHRITT 5 - die aktualisierte AKTION und die gemeldeten Stellen.
  return { ok: true, wert: { aktion: antwort.wert, behobeneStellen: stellen } }
}
