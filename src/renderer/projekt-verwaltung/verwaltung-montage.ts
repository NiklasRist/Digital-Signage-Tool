// Die reine Zusammensetz-Logik der Projektverwaltung (#252 / M7-59).
//
// Hier sitzt die gesamte Fachlichkeit dieses Issues: der Dialog-Zustand und der
// Bau der drei Wirkungs-Buendel fuer #224 (Anlegen/Öffnen), #225 (Duplizieren)
// und #226 (Loeschen). ALLE FELDER werden belegt - kein optionaler Schlitz, keine
// leere Funktion: Ein vergesseness Feld sieht nicht wie ein Fehler aus, es sieht
// wie "funktioniert einfach nicht" (verworfert der Motiv-Bestand -> falsche Bilder;
// geleerte Historie vergessen -> Undo schreibt das ALTE Projekt in das NEUE).
//
// REGLN (alle verbindlich):
//  - REIN: kein JSX, kein react, kein IPC, kein Dateisystem, kein throw. Die
//    Funktionen rufen NICHTS auf - sie legen zusammen (jede Verdrahtung toBe).
//  - Der Projektzugang bleibt der ROHE (#244): Kein umhuelleFuerBearbeitung -
//    ein Projektwechsel ist kein Bearbeitungsschritt, ein Schnappschuss davon
//    zeigte auf ein anderes Projekt.
//  - immer nur EIN Dialog offen (ENTSCHIEDEN 5); ein Dialog auf einem Eintrag,
//    den es nicht mehr gibt, schliesst sich (gleicheDialogAb, ENTSCHIEDEN 6).
//  - Der Fehlercode reist als string (keine zweite Deklaration der Main-Unionen).

import type { Project } from '../../shared/contracts/project'
import type { ProjektZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ProjektMeta } from './liste'
import type { ProjektWechselWirkungen } from './anlegen-oeffnen'
import type { DuplizierWirkungen } from './duplizieren'
import type { LoeschWirkungen } from './loeschen'
import type { StandardmarkenWirkungen } from './standardmarke'

/** Welcher Dialog gerade offen ist. Ein WERT – keine Funktion mutiert ihn. */
export type VerwaltungsDialog =
  | { art: 'keiner' }
  | { art: 'anlegen' }
  | { art: 'duplizieren'; meta: ProjektMeta }
  | { art: 'loeschen'; meta: ProjektMeta }

export const KEIN_DIALOG: VerwaltungsDialog = Object.freeze({ art: 'keiner' }) as VerwaltungsDialog

export function oeffneAnlegen(): VerwaltungsDialog {
  return { art: 'anlegen' }
}

export function oeffneDuplizieren(meta: ProjektMeta): VerwaltungsDialog {
  return { art: 'duplizieren', meta }
}

export function oeffneLoeschen(meta: ProjektMeta): VerwaltungsDialog {
  return { art: 'loeschen', meta }
}

export function schliesseDialog(): VerwaltungsDialog {
  return { art: 'keiner' }
}

/** Bezieht sich der offene Dialog auf einen Eintrag, den es nicht mehr gibt, wird er geschlossen.
 *  'keiner' und 'anlegen' bleiben immer unberuehrt. Total: wirft nie. */
export function gleicheDialogAb(
  dialog: VerwaltungsDialog,
  eintraege: readonly ProjektMeta[],
): VerwaltungsDialog {
  if (dialog.art === 'duplizieren' || dialog.art === 'loeschen') {
    const vorhanden = eintraege.some((eintrag) => eintrag.id === dialog.meta.id)
    return vorhanden ? dialog : { art: 'keiner' }
  }
  return dialog
}

/** Alles, was die Wurzel von aussen bekommt und selbst nicht besitzt. Sie baut daraus die drei
 *  Wirkungs-Buendel – und nur daraus. */
