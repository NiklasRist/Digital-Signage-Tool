// Issue #295 - [marken-editor] Grundgeruest des Editors: die gemeinsame
// Datenbasis (Marken-Liste, Anlegen und geoeffnete Marke).
//
// DIESE DATEI IST DER EINGANG DES GESAMTEN EDITORS: #296 (Farben), #297 (Schriften),
// #298 (Logo), #299 (geerbt/eigen), #307 (Slogan) und #308 (Sicherheitsabstand)
// arbeiten alle auf der Marke, die HIER geladen und gehalten wird, und melden ihre
// Aenderungen ueber uebernimmAktualisierteMarke an DIESELBEN Ort zurueck. #300
// (ableiten) bearbeitet die geoeffnete Marke NICHT - es erzeugt eine NEUE und oeffnet
// sie ueber oeffneMarke; deshalb importiert es uebernimmAktualisierteMarke ausdruecklich
// nicht (#300, ENTSCHIEDEN 3).
//
// Zwei stille Auspraegungen, wenn das hier schiefgeht: (1) zwei Wahrheiten ueber
// dieselbe Marke - jede Unterdatei mit eigener Kopie zeigte nach einem Schriftwechsel
// noch den alten Zustand, und ein Speicherfehler in #297 bliebe fuer #296 unsichtbar;
// (2) die Eingebaute-Marke-Sperre (Marke.eingebaut, Marke.parent) waere auf der
// Oberflaeche nicht ablesbar, bevor die Abweichung am Store abbricht.
//
// WARUM KEIN ARBEITSKOPIE-MECHANISMUS wie im vorlagen-editor: TK 9.15.1 kennt fuer
// Marken kein oeffneZurBearbeitung/speichereArbeitskopie-Paar - bearbeiteMarke
// schreibt DIREKT, entprellt, sichtbar ueber den eigenen Auto-Speichern-Kanal
// (#278). "Kein Undo fuer den Marken-Bestand" (TK 9.15.2) ist eine bewusste
// TK-Entscheidung; hier entsteht deshalb bewusst KEIN Arbeitskopie-Paar nach.
// Gegen den .bak-Schutz des Stores ist das abgesichert (TK 9.15.2).
//
// DER ABLAUF VON erstelleEigenstaendigeMarke ist verbindlich und hat GENAU VIER Schritte
// (ENTSCHIEDEN 6, siehe unten): pruefen -> anlegen mit AUSGESCHRIEBENER parentId: null (#304 verlangt
// das Feld VORHANDEN, ein fehlendes Feld waere ein abgewiesener Aufruf) -> oeffnen ->
// nachladen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { leereMarkenBestand } from '../gemeinsam/marken-bereitstellung' // #312

/** Alle Marken, wie der Store sie liefert - aufgeloest, in Bestandsreihenfolge, NICHT sortiert. */
export interface MarkenUebersicht {
  marken: readonly Marke[]
}

// Der Bestand dieser Datei: die eine Liste und die eine geoeffnete Marke. Beide
// werden NUR von den beiden Ladefunktionen gesetzt - kein zweiter Setzweg (ENTSCHIEDEN 3).
let gezogene = null as MarkenUebersicht | null
let geoeffnete = null as Marke | null
const uebersichtHoerer = new Set<(u: MarkenUebersicht) => void>()
const geoeffnetHoerer = new Set<(m: Marke | null) => void>()

/**
 * Laedt den vollstaendigen Markenbestand neu und macht ihn zur gemeinsamen Sicht.
 * Bei Erfolg: Sicht setzen, DANACH die Hoerer melden (DoD-Reihenfolge). Bei Misserfolg:
 * die bisherige Sicht bleibt UNVERAENDERT stehen, kein Hoerer laeuft an - ein Ladefehler
 * leert die Liste nicht still.
 */
export async function ladeUebersicht(): Promise<Ergebnis<MarkenUebersicht, string>> {
  const antwort = await rufeAuf<Marke[], string>(KANAELE.marken.listeMarken)
  if (!antwort.ok) return antwort
  // Die Reihenfolge der Liste UEbernimmt bestandsgetreu, rueckgabengleich. Kein Sortieren
  // (ENTSCHIEDEN 5): Eine Sortierung hier waere eine zweite, unsichtbare Ordnung.
  gezogene = { marken: [...antwort.wert] }
  for (const hoerer of [...uebersichtHoerer]) hoerer(gezogene)
  return { ok: true, wert: gezogene }
}

