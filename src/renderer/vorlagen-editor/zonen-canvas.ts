// GENERIERT aus dem Signaturblock von Issue #144.
// [vorlagen-editor] Zonen auf dem Canvas ziehen, bemaßen und einrasten
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
// GERUEST-PRUEFSUMME: d48a0028d5c7bc7a
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Rahmen, Vorlage, Zone } from '../../shared/contracts/vorlage'
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Die native Zeichenfläche einer Vorlage (TK 9.10.2). */
export interface Flaeche {
  breite: number
  höhe: number
}

/** Kandidatenlinien zum Einrasten, getrennt nach Achse. Aufsteigend sortiert, ohne Dubletten. */
export interface Einrastlinien {
  x: number[]
  y: number[]
}

/** Anfasser einer Zone. Himmelsrichtungen; `n` = obere Kante, `se` = untere rechte Ecke. */
export type Griff = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const EINRAST_RASTER_PX = 8
export const EINRAST_TOLERANZ_PX = 6
export const MINDEST_ZONEN_KANTE_PX = 8

/** 1920 × 1080 bei `vollflaeche`, sonst 1920 × vorlage.höhe. */
export function flaecheDerVorlage(vorlage: Vorlage): Flaeche {
  if (vorlage.art === 'vollflaeche') {
    return { breite: RENDER_PROFILE.breite, höhe: RENDER_PROFILE.hoehe }
  }
  const bandHoehe = vorlage.höhe
  if (bandHoehe !== null && Number.isFinite(bandHoehe) && bandHoehe > 0) {
    return { breite: RENDER_PROFILE.breite, höhe: bandHoehe }
  }
  // Keine geratene Ersatzhoehe: Hoehe 0 laesst danach jede Pruefung (#148)
  // zuschlagen, statt ein Layout zu erlauben, das nie zu seiner echten Flaeche passt.
  return { breite: RENDER_PROFILE.breite, höhe: 0 }
}

/**
 * Der sichere Bereich IN KOORDINATEN DER VORLAGENFLÄCHE (nicht des Bildrahmens).
 * Kann bei sehr niedrigen Bändern die Breite/Höhe 0 haben – dann ist nichts sicher nutzbar.
 */
export function sicherheitsBox(vorlage: Vorlage): Rahmen {
  const horizontal = SICHERHEITSABSTAND_PX.horizontal
  const vertikal = SICHERHEITSABSTAND_PX.vertikal
  if (vorlage.art === 'vollflaeche') {
    return {
      x: horizontal,
      y: vertikal,
      breite: RENDER_PROFILE.breite - 2 * horizontal,
      höhe: RENDER_PROFILE.hoehe - 2 * vertikal,
    }
  }
  // Beim Band sitzt die Vorlagenflaeche am UNTEREN Rand des 1920x1080-Rahmens: die
  // unteren 54px des Rahmens liegen damit INNERHALB des Bandes und sind unbrauchbar.
  const bandHoehe = vorlage.höhe
  const h =
    bandHoehe !== null && Number.isFinite(bandHoehe) && bandHoehe > 0 ? bandHoehe : 0
  const obenUnsicher = Math.max(0, vertikal - (RENDER_PROFILE.hoehe - h))
  const untenSicherBis = h - vertikal
  return {
    x: horizontal,
    y: obenUnsicher,
    breite: RENDER_PROFILE.breite - 2 * horizontal,
    höhe: Math.max(0, untenSicherBis - obenUnsicher),
  }
}

/** Begrenzt einen Rahmen auf die Fläche, OHNE ihn zu verkleinern (verschiebt ihn hinein). */
export function begrenzeAufFlaeche(rahmen: Rahmen, flaeche: Flaeche): Rahmen {
  // Breite/Hoehe bleiben unveraendert - eine Zone, die unter der Hand kleiner
  // wird, ist fuer den Nutzer nicht nachvollziehbar; die Sperre meldet #148.
  return {
    x: klemme(rahmen.x, 0, Math.max(0, flaeche.breite - rahmen.breite)),
    y: klemme(rahmen.y, 0, Math.max(0, flaeche.höhe - rahmen.höhe)),
    breite: rahmen.breite,
    höhe: rahmen.höhe,
  }
}

