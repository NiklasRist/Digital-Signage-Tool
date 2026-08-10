// GENERIERT aus dem Signaturblock von Issue #13.
// [contracts] Typ Asset und Format-Whitelist-Konstante definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
