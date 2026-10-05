// Issue #256 (M7-64) - uebergabe.ts: der Halter der Shell-Reparatur und der REINE
// Ablauf (ohne JSX, ohne react). Hier sitzt die gesamte Fachlichkeit.
//
// Der Auftrag (TK 9.14.2): der Hinweg UND die Rueckkehr des geführten Reparatur-
// Modus - M7-08 liefert die Schritte, DIESE Datei führt sie aus (Reiterwechsel,
// Overlay-Zuordnung, Abschluss-Funktionen, Beenden). Ohne laufende Übergabe sind
// alle Wege wirkungslos und werfen nie.
//
// ENTSCHIEDEN 1: Genau EIN Halter, Instanz je Fenster (Bauweise wie M7-52,
// sitzungshalter), `setzeReparaturhalterZurueck()` nur für Tests.
// ENTSCHIEDEN 4: Diese Datei rechnet den Fortschritt NICHT - `rechneStandNeu`
// kommt als Parameter herein (E1: aus fremden Modulen reisen nur Typen/Parameter).
// ENTSCHIEDEN 8: Die drei Rückwege aus #133 werden UNVERÄNDERT durchgereicht; die
// EINE Ausnahme ist `schliesseMediumFixAb` im Import-Rückweg (kein Overlay könnte
// ihn rufen; die Kennung kommt aus dem fertigen Auftrag, nicht vom Nutzer).
// ENTSCHIEDEN 12/13: Der Import-Rückweg schliesst `medium_neu_verknuepfen` ab -
// M7-06 meldet den fertigen Asset, M7-69 ruft diese Funktion. Diese Datei hört
// NICHT selbst zu (kein `abonniere`, kein `queue:`-Literal). Kommen mehrere
// Assets, gewinnt das ERSTE; danach ist die Übergabe zu, jede weitere Meldung
// läuft wirkungslos durch.

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ReparaturStand } from '../composer/reparatur-fuehrung'
import type { Uebergabe, FixWirkung } from '../composer/reparatur-optionen'
import type { ShellReparatur } from './reparatur-fuehrung-shell'
import type { ImportUebergabeErgebnis } from './medien-import-uebergabe'
import type { ReiterId } from './reiter'
import {
  LEERE_SHELL_REPARATUR, uebernimmUebergabe, beendeUebergabe, uebernimmStand,
} from './reparatur-fuehrung-shell'

/** Welches Overlay die Anzeige einsetzt. `'keins'` heisst: NICHTS wird gezeigt. */
export type OverlayArt = 'keins' | 'asset-auswahl' | 'aktions-auswahl'

/**
 * Das Overlay zu einer Uebergabe. REIN und TOTAL: wirft nie.
 * `{ ziel: 'medien-import' }` und `{ ziel: 'action-editor' }` liefern `'keins'` – der eine ist ein
 * Fenster des Betriebssystems, der andere ein Reiterwechsel (s. ENTSCHIEDEN 2).
 */
export function overlayFuer(uebergabe: Uebergabe | null): OverlayArt {
  if (uebergabe === null) {
    return 'keins'
  }
  switch (uebergabe.ziel) {
    case 'asset-auswahl':
      return 'asset-auswahl'
    case 'aktions-auswahl':
      return 'aktions-auswahl'
    default:
      // medien-import: Datei-Dialog des Betriebssystems. action-editor: die Shell
      // wechselt den Reiter; ein Overlay verdeckte genau die Oberfläche, zu der
      // gerade gewechselt wurde (ENTSCHIEDEN 2).
      return 'keins'
  }
}

/** Braucht diese Uebergabe den Datei-Dialog (M7-11)? NUR bei `{ ziel: 'medien-import' }`. */
export function brauchtMedienDialog(uebergabe: Uebergabe | null): boolean {
  return uebergabe !== null && uebergabe.ziel === 'medien-import'
}

/** Das Element, um das es geht; null, wenn die Uebergabe keins nennt. Rein; wirft nie. */
export function elementIdFuer(uebergabe: Uebergabe | null): string | null {
  if (uebergabe === null) {
    return null
  }
  return uebergabe.ziel === 'asset-auswahl' || uebergabe.ziel === 'aktions-auswahl'
    ? uebergabe.elementId
    : null
}

