// GENERIERT aus dem Signaturblock von Issue #208.
// [queue-panel] Feiner Render-Fortschritt
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
// GERUEST-PRUEFSUMME: 04a356bcfac96cf5

import type { RenderProgress } from '../../shared/contracts/render-progress'
import { KANAELE } from '../../shared/contracts/kanaele'
import { abonniere } from '../ipc-client/ereignisse'

/**
 * Der feine Render-Fortschritt. `unbekannt` ist der ANFANGSZUSTAND und bedeutet
 * „es ist noch kein Ereignis eingetroffen" – ausdruecklich NICHT „nichts laeuft"
 * und erst recht nicht „fertig".
 */
export type RenderFortschritt =
  | { zustand: 'unbekannt' }
  | { zustand: 'gemeldet'; ereignis: RenderProgress }

export const ANFANGS_FORTSCHRITT: RenderFortschritt = { zustand: 'unbekannt' }

/**
 * REIN. Entscheidet, ob ein eingetroffenes Ereignis uebernommen oder verworfen wird.
 * Verworfen wird, wenn `aktuelleRenderId` null ist oder nicht zur `renderId` des
 * Ereignisses passt. Verwerfen laesst den bisherigen Stand UNVERAENDERT stehen.
 */
export function uebernehmeFortschritt(
  bisher: RenderFortschritt,
  ereignis: RenderProgress,
  aktuelleRenderId: string | null,
): RenderFortschritt {
  // Die verbindliche Uebernahmeregel (entschieden, es gibt keinen weiteren Fall):
  // kein Lauf (`null`) oder eine fremde renderId heisst „verspaetetes Ereignis" und
  // wird VERWORFEN - zurueckgegeben wird DASSELBE Objekt wie `bisher`. An dieser
  // Referenzgleichheit ist das Verwerfen im Test nachweisbar.
  //
  // Kein Zuruecksetzen auf `unbekannt` beim Verwerfen: Ein verspaetetes Ereignis
  // eines alten Laufs darf die Anzeige des aktuellen Laufs nicht loeschen.
  if (aktuelleRenderId === null || ereignis.renderId !== aktuelleRenderId) {
    return bisher
  }

  // Das uebergebene Ereignis wird mitgenommen, nicht umgeformt: `prozent` bleibt
  // unbenutzt, und aus diesem Kanal wird nie ein Endzustand abgeleitet - der kommt
  // ausschliesslich ueber den Auftrags-Zustand (TK 9.2.7, TK 9.1.1 Punkt 5).
  return { zustand: 'gemeldet', ereignis }
}

/**
 * REIN. Die Anzeigeform: „Element 3 von 7 wird normalisiert" bzw. „Wird zusammengefuegt".
 * Bei `unbekannt` die leere Zeichenkette – der Aufrufer zeigt dann nichts an.
 */
export function beschreibeFortschritt(stand: RenderFortschritt): string {
  // `unbekannt` heisst „es ist noch kein Ereignis eingetroffen" - der Aufrufer
  // zeigt dann nichts an statt einen Zustand zu behaupten.
  if (stand.zustand === 'unbekannt') {
    return ''
  }

  const { phase, elementIndex, elementAnzahl } = stand.ereignis

  // `verketten` ist laut TK 9.2.7 ein einziger Gesamtschritt ohne Elementzaehlung.
  if (phase === 'verketten') {
    return 'Wird zusammengefuegt'
  }

  // Ein zur Laufzeit unbekannter Phasenwert (weder normalisieren noch verketten):
  // Das Ereignis wird uebernommen (es ist ja der aktuelle Lauf), der Text bleibt
  // ohne Phase - Text ohne Zahlen, kein throw.
  if (phase !== 'normalisieren') {
    return 'Elemente werden vorbereitet'
  }

  // `elementIndex` ist nullbasiert (das `RenderProgress`-Feld ist ein Index, TK 9.2.7
  // nennt ihn „k von n"), deshalb + 1 in der Anzeige. Beide Werte muessen gesetzt
  // sein; fehlt einer, gibt es keinen Ersatzwert 0 und keine erfundene Anzahl -
  // der Text erscheint ohne Zahlen. Die Anzeige urteilt nicht ueber den Sender:
  // Auch `elementIndex >= elementAnzahl` wird unverfaelscht angezeigt.
  if (elementIndex !== null && elementAnzahl !== null) {
    return `Element ${elementIndex + 1} von ${elementAnzahl} wird vorbereitet`
  }

  return 'Elemente werden vorbereitet'
}

