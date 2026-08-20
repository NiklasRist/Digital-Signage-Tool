// GENERIERT aus dem Signaturblock von Issue #227.
// [composer] Die Medien-Bibliothek anzeigen und Elemente in die Liste platzieren
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
// GERUEST-PRUEFSUMME: 53d282eebf956436
//
// ABWEICHUNG zur Signatur, durch den Nachtrag vom 14.08.2026 erzwungen:
// Die Signatur zeichnet `export function medienUrl(...)` - der Nachtrag verlangt,
// die Adresse NICHT nachzubauen, sondern aus `src/shared/medien-url.ts` (#258) zu
// importieren (genau EINE Adressbildung im ganzen Projekt, dort mit
// encodeURIComponent). Aufgeloest als Re-Export: Die Export-Schnittstelle dieser
// Datei bleibt unveraendert (Name, Parameter, Rueckgabetyp identisch), der Rumpf
// gehoert #258.

import type { Asset } from '../../shared/contracts/asset'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Project } from '../../shared/contracts/project'
import { istAktionKaputt } from '../action-editor/bibliothek'
// #258 - die EINZIGE Adressbildung; hier nur importiert und weiter-gereicht, nicht nachgebaut.
import { medienUrl } from '../../shared/medien-url'
export { medienUrl }

/** Ein Medium der Bibliothek, anzeigefertig. */
export interface MedienEintrag {
  asset: Asset
  /** Anzeigename = `asset.originalname` (NIE `dateiname`, das ist die interne UUID-Datei). */
  bezeichnung: string
  /** 'Video' oder 'Bild' – abgeleitet aus `asset.typ`. */
  typLabel: 'Video' | 'Bild'
  /** Direkt `asset.zustand` (#13). KEINE zweite Regel (s. ENTSCHIEDEN 1). */
  zustand: 'ok' | 'fehlt'
  /** `media://<projektId>/<dateiname>` – NUR bei `typ: 'bild'` UND `zustand: 'ok'`, sonst null. */
  vorschauUrl: string | null
}

/** Eine Aktion der Bibliothek, anzeigefertig. */
export interface AktionsEintrag {
  aktion: Aktion
  /** Anzeigename = `aktion.titel` (Pflichtfeld, #14). */
  bezeichnung: string
  /** Übernommen von `istAktionKaputt` (#135) – KEINE eigene Regel (s. ENTSCHIEDEN 1). */
  kaputt: boolean
}

/** Die Medien in der Reihenfolge von `Project.assets`. Es wird NICHT sortiert und NICHT
 *  gefiltert – auch ein `fehlt`-Asset bleibt drin (s. ENTSCHIEDEN 2). */
export function baueMedienEintraege(projekt: Project): MedienEintrag[] {
  return projekt.assets.map((asset) => ({
    asset,
    bezeichnung: asset.originalname,
    typLabel: asset.typ === 'video' ? 'Video' : 'Bild',
    zustand: asset.zustand,
    // ENTSCHIEDEN 5: Keine media://-URL fuer ein fehlendes Medium - die Datei
    // existiert nicht; die Anfrage liefe ins Leere. NUR Bilder zeigen ein Motiv
    // (ENTSCHIEDEN 3: Videos bekommen hier kein Vorschaubild, das ist #128).
    vorschauUrl:
      asset.typ === 'bild' && asset.zustand === 'ok'
        ? medienUrl(projekt.id, asset.dateiname)
        : null,
  }))
}

/** Die Aktionen in der Reihenfolge von `Project.aktionen`. Es wird NICHT sortiert und NICHT
 *  gefiltert – auch eine kaputte Aktion bleibt drin (s. ENTSCHIEDEN 2). */
export function baueAktionsEintraege(projekt: Project): AktionsEintrag[] {
  return projekt.aktionen.map((aktion) => ({
    aktion,
    bezeichnung: aktion.titel,
    // ENTSCHIEDEN 1: Der Zustand wird uebernommen, nie neu beurteilt - die Regel
    // lebt in #135 und wird hier nur aufgerufen, nie abgeschrieben.
    kaputt: istAktionKaputt(aktion, projekt.assets),
  }))
}

/** Zählt die Einträge mit `zustand: 'fehlt'` – für den Hinweis über der Bibliothek. */
export function zaehleFehlende(eintraege: readonly MedienEintrag[]): number {
  return eintraege.filter((eintrag) => eintrag.zustand === 'fehlt').length
}
