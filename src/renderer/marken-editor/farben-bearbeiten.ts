// Issue #296 - [marken-editor] Farb-Rollen bearbeiten.
//
// Fuer die geoeffnete Marke wird GENAU EINE der dreizehn festen Farb-Rollen auf einen
// freien Hex-Wert gesetzt - pro Aufruf GENAU EINE Rolle (ENTSCHIEDEN 1). Kein
// Rollen-Hinzufuegen oder Entfernen: Die Rollen sind der Vertrag, auf den jede
// Vorlage verweist (TK 9.11.1 Punkt 7); "Rollen sind fest, Werte frei" (TK 9.15.2).
//
// WARUM NUR DIE GEANDERTE ROLLE: Teilwerte.farben wird ROLLENWEISE gemischt (#285,
// Schritt 2b). Wuerde diese Datei ALLE dreizehn aktuellen Werte mitschicken, machte sie
// jede Bearbeitung einer Rolle still ALLE UEBRIGEN zu EIGENEN - und die Vererbung des
// Parents fuer sie zu kappen. Genau das verhindert die Ein-Schluessel-Nutzlast; der
// zweite Fall (geerbt zurueckgeben, Sentinel { geerbt: true }) ist Sache von #299.
//
// KEINE Hex-Syntax-Pruefung hier (ENTSCHIEDEN 3): "Der Main validiert jede eingehende
// Nutzlast - er vertraut dem Renderer nicht." (TK 9.1.1 Punkt 6) Eine zweite Pruefung
// laeufe irgendwann von der Main-Pruefung auseinander (etwa: sind Kurzformen wie #fff
// zulaessig?). Kein Normalisieren von Praefix oder Schreibweise (ENTSCHIEDEN 4).

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FarbRolle, Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/**
 * Die dreizehn Farb-Rollen in fester Anzeigereihenfolge (TK 9.11.2) - NICHT alphabetisch
 * sortiert, sondern Tabellenreihenfolge. EINZIGE Quelle fuer "welche Rollen gibt es":
 * Der Editor iteriert ueber dieses Array, nicht ueber Object.keys(marke.farben) - dann
 * gaebe es die dreizehn Felder immer, auch wenn ein unvollstaendiges farben-Objekt
 * ankame (ENTSCHIEDEN 2).
 */
export const FARB_ROLLEN: readonly FarbRolle[] = [
  'akzent', 'akzentKraeftig', 'akzentTief',
  'flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell', 'flaecheAkzentZart',
  'textAufDunkel', 'textAufHell', 'textSekundaer',
  'linie', 'scrimStart', 'scrimEnde',
]

/**
 * Setzt EINE Farb-Rolle der Marke markeId auf wert und uebernimmt bei Erfolg das
 * Ergebnis in die gemeinsame Sicht (#295). Setzt NIEMALS mehr als eine Rolle je Aufruf.
 */
export async function setzeFarbe(
  markeId: string,
  rolle: FarbRolle,
  wert: string,
): Promise<Ergebnis<Marke, string>> {
  // Die FORM vor IPC: leere markeId senden wir nicht (dieselbe Quelle-Pruefung wie in
  // marke-waehlen.ts, #319). Die ROLLE ist durch den Typ FarbRolle zur
  // Kompilierzeit geschlossen; zur Laufzeit nicht erneut pruefen (ENTSCHIEDEN oben).
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeFarbe braucht eine nicht leere markeId.',
      },
    }
  }
  // EIN Schluessel in farben - genau die geaenderte Rolle, nichts mehr (ENTSCHIEDEN 1).
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.bearbeiteMarke, {
    markeId,
    teilwerte: { farben: { [rolle]: wert } },
  })
  if (!antwort.ok) return antwort
  // Die Rueckgabe REIST UNVERAENDERT (inkl. herkunftJeFeld, TK 9.15.1) in die gemeinsame
  // Sicht (#295) und danach an den Aufrufer. Der Ruf geschieht VOR der Rueckkehr (DoD).
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}