/** Momentaufnahme der Sicht; null, solange nie geladen wurde. Wird NIE verändert. */
export function holeUebersicht(): MarkenUebersicht | null {
  return gezogene
}

/** Abonnement fuer Aenderungen der Uebersicht; Rueckgabewert ist die Abmelde-Funktion. */
export function aufUebersichtGeaendert(hoerer: (u: MarkenUebersicht) => void): () => void {
  uebersichtHoerer.add(hoerer)
  return () => {
    uebersichtHoerer.delete(hoerer)
  }
}

/**
 * Oeffnet markeId zur Bearbeitung: holt die aufgeloeste Marke (IMMER ueber marken:leseMarke,
 * NIE aus der bereits geladenen Liste, ENTSCHIEDEN 3) und macht sie zur geoeffneten Marke.
 */
export async function oeffneMarke(markeId: string): Promise<Ergebnis<Marke, string>> {
  // Form vor IPC: Der Fehler liegt hier, nicht erst am Store.
  if (typeof markeId !== 'string' || markeId.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'oeffneMarke braucht eine nicht leere markeId.',
      },
    }
  }
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.leseMarke, { markeId })
  if (!antwort.ok) return antwort
  // Die geoeffnete Marke wird NUR hier gesetzt; keine leere/Platzhalter-Marke bei Fehler.
  geoeffnete = antwort.wert
  for (const hoerer of [...geoeffnetHoerer]) hoerer(geoeffnete)
  return { ok: true, wert: geoeffnete }
}

/** Momentaufnahme der geoeffneten Marke; null, solange keine offen ist. Wird NIE verändert. */
export function holeGeoeffneteMarke(): Marke | null {
  return geoeffnete
}

/** Abonnement fuer Aenderungen der geoeffneten Marke; Rueckgabewert ist die Abmelde-Funktion. */
export function aufGeoeffneteMarkeGeaendert(hoerer: (m: Marke | null) => void): () => void {
  geoeffnetHoerer.add(hoerer)
  return () => {
    geoeffnetHoerer.delete(hoerer)
  }
}

/**
 * Legt eine NEUE EIGENSTANDIGE Marke an (`erstelleMarke` mit `parentId: null`, #284),
 * oeffnet sie zur Bearbeitung und laedt danach die Uebersicht neu, damit sie in der Liste
 * erscheint.
 *
 * ABGRENZUNG ZU #300: das ANLEGEN (ohne Basis). Das ABLEITEN (mit Basis) ist
 * leiteMarkeAb(name, parentId) in marke-ableiten.ts (#300) - dieselbe Store-Operation, eine
 * andere Handlung. Diese Funktion ruft erstelleMarke AUSSCHLIESSLICH mit parentId: null,
 * nimmt keine parentId entgegen und importiert marke-ableiten.ts NICHT.
 *
 * Verbindlicher Ablauf (ENTSCHIEDEN 6, genau vier Schritte):
 *   1. name praefen (String, nach trim() nicht leer) -> ungueltige_eingabe OHNE IPC.
 *   2. rufeAuf(erstelleMarke, { name, parentId: null }) - das Feld parentId ist
 *      VORHANDEN im gesendeten Objekt (#304-Prueftabelle: "fehlendes Feld -> ungueltige_eingabe").
 *   3. Bei Erfolg oeffneMarke(neueMarke.id) - die EINZIGE Setzstelle der geoeffneten
 *      Marke; KEIN zweiter Setzweg (nicht die zurueckgegebene Marke direkt einsetzen).
 *   4. ladeUebersicht() - IMMER, auch wenn Schritt 3 gescheitert ist (ENTSCHIEDEN 8):
 *      Die Marke ist jedenfalls bereits angelegt und muss in der Liste erscheinen.
 *
 * Welche Werte die neue Marke traegt, entscheidet #284 (sechs Wertfelder als tiefe Kopie
 * der eingebauten Marke, logo: null, herkunftJeFeld.logo "keins") - NICHT diese Datei:
 * nichts gesetzt, nichts geprueft und nichts ergaenzt.
 */
