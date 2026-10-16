// [marken-store] öffneMarkenDateiDialog – der Dateidialog für .woff2 und Logo-Bilder

import { dialog } from 'electron'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import { MARKEN_SCHRIFT_ENDUNG } from './dateien'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export async function öffneMarkenDateiDialog(
  art: 'logo' | 'schrift',
): Promise<Ergebnis<{ pfade: string[] }>> {
  // SCHRITT 1: genau EIN Filtereintrag je Art - die Endungen kommen ausschliesslich aus
  // FORMAT_WHITELIST.bild (#13) und MARKEN_SCHRIFT_ENDUNG (#289); in dieser Datei steht
  // kein einziges Endungs-Literal (Ein-Quellen-Invariante, TK 9.4.2).
  let filter: Array<{ name: string; extensions: string[] }>
  if (art === 'schrift') {
    filter = [{ name: 'Schriften (WOFF2)', extensions: [MARKEN_SCHRIFT_ENDUNG] }]
  } else if (art === 'logo') {
    filter = [{ name: 'Bilder', extensions: [...FORMAT_WHITELIST.bild] }]
  } else {
    // Ein Wert außerhalb der Union (nur über eine defekte Verdrahtung erreichbar):
    // kein Dialog wird geöffnet, sofortige Hülle.
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: "oeffneMarkenDateiDialog: 'art' ist weder 'logo' noch 'schrift' - kein Dialog wurde geöffnet.",
      },
    }
  }

  // SCHRITT 2: ohne Elternfenster, ohne title, ohne defaultPath - Einfachauswahl
  // ('openFile' allein; KEIN 'multiSelections', KEIN 'openDirectory',
  // KEIN 'promptToCreate').
  let ergebnis: { canceled: boolean; filePaths: string[] }
  try {
    ergebnis = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filter,
    })
  } catch (ursache) {
    // SCHRITT 7: gefangen; Meldung OHNE Stacktrace.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }

  // SCHRITT 5: Abbruch oder leere Rückgabe ist ERFOLG (kein Fehler, TK 9.4.3).
  if (ergebnis.canceled || ergebnis.filePaths.length === 0) {
    return { ok: true, wert: { pfade: [] } }
  }

  // SCHRITT 6: Pfade UNVERAENDERT durchgereicht - nicht sortiert, nicht dedupliziert,
  // nicht normalisiert, nicht auf Existenz oder Endung geprüft.
  return { ok: true, wert: { pfade: [...ergebnis.filePaths] } }
}
