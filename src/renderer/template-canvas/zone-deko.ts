// [template-canvas] Eine dekorative Zone zeichnen
//
// WARUM ES DIESE FUNKTION GIBT: Sie ist der Grund, warum eigene Vorlagen (FA-13)
// ein reiner Datensatz bleiben koennen. Alles Gestaltbare hier - Flaeche, Pille,
// Verlauf, fester Text - entsteht aus vier Feldern des Zonen-Modells. Eine Zeile
// hart verdrahtetes Layout ("die Preis-Pille ist immer rot mit Radius 40") wuerde
// FA-13 brechen: Jede Gestaltungsidee braeuchte wieder Code, und ein Marken-Wechsel
// waere keine Datenaenderung mehr.
//
// REGELN (alle issue-gebunden):
//   - Wirft NIEMALS: Sie laeuft in einer Schleife ueber alle Zonen (#117); eine
//     Ausnahme liesse das ganze Segment leer. Jeder loeseFarbe-Aufruf ist gefangen;
//     faellt er aus, fehlt GENAU der betroffene Teilschritt - keine Ersatzfarbe,
//     kein Schwarz, kein Magenta. restore() laeuft trotzdem.
//   - Farben NUR ueber loeseFarbe (#112), die Aktion wird als DRITTES Argument
//     durchgereicht - bei der Fuellung UND bei beiden Verlaufs Stoppen:
//     "Auch deko.verlauf (vonFarbRolle/bisFarbRolle) laeuft durch dieselbe
//     Funktion." (TK 9.10.9) Der Verlauf ist kein Sonderfall und diese Datei
//     liest aktion.akzentfarbe NICHT selbst.
//   - Statischer Text geht AUSSNAHMSLOS durch zeichneTextZone (#114): kein eigenes
//     fillText, kein eigener Umbrauch - sonst waere das der zweite Zeichenpfad,
//     den TK 9.10.1 verbietet. Gebundene Zonen (bindung !== null) ignorieren
//     ihn: der gebundene Wert gewinnt, #117 zeichnet ihn ohnehin gleich danach.
//   - Der Radius ist eine PIXELZAHL aus der Vorlage (TK 9.11.1 Punkt 7 macht nur
//     Farben und Schriften zu Rollen-Verweisen); die Marken-Radien werden hier NICHT
//     gelesen. Die Deckelung auf min(breite, hoehe)/2 greift bei echten Werten
//     nicht (Band-Preis: min(240,72)/2=36 > 40 -> gedeckelt auf 36 = Pillenform;
//     Vollbild-Preis: 75 > 40 -> bleibt 40).
//   - Der Verlauf liegt UEBER einer eventuellen Fuellung (zweiter fill-Aufruf) -
//     er ist eine Abschattung, keine Alternative zu ihr.
//   - Der Schattenzustand wird neutralisiert, bevor die erste Form entsteht:
//     dekorative Flaeche bekommt KEINEN Schatten (kein Feld des Zonen-Modells
//     verlangt einen; marke.schatten ist hier nicht zu deuten - gemeldet im Issue).
//   - Verlaufskoordinaten sind ABSOLUTE Canvas-Kante (der Zonenrahmen), nicht
//     0,0,breite,hoehe: Ein Verlauf ist an den Raum gebunden, nicht an die Form.

import type { Zone, VerlaufRichtung } from '../../shared/contracts/vorlage'
import type { FarbRolle, Marke } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'

import { loeseFarbe } from './farben'
import { zeichneTextZone } from './zone-text'

