// Issue #293 – [template-canvas] Ersatz-Logo zeichnen (TK 9.10.10, 9.10.9, 9.10.6).
//
// Hat eine Marke kein Logo (marke.logo === null), steht hier der Markenname auf einer
// Fläche in der Akzentfarbe DER MARKE - mit automatisch gewählter, kontrastreicher
// Textfarbe, gebündelter Schrift und ohne Abschneiden.
//
// DIE VIER FESTLEGUNGEN AUS TK 9.10.10 (wörtlich im Issue):
// 1. Schrift: die GEBÜNDELTE Rolle headlinePlakativ (Archivo Black) - bewusst NICHT
//    loeseSchrift(marke, 'headlinePlakativ'), denn diese Auflösung liefe über eine ggf.
//    importierte Überschreibung, und genau diese Datei kann zur Renderzeit fehlen
//    (9.15.3). Der fixe Datensatz ist ein lokaler Wert dieser Datei, kein Import.
// 2. Textfarbe nach gemessenem Kontrast zwischen textAufDunkel und textAufHell -
//    entschieden von waehleBesserenKontrast (#292).
// 3. Lange Namen werden verkleinert, nicht abgeschnitten: einzeilig bis zur
//    Mindestgröße, darunter zweizeilig umbrechen, KEIN Auslassungszeichen (die Zeichenkette
//    dafuer kommt in dieser Datei nicht vor - Grep-Probe der DoD).
// 4. seitenverhaeltnis ist bei logo === null bedeutungslos; die Fläche ist zone.rahmen.
//
// ABGRENZUNG (TK 9.10.9): Die Akzentfläche liest marke.farben.akzent DIREKT, niemals
// aktion.akzentfarbe - ein Logo ist eine Konstante, das ist sein Zweck. `aktion` wird
// nur an loeseFarbe durchgereicht, weil deren dritter Parameter Pflicht ist; für die
// beiden Text-Rollen greift die Aktions-Ersetzung ohnehin nicht (nur AKZENT_ROLLEN).
//
// STOPP-FRAGEN SIND ENTSCHEIDEN (Nachtrag 23.08.2026 am Issue): Schrittweite 1 px,
// Mindestgröße 10 px, Zeilenhöhe 1,1; Innenabstand 16/12 px. ALLE WERTE STEHEN ALS
// BENANNTE KONSTANTEN HIER OBEN - ausdrückliche Auflage des Users, damit sie im
// Nachhinein anpassbar sind.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke, Schrift } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'

import { loeseFarbe } from './farben'
import { schriftKurzform } from './schriften'
import { waehleBesserenKontrast } from '../gemeinsam/kontrast'

// ---------------------------------------------------------------------------
// ANPASSBARE WERTE (User-Entscheidung 23.08.2026, Nachtrag zu #293)
// ---------------------------------------------------------------------------

/** Startgröße: die verfügbare Höhe der Zone minus Innenabstand (keine Konstante - sie
 *  hängt von der jeweiligen Zone ab; anpassbar sind Schrittweite, Minimum und Faktor). */
const VERKLEINERUNGSSCHRITT_PX = 1
const MINDESTGROESSE_PX = 10
const ZEILENHOEHE_FAKTOR = 1.1
const INNENABSTAND_X_PX = 16
const INNENABSTAND_Y_PX = 12

// Archivo Black 900 - wörtlich aus der Schrift-Rollen-Tabelle TK 9.11.2 abgeschrieben.
// `datei` und `herkunft` sind hier irrelevant, weil schriftKurzform() nur
// familie/gewicht liest - dennoch vollständig ausgefüllt, um dem Typ Schrift zu entsprechen.
const HEADLINE_PLAKATIV_GEBUENDELT: Schrift = {
  familie: 'Archivo Black',
  gewicht: 900,
  datei: '',
  herkunft: 'gebuendelt',
}

/**
 * Zeichnet den Ersatz-Logo-Inhalt EINER Zone (bindung: 'logo', marke.logo === null) auf ctx,
 * im Rechteck zone.rahmen. Diese Datei LIEST marke.logo NICHT - die Entscheidung "ist ein
 * Ersatz nötig" trifft der Aufrufer (#294, Dispatch in zeichne-segment.ts).
 *
 * Liefert nichts und wirft nur bei Programmierfehlern (leerer Markenname); keine
 * Ergebnis-Hülle, wie bei allen Zonen-Funktionen des Moduls.
 */
