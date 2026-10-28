// #433 (docs/agents/433-frames-plan.md): der Filmstreifen des Video-Blocks in der
// Zeitleiste. Der User will die EINZELBILDER des Videos sehen - echte Videobilder,
// keine Teilstriche. Dieses Bauteil holt sie ueber dieselbe Aufnahme wie die
// Thumbnails (composer/thumbnails.ts, `fangeBild`) und zeichnet sie nebeneinander.
//
// Die ANZAHL folgt der Blockbreite (also dem Zoom): je breiter der Block, desto mehr
// Einzelbilder - beim Hineinzoomen naehert sich der Streifen den einzelnen Frames.

import { useEffect, useRef, useState, type JSX } from 'react'

import type { Listenelement, Project } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import { mediaBlobUrl, gibMediaBlobUrlFrei } from '../gemeinsam/media-blob-url'
import { fangeBild, warteAufMetadaten } from './thumbnails'

/** Zielbreite EINES Einzelbilds. Bestimmt, wie viele in die Blockbreite passen. */
const ZIEL_BREITE_PX = 40
/** Obergrenze je Block - eine sehr breite Leiste soll nicht hunderte Videos dekodieren. */
const MAX_BILDER = 40
/** Hoehe der aufgenommenen Einzelbilder (der Block skaliert sie auf seine Hoehe). */
const BILD_HOEHE_PX = 64
/** Zeitgrenze je Suchlauf, damit ein haengendes Video den Streifen nicht blockiert. */
const SUCH_TIMEOUT_MS = 3000

/** Wie viele Einzelbilder eine Blockbreite traegt (mindestens 1, hoechstens MAX_BILDER). REIN. */
export function anzahlBilder(breitePx: number): number {
  if (!Number.isFinite(breitePx) || breitePx <= 0) return 1
  return Math.max(1, Math.min(MAX_BILDER, Math.floor(breitePx / ZIEL_BREITE_PX)))
}

/** Die Zeitpunkte (Sekunden) der Einzelbilder, gleichmaessig ueber `[start, ende)`.
 *  Jedes Bild sitzt in der Mitte seines Zeit-Abschnitts. REIN - ohne DOM pruefbar. */
export function bildZeitpunkte(start: number, ende: number, anzahl: number): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(ende) || !(ende > start) || anzahl < 1) {
    return []
  }
  const spanne = ende - start
  return Array.from({ length: anzahl }, (_, i) => start + (spanne * (i + 0.5)) / anzahl)
}

/** Die Quelle des Video-Elements; null, wenn kein brauchbares Video-Asset.
 *  Seit #364 sind das die BESTANDTEILE (Projekt-Kennung + Dateiname), nicht die
 *  fertige `media://`-URL: der Filmstreifen bindet eine Blob-URL (s. `ladeFilmstreifen`). */
function videoQuelle(
  projekt: Project,
  element: Listenelement,
): { projektId: string; dateiname: string; dauer: number } | null {
  if (element.art !== 'video') return null
  const asset = projekt.assets.find((eintrag) => eintrag.id === element.ref) as
    | (Asset & { dateiname?: unknown; dauer?: unknown })
    | undefined
  if (asset === undefined || asset.zustand === 'fehlt' || typeof asset.dateiname !== 'string') {
    return null
  }
  const dauer = typeof asset.dauer === 'number' && Number.isFinite(asset.dauer) ? asset.dauer : null
  if (dauer === null) return null
  return { projektId: projekt.id, dateiname: asset.dateiname, dauer }
}

/** Setzt den Suchkopf und liefert das Bild, sobald `seeked` eintritt (mit Zeitgrenze). */
function sucheUndFange(video: HTMLVideoElement, zeit: number): Promise<HTMLCanvasElement | null> {
  return new Promise((löse) => {
    let gelaufen = false
    const fertig = (): void => {
      if (gelaufen) return
      gelaufen = true
      löse(fangeBild(video, BILD_HOEHE_PX))
    }
    video.addEventListener('seeked', fertig, { once: true })
    video.addEventListener('error', fertig, { once: true })
    setTimeout(fertig, SUCH_TIMEOUT_MS)
    try {
      video.currentTime = zeit
    } catch {
      fertig()
    }
  })
}

