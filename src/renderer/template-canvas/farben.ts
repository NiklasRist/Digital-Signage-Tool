// [template-canvas] Farb- und Schriftrollen der Marke auflösen

import type { Marke, FarbRolle, SchriftRolle, Schrift } from '../../shared/contracts/marke'
import type { AktionsInhalt } from '../../shared/contracts/aktion'
import type { Zone } from '../../shared/contracts/vorlage'
import {
  GESTALTUNG_GRENZEN,
  begrenzeZahl,
  istHexFarbe,
  istScrimRolle,
} from '../../shared/gestaltung'

// DIE EINE AUFLOESUNGSSTELLE FUER FARB- UND SCHRIFTROLLEN.
//
// "Es gibt genau eine Aufloesungsstelle. Keine Zonen-Sorte (Text, Bild, Deko, Verlauf)
// darf `marke.farben[...]` direkt lesen - sonst wirkt die Akzentfarbe in der Pille, aber
// nicht im Verlauf dahinter, und niemand faende den Grund." (TK 9.10.9) Wer eine Farbe
// braucht, ruft `loeseFarbe`; wer sie FUER EINE ZONE braucht, ruft `loeseFarbeInZone`
// (seit 05.11.2026 - sie wertet die Gestaltung der Zone aus und reicht sonst an
// `loeseFarbe` weiter). Wer eine Schrift braucht, ruft `loeseSchrift`.
//
// KEIN CANVAS, KEIN DOM, KEIN NODE. Diese Datei rechnet ausschliesslich auf Zeichenketten
// und ist deshalb ohne Browser pruefbar. Sie setzt selbst nie eine Fuell- oder Strichfarbe;
// das tun die Zonen-Funktionen (#114/#115/#116) mit dem Wert, den sie hier bekommen.
//
// KEIN ZWISCHENSPEICHER. Die Umrechnung sind ein paar Zeichenketten-Operationen; ein Cache
// braechte nichts und lieferte nach einem Marken-Wechsel alte Werte (Festlegung 6).

/**
 * Die drei Rollen, die eine gesetzte `aktion.akzentfarbe` ERSETZT (TK 9.10.9).
 *
 * Die Liste steht genau EINMAL im Projekt. Sie wird weder erweitert noch gekuerzt, und sie
 * wird NICHT ueber einen Praefix-Vergleich abgeleitet: `rolle.startsWith('akzent')` traefe
 * `flaecheAkzentZart` heute zwar nicht, aber jede spaetere Rolle mit diesem Anfang - und
 * dann wechselte ein Hintergrund lautlos die Farbe. `flaecheAkzentZart` gehoert trotz des
 * Namens ausdruecklich NICHT dazu; es ist eine Flaechen-Rolle (TK 9.10.9).
 *
 * Die Typangabe `readonly FarbRolle[]` ist die Absicherung gegen den Tippfehler: Ein Name,
 * den es als Rolle nicht gibt, uebersetzt hier nicht.
 */
const AKZENT_ROLLEN: readonly FarbRolle[] = ['akzent', 'akzentKraeftig', 'akzentTief']

/**
 * Die beiden zulaessigen Hex-Formen: `#RRGGBB` und `#RRGGBBAA` (TK 9.11.2, "Hex, 6- oder
 * 8-stellig (8 = mit Alpha)"). Alles andere - `#FFF`, `red`, `rgb(...)`, leer - ist
 * unzulaessig und wird beanstandet, nie stillschweigend ausgebessert.
 */
const HEX_FORM = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** Auf wie viele Nachkommastellen die Deckkraft gerundet wird (Festlegung 2). */
const ALPHA_NACHKOMMASTELLEN = 3

/**
 * Ist `schluessel` tatsaechlich im Bestand belegt?
 *
 * Der Typ `Record<FarbRolle, string>` sagt "alle dreizehn sind da", aber zur Laufzeit
 * kommen Vorlagen aus `vorlagen.json` und Marken aus dem `marken-store`; TypeScript prueft
 * geladene JSON-Daten NICHT. Eine von Hand bearbeitete Datei kann also eine Rolle nennen,
 * die es nicht gibt. Ohne diese Pruefung stuende `undefined` als Farbe im Segment - und das
 * faellt weder im Typecheck noch im Test auf, sondern erst im fertigen Video.
 *
 * `hasOwnProperty.call` und nicht `in`: `in` findet auch Geerbtes, `'constructor'` waere
 * damit eine gueltige Rolle.
 */
function belegt<S extends string>(bestand: Record<S, unknown>, schluessel: string): schluessel is S {
  return Object.prototype.hasOwnProperty.call(bestand, schluessel)
}

