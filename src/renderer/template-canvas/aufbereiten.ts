// [template-canvas] Die Bildaufbereitung rechnen (13.11.2026, FA-28 / TK 9.21)
//
// WARUM DIESE DATEI SO AUSSIEHT:
//
// 1. DIE RECHNUNG IST REIN. `wendeAufbereitungAn` bekommt Bytes und Maße und veraendert
//    sie an Ort und Stelle - kein Canvas, kein DOM, kein `Image`. Dadurch ist jeder Schritt
//    ohne Browser pruefbar (`tests/unit/aufbereiten.spec.ts`), und ein Test kann die
//    Vorschrift aus TK 9.21.4 Zeichen fuer Zeichen nachrechnen.
//
// 2. KEIN `ctx.filter`. Chromium rechnet `brightness()`/`contrast()` auf der GPU, wenn der
//    Canvas beschleunigt ist, und auf der CPU, wenn nicht. Zwei Backends duerfen nicht zwei
//    Bilder ergeben - die Vorschau und der Render laufen zwar durch dieselbe Routine
//    (9.10.1), aber sie koennen auf verschiedenen Canvases landen. Deshalb: EINE Rechnung
//    auf Bytes, immer dieselbe.
//
// 3. DIE REIHENFOLGE KOMMT AUS `shared/aufbereitung.ts` (`AUFBEREITUNG_SCHRITTE`) - hier
//    steht keine zweite Liste, die beim naechsten Schritt still danebenlaege.
//
// 4. ALPHA BLEIBT UNBERUEHRT. Ein Bild mit Transparenz (spaeter FA-29) darf durch
//    Helligkeit nicht an den Raendern ausfransen.

import { AUFBEREITUNG_SCHRITTE, normalisiereAufbereitung } from '../../shared/aufbereitung'
import { stelleFrei } from './freistellen'

import type { BildAufbereitung } from '../../shared/contracts/aktion'

/** Ein Kanalwert auf 0…255 begrenzen (Uint8ClampedArray klemmt beim Schreiben ohnehin). */
function klemme(wert: number): number {
  return wert < 0 ? 0 : wert > 255 ? 255 : Math.round(wert)
}

/** Schritt 1: Helligkeit. `h * 2.55` heisst: ±100 sind die vollen 255 Stufen (TK 9.21.4). */
function helligkeitAnwenden(daten: Uint8ClampedArray, h: number): void {
  const versatz = h * 2.55
  for (let i = 0; i < daten.length; i += 4) {
    daten[i] = klemme((daten[i] ?? 0) + versatz)
    daten[i + 1] = klemme((daten[i + 1] ?? 0) + versatz)
    daten[i + 2] = klemme((daten[i + 2] ?? 0) + versatz)
  }
}

/**
 * Schritt 2: Kontrast. `(v - 128) * (100 + k) / 100 + 128` (TK 9.21.4).
 * `k = -100` macht daraus eine Flaeche (Faktor 0), `k = +100` den doppelten Abstand zur
 * Mitte. Die 128 ist die Mitte des Wertebereichs, nicht „ein mittleres Grau" - sie ist
 * die Zahl, um die herum der Kontrast greift.
 */
function kontrastAnwenden(daten: Uint8ClampedArray, k: number): void {
  const faktor = (100 + k) / 100
  for (let i = 0; i < daten.length; i += 4) {
    daten[i] = klemme(((daten[i] ?? 0) - 128) * faktor + 128)
    daten[i + 1] = klemme(((daten[i + 1] ?? 0) - 128) * faktor + 128)
    daten[i + 2] = klemme(((daten[i + 2] ?? 0) - 128) * faktor + 128)
  }
}

/** Index eines Pixels mit Randwiederholung (Kanten zaehlen doppelt, nichts faellt weg). */
function indexMitRand(x: number, y: number, breite: number, hoehe: number): number {
  const xr = x < 0 ? 0 : x >= breite ? breite - 1 : x
  const yr = y < 0 ? 0 : y >= hoehe ? hoehe - 1 : y
  return (yr * breite + xr) * 4
}

