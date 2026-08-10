/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #197.
// [app-shell] Die gemeinsamen Sichten einmal aufbauen und durchreichen
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
// GERUEST-PRUEFSUMME: 5baeb5f7558e0d26
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

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
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
  /** Die Markenpalette – app-weit, read-only, einmal je Fenster gelesen. */
  marke: Marke
}

/**
 * Baut die gemeinsamen Sichten EINMAL auf. Liefert entweder vollständige Sichten oder einen
 * benannten Fehler – NIE eine halb gefüllte Struktur.
 */
export async function baueSichten(): Promise<Ergebnis<Sichten, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #197."
  );
}

/** Die zuletzt gebauten Sichten; null, solange baueSichten nicht erfolgreich war. */
export function holeSichten(): Sichten | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #197."
  );
}
