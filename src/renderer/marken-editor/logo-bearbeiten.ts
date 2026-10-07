// Issue #298 - [marken-editor] Logo importieren und entfernen.
//
// Entfernen ist REGULAERE Handlung, keine Fehlerbehandlung (TK 9.10.10): Das Ergebnis
// kann logo: null tragen (Ersatz-Logo greift) ODER einen geerbten/gebündelten Wert
// (TK 9.15.1); BEIDES ist gültiger Erfolg, die Funktion unterscheidet NICHT
// (ENTSCHIEDEN 2). Kein Vorab-Pruefen, ob überhaupt ein eigenes Logo da ist (ENTSCHIEDEN 1) -
// der Store entscheidet; sein Fehler reist unverändert.
//
// KEIN Dateidialog hier (wie in #297): quellPfad kommt fertig aus
// oeffneMarkenDateiDialog('logo') (#306), gerufen von waehleUndImportiereLogo in
// datei-import.ts (#326); gezeichnet die Schaltfläche in index.tsx (#330).
// media:oeffneMedienDialog zweckentfremden bleibt verboten (die Ablage liegt in
// marken-assets/, nicht im Medienordner).
//
// HINWEIS_LOGO_ENTFERNT gibt es GENAU EINEN - exportiert für #330.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/**
 * HINWEISTEXT nach dem Entfernen eines Logos. Sachlage aus TK 9.10.10; der Wortlaut ist eine
 * Festlegung DIESES Issues, kein Zitat. Fest, exportiert, damit die zeichnende Komponente ihn
 * UNVERAENDERT anzeigt statt selbst zu formulieren.
 */
export const HINWEIS_LOGO_ENTFERNT =
  'Diese Marke hat jetzt kein eigenes Logo mehr. Überall, wo ein Logo stehen würde, erscheint ' +
  'stattdessen der Markenname auf der Akzentfarbe der Marke – kein leerer Bereich, kein Fehler.'

/**
 * Importiert quellPfad als Logo der Marke markeId und uebernimmt bei Erfolg das Ergebnis
 * in die gemeinsame Sicht (#295). schriftRolle wird immer mitgesendet - bei art 'logo'
 * mit dem Wert null (#304).
 */
export async function importiereLogo(
  markeId: string,
  quellPfad: string,
): Promise<Ergebnis<Marke, string>> {
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'importiereLogo braucht eine nicht leere markeId.',
      },
    }
  }
  if (typeof quellPfad !== 'string' || quellPfad.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'importiereLogo braucht einen nicht leeren quellPfad.',
      },
    }
  }
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.importiereMarkenDatei, {
    markeId,
    art: 'logo',
    schriftRolle: null,
    quellPfad,
  })
  if (!antwort.ok) return antwort
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}

/**
 * Entfernt das eigene Logo der Marke markeId. Das Ergebnis kann logo: null tragen
 * (Ersatz-Logo) ODER einen geerbten/gebündelten Wert - BEIDES gültiger Erfolg.
 */
export async function entferneLogo(markeId: string): Promise<Ergebnis<Marke, string>> {
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'entferneLogo braucht eine nicht leere markeId.',
      },
    }
  }
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.entferneMarkenDatei, {
    markeId,
    art: 'logo',
    schriftRolle: null,
  })
  if (!antwort.ok) return antwort
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}
