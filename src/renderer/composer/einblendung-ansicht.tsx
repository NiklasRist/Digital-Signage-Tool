// Issue #253 (M7-60) - einblendung-ansicht.tsx: die Bedienung des Werbebandes an
// GENAU EINEM Video-Element. So wenig Logik wie moeglich - die Fachlichkeit liegt
// in einblendung-ansicht.ts (rein), die Entwurfs-Operationen in
// einblendung-bearbeiten.ts (#129), die Wirkungs-Rechnung in einblendung-vorschau.ts
// (#130), das Dauerformat in element-zeile.ts (#249).
//
// Zentrale Verhaltenslinien:
//
// - Der Entwurf ist ein LOKALER Zustand (ENTSCHIEDEN 8): Solange nicht uebernommen
//   wird, aendert sich das Projekt nicht. Es gibt hier kein gleicheElementAb,
//   kein setzeProjekt, kein fuehreOptimistischAus - uebernehmeBand (#129) gleicht
//   die Sicht selbst nach (TK 9.7.4); ein zweiter Abgleich waere ein zweiter
//   Zeitpunkt.
//
// - EINE Vorlagen-Auswahl fuer das ganze Band (TK 9.2.8). Geboten wird
//   ausschliesslich, was waehlbareBandVorlagen (#129) liefert; diese Datei
//   filtert NICHT selbst.
//
// - ENTSCHIEDEN 4: Ein neuer Abschnitt startet mit STANDARD_ANZEIGEDAUER_SEKUNDEN
//   (#21), nicht als Literal.
//
// - Faellt die Uebernahme ab, bleibt der Entwurf stehen (Fehlerpfade): kein
//   Rollback, kein Schliessen.
//
// - Kaputte Abschnitte (Fall 3, TK 9.7.5) werden NUR gekennzeichnet. Keine
//   Fix-Option, kein automatisches Entfernen - die Reparatur gehoert dem
//   gefuehrten Modus (#132/#133).
//
// - ENTSCHIEDEN 9: Diese Ansicht schliesst sich NICHT selbst; der Aufrufer (#261)
//   verfuegt.
//
// - Kein IPC-Geruest dieser Art: kein rufeAuf, kein abonniere, kein KANAELE, kein
//   window-Zugriff. Der einzige Weg ueber die Prozessgrenze ist uebernehmeBand.
//
// - Umordnen: Pfeil-Knoepfe UND Drag-and-drop (Nachtrag 23.08., User-Entscheidung).
//   Beide Wege ruften genau gleich: verschiebeAbschnitt(entwurf, von, nach) - EINE
//   Quellen-Ordnung. Der DndContext lebt dem Vorbild #248 nach AUCH hier (die
//   Begraenzung auf eine Datei galt der Wiedergabeliste, nicht der Regel);
//   PointerSensor wie dort. Die Tastatur-Sensorik-Frage ist OFFEN und wird
//   gemeldet, nicht beantwortet.

import { useState, useCallback } from 'react'
import type { JSX } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Listenelement } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { KaputteStelle } from './kaputt-erkennung'
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten'
import {
  fuegeAbschnittAn,
  entferneAbschnitt,
  verschiebeAbschnitt,
  setzeAbschnittsDauer,
  wechsleBandVorlage,
  uebernehmeBand,
  waehlbareBandVorlagen,
} from './einblendung-bearbeiten'
import { planeBandAblauf } from './einblendung-vorschau'
import {
  entwurfAus,
  baueAbschnittZeilen,
  kaputteAbschnitte,
  baueWirkungsanzeige,
  bandVorlage,
  artLabel,
  istUebernehmbar,
  type AbschnittZeile,
} from './einblendung-ansicht'

export interface EinblendungAnsichtEigenschaften {
  /** Das VIDEO-Listenelement, dessen Band bearbeitet wird. Wird NUR gelesen. */
  element: Listenelement
  /** Die Aktions-Bibliothek des Projekts (#15). Reihenfolge = Bestandsreihenfolge. */
  aktionen: readonly Aktion[]
  /** Die nutzbaren Vorlagen (#155, ueber #154). Gefiltert wird HIER ueber
   *  waehlbareBandVorlagen (#129) - diese Datei filtert NICHT selbst. */
  vorlagen: readonly Vorlage[]
  /** Die kaputten Stellen, bereits gerechnet (#131). Diese Datei rechnet sie NICHT selbst. */
  stellen: readonly KaputteStelle[]
  /** Nach erfolgreicher Uebernahme: das vom Main zurueckgegebene Listenelement. */
  aufUebernommen: (element: Listenelement) => void
  aufAbbrechen: () => void
  /** Meldeweg fuer Fehler. Diese Datei zeigt NICHTS selbst an. */
  aufFehler: (code: string, meldung: string) => void
}

