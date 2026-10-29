// Handgeschrieben zu Issue #222 - der zweite Baustein des Issues (Logik und Zustand
// liegen in `liste.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE Zieldatei an).
// DÜNN: Die Ansicht haelt den Stand NICHT selbst (Signatur), fuehrt keine Operation aus
// und ruft nur die uebergebenen Rueckrufe. Die Darstellung einer beschädigten Zeile
// kommt aus #223 und wird UEBERGEBEN, nicht importiert.

import type { JSX } from 'react'
import type { ListenZeile, Projektliste, ProjektMeta } from './liste'
import { baueListenZeilen, filtereProjekte } from './liste'

export interface ProjektlisteEigenschaften {
  /** Der gehaltene Stand aus `holeProjektliste()`; die Ansicht hält ihn NICHT selbst. */
  liste: Projektliste
  /** Die Kennung des gerade geladenen Projekts; null, wenn keins offen ist. Nur zur Hervorhebung. */
  offenesProjektId: string | null
  /** Öffnen – die Ansicht ruft nur zurück und führt selbst nichts aus (#224). */
  aufOeffnen: (meta: ProjektMeta) => void
  /** Duplizieren (#225). */
  aufDuplizieren: (meta: ProjektMeta) => void
  /** Löschen (#226). */
  aufLoeschen: (meta: ProjektMeta) => void
  /** Erneut laden – für den Fehlerfall und den Auffrisch-Knopf. */
  aufErneutLaden: () => void
  /** Die Darstellung einer beschädigten Zeile kommt aus #223 und wird ÜBERGEBEN, nicht
   *  importiert – so bleibt die Zuständigkeit für den Sonderfall an einer Stelle. */
  zeichneBeschaedigteZeile: (meta: ProjektMeta) => JSX.Element
  /** Der Zeichen-Schlitz für die Standardmarke der Zeile (#324/#399): kommt wie
   *  `zeichneBeschaedigteZeile` ÜBERGEBEN, nicht importiert; die Zeile ruft ihn hinter
   *  den Metadaten und vor den Knöpfen auf. */
  zeichneStandardmarke: (meta: ProjektMeta) => JSX.Element
  /** Der Suchtext der Suchleiste (Wunsch 29.10.2026). Die Ansicht hält ihn NICHT selbst. */
  suchtext: string
  /** Meldet jede Änderung am Suchfeld zurück; das Filtern macht die Ansicht. */
  aufSuche: (wert: string) => void
}

/**
 * Der Reiter Projekte (TK 9.14.3) - die Einstiegsstelle der Anwendung. Er bleibt ohne
 * offenes Projekt voll benutzbar und fragt an keiner Stelle, ob ein Projekt geladen ist.
 *
 * `zustand: 'unbekannt'` bekommt einen EIGENEN Text - „noch nicht geladen" ist nie
 * dasselbe wie „geladen, aber leer" (ENTSCHIEDEN 3). Ein Ladefehler wird MIT dem Knopf
 * „Erneut laden" gezeigt (Fehlerpfad), nie verschluckt.
 *
 * Die Rueckrufe erhalten das ORIGINAL-meta aus dem Bestand (nicht die abgeleitete Zeile -
 * die traegt anzahlMedien/anzahlAusgaben nicht, und ein Ersatzwert ist verboten,
 * ENTSCHIEDEN 5). Die Zeilen werden nur fuer die Anzeige abgeleitet, genau einmal.
 */
