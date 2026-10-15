// Handgeschrieben zu Issue #227 - der zweite Baustein des Issues (die Ableitung steht
// in `bibliothek-ansicht.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE
// Zieldatei an). DÜNN: Die Ansicht haelt keinen Zustand, sortiert nichts, filtert
// nichts und fuehrt nur EINE Operation aus - `fuegeElementHinzu` (#123), die das
// Element selbst ans Ende der Sicht haengt.

import type { JSX } from 'react'
import type { Listenelement, Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { MedienEintrag, AktionsEintrag } from './bibliothek-ansicht'
import { baueMedienEintraege, baueAktionsEintraege, zaehleFehlende } from './bibliothek-ansicht'
import { fuegeElementHinzu } from './element-hinzufuegen'
import { AktionAnlegen, type AktionAnlegenEingabe } from './aktion-anlegen.tsx'
// #413: Die Karten/Zeilen werden als Drag-QUELLEN zur Zeitleiste (#412) - der Klick-Weg
// bleibt UNVERAENDERT (zweiter Weg, nicht der einzige). Ein DndContext holt sie erst,
// wenn #414 die Flaeche montiert; bis dahin laufen die Bestands-Specs unveraendert.
import { useDraggable } from '@dnd-kit/core'

export interface BibliothekEigenschaften {
  projekt: Project
  aufImportieren: () => void
  aufMediumLoeschen: (assetId: string) => void
  aufFehler: (code: string, meldung: string) => void
  /** #415 (Variante a): der Sicht-Schreiber (Wrapped-Zugangs-`setzeListe`, #244-Huelle).
   *  PFICHT - ohne ihn haette JEDES hier angelegte Element keinen Undo-Schritt. */
  sichtSchreiber: (liste: Listenelement[]) => void
  /** #418: das hervorgehobene Medium (nach dem Import standardmaessig das neue Video). */
  ausgewaehltesId?: string | null
  /** #418: Klick auf eine Medienzeile macht sie zur Auswahl. */
  aufWaehlen?: (assetId: string) => void
  /** #416: die nutzbaren Vorlagen fuer das Inline-Anlegen einer Aktion. */
  vorlagen?: readonly Vorlage[]
  /** #416: legt eine Aktion an (Titel + Vorlage; Marke = Projekt-Standardmarke). */
  aufAktionAnlegen?: (eingabe: AktionAnlegenEingabe) => void
}

/**
 * Die Medien-Bibliothek des composers (TK 9.7.1/9.7.2). Zwei getrennte Bereiche:
 * Medien und Aktionen (ENTSCHIEDEN 7) - beides mündet in dieselbe `referenz` von
 * `fuegeElementHinzu`, diese Datei unterscheidet dabei NICHT (eine Operation fuer
 * beide Faelle, TK 9.5.2).
 *
 * ENTSCHIEDEN 2: NICHTS wird herausgefiltert - ein fehlendes Medium und eine kaputte
 * Aktion bleiben sichtbar UND hinzufügbar (gekennzeichnet ja, gesperrt nein).
 * ENTSCHIEDEN 3: Kein <video> in dieser Ansicht - kein Frame-Weg neben #128.
 */
export function Bibliotheksansicht(p: BibliothekEigenschaften): JSX.Element {
  // #422: Ein Projekt hat genau EIN Video. Der Medien-Bereich heisst "Video" und zeigt
  // NUR Video-Assets; Bilder sind Motiv einer Aktion (action-editor) und erscheinen hier
  // nicht mehr. Das Video ist automatisch Listeneintrag - es gibt fuer es KEIN
  // "Zur Liste hinzufuegen" mehr (das bleibt fuer AKTIONEN).
  const videos = baueMedienEintraege(p.projekt).filter((eintrag) => eintrag.typLabel === 'Video')
  const aktionen = baueAktionsEintraege(p.projekt)
  const fehlende = zaehleFehlende(videos)

  return (
    <div data-testid="bibliothek">
      {fehlende > 0 && (
        <div data-ton="hervorgehoben" data-testid="bibliothek-hinweis">
          {fehlende} Medium{fehlende === 1 ? '' : 'e'} fehlt{fehlende === 1 ? '' : 'en'}
        </div>
      )}

      <h2>Video</h2>
      <button type="button" onClick={p.aufImportieren} data-testid="video-importieren">
        Video importieren
      </button>
      {videos.length === 0 ? (
        <p data-testid="video-leer">Noch kein Video - importieren Sie eines.</p>
      ) : (
        <ul data-testid="video-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {videos.map((eintrag) => (
            <Videozeile
              key={eintrag.asset.id}
              eintrag={eintrag}
              aufMediumLoeschen={p.aufMediumLoeschen}
              ausgewaehlt={eintrag.asset.id === (p.ausgewaehltesId ?? null)}
              aufWaehlen={p.aufWaehlen}
            />
          ))}
        </ul>
      )}

      <h2>Aktionen</h2>
      {/* #416: Inline-Erst-Anlage - Titel + Vorlage, ohne Reiterwechsel. Die neue Aktion
          erscheint sofort in der Liste darunter (Sicht-Pflege ueber den Zugang). */}
      {p.aufAktionAnlegen !== undefined && (
        <AktionAnlegen vorlagen={p.vorlagen ?? []} aufAnlegen={p.aufAktionAnlegen} />
      )}
      {aktionen.length === 0 ? (
        <p data-testid="aktionen-leer">Noch keine Aktionen - legen Sie oben eine an.</p>
      ) : (
        <ul data-testid="aktionen-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {aktionen.map((eintrag) => (
            <Aktionszeile key={eintrag.aktion.id} eintrag={eintrag} aufFehler={p.aufFehler} sichtSchreiber={p.sichtSchreiber} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface VideozeileEigenschaften {
  eintrag: MedienEintrag
  aufMediumLoeschen: (assetId: string) => void
  /** #418: hervorgehoben? */
  ausgewaehlt: boolean
  aufWaehlen?: (assetId: string) => void
}

function Videozeile(p: VideozeileEigenschaften): JSX.Element {
  const fehlt = p.eintrag.zustand === 'fehlt'
  // #422 (User-Weisung 15.10.2026): Ein Projekt hat EIN Video. Es ist automatisch in
  // der Wiedergabeliste - deshalb gibt es hier KEIN "Zur Liste hinzufuegen" (dieses
  // bleibt allein den Aktions-Zeilen). Import/Loeschen stehen im Bereichskopf bzw. hier.
  return (
    <li
      data-testid={`medium-${p.eintrag.asset.id}`}
      data-ausgewaehlt={p.ausgewaehlt ? 'true' : 'false'}
      onClick={p.aufWaehlen === undefined ? undefined : () => p.aufWaehlen?.(p.eintrag.asset.id)}
      style={p.ausgewaehlt ? { outline: '2px solid #e5634d', outlineOffset: -2 } : undefined}
    >
      <div data-ton={fehlt ? 'hervorgehoben' : 'ruhig'}>
        {/* Videos tragen in dieser Ansicht KEIN Vorschaubild (ENTSCHIEDEN 3/#128) -
            der Zweig bleibt fuer den Fall, dass ein Eintrag doch eine URL traegt. */}
        {p.eintrag.vorschauUrl ? (
          <img
            src={p.eintrag.vorschauUrl}
            alt={p.eintrag.bezeichnung}
            style={{ width: '64px', height: '36px', objectFit: 'cover' }}
          />
        ) : (
          <span>{p.eintrag.typLabel}</span>
        )}
        <span>{p.eintrag.bezeichnung}</span>
        {fehlt && <span> · fehlt</span>}
        <button type="button" onClick={() => p.aufMediumLoeschen(p.eintrag.asset.id)}>
          Löschen
        </button>
      </div>
    </li>
  )
}

interface AktionszeileEigenschaften {
  eintrag: AktionsEintrag
  aufFehler: (code: string, meldung: string) => void
  sichtSchreiber: (liste: Listenelement[]) => void
}

function Aktionszeile(p: AktionszeileEigenschaften): JSX.Element {
  // #413/#417: Die AKTIONS-Zeile ist die (einzige) Drag-QUELLE der Kernachse - die
  // User-Weisung 15.10.2026 stellt klar: der Drag in die Zeitleiste ist fuer AKTIONEN
  // gedacht, nicht fuer Bilder/Videos. `referenz` ist die aktionId (#123/#411).
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `quelle-aktion-${p.eintrag.aktion.id}`,
    data: { referenz: p.eintrag.aktion.id },
  })
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`aktion-${p.eintrag.aktion.id}`}
      // userSelect: die Aktions-Zeile ist Text - ohne das startet ein Ziehen mit
      // Textauswahl statt als Drag (Gegenprobe am echten Fenster, #417).
      style={{ cursor: 'grab', opacity: isDragging ? 0.6 : 1, userSelect: 'none' }}
    >
      <div data-ton={p.eintrag.kaputt ? 'hervorgehoben' : 'ruhig'}>
        <span>{p.eintrag.bezeichnung}</span>
        {p.eintrag.kaputt && <span> · defekt</span>}
        <button type="button" onClick={() => void hinzufuegen(p.eintrag.aktion.id, p.aufFehler, p.sichtSchreiber)}>
          Zur Liste hinzufügen
        </button>
      </div>
    </li>
  )
}

/**
 * ENTSCHIEDEN 6: Hinzufügen ruft `fuegeElementHinzu` und tut sonst NICHTS - kein
 * Anhängen an die Sicht (#123 tut das selbst), kein optimistisches Einfügen, kein
 * zweiter Versuch. Ein Fehler geht UNVERAENDERT an `aufFehler` (Fehlerpfade).
 */
async function hinzufuegen(
  referenz: string,
  aufFehler: (code: string, meldung: string) => void,
  sichtSchreiber: (liste: Listenelement[]) => void,
): Promise<void> {
  const ergebnis = await fuegeElementHinzu(referenz, undefined, sichtSchreiber)
  if (!ergebnis.ok) {
    aufFehler(ergebnis.fehler.code, ergebnis.fehler.meldung)
  }
}