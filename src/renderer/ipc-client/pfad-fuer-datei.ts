// Issue #335 (NA-02) - der Weg vom gezogenen File-Objekt zu seinem Pfad.
//
// Elektron 43 kennt `File.path` nicht mehr; der verbindliche Weg ist
// `webUtils.getPathForFile(file)` – und der lebt per Vertrag in der
// PRELOAD-Brücke (#1: der Renderer kennt nur window.api, und window.api nur
// HIER in src/renderer/ipc-client). Diese Datei ist die EINE Wrapper-Stelle;
// `medien-bibliothek.ts` (#335) nimmt sie als PARAMETER (`PfadHoler`), um ohne
// Browser prüfbar zu bleiben.

export type File = globalThis.File

// Lokale Sicht auf window.api (bewusst wie bei `rufe-auf.ts`/`ereignisse.ts`):
// KEINE globale Erweiterung - window.api bleibt außerhalb von ipc-client verboten.
type ApiSicht = { pfadFuerDatei?: (d: File) => string }

/** Der Pfad für EINE gezogene Datei; '' wenn die Plattform keinen liefert. */
export function pfadFuerDatei(datei: File): string {
  // SAFETY: `window` existiert im Renderer immer; für den Testfall ohne DOM wird
  // der zutreffende Fall '' geliefert statt zu werfen.
  const sicht = typeof window !== 'undefined' ? (window as unknown as ApiSicht) : undefined
  const holer = sicht?.pfadFuerDatei
  if (typeof holer !== 'function') {
    // Ohne Brücke (etwa im Test ohne jsdom-Setup): nichts zu holen.
    return ''
  }
  const pfad = holer(datei)
  return typeof pfad === 'string' ? pfad : ''
}