/** Laedt die Einzelbilder EINMAL je Quelle/Dauer/Anzahl. Fehler ergeben einen leeren Streifen. */
async function ladeFilmstreifen(
  projektId: string,
  dateiname: string,
  zeiten: number[],
): Promise<HTMLCanvasElement[]> {
  if (zeiten.length === 0) return []
  // #364: NICHT die media://-URL direkt binden - drawImage daraus taintet das
  // Canvas. Die Bytes kommen ueber denselben Speicherort-Vertrag als Blob-URL.
  const objektUrl = await mediaBlobUrl(projektId, dateiname)
  if (objektUrl === '') return []
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.src = objektUrl
  try {
    await warteAufMetadaten(video)
    const bilder: HTMLCanvasElement[] = []
    for (const zeit of zeiten) {
      const bild = await sucheUndFange(video, zeit)
      if (bild !== null) bilder.push(bild)
    }
    return bilder
  } catch {
    return []
  } finally {
    // Der Blob haelt die GANZE Datei im Speicher (akzeptierte Ausnahme, ein Video
    // je Projekt) - nach dem letzten Bild bzw. beim Fehlschlag wieder freigeben.
    gibMediaBlobUrlFrei(objektUrl)
  }
}

/** Ein einzelnes Einzelbild - zeichnet die Aufnahme in ein Anzeige-Canvas. */
function Einzelbild({ knoten, breite, hoehe }: { knoten: HTMLCanvasElement; breite: number; hoehe: number }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const ziel = ref.current
    if (ziel === null) return
    ziel.width = knoten.width
    ziel.height = knoten.height
    ziel.getContext('2d')?.drawImage(knoten, 0, 0)
  }, [knoten])
  return (
    <canvas
      ref={ref}
      data-testid="zeitleiste-filmstreifen-bild"
      style={{ flex: '0 0 auto', width: breite, height: hoehe, display: 'block' }}
    />
  )
}

export interface FilmstreifenEigenschaften {
  projekt: Project
  element: Listenelement
  /** Die Blockbreite der Zeitleiste (px) - bestimmt die Bild-Anzahl. */
  breitePx: number
  /** Die Blockhoehe (px). */
  hoehePx: number
}

export function VideoFilmstreifen({ projekt, element, breitePx, hoehePx }: FilmstreifenEigenschaften): JSX.Element | null {
  const [bilder, setzeBilder] = useState<HTMLCanvasElement[]>([])
  const quelle = videoQuelle(projekt, element)
  const start = typeof element.trimStart === 'number' ? element.trimStart : 0
  const ende = typeof element.trimEnde === 'number' ? element.trimEnde : (quelle?.dauer ?? 0)
  const anzahl = anzahlBilder(breitePx)

  useEffect(() => {
    if (quelle === null) {
      setzeBilder([])
      return
    }
    let abgebrochen = false
    const zeiten = bildZeitpunkte(start, ende, anzahlBilder(breitePx))
    void ladeFilmstreifen(quelle.projektId, quelle.dateiname, zeiten).then((ergebnis) => {
      if (!abgebrochen) setzeBilder(ergebnis)
    })
    return () => {
      abgebrochen = true
    }
  }, [quelle?.projektId, quelle?.dateiname, start, ende, anzahl])

  if (quelle === null || bilder.length === 0) return null
  const je = breitePx / bilder.length
  return (
    <div
      data-testid="zeitleiste-filmstreifen"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 4,
        zIndex: 0,
      }}
    >
      {bilder.map((knoten, i) => (
        <Einzelbild key={i} knoten={knoten} breite={je} hoehe={hoehePx} />
      ))}
    </div>
  )
}
