// GENERIERT aus dem Signaturblock von Issue #240.
// [ipc-gateway] Die beiden neuen project-store-Kanäle aus TK v3.1 verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: b6dfab487eac458b

// Die Nutlast-Pruefer (#332) und der Registrier-Wrapper (#23) an EINEM Ort - importiert,
// nicht kopiert; dieselbe Bauweise wie #153 (project-store-nachtrag).
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'
import { registriereHandler } from './registriere-handler'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import type { Bearbeitungsstand } from '../../shared/contracts/project'
import { setzeBearbeitungsstand } from '../project-store/bearbeitungsstand'
import { öffneProjektordner } from '../project-store/oeffne-projektordner'

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird.
 * ZEICHENGLEICH zu `meldeAn` in #153/#76/#77/#71 (die Doppelung ist dort am Dateiende
 * gemeldet; hier passiert sie aus demselben Grund wieder - dasselbe Problem, dieselbe
 * Bauvorschrift, keine neue Entscheidung).
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) => rufe(validierteNutzlast as W))
}

export function verdrahteProjectStoreNachtrag2IPC(): void {
  meldeAn(KANAELE.project.setzeBearbeitungsstand, (nutzlast: unknown): Ergebnis<Bearbeitungsstand, 'ungueltige_eingabe'> => {
    if (!istObjekt(nutzlast)) return abgelehnt('setzeBearbeitungsstand erwartet ein Objekt { stand }.')
    const stand = nutzlast.stand
    if (typeof stand !== 'object' || stand === null) {
      return abgelehnt('setzeBearbeitungsstand braucht einen Stand als Objekt.')
    }
    const roh = stand as { aktionen?: unknown; liste?: unknown }
    if (!Array.isArray(roh.aktionen) || !Array.isArray(roh.liste)) {
      return abgelehnt('Der Stand braucht aktionen und liste als Arrays.')
    }
    return { ok: true, wert: stand as Bearbeitungsstand }
  }, (stand) => setzeBearbeitungsstand(stand))

  meldeAn(
    KANAELE.project.öffneProjektordner,
    (nutzlast: unknown): Ergebnis<{ projektId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('oeffneProjektordner erwartet ein Objekt { projektId }.')
      const projektId = nutzlast.projektId
      if (!istGefuellterText(projektId)) {
        return abgelehnt('oeffneProjektordner braucht eine nicht leere projektId.')
      }
      return { ok: true, wert: { projektId } }
    },
    ({ projektId }) => öffneProjektordner(projektId),
  )
}
// registriert die 2 unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Zustand, keine Fachlogik, kein Ereignis-Versand (s. STOPP).
