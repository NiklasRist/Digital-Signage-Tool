// [ipc-gateway] Den Kanal project:setzeStandardSegmentdauer verdrahten (#334)
//
// Muster ist src/main/ipc-gateway/project-store-nachtrag.ts (#153): genau EINE
// Verdrahtungsdatei fuer GENAU EINEN nachgetragenen project-Kanal, weil die
// Stammdateien (#76, #153) ihre Eintragszahl nicht ueberschreiten duerfen und #240/#323
// ihre eigenen Dateien haben.

import { KANAELE } from '../../shared/contracts/kanaele'                          // #25
import { setzeStandardSegmentdauer } from '../project-store/setze-standard-segmentdauer' // #334
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'      // #332
import { registriereHandler } from './registriere-handler'                        // #23

import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird - zeichengleich zur Huelle
 * `meldeAn` in `project-store-nachtrag.ts` (#153); ihre Zusammenfuehrung braucht ein
 * eigenes Issue, nicht diese Datei.
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) =>
    // SAFETY: pruefe hat die Nutzlast unmittelbar zuvor validiert; der Cast benennt nur
    // diese belegte Form.
    rufe(validierteNutzlast as W),
  )
}

export function verdrahteProjectStoreNachtrag4IPC(): void {
  // KEIN Schutz gegen einen zweiten Aufruf: #3 ruft genau einmal, und `ipcMain.handle`
  // wirft bei doppelter Anmeldung von sich aus - das SOLL auffallen. Kein Ereignis,
  // keine Fensterreferenz, kein Zustand, kein eigenes try/catch (das gehoert dem
  // Wrapper #23), kein Lock (die Operation nimmt das D1-Lock selbst).

  meldeAn(
    KANAELE.project.setzeStandardSegmentdauer,
    // Der ausgeschriebene Rueckgabetyp legt `W` fest, bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ dauer: number; festzuschreibendeAktionen: string[] }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt(
          'setzeStandardSegmentdauer erwartet ein Objekt { dauer, festzuschreibendeAktionen }.',
        )
      }
      // NUR die FORM wird geprueft: endliche Zahl und Feld vorhanden. Den Bereich
      // 10-45 s prueft ausschliesslich die Operation selbst (#334, gegen DAUER_BEREICH) -
      // eine zweite Fachpruefung an dieser Stelle waere schlimmer als keine.
      const dauer = nutzlast.dauer
      if (typeof dauer !== 'number' || !Number.isFinite(dauer)) {
        return abgelehnt('setzeStandardSegmentdauer braucht eine endliche Zahl dauer.')
      }

      const aktionen = nutzlast.festzuschreibendeAktionen
      if (!Array.isArray(aktionen)) {
        return abgelehnt(
          'setzeStandardSegmentdauer braucht ein Array festzuschreibendeAktionen.',
        )
      }
      for (const id of aktionen) {
        if (!istGefuellterText(id)) {
          return abgelehnt(
            'setzeStandardSegmentdauer braucht in festzuschreibendeAktionen nur nicht leere Aktions-IDs.',
          )
        }
      }

      // SAFETY: Form ist belegt (Zahl, String-Array); die Existenz der IDs im geladenen
      // Projekt und der Dauer-Bereich sind Fachpruefung der Operation (#334).
      return {
        ok: true,
        wert: { dauer, festzuschreibendeAktionen: aktionen as string[] },
      }
    },
    ({ dauer, festzuschreibendeAktionen }) =>
      setzeStandardSegmentdauer(dauer, festzuschreibendeAktionen),
  )
}
