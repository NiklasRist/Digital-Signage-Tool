// Issue #248 (M7-55) - liste-ansicht.tsx: die Wiedergabeliste, so wenig Logik wie
// moeglich. Hier und nur hier lebt der DndContext dieses Moduls (PointerSensor; die
// Tastatur-Sensorik- und Mehrfachauswahl-Frage ist im Issue offen und wird gemeldet,
// nicht beantwortet).
//
// Der Reorder laeuft AUSSCHLIESSLICH ueber ordneNeuOptimistisch (#122): Ein zweiter
// Rollback-Weg hier waere die teuerste Verwechslung des Moduls. Diese Datei haelt
// keine Auswahl (ENTSCHIEDEN 8), rechnet weder kaputte Stellen noch den
// Reparatur-Stand (ENTSCHIEDEN 7) und veraendert die gemeinsame Sicht nie selbst.
//
// Thumbnails: ohne voraussetzungen wird erzeugeThumbnail NICHT gerufen
// (ENTSCHIEDEN 6 - zeichneSegment wirft, wenn die Marken-Schriften nicht bereit
// sind, und wuerde die ganze Liste abreissen). Die Ungültigkeitsregel ist die
// OBJEKTREFERENZ (ENTSCHIEDEN 5): ein neues Element-/Aktion-/Asset-Objekt oder neue
// Zeichenvoraussetzungen laden neu, dieselben Referenzen nie. Ein Bild, das erst
// eintrifft, nachdem die Quelle gewechselt hat, wird verworfen.
//
// Genau EINE Inline-Meldung (ENTSCHIEDEN 9): abonniert beim Aufbau, beim Abbau
// abgemeldet; die zuletzt gemeldete steht ueber der Liste.

import { useCallback, useEffect, useState, type JSX } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Listenelement, Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from './zeichen-vorbereitung'
import type { KaputteStelle } from './kaputt-erkennung'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { ListenZeileModell } from './liste-ansicht'
import {
  baueLaengenAnzeige,
  baueListenZeilen,
  baueReparaturAnzeige,
  findeThumbnailquelle,
  LEERE_MELDUNGSLAGE,
  nimmMeldungAuf,
  type Thumbnailquelle,
} from './liste-ansicht'
import { ordneNeuOptimistisch } from './liste-reorder'
import { erzeugeThumbnail, type Thumbnail } from './thumbnails'
import { aufInlineMeldung } from './optimistisch'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'

export interface WiedergabelisteEigenschaften {
  /** Das geladene Projekt aus der gemeinsamen Sicht (#121). Wird NUR gelesen. */
  projekt: Project
  /** Die kaputten Stellen, bereits gerechnet (#131). Diese Datei rechnet sie NICHT selbst. */
  stellen: readonly KaputteStelle[]
  /** Der Stand der Reparatur-Führung (#132); null = der Modus läuft nicht. */
  reparatur: ReparaturStand | null
  /** Marke und Vorlagen für die Thumbnails (#154). null = noch nicht vorbereitet: es wird KEIN
   *  Thumbnail erzeugt (s. ENTSCHIEDEN 6). */
  voraussetzungen: Zeichenvoraussetzungen | null
  /** Die Bedienelemente einer Zeile – sie kommen aus M7-56 und werden ÜBERGEBEN, nicht
   *  importiert (s. ENTSCHIEDEN 1). */
  zeichneBedienung: (modell: ListenZeileModell) => JSX.Element
  /** #415 (Variante a): der Sicht-Schreiber (Wrapped-Zugangs-`setzeListe`, #244-
   *  Huelle). PFICHT - der Reorder (#122) braucht ihn fuer den Undo-Schnappschuss. */
  sichtSchreiber: (liste: Listenelement[]) => void
  /** Ruft der Nutzer eine Zeile auf (Klick), meldet die Ansicht die Auswahl nach oben.
   *  Diese Datei hält KEINE Auswahl (s. ENTSCHIEDEN 8). */
  aufZeileGewaehlt: (elementId: string) => void
}

const KAPUTTFARBE = '#e5634d'
const HERVORHEBUNG = '#f5d76e'

