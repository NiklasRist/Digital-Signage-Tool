import { useEffect, useRef, useState, type JSX } from "react";

import {
  useDndMonitor,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Listenelement, Project, Einblendung } from "../../shared/contracts/project";
import type { Vorlage } from "../../shared/contracts/vorlage";
import type { Marke } from "../../shared/contracts/marke";
import type { Aktion } from "../../shared/contracts/aktion";
import { baueMotivEintraege, holeMotiv } from "../gemeinsam/aktions-motiv";
import { bereiteMotiveVor } from "../template-canvas/bild-laden";
import { autoScrollSchritt } from "./zeit-autoscroll";
import { frameDauer } from "./gesamtlaenge";
import { RENDER_PROFILE } from "../../shared/contracts/render-profile";
import { EA_PX_PRO_SEKUNDE, baueZeitachse, baueBandspur, frameAusXPx } from "./zeitband";
import { klickModusAus, AUSWAHLKANTE, type KlickModus } from "./mehrfachauswahl";
import { AbspielMarke } from "./abspiel-marke.tsx";
// 01.11.2026: die Gegenrichtung der Marke - ein Klick auf die Zeitachse setzt die
// Wiedergabe an diese Stelle ("zeitleiste und videowiedergabe gesynct", Niklas).
import { fordereSprung } from "../gemeinsam/abspielsprung";
// #437: die Marken der Unterbrechungen liegen sequenziell im Video-Block.
import { unterbrechungsMarken } from "./unterbrechungs-aufnahme";
// #433: der Video-Block zeigt die EINZELBILDER des Videos als Filmstreifen.
import { VideoFilmstreifen } from "./video-filmstreifen";

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
   *  dort entstuende eine UNTERBRECHUNG an der Zeitstelle (#442), nicht sequenziell.
   *  null = kein Video-Ziel. Die Messung liegt in `band-aufnahme.ts` (#425); hier wird
   *  nur gezeichnet. */
  bandZiel?: string | null
  /** #428: das Zoom-Mass (px je Sekunde); Bild und Drop-Messung nutzen DENSELBEN Wert. */
  pxProSekunde?: number
  /** #428: den Zoom um eine Stufe aendern (die Wurzel haelt den Wert). */
  aufZoom?: (richtung: -1 | 1) => void
  /** #437: eine Unterbrechung am Video entfernen (Index in `element.unterbrechungen`). */
  aufUnterbrechungEntfernen?: (elementId: string, index: number) => void
  /** #442: eine Unterbrechung an eine neue GESPIELTE Zeitstelle schieben. */
  aufUnterbrechungVerschieben?: (elementId: string, index: number, zeitstelle: number) => void
  /** #392: die IDs der ausgewaehlten Elemente (Anzeige). */
  ausgewaehlteIds?: readonly string[]
  /** #392: ein Klick auf einen Block meldet die Auswahl nach oben (Bedienart inklusive). */
  aufElementGewaehlt?: (elementId: string, modus: KlickModus) => void
  /** 06.11.2026: die nutzbaren Vorlagen fuer das Motiv der Aktions-Boxen. Fehlt die
   *  Liste, bleibt die Box eine Farbflaeche - kein erfundenes Bild. */
  vorlagen?: readonly Vorlage[]
  /** 06.11.2026: die Marke einer Aktion fuer ihr Motiv. Fehlt der Zugang, bleibt die
   *  Box eine Farbflaeche (dieselbe Haltung wie in der Bibliothek). */
  holeMarke?: (markeId: string) => Marke | null
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
  aufUnterbrechungEntfernen,
  aufUnterbrechungVerschieben,
  ausgewaehlteIds = [],
  aufElementGewaehlt,
  vorlagen,
  holeMarke,
}: ZeitleistenEigenschaften): JSX.Element {
  // #457: der Scroll-Container. Die Abspielmarke sitzt IM Inhalt (absolute), der
  // Ausschnitt folgt ihr nur bei laufender Uhr.
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 06.11.2026: Auto-Scroll beim Ziehen. dnd-kit scrollt den Container zwar auch, aber
  // erst an der FENSTERkante und ohne eigene Geschwindigkeit; die Regel in
  // `zeit-autoscroll.ts` macht die Kante der ZEITLEISTE zum Ausloeser. Am Fenster
  // gemessen (dieselbe Geste): ohne die Regel 2112 px in 1,2 s, mit ihr 3380 px.
  // Der Zeiger kommt aus dem Drag-START plus Delta - dafuer gibt es kein zweites
  // Maus-Listener-Paar neben dnd-kit.
  const zeigerRef = useRef<{ x: number; y: number } | null>(null)
  const [zieht, setzeZieht] = useState(false)
  useDndMonitor({
    onDragStart: () => {
      zeigerRef.current = null
      setzeZieht(true)
    },
    onDragMove: (ereignis) => {
      // `activatorEvent` ist der urspruengliche Zeigerdruck; `delta` der Weg seitdem.
      // Ein Tastatur-Drag hat keinen Zeiger - dann bleibt der Wert null (kein Scrollen).
      const start = ereignis.activatorEvent
      if (start instanceof MouseEvent) {
        zeigerRef.current = {
          x: start.clientX + ereignis.delta.x,
          y: start.clientY + ereignis.delta.y,
        }
      }
    },
    onDragEnd: () => {
      zeigerRef.current = null
      setzeZieht(false)
    },
    onDragCancel: () => {
      zeigerRef.current = null
      setzeZieht(false)
    },
  })
  useEffect(() => {
    if (!zieht) return
    const behaelter = scrollRef.current
    if (behaelter === null) return
    let raf = 0
    let letzteZeit = 0
    const lauf = (zeit: number): void => {
      raf = requestAnimationFrame(lauf)
      // ~60 Bilder/s reichen; ein zweiter Lauf je Bild waere nur Rechenzeit.
      if (zeit - letzteZeit < 16) return
      letzteZeit = zeit
      const zeiger = zeigerRef.current
      if (zeiger === null) return
      const kasten = behaelter.getBoundingClientRect()
      const schritt = autoScrollSchritt(zeiger, {
        links: kasten.left,
        rechts: kasten.right,
        oben: kasten.top,
        unten: kasten.bottom,
      })
      if (schritt !== 0) behaelter.scrollLeft += schritt
    }
    raf = requestAnimationFrame(lauf)
    return () => cancelAnimationFrame(raf)
  }, [zieht])

  // 06.11.2026: Die Motive der Aktions-Boxen brauchen geladene Bilder. Dieselbe
  // Vorbereitung wie in der Bibliothek; der Zaehler loest EINEN Zeichenlauf aus.
  const [motivBereit, setzeMotivBereit] = useState(0)
  useEffect(() => {
    if (projekt === null || holeMarke === undefined) return
    const eintraege = baueMotivEintraege(projekt)
    if (eintraege.length === 0) return
    let abgemeldet = false
    bereiteMotiveVor(projekt.id, eintraege)
      .then(() => {
        if (!abgemeldet) setzeMotivBereit((stand) => stand + 1)
      })
      .catch(() => {
        // Kein Bild ist ein sichtbarer Zustand; ein Wurf waere ein Absturz der Leiste.
      })
    return () => {
      abgemeldet = true
    }
  }, [projekt?.id, projekt?.aktionen, projekt?.assets, holeMarke])

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
  // #433: die Listenelemente selbst - der Filmstreifen des Video-Blocks braucht ref/trim.
  const elementeNachId = new Map((projekt?.liste ?? []).map((element) => [element.id, element]))

  return (
    <div
      ref={scrollRef}
      data-testid="zeitleiste"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        overflowX: 'auto',
        minHeight: 80,
        // Gerahmt wie Buehne und Rail: die drei Flaechen sollen dieselbe Kante zeigen.
        background: '#141418',
        border: '1px solid #2c2c34',
        borderRadius: 8,
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
          die Bloecke, darum sitzt sie deckungsgleich. Tick-Schritt und Label folgen dem Zoom.
          01.11.2026: Sie ist zugleich die SPRUNG-Flaeche - ein Klick setzt die Wiedergabe
          auf diese Stelle (derselbe Massstab wie die Marke, `frameAusXPx`). */}
      <div
        data-testid="zeitleiste-zeitachse"
        title="Klick setzt die Wiedergabe an diese Stelle"
        onClick={(ereignis) => {
          const kasten = ereignis.currentTarget.getBoundingClientRect()
          fordereSprung(frameAusXPx(ereignis.clientX - kasten.left, pxProSekunde))
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: LUECKE_PX,
          height: 18,
          width: '100%',
          cursor: 'pointer',
        }}
      >
        {/* 02.11.2026 (Niklas: "Lineal ueber die volle Breite"): Die Grundlinie laeuft
            ueber die GANZE Flaeche, auch rechts vom letzten Block. Vorher endete die
            Achse mit dem Inhalt und liess dort eine leere Flaeche stehen (am Bild
            gesehen: rund 130 px). Die GRADUIERUNG bleibt beim Inhalt - rechts davon gibt
            es keine Zeit, weil das Projekt dort endet (Entscheidung Niklas, 02.11.2026).
            Absolut positioniert, damit sie die Segmentbreiten NICHT verschiebt: die Achse
            muss weiter deckungsgleich ueber den Bloecken sitzen. */}
        <span
          aria-hidden="true"
          data-testid="zeitleiste-lineal"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: '#3a3a44' }}
        />
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
        <div ref={korbRef} style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 2, minHeight: ZEILE_HOEHE_PX }}>
          {neuZug !== null && <KantenBlock nummer={0} aktiv={aktiveKante === 0} laedt={laedtKante === 0} />}
          {zeilen.map((zeile, index) => (
            <span key={zeile.elementId} style={{ display: 'flex', alignItems: 'stretch', gap: 2, padding: 0 }}>
              <ZeilenBlock
                zeile={zeile}
                index={index}
                istBandZiel={zeile.elementId === bandZiel}
                einblendung={einblendungen.get(zeile.elementId) ?? null}
                pxProSekunde={pxProSekunde}
                projekt={projekt}
                element={elementeNachId.get(zeile.elementId) ?? null}
                vorlagen={vorlagen}
                holeMarke={holeMarke}
                motivBereit={motivBereit}
                scrollRef={scrollRef}
                aufUnterbrechungEntfernen={aufUnterbrechungEntfernen}
                aufUnterbrechungVerschieben={aufUnterbrechungVerschieben}
                ausgewaehlt={ausgewaehlteIds.includes(zeile.elementId)}
                aufGewaehlt={
                  aufElementGewaehlt === undefined
                    ? undefined
                    : (modus) => aufElementGewaehlt(zeile.elementId, modus)
                }
              />
              {neuZug !== null && (
                <KantenBlock nummer={index + 1} aktiv={aktiveKante === index + 1} laedt={laedtKante === index + 1} />
              )}
            </span>
          ))}
          {zeilen.length === 0 && neuZug === null && (
            <div data-testid="zeitleiste-leer" style={{ color: '#8f8f8f', fontSize: 12 }}>
              Noch nichts eingeordnet – eine Aktion aus der Bibliothek hierher ziehen.
            </div>
          )}
          {/* #457: die Abspielmarke - absolut im Inhalt, ueber den Bloecken. */}
          <AbspielMarke pxProSekunde={pxProSekunde} scrollRef={scrollRef} />
        </div>
      </SortableContext>
    </div>
  );
}

