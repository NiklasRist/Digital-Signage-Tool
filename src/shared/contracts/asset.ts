// [contracts] Typ Asset und Format-Whitelist-Konstante definieren

export const FORMAT_WHITELIST = {
  video: ['mp4'] as const,       // H.264/H.265 innerhalb MP4
  // 'jpeg' ist eine bewusste Ergänzung ÜBER den TK hinaus (TK 9.4.2/9.11.4 nennen nur
  // JPG, PNG, WebP): dieselbe Bilddatei trägt real zwei übliche Endungen, eine Datei
  // "foto.jpeg" würde sonst grundlos abgewiesen.
  bild: ['jpg', 'jpeg', 'png', 'webp'] as const,
} as const

export interface Asset {
  id: string                                   // UUID
  typ: 'video' | 'bild'
  dateiname: string                             // "<uuid>.<ext_kleingeschrieben>", OHNE Verzeichnisanteil
  originalname: string                          // nur für UI-Anzeige
  maße: { breite: number; höhe: number }        // Display-Maße, Pixel, ganzzahlig
  dauer: number | null                          // Sekunden, 3 Nachkommastellen (Video); null (Bild)
  importdatum: string                           // ISO-8601 UTC
  zustand: 'ok' | 'fehlt'
}
