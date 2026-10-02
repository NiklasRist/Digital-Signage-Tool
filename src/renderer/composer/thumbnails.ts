import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'

export type Thumbnail =
  | { quelle: 'canvas'; canvas: HTMLCanvasElement; breite: number; höhe: number }
  | { quelle: 'url'; url: string }     // media://<projektId>/<dateiname>, direkt als <img src>
  | { quelle: 'fehlt' }                // Referenz zeigt ins Leere oder Frame nicht gewinnbar

const THUMBNAIL_HÖHE = 54
const ZEHN_JAHRHUNDERTE_MS = 3000

type RohElement = { id?: unknown; art?: unknown; ref?: unknown; trimStart?: unknown } | null | undefined
type RohAktion = { id?: unknown; bildRef?: unknown; vorlagenId?: unknown } | null | undefined

/** NaN hinein, null heraus - nie ein erfundener Trim-Punkt. */
function klemme(wert: unknown, unten: number, oben: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  if (wert < unten) return unten
  if (wert > oben) return oben
  return wert
}

function fangeEin(video: HTMLVideoElement): Thumbnail {
  const breite = video.videoWidth
  const höhe = video.videoHeight
  if (breite === 0 || höhe === 0) return { quelle: 'fehlt' }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round((breite / höhe) * THUMBNAIL_HÖHE)
  canvas.height = THUMBNAIL_HÖHE
  const context = canvas.getContext('2d')
  if (context === null) return { quelle: 'fehlt' }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return { quelle: 'canvas', canvas, breite: canvas.width, höhe: canvas.height }
}

function warteAufMetadaten(video: HTMLVideoElement): Promise<void> {
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
  const roh = element as unknown as RohElement
  const assetId = typeof roh?.ref === 'string' ? roh.ref : null
  if (assetId === null) return { quelle: 'fehlt' }

  const asset = projekt.assets.find((eintrag) => (eintrag as unknown as RohAsset)?.id === assetId) as
    | (Asset & { dateiname: string })
    | undefined
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
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  const roh = element as unknown as RohElement
  const aktionsId = typeof roh?.ref === 'string' ? roh.ref : null
  if (aktionsId === null) return { quelle: 'fehlt' }

  const aktion = projekt.aktionen.find((eintrag) => (eintrag as unknown as RohAktion)?.id === aktionsId) as
    | (Aktion & { vorlagenId: string })
    | undefined
  if (aktion === undefined) return { quelle: 'fehlt' }

  const vorlage = vorlagen.find((kandidat) => kandidat.id === aktion.vorlagenId)
  if (vorlage === undefined) return { quelle: 'fehlt' }

  const { zeichneSegment } = await import('../template-canvas/zeichne-segment')
  const segment = zeichneSegment(aktion, vorlage, marke)
  return { quelle: 'canvas', canvas: segment.canvas, breite: segment.breite, höhe: segment.höhe }
}

type RohAsset = { id?: unknown; typ?: unknown; zustand?: unknown; dateiname?: unknown } | null | undefined

/** Erzeugt das Vorschaubild eines Listenelements (TK 9.7.4: renderer-seitig, ohne ffmpeg). */
export async function erzeugeThumbnail(
  element: Listenelement,
  projekt: Project,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  const art = (element as unknown as RohElement)?.art
  if (art === 'video') return videoThumbnail(element, projekt)
  if (art === 'segment') return segmentThumbnail(element, projekt, marke, vorlagen)
  return { quelle: 'fehlt' }
}
