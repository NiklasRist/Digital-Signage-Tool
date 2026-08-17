// GENERIERT aus dem Signaturblock von Issue #301.
// [marken-editor] Kontrast-Warnung zwischen Akzentfläche und Text (FA-24)
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
// GERUEST-PRUEFSUMME: e78d936676e628da
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

import type { JSX } from 'react'
import type { Marke } from '../../shared/contracts/marke'
import { erreichtKontrastSchwelle, kontrastVerhaeltnis } from '../gemeinsam/kontrast'

export interface Kontrasthinweis {
  verhaeltnis: number    // aus kontrastVerhaeltnis(marke.farben.akzent, marke.farben.<textRolle>)
  ausreichend: boolean   // aus erreichtKontrastSchwelle(...) mit demselben Farbpaar und `schwellenwert`
}

/**
 * Reine Ableitung: liest NUR marke.farben und ruft AUSSCHLIESSLICH die beiden Funktionen aus #292
 * auf. Prüft die Fläche `akzent` gegen `textAufDunkel` UND gegen `textAufHell` und meldet den
 * BESSEREN der beiden Werte – dieselben zwei Kandidaten, mit denen 9.10.10 die Textfarbe des
 * Ersatz-Logos wählt (#293 nutzt dafür `waehleBesserenKontrast`; diese Datei braucht zusätzlich die
 * Zahl, deshalb `kontrastVerhaeltnis` für beide Kandidaten statt nur die Auswahl).
 *
 * `schwellenwert` ist PFLICHT-Parameter – GENAU wie bei `erreichtKontrastSchwelle` selbst (#292)
 * KEIN Vorgabewert, KEINE Konstante in dieser Datei. Der Zahlenwert ist seit TK v3.10 entschieden
 * (4,5:1, WCAG AA) und steht als KONTRAST_SCHWELLE in src/shared/contracts/konstanten.ts (#320);
 * gelesen und hereingereicht wird er von der Editor-Wurzel #330 - nicht von hier.
 */
export function ermittleKontrastHinweis(marke: Marke, schwellenwert: number): Kontrasthinweis {
  const vAufDunkel = kontrastVerhaeltnis(marke.farben.akzent, marke.farben.textAufDunkel)
  const vAufHell = kontrastVerhaeltnis(marke.farben.akzent, marke.farben.textAufHell)
  const verhaeltnis = Math.max(vAufDunkel, vAufHell)
  return {
    verhaeltnis,
    ausreichend: erreichtKontrastSchwelle(
      vAufDunkel >= vAufHell ? marke.farben.textAufDunkel : marke.farben.textAufHell,
      marke.farben.akzent,
      schwellenwert,
    ),
  }
}

export interface KontrastWarnungProps {
  marke: Marke
  schwellenwert: number   // KONTRAST_SCHWELLE (4.5), gelesen und uebergeben von #330 – NICHT hier
                          // festlegen, NICHT importieren, KEIN Vorgabewert
}

/**
 * Zeigt NICHTS (`null`), solange der Kontrast ausreicht. Reicht er nicht, zeigt sie einen
 * nicht-blockierenden Hinweis. Es gibt KEINEN Bestätigungs-Dialog, KEINEN deaktivierten
 * Speichern-Knopf und KEINE zweite Bestätigung – „warnen, nicht blockieren" (FA-24).
 */
export function KontrastWarnung(props: KontrastWarnungProps): JSX.Element | null {
  const hinweis = ermittleKontrastHinweis(props.marke, props.schwellenwert)
  if (hinweis.ausreichend) {
    return null
  }
  // Der Hinweis zeigt nur an und blockiert nichts (FA-24): kein Dialog, kein
  // deaktivierter Knopf, kein Overlay. Die Platzierung im Editor-Layout ist die
  // Sache der Wurzel #330; dieses Element ist ein eigenstaendiger Hinweisblock.
  const text = `Zu wenig Kontrast: Die Akzentflaeche erreicht gegenueber ihrem Text nur ${hinweis.verhaeltnis.toFixed(2)}:1 - empfohlen sind mindestens ${props.schwellenwert.toFixed(2)}:1 (WCAG AA). Die Auswahl bleibt moeglich; die Lesbarkeit pruefen Sie bitte am Geraet.`
  return (
    <div
      role="status"
      style={{
        padding: "8px 12px",
        backgroundColor: "#FFF3CD",
        border: "1px solid #FFC107",
        color: "#664D03",
      }}
    >
      {text}
    </div>
  )
}
