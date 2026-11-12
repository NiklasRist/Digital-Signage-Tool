// [ipc-gateway] Die drei Produktfoto-Kanäle verdrahten (FA-27 / TK 9.19)
//
// `produkt:abrufen` reiht den Abruf über `reiheEin` ein - derselbe Weg wie jeder Import
// (TK 9.19.2), kein Nebenweg. `produkt:waehlen` und `produkt:verwerfen` sind
// Instant-Operationen: Sie fassen den Kandidatenspeicher des Main an, keine Projektdatei.
//
// KEIN KANAL UND KEINE NUTZLAST TRÄGT BILDBYTES: Die Kandidaten bleiben im Main; der
// Renderer bekommt Adresse, Typ und Größe (Issue #470, Signaturblock 4).

import { KANAELE } from '../../shared/contracts/kanaele'
import { reiheEin } from '../auftrags-manager/reihe-ein'
import { leereAbrufe, verwirfAbruf } from '../produktfoto/kandidaten-speicher'
import { waehleKandidat } from '../produktfoto/waehle-kandidat'
import { meldeAn } from './melde-an'
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'

import type { BrowserWindow } from 'electron'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProduktWahlRequest } from '../../shared/contracts/produktabruf'

export function verdrahteProduktAbrufIPC(fenster: BrowserWindow): void {
  meldeAn(
    KANAELE.produkt.abrufen,
    (
      nutzlast: unknown,
    ): Ergebnis<
      { projektId: string; aktionId: string; produktUrl: string },
      'ungueltige_eingabe'
    > => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('produkt:abrufen erwartet ein Objekt { projektId, aktionId, produktUrl }.')
      }
      const projektId = nutzlast.projektId
      const aktionId = nutzlast.aktionId
      const produktUrl = nutzlast.produktUrl
      if (!istGefuellterText(projektId)) {
        return abgelehnt('produkt:abrufen braucht eine nicht leere projektId.')
      }
      // LEER IST ERLAUBT: Im Modus „neu" existiert die Aktion noch nicht; der Editor
      // schickt dann einen leeren Text. Die Kennung ordnet nur die Antwort zu und wird
      // vom Abruf nicht geschrieben (TK 9.19.2: „Der Auftrag schreibt keine Aktion").
      if (typeof aktionId !== 'string') {
        return abgelehnt('produkt:abrufen braucht eine aktionId (leer erlaubt).')
      }
      if (!istGefuellterText(produktUrl)) {
        return abgelehnt('produkt:abrufen braucht eine nicht leere produktUrl.')
      }
      return { ok: true, wert: { projektId, aktionId, produktUrl } }
    },
    ({ projektId, aktionId, produktUrl }) =>
      reiheEin('produktfoto-abruf', { projektId, aktionId, produktUrl }),
  )

  meldeAn(
    KANAELE.produkt.waehlen,
    (nutzlast: unknown): Ergebnis<ProduktWahlRequest, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('produkt:waehlen erwartet ein Objekt { abrufId, kandidat }.')
      }
      const abrufId = nutzlast.abrufId
      const kandidat = nutzlast.kandidat
      if (!istGefuellterText(abrufId)) {
        return abgelehnt('produkt:waehlen braucht eine nicht leere abrufId.')
      }
      if (typeof kandidat !== 'number' || !Number.isInteger(kandidat) || kandidat < 0) {
        return abgelehnt('produkt:waehlen braucht einen Kandidaten-Index ab 0.')
      }
      return { ok: true, wert: { abrufId, kandidat } }
    },
    ({ abrufId, kandidat }) => waehleKandidat(abrufId, kandidat),
  )

  meldeAn(
    KANAELE.produkt.verwerfen,
    (nutzlast: unknown): Ergebnis<{ abrufId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('produkt:verwerfen erwartet ein Objekt { abrufId }.')
      }
      const abrufId = nutzlast.abrufId
      if (!istGefuellterText(abrufId)) {
        return abgelehnt('produkt:verwerfen braucht eine nicht leere abrufId.')
      }
      return { ok: true, wert: { abrufId } }
    },
    async ({ abrufId }) => {
      // Verwerfen ist idempotent: Ein bereits verfallener Abruf ist kein Fehler, sondern
      // genau der Zustand, den der Aufrufer herstellen wollte.
      verwirfAbruf(abrufId)
      return { ok: true, wert: undefined }
    },
  )

  // Beim Schliessen des Fensters verfallen die Kandidaten (TK 9.19.2). Angemeldet wird
  // SOFORT; aufgeschoben ist nur das Abmelden, wie bei der Warteschlange (TK 9.1.1 Punkt 10).
  fenster.once('closed', () => {
    leereAbrufe()
  })
}
