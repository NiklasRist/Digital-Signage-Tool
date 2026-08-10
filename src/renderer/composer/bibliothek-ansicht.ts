// GENERIERT aus dem Signaturblock von Issue #227.
// [composer] Die Medien-Bibliothek anzeigen und Elemente in die Liste platzieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Asset } from '../../shared/contracts/asset'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Project } from '../../shared/contracts/project'
import { istAktionKaputt } from '../action-editor/bibliothek'

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
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #227."
  );
}

/** Die Aktionen in der Reihenfolge von `Project.aktionen`. Es wird NICHT sortiert und NICHT
 *  gefiltert – auch eine kaputte Aktion bleibt drin (s. ENTSCHIEDEN 2). */
export function baueAktionsEintraege(projekt: Project): AktionsEintrag[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #227."
  );
}

/** Baut die Lese-URL für ein Medium: `media://<projektId>/<dateiname>` (TK 9.5.7).
 *  Reine Zeichenkettenbildung; KEIN Dateisystemzugriff, KEIN absoluter Pfad. */
export function medienUrl(projektId: string, dateiname: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #227."
  );
}

/** Zählt die Einträge mit `zustand: 'fehlt'` – für den Hinweis über der Bibliothek. */
export function zaehleFehlende(eintraege: readonly MedienEintrag[]): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #227."
  );
}
