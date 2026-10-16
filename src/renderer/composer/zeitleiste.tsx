import type { JSX } from "react";

import {
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Listenelement, Project, Einblendung } from "../../shared/contracts/project";
import { frameDauer } from "./gesamtlaenge";
import { RENDER_PROFILE } from "../../shared/contracts/render-profile";
import { EA_PX_PRO_SEKUNDE, baueZeitachse, baueBandspur } from "./zeitband";

const ZEILE_HOEHE_PX = 64
/** Die Lücke zwischen zwei Blöcken (identisch zum `gap` der Blockzeile) - die Zeitachse
 *  muss DIESELBE Lücke tragen, sonst rutscht sie gegen die Blöcke. */
const LUECKE_PX = 2

/** Baut die Zeilen der Zeitleiste in ARRAY-Reihenfolge; kein Sortieren, nur Anzeige-Klemmung.
 *  `pxProSekunde` ist das aktuelle Zoom-Mass (#428). */
export function baueZeitleistenZeilen(
  liste: readonly Listenelement[],
  pxProSekunde: number = EA_PX_PRO_SEKUNDE,
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
      breitePx: Math.max(24, Math.round((einzeln.wert / RENDER_PROFILE.fps) * pxProSekunde)),
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
  /** #425: die Kennung des Video-Blocks, ueber dem ein Aktion-Neuzug gerade steht -
   *  dort entstuende ein BAND-Abschnitt (nicht sequenziell). null = kein Band-Ziel.
   *  Die Messung liegt in `band-aufnahme.ts` (#425); hier wird nur gezeichnet. */
  bandZiel?: string | null
  /** #428: das Zoom-Mass (px je Sekunde); Bild und Drop-Messung nutzen DENSELBEN Wert. */
  pxProSekunde?: number
  /** #428: den Zoom um eine Stufe aendern (die Wurzel haelt den Wert). */
  aufZoom?: (richtung: -1 | 1) => void
}

