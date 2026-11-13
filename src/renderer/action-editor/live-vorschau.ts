// [action-editor] Live-Vorschau der Aktion - bereitstellen, zeichnen, einhaengen
//
// ZWEI eigentliche Aufgaben in einer Datei:
//  - bereiteVorschauVor: Schriften (#110), Logo (#119) und ALLE Motive der
//    Bibliothek (#111) vorbereiten. Nicht nur die offene Aktion: holeMotiv ist
//    ein SYNCHRONER Nachschlag; ein nicht vorbereitetes Motiv liefert
//    { zustand: 'fehlt' } und wird als Platzhalter gezeichnet - ununterschiedlich
//    von einem echten Defekt (TK 9.8.5). Die Bibliothek ist klein genug,
//    dass das einmalig geschehen kann.
//  - zeichneVorschau: ein Weiterreichen, keine zweite Zeichenroutine: Sie ruft
//    zeichneSegment (#117) und gibt dessen Ergebnis UNVERAENDERT zurück - kein
//    eigener ctx-Aufruf, kein Übermalen, kein Zuschneiden, kein "nur für die
//    Vorschau"-Zusatz. Sie existiert NUR, damit der Editor eine benannte Stelle
//    hat, an der die Vorbereitungspflicht mit dem Zeichnen zusammenhängt.
//  - haengeVorschauEin: der EINZIGE Ort, der die Anzeigegröße bestimmt -
//    style.width/maxWidth/aspectRatio; die Skalierung überlässt dem Browser
//    ("Skalierung geschieht NUR zur Darstellung", CSS). canvas.width/height
//    bleiben NATIV (TK 9.10.3 Punkt 2).

import type { AktionsInhalt, BildAufbereitung } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { EffektZustand } from '../../shared/effekte'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { SegmentBild } from '../template-canvas/zeichne-segment'

import { stelleSchriftenBereit } from '../template-canvas/schriften'
import { bereiteLogoVor } from '../template-canvas/logo-laden'
import { bereiteMotiveVor } from '../template-canvas/bild-laden'
import type { MotivEintrag } from '../template-canvas/bild-laden'
import { findeBildAsset } from './bibliothek'
import { zeichneSegment } from '../template-canvas/zeichne-segment'

/** Einmalige Vorbereitung, BEVOR gezeichnet wird: Schriften, Logo und alle Motive der
 *  Aktions-Bibliothek. Danach ist zeichneVorschau synchron aufrufbar.
 *  Wirkungsgleich bei Mehrfachaufruf: ein zweiter Aufruf mit denselben Eingaben führt zum
 *  gleichen Bestand (#111 überschreibt vorhandene Schlüssel und lädt neu – NICHT idempotent im
 *  Sinne von „tut beim zweiten Mal nichts"). Nach einem Projektwechsel oder einem abgeschlossenen
 *  Import erneut aufrufen. */
export async function bereiteVorschauVor(
  projektId: string,
  aktionen: readonly AktionsInhalt[],
  assets: readonly Asset[],
  marke: Marke,
): Promise<void> {
  // 1. Schriften: idempotent in #110 (dort sitzt der Merker).
  await stelleSchriftenBereit()
  // 2. Logo: idempotent in #119, wirft nie wegen eines Ladefehlers.
  await bereiteLogoVor(marke)
  // 3. Die Motive der BIBLIOTHEK: je Aktion mit bildRef das aufgelöste Asset
  //    (findeBildAsset #135 - null bei 'fehlt' oder unbekannter Kennung);
  //    über bereiteMotiveVor (#111) landet jedes ladbares Motiv unter seinem
  //    ASSET-Schlüssel im Bestand. Nicht-ladbare werden dort als { zustand: 'fehlt' }
  //    abgelegt - der PlatzhalterFall, nicht die Panne.
  const eintraege: MotivEintrag[] = []
  for (const aktion of aktionen) {
    if (aktion.bildRef === null) {
      continue
    }
    const asset = findeBildAsset(aktion.bildRef, assets)
    if (asset === null) {
      continue
    }
    const eintrag: MotivEintrag = { bildRef: aktion.bildRef, dateiname: asset.dateiname }
    if (aktion.bildAufbereitung !== undefined && aktion.bildAufbereitung !== null) {
      eintrag.aufbereitung = aktion.bildAufbereitung
    }
    eintraege.push(eintrag)
  }
  await bereiteMotiveVor(projektId, eintraege)
}

/** Die Vorschau: EIN Aufruf von zeichneSegment, sonst nichts. Synchron. */
export function zeichneVorschau(
  aktion: AktionsInhalt,
  vorlage: Vorlage,
  marke: Marke,
  zustand?: EffektZustand,
): SegmentBild {
  // rahmenMarke === marke (TK v3.18 / M8-21): bis auf den Hintergrund einer
  // EinblendungRunWith gilt dieselbe Marke.
  return zeichneSegment(aktion, vorlage, marke, marke, zustand)
}

/**
 * Bereitet EIN Motiv des ENTWURFS vor (Entscheidung 03.11.2026).
 *
 * WARUM DAS NOETIG IST: `bereiteVorschauVor` laeuft ueber die GESPEICHERTEN Aktionen.
 * Im Modus „neu" gibt es keine - ein frisch gewaehltes Produktfoto waere also nicht
 * vorbereitet, und `holeMotiv` lieferte `{ zustand: 'fehlt' }`: Die Vorschau zeichnete
 * den Platzhalter statt des Bildes, obwohl der Nutzer es gerade ausgewaehlt hat.
 *
 * Wirft nicht bei fehlendem Asset - dann bleibt es beim Platzhalter (TK 9.8.5), genau
 * wie bei einer kaputten Referenz. Der Aufruf ist idempotent genug: `bereiteMotiveVor`
 * ueberschreibt einen vorhandenen Schluessel.
 */
export async function bereiteMotivVorFuer(
  projektId: string,
  bildRef: string | null,
  assets: readonly Asset[],
  aufbereitung?: BildAufbereitung | null,
): Promise<void> {
  if (bildRef === null) return
  const asset = findeBildAsset(bildRef, assets)
  if (asset === null) return
  await bereiteMotiveVor(projektId, [{ bildRef, dateiname: asset.dateiname, aufbereitung }])
}

/** Hängt das Canvas in ein Anzeigeelement und skaliert es AUSSCHLIESSLICH per CSS.
 *  Verändert canvas.width/canvas.height NIEMALS. */
export function haengeVorschauEin(ziel: HTMLElement, bild: SegmentBild): void {
  einhaengen(ziel, bild)
}

function einhaengen(ziel: HTMLElement, bild: SegmentBild): void {
  // Nicht verändern: width/height am Canvas bleiben die Nativ-Backing-Größen.
  // Skaliert wird NUR an der Anzeige (CSS), mit dem Seitenverhältnis als
  // Verhältnis-Schiene (aspectRatio), damit die zweitrangige Skalierung den
  // eingebauten Seitenverhältnis (1920 x 1080 oder Band) NICHT 
  bild.canvas.style.width = '100%'
  bild.canvas.style.maxWidth = '100%'
  bild.canvas.style.height = 'auto'
  bild.canvas.style.aspectRatio = `${bild.breite} / ${bild.höhe}`
  // ins Element einhaengen - kein zweiter Zeichnen-Aufruf.
  if (bild.canvas.parentElement !== ziel) {
    ziel.replaceChildren(bild.canvas)
  }
}
