// [contracts] Typ Marke definieren

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

// ---------------------------------------------------------------------------
// Referenz-Nutzungstypen zur Loesch-Sperre (#275, TK 9.15.1 / 9.15.2).
// Die Form folgt Vorlagennutzung/VorlagenReferenz (TK 9.12.1); abweichend
// nur dort, wo die Referenzart abweicht: Referenzart 2 ohne Projekt-Bezug,
// Referenzart 3 ohne Aktions-Bezug.
// ---------------------------------------------------------------------------

/** Ein Fundort in einem Projekt (Referenzart 1: Aktionen tragen die Marke). */
export interface MarkenReferenz {
  projektId: string
  projektName: string
  aktionId: string
}

/** Ein Fundort im Marken-Bestand selbst (Referenzart 2: abgeleitete Marke). KEIN Projekt-Bezug –
 *  Marken sind app-weit; eine abgeleitete Marke gehoert keinem Projekt. */
export interface AbgeleiteteMarkenReferenz {
  markeId: string
  markeName: string
}

/** Ein Fundort im Projekt-Kopf (Referenzart 3: das Projekt fuehrt die Marke als STANDARDMARKE).
 *  KEIN Aktions-Bezug – hier faerbt die Marke den Rahmen (Band-Hintergrund, Split-Restflaechen,
 *  TK 9.15.4), nicht ein einzelnes Segment. */
export interface StandardmarkenReferenz {
  projektId: string
  projektName: string
}

/** Das vollstaendige Pruefergebnis: alle drei Trefferlisten, getrennt nach Referenzart. */
export interface Markennutzung {
  aktionen: MarkenReferenz[]
  abgeleiteteMarken: AbgeleiteteMarkenReferenz[]
  standardInProjekten: StandardmarkenReferenz[]
}
