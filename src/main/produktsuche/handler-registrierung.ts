// [produktsuche] Handler beim Auftrags-Dispatcher anmelden (FA-30 / TK 9.20)
//
// Dieselbe Form wie `produktfoto/handler-registrierung.ts`: die Funktionsreferenz selbst,
// keine umhuelle Schicht, kein eigenes try/catch und KEIN Abbrecher - ein laufender
// Suchschritt hat eine 20-s-Grenze; "Abbrechen gibt es laut FA-18 nur fuer `render`"
// (TK 9.3). Fortschritt, Fehlergrund und Wiederholen erbt der Auftrag von 9.3.

import { registriereAuftragsHandler } from '../auftrags-manager/dispatcher'
import { produktseiteSuchen } from './produktsuche-ausfuehren'

export function registriereProduktsucheHandler(): void {
  registriereAuftragsHandler('produktseite-suche', produktseiteSuchen)
}
