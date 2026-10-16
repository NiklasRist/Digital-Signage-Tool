// Q2/A S7 (docs/agents/schreib-mechanik-plan.md): die generischen Systemfehler-Helfer.
//
// `text` und `istCode` inspizieren rohe Node-Fehler (`unknown`), ohne sie auf einen Typ zu zwingen,
// den sie nicht haben. Sie lagen zuvor in ~24 `main/`-Dateien byte-gleich kopiert (und in den fuenf
// `schreibe-*` zusaetzlich); hier stehen sie EINMAL.
//
// NICHT schreibspezifisch - deshalb ein eigener, neutraler Ort und NICHT `schreib-mechanik.ts`
// (das die Wiederholung und die Backup-Pruefung des atomaren Schreibens traegt).

/** Die Meldung eines Fehlers als Text - `Error` wird ausgelesen, alles andere stringifiziert. */
export function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
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
