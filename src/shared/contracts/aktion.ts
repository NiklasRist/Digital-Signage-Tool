// [contracts] Typ Aktion definieren

import type { SchriftRolle } from './marke'

/**
 * Wie eine EINZELNE Zone gestaltet wird (05.11.2026).
 *
 * WARUM DIE FELDER OPTIONAL SIND UND NICHT `X | null`: Eine fehlende Angabe heisst
 * „die Vorlage gilt" – derselbe Rueckfall, den `akzentfarbe: null` beschreibt. Optional
 * ist hier zusaetzlich aus einem harten Grund: `project.json` liegt seit Monaten im
 * Feld, und ein Pflichtfeld haette jede alte Datei unlesbar gemacht (bzw. eine Migration
 * erzwungen, die niemand angefordert hat). Alle Verbraucher behandeln `undefined` wie
 * `null`: es gilt die Vorlage.
 *
 * Der SCHLUESSEL des Records ist die `Zone.id` der Vorlage. Welche Zonen es gibt,
 * weiss allein die Vorlage – eine Angabe fuer eine Zone, die die aktuelle Vorlage nicht
 * hat, ist folgenlos und bleibt gespeichert.
 */
export interface ZonenGestaltung {
  /** Textfarbe dieser Zone (`#RRGGBB`). null/undefined = `zone.text.farbRolle` der Marke. */
  textfarbe?: string | null
  /** Flaechenfarbe dieser Zone (`#RRGGBB`). null/undefined = `zone.deko.füllungFarbRolle`. */
  flaechefarbe?: string | null
  /** Startgroesse in Prozent der Vorlagengroesse (50–200). null/undefined = Vorlage. */
  groesseProzent?: number | null
  /** Waagerechte Ausrichtung. null/undefined = `zone.ausrichtung.horizontal`. */
  ausrichtung?: 'links' | 'mitte' | 'rechts' | null
  /** Schrift dieser Zone (eine der vier Rollen der Marke). null/undefined = Vorlage. */
  schriftRolle?: SchriftRolle | null
}

/**
 * Der Bildausschnitt einer Aktion (05.11.2026): Zoom und Verschiebung des Motivs.
 *
 * Gilt fuer JEDE Bildzone der Vorlage. `zoom` unter 100 % waere ein Rand um das Bild,
 * den keine Vorlage vorsieht – deshalb 100–300 (`GESTALTUNG_GRENZEN`). Der Versatz ist
 * in Prozent der ZONENGROESSE angegeben, nicht in Pixeln: Derselbe Wert soll in einer
 * 960 breiten Spalte und in einem 1920 breiten Vollbild gleich weit wirken.
 */
export interface BildAusschnitt {
  /** 100 = Vorlage (Bild passt genau), 300 = dreifach hineingezoomt. */
  zoom?: number | null
  /** -50…+50 % der Zonenbreite; positiv = Bild nach rechts. */
  versatzX?: number | null
  /** -50…+50 % der Zonenhöhe; positiv = Bild nach unten. */
  versatzY?: number | null
}

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
  // akzentKraeftig, akzentTief) - sie ist kein Zierwert. null = keine gewaehlte, dann gilt der
  // Markenwert; das ist ein zugesagter Zustand, kein Fehler.
  akzentfarbe: string | null
  // Gestaltung einzelner Zonen (05.11.2026, TK 9.8.8): Farbe, Groesse und Ausrichtung
  // ueberschreiben, was die VORLAGE vorgibt. Fehlt der Record, ist die Aktion eine
  // reine Vorlagen-Aktion - genau der Zustand vor dieser Fassung.
  zonenGestaltung?: Record<string, ZonenGestaltung>
  // Zoom und Position des Motivs (05.11.2026, TK 9.8.8). Fehlt der Wert, gilt die
  // Einpassung der Vorlage unveraendert.
  bildAusschnitt?: BildAusschnitt | null
}

/**
 * Alles an einer Aktion, was zum ZEICHNEN gebraucht wird - die Kennung nicht.
 *
 * `template-canvas` liest nur den Inhalt: Titel, Beschreibung, Preis, `cta`, `bildRef`,
 * `akzentfarbe` sowie seit 05.11.2026 `zonenGestaltung` und `bildAusschnitt`. Ein
 * gespeicherter `Aktion`-Satz erfuellt diesen Typ, und der ENTWURF im Editor
 * (`AktionsEntwurf`) auch - deshalb kann die Live-Vorschau denselben Zeichenweg nehmen
 * wie der Render, statt auf eine gespeicherte Aktion zu warten (Entscheidung 03.11.2026).
 */
export type AktionsInhalt = Omit<Aktion, 'id'>
