// GENERIERT aus dem Signaturblock von Issue #117.
// [template-canvas] Die Zeichenroutine: aus Aktion, Vorlage und Marke ein Segmentbild
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf: gefuellt (Issue #117); die
// GERUEST-PRUEFSUMME gilt deswegen nicht mehr - ihr Nichtmehrstimmen IST das
// Signal, die Datei wurde bearbeitet.
//
// ============================================== ====
// DIE EINZIGE PIXELQUELLE DES SYSTEMS. Vier Verbraucher (Live-Vorschau des
// action-editor, Thumbnails, preview-player, Segment-PNG des Renders) haengen an
// DIESEM einen Aufruf; die zugesagte Pixelgleichheit bleibt strukturell garantiert,
// solange dieser Aufruf der einzige Zeichenpfad bleibt (TK 9.10.1).
//
// REGELN (alle verbindlich, aus dem Issue):
//  - SYNCHRON: kein async/await/Promise, nichts wird geladen - Schriften sind
//    bereit (#110), Motive dekodiert (#111), das Logo bereit (#119); das Warten
//    geschiht VOR diesem Aufruf (Ablaufschritt 0).
//  - Determinismus: kein devicePixelRatio, kein Math.random/Date/performance,
//    kein Cache, nativ Backing; die Anzeige skaliert per CSS (Aufrufer).
//  - EIN Canvas, genau einmal gezeichnet; keine Thumbnail-Variante, kein zweiter
//    Durchlauf fuer den Export (TK 9.10.3, Punkt 6).
//  - Flaeche aus RENDER_PROFILE (#18): vollflaeche -> breite x hoehe des Profils;
//    split/einblendung -> RENDER_PROFILE.breite x vorlage.hoehe mit
//    Endlichkeit + Bereich, aber OHNE Paritaetspruefung (entschieden):
//    Eine ungerade Bandhoehe wird gezeichnet - ein Wurf hier wuerde die Live-
//    Vorschau des Vorlagen-Editors bei jedem zweiten Tastendruck abschalten.
//    Die Sperre sitzt in #148 (Editor) und #100/#102/#103 (Store), ergaenzend im
//    render-service; diese Datei ist die Pixelquelle, nicht die Validierung.
//  - Grundflaeche vorfuellen: vollflaeche/split -> loeseFarbe('flaecheDunkel'),
//    damit eine eigene Vorlage ohne hintergrund-Zone beim Kodieren nicht SCHWARZ
//    wird; einblendung -> NICHT vorfuellen (das Band liegt MIT Alpha ueber dem
//    Video, der Alphakanal traget die Uebergabe).
//  - Zonen in Array-Reihenfolge, KEIN Umordnen, kein Umlayout. wennLeer:
//    'ausblenden' -> die GANZE Zone entfaellt (inkl. Deko); 'leer' -> nur der
//    Inhalt faellt aus, die Deko bleibt (die Preis-Pille bleibt ohne Text stehen).
//  - Bindungstabelle aus 9.11.1; logo/slogan kommen aus der MARKE (FA-11, der
//    feste Markenrahmen), nicht aus der Aktion. Die BILDKELLEN sind GETRENNT:
//    holeMotiv bekommt NUR die Projekt-Asset-ID (aktion.bildRef); holeLogo wird
//    OHNE Argument gerufen. marke.logo.datei dient NUR der Leer-Pruefung - ueber
//    holeMotiv faende es sich nie im Bestand, statt des Logos stuende der
//    Platzhalter in jedem Segment.
//  - Die Akzent-Ersetzung sitzt in #112 und NIRGENDS sonst (TK 9.10.9): Diese
//    Datei liest aktion.akzentfarbe NICHT; die Aktion reist (dieselbe Referenz)
//    an alle drei Zonen-Funktionen UND an loeseFarbe - auch bei flaecheDunkel,
//    wo sie sicher keine Akzent-Rolle betrifft; eine "Abkuerzung" an einem
//    einzigen Aufruf waere der zweite Aufloesungsweg.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { loeseFarbe } from './farben'
import { holeMotiv } from './bild-laden'
import { holeLogo } from './logo-laden'
import { sindSchriftenBereit } from './schriften'
import { zeichneTextZone } from './zone-text'
import { zeichneBildZone } from './zone-bild'
import { zeichneDekoZone } from './zone-deko'

export interface SegmentBild {
  canvas: HTMLCanvasElement
  breite: number
  höhe: number
}

export function zeichneSegment(aktion: Aktion, vorlage: Vorlage, marke: Marke): SegmentBild {
  // SCHRITT 0 - Schriften bereit? Ein Segment mit Fallback-Schrift sieht gueltig
  // aus und misst andere Textbreiten: der laute Drift, den TK 9.10.3 Punkt 3
  // verhindert. VOR dem Canvas - es entsteht hier sonst eins auf Vertrauensbasis.
  if (!sindSchriftenBereit()) {
    throw new Error('Die gebündelten Marken-Schriften sind nicht bereit (stelleSchriftenBereit ist vor dem Aufruf zu rufen).')
  }

  // SCHRITT 1 - die Flaeche der Vorlagenart (Endlichkeit + Bereich; KEINE
  // Paritaetspruefung, s. oben).
  let hoehe: number
  if (vorlage.art === 'vollflaeche') {
    hoehe = RENDER_PROFILE.hoehe
  } else {
    const band = vorlage.höhe
    if (
      typeof band !== 'number' ||
      !Number.isFinite(band) ||
      band <= 0 ||
      band >= RENDER_PROFILE.hoehe
    ) {
      throw new Error(
        `Vorlage "${vorlage.id}" (art ${vorlage.art}) trägt eine unbrauchbare Bandhöhe ` +
          `${String(band)} - endliche Zahl größer 0 und kleiner ${RENDER_PROFILE.hoehe} erwartet.`,
      )
    }
    hoehe = band
  }
  const breite = RENDER_PROFILE.breite

  // SCHRITT 2 - das Canvas: native Backing-Größe, NICHT ins Dokument gehaengt;
  // getContext mit GENAU EINEM Argument (ein Options-Objekt wuerde den Alphakanal
  // der einblendung abwandern lassen).
  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('canvas.getContext("2d") liefert null - ohne Kontext gibt es kein Bild.')
  }

  // SCHRITT 3 - die Grundflaeche. Die Farbe geht NUR ueber loeseFarbe (#112), mit
  // der Aktion als drittem Argument (auch hier: keine Abkuerzung). Kein try/catch:
  // flaecheDunkel ist im Marke-Typ zugesichert; wirft er trotzdem, ist die Marke
  // kaputt - derselbe Zustand, wie täusche ein fehlender Kontext, wuerde werfen.
  if (vorlage.art === 'vollflaeche' || vorlage.art === 'split') {
    ctx.fillStyle = loeseFarbe(marke, 'flaecheDunkel', aktion)
    ctx.fillRect(0, 0, breite, hoehe)
  }

  // SCHRITT 4 - Zonen in Array-Reihenfolge; kein Umordnen, kein Umlayout.
  for (const zone of vorlage.zonen) {
    // (e) ohne Bindung: nur die Dekoration - zeichneDekoZone zeichnet ggf. den
    // statischen Text selbst und faellt ohne deko sofort zurueck.
    if (zone.bindung === null) {
      zeichneDekoZone(ctx, zone, marke, aktion)
      continue
    }

    // Unbekannte Bindung: wie keine behandeln (nur Deko) - NICHT raten.
    // (a+b) der gebundene Wert und die Leer-Pruefung immer nach der Tabelle.
    let wert: string | null
    let art: 'text' | 'bild' | 'logo'
    switch (zone.bindung) {
      case 'titel':
        wert = aktion.titel
        art = 'text'
        break
      case 'beschreibung':
        wert = aktion.beschreibung
        art = 'text'
        break
      case 'preis':
        wert = aktion.preis
        art = 'text'
        break
      case 'cta':
        wert = aktion.cta
        art = 'text'
        break
      case 'slogan':
        wert = marke.slogan.aktiv ? marke.slogan.text : null
        art = 'text'
        break
      case 'bild':
        wert = aktion.bildRef
        art = 'bild'
        break
      case 'logo':
        // Nur fuer die Leer-Pruefung herangezogen; das eigentliche Logo entstammt
        // dem Bundle (holeLogo), nicht dem Projektbestand.
        wert = marke.logo.datei
        art = 'logo'
        break
      default:
        zeichneDekoZone(ctx, zone, marke, aktion)
        continue
    }

    const leer = wert === null || wert === undefined || String(wert).trim().length === 0

    // (c+d) ausblenden zieht die GANZE Zone (inkl. Deko); leer laesst die Flaeche.
    if (leer && zone.wennLeer === 'ausblenden') {
      continue
    }
    zeichneDekoZone(ctx, zone, marke, aktion)
    if (leer) {
      continue
    }

    // (f) die Art entscheidet die BINDUNG, nicht die vorhandenen Zonen-Parameter.
    if (art === 'bild') {
      // bildRef ist hier sicher ein String (die Leer-Pruefung ist gelaufen);
      // der Schluessel geht UNVERAENDERT - exact die ASSET-ID.
      zeichneBildZone(ctx, zone, holeMotiv(String(wert)), marke, aktion)
    } else if (art === 'logo') {
      zeichneBildZone(ctx, zone, holeLogo(), marke, aktion)
    } else {
      zeichneTextZone(ctx, zone, String(wert), marke, aktion)
    }
  }

  // SCHRITT 5 - { canvas, breite, hoehe }; dieselben Zahlen wie am Canvas, damit
  // der Aufrufer die native Flaeche ohne DOM-Nachsehen kennt.
  return { canvas, breite, höhe: hoehe }
}
