// [contracts] Typ Aktion definieren

export interface Aktion {
  id: string
  titel: string                    // Pflicht
  beschreibung: string | null
  preis: string | null
  bildRef: string | null           // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta: string | null
  standardDauer: number | null     // nur Vorgabe, s. TK 9.8.4
  vorlagenId: string
  markeId: string                  // NEU – GENAU EINE Marke (FA-23); Pflicht, NIE null, NIE leer;
                                   //   vorbelegt mit Project.standardMarkeId (TK 9.8.2)
  // FREIER Hex-Wert (FA-24). ERSETZT beim Zeichnen die Akzent-Rollen der Vorlage (akzent,
  // akzentKraeftig, akzentTief) - sie ist kein Zierwert. null = keine gewaehlt, dann gilt der
  // Markenwert; das ist ein zugesagter Zustand, kein Fehler.
  akzentfarbe: string | null
}
