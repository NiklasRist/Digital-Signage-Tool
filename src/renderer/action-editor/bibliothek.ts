// [action-editor] Aktions-Bibliothek des Projekts anzeigen und kaputte Aktionen kennzeichnen

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