/**
 * Schritt 3: Schaerfe als Unsharp-Mask (TK 9.21.4): `v + (s/100) * (v - unschaerfe(v))`,
 * `unschaerfe` ist das 3×3-Box-Mittel mit Radius 1 px.
 *
 * Der Radius ist FEST und kein Regler: Ein zweiter Parameter waere eine zweite
 * Entscheidung, die niemand getroffen hat. Die Kante wird wiederholt, damit das Bild
 * nicht an den Raendern dunkler wird als in der Mitte.
 */
function schaerfeAnwenden(
  daten: Uint8ClampedArray,
  breite: number,
  hoehe: number,
  s: number,
): void {
  const staerke = s / 100
  // Die Unschaerfe wird EINMAL gerechnet, nicht je Kanal und Pixel erneut: 9 Zugriffe
  // mal drei Kanaele waeren sonst 27 Zugriffe je Pixel, und die Zahlen waeren dieselben.
  const unschaerfe = new Uint8ClampedArray(daten.length)
  for (let y = 0; y < hoehe; y += 1) {
    for (let x = 0; x < breite; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const i = indexMitRand(x + dx, y + dy, breite, hoehe)
          r += daten[i] ?? 0
          g += daten[i + 1] ?? 0
          b += daten[i + 2] ?? 0
        }
      }
      const ziel = (y * breite + x) * 4
      unschaerfe[ziel] = Math.round(r / 9)
      unschaerfe[ziel + 1] = Math.round(g / 9)
      unschaerfe[ziel + 2] = Math.round(b / 9)
    }
  }
  for (let i = 0; i < daten.length; i += 4) {
    daten[i] = klemme((daten[i] ?? 0) + staerke * ((daten[i] ?? 0) - (unschaerfe[i] ?? 0)))
    daten[i + 1] = klemme(
      (daten[i + 1] ?? 0) + staerke * ((daten[i + 1] ?? 0) - (unschaerfe[i + 1] ?? 0)),
    )
    daten[i + 2] = klemme(
      (daten[i + 2] ?? 0) + staerke * ((daten[i + 2] ?? 0) - (unschaerfe[i + 2] ?? 0)),
    )
  }
}

/**
 * Rechnet die Aufbereitung auf RGBA-Bytes, an Ort und Stelle.
 *
 * `neutral` (alle Werte 0, fehlend oder unbrauchbar) heisst: **gar nichts** - kein
 * Durchlauf, kein Puffer, keine Gelegenheit fuer Rundungsunterschiede. Genau das ist die
 * Zusage „ohne Einstellungen byte-gleich zu vorher".
 *
 * Die Maße werden gebraucht, weil die Schärfe Nachbarn liest; ohne sie waere die Faltung
 * nicht definiert. (Die erste Fassung der Signatur im Issue liess sie weg - eine reine
 * Funktion ueber eine Pixelwand kann nicht wissen, wo eine Zeile endet.)
 */
export function wendeAufbereitungAn(
  daten: Uint8ClampedArray,
  breite: number,
  hoehe: number,
  aufbereitung: BildAufbereitung | null | undefined,
): void {
  const sauber = normalisiereAufbereitung(aufbereitung)
  if (sauber === null) return
  if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite <= 0 || hoehe <= 0) return
  if (daten.length !== breite * hoehe * 4) return

  for (const schritt of AUFBEREITUNG_SCHRITTE) {
    if (schritt === 'freistellen') {
      // HIER PASSIERT NICHTS, UND DAS IST ABSICHT: Der Schritt braucht ein Modell und ist
      // asynchron (FA-29, 9.21.5). Er laeuft in `bereiteAuf` VOR dieser Funktion; die
      // Reihenfolge steht trotzdem nur in `AUFBEREITUNG_SCHRITTE`. Ihn hier zu wiederholen,
      // hiesse zwei Rechenwege fuer dieselbe Zusage.
      continue
    }
    if (schritt === 'helligkeit') {
      const h = sauber.helligkeit
      if (typeof h === 'number') helligkeitAnwenden(daten, h)
    } else if (schritt === 'kontrast') {
      const k = sauber.kontrast
      if (typeof k === 'number') kontrastAnwenden(daten, k)
    } else if (schritt === 'schaerfe') {
      const s = sauber.schaerfe
      if (typeof s === 'number') schaerfeAnwenden(daten, breite, hoehe, s)
    }
  }
}

