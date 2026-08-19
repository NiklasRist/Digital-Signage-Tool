// GENERIERT aus dem Signaturblock von Issue #207.
// [queue-panel] Die aufgeklappte Liste
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
// GERUEST-PRUEFSUMME: 93a2d28adf5f78cd

import type { Auftrag, AuftragArt, AuftragStatus } from '../../shared/contracts/auftrag'
import type { AuftragsSicht } from './auftrags-sicht'

export interface AuftragsZeile {
  auftragId: string
  art: AuftragArt
  status: AuftragStatus
  /** UI-Klartext aus dem Main, unveraendert uebernommen (TK 9.3.1). */
  label: string
  /** Zustand in Klartext: „laeuft", „wartet", „fehlgeschlagen", „fertig", „abgebrochen". */
  zustandText: string
  /** 0–100 oder null (unbestimmt bzw. laeuft nicht). Kein Ersatzwert 0. */
  fortschritt: number | null
  /** Rohdaten des Fehlers, UNUEBERSETZT – die Uebersetzung macht #211. */
  fehler: { code: string; meldung: string; daten?: unknown } | null
  /** Anzahl bisher tatsaechlich gestarteter Ausfuehrungen (TK 9.3.1); 0 = nie gelaufen. */
  versuche: number
  /** Der vollstaendige Auftrag – fuer die Schalter aus #209/#210. */
  auftrag: Auftrag
}

export type ListenInhalt =
  | { zustand: 'unbekannt' }
  | { zustand: 'fehler'; code: string; meldung: string }
  | { zustand: 'leer' }
  | { zustand: 'zeilen'; zeilen: AuftragsZeile[] }

/**
 * Der Klartext je Status (ENTSCHIEDEN, verbindlich). Ein unbekannter Wert bleibt der
 * Rohwert unveraendert – die Zeile wird trotzdem gebaut, nichts wird geworfen.
 */
const ZUSTANDSTEXT: Partial<Record<AuftragStatus, string>> = {
  laeuft: 'läuft',
  anstehend: 'wartet',
  fehlgeschlagen: 'fehlgeschlagen',
  erfolg: 'fertig',
  abgebrochen: 'abgebrochen',
}

/**
 * Klemmt den Fortschritt auf 0–100. `null` bleibt `null` – es ist „unbestimmt"
 * (TK 9.3.1), kein Ersatzwert 0. Fehlerpfad der DoD: Werte ausserhalb werden geklemmt.
 */
function klemmeFortschritt(fortschritt: number | null): number | null {
  if (fortschritt === null) {
    return null
  }
  if (fortschritt < 0) {
    return 0
  }
  if (fortschritt > 100) {
    return 100
  }
  return fortschritt
}

/**
 * Rein. Baut aus der Sicht die Zeilen – in der gelieferten Reihenfolge, ohne zu
 * sortieren, ohne zu filtern, ohne zu kappen (TK 9.3.5 „Determinismus durch sichtbare
 * Reihenfolge"; die Sortier-Fehlschlaege der DoD). `erfolg` und `abgebrochen` werden
 * NICHT weggelassen: Was der Stand enthaelt, entscheidet #64; ein zweiter Filter hier
 * waere eine zweite Regel fuer denselben Bestand.
 */
export function baueListenInhalt(sicht: AuftragsSicht): ListenInhalt {
  if (sicht.zustand === 'unbekannt') {
    // Invariante 1 des Meilensteins: `unbekannt` bekommt eine EIGENE Darstellung und
    // wird NIE auf `leer` abgebildet - es heisst „noch nicht geholt", nicht „alles gut".
    return { zustand: 'unbekannt' }
  }
  if (sicht.zustand === 'fehler') {
    // Der Fehlercode wird UNVERAENDERT durchgereicht - die Uebersetzung macht #211.
    return { zustand: 'fehler', code: sicht.code, meldung: sicht.meldung }
  }
  if (sicht.auftraege.length === 0) {
    // `leer` gibt es NUR bei `geladen` mit leerem Array (ENTSCHIEDEN des Issues).
    return { zustand: 'leer' }
  }

  return {
    zustand: 'zeilen',
    zeilen: sicht.auftraege.map((auftrag) => ({
      auftragId: auftrag.auftragId,
      art: auftrag.art,
      status: auftrag.status,
      label: auftrag.label,
      zustandText: ZUSTANDSTEXT[auftrag.status] ?? auftrag.status,
      fortschritt: klemmeFortschritt(auftrag.fortschritt),
      // Rohe Fehlerdaten, byte-gleich uebernommen - nichts gebaut, nichts entfernt.
      fehler: auftrag.fehler,
      versuche: auftrag.versuche,
      auftrag,
    })),
  }
}