/**
 * Das Motiv einer Aktion als Flaeche in einem Zeitleisten-Block (06.11.2026).
 *
 * WARUM EIN LOKALES CANVAS UND NICHT DAS GEMERKTE: `holeMotiv` liefert ein Canvas aus
 * dem Speicher. Dieselbe Aktion kann in mehreren Bloecken stehen (Unterbrechung + eigener
 * Block); ein Canvas kann nur an EINER Stelle im DOM haengen. Deshalb wird das gemerkte
 * Bild in ein eigenes Canvas kopiert - dieselbe Loesung wie in der Bibliothek.
 *
 * `cover` ist bindend: Ein 16:9-Motiv in einer 80 x 64 breiten Box wuerde sonst gequetscht.
 */
function AktionsMotiv({
  aktion,
  vorlagen,
  marke,
  bereit,
  hoehe = ZEILE_HOEHE_PX,
}: {
  aktion: Aktion
  vorlagen?: readonly Vorlage[]
  marke: Marke | null
  bereit: number
  hoehe?: number
}): JSX.Element {
  const flaeche = useRef<HTMLSpanElement | null>(null)
  // Die KONKRETE Vorlage haengt am Effekt, nicht die Liste: Der Composer reicht bei
  // jedem Rendern eine neue Liste herein; die Vorlagen-Objekte selbst bleiben stabil.
  const vorlage = vorlagen?.find((eintrag) => eintrag.id === aktion.vorlagenId) ?? null
  useEffect(() => {
    const ziel = flaeche.current
    if (ziel === null) return
    ziel.replaceChildren()
    if (vorlage === null || marke === null) return
    const klein = holeMotiv(aktion, vorlage, marke, hoehe)
    if (klein === null) return
    const eigen = document.createElement('canvas')
    eigen.width = klein.width
    eigen.height = klein.height
    eigen.getContext('2d')?.drawImage(klein, 0, 0)
    eigen.style.width = '100%'
    eigen.style.height = '100%'
    eigen.style.objectFit = 'cover'
    eigen.style.display = 'block'
    ziel.append(eigen)
  }, [aktion, vorlage, marke, bereit, hoehe])

  return (
    <span
      ref={flaeche}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#0d0d10',
        pointerEvents: 'none',
      }}
    />
  )
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
  projekt = null,
  element = null,
  aufUnterbrechungEntfernen,
  aufUnterbrechungVerschieben,
  ausgewaehlt = false,
  aufGewaehlt,
  vorlagen,
  holeMarke,
  motivBereit = 0,
  scrollRef,
}: {
  zeile: Awaited<ReturnType<typeof baueZeitleistenZeilen>>[number];
  index: number;
  istBandZiel?: boolean;
  einblendung?: Einblendung | null;
  pxProSekunde?: number;
  /** #433: das Projekt - der Video-Block holt daraus die Einzelbilder. */
  projekt?: Project | null;
  /** #433: das Listenelement selbst (Filmstreifen braucht `ref`/`trim`). */
  element?: Listenelement | null;
  /** 06.11.2026: Motiv der Aktions-Boxen (dieselbe Quelle wie die Bibliothek). */
  vorlagen?: readonly Vorlage[];
  holeMarke?: (markeId: string) => Marke | null;
  motivBereit?: number;
  /** 06.11.2026: der Scroll-Container - der eigene Unterbrechungs-Zug scrollt ihn. */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** #437: Unterbrechung entfernen (Index in `element.unterbrechungen`). */
  aufUnterbrechungEntfernen?: (elementId: string, index: number) => void;
  /** #442: Unterbrechung an eine neue gespielte Zeitstelle schieben. */
  aufUnterbrechungVerschieben?: (elementId: string, index: number, zeitstelle: number) => void;
  /** #392: dieser Block ist Teil der Mehrfachauswahl. */
  ausgewaehlt?: boolean;
  /** #392: Klick auf den Block (die Bedienart kommt aus dem Ereignis). */
  aufGewaehlt?: (modus: KlickModus) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: zeile.elementId })
  const beschriftung = zeilenBeschriftung(zeile, index)
  // SELBSTERKLAEREND (01.11.2026): Ein Block sagt, WAS er ist, nicht wie die Datenart
  // heisst. Vorher stand dort "segment"/"video" - die Sprache des Vertrags, nicht die
  // des Nutzers. Jetzt der Titel der Aktion; beim Video bleibt "Video".
  const aktionSegment =
    zeile.art === 'segment'
      ? (projekt?.aktionen.find((eintrag) => eintrag.id === zeile.ref) ?? null)
      : null
  const markeSegment =
    aktionSegment === null ? null : (holeMarke?.(aktionSegment.markeId) ?? null)
  const blockName =
    zeile.art === 'segment'
      ? (aktionSegment?.titel ?? 'Aktion')
      : zeile.art === 'video'
        ? 'Video'
        : null
  // #437: die Unterbrechungs-Marken des Video-Blocks (sequenzielle Positionen).
  const marken = zeile.art === 'video' && element !== null ? unterbrechungsMarken(element) : []
  // #442: welcher Kasten gerade am Zeiger haengt (nur Bild) - der Schreibvorgang
  // passiert EINMAL beim Loslassen. Seit 06.11.2026 traegt der Zug den Scroll-Stand
  // beim Start: Die Zeitleiste scrollt beim Ziehen, und der Kasten muss diesem Weg
  // folgen (sonst landete er an der alten Zeitstelle).
  const [zug, setzeZug] = useState<{
    index: number
    startX: number
    startScroll: number
    versatz: number
  } | null>(null)
  const zeigerRef = useRef<{ x: number; y: number } | null>(null)
  const ziehtAktion = zug !== null
  // 06.11.2026: Der EIGENE Zug einer Unterbrechung ist kein dnd-kit-Drag - der
  // Auto-Scroll der Zeitleiste sieht ihn nicht. Deshalb derselbe Lauf hier, mit dem
  // selben reinen `autoScrollSchritt`; der Versatz wird je Bild um den Scroll-Weg
  // ergaenzt, damit der Kasten unter dem Zeiger bleibt.
  useEffect(() => {
    if (!ziehtAktion) return
    const behaelter = scrollRef?.current ?? null
    if (behaelter === null) return
    let raf = 0
    let letzteZeit = 0
    const lauf = (zeit: number): void => {
      raf = requestAnimationFrame(lauf)
      if (zeit - letzteZeit < 16) return
      letzteZeit = zeit
      const zeiger = zeigerRef.current
      if (zeiger === null) return
      const kasten = behaelter.getBoundingClientRect()
      const schritt = autoScrollSchritt(zeiger, {
        links: kasten.left,
        rechts: kasten.right,
        oben: kasten.top,
        unten: kasten.bottom,
      })
      if (schritt === 0) return
      behaelter.scrollLeft += schritt
      setzeZug((alt) =>
        alt === null
          ? null
          : {
              ...alt,
              versatz: zeiger.x - alt.startX + (behaelter.scrollLeft - alt.startScroll),
            },
      )
    }
    raf = requestAnimationFrame(lauf)
    return () => cancelAnimationFrame(raf)
  }, [ziehtAktion, scrollRef])
  // #442: Nach dem Loslassen bleibt der Kasten an der NEUEN Stelle, bis der Main den
  // neuen Stand liefert. Ohne das springt er fuer einen Frame auf die alte Zeitstelle
  // zurueck ("glitcht kurz") - der Schreibweg ist asynchron.
  const [schwebend, setzeSchwebend] = useState<{ index: number; versatz: number; alteZeit: number } | null>(null)
  // Das Schweben endet, sobald der GESPEICHERTE Wert sich bewegt hat (Erfolg, auch
  // geklemmt) oder der Eintrag weg ist - nicht schon bei jedem neuen Projektobjekt.
  useEffect(() => {
    if (schwebend === null) return
    const gespeichert = element?.unterbrechungen?.[schwebend.index]
    if (gespeichert === undefined || gespeichert.zeitstelle !== schwebend.alteZeit) {
      setzeSchwebend(null)
    }
  }, [element?.unterbrechungen, schwebend])
  // Rueckfall: Schreibt der Main gar nicht (Fehler), darf der Kasten nicht ewig
  // neben seiner echten Stelle stehen.
  useEffect(() => {
    if (schwebend === null) return
    const frist = setTimeout(() => setzeSchwebend(null), 3000)
    return () => clearTimeout(frist)
  }, [schwebend])
  // #442 (Entscheidung 29.10.2026): ein Drop im Video-Koerper legt IMMER eine
  // Unterbrechung an - das Ziel traegt deshalb nur noch dieses eine Label (violett).
  const zielArt = istBandZiel ? 'Unterbrechung' : null
  const zielFarbe = '#b07ae5'
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
      // #425: sichtbares Drop-Ziel - der Drop hier wird eine Unterbrechung (#442).
      data-band-ziel={istBandZiel ? 'true' : 'false'}
      // #420: dieselbe Traeger-Konvention wie die #248-Listenzeile (data-element-id) -
      // so oeffnet EIN Selektor in der Wurzel das EINE KontextMenue fuer BEIDE Ansichten.
      // data-ref bleibt (die #414-Abnahme-Messgroesse).
      data-element-id={zeile.elementId}
      data-ref={zeile.ref ?? ""}
      // #392: die Auswahl ist in beiden Ansichten sichtbar (Testid-Messgroesse).
      data-ausgewaehlt={ausgewaehlt ? 'ja' : 'nein'}
      onClick={
        aufGewaehlt === undefined
          ? undefined
          : (ereignis) => aufGewaehlt(klickModusAus(ereignis))
      }
      style={{
        position: 'relative',
        width: zeile.breitePx,
        flex: '0 0 auto',
        height: ZEILE_HOEHE_PX,
        borderRadius: 4,
        padding: 4,
        fontSize: 10,
        overflow: 'hidden',
        cursor: 'grab',
        border: `1px solid ${istBandZiel ? zielFarbe : zeile.art === 'fehlt' ? '#e5634d' : '#3a3a3a'}`,
        outline: istBandZiel ? `2px solid ${zielFarbe}` : 'none',
        outlineOffset: -2,
        boxShadow: ausgewaehlt ? `inset 0 0 0 2px ${AUSWAHLKANTE}` : undefined,
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
      {/* #433: der Filmstreifen liegt HINTER dem Text (zIndex 0); der Text bleibt lesbar. */}
      {zeile.art === 'video' && projekt !== null && element !== null && (
        <VideoFilmstreifen
          projekt={projekt}
          element={element}
          breitePx={zeile.breitePx}
          hoehePx={ZEILE_HOEHE_PX}
        />
      )}
      {/* 06.11.2026: Ein eigener Aktions-Block traegt sein MOTIV, nicht nur seine Farbe.
          Niklas: „die aktionen sind schon in der leiste ... nur als lila boxen". Das Motiv
          kommt aus derselben Quelle wie die Bibliothek (`holeMotiv`). */}
      {aktionSegment !== null && (
        <>
          <AktionsMotiv
            aktion={aktionSegment}
            vorlagen={vorlagen}
            marke={markeSegment}
            bereit={motivBereit}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.58) 100%)',
            }}
          />
        </>
      )}
      {/* #437/#442: die Unterbrechungen als sichtbare Aktions-Kaesten ueber dem
          Filmstreifen - Video | Aktion | Video. Der Kasten selbst startet keinen Drag
          (stopPropagation); entfernt wird NUR ueber sein × (ein Fehlklick auf den
          Kasten loescht nichts mehr). */}
      {marken.map((marke) => {
        const aktion =
          projekt?.aktionen.find((eintrag) => eintrag.id === marke.aktionRef) ?? null
        const aktionMarke = aktion === null ? null : (holeMarke?.(aktion.markeId) ?? null)
        const titel = aktion?.titel ?? 'Aktion'
        return (
          <span
            key={marke.index}
            data-testid={`zeitleiste-unterbrechung-${index}-${marke.index}`}
            data-zeitstelle={marke.zeitstelle}
            title={`Unterbrechung: ${titel} · ${marke.dauerSekunden.toFixed(1)} s ab ${marke.zeitstelle.toFixed(2)} s (ziehen zum Verschieben)`}
            onPointerDown={(ereignis) => {
              // Kein Sortier-Drag des Blocks, kein Drop: der Kasten zieht sich selbst.
              ereignis.stopPropagation()
              if (aufUnterbrechungVerschieben === undefined) return
              zeigerRef.current = { x: ereignis.clientX, y: ereignis.clientY }
              ereignis.currentTarget.setPointerCapture?.(ereignis.pointerId)
              setzeSchwebend(null)
              setzeZug({
                index: marke.index,
                startX: ereignis.clientX,
                startScroll: scrollRef?.current?.scrollLeft ?? 0,
                versatz: 0,
              })
            }}
            onPointerMove={(ereignis) => {
              if (zug === null || zug.index !== marke.index) return
              ereignis.stopPropagation()
              zeigerRef.current = { x: ereignis.clientX, y: ereignis.clientY }
              setzeZug({
                ...zug,
                versatz:
                  ereignis.clientX -
                  zug.startX +
                  ((scrollRef?.current?.scrollLeft ?? 0) - zug.startScroll),
              })
            }}
            onPointerUp={(ereignis) => {
              if (zug === null || zug.index !== marke.index) return
              ereignis.stopPropagation()
              zeigerRef.current = null
              // Der Versatz enthaelt den SCROLL-Weg: Die Leiste hat waehrend des Zugs
              // gescrollt, und der Kasten hat sich mit ihr bewegt.
              const versatz =
                ereignis.clientX -
                zug.startX +
                ((scrollRef?.current?.scrollLeft ?? 0) - zug.startScroll)
              setzeZug(null)
              // Ein Klick ist kein Zug: unter 2 px passiert nichts.
              if (Math.abs(versatz) < 2) return
              setzeSchwebend({ index: marke.index, versatz, alteZeit: marke.zeitstelle })
              aufUnterbrechungVerschieben?.(zeile.elementId, marke.index, marke.zeitstelle + versatz / pxProSekunde)
            }}
            onPointerCancel={() => {
              zeigerRef.current = null
              setzeZug(null)
            }}
            style={{
              position: 'absolute',
              left: Math.max(0, Math.round(marke.startSekunden * pxProSekunde)),
              top: 0,
              width: Math.max(48, Math.round(marke.dauerSekunden * pxProSekunde)),
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '0 2px',
              overflow: 'hidden',
              borderLeft: '2px solid #b07ae5',
              borderRight: '2px solid #b07ae5',
              background: 'rgba(58, 42, 77, 0.96)',
              zIndex: 2,
              cursor: zug?.index === marke.index ? 'grabbing' : 'grab',
              transform:
                zug?.index === marke.index
                  ? `translateX(${zug.versatz}px)`
                  : schwebend?.index === marke.index
                    ? `translateX(${schwebend.versatz}px)`
                    : undefined,
            }}
          >
            {aktion !== null && (
              <>
                <AktionsMotiv
                  aktion={aktion}
                  vorlagen={vorlagen}
                  marke={aktionMarke}
                  bereit={motivBereit}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.62) 100%)',
                  }}
                />
              </>
            )}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 9,
                color: '#efe6fb',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {titel}
            </span>
            <button
              type="button"
              data-testid={`unterbrechung-entfernen-${index}-${marke.index}`}
              title={`Unterbrechung „${titel}" entfernen`}
              aria-label={`Unterbrechung „${titel}" entfernen`}
              onPointerDown={(ereignis) => ereignis.stopPropagation()}
              onClick={(ereignis) => {
                ereignis.stopPropagation()
                aufUnterbrechungEntfernen?.(zeile.elementId, marke.index)
              }}
              style={{
                position: 'relative',
                zIndex: 1,
                marginLeft: 'auto',
                flex: '0 0 auto',
                width: 14,
                height: 14,
                lineHeight: '12px',
                fontSize: 10,
                padding: 0,
                border: '1px solid #b07ae5',
                borderRadius: 2,
                background: '#241832',
                color: '#efe6fb',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </span>
        )
      })}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {beschriftung.dauerText}
        {zeile.art === 'video' && zeile.dauerSekunden !== null
          ? ` · ${Math.round(zeile.dauerSekunden * RENDER_PROFILE.fps)} F`
          : ''}
      </span>
      {spur !== null && (
        <span
          data-testid={`zeitleiste-bandspur-${index}`}
          style={{ position: 'relative', zIndex: 1, height: 8, width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 2, overflow: 'hidden' }}
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
      {/* Die Art-Bezeichnung braucht Platz: in einem 20-px-Block stand hier
          "video" untereinander in vier Zeilen (am Fenster gesehen). Unter 56 px
          Breite sagt der Block nur noch seine Dauer. */}
      {zeile.breitePx >= 56 && (
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            opacity: 0.7,
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {zielArt ?? blockName ?? beschriftung.art}
        </span>
      )}
    </div>
  );
}
