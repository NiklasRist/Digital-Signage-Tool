// GENERIERT aus dem Signaturblock von Issue #155.
// [vorlagen-editor] Vorlagen-Übersicht
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
// GERUEST-PRUEFSUMME: c791416ee7cd9d93
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, VorlagenArt } from '../../shared/contracts/vorlage'
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

/** Die Kombinationen aus `art` und `höhe`, die der Main heute anlegen kann (s. STOPP). */
export const ANLEGBARE_ARTEN: ReadonlyArray<{ art: VorlagenArt; höhe: number | null }> = [
  { art: 'vollflaeche', höhe: null },
  { art: 'split', höhe: 162 },
] as const;

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
  art: VorlagenArt,
  höhe: number | null,
  name: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  // Prüfung ob (art, höhe) in ANLEGBARE_ARTEN steht
  const istAnlegbar = ANLEGBARE_ARTEN.some((a) => a.art === art && a.höhe === höhe)
  if (!istAnlegbar) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: `Nicht anlegbare Kombination: art=${art}, höhe=${höhe}` } }
  }

  // Prüfung name nicht leer nach trim()
  const getrimmterName = name.trim()
  if (getrimmterName === '') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Name darf nicht leer sein' } }
  }

  const ergebnis = await rufeAuf<Vorlage>(
    KANAELE.vorlagen.erstelleVorlage,
    { art, höhe, name: getrimmterName },
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

/** „Fortsetzen": setzt die Bearbeitung über den PARENT der Arbeitskopie fort. */
export async function setzeBearbeitungFort(
  arbeitskopie: Vorlage,
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
