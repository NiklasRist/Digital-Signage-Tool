 
// GENERIERT aus dem Signaturblock von Issue #224.
// [projekt-verwaltung] Projekt anlegen und Projekt öffnen
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
// GERUEST-PRUEFSUMME: 836c246b83be9a75
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

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * Alles, worauf der Projektwechsel wirkt. Wird als Parameter übergeben (Entscheidung E1) –
 * diese Datei importiert KEINE Sicht, KEINEN Reiter-Zustand und KEINEN Undo-Stapel direkt.
 */
export interface ProjektWechselWirkungen {
  /** Lädt das Projekt und macht es zur gemeinsamen Sicht (#121, über #197). */
  ladeProjekt: (projektId: string) => Promise<Ergebnis<Project>>
  /** Verwirft den Motiv-Bestand UND den gemerkten Stand der Voraussetzungen (#154, über #197). */
  verwirfMotivBestand: () => void
  /** Stellt die Zeichenvoraussetzungen für DIESES Projekt her (#154, über #197). */
  bereiteZeichnenVor: (projekt: Project) => Promise<Ergebnis<Zeichenvoraussetzungen, string>>
  /** Leert die Undo-Historie der Projekt-Bearbeitung (TK 9.13.2). Kommt aus #233. */
  leereProjektHistorie: () => void
  /** Wechselt in den Reiter Zusammenstellen (TK 9.14.3). Die Shell weiß, welcher das ist –
   *  diese Datei kennt den Typ `ReiterId` nicht (s. ENTSCHIEDEN 4). */
  wechsleZuZusammenstellen: () => void
  /** Lädt die Projektliste neu (#222). Nach dem Anlegen: der neue Eintrag fehlt sonst. */
  aktualisiereProjektliste: () => Promise<unknown>
  /** Meldeweg für Fehler, die NACH dem erfolgreichen Laden auftreten (Vorbereiten schlägt fehl).
   *  Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Frühe Rückmeldung auf den eingegebenen Namen. KEIN Ersatz für die Prüfung im Main. */
export type Namenspruefung = { ok: true; name: string } | { ok: false; grund: 'leer' }

/** Schneidet führende/folgende Leerzeichen ab und weist einen danach leeren Namen zurück. */
export function pruefeProjektname(eingabe: string): Namenspruefung {
  if (!(typeof eingabe === 'string')) return { ok: false, grund: 'leer' }
  const name = eingabe.trim()
  if (name === '') return { ok: false, grund: 'leer' }
  return { ok: true, name }
}

/**
 * Legt ein Projekt an und öffnet es anschließend über `oeffneProjekt` (s. Ablauf).
 * Liefert das GEÖFFNETE Projekt – nicht das vom Anlegen zurückgegebene.
 */
export async function legeProjektAn(
  eingabe: string,
  wirkungen: ProjektWechselWirkungen,
): Promise<Ergebnis<Project, string>> {
  const pruefung = pruefeProjektname(eingabe)
  if (!pruefung.ok) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Der Projektname darf nicht leer sein.' } }
  }

  const angelegt = await rufeAuf<Project>(KANAELE.project.erstelleProjekt, { name: pruefung.name })
  if (!angelegt.ok) {
    return { ok: false, fehler: { code: angelegt.fehler.code, meldung: angelegt.fehler.meldung } }
  }

  // Das Anlegen liefert das noch unbenetzte Projekt; GEFÜHLt wird erst durch das Öffnen
  // (Reconcile + Zeichenvorbereitung). Deshalb kommt hier das Öffnen mit der Kennung,
  // NICHT der zurückgegebene Wert in die Sicht.
  await wirkungen.aktualisiereProjektliste()
  return oeffneProjekt(angelegt.wert.id, wirkungen)
}

/**
 * Öffnet ein vorhandenes Projekt und stellt die Anwendung vollständig darauf um.
 * Die Schritte laufen in der festgelegten Reihenfolge; s. „Der Ablauf (verbindlich)".
 */
export async function oeffneProjekt(
  projektId: string,
  wirkungen: ProjektWechselWirkungen,
): Promise<Ergebnis<Project, string>> {
  // 1. Bestehende Motive weg BEVOR ein neues Projekt geladen wird: Der Bestand hängt an
  //    der media://-Auffindung, die mit dem Projekt birst.
  wirkungen.verwirfMotivBestand()

  // 2. UNDO-HISTORIE leeren (TK 9.13.2, "ein Projektwechsel leert die Historie").
  wirkungen.leereProjektHistorie()

  // 3. Projekt laden in die gemeinsame Sicht; eingepflegt durch #197/ProjektZugang.
  const geladen = await wirkungen.ladeProjekt(projektId)
  if (!geladen.ok) {
    return { ok: false, fehler: { code: geladen.fehler.code, meldung: geladen.fehler.meldung } }
  }

  // 4. Zeichenvoraussetzungen für DIESES Projekt: Nach erfolgreichem Laden, BEVOR ein
  //    Thumbnail/Vorschau/Render entsteht. Fehlende Vorbereitung ist KEIN Oeffnen-Fehler
  //    - die Anzeige; gemeldet über meldeFehler.
  const vorbereitet = await wirkungen.bereiteZeichnenVor(geladen.wert)
  if (!vorbereitet.ok) {
    wirkungen.meldeFehler(vorbereitet.fehler.code, vorbereitet.fehler.meldung)
  }

  // 5. In den Reiter Zusammenstellen wechseln (TK 9.14.3: nach dem Öffnen).
  wirkungen.wechsleZuZusammenstellen()

  return { ok: true, wert: geladen.wert }
}
