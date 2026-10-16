// [contracts] Typ AppKonfig definieren

/**
 * Inhalt von `config.json` (D3, app-weit).
 *
 * Die drei Felder sind aus der Feldliste übernommen, die #26, #77, #183 und #196
 * bereits als Kommentar führen – OHNE deren viertes Feld `marke` (Begründung unter
 * der Signatur).
 */
export interface AppKonfig {
  /** Zuletzt geöffnetes Projekt; `null` = keines (erster Start oder extern gelöscht). */
  aktivesProjektId: string | null
  /** Zuletzt gewähltes Export-Ziel; `null` = noch nie exportiert. */
  letztesExportZiel: string | null
  /** Freie Oberflächen-Voreinstellungen je Schlüssel (z. B. `app-shell.aktiverReiter`, #196). */
  uiVoreinstellungen: Record<string, unknown>
}
