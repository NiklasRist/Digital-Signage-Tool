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

/** NEU (TK 9.11.2/9.15.3): Woher eine Datei-Referenz stammt.
 *  gebuendelt = Bundle-Asset (9.10.4); importiert = marken-assets/<markeId>/ (9.15.3). */
export type Herkunft = 'gebuendelt' | 'importiert'

export interface Schrift {
  familie: string
  gewicht: number
  datei: string                     // Dateiname; wo die Datei liegt, sagt `herkunft`
  herkunft: Herkunft                // NEU (v3.4)
}

export interface Marke {
  id: string                        // NEU – UUID (TK 9.11.4)
  name: string                      // NEU – im Editor sichtbar, trägt das Ersatz-Logo (9.10.10)
  parent: string | null             // NEU – abgeleitet von dieser Marke; null = eigenständig
  eingebaut: boolean                // NEU – true NUR bei Fitnessworld24 – nicht löschbar (9.15.1)
  farben: Record<FarbRolle, string>          // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften: Record<SchriftRolle, Schrift>
  logo: { datei: string; herkunft: Herkunft; seitenverhaeltnis: number } | null  // null -> Ersatz-Logo (9.10.10)
  sicherheit: { horizontal: number; vertikal: number }   // absolute px im 1920×1080-Rahmen
  radien: { pille: number; karte: number; klein: number }
  schatten: { versatzY: number; weichzeichnen: number; farbe: string }
  slogan: { text: string; aktiv: boolean }
  herkunftJeFeld: MarkenHerkunftJeFeld   // NEU (v3.5): Metadatum je Feld, NIE Wertquelle (TK 9.11.2)
}

/** NEU (TK 9.11.2, v3.5): Welchen Zweig die Auflösung je Feld genommen hat. Wird von `loeseMarkeAuf`
 *  gesetzt und NUR vom `marken-editor` gelesen. Trägt KEINE Werte. Bei `parent === null` durchgehend
 *  'eigen' – nie leer, nie undefined. */
export interface MarkenHerkunftJeFeld {
  farben: Record<FarbRolle, 'eigen' | 'geerbt'>
  schriften: Record<SchriftRolle, 'eigen' | 'geerbt'>
  logo: 'eigen' | 'geerbt' | 'keins'      // 'keins' = weder eigen noch geerbt gesetzt
  sicherheit: 'eigen' | 'geerbt'
  radien: 'eigen' | 'geerbt'
  schatten: 'eigen' | 'geerbt'
  slogan: 'eigen' | 'geerbt'
}
