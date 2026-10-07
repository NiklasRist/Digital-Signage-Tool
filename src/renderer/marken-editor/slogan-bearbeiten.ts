// Issue #307 - [marken-editor] Slogan bearbeiten.
//
// Der Slogan ist EIN Feld mit EINEM Wert ({ text, aktiv }) und wird als Ganzes
// ersetzt - NICHT partial (#285): MarkenTeilwerte.slogan ist MarkenFeld<...>, nicht
// Partial. Schickte diese Datei nur { text: 'neu' }, waere das nicht "text aendern,
// aktiv lassen", sondern das GANZE Feld ersetzen - der Schalter ginge beim naechsten
// Tastendruck wieder aus. Deshalb EINE Funktion mit dem VOLLSTANDIGEN Objekt
// (ENTSCHIEDEN 1) und keine Zwillings-Fassung mit je einer Haelfte.
//
// KEIN Trimmen, keine Laengengrenze (ENTSCHIEDEN 2): Der leere Text ist ein
// gueltiger Zwischenzustand beim Tippen (ENTSCHIEDEN 3); die Oeberlauf-Kaskade
// (TK 9.10.6) leistet das Zeichnen. Kein Timer/Entprellen hier (ENTSCHIEDEN 4) -
// die ist Sache des Stores (#277). Kein { geerbt: true } (ENTSCHIEDEN 5) - der
// Rueckgabewurf an den Parent ist #299.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/**
 * Setzt den Slogan der Marke markeId als GANZES Feld (Text und Schalter zusammen) und
 * uebernimmt bei Erfolg das Ergebnis in die gemeinsame Sicht (#295). slogan wird
 * unveraendert weitergereicht - kein Trimmen, keine Laengenkuerzung, keine Anpassung
 * der Schreibweise.
 */
export async function setzeSlogan(
  markeId: string,
  slogan: { text: string; aktiv: boolean },
): Promise<Ergebnis<Marke, string>> {
  // Die FORM vor IPC (dieselbe Quelle-Pruefung wie in #296/#319).
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeSlogan braucht eine nicht leere markeId.',
      },
    }
  }
  // teilwerte traegt AUSSCHLIESSLICH slogan; slogan traegt BEIDE Schluessel.
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.bearbeiteMarke, {
    markeId,
    teilwerte: { slogan },
  })
  if (!antwort.ok) return antwort
  // Die Rueckgabe reist UNVERAENDERT (inkl. herkunftJeFeld) in die Sicht und an den
  // Aufrufer; der Ruf geschieht VOR der Rueckkehr (DoD).
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}