/** Der Band-Abschnitt; null bei Listenelementen und bei allen anderen Zielen. Rein; wirft nie. */
export function abschnittIndexFuer(uebergabe: Uebergabe | null): number | null {
  if (uebergabe === null || uebergabe.ziel !== 'aktions-auswahl') {
    return null
  }
  return uebergabe.abschnittIndex
}

/**
 * Der EINE Halter der Shell-Reparatur. Er haelt einen WERT; keine Funktion mutiert ihn (M7-08).
 */
export interface Reparaturhalter {
  holeLage: () => ShellReparatur
  /** Ersetzt die Lage und benachrichtigt die Hörer. Fuehrt selbst KEINEN Reiterwechsel aus. */
  setzeLage: (lage: ShellReparatur) => void
  /** Abonnement fuer Lageaenderungen; Rueckgabewert ist die Abmelde-Funktion. */
  aufLageGeaendert: (hoerer: (lage: ShellReparatur) => void) => () => void
}

let dieInstanz: Reparaturhalter | null = null

/** Der EINE Halter des Fensters. Liefert bei jedem Aufruf DIESELBE Instanz. */
export function reparaturhalter(): Reparaturhalter {
  if (dieInstanz !== null) {
    return dieInstanz
  }
  let lage: ShellReparatur = LEERE_SHELL_REPARATUR
  // ENTSCHIEDEN 10 (wortgleiche Lage wie M7-01 und M7-52): Hörer werden über die
  // KOPIE der Liste in Anmeldereihenfolge gerufen; ein werfender Hörer reisst
  // niemanden mit; wer sich selbst abmeldet, bricht die laufende Runde nicht ab;
  // die Abmelde-Funktion ist idempotent.
  const hoerer: Array<(lage: ShellReparatur) => void> = []
  dieInstanz = {
    holeLage: () => lage,
    setzeLage: (neueLage: ShellReparatur) => {
      lage = neueLage
      for (const horer of [...hoerer]) {
        try {
          horer(lage)
        } catch {
          // Ein werfender Hörer reisst niemanden mit (ENTSCHIEDEN 10).
        }
      }
    },
    aufLageGeaendert: (neuerHoerer) => {
      hoerer.push(neuerHoerer)
      let angemeldet = true
      return () => {
        if (!angemeldet) {
          // Idempotent: ein erneut gerufener Abmelder tut nichts (ENTSCHIEDEN 10).
          return
        }
        angemeldet = false
        const stelle = hoerer.indexOf(neuerHoerer)
        if (stelle !== -1) {
          hoerer.splice(stelle, 1)
        }
      }
    },
  }
  return dieInstanz
}

/** NUR für Tests: ersetzt den Halter durch einen frischen, leeren (`LEERE_SHELL_REPARATUR`). */
export function setzeReparaturhalterZurueck(): void {
  dieInstanz = null
}

/**
 * Alles, was der Ablauf ausser dem Halter braucht und selbst NICHT besitzt.
 */
