// [vorlagen-editor] Vorlagen-Übersicht

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { starteBearbeitung, type EditorSitzung } from './arbeitskopie'
import {
  holeNutzung, LEERER_NUTZUNGSSTAND, beginneLaden, uebernimmNutzung, uebernimmFehler, giltFuer,
  type Nutzungsstand,
} from './nutzung-anzeigen'

// Zustandsverwaltung
let aktuelleUebersicht: VorlagenUebersicht | null = null
let loeschNutzungsstand: Nutzungsstand = LEERER_NUTZUNGSSTAND
const uebersichtHoerer: Array<(u: VorlagenUebersicht) => void> = []
const loeschNutzungHoerer: Array<(stand: Nutzungsstand) => void> = []

/** Eine nutzbare Vorlage mit allem, was die Übersicht über sie anzeigt. */
export interface UebersichtsEintrag {
  vorlage: Vorlage                  // parent === null
  eingebaut: boolean                // === vorlage.eingebaut; eingebaute sind unlöschbar
  arbeitskopieId: string | null     // id der laufenden Arbeitskopie, sonst null
  loeschbar: boolean                // === !vorlage.eingebaut
}

export interface VorlagenUebersicht {
  nutzbare: readonly UebersichtsEintrag[]
  /** Arbeitskopien, deren `parent` auf keine nutzbare Vorlage zeigt (s. „ENTSCHIEDEN" 5). */
  verwaisteArbeitskopien: readonly Vorlage[]
}

/**
 * Die beiden FLAECHEN, die der Nutzer anlegen kann - mehr gibt es seit v3.31 nicht.
 *
 * Die Fläche IST die Art (TK 9.11.1 Punkt 0): `höhe === null` heisst Ganzbild (1920 x 1080),
 * die Zahl 162 heisst Band (1920 x 162). Die Bandhöhe ist fest (Entscheidung 23.10.2026);
 * es gibt kein Höhenfeld, andere Höhen bietet die Oberfläche nicht an. Der Store führt den
 * allgemeinen Wertebereich weiter als Datenregel - hier steht, was der Nutzer wählen kann.
 *
 * BESCHRIFTUNG: „Ganzbild (1920 × 1080)" und „Band (1920 × 162)" - keine Kunstbegriffe.
 * Der Vorschlag aus #453 („Nicht selbst entscheiden") ist am **30.10.2026 vom Auftraggeber
 * bestaetigt** worden; damit ist der letzte offene Punkt des Issues entschieden.
 */
export const ANLEGBARE_FLAECHEN: ReadonlyArray<{ höhe: number | null; bezeichnung: string }> = [
  { höhe: null, bezeichnung: 'Ganzbild (1920 × 1080)' },
  { höhe: 162, bezeichnung: 'Band (1920 × 162)' },
] as const;

/** Ist diese Höhe eine der beiden anlegbaren Flächen? Rein, ohne Seiteneffekt. */
export function istAnlegbareFlaeche(höhe: number | null): boolean {
  return ANLEGBARE_FLAECHEN.some((flaeche) => flaeche.höhe === höhe)
}

/** Lädt beide Listen und macht sie zur gemeinsamen Vorlagen-Sicht. */
export async function ladeUebersicht(): Promise<Ergebnis<VorlagenUebersicht, string>> {
  const ergebnis1 = await rufeAuf<Vorlage[]>(
    KANAELE.vorlagen.listeVorlagen,
  )
  if ('fehler' in ergebnis1) {
    return ergebnis1
  }
  const nutzbareVorlagen = ergebnis1.wert

  const ergebnis2 = await rufeAuf<Vorlage[]>(
    KANAELE.vorlagen.listeArbeitskopien,
  )
  if ('fehler' in ergebnis2) {
    return ergebnis2
  }
  const arbeitskopien = ergebnis2.wert

  // Nutzbare Einträge zusammenbauen
  const nutzbare: UebersichtsEintrag[] = nutzbareVorlagen.map((v) => ({
    vorlage: v,
    eingebaut: v.eingebaut,
    arbeitskopieId: arbeitskopien.find((ak) => ak.parent === v.id)?.id ?? null,
    loeschbar: !v.eingebaut,
  }))

  // Verwaiste Arbeitskopien finden (parent zeigt auf keine nutzbare Vorlage)
  const nutzbareIds = new Set(nutzbareVorlagen.map((v) => v.id))
  const verwaisteArbeitskopien: Vorlage[] = arbeitskopien.filter(
    (ak) => ak.parent !== null && !nutzbareIds.has(ak.parent),
  )

  aktuelleUebersicht = { nutzbare, verwaisteArbeitskopien }

  // Alle Hörer benachrichtigen
  const uebersicht = aktuelleUebersicht
  if (uebersicht) {
    uebersichtHoerer.forEach((hoerer) => hoerer(uebersicht))
  }

  return { ok: true, wert: aktuelleUebersicht }
}

