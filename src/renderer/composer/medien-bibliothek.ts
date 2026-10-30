// Issue #335 (NA-02, 05.10.2026) - medien-bibliothek.ts: der zweite Importweg
// per Drag-and-drop aus dem Explorer/Finder.
//
// KANAL-ENTSCHEIDUNG (User, 05.10., auf Grundlage des Auslesen-Befunds):
// KEIN zweiter Kanal. Der Dialogweg (#228) reiht JEDE bereits im Renderer
// vorliegende Pfad selbst per `queue:reiheEin` mit dem Auftrag
// `{ art: 'import', payload: { projektId, quellPfad } }` ein; die
// Whitelist-Prüfung ist Sache des media-service im Main. Ein Drop liefert dem
// Renderer Pfade auf demselben Weg (webUtils in der Preload-Brücke, siehe
// ipc-client/pfad-fuer-datei.ts) - also läuft der Drop durch DENSELBEN
// Torwächter. Der Import umgeht ihn in KEINEM Fall, und der Main bleibt
// unangetastet.
//
// Die Nutzlast-Falle ist hier bewusst genau so übernommen wie in #228:
// `art: 'import'` und der Nutzlast kann NUR so lauten; die DoD „kein
// Import umgeht den Torwächter" ist damit strukturell erfüllt - es gibt in
// dieser Datei keinerlei anderen Weg zum Main als `queue:reiheEin`.
//
// Whitelist-Vorprüfung (DoD: nicht unterstützte Typen werden abgewiesen, OHNE
// dass ein Auftrag entsteht): DIE EINE Quelle ist der geteilte Konstantenwert
// FORMAT_WHITELIST (#13); die definitive Prüfung bleibt im Main - hier steht
// nur die Vorvermeidung toter Aufträge (DoD), keine zweite Wahrheit über Formate.

import type { File } from '../ipc-client/pfad-fuer-datei'
import type { ImportUebergabeErgebnis } from '../app-shell/medien-import-uebergabe'
import { baueImportBericht, type ImportBericht } from './medien-import'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Die Aufbereitung: aus den gezogenen Dateien werden die Pfad-Zeichenketten. */
export type PfadHoler = (datei: File) => string

/** EIN Ergebnis der Weg-Aufbereitung eines einzelnen Datei-Drop. */
export interface DropErgebnis {
  /** Die Pfade, die zur Einreihung bereitstehen (whitelist-bestand: WIRD im Main final geprüft). */
  einreihbar: string[]
  /** Dateien ohne auswertbaren Pfad (z. B. gezogener Text): kein Medium. */
  ohnePfad: number
  /** Abweiseungen wegen der Endung - mit demselben Hinweis wie im Dialog-Weg. */
  abgelehnt: Array<{ pfad: string; code: string; meldung: string }>
}

/** Die Endung,, kleingeschrieben, ohne Punkt. null = keine auswertbare Endung. */
function endungVon(pfad: string): string | null {
  const basis = pfad.split(/[\\/]/).pop() ?? ''
  const punkt = basis.lastIndexOf('.')
  if (punkt <= 0) {
    return null
  }
  return basis.slice(punkt + 1).toLowerCase()
}

/**
 * Nimmt die gezogenen Dateien entgegen und trennt sie auf: einreihbare Pfade,
 * Abweisungen (Endung nicht in FORMAT_WHITELIST, der EINEN Quelle) und Dateien
 * ohne Pfad. Die Prüfung im Main bleibt - hier steht die Vorvermeidung toter Aufträge (DoD), nicht
 * eine zweite Wahrheit über das Format.
 */
export function greifeDropAuf(dateien: readonly File[], pfadFuer: PfadHoler): DropErgebnis {
  const ergebnis: DropErgebnis = { einreihbar: [], ohnePfad: 0, abgelehnt: [] }
  for (const datei of dateien) {
    let pfad = ''
    try {
      pfad = pfadFuer(datei)
    } catch {
      pfad = ''
    }
    if (pfad.length === 0) {
      // z. B. eine gezogene Textauswahl: kein Medium, nichts einreihen.
      ergebnis.ohnePfad += 1
      continue
    }
    const endung = endungVon(pfad)
    if (endung === null) {
      ergebnis.abgelehnt.push({
        pfad,
        code: 'format_nicht_unterstuetzt',
        meldung: `"${pfad}" hat keine auswertbare Dateiendung - unterstützt werden ${[...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild].join(', ')}.`,
      })
      continue
    }
    // Reihenfolge wie der Vertrag: erst Video, dann Bild; die Kleinschreibung
    // ist normalisiert. Die definitive Prüfung bleibt im Main.
    const unterstuetzt =
      FORMAT_WHITELIST.video.some((erlaubt) => erlaubt === endung) ||
      FORMAT_WHITELIST.bild.some((erlaubt) => erlaubt === endung)
    if (!unterstuetzt) {
      ergebnis.abgelehnt.push({
        pfad,
        code: 'format_nicht_unterstuetzt',
        meldung: `"${pfad}" ist nicht importierbar - unterstützt werden ${[...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild].join(', ')}.`,
      })
      continue
    }
    ergebnis.einreihbar.push(pfad)
  }
  return ergebnis
}

/**
 * Reiht die aufbereiteten Pfade NACHEINANDER als Import-Aufträge ein - je Pfad
 * EIN Auftrag (lokale Entscheidung im Issue, hier festgehalten), mit demselben
 * Payload wie in #228. Teilerfolg bleibt benennbar: was zurückgewiesen wurde,
 * steht in `abgelehnt`; nichts wird sortiert, dedupliziert oder auf Existenz
 * geprüft (die Whitelist-Prüfung und die Existenz sind Sache des Main).
 *
 * Der Bericht kommt über denselben Weg wie der Dialog-Import (baueImportBericht
 * aus #228) - kein zweiter Fortschritts-Mechanismus.
 */
export async function reiheDropEin(projektId: string, pfade: readonly string[]): Promise<ImportUebergabeErgebnis> {
  const wert: ImportUebergabeErgebnis = {
    auftragIds: [],
    uebersprungen: [],
    abgelehnt: [],
    abgebrochen: false,
  }
  for (const pfad of pfade) {
    try {
      const einreihen = await rufeAuf<{ auftragId: string }>(
        KANAELE.queue.reiheEin,
        { art: 'import', payload: { projektId, quellPfad: pfad } },
      )
      if (einreihen.ok) {
        wert.auftragIds.push(einreihen.wert.auftragId)
      } else {
        wert.abgelehnt.push({ pfad, code: einreihen.fehler.code, meldung: einreihen.fehler.meldung })
      }
    } catch {
      wert.abgelehnt.push({
        pfad,
        code: 'unbekannter_fehler',
        meldung: 'Der Import-Auftrag konnte nicht eingereiht werden.',
      })
    }
  }
  return wert
}

/** Der Bericht zum Drop-Ergebnis: EINE Quelle für die Nutzerausgabe (: #228). */
export function berichteDrop(einreihErgebnis: ImportUebergabeErgebnis): ImportBericht {
  return baueImportBericht(einreihErgebnis)
}
