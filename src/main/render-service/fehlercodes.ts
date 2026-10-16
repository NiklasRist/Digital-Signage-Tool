// [render-service] Fehlercode-Union des Moduls definieren

/**
 * Fachliche Fehlercodes des render-service – geschlossener Satz, TK 9.2.3.
 * Die drei generischen Codes (`ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`)
 * kommen über `Ergebnis<T, F>` automatisch dazu und werden hier NICHT wiederholt.
 */
export type RenderFehlercode =
  | 'medium_fehlt'
  | 'ungueltiges_element'
  | 'ffmpeg_fehler'
  | 'kein_platz'
  | 'speicher_fehler'

/**
 * Form der strukturierten Fehlerdaten (`Ergebnis.fehler.daten`) für die beiden Codes, die ein
 * einzelnes Element benennen: `medium_fehlt` und `ungueltiges_element` (TK 9.2.3).
 * Alle übrigen Codes setzen `daten` NICHT.
 */
export interface ElementFehlerdaten {
  elementId: string
}