/** Momentaufnahme der Sicht; null, solange nie geladen wurde. Wird NIE verändert. */
export function holeUebersicht(): VorlagenUebersicht | null {
  return aktuelleUebersicht
}

/** Abonnement für Änderungen der Sicht; Rückgabewert ist die Abmelde-Funktion. */
export function aufUebersichtGeaendert(hoerer: (u: VorlagenUebersicht) => void): () => void {
  if (!aktuelleUebersicht) {
    aktuelleUebersicht = { nutzbare: [], verwaisteArbeitskopien: [] }
  }
  uebersichtHoerer.push(hoerer)
  return () => {
    const index = uebersichtHoerer.indexOf(hoerer)
    if (index !== -1) {
      uebersichtHoerer.splice(index, 1)
    }
  }
}

/** „Neu anlegen": erstellt die Vorlage und öffnet sie sofort zur Bearbeitung. */
export async function legeVorlageAn(
  höhe: number | null,
  name: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  // Nur die beiden anlegbaren Flaechen; alles andere ist ein Programmierfehler im Aufrufer.
  if (!istAnlegbareFlaeche(höhe)) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: `Nicht anlegbare Fläche: höhe=${String(höhe)}` } }
  }

  // Prüfung name nicht leer nach trim()
  const getrimmterName = name.trim()
  if (getrimmterName === '') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Name darf nicht leer sein' } }
  }

  const ergebnis = await rufeAuf<Vorlage>(
    KANAELE.vorlagen.erstelleVorlage,
    { höhe, name: getrimmterName },
  )
  if ('fehler' in ergebnis) {
    return ergebnis
  }

  // Startet sofort die Bearbeitung mit der neuen Vorlage
  return starteBearbeitung(ergebnis.wert.id)
}

/** „Bearbeiten": öffnet eine NUTZBARE Vorlage (parent === null). */
export async function bearbeiteVorlage(
  vorlagenId: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  if (vorlagenId === '') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Vorlagen-ID darf nicht leer sein' } }
  }

  return starteBearbeitung(vorlagenId)
}

/** „Fortsetzen": setzt die Bearbeitung über den PARENT der Arbeitskopie fort.
 *  Gelesen wird NUR `parent` - der Parameter verlangt deshalb auch nur dieses Feld
 *  (`Pick`), damit kein Aufrufer einen ganzen Datensatz vortaeuschen muss (#448). */
export async function setzeBearbeitungFort(
  arbeitskopie: Pick<Vorlage, 'parent'>,
): Promise<Ergebnis<EditorSitzung, string>> {
  if (arbeitskopie.parent === null) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Ist keine Arbeitskopie (parent === null)' } }
  }

  return starteBearbeitung(arbeitskopie.parent)
}

/**
 * „Löschen", SCHRITT 1 (TK 9.12.2): holt die Nutzung der Vorlage ueber `holeNutzung` (M7-62) und
 * legt sie im Loesch-Nutzungsstand ab, DAMIT die Oberflaeche sie anzeigt, BEVOR geloescht wird.
 * REIN LESEND: es wird NICHTS geloescht, NICHTS geaendert, KEIN Auftrag eingereiht.
 * Total: wirft nie; ein Fehler landet als `zustand: 'fehler'` im Stand (s. ENTSCHIEDEN 8).
 */
