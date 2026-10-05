// GENERIERT aus dem Signaturblock von Issue #141.
// [action-editor] Fehlendes Aktions-Bild behandeln – drei Fix-Optionen auf Aktions-Ebene
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
// GERUEST-PRUEFSUMME: 96ec435fa28b6ff3
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