/**
 * Pflichteingang-Wache. `marke` und `aktion` sind seit TK 9.10.9 beide Pflicht; fehlt einer,
 * ist das ein Programmierfehler und keine Datenlage.
 *
 * Der Parameter ist `unknown`, damit der Vergleich hier ueberhaupt geschrieben werden darf -
 * an der Aufrufstelle sind beide Werte nicht-nullbar typisiert, und genau deshalb wuerde der
 * Uebersetzer eine Abfrage dort als sinnlos abweisen.
 */
function pruefePflichteingang(wert: unknown, name: string): void {
  if (wert === null || wert === undefined) {
    throw new Error(`loeseFarbe/loeseSchrift: Pflichteingang "${name}" fehlt (${String(wert)}).`)
  }
}

/**
 * Ein Hex-Wert wird zu einem Wert, den ein Canvas-Kontext unmittelbar als Fuell- oder
 * Strichfarbe bzw. als Verlaufs-Stopp annimmt.
 *
 * WARUM DAS UEBERHAUPT UMGERECHNET WIRD: Achtstelliges Hex beherrschen nicht alle Umgebungen
 * zuverlaessig. Wird ein solcher Wert unbesehen gesetzt und abgelehnt, behaelt der Canvas
 * STILLSCHWEIGEND die zuvor gesetzte Farbe - das Scrim ueber dem Foto ("Vollbild") waere dann
 * nicht halbtransparent schwarz, sondern irgendetwas.
 *
 * ALPHA STEHT HINTEN (`#RRGGBBAA`, Festlegung 1). Beleg aus den Markenwerten selbst:
 * `scrimStart = #00000000` und `scrimEnde = #000000B3` bilden den Verlauf "durchsichtig ->
 * dunkel". Laese man `AARRGGBB`, haette `#000000B3` die Alpha-Stelle `00`, waere also voellig
 * durchsichtig - der Verlauf waere wirkungslos und der Text ueber Fotos unlesbar.
 *
 * KEINE SPRACHABHAENGIGE ZAHLENFORMATIERUNG (Festlegung 3): kein `toLocaleString`, kein
 * `Intl.NumberFormat`. Auf einem deutschen System entstuende `0,702` - ein ungueltiger
 * CSS-Wert, den der Canvas stillschweigend ignoriert, sodass die vorherige Farbe stehen
 * bleibt. Ein Template-Literal formatiert immer mit Punkt, unabhaengig vom Gebietsschema.
 *
 * @param hex   der Wert, wie er in der Marke bzw. in der Aktion steht
 * @param woher Herkunft fuer die Fehlermeldung - Rolle bzw. Rolle UND Wert, damit die
 *              Ursache ohne Nachschlagen erkennbar ist (Festlegung 5)
 */
function alsCanvasFarbe(hex: string, woher: string): string {
  if (!HEX_FORM.test(hex)) {
    throw new Error(
      `Unzulaessiger Farbwert "${hex}" (${woher}) - erwartet wird #RRGGBB oder #RRGGBBAA.`,
    )
  }

  // Sechsstellig wird UNVERAENDERT durchgereicht, auch in seiner Gross-/Kleinschreibung
  // (Festlegung 4): Der Canvas ist hier unempfindlich, und jede Normalisierung waere eine
  // zweite Wahrheit ueber den Farbwert ohne Nutzen.
  if (hex.length === 7) return hex

  return rgbaAus(zerlegeFarbe(hex, woher))
}

/** Ein Farbwert als vier Kanaele – fuer die Scrim-Deckkraft braucht es den Alpha-Anteil. */
interface FarbTeile {
  r: number
  g: number
  b: number
  a: number
}

/** Zerlegt `#RRGGBB` oder `#RRGGBBAA`; Alpha steht hinten (s. `alsCanvasFarbe`). */
function zerlegeFarbe(hex: string, woher: string): FarbTeile {
  if (!HEX_FORM.test(hex)) {
    throw new Error(
      `Unzulaessiger Farbwert "${hex}" (${woher}) - erwartet wird #RRGGBB oder #RRGGBBAA.`,
    )
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
    a: hex.length === 7 ? 255 : parseInt(hex.slice(7, 9), 16),
  }
}

/** Der Canvas-Wert aus vier Kanaelen; Alpha mit drei Nachkommastellen (Festlegung 2+3). */
function rgbaAus(teile: FarbTeile): string {
  const faktor = 10 ** ALPHA_NACHKOMMASTELLEN
  const a = Math.round((teile.a / 255) * faktor) / faktor
  return `rgba(${teile.r}, ${teile.g}, ${teile.b}, ${a})`
}

