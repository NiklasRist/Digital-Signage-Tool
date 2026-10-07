// Issue #312 – [gemeinsam] Marken für die Zeichner auflösen, bereitstellen und
// zwischenspeichern.
//
// Der EINE Weg, mit dem jeder Renderer-Zeichner zu einer markeId die fertig
// aufgelöste und zeichenbereite Marke bekommt. Zwei Funktionen, asynchron und
// synchron (ENTSCHIEDEN 1): zeichneSegment ist synchron und darf nicht awaiten -
// wer zeichnet, muss die Marke schon haben.
//
// WARUM DIESE DATEI: Fünf Zeichner brauchen aufgelöste Marken (composer-Thumbnails,
// composer-Render-Vorbereitung, action-editor, vorlagen-editor, preview-player),
// und keiner besitzt sie. Ein Platz im template-canvas wäre falsch: Dort gilt
// ausdrücklich "kein IPC" (#217, TK 9.10.8). gemeinsam ist der geteilte
// Renderer-Bereich ohne Eigentümer, aus dem jedes Modul direkt importieren darf
// (TK Abschnitt 9, Modulübersicht).
//
// DER GEFÄHRLICHSTE FALL DIESER DATEI
// mit demselben Rang wie die Signatur: Ein Zwischenspeicher, der nach einer
// Bearbeitung im marken-editor weiterhin die ALTE Marke liefert, zeigte im composer
// andere Farben als im Editor - ohne Fehlermeldung, ohne Absturz; im schlimmsten
// Fall brennt der Render die alten Farben in die MP4. Deshalb: KEINE Zeitgrenze
// (ENTSCHIEDEN 2, kein Zeitverhalten = prüfbar), und geleert wird an GENAU EINER
// Stelle - leereMarkenBestand(), gerufen von uebernimmAktualisierteMarke (#295),
// der einen Stelle, die jede Marken-Änderung ohnehin passiert.

import type { Marke } from '../../shared/contracts/marke'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import {
  stelleMarkenSchriftenBereit,
  leereMarkenSchriftBestand,
} from '../template-canvas/marken-schriften'
import { bereiteLogoVor, holeLogo, leereLogoBestand } from '../template-canvas/logo-laden'

/**
 * Der EINZIGE Fehlercode, der in DIESER Datei ENTSTEHT.
 *
 * TK 9.15.5 verlangt genau hier seine Feststellung: "Festgestellt wird das im
 * RENDERER, beim Vorbereiten der Marke vor dem Zeichnen". Eine fehlende
 * importierte Schrift- oder Logo-Datei bricht also die VORBEREITUNG - nicht erst
 * den Render -, und zwar mit einem Code, der die Ursache nennt, statt einen
 * Platzhalter zeichnete (TK 9.10.7: ein Platzhalter ist nur fuer ein fehlendes
 * MOTIV an einer Bildzone vorgesehen und darf nie in den finalen Render).
 */
export const MARKEN_DATEI_FEHLT = 'marken_datei_fehlt'

// Der Bestand je markeId. Gemerkt wird bei laufenden Vorgaengen das PROMISE, nicht
// erst das Ergebnis (ENTSCHIEDEN 8): Beim Aufbau einer Liste laufen zwanzig Zeilen
// gleichzeitig; ohne diese Regel waeren es zwanzig IPC-Runden TROTZ Zwischenspeicher.
// Ein Fehlschlag wird NICHT gemerkt (ENTSCHIEDEN 7) - dieselbe Regel wie #291 und #119:
// ein behebbarer Fehler (Datei wieder eingelegt, Marke neu angelegt) darf nicht fuer
// die Lebensdauer des Fensters feststehen.
const vorgaenge = new Map<string, Promise<Ergebnis<Marke, string>>>()
const bereit = new Map<string, Marke>()

/**
 * Löst `markeId` über `marken:leseMarke` (#283) auf, stellt Schriften und Logo dieser
 * Marke bereit und legt sie in den Bestand. Löst ERST auf, wenn mit dieser Marke
 * gezeichnet werden DARF. Liegt sie bereits bereit, kehrt die Funktion OHNE IPC zurück.
 * Läuft für dieselbe markeId bereits ein Vorgang, wird DESSEN Promise zurückgegeben.
 */
