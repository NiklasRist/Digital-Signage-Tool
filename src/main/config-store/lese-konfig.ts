// GENERIERT aus dem Signaturblock von Issue #26.
// [config-store] leseKonfig implementieren
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
// GERUEST-PRUEFSUMME: eb20b576cf2d80db

import fs from 'node:fs/promises'
import path from 'node:path'

import { ermittleDatenOrt } from '../datenort'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { AppKonfig } from '../../shared/contracts/app-konfig'   // #265
import type { ConfigFehlercode } from './schreibe-config'            // #31

const DATEI = 'config.json'

/**
 * Die Vorbelegungen des ersten Starts. `null` heisst hier ausdruecklich "noch nie" - nicht "leer":
 * kein zuletzt geoeffnetes Projekt, noch nie exportiert.
 */
function vorbelegungen(): AppKonfig {
  return { aktivesProjektId: null, letztesExportZiel: null, uiVoreinstellungen: {} }
}

export async function leseKonfig(): Promise<Ergebnis<AppKonfig, ConfigFehlercode>> {
  const datenOrt = ermittleDatenOrt()
  const ziel = path.join(datenOrt, DATEI)

  const haupt = await leseDatei(ziel)

  // FEHLT die Datei, ist das KEIN Fehler: erster Start. Der sanfte Rueckfall steht woertlich in
  // TK 9.5.6 (FA-15) - "kein Absturz".
  if (haupt.zustand === 'fehlt') {
    return { ok: true, wert: vorbelegungen() }
  }
  if (haupt.zustand === 'gelesen') {
    return { ok: true, wert: haupt.konfig }
  }

  // BESCHAEDIGT: erst die Sicherung versuchen (TK 9.5.4, laut 9.5.6 auch fuer config.json).
  const sicherung = await leseDatei(`${ziel}.bak`)
  if (sicherung.zustand === 'gelesen') {
    return { ok: true, wert: sicherung.konfig }
  }

  // Beides unbrauchbar. Hier wird NICHT auf Vorbelegungen zurueckgefallen: Das saehe aus wie ein
  // erster Start und wuerfe das zuletzt geoeffnete Projekt und das Exportziel still weg. TK 9.5.4
  // verlangt ausdruecklich "Fehler melden, nicht leer/verlustbehaftet weiterstarten".
  return {
    ok: false,
    fehler: {
      code: 'speicher_fehler',
      meldung:
        `${DATEI} ist beschaedigt und die Sicherung ${DATEI}.bak ebenfalls nicht lesbar. ` +
        `Grund: ${haupt.grund}${sicherung.zustand === 'beschaedigt' ? ` / ${sicherung.grund}` : ' / keine Sicherung vorhanden'}`,
    },
  }
}

type Leseergebnis =
  | { zustand: 'gelesen'; konfig: AppKonfig }
  | { zustand: 'fehlt' }
  | { zustand: 'beschaedigt'; grund: string }

/**
 * Liest EINE Datei und entscheidet zwischen den drei Zustaenden.
 *
 * ENOENT wird von "beschaedigt" getrennt, weil daran der ganze Ablauf haengt: Eine fehlende Datei
 * ist der Normalfall des ersten Starts, eine unlesbare ist ein Verlust. Wer beides gleich
 * behandelt, macht aus einem defekten Dateisystem stillschweigend einen Neuanfang.
 */
async function leseDatei(pfad: string): Promise<Leseergebnis> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      return { zustand: 'fehlt' }
    }
    // EACCES, EBUSY, EIO: die Datei ist da, aber nicht lesbar - das ist kein erster Start.
    return { zustand: 'beschaedigt', grund: text(ursache) }
  }

  let geparst: unknown
  try {
    geparst = JSON.parse(roh)
  } catch (ursache) {
    return { zustand: 'beschaedigt', grund: `kein gueltiges JSON (${text(ursache)})` }
  }

  const konfig = alsAppKonfig(geparst)
  return konfig === null
    ? { zustand: 'beschaedigt', grund: 'JSON ist gueltig, aber keine AppKonfig' }
    : { zustand: 'gelesen', konfig }
}

/**
 * Prueft den gelesenen Wert und baut daraus eine AppKonfig - oder `null`, wenn er unbrauchbar ist.
 *
 * WARUM UEBERHAUPT GEPRUEFT WIRD: `JSON.parse` liefert `any`. Ohne Pruefung wanderte der Inhalt
 * einer fremden oder halb geschriebenen Datei ungesehen als `AppKonfig` durch die Anwendung, und
 * der erste Zugriff auf `uiVoreinstellungen` fiele irgendwo tief im Renderer um.
 *
 * EINZELNE unbrauchbare Felder machen die Datei NICHT beschaedigt - sie werden auf ihre
 * Vorbelegung gesetzt. Sonst kostete ein einziger vergurkter Oberflaechen-Schluessel das aktive
 * Projekt gleich mit. Unbrauchbar ist die Datei erst, wenn sie gar kein Objekt ist.
 *
 * `schemaVersion` steht in der DATEI, aber nicht im TYP (#265) - sie wird hier bewusst nicht
 * uebernommen. Eine Migration gibt es in v1 nicht; kaeme sie, saesse sie genau hier.
 */
function alsAppKonfig(wert: unknown): AppKonfig | null {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) {
    return null
  }
  const roh = wert as Record<string, unknown>
  return {
    aktivesProjektId: typeof roh['aktivesProjektId'] === 'string' ? roh['aktivesProjektId'] : null,
    letztesExportZiel: typeof roh['letztesExportZiel'] === 'string' ? roh['letztesExportZiel'] : null,
    uiVoreinstellungen:
      typeof roh['uiVoreinstellungen'] === 'object' &&
      roh['uiVoreinstellungen'] !== null &&
      !Array.isArray(roh['uiVoreinstellungen'])
        ? (roh['uiVoreinstellungen'] as Record<string, unknown>)
        : {},
  }
}

/** Prueft den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht hat. */
function istCode(ursache: unknown, ...codes: readonly string[]): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' && codes.includes(code)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
// AppKonfig: { aktivesProjektId: string | null, letztesExportZiel: string | null,
//              uiVoreinstellungen: Record<string, unknown> }   // #265 - OHNE marke;
//              die Marke kommt ausschliesslich ueber leseMarke() (#29)
// existiert config.json nicht (erster Start) → liefert Ergebnis<AppKonfig> mit sinnvollen
// Defaults (aktivesProjektId: null, ...), OHNE Fehler