/**
 * Die eigene Abdunkelung einer Zone (05.11.2026): Farbe und Deckkraft des Stopps, der zu
 * `rolle` gehoert (`scrimStart` = erster, `scrimEnde` = zweiter).
 *
 * Liefert `null`, wenn die Zone keine eigene Angabe fuer diesen Stopp traegt – dann gilt
 * unveraendert `loeseFarbe`. Die Deckkraft wird NICHT aus der Farbe abgeleitet: Sie ist
 * ein eigener Regler, und `#RRGGBB` traegt keinen Alpha-Wert.
 */
function loeseScrimStopp(
  marke: Marke,
  rolle: FarbRolle,
  aktion: AktionsInhalt,
  zone: Zone,
): string | null {
  const scrim = aktion.zonenGestaltung?.[zone.id]?.scrim
  if (scrim === null || scrim === undefined) return null

  const stopp =
    rolle === 'scrimStart'
      ? { farbe: scrim.vonFarbe, deckkraft: scrim.vonDeckkraft }
      : rolle === 'scrimEnde'
        ? { farbe: scrim.bisFarbe, deckkraft: scrim.bisDeckkraft }
        : null
  if (stopp === null) return null

  if (!belegt(marke.farben, rolle)) {
    throw new Error(`Farb-Rolle "${rolle}" ist in der Marke nicht belegt.`)
  }
  const teile = zerlegeFarbe(marke.farben[rolle], `Farb-Rolle "${rolle}"`)

  if (stopp.farbe !== null && stopp.farbe !== undefined) {
    // Der Vertrag der Zone ist `#RRGGBB` (der Waehler kennt keinen Alpha-Wert). Ein
    // achtstelliger Wert waere eine zweite Form und wuerde hier still anders wirken.
    if (typeof stopp.farbe !== 'string' || !istHexFarbe(stopp.farbe)) {
      throw new Error(
        `Unzulaessiger Farbwert "${String(stopp.farbe)}" (zonenGestaltung["${zone.id}"].scrim).`,
      )
    }
    const gewaehlt = zerlegeFarbe(stopp.farbe, `zonenGestaltung["${zone.id}"].scrim`)
    teile.r = gewaehlt.r
    teile.g = gewaehlt.g
    teile.b = gewaehlt.b
  }
  if (stopp.deckkraft !== null && stopp.deckkraft !== undefined) {
    const prozent = begrenzeZahl(
      stopp.deckkraft,
      GESTALTUNG_GRENZEN.deckkraft.min,
      GESTALTUNG_GRENZEN.deckkraft.max,
    )
    if (prozent === null) {
      throw new Error(
        `Unzulaessige Deckkraft "${String(stopp.deckkraft)}" (zonenGestaltung["${zone.id}"].scrim).`,
      )
    }
    teile.a = Math.round((prozent / 100) * 255)
  }
  return rgbaAus(teile)
}

/**
 * Loest einen Farb-Rollen-Verweis einer Vorlage in den konkreten Wert der Marke auf und
 * liefert ihn in einer Form, die ein Canvas-Kontext unmittelbar als Fuell- oder Strichfarbe
 * bzw. als Verlaufs-Stopp annimmt:
 *
 * - 6-stelliges Hex -> unveraendert durchgereicht (`#FF4040`)
 * - 8-stelliges Hex -> `rgba(r, g, b, a)` (`#000000B3` -> `rgba(0, 0, 0, 0.702)`)
 *
 * AKZENT-ERSETZUNG (TK 9.10.9): Ist `rolle` eine der drei Akzent-Rollen und ist
 * `aktion.akzentfarbe` gesetzt, gilt deren Wert statt des Markenwerts von `rolle`. Alle
 * uebrigen Rollen kommen IMMER aus der Marke. Ist `akzentfarbe` nicht gesetzt, gilt der
 * Markenwert - das ist der regulaere Rueckfall und kein Fehler.
 *
 * Der dritte Parameter ist PFLICHT und nicht optional (Festlegung 8): Ein optionaler
 * Parameter machte das Weglassen zu einem gueltigen Aufruf, und ein weggelassener Aufruf ist
 * genau der Zustand, den TK 9.10.9 abschafft - die Farbwahl bliebe an dieser Stelle
 * wirkungslos, OHNE dass irgendwo etwas auffiele.
 *
 * Der VIERTE Parameter ist seit 05.11.2026 optional: Wer eine Farbe FUER EINE ZONE
 * aufloest, reicht die Zone herein und bekommt die eigene Abdunkelung (zwei Stopps). Wer
 * sie nicht hereinreicht, loest wie bisher die Markenrolle auf - das ist kein stiller
 * Fehler, weil eine Scrim-Angabe ohne Zone gar nicht gefunden werden kann.
 *
 * WIRFT statt eine `Ergebnis<T>`-Huelle zu liefern (Festlegung 5): TK 9.1.1 gilt fuer jede
 * Operation ueber die Renderer-Main-Grenze, diese Funktion bleibt im Renderer; und
 * `zeichneSegment` liefert laut TK 9.10.1 ein `SegmentBild`, koennte eine Huelle also gar
 * nicht weiterreichen. NIEMALS eine Ersatzfarbe: Ein "nimm halt Schwarz" erzeugte ein
 * Segment, das gerendert, exportiert und auf dem Fernseher gezeigt wird - in der falschen
 * Farbe, ohne dass irgendwo ein Fehler erscheint.
 *
 * Von der `Aktion` werden `akzentfarbe` und – wenn eine Zone uebergeben wird – die
 * `scrim`-Angabe DIESER Zone gelesen (Festlegung 7, seit 05.11.2026 erweitert). Alles
 * andere der Aktion bleibt unberuehrt.
 */
