// [produktfoto] Handler beim Auftrags-Dispatcher anmelden (FA-27 / TK 9.19.2)
//
// Dieselbe Form wie `media-service/handler-registrierung.ts`: die Funktionsreferenz
// selbst, keine umhüllende Schicht, kein eigenes try/catch und KEIN Abbrecher - ein
// laufender Abruf ist ein Netzabruf mit 15-s-Grenze; „Abbrechen gibt es laut FA-18 nur
// fuer `render`" (TK 9.3, dortiger Vermerk).

import { registriereAuftragsHandler } from '../auftrags-manager/dispatcher'
import { produktfotoAbrufen } from './produktfoto-abrufen'

export function registriereProduktfotoHandler(): void {
  registriereAuftragsHandler('produktfoto-abruf', produktfotoAbrufen)
}
