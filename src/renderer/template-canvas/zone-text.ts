// [template-canvas] Eine Textzone zeichnen
//
// UEBER DIESER DATEI LAEUFT JEDE BUCHSTABE, DEN DAS SYSTEM AUF EINEN FERNSEHER
// BRINGT. Deshalb gilt hier das Vorzeichen des Issues ganz strikt:
//   - Diese Funktion wirft NIEMALS. Sie laeuft in einer Schleife ueber alle Zonen
//     (zeichneSegment #117); eine Ausnahme wuerde das ganze Segment leer lassen.
//   - Keine Ersatzschrift, keine Ersatzfarbe, kein eigener Umbruch: Was nicht
//     sauber aufgeloest werden kann, wird UEBERHAUPT nicht gezeichnet - ein
//     fehlender Text faellt auf, ein geratener faellt lautlos nicht auf.
//   - Die Akzent-Ersetzung sitzt AUSSCHLIESSLICH in `farben.ts` (#112, TK 9.10.9).
//     Diese Datei reicht die Aktion nur durch und liest sie NIE selbst - seit
//     05.11.2026 auch fuer die GROESSE und die AUSRICHTUNG nicht: beide kommen aus den
//     beiden reinen Helfern unten (`zonenGroessen`, `zonenAusrichtungHorizontal`).
//   - Der Kontext kommt herein und wird lueckenlos wiederhergestellt: zu jedem
//     save() genau ein restore(), auch auf jedem vorzeitigen Pfad - sonst faerbt
//     ein Clip oder eine Fuellfarbe auf die NAECHSTE Zone ab.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { AktionsInhalt } from '../../shared/contracts/aktion'

import { loeseFarbeInZone, loeseSchrift } from './farben'
import { schriftKurzform } from './schriften'
import { ZEILENHOEHE_FAKTOR, passeTextEin } from './text-kaskade'
import type { KaskadenEingang, KaskadenErgebnis } from './text-kaskade'
import type { Schrift } from '../../shared/contracts/marke'
import { groessenFaktor } from '../../shared/gestaltung'

/**
 * Die Groesse, mit der die Kaskade STARTET – Vorlagenwert mal Nutzer-Faktor.
 *
 * Der Faktor wirkt auf `größeMax` UND `größeMin`. Nur das Maximum zu skalieren waere
 * falsch: Bei „doppelt so gross" liefe der Text sofort in die Untergrenze und die
 * Kaskade verkleinerte ihn wieder auf den Vorlagenwert – der Regler waere wirkungslos.
 *
 * Gerundet wird, weil Canvas-Schriftgroessen mit Nachkommastellen je Plattform anders
 * gerundet werden; zwei Geraete zeigten dann verschiedene Zeilenumbrueche (TK 9.10.3
 * Punkt 5, gleiche Eingabe -> gleiches Bild).
 */
export function zonenGroessen(zone: Zone, aktion: AktionsInhalt): { max: number; min: number } | null {
  if (zone.text === undefined) return null
  const faktor = groessenFaktor(aktion.zonenGestaltung?.[zone.id]?.groesseProzent)
  return {
    max: Math.max(8, Math.round(zone.text.größeMax * faktor)),
    min: Math.max(6, Math.round(zone.text.größeMin * faktor)),
  }
}

/** Die waagerechte Ausrichtung dieser Zone: eigene Wahl, sonst die der Vorlage. */
export function zonenAusrichtungHorizontal(zone: Zone, aktion: AktionsInhalt): 'links' | 'mitte' | 'rechts' {
  const gewaehlt = aktion.zonenGestaltung?.[zone.id]?.ausrichtung
  if (gewaehlt === 'links' || gewaehlt === 'mitte' || gewaehlt === 'rechts') return gewaehlt
  // Unbekannte Werte gelten als links (Darstellungsfrage, kein Datenverlust).
  return zone.ausrichtung.horizontal === 'mitte' || zone.ausrichtung.horizontal === 'rechts'
    ? zone.ausrichtung.horizontal
    : 'links'
}