export function Zeitleiste({
  projekt,
  neuZug,
  aktiveKante,
  laedtKante,
  korbRef,
  bandZiel = null,
  pxProSekunde = EA_PX_PRO_SEKUNDE,
  aufZoom,
}: ZeitleistenEigenschaften): JSX.Element {
  if (projekt === null) {
    return <div data-testid="zeitleiste-kein-projekt" />
  }

  const zeilen = baueZeitleistenZeilen(projekt?.liste ?? [], pxProSekunde)
  const ids = zeilen.map((zeile) => zeile.elementId)
  const achse = baueZeitachse(zeilen, pxProSekunde)
  // #428: die Einblendung je Video-Element - fuer die Band-Spur im Block.
  const einblendungen = new Map(
    (projekt?.liste ?? []).map((element) => [element.id, element.art === 'video' ? element.einblendung : null]),
  )

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
      {/* #428: Zoom-Steuerung (px/s). Bei hohem Zoom werden einzelne Frames sichtbar. */}
      {aufZoom !== undefined && (
        <div
          data-testid="zeitleiste-zoom"
          style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: '#9aa4b2' }}
        >
          <button type="button" data-testid="zeitleiste-zoom-aus" onClick={() => aufZoom(-1)}>
            Zoom −
          </button>
          <span data-testid="zeitleiste-zoom-wert">{`${pxProSekunde} px/s`}</span>
          <button type="button" data-testid="zeitleiste-zoom-ein" onClick={() => aufZoom(1)}>
            Zoom +
          </button>
        </div>
      )}
      {/* #428: die Zeitachse ueber der Blockzeile - gleiche Segmente/Luecken/Kanten wie
          die Bloecke, darum sitzt sie deckungsgleich. Tick-Schritt und Label folgen dem Zoom. */}
      <div
        data-testid="zeitleiste-zeitachse"
        style={{ display: 'flex', alignItems: 'flex-end', gap: LUECKE_PX, height: 18 }}
      >
        {neuZug !== null && <span style={{ flex: '0 0 auto', width: 10 }} />}
        {achse.map((segment, index) => (
          <span key={ids[index] ?? index} style={{ display: 'flex', gap: LUECKE_PX }}>
            <span style={{ flex: '0 0 auto', width: segment.breitePx, position: 'relative', height: 18 }}>
              {segment.ticks.map((tick) => (
                <span
                  key={`${index}-${tick.xPx}`}
                  style={{
                    position: 'absolute',
                    left: tick.xPx,
                    bottom: 0,
                    width: 1,
                    height: tick.beschriftet ? 10 : 5,
                    background: tick.beschriftet ? '#9aa4b2' : '#4a4a4a',
                  }}
                >
                  {tick.beschriftet && (
                    <span style={{ position: 'absolute', left: 2, bottom: 8, fontSize: 9, color: '#9aa4b2', whiteSpace: 'nowrap' }}>
                      {tick.text}
                    </span>
                  )}
                </span>
              ))}
            </span>
            {neuZug !== null && <span style={{ flex: '0 0 auto', width: 10 }} />}
          </span>
        ))}
      </div>
      {/* EIN DndContext (#414): er lebt auf der COMPOSER-WURZEL, damit Quellen
          (#413) und Kanten (#412) im SELBEN Kontext liegen; diese Komponente haengt
          ihr Sortable-Fragment und ihren Messraum (korbRef) ein. */}
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <div ref={korbRef} style={{ display: 'flex', alignItems: 'stretch', gap: 2, minHeight: ZEILE_HOEHE_PX }}>
          {neuZug !== null && <KantenBlock nummer={0} aktiv={aktiveKante === 0} laedt={laedtKante === 0} />}
          {zeilen.map((zeile, index) => (
            <span key={zeile.elementId} style={{ display: 'flex', alignItems: 'stretch', gap: 2, padding: 0 }}>
              <ZeilenBlock
                zeile={zeile}
                index={index}
                istBandZiel={zeile.elementId === bandZiel}
                einblendung={einblendungen.get(zeile.elementId) ?? null}
                pxProSekunde={pxProSekunde}
              />
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
  istBandZiel = false,
  einblendung = null,
  pxProSekunde = EA_PX_PRO_SEKUNDE,
}: {
  zeile: Awaited<ReturnType<typeof baueZeitleistenZeilen>>[number];
  index: number;
  istBandZiel?: boolean;
  einblendung?: Einblendung | null;
  pxProSekunde?: number;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: zeile.elementId })
  const beschriftung = zeilenBeschriftung(zeile, index)
  // #428: die Band-Abschnitte an ihren Zeitstellen - nur am Video, nur wenn ein Band da ist.
  const spur =
    zeile.art === 'video' && einblendung !== null
      ? baueBandspur(einblendung.abschnitte, zeile.dauerSekunden, pxProSekunde)
      : null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`zeitleiste-block-${index}`}
      // #425: sichtbares Band-Ziel - der Drop hier wird ein Band-Abschnitt.
      data-band-ziel={istBandZiel ? 'true' : 'false'}
      // #420: dieselbe Traeger-Konvention wie die #248-Listenzeile (data-element-id) -
      // so oeffnet EIN Selektor in der Wurzel das EINE KontextMenue fuer BEIDE Ansichten.
      // data-ref bleibt (die #414-Abnahme-Messgroesse).
      data-element-id={zeile.elementId}
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
        border: `1px solid ${istBandZiel ? '#e5a94d' : zeile.art === 'fehlt' ? '#e5634d' : '#3a3a3a'}`,
        outline: istBandZiel ? '2px solid #e5a94d' : 'none',
        outlineOffset: -2,
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
      <span>
        {beschriftung.dauerText}
        {zeile.art === 'video' && zeile.dauerSekunden !== null
          ? ` · ${Math.round(zeile.dauerSekunden * RENDER_PROFILE.fps)} F`
          : ''}
      </span>
      {spur !== null && (
        <span
          data-testid={`zeitleiste-bandspur-${index}`}
          style={{ position: 'relative', height: 8, width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 2, overflow: 'hidden' }}
        >
          {spur.segmente.map((segment, stelle) => (
            <span
              key={stelle}
              style={{ position: 'absolute', left: segment.startPx, width: segment.breitePx, top: 0, height: '100%', background: '#e5a94d', borderRight: '1px solid #1f1f1f' }}
            />
          ))}
          {spur.wiederholungen > 1 && (
            <span style={{ position: 'absolute', right: 1, top: -1, fontSize: 8, color: '#f2f2f2' }}>
              {`x${spur.wiederholungen}`}
            </span>
          )}
        </span>
      )}
      <span style={{ opacity: 0.7 }}>{istBandZiel ? 'Band' : beschriftung.art}</span>
    </div>
  );
}
