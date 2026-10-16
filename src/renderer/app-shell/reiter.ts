// [app-shell] Reiter-Zustand und Reiterwechsel

/** Die FÜNF Modus-Reiter (TK 9.14.1). Der Wert 'marken' kommt mit TK v3.6 hinzu (#314). */
export type ReiterId = 'zusammenstellen' | 'aktionen' | 'vorlagen' | 'marken' | 'projekte'

/** Anzeigereihenfolge der Reiterleiste, exakt wie in der Skizze TK 9.14.1:
 *  zusammenstellen, aktionen, vorlagen, marken, projekte. */
export const REITER_REIHENFOLGE: readonly ReiterId[] = [
  'zusammenstellen',
  'aktionen',
  'vorlagen',
  'marken',
  'projekte',
]

/** Der Reiter, in dem die App startet, wenn kein Projekt wiederhergestellt werden konnte
 *  (TK 9.14.2/9.14.3): 'projekte'. */
export const START_REITER_OHNE_PROJEKT: ReiterId = 'projekte'

/** Der Reiter, in den nach dem Öffnen eines Projekts gewechselt wird (TK 9.14.3): 'zusammenstellen'. */
export const REITER_NACH_PROJEKT_OEFFNEN: ReiterId = 'zusammenstellen'

let aktiverReiter: ReiterId = START_REITER_OHNE_PROJEKT

let hoererListe: Array<(aktiv: ReiterId) => void> = []

/** Der aktuell aktive Reiter. Vor dem ersten wechsleReiter(): START_REITER_OHNE_PROJEKT. */
export function holeReiter(): ReiterId {
  return aktiverReiter
}

/** Setzt den aktiven Reiter und benachrichtigt alle Hörer. Ist `ziel` bereits aktiv, geschieht
 *  NICHTS – kein Hörer wird gerufen (s. ENTSCHIEDEN 3). */
export function wechsleReiter(ziel: ReiterId): void {
  if (ziel === aktiverReiter) {
    return
  }

  aktiverReiter = ziel

  // Ueber eine Kopie der Hoererliste, damit sich ein Hoerer, der sich mitten in
  // der Benachrichtigung abmeldet, nicht auf die laufende Runde auswirkt
  // (ENTSCHIEDEN 7).
  const kopie = [...hoererListe]
  for (const ruf of kopie) {
    try {
      ruf(ziel)
    } catch {
      // Ein werfender Hoerer reisst niemanden mit (ENTSCHIEDEN 6): Die Ausnahme
      // verlaeuft sich hier, die uebrigen Hoerer werden trotzdem gerufen.
    }
  }
}

/** Abonnement für Reiterwechsel; Rückgabewert ist die Abmelde-Funktion.
 *  Der Hörer wird beim Anmelden NICHT sofort mit dem aktuellen Wert gerufen (s. ENTSCHIEDEN 4). */
export function aufReiterGeaendert(hoerer: (aktiv: ReiterId) => void): () => void {
  hoererListe.push(hoerer)

  let abgemeldet = false
  return function abmelden(): void {
    // Idempotent (ENTSCHIEDEN 5): Ein zweiter Aufruf tut nichts und wirft nicht;
    // er entfernt nur diesen einen Hoerer und laesst alle anderen Abos unberuehrt.
    if (abgemeldet) {
      return
    }
    abgemeldet = true
    hoererListe = hoererListe.filter((eingetragen) => eingetragen !== hoerer)
  }
}

/** Typwächter für Werte aus der Konfiguration (UI-Voreinstellung, `unknown`). */
export function istGueltigerReiter(wert: unknown): wert is ReiterId {
  return (
    wert === 'zusammenstellen' ||
    wert === 'aktionen' ||
    wert === 'vorlagen' ||
    wert === 'marken' ||
    wert === 'projekte'
  )
}

/** NUR für Tests: setzt den Modul-Zustand auf den Anfangswert zurück und entfernt alle Hörer. */
export function setzeReiterZustandZurueck(): void {
  aktiverReiter = START_REITER_OHNE_PROJEKT
  hoererListe = []
}
