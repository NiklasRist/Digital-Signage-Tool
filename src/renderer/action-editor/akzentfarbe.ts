// [action-editor] Akzentfarbe wählen – feste Auswahl aus der Markenpalette
//
// UMGESTELLT durch Issue #318 (FA-24, TK v3.4): Die Akzentfarbe ist ein FREIER
// Hex-Wert, kein Rollenname. Die alte Fassung (akzentAuswahl, istAkzentRolle,
// AKZENT_STANDARD = 'akzent') ist ERSATZLOS gestrichen - kein Alias, kein
// @deprecated-Wrapper, keine auskommentierte Zeile "fuer spaeter".
//   - GESPEICHERT wird der WERT der gewaehlten Palette-Rolle, nie ihr Name: Ein
//     Rollenname kaeme im Zeichenpfad als unbrauchbare Farbe an und wuerde dort
//     werfen (loeseFarbe #112 nimmt den Wert, wie er in der Aktion steht).
//   - Aktion.akzentfarbe bekommt NIE einen Rollennamen - die Umkehrung des alten
//     Verbots gilt ab hier in dieser Richtung.
//   - Keine Warn-Rechnung aus dem gemeinsamen Modul in dieser Datei (die Warnung
//     ist #325/#292 zugeordnet); kein Farb-Literal - die Hex-Werte kommen zur
//     Laufzeit aus marke.farben.
//   - Kein zweiter Schreibweg: akzentfarbe wird AUSSCHLIESSLICH ueber
//     speichereAktion (#136) gesetzt.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FarbRolle, Marke } from '../../shared/contracts/marke'

import { speichereAktion } from './aktion-bearbeiten'

/**
 * Die drei Akzent-Rollen, die eine gesetzte `akzentfarbe` beim Zeichnen ERSETZT (TK 9.10.9).
 * Hier NUR Vorschlagsquelle fuer das Farbfeld - NICHT mehr die Menge der speicherbaren Werte.
 *
 * Die Liste bleibt Teilmenge von `FarbRolle`: Ein Tippfehler in einem der drei Namen
 * wuerde sonst `marke.farben[rolle] === undefined` liefern und einen leeren Vorschlag
 * ohne Fehlermeldung erzeugen.
 */
export const AKZENT_ROLLEN = ['akzent', 'akzentKraeftig', 'akzentTief'] as const satisfies readonly FarbRolle[]
export type AkzentRolle = (typeof AKZENT_ROLLEN)[number]

/**
 * Die Vorschlaege der Markenpalette: `rolle` beschriftet den Knopf, `hex` ist der Wert,
 * der beim Anklicken GESPEICHERT wird. Ersetzt `akzentAuswahl` (entschieden in #318, 3).
 */
export function akzentVorschlaege(marke: Marke): Array<{ rolle: AkzentRolle; hex: string }> {
  return AKZENT_ROLLEN.map((rolle) => ({ rolle, hex: marke.farben[rolle] }))
}

/**
 * Ist `wert` ein speicherbarer Akzentfarbwert? Genau `#` + SECHS Hex-Ziffern,
 * Gross-/Kleinschreibung gleichgueltig. Achtstellige Werte (#RRGGBBAA) sind hier
 * NICHT speicherbar - #292 (#301) ist die melde Bare Frage dazu, nicht hier
 * entschieden; abgelehnt wird also still im Formular, nicht still im Datenbestand.
 */
export function istAkzentfarbe(wert: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(wert)
}

/** Vorbelegung einer NEUEN Aktion: keine eigene Akzentfarbe, es gilt der Markenwert (TK 9.10.9). */
export const AKZENT_STANDARD: string | null = null

/**
 * Setzt `akzentfarbe` auf einen freien Hex-Wert oder auf `null`. Schreibt ueber #136.
 *
 * `null` wird GESSENDET, nicht ausgelassen und nicht ersetzt: "keine eigene Farbe,
 * der Markenwert gilt" ist ein zugesagter Zustand, kein Leerstand.
 */
export async function setzeAkzentfarbe(
  aktionId: string,
  farbe: string | null,
): Promise<Ergebnis<Aktion>> {
  if (farbe !== null && !istAkzentfarbe(farbe)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `akzentfarbe: "${farbe}" ist kein gültiger Hex-Wert (#RRGGBB). Der Wert wurde nicht gespeichert.`,
      },
    }
  }
  return speichereAktion(aktionId, { akzentfarbe: farbe })
}
