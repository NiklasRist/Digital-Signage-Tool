// #423 (Nachtrag 15.10.2026, User-Anforderung "Video zuerst, Pflicht"):
// Der Video-Import beim Anlegen laeuft in ZWEI Schritten, weil der Dialog KEIN Projekt
// braucht (`media:öffneMedienDialog`), das Einreihen aber schon (`queue:reiheEin`):
//   1. `waehleVideoPfad()` - nur den Dialog oeffnen, einen Pfad holen.
//   2. nach dem Anlegen `reiheVideoImportEin(projektId, pfad)` - den Auftrag einreihen.
// Es ist DERSELBE Auftragsweg wie der Composer-Knopf (#204/#228) - kein zweiter Import.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * Oeffnet NUR den Video-Dialog (genau EIN Video, #418). Leeres `pfade` = abgebrochen.
 * Der Dialog braucht kein offenes Projekt - deshalb steht dieser Schritt VOR dem Anlegen.
 */
export async function waehleVideoPfad(): Promise<Ergebnis<{ pfade: string[] }, string>> {
  try {
    const dialog = await rufeAuf<{ pfade: string[] }>(KANAELE.media.öffneMedienDialog, {
      nurTyp: 'video',
      einzel: true,
    })
    if (!dialog.ok) return dialog
    return { ok: true, wert: { pfade: dialog.wert.pfade } }
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Medien-Dialog konnte nicht geoeffnet werden.',
      },
    }
  }
}

/**
 * Reiht fuer EINEN gewaehlten Pfad einen Import-Auftrag ein (kein Dialog). Der Weg ist
 * derselbe wie in `starteMedienImport` (#204): `queue:reiheEin` mit `art: 'import'`.
 */
export async function reiheVideoImportEin(
  projektId: string,
  quellPfad: string,
): Promise<Ergebnis<{ auftragId: string }, string>> {
  if (typeof projektId !== 'string' || projektId.length === 0) {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'projektId fehlt - ein Import braucht ein Ziel.' },
    }
  }
  try {
    return await rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, {
      art: 'import',
      payload: { projektId, quellPfad },
    })
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Import-Auftrag konnte nicht eingereiht werden.',
      },
    }
  }
}
