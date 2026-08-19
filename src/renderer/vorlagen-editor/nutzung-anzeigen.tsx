import type { JSX } from 'react'
import type { Nutzungsstand, NutzungsAnzeige } from './nutzung-anzeigen'

export interface NutzungAnzeigeEigenschaften {
  /** Der gehaltene Stand; die Anzeige haelt ihn NICHT selbst. */
  stand: Nutzungsstand
  /** Das Ergebnis von `baueNutzungsAnzeige` – die Anzeige berechnet es NICHT selbst.
   *  null, solange `stand.zustand !== 'geladen'`. */
  anzeige: NutzungsAnzeige | null
  /** true = Trefferliste sichtbar. Die Anzeige haelt den Merker NICHT selbst. */
  aufgeklappt: boolean
  aufUmschalten: () => void
  /** Erneut laden – fuer den Fehlerfall. */
  aufErneutLaden: () => void
}

/** Der Nutzungs-Hinweis samt aufklappbarer Trefferliste. */
export function NutzungAnzeige(p: NutzungAnzeigeEigenschaften): JSX.Element {
  // ENTSCHIEDEN 3: 'unbekannt' und 'laedt' zeigen NIE eine Zahl - und vor allem nie "frei".
  if (p.stand.zustand === 'unbekannt') {
    return (
      <div role="status">Die Nutzung dieser Vorlage wurde noch nicht geprueft.</div>
    )
  }
  if (p.stand.zustand === 'laedt') {
    return <div role="status">Die Nutzung wird geprueft…</div>
  }
  if (p.stand.zustand === 'fehler') {
    // Die Anzeige sagt ausdruecklich, dass nicht nachgesehen werden konnte, und bietet
    // "erneut laden" an. Nie eine Zahl, nie "frei" (Fehlerpfad).
    return (
      <div role="alert">
        Die Nutzung konnte nicht geprueft werden: {p.stand.fehler?.meldung ?? 'unbekannter Fehler'}
        <button type="button" onClick={p.aufErneutLaden}>
          Erneut laden
        </button>
      </div>
    )
  }

  // 'geladen'. anzeige ist null, solange nicht geladen wurde - dann nie eine Zahl.
  if (p.anzeige === null) {
    return (
      <div role="status">Die Nutzung dieser Vorlage wurde noch nicht geprueft.</div>
    )
  }

  if (p.anzeige.frei) {
    // Beide Listen leer, GELADEN: das ist ein gueltiges Ergebnis, kein Fehler.
    return <div role="status">{p.anzeige.text}</div>
  }

  // Treffer: der Satz ist immer sichtbar (ENTSCHIEDEN 11), die Liste ist standardmaessig zu.
  return (
    <div role="status">
      <span>{p.anzeige.text}</span>{' '}
      <button type="button" onClick={p.aufUmschalten}>
        {p.aufgeklappt ? 'Trefferliste ausblenden' : 'Trefferliste anzeigen'}
      </button>
      {p.aufgeklappt ? (
        <ul>
          {p.anzeige.gruppen.map((gruppe) => (
            <li key={gruppe.projektId}>
              {gruppe.projektName}
              {gruppe.aktionen.length > 0 ? (
                <ul>
                  {gruppe.aktionen.map((treffer) => (
                    <li key={treffer.id}>Aktion {treffer.id}</li>
                  ))}
                </ul>
              ) : null}
              {gruppe.listenelemente.length > 0 ? (
                <ul>
                  {gruppe.listenelemente.map((treffer) => (
                    <li key={treffer.id}>Listenelement {treffer.id}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