/**
 * Abonniert `render:fortschritt` und reicht jedes uebernommene Ereignis ueber
 * `setzeFortschritt` weiter. Kehrt SYNCHRON zurueck und liefert die Abmelde-Funktion.
 *
 * `leseAktuelleRenderId` wird bei JEDEM eingetroffenen Ereignis neu gerufen – der Wert
 * darf sich waehrend der Laufzeit aendern (neuer Render nach einem Abbruch).
 */
export function baueRenderFortschrittAuf(
  leseAktuelleRenderId: () => string | null,
  setzeFortschritt: (stand: RenderFortschritt) => void,
): () => void {
  // `beendet` ist dieselbe Schutzflagge wie in der Nachbardatei (#205): Sie macht
  // den Hoerer nach einer Abmeldung stumm - auch dann, wenn die Zustell-Mechanik
  // noch ein Ereignis bringt - und die Abmelde-Funktion idempotent (React-Aufraeum-
  // funktionen laufen in der Entwicklung doppelt).
  let beendet = false
  let abmeldenKanal: (() => void) | undefined

  try {
    // Kanalname ausschliesslich aus der Registry (#25/#191) - in dieser Datei steht
    // kein einziges `render:`-Literal. Abonniert wird OHNE vorheriges Holen, und das
    // ist kein Widerspruch zu „erst holen, dann abonnieren": Fuer `render:fortschritt`
    // gibt es keine Leseoperation und es braucht auch keine - Fortschritt ist ein
    // Verlauf, kein Bestand; ein verpasstes Zwischen-Ereignis wird vom naechsten
    // ueberholt (TK 9.2.7, wortgleich im Issue entschieden).
    abmeldenKanal = abonniere<RenderProgress>(KANAELE.render.fortschritt, (ereignis) => {
      if (beendet) {
        return
      }

      // Die renderId wird bei JEDEM eingetroffenen Ereignis neu gelesen - der Wert
      // darf sich waehrend der Laufzeit aendern (neuer Render nach dem Abbruch eines
      // Laufs), deshalb wird sie nie beim Aufbau einmalig eingefroren.
      let aktuelleRenderId: string | null
      try {
        aktuelleRenderId = leseAktuelleRenderId()
      } catch (ursache) {
        // Fehlerpfad „leseAktuelleRenderId wirft": abfangen und das Ereignis wie
        // „passt nicht" behandeln - verworfen, `setzeFortschritt` wird nicht gerufen.
        // Ereignisse haben keinen Fehlerkanal; es bleibt die interne Protokollierung.
        // Kein throw aus dem Hoerer heraus.
        console.error(
          '[queue-panel] fortschritt: leseAktuelleRenderId hat geworfen:',
          ursache,
        )
        return
      }

      // Dasselbe Kriterium wie `uebernehmeFortschritt`: kein Lauf (`null`) oder eine
      // fremde renderId -> verwerfen. `setzeFortschritt` wird NUR bei einem
      // uebernommenen Ereignis gerufen.
      if (aktuelleRenderId === null || ereignis.renderId !== aktuelleRenderId) {
        return
      }

      setzeFortschritt({ zustand: 'gemeldet', ereignis })
    })
  } catch (ursache) {
    // Fehlerpfad „abonniere wirft beim Anmelden": abfangen statt nach aussen zu
    // werfen (diese Datei wird aus einer React-Komponente heraus benutzt). Die
    // zurueckgegebene Abmelde-Funktion bleibt aufrufbar und ist wirkungslos.
    console.error(
      `[queue-panel] fortschritt: Kanal "${KANAELE.render.fortschritt}" konnte nicht abonniert werden:`,
      ursache,
    )
  }

  return () => {
    // Kein zweites Abmelden und kein throw beim zweiten und jedem weiteren Aufruf:
    // Die von `abonniere` gelieferte Abmeldung wird hoechstens EINMAL ausgeloest
    // (Invariante 2 des Meilensteins: jedes Abonnement wird abgemeldet).
    if (beendet) {
      return
    }
    beendet = true
    abmeldenKanal?.()
  }
}
