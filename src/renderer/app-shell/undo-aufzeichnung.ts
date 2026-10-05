// Issue #243 - undo-aufzeichnung.ts (FA-21 / TK 9.13.2).
//
// Der Ausloeser fuer den Undo-Schnappschuss der Projekt-Bearbeitung. Der
// Stapel (#233), die Historien (#234) und der Rueckschreib-Weg (#235) stehen;
// hier entsteht der Anruf. Er sitzt in der HUELLE um die gemeinsame
// Projekt-Sicht (#197) - nicht in den M5-Dateien (deren Verbote bleiben).
// Ein Beobachter käme nach der Aenderung und haette den alten Stand nicht.
//
// Die Optimistik-Falle (TK 9.7.3): Bei einer abgelehnten Operation lege eine
// naive Huelle ZWEI Schnappschuesse ab, und der erste Rueckgaengig-Druck
// bräche den ABGELEHNTEN Stand - den dann das Auto-Speichern schreiben
// koennte. Gegenmassnahme: Regel R1 (Ruecknahme) und R2 (Doppelt), beide
// REIN in entscheideAufzeichnung.
//
// Kein Bau eines Schnappshusses HIER: merkeVorAenderung (#235) baut ihn
// selbst. Ein zweiter Koerper waere die Falle aus TK 9.5.2 (assets im
// Schnappschuss = Datenverlust). Kein leereProjektHistorie: #252/#224 rufen
// es, und #235 wacht den fremdKennung-Fall strukturell ab.

import { merkeVorAenderung, type ProjektUndoZugang } from './undo-projekt'
import { projektHistorie, type ProjektStand } from './undo-historien'
import type { ProjektZugang } from './sichten'
import type { Bearbeitungsstand, Listenelement, Project } from '../../shared/contracts/project'

/** Warum die Huelle einen Schnappschuss abgelegt hat - oder warum nicht. */
export type Aufzeichnungsentscheidung =
  | 'ablegen'
  | 'ohne_wirkung'
  | 'ruecknahme'
  | 'doppelt'
  | 'projektwechsel'

/** Flache Gleichheit: gleiche Laenge, Element fuer Element `===`. Wirft nie. */
export function standGleich(a: Bearbeitungsstand, b: Bearbeitungsstand): boolean {
  if (a.aktionen.length !== b.aktionen.length) return false
  if (a.liste.length !== b.liste.length) return false
  for (let stelle = 0; stelle < a.aktionen.length; stelle += 1) {
    if (a.aktionen[stelle] !== b.aktionen[stelle]) return false
  }
  for (let stelle = 0; stelle < a.liste.length; stelle += 1) {
    if (a.liste[stelle] !== b.liste[stelle]) return false
  }
  return true
}

/** Die Entscheidungslogik - REIN: Reihenfolge 1-5 ist Vertrag. Wirft nie. */
export function entscheideAufzeichnung(
  jetzt: ProjektStand,
  eingehend: ProjektStand,
  oberster: ProjektStand | null,
): Aufzeichnungsentscheidung {
  // 1: ein anderes Projekt (auch bei selbigem Stand).
  if (eingehend.projektId !== jetzt.projektId) return 'projektwechsel'
  // 2: derselbe Stand.
  if (standGleich(eingehend.stand, jetzt.stand)) return 'ohne_wirkung'
  // 3/4: NUR bei derselben projektId - ein fremder Schnappschuss gilt nie
  // als Ruecknahme oder Doppel.
  if (oberster !== null && oberster.projektId === jetzt.projektId) {
    if (standGleich(eingehend.stand, oberster.stand)) return 'ruecknahme'
    if (standGleich(jetzt.stand, oberster.stand)) return 'doppelt'
  }
  // 5
  return 'ablegen'
}

// Die EINE Zuordnungstabelle (ENTSCHIEDEN 6/7): Huelle -> roher Zugang und
// roher Zugang -> Huelle (ENTSCHIEDEN 7: mehrfaches Umhuellen liefert
// DIESELBE Huelle - geregelt in BEIDEN Richtungen).
const huelleZuRoher = new WeakMap<ProjektZugang, ProjektZugang>()
const rohZuHuelle = new WeakMap<ProjektZugang, ProjektZugang>()

/** Der geladene Zweig von Projektsicht.projekt (Nicht-null). */
type GeladenesProjekt = Exclude<ReturnType<ProjektZugang['hole']>['projekt'], null>

