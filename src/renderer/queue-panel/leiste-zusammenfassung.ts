// GENERIERT aus dem Signaturblock von Issue #206.
// [queue-panel] Die eingeklappte Zeile
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
// GERUEST-PRUEFSUMME: 3ce27197f84965bf
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { AuftragsSicht } from './auftrags-sicht'

/** Wie die Leiste optisch auftreten soll. `hervorgehoben` = es gibt mindestens einen Fehlschlag. */
export type LeistenTon = 'ruhig' | 'aktiv' | 'hervorgehoben' | 'unbekannt'

export interface LeistenZusammenfassung {
  /** Die eine Zeile, fertig zusammengesetzt. Nie leer. */
  text: string
  ton: LeistenTon
  /** Fortschritt des laufenden Auftrags, 0–100, oder null (unbestimmt bzw. nichts laeuft). */
  fortschritt: number | null
  /** Anzahl der anstehenden Auftraege (ohne den laufenden). */
  anstehend: number
  /** Anzahl der fehlgeschlagenen Auftraege. */
  fehlgeschlagen: number
  /** Der laufende Auftrag, falls einer laeuft – fuer das Label der Zeile. */
  laufender: Auftrag | null
}

export function fasseZusammen(sicht: AuftragsSicht): LeistenZusammenfassung {
  // Zustand `unbekannt` bekommt eine EIGENE Zeile: „noch nicht geholt" ist NICHT
  // „Warteschlange leer" (Invariante 1 des Meilensteins). Ein gestern gescheiterter
  // Render liegt persistent in Q2 (TK 9.3.5); wuerde er unsichtbar, sobald der Stand
  // nicht ermittelbar ist, liesse sich ein Fehlschlag nicht mehr erkennen (FA-17).
  // Es wird nie auf „Warteschlange leer" abgebildet.
  if (sicht.zustand === 'unbekannt') {
    return {
      text: 'Warteschlange wird geladen …',
      ton: 'unbekannt',
      fortschritt: null,
      anstehend: 0,
      fehlgeschlagen: 0,
      laufender: null,
    }
  }

  // Fehlerzustand: eine feste, allgemeine Zeile. Die technische `meldung` erscheint
  // NICHT in der einen Zeile - sie gehoert in die aufgeklappte Liste (#207/#211).
  // Der Ton ist `hervorgehoben`: ein nicht lesbarer Stand ist ein Problem, das der
  // Nutzer sehen soll.
  if (sicht.zustand === 'fehler') {
    return {
      text: 'Warteschlange nicht lesbar',
      ton: 'hervorgehoben',
      fortschritt: null,
      anstehend: 0,
      fehlgeschlagen: 0,
      laufender: null,
    }
  }

  // `geladen`: Es wird GEZAEHLT und der laufende GESUCHT, mehr nicht - das Array
  // wird weder sortiert noch gefiltert noch gekappt (Verbot des Issues). `erfolg`
  // und `abgebrochen` werden nicht gezaehlt und erscheinen nicht im Text. Ein zur
  // Laufzeit unbekannter `status`-Wert zaehlt weder als anstehend noch als
  // fehlgeschlagen und ist nicht `laufender`; es wird nie geworfen.
  let anstehend = 0
  let fehlgeschlagen = 0
  let laufender: Auftrag | null = null
  for (const auftrag of sicht.auftraege) {
    if (auftrag.status === 'anstehend') {
      anstehend++
    } else if (auftrag.status === 'fehlgeschlagen') {
      fehlgeschlagen++
    } else if (auftrag.status === 'laeuft' && laufender === null) {
      // Der ERSTE Auftrag mit `laeuft` gewinnt - sind es wider Erwarten zwei, ohne
      // Ausnahme und ohne Sondermeldung (die serielle Invariante TK 9.3.5 zu
      // ueberwachen ist nicht die Aufgabe der Anzeige).
      laufender = auftrag
    }
  }

  // Der Fortschritt wird GENAU EINMAL geklemmt und dann fuer Feld UND Text benutzt:
  // ausserhalb 0-100 wird geklemmt, ohne Fehler und ohne Meldung - die Anzeige ist
  // nicht der Ort, an dem ein Vertragsbruch des Senders auffaellt. `null` heisst
  // „unbestimmt" und wird als KEIN Prozentwert dargestellt, nie als 0.
  let fortschritt: number | null = null
  if (laufender !== null && laufender.fortschritt !== null) {
    fortschritt = Math.max(0, Math.min(100, laufender.fortschritt))
  }

  // Die Textbausteine in genau der verbindlichen Kaskade des Issues, verbunden mit
  // ` · ` (Leerzeichen, Mittelpunkt, Leerzeichen). Das `label` des laufenden wird
  // UEBERNOMMEN, nicht gebaut - es kommt fertig aus dem Main (TK 9.3.1).
  const teile: string[] = []
  if (laufender !== null) {
    teile.push(laufender.label)
    if (fortschritt !== null) {
      teile.push(`${fortschritt} %`)
    }
  }
  if (anstehend > 0) {
    teile.push(`${anstehend} in der Warteschlange`)
  }
  if (fehlgeschlagen > 0) {
    teile.push(`${fehlgeschlagen} fehlgeschlagen`)
  }

  // Der letzte Tabellen-Fall: keiner laeuft, nichts anstehend, nichts fehlgeschlagen
  // - die EINZIGE Zeile mit `ruhig`. Sie deckt die leere Liste ebenso ab wie eine
  // Liste aus lauter `erfolg`/`abgebrochen`-Eintraegen. `text` ist in keinem Fall
  // leer: Jeder Zweig oben liefert eine feste Zeile, und hier liefert die feste
  // Zeile „Warteschlange leer".
  if (teile.length === 0) {
    return {
      text: 'Warteschlange leer',
      ton: 'ruhig',
      fortschritt: null,
      anstehend: 0,
      fehlgeschlagen: 0,
      laufender: null,
    }
  }

  return {
    text: teile.join(' · '),
    ton: fehlgeschlagen > 0 ? 'hervorgehoben' : 'aktiv',
    fortschritt,
    anstehend,
    fehlgeschlagen,
    laufender,
  }
}