export function Projektlisteansicht(p: ProjektlisteEigenschaften): JSX.Element {
  if (p.liste.zustand === 'unbekannt') {
    return (
      <div data-ton="unbekannt" data-testid="projektliste-unbekannt">
        Noch nicht geladen
      </div>
    )
  }

  // `zustand: 'geladen'` ist hier garantiert; der Fehler ist ein Zustand DANEBEN und
  // ueberschreibt die Liste nicht (Ablauf 2 behaelt eintraege und zustand).
  if (p.liste.ladefehler) {
    return (
      <div data-ton="hervorgehoben" data-testid="projektliste-fehler">
        <span>Projektliste nicht lesbar</span>
        <button type="button" onClick={p.aufErneutLaden}>
          Erneut laden
        </button>
      </div>
    )
  }

  if (p.liste.eintraege.length === 0) {
    // Geladen und leer - KEIN Fehler und nie derselbe Text wie bei `unbekannt`.
    return (
      <div data-ton="ruhig" data-testid="projektliste-leer">
        Noch keine Projekte
      </div>
    )
  }

  // Zeilen genau einmal ableiten; Reihenfolge wie geliefert (ENTSCHIEDEN 4).
  // Seit dem 29.10.2026 zuerst GEFILTERT: Filtern aendert nur, welche Zeilen erscheinen,
  // nie ihre Reihenfolge (`filtereProjekte` behaelt sie).
  const gefiltert = filtereProjekte(p.liste.eintraege, p.suchtext)
  const zeilenVonId = new Map(baueListenZeilen(gefiltert).map((zeile) => [zeile.id, zeile]))
  return (
    <div>
      {/* Die Suchleiste steht UEBER der Liste und nur, wenn es etwas zu suchen gibt
          (bei "Noch keine Projekte" waere sie ein Bedienelement ohne Wirkung). */}
      <input
        data-testid="projektliste-suche"
        type="search"
        value={p.suchtext}
        onChange={(ereignis) => p.aufSuche(ereignis.target.value)}
        placeholder="Projekt suchen"
        aria-label="Projekt suchen"
        style={{ width: '100%', maxWidth: 320, marginBottom: 6 }}
      />
      {gefiltert.length === 0 ? (
        // Eigener Zustand: "kein Treffer" ist NIE dasselbe wie "noch keine Projekte"
        // (dieselbe Regel wie bei `unbekannt` vs. leer, ENTSCHIEDEN 3).
        <div data-ton="ruhig" data-testid="projektliste-kein-treffer">
          Kein Projekt passt zu „{p.suchtext.trim()}“
        </div>
      ) : (
        <ul data-testid="projektliste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {gefiltert.map((meta) => {
            const zeile = zeilenVonId.get(meta.id)
            if (!zeile) {
              // Kann nicht eintreten (die Zeilen stammen aus genau diesen eintraege) - der
              // Compiler erzwingt den Umgang; ein Wurf waere hier ein Programmierfehler.
              return null
            }
            return (
              <li key={meta.id} data-testid={`projekt-${meta.id}`}>
                <Projektzeile
                  zeile={zeile}
                  meta={meta}
                  offenesProjektId={p.offenesProjektId}
                  aufOeffnen={p.aufOeffnen}
                  aufDuplizieren={p.aufDuplizieren}
                  aufLoeschen={p.aufLoeschen}
                  zeichneBeschaedigteZeile={p.zeichneBeschaedigteZeile}
                  zeichneStandardmarke={p.zeichneStandardmarke}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

interface ProjektzeileEigenschaften {
  zeile: ListenZeile
  meta: ProjektMeta
  offenesProjektId: string | null
  aufOeffnen: (meta: ProjektMeta) => void
  aufDuplizieren: (meta: ProjektMeta) => void
  aufLoeschen: (meta: ProjektMeta) => void
  zeichneBeschaedigteZeile: (meta: ProjektMeta) => JSX.Element
  zeichneStandardmarke: (meta: ProjektMeta) => JSX.Element
}

function Projektzeile(p: ProjektzeileEigenschaften): JSX.Element {
  if (p.zeile.beschaedigt) {
    // Der Sonderfall liegt bewusst in #223; hier nur der Aufruf der uebergebenen Zeichnung.
    return p.zeichneBeschaedigteZeile(p.meta)
  }

  const offen = p.zeile.id === p.offenesProjektId
  return (
    <div data-ton={offen ? 'hervorgehoben' : 'ruhig'}>
      <button type="button" onClick={() => p.aufOeffnen(p.meta)}>
        {p.zeile.bezeichnung}
      </button>
      <span> · {p.zeile.erstelltAmText}</span>
      <span> · geändert {p.zeile.geaendertAmText}</span>
      <span> · {p.zeile.ordner}</span>
      {/* #324/#399: der Standard-Marke-Schlitz – HINTER den Metadaten, VOR den Knöpfen. */}
      {p.zeichneStandardmarke(p.meta)}
      <button type="button" onClick={() => p.aufDuplizieren(p.meta)}>
        Duplizieren
      </button>
      <button type="button" onClick={() => p.aufLoeschen(p.meta)}>
        Löschen
      </button>
    </div>
  )
}