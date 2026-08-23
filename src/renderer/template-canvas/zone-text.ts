// [template-canvas] Eine Textzone zeichnen (#114, M4-19).
//
// Ueber diese Funktion laeuft jeder Buchstabe, den das System je auf einen Fernseher
// bringt. Verbindliche Festlegungen:
// - Die AKZENT-ERSETZUNG (TK 9.10.9) sitzt ausschliesslich in loeseFarbe (#112): Diese
//   Datei nimmt die Aktion entgegen und reicht sie UNVERAENDERT als drittes Argument
//   durch; sie liest das Akzent-Feld nicht und kennt die Akzent-Rollen nicht.
// - Die Kaskade (TK 9.10.6: umbrechen -> verkleinern -> kuerzen) ist #113; hier wird
//   ihr Ergebnis NICHT nachgebaut und nicht abgewichen. Die Zeilenhoehe rechnet diese
//   Datei aus k.groesse * ZEILENHOEHE_FAKTOR (#113 ist die einzige Wahrheit ueber den
//   Faktor).
// - Diese Funktion wirft NIEMALS (sie laeuft in der Zonen-Schleife von #117; eine
//   Ausnahme liesse das ganze Segment leer). Deshalb fangen drei Aufrufe ab:
//   loeseSchrift, passeTextEin, loeseFarbe - im Abbruchfall kein Text, KEINE Ersatz-
//   schrift, KEINE Ersatzfarbe. Das restore() laeuft auf JEDEM Pfad.
// - Der Sicherheitsabstand wird hier NICHT abgezogen: Er steckt bereits in den
//   Rahmenwerten der Vorlage (x = 96 bis 1824 in den eingebauten).
// - fillText OHNE maxWidth-Argument: maxWidth staucht Glyphen horizontal - eine vierte,
//   nirgends vorgesehene Kaskaden-Stufe.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke, Schrift } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'

import { loeseFarbe, loeseSchrift } from './farben'
import { schriftKurzform } from './schriften'
import { ZEILENHOEHE_FAKTOR, passeTextEin } from './text-kaskade'

export function zeichneTextZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  text: string,
  marke: Marke,
  aktion: Aktion,
): void {
  // 1. Abbruchbedingungen - VOR jedem save(): fehlende Text-Parameter, leerer Text,
  //    unbrauchbarer Rahmen.
  const parameter = zone.text
  if (
    parameter === undefined ||
    typeof text !== 'string' ||
    text.trim() === '' ||
    !Number.isFinite(zone.rahmen.breite) ||
    !Number.isFinite(zone.rahmen.höhe) ||
    zone.rahmen.breite <= 0 ||
    zone.rahmen.höhe <= 0
  ) {
    return
  }

  // 2. save() als erste Anweisung; zu ihm gehoert genau EIN restore() auf jedem Pfad.
  ctx.save()

  try {
    // 3. Der Zonenrahmen als Beschnittbereich: Die Kaskade garantiert die Breite, aber
    //    nicht, dass maxZeilen x Zeilenhoehe in die Hoehe passt. Der Beschnitt macht
    //    denselben Fehler lokal sichtbar statt Text in Nachbarzonen zu malen.
    ctx.beginPath()
    ctx.rect(zone.rahmen.x, zone.rahmen.y, zone.rahmen.breite, zone.rahmen.höhe)
    ctx.clip()

    // 4. Schrift aufloesen - ohne Rolle kein Text, keine Ersatzschrift.
    let schrift: Schrift
    try {
      schrift = loeseSchrift(marke, parameter.schriftRolle)
    } catch {
      // Kein Text, KEINE Ersatzschrift/Farbe - das restore uebernimmt das finally.
      return
    }

    // 5. Der Messer misst auf DEMSELBEN Kontext, mit dem spaeter gezeichnet wird -
    //    ctx.font via schriftKurzform (#110), nie eine selbstgebaute Zeichenkette.
    const messeBreite = (t: string, größe: number): number => {
      ctx.font = schriftKurzform(schrift, größe)
      return ctx.measureText(t).width
    }
    let ergebnis
    try {
      ergebnis = passeTextEin(
        {
          text,
          breite: zone.rahmen.breite,
          höhe: zone.rahmen.höhe,
          größeMax: parameter.größeMax,
          größeMin: parameter.größeMin,
          maxZeilen: parameter.maxZeilen,
        },
        messeBreite,
      )
    } catch {
      // Kaputte Zonen-Parameter: kein Text, kein geratener Umbruch; restore im finally.
      return
    }

    // 6. Zeilenhoehe HIER rechnen - das Kaskadenergebnis traegt bewusst kein Feld dafuer.
    const zeilenhöhe = ergebnis.größe * ZEILENHOEHE_FAKTOR

    // 7. Endgueltige Kontext-Werte NACH der Kaskade setzen: Der Messer hat ctx.font
    //    zuletzt auf eine Probiergroesse gesetzt, nicht auf die gewaehlte.
    ctx.font = schriftKurzform(schrift, ergebnis.größe)
    try {
      ctx.fillStyle = loeseFarbe(marke, parameter.farbRolle, aktion)
    } catch {
      // Kein Text, KEINE Ersatzschrift/Farbe - das restore uebernimmt das finally.
      return
    }
    ctx.textBaseline = 'top'
    ctx.textAlign =
      zone.ausrichtung.horizontal === 'mitte'
        ? 'center'
        : zone.ausrichtung.horizontal === 'rechts'
          ? 'right'
          : 'left'
    // Text bekommt keinen Schatten: Das Zonen-Modell kennt kein Schattenfeld.
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // 8. x je horizontaler Ausrichtung.
    const x =
      zone.ausrichtung.horizontal === 'mitte'
        ? zone.rahmen.x + zone.rahmen.breite / 2
        : zone.ausrichtung.horizontal === 'rechts'
          ? zone.rahmen.x + zone.rahmen.breite
          : zone.rahmen.x

    // 9. y-Start je vertikaler Ausrichtung aus der Blockhoehe.
    const blockHöhe = ergebnis.zeilen.length * zeilenhöhe
    const yStart =
      zone.ausrichtung.vertikal === 'mitte'
        ? zone.rahmen.y + (zone.rahmen.höhe - blockHöhe) / 2
        : zone.ausrichtung.vertikal === 'unten'
          ? zone.rahmen.y + zone.rahmen.höhe - blockHöhe
          : zone.rahmen.y

    // 10. Zeile fuer Zeile - OHNE maxWidth (verzerrt die Typografie; Breite ist Sache
    //     von #113).
    for (let i = 0; i < ergebnis.zeilen.length; i++) {
      ctx.fillText(ergebnis.zeilen[i] ?? '', x, yStart + i * zeilenhöhe)
    }
  } finally {
    // 11. Auf JEDEM Pfad, der nach Schritt 2 endet.
    ctx.restore()
  }
}
