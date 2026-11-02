// [composer] Wo laeuft eine Aktion? Der Rueckverweis fuer die Bibliothek.
//
// WARUM ES DIESE DATEI GIBT (02.11.2026, Messlatte Abschnitt 16 der Uebergabe): Bis hierher
// gab es KEINEN Weg von einer Aktion zu ihren Stellen im Video - 0 Treffer im Code. Wer wissen
// wollte, wo ein Werbemittel laeuft, musste die Zeitleiste absuchen. Das ist genau die Arbeit,
// die das Werkzeug abnehmen soll („schneller oder sehr viel besser").
//
// REIN: kein React, kein DOM, keine IPC. Die Anzeige (bibliothek-ansicht.tsx) rechnet NICHTS
// nach, sie zeigt nur, was hier steht.

import type { Listenelement } from '../../shared/contracts/project'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { frameDauer } from './gesamtlaenge'
import { baueBandspur } from './zeitband'

export interface Verwendung {
  /** Das Band: ab welcher Sekunde laeuft die Aktion, und wie oft wiederholt sich die Folge? */
  band: { abSekunden: number; wiederholungen: number } | null
  /** Die Unterbrechungen: an welchen Zeitstellen laeuft die Aktion? (Sekunden, aufsteigend) */
  unterbrechungen: number[]
}

/** Die getrimmte Laenge eines Video-Elements in Sekunden; null = nicht bestimmbar. */
function videoSekunden(element: Listenelement): number | null {
  const dauer = frameDauer(element)
  if (!dauer.ok) return null
  return dauer.wert / RENDER_PROFILE.fps
}

/**
 * Sammelt fuer JEDE Aktion eines Projekts ihre Verwendungen.
 *
 * Band: Die Abschnitte laufen ab Sekunde 0 in ihrer Reihenfolge (TK 9.2.8); die Startsekunde
 * einer Aktion ist die Summe aller Abschnitte davor. Die Wiederholungszahl kommt aus
 * `baueBandspur` - DIESELBE Rechnung, die den Block `x3` beschriftet. Eine zweite Rechnung
 * koennte eine andere Zahl zeigen als die Zeitleiste, und dann glaubt der Nutzer keiner von
 * beiden.
 */
export function baueVerwendungen(
  liste: readonly Listenelement[],
): ReadonlyMap<string, Verwendung> {
  const ergebnis = new Map<string, Verwendung>()

  const eintragFuer = (aktionId: string): Verwendung => {
    const vorhanden = ergebnis.get(aktionId)
    if (vorhanden !== undefined) return vorhanden
    const neu: Verwendung = { band: null, unterbrechungen: [] }
    ergebnis.set(aktionId, neu)
    return neu
  }

  for (const element of liste) {
    if (element.art !== 'video') continue

    const abschnitte = element.einblendung?.abschnitte ?? []
    if (abschnitte.length > 0) {
      const sekunden = videoSekunden(element)
      const wiederholungen =
        sekunden === null ? 1 : baueBandspur(abschnitte, sekunden, 1).wiederholungen
      let ab = 0
      for (const abschnitt of abschnitte) {
        const eintrag = eintragFuer(abschnitt.aktionRef)
        // NUR der ERSTE Auftritt: die Startsekunde des Bandes. Laeuft dieselbe Aktion
        // zweimal in der Folge, steht die erste Stelle - die zweite ist ueber die
        // Wiederholungszahl und die Folgelaenge erschliessbar, eine Liste wuerde die
        // Zeile in der Bibliothek sprengen.
        if (eintrag.band === null) {
          eintrag.band = { abSekunden: ab, wiederholungen }
        }
        ab += abschnitt.dauer
      }
    }

    for (const unterbrechung of element.unterbrechungen ?? []) {
      eintragFuer(unterbrechung.aktionRef).unterbrechungen.push(unterbrechung.zeitstelle)
    }
  }

  // Aufsteigend, damit die Anzeige die fruehste Stelle zuerst nennt - unabhaengig davon,
  // in welcher Reihenfolge die Elemente in der Liste stehen.
  for (const verwendung of ergebnis.values()) {
    verwendung.unterbrechungen.sort((a, b) => a - b)
  }
  return ergebnis
}

/** `m:ss` - dieselbe Schreibweise wie die Zeitachse der Zeitleiste (ohne Frames). */
export function formatiereSekunden(sekunden: number): string {
  const ganz = Math.max(0, Math.round(sekunden))
  const ss = ganz % 60
  const mm = Math.floor(ganz / 60)
  return `${mm}:${String(ss).padStart(2, '0')}`
}

/**
 * Der Text der Zeile - kurz genug fuer 240 px, vollstaendig genug, um ohne Oeffnen zu wissen,
 * wohin die Aktion gehoert. Leer heisst: die Aktion laeuft NIRGENDS (dann steht dort ein
 * Hinweis, kein Nichts).
 */
export function verwendungsText(verwendung: Verwendung | undefined): string {
  if (verwendung === undefined) return 'noch nicht im Video'
  const teile: string[] = []
  if (verwendung.band !== null) {
    teile.push(`Band ab ${formatiereSekunden(verwendung.band.abSekunden)}`)
  }
  for (const stelle of verwendung.unterbrechungen) {
    teile.push(`Unterbrechung ${formatiereSekunden(stelle)}`)
  }
  if (teile.length === 0) return 'noch nicht im Video'
  const band = verwendung.band
  return band !== null && band.wiederholungen > 1
    ? `${teile.join(' · ')} · ${band.wiederholungen}×`
    : teile.join(' · ')
}
