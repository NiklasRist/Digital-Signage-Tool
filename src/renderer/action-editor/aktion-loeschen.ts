// GENERIERT aus dem Signaturblock von Issue #142.
// [action-editor] Aktion löschen – die Kaskade vorher sichtbar machen
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
// GERUEST-PRUEFSUMME: bfbff5e9845d32b6
//
// DIESE DATEI IST DIE VORSCHAU, NICHT DIE KASKADE. Das Loeschen einer Aktion wirkt
// auf ZWEI Arten gleichzeitig (TK 9.5.3): Ein `segment`-Listenelement, dessen `ref`
// die Aktion ist, VERSCHWINDET ganz; ein Video-Element, dessen Wendeband die Aktion
// fuehrt, BLEIBT und verliert nur die Abschnitte auf diese Aktion. Genau diese
// Unterscheidung erklaert die Vorschau, BEVOR der Nutzer bestaetigt. Der Main
// (#40) rechnet die Kaskade selbst und ist die Wahrheit (TK 9.7.4); die
// Kennungslisten in der Antwort heissen deshalb `entfernteElementIds` und
// `geaenderteElementIds`, waerend die Vorschau ihr Gegenstueck bewusst
// `gekuerzteElementIds` nennt - eine ERWARTUNG ist keine TATSACHE.
//
// Keine Medien werden angefasst, die Kaskade wird nicht selbst ausgefuehrt und es
// gibt keine Form "löschen ohne Rückfrage": `loescheAktion` schickt nur die
// `aktionId` und reicht die Antwort des Main unveraendert weiter. Die Vorschau hier
// wird nicht aufgerufen, und die Bestaetigung ist keine Bedingung dieser Datei -
// beides entscheidet die Oberflaeche.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement, Bearbeitungsstand } from '../../shared/contracts/project'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Was das Löschen bewirken wird – vor dem Absenden aus der Liste berechnet. */
export interface LoeschVorschau {
  entfernteElementIds: string[]      // Segment-Listenelemente: verschwinden ganz (Fall 1)
  gekuerzteElementIds: string[]      // Video-Elemente: nur Bandabschnitte fallen weg (Fall 2)
  baenderWerdenLeer: string[]        // Teilmenge von gekuerzteElementIds: einblendung entfällt ganz
}

/** Die Vorschau. Rein, synchron, ohne Nebenwirkung. */
export function berechneLoeschVorschau(aktionId: string, liste: Listenelement[]): LoeschVorschau {
  const entfernteElementIds: string[] = []
  const gekuerzteElementIds: string[] = []
  const baenderWerdenLeer: string[] = []

  for (const element of liste) {
    // Fall 1: Listenelement mit `art: 'segment'`, dessen `ref` die Aktion ist -> das
    // Element IST diese Aktion und wird ENTFERNT (TK 9.5.3). Die Reihenfolge der
    // Treffer folgt Listenreihenfolge; ein Element trifft hier ODER in Fall 2, nie
    // beide Wege (ein segment laesst seinen Ref auf die Aktion zeigen, `einblendung`
    // traegt ein video).
    if (element.art === 'segment' && element.ref === aktionId) {
      entfernteElementIds.push(element.id)
      continue
    }

    // Fall 2: Video-Element, dessen Band die Aktion als Abschnitt fuehrt. Es bleibt
    // erhalten und verliert nur die Abschnitte auf diese Aktion. `einblendung` ist
    // "nur bei video" (TK 9.11.3); ein `segment` kann hier nicht ankommen, weil es
    // oben schon mit `continue` verbraucht wurde.
    if (element.einblendung !== null && element.einblendung.abschnitte.some((abschnitt) => abschnitt.aktionRef === aktionId)) {
      // Jede ID nur EINMAL: Ein angefuehrter Abschnitt heute, drei morgen - die Id
      // des Videos steht genau hier und nicht ein zweites Mal (das Array wird pro
      // Element hoechstens einmal erweitert).
      gekuerzteElementIds.push(element.id)

      // Randfall (TK 9.5.3): zeigen ALLE Abschnitte auf diese Aktion, bleibt nach
      // dem Entfernen kein Abschnitt uebrig - die Einblendung entfaellt GANZ
      // (`einblendung = null`), das Videoelement bleibt.
      if (element.einblendung.abschnitte.every((abschnitt) => abschnitt.aktionRef === aktionId)) {
        baenderWerdenLeer.push(element.id)
      }
    }
  }

  return { entfernteElementIds, gekuerzteElementIds, baenderWerdenLeer }
}

/** Führt das Löschen über den Kanal aus `KANAELE.project.löscheAktion` aus. */
export async function loescheAktion(aktionId: string): Promise<Ergebnis<{
  stand: Bearbeitungsstand
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}>> {
  // Fruehe Abweisung leerer Kennungen - der Fehlerpfad "aktionId ist leer" gehoert
  // in diese Datei (ungueltige_eingabe, KEIN IPC-Aufruf). Ob die Aktion EXISTIERT,
  // prueft dagegen der Main (#40, nicht_gefunden); hier wird das nicht vorweggenommen.
  if (typeof aktionId !== 'string' || aktionId.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'loescheAktion braucht eine nicht leere aktionId.',
      },
    }
  }

  // Die Antwort UNAENDERERT durchreichen - nicht auspacken, nicht umformen, im
  // Fehlerfall nicht werfen. `rufeAuf` liefert bereits die Ergebnis-Huelle; der
  // Main rechnet die Kaskade selbst (TK 9.5.3) und meldet `stand`, `entfernteElementIds`
  // und `geaenderteElementIds` zurueck - der `stand` schaltet die Sicht weiter, die
  // beiden Kennungslisten erklaeren dem Nutzer, was geschehen ist. Die Vorschau wird
  // hier nicht aufgerufen und die Bestaetigung ist keine Bedingung (Oberflaeche).
  return rufeAuf<{
    stand: Bearbeitungsstand
    entfernteElementIds: string[]
    geaenderteElementIds: string[]
  }>(KANAELE.project.löscheAktion, { id: aktionId })
}
