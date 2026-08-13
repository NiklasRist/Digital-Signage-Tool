// GENERIERT aus dem Signaturblock von Issue #14.
// [contracts] Typ Aktion definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 6651925581150385

export interface Aktion {
  id: string
  titel: string                    // Pflicht
  beschreibung: string | null
  preis: string | null
  bildRef: string | null           // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta: string | null
  standardDauer: number | null     // nur Vorgabe, s. TK 9.8.4
  vorlagenId: string
  // FREIER Hex-Wert (FA-24). NACHGEZOGEN 12.08.2026: Hier stand "Rollen-Verweis in die
  // Markenpalette, kein Hex" - der Stand bis TK v3.3. Seit v3.4 ist die Farbwahl NICHT mehr
  // auf die Palette begrenzt, damit Partner-Hausfarben darstellbar sind; die Gegenmassnahme
  // gegen unlesbare Kombinationen ist die KONTRAST-WARNUNG (FA-24, Risiko R-08), nicht die
  // Sperre. Das TK vermerkt selbst, der alte Satz habe "bis v3.5 versehentlich weiter hier"
  // gestanden und sei "woertlich zitierbar" gewesen - genau daraus ist dieser Kommentar
  // entstanden. Das Issue #14 selbst war bereits richtig; der Generator hat die Datei vor
  // dem Nachzug erzeugt. Der TYP aendert sich dadurch nicht.
  //
  // ERSETZT beim Zeichnen die Akzent-Rollen der Vorlage (akzent, akzentKraeftig, akzentTief) -
  // sie ist kein Zierwert. null = keine gewaehlt, dann gilt der Markenwert; das ist ein
  // zugesagter Zustand, kein Fehler.
  akzentfarbe: string | null
}
