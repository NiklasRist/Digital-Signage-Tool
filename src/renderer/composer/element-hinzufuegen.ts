// GENERIERT aus dem Signaturblock von Issue #123.
// [composer] Ein Element zur Wiedergabeliste hinzufügen
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
// GERUEST-PRUEFSUMME: 434023edddab94b6
//
// ---------------------------------------------------------------------------
// HIER ENTSTEHT JEDES LISTENELEMENT - UND ZWAR NICHT IN DIESER DATEI.
//
// Der ganze Rumpf besteht aus drei Schritten: fragen, ob ueberhaupt gefragt werden
// kann; den Main fragen; das ZURUECKGEGEBENE Element anhaengen. Alles, was daneben
// naheliegt, ist ausdruecklich verboten:
//
//   - keine `art` aus einer Dateiendung, keine Startdauer aus der Vorgabe der
//     `Aktion`, kein `trimStart: 0` "schon mal mitgeschickt". Die Belegung je `art` legt
//     TK 9.11.3 fest und setzt der Main (#41). Eine zweite Fachlogik hier liefe bei
//     der naechsten Vertragsaenderung still auseinander, und das Ergebnis waere ein
//     Element mit widerspruechlicher Belegung (`dauer` UND `trimStart` gesetzt), das
//     weder Vorschau noch Render eindeutig lesen koennen.
//   - keine "schon in der Liste"-Pruefung, keine Entdopplung. "mehrere
//     Listenelemente duerfen dieselbe Aktion referenzieren" (TK 9.7.2) - eine
//     Werbeaktion mehrfach ueber die Schleife zu verteilen IST die Betriebsart, fuer
//     die das Datenmodell gebaut wurde.
//   - kein Vorfiltern nach `Asset.zustand`. Ob ein fehlendes Medium ueberhaupt
//     platziert werden darf, entscheidet der Main; eine Sperre hier waere eine
//     stille zweite Regel. Kaputte Elemente faengt der Reparatur-Modus (TK 9.7.5).
//
// NICHT OPTIMISTISCH - und das ist keine Bequemlichkeit. TK 9.7.3 nennt
// "Reorder/Trim/Dauer" als die optimistisch bedienten Vorgaenge; Hinzufuegen steht
// dort nicht. Der zwingende technische Grund ist die `id`: Sie ist eine UUID, die
// der MAIN vergibt (TK 9.11.4). Ein optimistisch eingefuegtes Element haette keine
// oder eine erfundene - und beim Abgleich mit dem Rueckgabestand muesste der
// Renderer raten, welches der beiden Objekte dasselbe meint. Deshalb gibt es hier
// auch keinen Rollback-Pfad: Wo nichts vorweggenommen wird, ist nichts
// zurueckzunehmen, und die Sicht bleibt bei JEDEM Fehlschlag einfach unberuehrt.
//
// UND KEIN ZWEITER SPEICHER. Angehaengt wird ueber `setzeListe` (#121), damit die
// gemeinsame Sicht die einzige Wahrheit im Renderer bleibt ("die Liste im composer
// ist nur eine Sicht; nach jeder Mutation mit dem Rueckgabestand abgleichen",
// TK 9.7.4). Angehaengt wird EXAKT das zurueckgegebene Objekt, nicht eine daraus
// nachgebaute Variante.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { holeSicht, setzeListe } from './projektzustand'

/** Stellt den Eintrag mit dieser Referenz ans Ende der Liste. `referenz` ist ENTWEDER eine
 *  Asset-ID (Video/Bild) ODER eine Aktions-ID (Segment) – welche es ist, entscheidet der Main. */
