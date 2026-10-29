// S5 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N5).
//
// Der EINE Zeitleisten-Zug: der Drag-Zustand der Composer-Wurzel (neuZug, aktiveKante,
// laedtKante, bandZiel, der Zeiger-Start und der Messraum `korbRef`) samt den
// vier DndContext-Handlern. Die MESSUNG liegt rein in `spalt-drop.ts`/`band-aufnahme.ts`;
// hier steht nur ihr Nebeneinander. Zustand und Schreibwege bleiben an EINER Stelle -
// geschrieben wird ausschliesslich ueber den hereingereichten Sicht-Schreiber (#243).
//
// #442 (Entscheidung 29.10.2026): Ein Drop auf den KOERPER eines Video-Blocks legt
// IMMER eine Unterbrechung an der Zeitstelle an (das Video pausiert, die Aktion laeuft,
// danach laeuft das Video weiter - TK 9.2.9). Die frühere Vorlagen-Heuristik
// (`vollflaeche` -> Unterbrechung, sonst Band-Abschnitt) ist damit entfallen; das Band
// wird ausschliesslich in der Band-Bearbeitung des Elements gepflegt, nicht per Drop.
// Vor/nach einem Block (Kante) bleibt der sequenzielle Weg.

import { useEffect, useRef, useState, type RefObject } from 'react'

import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import type { Listenelement, Project } from '../../shared/contracts/project'
import { baueZeitleistenZeilen } from './zeitleiste.tsx'
import { baueEinfugeKanten, leseKantenIndex, liestReferenz, waehleKanteAus } from './spalt-drop'
import { fuegeElementHinzu } from './element-hinzufuegen'
import { ordneNeuOptimistisch } from './liste-reorder'
import { fuegeUnterbrechungEin, spieleZeitBeiSequenzzeit, videoSekunden } from './unterbrechungs-aufnahme'
import { setzeElementUnterbrechungen } from './unterbrechungs-bearbeiten'
import { bandZielAus, bandZeitImVideo, startdauerFuerBandabschnitt } from './band-aufnahme'

/** #417: Layout-Vorschub je Zeitleisten-Block = Kantenbreite (10 px, zeitleiste.tsx) +
 *  ZWEI Luecken (je 2 px, `gap: 2` in korb UND in der Block-Gruppe). Er hebt den
 *  Zeiger-Raum (mit Kanten) auf den Modell-Raum von `waehleKanteAus` (Summe der
 *  Blockbreiten, s. amUeber). 10 + 2 + 2 = 14. */
const KANTEN_VORSCHUB_PX = 14

export interface ZeitleistenZugEingaben {
  /** Die Kennung des offenen Projekts - wechselt sie, faellt das Band-Ziel weg. */
  projektId: string | null
  /** Der aktuelle Listenstand; jede Aenderung erzeugt neue Handler mit frischem Wert. */
  liste: readonly Listenelement[]
  /** #428: das Zoom-Mass (px je Sekunde) - Bild UND Drop-Messung nutzen denselben Wert. */
  pxProSekunde: number
  /** Frischer Projektstand (nie ein gemerkter Wert) - fuer die Band-Aufnahme. */
  holeProjekt: () => Project | null
  /** Der Sicht-Schreiber des umhuelleten Zugangs (#243) - EIN Undo-Schritt je Schreibvorgang. */
  setzeListe: (liste: Listenelement[]) => void
  /** Der EINE Wurzel-Melder (Naht N2). */
  melde: (code: string, meldung: string) => void
}

export interface ZeitleistenZug {
  neuZug: string | null
  aktiveKante: number | null
  laedtKante: number | null
  /** #425: die Kennung des Video-Blocks unter dem Zeiger (Ziel der Unterbrechung). */
  bandZiel: string | null
  /** #414: der Korb der Zeitleiste - der MESSRAUM fuer `waehleKanteAus`. */
  korbRef: RefObject<HTMLDivElement | null>
  amDragStart: (ereignis: DragStartEvent) => void
  amUeber: (ereignis: DragOverEvent) => void
  amEnde: (ereignis: DragEndEvent) => void
  amDragAbbruch: () => void
}

