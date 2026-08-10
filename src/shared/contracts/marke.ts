// GENERIERT aus dem Signaturblock von Issue #52.
// [contracts] Typ Marke definieren
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
// GERUEST-PRUEFSUMME: 8e919beac5429d9c

export type FarbRolle =
  | 'akzent' | 'akzentKraeftig' | 'akzentTief'
  | 'flaecheDunkel' | 'flaecheSehrDunkel' | 'flaecheHell' | 'flaecheAkzentZart'
  | 'textAufDunkel' | 'textAufHell' | 'textSekundaer'
  | 'linie' | 'scrimStart' | 'scrimEnde'

export type SchriftRolle = 'headlineElegant' | 'headlinePlakativ' | 'fliesstext' | 'fliesstextFett'

export interface Schrift {
  familie: string
  gewicht: number
  datei: string                     // gebündelter Dateiname, s. 9.10.4 (Playfair Display fehlt auf Win/macOS)
}

export interface Marke {
  farben: Record<FarbRolle, string>       // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften: Record<SchriftRolle, Schrift>
  logo: { datei: string; seitenverhaeltnis: number }   // Balken ist im Asset enthalten
  sicherheit: { horizontal: 96; vertikal: 54 }          // absolute px im 1920×1080-Rahmen
  radien: { pille: 40; karte: 10; klein: 2 }
  schatten: { versatzY: 4; weichzeichnen: 8; farbe: string }
  slogan: { text: string; aktiv: boolean }
}
