// [action-editor] Welche Formularfelder eine Vorlage ueberhaupt benutzt (03.11.2026)
//
// WARUM: Das Formular zeigte IMMER alle Felder. Bei „Band-Standard" gibt es aber
// bewusst KEINE `beschreibung`-Zone (TK 9.11.1: in die nutzbaren ~90 px passt genau
// eine kompakte Zeile) - wer dort eine Beschreibung tippte, schrieb in ein Feld, das
// nie gezeichnet wird. Dasselbe gilt fuer jede eigene Vorlage, die eine Bindung
// weglaesst.
//
// DIE QUELLE IST DIE VORLAGE, NICHT EINE LISTE HIER: Gefragt wird je Feld, ob eine
// Zone es bindet (`Zone.bindung`) und ob irgendeine Zone eine Akzent-Rolle benutzt.
// Eine zweite Liste „welche Vorlage was kann" waere beim naechsten Vorlagen-Umbau
// still falsch.
//
// KEIN IPC, KEIN JSX, KEIN ZUSTAND: reine Ableitung aus den Zonendaten.

import type { Bindung, Vorlage, Zone } from '../../shared/contracts/vorlage'
import { AKZENT_ROLLEN } from './akzentfarbe'

/** Je Feld: benutzt die Vorlage es? `true` heisst „Feld zeigen". */
export interface FeldBedarf {
  /** Der Titel ist Pflicht im Datenmodell - auch eine Vorlage ohne Titel-Zone
   *  braucht das Feld, sonst liesse sich die Aktion nicht anlegen. */
  titel: boolean
  beschreibung: boolean
  preis: boolean
  cta: boolean
  bild: boolean
  akzent: boolean
}

/** Unbekannte Vorlage (noch nicht geladen, geloescht): NICHTS ausblenden.
 *  Ein ausgeblendetes Feld waere hier eine Behauptung ueber eine Vorlage, die wir
 *  nicht kennen - lieber eines zu viel zeigen als eines zu wenig. */
const ALLES: FeldBedarf = {
  titel: true,
  beschreibung: true,
  preis: true,
  cta: true,
  bild: true,
  akzent: true,
}

/** Die drei Akzent-Rollen als MENGE - ohne Typ-Behauptung: `Set<string>` nimmt die
 *  literale Liste direkt an, und `.has` fragt nur nach dem Wert. */
const AKZENT_MENGE: ReadonlySet<string> = new Set(AKZENT_ROLLEN)

function bindet(zonen: readonly Zone[], bindung: Bindung): boolean {
  return zonen.some((zone) => zone.bindung === bindung)
}

/** Benutzt die Zone eine der drei Akzent-Rollen? Geprueft werden alle Stellen, an
 *  denen eine Farb-Rolle stehen kann (Text, Fuellung, Verlauf) - eine vierte gibt es
 *  im Vertrag nicht. */
function nutztAkzent(zone: Zone): boolean {
  const rollen: Array<string | undefined> = [
    zone.text?.farbRolle,
    zone.deko?.füllungFarbRolle,
    zone.deko?.verlauf?.vonFarbRolle,
    zone.deko?.verlauf?.bisFarbRolle,
  ]
  return rollen.some((rolle) => rolle !== undefined && AKZENT_MENGE.has(rolle))
}

/** Der Bedarf einer Vorlage. `null` (unbekannt) liefert ALLES. */
export function feldBedarf(vorlage: Vorlage | null): FeldBedarf {
  if (vorlage === null) return ALLES

  return {
    // Immer zeigen: der Titel ist Pflicht (TK 9.8.4), auch wenn die Vorlage ihn
    // nicht zeichnet - sonst waere die Aktion nicht speicherbar.
    titel: true,
    beschreibung: bindet(vorlage.zonen, 'beschreibung'),
    preis: bindet(vorlage.zonen, 'preis'),
    cta: bindet(vorlage.zonen, 'cta'),
    bild: bindet(vorlage.zonen, 'bild'),
    akzent: vorlage.zonen.some(nutztAkzent),
  }
}