export interface UebergabeUmgebung {
  halter: Reparaturhalter
  /** Das geladene Projekt; null, wenn keins offen ist. Aus M7-04: projekt.hole().projekt */
  holeProjekt: () => Project | null
  holeReiter: () => ReiterId
  wechsleReiter: (ziel: ReiterId) => void
  /** `aktualisiereReparatur` aus #132 – die EINZIGE Fortschrittsrechnung (s. ENTSCHIEDEN 4). */
  rechneStandNeu: (stand: ReparaturStand, projekt: Project) => ReparaturStand
  /** Der Datei-Dialog samt Import-Auftraegen (M7-11). */
  starteMedienImport: (
    projektId: string,
    nurTyp: 'video' | 'bild' | null,
  ) => Promise<Ergebnis<ImportUebergabeErgebnis, string>>
  /** Der Rueckweg von `medium_neu_verknuepfen` (#133) – NUR für den Import-Abschluss
   *  (`schliesseMedienImportAb`, ENTSCHIEDEN 12). Als PARAMETER, nicht importiert (E1).
   *  Die ÜBRIGEN Rückwege bleiben durchgereicht und werden hier NICHT gerufen. */
  schliesseMediumFixAb: (
    elementId: string,
    neueAssetId: string,
  ) => Promise<Ergebnis<FixWirkung>>
  /** Meldeweg für Fehler. Diese Dateien zeigen NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/**
 * Nimmt eine Uebergabe aus #133 entgegen (der Weg dorthin ist `meldeUebergabe`, M7-68), legt sie
 * ueber `uebernimmUebergabe` (M7-08) ab und FÜHRT den gelieferten Reiterwechsel AUS.
 * Total: wirft nie.
 */
export function nimmUebergabeEntgegen(u: UebergabeUmgebung, an: Uebergabe): void {
  const lage = u.halter.holeLage()
  const schritt = uebernimmUebergabe(lage, an, u.holeReiter())
  // Schritt 3 VOR Schritt 4: Ein Hörer, der auf den Reiterwechsel reagiert, sieht
  // die neue Lage bereits (verbindlich).
  u.halter.setzeLage(schritt.lage)
  if (schritt.wechselZu !== null) {
    u.wechsleReiter(schritt.wechselZu)
  }
  // ENTSCHIEDEN 3: Der Medien-Dialog wird angestossen, aber NICHT abgewartet - der
  // Aufrufer ist ein synchroner Ereignis-Rückruf des composer; ein await hielte ihn
  // an, bis der Nutzer den Datei-Dialog schliesst.
  if (brauchtMedienDialog(an)) {
    void fuehreMedienImportAus(u)
  }
}

/**
 * Beendet die laufende Uebergabe – bei Abschluss WIE bei Abbruch – durch `beendeUebergabe`
 * (M7-08) und führt den gelieferten Rückkehr-Wechsel AUS. Ohne laufende Uebergabe
 * wirkungslos; der Aufruf ist trotzdem erlaubt.
 */
export function beendeLaufende(u: UebergabeUmgebung): void {
  const schritt = beendeUebergabe(u.halter.holeLage())
  u.halter.setzeLage(schritt.lage)
  if (schritt.wechselZu !== null) {
    u.wechsleReiter(schritt.wechselZu)
  }
}

/**
 * Der Abschluss nach einer bestätigten Wahl: `{ art: 'erledigt' }` rechnet den Stand neu,
 * übernimmt ihn und beendet die Uebergabe; `{ art: 'uebergabe' }` löst die nächste
 * Uebergabe aus (ENTSCHIEDEN 5). Total: wirft nie.
 */
export function schliesseFixAb(u: UebergabeUmgebung, wirkung: FixWirkung): void {
  if (wirkung.art === 'uebergabe') {
    // ENTSCHIEDEN 5: die NÄCHSTE Uebergabe - nichts beenden, nichts nachrechnen.
    // Die alte wird von M7-08 verworfen; der rueckkehrReiter bleibt stehen.
    nimmUebergabeEntgegen(u, wirkung.an)
    return
  }

  // Warum das Nachrechnen VOR dem Beenden steht: `beendeLaufende` kann einen
  // Reiterwechsel auslösen - käme die neue Zahl danach, zeigte der Reiter für einen
  // Moment den ALTEN Fortschritt (TK 9.14.2: durchgehend sichtbar).
  const lage = u.halter.holeLage()
  const projekt = u.holeProjekt()
  if (lage.stand !== null && projekt !== null) {
    u.halter.setzeLage(uebernimmStand(lage, u.rechneStandNeu(lage.stand, projekt)))
  }
  beendeLaufende(u)
}

/**
 * Der HINWEG für `{ ziel: 'medien-import', elementId }`: Dialog öffnen, Aufträge einreihen.
 * Er ruft KEINE Abschluss-Funktion - die neue Asset-ID entsteht erst, wenn der Auftrag
 * terminal wird, und das wertet AUSSCHLIESSLICH M7-06 aus (TK 9.1.1 Punkt 1).
 */
export async function fuehreMedienImportAus(u: UebergabeUmgebung): Promise<void> {
  const projekt = u.holeProjekt()
  if (projekt === null) {
    // Fehlerpfade: ungueltige_eingabe - OHNE Dialog - und die Übergabe wird beendet.
    u.meldeFehler(
      'ungueltige_eingabe',
      'Es ist kein Projekt geladen, der Medien-Dialog kann nicht geöffnet werden.',
    )
    beendeLaufende(u)
    return
  }

  let antwort: Ergebnis<ImportUebergabeErgebnis, string>
  try {
    antwort = await u.starteMedienImport(projekt.id, null)
  } catch (ursache) {
    // Fehlerpfade: hier gefangen, gemeldet, Übergabe beendet; der Wurf verlässt die Datei nicht.
    u.meldeFehler('unbekannter_fehler', ursache instanceof Error ? ursache.message : String(ursache))
    beendeLaufende(u)
    return
  }

  if (!antwort.ok) {
    // Code UNVERÄNDERT gemeldet; die Übergabe wird beendet.
    u.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
    beendeLaufende(u)
    return
  }

  if (antwort.wert.auftragIds.length === 0) {
    // Dialog abgebrochen, alles übersprungen oder alles abgelehnt: KEIN Fehler -
    // aber es kommt nie eine Asset-Kennung, deshalb wird die Uebergabe beendet.
    beendeLaufende(u)
    return
  }

  // Mindestens EIN Auftrag eingereiht: die Übergabe bleibt STEHEN und wird von
  // `schliesseMedienImportAb` beendet (ENTSCHIEDEN 12). Hier geschieht sonst NICHTS:
  // keine Abschluss-Funktion, kein Warten, kein Fortschritt.
}

/**
 * Der RÜCKWEG für `{ ziel: 'medien-import', elementId }` – gerufen von M7-06 über M7-69,
 * sobald ein Import-Auftrag ERFOLGREICH beendet ist. Total: wirft nie.
 */
export async function schliesseMedienImportAb(
  u: UebergabeUmgebung,
  neueAssetId: string,
): Promise<void> {
  const lage = u.halter.holeLage()
  // Schritt 1: Läuft KEINE Uebergabe (Import aus der Medien-Bibliothek, M7-35) oder
  // läuft eine mit einem ANDEREN Ziel: NICHTS - kein Aufruf, keine Meldung, keine
  // Lageänderung. Ein Bibliotheks-Import darf NIE ein Listenelement umsetzen.
  if (lage.laufendeUebergabe === null || lage.laufendeUebergabe.ziel !== 'medien-import') {
    return
  }

  const elementId = lage.laufendeUebergabe.elementId

  let antwort: Ergebnis<FixWirkung>
  try {
    antwort = await u.schliesseMediumFixAb(elementId, neueAssetId)
  } catch (ursache) {
    // Fehlerpfade: hier gefangen, 'unbekannter_fehler' gemeldet, Übergabe beendet.
    u.meldeFehler('unbekannter_fehler', ursache instanceof Error ? ursache.message : String(ursache))
    beendeLaufende(u)
    return
  }

  if (!antwort.ok) {
    // ENTSCHIEDEN 9 mit der EINEN Ausnahme des Imports: Es gibt keine offene Auswahl,
    // die stehen bleiben könnte - der Dialog ist bereits zu, der Import gelaufen.
    // Beenden, die Stelle bleibt kaputt und zeigt sich weiter; erneut ansteuerbar.
    u.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
    beendeLaufende(u)
    return
  }

  // Dieselbe Stelle, an der auch die beiden Auswahl-Overlays enden: Stand neu
  // gerechnet UND Uebergabe beendet.
  schliesseFixAb(u, antwort.wert)
}

/** Übernimmt einen vom `composer` gemeldeten Stand (M7-68 `meldeReparaturStand`). */
export function meldeStand(u: UebergabeUmgebung, stand: ReparaturStand): void {
  // Kein Reiterwechsel, kein Beenden, keine eigene Rechnung - auch der ERSTE Stand
  // läuft durch uebernimmStand, weil stand.aktiv den geführten Modus trägt
  // (M7-08, ENTSCHIEDEN 8).
  u.halter.setzeLage(uebernimmStand(u.halter.holeLage(), stand))
}