export function zeichneTextZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  text: string,
  marke: Marke,
  aktion: AktionsInhalt,
): void {
  // SCHRITT 1 - Abbruchbedingungen, und zwar BEVOR irgendetwas am Kontext steht.
  // Kein ctx.save() auf diesen Pfaden (das verlangt der Abrechnungstest "genau
  // ein save"); eine Zone ohne Flaeche oder ohne Textparameter zeichnet nichts
  // und ist sonst nachlässig.
  if (!zone.text) {
    return
  }

  if (text.trim().length === 0) {
    return
  }

  if (
    !Number.isFinite(zone.rahmen.breite) ||
    !Number.isFinite(zone.rahmen.höhe) ||
    zone.rahmen.breite <= 0 ||
    zone.rahmen.höhe <= 0
  ) {
    return
  }

  ctx.save()

  // SCHRITT 3 - Beschnittbereich = der Zonenrahmen, unverändert (absolute Pixel).
  // Die Kaskade garantiert die Breite, nicht die Höhe: Eine unglücklich
  // parametrierte Vorlage darf kürzen, aber nicht in die Nachbarzone laufen.
  ctx.beginPath()
  ctx.rect(zone.rahmen.x, zone.rahmen.y, zone.rahmen.breite, zone.rahmen.höhe)
  ctx.clip()

  // SCHRITT 4 - Schrift auflösen. Unbekannte Rolle in einer eigenen Vorlage:
  // ohne Text, KEINE Ersatzschrift.
  let schrift: Schrift
  try {
    schrift = loeseSchrift(marke, zone.text.schriftRolle)
  } catch {
    ctx.restore()
    return
  }

  // SCHRITT 5 - Der Messer misst auf DEMSELBEN ctx, auf dem unten gezeichnet
  // wird, und setzt vor jeder Messung ctx.font ueber schriftKurzform. Ein
  // zweiter Messkontext waere ein lautloser Drift zwischen Messung und Zeichnung.
  const messeBreite = (t: string, größe: number): number => {
    ctx.font = schriftKurzform(schrift, größe)
    return ctx.measureText(t).width
  }

  let kaskade: KaskadenErgebnis
  try {
    // Seit 05.11.2026: Startgroesse aus der Gestaltung der Zone (Prozent der Vorlage).
    // `zonenGroessen` liefert `null` nur, wenn die Zone gar keine Textparameter hat -
    // das ist oben schon abgefangen, hier ist es der unveraenderte Vorlagenwert.
    const groessen = zonenGroessen(zone, aktion) ?? {
      max: zone.text.größeMax,
      min: zone.text.größeMin,
    }
    const eingang: KaskadenEingang = {
      text,
      breite: zone.rahmen.breite,
      höhe: zone.rahmen.höhe,
      größeMax: groessen.max,
      größeMin: groessen.min,
      maxZeilen: zone.text.maxZeilen,
    }
    kaskade = passeTextEin(eingang, messeBreite)
  } catch {
    ctx.restore()
    return
  }

  // SCHRITT 6 - Zeilenhöhe HIER rechnen, mit dem importierten Faktor. Die
  // Zahl steht nirgends als Literal in dieser Datei.
  const zeilenhöhe = kaskade.größe * ZEILENHOEHE_FAKTOR

  // SCHRITT 7 - Endgültige Kontext-Werte NACH der Kaskade setzen. Der Messer
  // hat ctx.font auf eine Probiergröße gestellt; hier kommt die gewählte Größe.
  ctx.font = schriftKurzform(schrift, kaskade.größe)

  try {
    ctx.fillStyle = loeseFarbeInZone(marke, zone.text.farbRolle, aktion, zone)
  } catch {
    ctx.restore()
    return
  }

  ctx.textBaseline = 'top'

  // Seit 05.11.2026: eigene Ausrichtung der Zone schlaegt die der Vorlage.
  // Unbekannte Werte gelten als links (Darstellungsfrage, kein Datenverlust).
  const gewaehlt = zonenAusrichtungHorizontal(zone, aktion)
  const horizontal = gewaehlt === 'mitte' ? 'center' : gewaehlt === 'rechts' ? 'right' : 'left'
  ctx.textAlign = horizontal

  // Text bekommt keinen Schatten: Das Zonen-Modell kennt keins, und marke.schatten
  // gehoert zu dekorativen Flächen. Explizit nullen, falls ein Vorgaenger setzte.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  // SCHRITT 8 - x-Koordinate.
  const x =
    gewaehlt === 'mitte'
      ? zone.rahmen.x + zone.rahmen.breite / 2
      : gewaehlt === 'rechts'
        ? zone.rahmen.x + zone.rahmen.breite
        : zone.rahmen.x

  // SCHRITT 9 - y-Startkoordinate aus der Blockhöhe.
  const blockHöhe = kaskade.zeilen.length * zeilenhöhe
  const vertikal = zone.ausrichtung.vertikal
  const yStart =
    vertikal === 'mitte'
      ? zone.rahmen.y + (zone.rahmen.höhe - blockHöhe) / 2
      : vertikal === 'unten'
        ? zone.rahmen.y + zone.rahmen.höhe - blockHöhe
        : zone.rahmen.y

  // SCHRITT 10 - Zeile fuer Zeile, OHNE maxWidth (keine vierte Kaskadenstufe,
  // die Glyphen staucht). Leeres Ergebnis: nichts zeichnen.
  for (let i = 0; i < kaskade.zeilen.length; i++) {
    const zeile = kaskade.zeilen[i]
    if (zeile !== undefined) {
      ctx.fillText(zeile, x, yStart + i * zeilenhöhe)
    }
  }

  // SCHRITT 11 - restore als letzte Anweisung, auf JEDEM Pfad nach Schritt 2.
  ctx.restore()
}
