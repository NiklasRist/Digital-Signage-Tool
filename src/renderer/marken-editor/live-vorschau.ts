// Issue #303 (M8-43) - live-vorschau.ts: die Live-Vorschau des Marken-Editors.
//
// TK 9.10.1 ist die teuerste Zusage des Systems: „Es gibt keinen zweiten
// Zeichenpfad." Die Vorschau stellt das Ergebnis daher ueber DIESELBE
// Zeichenroutine, die spaeter das Segment-PNG erzeugt (TK 9.15.2) - inklusive
// des Ersatz-Logos (#293, TK 9.10.10): Wer eine Marke ohne Logo anlegt,
// sieht im Editor sofort, wie ihr Name als Ersatz-Logo ausfaellt.
//
// Die Herkunft der VIER Parameter (festgehalten, damit nichts falsch zugeschrieben
// wird): TK 9.10.1 schreibt die Routine mit DREI Parametern; der vierte
// (`rahmenMarke`) kommt aus #294 und steht NICHT im TK.
//
// Diese Datei baut KEINEN zweiten Zeichenpfad und KEINE eigene Vorbereitung:
// Kein Kontext, kein document.fonts, kein Image-Laden. Alles Asynchrone
// (Schriften, Motive, Logo) ist VOR diesem Aufruf einzuspielen (TK 9.10.3
// Punkt 3/4); wo das passiert, hat seinen eigenen Vertrag.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { zeichneSegment, type SegmentBild } from '../template-canvas/zeichne-segment'

/**
 * Baut eine SYNTHETISCHE Vorschau-Aktion fuer den Marken-Editor: feste
 * Platzhaltertexte, KEIN Bild (bildRef: null - eine gueltige, gespeicherte
 * Belegung: „Bild ist optional"; die Bild-Zone folgt dann dem wennLeer der
 * Vorlage, TK 9.11.1, und zeigt KEINEN Defekt-Platzhalter). akzentfarbe ist
 * IMMER null, damit die Vorschau die Farb-Rollen der MARKE zeigt und nicht
 * eine erfundene Aktions-Farbe (TK 9.10.9: „Ist aktion.akzentfarbe nicht
 * gesetzt, gilt der Markenwert"). Diese Aktion wird NIE gespeichert und
 * NIE gerendert.
 */
export function baueVorschauAktion(marke: Marke, vorlage: Vorlage): Aktion {
  return {
    id: 'vorschau-marken-editor',
    titel: 'Marken-Vorschau',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: vorlage.id,
    markeId: marke.id,
    akzentfarbe: null,
  }
}

/**
 * Zeichnet die Live-Vorschau EINER Marke ueber GENAU DENSELBEN Aufruf wie das
 * spaeere Segment. SYNCHRON - wie zeichneSegment selbst.
 */
export function zeichneMarkenVorschau(marke: Marke, vorlage: Vorlage): SegmentBild {
  // rahmenMarke === marke (#294): Im Marken-Editor ist kein Projekt offen;
  // fuer nicht-Band-Aufrufe ist die Rahmen-Marke dieselbe Objektreferenz.
  return zeichneSegment(baueVorschauAktion(marke, vorlage), vorlage, marke, marke)
}
