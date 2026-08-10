// GENERIERT aus dem Signaturblock von Issue #53.
// [contracts] Typen ProtokollEintrag und JournalEintrag definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { AuftragArt } from './auftrag'      // aus #16 – NICHT hier neu definieren

export type Bewegung = 'eingereiht' | 'gestartet' | 'entfernt' | 'erneut_eingereiht'

export type ProtokollErgebnis = 'erfolg' | 'fehlgeschlagen' | 'abgebrochen'

export interface ProtokollEintrag {
  id: string                    // UUID, erzeugt über den geteilten Generator (#20)
  auftragId: string             // derselbe Auftrag kann mehrere Einträge haben (Wiederholungen)
  art: AuftragArt
  projektId: string             // Herkunft: auftrag.payload.projektId – alle vier Nutzlasten
                                // tragen sie (ImportRequest/LoeschRequest TK 9.4.3,
                                // RenderRequest TK 9.2.1, ExportRequest TK 9.6.1).
                                // Der auftrags-manager fuehrt KEIN eigenes "aktives Projekt".
  versuch: number               // 1, 2, 3 … – steigt bei jeder Wiederholung
                                // NICHT verwechseln mit Auftrag.versuche (#16) – dort die
                                // laufende Zaehlung, hier der Stand DIESES Versuchs
  begonnenAm: string            // ISO-8601 UTC
  beendetAm: string             // ISO-8601 UTC
  ergebnis: ProtokollErgebnis
  fehler: { code: string; meldung: string } | null
  // code: Fehlercode aus der Union des ausfuehrenden Fachdienstes; hier bewusst weit typisiert,
  // weil der GETEILTE Vertrag die fachlichen Unionen der Main-Module (media-service,
  // render-service, export-service) nicht kennen darf - sonst muesste contracts/ auf Main-Code
  // zeigen. Die Enge entsteht dort, wo der Code ENTSTEHT (Ergebnis<T, F> bzw. HandlerErgebnis<F>),
  // nicht dort, wo er abgelegt wird.
  // Q3 speichert weiterhin NUR code und meldung - KEIN `daten` (s. Invarianten).
  ausgabe: { pfad: string; dateigroesse: number; gesamtdauer: number | null } | null
  // gesamtdauer ist bei art: export IMMER null – der export-service liefert laut TK 9.6.2
  // nur { zielPfad, dateigroesse }; eine Dauer kennt er nicht. Bei art: render ist sie gesetzt.
}

export interface JournalEintrag {
  zeit: string                  // ISO-8601 UTC
  auftragId: string
  bewegung: Bewegung
  position: number | null       // Platz in der Schlange, wo sinnvoll
}
