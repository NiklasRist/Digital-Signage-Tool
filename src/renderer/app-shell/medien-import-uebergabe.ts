// [app-shell] Übergabe-Ziel Medien-Import

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Was der Aufruf bewirkt hat. NICHT, was aus den Aufträgen geworden ist. */
export interface ImportUebergabeErgebnis {
  /** Die Kennungen der eingereihten Aufträge, in der Reihenfolge der gewählten Pfade. */
  auftragIds: string[]
  /** Pfade, die wegen `nurTyp` übersprungen wurden – dem Nutzer zu nennen (s. ENTSCHIEDEN 2). */
  uebersprungen: string[]
  /** Pfade, deren Einreihen abgelehnt wurde, mit dem Code. Der Ablauf bricht dabei NICHT ab. */
  abgelehnt: Array<{ pfad: string; code: string; meldung: string }>
  /** true, wenn der Nutzer den Dialog abgebrochen oder nichts gewählt hat. Kein Fehler. */
  abgebrochen: boolean
}

/**
 * Öffnet den Medien-Dialog und reiht je gewähltem Pfad EINEN Import-Auftrag ein.
 * Wartet NICHT auf den Ausgang der Aufträge – der läuft über #199 zurück.
 *
 * `nurTyp`: null = beide Typen zulassen (Medien-Bibliothek). 'bild' = nur Bilder behalten
 * (Aktions-Bild); alles andere landet in `uebersprungen`. Der Dialog selbst filtert NICHT.
 *
 * #418: Ein TYPISIERTER Import (`nurTyp` gesetzt) ist ein EINZEL-Import. Der Composer
 * laedt genau EIN Video; der Dialog erhaelt dafuer `{ nurTyp, einzel: true }`. Ohne
 * `nurTyp` (Reparatur-Uebergabe) bleibt die Mehrfachauswahl wie bisher.
 */
export async function starteMedienImport(
  projektId: string,
  nurTyp: 'video' | 'bild' | null,
): Promise<Ergebnis<ImportUebergabeErgebnis, string>> {
  // Schritt 1 - projektId pruefen, OHNE den Dialog zu oeffnen (import hat kein Ziel).
  if (typeof projektId !== 'string' || projektId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'projektId fehlt - ein Import braucht ein geoeffnetes Projekt.',
      },
    }
  }

  // Schritt 2 - Dialog oeffnen. #418: mit den abgeleiteten Optionen (typisierter Import
  // = EINZEL-Import, s. Kopfkommentar). Schlaegt der AUFRUF fehl, ist das ein Fehler des
  // Gesamtaufrufs: nichts eingereiht, Code unveraendert.
  let pfade: string[]
  try {
    const dialog = await rufeAuf<{ pfade: string[] }>(
      KANAELE.media.öffneMedienDialog,
      nurTyp === null ? {} : { nurTyp, einzel: true },
    )
    if (!dialog.ok) {
      return dialog
    }
    pfade = dialog.wert.pfade
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Medien-Dialog konnte nicht geoeffnet werden.',
      },
    }
  }

  // Abbrechen oder nichts gewaehlt ist KEIN Fehler (#81 liefert pfade: []).
  if (pfade.length === 0) {
    return {
      ok: true,
      wert: { auftragIds: [], uebersprungen: [], abgelehnt: [], abgebrochen: true },
    }
  }

  const wert: ImportUebergabeErgebnis = {
    auftragIds: [],
    uebersprungen: [],
    abgelehnt: [],
    abgebrochen: false,
  }

  // Schritte 3+4 - je Pfad EIN eigener Auftrag, nacheinander ('ok: true' heisst
  // nur: eingereiht). Es wird weder sortiert noch dedupliziert noch auf Existenz
  // geprueft - #81 hat die Mehrfachauswahl unveraendert durchgereicht, und die
  // Whitelist-Pruefung ist Sache des media-service im Main.
  for (const pfad of pfade) {
    if (nurTyp !== null && typAusPfad(pfad) !== nurTyp) {
      wert.uebersprungen.push(pfad)
      continue
    }

    try {
      const einreihen = await rufeAuf<{ auftragId: string }>(
        KANAELE.queue.reiheEin,
        { art: 'import', payload: { projektId, quellPfad: pfad } },
      )
      if (einreihen.ok) {
        wert.auftragIds.push(einreihen.wert.auftragId)
      } else {
        wert.abgelehnt.push({
          pfad,
          code: einreihen.fehler.code,
          meldung: einreihen.fehler.meldung,
        })
      }
    } catch {
      wert.abgelehnt.push({
        pfad,
        code: 'unbekannter_fehler',
        meldung: 'Der Import-Auftrag konnte nicht eingereiht werden.',
      })
    }
  }

  // Schritt 5 - auch mit abgelehnten Pfaden bleibt das Gesamtergebnis ok: true;
  // was nicht eingereiht wurde, steht benennbar in `uebersprungen`/`abgelehnt`.
  return { ok: true, wert }
}

/** Ordnet einen Dateipfad anhand seiner Endung einem Medientyp zu – rein, ohne Dateisystem.
 *  Vergleich kleingeschrieben, Endung ohne führenden Punkt. null = keine bekannte Endung. */
export function typAusPfad(pfad: string): 'video' | 'bild' | null {
  // Verzeichnisanteil an BEIDEN Trennzeichen abschneiden (Windows \ und macOS /).
  const basis = pfad.split(/[\\/]/).pop() ?? ''
  const punkt = basis.lastIndexOf('.')
  // Kein Punkt oder führender Punkt ('.gitignore') = keine Endung.
  if (punkt <= 0) {
    return null
  }
  const endung = basis.slice(punkt + 1).toLowerCase()
  // SAFETY: gecastet wird nur die Listen-Form fuer includes; endung ist die zu
  // pruefende Zeichenkette, FORMAT_WHITELIST der konstante Pruefbestand dieser Datei.
  if ((FORMAT_WHITELIST.video as readonly string[]).includes(endung)) {
    return 'video'
  }
  // SAFETY: dieselbe Listen-Form fuer includes; endung bleibt die zu pruefende
  // Zeichenkette, FORMAT_WHITELIST.bild der konstante Pruefbestand dieser Datei.
  if ((FORMAT_WHITELIST.bild as readonly string[]).includes(endung)) {
    return 'bild'
  }
  return null
}
