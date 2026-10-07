// [ipc-gateway] Den Kanal project:setzeStandardMarke verdrahten (#323, TK 9.5.2)
//
// Muster ist src/main/ipc-gateway/project-store-nachtrag-4.ts (#334): genau EINE
// Verdrahtungsdatei fuer GENAU EINEN nachgetragenen project-Kanal. Der Handler
// prueft hier die markeId gegen den marken-store (#283) - der Store selbst tut es
// NICHT; die Richtung marken-store -> project-store bleibt einseitig (TK 9.5.2).

import { KANAELE } from '../../shared/contracts/kanaele'                      // #25
import { leseMarke } from '../marken-store/lese-marke'                        // #283
import { setzeStandardMarke } from '../project-store/setze-standard-marke'    // #323
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'  // #332
import { registriereHandler } from './registriere-handler'                    // #23

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'

interface StandardMarkenNutzlast {
  projektId: string
  markeId: string
}

function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) =>
    // SAFETY: pruefe hat die Nutzlast unmittelbar zuvor validiert; der Cast benennt nur
    // diese belegte Form. (dieselbe Huelle wie #334)
    rufe(validierteNutzlast as W),
  )
}

function pruefeForm(nutzlast: unknown): Ergebnis<StandardMarkenNutzlast, 'ungueltige_eingabe'> {
  if (!istObjekt(nutzlast)) {
    return abgelehnt('setzeStandardMarke erwartet ein Objekt { projektId, markeId }.')
  }
  if (!istGefuellterText(nutzlast.projektId)) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere projektId.')
  }
  if (!istGefuellterText(nutzlast.markeId)) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere markeId.')
  }
  // SAFETY: Form belegt (zwei gefuellte Texte). Ob die markeId existiert, prueft
  // der Handler hier unten; ob das Projekt existiert, prueft die Operation selbst
  return { ok: true, wert: { projektId: nutzlast.projektId, markeId: nutzlast.markeId } }
}

export function verdrahteProjectStoreNachtrag3IPC(): void {
  // GENAU EIN Kanal; KEIN Schutz gegen zweiten Aufruf (wie #334), kein Fenster,
  // kein Zustand, kein zweites Lock um die Operation.
  meldeAn<StandardMarkenNutzlast, Project, string>(
    KANAELE.project.setzeStandardMarke,
    pruefeForm,
    async ({ projektId, markeId }) => {
      // Die Existenz prueft der Handler, NICHT der Store (TK 9.5.2). Ein Fehler
      // der Pruefung reist UNVERAENDERT; ohne Pruefergebnis laeuft der Store NICHT.
      const marke = await leseMarke(markeId)
      if (!marke.ok) return marke
      return setzeStandardMarke(projektId, markeId)
    },
  )
}
