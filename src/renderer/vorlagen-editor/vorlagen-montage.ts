// Die reine Zusammensetz-Logik des Vorlagen-Editors (#251 / M7-60).
//
// Ansicht, Gestenzustand, Bildung der neuen Sitzung und das Einsetzen von
// geaenderten Zonen - OHNE JSX/React/IPC. Die .tsx-Wurzel (index.tsx) ordnet
// nur; hier sitzt die Fachlichkeit.
//
// ENTSCHEIDENE Regeln (alle verbindlich):
//  - Ansicht ABGELEITET: ansichtFuer(null) -> 'uebersicht', sonst 'editor'
//    (kein dritter Zustand; die Sitzung liegt in der Shell und ueberlebt den
//    Reiterwechsel - die Ansicht folgt ihr).
//  - Geste: Ein Ziehen liefert Hunderte Zwischenstaende; wird jeder an den
//    Sitzungshalter gegeben, verschiebt Rueckgaengig um drei Pixel. WAHREND der
//    Geste laeuft der stand LOKAL; uebernimmAenderung/sichereStand werden
//    GENAU EINMAL beim Loslassen gerufen (in der .tsx, Reihenfolge ENTSCHIEDEN 4).
//  - mitArbeitskopie: NUR arbeitskopie aendert sich; alle uebrigen Felder -
//    insbesondere festeZonenSoll beim Offnen-Zustand - bleiben REFERENZGLEICH.
//    Wuerde es aus dem aktuellen Stand neu gebildet, koennte eine verschobene
//    feste Zone nie auffallen (die Pruefung feste_zone_veraendert waere tot).
//  - mitZone/mitZonen: der EINZIGE Rueckweg einer geaenderten Zone in die
//    Arbeitskopie. mitZone haengt eine UNBEKANNE id NICHT an - eine Zone
//    entsteht ausschliesslich ueber fuegeZoneHinzu (#147); eine unbekannte id
//    waere ein veraltetes Augeflueck und wuerde sonst stillschweigend eine
//    DOPPELTE Zone aus make (sperrt spaeter zonen_id_doppelt, unverstaendlich).
//  - Kein IPC, kein Timer, kein Zeichnen, keine Pruefung, kein Schnappschuss:
//    all das wohnt fremd (#143/#145-/148/#149/#150/#245).

import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { EditorSitzung } from './arbeitskopie'
import type { VorschauFeld } from './editor-vorschau'

/** Was der Reiter Vorlagen gerade zeigt – ABGELEITET, nicht gehalten (s. ENTSCHIEDEN 2). */
export type EditorAnsicht = 'uebersicht' | 'editor'

/** `null` -> 'uebersicht', sonst 'editor'. Es gibt keinen dritten Zustand. */
export function ansichtFuer(sitzung: EditorSitzung | null): EditorAnsicht {
  return sitzung === null ? 'uebersicht' : 'editor'
}

/** Der lokale Zwischenstand WAEHREND einer Maus-Geste (Ziehen oder Bemassen). */
export interface Geste {
  laeuft: boolean
  /** Der Zwischenstand der Arbeitskopie; null, wenn keine Geste laeuft. */
  stand: Vorlage | null
}

export const KEINE_GESTE: Geste = Object.freeze({ laeuft: false, stand: null })

/** Beginnt eine Geste mit dem aktuellen Stand. Liefert eine NEUE Geste. */
export function beginneGeste(stand: Vorlage): Geste {
  return { laeuft: true, stand }
}

/** Fuehrt sie fort. Ohne laufende Geste bleibt die uebergebene UNVERAENDERT zurueck. */
export function fuehreGesteFort(geste: Geste, stand: Vorlage): Geste {
  if (!geste.laeuft) {
    return geste
  }
  return { laeuft: true, stand }
}

/** Beendet sie: `laeuft: false`, `stand: null`. Liefert eine NEUE Geste. */
export function beendeGeste(geste: Geste): Geste {
  void geste
  return { laeuft: false, stand: null }
}

/** Was gezeichnet und bemasst wird: waehrend einer Geste ihr Zwischenstand, sonst die Arbeitskopie
 *  der Sitzung. null, wenn keine Sitzung offen ist. Total: wirft nie. */
export function sichtbarerStand(sitzung: EditorSitzung | null, geste: Geste): Vorlage | null {
  if (geste.laeuft) {
    return geste.stand
  }
  return sitzung === null ? null : sitzung.arbeitskopie
}

/** Die Sitzung mit einer neuen Arbeitskopie. Alle uebrigen Felder bleiben REFERENZGLEICH. */
export function mitArbeitskopie(sitzung: EditorSitzung, arbeitskopie: Vorlage): EditorSitzung {
  return {
    ...sitzung,
    arbeitskopie,
  }
}

/** Setzt EINE geaenderte Zone wieder in die Vorlage ein - an DERSELBEN Position.
 *  Unbekannte id: UNVERAENDERT (referenzgleich) zurueck, NICHTS angehaengt. */
export function mitZone(vorlage: Vorlage, zone: Zone): Vorlage {
  const stelle = vorlage.zonen.findIndex((eintrag) => eintrag.id === zone.id)
  if (stelle === -1) {
    return vorlage
  }
  return {
    ...vorlage,
    zonen: [...vorlage.zonen.slice(0, stelle), zone, ...vorlage.zonen.slice(stelle + 1)],
  }
}

/** Setzt eine vollstaendig neu geordnete Zonenfolge ein - REFERENZGLEICH, unzaehlig veraehlt. */
export function mitZonen(vorlage: Vorlage, zonen: Zone[]): Vorlage {
  return {
    ...vorlage,
    zonen,
  }
}

/** Schaltet ein Vorschau-Feld um (hinzufuegen oder entfernen). Das Set bleibt unveraendert. */
export function schalteVorschauFeld(
  geleert: ReadonlySet<VorschauFeld>,
  feld: VorschauFeld,
): Set<VorschauFeld> {
  const neu = new Set(geleert)
  if (neu.has(feld)) {
    neu.delete(feld)
  } else {
    neu.add(feld)
  }
  return neu
}
