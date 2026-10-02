import { useState, type JSX } from "react";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Listenelement, Project } from "../../shared/contracts/project";
import { ordneNeuOptimistisch } from "./liste-reorder";
import { frameDauer } from "./gesamtlaenge";
import { RENDER_PROFILE } from "../../shared/contracts/render-profile";

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

  if (projekt === null) {
    return <div data-testid="zeitleiste-kein-projekt" />
  }

  const zeilen = baueZeitleistenZeilen(projekt?.liste ?? [])
  const ids = zeilen.map((zeile) => zeile.elementId)

  const amEnde = (ereignis: DragEndEvent): void => {
    setzeZiehen('ruhig')
    const aktiv = ereignis.active.id
    const ueber = ereignis.over?.id
    if (typeof aktiv !== 'string' || typeof ueber !== 'string') return
    void ordneNeuOptimistisch(aktiv, ueber)
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={amEnde} onDragStart={() => setzeZiehen('aktiv')}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, minHeight: ZEILE_HOEHE_PX }}>
            {zeilen.map((zeile, index) => (
              <ZeilenBlock key={zeile.elementId} zeile={zeile} index={index} ziehen={ziehen === 'aktiv'} />
            ))}
            {zeilen.length === 0 && (
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
