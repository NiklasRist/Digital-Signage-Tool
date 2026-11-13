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
  /** Abdunkelung dieser Zone (05.11.2026). null/undefined = Verlauf der Marke. */
  scrim?: ScrimGestaltung | null
}

/**
 * Die Abdunkelung („Scrim") einer Zone (05.11.2026, TK 9.10.9).
 *
 * WARUM ZWEI STOPPS UND NICHT EIN REGLER: Ein Verlauf hat einen Anfang und ein Ende. Ein
 * einzelner Regler muesste einen der beiden raten – genau die stille Behauptung, die
 * dieses Projekt an anderen Stellen schon teuer bezahlt hat. Hier stehen deshalb BEIDE
 * Stopps: Farbe und Deckkraft, je einzeln.
 *
 * Die Felder sind optional und bedeuten „die Marke gilt": `vonFarbe`/`bisFarbe` ersetzen
 * den Farbton (`#RRGGBB`, ohne Alpha – der Waehler kennt keinen), `vonDeckkraft`/
 * `bisDeckkraft` die Deckkraft in Prozent. Fehlt nur die Deckkraft, bleibt der Alpha-Wert
 * der Markenrolle; fehlt nur die Farbe, bleibt deren Farbton.
 */
export interface ScrimGestaltung {
  /** Farbton des ersten Stopps (`#RRGGBB`). null/undefined = `vonFarbRolle` der Marke. */
  vonFarbe?: string | null
  /** Deckkraft des ersten Stopps in Prozent (0–100). null/undefined = Alpha der Marke. */
  vonDeckkraft?: number | null
  /** Farbton des zweiten Stopps (`#RRGGBB`). null/undefined = `bisFarbRolle` der Marke. */
  bisFarbe?: string | null
  /** Deckkraft des zweiten Stopps in Prozent (0–100). null/undefined = Alpha der Marke. */
  bisDeckkraft?: number | null
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

/**
 * Die Aufbereitung des Motivs (13.11.2026, FA-28 / TK 9.21).
 *
 * WARUM DIE FELDER OPTIONAL SIND: Fehlt ein Wert oder ist er 0, gilt „unveraendert" –
 * dieselbe Regel wie bei `BildAusschnitt`. `0` heisst in allen drei Feldern dasselbe:
 * nichts tun. Die Grenzen stehen in `shared/aufbereitung.ts` (`AUFBEREITUNG_GRENZEN`),
 * NICHT im Formular: Main, Editor und Zeichnen muessen dieselben Zahlen kennen.
 *
 * NICHT DESTRUKTIV: Diese Werte stehen an der Aktion; das Asset und seine Datei bleiben
 * unveraendert (AD 4.13). Gerechnet wird einmal je (Asset, Einstellungen) beim
 * Vorbereiten des Motivs, nicht je Frame (TK 9.21.4).
 */
export interface BildAufbereitung {
  /** -100 … +100; 0 = unveraendert, +100 = weiss, −100 = schwarz. */
  helligkeit?: number | null
  /** -100 … +100; 0 = unveraendert, −100 = Flaeche, +100 = Schwarz/Weiss. */
  kontrast?: number | null
  /** 0 … 100; 0 = AUS (kein Rechenweg). */
  schaerfe?: number | null
}

/**
 * Ein Effekt mit FENSTER (09.11.2026, FA-25 / TK 9.16). Er laeuft EINMAL innerhalb des
 * Segments; danach bleibt der Endzustand stehen.
 *
 * `staerke` ist der Prozentsatz der Vorgabe aus Anforderungsdokument 4.10 (100 = Vorgabe,
 * 0 = aus). Die Grenzen in SEKUNDEN stehen hier, weil der Nutzer sie so eingibt; die
 * Umrechnung in Bilder macht allein `shared/effekte.ts` (30/s, TK 9.16.2).
 */
export interface FensterEffekt {
  /** 0–100 (% der Vorgabe; 0 = aus – dann darf KEIN Frame entstehen, TK 9.16.1). */
  staerke: number
  /** Beginn im Segment in Sekunden (0 … dauer). */
  vonSekunden: number
  /** Ende im Segment in Sekunden (> von, ≤ dauer). */
  bisSekunden: number
}

/**
 * Ein Effekt als SCHLEIFE (09.11.2026, TK 9.16): Er laeuft ueber die GANZE Segmentdauer
 * und ist nahtlos (2 s = 60 Bilder). Deshalb hat er kein Fenster – ein zweites Feld
 * waere eine zweite Angabe fuer dieselbe Sache.
 */
export interface SchleifenEffekt {
  /** 0–100 (% der Vorgabe; 0 = aus). */
  staerke: number
}

/**
 * Die Effekte EINER Aktion (09.11.2026, FA-25 / TK 9.16.1).
 *
 * WARUM DIE SCHLUESSEL FEST SIND UND NICHT `Record<string, …>`: Ein Effekt ist keine
 * Datenzeile, sondern eine benannte Rechnung im Zeichenweg. Ein freier Schluessel waere
 * ein Effekt, den niemand zeichnet – er saehe gespeichert aus und bliebe unsichtbar.
 *
 * Fehlt ein Eintrag, ist dieser Effekt AUS. `staerke: 0` ist ebenfalls AUS (TK 9.16.1);
 * ein solcher Eintrag darf keinen Frame erzeugen.
 */
export interface EffektSatz {
  kenBurns?: FensterEffekt
  textEinblendung?: FensterEffekt
  preisPop?: FensterEffekt
  glanzSweep?: FensterEffekt
  preisZaehlt?: FensterEffekt
  bildReveal?: FensterEffekt
  puls?: FensterEffekt
  zoomAtmen?: SchleifenEffekt
  drift?: SchleifenEffekt
  parallax?: SchleifenEffekt
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
  // Effekte (09.11.2026, FA-25 / TK 9.16.1). Fehlt der Satz, ist das Segment das
  // Standbild von heute – der Zustand vor dieser Fassung. Kein Pflichtfeld, damit
  // jede bestehende `project.json` ohne Migration weiterlesbar bleibt.
  effekte?: EffektSatz | null
  // Produktseite, von der ein Foto abgerufen werden kann (12.11.2026, FA-27 / TK 9.19.7).
  // Getrimmt, nur http/https; alles andere = null (normalisiereProduktUrl in
  // shared/produkt-url.ts). Optional, damit jede bestehende `project.json` lesbar bleibt.
  produktUrl?: string | null
  // Aufbereitung des Motivs (13.11.2026, FA-28 / TK 9.21): Helligkeit, Kontrast, Schaerfe.
  // Nicht destruktiv - das Asset bleibt unberuehrt, gerechnet wird beim Vorbereiten.
  // Fehlt der Wert oder ist er neutral, ist der Bestands-Schluessel die nackte Asset-ID
  // und das Segment byte-gleich zu vorher. Kein Pflichtfeld, keine Migration.
  bildAufbereitung?: BildAufbereitung | null
  // Freistellen (13.11.2026, FA-29 / TK 9.21.5): `true` heisst „transparenter Hintergrund
  // ueber das mitgelieferte Modell". `false`, `null` und „Feld fehlt" bedeuten dasselbe:
  // nicht freistellen - es gibt genau EINEN eingeschalteten Zustand, damit zwei Wahrheiten
  // fuer „aus" nicht auseinanderlaufen. Optional, damit jede bestehende `project.json`
  // ohne Migration lesbar bleibt; das Original-Asset bleibt unberuehrt (9.21.7).
  freistellen?: boolean | null
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