/** Die Zeile innerhalb des SortableContext (der Ziehgriff lebt hier). */
function Zeile({
  element,
  projekt,
  modell,
  quelle,
  voraussetzungen,
  zeichneBedienung,
  aufGewaehlt,
}: {
  element: Listenelement
  projekt: Project
  modell: ListenZeileModell
  quelle: Thumbnailquelle
  voraussetzungen: Zeichenvoraussetzungen | null
  zeichneBedienung: (modell: ListenZeileModell) => JSX.Element
  aufGewaehlt: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: modell.elementId,
  })
  const [thumbnail, setzeThumbnail] = useState<Thumbnail | null>(null)

  const quellObjekt =
    quelle.art === 'asset' ? quelle.asset : quelle.art === 'aktion' ? quelle.aktion : null

  // ENTSCHIEDEN 5: die Abhängigkeit ist das Tripel aus Objektreferenzen - Quelle
  // (die IDENTISCHE Referenz wie im Projekt), Element und Voraussetzungen. Kein
  // String-Schlüssel: der müsste raten, welche Felder das Bild beeinflussen.
  useEffect(() => {
    if (voraussetzungen === null) {
      // ENTSCHIEDEN 6: KEIN erzeugeThumbnail-Aufruf, kein Ersatzbild - leere Vorschaufläche.
      setzeThumbnail(null)
      return
    }
    if (quelle.art === 'fehlt') {
      setzeThumbnail({ quelle: 'fehlt' })
      return
    }
    let abgebrochen = false
    // Die Marke je ELEMENT (#313, TK 9.15.4): die Aktion des Segment-Elements -
    // hergenommen aus der bereits gerechten Thumbnailquelle (quelle.aktion). Statt
    // dem entfallenen `voraussetzungen.marke` löst holeBereiteMarke (#312) auf;
    // null heisst: NICHT bereitgestellt - kein Thumbnail, kein Ersatzmarke.
    const elementAktion = quelle.art === 'aktion' ? quelle.aktion : null
    const marke = elementAktion !== null ? holeBereiteMarke(elementAktion.markeId) : null
    if (elementAktion !== null && marke === null) {
      setzeThumbnail({ quelle: 'fehlt' })
      return
    }
    // Bei einem Segment-Element ist die Marke aufgeloest (oben). Ein VIDEO-Element
    // braucht sie in erzeugeThumbnail nicht (Bild aus dem Video selbst) - der
    // Aufruf durchreicht hier eine Marke, die der Weg nie liest (Vertrag #128).
    erzeugeThumbnail(
      element,
      projekt,
      marke,
      voraussetzungen.vorlagen,
    )
      .then((bild: Thumbnail) => {
        // Fehlerpfade: ein Bild, das erst eintrifft, nachdem sich die Quelle
        // geändert hat, wird verworfen - ein veraltetes Bild darf nie stehenbleiben.
        if (abgebrochen) {
          return
        }
        setzeThumbnail(bild)
      })
      .catch((ursache: unknown) => {
        // Vertragsbruch von #128 (sie wirft nie): gefangen, die Zeile bleibt ohne
        // Vorschaubild, die übrigen Zeilen sind unberührt; sichtbar als Warnung.
        console.warn('Thumbnail-Erzeugung scheiterte:', ursache)
      })
    return () => {
      abgebrochen = true
    }
  }, [element, quellObjekt, voraussetzungen])

  const kaputt = modell.kaputt || modell.kaputteBandAbschnitte.length > 0

  return (
    <li
      ref={setNodeRef}
      data-testid="wiedergabeliste-zeile"
      data-element-id={modell.elementId}
      data-kaputt={kaputt ? 'ja' : 'nein'}
      onClick={aufGewaehlt}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        border: kaputt
          ? `1px solid ${KAPUTTFARBE}`
          : '1px solid transparent',
        background: modell.hervorgehoben ? HERVORHEBUNG : undefined,
        marginBottom: 4,
        borderRadius: 4,
        padding: '2px 4px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
      {...attributes}
      {...listeners}
    >
      <span data-testid="wiedergabeliste-griff" style={{ cursor: 'grab' }}>⠿</span>
      <span data-testid="wiedergabeliste-position" style={{ minWidth: 20, fontSize: 11 }}>
        {modell.position}
      </span>
      <span
        data-testid="wiedergabeliste-thumbnail"
        style={{ width: 64, height: 36, background: '#2b2b2b', display: 'inline-block' }}
      >
        {thumbnail !== null && thumbnail.quelle === 'canvas' && (
          // Kein Export (toDataURL/toBlob sind in #128 verboten): das gelieferte
          // Canvas wird in den Anzeige-Knoten GEKOPIERT; die Anzeigegröße macht CSS.
          <canvas
            ref={(knoten) => {
              if (knoten === null) return
              knoten.width = thumbnail.breite
              knoten.height = thumbnail.höhe
              knoten.getContext('2d')?.drawImage(thumbnail.canvas, 0, 0)
            }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
        {thumbnail !== null && thumbnail.quelle === 'url' && (
          // media://-Bild direkt als <img src> (so ist es in #128 geliefert).
          <img src={thumbnail.url} alt={modell.bezeichnung} style={{ width: '100%', height: '100%' }} />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          data-testid="wiedergabeliste-bezeichnung"
          style={kaputt ? { color: KAPUTTFARBE } : undefined}
        >
          {modell.bezeichnung}
        </span>{' '}
        <span data-testid="wiedergabeliste-art" style={{ fontSize: 11, color: '#8f8f8f' }}>
          {modell.artLabel}
        </span>{' '}
        <span data-testid="wiedergabeliste-dauer" style={{ fontSize: 11 }}>
          {modell.dauerText}
        </span>
      </span>
      {zeichneBedienung(modell)}
    </li>
  )
}

/** Die Wiedergabeliste. Enthält den DndContext und den SortableContext dieses Moduls. */
export function Wiedergabeliste(p: WiedergabelisteEigenschaften): JSX.Element {
  const zeilen = baueListenZeilen(p.projekt, p.stellen, p.reparatur?.aktuelle ?? null)
  const ids = zeilen.map((zeile) => zeile.elementId)
  const laenge = baueLaengenAnzeige(p.projekt.liste)
  const reparaturAnzeige = baueReparaturAnzeige(p.reparatur)
  const [meldungsLage, setzeMeldungsLage] = useState(LEERE_MELDUNGSLAGE)

  // ENTSCHIEDEN 9: EXAKT EIN Abonnement, beim Abbau ABGEMELDET (die Rückgabe des
  // Abonnements ist die Abmelde-Funktion - sie ist die Aufräum-Funktion des Effekts).
  useEffect(
    () =>
      aufInlineMeldung((meldung) =>
        setzeMeldungsLage((bisher) => nimmMeldungAuf(bisher, meldung)),
      ),
    [],
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const bewegt = useCallback((ereignis: DragEndEvent): void => {
    // ENTSCHIEDEN 3: GENAU dieser Aufruf - #122 wendet optimistisch an, nimmt bei
    // Ablehnung selbst zurück und meldet die Inline-Meldung. Hier passiert sonst
    // NICHTS: kein zweiter Rollback, kein Sicht-Schreibweg, kein berechneNeueReihenfolge.
    void ordneNeuOptimistisch(String(ereignis.active.id), ereignis.over ? String(ereignis.over.id) : null, p.sichtSchreiber)
  }, [p.sichtSchreiber])

  const elementFuer = useCallback(
    (elementId: string): Listenelement | undefined =>
      p.projekt.liste.find((eintrag) => eintrag.id === elementId),
    [p.projekt],
  )

  if (p.projekt.liste.length === 0) {
    // ENTSCHIEDEN 12: eigener, benannter Zustand - kein Fehler, keine Aktion angeboten.
    return (
      <div data-testid="wiedergabeliste" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div data-testid="wiedergabeliste-leer" style={{ color: '#8f8f8f', fontSize: 12 }}>
          In der Wiedergabeliste steht noch nichts.
        </div>
      </div>
    )
  }

  return (
    <div data-testid="wiedergabeliste" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div data-testid="wiedergabeliste-laenge" style={{ fontSize: 12 }}>
        {laenge.unvollstaendig ? 'Gesamtdauer unbestimmbar' : `Gesamt: ${laenge.text}`}
        {laenge.warnung && laenge.warntext !== null && (
          <span style={{ color: KAPUTTFARBE, marginLeft: 8 }}>{laenge.warntext}</span>
        )}
      </div>

      {reparaturAnzeige.sichtbar && (
        <div data-testid="wiedergabeliste-reparatur" style={{ color: '#f5d76e', fontSize: 12 }}>
          {reparaturAnzeige.text}
        </div>
      )}

      {meldungsLage.meldung !== null && (
        // Fehlerklasse 1 (TK 9.7.3): kurze Inline-Meldung über der Liste.
        <div data-testid="wiedergabeliste-meldung" style={{ color: KAPUTTFARBE, fontSize: 12 }}>
          {meldungsLage.meldung.meldung}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={bewegt}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul data-testid="wiedergabeliste-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {zeilen.map((modell) => {
              const element = elementFuer(modell.elementId)
              // Ein Modell ohne Listenelement kann nur aus einem veralteten Stand stammen;
              // dann wird die Zeile nicht gezeichnet - statt `undefined` durchzureichen.
              if (element === undefined) return null
              return (
                <Zeile
                  key={modell.elementId}
                  element={element}
                  projekt={p.projekt}
                  modell={modell}
                  quelle={findeThumbnailquelle(element, p.projekt)}
                  voraussetzungen={p.voraussetzungen}
                  zeichneBedienung={p.zeichneBedienung}
                  aufGewaehlt={() => p.aufZeileGewaehlt(modell.elementId)}
                />
              )
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
