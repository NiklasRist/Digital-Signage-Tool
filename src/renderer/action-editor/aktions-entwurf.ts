// [action-editor] Der Entwurf als EINZIGE Wahrheit des Editors (04.11.2026)
//
// WARUM DIESE DATEI GIBT: Bis hierher schrieb der Editor im Modus „bestehend" JEDES Feld
// beim Verlassen in den Speicher (`speichereAktion`) - ein Undo-Schritt je Feld, ein
// IPC-Aufruf je Feld, und im Modus „neu" galt die entgegengesetzte Regel (nur „Anlegen"
// schreibt). Zwei Verhaltensmodelle in einem Fenster sind fuer den Nutzer nicht
// vorhersagbar. Seit dem Umbau gilt EINES: Alles, was im Editor steht, ist ein Entwurf;
// geschrieben wird beim Abschluss („Fertig"), beim Wechsel auf eine andere Aktion und
// beim Verlassen der Ansicht.
//
// WAS HIER STEHT: nur die beiden Entscheidungen, die man ohne Pruefung falsch macht -
//   - WELCHE Felder haben sich gegenueber dem gespeicherten Stand geaendert? (Leeres
//     Ergebnis heisst: nichts schreiben. Ein Schreibvorgang ohne Aenderung waere ein
//     Undo-Schritt fuer nichts.)
//   - Ist der NEUE Entwurf ueberhaupt etwas? (Ohne Titel gibt es nichts anzulegen -
//     Titel ist Pflicht, TK 9.8.4. Ein leerer Entwurf verschwindet still.)
//
// KEIN IPC, KEIN JSX, KEIN ZUSTAND: reine Ableitung, in `tests/unit/aktions-entwurf.spec.ts`
// ohne React geprueft.

import type { Aktion, AktionsInhalt } from '../../shared/contracts/aktion'
import { gleicheGestaltung } from '../../shared/gestaltung'

/** Der Entwurf ist der Aktionsinhalt ohne Kennung (dieselbe Form wie in `aktion-bearbeiten`). */
export type AktionsEntwurf = AktionsInhalt

/**
 * Die Felder, in denen sich der Entwurf vom GESPEICHERTEN Stand unterscheidet.
 * Ausgeschrieben statt ueber eine Schleife: eine Liste mit `keyof` verliert bei Zuweisungen
 * den Typ je Feld, und ein neues Feld in `AktionsInhalt` soll hier auffallen (der Compiler
 * meldet `gespeichert.feld` als unbekannt).
 */
export function unterschiede(
  entwurf: AktionsEntwurf,
  gespeichert: Aktion,
): Partial<AktionsEntwurf> {
  const aenderungen: Partial<AktionsEntwurf> = {}
  if (entwurf.titel !== gespeichert.titel) aenderungen.titel = entwurf.titel
  if (entwurf.beschreibung !== gespeichert.beschreibung) aenderungen.beschreibung = entwurf.beschreibung
  if (entwurf.preis !== gespeichert.preis) aenderungen.preis = entwurf.preis
  if (entwurf.bildRef !== gespeichert.bildRef) aenderungen.bildRef = entwurf.bildRef
  if (entwurf.cta !== gespeichert.cta) aenderungen.cta = entwurf.cta
  if (entwurf.standardDauer !== gespeichert.standardDauer) aenderungen.standardDauer = entwurf.standardDauer
  if (entwurf.vorlagenId !== gespeichert.vorlagenId) aenderungen.vorlagenId = entwurf.vorlagenId
  if (entwurf.markeId !== gespeichert.markeId) aenderungen.markeId = entwurf.markeId
  if (entwurf.akzentfarbe !== gespeichert.akzentfarbe) aenderungen.akzentfarbe = entwurf.akzentfarbe
  // SEIT 05.11.2026 (TK 9.8.8): Zwei VERSCACHTELTE Felder. Ein `!==` waere hier immer
  // wahr - das Objekt ist nach jedem Rendern eine neue Referenz - und damit erzeugte
  // jedes „Fertig" einen Schreibvorgang samt Undo-Schritt fuer nichts. Verglichen wird
  // deshalb der Inhalt (`gleicheGestaltung`, sortierte Schluessel).
  if (!gleicheGestaltung(entwurf.zonenGestaltung, gespeichert.zonenGestaltung)) {
    aenderungen.zonenGestaltung = entwurf.zonenGestaltung ?? {}
  }
  if (!gleicheGestaltung(entwurf.bildAusschnitt, gespeichert.bildAusschnitt)) {
    aenderungen.bildAusschnitt = entwurf.bildAusschnitt ?? null
  }
  // SEIT 09.11.2026 (TK 9.16.6): Effekte ebenso INHALTLICH vergleichen. Ein `!==` waere
  // immer wahr und erzeugte fuer jedes „Fertig" einen Schreibvorgang samt Undo-Schritt.
  if (!gleicheGestaltung(entwurf.effekte, gespeichert.effekte)) {
    aenderungen.effekte = entwurf.effekte ?? null
  }
  return aenderungen
}

/** Hat der Entwurf keine einzige Abweichung? Dann gibt es nichts zu schreiben. */
export function istUnveraendert(entwurf: AktionsEntwurf, gespeichert: Aktion): boolean {
  return Object.keys(unterschiede(entwurf, gespeichert)).length === 0
}

/**
 * Ist an einem NEUEN Entwurf etwas, das angelegt werden muesste? Der Titel entscheidet:
 * er ist Pflicht (TK 9.8.4), und ein Entwurf ohne Titel ist genau der leere Zustand, den
 * „Neue Aktion" aufmacht. Wer nichts getippt hat, hat nichts zu verlieren.
 */
export function istNeuerEntwurfLeer(entwurf: AktionsEntwurf): boolean {
  return entwurf.titel.trim() === ''
}
