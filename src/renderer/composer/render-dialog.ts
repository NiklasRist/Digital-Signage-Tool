// GENERIERT aus dem Signaturblock von Issue #231.
// [composer] Render auslösen – Namenseingabe, Überschreib-Hinweis, Reparatur statt Fehlermeldung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf: gefuellt (Issue #231 /
// M7-38); die GERUEST-PRUEFSUMME oben stimmt nicht mehr - ihr Nichtmehrstimmen
// IST das Signal, die Datei wurde bearbeitet.
//
// ============================================== ====
// REGELN, herausgenommen aus dem Issue (alle verbindlich):
//  - Die Namensprüfung setzt die Liste aus TK 9.2.6 um - der erste zutreffende
//    Befund gewinnt; die Pfadprüfung (aufgeloester Pfad innerhalb projects/<id>/
//    output/) BLEIBT beim Main, denn der Renderer kennt keine absoluten Pfade.
//  - passt nichts: GEWISSENHAFT NICHTS abschneiden/bereinigen - Rueckgabe ist ein
//    Befund, kein String. Der Nutzer korrigiert, die Anzeige sagt, was stoert.
//  - ES WIRD KEIN Ersatzname erfunden (ENTSCHIEDEN 3); vorbelegt ist ausschliesslich
//    projekt.letzterAusgabeName.
//  - UEberschreiben: KEINE Rueckfrage sondern eine Feststellung MIT DEM DATUM
//    (ENTSCHIEDEN 1 - die hinweis-Formatierung "Ersetzt die Fassung vom ...",
//    buchstabengleicher Namensvergleich (M7-37: findeAusgabe), kein Kleinschreiben).
//  - ENTSCHIEDEN 6: loeseRenderAus als PARAMETER (Testbarkeit ohne Browser), aber der
//    TYP AusloeseFehlercode als IMPORT TYPE (selbes Modul, Wurf-Tippfehler waere
//    sonst lautenlich in meldeFehler anstatt starteReparaturModus).
//  - kaputte_elemente -> starteReparaturModus UND NICHTS SONST (kein meldeFehler),
//    Rueckgabe { art: 'reparatur' } (TK 9.7.4/9.7.5, FA-19).
//  - ok: true heißt EINGEREIHT, nicht gerendert: hier wartet NICHTS, zeigt
//    KEINEN Fortschritt, frischt nichts auf (M7-06/M7-37).
//  - Nach dem Einreihen passiert hier nichts mehr: kein Listen-Auffrischen,
//    kein letzterAusgabeName-Nachziehen ( CONSTRAINT, nicht Ursache der Entscheidung).

import type { Project } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { formatiereZeitpunkt } from './ausgabe-liste'
import type { AusgabeDatei } from './ausgabe-liste'
import type { AusloeseFehlercode } from './render-ausloesen'   // #134 – NUR der Typ

/** Frühe Rückmeldung auf den eingegebenen Namen – KEIN Ersatz für die Prüfung im Main. */
export type NamensBefund =
  | 'ok'
  | 'leer'
  | 'pfadtrenner'      // enthält '/' oder '\'
  | 'punkt_punkt'      // enthält '..'
  | 'unzulaessiges_zeichen'  // < > : " | ? * oder ein Steuerzeichen
  | 'reservierter_name'      // CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9
  | 'endung_angegeben'       // endet auf '.mp4' – der Name geht OHNE Endung in den Auftrag

/** Die reservierten Windows-Namen, unabhängig von der Groß-/Kleinschreibung (TK 9.2.6). */
const RESERVIERT = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
])

/** Prüft den Ausgabenamen nach TK 9.2.6. Der erste zutreffende Befund gewinnt -
 *  die Reihenfolge der Prüfungen folgt der DoD-Liste des Issues: leer, punkt_punkt,
 *  pfadtrenner, endung, reservierter_name, unzulaessiges_zeichen. */
