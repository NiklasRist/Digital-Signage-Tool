// [shared] Die Regeln der Zonen-Gestaltung – EINE Quelle fuer Main, Editor und Zeichnen
//
// WARUM ES DIESE DATEI GIBT (05.11.2026): Ein Nutzer kann seit dieser Sitzung die FARBE,
// die GROESSE und die AUSRICHTUNG einer einzelnen Zone ueberschreiben sowie den
// Bildausschnitt (Zoom/Position) einstellen. Diese Werte kommen aus einem Formular, gehen
// ueber IPC in `project.json` und werden beim Zeichnen gelesen – drei Stellen, die
// dieselben Grenzen kennen muessen. Eine zweite Zahlenliste im Formular waere beim
// naechsten Umbau still falsch, und ein Wert, den das Formular erlaubt und der Speicher
// kappt, waere eine stille Datenloeschung.
//
// KEIN CANVAS, KEIN DOM, KEIN NODE, KEIN IPC: ausschliesslich Zeichenketten und Zahlen.
// Damit ist die Datei ohne Browser pruefbar (`tests/unit/gestaltung.spec.ts`).
//
// DIE GRUNDREGEL: Fehlt ein Wert oder ist er unbrauchbar, gilt die VORLAGE. Es gibt
// keinen Ersatzwert „irgendwas Dunkles" – dieselbe Haltung wie in `farben.ts`.

import type { BildAusschnitt, ScrimGestaltung, ZonenGestaltung } from './contracts/aktion'
import type { SchriftRolle } from './contracts/marke'
import type { Zone } from './contracts/vorlage'

/**
 * Die Grenzen der Regler. Sie stehen hier und NICHT im Formular:
 *
 * - `groesseProzent` 50–200: Unter 50 % ist keine Textzeile der Vorlagen mehr lesbar,
 *   ueber 200 % laeuft jede Ueberschrift aus ihrem Rahmen (die Kaskade kuerzt dann nur
 *   noch, statt zu gestalten).
 * - `zoom` 100–300: Unter 100 % waere das Bild kleiner als die Zone – dann entstuende
 *   ein Rand, den die Vorlage nicht vorsieht. Ueber 300 % ist vom Motiv nichts mehr zu
 *   erkennen.
 * - `versatz` -50…+50 (Prozent der Zonengroesse): Bei 50 steht die Bildkante in der
 *   Zonenmitte; mehr waere ein leerer Rand.
 */
export const GESTALTUNG_GRENZEN = {
  groesseProzent: { min: 50, max: 200 },
  zoom: { min: 100, max: 300 },
  versatz: { min: -50, max: 50 },
  // Die Deckkraft eines Scrim-Stopps (05.11.2026): 0 = unsichtbar, 100 = deckend.
  // Mehr als 100 gibt es nicht; ein Wert darunter ist eine bewusste Entscheidung.
  deckkraft: { min: 0, max: 100 },
} as const

/**
 * Die beiden Rollen der Abdunkelung (TK 9.11.1). Sie stehen als WERTE hier, weil die
 * Zuordnung „erster/zweiter Stopp" an genau diesen zwei Namen haengt: `scrimStart` ist
 * der Anfang des Verlaufs, `scrimEnde` das Ende. Eine Ableitung ueber den Namensanfang
 * waere eine Liste, die beim naechsten Rollen-Namen still falsch liegt.
 */
export const SCRIM_ROLLEN = ['scrimStart', 'scrimEnde'] as const

/** Ist `rolle` eine der beiden Scrim-Rollen? `unknown`-Eingang: der Wert kommt aus JSON. */
export function istScrimRolle(rolle: unknown): rolle is (typeof SCRIM_ROLLEN)[number] {
  return SCRIM_ROLLEN.some((bekannt) => bekannt === rolle)
}

/**
 * Traegt diese Zone eine Abdunkelung? Gefragt wird die VORLAGE, nicht eine Liste im
 * Editor: Ein Verlauf mit einer Scrim-Rolle oder eine Fuellung mit `scrimStart`/`scrimEnde`
 * ist eine Abdunkelung. Ein gewoehnlicher Verlauf (z. B. Akzent -> Akzent tief) ist keine
 * und bekommt deshalb keine Deckkraft-Regler.
 */
export function istScrimZone(zone: Zone): boolean {
  const verlauf = zone.deko?.verlauf
  if (verlauf !== undefined) {
    return istScrimRolle(verlauf.vonFarbRolle) || istScrimRolle(verlauf.bisFarbRolle)
  }
  return istScrimRolle(zone.deko?.füllungFarbRolle)
}

