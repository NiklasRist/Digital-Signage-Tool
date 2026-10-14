import { useState, useRef, type JSX } from "react";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Listenelement, Project } from "../../shared/contracts/project";
import { ordneNeuOptimistisch } from "./liste-reorder";
import { frameDauer } from "./gesamtlaenge";
import { RENDER_PROFILE } from "../../shared/contracts/render-profile";
import { fuegeElementHinzu } from "./element-hinzufuegen";
import { baueEinfugeKanten, leseKantenIndex, liestReferenz, waehleKanteAus } from "./spalt-drop";

const EA_PX_PRO_SEKUNDE = 8
const ZEILE_HOEHE_PX = 64

/** Baut die Zeilen der Zeitleiste in ARRAY-Reihenfolge; kein Sortieren, nur Anzeige-Klemmung. */
export function baueZeitleistenZeilen(
  liste: readonly Listenelement[],
): Array<
  | { elementId: string; art: 'video' | 'segment'; dauerSekunden: number; breitePx: number }
  | { elementId: string; art: 'fehlt'; dauerSekunden: null; breitePx: number }
> {
  return liste.map((element) => {
    const einzeln = frameDauer(element)
    if (!einzeln.ok) {
      // Ein Element ohne bestimmbare Dauer bekommt einen Platzhalter – keine zweite Regel.
      return { elementId: element.id, art: 'fehlt' as const, dauerSekunden: null, breitePx: 64 }
    }
    return {
      elementId: element.id,
      art: element.art,
      dauerSekunden: einzeln.wert / RENDER_PROFILE.fps,
      breitePx: Math.max(24, Math.round((einzeln.wert / RENDER_PROFILE.fps) * EA_PX_PRO_SEKUNDE)),
    }
  })
}

interface ZeileBeschriftung {
  art: 'video' | 'segment' | 'fehlt'
  dauerText: string
  index: number
}

export function zeilenBeschriftung(
  zeile: { art: 'video' | 'segment' | 'fehlt'; dauerSekunden: number | null },
  index: number,
): ZeileBeschriftung {
  if (zeile.art === 'fehlt' || zeile.dauerSekunden === null) {
    return { art: 'fehlt', dauerText: 'Dauer unbestimmbar', index }
  }
  return {
    art: zeile.art,
    dauerText: `${Math.round(zeile.dauerSekunden)} s`,
    index,
  }
}

const DEFAULT_VERSCHOBEN: string[] = []
void DEFAULT_VERSCHOBEN;