export function pruefeAusgabeName(eingabe: string): NamensBefund {
  if (eingabe.replace(/[\s\u00A0]/g, '').length === 0) {
    return 'leer'
  }
  if (eingabe.includes('..')) {
    return 'punkt_punkt'
  }
  if (eingabe.includes('/') || eingabe.includes('\\')) {
    return 'pfadtrenner'
  }
  if (/\.mp4$/i.test(eingabe)) {
    return 'endung_angegeben'
  }
  if (RESERVIERT.has(eingabe.toLowerCase())) {
    return 'reservierter_name'
  }
  const istUnzulaessig =
    /[<>:"|?*]/.test(eingabe) ||
    // Steuerzeichen: unter U+0020 (Weißraum oben nicht) oder U+007F (DEL).
    [...eingabe].some((z) => {
      const punkt = z.codePointAt(0) ?? 0
      return (punkt < 0x20 && z !== ' ' && z !== '\t' && z !== '\n' && z !== '\r') || punkt === 0x7f
    })
  if (istUnzulaessig) {
    return 'unzulaessiges_zeichen'
  }
  return 'ok'
}

/** Die Vorbelegung des Eingabefeldes: `projekt.letzterAusgabeName`; null = keine Vorbelegung.
 *  Es wird KEIN Ersatzname erfunden (s. ENTSCHIEDEN 3). */
export function vorbelegterName(projekt: Project): string | null {
  return projekt.letzterAusgabeName
}

/** Was der Nutzer neben dem Eingabefeld sieht – rein abgeleitet, ohne Zustand. */
export interface Ueberschreiblage {
  /** true, wenn im Ausgabeordner bereits eine Datei mit diesem Namen liegt. */
  ersetzt: boolean
  /** Die Datei, die ersetzt wird; null, wenn keine. */
  vorhandene: AusgabeDatei | null
  /** Der Hinweistext – KEINE Frage, sondern eine Feststellung. Leer, wenn nichts ersetzt wird. */
  hinweis: string
}

/**
 * Bildet den Dateinamen (`<name>.mp4`) und sucht ihn im übergebenen Bestand.
 * Der Bestand kommt als Parameter aus #230 – diese Datei lädt ihn NICHT (s. ENTSCHIEDEN 5).
 */
export function pruefeUeberschreiben(
  ausgabeName: string,
  ausgaben: readonly AusgabeDatei[],
): Ueberschreiblage {
  // Buchstabengleicher Vergleich (kein Kleinschreiben, keine Normalisierung) - dieselbe Regel wie bei findeAusgabe (M7-37).
  const gesucht = `${ausgabeName}.mp4`
  const vorhandene = ausgaben.find((datei) => datei.dateiname === gesucht) ?? null
  if (vorhandene === null) {
    return { ersetzt: false, vorhandene: null, hinweis: '' }
  }
  return {
    ersetzt: true,
    vorhandene,
    // Feststellung, KEINE Frage und KEINE Bestaetigungsaufforderung.
    hinweis: `Ersetzt die Fassung vom ${formatiereZeitpunkt(vorhandene.geaendertAm)}.`,
  }
}

/** Alles, was der Auslöse-Ablauf braucht und was diese Datei nicht selbst besitzt. */
export interface RenderDialogWirkungen {
  /** Der Auslöser aus #134. Wird als Parameter übergeben, nicht importiert (s. ENTSCHIEDEN 6). */
  loeseRenderAus: (
    projekt: Project,
    ausgabeName: string,
    marke: Marke,
    vorlagen: readonly Vorlage[],
  ) => Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>>
  /** Führt in den geführten Reparatur-Modus. Wird bei `kaputte_elemente` gerufen – STATT einer
   *  Fehlermeldung. Der Aufrufer verdrahtet ihn mit #132/#201. */
  starteReparaturModus: () => void
  /** Meldeweg für alle übrigen Fehler. Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Was nach dem Auslösen geschehen ist – für den Aufrufer, der den Dialog schließt. */
export type RenderAusloesung =
  | { art: 'eingereiht'; auftragId: string }
  | { art: 'reparatur' }          // in den Reparatur-Modus geführt, NICHT eingereiht
  | { art: 'abgelehnt'; code: string }

/**
 * Löst den Render aus. Setzt voraus, dass `pruefeAusgabeName` `'ok'` geliefert hat – das prüft
 * die Anzeige, nicht diese Funktion.
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1).
 */
export async function loeseRenderMitNamenAus(
  projekt: Project,
  ausgabeName: string,
  marke: Marke,
  vorlagen: readonly Vorlage[],
  wirkungen: RenderDialogWirkungen,
): Promise<RenderAusloesung> {
  let antwort
  try {
    antwort = await wirkungen.loeseRenderAus(projekt, ausgabeName, marke, vorlagen)
  } catch (ausnahme) {
    wirkungen.meldeFehler(
      'unbekannter_fehler',
      ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
    )
    return { art: 'abgelehnt', code: 'unbekannter_fehler' }
  }

  if (antwort.ok) {
    // EINGEREIHT, nicht gerendert - hier endet diese Datei. Kein Warten, kein
    // Fortschritt, kein Auffrischen (M7-06/M7-37 leisten das nach).
    return { art: 'eingereiht', auftragId: antwort.wert.auftragId }
  }

  if (antwort.fehler.code === 'kaputte_elemente') {
    // In die Reparatur gefuehrt - STATT einer Fehlermeldung (TK 9.7.4/9.7.5).
    try {
      wirkungen.starteReparaturModus()
    } catch (ausnahme) {
      wirkungen.meldeFehler(
        'unbekannter_fehler',
        ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
      )
    }
    return { art: 'reparatur' }
  }

  wirkungen.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
  return { art: 'abgelehnt', code: antwort.fehler.code }
}
