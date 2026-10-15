import type { JSX } from "react";

import {
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Listenelement, Project } from "../../shared/contracts/project";
import { frameDauer } from "./gesamtlaenge";
import { RENDER_PROFILE } from "../../shared/contracts/render-profile";

const EA_PX_PRO_SEKUNDE = 8
const ZEILE_HOEHE_PX = 64

/** Baut die Zeilen der Zeitleiste in ARRAY-Reihenfolge; kein Sortieren, nur Anzeige-Klemmung. */
export function baueZeitleistenZeilen(
  liste: readonly Listenelement[],
): Array<
  | { elementId: string; ref: string; art: 'video' | 'segment'; dauerSekunden: number; breitePx: number }
  | { elementId: string; ref: string; art: 'fehlt'; dauerSekunden: null; breitePx: number }
> {
  return liste.map((element) => {
    const einzeln = frameDauer(element)
    if (!einzeln.ok) {
      // Ein Element ohne bestimmbare Dauer bekommt einen Platzhalter – keine zweite Regel.
      return { elementId: element.id, ref: element.ref, art: 'fehlt' as const, dauerSekunden: null, breitePx: 64 }
    }
    return {
      elementId: element.id,
      ref: element.ref,
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

export interface ZeitleistenEigenschaften {
  /** Das geladene Projekt aus der gemeinsamen Sicht (#121). null = kein Projekt. */
  projekt: Project | null
  /** #414: der laufende NEU-Drag (Drag-Daten `{ referenz }` aus #413) - `null`
   *  waehrend Bestands-Sortier-Drag oder Ruhe; steuert die Kanten-Sichtbarkeit. */
  neuZug: string | null
  /** #412: die gemessene aktive Kante (naechste Grenze zum Zeigefinger). */
  aktiveKante: number | null
  /** Die Kante, auf die ein Einfuegen GERADE wartet (nicht optimistisch, TK 9.7.3). */
  laedtKante: number | null
  /** #414: der Korb der Zeitleiste - der MESSRAUM fuer waehleKanteAus. Ref kommt von
   *  der Wurzel, die den DndContext haelt (EIN Kontext fuer Quellen und Kanten). */
  korbRef: React.RefObject<HTMLDivElement | null>
}

export function Zeitleiste({
  projekt,
  neuZug,
  aktiveKante,
  laedtKante,
  korbRef,
}: ZeitleistenEigenschaften): JSX.Element {
  if (projekt === null) {
    return <div data-testid="zeitleiste-kein-projekt" />
  }

  const zeilen = baueZeitleistenZeilen(projekt?.liste ?? [])
  const ids = zeilen.map((zeile) => zeile.elementId)

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
      {/* EIN DndContext (#414): er lebt auf der COMPOSER-WURZEL, damit Quellen
          (#413) und Kanten (#412) im SELBEN Kontext liegen; diese Komponente haengt
          ihr Sortable-Fragment und ihren Messraum (korbRef) ein. */}
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <div ref={korbRef} style={{ display: 'flex', alignItems: 'stretch', gap: 2, minHeight: ZEILE_HOEHE_PX }}>
          {neuZug !== null && <KantenBlock nummer={0} aktiv={aktiveKante === 0} laedt={laedtKante === 0} />}
          {zeilen.map((zeile, index) => (
            <span key={zeile.elementId} style={{ display: 'flex', alignItems: 'stretch', gap: 2, padding: 0 }}>
              <ZeilenBlock zeile={zeile} index={index} />
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
    </div>
  );
}

/** #412 - Die EINE Einfüge-Kante als Drop-Ziel: unsichtbar in der Ruhelage, beim
 *  Neu-Drag ein Spalt. #417: Der aktiv/ueberfahrene Spalt ist sichtbar BREITER, aber
 *  LAYOUTNEUTRAL: Breite UND negative Raender wachsen zusammen (22 + (-6) + (-6) = 10).
 *  So bleibt der Vorschub je Block konstant (10 + 2 + 2 = 14, s. KANTEN_VORSCHUB_PX in
 *  composer/index.tsx) - sichtbare Kanten und gemessene Grenzen (waehleKanteAus) passen
 *  stabil zusammen. Eine rein breitere Box verschoebe die Nachbarn waehrend des Zugs. */
function KantenBlock({ nummer, aktiv, laedt }: { nummer: number; aktiv: boolean; laedt: boolean }): JSX.Element {
  const { isOver, setNodeRef } = useDroppable({ id: `kante-${nummer}` })
  const geoeffnet = aktiv || isOver
  return (
    <div
      ref={setNodeRef}
      data-testid={`zeitleiste-kante-${nummer}`}
      style={{
        flex: '0 0 auto',
        width: geoeffnet ? 22 : 10,
        marginLeft: geoeffnet ? -6 : 0,
        marginRight: geoeffnet ? -6 : 0,
        minWidth: 10,
        height: ZEILE_HOEHE_PX,
        borderRadius: 3,
        transition: 'width 120ms ease, margin 120ms ease',
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
}: {
  zeile: Awaited<ReturnType<typeof baueZeitleistenZeilen>>[number];
  index: number;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: zeile.elementId })
  const beschriftung = zeilenBeschriftung(zeile, index)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`zeitleiste-block-${index}`}
      // #414-Abnahme-Messgroesse: die Quelleg-Referenz am Block, damit der Treiber die
      // POSITION eines Einfuegens am echten Fenster belegen kann (welches Medium in
      // welchem Slot steht). Muster wie data-element-id an der Zeilenliste (#248).
      data-ref={zeile.ref ?? ""}
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
        opacity: isDragging ? 0.85 : 1,
      }}
      title={zeile.art === 'fehlt' ? 'Dauer unbestimmbar' : `${beschriftung.dauerText}`}
    >
      <span>{beschriftung.dauerText}</span>
      <span style={{ opacity: 0.7 }}>{beschriftung.art}</span>
    </div>
  );
}