/** Alle Kandidatenlinien: Flächenkanten, Sicherheitsbox, Kanten ALLER anderen Zonen. */
export function sammleEinrastlinien(vorlage: Vorlage, ausserZonenId: string): Einrastlinien {
  const flaeche = flaecheDerVorlage(vorlage)
  const box = sicherheitsBox(vorlage)
  const xLinien: number[] = [0, flaeche.breite, box.x, box.x + box.breite]
  const yLinien: number[] = [0, flaeche.höhe, box.y, box.y + box.höhe]
  for (const zone of vorlage.zonen) {
    // Auch feste Zonen liefern Linien: an Logo und Hintergrund soll sich
    // ausrichten lassen, obwohl sie nicht bewegt werden duerfen.
    if (zone.id === ausserZonenId) continue
    xLinien.push(zone.rahmen.x, zone.rahmen.x + zone.rahmen.breite)
    yLinien.push(zone.rahmen.y, zone.rahmen.y + zone.rahmen.höhe)
  }
  return { x: normalisiereLinien(xLinien), y: normalisiereLinien(yLinien) }
}

/** Verschiebt die Zone um (dx, dy) in FLÄCHENPIXELN. Feste Zonen bleiben unverändert. */
export function verschiebeZone(
  zone: Zone,
  dx: number,
  dy: number,
  flaeche: Flaeche,
  linien: Einrastlinien,
): Zone {
  if (zone.rolle === 'fest' || !Number.isFinite(dx) || !Number.isFinite(dy)) {
    // Feste Zonen sind strukturell gesperrt (FA-11); ein NaN/Infinity wuerde
    // sonst in vorlagen.json wandern und jede spaetere Pruefung unterlaufen.
    // In beiden Faellen KEIN Einrasten, kein Begrenzen - die Kante bleibt.
    return zone
  }
  const xRoh = zone.rahmen.x + dx
  const yRoh = zone.rahmen.y + dy
  // Zwei Kandidaten je Achse: die fuehrende (links/oben) und die nachlaufende
  // (rechts/unten) Kante. Ohne den zweiten Kandidaten liesse sich nie an einer
  // rechten/unteren Kante ausrichten (z. B. Inhaltsbox bei 1824/1026).
  const xOpt = naechsterKandidat(
    xRoh,
    raste(xRoh, linien.x),
    raste(xRoh + zone.rahmen.breite, linien.x) - zone.rahmen.breite,
  )
  const yOpt = naechsterKandidat(
    yRoh,
    raste(yRoh, linien.y),
    raste(yRoh + zone.rahmen.höhe, linien.y) - zone.rahmen.höhe,
  )
  const rahmen = begrenzeAufFlaeche(
    { x: xOpt, y: yOpt, breite: zone.rahmen.breite, höhe: zone.rahmen.höhe },
    flaeche,
  )
  return { ...zone, rahmen }
}