export async function erstelleEigenstaendigeMarke(name: string): Promise<Ergebnis<Marke, string>> {
  // SCHRITT 1: nur die Leere - kein trim() im GESENDETEN Wert, keine Laengen-Grenze
  // (ENTSCHIEDEN 7): die Fachpruefung ist Sache von #284.
  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'erstelleEigenstaendigeMarke braucht einen nicht leeren name.',
      },
    }
  }
  // SCHRITT 2: parentId AUSGESCHRIEBEN mitgesendet, auch wenn null - das Entfernen des
  // Feldes waere ein abgewiesener Aufruf (#304).
  const angelegt = await rufeAuf<Marke, string>(KANAELE.marken.erstelleMarke, {
    name,
    parentId: null,
  })
  if (!angelegt.ok) return angelegt
  // SCHRITT 3: oeffnen (die einzige Setzstelle; ein Fehler reist unverändert).
  const geoeffnetErgebnis = await oeffneMarke(angelegt.wert.id)
  // SCHRITT 4: IMMER nachladen - auch nach einem gescheiterten Oeffnen (die Marke
  // ist bereits angelegt). Ein Scheitern von ladeUebersicht laesst den Rueckgabewert
  // unveraendert bei dem von oeffneMarke (ein Anzeige-Rueckstand ist kein gescheitertes Anlegen).
  await ladeUebersicht()
  return geoeffnetErgebnis
}

/**
 * Uebernimm eine von den Bearbeitungs-Operationen erfolgreich geschriebene Marke in die
 * gemeinsame Sicht: die geoeffnete Marke wird SOFORT und synchron aktualisiert (falls
 * marke.id ihr entspricht), danach stoesst der Weg die gesamte Liste neu an (ENTSCHIEDEN 2).
 * NIE mit einer fremden Marke gerufen, deren id nicht offen ist - das besorgt oeffneMarke.
 *
 * NIMMT NICHT: #300 (leiteMarkeAb). Die Bearbeitungsoperationen aendern die bereits
 * geoeffnete Marke und liefern ihren neuen Stand zurueck - fuer sie passt "uebernimm die
 * aktualisierte Marke". #300 erzeugt eine NEUE Marke; die geht ueber oeffneMarke, nicht
 * hier, und #300 importiert diese Funktion deshalb NICHT.
 *
 * RUFT AUSSERDEM leereMarkenBestand() (#312) - die EINE Stelle, die jede Marken-Aenderung
 * ohnehin passiert und damit der einzige Ort, an dem der Zwischenspeicher der Zeichner
 * ungueltig wird. Ohne diesen Ruf zeigten composer, preview-player und vorlagen-editor
 * nach einer Bearbeitung die ALTEN Farben, waehrend der Editor daneben die neuen zeigt.
 * leereMarkenBestand leert zugleich die Schrift- und Logo-Bestaende (#291, #119): drei
 * einzelne Rufe waeren drei Gelegenheiten, einen zu vergessen.
 */
export function uebernimmAktualisierteMarke(marke: Marke): void {
  // SOFORT, synchron: ein Fehler des Nachladens (unten) darf die geoeffnete Marke nicht
  // rueckrollen. Passt die id NICHT, bleibt die geoeffnete Marke unveraendert (Fehlerpfad);
  // die Liste wird trotzdem nachgeladen.
  if (geoeffnete !== null && geoeffnete.id === marke.id) {
    geoeffnete = marke
    for (const hoerer of [...geoeffnetHoerer]) hoerer(geoeffnete)
  }
  // Der EINE Ungueltigkeitsweg fuer alle drei Zeichner-Bestaende (#312).
  leereMarkenBestand()
  // Das Nachladen ist dem Fehler hingegeben: schlaegt es fehl, bleibt die Listen-Sicht auf
  // dem letzten guten Stand (wie beim ersten Ladefehler). Der Rueckgabewert ist void -
  // auch hier entsteht kein zweiter Fehlerweg.
  void ladeUebersicht()
}