/** Eine Zeile innerhalb des SortableContext (der Ziehgriff lebt hier). */
function BandZeile({
  zeile,
  letztIndex,
  aufNachOben,
  aufNachUnten,
  aufEntfernen,
  eingabeText,
  aufEingabe,
  aufDauer,
}: {
  zeile: AbschnittZeile
  letztIndex: number
  aufNachOben: () => void
  aufNachUnten: () => void
  aufEntfernen: () => void
  eingabeText: string
  aufEingabe: (wert: string) => void
  aufDauer: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(zeile.index),
  })
  return (
    <li
      key={zeile.index}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <span data-testid="band-abschnitt-griff" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
        ⠿
      </span>
      {zeile.position}. {zeile.bezeichnung} &ndash; {zeile.dauerText} ({zeile.frames} Frames)
      {zeile.faelltAus && <span data-testid="abschnitt-faellt-aus"> [faellt aus]</span>}
      {zeile.angeschnitten && (
        <span data-testid="abschnitt-angeschnitten"> [abgeschnitten]</span>
      )}
      {zeile.kaputt && <span data-testid="abschnitt-kaputt"> [kaputt]</span>}

      <button type="button" disabled={zeile.index === 0} onClick={aufNachOben}>
        nach oben
      </button>
      <button type="button" disabled={zeile.index === letztIndex} onClick={aufNachUnten}>
        nach unten
      </button>
      <button type="button" onClick={aufEntfernen}>
        Entfernen
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={`Dauer des Abschnitts ${zeile.position}`}
        value={eingabeText}
        onChange={(ereignis) => aufEingabe(ereignis.target.value)}
        onBlur={aufDauer}
        onKeyDown={(taste) => {
          if (taste.key === 'Enter') aufDauer()
        }}
      />
    </li>
  )
}

