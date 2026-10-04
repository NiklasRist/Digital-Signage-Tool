// GENERIERT aus dem Signaturblock von Issue #115.
// [template-canvas] Eine Bildzone zeichnen
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
// GERUEST-PRUEFSUMME: bbd94ecc6a5e5a3b
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// (entfernt - Rumpf gefuellt, Issue #115)
//
// REGLN DIESER DATEI (Issue #115):
//   - Sie wirft NIEMALS; jede Ausnahme endet in "Teilschritt uebersprungen" bzw.
//     im Platzhalter, und restore() laeuft auf jedem Pfad nach dem save().
//   - Sie LAEDT nichts: Das Motiv kommt fertig dekodiert herein (#111); keine
//     media://-URL, kein new Image, kein await.
//   - Bildmaesse NUR aus motiv.breite/motiv.hoehe - nie naturalWidth/naturalHeight
//     und nie width/height am Bildobjekt (ImageBitmap hat die nicht, und zwei
//     Stellen, die dieselbe Groesse ermitteln, driften).
//   - Das Seitenverhaeltnis bleibt in BEIDEN Einpassungen erhalten; cover laeuft
//     ueber das Quell-Rechteck (9-Argument-Form), NICHT ueber einen clip.
//   - Der Platzhalter ist eine Defektanzeige und wird IMMER gezeichnet, wenn das
//     Motiv fehlt; die Sperre gegen den finalen Render sitzt im composer (M5).
//   - Farben/Schrift nur ueber loeseFarbe/loeseSchrift (#112) - die Aktion wird
//     durchgereicht, die Akzent-Ersetzung sitzt dort und NUR dort (TK 9.10.9).
//   - Nicht gerundet wird: Runden verzieht das Seitenverhaeltnis um einen Pixel.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Motiv } from './bild-laden'

import { loeseFarbe, loeseSchrift } from './farben'
import { schriftKurzform } from './schriften'

// Strichstaerke des Platzhalters (Strich und Diagonalen), in px - festgelegt im Issue.
const STRICH_PX = 4
// Einrueckung des umlaufenden Strichs, damit er vollstaendig in der Zone liegt, in px.
const INNEN_VERSATZ_PX = 2