export async function starteLoeschbestaetigung(vorlagenId: string): Promise<void> {
  // Prüfung: Stand bereits geladen für dieselbe Vorlage?
  if (giltFuer(loeschNutzungsstand, vorlagenId) && loeschNutzungsstand.zustand === 'geladen') {
    return
  }

  // Neuen Stand initialisieren und Hörer benachrichtigen
  loeschNutzungsstand = beginneLaden(loeschNutzungsstand, vorlagenId)
  loeschNutzungHoerer.forEach((hoerer) => hoerer(loeschNutzungsstand))

  // Nutzung holen
  const ergebnis = await holeNutzung(vorlagenId)

  if (ergebnis.ok === true) {
    loeschNutzungsstand = uebernimmNutzung(loeschNutzungsstand, vorlagenId, ergebnis.wert)
  } else {
    loeschNutzungsstand = uebernimmFehler(loeschNutzungsstand, vorlagenId, ergebnis.fehler.code, ergebnis.fehler.meldung)
  }

  loeschNutzungHoerer.forEach((hoerer) => hoerer(loeschNutzungsstand))
}

/** Momentaufnahme des Loesch-Nutzungsstandes. Der zurueckgegebene Wert wird NIE veraendert. */
export function holeLoeschNutzung(): Nutzungsstand {
  return loeschNutzungsstand
}

/** Abonnement fuer Aenderungen des Loesch-Nutzungsstandes; Rueckgabe ist die Abmelde-Funktion. */
export function aufLoeschNutzungGeaendert(hoerer: (stand: Nutzungsstand) => void): () => void {
  loeschNutzungHoerer.push(hoerer)
  return () => {
    const index = loeschNutzungHoerer.indexOf(hoerer)
    if (index !== -1) {
      loeschNutzungHoerer.splice(index, 1)
    }
  }
}

/**
 * Beendet die Loesch-Bestaetigung – bei Abbruch WIE nach dem Loeschen. Setzt den Stand auf
 * `LEERER_NUTZUNGSSTAND` zurueck. Ohne laufende Bestaetigung wirkungslos; wirft nie.
 */
export function beendeLoeschbestaetigung(): void {
  loeschNutzungsstand = LEERER_NUTZUNGSSTAND
  loeschNutzungHoerer.forEach((hoerer) => hoerer(loeschNutzungsstand))
}

/**
 * „Löschen", SCHRITT 2: nur für eigene Vorlagen. Scheitert die Löschung an Referenzen, trägt der
 * Fehler unter `daten` die vollständige `Vorlagennutzung` – die Oberfläche zeigt beide
 * Trefferlisten. Diese Funktion holt die Nutzung NICHT selbst (das tut Schritt 1) und prüft NICHT,
 * ob Schritt 1 gelaufen ist (s. ENTSCHIEDEN 8).
 */
export async function entferneVorlage(
  vorlagenId: string,
): Promise<Ergebnis<void, string>> {
  // Eingebaute Vorlagen sind eingefroren (TK 9.11.1.1). Der Store weist sie ohnehin ab - ist der
  // Zustand aber schon geladen, weiß die Übersicht es vorher, und ein IPC-Aufruf, dessen Ausgang
  // feststeht, ist unnötig (#155, DoD). Ohne geladene Übersicht entscheidet weiterhin der Main.
  const bekannt = aktuelleUebersicht?.nutzbare.find(
    (eintrag) => eintrag.vorlage.id === vorlagenId,
  )
  if (bekannt?.eingebaut === true) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Die Vorlage "${vorlagenId}" ist eingebaut und kann nicht geloescht werden.`,
      },
    }
  }
  // Es gibt keine Vorprüfung auf die Arbeitskopie hier, weil die Sperre im vorlagen-store sitzt
  const ergebnis = await rufeAuf<void>(
    KANAELE.vorlagen.löscheVorlage,
    { id: vorlagenId },
  )

  if ('fehler' in ergebnis) {
    return ergebnis
  }

  return { ok: true, wert: undefined }
}
