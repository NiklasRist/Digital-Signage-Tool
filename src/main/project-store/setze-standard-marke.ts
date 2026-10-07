// [project-store] setzeStandardMarke - Project.standardMarkeId ist aenderbar (#323,
// TK 9.5.2). Wirkt auf das GELADENE wie auf ein NICHT geladenes Projekt; die
// Existenz der markeId prueft der Handler (#283), NICHT diese Funktion.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'
import type { ProjectStoreFehlercode } from './assets'
import { holeAktivesProjekt } from './aktives-projekt'
import { mitD1Lock } from './d1-lock'
import { planeAutoSpeicherung } from './auto-speichern'
import { projektOrdner } from './pfade'
import { schreibeProjekt } from './schreibe-projekt'

type Antwort = Promise<Ergebnis<Project, ProjectStoreFehlercode>>

function abgelehnt(meldung: string): Ergebnis<never, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

// Zweig B liest die fremde project.json im EINEN Lock-Abschnitt; das Lesen ist
// synchron und dadurch sitzt es unter dem Lock ohne Zusatzaufruf.
function leseFremdesProjekt(projektId: string): Ergebnis<Project, ProjectStoreFehlercode> {
  const datei = join(projektOrdner(projektId), 'project.json')
  let roh: string
  try {
    roh = readFileSync(datei, 'utf8')
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'nicht_gefunden',
        meldung: `project.json des Projekts ${projektId} fehlt.`,
      },
    }
  }
  let gelesen: unknown
  try {
    gelesen = JSON.parse(roh) as unknown
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `project.json des Projekts ${projektId} ist unlesbar.`,
      },
    }
  }
  if (typeof gelesen !== 'object' || gelesen === null) {
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `project.json des Projekts ${projektId} fuert kein Objekt.`,
      },
    }
  }
  const projekt = gelesen as Project
  if (typeof projekt.id !== 'string' || projekt.id.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `project.json des Projekts ${projektId} traegt kein id-Feld.`,
      },
    }
  }
  if (projekt.schemaVersion !== AKTUELLE_SCHEMA_VERSION) {
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `Die schemaVersion des Projekts ${projektId} weicht ab - oeffne das Projekt einmal.`,
      },
    }
  }
  return { ok: true, wert: projekt }
}

export async function setzeStandardMarke(
  projektId: string,
  markeId: string,
): Antwort {
  // 1. FORM vor jeder Wirkung (TK 9.1.1 Punkt 6): gefuellte Strings; projektId
  //    traegt keinen Pfadtrenner, kein .. und ist kein absoluter Pfad - es wird
  //    unten zu einem Pfadsegment. KEINE UUID-Form-Pruefung.
  if (typeof projektId !== 'string' || projektId.trim().length === 0) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere projektId.')
  }
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere markeId.')
  }
  if (projektId.includes('/') || projektId.includes('\\') || projektId.includes('..') ||
      /^[A-Za-z]:/.test(projektId) || projektId.startsWith('/')) {
    return abgelehnt('setzeStandardMarke braucht eine projektId OHNE Pfadanteil.')
  }

  // 2. DER EINE Lock-Abschnitt; alles Weitere laeuft darin.
  return mitD1Lock(async () => {
    // ZWEIG A gilt nur fur DIESES eine Projekt (id-Vergleich).
    const aktiv = holeAktivesProjekt()
    if (aktiv !== null && aktiv.id === projektId) {
      // ZWEIG A - das geladene Projekt, am LEBENDEN Objekt (TK 9.5.1).
      if (aktiv.standardMarkeId === markeId) {
        // Nichts zu tun: kein Schreiben ohne Aenderung - sonst wuerde eine
        // identische Kopie die letzte heile Version im .bak ersetzen.
        return { ok: true, wert: aktiv }
      }
      aktiv.standardMarkeId = markeId
      planeAutoSpeicherung(aktiv)
      return { ok: true, wert: aktiv }
    }

    // ZWEIG B - ein NICHT geladenes Projekt: lesen, aendern, atomar zurueckschreiben.
    const gelesen = leseFremdesProjekt(projektId)
    if (!gelesen.ok) return gelesen
    const fremd = gelesen.wert
    if (fremd.standardMarkeId === markeId) {
      return { ok: true, wert: fremd }
    }
    fremd.standardMarkeId = markeId
    const geschrieben = await schreibeProjekt(fremd)
    if (!geschrieben.ok) return geschrieben
    return { ok: true, wert: fremd }
  })
}
