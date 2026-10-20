// [queue-panel] Modul-Wurzel: die Warteschlangen-Leiste zusammensetzen
//
// Die Wurzel nimmt KEINE Eigenschaften entgegen (der Rahmen #195 erwartet den Schlitz
// parameterlos) und beschafft ihren Bestand selbst ueber #205/#208. Sie haelt den
// Klappzustand, die Rueckfrage und die eine Meldung - alles Fachliche steht in
// `leisten-montage.ts`; diese Datei ordnet an und stellt dar.

import { useEffect, useRef, useState, type JSX } from 'react'

import type { AuftragArt } from '../../shared/contracts/auftrag'
import { ANFANGS_SICHT, baueAuftragsSichtAuf, type AuftragsSicht } from './auftrags-sicht'
import {
  ANFANGS_FORTSCHRITT,
  baueRenderFortschrittAuf,
  beschreibeFortschritt,
  type RenderFortschritt,
} from './fortschritt'
import {
  aktuelleRenderId,
  LEERE_LEISTEN_LAGE,
  meldeLeistenFehler,
  oeffneRueckfrage,
  schalteKlappzustand,
  schliesseRueckfrage,
  verwirfLeistenMeldung,
  type LeistenLage,
} from './leisten-montage'
import {
  beschriftung,
  brauchtBestaetigung,
  fuehreQueueAktionAus,
  moeglicheAktion,
  rueckfrageText,
} from './entfernen'
import { Liste } from './liste'
import type { AuftragsZeile } from './listen-zeilen'
import { LeisteZeile } from './leiste-zeile'
import { uebersetzeFehler } from './fehlertexte'
import {
  darfWiederholen,
  WIEDERHOLEN_BESCHRIFTUNG,
  wiederholeAuftrag,
  wiederholenHinweis,
} from './wiederholen'