export function Zeitleiste({ projekt }: { projekt: Project | null }): JSX.Element {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [ziehen, setzeZiehen] = useState<'ruhig' | 'aktiv'>('ruhig')
  // #412: Der laufende NEU-Drag (Referenz aus #413, `null` = Bestands-Sortier-Drag),
  // die gemessene aktive Kante und die Kante, auf die ein Einfuegen GERADE wartet
  // (Lade-Markierung, nicht optimistisch, TK 9.7.3).
  const [neuZug, setzeNeuZug] = useState<string | null>(null)
  const [aktiveKante, setzeAktiveKante] = useState<number | null>(null)
  const [laedtKante, setzeLaedtKante] = useState<number | null>(null)
  const korbRef = useRef<HTMLDivElement | null>(null)
  const zeigerStartX = useRef<number | null>(null)

  if (projekt === null) {
    return <div data-testid="zeitleiste-kein-projekt" />
  }

  const zeilen = baueZeitleistenZeilen(projekt?.liste ?? [])
  const ids = zeilen.map((zeile) => zeile.elementId)
  const kanten = baueEinfugeKanten(zeilen.length)

  const amEnde = (ereignis: DragEndEvent): void => {
    setzeZiehen('ruhig')
    setzeNeuZug(null)
    setzeAktiveKante(null)
    // Sortier-Drag EINES BESTANDELEMENTS (keine Referenz-Daten): der alte Reorder-Weg
    // (#122), UNVERÄNDERT.
    const referenz = liestReferenz(ereignis.active.data.current)
    if (referenz === null) {
      const aktiv = ereignis.active.id
      const ueber = ereignis.over?.id
      if (typeof aktiv !== 'string' || typeof ueber !== 'string') return
      ordneNeuOptimistisch(aktiv, ueber)
      return
    }
    // NEU-Drag aus Bibliothek/Galerie (#413): Einfügen an der aktiven Kante (#412).
    let index = aktiveKante
    if (index === null) index = leseKantenIndex(ereignis.over?.id)
    if (index === null) {
      // Der Zeiger lag bei keinem Messwert außerhalb: kein Aufruf, keine Meldung
      // (Fehlerpfade-Tabelle des Issues, "Drop außerhalb einer Kante").
      setzeLaedtKante(null)
      return
    }
    setzeLaedtKante(index)
    void fuegeElementHinzu(referenz, index).finally(() => setzeLaedtKante(null))
  }

  const amDragStart = (ereignis: DragStartEvent): void => {
    setzeZiehen('aktiv')
    // NUR ein Drag MIT Referenz (Neu-Einfuegen, #413) oeffnet die Kanten; ein
    // Bestands-Sortier-Drag belaesst sie geschlossen (Invariant "Sortieren != Einfuegen").
    setzeNeuZug(liestReferenz(ereignis.active.data.current))
    // Die Zeiger-Startposition (dnd-kit haelt nur `activatorEvent` + `delta`).
    const aktivator = ereignis.activatorEvent as MouseEvent
    if (typeof aktivator?.clientX === 'number') zeigerStartX.current = aktivator.clientX
  }

  const amUeber = (ereignis: DragOverEvent): void => {
    // Messbruecke zu `waehleKanteAus` (woertlich die verbindliche #412-Signatur): aus der
    // Zeiger-x-Position im Zeitleisten-Koordinatenraum wird die naechste Kante gemessen.
    // Start-x (activatorEvent) + Delta = aktuelle Zeiger-Position; das Fenster kann
    // gescrollt sein, daher das Scroll-Offset dazu.
    if (neuZug === null) return
    const korb = korbRef.current
    if (korb === null || zeigerStartX.current === null) {
      setzeAktiveKante(leseKantenIndex(ereignis.over?.id))
      return
    }
    // jsdom und verdeckte Koerper liefern 0 (getBoundingClientRect) - dann Rueckfall.
    const umriss = korb.getBoundingClientRect()
    if (umriss.width === 0 && umriss.height === 0) {
      const ruckfall = leseKantenIndex(ereignis.over?.id)
      setzeAktiveKante(ruckfall)
      return
    }
    const xImKontext = zeigerStartX.current + ereignis.delta.x - umriss.left + korb.scrollLeft
    const gemessen = waehleKanteAus(kanten, xImKontext, (index) => zeilen[index]?.breitePx ?? 64)
    setzeAktiveKante(gemessen ?? leseKantenIndex(ereignis.over?.id))
  }

  return (
    <div
      data-testid="zeitleiste"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        overflowX: 'auto',
        minHeight: 80,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={amDragStart}
        onDragOver={amUeber}
        onDragEnd={amEnde}
        onDragCancel={() => {
          setzeZiehen('ruhig')
          setzeNeuZug(null)
          setzeAktiveKante(null)
        }}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div ref={korbRef} style={{ display: 'flex', alignItems: 'stretch', gap: 2, minHeight: ZEILE_HOEHE_PX }}>
            {neuZug !== null && <KantenBlock nummer={0} aktiv={aktiveKante === 0} laedt={laedtKante === 0} />}
            {zeilen.map((zeile, index) => (
              <span key={zeile.elementId} style={{ display: 'flex', alignItems: 'stretch', gap: 2, padding: 0 }}>
                <ZeilenBlock zeile={zeile} index={index} ziehen={ziehen === 'aktiv'} />
                {neuZug !== null && (
                  <KantenBlock nummer={index + 1} aktiv={aktiveKante === index + 1} laedt={laedtKante === index + 1} />
                )}
              </span>
            ))}
            {zeilen.length === 0 && neuZug === null && (
              <div data-testid="zeitleiste-leer" style={{ color: '#8f8f8f', fontSize: 12 }}>
                Leere Wiedergabeliste
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/** #412 - Die EINE Einfüge-Kante als Drop-Ziel: unsichtbar in der Ruhelage, beim
 *  Neu-Drag ein Spalt (Stummmodus 10 px), der aktive/geöffnete Spalt breiter, die
 *  wartende Spalt-Position mit Lade-Streifen. */ 
function KantenBlock({ nummer, aktiv, laedt }: { nummer: number; aktiv: boolean; laedt: boolean }): JSX.Element {
  const { isOver, setNodeRef } = useDroppable({ id: `kante-${nummer}` })
  return (
    <div
      ref={setNodeRef}
      data-testid={`zeitleiste-kante-${nummer}`}
      style={{
        flex: '0 0 auto',
        width: aktiv || isOver ? 22 : 10,
        minWidth: 10,
        height: ZEILE_HOEHE_PX,
        borderRadius: 3,
        transition: 'width 120ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#dbe4ee',
        fontSize: 18,
        background: isOver ? 'rgba(64, 141, 93, 0.35)' : aktiv ? 'rgba(47, 109, 181, 0.28)' : 'rgba(58, 58, 58, 0.2)',
        outline: laedt ? '2px solid #2a9d8f' : 'none',
        outlineOffset: -2,
      }}
      title={`Hier einfügen (Position ${nummer})`}
    >
      {laedt ? '…' : '+'}
    </div>
  )
}

function ZeilenBlock({
  zeile,
  index,
  ziehen,
}: {
  zeile: Awaited<ReturnType<typeof baueZeitleistenZeilen>>[number];
  index: number;
  ziehen: boolean;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: zeile.elementId })
  const beschriftung = zeilenBeschriftung(zeile, index)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`zeitleiste-block-${index}`}
      style={{
        width: zeile.breitePx,
        flex: '0 0 auto',
        height: ZEILE_HOEHE_PX,
        borderRadius: 4,
        padding: 4,
        fontSize: 10,
        overflow: 'hidden',
        cursor: 'grab',
        border: `1px solid ${zeile.art === 'fehlt' ? '#e5634d' : '#3a3a3a'}`,
        background: zeile.art === 'video' ? '#2f6db5' : zeile.art === 'segment' ? '#2a9d8f' : '#333',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: ziehen ? 0.85 : 1,
      }}
      title={zeile.art === 'fehlt' ? 'Dauer unbestimmbar' : `${beschriftung.dauerText}`}
    >
      <span>{beschriftung.dauerText}</span>
      <span style={{ opacity: 0.7 }}>{beschriftung.art}</span>
    </div>
  );
}
