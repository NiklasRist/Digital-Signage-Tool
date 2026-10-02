// GENERIERT aus dem Signaturblock von Issue #223.
// [projekt-verwaltung] Beschädigte Projekte darstellen und quellen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/** Was von einem beschädigten Eintrag angezeigt wird – rein abgeleitet, ohne Zustand. */
export interface BeschaedigtDarstellung {
  /** Die Behelfs-Bezeichnung: `meta.name`, der bei `beschaedigt: true` der ORDNERNAME ist. */
  bezeichnung: string
  /** Der Warntext der Zeile. Nennt, was NICHT geht, und was noch da ist. */
  warntext: string
  /** Immer false bei `beschaedigt: true` – "Öffnen" ist deaktiviert (TK 9.14.3). */
  oeffnenErlaubt: false
  /** Immer true – "Ordner öffnen" ist auch und gerade hier aktiv (TK 9.14.3). */
  ordnerOeffnenErlaubt: true
}

/** Baut die Darstellung. Wirft NICHT und prüft NICHT, ob `meta.beschaedigt` gesetzt ist –
 *  das entscheidet der Aufrufer über `istBeschaedigt`. */
export function baueBeschaedigtDarstellung(meta: ProjektMeta): BeschaedigtDarstellung {
  return {
    bezeichnung: meta.name,
    warntext:
      'Die Projektdatei ist beschädigt. Öffnen ist nicht möglich – Medien und gerenderte ' +
      'Ausgaben liegen weiter im Projektordner.',
    oeffnenErlaubt: false,
    ordnerOeffnenErlaubt: true,
  }
}

/** Genau `meta.beschaedigt === true`. Keine zweite Heuristik (s. ENTSCHIEDEN 1). */
export function istBeschaedigt(meta: ProjektMeta): boolean {
  return meta.beschaedigt === true
}

/** Genau `meta.beschaedigt === false`. Die einzige Öffnen-Regel dieses Moduls. */
export function istOeffnenErlaubt(meta: ProjektMeta): boolean {
  return meta.beschaedigt === false
}

/**
 * Öffnet `projects/<projektId>/` im Datei-Explorer des Betriebssystems (TK 9.5.2).
 * INSTANT-Aufruf, KEIN Auftrag der Queue. Diese Funktion baut KEINEN Pfad – sie schickt nur die
 * Projektkennung; der Main ist die Pfad-Autorität (TK 9.5.7).
 * Auch für NICHT beschädigte Projekte benutzbar (TK 9.5.2: "daneben aber überall in der
 * Projektverwaltung").
 */
export async function oeffneProjektordner(projektId: string): Promise<Ergebnis<void, string>> {
  if (!(typeof projektId === 'string') || projektId.trim() === '') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'oeffneProjektordner braucht eine projektId.' } }
  }
  return rufeAuf<void>(KANAELE.project.öffneProjektordner, { projektId })
}
