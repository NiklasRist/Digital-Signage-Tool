// Issue #232 (M7-39) - export-dialog.ts: die reine Auswahl-Logik und der Ablauf,
// ohne React, ohne JSX, vollstaendig ohne Browser pruefbar. Die Anzeige liegt in
// export-dialog.tsx; sie haelt KEINEN eigenen Zustand und rechnet nichts selbst.
//
// Bauform wie beim Zwilling #231 (render-dialog.ts): Die Auswahl ist ein WERT
// (ENTSCHIEDEN 4), jede Funktion liefert einen neuen Wert und laesst die Eingabe
// unveraendert. loeseExportAus kommt als PARAMETER (ENTSCHIEDEN 5), der Fehlercode
// reist als string - der Renderer importiert keine Union der Main-Module.
//
// Der Abbruch des Zielordner-Dialogs (pfad === null) ist ok:true, KEIN Fehler
// (#183), und laesst ein zuvor gewaehltes Ziel stehen (ENTSCHIEDEN 2).
// Der Renderer kennt keine absoluten Pfade (TK 9.6.1 / 9.5.7): Der zielPfad kommt
// aus dem Betriebssystem-Dialog des Main und wird UNVERAENDERT zurueckgereicht -
// nicht zerlegt, nicht zusammengesetzt, nicht angezeigt zerteilt. Das Ziel
// <zielPfad>/<dateiname> bildet der export-service, nicht diese Datei (FA-09:
// die Datei exportiert unter ihrem eigenen Namen; der Zwang auf loop.mp4 ist mit
// FA-22 entfallen). Keine Prüfung auf Platz, Dateisystem, FAT32 oder Größe
// (ENTSCHIEDEN 6) - dafuer hat der export-service seinen eigenen Waechter.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { AusgabeDatei } from './ausgabe-liste'

/** Der Zustand der Auswahl – ein WERT, kein Modul-Zustand (s. ENTSCHIEDEN 4). */
export interface Exportauswahl {
  /** Die gewählte Datei; null, solange keine gewählt ist. */
  datei: AusgabeDatei | null
  /** Der zuletzt gewählte Zielordner; null, solange keiner gewählt wurde. */
  zielPfad: string | null
}

/** Nichts gewählt. */
export const LEERE_EXPORTAUSWAHL: Exportauswahl = { datei: null, zielPfad: null }

/** Wählt die Datei mit diesem Namen aus dem übergebenen Bestand. Unbekannter Name ⇒ `datei: null`
 *  (es wird KEIN Eintrag erfunden). Der Zielordner bleibt erhalten. */
export function waehleDatei(
  auswahl: Exportauswahl,
  dateiname: string,
  ausgaben: readonly AusgabeDatei[],
): Exportauswahl {
  // Buchstabengleicher Vergleich - kein Kleinschreiben, keine Normalisierung
  // (DoD: 'Sommer.mp4' findet 'sommer.mp4' NICHT). Keine Mehrfachauswahl
  // (ENTSCHIEDEN 3): genau EIN Eintrag oder keiner.
  const datei = ausgaben.find((d) => d.dateiname === dateiname) ?? null
  return { datei, zielPfad: auswahl.zielPfad }
}

/** true, wenn BEIDE Angaben vorliegen – nur dann darf ausgelöst werden. */
export function istExportBereit(auswahl: Exportauswahl): boolean {
  return auswahl.datei !== null && auswahl.zielPfad !== null
}

/**
 * Öffnet den Zielordner-Dialog (`export:wähleExportZiel`, #183) und trägt das Ergebnis ein.
 * Ein Abbruch (`pfad === null`) lässt `auswahl.zielPfad` UNVERÄNDERT und ist KEIN Fehler
 * (s. ENTSCHIEDEN 2).
 */
