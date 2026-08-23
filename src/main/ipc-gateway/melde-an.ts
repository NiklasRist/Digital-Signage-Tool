// Die Anmelde-Huelle der IPC-Verdrahtungen (#333).
//
// UMZUG, KEINE NEUENTWICKLUNG: `meldeAn` lag bis zum 23.08.2026 wortgleich dreifach -
// in `auftrags-manager/ipc-verdrahtung.ts` (#71), `ipc-gateway/config-store-verdrahtung.ts`
// (#77) und `ipc-gateway/project-store-verdrahtung.ts` (#76). Die Wortgleichheit ist per
// Pruefsumme belegt (SHA-256 der kommentarbereinigten Koerper identisch, 9d94b7f2..., 11
// Zeilen). Der Rumpf ist unveraendert umgezogen, nicht umgeschrieben.
//
// WARUM EIGENE DATEI UND NICHT `nutzlast-pruefer.ts`: Dort liegen reine Prueffunktionen -
// kein Zustand, kein Nebeneffekt, keine Abhaengigkeit ausser einem Typ. `meldeAn` ist KEIN
// Pruefer: Sie prueft nichts selbst, haengt an `registriereHandler` (#23) und damit an der
// Kanal-Registry, und traegt mit dem SAFETY-Cast die EINE Stelle, an der aus `unknown`
// etwas Getippt wird. Die beiden Bausteine in eine Datei zu legen verwischte genau die
// Unterscheidung, um derentwillen #332 die Pruefer ueberhaupt zusammengezogen hat.
//
// DER KOMMENTARAPPARAT DER DREI KOPIEN IST HIER EINMAL GEFUEHRT - nicht mehr dreifach.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { registriereHandler } from './registriere-handler' // #23

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird.
 *
 * WARUM ES SIE GIBT: `registriereHandler` (#23) reicht der Fachoperation genau das
 * herein, was der Validierer als `wert` zurueckgegeben hat - aber seine Signatur
 * schreibt `validierteNutzlast: unknown`, der Typ geht auf dem Weg also verloren. Ohne
 * diese Huelle stuende in jedem verdrahteten Kanal ein eigenes `as`; verstreute
 * Behauptungen kann niemand mehr gegen ihren Validierer halten, und die erste, die zum
 * falschen Validierer gehoert, faellt erst zur Laufzeit auf.
 *
 * Hier steht die Behauptung EINMAL, und `pruefe` und `rufe` sind ueber `W` aneinander
 * gebunden: Ein Validierer, der etwas anderes liefert als die Operation erwartet,
 * uebersetzt nicht. Die Behauptung selbst ist durch #23 gedeckt - der Wrapper reicht
 * `geprueft.wert` durch, nichts anderes.
 */
export function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) =>
    // SAFETY: pruefe hat die Nutzlast unmittelbar zuvor validiert und in die Huelle
    // gelegt; der Cast benennt diese belegte Form, damit rufe den geprueften Typ sieht.
    rufe(validierteNutzlast as W),
  )
}
