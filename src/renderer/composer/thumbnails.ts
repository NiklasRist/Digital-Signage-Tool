import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'

export type Thumbnail =
  | { quelle: 'canvas'; canvas: HTMLCanvasElement; breite: number; höhe: number }
  | { quelle: 'url'; url: string }     // media://<projektId>/<dateiname>, direkt als <img src>
  | { quelle: 'fehlt' }                // Referenz zeigt ins Leere oder Frame nicht gewinnbar

const THUMBNAIL_HÖHE = 54
const ZEHN_JAHRHUNDERTE_MS = 3000


/** NaN hinein, null heraus - nie ein erfundener Trim-Punkt. */
function klemme(wert: unknown, unten: number, oben: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  if (wert < unten) return unten
  if (wert > oben) return oben
  return wert
}

/** Zieht das AKTUELLE Videobild auf ein Canvas fester Hoehe (Seitenverhaeltnis bleibt).
 *  null = kein Bild (Video nicht geladen, keine Flaeche). Exportiert, damit der
 *  Filmstreifen (#433) DIESELBE Aufnahme benutzt - keine zweite Bild-Quelle. */
export function fangeBild(video: HTMLVideoElement, hoehe: number): HTMLCanvasElement | null {
  const breite = video.videoWidth
  const höhe = video.videoHeight
  if (breite === 0 || höhe === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round((breite / höhe) * hoehe))
  canvas.height = hoehe
  const context = canvas.getContext('2d')
  if (context === null) return null

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas
}

function fangeEin(video: HTMLVideoElement): Thumbnail {
  const canvas = fangeBild(video, THUMBNAIL_HÖHE)
  if (canvas === null) return { quelle: 'fehlt' }
  return { quelle: 'canvas', canvas, breite: canvas.width, höhe: canvas.height }
}

export function warteAufMetadaten(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1) return Promise.resolve()
  return new Promise((löse, ablehne) => {
    const fertig = () => löse()
    const kaputt = () => ablehne(new Error('Video-Metadaten nicht ladbar'))
    video.addEventListener('loadedmetadata', fertig, { once: true })
    video.addEventListener('error', kaputt, { once: true })
    setTimeout(() => ablehne(new Error('Video-Metadaten Timeout')), ZEHN_JAHRHUNDERTE_MS * 2)
  })
}

async function videoThumbnail(element: Listenelement, projekt: Project): Promise<Thumbnail> {
  // `Listenelement.ref` ist vertraglich ein Text (bei `video` die Asset-Kennung) und
  // `Asset.dateiname` steht im Vertrag - der Main hat beides beim Speichern geprueft,
  // hier wird es nur GELESEN. Ein Eintrag, der nicht mehr existiert, faellt unten raus.
  const assetId = element.ref
  const asset = projekt.assets.find((eintrag) => eintrag.id === assetId)
  if (asset === undefined || asset.zustand === 'fehlt') return { quelle: 'fehlt' }

  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.src = `media://${projekt.id}/${asset.dateiname}`

  await warteAufMetadaten(video)

  const start = klemme(element.trimStart, 0, video.duration - 0.01)
  video.currentTime = start ?? 0

  return new Promise((löse) => {
    const fertig = () => löse(fangeEin(video))
    const kaputt = () => löse({ quelle: 'fehlt' })
    video.addEventListener('seeked', fertig, { once: true })
    video.addEventListener('error', kaputt, { once: true })
    setTimeout(() => löse({ quelle: 'fehlt' }), ZEHN_JAHRHUNDERTE_MS * 2)
  })
}

async function segmentThumbnail(
  element: Listenelement,
  projekt: Project,
  marke: Marke | null,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  // Ein Segment braucht seine Marke; fehlt sie, gibt es kein Bild (kein Ersatz).
  if (marke === null) return { quelle: 'fehlt' }
  // Wie oben: `ref` und `Aktion.vorlagenId` stehen im Vertrag; eine Aktion, die nicht
  // mehr im Bestand steht, faellt eine Zeile spaeter heraus.
  const aktionsId = element.ref
  const aktion = projekt.aktionen.find((eintrag) => eintrag.id === aktionsId)
  if (aktion === undefined) return { quelle: 'fehlt' }

  const vorlage = vorlagen.find((kandidat) => kandidat.id === aktion.vorlagenId)
  if (vorlage === undefined) return { quelle: 'fehlt' }

  const { zeichneSegment } = await import('../template-canvas/zeichne-segment')
  // Vierter Parameter (rahmenMarke, TK v3.18 / M8-21): fuer nichts-einblendung-hintergrund
  // ist rahmenMarke === marke - DERSSELBE Wert, dieselbe Referenz.
  const segment = zeichneSegment(aktion, vorlage, marke, marke)
  return { quelle: 'canvas', canvas: segment.canvas, breite: segment.breite, höhe: segment.höhe }
}

/** Erzeugt das Vorschaubild eines Listenelements (TK 9.7.4: renderer-seitig, ohne ffmpeg). */
export async function erzeugeThumbnail(
  element: Listenelement,
  projekt: Project,
  /** Die Marke der Aktion - ein VIDEO-Element liest sie nie (Vertrag #128), deshalb
   *  ist `null` erlaubt; `segmentThumbnail` bricht dann mit "kein Bild" ab. */
  marke: Marke | null,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  // `art` ist eine geschlossene Union im Vertrag - ein unbekannter Wert kann nur aus
  // einer defekten Datei kommen und endet unten als "kein Bild".
  const art = element.art
  if (art === 'video') return videoThumbnail(element, projekt)
  if (art === 'segment') return segmentThumbnail(element, projekt, marke, vorlagen)
  return { quelle: 'fehlt' }
}
