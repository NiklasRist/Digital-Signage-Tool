// GENERIERT aus dem Signaturblock von Issue #241.
// [project-store] Den Projektordner im Datei-Explorer des Betriebssystems öffnen
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
// GERUEST-PRUEFSUMME: aa5bbaebe15bfb51

import { stat } from 'node:fs/promises'
import { shell } from 'electron'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { projektOrdner } from './pfade'

/**
 * "intern protokolliert" - dieselbe vorlaeufige Loesung wie im ipc-gateway (#23)
 * und in den Nachbarmodulen dieses Projekts: VORLAEUFIG als `console.error`, weil
 * die Form des internen Protokolls der STOPP-Block offen laesst.
 *
 * Wohin der Text NICHT gehoert, ist entschieden: Die `meldung` einer Antwort reist
 * bis in die Oberflaeche, und der Text von `shell.openPath` enthaelt oft den
 * absoluten Pfad - der Renderer sieht aber "nie absolute Pfade" (TK 9.5.7).
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[project-store/oeffne-projektordner] ${stelle}:`, ursache)
}

function istCode(ursache: unknown, code: string): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  return (ursache as { code?: unknown }).code === code
}

/**
 * Öffnet `projects/<projektId>/` im Datei-Explorer des Betriebssystems (TK 9.5.2).
 * Instant-Aufruf: KEIN Auftrag, KEIN D1-Lock, KEIN Schreibvorgang.
 * Legt NICHTS an, repariert NICHTS und liest KEINE Projektdatei.
 * Wirft nie – jeder Weg endet in einem `Ergebnis<void>`.
 */
export async function öffneProjektordner(projektId: string): Promise<Ergebnis<void>> {
  if (typeof projektId !== 'string' || projektId.length === 0) {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Die Projekt-ID ist leer oder kein String.' },
    }
  }

  const ordner = projektOrdner(projektId)

  let eintrag: Awaited<ReturnType<typeof stat>>
  try {
    eintrag = await stat(ordner)
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      // Es wird NICHTS angelegt: Die Nebenwirkungsfreiheit ist die eigentliche
      // Absicht dieser Operation (ENTSCHIEDEN 1).
      return {
        ok: false,
        fehler: { code: 'nicht_gefunden', meldung: 'Der Projektordner existiert nicht.' },
      }
    }
    // Rechte, Datentraeger weg, ... - eine andere Lage als "gibt es nicht"
    // (ENTSCHIEDEN 3). Der Originalfehler gehoert ins Protokoll, nicht in die Meldung.
    protokolliere('stat auf den Projektordner ist fehlgeschlagen', ursache)
    return {
      ok: false,
      fehler: { code: 'unbekannter_fehler', meldung: 'Der Projektordner liess sich nicht pruefen.' },
    }
  }

  if (!eintrag.isDirectory()) {
    // `shell.openPath` auf eine Datei wuerde sie im zugehoerigen Programm starten -
    // aus "Ordner oeffnen" wuerde "Datei ausfuehren" (ENTSCHIEDEN 2).
    return {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Der Projektordner existiert nicht.' },
    }
  }

  let problem: string
  try {
    problem = await shell.openPath(ordner)
  } catch (ursache) {
    // Wirft wider Erwarten: gefangen, kein Wurf nach aussen.
    protokolliere('shell.openPath hat geworfen', ursache)
    return {
      ok: false,
      fehler: { code: 'unbekannter_fehler', meldung: 'Der Projektordner liess sich nicht oeffnen.' },
    }
  }

  if (problem === '') {
    return { ok: true, wert: undefined }
  }

  // Der Text des Betriebssystems wandert ins Protokoll, NICHT in die Meldung
  // (ENTSCHIEDEN 4) - er enthaelt regelmassig den absoluten Pfad.
  protokolliere('shell.openPath hat einen Fehler gemeldet', problem)
  return {
    ok: false,
    fehler: { code: 'unbekannter_fehler', meldung: 'Der Projektordner liess sich nicht oeffnen.' },
  }
}