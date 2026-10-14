// Issue #249 (M7-56) - element-zeile.tsx: die Bedienelemente einer Zeile, so wenig
// Logik wie moeglich. EIN Bauteil fuer alle drei Elementarten (ENTSCHIEDEN 1, AD 4.4).
//
// KERNNACHWEIS (ENTSCHIEDEN 3): `uebernehmeGrenzen` (#125) wird GENAU EINMAL gerufen,
// beim Loslassen, und nur wenn `istVeraendert` es sagt. Waehrend der Geste laeuft nur
// `ziehe` (rein, kein IPC). Es gibt hier keine zweite Rollback-Regel: bei Ablehnung
// geht die Lage in die Ruhelage zurueck, die Sicht korrigiert #125 selbst.
//
// ENTSCHIEDEN 6: Das Werbeband wird hier NICHT bearbeitet - nur der Zugang
// (`aufEinblendungBearbeiten`). ENTSCHIEDEN 7: Entfernen fragt NICHT nach
// (undo-fähig, TK 9.13.1). ENTSCHIEDEN 9: Lehnt `baueReglerModell` ab, bleibt die
// Zeile bedienbar - Band-Zugang und Entfernen bleiben erreichbar (Fix-Optionen, TK 9.7.5).
//
// ENTSCHIEDEN 6a (Fall 3 aus TK 9.7.5): Nicht-leere `kaputteBandAbschnitte` markieren
// den Band-ZUGANG (die Zeile selbst gilt dabei nicht als kaputt); der Text nennt die
// ANZAHL. Der Wert wird hier nie nachgerechnet.

import { useEffect, useRef, useState, type JSX } from 'react'
import type { Listenelement } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { baueReglerModell, type ReglerModell } from './dauer-regler'
import {
  anteil,
  baueBandStatus,
  formatiereReglerDauer,
  istVeraendert,
  ruheLage,
  wertAusAnteil,
  ziehe,
  type Reglergriff,
  type ReglerLage,
} from './element-zeile'
import { entferneElementAusListe } from './element-entfernen'
import { uebernehmeGrenzen } from './dauer-regler'

export interface ElementBedienungEigenschaften {
  /** Das Listenelement dieser Zeile, aus der gemeinsamen Sicht (#121). Wird NUR gelesen. */
  element: Listenelement
  /** Das ueber `element.ref` aufgelöste Asset – nur bei `art: 'video'` nötig, sonst null.
   *  Der Aufrufer löst auf; diese Datei sucht NICHT im Projekt (s. ENTSCHIEDEN 8). */
  asset: Asset | null
  /** Die Vorlagen für den Namen der Band-Vorlage (#154). Leer ist gültig. */
  vorlagen: readonly Vorlage[]
  /**
   * Die Indizes der kaputten Band-Abschnitte DIESES Elements, aufsteigend und ohne Dubletten –
   * UNVERÄNDERT aus `ListenZeileModell.kaputteBandAbschnitte` (M7-55). Leer, wenn keiner
   * betroffen ist. Diese Datei RECHNET sie nicht und prüft nichts nach; sie markiert damit
   * den Band-Zugang (s. ENTSCHIEDEN 6a).
   */
  kaputteBandAbschnitte: readonly number[]
  /** Öffnet die Bearbeitung des Werbebandes. Diese Datei bearbeitet das Band NICHT
   *  (s. ENTSCHIEDEN 6) und ruft `uebernehmeBand` NICHT. */
  aufEinblendungBearbeiten: (elementId: string) => void
  /** Meldeweg für Fehler, die diese Datei nicht auflöst. Sie zeigt NICHTS selbst an. */
  aufFehler: (code: string, meldung: string) => void
  /** #415 (Variante a): der Sicht-Schreiber (Wrapped-Zugangs-`setzeListe`, #244-
   *  Huelle). PFICHT - die Entfernung liefert sonst keinen Undo-Schritt. */
  sichtSchreiber: (liste: Listenelement[]) => void
}

const KAPUTTFARBE = '#e5634d'