/**
 * Die Deckkraft eines Hex-Werts in Prozent (0–100). Sechsstellig heisst „deckend" (100).
 * Unbrauchbare Werte liefern `null` – der Aufrufer zeigt dann keine erfundene Zahl.
 *
 * WARUM HIER UND NICHT IM EDITOR: Dieselbe Umrechnung entscheidet im Zeichenweg, ob ein
 * Regler ueberhaupt etwas aendert, und im Formular, welchen Wert er anzeigt. Zwei
 * Rundungen waeren zwei Wahrheiten (70 % -> 179 vs. 178 Byte).
 */
export function hexDeckkraftProzent(hex: string): number | null {
  if (!/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) return null
  if (hex.length === 7) return 100
  return Math.round((parseInt(hex.slice(7, 9), 16) / 255) * 100)
}

/**
 * Die vier Schrift-Rollen der Marke (TK 9.11.2). Sie stehen hier als WERTE und nicht nur
 * als Typ, weil `project.json` von Hand editierbar ist: Eine erfundene Rolle muss beim
 * Laden auffallen und nicht erst beim Zeichnen.
 */
export const SCHRIFT_ROLLEN = [
  'headlineElegant',
  'headlinePlakativ',
  'fliesstext',
  'fliesstextFett',
] as const satisfies readonly SchriftRolle[]

/** Ist `wert` eine der vier Schrift-Rollen? `unknown`-Eingang: der Wert kommt aus JSON. */
export function istSchriftRolle(wert: unknown): wert is SchriftRolle {
  return SCHRIFT_ROLLEN.some((rolle) => rolle === wert)
}

/**
 * Ist `wert` ein Farbwert, den die Aktion tragen darf? Genau `#` + SECHS Hex-Ziffern.
 *
 * Sechsstellig, weil die Farbwahl im Editor ein `<input type="color">` ist und dieses
 * Element keinen Alpha-Wert kennt. Achtstellige Werte bleiben den Marken-Rollen
 * vorbehalten (Scrim) – dort kommen sie aus der Marke, nicht aus dem Formular.
 */
export function istHexFarbe(wert: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(wert)
}

/** Eine Zahl auf eine Spanne begrenzen. Unbrauchbare Eingaben liefern `null`. */
export function begrenzeZahl(wert: unknown, min: number, max: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  return Math.min(max, Math.max(min, Math.round(wert)))
}

/**
 * Der Faktor, mit dem eine Vorlagen-Groesse multipliziert wird.
 *
 * `1` heisst „die Vorlage gilt" – auch dann, wenn der gespeicherte Wert unbrauchbar ist.
 * Der Faktor ist auf die Reglergrenzen begrenzt: Ein von Hand auf 1000 gesetzter Wert in
 * `project.json` soll die Vorschau nicht sprengen.
 */
export function groessenFaktor(groesseProzent: unknown): number {
  const prozent = begrenzeZahl(
    groesseProzent,
    GESTALTUNG_GRENZEN.groesseProzent.min,
    GESTALTUNG_GRENZEN.groesseProzent.max,
  )
  return prozent === null ? 1 : prozent / 100
}

/**
 * Der Zoom-Faktor eines Bildausschnitts. `1` heisst „die Vorlage gilt".
 * Er kann NIE unter 1 liegen – kleiner als die Zone waere ein Rand, s. Grenzen oben.
 */
export function zoomFaktor(zoom: unknown): number {
  const prozent = begrenzeZahl(zoom, GESTALTUNG_GRENZEN.zoom.min, GESTALTUNG_GRENZEN.zoom.max)
  return prozent === null ? 1 : prozent / 100
}

/**
 * Der Versatz einer Bildzone in Prozent ihrer eigenen Groesse (0 heisst „mittig").
 * Unbrauchbare Werte werden zu 0 – die Mitte ist der Zustand, den jede Vorlage meint.
 */
export function versatzProzent(versatz: unknown): number {
  return (
    begrenzeZahl(versatz, GESTALTUNG_GRENZEN.versatz.min, GESTALTUNG_GRENZEN.versatz.max) ?? 0
  )
}

/**
 * Nur die Felder, die der Vertrag kennt – ein Fremdfeld aus einer aelteren Fassung
 * faellt weg. `null` heisst: keine brauchbare Angabe, die Zone bleibt unveraendert.
 */
