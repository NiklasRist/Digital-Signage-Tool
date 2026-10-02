/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #261.
// [composer] Modul-Wurzel: die Bausteine anordnen und verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: ba232e8e875c96c3
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import { useEffect, useState, type JSX } from 'react'

import type { Marke } from '../../shared/contracts/marke'
import type { Listenelement, Project } from '../../shared/contracts/project'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { Uebergabe } from './reparatur-optionen'
import type { MedienImportStarter } from './medien-import'
import { aufSichtGeaendert, holeSicht, type Projektsicht } from './projektzustand'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ordneNeuOptimistisch } from './liste-reorder'
import { entferneElementAusListe } from './element-entfernen'
import { baueReglerModell, begrenze, uebernehmeGrenzen, type ReglerModell } from './dauer-regler'
import { berechneGesamtlaenge, formatiereLaenge, frameDauer } from './gesamtlaenge'

/**
 * Was diese Wurzel aus ANDEREN Renderer-Modulen braucht und nicht importieren darf
 * (Entscheidung E1: modulübergreifend reisen nur Typen, keine Aufrufe).
 */
export interface ComposerVerdrahtung {
  /** Der Medien-Dialog samt Import-Auftraegen (#204, `app-shell`). Wird an #228
   *  durchgereicht; diese Wurzel oeffnet KEINEN Dialog selbst. */
  starteMedienImport: MedienImportStarter
  /** Der Reparatur-Stand, den die Shell haelt (#201). null = nie gestartet.
   *  Wird NUR GELESEN – diese Wurzel haelt ihn NICHT (s. #259, ENTSCHIEDEN 5). */
  reparatur: ReparaturStand | null
  /** Meldet der Shell einen neu gerechneten Stand (#201 `uebernimmStand`). */
  meldeReparaturStand: (stand: ReparaturStand) => void
  /** Reicht eine Uebergabe aus #133 an die Shell weiter (#201 `uebernimmUebergabe`).
   *  Diese Wurzel fuehrt eine Uebergabe NIEMALS selbst aus (s. STOPP). */
  meldeUebergabe: (an: Uebergabe) => void
}

/**
 * ZEICHENGLEICH zu `ComposerWurzelProps` in #244 (`src/renderer/app-shell/inhalte.tsx`) – die Naht
 * ist geschlossen: #244 fuehrt seit #255/#256 dieselben sechs Felder und belegt `verdrahtung`
 * aus `umgebung.composerVerdrahtung`. Ohne dieses Buendel waere der Medien-Import nicht anstossbar
 * (#228 verlangt den Starter als Parameter) und der Reparatur-Modus nicht mit der Shell verbunden
 * (#201 haelt den Stand und die laufende Uebergabe, #256 fuehrt sie aus).
 * Weicht die tatsaechliche Fassung in #244 hiervon ab, ist das ein Vertragsfehler an der Naht
 * zwischen zwei Modulen: MELDEN, NICHT eigenmaechtig anpassen und NICHT #244 aendern.
 */
export interface ComposerWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  marke: Marke
  verdrahtung: ComposerVerdrahtung
}

/** Die Modul-Wurzel des `composer`. Wird von #244 als `wurzeln.composer` uebergeben. */
export function ComposerWurzel(p: ComposerWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet - der Hoerer bleibt.
    return <div data-testid="composer-inaktiv" style={{ display: 'none' }} />
  }
  return <ComposerInterna projekt={p.projekt} verdrahtung={p.verdrahtung} />
}

const FEHLERFARBE = '#e5634d'
const TAKTFARBE = '#d9a441'