/**
 * Die Bruecke zum Bild: Pixel holen, rechnen, Bild zurueckgeben.
 *
 * Einmal je (Asset, Einstellungen) - NICHT je Frame (TK 9.21.4). Gibt `null` zurueck,
 * wenn die Umgebung das nicht kann (kein Offscreen-Canvas, kein `createImageBitmap`);
 * der Aufrufer behaelt dann das rohe Motiv, damit ein optionaler Regler kein Bild
 * verschwinden laesst.
 */
export async function bereiteAuf(
  quelle: CanvasImageSource,
  breite: number,
  hoehe: number,
  aufbereitung: BildAufbereitung | null | undefined,
  freistellen = false,
): Promise<ImageBitmap | null> {
  // NICHTS ZU TUN heisst: kein Durchlauf, kein Puffer, keine Gelegenheit fuer
  // Rundungsunterschiede (die Zusage aus 9.21.4). Nur `freistellen === true` weckt die
  // Rechnung auch ohne Tonwerte - sonst waere der Schalter wirkungslos.
  if (!freistellen && normalisiereAufbereitung(aufbereitung) === null) return null
  if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite <= 0 || hoehe <= 0) {
    return null
  }
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') {
    return null
  }
  try {
    // SCHRITT 1 DER REIHENFOLGE (9.21.4): Freistellen. Faellt es aus, wird das ROHE Bild
    // weiterverarbeitet - ein optionaler Schalter darf kein Bild verschwinden lassen
    // (9.21.5: „ein Ausfall ist ein Zustand"). Der Editor sperrt den Schalter dann selbst.
    let grundlage: CanvasImageSource = quelle
    if (freistellen) {
      const bitmap = await createImageBitmap(quelle)
      const frei = await stelleFrei(bitmap, breite, hoehe)
      bitmap.close()
      if (frei.status === 'ok') {
        grundlage = frei.bild
      } else if (normalisiereAufbereitung(aufbereitung) === null) {
        // NICHTS ZU TUN: Ohne Tonwerte war das Freistellen der EINZIGE Grund zu rechnen.
        // Jetzt noch eine zweite Kopie des rohen Bildes anzulegen, waere ein Puffer ohne
        // Wirkung - der Aufrufer legt das rohe Motiv unter demselben Schluessel ab
        // (9.21.5: „das Bild bleibt unfreigestellt"). `null` heisst genau das.
        return null
      }
    }

    const flaeche = new OffscreenCanvas(breite, hoehe)
    const zeichner = flaeche.getContext('2d')
    if (zeichner === null) return null
    zeichner.drawImage(grundlage, 0, 0, breite, hoehe)
    const bild = zeichner.getImageData(0, 0, breite, hoehe)
    // SCHRITTE 2 BIS 4: Helligkeit, Kontrast, Schaerfe. Die Schleife ueberspringt
    // `freistellen`, weil er oben schon gelaufen ist.
    wendeAufbereitungAn(bild.data, breite, hoehe, aufbereitung)
    zeichner.putImageData(bild, 0, 0)
    return await createImageBitmap(flaeche)
  } catch {
    // Kein Wurf nach aussen: Das Motiv bleibt in jedem Fall sichtbar.
    return null
  }
}
