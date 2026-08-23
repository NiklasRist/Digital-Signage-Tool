// [template-canvas] Die Zeichenroutine: aus Aktion, Vorlage und Marke ein Segmentbild
// (#117, M4-23).
//
// DIE EINZIGE PIXELQUELLE DES SYSTEMS (TK 9.10.1): ein synchroner Aufruf, ein Canvas in
// der nativen Flaeche der Vorlagenart - dasselbe Bild fuer Live-Vorschau, Thumbnail,
// preview-player und (ueber alsPng, #118) den finalen Render.
//
// Verbindliche Festlegungen dieses Baus:
// - SYNCHRON: keiner der drei asynchronen Mechanismen (Funktionsschluesselwort,
//   Wartebefehl, Promise), kein Laden, kein document.fonts.ready.
//   Alles Asynchrone ist VORHER erledigt (#110/#111/#119); hier wird nur geprueft und
//   gezeichnet. Zeichnen mit Fallback-Schrift ist ein Vertragsbruch (TK 9.10.3 Punkt 3)
//   -> Ablauf-Punkt 0 wirft, bevor ein Canvas entsteht.
// - Keine Geraete-Pixel-Abfrage, keine Anzeige-Stile am Canvas, kein Anhaengen ins
//   Dokument, kein Cache, kein Umlayouten, keine zweite verkleinerte Variante (kein
//   zweiter Zeichenpfad).
// - Die beiden Profil-Zahlen werden NICHT hingeschrieben; sie kommen aus
//   RENDER_PROFILE (#18). Das
//   Feld dort heisst `hoehe` OHNE Umlaut, im SegmentBild `höhe` MIT - beide Namen sind
//   anderswo festgeschrieben und werden nicht angleicht.
// - Die AKZENT-ERSETZUNG (TK 9.10.9) sitzt AUSSCHLIESSLICH in loeseFarbe (#112): Diese
//   Datei liest das Akzent-Feld der Aktion NICHT und reicht die Aktion an ALLE Zonenfunktionen
//   und an loeseFarbe durch - dieselbe Objektreferenz, keine Kopie, keine Ausnahme.
// - KEINE Paritaetspruefung der Bandhoehe (ENTSCHIEDEN, TK v3.0/v3.9): Eine ungerade
//   Hoehe ist zeichenbar; gesperrt wird sie im Editor (#148), im Store
//   (#100/#102/#103) und im render-service (9.2.3) - nicht hier, sonst braeche die
//   Live-Vorschau des Editors bei jeder Höheneingabe.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

import { zeichneDekoZone } from './zone-deko'
import { zeichneTextZone } from './zone-text'
import { zeichneBildZone } from './zone-bild'
import { holeMotiv } from './bild-laden'
import { holeLogo } from './logo-laden'
import { sindSchriftenBereit } from './schriften'
import { loeseFarbe } from './farben'

export interface SegmentBild {
  canvas: HTMLCanvasElement
  breite: number
  höhe: number
}

