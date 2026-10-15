// Handgeschrieben zu Issue #227 - der zweite Baustein des Issues (die Ableitung steht
// in `bibliothek-ansicht.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE
// Zieldatei an). DÜNN: Die Ansicht haelt keinen Zustand, sortiert nichts, filtert
// nichts und fuehrt nur EINE Operation aus - `fuegeElementHinzu` (#123), die das
// Element selbst ans Ende der Sicht haengt.

import type { JSX } from 'react'
import type { Listenelement, Project } from '../../shared/contracts/project'
import type { MedienEintrag, AktionsEintrag } from './bibliothek-ansicht'
import { baueMedienEintraege, baueAktionsEintraege, zaehleFehlende } from './bibliothek-ansicht'
import { fuegeElementHinzu } from './element-hinzufuegen'
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
  const medien = baueMedienEintraege(p.projekt)
  const aktionen = baueAktionsEintraege(p.projekt)
  const fehlende = zaehleFehlende(medien)

  return (
    <div data-testid="bibliothek">
      {fehlende > 0 && (
        <div data-ton="hervorgehoben" data-testid="bibliothek-hinweis">
          {fehlende} Medium{fehlende === 1 ? '' : 'e'} fehlt{fehlende === 1 ? '' : 'en'}
        </div>
      )}

      <h2>Medien</h2>
      <button type="button" onClick={p.aufImportieren} data-testid="medien-importieren">
        Medien importieren
      </button>
      {medien.length === 0 ? (
        <p data-testid="medien-leer">Noch keine Medien - importieren Sie zuerst ein Medium.</p>
      ) : (
        <ul data-testid="medien-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {medien.map((eintrag) => (
            <Medienzeile
              key={eintrag.asset.id}
              eintrag={eintrag}
              aufMediumLoeschen={p.aufMediumLoeschen}
              aufFehler={p.aufFehler}
              sichtSchreiber={p.sichtSchreiber}
            />
          ))}
        </ul>
      )}

      <h2>Aktionen</h2>
      {aktionen.length === 0 ? (
        <p data-testid="aktionen-leer">Noch keine Aktionen - legen Sie welche im Aktions-Editor an.</p>
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

interface MedienzeileEigenschaften {
  eintrag: MedienEintrag
  aufMediumLoeschen: (assetId: string) => void
  aufFehler: (code: string, meldung: string) => void
  sichtSchreiber: (liste: Listenelement[]) => void
}

function Medienzeile(p: MedienzeileEigenschaften): JSX.Element {
  const fehlt = p.eintrag.zustand === 'fehlt'
  // #417 (User-Weisung 15.10.2026): Medien (Bilder/Videos) sind KEINE Drag-Quelle.
  // Der Drag in die Zeitleiste war fuer AKTIONEN gedacht (und spaeter fuer Banner);
  // Bilder/Videos kommen weiter ueber den Klick-Weg ("Zur Liste hinzufuegen") und
  // den Import in die Liste - der Weg bleibt unveraendert.
  return (
    <li data-testid={`medium-${p.eintrag.asset.id}`}>
      <div data-ton={fehlt ? 'hervorgehoben' : 'ruhig'}>
        {/* ENTSCHIEDEN 4: Bilder direkt als media://-img (TK 9.5.7); die URL gibt es
            nur bei typ bild UND zustand ok (ENTSCHIEDEN 5). */}
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
        <button type="button" onClick={() => void hinzufuegen(p.eintrag.asset.id, p.aufFehler, p.sichtSchreiber)}>
          Zur Liste hinzufügen
        </button>
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