/** Lesbarer Grund fuer eine geworfene Ursache - ohne Annahme ueber ihren Typ. */
function grundText(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Modul-Wurzel des `queue-panel`. Sie nimmt KEINE Eigenschaften entgegen - der Rahmen
 * (#195) erwartet den Schlitz als `warteschlangenLeiste: () => JSX.Element`, und die Leiste
 * beschafft ihren gesamten Bestand selbst ueber #205.
 */
export function WarteschlangenLeiste(): JSX.Element {
  const [sicht, setSicht] = useState<AuftragsSicht>(ANFANGS_SICHT)
  const [fortschritt, setFortschritt] = useState<RenderFortschritt>(ANFANGS_FORTSCHRITT)
  const [lage, setLage] = useState<LeistenLage>(LEERE_LEISTEN_LAGE)

  // Die Sicht als Referenz: `leseAktuelleRenderId` wird bei JEDEM Fortschritts-Ereignis
  // neu gerufen und muss dann den AKTUELLEN Bestand lesen - nie den beim Aufbau
  // eingefrorenen (DoD zu #208).
  const sichtRef = useRef<AuftragsSicht>(ANFANGS_SICHT)

  // Ab dem Abbau wird keine Antwort einer laufenden Bedienung mehr gemeldet (DoD:
  // "Abbau, waehrend ein fuehreQueueAktionAus noch laeuft").
  const abgebaut = useRef(false)

  useEffect(() => {
    abgebaut.current = false
    // Reihenfolge ist Vertrag: ERST die Auftrags-Sicht (#205, holt einmal und
    // abonniert danach), DANN der feine Fortschritt (#208). Der Aufbau haengt an der
    // Lebensdauer der Wurzel, NICHT am Aufklappen (ENTSCHIEDEN 2).
    const meldeSicht = (neu: AuftragsSicht): void => {
      sichtRef.current = neu
      setSicht(neu)
    }
    const meldeAbSicht = baueAuftragsSichtAuf(meldeSicht)
    const meldeAbFortschritt = baueRenderFortschrittAuf(
      () => aktuelleRenderId(sichtRef.current),
      setFortschritt,
    )

    return () => {
      abgebaut.current = true
      // Beide Abmeldungen, je genau einmal (Invariante 2 des Meilensteins).
      meldeAbSicht()
      meldeAbFortschritt()
    }
  }, [])

  /** Eine abgelehnte oder geworfene Bedienung wird zu GENAU EINER Meldung. */
  const melde = (code: string, meldung: string): void => {
    if (abgebaut.current) return
    setLage((bisher) => meldeLeistenFehler(bisher, code, meldung))
  }

  const fuehreAus = (auftragId: string): void => {
    void (async () => {
      try {
        const ergebnis = await fuehreQueueAktionAus(auftragId)
        if (abgebaut.current) return
        if (ergebnis.ok) {
          setLage((bisher) => schliesseRueckfrage(bisher))
          return
        }
        // Der Code reist UNVERAENDERT weiter - keine eigene Uebersetzung.
        melde(ergebnis.fehler.code, ergebnis.fehler.meldung)
      } catch (ursache) {
        melde('unbekannter_fehler', grundText(ursache))
      }
    })()
  }

  const wiederhole = (zeile: AuftragsZeile): void => {
    void (async () => {
      try {
        const ergebnis = await wiederholeAuftrag(zeile.auftragId)
        if (abgebaut.current) return
        if (!ergebnis.ok) {
          melde(ergebnis.fehler.code, ergebnis.fehler.meldung)
        }
      } catch (ursache) {
        // #207 faengt einen werfenden Schalter NICHT ab - hier wird gefangen.
        melde('unbekannter_fehler', grundText(ursache))
      }
    })()
  }

  /** Die Schalter UND der Fehlertext einer Zeile (ENTSCHIEDEN 5). Wirft nie. */
  const zeileSchalter = (zeile: AuftragsZeile): JSX.Element | null => {
    const art: AuftragArt = zeile.art
    const fehlertext = zeile.fehler === null ? null : uebersetzeFehler(zeile.fehler, art)
    const aktion = moeglicheAktion(zeile.auftrag)
    const wiederholbar = darfWiederholen(zeile.auftrag)

    if (fehlertext === null && aktion === null && !wiederholbar) {
      return null
    }

    return (
      <span data-testid={`queue-schalter-${zeile.auftragId}`} style={{ display: 'inline-flex',
        alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
        {aktion !== null && (
          <button
            type="button"
            onClick={() => {
              if (brauchtBestaetigung(aktion)) {
                setLage((bisher) => oeffneRueckfrage(bisher, {
                  auftragId: zeile.auftragId,
                  aktion,
                  text: rueckfrageText(zeile.auftrag),
                }))
                return
              }
              fuehreAus(zeile.auftragId)
            }}
          >
            {beschriftung(aktion)}
          </button>
        )}
        {wiederholbar && (
          <>
            <button type="button" onClick={() => wiederhole(zeile)}>
              {WIEDERHOLEN_BESCHRIFTUNG}
            </button>
            <span>{wiederholenHinweis(zeile.auftrag)}</span>
          </>
        )}
        {fehlertext !== null && (
          <span data-testid={`queue-fehler-${zeile.auftragId}`}>
            <strong>{fehlertext.titel}</strong> {fehlertext.handlung}
          </span>
        )}
      </span>
    )
  }

  // Der feine Fortschritt gehoert zu einem LAUFENDEN Render. Ohne laufenden Render wird
  // er nicht gezeigt: sonst bliebe nach dem Ende eines Laufs "Wird zusammengefuegt" unter
  // "Warteschlange leer" stehen (am echten Fenster gemessen, 20.10.2026). Der Endzustand
  // kommt aus `Auftrag.status` - aus dem Fortschritt wird nichts abgeleitet.
  const fortschrittText = aktuelleRenderId(sicht) === null
    ? ''
    : beschreibeFortschritt(fortschritt)
  const rueckfrage = lage.rueckfrage

  return (
    <footer
      data-testid="queue-panel"
      style={{
        flex: '0 0 auto',
        minHeight: '32px',
        borderTop: '1px solid #444',
        background: '#1b1b1b',
        color: '#e2e2e2',
        fontSize: '12px',
      }}
    >
      <LeisteZeile
        sicht={sicht}
        aufgeklappt={lage.aufgeklappt}
        aufKlappenUmschalten={() => setLage((bisher) => schalteKlappzustand(bisher))}
      />

      {fortschrittText !== '' && (
        <div data-testid="queue-panel-fortschritt" style={{ padding: '0 8px 4px' }}>
          {fortschrittText}
        </div>
      )}

      {lage.meldung !== null && (
        <div
          data-testid="queue-panel-meldung"
          role="alert"
          style={{ display: 'flex', gap: '8px', padding: '4px 8px', color: '#f5aeaf' }}
        >
          <span>{lage.meldung.meldung}</span>
          <button
            type="button"
            data-testid="queue-panel-meldung-verwerfen"
            onClick={() => setLage((bisher) => verwirfLeistenMeldung(bisher))}
          >
            Schliessen
          </button>
        </div>
      )}

      {lage.aufgeklappt && (
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <Liste sicht={sicht} zeileSchalter={zeileSchalter} />
        </div>
      )}

      {rueckfrage !== null && (
        <div
          data-testid="queue-panel-rueckfrage"
          role="dialog"
          aria-modal="true"
          style={{ padding: '8px', borderTop: '2px solid #FF4040', background: '#2f2e2e' }}
        >
          <p data-testid="queue-panel-rueckfrage-text" style={{ margin: '0 0 8px' }}>
            {rueckfrage.text}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              data-testid="queue-panel-rueckfrage-bestaetigen"
              style={{ background: '#FF4040', color: '#fff', border: 'none', padding: '4px 10px' }}
              onClick={() => {
                const auftragId = rueckfrage.auftragId
                setLage((bisher) => schliesseRueckfrage(bisher))
                fuehreAus(auftragId)
              }}
            >
              Bestätigen
            </button>
            <button
              type="button"
              data-testid="queue-panel-rueckfrage-abbrechen"
              onClick={() => setLage((bisher) => schliesseRueckfrage(bisher))}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </footer>
  )
}
