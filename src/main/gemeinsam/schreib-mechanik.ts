// Q2/A (docs/agents/schreib-mechanik-plan.md): die gemeinsame Schreib-Mechanik.
//
// Was hier liegt: die domain-freie Mechanik des atomaren Schreibens - Wiederholung bei
// voruebergehenden Fehlern, die Pruefung, ob eine `.bak` als Rueckfallebene taugt, und die
// Inspektion von Node-Systemfehlern.
//
// BEABSICHTIGTE ENTSCHEIDUNG (16.10.2026): In den fuenf `schreibe-*`-Dateien stand zuvor je
// "BEWUSST NICHT importiert: Das waere eine Modulgrenze fuer eine Zahl". Diese Entscheidung ist
// hier BEGRENZT aufgehoben: geteilt wird NUR die Mechanik. Die ZAHL (`WARTEZEITEN_MS`) reist als
// Parameter herein und bleibt je Speicher; die Serialisierung (Serien-Executor, `schreibeJetzt`,
// Fehlercode-Union, Events) bleibt je Speicher - TK 9.5.4 weist jedem Speicher eine EIGENE
// Serialisierung zu.

import fs from 'node:fs/promises'

/**
 * Fuehrt `arbeit` aus und wiederholt sie, solange der Fehler auf ein offenes Handle hindeutet.
 * Rueckgabe `null` = gelungen; sonst der letzte Fehler.
 *
 * Die Wartezeiten kommen HEREIN (die Zahl bleibt je Speicher): der erste Versuch laeuft sofort,
 * danach folgen die uebergebenen Wartezeiten. Die Schleife laeuft ueber die Liste statt ueber
 * einen Zaehler - so gibt es keinen Feldzugriff, der wegen `noUncheckedIndexedAccess` `undefined`
 * liefern koennte, und damit keine Versuchung zum verbotenen `!` (#193).
 *
 * WARUM WIEDERHOLT WIRD (gemessen 10.08.2026, #31): Ein Rename-mit-Ersetzen gelingt auf Windows,
 * scheitert aber mit EPERM, sobald irgendjemand das ZIEL offen haelt - ein reines LESE-Handle
 * genuegt. Das trifft Virenscanner, Sicherungswerkzeuge und Editoren und ist voruebergehend.
 */
export async function mitWiederholung(
  arbeit: () => Promise<void>,
  wartezeiten: readonly number[],
): Promise<unknown> {
  let letzter: unknown = null
  for (const warteMs of [0, ...wartezeiten]) {
    if (warteMs > 0) {
      await new Promise<void>((weiter) => setTimeout(weiter, warteMs))
    }
    try {
      await arbeit()
      return null
    } catch (ursache) {
      letzter = ursache
      // Alles andere (ENOENT, ENOSPC, EACCES) verschwindet nicht von selbst - dort waere
      // Warten nur eine Verzoegerung mit demselben Ausgang.
      if (!istCode(ursache, 'EPERM', 'EBUSY')) {
        return ursache
      }
    }
  }
  return letzter
}

/**
 * Taugt die Datei unter `pfad` als Rueckfallebene? Geprueft wird nur, ob sie parsebares JSON ist -
 * eine kaputte `.bak` als "Sicherung" zu behalten waere schlimmer als keine.
 */
export async function taugtAlsSicherung(pfad: string): Promise<boolean> {
  try {
    // SAFETY: JSON.parse liefert `any`; der Cast auf unknown macht das Ergebnis zum
    // ungeprueften Wert - gewollt, denn hier zaehlt nur das "parsebar ja/nein".
    JSON.parse(await fs.readFile(pfad, 'utf8')) as unknown
    return true
  } catch {
    return false
  }
}

/** Prueft den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht hat. */
export function istCode(ursache: unknown, ...codes: readonly string[]): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  // SAFETY: die Zeile davor hat code in ursache belegt; der Cast macht das Feld
  // sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' && codes.includes(code)
}

/** Die Meldung eines Fehlers als Text - `Error` wird ausgelesen, alles andere stringifiziert. */
export function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
