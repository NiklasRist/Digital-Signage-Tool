// src/main/project-store/setze-standard-segmentdauer.ts
// [project-store] setzeStandardSegmentdauer - die projektweite Standarddauer wird
// aenderbar (#334, TK 9.5.2 seit v3.18). Atomarer Zug: Standard setzen und abgewaehlte
// Aktionen auf ihrem bisher wirksamen Wert einfrieren.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { ProjectStoreFehlercode } from './assets'
import { DAUER_BEREICH } from '../../shared/contracts/konstanten'
import { holeAktivesProjekt } from './aktives-projekt'
import { planeAutoSpeicherung } from './auto-speichern'
import { mitD1Lock } from './d1-lock'

export async function setzeStandardSegmentdauer(
  dauer: number,
  festzuschreibendeAktionen: string[],
): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  // 1. Bereichspruefung VOR dem Lock und VOR jeder Mutation: Bei ungueltige_eingabe
  //    darf GAR NICHTS geaendert sein - auch nicht der Standard. Geprueft wird
  //    ausschliesslich gegen DAUER_BEREICH (#21), nie gegen Zahlenliterale; die
  //    Endlichkeitspruefung zuerst, weil `NaN < min` und `NaN > max` beide falsch sind.
  if (!Number.isFinite(dauer) || dauer < DAUER_BEREICH.min || dauer > DAUER_BEREICH.max) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          `Die Standarddauer muss zwischen ${DAUER_BEREICH.min} und ` +
          `${DAUER_BEREICH.max} Sekunden liegen (erhalten: ${String(dauer)}).`,
      },
    }
  }

  // Das Lock nimmt diese Operation SELBST (#32); der Handler wickelt sie nicht zusaetzlich ein.
  return mitD1Lock(async () => {
    // 2. Nur das geladene Projekt wird angefasst; ohne geladenes Projekt: kein_projekt.
    const projekt = holeAktivesProjekt()
    if (!projekt) {
      return {
        ok: false,
        fehler: { code: 'kein_projekt', meldung: 'Es ist kein Projekt geladen.' },
      }
    }

    // 3. Erst ALLE Kennungen pruefen, dann irgendetwas schreiben - alles oder nichts.
    for (const id of festzuschreibendeAktionen) {
      if (!projekt.aktionen.some((aktion) => aktion.id === id)) {
        return {
          ok: false,
          fehler: {
            code: 'ungueltige_eingabe',
            meldung: `Unbekannte Aktions-ID "${id}" - es wurde nichts geaendert.`,
          },
        }
      }
    }

    // 4. Einfrier-Werte aus dem ALTEN Stand lesen (`?? projekt.standardSegmentdauer`,
    //    bevor Schritt 5 den Standard ueberschreibt). Bereits eingefrorene Aktionen
    //    behalten ihren Wert - er ist ja ihr bisher wirksamer. Doppel-Eintraege sind
    //    harmlos: Der zweite Lauf findet den Wert schon vor.
    for (const id of festzuschreibendeAktionen) {
      const aktion = projekt.aktionen.find((a) => a.id === id)
      if (aktion && aktion.standardDauer === null) {
        aktion.standardDauer = projekt.standardSegmentdauer
      }
    }

    // 5. Erst jetzt der neue Standard.
    projekt.standardSegmentdauer = dauer

    // 6. Einmal vormerken, nach allen Mutationen, mit dem lebenden Objekt (#47).
    planeAutoSpeicherung(projekt)

    // 7.
    return { ok: true, wert: projekt }
  })
}
// - nimmt das D1-Lock SELBST (mitD1Lock, #32); der Handler darf sie NICHT zusätzlich einwickeln
// - wirkt AUSSCHLIESSLICH auf das GELADENE Projekt (nur eines ist geladen, TK 9.5.1)
// - validiert dauer gegen DAUER_BEREICH (#21), nie gegen Zahlenliterale
