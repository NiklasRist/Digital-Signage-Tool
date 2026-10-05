// Issue #217 (M7-24) - segment-quelle.ts: die REINE Auswahl von Aktion und
// Vorlage fuer ein Segment der Vorschau. Kein JSX, kein react, kein Laden,
// kein Zeichnen, kein Wurf - und ohne Browser pruefbar.
//
// PRUEFREIHENFOLGE (ENTSCHIEDEN 2): Aktion, dann Vorlage, dann Schriften.
// Die ersten beiden sind DAUERHAFTE Datendefekte (eine Referenz zeigt ins
// Leere), der dritte ist ein VORUEBERGEHENDER Zustand beim Programmstart.
// Wer den voruebergehenden zuerst meldet, verdeckt in den ersten Sekunden
// jeden echten Datendefekt und macht ihn schwerer auffindbar.
//
// AUFLÖSUNG, NICHT NACHRECHNEN (Invariante 4 des Meilensteins): Die Vorlage
// wird ueber `aktion.vorlagenId` im Vorlagen-Bestand gesucht, nicht geraten.
// `schriftenBereit` wird HEREINGEREICHT, damit diese Funktion ohne Browser
// pruefbar bleibt; die Auskunft selbst gewinnt sie hier NICHT.
//
// ENTSCHIEDEN 3: Diese Datei urteilt NICHT ueber „kaputt". Ein Segment mit
// fehlendem Aktions-Bild ist hier VOLLKOMMEN normal; der Platzhalter sitzt
// an der Bildzone in template-canvas (TK 9.10.7), nicht hier.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'

/** Was zum Zeichnen dieses Segments verfuegbar ist - und woran es sonst fehlt. */
export type Segmentquelle =
  | { zustand: 'bereit'; aktion: Aktion; vorlage: Vorlage }
  | { zustand: 'aktion_unbekannt'; aktionId: string }
  | { zustand: 'vorlage_unbekannt'; vorlagenId: string }
  | { zustand: 'schriften_fehlen' }

/**
 * Sucht Aktion und Vorlage heraus. REINE Funktion: liest nur die uebergebenen Listen, laedt nichts,
 * zeichnet nichts, wirft nie. Pruefreihenfolge s. ENTSCHIEDEN 2.
 * `schriftenBereit` ist das Ergebnis von sindSchriftenBereit() (#110) und wird HEREINGEREICHT,
 * damit diese Funktion ohne Browser pruefbar bleibt.
 */
export function findeSegmentquelle(
  aktionId: string,
  aktionen: readonly Aktion[],
  vorlagen: readonly Vorlage[],
  schriftenBereit: boolean,
): Segmentquelle {
  // Schritt 1: die Aktion. Nicht gefunden schlaegt JEDE spaetere Pruefung -
  // auch wenn die Schriften noch fehlen (ENTSCHIEDEN 2).
  const aktion = aktionen.find((kandidat) => kandidat.id === aktionId)
  if (aktion === undefined) {
    return { zustand: 'aktion_unbekannt', aktionId }
  }

  // Schritt 2: die Vorlage der Aktion. Dieselbe Ordnung.
  const vorlage = vorlagen.find((kandidat) => kandidat.id === aktion.vorlagenId)
  if (vorlage === undefined) {
    return { zustand: 'vorlage_unbekannt', vorlagenId: aktion.vorlagenId }
  }

  // Schritt 3: der UEBERGANGS-Zustand der Schriften - voruebergehend, zuletzt geprueft.
  if (!schriftenBereit) {
    return { zustand: 'schriften_fehlen' }
  }

  return { zustand: 'bereit', aktion, vorlage }
}
