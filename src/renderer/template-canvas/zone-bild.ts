// [template-canvas] Eine Bildzone zeichnen
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
//     ueber das Quell-Rechteck (9-Argument-Form), NICHT ueber einen clip - so lange,
//     wie kein eigener Bildausschnitt gesetzt ist. Mit Zoom/Position (05.11.2026,
//     TK 9.8.8) wird das Zielrechteck groesser als die Zone und dann BESCHNITTEN,
//     sonst liefe das Bild in die Nachbarzone.
//   - Der Platzhalter ist eine Defektanzeige und wird IMMER gezeichnet, wenn das
//     Motiv fehlt; die Sperre gegen den finalen Render sitzt im composer (M5).
//   - Farben/Schrift nur ueber loeseFarbe/loeseSchrift (#112) - die Aktion wird
//     durchgereicht, die Akzent-Ersetzung sitzt dort und NUR dort (TK 9.10.9).
//   - Nicht gerundet wird: Runden verzieht das Seitenverhaeltnis um einen Pixel.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { AktionsInhalt } from '../../shared/contracts/aktion'
import type { Motiv } from './bild-laden'
import type { EffektZustand } from '../../shared/effekte'

import { loeseFarbe, loeseSchrift } from './farben'
import { schriftKurzform } from './schriften'
import { versatzProzent, zoomFaktor } from '../../shared/gestaltung'

// Strichstaerke des Platzhalters (Strich und Diagonalen), in px - festgelegt im Issue.
const STRICH_PX = 4
// Einrueckung des umlaufenden Strichs, damit er vollstaendig in der Zone liegt, in px.
const INNEN_VERSATZ_PX = 2

/**
 * Versatz in Prozent der Zonengroesse, begrenzt auf ±50 % (GESTALTUNG_GRENZEN).
 * Darueber staende die Bildkante in der Zonenmitte – sichtbarer Rand statt Ausschnitt.
 * Bildausschnitt UND Effekt kommen hier zusammen; die Summe darf nicht entkommen.
 */
function begrenzeVersatz(prozent: number): number {
  return Math.min(50, Math.max(-50, prozent))
}