export interface VerwaltungsUmgebung {
  /** Der ROHE Projektzugang (#243/#244): ein Projektwechsel ist kein Bearbeitungsschritt. */
  projekt: ProjektZugang
  /** Die Zeichenvoraussetzungen (#154, ueber #197). */
  zeichnen: ZeichenZugang
  /** Leert die Undo-Historie der Projekt-Bearbeitung (TK 9.13.2). Kommt aus #233/#234. */
  leereProjektHistorie: () => void
  /** Wechselt in den Reiter Zusammenstellen (TK 9.14.3). Kommt aus #194, ueber die Shell. */
  wechsleZuZusammenstellen: () => void
  /** Laedt die Projektliste neu (#222). */
  aktualisiereProjektliste: () => Promise<unknown>
  /** Meldeweg fuer Fehler. Die Wurzel zeigt sie an; die drei Bausteine tun es nicht. */
  meldeFehler: (code: string, meldung: string) => void
}

/** Baut das Buendel, das `legeProjektAn` und `oeffneProjekt` (#224) erwarten.
 *  ALLE SIEBEN Felder werden belegt – es gibt kein optionales. */
export function baueWechselWirkungen(u: VerwaltungsUmgebung): ProjektWechselWirkungen {
  return {
    ladeProjekt: u.projekt.lade,
    verwirfMotivBestand: u.zeichnen.verwirfMotivBestand,
    bereiteZeichnenVor: u.zeichnen.bereiteVor,
    leereProjektHistorie: u.leereProjektHistorie,
    wechsleZuZusammenstellen: u.wechsleZuZusammenstellen,
    aktualisiereProjektliste: u.aktualisiereProjektliste,
    meldeFehler: u.meldeFehler,
  }
}

/** Baut das Buendel, das `dupliziereProjekt` (#225) erwartet. */
export function baueDuplizierWirkungen(u: VerwaltungsUmgebung): DuplizierWirkungen {
  return {
    aktualisiereProjektliste: u.aktualisiereProjektliste,
  }
}

/** Baut das Buendel, das `loescheProjekt` (#226) erwartet. ALLE SECHS Felder werden belegt –
 *  `leereProjektSicht` ist seit TK v3.2 dabei und kommt aus `u.projekt.leere` (#197). */
export function baueLoeschWirkungen(u: VerwaltungsUmgebung): LoeschWirkungen {
  return {
    holeProjekt: () => u.projekt.hole().projekt,
    verwirfMotivBestand: u.zeichnen.verwirfMotivBestand,
    leereProjektHistorie: u.leereProjektHistorie,
    leereProjektSicht: u.projekt.leere,
    aktualisiereProjektliste: u.aktualisiereProjektliste,
    meldeFehler: u.meldeFehler,
  }
}

/** Baut das Buendel, das `wechsleStandardmarke` (#324) erwartet. VIER Felder, unverndert.
 *  Nach NACHTRAG 23.08. in #324 (User-Entscheidung Variante (a)) schreitet die
 *  ZEICHEN-Vorbereitung NACH einem erfolgreichen Wechsel am GELADENEN Projekt hier aus:
 *  die WIrkingstream uebernimmProjekt ist das ORT darauf (sie wird ausschliesslich beim
 *  geladenen Projekt gerufen, gut #324); DIESER Bauplatz des Buendels schliesst sie an. */
export function baueStandardmarkenWirkungen(u: VerwaltungsUmgebung): StandardmarkenWirkungen {
  return {
    holeProjekt: () => u.projekt.hole().projekt,
    uebernimmProjekt: (projekt: Project) => {
      u.projekt.setzeProjekt(projekt)
      // NACHTRAG #324 (Variante (a)): die Zeichenvoraussetzungen des GELADENEN
      // Projekts sind mit der neuen Rahmen-Marke zu ermitteln - der Motiv-Bestand
      // wird verworfen und neu vorbereitet (ueber die bestehenden zwei Wege,
      // KEIN fuenftes Feld am Buendel).
      u.zeichnen.verwirfMotivBestand()
      void u.zeichnen.bereiteVor(projekt).then((ergebnis) => {
        if (!ergebnis.ok) u.meldeFehler(ergebnis.fehler.code, ergebnis.fehler.meldung)
      })
    },
    aktualisiereProjektliste: u.aktualisiereProjektliste,
    meldeFehler: u.meldeFehler,
  }
}

/** Die Kennung des gerade geladenen Projekts; null, wenn keins offen ist. */
export function offenesProjektId(projekt: Project | null): string | null {
  return projekt === null ? null : projekt.id
}