export function ComposerInterna({
  projekt,
  verdrahtung,
}: {
  projekt: ProjektZugang
  verdrahtung: ComposerVerdrahtung
}): JSX.Element {
  const [sicht, setzeSicht] = useState<Projektsicht>(() => projekt.hole())
  const [modell, setzeModell] = useState<ReglerModell | null>(null)
  const [grenzen, setzeGrenzen] = useState<{ anfang: number; ende: number } | null>(null)

  useEffect(() => projekt.aufGeaendert(setzeSicht), [projekt])

  const inhalt: Project | null = sicht.projekt
  const liste = inhalt?.liste ?? []

  useEffect(() => {
    setzeModell(null)
    setzeGrenzen(null)
  }, [inhalt?.id])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const bewegt = (ereignis: DragEndEvent): void => {
    const aktiv = ereignis.active.id
    const ueber = ereignis.over?.id
    if (typeof aktiv === 'string' && typeof ueber === 'string') {
      void ordneNeuOptimistisch(aktiv, ueber)
    }
  }

  const lese = (element: Listenelement): void => {
    const asset = inhalt?.assets.find((eintrag) => eintrag.id === element.ref) ?? null
    const ergebnis = baueReglerModell(element, asset)
    if (ergebnis.ok) {
      setzeModell(ergebnis.wert)
      setzeGrenzen({ anfang: ergebnis.wert.anfang, ende: ergebnis.wert.ende })
    } else {
      setzeModell(null)
      setzeGrenzen(null)
    }
  }

  const uebernehme = async (): Promise<void> => {
    if (modell === null || grenzen === null || inhalt === null) return
    const element = inhalt.liste.find((eintrag) => eintrag.id === modell.elementId)
    if (element === undefined) return
    const geklemmt = begrenze(modell, grenzen.anfang, grenzen.ende)
    await uebernehmeGrenzen(element, geklemmt.anfang, geklemmt.ende)
  }

  const gesamt = berechneGesamtlaenge([...liste])

  return (
    <div
      data-testid="composer-wurzel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 8, gap: 8 }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>
          {gesamt.ok
            ? `Gesamt: ${formatiereLaenge(gesamt.wert.sekunden)}`
            : 'Gesamtdauer unbestimmbar'}
          {gesamt.ok && gesamt.wert.warnung && (
            <span style={{ color: TAKTFARBE, marginLeft: 8 }}>(über 30 Minuten)</span>
          )}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          data-testid="composer-medien-import"
          onClick={() => {
            if (inhalt === null) return
            void verdrahtung.starteMedienImport(inhalt.id, null)
          }}
        >
          Medien importieren
        </button>
      </div>

      {sicht.ladefehler !== null && (
        <div data-testid="composer-ladefehler" style={{ color: FEHLERFARBE, fontSize: 12 }}>
          {sicht.ladefehler.meldung}
        </div>
      )}

      {inhalt === null ? (
        <div data-testid="composer-kein-projekt" style={{ color: '#8f8f8f', fontSize: 12 }}>
          Kein Projekt geladen – im Reiter Projekte öffnen.
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={bewegt}>
            <SortableContext items={liste.map((eintrag) => eintrag.id)} strategy={horizontalListSortingStrategy}>
              <ul data-testid="composer-liste" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12 }}>
                {liste.map((element, index) => (
                  <Zeile key={element.id} element={element} index={index} auswaehlen={() => lese(element)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {liste.length === 0 && (
            <div data-testid="composer-leer" style={{ color: '#8f8f8f', fontSize: 12 }}>
              Leere Wiedergabeliste
            </div>
          )}

          {modell !== null && (
            <div data-testid="composer-regler" style={{ borderTop: '1px solid #444', paddingTop: 8 }}>
              <Regler
                modell={modell}
                wert={grenzen}
                setzeWert={setzeGrenzen}
                uebernehmen={() => void uebernehme()}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Zeile({
  element,
  index,
  auswaehlen,
}: {
  element: Listenelement
  index: number
  auswaehlen: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: element.id })
  const einzeln = frameDauer(element)
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`composer-zeile-${index}`}
      onClick={auswaehlen}
      style={{
        padding: '2px 0',
        cursor: 'grab',
        color: einzeln.ok ? undefined : FEHLERFARBE,
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    >
      {element.art === 'video' ? 'Video' : 'Segment'} · Element {index + 1}
      {einzeln.ok ? '' : ' (Dauer unbestimmbar)'}
    </li>
  )
}

function Regler({
  modell,
  wert,
  setzeWert,
  uebernehmen,
}: {
  modell: ReglerModell
  wert: { anfang: number; ende: number } | null
  setzeWert: (wert: { anfang: number; ende: number } | null) => void
  uebernehmen: () => void
}): JSX.Element {
  if (wert === null) return <div />
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
      <span>Anfang</span>
      <input
        type="number"
        step="0.001"
        min={modell.untergrenze}
        max={modell.obergrenze}
        value={Number(wert.anfang.toFixed(3))}
        data-testid="regler-anfang"
        onChange={(ereignis) => setzeWert({ anfang: Number(ereignis.target.value), ende: wert.ende })}
      />
      <span>Ende</span>
      <input
        type="number"
        step="0.001"
        min={modell.untergrenze}
        max={modell.obergrenze}
        value={Number(wert.ende.toFixed(3))}
        data-testid="regler-ende"
        onChange={(ereignis) => setzeWert({ anfang: wert.anfang, ende: Number(ereignis.target.value) })}
      />
      <button type="button" data-testid="regler-uebernehmen" onClick={uebernehmen}>
        Übernehmen
      </button>
      <button
        type="button"
        data-testid="regler-loeschen"
        onClick={() => void entferneElementAusListe(modell.elementId)}
      >
        Element entfernen
      </button>
    </div>
  )
}