export function verwendeZeitleistenZug(eingaben: ZeitleistenZugEingaben): ZeitleistenZug {
  const { projektId, liste, pxProSekunde, holeProjekt, setzeListe, melde } = eingaben

  const [neuZug, setzeNeuZug] = useState<string | null>(null)
  const [aktiveKante, setzeAktiveKante] = useState<number | null>(null)
  const [laedtKante, setzeLaedtKante] = useState<number | null>(null)
  // #425: das Ziel des Drops im Video-Koerper.
  const [bandZiel, setzeBandZiel] = useState<string | null>(null)
  // #437: die GESPIELTE Videozeit unter dem Zeiger (Zeitstelle der Unterbrechung).
  const [unterbrechungsZeit, setzeUnterbrechungsZeit] = useState<number | null>(null)
  const zeigerStartX = useRef<number | null>(null)
  const korbRef = useRef<HTMLDivElement | null>(null)

  // #425/#437: Beim Projektwechsel faellt das Ziel weg - ein Element des alten Projekts
  // ist im neuen nicht mehr vorhanden (dieselbe Regel, die zuvor die Wurzel trug).
  useEffect(() => {
    setzeBandZiel(null)
    setzeUnterbrechungsZeit(null)
  }, [projektId])

  // #437: EINE Aktion als UNTERBRECHUNG in das Video aufnehmen. Seit der Entscheidung zu
  // #442 (29.10.2026) ist das der EINE Weg fuer einen Drop auf den Video-Koerper; die
  // Zeitstelle wird geprueft und die Liste gebaut. Geschrieben wird ueber
  // setzeElementUnterbrechungen (#426); die Sicht-Korrektur geht ueber den
  // Wrapped-Zugang (EIN Undo-Schritt, #243).
  const nehmeAktionAlsUnterbrechungAuf = (
    videoId: string,
    aktionId: string,
    zeitSekunden: number | null,
  ): void => {
    const frisch = holeProjekt()
    if (frisch === null) return
    const element = frisch.liste.find((eintrag) => eintrag.id === videoId)
    if (element === undefined || element.art !== 'video') return
    const aktion = frisch.aktionen.find((eintrag) => eintrag.id === aktionId)
    if (aktion === undefined) return
    const gesamt = videoSekunden(element)
    if (gesamt === null || zeitSekunden === null) {
      melde('keine_zeitstelle', 'Ohne brauchbare Zeitstelle laesst sich keine Unterbrechung anlegen.')
      return
    }
    const dauer = startdauerFuerBandabschnitt(aktion.standardDauer, frisch.standardSegmentdauer)
    const entwurf = fuegeUnterbrechungEin(
      element.unterbrechungen ?? [],
      aktion.id,
      dauer,
      zeitSekunden,
      gesamt,
    )
    if (!entwurf.ok) {
      melde('unterbrechung_nicht_moeglich', entwurf.meldung)
      return
    }
    void setzeElementUnterbrechungen(element.id, entwurf.unterbrechungen).then((antwort) => {
      if (!antwort.ok) {
        melde(antwort.fehler.code, antwort.fehler.meldung)
        return
      }
      // Die Sicht NACH dem await frisch holen (kein gemerkter Stand) und GENAU EIN
      // setzeListe - das ist der eine Undo-Schritt ueber den Wrapped-Zugang (#243).
      const aktuell = holeProjekt()
      if (aktuell === null) return
      const neu = antwort.wert
      setzeListe(aktuell.liste.map((eintrag) => (eintrag.id === neu.id ? neu : eintrag)))
    })
  }

  // #414: der DnD-Verband auf der Wurzel (aus #412 uebernommen, auf den gemeinsamen
  // Kontext gehoben; die Routing-Regeln sind woertlich die #412-Regeln).
  const amDragStart = (ereignis: DragStartEvent): void => {
    // NUR ein Drag MIT Referenz (Neu-Einfuegen, #413) oeffnet die Kanten.
    const referenz = liestReferenz(ereignis.active.data.current)
    setzeNeuZug(referenz)
    setzeBandZiel(null)
    setzeUnterbrechungsZeit(null)
    const aktivator = ereignis.activatorEvent as MouseEvent
    if (typeof aktivator?.clientX === 'number') zeigerStartX.current = aktivator.clientX
  }

  const amUeber = (ereignis: DragOverEvent): void => {
    // Messbruecke zu `waehleKanteAus` (#412-Signatur): Zeiger-x (Start + delta) im
    // Zeitleisten-Raum; gescrollte Korbe inklusive. Ohne Messstand Rueckfall auf den
    // Droppable-Index (`kante-N`).
    if (neuZug === null) return
    const korb = korbRef.current
    if (korb === null || zeigerStartX.current === null) {
      setzeAktiveKante(leseKantenIndex(ereignis.over?.id))
      setzeBandZiel(null)
      setzeUnterbrechungsZeit(null)
      return
    }
    const umriss = korb.getBoundingClientRect()
    if (umriss.width === 0 && umriss.height === 0) {
      setzeAktiveKante(leseKantenIndex(ereignis.over?.id))
      setzeBandZiel(null)
      setzeUnterbrechungsZeit(null)
      return
    }
    const zeilen = baueZeitleistenZeilen(liste, pxProSekunde)
    const xImKontext = zeigerStartX.current + ereignis.delta.x - umriss.left + korb.scrollLeft
    const kanten = baueEinfugeKanten(zeilen.length)
    // #417: `waehleKanteAus` rechnet die Grenzen als SUMME der uebergebenen Breiten. Der
    // Zeiger-x liegt aber im echten Layout, in dem zwischen zwei Bloecken eine Kante (10 px)
    // und ZWEI Luecken (je 2 px) stehen. Ohne den Vorschub je Block liegen Modellgrenzen und
    // sichtbare Kanten auseinander - bei kurzen Bloecken um eine ganze Kante. Deshalb traegt
    // die uebergebene "Breite" den Layout-Vorschub Block + Kante + zwei Luecken.
    const gemessen = waehleKanteAus(kanten, xImKontext, (index) => (zeilen[index]?.breitePx ?? 64) + KANTEN_VORSCHUB_PX)
    setzeAktiveKante(gemessen ?? leseKantenIndex(ereignis.over?.id))
    // #425: Steht der Zeiger im KOERPER eines VIDEO-Blocks, wird der Drop eine
    // Unterbrechung an der Zeitstelle (nicht sequenziell). Die Messung liegt rein in
    // band-aufnahme.ts.
    const breiten = zeilen.map((zeile) => zeile.breitePx)
    setzeBandZiel(bandZielAus(zeilen, breiten, xImKontext, KANTEN_VORSCHUB_PX))
    // #428/#437: dazu die ZEITSTELLE im Video-Koerper, umgerechnet in die GESPIELTE
    // Videozeit - Unterbrechungen liegen im SEQUENZ-Block (Video0 · Aktion1 · Video1 …),
    // nicht auf der Wanduhr.
    const zeitZiel = bandZeitImVideo(zeilen, breiten, xImKontext, KANTEN_VORSCHUB_PX, pxProSekunde)
    const zielId = zeitZiel?.elementId
    const zielElement = zielId === undefined ? undefined : liste.find((eintrag) => eintrag.id === zielId)
    setzeUnterbrechungsZeit(
      zeitZiel !== null && zielElement !== undefined
        ? spieleZeitBeiSequenzzeit(zielElement, zeitZiel.zeitSekunden)
        : null,
    )
  }

  const amEnde = (ereignis: DragEndEvent): void => {
    setzeNeuZug(null)
    setzeAktiveKante(null)
    // #425: Das Video-Ziel VOR dem Zuruecksetzen lesen - der Drop entscheidet daran.
    const zielVideo = bandZiel
    // #437: ebenso die gespielte Zeitstelle der Unterbrechung.
    const zielUnterbrechung = unterbrechungsZeit
    setzeBandZiel(null)
    setzeUnterbrechungsZeit(null)
    // Sortier-Drag EINES BESTANDELEMENTS (keine Referenz): der Reorder-Weg (#122).
    const referenz = liestReferenz(ereignis.active.data.current)
    if (referenz === null) {
      const aktiv = ereignis.active.id
      const ueber = ereignis.over?.id
      if (typeof aktiv !== 'string' || typeof ueber !== 'string') return
      ordneNeuOptimistisch(aktiv, ueber, setzeListe)
      return
    }
    // #425/#442: Drop auf dem VIDEO-Koerper -> Unterbrechung an der Zeitstelle; die
    // Video-Elementdauer bleibt unberuehrt (TK 9.2.9). Auf einem Segment-Koerper ist
    // `zielVideo` null; dann laeuft der Drop wie bisher an die gemessene Kante
    // (sequenziell davor/danach).
    if (zielVideo !== null) {
      nehmeAktionAlsUnterbrechungAuf(zielVideo, referenz, zielUnterbrechung)
      return
    }
    // NEU-Drag (#413): Einfuegen an der Kante (#411-Mutation, nicht optimistisch).
    let index = aktiveKante
    if (index === null) index = leseKantenIndex(ereignis.over?.id)
    if (index === null) return
    setzeLaedtKante(index)
    void fuegeElementHinzu(referenz, index, setzeListe)
      .then((ergebnis) => {
        if (!ergebnis.ok) {
          melde(ergebnis.fehler.code, ergebnis.fehler.meldung)
        }
      })
      .finally(() => setzeLaedtKante(null))
  }

  const amDragAbbruch = (): void => {
    setzeNeuZug(null)
    setzeAktiveKante(null)
    setzeBandZiel(null)
    setzeUnterbrechungsZeit(null)
  }

  return {
    neuZug,
    aktiveKante,
    laedtKante,
    bandZiel,
    korbRef,
    amDragStart,
    amUeber,
    amEnde,
    amDragAbbruch,
  }
}
