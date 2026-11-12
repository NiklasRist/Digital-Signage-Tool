// [contracts] Typ Auftrag und Auftragsarten definieren

import type { ExportRequest } from './export-request'
import type { ImportRequest, LöschRequest } from './medien-request'
import type { ProduktfotoAbrufRequest } from './produktabruf'
import type { RenderRequest } from './render-request'
// `produktfoto-abruf` seit 12.11.2026 (FA-27 / TK 9.19.2): ein Netzabruf ist ein Vorgang
// wie ein Import und gehoert in die vorhandene Warteschlange - kein Nebenweg.
export type AuftragArt = 'import' | 'loeschen' | 'render' | 'export' | 'produktfoto-abruf'
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
  | { auftragId: string; art: 'produktfoto-abruf'; status: AuftragStatus; label: string; payload: ProduktfotoAbrufRequest; fortschritt: number | null; versuche: number; fehler: { code: string; meldung: string; daten?: unknown } | null; ergebnis: unknown | null; erstelltAm: string }
