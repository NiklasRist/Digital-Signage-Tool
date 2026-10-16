// [contracts] Typ Auftrag und Auftragsarten definieren

import type { ExportRequest } from './export-request'
import type { ImportRequest, LöschRequest } from './medien-request'
import type { RenderRequest } from './render-request'
export type AuftragArt = 'import' | 'loeschen' | 'render' | 'export'
export type AuftragStatus = 'anstehend' | 'laeuft' | 'erfolg' | 'fehlgeschlagen' | 'abgebrochen'

// Zu `fehler.code` – in allen vier Varianten unten `string`:
// Fehlercode aus der Union des ausfuehrenden Fachdienstes; hier bewusst weit typisiert, weil der
// GETEILTE Vertrag die fachlichen Unionen der Main-Module (media-service, render-service,
// export-service) nicht kennen darf - sonst muesste contracts/ auf Main-Code zeigen. Die Enge
// entsteht dort, wo der Code ENTSTEHT (Ergebnis<T, F> bzw. HandlerErgebnis<F>), nicht dort, wo er
// abgelegt wird.
export type Auftrag =
  | { auftragId: string; art: 'import'; status: AuftragStatus; label: string; payload: ImportRequest; fortschritt: number | null; versuche: number; fehler: { code: string; meldung: string; daten?: unknown } | null; ergebnis: unknown | null; erstelltAm: string }
  | { auftragId: string; art: 'loeschen'; status: AuftragStatus; label: string; payload: LöschRequest; fortschritt: number | null; versuche: number; fehler: { code: string; meldung: string; daten?: unknown } | null; ergebnis: unknown | null; erstelltAm: string }
  | { auftragId: string; art: 'render'; status: AuftragStatus; label: string; payload: RenderRequest; fortschritt: number | null; versuche: number; fehler: { code: string; meldung: string; daten?: unknown } | null; ergebnis: unknown | null; erstelltAm: string }
  | { auftragId: string; art: 'export'; status: AuftragStatus; label: string; payload: ExportRequest; fortschritt: number | null; versuche: number; fehler: { code: string; meldung: string; daten?: unknown } | null; ergebnis: unknown | null; erstelltAm: string }
