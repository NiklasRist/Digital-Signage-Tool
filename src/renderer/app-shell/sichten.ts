// [app-shell] Die gemeinsamen Sichten einmal aufbauen und durchreichen

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { type MarkenZugang, baueMarkenZugang } from './marken-zugang'
import {
  type Projektsicht,
  ladeProjekt, holeSicht, setzeProjekt, setzeListe, gleicheElementAb, aufSichtGeaendert,
  leereProjektSicht,
} from '../composer/projektzustand'
import {
  type Zeichenvoraussetzungen,
  bereiteZeichnenVor, verwirfMotivBestand,
} from '../composer/zeichen-vorbereitung'
import {
  type VorlagenUebersicht,
  ladeUebersicht, holeUebersicht, aufUebersichtGeaendert,
} from '../vorlagen-editor/vorlagen-uebersicht'

/** Zugang zur gemeinsamen Projekt-Sicht (#121). Reine Weiterreichung, keine eigene Logik. */
export interface ProjektZugang {
  lade: (projektId: string) => Promise<Ergebnis<Project>>
  hole: () => Projektsicht
  setzeProjekt: (projekt: Project) => void
  setzeListe: (liste: Listenelement[]) => void
  gleicheElementAb: (element: Listenelement) => void
  /** Setzt die Sicht auf „kein Projekt geladen" zurück (TK 9.7.4). Kein Ersatzprojekt. */
  leere: () => void
  aufGeaendert: (hoerer: (sicht: Projektsicht) => void) => () => void
}

/** Zugang zur gemeinsamen Vorlagen-Sicht (#155). */
export interface VorlagenZugang {
  lade: () => Promise<Ergebnis<VorlagenUebersicht, string>>
  hole: () => VorlagenUebersicht | null
  aufGeaendert: (hoerer: (uebersicht: VorlagenUebersicht) => void) => () => void
}

/** Zugang zu den Zeichenvoraussetzungen (#154) – ergänzt um den Halter des letzten Standes. */
export interface ZeichenZugang {
  /** Stellt die Voraussetzungen für DIESES Projekt her und merkt das Ergebnis. */
  bereiteVor: (projekt: Project) => Promise<Ergebnis<Zeichenvoraussetzungen, string>>
  /** Der zuletzt hergestellte Stand; null, solange nie erfolgreich vorbereitet wurde. */
  hole: () => Zeichenvoraussetzungen | null
  /** Verwirft den Motiv-Bestand UND den gemerkten Stand (hole() liefert danach null). */
  verwirfMotivBestand: () => void
}

export interface Sichten {
  projekt: ProjektZugang
  vorlagen: VorlagenZugang
  zeichnen: ZeichenZugang
  /** Zugang zum app-weiten Marken-Bestand (#305). ERSETZT das frühere Feld `marke: Marke`. */
  marken: MarkenZugang
}

/** Re-Export, damit `inhalte-zugaenge.ts` weiterhin GENAU EINE Bezugsquelle für die
 *  Zugangs-Typen hat (#197, ENTSCHIEDEN 1). */
export type { MarkenZugang }

/**
 * Baut die gemeinsamen Sichten EINMAL auf. Liefert entweder vollständige Sichten oder einen
 * benannten Fehler – NIE eine halb gefüllte Struktur.
 */
export async function baueSichten(): Promise<Ergebnis<Sichten, string>> {
  // Schritt 1 - der Marken-Bestand (#305), an derselben Position wie früher die
  // eine Marke (#197): Er gehört zur Zeichenvorbereitung und zum Editor-Aufbau.
  // Fehlt er, gibt es keine nutzbare Kette - abbrechen, bevor etwas Halbes entsteht.
  // Der Aufruf von `config:leseMarke` ist gestrichen, nicht umgebogen (TK 9.5.6:
  // `leseMarke` ist aus der Operationstabelle entfallen).
  const markenZugangErgebnis = await baueMarkenZugang()
  if (!markenZugangErgebnis.ok) {
    return { ok: false, fehler: { code: markenZugangErgebnis.fehler.code, meldung: markenZugangErgebnis.fehler.meldung } }
  }

  // Die Projekt-Sicht ist ein WERT-Modul (#121): Die Setz-Funktionen reisen als
  // PARAMETER durchgereicht - die Hülle dafür ist der ProjektZugang selbst.
  const projektZugang: ProjektZugang = {
    lade: ladeProjekt,
    hole: holeSicht,
    setzeProjekt,
    setzeListe,
    gleicheElementAb,
    leere: leereProjektSicht,
    aufGeaendert: aufSichtGeaendert,
  }

  // Die Vorlagen-Sicht (#155): einmal laden; das Erstladen gehört zum Aufbau der
  // Sichten, danach liefert sie der Abo-Weg. Fehlt die Übersicht, sind Band-Vorlagen
  // im composer wie im vorlagen-editor nicht bedienbar - abbrechen.
  const uebersicht = await ladeUebersicht()
  if (!uebersicht.ok) {
    return { ok: false, fehler: uebersicht.fehler }
  }

  const vorlagenZugang: VorlagenZugang = {
    lade: ladeUebersicht,
    hole: holeUebersicht,
    aufGeaendert: aufUebersichtGeaendert,
  }

  // Der Halter des letzten Zeichnen-Standes lebt HIER (deshalb sagt der
  // Interface-Kommentar "ergänzt um den Halter"): Bereite merkt den Stand, Hole
  // reicht ihn durch, Verwerfen setzt ihn auf null und ruft die Verwerf-Regel
  // der Motiv-Ansicht (#154).
  zeichenStand = null
  const zeichenZugang: ZeichenZugang = {
    bereiteVor: async (projekt: Project) => {
      const ergebnis = await bereiteZeichnenVor(projekt)
      zeichenStand = ergebnis.ok ? ergebnis.wert : null
      return ergebnis
    },
    hole: () => zeichenStand,
    verwirfMotivBestand: () => {
      verwirfMotivBestand()
      zeichenStand = null
    },
  }

  const sichten: Sichten = {
    projekt: projektZugang,
    vorlagen: vorlagenZugang,
    zeichnen: zeichenZugang,
    marken: markenZugangErgebnis.wert,
  }

  zuletztGebaut = sichten

  return { ok: true, wert: sichten }
}

/** Der zuletzt gebaute Stand; null, solange baueSichten noch nichts erfolgreich lief. */
let zuletztGebaut: Sichten | null = null
let zeichenStand: Zeichenvoraussetzungen | null = null

/** Die zuletzt gebauten Sichten; null, solange baueSichten nicht erfolgreich war. */
export function holeSichten(): Sichten | null {
  return zuletztGebaut
}