export function zeichneBildZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  motiv: Motiv,
  marke: Marke,
  aktion: Aktion,
): void {
  // SCHRITT 1 - Abbruchbedingungen VOR dem save(): Eine Zone ohne Flaeche kann
  // nichts anzeigen - auch keinen Platzhalter.
  if (
    !Number.isFinite(zone.rahmen.breite) ||
    !Number.isFinite(zone.rahmen.höhe) ||
    zone.rahmen.breite <= 0 ||
    zone.rahmen.höhe <= 0
  ) {
    return
  }

  ctx.save()

  const zeichnung: 'motiv' | 'platzhalter' =
    motiv.zustand === 'geladen' &&
    Number.isFinite(motiv.breite) &&
    Number.isFinite(motiv.höhe) &&
    motiv.breite > 0 &&
    motiv.höhe > 0
      ? 'motiv'
      : 'platzhalter'

  if (zeichnung === 'motiv') {
    zeichneMotiv()
  } else {
    zeichnePlatzhalter()
  }

  ctx.restore()

  // --------------------------------------------------------------------
  // Das Motiv - contain ueber das Ziel-Rechteck, cover ueber das Quell-Rechteck.
  // --------------------------------------------------------------------
  function zeichneMotiv(): void {
    if (motiv.zustand !== 'geladen') {
      return
    }
    // Interpolation EXPLIZIT, VOR dem ersten drawImage: Herunterskalierte Fotos
    // sind sonst auf 85 Zoll sichtbar verzaubert, und eine kuenftige
    // Chromium-Fassung duerfte die Voreinstellung nicht still aendern.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // zone.bild fehlt bzw. nennt einen unbekannten Wert -> contain, der
    // schadensaermere Wert (er kann nie Inhalt abschneiden).
    const einpassung: 'contain' | 'cover' =
      zone.bild?.einpassung === 'cover' ? 'cover' : 'contain'

    const iw = motiv.breite
    const ih = motiv.höhe
    const x = zone.rahmen.x
    const y = zone.rahmen.y
    const rb = zone.rahmen.breite
    const rh = zone.rahmen.höhe

    if (einpassung === 'contain') {
      const skalierung = Math.min(rb / iw, rh / ih)
      const zielBreite = iw * skalierung
      const zielHöhe = ih * skalierung
      const zielX = x + (rb - zielBreite) / 2
      const zielY = y + (rh - zielHöhe) / 2
      try {
        ctx.drawImage(motiv.bild, zielX, zielY, zielBreite, zielHöhe)
      } catch {
        // Verwaistes Bildobjekt: statt einer leeren Flaeche die Defektanzeige.
        zeichnePlatzhalter()
      }
      return
    }

    const skalierung = Math.max(rb / iw, rh / ih)
    const quellBreite = rb / skalierung
    const quellHöhe = rh / skalierung
    const quellX = (iw - quellBreite) / 2
    const quellY = (ih - quellHöhe) / 2
    try {
      ctx.drawImage(motiv.bild, quellX, quellY, quellBreite, quellHöhe, x, y, rb, rh)
    } catch {
      zeichnePlatzhalter()
    }
  }

  // --------------------------------------------------------------------
  // Der Platzhalter - Defektanzeige, bewusst nicht markenschaen. Vier
  // Teilschritte, jeder in einem eigenen try/catch: Wirft loeseFarbe oder
  // loeseSchrift, fehlt GENAU der betroffene Schritt, die uebrigen drei
  // stehen bleiben. Keine Ersatzfarbe, keine Ersatzschrift, kein Wurf.
  // --------------------------------------------------------------------
  function zeichnePlatzhalter(): void {
    const x = zone.rahmen.x
    const y = zone.rahmen.y
    const rb = zone.rahmen.breite
    const rh = zone.rahmen.höhe

    // Schritt 1: Flaeche.
    try {
      ctx.fillStyle = loeseFarbe(marke, 'flaecheDunkel', aktion)
      ctx.fillRect(x, y, rb, rh)
    } catch {
      // Teilschritt uebersprungen.
    }

    // Schritt 2: umlaufender Strich, um 2 px nach innen versetzt.
    try {
      ctx.strokeStyle = loeseFarbe(marke, 'akzent', aktion)
      ctx.lineWidth = STRICH_PX
      ctx.strokeRect(
        x + INNEN_VERSATZ_PX,
        y + INNEN_VERSATZ_PX,
        rb - INNEN_VERSATZ_PX * 2,
        rh - INNEN_VERSATZ_PX * 2,
      )
    } catch {
      // Teilschritt uebersprungen.
    }

    // Schritt 3: zwei Diagonalen von Ecke zu Ecke.
    try {
      ctx.strokeStyle = loeseFarbe(marke, 'akzent', aktion)
      ctx.lineWidth = STRICH_PX
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + rb, y + rh)
      ctx.moveTo(x + rb, y)
      ctx.lineTo(x, y + rh)
      ctx.stroke()
    } catch {
      // Teilschritt uebersprungen.
    }

    // Schritt 4: Beschriftung, exakt so - geometrischer Mittelpunkt.
    try {
      const größe = Math.min(48, Math.max(16, Math.round(rh / 8)))
      const schrift = loeseSchrift(marke, 'fliesstext')
      ctx.font = schriftKurzform(schrift, größe)
      ctx.fillStyle = loeseFarbe(marke, 'textAufDunkel', aktion)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Bild fehlt', x + rb / 2, y + rh / 2)
    } catch {
      // Teilschritt uebersprungen - auch hier keine Ersatzschrift.
    }
  }
}
