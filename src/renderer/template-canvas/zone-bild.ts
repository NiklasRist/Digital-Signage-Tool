// [template-canvas] Eine Bildzone zeichnen (#115, M4-20).
//
// Ein bereits dekodiertes Motiv steht in seiner Zone: contain = ganz sichtbar und
// zentriert, cover = flaechenfuellend mittig beschnitten; ein fehlendes Motiv
// hinterlaesst einen unuebersehbaren Platzhalter (Defektanzeige, TK 9.10.7).
//
// Verbindliche Festlegungen:
// - contain ueber 5-Argument-drawImage (Ziel-Rechteck), cover ueber die
//   9-Argument-Form mit QUELL-Rechteck - bewusst ohne Beschneidungsbereich (der
//   muesste zusaetzlich gesichert werden und liesse folgende Zonen in das Rechteck
//   hineinzeichnen).
// - NICHT runden: Runden verzieht das Seitenverhaeltnis um bis zu einen Pixel.
// - Maesse AUSSCHLIESSLICH aus motiv.breite/motiv.hoehe - nie die natuerlichen
//   Bildobjekt-Masse (ImageBitmap hat die nicht; zwei Ermittlungsstellen driften).
// - Interpolation explizit gesetzt - herunterkalierte Fotos sind sonst auf 85 Zoll
//   sichtbar aliasing-behaftet; der Wert wird nicht der Chromium-Voreinstellung
//   ueberlassen.
// - Der Platzhalter ist eine Defektanzeige in Marken-Rollen; jeder seiner vier
//   Teilschritte faengt seine Ausnahme SELBST und ueberspringt genau sich. Diese
//   Funktion wirft NIEMALS (sie laeuft in der Zonen-Schleife von #117).
// - Die Akzent-Ersetzung sitzt nur in loeseFarbe (#112): Die Aktion wird als drittes
//   Argument DURCHGEREICHT, nie gelesen - auch im Platzhalter gilt das bewusst
//   (Defektanzeige in der Aktions-Akzentfarbe ist richtig so).
// - Genau EIN save() und EIN restore() je zeichnendem Pfad.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Motiv } from './bild-laden'

import { loeseFarbe, loeseSchrift } from './farben'
import { schriftKurzform } from './schriften'

export function zeichneBildZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  motiv: Motiv,
  marke: Marke,
  aktion: Aktion,
): void {
  // 1. Abbruchbedingungen zuerst - ohne Flaeche gibt es nichts anzuzeigen, auch keinen
  //    Platzhalter; kein save/restore.
  const rb = zone.rahmen.breite
  const rh = zone.rahmen.höhe
  if (!Number.isFinite(rb) || !Number.isFinite(rh) || rb <= 0 || rh <= 0) {
    return
  }

  // 2. Genau EIN save(); restore laeuft am Ende auf jedem Pfad.
  ctx.save()

  try {
    // Ein Bildobjekt ohne brauchbare Maesse ist nicht zeichenbar - dieselbe
    // Defektanzeige wie ein fehlendes Motiv (Fehlerpfade-Tabelle).
    const geladen =
      motiv.zustand === 'geladen' &&
      Number.isFinite(motiv.breite) &&
      Number.isFinite(motiv.höhe) &&
      motiv.breite > 0 &&
      motiv.höhe > 0

    if (geladen && motiv.zustand === 'geladen') {
      try {
        zeichneGeladenesMotiv(ctx, zone, motiv, rb, rh)
      } catch {
        // drawImage wirft (verwaistes Bildobjekt): statt einer leeren Flaeche die
        // Defektanzeige; die Ausnahme wird nicht weitergereicht.
        zeichnePlatzhalter(ctx, zone, marke, aktion)
      }
    } else {
      zeichnePlatzhalter(ctx, zone, marke, aktion)
    }
  } finally {
    // 4. Auf JEDEM Pfad, der nach dem save endet.
    ctx.restore()
  }
}

function zeichneGeladenesMotiv(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  motiv: Extract<Motiv, { zustand: 'geladen' }>,
  rb: number,
  rh: number,
): void {
  // Einpassung: fehlendes zone.bild oder unbekannter Wert gilt als 'contain' - der
  // schadenaermere Wert, denn contain kann nie Inhalt abschneiden.
  const einpassung = zone.bild?.einpassung === 'cover' ? 'cover' : 'contain'

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const iw = motiv.breite
  const ih = motiv.höhe
  const x = zone.rahmen.x
  const y = zone.rahmen.y

  if (einpassung === 'contain') {
    // Ganzes Motiv sichtbar, kein Beschnitt, im Rahmen zentriert. 5 Argumente.
    const skalierung = Math.min(rb / iw, rh / ih)
    const zielBreite = iw * skalierung
    const zielHöhe = ih * skalierung
    ctx.drawImage(motiv.bild, x + (rb - zielBreite) / 2, y + (rh - zielHöhe) / 2, zielBreite, zielHöhe)
  } else {
    // Flaechenfuellend, mittig beschnitten - ueber das QUELL-Rechteck in Quellpixeln.
    const skalierung = Math.max(rb / iw, rh / ih)
    const quellBreite = rb / skalierung
    const quellHöhe = rh / skalierung
    const quellX = (iw - quellBreite) / 2
    const quellY = (ih - quellHöhe) / 2
    ctx.drawImage(
      motiv.bild,
      quellX,
      quellY,
      quellBreite,
      quellHöhe,
      x,
      y,
      rb,
      rh,
    )
  }
}

function zeichnePlatzhalter(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  marke: Marke,
  aktion: Aktion,
): void {
  const breite = zone.rahmen.breite
  const hoehe = zone.rahmen.höhe
  const x = zone.rahmen.x
  const y = zone.rahmen.y

  // 1. Rahmenflaeche vollstaendig fuellen.
  try {
    ctx.fillStyle = loeseFarbe(marke, 'flaecheDunkel', aktion)
    ctx.fillRect(x, y, breite, hoehe)
  } catch {
    // Genau dieser Teilschritt entfaellt; keine Ersatzfarbe.
  }

  // 2. Umlaufender Strich, 4 px, um 2 px nach innen versetzt.
  try {
    ctx.strokeStyle = loeseFarbe(marke, 'akzent', aktion)
    ctx.lineWidth = 4
    ctx.strokeRect(x + 2, y + 2, breite - 4, hoehe - 4)
  } catch {
    // Dieser Teilschritt entfaellt.
  }

  // 3. Zwei Diagonalen von Ecke zu Ecke, 4 px.
  try {
    ctx.strokeStyle = loeseFarbe(marke, 'akzent', aktion)
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + breite, y + hoehe)
    ctx.moveTo(x + breite, y)
    ctx.lineTo(x, y + hoehe)
    ctx.stroke()
  } catch {
    // Dieser Teilschritt entfaellt.
  }

  // 4. Beschriftung exakt im geometrischen Mittelpunkt, ohne maxWidth - "mittig" ist
  //    damit eine nachrechenbare Zahl und keine Auslegungsfrage.
  try {
    const größe = Math.min(48, Math.max(16, Math.round(hoehe / 8)))
    ctx.fillStyle = loeseFarbe(marke, 'textAufDunkel', aktion)
    ctx.font = schriftKurzform(loeseSchrift(marke, 'fliesstext'), größe)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Bild fehlt', x + breite / 2, y + hoehe / 2)
  } catch {
    // Auch ohne Beschriftung bleibt die Anzeige eine sichtbare Defektanzeige.
  }
}