export function loeseFarbe(
  marke: Marke,
  rolle: FarbRolle,
  aktion: AktionsInhalt,
  zone?: Zone,
): string {
  pruefePflichteingang(marke, 'marke')
  pruefePflichteingang(aktion, 'aktion')

  const gewaehlt = aktion.akzentfarbe

  // `typeof === 'string'` statt `!== null`: Aus einem alten oder von Hand bearbeiteten
  // Projekt kann hier auch `undefined` stehen, und das ist derselbe Rueckfall wie `null`.
  if (typeof gewaehlt === 'string' && AKZENT_ROLLEN.includes(rolle)) {
    // `akzentfarbe` IST EIN FREIER HEX-WERT, kein Rollen-Verweis.
    //
    // UMGESTELLT am 13.08.2026 (Entscheidung des Users, vorgezogen aus M8-45). Hier stand
    // ein Nachschlag in `marke.farben` samt Wurf, wenn der Wert keine Rolle ist - so
    // verlangte es Festlegung 9 des Issues. Diese Festlegung ist seit TK v3.4 ueberholt:
    // TK 9.8.2 ("FREIER Hex-Wert (FA-24; bis v3.3 nur Auswahl aus der Palette)"), TK 9.10.9,
    // FA-24 und R-08 sagen alle dasselbe, und die gebaute Vertragsdatei
    // `shared/contracts/aktion.ts` traegt den Kommentar seit dem 12.08.2026 ebenfalls.
    //
    // WARUM DAS AUFFIEL UND WARUM ES KEIN TYPECHECK GEFANGEN HAETTE: Der Typ ist in beiden
    // Fassungen `string | null` - nur die BEDEUTUNG war entgegengesetzt. Gebaut worden waere
    // sonst ein Zeichenpfad, der bei der Hausfarbe eines Partners MITTEN IM ZEICHNEN wirft:
    // im Aktions-Editor, in der Vorschau, in den Thumbnails und beim Segment-PNG des
    // finalen Renders.
    //
    // Der Wert laeuft durch DIESELBE Formatpruefung und Umrechnung wie ein Markenwert -
    // sechs- und achtstellige Hex-Werte sind beide zulaessig, und es entstehen keine zwei
    // Formatwege. Ein unbrauchbarer Wert wirft weiterhin, aber wegen seiner FORM, nicht
    // wegen eines fehlenden Eintrags in der Palette.
    return alsCanvasFarbe(gewaehlt, `aktion.akzentfarbe (angefragte Rolle "${rolle}")`)
  }

  // Die eigene Abdunkelung einer Zone (05.11.2026). Sie gilt nur fuer die beiden
  // Scrim-Rollen; fuer jede andere Rolle gibt es hier nichts zu lesen. Ohne Zone bleibt
  // der Weg unveraendert - ein Aufruf ohne Zone kann keine Zonen-Angabe finden.
  if (zone !== undefined && istScrimRolle(rolle)) {
    const scrim = loeseScrimStopp(marke, rolle, aktion, zone)
    if (scrim !== null) return scrim
  }

  if (!belegt(marke.farben, rolle)) {
    throw new Error(`Farb-Rolle "${rolle}" ist in der Marke nicht belegt.`)
  }
  return alsCanvasFarbe(marke.farben[rolle], `Farb-Rolle "${rolle}"`)
}