export function zeichneErsatzLogo(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  marke: Marke,
  aktion: Aktion,
): void {
  if (typeof marke.name !== 'string' || marke.name.trim() === '') {
    throw new Error('ersatz-logo: marke.name ist leer (Programmierfehler, #52-Pflichtfeld).')
  }

  const rahmen = zone.rahmen

  // Die Akzentfläche DIREKT aus der Marke - kein loeseFarbe('akzent', ...), das wäre
  // die ausdrücklich ausgeschlossene Aktions-Ersetzung (TK 9.10.9). Laut Rollen-Tabelle
  // (TK 9.11.2) ist der Wert 6-stelliges Hex und damit fillStyle-tauglich.
  ctx.fillStyle = marke.farben.akzent
  ctx.fillRect(rahmen.x, rahmen.y, rahmen.breite, rahmen.höhe)

  // Textfarbe nach gemessenem Kontrast gegen die Akzentfläche.
  const textfarbe = waehleBesserenKontrast(
    marke.farben.akzent,
    loeseFarbe(marke, 'textAufDunkel', aktion),
    loeseFarbe(marke, 'textAufHell', aktion),
  )
  ctx.fillStyle = textfarbe

  const verfuegbarBreite = rahmen.breite - 2 * INNENABSTAND_X_PX
  const verfuegbarHoehe = rahmen.höhe - 2 * INNENABSTAND_Y_PX

  // Kaskade: einzeilig abwärts messen, darunter zweizeilig auf Mindestgröße.
  let groesse = verfuegbarHoehe
  while (
    groesse > MINDESTGROESSE_PX &&
    misseBreite(ctx, marke.name.trim(), groesse) > verfuegbarBreite
  ) {
    groesse -= VERKLEINERUNGSSCHRITT_PX
  }

  const zeilen: string[] =
    misseBreite(ctx, marke.name.trim(), groesse) <= verfuegbarBreite
      ? [marke.name.trim()]
      : umbrecheZweizeilig(marke.name.trim())

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (zeilen.length === 1) {
    ctx.font = schriftKurzform(HEADLINE_PLAKATIV_GEBUENDELT, groesse)
    ctx.fillText(zeilen[0] ?? '', rahmen.x + rahmen.breite / 2, rahmen.y + rahmen.höhe / 2)
    return
  }

  // Zweizeilig: beide Zeilen auf MINDESTGROESSE, vertikal zentriert mit ZEILENHOEHE_FAKTOR.
  ctx.font = schriftKurzform(HEADLINE_PLAKATIV_GEBUENDELT, MINDESTGROESSE_PX)
  const zeilenhoehe = MINDESTGROESSE_PX * ZEILENHOEHE_FAKTOR
  const mitteY = rahmen.y + rahmen.höhe / 2
  ctx.fillText(zeilen[0] ?? '', rahmen.x + rahmen.breite / 2, mitteY - zeilenhoehe / 2)
  ctx.fillText(zeilen[1] ?? '', rahmen.x + rahmen.breite / 2, mitteY + zeilenhoehe / 2)
}

function misseBreite(ctx: CanvasRenderingContext2D, text: string, groesse: number): number {
  ctx.font = schriftKurzform(HEADLINE_PLAKATIV_GEBUENDELT, groesse)
  return ctx.measureText(text).width
}

/** Wortgrenze nahe der Mitte; ohne Wortabstand hart in der Mitte. */
function umbrecheZweizeilig(name: string): [string, string] {
  if (name.includes(' ')) {
    const woerter = name.split(' ')
    let besteStelle = 1
    let besterAbstand = Number.POSITIVE_INFINITY
    for (let stelle = 1; stelle < woerter.length; stelle++) {
      const oben = woerter.slice(0, stelle).join(' ')
      const unten = woerter.slice(stelle).join(' ')
      const abstand = Math.abs(oben.length - unten.length)
      if (abstand < besterAbstand) {
        besterAbstand = abstand
        besteStelle = stelle
      }
    }
    return [
      woerter.slice(0, besteStelle).join(' '),
      woerter.slice(besteStelle).join(' '),
    ]
  }
  const mitte = Math.ceil(name.length / 2)
  return [name.slice(0, mitte), name.slice(mitte)]
}
