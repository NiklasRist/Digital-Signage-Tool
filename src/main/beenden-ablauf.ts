// [main] Beenden-Ablauf - Veto bei gescheitertem Sofort-Flush (#336, TK 9.5.4):
// die DREI Bestaende project/vorlagen/marken in EINEM Mechanismus; der Dialog liegt
// im RENDERER (beim Beenden existiert das Fenster - anders als beim START-Fall).

import { ipcMain, type BrowserWindow } from 'electron'
import { KANAELE } from '../shared/contracts/kanaele'
import { flushBeimBeenden } from './project-store/auto-speichern' // #47
import { flushBestand as flushVorlagenBestand } from './vorlagen-store/schreibe-vorlagen' // #98
import { flushBestand as flushMarkenBestand } from './marken-store/schreibe-marken' // #277, ALIAS-PFLICHT

export type BeendenFlushBericht = {
  speicher: 'project' | 'vorlagen' | 'marken'
  ok: boolean
  code?: string
  meldung?: string
}

export function empfehlungZurUrsache(berichte: BeendenFlushBericht[]): string {
  // Code UND Meldung: die Zuordnungsregel (TK 9.5.4) gilt fuer beides.
  const meldungen = berichte
    .filter((bericht) => !bericht.ok)
    .map((bericht) => `${bericht.code ?? ''} ${bericht.meldung ?? ''}`)
    .join(' ')
    .toLowerCase()
  if (
    meldungen.includes('enospc') ||
    meldungen.includes('no space left') ||
    meldungen.includes('voll')
  ) {
    return 'Die Platte ist voll. Schaffen Sie Platz und versuchen Sie es erneut.'
  }
  if (
    meldungen.toLowerCase().includes('enoent') ||
    meldungen.toLowerCase().includes('eio') ||
    meldungen.toLowerCase().includes('nicht erreichbar')
  ) {
    return 'Der Speicherort ist nicht erreichbar. Stecken Sie den Datenträger wieder ein.'
  }
  return 'Aenderungen konnten nicht gespeichert werden. Bitte probieren Sie es erneut.'
}

type FlushErg = { ok: boolean; fehler?: { code: string; meldung: string } }

function berichtVon(
  speicher: 'project' | 'vorlagen' | 'marken',
  erg: FlushErg,
): BeendenFlushBericht {
  if (erg.ok) return { speicher, ok: true }
  return {
    speicher,
    ok: false,
    code: erg.fehler?.code,
    meldung: erg.fehler?.meldung,
  }
}

/**
 * Wird vom before-quit-Hoerer gerufen. Liefert true, wenn das Beenden fortgesetzt
 * werden darf. "Erneut versuchen" wiederholt NUR die zuvor gescheiterten Flushs;
 * "verwerfen" ist ENDGUeLTIG (kein weiterer Flush).
 */
export async function pruefeBeendenUndFlush(fenster: BrowserWindow): Promise<boolean> {
  // Erster Lauf alle drei; bei "wiederholen" laufen NUR die zuvor gescheiterten erneut.
  let gescheiterte: readonly ('project' | 'vorlagen' | 'marken')[] = [
    'project',
    'vorlagen',
    'marken',
  ]

  let entscheidung: 'wiederholen' | 'verwerfen' = 'wiederholen'
  for (;;) {
    const berichte: BeendenFlushBericht[] = []
    for (const speicher of [...gescheiterte]) {
      const erg = await flushUeberhauptAus(speicher)
      const bericht = berichtVon(speicher, erg)
      berichte.push(bericht)
    }
    gescheiterte = berichte.filter((b) => !b.ok).map((b) => b.speicher)
    if (gescheiterte.length === 0) {
      return true
    }
    // DoD: das Ereignis traegt GENAU die Betroffenen (nicht jeden Erfolg mit).
    const betroffene = berichte.filter((b) => !b.ok)
    if (!fenster.isDestroyed()) {
      fenster.webContents.send(KANAELE.beenden.status, {
        berichte: betroffene,
        empfehlung: empfehlungZurUrsache(betroffene),
      })
    }

    entscheidung = await fragRenderer()
    if (entscheidung === 'verwerfen') {
      // Endgültig: das Beenden laeuft OHNE wiederholten Flush durch.
      return true
    }
  }
}

async function flushUeberhauptAus(
  speicher: 'project' | 'vorlagen' | 'marken',
): Promise<FlushErg> {
  switch (speicher) {
    case 'project':
      return (await flushBeimBeenden()) as unknown as FlushErg
    case 'vorlagen':
      return (await flushVorlagenBestand()) as unknown as FlushErg
    case 'marken':
      return (await flushMarkenBestand()) as unknown as FlushErg
  }
}

/**
 * Der RUECKKANAL: der Kanal beenden:entscheidung (Instant, Renderer -> Main).
 * Der Hoerer wird GENAU einmal registriert (also nur vom EINEN Ablauf-Callback);
 * eine doppelte Registrierung bei ipcMain.handle wirft bewusst.
 */
let hoererBestand: (() => Promise<'wiederholen' | 'verwerfen'>) | null = null

function fragRenderer(): Promise<'wiederholen' | 'verwerfen'> {
  if (hoererBestand === null) {
    // GENAU EINE Registrierung; eine zweite wirft durch ipcMain.handle bewusst.
    hoererBestand = (): Promise<'wiederholen' | 'verwerfen'> => {
      return new Promise((loesen) => {
        ipcMain.handleOnce(KANAELE.beenden.entscheidung, (_ereignis, nutzlast) => {
          const wert = nutzlast?.entscheidung
          if (wert === 'verwerfen' || wert === 'wiederholen') {
            loesen(wert)
          } else {
            // unbekannte Nutzlast wird NICHT geraten: als Verwerfen lesen - der letzte
            // Ausweg ist nie die Vorauswahl, ein Stillstand waere schlimmer.
            loesen('verwerfen')
          }
        })
      })
    }
  }
  return hoererBestand()
}
