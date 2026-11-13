// [contracts] Typ AppKonfig definieren

import type { ProduktQuellen } from './produktsuche'

/**
 * Inhalt von `config.json` (D3, app-weit).
 *
 * Die drei Felder sind aus der Feldliste übernommen, die #26, #77, #183 und #196
 * bereits als Kommentar führen – OHNE deren viertes Feld `marke` (Begründung unter
 * der Signatur).
 *
 * `produktQuellen` kam am 13.11.2026 mit #472 (FA-30, TK 9.20.3) hinzu. Es ist
 * OPTIONAL, weil es keine Config-Migration gibt: Fehlt das Feld, gilt
 * `{ shops: [], webSuche: null }` (normalisiert beim Lesen).
 */
export interface AppKonfig {
  /** Zuletzt geöffnetes Projekt; `null` = keines (erster Start oder extern gelöscht). */
  aktivesProjektId: string | null
  /** Zuletzt gewähltes Export-Ziel; `null` = noch nie exportiert. */
  letztesExportZiel: string | null
  /** Freie Oberflächen-Voreinstellungen je Schlüssel (z. B. `app-shell.aktiverReiter`, #196). */
  uiVoreinstellungen: Record<string, unknown>
  /** Shops und Notweg der Produktseiten-Suche (TK 9.20.3); fehlt = keine Quelle. */
  produktQuellen?: ProduktQuellen
}