/**
 * Loest die Farbe EINER ZONE auf – der Weg, den jede Zone nehmen muss (05.11.2026).
 *
 * WARUM ES DIESE FUNKTION GIBT UND NICHT EIN ZWEITER AUFRUF IN DEN ZONEN: Seit 05.11.2026
 * kann der Nutzer die Text- und die Flaechenfarbe je Zone ueberschreiben. Laege das
 * Auswerten in `zone-text.ts`, waere `farben.ts` nicht mehr die eine Aufloesungsstelle
 * (TK 9.10.9), und die Flaechen-Ueberschreibung muesste in `zone-deko.ts` ein ZWEITES Mal
 * geschrieben werden – die erste Stelle, die jemand beim naechsten Umbau vergisst.
 *
 * DIE REGEL IST ABSICHTLICH ENG: Eine Ueberschreibung gilt nur fuer die Rolle, die die
 * Zone in der VORLAGE selbst traegt (`zone.text.farbRolle` bzw.
 * `zone.deko.füllungFarbRolle`). Es gibt hier KEINE Liste „das ist eine Textrolle": Solche
 * Listen waren im Projekt schon zweimal still falsch, und eine neue Vorlage mit einer
 * anderen Rolle waere ohne Zutun ausgenommen.
 *
 * Ein Verlauf bekommt SEIT 05.11.2026 eine eigene Abdunkelung – aber nur ueber die
 * Scrim-Rollen und mit ZWEI Stopps (Farbe und Deckkraft je Stopp, `ScrimGestaltung`).
 * Ein gewoehnlicher Verlauf (Akzent -> Akzent tief) bleibt bei der Marke: Fuer ihn gibt
 * es keinen Regler, und ein geratener Stopp waere schlimmer als keiner.
 *
 * Sonst gilt unveraendert `loeseFarbe`: erst die Akzent-Ersetzung der Aktion, dann die
 * Marke. Diese Funktion ist KEIN zweiter Rueckfallweg, sondern eine Vorschaltung.
 */
export function loeseFarbeInZone(
  marke: Marke,
  rolle: FarbRolle,
  aktion: AktionsInhalt,
  zone: Zone,
): string {
  pruefePflichteingang(marke, 'marke')
  pruefePflichteingang(aktion, 'aktion')
  pruefePflichteingang(zone, 'zone')

  const gestaltung = aktion.zonenGestaltung?.[zone.id]
  if (gestaltung !== null && gestaltung !== undefined) {
    // Text zuerst: Eine Zone mit eigener Schrift ist eine Textzone; ihre Flaechen-Rolle
    // (Pille) ist die Ausnahme, nicht die Regel.
    if (zone.text !== undefined && zone.text.farbRolle === rolle) {
      if (typeof gestaltung.textfarbe === 'string' && gestaltung.textfarbe.length > 0) {
        return alsCanvasFarbe(gestaltung.textfarbe, `zonenGestaltung["${zone.id}"].textfarbe`)
      }
    }
    if (zone.deko?.füllungFarbRolle === rolle) {
      if (typeof gestaltung.flaechefarbe === 'string' && gestaltung.flaechefarbe.length > 0) {
        return alsCanvasFarbe(
          gestaltung.flaechefarbe,
          `zonenGestaltung["${zone.id}"].flaechefarbe`,
        )
      }
    }
  }

  // Die Zone wird durchgereicht: Dort liegt die Abdunkelung (ScrimGestaltung), und
  // `loeseFarbe` ist die Stelle, die sie auswertet.
  return loeseFarbe(marke, rolle, aktion, zone)
}

/**
 * Liefert den Schrift-Datensatz `{ familie, gewicht, datei }` aus der Marke.
 *
 * Die Canvas-Kurzform daraus bildet #110, nicht diese Datei: Hier wird beantwortet "welche
 * Schrift?", dort "ist sie da und wie heisst sie fuer den Canvas?".
 *
 * Zurueckgegeben wird der Datensatz der Marke selbst, nicht eine Kopie - die Marke wird
 * weder veraendert noch zwischengespeichert, und zweimaliges Aufloesen derselben Rolle
 * liefert deshalb zwangslaeufig dasselbe (TK 9.10.3, Punkt 5: gleiche Eingabe -> gleiches
 * Bild).
 */
export function loeseSchrift(marke: Marke, rolle: SchriftRolle): Schrift {
  pruefePflichteingang(marke, 'marke')

  if (!belegt(marke.schriften, rolle)) {
    throw new Error(`Schrift-Rolle "${rolle}" ist in der Marke nicht belegt.`)
  }
  return marke.schriften[rolle]
}