function leseScrim(roh: unknown): ScrimGestaltung | null {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) return null
  // SAFETY: Die Zeile davor hat `roh` als nicht-null Objekt belegt; der Cast macht die
  // Felder als `unknown` LESBAR - jedes wird danach einzeln geprueft.
  const quelle = roh as Record<string, unknown>
  const ziel: ScrimGestaltung = {}

  if (typeof quelle.vonFarbe === 'string' && istHexFarbe(quelle.vonFarbe)) {
    ziel.vonFarbe = quelle.vonFarbe
  }
  if (typeof quelle.bisFarbe === 'string' && istHexFarbe(quelle.bisFarbe)) {
    ziel.bisFarbe = quelle.bisFarbe
  }
  const vonDeckkraft = begrenzeZahl(
    quelle.vonDeckkraft,
    GESTALTUNG_GRENZEN.deckkraft.min,
    GESTALTUNG_GRENZEN.deckkraft.max,
  )
  if (vonDeckkraft !== null) ziel.vonDeckkraft = vonDeckkraft
  const bisDeckkraft = begrenzeZahl(
    quelle.bisDeckkraft,
    GESTALTUNG_GRENZEN.deckkraft.min,
    GESTALTUNG_GRENZEN.deckkraft.max,
  )
  if (bisDeckkraft !== null) ziel.bisDeckkraft = bisDeckkraft

  return Object.keys(ziel).length === 0 ? null : ziel
}

/** Nur die Felder, die der Vertrag kennt – ein Fremdfeld aus einer aelteren Fassung faellt weg. */
function leseEineGestaltung(roh: unknown): ZonenGestaltung | null {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) return null
  // SAFETY: Die Zeile davor hat `roh` als nicht-null Objekt belegt; der Cast macht die
  // Felder als `unknown` LESBAR - jedes wird danach einzeln geprueft.
  const quelle = roh as Record<string, unknown>
  const ziel: ZonenGestaltung = {}

  if (typeof quelle.textfarbe === 'string' && istHexFarbe(quelle.textfarbe)) {
    ziel.textfarbe = quelle.textfarbe
  }
  if (typeof quelle.flaechefarbe === 'string' && istHexFarbe(quelle.flaechefarbe)) {
    ziel.flaechefarbe = quelle.flaechefarbe
  }
  const groesse = begrenzeZahl(
    quelle.groesseProzent,
    GESTALTUNG_GRENZEN.groesseProzent.min,
    GESTALTUNG_GRENZEN.groesseProzent.max,
  )
  if (groesse !== null) ziel.groesseProzent = groesse

  if (
    quelle.ausrichtung === 'links' ||
    quelle.ausrichtung === 'mitte' ||
    quelle.ausrichtung === 'rechts'
  ) {
    ziel.ausrichtung = quelle.ausrichtung
  }
  // Die Schrift ist ein ROLLEN-Verweis in die Marke, kein Font-Name (TK 9.11.1 Punkt 7).
  // Eine unbekannte Rolle faellt weg - sie wuerde beim Zeichnen werfen, und `zone-text`
  // zeichnet dann GAR NICHTS (keine Ersatzschrift, #114).
  if (istSchriftRolle(quelle.schriftRolle)) {
    ziel.schriftRolle = quelle.schriftRolle
  }
  // Die Abdunkelung ist ein eigener Block, weil sie ZWEI Stopps hat; ein flaches Feld
  // haette die Zuordnung „welcher Stopp?" nicht getragen (05.11.2026).
  const scrim = leseScrim(quelle.scrim)
  if (scrim !== null) ziel.scrim = scrim
  return ziel
}

/**
 * Macht aus einem beliebigen Wert eine benutzbare Zonen-Gestaltung.
 *
 * WAS HIER PASSIERT UND WARUM: `project.json` ist von Hand editierbar und ueberlebt
 * Fassungen. Ein unbrauchbarer Teil (kein Objekt, falsche Farbe, Zahl ausserhalb) wird
 * VERWORFEN, nicht ersetzt und nicht zum Fehler gemacht – dieselbe Regel wie bei
 * `brauchbareDauer` im project-store. Der Rest der Gestaltung bleibt erhalten: Eine
 * kaputte Groesse darf nicht auch noch eine heile Farbe mitnehmen.
 *
 * Die Zonen-Kennung ist der Schluessel. Sie wird NICHT geprueft (welche Zonen es gibt,
 * weiss allein die Vorlage); eine Gestaltung fuer eine Zone, die die aktuelle Vorlage
 * nicht hat, ist folgenlos und bleibt gespeichert – wer zurueckwechselt, findet sie wieder.
 */
