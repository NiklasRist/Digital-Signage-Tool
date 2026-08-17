// GENERIERT aus dem Signaturblock von Issue #204.
// [app-shell] Übergabe-Ziel Medien-Import
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
// GERUEST-PRUEFSUMME: 86c09b3cfc85a840
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]

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

  // Schritt 2 - Dialog oeffnen, ohne Nutzlast. Schlaegt der AUFRUF fehl, ist das
  // ein Fehler des Gesamtaufrufs: nichts eingereiht, Code unveraendert.
  let pfade: string[]
  try {
    const dialog = await rufeAuf<{ pfade: string[] }>(
      KANAELE.media.öffneMedienDialog,
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
  if ((FORMAT_WHITELIST.video as readonly string[]).includes(endung)) {
    return 'video'
  }
  if ((FORMAT_WHITELIST.bild as readonly string[]).includes(endung)) {
    return 'bild'
  }
  return null
}