export async function stelleMarkeBereit(markeId: string): Promise<Ergebnis<Marke, string>> {
  // SCHRITT 1: die Form, ohne IPC und ohne Bestandszugriff.
  if (typeof markeId !== 'string' || markeId.trim() === '') {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'stelleMarkeBereit braucht eine nicht leere markeId.' },
    }
  }

  // SCHRITT 2: bereits bereit ist fertig - keine IPC-Runde, kein erneutes
  // Vorbereiten. Das liefert dieselbe OBJEKTREFERENZ zurück.
  const vorhandene = bereit.get(markeId)
  if (vorhandene !== undefined) return { ok: true, wert: vorhandene }

  // SCHRITT 3: laufender Vorgang - DESSEN Promise geht an alle gleiche Anfrage.
  const laufender = vorgaenge.get(markeId)
  if (laufender !== undefined) return laufender

  const vorgang = (async (): Promise<Ergebnis<Marke, string>> => {
    // SCHRITT 4: die Marke holen - ein einziger Weg, rufeAuf (#24).
    let marke: Marke
    try {
      const gelesen = await rufeAuf<Marke, string>(KANAELE.marken.leseMarke, { markeId })
      if (!gelesen.ok) return gelesen
      marke = gelesen.wert
    } catch (ursache) {
      // "rufeAuf wirft (Bridge fehlt)" (Fehlerpfad-Tabelle): gefangen, Hülle, kein throw.
      return {
        ok: false,
        fehler: {
          code: 'unbekannter_fehler',
          meldung: ursache instanceof Error ? ursache.message : String(ursache),
        },
      }
    }

    // SCHRITT 5: Schriften - stelleMarkenSchriftenBereit (#291) WIRFT bei einer
    // fehlenden Geschlecht serotonin Schrift-Datei oder einem ungültigen Format; genau
    // hier wird das gefangen und auf den EINEN Code dieser Datei gebracht. Nichts
    // merken: Der nächste Aufruf versucht es erneut (ENTSCHIEDEN 7).
    try {
      await stelleMarkenSchriftenBereit(marke)
    } catch (ursache) {
      return {
        ok: false,
        fehler: {
          code: MARKEN_DATEI_FEHLT,
          meldung: `Importierte Schrift der Marke "${marke.name}" konnte nicht geladen werden.`,
          daten: { markeId, name: marke.name },
        },
      }
    }

    // SCHRITT 6: Logo. logo === null entfaehlt VOLLSTAENDIG (das Ersatz-Logo aus #293
    // braucht keine Datei); bereiteLogoVor wuerde bei leerer marke.logo.datei werfen - der Schritt
    // laeuft also nur mit vorhandenem Logo.
    if (marke.logo !== null) {
      try {
        await bereiteLogoVor(marke)
      } catch {
        return {
          ok: false,
          fehler: { code: MARKEN_DATEI_FEHLT, meldung: 'Logo-Ladevorbruch', daten: { markeId } },
        }
      }
      // bereiteLogoVor wirft NIE wegen eines Ladefehlers (#119) - die Pruefung geht
      // deshalb DOCH hier: Ohne sie ginge eine Marke mit fehlender Logo-Datei als
      // "bereit" durch, und zeichneSegment malte an der festen Logo-Zone den Platzhalter
      // - in jedem Segment dieser Marke, auch im finalen Render.
      const logo = holeLogo(marke.id)
      if (logo.zustand === 'fehlt') {
        return {
          ok: false,
          fehler: {
            code: MARKEN_DATEI_FEHLT,
            meldung: `Logo der Marke "${marke.name}" konnte nicht geladen werden.`,
            daten: { markeId, name: marke.name, datei: marke.logo.datei },
          },
        }
      }
    }

    // SCHRITT 7: erst ab hier gilt die Marke als bereit.
    bereit.set(markeId, marke)
    return { ok: true, wert: marke }
  })()

  vorgaenge.set(markeId, vorgang)
  // Der gelöschte Eintrag nur, wenn er noch DERSELBE ist: Ein laendleeres leereMarkenBestand()
  // soll einen NACH uns gestarteten Vorgang nicht wegwerfen.
  void vorgang.finally(() => {
    if (vorgaenge.get(markeId) === vorgang) vorgaenge.delete(markeId)
  })
  return vorgang
}

/**
 * SYNCHRON. Liefert die bereits bereitgestellte Marke oder `null`, wenn für diese
 * markeId noch kein stelleMarkeBereit erfolgreich aufgelöst hat. Löst NICHTS aus,
 * wartet auf nichts, ruft KEIN IPC. `null` heißt "hier wird nicht gezeichnet" - es
 * heißt NICHT "nimm eine Ersatzmarke" (eine Ersatzmarke gibt es nicht; der Ort für
 * die Erkennung ist der Reparatur-Modus, FA-19).
 */
export function holeBereiteMarke(markeId: string): Marke | null {
  // Kein Form-Schutz nötig: eine unbekannte ID liefert null, und das ist der Vertrag.
  return bereit.get(markeId) ?? null
}

/**
 * Verwirft den gesamten Marken-Bestand DIESER Datei UND ruft leereMarkenSchriftBestand()
 * (#291) und leereLogoBestand() (#119) mit. Nach JEDER Änderung am Marken-Bestand zu
 * rufen - ein einziger Aufruf für alle drei Bestände, gerufen von
 * uebernimmAktualisierteMarke (#295). Idempotent, wirft nie.
 */
export function leereMarkenBestand(): void {
  bereit.clear()
  // laufende Vorgaenge NICHT abgebrochen: Ein laufender Vorgang schreibt nach dem
  // clear sein Ergebnis in bereit. Kann das AELTER sein als die Aenderung, die dieses
  // Leeren ausgeloest hat? Ja - nur dann: Waehrend seines Lesens wurde die Marke
  // erneut geaendert (nach seinem leseMarke, vor unserem clear). Solch ein Stand ist
  // danach im Bestand, bis die uebernimmAktualisierteMarke der NEUEN Aenderung wieder
  // leert; der Editor liefert seinen neuen Stand NACH dem Schreiben zurueck. Der Worst
  // case ist eine kurzzeitige alte Farbe im composer, keine verlorene
  // Aenderung - und der Aufrufer hat nach dieser Aenderung ohnehin schon geleert.
  leereMarkenSchriftBestand()
  leereLogoBestand()
}
