// GENERIERT aus dem Signaturblock von Issue #229.
// [composer] Ein Medium löschen – blockierende Referenzen namentlich zeigen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Ein Listenelement, das das Medium BLOCKIERT – mit einer für Menschen lesbaren Adresse. */
export interface BlockierendeStelle {
  elementId: string
  /** 1-basierte Position in `Project.liste` – so, wie der Nutzer die Liste zählt. */
  position: number
  art: 'video' | 'bild'
  /** Der Anzeigename: `Asset.originalname` des referenzierten Mediums. */
  bezeichnung: string
}

/** Eine Aktion, die das Medium als Bild benutzt. Sie blockiert NICHT (TK 9.4.6), wird aber
 *  durch das Löschen kaputt und ist deshalb vorher zu nennen. */
export interface BetroffeneAktion {
  aktionId: string
  titel: string
}

/** Das Ergebnis der Vorprüfung auf dem geladenen Projekt. */
export interface LoeschLage {
  /** Nicht leer ⇒ das Löschen ist gesperrt (der Main lehnt es ohnehin ab). */
  blockierer: BlockierendeStelle[]
  /** Aktionen, deren `bildRef` auf dieses Medium zeigt. Warnung, KEINE Sperre. */
  betroffeneAktionen: BetroffeneAktion[]
  /** Der Text für die Anzeige – Bestätigung ODER Absage, je nach `blockierer`. */
  text: string
}

/**
 * Sucht auf dem GELADENEN Projekt, wer das Medium referenziert.
 * FRÜHE RÜCKMELDUNG, KEIN ERSATZ: Die maßgebliche Prüfung macht der Main unter dem D1-Lock
 * (TK 9.4.6). Diese Funktion greift NICHT auf das Dateisystem zu und ruft NICHTS auf.
 */
export function pruefeLoeschLage(projekt: Project, assetId: string): LoeschLage {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #229."
  );
}

/**
 * Übersetzt `referenzenIds` aus den Fehler-Nutzdaten von `asset_referenziert` in lesbare
 * Stellen. Unbekannte Kennungen werden übersprungen und NICHT erfunden (s. ENTSCHIEDEN 5).
 */
export function benenneReferenzen(
  projekt: Project,
  referenzenIds: readonly string[],
): BlockierendeStelle[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #229."
  );
}

/** Liest `referenzenIds` aus einem `fehler.daten`-Feld heraus. Passt die Form nicht, ist das
 *  Ergebnis ein leeres Array – NIE ein Wurf und NIE ein erfundener Eintrag. */
export function leseReferenzenIds(daten: unknown): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #229."
  );
}

/** Alles, worauf das Löschen wirkt. Wird als Parameter übergeben (Entscheidung E1). */
export interface LoeschWirkungen {
  /**
   * Gibt JEDEN offenen `<video>`-Handle auf dieses Asset frei (`src=""`, `load()`).
   * PFLICHT vor dem Einreihen – TK 9.4.6, „Vorbedingung Vorschau (Regel B)". Wer die Handles
   * hält, ist der `preview-player`; deshalb kommt die Funktion von außen. Sie wird von
   * **#246** geliefert (Handle-Register, Signatur `gibVideoHandlesFrei(assetId: string): void`),
   * und zwar aus `src/renderer/gemeinsam/video-handles.ts`. DIESE Datei importiert sie NICHT –
   * der Pfad steht hier nur, damit klar ist, welche Funktion gemeint ist.
   */
  gibVideoHandlesFrei: (assetId: string) => void
}

/**
 * Reiht den Löschauftrag ein – NACHDEM die Vorprüfung frei ist und der Nutzer bestätigt hat
 * (beides prüft die Anzeige, nicht diese Funktion).
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1)
 * und wird von #199 ausgewertet.
 */
export async function loescheMedium(
  projektId: string,
  assetId: string,
  wirkungen: LoeschWirkungen,
): Promise<Ergebnis<{ auftragId: string }, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #229."
  );
}