/**
 * Umhuellt den Zugang aus #197 fuer die BEARBEITENDEN Module (composer, action-editor).
 * Liefert ein NEUES Objekt; der uebergebene Zugang bleibt unveraendert.
 * Mehrfaches Umhuellen liefert dieselbe Huelle (ENTSCHIEDEN 7).
 */
export function umhuelleFuerBearbeitung(zugang: ProjektZugang): ProjektZugang {
  // Bereits umhuellt: dieselbe zurueck (keine zweite Ebene).
  const schon = rohZuHuelle.get(zugang)
  if (schon !== undefined) return schon
  if (huelleZuRoher.has(zugang)) return zugang

  const huelle: ProjektZugang = {
    // lade/gleicheElementAb/leere: KEIN Schnappschuss - Laden kein Schritt,
    // gleicheElementAb nur Abgleich (TK 9.7.4), leere() wie lade() (TK v3.2).
    lade: (projektId) => zugang.lade(projektId),
    hole: () => zugang.hole(),
    setzeListe: (liste: Listenelement[]) => {
      legeSchnappschussWennNotig(zugang, (jetzt: GeladenesProjekt) => ({
        projektId: jetzt.id,
        stand: {
          aktionen: jetzt.aktionen,
          liste,
          standardSegmentdauer: jetzt.standardSegmentdauer,
        },
      }))
      zugang.setzeListe(liste)
    },
    setzeProjekt: (projekt: Project) => {
      legeSchnappschussWennNotig(zugang, () => ({
        projektId: projekt.id,
        stand: {
          aktionen: projekt.aktionen,
          liste: projekt.liste,
          standardSegmentdauer: projekt.standardSegmentdauer,
        },
      }))
      zugang.setzeProjekt(projekt)
    },
    gleicheElementAb: (element) => zugang.gleicheElementAb(element),
    leere: () => zugang.leere(),
    aufGeaendert: (hoerer) => zugang.aufGeaendert(hoerer),
  }

  huelleZuRoher.set(huelle, zugang)
  rohZuHuelle.set(zugang, huelle)
  return huelle
}

/** Der 6-Schritte-Ablauf der Huelle (nur 'ablegen' legt tatsaechlich ab). */
function legeSchnappschussWennNotig(
  roh: ProjektZugang,
  baueEingehend: (jetzt: GeladenesProjekt) => ProjektStand,
): void {
  // 1: ohne geladenes Projekt sofort delegieren.
  const projekt: GeladenesProjekt | null = roh.hole().projekt
  if (projekt === null) return
  // 2: der JETZIGE Stand (nur zum Vergleichen).
  const jetzt: ProjektStand = {
    projektId: projekt.id,
    stand: {
      aktionen: projekt.aktionen,
      liste: projekt.liste,
      standardSegmentdauer: projekt.standardSegmentdauer,
    },
  }
  // 3: der EINGEHENDE Stand.
  const eingehend = baueEingehend(projekt)
  // 4: stapelneutrale Vorschau (#233).
  const oberster = projektHistorie().vorschauZurueck()
  // 5: NUR bei 'ablegen' - dazu mit dem ROHEN Zugang (#235), damit
  // Rueckgaengig sich nie selbst aufzeichnen kann. 5 vor 6, denn
  // merkeVorAenderung liest holeProjekt.
  if (entscheideAufzeichnung(jetzt, eingehend, oberster) === 'ablegen') {
    merkeVorAenderung(baueUndoZugang(roh))
  }
  // 6: die Delegation folgt in der Huelle nach diesem Aufruf.
}

/**
 * Liefert den ROHEN Zugang zu einer Huelle (roh -> selbst).
 */
export function ohneAufzeichnung(zugang: ProjektZugang): ProjektZugang {
  return huelleZuRoher.get(zugang) ?? zugang
}

/**
 * Baut den Zugang zu #235 - IMMER aus dem ROHEN Zugang, damit Rueckgaengig
 * sich selbst nicht aufzeichnen kann (ENTSCHIEDEN 3).
 */
export function baueUndoZugang(zugang: ProjektZugang): ProjektUndoZugang {
  const roh = ohneAufzeichnung(zugang)
  // setzeProjekt DIREKT als Referenz (nicht als Pfeilfn) - der DoD verlangt
  // die toBe-gleiche Funktion: Rueckgaengig schreibt mit DEMSELBEN
  // Funktionswert und laeuft dadurch nie durch die Huelle.
  return {
    holeProjekt: () => roh.hole().projekt,
    setzeProjekt: roh.setzeProjekt,
  }
}