export async function fuegeElementHinzu(
  referenz: string,
  position?: number,
): Promise<Ergebnis<Listenelement>> {
  // `typeof` trotz `string` in der Signatur: Die Referenz kommt aus der Oberflaeche
  // (Medienliste, Aktions-Bibliothek, Drag) und kann dort aus einer ungetypten
  // Quelle stammen. Der Main weist einen leeren Wert ohnehin ab; hier abgefangen
  // wird er trotzdem, weil ein Aufruf ohne Referenz ein Bedienfehler der Oberflaeche
  // ist und nicht als Antwort des Main erscheinen soll.
  //
  // Gemessen wird mit `trim()` - dieselbe Grenze, die die Nutzlast-Pruefung des
  // ipc-gateway zieht (`istGefuellterText`: `typeof wert === 'string' &&
  // wert.trim() !== ''`). Zwei verschiedene Grenzen an derselben Naht waeren die
  // Sorte Abweichung, die erst beim Kunden auffaellt.
  if (typeof referenz !== 'string' || referenz.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'fuegeElementHinzu braucht eine nicht leere Referenz.',
      },
    }
  }

  // KEIN Projekt geladen -> gar nicht erst fragen. Der Main haette ohne offenes
  // Projekt nichts, worin das Element stuende, und die Sicht koennte das Ergebnis
  // nirgends aufnehmen.
  if (holeSicht().projekt === null) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Es ist kein Projekt geladen, dessen Wiedergabeliste ergaenzt werden koennte.',
      },
    }
  }

  // Die Nutzlast ist AUSSCHLIESSLICH `{ referenz }` - so verlangt es die
  // Form-Pruefung des ipc-gateway, und jedes weitere Feld waere eine Vorbelegung,
  // die dieser Datei verboten ist. Die Referenz geht dabei UNVERAENDERT hinaus:
  // `trim()` oben ist eine Messung, keine Umformung; wer hier den gekuerzten Wert
  // schickte, veraenderte stillschweigend eine ID.
  //
  // `rufeAuf<Listenelement>` ohne zweiten Typparameter - dieselbe Form, die
  // `ladeProjekt` in #121 benutzt. Der Fehlercode reist zur LAUFZEIT unveraendert
  // durch (nichts in dieser Datei fasst ihn an); der Typparameter beschreibt nur,
  // was der Aufrufer statisch sieht. Enger machen kann ihn diese Datei nicht: Die
  // fachlichen Codes des project-store liegen in src/main/** und duerfen im
  // Renderer nicht importiert werden.
  // KONDITIONALE Nutzlast (#411): Ohne `position` bleibt das Objekt SCHLUESSELGENAU das
  // alte { referenz } - der Vertragstest der Bestands-Spec (Schluesselmenge ['referenz'])
  // bleibt gruen; ein Shorthand { referenz, position } wuerde den Schluessel
  // `position: undefined` mitreisen lassen und die Naht erweitern, ohne dass der Main
  // ihn liest.
  const nutzlast =
    position === undefined ? { referenz } : { referenz, position }
  const antwort = await rufeAuf<Listenelement>(KANAELE.project.fügeElementHinzu, nutzlast)

  if (!antwort.ok) {
    // Unveraendert durchgereicht - Code UND Meldung. An den Codes haengt echtes
    // Verhalten in der Oberflaeche; ein eigener Ersatzcode waere eine zweite
    // Deutung desselben Vorfalls. Die Sicht bleibt unberuehrt.
    return antwort
  }

  // ERST JETZT die Sicht anfassen, und zwar mit dem Stand von JETZT: `holeSicht()`
  // wird nach dem `await` erneut geholt. Ein vor dem Aufruf gemerkter Stand waere
  // waehrend der Wartezeit veraltet - ein parallel gelaufenes Entfernen oder
  // Umsortieren wuerde beim Zurueckschreiben rueckgaengig gemacht. `holeSicht()`
  // liefert bei jeder Aenderung ein NEUES Objekt, ein gemerkter Stand aendert sich
  // also nie mit.
  const projekt = holeSicht().projekt
  if (projekt !== null) {
    // AN DIE RUECKGABE-POSITION (#411). Mit `position` fuegt sich das Element an DIESEM
    // Index in die SICHT ein (neues Array, Unveraenderlichkeits-Invariante aus #121);
    // ohne `position` wie bisher ans ENDE: "Umsortieren danach ist Sache von #122."
    // (#123-Wortlaut). Sicht und Main einigen sich ueber DENSELBEN Index - es gibt kein
    // zweites Positions-Buch (TK 9.11.3, "kein separates position-Feld").
    //
    // Grenzfall nur zur Absicherung gegen eine Concurrent-Mutation zwischen Main-Ruf und
    // Rueckkehr: Ist die Sichtliste inzwischen anders lang, klemmt der Index ans Ende
    // (so haengt `slice` das Element ans Ende) - der naechste Abgleich (TK 9.7.4)
    // zeigt dann den D1-Stand. Der Main lehnt position > Listenlaenge ohnehin ab (#411).
    const liste = projekt.liste
    if (position === undefined) {
      setzeListe([...liste, antwort.wert])
    } else {
      const stelle = Math.max(0, Math.min(position, liste.length))
      setzeListe([...liste.slice(0, stelle), antwort.wert, ...liste.slice(stelle)])
    }
  }
  // Ist das Projekt waehrend des Aufrufs verschwunden (geschlossen, geloescht), wird
  // NICHT ersatzweise irgendwo eingehaengt: Der Main hat das Element einem Projekt
  // hinzugefuegt, das der Nutzer nicht mehr offen hat. Der Erfolg wird trotzdem
  // ehrlich zurueckgemeldet - er hat stattgefunden.

  return antwort
}