export function zeichneSegment(aktion: Aktion, vorlage: Vorlage, marke: Marke): SegmentBild {
  // 0. Zuallererst: Sind die Schriften da? Vor jedem Canvas, vor jedem Strich.
    if (!sindSchriftenBereit()) {
      throw new Error(
        'zeichneSegment: Die gebündelten Marken-Schriften sind nicht bereit ' +
          '(stelleSchriftenBereit vor dem Aufruf, #110/#117).',
      )
    }

  // 1. Die Fläche bestimmen (TK 9.10.2) - Endlichkeit und Wertebereich, bewusst OHNE
  //    Paritätsprüfung (ENTSCHIEDEN-Block im Kopf dieser Datei).
  const bandHoehe = vorlage.höhe
  if (
    (vorlage.art === 'split' || vorlage.art === 'einblendung') &&
    (typeof bandHoehe !== 'number' ||
      !Number.isFinite(bandHoehe) ||
      bandHoehe <= 0 ||
      bandHoehe >= RENDER_PROFILE.hoehe)
  ) {
    throw new Error(
      `zeichneSegment: Defekte Vorlage "${vorlage.id}" - Bandhoehe ${String(vorlage.höhe)} ` +
        'ist unbrauchbar (erwartet endliche Zahl > 0 und < ' +
        String(RENDER_PROFILE.hoehe) + ').',
    )
  }

  const breite = RENDER_PROFILE.breite
  const hoehe =
    vorlage.art === 'vollflaeche' ? RENDER_PROFILE.hoehe : (bandHoehe as number)

  // 2. Das Canvas erzeugen - natives Backing, nichts Anzeige-bezogenes.
  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('zeichneSegment: getContext("2d") liefert null - kein Bild moeglich.')
  }

  // 3. Die Grundflaeche setzen (TK 9.10.2): vollflaeche/split deckend in flaecheDunkel,
  //    einblendung durchsichtig. Farbe ausschliesslich ueber loeseFarbe (#112) - die
  //    Aktion wird mitgegeben, obwohl flaecheDunkel keine Akzent-Rolle ist: eine
  //    "Abkuerzung" an dieser Stelle waere der zweite Aufloesungsweg.
  if (vorlage.art !== 'einblendung') {
    ctx.fillStyle = loeseFarbe(marke, 'flaecheDunkel', aktion)
    ctx.fillRect(0, 0, breite, hoehe)
  }

  // 4. Ueber die Zonen laufen - Array-Reihenfolge, kein Sortieren/Filtern/Ueberspringen.
  for (const zone of vorlage.zonen) {
    // a. Den gebundenen Wert bestimmen - ausschliesslich nach dieser Tabelle. Logo und
    //    Slogan kommen aus der MARKE (fester Markenrahmen, FA-11). Der Wert von `logo`
    //    dient nur der Leer-Pruefung; das Motiv kommt ueber holeLogo(), nie ueber
    //    holeMotiv (zwei getrennte Bildquellen, #111/#119).
    let wert: string | null | undefined
    switch (zone.bindung) {
      case 'titel':
        wert = aktion.titel
        break
      case 'beschreibung':
        wert = aktion.beschreibung
        break
      case 'preis':
        wert = aktion.preis
        break
      case 'cta':
        wert = aktion.cta
        break
      case 'bild':
        wert = aktion.bildRef
        break
      case 'logo':
        wert = marke.logo?.datei ?? null
        break
      case 'slogan':
        wert = marke.slogan.aktiv ? marke.slogan.text : null
        break
      default:
        // Unbekannte Bindung: wie bindung null behandeln (nur Dekoration), nicht raten.
        wert = undefined
    }

    // b. Leer-Pruefung: nur Zonen MIT Bindung.
    const leer =
      zone.bindung !== null &&
      (wert === null || wert === undefined || String(wert).trim() === '')

    // c. Leer und 'ausblenden': die GANZE Zone ueberspringen, Deko inklusive.
    if (leer && zone.wennLeer === 'ausblenden') {
      continue
    }

    // d. Dekoration - immer, auch ohne zone.deko und auch bei leer + 'leer'.
    zeichneDekoZone(ctx, zone, marke, aktion)

    // e. Ohne Bindung (oder leer) ist die Zone hier fertig.
    if (zone.bindung === null || leer || wert === undefined) {
      continue
    }

    // f. Den Inhalt zeichnen - die Art entscheidet die Bindung.
    if (zone.bindung === 'bild') {
      zeichneBildZone(ctx, zone, holeMotiv(aktion.bildRef as string), marke, aktion)
    } else if (zone.bindung === 'logo') {
      // GEMELDETER WIDERSPRUCH (#117 vs. gebauter Code): Der Issue-Text von #117 nennt
      // holeLogo() OHNE Argument - seit dem Edit an #119/#315 ist es holeLogo(markeId).
      // Die Umstellung des Arguments gehoert laut #294 ausdruecklich in DIESE Datei;
      // der gebaute Code gewinnt.
      zeichneBildZone(ctx, zone, holeLogo(marke.id), marke, aktion)
    } else {
      zeichneTextZone(ctx, zone, String(wert), marke, aktion)
    }
  }

  // 5. Ein Canvas plus seine native Flaeche - keine Bytes (die entstehen in alsPng, #118).
  return { canvas, breite, höhe: hoehe }
}