/** Die Bedienung des Werbebandes an genau EINEM Video-Element. */
export function EinblendungAnsicht(p: EinblendungAnsichtEigenschaften): JSX.Element {
  // Der Startentwurf (ENTSCHIEDEN 2): die vorhandene Einblendung, sonst die ERSTE
  // aus waehlbareBandVorlagen (ENTSCHIEDEN 3 - keine Sortierung, keine Bevorzugung
  // des eingebauten). null heisst: kein Video ODER keine Band-Vorlage im Bestand;
  // statt der Bedienung steht dann ein Hinweis (Fehlerpfade-Tabelle).
  const [entwurf, setzeEntwurf] = useState(() => {
    const wahl = waehlbareBandVorlagen(p.vorlagen)
    return entwurfAus(p.element, wahl[0]?.id ?? null)
  })

  // Die vorgewaehlte Aktion fuer den naechsten Abschnitt: die ERSTE aus dem
  // Bestand, ohne Sortieren und ohne Filtern - dieselbe Haltung wie bei der
  // Vorlagen-Wahl (ENTSCHIEDEN 3).
  const [gewaehlteAktionRef, setzeGewaehlteAktionRef] = useState(
    () => p.aktionen[0]?.id ?? '',
  )
  // Der ROHE Eingabetext des Dauer-Feldes; in den Entwurf gelangt er nur als
  // gueltige endliche Zahl groesser 0 (Offene Frage: Dauer-Bereich - nur diese
  // vertragliche Minimum-Regel wird geprueft, keine erfundene Obergrenze).
  const [eingabeText, setzeEingabeText] = useState('')

  // Die zwei Hinweis-Faelle aus der Fehlerpfade-Tabelle.
  const keinVideo = p.element.art !== 'video'
  const keineBandVorlage = waehlbareBandVorlagen(p.vorlagen).length === 0

  // Die Wirkungs-Rechnung gehoert #130 (Frames sind die Wahrheit, Sekunden sind
  // Anzeige): gerufen mit dem Trim des ELEMENTS und den Abschnitten des
  // AKTUELLEN Entwurfs (DoD) - nichts wird hier nachgerechnet.
  const plan = planeBandAblauf(
    p.element.trimStart ?? 0,
    p.element.trimEnde ?? 0,
    entwurf?.abschnitte ?? [],
  )
  const zeilen =
    entwurf === null
      ? []
      : baueAbschnittZeilen(
          entwurf,
          p.aktionen,
          plan,
          kaputteAbschnitte(p.stellen, p.element.id),
        )
  const wirkung = baueWirkungsanzeige(plan)

  // Die gewaehlte Band-Vorlage FUERS ANZEIGEN (Name, Art, Hoehe) - reine
  // Ableitung. Eine fehlende Vorlage wird NIE still durch eine andere ersetzt
  // (Fehlerpfade: die Auswahl zeigt dann „keine").
  const angezeigteVorlage = entwurf === null ? null : bandVorlage(entwurf, p.vorlagen)
  const bandWahl = waehlbareBandVorlagen(p.vorlagen)

  /** Der EINZIGE Weg ueber die Prozessgrenze (#129). */
  const nehmeUeber = useCallback(async (): Promise<void> => {
    // Die Verengung zur Laufzeit: aus Sicht dieser Funktion kann der Entwurf
    // null sein - der Knopf-Guard allein verengt den Zustand nicht.
    if (entwurf === null || !istUebernehmbar(entwurf)) return
    const antwort = await uebernehmeBand(p.element.id, entwurf)
    if (antwort.ok) {
      // ENTSCHIEDEN 9/10: kein gleicheElementAb, kein Selbstschliessen.
      p.aufUebernommen(antwort.wert)
    } else {
      // Code UNVERAENDERT durchreichen; der Entwurf bleibt stehen (Fehlerpfade).
      p.aufFehler(antwort.fehler.code, antwort.fehler.meldung)
    }
  }, [entwurf, p])

  /** Eine Abschnittsdauer eintragen: nur bei endlicher Zahl groesser 0
   *  (Offene Frage: der fuer Abschnitte zulaessige Dauer-Bereich ist offen -
   *  geprueft wird hier nur die vertragliche Minimum-Regel). Ausgeloest beim
   *  Verlassen des Feldes (onBlur) ODER mit Enter; beide Wege enden am selben
   *  EINEN Eintrag, damit ein Wert nie doppelt ankommt. */
  function trageDauerEin(index: number): void {
    const zahl = Number(eingabeText.trim().replace(',', '.'))
    if (!Number.isFinite(zahl) || zahl <= 0 || entwurf === null) return
    setzeEntwurf(setzeAbschnittsDauer(entwurf, index, zahl))
    setzeEingabeText('')
  }

  /** Drag-and-drop: aus den dnd-IDs (Index-Zeichenketten) wird EIN Aufruf von
   *  verschiebeAbschnitt; dieselbe Quelle wie die Pfeil-Knoepfe. */
  const bewegt = useCallback((ereignis: DragEndEvent): void => {
    if (ereignis.over === null) return
    const von = Number(ereignis.active.id)
    const nach = Number(ereignis.over.id)
    if (!Number.isInteger(von) || !Number.isInteger(nach)) return
    setzeEntwurf((bisher) =>
      bisher === null ? bisher : verschiebeAbschnitt(bisher, von, nach),
    )
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // ----- Hinweis-Faelle aus der Fehlerpfade-Tabelle: Hinweis statt Bedienung -----

  if (keinVideo) {
    return (
      <div data-testid="einblendung-ansicht">
        <p data-testid="einblendung-hinweis">
          Das Werbeband gibt es nur an einem Video-Element. Parallele Baender gibt es
          nur bei Video-Elementen (TK 9.2.8); Segment-Elemente sind bereits
          vollflaechige Standbilder.
        </p>
      </div>
    )
  }

  if (entwurf === null || keineBandVorlage) {
    return (
      <div data-testid="einblendung-ansicht">
        <p data-testid="einblendung-hinweis">
          Fuer ein Werbeband wird eine Band-Vorlage gebraucht (Art &bdquo;split&ldquo;
          oder &bdquo;einblendung&ldquo;), aber im Vorlagen-Bestand liegt keine vor.
          Lege eine Vorlage im Reiter Vorlagen an und oeffne die Band-Bearbeitung
          erneut.
        </p>
      </div>
    )
  }

  // ----- Die Bedienung: EINE Vorlagen-Wahl, Wirkungs-Anzeige, Abschnitte -----

  return (
    <div data-testid="einblendung-ansicht">
      <h3>Werbeband zum Video-Element</h3>

      {/* Die EINE Vorlagen-Auswahl des ganzen Bandes (TK 9.2.8). Nur der Entwurf
          wird gewechselt; alle Abschnitte bleiben (wechsleBandVorlage). Art und
          Hoehe stehen sachlich mit dabei - eine Warnung vor dem Wechsel bleibt
          dem User entschieden (Offene Frage) und wird NICHT selbst gebaut. */}
      <label>
        Band-Vorlage:{' '}
        <select
          data-testid="band-vorlagen-wahl"
          value={entwurf.bandVorlageId}
          onChange={(ereignis) =>
            setzeEntwurf(wechsleBandVorlage(entwurf, ereignis.target.value))
          }
        >
          {angezeigteVorlage === null && (
            <option value="">keine (Vorlage fehlt im Bestand)</option>
          )}
          {bandWahl.map((vorlage: Vorlage) => (
            <option key={vorlage.id} value={vorlage.id}>
              {vorlage.name} &ndash; {artLabel(vorlage)} (Hoehe: {vorlage.höhe})
            </option>
          ))}
        </select>
      </label>

      {/* Die Wirkung - aus den ZAHLEN von #130, nicht hier nachgerechnet. */}
      <p data-testid="band-wirkung">
        {wirkung.warnung ? `! ${wirkung.text}` : wirkung.text}
      </p>
      {wirkung.ausfallText !== '' && (
        <p data-testid="band-ausfall">{wirkung.ausfallText}</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={bewegt}>
        <SortableContext
          items={zeilen.map((zeile) => String(zeile.index))}
          strategy={verticalListSortingStrategy}
        >
          <ul data-testid="band-abschnitte" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {zeilen.map((zeile) => (
              <BandZeile
                key={zeile.index}
                zeile={zeile}
                letztIndex={zeilen.length - 1}
                aufNachOben={() =>
                  setzeEntwurf(verschiebeAbschnitt(entwurf, zeile.index, zeile.index - 1))
                }
                aufNachUnten={() =>
                  setzeEntwurf(verschiebeAbschnitt(entwurf, zeile.index, zeile.index + 1))
                }
                aufEntfernen={() => setzeEntwurf(entferneAbschnitt(entwurf, zeile.index))}
                eingabeText={eingabeText}
                aufEingabe={setzeEingabeText}
                aufDauer={() => trageDauerEin(zeile.index)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Die Aktion-Auswahl fuer den naechsten Abschnitt: nur der Bestand, kein
          Sortieren, kein Filtern (ENTSCHIEDEN 3). */}
      <label>
        Abschnitt hinzufuegen:{' '}
        <select
          data-testid="abschnitt-aktions-wahl"
          value={gewaehlteAktionRef}
          onChange={(ereignis) => setzeGewaehlteAktionRef(ereignis.target.value)}
        >
          {p.aktionen.map((aktion: Aktion) => (
            <option key={aktion.id} value={aktion.id}>
              {aktion.titel}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-testid="abschnitt-hinzufuegen"
          disabled={gewaehlteAktionRef === ''}
          onClick={() => {
            // Genau EIN Aufruf mit der gewaehlten Referenz und der Konstante
            // aus #21 (ENTSCHIEDEN 4).
            setzeEntwurf(
              fuegeAbschnittAn(entwurf, gewaehlteAktionRef, STANDARD_ANZEIGEDAUER_SEKUNDEN),
            )
            setzeEingabeText('')
          }}
        >
          hinzufuegen
        </button>
      </label>

      <button type="button" onClick={() => p.aufAbbrechen()}>
        Abbrechen
      </button>
      {/* EIN Uebernehmen-Knopf, gesperrt laut istUebernehmbar; ein leerer Entwurf
          ist uebernehmbar und ENTFERNT die Einblendung (TK 9.5.3). */}
      <button
        type="button"
        data-testid="einblendung-uebernehmen"
        disabled={!istUebernehmbar(entwurf)}
        onClick={() => {
          void nehmeUeber()
        }}
      >
        Uebernehmen
      </button>
    </div>
  )
}
