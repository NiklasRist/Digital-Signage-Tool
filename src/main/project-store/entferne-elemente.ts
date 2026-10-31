// [project-store] entferneElemente - MEHRERE Listenelemente in EINEM Schritt (#392)
//
// WARUM ES DIESE DATEI GIBT: Das Gruppen-Entfernen der Mehrfachauswahl soll EIN
// Undo-Schritt sein. Mit dem bestehenden `entferneElement` ginge das nicht: Die
// Undo-Huelle (`undo-aufzeichnung.ts`) entscheidet JE AUFRUF, ob sie einen
// Schnappschuss ablegt - N Einzelaufrufe ergaeben N Schritte. Diese Operation
// streicht alle genannten Elemente unter EINEM D1-Lock und plant EINEN
// Speichervorgang; der Renderer nimmt danach EINEN Sicht-Schritt.
//
// DIE REGELN SIND DIE VON `entferneElement` (#42), nur fuer eine Menge:
//   - Nur `Project.liste` wird angefasst. Assets und Aktionen bleiben (TK 9.5.3).
//   - Keine Datei wird geloescht - das ist Sache des media-service (TK 9.4.6).
//   - Kein Nachfuehren von Positionen: Es gibt kein Positionsfeld (TK 9.11.3).
//   - Entprellt gespeichert wie jede Instant-Operation (TK 9.5.4).
//
// ALLES ODER NICHTS: Ist auch nur eine Kennung nicht in der Liste, wird NICHTS
// entfernt und `nicht_gefunden` genannt. Ein Teil-Erfolg waere die unangenehmste
// Antwort: Der Nutzer haette drei von vier Elementen verloren und wuesste nicht,
// welches blieb. Der Aufrufer (die Auswahl wird vorher gegen die Liste bereinigt)
// kann den Fall nur durch einen veralteten Stand ausloesen.

import { holeAktivesProjekt } from './aktives-projekt'          // #192
import { planeAutoSpeicherung } from './auto-speichern'         // #47
import { mitD1Lock } from './d1-lock'                           // #32
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72

export async function entferneElemente(
  elementIds: readonly string[],
): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // Die Form-Pruefung des Gateway weist eine leere Liste bereits ab; hier steht die
  // zweite Schranke fuer einen main-internen Aufrufer. Sie ist billig und verhindert,
  // dass ein leerer Aufruf einen ueberfluessigen Speichervorgang plant.
  if (elementIds.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'entferneElemente braucht mindestens eine elementId.',
      },
    }
  }

  // DAS LOCK NIMMT DIESE FUNKTION SELBST - wie `entferneElement`; ein zweites
  // Einwickeln waere die Deadlock-Falle aus #32.
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      return {
        ok: false,
        fehler: {
          code: 'kein_projekt',
          meldung: 'Es ist kein Projekt geoeffnet; es wurde nichts entfernt.',
        },
      }
    }

    // Vorher pruefen, dann streichen: So bleibt die Zusage "alles oder nichts" wahr,
    // auch wenn eine Kennung aus einem veralteten Sicht-Stand stammt.
    const vorhanden = new Set(projekt.liste.map((element) => element.id))
    const fehlend = elementIds.find((id) => !vorhanden.has(id))
    if (fehlend !== undefined) {
      return {
        ok: false,
        fehler: {
          code: 'nicht_gefunden',
          meldung: `Es gibt kein Listenelement mit der Kennung ${String(fehlend)}.`,
        },
      }
    }

    const weg = new Set(elementIds)
    // Rueckwaerts ueber die Indizes: `splice` verschiebt die Nachfolger, ein
    // Vorwaertslauf traefe nach dem ersten Treffer den falschen Eintrag.
    for (let stelle = projekt.liste.length - 1; stelle >= 0; stelle -= 1) {
      const element = projekt.liste[stelle]
      if (element !== undefined && weg.has(element.id)) {
        projekt.liste.splice(stelle, 1)
      }
    }

    // EIN Speichervorgang fuer alle - das ist der Sinn dieser Operation.
    planeAutoSpeicherung(projekt)

    return { ok: true, wert: undefined }
  })
}
