// GENERIERT aus dem Signaturblock von Issue #135.
// [action-editor] Aktions-Bibliothek des Projekts anzeigen und kaputte Aktionen kennzeichnen
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
// GERUEST-PRUEFSUMME: 02c1e9fc592f5274
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

export interface BibliothekEintrag {
  aktion: Aktion
  kaputt: boolean            // true = bildRef gesetzt, aber kein nutzbares Asset dahinter
  bildAsset: Asset | null    // das aufgelöste Bild-Asset; null bei bildRef === null ODER bei kaputt
}

/** Löst `bildRef` gegen die Medien-Bibliothek des Projekts auf.
 *  null bei `bildRef === null`, bei unbekannter ID und bei `zustand === 'fehlt'`. */
export function findeBildAsset(bildRef: string | null, assets: Asset[]): Asset | null {
  if (bildRef === null) return null

  const bildAsset = assets.find((asset) => asset.id === bildRef)
  if (bildAsset === undefined) return null
  if (bildAsset.zustand === 'fehlt') return null

  // Der Fall `typ === 'video'` mit `zustand === 'ok'` zaehlt hier wie ein
  // heiles Bild-Asset (STOPP-Block des Issues: bis zur Klaerung NICHT als
  // kaputt einstufen). Das eingeschraenkte `<img>`-Laden von `template-canvas`
  // bleibt eine offene Vertragsfrage, kein Fehler dieser Datei.
  return bildAsset
}

/** true, wenn `bildRef` gesetzt ist, aber `findeBildAsset` nichts Nutzbares liefert. */
export function istAktionKaputt(aktion: Aktion, assets: Asset[]): boolean {
  if (aktion.bildRef === null) return false
  return findeBildAsset(aktion.bildRef, assets) === null
}

/** Die anzeigbare Bibliothek – in der Reihenfolge von `Project.aktionen`, ohne Sortierung. */
export function baueBibliothek(aktionen: Aktion[], assets: Asset[]): BibliothekEintrag[] {
  return aktionen.map((aktion) => {
    const kaputt = istAktionKaputt(aktion, assets)
    return {
      aktion,
      kaputt,
      // `bildAsset` ist bei `kaputt === true` bewusst `null` (Kommentar im
      // Signaturblock): die Anzeige braucht vom kaputten Fall nur die Tatsache,
      // nicht den Dateinamen eines fehlenden oder verwaisten Assets. Bei
      // `bildRef === null` liefert `findeBildAsset` ebenfalls `null`.
      bildAsset: kaputt ? null : findeBildAsset(aktion.bildRef, assets),
    }
  })
}

/** Anzahl der Einträge mit `kaputt === true` – für den Zähler in der Oberfläche. */
export function zaehleKaputte(eintraege: BibliothekEintrag[]): number {
  return eintraege.reduce((anzahl, eintrag) => (eintrag.kaputt ? anzahl + 1 : anzahl), 0)
}
