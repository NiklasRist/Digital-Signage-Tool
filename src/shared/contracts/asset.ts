// [contracts] Typ Asset und Format-Whitelist-Konstante definieren

export const FORMAT_WHITELIST = {
  video: ['mp4'] as const,       // H.264/H.265 innerhalb MP4
  // 'jpeg' ist eine bewusste Ergänzung ÜBER den TK hinaus (TK 9.4.2/9.11.4 nennen nur
  // JPG, PNG, WebP): dieselbe Bilddatei trägt real zwei übliche Endungen, eine Datei
  // "foto.jpeg" würde sonst grundlos abgewiesen.
  bild: ['jpg', 'jpeg', 'png', 'webp'] as const,
} as const

/**
 * Woher ein Asset stammt (12.11.2026, FA-27 / TK 9.19.6).
 *
 * WARUM PFLICHT UND WARUM ZWEI VARIANTEN: „keine Quelle" (von der Platte importiert) und
 * „Quelle unbekannt" sind zwei verschiedene Aussagen. Ein leeres Feld würde beide einebnen –
 * und bei einer Rückfrage zur Nutzung wäre genau dieser Unterschied die Antwort.
 * Bestand ohne Feld wird beim Laden ergänzt (Migration 1 -> 2); neu gebaute Assets setzen
 * den Wert immer selbst.
 */
export type AssetHerkunft =
  | { art: 'manuell' }
  | { art: 'abruf'; url: string; abgerufenAm: string }   // abgerufenAm: ISO-8601 UTC

export interface Asset {
  id: string                                   // UUID
  typ: 'video' | 'bild'
  dateiname: string                             // "<uuid>.<ext_kleingeschrieben>", OHNE Verzeichnisanteil
  originalname: string                          // nur für UI-Anzeige
  maße: { breite: number; höhe: number }        // Display-Maße, Pixel, ganzzahlig
  dauer: number | null                          // Sekunden, 3 Nachkommastellen (Video); null (Bild)
  importdatum: string                           // ISO-8601 UTC
  zustand: 'ok' | 'fehlt'
  herkunft: AssetHerkunft                       // PFLICHT (TK 9.19.6, FA-27)
}