export function zeichneDekoZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  marke: Marke,
  aktion: Aktion,
): void {
  // SCHRITT 1 - kein deko: sofort zurueck, ohne save/restore.
  if (!zone.deko) {
    return
  }

  // Eine Zone ohne Flaeche kann nichts tragen - auch nicht dekorativ.
  if (
    !Number.isFinite(zone.rahmen.breite) ||
    !Number.isFinite(zone.rahmen.höhe) ||
    zone.rahmen.breite <= 0 ||
    zone.rahmen.höhe <= 0
  ) {
    return
  }

  ctx.save()

  // SCHRITT 3 - Schatten neutralisieren, BEVOR die erste Form entsteht. Ein von
  // aussen hereingereichter Schattenzustand darf nicht durchschlagen.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  const rahmen = zone.rahmen
  const deko = zone.deko

  // Radius nur bei endlicher Zahl > 0; sonst rechteckig.
  const radius =
    typeof deko.radius === 'number' && Number.isFinite(deko.radius) && deko.radius > 0
      ? deko.radius
      : undefined

  // SCHRITT 4 - Fuellung. Faellt loeseFarbe aus, fehlt GENAU die Fuellung.
  if (deko.füllungFarbRolle !== undefined) {
    ctx.beginPath()
    baueZonenPfad(ctx, rahmen, radius)
    try {
      ctx.fillStyle = loeseFarbe(marke, deko.füllungFarbRolle, aktion)
      ctx.fill()
    } catch {
      // Teilschritt uebersprungen - keine Ersatzfarbe.
    }
  }

  // SCHRITT 5 - Verlauf UEBER der Fuellung. Wirft EINE der beiden Aufloesungen,
  // faellt der GANZE Verlauf aus (ein geratenes Stopp waere schlimmer als keiner).
  if (deko.verlauf !== undefined) {
    ctx.beginPath()
    baueZonenPfad(ctx, rahmen, radius)
    try {
      const verlauf = baueVerlauf(ctx, deko.verlauf.vonFarbRolle, deko.verlauf.bisFarbRolle, deko.verlauf.richtung, rahmen, marke, aktion)
      ctx.fillStyle = verlauf
      ctx.fill()
    } catch {
      // Ganzer Verlauf uebersprungen.
    }
  }

  // SCHRITT 8 - statischer Text nur ohne Bindung, und AUSSCHLIESSLICH ueber #114.
  if (
    deko.statischerText !== undefined &&
    deko.statischerText !== '' &&
    zone.bindung === null
  ) {
    zeichneTextZone(ctx, zone, deko.statischerText, marke, aktion)
  }

  ctx.restore()
}

/** Der Zonenpfad: mit Radius gerundet (gedeckelt), sonst rechteckig.
 *  Steht roundRect nicht zur Verfuegung, faellt der Wurf HIER - und Zone wird
 *  rechteckig gefuellt (Fehlerpfad-Tabelle des Issues): Die Flaeche ist wichtiger
 *  als die Ecke. */
function baueZonenPfad(
  ctx: CanvasRenderingContext2D,
  rahmen: Zone['rahmen'],
  radius: number | undefined,
): void {
  if (radius !== undefined) {
    // Die Deckelung ist zwingend: Band-Preis-Zone 240x72 mit radius 40 waere sonst
    // keine definierte Form; gedeckelt auf 36 entsteht die Pille.
    const gedeckelt = Math.min(radius, Math.min(rahmen.breite, rahmen.höhe) / 2)
    try {
      ctx.roundRect(rahmen.x, rahmen.y, rahmen.breite, rahmen.höhe, gedeckelt)
      return
    } catch {
      // Rechteckiger Rueckfall - die Ausnahme verlaesst die Funktion nicht.
    }
  }
  ctx.rect(rahmen.x, rahmen.y, rahmen.breite, rahmen.höhe)
}

/** Der Verlauf - Richtung benennt, WOHIIN er laeuft; "von" liegt an der Gegenkante. */
function baueVerlauf(
  ctx: CanvasRenderingContext2D,
  vonRolle: FarbRolle,
  bisRolle: FarbRolle,
  richtung: VerlaufRichtung,
  rahmen: Zone['rahmen'],
  marke: Marke,
  aktion: Aktion,
): CanvasGradient {
  // Die Tabelle ist an den echten scrim-Daten geprueft (Vollbild 0,432,1920,648,
  // richtung unten -> oben durchsichtig, unten dunkel); sie wird nicht umgedeutet.
  const koordinaten: Record<VerlaufRichtung, [number, number, number, number]> = {
    unten: [rahmen.x, rahmen.y, rahmen.x, rahmen.y + rahmen.höhe],
    oben: [rahmen.x, rahmen.y + rahmen.höhe, rahmen.x, rahmen.y],
    rechts: [rahmen.x, rahmen.y, rahmen.x + rahmen.breite, rahmen.y],
    links: [rahmen.x + rahmen.breite, rahmen.y, rahmen.x, rahmen.y],
  }
  const [x0, y0, x1, y1] = koordinaten[richtung]
  const verlauf = ctx.createLinearGradient(x0, y0, x1, y1)
  // Beide Aufloesungen laufen durch loeseFarbe - auch der Verlauf ist kein
  // Sonderfall. Wirft eine der beiden, bricht der AUFRUF mit; der Aufrufende
  // (zeichneDekoZone) faengt und fuellt den Verlauf nicht dezent nach.
  verlauf.addColorStop(0, loeseFarbe(marke, vonRolle, aktion))
  verlauf.addColorStop(1, loeseFarbe(marke, bisRolle, aktion))
  return verlauf
}