export function normalisiereZonenGestaltung(roh: unknown): Record<string, ZonenGestaltung> {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) return {}
  const ergebnis: Record<string, ZonenGestaltung> = {}
  // SAFETY: `roh` ist oben als nicht-null Objekt belegt; Object.entries liefert die
  // Schluessel-Wert-Paare, deren WERT wieder geprueft wird.
  for (const [zonenId, wert] of Object.entries(roh as Record<string, unknown>)) {
    if (zonenId.length === 0) continue
    const gestaltung = leseEineGestaltung(wert)
    if (gestaltung !== null) ergebnis[zonenId] = gestaltung
  }
  return ergebnis
}

/**
 * Macht aus einem beliebigen Wert einen benutzbaren Bildausschnitt.
 * `null` heisst: keine eigene Einstellung, die Vorlage gilt (Zoom 1, Mitte).
 */
export function normalisiereBildAusschnitt(roh: unknown): BildAusschnitt | null {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) return null
  // SAFETY: Die Zeile davor hat `roh` als nicht-null Objekt belegt; jedes Feld wird
  // durch `begrenzeZahl` geprueft, bevor es uebernommen wird.
  const quelle = roh as Record<string, unknown>
  const zoom = begrenzeZahl(quelle.zoom, GESTALTUNG_GRENZEN.zoom.min, GESTALTUNG_GRENZEN.zoom.max)
  const versatzX = begrenzeZahl(quelle.versatzX, GESTALTUNG_GRENZEN.versatz.min, GESTALTUNG_GRENZEN.versatz.max)
  const versatzY = begrenzeZahl(quelle.versatzY, GESTALTUNG_GRENZEN.versatz.min, GESTALTUNG_GRENZEN.versatz.max)
  if (zoom === null && versatzX === null && versatzY === null) return null
  return {
    zoom: zoom ?? GESTALTUNG_GRENZEN.zoom.min,
    versatzX: versatzX ?? 0,
    versatzY: versatzY ?? 0,
  }
}

/** Eine stabile Textform – Schluessel sortiert, `undefined` wie `null`. */
function kanonisch(wert: unknown): string {
  if (wert === null || wert === undefined) return 'null'
  if (typeof wert !== 'object') return JSON.stringify(wert)
  if (Array.isArray(wert)) return `[${wert.map(kanonisch).join(',')}]`
  // SAFETY: Die Zeilen davor haben `wert` als nicht-null, nicht-Array Objekt belegt.
  const objekt = wert as Record<string, unknown>
  const teile = Object.keys(objekt)
    .sort()
    .map((schluessel) => `${JSON.stringify(schluessel)}:${kanonisch(objekt[schluessel])}`)
  return `{${teile.join(',')}}`
}

/**
 * „Keine Angabe" hat hier ZWEI Formen, und beide muessen gleich zaehlen: `undefined` (ein
 * altes Projekt kennt das Feld nicht) und ein leeres Objekt (der Editor hat alles
 * zurueckgesetzt). Ohne diese Angleichung meldete `unterschiede` bei jeder geoeffneten
 * Altaktion eine Aenderung und schriebe beim blossen Ansehen.
 */
function ohneLeere(roh: unknown): unknown {
  if (roh === null || roh === undefined) return null
  if (typeof roh !== 'object' || Array.isArray(roh)) return roh
  const teile: Record<string, unknown> = {}
  // SAFETY: `roh` ist oben als nicht-null, nicht-Array Objekt belegt; die Werte werden
  // einzeln geprueft, bevor sie in `teile` landen.
  for (const [schluessel, wert] of Object.entries(roh as Record<string, unknown>)) {
    if (wert === null || wert === undefined) continue
    if (
      typeof wert === 'object' &&
      !Array.isArray(wert) &&
      // SAFETY: `typeof wert === 'object'` und `!Array.isArray(wert)` stehen in den
      // Zeilen davor; `wert` ist hier ein Objekt, dessen Schluessel gezaehlt werden.
      Object.keys(wert as Record<string, unknown>).length === 0
    ) {
      continue
    }
    teile[schluessel] = wert
  }
  return Object.keys(teile).length === 0 ? null : teile
}

/**
 * Sind zwei Gestaltungen gleich? Gebraucht wird das in `aktions-entwurf.ts`: Der Entwurf
 * gegen den gespeicherten Stand zu vergleichen entscheidet, OB geschrieben wird. Ein
 * Referenzvergleich (`!==`) waere hier immer wahr und erzeugte bei jedem „Fertig" einen
 * Undo-Schritt fuer nichts.
 */
export function gleicheGestaltung(a: unknown, b: unknown): boolean {
  return kanonisch(ohneLeere(a)) === kanonisch(ohneLeere(b))
}