export async function waehleZiel(
  auswahl: Exportauswahl,
): Promise<Ergebnis<{ auswahl: Exportauswahl; abgebrochen: boolean }, string>> {
  let antwort
  try {
    // Ohne Nutzlast: die Operation hat keinen Parameter (Ablauf-Schritt 1).
    antwort = await rufeAuf<{ pfad: string | null }>(KANAELE.export.wähleExportZiel)
  } catch (ausnahme) {
    // Der Rufe wirft bei fehlender Bridge -> als Fehler zurueckgeben; die Auswahl bleibt
    // unveraendert (Fehlerpfade-Tabelle).
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
      },
    }
  }

  if (!antwort.ok) {
    // Code UNVERAENDERT zurueckgeben; die Auswahl bleibt UNVERAENDERT;
    // kein zweiter Versuch (Fehlerpfade-Tabelle).
    return antwort
  }

  const { pfad } = antwort.wert
  if (pfad === null) {
    // Abbruch ist ok:true, KEIN Fehler (#183): kein Fehler, keine Meldung, und
    // ein zuvor gewaehltes Ziel bleibt stehen (ENTSCHIEDEN 2).
    return { ok: true, wert: { auswahl, abgebrochen: true } }
  }

  // Der Pfad wird UNVERAENDERT uebernommen (Ablauf-Schritt 4): nicht normalisiert,
  // nicht auf Existenz geprueft, nicht auf Schreibbarkeit geprueft.
  return { ok: true, wert: { auswahl: { ...auswahl, zielPfad: pfad }, abgebrochen: false } }
}

/** Alles, was der Auslöse-Ablauf braucht und was diese Datei nicht selbst besitzt. */
export interface ExportDialogWirkungen {
  /** Der Auslöser aus #134. Wird als Parameter übergeben, nicht importiert (s. ENTSCHIEDEN 5). */
  loeseExportAus: (
    projektId: string,
    dateiname: string,
    zielPfad: string,
  ) => Promise<Ergebnis<{ auftragId: string }, string>>
  /** Meldeweg für Fehler. Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Was nach dem Auslösen geschehen ist – für den Aufrufer, der den Dialog schließt. */
export type ExportAusloesung =
  | { art: 'eingereiht'; auftragId: string }
  | { art: 'abgelehnt'; code: string }

/**
 * Reiht den Export ein. Setzt `istExportBereit(auswahl) === true` voraus – das prüft die Anzeige,
 * nicht diese Funktion.
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1).
 */
export async function loeseExportMitAuswahlAus(
  projektId: string,
  auswahl: Exportauswahl,
  wirkungen: ExportDialogWirkungen,
): Promise<ExportAusloesung> {
  let antwort
  try {
    // Alle drei Werte UNVERAENDERT (Ablauf-Schritt 1): projektId, der Dateiname
    // MIT Endung (FA-09: unter ihrem eigenen Namen) und der Zielordner.
    antwort = await wirkungen.loeseExportAus(
      projektId,
      // Setzt istExportBereit voraus (Vertrag): hier nonzero. Ohne Nicht-Null-
      // Behauptung waere das Zusammensetzen von dateiname/zielPfad hier doppelt.
      auswahl.datei === null || auswahl.zielPfad === null
        ? '' // kommt nicht vor: die Anzeige sperrt den Ausloeser (Fehlerpfade)
        : auswahl.datei.dateiname,
      auswahl.datei === null || auswahl.zielPfad === null ? '' : auswahl.zielPfad,
    )
  } catch (ausnahme) {
    wirkungen.meldeFehler(
      'unbekannter_fehler',
      ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
    )
    return { art: 'abgelehnt', code: 'unbekannter_fehler' }
  }

  if (antwort.ok) {
    // EINGEREIHT, nicht exportiert (Ablauf-Schritt 3): hier endet diese Datei.
    // Kein Warten, kein Fortschritt, keine Erfolgsmeldung (ENTSCHIEDEN 9) - den
    // Verlauf zeigt die Warteschlangen-Leiste (M7-06/M7-12 ff.).
    return { art: 'eingereiht', auftragId: antwort.wert.auftragId }
  }

  wirkungen.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
  return { art: 'abgelehnt', code: antwort.fehler.code }
}
