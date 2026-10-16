// [contracts] Typen RenderResult und RenderProgress definieren

export type RenderResult =
  | { status: 'erfolg'; renderId: string; ausgabePfad: string; ausgabeName: string; gesamtdauer: number; dateigroesse: number }
  | { status: 'fehler'; renderId: string; fehlercode: string; fehlerhaftesElementId: string | null; meldung: string }
  | { status: 'abgebrochen'; renderId: string; abgebrochenBei: number | null }

// KEIN Feld `historieEintrag` und KEIN Typ `HistorieEintrag`. Beide sind mit TK v2.8 ersatzlos
// gestrichen (TK 9.2.3). Der Q3-Protokolleintrag wird ALLEIN von der Auftragsverwaltung gebaut;
// der render-service liefert nur, was NUR ER weiss: Pfad, Ausgabename, Groesse und Gesamtdauer.
// `ausgabeName` ist der tatsaechlich verwendete Name OHNE Endung (TK v3.2, 9.2.3). Er reist NUR
// in `Auftrag.ergebnis` und geht NICHT in `ProtokollEintrag.ausgabe` – dort steckt er im Pfad.

// `RenderProgress` wird hier NICHT ZWEITES MAL DEFINIERT, sondern nur weitergereicht.
// Mit #157 ist der Typ in eine eigene Datei gezogen worden; die Zweitdefinition, die hier
// stehen blieb, war Feld fuer Feld identisch - und genau deshalb gefaehrlich: Beide
// Fassungen sind strukturell zuweisbar, ein Auseinanderdriften faellt dem Uebersetzer
// NICHT auf. Die Verbraucher waren gespalten (`render-verzahnung.ts` und `render-reel.ts`
// hier, `ipc-gateway/export-verdrahtung.ts` und `renderer/queue-panel/fortschritt.ts`
// dort); ein Feld, das nur auf einer Seite ergaenzt wird, braeche die Fortschrittskette
// lautlos. Es gibt jetzt genau EINE Wahrheit: `render-progress.ts` (#157).
export type { RenderProgress } from './render-progress'
