// GENERIERT aus dem Signaturblock von Issue #112.
// [template-canvas] Farb- und Schriftrollen der Marke auflösen
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
// GERUEST-PRUEFSUMME: 58776af465089674

import type { Marke, FarbRolle, SchriftRolle, Schrift } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'

// DIE EINE AUFLOESUNGSSTELLE FUER FARB- UND SCHRIFTROLLEN.
//
// "Es gibt genau eine Aufloesungsstelle. Keine Zonen-Sorte (Text, Bild, Deko, Verlauf)
// darf `marke.farben[...]` direkt lesen - sonst wirkt die Akzentfarbe in der Pille, aber
// nicht im Verlauf dahinter, und niemand faende den Grund." (TK 9.10.9) Wer eine Farbe
// braucht, ruft `loeseFarbe`; wer eine Schrift braucht, ruft `loeseSchrift`.
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

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Der Canvas quantisiert Alpha ohnehin auf 8 Bit; drei Nachkommastellen sind exakt genug
  // und ergeben einen kurzen, stabilen, vergleichbaren Wert statt 0.7019607843137254.
  const faktor = 10 ** ALPHA_NACHKOMMASTELLEN
  const a = Math.round((parseInt(hex.slice(7, 9), 16) / 255) * faktor) / faktor

  return `rgba(${r}, ${g}, ${b}, ${a})`
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
 * WIRFT statt eine `Ergebnis<T>`-Huelle zu liefern (Festlegung 5): TK 9.1.1 gilt fuer jede
 * Operation ueber die Renderer-Main-Grenze, diese Funktion bleibt im Renderer; und
 * `zeichneSegment` liefert laut TK 9.10.1 ein `SegmentBild`, koennte eine Huelle also gar
 * nicht weiterreichen. NIEMALS eine Ersatzfarbe: Ein "nimm halt Schwarz" erzeugte ein
 * Segment, das gerendert, exportiert und auf dem Fernseher gezeigt wird - in der falschen
 * Farbe, ohne dass irgendwo ein Fehler erscheint.
 *
 * Von der `Aktion` wird AUSSCHLIESSLICH `akzentfarbe` gelesen (Festlegung 7).
 */
export function loeseFarbe(marke: Marke, rolle: FarbRolle, aktion: Aktion): string {
  pruefePflichteingang(marke, 'marke')
  pruefePflichteingang(aktion, 'aktion')

  const gewaehlt = aktion.akzentfarbe

  // `typeof === 'string'` statt `!== null`: Aus einem alten oder von Hand bearbeiteten
  // Projekt kann hier auch `undefined` stehen, und das ist derselbe Rueckfall wie `null`.
  if (typeof gewaehlt === 'string' && AKZENT_ROLLEN.includes(rolle)) {
    // `akzentfarbe` ist ein ROLLEN-Verweis, kein Hex-Wert (Festlegung 9) - deshalb der
    // Nachschlag. Anschliessend laeuft der Wert durch DIESELBE Formatpruefung und dieselbe
    // Umrechnung wie ein regulaerer Markenwert; es entstehen keine zwei Formatwege.
    if (!belegt(marke.farben, gewaehlt)) {
      throw new Error(
        `aktion.akzentfarbe "${gewaehlt}" ist keine Farb-Rolle der Marke ` +
          `(angefragte Rolle: "${rolle}").`,
      )
    }
    return alsCanvasFarbe(
      marke.farben[gewaehlt],
      `aktion.akzentfarbe "${gewaehlt}", angefragte Rolle "${rolle}"`,
    )
  }

  if (!belegt(marke.farben, rolle)) {
    throw new Error(`Farb-Rolle "${rolle}" ist in der Marke nicht belegt.`)
  }
  return alsCanvasFarbe(marke.farben[rolle], `Farb-Rolle "${rolle}"`)
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
