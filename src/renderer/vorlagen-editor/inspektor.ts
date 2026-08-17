// GENERIERT aus dem Signaturblock von Issue #145.
// [vorlagen-editor] Der Zahlen-Inspektor für exakte Rahmenwerte
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
// GERUEST-PRUEFSUMME: 7704e5c7db0021c8
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Zone } from '../../shared/contracts/vorlage'
import {
  begrenzeAufFlaeche,
  MINDEST_ZONEN_KANTE_PX,
  type Flaeche,
} from './zonen-canvas'

/** Die vier bearbeitbaren Rahmenwerte. Achtung: `höhe` MIT Umlaut (so heisst das Feld in #95). */
export type RahmenFeld = 'x' | 'y' | 'breite' | 'höhe'

/**
 * Übernimmt eine getippte Zahl in genau ein Rahmenfeld.
 * Rastet NICHT ein – der eingegebene Wert wird nur auf die Fläche begrenzt.
 * Liefert eine NEUE Zone; die übergebene bleibt unverändert.
 */
export function setzeRahmenWert(
  zone: Zone,
  feld: RahmenFeld,
  eingabe: string,
  flaeche: Flaeche,
): Ergebnis<Zone> {
  // Feste Zonen sind sichtbar, aber gesperrt (FA-11, TK 9.11.1 Punkt 4). Hier ein
  // Fehler, weil eine kommentarlos verschwundene Zahl wie ein kaputtes Eingabefeld
  // aussaehe; auf dem Canvas (#144) ist "nichts bewegt sich" die Naturantwort.
  if (zone.rolle === 'fest') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Feste Zonen gehören zum Markenrahmen und sind gesperrt.',
      },
    }
  }

  // Nach trim() ist ausschliesslich eine Folge von Dezimalziffern mit optionalem
  // fuehrendem '-' eine ganze Zahl. Kein parseInt/Number-Umweg: Beide machten aus
  // '120px' oder '' klaglos einen Wert, den der Nutzer nie eingegeben hat - und der
  // Rahmen ist absolut in ganzen Pixeln (TK 9.11.1 Punkt 1), es gibt nichts zu retten.
  const text = eingabe.trim()
  if (!/^-?\d+$/.test(text)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Bitte eine ganze Zahl eingeben.',
      },
    }
  }
  const wert = Number(text)

  // Werte ausserhalb des Feldbereichs werden begrenzt und als ok uebernommen -
  // abgewiesen wird nur, was keine Zahl ist (der Nutzer wollte ja "ganz nach rechts").
  // Passt die Zone gar nicht in die Flaeche (Obergrenze < Untergrenze), gewinnt die
  // Untergrenze; die Sperre meldet danach #148.
  const neuerRahmen = neueRahmenwerte(zone.rahmen, feld, wert, flaeche)

  // begrenzeAufFlaeche verschiebt einen Rahmen OHNE Verkleinern hinein. Der Inspektor
  // rastet nicht ein und bewegt keine andere Zone - ein geaenderter Wert laesst alle
  // Nachbarn liegen (kein automatisches Umlayouten, TK 9.11.1 Punkt 3).
  return { ok: true, wert: { ...zone, rahmen: begrenzeAufFlaeche(neuerRahmen, flaeche) } }
}

/**
 * Baut aus dem alten Rahmen und dem neuen Wert den neuen Rahmen. Die Reihenfolge
 * der Feldgrenzen ist verbindlich (Issue #145): Bei breite/hoehe bleibt die gegen-
 * ueberliegende Kante liegen (die Zone waechst nach rechts/unten), bei x/y bleibt
 * die Groesse unveraendert.
 */
function neueRahmenwerte(
  rahmen: Zone['rahmen'],
  feld: RahmenFeld,
  wert: number,
  flaeche: Flaeche,
): Zone['rahmen'] {
  switch (feld) {
    case 'x':
      return { ...rahmen, x: begrenze(wert, 0, flaeche.breite - rahmen.breite) }
    case 'y':
      return { ...rahmen, y: begrenze(wert, 0, flaeche.höhe - rahmen.höhe) }
    case 'breite':
      return {
        ...rahmen,
        breite: begrenze(wert, MINDEST_ZONEN_KANTE_PX, flaeche.breite - rahmen.x),
      }
    case 'höhe':
      return {
        ...rahmen,
        höhe: begrenze(wert, MINDEST_ZONEN_KANTE_PX, flaeche.höhe - rahmen.y),
      }
  }
}

/** Klemmt wert auf [untergrenze, obergrenze]; liegt die Obergrenze darunter, bleibt die Untergrenze. */
function begrenze(wert: number, untergrenze: number, obergrenze: number): number {
  return Math.min(Math.max(wert, untergrenze), Math.max(untergrenze, obergrenze))
}
