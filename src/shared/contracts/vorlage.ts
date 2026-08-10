// GENERIERT aus dem Signaturblock von Issue #95.
// [contracts] Typen Vorlage und Zone definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { FarbRolle, SchriftRolle } from './marke'
// #52 – src/shared/contracts/marke.ts, bereits angelegt:
//   export type FarbRolle =
//     | 'akzent' | 'akzentKraeftig' | 'akzentTief'
//     | 'flaecheDunkel' | 'flaecheSehrDunkel' | 'flaecheHell' | 'flaecheAkzentZart'
//     | 'textAufDunkel' | 'textAufHell' | 'textSekundaer'
//     | 'linie' | 'scrimStart' | 'scrimEnde'
//   export type SchriftRolle = 'headlineElegant' | 'headlinePlakativ' | 'fliesstext' | 'fliesstextFett'

/** Flaeche UND Kompositionsart einer Vorlage (TK 9.11.1 Punkt 0). Nach dem Anlegen unveraenderlich. */
export type VorlagenArt = 'vollflaeche' | 'split' | 'einblendung'

/** Deklarative Verknuepfung Zone <-> Inhaltsfeld. null = dekorative/statische Zone. */
export type Bindung =
  | 'titel' | 'beschreibung' | 'preis' | 'cta' | 'bild' | 'logo' | 'slogan'

/** fest = Markenrahmen (FA-11), im Editor unveraenderlich. frei = gestaltbar (FA-12). */
export type ZonenRolle = 'fest' | 'frei'

/** Verhalten bei leerem gebundenem Feld. Default beim Anlegen einer Zone: 'leer'. */
export type WennLeer = 'leer' | 'ausblenden'

export type Einpassung = 'contain' | 'cover'

export type VerlaufRichtung = 'oben' | 'unten' | 'links' | 'rechts'

/** ABSOLUTE Pixel in der Flaeche der jeweiligen Vorlagenart – niemals Prozente. */
export interface Rahmen {
  x: number
  y: number
  breite: number
  höhe: number
}

export interface Ausrichtung {
  horizontal: 'links' | 'mitte' | 'rechts'
  vertikal: 'oben' | 'mitte' | 'unten'
}

/** Text-Parameter einer Zone – speisen die Ueberlauf-Kaskade (TK 9.10.6). */
export interface ZonenText {
  schriftRolle: SchriftRolle      // Rollen-Verweis in die Marke – NIE ein Font-Name
  farbRolle: FarbRolle            // Rollen-Verweis in die Marke – NIE ein Hex-Wert
  größeMax: number                // px, Startgroesse (Stufe 2 der Kaskade beginnt hier)
  größeMin: number                // px, Untergrenze des Verkleinerns
  maxZeilen: number               // Stufe 1 der Kaskade (Umbruch)
}

export interface ZonenBild {
  einpassung: Einpassung
}

export interface ZonenDeko {
  füllungFarbRolle?: FarbRolle
  radius?: number                 // Eckenradius in px
  statischerText?: string         // fester Text ohne Bindung; benoetigt zusaetzlich `text`
  verlauf?: {
    vonFarbRolle: FarbRolle
    bisFarbRolle: FarbRolle
    richtung: VerlaufRichtung
  }
}

export interface Zone {
  id: string                      // "ueberschrift" | "motiv" | "preis" | "logo" …
  rolle: ZonenRolle
  bindung: Bindung | null
  rahmen: Rahmen
  ausrichtung: Ausrichtung
  wennLeer: WennLeer
  text?: ZonenText
  bild?: ZonenBild
  deko?: ZonenDeko
}

export interface Vorlage {
  id: string                      // "vollbild" | "split" | "band-standard" | <uuid> bei eigenen
  name: string                    // Anzeigename
  art: VorlagenArt
  höhe: number | null             // nur bei "split"/"einblendung": Bandhoehe in px; sonst null
  parent: string | null           // != null -> ARBEITSKOPIE; == null -> nutzbare Vorlage
  eingebaut: boolean              // true = mitgeliefert; false = eigene (FA-13)
  zonen: Zone[]                   // Zeichenreihenfolge = Array-Reihenfolge (spaeter = darueber)
}

/** Ein Fundort einer Vorlagen-Referenz (ein Treffer der Referenzpruefung, #106). */
export interface VorlagenReferenz {
  projektId: string               // Project.id
  projektName: string             // Project.name – fuer die Meldung "in 2 Projekten"
  id: string                      // Aktions-ID bzw. Listenelement-ID des Treffers
}

/** Das vollstaendige Pruefergebnis: beide Trefferlisten, je mit Projekt. */
export interface Vorlagennutzung {
  aktionen: VorlagenReferenz[]         // Treffer ueber aktion.vorlagenId
  listenelemente: VorlagenReferenz[]   // Treffer ueber listenelement.einblendung.bandVorlageId
}