export function ElementBedienung(p: ElementBedienungEigenschaften): JSX.Element {
  // ENTSCHIEDEN 10: genau EIN Zustand - die ReglerLage. Sonst nichts.
  const modellErgebnis = baueReglerModell(p.element, p.asset)
  const modell: ReglerModell | null = modellErgebnis.ok ? modellErgebnis.wert : null
  const [lage, setzeLage] = useState<ReglerLage>(() =>
    modell === null ? { zieht: false, anfang: 0, ende: 0 } : ruheLage(modell),
  )

  // Fehlerpfade: das Element wechselt während einer laufenden Geste -> Ruhelage des
  // NEUEN Modells; eine Geste eines anderen Elements darf nie auf dieses wirken.
  // Referenzvergleich auf dem ELEMENT (nicht auf dem Modell - das Modell ist bei
  // jedem Render neu, ein Vergleich darueber wuerde die Geste pro Render zuruecksetzen).
  const vorherigesElement = useRef(p.element)
  useEffect(() => {
    if (vorherigesElement.current !== p.element) {
      vorherigesElement.current = p.element
      setzeLage(modell === null ? { zieht: false, anfang: 0, ende: 0 } : ruheLage(modell))
    }
  }, [p.element, modell])

  const band = baueBandStatus(p.element, p.vorlagen)

  const zieheGriff = (griff: Reglergriff, wert: number): void => {
    if (modell === null) return
    setzeLage((bisher) => ziehe(modell, bisher, griff, wert))
  }

  const lasseLos = (): void => {
    if (modell === null) return
    if (!istVeraendert(modell, lage)) {
      // Loslassen ohne Bewegung: kein Aufruf, kein Auto-Speichern (ENTSCHIEDEN 3).
      setzeLage(ruheLage(modell))
      return
    }
    const { anfang, ende } = lage
    void uebernehmeGrenzen(p.element, anfang, ende).then((antwort) => {
      if (!antwort.ok) {
        // Ablehnung: aufFehler mit UNVERÄNDERTEM Code; die Ruhelage des Modells gilt
        // weiter - die Sicht korrigiert #125 selbst, hier wird nichts zurückgenommen.
        p.aufFehler(antwort.fehler.code, antwort.fehler.meldung)
      }
      setzeLage(ruheLage(modell))
    })
  }

  const entferne = (): void => {
    // #415 (Variante a): ueber den Wrapped-Zugangs-`setzeListe` - kein rawer Store-Ruf.
    void entferneElementAusListe(p.element.id, p.sichtSchreiber).then((antwort) => {
      if (!antwort.ok) {
        // Die Zeile bleibt stehen - sie wird nicht „vorsichtshalber" ausgeblendet.
        p.aufFehler(antwort.fehler.code, antwort.fehler.meldung)
      }
    })
  }

  const balkenAnteil = (wert: number): number => (modell === null ? 0 : anteil(modell, wert))
  const wertBei = (teil: number): number => (modell === null ? 0 : wertAusAnteil(modell, teil))

  // Die Geste: mousedown faengt den Griff, mousemove zieht (NUR rein ueber `ziehe`),
  // mouseup loest GENAU EINMAL die Uebernahme aus (ENTSCHIEDEN 3). Kein Timer, keine
  // Entprellung, kein Aufruf waehrend der Bewegung.
  const [griff, setzeGriff] = useState<Reglergriff | null>(null)
  const balkenRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (griff === null) return
    const zieheBei = (ereignis: MouseEvent): void => {
      if (modell === null) return
      const balken = balkenRef.current
      if (balken === null) return
      const rechteck = balken.getBoundingClientRect()
      const teil = rechteck.width === 0 ? 0 : (ereignis.clientX - rechteck.left) / rechteck.width
      zieheGriff(griff, wertBei(teil))
    }
    const losBei = (): void => {
      setzeGriff(null)
      lasseLos()
    }
    window.addEventListener('mousemove', zieheBei)
    window.addEventListener('mouseup', losBei)
    return () => {
      window.removeEventListener('mousemove', zieheBei)
      window.removeEventListener('mouseup', losBei)
    }
  }, [griff, modell, lage])

  const bandKaputt = p.kaputteBandAbschnitte.length > 0
  const bandText = bandKaputt
    ? `${band.text} – ${p.kaputteBandAbschnitte.length} kaputt`
    : band.text

  return (
    <div data-testid="element-bedienung" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {modell === null ? (
        // ENTSCHIEDEN 9: kein Regler - aber Band-Zugang und Entfernen bleiben erreichbar.
        <span data-testid="element-bedienung-unmoeglich" style={{ fontSize: 12, color: '#8f8f8f' }}>
          Dauer dieses Elements nicht bedienbar.
        </span>
      ) : (
        <div data-testid="element-regler" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span data-testid="element-dauer" style={{ fontSize: 12, minWidth: 56 }}>
            {formatiereReglerDauer(lage.ende - lage.anfang)}
          </span>
          <div
            data-testid="element-balken"
            ref={balkenRef}
            style={{ position: 'relative', width: 160, height: 10, background: '#3a3a3a' }}
          >
            {modell.griffe === 2 && (
              <div
                data-testid="element-griff-anfang"
                onMouseDown={() => setzeGriff('anfang')}
                style={{
                  position: 'absolute',
                  left: `${balkenAnteil(lage.anfang) * 100}%`,
                  top: -3,
                  width: 8,
                  height: 16,
                  background: '#c8c8c8',
                  cursor: 'grab',
                }}
              />
            )}
            <div
              data-testid="element-griff-ende"
              onMouseDown={() => setzeGriff('ende')}
              style={{
                position: 'absolute',
                left: `${balkenAnteil(lage.ende) * 100}%`,
                top: -3,
                width: 8,
                height: 16,
                background: '#c8c8c8',
                cursor: 'grab',
              }}
            />
          </div>
          {modell.griffe === 2 ? (
            <span style={{ fontSize: 11, color: '#8f8f8f' }}>
              Anfang {formatiereReglerDauer(lage.anfang)}
            </span>
          ) : null}
        </div>
      )}

      {band.bedienbar && (
        <button
          type="button"
          data-testid="element-band"
          onClick={() => p.aufEinblendungBearbeiten(p.element.id)}
          style={bandKaputt ? { color: KAPUTTFARBE, borderColor: KAPUTTFARBE } : undefined}
        >
          {bandText}
        </button>
      )}
      <button type="button" data-testid="element-entfernen" onClick={entferne}>
        Entfernen
      </button>
    </div>
  )
}
