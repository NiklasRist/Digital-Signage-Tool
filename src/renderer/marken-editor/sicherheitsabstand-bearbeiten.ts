// Issue #308 - [marken-editor] Sicherheitsabstand bearbeiten.
//
// Der Abstand ist EIN Feld ({ horizontal, vertikal }) im 1920x1080-Rahmen und wird
// als Ganzes ersetzt (#285, KEIN partielles Objekt - dieselbe Begruendung wie beim
// Slogan in #307). Die Grenzen sind eine GETEILTE Konstante (#21): dieselben Werte
// prueft der Main (#285); hier stehen sie NICHT als Zahl (ENTSCHIEDEN 2). 0 ist
// zulaessig (Vorsichtsmassnahme, R-08); ganzzaehlig obliegt Number.isInteger (keins
// stilles Math.round); KEINE Geradzahligkeits-Pruefung - die Regel fuer encodierte
// Flaechen (TK v2.9) gilt hier nicht.
//
// HINWEIS, NICHT SPERRE: baueVorlagenHinweis liest keine Vorlagen und nennt keine
// Trefferliste - eine Trefferliste waere geraten (ENTSCHIEDEN 3). Ein kleinerer Abstand
// macht keine bestehende Vorlage unsicher; warnen nur beim Wachsen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { SICHERHEITSABSTAND_BEREICH } from '../../shared/contracts/konstanten'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/** Der Sicherheitsabstand als GANZES Feld - absolute Pixel im 1920x1080-Rahmen (TK 9.11.2). */
export interface Sicherheitsabstand {
  horizontal: number
  vertikal: number
}

/**
 * Die Bereichs-Pruefung fuer EINE Achse - gegen die geteilte Konstante (#21), nicht gegen
 * eine lokale Zahl. Number.isFinite faengt NaN/Infinity; Number.isInteger erzwingt ganze
 * Pixel; die globale isFinite ist hier falsch (sie wandelt Strings um).
 */
function achseGueltig(wert: number, grenze: { min: number; max: number }): boolean {
  return (
    Number.isFinite(wert) &&
    Number.isInteger(wert) &&
    wert >= grenze.min &&
    wert <= grenze.max
  )
}

/**
 * Setzt den Sicherheitsabstand der Marke markeId als GANZES Feld (horizontal und
 * vertikal zusammen) und uebernimmt bei Erfolg das Ergebnis in die gemeinsame Sicht
 * (#295). Prueft gegen SICHERHEITSABSTAND_BEREICH VOR dem IPC-Aufruf; eine Verletzung
 * erzeugt keinen Ruf und keine Wirkung.
 */
export async function setzeSicherheitsabstand(
  markeId: string,
  sicherheit: Sicherheitsabstand,
): Promise<Ergebnis<Marke, string>> {
  // Die FORM vor IPC, zwei Stufen: erst die markeId, dann das sicherheit-Feld.
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeSicherheitsabstand braucht eine nicht leere markeId.',
      },
    }
  }
  // SICHERHEITSABSTAND_BEREICH ist der EINE Ort der Zahlen (ENTSCHIEDEN 2); diese
  // Datei erfindet keine zweite Achsengrenze (die Pruefung leistet achseGueltig).
  if (
    typeof sicherheit !== 'object' ||
    sicherheit === null ||
    !achseGueltig(sicherheit.horizontal, SICHERHEITSABSTAND_BEREICH.horizontal) ||
    !achseGueltig(sicherheit.vertikal, SICHERHEITSABSTAND_BEREICH.vertikal)
  ) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          'setzeSicherheitsabstand braucht horizontal/vertikal als ganze Pixel innerhalb des Bereichs.',
      },
    }
  }
  // teilwerte traegt AUSSCHLIESSLICH sicherheit; Sicherheit traegt BEIDE Achsen.
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.bearbeiteMarke, {
    markeId,
    teilwerte: { sicherheit },
  })
  if (!antwort.ok) return antwort
  // Die Rueckgabe reist UNVERAENDERT in die gemeinsame Sicht (#295) und an den Aufrufer;
  // der Ruf geschieht VOR der Rueckkehr (DoD).
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}

/**
 * Baut den Hinweistext, den die Oberflaeche zeigt, wenn der Abstand WAECHST - dann und
 * nur dann werden bestehende, app-weite Vorlagen unsicherer (TK 9.11.2). Gibt null
 * zurueck, wenn beide Werte gleich bleiben oder kleiner werden; dann gibt es nichts zu
 * warnen. Reine Funktion, ohne IPC (der Spion auf rufeAuf bleibt bei null).
 *
 * Der Text ist FEST verbindlich (ENTSCHIEDEN 4) - die '{h}'-'{v}'-Platzhalter werden
 * durch die NEUEN Werte ersetzt.
 */
export function baueVorlagenHinweis(
  alt: Sicherheitsabstand,
  neu: Sicherheitsabstand,
): string | null {
  // Wachsen heisst: EINE der beiden Achsen wird GROESSER. Gleiche oder kleinere Werte
  // warnen nicht (ENTSCHIEDEN 3): Inhalt innerhalb der alten Linie bleibt innerhalb.
  if (neu.horizontal <= alt.horizontal && neu.vertikal <= alt.vertikal) return null
  return [
    `Größerer Sicherheitsabstand (${neu.horizontal} × ${neu.vertikal} px): Vorlagen sind app-weit und wurden für den bisherigen`,
    `Abstand gebaut. Inhalt, der jetzt außerhalb der Linie liegt, kann am Fernseher abgeschnitten`,
    `werden – prüfe die betroffenen Vorlagen im Vorlagen-Editor.`,
  ].join("\n")
}