export function zeichneBildZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  motiv: Motiv,
  marke: Marke,
  aktion: AktionsInhalt,
  zustand?: EffektZustand,
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

  // Effekte treffen NUR das Bild der Aktion, nie das Logo - dieselbe Regel wie beim
  // Bildausschnitt (05.11.2026: „die bildausschnitt regler koennen komische effekte auf
  // das logo haben"). Ein beschnittenes Logo ist ein Markenfehler.
  const wirkt = zone.bindung === 'bild' ? zustand : undefined

  ctx.save()

  // Bild-Reveal (09.11.2026, TK 9.16.3): Das Bild schiebt sich von RECHTS herein -
  // sichtbar ist ein Streifen an der rechten Kante, der nach links waechst. Der
  // Beschnitt sitzt VOR dem Zeichnen, damit auch der Platzhalter ihn traegt.
  if (wirkt !== undefined && wirkt.revealAnteil < 1) {
    const anteil = Math.min(1, Math.max(0, wirkt.revealAnteil))
    const rb = zone.rahmen.breite
    ctx.beginPath()
    ctx.rect(zone.rahmen.x + rb * (1 - anteil), zone.rahmen.y, rb * anteil, zone.rahmen.höhe)
    ctx.clip()
  }

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

  // Glanz-Sweep (09.11.2026, TK 9.16.3): eine helle Bahn zieht EINMAL ueber das Bild.
  // Nur ueber dem Motiv - ueber dem Platzhalter waere sie eine Defektanzeige.
  if (zeichnung === 'motiv' && wirkt !== undefined && wirkt.glanzFortschritt !== null) {
    const x = zone.rahmen.x
    const y = zone.rahmen.y
    const rb = zone.rahmen.breite
    const rh = zone.rahmen.höhe
    const t = wirkt.glanzFortschritt
    const bahn = rb * 0.25
    const kipp = rh * 0.36 // 20 Grad
    const mitte = x - bahn + (rb + 2 * bahn) * t
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, rb, rh)
    ctx.clip()
    // Maximal 35 % (Anforderungsdokument 4.10); an den Enden 0, damit der Wechsel
    // unsichtbar beginnt und endet.
    ctx.globalAlpha = 0.35 * Math.sin(Math.PI * t)
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(mitte, y)
    ctx.lineTo(mitte + bahn, y)
    ctx.lineTo(mitte + bahn - kipp, y + rh)
    ctx.lineTo(mitte - kipp, y + rh)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
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

    // SEIT 05.11.2026: Zoom und Position (TK 9.8.8) - NUR fuer das BILD DER AKTION.
    //
    // WARUM DIE BINDUNG GEPRUEFT WIRD (Niklas, 05.11.2026: „die bildausschnitt regler
    // können komische effekte auf das logo haben"): Der Zoom gilt dem Motiv, das die
    // Aktion mitbringt. Er darf NICHT das Logo treffen - das ist ein Markenzeichen und
    // sitzt in seiner eigenen Zone. Ein beschnittenes oder verschobenes Logo ist ein
    // Markenfehler, kein Gestaltungswunsch.
    const zoom = zoomFaktor(aktion.bildAusschnitt?.zoom) * ((wirkt?.zoomBild ?? 100) / 100)
    const versatzX = begrenzeVersatz(
      versatzProzent(aktion.bildAusschnitt?.versatzX) + (wirkt?.versatzBildX ?? 0),
    )
    const versatzY = begrenzeVersatz(
      versatzProzent(aktion.bildAusschnitt?.versatzY) + (wirkt?.versatzBildY ?? 0),
    )
    const eigenerAusschnitt =
      zone.bindung === 'bild' && (zoom !== 1 || versatzX !== 0 || versatzY !== 0)

    if (eigenerAusschnitt) {
      zeichneMitAusschnitt(einpassung, zoom, versatzX, versatzY)
      return
    }

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

  /**
   * Der Weg MIT eigenem Ausschnitt: das Bild wird als Ganzes in ein Zielrechteck
   * gezeichnet und auf die Zone BESCHNITTEN.
   *
   * WARUM HIER EIN BESCHNITT NOETIG IST, obwohl der Kopf dieser Datei "cover ohne clip"
   * sagt: Zoom > 100 macht das Bild groesser als die Zone, und ein Versatz schiebt es
   * zur Seite. Ohne Beschnitt liefe es in die Nachbarzone - bei „Zwei Spalten" in die
   * Textspalte. Der alte Satz gilt weiterhin fuer den UNVERAENDERTEN Fall (oben), weil
   * dort das Zielrechteck genau die Zone ist.
   *
   * Die Skalierung ist dieselbe wie oben (cover: Maximum, contain: Minimum) mal Zoom.
   * Damit ist „Zoom 100, kein Versatz" dasselbe Bild wie der unveraenderte Weg - der
   * Unterschied ist allein der Beschnitt, der dort nichts abschneidet.
   */
  function zeichneMitAusschnitt(
    einpassung: 'contain' | 'cover',
    zoom: number,
    versatzX: number,
    versatzY: number,
  ): void {
    if (motiv.zustand !== 'geladen') {
      return
    }
    const iw = motiv.breite
    const ih = motiv.höhe
    const x = zone.rahmen.x
    const y = zone.rahmen.y
    const rb = zone.rahmen.breite
    const rh = zone.rahmen.höhe

    const basis = einpassung === 'cover' ? Math.max(rb / iw, rh / ih) : Math.min(rb / iw, rh / ih)
    const skala = basis * zoom
    const zielBreite = iw * skala
    const zielHöhe = ih * skala
    // Der Versatz ist in PROZENT DER ZONENGROESSE angegeben, nicht in Pixeln: derselbe
    // Reglerwert soll in einer 960 breiten Spalte und im Vollbild gleich weit wirken.
    const zielX = x + (rb - zielBreite) / 2 + (versatzX / 100) * rb
    const zielY = y + (rh - zielHöhe) / 2 + (versatzY / 100) * rh

    ctx.beginPath()
    ctx.rect(x, y, rb, rh)
    ctx.clip()
    try {
      ctx.drawImage(motiv.bild, zielX, zielY, zielBreite, zielHöhe)
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