/** Bemaßt die Zone an einem Griff um (dx, dy). Feste Zonen bleiben unverändert. */
export function bemasseZone(
  zone: Zone,
  griff: Griff,
  dx: number,
  dy: number,
  flaeche: Flaeche,
  linien: Einrastlinien,
): Zone {
  if (zone.rolle === 'fest' || !Number.isFinite(dx) || !Number.isFinite(dy)) {
    return zone
  }
  let links = zone.rahmen.x
  let oben = zone.rahmen.y
  let rechts = zone.rahmen.x + zone.rahmen.breite
  let unten = zone.rahmen.y + zone.rahmen.höhe

  const bewegtLinks = griff === 'nw' || griff === 'sw' || griff === 'w'
  const bewegtRechts = griff === 'ne' || griff === 'se' || griff === 'e'
  const bewegtOben = griff === 'nw' || griff === 'n' || griff === 'ne'
  const bewegtUnten = griff === 'se' || griff === 's' || griff === 'sw'

  // Nur die vom Griff betroffenen Kanten bewegen; die gegenueberliegenden bleiben fest.
  if (bewegtLinks) links = raste(links + dx, linien.x)
  if (bewegtRechts) rechts = raste(rechts + dx, linien.x)
  if (bewegtOben) oben = raste(oben + dy, linien.y)
  if (bewegtUnten) unten = raste(unten + dy, linien.y)

  if (bewegtLinks) links = klemme(links, 0, flaeche.breite)
  if (bewegtRechts) rechts = klemme(rechts, 0, flaeche.breite)
  if (bewegtOben) oben = klemme(oben, 0, flaeche.höhe)
  if (bewegtUnten) unten = klemme(unten, 0, flaeche.höhe)

  // Mindestgroesse erzwingen: Eine Zone mit breite/hoehe 0 ist nach #102 nicht
  // speicherbar - die BEWEGTE Kante wandert zurueck, die feste bleibt liegen.
  if (bewegtLinks && rechts - links < MINDEST_ZONEN_KANTE_PX) {
    links = rechts - MINDEST_ZONEN_KANTE_PX
  }
  if (bewegtRechts && rechts - links < MINDEST_ZONEN_KANTE_PX) {
    rechts = links + MINDEST_ZONEN_KANTE_PX
  }
  if (bewegtOben && unten - oben < MINDEST_ZONEN_KANTE_PX) {
    oben = unten - MINDEST_ZONEN_KANTE_PX
  }
  if (bewegtUnten && unten - oben < MINDEST_ZONEN_KANTE_PX) {
    unten = oben + MINDEST_ZONEN_KANTE_PX
  }

  return {
    ...zone,
    rahmen: { x: links, y: oben, breite: rechts - links, höhe: unten - oben },
  }
}

function klemme(wert: number, min: number, max: number): number {
  return Math.min(Math.max(wert, min), max)
}

function naechsterKandidat(roh: number, erst: number, zweit: number): number {
  // Bei Gleichstand gewinnt der ERSTE Kandidat (die fuehrende Kante).
  return Math.abs(erst - roh) <= Math.abs(zweit - roh) ? erst : zweit
}

/**
 * Die Einrast-Regel (TK 9.12.2, an genau einer Stelle im Code):
 * naechste Linie innerhalb der Toleranz, sonst Vielfaches des 8-px-Rasters.
 * Linien haben Vorrang vor dem Raster - 54 und 1026 liegen nicht auf dem Raster.
 */
function raste(wert: number, linien: number[]): number {
  const abgerundet = Math.round(wert)
  let beste: number | null = null
  for (const linie of linien) {
    // Die Liste ist aufsteigend sortiert: Wer nur bei ECHT kleinerem Abstand
    // ersetzt, behaelt bei Gleichstand automatisch die KLEINERE Linie.
    if (beste === null || Math.abs(abgerundet - linie) < Math.abs(abgerundet - beste)) {
      beste = linie
    }
  }
  if (beste !== null && Math.abs(abgerundet - beste) <= EINRAST_TOLERANZ_PX) {
    return beste
  }
  return Math.round(abgerundet / EINRAST_RASTER_PX) * EINRAST_RASTER_PX
}

function normalisiereLinien(werte: number[]): number[] {
  // Auf ganze Zahlen runden, entdoppeln, aufsteigend sortieren - die Sortierung
  // macht das Ergebnis bei Gleichstand eindeutig.
  const gesehen = new Set<number>()
  for (const wert of werte) gesehen.add(Math.round(wert))
  return [...gesehen].sort((a, b) => a - b)
}
